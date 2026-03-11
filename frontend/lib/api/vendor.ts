import { apiRequest, PagedResponse } from './client';
import { VendorDefaults } from './defaults';

export interface CreateVendorRequest {
  vendorName: string;
  pointPerson?: string;
  email?: string;
  location?: string;
  miles?: number;
  products?: string;
  isFarmer: boolean;
  isProduce: boolean;
  isActive: boolean;
  womanOwned: boolean;
  bipocOwned: boolean;
  veteranOwned: boolean;
}

export interface Vendor {
  id: string;
  vendorName: string;
  pointPerson?: string;
  email?: string;
  location?: string;
  miles?: number;
  products?: string;
  isFarmer: boolean;
  isProduce: boolean;
  isActive: boolean;
  womanOwned: boolean;
  bipocOwned: boolean;
  veteranOwned: boolean;
  defaults?: VendorDefaults;
}

/**
 * Interface for the nested vendor response from the server
 */
interface VendorResponse {
  vendor: Vendor;
  defaults?: VendorDefaults;
}

/**
 * Create a new vendor
 */
export async function createVendor(request: CreateVendorRequest): Promise<Vendor> {
  console.log('[Vendor API] Creating vendor with request:', request);
  console.log('[Vendor API] Request payload:', JSON.stringify(request, null, 2));
  
  return apiRequest<Vendor>('/api/vendor', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Get all vendors with pagination
 */
export async function getVendors(page: number = 0, size: number = 10, includeInactive: boolean = false, includeDefaults: boolean = false): Promise<PagedResponse<Vendor>> {
  const response = await apiRequest<PagedResponse<VendorResponse>>(`/api/vendor?page=${page}&size=${size}&includeInactive=${includeInactive}&includeDefaults=${includeDefaults}`, {
    method: 'GET',
  });

  // The backend always returns VendorResponse objects now
  if (response.data) {
    return {
      ...response,
      data: response.data.map(item => ({
        ...item.vendor,
        defaults: item.defaults
      }))
    } as PagedResponse<Vendor>;
  }

  return response as unknown as PagedResponse<Vendor>;
}

/**
 * Get a vendor by UUID
 */
export async function getVendor(uuid: string, includeDefaults: boolean = false): Promise<Vendor> {
  const response = await apiRequest<any>(`/api/vendor/${uuid}?includeDefaults=${includeDefaults}`, {
    method: 'GET',
  });

  if (includeDefaults && response.vendor) {
    return {
      ...response.vendor,
      defaults: response.defaults
    };
  }

  return response;
}

/**
 * Update a vendor
 */
export async function updateVendor(uuid: string, request: CreateVendorRequest): Promise<Vendor> {
  return apiRequest<Vendor>(`/api/vendor/${uuid}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
}

/**
 * Delete a vendor
 */
export async function deleteVendor(uuid: string): Promise<void> {
  return apiRequest<void>(`/api/vendor/${uuid}`, {
    method: 'DELETE',
  });
}

