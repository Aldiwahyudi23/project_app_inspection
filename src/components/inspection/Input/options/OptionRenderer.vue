<!-- components/inspection/inputs/options/OptionRenderer.vue -->
<template>
  <div class="mt-3 space-y-3">

    <!-- IMAGE -->
    <ImageInput
      v-if="option.show_image"
      :item="mappedImageSettings"
      :inspectionId="inspectionId"
      :model-value="localImageValue"
      :error="localImageError"
      :selected-option-value="resolvedOptionValue"
      @update:model-value="handleImageUpdate"
      @update:error="handleImageError"
      @update:upload-status="handleUploadStatus"
    />
    
    <!-- TEXTAREA -->
    <TextareaInput
      v-if="option.show_textarea"
      :item="mappedTextareaSettings"
      :inspectionId="inspectionId"
      :model-value="localTextareaValue"
      :error="localTextareaError"
      :active-damage-ids="activeDamageIds"
      @update:model-value="handleTextareaUpdate"
      @update:error="handleTextareaError"
      @update:damage-ids="handleDamageIdsUpdate"
    />

  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import TextareaInput from '../TextareaInput.vue'
import ImageInput from '../ImageInput.vue'
import type { FormItem } from '../../../../types/formInspection';

const props = defineProps<{
  option: any
  inspectionId: number
  parentItemId: number
  inspectionItemId: number
  optionValue: string
  nestedValue?: {
    textarea?: any
    image?: any
    damage_ids?: number[]
  } | null
  nestedError?: {
    textarea?: string
    image?: string
  } | null
}>()

const emit = defineEmits<{
  (e: 'update:nestedValue', optionValue: string, field: 'textarea' | 'image' | 'damage_ids', value: any): void
  (e: 'update:nestedError', optionValue: string, field: 'textarea' | 'image', error: string): void
  (e: 'update:uploadStatus', optionValue: string, status: { hasUploading: boolean; hasFailed: boolean }): void
}>()

/* =========================
   LOCAL STATE
========================= */
const localTextareaValue = ref(props.nestedValue?.textarea || null)
const localImageValue    = ref(props.nestedValue?.image    || null)
const localTextareaError = ref(props.nestedError?.textarea || '')
const localImageError    = ref(props.nestedError?.image    || '')

// Flag untuk mencegah watch nestedValue meng-override hasil cleanup damage
const _isCleaningUp = ref(false)

/* =========================
   RESOLVED OPTION VALUE
   - Kalau aggregated → kirim originalOptions join koma
     supaya backend bisa resolve settings yang tepat
     contoh: "NOT OK,Repaint"
   - Kalau single → pakai optionValue langsung
     contoh: "NOT OK"
========================= */
const resolvedOptionValue = computed<string | null>(() => {
  if (props.option.isAggregated && Array.isArray(props.option.originalOptions)) {
    // Filter hanya original options yang punya show_image = true
    // agar backend tidak perlu cek option yang tidak relevan
    const optionsWithImage = props.option.originalOptions.filter((_val: string) => {
      // Cek dari data asli option jika tersedia
      // Fallback: kirim semua original options, backend yang filter
      return true
    })
    return optionsWithImage.join(',')
  }
  return props.optionValue ?? null
})

/* =========================
   ACTIVE DAMAGE IDS
   - Dihitung dari nestedValue.damage_ids
   - Di-filter hanya yang masih valid di option.damage_ids saat ini
========================= */
const validDamageIds = computed<number[]>(() => {
  return (props.option.damage_ids || []).map((d: any) => Number(d.id))
})

const activeDamageIds = computed<number[]>(() => {
  const saved = props.nestedValue?.damage_ids
  if (!saved || !Array.isArray(saved)) return []
  return saved.filter(id => validDamageIds.value.includes(Number(id)))
})

/* =========================
   WATCH: option.damage_ids BERUBAH
   → Ketika option di-unselect, damage_ids di aggregatedOption berkurang.
     Emit ke parent agar nestedValue.damage_ids ikut dibersihkan.
========================= */
watch(
  () => props.option.damage_ids,
  (newDamageIds, oldDamageIds) => {
    const saved = props.nestedValue?.damage_ids
    if (!saved || !Array.isArray(saved)) return

    const validIds = (newDamageIds || []).map((d: any) => Number(d.id))
    const filtered = saved.filter(id => validIds.includes(Number(id)))

    if (filtered.length !== saved.length) {
      const removedIds = saved.filter(id => !validIds.includes(Number(id)))

      const removedDamageTexts = (oldDamageIds || [])
        .filter((d: any) => removedIds.includes(Number(d.id)))
        .map((d: any) => d.value?.trim())
        .filter(Boolean)

      const currentTextarea = props.nestedValue?.textarea ?? localTextareaValue.value ?? ''

      const cleanedText = removedDamageTexts.length > 0 && currentTextarea
        ? removeRemovedDamagesFromText(currentTextarea, removedDamageTexts)
        : currentTextarea

      const textareaChanged = cleanedText !== currentTextarea

      _isCleaningUp.value = true

      emit('update:nestedValue', props.optionValue, 'damage_ids', filtered)

      if (textareaChanged) {
        localTextareaValue.value = cleanedText
        emit('update:nestedValue', props.optionValue, 'textarea', cleanedText)
      }

      nextTick(() => { _isCleaningUp.value = false })
    }
  },
  { deep: true }
)

/**
 * Hapus teks damage yang sudah tidak valid dari textarea value
 * Contoh: "Retak, Bocor, Kotor" → hapus "Retak" → "Bocor, Kotor"
 */
const removeRemovedDamagesFromText = (text: string, removedValues: string[]): string => {
  if (!text) return text
  const parts = text
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .filter(t => !removedValues.includes(t))
  return parts.join(', ')
}

/* =========================
   WATCH: nestedValue dari parent
========================= */
watch(() => props.nestedValue, (newVal) => {
  if (!newVal) return
  if (!_isCleaningUp.value) {
    if (newVal.textarea !== undefined) localTextareaValue.value = newVal.textarea
  }
  if (newVal.image !== undefined) localImageValue.value = newVal.image
}, { deep: true })

watch(() => props.nestedError, (newVal) => {
  if (newVal) {
    if (newVal.textarea !== undefined) localTextareaError.value = newVal.textarea
    if (newVal.image    !== undefined) localImageError.value    = newVal.image
  }
}, { deep: true })

/* =========================
   HANDLERS
========================= */
const handleUploadStatus = (status: { hasUploading: boolean; hasFailed: boolean }) => {
  emit('update:uploadStatus', props.optionValue, status)
}

const handleTextareaUpdate = (value: any) => {
  localTextareaValue.value = value
  emit('update:nestedValue', props.optionValue, 'textarea', value)
}

const handleImageUpdate = (value: any) => {
  localImageValue.value = value
  emit('update:nestedValue', props.optionValue, 'image', value)
}

const handleTextareaError = (error: string) => {
  localTextareaError.value = error
  emit('update:nestedError', props.optionValue, 'textarea', error)
}

const handleDamageIdsUpdate = (ids: number[]) => {
  emit('update:nestedValue', props.optionValue, 'damage_ids', ids)
}

const handleImageError = (error: string) => {
  localImageError.value = error
  emit('update:nestedError', props.optionValue, 'image', error)
}

/* =========================
   MAPPINGS
========================= */
const mappedTextareaSettings = computed(() => ({
  // id: `${props.parentItemId}_${props.optionValue}_textarea`,
  id: props.parentItemId,
  inspection_item_id: props.inspectionItemId,
  inspection_item: {
    name: props.option.label
  },
  is_required: props.option.textarea_is_required,
  settings: {
    rows: props.option.rows,
    max_length: props.option.max_length,
    min_length: props.option.min_length,
    rich_text: props.option.rich_text,
    allow_html: props.option.allow_html,
    placeholder: props.option.placeholder,
    show_damage: props.option.show_damage,
    damage_ids: props.option.damage_ids || [],
    damage_category_id: props.option.damage_category_id
  }
})as unknown as FormItem)

const mappedImageSettings = computed(() => ({
  // id: `${props.parentItemId}_${props.optionValue}_image`,
  id: props.parentItemId,
  inspection_item_id: props.inspectionItemId,
  inspection_item: {
    name: props.option.label
  },
  is_required: props.option.image_is_required,
  settings: {
    max_size: props.option.max_size,
    max_files: props.option.max_files,
    max_width: props.option.max_width,
    max_height: props.option.max_height,
    aspect_ratio: props.option.aspect_ratio,
    compression_quality: props.option.compression_quality,
    allowed_mimes: props.option.allowed_mimes
  }
})as unknown as FormItem)
</script>