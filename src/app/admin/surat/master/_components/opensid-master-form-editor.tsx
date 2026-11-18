'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Eye,
  Save,
  Check,
  Sliders,
  FileCode,
  Layers,
  QrCode,
  Sparkles,
  FileText,
  RefreshCw,
  Code2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowRightLeft,
  Link2,
  Search,
  X,
  ShieldCheck,
  CheckCircle2,
  Info,
  HelpCircle,
  FileCheck,
  Columns,
  Maximize2,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { PermohonanSuratItem } from '@/lib/permohonan-surat-data';
import type { KopSuratInfo } from '@/lib/types';
import type { VillageIdentityInfo } from '@/lib/village-identity';
import {
  OPENSID_RAW_TEMPLATES,
  OPENSID_TIPE_ISIAN_OPTIONS,
  OPENSID_REFERENSI_DATA,
  OPENSID_SHDK_OPTIONS,
  OPENSID_STATUS_DASAR_OPTIONS,
  OPENSID_DATA_PELAKU_OPTIONS,
  OPENSID_JENIS_KELAMIN_OPTIONS,
  OPENSID_SEBAGAI_OPTIONS,
  OPENSID_SATUAN_MASA_BERLAKU,
  OPENSID_UKURAN_KERTAS_OPTIONS,
  OPENSID_LAMPIRAN_OPTIONS,
  OPENSID_KODE_ISIAN_STANDAR,
  OPENSID_MARGIN_DEFAULT,
  OPENSID_FORMAT_NOMOR_DEFAULT,
  normalizeFormSectionConfig,
  buildFormKodeTag,
  buildDummyPreviewContext,
  renderOpenSidDocumentPages,
  getFallbackTemplateHtml,
  type OpenSidFormIsian,
  type OpenSidFormSectionConfig,
  type OpenSidKodeIsian,
  type OpenSidGlobalSuratSettings,
} from '@/lib/opensid-surat-engine';
import {
  resolveEffectiveQrSettings,
  buildQrVerificationPayload,
  generateQrCodeDataUri,
  type OpenSidQrSignatureSettings,
  type QrLogoMode,
  type QrContentMode,
  type QrSignMode,
} from '@/lib/opensid-qr-signature';

interface OpenSidMasterFormEditorProps {
  editingItem: PermohonanSuratItem;
  setEditingItem: React.Dispatch<React.SetStateAction<PermohonanSuratItem | null>>;
  effectiveGlobalSettings: OpenSidGlobalSuratSettings;
  identity: VillageIdentityInfo;
  villageLogoUrl?: string;
  allSyaratOptions: string[];
  initialTab?: 'umum' | 'template' | 'form_isian' | 'qr_tte';
  onBack: () => void;
  onSave: (closeAfterSave: boolean) => void;
  onPreview: (item: PermohonanSuratItem) => void;
  onApplyQrToAll: () => void;
}

export function OpenSidMasterFormEditor({
  editingItem,
  setEditingItem,
  effectiveGlobalSettings,
  identity,
  villageLogoUrl,
  allSyaratOptions,
  initialTab = 'umum',
  onBack,
  onSave,
  onPreview,
  onApplyQrToAll,
}: OpenSidMasterFormEditorProps) {
  const { toast } = useToast();

  // Tab Utama: Umum | Template | Form Isian | Penandatanganan QR
  const [activeMainTab, setActiveMainTab] = useState<'umum' | 'template' | 'form_isian' | 'qr_tte'>(
    initialTab,
  );
  const [activeFormSectionTab, setActiveFormSectionTab] = useState<string>('individu');
  const [templateEditorMode, setTemplateEditorMode] = useState<'visual' | 'html' | 'split'>('split');

  // Modals
  const [newSectionModalOpen, setNewSectionModalOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSyaratText, setNewSyaratText] = useState('');

  // Kode Isian Modal
  const [kodeIsianModalOpen, setKodeIsianModalOpen] = useState(false);
  const [kodeIsianSearch, setKodeIsianSearch] = useState('');
  const [kodeIsianCaseMode, setKodeIsianCaseMode] = useState<'normal' | 'upper' | 'ucwords' | 'lower'>('normal');

  // Move & Link Kode Isian
  const [moveKodeIndex, setMoveKodeIndex] = useState<number | null>(null);
  const [moveTargetCategory, setMoveTargetCategory] = useState<string>('individu');
  const [linkKodeIndex, setLinkKodeIndex] = useState<number | null>(null);

  // Search filter for Dokumen Persyaratan
  const [syaratSearch, setSyaratSearch] = useState('');

  const visualEditorRef = useRef<HTMLDivElement | null>(null);
  const htmlTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const formIsianObj: OpenSidFormIsian = editingItem.formIsian || {
    individu: normalizeFormSectionConfig('individu', {}),
  };
  const sectionKeys = Object.keys(formIsianObj);
  const currentSecKey = sectionKeys.includes(activeFormSectionTab)
    ? activeFormSectionTab
    : 'individu';
  const currentSecCfg =
    formIsianObj[currentSecKey] || normalizeFormSectionConfig(currentSecKey, {});

  const cleanNamaTanpaSurat = editingItem.jenisSurat.replace(/^Surat\s+/i, '');

  const livePreviewCtx = useMemo(() => buildDummyPreviewContext(editingItem), [editingItem]);
  const livePreviewRendered = useMemo(
    () =>
      renderOpenSidDocumentPages(
        editingItem,
        livePreviewCtx,
        effectiveGlobalSettings,
        editingItem.templateDesa || editingItem.template,
      ),
    [editingItem, livePreviewCtx, effectiveGlobalSettings],
  );

  // Helper Form Sections
  const handleAddFormSection = () => {
    if (!newSectionTitle.trim()) return;
    const rawTitle = newSectionTitle.trim();
    const slugKey = rawTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (!slugKey || slugKey === 'individu' || slugKey === 'utama') {
      toast({
        variant: 'destructive',
        title: 'Nama Bagian Tidak Valid',
        description: 'Gunakan nama bagian selain Utama/Individu (contoh: Ayah, Ibu, Saksi I, Tanah).',
      });
      return;
    }
    const currentFormIsian: OpenSidFormIsian = { ...(editingItem.formIsian || {}) };
    if (currentFormIsian[slugKey]) {
      toast({
        variant: 'destructive',
        title: 'Bagian Sudah Ada',
        description: `Bagian "${rawTitle}" sudah terdaftar pada Form Isian ini.`,
      });
      return;
    }
    currentFormIsian[slugKey] = normalizeFormSectionConfig(slugKey, {
      judul: rawTitle,
      label: `Identitas ${rawTitle}`,
      prefix: slugKey,
      sumber: 1,
      sumber_wajib: 0,
      data: ['1', '2'],
      status_dasar: ['1'],
      sebagai: 0,
    });
    setEditingItem({
      ...editingItem,
      formIsian: currentFormIsian,
    });
    setActiveFormSectionTab(slugKey);
    setNewSectionTitle('');
    setNewSectionModalOpen(false);
    toast({
      title: 'Bagian Form Ditambahkan',
      description: `Tab bagian "${rawTitle}" (prefix: _${slugKey}) berhasil dibuat.`,
    });
  };

  const handleRemoveFormSection = (sectionKey: string) => {
    if (sectionKey === 'individu') return;
    const secTitle = editingItem.formIsian?.[sectionKey]?.judul || sectionKey;
    if (!window.confirm(`Hapus bagian form "${secTitle}" beserta kode isian di dalamnya?`)) return;
    const nextFormIsian = { ...(editingItem.formIsian || {}) };
    delete nextFormIsian[sectionKey];
    const nextKodeIsian = (editingItem.kodeIsian || []).filter(
      (k) => (k.kategori || 'individu') !== sectionKey,
    );
    setEditingItem({
      ...editingItem,
      formIsian: nextFormIsian,
      kodeIsian: nextKodeIsian,
    });
    setActiveFormSectionTab('individu');
  };

  const updateFormSection = (sectionKey: string, patch: Partial<OpenSidFormSectionConfig>) => {
    const currentFormIsian: OpenSidFormIsian = { ...(editingItem.formIsian || {}) };
    const existing = currentFormIsian[sectionKey] || normalizeFormSectionConfig(sectionKey, {});
    currentFormIsian[sectionKey] = {
      ...existing,
      ...patch,
    };
    setEditingItem({
      ...editingItem,
      formIsian: currentFormIsian,
    });
  };

  // Helper Kode Isian
  const handleAddKodeIsianRow = (kategoriKey: string) => {
    const nextList = [...(editingItem.kodeIsian || [])];
    const prefix =
      kategoriKey === 'individu'
        ? 'individu'
        : editingItem.formIsian?.[kategoriKey]?.prefix || kategoriKey;
    const defaultNama = `Isian ${nextList.length + 1}`;
    nextList.push({
      kategori: kategoriKey,
      tipe: 'text',
      nama: defaultNama,
      label: defaultNama,
      kode: buildFormKodeTag(defaultNama, prefix),
      deskripsi: `Masukkan ${defaultNama}`,
      atribut: '',
      pilihan: [],
      refrensi: 'Agama',
      kolom: 6,
      required: '0',
    });
    setEditingItem({
      ...editingItem,
      kodeIsian: nextList,
    });
  };

  const handleUpdateKodeIsianRow = (globalIdx: number, patch: Partial<OpenSidKodeIsian>) => {
    const nextList = [...(editingItem.kodeIsian || [])];
    const current = nextList[globalIdx];
    if (!current) return;
    const updated: OpenSidKodeIsian = {
      ...current,
      ...patch,
    };
    if (patch.nama !== undefined) {
      const kat = updated.kategori || 'individu';
      const prefix =
        kat === 'individu' ? 'individu' : editingItem.formIsian?.[kat]?.prefix || kat;
      updated.kode = buildFormKodeTag(patch.nama, prefix);
      if (!current.label || current.label === current.nama) {
        updated.label = patch.nama;
      }
    }
    nextList[globalIdx] = updated;
    setEditingItem({
      ...editingItem,
      kodeIsian: nextList,
    });
  };

  const handleDeleteKodeIsianRow = (globalIdx: number) => {
    const nextList = (editingItem.kodeIsian || []).filter((_, i) => i !== globalIdx);
    setEditingItem({
      ...editingItem,
      kodeIsian: nextList,
    });
  };

  const handleMoveKodeIsianRowOrder = (globalIdx: number, direction: 'up' | 'down') => {
    const list = [...(editingItem.kodeIsian || [])];
    const targetIdx = direction === 'up' ? globalIdx - 1 : globalIdx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[globalIdx];
    list[globalIdx] = list[targetIdx];
    list[targetIdx] = temp;
    setEditingItem({
      ...editingItem,
      kodeIsian: list,
    });
  };

  // Helper Template & Tag Injection
  const handleInsertKodeIsianTag = (rawKode: string) => {
    let formattedTag = rawKode;
    const inner = rawKode.replace(/^\[|\]$/g, '');
    if (kodeIsianCaseMode === 'upper' && inner.length >= 2) {
      formattedTag = `[${inner[0].toUpperCase()}${inner[1].toUpperCase()}${inner.slice(2).toLowerCase()}]`;
    } else if (kodeIsianCaseMode === 'ucwords' && inner.length >= 3) {
      formattedTag = `[${inner[0].toUpperCase()}${inner[1].toLowerCase()}${inner[2].toUpperCase()}${inner.slice(3).toLowerCase()}]`;
    } else if (kodeIsianCaseMode === 'lower') {
      formattedTag = `[${inner.toLowerCase()}]`;
    }

    const currentHtml = editingItem.templateDesa || editingItem.template || '';
    if (htmlTextareaRef.current) {
      const el = htmlTextareaRef.current;
      const start = el.selectionStart ?? currentHtml.length;
      const end = el.selectionEnd ?? currentHtml.length;
      const nextHtml = currentHtml.slice(0, start) + formattedTag + currentHtml.slice(end);
      setEditingItem({ ...editingItem, templateDesa: nextHtml });
    } else {
      setEditingItem({ ...editingItem, templateDesa: `${currentHtml} ${formattedTag}` });
    }

    toast({
      title: 'Kode Isian Disisipkan',
      description: `Tag ${formattedTag} telah dimasukkan ke dalam template surat.`,
    });
  };

  // Dynamic Catalog for current letter
  const dynamicKodeCatalogForCurrentItem = useMemo(() => {
    const groups = [...OPENSID_KODE_ISIAN_STANDAR];

    const formItems = (editingItem.kodeIsian || []).map((ki) => ({
      kode: ki.kode,
      judul: `${ki.label || ki.nama} (${ki.kategori || 'individu'})`,
      keterangan: ki.deskripsi || `Tipe: ${ki.tipe}`,
    }));
    if (formItems.length > 0) {
      groups.unshift({
        kategori: 'Form Isian Surat Ini ([form_...])',
        items: formItems,
      });
    }

    for (const [secKey, secCfg] of Object.entries(editingItem.formIsian || {})) {
      if (secKey === 'individu') continue;
      if (Number(secCfg.sumber) === 0) continue;
      const pfx = (secCfg.prefix || secKey).toLowerCase();
      const title = secCfg.judul || secKey;
      groups.push({
        kategori: `Data Pelaku Bagian: ${title} (_${pfx})`,
        items: [
          { kode: `[Nama_${pfx}]`, judul: `Nama ${title}`, keterangan: `Nama lengkap pelaku ${title}` },
          { kode: `[Nik_${pfx}]`, judul: `NIK ${title}`, keterangan: `NIK 16 digit ${title}` },
          { kode: `[No_kk_${pfx}]`, judul: `Nomor KK ${title}`, keterangan: `Nomor KK ${title}` },
          { kode: `[Tempat_tanggal_lahir_${pfx}]`, judul: `Tempat/Tanggal Lahir ${title}`, keterangan: `TTL ${title}` },
          { kode: `[Usia_${pfx}]`, judul: `Usia ${title}`, keterangan: `Umur ${title}` },
          { kode: `[Jenis_kelamin_${pfx}]`, judul: `Jenis Kelamin ${title}`, keterangan: `Jenis kelamin ${title}` },
          { kode: `[Agama_${pfx}]`, judul: `Agama ${title}`, keterangan: `Agama ${title}` },
          { kode: `[Pekerjaan_${pfx}]`, judul: `Pekerjaan ${title}`, keterangan: `Pekerjaan ${title}` },
          { kode: `[Warga_negara_${pfx}]`, judul: `Warga Negara ${title}`, keterangan: `Kewarganegaraan ${title}` },
          { kode: `[Status_kawin_${pfx}]`, judul: `Status Kawin ${title}`, keterangan: `Status perkawinan ${title}` },
          { kode: `[Alamat_${pfx}]`, judul: `Alamat Lengkap ${title}`, keterangan: `Alamat lengkap ${title}` },
        ],
      });
    }

    return groups;
  }, [editingItem]);

  // QR Settings helper
  const updateQrSettings = (patch: Partial<OpenSidQrSignatureSettings>) => {
    const currentQr = resolveEffectiveQrSettings(
      editingItem.qrSettings,
      editingItem.qrCode,
      editingItem.qrCodeTte,
    );
    const nextQr: OpenSidQrSignatureSettings = {
      ...currentQr,
      ...patch,
    };
    setEditingItem({
      ...editingItem,
      qrCode: nextQr.enabled,
      qrCodeTte: nextQr.tteEnabled,
      qrSettings: nextQr,
    });
  };

  const currentQr = resolveEffectiveQrSettings(
    editingItem.qrSettings,
    editingItem.qrCode,
    editingItem.qrCodeTte,
  );

  const samplePayloadKades = useMemo(() => {
    return buildQrVerificationPayload(currentQr, {
      submissionId: 'CONTOH-VERIFIKASI-001',
      nomorSurat: `${editingItem.kodeSurat || '470'}/001/${identity.kodeSuratDesa || '11'}/${new Date().getFullYear()}`,
      judulSurat: editingItem.jenisSurat,
      tanggalSurat: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      namaPemohon: 'AHMAD FAUZI SETIAWAN',
      nikPemohon: '3301101708940002',
      jabatanPenandatangan: `Kepala ${identity.sebutanDesa} ${identity.namaDesa}`,
      namaPenandatangan: identity.namaKepalaDesa,
      signerCode: 'kades',
      identity,
    });
  }, [currentQr, editingItem, identity]);

  const sampleQrDataUri = useMemo(
    () => generateQrCodeDataUri(samplePayloadKades, currentQr, villageLogoUrl),
    [samplePayloadKades, currentQr, villageLogoUrl],
  );

  return (
    <div className="space-y-5 pb-28">
      {/* ====================================================================
          HEADER CARD FORM: Rapi di PC & Mobile
         ==================================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          {/* Kolom Kiri: Tombol Kembali + Nama Surat + Badge Info */}
          <div className="flex items-start sm:items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBack}
              className="h-9 shrink-0 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Daftar Surat</span>
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {editingItem.jenisSurat}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] sm:text-xs font-semibold py-0.5',
                    editingItem.jenis === 1 || editingItem.jenis === 3
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                  )}
                >
                  {editingItem.jenis === 1 || editingItem.jenis === 3
                    ? 'Bawaan OpenSID'
                    : 'Khusus Desa'}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 truncate">
                Kode: <span className="font-mono font-semibold text-slate-800">{editingItem.kodeSurat}</span> • Slug:{' '}
                <span className="font-mono text-slate-700">{editingItem.urlSurat || '-'}</span> • Kertas:{' '}
                <span className="font-medium text-slate-700">{editingItem.ukuran || 'F4'} ({editingItem.orientasi || 'Potrait'})</span>
              </p>
            </div>
          </div>

          {/* Kolom Kanan: Aksi (Tinjau PDF, Simpan Sementara, Simpan dan Keluar) */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPreview(editingItem)}
              className="h-9 gap-1.5 border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 text-xs px-2.5 sm:px-3 justify-center"
            >
              <Eye className="h-4 w-4 shrink-0" />
              <span>Tinjau PDF</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSave(false)}
              className="h-9 gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs px-2.5 sm:px-3 justify-center font-semibold"
            >
              <Save className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Simpan Sementara</span>
              <span className="inline sm:hidden">Simpan</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => onSave(true)}
              className="h-9 gap-1.5 bg-blue-600 text-white hover:bg-blue-700 text-xs px-2.5 sm:px-3 justify-center font-bold"
            >
              <Check className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Simpan & Keluar</span>
              <span className="inline sm:hidden">Selesai</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          CONTAINER UTAMA: 4 TAB OPENSID (UMUM, TEMPLATE, FORM ISIAN, QR)
         ==================================================================== */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {/* Navigasi 4 Tab: Smooth Horizontally Scrollable on Mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth border-b border-slate-200 bg-slate-50/90 px-3 pt-2.5">
          <button
            type="button"
            onClick={() => setActiveMainTab('umum')}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-t-xl border-b-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap',
              activeMainTab === 'umum'
                ? 'border-blue-600 bg-white text-blue-700 shadow-2xs font-bold'
                : 'border-transparent text-slate-600 hover:bg-white/60 hover:text-slate-900',
            )}
          >
            <Sliders className="h-4 w-4 text-blue-600" />
            <span>Umum</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('template')}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-t-xl border-b-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap',
              activeMainTab === 'template'
                ? 'border-blue-600 bg-white text-blue-700 shadow-2xs font-bold'
                : 'border-transparent text-slate-600 hover:bg-white/60 hover:text-slate-900',
            )}
          >
            <FileCode className="h-4 w-4 text-indigo-600" />
            <span>Template</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('form_isian')}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-t-xl border-b-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap',
              activeMainTab === 'form_isian'
                ? 'border-blue-600 bg-white text-blue-700 shadow-2xs font-bold'
                : 'border-transparent text-slate-600 hover:bg-white/60 hover:text-slate-900',
            )}
          >
            <Layers className="h-4 w-4 text-amber-600" />
            <span>Form Isian</span>
            <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800 text-[10px]">
              {Object.keys(formIsianObj).length} Bagian • {(editingItem.kodeIsian || []).length} Isian
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('qr_tte')}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-t-xl border-b-2 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap',
              activeMainTab === 'qr_tte'
                ? 'border-emerald-600 bg-white text-emerald-700 shadow-2xs font-bold'
                : 'border-transparent text-slate-600 hover:bg-white/60 hover:text-slate-900',
            )}
          >
            <QrCode className="h-4 w-4 text-emerald-600" />
            <span>Penandatanganan QR</span>
            <Badge
              variant="secondary"
              className={cn(
                'ml-1 text-[10px]',
                editingItem.qrCode !== false
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-600',
              )}
            >
              {editingItem.qrCode !== false ? 'QR Aktif' : 'Manual'}
            </Badge>
          </button>
        </div>

        {/* ====================================================================
            TAB 1: UMUM - Dikelompokkan rapi dalam kartu-kartu tematik
           ==================================================================== */}
        {activeMainTab === 'umum' && (
          <div className="space-y-6 p-4 sm:p-6">
            {/* GRUP 1: Identitas & Klasifikasi Layanan */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>1. Identitas & Klasifikasi Layanan Surat</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                {/* Kode Surat */}
                <div className="sm:col-span-4">
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Kode / Klasifikasi Surat <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editingItem.kodeSurat}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, kodeSurat: e.target.value })
                    }
                    placeholder="Contoh: 470, 500, S-01"
                    className="font-mono text-sm"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Mengisi variabel <code className="text-blue-600">[kode_surat]</code> pada nomor surat.
                  </p>
                </div>

                {/* Nama Layanan dengan Addon "Surat" */}
                <div className="sm:col-span-8">
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Nama Layanan <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <span className="inline-flex h-9 items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-100 px-3 text-xs sm:text-sm font-semibold text-slate-700">
                      Surat
                    </span>
                    <Input
                      value={cleanNamaTanpaSurat}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          jenisSurat: `Surat ${e.target.value.replace(/^Surat\s+/i, '')}`,
                        })
                      }
                      placeholder="Keterangan Usaha / Keterangan Domisili..."
                      className="rounded-l-none text-sm"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Otomatis mengisi tag <code className="text-blue-600">[judul_surat]</code> pada hasil cetak.
                  </p>
                </div>

                {/* Pemohon Surat */}
                <div className="sm:col-span-4">
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Pemohon Surat
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextFi = { ...formIsianObj };
                        nextFi.individu = {
                          ...normalizeFormSectionConfig('individu', nextFi.individu),
                          data: ['1'],
                        };
                        setEditingItem({
                          ...editingItem,
                          pemohonSurat: 'warga',
                          formIsian: nextFi,
                        });
                      }}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-xs font-semibold transition',
                        editingItem.pemohonSurat !== 'non_warga'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      Warga Desa
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextFi = { ...formIsianObj };
                        nextFi.individu = {
                          ...normalizeFormSectionConfig('individu', nextFi.individu),
                          data: ['2'],
                        };
                        setEditingItem({
                          ...editingItem,
                          pemohonSurat: 'non_warga',
                          formIsian: nextFi,
                        });
                      }}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-xs font-semibold transition',
                        editingItem.pemohonSurat === 'non_warga'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      Bukan Warga
                    </button>
                  </div>
                </div>

                {/* Kategori Layanan */}
                <div className="sm:col-span-4">
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Kategori Bidang Layanan
                  </label>
                  <select
                    value={editingItem.kategori || 'Umum'}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        kategori: e.target.value as PermohonanSuratItem['kategori'],
                      })
                    }
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs sm:text-sm font-medium"
                  >
                    <option value="Kependudukan">Kependudukan & Capil</option>
                    <option value="Pernikahan">Pernikahan & KUA</option>
                    <option value="Pertanahan">Pertanahan & Kepemilikan</option>
                    <option value="Ekonomi & Usaha">Ekonomi & Usaha</option>
                    <option value="Sosial & Bantuan">Sosial & Bantuan</option>
                    <option value="Umum">Pemerintahan & Umum</option>
                  </select>
                </div>

                {/* Masa Berlaku Default */}
                <div className="sm:col-span-4">
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Masa Berlaku Default
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={31}
                      value={editingItem.masaBerlakuValue ?? 1}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          masaBerlakuValue: Math.max(0, Math.min(31, Number(e.target.value || 0))),
                        })
                      }
                      className="w-20 font-bold"
                    />
                    <select
                      value={editingItem.satuanMasaBerlaku || 'M'}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          satuanMasaBerlaku: e.target.value as 'd' | 'w' | 'M' | 'y',
                        })
                      }
                      className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium"
                    >
                      {OPENSID_SATUAN_MASA_BERLAKU.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Isi 0 jika tidak ada masa berlaku.</p>
                </div>
              </div>
            </div>

            {/* GRUP 2: Format Kertas & Layout Cetak */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Sliders className="h-4 w-4 text-indigo-600" />
                <span>2. Format & Tata Letak Kertas Cetak</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                {/* Orientasi Kertas */}
                <div className="sm:col-span-6">
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Orientasi Kertas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Potrait', 'Landscape'] as const).map((ori) => (
                      <button
                        key={ori}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, orientasi: ori })}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-xs font-semibold transition',
                          editingItem.orientasi === ori
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                        )}
                      >
                        {ori}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ukuran Kertas */}
                <div className="sm:col-span-6">
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Ukuran Kertas Dokumen
                  </label>
                  <select
                    value={editingItem.ukuran || 'F4'}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        ukuran: e.target.value as PermohonanSuratItem['ukuran'],
                      })
                    }
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs sm:text-sm font-medium"
                  >
                    {OPENSID_UKURAN_KERTAS_OPTIONS.map((uk) => (
                      <option key={uk.id} value={uk.id}>
                        {uk.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Margin Kertas Global vs Khusus */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:col-span-12">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-800">
                        Gunakan Margin Kertas Global
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Default Sistem: Kiri {effectiveGlobalSettings.marginGlobal.kiri}cm, Atas{' '}
                        {effectiveGlobalSettings.marginGlobal.atas}cm, Kanan{' '}
                        {effectiveGlobalSettings.marginGlobal.kanan}cm, Bawah{' '}
                        {effectiveGlobalSettings.marginGlobal.bawah}cm
                      </span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, marginGlobal: true })}
                        className={cn(
                          'rounded-md px-3.5 py-1 text-xs font-bold transition',
                          editingItem.marginGlobal !== false
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 bg-white text-slate-600',
                        )}
                      >
                        Ya (Global)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, marginGlobal: false })}
                        className={cn(
                          'rounded-md px-3.5 py-1 text-xs font-bold transition',
                          editingItem.marginGlobal === false
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 bg-white text-slate-600',
                        )}
                      >
                        Khusus
                      </button>
                    </div>
                  </div>

                  {editingItem.marginGlobal === false && (
                    <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 sm:grid-cols-4">
                      {(['kiri', 'atas', 'kanan', 'bawah'] as const).map((side) => (
                        <div key={side}>
                          <label className="mb-1 block text-[11px] font-semibold capitalize text-slate-600">
                            Margin {side} (cm)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editingItem.margin?.[side] ?? OPENSID_MARGIN_DEFAULT[side]}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                margin: {
                                  ...(editingItem.margin || OPENSID_MARGIN_DEFAULT),
                                  [side]: parseFloat(e.target.value || '0'),
                                },
                              })
                            }
                            className="h-8 bg-white text-xs font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Penomoran Surat Global vs Khusus */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:col-span-12">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-800">
                        Gunakan Penomoran Surat Global
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Format Global:{' '}
                        <code className="rounded bg-white px-1.5 py-0.5 font-mono text-blue-700 border border-slate-200">
                          {effectiveGlobalSettings.formatNomorGlobal}
                        </code>
                      </span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, formatNomorGlobal: true })}
                        className={cn(
                          'rounded-md px-3.5 py-1 text-xs font-bold transition',
                          editingItem.formatNomorGlobal !== false
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 bg-white text-slate-600',
                        )}
                      >
                        Ya (Global)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, formatNomorGlobal: false })}
                        className={cn(
                          'rounded-md px-3.5 py-1 text-xs font-bold transition',
                          editingItem.formatNomorGlobal === false
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 bg-white text-slate-600',
                        )}
                      >
                        Khusus
                      </button>
                    </div>
                  </div>

                  {editingItem.formatNomorGlobal === false && (
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Format Nomor Surat Khusus Untuk Layanan Ini
                      </label>
                      <Input
                        value={editingItem.formatNomor || OPENSID_FORMAT_NOMOR_DEFAULT}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, formatNomor: e.target.value })
                        }
                        placeholder="[kode_surat]/[nomor_surat, 3]/[bulan_romawi]/[tahun]"
                        className="h-8 bg-white font-mono text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* GRUP 3: Pengaturan Kop, Footer & Atribut Layanan */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>3. Komponen Kop, Footer & Atribut Pengajuan</span>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {/* Header / Kop */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <label className="mb-1 block text-xs font-bold text-slate-800">
                    Header / Kop Surat
                  </label>
                  <p className="mb-2 text-[10px] text-slate-500">
                    Kop diambil dari /admin/settings
                  </p>
                  <select
                    value={editingItem.header ?? 1}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        header: Number(e.target.value) as 0 | 1 | 2,
                      })
                    }
                    className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs font-semibold"
                  >
                    <option value={1}>Semua Halaman</option>
                    <option value={2}>Hanya Halaman Awal</option>
                    <option value={0}>Tidak (Tanpa Kop)</option>
                  </select>
                </div>

                {/* Footer Dokumen */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="pr-2">
                    <span className="block text-xs font-bold text-slate-800">Tampilkan Footer</span>
                    <span className="text-[10px] text-slate-500">Catatan kaki nomor halaman surat</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingItem.footer !== false}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, footer: e.target.checked })
                    }
                    className="h-4 w-4 accent-blue-600 shrink-0"
                  />
                </div>

                {/* QR Code Verifikasi */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="pr-2">
                    <span className="block text-xs font-bold text-slate-800">QR Code Verifikasi</span>
                    <span className="text-[10px] text-slate-500">Matriks QR scannable keabsahan</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(editingItem.qrCode)}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, qrCode: e.target.checked })
                    }
                    className="h-4 w-4 accent-emerald-600 shrink-0"
                  />
                </div>

                {/* Logo Burung Garuda */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="pr-2">
                    <span className="block text-xs font-bold text-slate-800">Logo Garuda Pancasila</span>
                    <span className="text-[10px] text-slate-500">Gunakan lambang Garuda pada kop</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(editingItem.logoGaruda)}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, logoGaruda: e.target.checked })
                    }
                    className="h-4 w-4 accent-blue-600 shrink-0"
                  />
                </div>

                {/* Kirim ke Kecamatan */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="pr-2">
                    <span className="block text-xs font-bold text-slate-800">Teruskan ke Kecamatan</span>
                    <span className="text-[10px] text-slate-500">Untuk pengesahan Camat</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(editingItem.kecamatan)}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, kecamatan: e.target.checked })
                    }
                    className="h-4 w-4 accent-blue-600 shrink-0"
                  />
                </div>

                {/* Tampilkan di /layanan-surat (Switch ON / OFF) */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="pr-2">
                    <span className="block text-xs font-bold text-slate-800">Tampilkan di /layanan-surat</span>
                    <span className="text-[10px] text-slate-500">ON = Tampil di halaman /layanan-surat, OFF = Disembunyikan</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editingItem.isActive !== false}
                    onClick={() => {
                      const next = editingItem.isActive === false;
                      setEditingItem({
                        ...editingItem,
                        isActive: next,
                        mandiri: next,
                      });
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ${
                      editingItem.isActive !== false ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                        editingItem.isActive !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* GRUP 4: Lampiran Dokumen Resmi (Dukcapil / KUA) */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  <span>4. Lampiran Dokumen Resmi (Dukcapil / KUA)</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-semibold">
                  {(editingItem.lampiran || []).length} Lampiran Terpilih
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {OPENSID_LAMPIRAN_OPTIONS.map((lamp) => {
                  const active = (editingItem.lampiran || []).includes(lamp.id);
                  return (
                    <button
                      key={lamp.id}
                      type="button"
                      onClick={() => {
                        const cur = editingItem.lampiran || [];
                        const next = active
                          ? cur.filter((x) => x !== lamp.id)
                          : [...cur, lamp.id];
                        setEditingItem({ ...editingItem, lampiran: next });
                      }}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5',
                        active
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100',
                      )}
                    >
                      {active && <Check className="h-3 w-3 stroke-[3]" />}
                      <span>{lamp.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GRUP 5: Dokumen Syarat Surat */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>5. Daftar Dokumen Persyaratan Surat</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Pilih dokumen yang wajib diunggah/dilengkapi pemohon saat mengajukan permohonan.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={newSyaratText}
                    onChange={(e) => setNewSyaratText(e.target.value)}
                    placeholder="Tambah syarat baru..."
                    className="h-8 w-44 sm:w-56 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!newSyaratText.trim()) return;
                      const cur = editingItem.syaratSurat || [];
                      if (!cur.includes(newSyaratText.trim())) {
                        setEditingItem({
                          ...editingItem,
                          syaratSurat: [...cur, newSyaratText.trim()],
                        });
                      }
                      setNewSyaratText('');
                    }}
                    className="h-8 gap-1 text-xs shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah
                  </Button>
                </div>
              </div>

              {/* Tabel Syarat Responsif */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="w-10 px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={
                              (editingItem.syaratSurat || []).length > 0 &&
                              (editingItem.syaratSurat || []).length === allSyaratOptions.length
                            }
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                syaratSurat: e.target.checked ? [...allSyaratOptions] : [],
                              })
                            }
                            className="h-3.5 w-3.5 accent-blue-600"
                          />
                        </th>
                        <th className="w-12 px-3 py-2.5 text-slate-500">NO</th>
                        <th className="px-3 py-2.5 font-bold uppercase text-slate-700">NAMA DOKUMEN PERSYARATAN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {allSyaratOptions.map((dok, idx) => {
                        const checked = (editingItem.syaratSurat || []).includes(dok);
                        return (
                          <tr
                            key={dok}
                            onClick={() => {
                              const cur = editingItem.syaratSurat || [];
                              const next = checked
                                ? cur.filter((x) => x !== dok)
                                : [...cur, dok];
                              setEditingItem({ ...editingItem, syaratSurat: next });
                            }}
                            className={cn(
                              'cursor-pointer transition',
                              checked ? 'bg-blue-50/60 font-semibold text-blue-950' : 'hover:bg-slate-50',
                            )}
                          >
                            <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  const cur = editingItem.syaratSurat || [];
                                  const next = checked
                                    ? cur.filter((x) => x !== dok)
                                    : [...cur, dok];
                                  setEditingItem({ ...editingItem, syaratSurat: next });
                                }}
                                className="h-3.5 w-3.5 accent-blue-600"
                              />
                            </td>
                            <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2">{dok}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 2: TEMPLATE - Editor HTML TinyMCE & Pratinjau Kertas Cetak
           ==================================================================== */}
        {activeMainTab === 'template' && (
          <div className="space-y-4 p-4 sm:p-5">
            {/* Toolbar Atas: Responsif di PC dan HP */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {/* Salin Template OpenSID */}
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const url = e.target.value;
                    if (!url) return;
                    const found = OPENSID_RAW_TEMPLATES.find((t) => t.url_surat === url);
                    if (found && found.template) {
                      setEditingItem({
                        ...editingItem,
                        templateDesa: found.template,
                      });
                      toast({
                        title: 'Template Disalin',
                        description: `Isi template "${found.nama}" telah dimuat ke editor.`,
                      });
                    }
                    e.target.value = '';
                  }}
                  className="h-8 max-w-[220px] rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700"
                >
                  <option value="">Salin Standar OpenSID...</option>
                  {OPENSID_RAW_TEMPLATES.map((tpl) => (
                    <option key={tpl.url_surat} value={tpl.url_surat}>
                      [{tpl.kode_surat}] Surat {tpl.nama}
                    </option>
                  ))}
                </select>

                {/* Sisipkan [Kode_Isian] */}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setKodeIsianModalOpen(true)}
                  className="h-8 gap-1.5 bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Katalog [Kode_Isian]</span>
                </Button>

                {/* Pagebreak */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInsertKodeIsianTag('\n<!-- pagebreak -->\n')}
                  className="h-8 gap-1.5 text-xs bg-white"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">+ Halaman Baru</span>
                  <span className="inline sm:hidden">+ Hal</span>
                </Button>

                {/* Reset */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!window.confirm('Kembalikan isi template ke bawaan asli sistem?')) return;
                    setEditingItem({
                      ...editingItem,
                      templateDesa: editingItem.template || getFallbackTemplateHtml(editingItem.jenisSurat),
                    });
                    toast({
                      title: 'Template Direset',
                      description: 'Isi template dikembalikan ke bawaan sistem.',
                    });
                  }}
                  className="h-8 gap-1 text-xs text-amber-700 hover:bg-amber-50 bg-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </Button>
              </div>

              {/* Mode Tampilan Switcher */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setTemplateEditorMode('split')}
                  className={cn(
                    'rounded px-2.5 py-1 text-xs font-semibold transition',
                    templateEditorMode === 'split'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  Split
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateEditorMode('visual')}
                  className={cn(
                    'rounded px-2.5 py-1 text-xs font-semibold transition',
                    templateEditorMode === 'visual'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  Visual
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateEditorMode('html')}
                  className={cn(
                    'rounded px-2.5 py-1 text-xs font-semibold transition',
                    templateEditorMode === 'html'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  HTML
                </button>
              </div>
            </div>

            {/* Chips Cepat Kode Isian Surat Ini */}
            {(editingItem.kodeIsian || []).length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2">
                <span className="text-[11px] font-bold text-blue-800 shrink-0">
                  Tag Surat Ini (Klik sisip):
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {(editingItem.kodeIsian || []).map((ki, idx) => (
                    <button
                      key={`${ki.kode}-${idx}`}
                      type="button"
                      onClick={() => handleInsertKodeIsianTag(ki.kode)}
                      className="rounded border border-blue-200 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-700 hover:bg-blue-600 hover:text-white transition shrink-0"
                    >
                      {ki.kode}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Area Editor & Pratinjau Cetak */}
            <div
              className={cn(
                'grid gap-4',
                templateEditorMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1',
              )}
            >
              {/* Kolom Kiri: HTML Editor */}
              {(templateEditorMode === 'html' || templateEditorMode === 'split') && (
                <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-3.5 py-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Code2 className="h-4 w-4 text-blue-600" />
                      Template HTML Naskah Surat
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {(editingItem.templateDesa || editingItem.template || '').length} karakter
                    </span>
                  </div>
                  <Textarea
                    ref={htmlTextareaRef}
                    value={editingItem.templateDesa || editingItem.template || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        templateDesa: e.target.value,
                      })
                    }
                    className="min-h-[520px] resize-y rounded-none border-0 font-mono text-xs leading-relaxed focus-visible:ring-0 p-4"
                    placeholder="Masukkan kode HTML template surat..."
                  />
                </div>
              )}

              {/* Mode Visual WYSIWYG */}
              {templateEditorMode === 'visual' && (
                <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                  <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-2">
                    <span className="mr-2 text-xs font-bold text-slate-700">
                      Penyunting Visual (Klik pada naskah untuk mengedit langsung):
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs font-bold"
                      onClick={() => document.execCommand('bold')}
                    >
                      B
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs italic"
                      onClick={() => document.execCommand('italic')}
                    >
                      I
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs underline"
                      onClick={() => document.execCommand('underline')}
                    >
                      U
                    </Button>
                  </div>
                  <div className="overflow-x-auto bg-slate-200/80 p-4 sm:p-8">
                    <div
                      ref={visualEditorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        setEditingItem({
                          ...editingItem,
                          templateDesa: e.currentTarget.innerHTML,
                        })
                      }
                      dangerouslySetInnerHTML={{
                        __html: editingItem.templateDesa || editingItem.template || '',
                      }}
                      className="mx-auto min-h-[640px] w-full max-w-[21.5cm] bg-white p-6 sm:p-10 text-black shadow-md outline-none"
                      style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: '11pt' }}
                    />
                  </div>
                </div>
              )}

              {/* Kolom Kanan (pada Split Mode): Pratinjau Lembar Kertas */}
              {templateEditorMode === 'split' && (
                <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-100 shadow-xs overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3.5 py-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Eye className="h-4 w-4 text-emerald-600" />
                      Pratinjau Hasil Cetak Dokumen
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {livePreviewRendered.ukuran} • {livePreviewRendered.orientasi}
                    </Badge>
                  </div>
                  <div className="max-h-[580px] overflow-x-auto overflow-y-auto p-3 sm:p-5">
                    <div className="mb-2 text-center text-[11px] text-slate-400 italic block lg:hidden">
                      (Geser ke samping jika lembar terpotong di layar HP)
                    </div>
                    {livePreviewRendered.pagesHtml.map((pageHtml, idx) => (
                      <div
                        key={idx}
                        className="mx-auto mb-6 bg-white text-black shadow-md shrink-0"
                        style={{
                          width: livePreviewRendered.orientasi === 'Landscape' ? '29.7cm' : '21cm',
                          minHeight: '27cm',
                          paddingTop: `${livePreviewRendered.margin.atas}cm`,
                          paddingBottom: `${livePreviewRendered.margin.bawah}cm`,
                          paddingLeft: `${livePreviewRendered.margin.kiri}cm`,
                          paddingRight: `${livePreviewRendered.margin.kanan}cm`,
                          fontFamily: "Arial, Helvetica, sans-serif",
                          fontSize: '11pt',
                          lineHeight: 1.45,
                        }}
                      >
                        {(editingItem.header === 1 || (editingItem.header === 2 && idx === 0)) &&
                          livePreviewRendered.headerRendered && (
                            <div
                              className="mb-3"
                              dangerouslySetInnerHTML={{ __html: livePreviewRendered.headerRendered }}
                            />
                          )}
                        <div dangerouslySetInnerHTML={{ __html: pageHtml }} />
                        {editingItem.footer !== false && livePreviewRendered.footerRendered && (
                          <div
                            className="mt-8"
                            dangerouslySetInnerHTML={{ __html: livePreviewRendered.footerRendered }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 3: FORM ISIAN - Manajemen Bagian Form & Kode Isian
           ==================================================================== */}
        {activeMainTab === 'form_isian' && (
          <div className="space-y-6 p-4 sm:p-6">
            {/* Baris Atas: Toggle Sumber Penduduk Berulang + Tombol Tambah Bagian */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                  Data Pelaku Digunakan Berulang
                </span>
                <span className="text-xs text-slate-500">
                  Izinkan penduduk yang sama dipilih pada lebih dari satu bagian form pelaku
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, sumberPendudukBerulang: true })}
                    className={cn(
                      'rounded-md px-3.5 py-1 text-xs font-bold transition',
                      editingItem.sumberPendudukBerulang
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 bg-white text-slate-600',
                    )}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, sumberPendudukBerulang: false })}
                    className={cn(
                      'rounded-md px-3.5 py-1 text-xs font-bold transition',
                      !editingItem.sumberPendudukBerulang
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 bg-white text-slate-600',
                    )}
                  >
                    Tidak
                  </button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setNewSectionModalOpen(true)}
                  className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs shrink-0 font-bold"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Bagian</span>
                </Button>
              </div>
            </div>

            {/* Sub-Tab Bagian Form: Horizontal scrollable */}
            <div className="border-b border-slate-200">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1">
                {sectionKeys.map((secKey) => {
                  const cfg = formIsianObj[secKey] || normalizeFormSectionConfig(secKey, {});
                  const isSelected = currentSecKey === secKey;
                  const countKode = (editingItem.kodeIsian || []).filter(
                    (k) => (k.kategori || 'individu') === secKey,
                  ).length;
                  return (
                    <button
                      key={secKey}
                      type="button"
                      onClick={() => setActiveFormSectionTab(secKey)}
                      className={cn(
                        'flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold transition whitespace-nowrap',
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                      )}
                    >
                      <span>{secKey === 'individu' ? 'Utama (Individu)' : cfg.judul || secKey}</span>
                      <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700">
                        {countKode}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Konten Bagian Form Aktif */}
            <div className="space-y-5">
              {/* Card Metadata Bagian Form */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Pengaturan Bagian:{' '}
                    <span className="text-blue-700 font-extrabold">
                      {currentSecKey === 'individu' ? 'Utama (Individu)' : currentSecCfg.judul || currentSecKey}
                    </span>
                  </h3>
                  {currentSecKey !== 'individu' && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveFormSection(currentSecKey)}
                      className="h-7 gap-1 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus Bagian Ini</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                  {currentSecKey !== 'individu' && (
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Judul Bagian
                      </label>
                      <Input
                        value={currentSecCfg.judul || ''}
                        onChange={(e) => updateFormSection(currentSecKey, { judul: e.target.value })}
                        placeholder="Contoh: Ayah / Saksi I / Tanah"
                        className="h-8 bg-white text-xs"
                      />
                    </div>
                  )}

                  <div className={currentSecKey === 'individu' ? 'sm:col-span-4' : 'sm:col-span-3'}>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Label Bagian (Isi <code className="text-red-600">-</code> sembunyikan)
                    </label>
                    <Input
                      value={currentSecCfg.label ?? ''}
                      onChange={(e) => updateFormSection(currentSecKey, { label: e.target.value })}
                      placeholder="Contoh: Identitas Pemohon"
                      className="h-8 bg-white text-xs"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Info / Petunjuk Form
                    </label>
                    <Input
                      value={currentSecCfg.info || ''}
                      onChange={(e) => updateFormSection(currentSecKey, { info: e.target.value })}
                      placeholder="Petunjuk untuk operator..."
                      className="h-8 bg-white text-xs"
                    />
                  </div>

                  {currentSecKey !== 'individu' && (
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Prefix Tag
                      </label>
                      <Input
                        value={currentSecCfg.prefix || currentSecKey}
                        onChange={(e) =>
                          updateFormSection(currentSecKey, {
                            prefix: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                          })
                        }
                        className="h-8 bg-white font-mono text-xs"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Peran Sebagai
                    </label>
                    <select
                      value={Number(currentSecCfg.sebagai ?? (currentSecKey === 'individu' ? 1 : 0))}
                      onChange={(e) =>
                        updateFormSection(currentSecKey, { sebagai: Number(e.target.value) })
                      }
                      className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
                    >
                      {OPENSID_SEBAGAI_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Card Pengaturan Sumber Data Pelaku */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Aturan Data Pelaku ({currentSecKey === 'individu' ? 'Utama' : currentSecCfg.judul})
                  </h4>
                </div>

                <div className="space-y-3.5">
                  {/* Tampil Sumber Data (Bagian Tambahan) */}
                  {currentSecKey !== 'individu' && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="block text-xs font-bold text-slate-800">
                          Tampilkan Pilihan Penduduk
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Apakah petugas dapat memilih data dari database kependudukan desa
                        </span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {[
                          { val: 1, label: 'Ya (Tampilkan)' },
                          { val: 0, label: 'Tidak (Kode Isian Saja)' },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => updateFormSection(currentSecKey, { sumber: opt.val })}
                            className={cn(
                              'rounded-md px-3 py-1 text-xs font-bold transition',
                              Number(currentSecCfg.sumber ?? 1) === opt.val
                                ? 'bg-blue-600 text-white'
                                : 'border border-slate-300 bg-white text-slate-600',
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {Number(currentSecCfg.sumber ?? 1) === 1 && (
                    <>
                      {/* Sumber Data Wajib Diisi */}
                      {currentSecKey !== 'individu' && (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                          <span className="text-xs font-bold text-slate-800">
                            Wajib Mengisi Sumber Data Penduduk
                          </span>
                          <div className="flex gap-2 shrink-0">
                            {[
                              { val: 1, label: 'Ya (Wajib)' },
                              { val: 0, label: 'Tidak' },
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() => updateFormSection(currentSecKey, { sumber_wajib: opt.val })}
                                className={cn(
                                  'rounded-md px-3 py-1 text-xs font-bold transition',
                                  Number(currentSecCfg.sumber_wajib ?? 0) === opt.val
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-slate-300 bg-white text-slate-600',
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Asal Data Pelaku */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold text-slate-800">
                          Cakupan Asal Data Pelaku
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {OPENSID_DATA_PELAKU_OPTIONS.map((dp) => {
                            const selected = (currentSecCfg.data || ['1']).includes(dp.id);
                            return (
                              <button
                                key={dp.id}
                                type="button"
                                onClick={() => {
                                  const cur = currentSecCfg.data || ['1'];
                                  const next = selected
                                    ? cur.filter((x) => x !== dp.id)
                                    : [...cur, dp.id];
                                  if (next.length === 0) return;
                                  updateFormSection(currentSecKey, { data: next });
                                }}
                                className={cn(
                                  'rounded-md border px-3 py-1 text-xs font-semibold transition',
                                  selected
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-slate-300 bg-white text-slate-700',
                                )}
                              >
                                {dp.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Filter Jenis Kelamin */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold text-slate-800">
                          Filter Jenis Kelamin
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {OPENSID_JENIS_KELAMIN_OPTIONS.map((jk) => (
                            <button
                              key={jk.id || 'all'}
                              type="button"
                              onClick={() => updateFormSection(currentSecKey, { sex: jk.id })}
                              className={cn(
                                'rounded-md border px-3 py-1 text-xs font-semibold transition',
                                String(currentSecCfg.sex ?? '') === jk.id
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-300 bg-white text-slate-700',
                              )}
                            >
                              {jk.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Filter SHDK */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <span className="block text-xs font-bold text-slate-800">
                            Filter Hubungan Keluarga (SHDK)
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateFormSection(currentSecKey, {
                                kk_level: OPENSID_SHDK_OPTIONS.map((o) => o.id),
                              })
                            }
                            className="mt-0.5 text-[11px] font-semibold text-blue-600 hover:underline"
                          >
                            Pilih Semua SHDK
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-w-lg">
                          {OPENSID_SHDK_OPTIONS.map((shdk) => {
                            const selected = (currentSecCfg.kk_level || []).includes(shdk.id);
                            return (
                              <button
                                key={shdk.id}
                                type="button"
                                onClick={() => {
                                  const cur = currentSecCfg.kk_level || [];
                                  const next = selected
                                    ? cur.filter((x) => x !== shdk.id)
                                    : [...cur, shdk.id];
                                  updateFormSection(currentSecKey, { kk_level: next });
                                }}
                                className={cn(
                                  'rounded-md border px-2.5 py-1 text-xs font-medium transition',
                                  selected
                                    ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold'
                                    : 'border-slate-200 bg-white text-slate-600',
                                )}
                              >
                                {shdk.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card Tabel Kode Isian Form */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-100/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Daftar Kode Isian Form ({currentSecKey === 'individu' ? 'Utama' : currentSecCfg.judul})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Setiap isian menghasilkan field input formulir dan variabel tag <code className="text-blue-700 font-mono">[form_...]</code>
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddKodeIsianRow(currentSecKey)}
                    className="gap-1.5 bg-blue-600 text-xs text-white hover:bg-blue-700 font-bold shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Kode Isian
                  </Button>
                </div>

                {/* TAMPILAN PC (Desktop Table >= sm) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                      <tr>
                        <th className="w-10 px-2 py-2.5 text-center">#</th>
                        <th className="w-36 px-2.5 py-2.5">TIPE</th>
                        <th className="w-44 px-2.5 py-2.5">NAMA & TAG KODE</th>
                        <th className="w-40 px-2.5 py-2.5">LABEL FORM</th>
                        <th className="w-40 px-2.5 py-2.5">PLACEHOLDER</th>
                        <th className="w-16 px-2 py-2.5 text-center">WAJIB</th>
                        <th className="w-24 px-2 py-2.5">KOLOM</th>
                        <th className="w-32 px-2.5 py-2.5">ATRIBUT</th>
                        <th className="min-w-[180px] px-2.5 py-2.5">PILIHAN / REFERENSI</th>
                        <th className="w-28 px-2.5 py-2.5 text-center">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(editingItem.kodeIsian || [])
                        .map((ki, globalIdx) => ({ ki, globalIdx }))
                        .filter(({ ki }) => (ki.kategori || 'individu') === currentSecKey)
                        .map(({ ki, globalIdx }, localIdx) => (
                          <tr key={`${ki.kode}-${globalIdx}`} className="align-top hover:bg-slate-50/70">
                            {/* Urutan */}
                            <td className="px-2 py-2.5 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="font-bold text-slate-500">{localIdx + 1}</span>
                                <div className="flex gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveKodeIsianRowOrder(globalIdx, 'up')}
                                    className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                    title="Geser Naik"
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveKodeIsianRowOrder(globalIdx, 'down')}
                                    className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                    title="Geser Turun"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* TIPE */}
                            <td className="px-2.5 py-2.5">
                              <select
                                value={ki.tipe}
                                onChange={(e) =>
                                  handleUpdateKodeIsianRow(globalIdx, { tipe: e.target.value })
                                }
                                className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                              >
                                {OPENSID_TIPE_ISIAN_OPTIONS.map((t) => (
                                  <option key={t.value} value={t.value}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* NAMA & KODE TAG */}
                            <td className="px-2.5 py-2.5">
                              <Input
                                value={ki.nama}
                                onChange={(e) =>
                                  handleUpdateKodeIsianRow(globalIdx, { nama: e.target.value })
                                }
                                placeholder="Nama Isian"
                                className="h-8 text-xs font-semibold"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(ki.kode);
                                  toast({
                                    title: 'Tag Disalin',
                                    description: `${ki.kode} disalin ke clipboard.`,
                                  });
                                }}
                                className="mt-1 inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
                                title="Klik untuk menyalin"
                              >
                                <Copy className="h-2.5 w-2.5" />
                                <span>{ki.kode}</span>
                              </button>
                            </td>

                            {/* LABEL */}
                            <td className="px-2.5 py-2.5">
                              <Input
                                value={ki.label ?? ki.nama}
                                onChange={(e) =>
                                  handleUpdateKodeIsianRow(globalIdx, { label: e.target.value })
                                }
                                placeholder="Label form"
                                className="h-8 text-xs"
                              />
                            </td>

                            {/* PLACEHOLDER */}
                            <td className="px-2.5 py-2.5">
                              <Input
                                value={ki.deskripsi || ''}
                                onChange={(e) =>
                                  handleUpdateKodeIsianRow(globalIdx, { deskripsi: e.target.value })
                                }
                                placeholder="Masukkan..."
                                className="h-8 text-xs"
                              />
                            </td>

                            {/* WAJIB */}
                            <td className="px-2 py-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={ki.required === '1' || ki.required === 1 || ki.required === true}
                                onChange={(e) =>
                                  handleUpdateKodeIsianRow(globalIdx, {
                                    required: e.target.checked ? '1' : '0',
                                  })
                                }
                                className="mt-2 h-4 w-4 accent-blue-600"
                              />
                            </td>

                            {/* KOLOM */}
                            <td className="px-2 py-2.5">
                              <select
                                value={Number(ki.kolom || 6)}
                                onChange={(e) =>
                                  handleUpdateKodeIsianRow(globalIdx, {
                                    kolom: Number(e.target.value),
                                  })
                                }
                                className="h-8 w-full rounded border border-slate-300 bg-white px-1 text-xs"
                              >
                                {[12, 8, 6, 4, 3].map((col) => (
                                  <option key={col} value={col}>
                                    col-{col}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* ATRIBUT */}
                            <td className="px-2.5 py-2.5">
                              <Input
                                value={ki.atribut || ''}
                                onChange={(e) =>
                                  handleUpdateKodeIsianRow(globalIdx, { atribut: e.target.value })
                                }
                                placeholder='rows="3"'
                                className="h-8 font-mono text-xs"
                              />
                            </td>

                            {/* PILIHAN / REFERENSI */}
                            <td className="px-2.5 py-2.5">
                              {ki.tipe === 'select-manual' ? (
                                <Input
                                  value={
                                    Array.isArray(ki.pilihan)
                                      ? ki.pilihan.join(', ')
                                      : ki.pilihan || ''
                                  }
                                  onChange={(e) =>
                                    handleUpdateKodeIsianRow(globalIdx, {
                                      pilihan: e.target.value
                                        .split(',')
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                    })
                                  }
                                  placeholder="Opsi 1, Opsi 2"
                                  className="h-8 text-xs"
                                />
                              ) : ki.tipe === 'select-otomatis' ? (
                                <select
                                  value={ki.refrensi || 'Agama'}
                                  onChange={(e) =>
                                    handleUpdateKodeIsianRow(globalIdx, {
                                      refrensi: e.target.value,
                                    })
                                  }
                                  className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                                >
                                  {Object.keys(OPENSID_REFERENSI_DATA).map((refName) => (
                                    <option key={refName} value={refName}>
                                      {refName}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="inline-block pt-1.5 text-[11px] text-slate-400">
                                  -
                                </span>
                              )}
                            </td>

                            {/* AKSI */}
                            <td className="px-2.5 py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {sectionKeys.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMoveKodeIndex(globalIdx);
                                      setMoveTargetCategory(
                                        sectionKeys.find((k) => k !== currentSecKey) || 'individu',
                                      );
                                    }}
                                    className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                                    title="Pindahkan Bagian"
                                  >
                                    <ArrowRightLeft className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setLinkKodeIndex(globalIdx)}
                                  className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                                  title="Kaitkan Kode Isian"
                                >
                                  <Link2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteKodeIsianRow(globalIdx)}
                                  className="rounded border border-red-200 bg-red-50 p-1 text-red-600 hover:bg-red-100"
                                  title="Hapus"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                      {(editingItem.kodeIsian || []).filter(
                        (ki) => (ki.kategori || 'individu') === currentSecKey,
                      ).length === 0 && (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                            Belum ada kode isian pada bagian{' '}
                            <strong>{currentSecKey === 'individu' ? 'Utama' : currentSecCfg.judul}</strong>.
                            Klik <strong>+ Tambah Kode Isian</strong> untuk menambahkan field form.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* TAMPILAN MOBILE (Card List < sm) */}
                <div className="block sm:hidden divide-y divide-slate-200">
                  {(editingItem.kodeIsian || [])
                    .map((ki, globalIdx) => ({ ki, globalIdx }))
                    .filter(({ ki }) => (ki.kategori || 'individu') === currentSecKey)
                    .map(({ ki, globalIdx }, localIdx) => (
                      <div key={`${ki.kode}-${globalIdx}`} className="p-3.5 space-y-3 bg-white">
                        {/* Baris Atas Kartu */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                              {localIdx + 1}
                            </span>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {ki.tipe}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveKodeIsianRowOrder(globalIdx, 'up')}
                              className="rounded border border-slate-200 p-1 text-slate-500 hover:bg-slate-100"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveKodeIsianRowOrder(globalIdx, 'down')}
                              className="rounded border border-slate-200 p-1 text-slate-500 hover:bg-slate-100"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                            {sectionKeys.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMoveKodeIndex(globalIdx);
                                  setMoveTargetCategory(
                                    sectionKeys.find((k) => k !== currentSecKey) || 'individu',
                                  );
                                }}
                                className="rounded border border-slate-200 p-1 text-slate-600 hover:bg-blue-50"
                              >
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setLinkKodeIndex(globalIdx)}
                              className="rounded border border-slate-200 p-1 text-slate-600 hover:bg-indigo-50"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteKodeIsianRow(globalIdx)}
                              className="rounded border border-red-200 bg-red-50 p-1 text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Input Nama & Tag */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600">
                            Nama Isian
                          </label>
                          <Input
                            value={ki.nama}
                            onChange={(e) => handleUpdateKodeIsianRow(globalIdx, { nama: e.target.value })}
                            className="h-8 text-xs font-semibold mt-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(ki.kode);
                              toast({ title: 'Tag Disalin', description: ki.kode });
                            }}
                            className="mt-1 inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-blue-700"
                          >
                            <Copy className="h-2.5 w-2.5" />
                            <span>{ki.kode}</span>
                          </button>
                        </div>

                        {/* Input Label & Placeholder */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Label Form
                            </label>
                            <Input
                              value={ki.label ?? ki.nama}
                              onChange={(e) => handleUpdateKodeIsianRow(globalIdx, { label: e.target.value })}
                              className="h-8 text-xs mt-1"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Placeholder
                            </label>
                            <Input
                              value={ki.deskripsi || ''}
                              onChange={(e) => handleUpdateKodeIsianRow(globalIdx, { deskripsi: e.target.value })}
                              className="h-8 text-xs mt-1"
                            />
                          </div>
                        </div>

                        {/* Tipe, Kolom & Wajib */}
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Tipe Input
                            </label>
                            <select
                              value={ki.tipe}
                              onChange={(e) => handleUpdateKodeIsianRow(globalIdx, { tipe: e.target.value })}
                              className="h-8 w-full rounded border border-slate-300 bg-white px-1 text-xs mt-1"
                            >
                              {OPENSID_TIPE_ISIAN_OPTIONS.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Lebar
                            </label>
                            <select
                              value={Number(ki.kolom || 6)}
                              onChange={(e) =>
                                handleUpdateKodeIsianRow(globalIdx, { kolom: Number(e.target.value) })
                              }
                              className="h-8 w-full rounded border border-slate-300 bg-white px-1 text-xs mt-1"
                            >
                              {[12, 8, 6, 4, 3].map((col) => (
                                <option key={col} value={col}>
                                  col-{col}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="pt-4 text-center">
                            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ki.required === '1' || ki.required === 1 || ki.required === true}
                                onChange={(e) =>
                                  handleUpdateKodeIsianRow(globalIdx, {
                                    required: e.target.checked ? '1' : '0',
                                  })
                                }
                                className="h-4 w-4 accent-blue-600"
                              />
                              <span>Wajib</span>
                            </label>
                          </div>
                        </div>

                        {/* Opsi / Referensi jika tipe select */}
                        {ki.tipe === 'select-manual' && (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Opsi Pilihan (Pisahkan dengan koma)
                            </label>
                            <Input
                              value={
                                Array.isArray(ki.pilihan)
                                  ? ki.pilihan.join(', ')
                                  : ki.pilihan || ''
                              }
                              onChange={(e) =>
                                handleUpdateKodeIsianRow(globalIdx, {
                                  pilihan: e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                              placeholder="Opsi 1, Opsi 2"
                              className="h-8 text-xs mt-1"
                            />
                          </div>
                        )}
                        {ki.tipe === 'select-otomatis' && (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600">
                              Data Referensi Otomatis
                            </label>
                            <select
                              value={ki.refrensi || 'Agama'}
                              onChange={(e) => handleUpdateKodeIsianRow(globalIdx, { refrensi: e.target.value })}
                              className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs mt-1"
                            >
                              {Object.keys(OPENSID_REFERENSI_DATA).map((refName) => (
                                <option key={refName} value={refName}>
                                  {refName}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ))}

                  {(editingItem.kodeIsian || []).filter(
                    (ki) => (ki.kategori || 'individu') === currentSecKey,
                  ).length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-500">
                      Belum ada isian pada bagian ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 4: PENANDATANGANAN QR - Aturan QR Code, BSrE, dan Simulasi Cetak
           ==================================================================== */}
        {activeMainTab === 'qr_tte' && (
          <div className="space-y-6 p-4 sm:p-6">
            {/* Banner Atas */}
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-600 p-2 text-white shrink-0 shadow-2xs">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Aturan Penandatanganan QR Code & Verifikasi Surat (Standar OpenSID)
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Mengatur matriks QR (<code className="font-mono text-emerald-800">[qr_code]</code> /{' '}
                    <code className="font-mono text-emerald-800">[qr_bsre]</code>), sisipan logo tengah desa, ukuran piksel, dan isi payload verifikasi.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInsertKodeIsianTag('[qr_code]')}
                  className="gap-1.5 border-blue-300 bg-white text-xs font-semibold text-blue-700 hover:bg-blue-50"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>Sisip [qr_code]</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={onApplyQrToAll}
                  className="gap-1.5 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Terapkan ke Semua Surat</span>
                </Button>
              </div>
            </div>

            {/* Konten 2 Kolom: Kiri Aturan Form, Kanan Simulasi Cetak */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Kolom Kiri: Form Aturan (7 Kolom) */}
              <div className="space-y-5 lg:col-span-7">
                {/* 1. Status & Mode Penandatanganan */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    1. Status & Mode Penandatanganan Dokumen
                  </h4>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Tampilkan QR Code */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Aktifkan Penandatanganan QR Code
                      </label>
                      <p className="mt-0.5 mb-2.5 text-[11px] text-slate-500">
                        Aturan <code>qr_code</code> Master Surat OpenSID
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => updateQrSettings({ enabled: true })}
                          className={cn(
                            'rounded-md py-1.5 text-xs font-bold transition',
                            currentQr.enabled
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100',
                          )}
                        >
                          Ya (Aktif)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateQrSettings({ enabled: false })}
                          className={cn(
                            'rounded-md py-1.5 text-xs font-bold transition',
                            !currentQr.enabled
                              ? 'bg-slate-700 text-white shadow-2xs'
                              : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100',
                          )}
                        >
                          Tidak
                        </button>
                      </div>
                    </div>

                    {/* Mode Default Cetak */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Pilihan Default Saat Cetak Dokumen
                      </label>
                      <p className="mt-0.5 mb-2.5 text-[11px] text-slate-500">
                        Opsi awal pada dialog cetak /admin/surat
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => updateQrSettings({ defaultSignMode: 'qr' as QrSignMode })}
                          className={cn(
                            'rounded-md py-1.5 text-xs font-bold transition',
                            currentQr.defaultSignMode !== 'manual'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100',
                          )}
                        >
                          TTD QR Code
                        </button>
                        <button
                          type="button"
                          onClick={() => updateQrSettings({ defaultSignMode: 'manual' as QrSignMode })}
                          className={cn(
                            'rounded-md py-1.5 text-xs font-bold transition',
                            currentQr.defaultSignMode === 'manual'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100',
                          )}
                        >
                          TTD Manual
                        </button>
                      </div>
                    </div>

                    {/* Footer TTE */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
                      <div className="pr-2">
                        <span className="block text-xs font-bold text-slate-800">
                          Tampilkan Footer TTE (UU ITE)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Catatan kaki UU ITE No. 11/2008 Pasal 5 Ayat 1
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(currentQr.showFooterTte || currentQr.tteEnabled)}
                        onChange={(e) =>
                          updateQrSettings({
                            showFooterTte: e.target.checked,
                            tteEnabled: e.target.checked,
                          })
                        }
                        className="h-4 w-4 accent-blue-600 shrink-0"
                      />
                    </div>

                    {/* Terapkan ke Lampiran */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
                      <div className="pr-2">
                        <span className="block text-xs font-bold text-slate-800">
                          Tampilkan QR pada Lampiran
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Sematkan QR pada tanda tangan lampiran resmi
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(currentQr.applyToLampiran)}
                        onChange={(e) => updateQrSettings({ applyToLampiran: e.target.checked })}
                        className="h-4 w-4 accent-blue-600 shrink-0"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Visual, Logo & Ukuran */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5">
                    <Sliders className="h-4 w-4 text-emerald-600" />
                    2. Spesifikasi Visual, Logo Tengah & Ukuran QR Code
                  </h4>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                    {/* Sisipkan Logo Tengah */}
                    <div className="sm:col-span-6">
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Logo di Tengah QR (<code>changeqr</code>)
                      </label>
                      <select
                        value={currentQr.logoMode || 'logo_desa'}
                        onChange={(e) => updateQrSettings({ logoMode: e.target.value as QrLogoMode })}
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
                      >
                        <option value="logo_desa">Otomatis (Logo Pemerintah Desa)</option>
                        <option value="garuda">Logo Burung Garuda Pancasila</option>
                        <option value="bsre">Badge TTE / BSrE</option>
                        <option value="none">Tanpa Logo (QR Code Polos)</option>
                      </select>
                      {currentQr.logoMode === 'logo_desa' && (
                        <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2 text-xs text-emerald-900">
                          {villageLogoUrl ? (
                            <img
                              src={villageLogoUrl}
                              alt="Logo Desa"
                              className="h-8 w-8 object-contain rounded border border-emerald-200 bg-white p-0.5 shadow-2xs"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded border border-amber-300 bg-amber-50 text-amber-700 font-bold text-[10px]">
                              DESA
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[11px] truncate">
                              {villageLogoUrl ? 'Logo Desa dari Pengaturan Aktif' : 'Logo Desa Belum Diunggah'}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Diambil otomatis dari <span className="font-medium text-emerald-700">/admin/settings - Logo Desa</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ukuran QR */}
                    <div className="sm:col-span-3">
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Ukuran QR (<code>sizeqr</code>)
                      </label>
                      <select
                        value={currentQr.sizePx || 90}
                        onChange={(e) => updateQrSettings({ sizePx: Number(e.target.value) || 90 })}
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800"
                      >
                        <option value={70}>70px x 70px (Kecil)</option>
                        <option value={80}>80px x 80px</option>
                        <option value={90}>90px x 90px (Standar)</option>
                        <option value={100}>100px x 100px</option>
                        <option value={115}>115px x 115px</option>
                        <option value={130}>130px x 130px</option>
                      </select>
                    </div>

                    {/* Warna Depan */}
                    <div className="sm:col-span-3">
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Warna (<code>foreqr</code>)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={currentQr.foreColor || '#000000'}
                          onChange={(e) => updateQrSettings({ foreColor: e.target.value })}
                          className="h-9 w-10 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                        />
                        <Input
                          value={currentQr.foreColor || '#000000'}
                          onChange={(e) => updateQrSettings({ foreColor: e.target.value })}
                          className="h-9 font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Label Caption di Bawah QR */}
                    <div className="sm:col-span-12">
                      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(currentQr.showCaptionBelowQr)}
                            onChange={(e) => updateQrSettings({ showCaptionBelowQr: e.target.checked })}
                            className="h-4 w-4 accent-blue-600"
                          />
                          <span>Tampilkan Keterangan Kecil di Bawah QR</span>
                        </label>
                        {currentQr.showCaptionBelowQr && (
                          <Input
                            value={currentQr.captionText || ''}
                            onChange={(e) => updateQrSettings({ captionText: e.target.value })}
                            placeholder="Ditandatangani secara elektronik"
                            className="h-8 max-w-xs bg-white text-xs"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Isi Payload Verifikasi (isiqr) */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    3. Aturan Isi Kode QR & Tautan Verifikasi (<code>isiqr</code>)
                  </h4>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {[
                        {
                          id: 'url_verifikasi',
                          label: 'Tautan Verifikasi Online',
                          desc: 'Halaman /verifikasi-surat',
                        },
                        {
                          id: 'ringkasan_dokumen',
                          label: 'Ringkasan Pengesahan',
                          desc: 'No Surat, Pemohon & Pejabat',
                        },
                        {
                          id: 'custom',
                          label: 'Template Kustom',
                          desc: 'Teks kustom variabel',
                        },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateQrSettings({ contentMode: opt.id as QrContentMode })}
                          className={cn(
                            'flex flex-col items-start rounded-lg border p-3 text-left transition',
                            currentQr.contentMode === opt.id
                              ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white hover:bg-slate-50',
                          )}
                        >
                          <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                          <span className="mt-0.5 text-[10px] text-slate-500">{opt.desc}</span>
                        </button>
                      ))}
                    </div>

                    {currentQr.contentMode === 'custom' && (
                      <div className="space-y-1.5 pt-2">
                        <label className="block text-xs font-bold text-slate-700">
                          Template Teks QR Kustom (Maks. 300 Karakter)
                        </label>
                        <Textarea
                          rows={3}
                          maxLength={300}
                          value={currentQr.customContentTemplate || ''}
                          onChange={(e) => updateQrSettings({ customContentTemplate: e.target.value })}
                          className="font-mono text-xs"
                        />
                      </div>
                    )}

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Contoh Isi QR Saat Dipindai (Scan):
                      </span>
                      <p className="mt-1 break-all font-mono text-xs text-slate-800">
                        {samplePayloadKades}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Pratinjau TTD QR vs Manual (5 Kolom) */}
              <div className="space-y-5 lg:col-span-5">
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Simulasi Hasil Cetak
                    </h4>
                    <Badge className="bg-blue-100 text-[10px] text-blue-800 font-mono">
                      {currentQr.sizePx}px • {currentQr.logoMode}
                    </Badge>
                  </div>

                  {/* Opsi 1: QR Code */}
                  <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                        <QrCode className="h-3 w-3" />
                        Opsi 1: Penandatanganan QR
                      </span>
                      <span className="text-[10px] font-medium text-emerald-800">
                        Scannable HP
                      </span>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center font-serif text-xs leading-snug text-black shadow-2xs">
                      <p>
                        {identity.namaDesa},{' '}
                        {new Date().toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="font-semibold">
                        Kepala {identity.sebutanDesa} {identity.namaDesa}
                      </p>
                      <div className="my-2 flex flex-col items-center justify-center">
                        <img
                          src={sampleQrDataUri}
                          alt="Preview QR Code"
                          style={{
                            width: `${currentQr.sizePx}px`,
                            height: `${currentQr.sizePx}px`,
                          }}
                          className="mx-auto border border-slate-100 p-0.5"
                        />
                        {currentQr.showCaptionBelowQr && currentQr.captionText && (
                          <span className="mt-1 font-sans text-[9px] text-slate-600">
                            {currentQr.captionText}
                          </span>
                        )}
                      </div>
                      <p className="font-bold underline uppercase tracking-wide">
                        {identity.namaKepalaDesa}
                      </p>
                      {identity.nipKepalaDesa && identity.nipKepalaDesa !== '-' && (
                        <p className="text-[10px]">NIP. {identity.nipKepalaDesa}</p>
                      )}
                    </div>
                  </div>

                  {/* Opsi 2: Manual */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700 px-2.5 py-0.5 text-[10px] font-bold text-white">
                        Opsi 2: Penandatanganan Manual
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        Basah & Stempel
                      </span>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center font-serif text-xs leading-snug text-black shadow-2xs">
                      <p>
                        {identity.namaDesa},{' '}
                        {new Date().toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="font-semibold">
                        Kepala {identity.sebutanDesa} {identity.namaDesa}
                      </p>
                      <div className="my-2 flex h-16 items-center justify-center text-[10px] italic text-slate-300">
                        (Ruang Tanda Tangan Basah & Stempel Desa)
                      </div>
                      <p className="font-bold underline uppercase tracking-wide">
                        {identity.namaKepalaDesa}
                      </p>
                      {identity.nipKepalaDesa && identity.nipKepalaDesa !== '-' && (
                        <p className="text-[10px]">NIP. {identity.nipKepalaDesa}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            FOOTER ACTION BAR: Responsif di PC & Mobile
           ==================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="border-slate-300 text-slate-700 text-xs sm:text-sm"
          >
            Batal
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onPreview(editingItem)}
              className="gap-1.5 border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs sm:text-sm font-semibold"
            >
              <Eye className="h-4 w-4" />
              <span>Tinjau PDF</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onSave(false)}
              className="gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs sm:text-sm font-semibold"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Simpan Sementara</span>
              <span className="inline sm:hidden">Simpan</span>
            </Button>
            <Button
              type="button"
              onClick={() => onSave(true)}
              className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm font-bold"
            >
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Simpan dan Keluar</span>
              <span className="inline sm:hidden">Selesai</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODALS: Tambah Bagian Form, Pindah Kode, Kaitkan Kode, Katalog Kode
         ==================================================================== */}
      {/* 1. Modal Tambah Bagian Form */}
      {newSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-bold text-slate-900">Tambah Bagian Form Pelaku / Objek</h3>
            <p className="text-xs text-slate-500">
              Contoh nama bagian OpenSID: <strong>Ayah</strong>, <strong>Ibu</strong>,{' '}
              <strong>Saksi I</strong>, <strong>Saksi II</strong>, <strong>Pembeli</strong>,{' '}
              <strong>Tanah</strong>, <strong>Barang</strong>.
            </p>
            <Input
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="Contoh: Saksi I..."
              className="mt-2 text-sm"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setNewSectionModalOpen(false)}>
                Batal
              </Button>
              <Button size="sm" onClick={handleAddFormSection} className="bg-emerald-600 text-white font-bold">
                Tambah Bagian
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Pindah Kode Isian */}
      {moveKodeIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-bold text-slate-900">Pindahkan Kode Isian ke Bagian Lain</h3>
            <p className="text-xs text-slate-500">
              Pilih tab bagian tujuan untuk memindahkan kode isian{' '}
              <code className="font-bold text-blue-700">
                {editingItem.kodeIsian?.[moveKodeIndex]?.kode}
              </code>
              :
            </p>
            <select
              value={moveTargetCategory}
              onChange={(e) => setMoveTargetCategory(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
            >
              {sectionKeys.map((k) => (
                <option key={k} value={k}>
                  {k === 'individu' ? 'Utama (Individu)' : formIsianObj[k]?.judul || k}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setMoveKodeIndex(null)}>
                Batal
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const row = editingItem.kodeIsian?.[moveKodeIndex];
                  if (row) {
                    const prefix =
                      moveTargetCategory === 'individu'
                        ? 'individu'
                        : formIsianObj[moveTargetCategory]?.prefix || moveTargetCategory;
                    handleUpdateKodeIsianRow(moveKodeIndex, {
                      kategori: moveTargetCategory,
                      kode: buildFormKodeTag(row.nama, prefix),
                    });
                  }
                  setMoveKodeIndex(null);
                }}
                className="bg-blue-600 text-white font-bold"
              >
                Pindahkan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Kaitkan Kode Isian */}
      {linkKodeIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              Kaitkan Kode Isian ({editingItem.kodeIsian?.[linkKodeIndex]?.kode})
            </h3>
            <p className="text-xs text-slate-500">
              Aturan JSON kondisi tampilan field (opsional, kompatibel dengan <code>kaitkan_kode</code> OpenSID):
            </p>
            <Textarea
              value={
                typeof editingItem.kodeIsian?.[linkKodeIndex]?.kaitkan_kode === 'string'
                  ? (editingItem.kodeIsian?.[linkKodeIndex]?.kaitkan_kode as string)
                  : JSON.stringify(editingItem.kodeIsian?.[linkKodeIndex]?.kaitkan_kode || '', null, 2)
              }
              onChange={(e) =>
                handleUpdateKodeIsianRow(linkKodeIndex, { kaitkan_kode: e.target.value })
              }
              placeholder='[{"nilai_isian":["Kawin"],"kode_isian_terkait":["[form_nama_pasangan]"],"tampilkan":1}]'
              className="font-mono text-xs"
              rows={4}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" onClick={() => setLinkKodeIndex(null)} className="font-bold">
                Selesai
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Katalog Kode Isian OpenSID */}
      {kodeIsianModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Katalog Kode Isian Surat OpenSID
                </h3>
                <p className="text-xs text-slate-500">
                  Klik tombol <strong>Sisipkan</strong> untuk menyematkan variabel ke naskah template.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setKodeIsianModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Search & Case */}
            <div className="flex flex-col gap-2.5 border-b border-slate-200 bg-white px-5 py-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <Input
                  value={kodeIsianSearch}
                  onChange={(e) => setKodeIsianSearch(e.target.value)}
                  placeholder="Cari nama atau tag kode isian..."
                  className="h-9 bg-slate-50 pl-9 text-xs"
                />
              </div>
              <div className="flex items-center gap-1 text-xs shrink-0 overflow-x-auto no-scrollbar">
                <span className="font-semibold text-slate-600 mr-1">Huruf:</span>
                {(
                  [
                    { id: 'normal', label: '[Nama]' },
                    { id: 'upper', label: '[NAma]' },
                    { id: 'ucwords', label: '[NaMa]' },
                    { id: 'lower', label: '[nama]' },
                  ] as const
                ).map((cm) => (
                  <button
                    key={cm.id}
                    type="button"
                    onClick={() => setKodeIsianCaseMode(cm.id)}
                    className={cn(
                      'rounded px-2 py-1 text-[11px] font-semibold transition',
                      kodeIsianCaseMode === cm.id
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    {cm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Isi Katalog */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {dynamicKodeCatalogForCurrentItem.map((group) => {
                const filtered = group.items.filter(
                  (it) =>
                    !kodeIsianSearch.trim() ||
                    it.kode.toLowerCase().includes(kodeIsianSearch.toLowerCase()) ||
                    it.judul.toLowerCase().includes(kodeIsianSearch.toLowerCase()) ||
                    it.keterangan.toLowerCase().includes(kodeIsianSearch.toLowerCase()),
                );
                if (filtered.length === 0) return null;
                return (
                  <div key={group.kategori} className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                      {group.kategori}
                    </h4>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <tbody className="divide-y divide-slate-100">
                          {filtered.map((item) => (
                            <tr key={item.kode} className="hover:bg-slate-50">
                              <td className="w-44 px-3 py-2 font-mono font-bold text-blue-700">
                                {item.kode}
                              </td>
                              <td className="px-3 py-2">
                                <span className="font-semibold text-slate-800">{item.judul}</span>
                                <span className="block text-[11px] font-normal text-slate-500">
                                  {item.keterangan}
                                </span>
                              </td>
                              <td className="w-24 px-3 py-2 text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleInsertKodeIsianTag(item.kode)}
                                  className="h-7 bg-blue-600 px-2.5 text-xs text-white hover:bg-blue-700 font-bold"
                                >
                                  Sisipkan
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

