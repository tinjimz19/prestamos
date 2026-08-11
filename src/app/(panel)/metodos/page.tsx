'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import Confirm from '@/components/Confirm';
import { IconX } from '@/components/icons';
import type { MetodoPago } from '@/types';

export default function MetodosPage() {
  const [items, setItems] = useState<MetodoPago[]>([]);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<MetodoPago | null>(null);

  async function cargar() {
    setError('');
    try {
      const token = getSession()?.token;
      const r = await api<{ data: MetodoPago[] }>('/metodos-pago/todos', { token });
      setItems(r.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function agregar() {
    if (!nombre.trim()) return;
    setBusy(true);
    setError('');
    try {
      const token = getSession()?.token;
      await api('/metodos-pago', { method: 'POST', token, body: { nombre } });
      setNombre('');
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: number) {
    const token = getSession()?.token;
    await api(`/metodos-pago/${id}/toggle`, { method: 'POST', token });
    await cargar();
  }

  async function eliminar() {
    if (!del) return;
    setBusy(true);
    try {
      const token = getSession()?.token;
      await api(`/metodos-pago/${del.id}`, { method: 'DELETE', token });
      setDel(null);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-content mb-1">Metodos de pago</h1>
      <p className="text-sm text-muted mb-6">Configura los metodos disponibles al registrar pagos.</p>
      {error && <div className="text-danger text-sm mb-3">{error}</div>}

      <div className="flex gap-2 mb-5">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nuevo metodo (ej: Zelle, Binance...)"
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
        />
        <button
          onClick={agregar}
          disabled={busy || !nombre.trim()}
          className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          Agregar
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-line shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="px-4 py-2.5 text-left">Metodo</th>
              <th className="px-4 py-2.5 text-left">Estado</th>
              <th className="px-4 py-2.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-muted">Sin metodos.</td></tr>
            ) : (
              items.map((m) => (
                <tr key={m.id} className="border-t border-line">
                  <td className="px-4 py-2.5 font-medium text-content">{m.nombre}</td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => toggle(m.id)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m.activo ? 'bg-success/15 text-success' : 'bg-surface-2 text-muted'}`}
                    >
                      {m.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setDel(m)}
                        title="Eliminar"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-danger hover:bg-danger/15 transition-colors"
                      >
                        <IconX />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Confirm
        open={del !== null}
        title="Eliminar metodo"
        message={`Eliminar el metodo "${del?.nombre}"? Los pagos ya registrados con el conservan su nombre.`}
        confirmLabel="Eliminar"
        danger
        loading={busy}
        onConfirm={eliminar}
        onClose={() => setDel(null)}
      />
    </div>
  );
}
