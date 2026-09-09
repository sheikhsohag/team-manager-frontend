'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { Loading, Modal, useToast } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';

const ROLE_LABEL = { lead: 'Lead', assistant_lead: 'Assistant Lead', member: 'Member' };
const ROLE_BADGE = { lead: 'green', assistant_lead: 'blue', member: 'grey' };

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
  useEffect(() => {
    load();
    apiGet('/company/users').then((r) => setUsers(r.users || [])).catch(() => {});
  }, []);

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
      <div className="mb"><h2>Teams</h2><p className="muted small">Seat leads &amp; assistant leads, add members, and grant members task access. Gated by <span className="kbd">team.*</span> permissions.</p></div>

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
              <div>
                <h3>{t.name}</h3>
                <div className="small muted mt">{t.member_count} members{t.lead_name ? ` · Lead: ${t.lead_name}` : ' · No lead'}</div>
              </div>
              <div className="row">
                {can('team.view') && <button className="btn sm" onClick={() => setManage(t)}>Manage</button>}
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
  const [roleInTeam, setRoleInTeam] = useState('member');
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(null);   // member for task-perm grants
  const [share, setShare] = useState(null);      // member for list-share

  const canManageLeads = can('team.manage_leads');
  const canGrant = can('team.grant_member_perms');

  async function load() {
    setLoading(true);
    try { const r = await apiGet(`/teams/${team.id}/members`); setMembers(r.members || []); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [team.id]);

  async function add() {
    try { await apiPost(`/teams/${team.id}/members`, { userId, roleInTeam }); toast('Member added', 'ok'); setUserId(''); load(); }
    catch (e) { toast(e.message, 'err'); }
  }
  async function changeRole(m, role) {
    try { await apiPut(`/teams/${team.id}/members/${m.id}/role`, { roleInTeam: role }); toast('Role updated', 'ok'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }
  async function remove(uid) {
    try { await apiDelete(`/teams/${team.id}/members/${uid}`); toast('Member removed', 'ok'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }

  const memberIds = new Set(members.map((m) => m.id));
  const candidates = users.filter((u) => !memberIds.has(u.id));

  return (
    <Modal title={`Manage — ${team.name}`} onClose={onClose}>
      {can('team.add_member') && (
        <div className="card mb" style={{ background: 'var(--bg-soft)' }}>
          <div className="row wrap" style={{ gap: 8 }}>
            <select className="select" value={userId} onChange={(e) => setUserId(e.target.value)} style={{ flex: '1 1 160px' }}>
              <option value="">Select user…</option>
              {candidates.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
            </select>
            <select className="select" value={roleInTeam} onChange={(e) => setRoleInTeam(e.target.value)} disabled={!canManageLeads}>
              <option value="member">Member</option>
              <option value="assistant_lead">Assistant Lead</option>
              <option value="lead">Lead</option>
            </select>
            <button className="btn primary" onClick={add} disabled={!userId}>Add</button>
          </div>
          {!canManageLeads && <div className="small muted mt">You can add members; only <span className="kbd">team.manage_leads</span> can seat leads.</div>}
        </div>
      )}

      {loading ? <Loading /> : members.map((m) => (
        <div className="perm-row" key={m.id}>
          <div>
            <div style={{ fontWeight: 600 }}>{m.name} <span className={`badge ${ROLE_BADGE[m.role_in_team]}`} style={{ marginLeft: 6 }}>{ROLE_LABEL[m.role_in_team]}</span></div>
            <div className="small muted">{m.email}</div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {canManageLeads && (
              <select className="select" value={m.role_in_team} onChange={(e) => changeRole(m, e.target.value)} style={{ padding: '4px 8px' }}>
                <option value="member">Member</option>
                <option value="assistant_lead">Assistant Lead</option>
                <option value="lead">Lead</option>
              </select>
            )}
            {canGrant && <button className="btn sm" onClick={() => setAccess(m)} title="Grant task permissions">Access</button>}
            {canGrant && <button className="btn sm" onClick={() => setShare(m)} title="Let others see this member's tasks">Share list</button>}
            {can('team.remove_member') && <button className="btn sm danger" onClick={() => remove(m.id)}>Remove</button>}
          </div>
        </div>
      ))}
      {!loading && !members.length && <div className="empty">No members.</div>}

      {access && <AccessModal team={team} member={access} onClose={() => setAccess(null)} />}
      {share && <ListShareModal member={share} users={users} onClose={() => setShare(null)} />}
    </Modal>
  );
}

// Grant/revoke task permissions for a member (lead → member).
function AccessModal({ team, member, onClose }) {
  const toast = useToast();
  const [perms, setPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState({});

  async function load() {
    setLoading(true);
    try { const r = await apiGet(`/teams/${team.id}/members/${member.id}/access`); setPerms(r.permissions || []); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [team.id, member.id]);

  function effectOf(p) { return p.key in dirty ? dirty[p.key] : (p.override || 'inherit'); }
  function set(key, val) { setDirty({ ...dirty, [key]: val }); }

  async function save() {
    try {
      await apiPut(`/teams/${team.id}/members/${member.id}/access`, { grants: dirty });
      toast('Access updated', 'ok'); onClose();
    } catch (e) { toast(e.message, 'err'); }
  }

  return (
    <Modal title={`Access — ${member.name}`} onClose={onClose}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save} disabled={!Object.keys(dirty).length}>Save</button></>}>
      <p className="muted small mb">Grant (allow) or block (deny) task permissions for this member. <b>Allow</b> <span className="kbd">task.create</span> to let them create tasks.</p>
      {loading ? <Loading /> : perms.map((p) => (
        <div className="perm-row" key={p.key}>
          <div>
            <div style={{ fontWeight: 600 }}>{p.label}</div>
            <div className="small muted"><span className="kbd">{p.key}</span> {p.locked ? '· locked by company policy' : ''}</div>
          </div>
          <div className="pill-tabs">
            {['inherit', 'allow', 'deny'].map((opt) => (
              <button key={opt} className={effectOf(p) === opt ? 'active' : ''} disabled={p.locked} onClick={() => set(p.key, opt)}>{opt}</button>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  );
}

// "Show this member's task list" to another user.
function ListShareModal({ member, users, onClose }) {
  const toast = useToast();
  const [grants, setGrants] = useState([]);
  const [viewerId, setViewerId] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { const r = await apiGet(`/task-access?ownerId=${member.id}`); setGrants(r.grants || []); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [member.id]);

  async function add() {
    if (!viewerId) return;
    try { await apiPost('/task-access', { ownerId: member.id, viewerId: Number(viewerId) }); setViewerId(''); toast('Access granted', 'ok'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }
  async function revoke(vId) {
    try { await apiDelete(`/task-access/${member.id}/${vId}`); load(); }
    catch (e) { toast(e.message, 'err'); }
  }

  const grantedIds = new Set(grants.map((g) => g.viewer_id));
  const candidates = users.filter((u) => u.id !== member.id && !grantedIds.has(u.id));

  return (
    <Modal title={`Share list — ${member.name}`} onClose={onClose}>
      <p className="muted small mb">These people can view <b>{member.name}</b>&apos;s task list (read-only, in addition to their own).</p>
      <div className="row mb">
        <select className="select" value={viewerId} onChange={(e) => setViewerId(e.target.value)}>
          <option value="">Grant access to…</option>
          {candidates.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
        </select>
        <button className="btn primary" onClick={add} disabled={!viewerId}>Grant</button>
      </div>
      {loading ? <Loading /> : grants.map((g) => (
        <div className="perm-row" key={g.viewer_id}>
          <span className="small">{g.viewer_name}</span>
          <button className="btn sm danger" onClick={() => revoke(g.viewer_id)}>Revoke</button>
        </div>
      ))}
      {!loading && !grants.length && <div className="empty">Not shared with anyone.</div>}
    </Modal>
  );
}
