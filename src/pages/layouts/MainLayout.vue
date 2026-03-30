<template>
  <div class="flex flex-col h-screen">

    <!-- Optional header -->
    <header class="bg-blue-500 text-white p-4">
      <h1 class="text-lg font-bold">{{ title }}</h1>
    </header>

    <!-- Main content -->
    <main class="flex-1 overflow-auto">
      <router-view />
    </main>

    <!-- Bottom Navigation -->
    <BottomNav />

    <!-- INSTALL PWA MODAL -->
    <div
      v-if="showInstall"
      class="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
    >
      <div class="bg-white w-full p-5 rounded-t-2xl shadow-lg">

        <h2 class="text-lg font-semibold mb-2">
          Install Aplikasi
        </h2>

        <p class="text-sm text-gray-600 mb-4">
          Install aplikasi agar lebih cepat digunakan seperti aplikasi Android.
        </p>

        <button
          @click="installApp"
          class="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold"
        >
          Install Sekarang
        </button>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from '../../components/BottomNav.vue'

const route = useRoute()
const title = ref('Home')

watch(route, () => {
  title.value = (route.meta.title as string) || 'Dashboard'
})

/* =========================
   PWA INSTALL LOGIC
========================= */

const deferredPrompt = ref<any>(null)
const showInstall = ref(false)

onMounted(() => {

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches

  if (isStandalone) return

  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault()

    deferredPrompt.value = e
    showInstall.value = true
  })

})

const installApp = async () => {

  if (!deferredPrompt.value) return

  deferredPrompt.value.prompt()

  const result = await deferredPrompt.value.userChoice

  if (result.outcome === 'accepted') {
    showInstall.value = false
  }

}
</script>

<style scoped>
</style>