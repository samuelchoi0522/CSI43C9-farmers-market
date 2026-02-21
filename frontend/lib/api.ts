const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

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

