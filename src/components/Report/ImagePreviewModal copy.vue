<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue.open" class="modal-overlay" @click.self="close">

        <!-- ─── TOP BAR ─── -->
        <div class="modal-topbar">
          <div class="modal-top-left">
            <div class="modal-item-name">{{ currentItem?.itemName ?? '' }}</div>
            <div v-if="total > 1" class="modal-counter">{{ currentIndex + 1 }} / {{ total }}</div>
          </div>
          <div class="modal-actions">
            <button class="action-btn" title="Rotate Kiri" @click="rotate(-90)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38"/>
              </svg>
            </button>
            <button class="action-btn" title="Rotate Kanan" @click="rotate(90)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
              </svg>
            </button>
            <button class="action-btn" title="Zoom Out" @click="zoomBy(-0.25)" :disabled="scale <= 0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M8 11h6"/>
              </svg>
            </button>
            <button class="action-btn zoom-label" @click="resetTransform">{{ Math.round(scale * 100) }}%</button>
            <button class="action-btn" title="Zoom In" @click="zoomBy(0.25)" :disabled="scale >= 5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/>
              </svg>
            </button>
           
          </div>
        </div>

        <!-- ─── MAIN AREA ─── -->
        <div class="modal-main">

          <!-- Nav Kiri -->
          <button
            v-if="total > 1"
            class="nav-btn nav-prev"
            :disabled="currentIndex === 0"
            @click.stop="navigate(-1)"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <!-- Image Area -->
          <div
            class="modal-image-area"
            ref="imageAreaRef"
            @wheel.prevent="onWheel"
            @mousedown="startDrag"
            @mousemove="onDrag"
            @mouseup="stopDrag"
            @mouseleave="stopDrag"
            @touchstart.prevent="onTouchStart"
            @touchmove.prevent="onTouchMove"
            @touchend="onTouchEnd"
          >
            <Transition :name="slideDir === 'left' ? 'slide-left' : 'slide-right'" mode="out-in">
              <img
                :key="currentItem?.url + '-' + currentIndex"
                ref="imgRef"
                :src="currentItem?.url"
                :alt="currentItem?.itemName ?? ''"
                class="modal-img"
                :style="imgStyle"
                @load="onImgLoad"
                draggable="false"
              >
            </Transition>
          </div>

          <!-- Nav Kanan -->
          <button
            v-if="total > 1"
            class="nav-btn nav-next"
            :disabled="currentIndex === total - 1"
            @click.stop="navigate(1)"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

        </div>

        <!-- ─── BOTTOM BAR ─── -->
        <div class="modal-bottombar" v-if="hasBottomInfo || shouldShowEstBtn">

          <!-- Tombol Tambah Estimasi — muncul kalau status bukan ok/normal/baik/good -->
          <Transition name="est-btn-fade">
            <button
              v-if="shouldShowEstBtn && isUnderReview "
              class="btn-add-est-modal"
              @click="emitAddEstimasi"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Tambah Estimasi untuk "{{ currentItem?.itemName }}"
            </button>
          </Transition>

          <!-- Status -->
          <div v-if="parsedStatuses.length" class="modal-status-row">
            <span class="info-label">Status:</span>
            <span v-for="(s, i) in parsedStatuses" :key="i">
              <span :style="{ color: statusColor(s) }" class="status-chip">{{ s }}</span>
              <span v-if="i < parsedStatuses.length - 1" class="sep">, </span>
            </span>
          </div>

          <!-- Extra Info chips -->
          <div v-if="currentItem?.extraInfo?.length" class="extra-info-row">
            <span v-for="info in currentItem.extraInfo" :key="info.label" class="extra-info-chip">
              <span class="extra-info-label">{{ info.label }}:</span>
              <span class="extra-info-value">{{ info.value }}</span>
            </span>
          </div>

          <!-- Note -->
          <div v-if="currentItem?.note" class="modal-note">
            <span class="info-label">📝 Catatan:</span>
            {{ currentItem.note }}
          </div>

          <!-- Caption -->
          <div v-if="currentItem?.caption && currentItem.caption !== currentItem.itemName" class="modal-caption-text">
            {{ currentItem.caption }}
          </div>

        </div>

        <!-- ─── THUMBNAIL STRIP ─── -->
        <div v-if="total > 1" class="thumb-strip" ref="thumbStripRef">
          <div
            v-for="(img, idx) in modelValue.images"
            :key="idx"
            class="thumb-item"
            :class="{ active: idx === currentIndex }"
            @click="goTo(idx)"
          >
            <img :src="img.url" :alt="img.itemName" class="thumb-img">
            <div class="thumb-name">{{ img.itemName }}</div>
          </div>
        </div>

         <!-- Tombol Kembali di bagian bawah -->
          <button class="btn-back-modal" @click="close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Kembali
          </button>
          
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { ModalState, ModalImageItem } from '../../types/inspectionReport'

const props = defineProps<{ 
  modelValue: ModalState,
  isUnderReview?: boolean 
 }>()
const emit  = defineEmits<{
  (e: 'update:modelValue', val: ModalState): void
  (e: 'add-estimasi', partName: string): void
}>()

const currentIndex  = ref(0)
const slideDir      = ref<'left' | 'right'>('left')
const thumbStripRef = ref<HTMLDivElement | null>(null)

const scale      = ref(1)
const rotation   = ref(0)
const translateX = ref(0)
const translateY = ref(0)

const dragging      = ref(false)
const lastX         = ref(0)
const lastY         = ref(0)
const touchStartX   = ref(0)
const touchStartY   = ref(0)
const isSwiping     = ref(false)
const lastPinchDist = ref<number | null>(null)

watch(() => props.modelValue.open, (val) => {
  if (val) {
    currentIndex.value = props.modelValue.currentIndex ?? 0
    resetTransform()
    nextTick(scrollThumbIntoView)
  }
})
watch(() => props.modelValue.currentIndex, (val) => {
  if (props.modelValue.open) currentIndex.value = val ?? 0
})

const total       = computed(() => props.modelValue.images?.length ?? 0)
const currentItem = computed<ModalImageItem | null>(() =>
  props.modelValue.images?.[currentIndex.value] ?? null
)

const parsedStatuses = computed<string[]>(() => {
  const s = currentItem.value?.status
  if (!s) return []
  if (Array.isArray(s)) return s.filter(Boolean)
  const t = String(s).trim()
  if (t.startsWith('[')) {
    try { const arr = JSON.parse(t); if (Array.isArray(arr)) return arr.filter(Boolean) } catch {}
  }
  return [t]
})

// Tampilkan tombol estimasi kalau ada status bukan ok/normal/baik/good
const okStatuses = ['ok', 'normal', 'baik', 'good', 'ada']
const shouldShowEstBtn = computed<boolean>(() => {
  if (!parsedStatuses.value.length) return false
  return parsedStatuses.value.some((s) => !okStatuses.includes(s.toLowerCase()))
})

function emitAddEstimasi() {
  const name = currentItem.value?.itemName ?? ''
  emit('add-estimasi', name)
  close()
}

const hasBottomInfo = computed(() =>
  parsedStatuses.value.length > 0 ||
  !!currentItem.value?.note ||
  !!(currentItem.value?.extraInfo?.length) ||
  (!!currentItem.value?.caption && currentItem.value.caption !== currentItem.value.itemName)
)

const imgStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) rotate(${rotation.value}deg) scale(${scale.value})`,
  transition: dragging.value ? 'none' : 'transform 0.15s ease',
  cursor: scale.value > 1 ? 'grab' : 'default',
}))

function navigate(dir: number) {
  const next = currentIndex.value + dir
  if (next < 0 || next >= total.value) return
  slideDir.value = dir > 0 ? 'left' : 'right'
  currentIndex.value = next
  resetTransform()
  nextTick(scrollThumbIntoView)
}
function goTo(idx: number) {
  if (idx === currentIndex.value) return
  slideDir.value = idx > currentIndex.value ? 'left' : 'right'
  currentIndex.value = idx
  resetTransform()
  nextTick(scrollThumbIntoView)
}
function scrollThumbIntoView() {
  if (!thumbStripRef.value) return
  const active = thumbStripRef.value.querySelector('.thumb-item.active') as HTMLElement | null
  active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
}

function onKeyDown(e: KeyboardEvent) {
  if (!props.modelValue.open) return
  if (e.key === 'ArrowLeft')  navigate(-1)
  if (e.key === 'ArrowRight') navigate(1)
  if (e.key === 'Escape')     close()
}
onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))

function close() { emit('update:modelValue', { ...props.modelValue, open: false }) }

function resetTransform() { scale.value=1; rotation.value=0; translateX.value=0; translateY.value=0 }
function onImgLoad() {}
function rotate(deg: number) { rotation.value = (rotation.value + deg + 360) % 360 }
function zoomBy(delta: number) {
  scale.value = Math.round(Math.min(5, Math.max(0.5, scale.value + delta)) * 100) / 100
  if (scale.value <= 1) { translateX.value=0; translateY.value=0 }
}
function onWheel(e: WheelEvent) { zoomBy(e.deltaY < 0 ? 0.1 : -0.1) }
function startDrag(e: MouseEvent) { if(scale.value<=1)return; dragging.value=true; lastX.value=e.clientX; lastY.value=e.clientY }
function onDrag(e: MouseEvent) { if(!dragging.value)return; translateX.value+=e.clientX-lastX.value; translateY.value+=e.clientY-lastY.value; lastX.value=e.clientX; lastY.value=e.clientY }
function stopDrag() { dragging.value=false }

function onTouchStart(e: TouchEvent) {
  const t0=e.touches[0]
  if(e.touches.length===2){lastPinchDist.value=getPinchDist(e);isSwiping.value=false}
  else if(e.touches.length===1&&t0){
    touchStartX.value=t0.clientX;touchStartY.value=t0.clientY
    if(scale.value>1){dragging.value=true;lastX.value=t0.clientX;lastY.value=t0.clientY}
    else{isSwiping.value=true}
  }
}
function onTouchMove(e: TouchEvent) {
  const t0=e.touches[0]
  if(e.touches.length===2&&lastPinchDist.value!==null){
    isSwiping.value=false
    const dist=getPinchDist(e)
    scale.value=Math.min(5,Math.max(0.5,scale.value*(dist/lastPinchDist.value)))
    lastPinchDist.value=dist
  } else if(e.touches.length===1&&dragging.value&&t0){
    translateX.value+=t0.clientX-lastX.value;translateY.value+=t0.clientY-lastY.value
    lastX.value=t0.clientX;lastY.value=t0.clientY
  }
}
function onTouchEnd(e: TouchEvent) {
  if(e.touches.length<2)lastPinchDist.value=null
  if(e.touches.length===0){
    dragging.value=false
    const ct=e.changedTouches[0]
    if(isSwiping.value&&scale.value<=1&&ct){
      const dx=ct.clientX-touchStartX.value,dy=Math.abs(ct.clientY-touchStartY.value)
      if(Math.abs(dx)>50&&dy<80)navigate(dx<0?1:-1)
    }
    isSwiping.value=false
  }
}
function getPinchDist(e: TouchEvent): number {
  const t0=e.touches[0],t1=e.touches[1]
  const dx=(t0?.clientX??0)-(t1?.clientX??0),dy=(t0?.clientY??0)-(t1?.clientY??0)
  return Math.sqrt(dx*dx+dy*dy)
}

function statusColor(s: string) {
  const sl=s.toLowerCase()
  if(['normal','ada','baik','good','ok'].includes(sl))return'#4dd0e1'
  if(['tidak normal','tidak ada','rusak','bad','not ok','repaired','gantian','repaint','renggang','baret penyok','tabrak','banjir'].includes(sl))return'#ef5350'
  return'#ffa726'
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(8,10,14,0.96);
  z-index: 9999;
  display: flex; flex-direction: column;
  overflow: hidden; user-select: none;
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.slide-left-enter-active, .slide-left-leave-active,
.slide-right-enter-active, .slide-right-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
  position: absolute;
}
.slide-left-enter-from  { opacity: 0; transform: translateX(52px) scale(0.97); }
.slide-left-leave-to    { opacity: 0; transform: translateX(-52px) scale(0.97); }
.slide-right-enter-from { opacity: 0; transform: translateX(-52px) scale(0.97); }
.slide-right-leave-to   { opacity: 0; transform: translateX(52px) scale(0.97); }

.modal-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 12px;
  background: rgba(255,255,255,0.04);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0; gap: 10px;
}
.modal-top-left { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
.modal-item-name { font-size: 14px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.modal-counter { font-size: 11px; color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.07); padding: 2px 7px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
.modal-actions { display: flex; align-items: center; gap: 3px; flex-shrink: 0; }
.action-btn {
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
  color: #fff; border-radius: 6px; width: 34px; height: 34px;
  cursor: pointer; transition: background 0.15s;
  font-size: 11px; font-weight: 600; flex-shrink: 0;
}
.action-btn:hover:not(:disabled) { background: rgba(255,255,255,0.18); }
.action-btn:disabled { opacity: 0.28; cursor: not-allowed; }
.zoom-label { min-width: 46px; width: auto; padding: 0 6px; font-size: 11px; }
.close-btn { background: rgba(220,53,69,0.15); border-color: rgba(220,53,69,0.3); margin-left: 4px; }
.close-btn:hover { background: rgba(220,53,69,0.42) !important; }

.modal-main { flex: 1; display: flex; align-items: center; min-height: 0; position: relative; }

.nav-btn {
  flex-shrink: 0; width: 46px; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none;
  color: rgba(255,255,255,0.6); cursor: pointer;
  transition: background 0.15s, color 0.15s; z-index: 2;
}
.nav-btn:hover:not(:disabled) { background: rgba(255,255,255,0.06); color: #fff; }
.nav-btn:disabled { opacity: 0.15; cursor: not-allowed; }

.modal-image-area {
  flex: 1; display: flex; align-items: center; justify-content: center;
  overflow: hidden; position: relative; height: 100%;
}
.modal-img {
  max-width: 100%; max-height: 100%;
  object-fit: contain; display: block;
  will-change: transform; border-radius: 2px;
}

.modal-bottombar {
  padding: 8px 16px 10px;
  background: rgba(255,255,255,0.04);
  border-top: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0; display: flex; flex-direction: column; gap: 6px;
}

/* Tombol tambah estimasi di dalam preview */
.btn-add-est-modal {
  display: flex; align-items: center; gap: 6px;
  width: 100%; padding: 9px 12px;
  background: rgba(229, 62, 62, 0.12);
  border: 1px solid rgba(229, 62, 62, 0.35);
  border-radius: 8px;
  color: #fc8181; font-size: 11px; font-weight: 600;
  cursor: pointer; text-align: left;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.btn-add-est-modal:active { background: rgba(229, 62, 62, 0.25); }

.est-btn-fade-enter-active { animation: estBtnIn 0.2s ease; }
.est-btn-fade-leave-active { animation: estBtnOut 0.15s ease forwards; }
@keyframes estBtnIn  { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@keyframes estBtnOut { from { opacity: 1; } to { opacity: 0; } }

.modal-status-row { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.info-label { font-size: 11px; color: rgba(255,255,255,0.42); font-weight: 500; flex-shrink: 0; }
.status-chip { font-size: 12px; font-weight: 600; }
.sep { color: rgba(255,255,255,0.3); font-size: 12px; }

.extra-info-row { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
.extra-info-chip {
  display: inline-flex; align-items: center; gap: 4px;
  background: rgba(13,152,216,0.12); border: 1px solid rgba(13,152,216,0.28);
  border-radius: 5px; padding: 3px 9px; font-size: 11.5px;
}
.extra-info-label { color: rgba(255,255,255,0.45); font-weight: 500; }
.extra-info-value { color: #7dd8f5; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 0.4px; }
.modal-note { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.5; display: flex; gap: 5px; }
.modal-caption-text { font-size: 11px; color: rgba(255,255,255,0.32); font-style: italic; }

.thumb-strip {
  display: flex; gap: 6px; padding: 7px 12px;
  background: rgba(0,0,0,0.45);
  border-top: 1px solid rgba(255,255,255,0.06);
  overflow-x: auto; flex-shrink: 0; scroll-behavior: smooth;
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.12) transparent;
}
.thumb-strip::-webkit-scrollbar { height: 3px; }
.thumb-strip::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 2px; }

.thumb-item { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; opacity: 0.45; transition: opacity 0.15s, transform 0.15s; }
.thumb-item:hover { opacity: 0.75; transform: translateY(-1px); }
.thumb-item.active { opacity: 1; }
.thumb-img { width: 56px; height: 42px; object-fit: cover; border-radius: 4px; border: 2px solid transparent; transition: border-color 0.15s; }
.thumb-item.active .thumb-img { border-color: #0d98d8; }
.thumb-name { font-size: 9px; color: rgba(255,255,255,0.42); max-width: 56px; text-align: center; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; line-height: 1.2; }
.thumb-item.active .thumb-name { color: #7dd8f5; }

@media (max-width: 600px) {
  .modal-topbar { padding: 7px 8px; }
  .modal-item-name { font-size: 12px; }
  .action-btn { width: 30px; height: 30px; }
  .nav-btn { width: 32px; }
  .thumb-img { width: 44px; height: 34px; }
  .thumb-name { max-width: 44px; }
  .btn-add-est-modal { font-size: 10px; padding: 8px 10px; }
}

/* Tombol Kembali di bagian bawah */
.btn-back-modal {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 10px 12px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 4px;
  -webkit-tap-highlight-color: transparent;
}
.btn-back-modal:active {
  background: rgba(255,255,255,0.18);
}
.btn-back-modal svg {
  flex-shrink: 0;
}

.est-btn-fade-enter-active { animation: estBtnIn 0.2s ease; }
.est-btn-fade-leave-active { animation: estBtnOut 0.15s ease forwards; }
@keyframes estBtnIn  { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@keyframes estBtnOut { from { opacity: 1; } to { opacity: 0; } }
</style>