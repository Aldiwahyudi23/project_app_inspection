// services/customerSellerService.ts

import api from './api';
import type {
  Customer,
  // Seller,
  CustomerResponse,
  FindByPhoneResponse,
  StoreSellerPayload,
  StoreSellerResponse,
  UpdateCustomerPayload,
  ErrorResponse
} from '../types/customerSeller';

class CustomerSellerService {
  private readonly BASE_URL = '/app-inspection/customer-seller';

  /**
   * 🔍 Find customer by phone number
   * @param phone - Phone number to search
   * @returns Customer data if found, null if not found
   * 
   * @example
   * const result = await customerSellerService.findByPhone('08123456789');
   * if (result.found) {
   *   console.log('Customer found:', result.data);
   * } else {
   *   console.log('Customer not found');
   * }
   */
  async findByPhone(phone: string): Promise<FindByPhoneResponse> {
    try {
      const response = await api.get<FindByPhoneResponse>(
        `${this.BASE_URL}/find-by-phone`,
        {
          params: { phone }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error finding customer by phone:', error);
      return {
        success: false,
        found: false,
        message: 'Failed to fetch customer',
        data: null
      };
    }
  }

  /**
   * Get customer by ID
   * @param id - Customer ID
   * @returns Customer data
   */
  async getCustomerById(id: number): Promise<CustomerResponse> {
    try {
      const response = await api.get<CustomerResponse>(`${this.BASE_URL}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error getting customer #${id}:`, error);
      throw {
        success: false,
        message: error.response?.data?.message || 'Failed to get customer',
        data: null
      };
    }
  }

  /**
   * Check if customer exists by phone number
   * @param phone - Phone number to check
   * @returns boolean indicating if customer exists
   */
  async isCustomerExists(phone: string): Promise<boolean> {
    const result = await this.findByPhone(phone);
    return result.found === true && result.data !== null;
  }

  /**
   * Get customer data by phone number (throws if not found)
   * @param phone - Phone number
   * @returns Customer data
   * @throws Error if customer not found
   */
  async getCustomerByPhoneOrThrow(phone: string): Promise<Customer> {
    const result = await this.findByPhone(phone);
    
    if (!result.found || !result.data) {
      throw new Error(`Customer with phone ${phone} not found`);
    }
    
    return result.data;
  }

  /**
   * 📝 Create new Seller (with existing or new Customer)
   * Jika customer dengan phone sudah ada, akan menggunakan customer tersebut
   * Jika belum ada, akan membuat customer baru
   * Seller ALWAYS dibuat baru
   * 
   * @param payload - Customer and Seller data
   * @returns Created customer and seller data
   * 
   * @example
   * // Create seller with existing customer
   * const result = await customerSellerService.store({
   *   name: 'Budi Santoso',
   *   phone: '081234567890', // phone already exists
   *   inspection_id: 1,
   *   inspection_area: 'Jakarta Selatan',
   *   inspection_address: 'Jl. Sudirman No. 45'
   * });
   * 
   * @example
   * // Create seller with new customer
   * const result = await customerSellerService.store({
   *   name: 'Jane Smith',
   *   phone: '087654321098', // phone not exists
   *   email: 'jane@example.com',
   *   address: 'Jl. Kenangan No. 12',
   *   inspection_id: 2,
   *   inspection_area: 'Jakarta Utara',
   *   inspection_address: 'Jl. Pluit Raya No. 10'
   * });
   */
  async store(payload: StoreSellerPayload): Promise<StoreSellerResponse> {
    try {
      const response = await api.post<StoreSellerResponse>(
        this.BASE_URL,
        payload
      );
      return response.data;
    } catch (error: any) {
      console.error('Error storing seller:', error);
      
      if (error.response?.data) {
        throw error.response.data as ErrorResponse;
      }
      
      throw {
        success: false,
        message: error.message || 'Failed to store seller',
        data: null as any
      } as StoreSellerResponse;
    }
  }

  /**
   * ✏️ Update existing Customer only (does not affect Seller)
   * @param id - Customer ID
   * @param payload - Updated customer data
   * @returns Updated customer data
   * 
   * @example
   * const result = await customerSellerService.updateCustomer(123, {
   *   name: 'Budi Santoso Updated',
   *   email: 'budi.updated@example.com',
   *   address: 'Jl. Merdeka No. 50'
   * });
   */
  async updateCustomer(
    id: number,
    payload: UpdateCustomerPayload
  ): Promise<CustomerResponse> {
    try {
      const response = await api.put<CustomerResponse>(
        `${this.BASE_URL}/${id}`,
        payload
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error updating customer #${id}:`, error);
      
      if (error.response?.data) {
        throw error.response.data as ErrorResponse;
      }
      
      throw {
        success: false,
        message: error.message || 'Failed to update customer',
        data: null as any
      } as CustomerResponse;
    }
  }

  /**
   * 🔄 Helper: Create seller data object for form submission
   * @param data - Raw seller data
   * @returns Formatted seller payload
   */
  formatSellerPayload(data: Partial<StoreSellerPayload>): StoreSellerPayload {
    return {
      name: data.name || '',
      phone: data.phone || '',
      email: data.email || null,
      address: data.address || null,
      inspection_id: data.inspection_id || 0,
      inspection_area: data.inspection_area || '',
      inspection_address: data.inspection_address || '',
      link_maps: data.link_maps || null,
      unit_holder_name: data.unit_holder_name || null,
      unit_holder_phone: data.unit_holder_phone || null,
      settings: data.settings || null,
    };
  }
}

export default new CustomerSellerService();

// ============================================
// Individual exported functions for backward compatibility
// ============================================

export const findCustomerByPhone = (phone: string) => {
  return api.get<FindByPhoneResponse>('/app-inspection/customer-seller/find-by-phone', {
    params: { phone }
  });
};

export const getCustomerById = (id: number) => {
  return api.get<CustomerResponse>(`/app-inspection/customer-seller/${id}`);
};

export const storeSeller = (payload: StoreSellerPayload) => {
  return api.post<StoreSellerResponse>('/app-inspection/customer-seller', payload);
};

export const updateCustomer = (id: number, payload: UpdateCustomerPayload) => {
  return api.put<CustomerResponse>(`/app-inspection/customer-seller/${id}`, payload);
};