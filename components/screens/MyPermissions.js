'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Loading } from '@/components/ui';

/** Read-only "what can I actually do" view for the logged-in user (section 14). */
export default function MyPermissionsScreen() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [showDenied, setShowDenied] = useState(false);

  useEffect(() => { apiGet('/me/permissions').then(setData); }, []);
  if (!data) return <Loading />;

  return (
    <div>
      <div className="spread wrap mb">
        <div>
          <h2>My Permissions</h2>
          <p className="muted small">Your effective permissions after roles, overrides and company policy.</p>
        </div>
        <label className="row small muted" style={{ gap: 6 }}>
          <input type="checkbox" checked={showDenied} onChange={(e) => setShowDenied(e.target.checked)} /> Show denied
        </label>
      </div>

      <div className="grid grid-4 mb">
        <div className="card stat"><div className="label">Allowed</div><div className="value green">{data.summary.allowed}</div></div>
        <div className="card stat"><div className="label">Denied</div><div className="value red">{data.summary.denied}</div></div>
        <div className="card stat"><div className="label">From roles</div><div className="value">{data.summary.rolePermissions}</div></div>
        <div className="card stat"><div className="label">Overrides</div><div className="value amber">{data.summary.userOverrides}</div></div>
      </div>

      {data.groups.map((g) => {
        const perms = g.permissions.filter((p) => showDenied || p.allowed);
        if (!perms.length) return null;
        return (
          <div className="group-block" key={g.key}>
            <div className="group-head"><strong>{g.label}</strong></div>
            {perms.map((p) => (
              <div className="perm-row" key={p.key}>
                <div className="row" style={{ gap: 10 }}>
                  <span className={`badge ${p.allowed ? 'green' : 'red'}`}>{p.allowed ? '✓' : '✕'}</span>
                  <div><div style={{ fontWeight: 600 }}>{p.label}</div><div className="pk">{p.key}</div></div>
                </div>
                <span className="source-tag">{p.source}{p.sourceDetail ? ` → ${p.sourceDetail}` : ''}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
