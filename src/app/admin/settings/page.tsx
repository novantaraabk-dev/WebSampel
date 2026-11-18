'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Hash, Globe, FileCheck2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { SettingsForm } from './_components/settings-form';
import { LogoSettingsForm } from './_components/logo-settings-form';
import { HeroSettingsForm } from './_components/hero-settings-form';
import { ServiceCardsSettingsForm } from './_components/service-cards-settings-form';
import { DriveSettingsForm } from './_components/drive-settings-form';
import { VideoProfileSettingsForm } from './_components/video-profile-settings-form';
import { FooterLogosSettingsForm } from './_components/footer-logos-settings-form';
import { AccompanyingImageSettingsForm, KadesPhotoSettingsForm, PengaduanImageSettingsForm } from './_components/cloudinary-images-form';
import { DesaAntiKorupsiDriveForm } from './_components/desa-anti-korupsi-drive-form';
import { ImportantNumbersSettingsForm } from './_components/important-numbers-settings-form';
import { PbbSettingsForm } from './_components/pbb-settings-form';
import { SocialLinksSettingsForm } from './_components/social-links-settings-form';
import { RegisterNomorSuratTab } from './_components/register-nomor-surat-tab';
import { VillageIdentitySettingsForm } from './_components/village-identity-settings-form';

function AdminSettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeMainTab, setActiveMainTab] = useState<'website' | 'register-surat'>('website');
  const [registerCategory, setRegisterCategory] = useState<string>('surat_keluar');

  useEffect(() => {
    if (tabParam === 'register-surat' || tabParam === 'register') {
      setActiveMainTab('register-surat');
      setRegisterCategory('surat_keluar');
    } else if (tabParam === 'kode-klasifikasi' || tabParam === 'klasifikasi') {
      setActiveMainTab('register-surat');
      setRegisterCategory('kode_klasifikasi');
    } else if (tabParam === 'kode-dinas' || tabParam === 'dinas') {
      setActiveMainTab('register-surat');
      setRegisterCategory('kode_dinas');
    } else if (
      tabParam === 'permohonan-surat' ||
      tabParam === 'permohonan' ||
      tabParam === 'pengaturan-permohonan-surat'
    ) {
      setActiveMainTab('register-surat');
      setRegisterCategory('permohonan_surat');
    }
  }, [tabParam]);

  return (
    <div className="space-y-6 pb-12 sm:pb-20 w-full max-w-full overflow-x-hidden min-w-0">
      <PageHeader
        title="Pengaturan Sistem"
        description="Kelola konfigurasi sistem website desa, templat dokumen, serta buku agenda dan register penomoran surat dinas."
      />

      {/* Main Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-300 dark:border-white/10 pb-3">
        <Button
          onClick={() => setActiveMainTab('website')}
          variant={activeMainTab === 'website' ? 'default' : 'outline'}
          className={cn(
            'rounded-xl text-xs font-bold gap-2 h-10 px-4 transition-all',
            activeMainTab === 'website'
              ? 'neu-btn-dark text-[#d4e157] hover:bg-slate-900 shadow-md border border-white/10'
              : 'neu-card-elevated text-slate-700 dark:text-slate-300 hover:text-slate-900'
          )}
        >
          <Globe className="h-4 w-4" />
          <span>Pengaturan Konten &amp; Website</span>
        </Button>

        <Button
          onClick={() => {
            setActiveMainTab('register-surat');
            setRegisterCategory('surat_keluar');
          }}
          variant={activeMainTab === 'register-surat' ? 'default' : 'outline'}
          className={cn(
            'rounded-xl text-xs font-bold gap-2 h-10 px-4 transition-all',
            activeMainTab === 'register-surat'
              ? 'neu-btn-dark text-[#d4e157] hover:bg-slate-900 shadow-md border border-white/10'
              : 'neu-card-elevated text-slate-700 dark:text-slate-300 hover:text-slate-900'
          )}
        >
          <Hash className="h-4 w-4" />
          <span>Register Nomor Surat &amp; Tata Naskah</span>
        </Button>
      </div>

      {activeMainTab === 'register-surat' ? (
        <RegisterNomorSuratTab defaultCategory={registerCategory} />
      ) : (
        <div className="grid gap-3.5 sm:gap-6">
          <VillageIdentitySettingsForm />
          <HeroSettingsForm />
          <ServiceCardsSettingsForm />
          <VideoProfileSettingsForm />
          <ImportantNumbersSettingsForm />
          <PbbSettingsForm />

          {/* Baris 1: Upload Gambar Pendamping + Upload Foto Kades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6 items-start">
            <AccompanyingImageSettingsForm />
            <KadesPhotoSettingsForm />
          </div>

          {/* Baris 2: Upload Pengaduan Masyarakat + Logo Desa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6 items-start">
            <PengaduanImageSettingsForm />
            <LogoSettingsForm />
          </div>

          {/* Baris 3: Templat Kop Surat + Konfigurasi Google Drive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6 items-start">
            <SettingsForm />
            <DriveSettingsForm />
          </div>

          <DesaAntiKorupsiDriveForm />
          <SocialLinksSettingsForm />
          <FooterLogosSettingsForm />
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Memuat Pengaturan...</div>}>
      <AdminSettingsContent />
    </Suspense>
  );
}
