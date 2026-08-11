'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { loadMiPlan } from '@/lib/plan';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import { IconEye } from '@/components/icons';
import type { Cliente, MiPlan } from '@/types';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [plan, setPlan] = useState<MiPlan | null>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: '', cedula: '', telefono: '', direccion: '', referencia: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function cargar() {
    setLoading(true);
    setError('');
    try {
      const token = getSession()?.token;
      const q = buscar ? `?buscar=${encodeURIComponent(buscar)}` : '';
      const res = await api<{ data: Cliente[] }>(`/clientes${q}`, { token });
      setClientes(res.data);
      setPage(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    loadMiPlan().then(setPlan);
  }, []);

  const limite = plan?.limits.clientes ?? null;
  const usoCli = plan?.uso.clientes ?? 0;
  const tope = limite !== null && usoCli >= limite;

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function crear() {
    setFormError('');
    if (!form.nombre.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const token = getSession()?.token;
      await api('/clientes', { method: 'POST', body: form, token });
      setForm({ nombre: '', cedula: '', telefono: '', direccion: '', referencia: '' });
      setOpen(false);
      await cargar();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, k: keyof typeof form, req = false) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-content">
        {label}
        {req ? ' *' : ''}
      </label>
      <input value={form[k]} onChange={(e) => set(k, e.target.value)} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
    </div>
  );

  const paged = clientes.slice((page - 1) * 10, page * 10);

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-content">Clientes</h1>
            {limite !== null && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${tope ? 'bg-danger/15 text-danger border-danger/30' : 'bg-surface-2 text-muted border-line'}`}>
                {usoCli} / {limite}
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen(true)}
            className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 text-sm rounded-lg px-4 py-2"
          >
            + Nuevo cliente
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); cargar(); }} className="mb-4 flex gap-2">
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por nombre, cedula o telefono"
            className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
          />
          <button className="rounded-lg border border-line px-4 text-sm hover:bg-surface-2 transition-colors">Buscar</button>
        </form>

        {error && <div className="text-danger text-sm mb-3">{error}</div>}

        <div className="bg-surface rounded-xl border border-line shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-muted">
              <tr>
                <th className="text-left px-4 py-2.5">Nombre</th>
                <th className="text-left px-4 py-2.5">Telefono</th>
                <th className="text-left px-4 py-2.5">Cedula</th>
                <th className="text-left px-4 py-2.5">Estado</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-brand"><span className="spinner" /></td></tr>
              ) : clientes.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">Sin clientes todavia</td></tr>
              ) : (
                paged.map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="px-4 py-2.5 font-medium text-content">{c.nombre}</td>
                    <td className="px-4 py-2.5 text-muted">{c.telefono ?? '-'}</td>
                    <td className="px-4 py-2.5 text-muted">{c.cedula ?? '-'}</td>
                    <td className="px-4 py-2.5 capitalize">{c.estado}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end">
                        <Link href={`/clientes/${c.id}`} title="Ver" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand hover:bg-brand/10 transition-colors">
                          <IconEye />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination page={page} total={clientes.length} onPage={setPage} />
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo cliente">
        {formError && <div className="bg-danger/10 text-danger text-sm rounded-lg px-3 py-2 mb-4">{formError}</div>}
        <div className="space-y-4">
          {field('Nombre', 'nombre', true)}
          {field('Cedula', 'cedula')}
          {field('Telefono', 'telefono')}
          {field('Direccion', 'direccion')}
          {field('Referencia', 'referencia')}
          <button onClick={crear} disabled={saving} className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg py-2.5 disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
