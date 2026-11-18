'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MASTER_LAMPIRAN_SURAT,
  LampiranSuratItem,
  DEFAULT_LAMPIRAN_MARGIN,
  DEFAULT_LAMPIRAN_KOTAK,
  LampiranMarginConfig,
  LampiranKotakConfig,
  enrichLampiranItem,
  getDefaultLampiranHtmlTemplate,
  getDefaultLampiranFormIsian,
  getDefaultLampiranKodeIsian,
  buildLampiranDummyPreviewContext,
  renderLampiranPagesForLetter,
  OpenSidKodeIsianItem,
} from '@/lib/lampiran-surat-data';
import { SEED_PERMOHONAN_SURAT } from '@/lib/permohonan-surat-data';
import {
  OPENSID_KODE_ISIAN_STANDAR,
  OPENSID_TIPE_ISIAN_OPTIONS,
  OpenSidFormSectionConfig,
  replaceOpenSidKodeIsian,
} from '@/lib/opensid-surat-engine';

const LAMPIRAN_KOLOM_OPTIONS = [
  { value: 12, label: '12 Kolom (Penuh)' },
  { value: 8, label: '8 Kolom (2/3)' },
  { value: 6, label: '6 Kolom (1/2)' },
  { value: 4, label: '4 Kolom (1/3)' },
  { value: 3, label: '3 Kolom (1/4)' },
];
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Paperclip,
  Scale,
  Users,
  Eye,
  HeartHandshake,
  FileSignature,
  MapPin,
  Briefcase,
  Stamp,
  Plus,
  Trash2,
  Settings,
  Download,
  RefreshCw,
  Pencil,
  Copy,
  Lock,
  Unlock,
  ArrowLeft,
  Save,
  Check,
  Code2,
  Columns,
  FileText,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  Table as TableIcon,
  RotateCcw,
  Sparkles,
  Layers,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { LampiranPreviewModal } from './_components/lampiran-preview-modal';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';

type KategoriFilter = 'Semua' | LampiranSuratItem['kategori'];

const LAMPIRAN_SUBJEK_TABS: Array<{
  key: string;
  title: string;
  defaultPrefix: string;
  defaultSebutan: string;
}> = [
  { key: 'individu', title: 'Individu / Pemohon', defaultPrefix: '', defaultSebutan: 'pemohon' },
  { key: 'kepala_keluarga', title: 'Kepala Keluarga (KK)', defaultPrefix: 'kk', defaultSebutan: 'kepala keluarga' },
  { key: 'ayah', title: 'Ayah Kandung', defaultPrefix: 'ayah', defaultSebutan: 'ayah' },
  { key: 'ibu', title: 'Ibu Kandung', defaultPrefix: 'ibu', defaultSebutan: 'ibu' },
  { key: 'pasangan', title: 'Calon Pasangan / Suami-Istri', defaultPrefix: 'pasangan', defaultSebutan: 'calon pasangan' },
  { key: 'saksi_1', title: 'Saksi I', defaultPrefix: 'saksi1', defaultSebutan: 'saksi I' },
  { key: 'saksi_2', title: 'Saksi II', defaultPrefix: 'saksi2', defaultSebutan: 'saksi II' },
];

export default function PengaturanLampiranSuratPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  // Firestore real-time collection for Lampiran Surat
  const lampiranCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'pengaturan_lampiran_surat') : null),
    [firestore]
  );
  const { data: firestoreDocs, isLoading: isLoadingFirestore } =
    useCollection<LampiranSuratItem>(lampiranCollectionRef);

  const [localFallback, setLocalFallback] = useState<LampiranSuratItem[]>(() =>
    MASTER_LAMPIRAN_SURAT.map(enrichLampiranItem)
  );
  const [hasSeeded, setHasSeeded] = useState(false);

  // Global Lampiran Settings (OpenSID pengaturan_lampiran: margin & kotak)
  const [globalMargin, setGlobalMargin] = useState<LampiranMarginConfig>({
    ...DEFAULT_LAMPIRAN_MARGIN,
  });
  const [globalKotak, setGlobalKotak] = useState<LampiranKotakConfig>({
    ...DEFAULT_LAMPIRAN_KOTAK,
  });
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const [globalSettingsTab, setGlobalSettingsTab] = useState<'kertas' | 'kotak'>('kertas');

  // Seed Firestore if empty
  useEffect(() => {
    if (!firestore || isLoadingFirestore || hasSeeded) return;
    if (firestoreDocs && firestoreDocs.length === 0) {
      setHasSeeded(true);
      MASTER_LAMPIRAN_SURAT.forEach((raw) => {
        const enriched = enrichLampiranItem(raw);
        const docRef = doc(firestore, 'pengaturan_lampiran_surat', enriched.id);
        setDocumentNonBlocking(docRef, enriched, { merge: true });
      });
    } else if (firestoreDocs && firestoreDocs.length > 0) {
      setHasSeeded(true);
    }
  }, [firestore, firestoreDocs, isLoadingFirestore, hasSeeded]);

  const lampiranList = useMemo<LampiranSuratItem[]>(() => {
    if (firestoreDocs && firestoreDocs.length > 0) {
      const items = firestoreDocs
        .filter((d) => !d.id.startsWith('__'))
        .map((d) => {
          const enriched = enrichLampiranItem(d);
          if (!enriched.useCustomTemplate) {
            enriched.templateHtml = getDefaultLampiranHtmlTemplate(enriched);
          }
          return enriched;
        });
      return items.sort((a, b) => a.kode.localeCompare(b.kode));
    }
    return localFallback.map((d) => {
      const enriched = enrichLampiranItem(d);
      if (!enriched.useCustomTemplate) {
        enriched.templateHtml = getDefaultLampiranHtmlTemplate(enriched);
      }
      return enriched;
    });
  }, [firestoreDocs, localFallback]);

  // View Mode: 'list' or 'editor'
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [activeEditorTab, setActiveEditorTab] = useState<'umum' | 'template' | 'form_isian'>('umum');
  const [templateViewMode, setTemplateViewMode] = useState<'split' | 'visual' | 'html'>('split');
  const [activeSubjectTab, setActiveSubjectTab] = useState<string>('individu');
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [editingItem, setEditingItem] = useState<LampiranSuratItem | null>(null);

  // List filters & selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<KategoriFilter>('Semua');
  const [selectedJenis, setSelectedJenis] = useState<'all' | '1' | '2'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [previewItem, setPreviewItem] = useState<LampiranSuratItem | null>(null);
  const [isKodeIsianModalOpen, setIsKodeIsianModalOpen] = useState(false);
  const [kodeIsianSearch, setKodeIsianSearch] = useState('');
  const [suratSearchQuery, setSuratSearchQuery] = useState('');
  const [customSuratInput, setCustomSuratInput] = useState('');

  const visualEditorRef = useRef<HTMLDivElement | null>(null);

  // All available letter names from SEED_PERMOHONAN_SURAT
  const allMasterSuratNames = useMemo(() => {
    const names = new Set<string>();
    SEED_PERMOHONAN_SURAT.forEach((s) => names.add(s.jenisSurat));
    MASTER_LAMPIRAN_SURAT.forEach((l) => l.suratTerkait.forEach((st) => names.add(st)));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, []);

  // Filtered Lampiran list
  const filteredLampiran = useMemo(() => {
    return lampiranList.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.nama.toLowerCase().includes(q) ||
        item.kode.toLowerCase().includes(q) ||
        (item.slug || '').toLowerCase().includes(q) ||
        item.dasarHukum.toLowerCase().includes(q) ||
        item.instansi.toLowerCase().includes(q) ||
        item.suratTerkait.some((s) => s.toLowerCase().includes(q));

      const matchesKategori = selectedKategori === 'Semua' || item.kategori === selectedKategori;
      const matchesJenis =
        selectedJenis === 'all' || String(item.jenis || 1) === selectedJenis;
      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && item.isActive) ||
        (selectedStatus === 'inactive' && !item.isActive);

      return matchesSearch && matchesKategori && matchesJenis && matchesStatus;
    });
  }, [lampiranList, searchQuery, selectedKategori, selectedJenis, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: lampiranList.length,
      aktif: lampiranList.filter((i) => i.isActive).length,
      dukcapil: lampiranList.filter((i) => i.kategori === 'Kependudukan & Capil').length,
      kua: lampiranList.filter((i) => i.kategori === 'Pernikahan KUA').length,
      sptjm: lampiranList.filter((i) => i.kategori === 'SPTJM & Pernyataan').length,
      meterai: lampiranList.filter((i) => i.perluMeterai).length,
    };
  }, [lampiranList]);

  // Persist a single Lampiran item
  const persistLampiranItem = (item: LampiranSuratItem) => {
    const enriched = enrichLampiranItem({
      ...item,
      updatedAt: new Date().toISOString(),
    });
    setLocalFallback((prev) => {
      const exists = prev.some((p) => p.id === enriched.id);
      if (exists) {
        return prev.map((p) => (p.id === enriched.id ? enriched : p));
      }
      return [enriched, ...prev];
    });
    if (firestore) {
      const docRef = doc(firestore, 'pengaturan_lampiran_surat', enriched.id);
      setDocumentNonBlocking(docRef, enriched, { merge: true });
    }
    return enriched;
  };

  // Toggle active status in list
  const handleToggleActive = (id: string, nama: string, currentState: boolean) => {
    const target = lampiranList.find((item) => item.id === id);
    if (!target) return;
    persistLampiranItem({
      ...target,
      isActive: !currentState,
    });
    toast({
      title: !currentState ? 'Lampiran Diaktifkan' : 'Lampiran Dinonaktifkan',
      description: `${nama} kini ${!currentState ? 'aktif dan siap disertakan saat cetak surat' : 'dinonaktifkan'}.`,
    });
  };

  // Open Editor for existing Lampiran
  const handleOpenEdit = (item: LampiranSuratItem) => {
    const enriched = enrichLampiranItem(item);
    if (!enriched.useCustomTemplate) {
      enriched.templateHtml = getDefaultLampiranHtmlTemplate(enriched);
    }
    setEditingItem(JSON.parse(JSON.stringify(enriched)));
    setIsNewRecord(false);
    setActiveEditorTab('umum');
    setViewMode('editor');
  };

  // Open Editor for New Lampiran Desa
  const handleAddNewLampiran = () => {
    const newId = `lamp-desa-${Date.now()}`;
    const blankItem: LampiranSuratItem = enrichLampiranItem({
      id: newId,
      slug: 'lampiran-desa-baru',
      kode: 'LAMP-DESA-01',
      nama: 'Formulir Lampiran Keterangan Desa',
      jenis: 2,
      kategori: 'SPTJM & Pernyataan',
      dasarHukum: 'Peraturan Desa Sampeldes',
      instansi: 'Pemerintah Desa Sampeldes',
      deskripsi: 'Lampiran tambahan khusus layanan administrasi Pemerintah Desa Sampeldes.',
      formatLembar: 'F4',
      orientasi: 'Potrait',
      marginGlobal: true,
      margin: { ...globalMargin },
      kotak: { ...globalKotak },
      jumlahSaksi: 2,
      perluMeterai: false,
      nominalMeterai: 'Rp 10.000',
      suratTerkait: [],
      isActive: true,
      useCustomTemplate: true,
    });
    setEditingItem(blankItem);
    setIsNewRecord(true);
    setActiveEditorTab('umum');
    setViewMode('editor');
  };

  // Duplicate Lampiran as Lampiran Desa
  const handleDuplicateLampiran = (item: LampiranSuratItem) => {
    const copyId = `lamp-copy-${Date.now()}`;
    const duplicated: LampiranSuratItem = enrichLampiranItem({
      ...JSON.parse(JSON.stringify(item)),
      id: copyId,
      kode: `${item.kode}-DESA`,
      slug: `${item.slug || item.kode.toLowerCase()}-desa`,
      nama: `${item.nama} (Salinan Desa)`,
      jenis: 2,
      updatedAt: new Date().toISOString(),
    });
    persistLampiranItem(duplicated);
    toast({
      title: 'Lampiran Berhasil Disalin',
      description: `"${duplicated.nama}" ditambahkan sebagai Lampiran Desa dan siap diedit.`,
    });
  };

  // Delete single Lampiran
  const handleDeleteLampiran = (item: LampiranSuratItem) => {
    setLocalFallback((prev) => prev.filter((p) => p.id !== item.id));
    if (firestore) {
      deleteDocumentNonBlocking(doc(firestore, 'pengaturan_lampiran_surat', item.id));
    }
    setSelectedIds((prev) => prev.filter((id) => id !== item.id));
    toast({
      title: 'Lampiran Dihapus',
      description: `Lampiran ${item.kode} - ${item.nama} telah dihapus.`,
    });
  };

  // Delete bulk selected Lampiran
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      if (firestore) {
        deleteDocumentNonBlocking(doc(firestore, 'pengaturan_lampiran_surat', id));
      }
    });
    setLocalFallback((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
    toast({
      title: `${selectedIds.length} Lampiran Dihapus`,
      description: 'Data lampiran terpilih telah dihapus dari daftar.',
    });
    setSelectedIds([]);
  };

  // Sync / Reset all standard OpenSID Lampiran
  const handleSyncStandardOpenSid = () => {
    const enrichedDefaults = MASTER_LAMPIRAN_SURAT.map((m) => {
      const item = enrichLampiranItem(m);
      item.templateHtml = getDefaultLampiranHtmlTemplate(item);
      item.useCustomTemplate = false;
      return item;
    });
    setLocalFallback(enrichedDefaults);
    if (firestore) {
      enrichedDefaults.forEach((item) => {
        const docRef = doc(firestore, 'pengaturan_lampiran_surat', item.id);
        setDocumentNonBlocking(docRef, item, { merge: true });
      });
    }
    toast({
      title: 'Standar Lampiran OpenSID Disinkronkan',
      description: `${enrichedDefaults.length} lampiran standar (F-1.01 s/d N-6, SPTJM, Sporadik, SPPD) telah dimuat ulang sesuai format resmi terbaru.`,
    });
  };

  // Export JSON
  const handleExportJson = () => {
    const targetData =
      selectedIds.length > 0
        ? lampiranList.filter((i) => selectedIds.includes(i.id))
        : lampiranList;
    const blob = new Blob([JSON.stringify(targetData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lampiran-surat-opensid-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Ekspor Lampiran Berhasil',
      description: `${targetData.length} lampiran surat diekspor ke berkas JSON.`,
    });
  };

  // Save Editor (Simpan Sementara / Simpan dan Keluar)
  const handleSaveEditor = (exitAfterSave: boolean) => {
    if (!editingItem) return;
    if (!editingItem.nama.trim() || !editingItem.kode.trim()) {
      toast({
        title: 'Validasi Gagal',
        description: 'Kode Blanko dan Nama Lampiran wajib diisi.',
        variant: 'destructive',
      });
      return;
    }

    const saved = persistLampiranItem(editingItem);
    setEditingItem(saved);
    setIsNewRecord(false);

    toast({
      title: exitAfterSave ? 'Lampiran Disimpan' : 'Simpan Sementara Berhasil',
      description: `Perubahan pada lampiran "${saved.kode} - ${saved.nama}" telah disimpan.`,
    });

    if (exitAfterSave) {
      setViewMode('list');
      setEditingItem(null);
    }
  };

  // Insert [Kode_Isian] or HTML snippet into templateHtml
  const handleInsertToTemplate = (snippet: string) => {
    if (!editingItem) return;
    const currentHtml = editingItem.templateHtml || getDefaultLampiranHtmlTemplate(editingItem);
    const updatedHtml = `${currentHtml}\n${snippet}`;
    setEditingItem({
      ...editingItem,
      useCustomTemplate: true,
      templateHtml: updatedHtml,
    });
    toast({
      title: 'Kode Isian Disisipkan',
      description: `${snippet} ditambahkan ke template lampiran.`,
    });
  };

  // Execute formatting command in visual editor
  const execVisualCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (visualEditorRef.current && editingItem) {
      setEditingItem({
        ...editingItem,
        useCustomTemplate: true,
        templateHtml: visualEditorRef.current.innerHTML,
      });
    }
  };

  // Add Kode Isian row in Tab 3
  const handleAddKodeIsianRow = () => {
    if (!editingItem) return;
    const currentList = editingItem.kodeIsian || getDefaultLampiranKodeIsian(editingItem);
    const nextIdx = currentList.length + 1;
    const newRow: OpenSidKodeIsianItem = {
      tipe: 'text',
      kode: `[Form_Isian_${nextIdx}]`,
      nama: `Isian Lampiran ${nextIdx}`,
      deskripsi: 'Keterangan isian tambahan lampiran',
      required: false,
      kolom: 6,
    };
    setEditingItem({
      ...editingItem,
      kodeIsian: [...currentList, newRow],
    });
  };

  const handleUpdateKodeIsianRow = (
    idx: number,
    patch: Partial<OpenSidKodeIsianItem>
  ) => {
    if (!editingItem) return;
    const currentList = [...(editingItem.kodeIsian || getDefaultLampiranKodeIsian(editingItem))];
    currentList[idx] = { ...currentList[idx], ...patch };
    setEditingItem({
      ...editingItem,
      kodeIsian: currentList,
    });
  };

  const handleRemoveKodeIsianRow = (idx: number) => {
    if (!editingItem) return;
    const currentList = [...(editingItem.kodeIsian || getDefaultLampiranKodeIsian(editingItem))];
    currentList.splice(idx, 1);
    setEditingItem({
      ...editingItem,
      kodeIsian: currentList,
    });
  };

  // Toggle Surat Terkait in Tab 1
  const handleToggleSuratTerkait = (suratNama: string) => {
    if (!editingItem) return;
    const exists = editingItem.suratTerkait.includes(suratNama);
    const updated = exists
      ? editingItem.suratTerkait.filter((s) => s !== suratNama)
      : [...editingItem.suratTerkait, suratNama];
    setEditingItem({
      ...editingItem,
      suratTerkait: updated,
    });
  };

  const handleAddCustomSuratTerkait = () => {
    if (!editingItem || !customSuratInput.trim()) return;
    const clean = customSuratInput.trim();
    if (!editingItem.suratTerkait.includes(clean)) {
      setEditingItem({
        ...editingItem,
        suratTerkait: [...editingItem.suratTerkait, clean],
      });
    }
    setCustomSuratInput('');
  };

  const getKategoriBadge = (kategori: LampiranSuratItem['kategori']) => {
    switch (kategori) {
      case 'Kependudukan & Capil':
        return (
          <Badge className="bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 gap-1 font-medium">
            <Users className="h-3 w-3" /> Kependudukan & Capil
          </Badge>
        );
      case 'Pernikahan KUA':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 gap-1 font-medium">
            <HeartHandshake className="h-3 w-3" /> Pernikahan KUA
          </Badge>
        );
      case 'SPTJM & Pernyataan':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 gap-1 font-medium">
            <FileSignature className="h-3 w-3" /> SPTJM & Pernyataan
          </Badge>
        );
      case 'Pertanahan':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 gap-1 font-medium">
            <MapPin className="h-3 w-3" /> Pertanahan
          </Badge>
        );
      case 'Surat Dinas':
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 gap-1 font-medium">
            <Briefcase className="h-3 w-3" /> Surat Dinas
          </Badge>
        );
    }
  };

  // Live rendered HTML preview inside Editor Tab 2
  const liveRenderedEditorPages = useMemo(() => {
    if (!editingItem) return [];
    const context = buildLampiranDummyPreviewContext(editingItem);
    if (!editingItem.useCustomTemplate) {
      const pages = renderLampiranPagesForLetter([editingItem.kode], context);
      if (pages.length > 0) return pages.map((p) => p.html);
    }
    const rawHtml = editingItem.templateHtml || getDefaultLampiranHtmlTemplate(editingItem);
    return replaceOpenSidKodeIsian(rawHtml, context).split(
      /<!--\s*(?:pagebreak|page_break)\s*-->/i
    );
  }, [editingItem]);

  // ============================================================================
  // RENDER EDITOR VIEW (UMUM, TEMPLATE, FORM ISIAN)
  // ============================================================================
  if (viewMode === 'editor' && editingItem) {
    const currentMargin = editingItem.margin || DEFAULT_LAMPIRAN_MARGIN;
    const currentKotak = editingItem.kotak || DEFAULT_LAMPIRAN_KOTAK;
    const currentFormIsian = editingItem.formIsian || getDefaultLampiranFormIsian(editingItem);
    const currentKodeIsian = editingItem.kodeIsian || getDefaultLampiranKodeIsian(editingItem);
    const activeSubjectConfig: OpenSidFormSectionConfig = currentFormIsian[activeSubjectTab] || {
      judul:
        LAMPIRAN_SUBJEK_TABS.find((t) => t.key === activeSubjectTab)?.title || 'Subjek Lampiran',
      label: `Data ${activeSubjectTab}`,
      info: '',
      prefix:
        LAMPIRAN_SUBJEK_TABS.find((t) => t.key === activeSubjectTab)?.defaultPrefix || '',
    };

    const filteredMasterSurat = allMasterSuratNames.filter((name) =>
      name.toLowerCase().includes(suratSearchQuery.toLowerCase())
    );

    return (
      <div className="space-y-5 pb-24">
        {/* Top Breadcrumb & Title Header matching OpenSID /lampiran/form */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="hover:text-sky-700 font-medium flex items-center gap-1"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Daftar Lampiran Surat
              </button>
              <span>/</span>
              <span className="text-slate-900 font-semibold">
                {isNewRecord ? 'Tambah Lampiran Surat' : 'Ubah Lampiran Surat'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black font-condensed uppercase tracking-tight text-slate-900">
                Lampiran {editingItem.nama || 'Baru'}
              </h1>
              <Badge className="bg-slate-900 text-white font-mono text-xs px-2.5 py-0.5">
                {editingItem.kode}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-semibold',
                  editingItem.jenis === 2
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-sky-50 text-sky-800 border-sky-300'
                )}
              >
                {editingItem.jenis === 2 ? 'Lampiran Desa' : 'Lampiran Sistem OpenSID'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewItem(editingItem)}
              className="gap-1.5 border-sky-200 text-sky-700 hover:bg-sky-50 font-semibold"
            >
              <Eye className="h-4 w-4" />
              Tinjau PDF / Blanko
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-1.5 text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Daftar Lampiran
            </Button>
          </div>
        </div>

        {/* 3 Main OpenSID Tabs: Umum | Template | Form Isian */}
        <Card className="border-slate-200/80 shadow-xs overflow-hidden rounded-2xl">
          <div className="bg-slate-50 border-b border-slate-200 px-5 pt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveEditorTab('umum')}
                className={cn(
                  'px-5 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-2 -mb-px',
                  activeEditorTab === 'umum'
                    ? 'bg-white text-sky-700 border-slate-200 border-b-white shadow-2xs'
                    : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/70'
                )}
              >
                <Settings className="h-4 w-4" />
                <span>Umum</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveEditorTab('template')}
                className={cn(
                  'px-5 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-2 -mb-px',
                  activeEditorTab === 'template'
                    ? 'bg-white text-sky-700 border-slate-200 border-b-white shadow-2xs'
                    : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/70'
                )}
              >
                <FileText className="h-4 w-4" />
                <span>Template</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveEditorTab('form_isian')}
                className={cn(
                  'px-5 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-2 -mb-px',
                  activeEditorTab === 'form_isian'
                    ? 'bg-white text-sky-700 border-slate-200 border-b-white shadow-2xs'
                    : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/70'
                )}
              >
                <Layers className="h-4 w-4" />
                <span>Form Isian</span>
                <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 text-[10px] px-1.5 py-0">
                  {currentKodeIsian.length}
                </Badge>
              </button>
            </div>

            <div className="pb-2 text-[11px] text-slate-500 hidden md:flex items-center gap-2">
              <span>Slug:</span>
              <code className="bg-slate-200/70 text-slate-800 px-2 py-0.5 rounded font-mono">
                storage/app/template/lampiran/{editingItem.slug || 'f-1.01'}/view.php
              </code>
            </div>
          </div>

          {/* ================================================================
              TAB 1: PENGATURAN UMUM LAMPIRAN (OpenSID lampiran/form.blade.php)
              ================================================================ */}
          {activeEditorTab === 'umum' && (
            <CardContent className="p-6 space-y-6 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Identitas & Spesifikasi Kertas */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50/40">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-2">
                      <Paperclip className="h-3.5 w-3.5 text-sky-600" />
                      Identitas & Regulasi Lampiran Surat
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Kode Blanko <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          value={editingItem.kode}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, kode: e.target.value })
                          }
                          placeholder="Contoh: F-1.01 / Model N-1"
                          className="font-mono font-bold text-xs bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Slug Direktori</label>
                        <Input
                          value={editingItem.slug || ''}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, slug: e.target.value })
                          }
                          placeholder="f-1.01"
                          className="font-mono text-xs bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Jenis Lampiran</label>
                        <select
                          value={editingItem.jenis || 1}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              jenis: Number(e.target.value) as 1 | 2,
                            })
                          }
                          className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                        >
                          <option value={1}>1 - Lampiran Sistem (OpenSID)</option>
                          <option value={2}>2 - Lampiran Desa (Kustom)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Nama Lampiran <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex rounded-md shadow-2xs">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-xs font-semibold">
                          Lampiran
                        </span>
                        <Input
                          value={editingItem.nama}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, nama: e.target.value })
                          }
                          placeholder="Nama lengkap lampiran surat..."
                          className="rounded-l-none bg-white text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Kategori Lampiran</label>
                        <select
                          value={editingItem.kategori}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              kategori: e.target.value as LampiranSuratItem['kategori'],
                            })
                          }
                          className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                        >
                          <option value="Kependudukan & Capil">Kependudukan & Capil</option>
                          <option value="Pernikahan KUA">Pernikahan KUA</option>
                          <option value="SPTJM & Pernyataan">SPTJM & Pernyataan</option>
                          <option value="Pertanahan">Pertanahan</option>
                          <option value="Surat Dinas">Surat Dinas</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Instansi Tujuan</label>
                        <Input
                          value={editingItem.instansi}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, instansi: e.target.value })
                          }
                          placeholder="Contoh: Disdukcapil Kab. Cilacap / KUA"
                          className="bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Dasar Hukum / Regulasi
                      </label>
                      <Input
                        value={editingItem.dasarHukum}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, dasarHukum: e.target.value })
                        }
                        placeholder="Contoh: Permendagri No. 108 Tahun 2019 / Kepdirjen Bimas Islam No. 473 Tahun 2020"
                        className="bg-white text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Deskripsi & Kegunaan Blanko
                      </label>
                      <Textarea
                        rows={2}
                        value={editingItem.deskripsi}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, deskripsi: e.target.value })
                        }
                        placeholder="Penjelasan fungsi lampiran..."
                        className="bg-white text-xs"
                      />
                    </div>
                  </div>

                  {/* Pengaturan Kertas, Orientasi, Margin, Kotak Karakter (OpenSID lampiran/form.blade.php) */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50/40">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-2">
                      <Settings className="h-3.5 w-3.5 text-sky-600" />
                      Pengaturan Kertas, Margin & Kotak Karakter (Standar OpenSID)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Status Lampiran */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Status Lampiran</label>
                        <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setEditingItem({ ...editingItem, isActive: true })}
                            className={cn(
                              'py-1.5 text-xs font-bold rounded-md transition-all',
                              editingItem.isActive
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            )}
                          >
                            Aktif
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItem({ ...editingItem, isActive: false })}
                            className={cn(
                              'py-1.5 text-xs font-bold rounded-md transition-all',
                              !editingItem.isActive
                                ? 'bg-slate-800 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            )}
                          >
                            Tidak Aktif
                          </button>
                        </div>
                      </div>

                      {/* Orientasi Kertas */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Orientasi Kertas</label>
                        <select
                          value={editingItem.orientasi || 'Potrait'}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              orientasi: e.target.value as 'Potrait' | 'Landscape',
                            })
                          }
                          className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                        >
                          <option value="Potrait">Potrait (Tegak)</option>
                          <option value="Landscape">Landscape (Mendatar / F-1.01)</option>
                        </select>
                      </div>

                      {/* Ukuran Kertas */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Ukuran Kertas</label>
                        <select
                          value={editingItem.formatLembar}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              formatLembar: e.target.value as 'A4' | 'F4' | 'Legal',
                            })
                          }
                          className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                        >
                          <option value="F4">F4 / Folio (215 x 330 mm)</option>
                          <option value="A4">A4 (210 x 297 mm)</option>
                          <option value="Legal">Legal (216 x 356 mm)</option>
                        </select>
                      </div>
                    </div>

                    {/* Gunakan Margin Kertas Global */}
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="text-xs font-bold text-slate-700">
                            Gunakan Margin Kertas Global
                          </label>
                          <p className="text-[11px] text-slate-500">
                            Margin global default OpenSID: Kiri {globalMargin.kiri} cm, Atas{' '}
                            {globalMargin.atas} cm, Kanan {globalMargin.kanan} cm, Bawah{' '}
                            {globalMargin.bawah} cm
                          </p>
                        </div>
                        <div className="inline-flex bg-slate-200/70 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingItem({ ...editingItem, marginGlobal: true })
                            }
                            className={cn(
                              'px-4 py-1 text-xs font-bold rounded-md transition-all',
                              editingItem.marginGlobal !== false
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            )}
                          >
                            Ya
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingItem({
                                ...editingItem,
                                marginGlobal: false,
                                margin: editingItem.margin || { ...DEFAULT_LAMPIRAN_MARGIN },
                              })
                            }
                            className={cn(
                              'px-4 py-1 text-xs font-bold rounded-md transition-all',
                              editingItem.marginGlobal === false
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            )}
                          >
                            Tidak (Manual)
                          </button>
                        </div>
                      </div>

                      {editingItem.marginGlobal === false && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white rounded-lg border border-sky-200">
                          {(['kiri', 'atas', 'kanan', 'bawah'] as const).map((side) => (
                            <div key={side} className="space-y-1">
                              <label className="text-[11px] font-bold uppercase text-slate-600">
                                Margin {side} (cm)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="10"
                                value={currentMargin[side]}
                                onChange={(e) =>
                                  setEditingItem({
                                    ...editingItem,
                                    margin: {
                                      ...currentMargin,
                                      [side]: parseFloat(e.target.value) || 0,
                                    },
                                  })
                                }
                                className="h-8 text-xs font-mono text-right"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Kotak Karakter Blanko F-Series & Saksi / Meterai */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/80">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          Jarak Antar Kotak (mm)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          value={currentKotak.jarak}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              kotak: {
                                ...currentKotak,
                                jarak: parseInt(e.target.value, 10) || 0,
                              },
                            })
                          }
                          className="h-8 text-xs font-mono bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          Lebar Kotak Huruf (mm)
                        </label>
                        <Input
                          type="number"
                          min="2"
                          max="20"
                          value={currentKotak.lebar}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              kotak: {
                                ...currentKotak,
                                lebar: parseInt(e.target.value, 10) || 5,
                              },
                            })
                          }
                          className="h-8 text-xs font-mono bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          Jumlah Saksi Blanko
                        </label>
                        <select
                          value={editingItem.jumlahSaksi || 0}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              jumlahSaksi: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800"
                        >
                          <option value={0}>Tanpa Saksi (0)</option>
                          <option value={1}>1 Orang Saksi</option>
                          <option value={2}>2 Orang Saksi</option>
                          <option value={4}>4 Saksi Batas (Sporadik)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          Ketentuan Meterai
                        </label>
                        <div className="flex items-center gap-2 h-8">
                          <Switch
                            checked={!!editingItem.perluMeterai}
                            onCheckedChange={(checked) =>
                              setEditingItem({
                                ...editingItem,
                                perluMeterai: checked,
                                nominalMeterai: checked
                                  ? editingItem.nominalMeterai || 'Rp 10.000'
                                  : undefined,
                              })
                            }
                          />
                          <span className="text-xs font-semibold text-slate-700">
                            {editingItem.perluMeterai ? 'Wajib Meterai Rp 10.000' : 'Tanpa Meterai'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Relasi ke Daftar Surat (/admin/surat/master) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/40 h-full flex flex-col">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-sky-600" />
                          Surat Layanan Terkait ({editingItem.suratTerkait.length})
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Pilih jenis surat di <code className="font-mono">/admin/surat/master</code> yang menyertakan lampiran ini
                        </p>
                      </div>
                    </div>

                    {/* Selected Surat Badges */}
                    <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 bg-white rounded-lg border border-slate-200">
                      {editingItem.suratTerkait.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">
                          Belum ada surat terkait yang dipilih...
                        </span>
                      ) : (
                        editingItem.suratTerkait.map((st, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-sky-50 text-sky-800 border border-sky-200 text-[11px] gap-1.5 py-0.5 px-2"
                          >
                            <span>{st}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleSuratTerkait(st)}
                              className="text-sky-600 hover:text-rose-600 font-bold"
                            >
                              ×
                            </button>
                          </Badge>
                        ))
                      )}
                    </div>

                    {/* Search Master Surat */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        value={suratSearchQuery}
                        onChange={(e) => setSuratSearchQuery(e.target.value)}
                        placeholder="Cari surat dari /admin/surat/master..."
                        className="pl-8 h-8 text-xs bg-white"
                      />
                    </div>

                    {/* Checklist Master Surat */}
                    <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
                      {filteredMasterSurat.map((suratName) => {
                        const checked = editingItem.suratTerkait.includes(suratName);
                        return (
                          <label
                            key={suratName}
                            className={cn(
                              'flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 transition-colors',
                              checked && 'bg-sky-50/60 font-semibold text-sky-900'
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => handleToggleSuratTerkait(suratName)}
                            />
                            <span className="truncate">{suratName}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Add Custom Surat Name */}
                    <div className="flex gap-1.5 pt-1">
                      <Input
                        value={customSuratInput}
                        onChange={(e) => setCustomSuratInput(e.target.value)}
                        placeholder="Tambah nama surat terkait lainnya..."
                        className="h-8 text-xs bg-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomSuratTerkait();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddCustomSuratTerkait}
                        className="h-8 text-xs shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Tambah
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}

          {/* ================================================================
              TAB 2: TEMPLATE LAMPIRAN (Visual WYSIWYG / HTML / Split Preview)
              ================================================================ */}
          {activeEditorTab === 'template' && (
            <CardContent className="p-6 space-y-4 bg-white">
              {/* Top Template Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setTemplateViewMode('split')}
                      className={cn(
                        'px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all',
                        templateViewMode === 'split'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      <Columns className="h-3.5 w-3.5" />
                      Split (Editor + Kertas)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateViewMode('visual')}
                      className={cn(
                        'px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all',
                        templateViewMode === 'visual'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Visual WYSIWYG
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateViewMode('html')}
                      className={cn(
                        'px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all',
                        templateViewMode === 'html'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      Kode HTML
                    </button>
                  </div>

                  {/* Mode Render Saat Cetak */}
                  <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                    <span className="text-xs font-semibold text-slate-600">Mode Cetak Utama:</span>
                    <select
                      value={editingItem.useCustomTemplate ? 'custom_html' : 'builtin_blanko'}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          useCustomTemplate: e.target.value === 'custom_html',
                        })
                      }
                      className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800"
                    >
                      <option value="builtin_blanko">
                        Blanko Presisi Bawaan Sistem ({editingItem.kode})
                      </option>
                      <option value="custom_html">
                        Template HTML Kustom Desa ([Kode_Isian])
                      </option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Salin Template dari Lampiran Lain */}
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const source = lampiranList.find((l) => l.id === e.target.value);
                      if (source) {
                        setEditingItem({
                          ...editingItem,
                          useCustomTemplate: true,
                          templateHtml:
                            source.templateHtml || getDefaultLampiranHtmlTemplate(source),
                        });
                        toast({
                          title: 'Template Lampiran Disalin',
                          description: `Template dari ${source.kode} - ${source.nama} berhasil dimuat.`,
                        });
                      }
                      e.target.value = '';
                    }}
                    className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700"
                  >
                    <option value="" disabled>
                      Salin Template Lampiran...
                    </option>
                    {lampiranList.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.kode} — {l.nama}
                      </option>
                    ))}
                  </select>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsKodeIsianModalOpen(true)}
                    className="h-8 text-xs gap-1.5 border-sky-300 text-sky-700 hover:bg-sky-50 font-bold"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Sisipkan [Kode_Isian]
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleInsertToTemplate('\n<!-- pagebreak -->\n')}
                    className="h-8 text-xs gap-1"
                  >
                    + Halaman Baru
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const freshDefault = getDefaultLampiranHtmlTemplate({
                        ...editingItem,
                        templateHtml: undefined,
                      });
                      setEditingItem({
                        ...editingItem,
                        templateHtml: freshDefault,
                      });
                      toast({
                        title: 'Template Direset ke Standar',
                        description: `Template HTML ${editingItem.kode} dikembalikan ke format bawaan OpenSID.`,
                      });
                    }}
                    className="h-8 text-xs gap-1 text-amber-700 border-amber-200 hover:bg-amber-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Bawaan
                  </Button>
                </div>
              </div>

              {/* Formatting Toolbar for Visual Editor */}
              {(templateViewMode === 'visual' || templateViewMode === 'split') && (
                <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 rounded-lg border border-slate-200">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => execVisualCommand('bold')}
                    className="h-7 w-7 p-0"
                    title="Tebal (Bold)"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => execVisualCommand('italic')}
                    className="h-7 w-7 p-0"
                    title="Miring (Italic)"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => execVisualCommand('underline')}
                    className="h-7 w-7 p-0"
                    title="Garis Bawah"
                  >
                    <Underline className="h-3.5 w-3.5" />
                  </Button>
                  <span className="h-4 w-px bg-slate-300 mx-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => execVisualCommand('justifyLeft')}
                    className="h-7 w-7 p-0"
                    title="Rata Kiri"
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => execVisualCommand('justifyCenter')}
                    className="h-7 w-7 p-0"
                    title="Rata Tengah"
                  >
                    <AlignCenter className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => execVisualCommand('justifyRight')}
                    className="h-7 w-7 p-0"
                    title="Rata Kanan"
                  >
                    <AlignRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => execVisualCommand('justifyFull')}
                    className="h-7 w-7 p-0"
                    title="Rata Kiri-Kanan"
                  >
                    <AlignJustify className="h-3.5 w-3.5" />
                  </Button>
                  <span className="h-4 w-px bg-slate-300 mx-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => execVisualCommand('insertUnorderedList')}
                    className="h-7 w-7 p-0"
                    title="Daftar Poin"
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleInsertToTemplate(
                        `<table style="width:100%; border-collapse:collapse; border:1px solid #000; margin:8px 0;"><thead><tr><th style="border:1px solid #000; padding:4px;">No</th><th style="border:1px solid #000; padding:4px;">Nama Lengkap</th><th style="border:1px solid #000; padding:4px;">NIK</th><th style="border:1px solid #000; padding:4px;">SHDK</th></tr></thead><tbody><tr><td style="border:1px solid #000; padding:4px; text-align:center;">1</td><td style="border:1px solid #000; padding:4px;">[Nama]</td><td style="border:1px solid #000; padding:4px;">[Nik]</td><td style="border:1px solid #000; padding:4px;">Kepala Keluarga</td></tr></tbody></table>`
                      )
                    }
                    className="h-7 px-2 text-[11px] gap-1"
                    title="Sisipkan Tabel Keluarga"
                  >
                    <TableIcon className="h-3.5 w-3.5" />
                    + Tabel Anggota KK
                  </Button>
                </div>
              )}

              {/* Editor Workspace */}
              <div
                className={cn(
                  'grid gap-6',
                  templateViewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
                )}
              >
                {/* Left: Code or Visual WYSIWYG */}
                {templateViewMode === 'visual' ? (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-600 flex items-center justify-between">
                      <span>Editor Visual WYSIWYG (Klik langsung pada dokumen untuk mengedit)</span>
                      <Badge variant="outline" className="text-[10px]">
                        Mendukung Tag [Kode_Isian]
                      </Badge>
                    </div>
                    <div
                      ref={visualEditorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        setEditingItem({
                          ...editingItem,
                          useCustomTemplate: true,
                          templateHtml: e.currentTarget.innerHTML,
                        })
                      }
                      dangerouslySetInnerHTML={{
                        __html:
                          editingItem.templateHtml || getDefaultLampiranHtmlTemplate(editingItem),
                      }}
                      className="min-h-[540px] p-8 bg-white border-2 border-sky-200 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-500 overflow-y-auto"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-600 flex items-center justify-between">
                      <span>Source Template HTML Lampiran (TinyMCE / Blade OpenSID Compatible)</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {(editingItem.templateHtml || '').length} karakter
                      </span>
                    </div>
                    <Textarea
                      value={
                        editingItem.templateHtml || getDefaultLampiranHtmlTemplate(editingItem)
                      }
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          useCustomTemplate: true,
                          templateHtml: e.target.value,
                        })
                      }
                      rows={24}
                      className="font-mono text-xs bg-slate-950 text-emerald-300 border-slate-800 rounded-xl p-4 leading-relaxed min-h-[540px]"
                    />
                  </div>
                )}

                {/* Right: Live Paper Preview with Dummy Context */}
                {templateViewMode === 'split' && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-600 flex items-center justify-between">
                      <span>
                        Pratinjau Hasil substitusi [Kode_Isian] ({editingItem.formatLembar} •{' '}
                        {editingItem.orientasi || 'Potrait'})
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewItem(editingItem)}
                        className="text-sky-700 hover:underline font-bold flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Buka Layar Penuh / Cetak
                      </button>
                    </div>
                    <div className="bg-slate-200/80 p-4 rounded-xl border border-slate-300 max-h-[560px] overflow-y-auto space-y-6">
                      {liveRenderedEditorPages.map((pageHtml, index) => (
                        <div
                          key={index}
                          style={{
                            paddingTop: `${currentMargin.atas}cm`,
                            paddingRight: `${currentMargin.kanan}cm`,
                            paddingBottom: `${currentMargin.bawah}cm`,
                            paddingLeft: `${currentMargin.kiri}cm`,
                          }}
                          className="bg-white shadow-md border border-slate-300 rounded-sm mx-auto text-black min-h-[460px]"
                        >
                          <div dangerouslySetInnerHTML={{ __html: pageHtml }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}

          {/* ================================================================
              TAB 3: FORM ISIAN & KODE ISIAN LAMPIRAN
              ================================================================ */}
          {activeEditorTab === 'form_isian' && (
            <CardContent className="p-6 space-y-6 bg-white">
              {/* Bagian 1: Pengaturan Subjek Data Lampiran */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Subjek Sumber Data Lampiran (OpenSID Form Isian)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Konfigurasi bagian form penduduk yang otomatis ditarik ke dalam blanko lampiran{' '}
                      <strong>{editingItem.kode}</strong>
                    </p>
                  </div>
                </div>

                {/* Sub-tabs for Individu, KK, Ayah, Ibu, Pasangan, Saksi I, Saksi II */}
                <div className="flex flex-wrap gap-1 bg-slate-100/80 p-2 border-b border-slate-200">
                  {LAMPIRAN_SUBJEK_TABS.map((tab) => {
                    const isConfigured = !!currentFormIsian[tab.key];
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveSubjectTab(tab.key)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                          activeSubjectTab === tab.key
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
                        )}
                      >
                        <span>{tab.title}</span>
                        {isConfigured && (
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              activeSubjectTab === tab.key ? 'bg-white' : 'bg-emerald-500'
                            )}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Judul Bagian Form</label>
                    <Input
                      value={activeSubjectConfig.judul}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          formIsian: {
                            ...currentFormIsian,
                            [activeSubjectTab]: {
                              ...activeSubjectConfig,
                              judul: e.target.value,
                            },
                          },
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Label Subjek</label>
                    <Input
                      value={activeSubjectConfig.label}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          formIsian: {
                            ...currentFormIsian,
                            [activeSubjectTab]: {
                              ...activeSubjectConfig,
                              label: e.target.value,
                            },
                          },
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Prefix Kode Isian (`[Nik_*]`)
                    </label>
                    <Input
                      value={activeSubjectConfig.prefix}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          formIsian: {
                            ...currentFormIsian,
                            [activeSubjectTab]: {
                              ...activeSubjectConfig,
                              prefix: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="kosong untuk utama, atau saksi1, ayah, ibu"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Info / Petunjuk Isian</label>
                    <Input
                      value={activeSubjectConfig.info}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          formIsian: {
                            ...currentFormIsian,
                            [activeSubjectTab]: {
                              ...activeSubjectConfig,
                              info: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="Keterangan singkat bagian ini..."
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: Tabel Kode Isian Khusus Lampiran */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Daftar Kode Isian Khusus Lampiran ({currentKodeIsian.length} Parameter)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Setiap kode di bawah dapat disisipkan ke dalam Tab <strong>Template</strong> dan
                      otomatis muncul pada form pengajuan surat yang memakai lampiran ini.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddKodeIsianRow}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Kode Isian Lampiran
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-100/80">
                      <TableRow>
                        <TableHead className="w-10 text-center text-[11px] font-bold">NO</TableHead>
                        <TableHead className="w-40 text-[11px] font-bold">TIPE INPUT</TableHead>
                        <TableHead className="w-48 text-[11px] font-bold">KODE ISIAN</TableHead>
                        <TableHead className="text-[11px] font-bold">NAMA / LABEL FORM</TableHead>
                        <TableHead className="text-[11px] font-bold">PLACEHOLDER / OPSI</TableHead>
                        <TableHead className="w-28 text-[11px] font-bold">LEBAR KOLOM</TableHead>
                        <TableHead className="w-20 text-center text-[11px] font-bold">WAJIB</TableHead>
                        <TableHead className="w-24 text-center text-[11px] font-bold">AKSI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentKodeIsian.map((row, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50/70">
                          <TableCell className="text-center font-mono text-xs text-slate-500">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <select
                              value={row.tipe}
                              onChange={(e) =>
                                handleUpdateKodeIsianRow(idx, { tipe: e.target.value })
                              }
                              className="w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs font-medium"
                            >
                              {OPENSID_TIPE_ISIAN_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.kode}
                              onChange={(e) =>
                                handleUpdateKodeIsianRow(idx, { kode: e.target.value })
                              }
                              className="h-8 text-xs font-mono font-bold text-sky-800 bg-sky-50/50"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.nama}
                              onChange={(e) =>
                                handleUpdateKodeIsianRow(idx, { nama: e.target.value })
                              }
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.deskripsi || ''}
                              onChange={(e) =>
                                handleUpdateKodeIsianRow(idx, { deskripsi: e.target.value })
                              }
                              placeholder="Deskripsi / placeholder..."
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <select
                              value={row.kolom || 6}
                              onChange={(e) =>
                                handleUpdateKodeIsianRow(idx, {
                                  kolom: Number(e.target.value),
                                })
                              }
                              className="w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs"
                            >
                              {LAMPIRAN_KOLOM_OPTIONS.map((k) => (
                                <option key={k.value} value={k.value}>
                                  {k.label}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={!!row.required}
                              onCheckedChange={(checked) =>
                                handleUpdateKodeIsianRow(idx, { required: !!checked })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title="Sisipkan ke Template"
                                onClick={() => {
                                  handleInsertToTemplate(row.kode);
                                  setActiveEditorTab('template');
                                }}
                                className="h-7 px-2 text-[11px] text-sky-700 hover:bg-sky-50"
                              >
                                Sisipkan
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveKodeIsianRow(idx)}
                                className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Sticky Bottom Action Bar matching /admin/surat/master */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-6 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setViewMode('list');
                setEditingItem(null);
              }}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 font-bold gap-1.5"
            >
              Batal
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewItem(editingItem)}
                className="border-sky-300 text-sky-700 hover:bg-sky-50 font-bold gap-1.5"
              >
                <Eye className="h-4 w-4" />
                Tinjau PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSaveEditor(false)}
                className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold gap-1.5"
              >
                <Save className="h-4 w-4" />
                Simpan Sementara
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleSaveEditor(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold gap-1.5 shadow-sm"
              >
                <Check className="h-4 w-4" />
                Simpan dan Keluar
              </Button>
            </div>
          </div>
        </div>

        {/* Modal Katalog [Kode_Isian] OpenSID */}
        <Dialog open={isKodeIsianModalOpen} onOpenChange={setIsKodeIsianModalOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-black uppercase">
                Katalog [Kode_Isian] Lampiran Surat OpenSID
              </DialogTitle>
              <DialogDescription className="text-xs">
                Klik salah satu variabel untuk menyisipkannya langsung ke dalam Template Lampiran.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                value={kodeIsianSearch}
                onChange={(e) => setKodeIsianSearch(e.target.value)}
                placeholder="Cari kode isian (misal: [Nama], [No_KK], [Kepala_KK], [Nama_Pamong])..."
                className="h-9 text-xs"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                {[
                  ...currentKodeIsian.map((k) => ({
                    kode: k.kode,
                    label: k.nama,
                    kategori: 'Form Lampiran',
                  })),
                  ...OPENSID_KODE_ISIAN_STANDAR.flatMap((group) =>
                    group.items.map((gi) => ({
                      kode: gi.kode,
                      label: gi.judul,
                      kategori: group.kategori,
                    }))
                  ),
                ]
                  .filter(
                    (item) =>
                      item.kode.toLowerCase().includes(kodeIsianSearch.toLowerCase()) ||
                      item.label.toLowerCase().includes(kodeIsianSearch.toLowerCase())
                  )
                  .map((item, i) => (
                    <button
                      key={`${item.kode}-${i}`}
                      type="button"
                      onClick={() => {
                        handleInsertToTemplate(item.kode);
                        setIsKodeIsianModalOpen(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-sky-400 hover:bg-sky-50/60 text-left transition-all"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.label}</p>
                        <p className="text-[10px] text-slate-500">{item.kategori}</p>
                      </div>
                      <code className="text-xs font-mono font-bold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded">
                        {item.kode}
                      </code>
                    </button>
                  ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Pratinjau Blanko & Template HTML */}
        <LampiranPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      </div>
    );
  }

  // ============================================================================
  // RENDER LIST VIEW (DAFTAR LAMPIRAN SURAT)
  // ============================================================================
  const allFilteredSelected =
    filteredLampiran.length > 0 &&
    filteredLampiran.every((item) => selectedIds.includes(item.id));

  return (
    <div className="space-y-6">
      {/* Header Section + Top Action Bar matching OpenSID /lampiran & /admin/surat/master */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-sky-600 text-white hover:bg-sky-700 font-semibold px-2.5 py-0.5">
                Standar Lampiran OpenSID
              </Badge>
              <span className="text-xs font-medium text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Desa Sampeldes — Kec. Gandrungmangu
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-condensed uppercase tracking-tight text-slate-900">
              Daftar & Editor Lampiran Surat
            </h1>
            <p className="text-sm text-slate-500 max-w-3xl">
              Kelola blanko lampiran resmi (Formulir Dukcapil F-1.01 s/d F-2.01, Formulir Nikah KUA
              Model N-1 s/d N-6, SPTJM, dan Sporadik BPN) lengkap dengan pengaturan{' '}
              <strong>Umum</strong>, <strong>Template HTML/Visual</strong>, dan{' '}
              <strong>Form Isian</strong> seperti pada <code className="font-mono">/admin/surat/master</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-sky-50/70 border border-sky-200/80 px-4 py-3 rounded-xl self-start">
            <Paperclip className="h-8 w-8 text-sky-600 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-sky-900 uppercase tracking-wider">
                Lampiran Aktif
              </div>
              <div className="text-xl font-black text-sky-700">
                {stats.aktif}{' '}
                <span className="text-xs font-normal text-sky-600">
                  dari {stats.total} Blanko
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* OpenSID Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAddNewLampiran}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Lampiran
            </Button>

            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={selectedIds.length === 0}
              onClick={handleBulkDelete}
              className="font-bold text-xs gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsGlobalSettingsOpen(true)}
              className="border-purple-200 bg-purple-50/70 text-purple-800 hover:bg-purple-100 font-bold text-xs gap-1.5"
            >
              <Settings className="h-3.5 w-3.5" />
              Pengaturan Margin & Kotak
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExportJson}
              className="border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Ekspor JSON
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSyncStandardOpenSid}
              className="border-sky-200 text-sky-700 hover:bg-sky-50 font-semibold text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sinkronkan Standar OpenSID
            </Button>
          </div>

          <Link href="/admin/surat/master">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs font-bold gap-1.5 border-slate-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Ke Daftar Surat (/admin/surat/master)
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="border-slate-200/80 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Blanko</p>
              <p className="text-2xl font-black text-slate-900">{stats.total}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
              <Paperclip className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-sky-200/60 bg-sky-50/20 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-sky-700">Formulir Dukcapil</p>
              <p className="text-2xl font-black text-sky-900">{stats.dukcapil}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200/60 bg-rose-50/20 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-rose-700">Model Nikah KUA</p>
              <p className="text-2xl font-black text-rose-900">{stats.kua}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/60 bg-amber-50/20 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-700">SPTJM & Pernyataan</p>
              <p className="text-2xl font-black text-amber-900">{stats.sptjm}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
              <FileSignature className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/60 bg-emerald-50/20 shadow-2xs col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700">Wajib Meterai</p>
              <p className="text-2xl font-black text-emerald-900">{stats.meterai}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Stamp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Table Card */}
      <Card className="border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/60 border-b pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari kode (F-1.01, N-1), nama lampiran, atau surat terkait..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-slate-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Jenis Filter (OpenSID: Lampiran Sistem / Lampiran Desa) */}
              <select
                value={selectedJenis}
                onChange={(e) => setSelectedJenis(e.target.value as 'all' | '1' | '2')}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700"
              >
                <option value="all">Semua Jenis Lampiran</option>
                <option value="1">Lampiran Sistem (OpenSID)</option>
                <option value="2">Lampiran Desa (Kustom)</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as 'all' | 'active' | 'inactive')
                }
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700"
              >
                <option value="all">Semua Status</option>
                <option value="active">Status: Aktif</option>
                <option value="inactive">Status: Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            {(
              [
                'Semua',
                'Kependudukan & Capil',
                'Pernikahan KUA',
                'SPTJM & Pernyataan',
                'Pertanahan',
                'Surat Dinas',
              ] as KategoriFilter[]
            ).map((kat) => (
              <Button
                key={kat}
                type="button"
                variant={selectedKategori === kat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedKategori(kat)}
                className={cn(
                  'text-xs h-7 rounded-lg transition-all',
                  selectedKategori === kat
                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                )}
              >
                {kat}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/90">
                <TableRow>
                  <TableHead className="w-10 text-center">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIds(filteredLampiran.map((i) => i.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="w-12 text-center font-bold text-slate-700">NO</TableHead>
                  <TableHead className="w-44 text-center font-bold text-slate-700">AKSI</TableHead>
                  <TableHead className="w-28 font-bold text-slate-700">KODE BLANKO</TableHead>
                  <TableHead className="min-w-[250px] font-bold text-slate-700">
                    NAMA LAMPIRAN & DESKRIPSI
                  </TableHead>
                  <TableHead className="w-44 font-bold text-slate-700">
                    KATEGORI & INSTANSI
                  </TableHead>
                  <TableHead className="w-44 font-bold text-slate-700">
                    SPESIFIKASI BLANKO
                  </TableHead>
                  <TableHead className="min-w-[200px] font-bold text-slate-700">
                    SURAT TERKAIT
                  </TableHead>
                  <TableHead className="w-24 text-center font-bold text-slate-700">
                    STATUS
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLampiran.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-40 text-center text-slate-500">
                      Tidak ditemukan lampiran surat yang sesuai dengan pencarian &quot;
                      {searchQuery}&quot;.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLampiran.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className={cn(
                        'transition-colors hover:bg-slate-50/70',
                        !item.isActive && 'opacity-60 bg-slate-50/40'
                      )}
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedIds((prev) => [...prev, item.id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== item.id));
                            }
                          }}
                        />
                      </TableCell>

                      <TableCell className="text-center font-mono text-xs text-slate-500">
                        {index + 1}
                      </TableCell>

                      {/* Kolom AKSI seperti /admin/surat/master */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Lampiran (Umum, Template, Form Isian)"
                            className="h-7 px-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white gap-1 shadow-2xs"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewItem(item)}
                            title="Pratinjau & Cetak Blanko"
                            className="h-7 w-7 p-0 border-sky-200 text-sky-700 hover:bg-sky-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicateLampiran(item)}
                            title="Salin menjadi Lampiran Desa"
                            className="h-7 w-7 p-0 border-slate-200 text-slate-700 hover:bg-slate-100"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleToggleActive(item.id, item.nama, item.isActive)
                            }
                            title={item.isActive ? 'Nonaktifkan Lampiran' : 'Aktifkan Lampiran'}
                            className={cn(
                              'h-7 w-7 p-0',
                              item.isActive
                                ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                            )}
                          >
                            {item.isActive ? (
                              <Unlock className="h-3.5 w-3.5" />
                            ) : (
                              <Lock className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteLampiran(item)}
                            title="Hapus Lampiran"
                            className="h-7 w-7 p-0 border-rose-200 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge
                            variant="outline"
                            className="font-mono font-bold text-xs bg-slate-100 text-slate-900 border-slate-300 px-2 py-0.5"
                          >
                            {item.kode}
                          </Badge>
                          <span className="text-[10px] font-mono text-slate-400">
                            /{item.slug || item.kode.toLowerCase()}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="font-bold text-slate-900 text-sm hover:text-sky-700 text-left transition-colors"
                            >
                              {item.nama}
                            </button>
                            {item.jenis === 2 && (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] px-1.5 py-0">
                                Lampiran Desa
                              </Badge>
                            )}
                            {item.useCustomTemplate && (
                              <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 text-[10px] px-1.5 py-0">
                                Template Kustom
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {item.deskripsi}
                          </p>
                          <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-slate-500">
                            <Scale className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>Regulasi: {item.dasarHukum}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1.5">
                          {getKategoriBadge(item.kategori)}
                          <div className="text-[11px] font-medium text-slate-600 pl-0.5">
                            Tujuan: <span className="font-semibold">{item.instansi}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Kertas:</span>
                            <span className="font-bold text-slate-800">
                              {item.formatLembar} ({item.orientasi || 'Potrait'})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Saksi:</span>
                            <span className="font-semibold text-slate-700">
                              {item.jumlahSaksi && item.jumlahSaksi > 0
                                ? `${item.jumlahSaksi} Orang Saksi`
                                : 'Tanpa Saksi'}
                            </span>
                          </div>
                          <div>
                            {item.perluMeterai ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                <Stamp className="h-3 w-3" /> Meterai {item.nominalMeterai}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Tanpa Meterai</span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.suratTerkait.map((surat, idx) => (
                            <span
                              key={idx}
                              className="inline-block text-[11px] bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded-md font-medium"
                            >
                              {surat}
                            </span>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={item.isActive}
                            onCheckedChange={() =>
                              handleToggleActive(item.id, item.nama, item.isActive)
                            }
                          />
                          <span
                            className={cn(
                              'text-[10px] font-bold uppercase',
                              item.isActive ? 'text-emerald-600' : 'text-slate-400'
                            )}
                          >
                            {item.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Pengaturan Global Lampiran (OpenSID pengaturan_lampiran: Margin & Kotak) */}
      <Dialog open={isGlobalSettingsOpen} onOpenChange={setIsGlobalSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-black uppercase">
              Pengaturan Global Lampiran Surat (OpenSID)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Konfigurasi default Margin Kertas Global dan Ukuran Kotak Karakter untuk blanko
              formulir kependudukan (F-Series).
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setGlobalSettingsTab('kertas')}
              className={cn(
                'flex-1 py-1.5 text-xs font-bold rounded-md transition-all',
                globalSettingsTab === 'kertas'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600'
              )}
            >
              Margin Kertas Global
            </button>
            <button
              type="button"
              onClick={() => setGlobalSettingsTab('kotak')}
              className={cn(
                'flex-1 py-1.5 text-xs font-bold rounded-md transition-all',
                globalSettingsTab === 'kotak'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600'
              )}
            >
              Kotak Karakter (F-Series)
            </button>
          </div>

          {globalSettingsTab === 'kertas' ? (
            <div className="grid grid-cols-2 gap-3 py-2">
              {(['kiri', 'atas', 'kanan', 'bawah'] as const).map((side) => (
                <div key={side} className="space-y-1">
                  <label className="text-xs font-bold capitalize text-slate-700">
                    Margin {side} (cm)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={globalMargin[side]}
                    onChange={(e) =>
                      setGlobalMargin({
                        ...globalMargin,
                        [side]: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="font-mono text-xs"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Jarak Antar Kotak (mm)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={globalKotak.jarak}
                  onChange={(e) =>
                    setGlobalKotak({
                      ...globalKotak,
                      jarak: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Lebar Kotak Karakter (mm)
                </label>
                <Input
                  type="number"
                  min="2"
                  max="20"
                  value={globalKotak.lebar}
                  onChange={(e) =>
                    setGlobalKotak({
                      ...globalKotak,
                      lebar: parseInt(e.target.value, 10) || 5,
                    })
                  }
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setGlobalMargin({ ...DEFAULT_LAMPIRAN_MARGIN });
                setGlobalKotak({ ...DEFAULT_LAMPIRAN_KOTAK });
              }}
            >
              Reset Standar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setIsGlobalSettingsOpen(false);
                toast({
                  title: 'Pengaturan Global Lampiran Disimpan',
                  description: `Margin (${globalMargin.kiri}, ${globalMargin.atas}, ${globalMargin.kanan}, ${globalMargin.bawah} cm) & Kotak (${globalKotak.jarak}/${globalKotak.lebar} mm) diperbarui.`,
                });
              }}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              Simpan Pengaturan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Pratinjau Blanko Lampiran */}
      <LampiranPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
}

