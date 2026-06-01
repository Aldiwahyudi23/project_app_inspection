import api from './api'

// payload sesuai backend kamu
export interface CreateInspectionPayload {
  customer_id: number
  inspector_id: number
  submitted_by: number
  inspection_date: string
  is_scheduled: boolean
  notes?: string
  reference?: string
  settings?: Record<string, any>

  license_plate: string
  vehicle_name: string
  vehicle_id: number
  template_id: number
}

export const storeInspection = async (payload: CreateInspectionPayload) => {
  return api.post('/app-inspection/store-inspection', payload)
}