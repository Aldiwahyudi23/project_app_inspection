<!-- components/tugas/TabInformasi.vue -->
<script setup lang="ts">
import type { JobDetail } from '../../types/job'

const props = defineProps<{
  inspection: JobDetail
  jobId: string
}>()

const emit = defineEmits<{
  refreshData: []
}>()

const openWhatsApp = (phone: string, name: string = '') => {
  if (!phone) return
  const cleanPhone = phone.replace(/\D/g, '')
  const message = `Halo ${name}, saya dari tim inspeksi terkait jadwal inspeksi kendaraan.`
  const encodedMessage = encodeURIComponent(message)
  window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank')
}

const openGoogleMaps = (link_maps: string) => {
  if (!link_maps) return
  window.open(link_maps, '_blank')
}

const showSubmitted = computed(() => {
  return props.inspection.inspector.name !== props.inspection.submitted_by.name
})

import { computed, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { getLinkPreview } from '../../services/inspectionReportService'
import api from '../../services/api';

const showDocumentActions = computed(() => {
  const validStatus = ['approved', 'completed'].includes(props.inspection.status)
  const hasDocument = props.inspection.document?.has_document === true
  return validStatus && hasDocument
})

const downloadingPDF = ref(false)
const previewingPDF = ref(false)
const codeCopied = ref(false)

const handleDownloadPDF = () => {
  if (downloadingPDF.value) return

  downloadingPDF.value = true

  const baseURL = api.defaults.baseURL

  window.open(
    `${baseURL}/app-inspection/report/${props.jobId}/document/download-pdf`,
    '_blank'
  )

  setTimeout(() => {
    downloadingPDF.value = false
  }, 2500)
}

const handlePreviewPDF = async () => {
  previewingPDF.value = true
  try {
    const response = await getLinkPreview(Number(props.jobId))
    const url = response.data?.data?.url

    if (!url) throw new Error('URL tidak ditemukan')

    if (Capacitor.isNativePlatform()) {
      // Mobile — buka di browser in-app atau pilih app
      await Browser.open({ url })
    } else {
      // Browser — buka tab baru, PDF preview otomatis
      window.open(url, '_blank')
    }

  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Gagal membuka PDF')
  } finally {
    previewingPDF.value = false
  }
}

const copyCode = async () => {
  const code = props.inspection.document?.inspection_code
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    codeCopied.value = true
    setTimeout(() => { codeCopied.value = false }, 2000)
  } catch {
    const el = document.createElement('textarea')
    el.value = code
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    codeCopied.value = true
    setTimeout(() => { codeCopied.value = false }, 2000)
  }
}

const reportType = computed(() => {
  return props.inspection
    ?.template_report
    ?.selected
    ?.type ?? 'pdf'
})

const hasDocument = computed(() => {
  return props.inspection
    ?.document
    ?.has_document === true
})

/*
|--------------------------------------------------------------------------
| Show Button
|--------------------------------------------------------------------------
|
| PDF  -> wajib ada document
| MESSAGE -> tidak perlu document
|
*/
const showSendWhatsAppButton = computed(() => {

  // status harus approved
  if (props.inspection.status !== 'approved') {
    return false
  }

  // TYPE PDF
  if (reportType.value === 'pdf') {
    return hasDocument.value
  }

  // TYPE MESSAGE
  if (reportType.value === 'message') {
    return true
  }

  return false
})

/*
|--------------------------------------------------------------------------
| Warning PDF Missing
|--------------------------------------------------------------------------
*/
// const showPdfMissingWarning = computed(() => {

//   return (
//     props.inspection.status === 'approved' &&
//     reportType.value === 'pdf' &&
//     !hasDocument.value
//   )
// })

/*
|--------------------------------------------------------------------------
| Button Label
|--------------------------------------------------------------------------
*/
const sendWhatsAppLabel = computed(() => {

  if (reportType.value === 'pdf') {
    return 'Kirim File Report Hasil Inspeksi'
  }

  return 'Kirim Laporan Inspeksi via Chat WhatsApp'
})

const goToSendWhatsApp = () => {
  window.location.href = `/send-whatsapp/${props.jobId}`
}

</script>

<template>
  <div class="space-y-4">
    <!-- Customer & Seller Info -->
    <div class="grid grid-cols-2 gap-3">
      <!-- Customer Info -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 class="text-xs font-semibold text-gray-400 mb-3 flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          PELANGGAN
        </h3>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-800">{{ inspection.customer.name }}</p>
          </div>
          <button
            v-if="inspection.customer.phone"
            @click="openWhatsApp(inspection.customer.phone, inspection.customer.name)"
            class="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title="Hubungi via WhatsApp"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.121 1.522 5.863L.044 23.478a.5.5 0 0 0 .615.615l5.615-1.478A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.838 0-3.588-.498-5.1-1.376l-.367-.22-3.63.956.97-3.548-.24-.382A9.94 9.94 0 0 1 2 12c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Seller Info -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 class="text-xs font-semibold text-gray-400 mb-3 flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          PENJUAL
        </h3>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-800">{{ inspection.seller.name || '-' }}</p>
          </div>
          <button
            v-if="inspection.seller.phone"
            @click="openWhatsApp(inspection.seller.phone, inspection.seller.name)"
            class="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title="Hubungi via WhatsApp"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.121 1.522 5.863L.044 23.478a.5.5 0 0 0 .615.615l5.615-1.478A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.838 0-3.588-.498-5.1-1.376l-.367-.22-3.63.956.97-3.548-.24-.382A9.94 9.94 0 0 1 2 12c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Location Info -->
    <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 class="text-xs font-semibold text-gray-400 mb-3 flex items-center">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        LOKASI INSPEKSI
      </h3>
      <div class="space-y-3">
        <div>
          <p class="font-medium text-gray-800">{{ inspection.address.area || 'Alamat tidak tersedia' }}</p>
          <p class="text-sm text-gray-600 mt-1">{{ inspection.address.name }}</p>
        </div>
        <button
          v-if="inspection.address.link_maps"
          @click="openGoogleMaps(inspection.address.link_maps)"
          class="inline-flex items-center text-xs text-blue-500 hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-lg"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Buka Google Maps
        </button>
        <p v-else class="text-xs text-gray-500">Tidak ada link Maps</p>
      </div>
    </div>

    <!-- Submitted By -->
    <div v-if="showSubmitted" class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 class="text-xs font-semibold text-gray-400 mb-3 flex items-center">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        PENGAJU
      </h3>
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium text-gray-800">{{ inspection.submitted_by.name }}</p>
          <p v-if="inspection.submitted_by.phone" class="text-xs text-gray-500 mt-1">{{ inspection.submitted_by.phone }}</p>
        </div>
        <button
          v-if="inspection.submitted_by.phone"
          @click="openWhatsApp(inspection.submitted_by.phone, inspection.submitted_by.name)"
          class="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
          title="Hubungi via WhatsApp"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.121 1.522 5.863L.044 23.478a.5.5 0 0 0 .615.615l5.615-1.478A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.838 0-3.588-.498-5.1-1.376l-.367-.22-3.63.956.97-3.548-.24-.382A9.94 9.94 0 0 1 2 12c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Dokumen Laporan -->
    <div v-if="showDocumentActions" class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 class="text-xs font-semibold text-gray-400 mb-3 flex items-center">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
               a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        DOKUMEN LAPORAN
      </h3>

      <!-- Inspection Code -->
      <div class="mb-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <p class="text-xs text-blue-500 mb-1">Kode Inspeksi</p>
        <div class="flex items-center justify-between gap-2">
          <span class="font-mono font-bold text-blue-700 tracking-widest text-sm">
            {{ inspection.document.inspection_code }}
          </span>
          <button
            @click="copyCode"
            class="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 bg-white border border-blue-200 px-2 py-1 rounded-lg transition-colors"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2
                   m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            {{ codeCopied ? 'Tersalin!' : 'Salin' }}
          </button>
        </div>
        <p class="text-xs text-blue-400 mt-2 leading-relaxed">
          Gunakan kode ini untuk mengakses laporan inspeksi.
        </p>
      </div>

      <!-- Tombol Preview & Download -->
      <div class="flex gap-3">
        <button
          @click="handlePreviewPDF"
          :disabled="previewingPDF"
          class="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl font-medium text-sm transition-colors hover:bg-blue-100 active:scale-95 disabled:opacity-50"
        >
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          <span>{{ previewingPDF ? 'Membuka...' : 'Review PDF' }}</span>
        </button>

        <button
          @click="handleDownloadPDF"
          :disabled="downloadingPDF"
          class="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-green-50 border border-green-200 text-green-600 rounded-xl font-medium text-sm transition-colors hover:bg-green-100 active:scale-95 disabled:opacity-50"
        >
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          <span>{{ downloadingPDF ? 'Mengunduh...' : 'Download PDF' }}</span>
        </button>
      </div>
    </div>

          <!-- Tombol Kirim WhatsApp -->
        <button
          v-if="showSendWhatsAppButton"
          @click="goToSendWhatsApp"
          class="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 bg-green-500 text-white rounded-xl font-medium text-sm transition-all hover:bg-green-600 active:scale-95"
        >
          <svg
            class="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.121 1.522 5.863L.044 23.478a.5.5 0 0 0 .615.615l5.615-1.478A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.838 0-3.588-.498-5.1-1.376l-.367-.22-3.63.956.97-3.548-.24-.382A9.94 9.94 0 0 1 2 12c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>

          <span>
            {{ sendWhatsAppLabel }}
          </span>
        </button>
  </div>
</template>