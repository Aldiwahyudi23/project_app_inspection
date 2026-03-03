// composables/useCameraSettings.ts
import { ref, watch, onMounted } from 'vue'
import type { CameraSettings, CameraSource } from '../types/formInspection'

const STORAGE_KEY = 'inspection_camera_settings'

// Default settings
const defaultSettings: CameraSettings = {
  source: 'ask', // default: selalu tanya
  saveToGallery: false,
  maxSize: 10 // 10 MB default
}

// Buat singleton ref di luar function agar shared ke semua komponen
const globalSettings = ref<CameraSettings>({ ...defaultSettings })

// Load settings dari localStorage (hanya sekali)
const loadSettings = (): CameraSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('Error loading camera settings:', error)
  }
  return defaultSettings
}

// Inisialisasi global settings
globalSettings.value = loadSettings()

export function useCameraSettings() {
  // Gunakan ref yang sama untuk semua komponen
  const settings = globalSettings

  // Simpan settings ke localStorage dan update global
  const saveSettings = (newSettings: Partial<CameraSettings>) => {
    const updated = { ...settings.value, ...newSettings }
    settings.value = updated
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    
    // Trigger event kustom untuk memberi tahu komponen lain
    window.dispatchEvent(new CustomEvent('camera-settings-changed', { 
      detail: updated 
    }))
  }

  // Update source saja
  const setCameraSource = (source: CameraSource) => {
    saveSettings({ source })
  }

  // Reset ke default
  const resetToDefault = () => {
    settings.value = { ...defaultSettings }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings))
    
    // Trigger event
    window.dispatchEvent(new CustomEvent('camera-settings-changed', { 
      detail: defaultSettings 
    }))
  }

  // Listen untuk perubahan dari komponen lain
  const listenForChanges = (callback: (settings: CameraSettings) => void) => {
    const handler = (event: CustomEvent) => {
      callback(event.detail)
    }
    
    window.addEventListener('camera-settings-changed', handler as EventListener)
    
    // Return cleanup function
    return () => {
      window.removeEventListener('camera-settings-changed', handler as EventListener)
    }
  }

  return {
    settings,      // Ref yang reaktif dan shared
    saveSettings,
    setCameraSource,
    resetToDefault,
    listenForChanges
  }
}