<template>
  <form @submit.prevent="submit" class="space-y-4">

    <!-- Label -->
    <div class="form-field">
      <label class="form-label">
        Label Rekening
        <span class="form-hint">opsional</span>
      </label>
      <input
        v-model="form.label"
        type="text"
        class="form-input"
        placeholder="cth: Rekening Utama"
      />
    </div>

    <!-- Nama Pemilik -->
    <div class="form-field">
      <label class="form-label">
        Nama Pemilik
        <span class="form-required">*</span>
      </label>
      <input
        v-model="form.owner_name"
        type="text"
        class="form-input"
        :class="{ 'form-input--error': errors.owner_name }"
        placeholder="Sesuai buku tabungan"
      />
      <p v-if="errors.owner_name" class="form-error-msg">{{ errors.owner_name }}</p>
    </div>

    <!-- Nama Bank -->
    <div class="form-field">
      <label class="form-label">
        Nama Bank
        <span class="form-required">*</span>
      </label>
      <!-- Quick Select Bank -->
      <div class="bank-chips">
        <button
          v-for="bank in popularBanks"
          :key="bank.name"
          type="button"
          class="bank-chip"
          :class="{ 'bank-chip--active': form.bank_name === bank.name }"
          @click="selectBank(bank.name)"
        >
          <img
            :src="bank.logo"
            class="w-4 h-4 rounded object-contain"
          />

          <span>
            {{ bank.name }}
          </span>
        </button>
      </div>
      <div class="relative mt-2">

  <div
    class="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center"
  >
    <img
      :src="getBankLogo(form.bank_name)"
      class="max-w-6 max-h-6 object-contain"
    />
  </div>

  <input
    v-model="form.bank_name"
    type="text"
    class="form-input"
    style="padding-left: 56px;"
    :class="{ 'form-input--error': errors.bank_name }"
    placeholder="atau ketik nama bank lain..."
  />

</div>
      <p v-if="errors.bank_name" class="form-error-msg">{{ errors.bank_name }}</p>
    </div>

    <!-- Nomor Rekening -->
    <div class="form-field">
      <label class="form-label">
        Nomor Rekening
        <span class="form-required">*</span>
      </label>
      <input
        v-model="form.account_number"
        type="text"
        inputmode="numeric"
        class="form-input form-input--mono"
        :class="{ 'form-input--error': errors.account_number }"
        placeholder="cth: 1234567890"
      />
      <p v-if="errors.account_number" class="form-error-msg">{{ errors.account_number }}</p>
    </div>

    <!-- Catatan -->
    <div class="form-field">
      <label class="form-label">
        Catatan
        <span class="form-hint">opsional</span>
      </label>
      <textarea
        v-model="form.note"
        rows="2"
        class="form-input form-textarea"
        placeholder="Tambahkan catatan jika perlu..."
      />
    </div>

    <!-- Submit -->
    <button
      type="submit"
      :disabled="loading"
      class="form-submit"
      :class="{ 'form-submit--loading': loading }"
    >
      <span v-if="!loading" class="form-submit-inner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        Simpan Rekening
      </span>
      <span v-else class="form-submit-inner">
        <span class="form-spinner"></span>
        Menyimpan...
      </span>
    </button>

  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { BankAccountPayload } from '../../types/bank-account'
import { getBankLogo } from '../../utils/bankLogo'

const emit = defineEmits<{
  (e: 'submit', payload: BankAccountPayload): void
}>()

const loading = defineModel<boolean>('loading', { default: false })

const form = reactive<BankAccountPayload>({
  label:          '',
  owner_name:     '',
  bank_name:      '',
  bank_code:      '',
  account_number: '',
  type:           'inspector',
  note:           '',
})

const errors = reactive({
  owner_name:     '',
  bank_name:      '',
  account_number: '',
})

const popularBanks = [
  {
    name: 'BCA',
    logo: '/images/bank/bca.jpg'
  },
  {
    name: 'BRI',
    logo: '/images/bank/bri.jpg'
  },
  {
    name: 'BNI',
    logo: '/images/bank/bni.jpg'
  },
  {
    name: 'Mandiri',
    logo: '/images/bank/mandiri.jpg'
  },
  {
    name: 'DANA',
    logo: '/images/bank/dana.jpg'
  },
  {
    name: 'GoPay',
    logo: '/images/bank/gopay.jpg'
  },
  {
    name: 'OVO',
    logo: '/images/bank/ovo.png'
  },
  {
    name: 'LinkAja',
    logo: '/images/bank/linkaja.png'
  },
  {
    name: 'ShopeePay',
    logo: '/images/bank/shopee.png'
  }
]

function selectBank(bank: string) {
  form.bank_name = form.bank_name === bank ? '' : bank
}

function validate(): boolean {
  errors.owner_name     = ''
  errors.bank_name      = ''
  errors.account_number = ''

  let valid = true

  if (!form.owner_name.trim()) {
    errors.owner_name = 'Nama pemilik wajib diisi'
    valid = false
  }
  if (!form.bank_name.trim()) {
    errors.bank_name = 'Nama bank wajib diisi'
    valid = false
  }
  if (!form.account_number.trim()) {
    errors.account_number = 'Nomor rekening wajib diisi'
    valid = false
  } else if (!/^\d{6,20}$/.test(form.account_number.replace(/\s/g, ''))) {
    errors.account_number = 'Nomor rekening tidak valid (6-20 digit angka)'
    valid = false
  }

  return valid
}

function submit() {
  if (!validate()) return
  emit('submit', { ...form })
}
</script>

<style scoped>
/* ── FIELD ─────────────────────────────────────── */
.form-field  { display: flex; flex-direction: column; gap: 6px; }

.form-label  {
  font-size: 12px; font-weight: 600; color: #374151;
  display: flex; align-items: center; gap: 4px;
}
.form-required { color: #ef4444; font-size: 12px; }
.form-hint     { color: #9ca3af; font-size: 11px; font-weight: 400; }

/* ── INPUT ─────────────────────────────────────── */
.form-input {
  width: 100%; border: 1.5px solid #e5e7eb; border-radius: 12px;
  padding: 11px 14px; font-size: 14px; color: #111;
  background: #fff; outline: none;
  transition: border-color .15s, box-shadow .15s;
  -webkit-appearance: none;
}
.form-input:focus {
  border-color: #0d98d8;
  box-shadow: 0 0 0 3px rgba(13,152,216,.1);
}
.form-input--error  { border-color: #f87171; background: #fff5f5; }
.form-input--mono   { font-family: 'Courier New', monospace; font-weight: 700; letter-spacing: .5px; }
.form-textarea      { resize: none; }

.form-error-msg {
  font-size: 11px; color: #dc2626; font-weight: 500;
  padding: 4px 8px; background: #fff5f5;
  border: 1px solid #fca5a5; border-radius: 6px;
}

/* ── BANK CHIPS ────────────────────────────────── */
.bank-chips  { display: flex; flex-wrap: wrap; gap: 6px; }
.bank-chip   {
  padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
  border: 1.5px solid #e5e7eb; background: #f9fafb; color: #6b7280;
  cursor: pointer; transition: all .15s;
}
.bank-chip:active             { transform: scale(.96); }
.bank-chip--active            { border-color: #0d98d8; background: #e0f4fd; color: #0a6fa0; }

/* ── SUBMIT ────────────────────────────────────── */
.form-submit {
  width: 100%; padding: 14px;
  background: #0d98d8; color: #fff;
  border: none; border-radius: 14px;
  font-size: 13px; font-weight: 700;
  cursor: pointer; transition: opacity .15s, box-shadow .15s;
  box-shadow: 0 2px 10px rgba(13,152,216,.3);
}
.form-submit:active:not(:disabled) { opacity: .85; box-shadow: none; }
.form-submit:disabled              { opacity: .5; cursor: not-allowed; box-shadow: none; }
.form-submit--loading              { animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse {
  0%,100% { box-shadow: 0 2px 10px rgba(13,152,216,.3); }
  50%     { box-shadow: 0 2px 20px rgba(13,152,216,.55); }
}

.form-submit-inner {
  display: flex; align-items: center;
  justify-content: center; gap: 8px;
}

/* ── SPINNER ───────────────────────────────────── */
.form-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
  border-radius: 50%; animation: spin .65s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.bank-chip {
  display: flex;
  align-items: center;
  gap: 6px;

  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;

  border: 1.5px solid #e5e7eb;
  background: #f9fafb;
  color: #6b7280;

  cursor: pointer;
  transition: all .15s;
}
</style>