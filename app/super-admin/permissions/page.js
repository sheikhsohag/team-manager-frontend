'use client';
import AppShell from '@/components/AppShell';
import PermissionsHub from '@/components/screens/PermissionsHub';

export default function Page() {
  return <AppShell title="Permissions"><PermissionsHub manageBase="/super-admin/users" /></AppShell>;
}
