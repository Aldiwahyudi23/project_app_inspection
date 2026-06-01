<template>
  <div class="fixed inset-0 bg-gray-100 flex flex-col">

  <!-- Header — tidak ikut scroll -->
  <div class="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 pt-3 pb-4 shadow-lg flex-shrink-0 z-10">
      <div class="flex items-center">
        <button @click="router.back()" class="mr-3 p-2 hover:bg-white/20 rounded-full transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-sm font-semibold">Dompet</h1>
      </div>
    </div>

    <main class="flex-1 overflow-y-auto pb-4 px-3 pt-3 space-y-3">

      <!-- ═══ LOADING SKELETON ═══ -->
      <template v-if="loading">

        <!-- Skeleton Summary -->
        <div class="rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4 shadow-lg">
          <div class="sk sk-text-sm w-28 mb-3 opacity-40"></div>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-white/15 rounded-lg p-2.5">
              <div class="sk sk-text-sm w-20 mb-2 opacity-40"></div>
              <div class="sk sk-text-xl w-28 opacity-40"></div>
            </div>
            <div class="bg-white/15 rounded-lg p-2.5">
              <div class="sk sk-text-sm w-20 mb-2 opacity-40"></div>
              <div class="sk sk-text-xl w-28 opacity-40"></div>
            </div>
          </div>
        </div>

        <!-- Skeleton Tab -->
        <div class="bg-white rounded-xl p-1 shadow-sm flex gap-1">
          <div class="sk flex-1 h-9 rounded-lg"></div>
          <div class="sk flex-1 h-9 rounded-lg"></div>
        </div>

        <!-- Skeleton Items -->
        <div class="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <div v-for="i in 3" :key="i" class="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div class="sk sk-icon flex-shrink-0"></div>
            <div class="flex-1 space-y-1.5">
              <div class="sk sk-text-sm w-32"></div>
              <div class="sk sk-text-sm w-24"></div>
            </div>
            <div class="sk sk-text-base w-20"></div>
          </div>
        </div>

      </template>

      <!-- ═══ CONTENT ═══ -->
      <template v-else>

        <!-- Summary Card -->
        <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4 shadow-lg">
          <div class="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div class="absolute bottom-0 right-0 w-20 h-20 bg-white/10 rounded-full"></div>
          <div class="relative z-10">
            <p class="text-blue-100 text-xs mb-3">Ringkasan Keuangan</p>
            <div class="grid grid-cols-2 gap-2">
              <div class="bg-white/15 backdrop-blur-md rounded-lg p-2.5 border border-white/10">
                <p class="text-blue-100 text-xs">Saldo Tersedia</p>
                <h2 class="text-base font-bold text-white mt-0.5 truncate">
                  {{ financeData?.withdraw.total_amount_formatted ?? 'Rp0' }}
                </h2>
                <p class="text-xs text-blue-100 mt-0.5">
                  {{ financeData?.withdraw.items.length ?? 0 }} transaksi
                </p>
              </div>
              <div class="bg-white/15 backdrop-blur-md rounded-lg p-2.5 border border-white/10">
                <p class="text-blue-100 text-xs">Total Tagihan</p>
                <h2 class="text-base font-bold text-white mt-0.5 truncate">
                  {{ financeData?.deposit.total_amount_formatted ?? 'Rp0' }}
                </h2>
                <p class="text-xs text-blue-100 mt-0.5">
                  {{ financeData?.deposit.items.length ?? 0 }} tagihan
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Switcher -->
        <div class="bg-white rounded-xl p-1 shadow-sm flex gap-1">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
            :class="activeTab === tab.key
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-500'"
            @click="activeTab = tab.key"
          >
            <span>{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- ── TAB WITHDRAW (SALDO) ── -->
        <template v-if="activeTab === 'withdraw'">

              <!-- Banner: ada pengajuan pending -->
            <div v-if="withdrawHasPending"
                class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3"
            >
                <div class="text-2xl flex-shrink-0">⏳</div>
                <div>
                <p class="text-sm font-bold text-yellow-800">Pengajuan Sedang Diproses</p>
                <p class="text-xs text-yellow-700 mt-0.5 leading-relaxed">
                    Penarikan saldo sebesar
                    <span class="font-bold">
                      {{ withdrawPending?.total_amount_formatted }}
                    </span>
                    sedang dalam proses verifikasi.
                </p>

                <div
                  v-if="withdrawBank"
                  class="mt-3 bg-white/70 rounded-xl p-3 border border-yellow-200"
                >
                  <p class="text-[11px] text-yellow-700 mb-1">
                    Dana akan dikirim ke rekening utama:
                  </p>

                  <p class="text-sm font-bold text-gray-800">
                    {{ withdrawBank.bank_name }}
                  </p>

                  <p class="text-sm font-semibold text-gray-700 tracking-wide mt-0.5">
                    {{ withdrawBank.account_number }}
                  </p>

                  <p class="text-xs text-gray-500 mt-1">
                    a/n {{ withdrawBank.owner_name }}
                  </p>
                </div>

                <p class="text-xs text-yellow-500 mt-3">
                    Tunggu hingga proses selesai sebelum mengajukan penarikan baru.
                </p>
                <p class="text-xs text-yellow-500 mt-1">
                    Diajukan: {{ withdrawPending?.created_at ? formatDate(withdrawPending.created_at) : '-' }}
                </p>
                </div>
            </div>

          <!-- Empty -->
           <div v-else-if="!withdrawItems.length"
                class="bg-white rounded-xl shadow-sm p-8 text-center"
            >
                <div class="text-4xl mb-2">💰</div>
                <p class="text-sm font-semibold text-gray-700">Belum ada saldo</p>
                <p class="text-xs text-gray-400 mt-1">Saldo akan muncul setelah inspeksi disetujui</p>
            </div>

          <template v-else>

            <!-- List Item -->
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
              <div class="px-4 pt-4 pb-2 flex items-center justify-between">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Saldo Tersedia
                </p>
                <!-- Select All -->
                <button
                  class="text-xs font-medium"
                  :class="allWithdrawSelected ? 'text-red-500' : 'text-blue-500'"
                  @click="toggleSelectAll('withdraw')"
                >
                  {{ allWithdrawSelected ? 'Batal Pilih' : 'Pilih Semua' }}
                </button>
              </div>

              <div class="divide-y divide-gray-50">
                <div
                  v-for="item in withdrawItems"
                  :key="item.id"
                  class="flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors cursor-pointer"
                  @click="toggleSelect(item.id, 'withdraw')"
                >
                  <!-- Checkbox -->
                  <div
                    class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    :class="selectedWithdraw.includes(item.id)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'"
                  >
                    <svg v-if="selectedWithdraw.includes(item.id)"
                      width="10" height="10" viewBox="0 0 24 24"
                      fill="none" stroke="white" stroke-width="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>

                  <!-- Icon -->
                  <!-- Foto kendaraan jika ada -->
<div
  class="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100"
>
  <img
    v-if="item.display_image"
    :src="item.display_image"
    class="w-full h-full object-cover"
  />

  <div
    v-else
    class="w-full h-full flex items-center justify-center bg-green-100"
  >
    🚗
  </div>
</div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate">
                      {{ item.vehicle_name ?? '-' }}
                    </p>
                    <p class="text-xs text-gray-400 mt-0.5">
                      {{ item.license_plate ?? '-' }}
                      <template v-if="item.inspection_date">
                        • {{ formatDate(item.inspection_date) }}
                      </template>
                    </p>
                  </div>

                  <!-- Amount -->
                  <div class="text-right flex-shrink-0">
                    <p class="text-sm font-bold text-green-600">
                      {{ item.amount_formatted }}
                    </p>
                    <span class="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                      pending
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rekening Penerima -->
            <div
              v-if="withdrawBank && selectedWithdraw.length"
              class="bg-white rounded-xl shadow-sm p-4 border border-blue-100"
            >
              <div class="flex items-start justify-between gap-3">

                <div class="flex gap-3">
                  <div class="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-lg">
                    🏦
                  </div>

                  <div>
                    <p class="text-xs text-gray-400">
                      Dana akan dikirim ke
                    </p>

                    <p class="text-sm font-bold text-gray-800 mt-0.5">
                      {{ withdrawBank.bank_name }}
                    </p>

                    <p class="text-sm text-gray-700 mt-0.5">
                      {{ withdrawBank.account_number }}
                    </p>

                    <p class="text-xs text-gray-500 mt-1">
                      a/n {{ withdrawBank.owner_name }}
                    </p>
                    <button
                      class="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-600"
                      @click="router.push('/bank-accounts')"
                    >
                      <span>Ubah Rekening Penerima</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            <!-- Belum Ada Rekening -->
            <div
              v-if="!withdrawBank"
              class="bg-red-50 border border-red-200 rounded-xl p-4"
            >

              <div class="flex items-start gap-3">

                <div class="text-xl">
                  🏦
                </div>

                <div class="flex-1">

                  <p class="text-sm font-bold text-red-700">
                    Rekening utama belum ditambahkan
                  </p>

                  <p class="text-xs text-red-500 mt-1 leading-relaxed">
                    {{
                      bankMessage ??
                      'Pilih rekening utama terlebih dahulu sebelum melakukan penarikan dana'
                    }}
                  </p>

                  <button
                    class="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-600"
                    @click="router.push('/bank-accounts')"
                  >
                    <span>Kelola Rekening</span>
                    <span>→</span>
                  </button>

                </div>

              </div>

            </div>

            <!-- Total Selected -->
            <Transition name="slide-up">
              <div v-if="selectedWithdraw.length"
                class="bg-white rounded-xl shadow-sm p-3.5 flex items-center justify-between"
              >
                <div>
                  <p class="text-xs text-gray-500">Total Dipilih</p>
                  <p class="text-base font-bold text-green-600 mt-0.5">
                    {{ selectedWithdrawTotalFmt }}
                  </p>
                </div>
                <button
                class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity"
                :class="hasPrimaryBank
                  ? 'bg-green-500 active:opacity-80'
                  : 'bg-gray-300 cursor-not-allowed'"
                  :disabled="submitting || !hasPrimaryBank"
                  @click="handleWithdraw"
                >
                  <span v-if="!submitting">💸 Tarik Saldo</span>
                  <span v-else class="flex items-center gap-1.5">
                    <span class="btn-spinner btn-spinner--white"></span> Memproses...
                  </span>
                </button>
              </div>
            </Transition>

          </template>
        </template>

        <!-- ── TAB DEPOSIT (TAGIHAN) ── -->
        <template v-if="activeTab === 'deposit'">

              <!-- Banner: ada pengajuan pending -->
            <div v-if="depositHasPending"
                class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"
            >
                <div class="text-2xl flex-shrink-0">⏳</div>
                <div>
                <p class="text-sm font-bold text-blue-800">Pengajuan Sedang Diproses</p>
                <p class="text-xs text-blue-700 mt-0.5">
                    Setoran sebesar
                    <span class="font-bold">{{ depositPending?.total_amount_formatted }}</span>
                    sedang dalam proses verifikasi. Tunggu hingga selesai sebelum mengajukan lagi.
                </p>
                <p class="text-xs text-blue-400 mt-1">
                    Diajukan: {{ depositPending?.created_at ? formatDate(depositPending.created_at) : '-' }}
                </p>
                </div>
            </div>

          <!-- Empty -->
            <div v-else-if="!depositItems.length"
                class="bg-white rounded-xl shadow-sm p-8 text-center"
            >
                <div class="text-4xl mb-2">✅</div>
                <p class="text-sm font-semibold text-gray-700">Tidak ada tagihan</p>
                <p class="text-xs text-gray-400 mt-1">Semua tagihan sudah diselesaikan</p>
            </div>

          <template v-else>

            <!-- List Item -->
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
              <div class="px-4 pt-4 pb-2 flex items-center justify-between">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tagihan Tersedia
                </p>
                <button
                  class="text-xs font-medium"
                  :class="allDepositSelected ? 'text-red-500' : 'text-blue-500'"
                  @click="toggleSelectAll('deposit')"
                >
                  {{ allDepositSelected ? 'Batal Pilih' : 'Pilih Semua' }}
                </button>
              </div>

              <div class="divide-y divide-gray-50">
                <div
                  v-for="item in depositItems"
                  :key="item.id"
                  class="flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors cursor-pointer"
                  @click="toggleSelect(item.id, 'deposit')"
                >
                  <!-- Checkbox -->
                  <div
                    class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    :class="selectedDeposit.includes(item.id)
                      ? 'border-orange-500 bg-orange-500'
                      : 'border-gray-300'"
                  >
                    <svg v-if="selectedDeposit.includes(item.id)"
                      width="10" height="10" viewBox="0 0 24 24"
                      fill="none" stroke="white" stroke-width="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>

                  <!-- Icon -->
<!-- Foto kendaraan jika ada -->
<div
<div
  class="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100"
>
  <img
    v-if="item.display_image"
    :src="item.display_image"
    class="w-full h-full object-cover"
  />

  <div
    v-else
    class="w-full h-full flex items-center justify-center bg-green-100"
  >
    🚗
  </div>
</div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate">
                      {{ item.vehicle_name ?? '-' }}
                    </p>
                    <p class="text-xs text-gray-400 mt-0.5">
                      {{ item.license_plate ?? '-' }}
                      <template v-if="item.inspection_date">
                        • {{ formatDate(item.inspection_date) }}
                      </template>
                    </p>
                    <p class="text-xs text-orange-500 mt-0.5 font-medium">
                      {{ typeLabel(item.type) }}
                    </p>
                  </div>

                  <!-- Amount -->
                  <div class="text-right flex-shrink-0">
                    <p class="text-sm font-bold text-orange-600">
                      {{ item.amount_formatted }}
                    </p>
                    <span class="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                      pending
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rekening Platform -->
            <div class="bg-white rounded-xl shadow-sm p-4">

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-semibold text-gray-800">
                    Rekening Pembayaran
                  </p>

                  <p class="text-xs text-gray-400 mt-0.5">
                    Transfer tagihan ke rekening platform
                  </p>
                </div>

                <button
                  class="text-sm font-semibold text-blue-500"
                  @click="bankListOpen = true"
                >
                  Lihat Rekening
                </button>
              </div>

            </div>

            <!-- Total Selected + Upload Bukti -->
            <Transition name="slide-up">
              <div v-if="selectedDeposit.length" class="space-y-2">

                <div class="bg-white rounded-xl shadow-sm p-3.5 flex items-center justify-between">
                  <div>
                    <p class="text-xs text-gray-500">Total Dipilih</p>
                    <p class="text-base font-bold text-orange-600 mt-0.5">
                      {{ selectedDepositTotalFmt }}
                    </p>
                  </div>
                  <button
                    class="flex items-center gap-1.5 px-4 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl active:opacity-80 transition-opacity"
                    :disabled="submitting"
                    @click="openDepositSheet"
                  >
                    📤 Setor Sekarang
                  </button>
                </div>

              </div>
            </Transition>

          </template>
        </template>

      </template>
    </main>

    <!-- ═══ MODAL LIST BANK ═══ -->
    <Transition name="sheet-fade">
      <div
        v-if="bankListOpen"
        class="fixed inset-0 z-50 bg-black/50 flex items-end"
        @click.self="bankListOpen = false"
      >

        <div
          class="w-full bg-white rounded-t-3xl p-5 space-y-4 max-h-[80vh] overflow-y-auto"
          style="animation: sheetUp .28s cubic-bezier(.34,1.4,.64,1)"
        >

          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-gray-900">
              Rekening Pembayaran
            </h2>

            <button
              @click="bankListOpen = false"
              class="text-gray-400 text-lg"
            >
              ✕
            </button>
          </div>

          <div
            v-for="bank in companyBanks"
            :key="bank.id"
            class="border border-gray-100 rounded-2xl p-4"
          >

            <div class="flex items-start justify-between gap-3">

              <div class="flex gap-3">

              <div
                class="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 bg-white flex-shrink-0"
              >
                <img
                  :src="getBankLogo(bank.bank_name)"
                  :alt="bank.bank_name"
                  class="w-full h-full object-cover"
                />
              </div>

                <div>
                  <p class="text-sm font-bold text-gray-800">
                    {{ bank.bank_name }}
                  </p>

                  <p class="text-lg font-bold text-orange-600 mt-1 tracking-wide">
                    {{ bank.account_number }}
                  </p>

                  <p class="text-xs text-gray-500 mt-1">
                    a/n {{ bank.owner_name }}
                  </p>

                  <p
                    v-if="bank.label"
                    class="text-xs text-blue-500 mt-1"
                  >
                    {{ bank.label }}
                  </p>
                </div>

              </div>

              <button
                class="px-3 py-2 bg-blue-500 text-white text-xs font-semibold rounded-xl"
                @click="copyBankNumber(bank.account_number)"
              >
                Salin
              </button>

            </div>

          </div>

        </div>

      </div>
    </Transition>

    <!-- ═══ BOTTOM SHEET DEPOSIT ═══ -->
    <Transition name="sheet-fade">
      <div v-if="depositSheetOpen" class="fixed inset-0 z-50 bg-black/50 flex items-end"
        @click.self="depositSheetOpen = false"
      >
        <div class="w-full bg-white rounded-t-3xl p-5 space-y-4"
          style="animation: sheetUp .28s cubic-bezier(.34,1.4,.64,1)"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-gray-900">Konfirmasi Setor</h2>
            <button @click="depositSheetOpen = false" class="text-gray-400 text-lg">✕</button>
          </div>

          <!-- Total -->
          <div class="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <p class="text-xs text-orange-700">Total Disetor</p>
            <p class="text-2xl font-bold text-orange-600 mt-0.5">
              {{ selectedDepositTotalFmt }}
            </p>
          </div>

          <!-- Upload Bukti -->
          <div>
            <label class="text-sm font-semibold text-gray-600 block mb-2">
              Bukti Transfer <span class="text-red-500">*</span>
            </label>

            <!-- Preview -->
            <div v-if="proofPreview"
              class="relative mb-2 rounded-xl overflow-hidden border border-orange-200"
            >
              <img :src="proofPreview" class="w-full h-40 object-cover">
              <button
                class="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                @click="removeProof"
              >✕</button>
            </div>

            <label v-else
              class="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-orange-300 rounded-xl p-6 cursor-pointer bg-orange-50 active:bg-orange-100 transition-colors"
            >
              <span class="text-3xl">📷</span>
              <span class="text-sm font-medium text-orange-600">Upload Bukti Transfer</span>
              <span class="text-xs text-gray-400">JPG, PNG maks 2MB</span>
              <input type="file" accept="image/*" class="hidden" @change="onProofChange">
            </label>
          </div>

          <!-- Notes -->
          <div>
            <label class="text-sm font-semibold text-gray-600 block mb-2">Catatan (opsional)</label>
            <textarea
              v-model="depositNotes"
              rows="2"
              placeholder="Tambahkan catatan..."
              class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-blue-400"
            ></textarea>
          </div>

          <button
            class="w-full py-4 bg-orange-500 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
            :disabled="submitting || !proofFile"
            :class="{ 'opacity-50': submitting || !proofFile }"
            @click="handleDeposit"
          >
            <span v-if="!submitting">📤 Konfirmasi Setor</span>
            <span v-else class="flex items-center gap-2">
              <span class="btn-spinner btn-spinner--white"></span> Memproses...
            </span>
          </button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter }  from 'vue-router'
import {
  getFinanceData,
  requestWithdraw,
  requestDeposit,
} from '../../services/financeService'
import type { FinanceData, FinanceItem } from '../../types/finance'
import { getBankLogo } from '../../utils/bankLogo'

// ─── Route param untuk deep-link dari Home ───────────────────
const route     = useRoute()
const router    = useRouter()
const activeTab = ref<'withdraw' | 'deposit'>(
  (route.query.tab as 'withdraw' | 'deposit') ?? 'withdraw'
)


const tabs = [
  { key: 'withdraw', label: 'Saldo',   icon: '💰' },
  { key: 'deposit',  label: 'Tagihan', icon: '💳' },
] as const

// ─── State ───────────────────────────────────────────────────
const loading     = ref(true)
const submitting  = ref(false)
const financeData = ref<FinanceData | null>(null)

const selectedWithdraw = ref<number[]>([])
const selectedDeposit  = ref<number[]>([])

const depositSheetOpen = ref(false)
const proofFile        = ref<File | null>(null)
const proofPreview     = ref<string>('')
const depositNotes     = ref('')
const bankListOpen = ref(false)

// ─── Computed ────────────────────────────────────────────────
const withdrawItems = computed<FinanceItem[]>(
  () => financeData.value?.withdraw.items ?? []
)
const depositItems = computed<FinanceItem[]>(
  () => financeData.value?.deposit.items ?? []
)

const allWithdrawSelected = computed(
  () => withdrawItems.value.length > 0 &&
        selectedWithdraw.value.length === withdrawItems.value.length
)
const allDepositSelected = computed(
  () => depositItems.value.length > 0 &&
        selectedDeposit.value.length === depositItems.value.length
)

const selectedWithdrawTotal = computed(() =>
  withdrawItems.value
    .filter(i => selectedWithdraw.value.includes(i.id))
    .reduce((s, i) => s + i.amount, 0)
)
const selectedDepositTotal = computed(() =>
  depositItems.value
    .filter(i => selectedDeposit.value.includes(i.id))
    .reduce((s, i) => s + i.amount, 0)
)

const selectedWithdrawTotalFmt = computed(() =>
  'Rp' + selectedWithdrawTotal.value.toLocaleString('id-ID')
)
const selectedDepositTotalFmt = computed(() =>
  'Rp' + selectedDepositTotal.value.toLocaleString('id-ID')
)

const withdrawHasPending = computed(
  () => financeData.value?.withdraw.has_pending_payout ?? false
)
const depositHasPending = computed(
  () => financeData.value?.deposit.has_pending_payout ?? false
)
const withdrawPending = computed(
  () => financeData.value?.withdraw.pending_payout ?? null
)
const depositPending = computed(
  () => financeData.value?.deposit.pending_payout ?? null
)

const withdrawBank = computed(
  () => financeData.value?.withdraw.bank_account ?? null
)

const hasPrimaryBank = computed(
  () => financeData.value?.withdraw.has_primary_bank ?? false
)

const bankMessage = computed(
  () => financeData.value?.withdraw.bank_message ?? null
)

const companyBanks = computed(
  () => financeData.value?.deposit.company_banks ?? []
)

// ─── Fetch ───────────────────────────────────────────────────
async function fetchData() {
  loading.value = true
  try {
    const res = await getFinanceData()
    financeData.value = res.data?.data ?? null
  } catch (e) {
    console.error('Gagal memuat finance data:', e)
  } finally {
    loading.value = false
  }
}

// ─── Select helpers ──────────────────────────────────────────
function toggleSelect(id: number, tab: 'withdraw' | 'deposit') {
  const list = tab === 'withdraw' ? selectedWithdraw : selectedDeposit
  const idx  = list.value.indexOf(id)
  if (idx === -1) list.value.push(id)
  else            list.value.splice(idx, 1)
}

function toggleSelectAll(tab: 'withdraw' | 'deposit') {
  if (tab === 'withdraw') {
    selectedWithdraw.value = allWithdrawSelected.value
      ? []
      : withdrawItems.value.map(i => i.id)
  } else {
    selectedDeposit.value = allDepositSelected.value
      ? []
      : depositItems.value.map(i => i.id)
  }
}

// ─── Withdraw ────────────────────────────────────────────────
async function handleWithdraw() {
  if (!selectedWithdraw.value.length) return
  submitting.value = true
  try {
    await requestWithdraw({ transaction_ids: selectedWithdraw.value })
    // tidak perlu alert — fetchData langsung tampilkan status pending
    selectedWithdraw.value = []
    await fetchData()
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Terjadi kesalahan')
  } finally {
    submitting.value = false
  }
}

// ─── Deposit ─────────────────────────────────────────────────
function openDepositSheet() {
  depositSheetOpen.value = true
}

function onProofChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  proofFile.value    = file
  proofPreview.value = URL.createObjectURL(file)
}

async function copyBankNumber(number: string) {
  try {
    await navigator.clipboard.writeText(number)
    alert('Nomor rekening berhasil disalin')
  } catch (e) {
    alert('Gagal menyalin rekening')
  }
}

function removeProof() {
  proofFile.value    = null
  proofPreview.value = ''
}

async function handleDeposit() {
  if (!proofFile.value || !selectedDeposit.value.length) return
  submitting.value = true
  try {
    await requestDeposit({
      transaction_ids: selectedDeposit.value,
      proof_transfer:  proofFile.value,
      notes:           depositNotes.value || undefined,
    })
    // tidak perlu alert
    depositSheetOpen.value = false
    selectedDeposit.value  = []
    proofFile.value        = null
    proofPreview.value     = ''
    depositNotes.value     = ''
    await fetchData()
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Terjadi kesalahan')
  } finally {
    submitting.value = false
  }
}

// ─── Helpers ─────────────────────────────────────────────────
function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    platform_fee:        'Fee Platform',
    platform_settlement: 'Setoran ke Platform',
  }
  return map[type] ?? type
}

onMounted(fetchData)
</script>

<style scoped>
/* ── SKELETON ──────────────────────────────────── */
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
.sk-text-sm   { height: 10px; border-radius: 4px; }
.sk-text-base { height: 14px; border-radius: 4px; }
.sk-text-xl   { height: 24px; border-radius: 4px; }
.sk-badge     { height: 22px; border-radius: 20px; }
.sk-icon      { width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; }

/* ── SPINNER ───────────────────────────────────── */
.btn-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(0,0,0,.15);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin .65s linear infinite;
  display: inline-block;
}
.btn-spinner--white { border-color: rgba(255,255,255,.3); border-top-color: #fff; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── TRANSITIONS ───────────────────────────────── */
.slide-up-enter-active { animation: slideUp .25s ease; }
.slide-up-leave-active { animation: slideUp .2s ease reverse; }
@keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }

.sheet-fade-enter-active { animation: fadeIn .2s ease; }
.sheet-fade-leave-active { animation: fadeIn .15s ease reverse; }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }

@keyframes sheetUp { from{transform:translateY(100%)} to{transform:none} }
</style>