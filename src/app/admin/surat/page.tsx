'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubmissionList } from './_components/submission-list';

export default function AdminSuratPage() {
  return (
    <>
      <PageHeader
        title="Kelola Pengajuan Surat"
        description="Tinjau, setujui, atau tolak pengajuan surat dari warga Desa Sampeldes."
      />
      <Card className="rounded-[24px] neu-dashboard-card border border-white/80 overflow-hidden">
        <CardHeader className="p-5 sm:p-6 border-b border-black/[0.05] bg-white/40">
          <CardTitle className="text-base sm:text-xl font-condensed font-extrabold uppercase tracking-tight text-slate-900">
            Daftar Pengajuan Masuk
          </CardTitle>
          <CardDescription className="text-xs font-medium text-slate-600">
            Seluruh permohonan surat dari warga yang masuk ke sistem.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <SubmissionList />
        </CardContent>
      </Card>
    </>
  );
}
