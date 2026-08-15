'use client';

import { useEffect, useState } from 'react';
import { api, apiBase } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { money, fecha } from '@/lib/format';
import Pagination from '@/components/Pagination';
import Confirm from '@/components/Confirm';
import { IconCheck, IconX } from '@/components/icons';
import type { PagoReportado } from '@/types';

export default function PagosReportadosPage() {
  const [items, setItems] = useState<PagoReportado[]>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{ id: number; tipo: 'validar' | 'rechazar' } | null>(null);
  const [busy, setBusy] = useState(false);

  async function cargar() {
    setError('');
    try {
      const token = getSession()?.token;
      const r = await api<{ data: PagoReportado[] }>('/pagos-reportados', { token });
      setItems(r.data);
      setPage(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function ejecutar() {
    if (!confirm) return;
    setBusy(true);
    setError('');
    try {
      const token = getSession()?.token;
      await api(`/pagos-reportados/${confirm.id}/${confirm.tipo}`, { method: 'POST', token });
      setConfirm(null);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  const paged = items.slice((page - 1) * 10, page * 10);
  const iconBtn = 'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors';

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content mb-1">Pagos reportados</h1>
      <p className="text-sm text-muted mb-6">
        Pagos que los clientes informaron desde su portal, pendientes de validar.
      </p>
      {error && <div className="text-danger text-sm mb-3">{error}</div>}

      <div className="bg-surface rounded-xl border border-line shadow-soft overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="px-4 py-2.5 text-left">Fecha</th>
              <th className="px-4 py-2.5 text-left">Cliente</th>
              <th className="px-4 py-2.5 text-left">Prestamo</th>
              <th className="px-4 py-2.5 text-right">Monto</th>
              <th className="px-4 py-2.5 text-left">Referencia</th>
              <th className="px-4 py-2.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">No hay pagos por validar.</td>
              </tr>
            ) : (
              paged.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-2.5 text-muted">{fecha(r.fecha)}</td>
                  <td className="px-4 py-2.5 font-medium text-content">{r.cliente}</td>
                  <td className="px-4 py-2.5">#{r.prestamo_id}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-content">
                    {r.moneda === 'VES' ? `Bs ${money(r.monto)}` : money(r.monto)}
                  </td>
                  <td className="px-4 py-2.5 text-muted">
                    {r.referencia ?? '-'}
                    {r.comprobante && (
                      <>
                        {' · '}
                        <a href={`${apiBase}/${r.comprobante}`} target="_blank" rel="noreferrer" className="text-brand hover:underline">comprobante</a>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setConfirm({ id: r.id, tipo: 'validar' })}
                        title="Validar"
                        className={`${iconBtn} text-success hover:bg-success/15`}
                      >
                        <IconCheck />
                      </button>
                      <button
                        onClick={() => setConfirm({ id: r.id, tipo: 'rechazar' })}
                        title="Rechazar"
                        className={`${iconBtn} text-danger hover:bg-danger/15`}
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
        <Pagination page={page} total={items.length} onPage={setPage} />
      </div>

      <Confirm
        open={confirm !== null}
        title={confirm?.tipo === 'validar' ? 'Validar pago' : 'Rechazar pago'}
        message={
          confirm?.tipo === 'validar'
            ? 'Se registrara el pago y se descontara del saldo del prestamo. Continuar?'
            : 'Se marcara el reporte como rechazado. Continuar?'
        }
        confirmLabel={confirm?.tipo === 'validar' ? 'Validar' : 'Rechazar'}
        danger={confirm?.tipo === 'rechazar'}
        loading={busy}
        onConfirm={ejecutar}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
