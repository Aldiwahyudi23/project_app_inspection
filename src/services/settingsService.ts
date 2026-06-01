// src/services/settingsService.ts

import api from './api'

import type {
  SettingsResponse,
  UpdateDefaultTemplatePayload,
  UpdateDefaultTemplateResponse,
} from '../types/settings'

/**
 * Get all settings
 */
export const getSettings = async (): Promise<SettingsResponse> => {
  const response = await api.get('/app-inspection/settings/inspection-templates')

  return response.data
}

/**
 * Update default inspection template
 */
export const updateDefaultInspectionTemplate = async (
  id: number,
  data: UpdateDefaultTemplatePayload
): Promise<UpdateDefaultTemplateResponse> => {

  const response = await api.put(
    `/app-inspection/settings/inspection-templates/${id}/set-default`,
    data
  )

  return response.data
}