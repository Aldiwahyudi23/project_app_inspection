//src/services/inspectionTemplateService.ts
import api from './api'
import type {
  TemplateResponse,
  InspectionTemplate
} from '../types/inspectionTemplate'

// ─── GET USER FORM TEMPLATES ──────────────────────────────────
export const getFormTemplates = async () => {
  return api.get<TemplateResponse>(
    '/app-inspection/get-form-templates'
  )
}

// ─── GET DETAIL TEMPLATE ──────────────────────────────────────
export const getTemplateDetail = async (id: number) => {
  return api.get<{
    success: boolean
    data: InspectionTemplate
  }>(`/inspection-template/${id}`)
}

// ─── Update Inspection Template ───────────────────────────────

/** Update form template inspeksi */
export const updateInspectionTemplateForm = async (
  inspectionId: number,
  data: { template_id: number | null }
) =>
  api.put(`/app-inspection/template-form/${inspectionId}`, data)

/** Update report template inspeksi */
export const updateInspectionTemplateReport = async (
  inspectionId: number,
  data: { report_template_id: number | null }
) =>
  api.put(`/app-inspection/template-report/${inspectionId}`, data)