'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiPost } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [allowed, setAllowed] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    // The auth token lives in an httpOnly cookie the browser sends automatically.
    // JS can't read it, so we just ask the server who we are; a 401 means "logged out".
    try {
      const data = await api('/auth/me');
      setUser(data.user);
      setRoles(data.roles || []);
      setAllowed(new Set(data.allowedKeys || []));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (email, password) => {
    // Server sets the httpOnly auth cookie on success; nothing to store here.
    const data = await apiPost('/auth/login', { email, password });
    await refresh();
    return data.user;
  }, [refresh]);

  const register = useCallback(async (payload) => {
    const data = await apiPost('/auth/register', payload);
    await refresh();
    return data.user;
  }, [refresh]);

  const logout = useCallback(async () => {
    // Ask the server to clear the httpOnly cookie — JS can't remove it itself.
    try { await apiPost('/auth/logout', {}); } catch {}
    setUser(null);
    setAllowed(new Set());
    router.push('/login');
  }, [router]);

  const can = useCallback((key) => {
    if (!user) return false;
    if (user.is_super_admin) return true;
    return allowed.has(key);
  }, [user, allowed]);

  const value = { user, roles, allowed, loading, login, register, logout, refresh, can };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
