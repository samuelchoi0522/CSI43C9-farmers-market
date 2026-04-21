import { apiRequest, PagedResponse } from './client';

export interface CreateVendorTransactionRequest {
  vendorId: string;
  vendorName: string;
  marketDate: string;           // ISO date string: "YYYY-MM-DD"
  present?: boolean;
  snap?: number;
  dufb?: number;
  wdfmTokens?: number;
  voucher?: number;
  reimbursementDue?: number;
  reportedSales?: number;
  estProduceSales?: number;
  estNumTransactions?: number;
  customData?: Record<string, unknown>;
}

export interface VendorTransaction {
  id: string;
  vendorId: string;
  vendorName: string;
  marketDate: string;
  present: boolean;
  snap: number;
  dufb: number;
  wdfmTokens: number;
  voucher: number;
  reimbursementDue: number;
  reportedSales: number;
  estProduceSales: number;
  estNumTransactions: number;
  customData?: Record<string, unknown>;
}

export interface VendorTransactionSearchParams {
  page?: number;
  size?: number;
  marketDate?: string;
  startMarketDate?: string;
  endMarketDate?: string;
  [key: string]: string | number | boolean | undefined;
}

const calculateReimbursementDue = ({
  snap = 0,
  dufb = 0,
  wdfmTokens = 0,
  voucher = 0,
}: Pick<VendorTransaction, 'snap' | 'dufb' | 'wdfmTokens' | 'voucher'>) =>
  snap + dufb + wdfmTokens + voucher;

const hydrateVendorTransaction = (transaction: VendorTransaction): VendorTransaction => ({
  ...transaction,
  reimbursementDue: calculateReimbursementDue(transaction),
});

const hydrateVendorTransactionListResponse = (
  response: PagedResponse<VendorTransaction>
): PagedResponse<VendorTransaction> => ({
  ...response,
  data: response.data.map(hydrateVendorTransaction),
});

const stripCalculatedFields = (
  request: CreateVendorTransactionRequest
): Omit<CreateVendorTransactionRequest, 'reimbursementDue'> => {
  const requestWithoutCalculatedFields = { ...request };
  delete requestWithoutCalculatedFields.reimbursementDue;
  return requestWithoutCalculatedFields;
};

/**
 * Create a new vendor transaction
 */
export async function createVendorTransaction(
  request: CreateVendorTransactionRequest
): Promise<VendorTransaction> {
  const response = await apiRequest<VendorTransaction>('/api/vendor-transaction', {
    method: 'POST',
    body: JSON.stringify(stripCalculatedFields(request)),
  });

  return hydrateVendorTransaction(response);
}

/**
 * Get all vendor transactions with pagination
 */
export async function getVendorTransactions(
  page: number = 0,
  size: number = 10
): Promise<PagedResponse<VendorTransaction>> {
  const response = await apiRequest<PagedResponse<VendorTransaction>>(
    `/api/vendor-transaction?page=${page}&size=${size}`,
    { method: 'GET' }
  );

  return hydrateVendorTransactionListResponse(response);
}

/**
 * Get all transactions for a specific vendor
 */
export async function getVendorTransactionsByVendor(
  vendorId: string,
  page: number = 0,
  size: number = 10
): Promise<PagedResponse<VendorTransaction>> {
  const response = await apiRequest<PagedResponse<VendorTransaction>>(
    `/api/vendor-transaction/vendor/${vendorId}?page=${page}&size=${size}`,
    { method: 'GET' }
  );

  return hydrateVendorTransactionListResponse(response);
}

/**
 * Get all transactions for a specific market date
 */
export async function getVendorTransactionsByDate(
  marketDate: string,
  page: number = 0,
  size: number = 10
): Promise<PagedResponse<VendorTransaction>> {
  const response = await apiRequest<PagedResponse<VendorTransaction>>(
    `/api/vendor-transaction?marketDate=${marketDate}&page=${page}&size=${size}`,
    { method: 'GET' }
  );

  return hydrateVendorTransactionListResponse(response);
}

/**
 * Search vendor transactions using flexible query parameters.
 */
export async function searchVendorTransactions(
  params: VendorTransactionSearchParams = {}
): Promise<PagedResponse<VendorTransaction>> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `/api/vendor-transaction/search?${queryString}`
    : '/api/vendor-transaction/search';

  const response = await apiRequest<PagedResponse<VendorTransaction>>(endpoint, {
    method: 'GET',
  });

  return hydrateVendorTransactionListResponse(response);
}

/**
 * Get a single vendor transaction by UUID
 */
export async function getVendorTransaction(uuid: string): Promise<VendorTransaction> {
  const response = await apiRequest<VendorTransaction>(`/api/vendor-transaction/${uuid}`, {
    method: 'GET',
  });

  return hydrateVendorTransaction(response);
}

/**
 * Get the sorted list of market dates that have vendor transactions.
 */
export async function getVendorTransactionMarketDates(): Promise<string[]> {
  return apiRequest<string[]>('/api/vendor-transaction/market-dates', {
    method: 'GET',
  });
}

/**
 * Update a vendor transaction
 */
export async function updateVendorTransaction(
  uuid: string,
  request: CreateVendorTransactionRequest
): Promise<VendorTransaction> {
  const response = await apiRequest<VendorTransaction>(`/api/vendor-transaction/${uuid}`, {
    method: 'PATCH',
    body: JSON.stringify(stripCalculatedFields(request)),
  });

  return hydrateVendorTransaction(response);
}

/**
 * Delete a vendor transaction
 */
export async function deleteVendorTransaction(uuid: string): Promise<void> {
  return apiRequest<void>(`/api/vendor-transaction/${uuid}`, {
    method: 'DELETE',
  });
}

/**
 * Bulk create vendor transactions (e.g. submitting a full market day at once)
 */
export async function bulkCreateVendorTransactions(
  requests: CreateVendorTransactionRequest[]
): Promise<VendorTransaction[]> {
  const response = await apiRequest<VendorTransaction[]>('/api/vendor-transaction/batch', {
    method: 'POST',
    body: JSON.stringify(requests.map(stripCalculatedFields)),
  });

  return response.map(hydrateVendorTransaction);
}
