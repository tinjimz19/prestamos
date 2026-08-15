'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, apiDownload } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { loadMiPlan, cachedPlan } from '@/lib/plan';
import { money } from '@/lib/format';
import Pagination from '@/components/Pagination';
import { IconEye } from '@/components/icons';
import type { CarteraReporte, Ganancias } from '@/types';

export default function ReportesPage() {
  const hoy = new Date().toISOString().slice(0, 10);
  const [rep, setRep] = useState<CarteraReporte | null>(null);
  const [gan, setGan] = useState<Ganancias | null>(null);
  const [desde, setDesde] = useState(hoy.slice(0, 8) + '01');
  const [hasta, setHasta] = useState(hoy);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [excel, setExcel] = useState<boolean>(() => {
    const p = cachedPlan();
    return p ? p.features.includes('excel') : true;
  });

  async function cargarGanancias() {
    try {
      const token = getSession()?.token;
      const g = await api<Ganancias>(`/reportes/ganancias?desde=${desde}&hasta=${hasta}`, { token });
      setGan(g);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  useEffect(() => {
    const token = getSession()?.token;
    api<CarteraReporte>('/reportes/cartera', { token })
      .then(setRep)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
    cargarGanancias();
    loadMiPlan().then((p) => p && setExcel(p.features.includes('excel')));
  }, []);

  async function exportar(tipo: string, filename: string) {
    const token = getSession()?.token;
    await apiDownload(`/reportes/export?tipo=${tipo}&desde=${desde}&hasta=${hasta}`, filename, token);
  }

  if (error && !rep) return <div className="p-8 text-danger">{error}</div>;
  if (!rep) return <div className="p-8 text-brand flex items-center justify-center py-24"><span className="spinner" /></div>;

  const tarjetas: [string, string, string][] = [
    ['Capital prestado', money(rep.prestado), 'text-content'],
    ['Total a cobrar', money(rep.a_cobrar), 'text-content'],
    ['Cobrado', money(rep.cobrado), 'text-success'],
    ['Por cobrar', money(rep.por_cobrar), 'text-warning'],
    ['Ganancia esperada', money(rep.ganancia_esperada), 'text-brand'],
  ];
  const paged = rep.morosos.slice((page - 1) * 10, page * 10);
  const btnOutline = 'border border-line text-content hover:bg-surface-2 rounded-lg px-4 py-2 text-sm transition-colors';
  const pct = gan && gan.esperado_vs_real.esperado > 0 ? Math.round((gan.esperado_vs_real.real / gan.esperado_vs_real.esperado) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content mb-6">Reportes</h1>

      {/* Rango + exportar */}
      <div className="bg-surface rounded-xl border border-line shadow-soft p-4 mb-6">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted">Desde</label>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="block rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted">Hasta</label>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="block rounded-lg border border-line px-3 py-2 text-sm" />
          </div>
          <button onClick={cargarGanancias} className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg px-4 py-2 text-sm">Ver</button>
          <div className="flex-1" />
          {excel && (
            <>
              <span className="text-xs text-muted self-center">Exportar a Excel:</span>
              <button onClick={() => exportar('cartera', 'cartera.xlsx')} className={btnOutline}>Cartera</button>
              <button onClick={() => exportar('pagos', `pagos_${desde}_${hasta}.xlsx`)} className={btnOutline}>Pagos</button>
              <button onClick={() => exportar('caja', `caja_${desde}_${hasta}.xlsx`)} className={btnOutline}>Caja</button>
            </>
          )}
        </div>
      </div>

      {/* Cartera */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {tarjetas.map(([k, v, c]) => (
          <div key={k} className="bg-surface rounded-xl border border-line shadow-soft p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
            <div className="text-xs text-muted">{k}</div>
            <div className={`text-lg font-bold ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[['Prestamos', rep.n_prestamos], ['Activos', rep.activos], ['En mora', rep.en_mora], ['Pagados', rep.pagados]].map(([k, v]) => (
          <div key={k} className="bg-surface-2 rounded-xl p-4 text-center transition-all duration-200 hover:-translate-y-0.5">
            <div className="text-2xl font-bold text-content">{v}</div>
            <div className="text-xs text-muted">{k}</div>
          </div>
        ))}
      </div>

      {/* Ganancias */}
      {gan && (
        <div className="mb-8">
          <h2 className="font-semibold text-content mb-3">Ganancias del periodo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-surface rounded-xl border border-line shadow-soft p-4">
              <div className="text-xs text-muted">Cobrado</div>
              <div className="text-lg font-bold text-content">{money(gan.periodo.cobrado)}</div>
            </div>
            <div className="bg-surface rounded-xl border border-line shadow-soft p-4">
              <div className="text-xs text-muted">Ganancia (interes)</div>
              <div className="text-lg font-bold text-success">{money(gan.periodo.interes)}</div>
            </div>
            <div className="bg-surface rounded-xl border border-line shadow-soft p-4">
              <div className="text-xs text-muted">Capital recuperado</div>
              <div className="text-lg font-bold text-content">{money(gan.periodo.capital)}</div>
            </div>
            <div className="bg-surface rounded-xl border border-line shadow-soft p-4">
              <div className="text-xs text-muted">Interes cobrado / esperado</div>
              <div className="text-lg font-bold text-brand">{pct}%</div>
              <div className="text-xs text-muted">{money(gan.esperado_vs_real.real)} de {money(gan.esperado_vs_real.esperado)}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted mb-1">Por modalidad</h3>
              <div className="bg-surface rounded-xl border border-line shadow-soft overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead className="bg-surface-2 text-muted"><tr><th className="px-4 py-2 text-left">Modalidad</th><th className="px-4 py-2 text-right">Cobrado</th><th className="px-4 py-2 text-right">Ganancia</th></tr></thead>
                  <tbody>
                    {gan.por_modalidad.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-4 text-center text-muted">Sin datos</td></tr>
                    ) : gan.por_modalidad.map((m) => (
                      <tr key={m.modalidad} className="border-t border-line">
                        <td className="px-4 py-2 capitalize">{m.modalidad}</td>
                        <td className="px-4 py-2 text-right text-muted">{money(m.cobrado)}</td>
                        <td className="px-4 py-2 text-right text-success font-medium">{money(m.interes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted mb-1">Por cobrador</h3>
              <div className="bg-surface rounded-xl border border-line shadow-soft overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead className="bg-surface-2 text-muted"><tr><th className="px-4 py-2 text-left">Cobrador</th><th className="px-4 py-2 text-right">Cobrado</th><th className="px-4 py-2 text-right">Ganancia</th></tr></thead>
                  <tbody>
                    {gan.por_cobrador.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-4 text-center text-muted">Sin datos</td></tr>
                    ) : gan.por_cobrador.map((m) => (
                      <tr key={m.cobrador} className="border-t border-line">
                        <td className="px-4 py-2">{m.cobrador}</td>
                        <td className="px-4 py-2 text-right text-muted">{money(m.cobrado)}</td>
                        <td className="px-4 py-2 text-right text-success font-medium">{money(m.interes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Morosos */}
      <h2 className="font-semibold text-content mb-2">Morosos ({rep.morosos.length})</h2>
      <div className="bg-surface rounded-xl border border-line shadow-soft overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead className="bg-surface-2 text-muted">
            <tr><th className="px-4 py-2.5 text-left">Cliente</th><th className="px-4 py-2.5 text-left">Telefono</th><th className="px-4 py-2.5 text-right">Saldo</th><th className="px-4 py-2.5"></th></tr>
          </thead>
          <tbody>
            {rep.morosos.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted">Sin morosos. Buen trabajo.</td></tr>
            ) : paged.map((m) => (
              <tr key={m.id} className="border-t border-line">
                <td className="px-4 py-2.5 font-medium text-content">{m.cliente}</td>
                <td className="px-4 py-2.5 text-muted">{m.telefono ?? '-'}</td>
                <td className="px-4 py-2.5 text-right text-danger font-medium">{money(m.saldo)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end">
                    <Link href={`/prestamos/${m.id}`} title="Ver" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand hover:bg-brand/10 transition-colors"><IconEye /></Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} total={rep.morosos.length} onPage={setPage} />
      </div>
    </div>
  );
}
