<!-- components/inspection/Input/ImageInput.vue -->
<!--
  ImageInput menggunakan useImageUploadStore (Pinia global).
  Upload berjalan di background → user bebas berpindah section.

  show_option: setelah gambar diupload, muncul RadioInput untuk memilih opsi.
  Flat format: localOptionValue = { status, note?, image?, damage_ids? }

  Modal strategy:
  - State buka/tutup pakai local ref (showSourceModal, showPreviewModal, showTempGallery)
  - Saat buka → daftarkan ke modal store (untuk back button handler di App.vue)
  - Saat modal store di-close via back button → watch currentModal untuk sync local ref

  [FIX] v3:
  1. syncExistingImages — tidak bail out kalau inspectionId null saat mount,
     retry via nextTick sampai resolvedInspectionId tersedia.
  2. syncExistingImages — guard alreadySynced filter by inspectionId,
     bukan seluruh store (cegah skip gambar inspeksi berbeda dengan sectionId sama).
  3. Tambah watch(resolvedInspectionId) — trigger sync ulang kalau props.inspectionId
     datang terlambat dari parent (async route param).
  4. watch(modelValue) — guard alreadySynced pakai inspectionId juga.
  5. onUnmounted — hanya 1 blok (sebelumnya ada duplikat 2x onUnmounted).
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
      <p class="text-sm text-gray-600 mt-2">Klik untuk upload gambar</p>

      <div class="flex justify-center mt-1">
        <p v-if="props.item.is_required" class="text-xs text-red-400">
          Wajib di isi
        </p>
        <p class="text-xs text-gray-400">
          &nbsp;{{ maxFiles > 1 ? `Maksimal ${maxFiles} gambar` : 'Maksimal 1 gambar' }}
        </p>
      </div>
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

  <!-- ===================== MODALS ===================== -->

  <ImageSourceModal
    :show="showSourceModal"
    :has-temp-images="hasTempImages"
    :temp-count="tempImagesCount"
    @close="closeSourceModal"
    @select="handleSourceSelect"
  />

  <UnassignedGalleryModal
    v-if="showTempGallery"
    :show="showTempGallery"
    :inspection-id="resolvedInspectionId ?? 0"
    :sections="[]"
    :target-item="item"
    :max-files="remainingSlots"
    @close="closeTempGallery"
    @assigned="handleTempAssigned"
  />

  <ImagePreviewModal
    :show="showPreviewModal"
    :images="pendingPreviewImages"
    :item-name="item.inspection_item.name"
    :max="maxFiles"
    :editable="true"
    :is-new-batch="isPreviewForNew"
    :start-index="previewStartIndex"
    :show-option="hasShowOption"
    :options="options"
    :option-required="settings?.option_is_required === true"
    :inspection-id="resolvedInspectionId"
    :initial-option-value="previewOptionValue"
    @close="handlePreviewClose"
    @save="handlePreviewSave"
    @add-more="handleAddFromPreview"
    @remove-stored="store.removeImage($event)"
  />

</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import type { FormItem } from '../../../types/formInspection'
import { useCameraSettings }          from '../../../composables/useCameraSettings'
import { useImageUploadStore }        from '../../../stores/useImageUploadStore'
import { useModalStore }              from '../../../stores/useModalStore'
import ImageSourceModal               from './Image/ImageSourceModal.vue'
import ImagePreviewModal              from './Image/ImagePreviewModal.vue'
import ImageThumbnail                 from './Image/ImageThumbnail.vue'
import RadioInput                     from './RadioInput.vue'
import UnassignedGalleryModal         from './Image/Temp/UnassignedGalleryModal.vue'
import { useTempImageStore }          from '../../../stores/useTempImageStore'
import type { RadioFlatValue }        from './RadioInput.vue'
import { Capacitor }                  from '@capacitor/core'
import { Filesystem }                 from '@capacitor/filesystem'

// ─────────────────────────────────────────────────────────────
// PROPS & EMITS
// ─────────────────────────────────────────────────────────────

const props = defineProps<{
  item:                 FormItem
  modelValue:           any
  error?:               string
  inspectionId?:        number | string | null
  selectedOptionValue?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue',   value: any): void
  (e: 'update:error',        error: string): void
  (e: 'update:valid',        valid: boolean): void
  (e: 'update:uploadStatus', status: { hasUploading: boolean; hasFailed: boolean }): void
}>()

// ─────────────────────────────────────────────────────────────
// MODAL STORE
// ─────────────────────────────────────────────────────────────

const modalStore = useModalStore()

const MODAL_SOURCE  = computed(() => `img-source-${props.item.id}`)
const MODAL_PREVIEW = computed(() => `img-preview-${props.item.id}`)
const MODAL_TEMP    = computed(() => `img-temp-${props.item.id}`)

const showSourceModal  = ref(false)
const showPreviewModal = ref(false)
const showTempGallery  = ref(false)

const openSourceModal  = () => { showSourceModal.value  = true; modalStore.open(MODAL_SOURCE.value)  }
const openPreviewModal = () => { showPreviewModal.value = true; modalStore.open(MODAL_PREVIEW.value) }
const openTempGallery  = () => { showTempGallery.value  = true; modalStore.open(MODAL_TEMP.value)   }

const closeSourceModal = () => {
  forceHideTemp.value   = false
  showSourceModal.value = false
  if (modalStore.currentModal === MODAL_SOURCE.value) modalStore.close()
}
const closeTempGallery = () => {
  showTempGallery.value = false
  if (modalStore.currentModal === MODAL_TEMP.value) modalStore.close()
}

const forceHideTemp = ref(false)

const handleAddFromPreview = () => {
  forceHideTemp.value = true
  handleAddImage()
}

watch(
  () => modalStore.currentModal,
  (current, previous) => {
    if (showSourceModal.value && current !== MODAL_SOURCE.value) {
      showSourceModal.value = false
    }
    if (showPreviewModal.value && previous === MODAL_PREVIEW.value && current !== MODAL_PREVIEW.value) {
      const isChildModalOpened = current === MODAL_SOURCE.value || current === MODAL_TEMP.value
      if (!isChildModalOpened) _cleanupPreviewOnClose()
    }
    if (showTempGallery.value && current !== MODAL_TEMP.value) {
      if (previous === MODAL_TEMP.value) showTempGallery.value = false
    }
  }
)

const _cleanupPreviewOnClose = () => {
  showPreviewModal.value = false
  if (isPreviewForNew.value) {
    pendingPreviewImages.value.forEach(img => {
      if (img._isNew && img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)
    })
    pendingPreviewImages.value = []
  }
  isPreviewForNew.value = false
}

// ─────────────────────────────────────────────────────────────
// STORE & CAMERA
// ─────────────────────────────────────────────────────────────

const store     = useImageUploadStore()
const tempStore = useTempImageStore()
const { settings: cameraSettings, listenForChanges } = useCameraSettings()

const localCameraSource        = ref(cameraSettings.value.source)
const localPreviewBeforeUpload = ref(cameraSettings.value.previewBeforeUpload ?? true)
const previewOptionValue       = ref<any>(null)

const isNative = Capacitor.isNativePlatform()

let cleanupListener: (() => void) | undefined

// ─────────────────────────────────────────────────────────────
// COMPUTED HELPERS
// ─────────────────────────────────────────────────────────────

const settings      = computed(() => props.item.settings || {})
const options       = computed(() => settings.value?.options || [])
const maxFiles      = computed(() => settings.value?.max_files ?? 1)
const hasShowOption = computed(() => settings.value?.show_option === true && options.value.length > 0)

const resolvedInspectionId = computed<number | null>(() => {
  const val = parseInt(String(props.inspectionId ?? ''), 10)
  if (isNaN(val)) return null
  return val
})

const resolvedSectionId = computed(() => props.item.id)

// [FIX] Filter by inspectionId agar tidak bocor lintas inspeksi
const sectionImages = computed(() =>
  resolvedInspectionId.value !== null
    ? store.getImagesBySection(resolvedSectionId.value, resolvedInspectionId.value)
    : []
)

const usedSlots      = computed(() => showPreviewModal.value ? pendingPreviewImages.value.length : sectionImages.value.length)
const remainingSlots = computed(() => Math.max(0, maxFiles.value - usedSlots.value))

const hasTempImages = computed(() => {
  if (forceHideTemp.value) return false
  return resolvedInspectionId.value !== null
    ? tempStore.hasUnassigned(resolvedInspectionId.value)
    : false
})

const tempImagesCount = computed(() =>
  resolvedInspectionId.value !== null ? tempStore.unassignedCount(resolvedInspectionId.value) : 0
)

const firstImage = computed<import('../../../stores/useImageUploadStore').InspectionImage | undefined>(
  () => sectionImages.value[0]
)

const isMaxFilesReached  = computed(() => sectionImages.value.length >= maxFiles.value)

const allowedMimesString = computed(() => {
  const mimes = settings.value?.allowed_mimes || ['jpg', 'jpeg', 'png', 'webp']
  return mimes.map((m: string) => m.startsWith('.') ? m : `.${m}`).join(',')
})

// ─────────────────────────────────────────────────────────────
// FUNGSI SYNC
// ─────────────────────────────────────────────────────────────

function syncExistingImages() {
  const mv = props.modelValue
  if (!mv) return

  let serverImages: Array<{ id: number; image_url: string; caption?: string | null }> = []

  if (Array.isArray(mv)) {
    serverImages = mv.filter((img: any) => img?.id && img?.image_url)
  } else if (mv && typeof mv === 'object') {
    const imgArr = mv.image ?? mv.images ?? mv
    if (Array.isArray(imgArr)) {
      serverImages = imgArr.filter((img: any) => img?.id && img?.image_url)
    }
  }

  if (!serverImages.length) return

  if (resolvedInspectionId.value === null) {
    nextTick(() => syncExistingImages())
    return
  }

  const existingInStore = store.getImagesBySection(
    resolvedSectionId.value,
    resolvedInspectionId.value
  )
  
  // UBAH: cek apakah server images sudah ada di store (by serverId)
  // Sebelumnya bail out kalau ada 1 pun gambar di store — terlalu greedy
  const existingServerIds = new Set(existingInStore.map(img => img.serverId))
  const missingImages = serverImages.filter(img => !existingServerIds.has(img.id))
  
  if (missingImages.length === 0) return // semua sudah ada

  store.syncFromServer({
    serverImages: missingImages, // sync hanya yang belum ada
    sectionId:        resolvedSectionId.value,
    itemId:           props.item.id,
    inspectionItemId: props.item.inspection_item_id,
    inspectionId:     resolvedInspectionId.value,
  })
}

// ─────────────────────────────────────────────────────────────
// CAMERAX
// ─────────────────────────────────────────────────────────────

const handleCameraXResult = async (event: Event) => {
  const result = (event as CustomEvent).detail
  if (!result?.success) {
    emit('update:error', result?.error || 'Gagal mengambil foto')
    return
  }

  const resultItemId  = result.itemId
  const currentItemId = String(props.item.id)
  if (resultItemId && resultItemId !== currentItemId) return

  const path = result.path
  if (!path) { emit('update:error', 'Path foto tidak ditemukan'); return }

  try {
    const fileResult = await Filesystem.readFile({ path: `file://${path}` })
    const base64Data = fileResult.data
    if (!base64Data) throw new Error('Data base64 kosong')

    let base64String: string
    if (base64Data instanceof Blob) {
      base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const r = reader.result
          if (typeof r !== 'string') { reject(new Error('Hasil FileReader bukan string')); return }
          const parts = r.split(',')
          resolve(parts.length > 1 ? parts[1]! : r)
        }
        reader.onerror = () => reject(new Error('Gagal membaca Blob'))
        reader.readAsDataURL(base64Data)
      })
    } else {
      base64String = base64Data
    }

    const byteString = atob(base64String)
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)

    const blob = new Blob([ab], { type: 'image/jpeg' })
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
    processFiles([file])

  } catch (err: any) {
    emit('update:error', `Error: ${err.message || 'Tidak bisa membaca file'}`)
  }
}

// ─────────────────────────────────────────────────────────────
// LIFECYCLE — hanya 1 blok onUnmounted
// ─────────────────────────────────────────────────────────────

onMounted(() => {
  cleanupListener = listenForChanges((s) => {
    localCameraSource.value        = s.source
    localPreviewBeforeUpload.value = s.previewBeforeUpload ?? true
  })

  syncExistingImages()

  window.addEventListener('cameraXResult', handleCameraXResult)

  if (!(window as any)._cameraXBridgeReady) {
    ;(window as any).onCameraXResult = (result: any) => {
      window.dispatchEvent(new CustomEvent('cameraXResult', { detail: result }))
    }
    ;(window as any)._cameraXBridgeReady = true
  }
})

// [FIX] Digabung jadi 1 blok — sebelumnya ada 2x onUnmounted (duplikat)
onUnmounted(() => {
  if (cleanupListener) cleanupListener()
  window.removeEventListener('cameraXResult', handleCameraXResult)
  modalStore.removeByKey(MODAL_SOURCE.value)
  modalStore.removeByKey(MODAL_PREVIEW.value)
  modalStore.removeByKey(MODAL_TEMP.value)
})

watch(cameraSettings, (v) => {
  localCameraSource.value        = v.source
  localPreviewBeforeUpload.value = v.previewBeforeUpload ?? true
}, { deep: true })

// [FIX] Guard alreadySynced pakai inspectionId
watch(
  () => props.modelValue,
  (mv) => {
    if (!mv || resolvedInspectionId.value === null) return
    const alreadySynced = store.getImagesBySection(
      resolvedSectionId.value,
      resolvedInspectionId.value
    ).length > 0
    if (alreadySynced) return
    syncExistingImages()
  },
  { immediate: false }
)

// [FIX] Kalau props.inspectionId datang terlambat (async dari parent route),
// begitu resolvedInspectionId berubah dari null ke angka → sync langsung
watch(
  resolvedInspectionId,
  (newId, oldId) => {
    if (!newId || newId === oldId) return
    syncExistingImages()
  }
)

// ─────────────────────────────────────────────────────────────
// SHOW_OPTION
// ─────────────────────────────────────────────────────────────

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

const computeValid = (): boolean => {
  const allImgs    = sectionImages.value
  const doneImgs   = allImgs.filter(img => img.status === 'done')
  const hasPending = allImgs.some(img => img.status === 'pending' || img.status === 'uploading')

  if (props.item.is_required) {
    if (allImgs.length === 0) return false
    if (doneImgs.length === 0 && hasPending) return false
  }

  if (hasShowOption.value && doneImgs.length > 0) {
    const optRequired = settings.value?.option_is_required === true
    if (optRequired && !localOptionValue.value?.status) return false
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
// SYNC STORE → EMIT MODELVALUE
// ─────────────────────────────────────────────────────────────

// [FIX] hasPendingUploads & hasFailedUploads pakai 2 argumen (+ inspectionId)
watch(
  () => {
    void store.images
    return [
      store.hasPendingUploads(resolvedSectionId.value, resolvedInspectionId.value ?? 0),
      store.hasFailedUploads(resolvedSectionId.value,  resolvedInspectionId.value ?? 0),
    ] as [boolean, boolean]
  },
  ([hasUploading, hasFailed]) => {
    emit('update:uploadStatus', {
      hasUploading: hasUploading as boolean,
      hasFailed:    hasFailed    as boolean,
    })
  }
)

watch(
  sectionImages,
  (imgs, prevImgs) => {
    const hasPending = imgs.some(img => img.status === 'pending' || img.status === 'uploading')
    if (hasPending) return

    const doneImages = imgs
      .filter(img => img.status === 'done')
      .map(img => ({
        id:        img.serverId,
        image_url: img.imageUrl || img.url,
        caption:   img.caption ?? null,
      }))

    // Guard: jangan emit [] kalau store belum pernah punya gambar
    // (belum sync dari server), tapi IZINKAN kalau sebelumnya ada lalu dikurangi
    // Cara bedakan: cek apakah prevImgs punya done images
    if (doneImages.length === 0) {
      const prevHadDone = prevImgs && prevImgs.some(img => img.status === 'done')
      if (!prevHadDone) {
        // Store memang belum sync, cek modelValue
        const currentMv = props.modelValue
        const currentHasImages = hasShowOption.value
          ? (currentMv && typeof currentMv === 'object' && !Array.isArray(currentMv)
              ? (Array.isArray(currentMv.image) && currentMv.image.length > 0)
              : false)
          : (Array.isArray(currentMv) && currentMv.length > 0)
        if (currentHasImages) return // store belum sync, jangan timpa
      }
      // prevHadDone = true → user baru hapus gambar terakhir, izinkan emit []
    }

    if (hasShowOption.value) {
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
// RADIO ITEM
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
    status:     value?.status     ?? null,
    note:       value?.note       ?? null,
    damage_ids: value?.damage_ids ?? [],
  })
}

const handleOptionValidUpdate = (valid: boolean) => {
  optionValid.value = valid
}

// ─────────────────────────────────────────────────────────────
// FILE INPUT & MODAL HANDLERS
// ─────────────────────────────────────────────────────────────

const fileInput            = ref<HTMLInputElement | null>(null)
const previewStartIndex    = ref(0)
const pendingPreviewImages = ref<any[]>([])
const isPreviewForNew      = ref(false)

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
  if      (source === 'ask')    openSourceModal()
  else if (source === 'camera') openFileInput('camera')
  else                          openFileInput('gallery')
}

const handleSourceSelect = (type: string) => {
  closeSourceModal()
  if (type === 'temp') { nextTick(() => openTempGallery()); return }
  openFileInput(type as 'camera' | 'gallery')
}

const handleTempAssigned = (
  _itemId: number,
  imageData: { id: number; image_url: string; caption: string | null }
) => {
  const inspId = resolvedInspectionId.value
  if (!inspId) return

  store.syncFromServer({
    serverImages:     [imageData],
    sectionId:        resolvedSectionId.value,
    itemId:           props.item.id,
    inspectionItemId: props.item.inspection_item_id,
    inspectionId:     inspId,
  })

  closeTempGallery()
}

const openFileInput = (type: 'camera' | 'gallery') => {
  if (isNative && type === 'camera') {
    if ((window as any).Android?.openCameraX) {
      ;(window as any).Android.openCameraX(
        String(props.item.id),
        props.item.inspection_item?.name || 'Item',
        settings.value?.aspect_ratio || '3:4'
      )
    } else {
      console.error('Android plugin not available')
      emit('update:error', 'Plugin Android tidak tersedia')
    }
    return
  }

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
    const ext           = file.name.split('.').pop()?.toLowerCase()
    const isValidByExt  = allowed.includes(ext || '')
    const isValidByMime = file.type.includes('image')
    if (!isValidByExt && !isValidByMime) { emit('update:error', 'Tipe file tidak diizinkan'); continue }
    if (!allowed.includes(ext || ''))    { emit('update:error', 'Tipe file tidak diizinkan'); continue }
    if (file.size > maxSize)             { emit('update:error', 'Ukuran file terlalu besar');  continue }
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
      const focusIndex           = pendingPreviewImages.value.length
      pendingPreviewImages.value = [...pendingPreviewImages.value, ...toAdd]
      previewStartIndex.value    = focusIndex
      if (hasShowOption.value) previewOptionValue.value = localOptionValue.value
    } else {
      const stored               = storedPreviewImages.value
      pendingPreviewImages.value = [...stored, ...toAdd]
      previewStartIndex.value    = stored.length
      isPreviewForNew.value      = true
      if (hasShowOption.value) previewOptionValue.value = localOptionValue.value
      openPreviewModal()
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
    selectedOptionValue: props.selectedOptionValue,
  })
}

const openPreview = (index: number) => {
  pendingPreviewImages.value = storedPreviewImages.value
  previewStartIndex.value    = index
  isPreviewForNew.value      = false
  if (hasShowOption.value) previewOptionValue.value = localOptionValue.value
  openPreviewModal()
}

const handlePreviewSave = (savedData: any) => {
  const savedImages      = savedData.images || savedData
  const savedOptionValue = savedData.optionValue

  showPreviewModal.value = false
  if (modalStore.currentModal === MODAL_PREVIEW.value) modalStore.close()
  isPreviewForNew.value  = false

  if (savedOptionValue && hasShowOption.value) {
    const mv = props.modelValue
    const currentImages = hasShowOption.value && mv && typeof mv === 'object' && !Array.isArray(mv)
      ? (mv.image ?? [])
      : (Array.isArray(mv) ? mv : [])
    emit('update:modelValue', {
      image:      currentImages,
      status:     savedOptionValue.status,
      note:       savedOptionValue.note,
      damage_ids: savedOptionValue.damage_ids ?? [],
    })
  }

  const inspId = resolvedInspectionId.value
  if (!inspId) {
    emit('update:error', 'ID inspeksi tidak valid')
    pendingPreviewImages.value.forEach(img => {
      if (img._isNew && img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)
    })
    pendingPreviewImages.value = []
    return
  }

  const newImages = savedImages.filter((img: any) => img._isNew && img.file)

  if (!newImages.length) {
    pendingPreviewImages.value.forEach(img => {
      if (img._isNew && img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)
    })
    pendingPreviewImages.value = []
    return
  }

  store.addImages({
    files:               newImages.map((img: any) => img.file),
    rotations:           newImages.map((img: any) => ((img.rotation || 0) % 360 + 360) % 360),
    sectionId:           resolvedSectionId.value,
    itemId:              props.item.id,
    inspectionItemId:    props.item.inspection_item_id,
    inspectionId:        inspId,
    selectedOptionValue: savedOptionValue?.status || props.selectedOptionValue,
  })

  newImages.forEach((img: any) => {
    if (img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)
  })

  pendingPreviewImages.value = []
}

const handlePreviewClose = () => {
  _cleanupPreviewOnClose()
  if (modalStore.currentModal === MODAL_PREVIEW.value) modalStore.close()
}
</script>

<style scoped>
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
</style>