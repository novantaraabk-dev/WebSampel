'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Printer, ArrowLeft, Edit3, Check, FileText, FileSpreadsheet, QrCode, PenTool, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { LetterSubmission, KopSuratInfo, VillageLogoInfo, Resident } from '@/lib/types';
import { getResidentByNik } from '@/lib/residents';
import { SEED_PERMOHONAN_SURAT, type PermohonanSuratItem } from '@/lib/permohonan-surat-data';
import {
  MASTER_LAMPIRAN_SURAT,
  renderLampiranPagesForLetter,
  type LampiranSuratItem,
} from '@/lib/lampiran-surat-data';
import {
  OPENSID_GLOBAL_SETTINGS_DEFAULT,
  SURAT_KETERANGAN_KEMATIAN_TEMPLATE,
  SURAT_KETERANGAN_DOMISILI_TEMPLATE,
  SURAT_PERMOHONAN_PERUBAHAN_KK_TEMPLATE,
  SURAT_PERMOHONAN_DUPLIKAT_AKTA_KELAHIRAN_TEMPLATE,
  SURAT_PERNYATAAN_BEDA_NAMA_TEMPLATE,
  SURAT_PENGANTAR_NIKAH_TEMPLATE,
  SURAT_KETERANGAN_NIKAH_NON_MUSLIM_TEMPLATE,
  SURAT_KETERANGAN_BELUM_MENIKAH_TEMPLATE,
  SURAT_KETERANGAN_WALI_HAKIM_TEMPLATE,
  SURAT_PERMOHONAN_DUPLIKAT_SURAT_NIKAH_TEMPLATE,
  SURAT_PENGANTAR_CERAI_RUJUK_TEMPLATE,
  SURAT_SPORADIK_TEMPLATE,
  SURAT_KETERANGAN_KEPEMILIKAN_TANAH_TEMPLATE,
  SURAT_KETERANGAN_JUAL_BELI_TANAH_TEMPLATE,
  SURAT_KETERANGAN_PEMAKAMAN_TEMPLATE,
  SURAT_PENGANTAR_KEHILANGAN_TEMPLATE,
  SURAT_IJIN_KERAMAIAN_TEMPLATE,
  SURAT_PENGANTAR_SKCK_TEMPLATE,
  SURAT_PENGANTAR_UMUM_TEMPLATE,
  SURAT_KETERANGAN_UMUM_TEMPLATE,
  BULAN_INDONESIA,
  terbilangIndonesia,
  enrichPermohonanSuratWithOpenSid,
  formatAlamatLengkapKtp,
  formatTanggalIndonesia,
  getNamaHariIndonesia,
  normalizeDateInput,
  matchMasterSuratItem,
  renderOpenSidDocumentPages,
  toTitleCaseIndonesian,
  normalizeRomanNumeralsInDocNumber,
  type OpenSidGlobalSuratSettings,
  type OpenSidRenderContext,
  type OpenSidPersonData,
} from '@/lib/opensid-surat-engine';
import { useVillageIdentity } from '@/lib/village-identity';
import { formatTTL } from './print-layout';

const GLOBAL_SETTINGS_STORAGE_KEY = 'opensid_global_surat_settings_v1';

interface OpenSidPrintTemplateProps {
  submission: LetterSubmission;
  masterItems?: PermohonanSuratItem[];
}

function applyDynamicOpenSidPrintStyle(
  mode: 'all' | 'pengantar' | 'lampiran',
  hasLandscapeLampiran: boolean,
  isA4Document = false,
) {
  if (typeof document === 'undefined') return;
  let styleEl = document.getElementById('dynamic-opensid-print-style') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-opensid-print-style';
    document.head.appendChild(styleEl);
  }

  const baseFontCss = `
    .opensid-sheet-page,
    .opensid-sheet-page *,
    .opensid-sheet-page p,
    .opensid-sheet-page table,
    .opensid-sheet-page td,
    .opensid-sheet-page th,
    .opensid-sheet-page div,
    .opensid-sheet-page span,
    .opensid-sheet-page h1,
    .opensid-sheet-page h2,
    .opensid-sheet-page h3,
    .opensid-sheet-page h4 {
      font-family: Arial, Helvetica, sans-serif !important;
    }
  `;

  let pageRule = isA4Document
    ? '@page { size: A4 portrait; margin: 0 !important; }'
    : '@page { size: auto; margin: 0 !important; }';

  if (mode === 'lampiran' && hasLandscapeLampiran) {
    pageRule = '@page { size: A4 landscape; margin: 0 !important; }';
  } else if (mode === 'pengantar' || isA4Document) {
    pageRule = '@page { size: A4 portrait; margin: 0 !important; }';
  }

  styleEl.textContent = `
    ${baseFontCss}
    @media print {
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
      }

      ${pageRule}

      .opensid-sheet-page {
        box-sizing: border-box !important;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: 287mm !important;
        margin: 0 !important;
        margin-bottom: 0 !important;
        box-shadow: none !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: page !important;
        break-after: page !important;
        overflow: hidden !important;
      }

      .opensid-sheet-page.sheet-folio {
        max-height: 320mm !important;
      }

      .opensid-sheet-page:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
    }
  `;
}

export function OpenSidPrintTemplate({ submission, masterItems }: OpenSidPrintTemplateProps) {
  const firestore = useFirestore();
  const { identity } = useVillageIdentity();

  // Ambil Kop Surat dari /admin/settings - Templat Kop Surat (kopSurat/default)
  const kopSuratRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'kopSurat', 'default') : null),
    [firestore],
  );
  const { data: kopInfo } = useDoc<KopSuratInfo>(kopSuratRef);

  // Ambil Logo Desa dari /admin/settings - Logo Desa (villageLogo/default)
  const villageLogoRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'villageLogo', 'default') : null),
    [firestore],
  );
  const { data: villageLogoData } = useDoc<VillageLogoInfo>(villageLogoRef);
  const villageLogoUrl = villageLogoData?.logoImageUrl || '';

  // Ambil Master Lampiran Surat dari Firestore (pengaturan_lampiran_surat)
  const lampiranColRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'pengaturan_lampiran_surat') : null),
    [firestore],
  );
  const { data: dbLampiranItems } = useCollection<LampiranSuratItem>(lampiranColRef);

  const [globalSettings, setGlobalSettings] = useState<OpenSidGlobalSuratSettings>(
    OPENSID_GLOBAL_SETTINGS_DEFAULT,
  );
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [customHtmlOverride, setCustomHtmlOverride] = useState<string>('');
  const [printMode, setPrintMode] = useState<'all' | 'pengantar' | 'lampiran'>('all');
  const [signerQuery, setSignerQuery] = useState<'kades' | 'sekdes' | null>(null);
  const [ttdMode, setTtdMode] = useState<'manual' | 'qr'>('manual');
  const [residentMap, setResidentMap] = useState<Record<string, Resident>>({});

  useEffect(() => {
    if (!firestore || !submission) return;
    const fd = submission.formData || {};
    const nikesToFetch = new Set<string>();

    if (submission.nik && submission.nik.length === 16) nikesToFetch.add(submission.nik);
    if (fd.nik && fd.nik.length === 16) nikesToFetch.add(fd.nik);
    if (fd.reporterNik && fd.reporterNik.length === 16) nikesToFetch.add(fd.reporterNik);
    if (fd.motherNik && fd.motherNik.length === 16) nikesToFetch.add(fd.motherNik);
    if (fd.fatherNik && fd.fatherNik.length === 16) nikesToFetch.add(fd.fatherNik);
    if (fd.witness1Nik && fd.witness1Nik.length === 16) nikesToFetch.add(fd.witness1Nik);
    if (fd.witness2Nik && fd.witness2Nik.length === 16) nikesToFetch.add(fd.witness2Nik);
    if (fd.spouseNik && fd.spouseNik.length === 16) nikesToFetch.add(fd.spouseNik);
    if (fd.waliNik && fd.waliNik.length === 16) nikesToFetch.add(fd.waliNik);
    if (fd.deceasedSpouseNik && fd.deceasedSpouseNik.length === 16) nikesToFetch.add(fd.deceasedSpouseNik);

    let isSubscribed = true;
    (async () => {
      const results: Record<string, Resident> = {};
      for (const nik of Array.from(nikesToFetch)) {
        try {
          const res = await getResidentByNik(firestore, nik);
          if (res) results[nik] = res;
        } catch (e) {
          console.warn('Gagal memuat data penduduk untuk NIK:', nik, e);
        }
      }
      if (isSubscribed && Object.keys(results).length > 0) {
        setResidentMap((prev) => ({ ...prev, ...results }));
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, [firestore, submission]);

  const handlePrint = (mode: 'all' | 'pengantar' | 'lampiran') => {
    setPrintMode(mode);
    const hasLandscape = allSheets.some((s) => s.kind === 'lampiran' && s.orientasi === 'Landscape');
    const isA4 = rendered.ukuran === 'A4';
    applyDynamicOpenSidPrintStyle(mode, hasLandscape, isA4);
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 160);
    });
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GLOBAL_SETTINGS_STORAGE_KEY);
      if (saved) {
        setGlobalSettings({ ...OPENSID_GLOBAL_SETTINGS_DEFAULT, ...JSON.parse(saved) });
      }
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const s = params.get('signer');
        if (s === 'kades' || s === 'sekdes') {
          setSignerQuery(s);
        }
        const t = params.get('ttd');
        if (t === 'qr') {
          setTtdMode('qr');
        } else {
          setTtdMode('manual');
        }
        const p = params.get('part');
        if (p === 'pengantar' || p === 'lampiran' || p === 'all') {
          setPrintMode(p);
          applyDynamicOpenSidPrintStyle(p, false);
        } else {
          applyDynamicOpenSidPrintStyle('all', false);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const matchedMaster = useMemo(() => {
    const isDeath = (submission.letterType || '').toLowerCase().includes('kematian');
    const map = new Map<string, PermohonanSuratItem>();
    SEED_PERMOHONAN_SURAT.forEach((seed) => {
      map.set(seed.id, seed);
    });
    if (masterItems && masterItems.length > 0) {
      masterItems.forEach((m) => {
        let key = m.id;
        if (!map.has(key)) {
          for (const [seedId, seedItem] of map.entries()) {
            if (
              (m.urlSurat && seedItem.urlSurat === m.urlSurat) ||
              seedItem.jenisSurat.trim().toLowerCase() === (m.jenisSurat || '').trim().toLowerCase()
            ) {
              key = seedId;
              break;
            }
          }
        }
        const existing = map.get(key);
        if (existing) {
          map.set(key, { ...existing, ...m, id: key });
        } else {
          map.set(m.id || `custom-${Math.random()}`, m);
        }
      });
    }
    const list = Array.from(map.values()).map((it) => enrichPermohonanSuratWithOpenSid(it));
    const fd = submission.formData || {};
    const isPemakaman =
      (submission.letterType || '').toLowerCase().includes('pemakaman') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('pemakaman') ||
      ((submission as any).kodeSurat || '').toLowerCase() === '474.3' ||
      (submission as any).masterSuratId === 'prm-44' ||
      Boolean(
        fd.burialDate ||
        fd.tanggal_pemakaman ||
        fd.lokasi_tpu ||
        fd.burialLocation ||
        fd.tempat_pemakaman ||
        fd.waktu_pemakaman ||
        fd.jam_pemakaman
      );

    const matched =
      list.find((m) => m.id === (submission as any).masterSuratId) ||
      list.find((m) => m.urlSurat && m.urlSurat === (submission as any).urlSurat) ||
      matchMasterSuratItem(list, submission.letterType) ||
      enrichPermohonanSuratWithOpenSid({
        id: 'fallback',
        jenisSurat: submission.letterType,
        klasifikasi: 'UMUM',
        kodeSurat: fd.kodeSurat || '470',
        uraian: submission.letterType,
      });

    if (isPemakaman) {
      return {
        ...matched,
        id: 'prm-44',
        jenisSurat: 'Surat Keterangan Pemakaman',
        kodeSurat: '474.3',
        urlSurat: 'sistem-surat-keterangan-pemakaman',
        template: SURAT_KETERANGAN_PEMAKAMAN_TEMPLATE,
        templateDesa: '',
        header: 1 as 0 | 1 | 2,
        footer: true,
        ukuran: 'A4',
        lampiran: [],
      };
    }

    const isKeteranganUmum =
      (submission.letterType || '').toLowerCase().includes('pengantar umum') ||
      (submission.letterType || '').toLowerCase().includes('keterangan umum') ||
      (submission.letterType || '').toLowerCase().trim() === 'surat pengantar' ||
      (submission.letterType || '').toLowerCase().trim() === 'surat keterangan' ||
      ((submission as any).urlSurat || '').toLowerCase().includes('keterangan-pengantar') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('pengantar-umum') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('keterangan-umum') ||
      ((submission as any).kodeSurat || '').toLowerCase() === 's-01' ||
      ((submission as any).kodeSurat || '').toLowerCase() === '400.7.22.1' ||
      (submission as any).masterSuratId === 'prm-03' ||
      matched.id === 'prm-03';

    if (isKeteranganUmum) {
      return {
        ...matched,
        id: 'prm-03',
        jenisSurat: 'Surat Pengantar Umum',
        kodeSurat: (submission as any).kodeSurat || matched.kodeSurat || '400.7.22.1',
        urlSurat: 'sistem-surat-keterangan-pengantar',
        template: SURAT_PENGANTAR_UMUM_TEMPLATE,
        templateDesa: '',
        header: 1 as 0 | 1 | 2,
        footer: true,
        ukuran: 'A4',
        lampiran: [],
      };
    }

    const isSkck =
      (submission.letterType || '').toLowerCase().includes('skck') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('skck') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('catatan-kepolisian') ||
      ((submission as any).kodeSurat || '').toLowerCase() === 's-07' ||
      (submission as any).masterSuratId === 'prm-15' ||
      matched.id === 'prm-15';

    if (isSkck) {
      return {
        ...matched,
        id: 'prm-15',
        jenisSurat: 'Surat Pengantar SKCK',
        kodeSurat: (submission as any).kodeSurat || matched.kodeSurat || '400.7.22.1',
        urlSurat: 'sistem-surat-pengantar-surat-keterangan-catatan-kepolisian',
        template: SURAT_PENGANTAR_SKCK_TEMPLATE,
        templateDesa: '',
        header: 1 as 0 | 1 | 2,
        footer: false,
        ukuran: 'A4',
        lampiran: [],
      };
    }

    const isKehilangan =
      (submission.letterType || '').toLowerCase().includes('kehilangan') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('kehilangan') ||
      ((submission as any).kodeSurat || '').toLowerCase() === 's-13' ||
      (submission as any).masterSuratId === 'prm-02' ||
      matched.id === 'prm-02';

    if (isKehilangan) {
      return {
        ...matched,
        id: 'prm-02',
        jenisSurat: 'Surat Pengantar Kehilangan',
        kodeSurat: (submission as any).kodeSurat || matched.kodeSurat || '400.7.22.1',
        urlSurat: 'sistem-surat-pengantar-laporan-kehilangan',
        template: SURAT_PENGANTAR_KEHILANGAN_TEMPLATE,
        templateDesa: '',
        header: 1 as 0 | 1 | 2,
        footer: true,
        ukuran: 'A4',
        lampiran: [],
      };
    }

    const isKeramaian =
      (submission.letterType || '').toLowerCase().includes('keramaian') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('keramaian') ||
      ((submission as any).kodeSurat || '').toLowerCase() === 's-12' ||
      ((submission as any).kodeSurat || '').toLowerCase() === '100.3.12' ||
      (submission as any).masterSuratId === 'prm-05' ||
      matched.id === 'prm-05';

    if (isKeramaian) {
      return {
        ...matched,
        id: 'prm-05',
        jenisSurat: 'Surat Ijin Keramaian',
        kodeSurat: (submission as any).kodeSurat || matched.kodeSurat || '100.3.12',
        urlSurat: 'sistem-surat-pengantar-izin-keramaian',
        template: SURAT_IJIN_KERAMAIAN_TEMPLATE,
        templateDesa: '',
        header: 1 as 0 | 1 | 2,
        footer: true,
        ukuran: 'A4',
        lampiran: [],
      };
    }

    if (isDeath) {
      return {
        ...matched,
        template: SURAT_KETERANGAN_KEMATIAN_TEMPLATE,
        templateDesa: '',
      };
    }

    const isDomisili =
      ((submission.letterType || '').toLowerCase().includes('domisili') ||
        (submission as any).urlSurat?.toLowerCase().includes('domisili')) &&
      !((submission.letterType || '').toLowerCase().includes('usaha') ||
        (submission as any).urlSurat?.toLowerCase().includes('usaha'));

    if (isDomisili) {
      return {
        ...matched,
        template: SURAT_KETERANGAN_DOMISILI_TEMPLATE,
        templateDesa: '',
      };
    }

    const isPerubahanKk =
      (submission.letterType || '').toLowerCase().includes('perubahan kartu keluarga') ||
      (submission.letterType || '').toLowerCase().includes('perubahan kk') ||
      (submission as any).urlSurat?.toLowerCase().includes('perubahan-kartu-keluarga');

    if (isPerubahanKk) {
      return {
        ...matched,
        template: SURAT_PERMOHONAN_PERUBAHAN_KK_TEMPLATE,
        templateDesa: '',
      };
    }

    const isDuplikatAkta =
      (submission.letterType || '').toLowerCase().includes('duplikat akta kelahiran') ||
      (submission.letterType || '').toLowerCase().includes('duplikat kelahiran') ||
      (submission as any).urlSurat?.toLowerCase().includes('duplikat-kelahiran') ||
      matched.kodeSurat?.toLowerCase() === 's-20';

    if (isDuplikatAkta) {
      return {
        ...matched,
        template: SURAT_PERMOHONAN_DUPLIKAT_AKTA_KELAHIRAN_TEMPLATE,
        templateDesa: '',
        header: 1 as 0 | 1 | 2,
        footer: false,
      };
    }

    const isBedaNama =
      (submission.letterType || '').toLowerCase().includes('beda nama') ||
      (submission.letterType || '').toLowerCase().includes('beda identitas') ||
      (submission as any).urlSurat?.toLowerCase().includes('beda-identitas') ||
      (submission as any).urlSurat?.toLowerCase().includes('beda-nama') ||
      matched.kodeSurat?.toLowerCase() === '471.1';

    if (isBedaNama) {
      return {
        ...matched,
        template: SURAT_PERNYATAAN_BEDA_NAMA_TEMPLATE,
        templateDesa: '',
        header: 1 as 0 | 1 | 2,
        footer: false,
      };
    }

    const isNikahNonMuslim =
      (submission.letterType || '').toLowerCase().includes('non-muslim') ||
      (submission.letterType || '').toLowerCase().includes('non muslim') ||
      (submission as any).urlSurat?.toLowerCase().includes('nikah-warga-non-muslim') ||
      (submission as any).urlSurat?.toLowerCase().includes('nikah-non-muslim') ||
      matched.kodeSurat?.toLowerCase() === 's-50' ||
      matched.id === 'prm-32';

    if (isNikahNonMuslim) {
      return {
        ...matched,
        template: SURAT_KETERANGAN_NIKAH_NON_MUSLIM_TEMPLATE,
        templateDesa: '',
        header: 1 as 0 | 1 | 2,
        footer: false,
        ukuran: 'A4',
        lampiran: ['F-2.12', 'F-2.01 Perkawinan'],
      };
    }

    const isNikah =
      !isNikahNonMuslim &&
      ((submission.letterType || '').toLowerCase().includes('pengantar nikah') ||
        (submission.letterType || '').toLowerCase().includes('keterangan nikah') ||
        (submission.letterType || '').toLowerCase().includes('n-1') ||
        (submission.letterType || '').toLowerCase().includes('pergi kawin') ||
        (submission.letterType || '').toLowerCase().includes('numpang nikah') ||
        (submission as any).urlSurat?.toLowerCase().includes('keterangan-nikah') ||
        (submission as any).urlSurat?.toLowerCase().includes('pergi-kawin') ||
        matched.kodeSurat?.toLowerCase() === 's-23' ||
        matched.kodeSurat?.toLowerCase() === 's-30' ||
        matched.kodeSurat === '474.2');

    if (isNikah) {
      return {
        ...matched,
        template: SURAT_PENGANTAR_NIKAH_TEMPLATE,
        templateDesa: '',
        header: 1 as 0 | 1 | 2,
        footer: false,
        ukuran: 'A4',
        lampiran: ['Model N-1', 'Model N-2', 'Model N-4', 'Model N-5', 'Model N-6', 'SPS', 'SWN'],
      };
    }

    const isBelumMenikah =
      (submission.letterType || '').toLowerCase().includes('belum pernah menikah') ||
      (submission.letterType || '').toLowerCase().includes('belum menikah') ||
      (submission.letterType || '').toLowerCase().includes('belum kawin') ||
      (submission as any).urlSurat?.toLowerCase().includes('belum-menikah') ||
      matched.kodeSurat?.toLowerCase() === 's-18' ||
      matched.kodeSurat === '470';

    if (isBelumMenikah) {
      return {
        ...matched,
        template: SURAT_KETERANGAN_BELUM_MENIKAH_TEMPLATE,
        templateDesa: '',
        header: 1 as 0 | 1 | 2,
        ukuran: 'A4',
        lampiran: ['SP-BM'],
      };
    }

    const isWaliHakim =
      (submission.letterType || '').toLowerCase().includes('wali hakim') ||
      (submission as any).urlSurat?.toLowerCase().includes('wali-hakim') ||
      matched.kodeSurat?.toLowerCase() === 's-32';

    if (isWaliHakim) {
      return {
        ...matched,
        template: SURAT_KETERANGAN_WALI_HAKIM_TEMPLATE,
        templateDesa: '',
        header: 1 as 0 | 1 | 2,
        ukuran: 'A4',
        footer: false,
      };
    }

    const isDuplikatNikah =
      (submission.letterType || '').toLowerCase().includes('duplikat surat nikah') ||
      (submission.letterType || '').toLowerCase().includes('duplikat buku nikah') ||
      (submission.letterType || '').toLowerCase().includes('duplikat nikah') ||
      (submission as any).urlSurat?.toLowerCase().includes('duplikat-surat-nikah') ||
      (submission as any).urlSurat?.toLowerCase().includes('duplikat-nikah') ||
      matched.kodeSurat?.toLowerCase() === 's-33' ||
      matched.id === 'prm-24';

    if (isDuplikatNikah) {
      return {
        ...matched,
        template: SURAT_PERMOHONAN_DUPLIKAT_SURAT_NIKAH_TEMPLATE,
        templateDesa: '',
        header: 1 as 0 | 1 | 2,
        ukuran: 'A4',
        footer: false,
        lampiran: ['SP-HILANG'],
      };
    }

    const isCeraiRujuk =
      submission.letterType?.toLowerCase().includes('cerai') ||
      submission.letterType?.toLowerCase().includes('rujuk') ||
      ((submission as any).urlSurat || matched.urlSurat || '').toLowerCase().includes('cerai') ||
      ((submission as any).urlSurat || matched.urlSurat || '').toLowerCase().includes('rujuk') ||
      ((submission as any).kodeSurat || matched.kodeSurat || '').toLowerCase() === 's-35' ||
      ((submission as any).kodeSurat || matched.kodeSurat || '').toLowerCase() === 's-34' ||
      matched.id === 'prm-28' ||
      matched.id === 'prm-16';

    if (isCeraiRujuk) {
      return {
        ...matched,
        template: SURAT_PENGANTAR_CERAI_RUJUK_TEMPLATE,
        templateDesa: '',
        header: 1 as 0 | 1 | 2,
        ukuran: 'A4',
        footer: false,
      };
    }

    const isSporadik =
      (submission.letterType || '').toLowerCase().includes('sporadik') ||
      (submission.letterType || '').toLowerCase().includes('penguasaan fisik bidang tanah') ||
      ((submission as any).urlSurat || matched.urlSurat || '').toLowerCase().includes('sporadik') ||
      ((submission as any).kodeSurat || matched.kodeSurat || '').toLowerCase() === 's-40' ||
      matched.id === 'prm-37';

    if (isSporadik) {
      return {
        ...matched,
        template: SURAT_SPORADIK_TEMPLATE,
        templateDesa: '',
        header: 1 as 0 | 1 | 2,
        ukuran: 'F4',
        footer: false,
      };
    }

    const isKepemilikanTanah =
      (submission.letterType || '').toLowerCase().includes('kepemilikan tanah') ||
      ((submission as any).urlSurat || matched.urlSurat || '').toLowerCase().includes('kepemilikan-tanah') ||
      ((submission as any).kodeSurat || matched.kodeSurat || '').toLowerCase() === 's-49' ||
      matched.id === 'prm-25';

    if (isKepemilikanTanah) {
      return {
        ...matched,
        template: SURAT_KETERANGAN_KEPEMILIKAN_TANAH_TEMPLATE,
        templateDesa: '',
        header: 1 as 0 | 1 | 2,
        ukuran: 'A4',
        footer: false,
      };
    }
    return matched;
  }, [submission, masterItems]);

  const rendered = useMemo(() => {
    const fd = submission.formData || {};
    const subAny = submission as any;

    // Destinasi & Pindah bridge
    const rawDesaTujuan = fd.destinationAddress || fd.desaTujuan || fd.form_desa_tujuan || fd.desa || '';
    const rawRtTujuan = fd.destinationAddressRt || fd.rtTujuan || fd.form_rt_tujuan || '';
    const rawRwTujuan = fd.destinationAddressRw || fd.rwTujuan || fd.form_rw_tujuan || '';
    const rawDusunTujuan = fd.destinationDusun || fd.dusunTujuan || fd.form_dusun_tujuan || '';
    const rawKecTujuan = fd.destinationKecamatan || fd.kecamatanTujuan || fd.form_kecamatan_tujuan || '';
    const rawKabTujuan = fd.destinationKabupaten || fd.kabupatenTujuan || fd.form_kabupaten_tujuan || '';
    const rawProvTujuan = fd.destinationProvinsi || fd.provinsiTujuan || fd.form_provinsi_tujuan || '';
    const rawKodePosTujuan = fd.destinationPostalCode || fd.kodePosTujuan || fd.form_kode_pos_tujuan || '';
    const rawStreetTujuan = fd.destinationStreet || fd.alamatTujuan || fd.form_alamat_tujuan || rawDesaTujuan || '';

    // Helper ekstrak RT dan RW dari teks alamat jika belum terisi terpisah
    const extractRtRw = (text?: string) => {
      if (!text) return { rt: '', rw: '' };
      const mRt = text.match(/\brt\s*[:./\-]?\s*0*(\d+)/i);
      const mRw = text.match(/\brw\s*[:./\-]?\s*0*(\d+)/i);
      return {
        rt: mRt ? mRt[1].padStart(3, '0') : '',
        rw: mRw ? mRw[1].padStart(3, '0') : '',
      };
    };

    const rawInputAddress = fd.address || fd.alamat || fd.currentAddressStreet || fd.currentAddress || '';
    const extractedAsal = extractRtRw(`${rawInputAddress} ${fd.currentAddressStreet || ''}`);
    const resolvedRtAsal = fd.currentAddressRt && fd.currentAddressRt !== '0' && fd.currentAddressRt !== '00' && fd.currentAddressRt !== '000'
      ? fd.currentAddressRt
      : (extractedAsal.rt || '001');
    const resolvedRwAsal = fd.currentAddressRw && fd.currentAddressRw !== '0' && fd.currentAddressRw !== '00' && fd.currentAddressRw !== '000'
      ? fd.currentAddressRw
      : (extractedAsal.rw || '001');

    const rawAlamat = formatAlamatLengkapKtp(
      rawInputAddress,
      resolvedRtAsal,
      resolvedRwAsal,
      fd.currentAddressDusun || identity.namaDesa,
      identity.namaDesa,
      identity.namaKecamatan,
      identity.namaKabupaten,
    );

    const extractedTujuan = extractRtRw(`${rawStreetTujuan} ${rawDesaTujuan}`);
    const resolvedRtTujuan = rawRtTujuan && rawRtTujuan !== '0' && rawRtTujuan !== '00' && rawRtTujuan !== '000'
      ? rawRtTujuan
      : extractedTujuan.rt;
    const resolvedRwTujuan = rawRwTujuan && rawRwTujuan !== '0' && rawRwTujuan !== '00' && rawRwTujuan !== '000'
      ? rawRwTujuan
      : extractedTujuan.rw;

    const pi = fd.openSidPelakuBagian?.individu || {};

    const isSuratKelahiran = (submission.letterType || '').toLowerCase().includes('kelahiran');
    const isSuratKematian = (submission.letterType || '').toLowerCase().includes('kematian');

    const pelaporNik = fd.reporterNik || '';
    const motherNik = fd.motherNik || '';
    const fatherNik = fd.fatherNik || '';
    const pemohonNik = submission.nik || fd.nik || '';
    const saksi1Nik = fd.witness1Nik || '';
    const saksi2Nik = fd.witness2Nik || '';

    const pelaporResident = pelaporNik ? residentMap[pelaporNik] : null;
    const motherResident = motherNik ? residentMap[motherNik] : null;
    const fatherResident = fatherNik ? residentMap[fatherNik] : null;
    const pemohonResident = pemohonNik ? residentMap[pemohonNik] : null;
    const saksi1Resident = saksi1Nik ? residentMap[saksi1Nik] : null;
    const saksi2Resident = saksi2Nik ? residentMap[saksi2Nik] : null;

    // Nomor Kartu Keluarga (KK) otomatis dari data kependudukan (prioritaskan DB pelapor, pemohon, ibu, ayah)
    const rawDbNoKk =
      pelaporResident?.noKk ||
      pemohonResident?.noKk ||
      motherResident?.noKk ||
      fatherResident?.noKk ||
      '';
    const cleanDbNoKk = String(rawDbNoKk).replace(/[^0-9]/g, '');

    const resolvedNoKk =
      cleanDbNoKk.length >= 10
        ? cleanDbNoKk
        : (fd.kkNumber || fd.noKk || fd.no_kk || fd.form_no_kk || pi.no_kk || '-');

    // Menentukan subjek orang yang diterangkan
    const pemohonObj = (fd.pemohon as any) || (fd.moyang as any) || {};
    let rawIndividu = {
      nama: pi.nama || fd.fullName || fd.name || pemohonObj.name || submission.requesterName || '-',
      nik: pi.nik || fd.nik || pemohonObj.nik || submission.nik || '-',
      no_kk: resolvedNoKk,
      tempat_lahir: pi.tempat_lahir || fd.placeOfBirth || fd.birthPlace || fd.tempatLahir || pemohonObj.birthPlace || identity.namaKabupaten,
      tanggal_lahir: pi.tanggal_lahir || fd.dateOfBirth || fd.birthDate || fd.tanggalLahir || pemohonObj.birthDate || '',
      jenis_kelamin: pi.jenis_kelamin || fd.gender || fd.jenisKelamin || pemohonObj.gender || 'Laki-Laki',
      agama: pi.agama || fd.religion || fd.agama || pemohonObj.religion || 'Islam',
      pendidikan_kk: pi.pendidikan_kk || fd.education || fd.pendidikan || pemohonObj.education || 'SLTA / Sederajat',
      pekerjaan: pi.pekerjaan || fd.occupation || fd.job || fd.pekerjaan || pemohonObj.job || 'Wiraswasta',
      status_kawin: pi.status_kawin || fd.maritalStatus || fd.statusKawin || fd.statusPerkawinan || pemohonObj.maritalStatus || 'Kawin Tercatat',
      warga_negara: pi.warga_negara || fd.nationality || pemohonObj.nationality || 'WNI',
      alamat: pi.alamat || pemohonObj.address || rawAlamat,
      rt: pi.rt || fd.rt || resolvedRtAsal,
      rw: pi.rw || fd.rw || resolvedRwAsal,
      dusun: pi.dusun || fd.dusun || fd.currentAddressDusun || identity.namaDesa,
      nama_ayah: pi.nama_ayah || fd.fatherName || '-',
      nama_ibu: pi.nama_ibu || fd.motherName || '-',
    };

    if (isSuratKematian) {
      // Pada Surat Keterangan Kematian: Subjek yang diterangkan adalah Jenazah (Almarhum / Almarhumah)
      const jenazahNik = fd.nik || submission.nik || '';
      const jenazahResident = jenazahNik ? residentMap[jenazahNik] : null;

      const jenazahNama = jenazahResident?.fullName || fd.name || fd.fullName || fd.nama_jenazah || submission.requesterName || '-';
      const jenazahNikClean = jenazahResident?.nik || jenazahNik || '-';
      const jenazahTempat = jenazahResident?.placeOfBirth || fd.placeOfBirth || fd.birthPlace || fd.tempat_lahir_jenazah || identity.namaKabupaten;
      const jenazahTgl = jenazahResident?.dateOfBirth || fd.birthDate || fd.dateOfBirth || fd.tanggal_lahir_jenazah || '';
      const jenazahGender = jenazahResident?.gender || fd.gender || fd.sex_jenazah || (fd.jenis_kelamin ? fd.jenis_kelamin : 'Laki-Laki');
      const jenazahAgama = jenazahResident?.religion || fd.religion || fd.agama || 'Islam';
      const jenazahPekerjaan = jenazahResident?.occupation || fd.occupation || fd.job || fd.pekerjaan || '-';

      const rtJen = jenazahResident?.rt || fd.rt || '002';
      const rwJen = jenazahResident?.rw || fd.rw || '004';
      const streetJen = jenazahResident?.address || fd.address || '';
      const alamatRumahJenazah = formatAlamatLengkapKtp(
        streetJen,
        rtJen,
        rwJen,
        jenazahResident?.kelurahan || identity.namaDesa,
        identity.namaDesa,
        identity.namaKecamatan,
        identity.namaKabupaten,
      );

      rawIndividu = {
        ...rawIndividu,
        nama: jenazahNama,
        nik: jenazahNikClean,
        no_kk: resolvedNoKk,
        tempat_lahir: jenazahTempat,
        tanggal_lahir: jenazahTgl,
        jenis_kelamin: jenazahGender,
        agama: jenazahAgama,
        pekerjaan: jenazahPekerjaan,
        alamat: alamatRumahJenazah,
        rt: rtJen,
        rw: rwJen,
        dusun: jenazahResident?.kelurahan || identity.namaDesa,
        nama_ayah: jenazahResident?.fatherName || fd.fatherName || '-',
        nama_ibu: jenazahResident?.motherName || fd.motherName || '-',
      };
    } else if (isSuratKelahiran) {
      const hasPelapor = Boolean((fd.reporterName && fd.reporterName.trim()) || (fd.reporterNik && fd.reporterNik.trim()));
      if (hasPelapor) {
        // Tampilkan Data Pelapor sebagai subjek surat
        const repNama = pelaporResident?.fullName || fd.reporterName || '-';
        const repNik = pelaporResident?.nik || fd.reporterNik || '-';
        const repTgl = pelaporResident?.dateOfBirth || fd.reporterBirthDate || '';
        const repTempat = pelaporResident?.placeOfBirth || identity.namaKabupaten;
        const repGender = pelaporResident?.gender || (fd.reporterRelationship?.toLowerCase() === 'ibu' ? 'Perempuan' : 'Laki-Laki');
        const repPekerjaan = pelaporResident?.occupation || fd.reporterJob || 'Wiraswasta';
        const repAlamat = formatAlamatLengkapKtp(
          pelaporResident?.address || fd.reporterAddress || rawAlamat,
          pelaporResident?.rt || resolvedRtAsal,
          pelaporResident?.rw || resolvedRwAsal,
          pelaporResident?.kelurahan || identity.namaDesa,
          identity.namaDesa,
          identity.namaKecamatan,
          identity.namaKabupaten,
        );

        rawIndividu = {
          ...rawIndividu,
          nama: repNama,
          nik: repNik,
          no_kk: resolvedNoKk,
          tempat_lahir: repTempat,
          tanggal_lahir: repTgl,
          jenis_kelamin: repGender,
          agama: pelaporResident?.religion || 'Islam',
          pekerjaan: repPekerjaan,
          status_kawin: pelaporResident?.maritalStatus || 'Kawin Tercatat',
          alamat: repAlamat,
          rt: pelaporResident?.rt || resolvedRtAsal,
          rw: pelaporResident?.rw || resolvedRwAsal,
          dusun: pelaporResident?.kelurahan || identity.namaDesa,
          nama_ayah: pelaporResident?.fatherName || '-',
          nama_ibu: pelaporResident?.motherName || '-',
        };
      } else {
        // Tampilkan Data Pemohon (Ibu) sebagai subjek surat
        const pemResident = motherResident || pemohonResident;
        const momNama = pemResident?.fullName || submission.requesterName || fd.motherName || '-';
        const momNik = pemResident?.nik || submission.nik || fd.motherNik || '-';
        const momTgl = pemResident?.dateOfBirth || fd.motherBirthDate || '';
        const momTempat = pemResident?.placeOfBirth || fd.motherBirthPlace || identity.namaKabupaten;
        const momGender = pemResident?.gender || 'Perempuan'; // Ibu pasti perempuan
        const momPekerjaan = pemResident?.occupation || fd.motherJob || 'Mengurus Rumah Tangga';
        const momAlamat = formatAlamatLengkapKtp(
          pemResident?.address || fd.motherAddress || rawAlamat,
          pemResident?.rt || resolvedRtAsal,
          pemResident?.rw || resolvedRwAsal,
          pemResident?.kelurahan || identity.namaDesa,
          identity.namaDesa,
          identity.namaKecamatan,
          identity.namaKabupaten,
        );

        rawIndividu = {
          ...rawIndividu,
          nama: momNama,
          nik: momNik,
          no_kk: resolvedNoKk,
          tempat_lahir: momTempat,
          tanggal_lahir: momTgl,
          jenis_kelamin: momGender,
          agama: pemResident?.religion || 'Islam',
          pekerjaan: momPekerjaan,
          status_kawin: pemResident?.maritalStatus || 'Kawin Tercatat',
          alamat: momAlamat,
          rt: pemResident?.rt || resolvedRtAsal,
          rw: pemResident?.rw || resolvedRwAsal,
          dusun: pemResident?.kelurahan || identity.namaDesa,
          nama_ayah: pemResident?.fatherName || '-',
          nama_ibu: pemResident?.motherName || '-',
        };
      }
    } else if (pemohonResident) {
      // Surat umum lainnya yang memiliki data penduduk di DB
      const residentAlamatLengkap = formatAlamatLengkapKtp(
        pemohonResident.address || rawAlamat,
        pemohonResident.rt || rawIndividu.rt,
        pemohonResident.rw || rawIndividu.rw,
        pemohonResident.kelurahan || rawIndividu.dusun,
        identity.namaDesa,
        identity.namaKecamatan,
        identity.namaKabupaten,
      );

      rawIndividu = {
        ...rawIndividu,
        nama: pemohonResident.fullName || rawIndividu.nama,
        nik: pemohonResident.nik || rawIndividu.nik,
        no_kk: resolvedNoKk,
        tempat_lahir: pemohonResident.placeOfBirth || rawIndividu.tempat_lahir,
        tanggal_lahir: pemohonResident.dateOfBirth || rawIndividu.tanggal_lahir,
        jenis_kelamin: pemohonResident.gender || rawIndividu.jenis_kelamin,
        agama: pemohonResident.religion || rawIndividu.agama,
        pekerjaan: pemohonResident.occupation || rawIndividu.pekerjaan,
        status_kawin: pemohonResident.maritalStatus || rawIndividu.status_kawin,
        alamat: residentAlamatLengkap,
        rt: pemohonResident.rt || rawIndividu.rt,
        rw: pemohonResident.rw || rawIndividu.rw,
        dusun: pemohonResident.kelurahan || rawIndividu.dusun,
      };
    }

    const formattedIndividu: OpenSidPersonData = {
      ...rawIndividu,
      nama: toTitleCaseIndonesian(rawIndividu.nama),
      tempat_lahir: toTitleCaseIndonesian(rawIndividu.tempat_lahir),
      jenis_kelamin: toTitleCaseIndonesian(rawIndividu.jenis_kelamin),
      agama: toTitleCaseIndonesian(rawIndividu.agama),
      pekerjaan: toTitleCaseIndonesian(rawIndividu.pekerjaan),
      status_kawin: toTitleCaseIndonesian(rawIndividu.status_kawin),
      alamat: toTitleCaseIndonesian(rawIndividu.alamat),
      dusun: toTitleCaseIndonesian(rawIndividu.dusun),
      nama_ayah: toTitleCaseIndonesian(rawIndividu.nama_ayah),
      nama_ibu: toTitleCaseIndonesian(rawIndividu.nama_ibu),
    };

    const dynamicFormValues: Record<string, string> = {
      alamat: toTitleCaseIndonesian(formattedIndividu.alamat || ''),
      alamat_lengkap: toTitleCaseIndonesian(formattedIndividu.alamat || ''),
      alamat_tempat_tinggal: toTitleCaseIndonesian(formattedIndividu.alamat || ''),
      alamat_rumah: toTitleCaseIndonesian(formattedIndividu.alamat || ''),
      form_alamat: toTitleCaseIndonesian(formattedIndividu.alamat || ''),
      form_alamat_tempat_tinggal: toTitleCaseIndonesian(formattedIndividu.alamat || ''),
      form_keperluan: toTitleCaseIndonesian(subAny.purpose || fd.purpose || fd.keperluan || fd['[form_keperluan]'] || '-'),
      form_keterangan: toTitleCaseIndonesian(fd.keterangan || fd.notes || subAny.purpose || fd.purpose || '-'),
      form_nama_usaha: toTitleCaseIndonesian(fd.businessName || fd.namaUsaha || fd.form_nama_usaha || fd['[form_nama_usaha]'] || '-'),
      form_jenis_usaha: toTitleCaseIndonesian(fd.businessType || fd.jenisUsaha || fd.form_jenis_usaha || fd['[form_jenis_usaha]'] || '-'),
      form_alamat_usaha: (() => {
        const rtU = fd.businessRt || fd.rt_usaha || fd.form_rt_usaha;
        const rwU = fd.businessRw || fd.rw_usaha || fd.form_rw_usaha;
        const dusunU = fd.businessDusun || fd.dusun_usaha || fd.form_dusun_usaha;
        if (rtU || rwU || dusunU) {
          const parts = [`RT ${rtU || '...'}`, `RW ${rwU || '...'}`].join(' / ');
          const dusunStr = dusunU ? `Dusun ${toTitleCaseIndonesian(dusunU)}` : 'Dusun Sampeldes';
          const roadStr = (fd.businessAddress && !fd.businessAddress.includes('RT') && fd.businessAddress !== '-') ? `${toTitleCaseIndonesian(fd.businessAddress)}, ` : '';
          return `${roadStr}${parts} ${dusunStr}`.trim();
        }
        return toTitleCaseIndonesian(fd.businessAddress || fd.alamatUsaha || fd.form_alamat_usaha || fd['[form_alamat_usaha]'] || '-');
      })(),
      form_status_bangunan: toTitleCaseIndonesian(fd.buildingStatus || fd.form_status_bangunan || fd.status_bangunan || fd['[form_status_bangunan]'] || 'Milik Sendiri'),
      status_bangunan: toTitleCaseIndonesian(fd.buildingStatus || fd.form_status_bangunan || fd.status_bangunan || fd['[form_status_bangunan]'] || 'Milik Sendiri'),
      form_penanggung_jawab: toTitleCaseIndonesian(fd.responsiblePerson || fd.penanggungJawab || fd.form_penanggung_jawab || fd.penanggung_jawab || fd['[form_penanggung_jawab]'] || subAny.requesterName || formattedIndividu.nama || '-'),
      penanggung_jawab: toTitleCaseIndonesian(fd.responsiblePerson || fd.penanggungJawab || fd.form_penanggung_jawab || fd.penanggung_jawab || fd['[form_penanggung_jawab]'] || subAny.requesterName || formattedIndividu.nama || '-'),
      rt_usaha: fd.businessRt || fd.rt_usaha || fd.form_rt_usaha || '',
      rw_usaha: fd.businessRw || fd.rw_usaha || fd.form_rw_usaha || '',
      dusun_usaha: toTitleCaseIndonesian(fd.businessDusun || fd.dusun_usaha || fd.form_dusun_usaha || ''),
      form_berdiri_sejak: fd.businessSince || fd.berdiriSejak || fd.form_berdiri_sejak || fd['[form_berdiri_sejak]'] || fd.tahunBerdiri || '2011',
      berdiri_sejak: fd.businessSince || fd.berdiriSejak || fd.form_berdiri_sejak || fd['[form_berdiri_sejak]'] || fd.tahunBerdiri || '2011',
      form_tujuan: toTitleCaseIndonesian(fd.destination || fd.tujuan || fd.form_tujuan || fd['[form_tujuan]'] || '-'),

      // Pindah fields normalized
      form_alasan_pindah: toTitleCaseIndonesian(fd.alasanPindah || fd.form_alasan_pindah || fd.purpose || subAny.purpose || 'Keluarga'),
      alasan_pindah: toTitleCaseIndonesian(fd.alasanPindah || fd.form_alasan_pindah || fd.purpose || subAny.purpose || 'Keluarga'),
      form_klasifikasi_pindah: toTitleCaseIndonesian(fd.klasifikasiPindah || fd.form_klasifikasi_pindah || 'Antar Kabupaten/Kota'),
      klasifikasi_pindah: toTitleCaseIndonesian(fd.klasifikasiPindah || fd.form_klasifikasi_pindah || 'Antar Kabupaten/Kota'),
      form_jenis_kepindahan: toTitleCaseIndonesian(fd.jenisKepindahan || fd.form_jenis_kepindahan || 'Kepala Keluarga Dan Seluruh Anggota Keluarga'),
      jenis_kepindahan: toTitleCaseIndonesian(fd.jenisKepindahan || fd.form_jenis_kepindahan || 'Kepala Keluarga Dan Seluruh Anggota Keluarga'),
      form_status_kk_tidak_pindah: toTitleCaseIndonesian(fd.statusKkTidakPindah || fd.form_status_kk_tidak_pindah || 'Nomor KK Tetap'),
      status_kk_tidak_pindah: toTitleCaseIndonesian(fd.statusKkTidakPindah || fd.form_status_kk_tidak_pindah || 'Nomor KK Tetap'),
      form_status_kk_pindah: toTitleCaseIndonesian(fd.statusKkPindah || fd.form_status_kk_pindah || 'Membuat KK Baru'),
      status_kk_pindah: toTitleCaseIndonesian(fd.statusKkPindah || fd.form_status_kk_pindah || 'Membuat KK Baru'),
      form_tanggal_pindah: fd.moveDate || fd.form_tanggal_pindah || fd.tanggalPindah || '',
      tanggal_pindah: fd.moveDate || fd.form_tanggal_pindah || fd.tanggalPindah || '',
      form_alamat_tujuan: toTitleCaseIndonesian(rawStreetTujuan),
      alamat_tujuan: toTitleCaseIndonesian(rawStreetTujuan),
      form_dusun_tujuan: toTitleCaseIndonesian(rawDusunTujuan),
      dusun_tujuan: toTitleCaseIndonesian(rawDusunTujuan),
      form_rt_tujuan: resolvedRtTujuan,
      rt_tujuan: resolvedRtTujuan,
      form_rw_tujuan: resolvedRwTujuan,
      rw_tujuan: resolvedRwTujuan,
      form_desa_tujuan: toTitleCaseIndonesian(rawDesaTujuan),
      desa_tujuan: toTitleCaseIndonesian(rawDesaTujuan),
      form_desa_atau_kelurahan_tujuan: toTitleCaseIndonesian(rawDesaTujuan),
      form_kecamatan_tujuan: toTitleCaseIndonesian(rawKecTujuan),
      kecamatan_tujuan: toTitleCaseIndonesian(rawKecTujuan),
      form_kabupaten_tujuan: toTitleCaseIndonesian(rawKabTujuan),
      kabupaten_tujuan: toTitleCaseIndonesian(rawKabTujuan),
      form_provinsi_tujuan: toTitleCaseIndonesian(rawProvTujuan),
      provinsi_tujuan: toTitleCaseIndonesian(rawProvTujuan),
      form_kode_pos_tujuan: rawKodePosTujuan,
      kode_pos_tujuan: rawKodePosTujuan,
      form_telepon: fd.phone || fd.telepon || fd.form_telepon || '',
      telepon: fd.phone || fd.telepon || fd.form_telepon || '',
      form_email: fd.email || fd.form_email || '',
      email: fd.email || fd.form_email || '',
      form_kepala_kk: toTitleCaseIndonesian(fd.kkHead || fd.kepalaKk || fd.form_kepala_kk || formattedIndividu.kepala_kk || (formattedIndividu.hubungan_kk?.toUpperCase() === 'KEPALA KELUARGA' ? formattedIndividu.nama : pemohonResident?.fullName || rawIndividu.nama || '-')),
      kepala_kk: toTitleCaseIndonesian(fd.kkHead || fd.kepalaKk || fd.form_kepala_kk || formattedIndividu.kepala_kk || (formattedIndividu.hubungan_kk?.toUpperCase() === 'KEPALA KELUARGA' ? formattedIndividu.nama : pemohonResident?.fullName || rawIndividu.nama || '-')),
      form_alamat_sebelumnya: toTitleCaseIndonesian(fd.alamatSebelumnya || fd.form_alamat_sebelumnya || '-'),
      alamat_sebelumnya: toTitleCaseIndonesian(fd.alamatSebelumnya || fd.form_alamat_sebelumnya || '-'),
      form_dokumen_pasport: fd.passportNumber || fd.paspor || fd.dokumenPasport || fd.form_dokumen_pasport || '-',
      dokumen_pasport: fd.passportNumber || fd.paspor || fd.dokumenPasport || fd.form_dokumen_pasport || '-',
      form_tanggal_akhir_paspor: fd.passportExpiry || fd.tglPaspor || fd.form_tanggal_akhir_paspor || '-',
      tanggal_akhir_paspor: fd.passportExpiry || fd.tglPaspor || fd.form_tanggal_akhir_paspor || '-',
      form_akta_lahir: fd.noAktaLahir || fd.form_no_akta_lahir || fd.aktaLahir || fd.form_akta_lahir || '-',
      akta_lahir: fd.noAktaLahir || fd.form_no_akta_lahir || fd.aktaLahir || fd.form_akta_lahir || '-',
      form_akta_perkawinan: fd.noAktaKawin || fd.form_no_akta_kawin || fd.aktaKawin || fd.form_akta_perkawinan || '-',
      akta_perkawinan: fd.noAktaKawin || fd.form_no_akta_kawin || fd.aktaKawin || fd.form_akta_perkawinan || '-',
      form_tanggalperkawinan: fd.tglKawin || fd.form_tgl_kawin || fd.form_tanggalperkawinan || '-',
      tanggalperkawinan: fd.tglKawin || fd.form_tgl_kawin || fd.form_tanggalperkawinan || '-',
      form_akta_perceraian: fd.noAktaCerai || fd.form_no_akta_cerai || fd.aktaCerai || fd.form_akta_perceraian || '-',
      akta_perceraian: fd.noAktaCerai || fd.form_no_akta_cerai || fd.aktaCerai || fd.form_akta_perceraian || '-',
      form_tanggalperceraian: fd.tglCerai || fd.form_tgl_cerai || fd.form_tanggalperceraian || '-',
      tanggalperceraian: fd.tglCerai || fd.form_tgl_cerai || fd.form_tanggalperceraian || '-',
      form_cacat: toTitleCaseIndonesian(fd.cacat || fd.form_cacat || 'Tidak Ada'),
      cacat: toTitleCaseIndonesian(fd.cacat || fd.form_cacat || 'Tidak Ada'),
      form_jumlah_pengikut: String(fd.familyCount || (fd.familyMembers ? fd.familyMembers.length : 0)),
      form_rt: rawIndividu.rt,
      rt: rawIndividu.rt,
      currentAddressRt: rawIndividu.rt,
      form_rw: rawIndividu.rw,
      rw: rawIndividu.rw,
      currentAddressRw: rawIndividu.rw,
      destinationAddressRt: resolvedRtTujuan,
      destinationAddressRw: resolvedRwTujuan,
      // Field Kependudukan & Kelahiran (F-2.01)
      form_nama_bayi: toTitleCaseIndonesian(fd.childName || fd.nama_bayi || fd.namaBayi || fd.nama_anak || ''),
      nama_bayi: toTitleCaseIndonesian(fd.childName || fd.nama_bayi || fd.namaBayi || fd.nama_anak || ''),
      nama_anak: toTitleCaseIndonesian(fd.childName || fd.nama_bayi || fd.namaBayi || fd.nama_anak || ''),
      form_jk_bayi: fd.childGender || fd.jkBayi || fd.jenis_kelamin || '',
      form_nik_bayi: fd.childNik || fd.nik_bayi || '',
      form_tempat_lahir_bayi: toTitleCaseIndonesian(fd.childBirthPlace || fd.tempatLahirBayi || ''),
      form_tempat_kelahiran: toTitleCaseIndonesian(fd.childBirthPlace || fd.tempatLahirBayi || ''),
      form_tgl_lahir_anak: fd.childBirthDate || fd.tglLahirBayi || '',
      form_waktu_lahir: fd.childBirthTime || fd.waktuLahir || '',
      form_pukul: fd.childBirthTime || fd.waktuLahir || '',
      form_tempat_dilahirkan: fd.childBirthLocation || '',
      form_jenis_kelahiran: fd.birthType || 'Tunggal',
      form_kelahiran_ke: String(fd.childOrder || '1'),
      form_penolong_kelahiran: fd.birthAssistant || 'Bidan',
      form_berat_bayi: String(fd.birthWeight || '3.2'),
      form_panjang_bayi: String(fd.birthLength || '49'),
      form_no_kk: fd.kkNumber || fd.noKk || fd.no_kk || rawIndividu.no_kk || '',
      no_kk: fd.kkNumber || fd.noKk || fd.no_kk || rawIndividu.no_kk || '',
      form_nama_ayah: toTitleCaseIndonesian(fd.fatherName || fd.nama_ayah || ''),
      nama_ayah: toTitleCaseIndonesian(fd.fatherName || fd.nama_ayah || ''),
      form_nik_ayah: fd.fatherNik || fd.nik_ayah || '',
      form_tempat_lahir_ayah: toTitleCaseIndonesian(fd.fatherBirthPlace || ''),
      form_tgl_lahir_ayah: fd.fatherBirthDate || '',
      form_pekerjaan_ayah: toTitleCaseIndonesian(fd.fatherJob || ''),
      form_nama_ibu: toTitleCaseIndonesian(fd.motherName || fd.nama_ibu || ''),
      nama_ibu: toTitleCaseIndonesian(fd.motherName || fd.nama_ibu || ''),
      form_nik_ibu: fd.motherNik || fd.nik_ibu || '',
      form_tempat_lahir_ibu: toTitleCaseIndonesian(fd.motherBirthPlace || ''),
      form_tgl_lahir_ibu: fd.motherBirthDate || '',
      form_pekerjaan_ibu: toTitleCaseIndonesian(fd.motherJob || ''),
      form_nama_pelapor: toTitleCaseIndonesian(fd.reporterName || fd.nama_pelapor || ''),
      form_nik_pelapor: fd.reporterNik || fd.nik_pelapor || '',
      form_hubungan_pelapor: toTitleCaseIndonesian(fd.reporterRelationship || ''),
      form_nama_saksi_i: toTitleCaseIndonesian(fd.witness1Name || fd.nama_saksi_1 || ''),
      form_nik_saksi_i: fd.witness1Nik || fd.nik_saksi_1 || '',
      form_nama_saksi_ii: toTitleCaseIndonesian(fd.witness2Name || fd.nama_saksi_2 || ''),
      form_nik_saksi_ii: fd.witness2Nik || fd.nik_saksi_2 || '',
    };

    for (const [k, v] of Object.entries(fd)) {
      if (typeof v === 'string' || typeof v === 'number') {
        const strVal = String(v);
        // Jika angka atau NIK/KK jangan diubah, jika teks konversi ke Title Case
        if (/^\d+$/.test(strVal) || k.toLowerCase().includes('nik') || k.toLowerCase().includes('kk')) {
          dynamicFormValues[k] = strVal;
        } else {
          dynamicFormValues[k] = toTitleCaseIndonesian(strVal);
        }
      }
    }

    // Pastikan nilai resolvedNoKk yang valid dari data kependudukan tidak tertimpa string kosong atau '-'
    if (resolvedNoKk && resolvedNoKk !== '-') {
      dynamicFormValues.no_kk = resolvedNoKk;
      dynamicFormValues.form_no_kk = resolvedNoKk;
      dynamicFormValues.kkNumber = resolvedNoKk;
      dynamicFormValues.noKk = resolvedNoKk;
    }

    // Sinkronkan data terverifikasi kependudukan untuk pelapor, ibu, dan ayah ke dynamicFormValues
    if (pelaporResident) {
      dynamicFormValues.form_nama_pelapor = toTitleCaseIndonesian(pelaporResident.fullName);
      dynamicFormValues.nama_pelapor = toTitleCaseIndonesian(pelaporResident.fullName);
      dynamicFormValues.form_nik_pelapor = pelaporResident.nik;
      dynamicFormValues.nik_pelapor = pelaporResident.nik;
      dynamicFormValues.form_pekerjaan_pelapor = toTitleCaseIndonesian(pelaporResident.occupation || '');
    }
    if (motherResident) {
      dynamicFormValues.form_nama_ibu = toTitleCaseIndonesian(motherResident.fullName);
      dynamicFormValues.nama_ibu = toTitleCaseIndonesian(motherResident.fullName);
      dynamicFormValues.form_nik_ibu = motherResident.nik;
      dynamicFormValues.nik_ibu = motherResident.nik;
      dynamicFormValues.form_tempat_lahir_ibu = toTitleCaseIndonesian(motherResident.placeOfBirth || '');
      dynamicFormValues.form_tgl_lahir_ibu = motherResident.dateOfBirth || dynamicFormValues.form_tgl_lahir_ibu || '';
      dynamicFormValues.form_pekerjaan_ibu = toTitleCaseIndonesian(motherResident.occupation || '');
    }
    if (fatherResident) {
      dynamicFormValues.form_nama_ayah = toTitleCaseIndonesian(fatherResident.fullName);
      dynamicFormValues.nama_ayah = toTitleCaseIndonesian(fatherResident.fullName);
      dynamicFormValues.form_nik_ayah = fatherResident.nik;
      dynamicFormValues.nik_ayah = fatherResident.nik;
      dynamicFormValues.form_tempat_lahir_ayah = toTitleCaseIndonesian(fatherResident.placeOfBirth || '');
      dynamicFormValues.form_tgl_lahir_ayah = fatherResident.dateOfBirth || dynamicFormValues.form_tgl_lahir_ayah || '';
      dynamicFormValues.form_pekerjaan_ayah = toTitleCaseIndonesian(fatherResident.occupation || '');
    }
    if (saksi1Resident) {
      dynamicFormValues.form_nama_saksi_i = toTitleCaseIndonesian(saksi1Resident.fullName);
      dynamicFormValues.nama_saksi_1 = toTitleCaseIndonesian(saksi1Resident.fullName);
      dynamicFormValues.form_nik_saksi_i = saksi1Resident.nik;
      dynamicFormValues.nik_saksi_1 = saksi1Resident.nik;
      dynamicFormValues.form_pekerjaan_saksi_i = toTitleCaseIndonesian(saksi1Resident.occupation || '');
      dynamicFormValues.form_tgl_lahir_saksi_i = saksi1Resident.dateOfBirth || dynamicFormValues.form_tgl_lahir_saksi_i || '';
    }
    if (saksi2Resident) {
      dynamicFormValues.form_nama_saksi_ii = toTitleCaseIndonesian(saksi2Resident.fullName);
      dynamicFormValues.nama_saksi_2 = toTitleCaseIndonesian(saksi2Resident.fullName);
      dynamicFormValues.form_nik_saksi_ii = saksi2Resident.nik;
      dynamicFormValues.nik_saksi_2 = saksi2Resident.nik;
      dynamicFormValues.form_pekerjaan_saksi_ii = toTitleCaseIndonesian(saksi2Resident.occupation || '');
      dynamicFormValues.form_tgl_lahir_saksi_ii = saksi2Resident.dateOfBirth || dynamicFormValues.form_tgl_lahir_saksi_ii || '';
    }

    // Sinkronisasi status perkawinan & keperluan untuk Surat Keterangan Belum Menikah & Nikah
    const rawStatusKawin = fd.form_status_perkawinan || fd.maritalStatus || fd.form_status_kawin || rawIndividu.status_kawin || 'Belum Menikah (Jejaka / Perawan)';
    dynamicFormValues.form_status_perkawinan = rawStatusKawin;
    dynamicFormValues.status_perkawinan = rawStatusKawin;
    dynamicFormValues.form_status_kawin = rawStatusKawin;
    dynamicFormValues.status_kawin = rawStatusKawin;

    const rawKeperluan = fd.form_keperluan || fd.purpose || (submission as any).purpose || 'Persyaratan Pendaftaran Pernikahan / Kelengkapan Berkas Resmi';
    dynamicFormValues.form_keperluan = rawKeperluan;
    dynamicFormValues.keperluan = rawKeperluan;

    const isSuratBelumAkta =
      (submission.letterType || '').toLowerCase().includes('belum memiliki akta') ||
      (submission.letterType || '').toLowerCase().includes('sptjm') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('belum-memiliki-akta');

    const targetPengajuan = fd.targetPengajuan || fd.peruntukanPengajuan || 'anak';
    dynamicFormValues.targetPengajuan = targetPengajuan;
    dynamicFormValues.peruntukanPengajuan = targetPengajuan;

    if (isSuratBelumAkta) {
      // Sinkronkan data subjek (anak/diri sendiri/pasangan/keluarga)
      let namaAnak = fd.childName || fd.form_nama_anak || fd.nama_anak || fd.form_nama_bayi || (fd.openSidPelakuBagian as any)?.anak?.nama || '';
      let nikAnak = fd.childNik || fd.form_nik_anak || fd.nik_anak || (fd.openSidPelakuBagian as any)?.anak?.nik || '';
      let tempatLahirAnak = fd.childBirthPlace || fd.form_tempat_lahir_anak || fd.tempat_lahir_anak || (fd.openSidPelakuBagian as any)?.anak?.tempat_lahir || '';
      let tglLahirAnak = fd.childBirthDate || fd.form_tanggal_lahir_anak || fd.tanggal_lahir_anak || (fd.openSidPelakuBagian as any)?.anak?.tanggal_lahir || '';
      let alamatAnak = fd.form_alamat_anak || fd.alamat_anak || (fd.openSidPelakuBagian as any)?.anak?.alamat || '';

      if (targetPengajuan === 'diri_sendiri') {
        if (!namaAnak) namaAnak = rawIndividu.nama;
        if (!nikAnak) nikAnak = rawIndividu.nik;
        if (!tempatLahirAnak) tempatLahirAnak = rawIndividu.tempat_lahir;
        if (!tglLahirAnak) tglLahirAnak = rawIndividu.tanggal_lahir;
        if (!alamatAnak) alamatAnak = rawIndividu.alamat;
      }

      if (namaAnak) {
        dynamicFormValues.form_nama_anak = toTitleCaseIndonesian(namaAnak);
        dynamicFormValues.nama_anak = toTitleCaseIndonesian(namaAnak);
      }
      if (nikAnak) {
        dynamicFormValues.form_nik_anak = nikAnak;
        dynamicFormValues.nik_anak = nikAnak;
      }
      if (tempatLahirAnak) {
        dynamicFormValues.form_tempat_lahir_anak = toTitleCaseIndonesian(tempatLahirAnak);
      }
      if (tglLahirAnak) {
        dynamicFormValues.form_tanggal_lahir_anak = tglLahirAnak;
        dynamicFormValues.form_tgl_lahir_anak = tglLahirAnak;
      }
      if (alamatAnak) {
        dynamicFormValues.form_alamat_anak = toTitleCaseIndonesian(alamatAnak);
        dynamicFormValues.alamat_anak = toTitleCaseIndonesian(alamatAnak);
      }
      const hariLahirAnak = fd.childBirthDay || fd.form_hari_lahir_anak || fd.hari_lahir_anak || '';
      if (hariLahirAnak) {
        dynamicFormValues.form_hari_lahir_anak = toTitleCaseIndonesian(hariLahirAnak);
      }
      const anakKe = String(fd.childOrder || fd.form_kelahiran_ke || fd.form_anak_ke || fd.anak_ke || '1');
      dynamicFormValues.form_kelahiran_ke = anakKe;
      dynamicFormValues.form_anak_ke = anakKe;

      const jenisKelahiran = fd.birthType || fd.form_jenis_kelahiran || fd.jenis_kelahiran || 'Tunggal';
      dynamicFormValues.form_jenis_kelahiran = toTitleCaseIndonesian(jenisKelahiran);

      // Data Penolong Kelahiran
      const penolongNama = fd.helperName || fd.form_penolong_kelahiran || fd.form_nama_penolong || fd.penolong_kelahiran || '';
      if (penolongNama) {
        dynamicFormValues.form_penolong_kelahiran = toTitleCaseIndonesian(penolongNama);
        dynamicFormValues.form_nama_penolong = toTitleCaseIndonesian(penolongNama);
      }
      const penolongProfesi = fd.helperJob || fd.form_profesi_penolong || fd.form_pekerjaan_penolong || 'Bidan';
      dynamicFormValues.form_profesi_penolong = toTitleCaseIndonesian(penolongProfesi);

      // Saksi I & II dari openSidPelakuBagian bila belum terisi
      if (!dynamicFormValues.form_nama_saksi_i && (fd.openSidPelakuBagian as any)?.saksi_1?.nama) {
        dynamicFormValues.form_nama_saksi_i = toTitleCaseIndonesian((fd.openSidPelakuBagian as any).saksi_1.nama);
        dynamicFormValues.nama_saksi_1 = toTitleCaseIndonesian((fd.openSidPelakuBagian as any).saksi_1.nama);
        dynamicFormValues.form_nik_saksi_i = (fd.openSidPelakuBagian as any).saksi_1.nik || '';
        dynamicFormValues.nik_saksi_1 = (fd.openSidPelakuBagian as any).saksi_1.nik || '';
      }
      if (!dynamicFormValues.form_nama_saksi_ii && (fd.openSidPelakuBagian as any)?.saksi_2?.nama) {
        dynamicFormValues.form_nama_saksi_ii = toTitleCaseIndonesian((fd.openSidPelakuBagian as any).saksi_2.nama);
        dynamicFormValues.nama_saksi_2 = toTitleCaseIndonesian((fd.openSidPelakuBagian as any).saksi_2.nama);
        dynamicFormValues.form_nik_saksi_ii = (fd.openSidPelakuBagian as any).saksi_2.nik || '';
        dynamicFormValues.nik_saksi_2 = (fd.openSidPelakuBagian as any).saksi_2.nik || '';
      }
    }

    const isSuratDuplikatAkta =
      (submission.letterType || '').toLowerCase().includes('duplikat akta kelahiran') ||
      (submission.letterType || '').toLowerCase().includes('duplikat kelahiran') ||
      (matchedMaster.urlSurat || '').toLowerCase().includes('duplikat-kelahiran') ||
      (matchedMaster.kodeSurat || '').toLowerCase() === 's-20';

    if (isSuratDuplikatAkta) {
      const namaAnak = fd.form_nama_anak || fd.nama_anak || fd.childName || rawIndividu.nama || '-';
      const nikAnak = fd.form_nik_anak || fd.nik_anak || fd.childNik || rawIndividu.nik || '-';
      const noAkta = fd.form_no_akta_kelahiran || fd.no_akta_kelahiran || fd.birthCertificateNumber || '-';
      const noAktaNikah = fd.form_no_akta_nikah || fd.no_akta_nikah || fd.marriageCertificateNumber || '-';
      const tglAktaNikah = fd.form_tgl_akta_nikah ? formatTanggalIndonesia(fd.form_tgl_akta_nikah) : (fd.tgl_akta_nikah ? formatTanggalIndonesia(fd.tgl_akta_nikah) : '-');
      const hubunganYbs = toTitleCaseIndonesian(fd.form_hubungan_dengan_ybs || fd.hubungan_pelapor || fd.reporterRelationship || 'Orang Tua / Pemohon');
      const alasan = fd.form_alasan_duplikat || fd.alasan_duplikat || fd.form_keperluan || 'Hilang';

      dynamicFormValues.form_nama_anak = toTitleCaseIndonesian(namaAnak);
      dynamicFormValues.nama_anak = dynamicFormValues.form_nama_anak;
      dynamicFormValues.form_nik_anak = nikAnak;
      dynamicFormValues.nik_anak = nikAnak;
      dynamicFormValues.form_no_akta_kelahiran = noAkta;
      dynamicFormValues.no_akta_kelahiran = noAkta;
      dynamicFormValues.form_no_akta_nikah = noAktaNikah;
      dynamicFormValues.no_akta_nikah = noAktaNikah;
      dynamicFormValues.form_tgl_akta_nikah = tglAktaNikah;
      dynamicFormValues.form_hubungan_dengan_ybs = hubunganYbs;
      dynamicFormValues.form_alasan_duplikat = toTitleCaseIndonesian(alasan);

      const aktaStr = noAkta !== '-' ? ` (No. Akta: ${noAkta})` : '';
      const subjekStr = namaAnak !== '-' ? ` atas nama ${toTitleCaseIndonesian(namaAnak)}` : '';
      const keperluanHilang = `Permohonan Duplikat Akta Kelahiran${subjekStr}${aktaStr} dikarenakan dokumen Akta Kelahiran Asli ${toTitleCaseIndonesian(alasan)}.`;
      dynamicFormValues.form_keperluan_lampiran = keperluanHilang;
      dynamicFormValues.form_keperluan = keperluanHilang;
    }

    const isSuratLahirMati =
      (submission.letterType || '').toLowerCase().includes('lahir mati') ||
      (matchedMaster.urlSurat || '').toLowerCase().includes('lahir-mati') ||
      (matchedMaster.kodeSurat || '').toLowerCase() === 's-22';

    if (isSuratLahirMati) {
      // 1. Data Lahir Mati
      const lamaKandungan = String(fd.form_lama_kandungan || fd.lamaKandungan || fd.gestationAge || '8').replace(/[^0-9]/g, '');
      const sexBayi = fd.form_sex_bayi || fd.sexBayi || fd.childGender || fd.gender || 'Laki-laki';
      const rawTglLahirMati = fd.form_tanggal_lahir_mati || fd.deathDate || fd.tanggal_lahir_mati || fd.birthDate || '';
      const normTglLahirMati = normalizeDateInput(rawTglLahirMati);
      let hariLahirMati = fd.form_hari_lahir_mati || (normTglLahirMati ? getNamaHariIndonesia(normTglLahirMati) : (rawTglLahirMati ? getNamaHariIndonesia(rawTglLahirMati) : "Jum'at"));
      if (hariLahirMati.toLowerCase() === 'jumat') hariLahirMati = "Jum'at";
      const tglLahirMatiIndo = formatTanggalIndonesia(normTglLahirMati || rawTglLahirMati || new Date());
      let jamLahirMati = String(fd.form_jam_lahir_mati || fd.deathTime || fd.jam_kematian || '08:00').trim().replace('.', ':');

      const jenisKelahiran = fd.form_jenis_kelahiran || fd.birthType || 'Tunggal';
      const kelahiranKe = String(fd.form_kelahiran_ke || fd.form_anak_ke || fd.childOrder || '1');
      const tempatDilahirkan = fd.form_tempat_dilahirkan || fd.birthPlaceType || 'RS/RB';
      const namaTempatDilahirkan = fd.form_nama_tempat_dilahirkan || fd.deathLocation || fd.birthPlace || `RSUD ${identity.namaKabupaten}`;
      const penolongKelahiran = fd.form_penolong_kelahiran || fd.birthAttendantType || 'Dokter';
      const namaPenolong = fd.form_nama_penolong || fd.helperName || 'dr. Spesialis Kandungan';
      const sebabLahirMati = fd.form_sebab_lahir_mati || fd.cause || fd.deathCause || 'IUFD (Intrauterine Fetal Death)';
      const yangMenentukan = fd.form_yang_menentukan || fd.whoDetermined || 'Dokter';
      const tempatKelahiran = fd.form_tempat_kelahiran || fd.birthPlace || identity.namaKabupaten;

      dynamicFormValues.form_lama_kandungan = lamaKandungan;
      dynamicFormValues.form_sex_bayi = toTitleCaseIndonesian(sexBayi);
      dynamicFormValues.form_tanggal_lahir_mati = tglLahirMatiIndo;
      dynamicFormValues.form_hari_lahir_mati = hariLahirMati;
      dynamicFormValues.form_hari_tanggal_lahir_mati = `${hariLahirMati}, ${tglLahirMatiIndo}`;
      dynamicFormValues.form_jam_lahir_mati = `${jamLahirMati} WIB`;
      dynamicFormValues.form_jenis_kelahiran = toTitleCaseIndonesian(jenisKelahiran);
      dynamicFormValues.form_kelahiran_ke = kelahiranKe;
      dynamicFormValues.form_tempat_dilahirkan = toTitleCaseIndonesian(tempatDilahirkan);
      dynamicFormValues.form_nama_tempat_dilahirkan = toTitleCaseIndonesian(namaTempatDilahirkan);
      dynamicFormValues.form_penolong_kelahiran = toTitleCaseIndonesian(penolongKelahiran);
      dynamicFormValues.form_nama_penolong = toTitleCaseIndonesian(namaPenolong);
      dynamicFormValues.form_sebab_lahir_mati = sebabLahirMati;
      dynamicFormValues.form_yang_menentukan = toTitleCaseIndonesian(yangMenentukan);
      dynamicFormValues.form_tempat_kelahiran = toTitleCaseIndonesian(tempatKelahiran);

      // 2. Data Ibu & Ayah
      const isPemohonIbu = rawIndividu.jenis_kelamin?.toLowerCase() === 'perempuan';
      const isPemohonAyah = rawIndividu.jenis_kelamin?.toLowerCase() === 'laki-laki';

      const namaIbu = fd.form_nama_ibu || fd.motherName || (isPemohonIbu ? rawIndividu.nama : rawIndividu.nama_ibu || '');
      const nikIbu = fd.form_nik_ibu || fd.motherNik || (isPemohonIbu ? rawIndividu.nik : (rawIndividu as any).nik_ibu || '');
      const tglLahirIbu = fd.form_tanggal_lahir_ibu || fd.motherBirthDate || (isPemohonIbu ? rawIndividu.tanggal_lahir : '');
      const umurIbu = fd.form_umur_ibu || fd.motherAge || '';
      const pekerjaanIbu = fd.form_pekerjaan_ibu || fd.motherJob || (isPemohonIbu ? rawIndividu.pekerjaan : 'Mengurus Rumah Tangga');

      const namaAyah = fd.form_nama_ayah || fd.fatherName || (isPemohonAyah ? rawIndividu.nama : rawIndividu.nama_ayah || '');
      const nikAyah = fd.form_nik_ayah || fd.fatherNik || (isPemohonAyah ? rawIndividu.nik : (rawIndividu as any).nik_ayah || '');
      const tglLahirAyah = fd.form_tanggal_lahir_ayah || fd.fatherBirthDate || (isPemohonAyah ? rawIndividu.tanggal_lahir : '');
      const umurAyah = fd.form_umur_ayah || fd.fatherAge || '';
      const pekerjaanAyah = fd.form_pekerjaan_ayah || fd.fatherJob || (isPemohonAyah ? rawIndividu.pekerjaan : 'Wiraswasta');

      const namaPelapor = fd.form_nama_pelapor || fd.reporterName || rawIndividu.nama;
      const nikPelapor = fd.form_nik_pelapor || fd.reporterNik || rawIndividu.nik;
      const relasiPelapor = fd.form_hubungan_pelapor || fd.reporterRelationship || (isPemohonAyah ? 'Ayah Kandung' : (isPemohonIbu ? 'Ibu Kandung' : 'Orang Tua / Pelapor'));

      if (namaIbu) dynamicFormValues.form_nama_ibu = toTitleCaseIndonesian(namaIbu);
      if (nikIbu) dynamicFormValues.form_nik_ibu = nikIbu;
      if (tglLahirIbu) dynamicFormValues.form_tanggal_lahir_ibu = tglLahirIbu;
      if (umurIbu) dynamicFormValues.form_umur_ibu = umurIbu;
      if (pekerjaanIbu) dynamicFormValues.form_pekerjaan_ibu = toTitleCaseIndonesian(pekerjaanIbu);

      if (namaAyah) dynamicFormValues.form_nama_ayah = toTitleCaseIndonesian(namaAyah);
      if (nikAyah) dynamicFormValues.form_nik_ayah = nikAyah;
      if (tglLahirAyah) dynamicFormValues.form_tanggal_lahir_ayah = tglLahirAyah;
      if (umurAyah) dynamicFormValues.form_umur_ayah = umurAyah;
      if (pekerjaanAyah) dynamicFormValues.form_pekerjaan_ayah = toTitleCaseIndonesian(pekerjaanAyah);

      if (namaPelapor) dynamicFormValues.form_nama_pelapor = toTitleCaseIndonesian(namaPelapor);
      if (nikPelapor) dynamicFormValues.form_nik_pelapor = nikPelapor;
      dynamicFormValues.form_hubungan_pelapor = toTitleCaseIndonesian(relasiPelapor);
    }

    // Ekstraksi umum Saksi I dan Saksi II dari openSidPelakuBagian atau formValues untuk semua formulir
    if (!dynamicFormValues.form_nama_saksi_1) {
      const s1Nama = (fd.openSidPelakuBagian as any)?.saksi_1?.nama || (fd.openSidPelakuBagian as any)?.saksi_i?.nama || fd.form_nama_saksi_i || fd.nama_saksi_1 || fd.witness1Name || fd.form_nama_saksi_1 || '';
      const s1Nik = (fd.openSidPelakuBagian as any)?.saksi_1?.nik || (fd.openSidPelakuBagian as any)?.saksi_i?.nik || fd.form_nik_saksi_i || fd.nik_saksi_1 || fd.witness1Nik || fd.form_nik_saksi_1 || '';
      if (s1Nama) {
        dynamicFormValues.form_nama_saksi_1 = toTitleCaseIndonesian(s1Nama);
        dynamicFormValues.form_nama_saksi_i = toTitleCaseIndonesian(s1Nama);
        dynamicFormValues.nama_saksi_1 = toTitleCaseIndonesian(s1Nama);
      }
      if (s1Nik) {
        dynamicFormValues.form_nik_saksi_1 = s1Nik;
        dynamicFormValues.form_nik_saksi_i = s1Nik;
        dynamicFormValues.nik_saksi_1 = s1Nik;
      }
    }
    if (!dynamicFormValues.form_nama_saksi_2) {
      const s2Nama = (fd.openSidPelakuBagian as any)?.saksi_2?.nama || (fd.openSidPelakuBagian as any)?.saksi_ii?.nama || fd.form_nama_saksi_ii || fd.nama_saksi_2 || fd.witness2Name || fd.form_nama_saksi_2 || '';
      const s2Nik = (fd.openSidPelakuBagian as any)?.saksi_2?.nik || (fd.openSidPelakuBagian as any)?.saksi_ii?.nik || fd.form_nik_saksi_ii || fd.nik_saksi_2 || fd.witness2Nik || fd.form_nik_saksi_2 || '';
      if (s2Nama) {
        dynamicFormValues.form_nama_saksi_2 = toTitleCaseIndonesian(s2Nama);
        dynamicFormValues.form_nama_saksi_ii = toTitleCaseIndonesian(s2Nama);
        dynamicFormValues.nama_saksi_2 = toTitleCaseIndonesian(s2Nama);
      }
      if (s2Nik) {
        dynamicFormValues.form_nik_saksi_2 = s2Nik;
        dynamicFormValues.form_nik_saksi_ii = s2Nik;
        dynamicFormValues.nik_saksi_2 = s2Nik;
      }
    }

    if (isSuratKematian) {
      const rawDeathDate = fd.deathDate || fd.tanggal_kematian || fd.tanggal_meninggal || '';
      const normDeathDate = normalizeDateInput(rawDeathDate);
      let hariKematian = fd.hari_kematian || (normDeathDate ? getNamaHariIndonesia(normDeathDate) : (rawDeathDate ? getNamaHariIndonesia(rawDeathDate) : "Jum'at"));
      if (hariKematian.toLowerCase() === 'jumat') hariKematian = "Jum'at";
      const tglKematianIndo = formatTanggalIndonesia(normDeathDate || rawDeathDate || new Date());

      let jamKematian = String(fd.deathTime || fd.jam_kematian || fd.pukul_meninggal || '08.35').trim();
      jamKematian = jamKematian.replace(':', '.');
      if (!jamKematian.toLowerCase().includes('wib') && !jamKematian.toLowerCase().includes('wita') && !jamKematian.toLowerCase().includes('wit')) {
        jamKematian = `${jamKematian} WIB`;
      }

      const sebabKematian = toTitleCaseIndonesian(fd.deathCause || fd.sebab_kematian || 'Sakit');
      const tempatKematian = toTitleCaseIndonesian(fd.deathLocation || fd.tempat_kematian || `Pemakaman Umum Desa ${identity.namaDesa}`);

      const relasiPelapor = fd.reporterRelationship || fd.reporterRelation || 'Keluarga';
      const namaPelapor = fd.reporterName || pelaporResident?.fullName || '';
      const whoExplainsRaw = fd.whoExplains || fd.yang_menerangkan || '';

      let yangMenerangkan = whoExplainsRaw;
      if (!yangMenerangkan) {
        if (namaPelapor) {
          yangMenerangkan = `${toTitleCaseIndonesian(namaPelapor)} (${toTitleCaseIndonesian(relasiPelapor)} Alm. ${toTitleCaseIndonesian(rawIndividu.nama)})`;
        } else {
          yangMenerangkan = 'Dokter / Tenaga Medis';
        }
      }

      dynamicFormValues.hari_kematian = hariKematian;
      dynamicFormValues.tanggal_kematian = tglKematianIndo;
      dynamicFormValues.hari_tanggal_kematian = `${hariKematian}, ${tglKematianIndo}`;
      dynamicFormValues.jam_kematian = jamKematian;
      dynamicFormValues.sebab_kematian = sebabKematian;
      dynamicFormValues.tempat_kematian = tempatKematian;
      dynamicFormValues.yang_menerangkan = yangMenerangkan;
      dynamicFormValues.yang_menerangkan_kematian = yangMenerangkan;
      dynamicFormValues.alamat_rumah = rawIndividu.alamat;

      // Data untuk formulir lampiran (F-2.29 & F-2.01)
      dynamicFormValues.form_nik_jenazah = rawIndividu.nik;
      dynamicFormValues.nik_jenazah = rawIndividu.nik;
      dynamicFormValues.form_nama_jenazah = rawIndividu.nama;
      dynamicFormValues.nama_jenazah = rawIndividu.nama;
      dynamicFormValues.form_sex_jenazah = rawIndividu.jenis_kelamin;
      dynamicFormValues.form_tempat_lahir_jenazah = rawIndividu.tempat_lahir;
      dynamicFormValues.form_tanggal_lahir_jenazah = rawIndividu.tanggal_lahir;
      dynamicFormValues.form_agama_jenazah = rawIndividu.agama;
      dynamicFormValues.form_pekerjaan_jenazah = rawIndividu.pekerjaan;
      dynamicFormValues.form_tanggal_kematian = tglKematianIndo;
      dynamicFormValues.form_jam_kematian = jamKematian;
      dynamicFormValues.form_sebab_kematian = sebabKematian;
      dynamicFormValues.form_tempat_kematian = tempatKematian;
      dynamicFormValues.form_yang_menerangkan = yangMenerangkan;
      dynamicFormValues.form_anak_ke = String(fd.anakKe || fd.childOrder || '1');
    }

    const isSuratBedaNama =
      (submission.letterType || '').toLowerCase().includes('beda nama') ||
      (submission.letterType || '').toLowerCase().includes('beda identitas') ||
      (matchedMaster.urlSurat || '').toLowerCase().includes('beda-identitas') ||
      (matchedMaster.urlSurat || '').toLowerCase().includes('beda-nama') ||
      matchedMaster.kodeSurat === '471.1';

    if (isSuratBedaNama) {
      // 1. Dokumen 1
      const doc1Name = toTitleCaseIndonesian(
        fd.form_nama_dokumen_1 ||
        fd.form_jenis_dokumen_1 ||
        fd.doc1Name ||
        fd.jenisDokumen1 ||
        fd.namaDokumen1 ||
        'Kartu Tanda Penduduk'
      );
      const doc1Data = toTitleCaseIndonesian(
        fd.form_nama_di_dokumen_1 ||
        fd.doc1Data ||
        fd.namaDiDokumen1 ||
        fd.nameInDoc1 ||
        rawIndividu.nama ||
        '-'
      );
      const doc1Lengkap =
        doc1Name.toLowerCase().includes('ktp') || doc1Name.toLowerCase().includes('kartu tanda penduduk')
          ? 'Kartu Tanda Penduduk (KTP)'
          : doc1Name;

      dynamicFormValues.form_nama_dokumen_1 = doc1Name;
      dynamicFormValues.nama_dokumen_1 = doc1Name;
      dynamicFormValues.form_nama_di_dokumen_1 = doc1Data;
      dynamicFormValues.nama_di_dokumen_1 = doc1Data;
      dynamicFormValues.form_nama_dokumen_1_lengkap = doc1Lengkap;
      dynamicFormValues.nama_dokumen_1_lengkap = doc1Lengkap;

      // 2. Dokumen 2 (Jenis Dokumen 2: Ijazah, Buku Nikah, dll.)
      const doc2Name = toTitleCaseIndonesian(
        fd.form_nama_kartu_identitas ||
        fd.form_jenis_dokumen_2 ||
        fd.doc2Name ||
        fd.jenisDokumen2 ||
        fd.namaKartuIdentitas ||
        'Ijazah'
      );
      const doc2Data = toTitleCaseIndonesian(
        fd.form_nama_di_dokumen_2 ||
        fd.doc2Data ||
        fd.namaDiDokumen2 ||
        fd.nameInDoc2 ||
        fd.form_nama ||
        '-'
      );

      dynamicFormValues.form_nama_kartu_identitas = doc2Name;
      dynamicFormValues.nama_kartu_identitas = doc2Name;
      dynamicFormValues.form_jenis_dokumen_2 = doc2Name;
      dynamicFormValues.jenis_dokumen_2 = doc2Name;
      dynamicFormValues.form_nama_di_dokumen_2 = doc2Data;
      dynamicFormValues.nama_di_dokumen_2 = doc2Data;
      dynamicFormValues.form_nama = doc2Data;
    }

    const isSuratMoyang =
      (submission.letterType || '').toLowerCase().includes('moyang') ||
      (matchedMaster.urlSurat || '').toLowerCase().includes('moyang');

    if (isSuratMoyang) {
      const rawNamaMoyang =
        fd.form_nama_moyang ||
        fd.nama_moyang ||
        fd.moyangName ||
        (fd.moyang as any)?.name ||
        '';
      const rawHubunganMoyang =
        fd.form_hubungan_moyang ||
        fd.hubungan_moyang ||
        fd.moyangRelation ||
        (fd.moyang as any)?.relation ||
        '';

      const namaMoyang = rawNamaMoyang ? toTitleCaseIndonesian(rawNamaMoyang) : '';
      const hubunganMoyang = rawHubunganMoyang ? toTitleCaseIndonesian(rawHubunganMoyang) : '';

      let statusMoyang =
        fd.form_keterangan_status_moyang ||
        fd.form_keterangan_status ||
        fd.keteranganStatus ||
        fd.keterangan_status_moyang ||
        '';

      if (!statusMoyang || statusMoyang === '[Form_keterangan_status_moyang]') {
        if (namaMoyang) {
          statusMoyang = `Bahwa orang tersebut di atas adalah benar-benar penduduk Desa ${identity.namaDesa} dan merupakan garis keturunan / keluarga dari ${namaMoyang}${hubunganMoyang ? ` (${hubunganMoyang})` : ''}.`;
        } else {
          statusMoyang = `Bahwa orang tersebut di atas adalah benar-benar penduduk Desa ${identity.namaDesa}.`;
        }
      }

      const keteranganTambahan =
        fd.form_keterangan_tambahan ||
        fd.keteranganTambahan ||
        fd.keterangan_tambahan ||
        '';

      const keperluanMoyang =
        fd.form_keperluan ||
        fd.purpose ||
        fd.keperluan ||
        (submission as any).purpose ||
        'Pembuatan Akta Kelahiran di Kantor Disdukcapil';

      dynamicFormValues.form_nama_moyang = namaMoyang;
      dynamicFormValues.nama_moyang = namaMoyang;
      dynamicFormValues.form_hubungan_moyang = hubunganMoyang;
      dynamicFormValues.hubungan_moyang = hubunganMoyang;
      dynamicFormValues.form_keterangan_status_moyang = statusMoyang;
      dynamicFormValues.keterangan_status_moyang = statusMoyang;
      dynamicFormValues.form_keterangan_tambahan = keteranganTambahan;
      dynamicFormValues.keterangan_tambahan = keteranganTambahan;
      dynamicFormValues.form_keperluan = keperluanMoyang;
      dynamicFormValues.keperluan = keperluanMoyang;
    }

    const isSuratWali =
      ((submission.letterType || '').toLowerCase().includes('keterangan wali') ||
        (matchedMaster.urlSurat || '').toLowerCase().includes('keterangan-wali')) &&
      !((submission.letterType || '').toLowerCase().includes('hakim') ||
        (matchedMaster.urlSurat || '').toLowerCase().includes('hakim'));

    if (isSuratWali) {
      const waliObj = (fd.wali as any) || {};
      const anakObj = (fd.anak as any) || {};

      const namaWali = waliObj.name || fd.nama_wali || fd.form_nama_wali || submission.requesterName || '-';
      const nikWali = waliObj.nik || fd.nik_wali || fd.form_nik_wali || submission.nik || '-';
      const ttlWali = formatTTL(waliObj.birthPlace || fd.tempat_lahir_wali, waliObj.birthDate || fd.tanggal_lahir_wali);
      const jenisKelaminWali = waliObj.gender || fd.jenis_kelamin_wali || 'Perempuan';
      const agamaWali = waliObj.religion || fd.agama_wali || 'Islam';
      const pekerjaanWali = waliObj.job || fd.pekerjaan_wali || 'Mengurus Rumah Tangga';
      const alamatWali = waliObj.address || fd.alamat_wali || '-';

      const namaAnak = anakObj.name || fd.nama_anak || fd.form_nama_anak || '-';
      const ttlAnak = formatTTL(anakObj.birthPlace || fd.tempat_lahir_anak, anakObj.birthDate || fd.tanggal_lahir_anak);
      const noKkAnak = anakObj.noKk || fd.no_kk_anak || fd.form_no_kk_anak || fd.noKk || '-';
      const nikAnak = anakObj.nik || fd.nik_anak || fd.form_nik_anak || '-';
      const ayahAnak = anakObj.fatherName || fd.nama_ayah_kandung || fd.form_nama_ayah_kandung || '-';
      const ibuAnak = anakObj.motherName || fd.nama_ibu_kandung || fd.form_nama_ibu_kandung || '-';
      const jenisKelaminAnak = anakObj.gender || fd.jenis_kelamin_anak || 'Perempuan';
      const agamaAnak = anakObj.religion || fd.agama_anak || 'Islam';
      const pekerjaanAnak = anakObj.job || fd.pekerjaan_anak || 'Pelajar';
      const sekolahAnak = anakObj.schoolName || fd.nama_sekolah || fd.form_nama_sekolah || '-';
      const kelasAnak = anakObj.grade || fd.kelas_anak || fd.form_kelas_anak || '-';
      const alamatAnak = anakObj.address || fd.alamat_anak || alamatWali;

      const keperluanWali =
        fd.purpose ||
        fd.keperluan ||
        fd.form_keperluan ||
        (submission as any).purpose ||
        'Pengambilan/Pencairan Bantuan Program Indonesia Pintar (PIP)';

      dynamicFormValues.nama_wali = namaWali;
      dynamicFormValues.form_nama_wali = namaWali;
      dynamicFormValues.nik_wali = nikWali;
      dynamicFormValues.form_nik_wali = nikWali;
      dynamicFormValues.ttl_wali = ttlWali;
      dynamicFormValues.form_ttl_wali = ttlWali;
      dynamicFormValues.jenis_kelamin_wali = jenisKelaminWali;
      dynamicFormValues.form_jenis_kelamin_wali = jenisKelaminWali;
      dynamicFormValues.agama_wali = agamaWali;
      dynamicFormValues.form_agama_wali = agamaWali;
      dynamicFormValues.pekerjaan_wali = pekerjaanWali;
      dynamicFormValues.form_pekerjaan_wali = pekerjaanWali;
      dynamicFormValues.alamat_wali = alamatWali;
      dynamicFormValues.form_alamat_wali = alamatWali;

      dynamicFormValues.nama_anak = namaAnak;
      dynamicFormValues.form_nama_anak = namaAnak;
      dynamicFormValues.ttl_anak = ttlAnak;
      dynamicFormValues.form_ttl_anak = ttlAnak;
      dynamicFormValues.no_kk_anak = noKkAnak;
      dynamicFormValues.form_no_kk_anak = noKkAnak;
      dynamicFormValues.nik_anak = nikAnak;
      dynamicFormValues.form_nik_anak = nikAnak;
      dynamicFormValues.nama_ayah_kandung = ayahAnak;
      dynamicFormValues.form_nama_ayah_kandung = ayahAnak;
      dynamicFormValues.nama_ibu_kandung = ibuAnak;
      dynamicFormValues.form_nama_ibu_kandung = ibuAnak;
      dynamicFormValues.jenis_kelamin_anak = jenisKelaminAnak;
      dynamicFormValues.form_jenis_kelamin_anak = jenisKelaminAnak;
      dynamicFormValues.agama_anak = agamaAnak;
      dynamicFormValues.form_agama_anak = agamaAnak;
      dynamicFormValues.pekerjaan_anak = pekerjaanAnak;
      dynamicFormValues.form_pekerjaan_anak = pekerjaanAnak;
      dynamicFormValues.nama_sekolah = sekolahAnak;
      dynamicFormValues.form_nama_sekolah = sekolahAnak;
      dynamicFormValues.kelas_anak = kelasAnak;
      dynamicFormValues.form_kelas_anak = kelasAnak;
      dynamicFormValues.alamat_anak = alamatAnak;
      dynamicFormValues.form_alamat_anak = alamatAnak;

      dynamicFormValues.form_keperluan = keperluanWali;
      dynamicFormValues.keperluan = keperluanWali;
    }

    const isNikahNonMuslim =
      (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('non-muslim') ||
      (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('non muslim') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('nikah-warga-non-muslim') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('nikah-non-muslim') ||
      matchedMaster.kodeSurat?.toLowerCase() === 's-50' ||
      matchedMaster.id === 'prm-32';

    const isSuratNikah =
      !isNikahNonMuslim &&
      ((submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('pengantar nikah') ||
        (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('keterangan nikah') ||
        (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('untuk nikah') ||
        (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('n-1') ||
        (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('pergi kawin') ||
        (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('numpang nikah') ||
        ((submission as any).urlSurat || '').toLowerCase().includes('keterangan-nikah') ||
        ((submission as any).urlSurat || '').toLowerCase().includes('pergi-kawin') ||
        matchedMaster.kodeSurat?.toLowerCase() === 's-23' ||
        matchedMaster.kodeSurat?.toLowerCase() === 's-30' ||
        matchedMaster.kodeSurat?.toLowerCase() === 's-31' ||
        matchedMaster.kodeSurat === '474.2');

    const resolvedPelakuBagian: Record<string, OpenSidPersonData> = {
      ...(fd.openSidPelakuBagian || {}),
    };

    if (isSuratNikah) {
      const spouseRes = (fd.spouseNik && residentMap[fd.spouseNik]) ? residentMap[fd.spouseNik] : null;
      const fatherRes = (fd.fatherNik && residentMap[fd.fatherNik]) ? residentMap[fd.fatherNik] : null;
      const motherRes = (fd.motherNik && residentMap[fd.motherNik]) ? residentMap[fd.motherNik] : null;
      const waliRes = (fd.waliNik && residentMap[fd.waliNik]) ? residentMap[fd.waliNik] : null;
      const w1Res = (fd.witness1Nik && residentMap[fd.witness1Nik]) ? residentMap[fd.witness1Nik] : null;
      const w2Res = (fd.witness2Nik && residentMap[fd.witness2Nik]) ? residentMap[fd.witness2Nik] : null;
      const decRes = (fd.deceasedSpouseNik && residentMap[fd.deceasedSpouseNik]) ? residentMap[fd.deceasedSpouseNik] : null;

      const isMalePemohon = (formattedIndividu.jenis_kelamin || '').toLowerCase().includes('laki');

      // Pendidikan & Status Kawin Pemohon
      if (fd.education || fd.form_pendidikan) {
        formattedIndividu.pendidikan_kk = fd.education || fd.form_pendidikan;
        dynamicFormValues.form_pendidikan = formattedIndividu.pendidikan_kk || 'SLTA / Sederajat';
      }
      if (fd.maritalStatus || fd.form_status_kawin) {
        formattedIndividu.status_kawin = fd.maritalStatus || fd.form_status_kawin;
        dynamicFormValues.form_status_kawin = formattedIndividu.status_kawin || 'Jejaka';
      }
      dynamicFormValues.form_beristri_ke = fd.beristriKe || fd.form_beristri_ke || '-';

      // Ayah Pemohon
      const pbAyah = (resolvedPelakuBagian.ayah || {}) as any;
      const namaAyah = (fd.fatherName || fd.form_nama_ayah || pbAyah.nama || fatherRes?.fullName || formattedIndividu.nama_ayah || '-').toUpperCase();
      const nikAyah = fd.fatherNik || fd.form_nik_ayah || pbAyah.nik || fatherRes?.nik || '-';
      const binAyah = (fd.fatherBin || fd.form_bin_ayah || pbAyah.nama_ayah || pbAyah.namaAyah || fatherRes?.fatherName || '-').toUpperCase();
      const tmpLahirAyah = toTitleCaseIndonesian(fd.fatherBirthPlace || fd.form_tempat_lahir_ayah || pbAyah.tempat_lahir || pbAyah.tempatLahir || fatherRes?.placeOfBirth || identity.namaKabupaten);
      const rawTglAyah = fd.fatherBirthDate || fd.form_tanggal_lahir_ayah || pbAyah.tanggal_lahir || pbAyah.tanggalLahir || fatherRes?.dateOfBirth || '';
      const normTglAyah = rawTglAyah && rawTglAyah !== '-' ? normalizeDateInput(rawTglAyah) : null;
      const tglLahirAyah = normTglAyah ? formatTanggalIndonesia(normTglAyah) : '-';
      const wnAyah = fd.fatherNationality || fd.form_wn_ayah || pbAyah.warga_negara || pbAyah.wargaNegara || 'WNI';
      const agamaAyah = toTitleCaseIndonesian(fd.fatherReligion || fd.form_agama_ayah || pbAyah.agama || fatherRes?.religion || 'Islam');
      const pekerjaanAyah = toTitleCaseIndonesian(fd.fatherJob || fd.form_pekerjaan_ayah || pbAyah.pekerjaan || fatherRes?.occupation || 'Wiraswasta');
      const alamatAyah = fd.fatherAddress || fd.form_alamat_ayah || pbAyah.alamat || formattedIndividu.alamat;

      formattedIndividu.nama_ayah = namaAyah;
      resolvedPelakuBagian.ayah = {
        ...pbAyah,
        nik: nikAyah,
        nama: namaAyah,
        nama_ayah: binAyah,
        tempat_lahir: tmpLahirAyah,
        tanggal_lahir: tglLahirAyah,
        warga_negara: wnAyah,
        agama: agamaAyah,
        pekerjaan: pekerjaanAyah,
        alamat: alamatAyah,
      };
      dynamicFormValues.form_nama_ayah = namaAyah;
      dynamicFormValues.form_nik_ayah = nikAyah;
      dynamicFormValues.form_bin_ayah = binAyah;
      dynamicFormValues.form_tempat_lahir_ayah = tmpLahirAyah;
      dynamicFormValues.form_tanggal_lahir_ayah = tglLahirAyah;
      const ttlAyah = tmpLahirAyah !== '-' && tglLahirAyah !== '-'
        ? `${tmpLahirAyah}, ${tglLahirAyah}`
        : tmpLahirAyah !== '-' ? tmpLahirAyah : tglLahirAyah;
      dynamicFormValues.form_ttl_ayah = ttlAyah;
      dynamicFormValues.ttl_ayah = ttlAyah;
      dynamicFormValues.form_wn_ayah = wnAyah;
      dynamicFormValues.form_agama_ayah = agamaAyah;
      dynamicFormValues.form_pekerjaan_ayah = pekerjaanAyah;
      dynamicFormValues.form_alamat_ayah = alamatAyah;

      // Ibu Pemohon
      const pbIbu = (resolvedPelakuBagian.ibu || {}) as any;
      const namaIbu = (fd.motherName || fd.form_nama_ibu || pbIbu.nama || motherRes?.fullName || formattedIndividu.nama_ibu || '-').toUpperCase();
      const nikIbu = fd.motherNik || fd.form_nik_ibu || pbIbu.nik || motherRes?.nik || '-';
      const bintiIbu = (fd.motherBinti || fd.form_binti_ibu || pbIbu.nama_ayah || pbIbu.namaAyah || motherRes?.fatherName || '-').toUpperCase();
      const tmpLahirIbu = toTitleCaseIndonesian(fd.motherBirthPlace || fd.form_tempat_lahir_ibu || pbIbu.tempat_lahir || pbIbu.tempatLahir || motherRes?.placeOfBirth || identity.namaKabupaten);
      const rawTglIbu = fd.motherBirthDate || fd.form_tanggal_lahir_ibu || pbIbu.tanggal_lahir || pbIbu.tanggalLahir || motherRes?.dateOfBirth || '';
      const normTglIbu = rawTglIbu && rawTglIbu !== '-' ? normalizeDateInput(rawTglIbu) : null;
      const tglLahirIbu = normTglIbu ? formatTanggalIndonesia(normTglIbu) : '-';
      const wnIbu = fd.motherNationality || fd.form_wn_ibu || pbIbu.warga_negara || pbIbu.wargaNegara || 'WNI';
      const agamaIbu = toTitleCaseIndonesian(fd.motherReligion || fd.form_agama_ibu || pbIbu.agama || motherRes?.religion || 'Islam');
      const pekerjaanIbu = toTitleCaseIndonesian(fd.motherJob || fd.form_pekerjaan_ibu || pbIbu.pekerjaan || motherRes?.occupation || 'Mengurus Rumah Tangga');
      const alamatIbu = fd.motherAddress || fd.form_alamat_ibu || pbIbu.alamat || formattedIndividu.alamat;

      formattedIndividu.nama_ibu = namaIbu;
      resolvedPelakuBagian.ibu = {
        ...pbIbu,
        nik: nikIbu,
        nama: namaIbu,
        nama_ayah: bintiIbu,
        tempat_lahir: tmpLahirIbu,
        tanggal_lahir: tglLahirIbu,
        warga_negara: wnIbu,
        agama: agamaIbu,
        pekerjaan: pekerjaanIbu,
        alamat: alamatIbu,
      };
      dynamicFormValues.form_nama_ibu = namaIbu;
      dynamicFormValues.form_nik_ibu = nikIbu;
      dynamicFormValues.form_binti_ibu = bintiIbu;
      dynamicFormValues.form_tempat_lahir_ibu = tmpLahirIbu;
      dynamicFormValues.form_tanggal_lahir_ibu = tglLahirIbu;
      const ttlIbu = tmpLahirIbu !== '-' && tglLahirIbu !== '-'
        ? `${tmpLahirIbu}, ${tglLahirIbu}`
        : tmpLahirIbu !== '-' ? tmpLahirIbu : tglLahirIbu;
      dynamicFormValues.form_ttl_ibu = ttlIbu;
      dynamicFormValues.ttl_ibu = ttlIbu;
      dynamicFormValues.form_wn_ibu = wnIbu;
      dynamicFormValues.form_agama_ibu = agamaIbu;
      dynamicFormValues.form_pekerjaan_ibu = pekerjaanIbu;
      dynamicFormValues.form_alamat_ibu = alamatIbu;

      // Calon Pasangan
      const pbPasangan = (resolvedPelakuBagian.pasangan || {}) as any;
      const namaPasangan = (fd.spouseName || fd.form_nama_pasangan || pbPasangan.nama || spouseRes?.fullName || '-').toUpperCase();
      const nikPasangan = fd.spouseNik || fd.form_nik_pasangan || pbPasangan.nik || spouseRes?.nik || '-';
      const binPasangan = (fd.spouseFatherName || fd.form_bin_pasangan || pbPasangan.nama_ayah || pbPasangan.namaAyah || spouseRes?.fatherName || '-').toUpperCase();
      const ibuPasangan = (fd.spouseMotherName || fd.form_ibu_pasangan || pbPasangan.nama_ibu || pbPasangan.namaIbu || spouseRes?.motherName || '-').toUpperCase();
      const tmpLahirPasangan = toTitleCaseIndonesian(fd.spouseBirthPlace || fd.form_tempat_lahir_pasangan || pbPasangan.tempat_lahir || pbPasangan.tempatLahir || spouseRes?.placeOfBirth || identity.namaKabupaten);
      const rawTglPasangan = fd.spouseBirthDate || fd.form_tanggal_lahir_pasangan || pbPasangan.tanggal_lahir || pbPasangan.tanggalLahir || spouseRes?.dateOfBirth || '';
      const normTglPasangan = rawTglPasangan && rawTglPasangan !== '-' ? normalizeDateInput(rawTglPasangan) : null;
      const tglLahirPasangan = normTglPasangan ? formatTanggalIndonesia(normTglPasangan) : '-';
      const wnPasangan = fd.spouseNationality || fd.form_wn_pasangan || pbPasangan.warga_negara || pbPasangan.wargaNegara || 'WNI';
      const agamaPasangan = toTitleCaseIndonesian(fd.spouseReligion || fd.form_agama_pasangan || pbPasangan.agama || spouseRes?.religion || 'Islam');
      const pekerjaanPasangan = toTitleCaseIndonesian(fd.spouseJob || fd.form_pekerjaan_pasangan || pbPasangan.pekerjaan || spouseRes?.occupation || 'Wiraswasta');
      const pendidikanPasangan = fd.spouseEducation || fd.form_pendidikan_pasangan || pbPasangan.pendidikan_kk || pbPasangan.pendidikan || spouseRes?.educationLevel || 'SLTA / Sederajat';
      const statusPasangan = fd.spouseStatus || fd.form_status_pasangan || pbPasangan.status_kawin || pbPasangan.statusKawin || (isMalePemohon ? 'Perawan' : 'Jejaka');
      const alamatPasangan = fd.spouseAddress || fd.form_alamat_pasangan || pbPasangan.alamat || '-';
      const noHpPasangan = fd.spousePhone || fd.form_no_hp_pasangan || '-';

      resolvedPelakuBagian.pasangan = {
        ...pbPasangan,
        nik: nikPasangan,
        nama: namaPasangan,
        nama_ayah: binPasangan,
        nama_ibu: ibuPasangan,
        jenis_kelamin: isMalePemohon ? 'Perempuan' : 'Laki-laki',
        tempat_lahir: tmpLahirPasangan,
        tanggal_lahir: tglLahirPasangan,
        warga_negara: wnPasangan,
        agama: agamaPasangan,
        pekerjaan: pekerjaanPasangan,
        pendidikan_kk: pendidikanPasangan,
        status_kawin: statusPasangan,
        alamat: alamatPasangan,
      };
      dynamicFormValues.form_nama_pasangan = namaPasangan;
      dynamicFormValues.form_nama_calon_pasangan = namaPasangan;
      dynamicFormValues.nama_calon_pasangan = namaPasangan;
      dynamicFormValues.nama_pasangan = namaPasangan;

      dynamicFormValues.form_nik_pasangan = nikPasangan;
      dynamicFormValues.form_nik_calon_pasangan = nikPasangan;
      dynamicFormValues.nik_calon_pasangan = nikPasangan;
      dynamicFormValues.nik_pasangan = nikPasangan;

      dynamicFormValues.form_bin_pasangan = binPasangan;
      dynamicFormValues.form_bin_calon_pasangan = binPasangan;
      dynamicFormValues.bin_calon_pasangan = binPasangan;
      dynamicFormValues.bin_pasangan = binPasangan;

      const labelBinPasangan = isMalePemohon ? 'Binti' : 'Bin';
      dynamicFormValues.form_label_bin_pasangan = labelBinPasangan;
      dynamicFormValues.label_bin_pasangan = labelBinPasangan;

      dynamicFormValues.form_ibu_pasangan = ibuPasangan;
      dynamicFormValues.form_tempat_lahir_pasangan = tmpLahirPasangan;
      dynamicFormValues.form_tanggal_lahir_pasangan = tglLahirPasangan;
      const ttlPasangan = tmpLahirPasangan !== '-' && tglLahirPasangan !== '-'
        ? `${tmpLahirPasangan}, ${tglLahirPasangan}`
        : tmpLahirPasangan !== '-' ? tmpLahirPasangan : tglLahirPasangan;
      dynamicFormValues.form_ttl_pasangan = ttlPasangan;
      dynamicFormValues.ttl_pasangan = ttlPasangan;

      dynamicFormValues.form_wn_pasangan = wnPasangan;
      dynamicFormValues.form_warga_negara_pasangan = wnPasangan;
      dynamicFormValues.warga_negara_pasangan = wnPasangan;

      dynamicFormValues.form_agama_pasangan = agamaPasangan;
      dynamicFormValues.agama_pasangan = agamaPasangan;

      dynamicFormValues.form_pekerjaan_pasangan = pekerjaanPasangan;
      dynamicFormValues.pekerjaan_pasangan = pekerjaanPasangan;

      dynamicFormValues.form_pendidikan_pasangan = pendidikanPasangan;
      dynamicFormValues.form_status_pasangan = statusPasangan;
      dynamicFormValues.status_pasangan = statusPasangan;

      dynamicFormValues.form_alamat_pasangan = alamatPasangan;
      dynamicFormValues.alamat_pasangan = alamatPasangan;
      dynamicFormValues.form_no_hp_pasangan = noHpPasangan;

      // Wali Nikah
      const pbWali = (resolvedPelakuBagian.wali || {}) as any;
      const namaWali = (fd.waliName || fd.form_nama_wali || pbWali.nama || waliRes?.fullName || namaAyah || '-').toUpperCase();
      const nikWali = fd.waliNik || fd.form_nik_wali || pbWali.nik || waliRes?.nik || nikAyah || '-';
      const binWali = (fd.waliBin || fd.form_bin_wali || pbWali.nama_ayah || pbWali.namaAyah || waliRes?.fatherName || binAyah || '-').toUpperCase();
      const tmpLahirWali = toTitleCaseIndonesian(fd.waliBirthPlace || fd.form_tempat_lahir_wali || pbWali.tempat_lahir || pbWali.tempatLahir || waliRes?.placeOfBirth || tmpLahirAyah || identity.namaKabupaten);
      const rawTglWali = fd.waliBirthDate || fd.form_tanggal_lahir_wali || pbWali.tanggal_lahir || pbWali.tanggalLahir || waliRes?.dateOfBirth || rawTglAyah || '';
      const normTglWali = rawTglWali && rawTglWali !== '-' ? normalizeDateInput(rawTglWali) : null;
      const tglLahirWali = normTglWali ? formatTanggalIndonesia(normTglWali) : tglLahirAyah;
      const agamaWali = toTitleCaseIndonesian(fd.waliReligion || fd.form_agama_wali || pbWali.agama || waliRes?.religion || agamaAyah || 'Islam');
      const pekerjaanWali = toTitleCaseIndonesian(fd.waliJob || fd.form_pekerjaan_wali || pbWali.pekerjaan || waliRes?.occupation || pekerjaanAyah || 'Wiraswasta');
      const alamatWali = fd.waliAddress || fd.form_alamat_wali || pbWali.alamat || alamatAyah || formattedIndividu.alamat;
      const hubunganWali = fd.waliRelationship || fd.form_hubungan_wali || pbWali.hubungan_kk || pbWali.hubungan || 'Ayah Kandung';
      const alasanWali = fd.waliReasonNotFather || fd.form_alasan_wali || '-';

      resolvedPelakuBagian.wali = {
        ...pbWali,
        nik: nikWali,
        nama: namaWali,
        nama_ayah: binWali,
        tempat_lahir: tmpLahirWali,
        tanggal_lahir: tglLahirWali,
        warga_negara: 'WNI',
        agama: agamaWali,
        pekerjaan: pekerjaanWali,
        alamat: alamatWali,
        hubungan_kk: hubunganWali,
      };
      dynamicFormValues.form_nama_wali = namaWali;
      dynamicFormValues.form_nik_wali = nikWali;
      dynamicFormValues.form_bin_wali = binWali;
      dynamicFormValues.form_tempat_lahir_wali = tmpLahirWali;
      dynamicFormValues.form_tanggal_lahir_wali = tglLahirWali;
      dynamicFormValues.form_agama_wali = agamaWali;
      dynamicFormValues.form_pekerjaan_wali = pekerjaanWali;
      dynamicFormValues.form_alamat_wali = alamatWali;
      dynamicFormValues.form_hubungan_wali = hubunganWali;
      dynamicFormValues.form_alasan_wali = alasanWali;

      // Almarhum/Almarhumah (N-6)
      const pbAlm = (resolvedPelakuBagian.almarhum || {}) as any;
      const namaAlm = (fd.deceasedSpouseName || fd.form_nama_almarhum || pbAlm.nama || decRes?.fullName || '-').toUpperCase();
      const binAlm = (fd.deceasedSpouseBin || fd.form_bin_almarhum || pbAlm.nama_ayah || pbAlm.namaAyah || decRes?.fatherName || '-').toUpperCase();
      const nikAlm = fd.deceasedSpouseNik || fd.form_nik_almarhum || pbAlm.nik || decRes?.nik || '-';
      const tmpLahirAlm = toTitleCaseIndonesian(fd.deceasedSpouseBirthPlace || fd.form_tempat_lahir_almarhum || pbAlm.tempat_lahir || pbAlm.tempatLahir || decRes?.placeOfBirth || '-');
      const rawTglAlm = fd.deceasedSpouseBirthDate || fd.form_tanggal_lahir_almarhum || pbAlm.tanggal_lahir || pbAlm.tanggalLahir || decRes?.dateOfBirth || '';
      const normTglAlm = rawTglAlm && rawTglAlm !== '-' ? normalizeDateInput(rawTglAlm) : null;
      const tglLahirAlm = normTglAlm ? formatTanggalIndonesia(normTglAlm) : '-';
      const wnAlm = fd.deceasedSpouseNationality || fd.form_wn_almarhum || pbAlm.warga_negara || pbAlm.wargaNegara || 'WNI';
      const agamaAlm = toTitleCaseIndonesian(fd.deceasedSpouseReligion || fd.form_agama_almarhum || pbAlm.agama || decRes?.religion || 'Islam');
      const pekerjaanAlm = toTitleCaseIndonesian(fd.deceasedSpouseJob || fd.form_pekerjaan_almarhum || pbAlm.pekerjaan || decRes?.occupation || '-');
      const alamatAlm = fd.deceasedSpouseAddress || fd.form_alamat_almarhum || pbAlm.alamat || '-';
      const rawTglMeninggal = fd.deceasedSpouseDeathDate || fd.form_tanggal_meninggal || '';
      const normTglMeninggal = rawTglMeninggal && rawTglMeninggal !== '-' ? normalizeDateInput(rawTglMeninggal) : null;
      const tglMeninggalAlm = normTglMeninggal ? formatTanggalIndonesia(normTglMeninggal) : '-';
      const tmpMeninggalAlm = fd.deceasedSpouseDeathPlace || fd.form_tempat_meninggal || '-';

      resolvedPelakuBagian.almarhum = {
        ...pbAlm,
        nik: nikAlm,
        nama: namaAlm,
        nama_ayah: binAlm,
        tempat_lahir: tmpLahirAlm,
        tanggal_lahir: tglLahirAlm,
        warga_negara: wnAlm,
        agama: agamaAlm,
        pekerjaan: pekerjaanAlm,
        alamat: alamatAlm,
      };
      dynamicFormValues.form_nama_almarhum = namaAlm;
      dynamicFormValues.form_bin_almarhum = binAlm;
      dynamicFormValues.form_nik_almarhum = nikAlm;
      dynamicFormValues.form_tempat_lahir_almarhum = tmpLahirAlm;
      dynamicFormValues.form_tanggal_lahir_almarhum = tglLahirAlm;
      dynamicFormValues.form_wn_almarhum = wnAlm;
      dynamicFormValues.form_agama_almarhum = agamaAlm;
      dynamicFormValues.form_pekerjaan_almarhum = pekerjaanAlm;
      dynamicFormValues.form_alamat_almarhum = alamatAlm;
      dynamicFormValues.form_tanggal_meninggal = tglMeninggalAlm;
      dynamicFormValues.form_tempat_meninggal = tmpMeninggalAlm;

      // Akad & KUA
      const rawAkadDate = fd.akadDate || fd.form_tanggal_nikah || '';
      const normAkadDate = rawAkadDate && rawAkadDate !== '-' ? normalizeDateInput(rawAkadDate) : null;
      const formattedAkadDate = normAkadDate ? formatTanggalIndonesia(normAkadDate) : '-';
      const akadDay = fd.akadDay || fd.form_hari_nikah || (normAkadDate ? getNamaHariIndonesia(normAkadDate) : '-');
      const akadTime = fd.akadTime || fd.form_jam_nikah || '09.00 WIB';
      const kuaLoc = fd.kuaLocation || fd.form_kua_tujuan || `KUA Kecamatan ${identity.namaKecamatan}`;
      const akadPlace = fd.akadPlace || fd.form_tempat_nikah || kuaLoc;
      const masKawin = fd.masKawin || fd.form_mas_kawin || 'Seperangkat Alat Sholat Dibayar Tunai';

      dynamicFormValues.form_hari_nikah = akadDay;
      dynamicFormValues.form_tanggal_nikah = formattedAkadDate;
      dynamicFormValues.form_jam_nikah = akadTime;
      dynamicFormValues.form_tempat_nikah = akadPlace;
      dynamicFormValues.form_kua_tujuan = kuaLoc;
      dynamicFormValues.kua_tujuan = kuaLoc;
      dynamicFormValues.form_tujuan = kuaLoc;
      dynamicFormValues.tujuan = kuaLoc;
      dynamicFormValues.destinationKua = kuaLoc;
      dynamicFormValues.form_mas_kawin = masKawin;
    }

    // Saksi 1 & Saksi 2 (Universal untuk seluruh surat: Nikah Non-Muslim, Pengantar Nikah, Belum Menikah, Duplikat Nikah, dll)
    const w1Nik = fd.witness1Nik || fd.form_nik_saksi_1 || fd.form_nik_saksi1 || resolvedPelakuBagian.saksi_1?.nik;
    const w1Res = (w1Nik && residentMap[w1Nik]) ? residentMap[w1Nik] : null;
    const pbS1 = (resolvedPelakuBagian.saksi_1 || {}) as any;
    const namaS1 = (fd.witness1Name || fd.form_nama_saksi_1 || fd['[form_nama_saksi_1]'] || fd.form_nama_saksi1 || pbS1.nama || w1Res?.fullName || '').toUpperCase();
    const nikS1 = fd.witness1Nik || fd.form_nik_saksi_1 || fd['[form_nik_saksi_1]'] || fd.form_nik_saksi1 || pbS1.nik || w1Res?.nik || '-';
    const tmpLahirS1 = toTitleCaseIndonesian(fd.witness1BirthPlace || fd.form_tempat_lahir_saksi_1 || fd['[form_tempat_lahir_saksi_1]'] || fd.form_tempat_lahir_saksi1 || pbS1.tempat_lahir || pbS1.tempatLahir || w1Res?.placeOfBirth || identity.namaKabupaten);
    const rawTglS1 = fd.witness1BirthDate || fd.form_tanggal_lahir_saksi_1 || fd['[form_tanggal_lahir_saksi_1]'] || fd.form_tanggal_lahir_saksi1 || pbS1.tanggal_lahir || pbS1.tanggalLahir || w1Res?.dateOfBirth || '';
    const normTglS1 = rawTglS1 && rawTglS1 !== '-' ? normalizeDateInput(rawTglS1) : null;
    const tglLahirS1 = normTglS1 ? formatTanggalIndonesia(normTglS1) : '-';
    const agamaS1 = toTitleCaseIndonesian(fd.witness1Religion || fd.form_agama_saksi_1 || fd['[form_agama_saksi_1]'] || fd.form_agama_saksi1 || pbS1.agama || w1Res?.religion || 'Islam');
    const pekerjaanS1 = toTitleCaseIndonesian(fd.witness1Job || fd.form_pekerjaan_saksi_1 || fd['[form_pekerjaan_saksi_1]'] || fd.form_pekerjaan_saksi1 || pbS1.pekerjaan || w1Res?.occupation || 'Wiraswasta');
    const alamatS1 = fd.witness1Address || fd.form_alamat_saksi_1 || fd['[form_alamat_saksi_1]'] || fd.form_alamat_saksi1 || pbS1.alamat || formattedIndividu.alamat;
    const jabatanS1 = fd.witness1Role || fd.form_jabatan_saksi1 || pbS1.hubungan_kk || pbS1.hubungan || 'Saksi I';

    resolvedPelakuBagian.saksi_1 = {
      ...pbS1,
      nik: nikS1,
      nama: namaS1,
      tempat_lahir: tmpLahirS1,
      tanggal_lahir: tglLahirS1,
      agama: agamaS1,
      pekerjaan: pekerjaanS1,
      alamat: alamatS1,
      hubungan_kk: jabatanS1,
    };
    dynamicFormValues.form_nama_saksi_1 = namaS1;
    dynamicFormValues.form_nama_saksi1 = namaS1;
    dynamicFormValues.nama_saksi_1 = namaS1;
    dynamicFormValues.form_nik_saksi_1 = nikS1;
    dynamicFormValues.form_nik_saksi1 = nikS1;
    dynamicFormValues.nik_saksi_1 = nikS1;
    dynamicFormValues.form_tempat_lahir_saksi_1 = tmpLahirS1;
    dynamicFormValues.form_tempat_lahir_saksi1 = tmpLahirS1;
    dynamicFormValues.tempat_lahir_saksi_1 = tmpLahirS1;
    dynamicFormValues.form_tanggal_lahir_saksi_1 = tglLahirS1;
    dynamicFormValues.form_tanggal_lahir_saksi1 = tglLahirS1;
    dynamicFormValues.tanggal_lahir_saksi_1 = tglLahirS1;
    dynamicFormValues.form_agama_saksi_1 = agamaS1;
    dynamicFormValues.form_agama_saksi1 = agamaS1;
    dynamicFormValues.agama_saksi_1 = agamaS1;
    dynamicFormValues.form_pekerjaan_saksi_1 = pekerjaanS1;
    dynamicFormValues.form_pekerjaan_saksi1 = pekerjaanS1;
    dynamicFormValues.pekerjaan_saksi_1 = pekerjaanS1;
    dynamicFormValues.form_alamat_saksi_1 = alamatS1;
    dynamicFormValues.form_alamat_saksi1 = alamatS1;
    dynamicFormValues.alamat_saksi_1 = alamatS1;
    dynamicFormValues.form_jabatan_saksi1 = jabatanS1;

    const w2Nik = fd.witness2Nik || fd.form_nik_saksi_2 || fd.form_nik_saksi2 || resolvedPelakuBagian.saksi_2?.nik;
    const w2Res = (w2Nik && residentMap[w2Nik]) ? residentMap[w2Nik] : null;
    const pbS2 = (resolvedPelakuBagian.saksi_2 || {}) as any;
    const namaS2 = (fd.witness2Name || fd.form_nama_saksi_2 || fd['[form_nama_saksi_2]'] || fd.form_nama_saksi2 || pbS2.nama || w2Res?.fullName || '').toUpperCase();
    const nikS2 = fd.witness2Nik || fd.form_nik_saksi_2 || fd['[form_nik_saksi_2]'] || fd.form_nik_saksi2 || pbS2.nik || w2Res?.nik || '-';
    const tmpLahirS2 = toTitleCaseIndonesian(fd.witness2BirthPlace || fd.form_tempat_lahir_saksi_2 || fd['[form_tempat_lahir_saksi_2]'] || fd.form_tempat_lahir_saksi2 || pbS2.tempat_lahir || pbS2.tempatLahir || w2Res?.placeOfBirth || identity.namaKabupaten);
    const rawTglS2 = fd.witness2BirthDate || fd.form_tanggal_lahir_saksi_2 || fd['[form_tanggal_lahir_saksi_2]'] || fd.form_tanggal_lahir_saksi2 || pbS2.tanggal_lahir || pbS2.tanggalLahir || w2Res?.dateOfBirth || '';
    const normTglS2 = rawTglS2 && rawTglS2 !== '-' ? normalizeDateInput(rawTglS2) : null;
    const tglLahirS2 = normTglS2 ? formatTanggalIndonesia(normTglS2) : '-';
    const agamaS2 = toTitleCaseIndonesian(fd.witness2Religion || fd.form_agama_saksi_2 || fd['[form_agama_saksi_2]'] || fd.form_agama_saksi2 || pbS2.agama || w2Res?.religion || 'Islam');
    const pekerjaanS2 = toTitleCaseIndonesian(fd.witness2Job || fd.form_pekerjaan_saksi_2 || fd['[form_pekerjaan_saksi_2]'] || fd.form_pekerjaan_saksi2 || pbS2.pekerjaan || w2Res?.occupation || 'Wiraswasta');
    const alamatS2 = fd.witness2Address || fd.form_alamat_saksi_2 || fd['[form_alamat_saksi_2]'] || fd.form_alamat_saksi2 || pbS2.alamat || formattedIndividu.alamat;
    const jabatanS2 = fd.witness2Role || fd.form_jabatan_saksi2 || pbS2.hubungan_kk || pbS2.hubungan || 'Saksi II';

    resolvedPelakuBagian.saksi_2 = {
      ...pbS2,
      nik: nikS2,
      nama: namaS2,
      tempat_lahir: tmpLahirS2,
      tanggal_lahir: tglLahirS2,
      agama: agamaS2,
      pekerjaan: pekerjaanS2,
      alamat: alamatS2,
      hubungan_kk: jabatanS2,
    };
    dynamicFormValues.form_nama_saksi_2 = namaS2;
    dynamicFormValues.form_nama_saksi2 = namaS2;
    dynamicFormValues.nama_saksi_2 = namaS2;
    dynamicFormValues.form_nik_saksi_2 = nikS2;
    dynamicFormValues.form_nik_saksi2 = nikS2;
    dynamicFormValues.nik_saksi_2 = nikS2;
    dynamicFormValues.form_tempat_lahir_saksi_2 = tmpLahirS2;
    dynamicFormValues.form_tempat_lahir_saksi2 = tmpLahirS2;
    dynamicFormValues.tempat_lahir_saksi_2 = tmpLahirS2;
    dynamicFormValues.form_tanggal_lahir_saksi_2 = tglLahirS2;
    dynamicFormValues.form_tanggal_lahir_saksi2 = tglLahirS2;
    dynamicFormValues.tanggal_lahir_saksi_2 = tglLahirS2;
    dynamicFormValues.form_agama_saksi_2 = agamaS2;
    dynamicFormValues.form_agama_saksi2 = agamaS2;
    dynamicFormValues.agama_saksi_2 = agamaS2;
    dynamicFormValues.form_pekerjaan_saksi_2 = pekerjaanS2;
    dynamicFormValues.form_pekerjaan_saksi2 = pekerjaanS2;
    dynamicFormValues.pekerjaan_saksi_2 = pekerjaanS2;
    dynamicFormValues.form_alamat_saksi_2 = alamatS2;
    dynamicFormValues.form_alamat_saksi2 = alamatS2;
    dynamicFormValues.alamat_saksi_2 = alamatS2;
    dynamicFormValues.form_jabatan_saksi2 = jabatanS2;

    const isWaliHakim =
      (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('wali hakim') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('wali-hakim') ||
      matchedMaster.kodeSurat?.toLowerCase() === 's-32';

    const isBelumMenikah =
      (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('belum pernah menikah') ||
      (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('belum menikah') ||
      (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('belum kawin') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('belum-menikah') ||
      matchedMaster.kodeSurat?.toLowerCase() === 's-18' ||
      matchedMaster.kodeSurat?.toLowerCase() === '470';

    if (isWaliHakim || isBelumMenikah) {
      const isPemohonWanita = (formattedIndividu.jenis_kelamin || '').toLowerCase().includes('perempuan');

      // Calon Mempelai Wanita
      const namaIstri = (
        fd.form_nama_calon_istri ||
        (isPemohonWanita ? formattedIndividu.nama : (fd.groomName ? fd.name : (fd.spouseName || fd.form_nama_calon_pasangan || '-')))
      ).toUpperCase();
      const rawTglIstri = isPemohonWanita ? formattedIndividu.tanggal_lahir : (fd.spouseBirthDate || fd.form_tanggal_lahir_pasangan);
      const tglIstriFmt = rawTglIstri ? (normalizeDateInput(rawTglIstri) ? formatTanggalIndonesia(normalizeDateInput(rawTglIstri)!) : rawTglIstri) : '';
      const tmpIstri = (isPemohonWanita ? (formattedIndividu.tempat_lahir || '') : (fd.spouseBirthPlace || fd.form_tempat_lahir_pasangan || '')).toUpperCase();
      const ttlIstri = fd.form_ttl_calon_istri || `${tmpIstri} ${tglIstriFmt}`.trim() || '-';
      const agamaIstri = toTitleCaseIndonesian(fd.form_agama_calon_istri || (isPemohonWanita ? (formattedIndividu.agama || 'Islam') : (fd.spouseReligion || 'Islam')));
      const alamatIstri = fd.form_alamat_calon_istri || (isPemohonWanita ? formattedIndividu.alamat : (fd.spouseAddress || '-'));

      dynamicFormValues.form_nama_calon_istri = namaIstri;
      dynamicFormValues.nama_calon_istri = namaIstri;
      dynamicFormValues.form_ttl_calon_istri = ttlIstri;
      dynamicFormValues.ttl_calon_istri = ttlIstri;
      dynamicFormValues.form_agama_calon_istri = agamaIstri;
      dynamicFormValues.agama_calon_istri = agamaIstri;
      dynamicFormValues.form_alamat_calon_istri = alamatIstri;
      dynamicFormValues.alamat_calon_istri = alamatIstri;

      // Calon Mempelai Pria (Calon Suami)
      const namaSuami = (
        fd.form_nama_calon_suami ||
        fd.groomName ||
        (!isPemohonWanita ? formattedIndividu.nama : (fd.spouseName || fd.form_nama_calon_pasangan || '-'))
      ).toUpperCase();
      const rawTglSuami = !isPemohonWanita ? formattedIndividu.tanggal_lahir : (fd.groomBirthDate || fd.spouseBirthDate || fd.form_tanggal_lahir_calon_suami);
      const tglSuamiFmt = rawTglSuami ? (normalizeDateInput(rawTglSuami) ? formatTanggalIndonesia(normalizeDateInput(rawTglSuami)!) : rawTglSuami) : '';
      const tmpSuami = (!isPemohonWanita ? (formattedIndividu.tempat_lahir || '') : (fd.groomBirthPlace || fd.spouseBirthPlace || fd.form_tempat_lahir_calon_suami || '')).toUpperCase();
      const ttlSuami = fd.form_ttl_calon_suami || `${tmpSuami} ${tglSuamiFmt}`.trim() || '-';
      const agamaSuami = toTitleCaseIndonesian(fd.form_agama_calon_suami || fd.groomReligion || fd.spouseReligion || (!isPemohonWanita ? formattedIndividu.agama : 'Islam') || 'Islam');
      const alamatSuami = fd.form_alamat_calon_suami || fd.groomAddress || fd.spouseAddress || (!isPemohonWanita ? formattedIndividu.alamat : '-');

      dynamicFormValues.form_nama_calon_suami = namaSuami;
      dynamicFormValues.nama_calon_suami = namaSuami;
      dynamicFormValues.form_ttl_calon_suami = ttlSuami;
      dynamicFormValues.ttl_calon_suami = ttlSuami;
      dynamicFormValues.form_agama_calon_suami = agamaSuami;
      dynamicFormValues.agama_calon_suami = agamaSuami;
      dynamicFormValues.form_alamat_calon_suami = alamatSuami;
      dynamicFormValues.alamat_calon_suami = alamatSuami;

      // Keterangan Wali Hakim
      const keteranganWali =
        fd.form_keterangan_wali_hakim ||
        fd.form_alasan_wali_hakim ||
        fd.waliReason ||
        'susunan wali, Nikah untuk mempelai wanita sudah habis barisan wali/Tidak ada, maka untuk melangsungkan pernikahannya dengan memakai WALI HAKIM.';
      dynamicFormValues.form_keterangan_wali_hakim = keteranganWali;
      dynamicFormValues.keterangan_wali_hakim = keteranganWali;
    }

    const isDuplikatNikahLetter =
      (submission.letterType || '').toLowerCase().includes('duplikat surat nikah') ||
      (submission.letterType || '').toLowerCase().includes('duplikat buku nikah') ||
      (submission.letterType || '').toLowerCase().includes('duplikat nikah') ||
      (submission as any).urlSurat?.toLowerCase().includes('duplikat-surat-nikah') ||
      (submission as any).urlSurat?.toLowerCase().includes('duplikat-nikah') ||
      matchedMaster.kodeSurat?.toLowerCase() === 's-33' ||
      matchedMaster.id === 'prm-24';

    if (isDuplikatNikahLetter) {
      const suamiNama = fd.form_nama_calon_suami || fd.suamiNama || fd.husbandName || fd.groomName || fd.name || '';
      const suamiTtl = fd.form_ttl_calon_suami || (fd.suamiTempatLahir ? `${fd.suamiTempatLahir}, ${fd.suamiTanggalLahir || ''}` : '') || (fd.husbandBirthPlace ? `${fd.husbandBirthPlace}, ${fd.husbandBirthDate || ''}` : '') || (fd.birthPlace ? `${fd.birthPlace}, ${fd.birthDate || ''}` : '');
      const suamiAgama = fd.form_agama_calon_suami || fd.suamiAgama || fd.husbandReligion || fd.religion || 'Islam';
      const suamiPekerjaan = fd.form_pekerjaan_calon_suami || fd.suamiPekerjaan || fd.husbandJob || fd.job || '-';
      const suamiAlamat = fd.form_alamat_calon_suami || fd.suamiAlamat || fd.husbandAddress || fd.address || '';

      const istriNama = fd.form_nama_calon_istri || fd.istriNama || fd.wifeName || fd.brideName || fd.spouseName || '';
      const istriTtl = fd.form_ttl_calon_istri || (fd.istriTempatLahir ? `${fd.istriTempatLahir}, ${fd.istriTanggalLahir || ''}` : '') || (fd.wifeBirthPlace ? `${fd.wifeBirthPlace}, ${fd.wifeBirthDate || ''}` : '') || (fd.spouseBirthPlace ? `${fd.spouseBirthPlace}, ${fd.spouseBirthDate || ''}` : '');
      const istriAgama = fd.form_agama_calon_istri || fd.istriAgama || fd.wifeReligion || fd.spouseReligion || 'Islam';
      const istriPekerjaan = fd.form_pekerjaan_calon_istri || fd.istriPekerjaan || fd.wifeJob || fd.spouseJob || '-';
      const istriAlamat = fd.form_alamat_calon_istri || fd.istriAlamat || fd.wifeAddress || fd.spouseAddress || '';

      dynamicFormValues.form_nama_calon_suami = suamiNama;
      dynamicFormValues.form_ttl_calon_suami = suamiTtl;
      dynamicFormValues.form_agama_calon_suami = suamiAgama;
      dynamicFormValues.form_pekerjaan_calon_suami = suamiPekerjaan;
      dynamicFormValues.form_alamat_calon_suami = suamiAlamat;

      dynamicFormValues.form_nama_calon_istri = istriNama;
      dynamicFormValues.form_ttl_calon_istri = istriTtl;
      dynamicFormValues.form_agama_calon_istri = istriAgama;
      dynamicFormValues.form_pekerjaan_calon_istri = istriPekerjaan;
      dynamicFormValues.form_alamat_calon_istri = istriAlamat;

      dynamicFormValues.form_hari_tanggal_nikah = fd.form_hari_tanggal_nikah || fd.hariTanggalNikah || fd.weddingDate || fd.tgl_kawin || '-';
      dynamicFormValues.form_tempat_akad_nikah = fd.form_tempat_akad_nikah || fd.tempatAkadNikah || fd.weddingPlace || '-';
      dynamicFormValues.form_kua_tempat_nikah = fd.form_kua_tempat_nikah || fd.kuaTempatNikah || fd.kuaName || fd.form_kua_tujuan || identity.namaKecamatan;
      dynamicFormValues.form_no_akta_nikah = fd.form_no_akta_nikah || fd.noAktaNikah || fd.marriageBookNumber || fd.no_akta_kawin || '-';
      dynamicFormValues.form_status_buku_nikah = fd.form_status_buku_nikah || fd.statusBukuNikah || fd.condition || 'Hilang';
    }

    const isNikahNonMuslimLetter =
      (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('non-muslim') ||
      (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('non muslim') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('nikah-warga-non-muslim') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('nikah-non-muslim') ||
      matchedMaster.kodeSurat?.toLowerCase() === 's-50' ||
      matchedMaster.id === 'prm-32';

    if (isNikahNonMuslimLetter) {
      const isPemohonPria = (formattedIndividu.jenis_kelamin || '').toLowerCase().includes('laki');
      const namaSuami = isPemohonPria
        ? formattedIndividu.nama
        : (fd.form_nama_calon_suami || fd.form_nama_pasangan || fd.spouseName || fd.name || '');
      const nikSuami = isPemohonPria
        ? formattedIndividu.nik
        : (fd.form_nik_calon_suami || fd.form_nik_pasangan || fd.spouseNik || '-');
      const kkSuami = isPemohonPria
        ? (formattedIndividu.no_kk || '-')
        : (fd.form_no_kk_calon_suami || fd.form_no_kk_pasangan || '-');
      const ttlSuami = isPemohonPria
        ? (formattedIndividu.tempat_lahir && formattedIndividu.tanggal_lahir ? `${toTitleCaseIndonesian(formattedIndividu.tempat_lahir)}, ${formattedIndividu.tanggal_lahir}` : '-')
        : (fd.form_ttl_calon_suami || (fd.spouseBirthPlace && fd.spouseBirthDate ? `${fd.spouseBirthPlace}, ${fd.spouseBirthDate}` : '-'));
      const agamaSuami = isPemohonPria
        ? formattedIndividu.agama
        : (fd.form_agama_calon_suami || fd.form_agama_pasangan || fd.spouseReligion || 'Kristen');
      const pekerjaanSuami = isPemohonPria
        ? formattedIndividu.pekerjaan
        : (fd.form_pekerjaan_calon_suami || fd.form_pekerjaan_pasangan || fd.spouseJob || '-');
      const alamatSuami = isPemohonPria
        ? formattedIndividu.alamat
        : (fd.form_alamat_calon_suami || fd.form_alamat_pasangan || fd.spouseAddress || '-');

      const namaIstri = isPemohonPria
        ? (fd.form_nama_calon_istri || fd.form_nama_cpw || fd.form_nama_pasangan || fd.form_nama_calon_pasangan || fd.spouseName || '')
        : formattedIndividu.nama;
      const nikIstri = isPemohonPria
        ? (fd.form_nik_calon_istri || fd.form_nik_cpw || fd.form_nik_pasangan || fd.spouseNik || '-')
        : (formattedIndividu.nik || '-');
      const kkIstri = isPemohonPria
        ? (fd.form_no_kk_calon_istri || fd.form_no_kk_cpw || fd.form_no_kk_pasangan || '-')
        : (formattedIndividu.no_kk || '-');
      const ttlIstri = isPemohonPria
        ? (fd.form_ttl_calon_istri || fd.form_ttl_cpw || (fd.spouseBirthPlace && fd.spouseBirthDate ? `${fd.spouseBirthPlace}, ${fd.spouseBirthDate}` : '-'))
        : (formattedIndividu.tempat_lahir && formattedIndividu.tanggal_lahir ? `${toTitleCaseIndonesian(formattedIndividu.tempat_lahir)}, ${formattedIndividu.tanggal_lahir}` : '-');
      const agamaIstri = isPemohonPria
        ? (fd.form_agama_calon_istri || fd.form_agama_cpw || fd.form_agama_pasangan || fd.spouseReligion || 'Kristen')
        : (formattedIndividu.agama || 'Kristen');
      const pekerjaanIstri = isPemohonPria
        ? (fd.form_pekerjaan_calon_istri || fd.form_pekerjaan_cpw || fd.form_pekerjaan_pasangan || fd.spouseJob || '-')
        : (formattedIndividu.pekerjaan || '-');
      const alamatIstri = isPemohonPria
        ? (fd.form_alamat_calon_istri || fd.form_alamat_cpw || fd.form_alamat_pasangan || fd.spouseAddress || '-')
        : (formattedIndividu.alamat || '-');

      dynamicFormValues.nama = toTitleCaseIndonesian(namaSuami);
      dynamicFormValues.nik = nikSuami;
      dynamicFormValues.no_kk = kkSuami;
      dynamicFormValues.ttl = ttlSuami;
      dynamicFormValues.agama = toTitleCaseIndonesian(agamaSuami);
      dynamicFormValues.pekerjaan = pekerjaanSuami;
      dynamicFormValues.alamat_lengkap = alamatSuami;

      dynamicFormValues.nama_cpw = toTitleCaseIndonesian(namaIstri);
      dynamicFormValues.form_nama_cpw = toTitleCaseIndonesian(namaIstri);
      dynamicFormValues.nik_cpw = nikIstri;
      dynamicFormValues.form_nik_cpw = nikIstri;
      dynamicFormValues.no_kk_cpw = kkIstri;
      dynamicFormValues.form_no_kk_cpw = kkIstri;
      dynamicFormValues.ttl_cpw = ttlIstri;
      dynamicFormValues.form_ttl_cpw = ttlIstri;
      dynamicFormValues.jenis_kelamin_cpw = 'Perempuan';
      dynamicFormValues.warga_negara_cpw = 'WNI';
      dynamicFormValues.agama_cpw = toTitleCaseIndonesian(agamaIstri);
      dynamicFormValues.pekerjaan_cpw = toTitleCaseIndonesian(pekerjaanIstri);
      dynamicFormValues.alamat_cpw = alamatIstri;

      const tempatGereja = fd.form_nama_badan_peradilan_kawin || fd.tempatPerkawinan || fd.churchName || fd.form_tempat_perkawinan || '-';
      dynamicFormValues.form_nama_badan_peradilan_kawin = tempatGereja;
      dynamicFormValues.nama_badan_peradilan_kawin = tempatGereja;

      const rawTglPemberkatan = fd.form_tanggal_putusan_penetapan_pengadilan_kawin || fd.tanggalPemberkatan || fd.form_tanggal_nikah || '';
      const normTglPemberkatan = rawTglPemberkatan ? (normalizeDateInput(rawTglPemberkatan) ? formatTanggalIndonesia(normalizeDateInput(rawTglPemberkatan)!) : rawTglPemberkatan) : '-';
      dynamicFormValues.form_tanggal_putusan_penetapan_pengadilan_kawin = normTglPemberkatan;
      dynamicFormValues.tanggal_putusan_penetapan_pengadilan_kawin = normTglPemberkatan;

      const pemukaAgama = fd.form_nama_pemuka_agama || fd.namaPemukaAgama || fd.priestName || '-';
      dynamicFormValues.form_nama_pemuka_agama = pemukaAgama;
      dynamicFormValues.nama_pemuka_agama = pemukaAgama;

      const noSuratPemberkatan = fd.form_no_surat_pemberkatan || fd.noSuratPemberkatan || '-';
      dynamicFormValues.form_no_surat_pemberkatan = noSuratPemberkatan;
      dynamicFormValues.no_surat_pemberkatan = noSuratPemberkatan;
    }

    const isCeraiRujukLetter =
      submission.letterType?.toLowerCase().includes('cerai') ||
      submission.letterType?.toLowerCase().includes('rujuk') ||
      ((submission as any).urlSurat || matchedMaster.urlSurat || '').toLowerCase().includes('cerai') ||
      ((submission as any).urlSurat || matchedMaster.urlSurat || '').toLowerCase().includes('rujuk') ||
      ((submission as any).kodeSurat || matchedMaster.kodeSurat || '').toLowerCase() === 's-35' ||
      ((submission as any).kodeSurat || matchedMaster.kodeSurat || '').toLowerCase() === 's-34' ||
      matchedMaster.id === 'prm-28' ||
      matchedMaster.id === 'prm-16';

    if (isCeraiRujukLetter) {
      const isPemohonPria = (formattedIndividu.jenis_kelamin || '').toLowerCase().includes('laki');
      dynamicFormValues.label_bin_pemohon = isPemohonPria ? 'Bin' : 'Binti';
      dynamicFormValues.label_bin_pasangan = isPemohonPria ? 'Binti' : 'Bin';

      const pbPasangan = resolvedPelakuBagian.pasangan;
      const namaPasangan =
        fd['[form_nama_pasangan]'] ||
        fd.form_nama_pasangan ||
        fd.spouseName ||
        fd.nama_pasangan ||
        pbPasangan?.nama ||
        '-';
      const ayahPasangan =
        fd['[form_nama_ayah_pasangan]'] ||
        fd.form_nama_ayah_pasangan ||
        fd.nama_ayah_pasangan ||
        pbPasangan?.nama_ayah ||
        fd.form_bin_calon_pasangan ||
        '-';
      const tmpPasangan =
        fd['[form_tempatlahir_pasangan]'] ||
        fd.form_tempatlahir_pasangan ||
        fd.form_tempat_lahir_pasangan ||
        pbPasangan?.tempat_lahir ||
        '';
      const rawTglPasangan =
        fd['[form_tanggallahir_pasangan]'] ||
        fd.form_tanggallahir_pasangan ||
        fd.form_tanggal_lahir_pasangan ||
        pbPasangan?.tanggal_lahir ||
        '';
      const tglPasanganFmt = rawTglPasangan
        ? (normalizeDateInput(rawTglPasangan) ? formatTanggalIndonesia(normalizeDateInput(rawTglPasangan)!) : rawTglPasangan)
        : '';
      const ttlPasangan = (tmpPasangan && tglPasanganFmt)
        ? `${tmpPasangan}, ${tglPasanganFmt}`
        : (tmpPasangan || tglPasanganFmt || '-');

      const wnPasangan =
        fd['[form_wn_pasangan]'] ||
        fd.form_wn_pasangan ||
        fd.form_warga_negara_pasangan ||
        pbPasangan?.warga_negara ||
        'WNI';
      const agamaPasangan =
        fd['[form_agama_pasangan]'] ||
        fd.form_agama_pasangan ||
        pbPasangan?.agama ||
        'Islam';
      const pekerjaanPasangan =
        fd['[form_pekerjaan_pasangan]'] ||
        fd.form_pekerjaan_pasangan ||
        pbPasangan?.pekerjaan ||
        '-';
      const alamatPasangan =
        fd['[form_alamat_pasangan]'] ||
        fd.form_alamat_pasangan ||
        pbPasangan?.alamat ||
        '-';

      dynamicFormValues.form_nama_pasangan = namaPasangan;
      dynamicFormValues.nama_pasangan = namaPasangan;
      dynamicFormValues.form_nama_ayah_pasangan = ayahPasangan;
      dynamicFormValues.nama_ayah_pasangan = ayahPasangan;
      dynamicFormValues.form_tempatlahir_pasangan = tmpPasangan;
      dynamicFormValues.form_tanggallahir_pasangan = tglPasanganFmt;
      dynamicFormValues.form_tempatdan_tgllahir_pasangan = ttlPasangan;
      dynamicFormValues.form_wn_pasangan = wnPasangan;
      dynamicFormValues.form_agama_pasangan = agamaPasangan;
      dynamicFormValues.form_pekerjaan_pasangan = pekerjaanPasangan;
      dynamicFormValues.form_alamat_pasangan = alamatPasangan;
    }

    const isSporadikLetter =
      (submission.letterType || '').toLowerCase().includes('sporadik') ||
      (submission.letterType || '').toLowerCase().includes('penguasaan fisik bidang tanah') ||
      ((submission as any).urlSurat || matchedMaster.urlSurat || '').toLowerCase().includes('sporadik') ||
      ((submission as any).kodeSurat || matchedMaster.kodeSurat || '').toLowerCase() === 's-40' ||
      matchedMaster.id === 'prm-37';

    if (isSporadikLetter) {
      // 1. Data Pemohon
      const pemohonNama = formattedIndividu.nama || '-';
      const pemohonTempat = formattedIndividu.tempat_lahir || identity.namaKabupaten || '-';
      const rawPemohonTgl = formattedIndividu.tanggal_lahir || '';
      const pemohonTglFmt = rawPemohonTgl ? (normalizeDateInput(rawPemohonTgl) ? formatTanggalIndonesia(normalizeDateInput(rawPemohonTgl)!) : rawPemohonTgl) : '-';
      const rawUmur = (formattedIndividu as any).usia || (formattedIndividu as any).umur || (rawPemohonTgl ? formatTTL(pemohonTempat, rawPemohonTgl) : '');
      const pemohonUmur = (formattedIndividu as any).usia || (formattedIndividu as any).umur || '-';
      const pemohonPekerjaan = formattedIndividu.pekerjaan || '-';
      const pemohonNik = formattedIndividu.nik || '-';
      const pemohonAlamat = formattedIndividu.alamat || '-';

      dynamicFormValues.nama_non_warga = pemohonNama;
      dynamicFormValues.tempatlahir_pemohon = pemohonTempat;
      dynamicFormValues.tanggallahir_pemohon = pemohonTglFmt;
      dynamicFormValues.umur_pemohon = String(pemohonUmur).includes('Tahun') ? String(pemohonUmur) : `${pemohonUmur} Tahun`;
      dynamicFormValues.pekerjaan_pemohon = pemohonPekerjaan;
      dynamicFormValues.nik_non_warga = pemohonNik;
      dynamicFormValues.alamat_pemohon = pemohonAlamat;

      // 2. Data Letak Tanah
      const jalan = fd['[form_jalan]'] || fd.form_jalan || fd.jalan || fd.lokasiTanah || '-';
      const rtrw = fd['[form_rt_rw]'] || fd.form_rt_rw || fd.rtrw || fd.rtRw || '-';
      const desalurah = fd['[form_desa_kelurahan]'] || fd.form_desa_kelurahan || fd.desalurah || identity.namaDesa;
      const camatt = fd['[form_kecamatan]'] || fd.form_kecamatan || fd.camatt || identity.namaKecamatan;
      const kabb = fd['[form_kabupaten_kota]'] || fd.form_kabupaten_kota || fd.kabb || identity.namaKabupaten;
      const nib = fd['[form_nib]'] || fd.form_nib || fd.nib || '-';
      const statustanah = fd['[form_status_tanah]'] || fd.form_status_tanah || fd.statustanah || 'Hak Milik Adat';
      const tanahuntuk = fd['[form_dipergunakan]'] || fd.form_dipergunakan || fd.tanahuntuk || 'Perumahan / Pekarangan';
      const luashak = fd['[form_luas_tanah_m2]'] || fd.form_luas_tanah_m2 || fd.luashak || '0';

      dynamicFormValues.form_jalan = jalan;
      dynamicFormValues.jalan = jalan;
      dynamicFormValues.form_rt_rw = rtrw;
      dynamicFormValues.rtrw = rtrw;
      dynamicFormValues.form_desa_kelurahan = desalurah;
      dynamicFormValues.desalurah = desalurah;
      dynamicFormValues.form_kecamatan = camatt;
      dynamicFormValues.camatt = camatt;
      dynamicFormValues.form_kabupaten_kota = kabb;
      dynamicFormValues.kabb = kabb;
      dynamicFormValues.form_nib = nib;
      dynamicFormValues.nib = nib;
      dynamicFormValues.form_status_tanah = statustanah;
      dynamicFormValues.statustanah = statustanah;
      dynamicFormValues.form_dipergunakan = tanahuntuk;
      dynamicFormValues.tanahuntuk = tanahuntuk;
      dynamicFormValues.form_luas_tanah_m2 = luashak;
      dynamicFormValues.luashak = luashak;

      // 3. Batas-Batas
      const utara = fd['[form_batas_sebelah_utara]'] || fd.form_batas_sebelah_utara || fd.utara || '-';
      const timur = fd['[form_batas_sebelah_timur]'] || fd.form_batas_sebelah_timur || fd.timur || '-';
      const selatan = fd['[form_batas_sebelah_selatan]'] || fd.form_batas_sebelah_selatan || fd.selatan || '-';
      const barat = fd['[form_batas_sebelah_barat]'] || fd.form_batas_sebelah_barat || fd.barat || '-';

      dynamicFormValues.form_batas_sebelah_utara = utara;
      dynamicFormValues.utara = utara;
      dynamicFormValues.form_batas_sebelah_timur = timur;
      dynamicFormValues.timur = timur;
      dynamicFormValues.form_batas_sebelah_selatan = selatan;
      dynamicFormValues.selatan = selatan;
      dynamicFormValues.form_batas_sebelah_barat = barat;
      dynamicFormValues.barat = barat;

      // 4. Riwayat Perolehan
      const peroleh = fd['[form_tanah_diperoleh_dari_]'] || fd.form_tanah_diperoleh_dari_ || fd.peroleh || '-';
      const perolehtahun = fd['[form_diperoleh_sejak_tahun]'] || fd.form_diperoleh_sejak_tahun || fd.perolehtahun || '-';
      const denganjalan = fd['[form_dengan_jalan]'] || fd.form_dengan_jalan || fd.denganjalan || 'Jual Beli / Warisan';

      dynamicFormValues.form_tanah_diperoleh_dari_ = peroleh;
      dynamicFormValues.peroleh = peroleh;
      dynamicFormValues.form_diperoleh_sejak_tahun = perolehtahun;
      dynamicFormValues.perolehtahun = perolehtahun;
      dynamicFormValues.form_dengan_jalan = denganjalan;
      dynamicFormValues.denganjalan = denganjalan;

      // 5. Saksi-Saksi
      const pbSaksi1 = resolvedPelakuBagian.saksi_1 || resolvedPelakuBagian.saksi_i || {};
      const saksi1Nama = fd['[form_nama_saksi_1]'] || fd.form_nama_saksi_1 || fd.namasaksii || fd.nama_saksi_1 || pbSaksi1.nama || '-';
      const saksi1Umur = fd['[form_umur_saksi_1]'] || fd.form_umur_saksi_1 || fd.umursaksii || fd.usia_saksi_1 || ((pbSaksi1 as any).usia ? `${(pbSaksi1 as any).usia}` : '-');
      const saksi1Kerja = fd['[form_pekerjaan_saksi_1]'] || fd.form_pekerjaan_saksi_1 || fd.pekerjaansaksii || fd.pekerjaan_saksi_1 || pbSaksi1.pekerjaan || '-';
      const saksi1Alamat = fd['[form_alamat_saksi_1]'] || fd.form_alamat_saksi_1 || fd.alamatsaksii || fd.alamat_saksi_1 || pbSaksi1.alamat || '-';

      dynamicFormValues.form_nama_saksi_1 = saksi1Nama;
      dynamicFormValues.namasaksii = saksi1Nama;
      dynamicFormValues.nama_saksi_i = saksi1Nama;
      dynamicFormValues.nama_saksi_1 = saksi1Nama;
      dynamicFormValues.form_umur_saksi_1 = String(saksi1Umur).replace(/Tahun/i, '').trim();
      dynamicFormValues.umursaksii = String(saksi1Umur).replace(/Tahun/i, '').trim();
      dynamicFormValues.usia_saksi_i = String(saksi1Umur).replace(/Tahun/i, '').trim();
      dynamicFormValues.form_pekerjaan_saksi_1 = saksi1Kerja;
      dynamicFormValues.pekerjaansaksii = saksi1Kerja;
      dynamicFormValues.pekerjaan_saksi_i = saksi1Kerja;
      dynamicFormValues.form_alamat_saksi_1 = saksi1Alamat;
      dynamicFormValues.alamatsaksii = saksi1Alamat;
      dynamicFormValues.alamat_saksi_i = saksi1Alamat;

      const pbSaksi2 = resolvedPelakuBagian.saksi_2 || resolvedPelakuBagian.saksi_ii || {};
      const saksi2Nama = fd['[form_nama_saksi_2]'] || fd.form_nama_saksi_2 || fd.namasaksiii || fd.nama_saksi_2 || pbSaksi2.nama || '-';
      const saksi2Umur = fd['[form_umur_saksi_2]'] || fd.form_umur_saksi_2 || fd.umursaksiii || fd.usia_saksi_2 || ((pbSaksi2 as any).usia ? `${(pbSaksi2 as any).usia}` : '-');
      const saksi2Kerja = fd['[form_pekerjaan_saksi_2]'] || fd.form_pekerjaan_saksi_2 || fd.pekerjaansaksiii || fd.pekerjaan_saksi_2 || pbSaksi2.pekerjaan || '-';
      const saksi2Alamat = fd['[form_alamat_saksi_2]'] || fd.form_alamat_saksi_2 || fd.alamatsaksiii || fd.alamat_saksi_2 || pbSaksi2.alamat || '-';

      dynamicFormValues.form_nama_saksi_2 = saksi2Nama;
      dynamicFormValues.namasaksiii = saksi2Nama;
      dynamicFormValues.nama_saksi_ii = saksi2Nama;
      dynamicFormValues.nama_saksi_2 = saksi2Nama;
      dynamicFormValues.form_umur_saksi_2 = String(saksi2Umur).replace(/Tahun/i, '').trim();
      dynamicFormValues.umursaksiii = String(saksi2Umur).replace(/Tahun/i, '').trim();
      dynamicFormValues.usia_saksi_ii = String(saksi2Umur).replace(/Tahun/i, '').trim();
      dynamicFormValues.form_pekerjaan_saksi_2 = saksi2Kerja;
      dynamicFormValues.pekerjaansaksiii = saksi2Kerja;
      dynamicFormValues.pekerjaan_saksi_ii = saksi2Kerja;
      dynamicFormValues.form_alamat_saksi_2 = saksi2Alamat;
      dynamicFormValues.alamatsaksiii = saksi2Alamat;
      dynamicFormValues.alamat_saksi_ii = saksi2Alamat;
    }

    const isKepemilikanTanahLetter =
      (submission.letterType || '').toLowerCase().includes('kepemilikan tanah') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('kepemilikan-tanah') ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === 's-49' ||
      matchedMaster?.id === 'prm-25';

    if (isKepemilikanTanahLetter) {
      const jTanah = fd['[form_jenis_tanah]'] || fd.form_jenis_tanah || fd.jenis_tanah || 'Tanah Darat';
      const anTanah = fd['[form_atas_nama_tanah]'] || fd.form_atas_nama_tanah || fd.atas_nama_tanah || formattedIndividu.nama || submission.requesterName || fd.fullName || fd.name || '-';
      const bHak = fd['[form_bukti_kepemilikan_tanah]'] || fd.form_bukti_kepemilikan_tanah || fd.bukti_kepemilikan_tanah || 'Letter C';
      const noHak = fd['[form_nomor_bukti_kepemilikan_tanah]'] || fd.form_nomor_bukti_kepemilikan_tanah || fd.nomor_bukti_kepemilikan_tanah || '-';
      const lTanah = fd['[form_luas_tanah]'] || fd.form_luas_tanah || fd.luas_tanah || fd.form_luas_tanah_m2 || fd.luashak || '-';
      const bUtr = fd['[form_batas_utara_tanah]'] || fd.form_batas_utara_tanah || fd.batas_utara_tanah || fd.form_batas_sebelah_utara || fd.utara || '-';
      const bTmr = fd['[form_batas_timur_tanah]'] || fd.form_batas_timur_tanah || fd.batas_timur_tanah || fd.form_batas_sebelah_timur || fd.timur || '-';
      const bSlt = fd['[form_batas_selatan_tanah]'] || fd.form_batas_selatan_tanah || fd.batas_selatan_tanah || fd.form_batas_sebelah_selatan || fd.selatan || '-';
      const bBrt = fd['[form_batas_barat_tanah]'] || fd.form_batas_barat_tanah || fd.batas_barat_tanah || fd.form_batas_sebelah_barat || fd.barat || '-';
      const asalTnh = fd['[form_asal_kepemilikan_tanah]'] || fd.form_asal_kepemilikan_tanah || fd.asal_kepemilikan_tanah || fd.form_dengan_jalan || 'Jual Beli';
      const bDukung = fd['[form_bukti_pendukung_kepemilikan_tanah]'] || fd.form_bukti_pendukung_kepemilikan_tanah || fd.bukti_pendukung_kepemilikan_tanah || 'Akta Jual Beli';

      dynamicFormValues.form_jenis_tanah = jTanah;
      dynamicFormValues.jenis_tanah = jTanah;
      dynamicFormValues.form_atas_nama_tanah = toTitleCaseIndonesian(anTanah);
      dynamicFormValues.atas_nama_tanah = toTitleCaseIndonesian(anTanah);
      dynamicFormValues.form_bukti_kepemilikan_tanah = bHak;
      dynamicFormValues.bukti_kepemilikan_tanah = bHak;
      dynamicFormValues.form_nomor_bukti_kepemilikan_tanah = noHak;
      dynamicFormValues.nomor_bukti_kepemilikan_tanah = noHak;
      dynamicFormValues.form_luas_tanah = lTanah;
      dynamicFormValues.luas_tanah = lTanah;
      dynamicFormValues.form_batas_utara_tanah = bUtr;
      dynamicFormValues.batas_utara_tanah = bUtr;
      dynamicFormValues.form_batas_timur_tanah = bTmr;
      dynamicFormValues.batas_timur_tanah = bTmr;
      dynamicFormValues.form_batas_selatan_tanah = bSlt;
      dynamicFormValues.batas_selatan_tanah = bSlt;
      dynamicFormValues.form_batas_barat_tanah = bBrt;
      dynamicFormValues.batas_barat_tanah = bBrt;
      dynamicFormValues.form_asal_kepemilikan_tanah = asalTnh;
      dynamicFormValues.asal_kepemilikan_tanah = asalTnh;
      dynamicFormValues.form_bukti_pendukung_kepemilikan_tanah = bDukung;
      dynamicFormValues.bukti_pendukung_kepemilikan_tanah = bDukung;
    }

    const isJualBeliLetter =
      (submission.letterType || '').toLowerCase().includes('jual beli') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('jual-beli') ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === 's-05' ||
      matchedMaster?.id === 'prm-10';

    if (isJualBeliLetter) {
      // 1. Data Penjual (Pihak I)
      const sellerRes = (fd.sellerNik && residentMap[fd.sellerNik]) ? residentMap[fd.sellerNik] : null;
      const namaPenjual = toTitleCaseIndonesian(fd.sellerName || submission.requesterName || sellerRes?.fullName || '-');
      const tmpLahirPenjual = toTitleCaseIndonesian(fd.sellerBirthPlace || sellerRes?.placeOfBirth || identity.namaKabupaten);
      const rawTglPenjual = fd.sellerBirthDate || sellerRes?.dateOfBirth || '';
      const normTglPenjual = rawTglPenjual && rawTglPenjual !== '-' ? normalizeDateInput(rawTglPenjual) : null;
      const tglLahirPenjual = normTglPenjual ? formatTanggalIndonesia(normTglPenjual) : (rawTglPenjual || '-');
      const ttlPenjual = (tmpLahirPenjual && tglLahirPenjual !== '-') ? `${tmpLahirPenjual}, ${tglLahirPenjual}` : (tmpLahirPenjual || tglLahirPenjual || '-');
      const kerjaPenjual = toTitleCaseIndonesian(fd.sellerJob || sellerRes?.occupation || 'Petani / Wiraswasta');
      const nikPenjual = fd.sellerNik || submission.nik || sellerRes?.nik || '-';
      const desaPenjual = toTitleCaseIndonesian(fd.sellerDesa || sellerRes?.dusun || identity.namaDesa);
      const rtPenjual = fd.sellerRt || sellerRes?.rt || '001';
      const rwPenjual = fd.sellerRw || sellerRes?.rw || '001';
      const kecPenjual = toTitleCaseIndonesian(fd.sellerKecamatan || identity.namaKecamatan);
      const kabPenjual = toTitleCaseIndonesian(fd.sellerKabupaten || identity.namaKabupaten);

      dynamicFormValues.nama_penjual = namaPenjual;
      dynamicFormValues.ttl_penjual = ttlPenjual;
      dynamicFormValues.pekerjaan_penjual = kerjaPenjual;
      dynamicFormValues.nik_penjual = nikPenjual;
      dynamicFormValues.desa_penjual = desaPenjual;
      dynamicFormValues.rt_penjual = rtPenjual;
      dynamicFormValues.rw_penjual = rwPenjual;
      dynamicFormValues.kecamatan_penjual = kecPenjual;
      dynamicFormValues.kabupaten_penjual = kabPenjual;

      // 2. Data Pembeli (Pihak II)
      const pbPembeli = (resolvedPelakuBagian.pembeli || {}) as any;
      const buyerRes = (fd.buyerNik && residentMap[fd.buyerNik]) ? residentMap[fd.buyerNik] : null;

      const namaPembeli = toTitleCaseIndonesian(fd['[nama_pembeli]'] || fd.nama_pembeli || fd.form_nama_pembeli || fd.buyerName || pbPembeli.nama || buyerRes?.fullName || '-');
      const nikPembeli = fd['[nik_pembeli]'] || fd.nik_pembeli || fd.form_nik_pembeli || fd.buyerNik || pbPembeli.nik || buyerRes?.nik || '-';
      const tmpLahirPembeli = toTitleCaseIndonesian(fd['[tempatlahir_pembeli]'] || fd.tempatlahir_pembeli || fd.form_tempat_lahir_pembeli || fd.buyerBirthPlace || pbPembeli.tempat_lahir || buyerRes?.placeOfBirth || identity.namaKabupaten);

      const rawTglPembeli = fd['[tanggallahir_pembeli]'] || fd.tanggallahir_pembeli || fd.form_tanggal_lahir_pembeli || fd.buyerBirthDate || pbPembeli.tanggal_lahir || buyerRes?.dateOfBirth || '';
      const normTglPembeli = rawTglPembeli && rawTglPembeli !== '-' ? normalizeDateInput(rawTglPembeli) : null;
      const tglLahirPembeli = normTglPembeli ? formatTanggalIndonesia(normTglPembeli) : (rawTglPembeli || '-');
      const ttlPembeli = (tmpLahirPembeli && tglLahirPembeli !== '-') ? `${tmpLahirPembeli}, ${tglLahirPembeli}` : (tmpLahirPembeli || tglLahirPembeli || '-');

      const rawJkPembeli = fd['[jenis_kelamin_pembeli]'] || fd.jenis_kelamin_pembeli || fd.form_jenis_kelamin_pembeli || fd.buyerGender || pbPembeli.jenis_kelamin || buyerRes?.gender || 'Laki-Laki';
      const jkPembeli = String(rawJkPembeli).toLowerCase().includes('perempuan') || String(rawJkPembeli).toLowerCase() === 'p' ? 'Perempuan' : 'Laki-Laki';

      const kerjaPembeli = toTitleCaseIndonesian(fd['[pekerjaan_pembeli]'] || fd.pekerjaan_pembeli || fd.form_pekerjaan_pembeli || fd.buyerJob || pbPembeli.pekerjaan || buyerRes?.occupation || 'Wiraswasta');

      const desaPembeli = toTitleCaseIndonesian(fd.buyerDesa || buyerRes?.dusun || identity.namaDesa);
      const rtPembeli = fd.buyerRt || buyerRes?.rt || '001';
      const rwPembeli = fd.buyerRw || buyerRes?.rw || '001';
      const kecPembeli = toTitleCaseIndonesian(fd.buyerKecamatan || identity.namaKecamatan);
      const kabPembeli = toTitleCaseIndonesian(fd.buyerKabupaten || identity.namaKabupaten);
      const alamatPembeli = fd['[alamat_pembeli]'] || fd.alamat_pembeli || fd.form_alamat_pembeli || fd.buyerAddress || pbPembeli.alamat || `Desa ${desaPembeli}, RT ${rtPembeli} / RW ${rwPembeli}, Kecamatan ${kecPembeli}, Kabupaten ${kabPembeli}`;

      resolvedPelakuBagian.pembeli = {
        ...pbPembeli,
        nama: namaPembeli,
        nik: nikPembeli,
        tempat_lahir: tmpLahirPembeli,
        tanggal_lahir: tglLahirPembeli,
        jenis_kelamin: jkPembeli,
        pekerjaan: kerjaPembeli,
        alamat: alamatPembeli,
      };

      dynamicFormValues.nama_pembeli = namaPembeli;
      dynamicFormValues.ttl_pembeli = ttlPembeli;
      dynamicFormValues.form_nama_pembeli = namaPembeli;
      dynamicFormValues.nik_pembeli = nikPembeli;
      dynamicFormValues.form_nik_pembeli = nikPembeli;
      dynamicFormValues.tempatlahir_pembeli = tmpLahirPembeli;
      dynamicFormValues.form_tempat_lahir_pembeli = tmpLahirPembeli;
      dynamicFormValues.tanggallahir_pembeli = tglLahirPembeli;
      dynamicFormValues.form_tanggal_lahir_pembeli = tglLahirPembeli;
      dynamicFormValues.jenis_kelamin_pembeli = jkPembeli;
      dynamicFormValues.form_jenis_kelamin_pembeli = jkPembeli;
      dynamicFormValues.alamat_pembeli = alamatPembeli;
      dynamicFormValues.form_alamat_pembeli = alamatPembeli;
      dynamicFormValues.pekerjaan_pembeli = kerjaPembeli;
      dynamicFormValues.form_pekerjaan_pembeli = kerjaPembeli;
      dynamicFormValues.desa_pembeli = desaPembeli;
      dynamicFormValues.rt_pembeli = rtPembeli;
      dynamicFormValues.rw_pembeli = rwPembeli;
      dynamicFormValues.kecamatan_pembeli = kecPembeli;
      dynamicFormValues.kabupaten_pembeli = kabPembeli;

      // 3. Tanggal Transaksi
      const rawTxDate = fd.transactionDate || fd.tanggal_transaksi || '';
      const txD = rawTxDate && !isNaN(new Date(rawTxDate).getTime()) ? new Date(rawTxDate) : new Date();
      dynamicFormValues.hari_transaksi = getNamaHariIndonesia(txD);
      dynamicFormValues.tgl_angka_transaksi = String(txD.getDate()).padStart(2, '0');
      dynamicFormValues.bulan_transaksi = BULAN_INDONESIA[txD.getMonth()];
      dynamicFormValues.tahun_transaksi = String(txD.getFullYear());

      // 4. Rincian Objek Tanah
      const desaTanah = toTitleCaseIndonesian(fd.landDesa || identity.namaDesa);
      const kecTanah = toTitleCaseIndonesian(fd.landKecamatan || identity.namaKecamatan);
      const kabTanah = toTitleCaseIndonesian(fd.landKabupaten || identity.namaKabupaten);
      const luasTanah = fd.landArea || fd.luas_tanah || '350';
      const panjangTanah = fd.landLength || fd.panjang_tanah || '25';
      const lebarTanah = fd.landWidth || fd.lebar_tanah || '14';
      const jenisAlasHak = fd.certificateType || fd.jenis_alas_hak || 'Letter C';
      const noAlasHak = fd.certificateNumber || fd.nomor_alas_hak || '-';
      const alasHakLengkap = noAlasHak.toLowerCase().includes(jenisAlasHak.toLowerCase())
        ? noAlasHak
        : `${jenisAlasHak} No. ${noAlasHak}`;

      dynamicFormValues.desa_tanah = desaTanah;
      dynamicFormValues.kecamatan_tanah = kecTanah;
      dynamicFormValues.kabupaten_tanah = kabTanah;
      dynamicFormValues.luas_tanah = luasTanah;
      dynamicFormValues.panjang_tanah = panjangTanah;
      dynamicFormValues.lebar_tanah = lebarTanah;
      dynamicFormValues.jenis_alas_hak = jenisAlasHak;
      dynamicFormValues.nomor_alas_hak = noAlasHak;
      dynamicFormValues.alas_hak_lengkap = alasHakLengkap;

      dynamicFormValues.batas_utara = toTitleCaseIndonesian(fd.boundaryNorth || fd.batas_utara || '-');
      dynamicFormValues.batas_selatan = toTitleCaseIndonesian(fd.boundarySouth || fd.batas_selatan || '-');
      dynamicFormValues.batas_timur = toTitleCaseIndonesian(fd.boundaryEast || fd.batas_timur || '-');
      dynamicFormValues.batas_barat = toTitleCaseIndonesian(fd.boundaryWest || fd.batas_barat || '-');

      // 5. Harga & Biaya
      const rawHargaVal = String(fd.transactionPrice || fd.harga_transaksi || '0').replace(/[^0-9]/g, '');
      const numHarga = Number(rawHargaVal) || 0;
      const fmtHarga = numHarga > 0 ? `${numHarga.toLocaleString('id-ID')},-` : (fd.transactionPrice || '-');
      const terbilangHarga = (fd.priceInWords || fd.harga_terbilang || (numHarga > 0 ? `${terbilangIndonesia(numHarga)} rupiah` : '-')).trim();

      dynamicFormValues.harga_transaksi = fmtHarga;
      dynamicFormValues.harga_terbilang = terbilangHarga;
      dynamicFormValues.biaya_ditanggung_oleh = fd.costBearer || fd.biaya_ditanggung_oleh || 'Pihak Kedua (Pembeli)';

      // 6. Tanggal Surat & Saksi
      const rawDate = (submission as any).submittedAt || submission.date;
      const today = rawDate ? new Date(rawDate) : new Date();
      dynamicFormValues.tgl_surat_format = formatTanggalIndonesia(today);
      dynamicFormValues.saksi_pihak_1 = toTitleCaseIndonesian(fd.witness1 || fd.saksi_pihak_1 || '....................................');
      dynamicFormValues.saksi_pihak_2 = toTitleCaseIndonesian(fd.witness2 || fd.saksi_pihak_2 || '....................................');

      // Legacy fallback
      dynamicFormValues.form_jenis_barang = 'Sebidang Tanah Pekarangan';
      dynamicFormValues.jenis_barang = 'Sebidang Tanah Pekarangan';
      dynamicFormValues.form_rincian_barang = `${alasHakLengkap} Luas &plusmn; ${luasTanah} m2 terletak di Desa ${desaTanah}`;
      dynamicFormValues.rincian_barang = dynamicFormValues.form_rincian_barang;
      dynamicFormValues.form_keterangan = `Pengesahan Bukti Transaksi Jual Beli Tanah di Pemerintah Desa ${identity.namaDesa}`;
      dynamicFormValues.keterangan = dynamicFormValues.form_keterangan;
      dynamicFormValues.form_nama_ketua_adat = '...........................................';
      dynamicFormValues.nama_ketua_adat = '...........................................';
    }

    const isIzinKeluargaLetter =
      matchedMaster?.id === 'prm-31' ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === 's-39' ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === '140' ||
      (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('izin keluarga') ||
      (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('izin orang tua') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('izin-keluarga') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('izin-orang-tua') ||
      Boolean(
        fd.grantorName ||
        fd.granteeName ||
        fd.nama_pemberi_izin ||
        fd.nama_penerima_izin ||
        fd.destinationLocation
      );

    if (isIzinKeluargaLetter) {
      // 1. Pihak yang Memberi Izin (Grantor)
      const grantorNik = fd.grantorNik || fd.grantor_nik || fd.nik_pemberi_izin || submission.nik || formattedIndividu.nik || '-';
      const grantorRes = residentMap[grantorNik];
      const grantorName = toTitleCaseIndonesian(fd.grantorName || fd.grantor_name || fd.nama_pemberi_izin || grantorRes?.fullName || submission.requesterName || formattedIndividu.nama || '-');
      const grantorBirthPlace = fd.grantorBirthPlace || fd.grantor_birth_place || fd.tempat_lahir_pemberi_izin || grantorRes?.placeOfBirth || identity.namaKabupaten;
      const grantorBirthDate = fd.grantorBirthDate || fd.grantor_birth_date || fd.tanggal_lahir_pemberi_izin || grantorRes?.dateOfBirth || '';
      const normGrantorBirthDate = grantorBirthDate && grantorBirthDate !== '-' ? normalizeDateInput(grantorBirthDate) : null;
      const grantorBirthDateFmt = normGrantorBirthDate ? formatTanggalIndonesia(normGrantorBirthDate) : (grantorBirthDate || '-');
      const grantorTtl = (grantorBirthPlace && grantorBirthDateFmt !== '-') ? `${toTitleCaseIndonesian(grantorBirthPlace)}, ${grantorBirthDateFmt}` : (toTitleCaseIndonesian(grantorBirthPlace) || grantorBirthDateFmt || '-');
      const grantorWna = String(fd.grantorNationality || fd.grantor_nationality || fd.warga_negara_pemberi_izin || grantorRes?.nationality || 'Indonesia');
      const grantorAgama = String(fd.grantorReligion || fd.grantor_religion || fd.agama_pemberi_izin || grantorRes?.religion || 'Islam');
      const grantorWnaAgama = `${toTitleCaseIndonesian(grantorWna)}/${toTitleCaseIndonesian(grantorAgama)}`;
      const grantorJob = toTitleCaseIndonesian(fd.grantorJob || fd.grantor_job || fd.pekerjaan_pemberi_izin || grantorRes?.occupation || 'Wiraswasta');
      const grantorMaritalStatus = toTitleCaseIndonesian(fd.grantorMaritalStatus || fd.grantor_marital_status || fd.status_perkawinan_pemberi_izin || grantorRes?.maritalStatus || 'Kawin');
      const grantorAddress = toTitleCaseIndonesian(fd.grantorAddress || fd.grantor_address || fd.alamat_pemberi_izin || grantorRes?.address || formattedIndividu.alamat || `Desa ${identity.namaDesa}, Kec. ${identity.namaKecamatan}, Kab. ${identity.namaKabupaten}`);
      const hubCtki = String(fd.grantorRelation || fd.hubCtki || fd.hubungan_ctki || fd.hubungan_dengan_ctki || 'SUAMI').toUpperCase();

      // Panggilan Hubungan
      let panggilanHub = fd.recipientRelationCall || fd.panggilan_hubungan_penerima || '';
      if (!panggilanHub) {
        if (hubCtki.includes('SUAMI')) {
          panggilanHub = 'isteri';
        } else if (hubCtki.includes('ISTRI')) {
          panggilanHub = 'suami';
        } else if (hubCtki.includes('AYAH') || hubCtki.includes('IBU') || hubCtki.includes('ORANG TUA')) {
          panggilanHub = 'anak kandung';
        } else {
          panggilanHub = 'keluarga';
        }
      }

      // 2. Pihak yang Diberi Izin (Grantee / CTKI)
      const granteeNik = fd.granteeNik || fd.grantee_nik || fd.nik_penerima_izin || '-';
      const granteeRes = residentMap[granteeNik];
      const granteeName = toTitleCaseIndonesian(fd.granteeName || fd.grantee_name || fd.nama_penerima_izin || granteeRes?.fullName || '-');
      const granteeBirthPlace = fd.granteeBirthPlace || fd.grantee_birth_place || fd.tempat_lahir_penerima_izin || granteeRes?.placeOfBirth || identity.namaKabupaten;
      const granteeBirthDate = fd.granteeBirthDate || fd.grantee_birth_date || fd.tanggal_lahir_penerima_izin || granteeRes?.dateOfBirth || '';
      const normGranteeBirthDate = granteeBirthDate && granteeBirthDate !== '-' ? normalizeDateInput(granteeBirthDate) : null;
      const granteeBirthDateFmt = normGranteeBirthDate ? formatTanggalIndonesia(normGranteeBirthDate) : (granteeBirthDate || '-');
      const granteeTtl = (granteeBirthPlace && granteeBirthDateFmt !== '-') ? `${toTitleCaseIndonesian(granteeBirthPlace)}, ${granteeBirthDateFmt}` : (toTitleCaseIndonesian(granteeBirthPlace) || granteeBirthDateFmt || '-');
      const granteeWna = String(fd.granteeNationality || fd.grantee_nationality || fd.warga_negara_penerima_izin || granteeRes?.nationality || 'Indonesia');
      const granteeAgama = String(fd.granteeReligion || fd.grantee_religion || fd.agama_penerima_izin || granteeRes?.religion || 'Islam');
      const granteeWnaAgama = `${toTitleCaseIndonesian(granteeWna)}/${toTitleCaseIndonesian(granteeAgama)}`;
      const granteeJob = toTitleCaseIndonesian(fd.granteeJob || fd.grantee_job || fd.pekerjaan_penerima_izin || granteeRes?.occupation || 'Mengurus Rumah Tangga');
      const granteeMaritalStatus = toTitleCaseIndonesian(fd.granteeMaritalStatus || fd.grantee_marital_status || fd.status_perkawinan_penerima_izin || granteeRes?.maritalStatus || grantorMaritalStatus);
      const granteeAddress = toTitleCaseIndonesian(fd.granteeAddress || fd.grantee_address || fd.alamat_penerima_izin || granteeRes?.address || grantorAddress);

      const tujuanKerja = String(fd.destinationLocation || fd.tujuan || fd.tujuan_kerja || fd.country || 'HONGKONG').toUpperCase();
      const rawMasa = fd.contractDuration || fd.masa_kontrak || fd.form_masa_kontrak_tahun || '2 s/d 3 tahun';
      const masaKontrak = String(rawMasa).toLowerCase().includes('tahun') || String(rawMasa).toLowerCase().includes('bulan')
        ? String(rawMasa)
        : `${rawMasa} tahun`;

      dynamicFormValues.nama_pemberi_izin = grantorName;
      dynamicFormValues.nik_pemberi_izin = grantorNik;
      dynamicFormValues.ttl_pemberi_izin = grantorTtl;
      dynamicFormValues.warga_negara_agama_pemberi_izin = grantorWnaAgama;
      dynamicFormValues.pekerjaan_pemberi_izin = grantorJob;
      dynamicFormValues.status_perkawinan_pemberi_izin = grantorMaritalStatus;
      dynamicFormValues.alamat_pemberi_izin = grantorAddress;
      dynamicFormValues.hubungan_dengan_ctki = hubCtki;
      dynamicFormValues.panggilan_hubungan_penerima = panggilanHub;

      dynamicFormValues.nama_penerima_izin = granteeName;
      dynamicFormValues.nik_penerima_izin = granteeNik;
      dynamicFormValues.ttl_penerima_izin = granteeTtl;
      dynamicFormValues.warga_negara_agama_penerima_izin = granteeWnaAgama;
      dynamicFormValues.pekerjaan_penerima_izin = granteeJob;
      dynamicFormValues.status_perkawinan_penerima_izin = granteeMaritalStatus;
      dynamicFormValues.alamat_penerima_izin = granteeAddress;
      dynamicFormValues.tujuan_kerja = tujuanKerja;
      dynamicFormValues.masa_kontrak = masaKontrak;

      // Legacy fallback mapping
      dynamicFormValues.nama = grantorName;
      dynamicFormValues.nik = grantorNik;
      dynamicFormValues.ttl = grantorTtl;
      dynamicFormValues.pekerjaan = grantorJob;
      dynamicFormValues.alamat = grantorAddress;
      dynamicFormValues.alamat_lengkap = grantorAddress;
      dynamicFormValues.form_memberi_izin_selaku = hubCtki;
      dynamicFormValues.form_hubungan_dengan_pemberi_izin = panggilanHub;
      dynamicFormValues.form_negara_tujuan = tujuanKerja;
      dynamicFormValues.form_nama_pptkis = fd.destinationCompany || '-';
      dynamicFormValues.form_status_pekerjaan_tki_tkw = fd.jobPosition || 'Tenaga Kerja Indonesia (TKI)';
      dynamicFormValues.form_masa_kontrak_tahun = masaKontrak;
    }

    const isSuratJalanLetter =
      matchedMaster?.id === 'prm-42' ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === 's-10' ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === '470' ||
      (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('bepergian') ||
      (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('surat jalan') ||
      (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('keterangan jalan') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('bepergian') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('jalan');

    if (isSuratJalanLetter) {
      const nama = (fd.name || fd.nama || submission.requesterName || formattedIndividu.nama || '-').toUpperCase();
      const nik = fd.nik || submission.nik || formattedIndividu.nik || '-';
      const tmpLahir = fd.birthPlace || fd.tempatLahir || (residentMap[nik])?.placeOfBirth || identity.namaKabupaten;
      const tglLahir = fd.birthDate || fd.tanggalLahir || (residentMap[nik])?.dateOfBirth || '';
      const normTglLahir = tglLahir && tglLahir !== '-' ? normalizeDateInput(tglLahir) : null;
      const tglLahirFmt = normTglLahir ? formatTanggalIndonesia(normTglLahir) : (tglLahir || '-');
      const ttl = (tmpLahir && tglLahirFmt !== '-') ? `${toTitleCaseIndonesian(tmpLahir)} ${tglLahirFmt}` : (toTitleCaseIndonesian(tmpLahir) || tglLahirFmt || '-');
      const kelamin = String(fd.gender || fd.jenisKelamin || (residentMap[nik])?.gender || 'Laki-Laki');
      const statusKawin = toTitleCaseIndonesian(fd.maritalStatus || fd.statusPerkawinan || fd.status_kawin || (residentMap[nik])?.maritalStatus || 'Belum Kawin');
      const kerja = toTitleCaseIndonesian(fd.job || fd.pekerjaan || (residentMap[nik])?.occupation || '-');
      const agama = toTitleCaseIndonesian(fd.religion || fd.agama || (residentMap[nik])?.religion || 'Islam');
      const alamat = fd.address || fd.alamat || (residentMap[nik])?.address || formattedIndividu.alamat || `Desa ${identity.namaDesa}, Kecamatan ${identity.namaKecamatan}, Kabupaten ${identity.namaKabupaten}`;

      const rawTglBerangkat = fd.departureDate || fd.tanggalBerangkat || fd.tanggal_berangkat || '';
      const normTglBerangkat = rawTglBerangkat ? normalizeDateInput(rawTglBerangkat) : null;
      const tglBerangkat = normTglBerangkat ? formatTanggalIndonesia(normTglBerangkat) : (rawTglBerangkat || '-');

      const alamatTujuan = fd.destinationAddress || fd.alamatYangDituju || fd.destinationCity || fd.alamat_tujuan || '-';
      const keperluan = fd.purpose || fd.keperluan || fd.form_keperluan || 'Bekerja';

      dynamicFormValues.nama = nama;
      dynamicFormValues.nik = nik;
      dynamicFormValues.sex = kelamin;
      dynamicFormValues.jenis_kelamin = kelamin;
      dynamicFormValues.tempat_tanggal_lahir = ttl;
      dynamicFormValues.ttl = ttl;
      dynamicFormValues.status_kawin = statusKawin;
      dynamicFormValues.status_perkawinan = statusKawin;
      dynamicFormValues.pekerjaan = kerja;
      dynamicFormValues.agama = agama;
      dynamicFormValues.alamat = alamat;
      dynamicFormValues.alamat_lengkap = alamat;
      dynamicFormValues.tanggal_berangkat = tglBerangkat;
      dynamicFormValues.form_tanggal_berangkat = tglBerangkat;
      dynamicFormValues.alamat_tujuan = alamatTujuan;
      dynamicFormValues.alamat_yang_dituju = alamatTujuan;
      dynamicFormValues.form_alamat_tujuan = alamatTujuan;
      dynamicFormValues.keperluan = keperluan;
      dynamicFormValues.form_keperluan = keperluan;
    }

    const isSuratKuasaLetter =
      matchedMaster?.id === 'prm-30' ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === 's-47' ||
      (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('surat kuasa') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('surat-kuasa');

    if (isSuratKuasaLetter) {
      // Pemberi Kuasa
      const grantorName = (fd.grantorName || fd.name || fd.nama || submission.requesterName || formattedIndividu.nama || identity.namaKepalaDesa || 'SANTOSO').toUpperCase();
      const grantorNik = fd.grantorNik || fd.nik || submission.nik || formattedIndividu.nik || '-';
      const grantorBirthPlace = fd.grantorBirthPlace || fd.birthPlace || fd.tempatLahir || identity.namaKabupaten;
      const grantorBirthDate = fd.grantorBirthDate || fd.birthDate || fd.tanggalLahir || '';
      const normGrantorBirthDate = grantorBirthDate ? normalizeDateInput(grantorBirthDate) : null;
      const grantorBirthDateFmt = normGrantorBirthDate ? formatTanggalIndonesia(normGrantorBirthDate) : (grantorBirthDate || '-');
      const grantorTtl = (grantorBirthPlace && grantorBirthDateFmt !== '-') ? `${toTitleCaseIndonesian(grantorBirthPlace)} , ${grantorBirthDateFmt}` : (toTitleCaseIndonesian(grantorBirthPlace) || grantorBirthDateFmt || '-');
      const grantorPosition = fd.grantorPosition || fd.jabatan || `Kepala Desa ${identity.namaDesa}`;
      const grantorAddress = fd.grantorAddress || fd.address || fd.alamat || formattedIndividu.alamat || `Desa ${identity.namaDesa}`;

      // Tujuan / Lingkup Kuasa
      const tujuanKuasa = fd.powerScope || fd.purpose || fd.keperluan || fd.tujuanKuasa || 'Pengambilan uang secara tunai di Bank Jatim / Bank Jateng';

      // Penerima Kuasa 1
      const grantee1Name = (fd.grantee1Name || fd.proxyName || fd.authorizedPerson || 'IMAM').toUpperCase();
      const grantee1BirthPlace = fd.grantee1BirthPlace || fd.proxyBirthPlace || identity.namaKabupaten;
      const grantee1BirthDate = fd.grantee1BirthDate || fd.proxyBirthDate || '';
      const normGrantee1BirthDate = grantee1BirthDate ? normalizeDateInput(grantee1BirthDate) : null;
      const grantee1BirthDateFmt = normGrantee1BirthDate ? formatTanggalIndonesia(normGrantee1BirthDate) : (grantee1BirthDate || '-');
      const grantee1Ttl = (grantee1BirthPlace && grantee1BirthDateFmt !== '-') ? `${toTitleCaseIndonesian(grantee1BirthPlace)}, ${grantee1BirthDateFmt}` : (toTitleCaseIndonesian(grantee1BirthPlace) || grantee1BirthDateFmt || '-');
      const grantee1Position = fd.grantee1Position || fd.proxyPosition || `Sekretaris Desa ${identity.namaDesa}`;
      const grantee1Address = fd.grantee1Address || fd.proxyAddress || `Desa ${identity.namaDesa}`;

      // Penerima Kuasa 2
      const grantee2Name = (fd.grantee2Name || '').toUpperCase();
      const grantee2BirthPlace = fd.grantee2BirthPlace || '';
      const grantee2BirthDate = fd.grantee2BirthDate || '';
      const normGrantee2BirthDate = grantee2BirthDate ? normalizeDateInput(grantee2BirthDate) : null;
      const grantee2BirthDateFmt = normGrantee2BirthDate ? formatTanggalIndonesia(normGrantee2BirthDate) : (grantee2BirthDate || '-');
      const grantee2Ttl = (grantee2BirthPlace && grantee2BirthDateFmt !== '-') ? `${toTitleCaseIndonesian(grantee2BirthPlace)}, ${grantee2BirthDateFmt}` : (toTitleCaseIndonesian(grantee2BirthPlace) || grantee2BirthDateFmt || '-');
      const grantee2Position = fd.grantee2Position || `Bendahara Desa ${identity.namaDesa}`;
      const grantee2Address = fd.grantee2Address || `Desa ${identity.namaDesa}`;

      let labelJabatanPenerima = fd.granteePositionLabel;
      if (!labelJabatanPenerima) {
        if (grantee2Name) {
          labelJabatanPenerima = `${grantee1Position} dan ${grantee2Position} ${identity.namaDesa}`;
        } else {
          labelJabatanPenerima = `${grantee1Position} ${identity.namaDesa}`;
        }
      }

      dynamicFormValues.nama_pemberi_kuasa = grantorName;
      dynamicFormValues.ttl_pemberi_kuasa = grantorTtl;
      dynamicFormValues.nik_pemberi_kuasa = grantorNik;
      dynamicFormValues.jabatan_pemberi_kuasa = grantorPosition;
      dynamicFormValues.alamat_pemberi_kuasa = grantorAddress;

      dynamicFormValues.label_jabatan_penerima_kuasa = labelJabatanPenerima;
      dynamicFormValues.tujuan_kuasa = tujuanKuasa;

      dynamicFormValues.nama_penerima_kuasa_1 = grantee1Name;
      dynamicFormValues.ttl_penerima_kuasa_1 = grantee1Ttl;
      dynamicFormValues.jabatan_penerima_kuasa_1 = grantee1Position;
      dynamicFormValues.alamat_penerima_kuasa_1 = grantee1Address;

      dynamicFormValues.nama_penerima_kuasa_2 = grantee2Name;
      dynamicFormValues.ttl_penerima_kuasa_2 = grantee2Ttl;
      dynamicFormValues.jabatan_penerima_kuasa_2 = grantee2Position;
      dynamicFormValues.alamat_penerima_kuasa_2 = grantee2Address;

      dynamicFormValues.ttd_penerima_kuasa_2 = grantee2Name
        ? `<strong style="text-decoration: underline; text-transform: uppercase;"><u>${grantee2Name}</u></strong>`
        : '';

      // Legacy aliases
      dynamicFormValues.nama = grantorName;
      dynamicFormValues.nik = grantorNik;
    }

    const isSkckLetter =
      matchedMaster?.id === 'prm-15' ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === 's-07' ||
      (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('skck') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('catatan-kepolisian') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('skck');

    if (isSkckLetter) {
      const nama = toTitleCaseIndonesian(fd.name || fd.nama || submission.requesterName || formattedIndividu.nama || '-');
      const nik = fd.nik || submission.nik || formattedIndividu.nik || '-';
      const tmpLahir = fd.birthPlace || fd.tempatLahir || (residentMap[nik])?.placeOfBirth || identity.namaKabupaten;
      const tglLahir = fd.birthDate || fd.tanggalLahir || (residentMap[nik])?.dateOfBirth || '';
      const normTglLahir = tglLahir && tglLahir !== '-' ? normalizeDateInput(tglLahir) : null;
      const tglLahirFmt = normTglLahir ? formatTanggalIndonesia(normTglLahir) : (tglLahir || '-');
      const ttl = (tmpLahir && tglLahirFmt !== '-') ? `${toTitleCaseIndonesian(tmpLahir)}, ${tglLahirFmt}` : (toTitleCaseIndonesian(tmpLahir) || tglLahirFmt || '-');
      const kelamin = String(fd.gender || fd.jenisKelamin || (residentMap[nik])?.gender || 'Laki-Laki').toUpperCase();
      const wna = String(fd.nationality || fd.warga_negara || (residentMap[nik])?.nationality || 'WNI').toUpperCase();
      const agama = String(fd.religion || fd.agama || (residentMap[nik])?.religion || 'Islam').toUpperCase();
      const kerja = toTitleCaseIndonesian(fd.job || fd.pekerjaan || (residentMap[nik])?.occupation || 'Belum/Tidak Bekerja');
      const alamat = fd.address || fd.alamat || (residentMap[nik])?.address || formattedIndividu.alamat || `Desa ${identity.namaDesa}, Kec. ${identity.namaKecamatan}`;
      const keperluan = fd.purpose === 'Lainnya' && fd.otherPurpose ? fd.otherPurpose : (fd.purpose || fd.otherPurpose || fd.keperluan || fd.form_keperluan || fd.keterangan || fd.form_keterangan || 'Melamar Pekerjaan');

      dynamicFormValues.nama = nama;
      dynamicFormValues.nik = nik;
      dynamicFormValues.nomor_nik = nik;
      dynamicFormValues.tempat_tanggal_lahir = ttl;
      dynamicFormValues.ttl = ttl;
      dynamicFormValues.jenis_kelamin = kelamin;
      dynamicFormValues.warga_negara = wna;
      dynamicFormValues.warganegara = wna;
      dynamicFormValues.agama = agama;
      dynamicFormValues.pekerjaan = kerja;
      dynamicFormValues.alamat = alamat;
      dynamicFormValues.alamat_lengkap = alamat;
      dynamicFormValues.keperluan = keperluan;
      dynamicFormValues.form_keperluan = keperluan;
      dynamicFormValues['[form_keperluan]'] = keperluan;
      dynamicFormValues.keterangan = keperluan;
      dynamicFormValues.form_keterangan = keperluan;
      dynamicFormValues['[form_keterangan]'] = keperluan;
    }

    const isKehilanganLetter =
      matchedMaster?.id === 'prm-02' ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === 's-13' ||
      (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('kehilangan') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('kehilangan');

    if (isKehilanganLetter) {
      const nama = toTitleCaseIndonesian(fd.name || fd.nama || submission.requesterName || formattedIndividu.nama || '-');
      const nik = fd.nik || submission.nik || formattedIndividu.nik || '-';
      const tmpLahir = fd.birthPlace || fd.tempatLahir || (residentMap[nik])?.placeOfBirth || identity.namaKabupaten;
      const tglLahir = fd.birthDate || fd.tanggalLahir || (residentMap[nik])?.dateOfBirth || '';
      const normTglLahir = tglLahir && tglLahir !== '-' ? normalizeDateInput(tglLahir) : null;
      const tglLahirFmt = normTglLahir ? formatTanggalIndonesia(normTglLahir) : (tglLahir || '-');
      const ttl = (tmpLahir && tglLahirFmt !== '-') ? `${toTitleCaseIndonesian(tmpLahir)}, ${tglLahirFmt}` : (toTitleCaseIndonesian(tmpLahir) || tglLahirFmt || '-');
      const kelamin = String(fd.gender || fd.jenisKelamin || (residentMap[nik])?.gender || 'Laki-Laki').toUpperCase();
      const kerja = toTitleCaseIndonesian(fd.job || fd.pekerjaan || (residentMap[nik])?.occupation || 'Belum/Tidak Bekerja');
      const alamat = fd.address || fd.alamat || (residentMap[nik])?.address || formattedIndividu.alamat || `Desa ${identity.namaDesa}, Kec. ${identity.namaKecamatan}`;

      const rincianBarang = fd.lostItems || fd.rincian_barang || fd.form_rincian_barang || fd.barang_hilang || fd.form_barang_hilang || fd.form_rincian || fd.rincian || fd.form_nama_barang || fd.nama_barang || '-';
      const waktuHilang = fd.lostDate || fd.waktu_hilang || fd.form_waktu_hilang || '-';
      const tempatHilang = fd.lostLocation || fd.tempat_hilang || fd.form_tempat_hilang || `Wilayah Kecamatan ${identity.namaKecamatan}`;
      const kronologi = fd.chronology || fd.kronologi || fd.form_kronologi || fd.keterangan || fd.form_keterangan || 'Barang/dokumen tersebut di atas benar telah tercecer atau hilang dan telah diupayakan pencarian namun hingga saat ini belum ditemukan.';
      const keperluan = fd.purpose || fd.keperluan || fd.form_keperluan || 'Pengantar permohonan Surat Tanda Penerimaan Laporan Kehilangan Barang (STPLKB) ke Polsek';

      dynamicFormValues.nama = nama;
      dynamicFormValues.nik = nik;
      dynamicFormValues.nomor_nik = nik;
      dynamicFormValues.tempat_tanggal_lahir = ttl;
      dynamicFormValues.ttl = ttl;
      dynamicFormValues.jenis_kelamin = kelamin;
      dynamicFormValues.pekerjaan = kerja;
      dynamicFormValues.alamat = alamat;
      dynamicFormValues.alamat_lengkap = alamat;

      dynamicFormValues.lostItems = rincianBarang;
      dynamicFormValues.rincian_barang = rincianBarang;
      dynamicFormValues.form_rincian_barang = rincianBarang;
      dynamicFormValues['[form_rincian_barang]'] = rincianBarang;
      dynamicFormValues.barang_hilang = rincianBarang;
      dynamicFormValues.form_barang_hilang = rincianBarang;
      dynamicFormValues.nama_barang = rincianBarang;
      dynamicFormValues.form_nama_barang = rincianBarang;
      dynamicFormValues['[form_nama_barang]'] = rincianBarang;
      dynamicFormValues.rincian = rincianBarang;
      dynamicFormValues.form_rincian = rincianBarang;
      dynamicFormValues['[form_rincian]'] = rincianBarang;

      dynamicFormValues.lostDate = waktuHilang;
      dynamicFormValues.waktu_hilang = waktuHilang;
      dynamicFormValues.form_waktu_hilang = waktuHilang;
      dynamicFormValues['[form_waktu_hilang]'] = waktuHilang;

      dynamicFormValues.lostLocation = tempatHilang;
      dynamicFormValues.tempat_hilang = tempatHilang;
      dynamicFormValues.form_tempat_hilang = tempatHilang;
      dynamicFormValues['[form_tempat_hilang]'] = tempatHilang;

      dynamicFormValues.chronology = kronologi;
      dynamicFormValues.kronologi = kronologi;
      dynamicFormValues.form_kronologi = kronologi;
      dynamicFormValues.keterangan = kronologi;
      dynamicFormValues.form_keterangan = kronologi;
      dynamicFormValues['[form_keterangan]'] = kronologi;

      dynamicFormValues.keperluan = keperluan;
      dynamicFormValues.form_keperluan = keperluan;
      dynamicFormValues['[form_keperluan]'] = keperluan;
    }

    const isKeramaianLetter =
      matchedMaster?.id === 'prm-05' ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === 's-12' ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === '100.3.12' ||
      (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('keramaian') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('keramaian');

    if (isKeramaianLetter) {
      const nama = toTitleCaseIndonesian(fd.name || fd.nama || submission.requesterName || formattedIndividu.nama || '-');
      const nik = fd.nik || submission.nik || formattedIndividu.nik || '-';
      const tmpLahir = fd.birthPlace || fd.tempatLahir || (residentMap[nik])?.placeOfBirth || identity.namaKabupaten;
      const tglLahir = fd.birthDate || fd.tanggalLahir || (residentMap[nik])?.dateOfBirth || '';
      const normTglLahir = tglLahir && tglLahir !== '-' ? normalizeDateInput(tglLahir) : null;
      const tglLahirFmt = normTglLahir ? formatTanggalIndonesia(normTglLahir) : (tglLahir || '-');
      const ttl = (tmpLahir && tglLahirFmt !== '-') ? `${toTitleCaseIndonesian(tmpLahir)}, ${tglLahirFmt}` : (toTitleCaseIndonesian(tmpLahir) || tglLahirFmt || '-');
      const kelamin = String(fd.gender || fd.jenisKelamin || (residentMap[nik])?.gender || 'Laki-Laki').toUpperCase();
      const kerja = toTitleCaseIndonesian(fd.job || fd.pekerjaan || (residentMap[nik])?.occupation || 'Belum/Tidak Bekerja');
      const alamat = fd.address || fd.alamat || (residentMap[nik])?.address || formattedIndividu.alamat || `Desa ${identity.namaDesa}, Kec. ${identity.namaKecamatan}`;

      const rawTglAcara = fd.eventDate || fd.tanggal_acara || fd.form_tanggal_acara || '-';
      const normTglAcara = rawTglAcara && rawTglAcara !== '-' ? (normalizeDateInput(rawTglAcara) ? formatTanggalIndonesia(normalizeDateInput(rawTglAcara)!) : rawTglAcara) : '-';

      const rawTglSelesai = fd.eventEndDate || fd.sampai_tanggal || fd.form_sampai_tanggal || normTglAcara;
      const normTglSelesai = rawTglSelesai && rawTglSelesai !== '-' ? (normalizeDateInput(rawTglSelesai) ? formatTanggalIndonesia(normalizeDateInput(rawTglSelesai)!) : rawTglSelesai) : normTglAcara;

      const rawUndangan = fd.guestCount || fd.jumlah_undangan || fd.form_jumlah_undangan || '500 Orang';
      const fmtUndangan = String(rawUndangan).toLowerCase().includes('orang') ? String(rawUndangan) : `${rawUndangan} Orang`;

      const rawAcara = fd.eventName || fd.acara || fd.form_acara || 'Resepsi Pernikahan';
      const rawHiburan = fd.eventEntertainment || fd.hiburan || fd.form_hiburan || 'Orgen Tunggal';
      const rawTempat = fd.eventLocation || fd.tempat_acara || fd.form_tempat_acara || fd.tempat || alamat;

      dynamicFormValues.nama = nama;
      dynamicFormValues.nik = nik;
      dynamicFormValues.nomor_nik = nik;
      dynamicFormValues.tempat_tanggal_lahir = ttl;
      dynamicFormValues.ttl = ttl;
      dynamicFormValues.jenis_kelamin = kelamin;
      dynamicFormValues.pekerjaan = kerja;
      dynamicFormValues.alamat = alamat;
      dynamicFormValues.alamat_lengkap = alamat;

      dynamicFormValues.tanggal_acara = normTglAcara;
      dynamicFormValues.form_tanggal_acara = normTglAcara;
      dynamicFormValues['[form_tanggal_acara]'] = normTglAcara;

      dynamicFormValues.sampai_tanggal = normTglSelesai;
      dynamicFormValues.form_sampai_tanggal = normTglSelesai;
      dynamicFormValues['[form_sampai_tanggal]'] = normTglSelesai;

      dynamicFormValues.jumlah_undangan = fmtUndangan;
      dynamicFormValues.form_jumlah_undangan = fmtUndangan;
      dynamicFormValues['[form_jumlah_undangan]'] = fmtUndangan;

      dynamicFormValues.acara = toTitleCaseIndonesian(rawAcara);
      dynamicFormValues.form_acara = toTitleCaseIndonesian(rawAcara);
      dynamicFormValues['[form_acara]'] = toTitleCaseIndonesian(rawAcara);

      dynamicFormValues.hiburan = toTitleCaseIndonesian(rawHiburan);
      dynamicFormValues.form_hiburan = toTitleCaseIndonesian(rawHiburan);
      dynamicFormValues['[form_hiburan]'] = toTitleCaseIndonesian(rawHiburan);

      dynamicFormValues.tempat_acara = rawTempat;
      dynamicFormValues.form_tempat_acara = rawTempat;
      dynamicFormValues['[form_tempat_acara]'] = rawTempat;
    }

    const isPemakamanLetter =
      matchedMaster?.id === 'prm-44' ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === '474.3' ||
      (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('pemakaman') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('pemakaman') ||
      Boolean(
        fd.burialDate ||
        fd.tanggal_pemakaman ||
        fd.lokasi_tpu ||
        fd.burialLocation ||
        fd.tempat_pemakaman ||
        fd.waktu_pemakaman ||
        fd.jam_pemakaman
      );

    if (isPemakamanLetter) {
      // 1. Data Jenazah / Almarhum
      const namaAlm = toTitleCaseIndonesian(fd.name || fd.nama || submission.requesterName || formattedIndividu.nama || '-');
      const nikAlm = fd.nik || submission.nik || formattedIndividu.nik || '-';
      const noKkAlm = fd.noKk || fd.no_kk || fd.nomor_kk || (residentMap[nikAlm] as any)?.noKk || (residentMap[nikAlm] as any)?.no_kk || '-';
      const tmpLahirAlm = fd.birthPlace || fd.tempatLahir || (residentMap[nikAlm])?.placeOfBirth || identity.namaKabupaten;
      const tglLahirAlm = fd.birthDate || fd.tanggalLahir || (residentMap[nikAlm])?.dateOfBirth || '';
      const normTglLahir = tglLahirAlm && tglLahirAlm !== '-' ? normalizeDateInput(tglLahirAlm) : null;
      const tglLahirFmt = normTglLahir ? formatTanggalIndonesia(normTglLahir) : (tglLahirAlm || '-');
      const ttlAlm = (tmpLahirAlm && tglLahirFmt !== '-') ? `${toTitleCaseIndonesian(tmpLahirAlm)}, ${tglLahirFmt}` : (toTitleCaseIndonesian(tmpLahirAlm) || tglLahirFmt || '-');
      const kelaminAlm = toTitleCaseIndonesian(fd.gender || fd.jenisKelamin || (residentMap[nikAlm])?.gender || 'Laki-Laki');
      const agamaAlm = toTitleCaseIndonesian(fd.religion || fd.agama || (residentMap[nikAlm])?.religion || 'Islam');
      const kerjaAlm = toTitleCaseIndonesian(fd.job || fd.pekerjaan || (residentMap[nikAlm])?.occupation || 'Pensiunan');
      const alamatAlm = toTitleCaseIndonesian(fd.address || fd.alamat || (residentMap[nikAlm])?.address || formattedIndividu.alamat || `Desa ${identity.namaDesa}, Kec. ${identity.namaKecamatan}`);

      // 2. Data Kematian
      const rawDeathDate = fd.deathDate || fd.tanggal_kematian || fd.deathDateFormatted || '';
      let deathDayDateFmt = '-';
      if (rawDeathDate) {
        const d = normalizeDateInput(String(rawDeathDate));
        if (d && !isNaN(d.getTime())) {
          deathDayDateFmt = `${getNamaHariIndonesia(d)}, ${formatTanggalIndonesia(d)}`;
        } else {
          deathDayDateFmt = String(rawDeathDate);
        }
      }
      const deathTime = fd.deathTime || fd.jam_kematian || fd.waktu_kematian || '09.00 WIB';

      // 3. Data Pemakaman
      const rawBurialDate = fd.burialDate || fd.tanggal_pemakaman || fd.burialDateFormatted || rawDeathDate;
      let burialDayDateFmt = '-';
      if (rawBurialDate) {
        const d = normalizeDateInput(String(rawBurialDate));
        if (d && !isNaN(d.getTime())) {
          burialDayDateFmt = `${getNamaHariIndonesia(d)}, ${formatTanggalIndonesia(d)}`;
        } else {
          burialDayDateFmt = String(rawBurialDate);
        }
      }
      const burialTime = fd.burialTime || fd.jam_pemakaman || fd.waktu_pemakaman || '13.00 WIB';
      const burialLoc = fd.burialLocation || fd.tempat_pemakaman || fd.lokasi_tpu || `Pemakaman Islam Desa ${identity.namaDesa}`;

      dynamicFormValues.nama = namaAlm;
      dynamicFormValues.nik = nikAlm;
      dynamicFormValues.nomor_nik = nikAlm;
      dynamicFormValues.no_kk = noKkAlm;
      dynamicFormValues.nomor_kk = noKkAlm;
      dynamicFormValues.tempat_tanggal_lahir = ttlAlm;
      dynamicFormValues.ttl = ttlAlm;
      dynamicFormValues.jenis_kelamin = kelaminAlm;
      dynamicFormValues.agama = agamaAlm;
      dynamicFormValues.pekerjaan = kerjaAlm;
      dynamicFormValues.alamat = alamatAlm;
      dynamicFormValues.alamat_lengkap = alamatAlm;

      dynamicFormValues.hari_dan_tanggal_kematian = deathDayDateFmt;
      dynamicFormValues.hari_tanggal_kematian = deathDayDateFmt;
      dynamicFormValues.jam_kematian = deathTime;
      dynamicFormValues.waktu_kematian = deathTime;
      dynamicFormValues.hari_dan_tanggal_pemakaman = burialDayDateFmt;
      dynamicFormValues.hari_tanggal_pemakaman = burialDayDateFmt;
      dynamicFormValues.jam_pemakaman = burialTime;
      dynamicFormValues.waktu_pemakaman = burialTime;
      dynamicFormValues.tempat_pemakaman = burialLoc;
      dynamicFormValues.lokasi_pemakaman = burialLoc;
    }

    const isKeteranganUmumLetter =
      !isSkckLetter &&
      !isKehilanganLetter &&
      !isKeramaianLetter &&
      !isPemakamanLetter &&
      !isIzinKeluargaLetter &&
      !isSuratJalanLetter &&
      !isSuratKuasaLetter &&
      (matchedMaster?.id === 'prm-03' ||
        ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === 's-01' ||
        (((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === '400.7.22.1' &&
          !(submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('skck') &&
          !(submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('kehilangan') &&
          !(submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('keramaian') &&
          !(submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('kepolisian')) ||
        (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('pengantar umum') ||
        (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('keterangan umum') ||
        (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().trim() === 'surat pengantar' ||
        (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().trim() === 'surat keterangan' ||
        ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('keterangan-pengantar') ||
        ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('pengantar-umum') ||
        ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('keterangan-umum'));

    if (isKeteranganUmumLetter) {
      const nama = toTitleCaseIndonesian(fd.name || fd.nama || submission.requesterName || formattedIndividu.nama || '-');
      const nik = fd.nik || submission.nik || formattedIndividu.nik || '-';
      const tmpLahir = fd.birthPlace || fd.tempatLahir || (residentMap[nik])?.placeOfBirth || identity.namaKabupaten;
      const tglLahir = fd.birthDate || fd.tanggalLahir || (residentMap[nik])?.dateOfBirth || '';
      const normTglLahir = tglLahir && tglLahir !== '-' ? normalizeDateInput(tglLahir) : null;
      const tglLahirFmt = normTglLahir ? formatTanggalIndonesia(normTglLahir) : (tglLahir || '-');
      const ttl = (tmpLahir && tglLahirFmt !== '-') ? `${toTitleCaseIndonesian(tmpLahir)}, ${tglLahirFmt}` : (toTitleCaseIndonesian(tmpLahir) || tglLahirFmt || '-');
      const kelamin = String(fd.gender || fd.jenisKelamin || (residentMap[nik])?.gender || 'Laki-Laki').toUpperCase();
      const kerja = toTitleCaseIndonesian(fd.job || fd.pekerjaan || (residentMap[nik])?.occupation || 'Belum/Tidak Bekerja');
      const alamat = fd.address || fd.alamat || (residentMap[nik])?.address || formattedIndividu.alamat || `Desa ${identity.namaDesa}, Kec. ${identity.namaKecamatan}`;
      const keperluan = fd.purpose || fd.keperluan || fd.form_keperluan || 'BPJS Kesehatan';

      dynamicFormValues.nama = nama;
      dynamicFormValues.nik = nik;
      dynamicFormValues.nomor_nik = nik;
      dynamicFormValues.tempat_tanggal_lahir = ttl;
      dynamicFormValues.ttl = ttl;
      dynamicFormValues.jenis_kelamin = kelamin;
      dynamicFormValues.pekerjaan = kerja;
      dynamicFormValues.alamat = alamat;
      dynamicFormValues.alamat_lengkap = alamat;
      dynamicFormValues.keperluan = keperluan;
      dynamicFormValues.form_keperluan = keperluan;
      dynamicFormValues['[form_keperluan]'] = keperluan;
    }

    const isSuratSktmLetter =
      !isPemakamanLetter &&
      (((submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('tidak mampu') ||
        (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('kurang mampu') ||
        ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('kurang-mampu') ||
        ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('tidak-mampu') ||
        ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === 's-11' ||
        matchedMaster?.id === 'prm-12') &&
        !(submission.letterType || '').toLowerCase().includes('pemakaman') &&
        !((submission as any).urlSurat || '').toLowerCase().includes('pemakaman'));

    if (isSuratSktmLetter) {
      // 1. Data Pemohon
      const pemohonNama = toTitleCaseIndonesian(fd.applicantName || submission.requesterName || formattedIndividu.nama || '-');
      const pemohonNik = fd.applicantNik || submission.nik || formattedIndividu.nik || '-';
      const rawPemohonTmp = fd.applicantBirthPlace || formattedIndividu.tempat_lahir || identity.namaKabupaten;
      const rawPemohonTgl = fd.applicantBirthDate || formattedIndividu.tanggal_lahir || '';
      const normPemohonTgl = rawPemohonTgl && rawPemohonTgl !== '-' ? normalizeDateInput(rawPemohonTgl) : null;
      const tglPemohonFmt = normPemohonTgl ? formatTanggalIndonesia(normPemohonTgl) : (rawPemohonTgl || '-');
      const pemohonTtl = rawPemohonTmp && tglPemohonFmt !== '-' ? `${toTitleCaseIndonesian(rawPemohonTmp)}, ${tglPemohonFmt}` : (toTitleCaseIndonesian(rawPemohonTmp) || tglPemohonFmt || '-');
      const pemohonKelamin = String(fd.applicantGender || formattedIndividu.jenis_kelamin || 'Perempuan').toUpperCase();
      const pemohonAgama = String(fd.applicantReligion || formattedIndividu.agama || 'Islam').toUpperCase();
      const pemohonKerja = toTitleCaseIndonesian(fd.applicantJob || formattedIndividu.pekerjaan || 'Karyawan Swasta');
      const pemohonAlamat = toTitleCaseIndonesian(fd.applicantAddress || formattedIndividu.alamat || `Desa ${identity.namaDesa}, Kec. ${identity.namaKecamatan}`);
      const keperluan = String(fd.purpose || fd.form_keperluan || 'Keringanan Biaya Sekolah').toUpperCase();

      dynamicFormValues.nama_pemohon = pemohonNama;
      dynamicFormValues.nik_pemohon = pemohonNik;
      dynamicFormValues.ttl_pemohon = pemohonTtl;
      dynamicFormValues.jenis_kelamin_pemohon = pemohonKelamin;
      dynamicFormValues.agama_pemohon = pemohonAgama;
      dynamicFormValues.pekerjaan_pemohon = pemohonKerja;
      dynamicFormValues.alamat_pemohon = pemohonAlamat;
      dynamicFormValues.form_keperluan = keperluan;

      // 2. Data Anak (jika pengajuan untuk anak)
      const isModeAnak = fd.submissionType === 'child' || Boolean(fd.childName || fd.form_nama_anak);
      if (isModeAnak) {
        const anakNama = toTitleCaseIndonesian(fd.childName || fd.form_nama_anak || '-');
        const anakNik = fd.childNik || fd.form_nik_anak || '-';
        const rawAnakTmp = fd.childBirthPlace || fd.form_tempat_lahir_anak || identity.namaKabupaten;
        const rawAnakTgl = fd.childBirthDate || fd.form_tanggal_lahir_anak || '';
        const normAnakTgl = rawAnakTgl && rawAnakTgl !== '-' ? normalizeDateInput(rawAnakTgl) : null;
        const tglAnakFmt = normAnakTgl ? formatTanggalIndonesia(normAnakTgl) : (rawAnakTgl || '-');
        const anakTtl = rawAnakTmp && tglAnakFmt !== '-' ? `${toTitleCaseIndonesian(rawAnakTmp)}, ${tglAnakFmt}` : (toTitleCaseIndonesian(rawAnakTmp) || tglAnakFmt || '-');
        const anakKelamin = String(fd.childGender || fd.form_jenis_kelamin_anak || 'Laki-Laki').toUpperCase();
        const anakKerja = toTitleCaseIndonesian(fd.childJob || fd.form_pekerjaan_anak || 'Belum / Tidak Bekerja');
        const anakAlamat = toTitleCaseIndonesian(fd.childAddress || fd.form_alamat_anak || pemohonAlamat);

        dynamicFormValues.form_nama_anak = anakNama;
        dynamicFormValues.nama_anak = anakNama;
        dynamicFormValues.form_nik_anak = anakNik;
        dynamicFormValues.nik_anak = anakNik;
        dynamicFormValues.form_ttl_anak = anakTtl;
        dynamicFormValues.ttl_anak = anakTtl;
        dynamicFormValues.form_jenis_kelamin_anak = anakKelamin;
        dynamicFormValues.jenis_kelamin_anak = anakKelamin;
        dynamicFormValues.form_pekerjaan_anak = anakKerja;
        dynamicFormValues.pekerjaan_anak = anakKerja;
        dynamicFormValues.form_alamat_anak = anakAlamat;
        dynamicFormValues.alamat_anak = anakAlamat;
      }

      // 3. Saksi-Saksi
      const saksi1Nama = toTitleCaseIndonesian(fd.witness1Name || fd.form_nama_saksi_1 || fd.nama_saksi_1 || 'Slamet Riyadi');
      const saksi1Nik = fd.witness1Nik || fd.form_nik_saksi_1 || fd.nik_saksi_1 || '-';
      const saksi1Kerja = toTitleCaseIndonesian(fd.witness1Job || fd.form_pekerjaan_saksi_1 || fd.pekerjaan_saksi_1 || 'Wiraswasta');
      const saksi1Alamat = toTitleCaseIndonesian(fd.witness1Address || fd.form_alamat_saksi_1 || fd.alamat_saksi_1 || '-');

      const saksi2Nama = toTitleCaseIndonesian(fd.witness2Name || fd.form_nama_saksi_2 || fd.nama_saksi_2 || 'Bambang Sutrisno');
      const saksi2Nik = fd.witness2Nik || fd.form_nik_saksi_2 || fd.nik_saksi_2 || '-';
      const saksi2Kerja = toTitleCaseIndonesian(fd.witness2Job || fd.form_pekerjaan_saksi_2 || fd.pekerjaan_saksi_2 || 'Perangkat Desa');
      const saksi2Alamat = toTitleCaseIndonesian(fd.witness2Address || fd.form_alamat_saksi_2 || fd.alamat_saksi_2 || '-');

      dynamicFormValues.witness1Name = saksi1Nama;
      dynamicFormValues.witness1Nik = saksi1Nik;
      dynamicFormValues.witness1Job = saksi1Kerja;
      dynamicFormValues.witness1Address = saksi1Alamat;
      dynamicFormValues.witness2Name = saksi2Nama;
      dynamicFormValues.witness2Nik = saksi2Nik;
      dynamicFormValues.witness2Job = saksi2Kerja;
      dynamicFormValues.witness2Address = saksi2Alamat;

      if (!resolvedPelakuBagian.saksi_1) {
        resolvedPelakuBagian.saksi_1 = { nama: saksi1Nama, nik: saksi1Nik, pekerjaan: saksi1Kerja, alamat: saksi1Alamat } as any;
      }
      if (!resolvedPelakuBagian.saksi_2) {
        resolvedPelakuBagian.saksi_2 = { nama: saksi2Nama, nik: saksi2Nik, pekerjaan: saksi2Kerja, alamat: saksi2Alamat } as any;
      }
    }

    const isPenghasilanOrtuLetter =
      matchedMaster?.id === 'prm-21' ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === 's-42' ||
      (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('penghasilan orang tua') ||
      (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('penghasilan ortu') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('penghasilan-orang-tua');

    if (isPenghasilanOrtuLetter) {
      // 1. Data Anak / Siswa / Mahasiswa
      const anakRes = (fd.childNik && residentMap[fd.childNik]) ? residentMap[fd.childNik] : null;
      const anakNama = toTitleCaseIndonesian(fd.childName || fd.form_nama_anak || anakRes?.fullName || 'Ari Mariyono');
      const anakNik = fd.childNik || fd.form_nik_anak || anakRes?.nik || '3301100603940005';
      const rawAnakTmp = fd.childBirthPlace || fd.form_tempat_lahir_anak || anakRes?.placeOfBirth || identity.namaKabupaten;
      const rawAnakTgl = fd.childBirthDate || fd.form_tanggal_lahir_anak || anakRes?.dateOfBirth || '';
      const normAnakTgl = rawAnakTgl && rawAnakTgl !== '-' ? normalizeDateInput(rawAnakTgl) : null;
      const tglAnakFmt = normAnakTgl ? formatTanggalIndonesia(normAnakTgl) : (rawAnakTgl || '-');
      const anakTtl = rawAnakTmp && tglAnakFmt !== '-' ? `${toTitleCaseIndonesian(rawAnakTmp)}, ${tglAnakFmt}` : (toTitleCaseIndonesian(rawAnakTmp) || tglAnakFmt || '-');
      const anakKelamin = toTitleCaseIndonesian(fd.childGender || fd.form_jenis_kelamin_anak || anakRes?.gender || 'Laki-Laki');
      const anakAgama = toTitleCaseIndonesian(fd.childReligion || fd.form_agama_anak || anakRes?.religion || 'Islam');
      const sekolah = toTitleCaseIndonesian(fd.schoolName || fd.form_sekolahperguruan_tinggi || fd['[form_sekolahperguruan_tinggi]'] || '-');
      const nisn = fd.childNis || fd.nisn || fd.nim || fd.form_nomor_induk_siswamahasiswa || fd['[form_nomor_induk_siswamahasiswa]'] || '-';
      const jurusan = toTitleCaseIndonesian(fd.childMajor || fd.jurusan || fd.prodi || fd.form_jurusanfakultasprodi || fd['[form_jurusanfakultasprodi]'] || '-');
      const kelas = toTitleCaseIndonesian(fd.childClass || fd.kelas || fd.semester || fd.form_kelassemester || fd['[form_kelassemester]'] || '-');
      const anakAlamat = toTitleCaseIndonesian(fd.childAddress || fd.form_alamat_anak || formattedIndividu.alamat || `Desa ${identity.namaDesa}, Kec. ${identity.namaKecamatan}`);

      // 2. Data Ayah
      const ayahRes = (fd.fatherNik && residentMap[fd.fatherNik]) ? residentMap[fd.fatherNik] : null;
      const ayahNama = toTitleCaseIndonesian(fd.fatherName || fd.namaAyah || (fd.gender === 'Laki-laki' ? fd.name : '') || submission.requesterName || ayahRes?.fullName || 'Sugiono');
      const ayahNik = fd.fatherNik || fd.nikAyah || (fd.gender === 'Laki-laki' ? fd.nik : '') || ayahRes?.nik || '-';
      const rawAyahTmp = fd.fatherBirthPlace || ayahRes?.placeOfBirth || identity.namaKabupaten;
      const rawAyahTgl = fd.fatherBirthDate || ayahRes?.dateOfBirth || '';
      const normAyahTgl = rawAyahTgl && rawAyahTgl !== '-' ? normalizeDateInput(rawAyahTgl) : null;
      const tglAyahFmt = normAyahTgl ? formatTanggalIndonesia(normAyahTgl) : (rawAyahTgl || '-');
      const ayahTtl = rawAyahTmp && tglAyahFmt !== '-' ? `${toTitleCaseIndonesian(rawAyahTmp)}, ${tglAyahFmt}` : (toTitleCaseIndonesian(rawAyahTmp) || tglAyahFmt || '-');
      const ayahKerja = toTitleCaseIndonesian(fd.fatherJob || fd.job || ayahRes?.occupation || 'Petani / Pekebun');
      const ayahAlamat = toTitleCaseIndonesian(fd.fatherAddress || fd.address || ayahRes?.address || formattedIndividu.alamat || `Desa ${identity.namaDesa}, Kec. ${identity.namaKecamatan}`);
      const rawPenghasilanAyah = fd.fatherIncome || fd.penghasilanAyah || fd.monthlyIncome || '1500000';
      const numPenghasilanAyah = Number(String(rawPenghasilanAyah).replace(/[^0-9]/g, '')) || 0;
      const strPenghasilanAyah = numPenghasilanAyah > 0 ? `Rp ${numPenghasilanAyah.toLocaleString('id-ID')}` : 'Rp 0';
      const terbilangAyah = numPenghasilanAyah > 0 ? `${toTitleCaseIndonesian(terbilangIndonesia(numPenghasilanAyah))} Rupiah` : 'Nol Rupiah';

      // 3. Data Ibu
      const ibuRes = (fd.motherNik && residentMap[fd.motherNik]) ? residentMap[fd.motherNik] : null;
      const ibuNama = toTitleCaseIndonesian(fd.motherName || fd.namaIbu || (fd.gender === 'Perempuan' ? fd.name : '') || ibuRes?.fullName || 'Suminah');
      const ibuNik = fd.motherNik || fd.nikIbu || (fd.gender === 'Perempuan' ? fd.nik : '') || ibuRes?.nik || '-';
      const rawIbuTmp = fd.motherBirthPlace || ibuRes?.placeOfBirth || identity.namaKabupaten;
      const rawIbuTgl = fd.motherBirthDate || ibuRes?.dateOfBirth || '';
      const normIbuTgl = rawIbuTgl && rawIbuTgl !== '-' ? normalizeDateInput(rawIbuTgl) : null;
      const tglIbuFmt = normIbuTgl ? formatTanggalIndonesia(normIbuTgl) : (rawIbuTgl || '-');
      const ibuTtl = rawIbuTmp && tglIbuFmt !== '-' ? `${toTitleCaseIndonesian(rawIbuTmp)}, ${tglIbuFmt}` : (toTitleCaseIndonesian(rawIbuTmp) || tglIbuFmt || '-');
      const ibuKerja = toTitleCaseIndonesian(fd.motherJob || ibuRes?.occupation || 'Ibu Rumah Tangga');
      const ibuAlamat = toTitleCaseIndonesian(fd.motherAddress || fd.address || ibuRes?.address || formattedIndividu.alamat || `Desa ${identity.namaDesa}, Kec. ${identity.namaKecamatan}`);
      const rawPenghasilanIbu = fd.motherIncome || fd.penghasilanIbu || '0';
      const numPenghasilanIbu = Number(String(rawPenghasilanIbu).replace(/[^0-9]/g, '')) || 0;
      const strPenghasilanIbu = numPenghasilanIbu > 0 ? `Rp ${numPenghasilanIbu.toLocaleString('id-ID')}` : 'Rp 0';
      const terbilangIbu = numPenghasilanIbu > 0 ? `${toTitleCaseIndonesian(terbilangIndonesia(numPenghasilanIbu))} Rupiah` : 'Nol Rupiah';

      // 4. Total & Keperluan
      const numTotal = (numPenghasilanAyah + numPenghasilanIbu > 0)
        ? numPenghasilanAyah + numPenghasilanIbu
        : (Number(String(fd.monthlyIncome).replace(/[^0-9]/g, '')) || 1500000);
      const strTotal = `Rp ${numTotal.toLocaleString('id-ID')}`;
      const terbilangTotal = `${toTitleCaseIndonesian(terbilangIndonesia(numTotal))} Rupiah`;
      const tanggungan = String(fd.dependentsCount || fd.jumlahTanggungan || '3').replace(/[^0-9]/g, '') || '3';
      const keperluan = toTitleCaseIndonesian(fd.purpose || fd.form_keperluan || 'Persyaratan Beasiswa / KIP Kuliah');

      // Petakan ke dynamicFormValues
      dynamicFormValues.nama_anak = anakNama;
      dynamicFormValues.form_nama_anak = anakNama;
      dynamicFormValues.nik_anak = anakNik;
      dynamicFormValues.form_nik_anak = anakNik;
      dynamicFormValues.ttl_anak = anakTtl;
      dynamicFormValues.form_ttl_anak = anakTtl;
      dynamicFormValues.jenis_kelamin_anak = anakKelamin;
      dynamicFormValues.form_jenis_kelamin_anak = anakKelamin;
      dynamicFormValues.agama_anak = anakAgama;
      dynamicFormValues.form_agama_anak = anakAgama;
      dynamicFormValues.alamat_anak = anakAlamat;
      dynamicFormValues.form_alamat_anak = anakAlamat;
      dynamicFormValues.schoolName = sekolah;
      dynamicFormValues.form_sekolahperguruan_tinggi = sekolah;
      dynamicFormValues['[form_sekolahperguruan_tinggi]'] = sekolah;
      dynamicFormValues.childNis = nisn;
      dynamicFormValues.form_nomor_induk_siswamahasiswa = nisn;
      dynamicFormValues['[form_nomor_induk_siswamahasiswa]'] = nisn;
      dynamicFormValues.childMajor = jurusan;
      dynamicFormValues.form_jurusanfakultasprodi = jurusan;
      dynamicFormValues['[form_jurusanfakultasprodi]'] = jurusan;
      dynamicFormValues.childClass = kelas;
      dynamicFormValues.form_kelassemester = kelas;
      dynamicFormValues['[form_kelassemester]'] = kelas;

      dynamicFormValues.nama_ayah = ayahNama;
      dynamicFormValues.nik_ayah = ayahNik;
      dynamicFormValues.ttl_ayah = ayahTtl;
      dynamicFormValues.pekerjaan_ayah = ayahKerja;
      dynamicFormValues.alamat_ayah = ayahAlamat;
      dynamicFormValues.form_penghasilan_ayah = strPenghasilanAyah;
      dynamicFormValues.terbilang_penghasilan_ayah = terbilangAyah;

      dynamicFormValues.nama_ibu = ibuNama;
      dynamicFormValues.nik_ibu = ibuNik;
      dynamicFormValues.ttl_ibu = ibuTtl;
      dynamicFormValues.pekerjaan_ibu = ibuKerja;
      dynamicFormValues.alamat_ibu = ibuAlamat;
      dynamicFormValues.form_penghasilan_ibu = strPenghasilanIbu;
      dynamicFormValues.terbilang_penghasilan_ibu = terbilangIbu;

      dynamicFormValues.total_penghasilan_orang_tua = strTotal;
      dynamicFormValues.terbilang_total_penghasilan = terbilangTotal;
      dynamicFormValues.form_jumlah_tanggungan = tanggungan;
      dynamicFormValues.form_keperluan = keperluan;

      if (!resolvedPelakuBagian.ayah) {
        resolvedPelakuBagian.ayah = { nama: ayahNama, nik: ayahNik, tempat_lahir: rawAyahTmp, tanggal_lahir: rawAyahTgl, pekerjaan: ayahKerja, alamat: ayahAlamat } as any;
      }
      if (!resolvedPelakuBagian.ibu) {
        resolvedPelakuBagian.ibu = { nama: ibuNama, nik: ibuNik, tempat_lahir: rawIbuTmp, tanggal_lahir: rawIbuTgl, pekerjaan: ibuKerja, alamat: ibuAlamat } as any;
      }
    }

    const isReaktivasiBpjsLetter =
      matchedMaster?.id === 'prm-09' ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === 's-15' ||
      (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('reaktivasi bpjs') ||
      (submission.letterType || matchedMaster?.jenisSurat || '').toLowerCase().includes('jamkesos') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('jamkesos') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('bpjs');

    if (isReaktivasiBpjsLetter) {
      const rekamMedis = fd.rekamMedis || fd.form_rekam_medis || fd.noRekamMedis || '0000003';
      const jenisPenyakit = fd.jenisPenyakit || fd.form_jenis_penyakit || fd.diagnosa || 'Gagal Ginjal';
      const noBpjs = fd.noBpjs || fd.form_no_bpjs || fd.noBpjsKesehatan || fd.noKartu || fd.form_no_kartu_jamkesos || '0000000006677';

      dynamicFormValues.rekamMedis = rekamMedis;
      dynamicFormValues.form_rekam_medis = rekamMedis;
      dynamicFormValues['[form_rekam_medis]'] = rekamMedis;

      dynamicFormValues.jenisPenyakit = jenisPenyakit;
      dynamicFormValues.form_jenis_penyakit = jenisPenyakit;
      dynamicFormValues['[form_jenis_penyakit]'] = jenisPenyakit;

      dynamicFormValues.noBpjs = noBpjs;
      dynamicFormValues.form_no_bpjs = noBpjs;
      dynamicFormValues['[form_no_bpjs]'] = noBpjs;
    }



    const effectiveLetterheadUrl = kopInfo?.letterheadImageUrl || globalSettings.letterheadImageUrl;

    const isSekdes = signerQuery === 'sekdes';

    // Format Penandatanganan Sekretaris Desa sesuai contoh:
    // Kepala Desa Sampeldes
    // a.n Kepala Desa
    // (space)
    // NAMA SEKRETARIS DESA (HURUF BESAR SEMUA)
    const resolvedAtasNama = isSekdes
      ? `Kepala ${identity.sebutanDesa} ${identity.namaDesa}<br />a.n Kepala ${identity.sebutanDesa}`
      : `Kepala ${identity.sebutanDesa} ${identity.namaDesa}`;
    const resolvedJabatan = isSekdes
      ? `a.n Kepala ${identity.sebutanDesa}`
      : `Kepala ${identity.sebutanDesa}`;
    // Nama penandatangan (Kepala Desa maupun Sekretaris Desa) selalu huruf besar semua (UPPERCASE)
    const resolvedNamaPamong = isSekdes
      ? (identity.namaSekretarisDesa || 'PRIYO SUMARNO').toUpperCase()
      : (identity.namaKepalaDesa || 'TUKIMAN').toUpperCase();

    const isQrActive = ttdMode === 'qr';

    const rawFamily = (fd.familyMembers || fd.anggotaKeluarga || []) as any[];
    const normalizedFamilyMembers = rawFamily.map((m: any) => {
      const r = (m.nik && residentMap[m.nik]) ? residentMap[m.nik] : null;
      return {
        ...m,
        nik: m.nik || r?.nik || '',
        nama: toTitleCaseIndonesian(m.nama || m.name || m.fullName || r?.fullName || ''),
        shdk: toTitleCaseIndonesian(m.shdk || m.relationship || m.hubungan || (r as any)?.familyStatus || 'Anggota Keluarga'),
        masa_berlaku: m.masa_berlaku || m.masaBerlaku || 'SEUMUR HIDUP',
        tempat_lahir: m.tempat_lahir || m.tempatLahir || r?.placeOfBirth || '',
        tanggal_lahir: m.tanggal_lahir || m.tanggalLahir || r?.dateOfBirth || '',
        jenis_kelamin: m.jenis_kelamin || m.gender || m.jk || r?.gender || '',
        agama: m.agama || r?.religion || 'Islam',
        pendidikan_kk: m.pendidikan_kk || m.pendidikan || (r as any)?.education || r?.educationLevel || '',
        pekerjaan: m.pekerjaan || r?.occupation || '',
        status_kawin: m.status_kawin || m.statusKawin || r?.maritalStatus || '',
        golongan_darah: m.golongan_darah || m.golDarah || r?.bloodType || '',
        warga_negara: m.warga_negara || m.kewarganegaraan || (r as any)?.citizenship || r?.nationality || 'WNI',
        nama_ibu: m.nama_ibu || m.namaIbu || r?.motherName || '',
        nik_ibu: m.nik_ibu || m.nikIbu || (r as any)?.nik_ibu || '',
        nama_ayah: m.nama_ayah || m.namaAyah || r?.fatherName || '',
        nik_ayah: m.nik_ayah || m.nikAyah || (r as any)?.nik_ayah || '',
        no_akta_lahir: m.no_akta_lahir || m.noAktaLahir || (r as any)?.birthCertificateNo || '',
        no_akta_kawin: m.no_akta_kawin || m.noAktaKawin || (r as any)?.marriageCertificateNo || '',
        tgl_kawin: m.tgl_kawin || m.tglKawin || (r as any)?.marriageDate || '',
        no_akta_cerai: m.no_akta_cerai || m.noAktaCerai || (r as any)?.divorceCertificateNo || '',
        tgl_cerai: m.tgl_cerai || m.tglCerai || (r as any)?.divorceDate || '',
        paspor: m.paspor || m.nomor_paspor || m.nomorPaspor || (r as any)?.passportNo || '',
        tgl_paspor: m.tgl_paspor || m.tglPaspor || (r as any)?.passportExpiry || '',
        cacat: m.cacat || (r as any)?.disability || '',
      };
    });

    const ctx: OpenSidRenderContext = {
      judulSurat: isSuratKuasaLetter
        ? 'SURAT KUASA'
        : isSuratJalanLetter
          ? 'SURAT KETERANGAN JALAN/BERPERGIAN'
          : isPemakamanLetter
            ? 'SURAT KETERANGAN PEMAKAMAN'
            : isIzinKeluargaLetter
              ? 'SURAT KETERANGAN IZIN KELUARGA'
              : isSkckLetter
                ? 'SURAT PENGANTAR SKCK'
                : isKehilanganLetter
                  ? 'SURAT PENGANTAR KEHILANGAN'
                  : isKeramaianLetter
                    ? 'SURAT IJIN KERAMAIAN'
                    : isKeteranganUmumLetter
                      ? 'SURAT PENGANTAR UMUM'
                      : submission.letterType,
      nomorSurat: normalizeRomanNumeralsInDocNumber(submission.documentNumber || (submission as any).docNumber || '-'),
      kodeSurat: isSuratKuasaLetter
        ? (matchedMaster.kodeSurat || 'S-47')
        : isSuratJalanLetter
          ? (matchedMaster.kodeSurat || '470')
          : isPemakamanLetter
            ? '474.3'
            : isIzinKeluargaLetter
              ? (matchedMaster.kodeSurat || '140')
              : isSkckLetter
                ? (matchedMaster.kodeSurat || '400.7.22.1')
                : isKehilanganLetter
                  ? (matchedMaster.kodeSurat || '400.7.22.1')
                  : isKeramaianLetter
                    ? (matchedMaster.kodeSurat || '100.3.12')
                    : isKeteranganUmumLetter
                      ? (matchedMaster.kodeSurat || '400.7.22.1')
                      : (matchedMaster.kodeSurat || '470'),
      tanggalSurat: formatTanggalIndonesia(new Date()),
      hariSurat: getNamaHariIndonesia(new Date()),
      mulaiBerlaku: fd.mulaiBerlaku || formatTanggalIndonesia(new Date()),
      berlakuSampai: fd.berlakuSampai || '-',
      logoGaruda: Boolean(matchedMaster.logoGaruda),
      qrCode: isQrActive,
      submissionId: submission.id,
      signerCode: signerQuery || 'kades',
      qrSettings: {
        ...matchedMaster.qrSettings,
        enabled: isQrActive,
      },
      letterheadImageUrl: effectiveLetterheadUrl,
      villageLogoUrl,
      namaDesa: identity.namaDesa,
      sebutanDesa: identity.sebutanDesa,
      kodeDesa: identity.kodeDesa,
      kodePos: identity.kodePos,
      alamatDesa: identity.alamatDesa,
      emailDesa: identity.emailDesa,
      teleponDesa: identity.teleponDesa,
      websiteDesa: identity.websiteDesa,
      namaKecamatan: identity.namaKecamatan,
      sebutanKecamatan: identity.sebutanKecamatan,
      kodeKecamatan: identity.kodeKecamatan,
      namaCamat: identity.namaCamat,
      nipCamat: identity.nipCamat,
      pangkatCamat: identity.pangkatCamat,
      namaDanramil: identity.namaDanramil,
      nrpDanramil: identity.nrpDanramil,
      jabatanDanramil: identity.jabatanDanramil,
      namaKapolsek: identity.namaKapolsek,
      nrpKapolsek: identity.nrpKapolsek,
      jabatanKapolsek: identity.jabatanKapolsek,
      namaKua: identity.namaKua,
      namaKepalaKua: identity.namaKepalaKua,
      namaKabupaten: identity.namaKabupaten,
      sebutanKabupaten: identity.sebutanKabupaten,
      kodeKabupaten: identity.kodeKabupaten,
      namaKadisDukcapil: identity.namaKadisDukcapil,
      nipKadisDukcapil: identity.nipKadisDukcapil,
      namaProvinsi: identity.namaProvinsi,
      sebutanProvinsi: identity.sebutanProvinsi,
      kodeProvinsi: identity.kodeProvinsi,
      namaKepalaDesa: (identity.namaKepalaDesa || 'TUKIMAN').toUpperCase(),
      nipKepalaDesa: identity.nipKepalaDesa,
      namaSekretarisDesa: (identity.namaSekretarisDesa || 'PRIYO SUMARNO').toUpperCase(),
      nipSekretarisDesa: identity.nipSekretarisDesa,
      atasNama: resolvedAtasNama,
      jabatanPamong: resolvedJabatan,
      namaPamong: resolvedNamaPamong,
      individu: formattedIndividu,
      pelakuBagian: resolvedPelakuBagian,
      formValues: dynamicFormValues,
      familyMembers: normalizedFamilyMembers,
      requesterName: submission.requesterName || fd.fullName || fd.name || '',
    };

    const activeLampiranCatalog =
      dbLampiranItems && dbLampiranItems.length > 0 ? dbLampiranItems : MASTER_LAMPIRAN_SURAT;

    // Kumpulkan seluruh kode lampiran dari berbagai sumber (master surat, form data, dan auto-match surat terkait)
    let rawCandidateLampirans: string[] = [];

    // Sumber 1: Master surat lampiran
    if (Array.isArray(matchedMaster.lampiran) && matchedMaster.lampiran.length > 0) {
      rawCandidateLampirans.push(...matchedMaster.lampiran);
    }

    // Sumber 2: Form data submission (jika tersimpan lampiran spesifik)
    if (Array.isArray(fd.lampiran) && fd.lampiran.length > 0) {
      rawCandidateLampirans.push(...fd.lampiran);
    } else if (typeof fd.lampiran === 'string' && fd.lampiran.trim()) {
      rawCandidateLampirans.push(...fd.lampiran.split(',').map((s: string) => s.trim()));
    }

    // Sumber 3: Auto-match berdasarkan jenis surat jika kandidat masih kosong
    if (rawCandidateLampirans.length === 0) {
      const letterName = (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().trim();
      const matchedFromCatalog = activeLampiranCatalog
        .filter((lamp) => {
          if (!lamp.suratTerkait || lamp.suratTerkait.length === 0) return false;
          return lamp.suratTerkait.some((terkait) => {
            const t = terkait.toLowerCase().trim();
            return (
              letterName.includes(t) ||
              t.includes(letterName) ||
              letterName.replace(/[^a-z0-9]/g, '') === t.replace(/[^a-z0-9]/g, '')
            );
          });
        })
        .map((l) => l.kode);

      rawCandidateLampirans.push(...matchedFromCatalog);
    }

    if (isSuratLahirMati && !rawCandidateLampirans.some(l => l.toUpperCase().includes('F-2.09') || l.toUpperCase().includes('F2.09'))) {
      rawCandidateLampirans.push('F-2.09');
    }

    const isSuratBiodata =
      (submission.letterType || '').toLowerCase().includes('biodata penduduk') ||
      (submission.letterType || '').toLowerCase().includes('f-1.01') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('biodata') ||
      matchedMaster.kodeSurat?.toLowerCase() === 's-03';

    if (isSuratBiodata && !rawCandidateLampirans.some(l => l.toUpperCase().includes('F-1.01') || l.toUpperCase().includes('F1.01'))) {
      rawCandidateLampirans.push('F-1.01');
    }

    const isSuratBedaNamaLetter =
      (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('beda nama') ||
      (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('beda identitas') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('beda-nama') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('beda-identitas') ||
      matchedMaster.kodeSurat === '471.1';

    if (isSuratBedaNamaLetter && !rawCandidateLampirans.some(l => l.toUpperCase().includes('SPTJM-BN') || l.toUpperCase().includes('SPTJM'))) {
      rawCandidateLampirans.push('SPTJM-BN');
    }

    if (isSuratNikah) {
      rawCandidateLampirans.length = 0;
      rawCandidateLampirans.push('Model N-1', 'Model N-2', 'Model N-4', 'Model N-5', 'Model N-6', 'SPS', 'SWN');
    }

    if (isNikahNonMuslimLetter) {
      rawCandidateLampirans.length = 0;
      rawCandidateLampirans.push('F-2.12', 'F-2.01 Perkawinan');
    }

    const isSuratBelumMenikahLetter =
      (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('belum pernah menikah') ||
      (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('belum menikah') ||
      (submission.letterType || matchedMaster.jenisSurat || '').toLowerCase().includes('belum kawin') ||
      ((submission as any).urlSurat || '').toLowerCase().includes('belum-menikah') ||
      matchedMaster.kodeSurat === '470' ||
      matchedMaster.kodeSurat?.toLowerCase() === 's-18';

    if (isSuratBelumMenikahLetter && !rawCandidateLampirans.some(l => l.toUpperCase().includes('SP-BM') || l.toUpperCase().includes('BELUM MENIKAH'))) {
      rawCandidateLampirans.push('SP-BM');
    }

    if (isSuratSktmLetter && !isPemakamanLetter && !rawCandidateLampirans.some(l => l.toUpperCase().includes('SP-SKTM') || l.toUpperCase().includes('SKTM'))) {
      rawCandidateLampirans.push('SP-SKTM');
    }

    if (isPemakamanLetter) {
      // Pastikan tidak ada lampiran SKTM sama sekali pada surat pemakaman
      rawCandidateLampirans = rawCandidateLampirans.filter(l => !l.toUpperCase().includes('SKTM'));
    }

    // Hapus duplikasi dengan mempertahankan urutan
    const uniqueLampiranCodes = Array.from(new Set(rawCandidateLampirans.filter(Boolean)));

    const lampiranSheets = renderLampiranPagesForLetter(
      uniqueLampiranCodes,
      ctx,
      activeLampiranCatalog,
    );

    const effectiveGlobalSettings: OpenSidGlobalSuratSettings = {
      ...globalSettings,
      letterheadImageUrl: effectiveLetterheadUrl,
    };

    let effectiveCustomHtml = customHtmlOverride || (fd.openSidCustomKonsepHtml as string) || undefined;
    if (isSuratKematian && effectiveCustomHtml && (!effectiveCustomHtml.toLowerCase().includes('meninggal dunia') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
      effectiveCustomHtml = undefined;
    }
    const isSuratDomisili =
      ((submission.letterType || '').toLowerCase().includes('domisili') ||
        (submission as any).urlSurat?.toLowerCase().includes('domisili')) &&
      !((submission.letterType || '').toLowerCase().includes('usaha') ||
        (submission as any).urlSurat?.toLowerCase().includes('usaha'));
    if (isSuratDomisili && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT KETERANGAN DOMISILI') || effectiveCustomHtml.includes('width: 30.5174%'))) {
      effectiveCustomHtml = undefined;
    }
    const isSuratPerubahanKk =
      (submission.letterType || '').toLowerCase().includes('perubahan kartu keluarga') ||
      (submission.letterType || '').toLowerCase().includes('perubahan kk') ||
      (submission as any).urlSurat?.toLowerCase().includes('perubahan-kartu-keluarga');
    if (isSuratPerubahanKk && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT PERMOHONAN PERUBAHAN KARTU KELUARGA') || effectiveCustomHtml.includes('>No</td>'))) {
      effectiveCustomHtml = undefined;
    }
    if (isSuratNikah && effectiveCustomHtml && (effectiveCustomHtml.includes('NUMPANG NIKAH') || effectiveCustomHtml.includes('[NAma_dcpw]'))) {
      effectiveCustomHtml = undefined;
    }
    if (isDuplikatNikahLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('1. Data Suami') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
      effectiveCustomHtml = undefined;
    }
    if (isNikahNonMuslimLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('WARGA NON MUSLIM') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
      effectiveCustomHtml = undefined;
    }
    if (isCeraiRujukLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT PENGANTAR CERAI / RUJUK') || effectiveCustomHtml.includes('berdasarkan keterangan dari') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
      effectiveCustomHtml = undefined;
    }
    if (isSporadikLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('dengan itikad baik telah menguasai') || !effectiveCustomHtml.includes('[namasaksii]') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
      effectiveCustomHtml = undefined;
    }
    if (isKepemilikanTanahLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT KETERANGAN KEPEMILIKAN TANAH') || effectiveCustomHtml.includes('[TempatlahiR] / [TanggallahiR]') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
      effectiveCustomHtml = undefined;
    }
    if (isJualBeliLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT KETERANGAN JUAL BELI TANAH') || effectiveCustomHtml.includes('hendak menjual') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
      effectiveCustomHtml = undefined;
    }

    const isDomisiliUsahaLetter =
      matchedMaster?.id === 'prm-08' ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === 's-16' ||
      (submission.letterType || '').toLowerCase().includes('domisili usaha') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('domisili-usaha');

    const isUsahaLetter =
      !isDomisiliUsahaLetter &&
      !isKeteranganUmumLetter &&
      (((submission.letterType || '').toLowerCase().includes('usaha') && !(submission.letterType || '').toLowerCase().includes('umum')) ||
        (((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('usaha') && !((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('umum')) ||
        (matchedMaster?.id === 'prm-01' && !isKeteranganUmumLetter));

    if (isDomisiliUsahaLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT KETERANGAN DOMISILI USAHA') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar') || !effectiveCustomHtml.includes('Status Bangunan Tempat Usaha'))) {
      effectiveCustomHtml = undefined;
    }

    if (isUsahaLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('memiliki usaha dengan keterangan sebagai berikut') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar') || effectiveCustomHtml.includes('memiliki usaha [Form_nama_usaha]'))) {
      effectiveCustomHtml = undefined;
    }

    if (isKeteranganUmumLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT PENGANTAR UMUM') || effectiveCustomHtml.includes('SURAT KETERANGAN UMUM') || effectiveCustomHtml.includes('SURAT KETERANGAN USAHA') || effectiveCustomHtml.includes('memiliki usaha') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
      effectiveCustomHtml = undefined;
    }

    if (isSuratSktmLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT KETERANGAN TIDAK MAMPU') || effectiveCustomHtml.includes('KLg1_nik') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
      effectiveCustomHtml = undefined;
    }

    if (isPenghasilanOrtuLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT KETERANGAN PENGHASILAN ORANG TUA') || !effectiveCustomHtml.includes('<!-- pagebreak -->') || effectiveCustomHtml.includes('[HitunG]') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
      effectiveCustomHtml = undefined;
    }

    if (isReaktivasiBpjsLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT KETERANGAN REAKTIVASI BPJS KESEHATAN') || effectiveCustomHtml.includes('Kartu Peserta Jamkesos') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
      effectiveCustomHtml = undefined;
    }

    if (isPemakamanLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT KETERANGAN PEMAKAMAN') || !effectiveCustomHtml.includes('Dimakamkan pada') || effectiveCustomHtml.includes('SURAT KETERANGAN TIDAK MAMPU') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
      effectiveCustomHtml = undefined;
    }

    if (isSkckLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT PENGANTAR SKCK') || !effectiveCustomHtml.includes('DAN RAMIL') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar') || effectiveCustomHtml.includes('1.</td>'))) {
      effectiveCustomHtml = undefined;
    }

    if (isKehilanganLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT PENGANTAR KEHILANGAN') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar') || effectiveCustomHtml.includes('1.</td>'))) {
      effectiveCustomHtml = undefined;
    }

    if (isKeramaianLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT IJIN KERAMAIAN') || !effectiveCustomHtml.includes('DAN RAMIL') || effectiveCustomHtml.includes('1.</td>') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar penduduk Desa') === false)) {
      effectiveCustomHtml = undefined;
    }

    if (isIzinKeluargaLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT KETERANGAN IZIN KELUARGA') || effectiveCustomHtml.includes('1.</td>') || effectiveCustomHtml.includes('[Form_memberi_izin_selakU]'))) {
      effectiveCustomHtml = undefined;
    }

    if (isSuratJalanLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT KETERANGAN JALAN/BERPERGIAN') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
      effectiveCustomHtml = undefined;
    }

    if (isSuratKuasaLetter && effectiveCustomHtml && (!effectiveCustomHtml.includes('SURAT KUASA') || !effectiveCustomHtml.includes('Pemberi Kuasa') || effectiveCustomHtml.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
      effectiveCustomHtml = undefined;
    }

    const baseDoc = renderOpenSidDocumentPages(
      matchedMaster,
      ctx,
      effectiveGlobalSettings,
      effectiveCustomHtml,
    );

    return {
      pengantarPagesHtml: baseDoc.pagesHtml,
      lampiranSheets,
      headerRendered: baseDoc.headerRendered,
      footerRendered: baseDoc.footerRendered,
      margin: baseDoc.margin,
      orientasi: baseDoc.orientasi,
      ukuran: baseDoc.ukuran,
    };
  }, [submission, matchedMaster, globalSettings, customHtmlOverride, kopInfo, dbLampiranItems, signerQuery, ttdMode, identity, residentMap]);

  const allSheets = useMemo(() => {
    const isJualBeli =
      (submission.letterType || '').toLowerCase().includes('jual beli') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('jual-beli') ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === 's-05' ||
      matchedMaster?.id === 'prm-10';

    const isPenghasilanOrtu =
      (submission.letterType || '').toLowerCase().includes('penghasilan orang tua') ||
      (submission.letterType || '').toLowerCase().includes('penghasilan ortu') ||
      ((submission as any).urlSurat || matchedMaster?.urlSurat || '').toLowerCase().includes('penghasilan-orang-tua') ||
      ((submission as any).kodeSurat || matchedMaster?.kodeSurat || '').toLowerCase() === 's-42' ||
      matchedMaster?.id === 'prm-21';

    const pengantar = rendered.pengantarPagesHtml.map((html, idx) => ({
      kind: 'pengantar' as const,
      html,
      orientasi: rendered.orientasi,
      showHeader:
        (isJualBeli || isPenghasilanOrtu)
          ? idx === 0
          : (matchedMaster.header === 1 || (matchedMaster.header === 2 && idx === 0)),
      showFooter: isJualBeli || isPenghasilanOrtu ? false : matchedMaster.footer !== false,
      label: `Surat Pengantar (${idx + 1})`,
    }));

    const lampiran = rendered.lampiranSheets.map((l) => ({
      kind: 'lampiran' as const,
      html: l.html,
      orientasi: l.orientasi,
      showHeader: false,
      showFooter: false,
      label: `Lampiran ${l.kode}`,
    }));

    // Jika pengantar sendiri terdiri dari >1 lembar (via <!-- pagebreak -->) dan tidak ada lampiran terpisah,
    // anggap lembar ke-2 dst sebagai lampiran
    if (lampiran.length === 0 && pengantar.length > 1) {
      return pengantar.map((p, idx) => ({
        ...p,
        kind: idx === 0 ? ('pengantar' as const) : ('lampiran' as const),
      }));
    }

    return [...pengantar, ...lampiran];
  }, [rendered, matchedMaster, submission]);

  const pengantarCount = allSheets.filter((s) => s.kind === 'pengantar').length;
  const lampiranCount = allSheets.filter((s) => s.kind === 'lampiran').length;

  return (
    <div className="min-h-screen bg-slate-200 pb-16 print:bg-white print:pb-0 print:min-h-0 print:h-auto print:m-0 print:p-0">
      {/* Toolbar Cetak (Disembunyikan saat Print) */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 bg-white px-6 py-3 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Cetak Dokumen OpenSID: {submission.letterType}
            </h2>
            <p className="text-xs text-slate-500">
              Nomor: <span className="font-mono font-semibold">{submission.documentNumber}</span> • Pemohon:{' '}
              <strong>{submission.requesterName}</strong> • Kertas {rendered.ukuran} ({rendered.orientasi})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Penandatangan: Kepala Desa vs Sekretaris Desa */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSignerQuery(signerQuery === 'sekdes' ? 'kades' : 'sekdes')}
            className={`gap-1.5 rounded-full text-xs font-semibold ${signerQuery === 'sekdes'
              ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
              : 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
              }`}
            title="Klik untuk beralih antara Kepala Desa dan Sekretaris Desa"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>TTD: {signerQuery === 'sekdes' ? 'Sekretaris Desa' : 'Kepala Desa'}</span>
          </Button>

          {/* Toggle TTD: Manual vs QR Code */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTtdMode(ttdMode === 'qr' ? 'manual' : 'qr')}
            className={`gap-1.5 rounded-full text-xs font-semibold ${ttdMode === 'qr'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
              : 'border-slate-300 bg-white text-slate-700'
              }`}
            title="Klik untuk beralih antara TTD Manual dan QR Code"
          >
            {ttdMode === 'qr' ? (
              <>
                <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                <span>TTD: QR Code</span>
              </>
            ) : (
              <>
                <PenTool className="h-3.5 w-3.5 text-slate-600" />
                <span>TTD: Manual (Tanpa QR)</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (!isEditingInline && !customHtmlOverride) {
                setCustomHtmlOverride(rendered.pengantarPagesHtml.join('\n<!-- pagebreak -->\n'));
              }
              setIsEditingInline(!isEditingInline);
            }}
            className="gap-1.5 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          >
            {isEditingInline ? <Check className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
            {isEditingInline ? 'Selesai Sunting Naskah' : 'Sunting Naskah'}
          </Button>

          {lampiranCount > 0 ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePrint('pengantar')}
                className={`gap-1.5 rounded-full text-xs font-semibold ${printMode === 'pengantar'
                  ? 'border-blue-600 bg-blue-50 font-bold text-blue-700'
                  : 'text-slate-700'
                  }`}
              >
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                Cetak Pengantar Saja ({pengantarCount} Lembar)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePrint('lampiran')}
                className={`gap-1.5 rounded-full text-xs font-semibold ${printMode === 'lampiran'
                  ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-700'
                  : 'text-slate-700'
                  }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                Cetak Lampiran Saja ({lampiranCount} Lembar)
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handlePrint('all')}
                className="gap-1.5 rounded-full bg-slate-900 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Printer className="h-4 w-4" />
                Cetak Lengkap ({allSheets.length} Lembar)
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => handlePrint('all')}
              className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Cetak Surat / Simpan PDF
            </Button>
          )}
        </div>
      </div>

      {/* Panel Sunting Cepat Naskah (Jika Aktif) */}
      {isEditingInline && (
        <div className="mx-auto mt-4 max-w-4xl rounded-xl border border-indigo-200 bg-white p-4 shadow-md print:hidden">
          <label className="mb-1.5 block text-xs font-bold text-indigo-900">
            Sunting HTML Naskah Surat Secara Langsung:
          </label>
          <Textarea
            value={customHtmlOverride}
            onChange={(e) => setCustomHtmlOverride(e.target.value)}
            className="min-h-[240px] font-mono text-xs"
          />
        </div>
      )}

      {/* Lembar Kertas Cetak */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          @page {
            size: ${rendered.ukuran === 'A4' ? 'A4 portrait' : 'auto'};
            margin: 0 !important;
          }
          .opensid-sheet-page {
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: 287mm !important;
            margin: 0 !important;
            margin-bottom: 0 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: page !important;
            break-after: page !important;
            overflow: hidden !important;
          }
          .opensid-sheet-page.sheet-folio {
            max-height: 320mm !important;
          }
          .opensid-sheet-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}} />
      <div className="pt-6 print:pt-0 print:m-0 print:p-0">
        {allSheets
          .map((sheet, originalIdx) => ({ sheet, originalIdx }))
          .filter(({ sheet }) => {
            if (printMode === 'pengantar') return sheet.kind === 'pengantar';
            if (printMode === 'lampiran') return sheet.kind === 'lampiran';
            return true;
          })
          .map(({ sheet, originalIdx }, visibleIdx, visibleArr) => (
            <div
              key={originalIdx}
              data-sheet-kind={sheet.kind}
              data-sheet-index={originalIdx}
              className={`opensid-sheet-page ${rendered.ukuran === 'A4' ? 'sheet-a4' : 'sheet-folio'} mx-auto mb-8 bg-white text-black shadow-xl print:m-0 print:mb-0 print:shadow-none print:w-full print:min-h-0 print:h-auto print:max-w-full`}
              style={{
                width: sheet.orientasi === 'Landscape' ? '33cm' : '21cm',
                maxWidth: '100%',
                minHeight:
                  sheet.orientasi === 'Landscape'
                    ? '21cm'
                    : rendered.ukuran === 'A4'
                      ? '29.7cm'
                      : '33cm',
                paddingTop:
                  sheet.kind === 'lampiran' && rendered.ukuran === 'A4'
                    ? '1.2cm'
                    : `${rendered.margin.atas}cm`,
                paddingBottom:
                  sheet.kind === 'lampiran' && rendered.ukuran === 'A4'
                    ? '1.2cm'
                    : `${rendered.margin.bawah}cm`,
                paddingLeft: `${rendered.margin.kiri}cm`,
                paddingRight: `${rendered.margin.kanan}cm`,
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: '11pt',
                lineHeight: 1.45,
                pageBreakAfter: visibleIdx < visibleArr.length - 1 ? 'always' : 'auto',
                breakAfter: visibleIdx < visibleArr.length - 1 ? 'page' : 'auto',
              }}
            >
              {sheet.showHeader && rendered.headerRendered && (
                <div
                  className="mb-4"
                  dangerouslySetInnerHTML={{ __html: rendered.headerRendered }}
                />
              )}

              <div dangerouslySetInnerHTML={{ __html: sheet.html }} />

              {sheet.showFooter && rendered.footerRendered && (
                <div
                  className="mt-6 print:mt-2"
                  dangerouslySetInnerHTML={{ __html: rendered.footerRendered }}
                />
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

