<!-- pages/auth/LoginOtp.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex flex-col">

    <!-- HEADER -->
    <div class="pt-16 pb-10 px-6 text-white">

      <div class="flex justify-center mb-6">
        <div class="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl">
          <svg xmlns="http://www.w3.org/2000/svg"
               class="w-12 h-12 text-white"
               fill="none"
               viewBox="0 0 24 24"
               stroke="currentColor">

            <path stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.75 17L15 12l-5.25-5" />
          </svg>
        </div>
      </div>

      <h1 class="text-3xl font-bold text-center">
        cekMobil.Online
      </h1>

      <p class="text-center text-blue-100 mt-2 leading-relaxed">
        App inspeksi kendaraan paling lengkap,
        modern, dan mudah digunakan inspector.
      </p>
    </div>

    <!-- CARD -->
    <div class="flex-1 bg-white rounded-t-[40px] px-6 pt-8 pb-10 shadow-2xl">

      <!-- PHONE -->
      <div v-if="step === 'phone'">

        <h2 class="text-2xl font-bold text-gray-800">
          Login Inspector
        </h2>

        <p class="text-gray-500 mt-1 mb-8">
          Masukkan nomor WhatsApp yang terdaftar
        </p>

        <div>

          <label class="text-sm font-semibold text-gray-700 mb-2 block">
            Nomor WhatsApp
          </label>

          <div
            class="flex items-center border rounded-2xl px-4 h-14 transition"
            :class="phoneError
              ? 'border-red-400 bg-red-50'
              : 'border-gray-200 focus-within:border-blue-500'"
          >

            <span class="text-gray-500 font-semibold mr-2">
              +62
            </span>

            <input
              v-model="phone"
              type="tel"
              inputmode="numeric"
              placeholder="81234567890"
              class="flex-1 outline-none bg-transparent text-gray-800"
              maxlength="13"
              @input="onlyNumber"
            />
          </div>

          <p
            v-if="phoneError"
            class="text-red-500 text-sm mt-2"
          >
            {{ phoneError }}
          </p>

        </div>

        <!-- ERROR -->
        <div
          v-if="auth.error"
          class="mt-5 bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm"
        >
          {{ auth.error }}
        </div>

        <!-- BUTTON -->
        <button
          @click="handleRequestOtp"
          :disabled="auth.isLoading"
          class="w-full mt-8 h-14 rounded-2xl bg-blue-600 text-white font-semibold shadow-lg active:scale-[0.98] transition disabled:opacity-60"
        >

          <span v-if="!auth.isLoading">
            Kirim OTP
          </span>

          <span v-else>
            Mengirim OTP...
          </span>

        </button>

      </div>

      <!-- OTP -->
      <div v-if="step === 'otp'">

        <button
          @click="backToPhone"
          class="mb-6 text-blue-600 font-medium"
          :disabled="isVerifying"
        >
          ← Ganti nomor
        </button>

        <h2 class="text-2xl font-bold text-gray-800">
          Verifikasi OTP
        </h2>

        <p class="text-gray-500 mt-1">
          Kode OTP telah dikirim ke
        </p>

        <p class="font-semibold text-blue-600 mt-1">
          +62 {{ phone }}
        </p>

        <!-- OTP -->
        <div class="flex justify-between gap-2 mt-10">

          <input
            v-for="(_, index) in otp"
            :key="index"
            :ref="el => setOtpRef(el as HTMLInputElement, index)"
            v-model="otp[index]"
            type="tel"
            inputmode="numeric"
            maxlength="1"
            :disabled="isVerifying"
            class="w-14 h-16 rounded-2xl border border-gray-200 text-center text-2xl font-bold outline-none focus:border-blue-500 disabled:bg-gray-100"
            @input="handleOtpInput(index)"
            @keydown.backspace="handleBackspace(index)"
          />

        </div>

        <!-- LOADING -->
        <div
          v-if="isVerifying"
          class="mt-6 text-center text-blue-600 font-semibold"
        >
          Memverifikasi OTP...
        </div>

        <!-- ERROR -->
        <div
          v-if="auth.error"
          class="mt-5 bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm"
        >
          {{ auth.error }}
        </div>

        <!-- RESEND -->
        <div class="mt-8 text-center">

          <button
            v-if="countdown === 0 && !isVerifying"
            @click="resendOtp"
            class="text-blue-600 font-semibold"
          >
            Kirim ulang OTP
          </button>

          <p
            v-else
            class="text-gray-500 text-sm"
          >
            Kirim ulang dalam {{ countdown }} detik
          </p>

        </div>

      </div>

    </div>

  </div>
</template>

<script setup lang="ts">

import { ref, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth(local)'

const router = useRouter()
const auth = useAuthStore()

const step = ref<'phone' | 'otp'>('phone')

const phone = ref('')
const phoneError = ref('')

const otp = ref<string[]>(['', '', '', ''])

const otpRefs = ref<HTMLInputElement[]>([])

const countdown = ref(60)

const isVerifying = ref(false)

let interval: number | null = null

// ============================================================
// OTP
// ============================================================

function setOtpRef(el: HTMLInputElement | null, index: number) {
  if (el) {
    otpRefs.value[index] = el
  }
}

async function handleOtpInput(index: number) {

    otp.value[index] = (otp.value[index] || '').replace(/\D/g, '')

  if (otp.value[index] && index < 3) {
    otpRefs.value[index + 1]?.focus()
  }

  await nextTick()

  checkOtpComplete()
}

function handleBackspace(index: number) {

  if (!otp.value[index] && index > 0) {
    otpRefs.value[index - 1]?.focus()
  }
}

async function checkOtpComplete() {

  const otpCode = otp.value.join('')

  if (otpCode.length !== 4) return

  try {

    isVerifying.value = true

    await auth.verifyOtp(
      formatPhone(phone.value),
      otpCode
    )

    router.replace('/dashboard/home')

  } catch (err) {

    console.error(err)

    otp.value = ['', '', '', '']

    await nextTick()

    otpRefs.value[0]?.focus()

  } finally {
    isVerifying.value = false
  }
}

// ============================================================
// PHONE
// ============================================================

function onlyNumber() {
  phone.value = phone.value.replace(/\D/g, '')
}

function formatPhone(value: string) {

  let cleaned = value.replace(/\D/g, '')

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1)
  }

  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned
  }

  return cleaned
}

function validatePhone() {

  phoneError.value = ''

  const cleaned = phone.value.replace(/\D/g, '')

  if (!cleaned) {
    phoneError.value = 'Nomor WhatsApp wajib diisi'
    return false
  }

  if (cleaned.length < 10) {
    phoneError.value = 'Nomor terlalu pendek'
    return false
  }

  if (cleaned.length > 13) {
    phoneError.value = 'Nomor terlalu panjang'
    return false
  }

  return true
}

// ============================================================
// REQUEST OTP
// ============================================================

async function handleRequestOtp() {

  if (!validatePhone()) return

  try {

    await auth.requestOtp(
      formatPhone(phone.value)
    )

    step.value = 'otp'

    startCountdown()

    setTimeout(() => {
      otpRefs.value[0]?.focus()
    }, 300)

  } catch (err) {
    console.error(err)
  }
}

// ============================================================
// RESEND
// ============================================================

async function resendOtp() {

  otp.value = ['', '', '', '']

  try {

    await auth.requestOtp(
      formatPhone(phone.value)
    )

    startCountdown()

  } catch (err) {
    console.error(err)
  }
}

// ============================================================
// COUNTDOWN
// ============================================================

function startCountdown() {

  if (interval) {
    clearInterval(interval)
  }

  countdown.value = 60

  interval = window.setInterval(() => {

    if (countdown.value > 0) {
      countdown.value--
    } else {
      clearInterval(interval!)
    }

  }, 1000)
}

// ============================================================
// BACK
// ============================================================

function backToPhone() {

  otp.value = ['', '', '', '']

  auth.error = null

  step.value = 'phone'
}

// ============================================================
// DESTROY
// ============================================================

onUnmounted(() => {

  if (interval) {
    clearInterval(interval)
  }
})

</script>