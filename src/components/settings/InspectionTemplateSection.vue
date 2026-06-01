<script setup lang="ts">
import TemplateCard from './TemplateCard.vue'

import type {
  InspectionTemplates,
  InspectionTemplateItem
} from '../../types/settings'

defineProps<{
  templates: InspectionTemplates
  loading?: boolean
}>()

const emit = defineEmits<{
  (
    e: 'refresh'
  ): void
}>()

const handleUpdated = (
  _item: InspectionTemplateItem
) => {

  emit('refresh')
}
</script>

<template>
  <div class="space-y-4">

    <!-- FORM -->
    <div
      class="bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm p-4"
    >

      <div class="mb-3">

        <h2 class="text-base font-bold text-gray-800">
          Template Form
        </h2>

        <p class="text-xs text-gray-500 mt-1">
          Pilih template form default untuk inspeksi
        </p>

      </div>

      <!-- EMPTY STATE -->
      <div
        v-if="templates.form.length === 0"
        class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center"
      >

        <div
          class="w-14 h-14 mx-auto rounded-2xl bg-blue-100 flex items-center justify-center"
        >
          <span class="text-2xl">📋</span>
        </div>

        <h3 class="mt-4 text-sm font-semibold text-gray-800">
          Belum memiliki template form custom
        </h3>

        <p class="mt-2 text-xs leading-relaxed text-gray-500">
          Buat template inspeksi sesuai kebutuhan dan gaya pemeriksaan yang diinginkan.
          Anda bisa mengatur sendiri isi form, urutan menu, dan nama template agar
          proses inspeksi menjadi lebih nyaman dan terstruktur.
        </p>

      </div>

      <!-- LIST -->
      <div
        v-else
        class="space-y-2"
      >

        <TemplateCard
          v-for="item in templates.form"
          :key="item.id"
          :template="item"
          icon="📋"
          @updated="handleUpdated"
        />

      </div>

    </div>

    <!-- REPORT -->
    <div
      class="bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm p-4"
    >

      <div class="mb-3">

        <h2 class="text-base font-bold text-gray-800">
          Template Report
        </h2>

        <p class="text-xs text-gray-500 mt-1">
          Pilih template report default untuk hasil inspeksi
        </p>

      </div>

      <!-- EMPTY STATE -->
      <div
        v-if="templates.report.length === 0"
        class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center"
      >

        <div
          class="w-14 h-14 mx-auto rounded-2xl bg-green-100 flex items-center justify-center"
        >
          <span class="text-2xl">🧾</span>
        </div>

        <h3 class="mt-4 text-sm font-semibold text-gray-800">
          Belum memiliki template report custom
        </h3>

        <p class="mt-2 text-xs leading-relaxed text-gray-500">
          Buat format laporan inspeksi sendiri dengan tampilan dan nama sesuai kebutuhan.
          Anda bisa menentukan susunan laporan agar hasil inspeksi terlihat lebih profesional
          dan mudah dipahami customer.
        </p>

      </div>

      <!-- LIST -->
      <div
        v-else
        class="space-y-2"
      >

        <TemplateCard
          v-for="item in templates.report"
          :key="item.id"
          :template="item"
          icon="🧾"
          @updated="handleUpdated"
        />

      </div>

    </div>

  </div>
</template>