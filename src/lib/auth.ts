'use client';

import type { User } from '@/types';

const KEY = 'prestamos_session';

export interface Session {
  token: string;
  user: User;
}

export function saveSession(s: Session): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  }
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY);
  try {
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(KEY);
  }
}
