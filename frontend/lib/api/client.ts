// Use production URL when running `yarn start` (production mode)
// Use localhost when running `yarn dev` (development mode)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://wacofarmersmarket.xyz' 
    : 'http://localhost:8080');

export interface ApiError {
  message: string;
  status?: number;
}

export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
  type?: string; // Optional - login returns "type", refresh returns "tokenType"
  tokenType?: string; // Optional - refresh endpoint returns this instead of "type"
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
export async function apiRequest<T>(
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
 * Generic authenticated API request
 */
export async function authenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return apiRequest<T>(endpoint, options);
}



