'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, getToken } from '@/lib/api';
import { Loading, useToast } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function ReportsScreen() {
  const toast = useToast();
  const { can } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(null);

  useEffect(() => {
    if (!can('report.view')) { setError('You do not have permission to view reports (report.view).'); return; }
    apiGet('/reports').then(setSummary).catch((e) => setError(e.message));
  }, []);

  async function generate() {
    try { const r = await apiPost('/reports/generate', {}); setGenerated(r); toast('Report generated', 'ok'); }
    catch (e) { toast(e.message, 'err'); }
  }
  async function exportCsv() {
    try {
      const res = await fetch(`${API_URL}/reports/export`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.message || j.error || 'Export failed'); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'tasks-report.csv'; a.click();
      URL.revokeObjectURL(url);
      toast('Exported CSV', 'ok');
    } catch (e) { toast(e.message, 'err'); }
  }

  if (error) return <div><h2>Reports</h2><div className="card mt"><p className="muted">{error}</p></div></div>;
  if (!summary) return <Loading />;

  return (
    <div>
      <div className="spread wrap mb">
        <div><h2>Reports</h2><p className="muted small">Buttons appear only for actions you're permitted to perform.</p></div>
        <div className="row">
          {can('report.generate') && <button className="btn" onClick={generate}>Generate</button>}
          {can('report.export') && <button className="btn primary" onClick={exportCsv}>Export CSV</button>}
        </div>
      </div>

      <div className="grid grid-4 mb">
        <div className="card stat"><div className="label">Total tasks</div><div className="value">{summary.totals?.tasks || 0}</div></div>
        <div className="card stat"><div className="label">Done</div><div className="value green">{summary.totals?.done || 0}</div></div>
        <div className="card stat"><div className="label">In progress</div><div className="value amber">{summary.totals?.in_progress || 0}</div></div>
        <div className="card stat"><div className="label">Statuses</div><div className="value">{summary.byStatus?.length || 0}</div></div>
      </div>

      <div className="card">
        <div className="card-title">Tasks by status</div>
        <div className="mt">
          {(summary.byStatus || []).map((s) => (
            <div className="spread" key={s.status} style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="muted">{s.status}</span><span className="badge grey">{s.n}</span>
            </div>
          ))}
          {!summary.byStatus?.length && <div className="muted small">No task data.</div>}
        </div>
      </div>

      {generated && (
        <div className="card mt">
          <div className="card-title">Generated report</div>
          <div className="small muted mb">at {new Date(generated.generatedAt).toLocaleString()}</div>
          <div className="table-wrap"><table className="tbl"><thead><tr><th>Status</th><th>Priority</th><th>Count</th></tr></thead>
            <tbody>{generated.rows.map((r, i) => <tr key={i}><td>{r.status}</td><td>{r.priority}</td><td>{r.n}</td></tr>)}</tbody>
          </table></div>
        </div>
      )}
    </div>
  );
}
