'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { Loading, Modal, useToast, Toggle } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';

export default function RolesScreen() {
  const toast = useToast();
  const { can } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const canManage = can('system.roles') || can('admin.permissions');

  async function load() {
    setLoading(true);
    try { const r = await apiGet('/roles'); setRoles(r.roles || []); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function del(r) {
    if (!confirm(`Delete role "${r.name}"?`)) return;
    try { await apiDelete(`/roles/${r.id}`); toast('Role deleted', 'ok'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <div className="spread wrap mb">
        <div>
          <h2>Roles</h2>
          <p className="muted small">Roles are named permission bundles. They are not the only source of authority.</p>
        </div>
        {canManage && <button className="btn primary" onClick={() => setCreateOpen(true)}>+ New Role</button>}
      </div>

      <div className="grid grid-2">
        {roles.map((r) => (
          <div className="card" key={r.id}>
            <div className="spread">
              <div>
                <div className="row" style={{ gap: 8 }}>
                  <h3>{r.name}</h3>
                  <span className={`badge ${r.is_system ? 'grey' : 'purple'}`}>{r.is_system ? 'System' : 'Custom'}</span>
                  <span className="badge grey">{r.level}</span>
                </div>
                <p className="muted small" style={{ marginTop: 4 }}>{r.description || '—'}</p>
              </div>
            </div>
            <div className="row mt" style={{ gap: 8 }}>
              <span className="badge green">{r.permission_count} permissions</span>
              <span className="badge grey">{r.user_count} users</span>
            </div>
            {canManage && (
              <div className="row mt" style={{ justifyContent: 'flex-end' }}>
                <button className="btn sm" onClick={() => setEditing(r)}>Edit permissions</button>
                {!r.is_system && <button className="btn sm danger" onClick={() => del(r)}>Delete</button>}
              </div>
            )}
          </div>
        ))}
      </div>

      {editing && <RoleEditor role={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); toast('Role updated', 'ok'); }} />}
      {createOpen && <CreateRole onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); load(); toast('Role created', 'ok'); }} />}
    </div>
  );
}

function RoleEditor({ role, onClose, onSaved }) {
  const [groups, setGroups] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([apiGet('/permissions'), apiGet(`/roles/${role.id}`)]).then(([cat, r]) => {
      setGroups(cat.groups);
      setSelected(new Set(r.permissions));
    });
  }, [role.id]);

  function toggle(key) {
    setSelected((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }
  function setGroup(g, on) {
    setSelected((prev) => { const n = new Set(prev); g.permissions.forEach((p) => on ? n.add(p.key) : n.delete(p.key)); return n; });
  }
  async function save() {
    setBusy(true);
    try { await apiPut(`/roles/${role.id}/permissions`, { permissions: [...selected] }); onSaved(); }
    catch (e) { alert(e.message); setBusy(false); }
  }

  const shown = groups && (search
    ? groups.map((g) => ({ ...g, permissions: g.permissions.filter((p) => (p.key + p.label).toLowerCase().includes(search.toLowerCase())) })).filter((g) => g.permissions.length)
    : groups);

  return (
    <Modal title={`Edit — ${role.name}`} onClose={onClose}
      footer={<><span className="muted small grow">{selected.size} selected</span>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={save} disabled={busy}>Save</button></>}>
      <div className="searchbox mb"><span className="si">⌕</span>
        <input className="input" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      {!groups ? <Loading /> : shown.map((g) => {
        const all = g.permissions.every((p) => selected.has(p.key));
        return (
          <div className="group-block" key={g.key}>
            <div className="group-head">
              <strong>{g.label}</strong>
              <button className="btn sm ghost" onClick={() => setGroup(g, !all)}>{all ? 'Clear' : 'Select all'}</button>
            </div>
            {g.permissions.map((p) => (
              <div className="perm-row" key={p.key}>
                <div><div style={{ fontWeight: 600 }}>{p.label}{p.isSystem ? <span className="badge amber" style={{ marginLeft: 6 }}>system</span> : ''}</div><div className="pk">{p.key}</div></div>
                <Toggle on={selected.has(p.key)} onClick={() => toggle(p.key)} />
              </div>
            ))}
          </div>
        );
      })}
    </Modal>
  );
}

function CreateRole({ onClose, onDone }) {
  const [form, setForm] = useState({ name: '', level: 'company', description: '' });
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    try { await apiPost('/roles', form); onDone(); }
    catch (e) { alert(e.message); setBusy(false); }
  }
  return (
    <Modal title="New Custom Role" onClose={onClose}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={submit} disabled={busy || !form.name}>Create</button></>}>
      <label className="field"><span>Name</span><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></label>
      <label className="field"><span>Level</span>
        <select className="select" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
          <option value="company">Company</option><option value="team">Team</option>
        </select>
      </label>
      <label className="field"><span>Description</span><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <p className="muted small">You can assign permissions after creating the role.</p>
    </Modal>
  );
}
