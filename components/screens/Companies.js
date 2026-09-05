'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { Modal, Loading, StatusBadge, useToast, Toggle } from '@/components/ui';

export default function CompaniesScreen() {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [boundaryFor, setBoundaryFor] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const r = await apiGet(`/super-admin/companies?includeDeleted=${includeDeleted}`);
      setCompanies(r.companies || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [includeDeleted]);

  async function toggleActive(c) {
    await apiPost(`/super-admin/companies/${c.id}/activate`, { active: c.status !== 'active' });
    toast(`Company ${c.status !== 'active' ? 'activated' : 'deactivated'}`, 'ok');
    load();
  }
  async function del(c) {
    if (!confirm(`Delete "${c.name}"? It can be restored later.`)) return;
    await apiDelete(`/super-admin/companies/${c.id}`); toast('Company deleted', 'ok'); load();
  }
  async function restore(c) {
    await apiPost(`/super-admin/companies/${c.id}/restore`, {}); toast('Company restored', 'ok'); load();
  }
  async function toggleSelfManage(c) {
    await apiPut(`/super-admin/companies/${c.id}`, { selfManagePermissions: !c.self_manage_permissions });
    load();
  }

  if (loading) return <Loading />;

  return (
    <div>
      <div className="spread wrap mb">
        <div>
          <h2>Companies</h2>
          <p className="muted small">Create, update, activate and configure permission boundaries.</p>
        </div>
        <div className="row">
          <label className="row small muted" style={{ gap: 6 }}>
            <input type="checkbox" checked={includeDeleted} onChange={(e) => setIncludeDeleted(e.target.checked)} />
            Show deleted
          </label>
          <button className="btn primary" onClick={() => setCreateOpen(true)}>+ New Company</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr>
            <th>Company</th><th>Users</th><th>Teams</th><th>Status</th><th>Self-manage</th><th style={{ textAlign: 'right' }}>Actions</th>
          </tr></thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} style={c.deleted_at ? { opacity: .55 } : undefined}>
                <td>
                  <div style={{ fontWeight: 650 }}>{c.name}</div>
                  <div className="pk small muted">{c.slug}{c.deleted_at ? ' • deleted' : ''}</div>
                </td>
                <td>{c.user_count}</td>
                <td>{c.team_count}</td>
                <td><StatusBadge status={c.status} /></td>
                <td><Toggle on={!!c.self_manage_permissions} onClick={() => toggleSelfManage(c)} title="Allow company admin to configure its own boundary" /></td>
                <td>
                  <div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button className="btn sm ghost" onClick={() => setBoundaryFor(c)}>Boundary</button>
                    {!c.deleted_at && <button className="btn sm ghost" onClick={() => toggleActive(c)}>{c.status === 'active' ? 'Deactivate' : 'Activate'}</button>}
                    {c.deleted_at
                      ? <button className="btn sm" onClick={() => restore(c)}>Restore</button>
                      : <button className="btn sm danger" onClick={() => del(c)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
            {!companies.length && <tr><td colSpan={6} className="empty">No companies yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {createOpen && <CreateCompany onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); load(); toast('Company created', 'ok'); }} />}
      {boundaryFor && <BoundaryModal company={boundaryFor} onClose={() => setBoundaryFor(null)} onSaved={() => { setBoundaryFor(null); toast('Boundary updated', 'ok'); }} />}
    </div>
  );
}

function CreateCompany({ onClose, onDone }) {
  const [name, setName] = useState('');
  const [self, setSelf] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    try { await apiPost('/super-admin/companies', { name, selfManagePermissions: self }); onDone(); }
    catch (e) { alert(e.message); setBusy(false); }
  }
  return (
    <Modal title="New Company" onClose={onClose}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={submit} disabled={busy || !name}>Create</button></>}>
      <label className="field"><span>Company name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></label>
      <label className="row small" style={{ gap: 8 }}>
        <input type="checkbox" checked={self} onChange={(e) => setSelf(e.target.checked)} />
        Allow this company to self-manage its permission boundary
      </label>
    </Modal>
  );
}

/* Company boundary (section 9 / 19): disable permissions company-wide. */
function BoundaryModal({ company, onClose, onSaved }) {
  const [groups, setGroups] = useState(null);
  const [disabled, setDisabled] = useState(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiGet(`/super-admin/companies/${company.id}/permissions`).then((r) => {
      setGroups(r.groups);
      const s = new Set();
      r.groups.forEach((g) => g.permissions.forEach((p) => { if (p.disabled) s.add(p.key); }));
      setDisabled(s);
    });
  }, [company.id]);

  function toggle(key) {
    setDisabled((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }
  async function save() {
    setBusy(true);
    try { await apiPut(`/super-admin/companies/${company.id}/permissions`, { disabledKeys: [...disabled] }); onSaved(); }
    catch (e) { alert(e.message); setBusy(false); }
  }

  return (
    <Modal title={`Permission Boundary — ${company.name}`} onClose={onClose}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={save} disabled={busy}>Save Boundary</button></>}>
      <p className="muted small mb">Disabled permissions are blocked for <strong>everyone</strong> in this company, including its admins (Super Admin excepted). This is the ceiling that prevents privilege escalation.</p>
      {!groups ? <Loading /> : groups.map((g) => (
        <div className="group-block" key={g.key}>
          <div className="group-head"><strong>{g.label}</strong></div>
          {g.permissions.map((p) => (
            <div className="perm-row" key={p.key}>
              <div><div style={{ fontWeight: 600 }}>{p.label}</div><div className="pk">{p.key}</div></div>
              <div className="row" style={{ gap: 8 }}>
                <span className={`badge ${disabled.has(p.key) ? 'red' : 'green'}`}>{disabled.has(p.key) ? 'Disabled' : 'Enabled'}</span>
                <Toggle on={!disabled.has(p.key)} deny={disabled.has(p.key)} onClick={() => toggle(p.key)} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </Modal>
  );
}
