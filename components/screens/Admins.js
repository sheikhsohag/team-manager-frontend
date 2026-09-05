'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';
import { Loading, StatusBadge, useToast, Modal } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';

/**
 * Admin Management table (sections 10 & 23).
 * `manageBase` = route prefix; the "Manage Permissions" action links to
 * `${manageBase}/${id}`.
 */
export default function AdminsScreen({ manageBase }) {
  const toast = useToast();
  const { can } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pwFor, setPwFor] = useState(null);

  async function load() {
    setLoading(true);
    try { const r = await apiGet('/admins'); setAdmins(r.admins || []); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function setStatus(a, suspend) {
    await apiPost(`/users/${a.id}/${suspend ? 'suspend' : 'activate'}`, {});
    toast(suspend ? 'Admin suspended' : 'Admin activated', 'ok'); load();
  }

  if (loading) return <Loading />;

  return (
    <div>
      <div className="spread wrap mb">
        <div>
          <h2>Admins</h2>
          <p className="muted small">Same role can mean different power — permissions are per-user.</p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tbl">
          <thead><tr>
            <th>Admin</th><th>Company</th><th>Role</th><th>Permissions</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
          </tr></thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>
                  <div style={{ fontWeight: 650 }}>{a.name}</div>
                  <div className="small muted">{a.email}</div>
                </td>
                <td>{a.company || '—'}</td>
                <td><span className="badge grey">{a.role || '—'}</span></td>
                <td>
                  <div className="row" style={{ gap: 6 }}>
                    <span className="badge green">{a.permissions.allowed} allowed</span>
                    <span className="badge red">{a.permissions.denied} denied</span>
                  </div>
                  <div className="small muted" style={{ marginTop: 3 }}>
                    {a.permissions.overrides} overrides · {a.permissions.companyRestrictions} company limits
                  </div>
                </td>
                <td><StatusBadge status={a.status} /></td>
                <td>
                  <div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Link className="btn sm primary" href={`${manageBase}/${a.id}`}>Manage Permissions</Link>
                    {can('user.reset_password') && <button className="btn sm ghost" onClick={() => setPwFor(a)}>Reset Password</button>}
                    {can('user.suspend') && (a.status === 'active'
                      ? <button className="btn sm ghost" onClick={() => setStatus(a, true)}>Suspend</button>
                      : <button className="btn sm ghost" onClick={() => setStatus(a, false)}>Activate</button>)}
                  </div>
                </td>
              </tr>
            ))}
            {!admins.length && <tr><td colSpan={6} className="empty">No admins found.</td></tr>}
          </tbody>
        </table>
      </div>

      {pwFor && <ResetPassword user={pwFor} onClose={() => setPwFor(null)} onDone={() => { setPwFor(null); toast('Password reset', 'ok'); }} />}
    </div>
  );
}

export function ResetPassword({ user, onClose, onDone }) {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    try { await apiPost(`/users/${user.id}/reset-password`, { newPassword: pw }); onDone(); }
    catch (e) { alert(e.message); setBusy(false); }
  }
  return (
    <Modal title={`Reset Password — ${user.name}`} onClose={onClose}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={submit} disabled={busy || pw.length < 8}>Reset</button></>}>
      <label className="field"><span>New password (min 8 chars)</span>
        <input className="input" type="text" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus /></label>
    </Modal>
  );
}
