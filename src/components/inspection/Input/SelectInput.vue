<!-- components/inspection/Input/SelectInput.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import OptionRenderer from './options/OptionRenderer.vue'
import type { FormItem } from '../../../types/formInspection'

/**
 * SelectInput — flat modelValue:
 *   null → belum dipilih
 *   { status: string, note?, image?, damage_ids? }
 *
 * Mendukung dua mode dari versi lama:
 *  - searchable (input text + dropdown filter)
 *  - normal (<select>)
 */

export interface SelectFlatValue {
  status:      string
  note?:       string | null
  image?:      any[]  | null
  damage_ids?: number[]
}

const props = defineProps<{
  item:         FormItem
  inspectionId: number
  modelValue:   SelectFlatValue | null
  error?:       string
  disabled?:    boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue',   value: SelectFlatValue | null): void
  (e: 'update:error',        error: string): void
  (e: 'update:valid',        valid: boolean): void
  (e: 'update:uploadStatus', status: { hasUploading: boolean; hasFailed: boolean }): void
}>()

// ── Settings ──────────────────────────────────────────────────
const settings     = computed(() => props.item.settings || {})
const options      = computed<any[]>(() => settings.value.options || [])
const placeholder  = computed(() => settings.value.placeholder || 'Pilih...')
const isSearchable = computed(() => settings.value.searchable === true)

// ── Searchable state ──────────────────────────────────────────
const searchQuery = ref('')
const isOpen      = ref(false)

const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) return options.value
  const q = searchQuery.value.toLowerCase()
  return options.value.filter(o => o.label?.toLowerCase().includes(q))
})

// ── Current status ────────────────────────────────────────────
const currentStatus = computed<string>(() => props.modelValue?.status ?? '')

const currentNested = computed(() => {
  if (!props.modelValue) return null
  const { status, ...rest } = props.modelValue
  return rest
})

const selectedOption = computed(() =>
  options.value.find(o => o.value === currentStatus.value) ?? null
)

const rendererOption = computed(() => {
  const opt = selectedOption.value
  if (!opt) return null
  if (!opt.show_image && !opt.show_textarea && !opt.show_damage) return null
  return opt
})

// Sync searchQuery dengan nilai terpilih
watch(currentStatus, (val) => {
  const found = options.value.find(o => o.value === val)
  searchQuery.value = found?.label ?? ''
}, { immediate: true })

// ── Validasi realtime ─────────────────────────────────────────
const computeError = (val: SelectFlatValue | null): string => {
  if (!val || !val.status)
    return props.item.is_required ? 'Field ini harus diisi' : ''

  const opt = options.value.find(o => o.value === val.status)
  if (!opt) return ''

  if (opt.show_textarea && opt.textarea_is_required) {
    const note = val.note
    if (!note || (typeof note === 'string' && note.trim() === ''))
      return 'Catatan wajib diisi'
    if (opt.min_length && typeof note === 'string' && note.length < Number(opt.min_length))
      return `Minimal ${opt.min_length} karakter`
    if (opt.max_length && typeof note === 'string' && note.length > Number(opt.max_length))
      return `Maksimal ${opt.max_length} karakter`
  }

  if (opt.show_image && opt.image_is_required) {
    const img = val.image
    if (!img || (Array.isArray(img) && img.length === 0))
      return 'Gambar wajib diupload'
  }

  return ''
}

// Emit valid + error setiap modelValue berubah
watch(() => props.modelValue, (val) => {
  const errMsg = computeError(val)
  // Emit error hanya jika sudah ada interaksi
  if (val?.status || props.error) {
    emit('update:error', errMsg)
  }
  emit('update:valid', errMsg === '')
}, { deep: true, immediate: true })

// ── Dropdown helpers ──────────────────────────────────────────
const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

const closeDropdown  = () => { isOpen.value = false }

const handleBlur = () => {
  setTimeout(() => {
    isOpen.value = false
    // Jika searchQuery tidak cocok dengan opsi manapun, kembalikan ke label terpilih
    if (currentStatus.value) {
      const found = options.value.find(o => o.value === currentStatus.value)
      searchQuery.value = found?.label ?? ''
    } else {
      searchQuery.value = ''
    }
  }, 150)
}

// ── Handlers ─────────────────────────────────────────────────

/** Pilih option — reset nested kecuali image jika option baru juga show_image */
const selectOption = (option: any) => {
  if (props.disabled) return
  if (currentStatus.value === option.value) {
    closeDropdown()
    return
  }

  const newOpt    = options.value.find(o => o.value === option.value)
  const keepImage = newOpt?.show_image === true && selectedOption.value?.show_image === true

  const newVal: SelectFlatValue = {
    status:     option.value,
    note:       null,
    image:      keepImage ? (props.modelValue?.image ?? null) : null,
    damage_ids: [],
  }

  emit('update:modelValue', newVal)
  // Saat baru pilih option — status sudah terisi, error nested belum relevan
  emit('update:error', '')
  emit('update:valid', !props.item.is_required || true)
  closeDropdown()
}


/** Saat nested (note/image/damage) berubah dari OptionRenderer */
const handleRendererValue = (value: { note?: any; image?: any; damage_ids?: number[] }) => {
  const newVal: SelectFlatValue = {
    status:     currentStatus.value,
    note:       value.note       ?? null,
    image:      value.image      ?? null,
    damage_ids: value.damage_ids ?? [],
  }
  emit('update:modelValue', newVal)
  const errMsg = computeError(newVal)
  emit('update:error', errMsg)
  emit('update:valid',  errMsg === '')
}

// ── Input class ───────────────────────────────────────────────
const inputClass = computed(() => [
  'w-full px-4 py-2.5 border rounded-lg outline-none transition-colors bg-white text-sm',
  props.error
    ? 'border-red-300 bg-red-50'
    : 'border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
  props.disabled ? 'opacity-50 cursor-not-allowed' : '',
])
</script>

<template>
  <div class="space-y-2">

    <!-- ── SEARCHABLE MODE ─────────────────────────────────── -->
    <template v-if="isSearchable">
      <div class="relative">
        <input
          type="text"
          v-model="searchQuery"
          @focus="isOpen = true"
          @blur="handleBlur"
          :placeholder="placeholder"
          :disabled="disabled"
          :class="inputClass"
        />

        <div
          v-if="isOpen"
          class="absolute z-50 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-60 overflow-auto shadow-lg"
        >
          <div
            v-for="option in filteredOptions"
            :key="option.value"
            @mousedown.prevent="selectOption(option)"
            class="px-4 py-2.5 text-sm hover:bg-blue-50 cursor-pointer flex items-center justify-between"
            :class="currentStatus === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'"
          >
            {{ option.label }}
            <svg
              v-if="currentStatus === option.value"
              class="w-4 h-4 text-blue-600"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div v-if="filteredOptions.length === 0" class="px-4 py-2 text-sm text-gray-400">
            Tidak ditemukan
          </div>
        </div>
      </div>
    </template>

    <!-- ── NORMAL SELECT MODE ─────────────────────────────── -->
    <template v-else>
      <div class="relative">
        <button
          type="button"
          :disabled="disabled"
          @click="toggleDropdown"
          class="w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-lg text-sm transition-all focus:outline-none"
          :class="[
            isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 hover:border-gray-400',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            error   ? 'border-red-400' : '',
          ]"
        >
          <span :class="currentStatus ? 'text-gray-800 font-medium' : 'text-gray-400'">
            {{ selectedOption?.label ?? placeholder }}
          </span>
          <svg
            class="w-4 h-4 text-gray-400 transition-transform flex-shrink-0"
            :class="{ 'rotate-180': isOpen }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Overlay tutup dropdown -->
        <div v-if="isOpen" class="fixed inset-0 z-10" @click="closeDropdown" />

        <!-- Option list -->
        <Transition name="dropdown">
          <div
            v-if="isOpen"
            class="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto"
          >
            <button
              v-for="option in options"
              :key="option.value"
              type="button"
              @click="selectOption(option)"
              class="w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between"
              :class="
                currentStatus === option.value
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              "
            >
              {{ option.label }}
              <svg
                v-if="currentStatus === option.value"
                class="w-4 h-4 text-blue-600"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </Transition>
      </div>
    </template>

    <!-- ── NESTED RENDERER ────────────────────────────────── -->
    <OptionRenderer
      v-if="rendererOption"
      :key="currentStatus"
      :option="rendererOption"
      :inspectionId="inspectionId"
      :parent-item-id="item.id"
      :inspection-item-id="item.inspection_item_id"
      :selected-main-value="currentStatus"
      :value="currentNested"
      @update:value="handleRendererValue"
      @update:error="() => {}"
      @update:upload-status="(s) => emit('update:uploadStatus', s)"
    />

    <!-- Error -->
    <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>

  </div>
</template>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }
</style>