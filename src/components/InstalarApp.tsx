'use client';

import { useEffect, useState } from 'react';
import { onPwaChange, canPrompt, promptInstall, isIOS, isInstalled } from '@/lib/pwa';
import Logo from '@/components/Logo';

export default function InstalarApp() {
  const [tick, setTick] = useState(0);
  const [ayuda, setAyuda] = useState(false);

  useEffect(() => onPwaChange(() => setTick((t) => t + 1)), []);
  // re-render dependency
  void tick;

  const ya = isInstalled();
  const ios = isIOS();
  const puede = canPrompt();

  async function onClick() {
    if (puede) {
      await promptInstall();
    } else {
      setAyuda((v) => !v);
    }
  }

  const desc = ya
    ? 'Ya estas usando SisPrest como app instalada.'
    : ios
      ? 'Instalala en tu iPhone para abrirla como una app.'
      : puede
        ? 'Instalala en este dispositivo para abrirla como una app, sin el navegador.'
        : 'Instalala para abrirla como una app. Si no ves el boton, usa el menu del navegador.';

  return (
    <div className="bg-surface rounded-xl border border-line shadow-soft p-5 mt-6">
      <div className="flex items-center gap-3">
        <Logo size={40} className="rounded-xl shadow-sm shadow-brand/30" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-content">Instalar la app</div>
          <p className="text-sm text-muted">{desc}</p>
        </div>
        {!ya && (
          <button
            onClick={onClick}
            className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 text-sm rounded-lg px-4 py-2 whitespace-nowrap"
          >
            {puede ? 'Instalar app' : 'Cómo instalar'}
          </button>
        )}
        {ya && <span className="text-xs px-2 py-0.5 rounded-full border bg-success/15 text-success border-success/30 whitespace-nowrap">Instalada</span>}
      </div>

      {ayuda && !ya && (
        <div className="mt-4 text-sm text-content bg-surface-2 rounded-lg p-4 space-y-2">
          {ios ? (
            <>
              <div className="font-medium">En iPhone / iPad (Safari):</div>
              <ol className="list-decimal pl-5 space-y-1 text-muted">
                <li>Toca el botón <b>Compartir</b> (el cuadro con la flecha ↑).</li>
                <li>Elige <b>“Agregar a inicio”</b>.</li>
                <li>Confirma con <b>Agregar</b>. El ícono SP quedará en tu pantalla.</li>
              </ol>
            </>
          ) : (
            <>
              <div className="font-medium">Desde el menú del navegador:</div>
              <ol className="list-decimal pl-5 space-y-1 text-muted">
                <li><b>Chrome (PC):</b> ícono de instalar al final de la barra de direcciones, o menú <b>⋮ → “Instalar SisPrest”</b>.</li>
                <li><b>Edge (PC):</b> menú <b>… → Aplicaciones → “Instalar este sitio como una aplicación”</b>.</li>
                <li><b>Android:</b> menú <b>⋮ → “Instalar aplicación”</b>.</li>
              </ol>
              <p className="text-xs text-muted">Nota: la instalación necesita Chrome o Edge (no Firefox) y, en el servidor real, HTTPS.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
