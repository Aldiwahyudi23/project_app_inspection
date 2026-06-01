<!-- components/inspection/ItemDescriptionModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="desc">

      <div v-if="show" class="fixed inset-0 z-[60] flex items-center justify-center px-4" @click.self="$emit('close')">
        <div class="absolute inset-0 bg-black/40" @click="$emit('close')" />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
          <div class="flex items-start justify-between mb-3">
            <h3 class="font-semibold text-gray-800 pr-6">{{ name }}</h3>
            <button
              @click="$emit('close')"
              class="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p class="text-sm text-gray-600 leading-relaxed">{{ description }}</p>
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