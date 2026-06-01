// services/api.ts
import axios from 'axios'
import { Storage } from './storage' // ← import helper
import { getDeviceId } from './device'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  // baseURL: 'https://management.cekmobil.online/api',
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

    const token = await Storage.get('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // ============================================================
    // DEVICE ID
    // ============================================================

    const deviceId = await getDeviceId()

    if (deviceId) {
      config.headers['X-Device-Id'] = deviceId
    }

    return config
  },
  (error) => Promise.reject(error)
)

// ✅ Response interceptor - pakai Storage universal (async)
api.interceptors.response.use(
  (response) => response,
  async (error) => {

    return Promise.reject(error)
  }
)

export default api