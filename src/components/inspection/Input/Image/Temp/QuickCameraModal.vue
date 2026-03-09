<!-- components/inspection/Input/Image/Temp/QuickCameraModal.vue -->
<!--
  Modal Foto Cepat — user bisa ambil banyak foto tanpa harus memilih item dulu.
  Semua foto diupload ke server dengan inspection_item_id = null (temp pool).
  Nanti di UnassignedGallery user bisa assign foto ke item yang tepat.
-->
<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 bg-black flex flex-col">

      <!-- HEADER -->
      <div class="flex items-center justify-between px-4 py-3 bg-black/80">
        <button
          @click="$emit('close')"
          class="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          <span class="text-sm font-medium">Kembali</span>
        </button>

        <div class="text-center">
          <p class="text-white font-semibold text-sm">Foto Cepat</p>
          <p class="text-white/60 text-xs">Foto dulu, isi detail nanti</p>
        </div>

        <!-- Counter gambar terupload -->
        <div class="flex items-center gap-1.5">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            :class="doneCount > 0 ? 'bg-green-500 text-white' : 'bg-white/20 text-white/60'"
          >
            {{ doneCount }}
          </div>
          <span class="text-white/60 text-xs">foto</span>
        </div>
      </div>

      <!-- GRID FOTO YANG SUDAH DIAMBIL -->
      <div
        v-if="localImages.length > 0"
        class="overflow-x-auto flex gap-2 px-4 py-2 bg-black/60"
        style="min-height: 80px;"
      >
        <div
          v-for="img in localImages"
          :key="img.localId"
          class="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-white/20"
        >
          <img
            :src="img.url"
            class="w-full h-full object-cover"
          />
          <!-- Status overlay -->
          <div
            v-if="img.status !== 'done'"
            class="absolute inset-0 bg-black/60 flex items-center justify-center"
          >
            <svg
              v-if="img.status === 'uploading' || img.status === 'pending'"
              class="w-5 h-5 text-white animate-spin"
              fill="none" viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <button
              v-else-if="img.status === 'failed'"
              @click="retryImage(img.localId)"
              class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
            >
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          </div>
          <!-- Checkmark done -->
          <div
            v-if="img.status === 'done'"
            class="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
          >
            <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <!-- Hapus -->
          <button
            v-if="img.status === 'done'"
            @click.stop="removeImage(img.localId)"
            class="absolute top-0.5 left-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
          >
            <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- AREA TENGAH: ikon kamera besar -->
      <div class="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        <div class="text-center">
          <div class="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-4 mx-auto">
            <svg class="w-12 h-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <p class="text-white/70 text-sm text-center leading-relaxed">
            Ambil foto sebanyak yang diperlukan.<br>
            Assign ke item nanti dari galeri.
          </p>
        </div>

        <!-- Pilihan sumber: kamera atau galeri -->
        <div class="flex gap-3 w-full max-w-xs">
          <button
            @click="triggerCapture('camera')"
            class="flex-1 flex flex-col items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30
                   rounded-2xl py-4 transition-colors"
          >
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span class="text-white text-xs font-medium">Kamera</span>
          </button>

          <button
            @click="triggerCapture('gallery')"
            class="flex-1 flex flex-col items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30
                   rounded-2xl py-4 transition-colors"
          >
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <span class="text-white text-xs font-medium">Galeri</span>
          </button>
        </div>
      </div>

      <!-- BOTTOM: tombol selesai -->
      <div class="px-4 pb-8 pt-4 bg-black/60">
        <button
          v-if="doneCount > 0"
          @click="$emit('close')"
          class="w-full py-3.5 bg-green-500 hover:bg-green-600 active:bg-green-700
                 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Selesai ({{ doneCount }} foto tersimpan)
        </button>
        <p v-else class="text-center text-white/40 text-sm">Ambil foto untuk memulai</p>
      </div>

      <!-- Hidden file input -->
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
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useTempImageStore } from '../../../../../stores/useTempImageStore';

const props = defineProps<{
  show:         boolean
  inspectionId: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store     = useTempImageStore()
const fileInput = ref<HTMLInputElement | null>(null)

// Gambar lokal untuk inspeksi ini
const localImages = computed(() => store.getByInspection(props.inspectionId))
const doneCount   = computed(() => localImages.value.filter(i => i.status === 'done').length)

// ── Trigger file input ────────────────────────────────────────

const triggerCapture = (type: 'camera' | 'gallery') => {
  if (!fileInput.value) return
  fileInput.value.value = ''
  fileInput.value.removeAttribute('capture')
  if (type === 'camera') fileInput.value.setAttribute('capture', 'environment')
  nextTick(() => fileInput.value?.click())
}

// ── Handle file select ────────────────────────────────────────

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return

  const files: File[] = []
  const rots: number[] = []

  for (const file of Array.from(input.files)) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) continue
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) continue
    files.push(file)
    rots.push(0)
  }

  if (!files.length) return

  store.addImages({
    files,
    rotations:    rots,
    inspectionId: props.inspectionId,
  })

  input.value = ''
}

// ── Actions ───────────────────────────────────────────────────

const retryImage  = (localId: string) => store.retryUpload(localId)
const removeImage = (localId: string) => store.removeImage(localId)

// Reset scroll saat buka
watch(() => props.show, (val) => {
  if (val && fileInput.value) fileInput.value.value = ''
})
</script>