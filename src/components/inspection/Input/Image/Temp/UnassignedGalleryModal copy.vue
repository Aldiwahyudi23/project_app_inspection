<!-- components/inspection/Input/Image/Temp/UnassignedGalleryModal.vue -->
<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 bg-white flex flex-col">

      <!-- HEADER -->
      <div class="px-4 py-3 border-b flex items-center gap-3">
        <button
          @click="handleClose"
          :disabled="isAssigning"
          class="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-40"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="flex-1">
          <h2 class="font-semibold text-gray-800">Foto Bebas</h2>
          <p class="text-xs text-gray-500">
            <template v-if="targetItem && effectiveMax > 1">
              Pilih maks. {{ effectiveMax }} foto •
              <span :class="selectedIds.size >= effectiveMax ? 'text-orange-500 font-medium' : 'text-blue-500'">
                {{ selectedIds.size }} dipilih
              </span>
            </template>
            <template v-else>
              {{ allImages.length }} foto
              <span v-if="uploadingCount > 0" class="text-orange-500 font-medium">
                · {{ uploadingCount }} sedang upload
              </span>
            </template>
          </p>
        </div>

        <button
          v-if="targetItem && selectedIds.size > 0"
          @click="confirmSelection"
          :disabled="isAssigning"
          class="flex items-center gap-1.5 bg-blue-500 text-white text-xs font-semibold
                 px-4 py-2 rounded-full hover:bg-blue-600 active:scale-95 transition-all shadow-sm
                 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg v-if="isAssigning" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          {{ isAssigning ? 'Menyimpan...' : `Tambahkan (${selectedIds.size})` }}
        </button>
      </div>

      <!-- INFO BANNER -->
      <div
        v-if="allImages.length > 0"
        class="px-4 py-2 border-b"
        :class="targetItem && effectiveMax === 0
          ? 'bg-orange-50 border-orange-100'
          : 'bg-blue-50 border-blue-100'"
      >
        <p class="text-xs" :class="targetItem && effectiveMax === 0 ? 'text-orange-700' : 'text-blue-700'">
          <template v-if="targetItem && effectiveMax === 0">
            ⚠️ Item <strong>{{ targetItem.inspection_item?.name }}</strong> sudah penuh.
          </template>
          <template v-else-if="targetItem">
            Tap foto untuk memilih, lalu klik <strong>Tambahkan</strong>. Ketuk 🔍 untuk preview.
          </template>
          <template v-else>
            Ketuk 🔍 untuk preview foto.
          </template>
        </p>
      </div>

      <!-- EMPTY STATE -->
      <div v-if="allImages.length === 0" class="flex-1 flex flex-col items-center justify-center gap-4 px-8">
        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586
                 a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6
                 a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <div class="text-center">
          <p class="font-medium text-gray-700">Belum ada foto</p>
          <p class="text-sm text-gray-500 mt-1">Tambah foto lewat tombol kamera di bawah</p>
        </div>
      </div>

      <!-- GRID FOTO -->
      <div v-else class="flex-1 overflow-y-auto overscroll-contain pb-28">
        <div class="grid grid-cols-3 gap-0.5 p-0.5">
          <div
            v-for="img in allImages"
            :key="img.localId"
            class="relative aspect-square"
            :class="img.status === 'done' && targetItem ? 'cursor-pointer' : 'cursor-default'"
            @click="handleThumbnailTap(img)"
          >
            <div class="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden">
              <img
                v-if="img.url || img.imageUrl"
                :src="img.url || img.imageUrl"
                class="max-w-full max-h-full object-contain"
                draggable="false"
              />
              <div v-else class="w-full h-full bg-gray-200 animate-pulse"/>
            </div>

            <!-- PENDING / UPLOADING -->
            <div
              v-if="img.status === 'pending' || img.status === 'uploading'"
              class="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none"
            >
              <svg class="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            </div>

            <!-- FAILED -->
            <div
              v-else-if="img.status === 'failed'"
              class="absolute inset-0 bg-red-900/65 flex flex-col items-center justify-center gap-1.5"
              @click.stop="store.retryUpload(img.localId)"
            >
              <div class="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9
                       m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </div>
              <span class="text-white text-[10px] font-semibold">Tap retry</span>
            </div>

            <!-- DONE badge -->
            <div
              v-if="img.status === 'done'"
              class="absolute bottom-1.5 left-1.5 w-5 h-5 bg-green-500 rounded-full
                     flex items-center justify-center shadow pointer-events-none"
            >
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
            </div>

            <!-- Selected overlay — hanya tampil kalau ada targetItem -->
            <Transition name="fade-quick">
              <div
                v-if="targetItem && selectedIds.has(img.localId)"
                class="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 pointer-events-none"
              >
                <div class="absolute top-1.5 left-1.5 w-6 h-6 bg-blue-500 rounded-full
                            flex items-center justify-center shadow">
                  <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div
                  v-if="effectiveMax > 1"
                  class="absolute bottom-1.5 left-1.5 min-w-[20px] h-5 px-1 bg-blue-500 text-white
                         text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {{ getSelectionOrder(img.localId) }}
                </div>
              </div>
            </Transition>

            <!-- Preview/zoom button -->
            <button
              v-if="img.status === 'done'"
              class="absolute top-1.5 right-1.5 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full
                     flex items-center justify-center active:scale-90 z-10"
              @click.stop="openPreviewAt(img)"
            >
              <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
              </svg>
            </button>

            <!-- Dim limit — hanya kalau ada targetItem -->
            <div
              v-if="img.status === 'done'
                    && targetItem
                    && selectedIds.size >= effectiveMax
                    && !selectedIds.has(img.localId)"
              class="absolute inset-0 bg-black/40 pointer-events-none"
            />
          </div>
        </div>
      </div>

      <!-- Loading overlay assign -->
      <Transition name="fade-quick">
        <div
          v-if="isAssigning"
          class="absolute inset-0 bg-white/70 backdrop-blur-sm z-10
                 flex flex-col items-center justify-center gap-3"
        >
          <svg class="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p class="text-sm font-medium text-gray-700">Menyimpan...</p>
        </div>
      </Transition>

      <!-- FAB KAMERA -->
      <div class="absolute bottom-6 right-4 flex flex-col items-center gap-1 z-20">
        <button
          @click="handleFabCamera"
          class="w-14 h-14 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-full
                 shadow-lg shadow-blue-200 flex items-center justify-center transition-all duration-200"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07
                 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012
                 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
        <span class="text-[10px] text-gray-500 font-medium bg-white/90 px-1.5 py-0.5 rounded-full shadow-sm">
          Tambah Foto
        </span>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        class="hidden"
        @change="handleFileSelect"
      />
    </div>
  </Teleport>

  <!-- IMAGE PREVIEW MODAL -->
  <Teleport to="body">
    <ImagePreviewModal
      v-if="showPreviewModal"
      :show="showPreviewModal"
      :images="pendingPreviewImages"
      item-name="Foto Bebas"
      :max="99"
      :editable="true"
      :is-new-batch="previewMode === 'new'"
      :start-index="previewStartIndex"
      @close="handlePreviewClose"
      @save="handlePreviewSave"
      @add-more="handlePreviewAddMore"
      @remove-stored="() => {}"
    />
  </Teleport>

  <!-- SOURCE MODAL -->
  <ImageSourceModal
    :show="showSourceModal"
    :has-temp-images="false"
    :temp-count="0"
    @close="showSourceModal = false"
    @select="handleSourceSelect"
  />
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useTempImageStore }  from '../../../../../stores/useTempImageStore'
import { useCameraSettings }  from '../../../../../composables/useCameraSettings'
import ImageSourceModal       from '../ImageSourceModal.vue'
import ImagePreviewModal      from '../ImagePreviewModal.vue'
import type { TempImage }     from '../../../../../stores/useTempImageStore'
import type { FormItem }      from '../../../../../types/formInspection'

const props = defineProps<{
  show:         boolean
  inspectionId: number
  sections:     any[]
  targetItem?:  FormItem | null
  maxFiles?:    number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'assigned',
    itemId:    number,
    imageData: { id: number; image_url: string; caption: string | null }
  ): void
}>()

// ── Store & camera settings ───────────────────────────────────
const store = useTempImageStore()
const { settings: cameraSettings, listenForChanges } = useCameraSettings()

const localCameraSource        = ref(cameraSettings.value.source)
const localPreviewBeforeUpload = ref(cameraSettings.value.previewBeforeUpload ?? true)

let cleanupListener: (() => void) | undefined

// ── Scroll lock ───────────────────────────────────────────────
let savedScrollY = 0

const lockBodyScroll = () => {
  savedScrollY                 = window.scrollY
  document.body.style.position = 'fixed'
  document.body.style.top      = `-${savedScrollY}px`
  document.body.style.left     = '0'
  document.body.style.right    = '0'
  document.body.style.overflow = 'hidden'
}

const unlockBodyScroll = () => {
  document.body.style.position = ''
  document.body.style.top      = ''
  document.body.style.left     = ''
  document.body.style.right    = ''
  document.body.style.overflow = ''
  window.scrollTo(0, savedScrollY)
}

watch(() => props.show, (val) => {
  if (val) lockBodyScroll()
  else     unlockBodyScroll()
}, { immediate: true })

onMounted(() => {
  cleanupListener = listenForChanges((s) => {
    localCameraSource.value        = s.source
    localPreviewBeforeUpload.value = s.previewBeforeUpload ?? true
  })
})

onUnmounted(() => {
  if (cleanupListener) cleanupListener()
  unlockBodyScroll() // safety net
})

// ── Computed ──────────────────────────────────────────────────
const allImages = computed<TempImage[]>(() =>
  store.getByInspection(props.inspectionId).filter(img =>
    !img.assignedToItemId ||
    img.status === 'pending' ||
    img.status === 'uploading' ||
    img.status === 'failed'
  )
)

const uploadingCount = computed(() =>
  allImages.value.filter(i => i.status === 'pending' || i.status === 'uploading').length
)

const effectiveMax = computed(() => props.maxFiles ?? 999)

// ── Preview modal state ───────────────────────────────────────
const fileInput            = ref<HTMLInputElement | null>(null)
const showSourceModal      = ref(false)
const showPreviewModal     = ref(false)
const pendingPreviewImages = ref<any[]>([])
const previewStartIndex    = ref(0)
const previewMode          = ref<'new' | 'view'>('new')

// ── FAB kamera ───────────────────────────────────────────────
const handleFabCamera = () => {
  const source = localCameraSource.value
  if      (source === 'camera')  openFileInput('camera')
  else if (source === 'gallery') openFileInput('gallery')
  else    showSourceModal.value = true
}

const handleSourceSelect = (type: string) => {
  showSourceModal.value = false
  if (type === 'camera' || type === 'gallery') openFileInput(type)
}

const openFileInput = (type: 'camera' | 'gallery') => {
  if (!fileInput.value) return
  fileInput.value.value = ''
  fileInput.value.removeAttribute('capture')
  if (type === 'camera') fileInput.value.setAttribute('capture', 'environment')
  nextTick(() => fileInput.value?.click())
}

// ── Handle file dipilih ───────────────────────────────────────
const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return

  const files: File[] = []
  for (const file of Array.from(input.files)) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) continue
    if (file.size > 10 * 1024 * 1024) continue
    files.push(file)
  }
  input.value = ''
  if (!files.length) return

  const newItems = files.map(file => ({
    file,
    url:      URL.createObjectURL(file),
    rotation: 0,
    _isNew:   true,
  }))

  if (localPreviewBeforeUpload.value) {
    if (showPreviewModal.value && previewMode.value === 'new') {
      const focusIndex = pendingPreviewImages.value.length
      pendingPreviewImages.value = [...pendingPreviewImages.value, ...newItems]
      nextTick(() => { previewStartIndex.value = focusIndex })
    } else {
      pendingPreviewImages.value = newItems
      previewStartIndex.value    = 0
      previewMode.value          = 'new'
      nextTick(() => { showPreviewModal.value = true })
    }
  } else {
    store.addImages({
      files,
      rotations:    files.map(() => 0),
      inspectionId: props.inspectionId,
    })
  }
}

// ── Tombol + di dalam ImagePreviewModal ──────────────────────
const handlePreviewAddMore = () => {
  const source = localCameraSource.value
  if      (source === 'camera')  openFileInput('camera')
  else if (source === 'gallery') openFileInput('gallery')
  else    showSourceModal.value = true
}

// ── Simpan dari ImagePreviewModal ────────────────────────────
const handlePreviewSave = (savedImages: any[]) => {
  showPreviewModal.value = false
  const newImages = savedImages.filter((img: any) => img._isNew && img.file)
  pendingPreviewImages.value.forEach((img: any) => {
    if (img._isNew && img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)
  })
  pendingPreviewImages.value = []
  if (!newImages.length) return
  store.addImages({
    files:        newImages.map((img: any) => img.file),
    rotations:    newImages.map((img: any) => ((img.rotation || 0) % 360 + 360) % 360),
    inspectionId: props.inspectionId,
  })
}

// ── Tutup ImagePreviewModal ───────────────────────────────────
const handlePreviewClose = () => {
  showPreviewModal.value = false
  if (previewMode.value === 'new') {
    pendingPreviewImages.value.forEach((img: any) => {
      if (img._isNew && img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)
    })
    pendingPreviewImages.value = []
  }
}

// ── Buka preview foto done dari grid ─────────────────────────
const openPreviewAt = (img: TempImage) => {
  const doneImages = allImages.value.filter(i => i.status === 'done')
  const startIdx   = doneImages.findIndex(i => i.localId === img.localId)
  pendingPreviewImages.value = doneImages.map(i => ({
    localId:  i.localId,
    url:      i.imageUrl ?? i.url,
    imageUrl: i.imageUrl,
    id:       i.serverId,
    serverId: i.serverId,
    caption:  i.caption,
    status:   i.status,
    rotation: 0,
    _isNew:   false,
  }))
  previewStartIndex.value = startIdx >= 0 ? startIdx : 0
  previewMode.value       = 'view'
  nextTick(() => { showPreviewModal.value = true })
}

// ── Multi-select (hanya aktif kalau ada targetItem) ───────────
const selectionOrder = ref<Map<string, number>>(new Map())
const selectedIds    = computed(() => new Set(selectionOrder.value.keys()))
const isAssigning    = ref(false)

const getSelectionOrder = (localId: string) => selectionOrder.value.get(localId) ?? 0

const toggleSelect = (img: TempImage) => {
  const next = new Map(selectionOrder.value)
  if (next.has(img.localId)) {
    next.delete(img.localId)
    let order = 1
    for (const [k] of next) next.set(k, order++)
  } else {
    if (next.size >= effectiveMax.value) return
    next.set(img.localId, next.size + 1)
  }
  selectionOrder.value = next
}

/**
 * Tap foto:
 * - Ada targetItem  → toggle select untuk assign
 * - Tidak ada targetItem → tidak ada aksi (preview tetap bisa via tombol 🔍)
 */
const handleThumbnailTap = (img: TempImage) => {
  if (img.status !== 'done') return
  if (props.targetItem) toggleSelect(img)
}

const confirmSelection = async () => {
  if (!props.targetItem || selectionOrder.value.size === 0) return
  isAssigning.value = true

  const orderedLocalIds = [...selectionOrder.value.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([localId]) => localId)

  const results = await store.assignToItem(
    orderedLocalIds,
    props.targetItem.inspection_item_id,
    props.targetItem.id,
  )

  isAssigning.value = false

  if (results) {
    for (const imageData of results) {
      emit('assigned', props.targetItem.id, imageData)
    }
  }

  selectionOrder.value = new Map()
  emit('close')
}

const handleClose = () => {
  if (isAssigning.value) return
  selectionOrder.value = new Map()
  emit('close')
}
</script>

<style scoped>
.fade-quick-enter-active, .fade-quick-leave-active { transition: opacity 0.15s ease; }
.fade-quick-enter-from,   .fade-quick-leave-to     { opacity: 0; }
</style>