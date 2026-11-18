'use client';

import { OpenSidMasterFormEditor } from './_components/opensid-master-form-editor';
import { OpenSidGlobalQrModal } from './_components/opensid-global-qr-modal';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Star,
  Lock,
  Unlock,
  Eye,
  Copy,
  Settings,
  Download,
  Upload,
  CheckCircle2,
  ArrowLeft,
  Save,
  Check,
  Code2,
  FileCode,
  Sparkles,
  Layers,
  Sliders,
  Info,
  ArrowRightLeft,
  Link2,
  Printer,
  RefreshCw,
  Send,
  ChevronUp,
  ChevronDown,
  X,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useCollection,
  useDoc,
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import type { KopSuratInfo, VillageLogoInfo } from '@/lib/types';
import {
  MASTER_LAMPIRAN_SURAT,
  renderLampiranPagesForLetter,
} from '@/lib/lampiran-surat-data';
import {
  SEED_PERMOHONAN_SURAT,
  DOKUMEN_SYARAT_STANDAR,
  type PermohonanSuratItem,
} from '@/lib/permohonan-surat-data';
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
  OPENSID_GLOBAL_SETTINGS_DEFAULT,
  OPENSID_MARGIN_DEFAULT,
  OPENSID_FORMAT_NOMOR_DEFAULT,
  enrichPermohonanSuratWithOpenSid,
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
  DEFAULT_QR_SIGNATURE_SETTINGS,
  resolveEffectiveQrSettings,
  getCachedGlobalQrSettings,
  setCachedGlobalQrSettings,
  buildQrVerificationPayload,
  generateQrCodeDataUri,
  getCachedVillageLogoUrl,
  setCachedVillageLogoUrl,
  type OpenSidQrSignatureSettings,
  type QrLogoMode,
  type QrContentMode,
  type QrSignMode,
} from '@/lib/opensid-qr-signature';
import { useVillageIdentity } from '@/lib/village-identity';

const COLLECTION_NAME = 'pengaturan_permohonan_surat';
const GLOBAL_SETTINGS_STORAGE_KEY = 'opensid_global_surat_settings_v1';

export default function PengaturanSuratOpenSidPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { identity } = useVillageIdentity();

  const suratRef = useMemoFirebase(
    () => (firestore ? collection(firestore, COLLECTION_NAME) : null),
    [firestore],
  );
  const { data: dbItems, isLoading } = useCollection<PermohonanSuratItem>(suratRef);

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

  useEffect(() => {
    if (villageLogoUrl) {
      setCachedVillageLogoUrl(villageLogoUrl);
    }
  }, [villageLogoUrl]);

  // Global Settings (Header, Footer, Margin Global, Format Nomor Global)
  const [globalSettings, setGlobalSettings] = useState<OpenSidGlobalSuratSettings>(
    OPENSID_GLOBAL_SETTINGS_DEFAULT,
  );
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);

  // Global QR Signature Settings Modal
  const [isQrGlobalModalOpen, setIsQrGlobalModalOpen] = useState(false);
  const [globalQrSettings, setGlobalQrSettings] = useState<OpenSidQrSignatureSettings>(() => {
    return getCachedGlobalQrSettings();
  });
  const [isApplyingQrToAll, setIsApplyingQrToAll] = useState(false);

  useEffect(() => {
    setGlobalQrSettings(getCachedGlobalQrSettings());
  }, []);

  const saveGlobalQrSettings = (next: OpenSidQrSignatureSettings) => {
    setGlobalQrSettings(next);
    setCachedGlobalQrSettings(next);
    toast({
      title: 'Pengaturan QR Berhasil Disimpan',
      description: 'Pengaturan penandatanganan QR global dan logo desa telah diperbarui.',
    });
  };

  const effectiveGlobalSettings = useMemo<OpenSidGlobalSuratSettings>(
    () => ({
      ...globalSettings,
      letterheadImageUrl: kopInfo?.letterheadImageUrl || globalSettings.letterheadImageUrl,
    }),
    [globalSettings, kopInfo?.letterheadImageUrl],
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GLOBAL_SETTINGS_STORAGE_KEY);
      if (saved) {
        setGlobalSettings({ ...OPENSID_GLOBAL_SETTINGS_DEFAULT, ...JSON.parse(saved) });
      }
    } catch {
      // ignore
    }
  }, []);

  const saveGlobalSettings = (next: OpenSidGlobalSuratSettings) => {
    setGlobalSettings(next);
    try {
      localStorage.setItem(GLOBAL_SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    setIsGlobalModalOpen(false);
    toast({
      title: 'Pengaturan Global Disimpan',
      description: 'Header, Footer, Margin Global, dan Penomoran Surat berhasil diperbarui.',
    });
  };

  // Auto-seed / sync jika koleksi Firestore masih kosong atau ada template baru yang belum tersimpan
  const [hasSeeded, setHasSeeded] = useState(false);
  useEffect(() => {
    if (!isLoading && firestore && dbItems && !hasSeeded) {
      const dbIds = new Set(dbItems.map((d) => d.id));
      const missingItems = SEED_PERMOHONAN_SURAT.filter((s) => !dbIds.has(s.id));

      if (missingItems.length > 0) {
        setHasSeeded(true);
        const batch = writeBatch(firestore);
        missingItems.forEach((item) => {
          const enriched = enrichPermohonanSuratWithOpenSid(item);
          const ref = doc(firestore, COLLECTION_NAME, enriched.id);
          batch.set(
            ref,
            {
              ...enriched,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          );
        });
        batch.commit().catch((err) => console.error('Gagal sync template surat baru:', err));
      }
    }
  }, [isLoading, firestore, dbItems, hasSeeded]);

  // Enrich setiap item dengan skema OpenSID (template, form_isian, kode_isian)
  // Menjamin SELURUH 44+ format surat baku OpenSID SELALU muncul dan terintegrasi
  const items: PermohonanSuratItem[] = useMemo(() => {
    const map = new Map<string, PermohonanSuratItem>();

    // 1. Masukkan seluruh 44 master surat standar bawaan sistem sebagai basis data
    SEED_PERMOHONAN_SURAT.forEach((seed) => {
      map.set(seed.id, seed);
    });

    // 2. Gabungkan data kustom / modifikasi dari Firestore jika ada
    if (dbItems && dbItems.length > 0) {
      dbItems.forEach((dbItem) => {
        let key = dbItem.id;
        if (!map.has(key)) {
          // Coba cocokkan berdasarkan urlSurat atau jenisSurat jika ID berbeda
          for (const [seedId, seedItem] of map.entries()) {
            if (
              (dbItem.urlSurat && seedItem.urlSurat === dbItem.urlSurat) ||
              seedItem.jenisSurat.trim().toLowerCase() === (dbItem.jenisSurat || '').trim().toLowerCase()
            ) {
              key = seedId;
              break;
            }
          }
        }

        const existing = map.get(key);
        if (existing) {
          map.set(key, { ...existing, ...dbItem, id: key });
        } else {
          // Format surat kustom baru buatan admin desa
          map.set(dbItem.id || `custom-${Math.random()}`, dbItem);
        }
      });
    }

    const source = Array.from(map.values());

    return source
      .map((item) => enrichPermohonanSuratWithOpenSid(item))
      .sort((a, b) => {
        if (Boolean(b.favorit) !== Boolean(a.favorit)) return b.favorit ? 1 : -1;
        return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
      });
  }, [dbItems]);

  // State Mode Tampilan: 'list' vs 'form' (4 Tab OpenSID: Umum, Template, Form Isian, Penandatanganan QR)
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [activeMainTab, setActiveMainTab] = useState<'umum' | 'template' | 'form_isian' | 'qr_tte'>('umum');

  // Filter Daftar Surat
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'locked'>('all');
  const [filterJenis, setFilterJenis] = useState<'all' | 'sistem' | 'desa'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // State Form Edit / Tambah Surat
  const [editingItem, setEditingItem] = useState<PermohonanSuratItem | null>(null);
  const [activeFormSectionTab, setActiveFormSectionTab] = useState<string>('individu');
  const [templateEditorMode, setTemplateEditorMode] = useState<'visual' | 'html' | 'split'>('split');
  const [newSectionModalOpen, setNewSectionModalOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSyaratText, setNewSyaratText] = useState('');

  // Modal Kode Isian Picker (di Tab Template)
  const [kodeIsianModalOpen, setKodeIsianModalOpen] = useState(false);
  const [kodeIsianSearch, setKodeIsianSearch] = useState('');
  const [kodeIsianCaseMode, setKodeIsianCaseMode] = useState<'normal' | 'upper' | 'ucwords' | 'lower'>('normal');

  // Modal Pindah & Kaitkan Kode Isian (di Tab Form Isian)
  const [moveKodeIndex, setMoveKodeIndex] = useState<number | null>(null);
  const [moveTargetCategory, setMoveTargetCategory] = useState<string>('individu');
  const [linkKodeIndex, setLinkKodeIndex] = useState<number | null>(null);

  // Modal Tinjau PDF
  const [previewItem, setPreviewItem] = useState<PermohonanSuratItem | null>(null);

  const visualEditorRef = useRef<HTMLDivElement | null>(null);
  const htmlTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Filter items di tabel utama
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.jenisSurat.toLowerCase().includes(q) ||
        item.kodeSurat.toLowerCase().includes(q) ||
        (item.urlSurat || '').toLowerCase().includes(q) ||
        (item.klasifikasi || '').toLowerCase().includes(q);

      const isActive = item.isActive !== false;
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && isActive) ||
        (filterStatus === 'locked' && !isActive);

      const isSistem = item.jenis === 1 || item.jenis === 3 || !item.jenis;
      const matchJenis =
        filterJenis === 'all' ||
        (filterJenis === 'sistem' && isSistem) ||
        (filterJenis === 'desa' && !isSistem);

      return matchSearch && matchStatus && matchJenis;
    });
  }, [items, searchQuery, filterStatus, filterJenis]);

  // Daftar Syarat Dokumen gabungan
  const allSyaratOptions = useMemo(() => {
    const set = new Set<string>(DOKUMEN_SYARAT_STANDAR);
    if (editingItem?.syaratSurat) {
      editingItem.syaratSurat.forEach((s) => set.add(s));
    }
    return Array.from(set);
  }, [editingItem?.syaratSurat]);

  // Buka Form Tambah Surat Baru
  const handleStartAdd = () => {
    const nextNum = items.length + 1;
    const newId = `prm-${String(nextNum).padStart(2, '0')}-${Date.now().toString().slice(-3)}`;
    const newItem: PermohonanSuratItem = enrichPermohonanSuratWithOpenSid({
      id: newId,
      jenisSurat: 'Surat Keterangan Baru',
      urlSurat: `surat-desa-${Date.now()}`,
      klasifikasi: 'PEMERINTAHAN & UMUM',
      kodeSurat: '470',
      uraian: 'Format layanan surat khusus desa dengan editor TinyMCE OpenSID.',
      isActive: true,
      favorit: false,
      mandiri: true,
      jenis: 4, // 4 = Surat Desa (TinyMCE)
      kategori: 'Umum',
      pemohonSurat: 'warga',
      masaBerlaku: '1 Bulan',
      masaBerlakuValue: 1,
      satuanMasaBerlaku: 'M',
      orientasi: 'Potrait',
      ukuran: 'F4',
      marginGlobal: true,
      margin: { ...OPENSID_MARGIN_DEFAULT },
      formatNomorGlobal: true,
      formatNomor: '',
      header: 1,
      footer: true,
      logoGaruda: false,
      qrCode: true,
      qrCodeTte: false,
      kecamatan: false,
      sumberPendudukBerulang: false,
      syaratSurat: ['KTP-el Pemohon / Pelapor', 'Kartu Keluarga (KK)', 'Surat Pengantar RT / RW'],
      lampiran: [],
      template: getFallbackTemplateHtml('Surat Keterangan Baru'),
      templateDesa: '',
      formIsian: {
        individu: normalizeFormSectionConfig('individu', {
          judul: 'Utama',
          label: 'Identitas Pemohon',
          sumber: 1,
          sumber_wajib: 1,
          data: ['1'],
          status_dasar: ['1'],
        }),
      },
      kodeIsian: [
        {
          kategori: 'individu',
          tipe: 'textarea',
          kode: '[form_keperluan]',
          nama: 'Keperluan',
          label: 'Keperluan',
          deskripsi: 'Masukkan keperluan pembuatan surat',
          atribut: '',
          pilihan: [],
          refrensi: '',
          kolom: 12,
          required: '1',
        },
      ],
    });
    setEditingItem(newItem);
    setActiveMainTab('umum');
    setActiveFormSectionTab('individu');
    setViewMode('form');
  };

  // Buka Form Edit Surat (Menampilkan 4 Tab: Umum, Template, Form Isian, Penandatanganan QR)
  const handleStartEdit = (
    item: PermohonanSuratItem,
    initialTab: 'umum' | 'template' | 'form_isian' | 'qr_tte' = 'umum',
  ) => {
    const enriched = enrichPermohonanSuratWithOpenSid(item);
    // Deep clone agar perubahan state aman
    const cloned: PermohonanSuratItem = JSON.parse(JSON.stringify(enriched));
    if (!cloned.templateDesa || !cloned.templateDesa.trim()) {
      cloned.templateDesa = cloned.template || getFallbackTemplateHtml(cloned.jenisSurat);
    }
    setEditingItem(cloned);
    setActiveMainTab(initialTab);
    setActiveFormSectionTab('individu');
    setViewMode('form');
  };

  // Salin Surat Sistem menjadi Surat Desa
  const handleDuplicateSurat = (item: PermohonanSuratItem) => {
    const enriched = enrichPermohonanSuratWithOpenSid(item);
    const copyId = `prm-copy-${Date.now().toString().slice(-5)}`;
    const duplicated: PermohonanSuratItem = {
      ...JSON.parse(JSON.stringify(enriched)),
      id: copyId,
      jenisSurat: `${enriched.jenisSurat} (Salinan Desa)`,
      urlSurat: `${enriched.urlSurat || 'surat'}-desa-${Date.now().toString().slice(-4)}`,
      jenis: 4,
      favorit: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (firestore) {
      setDocumentNonBlocking(doc(firestore, COLLECTION_NAME, copyId), duplicated, { merge: true });
    }
    toast({
      title: 'Surat Berhasil Disalin',
      description: `"${duplicated.jenisSurat}" telah ditambahkan sebagai Surat Desa dan siap dikustomisasi.`,
    });
  };

  // Simpan Surat (Simpan Sementara vs Simpan dan Keluar)
  const handleSaveEditingItem = (closeAfterSave: boolean) => {
    if (!editingItem) return;
    if (!editingItem.jenisSurat.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nama Layanan Wajib Diisi',
        description: 'Mohon isi Nama Layanan Surat pada tab Umum.',
      });
      setActiveMainTab('umum');
      return;
    }

    const normalizedName = editingItem.jenisSurat.trim().replace(/^Surat\s+/i, '');
    const finalJenisSurat = `Surat ${normalizedName}`;

    const satuanMap: Record<string, string> = {
      d: 'Hari',
      D: 'Hari',
      w: 'Minggu',
      W: 'Minggu',
      M: 'Bulan',
      y: 'Tahun',
      Y: 'Tahun',
    };
    const masaVal = editingItem.masaBerlakuValue ?? 1;
    const masaLabel =
      masaVal > 0
        ? `${masaVal} ${satuanMap[editingItem.satuanMasaBerlaku || 'M'] || 'Bulan'}`
        : 'Tidak Berlaku';

    const payload: PermohonanSuratItem = {
      ...editingItem,
      jenisSurat: finalJenisSurat,
      masaBerlaku: masaLabel,
      updatedAt: new Date().toISOString(),
      createdAt: editingItem.createdAt || new Date().toISOString(),
    };

    if (firestore) {
      setDocumentNonBlocking(doc(firestore, COLLECTION_NAME, payload.id), payload, { merge: true });
    }

    setEditingItem(payload);
    toast({
      title: closeAfterSave ? 'Perubahan Disimpan' : 'Disimpan Sementara',
      description: `Konfigurasi "${finalJenisSurat}" (Umum, Template & Form Isian) berhasil disimpan.`,
    });

    if (closeAfterSave) {
      setViewMode('list');
      setEditingItem(null);
    }
  };

  // Toggle Favorit / Kunci di Tabel
  const handleToggleFavorit = (item: PermohonanSuratItem) => {
    if (!firestore) return;
    const next = !item.favorit;
    setDocumentNonBlocking(
      doc(firestore, COLLECTION_NAME, item.id),
      { favorit: next, updatedAt: new Date().toISOString() },
      { merge: true },
    );
    toast({
      title: next ? 'Ditambahkan ke Favorit' : 'Dihapus dari Favorit',
      description: item.jenisSurat,
    });
  };

  const handleToggleActive = (item: PermohonanSuratItem) => {
    if (!firestore) return;
    const next = item.isActive === false;
    setDocumentNonBlocking(
      doc(firestore, COLLECTION_NAME, item.id),
      {
        ...item,
        isActive: next,
        mandiri: next,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    toast({
      title: next ? 'ON: Ditampilkan di /layanan-surat' : 'OFF: Disembunyikan dari /layanan-surat',
      description: next
        ? `"${item.jenisSurat}" kini aktif (ON) dan dapat diajukan di halaman /layanan-surat.`
        : `"${item.jenisSurat}" kini nonaktif (OFF) dan tidak ditampilkan di halaman /layanan-surat.`,
    });
  };

  const handleDeleteSurat = (item: PermohonanSuratItem) => {
    if (!firestore) return;
    if (!window.confirm(`Hapus layanan "${item.jenisSurat}" dari daftar surat?`)) return;
    deleteDocumentNonBlocking(doc(firestore, COLLECTION_NAME, item.id));
    toast({
      title: 'Surat Dihapus',
      description: `"${item.jenisSurat}" telah dihapus.`,
    });
  };

  const handleBulkDelete = () => {
    if (!firestore || selectedIds.length === 0) return;
    if (!window.confirm(`Hapus ${selectedIds.length} layanan surat terpilih?`)) return;
    selectedIds.forEach((id) => {
      deleteDocumentNonBlocking(doc(firestore, COLLECTION_NAME, id));
    });
    setSelectedIds([]);
    toast({
      title: 'Hapus Massal Berhasil',
      description: `${selectedIds.length} layanan surat telah dihapus.`,
    });
  };

  // Sinkronisasi seluruh 43 surat dengan skema OpenSID ke Firestore
  const handleSyncAllOpenSidSchema = async () => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    items.forEach((item) => {
      const enriched = enrichPermohonanSuratWithOpenSid(item);
      batch.set(
        doc(firestore, COLLECTION_NAME, enriched.id),
        {
          ...enriched,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    });
    await batch.commit();
    toast({
      title: 'Skema OpenSID Disinkronkan',
      description: `Seluruh ${items.length} layanan surat kini memiliki Template HTML, Form Isian multi-bagian, dan Kode Isian standar OpenSID.`,
    });
  };

  // Export JSON OpenSID
  const handleExportJson = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-surat-Layanan Surat Digital Desa Sampeldes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper manipulasi Pengaturan Penandatanganan QR (Tab 4)
  const updateQrSettings = (patch: Partial<OpenSidQrSignatureSettings>) => {
    if (!editingItem) return;
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

  const handleApplyQrSettingsToAllSurat = async () => {
    if (!editingItem) return;
    const currentQr = resolveEffectiveQrSettings(
      editingItem.qrSettings,
      editingItem.qrCode,
      editingItem.qrCodeTte,
    );
    setCachedGlobalQrSettings(currentQr);
    if (firestore) {
      const batch = writeBatch(firestore);
      items.forEach((it) => {
        batch.set(
          doc(firestore, COLLECTION_NAME, it.id),
          {
            qrCode: currentQr.enabled,
            qrCodeTte: currentQr.tteEnabled,
            qrSettings: currentQr,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      });
      await batch.commit();
    }
    toast({
      title: 'Aturan Penandatanganan QR Diterapkan ke Semua Surat',
      description: `Pengaturan QR Code & TTE telah diseragamkan pada seluruh ${items.length} jenis layanan surat.`,
    });
  };

  const handleApplyGlobalQrToAllSurat = async () => {
    if (!firestore || !items || items.length === 0) return;
    setIsApplyingQrToAll(true);
    try {
      const batch = writeBatch(firestore);
      items.forEach((it) => {
        batch.set(
          doc(firestore, COLLECTION_NAME, it.id),
          {
            qrCode: globalQrSettings.enabled,
            qrCodeTte: globalQrSettings.tteEnabled,
            qrSettings: globalQrSettings,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      });
      await batch.commit();
      setCachedGlobalQrSettings(globalQrSettings);
      toast({
        title: 'Pengaturan QR Berhasil Diterapkan ke Semua Surat',
        description: `Pengaturan QR Code & Logo Desa telah diseragamkan pada seluruh (${items.length}) layanan surat master.`,
      });
      setIsQrGlobalModalOpen(false);
    } catch (err) {
      console.error('Gagal menerapkan pengaturan QR ke seluruh surat:', err);
      toast({
        title: 'Gagal Menerapkan Pengaturan QR',
        description: 'Terjadi kesalahan saat memperbarui database surat.',
        variant: 'destructive',
      });
    } finally {
      setIsApplyingQrToAll(false);
    }
  };

  // Helper manipulasi Form Isian (Tab 3)
  const updateFormSection = (sectionKey: string, patch: Partial<OpenSidFormSectionConfig>) => {
    if (!editingItem) return;
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

  const handleAddFormSection = () => {
    if (!editingItem || !newSectionTitle.trim()) return;
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
    if (!editingItem || sectionKey === 'individu') return;
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

  // Helper manipulasi Kode Isian (Tab 3)
  const handleAddKodeIsianRow = (kategoriKey: string) => {
    if (!editingItem) return;
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
    if (!editingItem) return;
    const nextList = [...(editingItem.kodeIsian || [])];
    const current = nextList[globalIdx];
    if (!current) return;
    const updated: OpenSidKodeIsian = {
      ...current,
      ...patch,
    };
    // Jika nama berubah, otomatis sesuaikan kode [form_...]
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
    if (!editingItem) return;
    const nextList = (editingItem.kodeIsian || []).filter((_, i) => i !== globalIdx);
    setEditingItem({
      ...editingItem,
      kodeIsian: nextList,
    });
  };

  const handleMoveKodeIsianRowOrder = (globalIdx: number, direction: 'up' | 'down') => {
    if (!editingItem) return;
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

  // Sisipkan tag [Kode_Isian] ke dalam Template HTML
  const handleInsertKodeIsianTag = (rawKode: string) => {
    if (!editingItem) return;
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

  // Katalog Kode Isian Dinamis untuk surat yang sedang diedit (Mengikuti Tab Form Isian)
  const dynamicKodeCatalogForCurrentItem = useMemo(() => {
    if (!editingItem) return OPENSID_KODE_ISIAN_STANDAR;
    const groups = [...OPENSID_KODE_ISIAN_STANDAR];

    // 1. Kode Isian Form Dinamis ([form_...])
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

    // 2. Kode Isian Pelaku Bagian Tambahan (mis. _ayah, _ibu, _saksi_i, _pembeli, dll.)
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

  // ============================================================================
  // RENDER MODE FORM (4 TAB OPENSID: UMUM, TEMPLATE, FORM ISIAN, PENANDATANGANAN QR)
  // ============================================================================
  if (viewMode === 'form' && editingItem) {
    return (
      <>
        <OpenSidMasterFormEditor
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          effectiveGlobalSettings={effectiveGlobalSettings}
          identity={identity}
          villageLogoUrl={villageLogoUrl}
          allSyaratOptions={allSyaratOptions}
          initialTab={activeMainTab}
          onBack={() => {
            setViewMode('list');
            setEditingItem(null);
          }}
          onSave={handleSaveEditingItem}
          onPreview={(it) => setPreviewItem(it)}
          onApplyQrToAll={handleApplyQrSettingsToAllSurat}
        />

        {/* Modal Tinjau PDF */}
        {previewItem && (
          <PreviewPdfOpenSidModal
            item={previewItem}
            globalSettings={globalSettings}
            onClose={() => setPreviewItem(null)}
          />
        )}
      </>
    );
  }

  // ============================================================================
  // RENDER MODE LIST (/admin/surat/master — Daftar Layanan Surat OpenSID)
  // ============================================================================
  return (
    <div className="space-y-5">
      {/* Header & Tombol Aksi Utama (/surat_master) */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Pengaturan Daftar Layanan Surat (Master Surat OpenSID)
            </h1>
            <Badge className="bg-blue-600 text-white">{items.length} Format Surat</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Kelola pengaturan <strong>Umum</strong>, <strong>Template TinyMCE</strong>, dan{' '}
            <strong>Form Isian Dinamis</strong> untuk seluruh layanan surat desa sesuai skema OpenSID.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleStartAdd}
            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Surat
          </Button>

          {selectedIds.length > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Hapus ({selectedIds.length})
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsGlobalModalOpen(true)}
            className="gap-1.5 border-slate-300 text-slate-700"
          >
            <Settings className="h-4 w-4" />
            Pengaturan Kop & Global
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setGlobalQrSettings(getCachedGlobalQrSettings());
              setIsQrGlobalModalOpen(true);
            }}
            className="gap-1.5 border-emerald-300 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900"
          >
            <QrCode className="h-4 w-4 text-emerald-600" />
            Pengaturan Penandatanganan QR
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSyncAllOpenSidSchema}
            className="gap-1.5 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            <RefreshCw className="h-4 w-4" />
            Sinkronkan Template OpenSID ({items.length})
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            className="gap-1.5 border-slate-300 text-slate-700"
          >
            <Download className="h-4 w-4" />
            Ekspor JSON
          </Button>
        </div>
      </div>

      {/* Baris Filter & Pencarian */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-12">
        <div className="relative md:col-span-6">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama surat, kode klasifikasi (470, 500, S-01), atau url_surat..."
            className="pl-9 text-sm"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'locked')}
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700"
          >
            <option value="all">
              Semua Status: ON & OFF ({items.filter((i) => i.isActive !== false).length} ON / {items.filter((i) => i.isActive === false).length} OFF)
            </option>
            <option value="active">
              Status ON: Tampil di /layanan-surat ({items.filter((i) => i.isActive !== false).length})
            </option>
            <option value="locked">
              Status OFF: Disembunyikan ({items.filter((i) => i.isActive === false).length})
            </option>
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value as 'all' | 'sistem' | 'desa')}
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700"
          >
            <option value="all">Semua Jenis Surat ({items.length})</option>
            <option value="sistem">Surat Bawaan Sistem (OpenSID)</option>
            <option value="desa">Surat Khusus Desa</option>
          </select>
        </div>
      </div>

      {/* Tabel Daftar Surat OpenSID */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold uppercase text-slate-700">
              <tr>
                <th className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredItems.length > 0 && selectedIds.length === filteredItems.length
                    }
                    onChange={(e) =>
                      setSelectedIds(
                        e.target.checked ? filteredItems.map((it) => it.id) : [],
                      )
                    }
                    className="h-3.5 w-3.5 accent-blue-600"
                  />
                </th>
                <th className="w-12 px-2 py-3 text-center">NO</th>
                <th className="w-64 px-3 py-3">AKSI</th>
                <th className="px-3 py-3">NAMA LAYANAN SURAT</th>
                <th className="w-36 px-3 py-3">KODE / KLASIFIKASI</th>
                <th className="w-40 px-3 py-3">BAGIAN & KODE ISIAN</th>
                <th className="w-56 px-3 py-3 text-center">LAMPIRAN</th>
                <th className="w-36 px-3 py-3 text-center">TAMPIL /LAYANAN-SURAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.map((item, index) => {
                const isLocked = item.isActive === false;
                const isSistem = item.jenis === 1 || item.jenis === 3 || !item.jenis;
                const bagianCount = Object.keys(item.formIsian || { individu: {} }).length;
                const kodeCount = (item.kodeIsian || []).length;

                return (
                  <tr
                    key={item.id}
                    className={`transition hover:bg-slate-50/90 ${isLocked ? 'bg-slate-50/50 opacity-65' : ''
                      }`}
                  >
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => {
                          setSelectedIds((prev) =>
                            e.target.checked
                              ? [...prev, item.id]
                              : prev.filter((id) => id !== item.id),
                          );
                        }}
                        className="h-3.5 w-3.5 accent-blue-600"
                      />
                    </td>

                    <td className="px-2 py-3 text-center font-semibold text-slate-500">
                      {index + 1}
                    </td>

                    {/* AKSI */}
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {/* Edit (Membuka 4 Tab: Umum, Template, Form Isian, Penandatanganan QR) */}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleStartEdit(item, 'umum')}
                          className="h-7 gap-1 bg-amber-500 px-2.5 text-[11px] font-semibold text-white hover:bg-amber-600"
                          title="Ubah Pengaturan Umum, Template, Form Isian & Penandatanganan QR"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>

                        {/* Pengaturan Cepat Penandatanganan QR */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item, 'qr_tte')}
                          className={`rounded border p-1.5 ${item.qrCode !== false
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-100'
                            }`}
                          title="Pengaturan Penandatanganan QR Surat Ini"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </button>

                        {/* Buat Surat Langsung */}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/admin/surat/input?surat=${encodeURIComponent(
                                item.urlSurat || item.id,
                              )}`,
                            )
                          }
                          className="h-7 gap-1 bg-blue-600 px-2.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                          title="Buat / Cetak Surat Ini"
                        >
                          <Send className="h-3 w-3" />
                          Buat
                        </Button>

                        {/* Tinjau PDF */}
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="rounded border border-indigo-200 bg-indigo-50 p-1.5 text-indigo-700 hover:bg-indigo-100"
                          title="Tinjau PDF Hasil Cetak"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Salin Surat */}
                        <button
                          type="button"
                          onClick={() => handleDuplicateSurat(item)}
                          className="rounded border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100"
                          title="Salin Menjadi Surat Khusus Desa"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>

                        {/* Switch Cepat ON / OFF di kolom Aksi */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold transition ${!isLocked
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              : 'border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          title={
                            !isLocked
                              ? 'Status ON (Tampil di /layanan-surat) — Klik untuk OFF'
                              : 'Status OFF (Disembunyikan dari /layanan-surat) — Klik untuk ON'
                          }
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${!isLocked ? 'bg-emerald-600' : 'bg-slate-400'
                              }`}
                          />
                          {!isLocked ? 'ON' : 'OFF'}
                        </button>

                        {/* Favorit */}
                        <button
                          type="button"
                          onClick={() => handleToggleFavorit(item)}
                          className={`rounded border p-1.5 ${item.favorit
                              ? 'border-yellow-300 bg-yellow-50 text-yellow-600'
                              : 'border-slate-200 bg-white text-slate-400 hover:text-yellow-500'
                            }`}
                          title="Tandai Favorit"
                        >
                          <Star className={`h-3.5 w-3.5 ${item.favorit ? 'fill-yellow-400' : ''}`} />
                        </button>

                        {/* Hapus */}
                        {!isSistem && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSurat(item)}
                            className="rounded border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                            title="Hapus Surat Desa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* NAMA SURAT */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.jenisSurat}</span>
                        <Badge
                          variant="outline"
                          className={
                            isSistem
                              ? 'border-blue-200 bg-blue-50 text-[10px] text-blue-700'
                              : 'border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700'
                          }
                        >
                          {isSistem ? 'Sistem' : 'Desa'}
                        </Badge>
                        {item.templateDesa && item.templateDesa.trim() && (
                          <Badge className="bg-purple-100 text-[10px] text-purple-800">
                            Template Kustom
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-mono">{item.urlSurat}</span>
                        <span>•</span>
                        <span>
                          Kertas: {item.ukuran || 'F4'} ({item.orientasi || 'Potrait'})
                        </span>
                        <span>•</span>
                        <span>Berlaku: {item.masaBerlaku || '1 Bulan'}</span>
                      </div>
                    </td>

                    {/* KODE SURAT */}
                    <td className="px-3 py-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold text-slate-800">
                        {item.kodeSurat}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-500">
                        {item.kategori || 'Umum'}
                      </span>
                    </td>

                    {/* BAGIAN & KODE ISIAN */}
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item, 'form_isian')}
                          className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          {bagianCount} Bagian • {kodeCount} Field
                        </button>
                      </div>
                      <span className="mt-1 block text-[10px] text-slate-500">
                        {Object.keys(item.formIsian || { individu: {} }).join(', ')}
                      </span>
                    </td>

                    {/* LAMPIRAN */}
                    <td className="px-3 py-3 text-center">
                      {(item.lampiran || []).length > 0 ? (
                        <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[220px] mx-auto">
                          {(item.lampiran || []).map((l, lIdx) => {
                            // Format kode singkat/label bersih untuk kartu kecil
                            const cleanText = l.trim();
                            // Ambil kode awal jika ada tanda kurung atau titik dua (misal: "Model N-1", "F-1.03", "SPORADIK")
                            const shortCode = cleanText.includes(':') 
                              ? cleanText.split(':')[0].trim() 
                              : cleanText.includes('(') && cleanText.includes(')')
                              ? cleanText.match(/\(([^)]+)\)/)?.[1]?.trim() || cleanText
                              : cleanText;
                            
                            return (
                              <div
                                key={lIdx}
                                className="group relative inline-flex items-center gap-1 rounded-md border border-sky-200 bg-gradient-to-b from-sky-50 to-sky-100/70 px-2 py-1 text-[10px] font-semibold text-sky-800 shadow-2xs hover:border-sky-300 hover:bg-sky-100 transition-all cursor-default"
                                title={cleanText}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                                <span className="truncate max-w-[170px] uppercase font-mono tracking-tight text-[10px]">
                                  {cleanText.length > 22 ? shortCode : cleanText}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">-</span>
                      )}
                    </td>

                    {/* TAMPIL DI /LAYANAN-SURAT (TOMBOL SWITCH ON / OFF) */}
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!isLocked}
                          onClick={() => handleToggleActive(item)}
                          className={`group relative inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${!isLocked
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-slate-300 hover:bg-slate-400'
                            }`}
                          title={
                            !isLocked
                              ? 'ON: Ditampilkan di /layanan-surat (Klik untuk sembunyikan)'
                              : 'OFF: Disembunyikan dari /layanan-surat (Klik untuk tampilkan)'
                          }
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${!isLocked ? 'translate-x-6' : 'translate-x-0'
                              }`}
                          />
                        </button>
                        <span
                          className={`text-[10px] font-bold tracking-wide uppercase ${!isLocked ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                        >
                          {!isLocked ? 'ON (Tampil)' : 'OFF (Sembunyi)'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pengaturan Kop & Global Surat */}
      {isGlobalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pengaturan Global Surat Desa (Header Kop, Footer, Margin & Penomoran)
                </h3>
                <p className="text-xs text-slate-500">
                  Berlaku untuk seluruh layanan surat yang mengaktifkan opsi Global.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGlobalModalOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                  Format Penomoran Surat Global
                </label>
                <Input
                  value={globalSettings.formatNomorGlobal}
                  onChange={(e) =>
                    setGlobalSettings({ ...globalSettings, formatNomorGlobal: e.target.value })
                  }
                  className="font-mono text-xs"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Standar Format: <code>[kode_surat]/[nomor_surat, 3]/[bulan_romawi]/[tahun]</code> (Contoh: <code>400.12.2.2/002/X/2026</code>).
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                  Margin Kertas Global (cm)
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {(['kiri', 'atas', 'kanan', 'bawah'] as const).map((side) => (
                    <div key={side}>
                      <span className="mb-1 block text-xs capitalize text-slate-600">{side}</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={globalSettings.marginGlobal[side]}
                        onChange={(e) =>
                          setGlobalSettings({
                            ...globalSettings,
                            marginGlobal: {
                              ...globalSettings.marginGlobal,
                              [side]: parseFloat(e.target.value || '0'),
                            },
                          })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                  Template Header / Kop Surat Global (HTML)
                </label>
                <Textarea
                  value={globalSettings.headerHtml}
                  onChange={(e) =>
                    setGlobalSettings({ ...globalSettings, headerHtml: e.target.value })
                  }
                  className="min-h-[150px] font-mono text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-700">
                  Template Footer Surat Standar (HTML)
                </label>
                <Textarea
                  value={globalSettings.footerHtml}
                  onChange={(e) =>
                    setGlobalSettings({ ...globalSettings, footerHtml: e.target.value })
                  }
                  className="min-h-[100px] font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <Button variant="outline" size="sm" onClick={() => setIsGlobalModalOpen(false)}>
                Batal
              </Button>
              <Button
                size="sm"
                onClick={() => saveGlobalSettings(globalSettings)}
                className="bg-blue-600 text-white"
              >
                Simpan Pengaturan Global
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Penandatanganan QR Global */}
      <OpenSidGlobalQrModal
        isOpen={isQrGlobalModalOpen}
        onClose={() => setIsQrGlobalModalOpen(false)}
        globalQrSettings={globalQrSettings}
        setGlobalQrSettings={setGlobalQrSettings}
        onSave={(saved) => {
          saveGlobalQrSettings(saved);
          setIsQrGlobalModalOpen(false);
        }}
        onApplyToAll={handleApplyGlobalQrToAllSurat}
        isApplyingToAll={isApplyingQrToAll}
        villageLogoUrl={villageLogoUrl}
        identity={identity}
        totalSurat={items.length}
      />

      {/* Modal Tinjau PDF dari Daftar */}
      {previewItem && (
        <PreviewPdfOpenSidModal
          item={previewItem}
          globalSettings={effectiveGlobalSettings}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// KOMPONEN MODAL TINJAU PDF (Pratinjau Cetak dengan Simulasi Data OpenSID)
// ============================================================================
function PreviewPdfOpenSidModal({
  item,
  globalSettings,
  onClose,
}: {
  item: PermohonanSuratItem;
  globalSettings: OpenSidGlobalSuratSettings;
  onClose: () => void;
}) {
  const [viewFilter, setViewFilter] = useState<'all' | 'pengantar' | 'lampiran'>('all');
  const ctx = useMemo(() => buildDummyPreviewContext(item), [item]);
  const rendered = useMemo(
    () =>
      renderOpenSidDocumentPages(
        item,
        ctx,
        globalSettings,
        item.templateDesa || item.template,
      ),
    [item, ctx, globalSettings],
  );

  const lampiranSheets = useMemo(
    () => renderLampiranPagesForLetter(item.lampiran, ctx, MASTER_LAMPIRAN_SURAT),
    [item.lampiran, ctx],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-slate-100 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-5 py-3.5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Tinjau PDF: {item.jenisSurat}
            </h3>
            <p className="text-xs text-slate-500">
              Pratinjau hasil cetak menggunakan Kop Surat dari <code className="text-emerald-700">/admin/settings</code> & substitusi otomatis <code className="text-blue-600">[Kode_Isian]</code> OpenSID • Kertas {rendered.ukuran} ({rendered.orientasi})
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lampiranSheets.length > 0 && (
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewFilter('all')}
                  className={`rounded px-2.5 py-1 text-xs font-semibold ${viewFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  Lengkap ({rendered.pagesHtml.length + lampiranSheets.length} Lembar)
                </button>
                <button
                  type="button"
                  onClick={() => setViewFilter('pengantar')}
                  className={`rounded px-2.5 py-1 text-xs font-semibold ${viewFilter === 'pengantar' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  Pengantar ({rendered.pagesHtml.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewFilter('lampiran')}
                  className={`rounded px-2.5 py-1 text-xs font-semibold ${viewFilter === 'lampiran' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  Lampiran ({lampiranSheets.length})
                </button>
              </div>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Cetak Uji Coba
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {(viewFilter === 'all' || viewFilter === 'pengantar') &&
            rendered.pagesHtml.map((pageHtml, idx) => (
              <div
                key={`pengantar-${idx}`}
                className="mx-auto mb-8 bg-white text-black shadow-lg"
                style={{
                  width: rendered.orientasi === 'Landscape' ? '29.7cm' : '21.5cm',
                  maxWidth: '100%',
                  minHeight: '29.7cm',
                  paddingTop: `${rendered.margin.atas}cm`,
                  paddingBottom: `${rendered.margin.bawah}cm`,
                  paddingLeft: `${rendered.margin.kiri}cm`,
                  paddingRight: `${rendered.margin.kanan}cm`,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: '11pt',
                  lineHeight: 1.45,
                }}
              >
                {(item.header === 1 || (item.header === 2 && idx === 0)) &&
                  rendered.headerRendered && (
                    <div
                      className="mb-4"
                      dangerouslySetInnerHTML={{ __html: rendered.headerRendered }}
                    />
                  )}
                <div dangerouslySetInnerHTML={{ __html: pageHtml }} />
                {item.footer !== false && rendered.footerRendered && (
                  <div
                    className="mt-10"
                    dangerouslySetInnerHTML={{ __html: rendered.footerRendered }}
                  />
                )}
              </div>
            ))}

          {(viewFilter === 'all' || viewFilter === 'lampiran') &&
            lampiranSheets.map((sheet, idx) => (
              <div
                key={`lampiran-${sheet.kode}-${idx}`}
                className="mx-auto mb-8 bg-white text-black shadow-lg"
                style={{
                  width: sheet.orientasi === 'Landscape' ? '33cm' : '21.5cm',
                  maxWidth: '100%',
                  minHeight: sheet.orientasi === 'Landscape' ? '21.5cm' : '29.7cm',
                  paddingTop: `${rendered.margin.atas}cm`,
                  paddingBottom: `${rendered.margin.bawah}cm`,
                  paddingLeft: `${rendered.margin.kiri}cm`,
                  paddingRight: `${rendered.margin.kanan}cm`,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: '10pt',
                  lineHeight: 1.35,
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: sheet.html }} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

