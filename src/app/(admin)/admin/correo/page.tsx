'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';

interface EstadoCorreo {
  configurado: boolean;
  host: string;
  usuario: string;
}

export default function CorreoPage() {
  const [estado, setEstado] = useState<EstadoCorreo | null>(null);
  const [para, setPara] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const token = () => getSession()?.token;

  useEffect(() => {
    api<EstadoCorreo>('/correo/estado', { token: token() })
      .then((e) => { setEstado(e); if (e.usuario) setPara(e.usuario); })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  async function probar() {
    setMsg(''); setError('');
    if (!para) { setError('Indica un correo de destino'); return; }
    setEnviando(true);
    try {
      const r = await api<{ message: string }>('/correo/probar', { method: 'POST', body: { para }, token: token() });
      setMsg(r.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setEnviando(false);
    }
  }

  const inputCls = 'w-full rounded-lg border border-line px-3 py-2 text-sm bg-surface';

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-content mb-1">Correo</h1>
      <p className="text-sm text-muted mb-6">Configuracion de envio de correos (Gmail SMTP).</p>

      {error && <div className="text-danger text-sm mb-3">{error}</div>}
      {msg && <div className="text-success text-sm mb-3">{msg}</div>}

      <div className="bg-surface rounded-xl border border-line shadow-soft p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-content">Estado</span>
          {estado && (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${estado.configurado ? 'bg-success/15 text-success border-success/30' : 'bg-danger/15 text-danger border-danger/30'}`}>
              {estado.configurado ? 'Configurado' : 'Sin configurar'}
            </span>
          )}
        </div>
        {estado && (
          <div className="text-sm text-muted space-y-1">
            <div>Servidor: <span className="text-content">{estado.host || '—'}</span></div>
            <div>Cuenta: <span className="text-content">{estado.usuario || '—'}</span></div>
          </div>
        )}
        {estado && !estado.configurado && (
          <p className="text-xs text-muted mt-3">
            Edita <b>config/mail.php</b> en el backend con tu correo de Gmail y una App Password de 16 caracteres.
          </p>
        )}
      </div>

      <div className="bg-surface rounded-xl border border-line shadow-soft p-5">
        <div className="font-medium text-content mb-3">Enviar correo de prueba</div>
        <div className="flex gap-2">
          <input value={para} onChange={(e) => setPara(e.target.value)} className={inputCls} placeholder="correo@destino.com" />
          <button onClick={probar} disabled={enviando} className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 text-sm rounded-lg px-4 py-2 whitespace-nowrap disabled:opacity-60">
            {enviando ? 'Enviando...' : 'Enviar prueba'}
          </button>
        </div>
      </div>
    </div>
  );
}
