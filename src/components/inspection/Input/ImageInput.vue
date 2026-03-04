<!-- components/inspection/inputs/ImageInput.vue -->
<template>
  <div class="space-y-3">

    <!-- ================= EMPTY STATE ================= -->
    <div
      v-if="images.length === 0"
      class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
      @click="handleAddImage"
    >
      <svg class="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <p class="text-sm text-gray-600 mt-2">Klik untuk upload gambar</p>
      <p class="text-xs text-gray-400 mt-1">
        {{ (settings.max_files ?? 1) > 1 ? `Maksimal ${settings.max_files} gambar` : 'Maksimal 1 gambar' }}
      </p>
    </div>

    <!-- ================= SINGLE MODE ================= -->
    <!-- w-24 h-24: ukuran fixed agar tidak melebar mengikuti parent (konsisten di semua konteks). -->
    <div
      v-else-if="settings.max_files === 1"
      class="relative aspect-square w-24 flex-shrink-0 rounded-lg border border-gray-200"
      style="overflow:hidden;contain:layout;"
    >
      <!-- Loading overlay for single mode -->
      <div
        v-if="uploadingIndexes.has(0)"
        class="absolute inset-0 z-10 bg-black/50 flex flex-col items-center justify-center gap-2"
      >
        <svg class="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <span class="text-white text-xs">Mengupload...</span>
      </div>

      <!-- Failed overlay for single mode -->
      <div
        v-else-if="failedIndexes.has(0)"
        class="absolute inset-0 z-10 bg-black/60 flex flex-col items-center justify-center gap-2 p-2"
      >
        <svg class="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"/>
        </svg>
        <span class="text-white text-xs text-center">Upload gagal</span>
        <button
          @click.stop="retryUpload(0)"
          class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded-full transition-colors"
        >
          Coba lagi
        </button>
      </div>

      <img
        v-if="getImgSrc(images[0])"
        :src="getImgSrc(images[0])"
        class="w-full h-full object-cover cursor-pointer"
        style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;"
        @click="openPreview(0)"
      />
      <div v-else class="absolute inset-0 flex items-center justify-center bg-gray-100">
        <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
      <button
        @click="removeImage(0)"
        class="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs shadow hover:bg-red-600"
        style="z-index:2;"
      >✕</button>
    </div>

    <!-- ================= MULTIPLE MODE ================= -->
    <div v-else class="flex gap-2 overflow-x-auto pb-1">
      <div
        v-if="!isMaxFilesReached"
        class="aspect-square w-24 flex-shrink-0 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
        @click="handleAddImage"
      >
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
      <div
        v-for="(image, index) in images"
        :key="index"
        class="relative aspect-square w-24 flex-shrink-0 rounded-lg border border-gray-200"
        style="overflow:hidden;contain:layout;"
      >
        <!-- Loading overlay -->
        <div
          v-if="uploadingIndexes.has(Number(index))"
          class="absolute inset-0 z-10 bg-black/50 flex flex-col items-center justify-center gap-1"
        >
          <svg class="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <span class="text-white text-xs">Upload...</span>
        </div>

        <!-- Failed overlay -->
        <div
          v-else-if="failedIndexes.has(Number(index))"
          class="absolute inset-0 z-10 bg-black/60 flex flex-col items-center justify-center gap-1 p-1"
        >
          <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"/>
          </svg>
          <button
            @click.stop="retryUpload(Number(index))"
            class="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full"
          >
            Retry
          </button>
        </div>

        <img
          :src="getImgSrc(image)"
          class="w-full h-full object-cover cursor-pointer"
          style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;"
          @click="openPreview(Number(index))"
        />
        <button
          @click="removeImage(Number(index))"
          class="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs shadow hover:bg-red-600"
          style="z-index:2;"
        >✕</button>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      :accept="allowedMimesString"
      :multiple="(settings.max_files ?? 1) > 1"
      @change="handleFileSelect"
      class="hidden"
    />

    <!-- Error gambar utama -->
    <div v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</div>

    <!-- =================================================================
         OPTIONS (RADIO) — show_option = true
         Hanya muncul jika sudah ada gambar (hasImages = true)
    ================================================================= -->
    <div v-if="settings?.show_option === true && options.length > 0 && hasImages" class="mt-4 pt-3 border-t border-gray-200">
      <RadioInput
        :item="radioItem"
        :inspectionId="resolvedInspectionId ?? 0"
        :model-value="localSelectedOption"
        :error="optionError"
        :nested-values="localRadioNestedValues"
        :nested-errors="localRadioNestedErrors"
        @update:model-value="handleOptionSelect"
        @update:error="handleOptionError"
        @update:nested-value="handleRadioNestedValueUpdate"
        @update:nested-error="handleRadioNestedErrorUpdate"
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
    :images="tempImages"
    :item-name="item.inspection_item.name"
    :max="settings.max_files"
    :editable="previewEditable"
    :start-index="previewStartIndex"
    @close="showPreviewModal = false"
    @save="handleSavePreview"
    @add-more="handleAddImage"
  />
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import type { FormItem } from '../../../types/formInspection'
import { useCameraSettings } from '../../../composables/useCameraSettings'
import { uploadInspectionImages, deleteInspectionImage } from '../../../services/formInspectionService'
import ImageSourceModal  from './Image/ImageSourceModal.vue'
import ImagePreviewModal from './Image/ImagePreviewModal.vue'
import RadioInput        from './RadioInput.vue'

const props = defineProps<{
  item: FormItem
  modelValue: any
  error?: string
  /**
   * ID inspeksi — dikirim dari parent (InspectionFormView).
   * Harus berupa angka valid. Jika tidak di-pass, upload akan gagal.
   */
  inspectionId?: number | string | null
  imageNestedValues?: {
    selectedOption?: string | string[] | null
    nested?: Record<string, { textarea?: any; image?: any }>
  } | null
  selectedOptionValue?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue',       value: any): void
  (e: 'update:error',            error: string): void
  (e: 'update:nestedValue',      optionValue: string, field: 'textarea' | 'image', value: any): void
  (e: 'update:nestedError',      optionValue: string, field: 'textarea' | 'image', error: string): void
  (e: 'update:uploadStatus', status: { hasUploading: boolean; hasFailed: boolean }): void
  (e: 'update:imageNestedValue', field: string, value: any): void
}>()

// ─────────────────────────────────────────────────────────────
// CAMERA SETTINGS
// ─────────────────────────────────────────────────────────────

const { settings: cameraSettings, listenForChanges } = useCameraSettings()
const localCameraSource = ref(cameraSettings.value.source)

let cleanupListener: (() => void) | undefined
onMounted(() => {
  cleanupListener = listenForChanges((s) => { localCameraSource.value = s.source })
})
onUnmounted(() => { if (cleanupListener) cleanupListener() })
watch(cameraSettings, (v) => { localCameraSource.value = v.source }, { deep: true })

// ─────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────

const settings = computed(() => props.item.settings || {})
const options  = computed(() => settings.value?.options || [])

// ─────────────────────────────────────────────────────────────
// STATE LOKAL UNTUK RADIO (show_option)
// ─────────────────────────────────────────────────────────────

const localSelectedOption    = ref<string | string[] | null>(props.imageNestedValues?.selectedOption ?? null)
const localRadioNestedValues = ref<Record<string, any>>(
  props.imageNestedValues?.nested ? JSON.parse(JSON.stringify(props.imageNestedValues.nested)) : {}
)
const localRadioNestedErrors = ref<Record<string, any>>({})
const optionError = ref('')

watch(
  () => props.imageNestedValues,
  (newVal) => {
    if (!newVal) return
    if (newVal.selectedOption !== undefined) localSelectedOption.value = newVal.selectedOption
    if (newVal.nested) localRadioNestedValues.value = JSON.parse(JSON.stringify(newVal.nested))
  },
  { deep: true, immediate: true }
)

const radioItem = computed(() => ({
  id: `${props.item.id}_opts`,
  section_id: props.item.section_id,
  inspection_item_id: props.item.inspection_item_id,
  input_type: 'radio',
  sort_order: props.item.sort_order,
  is_active: true,
  is_visible: true,
  is_required: false,
  current_result: null,  
  ui_config: null,   
  inspection_item: {
    id: props.item.inspection_item_id,
    name: `Pilihan ${props.item.inspection_item?.name || 'Gambar'}`,
    description: null,
    code: null
  },
  settings: {
    options: options.value,
    layout: settings.value?.layout || 'horizontal'
  },
  validation_rules: []
})as unknown as FormItem)

const handleOptionSelect = (value: any) => {
  localSelectedOption.value = value
  optionError.value = ''
  emit('update:imageNestedValue', 'selectedOption', value)
}
const handleOptionError = (err: string) => { optionError.value = err }
const handleRadioNestedValueUpdate = (optionValue: string, field: 'textarea' | 'image' |'damage_ids', value: any) => {
  if (!localRadioNestedValues.value[optionValue]) localRadioNestedValues.value[optionValue] = {}
  localRadioNestedValues.value[optionValue][field] = value
  emit('update:imageNestedValue', `${optionValue}__${field}`, value)
}
const handleRadioNestedErrorUpdate = (optionValue: string, field: 'textarea' | 'image', err: string) => {
  if (!localRadioNestedErrors.value[optionValue]) localRadioNestedErrors.value[optionValue] = {}
  localRadioNestedErrors.value[optionValue][field] = err
}

// ─────────────────────────────────────────────────────────────
// IMAGE HANDLING
// ─────────────────────────────────────────────────────────────

const emitUploadStatus = () => {
  emit('update:uploadStatus', {
    hasUploading: uploadingIndexes.value.size > 0,
    hasFailed:    failedIndexes.value.size > 0,
  })
}

/**
 * Struktur gambar yang tersimpan di modelValue setelah upload sukses:
 * { id: number, image_url: string, caption: string | null }
 *
 * Saat pending upload (belum simpan dari preview):
 * { file: File, url: string (blob), rotation: number, _pending: true }
 *
 * Saat gagal upload (setelah save dari preview):
 * { file: File, url: string (blob), rotation: number, _failed: true }
 */

const images = computed(() => {
  const value = props.modelValue || []
  if (value && typeof value === 'object' && !Array.isArray(value) && value.images) {
    return Array.isArray(value.images) ? value.images : [value.images]
  }
  return Array.isArray(value) ? value : (value ? [value] : [])
})

/**
 * Mengecek apakah ada gambar yang sudah terisi (termasuk yang sedang upload/gagal).
 * Digunakan untuk menentukan kapan radio option ditampilkan.
 */
const hasImages = computed(() => {
  return images.value.length > 0
})

// Helper: ambil URL gambar dari berbagai format data
const getImgSrc = (img: any): string => {
  if (!img) return ''
  if (typeof img === 'string') return img
  // Format server: { image_url }
  if (img.image_url) return img.image_url
  // Format lokal/blob: { url }
  if (img.url) return img.url
  return ''
}

const allowedMimesString = computed(() => {
  const mimes = settings.value?.allowed_mimes || ['jpg', 'jpeg', 'png', 'webp']
  return mimes.map((m: string) => m.startsWith('.') ? m : `.${m}`).join(',')
})

const isMaxFilesReached = computed(() =>
  images.value.length >= (settings.value?.max_files || 1)
)

// Pastikan inspectionId selalu integer valid sebelum dipakai upload
const resolvedInspectionId = computed<number | null>(() => {
  const val = parseInt(String(props.inspectionId ?? ''), 10)
  if (isNaN(val)) {
    console.warn(
      `[ImageInput] ⚠️ inspectionId tidak valid: "${props.inspectionId}". ` +
      'Pastikan parent meneruskan prop :inspection-id="<id>" ke komponen ini.'
    )
    return null
  }
  return val
})

// Upload state — keyed by index in images array
const uploadingIndexes = ref<Set<number>>(new Set())
const failedIndexes    = ref<Set<number>>(new Set())

// Modal state
const fileInput         = ref<HTMLInputElement | null>(null)
const showSourceModal   = ref(false)
const showPreviewModal  = ref(false)
const previewStartIndex = ref(0)
const previewEditable   = ref(false)
const tempImages        = ref<any[]>([])

// ─── Source handling ─────────────────────────────────────────

// Flag: apakah file input dipanggil dari tombol "+" di dalam preview modal
// Kalau true, file baru harus di-APPEND ke tempImages (bukan buat list baru)
const isAddingFromPreview = ref(false)

const handleAddImage = () => {
  // Kalau preview sedang terbuka, jangan tutup — set flag agar processFiles append
  if (showPreviewModal.value) {
    isAddingFromPreview.value = true
  }
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

// ─── File process ────────────────────────────────────────────

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  processFiles(Array.from(input.files))
  input.value = ''
}

const processFiles = (files: File[]) => {
  const maxFiles = settings.value?.max_files || 1
  const maxSize  = (settings.value?.max_size || 2048) * 1024
  const allowed  = settings.value?.allowed_mimes || ['jpg', 'jpeg', 'png', 'webp']

  const valid: any[] = []
  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!allowed.includes(ext || '')) { emit('update:error', 'Tipe file tidak diizinkan'); continue }
    if (file.size > maxSize)           { emit('update:error', 'Ukuran file terlalu besar');  continue }
    valid.push({ file, url: URL.createObjectURL(file), rotation: 0, _pending: true })
  }
  if (!valid.length) return

  if (maxFiles === 1) {
    // Single mode — langsung buka preview dengan 1 gambar
    tempImages.value        = valid
    previewEditable.value   = true
    previewStartIndex.value = 0
    showPreviewModal.value  = true
    isAddingFromPreview.value = false
    return
  }

  // Multiple mode
  if (isAddingFromPreview.value) {
    // Tambah ke gambar yang sudah ada di tempImages (dari dalam preview)
    const currentInPreview = tempImages.value.length > 0 ? tempImages.value : [...images.value]
    const totalAfter = currentInPreview.length + valid.length
    if (totalAfter > maxFiles) {
      emit('update:error', `Maksimal ${maxFiles} file`)
      isAddingFromPreview.value = false
      return
    }
    const newList = [...currentInPreview, ...valid]
    tempImages.value        = newList
    previewEditable.value   = true
    previewStartIndex.value = currentInPreview.length  // fokus ke gambar baru
    showPreviewModal.value  = true
    isAddingFromPreview.value = false
    return
  }

  // Buka preview fresh dari tombol tambah di grid utama
  if (images.value.length + valid.length > maxFiles) {
    emit('update:error', `Maksimal ${maxFiles} file`)
    return
  }
  tempImages.value        = [...images.value, ...valid]
  previewEditable.value   = true
  previewStartIndex.value = images.value.length
  showPreviewModal.value  = true
}

// ─── Preview save → auto upload ──────────────────────────────

/**
 * handleSavePreview
 * Dipanggil saat user klik "Simpan" di ImagePreviewModal.
 * newImages = campuran gambar lama (sudah ada id) + gambar baru (_pending).
 *
 * Langkah:
 * 1. Pisahkan gambar lama (sudah punya id) vs gambar baru (punya .file).
 * 2. Emit modelValue dengan semua gambar (lama + baru, status baru = _uploading).
 * 3. Upload semua gambar baru secara paralel.
 * 4. Ganti entry _uploading dengan hasil API ({ id, image_url, caption }).
 * 5. Revoke blob URL lama agar tidak bocor memori.
 */
const handleSavePreview = async (newImages: any[]) => {
  showPreviewModal.value = false
  tempImages.value       = []

  const inspId = resolvedInspectionId.value
  if (!inspId) {
    console.error('[ImageInput] inspectionId tidak valid, upload dibatalkan.')
    return
  }

  /**
   * Bangun workingList:
   * - img.id && !img._rotated  → gambar lama tidak berubah, simpan apa adanya
   * - img._rotated             → gambar lama yang di-rotate; perlu DELETE lama + upload baru
   * - img.file && !img.id      → gambar baru biasa, langsung upload
   */
  const workingList: any[] = newImages.map((img) => {
    if (img.id && !img._rotated) return { ...img }   // tidak berubah
    return { ...img, _uploading: true }               // perlu diproses
  })

  emit('update:modelValue', workingList)

  const promises = workingList.map(async (img, idx) => {
    if (!img._uploading || !img.file) return null   // skip yang tidak perlu proses

    uploadingIndexes.value = new Set([...uploadingIndexes.value, idx])
    failedIndexes.value.delete(idx)
    emitUploadStatus()

    try {
      // Kalau ini gambar rotasi dari server → hapus yang lama dulu
      if (img._rotated && img._oldId) {
        try {
          await deleteInspectionImage(img._oldId)
        } catch (delErr) {
          console.warn('[ImageInput] Gagal hapus gambar lama saat rotate, lanjut upload:', delErr)
        }
      }

      const result = await uploadInspectionImages(
        inspId,
        props.item.inspection_item_id,
        [img.file],
         props.item.id,
          props.selectedOptionValue ?? null,
      )
      const uploaded = result?.data?.[0] ?? result?.[0]
      if (!uploaded?.id) throw new Error('Response server tidak mengandung data gambar')

      if (img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)

      return { index: idx, uploaded }
    } catch (err) {
      console.error('[ImageInput] Upload failed for index', idx, err)
      return { index: idx, failed: true }
    }
  })

  const results = await Promise.all(promises)

  for (const res of results) {
    if (!res) continue
    if (res.failed) {
      workingList[res.index] = { ...workingList[res.index], _uploading: false, _failed: true }
      failedIndexes.value    = new Set([...failedIndexes.value, res.index])
    } else if (res.uploaded) {
      workingList[res.index] = {
        id:        res.uploaded.id,
        image_url: res.uploaded.image_url,
        caption:   res.uploaded.caption ?? null
      }
    }
    uploadingIndexes.value.delete(res.index)
  }

  uploadingIndexes.value = new Set(uploadingIndexes.value)
  emit('update:modelValue', [...workingList])
  emitUploadStatus()
}

// ─── Retry upload ─────────────────────────────────────────────

const retryUpload = async (index: number) => {
  const img = images.value[index]
  if (!img || !img.file) return

  failedIndexes.value.delete(index)
  uploadingIndexes.value = new Set([...uploadingIndexes.value, index])

  const inspId = resolvedInspectionId.value
  if (!inspId) {
    console.error('[ImageInput] inspectionId tidak valid, retry dibatalkan.')
    failedIndexes.value = new Set([...failedIndexes.value, index])
    uploadingIndexes.value.delete(index)
    uploadingIndexes.value = new Set(uploadingIndexes.value)
    emitUploadStatus()
    return
  }

  try {
    const result = await uploadInspectionImages(
      inspId,
      props.item.inspection_item_id,
      [img.file],
      props.item.id,
       props.selectedOptionValue ?? null,
    )
    const uploaded = result.data?.[0] || result[0]

    if (img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)

    const current = [...images.value] as any[]
    current[index] = {
      id: uploaded.id,
      image_url: uploaded.image_url,
      caption: uploaded.caption ?? null
    }
    emit('update:modelValue', current)
  } catch (err) {
    console.error('Retry failed for index', index, err)
    const current = [...images.value] as any[]
    current[index] = { ...current[index], _failed: true }
    failedIndexes.value = new Set([...failedIndexes.value, index])
    emit('update:modelValue', current)
    emitUploadStatus()
  } finally {
    uploadingIndexes.value.delete(index)
    uploadingIndexes.value = new Set(uploadingIndexes.value)
  }
}

// ─── Preview (untuk gambar yang sudah di-upload) ──────────────

const openPreview = (index: number) => {
  // Jangan buka preview kalau masih uploading / failed
  if (uploadingIndexes.value.has(index) || failedIndexes.value.has(index)) return

  previewStartIndex.value = index
  // Normalise ke format { url, rotation } agar preview modal bisa render
  tempImages.value = images.value.map((img: any) => ({
    url: img.image_url || img.url || img,
    rotation: img.rotation || 0,
    id: img.id
  }))
  previewEditable.value  = true
  showPreviewModal.value = true
}

// ─── Remove ──────────────────────────────────────────────────

const removeImage = (index: number) => {
  const img = images.value[index]

  // ── Optimistic: langsung hapus dari UI tanpa tunggu API ──
  const current = [...images.value]
  current.splice(index, 1)

  // Shift failed/uploading indexes
  const newFailed    = new Set<number>()
  const newUploading = new Set<number>()
  failedIndexes.value.forEach((i) => { if (i < index) newFailed.add(i); else if (i > index) newFailed.add(i - 1) })
  uploadingIndexes.value.forEach((i) => { if (i < index) newUploading.add(i); else if (i > index) newUploading.add(i - 1) })
  failedIndexes.value    = newFailed
  uploadingIndexes.value = newUploading

  emitUploadStatus()
  emit('update:modelValue', current)

  // ── Background: revoke blob & delete dari server ──
  if (img?.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)

  if (img?.id) {
    deleteInspectionImage(img.id).catch((err) => {
      // Gagal delete di server — log saja, UI sudah terlanjur update
      console.warn('[ImageInput] Background delete gagal untuk id', img.id, err)
    })
  }
}
</script>