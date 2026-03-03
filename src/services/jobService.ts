
import api from './api';
import type { 
  JobCountResponse, 
  JobListResponse, 
  JobQueryParams,
  JobDetailResponse,
  UpdateStatusPayload,
  UpdateStatusResponse,
  NextJobStatus
} from '../types/job';

class JobService {
  private readonly BASE_URL = '/app-inspection/jobs';

  // ============================================
  // Job List Methods (yang sudah ada)
  // ============================================
  
  async getJobCounts(): Promise<JobCountResponse> {
    try {
      const [draftResponse, processResponse] = await Promise.all([
        this.getDraftJobs({ per_page: 1 }),
        this.getProcessJobs({ per_page: 1 })
      ]);

      return {
        status: 'success',
        data: {
          draft: draftResponse.pagination.total,
          process: processResponse.pagination.total
        }
      };
    } catch (error) {
      console.error('Error getting job counts:', error);
      return {
        status: 'error',
        data: {
          draft: 0,
          process: 0
        }
      };
    }
  }

  async getDraftJobs(params: JobQueryParams = {}): Promise<JobListResponse> {
    const response = await api.get<JobListResponse>(`${this.BASE_URL}/draft`, {
      params: {
        search: params.search,
        sort_field: params.sort_field || 'inspection_date',
        sort_order: params.sort_order || 'asc',
        per_page: params.per_page || 10,
        page: params.page || 1,
      }
    });
    return response.data;
  }

  async getProcessJobs(params: JobQueryParams = {}): Promise<JobListResponse> {
    const response = await api.get<JobListResponse>(`${this.BASE_URL}/process`, {
      params: {
        search: params.search,
        sort_field: params.sort_field || 'inspection_date',
        sort_order: params.sort_order || 'asc',
        per_page: params.per_page || 10,
        page: params.page || 1,
      }
    });
    return response.data;
  }

  async getCompletedJobs(params: JobQueryParams = {}): Promise<JobListResponse> {
    const response = await api.get<JobListResponse>(`${this.BASE_URL}/completed`, {
      params: {
        search: params.search,
        year: params.year,
        month: params.month,
        status: params.status,
        sort_field: params.sort_field || 'inspection_date',
        sort_order: params.sort_order || 'desc',
        per_page: params.per_page || 10,
        page: params.page || 1,
      }
    });
    return response.data;
  }

  // ============================================
  // Job Detail Methods (BARU)
  // ============================================

  /**
   * Mendapatkan detail job berdasarkan ID
   * @param id - ID inspeksi (inspection_id)
   */
  async getJobDetail(id: number): Promise<JobDetailResponse> {
    const response = await api.get<JobDetailResponse>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Update status inspeksi
   * @param id - ID inspeksi (inspection_id)
   * @param payload - Payload update status (status dan notes opsional)
   */
  async updateJobStatus(
    id: number, 
    payload: UpdateStatusPayload
  ): Promise<UpdateStatusResponse> {
    const response = await api.patch<UpdateStatusResponse>(
      `${this.BASE_URL}/${id}/status`, 
      payload
    );
    return response.data;
  }

  /**
   * Update status inspeksi dengan parameter terpisah (alternatif)
   * @param id - ID inspeksi
   * @param status - Status baru
   * @param notes - Catatan opsional
   */
  async patchJobStatus(
    id: number, 
    status: NextJobStatus, 
    notes?: string
  ): Promise<UpdateStatusResponse> {
    return this.updateJobStatus(id, { status, notes });
  }
}

export default new JobService();

// Untuk backward compatibility, export fungsi-fungsi individual juga
export const getJobDetail = (uuid: number) => {
  return api.get<JobDetailResponse>(`/app-inspection/jobs/${uuid}`);
};

export const patchJobStatus = (
  id: number, 
  status: NextJobStatus, 
  notes?: string
) => {
  return api.patch<UpdateStatusResponse>(`/app-inspection/jobs/${id}/status`, {
    status,
    ...(notes && { notes })
  });
};