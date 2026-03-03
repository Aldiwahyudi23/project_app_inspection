<template>
  <div class="flex flex-col min-h-screen bg-gray-100">
    <!-- Main content -->
    <main class="flex-1 px-4 py-6 space-y-5 pb-28"> <!-- pb-28 untuk BottomNav -->
      
      <!-- Selamat datang -->
      <div class="bg-blue-600 text-white p-5 rounded-2xl shadow">
        <h1 class="text-xl font-bold">Halo, Inspektor! 👋</h1>
        <p class="text-blue-100 text-sm mt-1">Siap kerja hari ini?</p>
      </div>

      <!-- Statistik simple -->
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-white p-4 rounded-xl shadow text-center">
          <span class="text-2xl">📋</span>
          <p class="text-xs text-gray-500 mt-1">Antrian</p>
          <p class="text-lg font-bold text-blue-600">12</p>
        </div>
        <div class="bg-white p-4 rounded-xl shadow text-center">
          <span class="text-2xl">✅</span>
          <p class="text-xs text-gray-500 mt-1">Selesai</p>
          <p class="text-lg font-bold text-green-600">48</p>
        </div>
        <div class="bg-white p-4 rounded-xl shadow text-center">
          <span class="text-2xl">⏳</span>
          <p class="text-xs text-gray-500 mt-1">Pending</p>
          <p class="text-lg font-bold text-yellow-600">3</p>
        </div>
      </div>

      <!-- Menu Cepat -->
      <div class="grid grid-cols-3 gap-3">
        <div 
          v-for="menu in quickMenus" 
          :key="menu.title" 
          class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:shadow-xl transition"
        >
          <span class="text-2xl mb-2">{{ menu.icon }}</span>
          <p class="text-sm font-medium text-gray-800">{{ menu.title }}</p>
        </div>
      </div>

      <!-- Daftar tugas hari ini -->
      <div class="bg-white rounded-xl shadow p-4">
        <div class="flex justify-between items-center mb-3">
          <h2 class="font-semibold text-gray-800">Tugas Hari Ini</h2>
          <span class="text-xs text-blue-600">Lihat semua →</span>
        </div>
        
        <div class="space-y-3">
          <div v-for="task in todayTasks" :key="task.id" class="flex items-center gap-3 p-2 border-b border-gray-100 last:border-0">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span class="text-xl">🚗</span>
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-800">{{ task.vehicle }}</p>
              <p class="text-xs text-gray-500">{{ task.plateNumber }} • {{ task.time }}</p>
            </div>
            <span class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">{{ task.status }}</span>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const quickMenus = [
  { icon: '🚗', title: 'Kendaraan' },
  { icon: '📊', title: 'Laporan' },
  { icon: '📅', title: 'Tugas' }
]

const todayTasks = ref([
  {
    id: 1,
    vehicle: 'Toyota Avanza',
    plateNumber: 'B 1234 XYZ',
    time: '09:00',
    status: 'Antri'
  },
  {
    id: 2,
    vehicle: 'Honda Jazz',
    plateNumber: 'B 5678 ABC',
    time: '11:30',
    status: 'Antri'
  },
  {
    id: 3,
    vehicle: 'Suzuki Ertiga',
    plateNumber: 'B 9012 DEF',
    time: '14:00',
    status: 'Antri'
  }
])
</script>
