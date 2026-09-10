'use client';

import { useEffect, useState } from 'react';

/**
 * Light/Dark theme switch.
 *
 * The chosen theme is written to <html data-theme="…"> (which the CSS keys off)
 * and remembered in localStorage. A tiny inline script in app/layout.js applies
 * the saved value before first paint, so there's no flash on reload.
 */

const STORAGE_KEY = 'orbit.theme';

export function applyTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(STORAGE_KEY, t); } catch {}
  return t;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    let saved = 'dark';
    try { saved = localStorage.getItem(STORAGE_KEY) || 'dark'; } catch {}
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const next = theme === 'dark' ? 'light' : 'dark';
  const toggle = () => setTheme(applyTheme(next));

  return (
    <button
      type="button"
      className="btn sm ghost"
      onClick={toggle}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
    >
      {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
