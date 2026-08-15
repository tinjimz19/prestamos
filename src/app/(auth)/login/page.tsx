'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { saveSession } from '@/lib/auth';
import ThemeToggle from '@/components/ThemeToggle';
import TopLoader from '@/components/TopLoader';
import Logo from '@/components/Logo';
import type { LoginResponse } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@prestamos.local');
  const [password, setPassword] = useState('');
  const [recordar, setRecordar] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email, password, recordar },
      });
      saveSession(data);
      router.push(data.user.rol === 'superadmin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition';

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 bg-bg overflow-hidden">
      <TopLoader />
      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute -top-32 -right-24 w-96 h-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-brand/10 blur-3xl" />

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-sm bg-surface rounded-2xl shadow-soft border border-line p-8 space-y-5 animate-fade-in"
      >
        <div className="flex flex-col items-center text-center">
          <Logo size={56} className="mb-3 rounded-2xl shadow-sm shadow-brand/30" />
          <h1 className="text-xl font-bold text-content">SisPrest</h1>
          <p className="text-sm text-muted mt-1">Inicia sesion para continuar</p>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger text-sm rounded-lg px-3 py-2 border border-danger/30">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-content">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-content">Contrasena</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-muted select-none cursor-pointer">
          <input
            type="checkbox"
            checked={recordar}
            onChange={(e) => setRecordar(e.target.checked)}
            className="accent-brand w-4 h-4"
          />
          Recordar este dispositivo (60 dias)
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md hover:shadow-brand/40 active:scale-95 font-medium rounded-lg py-2.5 transition-colors disabled:opacity-60"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <div className="text-center">
          <a href="/recuperar" className="text-xs text-brand hover:underline">Olvidaste tu contrasena?</a>
        </div>

        <div className="text-center text-sm border-t border-line pt-4">
          <span className="text-muted">Eres cliente? </span>
          <a href="/portal/login" className="text-brand hover:underline">Entra a tu portal</a>
        </div>
      </form>
    </main>
  );
}
