<!-- components/inspection/inputs/SelectInput.vue -->
<template>
  <div class="space-y-1 relative">

    <!-- =========================
         SEARCHABLE MODE
    ========================== -->
    <template v-if="isSearchable">

      <input
        type="text"
        v-model="search"
        @focus="open = true"
        @blur="handleBlur"
        :placeholder="settings.placeholder || 'Pilih...'"
        :class="inputClass"
      />

      <div
        v-if="open"
        class="absolute z-50 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-60 overflow-auto shadow-lg"
      >
        <div
          v-for="option in filteredOptions"
          :key="option.value"
          @mousedown.prevent="selectOption(option)"
          class="px-4 py-2 hover:bg-blue-50 cursor-pointer"
        >
          {{ option.label }}
        </div>

        <div
          v-if="filteredOptions.length === 0"
          class="px-4 py-2 text-gray-400"
        >
          Tidak ditemukan
        </div>
      </div>

    </template>

    <!-- =========================
         NORMAL SELECT MODE
    ========================== -->
    <template v-else>

      <select
        :value="modelValue ?? ''"
        @change="handleNormalSelect"
        @blur="validate"
        :class="inputClass"
      >
        <option value="" disabled>
          {{ settings.placeholder || 'Pilih...' }}
        </option>

        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

    </template>

    <!-- =========================
         OPTION RENDERER - Menggunakan pola yang sama dengan RadioInput
    ========================== -->
    <div class="space-y-4 mt-3">
      <OptionRenderer
        v-if="selectedOption"
        :key="selectedOption.value"
        :inspectionId="inspectionId"
        :option="getOptionForRenderer"
        :parent-item-id="item.id"
        :inspection-item-id="item.inspection_item_id"
        :option-value="selectedOption.value"
        :nested-value="getNestedValueForOption(selectedOption.value)"
        :nested-error="getNestedErrorForOption(selectedOption.value)"
        @update:nested-value="handleNestedValueUpdate"
        @update:nested-error="handleNestedErrorUpdate"
        @update:upload-status="handleOptionUploadStatus"
      />
    </div>

    <!-- =========================
         ERROR
    ========================== -->
    <div
      v-if="error"
      class="text-xs text-red-500 mt-1"
    >
      {{ error }}
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import OptionRenderer from './options/OptionRenderer.vue';
import type { FormItem } from '../../../types/formInspection'

const props = defineProps<{
  item: FormItem
  inspectionId: number
  modelValue: any
  error?: string
  nestedValues?: any
  nestedErrors?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'update:error', error: string): void
  (e: 'update:nestedValue', optionValue: string, field: 'textarea' | 'image'|'damage_ids', value: any): void
  (e: 'update:nestedError', optionValue: string, field: 'textarea' | 'image', error: string): void
  (e: 'update:uploadStatus', status: { hasUploading: boolean; hasFailed: boolean }): void
}>()

/* =========================
   SETTINGS
========================= */
const settings = computed(() => props.item.settings || {})
const isSearchable = computed(() => settings.value?.searchable === true)
const options = computed(() => settings.value?.options || [])

/* =========================
   SEARCH STATE
========================= */
const search = ref('')
const open = ref(false)

/* =========================
   FILTERED OPTIONS
========================= */
const filteredOptions = computed(() => {
  if (!search.value) return options.value
  return options.value.filter(opt =>
    opt.label?.toLowerCase().includes(search.value.toLowerCase())
  )
})

/* =========================
   SELECTED OPTION
========================= */
const selectedOption = computed(() =>
  options.value.find(o => o.value === props.modelValue)
)

/* =========================
   OPTION UNTUK RENDERER
========================= */
const getOptionForRenderer = computed(() => {
  return selectedOption.value || null
})

/* =========================
   UPLOAD STATUS TRACKING
========================= */

// Select hanya punya satu OptionRenderer sekaligus,
// tapi tetap pakai pola yang sama dengan RadioInput agar konsisten
const optionUploadStatuses = ref<Record<string, { hasUploading: boolean; hasFailed: boolean }>>({})

const handleOptionUploadStatus = (optionValue: string, status: { hasUploading: boolean; hasFailed: boolean }) => {
  if (!status.hasUploading && !status.hasFailed) {
    delete optionUploadStatuses.value[optionValue]
  } else {
    optionUploadStatuses.value[optionValue] = status
  }

  const anyUploading = Object.values(optionUploadStatuses.value).some(s => s.hasUploading)
  const anyFailed    = Object.values(optionUploadStatuses.value).some(s => s.hasFailed)
  emit('update:uploadStatus', { hasUploading: anyUploading, hasFailed: anyFailed })
}

/* =========================
   NESTED VALUES MANAGEMENT
========================= */
const getNestedValueForOption = (optionValue: string) => {
  return props.nestedValues?.[optionValue] || null
}

const getNestedErrorForOption = (optionValue: string) => {
  return props.nestedErrors?.[optionValue] || null
}

/* =========================
   RESET HELPERS
========================= */
const resetAllDataForOption = (optionValue: string) => {
  const option = options.value.find(o => o.value === optionValue)
  
  if (option) {
    if (option.show_textarea) {
      emit('update:nestedValue', optionValue, 'textarea', null)
      emit('update:nestedError', optionValue, 'textarea', '')
    }
    
    if (option.show_image) {
      emit('update:nestedValue', optionValue, 'image', null)
      emit('update:nestedError', optionValue, 'image', '')
    }
    
    // Reset upload status untuk option ini
    delete optionUploadStatuses.value[optionValue]
    emit('update:uploadStatus', { hasUploading: false, hasFailed: false })
  }
}

const resetAllDataForCurrentOption = () => {
  if (props.modelValue) {
    resetAllDataForOption(props.modelValue)
  }
}

/* =========================
   WATCH MODEL (sync search)
========================= */
watch(
  () => props.modelValue,
  (val) => {
    const found = options.value.find(o => o.value === val)
    if (found) {
      search.value = found.label
    } else {
      search.value = ''
    }
    
    if (!val) {
      resetAllDataForCurrentOption()
    }
  },
  { immediate: true }
)

/* =========================
   HANDLERS
========================= */
const selectOption = (option: any) => {
  if (props.modelValue === option.value) {
    search.value = option.label
    open.value = false
    return
  }
  
  if (props.modelValue) {
    resetAllDataForOption(props.modelValue)
  }
  
  search.value = option.label
  emit('update:modelValue', option.value)
  validateField(option.value)
  open.value = false
}

const handleNormalSelect = (e: Event) => {
  const value = (e.target as HTMLSelectElement).value
  
  if (props.modelValue === value) return
  
  if (props.modelValue) {
    resetAllDataForOption(props.modelValue)
  }
  
  emit('update:modelValue', value)
  validateField(value)
}

const handleBlur = () => {
  setTimeout(() => {
    open.value = false
    validate()
  }, 150)
}

/* =========================
   NESTED VALUES HANDLERS
========================= */
const handleNestedValueUpdate = (optionValue: string, field: 'textarea' | 'image'|'damage_ids', value: any) => {
  emit('update:nestedValue', optionValue, field, value)
}

const handleNestedErrorUpdate = (optionValue: string, field: 'textarea' | 'image', error: string) => {
  emit('update:nestedError', optionValue, field, error)
}

/* =========================
   VALIDATION
========================= */
const validateField = (value: any) => {
  let errorMessage = ''
  if (props.item.is_required && !value) {
    errorMessage = 'Field ini harus diisi'
  }
  emit('update:error', errorMessage)
}

const validate = () => {
  validateField(props.modelValue)
}

/* =========================
   WATCH UNTUK RESET KETIKA COMPONENT DI-RELOAD
   - Hanya watch item.id / inspection_item_id, BUKAN deep watch
   - Deep watch akan trigger setiap parent re-render (misal: validasi error
     dari field lain), sehingga data nested ter-reset secara tidak sengaja
========================= */
watch(
  () => `${props.item.id}_${props.item.inspection_item_id}`,
  (newKey, oldKey) => {
    if (newKey !== oldKey && props.modelValue) {
      resetAllDataForOption(props.modelValue)
    }
  }
)

/* =========================
   CLASS
========================= */
const inputClass = computed(() => [
  'w-full px-4 py-2.5 border rounded-lg outline-none transition-colors bg-white',
  props.error
    ? 'border-red-300 bg-red-50'
    : 'border-gray-200 hover:border-gray-300'
])
</script>