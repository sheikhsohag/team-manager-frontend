'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPut } from '@/lib/api';
import { Loading, useToast, Toggle } from '@/components/ui';

/** Company admin self-service boundary (section 9) — only if enabled by Super Admin. */
export default function CompanyBoundarySelfScreen() {
  const toast = useToast();
  const [groups, setGroups] = useState(null);
  const [disabled, setDisabled] = useState(new Set());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiGet('/admin/company/permissions').then((r) => {
      setGroups(r.groups);
      const s = new Set();
      r.groups.forEach((g) => g.permissions.forEach((p) => { if (p.disabled) s.add(p.key); }));
      setDisabled(s);
    }).catch((e) => setError(e.message));
  }, []);

  function toggle(key) {
    setDisabled((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }
  async function save() {
    setBusy(true);
    try { await apiPut('/admin/company/permissions', { disabledKeys: [...disabled] }); toast('Company policy saved', 'ok'); }
    catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  }

  if (error) return <div className="card"><h3>Company Policy</h3><p className="muted mt">{error}</p></div>;
  if (!groups) return <Loading />;

  return (
    <div>
      <div className="spread wrap mb">
        <div>
          <h2>Company Policy</h2>
          <p className="muted small">Disable capabilities for your entire company. You cannot enable anything beyond what the system allows.</p>
        </div>
        <button className="btn primary" onClick={save} disabled={busy}>Save Policy</button>
      </div>
      {groups.map((g) => (
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
    </div>
  );
}
