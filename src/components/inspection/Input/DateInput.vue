<!-- components/inspection/inputs/DateInput.vue -->
<template>
  <div class="space-y-1">
    <input
      type="date"
      :value="modelValue"
      @input="handleInput"
      @blur="validate"
      :min="settings.min_date"
      :max="settings.max_date"
      :placeholder="settings.placeholder || 'Pilih tanggal'"
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
    if (settings.value?.min_date && value < settings.value.min_date) {
      error = `Tanggal minimal ${formatDate(settings.value.min_date)}`
    } else if (settings.value?.max_date && value > settings.value.max_date) {
      error = `Tanggal maksimal ${formatDate(settings.value.max_date)}`
    }
  }
  
  emit('update:error', error)
}

const formatDate = (date: string) => {
  try {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return date
  }
}

const validate = () => {
  validateField(props.modelValue)
}
</script>