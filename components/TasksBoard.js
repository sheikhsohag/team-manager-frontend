'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Loading, useToast } from '@/components/ui';
import TaskDetail, { StatusPill } from '@/components/TaskDetail';

const EMPTY_FILTERS = { q: '', statusId: '', assigneeId: '', from: '', to: '' };

export default function TasksBoard({ scope = 'mine' }) {
  const { can } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [openId, setOpenId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams({ scope, top: '1' });
    for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v);
    return p.toString();
  }, [scope, filters]);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await apiGet(`/tasks?${buildQuery()}`); setTasks(r.tasks || []); }
    catch (e) { toast(e.message, 'err'); }
    finally { setLoading(false); }
  }, [buildQuery, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    apiGet('/statuses').then((r) => setStatuses(r.statuses || [])).catch(() => {});
    apiGet('/company/users').then((r) => setMembers(r.users || [])).catch(() => setMembers([]));
    apiGet('/teams').then((r) => setTeams(r.teams || [])).catch(() => setTeams([]));
  }, []);

  async function cycleStatus(t) {
    if (!can('task.change_status') || !statuses.length) return;
    const idx = statuses.findIndex((s) => String(s.id) === String(t.status_id));
    const next = statuses[(idx + 1) % statuses.length];
    try { await apiPost(`/tasks/${t.id}/status`, { statusId: next.id }); load(); }
    catch (e) { toast(e.message, 'err'); }
  }
  async function del(t) {
    if (!confirm(`Delete "${t.title}" and its subtasks?`)) return;
    try { await apiDelete(`/tasks/${t.id}`); toast('Deleted', 'ok'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div>
      {/* Create */}
      {can('task.create') && (
        <div className="mb">
          {!showCreate ? (
            <button className="btn primary" onClick={() => setShowCreate(true)}>+ New Task</button>
          ) : (
            <CreateTask statuses={statuses} members={members} teams={teams}
              onDone={() => { setShowCreate(false); load(); }} onCancel={() => setShowCreate(false)} />
          )}
        </div>
      )}

      {/* Filters */}
      <div className="card mb">
        <div className="row wrap" style={{ gap: 8, alignItems: 'flex-end' }}>
          <label className="field" style={{ margin: 0, flex: '1 1 180px' }}>
            <span>Search</span>
            <input className="input" placeholder="Title or heading…" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          </label>
          <label className="field" style={{ margin: 0 }}>
            <span>Status</span>
            <select className="select" value={filters.statusId} onChange={(e) => setFilters({ ...filters, statusId: e.target.value })}>
              <option value="">All</option>
              {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="field" style={{ margin: 0 }}>
            <span>{scope === 'all' ? 'Member' : 'Person'}</span>
            <select className="select" value={filters.assigneeId} onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}>
              <option value="">All</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label className="field" style={{ margin: 0 }}>
            <span>From</span>
            <input className="input" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </label>
          <label className="field" style={{ margin: 0 }}>
            <span>To</span>
            <input className="input" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </label>
          {activeFilterCount > 0 && <button className="btn sm ghost" onClick={() => setFilters(EMPTY_FILTERS)}>Clear ({activeFilterCount})</button>}
        </div>
      </div>

      {/* List */}
      {loading ? <Loading /> : (
        <div className="grid" style={{ gap: 8 }}>
          {tasks.map((t) => (
            <div className="card" key={t.id} style={{ padding: 14, cursor: 'pointer' }} onClick={() => setOpenId(t.id)}>
              <div className="spread wrap" style={{ gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 650 }}>{t.title}</div>
                  {t.heading && <div className="small muted">{t.heading}</div>}
                  <div className="small muted mt">
                    {t.assignee_name ? `👤 ${t.assignee_name}` : 'Unassigned'}
                    {t.team_name ? ` · 👥 ${t.team_name}` : ''}
                    {Number(t.subtask_count) > 0 ? ` · ⛓ ${t.subtask_count}` : ''}
                    {Number(t.comment_count) > 0 ? ` · 💬 ${t.comment_count}` : ''}
                    {Number(t.attachment_count) > 0 ? ` · 📎 ${t.attachment_count}` : ''}
                    {t.due_date ? ` · 📅 ${String(t.due_date).slice(0, 10)}` : ''}
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }} onClick={(e) => e.stopPropagation()}>
                  <span className={`badge ${t.priority === 'urgent' || t.priority === 'high' ? 'red' : t.priority === 'low' ? 'grey' : 'amber'}`}>{t.priority}</span>
                  <StatusPill status={t.status_name} color={t.status_color} clickable={can('task.change_status')} onClick={() => cycleStatus(t)} />
                  {can('task.delete') && <button className="btn sm danger" onClick={() => del(t)}>Delete</button>}
                </div>
              </div>
            </div>
          ))}
          {!tasks.length && <div className="empty">No tasks match{activeFilterCount ? ' your filters' : ''}.</div>}
        </div>
      )}

      {openId && (
        <TaskDetail taskId={openId} statuses={statuses} members={members}
          onClose={() => setOpenId(null)} onChanged={load} />
      )}
    </div>
  );
}

function CreateTask({ statuses, members, teams, onDone, onCancel }) {
  const toast = useToast();
  const [f, setF] = useState({ title: '', heading: '', description: '', statusId: '', priority: 'medium', assigneeId: '', teamId: '', dueDate: '' });
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!f.title.trim()) { toast('Title is required', 'err'); return; }
    setBusy(true);
    try {
      await apiPost('/tasks', {
        title: f.title, heading: f.heading || null, description: f.description || null,
        statusId: f.statusId || null, priority: f.priority,
        assigneeId: f.assigneeId || null, teamId: f.teamId || null, dueDate: f.dueDate || null,
      });
      toast('Task created', 'ok'); onDone();
    } catch (e) { toast(e.message, 'err'); }
    finally { setBusy(false); }
  }

  return (
    <div className="card">
      <div className="spread mb"><strong>New Task</strong><button className="btn sm ghost" onClick={onCancel}>✕</button></div>
      <label className="field"><span>Title *</span><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} autoFocus /></label>
      <label className="field"><span>Heading</span><input className="input" value={f.heading} onChange={(e) => setF({ ...f, heading: e.target.value })} placeholder="Short summary line" /></label>
      <label className="field"><span>Description</span><textarea className="input" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
      <div className="grid grid-2">
        <label className="field"><span>Status</span>
          <select className="select" value={f.statusId} onChange={(e) => setF({ ...f, statusId: e.target.value })}>
            <option value="">Default</option>
            {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="field"><span>Priority</span>
          <select className="select" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>
            {['low', 'medium', 'high', 'urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="field"><span>Assignee</span>
          <select className="select" value={f.assigneeId} onChange={(e) => setF({ ...f, assigneeId: e.target.value })}>
            <option value="">Unassigned</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label className="field"><span>Team</span>
          <select className="select" value={f.teamId} onChange={(e) => setF({ ...f, teamId: e.target.value })}>
            <option value="">None</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="field"><span>Due date</span><input className="input" type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></label>
      </div>
      <button className="btn primary" onClick={submit} disabled={busy}>{busy ? <span className="spinner" /> : 'Create task'}</button>
    </div>
  );
}
