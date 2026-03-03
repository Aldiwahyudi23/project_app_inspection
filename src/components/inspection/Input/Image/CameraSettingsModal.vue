
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { CameraSource } from '../../../../types/formInspection'
import { useCameraSettings } from '../../../../composables/useCameraSettings'

interface Props {
  show: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update'): void
}>()

// Composable
const { settings, setCameraSource } = useCameraSettings()

// Sync state
const selectedSource = ref<CameraSource>(settings.value.source)

watch(() => settings.value.source, (newSource) => {
  selectedSource.value = newSource
})

// Update source (auto save)
const updateSource = (source: CameraSource) => {
  selectedSource.value = source
  setCameraSource(source)
  emit('update')
}

// Close hanya dari tombol X
const closeModal = () => {
  emit('close')
}

// 🔒 Disable ESC
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    e.preventDefault()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Options
const sourceOptions = [
  { value: 'camera', label: 'Kamera', icon: 'camera', description: 'Ambil foto langsung dari kamera' },
  { value: 'gallery', label: 'Galeri', icon: 'photo', description: 'Pilih foto dari galeri' },
  { value: 'ask', label: 'Selalu Tanya', icon: 'question', description: 'Tanya setiap kali akan mengambil gambar' }
] as const
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      <!-- Backdrop (tidak bisa klik close) -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <!-- Modal -->
      <div
        class="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl
               animate-slide-up sm:animate-fade-in"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <div class="flex items-center space-x-2">
            <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 class="text-lg font-semibold text-gray-900">
              Pengaturan Kamera
            </h2>
          </div>

          <!-- SATU-SATUNYA CLOSE -->
          <button
            @click="closeModal"
            class="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6">
          <p class="text-sm text-gray-600 mb-4">
            Pilih sumber gambar default untuk pengambilan foto
          </p>

          <div class="space-y-3">
            <div
              v-for="option in sourceOptions"
              :key="option.value"
              @click="updateSource(option.value)"
              class="relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all
                     hover:border-blue-200 hover:bg-blue-50/50"
              :class="selectedSource === option.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'"
            >
              <!-- Radio -->
              <div class="absolute right-4 top-1/2 -translate-y-1/2">
                <div
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  :class="selectedSource === option.value
                    ? 'border-blue-500'
                    : 'border-gray-300'"
                >
                  <div
                    v-if="selectedSource === option.value"
                    class="w-3 h-3 rounded-full bg-blue-500"
                  ></div>
                </div>
              </div>

              <!-- Icon -->
              <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                <svg v-if="option.icon === 'camera'" class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>

                <svg v-else-if="option.icon === 'photo'" class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>

                <svg v-else class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div>
                <h3 class="font-medium text-gray-900">{{ option.label }}</h3>
                <p class="text-sm text-gray-500">{{ option.description }}</p>
              </div>
            </div>
          </div>

          <div class="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div class="flex items-start space-x-2">
              <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-sm text-blue-700">
                <span class="font-medium">Info:</span>
                Pengaturan ini otomatis tersimpan untuk semua input gambar.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes fade-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

@media (min-width: 640px) {
  .animate-slide-up {
    animation: fade-in 0.2s ease-out;
  }
}
</style>