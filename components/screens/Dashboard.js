'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Loading } from '@/components/ui';

const TEAM_ROLE_LABEL = { lead: 'Lead', assistant_lead: 'Assistant Lead', member: 'Member' };
const TEAM_ROLE_BADGE = { lead: 'green', assistant_lead: 'blue', member: 'grey' };

function Stat({ label, value, cls }) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className={`value ${cls || ''}`}>{value}</div>
    </div>
  );
}

export default function DashboardScreen() {
  const { user, can } = useAuth();
  const isSuper = user.is_super_admin;
  // A solo/individual workspace has no company or teams to show.
  const isIndividual = user.company_type === 'individual';
  // "Company" capabilities distinguish a company admin from a solo/individual user.
  const hasCompany = can('user.view') || can('team.view');
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [myTeams, setMyTeams] = useState([]);

  // Company members (not solo individuals) see their company + team memberships.
  useEffect(() => {
    if (isSuper || isIndividual) return;
    apiGet('/me/teams').then((r) => setMyTeams(r.teams || [])).catch(() => setMyTeams([]));
  }, [isSuper, isIndividual]);

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
        // Individuals can't hit /users — fall back to their own task count.
        const [me, extra] = await Promise.all([
          apiGet('/me/permissions'),
          hasCompany
            ? apiGet('/users').catch(() => ({ users: [] }))
            : apiGet('/tasks?scope=mine&top=1').catch(() => ({ tasks: [] })),
        ]);
        setStats({
          allowed: me.summary.allowed,
          denied: me.summary.denied,
          overrides: me.summary.userOverrides,
          fourthLabel: hasCompany ? 'Company users' : 'My tasks',
          fourthValue: hasCompany ? (extra.users?.length || 0) : (extra.tasks?.length || 0),
        });
      }
    }
    run();
  }, [isSuper, hasCompany]);

  if (!stats) return <Loading />;

  // Quick actions for a non-super user, gated by what they can actually do.
  const userActions = [];
  if (hasCompany) userActions.push({ href: '/admin/users', label: '👥 Manage users' });
  if (can('admin.permissions')) userActions.push({ href: '/admin/permissions', label: '🔑 Permissions' });
  userActions.push({ href: '/my-tasks', label: '✅ My tasks' });
  if (can('task.status_manage')) userActions.push({ href: '/admin/statuses', label: '🏷️ Statuses' });
  if (can('report.view')) userActions.push({ href: '/my-reports', label: '📊 My reports' });
  if (can('audit.view')) userActions.push({ href: '/admin/audit-logs', label: '📜 Audit logs' });
  userActions.push({ href: '/my-permissions', label: '🧾 My permissions' });

  return (
    <div>
      <div className="mb">
        <h2>Welcome back, {user.name.split(' ')[0]} 👋</h2>
        <p className="muted small">{isSuper ? 'System-wide overview across all companies.' : (hasCompany ? 'Your company overview.' : 'Your personal workspace overview.')}</p>
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
            <Stat label={stats.fourthLabel} value={stats.fourthValue} />
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
              userActions.map((a) => <Link key={a.href} className="btn ghost" href={a.href}>{a.label}</Link>)
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

        {!isSuper && !isIndividual && (
          <div className="card">
            <div className="card-title">Your workspace</div>
            <div className="mt">
              <div className="spread" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="muted small">Company</span>
                <strong>{user.company_name || '—'}</strong>
              </div>
              <div style={{ paddingTop: 12 }}>
                <div className="muted small mb">Your teams</div>
                {myTeams.length ? (
                  <div className="row wrap" style={{ gap: 6 }}>
                    {myTeams.map((t) => (
                      <span key={t.id} className={`badge ${TEAM_ROLE_BADGE[t.role_in_team] || 'grey'}`}>
                        {t.name} · {TEAM_ROLE_LABEL[t.role_in_team] || t.role_in_team}
                      </span>
                    ))}
                  </div>
                ) : <div className="muted small">You&apos;re not a member of any team yet.</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
