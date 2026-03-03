<template>
  <div class="space-y-1">
    <div class="relative">
      <!-- PREFIX -->
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
        {{ settings.currency_symbol || 'Rp' }}
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
          'w-full pl-12 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-colors',
          error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
        ]"
      />
    </div>

    <!-- ERROR -->
    <div v-if="error" class="text-xs text-red-500 mt-1 flex items-center">
      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ error }}
    </div>

    <!-- HELP TEXT -->
    <div v-if="settings.help_text" class="text-xs text-gray-400">
      {{ settings.help_text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

// ----------------------
// DISPLAY VALUE REALTIME
// ----------------------
const displayValue = ref('')

// Format number ke mata uang
const formatNumber = (num: number | null) => {
  if (num === null || num === undefined) return ''
  let n = Number(num)
  const decimal = settings.value.decimal_places ?? 0
  n = parseFloat(n.toFixed(decimal))
  return n.toLocaleString('id-ID', {
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal
  })
}

// Parse input string ke number
const parseInput = (value: string) => {
  if (!value) return null
  let n = value.replace(/[^\d.,-]/g, '')
  n = n.replace(/\./g, '')  // hapus titik ribuan
  n = n.replace(/,/g, '.')  // ubah koma jadi titik
  let num = parseFloat(n)
  if (isNaN(num)) return null
  const decimal = settings.value.decimal_places ?? 0
  num = parseFloat(num.toFixed(decimal))
  if (!settings.value.allow_negative && num < 0) num = Math.abs(num)
  return num
}

// Update displayValue saat modelValue berubah
watch(
  () => props.modelValue,
  (val) => {
    displayValue.value = formatNumber(val)
  },
  { immediate: true }
)

// ----------------------
// HANDLE INPUT REALTIME
// ----------------------
const handleInput = (e: Event) => {
  const el = e.target as HTMLInputElement
  const raw = el.value
  const caretStart = el.selectionStart || 0

  let numeric = parseInput(raw)
  if (numeric !== null) {
    const formatted = formatNumber(numeric)
    displayValue.value = formatted

    // set caret
    const diff = formatted.length - raw.length
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = Math.min(caretStart + diff, formatted.length)
    })
  } else {
    displayValue.value = ''
  }

  emit('update:modelValue', numeric)
  validateField(numeric)
}

// ----------------------
// KEYDOWN ONLY ANGKA + DECIMAL
// ----------------------
const handleKeydown = (e: KeyboardEvent) => {
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter']
  const isNumber = /[0-9]/.test(e.key)
  const isDecimal = (e.key === '.' || e.key === ',') && (settings.value.decimal_places ?? 0) > 0
  if (!isNumber && !allowedKeys.includes(e.key) && !isDecimal) e.preventDefault()
}

// ----------------------
// VALIDASI MIN/MAX
// ----------------------
const validateField = (value: number | null) => {
  let error = ''
  if (props.item.is_required && (value === null || value === undefined)) {
    error = 'Field ini harus diisi'
  } else if (value !== null) {
    if (settings.value.min_amount !== null && settings.value.min_amount !== undefined && value < Number(settings.value.min_amount)) {
      error = `Minimal ${formatNumber(settings.value.min_amount)}`
    } else if (settings.value.max_amount !== null && settings.value.max_amount !== undefined && value > Number(settings.value.max_amount)) {
      error = `Maksimal ${formatNumber(settings.value.max_amount)}`
    }
  }
  emit('update:error', error)
}

const validate = () => {
  validateField(props.modelValue)
}
</script>