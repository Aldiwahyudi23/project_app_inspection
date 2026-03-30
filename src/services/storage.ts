import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

export const Storage = {
  async get(key: string): Promise<string | null> {
    if (isNative) {
      const { Preferences } = await import('@capacitor/preferences')
      const { value } = await Preferences.get({ key })
      return value
    } else {
      return localStorage.getItem(key)
    }
  },

  async set(key: string, value: string): Promise<void> {
    if (isNative) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({ key, value })
    } else {
      localStorage.setItem(key, value)
    }
  },

  async remove(key: string): Promise<void> {
    if (isNative) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.remove({ key })
    } else {
      localStorage.removeItem(key)
    }
  }
}