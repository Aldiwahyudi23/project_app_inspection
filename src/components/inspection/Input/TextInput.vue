<template>
  <div class="space-y-1">
    <input
      :type="inputType"
      :value="modelValue"
      @input="handleInput"
      @blur="validate"
      :placeholder="settings?.placeholder || `Masukkan ${item.inspection_item.name}`"
      :maxlength="settings?.max_length"
      :minlength="settings?.min_length"
      :class="[
        'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-colors',
        error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
      ]"
    />

    <div v-if="error" class="text-xs text-red-500 mt-1 flex items-center">
      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      {{ error }}
    </div>

    <div
      v-if="settings?.max_length && modelValue?.length"
      class="text-xs text-gray-400 text-right"
    >
      {{ modelValue.length }} / {{ settings.max_length }}
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

const settings = computed(() => props.item.settings)

const inputType = computed(() => {
  return 'text'
})

/**
 * 🔥 APPLY CAPITALIZATION (Sesuai Filament)
 */
const applyCapitalization = (value: string): string => {
  const mode = settings.value?.capitalization || 'none'

  switch (mode) {
    case 'characters': // Huruf Besar Semua
      return value.toUpperCase()

    case 'words': // Kapitalisasi Setiap Kata
      return value.replace(/\b\w/g, char => char.toUpperCase())

    case 'sentences': // Kapitalisasi Awal Kalimat
      return value
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, char => char.toUpperCase())

    case 'none':
    default:
      return value
  }
}

const handleInput = (e: Event) => {
  let value = (e.target as HTMLInputElement).value

  // Trim spaces
  if (settings.value?.trim_spaces) {
    value = value.trim()
  }

  // Remove special characters
  if (!settings.value?.allow_special_chars) {
    value = value.replace(/[^a-zA-Z0-9\s]/g, '')
  }

  // Remove spaces
  if (!settings.value?.allow_spaces) {
    value = value.replace(/\s/g, '')
  }

  // 🔥 APPLY CAPITALIZATION DI SINI
  value = applyCapitalization(value)

  emit('update:modelValue', value)
  validateField(value)
}

const validateField = (value: string) => {
  let error = ''

  if (props.item.is_required && !value) {
    error = 'Field ini harus diisi'
  } else if (
    settings.value?.min_length &&
    value.length < settings.value.min_length
  ) {
    error = `Minimal ${settings.value.min_length} karakter`
  } else if (
    settings.value?.max_length &&
    value.length > settings.value.max_length
  ) {
    error = `Maksimal ${settings.value.max_length} karakter`
  } else if (settings.value?.regex_pattern) {
    const regex = new RegExp(settings.value.regex_pattern)
    if (!regex.test(value)) {
      error = 'Format tidak sesuai'
    }
  }

  emit('update:error', error)
}

const validate = () => {
  validateField(props.modelValue || '')
}
</script>