<!-- components/tugas/TemplateSelector.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  updateInspectionTemplateForm,
  updateInspectionTemplateReport
} from '../../services/inspectionTemplateService'

interface TemplateOption {
  id: number
  name: string
}

interface TemplateData {
  selected: { id: number | null; name: string | null }
  is_editable: boolean
  options: TemplateOption[]
}

const props = defineProps<{
  type: 'form' | 'report'
  jobId: string
  templateData: TemplateData
}>()

const emit = defineEmits<{
  updated: []
}>()

const updating = ref(false)
const selectedId = ref<number | null>(props.templateData.selected.id)

// Sinkronkan jika prop berubah dari luar (e.g. setelah refresh)
watch(() => props.templateData.selected.id, (val) => {
  selectedId.value = val
})

const label = props.type === 'form' ? 'Form Inspeksi' : 'Report Inspeksi'
const icon = props.type === 'form'
  ? 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
  : 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'

const handleChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newId = target.value ? Number(target.value) : null
  selectedId.value = newId
  updating.value = true
  try {
    if (props.type === 'form') {
      await updateInspectionTemplateForm(Number(props.jobId), { template_id: newId })
    } else {
      await updateInspectionTemplateReport(Number(props.jobId), { report_template_id: newId })
    }
    emit('updated')
  } catch (e: any) {
    alert(e?.response?.data?.message ?? `Gagal mengupdate template ${label}`)
    // rollback
    selectedId.value = props.templateData.selected.id
  } finally {
    updating.value = false
  }
}
</script>

<template>
  <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
    <!-- Header -->
    <h3 class="text-xs font-semibold text-gray-400 mb-3 flex items-center">
      <svg class="w-4 h-4 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon" />
      </svg>
      TEMPLATE {{ label.toUpperCase() }}
    </h3>

    <!-- Editable: tampilkan select -->
    <div v-if="templateData.is_editable" class="relative">
      <select
        :value="selectedId ?? ''"
        @change="handleChange"
        :disabled="updating"
        class="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <option value="">-- Pilih Template --</option>
        <option
          v-for="opt in templateData.options"
          :key="opt.id"
          :value="opt.id"
        >
          {{ opt.name }}
        </option>
      </select>

      <!-- Arrow icon -->
      <div class="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg v-if="!updating" class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
        <svg v-else class="w-4 h-4 text-blue-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      </div>

      <!-- Hint belum dipilih -->
      <p v-if="!selectedId" class="mt-2 text-xs text-amber-500 flex items-center gap-1">
        <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Template belum dipilih, akan menggunakan template default
      </p>
    </div>

    <!-- Not editable: tampilkan nilai saja -->
    <div v-else>
      <div v-if="templateData.selected.name" class="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <p class="font-medium text-blue-700 text-sm">{{ templateData.selected.name }}</p>
      </div>
      <div v-else class="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <p class="text-amber-600 text-sm flex items-center gap-2">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Template belum dipilih, akan menggunakan template default
        </p>
      </div>
    </div>
  </div>
</template>