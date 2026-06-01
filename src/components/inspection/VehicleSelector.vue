<!-- src/components/inspection/VehicleSelector.vue -->
<!--
  Cascading vehicle selector.
  - Pakai SelectField (inline, style mirip SelectInput.vue) untuk brand/model/type/year/cc/fuel/market
  - Pakai radio pills horizontal untuk transmisi (muncul setelah cc dipilih & data ready)
  - Format vehicle_detail BARU (ada id) → set langsung, TIDAK request berurutan saat mount
  - Setelah pilih satu level → langsung prefetch level berikutnya di background
  - Bisa dipakai tanpa initialVehicleDetail (mode baru, mulai kosong)
  - Cek no polisi via API → auto-fill vehicle detail + tampil warning & region di bawah nopol
  - Kalau initialVehicleDetail sudah ada → tidak request plate check, hanya request kalau nopol diubah
-->
<template>
  <div class="space-y-4">

    <!-- NOMOR POLISI -->
    <div>
      <p class="text-sm font-semibold text-gray-700 mb-2">Nomor Polisi</p>
        <div class="flex items-center gap-2 w-full">

          <input v-model="_plateArea" type="text" maxlength="2" placeholder="D"
            class="flex-[2] min-w-0 h-12 text-center text-lg font-bold uppercase border-2 rounded-xl outline-none transition-colors tracking-widest focus:border-blue-500 focus:bg-blue-50"
            :class="errors.area ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'"
            @input="onPlateAreaInput" />

          <input v-model="_plateNumber" inputmode="numeric" maxlength="4" placeholder="1234"
            class="flex-[3] min-w-0 h-12 text-center text-lg font-bold border-2 rounded-xl outline-none transition-colors tracking-widest focus:border-blue-500 focus:bg-blue-50"
            :class="errors.number ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'"
            @input="onPlateNumberInput" />

          <input v-model="_plateSuffix" type="text" maxlength="3" placeholder="ABC"
            class="flex-[2] min-w-0 h-12 text-center text-lg font-bold uppercase border-2 rounded-xl outline-none transition-colors tracking-widest focus:border-blue-500 focus:bg-blue-50"
            :class="errors.suffix ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'"
            @input="onPlateSuffixInput" />

        </div>

      <!-- Errors nopol -->
      <div class="mt-1 space-y-0.5">
        <p v-if="errors.area"   class="text-xs text-red-500">{{ errors.area }}</p>
        <p v-if="errors.number" class="text-xs text-red-500">{{ errors.number }}</p>
        <p v-if="errors.suffix" class="text-xs text-red-500">{{ errors.suffix }}</p>
      </div>

      <!-- Loading plate check -->
      <div v-if="plateChecking" class="mt-2 flex items-center gap-2">
        <svg class="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <span class="text-xs text-gray-400">Mengecek nomor polisi…</span>
      </div>

      <!-- Region info -->
      <Transition name="slide-fade">
        <div v-if="plateRegion && !plateChecking" class="mt-2 flex items-center gap-2 flex-wrap">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700">
            <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {{ plateRegion.code }}
          </span>
          <span class="text-xs text-gray-500">{{ plateRegion.areas.join(', ') }}</span>
        </div>
      </Transition>

      <!-- Pesan info / error nopol (invalid region atau no data) -->
      <Transition name="slide-fade">
        <div v-if="plateInvalidMsg && !plateChecking"
          class="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border"
          :class="plateRegion
            ? 'bg-blue-50 border-blue-200'
            : 'bg-red-50 border-red-200'"
        >
          <!-- Ada region → info biasa (no data case) -->
          <svg v-if="plateRegion" class="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <!-- Tidak ada region → error (invalid plate case) -->
          <svg v-else class="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-xs" :class="plateRegion ? 'text-blue-600' : 'text-red-600'">
            {{ plateInvalidMsg }}
          </p>
        </div>
      </Transition>

      <!-- Warning dari inspection -->
      <Transition name="slide-fade">
        <div v-if="plateWarning && !plateChecking"
          class="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-xl border"
          :class="{
            'bg-yellow-50 border-yellow-200': plateWarning.status === 'under_review',
            'bg-red-50 border-red-200':       plateWarning.status === 'rejected',
            'bg-blue-50 border-blue-200':     !['under_review','rejected'].includes(plateWarning.status ?? ''),
          }"
        >
          <svg class="w-4 h-4 flex-shrink-0 mt-0.5"
            :class="{
              'text-yellow-500': plateWarning.status === 'under_review',
              'text-red-500':    plateWarning.status === 'rejected',
              'text-blue-500':   !['under_review','rejected'].includes(plateWarning.status ?? ''),
            }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <div>
            <p class="text-xs font-semibold"
              :class="{
                'text-yellow-700': plateWarning.status === 'under_review',
                'text-red-700':    plateWarning.status === 'rejected',
                'text-blue-700':   !['under_review','rejected'].includes(plateWarning.status ?? ''),
              }"
            >{{ plateWarning.status_label }}</p>
            <p class="text-xs mt-0.5"
              :class="{
                'text-yellow-600': plateWarning.status === 'under_review',
                'text-red-600':    plateWarning.status === 'rejected',
                'text-blue-600':   !['under_review','rejected'].includes(plateWarning.status ?? ''),
              }"
            >{{ plateWarning.message }}</p>
          </div>
        </div>
      </Transition>
    </div>

    <!-- VEHICLE CASCADING -->
    <div>
      <p class="text-sm font-semibold text-gray-700 mb-3">Detail Kendaraan</p>
      <div class="space-y-3">

        <!-- Merek -->
        <div>
          <p class="text-xs text-gray-500 mb-1">Merek</p>
          <SelectField
            placeholder="Pilih merek"
            :options="options.brand"
            :loading="loading.brand"
            :disabled="false"
            :value="sel.brand?.name ?? ''"
            :get-label="(o: { name: string }) => o.name"
            @open="onOpenBrand"
            @pick="onPickBrand"
          />
        </div>

        <!-- Model -->
        <div>
          <p class="text-xs text-gray-500 mb-1">Model</p>
          <SelectField
            placeholder="Pilih model"
            :options="options.model"
            :loading="loading.model"
            :disabled="!sel.brand"
            :value="sel.model?.name ?? ''"
            :get-label="(o: { name: string }) => o.name"
            @open="onOpenModel"
            @pick="onPickModel"
          />
        </div>

        <!-- Tipe -->
        <div>
          <p class="text-xs text-gray-500 mb-1">Tipe</p>
          <SelectField
            placeholder="Pilih tipe"
            :options="options.type"
            :loading="loading.type"
            :disabled="!sel.model"
            :value="sel.type?.name ?? ''"
            :get-label="(o: { name: string }) => o.name"
            @open="onOpenType"
            @pick="onPickType"
          />
        </div>

        <!-- Tahun -->
        <div>
          <p class="text-xs text-gray-500 mb-1">Tahun</p>
          <SelectField
            placeholder="Pilih tahun"
            :options="options.year"
            :loading="loading.year"
            :disabled="!sel.type"
            :value="sel.year !== null ? String(sel.year) : ''"
            :get-label="(o: { year: number }) => String(o.year)"
            @open="onOpenYear"
            @pick="onPickYear"
          />
        </div>

        <!-- CC -->
        <div>
          <p class="text-xs text-gray-500 mb-1">CC</p>
          <SelectField
            placeholder="Pilih CC"
            :options="options.cc"
            :loading="loading.cc"
            :disabled="sel.year === null"
            :value="options.cc.find(o => o.cc === sel.cc)?.name ?? selCcName ?? (sel.cc !== null ? String(sel.cc) : '')"
            :get-label="(o: { name: string }) => o.name"
            @open="onOpenCc"
            @pick="onPickCc"
          />
        </div>

        <!-- Transmisi -->
        <div>
          <p class="text-xs text-gray-500 mb-2">Transmisi</p>

          <div v-if="loading.transmission" class="flex items-center gap-2 py-1">
            <svg class="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <span class="text-xs text-gray-400">Memuat transmisi…</span>
          </div>

          <div v-else-if="options.transmission.length" class="grid gap-2"
            :class="{
              'grid-cols-2': options.transmission.length === 1 || options.transmission.length === 2,
              'grid-cols-3': options.transmission.length >= 3,
            }"
          >
            <button
              v-for="opt in options.transmission"
              :key="opt.id"
              type="button"
              @click="onPickTransmission(opt)"
              :class="[
                'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                sel.transmission?.id === opt.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
              ]"
            >
              {{ opt.name }}
            </button>
          </div>
          <div v-else class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-300 cursor-not-allowed select-none">
            {{ sel.cc !== null ? 'Memuat…' : 'Pilih CC terlebih dahulu' }}
          </div>
        </div>

        <!-- Bahan Bakar -->
        <div>
          <p class="text-xs text-gray-500 mb-1">Bahan Bakar</p>
          <SelectField
            placeholder="Pilih bahan bakar"
            :options="options.fuelType"
            :loading="loading.fuelType"
            :disabled="!sel.transmission"
            :value="sel.fuelType"
            :get-label="(o: string) => o"
            @open="onOpenFuelType"
            @pick="onPickFuelType"
          />
        </div>

        <!-- Periode Pasar -->
        <div>
          <p class="text-xs text-gray-500 mb-1">Periode Pasar</p>
          <SelectField
            placeholder="Pilih periode"
            :options="options.marketPeriod"
            :loading="loading.marketPeriod"
            :disabled="!sel.fuelType"
            :value="sel.marketPeriod"
            :get-label="(o: { market_period: string }) => o.market_period"
            @open="onOpenMarketPeriod"
            @pick="onPickMarketPeriod"
          />
        </div>

        <!-- Kendaraan ditemukan -->
        <Transition name="slide-fade">
          <div
            v-if="vehicleId"
            class="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-green-600 font-medium">Kendaraan ditemukan</p>
              <p class="text-sm font-semibold text-gray-800 truncate">{{ vehicleName }}</p>
            </div>
          </div>
        </Transition>

        <p v-if="detailError" class="text-xs text-red-500">{{ detailError }}</p>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineComponent, h, onMounted, Teleport } from 'vue'
import { useInspectionVehicle } from '../../composables/useInspectionVehicle'
import {
  getBrands, getModels, getTypes, getYears, getCc,
  getTransmissions, getFuelTypes, getMarketPeriods, getVehicleDetail,
  checkVehicleByPlate,
} from '../../services/inspectionVehicleService'

// ── Types ─────────────────────────────────────────────────────
type IdOpt   = { id: number; name: string }
type YearOpt = { year: number; vehicle_count?: number }
type CcOpt   = { cc: number; name: string; vehicle_count?: number }
type MktOpt  = { market_period: string; vehicle_count?: number }

type PlateRegion  = { code: string; areas: string[] }
type PlateWarning = { message: string; status: string; status_label: string }

// ── Props ─────────────────────────────────────────────────────
const props = defineProps<{
  initialVehicleDetail?: {
    brand?:         IdOpt | string | null
    model?:         IdOpt | string | null
    type?:          IdOpt | string | null
    year?:          number | string | null
    cc?:            CcOpt | number | string | null
    transmission?:  IdOpt | string | null
    fuel_type?:     string | null
    market_period?: string | null
    vehicle_id?:    number | null
    vehicle_name?:  string | null
  } | null
}>()

// ── Global state ──────────────────────────────────────────────
const {
  vehicleId, vehicleName,
  _plateArea, _plateNumber, _plateSuffix,
  setVehicle,
} = useInspectionVehicle()

// ── Plate check state ─────────────────────────────────────────
const plateChecking      = ref(false)
const plateRegion        = ref<PlateRegion | null>(null)
const plateWarning       = ref<PlateWarning | null>(null)
const plateInvalidMsg    = ref<string | null>(null)  // pesan error wilayah tidak valid

// Flag: apakah data sudah di-seed dari initialVehicleDetail atau plate check
// Kalau true → jangan auto-check nopol, hanya check kalau user ubah nopol
const plateDataSeeded = ref(false)

// Computed: plate lengkap
const licensePlate = computed(() => {
  const a = _plateArea.value.trim()
  const n = _plateNumber.value.trim()
  const s = _plateSuffix.value.trim()
  if (!a || !n || !s) return ''
  return `${a} ${n} ${s}`
})

// ── Plate input handlers ──────────────────────────────────────
const onPlateAreaInput = () => {
  _plateArea.value = _plateArea.value.replace(/[^a-zA-Z]/g, '').toUpperCase()
  onPlateChanged()
}
const onPlateNumberInput = () => {
  _plateNumber.value = _plateNumber.value.replace(/[^0-9]/g, '').slice(0, 4)
  onPlateChanged()
}
const onPlateSuffixInput = () => {
  _plateSuffix.value = _plateSuffix.value.replace(/[^a-zA-Z]/g, '').toUpperCase()
  onPlateChanged()
}

// Dipanggil tiap kali user mengetik di field nopol
// Reset seed flag → kalau plate sudah lengkap akan trigger check
let plateDebounceTimer: ReturnType<typeof setTimeout> | null = null
const onPlateChanged = () => {
  // Reset warning, region & invalid msg saat user mengetik ulang
  plateRegion.value   = null
  plateWarning.value  = null
  plateInvalidMsg.value = null

  // Kalau data sebelumnya dari seed/initial → mark sebagai "sudah diubah user"
  plateDataSeeded.value = false

  if (plateDebounceTimer) clearTimeout(plateDebounceTimer)
  plateDebounceTimer = setTimeout(() => {
    if (licensePlate.value) {
      doCheckPlate(licensePlate.value)
    }
  }, 600)
}

// ── Plate check ───────────────────────────────────────────────
// Tiga skenario response:
//  Case 1 — nopol tidak valid  : success:false, HTTP 4xx, message di root
//  Case 2 — valid + ada data   : success:true, region & warning di resBody.data
//  Case 3 — valid + no data    : success:true, data:null, region di root resBody, message di root
const doCheckPlate = async (plate: string) => {
  plateChecking.value   = true
  plateRegion.value     = null
  plateWarning.value    = null
  plateInvalidMsg.value = null

  try {
    const res     = await checkVehicleByPlate(plate)
    const resBody = res.data  // { success, data, region?, message? }

    // Region: case 2 → resBody.data.region | case 3 → resBody.region
    const region  = resBody?.data?.region ?? resBody?.region ?? null
    // Warning: hanya ada di case 2
    const warning = resBody?.data?.warning ?? null
    // Pesan info: case 3 → resBody.message ("Belum ada data inspeksi")
    const msgInfo = resBody?.message ?? null

    if (region) {
      plateRegion.value = region as PlateRegion
    }

    if (warning) {
      plateWarning.value = warning as PlateWarning
    }

    // Tampilkan pesan info kalau tidak ada data inspection (case 3)
    if (!resBody?.data?.inspection && msgInfo) {
      plateInvalidMsg.value = msgInfo
    }

    // Kalau ada vehicle_detail dari inspection → auto-fill selector (case 2)
    if (resBody?.data?.inspection?.vehicle_detail) {
      const inspection = resBody.data.inspection
      const vd         = inspection.vehicle_detail
      applyVehicleDetail({
        brand:         vd.brand,
        model:         vd.model,
        type:          vd.type,
        year:          vd.year,
        cc:            vd.cc,
        transmission:  vd.transmission,
        fuel_type:     vd.fuel_type,
        market_period: vd.market_period,
        vehicle_id:    vd.vehicle_id ?? inspection.vehicle_id,
        vehicle_name:  vd.vehicle_name ?? inspection.vehicle_name,
      })
      plateDataSeeded.value = true
    }
  } catch (e: any) {
    // Case 1: success:false → axios throw 4xx, ambil message dari response body
    const msg = e?.response?.data?.message
    if (msg) {
      plateInvalidMsg.value = msg
    }
  } finally {
    plateChecking.value = false
  }
}

// ── Apply vehicle detail (dari plate check atau initialVehicleDetail) ─────
const applyVehicleDetail = (d: NonNullable<typeof props.initialVehicleDetail>) => {
  const brandOpt = parseIdOpt(d!.brand)
  const modelOpt = parseIdOpt(d!.model)
  const typeOpt  = parseIdOpt(d!.type)
  const transOpt = parseIdOpt(d!.transmission)
  const ccNum    = parseCcVal(d!.cc)

  if (brandOpt && modelOpt && typeOpt && transOpt && ccNum !== null) {
    sel.brand        = brandOpt
    sel.model        = modelOpt
    sel.type         = typeOpt
    sel.year         = d!.year ? Number(d!.year) : null
    sel.cc           = ccNum
    if (typeof d!.cc === 'object' && d!.cc && 'name' in d!.cc) {
      selCcName.value = (d!.cc as CcOpt).name
    }
    sel.transmission = transOpt
    sel.fuelType     = d!.fuel_type ?? ''
    sel.marketPeriod = d!.market_period ?? ''

    if (d!.vehicle_id && d!.vehicle_name) {
      setVehicle(d!.vehicle_id, d!.vehicle_name)
    }

    // Isi transmisi di background agar radio pills tampil
    options.transmission = []
    fetchTransmissions()
  }
}

// ── Errors & detailError ──────────────────────────────────────
const errors      = reactive({ area: '', number: '', suffix: '' })
const detailError = ref('')

defineExpose({
  validate(): boolean {
    errors.area = errors.number = errors.suffix = ''
    detailError.value = ''
    let ok = true
    if (!_plateArea.value)   { errors.area   = 'Kode daerah wajib diisi'; ok = false }
    if (!_plateNumber.value) { errors.number = 'Angka wajib diisi'; ok = false }
    if (!_plateSuffix.value) { errors.suffix = 'Huruf belakang wajib diisi'; ok = false }
    if (!vehicleId.value)    { detailError.value = 'Pilih kendaraan hingga periode pasar'; ok = false }
    return ok
  }
})

// ── Options & loading ─────────────────────────────────────────
const options = reactive({
  brand:        [] as IdOpt[],
  model:        [] as IdOpt[],
  type:         [] as IdOpt[],
  year:         [] as YearOpt[],
  cc:           [] as CcOpt[],
  transmission: [] as IdOpt[],
  fuelType:     [] as string[],
  marketPeriod: [] as MktOpt[],
})

const loading = reactive({
  brand: false, model: false, type: false, year: false,
  cc: false, transmission: false, fuelType: false, marketPeriod: false,
})

// ── Selected state ────────────────────────────────────────────
const sel = reactive({
  brand:        null as IdOpt | null,
  model:        null as IdOpt | null,
  type:         null as IdOpt | null,
  year:         null as number | null,
  cc:           null as number | null,
  transmission: null as IdOpt | null,
  fuelType:     '',
  marketPeriod: '',
})

const selCcName = ref('')

// ── Helper parse ──────────────────────────────────────────────
const parseIdOpt = (v: any): IdOpt | null => {
  if (!v) return null
  if (typeof v === 'object' && 'id' in v && v.id) return v as IdOpt
  return null
}
const parseCcVal = (v: any): number | null => {
  if (v === null || v === undefined) return null
  if (typeof v === 'object' && 'cc' in v) return Number(v.cc)
  const n = Number(v)
  return isNaN(n) ? null : n
}

// ── Reset downstream ──────────────────────────────────────────
const resetFrom = (from: 'model'|'type'|'year'|'cc'|'transmission'|'fuelType'|'marketPeriod') => {
  const order = ['model','type','year','cc','transmission','fuelType','marketPeriod']
  const idx   = order.indexOf(from)
  if (idx <= 0) { sel.model        = null; options.model        = [] }
  if (idx <= 1) { sel.type         = null; options.type         = [] }
  if (idx <= 2) { sel.year         = null; options.year         = [] }
  if (idx <= 3) { sel.cc           = null; options.cc           = [] }
  if (idx <= 4) { sel.transmission = null; options.transmission = [] }
  if (idx <= 5) { sel.fuelType     = '';   options.fuelType     = [] }
  sel.marketPeriod = ''; options.marketPeriod = []
  setVehicle(null, '')
  detailError.value = ''
}

// ── Fetch — hanya jalan kalau options belum terisi ────────────
const fetchBrands = async () => {
  if (options.brand.length) return
  loading.brand = true
  try { options.brand = (await getBrands()).data?.data ?? [] }
  finally { loading.brand = false }
}
const fetchModels = async () => {
  if (!sel.brand?.id || options.model.length) return
  loading.model = true
  try { options.model = (await getModels(sel.brand.id)).data?.data ?? [] }
  finally { loading.model = false }
}
const fetchTypes = async () => {
  if (!sel.model?.id || options.type.length) return
  loading.type = true
  try { options.type = (await getTypes(sel.brand!.id, sel.model.id)).data?.data ?? [] }
  finally { loading.type = false }
}
const fetchYears = async () => {
  if (!sel.type?.id || options.year.length) return
  loading.year = true
  try { options.year = (await getYears(sel.brand!.id, sel.model!.id, sel.type.id)).data?.data ?? [] }
  finally { loading.year = false }
}
const fetchCc = async () => {
  if (sel.year === null || options.cc.length) return
  loading.cc = true
  try { options.cc = (await getCc(sel.brand!.id, sel.model!.id, sel.type!.id, sel.year)).data?.data ?? [] }
  finally { loading.cc = false }
}
const fetchTransmissions = async () => {
  if (sel.cc === null || options.transmission.length) return
  loading.transmission = true
  try { options.transmission = (await getTransmissions(sel.brand!.id, sel.model!.id, sel.type!.id, sel.year!, sel.cc)).data?.data ?? [] }
  finally { loading.transmission = false }
}
const fetchFuelTypes = async () => {
  if (!sel.transmission?.id || options.fuelType.length) return
  loading.fuelType = true
  try {
    const raw = (await getFuelTypes(sel.brand!.id, sel.model!.id, sel.type!.id, sel.year!, sel.cc!, sel.transmission.id)).data?.data ?? []
    options.fuelType = raw.map((v: any) => typeof v === 'string' ? v : String(v))
  }
  finally { loading.fuelType = false }
}
const fetchMarketPeriods = async () => {
  if (!sel.fuelType || options.marketPeriod.length) return
  loading.marketPeriod = true
  try { options.marketPeriod = (await getMarketPeriods(sel.brand!.id, sel.model!.id, sel.type!.id, sel.year!, sel.cc!, sel.transmission!.id, sel.fuelType)).data?.data ?? [] }
  finally { loading.marketPeriod = false }
}
const doFetchVehicleDetail = async () => {
  if (!sel.brand?.id || !sel.model?.id || !sel.type?.id ||
      sel.year === null || sel.cc === null || !sel.transmission?.id ||
      !sel.fuelType || !sel.marketPeriod) return
  detailError.value = ''
  try {
    const data = (await getVehicleDetail({
      brand_id: sel.brand.id, model_id: sel.model.id, type_id: sel.type.id,
      year: sel.year, cc: sel.cc, transmission_id: sel.transmission.id,
      fuel_type: sel.fuelType, market_period: sel.marketPeriod,
    })).data?.data
    const vid   = data?.vehicle_id ?? data?.vehicles?.[0]?.id ?? null
    const vname = data?.vehicles?.[0]?.full_name ?? ''
    if (vid) setVehicle(vid, vname)
    else { detailError.value = 'Kendaraan tidak ditemukan'; setVehicle(null, '') }
  } catch {
    detailError.value = 'Gagal mengambil detail kendaraan'
    setVehicle(null, '')
  }
}

// ── Pick handlers ─────────────────────────────────────────────
const onPickBrand = (v: IdOpt) => {
  resetFrom('model'); sel.brand = v
  fetchModels()
}
const onPickModel = (v: IdOpt) => {
  resetFrom('type'); sel.model = v
  fetchTypes()
}
const onPickType = (v: IdOpt) => {
  resetFrom('year'); sel.type = v
  fetchYears()
}
const onPickYear = (v: YearOpt) => {
  resetFrom('cc'); sel.year = v.year
  fetchCc()
}
const onPickCc = (v: CcOpt) => {
  resetFrom('transmission'); sel.cc = v.cc; selCcName.value = v.name
  fetchTransmissions()
}
const onPickTransmission = (v: IdOpt) => {
  sel.transmission = v
  options.fuelType = []; sel.fuelType = ''
  options.marketPeriod = []; sel.marketPeriod = ''
  setVehicle(null, ''); detailError.value = ''
  fetchFuelTypes()
}
const onPickFuelType = (v: string) => {
  options.marketPeriod = []; sel.marketPeriod = ''
  sel.fuelType = v
  setVehicle(null, ''); detailError.value = ''
  fetchMarketPeriods()
}
const onPickMarketPeriod = async (v: MktOpt) => {
  sel.marketPeriod = v.market_period
  await doFetchVehicleDetail()
}

// Open handlers — request hanya kalau options belum ada
const onOpenBrand        = () => fetchBrands()
const onOpenModel        = () => fetchModels()
const onOpenType         = () => fetchTypes()
const onOpenYear         = () => fetchYears()
const onOpenCc           = () => fetchCc()
const onOpenFuelType     = () => fetchFuelTypes()
const onOpenMarketPeriod = () => fetchMarketPeriods()

// ─────────────────────────────────────────────────────────────
// INIT DARI EXISTING DATA
// ─────────────────────────────────────────────────────────────
onMounted(async () => {
  const d = props.initialVehicleDetail

  if (!d) {
    // Mode baru: tidak ada data
    fetchBrands()
    return
  }

  const brandOpt = parseIdOpt(d.brand)
  const modelOpt = parseIdOpt(d.model)
  const typeOpt  = parseIdOpt(d.type)
  const transOpt = parseIdOpt(d.transmission)
  const ccNum    = parseCcVal(d.cc)

  // ── FORMAT BARU (semua ada id) ────────────────────────────
  if (brandOpt && modelOpt && typeOpt && transOpt && ccNum !== null) {
    applyVehicleDetail(d)

    // Mark seeded → tidak akan auto-check plate saat mount
    // (plate check hanya kalau user edit nopol)
    plateDataSeeded.value = true
    return
  }

  // ── FORMAT LAMA (string only) ─────────────────────────────
  const brandName = typeof d.brand === 'string' ? d.brand : (d.brand as any)?.name ?? ''
  const modelName = typeof d.model === 'string' ? d.model : (d.model as any)?.name ?? ''
  const typeName  = typeof d.type  === 'string' ? d.type  : (d.type  as any)?.name ?? ''
  const transName = typeof d.transmission === 'string' ? d.transmission : (d.transmission as any)?.name ?? ''

  if (brandName) sel.brand        = { id: 0, name: brandName }
  if (modelName) sel.model        = { id: 0, name: modelName }
  if (typeName)  sel.type         = { id: 0, name: typeName }
  if (d.year)    sel.year         = Number(d.year)
  if (ccNum)     sel.cc           = ccNum
  if (transName) sel.transmission = { id: 0, name: transName }
  if (d.fuel_type)     sel.fuelType     = d.fuel_type
  if (d.market_period) sel.marketPeriod = d.market_period

  plateDataSeeded.value = true

  try {
    await fetchBrands()
    const brand = options.brand.find(b => b.name.toLowerCase() === brandName.toLowerCase())
    if (!brand) return
    sel.brand = brand

    await fetchModels()
    const model = options.model.find(m => m.name.toLowerCase() === modelName.toLowerCase())
    if (!model) return
    sel.model = model

    await fetchTypes()
    const type = options.type.find(t => t.name.toLowerCase() === typeName.toLowerCase())
    if (!type) return
    sel.type = type

    await fetchYears()
    const yr = options.year.find(y => y.year === Number(d.year))
    if (yr) sel.year = yr.year

    if (sel.year !== null) {
      await fetchCc()
      const cc = options.cc.find(c => c.cc === ccNum)
      if (cc) sel.cc = cc.cc
    }

    if (sel.cc !== null) {
      await fetchTransmissions()
      const trans = options.transmission.find(t => t.name.toLowerCase() === transName.toLowerCase())
      if (trans) sel.transmission = trans
    }

    if (sel.transmission?.id) {
      await fetchFuelTypes()
      if (d.fuel_type && options.fuelType.includes(d.fuel_type)) sel.fuelType = d.fuel_type
    }

    if (sel.fuelType) {
      await fetchMarketPeriods()
      const mkt = options.marketPeriod.find(m => m.market_period === d.market_period)
      if (mkt) sel.marketPeriod = mkt.market_period
    }

    if (d.vehicle_id && d.vehicle_name) {
      setVehicle(d.vehicle_id as number, d.vehicle_name)
    }
  } catch (e) {
    console.error('[VehicleSelector] Gagal resolve format lama:', e)
  }
})

// ─────────────────────────────────────────────────────────────
// SelectField — dropdown pakai fixed positioning + Teleport
// ─────────────────────────────────────────────────────────────
const SelectField = defineComponent({
  name: 'SelectField',
  props: {
    placeholder: { type: String,  default: 'Pilih...' },
    options:     { type: Array,   default: () => [] },
    loading:     { type: Boolean, default: false },
    disabled:    { type: Boolean, default: false },
    value:       { type: String,  default: '' },
    getLabel:    { type: Function as any, default: (o: any) => String(o) },
  },
  emits: ['open', 'pick'],
  setup(p, { emit }) {
    const isOpen    = ref(false)
    const btnRef    = ref<HTMLButtonElement | null>(null)
    const dropStyle = ref({ top: '0px', left: '0px', width: '0px' })

    const calcPos = () => {
      if (!btnRef.value) return
      const r = btnRef.value.getBoundingClientRect()
      const spaceBelow = window.innerHeight - r.bottom
      const dropH      = Math.min(224, p.options.length * 44 + 16)
      const openUp     = spaceBelow < dropH && r.top > dropH

      dropStyle.value = {
        top:   openUp ? `${r.top - dropH - 4}px` : `${r.bottom + 4}px`,
        left:  `${r.left}px`,
        width: `${r.width}px`,
      }
    }

    const toggle = () => {
      if (p.disabled) return
      if (!isOpen.value) {
        emit('open')
        setTimeout(calcPos, 0)
      }
      isOpen.value = !isOpen.value
    }
    const close = () => { isOpen.value = false }
    const pick  = (opt: any) => { emit('pick', opt); close() }

    const onScroll = () => { if (isOpen.value) calcPos() }

    return () => h('div', { class: 'relative' }, [

      h('button', {
        ref:      btnRef,
        type:     'button',
        disabled: p.disabled,
        onClick:  toggle,
        class: [
          'w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-lg text-sm transition-all focus:outline-none',
          isOpen.value ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 hover:border-gray-400',
          p.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ],
      }, [
        h('span', { class: p.value ? 'text-gray-800 font-medium truncate' : 'text-gray-400' },
          p.value || p.placeholder),
        p.loading
          ? h('svg', { class: 'w-4 h-4 animate-spin text-blue-500 flex-shrink-0', fill: 'none', viewBox: '0 0 24 24' }, [
              h('circle', { class: 'opacity-25', cx: '12', cy: '12', r: '10', stroke: 'currentColor', 'stroke-width': '4' }),
              h('path',   { class: 'opacity-75', fill: 'currentColor', d: 'M4 12a8 8 0 018-8v8H4z' }),
            ])
          : h('svg', {
              class: ['w-4 h-4 text-gray-400 transition-transform flex-shrink-0', isOpen.value ? 'rotate-180' : ''],
              fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24',
            }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19 9l-7 7-7-7' })]),
      ]),

      isOpen.value
        ? h(Teleport, { to: 'body' }, [
            h('div', {
              class:    'fixed inset-0 z-[60]',
              onClick:  close,
              onScroll: onScroll,
            }),
            h('div', {
              class: 'fixed z-[61] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-56 overflow-y-auto overscroll-contain',
              style: dropStyle.value,
            },
              p.options.length === 0
                ? [h('p', { class: 'px-4 py-3 text-sm text-gray-400 text-center' },
                    p.loading ? 'Memuat…' : 'Tidak ada data')]
                : (p.options as any[]).map((opt, idx) => {
                    const label = p.getLabel(opt)
                    return h('button', {
                      key:     idx,
                      type:    'button',
                      onClick: (e: Event) => { e.stopPropagation(); pick(opt) },
                      class: [
                        'w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between',
                        label === p.value
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50',
                      ],
                    }, [
                      label,
                      label === p.value
                        ? h('svg', {
                            class: 'w-4 h-4 text-blue-600 flex-shrink-0',
                            fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24',
                          }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M5 13l4 4L19 7' })])
                        : null,
                    ])
                  })
            ),
          ])
        : null,
    ])
  },
})
</script>

<style scoped>
.slide-fade-enter-active { transition: all 0.2s ease; }
.slide-fade-leave-active { transition: all 0.15s ease; }
.slide-fade-enter-from,
.slide-fade-leave-to     { opacity: 0; transform: translateY(-6px); }
</style>