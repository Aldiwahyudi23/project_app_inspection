<!-- components/finance/DepositCard.vue -->
<template>
  <div
    @click="goToDetail"
    class="bg-white rounded-3xl p-5 shadow-sm active:scale-[0.98] transition cursor-pointer"
  >

    <div class="flex items-start justify-between gap-3">

      <div class="flex items-center gap-3 flex-1">

        <div class="w-9 h-9 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">

          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >

            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />

          </svg>

        </div>

        <div>

          <p class="font-semibold text-gray-800 text-sm">
            Setoran Dana
          </p>

          <p class="text-xs text-gray-400 mt-0.5">
            {{ formatDate(item.date) }}
          </p>

        </div>

      </div>

      <span
        class="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold"
        :class="statusClass"
      >
        {{ statusLabel }}
      </span>

    </div>

    <!-- NOTES -->
    <p
      v-if="item.notes"
      class="mt-3 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2"
    >
      {{ item.notes }}
    </p>

    <!-- FOOTER -->
    <div class="mt-2 flex items-end justify-between">

      <div>

        <p class="text-xs text-gray-400">
          Jumlah
        </p>

        <p class="text-xl font-bold text-blue-600 mt-0.5">
          {{ item.amount_format }}
        </p>

      </div>

      <div class="flex items-center gap-2">

        <!-- Bukti transfer -->
        <div
          v-if="item.proof_transfer"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-xl"
        >

          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-3.5 h-3.5 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >

            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />

          </svg>

          <p class="text-xs text-blue-600 font-medium">
            Bukti Transfer
          </p>

        </div>

        <!-- Arrow -->
        <div class="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">

          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >

            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />

          </svg>

        </div>

      </div>

    </div>

  </div>
</template>

<script setup lang="ts">

import { computed } from 'vue'
import { useRouter } from 'vue-router'

import type {
  FinanceDeposit
} from '../../types/finance'

const router = useRouter()

const props = defineProps<{
  item: FinanceDeposit
}>()

// ============================================================
// STATUS
// ============================================================

const statusMap: Record<
  string,
  {
    label: string
    cls: string
  }
> = {

  approved: {
    label: 'Disetujui',
    cls: 'bg-green-100 text-green-700'
  },

  pending: {
    label: 'Diproses',
    cls: 'bg-yellow-100 text-yellow-700'
  },

  cancelled: {
    label: 'Dibatalkan',
    cls: 'bg-red-100 text-red-700'
  },
}

const statusClass = computed(() =>
  statusMap[props.item.status]?.cls
  ?? 'bg-gray-100 text-gray-500'
)

const statusLabel = computed(() =>
  statusMap[props.item.status]?.label
  ?? props.item.status
)

// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(date: string | null) {

  if (!date) return '-'

  return new Date(date).toLocaleDateString(
    'id-ID',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }
  )
}

// ============================================================
// DETAIL
// ============================================================

function goToDetail() {

  router.push(
    `/finance/payout/${props.item.id}`
  )
}

</script>