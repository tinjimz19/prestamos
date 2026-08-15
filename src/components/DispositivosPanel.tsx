'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { fecha } from '@/lib/format';
import Confirm from '@/components/Confirm';
import type { Dispositivo } from '@/types';

function cuando(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.replace(' ', 'T'));
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  if (min < 1440) return `hace ${Math.round(min / 60)} h`;
  return fecha(iso);
}

export default function DispositivosPanel() {
  const [items, setItems] = useState<Dispositivo[]>([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmarOtras, setConfirmarOtras] = useState(false);
  const [busy, setBusy] = useState(false);

  const token = () => getSession()?.token;

  async function cargar() {
    setError('');
    try {
      const r = await api<{ data: Dispositivo[] }>('/dispositivos', { token: token() });
      setItems(r.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function revocar(id: number) {
    setMsg('');
    try {
      await api(`/dispositivos/${id}/revocar`, { method: 'POST', token: token() });
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  async function cerrarOtras() {
    setBusy(true);
    setMsg('');
    try {
      const r = await api<{ cerradas: number }>('/dispositivos/cerrar-otras', { method: 'POST', token: token() });
      setConfirmarOtras(false);
      setMsg(`Se cerraron ${r.cerradas} sesion(es).`);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  const otras = items.filter((d) => !d.actual).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-content">Dispositivos y sesiones</h1>
          <p className="text-sm text-muted">Aqui ves donde tienes la sesion abierta. Cierra las que no reconozcas.</p>
        </div>
        {otras > 0 && (
          <button onClick={() => setConfirmarOtras(true)} className="text-sm rounded-lg px-4 py-2 border border-danger/40 text-danger hover:bg-danger/10 transition-colors">
            Cerrar las demas ({otras})
          </button>
        )}
      </div>

      {error && <div className="text-danger text-sm mb-3">{error}</div>}
      {msg && <div className="text-success text-sm mb-3">{msg}</div>}

      <div className="space-y-2">
        {items.map((d) => (
          <div key={d.id} className={`bg-surface rounded-xl border shadow-soft p-4 flex items-center justify-between gap-3 ${d.actual ? 'border-brand/40' : 'border-line'}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-content">{d.nombre ?? 'Dispositivo'}</span>
                {d.actual ? (
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-brand/15 text-brand border-brand/30">Este dispositivo</span>
                ) : null}
                {d.recordar ? <span className="text-xs text-muted">· recordado</span> : null}
              </div>
              <div className="text-xs text-muted mt-0.5">
                {d.ip ?? 'ip desconocida'} · actividad {cuando(d.ultima_actividad)}
              </div>
            </div>
            {!d.actual && (
              <button onClick={() => revocar(d.id)} className="text-xs px-2.5 py-1 rounded-lg border border-line hover:bg-surface-2 transition-colors shrink-0">
                Cerrar
              </button>
            )}
          </div>
        ))}
        {items.length === 0 && !error && <p className="text-sm text-muted">No hay sesiones activas.</p>}
      </div>

      <Confirm
        open={confirmarOtras}
        title="Cerrar las demas sesiones"
        message="Se cerrara la sesion en todos los otros dispositivos. Este seguira abierto."
        confirmLabel="Cerrar las demas"
        danger
        loading={busy}
        onConfirm={cerrarOtras}
        onClose={() => setConfirmarOtras(false)}
      />
    </div>
  );
}
