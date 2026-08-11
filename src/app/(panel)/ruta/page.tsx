'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { money, fecha } from '@/lib/format';
import type { RutaHoy, RutaItem } from '@/types';

function RutaRow({ item, onCobrado }: { item: RutaItem; onCobrado: () => void }) {
  const [monto, setMonto] = useState(item.por_cobrar);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function cobrar() {
    const m = Number(monto);
    if (!m || m <= 0) {
      setErr('Monto invalido');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      const token = getSession()?.token;
      await api('/pagos', {
        method: 'POST',
        token,
        body: { prestamo_id: item.prestamo_id, monto: m },
      });
      onCobrado();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
      setSaving(false);
    }
  }

  const vencida = item.estado === 'vencida';

  return (
    <div className="bg-surface rounded-xl border border-line shadow-soft p-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-content">{item.cliente}</div>
          <div className="text-xs text-muted">
            {item.direccion ?? 'sin direccion'}
          </div>
          <div className="text-xs text-muted">{item.telefono ?? ''}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">Cuota #{item.numero}</div>
          <div
            className={`text-xs ${vencida ? 'text-danger' : 'text-muted'}`}
          >
            vence {fecha(item.fecha_venc)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span className="text-sm text-muted">Por cobrar:</span>
        <span className="font-semibold text-content">
          {money(item.por_cobrar)}
        </span>
      </div>

      {err && <div className="text-danger text-xs mt-2">{err}</div>}

      <div className="flex gap-2 mt-3">
        <input
          type="number"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
        />
        <button
          onClick={cobrar}
          disabled={saving}
          className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md hover:shadow-brand/40 active:scale-95 rounded-lg px-5 text-sm font-medium disabled:opacity-60"
        >
          {saving ? '...' : 'Cobrar'}
        </button>
      </div>
    </div>
  );
}

export default function RutaPage() {
  const [ruta, setRuta] = useState<RutaHoy | null>(null);
  const [error, setError] = useState('');

  async function cargar() {
    setError('');
    try {
      const token = getSession()?.token;
      const r = await api<RutaHoy>('/ruta/hoy', { token });
      setRuta(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  if (error) return <div className="p-6 text-danger">{error}</div>;
  if (!ruta) return <div className="p-6 text-brand flex items-center justify-center py-24"><span className="spinner" /></div>;

  return (
    <div className="p-6 mx-auto">
      <h1 className="text-2xl font-bold text-content">Mi ruta de hoy</h1>
      <div className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg rounded-xl p-4 my-4 flex justify-between">
        <div>
          <div className="text-xs opacity-80">Por cobrar hoy</div>
          <div className="text-2xl font-bold">{money(ruta.total_esperado)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-80">Cuotas</div>
          <div className="text-2xl font-bold">{ruta.cuenta}</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ruta.data.length === 0 ? (
          <div className="text-center text-muted py-10">
            No tienes cobros pendientes hoy.
          </div>
        ) : (
          ruta.data.map((it) => (
            <RutaRow key={it.cuota_id} item={it} onCobrado={cargar} />
          ))
        )}
      </div>
    </div>
  );
}
