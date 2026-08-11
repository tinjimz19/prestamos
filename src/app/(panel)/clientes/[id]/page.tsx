'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { money } from '@/lib/format';
import Pagination from '@/components/Pagination';
import { IconEye } from '@/components/icons';
import type { Cliente, Prestamo, Score } from '@/types';

const SCORE_CLS: Record<string, string> = {
  Excelente: 'bg-success/15 text-success border-success/30',
  Bueno: 'bg-brand/15 text-brand border-brand/30',
  Regular: 'bg-warning/15 text-warning border-warning/30',
  Riesgo: 'bg-danger/15 text-danger border-danger/30',
  'Sin historial': 'bg-surface-2 text-muted border-line',
};

export default function ClienteDetallePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [score, setScore] = useState<Score | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const token = getSession()?.token;
    api<{ data: Cliente; prestamos: Prestamo[]; score: Score }>(`/clientes/${id}`, { token })
      .then((r) => {
        setCliente(r.data);
        setPrestamos(r.prestamos);
        setScore(r.score);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, [id]);

  if (error) return <div className="p-8 text-danger">{error}</div>;
  if (!cliente) return <div className="p-8 text-brand flex items-center justify-center py-24"><span className="spinner" /></div>;

  const paged = prestamos.slice((page - 1) * 10, page * 10);

  return (
    <div className="p-6 md:p-8">
      <Link href="/clientes" className="text-sm text-brand hover:underline">Volver a clientes</Link>
      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-content">{cliente.nombre}</h1>
            {score && (
              <span
                title={
                  score.valor !== null
                    ? `${score.detalle.pagados} pagados · ${score.detalle.con_atraso} con atraso · ${score.detalle.cuotas_vencidas} cuotas vencidas`
                    : 'Aun sin prestamos'
                }
                className={`text-xs px-2 py-0.5 rounded-full border ${SCORE_CLS[score.etiqueta] ?? SCORE_CLS['Sin historial']}`}
              >
                {score.valor !== null ? `Score ${score.valor} · ${score.etiqueta}` : 'Sin historial'}
              </span>
            )}
          </div>
          <p className="text-muted text-sm">
            {cliente.telefono ?? 'sin telefono'} - {cliente.cedula ?? 'sin cedula'}
          </p>
        </div>
        <Link
          href={`/prestamos/nuevo?cliente=${cliente.id}`}
          className="bg-gradient-to-br from-brand to-brand-hover text-brand-fg shadow-sm shadow-brand/30 hover:shadow-md active:scale-95 text-sm rounded-lg px-4 py-2"
        >
          + Nuevo prestamo
        </Link>
      </div>

      <h2 className="font-semibold text-content mb-2">Prestamos</h2>
      <div className="bg-surface rounded-xl border border-line shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="text-left px-4 py-2.5">#</th>
              <th className="text-left px-4 py-2.5">Modalidad</th>
              <th className="text-right px-4 py-2.5">Monto</th>
              <th className="text-right px-4 py-2.5">Total</th>
              <th className="text-right px-4 py-2.5">Saldo</th>
              <th className="text-left px-4 py-2.5">Estado</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {prestamos.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">Sin prestamos</td></tr>
            ) : (
              paged.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-4 py-2.5">{p.id}</td>
                  <td className="px-4 py-2.5 capitalize">{p.modalidad}</td>
                  <td className="px-4 py-2.5 text-right">{money(p.monto)}</td>
                  <td className="px-4 py-2.5 text-right">{money(p.monto_total)}</td>
                  <td className="px-4 py-2.5 text-right">{money(p.saldo)}</td>
                  <td className="px-4 py-2.5 capitalize">{p.estado}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end">
                      <Link href={`/prestamos/${p.id}`} title="Ver" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand hover:bg-brand/10 transition-colors">
                        <IconEye />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination page={page} total={prestamos.length} onPage={setPage} />
      </div>
    </div>
  );
}
