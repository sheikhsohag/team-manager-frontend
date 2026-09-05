'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiPost, setToken, getToken } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [allowed, setAllowed] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try {
      const data = await api('/auth/me');
      setUser(data.user);
      setRoles(data.roles || []);
      setAllowed(new Set(data.allowedKeys || []));
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (email, password) => {
    const data = await apiPost('/auth/login', { email, password });
    setToken(data.token);
    await refresh();
    return data.user;
  }, [refresh]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAllowed(new Set());
    router.push('/login');
  }, [router]);

  const can = useCallback((key) => {
    if (!user) return false;
    if (user.is_super_admin) return true;
    return allowed.has(key);
  }, [user, allowed]);

  const value = { user, roles, allowed, loading, login, logout, refresh, can };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
