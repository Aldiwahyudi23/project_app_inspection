<!-- components/finance/WithdrawCard.vue -->
<template>
  <div
    @click="goToDetail"
    class="bg-white rounded-3xl p-5 shadow-sm active:scale-[0.98] transition cursor-pointer"
  >

    <div class="flex items-start justify-between gap-3">

      <div class="flex-1">

        <div class="flex items-center gap-2">

          <div class="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4 text-orange-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >

              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
              />

            </svg>

          </div>

          <div>

            <p class="font-semibold text-gray-800 text-sm">
              Penarikan Dana
            </p>

            <p class="text-xs text-gray-400 mt-0.5">
              {{ formatDate(item.date) }}
            </p>

          </div>

        </div>

      </div>

      <span
        class="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold"
        :class="statusClass"
      >
        {{ statusLabel }}
      </span>

    </div>

    <div class="mt-4 flex items-end justify-between">

      <div>

        <p class="text-xs text-gray-400">
          Jumlah
        </p>

        <p class="text-xl font-bold text-gray-800 mt-0.5">
          {{ item.amount_format }}
        </p>

      </div>

      <div class="flex items-center gap-2">

        <p
          v-if="item.notes"
          class="text-xs text-gray-400 text-right max-w-[140px] line-clamp-2"
        >
          {{ item.notes }}
        </p>

        <!-- ARROW -->
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
  FinanceWithdraw
} from '../../types/finance'

const router = useRouter()

const props = defineProps<{
  item: FinanceWithdraw
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
    label: 'Berhasil',
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