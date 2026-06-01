// ─── SOURCE TYPE ──────────────────────────────────────────────
export type TemplateSource =
  | 'global_default'
  | 'user_default'
  | 'user_selection'

// ─── MENU SECTION ─────────────────────────────────────────────
export interface MenuSection {
  id: number
  name: string
  sort_order: number
  is_active: boolean

  // optional (kalau ada nested)
  items?: any[]
}

// ─── TEMPLATE ─────────────────────────────────────────────────
export interface InspectionTemplate {
  id: number
  name: string
  description?: string

  is_default: boolean
  is_active: boolean
  sort_order?: number

  settings?: Record<string, any>

  menu_sections?: MenuSection[]
}

// ─── RESPONSE ─────────────────────────────────────────────────
export interface TemplateResponse {
  source: TemplateSource
  data: InspectionTemplate | InspectionTemplate[]
}