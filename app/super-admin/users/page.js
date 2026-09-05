'use client';
import AppShell from '@/components/AppShell';
import UsersScreen from '@/components/screens/Users';

export default function Page() {
  return <AppShell title="Users"><UsersScreen manageBase="/super-admin/users" /></AppShell>;
}
