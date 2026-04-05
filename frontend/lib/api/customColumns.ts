import { apiRequest } from './client';

export interface CustomColumnMetadata {
  id: number;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'usd';
  isRequired: boolean;
}

export async function getActiveCustomColumns(): Promise<CustomColumnMetadata[]> {
  return apiRequest<CustomColumnMetadata[]>('/api/custom-columns/active', {
    method: 'GET',
  });
}
