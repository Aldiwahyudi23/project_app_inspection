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

      <!-- NAVIGATION ARROWS -->
      <button
        v-if="hasPrevious"
        @click="previousImage"
        class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80
               backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center
               text-2xl z-10 hover:bg-white transition-colors"
      >‹</button>

      <button
        v-if="hasNext"
        @click="nextImage"
        class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80
               backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center
               text-2xl z-10 hover:bg-white transition-colors"
      >›</button>

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
        class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3
               bg-black/50 backdrop-blur-sm p-2 rounded-full"
      >
        <button @click="zoomOut"
          class="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center text-xl font-bold">−</button>
        <button @click="zoomIn"
          class="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center text-xl font-bold">+</button>

        <!-- Rotate — hanya untuk gambar baru (belum di-upload = ada .file) -->
        <template v-if="currentIsNew">
          <button @click="rotate(-90)"
            class="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center text-xl">↺</button>
          <button @click="rotate(90)"
            class="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center text-xl">↻</button>
        </template>

        <button @click="resetTransform"
          class="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center text-sm font-bold">⊙</button>
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

     <!-- OPTIONS (RADIO) - Tambahkan di sini -->
    <div
      v-if="hasShowOption && options.length > 0"
      class="px-4 py-3 border-b bg-gray-50"
    >
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