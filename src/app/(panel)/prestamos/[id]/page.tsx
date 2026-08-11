'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, apiBase } from '@/lib/api';
import { getSession } from '@/lib/auth';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import { money, fecha } from '@/lib/format';
import { waLink } from '@/lib/whatsapp';
import { imprimirRecibo } from '@/lib/recibo';
import type { Prestamo, CuotaPlan, Pago, MoraResumen, Tasa, MetodoPago } from '@/types';

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

  if (error) return <div className="p-8 text-danger">{error}</div>;
  if (!prestamo)
    return (
      <div className="p-8 text-brand flex items-center justify-center py-24">
        <span className="spinner" />
      </div>
    );

  const pagado = prestamo.estado === 'pagado' || Number(prestamo.saldo) <= 0;
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
    <div className="p-6 md:p-8">
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
        <div className="flex gap-2">
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
          <div className="bg-surface rounded-xl border border-line shadow-soft overflow-hidden">
            <table className="w-full text-sm">
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
    </div>
  );
}
