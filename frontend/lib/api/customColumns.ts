import { apiRequest } from './client';

export interface CustomColumnMetadata {
  id?: number;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'usd';
  isRequired: boolean;
  isActive?: boolean;
}

export async function getAllCustomColumns(): Promise<CustomColumnMetadata[]> {
  return apiRequest<CustomColumnMetadata[]>('/api/custom-columns/all', {
    method: 'GET',
  });
}

export async function getActiveCustomColumns(): Promise<CustomColumnMetadata[]> {
  return apiRequest<CustomColumnMetadata[]>('/api/custom-columns/active', {
    method: 'GET',
  });
}

export async function createCustomColumn(column: CustomColumnMetadata): Promise<CustomColumnMetadata> {
  return apiRequest<CustomColumnMetadata>('/api/custom-columns', {
    method: 'POST',
    body: JSON.stringify(column),
  });
}

export async function updateCustomColumn(id: number, column: CustomColumnMetadata): Promise<CustomColumnMetadata> {
  return apiRequest<CustomColumnMetadata>(`/api/custom-columns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(column),
  });
}

export async function deactivateCustomColumn(id: number): Promise<void> {
  return apiRequest<void>(`/api/custom-columns/${id}/deactivate`, {
    method: 'PATCH',
  });
}

export async function reactivateCustomColumn(id: number): Promise<void> {
  return apiRequest<void>(`/api/custom-columns/${id}/reactivate`, {
    method: 'PATCH',
  });
}

export async function deleteCustomColumn(id: number): Promise<void> {
  return apiRequest<void>(`/api/custom-columns/${id}`, {
    method: 'DELETE',
  });
}
