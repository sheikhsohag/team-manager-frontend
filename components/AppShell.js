'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { ToastProvider } from '@/components/ui';
import StickyNotes from '@/components/StickyNotes';
import ThemeToggle from '@/components/ThemeToggle';

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
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) return <div className="center-screen"><span className="spinner" /></div>;
  if (!user) return null;

  const isSuper = user.is_super_admin;
  const isIndividual = !isSuper && user.company_type === 'individual';

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
    if (can('task.view_all')) items.push({ href: '/admin/tasks', icon: '✅', label: 'All Tasks' });
    if (can('task.status_manage')) items.push({ href: '/admin/statuses', icon: '🏷️', label: 'Statuses' });
    if (can('user.view')) items.push({ href: '/admin/roles', icon: '🎭', label: 'Roles' });
    if (can('admin.permissions')) items.push({ href: '/admin/permissions', icon: '🔑', label: 'Permissions' });
    if (can('company.permissions')) items.push({ href: '/admin/company-permissions', icon: '🧭', label: 'Company Policy' });
    if (can('report.view')) items.push({ href: '/admin/reports', icon: '📊', label: 'Reports' });
    if (can('audit.view')) items.push({ href: '/admin/audit-logs', icon: '📜', label: 'Audit Logs' });
    // Solo/individual workspaces have no company-management capabilities.
    const isSolo = !can('user.view') && !can('team.view');
    sections.push({ label: isSolo ? 'Workspace' : 'Company', items });

    const meItems = [
      { href: '/my-tasks', icon: '✅', label: 'My Tasks' },
    ];
    if (can('team.view')) meItems.push({ href: '/my-team', icon: '👥', label: 'My Team' });
    meItems.push({ href: '/my-permissions', icon: '🧾', label: 'My Permissions' });
    if (can('report.view')) meItems.push({ href: '/my-reports', icon: '📊', label: 'My Reports' });
    sections.push({ label: 'Me', items: meItems });
  }

  const roleLabel = isSuper
    ? 'Super Admin'
    : isIndividual
      ? 'Individual'
      : (roles.map((r) => r.name).join(', ') || 'User');

  return (
    <ToastProvider>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-badge">O</div>
            <div>
              <div className="brand-name">Orbit</div>
              <div className="brand-sub">Company &amp; Team Management</div>
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

          <div>
            <div className="nav-group-label">Tools</div>
            <button type="button" className="nav-item" onClick={() => setNotesOpen(true)}>
              <span className="ico">🗒️</span>
              <span>Sticky Notes</span>
            </button>
          </div>
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
              <ThemeToggle />
              <button className="btn sm ghost" onClick={logout}>Logout</button>
            </div>
          </div>
          <div className="content">{children}</div>
        </div>
      </div>
      <StickyNotes open={notesOpen} onClose={() => setNotesOpen(false)} userId={user.id} />
    </ToastProvider>
  );
}
