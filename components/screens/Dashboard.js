'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Loading } from '@/components/ui';

function Stat({ label, value, cls }) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className={`value ${cls || ''}`}>{value}</div>
    </div>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const isSuper = user.is_super_admin;
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    async function run() {
      if (isSuper) {
        const [companies, admins, users, roles, audit] = await Promise.all([
          apiGet('/super-admin/companies').catch(() => ({ companies: [] })),
          apiGet('/admins').catch(() => ({ admins: [] })),
          apiGet('/users').catch(() => ({ users: [] })),
          apiGet('/roles').catch(() => ({ roles: [] })),
          apiGet('/audit-logs?limit=6').catch(() => ({ logs: [] })),
        ]);
        setStats({
          companies: companies.companies.length,
          admins: admins.admins.length,
          users: users.users.length,
          roles: roles.roles.length,
        });
        setRecent(audit.logs || []);
      } else {
        const [me, users] = await Promise.all([
          apiGet('/me/permissions'),
          apiGet('/users').catch(() => ({ users: [] })),
        ]);
        setStats({
          allowed: me.summary.allowed,
          denied: me.summary.denied,
          overrides: me.summary.userOverrides,
          users: users.users.length,
        });
      }
    }
    run();
  }, [isSuper]);

  if (!stats) return <Loading />;

  return (
    <div>
      <div className="mb">
        <h2>Welcome back, {user.name.split(' ')[0]} 👋</h2>
        <p className="muted small">{isSuper ? 'System-wide overview across all companies.' : 'Your company overview.'}</p>
      </div>

      <div className="grid grid-4 mb">
        {isSuper ? (
          <>
            <Stat label="Companies" value={stats.companies} />
            <Stat label="Admins" value={stats.admins} cls="amber" />
            <Stat label="Users" value={stats.users} cls="green" />
            <Stat label="Roles" value={stats.roles} />
          </>
        ) : (
          <>
            <Stat label="My allowed permissions" value={stats.allowed} cls="green" />
            <Stat label="My denied" value={stats.denied} cls="red" />
            <Stat label="My overrides" value={stats.overrides} cls="amber" />
            <Stat label="Company users" value={stats.users} />
          </>
        )}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Quick actions</div>
          <div className="grid mt" style={{ gap: 8 }}>
            {isSuper ? (
              <>
                <Link className="btn ghost" href="/super-admin/companies">🏢 Manage companies</Link>
                <Link className="btn ghost" href="/super-admin/admins">🛡️ Admin permissions</Link>
                <Link className="btn ghost" href="/super-admin/roles">🎭 Roles</Link>
                <Link className="btn ghost" href="/super-admin/audit-logs">📜 Audit logs</Link>
              </>
            ) : (
              <>
                <Link className="btn ghost" href="/admin/users">👥 Manage users</Link>
                <Link className="btn ghost" href="/admin/permissions">🔑 Permissions</Link>
                <Link className="btn ghost" href="/my-tasks">✅ My tasks</Link>
                <Link className="btn ghost" href="/my-permissions">🧾 My permissions</Link>
              </>
            )}
          </div>
        </div>

        {isSuper && (
          <div className="card">
            <div className="card-title">Recent activity</div>
            <div className="mt">
              {recent.length ? recent.map((l) => (
                <div className="spread" key={l.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="small"><strong>{l.actor_name}</strong> · {l.action}</div>
                  <div className="small muted">{new Date(l.created_at).toLocaleDateString()}</div>
                </div>
              )) : <div className="muted small">No recent activity.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
