<template>
  <div class="min-h-screen bg-gray-100 relative">

    <!-- =====================================================
         OVERLAY LOADING LOGOUT
    ====================================================== -->

    <transition name="fade">

      <div
        v-if="isLoggingOut"
        class="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center"
      >

        <div
          class="bg-white rounded-3xl px-8 py-7 flex flex-col items-center shadow-2xl"
        >

          <div
            class="w-14 h-14 border-[5px] border-blue-200 border-t-blue-600 rounded-full animate-spin"
          ></div>

          <p
            class="mt-5 text-sm font-semibold text-gray-700"
          >
            Sedang keluar akun...
          </p>

        </div>

      </div>

    </transition>

    <!-- =====================================================
         MODAL KONFIRMASI LOGOUT
    ====================================================== -->

    <transition name="fade">

      <div
        v-if="showLogoutModal"
        class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
      >

        <div
          class="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-slideUp"
        >

          <div class="flex justify-center">

            <div
              class="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-3xl"
            >
              🚪
            </div>

          </div>

          <div class="text-center mt-4">

            <h2
              class="text-lg font-bold text-gray-900"
            >
              Keluar Akun
            </h2>

            <p
              class="text-sm text-gray-500 mt-2 leading-relaxed"
            >
              Apakah anda yakin ingin keluar dari aplikasi inspection ini?
            </p>

          </div>

          <div
            class="grid grid-cols-2 gap-3 mt-6"
          >

            <button
              @click="showLogoutModal = false"
              class="h-11 rounded-2xl bg-gray-100 text-gray-700 font-semibold active:scale-95 transition"
            >
              Batal
            </button>

            <button
              @click="confirmLogout"
              class="h-11 rounded-2xl bg-red-500 text-white font-semibold active:scale-95 transition"
            >
              Keluar
            </button>

          </div>

        </div>

      </div>

    </transition>

    <!-- =====================================================
         MODAL DEVELOPMENT
    ====================================================== -->

    <transition name="fade">

      <div
        v-if="showDevModal"
        class="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
      >

        <div
          class="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-slideUp"
        >

          <div class="flex justify-center">

            <div
              class="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl"
            >
              🚧
            </div>

          </div>

          <div class="text-center mt-4">

            <h2
              class="text-lg font-bold text-gray-900"
            >
              Dalam Pengembangan
            </h2>

            <p
              class="text-sm text-gray-500 mt-2 leading-relaxed"
            >
              Fitur ini sedang dalam tahap pengembangan dan akan segera hadir.
            </p>

          </div>

          <button
            @click="showDevModal = false"
            class="w-full h-11 mt-6 rounded-2xl bg-blue-500 text-white font-semibold active:scale-95 transition"
          >
            Oke Mengerti
          </button>

        </div>

      </div>

    </transition>

    <!-- =====================================================
         CONTENT
    ====================================================== -->

    <main class="px-3 pt-3 pb-20 space-y-3">

      <!-- =====================================================
           PROFILE CARD
      ====================================================== -->

      <div
        class="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-5 shadow-xl"
      >

        <!-- BG -->
        <div
          class="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full pointer-events-none"
        ></div>

        <div
          class="absolute bottom-0 right-0 w-28 h-28 bg-white/10 rounded-full pointer-events-none"
        ></div>

        <div class="relative z-10">

          <!-- TOP -->
          <div class="flex items-center gap-4">

            <!-- AVATAR -->
            <div
              class="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl shadow-lg flex-shrink-0"
            >
              👨‍🔧
            </div>

            <!-- USER INFO -->
            <div class="flex-1 min-w-0">

              <!-- LOADING -->
              <template v-if="profileLoading">

                <div
                  class="flex items-center gap-2 flex-wrap"
                >

                  <div
                    class="sk-white h-5 w-36 rounded-lg"
                  ></div>

                  <div
                    class="sk-white h-5 w-14 rounded-full"
                  ></div>

                </div>

                <div
                  class="sk-white h-4 w-28 rounded-lg mt-2"
                ></div>

                <div
                  class="sk-white h-6 w-40 rounded-full mt-3"
                ></div>

              </template>

              <!-- DATA -->
              <template v-else>

                <div
                  class="flex items-center gap-2 flex-wrap"
                >

                  <h1
                    class="text-xl font-bold text-white truncate"
                  >
                    {{ profile?.name || '-' }}
                  </h1>

                  <div
                    class="px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur"
                    :class="profile?.is_active
                      ? 'bg-green-400/20 text-white border border-green-300/30'
                      : 'bg-red-400/20 text-white border border-red-300/30'"
                  >
                    {{ profile?.is_active ? 'Aktif' : 'Nonaktif' }}
                  </div>

                </div>

                <div
                  v-if="profile?.regions?.length"
                  class="flex items-center gap-1.5 mt-2"
                >

                  <span class="text-sm">
                    📍
                  </span>

                  <p
                    class="text-sm text-blue-50 truncate font-medium"
                  >
                    {{ profile.regions[0]?.name }}
                  </p>

                </div>

                <div
                  class="flex flex-wrap gap-2 mt-3"
                >

                  <div
                    class="px-3 py-1 rounded-full bg-white/15 backdrop-blur text-[11px] text-white border border-white/10"
                  >
                    {{ profile?.email_verified ? '✅ Email Terverifikasi' : '⚠️ Email Belum Verifikasi' }}
                  </div>

                </div>

              </template>

            </div>

          </div>

          <!-- CONTACT -->
          <div class="mt-5 grid grid-cols-1 gap-3">

            <!-- EMAIL -->
            <div
              class="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3"
            >

              <div
                class="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0"
              >
                <span class="text-lg">📧</span>
              </div>

              <div class="min-w-0 flex-1">

                <p
                  class="text-[11px] text-blue-100 uppercase tracking-wide"
                >
                  Email
                </p>

                <div
                  v-if="profileLoading"
                  class="sk-white h-4 w-48 rounded-lg mt-1"
                ></div>

                <p
                  v-else
                  class="text-sm text-white font-medium truncate mt-0.5"
                >
                  {{ profile?.email || '-' }}
                </p>

              </div>

            </div>

            <!-- PHONE -->
            <div
              class="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3"
            >

              <div
                class="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0"
              >
                <span class="text-lg">📱</span>
              </div>

              <div class="min-w-0 flex-1">

                <p
                  class="text-[11px] text-blue-100 uppercase tracking-wide"
                >
                  Nomor HP
                </p>

                <div
                  v-if="profileLoading"
                  class="sk-white h-4 w-36 rounded-lg mt-1"
                ></div>

                <p
                  v-else
                  class="text-sm text-white font-medium mt-0.5"
                >
                  {{ profile?.phone || '-' }}
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

      <!-- =====================================================
           UPDATE CARD
      ====================================================== -->

      <div
        v-if="updateAvailable"
        class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 p-5 shadow-xl"
      >

        <!-- BG -->
        <div
          class="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10"
        ></div>

        <div
          class="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10"
        ></div>

        <div class="relative z-10">

          <div
            class="flex items-start gap-4"
          >

            <div
              class="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center text-3xl flex-shrink-0"
            >
              🚀
            </div>

            <div class="flex-1 min-w-0">

              <div
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold"
              >
                <span
                  class="w-2 h-2 rounded-full bg-white animate-pulse"
                ></span>

                UPDATE TERSEDIA
              </div>

              <h2
                class="mt-3 text-xl font-bold text-white leading-tight"
              >
                Versi Baru Tersedia
              </h2>

              <p
                class="mt-1 text-sm text-orange-50"
              >
                v{{ latestVersion }}
              </p>

            </div>

          </div>

          <!-- CHANGELOG -->
          <div
            class="mt-4 rounded-2xl bg-white/15 backdrop-blur border border-white/10 p-4"
          >

            <p
              class="text-xs uppercase tracking-wide text-orange-100"
            >
              Changelog
            </p>

            <p
              class="mt-2 text-sm text-white leading-relaxed"
            >
              {{ updateMessage }}
            </p>

          </div>

          <!-- BUTTON -->
          <button
            @click="startAppUpdate"
            :disabled="updatingApp"
            class="w-full h-12 mt-5 rounded-2xl bg-white text-orange-600 font-bold shadow-lg active:scale-95 transition disabled:opacity-70"
          >

            <div
              class="flex items-center justify-center gap-2"
            >

              <div
                v-if="updatingApp"
                class="w-5 h-5 border-[3px] border-orange-200 border-t-orange-500 rounded-full animate-spin"
              ></div>

              <span>
                {{
                  updatingApp
                    ? 'Membuka downloader...'
                    : 'Update Sekarang'
                }}
              </span>

            </div>

          </button>

        </div>

      </div>

      <!-- =====================================================
          ACHIEVEMENT
      ====================================================== -->

      <div class="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">

        <div class="flex items-start justify-between">

          <div>

            <p class="text-xs text-gray-500">
              Pencapaian
            </p>

            <!-- LOADING -->
            <div
              v-if="profileLoading"
              class="sk h-8 w-36 rounded-lg mt-1"
            ></div>

            <h2
              v-else
              class="text-2xl font-bold text-gray-800 mt-1"
            >
              {{ profile?.inspection_stats?.this_month ?? 0 }} Kendaraan
            </h2>

            <!-- LOADING -->
            <div
              v-if="profileLoading"
              class="sk h-6 w-40 rounded-full mt-3"
            ></div>

            <div
              v-else
              class="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full"
              :class="{
                'bg-green-100': profile?.inspection_stats?.trend === 'up',
                'bg-red-100':   profile?.inspection_stats?.trend === 'down',
                'bg-gray-100':  profile?.inspection_stats?.trend === 'stable',
              }"
            >

              <span
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-green-500': profile?.inspection_stats?.trend === 'up',
                  'bg-red-500':   profile?.inspection_stats?.trend === 'down',
                  'bg-gray-400':  profile?.inspection_stats?.trend === 'stable',
                }"
              ></span>

              <p
                class="text-xs font-medium"
                :class="{
                  'text-green-700': profile?.inspection_stats?.trend === 'up',
                  'text-red-700':   profile?.inspection_stats?.trend === 'down',
                  'text-gray-600':  profile?.inspection_stats?.trend === 'stable',
                }"
              >
                <template v-if="profile?.inspection_stats?.trend === 'up'">
                  +{{ profile.inspection_stats.percentage }}% dari bulan lalu
                </template>

                <template v-else-if="profile?.inspection_stats?.trend === 'down'">
                  -{{ profile.inspection_stats.percentage }}% dari bulan lalu
                </template>

                <template v-else>
                  Stabil dari bulan lalu
                </template>
              </p>

            </div>

          </div>

          <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            :class="{
              'bg-green-100': profile?.inspection_stats?.trend === 'up',
              'bg-red-100':   profile?.inspection_stats?.trend === 'down',
              'bg-gray-100':  profile?.inspection_stats?.trend === 'stable' || !profile?.inspection_stats,
            }"
          >
            <template v-if="profile?.inspection_stats?.trend === 'up'">🏆</template>
            <template v-else-if="profile?.inspection_stats?.trend === 'down'">📉</template>
            <template v-else>📊</template>
          </div>

        </div>

      </div>

      <!-- =====================================================
           MENU
      ====================================================== -->

      <div
        class="bg-white rounded-3xl shadow-sm overflow-hidden"
      >

        <div
          v-for="item in menuItems"
          :key="item.title"
          @click="handleMenuClick(item)"
          class="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 active:bg-gray-50 transition"
        >

          <div
            class="flex items-center gap-3"
          >

            <div
              class="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center"
            >
              <span class="text-xl">
                {{ item.icon }}
              </span>
            </div>

            <div>

              <p
                class="font-semibold text-gray-800 text-sm"
              >
                {{ item.title }}
              </p>

              <p
                class="text-xs text-gray-500 mt-0.5"
              >
                {{ item.subtitle }}
              </p>

            </div>

          </div>

          <span
            class="text-gray-400 text-lg"
          >
            ›
          </span>

        </div>

      </div>

      <!-- =====================================================
           LOGOUT
      ====================================================== -->

      <button
        @click="showLogoutModal = true"
        class="w-full py-3.5 rounded-3xl bg-red-500 text-white font-semibold shadow-lg active:scale-95 transition"
      >

        <div
          class="flex items-center justify-center gap-2"
        >

          <span class="text-lg">
            🚪
          </span>

          <span>
            Keluar Akun
          </span>

        </div>

      </button>

      <!-- VERSION -->
      <div class="text-center pb-4">

        <p
          class="text-xs text-gray-400"
        >
          App Version {{ appVersion }}
          <!-- ({{ appBuild }}) -->
        </p>

      </div>

    </main>

  </div>
</template>

<script setup lang="ts">
import {
  onMounted,
  ref
} from 'vue'

import {
  useRouter
} from 'vue-router'

import {
  useAuthStore
} from '../stores/auth(local)'

import {
  profileService
} from '../services/profileService'

import type {
  UserProfile
} from '../types/profile'

import {

  getAppVersion,
  checkAppUpdate,
  downloadAppUpdate

} from '../services/device'

const router = useRouter()

const authStore =
  useAuthStore()

const profile =
  ref<UserProfile | null>(null)

const profileLoading =
  ref(true)

const showLogoutModal =
  ref(false)

const showDevModal =
  ref(false)

const isLoggingOut =
  ref(false)

const appVersion =
  ref('')

const appBuild =
  ref('')

/**
 * =========================================================
 * UPDATE STATE
 * =========================================================
 */

const updateAvailable =
  ref(false)

const latestVersion =
  ref('')

const updateMessage =
  ref('')

const apkUrl =
  ref('')

const updatingApp =
  ref(false)

/**
 * =========================================================
 * MENU
 * =========================================================
 */

const menuItems = [

  {

    icon: '🛟',

    title: 'Bantuan',

    subtitle:
      'Pusat bantuan dan informasi',

    development: true

  },

  {

    icon: '🔔',

    title: 'Notifikasi',

    subtitle:
      'Pemberitahuan aplikasi',

    development: true

  },

  {

    icon: '⚙️',

    title: 'Pengaturan',

    subtitle:
      'Tema dan preferensi aplikasi',

    route: '/settings'

  },

  {

    icon: '📊',

    title: 'Laporan Kinerja',

    subtitle:
      'Statistik dan performa inspeksi',

    route: '/laporan'

  },

  {

    icon: '🏦',

    title: 'Bank Account',

    subtitle:
      'Kelola rekening bank untuk pembayaran',

    route: '/bank-accounts'

  },

]

/**
 * =========================================================
 * FETCH APP VERSION
 * =========================================================
 */

async function fetchAppVersion() {

  try {

    const result =
      await getAppVersion()

    if (
      result.success &&
      result.data
    ) {

      appVersion.value =
        result.data.version

      appBuild.value =
        String(result.data.build)

    }

  } catch (error) {

    console.log(error)

  }

}

/**
 * =========================================================
 * CHECK APP UPDATE
 * =========================================================
 */

async function fetchAppUpdate() {

  try {

    const result =
      await checkAppUpdate()

    if (
      !result.success ||
      !result.updateAvailable
    ) {
      return
    }

    updateAvailable.value =
      true

    latestVersion.value =
      result.latestVersion

    updateMessage.value =
      result.message

    apkUrl.value =
      result.apkUrl

  } catch (error) {

    console.log(error)

  }

}

/**
 * =========================================================
 * START UPDATE
 * =========================================================
 */

async function startAppUpdate() {

  try {

    updatingApp.value = true

    await downloadAppUpdate(
      apkUrl.value
    )

  } catch (error) {

    console.log(error)

  } finally {

    setTimeout(() => {

      updatingApp.value = false

    }, 1500)

  }

}

/**
 * =========================================================
 * FETCH PROFILE
 * =========================================================
 */

async function fetchProfile() {

  try {

    profileLoading.value = true

    const response =
      await profileService.me()

    profile.value =
      response.data.user

  } catch (error) {

    console.error(error)

  } finally {

    profileLoading.value = false

  }

}

/**
 * =========================================================
 * HANDLE MENU
 * =========================================================
 */

function handleMenuClick(item: any) {

  if (item.development) {

    showDevModal.value = true
    return

  }

  if (item.route) {

    router.push(item.route)

  }

}

/**
 * =========================================================
 * LOGOUT
 * =========================================================
 */

async function confirmLogout() {

  try {

    showLogoutModal.value = false

    isLoggingOut.value = true

    await authStore.logout()

  } catch (error) {

    console.error(error)

  } finally {

    isLoggingOut.value = false

  }

}

/**
 * =========================================================
 * MOUNTED
 * =========================================================
 */

onMounted(() => {

  fetchProfile()

  fetchAppVersion()

  /**
   * check update background
   */
  setTimeout(() => {

    fetchAppUpdate()

  }, 1500)

})
</script>

<style scoped>
/* =========================================================
   SKELETON
========================================================= */

.sk {
  background: linear-gradient(
    90deg,
    #e5e7eb 25%,
    #f3f4f6 50%,
    #e5e7eb 75%
  );

  background-size: 200% 100%;

  animation:
    sk-shimmer 1.4s ease-in-out infinite;

  display: block;
}

.sk-white {

  background: linear-gradient(

    90deg,

    rgba(255,255,255,0.15) 25%,

    rgba(255,255,255,0.30) 50%,

    rgba(255,255,255,0.15) 75%

  );

  background-size: 200% 100%;

  animation:
    sk-shimmer 1.4s ease-in-out infinite;

  display: block;

}

@keyframes sk-shimmer {

  0% {

    background-position: 200% 0;

  }

  100% {

    background-position: -200% 0;

  }

}

/* =========================================================
   MODAL
========================================================= */

.fade-enter-active,
.fade-leave-active {

  transition: all 0.2s ease;

}

.fade-enter-from,
.fade-leave-to {

  opacity: 0;

}

/* =========================================================
   SLIDE UP
========================================================= */

@keyframes slideUp {

  from {

    transform:
      translateY(40px);

    opacity: 0;

  }

  to {

    transform:
      translateY(0);

    opacity: 1;

  }

}

.animate-slideUp {

  animation:
    slideUp 0.25s ease;

}
</style>