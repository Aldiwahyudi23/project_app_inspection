<!-- components/inspection/ItemDescriptionModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="desc">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center px-5"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px]" @click="$emit('close')" />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
          <!-- Header -->
          <div class="px-5 pt-5 pb-3 flex items-start justify-between">
            <div class="flex-1 pr-4">
              <p class="text-xs font-medium text-blue-500 uppercase tracking-wide mb-1">Deskripsi Item</p>
              <h3 class="font-semibold text-gray-800 text-base leading-snug">{{ name }}</h3>
            </div>
            <button
              @click="$emit('close')"
              class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="h-px bg-gray-100 mx-5" />
          <!-- Body -->
          <div class="px-5 py-4">
            <p class="text-sm text-gray-600 leading-relaxed">{{ description }}</p>
          </div>
          <!-- Footer -->
          <div class="px-5 pb-5">
            <button
              @click="$emit('close')"
              class="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  name: string
  description: string
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>

<style scoped>
.desc-enter-active,
.desc-leave-active { transition: opacity 0.2s ease; }
.desc-enter-active .relative,
.desc-leave-active .relative { transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1); }
.desc-enter-from,
.desc-leave-to { opacity: 0; }
.desc-enter-from .relative,
.desc-leave-to .relative { transform: scale(0.9) translateY(8px); }
</style>