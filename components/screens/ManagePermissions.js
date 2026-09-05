'use client';

import Link from 'next/link';
import PermissionManager from '@/components/PermissionManager';
import { useAuth } from '@/components/AuthProvider';

export default function ManagePermissionsScreen({ userId, backHref, backLabel = 'Back' }) {
  const { can } = useAuth();
  return (
    <>
      <div className="mb">
        <Link className="btn ghost sm" href={backHref}>← {backLabel}</Link>
      </div>
      <PermissionManager userId={userId} canEdit={can('admin.permissions')} />
    </>
  );
}
