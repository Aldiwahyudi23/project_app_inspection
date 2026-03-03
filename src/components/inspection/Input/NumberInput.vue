hemm ini kurang enak di gunakan si , bisa seperti ini ga si 
<template>
  <div class="space-y-1">
    <div class="relative">
      <!-- PREFIX -->
      <span v-if="settings.prefix" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
        {{ settings.prefix }}
      </span>

      <!-- INPUT -->
      <input
        type="text"
        :value="displayValue"
        @input="handleInput"
        @keydown="handleKeydown"
        @blur="validate"
        :placeholder="`Masukkan ${item.inspection_item.name}`"
        :class="[
          'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-colors',
          settings.prefix ? 'pl-12' : '',
          settings.suffix ? 'pr-8' : '',
          error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
        ]"
      />

      <!-- SUFFIX -->
      <span v-if="settings.suffix" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
        {{ settings.suffix }}
      </span>
    </div>

    <!-- ERROR -->
    <div v-if="error" class="text-xs text-red-500 mt-1 flex items-center">
      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ error }}
    </div>

    <!-- MIN/MAX INFO
    <div v-if="settings.min || settings.max" class="text-xs text-gray-400">
      {{ settings.min !== null ? `Min: ${formatNumber(settings.min)}` : '' }}
      {{ settings.min !== null && settings.max !== null ? ' | ' : '' }}
      {{ settings.max !== null ? `Max: ${formatNumber(settings.max)}` : '' }}
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FormItem } from '../../../types/formInspection'

const props = defineProps<{
  item: FormItem
  modelValue: number | null
  error?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
  (e: 'update:error', error: string): void
}>()

const settings = computed(() => props.item.settings || {})

const displayValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) return ''
  return formatNumber(props.modelValue)
})

const formatNumber = (num: number | string) => {
  if (num === null || num === undefined) return ''
  let n = Number(num)
  if (settings.value.decimal_places !== undefined && settings.value.decimal_places !== null) {
    n = parseFloat(n.toFixed(Number(settings.value.decimal_places)))
  }
  if (settings.value.thousand_separator) {
    return n.toLocaleString('id-ID')
  }
  return n.toString()
}

// =======================
// PASTIKAN HANYA ANGKA
// =======================
const handleKeydown = (e: KeyboardEvent) => {
  const allowedKeys = [
    'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'
  ]
  const isNumber = /[0-9]/.test(e.key)
  const isDecimal = (e.key === '.' || e.key === ',') && settings.value.decimal_places !== 0

  if (!isNumber && !allowedKeys.includes(e.key) && !isDecimal) {
    e.preventDefault()
  }
}

const parseInput = (value: string) => {
  if (!value) return null
  let n = value.replace(/[^\d.,-]/g, '') // hapus semua selain angka, titik/koma/minus
  if (settings.value.thousand_separator) {
    n = n.replace(/\./g, '') // hapus titik ribuan
    n = n.replace(/,/g, '.') // ubah koma jadi titik
  }
  let num = parseFloat(n)
  if (isNaN(num)) return null
  // decimal places
  if (settings.value.decimal_places !== undefined && settings.value.decimal_places !== null) {
    num = parseFloat(num.toFixed(Number(settings.value.decimal_places)))
  }
  // allow negative
  if (!settings.value.allow_negative && num < 0) num = Math.abs(num)
  return num
}

const handleInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  const value = parseInput(input.value)
  emit('update:modelValue', value)
  validateField(value)
}

const validateField = (value: number | null) => {
  let error = ''
  if (props.item.is_required && (value === null || value === undefined)) {
    error = 'Field ini harus diisi'
  } else if (value !== null) {
    if (settings.value.min !== null && settings.value.min !== undefined && value < Number(settings.value.min)) {
      error = `Nilai minimal ${settings.value.min}`
    } else if (settings.value.max !== null && settings.value.max !== undefined && value > Number(settings.value.max)) {
      error = `Nilai maksimal ${settings.value.max}`
    }
  }
  emit('update:error', error)
}

const validate = () => {
  validateField(props.modelValue)
}
</script>