'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession, type Session } from '@/lib/auth';
import ThemeToggle from '@/components/ThemeToggle';
import TopLoader from '@/components/TopLoader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/login');
      return;
    }
    if (s.user.rol !== 'superadmin') {
      router.replace('/dashboard');
      return;
    }
    setSession(s);
  }, [router]);

  if (!session) return null;

  function logout() {
    clearSession();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-bg text-content">
      <TopLoader />
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-surface/80 backdrop-blur border-b border-line">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-hover text-brand-fg font-bold shadow-sm shadow-brand/30">
            S
          </span>
          <div>
            <div className="font-bold leading-tight">Panel Superadmin</div>
            <div className="text-xs text-muted leading-tight">Casas de Prestamos</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="hidden sm:block text-sm text-muted mr-1">{session.user.nombre}</span>
          <button
            onClick={logout}
            title="Cerrar sesion"
            aria-label="Cerrar sesion"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-danger hover:bg-danger/10 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </header>
      <main className="animate-fade-in">{children}</main>
    </div>
  );
}
