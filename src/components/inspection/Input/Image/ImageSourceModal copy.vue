<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      <!-- Backdrop (TIDAK BISA DIKLIK) -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      ></div>

      <!-- Modal Content -->
      <div
        class="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl
               animate-slide-up sm:animate-fade-in p-6"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-gray-900">
            Pilih Sumber Gambar
          </h4>

          <!-- SATU-SATUNYA TOMBOL CLOSE -->
          <button
            @click="close"
            class="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              class="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Options -->
        <div class="flex gap-3">
          <!-- Kamera -->
          <button
            class="flex-1 flex flex-col items-center justify-center bg-gray-100 rounded-xl p-3
                   hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
            @click="select('camera')"
          >
            <svg
              class="w-8 h-8 text-gray-700 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span class="text-xs font-medium text-gray-900">
              Kamera
            </span>
          </button>

          <!-- Galeri -->
          <button
            class="flex-1 flex flex-col items-center justify-center bg-gray-100 rounded-xl p-3
                   hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
            @click="select('gallery')"
          >
            <svg
              class="w-8 h-8 text-gray-700 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span class="text-xs font-medium text-gray-900">
              Galeri
            </span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue"

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: "close"): void
  (e: "select", type: string): void
}>()

const close = () => {
  emit("close")
}

const select = (type: string) => {
  emit("select", type)
}

// 🔒 Disable ESC key
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    e.preventDefault()
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown)
})
</script>

<style scoped>
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
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