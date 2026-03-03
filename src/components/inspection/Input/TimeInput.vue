<!-- components/inspection/inputs/TimeInput.vue -->
<template>
  <div class="space-y-1">
    <input
      type="time"
      :value="modelValue"
      @input="handleInput"
      @blur="validate"
      :min="settings.min_time"
      :max="settings.max_time"
      :step="timeStep"
      :class="[
        'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-colors',
        error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300',
        !modelValue && !error ? 'text-gray-400' : 'text-gray-700'
      ]"
    />
    <div v-if="error" class="text-xs text-red-500 mt-1 flex items-center">
      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FormItem } from '../../../types/formInspection'

const props = defineProps<{
  item: FormItem
  modelValue: any
  error?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'update:error', error: string): void
}>()

const settings = computed(() => props.item.settings || {})

// Konversi step_minutes ke detik untuk HTML5 time input
const timeStep = computed(() => {
  if (settings.value?.step_minutes) {
    return settings.value.step_minutes * 60
  }
  return 60 // Default 1 menit
})

const handleInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
  validateField(value)
}

const validateField = (value: string) => {
  let error = ''
  
  if (props.item.is_required && !value) {
    error = 'Field ini harus diisi'
  } else if (value) {
    // Validasi format waktu (HH:MM)
    if (!value.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      error = 'Format waktu tidak valid'
    } else {
      if (settings.value?.min_time && value < settings.value.min_time) {
        error = `Waktu minimal ${settings.value.min_time}`
      } else if (settings.value?.max_time && value > settings.value.max_time) {
        error = `Waktu maksimal ${settings.value.max_time}`
      }
      
      // Validasi step minutes
      if (settings.value?.step_minutes && !error) {
        const [hours, minutes] = value.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes
        
        if (totalMinutes % settings.value.step_minutes !== 0) {
          error = `Waktu harus kelipatan ${settings.value.step_minutes} menit`
        }
      }
    }
  }
  
  emit('update:error', error)
}

const validate = () => {
  validateField(props.modelValue)
}
</script>