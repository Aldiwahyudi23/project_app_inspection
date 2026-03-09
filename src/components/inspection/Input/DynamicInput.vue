<!-- components/inspection/Input/DynamicInput.vue -->
<template>
  <component
    :is="inputComponent"
    :item="item"
    :inspectionId="inspectionId"
    :model-value="modelValue"
    :metadata="metadata"
    :error="error"
    :disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
    @update:error="$emit('update:error', $event)"
    @update:valid="$emit('update:valid', $event)"
    @update:upload-status="$emit('update:uploadStatus', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FormItem, Metadata } from '../../../types/formInspection'

import TextInput       from './TextInput.vue'
import TextareaInput   from './TextareaInput.vue'
import NumberInput     from './NumberInput.vue'
import CurrencyInput   from './CurrencyInput.vue'
import PercentageInput from './PercentageInput.vue'
import SelectInput     from './SelectInput.vue'
import RadioInput      from './RadioInput.vue'
import CheckboxInput   from './CheckboxInput.vue'
import DateInput       from './DateInput.vue'
import DateTimeInput   from './DateTimeInput.vue'
import TimeInput       from './TimeInput.vue'
import ImageInput      from './ImageInput.vue'
import FileInput       from './FileInput.vue'

const props = defineProps<{
  item:         FormItem
  inspectionId: number
  modelValue:   any
  metadata:     Metadata
  error?:       string
  disabled?:    boolean
}>()

defineEmits<{
  (e: 'update:modelValue',   value: any): void
  (e: 'update:error',        error: string): void
  (e: 'update:valid',        valid: boolean): void
  (e: 'update:uploadStatus', status: { hasUploading: boolean; hasFailed: boolean }): void
}>()

const inputComponent = computed(() => {
  const map: Record<string, any> = {
    text:       TextInput,
    textarea:   TextareaInput,
    number:     NumberInput,
    currency:   CurrencyInput,
    percentage: PercentageInput,
    select:     SelectInput,
    radio:      RadioInput,
    checkbox:   CheckboxInput,
    date:       DateInput,
    datetime:   DateTimeInput,
    time:       TimeInput,
    image:      ImageInput,
    file:       FileInput,
  }
  return map[props.item.input_type] || TextInput
})
</script>