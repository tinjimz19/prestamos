'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import { money, fecha } from '@/lib/format';
import type { CajaResumen, Movimiento, Tasa, CierreInfo, CierreRow } from '@/types';

export default function CajaPage() {
  const hoy = new Date().toISOString().slice(0, 10);
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);
  const [resumen, setResumen] = useState<CajaResumen | null>(null);
  const [movs, setMovs] = useState<Movimiento[]>([]);
  const [movPage, setMovPage] = useState(1);
  const [error, setError] = useState('');

  const [open, setOpen] = useState(false);
  const [gasto, setGasto] = useState({ monto: '', descripcion: '' });
  const [gastoMsg, setGastoMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const [tasa, setTasa] = useState<Tasa | null>(null);
  const [tasaOpen, setTasaOpen] = useState(false);
  const [tasaManual, setTasaManual] = useState('');
  const [tasaMsg, setTasaMsg] = useState('');
  const [tasaBusy, setTasaBusy] = useState(false);

  const [cierreOpen, setCierreOpen] = useState(false);
  const [cierreInfo, setCierreInfo] = useState<CierreInfo | null>(null);
  const [contado, setContado] = useState('');
  const [cierreNota, setCierreNota] = useState('');
  const [cierreMsg, setCierreMsg] = useState('');
  const [cerrando, setCerrando] = useState(false);
  const [cierres, setCierres] = useState<CierreRow[]>([]);
  const [cierrePage, setCierrePage] = useState(1);

  const esAdmin = getSession()?.user.rol === 'admin';

  async function cargar() {
    setError('');
    try {
      const token = getSession()?.token;
      const q = `?desde=${desde}&hasta=${hasta}`;
      const [r, m, t, cs] = await Promise.all([
        api<CajaResumen>(`/caja/resumen${q}`, { token }),
        api<{ data: Movimiento[] }>(`/caja/movimientos${q}`, { token }),
        api<{ tasa: Tasa | null }>('/tasa', { token }),
        api<{ data: CierreRow[] }>('/caja/cierres', { token }),
      ]);
      setResumen(r);
      setMovs(m.data);
      setMovPage(1);
      setTasa(t.tasa);
      setCierres(cs.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function actualizarTasa(valor?: string) {
    setTasaMsg('');
    setTasaBusy(true);
    try {
      const token = getSession()?.token;
      const body = valor ? { valor } : {};
      const r = await api<{ tasa: Tasa }>('/tasa/actualizar', { method: 'POST', token, body });
      setTasa(r.tasa);
      setTasaOpen(false);
      setTasaManual('');
    } catch (e) {
      setTasaMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setTasaBusy(false);
    }
  }

  async function registrarGasto() {
    setGastoMsg('');
    const monto = Number(gasto.monto);
    if (!monto || monto <= 0 || !gasto.descripcion.trim()) {
      setGastoMsg('Completa monto y descripcion');
      return;
    }
    setSaving(true);
    try {
      const token = getSession()?.token;
      await api('/caja/gasto', { method: 'POST', token, body: { monto, descripcion: gasto.descripcion } });
      setGasto({ monto: '', descripcion: '' });
      setOpen(false);
      await cargar();
    } catch (e) {
      setGastoMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function abrirCierre() {
    setCierreMsg('');
    setCierreOpen(true);
    try {
      const token = getSession()?.token;
      const info = await api<CierreInfo>(`/caja/cierre?fecha=${hoy}`, { token });
      setCierreInfo(info);
      setContado(info.cierre ? info.cierre.contado : '');
      setCierreNota(info.cierre ? info.cierre.nota ?? '' : '');
    } catch (e) {
      setCierreMsg(e instanceof Error ? e.message : 'Error');
    }
  }

  async function guardarCierre() {
    if (!cierreInfo) return;
    setCierreMsg('');
    setCerrando(true);
    try {
      const token = getSession()?.token;
      await api('/caja/cierre', { method: 'POST', token, body: { fecha: cierreInfo.fecha, contado: Number(contado) || 0, nota: cierreNota } });
      setCierreOpen(false);
      await cargar();
    } catch (e) {
      setCierreMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setCerrando(false);
    }
  }

  const inputCls = 'rounded-lg border border-line px-3 py-2 text-sm';
  const pagedMovs = movs.slice((movPage - 1) * 10, movPage * 10);
  const pagedCierres = cierres.slice((cierrePage - 1) * 10, cierrePage * 10);
  const dif = cierreInfo ? (Number(contado) || 0) - cierreInfo.esperado : 0;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-content">Caja</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-surface border border-line rounded-lg px-3 py-1.5 text-sm">
            <span className="text-muted">Tasa hoy:</span>
            <span className="font-semibold text-content">{tasa ? `Bs ${money(tasa.valor)}` : 'sin tasa'}</span>
            {tasa && <span className="text-xs text-muted">({tasa.fuente})</span>}
            <button onClick={() => actualizarTasa()} disabled={tasaBusy} className="text-brand hover:underline text-xs disabled:opacity-60">Actualizar BCV</button>
            <button onClick={() => setTasaOpen(true)} className="text-muted hover:text-content text-xs">Manual</button>
          </div>
          <button
            onClick={abrirCierre}
            className="border border-line text-content hover:bg-surface-2 rounded-lg px-4 py-2 text-sm transition-colors"
          >
            Cerrar caja
          </button>
          {esAdmin && (
            <button
              onClick={() => setOpen(true)}
              className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 text-sm rounded-lg px-4 py-2"
            >
              + Gasto
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2 mb-6">
        <div className="space-y-1">
          <label className="text-xs text-muted">Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={`block ${inputCls}`} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted">Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={`block ${inputCls}`} />
        </div>
        <button onClick={cargar} className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg px-4 py-2 text-sm">Ver</button>
      </div>

      {error && <div className="text-danger text-sm mb-3">{error}</div>}

      {resumen && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-surface rounded-xl border border-line shadow-soft p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
            <div className="text-xs text-muted">Ingresos</div>
            <div className="text-xl font-bold text-success">{money(resumen.ingresos)}</div>
          </div>
          <div className="bg-surface rounded-xl border border-line shadow-soft p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
            <div className="text-xs text-muted">Egresos</div>
            <div className="text-xl font-bold text-danger">{money(resumen.egresos)}</div>
          </div>
          <div className="bg-surface rounded-xl border border-line shadow-soft p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
            <div className="text-xs text-muted">Neto</div>
            <div className="text-xl font-bold text-content">{money(resumen.neto)}</div>
          </div>
        </div>
      )}

      <h2 className="font-semibold text-content mb-2">Movimientos</h2>
      <div className="bg-surface rounded-xl border border-line shadow-soft overflow-x-auto mb-8">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="px-4 py-2.5 text-left">Fecha</th>
              <th className="px-4 py-2.5 text-left">Concepto</th>
              <th className="px-4 py-2.5 text-left">Descripcion</th>
              <th className="px-4 py-2.5 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {movs.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted">Sin movimientos en el rango</td></tr>
            ) : (
              pagedMovs.map((m) => (
                <tr key={m.id} className="border-t border-line">
                  <td className="px-4 py-2.5 text-muted">{fecha(m.fecha)}</td>
                  <td className="px-4 py-2.5 capitalize">{m.concepto}</td>
                  <td className="px-4 py-2.5 text-muted">{m.descripcion ?? '-'}</td>
                  <td className={`px-4 py-2.5 text-right font-medium ${m.tipo === 'ingreso' ? 'text-success' : 'text-danger'}`}>
                    {m.tipo === 'ingreso' ? '+' : '-'}{money(m.monto)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination page={movPage} total={movs.length} onPage={setMovPage} />
      </div>

      <h2 className="font-semibold text-content mb-2">Cierres de caja</h2>
      <div className="bg-surface rounded-xl border border-line shadow-soft overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="px-4 py-2.5 text-left">Fecha</th>
              <th className="px-4 py-2.5 text-right">Esperado</th>
              <th className="px-4 py-2.5 text-right">Contado</th>
              <th className="px-4 py-2.5 text-right">Diferencia</th>
              <th className="px-4 py-2.5 text-left">Por</th>
            </tr>
          </thead>
          <tbody>
            {cierres.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">Aun no hay cierres.</td></tr>
            ) : (
              pagedCierres.map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="px-4 py-2.5">{fecha(c.fecha)}</td>
                  <td className="px-4 py-2.5 text-right text-muted">{money(c.esperado)}</td>
                  <td className="px-4 py-2.5 text-right">{money(c.contado)}</td>
                  <td className={`px-4 py-2.5 text-right font-medium ${Number(c.diferencia) < 0 ? 'text-danger' : Number(c.diferencia) > 0 ? 'text-warning' : 'text-success'}`}>
                    {money(c.diferencia)}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{c.usuario_nombre ?? '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination page={cierrePage} total={cierres.length} onPage={setCierrePage} />
      </div>

      {/* Modal gasto */}
      <Modal open={open} onClose={() => setOpen(false)} title="Registrar gasto">
        {gastoMsg && <div className="text-sm text-danger mb-3">{gastoMsg}</div>}
        <div className="space-y-3">
          <input type="number" placeholder="Monto" value={gasto.monto} onChange={(e) => setGasto((g) => ({ ...g, monto: e.target.value }))} className={`w-full ${inputCls}`} />
          <input placeholder="Descripcion" value={gasto.descripcion} onChange={(e) => setGasto((g) => ({ ...g, descripcion: e.target.value }))} className={`w-full ${inputCls}`} />
          <button onClick={registrarGasto} disabled={saving} className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
            {saving ? 'Guardando...' : 'Registrar gasto'}
          </button>
        </div>
      </Modal>

      {/* Modal tasa */}
      <Modal open={tasaOpen} onClose={() => setTasaOpen(false)} title="Tasa manual (Bs por USD)">
        {tasaMsg && <div className="text-sm text-danger mb-3">{tasaMsg}</div>}
        <div className="space-y-3">
          <input type="number" placeholder="Ej: 40.50" value={tasaManual} onChange={(e) => setTasaManual(e.target.value)} className={`w-full ${inputCls}`} />
          <button onClick={() => actualizarTasa(tasaManual)} disabled={tasaBusy || !tasaManual} className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
            {tasaBusy ? 'Guardando...' : 'Guardar tasa'}
          </button>
        </div>
      </Modal>

      {/* Modal cierre */}
      <Modal open={cierreOpen} onClose={() => setCierreOpen(false)} title={`Cierre de caja - ${cierreInfo ? fecha(cierreInfo.fecha) : ''}`}>
        {cierreMsg && <div className="text-sm text-danger mb-3">{cierreMsg}</div>}
        {!cierreInfo ? (
          <div className="py-6 text-center text-brand"><span className="spinner" /></div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-surface-2 rounded-lg py-2">
                <div className="text-xs text-muted">Ingresos</div>
                <div className="font-semibold text-success">{money(cierreInfo.ingresos)}</div>
              </div>
              <div className="bg-surface-2 rounded-lg py-2">
                <div className="text-xs text-muted">Egresos</div>
                <div className="font-semibold text-danger">{money(cierreInfo.egresos)}</div>
              </div>
              <div className="bg-surface-2 rounded-lg py-2">
                <div className="text-xs text-muted">Esperado</div>
                <div className="font-semibold text-content">{money(cierreInfo.esperado)}</div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted">Efectivo contado</label>
              <input type="number" value={contado} onChange={(e) => setContado(e.target.value)} className={`w-full ${inputCls}`} />
            </div>

            <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-surface-2">
              <span className="text-sm text-muted">Diferencia</span>
              <span className={`font-bold ${dif < 0 ? 'text-danger' : dif > 0 ? 'text-warning' : 'text-success'}`}>
                {money(dif)} {dif < 0 ? '(faltante)' : dif > 0 ? '(sobrante)' : '(cuadra)'}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted">Nota (opcional)</label>
              <input value={cierreNota} onChange={(e) => setCierreNota(e.target.value)} className={`w-full ${inputCls}`} />
            </div>

            {cierreInfo.cierre && (
              <p className="text-xs text-muted">Ya cerrado por {cierreInfo.cierre.usuario_nombre ?? '-'}. Puedes actualizarlo.</p>
            )}

            <button onClick={guardarCierre} disabled={cerrando} className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
              {cerrando ? 'Guardando...' : 'Guardar cierre'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
