'use client';

/* Estado de instalacion de la PWA compartido entre componentes. */
type Listener = () => void;

let deferred: { prompt: () => void; userChoice: Promise<unknown> } | null = null;
let installed = false;
let inited = false;
const subs = new Set<Listener>();

function notify() { subs.forEach((f) => f()); }

/** Registra el service worker y engancha los eventos de instalacion (una sola vez). */
export function initPwa(): void {
  if (inited || typeof window === 'undefined') return;
  inited = true;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferred = e as unknown as { prompt: () => void; userChoice: Promise<unknown> };
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    notify();
  });
}

export function onPwaChange(cb: Listener): () => void {
  subs.add(cb);
  return () => { subs.delete(cb); };
}

export function canPrompt(): boolean {
  return deferred !== null;
}

export async function promptInstall(): Promise<void> {
  if (!deferred) return;
  deferred.prompt();
  try { await deferred.userChoice; } catch { /* ignore */ }
  deferred = null;
  notify();
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mm = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  return !!mm || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isInstalled(): boolean {
  return installed || isStandalone();
}
