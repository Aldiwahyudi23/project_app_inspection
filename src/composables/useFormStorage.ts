// composables/useFormStorage.ts
import { ref, watch } from 'vue'
import type { FormValues } from '../types/formInspection'

// Prefix untuk key di localStorage
const STORAGE_KEY_PREFIX = 'inspection_form_'
const ACTIVE_SECTION_KEY_PREFIX = 'inspection_active_section_'

/**
 * Composable untuk mengelola penyimpanan form ke localStorage
 * @param inspectionId - ID inspeksi yang sedang dikerjakan
 */
export function useFormStorage(inspectionId: number) {
  // Key unik untuk setiap inspeksi
  const storageKey = `${STORAGE_KEY_PREFIX}${inspectionId}`
  const activeSectionKey = `${ACTIVE_SECTION_KEY_PREFIX}${inspectionId}`
  
  /**
   * Memuat nilai yang tersimpan dari localStorage
   * @returns Object berisi nilai-nilai yang tersimpan
   */
  const loadStoredValues = (): FormValues => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        console.log('Loaded from localStorage:', parsed)
        return parsed
      }
      return {}
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      return {}
    }
  }
  
  /**
   * Memuat active section dari localStorage
   * @returns ID section atau null jika tidak ada
   */
  const loadActiveSection = (): number | null => {
    try {
      const stored = localStorage.getItem(activeSectionKey)
      if (stored) {
        return Number(stored)
      }
      return null
    } catch (error) {
      console.error('Error loading active section:', error)
      return null
    }
  }
  
  // Ref yang berisi semua nilai form yang tersimpan
  const formValues = ref<FormValues>(loadStoredValues())
  
  // Ref untuk active section
  const activeSection = ref<number | null>(loadActiveSection())
  
  /**
   * Menyimpan nilai item ke localStorage
   * @param itemId - ID item form
   * @param value - Nilai yang akan disimpan (bisa berupa data biasa atau object dengan nested)
   */
  const saveToStorage = (itemId: number, value: any) => {
    // Update nilai di ref
    formValues.value[itemId] = {
      value,
      updated_at: Date.now()
    }
    
    // Simpan ke localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(formValues.value))
      console.log('Saved to localStorage:', { itemId, value })
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }
  
  /**
   * Menyimpan active section ke localStorage
   * @param sectionId - ID section yang aktif atau null
   */
  const saveActiveSection = (sectionId: number | null) => {
    activeSection.value = sectionId
    
    if (sectionId === null) {
      localStorage.removeItem(activeSectionKey)
    } else {
      localStorage.setItem(activeSectionKey, String(sectionId))
    }
    console.log('Saved active section:', sectionId)
  }
  
  /**
   * Mendapatkan nilai untuk item tertentu
   * @param itemId - ID item form
   * @returns Nilai item atau undefined jika tidak ada
   */
  const getItemValue = (itemId: number) => {
    return formValues.value[itemId]?.value
  }
  
  /**
   * Menghapus semua data dari localStorage
   */
  const clearStorage = () => {
    formValues.value = {}
    activeSection.value = null
    localStorage.removeItem(storageKey)
    localStorage.removeItem(activeSectionKey)
    console.log('Cleared localStorage')
  }
  
  /**
   * Menghapus data yang sudah expired (lebih dari 24 jam)
   */
  const clearExpired = () => {
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000 // 24 jam dalam milidetik
    let hasChanges = false
    
    // Hapus item yang sudah expired
    Object.keys(formValues.value).forEach(key => {
      const item = formValues.value[key]
      if (item && now - item.updated_at > oneDay) {
        delete formValues.value[key]
        hasChanges = true
      }
    })
    
    // Simpan perubahan jika ada yang dihapus
    if (hasChanges) {
      localStorage.setItem(storageKey, JSON.stringify(formValues.value))
      console.log('Cleared expired data')
    }
  }
  
  // Watch untuk debugging (opsional, bisa dihapus di production)
  watch(formValues, (newValues) => {
    console.log('Form values changed:', newValues)
  }, { deep: true })
  
  return {
    formValues,
    activeSection,
    saveToStorage,
    saveActiveSection,
    getItemValue,
    clearStorage,
    clearExpired
  }
}