'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import type { UsuarioRow } from '@/types';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'cobrador', telefono: '' });
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  async function cargar() {
    setError('');
    try {
      const token = getSession()?.token;
      const r = await api<{ data: UsuarioRow[] }>('/usuarios', { token });
      setUsuarios(r.data);
      setPage(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function crear() {
    setMsg('');
    if (!form.nombre || !form.email || !form.password) {
      setMsg('Completa nombre, email y contrasena');
      return;
    }
    setSaving(true);
    try {
      const token = getSession()?.token;
      await api('/usuarios', { method: 'POST', body: form, token });
      setForm({ nombre: '', email: '', password: '', rol: 'cobrador', telefono: '' });
      setOpen(false);
      await cargar();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-lg border border-line px-3 py-2 text-sm';
  const paged = usuarios.slice((page - 1) * 10, page * 10);

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-content">Usuarios</h1>
        <button onClick={() => setOpen(true)} className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 text-sm rounded-lg px-4 py-2">
          + Nuevo usuario
        </button>
      </div>
      {error && <div className="text-danger text-sm mb-3">{error}</div>}

      <div className="bg-surface rounded-xl border border-line shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="px-4 py-2.5 text-left">Nombre</th>
              <th className="px-4 py-2.5 text-left">Email</th>
              <th className="px-4 py-2.5 text-left">Rol</th>
              <th className="px-4 py-2.5 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-2.5 font-medium text-content">{u.nombre}</td>
                <td className="px-4 py-2.5 text-muted">{u.email}</td>
                <td className="px-4 py-2.5 capitalize">{u.rol}</td>
                <td className="px-4 py-2.5">{u.activo ? 'Activo' : 'Inactivo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} total={usuarios.length} onPage={setPage} />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo usuario">
        {msg && <div className="text-sm text-danger mb-3">{msg}</div>}
        <div className="space-y-3">
          <input placeholder="Nombre" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className={inputCls} />
          <input placeholder="Email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
          <input type="password" placeholder="Contrasena" value={form.password} onChange={(e) => set('password', e.target.value)} className={inputCls} />
          <select value={form.rol} onChange={(e) => set('rol', e.target.value)} className={inputCls}>
            <option value="cobrador">Cobrador</option>
            <option value="cajero">Cajero</option>
            <option value="admin">Admin</option>
            <option value="cliente">Cliente</option>
          </select>
          <input placeholder="Telefono (opcional)" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} className={inputCls} />
          <button onClick={crear} disabled={saving} className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
            {saving ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
