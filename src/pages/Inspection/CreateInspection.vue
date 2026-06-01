<template>
  <div class="create-inspection-page">
    <!-- STICKY BLUE HEADER -->
    <div class="page-header">
        <button @click="router.back()" class="mr-3 p-2 hover:bg-white/20 rounded-full transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      <div class="header-title-wrap">
        <h1 class="header-title">Create Inspection</h1>
      </div>
    </div>

    <!-- SCROLLABLE CONTENT -->
    <div class="create-inspection">
      <!-- CUSTOMER SECTION -->
      <div class="card">
        <h3 class="card-title">Data Customer</h3>

        <div class="field-group">
          <p class="field-label">Nomor Telepon <span class="required-badge">Wajib</span></p>
          <div class="input-wrapper" :class="{ focused: focusedField === 'phone', 'has-error': phoneError }">
            <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
            <input
              type="tel"
              v-model="customerPhone"
              placeholder="Masukkan nomor telepon (min 10, max 13 digit)"
              class="styled-input"
              @focus="focusedField = 'phone'"
              @blur="handlePhoneBlur"
              @input="handlePhoneInput"
              :disabled="loadingCustomer"
            />
            <div v-if="loadingCustomer" class="loading-spinner-small"></div>
            <svg v-else-if="customerFound && customerPhone.length >= 10" class="check-icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p v-if="phoneError" class="error-text">{{ phoneError }}</p>
          <p v-else-if="customerPhone.length >= 10 && !customerFound && !loadingCustomer && !customerChecked" class="hint-text">
            Nomor belum terdaftar, silahkan isi form dibawah
          </p>
        </div>

        <!-- Customer Info (when found) -->
        <div v-if="customerFound && foundCustomer" class="customer-info-box">
          <div class="info-row">
            <span class="info-label">Nama:</span>
            <span class="info-value">{{ foundCustomer.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">{{ foundCustomer.email || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Alamat:</span>
            <span class="info-value">{{ foundCustomer.address || '-' }}</span>
          </div>
          <div class="info-note">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="note-icon">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Data customer otomatis terisi
          </div>
        </div>

        <!-- New Customer Form (when phone not found) -->
        <div v-if="showNewCustomerForm" class="new-customer-form">
          <div class="field-group">
            <p class="field-label">Nama Lengkap <span class="required-badge">Wajib</span></p>
            <div class="input-wrapper" :class="{ focused: focusedField === 'name' }">
              <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <input
                type="text"
                v-model="newCustomer.name"
                placeholder="Masukkan nama lengkap"
                class="styled-input"
                @focus="focusedField = 'name'"
                @blur="focusedField = ''"
              />
            </div>
          </div>

          <div class="field-group">
            <p class="field-label">Email <span class="optional-badge">Opsional</span></p>
            <div class="input-wrapper" :class="{ focused: focusedField === 'email' }">
              <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <input
                type="email"
                v-model="newCustomer.email"
                placeholder="email@example.com"
                class="styled-input"
                @focus="focusedField = 'email'"
                @blur="focusedField = ''"
              />
            </div>
          </div>

          <div class="field-group">
            <p class="field-label">Alamat <span class="optional-badge">Opsional</span></p>
            <div class="input-wrapper" :class="{ focused: focusedField === 'address' }">
              <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <input
                type="text"
                v-model="newCustomer.address"
                placeholder="Jl. Contoh No. 123"
                class="styled-input"
                @focus="focusedField = 'address'"
                @blur="focusedField = ''"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- VEHICLE -->
      <div class="card">
        <h3 class="card-title">Data Kendaraan</h3>
        <VehicleSelector />
      </div>

      <!-- TEMPLATE -->
      <div class="card">
        <h3 class="card-title">Template Inspeksi</h3>

        <div v-if="loadingTemplates" class="loading-row">
          <svg class="spin-icon" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <span class="loading-text">Memuat template…</span>
        </div>

        <div v-else-if="templates.length === 1 && templates[0]">
          <p class="field-label">Template digunakan</p>
          <div class="single-template-box">
            <svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>{{ templates[0].name }}</span>
          </div>
        </div>

        <div v-else-if="templates.length > 1">
          <p class="field-label">Pilih Template</p>
          <div class="select-wrapper" :class="{ open: templateDropOpen }">
            <button
              type="button"
              class="select-trigger"
              :class="{ 'is-open': templateDropOpen }"
              @click="toggleTemplateDrop"
            >
              <span :class="selectedTemplateId ? 'value-text' : 'placeholder-text'">
                {{ selectedTemplateName || '-- pilih template --' }}
              </span>
              <svg class="chevron" :class="{ rotated: templateDropOpen }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <div v-if="templateDropOpen" class="dropdown-list">
              <button
                v-for="tpl in templates"
                :key="tpl.id"
                type="button"
                class="dropdown-item"
                :class="{ active: selectedTemplateId === tpl.id }"
                @click="pickTemplate(tpl)"
              >
                {{ tpl.name }}
                <svg v-if="selectedTemplateId === tpl.id" class="item-check"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-text">Tidak ada template tersedia.</div>
      </div>

      <!-- SCHEDULING -->
      <div class="card">
        <div class="card-header-row">
          <h3 class="card-title mb-0">Jadwalkan Inspeksi</h3>
          <label class="toggle-switch">
            <input type="checkbox" v-model="isScheduled" />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div v-if="isScheduled" class="schedule-grid">
          <div class="field-group">
            <p class="field-label">Tanggal</p>
            <div class="input-wrapper" :class="{ focused: focusedField === 'date' }">
              <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <input
                type="date"
                v-model="scheduleDate"
                class="styled-input"
                @focus="focusedField = 'date'"
                @blur="focusedField = ''"
              />
            </div>
          </div>

          <div class="field-group">
            <p class="field-label">Waktu</p>
            <div class="input-wrapper" :class="{ focused: focusedField === 'time' }">
              <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <input
                type="time"
                v-model="scheduleTime"
                class="styled-input"
                @focus="focusedField = 'time'"
                @blur="focusedField = ''"
              />
            </div>
          </div>
        </div>

        <p v-else class="muted-hint">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="hint-icon">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          Inspeksi akan langsung dimulai
        </p>
      </div>

      <!-- FORM — Reference -->
      <div class="card">
        <h3 class="card-title">Informasi Tambahan</h3>

        <div class="field-group">
          <p class="field-label">Referensi <span class="optional-badge">Opsional</span></p>
          <div class="input-wrapper" :class="{ focused: focusedField === 'ref' }">
            <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 7h10M7 11h10M7 15h6"/>
            </svg>
            <input
              type="text"
              v-model="form.reference"
              placeholder="Masukkan referensi (opsional)"
              class="styled-input"
              @focus="focusedField = 'ref'"
              @blur="focusedField = ''"
            />
          </div>
        </div>
      </div>

      <!-- VALIDATION HINTS -->
      <div v-if="!isFormReady" class="validation-hints">
        <p class="hint-title">Lengkapi data berikut untuk melanjutkan:</p>
        <ul>
          <li v-if="!isCustomerValid">• Isi nomor telepon dan data customer valid</li>
          <li v-if="!selectedTemplateId && templates.length > 1">• Pilih template inspeksi</li>
          <li v-if="!vehicleId">• Pilih kendaraan hingga periode pasar</li>
          <li v-if="isScheduled && !scheduleDate">• Isi tanggal jadwal</li>
          <li v-if="isScheduled && !scheduleTime">• Isi waktu jadwal</li>
        </ul>
      </div>

      <!-- SUBMIT -->
      <button
        class="btn-submit"
        :class="{ 'btn-ready': isFormReady }"
        @click="handleSubmit"
        :disabled="!isFormReady || loading"
      >
        <svg v-if="loading" class="spin-icon-sm" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <svg v-else-if="isScheduled" class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <svg v-else class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ loading ? 'Menyimpan...' : submitLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import VehicleSelector from '../../components/inspection/VehicleSelector.vue'
import { getFormTemplates } from '../../services/inspectionTemplateService'
import { storeInspection } from '../../services/createInspectionService'
import type { InspectionTemplate } from '../../types/inspectionTemplate'
import { useInspectionVehicle } from '../../composables/useInspectionVehicle'
import customerSellerService from '../../services/customerSellerService'
import type { Customer } from '../../types/customerSeller'

const router = useRouter()

// ─── VEHICLE ────────────────────────────────────────────────
const {
  vehicleId,
  vehicleName,
  _plateArea,
  _plateNumber,
  _plateSuffix,
  reset: resetVehicle,
} = useInspectionVehicle()

const getLicensePlate = () =>
  `${_plateArea.value} ${_plateNumber.value} ${_plateSuffix.value}`

// ─── CUSTOMER ───────────────────────────────────────────────
const customerPhone = ref('')
const customerId = ref<number | null>(null)
const foundCustomer = ref<Customer | null>(null)
const customerFound = ref(false)
const loadingCustomer = ref(false)
const customerChecked = ref(false)
const phoneError = ref('')

const newCustomer = ref({
  name: '',
  email: '',
  address: ''
})

const showNewCustomerForm = computed(() => {
  return customerPhone.value.length >= 10 &&
         !customerFound.value &&
         !loadingCustomer.value &&
         customerChecked.value
})

const isCustomerValid = computed(() => {
  if (!customerPhone.value || customerPhone.value.length < 10) return false

  if (customerFound.value && foundCustomer.value) {
    return true
  }

  if (showNewCustomerForm.value && newCustomer.value.name.trim()) {
    return true
  }

  return false
})

const handlePhoneInput = () => {
  if (customerChecked.value) {
    resetCustomerState()
  }
  phoneError.value = ''
}

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10,13}$/
  if (!phoneRegex.test(phone)) {
    phoneError.value = 'Nomor telepon harus terdiri dari 10-13 digit angka'
    return false
  }
  return true
}

const handlePhoneBlur = async () => {
  const phone = customerPhone.value.trim()

  if (!phone) {
    resetCustomerState()
    return
  }

  if (!validatePhone(phone)) {
    resetCustomerState()
    return
  }

  await checkCustomerByPhone(phone)
}

const checkCustomerByPhone = async (phone: string) => {
  loadingCustomer.value = true
  customerChecked.value = true

  try {
    const result = await customerSellerService.findByPhone(phone)

    if (result.success && result.found && result.data) {
      customerFound.value = true
      foundCustomer.value = result.data
      customerId.value = result.data.id
      newCustomer.value = { name: '', email: '', address: '' }
      phoneError.value = ''
    } else {
      customerFound.value = false
      foundCustomer.value = null
      customerId.value = null
    }
  } catch (error) {
    console.error('Error checking customer:', error)
    customerFound.value = false
    foundCustomer.value = null
    customerId.value = null
    phoneError.value = 'Gagal memeriksa nomor telepon'
  } finally {
    loadingCustomer.value = false
  }
}

const resetCustomerState = () => {
  customerFound.value = false
  foundCustomer.value = null
  customerId.value = null
  customerChecked.value = false
  newCustomer.value = { name: '', email: '', address: '' }
  phoneError.value = ''
}

watch(() => newCustomer.value.name, (newName) => {
  if (showNewCustomerForm.value && newName.trim()) {
    phoneError.value = ''
  }
})

// ─── TEMPLATES ──────────────────────────────────────────────
const templates          = ref<InspectionTemplate[]>([])
const selectedTemplateId = ref<number | null>(null)
const loadingTemplates   = ref(false)
const templateDropOpen   = ref(false)

const selectedTemplateName = computed(() =>
  templates.value.find(t => t.id === selectedTemplateId.value)?.name ?? ''
)

const toggleTemplateDrop = () => { templateDropOpen.value = !templateDropOpen.value }
const pickTemplate = (tpl: InspectionTemplate) => {
  selectedTemplateId.value = tpl.id
  templateDropOpen.value   = false
}

const normalizeTemplates = (data: unknown) =>
  Array.isArray(data) ? (data as InspectionTemplate[]) : [data as InspectionTemplate]

const loadTemplates = async () => {
  loadingTemplates.value = true
  try {
    const res      = await getFormTemplates()
    const response = res.data
    templates.value = normalizeTemplates(response.data)

    if (
      templates.value.length === 1 ||
      response.source === 'user_default' ||
      response.source === 'global_default'
    ) {
      selectedTemplateId.value = templates.value[0]?.id ?? null
    }
  } finally {
    loadingTemplates.value = false
  }
}

// ─── SCHEDULING ─────────────────────────────────────────────
const isScheduled  = ref(false)
const scheduleDate = ref('')
const scheduleTime = ref('')

// ─── FORM ────────────────────────────────────────────────────
const form         = ref({ reference: '' })
const focusedField = ref('')
const loading      = ref(false)

// ─── COMPUTED ────────────────────────────────────────────────
const isFormReady = computed(() => {
  if (!isCustomerValid.value) return false
  if (!selectedTemplateId.value) return false
  if (!vehicleId.value)          return false
  if (isScheduled.value && (!scheduleDate.value || !scheduleTime.value)) return false
  return true
})

const submitLabel = computed(() =>
  isScheduled.value ? 'Simpan Jadwal' : 'Mulai Inspeksi'
)

const getCustomerIdForSubmit = (): number | null => {
  if (customerFound.value && customerId.value) {
    return customerId.value
  }
  return null
}

const getNewCustomerData = () => {
  if (!customerFound.value && showNewCustomerForm.value) {
    return {
      name: newCustomer.value.name,
      phone: customerPhone.value,
      email: newCustomer.value.email || null,
      address: newCustomer.value.address || null
    }
  }
  return null
}

// ─── SUBMIT ──────────────────────────────────────────────────
// ─── SUBMIT ──────────────────────────────────────────────────
const handleSubmit = async () => {
  if (!isFormReady.value) return

  const licensePlate = getLicensePlate()

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const localNow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  let inspectionDate = localNow
  if (isScheduled.value) {
    const timeWithSeconds = scheduleTime.value.length === 5
      ? `${scheduleTime.value}:00`
      : scheduleTime.value
    inspectionDate = `${scheduleDate.value} ${timeWithSeconds}`
  }

  loading.value = true
  try {
    const basePayload: any = {
      inspection_date: inspectionDate,
      is_scheduled:    isScheduled.value,
      license_plate:   licensePlate,
      vehicle_name:    vehicleName.value,
      vehicle_id:      vehicleId.value as number,
      template_id:     selectedTemplateId.value as number,
    }

    // Add customer data
    const existingCustomerId = getCustomerIdForSubmit()
    if (existingCustomerId) {
      basePayload.customer_id = existingCustomerId
    } else {
      const newCustomerData = getNewCustomerData()
      if (newCustomerData) {
        basePayload.customer_name = newCustomerData.name
        basePayload.customer_phone = newCustomerData.phone
        if (newCustomerData.email) basePayload.customer_email = newCustomerData.email
        if (newCustomerData.address) basePayload.customer_address = newCustomerData.address
      }
    }

    if (form.value.reference) {
      basePayload.reference = form.value.reference
    }

    const res = await storeInspection(basePayload)
    const inspectionId = res.data.data.id

    resetVehicle()
    
    if (isScheduled.value) {
      router.push(`/jobs/${inspectionId}`)
    } else {
      router.push(`/form-inspection/${inspectionId}`)
    }
  } catch (err: any) {
    console.error(err)
    const errorMessage = err.response?.data?.message || err.message || 'Gagal create inspection'
    alert(errorMessage)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
/* ─── PAGE WRAPPER ───────────────────────────────────────── */
.create-inspection-page {
  min-height: 100vh;
  background: #f3f4f6;
  display: flex;
  flex-direction: column;
}

/* ─── STICKY BLUE HEADER ─────────────────────────────────── */
.page-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(to right, #2563eb, #3b82f6);
  color: #fff;
  display: flex;
  align-items: center;
  padding: 14px 16px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.back-btn {
  margin-right: 12px;
  padding: 6px;
  border: none;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  cursor: pointer;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.back-btn:hover {
  background: rgba(255,255,255,0.3);
}

.header-title-wrap {
  flex: 1;
}

.header-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

/* ─── SCROLLABLE CONTENT ─────────────────────────────────── */
.create-inspection {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

/* ─── CARD ───────────────────────────────────────────────── */
.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
}

.card-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}
.card-title.mb-0 { margin-bottom: 0; }

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

/* ─── FIELD LABEL ────────────────────────────────────────── */
.field-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.required-badge {
  font-size: 0.65rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 4px;
  padding: 1px 6px;
  font-weight: 500;
}

.optional-badge {
  font-size: 0.65rem;
  background: #f3f4f6;
  color: #9ca3af;
  border-radius: 4px;
  padding: 1px 6px;
  font-weight: 500;
}

/* ─── INPUT WRAPPER ──────────────────────────────────────── */
.input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0 12px;
  background: #fff;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  height: 42px;
}
.input-wrapper.focused {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: #eff6ff;
}
.input-wrapper.has-error {
  border-color: #dc2626;
}
.input-wrapper.has-error.focused {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.input-icon {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  flex-shrink: 0;
  transition: color 0.2s;
}
.focused .input-icon { color: #3b82f6; }

.styled-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.875rem;
  color: #111827;
  font-weight: 500;
}
.styled-input::placeholder { color: #9ca3af; font-weight: 400; }
.styled-input:disabled {
  background: #f9fafb;
  color: #6b7280;
}

.styled-input[type="date"]::-webkit-calendar-picker-indicator,
.styled-input[type="time"]::-webkit-calendar-picker-indicator {
  opacity: 0.5;
  cursor: pointer;
}

/* ─── CUSTOMER INFO BOX ──────────────────────────────────── */
.customer-info-box {
  margin-top: 12px;
  padding: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
}

.info-row {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 0.8125rem;
}

.info-label {
  font-weight: 600;
  color: #166534;
  min-width: 45px;
}

.info-value {
  color: #14532d;
  flex: 1;
}

.info-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #bbf7d0;
  font-size: 0.7rem;
  color: #15803d;
}

.note-icon {
  width: 14px;
  height: 14px;
}

/* ─── NEW CUSTOMER FORM ──────────────────────────────────── */
.new-customer-form {
  margin-top: 12px;
  padding: 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
}

.new-customer-form .field-group {
  margin-bottom: 10px;
}

.new-customer-form .field-group:last-child {
  margin-bottom: 0;
}

/* ─── ERROR & HINT TEXT ──────────────────────────────────── */
.error-text {
  font-size: 0.7rem;
  color: #dc2626;
  margin-top: 4px;
  margin-bottom: 0;
}

.hint-text {
  font-size: 0.7rem;
  color: #f59e0b;
  margin-top: 4px;
  margin-bottom: 0;
}

/* ─── SELECT TRIGGER (template) ──────────────────────────── */
.select-wrapper { position: relative; }

.select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  height: 42px;
  background: #fff;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  text-align: left;
}
.select-trigger:hover:not(:disabled) {
  border-color: #9ca3af;
}
.select-trigger.is-open {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: #eff6ff;
}

.value-text       { color: #111827; font-weight: 500; }
.placeholder-text { color: #9ca3af; }

.chevron {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  flex-shrink: 0;
  transition: transform 0.2s;
}
.chevron.rotated { transform: rotate(180deg); }

/* ─── DROPDOWN LIST ──────────────────────────────────────── */
.dropdown-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  overflow: hidden;
  max-height: 224px;
  overflow-y: auto;
  z-index: 50;
}

.dropdown-item {
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  background: transparent;
  transition: background 0.15s;
}
.dropdown-item:hover { background: #f9fafb; }
.dropdown-item.active {
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 600;
}

.item-check {
  width: 16px; height: 16px;
  color: #2563eb;
  flex-shrink: 0;
}

/* ─── SINGLE TEMPLATE BOX ────────────────────────────────── */
.single-template-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #15803d;
}
.check-icon {
  width: 18px; height: 18px;
  color: #16a34a;
  flex-shrink: 0;
}

.check-icon-small {
  width: 18px;
  height: 18px;
  color: #16a34a;
  flex-shrink: 0;
}

.loading-spinner-small {
  width: 18px;
  height: 18px;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ─── SCHEDULE GRID ──────────────────────────────────────── */
.schedule-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field-group { display: flex; flex-direction: column; }

/* ─── MUTED HINT ─────────────────────────────────────────── */
.muted-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 0.8125rem;
}
.hint-icon {
  width: 14px; height: 14px;
  flex-shrink: 0;
  color: #d1d5db;
}

/* ─── TOGGLE SWITCH ──────────────────────────────────────── */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}
.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}
input:checked + .toggle-slider {
  background-color: #16a34a;
}
input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

/* ─── LOADING ────────────────────────────────────────────── */
.loading-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.loading-text { font-size: 0.8125rem; color: #9ca3af; }
.spin-icon { width: 16px; height: 16px; color: #3b82f6; animation: spin 0.8s linear infinite; }
.spin-icon-sm { width: 16px; height: 16px; color: #fff; animation: spin 0.8s linear infinite; }

/* ─── EMPTY ──────────────────────────────────────────────── */
.empty-text {
  font-size: 0.8125rem;
  color: #d1d5db;
  padding: 6px 0;
}

/* ─── VALIDATION HINTS ───────────────────────────────────── */
.validation-hints {
  background: #fefce8;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 12px;
  font-size: 0.8125rem;
  color: #92400e;
}
.hint-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.validation-hints ul {
  list-style: none;
  padding: 0; margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ─── SUBMIT BUTTON ──────────────────────────────────────── */
.btn-submit {
  width: 100%;
  padding: 13px 16px;
  background: #d1d5db;
  color: #9ca3af;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.25s, color 0.25s, box-shadow 0.25s, transform 0.1s;
  margin-bottom: 24px;
}
.btn-submit.btn-ready {
  background: #16a34a;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);
}
.btn-submit.btn-ready:hover {
  background: #15803d;
  box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4);
  transform: translateY(-1px);
}
.btn-submit.btn-ready:active { transform: translateY(0); }

.btn-icon { width: 18px; height: 18px; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>