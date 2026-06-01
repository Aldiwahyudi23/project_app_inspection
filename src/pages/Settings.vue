<template>
  <div class="fixed inset-0 bg-gray-100 flex flex-col">

    <!-- ═══════════════════════════════════════════════════════
         HEADER
    ═══════════════════════════════════════════════════════ -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 pt-3 pb-4 shadow-lg flex-shrink-0 z-10">
      <div class="flex items-center gap-2">
        <button
          @click="router.back()"
          class="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95"
        >
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-base font-semibold">Template Inspeksi</h1>

        <!-- Refresh button -->
        <div class="ml-auto">
          <button
            @click="fetchSettings"
            class="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95"
          >
            <svg
              class="w-5 h-5 text-white"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
              stroke-width="2"
              :class="{ 'animate-spin': loading }"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.458 9A7.962 7.962 0 014 12c0 4.418 3.582 8 8 8a8 8 0 007.938-7M18.542 15A7.962 7.962 0 0020 12c0-4.418-3.582-8-8-8a8 8 0 00-7.938 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         SCROLL AREA
    ═══════════════════════════════════════════════════════ -->
    <main class="flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-4">

      <!-- ── LOADING SKELETON ── -->
      <template v-if="loading">

        <!-- Hero skeleton -->
        <div class="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 p-5 shadow-lg">
          <div class="sk sk-text-sm w-32 mb-4 opacity-30"></div>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-white/15 rounded-2xl p-4 space-y-2">
              <div class="sk sk-text-xs w-16 opacity-30"></div>
              <div class="sk sk-text-lg w-8 opacity-30"></div>
              <div class="sk sk-text-xs w-20 opacity-30"></div>
            </div>
            <div class="bg-white/15 rounded-2xl p-4 space-y-2">
              <div class="sk sk-text-xs w-16 opacity-30"></div>
              <div class="sk sk-text-lg w-8 opacity-30"></div>
              <div class="sk sk-text-xs w-20 opacity-30"></div>
            </div>
          </div>
        </div>

        <!-- Section skeleton -->
        <div v-for="n in 2" :key="n" class="bg-white rounded-3xl p-5 shadow-sm space-y-4">
          <div class="flex items-center gap-3">
            <div class="sk w-9 h-9 rounded-2xl"></div>
            <div class="space-y-1.5">
              <div class="sk sk-text-base w-32"></div>
              <div class="sk sk-text-xs w-48"></div>
            </div>
          </div>
          <div class="space-y-3">
            <div v-for="i in 3" :key="i" class="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
              <div class="sk w-8 h-8 rounded-xl flex-shrink-0"></div>
              <div class="flex-1 space-y-1.5">
                <div class="sk sk-text-sm w-36"></div>
                <div class="sk sk-text-xs w-24"></div>
              </div>
              <div class="sk w-10 h-5 rounded-full flex-shrink-0"></div>
            </div>
          </div>
        </div>

      </template>

      <!-- ── CONTENT ── -->
      <template v-else>

        <!-- Summary hero card -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 p-5 shadow-lg">
          <div class="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none"></div>
          <div class="absolute bottom-0 right-4 w-20 h-20 bg-white/10 rounded-full pointer-events-none"></div>

          <p class="text-blue-100 text-xs mb-4 relative z-10">Ringkasan Template</p>

          <div class="grid grid-cols-2 gap-3 relative z-10">
            <div class="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p class="text-blue-200 text-[10px] uppercase tracking-wide mb-1">Form</p>
              <p class="text-white font-bold text-2xl">{{ templates.form.length }}</p>
              <p class="text-blue-200 text-xs mt-1">Template form</p>
            </div>
            <div class="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p class="text-blue-200 text-[10px] uppercase tracking-wide mb-1">Report</p>
              <p class="text-white font-bold text-2xl">{{ templates.report.length }}</p>
              <p class="text-blue-200 text-xs mt-1">Template report</p>
            </div>
          </div>
        </div>

        <!-- Delegate ke component utama -->
        <InspectionTemplateSection
          :templates="templates"
          :loading="loading"
          @refresh="fetchSettings"
        />

      </template>

    </main>

  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import InspectionTemplateSection from '../components/settings/InspectionTemplateSection.vue'
import { getSettings } from '../services/settingsService'
import type { InspectionTemplates } from '../types/settings'

const router = useRouter()

const templates = ref<InspectionTemplates>({ form: [], report: [] })
const loading   = ref(false)

async function fetchSettings() {
  try {
    loading.value = true
    const response = await getSettings()
    templates.value = response.data.inspection_templates
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchSettings)
</script>

<style scoped>
.sk {
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.4s ease-in-out infinite;
  border-radius: 6px;
}
@keyframes sk-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.sk-text-xs   { height: 8px;  border-radius: 4px; }
.sk-text-sm   { height: 10px; border-radius: 4px; }
.sk-text-base { height: 14px; border-radius: 4px; }
.sk-text-lg   { height: 20px; border-radius: 4px; }
</style>