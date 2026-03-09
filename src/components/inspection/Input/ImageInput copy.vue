<!-- components/inspection/Input/ImageInput.vue -->
<!--
  ImageInput menggunakan useImageUploadStore (Pinia global).
  Upload berjalan di background → user bebas berpindah section.

  show_option: setelah gambar diupload, muncul RadioInput untuk memilih opsi.
  Flat format: localOptionValue = { status, note?, image?, damage_ids? }
-->
<template>
  <div class="space-y-3">

    <!-- ================= EMPTY STATE ================= -->
    <div
      v-if="sectionImages.length === 0"
      class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center
             hover:border-blue-400 transition-colors cursor-pointer"
      @click="handleAddImage"
    >
      <svg class="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586
             a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0
             00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <p class="text-sm text-gray-600 mt-2">Klik untuk upload gambar {{selectedOptionValue}}</p>
      <p class="text-xs text-gray-400 mt-1">
        {{ maxFiles > 1 ? `Maksimal ${maxFiles} gambar` : 'Maksimal 1 gambar' }}
      </p>
    </div>

    <!-- ================= SINGLE MODE ================= -->
    <div
      v-else-if="maxFiles === 1 && firstImage"
      class="relative aspect-square w-24 flex-shrink-0 rounded-lg border border-gray-200"
      style="overflow:hidden;contain:layout;"
    >
      <ImageThumbnail
        :image="firstImage"
        @click-preview="openPreview(0)"
        @retry="firstImage && store.retryUpload(firstImage.localId)"
        @remove="firstImage && store.removeImage(firstImage.localId)"
      />
    </div>

    <!-- ================= MULTIPLE MODE ================= -->
    <div v-else class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <div
        v-if="!isMaxFilesReached"
        class="aspect-square w-24 flex-shrink-0 border-2 border-dashed border-gray-300
               rounded-lg flex items-center justify-center cursor-pointer
               hover:border-blue-400 transition-colors"
        @click="handleAddImage"
      >
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586
               a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0
               00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
      <div
        v-for="(image, index) in sectionImages"
        :key="image.localId"
        class="relative aspect-square w-24 flex-shrink-0 rounded-lg border border-gray-200"
        style="overflow:hidden;contain:layout;"
      >
        <ImageThumbnail
          :image="image"
          @click-preview="openPreview(index)"
          @retry="store.retryUpload(image.localId)"
          @remove="store.removeImage(image.localId)"
        />
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      :accept="allowedMimesString"
      :multiple="maxFiles > 1"
      @change="handleFileSelect"
      class="hidden"
    />

    <!-- Error -->
    <div v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</div>

    <!-- ====================================================
         OPTIONS (RADIO) — show_option = true
         Muncul setelah ada gambar yang terupload.
         Flat model: { status, note?, image?, damage_ids? }
    ==================================================== -->
    <div
      v-if="settings?.show_option === true && options.length > 0 && sectionImages.length > 0"
      class="mt-4 pt-3 border-t border-gray-200"
    >
      <RadioInput
        :item="radioItem"
        :inspectionId="resolvedInspectionId ?? 0"
        :model-value="localOptionValue"
        :error="optionError"
        @update:model-value="handleOptionValueUpdate"
        @update:error="(e) => { optionError = e }"
        @update:valid="handleOptionValidUpdate"
        @update:upload-status="(s) => emit('update:uploadStatus', s)"
      />
    </div>

  </div>

  <!-- Modals -->
  <ImageSourceModal
    :show="showSourceModal"
    @close="showSourceModal = false"
    @select="handleSourceSelect"
  />

  <ImagePreviewModal
    :show="showPreviewModal"
    :images="pendingPreviewImages"
    :item-name="item.inspection_item.name"
    :max="maxFiles"
    :editable="true"
    :is-new-batch="isPreviewForNew"
    :start-index="previewStartIndex"
    @close="handlePreviewClose"
    @save="handlePreviewSave"
    @add-more="handleAddImage"
    @remove-stored="store.removeImage($event)"
  />
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import type { FormItem } from '../../../types/formInspection'
import { useCameraSettings }      from '../../../composables/useCameraSettings'
import { useImageUploadStore }    from '../../../stores/useImageUploadStore'
import ImageSourceModal  from './Image/ImageSourceModal.vue'
import ImagePreviewModal from './Image/ImagePreviewModal.vue'
import ImageThumbnail   from './Image/ImageThumbnail.vue'
import RadioInput        from './RadioInput.vue'
import type { RadioFlatValue } from './RadioInput.vue'

// ─────────────────────────────────────────────────────────────
// PROPS & EMITS
// ─────────────────────────────────────────────────────────────

/**
 * modelValue untuk ImageInput dengan show_option:
 *   {
 *     image:      [{id, image_url, caption}],  ← gambar
 *     status?:    string,                       ← option yang dipilih
 *     note?:      string | null,                ← textarea di option
 *     damage_ids?: number[]
 *   }
 *
 * Tanpa show_option: modelValue = [{id, image_url, caption}]
 */
const props = defineProps<{
  item:                FormItem
  modelValue:          any
  error?:              string
  inspectionId?:       number | string | null
  selectedOptionValue?: string | null   // untuk upload backend (tidak dipakai di sini)
}>()

const emit = defineEmits<{
  (e: 'update:modelValue',   value: any): void
  (e: 'update:error',        error: string): void
  (e: 'update:valid',        valid: boolean): void
  (e: 'update:uploadStatus', status: { hasUploading: boolean; hasFailed: boolean }): void
}>()

// ─────────────────────────────────────────────────────────────
// STORE & CAMERA
// ─────────────────────────────────────────────────────────────

const store = useImageUploadStore()
const { settings: cameraSettings, listenForChanges } = useCameraSettings()
const localCameraSource        = ref(cameraSettings.value.source)
const localPreviewBeforeUpload = ref(cameraSettings.value.previewBeforeUpload ?? true)

let cleanupListener: (() => void) | undefined

onMounted(() => {
  cleanupListener = listenForChanges((s) => {
    localCameraSource.value        = s.source
    localPreviewBeforeUpload.value = s.previewBeforeUpload ?? true
  })
  _syncExistingImages()
})
onUnmounted(() => { if (cleanupListener) cleanupListener() })
watch(cameraSettings, (v) => {
  localCameraSource.value        = v.source
  localPreviewBeforeUpload.value = v.previewBeforeUpload ?? true
}, { deep: true })

// Re-sync saat modelValue datang dari luar (mis. loadForm restore current_result dari backend).
// Kasus: komponen sudah mount tapi formValues baru diisi setelah loadForm selesai,
// sehingga onMounted._syncExistingImages() belum punya data.
// Guard: hanya sync jika store belum punya gambar untuk section ini (cegah sync ganda).
watch(
  () => props.modelValue,
  (mv) => {
    if (!mv) return
    const alreadySynced = store.getImagesBySection(resolvedSectionId.value).length > 0
    if (alreadySynced) return
    _syncExistingImages()
  },
  { immediate: false }
)

// ─────────────────────────────────────────────────────────────
// COMPUTED HELPERS
// ─────────────────────────────────────────────────────────────

const settings = computed(() => props.item.settings || {})
const options  = computed(() => settings.value?.options || [])
const maxFiles = computed(() => settings.value?.max_files ?? 1)
const hasShowOption = computed(() => settings.value?.show_option === true && options.value.length > 0)

const resolvedInspectionId = computed<number | null>(() => {
  const val = parseInt(String(props.inspectionId ?? ''), 10)
  if (isNaN(val)) return null
  return val
})

const resolvedSectionId = computed(() => props.item.id)

const sectionImages = computed(() => store.getImagesBySection(resolvedSectionId.value))

const firstImage = computed<import('../../../stores/useImageUploadStore').InspectionImage | undefined>(
  () => sectionImages.value[0]
)

const isMaxFilesReached = computed(() => sectionImages.value.length >= maxFiles.value)

const allowedMimesString = computed(() => {
  const mimes = settings.value?.allowed_mimes || ['jpg', 'jpeg', 'png', 'webp']
  return mimes.map((m: string) => m.startsWith('.') ? m : `.${m}`).join(',')
})

// ─────────────────────────────────────────────────────────────
// SHOW_OPTION — local state untuk RadioInput (flat)
//
// Ketika show_option=true, formValues[itemId] menyimpan:
//   { image: [...], status: "Ada", note: "...", damage_ids: [] }
//
// Kita pisahkan image dari option value agar RadioInput bersih.
// ─────────────────────────────────────────────────────────────

// Ambil option value flat dari modelValue (jika ada)
const localOptionValue = computed<RadioFlatValue | null>(() => {
  if (!hasShowOption.value) return null
  const mv = props.modelValue
  if (!mv || typeof mv !== 'object' || Array.isArray(mv)) return null
  if (!mv.status) return null
  return {
    status:     mv.status,
    note:       mv.note       ?? null,
    image:      mv.image      ?? null,
    damage_ids: mv.damage_ids ?? [],
  }
})

const optionError = ref('')
const optionValid = ref(true)

// ─────────────────────────────────────────────────────────────
// EMIT VALID
// Untuk image dengan show_option:
//   valid = gambar ada DAN (option required → option terisi)
// Untuk image biasa:
//   valid = gambar ada (kalau required)
// ─────────────────────────────────────────────────────────────

const computeValid = (): boolean => {
  const allImgs  = sectionImages.value
  const doneImgs = allImgs.filter(img => img.status === 'done')

  // Ada gambar pending/uploading → belum bisa valid, tapi juga belum invalid
  // Navigation sudah handle via uploadStatus badge — kembalikan false agar badge muncul
  const hasPending = allImgs.some(img => img.status === 'pending' || img.status === 'uploading')

  if (props.item.is_required) {
    // Tidak ada gambar sama sekali → invalid
    if (allImgs.length === 0) return false
    // Ada gambar tapi semua masih uploading / belum selesai → false (badge upload aktif)
    if (doneImgs.length === 0 && hasPending) return false
  }

  if (hasShowOption.value && doneImgs.length > 0) {
    const optRequired = settings.value?.option_is_required === true
    if (optRequired && !localOptionValue.value?.status) return false
    // Nested valid dikompute di dalam RadioInput, hasilnya ada di optionValid
    if (localOptionValue.value?.status && !optionValid.value) return false
  }

  return true
}

watch(
  [sectionImages, localOptionValue, optionValid],
  () => { emit('update:valid', computeValid()) },
  { deep: true, immediate: true }
)

// ─────────────────────────────────────────────────────────────
// SYNC GAMBAR SERVER KE STORE
// ─────────────────────────────────────────────────────────────

const _syncExistingImages = () => {
  const mv = props.modelValue
  if (!mv) return

  let serverImages: Array<{ id: number; image_url: string; caption?: string | null }> = []

  // modelValue bisa array atau { image: [...], status: ... }
  if (Array.isArray(mv)) {
    serverImages = mv.filter((img: any) => img?.id && img?.image_url)
  } else if (mv && typeof mv === 'object') {
    const imgArr = mv.image ?? mv.images ?? mv
    if (Array.isArray(imgArr)) {
      serverImages = imgArr.filter((img: any) => img?.id && img?.image_url)
    }
  }

  if (!serverImages.length || resolvedInspectionId.value === null) return

  store.syncFromServer({
    serverImages,
    sectionId:        resolvedSectionId.value,
    itemId:           props.item.id,
    inspectionItemId: props.item.inspection_item_id,
    inspectionId:     resolvedInspectionId.value,
  })
}

// ─────────────────────────────────────────────────────────────
// SYNC STORE → emit modelValue
// ─────────────────────────────────────────────────────────────

watch(
  () => {
    void store.images
    return [
      store.hasPendingUploads(resolvedSectionId.value),
      store.hasFailedUploads(resolvedSectionId.value),
    ] as [boolean, boolean]
  },
  ([hasUploading, hasFailed]) => {
    emit('update:uploadStatus', { hasUploading: hasUploading as boolean, hasFailed: hasFailed as boolean })
  }
)

watch(
  sectionImages,
  (imgs) => {
    const doneImages = imgs
      .filter(img => img.status === 'done')
      .map(img => ({
        id:        img.serverId,
        image_url: img.imageUrl || img.url,
        caption:   img.caption ?? null,
      }))

    if (hasShowOption.value) {
      // Merge gambar + option value
      const mv = props.modelValue
      const currentOption = (mv && typeof mv === 'object' && !Array.isArray(mv))
        ? { status: mv.status, note: mv.note, damage_ids: mv.damage_ids }
        : {}
      emit('update:modelValue', { image: doneImages, ...currentOption })
    } else {
      emit('update:modelValue', doneImages)
    }
  },
  { deep: true }
)

// ─────────────────────────────────────────────────────────────
// RADIO ITEM (untuk show_option)
// ─────────────────────────────────────────────────────────────

const radioItem = computed(() => ({
  id:                  `${props.item.id}_opts` as any,
  section_id:          props.item.section_id,
  inspection_item_id:  props.item.inspection_item_id,
  input_type:          'radio',
  sort_order:          props.item.sort_order,
  is_active:           true,
  is_visible:          true,
  is_required:         settings.value?.option_is_required === true,
  current_result:      null,
  ui_config:           null,
  inspection_item: {
    id:          props.item.inspection_item_id,
    name:        `Pilihan ${props.item.inspection_item?.name || 'Gambar'}`,
    description: null,
    code:        null,
  },
  settings: {
    options: options.value,
    layout:  settings.value?.layout || 'horizontal',
  },
  validation_rules: [],
}) as unknown as FormItem)

const handleOptionValueUpdate = (value: RadioFlatValue | null) => {
  const mv = props.modelValue
  const currentImages = hasShowOption.value && mv && typeof mv === 'object' && !Array.isArray(mv)
    ? (mv.image ?? [])
    : (Array.isArray(mv) ? mv : [])

  emit('update:modelValue', {
    image:      currentImages,
    status:     value?.status      ?? null,
    note:       value?.note        ?? null,
    damage_ids: value?.damage_ids  ?? [],
  })
}

const handleOptionValidUpdate = (valid: boolean) => {
  optionValid.value = valid
}

// ─────────────────────────────────────────────────────────────
// FILE INPUT & MODAL
// ─────────────────────────────────────────────────────────────

const fileInput         = ref<HTMLInputElement | null>(null)
const showSourceModal   = ref(false)
const showPreviewModal  = ref(false)
const previewStartIndex = ref(0)
const pendingPreviewImages = ref<any[]>([])
const isPreviewForNew   = ref(false)

const storedPreviewImages = computed(() =>
  sectionImages.value.map(img => ({
    localId:   img.localId,
    url:       img.imageUrl || img.url,
    image_url: img.imageUrl,
    id:        img.serverId,
    file:      undefined,
    rotation:  0,
    status:    img.status,
  }))
)

const handleAddImage = () => {
  const source = localCameraSource.value
  if      (source === 'ask')    showSourceModal.value = true
  else if (source === 'camera') openFileInput('camera')
  else                          openFileInput('gallery')
}

const handleSourceSelect = (type: string) => {
  showSourceModal.value = false
  openFileInput(type as 'camera' | 'gallery')
}

const openFileInput = (type: 'camera' | 'gallery') => {
  if (!fileInput.value) return
  fileInput.value.value = ''
  fileInput.value.removeAttribute('capture')
  if (type === 'camera') fileInput.value.setAttribute('capture', 'environment')
  nextTick(() => fileInput.value?.click())
}

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  processFiles(Array.from(input.files))
  input.value = ''
}

const processFiles = (files: File[]) => {
  const maxSize = (settings.value?.max_size || 2048) * 1024
  const allowed = settings.value?.allowed_mimes || ['jpg', 'jpeg', 'png', 'webp']

  const valid: any[] = []
  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!allowed.includes(ext || '')) { emit('update:error', 'Tipe file tidak diizinkan'); continue }
    if (file.size > maxSize)          { emit('update:error', 'Ukuran file terlalu besar');  continue }
    valid.push({ file, url: URL.createObjectURL(file), rotation: 0, _isNew: true })
  }
  if (!valid.length) return

  const existingNewCount = pendingPreviewImages.value.filter((i: any) => i._isNew).length
  const totalUsed        = sectionImages.value.length + existingNewCount
  const remaining        = maxFiles.value - totalUsed

  if (remaining <= 0) { emit('update:error', `Maksimal ${maxFiles.value} file`); return }

  const toAdd = valid.slice(0, remaining)
  if (toAdd.length < valid.length) {
    emit('update:error', `Hanya ${toAdd.length} gambar yang ditambahkan (batas ${maxFiles.value})`)
  }

  if (localPreviewBeforeUpload.value || showPreviewModal.value) {
    if (showPreviewModal.value) {
      const focusIndex = pendingPreviewImages.value.length
      pendingPreviewImages.value = [...pendingPreviewImages.value, ...toAdd]
      previewStartIndex.value    = focusIndex
    } else {
      const stored = storedPreviewImages.value
      pendingPreviewImages.value = [...stored, ...toAdd]
      previewStartIndex.value    = stored.length
      isPreviewForNew.value      = true
      showPreviewModal.value     = true
    }
    return
  }

  const inspId = resolvedInspectionId.value
  if (!inspId) { emit('update:error', 'ID inspeksi tidak valid'); return }

  toAdd.forEach(img => { if (img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url) })

  store.addImages({
    files:               toAdd.map((img: any) => img.file),
    rotations:           toAdd.map(() => 0),
    sectionId:           resolvedSectionId.value,
    itemId:              props.item.id,
    inspectionItemId:    props.item.inspection_item_id,
    inspectionId:        inspId,
    selectedOptionValue: props.selectedOptionValue ,
  })
}

const openPreview = (index: number) => {
  pendingPreviewImages.value = storedPreviewImages.value
  previewStartIndex.value    = index
  isPreviewForNew.value      = false
  showPreviewModal.value     = true
}

const handlePreviewSave = (savedImages: any[]) => {
  showPreviewModal.value = false
  isPreviewForNew.value  = false

  const inspId = resolvedInspectionId.value
  if (!inspId) {
    emit('update:error', 'ID inspeksi tidak valid')
    pendingPreviewImages.value.forEach(img => {
      if (img._isNew && img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)
    })
    pendingPreviewImages.value = []
    return
  }

  const newImages = savedImages.filter(img => img._isNew && img.file)

  if (!newImages.length) {
    pendingPreviewImages.value.forEach(img => {
      if (img._isNew && img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)
    })
    pendingPreviewImages.value = []
    return
  }


  store.addImages({
    files:               newImages.map(img => img.file),
    rotations:           newImages.map(img => ((img.rotation || 0) % 360 + 360) % 360),
    sectionId:           resolvedSectionId.value,
    itemId:              props.item.id,
    inspectionItemId:    props.item.inspection_item_id,
    inspectionId:        inspId,
    selectedOptionValue: props.selectedOptionValue,
  })

  newImages.forEach(img => {
    if (img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)
  })

  pendingPreviewImages.value = []
}

const handlePreviewClose = () => {
  showPreviewModal.value = false
  if (isPreviewForNew.value) {
    pendingPreviewImages.value.forEach(img => {
      if (img._isNew && img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)
    })
    pendingPreviewImages.value = []
  }
  isPreviewForNew.value = false
}
</script>

<style scoped>
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
</style>