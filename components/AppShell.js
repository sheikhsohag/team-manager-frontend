'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { ToastProvider } from '@/components/ui';

function NavItem({ href, icon, label, active }) {
  return (
    <Link href={href} className={`nav-item ${active ? 'active' : ''}`}>
      <span className="ico">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default function AppShell({ title, children }) {
  const { user, roles, loading, logout, can } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) return <div className="center-screen"><span className="spinner" /></div>;
  if (!user) return null;

  const isSuper = user.is_super_admin;

  // Build nav sections based on identity + permissions
  const sections = [];
  if (isSuper) {
    sections.push({
      label: 'System',
      items: [
        { href: '/super-admin/dashboard', icon: '◫', label: 'Dashboard' },
        { href: '/super-admin/companies', icon: '🏢', label: 'Companies' },
        { href: '/super-admin/admins', icon: '🛡️', label: 'Admins' },
        { href: '/super-admin/users', icon: '👥', label: 'Users' },
        { href: '/super-admin/roles', icon: '🎭', label: 'Roles' },
        { href: '/super-admin/permissions', icon: '🔑', label: 'Permissions' },
        { href: '/super-admin/audit-logs', icon: '📜', label: 'Audit Logs' },
        { href: '/super-admin/settings', icon: '⚙️', label: 'Settings' },
      ],
    });
  } else {
    const items = [{ href: '/admin/dashboard', icon: '◫', label: 'Dashboard' }];
    if (can('user.view')) items.push({ href: '/admin/users', icon: '👥', label: 'Users' });
    if (can('admin.view')) items.push({ href: '/admin/admins', icon: '🛡️', label: 'Admins' });
    if (can('team.view')) items.push({ href: '/admin/teams', icon: '👨‍👩‍👧', label: 'Teams' });
    items.push({ href: '/admin/roles', icon: '🎭', label: 'Roles' });
    if (can('admin.permissions')) items.push({ href: '/admin/permissions', icon: '🔑', label: 'Permissions' });
    if (can('company.permissions')) items.push({ href: '/admin/company-permissions', icon: '🧭', label: 'Company Policy' });
    if (can('report.view')) items.push({ href: '/admin/reports', icon: '📊', label: 'Reports' });
    if (can('audit.view')) items.push({ href: '/admin/audit-logs', icon: '📜', label: 'Audit Logs' });
    sections.push({ label: 'Company', items });

    const meItems = [
      { href: '/my-tasks', icon: '✅', label: 'My Tasks' },
      { href: '/my-team', icon: '👥', label: 'My Team' },
      { href: '/my-permissions', icon: '🧾', label: 'My Permissions' },
    ];
    if (can('report.view')) meItems.push({ href: '/my-reports', icon: '📊', label: 'My Reports' });
    sections.push({ label: 'Me', items: meItems });
  }

  const roleLabel = isSuper ? 'Super Admin' : (roles.map((r) => r.name).join(', ') || 'User');

  return (
    <ToastProvider>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-badge">TM</div>
            <div>
              <div className="brand-name">TaskManager</div>
              <div className="brand-sub">Permission Suite</div>
            </div>
          </div>
          {sections.map((sec) => (
            <div key={sec.label}>
              <div className="nav-group-label">{sec.label}</div>
              {sec.items.map((it) => (
                <NavItem key={it.href} {...it} active={pathname === it.href || pathname.startsWith(it.href + '/')} />
              ))}
            </div>
          ))}
        </aside>

        <div className="main">
          <div className="topbar">
            <h1>{title}</h1>
            <div className="row">
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 650 }}>{user.name}</div>
                <div className="small muted">{roleLabel}</div>
              </div>
              <div className="brand-badge" title={user.email}>
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <button className="btn sm ghost" onClick={logout}>Logout</button>
            </div>
          </div>
          <div className="content">{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}
