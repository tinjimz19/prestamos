import type { Metadata } from 'next';
import './globals.css';
import PWA from '@/components/PWA';

export const metadata: Metadata = {
  title: 'SisPrest',
  description: 'SisPrest - Sistema de gestion de prestamos y cobranzas',
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
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#4F46E5" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SP" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <PWA />
      </body>
    </html>
  );
}
