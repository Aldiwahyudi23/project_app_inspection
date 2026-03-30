// ─── Inspection Report Types ──────────────────────────────────────────────────

export interface ReportData {
  inspection: Record<string, any>
  vehicle_detail: Record<string, any> | null
  report_template: Record<string, any>
  conclusion: Record<string, any>
  sections: Section[]
  estimations: Estimation[]
}

export interface Section {
  section_id: number | null
  title: string
  order: number
  style: SectionStyle | null
  layout: SectionLayout | null
  table_setting: TableSetting | null
  result: ResultRow[]
  images: ImageRow[]
  noted: NotedRow[]
}

export interface SectionStyle {
  background_color?: string
  title_color?: string
  title_align?: string
}

export interface SectionLayout {
  row_image?: string
}

export interface TableSetting {
  row?: string
  show_header?: boolean
  border_style?: 'underline' | 'box' | 'full' | 'none'
}

export interface ResultRow {
  inspection_item_id: number
  name: string
  value: string
}

export interface ImageRow {
  inspection_item_id: number
  name: string
  id: number
  image_url: string
  caption?: string
}

export interface NotedImage {
  id: number
  image_url: string
  caption?: string
}

export interface NotedRow {
  inspection_item_id: number
  name: string
  status: string | null
  note: string | null
  images: NotedImage[]
}

export interface Estimation {
  id?: number
  part_name: string
  repair_description?: string
  urgency: 'immediate' | 'soon' | 'optional' | 'monitor'
  status: 'required' | 'recommended' | 'optional'
  estimated_cost: number
  notes?: string
}

// Tambah EstimasiItem (extend Estimation untuk keperluan form & local state)
export interface EstimasiItem extends Estimation {
  id?: number        // override jadi optional (belum ada saat baru dibuat)
  _tempId?: number   // id sementara sebelum tersimpan ke server
  _updating?: boolean
  _deleting?: boolean
}

// ─── Modal Types ───────────────────────────────────────────────────────────────

/**
 * Satu entri gambar dalam daftar navigasi modal.
 */
export interface ModalImageItem {
  /** URL gambar */
  url: string
  /** Nama item inspeksi (mis. "Panel Pintu Kiri", "No Mesin Fisik") */
  itemName: string
  /** Caption singkat dari gambar (opsional) */
  caption?: string
  /** Status item noted, bisa string JSON array atau string biasa */
  status?: string | string[] | null
  /** Catatan dari noted */
  note?: string | null
  /**
   * Info tambahan khusus yang ditampilkan sebagai chip di bottom bar.
   * Contoh: No Mesin, No Rangka, Pajak Tahunan, dsb.
   */
  extraInfo?: { label: string; value: string }[]
}

/**
 * State modal preview gambar.
 * Semua gambar dari satu section / konteks dikumpulkan ke `images`
 * sehingga user dapat navigasi kiri-kanan.
 */
export interface ModalState {
  open: boolean
  /** Indeks gambar yang sedang aktif dalam `images` */
  currentIndex: number
  /** Seluruh daftar gambar dalam konteks navigasi saat ini */
  images: ModalImageItem[]
}

// ─── Config Types ──────────────────────────────────────────────────────────────

export interface ReportConfig {
  header?: HeaderConfig
  content?: ContentConfig
}

export interface HeaderConfig {
  company_position?: 'left' | 'right'
  company_type?: 'logo' | 'name'
  company_logo?: string
  company_name?: string
  company_name_color?: string
  show_title?: boolean
  title_text?: string
}

export interface ContentConfig {
  display_vehicle?: boolean
  vehicle_display_type?: 'detail' | 'nama' | string
  vehicle_data?: VehicleDataConfig
}

export interface VehicleDataConfig {
  km?: boolean
  color?: boolean
  no_rangka?: boolean
  no_mesin?: boolean
  id_transaksi?: boolean
}