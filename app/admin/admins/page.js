'use client';
import AppShell from '@/components/AppShell';
import AdminsScreen from '@/components/screens/Admins';

export default function Page() {
  return <AppShell title="Admins"><AdminsScreen manageBase="/admin/admins" /></AppShell>;
}
