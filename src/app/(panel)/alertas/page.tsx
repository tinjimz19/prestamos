'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { money, fecha } from '@/lib/format';
import { waLink } from '@/lib/whatsapp';
import Pagination from '@/components/Pagination';
import { IconCoins, IconWhatsApp } from '@/components/icons';
import type { Notificaciones, NotiCuota } from '@/types';

function Tabla({
  items,
  vencida,
  page,
  onPage,
}: {
  items: NotiCuota[];
  vencida: boolean;
  page: number;
  onPage: (p: number) => void;
}) {
  const mensaje = (c: NotiCuota) =>
    `Hola ${c.cliente}, ${
      vencida
        ? `su cuota #${c.numero} de ${money(c.monto)} esta vencida (${c.dias} dia(s) de atraso)`
        : `su cuota #${c.numero} de ${money(c.monto)} vence en ${c.dias} dia(s)`
    }. Gracias.`;
  const paged = items.slice((page - 1) * 10, page * 10);

  return (
    <div className="bg-surface rounded-xl border border-line shadow-soft overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-2 text-muted">
          <tr>
            <th className="px-4 py-2.5 text-left">Cliente</th>
            <th className="px-4 py-2.5 text-left">Telefono</th>
            <th className="px-4 py-2.5 text-left">Cuota</th>
            <th className="px-4 py-2.5 text-left">Vence</th>
            <th className="px-4 py-2.5 text-right">Monto</th>
            <th className="px-4 py-2.5 text-right">Dias</th>
            <th className="px-4 py-2.5 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">Nada por aqui.</td></tr>
          ) : (
            paged.map((c) => (
              <tr key={c.cuota_id} className="border-t border-line">
                <td className="px-4 py-2.5 font-medium text-content">{c.cliente}</td>
                <td className="px-4 py-2.5 text-muted">{c.telefono ?? '-'}</td>
                <td className="px-4 py-2.5">#{c.numero}</td>
                <td className="px-4 py-2.5">{fecha(c.fecha_venc)}</td>
                <td className="px-4 py-2.5 text-right">{money(c.monto)}</td>
                <td className={`px-4 py-2.5 text-right font-medium ${vencida ? 'text-danger' : 'text-warning'}`}>
                  {vencida ? `${c.dias} atraso` : `en ${c.dias}`}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1.5">
                    {c.telefono && (
                      <a
                        href={waLink(c.telefono, mensaje(c))}
                        target="_blank"
                        rel="noreferrer"
                        title="Enviar recordatorio por WhatsApp"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-success hover:bg-success/15 transition-colors"
                      >
                        <IconWhatsApp />
                      </a>
                    )}
                    <Link
                      href={`/prestamos/${c.prestamo_id}`}
                      title="Cobrar"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand hover:bg-brand/10 transition-colors"
                    >
                      <IconCoins />
                    </Link>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <Pagination page={page} total={items.length} onPage={onPage} />
    </div>
  );
}

export default function AlertasPage() {
  const [data, setData] = useState<Notificaciones | null>(null);
  const [error, setError] = useState('');
  const [pageV, setPageV] = useState(1);
  const [pageP, setPageP] = useState(1);

  useEffect(() => {
    const token = getSession()?.token;
    api<Notificaciones>('/notificaciones?dias=5', { token })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  if (error) return <div className="p-8 text-danger">{error}</div>;
  if (!data) return <div className="p-8 text-brand flex items-center justify-center py-24"><span className="spinner" /></div>;

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content mb-6">Alertas</h1>

      <div className="flex gap-3 mb-6">
        <div className="bg-danger/10 border border-danger/30 rounded-xl px-5 py-3">
          <div className="text-2xl font-bold text-danger">{data.resumen.vencidas}</div>
          <div className="text-xs text-danger">Cuotas vencidas</div>
        </div>
        <div className="bg-warning/10 border border-warning/30 rounded-xl px-5 py-3">
          <div className="text-2xl font-bold text-warning">{data.resumen.por_vencer}</div>
          <div className="text-xs text-warning">Por vencer (5 dias)</div>
        </div>
      </div>

      <h2 className="font-semibold text-danger mb-2">Vencidas</h2>
      <div className="mb-6">
        <Tabla items={data.vencidas} vencida={true} page={pageV} onPage={setPageV} />
      </div>

      <h2 className="font-semibold text-warning mb-2">Por vencer</h2>
      <Tabla items={data.por_vencer} vencida={false} page={pageP} onPage={setPageP} />
    </div>
  );
}
