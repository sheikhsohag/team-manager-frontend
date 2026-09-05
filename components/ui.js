'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';

/* ---------- Toast ---------- */
const ToastCtx = createContext(null);
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, kind = 'ok') => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast && <div className={`toast ${toast.kind}`}>{toast.message}</div>}
    </ToastCtx.Provider>
  );
}
export function useToast() {
  return useContext(ToastCtx) || (() => {});
}

/* ---------- Toggle ---------- */
export function Toggle({ on, deny, disabled, onClick, title }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`toggle ${on ? 'on' : ''} ${deny ? 'deny' : ''}`}
      aria-pressed={on}
    />
  );
}

/* ---------- Badge helper ---------- */
export function StatusBadge({ status }) {
  const map = {
    active: ['green', 'Active'],
    inactive: ['grey', 'Inactive'],
    suspended: ['red', 'Suspended'],
  };
  const [cls, label] = map[status] || ['grey', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

/* ---------- Modal ---------- */
export function Modal({ title, children, onClose, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="card modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="spread mb">
          <h3>{title}</h3>
          <button className="btn ghost sm" onClick={onClose}>✕</button>
        </div>
        {children}
        {footer && <div className="row mt" style={{ justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Loading ---------- */
export function Loading({ label = 'Loading…' }) {
  return (
    <div className="row" style={{ gap: 10, color: 'var(--muted)', padding: 24 }}>
      <span className="spinner" /> {label}
    </div>
  );
}
