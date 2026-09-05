'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { Loading, Modal, useToast } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';

export default function TeamsScreen({ readOnly = false }) {
  const toast = useToast();
  const { can } = useAuth();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [manage, setManage] = useState(null);

  async function load() {
    setLoading(true);
    try { const r = await apiGet('/teams'); setTeams(r.teams || []); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); apiGet('/users').then((r) => setUsers(r.users || [])).catch(() => {}); }, []);

  async function create() {
    if (!name.trim()) return;
    try { await apiPost('/teams', { name }); setName(''); toast('Team created', 'ok'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }
  async function del(t) {
    if (!confirm(`Delete team "${t.name}"?`)) return;
    try { await apiDelete(`/teams/${t.id}`); toast('Team deleted', 'ok'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb"><h2>Teams</h2><p className="muted small">Team management is gated by <span className="kbd">team.*</span> permissions.</p></div>

      {!readOnly && can('team.create') && (
        <div className="card mb"><div className="row">
          <input className="input" placeholder="New team name…" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} />
          <button className="btn primary" onClick={create}>Add Team</button>
        </div></div>
      )}

      <div className="grid grid-2">
        {teams.map((t) => (
          <div className="card" key={t.id}>
            <div className="spread">
              <div><h3>{t.name}</h3><div className="small muted mt">{t.member_count} members</div></div>
              <div className="row">
                {can('team.add_member') && <button className="btn sm" onClick={() => setManage(t)}>Members</button>}
                {!readOnly && can('team.delete') && <button className="btn sm danger" onClick={() => del(t)}>Delete</button>}
              </div>
            </div>
          </div>
        ))}
        {!teams.length && <div className="empty">No teams yet.</div>}
      </div>

      {manage && <MembersModal team={manage} users={users} onClose={() => setManage(null)} />}
    </div>
  );
}

function MembersModal({ team, users, onClose }) {
  const { can } = useAuth();
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() { setLoading(true); try { const r = await apiGet(`/teams/${team.id}/members`); setMembers(r.members || []); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [team.id]);

  async function add() {
    try { await apiPost(`/teams/${team.id}/members`, { userId }); toast('Member added', 'ok'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }
  async function remove(uid) {
    try { await apiDelete(`/teams/${team.id}/members/${uid}`); toast('Member removed', 'ok'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }
  const memberIds = new Set(members.map((m) => m.id));
  const candidates = users.filter((u) => !memberIds.has(u.id) && !u.is_super_admin);

  return (
    <Modal title={`Members — ${team.name}`} onClose={onClose}>
      {can('team.add_member') && (
        <div className="row mb">
          <select className="select" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Select user…</option>
            {candidates.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
          </select>
          <button className="btn primary" onClick={add} disabled={!userId}>Add</button>
        </div>
      )}
      {loading ? <Loading /> : members.map((m) => (
        <div className="perm-row" key={m.id}>
          <div><div style={{ fontWeight: 600 }}>{m.name}</div><div className="small muted">{m.email}</div></div>
          {can('team.remove_member') && <button className="btn sm danger" onClick={() => remove(m.id)}>Remove</button>}
        </div>
      ))}
      {!loading && !members.length && <div className="empty">No members.</div>}
    </Modal>
  );
}
