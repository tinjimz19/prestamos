'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { saveSession } from '@/lib/auth';
import Logo from '@/components/Logo';
import type { LoginResponse } from '@/types';

export default function PortalRegistroPage() {
  const router = useRouter();
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 4) {
      setError('La contrasena debe tener al menos 4 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contrasenas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const data = await api<LoginResponse>('/portal/registro', {
        method: 'POST',
        body: { cedula, password },
      });
      saveSession(data);
      router.push('/portal');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el acceso');
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition';

  return (
    <div className="flex items-center justify-center p-4 py-16">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-surface rounded-2xl shadow-soft border border-line p-8 space-y-5 animate-fade-in"
      >
        <div className="text-center flex flex-col items-center">
          <Logo size={48} className="mb-3 rounded-2xl shadow-sm shadow-brand/30" />
          <h1 className="text-xl font-bold text-content">Crear acceso</h1>
          <p className="text-sm text-muted mt-1">
            Usa la cedula que registraste en la oficina
          </p>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger text-sm rounded-lg px-3 py-2 border border-danger/30">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-content">Cedula</label>
          <input value={cedula} onChange={(e) => setCedula(e.target.value)} className={inputCls} required />
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
        <div className="space-y-1">
          <label className="text-sm font-medium text-content">Repetir contrasena</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg font-medium rounded-lg py-2.5 shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 transition-all disabled:opacity-60"
        >
          {loading ? 'Creando...' : 'Crear acceso'}
        </button>

        <p className="text-sm text-center text-muted">
          Ya tienes acceso?{' '}
          <Link href="/portal/login" className="text-brand hover:underline">
            Iniciar sesion
          </Link>
        </p>
      </form>
    </div>
  );
}
