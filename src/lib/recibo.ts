import { money } from '@/lib/format';

export interface ReciboData {
  numero: number | string;
  fecha: string;
  cliente: string;
  prestamoId: number;
  monto: string | number;
  metodo: string;
  saldo: string | number;
  moneda?: string;
  montoMoneda?: string | number | null;
  negocio?: string;
  logo?: string;
}

export function imprimirRecibo(d: ReciboData): void {
  const negocio = d.negocio ?? 'Prestamos y Cobranzas';
  const w = window.open('', '_blank', 'width=420,height=680');
  if (!w) {
    alert('Permite las ventanas emergentes para generar el recibo.');
    return;
  }
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Recibo #${d.numero}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif}
  body{padding:24px;color:#0f172a}
  .card{max-width:360px;margin:0 auto;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden}
  .head{background:linear-gradient(135deg,#4f46e5,#4338ca);color:#fff;padding:18px 20px}
  .head h1{font-size:16px;font-weight:700}
  .head p{font-size:12px;opacity:.9;margin-top:2px}
  .tag{display:inline-block;margin-top:8px;background:rgba(255,255,255,.2);padding:2px 8px;border-radius:999px;font-size:11px}
  .body{padding:20px}
  .row{display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px dashed #e2e8f0}
  .row span:first-child{color:#64748b}
  .row span:last-child{font-weight:600}
  .monto{text-align:center;margin:18px 0}
  .monto .lbl{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
  .monto .val{font-size:30px;font-weight:800;color:#4f46e5}
  .foot{text-align:center;font-size:12px;color:#64748b;padding:14px;border-top:1px solid #e2e8f0}
  @media print{ .noprint{display:none} body{padding:0} }
  .btn{display:block;width:100%;max-width:360px;margin:16px auto 0;padding:12px;border:0;border-radius:10px;background:#4f46e5;color:#fff;font-size:14px;font-weight:600;cursor:pointer}
</style></head>
<body>
  <div class="card">
    <div class="head">
      ${d.logo ? `<img src="${d.logo}" alt="logo" style="max-height:46px;margin-bottom:8px" />` : ''}
      <h1>${negocio}</h1>
      <p>Comprobante de pago</p>
      <span class="tag">Recibo #${d.numero}</span>
    </div>
    <div class="body">
      <div class="row"><span>Fecha</span><span>${d.fecha}</span></div>
      <div class="row"><span>Cliente</span><span>${d.cliente}</span></div>
      <div class="row"><span>Prestamo</span><span>#${d.prestamoId}</span></div>
      <div class="row"><span>Metodo</span><span style="text-transform:capitalize">${d.metodo}</span></div>
      <div class="monto">
        <div class="lbl">Monto pagado</div>
        <div class="val">${money(d.monto)}</div>
      </div>
      ${d.moneda === 'VES' && d.montoMoneda != null ? `<div class="row"><span>Pagado en Bs</span><span>Bs ${money(d.montoMoneda)}</span></div>` : ''}
      <div class="row"><span>Saldo restante</span><span>${money(d.saldo)}</span></div>
    </div>
    <div class="foot">Gracias por su pago</div>
  </div>
  <button class="btn noprint" onclick="window.print()">Imprimir / Guardar PDF</button>
</body></html>`;
  w.document.write(html);
  w.document.close();
  w.focus();
}

export interface EstadoCuota {
  numero: number;
  fecha_venc: string;
  monto_cuota: string | number;
  pagado: string | number;
  estado: string;
}

export interface EstadoData {
  negocio?: string;
  cliente: string;
  prestamoId: number;
  modalidad: string;
  saldo: string | number;
  monto_total: string | number;
  cuotas: EstadoCuota[];
  logo?: string;
}

export function imprimirEstado(d: EstadoData): void {
  const negocio = d.negocio ?? 'Prestamos y Cobranzas';
  const w = window.open('', '_blank', 'width=720,height=800');
  if (!w) {
    alert('Permite las ventanas emergentes para generar el estado de cuenta.');
    return;
  }
  const filas = d.cuotas
    .map(
      (c) => `<tr>
        <td>${c.numero}</td>
        <td>${c.fecha_venc}</td>
        <td style="text-align:right">${money(c.monto_cuota)}</td>
        <td style="text-align:right">${money(c.pagado)}</td>
        <td style="text-transform:capitalize">${c.estado}</td>
      </tr>`,
    )
    .join('');
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Estado de cuenta - Prestamo #${d.prestamoId}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif}
  body{padding:28px;color:#0f172a}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #4f46e5;padding-bottom:12px;margin-bottom:16px}
  .head h1{font-size:18px;color:#4f46e5}
  .head p{font-size:12px;color:#64748b;margin-top:2px}
  .meta{font-size:13px;line-height:1.7;margin-bottom:16px}
  .meta b{color:#334155}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{border:1px solid #e2e8f0;padding:7px 9px}
  th{background:#f1f5f9;text-align:left;color:#475569}
  .tot{margin-top:14px;text-align:right;font-size:14px}
  .tot b{color:#4f46e5;font-size:18px}
  @media print{ .noprint{display:none} body{padding:0} }
  .btn{display:inline-block;margin-top:16px;padding:10px 18px;border:0;border-radius:8px;background:#4f46e5;color:#fff;font-weight:600;cursor:pointer}
</style></head><body>
  <div class="head">
    <div>${d.logo ? `<img src="${d.logo}" alt="logo" style="max-height:44px;margin-bottom:6px" /><br>` : ''}<h1>${negocio}</h1><p>Estado de cuenta</p></div>
    <div style="text-align:right;font-size:12px;color:#64748b">Prestamo #${d.prestamoId}<br>${d.modalidad}</div>
  </div>
  <div class="meta">
    <div><b>Cliente:</b> ${d.cliente}</div>
    <div><b>Total a pagar:</b> ${money(d.monto_total)}</div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Vence</th><th style="text-align:right">Cuota</th><th style="text-align:right">Pagado</th><th>Estado</th></tr></thead>
    <tbody>${filas}</tbody>
  </table>
  <div class="tot">Saldo pendiente: <b>${money(d.saldo)}</b></div>
  <button class="btn noprint" onclick="window.print()">Imprimir / Guardar PDF</button>
</body></html>`;
  w.document.write(html);
  w.document.close();
  w.focus();
}
