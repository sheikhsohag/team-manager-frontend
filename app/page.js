'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (user.is_super_admin) router.replace('/super-admin/dashboard');
    else router.replace('/dashboard');
  }, [user, loading, router]);
  return <div className="center-screen"><span className="spinner" /></div>;
}
