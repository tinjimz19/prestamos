'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiUpload, apiBase } from '@/lib/api';
import { getSession, clearSession } from '@/lib/auth';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import { money, fecha } from '@/lib/format';
import { waLink } from '@/lib/whatsapp';
import { imprimirRecibo, imprimirEstado } from '@/lib/recibo';
import type { MiCuenta, PortalPrestamo, PortalCuota, Tasa } from '@/types';

const badge = (estado: string) =>
  estado === 'activo'
    ? 'bg-brand/15 text-brand'
    : estado === 'mora'
    ? 'bg-danger/15 text-danger'
    : estado === 'pagado'
    ? 'bg-success/15 text-success'
    : 'bg-surface-2 text-muted';

function CuotasTabla({ cuotas }: { cuotas: PortalCuota[] }) {
  const [page, setPage] = useState(1);
  const paged = cuotas.slice((page - 1) * 10, page * 10);
  return (
    <div className="mt-2 border border-line rounded-lg overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-surface-2 text-muted">
          <tr>
            <th className="px-2 py-1.5 text-left">#</th>
            <th className="px-2 py-1.5 text-left">Vence</th>
            <th className="px-2 py-1.5 text-right">Cuota</th>
            <th className="px-2 py-1.5 text-right">Pagado</th>
            <th className="px-2 py-1.5 text-center">Estado</th>
          </tr>
        </thead>
        <tbody>
          {paged.map((c) => (
            <tr key={c.id} className="border-t border-line">
              <td className="px-2 py-1.5">{c.numero}</td>
              <td className="px-2 py-1.5">{fecha(c.fecha_venc)}</td>
              <td className="px-2 py-1.5 text-right">{money(c.monto_cuota)}</td>
              <td className="px-2 py-1.5 text-right">{money(c.pagado)}</td>
              <td className="px-2 py-1.5 text-center">
                <span className={`rounded-full px-1.5 py-0.5 capitalize ${badge(c.estado === 'pagada' ? 'pagado' : c.estado === 'vencida' ? 'mora' : 'activo')}`}>
                  {c.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} total={cuotas.length} onPage={setPage} />
    </div>
  );
}

export default function PortalPage() {
  const router = useRouter();
  const [data, setData] = useState<MiCuenta | null>(null);
  const [tasa, setTasa] = useState<Tasa | null>(null);
  const [negocio, setNegocio] = useState<{ nombre: string; logo: string } | null>(null);
  const [error, setError] = useState('');

  const [open, setOpen] = useState(false);
  const [rep, setRep] = useState({ prestamo_id: 0, monto: '', referencia: '', nota: '', moneda: 'VES' });
  const [repMsg, setRepMsg] = useState('');
  const [repOk, setRepOk] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  async function cargar() {
    setError('');
    const s = getSession();
    if (!s || s.user.rol !== 'cliente') {
      router.replace('/portal/login');
      return;
    }
    try {
      const r = await api<MiCuenta>('/portal/mi-cuenta', { token: s.token });
      setData(r);
      api<{ tasa: Tasa | null }>('/tasa', { token: s.token }).then((t) => setTasa(t.tasa)).catch(() => {});
      api<{ nombre: string; logo: string }>('/negocio', { token: s.token }).then(setNegocio).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function logout() {
    clearSession();
    router.replace('/portal/login');
  }

  function abrirReporte(p: PortalPrestamo) {
    setRep({ prestamo_id: p.id, monto: '', referencia: '', nota: '', moneda: 'VES' });
    setFile(null);
    setRepMsg('');
    setRepOk('');
    setOpen(true);
  }

  async function enviarReporte() {
    setRepMsg('');
    const monto = Number(rep.monto);
    if (!monto || monto <= 0) {
      setRepMsg('Ingresa un monto valido');
      return;
    }
    if (!rep.referencia.trim()) {
      setRepMsg('La referencia es obligatoria');
      return;
    }
    if (!file) {
      setRepMsg('Adjunta el comprobante (imagen o PDF)');
      return;
    }
    setEnviando(true);
    try {
      const token = getSession()?.token;
      const fd = new FormData();
      fd.append('prestamo_id', String(rep.prestamo_id));
      fd.append('monto', String(monto));
      fd.append('moneda', rep.moneda);
      fd.append('referencia', rep.referencia);
      fd.append('nota', rep.nota);
      fd.append('comprobante', file);
      const r = await apiUpload<{ message: string }>('/portal/reportar-pago', fd, token);
      setOpen(false);
      setRepOk(r.message ?? 'Reporte enviado.');
    } catch (e) {
      setRepMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setEnviando(false);
    }
  }

  if (error) return <div className="p-8 text-danger max-w-3xl mx-auto">{error}</div>;
  if (!data) return <div className="p-8 text-brand flex items-center justify-center py-24"><span className="spinner" /></div>;

  const inputCls = 'w-full rounded-lg border border-line px-3 py-2 text-sm';
  const wa = data.whatsapp_oficina;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-content">Hola, {data.cliente.nombre}</h1>
          <p className="text-sm text-muted">Cedula {data.cliente.cedula ?? '-'}</p>
        </div>
        <button onClick={logout} className="text-sm text-danger hover:underline">Salir</button>
      </div>

      {repOk && (
        <div className="bg-success/10 border border-success/30 text-success rounded-lg px-4 py-3 mb-4 text-sm">{repOk}</div>
      )}

      {data.prestamos.length === 0 && (
        <div className="bg-surface rounded-xl border border-line shadow-soft p-6 text-muted">
          No tienes prestamos registrados.
        </div>
      )}

      <div className="space-y-5">
        {data.prestamos.map((p) => {
          const prox = p.cuotas.find((c) => Number(c.pagado) < Number(c.monto_cuota));
          return (
            <div key={p.id} className="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                <div>
                  <div className="font-semibold text-content">Prestamo #{p.id}</div>
                  <div className="text-xs text-muted capitalize">{p.modalidad} - {p.frecuencia}</div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${badge(p.estado)}`}>{p.estado}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5">
                <div>
                  <div className="text-xs text-muted">Saldo pendiente</div>
                  <div className="text-2xl font-bold text-content">{money(p.saldo)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Proxima cuota</div>
                  {prox ? (
                    <div className="text-content font-medium">
                      {money(prox.monto_cuota)}
                      <div className="text-xs text-muted">vence {fecha(prox.fecha_venc)}</div>
                    </div>
                  ) : (
                    <div className="text-success font-medium">Al dia</div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 px-5 pb-4">
                <button
                  onClick={() => abrirReporte(p)}
                  className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg px-4 py-2 text-sm font-medium"
                >
                  Reportar pago
                </button>
                <button
                  onClick={() =>
                    imprimirEstado({
                      cliente: data.cliente.nombre,
                      prestamoId: p.id,
                      modalidad: p.modalidad,
                      saldo: p.saldo,
                      monto_total: p.monto_total,
                      cuotas: p.cuotas.map((c) => ({
                        numero: c.numero,
                        fecha_venc: fecha(c.fecha_venc),
                        monto_cuota: c.monto_cuota,
                        pagado: c.pagado,
                        estado: c.estado,
                      })),
                      logo: negocio?.logo ? `${apiBase}/${negocio.logo}` : undefined,
                    })
                  }
                  className="border border-line text-content hover:bg-surface-2 rounded-lg px-4 py-2 text-sm"
                >
                  Estado de cuenta
                </button>
                {wa && (
                  <a
                    href={waLink(wa, `Hola, soy ${data.cliente.nombre} (cedula ${data.cliente.cedula ?? ''}). Consulta sobre mi prestamo #${p.id}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-success/15 text-success hover:bg-success/25 rounded-lg px-4 py-2 text-sm font-medium"
                  >
                    Contacto
                  </a>
                )}
              </div>

              <div className="px-5 pb-3">
                <details className="group">
                  <summary className="cursor-pointer text-sm text-brand hover:underline list-none">
                    Ver plan de cuotas ({p.cuotas.length})
                  </summary>
                  <CuotasTabla cuotas={p.cuotas} />
                </details>
              </div>

              {p.pagos.length > 0 && (
                <div className="px-5 pb-5">
                  <div className="text-xs font-medium text-muted mb-1">Mis pagos</div>
                  <ul className="space-y-1.5">
                    {p.pagos.map((pg) => (
                      <li key={pg.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted">
                          {fecha(pg.fecha)} ·{' '}
                          {pg.moneda === 'VES' && pg.monto_moneda ? `Bs ${money(pg.monto_moneda)}` : money(pg.monto)}
                        </span>
                        <button
                          onClick={() =>
                            imprimirRecibo({
                              numero: pg.id,
                              fecha: fecha(pg.fecha),
                              cliente: data.cliente.nombre,
                              prestamoId: p.id,
                              monto: pg.monto,
                              metodo: pg.metodo,
                              saldo: p.saldo,
                              moneda: pg.moneda,
                              montoMoneda: pg.monto_moneda,
                              negocio: negocio?.nombre,
                              logo: negocio?.logo ? `${apiBase}/${negocio.logo}` : undefined,
                            })
                          }
                          className="text-brand hover:underline text-xs"
                        >
                          Recibo PDF
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Reportar un pago">
        {repMsg && <div className="bg-danger/10 text-danger text-sm rounded-lg px-3 py-2 mb-3">{repMsg}</div>}
        <p className="text-xs text-muted mb-3">
          Informa tu pago y la oficina lo validara. Indica la referencia de tu transferencia o pago movil.
        </p>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Moneda</label>
            <select value={rep.moneda} onChange={(e) => setRep((r) => ({ ...r, moneda: e.target.value }))} className={inputCls}>
              <option value="VES">Bolivares (Bs)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Monto {rep.moneda === 'VES' ? '(Bs)' : '(USD)'}</label>
            <input type="number" value={rep.monto} onChange={(e) => setRep((r) => ({ ...r, monto: e.target.value }))} className={inputCls} />
            {rep.moneda === 'VES' && (
              <p className="text-xs text-muted">
                {tasa
                  ? `Tasa Bs ${money(tasa.valor)} · equivale a ${money((Number(rep.monto) || 0) / (Number(tasa.valor) || 1))}`
                  : 'Aun no hay tasa del dia publicada. Igual puedes reportar; la oficina la aplicara al validar.'}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Referencia *</label>
            <input value={rep.referencia} onChange={(e) => setRep((r) => ({ ...r, referencia: e.target.value }))} className={inputCls} placeholder="N. de transferencia / pago movil" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Comprobante * (imagen o PDF)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
              className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-content file:text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Nota (opcional)</label>
            <input value={rep.nota} onChange={(e) => setRep((r) => ({ ...r, nota: e.target.value }))} className={inputCls} />
          </div>
          <button
            onClick={enviarReporte}
            disabled={enviando}
            className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {enviando ? 'Enviando...' : 'Enviar reporte'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
