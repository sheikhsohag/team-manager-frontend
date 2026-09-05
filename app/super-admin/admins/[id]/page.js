'use client';
import AppShell from '@/components/AppShell';
import ManagePermissionsScreen from '@/components/screens/ManagePermissions';

export default function Page({ params }) {
  return (
    <AppShell title="Manage Permissions">
      <ManagePermissionsScreen userId={params.id} backHref="/super-admin/admins" backLabel="Admins" />
    </AppShell>
  );
}
