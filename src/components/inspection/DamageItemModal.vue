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
                      <p
                        class="text-sm font-medium text-gray-800 truncate"
                        @click.stop="openDescription(item)"
                      >
                        {{ item.inspection_item.name }}
                      </p>
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
                      <!--
                        DynamicInput format baru (flat):
                        - Tidak ada nested-values / image-nested-values
                        - modelValue untuk radio/select/checkbox = { status, note, image, damage_ids }
                        - update:valid diteruskan untuk validasi lokal
                      -->
                      <DynamicInput
                        :item="item"
                        :model-value="getLocalValue(item.id)"
                        :metadata="metadata"
                        :inspectionId="inspectionId"
                        :error="localErrors[item.id]"
                        :disabled="false"
                        @update:model-value="handleLocalInputChange(item.id, $event)"
                        @update:error="handleLocalError(item.id, $event)"
                        @update:valid="handleLocalValid(item.id, $event)"
                        @update:upload-status="(s) => handleUploadStatus(item.id, s)"
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
import { ref, computed, watch, reactive, onUnmounted } from 'vue'
import type { Metadata } from '../../types/formInspection'
import DynamicInput from './Input/DynamicInput.vue'

const props = defineProps<{
  show:        boolean
  damageItems: any[]
  values:      Record<number, any>
  metadata:    Metadata
  inspectionId: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  /**
   * save-item: emit nilai flat ke parent.
   * Untuk radio/select/checkbox: value = { status, note, image, damage_ids }
   * Untuk text/number/dll:       value = string | number
   * Untuk image:                 value = [{id, image_url}]
   */
  (e: 'save-item', itemId: number, value: any): void
}>()

const searchQuery  = ref('')
const expandedItem = ref<number | null>(null)

// ── Local state — scratch pad sementara di dalam modal ────────
// Format sama dengan formValues di InspectionFormView (flat)
const localValues  = ref<Record<number, any>>({})
const localErrors  = ref<Record<number, string>>({})
const localValids  = ref<Record<number, boolean>>({})  // dari update:valid komponen

// ── Description modal ─────────────────────────────────────────
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

// ── Scroll lock ───────────────────────────────────────────────
let savedScrollY = 0

const lockBodyScroll = () => {
  savedScrollY                 = window.scrollY
  document.body.style.position = 'fixed'
  document.body.style.top      = `-${savedScrollY}px`
  document.body.style.left     = '0'
  document.body.style.right    = '0'
  document.body.style.overflow = 'hidden'
}

const unlockBodyScroll = () => {
  document.body.style.position = ''
  document.body.style.top      = ''
  document.body.style.left     = ''
  document.body.style.right    = ''
  document.body.style.overflow = ''
  window.scrollTo(0, savedScrollY)
}

onUnmounted(() => unlockBodyScroll()) // safety net

// ── Reset + scroll lock saat modal buka/tutup ─────────────────

watch(() => props.show, (val) => {
  if (val) {
    lockBodyScroll()
    searchQuery.value     = ''
    expandedItem.value    = null
    localValues.value     = {}
    localErrors.value     = {}
    localValids.value     = {}
    descriptionModal.show = false
  } else {
    unlockBodyScroll()
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

// Gunakan local value saja — tidak campur dengan props.values
const getLocalValue = (itemId: number) => localValues.value[itemId] ?? null

// ── Local input handlers ──────────────────────────────────────

const handleLocalInputChange = (itemId: number, value: any) => {
  localValues.value = { ...localValues.value, [itemId]: value }
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

const handleLocalValid = (itemId: number, valid: boolean) => {
  localValids.value = { ...localValids.value, [itemId]: valid }
}

const handleUploadStatus = (_itemId: number, status: { hasUploading: boolean; hasFailed: boolean }) => {
  // Upload status di damage modal — cukup tracking lokal, tidak perlu naik ke FormView
  // karena global watch imageStore di FormView sudah handle sync ke storage
  if (status.hasUploading || status.hasFailed) {
    // Bisa tambahkan UI feedback jika perlu (loading indicator di tombol Simpan, dll)
  }
}

// ── Batal: buang data lokal item ini ─────────────────────────
const cancelItem = (itemId: number) => {
  expandedItem.value = null
  const vals = { ...localValues.value }
  const errs = { ...localErrors.value }
  const vlds = { ...localValids.value }
  delete vals[itemId]
  delete errs[itemId]
  delete vlds[itemId]
  localValues.value = vals
  localErrors.value = errs
  localValids.value = vlds
}

// ── Simpan: validasi lalu emit ke parent ─────────────────────
const saveItem = (itemId: number) => {
  const value   = localValues.value[itemId]
  const item    = props.damageItems.find(i => i.id === itemId)
  const isOpt   = ['radio', 'select', 'checkbox'].includes(item?.input_type)
  const isImg   = item?.input_type === 'image'

  if (item?.is_required) {
    let isEmpty = false

    if (isOpt) {
      // Flat: cek status
      const status = value?.status
      isEmpty = !status || (Array.isArray(status) && status.length === 0)
    } else if (isImg) {
      isEmpty = !value || (Array.isArray(value) && value.length === 0)
    } else {
      isEmpty = value === undefined || value === null || value === '' ||
        (Array.isArray(value) && value.length === 0)
    }

    if (isEmpty) {
      localErrors.value = { ...localErrors.value, [itemId]: 'Field ini harus diisi' }
      return
    }
  }

  // Cek validasi dari komponen (nested required, dll)
  // Jika komponen belum emit update:valid, asumsikan valid
  if (localValids.value[itemId] === false) {
    localErrors.value = { ...localErrors.value, [itemId]: 'Harap lengkapi semua field yang wajib diisi' }
    return
  }

  // Emit ke parent — parent yang simpan ke storage & formValues
  emit('save-item', itemId, value)

  expandedItem.value = null

  // Bersihkan local state item ini
  const vals = { ...localValues.value }
  const errs = { ...localErrors.value }
  const vlds = { ...localValids.value }
  delete vals[itemId]
  delete errs[itemId]
  delete vlds[itemId]
  localValues.value = vals
  localErrors.value = errs
  localValids.value = vlds
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