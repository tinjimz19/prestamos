import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prestamos y Cobranzas',
  description: 'Sistema de gestion de prestamos y cobranzas',
};

const themeScript = `
(function(){try{
  var t = localStorage.getItem('theme');
  var d = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (d) document.documentElement.classList.add('dark');
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
