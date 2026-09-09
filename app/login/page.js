'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

const DEMO = [
  { label: 'Super Admin', email: 'superadmin@example.com', pass: 'ChangeMe@123' },
  { label: 'Admin A (extra powers)', email: 'admina@acme.test', pass: 'Password@123' },
  { label: 'Admin B (restricted)', email: 'adminb@acme.test', pass: 'Password@123' },
  { label: 'Team Member', email: 'mary@acme.test', pass: 'Password@123' },
];

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('superadmin@example.com');
  const [password, setPassword] = useState('ChangeMe@123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.is_super_admin ? '/super-admin/dashboard' : '/dashboard');
    }
  }, [user, loading, router]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(email, password);
      router.replace(u.is_super_admin ? '/super-admin/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card card">
        <div className="auth-logo">
          <div className="brand-badge">O</div>
          <div>
            <div className="brand-name" style={{ fontSize: 18 }}>Orbit</div>
            <div className="brand-sub">Company &amp; Team Management</div>
          </div>
        </div>
        <h2 style={{ marginBottom: 4 }}>Sign in</h2>
        <p className="muted small" style={{ marginBottom: 18 }}>Use your account, or pick a demo user below.</p>

        <form onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          {error && <div className="badge red" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? <span className="spinner" /> : 'Sign in'}
          </button>
        </form>

        <div className="small muted" style={{ textAlign: 'center', marginTop: 14 }}>
          New here? <Link href="/register">Create an account</Link>
        </div>

        <div className="divider" />
        <div className="small muted" style={{ marginBottom: 8 }}>Demo accounts</div>
        <div className="grid" style={{ gap: 8 }}>
          {DEMO.map((d) => (
            <button
              key={d.email}
              className="btn ghost sm"
              style={{ justifyContent: 'space-between' }}
              onClick={() => { setEmail(d.email); setPassword(d.pass); }}
              type="button"
            >
              <span>{d.label}</span>
              <span className="muted" style={{ fontSize: 11 }}>{d.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
