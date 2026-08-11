'use client';

import { useEffect, useState } from 'react';
import { api, apiUpload, apiBase } from '@/lib/api';
import { getSession } from '@/lib/auth';
import Confirm from '@/components/Confirm';
import { IconX } from '@/components/icons';
import type { MetodoPago } from '@/types';

interface Config {
  negocio_nombre: string;
  negocio_logo: string;
  recargo_mora_pct: string;
  dias_gracia: string;
  whatsapp_oficina: string;
  moneda_base: string;
}

export default function ConfiguracionPage() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  // metodos de pago
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [nombreMetodo, setNombreMetodo] = useState('');
  const [busyM, setBusyM] = useState(false);
  const [delMetodo, setDelMetodo] = useState<MetodoPago | null>(null);

  async function cargar() {
    setError('');
    try {
      const token = getSession()?.token;
      const [c, m] = await Promise.all([
        api<Config>('/ajustes', { token }),
        api<{ data: MetodoPago[] }>('/metodos-pago/todos', { token }),
      ]);
      setCfg(c);
      setMetodos(m.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function set(k: keyof Config, v: string) {
    setCfg((c) => (c ? { ...c, [k]: v } : c));
  }

  async function guardar() {
    if (!cfg) return;
    setOk('');
    setError('');
    setSaving(true);
    try {
      const token = getSession()?.token;
      await api('/ajustes', {
        method: 'PUT',
        token,
        body: {
          negocio_nombre: cfg.negocio_nombre,
          recargo_mora_pct: cfg.recargo_mora_pct,
          dias_gracia: cfg.dias_gracia,
          whatsapp_oficina: cfg.whatsapp_oficina,
        },
      });
      setOk('Configuracion guardada');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function subirLogo() {
    if (!logoFile) return;
    setSubiendo(true);
    setError('');
    setOk('');
    try {
      const token = getSession()?.token;
      const fd = new FormData();
      fd.append('logo', logoFile);
      const r = await apiUpload<{ logo: string }>('/ajustes/logo', fd, token);
      setCfg((c) => (c ? { ...c, negocio_logo: r.logo } : c));
      setLogoFile(null);
      setOk('Logo actualizado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSubiendo(false);
    }
  }

  async function agregarMetodo() {
    if (!nombreMetodo.trim()) return;
    setBusyM(true);
    setError('');
    try {
      const token = getSession()?.token;
      await api('/metodos-pago', { method: 'POST', token, body: { nombre: nombreMetodo } });
      setNombreMetodo('');
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyM(false);
    }
  }

  async function toggleMetodo(id: number) {
    const token = getSession()?.token;
    await api(`/metodos-pago/${id}/toggle`, { method: 'POST', token });
    await cargar();
  }

  async function eliminarMetodo() {
    if (!delMetodo) return;
    setBusyM(true);
    try {
      const token = getSession()?.token;
      await api(`/metodos-pago/${delMetodo.id}`, { method: 'DELETE', token });
      setDelMetodo(null);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyM(false);
    }
  }

  if (error && !cfg) return <div className="p-8 text-danger">{error}</div>;
  if (!cfg) return <div className="p-8 text-brand flex items-center justify-center py-24"><span className="spinner" /></div>;

  const inputCls = 'w-full rounded-lg border border-line px-3 py-2 text-sm';
  const field = (label: string, k: keyof Config, type = 'text', hint?: string) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-content">{label}</label>
      <input type={type} value={cfg[k]} onChange={(e) => set(k, e.target.value)} className={inputCls} />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content mb-1">Configuracion</h1>
      <p className="text-sm text-muted mb-6">Datos del negocio, parametros y metodos de pago.</p>

      {ok && <div className="bg-success/10 border border-success/30 text-success rounded-lg px-4 py-2 mb-4 text-sm">{ok}</div>}
      {error && <div className="text-danger text-sm mb-4">{error}</div>}

      <div className="grid lg:grid-cols-2 gap-6 items-start">
      <div className="bg-surface rounded-xl border border-line shadow-soft p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl border border-line bg-surface-2 flex items-center justify-center overflow-hidden shrink-0">
            {cfg.negocio_logo ? (
              <img src={`${apiBase}/${cfg.negocio_logo}`} alt="logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-xs text-muted">Sin logo</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-content">Logo del negocio</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
              className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-content file:text-sm"
            />
            <button onClick={subirLogo} disabled={!logoFile || subiendo} className="bg-surface-2 hover:bg-line text-content rounded-lg px-4 py-1.5 text-sm disabled:opacity-50">
              {subiendo ? 'Subiendo...' : 'Subir logo'}
            </button>
            <p className="text-xs text-muted">Aparece en los recibos y estados de cuenta. JPG/PNG/WEBP, max 2MB.</p>
          </div>
        </div>

        {field('Nombre del negocio', 'negocio_nombre')}
        {field('WhatsApp de la oficina', 'whatsapp_oficina', 'text', 'Con codigo de pais, ej: 584121234567. Se usa en el boton Contacto del portal.')}

        <div className="grid grid-cols-2 gap-3">
          {field('Recargo de mora (% por dia)', 'recargo_mora_pct', 'number')}
          {field('Dias de gracia', 'dias_gracia', 'number')}
        </div>

        <div className="pt-2">
          <button onClick={guardar} disabled={saving} className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Metodos de pago */}
      <div className="bg-surface rounded-xl border border-line shadow-soft p-6">
        <h2 className="font-semibold text-content mb-1">Metodos de pago</h2>
        <p className="text-sm text-muted mb-4">Los que aparecen al registrar un pago.</p>

        <div className="flex gap-2 mb-4">
          <input value={nombreMetodo} onChange={(e) => setNombreMetodo(e.target.value)} placeholder="Nuevo metodo (ej: Zelle, Binance...)" className={inputCls} />
          <button onClick={agregarMetodo} disabled={busyM || !nombreMetodo.trim()} className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60 shrink-0">
            Agregar
          </button>
        </div>

        <div className="divide-y divide-line border border-line rounded-lg overflow-hidden">
          {metodos.length === 0 ? (
            <div className="px-4 py-4 text-center text-muted text-sm">Sin metodos.</div>
          ) : (
            metodos.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="font-medium text-content">{m.nombre}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleMetodo(m.id)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m.activo ? 'bg-success/15 text-success' : 'bg-surface-2 text-muted'}`}>
                    {m.activo ? 'Activo' : 'Inactivo'}
                  </button>
                  <button onClick={() => setDelMetodo(m)} title="Eliminar" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-danger hover:bg-danger/15 transition-colors">
                    <IconX />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>

      <Confirm
        open={delMetodo !== null}
        title="Eliminar metodo"
        message={`Eliminar el metodo "${delMetodo?.nombre}"? Los pagos ya registrados con el conservan su nombre.`}
        confirmLabel="Eliminar"
        danger
        loading={busyM}
        onConfirm={eliminarMetodo}
        onClose={() => setDelMetodo(null)}
      />
    </div>
  );
}
