'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession, clearSession, type Session } from '@/lib/auth';
import { api } from '@/lib/api';
import { loadMiPlan } from '@/lib/plan';
import ThemeToggle from '@/components/ThemeToggle';
import TopLoader from '@/components/TopLoader';
import Logo from '@/components/Logo';
import type { Rol, MiPlan } from '@/types';

const ICONS: Record<string, string> = {
  '/dashboard': 'M3 9.5 12 3l9 6.5M5 9v11h14V9',
  '/ruta': 'M9 20l-6 3V6l6-3 6 3 6-3v17l-6 3-6-3zM9 3v17M15 6v17',
  '/clientes': 'M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8',
  '/prestamos/nuevo': 'M12 8v8M8 12h8M21 12a9 9 0 11-18 0 9 9 0 0118 0',
  '/alertas': 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  '/caja': 'M2 7h20v10H2zM6 12h.01M18 12h.01M12 15a3 3 0 100-6 3 3 0 000 6',
  '/reportes': 'M4 20V10M10 20V4M16 20v-6M22 20H2',
  '/usuarios': 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M22 21v-2a4 4 0 00-3-3.87',
  '/pagos-reportados': 'M8 3h8l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1zM9 13l2 2 4-4',
  '/metodos': 'M2 7h20v10H2zM2 11h20M6 15h4',
  '/auditoria': 'M9 4h6a1 1 0 011 1v1H8V5a1 1 0 011-1zM8 6H6a1 1 0 00-1 1v13a1 1 0 001 1h12a1 1 0 001-1V7a1 1 0 00-1-1h-2M9 11h6M9 15h4',
  '/configuracion': 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7.7 1.6 1.6 0 01-3.2 0 1.6 1.6 0 00-2.7-.7l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.3-2.7 1.6 1.6 0 010-3.2 1.6 1.6 0 001.3-2.7l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3h.1a1.6 1.6 0 001-1.5 1.6 1.6 0 013.2 0 1.6 1.6 0 001 1.5h.1a1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8v.1a1.6 1.6 0 001.5 1 1.6 1.6 0 010 3.2 1.6 1.6 0 00-1.5 1z',
  '/dispositivos': 'M12 18h.01M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z',
};

const ITEMS: { href: string; label: string; roles: Rol[]; feature?: string }[] = [
  { href: '/dashboard', label: 'Inicio', roles: ['admin', 'cajero', 'cobrador', 'cliente'] },
  { href: '/ruta', label: 'Mi ruta', roles: ['cobrador'] },
  { href: '/clientes', label: 'Clientes', roles: ['admin', 'cajero', 'cobrador'] },
  { href: '/prestamos/nuevo', label: 'Nuevo prestamo', roles: ['admin', 'cajero'] },
  { href: '/alertas', label: 'Alertas', roles: ['admin', 'cajero'] },
  { href: '/caja', label: 'Caja', roles: ['admin', 'cajero'] },
  { href: '/pagos-reportados', label: 'Pagos reportados', roles: ['admin', 'cajero'], feature: 'portal' },
  { href: '/reportes', label: 'Reportes', roles: ['admin'] },
  { href: '/usuarios', label: 'Usuarios', roles: ['admin'] },
  { href: '/auditoria', label: 'Auditoria', roles: ['admin'], feature: 'auditoria' },
  { href: '/configuracion', label: 'Configuracion', roles: ['admin'] },
  { href: '/dispositivos', label: 'Dispositivos', roles: ['admin', 'cajero', 'cobrador', 'cliente'] },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function NavItem({
  href,
  label,
  active,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-2 py-2 transition-all duration-200 ${
        collapsed ? 'justify-center' : ''
      } ${
        active
          ? 'bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-md shadow-brand/30'
          : 'text-muted hover:text-content hover:bg-surface-2'
      }`}
    >
      <span
        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-colors ${
          active ? 'bg-white/20 text-brand-fg' : 'text-muted group-hover:text-brand group-hover:bg-surface'
        }`}
      >
        <NavIcon d={ICONS[href] ?? ''} />
      </span>
      {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 px-2 py-1 rounded-md bg-content text-bg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
          {label}
        </span>
      )}
    </Link>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [plan, setPlan] = useState<MiPlan | null>(null);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sidebar') === 'collapsed';
  });

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/login');
      return;
    }
    if (s.user.rol === 'superadmin') {
      router.replace('/admin');
      return;
    }
    setSession(s);
    loadMiPlan().then(setPlan);
  }, [router]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!session) return null;

  const nav = ITEMS.filter(
    (i) => i.roles.includes(session.user.rol) && (!i.feature || !plan || plan.features.includes(i.feature)),
  );

  const planChip = plan?.plan_nombre ? (
    <div className="text-[11px] text-muted">
      Plan <span className="text-content font-medium">{plan.plan_nombre}</span>
      {plan.limits.clientes !== null && (
        <span> · {plan.uso.clientes}/{plan.limits.clientes} clientes</span>
      )}
    </div>
  ) : null;

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST', token: getSession()?.token });
    } catch {
      /* aunque falle, cerramos localmente */
    }
    clearSession();
    router.replace('/login');
  }

  function toggleCollapse() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem('sidebar', next ? 'collapsed' : 'expanded');
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const initials = (session.user.nombre || '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const Avatar = () => (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg text-sm font-bold shrink-0 shadow-sm shadow-brand/30">
      {initials}
    </span>
  );

  const LogoutIcon = () => (
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
  );

  const brand = (mini: boolean) => (
    <div className="flex items-center gap-2">
      <Logo size={36} className="rounded-xl shadow-sm shadow-brand/30" />
      {!mini && <span className="font-bold text-content">SisPrest</span>}
    </div>
  );

  return (
    <div className="min-h-screen bg-bg text-content">
      <TopLoader />

      {/* Sidebar (escritorio) */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-surface border-r border-line transition-all duration-300 ${
          collapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        {/* Boton contraer flotante */}
        <button
          onClick={toggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Contraer menu'}
          aria-label="Contraer menu"
          className="absolute -right-3 top-16 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-surface border border-line shadow-soft text-muted hover:text-brand hover:border-brand transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className={`flex items-center h-16 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {brand(collapsed)}
          {!collapsed && <ThemeToggle />}
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {nav.map((n) => (
            <NavItem
              key={n.href}
              href={n.href}
              label={n.label}
              active={pathname === n.href}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-line">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <ThemeToggle />
              <span title={session.user.nombre}>
                <Avatar />
              </span>
              <LogoutIcon />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Avatar />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-content truncate">
                  {session.user.nombre}
                </div>
                <div className="text-xs text-muted capitalize">{session.user.rol}</div>
                {planChip}
              </div>
              <LogoutIcon />
            </div>
          )}
        </div>
      </aside>

      {/* Header (movil) */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-surface/80 backdrop-blur border-b border-line">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:bg-surface-2"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {brand(false)}
        <ThemeToggle />
      </header>

      {/* Drawer (movil) */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
        <aside
          className={`absolute left-0 top-0 h-full w-72 bg-surface border-r border-line p-3 flex flex-col transition-transform duration-300 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between h-14 px-1 mb-2">
            {brand(false)}
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menu"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:bg-surface-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {nav.map((n) => (
              <NavItem
                key={n.href}
                href={n.href}
                label={n.label}
                active={pathname === n.href}
                collapsed={false}
                onClick={() => setOpen(false)}
              />
            ))}
          </nav>
          <div className="flex items-center gap-2 px-1 py-3 border-t border-line">
            <Avatar />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-content truncate">
                {session.user.nombre}
              </div>
              <div className="text-xs text-muted capitalize">{session.user.rol}</div>
            </div>
            <LogoutIcon />
          </div>
        </aside>
      </div>

      {/* Contenido */}
      <div className={`transition-all duration-300 ${collapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        <main className="animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
