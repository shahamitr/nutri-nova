'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, totpCode: string) => Promise<void>;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/login');
  }, [router]);

  const refreshToken = useCallback(async (currentToken: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data?.session_token) {
        const newToken = data.data.session_token;
        setToken(newToken);
        localStorage.setItem('auth_token', newToken);
        return newToken;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Wrapper around fetch that auto-attaches the auth token
   * and retries once with a refreshed token on 401.
   */
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const currentToken = token ?? localStorage.getItem('auth_token');
      const headers = new Headers(options.headers);
      if (currentToken) {
        headers.set('Authorization', `Bearer ${currentToken}`);
      }
      // Don't set Content-Type for FormData — browser sets multipart boundary automatically
      if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      let res = await fetch(url, { ...options, headers });

      if (res.status === 401 && currentToken) {
        const newToken = await refreshToken(currentToken);
        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`);
          res = await fetch(url, { ...options, headers });
        } else {
          logout();
        }
      }

      return res;
    },
    [token, refreshToken, logout]
  );

  const login = async (email: string, password: string, totpCode: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, totp_code: totpCode }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Login failed');
    }

    setToken(data.data.session_token);
    setUser(data.data.user);

    localStorage.setItem('auth_token', data.data.session_token);
    localStorage.setItem('user', JSON.stringify(data.data.user));

    router.push('/dashboard');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        authFetch,
        isAuthenticated: !!user && !!token,
        isLoading,
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
