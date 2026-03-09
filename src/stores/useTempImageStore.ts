// stores/useTempImageStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  uploadInspectionImages,
  fetchUnassignedImages,
  deleteInspectionImage,
} from '../services/formInspectionService'

const uploadTempImage = (inspectionId: number, file: File) =>
  uploadInspectionImages(
    inspectionId,
    0,
    [file],
    0,
    null
  )

export type TempImageStatus = 'pending' | 'uploading' | 'done' | 'failed'

export interface TempImage {
  localId:           string
  serverId:          number | null
  file?:             File
  url:               string
  imageUrl?:         string
  caption?:          string | null
  status:            TempImageStatus
  errorMessage?:     string
  inspectionId:      number
  rotation:          number
  addedAt:           number
  inspectionItemId?: number | null
  assignedToItemId?: number | null
}

const generateLocalId = (): string =>
  `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

const rotateFileByCanvas = (file: File, rotation: number): Promise<File> =>
  new Promise((resolve, reject) => {
    const img     = new Image()
    const blobUrl = URL.createObjectURL(file)
    img.onload = () => {
      const rad    = (rotation * Math.PI) / 180
      const sin    = Math.abs(Math.sin(rad))
      const cos    = Math.abs(Math.cos(rad))
      const w      = Math.round(img.width * cos + img.height * sin)
      const h      = Math.round(img.width * sin + img.height * cos)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.translate(w / 2, h / 2)
      ctx.rotate(rad)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      URL.revokeObjectURL(blobUrl)
      canvas.toBlob(
        blob => blob
          ? resolve(new File([blob], file.name, { type: file.type }))
          : reject(new Error('Canvas toBlob gagal')),
        file.type, 0.92
      )
    }
    img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error('Gagal load gambar')) }
    img.src = blobUrl
  })

export const useTempImageStore = defineStore('tempImage', () => {

  const images        = ref<TempImage[]>([])
  const activeUploads = ref<Set<string>>(new Set())

  // ── Getters ───────────────────────────────────────────────

  const getByInspection = (inspectionId: number) =>
    images.value.filter(img => img.inspectionId === inspectionId)

  /**
   * Semua gambar yang belum diassign ke item manapun — SEMUA STATUS.
   * Dipakai oleh UnassignedGalleryModal untuk menampilkan grid termasuk
   * foto yang masih pending/uploading/failed agar user bisa lihat prosesnya.
   */
  const getUnassigned = (inspectionId: number) =>
    images.value.filter(
      img => img.inspectionId === inspectionId
          && !img.assignedToItemId
    )

  /**
   * Hanya hitung foto yang sudah DONE dan belum diassign.
   * Dipakai untuk badge FAB di InspectionFormView — hanya foto siap pakai
   * yang relevan untuk ditampilkan sebagai "perlu diassign".
   */
  const hasUnassigned = (inspectionId: number) =>
    images.value.some(
      img => img.inspectionId === inspectionId
          && img.status === 'done'
          && !img.assignedToItemId
    )

  const unassignedCount = (inspectionId: number) =>
    images.value.filter(
      img => img.inspectionId === inspectionId
          && img.status === 'done'
          && !img.assignedToItemId
    ).length

  const pendingCount = computed(() =>
    images.value.filter(img => img.status === 'pending' || img.status === 'uploading').length
  )

  // ── Fetch dari server saat buka form ─────────────────────

  const fetchFromServer = async (inspectionId: number): Promise<void> => {
    try {
      const result        = await fetchUnassignedImages(inspectionId)
      const serverImages: any[] = result?.data?.data ?? result?.data ?? []

      images.value = images.value.filter(img => img.inspectionId !== inspectionId)

      for (const img of serverImages) {
        images.value.push({
          localId:           generateLocalId(),
          serverId:          img.id,
          url:               img.image_url,
          imageUrl:          img.image_url,
          caption:           img.caption ?? null,
          status:            'done',
          inspectionId,
          inspectionItemId:  img.inspection_item_id ?? null,
          assignedToItemId:  null,
          rotation:          0,
          addedAt:           new Date(img.created_at ?? Date.now()).getTime(),
        })
      }
    } catch (err) {
      console.error('[TempImageStore] fetchFromServer gagal:', err)
    }
  }

  // ── Tambah gambar baru & langsung upload ─────────────────

  const addImages = (params: {
    files:        File[]
    rotations?:   number[]
    inspectionId: number
  }): string[] => {
    const { files, rotations = [], inspectionId } = params
    const localIds: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file    = files[i]
      if (!file) continue    
      const rot     = rotations[i] ?? 0
      const localId = generateLocalId()
      // Buat blob URL langsung agar gambar muncul di grid sebelum upload selesai
      const blobUrl = URL.createObjectURL(file)

      images.value.push({
        localId,
        serverId:         null,
        file,
        url:              blobUrl,   // ← blob URL lokal, langsung tampil di grid
        status:           'pending',
        inspectionId,
        inspectionItemId: null,
        assignedToItemId: null,
        rotation:         rot,
        addedAt:          Date.now(),
      })

      localIds.push(localId)
    }

    _processQueue()
    return localIds
  }

  // ── Assign ke item — HANYA LOKAL ─────────────────────────

  const assignLocallyToItem = (
    localId:          string,
    inspectionItemId: number,
    itemId:           number
  ): { id: number; image_url: string; caption: string | null } | null => {
    const img = images.value.find(i => i.localId === localId)
    if (!img || !img.serverId) return null

    img.inspectionItemId  = inspectionItemId
    img.assignedToItemId  = itemId

    return {
      id:        img.serverId,
      image_url: img.imageUrl ?? img.url,
      caption:   img.caption  ?? null,
    }
  }

  // ── Unassign ──────────────────────────────────────────────

  const unassignFromItem = (localId: string): void => {
    const img = images.value.find(i => i.localId === localId)
    if (!img) return
    img.inspectionItemId = null
    img.assignedToItemId = null
  }

  // ── Hapus gambar ─────────────────────────────────────────

  const removeImage = (localId: string): void => {
    const img = images.value.find(i => i.localId === localId)
    if (!img) return

    if (img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)
    images.value = images.value.filter(i => i.localId !== localId)

    if (img.serverId) {
      deleteInspectionImage(img.serverId).catch(err =>
        console.warn('[TempImageStore] Delete server gagal:', err)
      )
    }
  }

  // ── Retry ─────────────────────────────────────────────────

  const retryUpload = (localId: string): void => {
    const img = images.value.find(i => i.localId === localId)
    if (!img || img.status !== 'failed') return
    img.status = 'pending'
    _processQueue()
  }

  // ── Clear ─────────────────────────────────────────────────

  const clearInspection = (inspectionId: number): void => {
    images.value
      .filter(img => img.inspectionId === inspectionId && img.url?.startsWith('blob:'))
      .forEach(img => URL.revokeObjectURL(img.url))
    images.value = images.value.filter(img => img.inspectionId !== inspectionId)
  }

  // ── Upload queue ──────────────────────────────────────────

  const _processQueue = (): void => {
    const pending = images.value.filter(
      img => img.status === 'pending' && !activeUploads.value.has(img.localId)
    )
    for (const img of pending) _uploadSingle(img.localId)
  }

  const _uploadSingle = async (localId: string): Promise<void> => {
    const img = images.value.find(i => i.localId === localId)
    if (!img?.file) return

    activeUploads.value.add(localId)
    img.status = 'uploading'

    try {
      let fileToUpload = img.file
      const rot = ((img.rotation || 0) % 360 + 360) % 360
      if (rot !== 0) fileToUpload = await rotateFileByCanvas(img.file, rot)

      const result   = await uploadTempImage(img.inspectionId, fileToUpload)
      const dataRaw  = result?.data ?? result
      const uploaded = Array.isArray(dataRaw) ? dataRaw[0] : dataRaw

      if (!uploaded?.id) throw new Error('Response server tidak mengandung data gambar')

      const current = images.value.find(i => i.localId === localId)
      if (!current) return

      // Lepas blob URL — ganti dengan URL server
      if (current.url?.startsWith('blob:')) URL.revokeObjectURL(current.url)

      current.serverId         = uploaded.id
      current.imageUrl         = uploaded.image_url
      current.url              = uploaded.image_url
      current.caption          = uploaded.caption         ?? null
      current.inspectionItemId = uploaded.inspection_item_id ?? null
      current.status           = 'done'
      current.rotation         = 0
      current.file             = undefined

    } catch (err: any) {
      console.error('[TempImageStore] Upload gagal:', localId, err)
      const current = images.value.find(i => i.localId === localId)
      if (current) {
        current.status       = 'failed'
        current.errorMessage = err?.message || 'Upload gagal'
        // Pertahankan blob URL agar gambar tetap tampil meski gagal upload
      }
    } finally {
      activeUploads.value.delete(localId)
    }
  }

  return {
    images,
    pendingCount,
    getByInspection,
    getUnassigned,
    hasUnassigned,
    unassignedCount,
    fetchFromServer,
    addImages,
    assignLocallyToItem,
    unassignFromItem,
    removeImage,
    retryUpload,
    clearInspection,
  }
})