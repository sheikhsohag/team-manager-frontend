'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPut, apiPost } from '@/lib/api';
import { Modal, Loading, useToast } from '@/components/ui';

const SOURCE_CLASS = {
  'Super Admin': 'purple',
  'System Policy': 'grey',
  'Company Policy': 'amber',
  'User Override': 'purple',
  'Role': 'grey',
  'Not assigned': 'grey',
};
const MATRIX_ACTIONS = ['view', 'create', 'update', 'delete'];

// effective decision for a permission given the pending effect
function decide(perm, effect) {
  if (perm.locked) return { allowed: perm.allowed, source: perm.source, detail: perm.sourceDetail };
  if (effect === 'allow') return { allowed: true, source: 'User Override', detail: 'Explicit allow' };
  if (effect === 'deny') return { allowed: false, source: 'User Override', detail: 'Explicit deny' };
  const b = perm.base || { allowed: perm.allowed, source: perm.source, sourceDetail: perm.sourceDetail };
  return { allowed: b.allowed, source: b.source, detail: b.sourceDetail };
}

export default function PermissionManager({ userId, canEdit = true }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState({});          // key -> 'allow'|'deny'|'inherit'
  const [search, setSearch] = useState('');
  const [view, setView] = useState('groups');       // groups | matrix | effective
  const [collapsed, setCollapsed] = useState({});
  const [saving, setSaving] = useState(false);

  // modals
  const [simOpen, setSimOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [people, setPeople] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const eff = await apiGet(`/users/${userId}/effective-permissions`);
      setData(eff);
      setEdits({});
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [userId]);

  useEffect(() => {
    apiGet('/permission-templates').then((r) => setTemplates(r.templates || [])).catch(() => {});
    apiGet('/users').then((r) => setPeople(r.users || [])).catch(() => {});
  }, []);

  // current effect for a permission
  const effectOf = (perm) => edits[perm.key] ?? (perm.override || 'inherit');

  function setEffect(perm, effect) {
    if (!canEdit || perm.locked) return;
    setEdits((prev) => {
      const next = { ...prev };
      const original = perm.override || 'inherit';
      if (effect === original) delete next[perm.key];
      else next[perm.key] = effect;
      return next;
    });
  }

  // live summary
  const summary = useMemo(() => {
    if (!data) return null;
    let allowed = 0, denied = 0, roleCount = 0, overrides = 0, companyRestrictions = 0;
    for (const g of data.groups) {
      for (const p of g.permissions) {
        if (data.isSuperAdmin) { allowed++; continue; }
        const eff = effectOf(p);
        const d = decide(p, eff);
        if (d.allowed) allowed++; else denied++;
        if (d.source === 'Role') roleCount++;
        if (d.source === 'User Override') overrides++;
        if (d.source === 'Company Policy') companyRestrictions++;
      }
    }
    return { allowed, denied, roleCount, overrides, companyRestrictions,
      total: allowed + denied };
  }, [data, edits]);

  const dirtyCount = Object.keys(edits).length;

  const filteredGroups = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.groups;
    return data.groups
      .map((g) => ({ ...g, permissions: g.permissions.filter((p) =>
        p.key.toLowerCase().includes(q) || p.label.toLowerCase().includes(q)) }))
      .filter((g) => g.permissions.length);
  }, [data, search]);

  async function save() {
    const changes = Object.entries(edits).map(([key, effect]) => ({ key, effect }));
    if (!changes.length) return;
    setSaving(true);
    try {
      await apiPut(`/users/${userId}/permissions`, { changes });
      toast(`Saved ${changes.length} permission change(s)`, 'ok');
      await load();
    } catch (e) {
      toast(e.message || 'Save failed', 'err');
    } finally {
      setSaving(false);
    }
  }

  async function resetToRole() {
    if (!confirm('Remove ALL user overrides and reset this user to their role defaults?')) return;
    try {
      await apiPost(`/users/${userId}/permissions/reset`, {});
      toast('Reset to role defaults', 'ok');
      await load();
    } catch (e) { toast(e.message, 'err'); }
  }

  function moduleSetAll(group, effect) {
    setEdits((prev) => {
      const next = { ...prev };
      for (const p of group.permissions) {
        if (p.locked) continue;
        const original = p.override || 'inherit';
        if (effect === original) delete next[p.key];
        else next[p.key] = effect;
      }
      return next;
    });
  }

  if (loading) return <Loading label="Loading permissions…" />;
  if (!data) return <div className="empty">No permission data.</div>;

  const isSuper = data.isSuperAdmin;

  return (
    <div>
      {/* Header */}
      <div className="spread wrap mb">
        <div>
          <h2>{data.user.name}</h2>
          <div className="row small muted wrap">
            <span>{data.user.email}</span>
            <span>•</span>
            <span>{data.roles?.map((r) => r.name).join(', ') || (isSuper ? 'Super Admin' : 'No role')}</span>
          </div>
        </div>
        <div className="row wrap">
          {!isSuper && canEdit && (
            <>
              <button className="btn primary" onClick={save} disabled={saving || !dirtyCount}>
                {saving ? <span className="spinner" /> : `Save Changes${dirtyCount ? ` (${dirtyCount})` : ''}`}
              </button>
              <button className="btn" onClick={resetToRole}>Reset to Role</button>
              <button className="btn ghost" onClick={() => setCopyOpen(true)}>Copy Permissions</button>
              <button className="btn ghost" onClick={() => setTplOpen(true)}>Apply Template</button>
            </>
          )}
          <button className="btn ghost" onClick={() => setSimOpen(true)}>Permission Preview</button>
        </div>
      </div>

      {isSuper && (
        <div className="badge purple mb">Super Admin — always allowed. Permissions cannot be restricted.</div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr 300px', alignItems: 'start' }}>
        <div>
          {/* Controls */}
          <div className="spread wrap mb">
            <div className="pill-tabs">
              {['groups', 'matrix', 'effective'].map((v) => (
                <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
                  {v === 'groups' ? 'Grouped' : v === 'matrix' ? 'Matrix' : 'Effective'}
                </button>
              ))}
            </div>
            <div className="searchbox" style={{ width: 260 }}>
              <span className="si">⌕</span>
              <input className="input" placeholder="Search permissions…" value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {view === 'groups' && (
            <GroupsView
              groups={filteredGroups} isSuper={isSuper} canEdit={canEdit}
              effectOf={effectOf} setEffect={setEffect} decide={decide}
              collapsed={collapsed} setCollapsed={setCollapsed} moduleSetAll={moduleSetAll}
              edits={edits}
            />
          )}
          {view === 'matrix' && (
            <MatrixView groups={filteredGroups} isSuper={isSuper} canEdit={canEdit}
              effectOf={effectOf} setEffect={setEffect} decide={decide} />
          )}
          {view === 'effective' && (
            <EffectiveView groups={filteredGroups} effectOf={effectOf} decide={decide} />
          )}
        </div>

        {/* Summary panel */}
        <SummaryPanel summary={summary} dirtyCount={dirtyCount} />
      </div>

      {simOpen && <SimulateModal userId={userId} onClose={() => setSimOpen(false)} groups={data.groups} />}
      {copyOpen && (
        <CopyModal userId={userId} people={people} onClose={() => setCopyOpen(false)}
          onDone={() => { setCopyOpen(false); load(); toast('Permissions copied', 'ok'); }} />
      )}
      {tplOpen && (
        <TemplateModal userId={userId} templates={templates} onClose={() => setTplOpen(false)}
          onDone={() => { setTplOpen(false); load(); toast('Template applied', 'ok'); }} />
      )}
    </div>
  );
}

/* ---------------- Grouped editor (sections 12, 13, 24) ---------------- */
function TriState({ value, onChange, disabled }) {
  const opts = [['inherit', 'Inherit'], ['allow', 'Allow'], ['deny', 'Deny']];
  return (
    <div className="pill-tabs" style={{ padding: 2 }}>
      {opts.map(([v, label]) => (
        <button key={v} disabled={disabled}
          className={value === v ? 'active' : ''}
          style={{ padding: '4px 10px', fontSize: 12,
            ...(value === v && v === 'allow' ? { color: 'var(--green)' } : {}),
            ...(value === v && v === 'deny' ? { color: 'var(--red)' } : {}) }}
          onClick={() => onChange(v)}>{label}</button>
      ))}
    </div>
  );
}

function PermRow({ perm, isSuper, canEdit, effectOf, setEffect, decide, changed }) {
  const eff = effectOf(perm);
  const d = decide(perm, eff);
  return (
    <div className="perm-row" style={changed ? { background: 'rgba(91,124,250,.08)' } : undefined}>
      <div className="meta">
        <div className="row" style={{ gap: 8 }}>
          <span className={`check ${d.allowed ? 'on' : (d.source === 'User Override' && !d.allowed) ? 'deny' : ''}`}>
            {d.allowed ? '✓' : '✕'}
          </span>
          <div>
            <div style={{ fontWeight: 600 }}>{perm.label}{changed && <span className="badge purple" style={{ marginLeft: 8 }}>unsaved</span>}</div>
            <div className="pk">{perm.key}</div>
          </div>
        </div>
        <div className="source-tag" style={{ marginTop: 4, marginLeft: 28 }}>
          Source: <span className={`badge ${SOURCE_CLASS[d.source] || 'grey'}`} style={{ padding: '1px 7px' }}>
            {d.source}{d.detail ? ` → ${d.detail}` : ''}
          </span>
        </div>
      </div>
      {isSuper ? (
        <span className="badge purple">Always</span>
      ) : perm.locked ? (
        <span className="badge amber" title="Locked by company/system policy">Locked</span>
      ) : (
        <TriState value={eff} disabled={!canEdit} onChange={(v) => setEffect(perm, v)} />
      )}
    </div>
  );
}

function GroupsView({ groups, isSuper, canEdit, effectOf, setEffect, decide, collapsed, setCollapsed, moduleSetAll, edits }) {
  if (!groups.length) return <div className="empty">No permissions match your search.</div>;
  return groups.map((g) => {
    const isCollapsed = collapsed[g.key];
    const allowedCount = g.permissions.filter((p) => decide(p, effectOf(p)).allowed).length;
    return (
      <div className="group-block" key={g.key}>
        <div className={`group-head ${isCollapsed ? 'collapsed' : ''}`}
          onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !c[g.key] }))}>
          <div className="row">
            <span className="caret">▾</span>
            <strong>{g.label}</strong>
            <span className="badge grey">{allowedCount}/{g.permissions.length}</span>
          </div>
          {!isSuper && canEdit && (
            <div className="row" onClick={(e) => e.stopPropagation()}>
              <button className="btn sm ghost" onClick={() => moduleSetAll(g, 'allow')}>Select All</button>
              <button className="btn sm ghost" onClick={() => moduleSetAll(g, 'inherit')}>Clear</button>
            </div>
          )}
        </div>
        {!isCollapsed && g.permissions.map((p) => (
          <PermRow key={p.key} perm={p} isSuper={isSuper} canEdit={canEdit}
            effectOf={effectOf} setEffect={setEffect} decide={decide}
            changed={edits[p.key] !== undefined} />
        ))}
      </div>
    );
  });
}

/* ---------------- Matrix view (section 11) ---------------- */
function MatrixView({ groups, isSuper, canEdit, effectOf, setEffect, decide }) {
  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>Module</th>
            {MATRIX_ACTIONS.map((a) => <th key={a} style={{ textAlign: 'center' }}>{a}</th>)}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.key}>
              <td style={{ fontWeight: 600 }}>{g.label}</td>
              {MATRIX_ACTIONS.map((a) => {
                const perm = g.permissions.find((p) => p.action === a);
                if (!perm) return <td key={a} style={{ textAlign: 'center', color: 'var(--muted-2)' }}>—</td>;
                const d = decide(perm, effectOf(perm));
                const locked = isSuper || perm.locked || !canEdit;
                return (
                  <td key={a} style={{ textAlign: 'center' }}>
                    <button
                      className={`check ${d.allowed ? 'on' : ''}`}
                      title={`${perm.key} — ${d.source}`}
                      disabled={locked}
                      style={{ margin: '0 auto', cursor: locked ? 'default' : 'pointer' }}
                      onClick={() => setEffect(perm, d.allowed ? 'inherit' : 'allow')}
                    >{d.allowed ? '✓' : ''}</button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Effective view (section 14) ---------------- */
function EffectiveView({ groups, effectOf, decide }) {
  return groups.map((g) => (
    <div className="group-block" key={g.key}>
      <div className="group-head"><strong>{g.label}</strong></div>
      {g.permissions.map((p) => {
        const d = decide(p, effectOf(p));
        return (
          <div className="perm-row" key={p.key}>
            <div className="row">
              <span className={`badge ${d.allowed ? 'green' : 'red'}`}>{d.allowed ? '✓ Allowed' : '✕ Denied'}</span>
              <span className="pk">{p.key}</span>
            </div>
            <span className="source-tag">{d.source}{d.detail ? ` → ${d.detail}` : ''}</span>
          </div>
        );
      })}
    </div>
  ));
}

/* ---------------- Summary panel (section 24) ---------------- */
function SummaryPanel({ summary, dirtyCount }) {
  if (!summary) return null;
  const rows = [
    ['Total permissions', summary.total, ''],
    ['Allowed', summary.allowed, 'green'],
    ['Denied', summary.denied, 'red'],
    ['Role permissions', summary.roleCount, ''],
    ['User overrides', summary.overrides, 'purple'],
    ['Company restrictions', summary.companyRestrictions, 'amber'],
  ];
  return (
    <div className="card" style={{ position: 'sticky', top: 90 }}>
      <div className="card-title">Summary</div>
      <div className="muted small mb">Live — reflects unsaved edits</div>
      {rows.map(([label, val, cls]) => (
        <div className="spread" key={label} style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
          <span className="muted">{label}</span>
          <span className={`badge ${cls || 'grey'}`}>{val}</span>
        </div>
      ))}
      {dirtyCount > 0 && <div className="badge purple mt">{dirtyCount} unsaved change(s)</div>}
    </div>
  );
}

/* ---------------- Simulation modal (section 15) ---------------- */
function SimulateModal({ userId, onClose, groups }) {
  const allPerms = groups.flatMap((g) => g.permissions.map((p) => ({ key: p.key, label: p.label })));
  const [key, setKey] = useState(allPerms[0]?.key || '');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const r = await apiPost('/permissions/simulate', { userId, permission: key });
      setResult(r);
    } catch (e) { setResult({ allowed: false, reason: e.message }); }
    finally { setBusy(false); }
  }
  return (
    <Modal title="Permission Preview / Simulation" onClose={onClose}>
      <p className="muted small mb">Check whether this user can perform a specific action, and why.</p>
      <label className="field">
        <span>Action</span>
        <select className="select" value={key} onChange={(e) => setKey(e.target.value)}>
          {allPerms.map((p) => <option key={p.key} value={p.key}>{p.label} ({p.key})</option>)}
        </select>
      </label>
      <button className="btn primary" onClick={run} disabled={busy}>{busy ? 'Checking…' : 'Check Access'}</button>
      {result && (
        <div className="card mt" style={{ background: 'var(--bg-soft)' }}>
          <div className="row mb">
            <span className={`badge ${result.allowed ? 'green' : 'red'}`}>
              {result.allowed ? '✓ Allowed' : '✕ Denied'}
            </span>
            {result.source && <span className="badge grey">{result.source}</span>}
          </div>
          <div className="muted small">Reason</div>
          <div>{result.reason}</div>
        </div>
      )}
    </Modal>
  );
}

/* ---------------- Copy permissions modal (section 17) ---------------- */
function CopyModal({ userId, people, onClose, onDone }) {
  const options = people.filter((p) => String(p.id) !== String(userId));
  const [from, setFrom] = useState(options[0]?.id || '');
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      await apiPost('/permissions/copy', { fromUserId: from, toUserId: userId });
      onDone();
    } catch (e) { alert(e.message); setBusy(false); }
  }
  return (
    <Modal title="Copy Permissions" onClose={onClose}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={run} disabled={busy || !from}>Copy Overrides</button></>}>
      <p className="muted small mb">Copy the user-specific permission overrides from another user onto this one. Existing overrides are replaced.</p>
      <label className="field">
        <span>Copy from</span>
        <select className="select" value={from} onChange={(e) => setFrom(e.target.value)}>
          {options.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.email}</option>)}
        </select>
      </label>
    </Modal>
  );
}

/* ---------------- Template modal (section 18) ---------------- */
function TemplateModal({ userId, templates, onClose, onDone }) {
  const [tpl, setTpl] = useState(templates[0]?.id || '');
  const [mode, setMode] = useState('merge');
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      await apiPost(`/users/${userId}/permissions/apply-template`, { templateId: tpl, mode });
      onDone();
    } catch (e) { alert(e.message); setBusy(false); }
  }
  return (
    <Modal title="Apply Permission Template" onClose={onClose}
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={run} disabled={busy || !tpl}>Apply</button></>}>
      <label className="field">
        <span>Template</span>
        <select className="select" value={tpl} onChange={(e) => setTpl(e.target.value)}>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.permission_count} perms)</option>)}
        </select>
      </label>
      <label className="field">
        <span>Mode</span>
        <select className="select" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="merge">Merge (add template perms as ALLOW overrides)</option>
          <option value="replace">Replace (reset overrides, then apply)</option>
        </select>
      </label>
    </Modal>
  );
}
