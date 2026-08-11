'use client';

import ThemeToggle from '@/components/ThemeToggle';
import TopLoader from '@/components/TopLoader';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-content">
      <TopLoader />
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-8 bg-surface/80 backdrop-blur border-b border-line">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-hover text-brand-fg font-bold">
            P
          </span>
          <span className="font-bold text-content">Portal del cliente</span>
        </div>
        <ThemeToggle />
      </header>
      <main className="animate-fade-in">{children}</main>
    </div>
  );
}
