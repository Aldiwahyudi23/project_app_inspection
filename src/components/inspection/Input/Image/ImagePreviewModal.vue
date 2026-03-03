<template>
  <div v-if="show" class="fixed inset-0 z-50 bg-white flex flex-col">

    <!-- HEADER -->
    <div class="p-4 border-b flex justify-between items-center">
      <button @click="$emit('close')" class="text-blue-600">Kembali</button>
      <h3 class="font-semibold">{{ title }}</h3>
      <div class="w-10"></div>
    </div>

    <!-- MAIN VIEWER -->
    <div class="flex-1 flex items-center justify-center bg-black overflow-hidden relative">

      <!-- NAVIGATION ARROWS -->
      <button
        v-if="hasPrevious"
        @click="previousImage"
        class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-2xl z-10 hover:bg-white transition-colors"
      >‹</button>

      <button
        v-if="hasNext"
        @click="nextImage"
        class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-2xl z-10 hover:bg-white transition-colors"
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
      </div>

      <!-- CONTROL BUTTONS -->
      <div
        v-if="editable"
        class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 bg-black/50 backdrop-blur-sm p-2 rounded-full"
      >
        <!-- Zoom Out -->
        <button @click="zoomOut" class="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center text-xl font-bold">−</button>

        <!-- Zoom In -->
        <button @click="zoomIn" class="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center text-xl font-bold">+</button>

        <!-- Rotate — hanya tampil untuk gambar baru (belum di-upload ke server) -->
        <template v-if="currentIsNew">
          <button @click="rotate(-90)" class="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center text-xl">↺</button>
          <button @click="rotate(90)"  class="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center text-xl">↻</button>
        </template>

        <!-- Reset zoom/pan -->
        <button @click="resetTransform" class="w-10 h-10 bg-white rounded-full shadow flex items-center justify-center text-sm font-bold">⊙</button>
      </div>

      <!-- IMAGE COUNTER -->
      <div class="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
        {{ currentIndex + 1 }} / {{ localImages.length }}
      </div>

      <!-- NEW badge untuk gambar belum di-upload -->
      <div
        v-if="currentIsNew"
        class="absolute top-4 right-4 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full"
      >
        Baru
      </div>
    </div>

    <!-- THUMBNAILS -->
    <div class="p-3 border-t overflow-x-auto flex gap-2 bg-white">
      <div
        v-for="(img, i) in localImages"
        :key="i"
        class="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden border-2 cursor-pointer"
        :class="i === currentIndex ? 'border-blue-500' : 'border-transparent'"
        @click="selectImage(i)"
      >
        <img
          :src="getImgUrl(img)"
          class="w-full h-full object-cover"
        />

        <!-- NEW indicator di thumbnail -->
        <div
          v-if="isNewImage(img)"
          class="absolute bottom-0 left-0 right-0 bg-blue-500/80 text-white text-center"
          style="font-size:9px;line-height:1.4;"
        >baru</div>

        <!-- DELETE BUTTON -->
        <button
          v-if="editable"
          @click.stop="remove(i)"
          class="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow"
        >✕</button>
      </div>

      <!-- ADD MORE -->
      <div
        v-if="editable && !isMaxReached"
        class="w-16 h-16 flex-shrink-0 border-2 border-dashed border-gray-300 flex items-center justify-center rounded cursor-pointer hover:border-blue-500"
        @click="$emit('add-more')"
      >
        <span class="text-2xl text-gray-400">+</span>
      </div>
    </div>

    <!-- SAVE BUTTON -->
    <div v-if="editable" class="p-4 border-t bg-white">
      <button
        class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium active:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        :disabled="isSaving"
        @click="save"
      >
        <svg v-if="isSaving" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <span>{{ isSaving ? 'Memproses...' : 'Simpan & Upload' }}</span>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  show:       Boolean,
  itemName:   String,
  images:     Array,
  max:        Number,
  editable:   Boolean,
  startIndex: Number
})

const emit = defineEmits(['close', 'save', 'add-more'])

const localImages  = ref([])
const currentIndex = ref(0)

const title = computed(() =>
  props.itemName && props.itemName.trim() !== '' ? props.itemName : 'Preview'
)

// ─── Helper ──────────────────────────────────────────────────

const getImgUrl = (img) => img?.image_url || img?.url || img || ''

/**
 * Gambar "baru" = belum pernah di-upload ke server.
 * Cirinya: punya .file (File object) dan TIDAK punya .id dari server.
 */
const isNewImage = (img) => !!img?.file && !img?.id

const currentIsNew    = computed(() => isNewImage(localImages.value[currentIndex.value]))
const currentImageUrl = computed(() => getImgUrl(localImages.value[currentIndex.value]))

// ─── Watch ───────────────────────────────────────────────────

watch(() => props.show, (val) => {
  if (val) resetTransform()
})

watch(() => props.images, (val) => {
  if (!val) { localImages.value = []; return }

  const mapped = val.map(img => ({ ...img, rotation: img.rotation || 0 }))

  // Kalau modal sedang terbuka DAN jumlah gambar bertambah → APPEND gambar baru saja
  if (props.show && localImages.value.length > 0 && mapped.length > localImages.value.length) {
    const newOnes = mapped.slice(localImages.value.length)
    localImages.value = [...localImages.value, ...newOnes]
    currentIndex.value = localImages.value.length - newOnes.length
    resetTransform()
  } else {
    localImages.value = mapped
  }
}, { immediate: true })

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

/**
 * rotate — hanya untuk gambar baru.
 * Guard isNewImage() memastikan gambar server tidak bisa di-rotate.
 */
const rotate = (deg) => {
  const img = localImages.value[currentIndex.value]
  if (!img || !isNewImage(img)) return
  img.rotation = ((img.rotation || 0) + deg) % 360
}

/* ================= NAVIGATION ================= */

const previousImage = () => { if (hasPrevious.value) { currentIndex.value--; resetTransform() } }
const nextImage     = () => { if (hasNext.value)     { currentIndex.value++; resetTransform() } }

/* ================= REMOVE ================= */

const remove = (i) => {
  const img = localImages.value[i]
  if (img?.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)
  localImages.value.splice(i, 1)
  if (localImages.value.length === 0) { emit('close'); return }
  if (currentIndex.value >= localImages.value.length) currentIndex.value = localImages.value.length - 1
  resetTransform()
}

const selectImage = (i) => {
  if (i === currentIndex.value) return
  currentIndex.value = i
  resetTransform()
}

/* ================= ROTATE VIA CANVAS ================= */

/**
 * rotateFileByCanvas
 * Rotate File lokal pakai canvas → File baru.
 * Hanya untuk gambar yang punya .file (bukan dari server) sehingga
 * tidak ada masalah CORS / tainted canvas.
 */
const rotateFileByCanvas = (file, rotation, filename, mimeType) => {
  return new Promise((resolve, reject) => {
    const img     = new Image()
    const blobUrl = URL.createObjectURL(file)

    img.onload = () => {
      const rad    = (rotation * Math.PI) / 180
      const sin    = Math.abs(Math.sin(rad))
      const cos    = Math.abs(Math.cos(rad))
      const width  = Math.round(img.width * cos + img.height * sin)
      const height = Math.round(img.width * sin + img.height * cos)

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.translate(width / 2, height / 2)
      ctx.rotate(rad)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)

      URL.revokeObjectURL(blobUrl)

      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Canvas toBlob gagal')); return }
        resolve(new File([blob], filename || 'image.jpg', { type: mimeType || 'image/jpeg' }))
      }, mimeType || 'image/jpeg', 0.92)
    }

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      reject(new Error('Gagal load gambar untuk rotate'))
    }

    img.src = blobUrl
  })
}

/* ================= SAVE ================= */

const isSaving = ref(false)

/**
 * save — apply rotation (hanya gambar baru) via canvas, lalu emit ke ImageInput.
 * Gambar dari server langsung di-emit tanpa modifikasi.
 */
const save = async () => {
  if (isSaving.value) return
  isSaving.value = true

  try {
    const processed = await Promise.all(
      localImages.value.map(async (img) => {
        // Gambar dari server → tidak di-rotate, langsung return
        if (!isNewImage(img)) return { ...img, rotation: 0 }

        const rot = ((img.rotation || 0) % 360 + 360) % 360
        if (rot === 0) return { ...img, rotation: 0 }

        // Gambar baru dengan rotation → apply via canvas
        const rotated = await rotateFileByCanvas(
          img.file,
          rot,
          img.file.name,
          img.file.type
        )

        if (img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)

        return {
          ...img,
          file:     rotated,
          url:      URL.createObjectURL(rotated),
          rotation: 0
        }
      })
    )

    emit('save', processed)
  } catch (err) {
    console.error('[ImagePreviewModal] Gagal apply rotation:', err)
    emit('save', localImages.value)
  } finally {
    isSaving.value = false
  }
}

/* ================= CLEANUP ================= */

onBeforeUnmount(() => {
  localImages.value.forEach(img => {
    if (isNewImage(img) && img.url?.startsWith('blob:')) {
      URL.revokeObjectURL(img.url)
    }
  })
})
</script>