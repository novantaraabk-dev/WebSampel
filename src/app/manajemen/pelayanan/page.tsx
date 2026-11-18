'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ManajemenPelayananRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/surat');
  }, [router]);

  return (
    <div className="flex h-96 w-full flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      <p className="text-xs font-medium text-slate-500">
        Mengalihkan ke Manajemen Surat di Pengaturan Website...
      </p>
    </div>
  );
}
