// src/services/inspectionReportService.ts
import api from './api'
import type { EstimasiItem, PaymentPayload, SendWhatsAppResponse } from '../types/inspectionReport'

export const getDataReport = async (id: number) => {
  const response = await api.get(`/app-inspection/report/${id}`)
  return response
}

export const PostGeneratePDF = async (id: number, payload: PaymentPayload) => {
  const response = await api.post(`/app-inspection/report/${id}/generate-pdf`, payload)
  return response
}

export const PostSendWhatsapp = async (id: number, payload: PaymentPayload) => {
  const response = await api.post(`/app-inspection/report/${id}/send-via-whatsapp`, payload)
  return response
}



// ─── Estimasi CRUD ────────────────────────────────────────
export const storeEstimasi = async (inspectionId: number, payload: EstimasiItem) => {
  return await api.post(`/app-inspection/report/${inspectionId}/estimasi`, payload)
}

export const updateEstimasi = async (inspectionId: number, estimasiId: number, payload: EstimasiItem) => {
  return await api.put(`/app-inspection/report/${inspectionId}/estimasi/${estimasiId}`, payload)
}

export const destroyEstimasi = async (inspectionId: number, estimasiId: number) => {
  return await api.delete(`/app-inspection/report/${inspectionId}/estimasi/${estimasiId}`)
}

// Re-export untuk backward compat
export type { EstimasiItem }

export const getLinkPDF = async (id: number) => {
  const response = await api.get(`/app-inspection/report/${id}/document/download-pdf`)
  return response
}

export const getLinkPreview = async (id: number) => {
  const response = await api.get(`/app-inspection/report/${id}/document/preview-pdf`)
  return response
}

export const getSendWhatsAppData = async (
  inspectionId: number
) => {
  const response = await api.get<SendWhatsAppResponse>(
    `/app-inspection/report/send-whatsapp/${inspectionId}`
  )

  return response
}