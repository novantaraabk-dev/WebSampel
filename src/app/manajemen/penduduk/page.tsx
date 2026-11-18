'use client';

import { PageHeader } from '@/components/page-header';
import { ResidentList } from '@/app/admin/penduduk/_components/resident-list';

export default function ManajemenPendudukPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Database Kependudukan"
        description="Manajemen data penduduk Desa Sampeldes. Kelola data warga, pencarian cepat, filtering dusun/RT/RW, cetak rekapitulasi, serta ekspor & impor data."
      />

      <ResidentList />
    </div>
  );
}

