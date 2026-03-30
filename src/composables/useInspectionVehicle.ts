// src/composables/useInspectionVehicle.ts
//
// Global singleton state untuk license plate & vehicle terpilih.
// Dapat diakses dari form, modal created, atau komponen manapun.
//
// Output:
//   licensePlate  → string gabungan e.g. "D 1234 AB"
//   vehicleId     → number | null  (id dari get-detail)
//   vehicleName   → string label display

import { ref, computed } from 'vue'

// ── Singleton (dibuat di luar fungsi agar shared) ─────────────
const _plateArea    = ref('')
const _plateNumber  = ref('')
const _plateSuffix  = ref('')
const _vehicleId    = ref<number | null>(null)
const _vehicleName  = ref('')

export function useInspectionVehicle() {

  // ── Output computed ─────────────────────────────────────────

  /** Nopol gabungan: "D 1234 AB" */
  const licensePlate = computed(() =>
    [_plateArea.value, _plateNumber.value, _plateSuffix.value]
      .filter(Boolean).join(' ')
  )

  const vehicleId   = computed(() => _vehicleId.value)
  const vehicleName = computed(() => _vehicleName.value)

  const isComplete = computed(() =>
    _plateArea.value.length   >= 1 &&
    _plateNumber.value.length >= 1 &&
    _plateSuffix.value.length >= 1 &&
    _vehicleId.value !== null
  )

  // ── Setters ─────────────────────────────────────────────────

  const setPlate = (area: string, number: string, suffix: string) => {
    _plateArea.value   = area.toUpperCase()
    _plateNumber.value = number
    _plateSuffix.value = suffix.toUpperCase()
  }

  const setVehicle = (id: number | null, name = '') => {
    _vehicleId.value   = id
    _vehicleName.value = name
  }

  /**
   * Init dari data existing saat form di-load.
   * license: "D 1234 AB"
   */
  const initFromExisting = (license: string, id: number | null, name: string) => {
    const parts = (license ?? '').trim().toUpperCase().split(/\s+/)
    _plateArea.value   = parts[0] ?? ''
    _plateNumber.value = parts[1] ?? ''
    _plateSuffix.value = parts[2] ?? ''
    _vehicleId.value   = id
    _vehicleName.value = name
  }

  const reset = () => {
    _plateArea.value   = ''
    _plateNumber.value = ''
    _plateSuffix.value = ''
    _vehicleId.value   = null
    _vehicleName.value = ''
  }

  return {
    // Output (read-only)
    licensePlate,
    vehicleId,
    vehicleName,
    isComplete,

    // Internal refs — digunakan langsung oleh VehicleSelector
    _plateArea,
    _plateNumber,
    _plateSuffix,

    // Setters
    setPlate,
    setVehicle,
    initFromExisting,
    reset,
  }
}