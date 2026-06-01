<!-- components/finance/InspectionCard.vue -->
<template>
  <div class="bg-white rounded-3xl p-5 shadow-sm">

    <!-- Header: nama kendaraan + status -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <h2 class="font-bold text-gray-800 text-sm leading-tight truncate">
          {{ item.vehicle_name || '-' }}
        </h2>
        <p class="text-xs text-gray-400 mt-1">{{ item.license_plate || '-' }}</p>
      </div>

      <span
        class="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold"
        :class="statusClass"
      >
        {{ statusLabel }}
      </span>
    </div>

    <!-- Source badge -->
    <div class="mt-3">
      <span
        class="px-2 py-0.5 rounded-md text-xs font-medium"
        :class="item.source === 'platform'
          ? 'bg-purple-100 text-purple-700'
          : 'bg-blue-100 text-blue-700'"
      >
        {{ item.source === 'platform' ? 'Via Platform' : 'Inspector Langsung' }}
      </span>
    </div>

    <!-- Income info -->
    <div class="mt-4 grid grid-cols-3 gap-3">
      <div>
        <p class="text-xs text-gray-400">Harga</p>
        <p class="text-sm font-semibold text-gray-700 mt-0.5">{{ item.paid_total_format }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-400">Pendapatan</p>
        <p class="text-sm font-semibold text-blue-600 mt-0.5">{{ item.inspector_income_format }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-400">Platform Fee</p>
        <p class="text-sm font-semibold text-orange-500 mt-0.5">{{ item.platform_fee_format }}</p>
      </div>
    </div>

    <!-- Tanggal -->
    <div class="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-xs text-gray-400">{{ formatDate(item.date) }}</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { FinanceInspection } from '../../types/finance'

const props = defineProps<{
  item: FinanceInspection
}>()

const statusMap: Record<string, { label: string; cls: string }> = {
  approved:   { label: 'Selesai',   cls: 'bg-green-100 text-green-700' },
  pending:    { label: 'Menunggu',  cls: 'bg-yellow-100 text-yellow-700' },
  rejected:   { label: 'Ditolak',  cls: 'bg-red-100 text-red-700' },
  cancelled:  { label: 'Dibatal',  cls: 'bg-gray-100 text-gray-500' },
}

const statusClass = computed(() =>
  statusMap[props.item.status]?.cls ?? 'bg-gray-100 text-gray-500'
)
const statusLabel = computed(() =>
  statusMap[props.item.status]?.label ?? props.item.status
)

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
</script>

<script lang="ts">
import { computed } from 'vue'
export default {}
</script>