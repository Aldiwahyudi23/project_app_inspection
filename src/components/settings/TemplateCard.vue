<script setup lang="ts">
import { ref } from 'vue'

import {
  LoaderCircle
} from 'lucide-vue-next'

import {
  updateDefaultInspectionTemplate
} from '../../services/settingsService'

import type {
  InspectionTemplateItem
} from '../../types/settings'

const props = defineProps<{
  template: InspectionTemplateItem
  icon?: string
}>()

const emit = defineEmits<{
  (
    e: 'updated',
    item: InspectionTemplateItem
  ): void
}>()

const loading = ref(false)

const setDefault = async () => {

  // cegah double click
  if (loading.value) return

  try {

    loading.value = true

    const newValue =
      !props.template.is_default

    await updateDefaultInspectionTemplate(
      props.template.id,
      {
        is_default: newValue
      }
    )

    emit('updated', props.template)

  } catch (error) {

    console.error(error)

  } finally {

    loading.value = false
  }
}
</script>

<template>
  <button
    @click="setDefault"
    :disabled="loading"
    class="w-full text-left transition active:scale-[0.98]"
  >

    <div
      class="relative flex items-center justify-between p-3 rounded-2xl border transition-all duration-200"
      :class="[
        template.is_default
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white',

        loading
          ? 'opacity-70'
          : ''
      ]"
    >

      <!-- LOADING OVERLAY -->
      <div
        v-if="loading"
        class="absolute inset-0 rounded-2xl bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10"
      >
        <LoaderCircle
          class="w-5 h-5 animate-spin text-blue-600"
        />
      </div>

      <!-- LEFT -->
      <div
        class="flex items-center gap-3 flex-1 min-w-0"
      >

        <!-- ICON -->
        <div
          class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          :class="template.is_default
            ? 'bg-blue-100'
            : 'bg-gray-100'"
        >
          <span class="text-lg">
            {{ icon }}
          </span>
        </div>

        <!-- CONTENT -->
        <div class="min-w-0">

          <div
            class="flex items-center gap-2 flex-wrap"
          >

            <h3
              class="font-semibold text-sm text-gray-800 truncate"
            >
              {{ template.name }}
            </h3>

            <span
              v-if="template.is_default"
              class="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-medium"
            >
              Default
            </span>

          </div>


        </div>

      </div>

      <!-- RIGHT -->
      <div
        class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
        :class="template.is_default
          ? 'border-blue-600 bg-blue-600'
          : 'border-gray-300'"
      >

        <div
          v-if="template.is_default"
          class="w-2 h-2 rounded-full bg-white"
        />

      </div>

    </div>

  </button>
</template>