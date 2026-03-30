// stores/auth(local).ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'
import { Storage } from '../services/storage'
import type { User, LoginCredentials } from '../types'

export const useAuthStore = defineStore('auth', () => {

  // ============================================================
  // STATE
  // ============================================================
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ============================================================
  // INIT — dipanggil sekali saat app pertama buka di main.ts
  // ============================================================
  async function initStore() {
    try {
      token.value = await Storage.get('token')
      const savedUser = await Storage.get('user')
      user.value = savedUser ? JSON.parse(savedUser) : null
    } catch (err) {
      console.error('initStore error:', err)
    }
  }

  // ============================================================
  // LOGIN
  // ============================================================
  async function login(credentials: LoginCredentials) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('/login', credentials)

      // Ambil token & user dari response
      token.value = response.data.data.token
      user.value = response.data.data.user

      // Simpan ke storage (localStorage di web, Preferences di Android)
      if (token.value) {
        await Storage.set('token', token.value)
      }
      if (user.value) {
        await Storage.set('user', JSON.stringify(user.value))
      }

      return response.data

    } catch (err: any) {
      // Tangkap semua jenis error
      if (err.response) {
        // Error dari server (401, 422, 500, dll)
        error.value = err.response.data?.message || 'Login gagal'
      } else if (err.request) {
        // Request terkirim tapi tidak ada response (network error)
        error.value = 'Tidak dapat terhubung ke server. Periksa koneksi internet.'
      } else {
        // Error lainnya
        error.value = 'Terjadi kesalahan. Silakan coba lagi.'
      }
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================
  async function logout() {
    try {
      await api.post('/logout')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      token.value = null
      await Storage.remove('token')
      await Storage.remove('user')
      window.location.href = '/login'
    }
  }

  // ============================================================
  // CHECK AUTH — untuk route guard
  // ============================================================
  async function checkAuth() {
    // Sudah ada di memory → langsung return
    if (user.value && token.value) return true

    // Coba ambil dari storage
    const savedToken = await Storage.get('token')
    const savedUser = await Storage.get('user')

    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
      return true
    }

    // Token ada tapi user tidak ada → panggil API
    if (savedToken) {
      try {
        token.value = savedToken
        const response = await api.get('/user')
        user.value = response.data.data.user
        await Storage.set('user', JSON.stringify(user.value))
        return true
      } catch {
        // Token tidak valid → bersihkan semua
        user.value = null
        token.value = null
        await Storage.remove('token')
        await Storage.remove('user')
        return false
      }
    }

    return false
  }

  // ============================================================
  // MULTI-TAB LOGOUT (web only)
  // ============================================================
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === 'token' && event.newValue === null) {
        user.value = null
        token.value = null
        window.location.href = '/login'
      }
    })
  }

  return {
    user,
    token,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    initStore
  }
})