'use client';

import { api } from './api';
import { getSession } from './auth';
import type { MiPlan } from '@/types';

let cache: MiPlan | null = null;

/** Carga el plan de la casa (con cache en memoria). */
export async function loadMiPlan(force = false): Promise<MiPlan | null> {
  if (cache && !force) return cache;
  try {
    cache = await api<MiPlan>('/mi-plan', { token: getSession()?.token });
    return cache;
  } catch {
    return null;
  }
}

export function cachedPlan(): MiPlan | null {
  return cache;
}

export function clearPlanCache(): void {
  cache = null;
}

/** True si el plan de la casa incluye la funcion (usa el cache ya cargado). */
export function tieneFeature(f: string): boolean {
  return !!cache?.features?.includes(f);
}
