'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import TopLoader from '@/components/TopLoader';
import Logo from '@/components/Logo';

export default function RecuperarPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<'email' | 'codigo'>('email');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputCls = 'w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition';

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      const r = await api<{ message: string }>('/auth/recuperar', { method: 'POST', body: { email } });
      setInfo(r.message);
      setPaso('codigo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function restablecer(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      await api('/auth/restablecer', { method: 'POST', body: { email, codigo, password } });
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 bg-bg overflow-hidden">
      <TopLoader />
      <div className="pointer-events-none absolute -top-32 -right-24 w-96 h-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-brand/10 blur-3xl" />
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <div className="relative w-full max-w-sm bg-surface rounded-2xl shadow-soft border border-line p-8 space-y-5 animate-fade-in">
        <div className="text-center flex flex-col items-center">
          <Logo size={48} className="mb-3 rounded-2xl shadow-sm shadow-brand/30" />
          <h1 className="text-xl font-bold text-content">Recuperar contrasena</h1>
          <p className="text-sm text-muted mt-1">
            {paso === 'email' ? 'Te enviaremos un codigo a tu correo' : 'Escribe el codigo que te llego y tu nueva clave'}
          </p>
        </div>

        {error && <div className="bg-danger/10 text-danger text-sm rounded-lg px-3 py-2 border border-danger/30">{error}</div>}
        {info && <div className="bg-brand/10 text-brand text-sm rounded-lg px-3 py-2 border border-brand/30">{info}</div>}

        {paso === 'email' ? (
          <form onSubmit={enviarCodigo} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-content">Correo</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 font-medium rounded-lg py-2.5 transition-colors disabled:opacity-60">
              {loading ? 'Enviando...' : 'Enviar codigo'}
            </button>
          </form>
        ) : (
          <form onSubmit={restablecer} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-content">Codigo (6 digitos)</label>
              <input value={codigo} onChange={(e) => setCodigo(e.target.value)} className={inputCls} inputMode="numeric" maxLength={6} required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-content">Nueva contrasena</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 font-medium rounded-lg py-2.5 transition-colors disabled:opacity-60">
              {loading ? 'Guardando...' : 'Cambiar contrasena'}
            </button>
            <button type="button" onClick={() => { setPaso('email'); setInfo(''); setError(''); }} className="w-full text-xs text-muted hover:text-content">
              Volver a pedir el codigo
            </button>
          </form>
        )}

        <div className="text-center text-sm border-t border-line pt-4">
          <Link href="/login" className="text-brand hover:underline">Volver a iniciar sesion</Link>
        </div>
      </div>
    </main>
  );
}
