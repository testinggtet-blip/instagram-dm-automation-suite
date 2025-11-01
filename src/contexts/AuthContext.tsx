"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: number;
  facebook_id: string;
  email?: string;
  name?: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = apiClient.getToken();
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await apiClient.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      apiClient.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string) => {
    apiClient.setToken(token);
    await fetchUser();
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    apiClient.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
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
