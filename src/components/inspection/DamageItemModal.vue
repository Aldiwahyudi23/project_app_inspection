<!-- components/inspection/DamageItemModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex flex-col"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')" />

        <!-- Modal Sheet -->
        <div class="relative mt-auto bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh]">

          <!-- Handle bar -->
          <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>

          <!-- Header -->
          <div class="px-4 pt-2 pb-3 border-b border-gray-100 flex-shrink-0">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h2 class="text-base font-semibold text-gray-800">Tambah Item Lainnya</h2>
                <!-- <p class="text-xs text-gray-500 mt-0.5">
                  {{ emptyDamageItems.length }} item belum diisi
                </p> -->
              </div>
              <button
                @click="$emit('close')"
                class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Search -->
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Cari item kerusakan..."
                class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- List Items -->
          <div class="overflow-y-auto flex-1">
            <!-- Empty state -->
            <div v-if="filteredItems.length === 0" class="flex flex-col items-center justify-center py-12 px-4">
              <div class="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-3">
                <svg class="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p class="text-gray-700 font-medium text-sm">
                {{ searchQuery ? 'Item tidak ditemukan' : 'Semua item sudah diisi!' }}
              </p>
              <p class="text-gray-400 text-xs mt-1">
                {{ searchQuery ? 'Coba kata kunci lain' : 'Tidak ada item kerusakan yang tersisa' }}
              </p>
            </div>

            <!-- Items list -->
            <div v-else class="divide-y divide-gray-50">
              <div
                v-for="item in filteredItems"
                :key="item.id"
                class="transition-all duration-200"
              >
                <!-- Item header -->
                <button
                  class="w-full text-left px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  @click="toggleItem(item.id)"
                >
                  <div class="flex items-center space-x-3 flex-1 min-w-0">
                    <div
                      class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                      :class="expandedItem === item.id ? 'bg-red-100' : 'bg-gray-100'"
                    >
                      <svg
                        class="w-4 h-4 transition-colors"
                        :class="expandedItem === item.id ? 'text-red-500' : 'text-gray-400'"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center space-x-2">
                        <!-- Nama item — klik → modal description -->
                        <p
                          class="text-sm font-medium text-gray-800 truncate"
                          @click.stop="openDescription(item)"
                        >
                          {{ item.inspection_item.name }}
                        </p>
                        <!-- Icon info jika ada description -->
                        <!-- <button
                          v-if="item.inspection_item.description"
                          class="flex-shrink-0 w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors"
                          @click.stop="openDescription(item)"
                          title="Lihat deskripsi"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button> -->
                      </div>
                      <!-- <span v-if="item.is_required" class="text-xs text-red-500">Wajib diisi</span> -->
                    </div>
                  </div>
                  <svg
                    class="w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform duration-200"
                    :class="expandedItem === item.id ? 'rotate-180' : ''"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Expanded Input Area -->
                <Transition name="expand">
                  <div v-if="expandedItem === item.id" class="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                    <div class="pt-4">
                      <DynamicInput
                        :item="item"
                        :model-value="getLocalValue(item.id)"
                        :metadata="metadata"
                        :error="localErrors[item.id]"
                        :nested-values="localNestedValues[item.id]"
                        :image-nested-values="localImageNestedValues[item.id] ?? null"
                        :disabled="false"
                        @update:model-value="handleLocalInputChange(item.id, $event)"
                        @update:error="handleLocalError(item.id, $event)"
                        @update:nested-value="(optVal, field, val) => handleLocalNestedValue(item.id, optVal, field, val)"
                        @update:nested-error="(optVal, field, err) => handleLocalError(item.id, err)"
                        @update:image-nested-value="(field, val) => handleLocalImageNestedValue(item.id, field, val)"
                      />

                      <!-- Action Buttons -->
                      <div class="mt-4 flex space-x-2">
                        <button
                          @click="cancelItem(item.id)"
                          class="flex-1 py-2.5 px-4 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          @click="saveItem(item.id)"
                          class="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center space-x-1.5"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Simpan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Transition>

    <!-- Description Modal -->
    <Transition name="desc-modal">
      <div v-if="descriptionModal.show" class="fixed inset-0 z-[60] flex items-center justify-center px-4" @click.self="descriptionModal.show = false">
        <div class="absolute inset-0 bg-black/40" @click="descriptionModal.show = false" />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
          <div class="flex items-start justify-between mb-3">
            <h3 class="font-semibold text-gray-800 pr-6">{{ descriptionModal.name }}</h3>
            <button
              @click="descriptionModal.show = false"
              class="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p class="text-sm text-gray-600 leading-relaxed">{{ descriptionModal.description }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import type { Metadata } from '../../types/formInspection'
import DynamicInput from './Input/DynamicInput.vue'

const props = defineProps<{
  show: boolean
  damageItems: any[]
  values: Record<number, any>
  metadata: Metadata
  nestedValues: Record<string | number, any>
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save-item', itemId: number, value: any, nested: any, imageNested: any): void
}>()

const searchQuery  = ref('')
const expandedItem = ref<number | null>(null)

// ─── Local state (TIDAK disimpan ke storage sampai klik Simpan) ─
// Ini adalah "scratch pad" sementara di dalam modal
const localValues            = ref<Record<number, any>>({})
const localErrors            = ref<Record<number, string>>({})
const localNestedValues      = ref<Record<number, any>>({})
const localImageNestedValues = ref<Record<number, any>>({})

// ─── Description modal ──────────────────────────────────────
const descriptionModal = reactive({
  show:        false,
  name:        '',
  description: '',
})

const openDescription = (item: any) => {
  if (!item.inspection_item.description) return
  descriptionModal.name        = item.inspection_item.name
  descriptionModal.description = item.inspection_item.description
  descriptionModal.show        = true
}

// ─── Reset saat modal dibuka/ditutup ────────────────────────
watch(() => props.show, (val) => {
  if (val) {
    searchQuery.value  = ''
    expandedItem.value = null
    // Reset scratch pad — data yang belum disimpan hilang
    localValues.value            = {}
    localErrors.value            = {}
    localNestedValues.value      = {}
    localImageNestedValues.value = {}
    descriptionModal.show        = false
  }
})

const emptyDamageItems = computed(() => props.damageItems)

const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) return emptyDamageItems.value
  const q = searchQuery.value.toLowerCase()
  return emptyDamageItems.value.filter(item =>
    item.inspection_item.name.toLowerCase().includes(q) ||
    (item.inspection_item.description || '').toLowerCase().includes(q)
  )
})

const toggleItem = (itemId: number) => {
  if (expandedItem.value === itemId) {
    cancelItem(itemId)
  } else {
    expandedItem.value = itemId
  }
}

// ─── Gunakan local value SAJA — tidak campur dengan props.values ─
const getLocalValue = (itemId: number) => localValues.value[itemId]

// ─── Local input handlers (hanya mengubah state lokal modal) ─

const handleLocalInputChange = (itemId: number, value: any) => {
  localValues.value = { ...localValues.value, [itemId]: value }
  // Hapus error jika ada isian
  if (value !== undefined && value !== null && value !== '') {
    const errs = { ...localErrors.value }
    delete errs[itemId]
    localErrors.value = errs
  }
}

const handleLocalError = (itemId: number, errorMsg: string) => {
  if (errorMsg) {
    localErrors.value = { ...localErrors.value, [itemId]: errorMsg }
  } else {
    const errs = { ...localErrors.value }
    delete errs[itemId]
    localErrors.value = errs
  }
}

const handleLocalNestedValue = (itemId: number, optionValue: string, field: string, value: any) => {
  if (!localNestedValues.value[itemId]) localNestedValues.value[itemId] = {}
  if (!localNestedValues.value[itemId][optionValue]) localNestedValues.value[itemId][optionValue] = {}
  localNestedValues.value[itemId][optionValue][field] = value
  localNestedValues.value = { ...localNestedValues.value }
}

const handleLocalImageNestedValue = (itemId: number, field: string, value: any) => {
  const imgKey = itemId
  if (!localImageNestedValues.value[imgKey]) {
    localImageNestedValues.value[imgKey] = { selectedOption: null, nested: {} }
  }

  if (field === 'selectedOption') {
    localImageNestedValues.value[imgKey].selectedOption = value
  } else {
    const sepIdx = field.indexOf('__')
    if (sepIdx > -1) {
      const optionValue = field.substring(0, sepIdx)
      const nestedField = field.substring(sepIdx + 2)
      if (!localImageNestedValues.value[imgKey].nested) localImageNestedValues.value[imgKey].nested = {}
      if (!localImageNestedValues.value[imgKey].nested[optionValue]) {
        localImageNestedValues.value[imgKey].nested[optionValue] = {}
      }
      localImageNestedValues.value[imgKey].nested[optionValue][nestedField] = value
    }
  }
  localImageNestedValues.value = { ...localImageNestedValues.value }
}

// ─── Batal: buang data lokal item ini, tutup expand ─────────
const cancelItem = (itemId: number) => {
  expandedItem.value = null

  // Buang local values untuk item ini
  const vals = { ...localValues.value }
  const errs = { ...localErrors.value }
  const nest = { ...localNestedValues.value }
  const imgn = { ...localImageNestedValues.value }
  delete vals[itemId]
  delete errs[itemId]
  delete nest[itemId]
  delete imgn[itemId]
  localValues.value            = vals
  localErrors.value            = errs
  localNestedValues.value      = nest
  localImageNestedValues.value = imgn
}

// ─── Simpan: validasi lalu emit ke parent ───────────────────
const saveItem = (itemId: number) => {
  const value = localValues.value[itemId]

  const item = props.damageItems.find(i => i.id === itemId)
  if (item?.is_required) {
    const isEmpty = value === undefined || value === null || value === '' ||
      (Array.isArray(value) && value.length === 0)
    if (isEmpty) {
      localErrors.value = { ...localErrors.value, [itemId]: 'Field ini harus diisi' }
      return
    }
  }

  const nested      = localNestedValues.value[itemId] || null
  const imageNested = localImageNestedValues.value[itemId] || null

  // Emit ke parent — parent yang bertanggung jawab simpan ke storage
  emit('save-item', itemId, value, nested, imageNested)

  expandedItem.value = null

  // Bersihkan local state item ini setelah berhasil simpan
  const vals = { ...localValues.value }
  const errs = { ...localErrors.value }
  const nest = { ...localNestedValues.value }
  const imgn = { ...localImageNestedValues.value }
  delete vals[itemId]
  delete errs[itemId]
  delete nest[itemId]
  delete imgn[itemId]
  localValues.value            = vals
  localErrors.value            = errs
  localNestedValues.value      = nest
  localImageNestedValues.value = imgn
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.modal-enter-from,
.modal-leave-to { opacity: 0; }
.modal-enter-from .relative,
.modal-leave-to .relative { transform: translateY(100%); }

.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to,
.expand-leave-from { opacity: 1; max-height: 800px; }

.desc-modal-enter-active,
.desc-modal-leave-active { transition: opacity 0.2s ease; }
.desc-modal-enter-active .relative,
.desc-modal-leave-active .relative { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
.desc-modal-enter-from,
.desc-modal-leave-to { opacity: 0; }
.desc-modal-enter-from .relative,
.desc-modal-leave-to .relative { transform: scale(0.92); }
</style>