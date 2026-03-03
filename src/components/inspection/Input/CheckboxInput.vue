<!-- components/inspection/inputs/CheckboxInput.vue -->
<template>
  <div class="space-y-3">

    <!-- =========================
         OPTIONS (TAMPILAN TETAP SEPERTI AWAL)
    ========================== -->
    <div
      :class="[
        isHorizontal
          ? 'flex flex-wrap gap-3'
          : 'space-y-2'
      ]"
    >

      <label
        v-for="option in options"
        :key="option.value"
        class="cursor-pointer"
      >

        <!-- ================= HORIZONTAL (Button Style) ================= -->
        <div
          v-if="isHorizontal"
          @click="handleChange(option)"
          :class="[
            'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
            isChecked(option.value)
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          ]"
        >
          {{ option.label }}
        </div>

        <!-- ================= VERTICAL (Classic Checkbox) ================= -->
        <div
          v-else
          class="flex items-center space-x-3"
        >
          <input
            type="checkbox"
            :checked="isChecked(option.value)"
            @change="handleChange(option)"
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />

          <span class="text-sm font-medium text-gray-700">
            {{ option.label }}
          </span>
        </div>

      </label>

    </div>

    <!-- =========================
         OPTION RENDERER - SATU SAJA UNTUK SEMUA OPTION YANG DIPILIH
    ========================== -->
    <div class="space-y-4">
      <OptionRenderer
        v-if="aggregatedOption"
        :key="aggregatedOption.renderKey"
        :option="aggregatedOption"
        :inspectionId="inspectionId"
        :parent-item-id="item.id"
        :inspection-item-id="item.inspection_item_id"
        option-value="aggregated"
        :nested-value="nestedValues?.aggregated"
        :nested-error="nestedErrors?.aggregated"
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
      class="text-xs text-red-500"
    >
      {{ error }}
    </div>

    <!-- =========================
         MIN / MAX INFO
    ========================== -->
    <div
      v-if="settings.min_selected || settings.max_selected"
      class="text-xs text-gray-400"
    >
      <span v-if="settings.min_selected">
        Minimal {{ settings.min_selected }} dipilih
      </span>

      <span
        v-if="settings.min_selected && settings.max_selected"
      >
        |
      </span>

      <span v-if="settings.max_selected">
        Maksimal {{ settings.max_selected }} dipilih
      </span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import OptionRenderer from './options/OptionRenderer.vue';
import type { FormItem } from '../../../types/formInspection'

const props = defineProps<{
  item: FormItem
  inspectionId : number
  modelValue: string[] | null
  error?: string
  nestedValues?: any
  nestedErrors?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
  (e: 'update:error', error: string): void
  (e: 'update:nestedValue', optionValue: string, field: 'textarea' | 'image', value: any): void
  (e: 'update:nestedError', optionValue: string, field: 'textarea' | 'image', error: string): void
  (e: 'update:uploadStatus', status: { hasUploading: boolean; hasFailed: boolean }): void
}>()

/* =========================
   SETTINGS
========================= */

const settings = computed(() => props.item.settings || {})

const options = computed(() => settings.value.options || [])

const isHorizontal = computed(() =>
  settings.value.layout === 'horizontal'
)

/* =========================
   CHECK STATE
========================= */

const currentValues = computed(() =>
  props.modelValue ?? []
)

const isChecked = (value: string) => {
  return currentValues.value.includes(value)
}

/* =========================
   SELECTED OPTIONS
========================= */

const selectedOptions = computed(() =>
  options.value.filter(o =>
    currentValues.value.includes(o.value)
  )
)

/* =========================
   UPLOAD STATUS TRACKING
========================= */

// Checkbox hanya punya satu OptionRenderer (aggregated),
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
   AGGREGATED OPTION - GABUNGKAN SEMUA OPTION YANG DIPILIH
========================= */

/**
 * Menggabungkan semua option yang dipilih menjadi SATU option agregat
 */
const aggregateOptions = (options: any[]) => {
  if (options.length === 0) return null
  
  const optionsWithTextarea = options.filter(o => o.show_textarea === true)
  const optionsWithImage = options.filter(o => o.show_image === true)
  const optionsWithDamage = options.filter(o => o.show_damage === true)
  
  const result: any = {
    renderKey: 'aggregated_' + options.map(o => o.value).join('_'),
    optionValue: 'aggregated',
    label: options.map(o => o.label).join(' + '),
    isAggregated: true,
    originalOptions: options.map(o => o.value),
    
    show_textarea: optionsWithTextarea.length > 0,
    show_image: optionsWithImage.length > 0,
    show_damage: optionsWithDamage.length > 0,
    
    textarea_is_required: false,
    image_is_required: false,
    rich_text: false,
    allow_html: false,
    
    rows: 3,
    max_length: null,
    min_length: null,
    max_size: null,
    max_files: null,
    max_width: null,
    max_height: null,
    compression_quality: null,
    
    damage_ids: [],
    allowed_mimes: [],
    
    placeholder: null,
    aspect_ratio: null,
    damage_category_id: null
  }
  
  if (optionsWithTextarea.length > 0) {
    result.textarea_is_required = optionsWithTextarea.some(o => o.textarea_is_required === true)
    result.rich_text = optionsWithTextarea.some(o => o.rich_text === true)
    result.allow_html = optionsWithTextarea.some(o => o.allow_html === true)
    
    const rowsValues = optionsWithTextarea.map(o => o.rows).filter(v => v !== undefined && v !== null && !isNaN(v))
    if (rowsValues.length > 0) result.rows = Math.max(...rowsValues)
    
    const maxLengthValues = optionsWithTextarea.map(o => o.max_length).filter(v => v !== undefined && v !== null && !isNaN(v))
    if (maxLengthValues.length > 0) result.max_length = Math.max(...maxLengthValues)
    
    const minLengthValues = optionsWithTextarea.map(o => o.min_length).filter(v => v !== undefined && v !== null && !isNaN(v))
    if (minLengthValues.length > 0) result.min_length = Math.max(...minLengthValues)
    
    result.placeholder = optionsWithTextarea.find(o => o.placeholder)?.placeholder || null
  }
  
  if (optionsWithImage.length > 0) {
    result.image_is_required = optionsWithImage.some(o => o.image_is_required === true)
    
    const maxSizeValues = optionsWithImage.map(o => o.max_size).filter(v => v !== undefined && v !== null && !isNaN(v))
    if (maxSizeValues.length > 0) result.max_size = Math.max(...maxSizeValues)
    
    const maxFilesValues = optionsWithImage.map(o => o.max_files).filter(v => v !== undefined && v !== null && !isNaN(v))
    if (maxFilesValues.length > 0) result.max_files = Math.max(...maxFilesValues)
    
    const maxWidthValues = optionsWithImage.map(o => o.max_width).filter(v => v !== undefined && v !== null && !isNaN(v))
    if (maxWidthValues.length > 0) result.max_width = Math.max(...maxWidthValues)
    
    const maxHeightValues = optionsWithImage.map(o => o.max_height).filter(v => v !== undefined && v !== null && !isNaN(v))
    if (maxHeightValues.length > 0) result.max_height = Math.max(...maxHeightValues)
    
    const compressionValues = optionsWithImage.map(o => o.compression_quality).filter(v => v !== undefined && v !== null && !isNaN(v))
    if (compressionValues.length > 0) result.compression_quality = Math.max(...compressionValues)
    
    result.aspect_ratio = optionsWithImage.find(o => o.aspect_ratio)?.aspect_ratio || null
    
    const allMimes = optionsWithImage.flatMap(o => o.allowed_mimes || [])
    if (allMimes.length > 0) result.allowed_mimes = [...new Set(allMimes)]
  }
  
  if (optionsWithDamage.length > 0) {
    const allDamageIds = optionsWithDamage.flatMap(o => o.damage_ids || [])
    if (allDamageIds.length > 0) result.damage_ids = [...new Set(allDamageIds)]
    
    result.damage_category_id = optionsWithDamage.find(o => o.damage_category_id)?.damage_category_id || null
  }
  
  return result
}

const aggregatedOption = computed(() => {
  const selected = selectedOptions.value
  
  const optionsWithContent = selected.filter(o => 
    o.show_textarea || o.show_image || o.show_damage
  )
  
  if (optionsWithContent.length === 0) return null
  
  return aggregateOptions(optionsWithContent)
})

/* =========================
   HANDLE CHANGE
========================= */

const handleChange = (option: any) => {
  let values = [...currentValues.value]

  if (isChecked(option.value)) {
    values = values.filter(v => v !== option.value)
    
    if (values.length === 0) {
      emit('update:nestedValue', 'aggregated', 'textarea', null)
      emit('update:nestedValue', 'aggregated', 'image', null)
      // Reset upload status ketika semua option di-uncheck
      optionUploadStatuses.value = {}
      emit('update:uploadStatus', { hasUploading: false, hasFailed: false })
    }
  } else {
    if (
      settings.value.max_selected &&
      values.length >= settings.value.max_selected
    ) {
      return
    }

    values.push(option.value)
  }

  emit('update:modelValue', values)
  validateField(values)
}

/* =========================
   NESTED VALUES HANDLERS
========================= */

const handleNestedValueUpdate = (optionValue: string, field: 'textarea' | 'image', value: any) => {
  emit('update:nestedValue', 'aggregated', field, value)
}

const handleNestedErrorUpdate = (optionValue: string, field: 'textarea' | 'image', error: string) => {
  emit('update:nestedError', 'aggregated', field, error)
}

/* =========================
   VALIDATION
========================= */

const validateField = (values: string[]) => {
  let errorMessage = ''

  if (props.item.is_required && values.length === 0) {
    errorMessage = 'Field ini harus diisi'
  }

  if (
    settings.value.min_selected &&
    values.length < settings.value.min_selected
  ) {
    errorMessage = `Pilih minimal ${settings.value.min_selected} opsi`
  }

  if (
    settings.value.max_selected &&
    values.length > settings.value.max_selected
  ) {
    errorMessage = `Pilih maksimal ${settings.value.max_selected} opsi`
  }

  emit('update:error', errorMessage)
}
</script>