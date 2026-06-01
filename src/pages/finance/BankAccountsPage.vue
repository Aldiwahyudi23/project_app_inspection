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
        <h1 class="text-sm font-semibold">Akun Bank</h1>
      </div>
    </div>

    <main class="flex-1 overflow-y-auto pb-4 px-3 pt-3 space-y-3">

      <!-- ═══ LOADING SKELETON ═══ -->
      <template v-if="loading && !bankAccounts.length">

        <div class="bg-white rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="sk sk-text-lg w-36 mb-2"></div>
              <div class="sk sk-text-sm w-48"></div>
            </div>
            <div class="sk w-20 h-9 rounded-xl"></div>
          </div>
        </div>

        <div v-for="i in 2" :key="i" class="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <div class="flex items-start justify-between">
            <div class="space-y-2 flex-1">
              <div class="sk sk-text-base w-32"></div>
              <div class="sk sk-text-sm w-24"></div>
              <div class="sk sk-text-lg w-40"></div>
              <div class="sk sk-text-sm w-20"></div>
            </div>
            <div class="sk w-12 h-6 rounded-lg"></div>
          </div>
          <div class="border-t pt-3 flex items-center justify-between">
            <div class="sk w-24 h-7 rounded-full"></div>
            <div class="sk w-24 h-7 rounded-full"></div>
          </div>
        </div>

      </template>

      <template v-else>

        <!-- Header Card -->
        <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4 shadow-lg">
          <div class="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div class="absolute bottom-0 right-0 w-20 h-20 bg-white/10 rounded-full"></div>
          <div class="relative z-10 flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-xs">Kelola rekening pencairan dana</p>
              <h1 class="text-lg font-bold text-white mt-0.5">Rekening Bank</h1>
              <p class="text-blue-100 text-xs mt-1">
                {{ bankAccounts.length }} rekening terdaftar
              </p>
            </div>
            <button
              v-if="bankAccounts.length"
              @click="showModal = true"
              class="flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl active:opacity-80 transition-opacity"
            >
              <span class="text-base leading-none">＋</span>
              Tambah
            </button>
          </div>
        </div>

        <!-- ═══ EMPTY STATE ═══ -->
        <div v-if="!bankAccounts.length" class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="p-5 border-b border-gray-50">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl mb-3">
              🏦
            </div>
            <h2 class="font-bold text-gray-800 text-base">Tambah Rekening Pertama</h2>
            <p class="text-sm text-gray-400 mt-1">
              Tambahkan rekening untuk menerima payout inspector
            </p>
          </div>
          <div class="p-4">
            <BankAccountForm v-model:loading="formLoading" @submit="submit" />
          </div>
        </div>

        <!-- ═══ LIST REKENING ═══ -->
        <div v-else class="space-y-3">
          <div
            v-for="item in bankAccounts"
            :key="item.id"
            class="bg-white rounded-xl shadow-sm overflow-hidden"
            :class="{ 'opacity-60': processingId === item.id }"
          >
            <!-- Top -->
            <div class="p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3 flex-1 min-w-0">

                  <!-- Icon -->
                  <div
                    class="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 bg-white flex-shrink-0"
                  >
                    <img
                      :src="getBankLogo(item.bank_name)"
                      :alt="item.bank_name"
                      class="w-full h-full object-cover"
                    />
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h2 class="font-bold text-gray-800 text-sm">
                        {{ item.label || item.bank_name }}
                      </h2>
                      <span
                        v-if="item.is_primary"
                        class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold"
                      >
                        Utama
                      </span>
                      <span
                        v-if="!item.is_active"
                        class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                      >
                        Nonaktif
                      </span>
                    </div>
                    <p class="text-xs text-gray-400 mt-0.5">{{ item.owner_name }}</p>
                    <p class="text-base font-bold text-gray-800 mt-1 tracking-wide">
                      {{ item.account_number }}
                    </p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ item.bank_name }}</p>
                  </div>
                </div>

                <!-- Hapus -->
                <button
                  @click="remove(item.id)"
                  :disabled="processingId === item.id"
                  class="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 active:bg-red-100 transition-colors disabled:opacity-40"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Bottom Toggles -->
            <div class="border-t border-gray-50 px-4 py-3 flex items-center justify-between bg-gray-50/50">

              <!-- Toggle Aktif -->
              <div class="flex items-center gap-2.5">
                <span class="text-xs font-medium text-gray-500">Aktif</span>
                <button
                  @click="toggleActive(item.id)"
                  :disabled="processingId === item.id"
                  class="relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50"
                  :class="item.is_active ? 'bg-green-500' : 'bg-gray-300'"
                >
                  <!-- Spinner saat loading -->
                  <span
                    v-if="processingId === item.id && processingAction === 'active'"
                    class="absolute inset-0 flex items-center justify-center"
                  >
                    <span class="toggle-spinner"></span>
                  </span>
                  <span
                    v-else
                    class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                    :class="item.is_active ? 'translate-x-5' : 'translate-x-0'"
                  ></span>
                </button>
              </div>

              <!-- Toggle Utama -->
              <div class="flex items-center gap-2.5">
                <span class="text-xs font-medium text-gray-500">Utama</span>
                <button
                  @click="togglePrimary(item.id)"
                  :disabled="processingId === item.id"
                  class="relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50"
                  :class="item.is_primary ? 'bg-blue-500' : 'bg-gray-300'"
                >
                  <span
                    v-if="processingId === item.id && processingAction === 'primary'"
                    class="absolute inset-0 flex items-center justify-center"
                  >
                    <span class="toggle-spinner"></span>
                  </span>
                  <span
                    v-else
                    class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                    :class="item.is_primary ? 'translate-x-5' : 'translate-x-0'"
                  ></span>
                </button>
              </div>

            </div>
          </div>
        </div>

      </template>
    </main>

    <!-- ═══ BOTTOM SHEET MODAL TAMBAH ═══ -->
    <Transition name="sheet-fade">
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/50 z-50 flex items-end"
        @click.self="showModal = false"
      >
        <div
          class="bg-white w-full rounded-t-3xl p-5 max-h-[90vh] overflow-auto"
          style="animation: sheetUp .28s cubic-bezier(.34,1.4,.64,1)"
        >
          <div class="flex items-center justify-between mb-5">
            <div>
              <h2 class="font-bold text-gray-900 text-base">Tambah Rekening</h2>
              <p class="text-xs text-gray-400 mt-0.5">Isi data rekening bank kamu</p>
            </div>
            <button
              @click="showModal = false"
              class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
            >✕</button>
          </div>

          <BankAccountForm v-model:loading="formLoading" @submit="submit" />
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BankAccountForm from '../../components/bank-account/BankAccountForm.vue'
import type { BankAccount, BankAccountPayload } from '../../types/bank-account'
import { getBankLogo } from '../../utils/bankLogo'
import {
  deleteBankAccount,
  getBankAccounts,
  setPrimaryBankAccount,
  storeBankAccount,
  toggleActiveBankAccount,
} from '../../services/bankAccountService'

import { useRouter } from 'vue-router'

const router = useRouter()

// ─── State ───────────────────────────────────────────────
const loading      = ref(false)
const formLoading  = ref(false)
const showModal    = ref(false)
const bankAccounts = ref<BankAccount[]>([])

// tracking item yang sedang diproses
const processingId     = ref<number | null>(null)
const processingAction = ref<'active' | 'primary' | 'delete' | null>(null)

// ─── Fetch ───────────────────────────────────────────────
async function fetchData() {
  loading.value = true
  try {
    const res      = await getBankAccounts()
    bankAccounts.value = res.data.data
  } finally {
    loading.value = false
  }
}

// ─── Submit tambah ───────────────────────────────────────
async function submit(payload: BankAccountPayload) {
  formLoading.value = true
  try {
    await storeBankAccount(payload)
    showModal.value = false
    await fetchData()
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Gagal menyimpan rekening')
  } finally {
    formLoading.value = false
  }
}

// ─── Toggle Primary ──────────────────────────────────────
async function togglePrimary(id: number) {
  processingId.value     = id
  processingAction.value = 'primary'
  try {
    await setPrimaryBankAccount(id)
    await fetchData()
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Gagal mengubah rekening utama')
  } finally {
    processingId.value     = null
    processingAction.value = null
  }
}

// ─── Toggle Active ───────────────────────────────────────
async function toggleActive(id: number) {
  processingId.value     = id
  processingAction.value = 'active'
  try {
    await toggleActiveBankAccount(id)
    await fetchData()
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Gagal mengubah status rekening')
  } finally {
    processingId.value     = null
    processingAction.value = null
  }
}

// ─── Delete ──────────────────────────────────────────────
async function remove(id: number) {
  if (!confirm('Hapus rekening ini?')) return
  processingId.value     = id
  processingAction.value = 'delete'
  try {
    await deleteBankAccount(id)
    await fetchData()
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Gagal menghapus rekening')
  } finally {
    processingId.value     = null
    processingAction.value = null
  }
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
.sk-text-sm   { height: 10px; }
.sk-text-base { height: 14px; }
.sk-text-lg   { height: 18px; }

/* ── TOGGLE SPINNER ────────────────────────────── */
.toggle-spinner {
  display: inline-block;
  width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── SHEET TRANSITION ──────────────────────────── */
.sheet-fade-enter-active { animation: fadeIn .2s ease; }
.sheet-fade-leave-active { animation: fadeIn .15s ease reverse; }
@keyframes fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes sheetUp { from{transform:translateY(100%)} to{transform:none} }
</style>