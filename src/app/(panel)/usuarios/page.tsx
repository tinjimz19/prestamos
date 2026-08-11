'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import type { UsuarioRow } from '@/types';

const blankNuevo = { nombre: '', email: '', password: '', rol: 'cobrador', telefono: '' };

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...blankNuevo });
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const [edit, setEdit] = useState<UsuarioRow | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', rol: 'cobrador', telefono: '' });
  const [editMsg, setEditMsg] = useState('');

  const [reset, setReset] = useState<UsuarioRow | null>(null);
  const [resetPass, setResetPass] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const yo = getSession()?.user.id;

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
      setForm({ ...blankNuevo });
      setOpen(false);
      await cargar();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  function abrirEdit(u: UsuarioRow) {
    setEditMsg('');
    setEditForm({ nombre: u.nombre, rol: u.rol, telefono: u.telefono ?? '' });
    setEdit(u);
  }

  async function guardarEdit() {
    if (!edit) return;
    setEditMsg('');
    if (!editForm.nombre) {
      setEditMsg('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const token = getSession()?.token;
      await api(`/usuarios/${edit.id}`, { method: 'POST', body: editForm, token });
      setEdit(null);
      await cargar();
    } catch (e) {
      setEditMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(u: UsuarioRow) {
    setError('');
    try {
      const token = getSession()?.token;
      await api(`/usuarios/${u.id}/toggle`, { method: 'POST', token });
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  async function guardarReset() {
    if (!reset) return;
    setResetMsg('');
    if (resetPass.length < 4) {
      setResetMsg('La contrasena debe tener al menos 4 caracteres');
      return;
    }
    setSaving(true);
    try {
      const token = getSession()?.token;
      await api(`/usuarios/${reset.id}/password`, { method: 'POST', body: { password: resetPass }, token });
      setReset(null);
      setResetPass('');
    } catch (e) {
      setResetMsg(e instanceof Error ? e.message : 'Error');
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
        <button onClick={() => { setMsg(''); setForm({ ...blankNuevo }); setOpen(true); }} className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 text-sm rounded-lg px-4 py-2">
          + Nuevo usuario
        </button>
      </div>
      {error && <div className="text-danger text-sm mb-3">{error}</div>}

      <div className="bg-surface rounded-xl border border-line shadow-soft overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="px-4 py-2.5 text-left">Nombre</th>
              <th className="px-4 py-2.5 text-left">Email</th>
              <th className="px-4 py-2.5 text-left">Rol</th>
              <th className="px-4 py-2.5 text-left">Estado</th>
              <th className="px-4 py-2.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-2.5 font-medium text-content">{u.nombre}</td>
                <td className="px-4 py-2.5 text-muted">{u.email}</td>
                <td className="px-4 py-2.5 capitalize">{u.rol}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${u.activo ? 'bg-success/15 text-success border-success/30' : 'bg-muted/15 text-muted border-line'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1.5 flex-wrap">
                    <button onClick={() => abrirEdit(u)} className="text-xs px-2.5 py-1 rounded-lg border border-line hover:bg-surface-2 transition-colors">Editar</button>
                    <button onClick={() => { setResetMsg(''); setResetPass(''); setReset(u); }} className="text-xs px-2.5 py-1 rounded-lg border border-line hover:bg-surface-2 transition-colors">Clave</button>
                    {u.id !== yo && (
                      <button
                        onClick={() => toggle(u)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${u.activo ? 'border-danger/40 text-danger hover:bg-danger/10' : 'border-success/40 text-success hover:bg-success/10'}`}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} total={usuarios.length} onPage={setPage} />
      </div>

      {/* Nuevo */}
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo usuario">
        {msg && <div className="text-sm text-danger mb-3">{msg}</div>}
        <div className="space-y-3">
          <input placeholder="Nombre" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className={inputCls} />
          <input placeholder="Email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
          <input type="text" placeholder="Contrasena" value={form.password} onChange={(e) => set('password', e.target.value)} className={inputCls} />
          <select value={form.rol} onChange={(e) => set('rol', e.target.value)} className={inputCls}>
            <option value="cobrador">Cobrador</option>
            <option value="cajero">Cajero</option>
            <option value="admin">Admin</option>
          </select>
          <input placeholder="Telefono (opcional)" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} className={inputCls} />
          <button onClick={crear} disabled={saving} className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
            {saving ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      </Modal>

      {/* Editar */}
      <Modal open={edit !== null} onClose={() => setEdit(null)} title={`Editar ${edit?.nombre ?? ''}`}>
        {editMsg && <div className="text-sm text-danger mb-3">{editMsg}</div>}
        <div className="space-y-3">
          <input placeholder="Nombre" value={editForm.nombre} onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))} className={inputCls} />
          <select value={editForm.rol} onChange={(e) => setEditForm((f) => ({ ...f, rol: e.target.value }))} className={inputCls}>
            <option value="cobrador">Cobrador</option>
            <option value="cajero">Cajero</option>
            <option value="admin">Admin</option>
          </select>
          <input placeholder="Telefono (opcional)" value={editForm.telefono} onChange={(e) => setEditForm((f) => ({ ...f, telefono: e.target.value }))} className={inputCls} />
          <p className="text-xs text-muted">El email no se puede cambiar (es la llave de acceso).</p>
          <button onClick={guardarEdit} disabled={saving} className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </Modal>

      {/* Reset contrasena */}
      <Modal open={reset !== null} onClose={() => setReset(null)} title={`Nueva contrasena · ${reset?.nombre ?? ''}`}>
        {resetMsg && <div className="text-sm text-danger mb-3">{resetMsg}</div>}
        <div className="space-y-3">
          <input type="text" placeholder="Nueva contrasena" value={resetPass} onChange={(e) => setResetPass(e.target.value)} className={inputCls} />
          <button onClick={guardarReset} disabled={saving} className="w-full bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
            {saving ? 'Guardando...' : 'Cambiar contrasena'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
