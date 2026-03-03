<!-- components/inspection/inputs/PercentageInput.vue -->
<template>
  <div class="space-y-1">
    <div class="relative">

      <input
        type="number"
        :value="modelValue ?? ''"
        @input="handleInput"
        @blur="validate"
        :min="computedMin"
        :max="computedMax"
        :step="computedStep"
        :placeholder="`Masukkan ${item.inspection_item.name}`"
        :class="[
          'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-colors pr-12',
          error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-200 hover:border-gray-300'
        ]"
      />

      <span
        v-if="showPercent"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
      >
        %
      </span>

    </div>

    <div
      v-if="error"
      class="text-xs text-red-500 mt-1 flex items-center"
    >
      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      {{ error }}
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FormItem } from '../../../types/formInspection'

const props = defineProps<{
  item: FormItem
  modelValue: number | null
  error?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
  (e: 'update:error', error: string): void
}>()

/* =========================
   SETTINGS FROM BACKEND
========================= */

const rawSettings = computed(() => props.item.settings ?? {})

/* =========================
   PARSED SETTINGS (CASTING)
========================= */

const computedMin = computed(() => {
  const min = rawSettings.value?.min
  return min !== null && min !== undefined
    ? Number(min)
    : undefined
})

const computedMax = computed(() => {
  const max = rawSettings.value?.max
  const allowOver = rawSettings.value?.allow_over_100

  if (allowOver === true) {
    return undefined
  }

  return max !== null && max !== undefined
    ? Number(max)
    : undefined
})

const computedStep = computed(() => {
  const step = rawSettings.value?.step
  return step !== null && step !== undefined
    ? Number(step)
    : 0.1
})

const decimalPlaces = computed(() => {
  const dp = rawSettings.value?.decimal_places
  return dp !== null && dp !== undefined
    ? Number(dp)
    : null
})

const showPercent = computed(() => {
  return rawSettings.value?.show_percent_sign === true
})

/* =========================
   INPUT HANDLER
========================= */

const handleInput = (e: Event) => {
  const input = e.target as HTMLInputElement

  let value =
    input.value === '' ? null : Number(input.value)

  if (
    value !== null &&
    decimalPlaces.value !== null
  ) {
    value = Number(
      value.toFixed(decimalPlaces.value)
    )
  }

  emit('update:modelValue', value)
  validateField(value)
}

/* =========================
   VALIDATION
========================= */

const validateField = (value: number | null) => {
  let errorMessage = ''

  if (props.item.is_required && value === null) {
    errorMessage = 'Field ini harus diisi'
  }

  if (value !== null) {

    if (
      computedMin.value !== undefined &&
      value < computedMin.value
    ) {
      errorMessage = `Minimal ${computedMin.value}%`
    }

    if (
      computedMax.value !== undefined &&
      value > computedMax.value
    ) {
      errorMessage = `Maksimal ${computedMax.value}%`
    }
  }

  emit('update:error', errorMessage)
}

const validate = () => {
  validateField(props.modelValue)
}
</script>