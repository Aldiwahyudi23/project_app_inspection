<template>
  <div class="flex flex-col min-h-screen bg-gray-100">
    <!-- Main content -->
    <main class="flex-1 px-4 py-6 space-y-5 ">
      <!-- Profile Card -->
      <div class="bg-gradient-to-br from-blue-600 to-sky-600 rounded-3xl p-6 shadow-xl text-white">
        <div class="flex items-center space-x-4">
          <div
            class="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border-2 border-white/50"
          >
            <span class="text-4xl">👨‍🔧</span>
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold">{{ authStore.user?.name }}</h2>
            <p class="text-sky-100 text-sm">{{ authStore.user?.email }} • ID: INS-001</p>
            <div class="flex items-center space-x-2 mt-2">
              <span class="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs">⭐ 4.9 (128)</span>
              <span class="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs">🎂 3 tahun</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Card -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
          <span class="text-2xl block mb-2">📋</span>
          <p class="text-sm text-gray-600">Total Inspeksi</p>
          <p class="text-2xl font-bold text-blue-600">1,234</p>
          <p class="text-xs text-green-600 mt-1">↑ 12% bulan ini</p>
        </div>
        <div class="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
          <span class="text-2xl block mb-2">⭐</span>
          <p class="text-sm text-gray-600">Rating</p>
          <p class="text-2xl font-bold text-blue-600">4.9</p>
          <p class="text-xs text-gray-500 mt-1">dari 128 ulasan</p>
        </div>
      </div>

      <!-- Menu Items -->
      <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg divide-y divide-gray-100">
        <div
          v-for="item in menuItems"
          :key="item.title"
          class="flex items-center justify-between p-4 hover:bg-gray-50 transition cursor-pointer"
        >
          <div class="flex items-center space-x-3">
            <span class="text-2xl">{{ item.icon }}</span>
            <div>
              <p class="font-medium text-gray-800">{{ item.title }}</p>
              <p v-if="item.subtitle" class="text-xs text-gray-500">{{ item.subtitle }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span
              v-if="item.badge"
              class="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full"
            >
              {{ item.badge }}
            </span>
            <span class="text-gray-400">→</span>
          </div>
        </div>
      </div>
    </main>

    <!-- Logout Button -->
    <div class="px-4 py-4 bg-gray-100 pb-20">
      <button
        @click="handleLogout"
        class="w-full py-4 bg-red-600 text-white rounded-2xl font-medium hover:bg-red-700 transition shadow-lg"
      >
        <span class="flex items-center justify-center space-x-2">
          <span>🚪</span>
          <span>Keluar</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth(local)'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const menuItems = [
  { icon: '👤', title: 'Data Diri', subtitle: 'Lengkapi profil Anda' },
  { icon: '🔔', title: 'Notifikasi', subtitle: '3 pemberitahuan baru', badge: '3' },
  { icon: '⚙️', title: 'Pengaturan', subtitle: 'Preferensi aplikasi' },
  { icon: '📊', title: 'Laporan Kinerja', subtitle: 'Lihat statistik Anda' },
  { icon: '❓', title: 'Pusat Bantuan', subtitle: 'FAQ & panduan' },
  { icon: '📝', title: 'Syarat & Ketentuan', subtitle: 'Kebijakan privasi' }
]

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>
