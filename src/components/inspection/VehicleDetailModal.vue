<!-- src/components/inspection/VehicleDetailModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex flex-col">

        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose" />

        <!-- Sheet -->
        <div class="relative mt-auto bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh]">

          <!-- Handle bar -->
          <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div class="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <!-- Header -->
          <div class="px-4 pt-2 pb-3 border-b border-gray-100 flex-shrink-0 flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-gray-800">Detail Kendaraan</h2>
              <p class="text-xs text-gray-400 mt-0.5">Ubah nomor polisi dan tipe kendaraan</p>
            </div>
            <button
              @click="handleClose"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="overflow-y-auto overscroll-contain flex-1 px-4 py-4">
            <VehicleSelector
              ref="selectorRef"
              :initial-vehicle-detail="vehicleDetail"
            />
          </div>

          <!-- Save error -->
          <p v-if="saveError" class="px-4 pb-2 text-xs text-red-500 text-center flex-shrink-0">
            {{ saveError }}
          </p>

          <!-- Footer -->
          <div class="px-4 py-4 border-t border-gray-100 flex-shrink-0 flex gap-3">
            <button
              @click="handleClose"
              :disabled="saving"
              class="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium
                     hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Batal
            </button>

            <!-- Simpan — aktif hanya kalau ada perubahan & vehicle sudah lengkap -->
            <button
              @click="handleSave"
              :disabled="saving || !hasChanges || !canSave"
              class="flex-1 py-3 rounded-xl text-sm font-semibold transition-all
                     flex items-center justify-center gap-2"
              :class="hasChanges && canSave
                ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
            >
              <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              {{ saving ? 'Menyimpan…' : 'Simpan' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import VehicleSelector from './VehicleSelector.vue'
import { useInspectionVehicle } from '../../composables/useInspectionVehicle'
import { saveInspectionVehicle } from '../../services/inspectionVehicleService'

const props = defineProps<{
  show:          boolean
  inspectionId:  number
  vehicleDetail?: {
    // Format baru (dengan id) — lihat VehicleSelector untuk detail
    brand?:         any
    model?:         any
    type?:          any
    year?:          number | string | null
    cc?:            any
    transmission?:  any
    fuel_type?:     string | null
    market_period?: string | null
    vehicle_id?:    number | null
    vehicle_name?:  string | null
    // License plate dari inspection langsung
    license_plate?: string | null
  } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', payload: { license_plate: string; vehicle_id: number; vehicle_name: string }): void
}>()

const { licensePlate, vehicleId, vehicleName } = useInspectionVehicle()

const selectorRef = ref<InstanceType<typeof VehicleSelector> | null>(null)
const saving      = ref(false)
const saveError   = ref('')

// ── Nilai awal saat modal dibuka — untuk deteksi perubahan ────
const initialLicensePlate = ref('')
const initialVehicleId    = ref<number | null>(null)

// Snapshot saat modal pertama kali dibuka
watch(() => props.show, (val) => {
  if (val) {
    // Simpan nilai awal
    initialLicensePlate.value = licensePlate.value
    initialVehicleId.value    = vehicleId.value
    saveError.value = ''
    lockBodyScroll()
  } else {
    unlockBodyScroll()
  }
})

// ── Deteksi perubahan ─────────────────────────────────────────
// Ada perubahan kalau: license plate berbeda ATAU vehicle_id berbeda
const hasChanges = computed(() =>
  licensePlate.value !== initialLicensePlate.value ||
  vehicleId.value    !== initialVehicleId.value
)

// Bisa disimpan kalau: vehicle sudah dipilih (ada vehicleId) & plate terisi
const canSave = computed(() =>
  !!vehicleId.value &&
  licensePlate.value.trim().length >= 3  // minimal "D 1" saja sudah ada area + angka
)

// ── Scroll lock ───────────────────────────────────────────────
let savedScrollY = 0
const lockBodyScroll = () => {
  savedScrollY = window.scrollY
  document.body.style.cssText = `position:fixed;top:-${savedScrollY}px;left:0;right:0;overflow:hidden`
}
const unlockBodyScroll = () => {
  document.body.style.cssText = ''
  window.scrollTo(0, savedScrollY)
}
onUnmounted(unlockBodyScroll)

// ── Handlers ──────────────────────────────────────────────────
const handleClose = () => {
  if (saving.value) return
  emit('close')
}

const handleSave = async () => {
  saveError.value = ''

  // Validasi field via VehicleSelector (plate + vehicleId)
  if (!selectorRef.value?.validate()) return

  saving.value = true
  try {
    await saveInspectionVehicle(props.inspectionId, {
      license_plate: licensePlate.value,
      vehicle_id:    vehicleId.value!,
      vehicle_name:  vehicleName.value,
    })

    emit('saved', {
      license_plate: licensePlate.value,
      vehicle_id:    vehicleId.value!,
      vehicle_name:  vehicleName.value,
    })
    emit('close')
  } catch (e: any) {
    saveError.value = e?.response?.data?.message ?? 'Gagal menyimpan, coba lagi'
    console.error('[VehicleDetailModal] Gagal simpan:', e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-active .relative,
.modal-leave-active .relative { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .relative,
.modal-leave-to .relative { transform: translateY(100%); }
</style>