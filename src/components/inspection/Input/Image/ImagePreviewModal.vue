<!-- components/inspection/inputs/Image/ImagePreviewModal.vue -->
<!--
  Preview modal yang kompatibel dengan store-based images.
  Perubahan utama dari versi lama:
  - Tidak ada "Simpan & Upload" — upload sudah berjalan di background via store.
  - Tombol simpan hanya untuk apply rotasi (emit 'save' dengan data rotation).
  - Indikator status per gambar: pending, uploading, done, failed.
  - Gambar yang status-nya bukan 'done' ditampilkan badge status.
-->
<template>
  <div v-if="show" class="fixed inset-0 z-50 bg-white flex flex-col">

    <!-- HEADER -->
    <div class="p-4 border-b flex justify-between items-center">
      <button @click="$emit('close')" class="text-blue-600 font-medium">Kembali</button>
      <h3 class="font-semibold truncate max-w-[60%]">{{ title }}</h3>
      <div class="w-14"></div>
    </div>

    <!-- MAIN VIEWER -->
    <div class="flex-1 flex items-center justify-center bg-black overflow-hidden relative">

    <!-- NAVIGATION ARROWS  -->
    <button
      v-if="hasPrevious"
      class="floating-nav floating-nav-prev"
      @click="previousImage"
      @mousedown.stop
      @touchstart.stop
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    </button>

    <button
      v-if="hasNext"
      class="floating-nav floating-nav-next"
      @click="nextImage"
      @mousedown.stop
      @touchstart.stop
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>

      <!-- IMAGE CONTAINER -->
      <div
        v-if="currentImageUrl"
        class="touch-none w-full h-full flex items-center justify-center"
        style="position:relative;overflow:hidden;"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
      >
        <img
          :src="currentImageUrl"
          :style="imageStyle"
          class="max-w-none select-none"
          draggable="false"
          @load="resetTransform"
        />

        <!-- Overlay status di viewer utama -->
        <div
          v-if="currentImage?.status && currentImage.status !== 'done'"
          class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3 pointer-events-none"
        >
          <!-- Uploading -->
          <template v-if="currentImage.status === 'uploading'">
            <svg class="w-12 h-12 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <span class="text-white text-sm font-medium">Mengupload…</span>
          </template>

          <!-- Pending -->
          <template v-else-if="currentImage.status === 'pending'">
            <span class="w-8 h-8 rounded-full bg-yellow-400 animate-pulse block"></span>
            <span class="text-white text-sm font-medium">Menunggu upload…</span>
          </template>

          <!-- Failed -->
          <template v-else-if="currentImage.status === 'failed'">
            <svg class="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"/>
            </svg>
            <span class="text-white text-sm font-medium">Upload gagal</span>
          </template>
        </div>
      </div>

      <!-- Placeholder jika tidak ada URL -->
      <div v-else class="text-white/50 text-sm">Tidak ada gambar</div>

      <!-- CONTROL BUTTONS (zoom, rotate) -->
      <div
        class="floating-controls"
        @mousedown.stop
        @touchstart.stop
      >
        <button 
          class="floating-control-btn" 
          title="Rotate Kiri" 
          @click="rotate(-90)"
          :disabled="!currentIsNew"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38"/>
          </svg>
        </button>
        
        <button 
          class="floating-control-btn" 
          title="Rotate Kanan" 
          @click="rotate(90)"
          :disabled="!currentIsNew"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
          </svg>
        </button>
        
        <button 
          class="floating-control-btn" 
          title="Zoom Out" 
          @click="zoomOut"
          :disabled="scale <= 0.5"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M8 11h6"/>
          </svg>
        </button>
        
        <button 
          class="floating-control-btn zoom-label" 
          @click="resetTransform"
        >
          {{ Math.round(scale * 100) }}%
        </button>
        
        <button 
          class="floating-control-btn" 
          title="Zoom In" 
          @click="zoomIn"
          :disabled="scale >= 5"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/>
          </svg>
        </button>
      </div>

      <!-- IMAGE COUNTER -->
      <div class="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm
                  text-white px-3 py-1 rounded-full text-sm">
        {{ currentIndex + 1 }} / {{ localImages.length }}
      </div>

      <!-- Status badge kanan atas -->
      <div class="absolute top-4 right-4 flex flex-col items-end gap-1">
        <!-- "Baru" badge untuk gambar yang belum pernah di-upload -->
        <div
          v-if="currentIsNew"
          class="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full"
        >Baru</div>

        <!-- Status badge -->
        <div
          v-if="currentImage?.status"
          :class="statusBadgeClass(currentImage.status)"
          class="text-white text-xs px-2 py-0.5 rounded-full"
        >{{ statusLabel(currentImage.status) }}</div>
      </div>
    </div>

  <!-- Drag Handle - selalu terlihat -->
  <div 
    class="flex justify-center py-2 cursor-pointer hover:bg-gray-100 transition-colors"
    @click="toggleOptionDrawer"
    @touchstart="onOptionDragStart"
    @touchmove="onOptionDragMove"
    @touchend="onOptionDragEnd"
    @mousedown="onOptionDragStart"
    @mousemove="onOptionDragMove"
    @mouseup="onOptionDragEnd"
    @mouseleave="onOptionDragEnd"
  >
    <div class="w-10 h-1 bg-gray-400 rounded-full"></div>
  </div>

    <!-- THUMBNAILS -->      
    <div class="p-3 border-t overflow-x-auto flex gap-2 bg-white">
      <div
        v-for="(img, i) in localImages"
        :key="img.localId || i"
        class="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden border-2 cursor-pointer"
        :class="i === currentIndex ? 'border-blue-500' : 'border-transparent'"
        @click="selectImage(i)"
      >
        <img
          :src="getImgUrl(img)"
          class="w-full h-full object-cover"
        />

        <!-- Status dot di thumbnail -->
        <div
          :class="thumbStatusDot(img.status)"
          class="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border border-white"
        ></div>

        <!-- DELETE BUTTON -->
        <button
          @click.stop="remove(i)"
          class="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white text-xs
                 rounded-full flex items-center justify-center shadow"
        >✕</button>
      </div>

      <!-- ADD MORE -->
      <div
        v-if="!isMaxReached"
        class="w-16 h-16 flex-shrink-0 border-2 border-dashed border-gray-300 flex
               items-center justify-center rounded cursor-pointer hover:border-blue-500"
        @click="$emit('add-more')"
      >
        <span class="text-2xl text-gray-400">+</span>
      </div>
    </div>

<!-- OPTIONS SECTION - DRAGGABLE -->
<div 
  v-if="hasShowOption && options.length > 0"
  class="border-t bg-gray-50 flex-shrink-0"
>
  <!-- Option Content - yang bisa collapse -->
  <div 
    class="option-content-wrapper overflow-hidden transition-all duration-300"
    :class="optionDrawerState === 'collapsed' ? 'max-h-0' : 'max-h-96'"
  >
    <div class="px-4 py-3 border-t">
      <RadioInput
        :item="radioItem"
        :inspection-id="inspectionId"
        :model-value="tempOptionValue"
        :error="optionError"
        @update:model-value="handleTempOptionUpdate"
        @update:error="handleOptionError"
        @update:valid="handleOptionValid"
      />
    </div>
  </div>
</div>

<!-- SAVE BUTTON -->
<div class="p-4 border-t bg-white">
  <button
    class="w-full py-3 rounded-lg font-medium transition-colors"
    :class="isSaveDisabled 
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
      : 'bg-blue-600 text-white active:bg-blue-700'"
    :disabled="isSaveDisabled"
    @click="save"
  >
    {{ isNewBatch ? 'Simpan & Upload' : 'Selesai' }}
  </button>
  <!-- Pesan error jika tombol disable karena validasi -->
  <p v-if="isSaveDisabled && optionErrorMessage" class="text-center text-xs text-red-500 mt-2">
    {{ optionErrorMessage }}
  </p>
</div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import RadioInput from '../RadioInput.vue'


const props = defineProps({
  show:       Boolean,
  itemName:   String,
  images:     Array,
  max:        Number,
  editable:   Boolean,
  startIndex: Number,
  /** true = batch gambar baru (belum diupload), false = view gambar lama */
  isNewBatch: { type: Boolean, default: false },
   // Props baru untuk show_option
  showOption:    { type: Boolean, default: false },
  options:       { type: Array, default: () => [] },
  optionRequired:{ type: Boolean, default: false },
  inspectionId:  { type: Number, default: null },
  // Nilai option dari parent (jika sudah ada)
  initialOptionValue: { type: Object, default: null }
})

const emit = defineEmits(['close', 'save', 'add-more', 'remove-stored'])

// Option drawer state dengan properti yang lebih baik
const optionDrawerState = ref('expanded') // 'expanded' or 'collapsed'
const optionDragStartY = ref(0)
const optionDragging = ref(false)
const optionStartState = ref('expanded')
const optionDragOffset = ref(0)

const toggleOptionDrawer = () => {
  optionDrawerState.value = optionDrawerState.value === 'expanded' ? 'collapsed' : 'expanded'
  optionDragOffset.value = 0
}

const onOptionDragStart = (e) => {
  e.preventDefault()
  optionDragging.value = true
  optionStartState.value = optionDrawerState.value
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  optionDragStartY.value = clientY
  optionDragOffset.value = 0
}

const onOptionDragMove = (e) => {
  if (!optionDragging.value) return
  e.preventDefault()
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  let delta = clientY - optionDragStartY.value
  
  // Batasi drag berdasarkan state awal
  if (optionStartState.value === 'expanded') {
    // Drag ke bawah untuk menutup
    delta = Math.min(Math.max(0, delta), 200)
    if (delta > 50) {
      optionDrawerState.value = 'collapsed'
    } else {
      optionDrawerState.value = 'expanded'
    }
  } else {
    // Drag ke atas untuk membuka
    delta = Math.min(Math.max(-200, delta), 0)
    if (delta < -50) {
      optionDrawerState.value = 'expanded'
    } else {
      optionDrawerState.value = 'collapsed'
    }
  }
  
  optionDragOffset.value = delta
}

const onOptionDragEnd = () => {
  if (!optionDragging.value) return
  optionDragging.value = false
  optionDragOffset.value = 0
}

// State untuk menyimpan nilai option sementara (belum disimpan)
const tempOptionValue = ref(null)
const optionError = ref('')
const optionValid = ref(true)
// Radio item untuk preview
const radioItem = computed(() => ({
  id:                  'preview_option',
  section_id:          0,
  inspection_item_id:  0,
  input_type:          'radio',
  sort_order:          0,
  is_active:           true,
  is_visible:          true,
  is_required:         props.optionRequired,
  current_result:      null,
  ui_config:           null,
  inspection_item: {
    id:          0,
    name:        'Pilihan',
    description: null,
    code:        null,
  },
  settings: {
    options: props.options,
    layout:  'horizontal',
  },
  validation_rules: [],
}))


// Inisialisasi tempOptionValue dari props.initialOptionValue
watch(() => props.initialOptionValue, (val) => {
  if (val) {
    tempOptionValue.value = { ...val }
  } else {
    tempOptionValue.value = null
  }
}, { immediate: true })


// Reset saat modal dibuka
watch(() => props.show, (val) => {
  if (val) {
    if (props.initialOptionValue) {
      tempOptionValue.value = { ...props.initialOptionValue }
    } else {
      tempOptionValue.value = null
    }
    optionError.value = ''
    optionValid.value = true
  }
})

const handleTempOptionUpdate = (value) => {
  tempOptionValue.value = value
}


const handleOptionError = (error) => {
  optionError.value = error
}

const handleOptionValid = (valid) => {
  optionValid.value = valid
}

// Hitung apakah tombol simpan disabled
const isSaveDisabled = computed(() => {
  // Jika tidak ada show_option, tombol selalu aktif
  if (!hasShowOption.value) return false
  
  // Jika option tidak required, tombol aktif (validasi internal tetap jalan tapi tidak memblock)
  if (!props.optionRequired) return false
  
  // Option required:
  // 1. Belum ada status yang dipilih
  if (!tempOptionValue.value?.status) return true
  
  // 2. Validasi dari RadioInput (untuk textarea min/max, dll)
  if (!optionValid.value) return true
  
  return false
})

// Pesan error yang ditampilkan saat tombol disable
const optionErrorMessage = computed(() => {
  if (!hasShowOption.value) return ''
  if (!props.optionRequired) return ''
  if (!tempOptionValue.value?.status) return 'Pilih salah satu opsi terlebih dahulu'
  if (!optionValid.value && optionError.value) return optionError.value
  return ''
})

const hasShowOption = computed(() => props.showOption && props.options.length > 0)

const localImages  = ref([])
const currentIndex = ref(0)

const title = computed(() =>
  props.itemName && props.itemName.trim() !== '' ? props.itemName : 'Preview Gambar'
)

// ─── Helper ──────────────────────────────────────────────────

const getImgUrl = (img) => img?.imageUrl || img?.image_url || img?.url || img || ''

/** Gambar "baru" = ada .file (File object) dan belum punya serverId / id */
const isNewImage = (img) => !!img?.file && !img?.id && !img?.serverId

const currentImage    = computed(() => localImages.value[currentIndex.value])
const currentIsNew    = computed(() => isNewImage(currentImage.value))
const currentImageUrl = computed(() => getImgUrl(currentImage.value))

// ─── Status helpers ───────────────────────────────────────────

const statusLabel = (status) => ({
  pending:   'Menunggu',
  uploading: 'Uploading…',
  done:      'Tersimpan',
  failed:    'Gagal',
}[status] || status)

const statusBadgeClass = (status) => ({
  pending:   'bg-yellow-500',
  uploading: 'bg-blue-500',
  done:      'bg-green-500',
  failed:    'bg-red-500',
}[status] || 'bg-gray-500')

const thumbStatusDot = (status) => ({
  pending:   'bg-yellow-400',
  uploading: 'bg-blue-400',
  done:      'bg-green-400',
  failed:    'bg-red-500',
}[status] || 'bg-gray-400')

// ─── Watch ───────────────────────────────────────────────────

watch(() => props.show, (val) => {
  if (val) resetTransform()
})

watch(() => props.images, (val) => {
  if (!val) { localImages.value = []; return }

  const mapped = val.map(img => ({ ...img, rotation: img.rotation ?? 0 }))

  // ── Modal belum terbuka atau list kosong: set fresh ──
  if (!props.show || localImages.value.length === 0) {
    localImages.value = mapped
    return
  }

  // ── Modal terbuka, gambar bertambah (user klik "Tambah lagi") ──
  // Hanya append gambar baru di ujung; jangan reset agar rotasi yang
  // sudah di-edit user tidak hilang.
  if (mapped.length > localImages.value.length) {
    const newOnes = mapped.slice(localImages.value.length)
    localImages.value = [...localImages.value, ...newOnes]
    // Fokus ke gambar baru pertama
    currentIndex.value = localImages.value.length - newOnes.length
    resetTransform()
    return
  }

  // ── Jumlah sama: update status/url gambar yang sudah ada ──
  // (misal status berubah dari pending → uploading → done di background)
  if (mapped.length === localImages.value.length) {
    mapped.forEach((img, i) => {
      const local = localImages.value[i]
      if (!local) return
      // Update field yang bisa berubah dari store; rotation JANGAN dioverride
      // karena user mungkin sudah mengeditnya di modal.
      if (img.status    !== undefined) local.status    = img.status
      if (img.imageUrl)                local.imageUrl  = img.imageUrl
      if (img.id)                      local.id        = img.id
      if (img.serverId)                local.serverId  = img.serverId
      // Update url hanya jika gambar sudah done (server URL menggantikan blob)
      if (img.status === 'done' && img.url && !img.url.startsWith('blob:')) {
        local.url = img.url
      }
    })
    return
  }

  // ── Jumlah berkurang (gambar dihapus dari luar modal) ──
  localImages.value = mapped
  if (currentIndex.value >= localImages.value.length) {
    currentIndex.value = Math.max(0, localImages.value.length - 1)
  }
}, { immediate: true, deep: true })

watch(() => props.startIndex, val => {
  if (val !== undefined) currentIndex.value = val
}, { immediate: true })

const isMaxReached = computed(() => localImages.value.length >= props.max)
const hasPrevious  = computed(() => currentIndex.value > 0)
const hasNext      = computed(() => currentIndex.value < localImages.value.length - 1)

/* ================= ZOOM & DRAG ================= */

const scale      = ref(1)
const position   = ref({ x: 0, y: 0 })
const isDragging = ref(false)
let startX = 0, startY = 0, startDistance = 0, startScale = 1

const imageStyle = computed(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value}) rotate(${localImages.value[currentIndex.value]?.rotation || 0}deg)`,
  transition: isDragging.value ? 'none' : 'transform 0.1s ease',
  transformOrigin: 'center',
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain'
}))

const getDistance = (touches) => {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

const onTouchStart = (e) => {
  e.preventDefault()
  if (e.touches.length === 2) {
    startDistance = getDistance(e.touches)
    startScale = scale.value
  } else if (e.touches.length === 1) {
    isDragging.value = true
    startX = e.touches[0].clientX - position.value.x
    startY = e.touches[0].clientY - position.value.y
  }
}

const onTouchMove = (e) => {
  e.preventDefault()
  if (e.touches.length === 2) {
    scale.value = Math.min(Math.max(1, startScale * (getDistance(e.touches) / startDistance)), 5)
  } else if (e.touches.length === 1 && isDragging.value) {
    position.value.x = e.touches[0].clientX - startX
    position.value.y = e.touches[0].clientY - startY
  }
}

const onTouchEnd = () => { isDragging.value = false }

const onMouseDown = (e) => {
  if (e.button !== 0) return
  e.preventDefault()
  isDragging.value = true
  startX = e.clientX - position.value.x
  startY = e.clientY - position.value.y
}

const onMouseMove = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  position.value.x = e.clientX - startX
  position.value.y = e.clientY - startY
}

const onMouseUp = () => { isDragging.value = false }

const zoomIn  = () => { scale.value = Math.min(scale.value + 0.3, 5) }
const zoomOut = () => { scale.value = Math.max(scale.value - 0.3, 1) }
const resetTransform = () => { scale.value = 1; position.value = { x: 0, y: 0 } }

const rotate = (deg) => {
  const img = localImages.value[currentIndex.value]
  if (!img || !isNewImage(img)) return
  img.rotation = ((img.rotation || 0) + deg) % 360
}

/* ================= NAVIGATION ================= */

const previousImage = () => { if (hasPrevious.value) { currentIndex.value--; resetTransform() } }
const nextImage     = () => { if (hasNext.value)     { currentIndex.value++; resetTransform() } }
const selectImage   = (i) => { if (i !== currentIndex.value) { currentIndex.value = i; resetTransform() } }

/* ================= REMOVE ================= */

/**
 * remove — hapus gambar dari localImages.
 * Emit 'remove-stored' untuk gambar yang sudah di server (localId ada)
 * agar ImageInput bisa panggil store.removeImage().
 * Untuk gambar baru (_isNew), hanya hapus dari local list.
 */
const remove = (i) => {
  const img = localImages.value[i]

  // Gambar sudah di store (punya localId dan bukan _isNew) → beritahu parent
  if (img?.localId && !img?._isNew) {
    emit('remove-stored', img.localId)
  }

  localImages.value.splice(i, 1)
  if (localImages.value.length === 0) { emit('close'); return }
  if (currentIndex.value >= localImages.value.length) currentIndex.value = localImages.value.length - 1
  resetTransform()
}

/* ================= SAVE ================= */

/**
 * save — emit data gambar ke ImageInput.
 *
 * Emit seluruh list agar ImageInput tahu:
 * - Gambar _isNew  → perlu di-upload ke store
 * - Gambar stored  → sudah ada, tidak diapa-apakan
 */
const save = () => {
    // Cek lagi sebelum save
  if (isSaveDisabled.value) return
  const result = {
    images: localImages.value.map(img => ({
    localId:  img.localId,
    file:     img.file,
    rotation: img.rotation || 0,
    _isNew:   isNewImage(img),
    id:       img.id || img.serverId,
    url:      img.url,
    status:   img.status,
  })),
   optionValue: tempOptionValue.value 
  }
  emit('save', result)
}
</script>

<style scoped>
/* Option section styling */
.option-content-wrapper {
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Drag handle styling */
.border-t.bg-gray-50.flex-shrink-0 {
  position: relative;
  z-index: 15;
}

/* Pastikan tombol save selalu terlihat dan tidak terpengaruh animasi */
.p-4.border-t.bg-white {
  position: relative;
  z-index: 10;
  background-color: white;
}

/* Hover effect untuk drag handle */
.border-t.bg-gray-50.flex-shrink-0 .flex.justify-center.py-2:hover {
  background-color: #f3f4f6;
}

/* Animasi untuk konten radio */
.max-h-0 {
  max-height: 0;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.max-h-96 {
  max-height: 24rem; /* 384px */
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Padding dan margin yang konsisten */
.px-4.py-3.border-t {
  border-top: 1px solid #e5e7eb;
}

/* Floating Controls (rotate & zoom) - STYLE BARU */
.floating-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  padding: 8px 12px;
  border-radius: 40px;
  border: 1px solid rgba(255,255,255,0.2);
  z-index: 20;
}

.floating-control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  font-size: 11px;
  font-weight: 600;
}

.floating-control-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.25);
}

.floating-control-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.floating-control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.zoom-label {
  width: auto;
  min-width: 50px;
  border-radius: 20px;
  background: rgba(255,255,255,0.15);
  font-size: 12px;
  font-weight: 600;
}

/* Responsive untuk mobile */
@media (max-width: 600px) {
  .floating-controls {
    padding: 6px 10px;
    gap: 6px;
    bottom: 16px;
  }
  
  .floating-control-btn {
    width: 32px;
    height: 32px;
  }
  
  .floating-control-btn svg {
    width: 16px;
    height: 16px;
  }
  
  .zoom-label {
    min-width: 45px;
    font-size: 11px;
  }
}

/* Floating Navigation Buttons */
.floating-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 20;
  color: white;
}

.floating-nav:hover {
  background: rgba(0,0,0,0.8);
  transform: translateY(-50%) scale(1.05);
}

.floating-nav:active {
  transform: translateY(-50%) scale(0.95);
}

.floating-nav-prev {
  left: 16px;
}

.floating-nav-next {
  right: 16px;
}

.floating-nav svg {
  width: 22px;
  height: 22px;
  pointer-events: none;
}

/* Responsive untuk mobile */
@media (max-width: 600px) {
  .floating-nav {
    width: 36px;
    height: 36px;
  }
  
  .floating-nav svg {
    width: 18px;
    height: 18px;
  }
  
  .floating-nav-prev {
    left: 8px;
  }
  
  .floating-nav-next {
    right: 8px;
  }
}
</style>