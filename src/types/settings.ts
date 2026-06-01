// src/types/settings.ts

export interface InspectionTemplateItem {
  id: number
  template_id: number
  name: string
  template_type: 'form' | 'report'
  is_default: boolean
  is_active: boolean
}

export interface InspectionTemplates {
  form: InspectionTemplateItem[]
  report: InspectionTemplateItem[]
}

export interface SettingsData {
  inspection_templates: InspectionTemplates
}

export interface SettingsResponse {
  success: boolean
  message: string
  data: SettingsData
}

export interface UpdateDefaultTemplatePayload {
  is_default: boolean
}

export interface UpdateDefaultTemplateResponse {
  success: boolean
  message: string
  data: {
    id: number
    template_id: number
    template_type: 'form' | 'report'
    name: string
    is_default: boolean
  }
}