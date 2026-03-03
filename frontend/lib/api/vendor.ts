import { apiRequest, PagedResponse } from './client';

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
export async function getVendors(page: number = 0, size: number = 10): Promise<PagedResponse<Vendor>> {
  return apiRequest<PagedResponse<Vendor>>(`/api/vendor?page=${page}&size=${size}`, {
    method: 'GET',
  });
}

/**
 * Get a vendor by UUID
 */
export async function getVendor(uuid: string): Promise<Vendor> {
  return apiRequest<Vendor>(`/api/vendor/${uuid}`, {
    method: 'GET',
  });
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

