<!-- components/finance/BillingCard.vue -->
<template>
  <div class="bg-white rounded-3xl p-5 shadow-sm">

    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <h2 class="font-semibold text-gray-800 text-sm leading-tight truncate">
          {{ item.vehicle_name || '-' }}
        </h2>
        <p class="text-xs text-gray-400 mt-0.5">{{ item.license_plate || '-' }}</p>
      </div>

      <span
        class="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold"
        :class="statusClass"
      >
        {{ statusLabel }}
      </span>
    </div>

    <p v-if="item.notes" class="mt-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
      {{ item.notes }}
    </p>

    <div class="mt-4 flex items-end justify-between">
      <div>
        <p class="text-xs text-gray-400">Tagihan</p>
        <p class="text-xl font-bold text-red-500 mt-0.5">{{ item.amount_format }}</p>
      </div>

      <div class="flex items-center gap-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-xs text-gray-400">{{ formatDate(item.date) }}</p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FinanceBilling } from '../../types/finance'

const props = defineProps<{
  item: FinanceBilling
}>()

const statusMap: Record<string, { label: string; cls: string }> = {
  paid:    { label: 'Lunas',    cls: 'bg-green-100 text-green-700' },
  pending: { label: 'Belum Lunas', cls: 'bg-red-100 text-red-700' },
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
    day: '2-digit', month: 'long', year: 'numeric'
  })
}
</script>