'use client';

import { useEffect, useState } from 'react';

type Estado = 'default' | 'granted' | 'denied' | 'unsupported';

export default function NotificacionesCard() {
  const [perm, setPerm] = useState<Estado>('default');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      setPerm('unsupported');
      return;
    }
    setPerm(Notification.permission as Estado);
  }, []);

  async function activar() {
    if (typeof Notification === 'undefined') return;
    const p = (await Notification.requestPermission()) as Estado;
    setPerm(p);
    if (p === 'granted') probar();
  }

  async function probar() {
    setMsg('');
    try {
      const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
      if (reg) {
        await reg.showNotification('Prestamos SP', { body: 'Las notificaciones estan activas.', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' });
      } else {
        new Notification('Prestamos SP', { body: 'Las notificaciones estan activas.' });
      }
    } catch {
      setMsg('No se pudo mostrar la notificacion de prueba.');
    }
  }

  return (
    <div className="bg-surface rounded-xl border border-line shadow-soft p-5 mt-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-medium text-content">Notificaciones</div>
          <p className="text-sm text-muted">
            {perm === 'unsupported' && 'Tu navegador no soporta notificaciones.'}
            {perm === 'default' && 'Actívalas para recibir avisos importantes.'}
            {perm === 'granted' && 'Activadas en este dispositivo.'}
            {perm === 'denied' && 'Bloqueadas. Actívalas desde los ajustes del navegador.'}
          </p>
        </div>
        {perm === 'default' && (
          <button onClick={activar} className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 text-sm rounded-lg px-4 py-2">
            Activar
          </button>
        )}
        {perm === 'granted' && (
          <button onClick={probar} className="border border-line text-content hover:bg-surface-2 text-sm rounded-lg px-4 py-2 transition-colors">
            Probar
          </button>
        )}
      </div>
      {msg && <div className="text-danger text-sm mt-3">{msg}</div>}
      <p className="text-xs text-muted mt-3">
        Los avisos automaticos del servidor (por vencer, pagos, etc.) se activaran cuando el sistema este en produccion con HTTPS.
      </p>
    </div>
  );
}
