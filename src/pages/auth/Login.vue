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
                  d="M5 13l4 4L19 7" />
          </svg>

        </div>
      </div>

      <h1 class="text-3xl font-bold text-center">
        cekMobil.Online
      </h1>

      <p class="text-center text-blue-100 mt-2 leading-relaxed">
        Login alternatif inspector internal
      </p>

    </div>

    <!-- CARD -->
    <div class="flex-1 bg-white rounded-t-[40px] px-6 pt-8 pb-10 shadow-2xl">

      <h2 class="text-2xl font-bold text-gray-800">
        Login Rahasia
      </h2>

      <p class="text-gray-500 mt-1 mb-8">
        Login ini hanya digunakan untuk kondisi tertentu.
      </p>

      <!-- EMAIL -->
      <div class="mb-5">

        <label class="text-sm font-semibold text-gray-700 mb-2 block">
          Email
        </label>

        <input
          v-model="form.email"
          type="email"
          placeholder="Masukkan email"
          class="w-full h-14 rounded-2xl border border-gray-200 px-4 outline-none focus:border-blue-500"
        />

      </div>

      <!-- PASSWORD -->
      <div>

        <label class="text-sm font-semibold text-gray-700 mb-2 block">
          Password
        </label>

        <input
          v-model="form.password"
          type="password"
          placeholder="Masukkan password"
          class="w-full h-14 rounded-2xl border border-gray-200 px-4 outline-none focus:border-blue-500"
        />

      </div>

      <!-- INFO -->
      <div class="mt-5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-2xl p-4 text-sm leading-relaxed">

        Login bersifat rahasia dan hanya digunakan
        untuk kebutuhan tertentu oleh inspector resmi.

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
        @click="submitLogin"
        :disabled="auth.isLoading"
        class="w-full mt-8 h-14 rounded-2xl bg-blue-600 text-white font-semibold shadow-lg active:scale-[0.98] transition disabled:opacity-60"
      >

        <span v-if="!auth.isLoading">
          Login
        </span>

        <span v-else>
          Memproses...
        </span>

      </button>

    </div>

  </div>
</template>

<script setup lang="ts">

import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Device } from '@capacitor/device'

import { useAuthStore } from '../../stores/auth(local)'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({
  email: '',
  password: '',
})

async function submitLogin() {

  try {

    const info = await Device.getId()
    const deviceInfo = await Device.getInfo()

    await auth.login({

      email: form.email,
      password: form.password,

      device_id: info.identifier,

      device_name:
        deviceInfo.model || 'Unknown Device',

      device_platform:
        deviceInfo.platform || 'Unknown Platform',
    })

    router.replace('/dashboard/home')

  } catch (err) {
    console.error(err)
  }
}

</script>