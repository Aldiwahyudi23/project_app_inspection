<template>
  <div class="min-h-screen bg-gray-100">
    <main class="pb-20 px-3 pt-3 space-y-3">

      <!-- ═══ LOADING SKELETON ═══ -->
      <template v-if="loading">

        <!-- Skeleton Header -->
        <div class="rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4 shadow-lg">
          <div class="sk sk-text-sm w-28 mb-2 opacity-40"></div>
          <div class="sk sk-text-lg w-40 mb-1 opacity-40"></div>
          <div class="sk sk-text-sm w-32 opacity-40"></div>
          <div class="grid grid-cols-2 gap-2 mt-3">
            <div class="bg-white/15 rounded-lg p-2.5">
              <div class="sk sk-text-sm w-24 mb-2 opacity-40"></div>
              <div class="sk sk-text-xl w-16 mb-1 opacity-40"></div>
              <div class="sk sk-text-sm w-20 opacity-40"></div>
            </div>
            <div class="bg-white/15 rounded-lg p-2.5">
              <div class="sk sk-text-sm w-24 mb-2 opacity-40"></div>
              <div class="sk sk-text-xl w-24 mb-1 opacity-40"></div>
              <div class="sk sk-text-sm w-20 opacity-40"></div>
            </div>
          </div>
        </div>

        <!-- Skeleton Saldo -->
        <div class="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100">
          <div class="flex items-start justify-between">
            <div>
              <div class="sk sk-text-sm w-20 mb-2"></div>
              <div class="sk sk-text-xl w-36 mb-2"></div>
              <div class="sk sk-badge w-32"></div>
            </div>
            <div class="sk sk-icon"></div>
          </div>
        </div>

        <!-- Skeleton Tagihan -->
        <div class="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100">
          <div class="flex items-start justify-between">
            <div>
              <div class="sk sk-text-sm w-20 mb-2"></div>
              <div class="sk sk-text-xl w-36 mb-2"></div>
              <div class="sk sk-badge w-40"></div>
            </div>
            <div class="sk sk-icon"></div>
          </div>
        </div>

        <!-- Skeleton Menu -->
        <div class="grid grid-cols-2 gap-2.5">
          <div v-for="i in 2" :key="i" class="bg-white rounded-xl p-3.5 shadow-sm">
            <div class="sk sk-icon-lg mb-2.5"></div>
            <div class="sk sk-text-base w-20 mb-1"></div>
            <div class="sk sk-text-sm w-28"></div>
          </div>
        </div>

        <!-- Skeleton Aktivitas -->
        <div class="bg-white rounded-xl shadow-sm p-4">
          <div class="sk sk-text-base w-36 mb-1"></div>
          <div class="sk sk-text-sm w-48 mb-3"></div>
          <div class="space-y-2">
            <div v-for="i in 3" :key="i" class="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50">
              <div class="sk sk-icon"></div>
              <div class="flex-1">
                <div class="sk sk-text-sm w-32 mb-1"></div>
                <div class="sk sk-text-sm w-40"></div>
              </div>
              <div class="sk sk-badge w-14"></div>
            </div>
          </div>
        </div>

      </template>

      <!-- ═══ CONTENT ═══ -->
      <template v-else>

        <!-- Header -->
        <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4 shadow-lg">
          <div class="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div class="absolute bottom-0 right-0 w-20 h-20 bg-white/10 rounded-full"></div>

          <div class="relative z-10">
            <p class="text-blue-100 text-xs">Selamat datang 👋</p>
            <div class="mt-0.5">
              <h1 class="text-lg font-bold text-white">Halo, Inspektor</h1>
              <p class="text-blue-100 text-xs mt-0.5">Semoga pekerjaan hari ini lancar 🚗</p>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-3">
              <div class="bg-white/15 backdrop-blur-md rounded-lg p-2.5 border border-white/10">
                <p class="text-blue-100 text-xs">Total Inspeksi</p>
                <h2 class="text-lg font-bold text-white mt-0.5">
                  {{ summary?.total_inspection ?? 0 }}
                </h2>
                <p class="text-xs text-blue-100 mt-0.5">Bulan ini</p>
              </div>

              <div class="bg-white/15 backdrop-blur-md rounded-lg p-2.5 border border-white/10">
                <p class="text-blue-100 text-xs">Pendapatan</p>
                <h2 class="text-lg font-bold text-white mt-0.5">
                  {{ summary?.monthly_income.formatted ?? 'Rp0' }}
                </h2>
                <p class="text-xs text-blue-100 mt-0.5">Bulan ini</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Saldo Platform -->
        <div
          class="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 active:scale-95 transition-all duration-200 cursor-pointer"
          @click="router.push({ name: 'Finance', query: { tab: 'withdraw' } })"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-gray-500">Saldo Platform</p>
              <h2
                class="text-xl font-bold mt-0.5"
                :class="balanceAmount >= 0 ? 'text-gray-800' : 'text-red-500'"
              >
                {{ summary?.total_balance.formatted ?? 'Rp0' }}
              </h2>
              <div class="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full"
                :class="balanceAmount >= 0 ? 'bg-green-100' : 'bg-red-100'"
              >
                <span class="w-1.5 h-1.5 rounded-full"
                  :class="balanceAmount >= 0 ? 'bg-green-500' : 'bg-red-500'"
                ></span>
                <p class="text-xs font-medium"
                  :class="balanceAmount >= 0 ? 'text-green-700' : 'text-red-700'"
                >
                  {{ balanceAmount >= 0 ? 'Saldo tersedia' : 'Ada tagihan ke platform' }}
                </p>
              </div>
            </div>
            <div class="w-11 h-11 rounded-lg bg-green-100 flex items-center justify-center text-lg">
              💰
            </div>
          </div>
        </div>

        <!-- Tagihan -->
        <div
          class="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 active:scale-95 transition-all duration-200 cursor-pointer"
          @click="router.push({ name: 'Finance', query: { tab: 'deposit' } })"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-gray-500">Total Tagihan</p>
              <h2 class="text-xl font-bold text-gray-800 mt-0.5">
                {{ summary?.total_bill.formatted ?? 'Rp0' }}
              </h2>
              <div class="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-orange-100">
                <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                <p class="text-xs font-medium text-orange-700">Tap untuk setor</p>
              </div>
            </div>
            <div class="w-11 h-11 rounded-lg bg-orange-100 flex items-center justify-center text-lg">
              💳
            </div>
          </div>
        </div>

        <!-- Menu -->
        <div class="grid grid-cols-2 gap-2.5">
          <div
            v-for="menu in quickMenus"
            :key="menu.title"
            @click="router.push({ name: menu.route })"
            class="group relative overflow-hidden bg-white rounded-xl p-3.5 shadow-sm active:scale-95 transition-all duration-200"
          >
            <div class="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-full -mr-5 -mt-5"></div>
            <div class="relative z-10">
              <div class="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg shadow-md">
                {{ menu.icon }}
              </div>
              <div class="mt-2.5">
                <p class="font-semibold text-gray-800 text-sm">{{ menu.title }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ menu.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Aktivitas Terbaru -->
        <div class="bg-white rounded-xl shadow-sm p-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h2 class="font-bold text-gray-800 text-base">Aktivitas Terbaru</h2>
              <p class="text-xs text-gray-500">Daftar kendaraan inspeksi</p>
            </div>
            <button
              class="text-xs text-blue-600 font-medium"
              @click="router.push({ name: 'job' })"
            >
              Lihat Semua
            </button>
          </div>

          <div v-if="recentInspections.length" class="space-y-2">
            <div
              v-for="item in recentInspections"
              :key="item.id"
              class="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 active:scale-95 transition-all duration-150 cursor-pointer"
              @click="router.push(`/jobs/${item.id}`)"
            >
              <div
                class="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100"
              >
                <img
                  v-if="item.display_image"
                  :src="item.display_image"
                  :alt="item.vehicle_name"
                  class="w-full h-full object-cover"
                >

                <div
                  v-else
                  class="w-full h-full bg-blue-100 flex items-center justify-center text-base"
                >
                  🚗
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 text-sm truncate">{{ item.vehicle_name }}</p>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ item.license_plate }} • {{ formatTime(item.inspection_date) }}
                </p>
              </div>
              <div
                class="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                :class="statusClass(item.status_color)"
              >
                {{ item.status_label }}
              </div>
            </div>
          </div>

          <div v-else class="text-center py-6 text-gray-400 text-sm">
            Belum ada aktivitas hari ini
          </div>
        </div>

      </template>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHomeData } from '../services/homeService'
import type { HomeSummary, RecentInspection } from '../services/homeService'

const router = useRouter()

const loading          = ref(true)
const summary          = ref<HomeSummary | null>(null)
const recentInspections = ref<RecentInspection[]>([])

const balanceAmount = computed(() =>
  summary.value?.total_balance.amount ?? 0
)

const quickMenus = [
  {
    icon: '📊',
    title: 'Laporan',
    description: 'Lihat hasil inspeksi',
    route: 'Laporan',
  },
  {
    icon: '➕',
    title: 'Buat',
    description: 'Buat inspeksi baru',
    route: 'CreatedInspection',
  },
]

async function fetchHome() {
  loading.value = true
  try {
    const res = await getHomeData()
    const data = res.data?.data
    summary.value          = data?.summary          ?? null
    recentInspections.value = data?.recent_inspections ?? []
  } catch (e) {
    console.error('Gagal memuat home:', e)
  } finally {
    loading.value = false
  }
}

function formatTime(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour:   '2-digit',
    minute: '2-digit',
  })
}

function statusClass(color: string) {
  const map: Record<string, string> = {
    success: 'bg-green-100 text-green-600',
    info:    'bg-blue-100 text-blue-600',
    warning: 'bg-yellow-100 text-yellow-600',
    danger:  'bg-red-100 text-red-600',
  }
  return map[color] ?? 'bg-gray-100 text-gray-600'
}

onMounted(fetchHome)
</script>

<style scoped>
/* ── SKELETON BASE ─────────────────────────────── */
.sk {
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.4s ease-in-out infinite;
  border-radius: 6px;
}
@keyframes sk-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── SKELETON SIZES ────────────────────────────── */
.sk-text-sm   { height: 10px; border-radius: 4px; }
.sk-text-base { height: 14px; border-radius: 4px; }
.sk-text-lg   { height: 18px; border-radius: 4px; }
.sk-text-xl   { height: 24px; border-radius: 4px; }
.sk-badge     { height: 22px; border-radius: 20px; }
.sk-icon      { width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0; }
.sk-icon-lg   { width: 44px; height: 44px; border-radius: 10px; }
</style>