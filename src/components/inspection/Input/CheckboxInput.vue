<!-- components/inspection/Input/CheckboxInput.vue -->
<script setup lang="ts">
import { computed, watch } from 'vue'
import OptionRenderer from './options/OptionRenderer.vue'
import type { FormItem } from '../../../types/formInspection'

export interface CheckboxFlatValue {
  status:      string[]
  note?:       string | null
  image?:      any[]  | null
  damage_ids?: number[]
}

const props = defineProps<{
  item:         FormItem
  inspectionId: number
  modelValue:   CheckboxFlatValue | null
  error?:       string
  disabled?:    boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue',   value: CheckboxFlatValue | null): void
  (e: 'update:error',        error: string): void
  (e: 'update:valid',        valid: boolean): void
  (e: 'update:uploadStatus', status: { hasUploading: boolean; hasFailed: boolean }): void
}>()

// ── Settings ──────────────────────────────────────────────────
const settings     = computed(() => props.item.settings || {})
const options      = computed<any[]>(() => settings.value.options || [])
const isHorizontal = computed(() => settings.value.layout === 'horizontal')
const minSelected  = computed<number | null>(() =>
  settings.value.min_selected ? Number(settings.value.min_selected) : null
)
const maxSelected  = computed<number | null>(() =>
  settings.value.max_selected ? Number(settings.value.max_selected) : null
)

// ── Current state ─────────────────────────────────────────────
const currentStatuses = computed<string[]>(() => props.modelValue?.status ?? [])

const currentNested = computed(() => {
  if (!props.modelValue) return null
  const { status, ...rest } = props.modelValue
  return rest
})

const isChecked = (optionValue: string) => currentStatuses.value.includes(optionValue)

// ── aggregateOptions — ikuti logika lama (Math.max, union) ────
const aggregateOptions = (opts: any[]): any | null => {
  if (opts.length === 0) return null

  const withTextarea = opts.filter(o => o.show_textarea)
  const withImage    = opts.filter(o => o.show_image)
  const withDamage   = opts.filter(o => o.show_damage)

  const result: any = {
    label:               opts.map(o => o.label).join(' + '),
    show_textarea:       withTextarea.length > 0,
    show_image:          withImage.length > 0,
    show_damage:         withDamage.length > 0,
    textarea_is_required: false,
    image_is_required:   false,
    rich_text:           false,
    allow_html:          false,
    rows:                3,
    max_length:          null,
    min_length:          null,
    max_size:            null,
    max_files:           null,
    max_width:           null,
    max_height:          null,
    compression_quality: null,
    aspect_ratio:        null,
    placeholder:         null,
    damage_ids:          [],
    damage_category_id:  null,
    allowed_mimes:       [],
  }

  if (withTextarea.length > 0) {
    result.textarea_is_required = withTextarea.some((o: any) => o.textarea_is_required === true)
    result.rich_text             = withTextarea.some((o: any) => o.rich_text === true)
    result.allow_html            = withTextarea.some((o: any) => o.allow_html === true)
    result.placeholder           = withTextarea.find((o: any) => o.placeholder)?.placeholder ?? null

    const rows = withTextarea.map((o: any) => o.rows).filter((v: any) => v != null && !isNaN(v))
    if (rows.length) result.rows = Math.max(...rows)

    const maxL = withTextarea.map((o: any) => o.max_length).filter((v: any) => v != null && !isNaN(v))
    if (maxL.length) result.max_length = Math.max(...maxL)

    const minL = withTextarea.map((o: any) => o.min_length).filter((v: any) => v != null && !isNaN(v))
    if (minL.length) result.min_length = Math.max(...minL)
  }

  if (withImage.length > 0) {
    result.image_is_required = withImage.some((o: any) => o.image_is_required === true)
    result.aspect_ratio      = withImage.find((o: any) => o.aspect_ratio)?.aspect_ratio ?? null

    const maxSize = withImage.map((o: any) => o.max_size).filter((v: any) => v != null && !isNaN(v))
    if (maxSize.length) result.max_size = Math.max(...maxSize)

    const maxFiles = withImage.map((o: any) => o.max_files).filter((v: any) => v != null && !isNaN(v))
    if (maxFiles.length) result.max_files = Math.max(...maxFiles)

    const maxW = withImage.map((o: any) => o.max_width).filter((v: any) => v != null && !isNaN(v))
    if (maxW.length) result.max_width = Math.max(...maxW)

    const maxH = withImage.map((o: any) => o.max_height).filter((v: any) => v != null && !isNaN(v))
    if (maxH.length) result.max_height = Math.max(...maxH)

    const comp = withImage.map((o: any) => o.compression_quality).filter((v: any) => v != null && !isNaN(v))
    if (comp.length) result.compression_quality = Math.max(...comp)

    const allMimes = withImage.flatMap((o: any) => o.allowed_mimes || [])
    if (allMimes.length) result.allowed_mimes = [...new Set(allMimes)]
  }

  if (withDamage.length > 0) {
    const allIds = withDamage.flatMap((o: any) => o.damage_ids || [])
    result.damage_ids         = [...new Set(allIds)]
    result.damage_category_id = withDamage.find((o: any) => o.damage_category_id)?.damage_category_id ?? null
  }

  return result
}

// ── Aggregated renderer option ────────────────────────────────
const aggregatedRendererOption = computed(() => {
  if (currentStatuses.value.length === 0) return null
  const selectedOpts = options.value.filter(o => currentStatuses.value.includes(o.value))
  const withContent  = selectedOpts.filter(o => o.show_image || o.show_textarea || o.show_damage)
  if (withContent.length === 0) return null
  return aggregateOptions(withContent)
})

// ── Validasi realtime ─────────────────────────────────────────
const computeError = (statuses: string[], val: CheckboxFlatValue | null): string => {
  if (props.item.is_required && statuses.length === 0)
    return 'Field ini harus diisi'

  if (minSelected.value != null && statuses.length > 0 && statuses.length < minSelected.value)
    return `Pilih minimal ${minSelected.value} opsi`

  if (maxSelected.value != null && statuses.length > maxSelected.value)
    return `Pilih maksimal ${maxSelected.value} opsi`

  if (statuses.length > 0 && aggregatedRendererOption.value) {
    const opt = aggregatedRendererOption.value
    if (opt.show_textarea && opt.textarea_is_required) {
      const note = val?.note
      if (!note || (typeof note === 'string' && note.trim() === ''))
        return 'Catatan wajib diisi'
      if (opt.min_length && typeof note === 'string' && note.length < Number(opt.min_length))
        return `Minimal ${opt.min_length} karakter`
      if (opt.max_length && typeof note === 'string' && note.length > Number(opt.max_length))
        return `Maksimal ${opt.max_length} karakter`
    }
    if (opt.show_image && opt.image_is_required) {
      const img = val?.image
      if (!img || (Array.isArray(img) && img.length === 0))
        return 'Gambar wajib diupload'
    }
  }

  return ''
}

// Emit valid + error setiap modelValue berubah
watch(() => props.modelValue, (val) => {
  const statuses = val?.status ?? []
  const errMsg   = computeError(statuses, val)
  // Emit error hanya jika sudah ada interaksi (ada status atau error sebelumnya)
  if (statuses.length > 0 || props.error) {
    emit('update:error', errMsg)
  }
  emit('update:valid', errMsg === '')
}, { deep: true, immediate: true })

// ── Grid layout ───────────────────────────────────────────────
const gridClass = computed(() => {
  const count = options.value.length
  if (count <= 2) return 'grid grid-cols-2 gap-2'
  if (count === 3) return 'grid grid-cols-3 gap-2'
  return 'grid grid-cols-3 gap-2'
})

// ── Handlers ─────────────────────────────────────────────────
const handleToggle = (option: any) => {
  if (props.disabled) return

  const current = [...currentStatuses.value]
  const idx     = current.indexOf(option.value)
  let newStatuses: string[]

  if (idx >= 0) {
    newStatuses = current.filter(v => v !== option.value)
  } else {
    if (maxSelected.value != null && current.length >= maxSelected.value) return
    newStatuses = [...current, option.value]
  }

  // Apakah option tersisa masih punya renderer?
  const newSelected      = options.value.filter(o => newStatuses.includes(o.value))
  const stillHasRenderer = newSelected.some(o => o.show_image || o.show_textarea || o.show_damage)

  const newVal: CheckboxFlatValue = {
    status:     newStatuses,
    note:       stillHasRenderer ? (props.modelValue?.note       ?? null) : null,
    image:      stillHasRenderer ? (props.modelValue?.image      ?? null) : null,
    damage_ids: stillHasRenderer ? (props.modelValue?.damage_ids ?? [])   : [],
  }

  emit('update:modelValue', newVal)
  const errMsg = computeError(newStatuses, newVal)
  emit('update:error', errMsg)
  emit('update:valid',  errMsg === '')
}

const handleRendererValue = (value: { note?: any; image?: any; damage_ids?: number[] }) => {
  const newVal: CheckboxFlatValue = {
    status:     currentStatuses.value,
    note:       value.note       ?? null,
    image:      value.image      ?? null,
    damage_ids: value.damage_ids ?? [],
  }
  emit('update:modelValue', newVal)
  const errMsg = computeError(currentStatuses.value, newVal)
  emit('update:error', errMsg)
  emit('update:valid',  errMsg === '')
}
</script>

<template>
  <div class="space-y-2">

    <!-- Option list -->
    <div :class="isHorizontal ? gridClass : 'space-y-2'">
      <div v-for="option in options" :key="option.value">

        <!-- Horizontal pill -->
        <button
          v-if="isHorizontal"
          type="button"
          :disabled="disabled"
          @click="handleToggle(option)"
          :class="[
            'w-full text-center px-3 py-2 rounded-lg border text-sm font-medium transition-all',
            isChecked(option.value)
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          ]"
        >
          {{ option.label }}
        </button>

        <!-- Vertical checkbox -->
        <label
          v-else
          class="flex items-center space-x-3 cursor-pointer"
          :class="{ 'opacity-50 cursor-not-allowed': disabled }"
          @click.prevent="handleToggle(option)"
        >
          <div
            class="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
            :class="isChecked(option.value) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'"
          >
            <svg v-if="isChecked(option.value)" class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
              <path d="M10 3L5 8.5 2 5.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-700">{{ option.label }}</span>
        </label>

      </div>
    </div>

    <!-- Aggregated renderer (satu renderer untuk semua option terpilih) -->
    <OptionRenderer
      v-if="aggregatedRendererOption"
      :key="currentStatuses.join(',')"
      :option="aggregatedRendererOption"
      :inspectionId="inspectionId"
      :parent-item-id="item.id"
      :inspection-item-id="item.inspection_item_id"
      :selected-main-value="currentStatuses"
      :value="currentNested"
      @update:value="handleRendererValue"
      @update:error="() => {}"
      @update:upload-status="(s) => emit('update:uploadStatus', s)"
    />

    <!-- Error -->
    <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>

    <!-- Min / Max info -->
    <div v-if="minSelected || maxSelected" class="text-xs text-gray-400">
      <span v-if="minSelected">Minimal {{ minSelected }} dipilih</span>
      <span v-if="minSelected && maxSelected"> | </span>
      <span v-if="maxSelected">Maksimal {{ maxSelected }} dipilih</span>
    </div>

  </div>
</template>