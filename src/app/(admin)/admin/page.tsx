'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { fecha } from '@/lib/format';
import Modal from '@/components/Modal';
import Confirm from '@/components/Confirm';
import type { Casa, Plan } from '@/types';

const nuevaCasa = {
  nombre: '',
  contacto: '',
  telefono: '',
  plan_id: 1,
  dias: 30,
  estado: 'activa',
  dias_gracia: 3,
  admin_nombre: '',
  admin_email: '',
  admin_password: '',
};

function Badge({ casa }: { casa: Casa }) {
  const map: Record<string, string> = {
    activa: 'bg-success/15 text-success border-success/30',
    prueba: 'bg-brand/15 text-brand border-brand/30',
    vencida: 'bg-danger/15 text-danger border-danger/30',
    suspendida: 'bg-muted/15 text-muted border-line',
  };
  const cls = map[casa.estado_calc] ?? 'bg-muted/15 text-muted border-line';
  const label =
    casa.estado_calc === 'activa' && casa.en_gracia ? 'en gracia' : casa.estado_calc;
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border capitalize ${cls}`}>
      {label}
    </span>
  );
}

export default function AdminCasasPage() {
  const [casas, setCasas] = useState<Casa[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [error, setError] = useState('');

  const [openNueva, setOpenNueva] = useState(false);
  const [form, setForm] = useState({ ...nuevaCasa });
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const [renov, setRenov] = useState<Casa | null>(null);
  const [renovDias, setRenovDias] = useState(30);
  const [confirmar, setConfirmar] = useState<{ casa: Casa; accion: 'suspender' | 'activar' } | null>(null);
  const [busy, setBusy] = useState(false);

  const token = () => getSession()?.token;

  async function cargar() {
    setError('');
    try {
      const [c, p] = await Promise.all([
        api<{ data: Casa[] }>('/casas', { token: token() }),
        api<{ data: Plan[] }>('/planes', { token: token() }),
      ]);
      setCasas(c.data);
      setPlanes(p.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function set(k: keyof typeof form, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onPlan(id: number) {
    const pl = planes.find((p) => p.id === id);
    setForm((f) => ({ ...f, plan_id: id, dias: pl ? pl.dias : f.dias }));
  }

  async function crear() {
    setMsg('');
    if (!form.nombre || !form.admin_nombre || !form.admin_email || !form.admin_password) {
      setMsg('Completa el nombre de la casa y los datos del administrador.');
      return;
    }
    setSaving(true);
    try {
      await api('/casas', { method: 'POST', body: form, token: token() });
      setForm({ ...nuevaCasa });
      setOpenNueva(false);
      await cargar();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  }

  async function hacerConfirm() {
    if (!confirmar) return;
    setBusy(true);
    try {
      await api(`/casas/${confirmar.casa.id}/${confirmar.accion}`, { method: 'POST', token: token() });
      setConfirmar(null);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function hacerRenovar() {
    if (!renov) return;
    setBusy(true);
    try {
      await api(`/casas/${renov.id}/renovar`, { method: 'POST', body: { dias: renovDias }, token: token() });
      setRenov(null);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  const inputCls = 'w-full rounded-lg border border-line px-3 py-2 text-sm bg-surface';
  const total = casas.length;
  const activas = casas.filter((c) => c.usable && c.estado_calc !== 'suspendida').length;
  const gracia = casas.filter((c) => c.en_gracia).length;
  const bloqueadas = casas.filter((c) => !c.usable).length;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-content">Casas de Prestamos</h1>
          <p className="text-sm text-muted">Cada casa es un cliente de tu sistema.</p>
        </div>
        <button
          onClick={() => { setMsg(''); setForm({ ...nuevaCasa }); setOpenNueva(true); }}
          className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 text-sm rounded-lg px-4 py-2"
        >
          + Nueva casa
        </button>
      </div>

      {error && <div className="text-danger text-sm mb-4">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { l: 'Casas', v: total },
          { l: 'Activas', v: activas },
          { l: 'En gracia', v: gracia },
          { l: 'Bloqueadas', v: bloqueadas },
        ].map((k) => (
          <div key={k.l} className="bg-surface rounded-xl border border-line shadow-soft p-4">
            <div className="text-2xl font-bold text-content">{k.v}</div>
            <div className="text-xs text-muted">{k.l}</div>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-line shadow-soft overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="px-4 py-2.5 text-left">Casa</th>
              <th className="px-4 py-2.5 text-left">Estado</th>
              <th className="px-4 py-2.5 text-left">Vence</th>
              <th className="px-4 py-2.5 text-left">Plan</th>
              <th className="px-4 py-2.5 text-center">Clientes</th>
              <th className="px-4 py-2.5 text-center">Prestamos</th>
              <th className="px-4 py-2.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {casas.map((c) => (
              <tr key={c.id} className="border-t border-line align-middle">
                <td className="px-4 py-2.5">
                  <div className="font-medium text-content">{c.nombre}</div>
                  <div className="text-xs text-muted">
                    {c.contacto || 'sin contacto'}{c.telefono ? ' · ' + c.telefono : ''}
                  </div>
                </td>
                <td className="px-4 py-2.5"><Badge casa={c} /></td>
                <td className="px-4 py-2.5">
                  <div>{c.fecha_vencimiento ? fecha(c.fecha_vencimiento) : '—'}</div>
                  {c.dias_restantes !== null && (
                    <div className={`text-xs ${c.dias_restantes < 0 ? 'text-danger' : c.dias_restantes <= 5 ? 'text-brand' : 'text-muted'}`}>
                      {c.dias_restantes < 0 ? `vencida hace ${-c.dias_restantes}d` : `${c.dias_restantes}d restantes`}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted">{c.plan_nombre ?? '—'}</td>
                <td className="px-4 py-2.5 text-center">{c.n_clientes}</td>
                <td className="px-4 py-2.5 text-center">{c.n_prestamos}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1.5 flex-wrap">
                    <button
                      onClick={() => { setRenov(c); setRenovDias(30); }}
                      className="text-xs px-2.5 py-1 rounded-lg border border-line hover:bg-surface-2 transition-colors"
                    >
                      Renovar
                    </button>
                    {c.estado === 'suspendida' ? (
                      <button
                        onClick={() => setConfirmar({ casa: c, accion: 'activar' })}
                        className="text-xs px-2.5 py-1 rounded-lg border border-success/40 text-success hover:bg-success/10 transition-colors"
                      >
                        Activar
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmar({ casa: c, accion: 'suspender' })}
                        className="text-xs px-2.5 py-1 rounded-lg border border-danger/40 text-danger hover:bg-danger/10 transition-colors"
                      >
                        Suspender
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {casas.length === 0 && !error && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">Aun no hay casas. Crea la primera.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Nueva casa */}
      <Modal open={openNueva} onClose={() => setOpenNueva(false)} title="Nueva casa de prestamos">
        {msg && <div className="text-sm text-danger mb-3">{msg}</div>}
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-muted uppercase mb-2">Datos de la casa</div>
            <div className="space-y-3">
              <input placeholder="Nombre de la casa" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Contacto (opcional)" value={form.contacto} onChange={(e) => set('contacto', e.target.value)} className={inputCls} />
                <input placeholder="Telefono (opcional)" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <select value={form.plan_id} onChange={(e) => onPlan(Number(e.target.value))} className={inputCls}>
                  {planes.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <input type="number" min={1} placeholder="Dias" value={form.dias} onChange={(e) => set('dias', Number(e.target.value))} className={inputCls} title="Dias de vigencia" />
                <select value={form.estado} onChange={(e) => set('estado', e.target.value)} className={inputCls}>
                  <option value="activa">Activa</option>
                  <option value="prueba">Prueba</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted uppercase mb-2">Administrador de la casa</div>
            <div className="space-y-3">
              <input placeholder="Nombre del admin" value={form.admin_nombre} onChange={(e) => set('admin_nombre', e.target.value)} className={inputCls} />
              <input placeholder="Email (para iniciar sesion)" value={form.admin_email} onChange={(e) => set('admin_email', e.target.value)} className={inputCls} />
              <input type="text" placeholder="Contrasena" value={form.admin_password} onChange={(e) => set('admin_password', e.target.value)} className={inputCls} />
            </div>
          </div>

          <button onClick={crear} disabled={saving} className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
            {saving ? 'Creando...' : 'Crear casa'}
          </button>
        </div>
      </Modal>

      {/* Renovar */}
      <Modal open={renov !== null} onClose={() => setRenov(null)} title={`Renovar ${renov?.nombre ?? ''}`}>
        <p className="text-sm text-muted mb-4">Extiende la vigencia desde hoy (o desde su vencimiento futuro) y reactiva la casa.</p>
        <div className="flex items-center gap-2 mb-5">
          <input type="number" min={1} value={renovDias} onChange={(e) => setRenovDias(Number(e.target.value))} className={inputCls} />
          <span className="text-sm text-muted whitespace-nowrap">dias</span>
        </div>
        <div className="flex gap-2 mb-4">
          {[30, 60, 90].map((d) => (
            <button key={d} onClick={() => setRenovDias(d)} className={`text-xs px-3 py-1 rounded-lg border transition-colors ${renovDias === d ? 'border-brand text-brand bg-brand/10' : 'border-line text-muted hover:bg-surface-2'}`}>
              {d} dias
            </button>
          ))}
        </div>
        <button onClick={hacerRenovar} disabled={busy} className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
          {busy ? 'Renovando...' : `Renovar +${renovDias} dias`}
        </button>
      </Modal>

      {/* Confirmar suspender/activar */}
      <Confirm
        open={confirmar !== null}
        title={confirmar?.accion === 'suspender' ? 'Suspender casa' : 'Activar casa'}
        message={
          confirmar?.accion === 'suspender'
            ? `Se bloqueara el acceso de "${confirmar?.casa.nombre}". Sus datos se conservan y puedes reactivarla cuando quieras.`
            : `Se reactivara el acceso de "${confirmar?.casa.nombre}".`
        }
        confirmLabel={confirmar?.accion === 'suspender' ? 'Suspender' : 'Activar'}
        danger={confirmar?.accion === 'suspender'}
        loading={busy}
        onConfirm={hacerConfirm}
        onClose={() => setConfirmar(null)}
      />
    </div>
  );
}
