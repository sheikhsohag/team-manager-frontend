'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';
import { Loading, StatusBadge, useToast, Modal } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { ResetPassword } from './Admins';

export default function UsersScreen({ manageBase, companyId }) {
  const toast = useToast();
  const { can, user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [pwFor, setPwFor] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const q = companyId ? `?companyId=${companyId}` : '';
      const r = await apiGet(`/users${q}`);
      setUsers(r.users || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); apiGet('/roles').then((r) => setRoles(r.roles || [])).catch(() => {}); }, [companyId]);

  function toggleSel(id) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  if (loading) return <Loading />;

  return (
    <div>
      <div className="spread wrap mb">
        <div>
          <h2>Users</h2>
          <p className="muted small">{users.length} users{companyId ? ' in this company' : ''}.</p>
        </div>
        <div className="row">
          {selected.size > 0 && can('admin.permissions') && (
            <button className="btn" onClick={() => setBulkOpen(true)}>Bulk actions ({selected.size})</button>
          )}
          {can('user.create') && <button className="btn primary" onClick={() => setCreateOpen(true)}>+ New User</button>}
        </div>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr>
            <th></th><th>User</th><th>Roles</th><th>Status</th><th>Last login</th><th style={{ textAlign: 'right' }}>Actions</th>
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSel(u.id)} /></td>
                <td>
                  <div style={{ fontWeight: 650 }}>{u.name}{u.is_super_admin ? <span className="badge purple" style={{ marginLeft: 6 }}>Super</span> : ''}</div>
                  <div className="small muted">{u.email}{u.company_name ? ` · ${u.company_name}` : ''}</div>
                </td>
                <td><span className="badge grey">{u.roles || 'No role'}</span></td>
                <td><StatusBadge status={u.status} /></td>
                <td className="small muted">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'never'}</td>
                <td>
                  <div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {can('admin.permissions') && !u.is_super_admin && <Link className="btn sm primary" href={`${manageBase}/${u.id}`}>Permissions</Link>}
                    {can('user.reset_password') && <button className="btn sm ghost" onClick={() => setPwFor(u)}>Reset PW</button>}
                  </div>
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={6} className="empty">No users.</td></tr>}
          </tbody>
        </table>
      </div>

      {createOpen && <CreateUser roles={roles} companyId={companyId} onClose={() => setCreateOpen(false)}
        onDone={() => { setCreateOpen(false); load(); toast('User created', 'ok'); }} />}
      {pwFor && <ResetPassword user={pwFor} onClose={() => setPwFor(null)} onDone={() => { setPwFor(null); toast('Password reset', 'ok'); }} />}
      {bulkOpen && <BulkModal userIds={[...selected]} roles={roles} onClose={() => setBulkOpen(false)}
        onDone={() => { setBulkOpen(false); setSelected(new Set()); load(); toast('Bulk action applied', 'ok'); }} />}
    </div>
  );
}

function CreateUser({ roles, companyId, onClose, onDone }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', roleIds: [] });
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    try { await apiPost('/users', { ...form, companyId }); onDone(); }
    catch (e) { alert(e.message); setBusy(false); }
  }
  return (
    <Modal title="New User" onClose={onClose}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={submit} disabled={busy || !form.name || !form.email || form.password.length < 8}>Create</button></>}>
      <label className="field"><span>Name</span><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label className="field"><span>Email</span><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label className="field"><span>Password (min 8)</span><input className="input" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
      <label className="field"><span>Role</span>
        <select className="select" value={form.roleIds[0] || ''} onChange={(e) => setForm({ ...form, roleIds: e.target.value ? [Number(e.target.value)] : [] })}>
          <option value="">No role</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </label>
    </Modal>
  );
}

/* Bulk permission management (section 17) */
function BulkModal({ userIds, roles, onClose, onDone }) {
  const [action, setAction] = useState('assign_role');
  const [roleId, setRoleId] = useState(roles[0]?.id || '');
  const [key, setKey] = useState('');
  const [perms, setPerms] = useState([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { apiGet('/permissions').then((r) => setPerms(r.groups.flatMap((g) => g.permissions))).catch(() => {}); }, []);

  async function run() {
    setBusy(true);
    try {
      const body = { userIds, action };
      if (action === 'assign_role') body.roleId = roleId; else body.key = key;
      await apiPost('/permissions/bulk', body); onDone();
    } catch (e) { alert(e.message); setBusy(false); }
  }
  return (
    <Modal title={`Bulk actions — ${userIds.length} users`} onClose={onClose}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={run} disabled={busy}>Apply</button></>}>
      <label className="field"><span>Action</span>
        <select className="select" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="assign_role">Assign role</option>
          <option value="add_permission">Add permission (ALLOW)</option>
          <option value="remove_permission">Remove permission (DENY)</option>
        </select>
      </label>
      {action === 'assign_role' ? (
        <label className="field"><span>Role</span>
          <select className="select" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
      ) : (
        <label className="field"><span>Permission</span>
          <select className="select" value={key} onChange={(e) => setKey(e.target.value)}>
            <option value="">Select…</option>
            {perms.map((p) => <option key={p.key} value={p.key}>{p.label} ({p.key})</option>)}
          </select>
        </label>
      )}
    </Modal>
  );
}
