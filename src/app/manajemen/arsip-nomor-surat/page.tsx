'use client';

import React from 'react';
import { RegisterNomorSuratTab } from '@/app/admin/settings/_components/register-nomor-surat-tab';

export default function ArsipNomorSuratPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto font-sans">
      <RegisterNomorSuratTab defaultCategory="surat_keluar" />
    </div>
  );
}
