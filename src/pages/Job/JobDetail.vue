<!-- views/tugas/[id].vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import jobService from '../../services/jobService'
import type { JobDetail, NextJobStatus } from '../../types/job'
import TabInformasi from '../../components/tugas/TabInformasi.vue'
import TabSpesifikasi from '../../components/tugas/TabSpesifikasi.vue'

const route  = useRoute()
const router = useRouter()
const jobId  = route.params.id as string

interface AvailableNextStatuses {
  cancel_actions: NextJobStatus[]
  next_step_actions: NextJobStatus[]
}

const inspection            = ref<JobDetail | null>(null)
const availableNextStatuses = ref<AvailableNextStatuses>({ cancel_actions: [], next_step_actions: [] })
const loading               = ref(true)
const error                 = ref('')
const activeTab             = ref<'informasi' | 'spesifikasi'>('informasi')

const showConfirmModal  = ref(false)
const confirmTitle      = ref('')
const confirmNote       = ref('')
const confirmAction     = ref<{ type: string; status: NextJobStatus; label: string } | null>(null)
const processingAction  = ref(false)
const showActionModal   = ref(false)
const modalTitle        = ref('')
const modalActions      = ref<Array<{ type: string; label: string; status: NextJobStatus }>>([])

const getStatusLabel = (status: NextJobStatus): string => {
  const labels: Record<NextJobStatus, string> = {
    accepted: 'Terima', on_the_way: 'Berangkat', arrived: 'Tiba di Lokasi',
    in_progress: 'Mulai Inspeksi', completed: 'Selesai', cancelled: 'Batalkan',
    rejected: 'Tolak', pending: 'Tunda', paused: 'Jeda', under_review: 'Tinjau',
    revision: 'Revisi', approved: 'Setujui', draft: 'Draft', process: 'Proses'
  }
  return labels[status] || status
}

const getButtonColorClass = (status: NextJobStatus, isLeft = false): string => {
  if (isLeft) {
    const map: Partial<Record<NextJobStatus, string>> = {
      cancelled: 'border-red-200 text-red-600 hover:bg-red-50',
      rejected:  'border-orange-200 text-orange-600 hover:bg-orange-50',
      pending:   'border-yellow-200 text-yellow-600 hover:bg-yellow-50',
    }
    return map[status] ?? 'border-gray-200 text-gray-600 hover:bg-gray-50'
  }
  const map: Partial<Record<NextJobStatus, string>> = {
    accepted:     'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    on_the_way:   'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
    arrived:      'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    in_progress:  'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    completed:    'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    approved:     'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    revision:     'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
    under_review: 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
    cancelled:    'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600',
    rejected:     'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
  }
  return map[status] ?? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
}

const fetchJobDetail = async () => {
  loading.value = true
  error.value   = ''
  try {
    const response = await jobService.getJobDetail(Number(jobId))
    inspection.value = response.data
    if (response.available_next_statuses) {
      availableNextStatuses.value = response.available_next_statuses as unknown as AvailableNextStatuses
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Gagal memuat detail tugas'
  } finally {
    loading.value = false
  }
}

const handleLeftAction = () => {
  const cancelActions = availableNextStatuses.value.cancel_actions
  if (!cancelActions.length) return
  if (cancelActions.length === 1 && cancelActions[0]) {
    const status = cancelActions[0]
    const label  = getStatusLabel(status)
    confirmTitle.value     = `Konfirmasi ${label}`
    confirmAction.value    = { type: status === 'cancelled' ? 'cancel' : status === 'rejected' ? 'reject' : 'pending', status, label }
    confirmNote.value      = ''
    showConfirmModal.value = true
  } else {
    modalTitle.value   = 'Pilih Tindakan'
    modalActions.value = cancelActions.map(status => ({
      type: status === 'cancelled' ? 'cancel' : status === 'rejected' ? 'reject' : 'pending',
      label: getStatusLabel(status), status
    }))
    showActionModal.value = true
  }
}

const selectAction = (action: { type: string; label: string; status: NextJobStatus }) => {
  showActionModal.value  = false
  confirmTitle.value     = `Konfirmasi ${action.label}`
  confirmAction.value    = action
  confirmNote.value      = ''
  showConfirmModal.value = true
}

const handleMainAction = async () => {
  if (!inspection.value) return
  const { status } = inspection.value
  const nextStepActions = availableNextStatuses.value.next_step_actions
  const finalStatuses   = ['approved', 'completed', 'under_review', 'rejected', 'cancelled']
  if (finalStatuses.includes(status)) { router.push(`/report/${jobId}`); return }
  if (!nextStepActions.length) return
  const nextStatus = nextStepActions[0]
  if (!nextStatus) return
  if (nextStatus === 'in_progress') { router.push(`/form-inspection/${jobId}`); return }
  processingAction.value = true
  try {
    await jobService.patchJobStatus(inspection.value.id, nextStatus)
    await fetchJobDetail()
  } catch (err: any) {
    alert(err.response?.data?.message || 'Gagal mengupdate status')
  } finally {
    processingAction.value = false
  }
}

const confirmActionHandler = async () => {
  if (!confirmAction.value || !inspection.value) return
  if (!confirmNote.value.trim()) { alert('Catatan harus diisi'); return }
  processingAction.value = true
  try {
    await jobService.patchJobStatus(inspection.value.id, confirmAction.value.status, confirmNote.value)
    await fetchJobDetail()
    showConfirmModal.value = false
    confirmNote.value      = ''
    confirmAction.value    = null
  } catch (err: any) {
    alert(err.response?.data?.message || 'Gagal mengupdate status')
  } finally {
    processingAction.value = false
  }
}

const showLeftButton      = computed(() => availableNextStatuses.value.cancel_actions.length > 0)
const leftButtonLabel     = computed(() => {
  const actions = availableNextStatuses.value.cancel_actions
  if (actions.length === 1 && actions[0]) return getStatusLabel(actions[0])
  if (actions.length > 1) return 'Lainnya'
  return ''
})
const leftButtonClass     = computed(() => {
  const actions = availableNextStatuses.value.cancel_actions
  if (actions.length === 1 && actions[0]) return getButtonColorClass(actions[0], true)
  return 'border-gray-200 text-gray-600 hover:bg-gray-50'
})
const mainButtonLabel     = computed(() => {
  if (!inspection.value) return 'Tidak Ada Aksi'
  const { status } = inspection.value
  const nextStepActions = availableNextStatuses.value.next_step_actions
  if (['approved', 'completed', 'under_review'].includes(status)) return 'Lihat Hasil Inspeksi'
  if (status === 'cancelled') return 'Dibatalkan'
  if (status === 'rejected')  return 'Ditolak'
  if (nextStepActions.length > 0 && nextStepActions[0]) return getStatusLabel(nextStepActions[0])
  return 'Tidak Ada Aksi'
})
const mainButtonClass     = computed(() => {
  if (!inspection.value) return 'bg-gradient-to-r from-gray-400 to-gray-500'
  const { status } = inspection.value
  const nextStepActions = availableNextStatuses.value.next_step_actions
  if (['approved', 'completed', 'under_review'].includes(status)) return 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
  if (status === 'cancelled') return 'bg-gradient-to-r from-gray-400 to-gray-500'
  if (status === 'rejected')  return 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
  if (nextStepActions.length > 0 && nextStepActions[0]) return getButtonColorClass(nextStepActions[0], false)
  return 'bg-gradient-to-r from-gray-400 to-gray-500'
})
const isMainActionDisabled = computed(() => {
  if (!inspection.value) return true
  const { status } = inspection.value
  if (['approved', 'completed', 'under_review'].includes(status)) return false
  if (status === 'cancelled' || status === 'rejected') return true
  return availableNextStatuses.value.next_step_actions.length === 0
})

onMounted(fetchJobDetail)
</script>

<template>
  <div class="fixed inset-0 bg-gray-50 flex flex-col">

    <!-- ═══════════════════════════════════════════════════════
         HEADER
    ═══════════════════════════════════════════════════════ -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 pt-3 pb-4 shadow-lg flex-shrink-0 z-10">
      <div class="flex items-center gap-2">
        <button
          @click="router.push('/dashboard/job')"
          class="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-base font-semibold flex-1">Detail Inspeksi</h1>

        <!-- Status badge — hanya tampil jika data sudah ada -->
        <div v-if="inspection && !loading" class="bg-white/20 px-3 py-1 rounded-full">
          <span class="text-xs font-medium">{{ inspection.status_label }}</span>
        </div>
        <!-- Skeleton badge saat loading -->
        <div v-else-if="loading" class="sk-white h-6 w-20 rounded-full"></div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         SCROLL AREA
    ═══════════════════════════════════════════════════════ -->
    <main class="flex-1 overflow-y-auto p-4 pb-28 space-y-4">

      <!-- ── LOADING SKELETON ── -->
      <template v-if="loading">

        <!-- Vehicle card skeleton -->
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="sk w-5 h-5 rounded-md"></div>
              <div class="sk h-4 w-24 rounded-lg"></div>
            </div>
            <div class="sk h-6 w-32 rounded-full"></div>
          </div>
          <div class="sk h-7 w-40 rounded-lg mb-2"></div>
          <div class="sk h-4 w-56 rounded-lg"></div>
        </div>

        <!-- Tab skeleton -->
        <div class="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 gap-1">
          <div class="sk flex-1 h-10 rounded-lg"></div>
          <div class="sk flex-1 h-10 rounded-lg"></div>
        </div>

        <!-- Content skeleton — mirip list informasi -->
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">
          <div v-for="n in 5" :key="n" class="flex items-start gap-3">
            <div class="sk w-9 h-9 rounded-xl flex-shrink-0"></div>
            <div class="flex-1 space-y-2 pt-1">
              <div class="sk h-3 w-20 rounded"></div>
              <div class="sk h-4 rounded" :style="{ width: (50 + n * 8) + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- Second content block -->
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div class="sk h-4 w-32 rounded-lg"></div>
          <div v-for="n in 3" :key="n" class="flex items-center gap-3">
            <div class="sk w-8 h-8 rounded-lg flex-shrink-0"></div>
            <div class="flex-1 space-y-1.5">
              <div class="sk h-3 w-24 rounded"></div>
              <div class="sk h-4 w-36 rounded"></div>
            </div>
          </div>
        </div>

      </template>

      <!-- ── ERROR ── -->
      <div v-else-if="error" class="flex flex-col items-center justify-center py-16 px-4">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <!-- ── CONTENT ── -->
      <template v-else-if="inspection">

        <!-- Vehicle Card -->
        <div class="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-5 shadow-sm border border-blue-100">

          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-700 flex items-center">
              <svg
                class="w-5 h-5 text-blue-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              KENDARAAN
            </h2>

            <span
              class="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full"
            >
              {{ inspection.vehicle.transmission?.name || '-' }}
              |
              {{ inspection.vehicle.fuel_type }}
            </span>
          </div>

          <div class="flex items-center gap-4">

            <!-- FOTO -->
            <div
              class="w-20 h-20 rounded-2xl overflow-hidden border border-gray-200 bg-white flex-shrink-0"
            >
              <img
                v-if="inspection.vehicle.display_image"
                :src="inspection.vehicle.display_image"
                :alt="inspection.vehicle.vehicle_name"
                class="w-full h-full object-cover"
              >

              <img
                v-else
                src="/default.png"
                alt="Default Vehicle"
                class="w-full h-full object-contain p-1"
              >
            </div>

            <!-- INFO -->
            <div class="min-w-0 flex-1">

              <p
                class="font-mono font-bold text-xl text-gray-800 tracking-wider"
              >
                {{ inspection.vehicle.license_plate }}
              </p>

              <p
                class="text-gray-600 font-medium text-sm mt-1"
              >
                {{ inspection.vehicle.vehicle_name }}
              </p>

            </div>

          </div>

        </div>

        <!-- Tabs -->
        <div class="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 gap-1">
          <button
            v-for="tab in ['informasi', 'spesifikasi']"
            :key="tab"
            @click="activeTab = tab as 'informasi' | 'spesifikasi'"
            class="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all"
            :class="activeTab === tab ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'"
          >
            {{ tab === 'informasi' ? 'Informasi' : 'Spesifikasi' }}
          </button>
        </div>

        <TabInformasi  v-if="activeTab === 'informasi'"  :inspection="inspection" :job-id="jobId" />
        <TabSpesifikasi v-if="activeTab === 'spesifikasi'" :inspection="inspection" :job-id="jobId" />

        <!-- Notes -->
        <div v-if="inspection.notes" class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p class="text-xs text-yellow-700 flex items-center gap-1.5">
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Catatan: {{ inspection.notes }}
          </p>
        </div>

      </template>
    </main>

    <!-- ═══════════════════════════════════════════════════════
         BOTTOM ACTION BUTTONS
    ═══════════════════════════════════════════════════════ -->
    <div
      v-if="inspection && !loading"
      class="fixed bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-3"
      style="background: linear-gradient(to top, rgba(249,250,251,0.95) 70%, transparent);"
    >
      <div class="flex space-x-3">
        <button
          v-if="showLeftButton"
          @click="handleLeftAction"
          :disabled="processingAction"
          class="flex-1 py-3.5 px-4 border-2 rounded-2xl font-medium transition-colors shadow-md"
          :class="leftButtonClass"
        >
          <span v-if="processingAction" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memproses...
          </span>
          <span v-else>{{ leftButtonLabel }}</span>
        </button>

        <button
          @click="handleMainAction"
          :disabled="isMainActionDisabled"
          class="flex-1 py-3.5 px-4 text-white rounded-2xl font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          :class="mainButtonClass"
        >
          <span v-if="processingAction" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memproses...
          </span>
          <span v-else>{{ mainButtonLabel }}</span>
        </button>
      </div>
    </div>

    <!-- Floating skeleton saat loading -->
    <div
      v-else-if="loading"
      class="fixed bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-3 flex gap-3"
      style="background: linear-gradient(to top, rgba(249,250,251,0.95) 70%, transparent);"
    >
      <div class="sk flex-1 h-12 rounded-2xl"></div>
      <div class="sk flex-1 h-12 rounded-2xl"></div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         MODAL MULTIPLE CANCEL ACTIONS
    ═══════════════════════════════════════════════════════ -->
    <!-- Overlay — fade saja, tidak ikut slide -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showActionModal"
        class="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        @click="showActionModal = false"
      ></div>
    </Transition>

    <!-- Popup — slide from bottom -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="showActionModal"
        class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl overflow-hidden"
        @click.stop
      >
        <div class="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2"></div>
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">{{ modalTitle }}</h3>
          <button @click="showActionModal = false" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-4">
          <div class="flex space-x-3">
            <button
              v-for="action in modalActions"
              :key="action.type"
              @click="selectAction(action)"
              class="flex-1 py-4 rounded-xl font-medium text-center transition-colors shadow-md hover:shadow-lg active:scale-95"
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
    </Transition>

    <!-- ═══════════════════════════════════════════════════════
         MODAL KONFIRMASI + NOTES
    ═══════════════════════════════════════════════════════ -->
    <!-- Overlay -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showConfirmModal"
        class="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        @click="showConfirmModal = false"
      ></div>
    </Transition>

    <!-- Popup -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="showConfirmModal"
        class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl overflow-hidden"
        @click.stop
      >
        <div class="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2"></div>
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">{{ confirmTitle }}</h3>
          <button @click="showConfirmModal = false" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Catatan <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="confirmNote"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            placeholder="Masukkan catatan..."
            :disabled="processingAction"
          ></textarea>
          <p v-if="confirmAction" class="mt-2 text-xs text-gray-500">
            Anda akan {{ confirmAction.label.toLowerCase() }} inspeksi ini
          </p>
        </div>
        <div class="p-4 border-t border-gray-200">
          <button
            @click="confirmActionHandler"
            :disabled="!confirmNote.trim() || processingAction"
            class="w-full py-4 rounded-xl font-medium text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md active:scale-95"
            :class="{
              'bg-red-500 text-white hover:bg-red-600': confirmAction?.type === 'cancel',
              'bg-orange-500 text-white hover:bg-orange-600': confirmAction?.type === 'reject',
              'bg-yellow-500 text-white hover:bg-yellow-600': confirmAction?.type === 'pending'
            }"
          >
            <svg v-if="processingAction" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ processingAction ? 'Memproses...' : 'Konfirmasi' }}</span>
          </button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.sk {
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.4s ease-in-out infinite;
  display: block;
  border-radius: 6px;
}
.sk-white {
  background: linear-gradient(90deg, rgba(255,255,255,0.15) 25%, rgba(255,255,255,0.30) 50%, rgba(255,255,255,0.15) 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.4s ease-in-out infinite;
  display: block;
}
@keyframes sk-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.backdrop-blur-sm { backdrop-filter: blur(4px); }
</style>