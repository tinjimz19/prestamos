'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { money } from '@/lib/format';
import Pagination from '@/components/Pagination';
import { IconEye } from '@/components/icons';
import type { DashboardData, PrestamoListItem } from '@/types';

/* ---------- Grafico de barras (cobros por dia) ---------- */
function BarChart({ data }: { data: { label: string; full: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-1.5 h-40">
        {data.map((d, i) => (
          <div
            key={i}
            className="group flex-1 flex flex-col items-center justify-end h-full"
            title={`${d.full}: ${money(d.value)}`}
          >
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-brand to-brand-hover transition-all group-hover:opacity-80"
              style={{
                height: `${(d.value / max) * 100}%`,
                minHeight: d.value > 0 ? '3px' : '0',
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-muted">
            {i % 2 === 0 ? d.label : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Grafico de dona (prestamos por estado) ---------- */
function Donut({ activo, mora, pagado }: { activo: number; mora: number; pagado: number }) {
  const total = activo + mora + pagado;
  const R = 15.9155;
  const C = 2 * Math.PI * R;
  const segs = [
    { v: activo, c: 'rgb(var(--brand))' },
    { v: mora, c: 'rgb(var(--danger))' },
    { v: pagado, c: 'rgb(var(--success))' },
  ];
  let off = 0;
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
        <circle cx="20" cy="20" r={R} fill="none" strokeWidth="5" stroke="rgb(var(--surface-2))" />
        {total > 0 &&
          segs.map((s, i) => {
            const len = (s.v / total) * C;
            const el = (
              <circle
                key={i}
                cx="20"
                cy="20"
                r={R}
                fill="none"
                strokeWidth="5"
                stroke={s.c}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-off}
              />
            );
            off += len;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-content">{total}</span>
        <span className="text-xs text-muted">prestamos</span>
      </div>
    </div>
  );
}

const estadoBadge = (estado: string) =>
  estado === 'activo'
    ? 'bg-brand/15 text-brand'
    : estado === 'mora'
    ? 'bg-danger/15 text-danger'
    : estado === 'pagado'
    ? 'bg-success/15 text-success'
    : 'bg-surface-2 text-muted';

export default function DashboardPage() {
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [prestamos, setPrestamos] = useState<PrestamoListItem[]>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const s = getSession();
    setNombre(s?.user.nombre ?? '');
    setRol(s?.user.rol ?? '');
    if (s && (s.user.rol === 'admin' || s.user.rol === 'cajero')) {
      const token = s.token;
      Promise.all([
        api<DashboardData>('/reportes/dashboard', { token }),
        api<{ data: PrestamoListItem[] }>('/prestamos?estado=vigente', { token }),
      ])
        .then(([d, p]) => {
          setData(d);
          setPrestamos(p.data);
          setPage(1);
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
    }
  }, []);

  // serie de 14 dias (rellena dias sin cobros)
  const serie = (() => {
    if (!data) return [];
    const map = new Map(data.cobros_por_dia.map((s) => [s.dia.slice(0, 10), Number(s.total)]));
    const out: { label: string; full: string; value: number }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({
        label: String(d.getDate()),
        full: d.toLocaleDateString('es-VE'),
        value: map.get(key) ?? 0,
      });
    }
    return out;
  })();

  const totalCatorce = serie.reduce((s, d) => s + d.value, 0);
  const canSee = rol === 'admin' || rol === 'cajero';

  return (
    <div className="p-6 md:p-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-soft">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <h1 className="relative text-2xl md:text-3xl font-bold">
          Hola{nombre ? `, ${nombre}` : ''}
        </h1>
        <p className="relative opacity-90 mt-1">
          Resumen de tu cartera de prestamos y cobranzas
        </p>
      </div>

      {error && <div className="text-danger text-sm mt-4">{error}</div>}

      {canSee && !data && !error && (
        <div className="flex items-center justify-center py-24 text-brand">
          <span className="spinner" />
        </div>
      )}

      {!canSee && (
        <div className="mt-6 bg-surface rounded-xl border border-line shadow-soft p-6">
          <p className="text-muted">
            {rol === 'cobrador'
              ? 'Ve a "Mi ruta" para tus cobros de hoy.'
              : 'Bienvenido a tu panel.'}
          </p>
          {rol === 'cobrador' && (
            <Link
              href="/ruta"
              className="inline-block mt-3 bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg px-4 py-2 text-sm"
            >
              Ir a Mi ruta
            </Link>
          )}
        </div>
      )}

      {canSee && data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {[
              { k: 'Por cobrar', v: money(data.kpis.por_cobrar), c: 'text-content' },
              { k: 'Cobrado hoy', v: money(data.kpis.cobrado_hoy), c: 'text-success' },
              { k: 'En mora', v: String(data.kpis.en_mora), c: 'text-danger' },
              { k: 'Clientes', v: String(data.kpis.clientes), c: 'text-content' },
            ].map((it) => (
              <div
                key={it.k}
                className="bg-surface rounded-xl border border-line shadow-soft p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="text-xs text-muted">{it.k}</div>
                <div className={`text-xl font-bold mt-0.5 ${it.c}`}>{it.v}</div>
              </div>
            ))}
          </div>

          {/* Graficos */}
          <div className="grid lg:grid-cols-3 gap-4 mt-4">
            <div className="lg:col-span-2 bg-surface rounded-xl border border-line shadow-soft p-5">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-semibold text-content">Cobros ultimos 14 dias</h2>
                <span className="text-sm text-muted">
                  Total: <b className="text-content">{money(totalCatorce)}</b>
                </span>
              </div>
              <BarChart data={serie} />
            </div>

            <div className="bg-surface rounded-xl border border-line shadow-soft p-5">
              <h2 className="font-semibold text-content mb-3">Prestamos por estado</h2>
              <Donut
                activo={data.por_estado.activo}
                mora={data.por_estado.mora}
                pagado={data.por_estado.pagado}
              />
              <div className="mt-4 space-y-1.5 text-sm">
                {[
                  ['Activos', data.por_estado.activo, 'bg-brand'],
                  ['En mora', data.por_estado.mora, 'bg-danger'],
                  ['Pagados', data.por_estado.pagado, 'bg-success'],
                ].map(([label, val, dot]) => (
                  <div key={label as string} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted">
                      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                      {label}
                    </span>
                    <span className="font-medium text-content">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Prestamos activos */}
          <div className="mt-4 bg-surface rounded-xl border border-line shadow-soft overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-line">
              <h2 className="font-semibold text-content">Prestamos activos</h2>
              <span className="text-sm text-muted">{prestamos.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-muted">
                  <tr>
                    <th className="text-left px-4 py-2.5">Cliente</th>
                    <th className="text-left px-4 py-2.5">Modalidad</th>
                    <th className="text-right px-4 py-2.5">Monto</th>
                    <th className="text-right px-4 py-2.5">Saldo</th>
                    <th className="text-left px-4 py-2.5">Estado</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {prestamos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted">
                        No hay prestamos activos.
                      </td>
                    </tr>
                  ) : (
                    prestamos.slice((page - 1) * 10, page * 10).map((p) => (
                      <tr key={p.id} className="border-t border-line">
                        <td className="px-4 py-2.5 font-medium text-content">
                          {p.cliente_nombre}
                        </td>
                        <td className="px-4 py-2.5 capitalize text-muted">{p.modalidad}</td>
                        <td className="px-4 py-2.5 text-right text-muted">{money(p.monto)}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-content">
                          {money(p.saldo)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs capitalize ${estadoBadge(
                              p.estado,
                            )}`}
                          >
                            {p.estado}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end">
                            <Link href={`/prestamos/${p.id}`} title="Ver" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand hover:bg-brand/10 transition-colors">
                              <IconEye />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={prestamos.length} onPage={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
