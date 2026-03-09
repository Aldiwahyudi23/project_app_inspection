<!-- components/inspection/InspectionSection.vue -->
<template>
  <div class="space-y-2">
    <div v-if="displayedItems.length > 0" class="space-y-2">
      <div
        v-for="item in sortedItems"
        :key="item.id"
        :id="`item-${item.id}`"
        class="bg-white rounded-xl border border-gray-200 p-3"
        :class="{ 'opacity-50': !item.is_active }"
      >
        <!-- Item Header -->
        <div class="mb-2">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-1.5 flex-wrap gap-y-1">
                <button
                  class="text-left font-medium text-gray-800 text-sm hover:text-blue-600 transition-colors"
                  :class="item.inspection_item.description ? 'underline underline-offset-2 decoration-dotted decoration-gray-400' : 'cursor-default'"
                  @click="item.inspection_item.description ? openDesc(item) : null"
                >
                  {{ item.inspection_item.name }}
                </button>

                <span v-if="item.is_required" class="text-red-500 text-sm leading-none">*</span>

                <span v-if="!item.is_active" class="text-xs bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded-full">
                  Tidak Aktif
                </span>
              </div>
            </div>

            <!-- Tombol Hapus -->
            <button
              v-if="hasLocalValue(item.id)"
              class="flex-shrink-0 ml-2 w-4 h-4 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Hapus data item ini"
              @click="confirmDelete(item)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <DynamicInput
          :item="item"
          :model-value="getItemValue(item.id)"
          :metadata="metadata"
          :inspectionId="props.inspectionId"
          :error="errors[item.id]"
          :disabled="isItemDisabled(item)"
          @update:model-value="handleInputChange(item.id, $event)"
          @update:error="handleError(item.id, $event)"
          @update:valid="handleValid(item.id, $event)"
          @update:upload-status="(s) => handleUploadStatus(item.id, s)"
        />
      </div>
    </div>

    <!-- Empty state: damage section -->
    <div v-else-if="section.is_damage_section" class="text-center py-10 bg-white rounded-xl border border-dashed border-red-200">
      <div class="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg class="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p class="text-gray-600 font-medium text-sm">Belum ada kerusakan dicatat</p>
      <p class="text-gray-400 text-xs mt-1">Gunakan tombol <span class="font-semibold text-red-500">+</span> untuk menambah item kerusakan</p>
    </div>

    <!-- Empty state: section biasa -->
    <div v-else class="text-center py-8 bg-white rounded-xl border border-gray-200">
      <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p class="text-gray-500">Tidak ada item dalam section ini</p>
    </div>
  </div>

  <!-- Description Modal -->
  <ItemDescriptionModal
    :show="descModal.show"
    :name="descModal.name"
    :description="descModal.description"
    @close="descModal.show = false"
  />

  <!-- Konfirmasi Hapus -->
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="deleteConfirm.show" class="fixed inset-0 z-50 flex items-center justify-center px-5">
        <div class="absolute inset-0 bg-black/40" @click="deleteConfirm.show = false" />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-xs p-5">
          <div class="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-3">
            <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 class="text-center font-semibold text-gray-800 mb-1">Hapus Data</h3>
          <p class="text-center text-sm text-gray-500 mb-4">
            Hapus data "<span class="font-medium text-gray-700">{{ deleteConfirm.itemName }}</span>"?<br/>
            Data yang tersimpan akan dihapus.
          </p>
          <div class="flex space-x-2">
            <button
              @click="deleteConfirm.show = false"
              class="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              @click="executeDelete"
              :disabled="deleteConfirm.loading"
              class="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center space-x-1.5"
            >
              <svg v-if="deleteConfirm.loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span>{{ deleteConfirm.loading ? 'Menghapus...' : 'Hapus' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { Section, Metadata, FormItem } from '../../types/formInspection'
import DynamicInput         from './Input/DynamicInput.vue'
import ItemDescriptionModal from './ItemDescriptionModal.vue'
import { useImageUploadStore } from '../../stores/useImageUploadStore'

const props = defineProps<{
  section: Section & {
    items: (FormItem & {
      _isVisibleByVehicle?: boolean
      _hasVehicleFilter?:   boolean
      _isTriggeredItem?:    boolean
      _isTriggered?:        boolean
      _finalVisibility?:    boolean
      _isNativelyHidden?:   boolean
      _isDamageItem?:       boolean
      _isForceVisible?:     boolean
      _isFeatureItem?:      boolean
    })[]
  }
  inspectionId: number
  values:       Record<number, any>
  errors:       Record<number, string>
  metadata:     Metadata
  vehicleAttr?: any
  showHiddenItems?: boolean
  triggeredItems?:  Record<number, boolean>
}>()

const emit = defineEmits<{
  (e: 'update:value',        itemId: number, value: any): void
  (e: 'update:error',        itemId: number, error: string): void
  (e: 'update:valid',        itemId: number, valid: boolean): void
  (e: 'delete:item',         itemId: number, inspectionItemId: number): void
  (e: 'update:uploadStatus', itemId: number, status: { hasUploading: boolean; hasFailed: boolean }): void
}>()

// ── Store ─────────────────────────────────────────────────────
const imageStore = useImageUploadStore()

// ── Description Modal ─────────────────────────────────────────
const descModal = reactive({ show: false, name: '', description: '' })

const openDesc = (item: any) => {
  if (!item.inspection_item.description) return
  descModal.name        = item.inspection_item.name
  descModal.description = item.inspection_item.description
  descModal.show        = true
}

// ── Delete Confirm ────────────────────────────────────────────
const deleteConfirm = reactive({
  show: false, itemId: 0, inspectionItemId: 0, itemName: '', loading: false,
})

const confirmDelete = (item: any) => {
  deleteConfirm.itemId           = item.id
  deleteConfirm.inspectionItemId = item.inspection_item_id
  deleteConfirm.itemName         = item.inspection_item.name
  deleteConfirm.show             = true
}

const executeDelete = () => {
  const itemId           = deleteConfirm.itemId
  const inspectionItemId = deleteConfirm.inspectionItemId

  deleteConfirm.show              = false
  deleteConfirm.loading           = false
  deleteConfirm.itemId            = 0
  deleteConfirm.inspectionItemId  = 0
  deleteConfirm.itemName          = ''

  imageStore.clearSection(itemId)
  emit('delete:item', itemId, inspectionItemId)
}

// ── Helpers ───────────────────────────────────────────────────
const hasLocalValue = (itemId: number): boolean => {
  const v = props.values[itemId]
  if (v === undefined || v === null || v === '') return false
  if (Array.isArray(v) && v.length === 0) return false
  if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return false
  const storeImages = imageStore.getImagesBySection(itemId)
  if (storeImages.length > 0) return true
  return true
}

// ── Visibility filter ─────────────────────────────────────────
const displayedItems = computed(() =>
  props.section.items.filter(item => {
    if (item._isFeatureItem)    return true
    if (item._isForceVisible)   return true
    if (item._isTriggeredItem)  return item._isTriggered === true
    if (item._hasVehicleFilter) return item._isVisibleByVehicle === true
    if (item._isDamageItem)     return false
    if (item._isNativelyHidden) return props.showHiddenItems === true
    return true
  })
)

const sortedItems = computed(() =>
  [...displayedItems.value].sort((a, b) => a.sort_order - b.sort_order)
)

const isItemDisabled = (item: any): boolean => {
  if (item._isFeatureItem)                                         return false
  if (item._hasVehicleFilter && !item._isVisibleByVehicle)         return true
  if (item._isTriggeredItem  && !item._isTriggered)                return true
  return false
}

// ── Value helper ──────────────────────────────────────────────
const getItemValue = (itemId: number) => props.values[itemId]

// ── Event proxies ─────────────────────────────────────────────
const handleInputChange  = (itemId: number, value: any)     => emit('update:value',  itemId, value)
const handleError        = (itemId: number, error: string)  => emit('update:error',  itemId, error)
const handleValid        = (itemId: number, valid: boolean) => emit('update:valid',  itemId, valid)
const handleUploadStatus = (itemId: number, status: { hasUploading: boolean; hasFailed: boolean }) =>
  emit('update:uploadStatus', itemId, status)
</script>

<style scoped>
.confirm-enter-active, .confirm-leave-active { transition: opacity 0.2s ease; }
.confirm-enter-active .relative, .confirm-leave-active .relative { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
.confirm-enter-from, .confirm-leave-to { opacity: 0; }
.confirm-enter-from .relative, .confirm-leave-to .relative { transform: scale(0.9); }
</style>