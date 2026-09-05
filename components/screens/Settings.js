'use client';

import { useAuth } from '@/components/AuthProvider';

export default function SettingsScreen() {
  const { user } = useAuth();
  return (
    <div>
      <div className="mb"><h2>System Settings</h2><p className="muted small">Super Admin configuration.</p></div>
      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Signed in as</div>
          <div className="mt small">
            <div className="spread" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}><span className="muted">Name</span><span>{user.name}</span></div>
            <div className="spread" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}><span className="muted">Email</span><span>{user.email}</span></div>
            <div className="spread" style={{ padding: '6px 0' }}><span className="muted">Role</span><span className="badge purple">Super Admin</span></div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Authorization model</div>
          <ul className="muted small mt" style={{ lineHeight: 1.9, paddingLeft: 18 }}>
            <li>Super Admin → always allowed (bypasses all checks)</li>
            <li>System permissions → Super Admin only</li>
            <li>Company boundary → hard ceiling per company</li>
            <li>User override (DENY) → beats role ALLOW</li>
            <li>User override (ALLOW) → adds beyond role</li>
            <li>Role permission → granted by assigned roles</li>
            <li>Default → denied</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
