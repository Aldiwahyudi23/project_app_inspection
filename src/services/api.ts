// services/api.ts
import axios from 'axios'
import { Storage } from './storage' // ← import helper

const api = axios.create({
  // baseURL: 'http://127.0.0.1:8000/api',
  baseURL: 'https://management.cekmobil.online/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true,
  withXSRFToken: true
})

// ✅ Request interceptor - pakai Storage universal (async)
api.interceptors.request.use(
  async (config) => {
    const token = await Storage.get('token') // ← ganti dari localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ✅ Response interceptor - pakai Storage universal (async)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await Storage.remove('token') // ← ganti dari localStorage
      await Storage.remove('user')  // ← ganti dari localStorage
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api