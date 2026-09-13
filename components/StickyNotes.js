'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Full-screen, draggable sticky-notes board.
 *
 * Notes are personal and low-stakes, so they're kept in the browser
 * (localStorage, keyed by user id) rather than the server. Each note stores its
 * free position (x, y) and stacking order (z) so it can be dragged anywhere and
 * dropped on top of another — grabbing a note brings it to the front.
 */

const COLORS = [
  { bg: '#fde68a', fg: '#422006' }, // amber
  { bg: '#bbf7d0', fg: '#052e16' }, // green
  { bg: '#bfdbfe', fg: '#082f49' }, // blue
  { bg: '#fbcfe8', fg: '#500724' }, // pink
  { bg: '#ddd6fe', fg: '#2e1065' }, // violet
  { bg: '#fed7aa', fg: '#431407' }, // orange
];

const keyFor = (userId) => `orbit.sticky.${userId || 'anon'}`;

export default function StickyNotes({ open, onClose, userId }) {
  const [notes, setNotes] = useState([]);
  const loaded = useRef(false);
  const seq = useRef(1);      // next note id
  const zTop = useRef(1);     // highest z-index in use
  const boardRef = useRef(null);
  const drag = useRef(null);  // { id, dx, dy } while dragging

  // Load once, the first time the board is opened for this user.
  useEffect(() => {
    if (!open || loaded.current) return;
    try {
      const raw = localStorage.getItem(keyFor(userId));
      const parsed = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(parsed) ? parsed : [];
      let maxZ = 0;
      // Backfill position/stacking for notes saved before drag support existed.
      const fixed = arr.map((n, i) => {
        const x = Number.isFinite(n.x) ? n.x : 30 + (i % 6) * 28;
        const y = Number.isFinite(n.y) ? n.y : 30 + (i % 6) * 28;
        const z = Number.isFinite(n.z) ? n.z : i + 1;
        maxZ = Math.max(maxZ, z);
        return { ...n, x, y, z };
      });
      setNotes(fixed);
      seq.current = fixed.reduce((m, n) => Math.max(m, (n.id || 0) + 1), 1);
      zTop.current = maxZ + 1;
    } catch {
      setNotes([]);
    }
    loaded.current = true;
  }, [open, userId]);

  // Persist on every change (skipped until the initial load has run).
  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(keyFor(userId), JSON.stringify(notes)); } catch {}
  }, [notes, userId]);

  // Esc closes the board.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Global drag tracking, so a fast pointer never "escapes" the note.
  const onMove = useCallback((e) => {
    const d = drag.current;
    const board = boardRef.current;
    if (!d || !board) return;
    const rect = board.getBoundingClientRect();
    let x = e.clientX - rect.left - d.dx;
    let y = e.clientY - rect.top - d.dy;
    x = Math.max(0, Math.min(x, board.clientWidth - 44));
    y = Math.max(0, Math.min(y, board.clientHeight - 30));
    setNotes((prev) => prev.map((n) => (n.id === d.id ? { ...n, x, y } : n)));
  }, []);
  const onUp = useCallback(() => { drag.current = null; }, []);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [open, onMove, onUp]);

  if (!open) return null;

  const bringToFront = (id) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, z: zTop.current++ } : n)));

  const onNotePointerDown = (e, n) => {
    bringToFront(n.id);
    // Don't start a drag from interactive controls (colour swatches, delete, text).
    if (e.target.closest('button, textarea')) return;
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    drag.current = { id: n.id, dx: e.clientX - rect.left - n.x, dy: e.clientY - rect.top - n.y };
  };

  const addNote = () => {
    const color = COLORS[notes.length % COLORS.length];
    const offset = (notes.length % 6) * 26;
    setNotes((prev) => [
      ...prev,
      { id: seq.current++, text: '', color, x: 40 + offset, y: 40 + offset, z: zTop.current++ },
    ]);
  };
  const updateNote = (id, text) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
  const removeNote = (id) => setNotes((prev) => prev.filter((n) => n.id !== id));
  const setColor = (id, color) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, color } : n)));

  return (
    <div className="sticky-fullscreen">
      <div className="sticky-head">
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <span className="sticky-title">🗒️ Sticky Notes</span>
          <span className="muted small">
            {notes.length} note{notes.length === 1 ? '' : 's'} · drag to arrange · saved on this device
          </span>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn primary sm" onClick={addNote}>＋ New note</button>
          <button className="btn ghost sm" onClick={onClose}>✕ Close</button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="sticky-empty">
          <div style={{ fontSize: 44 }}>🗒️</div>
          <p className="muted">No notes yet — jot something down.</p>
          <button className="btn primary" onClick={addNote}>＋ New note</button>
        </div>
      ) : (
        <div className="sticky-board" ref={boardRef}>
          {notes.map((n) => (
            <div
              className="sticky-note"
              key={n.id}
              style={{ left: n.x, top: n.y, zIndex: n.z, background: n.color?.bg, color: n.color?.fg }}
              onPointerDown={(e) => onNotePointerDown(e, n)}
            >
              <div className="sticky-note-bar">
                <div className="sticky-swatches">
                  {COLORS.map((c) => (
                    <button
                      key={c.bg}
                      type="button"
                      className={`sticky-swatch ${n.color?.bg === c.bg ? 'sel' : ''}`}
                      style={{ background: c.bg }}
                      title="Set colour"
                      onClick={() => setColor(n.id, c)}
                    />
                  ))}
                </div>
                <button type="button" className="sticky-del" title="Delete" onClick={() => removeNote(n.id)}>🗑️</button>
              </div>
              <textarea
                value={n.text}
                placeholder="Write something…"
                onChange={(e) => updateNote(n.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
