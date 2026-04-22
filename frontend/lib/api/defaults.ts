import { apiRequest, PagedResponse } from './client';

export interface SaveVendorDefaultsRequest {
    vendorId:        string;
    pctHandmade:     string;
    pctAgricultural: string;
    pctPreparedFood: string;
    pctCottageGoods: string;
    pctManufactured: string;
    avgSaleAmount:   string;
}

export interface VendorDefaults {
    id:              string;
    vendorId:        string;
    pctHandmade:     string;
    pctAgricultural: string;
    pctPreparedFood: string;
    pctCottageGoods: string;
    pctManufactured: string;
    avgSaleAmount:   string;
}

/**
 * Create new vendor defaults
 */
export async function createVendorDefaults(request: SaveVendorDefaultsRequest): Promise<VendorDefaults> {
    console.log('[Vendor Defaults API] Creating vendor defaults with request:', request);
    return apiRequest<VendorDefaults>('/api/defaults', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

/**
 * Get vendor defaults by ID
 */
export async function getVendorDefaults(uuid: string): Promise<VendorDefaults> {
    return apiRequest<VendorDefaults>(`/api/defaults/${uuid}`, {
        method: 'GET',
    });
}

/**
 * Get vendor defaults by Vendor ID
 */
export async function getVendorDefaultsByVendorId(vendorId: string): Promise<VendorDefaults> {
    return apiRequest<VendorDefaults>(`/api/defaults/vendor/${vendorId}`, {
        method: 'GET',
    });
}

/**
 * Update vendor defaults
 */
export async function updateVendorDefaults(uuid: string, request: SaveVendorDefaultsRequest): Promise<VendorDefaults> {
    console.log('[Vendor Defaults API] Updating vendor defaults with request:', request);
    return apiRequest<VendorDefaults>(`/api/defaults/${uuid}`, {
        method: 'PATCH',
        body: JSON.stringify(request),
    });
}

/**
 * Delete vendor defaults
 */
export async function deleteVendorDefaults(uuid: string): Promise<void> {
    return apiRequest<void>(`/api/defaults/${uuid}`, {
        method: 'DELETE',
    });
}

/**
 * Get all vendor defaults with pagination
 */
export async function getAllVendorDefaults(page: number = 0, size: number = 10): Promise<PagedResponse<VendorDefaults>> {
    return apiRequest<PagedResponse<VendorDefaults>>(`/api/defaults?page=${page}&size=${size}`, {
        method: 'GET',
    });
}
