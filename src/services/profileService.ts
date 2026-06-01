import api from './api';
import type { ProfileResponse } from '../types/profile'

export const profileService = {
  async me(): Promise<ProfileResponse> {
    const response = await api.get('/app-inspection/me')

    return response.data
  },
}
