const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/prestamos-back';

export const apiBase = API_URL;

// Sesion invalida/expirada: limpia y manda al login (evita bucles en el propio login).
function onUnauthorized(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('prestamos_session');
  } catch {
    /* ignore */
  }
  const p = window.location.pathname;
  if (!p.startsWith('/login') && !p.startsWith('/portal')) {
    window.location.href = '/login';
  }
}

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

/* ---- estado de carga global ---- */
let inflight = 0;
type Listener = (n: number) => void;
const listeners = new Set<Listener>();
function notify() {
  listeners.forEach((l) => l(inflight));
}
export function onLoading(cb: Listener): () => void {
  listeners.add(cb);
  cb(inflight);
  return () => {
    listeners.delete(cb);
  };
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = opts;
  inflight++;
  notify();
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && token) onUnauthorized();
      const msg = (data as { message?: string })?.message ?? `Error ${res.status}`;
      throw new Error(msg);
    }
    return data as T;
  } finally {
    inflight = Math.max(0, inflight - 1);
    notify();
  }
}

/* ---- subida de archivos (multipart/form-data) ---- */
export async function apiUpload<T = unknown>(path: string, form: FormData, token?: string | null): Promise<T> {
  inflight++;
  notify();
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form,
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && token) onUnauthorized();
      const msg = (data as { message?: string })?.message ?? `Error ${res.status}`;
      throw new Error(msg);
    }
    return data as T;
  } finally {
    inflight = Math.max(0, inflight - 1);
    notify();
  }
}

/* ---- descarga de archivos (blob) ---- */
export async function apiDownload(path: string, filename: string, token?: string | null): Promise<void> {
  inflight++;
  notify();
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: 'no-store',
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error((d as { message?: string })?.message ?? `Error ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } finally {
    inflight = Math.max(0, inflight - 1);
    notify();
  }
}
