'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { money, fecha } from '@/lib/format';
import type {
  Cliente,
  Cobrador,
  Modalidad,
  Frecuencia,
  SimulacionResponse,
} from '@/types';

const MODALIDADES: { v: Modalidad; label: string }[] = [
  { v: 'frances', label: 'Frances (cuota fija sobre saldo)' },
  { v: 'flat', label: 'Flat (interes plano)' },
  { v: 'gota', label: 'Gota a gota' },
];
const FRECUENCIAS: Frecuencia[] = ['diario', 'semanal', 'quincenal', 'mensual'];

export default function NuevoPrestamoPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [form, setForm] = useState({
    cliente_id: '',
    modalidad: 'flat' as Modalidad,
    monto: '',
    tasa_interes: '',
    plazo: '',
    frecuencia: 'mensual' as Frecuencia,
    fecha_inicio: '',
    cobrador_id: '',
  });
  const [sim, setSim] = useState<SimulacionResponse | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getSession()?.token;
    api<{ data: Cliente[] }>('/clientes', { token })
      .then((r) => setClientes(r.data))
      .catch(() => {});
    api<{ data: Cobrador[] }>('/usuarios/cobradores', { token })
      .then((r) => setCobradores(r.data))
      .catch(() => {});
    const hoy = new Date().toISOString().slice(0, 10);
    const pre = new URLSearchParams(window.location.search).get('cliente') ?? '';
    setForm((f) => ({ ...f, fecha_inicio: hoy, cliente_id: pre }));
  }, []);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setSim(null);
  }

  const esGota = form.modalidad === 'gota';

  async function simular() {
    setError('');
    try {
      const token = getSession()?.token;
      const res = await api<SimulacionResponse>('/prestamos/simular', {
        method: 'POST',
        token,
        body: {
          modalidad: form.modalidad,
          monto: Number(form.monto),
          tasa_interes: Number(form.tasa_interes),
          plazo: Number(form.plazo),
          frecuencia: form.frecuencia,
          fecha_inicio: form.fecha_inicio,
        },
      });
      setSim(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setSim(null);
    }
  }

  async function crear() {
    if (!form.cliente_id) {
      setError('Selecciona un cliente');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const token = getSession()?.token;
      const res = await api<{ id: number }>('/prestamos', {
        method: 'POST',
        token,
        body: {
          cliente_id: Number(form.cliente_id),
          modalidad: form.modalidad,
          monto: Number(form.monto),
          tasa_interes: Number(form.tasa_interes),
          plazo: Number(form.plazo),
          frecuencia: form.frecuencia,
          fecha_inicio: form.fecha_inicio,
          cobrador_id: form.cobrador_id ? Number(form.cobrador_id) : null,
        },
      });
      router.push(`/prestamos/${res.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-lg border border-line px-3 py-2 text-sm';

  return (
    <div className="p-8">
      <Link href="/clientes" className="text-sm text-brand hover:underline">
        Volver
      </Link>
      <h1 className="text-2xl font-bold text-content mt-2 mb-6">
        Nuevo prestamo
      </h1>

      {error && (
        <div className="bg-danger/10 text-danger text-sm rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-line shadow-soft p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-content">Cliente *</label>
            <select
              value={form.cliente_id}
              onChange={(e) => set('cliente_id', e.target.value)}
              className={inputCls}
            >
              <option value="">Selecciona...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-content">Modalidad</label>
            <select
              value={form.modalidad}
              onChange={(e) => set('modalidad', e.target.value)}
              className={inputCls}
            >
              {MODALIDADES.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-content">Monto</label>
              <input
                type="number"
                value={form.monto}
                onChange={(e) => set('monto', e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-content">
                {esGota ? 'Interes total %' : 'Tasa anual %'}
              </label>
              <input
                type="number"
                value={form.tasa_interes}
                onChange={(e) => set('tasa_interes', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <p className="text-xs text-muted">
            {esGota
              ? 'En gota a gota el % es el interes total sobre el monto (ej: 20% de 500 = 100).'
              : 'Tasa nominal anual; se prorratea por frecuencia (mensual /12, quincenal /24, semanal /52, diario /360).'}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-content">
                N. de cuotas
              </label>
              <input
                type="number"
                value={form.plazo}
                onChange={(e) => set('plazo', e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-content">
                Frecuencia
              </label>
              <select
                value={form.frecuencia}
                onChange={(e) => set('frecuencia', e.target.value)}
                className={inputCls}
              >
                {FRECUENCIAS.map((f) => (
                  <option key={f} value={f} className="capitalize">
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-content">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => set('fecha_inicio', e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-content">
                Cobrador
              </label>
              <select
                value={form.cobrador_id}
                onChange={(e) => set('cobrador_id', e.target.value)}
                className={inputCls}
              >
                <option value="">Sin asignar</option>
                {cobradores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={simular}
            className="w-full border border-brand text-brand hover:bg-brand/10 rounded-lg py-2.5 text-sm font-medium"
          >
            Simular plan de cuotas
          </button>
        </div>

        <div className="bg-surface rounded-xl border border-line shadow-soft p-6">
          {!sim ? (
            <p className="text-muted text-sm text-center py-10">
              Completa los datos y presiona <b>Simular</b> para ver el plan.
            </p>
          ) : (
            <div>
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="bg-surface-2 rounded-lg py-2">
                  <div className="text-xs text-muted">Cuota</div>
                  <div className="font-semibold text-content">
                    {money(sim.cuota)}
                  </div>
                </div>
                <div className="bg-surface-2 rounded-lg py-2">
                  <div className="text-xs text-muted">Interes</div>
                  <div className="font-semibold text-content">
                    {money(sim.interes_total)}
                  </div>
                </div>
                <div className="bg-surface-2 rounded-lg py-2">
                  <div className="text-xs text-muted">Total</div>
                  <div className="font-semibold text-content">
                    {money(sim.monto_total)}
                  </div>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto border border-line rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-surface-2 text-muted sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">#</th>
                      <th className="px-2 py-1 text-left">Vence</th>
                      <th className="px-2 py-1 text-right">Capital</th>
                      <th className="px-2 py-1 text-right">Interes</th>
                      <th className="px-2 py-1 text-right">Cuota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sim.cuotas.map((c) => (
                      <tr key={c.numero} className="border-t border-line">
                        <td className="px-2 py-1">{c.numero}</td>
                        <td className="px-2 py-1">{fecha(c.fecha_venc)}</td>
                        <td className="px-2 py-1 text-right">{money(c.capital)}</td>
                        <td className="px-2 py-1 text-right">{money(c.interes)}</td>
                        <td className="px-2 py-1 text-right">
                          {money(c.monto_cuota)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={crear}
                disabled={saving}
                className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md hover:shadow-brand/40 active:scale-95 rounded-lg py-2.5 mt-4 text-sm font-medium disabled:opacity-60"
              >
                {saving ? 'Creando...' : 'Confirmar y crear prestamo'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
