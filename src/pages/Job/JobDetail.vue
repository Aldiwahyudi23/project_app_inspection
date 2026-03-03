<!-- views/tugas/[id].vue atau views/TugasDetail.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import jobService from '../../services/jobService'
import type { JobDetail, NextJobStatus } from '../../types/job'

const route = useRoute()
const router = useRouter()
const jobId = route.params.id as string

// Tipe untuk available next statuses sesuai dengan response API
interface AvailableNextStatuses {
  cancel_actions: NextJobStatus[]
  next_step_actions: NextJobStatus[]
}

const inspection = ref<JobDetail | null>(null)
const availableNextStatuses = ref<AvailableNextStatuses>({
  cancel_actions: [],
  next_step_actions: []
})
const loading = ref(true)
const error = ref('')
const activeTab = ref<'informasi' | 'spesifikasi'>('informasi')

// State untuk modal konfirmasi
const showConfirmModal = ref(false)
const confirmTitle = ref('')
const confirmNote = ref('')
const confirmAction = ref<{type: string, status: NextJobStatus, label: string} | null>(null)
const processingAction = ref(false)

// State untuk modal multiple actions
const showActionModal = ref(false)
const modalTitle = ref('')
const modalActions = ref<Array<{type: string, label: string, status: NextJobStatus}>>([])

// Fungsi untuk mendapatkan label status berdasarkan value
const getStatusLabel = (status: NextJobStatus): string => {
  const labels: Record<NextJobStatus, string> = {
    'accepted': 'Terima',
    'on_the_way': 'Berangkat',
    'arrived': 'Tiba di Lokasi',
    'in_progress': 'Mulai Inspeksi',
    'completed': 'Selesai',
    'cancelled': 'Batalkan',
    'rejected': 'Tolak',
    'pending': 'Tunda',
    'paused': 'Jeda',
    'under_review': 'Tinjau',
    'revision': 'Revisi',
    'approved': 'Setujui',
    'draft': 'Draft',
    'process': 'Proses'
  }
  return labels[status] || status
}

// Fungsi untuk mendapatkan warna tombol berdasarkan status
const getButtonColorClass = (status: NextJobStatus, isLeftButton: boolean = false): string => {
  if (isLeftButton) {
    switch (status) {
      case 'cancelled': return 'border-red-200 text-red-600 hover:bg-red-50'
      case 'rejected': return 'border-orange-200 text-orange-600 hover:bg-orange-50'
      case 'pending': return 'border-yellow-200 text-yellow-600 hover:bg-yellow-50'
      default: return 'border-gray-200 text-gray-600 hover:bg-gray-50'
    }
  } else {
    switch (status) {
      case 'accepted': return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
      case 'on_the_way': return 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
      case 'arrived': return 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
      case 'in_progress': return 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
      case 'completed': return 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
      case 'approved': return 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
      case 'revision': return 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700'
      case 'under_review': return 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700'
      case 'cancelled': return 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600'
      case 'rejected': return 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
      default: return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
    }
  }
}

// Fungsi untuk mendapatkan warna badge status
const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    'draft': 'bg-gray-100 text-gray-600',
    'accepted': 'bg-blue-100 text-blue-600',
    'on_the_way': 'bg-yellow-100 text-yellow-600',
    'arrived': 'bg-green-100 text-green-600',
    'in_progress': 'bg-purple-100 text-purple-600',
    'pending': 'bg-orange-100 text-orange-600',
    'paused': 'bg-gray-100 text-gray-600',
    'under_review': 'bg-indigo-100 text-indigo-600',
    'revision': 'bg-pink-100 text-pink-600',
    'completed': 'bg-green-100 text-green-600',
    'rejected': 'bg-red-100 text-red-600',
    'approved': 'bg-blue-100 text-blue-600',
    'cancelled': 'bg-gray-100 text-gray-600'
  }
  return classes[status] || 'bg-gray-100 text-gray-600'
}

const fetchJobDetail = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await jobService.getJobDetail(Number(jobId))
    inspection.value = response.data
    
    // Set available next statuses dari response
    if (response.available_next_statuses) {
      availableNextStatuses.value = response.available_next_statuses
    }
  } catch (err: any) {
    console.error('Failed to fetch job detail:', err)
    error.value = err.response?.data?.message || 'Gagal memuat detail tugas'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

// Handler untuk tombol kiri (cancel_actions)
const handleLeftAction = () => {
  const cancelActions = availableNextStatuses.value.cancel_actions
  
  if (cancelActions.length === 0) return
  
  if (cancelActions.length === 1) {
    // Jika hanya 1 action, langsung buka modal konfirmasi
    const status = cancelActions[0]
    const label = getStatusLabel(status)
    
    confirmTitle.value = `Konfirmasi ${label}`
    confirmAction.value = {
      type: status === 'cancelled' ? 'cancel' : 
            status === 'rejected' ? 'reject' : 'pending',
      status: status,
      label: label
    }
    confirmNote.value = ''
    showConfirmModal.value = true
  } else {
    // Jika multiple actions, tampilkan modal pilihan
    modalTitle.value = 'Pilih Tindakan'
    modalActions.value = cancelActions.map(status => ({
      type: status === 'cancelled' ? 'cancel' : 
            status === 'rejected' ? 'reject' : 'pending',
      label: getStatusLabel(status),
      status: status
    }))
    showActionModal.value = true
  }
}

// Handler untuk memilih action dari modal multiple actions
const selectAction = (action: {type: string, label: string, status: NextJobStatus}) => {
  showActionModal.value = false
  confirmTitle.value = `Konfirmasi ${action.label}`
  confirmAction.value = action
  confirmNote.value = ''
  showConfirmModal.value = true
}

// Handler untuk tombol kanan (next_step_actions)
const handleMainAction = async () => {
  if (!inspection.value) return
  
  const currentStatus = inspection.value.status
  const nextStepActions = availableNextStatuses.value.next_step_actions
  
  // CEK STATUS FINAL: approved, completed, under_review, rejected, cancelled
  const finalStatuses = ['approved', 'completed', 'under_review', 'rejected', 'cancelled']
  
  if (finalStatuses.includes(currentStatus)) {
    // Jika status final, langsung ke halaman hasil inspeksi
    router.push(`/inspection-result/${jobId}`)
    return
  }
  
  // Jika tidak ada next step actions, return
  if (nextStepActions.length === 0) return
  
  // Ambil action pertama (biasanya hanya satu)
  const nextStatus = nextStepActions[0]
  
  // Handle khusus untuk status yang memerlukan navigasi
  if (nextStatus === 'in_progress') {
    router.push(`/form-inspection/${jobId}`)
    return
  }
  
  // Untuk status lainnya, langsung update tanpa notes
  processingAction.value = true
  
  try {
    await jobService.patchJobStatus(
      inspection.value.id,
      nextStatus
    )
    
    // REFRESH DATA - fetch ulang detail terbaru
    await fetchJobDetail()
    
    // TIDAK ADA ALERT SUKSES - hanya update tampilan
    
  } catch (error: any) {
    console.error('Failed to update status:', error)
    const errorMsg = error.response?.data?.message || 'Gagal mengupdate status'
    alert(errorMsg) // Alert hanya untuk error
  } finally {
    processingAction.value = false
  }
}

// Handler untuk konfirmasi aksi (cancel actions)
const confirmActionHandler = async () => {
  if (!confirmAction.value || !inspection.value) return
  
  if (!confirmNote.value.trim()) {
    alert('Catatan harus diisi')
    return
  }
  
  processingAction.value = true
  
  try {
    await jobService.patchJobStatus(
      inspection.value.id,
      confirmAction.value.status,
      confirmNote.value
    )
    
    // REFRESH DATA - fetch ulang detail terbaru
    await fetchJobDetail()
    
    // Tutup modal setelah sukses
    showConfirmModal.value = false
    confirmNote.value = ''
    confirmAction.value = null
    
    // TIDAK ADA ALERT SUKSES - hanya update tampilan
    
  } catch (error: any) {
    console.error('Failed to update status:', error)
    const errorMsg = error.response?.data?.message || 'Gagal mengupdate status'
    alert(errorMsg) // Alert hanya untuk error
  } finally {
    processingAction.value = false
  }
}

// Computed untuk menentukan apakah tombol kiri perlu ditampilkan
const showLeftButton = computed(() => {
  return availableNextStatuses.value.cancel_actions.length > 0
})

// Label untuk tombol kiri
const leftButtonLabel = computed(() => {
  const actions = availableNextStatuses.value.cancel_actions
  if (actions.length === 1) return getStatusLabel(actions[0])
  if (actions.length > 1) return 'Lainnya'
  return ''
})

// Warna tombol kiri
const leftButtonClass = computed(() => {
  const actions = availableNextStatuses.value.cancel_actions
  if (actions.length === 1) {
    return getButtonColorClass(actions[0], true)
  }
  return 'border-gray-200 text-gray-600 hover:bg-gray-50'
})

// Label untuk tombol kanan
const mainButtonLabel = computed(() => {
  if (!inspection.value) return 'Tidak Ada Aksi'
  
  const currentStatus = inspection.value.status
  const nextStepActions = availableNextStatuses.value.next_step_actions
  
  // Status final (approved, completed, under_review)
  const finalStatuses = ['approved', 'completed', 'under_review']
  if (finalStatuses.includes(currentStatus)) {
    return 'Lihat Hasil Inspeksi'
  }
  
  // Status cancelled
  if (currentStatus === 'cancelled') {
    return 'Dibatalkan'
  }
  
  // Status rejected
  if (currentStatus === 'rejected') {
    return 'Ditolak'
  }
  
  // Jika ada next step actions
  if (nextStepActions.length > 0) {
    return getStatusLabel(nextStepActions[0])
  }
  
  return 'Tidak Ada Aksi'
})

// Warna tombol kanan
const mainButtonClass = computed(() => {
  if (!inspection.value) return 'bg-gradient-to-r from-gray-400 to-gray-500'
  
  const currentStatus = inspection.value.status
  const nextStepActions = availableNextStatuses.value.next_step_actions
  
  // Status final (approved, completed, under_review)
  const finalStatuses = ['approved', 'completed', 'under_review']
  if (finalStatuses.includes(currentStatus)) {
    return 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
  }
  
  // Status cancelled
  if (currentStatus === 'cancelled') {
    return 'bg-gradient-to-r from-gray-400 to-gray-500'
  }
  
  // Status rejected
  if (currentStatus === 'rejected') {
    return 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
  }
  
  // Jika ada next step actions
  if (nextStepActions.length > 0) {
    return getButtonColorClass(nextStepActions[0], false)
  }
  
  return 'bg-gradient-to-r from-gray-400 to-gray-500'
})

// Cek apakah tombol kanan disabled
const isMainActionDisabled = computed(() => {
  if (!inspection.value) return true
  
  const currentStatus = inspection.value.status
  const nextStepActions = availableNextStatuses.value.next_step_actions
  
  // Status final (approved, completed, under_review) - tidak disabled karena bisa klik ke hasil
  const finalStatuses = ['approved', 'completed', 'under_review']
  if (finalStatuses.includes(currentStatus)) {
    return false // Tidak disabled, bisa diklik ke halaman hasil
  }
  
  // Status cancelled dan rejected - disabled karena sudah final
  if (currentStatus === 'cancelled' || currentStatus === 'rejected') {
    return true // Disabled
  }
  
  return nextStepActions.length === 0
})

// Fungsi untuk membuka WhatsApp
const openWhatsApp = (phone: string, name: string = '') => {
  if (!phone) return
  
  const cleanPhone = phone.replace(/\D/g, '')
  const message = `Halo ${name}, saya dari tim inspeksi terkait jadwal inspeksi kendaraan.`
  const encodedMessage = encodeURIComponent(message)
  
  window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank')
}

// Fungsi untuk membuka Google Maps
const openGoogleMaps = (link_maps: string) => {
  if (!link_maps) return
  window.open(link_maps, '_blank')
}

// Fungsi untuk mendapatkan label tab
const getTabLabel = (tab: string) => {
  const labels: Record<string, string> = {
    informasi: 'Informasi',
    spesifikasi: 'Spesifikasi'
  }
  return labels[tab] || tab
}

// Computed property untuk menentukan apakah inspector dan submitted_by berbeda
const showSubmitted = computed(() => {
  if (!inspection.value) return false
  return inspection.value.inspector.name !== inspection.value.submitted_by.name
})

onMounted(() => {
  fetchJobDetail()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header dengan tombol back -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-4 shadow-lg sticky top-0 z-10">
      <div class="flex items-center">
        <button @click="goBack" class="mr-3 p-2 hover:bg-white/20 rounded-full transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="flex-1">
          <h1 class="text-lg font-semibold">Detail Inspeksi</h1>
        </div>
        <div v-if="inspection" class="bg-white/20 px-3 py-1.5 rounded-full">
          <span class="text-xs font-medium">{{ inspection.status_label }}</span>
        </div>
      </div>
    </div>

    <main class="p-4 pb-28">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-16">
        <div class="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-500 font-medium">Memuat detail inspeksi...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex flex-col items-center justify-center py-16 px-4">
        <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-red-500 text-center font-medium mb-2">{{ error }}</p>
        <button 
          @click="fetchJobDetail"
          class="mt-4 px-6 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-md"
        >
          Coba Lagi
        </button>
      </div>

      <!-- Detail Content -->
      <div v-else-if="inspection" class="space-y-4">
        <!-- Vehicle Info Card -->
        <div class="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-5 shadow-sm border border-blue-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-700 flex items-center">
              <svg class="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              KENDARAAN
            </h2>
            <span class="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
              {{ inspection.vehicle.transmission.name }} | {{ inspection.vehicle.fuel_type }}
            </span>
          </div>
          
          <div class="space-y-4">
            <div>
              <p class="font-mono font-bold text-2xl text-gray-800 tracking-wider">{{ inspection.vehicle.license_plate }}</p>
              <p class="text-gray-600 font-medium mt-1">{{ inspection.vehicle.vehicle_name }}</p>
            </div>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <button 
            v-for="tab in ['informasi', 'spesifikasi']"
            :key="tab"
            @click="activeTab = tab"
            class="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all capitalize"
            :class="activeTab === tab ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'"
          >
            {{ getTabLabel(tab) }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="space-y-4">
          <!-- TAB INFORMASI -->
          <div v-if="activeTab === 'informasi'" class="space-y-4">
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
                    <p v-if="inspection.customer.phone" class="text-xs text-gray-500 mt-1">{{ inspection.customer.phone }}</p>
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
                <p v-if="inspection.customer.address" class="text-xs text-gray-500 mt-2 flex items-start">
                  <svg class="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{{ inspection.customer.address }}</span>
                </p>
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
                    <p v-if="inspection.seller.phone" class="text-xs text-gray-500 mt-1">{{ inspection.seller.phone }}</p>
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

            <!-- Submitted By (jika berbeda dengan inspector) -->
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
          </div>

          <!-- TAB SPESIFIKASI -->
          <div v-if="activeTab === 'spesifikasi'" class="space-y-4">
            <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <svg class="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                SPESIFIKASI KENDARAAN
              </h3>
              
              <div class="grid grid-cols-2 gap-2">
                <div class="bg-gray-50 p-3 rounded-lg">
                  <label class="text-xs text-gray-400">Merek</label>
                  <p class="font-semibold text-gray-800">{{ inspection.vehicle.brand || '-' }}</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <label class="text-xs text-gray-400">Model</label>
                  <p class="font-semibold text-gray-800">{{ inspection.vehicle.model || '-' }}</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <label class="text-xs text-gray-400">Tipe</label>
                  <p class="font-semibold text-gray-800">{{ inspection.vehicle.type || '-' }}</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <label class="text-xs text-gray-400">Tahun</label>
                  <p class="font-semibold text-gray-800">{{ inspection.vehicle.year || '-' }}</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <label class="text-xs text-gray-400">CC Mesin</label>
                  <p class="font-semibold text-gray-800">{{ inspection.vehicle.cc ? inspection.vehicle.cc + ' cc' : '-' }}</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <label class="text-xs text-gray-400">Transmisi</label>
                  <p class="font-semibold text-gray-800">{{ inspection.vehicle.transmission.name || '-' }}</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <label class="text-xs text-gray-400">Bahan Bakar</label>
                  <p class="font-semibold text-gray-800">{{ inspection.vehicle.fuel_type || '-' }}</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <label class="text-xs text-gray-400">Generasi</label>
                  <p class="font-semibold text-gray-800">{{ inspection.vehicle.generation || '-' }}</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <label class="text-xs text-gray-400">Origin</label>
                  <p class="font-semibold text-gray-800">{{ inspection.vehicle.origin || '-' }}</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg col-span-2">
                  <label class="text-xs text-gray-400">Periode Pasar</label>
                  <p class="font-semibold text-gray-800">{{ inspection.vehicle.market_period || '-' }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <svg class="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                TEMPLATE INSPEKSI
              </h3>
              <div class="bg-blue-50 p-3 rounded-lg">
                <p class="font-medium text-blue-700">{{ inspection.template.name }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="inspection.notes" class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p class="text-xs text-yellow-700 flex items-center">
            <svg class="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Catatan: {{ inspection.notes }}</span>
          </p>
        </div>
      </div>
    </main>

    <!-- Bottom Action Buttons -->
    <div v-if="inspection && !loading" class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-20">
      <div class="flex space-x-3">
        <!-- Tombol Kiri (Cancel Actions) -->
        <button 
          v-if="showLeftButton"
          @click="handleLeftAction"
          class="flex-1 py-3 px-4 border-2 rounded-xl font-medium transition-colors hover:bg-opacity-50"
          :class="leftButtonClass"
          :disabled="processingAction"
        >
          <span v-if="processingAction" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Memproses...</span>
          </span>
          <span v-else>{{ leftButtonLabel }}</span>
        </button>

        <!-- Tombol Kanan (Next Step Actions) -->
        <button 
          @click="handleMainAction"
          :disabled="isMainActionDisabled"
          class="flex-1 py-3 px-4 text-white rounded-xl font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          :class="mainButtonClass"
        >
          <span v-if="processingAction" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Memproses...</span>
          </span>
          <span v-else>{{ mainButtonLabel }}</span>
        </button>
      </div>
    </div>

    <!-- Modal untuk Multiple Cancel Actions -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div v-if="showActionModal" class="fixed inset-0 flex items-end justify-center z-50" @click="showActionModal = false">
        <!-- Backdrop dengan blur -->
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="showActionModal = false"></div>
        
        <!-- Modal Content -->
        <div class="bg-white rounded-t-2xl w-full max-w-md overflow-hidden shadow-xl relative z-10" @click.stop>
          <!-- Handle bar (opsional) -->
          <div class="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2"></div>
          
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800">{{ modalTitle }}</h3>
            <button @click="showActionModal = false" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Action Buttons -->
          <div class="p-4">
            <div class="flex space-x-3">
              <button
                v-for="action in modalActions"
                :key="action.type"
                @click="selectAction(action)"
                class="flex-1 py-4 rounded-xl font-medium text-center transition-colors shadow-md hover:shadow-lg transform active:scale-95"
                :class="{
                  'bg-red-500 text-white hover:bg-red-600': action.type === 'cancel',
                  'bg-orange-500 text-white hover:bg-orange-600': action.type === 'reject',
                  'bg-yellow-500 text-white hover:bg-yellow-600': action.type === 'pending'
                }"
              >
                {{ action.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal Konfirmasi dengan Notes -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div v-if="showConfirmModal" class="fixed inset-0 flex items-end justify-center z-50" @click="showConfirmModal = false">
        <!-- Backdrop dengan blur -->
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="showConfirmModal = false"></div>
        
        <!-- Modal Content -->
        <div class="bg-white rounded-t-2xl w-full max-w-md overflow-hidden shadow-xl relative z-10" @click.stop>
          <!-- Handle bar (opsional) -->
          <div class="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2"></div>
          
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800">{{ confirmTitle }}</h3>
            <button @click="showConfirmModal = false" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Form Notes -->
          <div class="p-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Catatan <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="confirmNote"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Masukkan catatan..."
              :disabled="processingAction"
              required
            ></textarea>
            
            <p v-if="confirmAction" class="mt-2 text-xs text-gray-500">
              Anda akan {{ confirmAction.label.toLowerCase() }} inspeksi ini
            </p>
          </div>
          
          <!-- Action Button -->
          <div class="p-4 border-t border-gray-200">
            <button
              @click="confirmActionHandler"
              :disabled="!confirmNote.trim() || processingAction"
              class="w-full py-4 rounded-xl font-medium text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg transform active:scale-95"
              :class="{
                'bg-red-500 text-white hover:bg-red-600': confirmAction?.type === 'cancel',
                'bg-orange-500 text-white hover:bg-orange-600': confirmAction?.type === 'reject',
                'bg-yellow-500 text-white hover:bg-yellow-600': confirmAction?.type === 'pending'
              }"
            >
              <svg v-if="processingAction" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ processingAction ? 'Memproses...' : 'Konfirmasi' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.capitalize {
  text-transform: capitalize;
}

/* Animasi tambahan untuk modal */
.translate-y-full {
  transform: translateY(100%);
}

.translate-y-0 {
  transform: translateY(0);
}

.opacity-0 {
  opacity: 0;
}

.opacity-100 {
  opacity: 1;
}

/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Backdrop blur */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

/* Scale effect untuk tombol */
.transform {
  transition: transform 0.2s ease;
}

.active\:scale-95:active {
  transform: scale(0.95);
}
</style>