<!-- src/views/InspectionFormView.vue -->
<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, provide  } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getFormInspection, saveInspectionForm } from '../../services/formInspectionService'
import { useFormStorage } from '../../composables/useFormStorage'
import type { FormInspectionData, Section, FormItem, VehicleAttribute } from '../../types/formInspection'

import InspectionNavigation from '../../components/inspection/InspectionNavigation.vue'
import InspectionSection    from '../../components/inspection/InspectionSection.vue'
import CameraSettingsModal  from '../../components/inspection/Input/Image/CameraSettingsModal.vue'
import DamageItemModal      from '../../components/inspection/DamageItemModal.vue'
import { useCameraSettings } from '../../composables/useCameraSettings'

const route  = useRoute()
const router = useRouter()

const loading  = ref(true)
const saving   = ref(false)
const error    = ref<string | null>(null)
const formData = ref<FormInspectionData | null>(null)

const showHiddenSections = ref<Record<number, boolean>>({})
const triggeredItems     = ref<Record<number, boolean>>({})
const showDamageModal    = ref(false)

function reloadRoute() { router.go(0) }

const nestedValues = ref<Record<string | number, any>>({})
const nestedErrors = ref<Record<string, string>>({})

const showCameraSettings = ref(false)
const { settings: cameraSettings } = useCameraSettings()

const formValues           = ref<Record<number, any>>({})
const formErrors           = ref<Record<number, string>>({})
const itemValidationStatus = ref<Record<number, boolean>>({})

const inspectionId  = computed(() => Number(route.params.id))
provide('inspectionId', inspectionId)
const storage       = useFormStorage(inspectionId.value)
const activeSection = ref<number | null>(storage.activeSection.value)

// Tambah reactive state untuk tracking upload status per item
const itemUploadStatus = ref<Record<number, { hasUploading: boolean; hasFailed: boolean }>>({})

const handleUploadStatusUpdate = (itemId: number, status: { hasUploading: boolean; hasFailed: boolean }) => {
  if (!status.hasUploading && !status.hasFailed) {
    const s = { ...itemUploadStatus.value }
    delete s[itemId]
    itemUploadStatus.value = s
  } else {
    itemUploadStatus.value = { ...itemUploadStatus.value, [itemId]: status }
  }
}

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
  if (isFieldActive(settings.box)          && settings.box          !== vehicleAttr.box)                      return false
  if (isFieldActive(settings.pickup)       && settings.pickup       !== vehicleAttr.pickup)                   return false
  if (isFieldActive(settings.doors)        && Number(settings.doors) !== Number(vehicleAttr.doors))           return false
  if (isFieldActive(settings.drive)        && settings.drive        !== vehicleAttr.drive)                    return false
  if (isFieldActive(settings.fuel_type)    && settings.fuel_type    !== vehicleAttr.fuel_type)                return false
  if (isFieldActive(settings.transmission) && !settings.transmission.includes(vehicleAttr.transmission))     return false
  return true
}

// ─────────────────────────────────────────────────────────────
// TRIGGER HELPERS
// ─────────────────────────────────────────────────────────────

const checkTriggers = (parentItemId: number, value: any) => {
  if (!formData.value) return
  const parentItem = findItemById(parentItemId)
  if (!parentItem || parentItem.input_type !== 'radio' || !parentItem.settings?.options) return

  const selectedValues = Array.isArray(value) ? value : (value ? [value] : [])
  const childItems: FormItem[] = []

  formData.value.template.sections.forEach(section => {
    section.items.forEach(item => {
      if (item.settings?.parent_item_id?.length > 0) {
        const parentIds = item.settings.parent_item_id.map((id: any) => Number(id))
        if (parentIds.includes(parentItemId)) childItems.push(item)
      }
    })
  })

  childItems.forEach(item => { triggeredItems.value[item.id] = false })

  selectedValues.forEach(selectedValue => {
    const option = parentItem.settings.options.find((opt: any) => opt.value === selectedValue)
    if (option?.show_trigger && option.target_item_id?.length > 0) {
      option.target_item_id.map((id: any) => Number(id)).forEach((targetId: number) => {
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
// HAS ITEM VALUE HELPER
// ─────────────────────────────────────────────────────────────

const hasItemValue = (itemId: number): boolean => {
  const v = formValues.value[itemId]
  if (v === undefined || v === null || v === '') return false
  if (Array.isArray(v) && v.length === 0) return false
  if (typeof v === 'object' && !Array.isArray(v)) {
    if ('images' in v) return Array.isArray(v.images) ? v.images.length > 0 : !!v.images
    if (Object.keys(v).length === 0) return false
  }
  return true
}

// ─────────────────────────────────────────────────────────────
// SECTIONS WITH PROCESSED ITEMS
// ─────────────────────────────────────────────────────────────

const sectionsWithProcessedItems = computed(() => {
  if (!formData.value) return []
  const vehicleAttr = formData.value.inspection.atribute_vehicle
  const _formValues = formValues.value // track reaktivitas

  return formData.value.template.sections.map(section => ({
    ...section,
    items: section.items.map(item => {
      const settings        = item.settings || {}
      const hasFilter       = hasVehicleFilter(settings)
      const isTriggeredItem = settings?.is_triggered || false
      const isDamageItem    = section.is_damage_section === true

      const isVisibleByVehicle = hasFilter       ? isMatchVehicleAttr(settings, vehicleAttr) : true
      const isTriggered        = isTriggeredItem ? (triggeredItems.value[item.id] || false)  : true
      const isNativelyHidden   = !hasFilter && !isTriggeredItem && item.is_visible === false

      const itemHasValue   = hasItemValue(item.id)
      const isForceVisible = (isNativelyHidden || isDamageItem) && itemHasValue

      let finalVisibility: boolean
      if (isForceVisible)       finalVisibility = true
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
      }
    })
  }))
})

const sections = computed(() => sectionsWithProcessedItems.value)

// ─────────────────────────────────────────────────────────────
// DAMAGE ITEMS FOR MODAL
// ─────────────────────────────────────────────────────────────

const emptyDamageItems = computed(() =>
  sectionsWithProcessedItems.value
    .flatMap(s => s.items)
    .filter(item => item._isDamageItem === true && item._isForceVisible !== true)
    .sort((a, b) => a.sort_order - b.sort_order)
)

const toggleSectionHiddenItems = (sectionId: number) => {
  showHiddenSections.value = {
    ...showHiddenSections.value,
    [sectionId]: !showHiddenSections.value[sectionId]
  }
}

const vehicleInfo = computed(() => formData.value?.inspection)
const metadata    = computed(() => formData.value?.metadata || { damage_categories: [], transmissions: [] })

// ─────────────────────────────────────────────────────────────
// LAST SECTION & SUBMIT VISIBILITY
// Section terakhir = section dengan sort_order tertinggi
// ─────────────────────────────────────────────────────────────

const lastSectionId = computed((): number | null => {
  if (!formData.value?.template.sections.length) return null
  const sorted = [...formData.value.template.sections].sort((a, b) => b.sort_order - a.sort_order)
  return sorted[0].id
})

const isOnLastSection = computed(() => activeSection.value === lastSectionId.value)

const isFormComplete = computed(() => progress.value === 100)

// ─────────────────────────────────────────────────────────────
// NESTED VALIDITY HELPERS
// ─────────────────────────────────────────────────────────────

const hasOptionNestedRequired = (option: any): boolean =>
  (option.show_textarea === true && option.textarea_is_required === true) ||
  (option.show_image    === true && option.image_is_required    === true)

const isOptionNestedFilled = (option: any, inv: any): boolean => {
  if (option.show_textarea === true && option.textarea_is_required === true) {
    const tv = inv?.textarea
    if (!tv || (typeof tv === 'string' && tv.trim() === '')) return false
  }
  if (option.show_image === true && option.image_is_required === true) {
    const iv = inv?.image
    if (!iv || (Array.isArray(iv) && iv.length === 0)) return false
  }
  return true
}

const isNestedValidForItem = (item: any, value: any, nested: Record<string, any>): boolean => {
  if (!item.settings?.options) return true
  if (value === null || value === undefined || value === '') return true
  if (Array.isArray(value) && value.length === 0) return true

  const selectedValues   = Array.isArray(value) ? value : [value]
  const isCheckbox       = item.input_type === 'checkbox'
  const hasMultiSelected = selectedValues.some((optVal: string) => {
    const option = item.settings.options.find((o: any) => o.value === optVal)
    return option && option.multi === true
  })

  if (isCheckbox || hasMultiSelected) {
    const aggregatedOption  = item.settings.options.filter((o: any) => selectedValues.includes(o.value))
    const hasRequiredNested = aggregatedOption.some((o: any) => hasOptionNestedRequired(o))
    if (!hasRequiredNested) return true

    const inv = nested?.['aggregated']
    if (!isOptionNestedFilled({
      show_textarea:        aggregatedOption.some((o: any) => o.show_textarea),
      show_image:           aggregatedOption.some((o: any) => o.show_image),
      textarea_is_required: aggregatedOption.some((o: any) => o.textarea_is_required),
      image_is_required:    aggregatedOption.some((o: any) => o.image_is_required)
    }, inv)) return false
    return true
  }

  for (const optVal of selectedValues) {
    const option = item.settings.options.find((o: any) => o.value === optVal)
    if (!option) continue
    if (!hasOptionNestedRequired(option)) continue
    const inv = nested?.[optVal]
    if (!isOptionNestedFilled(option, inv)) return false
  }

  return true
}

const isImageHasValue = (value: any): boolean => {
  if (!value) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object' && value.images) {
    return Array.isArray(value.images) ? value.images.length > 0 : !!value.images
  }
  return true
}

const isImageOptionNestedValid = (item: any, imgNested: any): boolean => {
  if (!item.settings?.show_option) return true
  if (!item.settings?.options?.length) return true

  const optionIsRequired = item.settings?.option_is_required === true

  if (optionIsRequired) {
    const hasSelected = imgNested?.selectedOption != null &&
      (Array.isArray(imgNested.selectedOption)
        ? imgNested.selectedOption.length > 0
        : imgNested.selectedOption !== '')
    if (!hasSelected) return false
  }

  if (!imgNested?.selectedOption) return true

  const selectedValues = Array.isArray(imgNested.selectedOption)
    ? imgNested.selectedOption
    : [imgNested.selectedOption]

  const hasMultiSelected = selectedValues.some((optVal: string) => {
    const option = item.settings.options.find((o: any) => o.value === optVal)
    return option && option.multi === true
  })

  if (hasMultiSelected) {
    const aggregatedOption  = item.settings.options.filter((o: any) => selectedValues.includes(o.value))
    const hasRequiredNested = aggregatedOption.some((o: any) => hasOptionNestedRequired(o))
    if (!hasRequiredNested) return true

    const inv = imgNested?.nested?.['aggregated']
    if (!isOptionNestedFilled({
      show_textarea:        aggregatedOption.some((o: any) => o.show_textarea),
      show_image:           aggregatedOption.some((o: any) => o.show_image),
      textarea_is_required: aggregatedOption.some((o: any) => o.textarea_is_required),
      image_is_required:    aggregatedOption.some((o: any) => o.image_is_required)
    }, inv)) return false
    return true
  }

  for (const optVal of selectedValues) {
    const option = item.settings.options.find((o: any) => o.value === optVal)
    if (!option) continue
    if (!hasOptionNestedRequired(option)) continue
    const inv = imgNested?.nested?.[optVal]
    if (!isOptionNestedFilled(option, inv)) return false
  }

  return true
}

// ─────────────────────────────────────────────────────────────
// PROGRESS
// ─────────────────────────────────────────────────────────────

const progress = computed(() => {
  if (!formData.value) return 0
  const _nested = nestedValues.value

  const visibleItems    = sectionsWithProcessedItems.value.flatMap(s => s.items).filter(i => i._finalVisibility)
  const requiredVisible = visibleItems.filter(i => i.is_required)
  if (requiredVisible.length === 0) return 100

  let validCount = 0
  for (const item of requiredVisible) {
    const mainValid = itemValidationStatus.value[item.id] === true
    if (!mainValid) continue

    // ✅ CEK UPLOAD STATUS — jika ada gambar masih uploading/failed, anggap belum komplit
    const uploadSt = itemUploadStatus.value[item.id]
    if (uploadSt?.hasUploading || uploadSt?.hasFailed) continue

    if (['radio', 'select', 'checkbox'].includes(item.input_type)) {
      if (isNestedValidForItem(item, formValues.value[item.id], _nested[item.id] || {})) validCount++
    } else if (item.input_type === 'image' && item.settings?.show_option === true) {
      if (isImageOptionNestedValid(item, _nested[`img_${item.id}`])) validCount++
    } else {
      validCount++
    }
  }

  return Math.round((validCount / requiredVisible.length) * 100)
})

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
// VALIDATE ITEM
// ─────────────────────────────────────────────────────────────

const validateItem = (itemId: number, value: any): boolean => {
  if (!formData.value) return true
  const foundItem = findItemById(itemId)
  if (!foundItem) return true

  let errorMsg = ''
  let isValid  = true

  const isEmpty = (v: any): boolean => {
    if (v === undefined || v === null || v === '') return true
    if (Array.isArray(v) && v.length === 0) return true
    if (typeof v === 'object' && !Array.isArray(v) && foundItem.input_type === 'image') return !isImageHasValue(v)
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
        if (minLen && strVal.length < minLen)                                                         { errorMsg = `Minimal ${minLen} karakter`; isValid = false }
        else if (maxLen && strVal.length > maxLen)                                                    { errorMsg = `Maksimal ${maxLen} karakter`; isValid = false }
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
        if (minVal != null && !isNaN(minVal) && numValue < minVal)   { errorMsg = `Nilai minimal ${minVal}`; isValid = false }
        else if (maxVal != null && !isNaN(maxVal) && numValue > maxVal) { errorMsg = `Nilai maksimal ${maxVal}`; isValid = false }
        break
      }
      case 'checkbox': {
        const arrVal = Array.isArray(value) ? value : (value ? [value] : [])
        const minSel = foundItem.settings?.min_selected ? Number(foundItem.settings.min_selected) : null
        const maxSel = foundItem.settings?.max_selected ? Number(foundItem.settings.max_selected) : null
        if (minSel != null && arrVal.length < minSel)   { errorMsg = `Pilih minimal ${minSel} opsi`; isValid = false }
        else if (maxSel != null && arrVal.length > maxSel) { errorMsg = `Pilih maksimal ${maxSel} opsi`; isValid = false }
        break
      }
    }
  }

  if (isValid && ['radio', 'select', 'checkbox'].includes(foundItem.input_type) && !isEmpty(value)) {
    if (!isNestedValidForItem(foundItem, value, nestedValues.value[itemId] || {})) isValid = false
  }

  if (isValid && foundItem.input_type === 'image' && foundItem.settings?.show_option === true) {
    if (!isImageOptionNestedValid(foundItem, nestedValues.value[`img_${itemId}`])) isValid = false
  }

  if (errorMsg) { formErrors.value[itemId] = errorMsg } else { delete formErrors.value[itemId] }
  itemValidationStatus.value[itemId] = isValid
  return isValid
}

const validateNestedItem = (itemId: number, optionValue: string, field: string, value: any): boolean => {
  const foundItem = findItemById(itemId)
  if (!foundItem || !['radio', 'select', 'checkbox'].includes(foundItem.input_type)) return true
  if (!foundItem.settings?.options) return true

  const selectedOption = foundItem.settings.options.find((o: any) => o.value === optionValue)
  if (!selectedOption) return true

  let isRequired = false
  if (field === 'textarea') isRequired = selectedOption.show_textarea === true && selectedOption.textarea_is_required === true
  else if (field === 'image') isRequired = selectedOption.show_image === true && selectedOption.image_is_required === true
  if (!isRequired) return true

  const isNestedValid = !(!value || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0))
  const key = `${itemId}_${optionValue}_${field}`
  if (!isNestedValid) { nestedErrors.value[key] = `Field ${field} harus diisi` } else { delete nestedErrors.value[key] }
  return isNestedValid
}

// ─────────────────────────────────────────────────────────────
// STORAGE SAVE HELPER
// ─────────────────────────────────────────────────────────────

const saveItemToStorage = (itemId: number) => {
  const main        = formValues.value[itemId]
  const nested      = nestedValues.value[itemId]
  const imageNested = nestedValues.value[`img_${itemId}`]

  const hasNested      = nested      != null && Object.keys(nested).length > 0
  const hasImageNested = imageNested != null && (
    imageNested.selectedOption != null ||
    Object.keys(imageNested.nested || {}).length > 0
  )

  if (hasNested || hasImageNested) {
    storage.saveToStorage(itemId, {
      main,
      ...(hasNested      ? { nested }      : {}),
      ...(hasImageNested ? { imageNested }  : {}),
    })
  } else {
    storage.saveToStorage(itemId, main)
  }
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

        // Skip jika nilai null/undefined — item sudah dihapus
        if (storedItem.value === null || storedItem.value === undefined) return

        if (storedItem.value && typeof storedItem.value === 'object' && 'main' in storedItem.value) {
          // Skip jika main value null — item sudah dihapus via fallback overwrite
          if (storedItem.value.main === null || storedItem.value.main === undefined) return

          formValues.value[itemId]  = storedItem.value.main
          nestedValues.value[itemId] = storedItem.value.nested && typeof storedItem.value.nested === 'object'
            ? storedItem.value.nested : {}

          if (storedItem.value.imageNested && typeof storedItem.value.imageNested === 'object') {
            nestedValues.value[`img_${itemId}`] = storedItem.value.imageNested
          }

          const restoredNested = nestedValues.value[itemId] || {}
          Object.keys(restoredNested).forEach(optionValue => {
            if (restoredNested[optionValue]) {
              Object.keys(restoredNested[optionValue]).forEach(field => {
                validateNestedItem(itemId, optionValue, field, restoredNested[optionValue][field])
              })
            }
          })

          validateItem(itemId, storedItem.value.main)
        } else {
          formValues.value[itemId]   = storedItem.value
          nestedValues.value[itemId] = {}
          validateItem(itemId, storedItem.value)
        }
      })

      Object.keys(formValues.value).forEach(key => {
        checkTriggers(Number(key), formValues.value[Number(key)])
      })

      if (!activeSection.value && formData.value?.template.sections.length > 0) {
        activeSection.value = formData.value.template.sections[0].id
        storage.saveActiveSection(activeSection.value)
      }
      storage.clearExpired()
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

const handleValueUpdate = (itemId: number, value: any) => {
  formValues.value[itemId] = value
  saveItemToStorage(itemId)
  validateItem(itemId, value)
  checkTriggers(itemId, value)
}

const handleErrorUpdate = (itemId: number, errorMsg: string) => {
  if (errorMsg) {
    formErrors.value[itemId]           = errorMsg
    itemValidationStatus.value[itemId] = false
  } else {
    delete formErrors.value[itemId]
    const v       = formValues.value[itemId]
    const isEmpty = !v || (Array.isArray(v) && v.length === 0)
    itemValidationStatus.value[itemId] = !isEmpty ? true : !(findItemById(itemId)?.is_required)
  }
}

const handleNestedValueUpdate = (itemId: number, optionValue: string, field: string, value: any) => {
  if (!nestedValues.value[itemId]) nestedValues.value[itemId] = {}
  if (!nestedValues.value[itemId][optionValue]) nestedValues.value[itemId][optionValue] = {}
  nestedValues.value[itemId][optionValue][field] = value
  nestedValues.value = { ...nestedValues.value }
  saveItemToStorage(itemId)
  validateNestedItem(itemId, optionValue, field, value)
  validateItem(itemId, formValues.value[itemId])
}

const handleNestedErrorUpdate = (itemId: number, optionValue: string, field: string, errorMsg: string) => {
  const key = `${itemId}_${optionValue}_${field}`
  if (errorMsg) { nestedErrors.value[key] = errorMsg } else { delete nestedErrors.value[key] }
}

const handleImageNestedValueUpdate = (itemId: number, field: string, value: any) => {
  const imgKey = `img_${itemId}`

  if (!nestedValues.value[imgKey]) nestedValues.value[imgKey] = { selectedOption: null, nested: {} }

  if (field === 'selectedOption') {
    nestedValues.value[imgKey].selectedOption = value
  } else {
    const sepIdx = field.indexOf('__')
    if (sepIdx > -1) {
      const optionValue = field.substring(0, sepIdx)
      const nestedField = field.substring(sepIdx + 2)
      if (!nestedValues.value[imgKey].nested) nestedValues.value[imgKey].nested = {}
      if (!nestedValues.value[imgKey].nested[optionValue]) nestedValues.value[imgKey].nested[optionValue] = {}
      nestedValues.value[imgKey].nested[optionValue][nestedField] = value
    }
  }

  nestedValues.value = { ...nestedValues.value }
  saveItemToStorage(itemId)
  validateItem(itemId, formValues.value[itemId])
}

// ─────────────────────────────────────────────────────────────
// DELETE ITEM (hapus dari local storage)
// ─────────────────────────────────────────────────────────────

const handleDeleteItem = (itemId: number) => {
  // 1. Hapus dari semua reactive state
  const vals   = { ...formValues.value };           delete vals[itemId];                                    formValues.value           = vals
  const nests  = { ...nestedValues.value };         delete nests[itemId]; delete nests[`img_${itemId}`];   nestedValues.value         = nests
  const errs   = { ...formErrors.value };           delete errs[itemId];                                    formErrors.value           = errs
  const status = { ...itemValidationStatus.value }; delete status[itemId];                                  itemValidationStatus.value = status

  // 2. Hapus dari localStorage — scan semua key dan hapus yang terkait item ini
  //    Cara ini robust terlepas dari naming convention useFormStorage
  try {
    const id           = inspectionId.value
    const itemIdStr    = String(itemId)
    const keysToDelete: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      // Hapus jika key mengandung kombinasi inspectionId + itemId
      if (key.includes(itemIdStr) && key.includes(String(id))) {
        keysToDelete.push(key)
        continue
      }
      // Atau key diakhiri dengan _itemId (pola umum)
      if (key.endsWith(`_${itemIdStr}`) || key.endsWith(`:${itemIdStr}`)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      localStorage.removeItem(key)
      console.log('[Delete] removed localStorage key:', key)
    })
  } catch (e) {
    console.warn('localStorage scan error:', e)
  }

  // 3. Jika composable punya removeFromStorage, panggil juga
  if (typeof (storage as any).removeFromStorage === 'function') {
    try { (storage as any).removeFromStorage(itemId) } catch (e) {}
  }

  // 4. Overwrite dengan null sebagai fallback — loadForm akan skip nilai null
  try { storage.saveToStorage(itemId, null) } catch (e) {}
}


// ─────────────────────────────────────────────────────────────
// DAMAGE MODAL SAVE HANDLER
// Menerima nilai + nested dari modal, lalu simpan ke storage
// ─────────────────────────────────────────────────────────────

const handleDamageItemSave = (itemId: number, value: any, nested: any, imageNested: any) => {
  // Simpan main value
  formValues.value[itemId] = value

  // Merge nested values jika ada
  if (nested && Object.keys(nested).length > 0) {
    nestedValues.value[itemId] = nested
  }

  if (imageNested && (imageNested.selectedOption != null || Object.keys(imageNested.nested || {}).length > 0)) {
    nestedValues.value[`img_${itemId}`] = imageNested
  }

  nestedValues.value = { ...nestedValues.value }

  // Simpan ke storage
  saveItemToStorage(itemId)
  validateItem(itemId, value)
  checkTriggers(itemId, value)

  if (emptyDamageItems.value.length === 0) {
    showDamageModal.value = false
  }
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
        if (!validateItem(item.id, formValues.value[item.id])) isValid = false
      }
    })
  })
  return isValid
}

// ─────────────────────────────────────────────────────────────
// SAVE FORM (submit ke server)
// ─────────────────────────────────────────────────────────────
// ─── Sanitize value: strip image data, hanya simpan id ───────
const sanitizeValue = (value: any): any => {
  if (value === null || value === undefined) return value

  // Array of images langsung (input type image tanpa nested)
  if (Array.isArray(value)) {
    return value
      .filter(img => img?.id)           // skip yang tidak punya id (blob/pending/kosong)
      .map(img => ({ id: img.id }))     // hanya kirim id
  }

  // Object dengan main
  if (typeof value === 'object' && 'main' in value) {
    const main = value.main

    // main adalah array of images
    const sanitizedMain = Array.isArray(main) && main.length > 0 && main[0]?.image_url !== undefined
      ? main.filter(img => img?.id).map(img => ({ id: img.id }))
      : main

    // Sanitize nested (radio/checkbox nested image)
    const sanitizedNested = value.nested
      ? Object.fromEntries(
          Object.entries(value.nested).map(([optKey, optData]: [string, any]) => [
            optKey,
            {
              ...optData,
              image: optData.image
                ? optData.image.filter((img: any) => img?.id).map((img: any) => ({ id: img.id }))
                : optData.image
            }
          ])
        )
      : value.nested

    // Sanitize imageNested
    const sanitizedImageNested = value.imageNested
      ? {
          ...value.imageNested,
          nested: value.imageNested.nested
            ? Object.fromEntries(
                Object.entries(value.imageNested.nested).map(([optKey, optData]: [string, any]) => [
                  optKey,
                  {
                    ...optData,
                    image: optData.image
                      ? optData.image.filter((img: any) => img?.id).map((img: any) => ({ id: img.id }))
                      : optData.image
                  }
                ])
              )
            : value.imageNested.nested
        }
      : value.imageNested

    return {
      ...value,
      main:        sanitizedMain,
      ...(sanitizedNested     ? { nested: sanitizedNested }           : {}),
      ...(sanitizedImageNested ? { imageNested: sanitizedImageNested } : {}),
    }
  }

  return value
}

const saveForm = async () => {
  if (!validateForm()) {
    const firstErrorId = Object.keys(formErrors.value)[0]
    document.getElementById(`item-${firstErrorId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  saving.value = true
  try {
    const results = Object.keys(formValues.value).map(itemIdStr => {
      const itemId      = Number(itemIdStr)
      
      // ✅ Ambil inspection_item_id dari formData, bukan item.id
      const formItem    = findItemById(itemId)
      const inspectionItemId = formItem?.inspection_item_id
      if (!inspectionItemId) return null  // skip jika item tidak ditemukan
      
      const nested      = nestedValues.value[itemId]
      const imageNested = nestedValues.value[`img_${itemId}`]
      const hasNested      = nested      != null && Object.keys(nested).length > 0
      const hasImageNested = imageNested != null && (
        imageNested.selectedOption != null ||
        Object.keys(imageNested.nested || {}).length > 0
      )

      // return {
      //   inspection_item_id: inspectionItemId,  // ✅ 7, bukan 59
      //   value: (hasNested || hasImageNested)
      //     ? { main: formValues.value[itemId], ...(hasNested ? { nested } : {}), ...(hasImageNested ? { imageNested } : {}) }
      //     : formValues.value[itemId]
      // }

      //Menghapus data gambar dari value sebelum dikirim ke server, hanya kirim id gambar saja
      return {
        inspection_item_id: inspectionItemId,
        item_id: itemId,
        value: sanitizeValue(                    
          (hasNested || hasImageNested)
            ? { main: formValues.value[itemId], ...(hasNested ? { nested } : {}), ...(hasImageNested ? { imageNested } : {}) }
            : formValues.value[itemId]
        )
      }
    }).filter(Boolean)  // hapus null

    // inspection_id dikirim via URL param, tidak perlu di body
    await saveInspectionForm(inspectionId.value, { results })
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
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div class="px-4 py-3 flex items-center justify-between">
        <div class="flex items-center">
          <button @click="router.back()" class="p-2 hover:bg-gray-100 rounded-full mr-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-lg font-semibold">Form Inspeksi</h1>
        </div>
        <div class="flex items-center space-x-3">
          <div class="text-sm">
            <span class="font-medium text-blue-600">{{ progress }}%</span>
            <span class="text-gray-500"> selesai</span>
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
        <button @click="reloadRoute" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Coba Lagi</button>
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 8l1-2h4l1 2" />
            </svg>
          </div>
          <div>
            <h2 class="font-semibold text-gray-800">{{ vehicleInfo?.vehicle_name }}</h2>
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
        :nested-values="nestedValues"
        @select="selectSection"
        @toggle-hidden="toggleSectionHiddenItems"
        :upload-status="itemUploadStatus"
      />

      <!-- Section Content -->
      <div class="px-4 py-4">
        <div v-for="section in sections" :key="section.id" :id="`section-${section.id}`" class="scroll-mt-[120px]">
          <InspectionSection
            v-if="activeSection === section.id"
            :section="section"
            :inspectionId="vehicleInfo?.id"
            :values="formValues"
            :errors="formErrors"
            :metadata="metadata"
            :nested-values="nestedValues"
            :vehicle-attr="formData.inspection.atribute_vehicle"
            :show-hidden-items="showHiddenSections[section.id] || false"
            :triggered-items="triggeredItems"
            @update:value="handleValueUpdate"
            @update:error="handleErrorUpdate"
            @update:nested-value="handleNestedValueUpdate"
            @update:nested-error="handleNestedErrorUpdate"
            @update:image-nested-value="handleImageNestedValueUpdate"
            @delete:item="handleDeleteItem"
            @update:upload-status="handleUploadStatusUpdate"
          />
        </div>

        <!-- Submit Button: hanya muncul di section terakhir -->
        <Transition name="submit-btn">
          <div v-if="isOnLastSection" class="mt-4">
            <!-- Hint kalau belum 100% -->
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
              @click="saveForm"
              :disabled="saving || !isFormComplete"
              class="w-full py-4 px-4 rounded-2xl font-semibold text-base transition-all duration-300 flex items-center justify-center space-x-2"
              :class="isFormComplete
                ? 'bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white shadow-lg shadow-blue-200'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
            >
              <span v-if="saving" class="flex items-center justify-center space-x-2">
                <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Menyimpan...</span>
              </span>
              <span v-else-if="isFormComplete" class="flex items-center space-x-2">
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

    <!-- FAB: Tambah Item Kerusakan -->
    <Transition name="fab">
      <button
        v-if="formData && emptyDamageItems.length > 0"
        @click="showDamageModal = true"
        class="fixed right-4 bottom-6 z-30 w-14 h-14 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-full shadow-lg shadow-red-200 flex items-center justify-center transition-all duration-200"
        title="Tambah Item Kerusakan"
      >
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
        </svg>
        <span class="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 bg-white text-red-600 text-xs font-bold rounded-full flex items-center justify-center shadow border-2 border-red-500">
          {{ emptyDamageItems.length }}
        </span>
      </button>
    </Transition>
  </div>

  <!-- Damage Item Modal -->
  <DamageItemModal
    :show="showDamageModal"
    :damage-items="emptyDamageItems"
    :values="formValues"
    :metadata="metadata"
    :nested-values="nestedValues"
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

/* FAB transition — bouncy scale */
.fab-enter-active,
.fab-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.fab-enter-from,
.fab-leave-to { opacity: 0; transform: scale(0.4) translateY(16px); }

/* Submit button slide-up */
.submit-btn-enter-active,
.submit-btn-leave-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.submit-btn-enter-from,
.submit-btn-leave-to { opacity: 0; transform: translateY(24px); }

/* Fade for hint message */
.fade-enter-active,
.fade-leave-active { transition: all 0.25s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>