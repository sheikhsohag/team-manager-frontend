'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import './landing.css';

function Logo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.4" fill="#0b1020" />
      <ellipse cx="12" cy="12" rx="10" ry="4.6" stroke="#0b1020" strokeWidth="1.7" transform="rotate(-28 12 12)" />
      <circle cx="20" cy="8.6" r="1.9" fill="#0b1020" />
    </svg>
  );
}

const FEATURES = [
  { icon: '🏢', title: 'Company Management', text: 'Manage company information and your entire organizational structure from one place.' },
  { icon: '👥', title: 'Team Management', text: 'Create teams, appoint leads, and organize members exactly how your org works.' },
  { icon: '🧑‍💼', title: 'User Management', text: 'Onboard and manage employees, admins, and users with full lifecycle control.' },
  { icon: '🔑', title: 'Roles & Permissions', text: 'Create custom roles and assign granular, per-user permissions with confidence.' },
  { icon: '📊', title: 'Dashboard & Analytics', text: 'Monitor the company and team statistics that matter, updated in real time.' },
  { icon: '🛡️', title: 'Secure Access', text: 'Protect resources with authentication and permission-based access control.' },
];

const STEPS = [
  { n: '01', title: 'Create Your Company', text: 'Set up your company and organization in a couple of minutes.' },
  { n: '02', title: 'Add Your Team', text: 'Invite users and organize them into teams with clear roles.' },
  { n: '03', title: 'Manage Everything', text: 'Control users, roles, permissions, and company operations.' },
];

const ROLES = [
  { name: 'Admin A', role: 'Owner', tag: 'Full Access', cls: 'full', grad: 'linear-gradient(135deg,#6d8bff,#a78bfa)' },
  { name: 'Admin B', role: 'Administrator', tag: 'Limited Access', cls: 'limited', grad: 'linear-gradient(135deg,#fbbf24,#f59e0b)' },
  { name: 'Manager', role: 'Team Lead', tag: 'Team Access', cls: 'team', grad: 'linear-gradient(135deg,#60a5fa,#38bdf8)' },
  { name: 'Employee', role: 'Member', tag: 'Basic Access', cls: 'basic', grad: 'linear-gradient(135deg,#94a3b8,#64748b)' },
];

export default function Landing() {
  // Subtle scroll-reveal for below-the-fold blocks.
  useEffect(() => {
    const els = document.querySelectorAll('.lp-reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="lp">
      <div className="lp-shell">
        {/* ---------- Top (minimal, NOT a navbar) ---------- */}
        <header className="lp-top">
          <div className="lp-brand">
            <span className="lp-logo"><Logo /></span>
            <div>
              <div className="lp-brand-name">Orbit</div>
              <div className="lp-brand-sub">Company &amp; Team Management</div>
            </div>
          </div>
          <div className="lp-top-actions">
            <Link href="/login" className="lp-btn link">Login</Link>
            <Link href="/register" className="lp-btn primary">Get Started</Link>
          </div>
        </header>

        {/* ---------- Hero ---------- */}
        <section className="lp-hero">
          <div className="lp-reveal in">
            <span className="lp-pill"><span className="dot" /> Enterprise-grade permission control</span>
            <h1 className="lp-h1">
              Manage Your Company.<br />
              <span className="lp-grad-text">Empower Your Team.</span>
            </h1>
            <p className="lp-sub">
              Manage your company, teams, employees, roles, and permissions from one powerful platform.
            </p>
            <div className="lp-hero-cta">
              <Link href="/register" className="lp-btn primary lg">Get Started →</Link>
              <Link href="/login" className="lp-btn ghost lg">Login</Link>
            </div>
            <div className="lp-trust">
              <span><span className="tick">✓</span> No credit card required</span>
              <span><span className="tick">✓</span> Set up in minutes</span>
              <span><span className="tick">✓</span> Granular access control</span>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="lp-preview-wrap lp-reveal in lp-d2">
            <div className="lp-preview">
              <div className="lp-win-bar"><i /><i /><i /><span className="lp-win-title">Orbit · Company Dashboard</span></div>

              <div className="lp-stat-grid">
                <div className="lp-stat"><div className="k">Employees</div><div className="v">248</div><div className="t up">▲ 12%</div></div>
                <div className="lp-stat"><div className="k">Teams</div><div className="v grad">16</div><div className="t up">▲ 3</div></div>
                <div className="lp-stat"><div className="k">Active Users</div><div className="v">193</div><div className="t up">▲ 8%</div></div>
                <div className="lp-stat"><div className="k">Roles</div><div className="v grad">9</div><div className="t">custom</div></div>
              </div>

              <div className="lp-panels">
                <div className="lp-panel">
                  <h5>Weekly Activity <span>Last 7 days</span></h5>
                  <div className="lp-chart">
                    <div className="bar" style={{ height: '55%' }} />
                    <div className="bar" style={{ height: '78%' }} />
                    <div className="bar" style={{ height: '42%' }} />
                    <div className="bar" style={{ height: '88%' }} />
                    <div className="bar" style={{ height: '64%' }} />
                    <div className="bar" style={{ height: '96%' }} />
                    <div className="bar" style={{ height: '70%' }} />
                  </div>
                </div>
                <div className="lp-panel">
                  <h5>Permissions</h5>
                  <div className="lp-perm-row"><span className="who">Admin</span><span className="lp-dots"><i className="on" /><i className="on" /><i className="on" /><i className="on" /></span></div>
                  <div className="lp-perm-row"><span className="who">Manager</span><span className="lp-dots"><i className="on" /><i className="on" /><i className="amber" /><i /></span></div>
                  <div className="lp-perm-row"><span className="who">Member</span><span className="lp-dots"><i className="on" /><i /><i /><i /></span></div>
                </div>
              </div>

              <div className="lp-panel" style={{ marginTop: 10 }}>
                <h5>Recent Activity <span>live</span></h5>
                <div className="lp-act"><span className="av" style={{ background: 'linear-gradient(135deg,#6d8bff,#a78bfa)' }}>L</span> Larry created team <b style={{ color: 'var(--text)' }}>&nbsp;Platform</b></div>
                <div className="lp-act"><span className="av" style={{ background: 'linear-gradient(135deg,#2dd4bf,#38bdf8)' }}>M</span> Mary was granted <b style={{ color: 'var(--text)' }}>&nbsp;task.create</b></div>
                <div className="lp-act"><span className="av" style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)' }}>A</span> Admin updated role permissions</div>
              </div>
            </div>

            <div className="lp-badge-float">
              <span className="ring"><b>98%</b></span>
              <div><div style={{ fontSize: 12, fontWeight: 700 }}>Access secured</div><div style={{ fontSize: 11, color: 'var(--muted-2)' }}>Policy enforced</div></div>
            </div>
          </div>
        </section>

        {/* ---------- Metrics ---------- */}
        <div className="lp-metrics lp-reveal">
          <div className="lp-metric"><div className="v lp-grad-text">10k+</div><div className="k">Teams organized</div></div>
          <div className="lp-metric"><div className="v lp-grad-text">99.9%</div><div className="k">Uptime SLA</div></div>
          <div className="lp-metric"><div className="v lp-grad-text">50+</div><div className="k">Permission controls</div></div>
          <div className="lp-metric"><div className="v lp-grad-text">SOC 2</div><div className="k">Security posture</div></div>
        </div>

        {/* ---------- Features ---------- */}
        <section className="lp-section">
          <div className="lp-reveal">
            <div className="lp-eyebrow">Features</div>
            <h2 className="lp-title">Everything You Need to Manage Your Organization</h2>
            <p className="lp-lead">One platform for your company, teams, users, and the permissions that tie them together.</p>
          </div>
          <div className="lp-features">
            {FEATURES.map((f, i) => (
              <div className={`lp-feature lp-reveal lp-d${(i % 3) + 1}`} key={f.title}>
                <div className="lp-ficon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section className="lp-section" style={{ paddingTop: 20 }}>
          <div className="lp-reveal">
            <div className="lp-eyebrow">How it works</div>
            <h2 className="lp-title">Up and Running in Three Steps</h2>
            <p className="lp-lead">From zero to a fully organized company — no complex setup required.</p>
          </div>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div className={`lp-step lp-reveal lp-d${i + 1}`} key={s.n}>
                <div className="num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Permission highlight ---------- */}
        <section className="lp-section">
          <div className="lp-perm-grid">
            <div className="lp-perm-copy lp-reveal">
              <div className="lp-eyebrow" style={{ textAlign: 'left' }}>Permission engine</div>
              <h2>Granular access control, configured your way</h2>
              <p>Administrators decide exactly what every role and individual can do. Grant broad access to owners, scope managers to their teams, and keep members focused — all from one clean interface.</p>
              <div className="lp-check"><span className="ic">✓</span><div><b>Role-based defaults</b><p className="muted">Start from sensible roles, then fine-tune per person.</p></div></div>
              <div className="lp-check"><span className="ic">✓</span><div><b>Per-user overrides</b><p className="muted">Allow or deny any single permission for any user.</p></div></div>
              <div className="lp-check"><span className="ic">✓</span><div><b>Company-wide guardrails</b><p className="muted">Set boundaries no one in the company can cross.</p></div></div>
            </div>

            <div className="lp-roles lp-reveal lp-d2">
              <div className="hdr"><b>Access Overview</b><span>4 roles configured</span></div>
              {ROLES.map((r) => (
                <div className="lp-role" key={r.name}>
                  <div className="p">
                    <span className="ava" style={{ background: r.grad }}>{r.name.slice(0, 1)}</span>
                    <div><div className="nm">{r.name}</div><div className="rl">{r.role}</div></div>
                  </div>
                  <span className={`lp-tag ${r.cls}`}>{r.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Final CTA ---------- */}
        <section className="lp-final-wrap">
          <div className="lp-final lp-reveal">
            <h2>Ready to Take Control of<br />Your Organization?</h2>
            <p>Create your account and start managing your company, teams, users, roles, and permissions from one powerful platform.</p>
            <div className="lp-hero-cta">
              <Link href="/register" className="lp-btn primary lg">Create Account →</Link>
              <Link href="/login" className="lp-btn ghost lg">Login</Link>
            </div>
          </div>
        </section>

        {/* ---------- Footer ---------- */}
        <footer className="lp-footer">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <div className="lp-brand">
                <span className="lp-logo"><Logo /></span>
                <div className="lp-brand-name">Orbit</div>
              </div>
              <p>The all-in-one platform to manage your company, teams, users, roles, and permissions with confidence.</p>
            </div>
            <nav className="lp-footer-links" aria-label="Footer">
              <Link href="/register">Get Started</Link>
              <Link href="/login">Login</Link>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms &amp; Conditions</a>
              <a href="#">Contact</a>
            </nav>
          </div>
          <div className="lp-footer-bottom">
            <span>© {new Date().getFullYear()} Orbit. All rights reserved.</span>
            <span>Built for modern organizations.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
