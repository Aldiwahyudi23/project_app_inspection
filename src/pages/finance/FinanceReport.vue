<!-- pages/finance/FinanceReport.vue -->
<template>
  <div class="min-h-screen bg-gray-100 pb-4">

    <!-- ═══════════════════════════════════════════════════════
         STICKY HEADER — nyatu dengan hero, tidak ikut scroll
    ═══════════════════════════════════════════════════════ -->
    <div class="sticky top-0 z-20 bg-blue-600 px-4 py-4 pt-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button
          @click="router.back()"
          class="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95"
        >
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-base font-semibold text-white">Laporan Keuangan</h1>
      </div>

      <button
        @click="fetchReport"
        class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center active:scale-95 transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          :class="{ 'animate-spin': isLoading }"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.458 9A7.962 7.962 0 014 12c0 4.418 3.582 8 8 8a8 8 0 007.938-7M18.542 15A7.962 7.962 0 0020 12c0-4.418-3.582-8-8-8a8 8 0 00-7.938 7" />
        </svg>
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         HERO — menyambung langsung di bawah sticky header
    ═══════════════════════════════════════════════════════ -->
    <div class="bg-gradient-to-b from-blue-600 to-blue-700 px-5 pb-4 rounded-b-[35px] text-white -mt-px">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-blue-100 text-sm">Ringkasan inspeksi & pendapatan</p>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="flex gap-3 overflow-x-auto no-scrollbar mt-6 pb-1">
        <template v-if="isLoading">
          <div v-for="n in 4" :key="n" class="min-w-[175px]">
            <div class="bg-white/10 rounded-3xl p-4">
              <div class="sk sk-text-sm w-24 mb-2 opacity-40"></div>
              <div class="sk sk-text-lg w-28 mb-1 opacity-40"></div>
              <div class="sk sk-text-sm w-20 opacity-40"></div>
            </div>
          </div>
        </template>
        <template v-else>
          <SummaryCard
            title="Total Inspeksi"
            :value="String(summary.total_inspections)"
            subtitle="Inspeksi selesai"
            icon="inspection"
          />
          <SummaryCard
            title="Pendapatan"
            :value="summary.total_income_format"
            subtitle="Total diterima"
            icon="income"
          />
          <SummaryCard
            title="Tagihan"
            :value="summary.unpaid_bill_format"
            subtitle="Belum lunas"
            icon="bill"
          />
          <SummaryCard
            title="Deposit"
            :value="summary.total_deposit_format"
            subtitle="Dana disetor"
            icon="wallet"
          />
        </template>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         FILTER BULAN & TAHUN
    ═══════════════════════════════════════════════════════ -->
    <div class="px-5 mt-5">
      <div class="bg-white rounded-3xl p-4 shadow-sm flex gap-3">
        <select
          v-model="selectedMonth"
          class="flex-1 h-11 rounded-2xl border border-gray-200 px-4 text-sm outline-none bg-white"
          @change="fetchReport"
        >
          <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>

        <select
          v-model="selectedYear"
          class="w-28 h-11 rounded-2xl border border-gray-200 px-4 text-sm outline-none bg-white"
          @change="fetchReport"
        >
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         GRAFIK  — responsive, touch-friendly
    ═══════════════════════════════════════════════════════ -->
    <div class="px-5 mt-5">
      <div class="bg-white rounded-3xl p-5 shadow-sm">

        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="font-bold text-gray-800">Grafik Pendapatan</h2>
            <p class="text-xs text-gray-400 mt-0.5">
              {{ monthLabel }} {{ selectedYear }}
            </p>
          </div>
          <p class="text-sm font-bold text-blue-600">
            {{ summary.total_income_format }}
          </p>
        </div>

        <!-- Loading skeleton -->
        <div v-if="isLoading" class="flex items-end gap-1 h-40">
          <div
            v-for="n in 10" :key="n"
            class="flex-1"
            :style="{ height: (20 + n * 7) + '%' }"
          >
            <div class="bg-gray-100 rounded-t-xl w-full h-full"></div>
          </div>
        </div>

        <!-- Chart: scroll horizontal jika banyak kolom -->
        <div v-else>
          <!-- Peak label -->
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs text-gray-400">0</span>
            <span class="text-xs text-gray-400">{{ peakFormat }}</span>
          </div>

          <!-- Bar chart — scrollable di mobile -->
          <div class="overflow-x-auto no-scrollbar -mx-1">
            <div
              class="flex items-end gap-1 px-1 pb-6"
              :style="{ minWidth: chartMinWidth, height: (CHART_H + 24) + 'px' }"
            >
              <div
                v-for="(item, index) in normalizedChart"
                :key="index"
                class="relative flex-1 flex flex-col items-center justify-end"
                style="min-width: 22px; height: 100%;"
                @click="selectedBar = selectedBar === index ? null : index"
              >
                <!-- Tooltip -->
                <div
                  v-if="selectedBar === index && item.amount > 0"
                  class="absolute z-10 whitespace-nowrap bg-gray-800 text-white text-xs rounded-xl px-3 py-1.5 pointer-events-none"
                  :style="{ bottom: Math.max(item.heightPx, 4) + 30 + 'px', left: '50%', transform: 'translateX(-50%)' }"
                >
                  {{ item.amount_format }}
                  <div class="absolute top-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800" />
                </div>

                <!-- Bar -->
                <div
                  class="w-full rounded-t-lg transition-all duration-500 cursor-pointer"
                  :class="item.amount > 0 ? 'bg-blue-500 hover:bg-blue-400' : 'bg-gray-100'"
                  :style="{ height: Math.max(item.heightPx, 3) + 'px', flexShrink: 0 }"
                />

                <!-- Label hari -->
                <span class="text-[10px] text-gray-400 mt-1 leading-none absolute bottom-0">
                  {{ item.day }}
                </span>
              </div>
            </div>
          </div>

          <!-- Highlight hari dengan transaksi -->
          <div v-if="activeDays.length" class="mt-4 flex flex-wrap gap-2">
            <div
              v-for="d in activeDays"
              :key="d.day"
              class="px-3 py-1.5 bg-blue-50 rounded-xl"
            >
              <p class="text-xs text-blue-800 font-semibold">Tgl {{ d.day }}</p>
              <p class="text-xs text-blue-600">{{ d.amount_format }}</p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         MAIN TABS: Inspeksi | Pendapatan | Tagihan
    ═══════════════════════════════════════════════════════ -->
    <div class="px-5 mt-5">
      <div class="bg-white rounded-3xl p-1.5 shadow-sm flex gap-1">
        <button
          v-for="tab in mainTabs"
          :key="tab"
          @click="activeMainTab = tab"
          class="flex-1 h-10 rounded-2xl text-sm font-semibold transition-all"
          :class="activeMainTab === tab
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         CONTENT AREA
    ═══════════════════════════════════════════════════════ -->
    <div class="px-5 mt-4">

      <!-- Loading skeletons -->
      <template v-if="isLoading">
        <!-- Skeleton untuk Inspeksi -->
        <div class="space-y-4">
          <div v-for="n in 4" :key="n" class="bg-white rounded-3xl p-4 shadow-sm">
            <div class="flex items-start gap-3">
              <div class="sk sk-icon-lg flex-shrink-0"></div>
              <div class="flex-1">
                <div class="sk sk-text-base w-32 mb-2"></div>
                <div class="sk sk-text-sm w-40 mb-1"></div>
                <div class="sk sk-text-sm w-28"></div>
              </div>
              <div class="sk sk-badge w-20"></div>
            </div>
          </div>
        </div>
      </template>

      <!-- ── INSPEKSI ── -->
      <template v-else-if="activeMainTab === 'Inspeksi'">
        <div v-if="inspections.length" class="space-y-4">
          <InspectionCard
            v-for="item in inspections"
            :key="item.id"
            :item="item"
          />
        </div>
        <EmptyState v-else label="Belum ada inspeksi" icon="clipboard" />
      </template>

      <!-- ── PENDAPATAN: sub-tab Income | Withdraw ── -->
      <template v-else-if="activeMainTab === 'Pendapatan'">

        <!-- Sub-tabs -->
        <div class="flex gap-2 mb-4">
          <button
            v-for="sub in pendapatanSubTabs"
            :key="sub"
            @click="activePendapatanSub = sub"
            class="flex-1 h-9 rounded-2xl text-xs font-semibold border transition-all"
            :class="activePendapatanSub === sub
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-500 border-gray-200'"
          >
            {{ sub }}
          </button>
        </div>

        <!-- Income -->
        <template v-if="activePendapatanSub === 'Pemasukan'">
          <div v-if="incomes.length" class="space-y-4">
            <IncomeCard v-for="item in incomes" :key="item.id" :item="item" />
          </div>
          <EmptyState v-else label="Belum ada pendapatan" icon="coins" />
        </template>

        <!-- Withdraw -->
        <template v-else>
          <div v-if="withdraws.length" class="space-y-4">
            <WithdrawCard v-for="item in withdraws" :key="item.id" :item="item" />
          </div>
          <EmptyState v-else label="Belum ada penarikan" icon="wallet" />
        </template>

      </template>

      <!-- ── TAGIHAN: sub-tab Billing | Deposit ── -->
      <template v-else>

        <!-- Sub-tabs -->
        <div class="flex gap-2 mb-4">
          <button
            v-for="sub in tagihanSubTabs"
            :key="sub"
            @click="activeTagihanSub = sub"
            class="flex-1 h-9 rounded-2xl text-xs font-semibold border transition-all"
            :class="activeTagihanSub === sub
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-500 border-gray-200'"
          >
            {{ sub }}
          </button>
        </div>

        <!-- Billing -->
        <template v-if="activeTagihanSub === 'Tagihan'">
          <div v-if="billings.length" class="space-y-4">
            <BillingCard v-for="item in billings" :key="item.id" :item="item" />
          </div>
          <EmptyState v-else label="Tidak ada tagihan" icon="receipt" />
        </template>

        <!-- Deposit -->
        <template v-else>
          <div v-if="deposits.length" class="space-y-4">
            <DepositCard v-for="item in deposits" :key="item.id" :item="item" />
          </div>
          <EmptyState v-else label="Belum ada deposit" icon="wallet" />
        </template>

      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { getFinanceReport } from '../../services/financeService'

import type {
  FinanceSummary,
  FinanceChart,
  FinanceInspection,
  FinanceIncome,
  FinanceBilling,
  FinanceDeposit,
  FinanceWithdraw
} from '../../types/finance'

import SummaryCard   from '../../components/finance/SummaryCard.vue'
import InspectionCard from '../../components/finance/InspectionCard.vue'
import IncomeCard    from '../../components/finance/IncomeCard.vue'
import WithdrawCard  from '../../components/finance/WithdrawCard.vue'
import BillingCard   from '../../components/finance/BillingCard.vue'
import DepositCard   from '../../components/finance/DepositCard.vue'

// ── Inline EmptyState (tidak perlu file terpisah) ────────────
const EmptyState = {
  props: ['label', 'icon'],
  template: `
    <div class="flex flex-col items-center py-14 text-gray-400">
      <div class="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p class="text-sm font-medium text-gray-500">{{ label }}</p>
    </div>
  `
}

// ══════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════

const isLoading      = ref(false)
const router         = useRouter()
const selectedMonth  = ref(new Date().getMonth() + 1)
const selectedYear   = ref(new Date().getFullYear())

// Main tabs
const mainTabs       = ['Inspeksi', 'Pendapatan', 'Tagihan']
const activeMainTab  = ref('Inspeksi')

// Sub-tabs
const pendapatanSubTabs   = ['Pemasukan', 'Tarik Dana']
const activePendapatanSub = ref('Pemasukan')

const tagihanSubTabs   = ['Tagihan', 'Setor Dana']
const activeTagihanSub = ref('Tagihan')

// Tooltip bar index
const selectedBar = ref<number | null>(null)

// ══════════════════════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════════════════════

const summary = ref<FinanceSummary>({
  total_inspections:    0,
  total_income:         0,
  total_income_format:  'Rp 0',
  total_platform_fee:   0,
  total_platform_fee_format: 'Rp 0',
  total_deposit:        0,
  total_deposit_format: 'Rp 0',
  total_withdraw:       0,
  total_withdraw_format: 'Rp 0',
  unpaid_bill:          0,
  unpaid_bill_format:   'Rp 0',
})

const chartData   = ref<FinanceChart[]>([])
const inspections = ref<FinanceInspection[]>([])
const incomes     = ref<FinanceIncome[]>([])
const billings    = ref<FinanceBilling[]>([])
const deposits    = ref<FinanceDeposit[]>([])
const withdraws   = ref<FinanceWithdraw[]>([])

// ══════════════════════════════════════════════════════════════
// OPTIONS
// ══════════════════════════════════════════════════════════════

const months = [
  { value: 1,  label: 'Januari' },  { value: 2,  label: 'Februari' },
  { value: 3,  label: 'Maret' },    { value: 4,  label: 'April' },
  { value: 5,  label: 'Mei' },      { value: 6,  label: 'Juni' },
  { value: 7,  label: 'Juli' },     { value: 8,  label: 'Agustus' },
  { value: 9,  label: 'September' },{ value: 10, label: 'Oktober' },
  { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
]

const years = [2024, 2025, 2026]

// ══════════════════════════════════════════════════════════════
// FETCH
// ══════════════════════════════════════════════════════════════

async function fetchReport() {
  try {
    isLoading.value   = true
    selectedBar.value = null

    const response = await getFinanceReport(selectedMonth.value, selectedYear.value)
    const data = response.data.data

    summary.value    = data.summary
    chartData.value  = data.chart
    inspections.value = data.inspections
    incomes.value    = data.income        // ← key JSON: "income" bukan "incomes"
    billings.value   = data.billings
    deposits.value   = data.deposits
    withdraws.value  = data.withdraws

  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

// ══════════════════════════════════════════════════════════════
// CHART COMPUTED
// ══════════════════════════════════════════════════════════════

// Tinggi chart dalam px — nilai fixed agar % tidak collapse
const CHART_H = 160

const normalizedChart = computed(() => {
  if (!chartData.value.length) return []

  const max = Math.max(...chartData.value.map(i => i.amount), 1)

  return chartData.value.map(item => ({
    ...item,
    height:   (item.amount / max) * 100,          // masih disimpan untuk keperluan lain
    heightPx: Math.round((item.amount / max) * CHART_H)  // px nyata untuk bar
  }))
})

// Hari-hari yang punya transaksi (untuk highlight di bawah chart)
const activeDays = computed(() =>
  chartData.value.filter(i => i.amount > 0)
)

// Nilai tertinggi
const peakFormat = computed(() => {
  // Jika array kosong, langsung kembalikan nilai default agar tidak error
  if (!chartData.value.length) return 'Rp 0';

  // TypeScript sekarang tahu bahwa a dan b adalah tipe FinanceChart
  const peak = chartData.value.reduce((a: FinanceChart, b: FinanceChart) => 
    (b.amount > a.amount ? b : a)
  );
  
  return peak.amount_format;
})

// Lebar minimum chart agar responsif: 28px per hari
const chartMinWidth = computed(() =>
  chartData.value.length > 0
    ? Math.max(chartData.value.length * 28, 100) + 'px'
    : '100%'
)

// Label bulan terpilih
const monthLabel = computed(() =>
  months.find(m => m.value === selectedMonth.value)?.label ?? ''
)

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════

onMounted(() => {
  fetchReport()
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

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
.sk-badge     { height: 22px; border-radius: 20px; width: 60px; }
.sk-icon      { width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0; }
.sk-icon-lg   { width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; }
</style>