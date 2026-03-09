<!-- components/inspection/Input/options/OptionRenderer.vue -->
<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import TextareaInput from '../TextareaInput.vue'
import ImageInput    from '../ImageInput.vue'
import type { FormItem } from '../../../../types/formInspection'
import { useImageUploadStore } from '../../../../stores/useImageUploadStore'

/**
 * OptionRenderer menampilkan textarea/image/damage yang muncul
 * ketika suatu option dipilih (di RadioInput, SelectInput, CheckboxInput).
 *
 * Tidak lagi memakai nested key "aggregated" — langsung emit flat:
 *   update:value  → { note, image, damage_ids }
 */

export interface OptionFlatValue {
  note?:       string | null
  image?:      any[] | null
  damage_ids?: number[]
}

const props = defineProps<{
  option:            any
  inspectionId:      number
  parentItemId:      number
  inspectionItemId:  number
  /** Nilai yang dipilih user (untuk diteruskan ke ImageInput sbg selected_option_value) */
  selectedMainValue?: string | string[] | null
  /** Flat value dari parent */
  value?: OptionFlatValue | null
  error?: { note?: string; image?: string } | null
}>()

const emit = defineEmits<{
  (e: 'update:value',        value: OptionFlatValue): void
  (e: 'update:error',        field: 'note' | 'image', error: string): void
  (e: 'update:uploadStatus', status: { hasUploading: boolean; hasFailed: boolean }): void
}>()

const imageStore = useImageUploadStore()

// ── Local state ──────────────────────────────────────────────
const localNote      = ref<string | null>(props.value?.note      ?? null)
const localImage     = ref<any[] | null>(props.value?.image      ?? null)
const localDamageIds = ref<number[]>(props.value?.damage_ids      ?? [])

const localNoteError  = ref(props.error?.note  ?? '')
const localImageError = ref(props.error?.image ?? '')

// ── Restore gambar dari store saat option di-mount ────────────
// Skenario: user pilih option A → upload gambar → pindah option B
// → image di-reset oleh parent (null) → pilih option A lagi
// → OptionRenderer re-mount dengan props.value.image = null,
//   tapi store masih punya gambar (sectionId = parentItemId, status = 'done')
// Fix: saat mount atau saat image di-reset, restore dari store.
const restoreImagesFromStore = () => {
  if (!props.option.show_image) return

  const hasLocal = localImage.value && localImage.value.length > 0
  if (hasLocal) return

  // sectionId di store = parentItemId (set oleh OptionRenderer saat addImages)
  const storeImages = imageStore.images.filter(
    img => img.sectionId === props.parentItemId && img.status === 'done'
  )
  if (storeImages.length === 0) return

  const restored = storeImages.map(img => ({
    id:        img.serverId!,
    image_url: img.imageUrl ?? img.url,
    caption:   img.caption ?? null,
  }))

  localImage.value = restored

  // Emit ke parent agar formValues juga terupdate dengan gambar yang di-restore
  emit('update:value', {
    note:       localNote.value,
    image:      restored,
    damage_ids: localDamageIds.value,
  })
}

// Jalankan restore saat komponen pertama di-mount (kasus pilih ulang option)
onMounted(() => {
  restoreImagesFromStore()
})

// Sync jika parent mengubah value dari luar (mis. restore dari storage)
watch(() => props.value, (v) => {
  if (v == null) {
    localNote.value      = null
    localImage.value     = null
    localDamageIds.value = []
    return
  }
  if (v.note      !== undefined) localNote.value      = v.note      ?? null
  if (v.image     !== undefined) {
    const newImg  = v.image ?? null
    const isEmpty = !newImg || (Array.isArray(newImg) && newImg.length === 0)
    // Jika parent reset image ke kosong dan ada gambar di store → restore
    if (isEmpty && props.option.show_image) {
      restoreImagesFromStore()
    } else {
      localImage.value = newImg
    }
  }
  if (v.damage_ids !== undefined) localDamageIds.value = v.damage_ids ?? []
}, { deep: true })

watch(() => props.error, (e) => {
  if (e?.note)  localNoteError.value  = e.note
  if (e?.image) localImageError.value = e.image
}, { deep: true })

// ── selected_option_value untuk ImageInput (upload backend) ──
const selectedMainValueStr = computed(() => {
  const val = props.selectedMainValue
  if (!val) return undefined
  if (Array.isArray(val)) return val.join(',')
  return String(val)
})

// ── Emit helpers ─────────────────────────────────────────────
const emitValue = () => {
  emit('update:value', {
    note:       localNote.value,
    image:      localImage.value,
    damage_ids: localDamageIds.value,
  })
}

const handleNoteUpdate = (value: string) => {
  // Simpan null jika kosong agar konsisten dengan flat format backend
  localNote.value = value === '' ? null : value
  emitValue()
}

const handleImageUpdate = (value: any[]) => {
  localImage.value = value
  emitValue()
}

const handleDamageIdsUpdate = (ids: number[]) => {
  localDamageIds.value = ids
  emitValue()
}

const handleNoteError = (error: string) => {
  localNoteError.value = error
  emit('update:error', 'note', error)
}

const handleImageError = (error: string) => {
  localImageError.value = error
  emit('update:error', 'image', error)
}

// ── Mapped settings untuk sub-komponen ───────────────────────
const mappedTextareaItem = computed(() => ({
  id:                  props.parentItemId,
  inspection_item_id:  props.inspectionItemId,
  inspection_item:     { name: props.option.label },
  is_required:         props.option.textarea_is_required ?? false,
  settings: {
    rows:               props.option.rows,
    max_length:         props.option.max_length,
    min_length:         props.option.min_length,
    rich_text:          props.option.rich_text,
    allow_html:         props.option.allow_html,
    placeholder:        props.option.placeholder,
    show_damage:        props.option.show_damage,
    damage_ids:         props.option.damage_ids         || [],
    damage_category_id: props.option.damage_category_id,
  },
}) as unknown as FormItem)

const mappedImageItem = computed(() => ({
  id:                  props.parentItemId,
  inspection_item_id:  props.inspectionItemId,
  inspection_item:     { name: props.option.label },
  is_required:         props.option.image_is_required ?? false,
  settings: {
    max_size:            props.option.max_size,
    max_files:           props.option.max_files,
    max_width:           props.option.max_width,
    max_height:          props.option.max_height,
    aspect_ratio:        props.option.aspect_ratio,
    compression_quality: props.option.compression_quality,
    allowed_mimes:       props.option.allowed_mimes,
  },
}) as unknown as FormItem)
</script>

<template>
  <div class="mt-3 space-y-3">
    <ImageInput
      v-if="option.show_image"
      :item="mappedImageItem"
      :inspectionId="inspectionId"
      :model-value="localImage"
      :error="localImageError"
      :selected-option-value="selectedMainValueStr"
      @update:model-value="handleImageUpdate"
      @update:error="handleImageError"
      @update:upload-status="(s) => emit('update:uploadStatus', s)"
    />
    <TextareaInput
      v-if="option.show_textarea"
      :item="mappedTextareaItem"
      :inspectionId="inspectionId"
      :model-value="localNote ?? ''"
      :error="localNoteError"
      :active-damage-ids="localDamageIds"
      @update:model-value="handleNoteUpdate"
      @update:error="handleNoteError"
      @update:damage-ids="handleDamageIdsUpdate"
    />
  </div>
</template>