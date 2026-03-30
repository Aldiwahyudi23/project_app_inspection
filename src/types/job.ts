// types/job.ts

export type JobStatus = 'draft' | 'process' | 'approved' | 'rejected' | 'completed' | 'cancelled';
export type JobMenu = 'draft' | 'process' | 'completed';

// Status untuk proses update (dari available_next_statuses)
export type NextJobStatus = 
  'accepted' | 'on_the_way' | 'arrived' | 'in_progress' | 
  'completed' | 'cancelled' | 'rejected' | 'pending' | 
  'paused' | 'under_review' | 'revision' | 'approved' | 
  'draft' | 'process'

export interface JobStatusInfo {
  value: JobStatus;
  label: string;
  color: string;
  icon?: string;
}

export interface JobLabel {
  license_plate: string;
  vehicle_name: string;
  inspection_date_formatted: string;
}

export interface JobItem {
  id: number;
  uuid: string;
  inspection_id: number;
  status: JobStatus;
  status_label: string;
  status_color: string;
  status_icon: string;
  label: JobLabel;
}

// ============================================
// Tipe untuk Detail Job
// ============================================

export interface Customer {
  name: string;
  phone: string;
  address: string;
}

export interface Seller {
  name: string;
  phone: string;
}

export interface Address {
  area: string;
  name: string;
  link_maps: string;
}

export interface Inspector {
  name: string;
  phone: string;
}

export interface SubmittedBy {
  name: string;
  phone: string | null;
}

export interface Transmission {
  name: string;
  description: string;
}
export interface Document {
  inspection_code: string;
  has_document: boolean;
}

export interface Vehicle {
  license_plate: string;
  vehicle_name: string;
  brand: string;
  model: string;
  type: string;
  cc: number;
  year: number;
  transmission: Transmission;
  fuel_type: string;
  generation: string;
  origin: string;
  market_period: string;
}

export interface Template {
  id: number;
  name: string;
}

export interface JobDetail {
  id: number;
  uuid: string;
  inspection_id: number;
  reference: string | null;
  status: JobStatus;
  status_label: string;
  status_color: string;
  status_icon: string;
  inspection_date_formatted: string;
  notes: string | null;
  customer: Customer;
  seller: Seller;
  address: Address;
  inspector: Inspector;
  submitted_by: SubmittedBy;
  vehicle: Vehicle;
  template: Template;
  document: Document;
}

export interface JobDetailResponse {
  uuid: string;
  status: string;
  message: string;
  data: JobDetail;
  available_next_statuses: NextJobStatus[];
}

// ============================================
// Tipe untuk Update Status
// ============================================

export interface UpdateStatusPayload {
  status: NextJobStatus;
  notes?: string;
}

export interface UpdateStatusResponse {
  status: string;
  message: string;
  data: JobDetail;
  available_next_statuses: NextJobStatus[];
}

// ============================================
// Tipe untuk Status Mapping (Helper)
// ============================================

export interface StatusOption {
  value: NextJobStatus;
  label: string;
  color: string;
  icon: string;
  description?: string;
}

// Mapping untuk menampilkan status dengan properti yang sesuai
export const STATUS_OPTIONS: Record<NextJobStatus, StatusOption> = {
  accepted: { value: 'accepted', label: 'Terima', color: 'success', icon: 'M5 13l4 4L19 7' },
  on_the_way: { value: 'on_the_way', label: 'Dalam Perjalanan', color: 'info', icon: 'M13 7l4 4m0 0l-4 4m4-4H3' },
  arrived: { value: 'arrived', label: 'Tiba di Lokasi', color: 'info', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
  in_progress: { value: 'in_progress', label: 'Sedang Berjalan', color: 'warning', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  completed: { value: 'completed', label: 'Selesai', color: 'success', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  cancelled: { value: 'cancelled', label: 'Batalkan', color: 'danger', icon: 'M6 18L18 6M6 6l12 12' },
  rejected: { value: 'rejected', label: 'Tolak', color: 'danger', icon: 'M6 18L18 6M6 6l12 12' },
  // ← tambahkan yang kurang:
  pending: { value: 'pending', label: 'Tunda', color: 'warning', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  paused: { value: 'paused', label: 'Jeda', color: 'gray', icon: 'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  under_review: { value: 'under_review', label: 'Tinjau', color: 'info', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  revision: { value: 'revision', label: 'Revisi', color: 'danger', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
  approved: { value: 'approved', label: 'Setujui', color: 'success', icon: 'M5 13l4 4L19 7' },
  draft: { value: 'draft', label: 'Draft', color: 'gray', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
  process: { value: 'process', label: 'Proses', color: 'warning', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
}

// Helper function untuk mendapatkan option status
export function getStatusOption(status: NextJobStatus): StatusOption {
  return STATUS_OPTIONS[status] || {
    value: status,
    label: status.replace(/_/g, ' '),
    color: 'gray',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  };
}

// ============================================
// Tipe untuk Query Params dan State (yang sudah ada)
// ============================================

export interface JobCountData {
  draft: number;
  process: number;
}

export interface JobCountResponse {
  status: string;
  data: JobCountData;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface JobListResponse {
  status: string;
  message: string;
  data: JobItem[];
  pagination: PaginationMeta;
  filters?: CompletedJobFilters;
  statistics?: CompletedJobStatistics;
}

export interface CompletedJobFilters {
  year: number | null;
  month: number | null;
  available_statuses: JobStatusInfo[];
  available_months: number[];
}

export interface CompletedJobStatistics {
  total: number;
  by_status: Record<JobStatus, number>;
  approved: number;
  rejected: number;
  completed: number;
  cancelled: number;
}

export interface JobQueryParams {
  search?: string;
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
  status?: JobStatus;
  year?: number;
  month?: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
  filters?: CompletedJobFilters;
  statistics?: CompletedJobStatistics;
}

export interface JobState {
  counts: JobCountData | null;
  draft: {
    data: PaginatedData<JobItem> | null;
    loading: boolean;
    search: string;
    params: JobQueryParams;
  };
  process: {
    data: PaginatedData<JobItem> | null;
    loading: boolean;
    search: string;
    params: JobQueryParams;
    availableStatuses: JobStatusInfo[];
  };
  completed: {
    data: PaginatedData<JobItem> | null;
    loading: boolean;
    search: string;
    params: JobQueryParams;
    availableStatuses: JobStatusInfo[];
    availableMonths: number[];
    year: number | null;
    month: number | null;
    selectedStatus: JobStatus | null;
    statistics: CompletedJobStatistics | null;
  };
  activeMenu: JobMenu;
  loading: {
    counts: boolean;
    initial: boolean;
  };
}
