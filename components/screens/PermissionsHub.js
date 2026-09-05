'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { Loading, Modal, useToast, Toggle } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';

export default function PermissionsHub({ manageBase }) {
  const [tab, setTab] = useState('manage');
  return (
    <div>
      <div className="spread wrap mb">
        <div>
          <h2>Permissions</h2>
          <p className="muted small">Browse the permission catalog, manage templates, and configure any user.</p>
        </div>
        <div className="pill-tabs">
          <button className={tab === 'manage' ? 'active' : ''} onClick={() => setTab('manage')}>Manage Users</button>
          <button className={tab === 'catalog' ? 'active' : ''} onClick={() => setTab('catalog')}>Catalog</button>
          <button className={tab === 'templates' ? 'active' : ''} onClick={() => setTab('templates')}>Templates</button>
        </div>
      </div>
      {tab === 'manage' && <ManageList manageBase={manageBase} />}
      {tab === 'catalog' && <Catalog />}
      {tab === 'templates' && <Templates />}
    </div>
  );
}

function ManageList({ manageBase }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  useEffect(() => { apiGet('/users').then((r) => setUsers(r.users || [])).finally(() => setLoading(false)); }, []);
  if (loading) return <Loading />;
  const shown = users.filter((u) => (u.name + u.email).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="searchbox mb" style={{ maxWidth: 320 }}><span className="si">⌕</span>
        <input className="input" placeholder="Find a user…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>User</th><th>Roles</th><th>Company</th><th style={{ textAlign: 'right' }}></th></tr></thead>
          <tbody>
            {shown.map((u) => (
              <tr key={u.id}>
                <td><div style={{ fontWeight: 650 }}>{u.name}</div><div className="small muted">{u.email}</div></td>
                <td><span className="badge grey">{u.roles || 'No role'}</span></td>
                <td>{u.company_name || '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  {!u.is_super_admin && <Link className="btn sm primary" href={`${manageBase}/${u.id}`}>Manage Permissions</Link>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Catalog() {
  const [groups, setGroups] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => { apiGet('/permissions').then((r) => setGroups(r.groups)); }, []);
  const shown = useMemo(() => {
    if (!groups) return null;
    if (!q) return groups;
    return groups.map((g) => ({ ...g, permissions: g.permissions.filter((p) => (p.key + p.label).toLowerCase().includes(q.toLowerCase())) })).filter((g) => g.permissions.length);
  }, [groups, q]);
  if (!groups) return <Loading />;
  const total = groups.reduce((n, g) => n + g.permissions.length, 0);
  return (
    <div>
      <div className="spread mb">
        <span className="badge grey">{total} permissions in {groups.length} modules</span>
        <div className="searchbox" style={{ width: 260 }}><span className="si">⌕</span>
          <input className="input" placeholder='e.g. "delete"' value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      {shown.map((g) => (
        <div className="group-block" key={g.key}>
          <div className="group-head"><strong>{g.label}</strong><span className="badge grey">{g.permissions.length}</span></div>
          {g.permissions.map((p) => (
            <div className="perm-row" key={p.key}>
              <div><div style={{ fontWeight: 600 }}>{p.label}{p.isSystem ? <span className="badge amber" style={{ marginLeft: 6 }}>system</span> : ''}</div><div className="pk">{p.key}</div></div>
              <span className="badge grey">{p.action}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Templates() {
  const toast = useToast();
  const { can } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  async function load() { setLoading(true); try { const r = await apiGet('/permission-templates'); setTemplates(r.templates || []); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function del(t) { if (!confirm(`Delete template "${t.name}"?`)) return; try { await apiDelete(`/permission-templates/${t.id}`); toast('Deleted', 'ok'); load(); } catch (e) { toast(e.message, 'err'); } }
  if (loading) return <Loading />;
  return (
    <div>
      <div className="spread mb">
        <span className="muted small">Reusable permission sets you can apply to any user.</span>
        {can('admin.permissions') && <button className="btn primary" onClick={() => setCreateOpen(true)}>+ New Template</button>}
      </div>
      <div className="grid grid-3">
        {templates.map((t) => (
          <div className="card" key={t.id}>
            <div className="spread">
              <h3>{t.name}</h3>
              <span className={`badge ${t.is_system ? 'grey' : 'purple'}`}>{t.is_system ? 'System' : 'Custom'}</span>
            </div>
            <p className="muted small" style={{ marginTop: 4 }}>{t.description || '—'}</p>
            <div className="spread mt">
              <span className="badge green">{t.permission_count} perms</span>
              {!t.is_system && can('admin.permissions') && <button className="btn sm danger" onClick={() => del(t)}>Delete</button>}
            </div>
          </div>
        ))}
      </div>
      {createOpen && <CreateTemplate onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); load(); toast('Template created', 'ok'); }} />}
    </div>
  );
}

function CreateTemplate({ onClose, onDone }) {
  const [groups, setGroups] = useState(null);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  useEffect(() => { apiGet('/permissions').then((r) => setGroups(r.groups)); }, []);
  function toggle(k) { setSelected((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; }); }
  async function submit() { setBusy(true); try { await apiPost('/permission-templates', { name, permissions: [...selected] }); onDone(); } catch (e) { alert(e.message); setBusy(false); } }
  return (
    <Modal title="New Template" onClose={onClose}
      footer={<><span className="muted small grow">{selected.size} selected</span>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={submit} disabled={busy || !name}>Create</button></>}>
      <label className="field"><span>Name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></label>
      {!groups ? <Loading /> : groups.filter((g) => g.key !== 'system').map((g) => (
        <div className="group-block" key={g.key}>
          <div className="group-head"><strong>{g.label}</strong></div>
          {g.permissions.map((p) => (
            <div className="perm-row" key={p.key}>
              <div className="pk">{p.key}</div>
              <Toggle on={selected.has(p.key)} onClick={() => toggle(p.key)} />
            </div>
          ))}
        </div>
      ))}
    </Modal>
  );
}
