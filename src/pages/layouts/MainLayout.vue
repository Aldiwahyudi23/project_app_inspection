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
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BottomNav from '../../components/BottomNav.vue'

const route = useRoute()
const router = useRouter()
const title = ref('Home')

watch(route, () => {
  // Ganti judul header sesuai route
  title.value = route.meta.title || 'Dashboard'
})
</script>

<style scoped>
/* Contoh style bottom nav bisa ditambah */
</style>
