"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { login as loginApi, refreshToken } from '@/lib/api';
import type { LoginRequest, JwtResponse } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  user: { username: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const hasVerifiedSession = useRef(false);

  // Extract username from JWT token (simple base64 decode)
  const getUsernameFromToken = useCallback((token: string): string | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.username || null;
    } catch {
      return null;
    }
  }, []);

  // Check if token is expired
  const isTokenExpired = useCallback((token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp) {
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        return Date.now() >= expirationTime;
      }
      return false;
    } catch {
      return true;
    }
  }, []);

  // Check session on mount and route changes
  const verifySession = useCallback(async () => {
    if (typeof window === 'undefined') {
      return { isAuthenticated: false, user: null };
    }

    const accessToken = localStorage.getItem('accessToken');
    const refreshTokenValue = localStorage.getItem('refreshToken');

    if (!accessToken) {
      return { isAuthenticated: false, user: null };
    }

    // Check if access token is expired
    if (isTokenExpired(accessToken)) {
      // Try to refresh the token
      if (refreshTokenValue) {
        try {
          const response = await refreshToken(refreshTokenValue);
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          
          const username = getUsernameFromToken(response.accessToken);
          return { 
            isAuthenticated: true, 
            user: username ? { username } : null 
          };
        } catch {
          // Refresh failed, clear tokens and logout
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          return { isAuthenticated: false, user: null };
        }
      } else {
        // No refresh token, clear and logout
        localStorage.removeItem('accessToken');
        return { isAuthenticated: false, user: null };
      }
    }

    // Token is valid
    const username = getUsernameFromToken(accessToken);
    return { 
      isAuthenticated: true, 
      user: username ? { username } : null 
    };
  }, [getUsernameFromToken, isTokenExpired]);

  // Verify session on mount
  useEffect(() => {
    if (hasVerifiedSession.current) return;
    hasVerifiedSession.current = true;

    verifySession().then(({ isAuthenticated, user }) => {
      setIsAuthenticated(isAuthenticated);
      setUser(user);
      setIsLoading(false);
    });
  }, [verifySession]);

  // Re-verify session on route changes (but not on initial mount)
  useEffect(() => {
    if (isLoading || !hasVerifiedSession.current) return;

    verifySession().then(({ isAuthenticated, user }) => {
      setIsAuthenticated(isAuthenticated);
      setUser(user);
    });
  }, [pathname, isLoading, verifySession]);

  const handleLogin = useCallback(async (credentials: LoginRequest) => {
    try {
      const response: JwtResponse = await loginApi(credentials);
      
      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Extract username from token
      const username = getUsernameFromToken(response.accessToken);
      
      setIsAuthenticated(true);
      setUser(username ? { username } : null);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      // Re-throw error so the login page can handle it
      throw error;
    }
  }, [router, getUsernameFromToken]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
