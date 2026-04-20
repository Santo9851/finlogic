'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth';
import { getCookie } from 'cookies-next';
import api from '@/services/api';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const restoreSession = async () => {
      const token = getCookie('access_token');
      if (token) {
        try {
          const res = await api.get('/auth/profile/');
          setUser(res.data);
        } catch {
          authService.logout();
          setUser(null);
        }
      }
      setAuthLoading(false);
    };
    restoreSession();
  }, []);

  const parseError = (error) => {
    const data = error.response?.data;
    if (!data) return error.message || 'An unknown error occurred.';
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      const messages = [];
      for (const [key, value] of Object.entries(data)) {
        if (key === 'status_code') continue;
        const label = key === 'detail' || key === 'non_field_errors' ? '' : `${key}: `;
        if (Array.isArray(value)) messages.push(`${label}${value.join(' ')}`);
        else if (typeof value === 'object') messages.push(`${label}${JSON.stringify(value)}`);
        else messages.push(`${label}${value}`);
      }
      return messages.join('\n') || 'Registration/Login failed.';
    }
    return JSON.stringify(data);
  };

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials);
      const userRes = await api.get('/auth/profile/', {
        headers: { Authorization: `Bearer ${data.access}` },
      });
      setUser(userRes.data);
      return { success: true, user: userRes.data };
    } catch (error) {
      return { success: false, error: parseError(error) };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response.status === 202) {
        return {
          success: true,
          status: 202,
          message: response.data?.detail || 'Your request for an additional role has been submitted for admin approval.',
        };
      }
      return await login({ email: userData.email, password: userData.password });
    } catch (error) {
      return { success: false, error: parseError(error) };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.push('/auth/login');
  };

  // ── Role helpers ────────────────────────────────────────────────────────

  /**
   * Parse the comma-separated roles string (or array) into a clean array.
   * Works whether the backend returns "admin,super_admin" or ["admin","super_admin"].
   */
  const getRoleList = useCallback(() => {
    if (!user?.roles) return [];
    if (Array.isArray(user.roles)) return user.roles.map((r) => r.trim()).filter(Boolean);
    return user.roles.split(',').map((r) => r.trim()).filter(Boolean);
  }, [user]);

  /** Returns true if the current user has the given role. */
  const hasRole = useCallback(
    (role) => getRoleList().includes(role),
    [getRoleList]
  );

  /** Returns true if the current user has ANY of the given roles. */
  const hasAnyRole = useCallback(
    (roles) => roles.some((r) => getRoleList().includes(r)),
    [getRoleList]
  );

  /** Convenience booleans. */
  const isGPStaff = useCallback(
    () => hasAnyRole(['admin', 'super_admin']),
    [hasAnyRole]
  );
  const isLP = useCallback(() => hasRole('investor'), [hasRole]);
  const isGPInvestor = useCallback(() => hasRole('gp_investor'), [hasRole]);
  const isEntrepreneur = useCallback(() => hasRole('entrepreneur'), [hasRole]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        authLoading,
        // Role helpers
        getRoleList,
        hasRole,
        hasAnyRole,
        isGPStaff,
        isLP,
        isGPInvestor,
        isEntrepreneur,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
