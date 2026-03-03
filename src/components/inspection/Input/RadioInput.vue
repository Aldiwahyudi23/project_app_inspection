<!-- components/inspection/inputs/RadioInput.vue -->
<template>
  <div class="space-y-4">

    <!-- =========================
         OPTIONS
    ========================== -->
    <div
      :class="[
        isHorizontal
          ? responsiveGridClass
          : 'space-y-2'
      ]"
    >
      <div
        v-for="option in options"
        :key="option.value"
      >
        <!-- ================= HORIZONTAL ================= -->
        <div
          v-if="isHorizontal"
          @click="handleSelect(option)"
          :class="[
            'text-center px-3 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer',
            isSelected(option)
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          ]"
        >
          {{ option.label }}
        </div>

        <!-- ================= VERTICAL ================= -->
        <div
          v-else
          class="flex items-center space-x-3 cursor-pointer"
          @click="handleSelect(option)"
        >
          <input
            type="radio"
            :checked="isSelected(option)"
            class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <span class="text-sm font-medium text-gray-700">
            {{ option.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- =========================
         OPTION RENDERER - SELALU PAKAI SATU RENDERER
         (Tapi datanya sudah di-aggregate)
    ========================== -->
    <div class="space-y-4">
      <!-- SINGLE MODE - Render per option yang dipilih -->
      <OptionRenderer
        v-for="option in rendererOptions"
        :key="option.renderKey"
        :option="option"
        :inspectionId="inspectionId"
        :parent-item-id="item.id"
        :inspection-item-id="item.inspection_item_id"
        :option-value="option.optionValue"
        :nested-value="getNestedValueForOption(option.optionValue)"
        :nested-error="getNestedErrorForOption(option.optionValue)"
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

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import OptionRenderer from './options/OptionRenderer.vue'
import type { FormItem } from '../../../types/formInspection'

const props = defineProps<{
  item: FormItem
  inspectionId : number
  modelValue: string | string[] | null
  error?: string
  nestedValues?: any
  nestedErrors?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
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
const isHorizontal = computed(() => settings.value.layout === 'horizontal')

/* =========================
   RESPONSIVE GRID
========================= */
const responsiveGridClass = computed(() => {
  const count = options.value.length
  if (count <= 2) return 'grid grid-cols-2 gap-2 md:flex md:flex-wrap'
  if (count === 3) return 'grid grid-cols-3 gap-2 md:flex md:flex-wrap'
  return 'grid grid-cols-3 gap-2 md:flex md:flex-wrap'
})

/* =========================
   CURRENT VALUES
========================= */
const currentValues = computed<string[]>(() => {
  if (!props.modelValue) return []
  return Array.isArray(props.modelValue)
    ? props.modelValue
    : [props.modelValue]
})

const isSelected = (option: any) => {
  return currentValues.value.includes(option.value)
}

const selectedOptions = computed(() =>
  options.value.filter(o => currentValues.value.includes(o.value))
)

/* =========================
   LOGIC UTAMA: Menentukan option untuk dirender
========================= */

// Tambah handler — merge semua option status
// Simpan per optionValue lalu emit aggregate
const optionUploadStatuses = ref<Record<string, { hasUploading: boolean; hasFailed: boolean }>>({})

const handleOptionUploadStatus = (optionValue: string, status: { hasUploading: boolean; hasFailed: boolean }) => {
  if (!status.hasUploading && !status.hasFailed) {
    delete optionUploadStatuses.value[optionValue]
  } else {
    optionUploadStatuses.value[optionValue] = status
  }

  // Emit aggregate: true jika ADA SATU SAJA option yang masih uploading/failed
  const anyUploading = Object.values(optionUploadStatuses.value).some(s => s.hasUploading)
  const anyFailed    = Object.values(optionUploadStatuses.value).some(s => s.hasFailed)
  emit('update:uploadStatus', { hasUploading: anyUploading, hasFailed: anyFailed })
}

/**
 * Menggabungkan multiple option menjadi SATU option agregat
 * dengan mengambil konfigurasi terbesar/terbanyak
 * HANYA dari option yang benar-benar memiliki show_* = true
 */
const aggregateOptions = (options: any[]) => {
  if (options.length === 0) return null
  
  // Filter options berdasarkan tipe yang akan di-aggregate
  const optionsWithTextarea = options.filter(o => o.show_textarea === true)
  const optionsWithImage = options.filter(o => o.show_image === true)
  const optionsWithDamage = options.filter(o => o.show_damage === true)
  
  const result: any = {
    // Metadata
    renderKey: 'aggregated_' + options.map(o => o.value).join('_'),
    optionValue: 'aggregated',
    label: options.map(o => o.label).join(' + '),
    multi: true,
    isAggregated: true,
    originalOptions: options.map(o => o.value),
    
    // Boolean flags - berdasarkan keberadaan option yang punya show_* = true
    show_textarea: optionsWithTextarea.length > 0,
    show_image: optionsWithImage.length > 0,
    show_damage: optionsWithDamage.length > 0,
    
    // Default values untuk field yang mungkin tidak ada
    textarea_is_required: false,
    image_is_required: false,
    rich_text: false,
    allow_html: false,
    
    // Numeric fields - default values
    rows: 3,
    max_length: null,
    min_length: null,
    max_size: null,
    max_files: null,
    max_width: null,
    max_height: null,
    compression_quality: null,
    
    // Array fields
    damage_ids: [],
    allowed_mimes: [],
    
    // Single value fields
    placeholder: null,
    aspect_ratio: null,
    damage_category_id: null
  }
  
  // ========== AGGREGATE TEXTAREAS ==========
  // Hanya proses jika ada option dengan show_textarea = true
  if (optionsWithTextarea.length > 0) {
    // Required - OR operation (jika salah satu required maka required)
    result.textarea_is_required = optionsWithTextarea.some(o => o.textarea_is_required === true)
    
    // Rich text - OR operation
    result.rich_text = optionsWithTextarea.some(o => o.rich_text === true)
    
    // Allow HTML - OR operation
    result.allow_html = optionsWithTextarea.some(o => o.allow_html === true)
    
    // Rows - ambil nilai MAX
    const rowsValues = optionsWithTextarea
      .map(o => o.rows)
      .filter(v => v !== undefined && v !== null && !isNaN(v))
    if (rowsValues.length > 0) {
      result.rows = Math.max(...rowsValues)
    }
    
    // Max length - ambil nilai MAX
    const maxLengthValues = optionsWithTextarea
      .map(o => o.max_length)
      .filter(v => v !== undefined && v !== null && !isNaN(v))
    if (maxLengthValues.length > 0) {
      result.max_length = Math.max(...maxLengthValues)
    }
    
    // Min length - ambil nilai MAX (karena min yang lebih besar lebih ketat)
    const minLengthValues = optionsWithTextarea
      .map(o => o.min_length)
      .filter(v => v !== undefined && v !== null && !isNaN(v))
    if (minLengthValues.length > 0) {
      result.min_length = Math.max(...minLengthValues)
    }
    
    // Placeholder - ambil yang pertama tidak null
    result.placeholder = optionsWithTextarea.find(o => o.placeholder)?.placeholder || null
  }
  
  // ========== AGGREGATE IMAGES ==========
  // Hanya proses jika ada option dengan show_image = true
  if (optionsWithImage.length > 0) {
    // Required - OR operation
    result.image_is_required = optionsWithImage.some(o => o.image_is_required === true)
    
    // Max size - ambil nilai MAX
    const maxSizeValues = optionsWithImage
      .map(o => o.max_size)
      .filter(v => v !== undefined && v !== null && !isNaN(v))
    if (maxSizeValues.length > 0) {
      result.max_size = Math.max(...maxSizeValues)
    }
    
    // Max files - ambil nilai MAX
    const maxFilesValues = optionsWithImage
      .map(o => o.max_files)
      .filter(v => v !== undefined && v !== null && !isNaN(v))
    if (maxFilesValues.length > 0) {
      result.max_files = Math.max(...maxFilesValues)
    }
    
    // Max width - ambil nilai MAX
    const maxWidthValues = optionsWithImage
      .map(o => o.max_width)
      .filter(v => v !== undefined && v !== null && !isNaN(v))
    if (maxWidthValues.length > 0) {
      result.max_width = Math.max(...maxWidthValues)
    }
    
    // Max height - ambil nilai MAX
    const maxHeightValues = optionsWithImage
      .map(o => o.max_height)
      .filter(v => v !== undefined && v !== null && !isNaN(v))
    if (maxHeightValues.length > 0) {
      result.max_height = Math.max(...maxHeightValues)
    }
    
    // Compression quality - ambil nilai MAX
    const compressionValues = optionsWithImage
      .map(o => o.compression_quality)
      .filter(v => v !== undefined && v !== null && !isNaN(v))
    if (compressionValues.length > 0) {
      result.compression_quality = Math.max(...compressionValues)
    }
    
    // Aspect ratio - ambil yang pertama tidak null
    result.aspect_ratio = optionsWithImage.find(o => o.aspect_ratio)?.aspect_ratio || null
    
    // Allowed mimes - gabungkan unique
    const allMimes = optionsWithImage.flatMap(o => o.allowed_mimes || [])
    if (allMimes.length > 0) {
      result.allowed_mimes = [...new Set(allMimes)]
    }
  }
  
  // ========== AGGREGATE DAMAGE ==========
  // Hanya proses jika ada option dengan show_damage = true
  if (optionsWithDamage.length > 0) {
    // Damage IDs - gabungkan unique
    const allDamageIds = optionsWithDamage.flatMap(o => o.damage_ids || [])
    if (allDamageIds.length > 0) {
      result.damage_ids = [...new Set(allDamageIds)]
    }
    
    // Damage category ID - ambil yang pertama tidak null
    result.damage_category_id = optionsWithDamage.find(o => o.damage_category_id)?.damage_category_id || null
  }
  
  return result
}

/**
 * Memisahkan option berdasarkan tipe untuk dirender secara terpisah
 */
const rendererOptions = computed(() => {
  const selected = selectedOptions.value
  
  if (selected.length === 0) return []
  
  // Pisahkan antara single (multi=false) dan multi (multi=true)
  const singleOptions = selected.filter(o => !o.multi)
  const multiOptions = selected.filter(o => o.multi === true)
  
  const result = []
  
  // 1. Single options - dirender satu per satu
  singleOptions.forEach(option => {
    result.push({
      ...option,
      renderKey: `single_${option.value}`,
      optionValue: option.value,
      isAggregated: false
    })
  })
  
  // 2. Multi options - digabung menjadi SATU aggregated option
  if (multiOptions.length > 0) {
    const aggregated = aggregateOptions(multiOptions)
    if (aggregated) {
      result.push(aggregated)
    }
  }
  
  return result
})

/* =========================
   NESTED VALUES MANAGEMENT
========================= */
const getNestedValueForOption = (optionValue: string) => {
  if (optionValue === 'aggregated') {
    // Untuk aggregated, kita perlu menggabungkan nilai dari semua option asli?
    // Atau pakai state terpisah? Saya sarankan pakai state terpisah untuk aggregated
    return props.nestedValues?.['aggregated'] || null
  }
  return props.nestedValues?.[optionValue] || null
}

const getNestedErrorForOption = (optionValue: string) => {
  if (optionValue === 'aggregated') {
    return props.nestedErrors?.['aggregated'] || null
  }
  return props.nestedErrors?.[optionValue] || null
}


/* =========================
   SELECT LOGIC
========================= */
const handleSelect = (option: any) => {
  const isMulti = option.multi === true
  let values = [...currentValues.value]

  if (!isMulti) {
    // Single mode - reset semua
    values = [option.value]
    
    // Hapus semua nested values untuk multi options yang tidak dipilih
    // (opsional: bersihkan data aggregated)
    emit('update:nestedValue', 'aggregated', 'textarea', null)
    emit('update:nestedValue', 'aggregated', 'image', null)
  } else {
    // Multi mode
    const isAlready = values.includes(option.value)
    const hasSingleSelected = values.some(v => {
      const found = options.value.find(o => o.value === v)
      return found && !found.multi
    })

    if (hasSingleSelected) {
      // Reset ke option multi ini saja
      values = [option.value]
      
      // Hapus nested values single options
      options.value
        .filter(o => !o.multi && values.includes(o.value))
        .forEach(o => {
          emit('update:nestedValue', o.value, 'textarea', null)
          emit('update:nestedValue', o.value, 'image', null)
        })
    } else {
      if (isAlready) {
        values = values.filter(v => v !== option.value)
        
        // Jika tidak ada multi options tersisa, hapus aggregated data
        if (values.filter(v => {
          const found = options.value.find(o => o.value === v)
          return found && found.multi
        }).length === 0) {
          emit('update:nestedValue', 'aggregated', 'textarea', null)
          emit('update:nestedValue', 'aggregated', 'image', null)
        }
      } else {
        values.push(option.value)
      }
    }
  }

  emit('update:modelValue', values.length === 1 ? values[0] : values)
  validateField(values)
}

/* =========================
   NESTED VALUES HANDLERS
========================= */
const handleNestedValueUpdate = (optionValue: string, field: 'textarea' | 'image', value: any) => {
  emit('update:nestedValue', optionValue, field, value)
}

const handleNestedErrorUpdate = (optionValue: string, field: 'textarea' | 'image', error: string) => {
  emit('update:nestedError', optionValue, field, error)
}

/* =========================
   VALIDATION
========================= */
const validateField = (values: string[]) => {
  let errorMessage = ''
  if (props.item.is_required && values.length === 0) {
    errorMessage = 'Field ini harus diisi'
  }
  emit('update:error', errorMessage)
}
</script>