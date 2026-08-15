'use client';

import DispositivosPanel from '@/components/DispositivosPanel';
import InstalarApp from '@/components/InstalarApp';

export default function AdminDispositivosPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <DispositivosPanel />
      <InstalarApp />
    </div>
  );
}
