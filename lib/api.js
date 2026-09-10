'use client';

/**
 * Resolve the backend API base URL.
 * 1. If NEXT_PUBLIC_API_URL is set (production / custom backend host), always use it.
 * 2. Otherwise in the browser, target the SAME host the page was loaded from, on
 *    port 4000 — so it works from localhost AND from a phone/LAN IP with no config.
 * 3. Fall back to localhost for server-side rendering.
 */
export function apiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:4000/api`;
  }
  return 'http://localhost:4000/api';
}

// One-time cleanup: the auth token used to live in localStorage (readable by JS,
// and therefore stealable via XSS / DevTools console). It now lives ONLY in an
// httpOnly cookie the browser sends automatically. Drop any stale copy.
if (typeof window !== 'undefined') {
  try { window.localStorage.removeItem('tm_token'); } catch {}
}

/**
 * Thin fetch wrapper. Throws an Error with `.status` and `.body` on non-2xx.
 * `credentials: 'include'` makes the browser attach the httpOnly auth cookie —
 * no token is ever read or held in JavaScript.
 */
export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export const apiGet = (p) => api(p);
export const apiPost = (p, body) => api(p, { method: 'POST', body });
export const apiPut = (p, body) => api(p, { method: 'PUT', body });
export const apiDelete = (p) => api(p, { method: 'DELETE' });

/** Upload a File via multipart/form-data (field name defaults to "file"). */
export async function apiUpload(path, file, field = 'file') {
  const fd = new FormData();
  fd.append(field, file);
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  let data = null;
  const text = await res.text();
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Upload failed (${res.status})`);
    err.status = res.status; err.body = data;
    throw err;
  }
  return data;
}

/** Download an attachment (auth cookie sent automatically), triggering a browser save. */
export async function apiDownload(path, filename = 'download') {
  const res = await fetch(`${apiBase()}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
