export function money(n: number | string): string {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  return (Number.isFinite(v) ? v : 0).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fecha(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
