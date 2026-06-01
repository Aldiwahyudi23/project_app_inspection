<!-- components/finance/IncomeCard.vue -->
<template>
  <div class="bg-white rounded-3xl p-5 shadow-sm">

    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <h2 class="font-semibold text-gray-800 text-sm leading-tight truncate">
          {{ item.vehicle_name || '-' }}
        </h2>
        <p class="text-xs text-gray-400 mt-0.5">{{ item.license_plate || '-' }}</p>
      </div>

      <p class="flex-shrink-0 text-base font-bold text-green-600">
        + {{ item.income_format }}
      </p>
    </div>

    <div class="mt-3 flex items-center gap-2">
      <span
        class="px-2 py-0.5 rounded-md text-xs font-medium"
        :class="item.source === 'platform'
          ? 'bg-purple-100 text-purple-700'
          : 'bg-blue-100 text-blue-700'"
      >
        {{ item.source === 'platform' ? 'Via Platform' : 'Inspector Langsung' }}
      </span>

      <span
        class="px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700"
      >
        {{ statusLabel }}
      </span>
    </div>

    <div class="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-xs text-gray-400">{{ formatDate(item.date) }}</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FinanceIncome } from '../../types/finance'

const props = defineProps<{
  item: FinanceIncome
}>()

const statusMap: Record<string, string> = {
  generated: 'Tercatat',
  paid:      'Dibayar',
  pending:   'Menunggu',
}

const statusLabel = computed(() =>
  statusMap[props.item.status] ?? props.item.status
)

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}
</script>