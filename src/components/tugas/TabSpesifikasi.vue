<!-- components/tugas/TabSpesifikasi.vue -->
<script setup lang="ts">
import type { JobDetail } from '../../types/job'
import TemplateSelector from './TemplateSelector.vue'

const props = defineProps<{
  inspection: JobDetail
  jobId: string
}>()

const emit = defineEmits<{
  refreshData: []
}>()
</script>

<template>
  <div class="space-y-4">
    <!-- Spesifikasi Kendaraan -->
    <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center">
        <svg class="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        SPESIFIKASI KENDARAAN
      </h3>

      <div class="grid grid-cols-2 gap-2">
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400">Merek</label>
          <p class="font-semibold text-gray-800">{{ inspection.vehicle.brand || '-' }}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400">Model</label>
          <p class="font-semibold text-gray-800">{{ inspection.vehicle.model || '-' }}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400">Tipe</label>
          <p class="font-semibold text-gray-800">{{ inspection.vehicle.type || '-' }}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400">Tahun</label>
          <p class="font-semibold text-gray-800">{{ inspection.vehicle.year || '-' }}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400">CC Mesin</label>
          <p class="font-semibold text-gray-800">{{ inspection.vehicle.cc ? inspection.vehicle.cc + ' cc' : '-' }}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400">Transmisi</label>
          <p class="font-semibold text-gray-800">{{ inspection.vehicle.transmission?.name || '-' }}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400">Bahan Bakar</label>
          <p class="font-semibold text-gray-800">{{ inspection.vehicle.fuel_type || '-' }}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400">Generasi</label>
          <p class="font-semibold text-gray-800">{{ inspection.vehicle.generation || '-' }}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <label class="text-xs text-gray-400">Origin</label>
          <p class="font-semibold text-gray-800">{{ inspection.vehicle.origin || '-' }}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg col-span-2">
          <label class="text-xs text-gray-400">Periode Pasar</label>
          <p class="font-semibold text-gray-800">{{ inspection.vehicle.market_period || '-' }}</p>
        </div>
      </div>
    </div>

    <!-- Template Form -->
    <TemplateSelector
      v-if="inspection.template_form"
      type="form"
      :job-id="jobId"
      :template-data="inspection.template_form"
      @updated="emit('refreshData')"
    />

    <!-- Template Report -->
    <TemplateSelector
      v-if="inspection.template_report"
      type="report"
      :job-id="jobId"
      :template-data="inspection.template_report"
      @updated="emit('refreshData')"
    />

    <!-- Template lama (fallback jika tidak ada template_form/report) -->
    <div v-if="inspection.template && !inspection.template_form" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center">
        <svg class="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        TEMPLATE INSPEKSI
      </h3>
      <div class="bg-blue-50 p-3 rounded-lg">
        <p class="font-medium text-blue-700">{{ inspection.template.name }}</p>
      </div>
    </div>
  </div>
</template>