<!-- src/components/Report/PaymentModal.vue -->
<template>
  <Transition name="pm-fade">
    <div v-if="open" class="pm-overlay" @click.self="$emit('close')">
      <div class="pm-sheet">

        <!-- Header -->
        <div class="pm-header">
          <span class="pm-title">{{ title }}</span>
          <button class="pm-close" @click="$emit('close')">✕</button>
        </div>

        <!-- Info tagihan — hanya kalau payment sudah ada -->
        <div v-if="paymentExists && totalAmount > 0" class="pm-info-row">
          <div class="pm-info-box">
            <p class="pm-info-label">Total Tagihan</p>
            <p class="pm-info-value">Rp {{ fmt(totalAmount) }}</p>
          </div>
          <template v-if="remainingPayment < totalAmount">
            <div class="pm-info-divider"></div>
            <div class="pm-info-box">
              <p class="pm-info-label">Sudah Dibayar</p>
              <p class="pm-info-value pm-info-value--blue">
                Rp {{ fmt(totalAmount - remainingPayment) }}
              </p>
            </div>
          </template>
          <div class="pm-info-divider"></div>
          <div class="pm-info-box">
            <p class="pm-info-label">{{ remainingPayment < totalAmount ? 'Sisa' : 'Belum Dibayar' }}</p>
            <p class="pm-info-value pm-info-value--orange">Rp {{ fmt(remainingPayment) }}</p>
          </div>
        </div>

        <!-- Notes -->
        <div
          v-if="notes"
          class="pm-note-box"
        >
          <div class="pm-note-header">
            📌 Catatan
          </div>
          <div class="pm-note-content">
            {{ notes }}
          </div>
        </div>

        <!-- Input jumlah bayar -->
        <div class="pm-field">
          <label class="pm-label">Jumlah Dibayar</label>
          <div class="pm-input-wrap" :class="{ 'pm-input-wrap--error': isUnder }">
            <span class="pm-prefix">Rp</span>
            <input
              v-model="displayPaid"
              type="text"
              inputmode="numeric"
              placeholder="0"
              class="pm-input"
              @input="onInputPaid"
            >
          </div>

          <!-- Pesan error: kurang dari tagihan (hanya kalau ada payment) -->
          <Transition name="pm-msg">
            <p v-if="isUnder" class="pm-msg pm-msg--error">
              ⚠️ Minimal Rp {{ fmt(minAmount) }}
            </p>
          </Transition>

          <!-- Info kembalian kalau lebih -->
          <Transition name="pm-msg">
            <p v-if="isOver" class="pm-msg pm-msg--info">
              ✅ Kembalian Rp {{ fmt(rawPaid - minAmount) }}
            </p>
          </Transition>
        </div>

        <!-- Metode pembayaran -->
        <div class="pm-field">
          <label class="pm-label">Metode Pembayaran </label>
          <div class="pm-method-row">
            <button
              v-for="m in methods"
              :key="m.value"
              class="pm-method-btn"
              :class="{ 'pm-method-btn--active': paymentMethod === m.value }"
              @click="paymentMethod = m.value"
            >{{ m.label }}</button>
          </div>
        </div>

        <!-- Submit -->
        <button class="pm-btn" :disabled="loading || !isValid" @click="submit">
          <span v-if="!loading">{{ submitLabel }}</span>
          <span v-else class="pm-spinner-wrap">
            <span class="pm-spinner"></span> Memproses...
          </span>
        </button>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PaymentPayload } from '../../types/inspectionReport'

const props = defineProps<{
  open: boolean
  paymentExists: boolean   // ada data payment dari API?
  totalAmount: number      // total tagihan (0 kalau belum ada)
  remainingPayment: number // sisa yang harus dibayar
  notes?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: PaymentPayload): void
}>()

const loading       = ref(false)
const rawPaid       = ref(0)
const displayPaid   = ref('')
const paymentMethod = ref<'cash' | 'transfer' | 'qris'>('cash')

const methods = [
  { label: 'Cash',     value: 'cash'     },
  { label: 'Transfer', value: 'transfer' },
  { label: 'QRIS',     value: 'qris'     },
] as const

// Batas minimal bayar:
// - kalau sudah ada payment → harus >= remaining
// - kalau belum ada → bebas (minimal > 0)
const minAmount = computed(() =>
  props.paymentExists ? props.remainingPayment : 0
)

const title = computed(() => {
  if (!props.paymentExists) return 'Pembayaran Inspeksi'
  if (props.totalAmount === props.remainingPayment) return 'Konfirmasi Pembayaran'
  return 'Konfirmasi Pelunasan'
})

const submitLabel = computed(() => {
  if (!props.paymentExists) return 'Lanjutkan'
  return 'Konfirmasi Pembayaran'
})

const isUnder = computed(() =>
  props.paymentExists && rawPaid.value > 0 && rawPaid.value < minAmount.value
)
const isOver  = computed(() =>
  props.paymentExists && rawPaid.value > minAmount.value
)
const isValid = computed(() => {
  if (rawPaid.value <= 0) return false
  if (props.paymentExists) return rawPaid.value >= minAmount.value
  return true
})

// Prefill input saat modal dibuka
watch(
  () => props.open,
  (val) => {
    if (val) {
      // Kalau ada payment → prefill dengan remaining
      // Kalau belum ada → kosong
      if (props.paymentExists && props.remainingPayment > 0) {
        rawPaid.value     = props.remainingPayment
        displayPaid.value = fmt(props.remainingPayment)
      } else {
        rawPaid.value     = 0
        displayPaid.value = ''
      }
      paymentMethod.value = 'cash'
    }
  },
  { immediate: true }
)

function fmt(n: number)      { return n > 0 ? n.toLocaleString('id-ID') : '0' }
function parseRaw(v: string) { return Number(v.replace(/\D/g, '')) || 0 }

function onInputPaid(e: Event) {
  rawPaid.value     = parseRaw((e.target as HTMLInputElement).value)
  displayPaid.value = rawPaid.value > 0 ? rawPaid.value.toLocaleString('id-ID') : ''
}

function submit() {
  if (!isValid.value) return
  loading.value = true

  emit('submit', {
    total_amount:   props.paymentExists ? props.totalAmount : rawPaid.value,
    paid_amount:    rawPaid.value,
    payment_method: paymentMethod.value,
  })

  loading.value = false
}
</script>

<style scoped>
.pm-overlay {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(0,0,0,.5);
  display: flex; align-items: flex-end;
}
.pm-sheet {
  width: 100%; background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px 16px 32px;
  display: flex; flex-direction: column; gap: 16px;
  animation: pm-sheetUp .28s cubic-bezier(.34,1.4,.64,1);
}
@keyframes pm-sheetUp { from{transform:translateY(100%)} to{transform:none} }

.pm-header { display:flex; justify-content:space-between; align-items:center; }
.pm-title  { font-size:15px; font-weight:700; color:#111; }
.pm-close  { background:none; border:none; font-size:16px; color:#888; cursor:pointer; padding:4px; }

/* Info tagihan */
.pm-info-row {
  display: flex;
  background: #f0f8ff;
  border: 1px solid #b8dff5;
  border-radius: 14px;
  overflow: hidden;
}
.pm-info-box      { flex:1; padding:12px 14px; }
.pm-info-divider  { width:1px; background:#b8dff5; flex-shrink:0; }
.pm-info-label    { font-size:11px; color:#0a6fa0; margin:0 0 3px; }
.pm-info-value    { font-size:14px; font-weight:800; margin:0; color:#0d98d8; }
.pm-info-value--blue   { color:#0b7dba; }
.pm-info-value--orange { color:#ea580c; }

/* Field */
.pm-field { display:flex; flex-direction:column; gap:6px; }
.pm-label { font-size:12px; font-weight:600; color:#555; }

.pm-input-wrap {
  display:flex; align-items:center;
  border:1.5px solid #b8dff5; border-radius:12px;
  padding:11px 14px; gap:6px;
  transition:border-color .15s, background .15s;
}
.pm-input-wrap--error { border-color:#f87171; background:#fff5f5; }

.pm-prefix { font-size:13px; font-weight:600; color:#0d98d8; flex-shrink:0; }
.pm-input  {
  flex:1; border:none; outline:none;
  font-size:16px; font-weight:700; color:#111;
  background:transparent;
}

/* Pesan */
.pm-msg {
  font-size:11px; font-weight:500;
  padding:6px 10px; border-radius:8px; line-height:1.5; margin:0;
}
.pm-msg--error { color:#dc2626; background:#fff5f5; border:1px solid #fca5a5; }
.pm-msg--info  { color:#15803d; background:#f0fdf4; border:1px solid #86efac; }

.pm-msg-enter-active { animation:pm-msgIn .18s ease; }
.pm-msg-leave-active { animation:pm-msgIn .14s ease reverse; }
@keyframes pm-msgIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }

/* Metode */
.pm-method-row { display:flex; gap:8px; }
.pm-method-btn {
  flex:1; padding:10px 0; border-radius:12px;
  border:1.5px solid #b8dff5; background:#f0f8ff;
  font-size:12px; font-weight:600; color:#0a6fa0; cursor:pointer;
  transition:all .15s;
}
.pm-method-btn--active {
  border-color:#0d98d8; background:#0d98d8; color:#fff;
}
.pm-method-btn:active:not(.pm-method-btn--active) { background:#e0f2fe; }

/* Submit */
.pm-btn {
  width:100%; padding:14px;
  background:#0d98d8; color:#fff;
  border:none; border-radius:14px;
  font-size:13px; font-weight:700;
  cursor:pointer; transition:opacity .15s, box-shadow .15s;
  box-shadow: 0 2px 10px rgba(13,152,216,.3);
}
.pm-btn:not(:disabled):active { opacity:.85; box-shadow:none; }
.pm-btn:disabled { opacity:.4; cursor:not-allowed; box-shadow:none; }

.pm-spinner-wrap { display:flex; align-items:center; justify-content:center; gap:8px; }
.pm-spinner {
  width:14px; height:14px;
  border:2px solid rgba(255,255,255,.3); border-top-color:#fff;
  border-radius:50%; animation:pm-spin .65s linear infinite;
}
@keyframes pm-spin { to{transform:rotate(360deg)} }

.pm-fade-enter-active { animation:pm-fadeIn .2s ease; }
.pm-fade-leave-active { animation:pm-fadeIn .15s ease reverse; }
@keyframes pm-fadeIn  { from{opacity:0} to{opacity:1} }

.pm-note-box {
  background: #fff7ed;
  border: 1px solid #fdba74;
  border-radius: 14px;
  padding: 12px 14px;
}

.pm-note-header {
  font-size: 12px;
  font-weight: 700;
  color: #c2410c;
  margin-bottom: 6px;
}

.pm-note-content {
  font-size: 12px;
  line-height: 1.6;
  color: #7c2d12;
  white-space: pre-wrap;
}
</style>