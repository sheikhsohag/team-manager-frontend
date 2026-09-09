'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Loading, Modal, useToast } from '@/components/ui';

const COLORS = ['grey', 'blue', 'amber', 'green', 'red', 'purple'];

export default function StatusesScreen() {
  const { can } = useAuth();
  const toast = useToast();
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // status obj or {} for new
  const canManage = can('task.status_manage');

  async function load() {
    setLoading(true);
    try { const r = await apiGet('/statuses'); setStatuses(r.statuses || []); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function del(s) {
    if (!confirm(`Delete status "${s.name}"? Tasks using it will show no status.`)) return;
    try { await apiDelete(`/statuses/${s.id}`); toast('Deleted', 'ok'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb">
        <h2>Task Statuses</h2>
        <p className="muted small">Dynamic, company-wide statuses. Team leads &amp; admins can add statuses and set a note (description). Requires <span className="kbd">task.status_manage</span>.</p>
      </div>

      {canManage && <button className="btn primary mb" onClick={() => setEditing({})}>+ New Status</button>}

      <div className="grid" style={{ gap: 8 }}>
        {statuses.map((s) => (
          <div className="card" key={s.id} style={{ padding: 14 }}>
            <div className="spread wrap" style={{ gap: 8 }}>
              <div className="row" style={{ gap: 10 }}>
                <span className={`badge ${s.color}`}>{s.name}</span>
                {s.is_default ? <span className="badge grey">default</span> : null}
                {s.is_done ? <span className="badge green">done bucket</span> : null}
                <span className="small muted">{s.note}</span>
              </div>
              {canManage && (
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn sm" onClick={() => setEditing(s)}>Edit</button>
                  <button className="btn sm danger" onClick={() => del(s)}>Delete</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {!statuses.length && <div className="empty">No statuses yet.</div>}
      </div>

      {editing && <StatusModal status={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function StatusModal({ status, onClose, onSaved }) {
  const toast = useToast();
  const isNew = !status.id;
  const [f, setF] = useState({
    name: status.name || '', note: status.note || '', color: status.color || 'grey',
    sortOrder: status.sort_order ?? 100, isDefault: !!status.is_default, isDone: !!status.is_done,
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!f.name.trim()) { toast('Name is required', 'err'); return; }
    setBusy(true);
    try {
      if (isNew) await apiPost('/statuses', f);
      else await apiPut(`/statuses/${status.id}`, f);
      toast('Saved', 'ok'); onSaved();
    } catch (e) { toast(e.message, 'err'); }
    finally { setBusy(false); }
  }

  return (
    <Modal title={isNew ? 'New Status' : `Edit — ${status.name}`} onClose={onClose}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save} disabled={busy}>Save</button></>}>
      <label className="field"><span>Name</span><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></label>
      <label className="field"><span>Note / description</span><input className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="What this status means" /></label>
      <div className="grid grid-2">
        <label className="field"><span>Color</span>
          <select className="select" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })}>
            {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="field"><span>Sort order</span><input className="input" type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: Number(e.target.value) })} /></label>
      </div>
      <label className="row" style={{ gap: 8, marginBottom: 8 }}>
        <input type="checkbox" checked={f.isDefault} onChange={(e) => setF({ ...f, isDefault: e.target.checked })} />
        <span className="small">Default status for new tasks</span>
      </label>
      <label className="row" style={{ gap: 8 }}>
        <input type="checkbox" checked={f.isDone} onChange={(e) => setF({ ...f, isDone: e.target.checked })} />
        <span className="small">Counts as &quot;done&quot; (terminal)</span>
      </label>
      <div className="row mt">
        <span className={`badge ${f.color}`}>{f.name || 'Preview'}</span>
      </div>
    </Modal>
  );
}
