<!-- components/inspection/InspectionNavigation.vue -->
<template>
  <div class="bg-white border-b border-gray-200 sticky top-[57px] z-20">
    <!-- Tabs -->
    <div class="px-4 overflow-x-auto scrollbar-hide">
      <div class="flex space-x-2 py-3">
        <button
          v-for="section in sections"
          :key="section.id"
          @click="$emit('select', section.id)"
          class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center relative"
          :class="[
            activeSection === section.id
              ? 'bg-blue-500 text-white shadow-md'
              : section.is_damage_section
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ section.name }}

          <!-- Badge: jumlah required item yang belum valid -->
          <span
            v-if="getRemainingCount(section.id) > 0"
            class="ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold"
            :class="activeSection === section.id
              ? 'bg-white/25 text-white'
              : 'bg-red-100 text-red-600'"
          >
            {{ getRemainingCount(section.id) }}
          </span>

          <!-- Dot: ada item tersembunyi yang belum terisi -->
          <span
            v-if="getNativelyHiddenCount(section.id) > 0 && !showHiddenSections[section.id]"
            class="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full border-2 border-white"
          ></span>
        </button>
      </div>
    </div>

    <!-- Toggle hidden items -->
    <div
      v-if="activeSection && getNativelyHiddenCount(activeSection) > 0 && !activeSectionIsDamage"
      class="px-4 py-2 bg-blue-50 border-t border-blue-100"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2 text-sm text-blue-800">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ getNativelyHiddenCount(activeSection) }} item tersembunyi di section ini</span>
        </div>
        <button
          @click="$emit('toggle-hidden', activeSection)"
          class="text-sm text-blue-600 font-medium hover:text-blue-700"
        >
          {{ showHiddenSections[activeSection] ? 'Sembunyikan' : 'Tampilkan' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Section } from '../../types/formInspection'

const props = defineProps<{
  sections:           (Section & { items: any[] })[]
  activeSection:      number | null
  values:             Record<number, any>
  validationStatus:   Record<number, boolean>
  showHiddenSections: Record<number, boolean>
  uploadStatus:       Record<number, { hasUploading: boolean; hasFailed: boolean }>
}>()

defineEmits<{
  (e: 'select',        sectionId: number): void
  (e: 'toggle-hidden', sectionId: number): void
}>()

// ── Apakah section aktif adalah damage section ────────────────
const activeSectionIsDamage = computed(() => {
  if (!props.activeSection) return false
  const section = props.sections.find(s => s.id === props.activeSection)
  return section?.is_damage_section === true
})

// ─────────────────────────────────────────────────────────────
// BADGE COUNTER
//
// Sekarang sederhana: cukup cek validationStatus[item.id].
// Validasi sudah dilakukan di dalam masing-masing komponen input
// dan diteruskan via update:valid → FormInspectionView → validationStatus.
// ─────────────────────────────────────────────────────────────

const getRemainingCount = (sectionId: number): number => {
  const section = props.sections.find(s => s.id === sectionId)
  if (!section) return 0

  const visible  = section.items.filter((item: any) => item._finalVisibility === true)
  const required = visible.filter((item: any) => item.is_required === true)

  return required.filter((item: any) => {
    // Ada upload yang masih jalan/gagal → belum selesai
    const uploadSt = props.uploadStatus?.[item.id]
    if (uploadSt?.hasUploading || uploadSt?.hasFailed) return true

    // Gunakan validationStatus dari komponen — tidak ada double validasi
    return props.validationStatus[item.id] !== true
  }).length
}

const getNativelyHiddenCount = (sectionId: number): number => {
  const section = props.sections.find(s => s.id === sectionId)
  if (!section) return 0
  return section.items.filter((item: any) =>
    item._isNativelyHidden === true &&
    item._isDamageItem     !== true &&
    item._isForceVisible   !== true &&
    item._isFeatureItem    !== true
  ).length
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>