'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { fecha, money } from '@/lib/format';
import type { Ingresos } from '@/types';

export default function IngresosPage() {
  const [d, setD] = useState<Ingresos | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await api<Ingresos>('/ingresos', { token: getSession()?.token });
        setD(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error');
      }
    })();
  }, []);

  if (error) return <div className="p-6 md:p-8 text-danger text-sm">{error}</div>;
  if (!d) return <div className="p-6 md:p-8 text-muted text-sm">Cargando...</div>;

  const maxMes = Math.max(1, ...d.por_mes.map((m) => parseFloat(m.total)));

  const kpis = [
    { l: 'Ingresos del mes', v: '$' + money(d.kpis.este_mes), hi: true },
    { l: 'Total histórico', v: '$' + money(d.kpis.total) },
    { l: 'Casas activas', v: `${d.kpis.activas} / ${d.kpis.casas}` },
    { l: 'Bloqueadas', v: d.kpis.bloqueadas },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-content mb-1">Ingresos por membresías</h1>
      <p className="text-sm text-muted mb-6">Lo que tus casas te pagan por usar el sistema.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {kpis.map((k) => (
          <div key={k.l} className={`rounded-xl border shadow-soft p-4 ${k.hi ? 'bg-gradient-to-br from-brand to-brand-hover text-brand-fg border-transparent' : 'bg-surface border-line'}`}>
            <div className="text-2xl font-bold">{k.v}</div>
            <div className={`text-xs ${k.hi ? 'text-brand-fg/80' : 'text-muted'}`}>{k.l}</div>
          </div>
        ))}
      </div>

      {d.vencen_pronto.length > 0 && (
        <div className="bg-surface rounded-xl border border-line shadow-soft p-4 mb-6">
          <h2 className="font-semibold text-content mb-3">Por cobrar pronto</h2>
          <div className="space-y-2">
            {d.vencen_pronto.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-content">{v.nombre}</span>
                <span className={v.dias < 0 ? 'text-danger' : v.dias <= 3 ? 'text-brand' : 'text-muted'}>
                  {v.dias < 0 ? `vencida hace ${-v.dias}d` : v.dias === 0 ? 'vence hoy' : `vence en ${v.dias}d`} · {fecha(v.fecha_vencimiento)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Ingresos por mes */}
        <div className="bg-surface rounded-xl border border-line shadow-soft p-4">
          <h2 className="font-semibold text-content mb-4">Ingresos por mes</h2>
          {d.por_mes.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay pagos registrados.</p>
          ) : (
            <div className="space-y-2">
              {d.por_mes.map((m) => (
                <div key={m.mes} className="flex items-center gap-3">
                  <span className="text-xs text-muted w-16 shrink-0">{m.mes}</span>
                  <div className="flex-1 h-5 bg-surface-2 rounded overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand to-brand-hover" style={{ width: `${(parseFloat(m.total) / maxMes) * 100}%` }} />
                  </div>
                  <span className="text-xs text-content w-20 text-right shrink-0">${money(m.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagos recientes */}
        <div className="bg-surface rounded-xl border border-line shadow-soft overflow-hidden">
          <h2 className="font-semibold text-content p-4 pb-2">Pagos recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Casa</th>
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {d.recientes.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-4 py-2 font-medium text-content">{p.casa}</td>
                    <td className="px-4 py-2 text-muted">{fecha(p.fecha)}</td>
                    <td className="px-4 py-2 text-right">${money(p.monto)}</td>
                  </tr>
                ))}
                {d.recientes.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted">Sin pagos aún.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Por casa */}
      <div className="bg-surface rounded-xl border border-line shadow-soft overflow-hidden mt-6">
        <h2 className="font-semibold text-content p-4 pb-2">Total pagado por casa</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-muted">
              <tr>
                <th className="px-4 py-2 text-left">Casa</th>
                <th className="px-4 py-2 text-center">Pagos</th>
                <th className="px-4 py-2 text-left">Último</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {d.por_casa.map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="px-4 py-2 font-medium text-content">{c.nombre}</td>
                  <td className="px-4 py-2 text-center text-muted">{c.n}</td>
                  <td className="px-4 py-2 text-muted">{c.ultimo ? fecha(c.ultimo) : '—'}</td>
                  <td className="px-4 py-2 text-right">${money(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
