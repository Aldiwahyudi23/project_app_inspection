<template>
  <div class="min-h-screen bg-gray-100 pb-24">

    <!-- ═══════════════════════════════════════════════════════
         STICKY HEADER — nyatu dengan hero, tidak ikut scroll
         warna menyesuaikan dengan tipe transaksi
    ═══════════════════════════════════════════════════════ -->
    <div 
      class="sticky top-0 z-20 px-4 py-4 pt-3 flex items-center gap-3"
      :class="!loading && detail?.type === 'withdraw'
        ? 'bg-blue-600'
        : !loading && detail?.type !== 'withdraw'
        ? 'bg-orange-500'
        : 'bg-blue-600'"
    >
      <button
        @click="$router.back()"
        class="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95"
      >
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-base font-semibold text-white">Detail Transaksi</h1>
    </div>

    <!-- HERO — menyambung langsung di bawah sticky header -->
    <div 
      v-if="!loading && detail"
      class="px-5 pb-8 rounded-b-[35px] text-white -mt-px"
      :class="detail.type === 'withdraw'
        ? 'bg-gradient-to-b from-blue-600 to-blue-700'
        : 'bg-gradient-to-b from-orange-500 to-orange-600'"
    >
      <p class="text-sm opacity-90">
        Detail {{ detail.type_label }}
      </p>

      <h1 class="text-3xl font-bold mt-1">
        {{ detail.total_amount_format }}
      </h1>

      <div class="flex items-center gap-2 mt-4">
        <div
          class="px-3 py-1 rounded-full text-sm font-semibold"
          :class="statusClass"
        >
          {{ detail.status }}
        </div>

        <div class="text-sm opacity-90">
          {{ formatDate(detail.created_at) }}
        </div>
      </div>
    </div>

    <!-- LOADING skeleton dengan efek shimmer -->
    <div v-if="loading" class="px-5">
      <!-- Skeleton Hero -->
      <div class="bg-gradient-to-b from-blue-600 to-blue-700 rounded-b-[35px] -mt-px">
        <div class="px-5 pb-8 pt-6">
          <div class="sk sk-text-sm w-28 mb-3 opacity-40"></div>
          <div class="sk sk-text-xl w-40 mb-2 opacity-40"></div>
          <div class="flex items-center gap-2">
            <div class="sk-badge-white w-24"></div>
            <div class="sk-text-white w-32"></div>
          </div>
        </div>
      </div>

      <!-- Skeleton Info Card -->
      <div class="mt-5">
        <div class="bg-white rounded-3xl p-5 shadow-sm">
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <div class="sk sk-text-sm w-16"></div>
              <div class="sk sk-text-sm w-24"></div>
            </div>
            <div class="flex justify-between items-center">
              <div class="sk sk-text-sm w-16"></div>
              <div class="sk sk-text-base w-32"></div>
            </div>
            <div class="flex justify-between items-center">
              <div class="sk sk-text-sm w-24"></div>
              <div class="sk sk-text-sm w-28"></div>
            </div>
            <div class="pt-2">
              <div class="sk sk-text-sm w-16 mb-2"></div>
              <div class="sk sk-text-base w-full" style="height: 80px; border-radius: 16px;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Skeleton Proof Transfer -->
      <div class="mt-5">
        <div class="bg-white rounded-3xl p-4 shadow-sm">
          <div class="sk sk-text-base w-32 mb-4"></div>
          <div class="sk sk-text-base w-full" style="height: 200px; border-radius: 16px;"></div>
        </div>
      </div>

      <!-- Skeleton Items Title -->
      <div class="flex items-center justify-between mb-4 mt-5 px-1">
        <div class="sk sk-text-base w-32"></div>
        <div class="sk sk-text-sm w-16"></div>
      </div>

      <!-- Skeleton Items List -->
      <div class="space-y-4">
        <div v-for="i in 3" :key="i" class="bg-white rounded-3xl p-4 shadow-sm">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="sk sk-text-base w-40 mb-2"></div>
              <div class="sk sk-text-sm w-32"></div>
            </div>
            <div class="text-right">
              <div class="sk sk-text-base w-28 mb-1"></div>
              <div class="sk sk-text-sm w-24"></div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-4">
            <div class="sk sk-badge w-20"></div>
            <div class="sk sk-text-sm w-24"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- CONTENT - INFO -->
    <div v-if="!loading && detail" class="px-5 -mt-6">
      <div class="bg-white rounded-3xl p-5 shadow-sm">
        <div class="space-y-4 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">Jenis</span>
            <span class="font-semibold text-gray-800">{{ detail.type_label }}</span>
          </div>

          <div class="flex justify-between">
            <span class="text-gray-500">Total</span>
            <span class="font-bold text-gray-800">{{ detail.total_amount_format }}</span>
          </div>

          <div v-if="detail.approved_by" class="flex justify-between">
            <span class="text-gray-500">Disetujui Oleh</span>
            <span class="font-semibold text-gray-800">{{ detail.approved_by }}</span>
          </div>

          <div v-if="detail.notes" class="pt-2">
            <p class="text-gray-500 mb-2">Catatan</p>
            <div class="bg-gray-50 rounded-2xl p-4 text-gray-700">
              {{ detail.notes }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PROOF -->
    <div v-if="!loading && detail && detail.proof_transfer" class="px-5 mt-5">
      <div class="bg-white rounded-3xl p-4 shadow-sm">
        <p class="font-bold text-gray-800 mb-4">Bukti Transfer</p>
        <img :src="detail.proof_transfer" class="w-full rounded-2xl object-cover" />
      </div>
    </div>

    <!-- ITEMS -->
    <div v-if="!loading && detail" class="px-5 mt-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-gray-800 text-lg">Detail Transaksi</h2>
        <span class="text-sm text-gray-500">{{ detail.items.length }} item</span>
      </div>

      <div class="space-y-4">
        <div
          v-for="item in detail.items"
          :key="item.transaction_id"
          class="bg-white rounded-3xl p-4 shadow-sm"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-bold text-gray-800">{{ item.vehicle_name }}</h3>
              <p class="text-sm text-gray-500 mt-1">{{ item.license_plate }}</p>
            </div>

            <div class="text-right">
              <p class="font-bold text-gray-800">{{ item.amount_format }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ formatDate(item.date) }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between mt-4">
            <!-- <div
              class="px-3 py-1 rounded-full text-xs font-semibold"
              :class="item.direction === 'credit'
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'"
            >
              {{ item.direction }}
            </div> -->
            <div class="text-xs text-gray-500">{{ item.transaction_type }}</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getPayoutDetail } from '../../services/financeService'
import type { PayoutDetail } from '../../types/finance'

const route = useRoute()
const loading = ref(true)
const detail = ref<PayoutDetail | null>(null)

async function loadData() {
  loading.value = true
  try {
    const response = await getPayoutDetail(route.params.id as string)
    detail.value = response.data.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const statusClass = computed(() => {
  if (!detail.value) return ''
  switch (detail.value.status) {
    case 'approved':
      return 'bg-green-100 text-green-700'
    case 'pending':
      return 'bg-yellow-100 text-yellow-700'
    case 'rejected':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
})

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* ── SKELETON BASE ─────────────────────────────── */
.sk {
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.4s ease-in-out infinite;
  border-radius: 6px;
}

.sk-badge {
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.4s ease-in-out infinite;
  border-radius: 20px;
  height: 28px;
}

.sk-badge-white {
  background: linear-gradient(90deg, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.4s ease-in-out infinite;
  border-radius: 20px;
  height: 28px;
}

.sk-text-white {
  background: linear-gradient(90deg, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.4s ease-in-out infinite;
  border-radius: 4px;
  height: 10px;
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
</style>