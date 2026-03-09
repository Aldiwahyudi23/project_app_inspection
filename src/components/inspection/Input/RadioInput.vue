<!-- components/inspection/Input/RadioInput.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import OptionRenderer from './options/OptionRenderer.vue'
import type { FormItem } from '../../../types/formInspection'

/**
 * RadioInput — flat modelValue:
 *   null                         → belum dipilih
 *   { status: "Ada", ... }       → single option terpilih
 *   { status: ["A","B"], ... }   → multi option terpilih (option.multi = true)
 *
 * Konsep multi:
 *   - option.multi = false (default) → single selection, pilih satu reset lainnya
 *   - option.multi = true  → multi selection, bisa dipilih bersamaan dengan option multi lainnya
 *   - Memilih single saat ada multi terpilih → reset ke single saja
 *   - Memilih multi saat ada single terpilih → reset ke multi saja
 *
 * Nested renderer:
 *   - Single option → render optionnya langsung
 *   - Multi options → aggregate menjadi satu renderer gabungan
 */

export interface RadioFlatValue {
  status:      string | string[]
  note?:       string | null
  image?:      any[]  | null
  damage_ids?: number[]
}

const props = defineProps<{
  item:         FormItem
  inspectionId: number
  modelValue:   RadioFlatValue | null
  error?:       string
  disabled?:    boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue',   value: RadioFlatValue | null): void
  (e: 'update:error',        error: string): void
  (e: 'update:valid',        valid: boolean): void
  (e: 'update:uploadStatus', status: { hasUploading: boolean; hasFailed: boolean }): void
}>()

// ─────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────

const settings     = computed(() => props.item.settings || {})
const options      = computed<any[]>(() => settings.value.options || [])
const isHorizontal = computed(() => settings.value.layout === 'horizontal')

// ─────────────────────────────────────────────────────────────
// CURRENT STATUS — selalu sebagai array untuk kemudahan logika
// ─────────────────────────────────────────────────────────────

const currentStatusArr = computed<string[]>(() => {
  const s = props.modelValue?.status
  if (!s) return []
  return Array.isArray(s) ? s : [s]
})

const isSelected = (option: any): boolean =>
  currentStatusArr.value.includes(option.value)

// ─────────────────────────────────────────────────────────────
// SELECTED OPTIONS
// ─────────────────────────────────────────────────────────────

const selectedOptions = computed(() =>
  options.value.filter(o => currentStatusArr.value.includes(o.value))
)

// ─────────────────────────────────────────────────────────────
// AGGREGATE LOGIC
// Menggabungkan multiple option multi=true menjadi satu renderer
// ─────────────────────────────────────────────────────────────

const aggregateOptions = (opts: any[]): any => {
  if (opts.length === 0) return null

  const withTextarea = opts.filter(o => o.show_textarea === true)
  const withImage    = opts.filter(o => o.show_image    === true)
  const withDamage   = opts.filter(o => o.show_damage   === true)

  const result: any = {
    renderKey:        'aggregated_' + opts.map(o => o.value).join('_'),
    optionValue:      'aggregated',
    label:            opts.map(o => o.label).join(' + '),
    multi:            true,
    isAggregated:     true,
    originalOptions:  opts.map(o => o.value),

    show_textarea:        withTextarea.length > 0,
    show_image:           withImage.length    > 0,
    show_damage:          withDamage.length   > 0,

    textarea_is_required: false,
    image_is_required:    false,
    rich_text:            false,
    allow_html:           false,
    rows:                 3,
    max_length:           null,
    min_length:           null,
    max_size:             null,
    max_files:            null,
    max_width:            null,
    max_height:           null,
    compression_quality:  null,
    damage_ids:           [],
    allowed_mimes:        [],
    placeholder:          null,
    aspect_ratio:         null,
    damage_category_id:   null,
  }

  if (withTextarea.length > 0) {
    result.textarea_is_required = withTextarea.some(o => o.textarea_is_required === true)
    result.rich_text             = withTextarea.some(o => o.rich_text  === true)
    result.allow_html            = withTextarea.some(o => o.allow_html === true)
    const rows   = withTextarea.map(o => o.rows).filter((v: any) => v != null && !isNaN(v))
    const maxLen = withTextarea.map(o => o.max_length).filter((v: any) => v != null && !isNaN(v))
    const minLen = withTextarea.map(o => o.min_length).filter((v: any) => v != null && !isNaN(v))
    if (rows.length)   result.rows       = Math.max(...rows)
    if (maxLen.length) result.max_length = Math.max(...maxLen)
    if (minLen.length) result.min_length = Math.max(...minLen)
    result.placeholder = withTextarea.find((o: any) => o.placeholder)?.placeholder || null
  }

  if (withImage.length > 0) {
    result.image_is_required = withImage.some(o => o.image_is_required === true)
    const maxSize  = withImage.map(o => o.max_size).filter((v: any) => v != null && !isNaN(v))
    const maxFiles = withImage.map(o => o.max_files).filter((v: any) => v != null && !isNaN(v))
    const maxW     = withImage.map(o => o.max_width).filter((v: any) => v != null && !isNaN(v))
    const maxH     = withImage.map(o => o.max_height).filter((v: any) => v != null && !isNaN(v))
    const comp     = withImage.map(o => o.compression_quality).filter((v: any) => v != null && !isNaN(v))
    if (maxSize.length)  result.max_size            = Math.max(...maxSize)
    if (maxFiles.length) result.max_files           = Math.max(...maxFiles)
    if (maxW.length)     result.max_width           = Math.max(...maxW)
    if (maxH.length)     result.max_height          = Math.max(...maxH)
    if (comp.length)     result.compression_quality = Math.max(...comp)
    result.aspect_ratio  = withImage.find((o: any) => o.aspect_ratio)?.aspect_ratio || null
    const allMimes = withImage.flatMap((o: any) => o.allowed_mimes || [])
    if (allMimes.length) result.allowed_mimes = [...new Set(allMimes)]
  }

  if (withDamage.length > 0) {
    const allIds = withDamage.flatMap((o: any) => o.damage_ids || [])
    if (allIds.length) result.damage_ids = [...new Set(allIds)]
    result.damage_category_id = withDamage.find((o: any) => o.damage_category_id)?.damage_category_id || null
  }

  return result
}

// ─────────────────────────────────────────────────────────────
// RENDERER OPTIONS
// Single option → render langsung, Multi options → aggregate jadi satu
// ─────────────────────────────────────────────────────────────

const rendererOptions = computed(() => {
  const selected = selectedOptions.value
  if (selected.length === 0) return []

  const singles = selected.filter(o => !o.multi)
  const multis  = selected.filter(o => o.multi === true)

  const result: any[] = []

  singles.forEach(option => {
    if (!option.show_image && !option.show_textarea && !option.show_damage) return
    result.push({
      ...option,
      renderKey:    `single_${option.value}`,
      optionValue:  'aggregated',
      isAggregated: false,
    })
  })

  if (multis.length > 0) {
    const aggregated = aggregateOptions(multis)
    if (aggregated && (aggregated.show_textarea || aggregated.show_image || aggregated.show_damage)) {
      result.push(aggregated)
    }
  }

  return result
})

// ─────────────────────────────────────────────────────────────
// NESTED VALUE dari flat modelValue
// ─────────────────────────────────────────────────────────────

const currentNested = computed(() => {
  if (!props.modelValue) return null
  return {
    note:       props.modelValue.note       ?? null,
    image:      props.modelValue.image      ?? null,
    damage_ids: props.modelValue.damage_ids ?? [],
  }
})

// ─────────────────────────────────────────────────────────────
// UPLOAD STATUS (aggregate dari semua renderer)
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// VALIDASI
// ─────────────────────────────────────────────────────────────

const computeValid = (): boolean => {
  const val = props.modelValue
  if (!val || !val.status || (Array.isArray(val.status) && val.status.length === 0)) {
    return !props.item.is_required
  }

  const selected = selectedOptions.value
  if (selected.length === 0) return true

  const hasMulti = selected.some(o => o.multi === true)

  if (hasMulti) {
    // Validasi berdasarkan aggregated option
    const multis     = selected.filter(o => o.multi === true)
    const aggregated = aggregateOptions(multis)
    if (!aggregated) return true

    if (aggregated.show_textarea && aggregated.textarea_is_required) {
      const note = val.note
      if (!note || (typeof note === 'string' && note.trim() === '')) return false
      if (aggregated.min_length && typeof note === 'string' && note.length < Number(aggregated.min_length)) return false
    }
    if (aggregated.show_image && aggregated.image_is_required) {
      const img = val.image
      if (!img || (Array.isArray(img) && img.length === 0)) return false
    }
  } else {
    // Single option — validasi langsung
    const opt = selected[0]
    if (!opt) return true

    if (opt.show_textarea && opt.textarea_is_required) {
      const note = val.note
      if (!note || (typeof note === 'string' && note.trim() === '')) return false
      if (opt.min_length && typeof note === 'string' && note.length < Number(opt.min_length)) return false
      if (opt.max_length && typeof note === 'string' && note.length > Number(opt.max_length)) return false
    }
    if (opt.show_image && opt.image_is_required) {
      const img = val.image
      if (!img || (Array.isArray(img) && img.length === 0)) return false
    }
  }

  return true
}

watch(() => props.modelValue, () => {
  emit('update:valid', computeValid())
}, { deep: true, immediate: true })

// ─────────────────────────────────────────────────────────────
// SELECT HANDLER
// ─────────────────────────────────────────────────────────────

const handleSelect = (option: any) => {
  if (props.disabled) return

  const isMulti = option.multi === true
  let values    = [...currentStatusArr.value]

  if (!isMulti) {
    // ── Single option dipilih ──────────────────────────────────
    // Pertahankan gambar hanya jika option baru dan option lama sama-sama punya show_image
    const keepImage =
      option.show_image === true &&
      selectedOptions.value.some(o => o.show_image === true)

    emit('update:modelValue', {
      status:      option.value,
      note:        null,
      image:       keepImage ? (props.modelValue?.image ?? null) : null,
      damage_ids:  [],
    })

  } else {
    // ── Multi option dipilih ───────────────────────────────────
    const hasSingleSelected = values.some(v => {
      const found = options.value.find(o => o.value === v)
      return found && !found.multi
    })

    if (hasSingleSelected) {
      // Ada single terpilih → bersihkan, mulai dengan multi ini saja
      values = [option.value]
    } else {
      const isAlready = values.includes(option.value)
      if (isAlready) {
        values = values.filter(v => v !== option.value)
      } else {
        values.push(option.value)
      }
    }

    if (values.length === 0) {
      emit('update:modelValue', null)
      emit('update:error', '')
      emit('update:valid', !props.item.is_required)
      return
    }

    // Pertahankan nested hanya jika masih relevan
    const newSelected      = options.value.filter(o => values.includes(o.value))
    const stillHasImage    = newSelected.some(o => o.show_image    === true)
    const stillHasTextarea = newSelected.some(o => o.show_textarea === true)

    emit('update:modelValue', {
      status:      values.length === 1 ? values[0]! : values,
      note:        stillHasTextarea ? (props.modelValue?.note  ?? null) : null,
      image:       stillHasImage    ? (props.modelValue?.image ?? null) : null,
      damage_ids:  props.modelValue?.damage_ids ?? [],
    })
  }

  emit('update:error', '')
}

// ─────────────────────────────────────────────────────────────
// RENDERER VALUE HANDLER
// ─────────────────────────────────────────────────────────────

const handleRendererValue = (value: { note?: any; image?: any; damage_ids?: number[] }) => {
  emit('update:modelValue', {
    status:      props.modelValue?.status ?? '',
    note:        value.note       ?? null,
    image:       value.image      ?? null,
    damage_ids:  value.damage_ids ?? [],
  })
}

// ─────────────────────────────────────────────────────────────
// GRID LAYOUT
// ─────────────────────────────────────────────────────────────

const gridClass = computed(() => {
  const count = options.value.length
  if (count <= 2) return 'grid grid-cols-2 gap-2'
  if (count === 3) return 'grid grid-cols-3 gap-2'
  return 'grid grid-cols-3 gap-2'
})
</script>

<template>
  <div class="space-y-2">

    <!-- ================== OPTION LIST ================== -->
    <div :class="isHorizontal ? gridClass : 'space-y-2'">
      <div v-for="option in options" :key="option.value">

        <!-- Horizontal (button pill) -->
        <button
          v-if="isHorizontal"
          type="button"
          :disabled="disabled"
          @click="handleSelect(option)"
          :class="[
            'w-full text-center px-3 py-2 rounded-lg border text-sm font-medium transition-all',
            isSelected(option)
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          ]"
        >
          {{ option.label }}
        </button>

        <!-- Vertical (radio untuk single, checkbox untuk multi) -->
        <label
          v-else
          class="flex items-center space-x-3 cursor-pointer"
          :class="{ 'opacity-50 cursor-not-allowed': disabled }"
          @click.prevent="handleSelect(option)"
        >
          <input
            v-if="option.multi"
            type="checkbox"
            :checked="isSelected(option)"
            :disabled="disabled"
            class="w-4 h-4 text-blue-600 rounded"
            readonly
          />
          <input
            v-else
            type="radio"
            :checked="isSelected(option)"
            :disabled="disabled"
            class="w-4 h-4 text-blue-600"
            readonly
          />
          <span class="text-sm font-medium text-gray-700">{{ option.label }}</span>
        </label>

      </div>
    </div>

    <!-- ================== NESTED RENDERER ================== -->
    <!--
      rendererOptions bisa berisi:
      - Satu single option (yang punya show_image/show_textarea/show_damage)
      - Satu aggregated option (gabungan multiple multi-option)
      - Keduanya sekaligus jika ada single + multi terpilih bersamaan (hybrid case)
    -->
    <div class="space-y-2">
      <OptionRenderer
        v-for="rendOpt in rendererOptions"
        :key="rendOpt.renderKey"
        :option="rendOpt"
        :inspectionId="inspectionId"
        :parent-item-id="item.id"
        :inspection-item-id="item.inspection_item_id"
        :selected-main-value="modelValue?.status ?? null"
        :value="currentNested"
        @update:value="handleRendererValue"
        @update:error="() => {}"
        @update:upload-status="(s) => handleOptionUploadStatus(rendOpt.optionValue, s)"
      />
    </div>

    <!-- Error -->
    <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>

  </div>
</template>