'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';

export default function NuevoClientePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    email: '',
    direccion: '',
    referencia: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const token = getSession()?.token;
      const res = await api<{ id: number }>('/clientes', {
        method: 'POST',
        body: form,
        token,
      });
      router.push(`/clientes/${res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setSaving(false);
    }
  }

  const field = (label: string, k: keyof typeof form, req = false) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-content">
        {label}
        {req ? ' *' : ''}
      </label>
      <input
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        required={req}
        className="w-full rounded-lg border border-line px-3 py-2 text-sm"
      />
    </div>
  );

  return (
    <div className="p-8">
      <Link href="/clientes" className="text-sm text-brand hover:underline">
        Volver a clientes
      </Link>
      <h1 className="text-2xl font-bold text-content mt-2 mb-6">Nuevo cliente</h1>
      {error && (
        <div className="bg-danger/10 text-danger text-sm rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="bg-surface rounded-xl border border-line shadow-soft p-6 space-y-4">
        {field('Nombre', 'nombre', true)}
        {field('Cedula', 'cedula')}
        {field('Telefono', 'telefono')}
        {field('Correo (para recibos)', 'email')}
        {field('Direccion', 'direccion')}
        {field('Referencia', 'referencia')}
        <button
          disabled={saving}
          className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md hover:shadow-brand/40 active:scale-95 rounded-lg py-2.5 disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar cliente'}
        </button>
      </form>
    </div>
  );
}
