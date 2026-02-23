// Use production URL when running `yarn start` (production mode)
// Use localhost when running `yarn dev` (development mode)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://wacofarmersmarket.xyz' 
    : 'http://localhost:8080');

export interface LoginRequest {
  username: string;
  password: string;
}

export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
  type?: string; // Optional - login returns "type", refresh returns "tokenType"
  tokenType?: string; // Optional - refresh endpoint returns this instead of "type"
}

export interface ApiError {
  message: string;
  status?: number;
}

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let refreshPromise: Promise<JwtResponse | null> | null = null;

/**
 * Refreshes the access token using the refresh token
 * This is a direct fetch call to avoid circular dependencies with apiRequest
 */
async function refreshAccessToken(): Promise<JwtResponse | null> {
  // If already refreshing, wait for the existing refresh to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshTokenValue = typeof window !== 'undefined' 
        ? localStorage.getItem('refreshToken') 
        : null;

      if (!refreshTokenValue) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!response.ok) {
        // Refresh failed, clear tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        return null;
      }

      const data: JwtResponse = await response.json();
      
      // Store new tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      return data;
    } catch {
      // Refresh failed, clear tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Makes an API request with authentication headers
 * Automatically refreshes token on 401 errors and retries the request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('accessToken') 
    : null;

  const headers = new Headers();
  
  // Copy existing headers if provided
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers.set(key, value);
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers.set(key, value);
      });
    } else {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }
  }

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    // Network error or CORS issue
    const error: ApiError = {
      message: `Network error: Unable to connect to ${API_BASE_URL}. Please check if the server is running and CORS is configured.`,
      status: 0,
    };
    throw error;
  }

  // If we get a 401 and haven't already retried, try to refresh the token
  if (response.status === 401 && !isRetry && endpoint !== '/api/auth/refresh') {
    const refreshed = await refreshAccessToken();
    
    if (refreshed) {
      // Retry the original request with the new token
      return apiRequest<T>(endpoint, options, true);
    } else {
      // Refresh failed, throw error
      const error: ApiError = {
        message: 'Session expired. Please log in again.',
        status: 401,
      };
      throw error;
    }
  }

  if (!response.ok) {
    const error: ApiError = {
      message: `API request failed: ${response.statusText}`,
      status: response.status,
    };

    try {
      const errorData = await response.json();
      error.message = errorData.message || error.message;
    } catch {
      // If response is not JSON, use default error message
    }

    throw error;
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return {} as T;
}

/**
 * Login API call
 */
export async function login(credentials: LoginRequest): Promise<JwtResponse> {
  return apiRequest<JwtResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

/**
 * Refresh token API call
 * Note: This uses apiRequest, but apiRequest will not auto-refresh for this endpoint
 * to avoid circular calls. For automatic refresh, use the internal refreshAccessToken function.
 */
export async function refreshToken(refreshToken: string): Promise<JwtResponse> {
  return apiRequest<JwtResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

/**
 * Check if the current session is valid by making an authenticated request
 * Validates the token by making a lightweight request to a protected endpoint
 */
export async function checkSession(): Promise<boolean> {
  try {
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('accessToken') 
      : null;
    
    if (!token) {
      return false;
    }

    // Validate token by making a lightweight request to a protected endpoint
    // Using GET /api/vendor with minimal page size to validate without fetching much data
    await apiRequest<unknown>('/api/vendor?page=0&size=1', {
      method: 'GET',
    });

    return true;
  } catch {
    // If the request fails (401, 403, network error, etc.), session is invalid
    return false;
  }
}

/**
 * Generic authenticated API request
 */
export async function authenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return apiRequest<T>(endpoint, options);
}

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
  uuid: string;
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
  return apiRequest<Vendor>('/api/vendor', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

