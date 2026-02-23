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
  type: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

/**
 * Makes an API request with authentication headers
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
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
  } catch (fetchError) {
    // Network error or CORS issue
    const error: ApiError = {
      message: `Network error: Unable to connect to ${API_BASE_URL}. Please check if the server is running and CORS is configured.`,
      status: 0,
    };
    throw error;
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
 */
export async function refreshToken(refreshToken: string): Promise<JwtResponse> {
  return apiRequest<JwtResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

/**
 * Check if the current session is valid by making an authenticated request
 * This can be any protected endpoint - we'll use a simple check
 */
export async function checkSession(): Promise<boolean> {
  try {
    // Try to make a request that requires authentication
    // If the backend has a /api/auth/me or similar endpoint, use that
    // Otherwise, we can validate the token exists and is not expired
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('accessToken') 
      : null;
    
    if (!token) {
      return false;
    }

    // For now, we'll just check if token exists
    // In a real app, you might want to decode and check expiration
    // or make a request to a protected endpoint
    return true;
  } catch (error) {
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

