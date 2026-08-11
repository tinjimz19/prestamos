'use client';

import { useEffect, useState } from 'react';
import { onLoading } from '@/lib/api';

export default function TopLoader() {
  const [active, setActive] = useState(false);

  useEffect(() => onLoading((n) => setActive(n > 0)), []);

  return (
    <>
      {/* Barra superior animada */}
      <div
        className={`fixed top-0 inset-x-0 z-[70] h-[3px] pointer-events-none transition-opacity duration-200 ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="h-full bg-gradient-to-r from-transparent via-brand to-brand-hover bg-[length:200%_100%] animate-loader" />
      </div>

      {/* Indicador flotante */}
      <div
        className={`fixed bottom-4 right-4 z-[70] flex items-center gap-2 rounded-full bg-surface border border-line shadow-soft px-3 py-1.5 text-xs text-muted transition-all duration-200 ${
          active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <span className="spinner" style={{ width: 14, height: 14 }} />
        Cargando...
      </div>
    </>
  );
}
