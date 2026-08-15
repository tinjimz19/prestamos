'use client';

import ThemeToggle from '@/components/ThemeToggle';
import TopLoader from '@/components/TopLoader';
import Logo from '@/components/Logo';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-content">
      <TopLoader />
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-8 bg-surface/80 backdrop-blur border-b border-line">
        <div className="flex items-center gap-2">
          <Logo size={32} className="rounded-lg" />
          <span className="font-bold text-content">SisPrest</span>
        </div>
        <ThemeToggle />
      </header>
      <main className="animate-fade-in">{children}</main>
    </div>
  );
}
