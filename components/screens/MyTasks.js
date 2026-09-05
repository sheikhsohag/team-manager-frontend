'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Loading, useToast } from '@/components/ui';

const STATUS = { todo: ['grey', 'To do'], in_progress: ['amber', 'In progress'], done: ['green', 'Done'], reopened: ['red', 'Reopened'] };

export default function MyTasksScreen() {
  const toast = useToast();
  const { can } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  async function load() { setLoading(true); try { const r = await apiGet('/tasks'); setTasks(r.tasks || []); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!title.trim()) return;
    try { await apiPost('/tasks', { title }); setTitle(''); toast('Task created', 'ok'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }
  async function cycle(t) {
    const order = ['todo', 'in_progress', 'done'];
    const next = order[(order.indexOf(t.status) + 1) % order.length];
    try { await apiPost(`/tasks/${t.id}/status`, { status: next }); load(); }
    catch (e) { toast(e.message, 'err'); }
  }
  async function del(t) {
    try { await apiDelete(`/tasks/${t.id}`); toast('Task deleted', 'ok'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb"><h2>My Tasks</h2><p className="muted small">Actions here are gated by the backend — try them as different users.</p></div>

      {can('task.create') && (
        <div className="card mb">
          <div className="row">
            <input className="input" placeholder="New task title…" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} />
            <button className="btn primary" onClick={create}>Add</button>
          </div>
        </div>
      )}

      <div className="grid" style={{ gap: 8 }}>
        {tasks.map((t) => {
          const [cls, label] = STATUS[t.status] || ['grey', t.status];
          return (
            <div className="card" key={t.id} style={{ padding: 14 }}>
              <div className="spread wrap">
                <div>
                  <div style={{ fontWeight: 650 }}>{t.title}</div>
                  <div className="small muted">{t.assignee_name ? `Assigned to ${t.assignee_name}` : 'Unassigned'} · {t.priority}</div>
                </div>
                <div className="row">
                  <button className={`badge ${cls}`} style={{ cursor: can('task.change_status') ? 'pointer' : 'default' }}
                    onClick={() => can('task.change_status') && cycle(t)} title="Click to advance status">{label}</button>
                  {can('task.delete') && <button className="btn sm danger" onClick={() => del(t)}>Delete</button>}
                </div>
              </div>
            </div>
          );
        })}
        {!tasks.length && <div className="empty">No tasks yet.</div>}
      </div>
    </div>
  );
}
