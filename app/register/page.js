'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [accountType, setAccountType] = useState('company');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setBusy(true);
    try {
      const u = await register({ name, email, password, accountType, companyName: accountType === 'company' ? companyName : null });
      router.replace(u.is_super_admin ? '/super-admin/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
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
            <div className="brand-sub">Create your workspace</div>
          </div>
        </div>
        <h2 style={{ marginBottom: 4 }}>Sign up</h2>
        <p className="muted small" style={{ marginBottom: 18 }}>
          You&apos;ll become the admin of a brand-new workspace with full control (except system-level settings).
        </p>

        <div className="pill-tabs" style={{ marginBottom: 16, width: '100%' }}>
          <button type="button" className={accountType === 'company' ? 'active' : ''} onClick={() => setAccountType('company')} style={{ flex: 1 }}>
            🏢 Company
          </button>
          <button type="button" className={accountType === 'individual' ? 'active' : ''} onClick={() => setAccountType('individual')} style={{ flex: 1 }}>
            👤 Individual
          </button>
        </div>

        <form onSubmit={submit}>
          <label className="field">
            <span>Your name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
          </label>
          {accountType === 'company' && (
            <label className="field">
              <span>Company / workspace name</span>
              <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc." />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          </label>
          <label className="field">
            <span>Password <span className="muted">(min 8 chars)</span></span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
          </label>
          {error && <div className="badge red" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? <span className="spinner" /> : 'Create account'}
          </button>
        </form>

        <div className="divider" />
        <div className="small muted" style={{ textAlign: 'center' }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
