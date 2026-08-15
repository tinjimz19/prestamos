/* Logo de marca SisPrest (monograma SP). Usa el icono generado en /public. */
export default function Logo({ size = 36, className = '' }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src="/icons/icon-192.png"
      alt="SisPrest"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
