<script setup lang="ts">
import { ref } from 'vue'

import {
  downloadAppUpdate
} from '../services/device'

const props = defineProps({

  visible: Boolean,

  data: {

    type: Object,

    default: null

  }

})

const emit = defineEmits([
  'close'
])

const downloading =
  ref(false)

const downloaded =
  ref(false)

/**
 * START UPDATE
 */
async function startUpdate() {

  try {

    downloading.value = true

    await downloadAppUpdate(
      props.data.apkUrl
    )

    setTimeout(() => {

      downloading.value = false

      downloaded.value = true

    }, 1500)

  } catch (error) {

    console.log(error)

    downloading.value = false

  }

}

/**
 * CLOSE
 */
function closeModal() {

  if (
    props.data?.forceUpdate
  ) {
    return
  }

  emit('close')

}
</script>

<template>

  <transition name="fade">

    <div
      v-if="visible"
      class="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
    >

      <div
        class="w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl"
      >

        <!-- HEADER -->
        <div
          class="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 px-6 py-7 text-center relative overflow-hidden"
        >

          <div
            class="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"
          ></div>

          <div
            class="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-white/10"
          ></div>

          <div class="relative z-10">

            <div
              class="w-20 h-20 mx-auto rounded-3xl bg-white/15 backdrop-blur-lg border border-white/20 flex items-center justify-center text-5xl shadow-xl"
            >
              🚀
            </div>

            <h2
              class="mt-5 text-2xl font-bold text-white"
            >
              Update Tersedia
            </h2>

            <p
              class="mt-2 text-sm text-blue-100"
            >
              Versi terbaru aplikasi telah tersedia
            </p>

          </div>

        </div>

        <!-- CONTENT -->
        <div class="p-6">

          <!-- VERSION -->
          <div
            class="flex items-center justify-between rounded-2xl bg-gray-100 px-4 py-3"
          >

            <div>

              <p
                class="text-xs text-gray-500"
              >
                Versi Saat Ini
              </p>

              <p
                class="font-bold text-gray-800 mt-1"
              >
                v{{ data?.currentVersion }}
              </p>

            </div>

            <div class="text-2xl">
              ➜
            </div>

            <div class="text-right">

              <p
                class="text-xs text-gray-500"
              >
                Versi Terbaru
              </p>

              <p
                class="font-bold text-blue-600 mt-1"
              >
                v{{ data?.latestVersion }}
              </p>

            </div>

          </div>

          <!-- CHANGELOG -->
          <div
            class="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4"
          >

            <div
              class="flex items-center gap-2"
            >

              <span class="text-lg">
                ✨
              </span>

              <h3
                class="font-semibold text-blue-800"
              >
                Changelog
              </h3>

            </div>

            <p
              class="mt-2 text-sm leading-relaxed text-blue-700"
            >
              {{ data?.message }}
            </p>

          </div>

          <!-- DOWNLOADING -->
          <div
            v-if="downloading"
            class="mt-5"
          >

            <div
              class="flex items-center justify-between mb-2"
            >

              <p
                class="text-sm font-medium text-gray-700"
              >
                Menghubungkan downloader...
              </p>

              <p
                class="text-sm font-bold text-blue-600"
              >
                Mohon tunggu
              </p>

            </div>

            <div
              class="w-full h-3 rounded-full bg-gray-200 overflow-hidden"
            >

              <div
                class="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 animate-pulse"
                style="width: 100%"
              ></div>

            </div>

          </div>

          <!-- DOWNLOAD SUCCESS -->
          <div
            v-if="downloaded"
            class="mt-5 rounded-2xl bg-green-50 border border-green-200 p-4"
          >

            <div
              class="flex items-start gap-3"
            >

              <div
                class="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center text-xl"
              >
                📥
              </div>

              <div>

                <h3
                  class="font-bold text-green-800"
                >
                  APK Sedang Diunduh
                </h3>

                <div
                  class="mt-2 text-sm text-green-700 leading-relaxed space-y-1"
                >

                  <p>
                    1. Tunggu proses download selesai
                  </p>

                  <p>
                    2. Buka notifikasi download Android
                  </p>

                  <p>
                    3. Klik file APK yang sudah selesai
                  </p>

                  <p>
                    4. Klik Install / Update
                  </p>

                  <p>
                    5. Tunggu proses instalasi selesai
                  </p>

                </div>

              </div>

            </div>

          </div>

          <!-- BUTTON -->
          <div
            v-if="
              !downloading &&
              !downloaded
            "
            class="grid grid-cols-2 gap-3 mt-6"
          >

            <button
              @click="closeModal"
              class="h-12 rounded-2xl bg-gray-100 text-gray-700 font-semibold active:scale-95 transition"
            >
              Nanti
            </button>

            <button
              @click="startUpdate"
              class="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-bold shadow-lg active:scale-95 transition"
            >
              Update
            </button>

          </div>

          <!-- FORCE UPDATE -->
          <div
            v-if="data?.forceUpdate"
            class="mt-4 text-center"
          >

            <p
              class="text-xs text-red-500 font-medium"
            >
              Update wajib dilakukan untuk melanjutkan penggunaan aplikasi
            </p>

          </div>

        </div>

      </div>

    </div>

  </transition>

</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>