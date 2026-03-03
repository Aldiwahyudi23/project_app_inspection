// stores/auth.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'
import type { User, LoginCredentials } from '../types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Login
  async function login(credentials: LoginCredentials) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('/login', credentials)

      token.value = response.data.data.token
      user.value = response.data.data.user

      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))

      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Logout
  async function logout() {
    try {
      await api.post('/logout')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
  }

  // Check auth → optimized
  async function checkAuth() {
    // 1️⃣ User sudah ada di store → langsung return
    if (user.value && token.value) return true

    // 2️⃣ Cek localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser && token.value) {
      user.value = JSON.parse(storedUser)
      return true
    }

    // 3️⃣ Jika token ada tapi user belum pasti → panggil API
    if (token.value) {
      try {
        const response = await api.get('/user')
        user.value = response.data.data.user
        localStorage.setItem('user', JSON.stringify(user.value))
        return true
      } catch {
        user.value = null
        token.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        return false
      }
    }

    // 4️⃣ Tidak ada token → dianggap logout
    return false
  }

  // Multi-tab logout support
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === 'token' && event.newValue === null) {
        // Token dihapus di tab lain → logout di tab ini juga
        user.value = null
        token.value = null
        localStorage.removeItem('user')
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
    checkAuth
  }
})
