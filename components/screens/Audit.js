'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { Loading } from '@/components/ui';

const ACTION_LABEL = {
  'permissions.update': 'Permission change',
  'permissions.reset_to_role': 'Reset to role',
  'permissions.copy': 'Copied permissions',
  'permissions.apply_template': 'Applied template',
  'role.permissions.update': 'Role permissions changed',
  'company.permissions.update': 'Company boundary changed',
  'bulk.assign_role': 'Bulk role assignment',
  'bulk.set_permission': 'Bulk permission change',
};

export default function AuditScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    apiGet('/audit-logs?limit=200').then((r) => setLogs(r.logs || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const shown = filter ? logs.filter((l) => (l.action + (l.actor_name || '')).toLowerCase().includes(filter.toLowerCase())) : logs;

  return (
    <div>
      <div className="spread wrap mb">
        <div>
          <h2>Audit Logs</h2>
          <p className="muted small">Every permission change is recorded — who, what, and when.</p>
        </div>
        <div className="searchbox" style={{ width: 260 }}><span className="si">⌕</span>
          <input className="input" placeholder="Filter…" value={filter} onChange={(e) => setFilter(e.target.value)} /></div>
      </div>

      <div className="grid" style={{ gap: 10 }}>
        {shown.map((l) => (
          <div className="card" key={l.id} style={{ padding: 14 }}>
            <div className="spread wrap">
              <div className="row" style={{ gap: 10 }}>
                <span className="badge purple">{ACTION_LABEL[l.action] || l.action}</span>
                <span className="muted small">by <strong>{l.actor_name || 'system'}</strong></span>
              </div>
              <span className="muted small">{new Date(l.created_at).toLocaleString()}</span>
            </div>
            {l.changes && <ChangeSummary changes={l.changes} />}
            {l.entity_type && <div className="small muted" style={{ marginTop: 6 }}>Target: {l.entity_type} #{l.entity_id || l.target_user_id || ''}</div>}
          </div>
        ))}
        {!shown.length && <div className="empty">No audit entries.</div>}
      </div>
    </div>
  );
}

function ChangeSummary({ changes }) {
  const chips = [];
  const add = (arr, cls, prefix) => (arr || []).forEach((x) => {
    const label = typeof x === 'string' ? x : (x.key || JSON.stringify(x));
    chips.push(<span key={prefix + label + chips.length} className={`badge ${cls}`}>{prefix}{label}{x.effect ? `=${x.effect}` : ''}</span>);
  });
  add(changes.added, 'green', '+ ');
  add(changes.changed, 'amber', '~ ');
  add(changes.removed, 'red', '− ');
  add(changes.disabled, 'red', 'disabled ');
  add(changes.enabled, 'green', 'enabled ');
  if (changes.copied != null) chips.push(<span key="c" className="badge grey">copied {changes.copied}</span>);
  if (changes.applied != null) chips.push(<span key="a" className="badge grey">applied {changes.applied}</span>);
  if (!chips.length) return null;
  return <div className="row wrap mt" style={{ gap: 6 }}>{chips}</div>;
}
