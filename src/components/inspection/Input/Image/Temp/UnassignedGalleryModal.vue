<!-- components/inspection/Input/Image/Temp/UnassignedGalleryModal.vue -->
<!--
  Modal galeri foto bebas.
  Assign = LOKAL ONLY — tidak ada request ke server.

  Dua mode:
  1. targetItem ada  → multi-select lalu confirm, langsung assign ke item tersebut
  2. targetItem null → tap foto buka sheet pilih item (mode dari InspectionFormView)

  Upload gambar baru dihandle LANGSUNG di sini via FAB kamera ngambang.
  Grid menampilkan SEMUA status (pending/uploading/failed/done).
-->
<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 bg-white flex flex-col">

      <!-- HEADER -->
      <div class="px-4 py-3 border-b flex items-center gap-3">
        <button @click="handleClose" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="flex-1">
          <h2 class="font-semibold text-gray-800">Foto Bebas</h2>
          <p class="text-xs text-gray-500">
            <template v-if="targetItem && effectiveMax > 1">
              Pilih maks. {{ effectiveMax }} foto •
              <span :class="selectedIds.size >= effectiveMax ? 'text-orange-500 font-medium' : 'text-blue-500'">
                {{ selectedIds.size }} dipilih
              </span>
            </template>
            <template v-else>
              {{ allImages.length }} foto
              <span v-if="uploadingCount > 0" class="text-orange-500 font-medium">
                · {{ uploadingCount }} sedang upload
              </span>
            </template>
          </p>
        </div>

        <!-- Tombol Tambahkan (mode targetItem + ada selection) -->
        <button
          v-if="targetItem && selectedIds.size > 0"
          @click="confirmSelection"
          class="flex items-center gap-1.5 bg-blue-500 text-white text-xs font-semibold
                 px-4 py-2 rounded-full hover:bg-blue-600 active:scale-95 transition-all shadow-sm"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          Tambahkan ({{ selectedIds.size }})
        </button>
      </div>

      <!-- INFO BANNER -->
      <div
        v-if="allImages.length > 0"
        class="px-4 py-2 border-b"
        :class="targetItem && effectiveMax === 0
          ? 'bg-orange-50 border-orange-100'
          : 'bg-blue-50 border-blue-100'"
      >
        <p class="text-xs" :class="targetItem && effectiveMax === 0 ? 'text-orange-700' : 'text-blue-700'">
          <template v-if="targetItem && effectiveMax === 0">
            ⚠️ Item <strong>{{ targetItem.inspection_item?.name }}</strong> sudah penuh.
          </template>
          <template v-else-if="targetItem">
            Tap foto untuk memilih, lalu klik <strong>Tambahkan</strong>.
            Ketuk ikon 🔍 untuk preview.
          </template>
          <template v-else>
            Tap foto → pilih item tujuan.
          </template>
        </p>
      </div>

      <!-- EMPTY STATE -->
      <div v-if="allImages.length === 0" class="flex-1 flex flex-col items-center justify-center gap-4 px-8">
        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586
                 a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6
                 a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <div class="text-center">
          <p class="font-medium text-gray-700">Belum ada foto</p>
          <p class="text-sm text-gray-500 mt-1">Tambah foto lewat tombol kamera di bawah</p>
        </div>
      </div>

      <!-- GRID FOTO — tampilkan SEMUA status -->
      <div v-else class="flex-1 overflow-y-auto pb-28">
        <div class="grid grid-cols-3 gap-0.5 p-0.5">
          <div
            v-for="img in allImages"
            :key="img.localId"
            class="relative aspect-square cursor-pointer group"
            @click="handleThumbnailTap(img)"
          >
            <!-- Gambar: blob URL lokal langsung tampil, lalu diganti URL server saat done -->
            <div class="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden">
              <img
                v-if="img.url || img.imageUrl"
                :src="img.url || img.imageUrl"
                class="max-w-full max-h-full object-contain"
                draggable="false"
              />
              <!-- Skeleton jika belum ada url sama sekali -->
              <div v-else class="w-full h-full bg-gray-200 animate-pulse"/>
            </div>

            <!-- ══ STATUS OVERLAYS ══ -->

            <div
              v-if="img.status === 'pending' || img.status === 'uploading'"
              class="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none"
            >
              <svg
                class="w-5 h-5 text-white animate-spin"
                fill="none" viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            </div>
            <!-- FAILED: tap untuk retry -->
            <div
              v-else-if="img.status === 'failed'"
              class="absolute inset-0 bg-red-900/65 flex flex-col items-center justify-center gap-1.5"
              @click.stop="store.retryUpload(img.localId)"
            >
              <div class="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9
                       m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </div>
              <span class="text-white text-[10px] font-semibold">Tap retry</span>
            </div>

            <!-- DONE: badge hijau kecil -->
            <div
              v-if="img.status === 'done'"
              class="absolute bottom-1.5 left-1.5 w-5 h-5 bg-green-500 rounded-full
                     flex items-center justify-center shadow pointer-events-none"
            >
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
            </div>

            <!-- Selected overlay -->
            <Transition name="fade-quick">
              <div
                v-if="selectedIds.has(img.localId)"
                class="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 pointer-events-none"
              >
                <div class="absolute top-1.5 left-1.5 w-6 h-6 bg-blue-500 rounded-full
                            flex items-center justify-center shadow">
                  <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div
                  v-if="effectiveMax > 1"
                  class="absolute bottom-1.5 left-1.5 min-w-[20px] h-5 px-1 bg-blue-500 text-white
                         text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {{ getSelectionOrder(img.localId) }}
                </div>
              </div>
            </Transition>

            <!-- Tombol Preview — hanya saat done -->
            <button
              v-if="img.status === 'done'"
              class="absolute top-1.5 right-1.5 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full
                     flex items-center justify-center active:scale-90 z-10"
              @click.stop="openPreview(img)"
            >
              <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
              </svg>
            </button>

            <!-- Dim saat limit tercapai & foto belum dipilih -->
            <div
              v-if="img.status === 'done'
                    && targetItem
                    && selectedIds.size >= effectiveMax
                    && !selectedIds.has(img.localId)"
              class="absolute inset-0 bg-black/40 pointer-events-none"
            />
          </div>
        </div>
      </div>

      <!-- FAB KAMERA -->
      <div class="absolute bottom-6 right-4 flex flex-col items-center gap-1 z-20">
        <button
          @click="handleFabCamera"
          class="w-14 h-14 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-full
                 shadow-lg shadow-blue-200 flex items-center justify-center transition-all duration-200"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07
                 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012
                 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
        <span class="text-[10px] text-gray-500 font-medium bg-white/90 px-1.5 py-0.5 rounded-full shadow-sm">
          Tambah Foto
        </span>
      </div>

      <!-- Hidden file input -->
      <input
        ref="fileInput"
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        class="hidden"
        @change="handleFileSelect"
      />
    </div>
  </Teleport>

  <!-- ══════════════════════════════════════
       FULL-SCREEN PREVIEW + PINCH-TO-ZOOM
  ══════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="preview-fade">
      <div
        v-if="previewImage"
        class="fixed inset-0 z-[70] bg-black flex flex-col"
        @touchstart.passive="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend.passive="onTouchEnd"
      >
        <!-- Header preview -->
        <div class="absolute top-0 left-0 right-0 z-10 flex items-center justify-between
                    px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
          <button @click="closePreview" class="p-2 rounded-full bg-black/40 backdrop-blur-sm">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <span class="text-white/60 text-xs">Cubit 2 jari untuk zoom</span>
          <button
            v-if="pinchScale !== 1 || pinchTranslate.x !== 0 || pinchTranslate.y !== 0"
            @click="resetZoom"
            class="px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-medium"
          >Reset</button>
          <div v-else class="w-16"/>
        </div>

        <!-- Gambar -->
        <div class="flex-1 flex items-center justify-center overflow-hidden select-none">
          <img
            :src="previewImage.imageUrl || previewImage.url"
            class="max-w-full max-h-full object-contain pointer-events-none"
            :style="{
              transform: `scale(${pinchScale}) translate(${pinchTranslate.x / pinchScale}px, ${pinchTranslate.y / pinchScale}px)`,
              transition: isPinching ? 'none' : 'transform 0.2s ease',
              transformOrigin: 'center center',
            }"
            draggable="false"
          />
        </div>

        <!-- Tombol pilih / batalkan dari layar preview -->
        <div
          v-if="targetItem"
          class="absolute bottom-0 left-0 right-0 px-4 py-5
                 bg-gradient-to-t from-black/70 to-transparent flex justify-center"
        >
          <button
            v-if="!selectedIds.has(previewImage.localId)"
            :disabled="selectedIds.size >= effectiveMax"
            @click="toggleSelect(previewImage); closePreview()"
            class="px-6 py-3 rounded-full font-semibold text-sm transition-all active:scale-95"
            :class="selectedIds.size >= effectiveMax
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
              : 'bg-blue-500 text-white shadow-lg hover:bg-blue-600'"
          >
            {{ selectedIds.size >= effectiveMax
              ? `Batas ${effectiveMax} foto tercapai`
              : 'Pilih Foto Ini' }}
          </button>
          <button
            v-else
            @click="toggleSelect(previewImage); closePreview()"
            class="px-6 py-3 rounded-full font-semibold text-sm bg-red-500 text-white
                   shadow-lg hover:bg-red-600 active:scale-95 transition-all"
          >Batalkan Pilihan</button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ══════════════════════════════
       SOURCE MODAL (tanpa Foto Bebas)
  ══════════════════════════════ -->
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="showSourceModal"
        class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showSourceModal = false"/>
        <div class="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl p-6">
          <div class="flex items-center justify-between mb-5">
            <h4 class="text-lg font-semibold text-gray-900">Pilih Sumber Gambar</h4>
            <button @click="showSourceModal = false" class="p-2 hover:bg-gray-100 rounded-full">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="flex gap-3">
            <button
              class="flex-1 flex flex-col items-center justify-center bg-gray-100 rounded-xl p-4
                     hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
              @click="selectSource('camera')"
            >
              <svg class="w-8 h-8 text-gray-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07
                     4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012
                     2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="text-xs font-medium text-gray-900">Kamera</span>
            </button>
            <button
              class="flex-1 flex flex-col items-center justify-center bg-gray-100 rounded-xl p-4
                     hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
              @click="selectSource('gallery')"
            >
              <svg class="w-8 h-8 text-gray-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586
                     a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6
                     a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-xs font-medium text-gray-900">Galeri</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ══════════════════════════════════════
       ASSIGN BOTTOM SHEET (mode tanpa targetItem)
  ══════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="showAssignSheet && selectedSingleImage"
        class="fixed inset-0 z-[60] flex items-end"
      >
        <div class="absolute inset-0 bg-black/50" @click="closeAssignSheet"/>
        <div class="relative bg-white w-full rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col">

          <div class="flex gap-3 items-center px-4 pt-4 pb-3 border-b">
            <div class="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 bg-white">
              <img
                :src="selectedSingleImage.imageUrl || selectedSingleImage.url"
                class="w-full h-full object-contain"
              />
            </div>
            <div class="flex-1">
              <p class="font-semibold text-gray-800 text-sm">Assign ke Item</p>
              <p class="text-xs text-gray-500 mt-0.5">Pilih item — disimpan lokal, dikirim saat submit</p>
            </div>
            <button @click="closeAssignSheet" class="p-2 hover:bg-gray-100 rounded-full">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="px-4 py-2 border-b">
            <input
              v-model="itemSearch"
              type="text"
              placeholder="Cari item..."
              class="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none
                     focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div class="flex-1 overflow-y-auto">
            <div v-for="section in filteredSections" :key="section.id">
              <div class="px-4 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {{ section.name }}
                </p>
              </div>
              <button
                v-for="item in section.imageItems"
                :key="item.id"
                class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-blue-50
                       active:bg-blue-100 border-b border-gray-50 transition-colors"
                @click="doAssign(item)"
              >
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586
                         a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6
                         a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-800 truncate">
                    {{ item.inspection_item.name }}
                  </p>
                  <p v-if="item.is_required" class="text-xs text-red-500">Wajib diisi</p>
                </div>
                <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
            <div v-if="filteredSections.length === 0" class="px-4 py-8 text-center text-gray-400 text-sm">
              Item tidak ditemukan
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useTempImageStore }  from '../../../../../stores/useTempImageStore'
import { useCameraSettings }  from '../../../../../composables/useCameraSettings'
import type { TempImage }     from '../../../../../stores/useTempImageStore'
import type { FormItem }      from '../../../../../types/formInspection'

// ─────────────────────────────────────────────────────────────
// PROPS & EMITS
// ─────────────────────────────────────────────────────────────

const props = defineProps<{
  show:         boolean
  inspectionId: number
  sections:     any[]
  targetItem?:  FormItem | null
  maxFiles?:    number            // slot tersisa dari ImageInput (sudah dikurangi existing)
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'assigned',
    itemId:    number,
    imageData: { id: number; image_url: string; caption: string | null }
  ): void
}>()

// ─────────────────────────────────────────────────────────────
// STORE & SETTINGS
// ─────────────────────────────────────────────────────────────

const store = useTempImageStore()
const { settings: cameraSettings } = useCameraSettings()

/**
 * Semua foto belum diassign SEMUA STATUS (pending/uploading/failed/done).
 * getUnassigned di store sudah tidak filter status === 'done'.
 */
const allImages = computed<TempImage[]>(() =>
  store.getByInspection(props.inspectionId).filter(img =>
    // Belum diassign → tampilkan
    !img.assignedToItemId ||
    // Masih proses upload → tetap tampil walau sudah diassign
    img.status === 'pending' ||
    img.status === 'uploading' ||
    img.status === 'failed'
  )
)

const uploadingCount = computed(() =>
  allImages.value.filter(i => i.status === 'pending' || i.status === 'uploading').length
)

// Slot tersisa yang dikirim dari ImageInput (0 = item sudah penuh)
const effectiveMax = computed(() => props.maxFiles ?? 999)

// ─────────────────────────────────────────────────────────────
// UPLOAD — FAB + source modal + file input
// ─────────────────────────────────────────────────────────────

const fileInput       = ref<HTMLInputElement | null>(null)
const showSourceModal = ref(false)

const handleFabCamera = () => {
  const source = cameraSettings.value.source
  if      (source === 'camera')  openFileInput('camera')
  else if (source === 'gallery') openFileInput('gallery')
  else    showSourceModal.value = true   // 'ask' → tampilkan source modal
}

const selectSource = (type: 'camera' | 'gallery') => {
  showSourceModal.value = false
  openFileInput(type)
}

const openFileInput = (type: 'camera' | 'gallery') => {
  if (!fileInput.value) return
  fileInput.value.value = ''
  fileInput.value.removeAttribute('capture')
  if (type === 'camera') fileInput.value.setAttribute('capture', 'environment')
  nextTick(() => fileInput.value?.click())
}

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return

  const files: File[] = []
  const rots:  number[] = []

  for (const file of Array.from(input.files)) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) continue
    if (file.size > 10 * 1024 * 1024) continue
    files.push(file)
    rots.push(0)
  }

  if (!files.length) return

  // addImages buat blob URL lokal langsung → muncul di grid sebelum upload selesai
  store.addImages({ files, rotations: rots, inspectionId: props.inspectionId })
  input.value = ''
}

// ─────────────────────────────────────────────────────────────
// MULTI-SELECT
// ─────────────────────────────────────────────────────────────

const selectionOrder = ref<Map<string, number>>(new Map())
const selectedIds    = computed(() => new Set(selectionOrder.value.keys()))

const getSelectionOrder = (localId: string) => selectionOrder.value.get(localId) ?? 0

const toggleSelect = (img: TempImage) => {
  const next = new Map(selectionOrder.value)
  if (next.has(img.localId)) {
    next.delete(img.localId)
    let order = 1
    for (const [k] of next) next.set(k, order++)
  } else {
    if (next.size >= effectiveMax.value) return
    next.set(img.localId, next.size + 1)
  }
  selectionOrder.value = next
}

/** Tap thumbnail — hanya bisa pilih foto yang sudah done */
const handleThumbnailTap = (img: TempImage) => {
  if (img.status !== 'done') return

  if (props.targetItem) {
    toggleSelect(img)
  } else {
    openAssignSheet(img)
  }
}

const confirmSelection = () => {
  if (!props.targetItem || selectionOrder.value.size === 0) return

  const ordered = [...selectionOrder.value.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([localId]) => allImages.value.find(i => i.localId === localId))
    .filter(Boolean) as TempImage[]

  for (const img of ordered) {
    const result = store.assignLocallyToItem(
      img.localId,
      props.targetItem.inspection_item_id,
      props.targetItem.id,
    )
    if (result) emit('assigned', props.targetItem.id, result)
  }

  selectionOrder.value = new Map()
  emit('close')
}

const handleClose = () => {
  selectionOrder.value = new Map()
  emit('close')
}

// ─────────────────────────────────────────────────────────────
// FULL-SCREEN PREVIEW + PINCH-TO-ZOOM
// ─────────────────────────────────────────────────────────────

const previewImage   = ref<TempImage | null>(null)
const pinchScale     = ref(1)
const pinchTranslate = ref({ x: 0, y: 0 })
const isPinching     = ref(false)

let lastTouchDist     = 0
let lastTouchMidpoint = { x: 0, y: 0 }
let panStart          = { x: 0, y: 0 }
let panTranslateStart = { x: 0, y: 0 }

const getTouchDist = (t0: Touch, t1: Touch) =>
  Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
const getTouchMid  = (t0: Touch, t1: Touch) => ({
  x: (t0.clientX + t1.clientX) / 2,
  y: (t0.clientY + t1.clientY) / 2,
})

  const onTouchStart = (e: TouchEvent) => {
    if (!previewImage.value) return
    const t0 = e.touches[0]
    const t1 = e.touches[1]
    if (e.touches.length === 2 && t0 && t1) {
      isPinching.value  = true
      lastTouchDist     = getTouchDist(t0, t1)
      lastTouchMidpoint = getTouchMid(t0, t1)
    } else if (e.touches.length === 1 && t0 && pinchScale.value > 1) {
      panStart          = { x: t0.clientX, y: t0.clientY }
      panTranslateStart = { ...pinchTranslate.value }
    }
  }
  const onTouchMove = (e: TouchEvent) => {
    if (!previewImage.value) return
    const t0 = e.touches[0]
    const t1 = e.touches[1]
    if (e.touches.length === 2 && t0 && t1) {
      isPinching.value = true
      const dist       = getTouchDist(t0, t1)
      pinchScale.value = Math.min(Math.max(pinchScale.value * (dist / lastTouchDist), 1), 5)
      lastTouchDist    = dist
      const mid        = getTouchMid(t0, t1)
      pinchTranslate.value = {
        x: pinchTranslate.value.x + (mid.x - lastTouchMidpoint.x),
        y: pinchTranslate.value.y + (mid.y - lastTouchMidpoint.y),
      }
      lastTouchMidpoint = mid
    } else if (e.touches.length === 1 && t0 && pinchScale.value > 1) {
      pinchTranslate.value = {
        x: panTranslateStart.x + (t0.clientX - panStart.x),
        y: panTranslateStart.y + (t0.clientY - panStart.y),
      }
    }
  }

const onTouchEnd  = (e: TouchEvent) => {
  if (e.touches.length < 2) isPinching.value = false
  if (pinchScale.value < 1.05) resetZoom()
}
const resetZoom    = () => { pinchScale.value = 1; pinchTranslate.value = { x: 0, y: 0 } }
const openPreview  = (img: TempImage) => { resetZoom(); previewImage.value = img }
const closePreview = () => { previewImage.value = null; resetZoom() }

// ─────────────────────────────────────────────────────────────
// ASSIGN SHEET (mode tanpa targetItem)
// ─────────────────────────────────────────────────────────────

const showAssignSheet     = ref(false)
const selectedSingleImage = ref<TempImage | null>(null)
const itemSearch          = ref('')

const openAssignSheet = (img: TempImage) => {
  selectedSingleImage.value = img
  itemSearch.value          = ''
  showAssignSheet.value     = true
}
const closeAssignSheet = () => {
  showAssignSheet.value     = false
  selectedSingleImage.value = null
}

const sectionsWithImageItems = computed(() =>
  props.sections
    .map((section: any) => ({
      id:   section.id,
      name: section.name,
      imageItems: (section.items as FormItem[]).filter(
        (item: FormItem) =>
          item.input_type === 'image' &&
          (item as any)._finalVisibility !== false
      ),
    }))
    .filter((s: any) => s.imageItems.length > 0)
)

const filteredSections = computed(() => {
  const q = itemSearch.value.toLowerCase().trim()
  if (!q) return sectionsWithImageItems.value
  return sectionsWithImageItems.value
    .map((s: any) => ({
      ...s,
      imageItems: s.imageItems.filter((i: FormItem) =>
        i.inspection_item.name.toLowerCase().includes(q)
      ),
    }))
    .filter((s: any) => s.imageItems.length > 0)
})

const doAssign = (item: FormItem) => {
  if (!selectedSingleImage.value) return
  const result = store.assignLocallyToItem(
    selectedSingleImage.value.localId,
    item.inspection_item_id,
    item.id,
  )
  if (result) {
    emit('assigned', item.id, result)
    closeAssignSheet()
  }
}
</script>

<style scoped>
.fade-quick-enter-active, .fade-quick-leave-active { transition: opacity 0.15s ease; }
.fade-quick-enter-from,   .fade-quick-leave-to     { opacity: 0; }

.preview-fade-enter-active, .preview-fade-leave-active { transition: opacity 0.2s ease; }
.preview-fade-enter-from,   .preview-fade-leave-to     { opacity: 0; }

.sheet-enter-active, .sheet-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.sheet-enter-from,   .sheet-leave-to     { transform: translateY(100%); opacity: 0; }


</style>