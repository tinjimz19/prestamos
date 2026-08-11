'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import Pagination from '@/components/Pagination';
import type { AuditoriaItem } from '@/types';

function fechaHora(iso: string) {
  if (!iso) return '';
  const [d, t] = iso.replace('T', ' ').split(' ');
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y} ${(t || '').slice(0, 5)}`;
}

const color = (a: string) =>
  a.startsWith('Rechazo')
    ? 'bg-danger/15 text-danger'
    : a.startsWith('Valido') || a.startsWith('Registro pago') || a.startsWith('Creo prestamo')
    ? 'bg-success/15 text-success'
    : a.startsWith('Inicio') || a.startsWith('Registro de acceso')
    ? 'bg-surface-2 text-muted'
    : 'bg-brand/15 text-brand';

export default function AuditoriaPage() {
  const [items, setItems] = useState<AuditoriaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [acciones, setAcciones] = useState<string[]>([]);
  const [error, setError] = useState('');

  const [fAccion, setFAccion] = useState('');
  const [fUsuario, setFUsuario] = useState('');
  const [fDesde, setFDesde] = useState('');
  const [fHasta, setFHasta] = useState('');

  async function cargar(p: number) {
    setError('');
    try {
      const token = getSession()?.token;
      const params = new URLSearchParams();
      params.set('page', String(p));
      if (fAccion) params.set('accion', fAccion);
      if (fUsuario) params.set('usuario', fUsuario);
      if (fDesde) params.set('desde', fDesde);
      if (fHasta) params.set('hasta', fHasta);
      const r = await api<{ data: AuditoriaItem[]; total: number; page: number; acciones: string[] }>(
        `/auditoria?${params.toString()}`,
        { token },
      );
      setItems(r.data);
      setTotal(r.total);
      setAcciones(r.acciones);
      setPage(r.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  useEffect(() => {
    cargar(1);
  }, []);

  const inputCls = 'rounded-lg border border-line px-3 py-2 text-sm';

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content mb-1">Auditoria</h1>
      <p className="text-sm text-muted mb-6">Registro de acciones de los usuarios en el sistema.</p>

      <div className="flex flex-wrap items-end gap-2 mb-4">
        <div className="space-y-1">
          <label className="text-xs text-muted">Usuario</label>
          <input value={fUsuario} onChange={(e) => setFUsuario(e.target.value)} placeholder="Nombre" className={`block ${inputCls}`} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted">Accion</label>
          <select value={fAccion} onChange={(e) => setFAccion(e.target.value)} className={`block ${inputCls}`}>
            <option value="">Todas</option>
            {acciones.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted">Desde</label>
          <input type="date" value={fDesde} onChange={(e) => setFDesde(e.target.value)} className={`block ${inputCls}`} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted">Hasta</label>
          <input type="date" value={fHasta} onChange={(e) => setFHasta(e.target.value)} className={`block ${inputCls}`} />
        </div>
        <button
          onClick={() => cargar(1)}
          className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg px-4 py-2 text-sm"
        >
          Filtrar
        </button>
      </div>

      {error && <div className="text-danger text-sm mb-3">{error}</div>}

      <div className="bg-surface rounded-xl border border-line shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="px-4 py-2.5 text-left">Fecha</th>
              <th className="px-4 py-2.5 text-left">Usuario</th>
              <th className="px-4 py-2.5 text-left">Accion</th>
              <th className="px-4 py-2.5 text-left">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Sin registros.</td></tr>
            ) : (
              items.map((a) => (
                <tr key={a.id} className="border-t border-line">
                  <td className="px-4 py-2.5 text-muted whitespace-nowrap">{fechaHora(a.fecha)}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-content">{a.usuario_nombre ?? '-'}</span>
                    {a.rol && <span className="text-xs text-muted capitalize"> · {a.rol}</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${color(a.accion)}`}>{a.accion}</span>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{a.detalle ?? '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination page={page} total={total} pageSize={12} onPage={(p) => cargar(p)} />
      </div>
    </div>
  );
}
