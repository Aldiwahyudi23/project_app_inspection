// src/services/inspectionVehicleService.ts
import api from './api'

// ─── Selection (cascading) ────────────────────────────────────
// brand/model/type/transmission → pakai _id
// year/cc/fuel_type/market_period → pakai nilai langsung

export const getBrands = async () =>
  api.get('/app-inspection/vehicle/selection/brands')

export const getModels = async (brand_id: number) =>
  api.get('/app-inspection/vehicle/selection/models', { params: { brand_id } })

export const getTypes = async (brand_id: number, model_id: number) =>
  api.get('/app-inspection/vehicle/selection/types', { params: { brand_id, model_id } })

export const getYears = async (brand_id: number, model_id: number, type_id: number) =>
  api.get('/app-inspection/vehicle/selection/years', { params: { brand_id, model_id, type_id } })

export const getCc = async (
  brand_id: number, model_id: number, type_id: number, year: number
) =>
  api.get('/app-inspection/vehicle/selection/cc', {
    params: { brand_id, model_id, type_id, year },
  })

export const getTransmissions = async (
  brand_id: number, model_id: number, type_id: number,
  year: number, cc: number
) =>
  api.get('/app-inspection/vehicle/selection/transmissions', {
    params: { brand_id, model_id, type_id, year, cc },
  })

export const getFuelTypes = async (
  brand_id: number, model_id: number, type_id: number,
  year: number, cc: number, transmission_id: number
) =>
  api.get('/app-inspection/vehicle/selection/fuel-types', {
    params: { brand_id, model_id, type_id, year, cc, transmission_id },
  })

export const getMarketPeriods = async (
  brand_id: number, model_id: number, type_id: number,
  year: number, cc: number, transmission_id: number, fuel_type: string
) =>
  api.get('/app-inspection/vehicle/selection/market-periods', {
    params: { brand_id, model_id, type_id, year, cc, transmission_id, fuel_type },
  })

/** Payload: brand_id, model_id, type_id, year, cc, transmission_id, fuel_type, market_period */
export const getVehicleDetail = async (params: {
  brand_id:        number
  model_id:        number
  type_id:         number
  year:            number
  cc:              number
  transmission_id: number
  fuel_type:       string
  market_period:   string
}) =>
  api.get('/app-inspection/vehicle/selection/get-detail', { params })

export const searchVehicles = async (keyword: string) =>
  api.get('/app-inspection/vehicle/selection/search', { params: { keyword } })

// ─── Save ─────────────────────────────────────────────────────
/** Simpan ke inspeksi: license_plate + vehicle_id */
export const saveInspectionVehicle = async (
  inspectionId: number,
  data: { license_plate: string; vehicle_id: number; vehicle_name: string }
) =>
  api.put(`/app-inspection/form-inspection/${inspectionId}/update`, data)