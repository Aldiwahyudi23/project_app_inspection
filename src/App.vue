<script setup lang="ts">
import {

  ref,
  onMounted,
  onUnmounted

} from 'vue'

import { useRouter } from 'vue-router'

import { useModalStore }
from './stores/useModalStore'

import {
  App as CapacitorApp
} from '@capacitor/app'

import {
  Capacitor
} from '@capacitor/core'

import {
  checkAppUpdate
} from './services/device'

import AppUpdateModal
from './components/AppUpdateModal.vue'

const router = useRouter()

const modal = useModalStore()

const isNative =
  Capacitor.isNativePlatform()

let lastBack = 0

let backHandler: any = null

/**
 * UPDATE STATE
 */
const updateAvailable =
  ref(false)

const updateData =
  ref<any>(null)

/**
 * CHECK UPDATE
 */
async function handleAppUpdate() {

  try {

    if (
      Capacitor.getPlatform()
      !== 'android'
    ) {
      return
    }

    const result =
      await checkAppUpdate()

    if (
      !result.success ||
      !result.updateAvailable
    ) {
      return
    }

    updateAvailable.value = true

    updateData.value = result

  } catch (error) {

    console.log(
      'Handle Update Error:',
      error
    )

  }

}

/**
 * CLOSE UPDATE
 */
function closeUpdate() {

  updateAvailable.value = false

}

/**
 * MOUNTED
 */
onMounted(() => {

  /**
   * ONLY ANDROID
   */
  if (
    !isNative ||
    Capacitor.getPlatform()
    !== 'android'
  ) {
    return
  }

  /**
   * CHECK UPDATE
   * background tanpa loading
   */
  setTimeout(() => {

    handleAppUpdate()

  }, 1500)

  /**
   * BACK BUTTON
   */
  backHandler =
    CapacitorApp.addListener(
      'backButton',
      ({ canGoBack }) => {

        const now = Date.now()

        // popup update active
        if (
          updateAvailable.value
        ) {
          return
        }

        // modal active
        if (modal.hasModal) {

          modal.close()
          return

        }

        // back page
        if (canGoBack) {

          router.back()
          return

        }

        // exit app
        if (
          now - lastBack < 2000
        ) {

          CapacitorApp.exitApp()

        } else {

          lastBack = now

          alert(
            'Tekan sekali lagi untuk keluar'
          )

        }

      }
    )

})

/**
 * UNMOUNTED
 */
onUnmounted(() => {

  if (backHandler) {

    backHandler.remove()

  }

})
</script>

<template>

  <!-- UPDATE MODAL -->
  <AppUpdateModal

    :visible="updateAvailable"

    :data="updateData"

    @close="closeUpdate"

  />

  <!-- APP -->
  <router-view />

</template>