'use client';
import AppShell from '@/components/AppShell';
import AdminsScreen from '@/components/screens/Admins';

export default function Page() {
  return <AppShell title="Admin Management"><AdminsScreen manageBase="/super-admin/admins" /></AppShell>;
}
