// stores/useImageUploadStore.ts
// ─────────────────────────────────────────────────────────────
// Global Pinia store untuk manajemen upload gambar inspeksi.
// Menangani: pending → uploading → done / failed, lintas section.
// ─────────────────────────────────────────────────────────────

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { uploadInspectionImages, deleteInspectionImage } from '../services/formInspectionService'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type ImageStatus = 'pending' | 'uploading' | 'done' | 'failed'

export interface InspectionImage {
  /** UUID lokal — unik di client, tidak bergantung index array */
  localId: string

  /** ID dari server setelah upload sukses */
  serverId: number | null

  /** File lokal (ada hanya sebelum upload selesai) */
  file?: File

  /** URL untuk preview — bisa blob URL (baru) atau URL server (done) */
  url: string

  /** Section tempat gambar ditambahkan */
  sectionId: number

  /** Item ID inspeksi */
  itemId: number

  /** Inspection item ID */
  inspectionItemId: number

  /** ID form inspeksi */
  inspectionId: number

  /** Rotasi gambar dalam derajat (0, 90, 180, 270) */
  rotation: number

  /** Status upload */
  status: ImageStatus

  /** Pesan error jika status = 'failed' */
  errorMessage?: string

  /** URL gambar dari server (setelah done) */
  imageUrl?: string

  /** Caption gambar */
  caption?: string | null

  /** Nilai opsi terpilih (untuk show_option) */
  selectedOptionValue?: string | null

  /** Timestamp ditambahkan */
  addedAt: number
}

// ─────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────

const generateLocalId = (): string =>
  `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

/**
 * Rotate File via canvas → File baru.
 * Hanya untuk gambar lokal (bukan server) sehingga tidak ada CORS issue.
 */
const rotateFileByCanvas = (
  file: File,
  rotation: number
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const blobUrl = URL.createObjectURL(file)

    img.onload = () => {
      const rad    = (rotation * Math.PI) / 180
      const sin    = Math.abs(Math.sin(rad))
      const cos    = Math.abs(Math.cos(rad))
      const width  = Math.round(img.width * cos + img.height * sin)
      const height = Math.round(img.width * sin + img.height * cos)

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height

      const ctx = canvas.getContext('2d')!
      ctx.translate(width / 2, height / 2)
      ctx.rotate(rad)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)

      URL.revokeObjectURL(blobUrl)

      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Canvas toBlob gagal')); return }
        resolve(new File([blob], file.name, { type: file.type }))
      }, file.type, 0.92)
    }

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      reject(new Error('Gagal load gambar untuk rotate'))
    }

    img.src = blobUrl
  })
}

// ─────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────

export const useImageUploadStore = defineStore('imageUpload', () => {

  // ── State ──────────────────────────────────────────────────

  const images = ref<InspectionImage[]>([])

  /**
   * Set localId yang sedang aktif di-upload.
   * Mencegah upload ganda untuk file yang sama.
   */
  const activeUploads = ref<Set<string>>(new Set())

  // ── Getters ────────────────────────────────────────────────

  /** Ambil semua gambar milik section tertentu */
  const getImagesBySection = (sectionId: number): InspectionImage[] =>
    images.value.filter(img => img.sectionId === sectionId)

  /** Ambil gambar berdasarkan localId */
  const getImageByLocalId = (localId: string): InspectionImage | undefined =>
    images.value.find(img => img.localId === localId)

  /** Apakah ada gambar yang masih dalam proses upload di section tertentu */
  const hasPendingUploads = (sectionId: number): boolean =>
    images.value.some(
      img => img.sectionId === sectionId &&
             (img.status === 'pending' || img.status === 'uploading')
    )

  /** Apakah ada upload yang gagal di section tertentu */
  const hasFailedUploads = (sectionId: number): boolean =>
    images.value.some(img => img.sectionId === sectionId && img.status === 'failed')

  /** Jumlah gambar pending/uploading secara global */
  const totalPendingCount = computed(() =>
    images.value.filter(img => img.status === 'pending' || img.status === 'uploading').length
  )

  // ── Actions ────────────────────────────────────────────────

  /**
   * Tambah satu atau lebih gambar baru ke store.
   * Dipanggil SETELAH user klik "Simpan & Upload" di preview modal,
   * sehingga rotation sudah ditentukan user.
   *
   * @param files         Array File yang dipilih user
   * @param rotations     Array rotasi per-file (indeks sesuai files). Default semua 0.
   * @param sectionId     ID item form (unik per image input)
   * @param itemId        ID form item
   * @param inspectionItemId  ID inspection item
   * @param inspectionId  ID inspeksi aktif
   * @param selectedOptionValue  Nilai opsi radio terpilih (opsional)
   * @returns Array localId gambar yang ditambahkan
   */
  const addImages = (params: {
    files: File[]
    rotations?: number[]
    sectionId: number
    itemId: number
    inspectionItemId: number
    inspectionId: number
    selectedOptionValue?: string | null
  }): string[] => {
    const {
      files, rotations = [], sectionId, itemId, inspectionItemId,
      inspectionId, selectedOptionValue = null
    } = params

    const localIds: string[] = []

    files.forEach((file, i) => {
      const localId  = generateLocalId()
      const rotation = rotations[i] ?? 0
      // Buat blob URL dari file asli untuk preview thumbnail (sebelum upload)
      const blobUrl  = URL.createObjectURL(file)

      images.value.push({
        localId,
        serverId: null,
        file,
        url: blobUrl,
        sectionId,
        itemId,
        inspectionItemId,
        inspectionId,
        rotation,          // disimpan, akan di-apply canvas saat upload
        status: 'pending',
        selectedOptionValue,
        addedAt: Date.now(),
      })

      localIds.push(localId)
    })

    // Langsung trigger background upload
    _processQueue()

    return localIds
  }

  /**
   * Update rotasi gambar (hanya untuk gambar baru / status !== 'done').
   */
  const updateRotation = (localId: string, rotation: number): void => {
    const img = images.value.find(i => i.localId === localId)
    if (!img || img.status === 'done') return
    img.rotation = rotation
  }

  /**
   * Hapus gambar dari store.
   * Jika sudah di server (serverId ada), panggil API delete di background.
   * Jika masih blob, revoke URL.
   */
  const removeImage = (localId: string): void => {
    const idx = images.value.findIndex(i => i.localId === localId)
    if (idx === -1) return

    const img = images.value[idx]
    if (!img) return   // guard — seharusnya tidak terjadi tapi TS perlu ini

    // Simpan data yang diperlukan sebelum splice
    const blobUrl  = img.url
    const serverId = img.serverId

    images.value.splice(idx, 1)

    // Revoke blob URL jika ada
    if (blobUrl?.startsWith('blob:')) URL.revokeObjectURL(blobUrl)

    // Hapus dari server di background
    if (serverId) {
      deleteInspectionImage(serverId).catch(err =>
        console.warn('[ImageUploadStore] Background delete gagal:', serverId, err)
      )
    }
  }

  /**
   * Retry upload untuk gambar yang gagal.
   */
  const retryUpload = (localId: string): void => {
    const img = images.value.find(i => i.localId === localId)
    if (!img || img.status !== 'failed' || !img.file) return

    img.status = 'pending'
    img.errorMessage = undefined

    _processQueue()
  }

  /**
   * Sinkronisasi gambar yang sudah ada di server (dari API GET inspeksi).
   * Gambar dari server langsung masuk dengan status 'done'.
   * Tidak menambah duplikat (cek berdasarkan serverId).
   */
  const syncFromServer = (params: {
    serverImages: Array<{ id: number; image_url: string; caption?: string | null }>
    sectionId: number
    itemId: number
    inspectionItemId: number
    inspectionId: number
  }): void => {
    const { serverImages, sectionId, itemId, inspectionItemId, inspectionId } = params
    const existingServerIds = new Set(
      images.value.filter(i => i.serverId !== null).map(i => i.serverId)
    )

    for (const serverImg of serverImages) {
      if (existingServerIds.has(serverImg.id)) continue

      images.value.push({
        localId: generateLocalId(),
        serverId: serverImg.id,
        url: serverImg.image_url,
        imageUrl: serverImg.image_url,
        caption: serverImg.caption ?? null,
        sectionId,
        itemId,
        inspectionItemId,
        inspectionId,
        rotation: 0,
        status: 'done',
        addedAt: Date.now(),
      })
    }
  }

  /**
   * Bersihkan gambar milik satu inspeksi (saat user keluar form).
   * Revoke semua blob URL untuk mencegah memory leak.
   */
  const clearInspection = (inspectionId: number): void => {
    const toRemove = images.value.filter(img => img.inspectionId === inspectionId)
    for (const img of toRemove) {
      if (img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)
    }
    images.value = images.value.filter(img => img.inspectionId !== inspectionId)
  }

  /**
   * Bersihkan semua gambar milik satu item form (sectionId = item.id).
   * Dipanggil saat user menghapus seluruh data item dari InspectionSection.
   * Revoke blob URL + batalkan upload yang sedang berjalan (diabaikan setelah selesai).
   */
  const clearSection = (sectionId: number): void => {
    const toRemove = images.value.filter(img => img.sectionId === sectionId)
    for (const img of toRemove) {
      // Revoke blob URL jika ada
      if (img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)
      // Batalkan dari activeUploads — _uploadSingle akan abaikan jika tidak ada di images
      activeUploads.value.delete(img.localId)
    }
    images.value = images.value.filter(img => img.sectionId !== sectionId)
  }

  // ── Internal: upload queue processor ──────────────────────

  /**
   * _processQueue
   * Scan semua gambar dengan status 'pending' dan upload secara paralel.
   * Setiap gambar di-lock via `activeUploads` agar tidak diproses dua kali.
   */
  const _processQueue = (): void => {
    const pending = images.value.filter(
      img => img.status === 'pending' && !activeUploads.value.has(img.localId)
    )

    for (const img of pending) {
      _uploadSingle(img.localId)
    }
  }

  const _uploadSingle = async (localId: string): Promise<void> => {
    const img = images.value.find(i => i.localId === localId)
    if (!img || !img.file) return

    // Lock
    activeUploads.value.add(localId)
    img.status = 'uploading'

    try {
      let fileToUpload = img.file

      // Apply rotation via canvas jika ada
      const rot = ((img.rotation || 0) % 360 + 360) % 360
      if (rot !== 0) {
        fileToUpload = await rotateFileByCanvas(img.file, rot)
      }

      const result = await uploadInspectionImages(
        img.inspectionId,
        img.inspectionItemId,
        [fileToUpload],
        img.itemId,
        img.selectedOptionValue ?? null,
      )

      const uploaded = result?.data?.[0] ?? result?.[0]
      if (!uploaded?.id) throw new Error('Response server tidak mengandung data gambar')

      // Sukses → update state
      const current = images.value.find(i => i.localId === localId)
      if (!current) return // dihapus saat upload berlangsung, abaikan

      // Revoke blob lama
      if (current.url?.startsWith('blob:')) URL.revokeObjectURL(current.url)
      // Revoke rotated blob jika ada dan berbeda
      if (rot !== 0 && fileToUpload !== img.file) {
        // fileToUpload adalah file baru dari canvas, sudah tidak dibutuhkan
      }

      current.serverId  = uploaded.id
      current.imageUrl  = uploaded.image_url
      current.url       = uploaded.image_url
      current.caption   = uploaded.caption ?? null
      current.status    = 'done'
      current.rotation  = 0
      current.file      = undefined   // bebaskan memori

    } catch (err: any) {
      console.error('[ImageUploadStore] Upload gagal:', localId, err)

      const current = images.value.find(i => i.localId === localId)
      if (!current) return

      current.status       = 'failed'
      current.errorMessage = err?.message || 'Upload gagal'

    } finally {
      activeUploads.value.delete(localId)
    }
  }

  // ── Return public API ─────────────────────────────────────

  return {
    // State (read-only dari luar lewat getters)
    images,

    // Getters
    getImagesBySection,
    getImageByLocalId,
    hasPendingUploads,
    hasFailedUploads,
    totalPendingCount,

    // Actions
    addImages,
    updateRotation,
    removeImage,
    retryUpload,
    syncFromServer,
    clearInspection,
    clearSection,
  }
})