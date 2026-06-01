<template>
  <div class="fixed inset-0 bg-gray-100 flex flex-col">

    <!-- ═══════════════════════════════════════════════════════
         HEADER — sticky, tidak ikut scroll
    ═══════════════════════════════════════════════════════ -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 pt-3 pb-4 shadow-lg flex-shrink-0 z-10">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button
            @click="goToDetail"
            class="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95"
          >
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-base font-semibold">Kirim Whatsapp</h1>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         SCROLL AREA
    ═══════════════════════════════════════════════════════ -->
    <main class="flex-1 overflow-y-auto pb-28 px-4 pt-4 space-y-4">

      <!-- ── LOADING SKELETON ── -->
      <template v-if="loading">

        <!-- Hero skeleton -->
        <div class="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 p-5 shadow-lg">
          <div class="sk sk-text-sm w-24 mb-4 opacity-30"></div>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-white/15 rounded-2xl p-4">
              <div class="sk sk-text-xs w-20 mb-2 opacity-30"></div>
              <div class="sk sk-text-base w-28 opacity-30"></div>
              <div class="sk sk-text-xs w-16 mt-2 opacity-30"></div>
            </div>
            <div class="bg-white/15 rounded-2xl p-4">
              <div class="sk sk-text-xs w-20 mb-2 opacity-30"></div>
              <div class="sk sk-text-base w-28 opacity-30"></div>
              <div class="sk sk-text-xs w-16 mt-2 opacity-30"></div>
            </div>
          </div>
        </div>

        <!-- Info skeleton -->
        <div class="bg-white rounded-3xl p-5 shadow-sm space-y-3">
          <div class="sk sk-text-xs w-24"></div>
          <div class="sk sk-text-base w-48"></div>
          <div class="sk sk-text-sm w-32"></div>
        </div>

        <!-- Message skeleton -->
        <div class="bg-white rounded-3xl p-5 shadow-sm space-y-3">
          <div class="flex items-center gap-2 mb-2">
            <div class="sk w-6 h-6 rounded-full"></div>
            <div class="sk sk-text-base w-32"></div>
          </div>
          <div class="bg-gray-100 rounded-3xl rounded-tl-md p-4 space-y-2">
            <div class="sk sk-text-sm w-full"></div>
            <div class="sk sk-text-sm w-4/5"></div>
            <div class="sk sk-text-sm w-3/5"></div>
            <div class="sk sk-text-sm w-full"></div>
            <div class="sk sk-text-sm w-2/3"></div>
          </div>
        </div>

      </template>

      <!-- ── BELUM APPROVED ── -->
      <template v-else-if="!isApproved">
        <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div class="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6 text-4xl">
            ⏳
          </div>
          <h2 class="text-xl font-bold text-gray-800 mb-2">Menunggu Persetujuan</h2>
          <p class="text-sm text-gray-500 max-w-xs mx-auto">
            Laporan inspeksi ini belum disetujui. Silakan lakukan persetujuan terlebih dahulu untuk mengirim pesan WhatsApp.
          </p>
          <button
            @click="goToDetail"
            class="mt-8 px-6 py-2.5 bg-blue-500 text-white rounded-xl font-medium shadow-md active:scale-95 transition-all"
          >
            Kembali ke Detail
          </button>
        </div>
      </template>

      <!-- ── CONTENT (SUDAH APPROVED) ── -->
      <template v-else-if="data">

        <!-- Hero Card: Customer + Vehicle -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 p-5 shadow-lg">
          <!-- Decorative circles -->
          <div class="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none"></div>
          <div class="absolute bottom-0 right-4 w-20 h-20 bg-white/10 rounded-full pointer-events-none"></div>

          <p class="text-blue-100 text-xs mb-4 relative z-10">Ringkasan Pengiriman</p>

          <div class="grid grid-cols-2 gap-3 relative z-10">

            <!-- Customer -->
            <div class="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p class="text-blue-200 text-[10px] uppercase tracking-wide mb-1">Pelanggan</p>
              <p class="text-white font-bold text-sm leading-tight truncate">
                {{ data.customer.name }}
              </p>
              <p class="text-blue-200 text-xs mt-1 truncate">
                {{ data.customer.phone }}
              </p>
            </div>

            <!-- Vehicle -->
            <div class="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p class="text-blue-200 text-[10px] uppercase tracking-wide mb-1">Kendaraan</p>
              <p class="text-white font-bold text-sm leading-tight">
                {{ data.vehicle.license_plate }}
              </p>
            </div>

          </div>
        </div>

        <!-- Info Banner -->
        <div class="rounded-3xl p-4 flex items-start gap-3 border bg-blue-50 border-blue-100">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 text-base bg-blue-100">
            ℹ️
          </div>
          <div>
            <p class="text-sm font-semibold text-blue-700">Periksa pesan sebelum dikirim</p>
            <p class="text-xs leading-relaxed mt-1 text-blue-500">
              Kirim hasil laporan inspeksi kepada pelanggan melalui WhatsApp.
              Pesan masih bisa diedit di WhatsApp sebelum dikirim.
            </p>
          </div>
        </div>

        <!-- Report Link -->
        <div v-if="data.report_link" class="bg-white rounded-3xl shadow-sm p-5">
          <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Link Report
          </p>
          <div class="bg-gray-50 border border-gray-100 rounded-2xl p-3 flex items-center gap-3">
            <div class="flex-1 min-w-0">
              <p class="text-sm text-blue-500 truncate">{{ data.report_link }}</p>
            </div>
            <button
              class="flex-shrink-0 px-3 py-1.5 bg-blue-100 text-blue-600 text-xs font-semibold rounded-xl active:bg-blue-200 transition-colors"
              @click="copyLink"
            >
              {{ copied ? '✓ Disalin' : 'Salin' }}
            </button>
          </div>
        </div>

        <!-- Preview Pesan WhatsApp -->
        <div class="bg-white rounded-3xl shadow-sm p-5">

          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-base">
              💬
            </div>
            <div>
              <h2 class="text-sm font-bold text-gray-800">Preview Pesan</h2>
              <p class="text-[10px] text-gray-400">Tampilan di WhatsApp</p>
            </div>
          </div>

          <!-- WhatsApp bubble -->
          <div class="bg-[#e9fbe5] rounded-3xl rounded-tl-sm p-4 relative shadow-sm">
            <!-- WhatsApp-style notch -->
            <div class="absolute top-0 -left-1.5 w-3 h-3 bg-[#e9fbe5]"
              style="clip-path: polygon(100% 0, 100% 100%, 0 0)"></div>
            <p class="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
              {{ data.message }}
            </p>
            <!-- Time stamp mock -->
            <div class="flex justify-end mt-2">
              <span class="text-[10px] text-gray-400 flex items-center gap-1">
                Sekarang
                <svg class="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
                </svg>
              </span>
            </div>
          </div>

          <p class="text-[10px] text-gray-400 mt-3 text-center">
            Pesan masih dapat diedit di WhatsApp sebelum dikirim
          </p>

        </div>

      </template>

    </main>

    <!-- ═══════════════════════════════════════════════════════
         FLOATING WHATSAPP BUTTON (hanya tampil jika approved)
    ═══════════════════════════════════════════════════════ -->
    <div
      v-if="isApproved && data && !loading"
      class="fixed bottom-6 left-0 right-0 flex justify-center px-6 z-20 pointer-events-none"
    >
      <button
        @click="openWhatsApp"
        class="pointer-events-auto flex items-center gap-3 px-8 py-4 rounded-full text-white font-bold text-base shadow-2xl active:scale-95 transition-all duration-150"
        style="background: linear-gradient(135deg, #25D366, #128C7E); box-shadow: 0 8px 32px rgba(37,211,102,0.45);"
      >
        <!-- WhatsApp SVG icon -->
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Buka WhatsApp
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSendWhatsAppData } from '../../services/inspectionReportService'
import { type SendWhatsAppResponse } from '../../types/inspectionReport'

const route  = useRoute()
const router = useRouter()

const loading = ref(true)
const data    = ref<SendWhatsAppResponse['data'] | null>(null)
const copied  = ref(false)

// Hanya true jika status === 'approved'
const isApproved = computed(() => data.value?.status === 'approved')

// Ambil ID dari route params
const inspectionId = computed(() => Number(route.params.id))

// Fungsi untuk kembali ke halaman detail dengan ID yang benar
function goToDetail() {
  router.push(`/jobs/${inspectionId.value}`)
}

async function fetchData() {
  try {
    loading.value = true
    const response = await getSendWhatsAppData(inspectionId.value)
    data.value = response.data.data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function openWhatsApp() {
  if (!data.value?.whatsapp_url) return
  window.open(data.value.whatsapp_url, '_blank')
}

async function copyLink() {
  if (!data.value?.report_link) return
  try {
    await navigator.clipboard.writeText(data.value.report_link)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    //
  }
}

onMounted(fetchData)
</script>

<style scoped>
/* ── SKELETON ─────────────────────────────── */
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
.sk-text-xs   { height: 8px;  border-radius: 4px; }
.sk-text-sm   { height: 10px; border-radius: 4px; }
.sk-text-base { height: 14px; border-radius: 4px; }
</style>