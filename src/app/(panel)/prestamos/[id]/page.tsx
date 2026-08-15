'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, apiBase } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { loadMiPlan, cachedPlan } from '@/lib/plan';
import Modal from '@/components/Modal';
import Confirm from '@/components/Confirm';
import Pagination from '@/components/Pagination';
import { money, fecha } from '@/lib/format';
import { waLink } from '@/lib/whatsapp';
import { imprimirRecibo } from '@/lib/recibo';
import type { Prestamo, CuotaPlan, Pago, MoraResumen, Tasa, MetodoPago, SimulacionResponse } from '@/types';

interface Cuota extends CuotaPlan {
  id: number;
  pagado: string;
  estado: string;
}
interface DetalleResponse {
  data: Prestamo;
  cuotas: Cuota[];
  pagos: Pago[];
  mora: MoraResumen;
}

function WaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-2.8.7.8-2.7-.2-.3A8 8 0 1112 20zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.6 6.6 0 01-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.7.7-.9 1.6-.5 2.7a11 11 0 004.9 4.7c1.6.7 2.3.6 3.1.5.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.2z" />
    </svg>
  );
}

export default function PrestamoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [mora, setMora] = useState<MoraResumen | null>(null);
  const [tasa, setTasa] = useState<Tasa | null>(null);
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [negocio, setNegocio] = useState<{ nombre: string; logo: string } | null>(null);
  const [error, setError] = useState('');

  const [open, setOpen] = useState(false);
  const [pago, setPago] = useState({ monto: '', metodo: 'efectivo', nota: '', moneda: 'USD' });
  const [pagoError, setPagoError] = useState('');
  const [pagando, setPagando] = useState(false);
  const [cuotaPage, setCuotaPage] = useState(1);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [opBusy, setOpBusy] = useState(false);
  const [refinOpen, setRefinOpen] = useState(false);
  const [refinMsg, setRefinMsg] = useState('');
  const hoyStr = new Date().toISOString().slice(0, 10);
  const [refin, setRefin] = useState({ modalidad: 'frances', tasa_interes: '', plazo: '', frecuencia: 'mensual', fecha_inicio: hoyStr, monto_extra: '' });
  const [refinPrev, setRefinPrev] = useState<SimulacionResponse | null>(null);
  const [multimoneda, setMultimoneda] = useState<boolean>(() => {
    const p = cachedPlan();
    return p ? p.features.includes('multimoneda') : true;
  });

  async function cargar() {
    setError('');
    try {
      const token = getSession()?.token;
      const r = await api<DetalleResponse>(`/prestamos/${id}`, { token });
      setPrestamo(r.data);
      setCuotas(r.cuotas);
      setPagos(r.pagos);
      setMora(r.mora);
      api<{ tasa: Tasa | null }>('/tasa', { token }).then((t) => setTasa(t.tasa)).catch(() => {});
      api<{ nombre: string; logo: string }>('/negocio', { token }).then(setNegocio).catch(() => {});
      api<{ data: MetodoPago[] }>('/metodos-pago', { token }).then((m) => {
        setMetodos(m.data);
        setPago((pp) => (m.data.some((x) => x.nombre === pp.metodo) ? pp : { ...pp, metodo: m.data[0]?.nombre ?? pp.metodo }));
      }).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  useEffect(() => {
    cargar();
    loadMiPlan().then((p) => p && setMultimoneda(p.features.includes('multimoneda')));
  }, [id]);

  async function registrarPago() {
    setPagoError('');
    const monto = Number(pago.monto);
    if (!monto || monto <= 0) {
      setPagoError('Ingresa un monto valido');
      return;
    }
    if (pago.moneda === 'VES' && (!tasa || Number(tasa.valor) <= 0)) {
      setPagoError('No hay tasa del dia. Actualizala en Caja.');
      return;
    }
    setPagando(true);
    try {
      const token = getSession()?.token;
      await api('/pagos', {
        method: 'POST',
        token,
        body: {
          prestamo_id: Number(id),
          monto,
          metodo: pago.metodo,
          nota: pago.nota,
          moneda: pago.moneda,
          tasa: pago.moneda === 'VES' && tasa ? Number(tasa.valor) : undefined,
        },
      });
      setPago({ monto: '', metodo: 'efectivo', nota: '', moneda: 'USD' });
      setOpen(false);
      await cargar();
    } catch (e) {
      setPagoError(e instanceof Error ? e.message : 'Error');
    } finally {
      setPagando(false);
    }
  }

  async function cancelar() {
    setOpBusy(true);
    try {
      const token = getSession()?.token;
      await api(`/prestamos/${id}/cancelar`, { method: 'POST', token });
      setCancelOpen(false);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setOpBusy(false);
    }
  }

  function abrirRefin() {
    setRefinMsg('');
    setRefinPrev(null);
    setRefin({ modalidad: 'frances', tasa_interes: '', plazo: '', frecuencia: 'mensual', fecha_inicio: hoyStr, monto_extra: '' });
    setRefinOpen(true);
  }

  async function simularRefin() {
    if (!prestamo) return;
    setRefinMsg('');
    const base = Number(prestamo.saldo) + (Number(refin.monto_extra) || 0);
    try {
      const token = getSession()?.token;
      const r = await api<SimulacionResponse>('/prestamos/simular', {
        method: 'POST',
        body: { modalidad: refin.modalidad, monto: base, tasa_interes: Number(refin.tasa_interes) || 0, plazo: Number(refin.plazo) || 0, frecuencia: refin.frecuencia, fecha_inicio: refin.fecha_inicio },
        token,
      });
      setRefinPrev(r);
    } catch (e) {
      setRefinMsg(e instanceof Error ? e.message : 'Error');
    }
  }

  async function refinanciar() {
    setRefinMsg('');
    if (!Number(refin.tasa_interes) || !Number(refin.plazo)) {
      setRefinMsg('Indica tasa y plazo.');
      return;
    }
    setOpBusy(true);
    try {
      const token = getSession()?.token;
      const r = await api<{ id: number }>(`/prestamos/${id}/refinanciar`, {
        method: 'POST',
        body: { modalidad: refin.modalidad, tasa_interes: Number(refin.tasa_interes), plazo: Number(refin.plazo), frecuencia: refin.frecuencia, fecha_inicio: refin.fecha_inicio, monto_extra: Number(refin.monto_extra) || 0 },
        token,
      });
      setRefinOpen(false);
      router.push(`/prestamos/${r.id}`);
    } catch (e) {
      setRefinMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setOpBusy(false);
    }
  }

  if (error) return <div className="p-8 text-danger">{error}</div>;
  if (!prestamo)
    return (
      <div className="p-8 text-brand flex items-center justify-center py-24">
        <span className="spinner" />
      </div>
    );

  const pagado = prestamo.estado === 'pagado' || Number(prestamo.saldo) <= 0;
  const vigente = prestamo.estado === 'activo' || prestamo.estado === 'mora';
  const tel = prestamo.cliente_telefono;
  const proxima = cuotas.find((c) => Number(c.pagado) < Number(c.monto_cuota));

  const msgRecordatorio = `Hola ${prestamo.cliente_nombre}, le recordamos ${
    proxima
      ? `su cuota #${proxima.numero} de ${money(proxima.monto_cuota)} que vence el ${fecha(proxima.fecha_venc)}`
      : 'su pago'
  }. Saldo: ${money(prestamo.saldo)}. Gracias.`;
  const msgGracias = (m: string) =>
    `Hola ${prestamo.cliente_nombre}, recibimos su pago de ${money(m)}. Saldo restante: ${money(prestamo.saldo)}. Gracias por su pago!`;

  const color = (estado: string) =>
    estado === 'pagada'
      ? 'bg-success/15 text-success'
      : estado === 'parcial'
      ? 'bg-warning/15 text-warning'
      : estado === 'vencida'
      ? 'bg-danger/15 text-danger'
      : 'bg-surface-2 text-muted';

  const inputCls = 'w-full rounded-lg border border-line px-3 py-2 text-sm';
  const equivalente = pago.moneda === 'VES' && tasa ? (Number(pago.monto) || 0) / (Number(tasa.valor) || 1) : 0;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Link href={`/clientes/${prestamo.cliente_id}`} className="text-sm text-brand hover:underline">
        Volver al cliente
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mt-2 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-content">Prestamo #{prestamo.id}</h1>
          <p className="text-muted text-sm">
            {prestamo.cliente_nombre} - <span className="capitalize">{prestamo.modalidad}</span> -{' '}
            <span className="capitalize">{prestamo.frecuencia}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tel && !pagado && (
            <a
              href={waLink(tel, msgRecordatorio)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-success/15 text-success hover:bg-success/25 transition-colors"
            >
              <WaIcon /> Recordatorio
            </a>
          )}
          {vigente && (
            <button
              onClick={abrirRefin}
              className="text-sm rounded-lg px-4 py-2 border border-line text-content hover:bg-surface-2 transition-colors"
            >
              Refinanciar
            </button>
          )}
          {vigente && (
            <button
              onClick={() => setCancelOpen(true)}
              className="text-sm rounded-lg px-4 py-2 border border-danger/40 text-danger hover:bg-danger/10 transition-colors"
            >
              Cancelar
            </button>
          )}
          {!pagado && (
            <button
              onClick={() => setOpen(true)}
              className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md hover:shadow-brand/40 active:scale-95 text-sm rounded-lg px-4 py-2"
            >
              + Registrar pago
            </button>
          )}
        </div>
      </div>

      {mora && mora.cuotas_vencidas > 0 && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-3 mb-4 text-sm">
          <b>{mora.cuotas_vencidas}</b> cuota(s) vencida(s) - hasta <b>{mora.dias_atraso_max}</b> dias de atraso.
          Mora estimada: <b>{money(mora.mora_estimada)}</b>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          ['Monto', money(prestamo.monto)],
          ['Total a cobrar', money(prestamo.monto_total)],
          ['Saldo', money(prestamo.saldo)],
          ['Estado', prestamo.estado],
        ].map(([k, v]) => (
          <div key={k} className="bg-surface rounded-xl border border-line shadow-soft p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
            <div className="text-xs text-muted">{k}</div>
            <div className="font-semibold text-content capitalize">{v}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="font-semibold text-content mb-2">Plan de cuotas</h2>
          <div className="bg-surface rounded-xl border border-line shadow-soft overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-surface-2 text-muted">
                <tr>
                  <th className="px-3 py-2.5 text-left">#</th>
                  <th className="px-3 py-2.5 text-left">Vence</th>
                  <th className="px-3 py-2.5 text-right">Cuota</th>
                  <th className="px-3 py-2.5 text-right">Pagado</th>
                  <th className="px-3 py-2.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cuotas.slice((cuotaPage - 1) * 10, cuotaPage * 10).map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="px-3 py-2.5">{c.numero}</td>
                    <td className="px-3 py-2.5">{fecha(c.fecha_venc)}</td>
                    <td className="px-3 py-2.5 text-right">{money(c.monto_cuota)}</td>
                    <td className="px-3 py-2.5 text-right">{money(c.pagado)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs capitalize ${color(c.estado)}`}>
                        {c.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={cuotaPage} total={cuotas.length} onPage={setCuotaPage} />
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-content mb-2">Pagos</h2>
          <div className="bg-surface rounded-xl border border-line shadow-soft p-5">
            {pagos.length === 0 ? (
              <p className="text-sm text-muted">Sin pagos todavia.</p>
            ) : (
              <ul className="space-y-3">
                {pagos.map((p) => (
                  <li key={p.id} className="border-b border-line pb-2 last:border-0">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">
                        {fecha(p.fecha)} <span className="capitalize text-muted">({p.metodo})</span>
                      </span>
                      <span className="font-medium text-content">
                        {p.moneda === 'VES' && p.monto_moneda
                          ? `Bs ${money(p.monto_moneda)}`
                          : money(p.monto)}
                      </span>
                    </div>
                    {p.moneda === 'VES' && (
                      <div className="text-xs text-muted text-right">equivale a {money(p.monto)}</div>
                    )}
                    <div className="flex gap-3 mt-1">
                      <button
                        onClick={() =>
                          imprimirRecibo({
                            numero: p.id,
                            fecha: fecha(p.fecha),
                            cliente: prestamo.cliente_nombre ?? '',
                            prestamoId: prestamo.id,
                            monto: p.monto,
                            metodo: p.metodo,
                            saldo: prestamo.saldo,
                            moneda: p.moneda,
                            montoMoneda: p.monto_moneda,
                            negocio: negocio?.nombre,
                            logo: negocio?.logo ? `${apiBase}/${negocio.logo}` : undefined,
                          })
                        }
                        className="text-xs text-brand hover:underline"
                      >
                        Recibo PDF
                      </button>
                      {tel && (
                        <a
                          href={waLink(tel, msgGracias(p.monto))}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-success hover:underline inline-flex items-center gap-1"
                        >
                          <WaIcon /> Enviar
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar pago">
        {pagoError && <div className="bg-danger/10 text-danger text-sm rounded-lg px-3 py-2 mb-3">{pagoError}</div>}
        <div className="space-y-3">
          {multimoneda && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted">Moneda</label>
              <select
                value={pago.moneda}
                onChange={(e) => setPago((p) => ({ ...p, moneda: e.target.value }))}
                className={inputCls}
              >
                <option value="USD">USD ($)</option>
                <option value="VES">Bolivares (Bs)</option>
              </select>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">
              Monto {pago.moneda === 'VES' ? '(Bs)' : '(USD)'}
            </label>
            <input
              type="number"
              value={pago.monto}
              onChange={(e) => setPago((p) => ({ ...p, monto: e.target.value }))}
              className={inputCls}
            />
            {pago.moneda === 'VES' && (
              <p className="text-xs text-muted">
                {tasa
                  ? `Tasa Bs ${money(tasa.valor)} · equivale a ${money(equivalente)}`
                  : 'No hay tasa del dia. Actualizala en Caja.'}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Metodo</label>
            <select value={pago.metodo} onChange={(e) => setPago((p) => ({ ...p, metodo: e.target.value }))} className={inputCls}>
              {metodos.length === 0 && <option value="efectivo">Efectivo</option>}
              {metodos.map((m) => (
                <option key={m.id} value={m.nombre}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Nota (opcional)</label>
            <input value={pago.nota} onChange={(e) => setPago((p) => ({ ...p, nota: e.target.value }))} className={inputCls} />
          </div>
          <button
            onClick={registrarPago}
            disabled={pagando}
            className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md hover:shadow-brand/40 active:scale-95 rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {pagando ? 'Registrando...' : 'Registrar pago'}
          </button>
          <p className="text-xs text-muted">El abono se aplica a las cuotas mas antiguas primero.</p>
        </div>
      </Modal>

      {/* Cancelar prestamo */}
      <Confirm
        open={cancelOpen}
        title="Cancelar prestamo"
        message={`Se marcara el prestamo #${prestamo.id} como cancelado y dejara de aparecer en cobros, ruta y cartera vigente. Los pagos ya registrados se conservan. Esta accion no se puede deshacer.`}
        confirmLabel="Cancelar prestamo"
        danger
        loading={opBusy}
        onConfirm={cancelar}
        onClose={() => setCancelOpen(false)}
      />

      {/* Refinanciar */}
      <Modal open={refinOpen} onClose={() => setRefinOpen(false)} title={`Refinanciar prestamo #${prestamo.id}`}>
        {refinMsg && <div className="text-sm text-danger mb-3">{refinMsg}</div>}
        <p className="text-sm text-muted mb-4">
          Se cancela este prestamo y se crea uno nuevo tomando el saldo actual (<b>{money(prestamo.saldo)}</b>) como capital, mas el dinero extra que entregues.
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted">Modalidad</label>
              <select value={refin.modalidad} onChange={(e) => setRefin((f) => ({ ...f, modalidad: e.target.value }))} className={inputCls}>
                <option value="frances">Frances (cuota fija)</option>
                <option value="flat">Flat (interes fijo)</option>
                <option value="gota">Gota a gota</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted">Dinero extra (USD)</label>
              <input type="number" min={0} step="0.01" value={refin.monto_extra} onChange={(e) => setRefin((f) => ({ ...f, monto_extra: e.target.value }))} className={inputCls} placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted">Tasa %</label>
              <input type="number" min={0} step="0.01" value={refin.tasa_interes} onChange={(e) => setRefin((f) => ({ ...f, tasa_interes: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted">Plazo</label>
              <input type="number" min={1} value={refin.plazo} onChange={(e) => setRefin((f) => ({ ...f, plazo: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted">Frecuencia</label>
              <select value={refin.frecuencia} onChange={(e) => setRefin((f) => ({ ...f, frecuencia: e.target.value }))} className={inputCls}>
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted">Fecha de inicio</label>
            <input type="date" value={refin.fecha_inicio} onChange={(e) => setRefin((f) => ({ ...f, fecha_inicio: e.target.value }))} className={inputCls} />
          </div>

          <button onClick={simularRefin} className="w-full border border-line text-content hover:bg-surface-2 rounded-lg py-2 text-sm transition-colors">
            Ver plan
          </button>

          {refinPrev && (
            <div className="bg-surface-2 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted">Capital nuevo</span><span className="text-content font-medium">{money((Number(prestamo.saldo) + (Number(refin.monto_extra) || 0)).toFixed(2))}</span></div>
              <div className="flex justify-between"><span className="text-muted">Total a cobrar</span><span className="text-content font-medium">{money(refinPrev.monto_total)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Cuota</span><span className="text-content font-medium">{money(refinPrev.cuota)}</span></div>
            </div>
          )}

          <button onClick={refinanciar} disabled={opBusy} className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
            {opBusy ? 'Procesando...' : 'Refinanciar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
