<!-- components/inspection/inputs/DateTimeInput.vue -->
<template>
  <div class="space-y-1">
    <input
      type="datetime-local"
      :value="modelValue"
      @input="handleInput"
      @blur="validate"
      :min="minDateTime"
      :max="maxDateTime"
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

// Konversi min_date ke format yang bisa digunakan oleh datetime-local input
const minDateTime = computed(() => {
  if (!settings.value?.min_date) return undefined
  
  // Jika hanya format tanggal (YYYY-MM-DD), tambahkan waktu awal hari
  if (settings.value.min_date.length === 10 && settings.value.min_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return `${settings.value.min_date}T00:00`
  }
  
  // Jika sudah format datetime, ganti spasi dengan T jika perlu
  return settings.value.min_date.replace(' ', 'T')
})

// Konversi max_date ke format yang bisa digunakan oleh datetime-local input
const maxDateTime = computed(() => {
  if (!settings.value?.max_date) return undefined
  
  // Jika hanya format tanggal (YYYY-MM-DD), tambahkan waktu akhir hari
  if (settings.value.max_date.length === 10 && settings.value.max_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return `${settings.value.max_date}T23:59`
  }
  
  // Jika sudah format datetime, ganti spasi dengan T jika perlu
  return settings.value.max_date.replace(' ', 'T')
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
    const selectedDate = new Date(value)
    
    // Validasi min_date
    if (settings.value?.min_date) {
      const minDate = new Date(settings.value.min_date)
      
      // Set minDate ke awal hari jika hanya tanggal
      if (isDateOnly(settings.value.min_date)) {
        minDate.setHours(0, 0, 0, 0)
      }
      
      if (selectedDate < minDate) {
        error = `Waktu minimal ${formatDateTime(settings.value.min_date)}`
      }
    }
    
    // Validasi max_date
    if (settings.value?.max_date && !error) {
      const maxDate = new Date(settings.value.max_date)
      
      // Set maxDate ke akhir hari jika hanya tanggal
      if (isDateOnly(settings.value.max_date)) {
        maxDate.setHours(23, 59, 59, 999)
      }
      
      if (selectedDate > maxDate) {
        error = `Waktu maksimal ${formatDateTime(settings.value.max_date)}`
      }
    }
  }
  
  emit('update:error', error)
}

// Helper untuk cek apakah string hanya berisi tanggal (tanpa waktu)
const isDateOnly = (dateStr: string): boolean => {
  return dateStr.length === 10 && dateStr.match(/^\d{4}-\d{2}-\d{2}$/) !== null
}

const formatDateTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    
    // Jika hanya tanggal, format sebagai tanggal saja
    if (isDateOnly(dateStr)) {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }
    
    // Jika dengan waktu, format lengkap
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

const validate = () => {
  validateField(props.modelValue)
}
</script>