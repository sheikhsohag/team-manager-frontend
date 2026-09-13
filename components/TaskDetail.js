'use client';

import { useEffect, useState, useRef } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, apiUpload, apiDownload } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Modal, Loading, useToast } from '@/components/ui';

export function StatusPill({ status, color, onClick, clickable }) {
  return (
    <span
      className={`badge ${color || 'grey'}`}
      style={{ cursor: clickable ? 'pointer' : 'default' }}
      onClick={clickable ? onClick : undefined}
      title={clickable ? 'Click to change status' : undefined}
    >
      {status || 'No status'}
    </span>
  );
}

// Maps a status badge-class (grey/blue/amber/green/red/purple) to a real colour
// for the little dot shown beside the dropdown.
const STATUS_DOT = {
  green: 'var(--green)', red: 'var(--red)', amber: 'var(--amber)',
  purple: 'var(--purple)', blue: '#60a5fa', grey: 'var(--muted-2)',
};

/**
 * Status shown as a dropdown you can pick from directly. Falls back to a
 * read-only pill when the user can't change status (or there are no statuses).
 */
export function StatusSelect({ statusId, statusName, statuses = [], color, disabled, onChange }) {
  if (disabled || !statuses.length) return <StatusPill status={statusName} color={color} />;
  return (
    <span className="status-select" onClick={(e) => e.stopPropagation()}>
      <span className="status-dot" style={{ background: STATUS_DOT[color] || 'var(--muted-2)' }} />
      <select
        className="select status-select-input"
        value={statusId ? String(statusId) : ''}
        onChange={(e) => onChange(e.target.value)}
        title="Change status"
      >
        {!statusId && <option value="">No status</option>}
        {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </span>
  );
}

function fmtBytes(n) {
  if (!n) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB']; let i = 0; let v = Number(n);
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i += 1; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}
function fmtDate(s) { return s ? new Date(s).toLocaleString() : ''; }

export default function TaskDetail({ taskId, statuses = [], members = [], onClose, onChanged }) {
  const { can } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [comment, setComment] = useState('');
  const [subTitle, setSubTitle] = useState('');
  const [shareId, setShareId] = useState('');

  async function load() {
    setLoading(true);
    try {
      const r = await apiGet(`/tasks/${taskId}`);
      setData(r);
      setForm({
        title: r.task.title || '', heading: r.task.heading || '', description: r.task.description || '',
        priority: r.task.priority || 'medium', assigneeId: r.task.assignee_id || '',
        dueDate: r.task.due_date ? r.task.due_date.slice(0, 10) : '', statusId: r.task.status_id || '',
      });
    } catch (e) { toast(e.message, 'err'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [taskId]);

  const statusById = (id) => statuses.find((s) => String(s.id) === String(id));

  async function saveEdits() {
    try {
      await apiPut(`/tasks/${taskId}`, {
        title: form.title, heading: form.heading, description: form.description,
        priority: form.priority, assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null, statusId: form.statusId || null,
      });
      toast('Saved', 'ok'); setEdit(false); load(); onChanged?.();
    } catch (e) { toast(e.message, 'err'); }
  }
  async function setStatus(statusId) {
    try { await apiPost(`/tasks/${taskId}/status`, { statusId }); load(); onChanged?.(); }
    catch (e) { toast(e.message, 'err'); }
  }
  async function addComment() {
    if (!comment.trim()) return;
    try { await apiPost(`/tasks/${taskId}/comments`, { body: comment }); setComment(''); load(); }
    catch (e) { toast(e.message, 'err'); }
  }
  async function addSubtask() {
    if (!subTitle.trim()) return;
    try { await apiPost('/tasks', { title: subTitle, parentId: taskId }); setSubTitle(''); toast('Subtask added', 'ok'); load(); onChanged?.(); }
    catch (e) { toast(e.message, 'err'); }
  }
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { await apiUpload(`/tasks/${taskId}/attachments`, file); toast('Uploaded', 'ok'); load(); }
    catch (err) { toast(err.message, 'err'); }
    finally { if (fileRef.current) fileRef.current.value = ''; }
  }
  async function removeAttachment(id) {
    try { await apiDelete(`/attachments/${id}`); load(); } catch (e) { toast(e.message, 'err'); }
  }
  async function share() {
    if (!shareId) return;
    try { await apiPost(`/tasks/${taskId}/share`, { userId: Number(shareId) }); setShareId(''); toast('Shared', 'ok'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }
  async function unshare(uid) {
    try { await apiDelete(`/tasks/${taskId}/share/${uid}`); load(); } catch (e) { toast(e.message, 'err'); }
  }

  if (loading || !data) {
    return <Modal title="Task" onClose={onClose}><Loading /></Modal>;
  }
  const t = data.task;
  const canEdit = can('task.update');

  return (
    <Modal title={t.parent_id ? 'Subtask' : 'Task'} onClose={onClose}>
      <div className="grid" style={{ gap: 14 }}>
        {/* Header / status */}
        <div className="spread wrap" style={{ gap: 8 }}>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <StatusSelect statusId={t.status_id} statusName={t.status_name} statuses={statuses}
              color={t.status_color} disabled={!can('task.change_status')}
              onChange={(id) => setStatus(id)} />
            <span className={`badge ${t.priority === 'urgent' || t.priority === 'high' ? 'red' : t.priority === 'low' ? 'grey' : 'amber'}`}>{t.priority}</span>
            {t.team_name && <span className="badge grey">👥 {t.team_name}</span>}
            {t.due_date && <span className="badge grey">📅 {String(t.due_date).slice(0, 10)}</span>}
          </div>
          {canEdit && <button className="btn sm ghost" onClick={() => setEdit((v) => !v)}>{edit ? 'Cancel' : 'Edit'}</button>}
        </div>

        {!edit ? (
          <div>
            <h3 style={{ marginBottom: 2 }}>{t.title}</h3>
            {t.heading && <div className="muted" style={{ marginBottom: 8 }}>{t.heading}</div>}
            <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{t.description || <span className="muted">No description.</span>}</div>
            <div className="small muted mt">
              {t.assignee_name ? `Assigned to ${t.assignee_name}` : 'Unassigned'} · created by {t.creator_name || '—'} · {fmtDate(t.created_at)}
            </div>
          </div>
        ) : (
          <div className="card" style={{ background: 'var(--bg-soft)' }}>
            <label className="field"><span>Title</span><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label className="field"><span>Heading</span><input className="input" value={form.heading} onChange={(e) => setForm({ ...form, heading: e.target.value })} /></label>
            <label className="field"><span>Description</span><textarea className="input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <div className="grid grid-2">
              <label className="field"><span>Status</span>
                <select className="select" value={form.statusId} onChange={(e) => setForm({ ...form, statusId: e.target.value })}>
                  {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Priority</span>
                <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {['low', 'medium', 'high', 'urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <label className="field"><span>Assignee</span>
                <select className="select" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Due date</span><input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
            </div>
            <button className="btn primary sm" onClick={saveEdits}>Save changes</button>
          </div>
        )}

        {/* Subtasks (only for main tasks) */}
        {!t.parent_id && (
          <div>
            <div className="spread"><strong className="small">Subtasks ({data.subtasks.length})</strong></div>
            <div className="grid" style={{ gap: 6, marginTop: 6 }}>
              {data.subtasks.map((s) => (
                <div key={s.id} className="perm-row">
                  <div className="row" style={{ gap: 8 }}>
                    <StatusPill status={s.status_name} color={s.status_color} />
                    <span>{s.title}</span>
                  </div>
                  <span className="small muted">{s.assignee_name || 'Unassigned'}</span>
                </div>
              ))}
              {!data.subtasks.length && <div className="muted small">No subtasks.</div>}
            </div>
            {can('task.create') && (
              <div className="row mt">
                <input className="input" placeholder="New subtask title…" value={subTitle} onChange={(e) => setSubTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubtask()} />
                <button className="btn sm" onClick={addSubtask}>Add</button>
              </div>
            )}
          </div>
        )}

        {/* Attachments */}
        <div>
          <strong className="small">Files ({data.attachments.length})</strong>
          <div className="grid" style={{ gap: 6, marginTop: 6 }}>
            {data.attachments.map((a) => (
              <div key={a.id} className="perm-row">
                <button className="btn ghost sm" onClick={() => apiDownload(`/attachments/${a.id}/download`, a.original_name)}>⬇ {a.original_name}</button>
                <div className="row" style={{ gap: 8 }}>
                  <span className="small muted">{fmtBytes(a.size_bytes)}</span>
                  {can('task.attach_file') && <button className="btn sm danger" onClick={() => removeAttachment(a.id)}>✕</button>}
                </div>
              </div>
            ))}
            {!data.attachments.length && <div className="muted small">No files.</div>}
          </div>
          {can('task.attach_file') && (
            <div className="mt">
              <input ref={fileRef} type="file" onChange={upload} style={{ fontSize: 12 }} />
            </div>
          )}
        </div>

        {/* Comments */}
        <div>
          <strong className="small">Comments ({data.comments.length})</strong>
          <div className="grid" style={{ gap: 6, marginTop: 6 }}>
            {data.comments.map((c) => (
              <div key={c.id} className="card" style={{ padding: 10, background: 'var(--bg-soft)' }}>
                <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{c.body}</div>
                <div className="small muted mt">{c.user_name || '—'} · {fmtDate(c.created_at)}</div>
              </div>
            ))}
            {!data.comments.length && <div className="muted small">No comments yet.</div>}
          </div>
          {can('task.comment') && (
            <div className="row mt">
              <input className="input" placeholder="Write a comment…" value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} />
              <button className="btn sm primary" onClick={addComment}>Send</button>
            </div>
          )}
        </div>

        {/* Sharing */}
        {can('task.share') && (
          <div>
            <strong className="small">Shared with ({data.shares.length})</strong>
            <div className="grid" style={{ gap: 6, marginTop: 6 }}>
              {data.shares.map((s) => (
                <div key={s.user_id} className="perm-row">
                  <span className="small">{s.name} <span className="muted">{s.email}</span></span>
                  <button className="btn sm danger" onClick={() => unshare(s.user_id)}>Remove</button>
                </div>
              ))}
            </div>
            <div className="row mt">
              <select className="select" value={shareId} onChange={(e) => setShareId(e.target.value)}>
                <option value="">Share with user…</option>
                {members.filter((m) => !data.shares.some((s) => s.user_id === m.id)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <button className="btn sm" onClick={share} disabled={!shareId}>Share</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
