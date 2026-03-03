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

          <!--
            Badge: jumlah required item yang belum selesai.
            "Belum selesai" = mainValid false ATAU nested required belum terisi.
          -->
          <span
            v-if="getRemainingCount(section.id) > 0"
            class="ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold"
            :class="activeSection === section.id
              ? 'bg-white/25 text-white'
              : 'bg-red-100 text-red-600'"
          >
            {{ getRemainingCount(section.id) }}
          </span>

          <!--
            Dot: ada item is_visible:false yang belum terisi (bukan damage section).
            Damage section tidak pakai dot karena sudah ada FAB.
          -->
          <span
            v-if="getNativelyHiddenCount(section.id) > 0 && !showHiddenSections[section.id]"
            class="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full border-2 border-white"
          ></span>
        </button>
      </div>
    </div>

    <!--
      Toggle hidden items: HANYA untuk item is_visible:false (bukan damage section).
      Damage section item dikelola via FAB modal.
    -->
    <div
      v-if="activeSection && getNativelyHiddenCount(activeSection) > 0 && !activeSectionIsDamage"
      class="px-4 py-2 bg-blue-50 border-t border-blue-100"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2 text-sm text-blue-800">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
  sections: (Section & { items: any[] })[]
  activeSection: number | null
  values: Record<number, any>
  validationStatus: Record<number, boolean>
  showHiddenSections: Record<number, boolean>
  /**
   * nestedValues — dari InspectionFormView.
   * Key numerik         → { [optVal]: { textarea, image } }
   * Key `img_${itemId}` → { selectedOption, nested: {...} }
   */
  nestedValues: Record<string | number, any>
  uploadStatus: Record<number, { hasUploading: boolean; hasFailed: boolean }>
}>()

defineEmits<{
  (e: 'select',        sectionId: number): void
  (e: 'toggle-hidden', sectionId: number): void
}>()

// ─── Apakah section aktif adalah damage section ─────────────

const activeSectionIsDamage = computed(() => {
  if (!props.activeSection) return false
  const section = props.sections.find(s => s.id === props.activeSection)
  return section?.is_damage_section === true
})

// ─────────────────────────────────────────────────────────────
// NESTED VALIDITY HELPERS
// (Mirror dari InspectionFormView — logika sama persis)
// ─────────────────────────────────────────────────────────────

const hasOptionNestedRequired = (option: any): boolean =>
  (option.show_textarea === true && option.textarea_is_required === true) ||
  (option.show_image    === true && option.image_is_required    === true)

const isOptionNestedFilled = (option: any, inv: any): boolean => {
  if (option.show_textarea === true && option.textarea_is_required === true) {
    const tv = inv?.textarea
    if (!tv || (typeof tv === 'string' && tv.trim() === '')) return false
  }
  if (option.show_image === true && option.image_is_required === true) {
    const iv = inv?.image
    if (!iv || (Array.isArray(iv) && iv.length === 0)) return false
  }
  return true
}

const isNestedValidForItem = (item: any, value: any, nested: Record<string, any>): boolean => {
  if (!item.settings?.options) return true
  if (value === null || value === undefined || value === '') return true
  if (Array.isArray(value) && value.length === 0) return true

  const selectedValues   = Array.isArray(value) ? value : [value]
  const isCheckbox       = item.input_type === 'checkbox'
  const hasMultiSelected = selectedValues.some((optVal: string) => {
    const option = item.settings.options.find((o: any) => o.value === optVal)
    return option && option.multi === true
  })

  if (isCheckbox || hasMultiSelected) {
    const aggregatedOption  = item.settings.options.filter((o: any) => selectedValues.includes(o.value))
    const hasRequiredNested = aggregatedOption.some((o: any) => hasOptionNestedRequired(o))
    if (!hasRequiredNested) return true

    const inv = nested?.['aggregated']
    if (!isOptionNestedFilled({
      show_textarea:        aggregatedOption.some((o: any) => o.show_textarea),
      show_image:           aggregatedOption.some((o: any) => o.show_image),
      textarea_is_required: aggregatedOption.some((o: any) => o.textarea_is_required),
      image_is_required:    aggregatedOption.some((o: any) => o.image_is_required)
    }, inv)) return false
    return true
  }

  for (const optVal of selectedValues) {
    const option = item.settings.options.find((o: any) => o.value === optVal)
    if (!option) continue
    if (!hasOptionNestedRequired(option)) continue
    const inv = nested?.[optVal]
    if (!isOptionNestedFilled(option, inv)) return false
  }

  return true
}

const isImageOptionNestedValid = (item: any, imgNested: any): boolean => {
  if (!item.settings?.show_option) return true
  if (!item.settings?.options?.length) return true

  const optionIsRequired = item.settings?.option_is_required === true

  if (optionIsRequired) {
    const hasSelected = imgNested?.selectedOption != null &&
      (Array.isArray(imgNested.selectedOption)
        ? imgNested.selectedOption.length > 0
        : imgNested.selectedOption !== '')
    if (!hasSelected) return false
  }

  if (!imgNested?.selectedOption) return true

  const selectedValues = Array.isArray(imgNested.selectedOption)
    ? imgNested.selectedOption
    : [imgNested.selectedOption]

  const hasMultiSelected = selectedValues.some((optVal: string) => {
    const option = item.settings.options.find((o: any) => o.value === optVal)
    return option && option.multi === true
  })

  if (hasMultiSelected) {
    const aggregatedOption  = item.settings.options.filter((o: any) => selectedValues.includes(o.value))
    const hasRequiredNested = aggregatedOption.some((o: any) => hasOptionNestedRequired(o))
    if (!hasRequiredNested) return true

    const inv = imgNested?.nested?.['aggregated']
    if (!isOptionNestedFilled({
      show_textarea:        aggregatedOption.some((o: any) => o.show_textarea),
      show_image:           aggregatedOption.some((o: any) => o.show_image),
      textarea_is_required: aggregatedOption.some((o: any) => o.textarea_is_required),
      image_is_required:    aggregatedOption.some((o: any) => o.image_is_required)
    }, inv)) return false
    return true
  }

  for (const optVal of selectedValues) {
    const option = item.settings.options.find((o: any) => o.value === optVal)
    if (!option) continue
    if (!hasOptionNestedRequired(option)) continue
    const inv = imgNested?.nested?.[optVal]
    if (!isOptionNestedFilled(option, inv)) return false
  }

  return true
}

// ─────────────────────────────────────────────────────────────
// BADGE COUNTER
// ─────────────────────────────────────────────────────────────

/**
 * getRemainingCount
 * Jumlah required item yang belum selesai di section ini.
 * Hanya menghitung item yang _finalVisibility = true.
 */
const getRemainingCount = (sectionId: number): number => {
  const section = props.sections.find(s => s.id === sectionId)
  if (!section) return 0

  const visible  = section.items.filter((item: any) => item._finalVisibility === true)
  const required = visible.filter((item: any) => item.is_required === true)

  return required.filter((item: any) => {
    // ✅ Jika ada gambar masih uploading/failed → anggap belum selesai
    const uploadSt = props.uploadStatus?.[item.id]
    if (uploadSt?.hasUploading || uploadSt?.hasFailed) return true

    const mainValid = props.validationStatus[item.id] === true
    if (!mainValid) return true

    if (['radio', 'select', 'checkbox'].includes(item.input_type)) {
      return !isNestedValidForItem(item, props.values[item.id], props.nestedValues[item.id] || {})
    }
    if (item.input_type === 'image' && item.settings?.show_option === true) {
      return !isImageOptionNestedValid(item, props.nestedValues[`img_${item.id}`])
    }

    return false
  }).length
}

/**
 * getNativelyHiddenCount
 *
 * Jumlah item is_visible:false yang masih tersembunyi (belum force-visible).
 * TIDAK termasuk damage section items — mereka dikelola via FAB modal.
 */
const getNativelyHiddenCount = (sectionId: number): number => {
  const section = props.sections.find(s => s.id === sectionId)
  if (!section) return 0
  return section.items.filter((item: any) =>
    item._isNativelyHidden === true &&
    item._isDamageItem     !== true &&
    item._isForceVisible   !== true
  ).length
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>