// types/customerSeller.ts

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Seller {
  id: number;
  customer_id: number;
  inspection_id: number;
  inspection_area: string;
  inspection_address: string;
  link_maps: string | null;
  unit_holder_name: string | null;
  unit_holder_phone: string | null;
  settings: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
}

export interface StoreSellerPayload {
  // Customer fields (untuk create jika belum ada)
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;

  // Seller fields (wajib)
  inspection_id: number;
  inspection_area: string;
  inspection_address: string;
  link_maps?: string | null;
  unit_holder_name?: string | null;
  unit_holder_phone?: string | null;
  settings?: Record<string, any> | null;
}

export interface UpdateCustomerPayload {
  name?: string;
  phone?: string;
  email?: string | null;
  address?: string | null;
}

export interface FindByPhoneResponse {
  success: boolean;
  found: boolean;
  message: string;
  data: Customer | null;
}

export interface StoreSellerResponse {
  success: boolean;
  message: string;
  data: {
    customer: Customer;
    seller: Seller;
  };
}

export interface CustomerResponse {
  success: boolean;
  data: Customer;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
}