// src/App.vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useModalStore } from './stores/useModalStore'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

const router = useRouter()
const modal = useModalStore()

const isNative = Capacitor.isNativePlatform()

let lastBack = 0
let backHandler: any = null

onMounted(() => {
  if (!isNative) return

  backHandler = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    const now = Date.now()

    // ✅ PRIORITAS 1: modal
    if (modal.hasModal) {
      modal.close()
      return
    }

    // ✅ PRIORITAS 2: halaman
    if (canGoBack) {
      router.back()
      return
    }

    // ✅ PRIORITAS 3: exit app (double tap)
    if (now - lastBack < 2000) {
      CapacitorApp.exitApp()
    } else {
      lastBack = now
      alert('Tekan sekali lagi untuk keluar')
    }
  })
})

onUnmounted(() => {
  if (backHandler) backHandler.remove()
})
</script>

<template>
  <router-view />
</template>