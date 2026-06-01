import api from './api'

export interface MontlyIncome {
  amount: number
  formatted: string
}

export interface TotalBalance {
  amount: number
  formatted: string
}

export interface TotalBill {
  amount: string
  formatted: string
}

export interface HomeSummary {
  monthly_income:   MontlyIncome
  total_balance:    TotalBalance
  total_bill:       TotalBill
  total_inspection: number
}

export interface RecentInspection {
  id:              number
  inspection_id:   number
  status:          string
  status_label:    string
  status_color:    'success' | 'info' | 'warning' | 'danger' | string
  inspection_date: string
  vehicle_name:    string
  license_plate:   string
  display_image:   string | null
}

export interface HomeData {
  summary:            HomeSummary
  recent_inspections: RecentInspection[]
}

export interface HomeResponse {
  success: boolean
  data:    HomeData
}

export const getHomeData = () =>
  api.get<HomeResponse>('/app-inspection/home')