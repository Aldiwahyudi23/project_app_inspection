<template>
  <Teleport to="body">
    <div v-if="modelValue" class="est-modal-root">
      <!-- Backdrop -->
      <div class="est-backdrop" @click="close"></div>

      <!-- Sheet -->
      <div class="est-sheet" :class="{ 'est-sheet--visible': mounted }">

        <!-- Header -->
        <div class="est-header">
          <h4 class="est-title">{{ isEdit ? 'Edit Estimasi' : 'Tambah Estimasi' }}</h4>
          <button class="est-close-btn" @click="close">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="icon-close">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="est-body">

          <!-- Part Name -->
          <div class="field-group">
            <label class="field-label">Part / Komponen <span class="req">*</span></label>
            <input
              v-model="form.part_name"
              class="field-input"
              :class="{ 'field-input--error': errors.part_name }"
              placeholder="mis. Ban Depan Kiri"
              type="text"
              autocomplete="off"
            />
            <span v-if="errors.part_name" class="field-error">
              <svg class="err-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              {{ errors.part_name }}
            </span>
          </div>

          <!-- Repair Description -->
          <div class="field-group">
            <label class="field-label">Deskripsi Perbaikan</label>
            <textarea
              v-model="form.repair_description"
              class="field-input field-textarea"
              placeholder="Jelaskan perbaikan yang diperlukan (opsional)"
              rows="2"
            ></textarea>
          </div>

          <!-- Urgency — Radio Pills -->
          <div class="field-group">
            <label class="field-label">Urgensi <span class="req">*</span></label>
            <div class="radio-pill-group">
              <label
                v-for="opt in urgencyOptions" :key="opt.value"
                class="radio-pill"
                :class="[`pill-urgency-${opt.value}`, { active: form.urgency === opt.value }]"
              >
                <input type="radio" v-model="form.urgency" :value="opt.value" hidden />
                <span class="pill-dot"></span>
                <span class="pill-label">{{ opt.label }}</span>
              </label>
            </div>
            <span v-if="errors.urgency" class="field-error">
              <svg class="err-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              {{ errors.urgency }}
            </span>
          </div>

          <!-- Status — Radio Pills -->
          <div class="field-group">
            <label class="field-label">Status Perbaikan <span class="req">*</span></label>
            <div class="radio-pill-group">
              <label
                v-for="opt in statusOptions" :key="opt.value"
                class="radio-pill"
                :class="[`pill-status-${opt.value}`, { active: form.status === opt.value }]"
              >
                <input type="radio" v-model="form.status" :value="opt.value" hidden />
                <span class="pill-dot"></span>
                <span class="pill-label">{{ opt.label }}</span>
              </label>
            </div>
            <span v-if="errors.status" class="field-error">
              <svg class="err-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              {{ errors.status }}
            </span>
          </div>

          <!-- Estimated Cost — Currency -->
          <div class="field-group">
            <label class="field-label">Estimasi Biaya <span class="req">*</span></label>
            <div class="input-currency-wrap">
              <span class="currency-prefix">Rp</span>
              <input
                :value="displayCost"
                @input="handleCostInput"
                @keydown="handleCostKeydown"
                @blur="validateCost"
                type="text"
                inputmode="numeric"
                class="field-input field-input--currency"
                :class="{ 'field-input--error': errors.estimated_cost }"
                placeholder="0"
                autocomplete="off"
              />
            </div>
            <span v-if="errors.estimated_cost" class="field-error">
              <svg class="err-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              {{ errors.estimated_cost }}
            </span>
          </div>

          <!-- Notes -->
          <div class="field-group">
            <label class="field-label">Catatan Tambahan</label>
            <textarea
              v-model="form.notes"
              class="field-input field-textarea"
              placeholder="Catatan opsional..."
              rows="2"
            ></textarea>
          </div>

        </div>

        <!-- Footer -->
        <div class="est-footer">
          <button class="est-btn-cancel" @click="close" :disabled="loading">Batal</button>
          <button class="est-btn-save" @click="submit" :disabled="loading">
            <span v-if="!loading">{{ isEdit ? 'Simpan Perubahan' : 'Simpan Estimasi' }}</span>
            <span v-else class="est-loading-inner"><span class="est-spinner"></span>Menyimpan...</span>
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { EstimasiItem } from '../../types/inspectionReport'

const props = defineProps<{
  modelValue:       boolean
  prefillPartName?: string
  editData?:        EstimasiItem | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'saved',   data: EstimasiItem): void
  (e: 'updated', data: EstimasiItem): void
}>()

// ─── State ───────────────────────────────────────────────────
const loading     = ref(false)
const mounted     = ref(false)
const displayCost = ref('')
const isEdit      = computed(() => !!props.editData?.id)

const defaultForm = (): EstimasiItem => ({
  part_name: '', repair_description: '',
  urgency: 'soon', status: 'recommended',
  estimated_cost: 0, notes: '',
})

const form   = ref<EstimasiItem>(defaultForm())
const errors = ref<Partial<Record<keyof EstimasiItem, string>>>({})

// ─── Watch open → populate form & animate ───────────────────
watch(() => props.modelValue, async (val) => {
  if (val) {
    // Reset state dulu
    mounted.value = false
    errors.value  = {}
    loading.value = false

    // Populate form
    if (props.editData) {
      form.value        = { ...props.editData }
      displayCost.value = formatNumber(props.editData.estimated_cost ?? 0)
    } else {
      form.value        = { ...defaultForm(), part_name: props.prefillPartName ?? '' }
      displayCost.value = ''
    }

    // Trigger animasi masuk
    await nextTick()
    requestAnimationFrame(() => { mounted.value = true })
  } else {
    mounted.value = false
  }
})

// ─── Currency helpers (integer only, no decimal) ────────────
function formatNumber(num: number): string {
  if (!num && num !== 0) return ''
  return Math.floor(num).toLocaleString('id-ID')
}

function parseNumber(val: string): number | null {
  // Format id-ID pakai titik sebagai pemisah ribuan → hapus semua titik
  const cleaned = val.replace(/\./g, '').replace(/[^\d]/g, '')
  if (!cleaned) return null
  const n = parseInt(cleaned, 10)
  return isNaN(n) ? null : n
}

function handleCostInput(e: Event) {
  const el         = e.target as HTMLInputElement
  const raw        = el.value
  const caretStart = el.selectionStart ?? 0
  const num        = parseNumber(raw)

  if (num !== null) {
    form.value.estimated_cost = num
    const formatted = formatNumber(num)
    displayCost.value = formatted
    const diff = formatted.length - raw.length
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = Math.min(caretStart + diff, formatted.length)
    })
  } else {
    form.value.estimated_cost = 0
    displayCost.value = ''
  }

  // Hapus error saat user mulai mengetik
  if (errors.value.estimated_cost) delete errors.value.estimated_cost
}

function handleCostKeydown(e: KeyboardEvent) {
  const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter','Home','End']
  if (!allowed.includes(e.key) && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
  }
}

function validateCost() {
  if (form.value.estimated_cost == null || form.value.estimated_cost < 0) {
    errors.value.estimated_cost = 'Biaya tidak boleh kosong'
  } else {
    delete errors.value.estimated_cost
  }
}

// ─── Full validation ────────────────────────────────────────
function validate(): boolean {
  const e: typeof errors.value = {}
  if (!form.value.part_name?.trim()) e.part_name       = 'Nama part wajib diisi'
  if (!form.value.urgency)           e.urgency         = 'Pilih urgensi'
  if (!form.value.status)            e.status          = 'Pilih status'
  if (form.value.estimated_cost == null || form.value.estimated_cost < 0)
                                     e.estimated_cost  = 'Biaya tidak boleh kosong'
  errors.value = e
  return Object.keys(e).length === 0
}

// ─── Submit ─────────────────────────────────────────────────
async function submit() {
  if (!validate()) return

  loading.value = true
  try {
    const data: EstimasiItem = { ...form.value }
    if (isEdit.value) {
      emit('updated', data)
    } else {
      emit('saved', data)
    }
    // Tutup modal setelah emit — parent akan handle API call
    doClose()
  } finally {
    loading.value = false
  }
}

// ─── Close ──────────────────────────────────────────────────
function close() {
  if (loading.value) return
  doClose()
}

function doClose() {
  mounted.value = false
  // Beri waktu animasi keluar sebelum destroy
  setTimeout(() => {
    emit('update:modelValue', false)
  }, 220)
}

// ─── Options ────────────────────────────────────────────────
const urgencyOptions = [
  { value: 'immediate', label: 'Segera' },
  { value: 'soon',      label: 'Dalam Waktu Dekat' },
  { value: 'optional',  label: 'Opsional' },
  { value: 'monitor',   label: 'Pantau' },
]
const statusOptions = [
  { value: 'required',    label: 'Wajib' },
  { value: 'recommended', label: 'Disarankan' },
  { value: 'optional',    label: 'Opsional' },
]
</script>

<style scoped>
.est-modal-root {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: flex-end; justify-content: center;
}

/* Backdrop */
.est-backdrop {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  animation: bdIn 0.25s ease forwards;
}
@keyframes bdIn { from { opacity: 0; } to { opacity: 1; } }

/* Sheet — mobile slide up */
.est-sheet {
  position: relative;
  background: #fff;
  width: 100%; max-width: 480px;
  border-radius: 20px 20px 0 0;
  max-height: 90vh;
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: 0 -4px 32px rgba(0,0,0,0.15);
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.34,1.1,0.64,1);
}
.est-sheet--visible { transform: translateY(0); }

/* Desktop — center dialog */
@media (min-width: 640px) {
  .est-modal-root  { align-items: center; }
  .est-sheet {
    border-radius: 16px;
    transform: scale(0.95); opacity: 0;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
  .est-sheet--visible { transform: scale(1); opacity: 1; }
}

/* Header */
.est-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 14px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
}
.est-title { font-size: 16px; font-weight: 600; color: #111; margin: 0; }
.est-close-btn {
  padding: 6px; border: none; background: none; border-radius: 50%;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s; -webkit-tap-highlight-color: transparent;
}
.est-close-btn:hover  { background: #f3f4f6; }
.est-close-btn:active { background: #e5e7eb; }
.icon-close { width: 20px; height: 20px; color: #6b7280; }

/* Body */
.est-body {
  flex: 1; overflow-y: auto; padding: 16px 20px;
  display: flex; flex-direction: column; gap: 12px;
  -webkit-overflow-scrolling: touch;
}

/* Fields */
.field-group { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 11px; font-weight: 600; color: #555; }
.req { color: #e53e3e; }

.field-input {
  width: 100%; padding: 9px 11px;
  border: 1.5px solid #e8e8e8; border-radius: 8px;
  font-size: 13px; color: #1a1a1a; background: #fff;
  outline: none; transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box; -webkit-appearance: none; font-family: inherit;
}
.field-input:focus { border-color: #60aff5; box-shadow: 0 0 0 3px rgba(96,175,245,0.15); }
.field-input:hover:not(:focus) { border-color: #d1d1d1; }
.field-input--error { border-color: #fc8181 !important; background: #fff5f5; }
.field-textarea { resize: none; line-height: 1.5; }

.input-currency-wrap { position: relative; display: flex; align-items: center; }
.currency-prefix {
  position: absolute; left: 11px;
  font-size: 12px; font-weight: 600; color: #888;
  pointer-events: none; z-index: 1;
}
.field-input--currency { padding-left: 32px; }

.field-error {
  display: flex; align-items: center; gap: 4px;
  font-size: 10px; color: #e53e3e;
}
.err-icon { width: 11px; height: 11px; flex-shrink: 0; }

/* Radio Pills */
.radio-pill-group { display: flex; flex-wrap: wrap; gap: 6px; }
.radio-pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 11px; border-radius: 20px; cursor: pointer;
  border: 1.5px solid #e8e8e8; background: #fafafa;
  transition: all 0.15s; font-size: 11px; font-weight: 600; color: #888;
  user-select: none; -webkit-tap-highlight-color: transparent;
}
.pill-dot {
  width: 7px; height: 7px; border-radius: 50%;
  border: 1.5px solid currentColor; flex-shrink: 0; transition: background 0.15s;
}
/* Urgency */
.radio-pill.pill-urgency-immediate.active { background:#fff0f0; border-color:#e53e3e; color:#c53030; }
.radio-pill.pill-urgency-immediate.active .pill-dot { background:#e53e3e; }
.radio-pill.pill-urgency-soon.active      { background:#fff8e6; border-color:#d97706; color:#854f0b; }
.radio-pill.pill-urgency-soon.active .pill-dot { background:#d97706; }
.radio-pill.pill-urgency-optional.active  { background:#f0fff4; border-color:#38a169; color:#276749; }
.radio-pill.pill-urgency-optional.active .pill-dot { background:#38a169; }
.radio-pill.pill-urgency-monitor.active   { background:#ebf8ff; border-color:#0d98d8; color:#0a6fa0; }
.radio-pill.pill-urgency-monitor.active .pill-dot { background:#0d98d8; }
/* Status */
.radio-pill.pill-status-required.active    { background:#fff0f0; border-color:#e53e3e; color:#c53030; }
.radio-pill.pill-status-required.active .pill-dot { background:#e53e3e; }
.radio-pill.pill-status-recommended.active { background:#fff8e6; border-color:#d97706; color:#854f0b; }
.radio-pill.pill-status-recommended.active .pill-dot { background:#d97706; }
.radio-pill.pill-status-optional.active    { background:#f0fff4; border-color:#38a169; color:#276749; }
.radio-pill.pill-status-optional.active .pill-dot { background:#38a169; }

/* Footer */
.est-footer {
  display: flex; gap: 10px; padding: 14px 20px;
  border-top: 1px solid #f0f0f0; flex-shrink: 0;
  padding-bottom: max(14px, env(safe-area-inset-bottom));
}
.est-btn-cancel {
  flex: 1; padding: 11px; background: #f3f4f6; border: none;
  border-radius: 10px; font-size: 14px; font-weight: 600; color: #555;
  cursor: pointer; transition: background 0.15s;
}
.est-btn-cancel:hover   { background: #e5e7eb; }
.est-btn-cancel:active  { background: #d1d5db; }
.est-btn-cancel:disabled { opacity: .5; cursor: not-allowed; }
.est-btn-save {
  flex: 2; padding: 11px; background: #3b82f6; border: none;
  border-radius: 10px; font-size: 14px; font-weight: 700; color: #fff;
  cursor: pointer; transition: background 0.15s, transform 0.1s;
  box-shadow: 0 2px 8px rgba(59,130,246,.35);
}
.est-btn-save:hover:not(:disabled)  { background: #2563eb; }
.est-btn-save:active:not(:disabled) { transform: scale(.98); }
.est-btn-save:disabled { opacity: .55; cursor: not-allowed; }
.est-loading-inner { display:flex; align-items:center; justify-content:center; gap:8px; }
.est-spinner {
  width:14px; height:14px; border:2px solid rgba(255,255,255,.35);
  border-top-color:#fff; border-radius:50%; animation:spin .65s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>