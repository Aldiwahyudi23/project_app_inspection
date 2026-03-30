<!-- src/views/InspectionFormView.vue -->
<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getFormInspection, saveInspectionForm, deleteInspectionItem } from '../../services/formInspectionService'
import { useFormStorage }        from '../../composables/useFormStorage'
import type { FormInspectionData, FormItem, VehicleAttribute } from '../../types/formInspection'

import InspectionNavigation from '../../components/inspection/InspectionNavigation.vue'
import InspectionSection    from '../../components/inspection/InspectionSection.vue'
import CameraSettingsModal  from '../../components/inspection/Input/Image/CameraSettingsModal.vue'
import DamageItemModal      from '../../components/inspection/DamageItemModal.vue'
import { useCameraSettings }      from '../../composables/useCameraSettings'
import { useImageUploadStore }    from '../../stores/useImageUploadStore'
import { useTempImageStore }      from '../../stores/useTempImageStore'
import { useDraggableFab }          from '../../composables/useDraggableFab'
import UnassignedGalleryModal from '../../components/inspection/Input/Image/Temp/UnassignedGalleryModal.vue'

const route  = useRoute()
const router = useRouter()

const loading  = ref(true)
const saving   = ref(false)
const error    = ref<string | null>(null)
const formData = ref<FormInspectionData | null>(null)

const showHiddenSections = ref<Record<number, boolean>>({})
const triggeredItems     = ref<Record<number, boolean>>({})
const showDamageModal    = ref(false)
const showConfirmModal   = ref(false)

const showCameraSettings  = ref(false)
const showTempGallery     = ref(false)
const { settings: cameraSettings } = useCameraSettings()
const imageStore  = useImageUploadStore()
const tempStore   = useTempImageStore()


const tempImagesCount = computed(() =>
  formData.value ? tempStore.unassignedCount(formData.value.inspection.id) : 0
)

// untuk mengatur posisi tombol ngambang 
  // FAB Foto Bebas (biru) — kiri bawah
  const {
    position:    fabTempPos,
    isDimmed:    fabTempDimmed,
    attachTo:    fabTempAttach,
    // detachFrom:  fabTempDetach,
    shouldClick: fabTempShouldClick,
  } = useDraggableFab({
    storageKey:        'fab-pos-temp-gallery',
    defaultPos:        { x: 16, y: window.innerHeight - 80 },
    fabSize:           56,
    longPressDuration: 500,
  })

  // FAB Damage (merah)
  const {
    position:    fabDamagePos,
    isDimmed:    fabDamageDimmed,
    attachTo:    fabDamageAttach,
    detachFrom:  fabDamageDetach,
    shouldClick: fabDamageShouldClick,
  } = useDraggableFab({
    storageKey:        'fab-pos-damage',
    defaultPos:        { x: window.innerWidth - 72, y: window.innerHeight - 80 },
    fabSize:           56,
    longPressDuration: 500,
  })

  // Template refs untuk wrapper div FAB
  const fabTempEl   = ref<HTMLElement | null>(null)
  const fabDamageEl = ref<HTMLElement | null>(null)

  // Attach event listeners setelah mount
  // Pakai watch karena FAB damage muncul kondisional (v-if)

  watch(fabTempEl, (el) => {
    if (el) fabTempAttach(el)
  })

  watch(fabDamageEl, (el, oldEl) => {
    if (oldEl) fabDamageDetach(oldEl)
    if (el)    fabDamageAttach(el)
  })

  const handleFabTempClick = () => {
    if (!fabTempShouldClick()) return
    showTempGallery.value = true
  }

  const handleFabDamageClick = () => {
    if (!fabDamageShouldClick()) return
    showDamageModal.value = true
  }

// ─────────────────────────────────────────────────────────────
// CORE STATE
// formValues[itemId]:
//   radio/select/checkbox → { status, note?, image?, damage_ids? }
//   image                 → [{id, image_url, caption}]
//   text/number/etc       → string | number
// ─────────────────────────────────────────────────────────────

const formValues           = ref<Record<number, any>>({})
const formErrors           = ref<Record<number, string>>({})
const itemValidationStatus = ref<Record<number, boolean>>({})
// Computed langsung dari store — selalu reaktif walaupun komponen unmount (pindah section)
const itemUploadStatus = computed<Record<number, { hasUploading: boolean; hasFailed: boolean }>>(() => {
  const result: Record<number, { hasUploading: boolean; hasFailed: boolean }> = {}
  // Akses images agar computed ini reaktif terhadap perubahan status
  const allImages = imageStore.images
  const sectionIds = [...new Set(allImages.map(img => img.sectionId))]
  for (const sectionId of sectionIds) {
    const hasUploading = allImages.some(img =>
      img.sectionId === sectionId && (img.status === 'pending' || img.status === 'uploading')
    )
    const hasFailed = allImages.some(img =>
      img.sectionId === sectionId && img.status === 'failed'
    )
    if (hasUploading || hasFailed) {
      result[sectionId] = { hasUploading, hasFailed }
    }
  }
  return result
})

const inspectionId  = computed(() => Number(route.params.id))
provide('inspectionId', inspectionId)
const storage       = useFormStorage(inspectionId.value)
const activeSection = ref<number | null>(storage.activeSection.value)

// ─────────────────────────────────────────────────────────────
// SYNC STORE → formValues
// Hanya untuk input_type === 'image' (standalone, bukan nested).
// Untuk radio/checkbox/select, image sudah masuk lewat update:modelValue
// karena OptionRenderer emit update:value → parent kumpulkan ke formValues.
// ─────────────────────────────────────────────────────────────

watch(
  () => imageStore.images.map(img => ({
    localId: img.localId, status: img.status,
    sectionId: img.sectionId, serverId: img.serverId,
  })),
  () => {
    const sectionIds = [...new Set(imageStore.images.map(img => img.sectionId))]

    for (const sectionId of sectionIds) {
      const itemId   = sectionId
      const formItem = findItemById(itemId)
      if (!formItem) continue

      const allImgs  = imageStore.getImagesBySection(itemId)
      const doneImgs = allImgs.filter(img => img.status === 'done')
      const newImgArr = doneImgs.map(img => ({
        id:        img.serverId,
        image_url: img.imageUrl || img.url,
        caption:   img.caption ?? null,
      }))

      // ── CASE 1: input_type = 'image' standalone ─────────────────────────────
      if (formItem.input_type === 'image') {
        const hasShowOption = formItem.settings?.show_option === true

        if (hasShowOption) {
          // formValues[itemId] = { image: [...], status, note, damage_ids }
          if (doneImgs.length > 0) {
            const currentVal    = formValues.value[itemId]
            const currentImgArr = (currentVal && typeof currentVal === 'object' && !Array.isArray(currentVal))
              ? (currentVal.image ?? [])
              : (Array.isArray(currentVal) ? currentVal : [])
            const currentIds = currentImgArr.map((i: any) => i?.id).filter(Boolean).sort().join(',')
            const newIds     = newImgArr.map(i => i.id).filter(Boolean).sort().join(',')
            if (currentIds !== newIds) {
              const existingOption = (currentVal && typeof currentVal === 'object' && !Array.isArray(currentVal))
                ? { status: currentVal.status ?? null, note: currentVal.note ?? null, damage_ids: currentVal.damage_ids ?? [] }
                : { status: null, note: null, damage_ids: [] }
              formValues.value[itemId] = { image: newImgArr, ...existingOption }
              saveItemToStorage(itemId)
              if (!(itemId in itemValidationStatus.value)) {
                itemValidationStatus.value[itemId] = !formItem.is_required || newImgArr.length > 0
              }
            }
          }
          if (allImgs.length === 0) {
            const currentVal = formValues.value[itemId]
            const hasImages  = currentVal && typeof currentVal === 'object' && !Array.isArray(currentVal)
              ? (Array.isArray(currentVal.image) && currentVal.image.length > 0)
              : false
            if (hasImages) {
              const existingOption = (currentVal && typeof currentVal === 'object' && !Array.isArray(currentVal))
                ? { status: currentVal.status ?? null, note: currentVal.note ?? null, damage_ids: currentVal.damage_ids ?? [] }
                : { status: null, note: null, damage_ids: [] }
              formValues.value[itemId] = { image: [], ...existingOption }
              saveItemToStorage(itemId)
            }
          }

        } else {
          // formValues[itemId] = [{id, image_url, caption}]
          if (doneImgs.length > 0) {
            const currentVal = formValues.value[itemId]
            const currentIds = Array.isArray(currentVal)
              ? currentVal.map((i: any) => i?.id).filter(Boolean).sort().join(',')
              : ''
            const newIds = newImgArr.map(i => i.id).filter(Boolean).sort().join(',')
            if (currentIds !== newIds) {
              formValues.value[itemId] = newImgArr
              saveItemToStorage(itemId)
              itemValidationStatus.value[itemId] = !formItem.is_required || newImgArr.length > 0
            }
          }
          if (allImgs.length === 0 && Array.isArray(formValues.value[itemId])) {
            formValues.value[itemId] = []
            saveItemToStorage(itemId)
            if (formItem.is_required) itemValidationStatus.value[itemId] = false
          }
        }

      // ── CASE 2: input_type = radio/select/checkbox — nested image di OptionRenderer ──
      // sectionId di store = parentItemId (id item radio/select/checkbox)
      // formValues[itemId] = { status, note, image, damage_ids }
      } else if (['radio', 'select', 'checkbox'].includes(formItem.input_type)) {
        if (doneImgs.length > 0) {
          const currentVal = formValues.value[itemId]
          // Hanya proses jika item sudah punya status (option sudah dipilih)
          if (!currentVal || typeof currentVal !== 'object' || Array.isArray(currentVal)) continue
          // Skip jika belum ada status (option belum dipilih) — tidak ada yang perlu di-merge
          const hasStatus = Array.isArray(currentVal.status)
            ? currentVal.status.length > 0
            : !!currentVal.status
          if (!hasStatus) continue

          const currentImgArr = Array.isArray(currentVal.image) ? currentVal.image : []
          const currentIds    = currentImgArr.map((i: any) => i?.id).filter(Boolean).sort().join(',')
          const newIds        = newImgArr.map(i => i.id).filter(Boolean).sort().join(',')

          if (currentIds !== newIds) {
            // Merge image baru ke dalam flat value, pertahankan status/note/damage_ids
            formValues.value[itemId] = {
              ...currentVal,
              image: newImgArr,
            }
            saveItemToStorage(itemId)
            // validationStatus sudah dihandle komponen via update:valid — tidak di-override di sini
          }
        }
      }
    }
  }
)

// ─────────────────────────────────────────────────────────────
// VEHICLE FILTER HELPERS
// ─────────────────────────────────────────────────────────────

const isFieldActive = (value: any): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'boolean') return value === true
  if (typeof value === 'number')  return true
  if (typeof value === 'string')  return value.trim() !== ''
  if (Array.isArray(value))       return value.length > 0
  return false
}

const hasVehicleFilter = (settings: any): boolean => {
  if (!settings) return false
  return (
    isFieldActive(settings.box)          ||
    isFieldActive(settings.pickup)       ||
    isFieldActive(settings.doors)        ||
    isFieldActive(settings.drive)        ||
    isFieldActive(settings.fuel_type)    ||
    isFieldActive(settings.transmission)
  )
}

const isMatchVehicleAttr = (settings: any, vehicleAttr: VehicleAttribute): boolean => {
  if (!settings) return true
  if (isFieldActive(settings.box)          && settings.box          !== vehicleAttr.box)                    return false
  if (isFieldActive(settings.pickup)       && settings.pickup       !== vehicleAttr.pickup)                 return false
  if (isFieldActive(settings.doors)        && Number(settings.doors) !== Number(vehicleAttr.doors))         return false
  if (isFieldActive(settings.drive)        && settings.drive        !== vehicleAttr.drive)                  return false
  if (isFieldActive(settings.fuel_type)    && settings.fuel_type    !== vehicleAttr.fuel_type)              return false
  if (isFieldActive(settings.transmission) && !settings.transmission.includes(vehicleAttr.transmission))   return false
  return true
}

// ─────────────────────────────────────────────────────────────
// TRIGGER HELPERS
// ─────────────────────────────────────────────────────────────

const checkTriggers = (parentItemId: number, value: any) => {
  if (!formData.value) return
  const parentItem = findItemById(parentItemId)
  if (!parentItem || parentItem.input_type !== 'radio' || !parentItem.settings?.options) return

  // Ambil status string dari flat value
  const rawValue    = typeof value === 'object' && value !== null && 'status' in value ? value.status : value
  const selectedValues = Array.isArray(rawValue) ? rawValue : (rawValue ? [rawValue] : [])
  const childItems: FormItem[] = []

  formData.value?.template.sections.forEach(section => {
    section.items.forEach(item => {
      if ((item.settings?.parent_item_id?.length ?? 0) > 0) {
        const parentIds = (item.settings!.parent_item_id as any[]).map((id: any) => Number(id))
        if (parentIds.includes(parentItemId)) childItems.push(item)
      }
    })
  })

  childItems.forEach(item => { triggeredItems.value[item.id] = false })

  selectedValues.forEach(selectedValue => {
    const option = parentItem.settings?.options?.find((opt: any) => opt.value === selectedValue) as any
    if (option?.show_trigger && (option.target_item_id?.length ?? 0) > 0) {
      (option.target_item_id as any[]).map((id: any) => Number(id)).forEach((targetId: number) => {
        const targetItem = childItems.find(i => i.id === targetId)
        if (targetItem) {
          const targetParentIds = targetItem.settings.parent_item_id?.map((id: any) => Number(id)) || []
          if (targetParentIds.includes(parentItemId)) triggeredItems.value[targetId] = true
        }
      })
    }
  })
}

// ─────────────────────────────────────────────────────────────
// SECTIONS
// ─────────────────────────────────────────────────────────────

const isMatchVehicleFeature = (itemName: string, features: string[]): boolean => {
  if (!features || features.length === 0) return false
  const normalized = itemName.trim().toLowerCase()
  return features.some(f => f.trim().toLowerCase() === normalized)
}

const hasItemValue = (itemId: number): boolean => {
  const v = formValues.value[itemId]
  if (v === undefined || v === null || v === '') return false
  if (Array.isArray(v) && v.length === 0) return false
  if (typeof v === 'object' && !Array.isArray(v)) {
    if (Object.keys(v).length === 0) return false
    // flat option: cukup ada status
    if ('status' in v) return !!v.status || (Array.isArray(v.status) && v.status.length > 0)
  }
  return true
}

const sectionsWithProcessedItems = computed(() => {
  if (!formData.value) return []
  const vehicleAttr = formData.value.inspection.atribute_vehicle
  const features    = (vehicleAttr?.features ?? []) as string[]

  return formData.value.template.sections.map(section => ({
    ...section,
    items: section.items.map(item => {
      const settings        = item.settings || {}
      const hasFilter       = hasVehicleFilter(settings)
      const isTriggeredItem = settings?.is_triggered || false
      const isDamageItem    = section.is_damage_section === true
      const isFeatureItem   = isMatchVehicleFeature(item.inspection_item.name, features)

      const isVisibleByVehicle = hasFilter       ? isMatchVehicleAttr(settings, vehicleAttr) : true
      const isTriggered        = isTriggeredItem ? (triggeredItems.value[item.id] || false)  : true
      const isNativelyHidden   = !hasFilter && !isTriggeredItem && item.is_visible === false

      const itemHasValue   = hasItemValue(item.id)
      const isForceVisible = (isNativelyHidden || isDamageItem) && itemHasValue

      let finalVisibility: boolean
      if (isFeatureItem)      finalVisibility = true
      else if (isForceVisible) finalVisibility = true
      else if (isTriggeredItem) finalVisibility = isTriggered
      else if (hasFilter)       finalVisibility = isVisibleByVehicle
      else if (isDamageItem)    finalVisibility = false
      else                      finalVisibility = item.is_visible !== false

      return {
        ...item,
        _isVisibleByVehicle: isVisibleByVehicle,
        _hasVehicleFilter:   hasFilter,
        _isTriggeredItem:    isTriggeredItem,
        _isTriggered:        isTriggered,
        _finalVisibility:    finalVisibility,
        _isNativelyHidden:   isNativelyHidden,
        _isDamageItem:       isDamageItem,
        _isForceVisible:     isForceVisible,
        _isFeatureItem:      isFeatureItem,
      }
    })
  }))
})

const sections = computed(() => sectionsWithProcessedItems.value)

const emptyDamageItems = computed(() =>
  sectionsWithProcessedItems.value
    .flatMap(s => s.items)
    .filter(item => item._isDamageItem === true && item._isForceVisible !== true)
    .sort((a, b) => a.sort_order - b.sort_order)
)

const toggleSectionHiddenItems = (sectionId: number) => {
  showHiddenSections.value = { ...showHiddenSections.value, [sectionId]: !showHiddenSections.value[sectionId] }
}

const vehicleInfo          = computed(() => formData.value?.inspection)
const metadata             = computed(() => formData.value?.metadata || { damage_categories: [], transmissions: [] })

// ─────────────────────────────────────────────────────────────
// PROGRESS — hanya dari itemValidationStatus
// ─────────────────────────────────────────────────────────────

const lastSectionId  = computed((): number | null => {
  if (!formData.value?.template.sections.length) return null
  const sorted = [...formData.value.template.sections].sort((a, b) => b.sort_order - a.sort_order)
  return sorted[0]?.id ?? null
})

const isOnLastSection = computed(() => activeSection.value === lastSectionId.value)

const progress = computed(() => {
  if (!formData.value) return 0

  const visibleItems    = sectionsWithProcessedItems.value.flatMap(s => s.items).filter(i => i._finalVisibility)
  const requiredVisible = visibleItems.filter(i => i.is_required)
  if (requiredVisible.length === 0) return 100

  let validCount = 0
  for (const item of requiredVisible) {
    // Skip jika ada upload yang masih jalan/gagal
    const uploadSt = itemUploadStatus.value[item.id]
    if (uploadSt?.hasUploading || uploadSt?.hasFailed) continue

    if (itemValidationStatus.value[item.id] === true) validCount++
  }

  return Math.round((validCount / requiredVisible.length) * 100)
})

const isFormComplete = computed(() => progress.value === 100)

// ─────────────────────────────────────────────────────────────
// FIND ITEM BY ID
// ─────────────────────────────────────────────────────────────

const findItemById = (itemId: number): FormItem | null => {
  for (const section of formData.value?.template.sections || []) {
    const item = section.items.find(i => i.id === itemId)
    if (item) return item
  }
  return null
}

// ─────────────────────────────────────────────────────────────
// VALIDATE ITEM — hanya untuk input non-option (text, number, dll)
// Option type sudah divalidasi di dalam komponen via update:valid
// ─────────────────────────────────────────────────────────────

const validateItem = (itemId: number, value: any): boolean => {
  if (!formData.value) return true
  const foundItem = findItemById(itemId)
  if (!foundItem) return true

  const isOptionType = ['radio', 'select', 'checkbox'].includes(foundItem.input_type)

  // Option type → validasi sudah di komponen, tidak perlu ulang di sini
  // Hanya update formErrors jika ada (dikosongkan saja)
  if (isOptionType) {
    delete formErrors.value[itemId]
    return itemValidationStatus.value[itemId] !== false
  }

  let errorMsg = ''
  let isValid  = true

  const isEmpty = (v: any): boolean => {
    if (v === undefined || v === null || v === '') return true
    if (Array.isArray(v) && v.length === 0) return true
    return false
  }

  if (foundItem.is_required && isEmpty(value)) {
    errorMsg = 'Field ini harus diisi'; isValid = false
  } else if (!isEmpty(value)) {
    switch (foundItem.input_type) {
      case 'text':
      case 'textarea': {
        const strVal = String(value)
        const minLen = foundItem.settings?.min_length ? Number(foundItem.settings.min_length) : null
        const maxLen = foundItem.settings?.max_length ? Number(foundItem.settings.max_length) : null
        if (minLen && strVal.length < minLen)                                                                     { errorMsg = `Minimal ${minLen} karakter`; isValid = false }
        else if (maxLen && strVal.length > maxLen)                                                                { errorMsg = `Maksimal ${maxLen} karakter`; isValid = false }
        else if (foundItem.settings?.regex_pattern && !new RegExp(foundItem.settings.regex_pattern).test(strVal)) { errorMsg = 'Format tidak sesuai'; isValid = false }
        break
      }
      case 'number':
      case 'currency':
      case 'percentage': {
        const numValue = Number(value)
        const minKey   = foundItem.input_type === 'currency' ? 'min_amount' : 'min'
        const maxKey   = foundItem.input_type === 'currency' ? 'max_amount' : 'max'
        const minVal   = foundItem.settings?.[minKey] != null ? Number(foundItem.settings[minKey]) : null
        const maxVal   = foundItem.settings?.[maxKey] != null ? Number(foundItem.settings[maxKey]) : null
        if (minVal != null && !isNaN(minVal) && numValue < minVal)      { errorMsg = `Nilai minimal ${minVal}`; isValid = false }
        else if (maxVal != null && !isNaN(maxVal) && numValue > maxVal) { errorMsg = `Nilai maksimal ${maxVal}`; isValid = false }
        break
      }
    }
  }

  if (errorMsg) { formErrors.value[itemId] = errorMsg } else { delete formErrors.value[itemId] }
  itemValidationStatus.value[itemId] = isValid
  return isValid
}

// ─────────────────────────────────────────────────────────────
// STORAGE
// Format simpan:
//   option type  → { status, note, image, damage_ids }
//   image        → [{id, image_url, caption}]
//   text/etc     → primitive
// ─────────────────────────────────────────────────────────────

const saveItemToStorage = (itemId: number) => {
  storage.saveToStorage(itemId, formValues.value[itemId] ?? null)
}

// ─────────────────────────────────────────────────────────────
// LOAD FORM
// ─────────────────────────────────────────────────────────────

const loadForm = async (id: number) => {
  loading.value = true
  error.value   = null
  try {
    const response = await getFormInspection(id)
    if (response.data.success) {
      formData.value = response.data.data.form
      const storedValues = storage.formValues.value

      Object.keys(storedValues).forEach(key => {
        const itemId     = Number(key)
        const storedItem = storedValues[key]
        if (!storedItem || storedItem.value === null || storedItem.value === undefined) return

        const raw = storedItem.value

        // Format lama: { main, nested?, imageNested? } — migrate ke flat
        if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'main' in raw) {
          const formItem = findItemById(itemId)
          if (formItem && ['radio', 'select', 'checkbox'].includes(formItem.input_type)) {
            // Konversi dari format lama ke flat
            const main   = raw.main
            const nested = raw.nested?.['aggregated'] ?? {}
            formValues.value[itemId] = main
              ? {
                  status:     Array.isArray(main) ? main : main,
                  note:       nested.textarea ?? null,
                  image:      nested.image    ?? null,
                  damage_ids: nested.damage_ids ?? [],
                }
              : null
          } else {
            formValues.value[itemId] = raw.main
          }
        } else {
          // Format baru atau image/primitive — langsung pakai
          formValues.value[itemId] = raw
        }

        // Restore current_result dari backend jika localStorage kosong
        // (ditangani di bawah setelah loop)
      })

      // Restore dari current_result backend jika belum ada di localStorage
      formData.value?.template.sections.forEach(section => {
        section.items.forEach(item => {
          if (formValues.value[item.id] !== undefined) return  // sudah ada di storage

          const currentResult = (item as any).current_result
          if (currentResult === null || currentResult === undefined) return

          const it = findItemById(item.id)
          if (!it) return

          if (['radio', 'select', 'checkbox'].includes(it.input_type)) {
            // current_result dari backend: { main: "Ada", nested: { aggregated: { textarea, image, damage_ids } } }
            // atau format flat: { status, note, image, damage_ids }
            if (currentResult && typeof currentResult === 'object' && 'main' in currentResult) {
              const agg = currentResult.nested?.['aggregated'] ?? {}
              formValues.value[item.id] = {
                status:     currentResult.main,
                note:       agg.textarea    ?? null,
                image:      agg.image       ?? null,
                damage_ids: agg.damage_ids  ?? [],
              }
            } else if (currentResult && typeof currentResult === 'object' && 'status' in currentResult) {
              formValues.value[item.id] = currentResult
            }
          } else if (it.input_type === 'image') {
            // image dengan show_option: current_result = { image: [...], status, note, damage_ids }
            // image biasa: current_result = [{id, image_url}]
            if (it.settings?.show_option === true) {
              if (currentResult && typeof currentResult === 'object' && !Array.isArray(currentResult)) {
                formValues.value[item.id] = currentResult  // format flat sudah benar
              } else if (Array.isArray(currentResult)) {
                // format lama: array gambar saja, bungkus jadi flat
                formValues.value[item.id] = { image: currentResult, status: null, note: null, damage_ids: [] }
              }
            } else {
              formValues.value[item.id] = Array.isArray(currentResult) ? currentResult : null
            }
          } else {
            formValues.value[item.id] = currentResult
          }
        })
      })

      // Run validation & triggers untuk semua nilai yang sudah di-restore
      Object.keys(formValues.value).forEach(key => {
        const itemId = Number(key)
        const value  = formValues.value[itemId]
        const formItem = findItemById(itemId)

        if (formItem && ['radio', 'select', 'checkbox'].includes(formItem.input_type)) {
          // Validasi option type — komponen akan emit update:valid saat mount, beri initial state dulu
          const hasStatus = value && (typeof value === 'object'
            ? (Array.isArray(value.status) ? value.status.length > 0 : !!value.status)
            : false)
          itemValidationStatus.value[itemId] = hasStatus ? true : !formItem.is_required
        } else if (formItem?.input_type === 'image' && formItem.settings?.show_option === true) {
          // Image dengan show_option — komponen emit update:valid saat mount
          // Beri initial state berdasarkan apakah sudah ada gambar + status
          const mv = value
          const hasImages = mv && typeof mv === 'object' && !Array.isArray(mv)
            ? (Array.isArray(mv.image) && mv.image.length > 0)
            : (Array.isArray(mv) && mv.length > 0)
          const hasStatus = mv && typeof mv === 'object' && !Array.isArray(mv) ? !!mv.status : false
          const optRequired = formItem.settings?.option_is_required === true
          if (!formItem.is_required) {
            itemValidationStatus.value[itemId] = true
          } else if (!hasImages) {
            itemValidationStatus.value[itemId] = false
          } else if (optRequired && !hasStatus) {
            itemValidationStatus.value[itemId] = false
          } else {
            itemValidationStatus.value[itemId] = true
          }
        } else {
          validateItem(itemId, value)
        }

        checkTriggers(itemId, value)
      })

      if (!activeSection.value && (formData.value?.template.sections.length ?? 0) > 0) {
        activeSection.value = formData.value!.template.sections[0]!.id
        storage.saveActiveSection(activeSection.value)
      }
      storage.clearExpired()

      // Load foto bebas (temp) yang belum diassign dari server
      if (formData.value?.inspection.id) {
        tempStore.fetchFromServer(formData.value.inspection.id)
      }
    } else {
      error.value = response.data.message
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal memuat form inspeksi'
    console.error('Error loading form:', err)
  } finally {
    loading.value = false
  }
}

// ─────────────────────────────────────────────────────────────
// EVENT HANDLERS
// ─────────────────────────────────────────────────────────────

const handleSettingsUpdate = () => { console.log('Camera settings updated:', cameraSettings.value) }

const selectSection = (sectionId: number) => {
  activeSection.value = sectionId
  storage.saveActiveSection(sectionId)
}

/** Dipanggil saat user mengubah nilai input (emit update:modelValue dari komponen) */
const handleValueUpdate = (itemId: number, value: any) => {
  formValues.value[itemId] = value
  saveItemToStorage(itemId)

  const formItem = findItemById(itemId)
  // Image dengan show_option: validasi datang dari update:valid ImageInput
  // Jangan panggil validateItem karena akan override itemValidationStatus
  if (formItem?.input_type === 'image' && formItem.settings?.show_option === true) {
    checkTriggers(itemId, value)
    return
  }

  validateItem(itemId, value)
  checkTriggers(itemId, value)
}

/** Dipanggil saat komponen (RadioInput, SelectInput, CheckboxInput, dll) emit update:valid */
const handleValidUpdate = (itemId: number, valid: boolean) => {
  itemValidationStatus.value[itemId] = valid
}

const handleErrorUpdate = (itemId: number, errorMsg: string) => {
  if (errorMsg) {
    formErrors.value[itemId]           = errorMsg
    itemValidationStatus.value[itemId] = false
  } else {
    delete formErrors.value[itemId]
    // Jangan override valid status jika sudah di-set oleh komponen
    const v       = formValues.value[itemId]
    const isEmpty = !v || (Array.isArray(v) && v.length === 0) || v === ''
    if (isEmpty && !(findItemById(itemId)?.is_required)) {
      itemValidationStatus.value[itemId] = true
    }
  }
}

// handleUploadStatusUpdate dihapus — itemUploadStatus sekarang computed dari store

// ─────────────────────────────────────────────────────────────
// DELETE ITEM
// ─────────────────────────────────────────────────────────────

const handleDeleteItem = async (itemId: number, inspectionItemId: number) => {
  imageStore.clearSection(itemId)

  const vals   = { ...formValues.value };           delete vals[itemId];   formValues.value           = vals
  const errs   = { ...formErrors.value };           delete errs[itemId];   formErrors.value           = errs
  const status = { ...itemValidationStatus.value }; delete status[itemId]; itemValidationStatus.value = status

  try {
    const id        = inspectionId.value
    const itemIdStr = String(itemId)
    const keysToDelete: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      if (key.includes(itemIdStr) && key.includes(String(id))) { keysToDelete.push(key); continue }
      if (key.endsWith(`_${itemIdStr}`) || key.endsWith(`:${itemIdStr}`)) keysToDelete.push(key)
    }
    keysToDelete.forEach(key => localStorage.removeItem(key))
  } catch (e) { console.warn('[Delete] localStorage scan error:', e) }

  if (typeof (storage as any).removeFromStorage === 'function') {
    try { (storage as any).removeFromStorage(itemId) } catch (e) {}
  }
  try { storage.saveToStorage(itemId, null) } catch (e) {}

  try {
    await deleteInspectionItem(formData.value?.inspection.id ?? 0, inspectionItemId)
  } catch (e: any) {
    console.warn(`[Delete] Gagal hapus item ${itemId}:`, e?.response?.data?.message || e)
  }
}

// ─────────────────────────────────────────────────────────────
// DAMAGE MODAL
// ─────────────────────────────────────────────────────────────

/**
 * Dipanggil saat UnassignedGalleryModal assign foto ke item (lokal only).
 * Assign sudah disimpan di useTempImageStore.
 * Di sini kita:
 * 1. Update formValues[itemId] agar thumbnail muncul di ImageInput
 * 2. Sync ke imageStore agar ImageInput reaktif
 * 3. Simpan ke localStorage
 */
const handleTempAssigned = (
  itemId: number,
  imageData: { id: number; image_url: string; caption: string | null }
) => {
  const formItem = findItemById(itemId)
  if (!formItem) return

  // Sync ke imageUploadStore agar ImageInput langsung tampil thumbnail
  const inspId = formData.value?.inspection.id
  if (inspId) {
    imageStore.syncFromServer({
      serverImages:     [imageData],
      sectionId:        itemId,
      itemId:           itemId,
      inspectionItemId: formItem.inspection_item_id,
      inspectionId:     inspId,
    })
  }

  // Update formValues — append ke array yang sudah ada (cegah duplikat)
  const currentVal = formValues.value[itemId]
  const currentArr = Array.isArray(currentVal) ? currentVal : []
  if (!currentArr.find((i: any) => i.id === imageData.id)) {
    formValues.value[itemId] = [...currentArr, imageData]
    saveItemToStorage(itemId)
    // Update validasi
    itemValidationStatus.value[itemId] = true
  }
}

const handleDamageItemSave = (itemId: number, value: any) => {
  formValues.value[itemId] = value
  saveItemToStorage(itemId)

  const formItem  = findItemById(itemId)
  const isOptType = ['radio', 'select', 'checkbox'].includes(formItem?.input_type ?? '')
  const isImgWithOpt = formItem?.input_type === 'image' && formItem?.settings?.show_option === true

  if (isOptType || isImgWithOpt) {
    // Validasi dari komponen — beri initial state berdasarkan value
    const hasStatus = value && (typeof value === 'object'
      ? (Array.isArray(value.status) ? value.status.length > 0 : !!value.status)
      : false)
    itemValidationStatus.value[itemId] = hasStatus ? true : !(formItem?.is_required ?? false)
  } else {
    validateItem(itemId, value)
  }

  checkTriggers(itemId, value)
  if (emptyDamageItems.value.length === 0) showDamageModal.value = false
}

// ─────────────────────────────────────────────────────────────
// VALIDATE FORM (sebelum submit)
// ─────────────────────────────────────────────────────────────

const validateForm = (): boolean => {
  formErrors.value = {}
  let isValid = true
  if (!formData.value) return false

  sectionsWithProcessedItems.value.forEach(section => {
    section.items.forEach(item => {
      if (item._finalVisibility && item.is_required) {
        const isOptionType    = ['radio', 'select', 'checkbox'].includes(item.input_type)
        const isImageWithOpts = item.input_type === 'image' && item.settings?.show_option === true

        if (isOptionType || isImageWithOpts) {
          // Validasi sudah dilakukan di dalam komponen via update:valid
          if (itemValidationStatus.value[item.id] !== true) isValid = false
        } else {
          if (!validateItem(item.id, formValues.value[item.id])) isValid = false
        }
      }
    })
  })
  return isValid
}

const confirmSubmit = () => {
  if (!validateForm()) {
    const firstErrorId = Object.keys(formErrors.value)[0]
    if (firstErrorId) {
      document.getElementById(`item-${firstErrorId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }
  showConfirmModal.value = true
}

// ─────────────────────────────────────────────────────────────
// SAVE FORM — build payload
// ─────────────────────────────────────────────────────────────

const sanitizeFlatValue = (value: any, _formItem: FormItem | null): any => {
  if (value === null || value === undefined) return value

  // Image array
  if (Array.isArray(value)) {
    return value.filter(img => img?.id).map(img => ({ id: img.id }))
  }

  // Flat option value: { status, note, image, damage_ids }
  if (typeof value === 'object' && 'status' in value) {
    return {
      status:     value.status,
      note:       value.note       ?? null,
      image:      Array.isArray(value.image)
        ? value.image.filter((img: any) => img?.id).map((img: any) => ({ id: img.id }))
        : null,
      damage_ids: value.damage_ids ?? [],
    }
  }

  return value
}

const saveForm = async () => {
  showConfirmModal.value = false
  saving.value = true
  try {
    const results = Object.keys(formValues.value).map(itemIdStr => {
      const itemId           = Number(itemIdStr)
      const formItem         = findItemById(itemId)
      const inspectionItemId = formItem?.inspection_item_id
      if (!inspectionItemId) return null

      return {
        inspection_item_id: inspectionItemId,
        item_id:            itemId,
        value:              sanitizeFlatValue(formValues.value[itemId], formItem),
      }
    }).filter(Boolean)

    await saveInspectionForm(inspectionId.value, { results })

    // ── Reset store gambar setelah submit berhasil ──
    imageStore.clearInspection( formData.value?.inspection.id ?? 0 )

    storage.clearStorage()
    router.push('/dashboard/job')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal menyimpan form'
  } finally {
    saving.value = false
  }
}

// ─────────────────────────────────────────────────────────────
// SCROLL
// ─────────────────────────────────────────────────────────────

watch(activeSection, async (newVal) => {
  if (newVal) {
    try {
      await nextTick()
      requestAnimationFrame(() => {
        const element = document.getElementById(`section-${newVal}`)
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } catch (e) { console.warn('Scroll error:', e) }
  }
})

onMounted(async () => { await loadForm(inspectionId.value) })
</script>

<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Overlay loading saat submit -->
    <Transition name="fade">
      <div
        v-if="saving"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
      >
        <div class="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        <p class="text-white font-semibold text-base">Menyimpan data inspeksi…</p>
        <p class="text-white/70 text-sm">Mohon tunggu, jangan tutup halaman ini</p>
      </div>
    </Transition>

    <!-- Modal konfirmasi submit -->
    <Transition name="fade">
      <div
        v-if="showConfirmModal"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        @click.self="showConfirmModal = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
          <div class="pt-6 pb-2 flex justify-center">
            <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <div class="px-6 pb-2 text-center">
            <h3 class="text-lg font-bold text-gray-800 mb-1">Kirim Hasil Inspeksi?</h3>
            <p class="text-sm text-gray-500 leading-relaxed">
              Data inspeksi untuk
              <span class="font-semibold text-gray-700">{{ vehicleInfo?.vehicle_name }}</span>
              <span class="font-mono text-blue-600 ml-1">({{ vehicleInfo?.license_plate }})</span>
              akan dikirim dan tidak bisa diubah lagi.
            </p>
          </div>
          <div class="mx-6 mt-3 mb-4 bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-xs text-gray-500">Kelengkapan form</p>
              <p class="text-sm font-bold text-green-600">{{ progress }}% selesai</p>
            </div>
          </div>
          <div class="px-6 pb-6 flex flex-col gap-2">
            <button
              @click="saveForm"
              class="w-full py-3.5 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
              Ya, Kirim Sekarang
            </button>
            <button
              @click="showConfirmModal = false"
              class="w-full py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              Cek Ulang Dulu
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div class="px-4 py-3 flex items-center justify-between">
        <div class="flex items-center">
          <button @click="router.back()" class="p-2 hover:bg-gray-100 rounded-full mr-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-sm font-semibold">Form Inspeksi</h1>
        </div>
        <div class="flex items-center space-x-3">
          <div class="text-sm">
            <span class="font-medium text-blue-600">{{ progress }}%</span>
          </div>
          <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full bg-blue-500 transition-all duration-300" :style="{ width: progress + '%' }"></div>
          </div>
          <button
            @click="showCameraSettings = true"
            class="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Pengaturan Kamera"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="mt-3 text-gray-600">Memuat form inspeksi...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center h-64 px-4">
      <div class="text-center max-w-md">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-gray-800 mb-2">Gagal Memuat Form</h2>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <button @click="router.go(0)" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Coba Lagi</button>
      </div>
    </div>

    <!-- Form Content -->
    <div v-else-if="formData" class="pb-6">

      <!-- Vehicle Info -->
      <div class="bg-white border-b border-gray-200 px-4 py-3">
        <div class="flex items-start space-x-3">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 14l1.5-4A2 2 0 018.4 8h7.2a2 2 0 011.9 2l1.5 4M4 14h16M6 18a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm9 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zM5 14v3h14v-3" />
            </svg>
          </div>
          <div>
            <h2 class="font-semibold text-sm text-gray-800">{{ vehicleInfo?.vehicle_name }}</h2>
            <p class="text-sm text-gray-600 font-mono mt-0.5">{{ vehicleInfo?.license_plate }}</p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <InspectionNavigation
        :sections="sections"
        :active-section="activeSection"
        :values="formValues"
        :validation-status="itemValidationStatus"
        :show-hidden-sections="showHiddenSections"
        :upload-status="itemUploadStatus"
        @select="selectSection"
        @toggle-hidden="toggleSectionHiddenItems"
      />

      <!-- Section Content -->
      <div class="px-2 py-2">
        <div v-for="section in sections" :key="section.id" :id="`section-${section.id}`" class="scroll-mt-[120px]">
          <InspectionSection
            v-if="activeSection === section.id"
            :section="section"
            :inspectionId="vehicleInfo?.id ?? 0"
            :values="formValues"
            :errors="formErrors"
            :metadata="metadata"
            :vehicle-attr="formData.inspection.atribute_vehicle"
            :show-hidden-items="showHiddenSections[section.id] || false"
            :triggered-items="triggeredItems"
            @update:value="handleValueUpdate"
            @update:error="handleErrorUpdate"
            @update:valid="handleValidUpdate"
            @delete:item="handleDeleteItem"
            @update:upload-status="() => {}"
          />
        </div>

        <!-- Submit Button -->
        <Transition name="submit-btn">
          <div v-if="isOnLastSection" class="mt-2">
            <Transition name="fade">
              <div
                v-if="!isFormComplete"
                class="mb-3 flex items-center space-x-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
              >
                <svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-xs text-amber-700">
                  Selesaikan semua item wajib terlebih dahulu <span class="font-semibold">({{ progress }}%)</span>
                </p>
              </div>
            </Transition>

            <button
              @click="confirmSubmit"
              :disabled="saving || !isFormComplete"
              class="w-full py-4 px-4 rounded-2xl font-semibold text-base transition-all duration-300 flex items-center justify-center space-x-2"
              :class="isFormComplete
                ? 'bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white shadow-lg shadow-blue-200'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
            >
              <span v-if="isFormComplete" class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Submit Inspeksi</span>
              </span>
              <span v-else class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Submit Inspeksi</span>
              </span>
            </button>
          </div>
        </Transition>
      </div>
    </div>

        <!-- Dim overlay FAB Temp -->
  <Transition name="fab-dim">
    <div
      v-if="fabTempDimmed"
      class="fixed inset-0 z-[39] bg-black/40 pointer-events-none"
    />
  </Transition>

  <!-- FAB Temp draggable -->
  <div
    ref="fabTempEl"
    class="fixed z-40 touch-none select-none"
    :style="{ left: fabTempPos.x + 'px', top: fabTempPos.y + 'px' }"
  >
    <div
      class="absolute inset-0 rounded-full transition-all duration-200"
      :class="fabTempDimmed ? 'ring-4 ring-white/70 ring-offset-2 scale-110' : ''"
    />
    <button
      @click="handleFabTempClick"
      class="relative w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg
             flex items-center justify-center transition-transform duration-200"
      :class="fabTempDimmed ? 'scale-110 bg-blue-600 cursor-grabbing' : 'active:scale-95'"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07
             4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012
             2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <div
        v-if="tempImagesCount > 0"
        class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-orange-500
               text-white text-[10px] font-bold rounded-full flex items-center justify-center"
      >
        {{ tempImagesCount }}
      </div>
    </button>
    <Transition name="fab-hint">
      <div
        v-if="fabTempDimmed"
        class="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap
               bg-black/70 text-white text-[10px] px-2 py-1 rounded-full pointer-events-none"
      >
        Seret untuk pindah
      </div>
    </Transition>
  </div>


<!-- FAB DAMAGE (merah) — sama, ganti dengan ref: -->

  <!-- Dim overlay FAB Damage -->
  <Transition name="fab-dim">
    <div
      v-if="fabDamageDimmed"
      class="fixed inset-0 z-[39] bg-black/40 pointer-events-none"
    />
  </Transition>

  <!-- FAB Damage draggable -->
  <Transition name="fab">
    <div
      v-if="formData && emptyDamageItems.length > 0"
      ref="fabDamageEl"
      class="fixed z-40 touch-none select-none"
      :style="{ left: fabDamagePos.x + 'px', top: fabDamagePos.y + 'px' }"
    >
      <div
        class="absolute inset-0 rounded-full transition-all duration-200"
        :class="fabDamageDimmed ? 'ring-4 ring-white/70 ring-offset-2 scale-110' : ''"
      />
      <button
        @click="handleFabDamageClick"
        class="relative w-14 h-14 bg-red-500 text-white rounded-full shadow-lg shadow-red-200
               flex items-center justify-center transition-transform duration-200"
        :class="fabDamageDimmed ? 'scale-110 bg-red-600 cursor-grabbing' : 'hover:bg-red-600 active:scale-95'"
        title="Tambah Item Kerusakan"
      >
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
        </svg>
        <!-- <span class="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 bg-white text-red-600
                     text-xs font-bold rounded-full flex items-center justify-center shadow border-2 border-red-500">
          {{ emptyDamageItems.length }}
        </span> -->
      </button>
      <Transition name="fab-hint">
        <div
          v-if="fabDamageDimmed"
          class="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap
                 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full pointer-events-none"
        >
          Seret untuk pindah
        </div>
      </Transition>
    </div>
  </Transition>

  </div>

  <!-- Unassigned Gallery Modal -->
  <UnassignedGalleryModal
    v-if="showTempGallery"
    :show="showTempGallery"
    :inspection-id="formData?.inspection.id ?? 0"
    :sections="sections"
    @close="showTempGallery = false"
    @assigned="handleTempAssigned"
  />

  <!-- Damage Item Modal -->
  <DamageItemModal
    :show="showDamageModal"
    :damage-items="emptyDamageItems"
    :values="formValues"
    :metadata="metadata"
    :inspectionId="inspectionId"
    @close="showDamageModal = false"
    @save-item="handleDamageItemSave"
  />

  <CameraSettingsModal
    :show="showCameraSettings"
    @close="showCameraSettings = false"
    @update="handleSettingsUpdate"
  />
</template>

<style scoped>
html { scroll-behavior: smooth; }

.fab-enter-active, .fab-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.fab-enter-from, .fab-leave-to { opacity: 0; transform: scale(0.4) translateY(16px); }

.submit-btn-enter-active, .submit-btn-leave-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.submit-btn-enter-from, .submit-btn-leave-to { opacity: 0; transform: translateY(24px); }

.fade-enter-active, .fade-leave-active { transition: all 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

.fab-dim-enter-active, .fab-dim-leave-active { transition: opacity 0.25s ease; }
.fab-dim-enter-from,   .fab-dim-leave-to     { opacity: 0; }

.fab-hint-enter-active, .fab-hint-leave-active { transition: opacity 0.2s ease; }
.fab-hint-enter-from,   .fab-hint-leave-to     { opacity: 0; }
</style>