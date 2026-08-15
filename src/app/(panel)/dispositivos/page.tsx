'use client';

import DispositivosPanel from '@/components/DispositivosPanel';
import NotificacionesCard from '@/components/NotificacionesCard';
import InstalarApp from '@/components/InstalarApp';

export default function DispositivosPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <DispositivosPanel />
      <InstalarApp />
      <NotificacionesCard />
    </div>
  );
}
