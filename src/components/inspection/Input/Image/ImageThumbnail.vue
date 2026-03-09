<!-- components/inspection/inputs/Image/ImageThumbnail.vue -->
<!--
  Komponen thumbnail gambar dengan status overlay.
  Menampilkan: pending (animasi), uploading (spinner), done, failed.
  Emit: click-preview, retry, remove
-->
<template>
  <div class="relative w-full h-full">

    <!-- ── Gambar ─────────────────────────────────── -->
    <img
      v-if="imgSrc"
      :src="imgSrc"
      class="w-full h-full cursor-pointer select-none"
      style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;"
      draggable="false"
      @click="handleClickPreview"
    />
    <div v-else class="absolute inset-0 flex items-center justify-center bg-gray-100">
      <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586
             a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0
             00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    </div>

    <!-- ── Overlay: UPLOADING ─────────────────────── -->
    <div
      v-if="image.status === 'uploading'"
      class="absolute inset-0 z-10 bg-black/55 flex flex-col items-center justify-center gap-1.5"
    >
      <svg class="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      <span class="text-white text-[10px] font-medium tracking-wide">Uploading…</span>
    </div>

    <!-- ── Overlay: PENDING (antri) ──────────────── -->
    <div
      v-else-if="image.status === 'pending'"
      class="absolute inset-0 z-10 bg-black/45 flex flex-col items-center justify-center gap-1.5"
    >
      <!-- Pulsing dot sebagai indikator antri -->
      <span class="w-4 h-4 rounded-full bg-yellow-400 animate-pulse block"></span>
      <span class="text-white text-[10px] font-medium tracking-wide">Menunggu…</span>
    </div>

    <!-- ── Overlay: FAILED ────────────────────────── -->
    <div
      v-else-if="image.status === 'failed'"
      class="absolute inset-0 z-10 bg-black/65 flex flex-col items-center justify-center gap-1.5 p-2"
    >
      <svg class="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8v4m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"/>
      </svg>
      <span class="text-white text-[9px] text-center leading-tight">Upload gagal</span>
      <button
        @click.stop="$emit('retry')"
        class="bg-blue-500 hover:bg-blue-600 text-white text-[10px] px-2.5 py-0.5
               rounded-full transition-colors font-medium"
      >
        Coba lagi
      </button>
    </div>

    <!-- ── Tombol ✕ saat failed (pojok kanan atas) ── -->
    <button
      v-if="image.status === 'failed'"
      @click.stop="$emit('remove')"
      class="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center
             justify-center text-white text-xs shadow hover:bg-red-600 transition-colors"
      style="z-index:12;"
    >✕</button>

    <!-- ── Tombol ✕ (hanya saat done) ────────────── -->
    <button
      v-if="image.status === 'done'"
      @click.stop="$emit('remove')"
      class="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center
             justify-center text-white text-xs shadow hover:bg-red-600 transition-colors"
      style="z-index:2;"
    >✕</button>

    <!-- ── Badge status kecil (done) ─────────────── -->
    <div
      v-if="image.status === 'done' && image.serverId"
      class="absolute bottom-0.5 left-0.5 bg-green-500/80 text-white rounded-full px-1"
      style="font-size:8px;line-height:1.5;"
    >✓</div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { InspectionImage } from '../../../../stores/useImageUploadStore'

const props = defineProps<{
  image: InspectionImage
}>()

const emit = defineEmits<{
  (e: 'click-preview'): void
  (e: 'retry'): void
  (e: 'remove'): void
}>()

const imgSrc = computed(() =>
  props.image.imageUrl || props.image.url || ''
)

const handleClickPreview = () => {
  // Jangan buka preview saat pending/uploading/failed — user cukup lihat overlay
  if (props.image.status === 'done') {
    emit('click-preview')
  }
}
</script>