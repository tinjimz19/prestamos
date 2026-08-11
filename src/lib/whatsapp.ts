// Utilidades para enviar mensajes por WhatsApp con enlaces wa.me (sin costo).
// Codigo de pais por defecto: 58 (Venezuela).

export function normalizarTelefono(tel: string | null | undefined, code = '58'): string {
  const d = (tel ?? '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith(code)) return d;
  if (d.startsWith('0')) return code + d.slice(1);
  return code + d;
}

export function waLink(tel: string | null | undefined, text: string): string {
  const num = normalizarTelefono(tel);
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
