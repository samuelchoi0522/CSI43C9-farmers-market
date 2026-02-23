import { apiRequest, JwtResponse } from './client';

export interface LoginRequest {
  username: string;
  password: string;
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

