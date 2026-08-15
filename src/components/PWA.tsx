'use client';

import { useEffect } from 'react';
import { initPwa } from '@/lib/pwa';

/** Registra el service worker y captura el evento de instalacion. Sin UI. */
export default function PWA() {
  useEffect(() => {
    initPwa();
  }, []);
  return null;
}
