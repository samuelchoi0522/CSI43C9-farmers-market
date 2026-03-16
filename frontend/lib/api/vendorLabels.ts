import { apiRequest } from "./client";

export interface CategoryLabel {
  id: number;
  name: string;
}

interface CreateCategoryLabelRequest {
  name: string;
}

interface VendorLabelRequest {
  labelIds: number[];
}

/**
 * Fetch all globally available category labels.
 */
export async function getAllCategoryLabels(): Promise<CategoryLabel[]> {
  return apiRequest<CategoryLabel[]>("/api/categories", {
    method: "GET",
  });
}

/**
 * Create a new global category label.
 */
export async function createCategoryLabel(
  name: string,
): Promise<CategoryLabel> {
  const body: CreateCategoryLabelRequest = { name };

  return apiRequest<CategoryLabel>("/api/categories", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Delete a global category label.
 */
export async function deleteCategoryLabel(labelId: number): Promise<void> {
  return apiRequest<void>(`/api/categories/${labelId}`, {
    method: "DELETE",
  });
}

/**
 * Update a global category label.
 */
export async function updateCategoryLabel(
  labelId: number,
  name: string,
): Promise<CategoryLabel> {
  const body: CreateCategoryLabelRequest = { name };

  return apiRequest<CategoryLabel>(`/api/categories/${labelId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * Get labels currently assigned to a vendor.
 */
export async function getVendorCategoryLabels(
  vendorId: string,
): Promise<CategoryLabel[]> {
  return apiRequest<CategoryLabel[]>(`/api/vendors/${vendorId}/categories`, {
    method: "GET",
  });
}

/**
 * Add one or more labels to a vendor.
 */
export async function addLabelsToVendor(
  vendorId: string,
  labelIds: number[],
): Promise<void> {
  const body: VendorLabelRequest = { labelIds };

  return apiRequest<void>(`/api/vendors/${vendorId}/categories`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Remove a label from a vendor.
 */
export async function removeLabelFromVendor(
  vendorId: string,
  labelId: number,
): Promise<void> {
  return apiRequest<void>(`/api/vendors/${vendorId}/categories/${labelId}`, {
    method: "DELETE",
  });
}
