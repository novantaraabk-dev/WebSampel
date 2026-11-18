'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Printer,
  Trash2,
  Eye,
  Loader2,
  FileSignature,
  Download,
  Phone,
  Mail,
  FileDown,
  UserCheck,
  FileText,
  Hash,
  Check,
  QrCode,
  PenTool,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LetterSubmission, UploadedFile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import {
  getLetterRequestsQuery,
  updateSubmissionStatus,
  deleteSubmission,
} from '@/lib/submissions';
import { query as firestoreQuery, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  tarikNomorSuratOtomatis,
  simpanNomorSuratDanAgenda,
  GeneratedNomorSuratResult,
  BULAN_ROMAWI,
} from '@/lib/nomor-surat-otomatis';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useVillageIdentity } from '@/lib/village-identity';

// Helper to open Google Drive file download link
const openGoogleDriveDownloadLink = (fileId: string) => {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const getAttachmentBadge = (letterType: string) => {
  if (!letterType) return null;
  if (letterType.includes('Nikah')) return 'Model N-1..N-4';
  if (letterType.includes('Kelahiran')) return 'F-2.01 & SPTJM';
  if (letterType.includes('Kematian')) return 'F-2.01 & SPTJM';
  if (letterType.includes('Pindah')) return 'F-1.03 (SKPWNI)';
  if (letterType.includes('SPORADIK')) return 'Format BPN';
  if (letterType.includes('Kepemilikan Tanah')) return 'Letter C';
  if (letterType.includes('Jual Beli')) return 'Jual Beli';
  if (letterType.includes('Beda Nama')) return 'Lamp. Pernyataan';
  return null;
};

// Helper untuk memastikan format nomor surat: KODE KLASIFIKASI/no urut/bulan/tahun
// Contoh: 400.12.2.2/002/X/2026
export function formatDisplayNomorSurat(raw: string | undefined): string {
  if (!raw) return '-';
  const parts = raw.split('/');
  // Jika format lama terbalik (misal: 002/400.12.2.2/X/2026)
  if (parts.length === 4) {
    if (/^\d{1,4}$/.test(parts[0]) && parts[1].includes('.')) {
      return `${parts[1]}/${parts[0].padStart(3, '0')}/${parts[2]}/${parts[3]}`;
    }
  }
  return raw;
}

export function SubmissionList() {
  const [selectedSubmission, setSelectedSubmission] = useState<LetterSubmission | null>(null);

  // State untuk Tarik Nomor Surat Otomatis
  const [tarikNomorSubmission, setTarikNomorSubmission] = useState<LetterSubmission | null>(null);
  const [isLoadingTarik, setIsLoadingTarik] = useState<boolean>(false);
  const [isSubmittingTarik, setIsSubmittingTarik] = useState<boolean>(false);
  const [generatedNomorInfo, setGeneratedNomorInfo] = useState<GeneratedNomorSuratResult | null>(null);
  const [customKodeSurat, setCustomKodeSurat] = useState<string>('');
  const [customSeqNumber, setCustomSeqNumber] = useState<string>('');
  const [customBulanRomawi, setCustomBulanRomawi] = useState<string>('X');
  const [customTahun, setCustomTahun] = useState<string>('');

  // State for Signatory Choice & Signature Method (Manual vs QR)
  const [signatorySubmission, setSignatorySubmission] = useState<LetterSubmission | null>(null);
  const [selectedSigner, setSelectedSigner] = useState<'kades' | 'sekdes'>('kades');
  const [selectedSignatureMode, setSelectedSignatureMode] = useState<'manual' | 'qr'>('manual');
  const [selectedPrintPart, setSelectedPrintPart] = useState<'all' | 'pengantar' | 'lampiran'>('all');

  // State untuk Pencarian & Pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  const handleOpenSignatoryDialog = (submission: LetterSubmission) => {
    setSelectedSigner('kades');
    setSelectedSignatureMode('manual');
    setSelectedPrintPart('all');
    setTimeout(() => setSignatorySubmission(submission), 100);
  };

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const { identity } = useVillageIdentity();

  const isAdminFromStorage = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true';
  const isAdmin = isAdminFromStorage || !!(user && !user.isAnonymous);

  const query = useMemoFirebase(() => {
    if (!firestore || !user) return null;

    if (!isAdmin) {
      if (user.isAnonymous) return null;
      return firestoreQuery(
        getLetterRequestsQuery(firestore),
        where('requestorAuthUid', '==', (user as any).uid),
      );
    }

    return getLetterRequestsQuery(firestore);
  }, [firestore, user, isAdmin]);

  const { data: submissionsData, isLoading, refresh: refreshSubmissions } = useCollection<LetterSubmission>(query, { cacheTtl: 120000 });

  const submissions = useMemo(() => {
    if (!submissionsData) return [];
    return submissionsData
      .map((sub) => {
        let formData: Record<string, any> = {};
        if (sub.submissionData && typeof sub.submissionData === 'string') {
          try {
            formData = JSON.parse(sub.submissionData);
          } catch (e) {
            console.warn('Failed to parse legacy submissionData', e);
          }
        } else {
          formData = (sub.formData as Record<string, any>) || sub;
        }

        return {
          ...sub,
          formData,
          date: sub.createdAt?.toDate()?.toISOString() ?? new Date().toISOString(),
        };
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return timeB - timeA; // Descending (terbaru paling atas)
      });
  }, [submissionsData]);

  // Filter pencarian dan status
  const filteredSubmissions = useMemo(() => {
    let result = submissions;

    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    const term = searchTerm.trim().toLowerCase();
    if (!term) return result;

    return result.filter((s) => {
      const matchName = (s.requesterName || '').toLowerCase().includes(term);
      const matchNik = (s.nik || '').includes(term);
      const matchLetter = (s.letterType || '').toLowerCase().includes(term);
      const matchDocNo = (s.documentNumber || '').toLowerCase().includes(term);
      const matchTicket = (s.ticketNumber || '').toLowerCase().includes(term);
      const matchPurpose = String((s.formData as any)?.purpose || (s as any).purpose || '').toLowerCase().includes(term);
      return matchName || matchNik || matchLetter || matchDocNo || matchTicket || matchPurpose;
    });
  }, [submissions, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Potong list hanya 10 item per halaman
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredSubmissions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSubmissions, safeCurrentPage, ITEMS_PER_PAGE]);

  // Generator penomoran halaman yang ramah pengguna (1, 2, 3, 4, 5, dst)
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  }, [totalPages, safeCurrentPage]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleDownload = (file: UploadedFile) => {
    if (file.fileId.startsWith('local_') || file.fileId.startsWith('mock_gdrive_')) {
      toast({
        title: `Berkas Lampiran: ${file.fileName}`,
        description: 'Berkas tersimpan pada lampiran pengajuan warga.',
      });
      return;
    }
    openGoogleDriveDownloadLink(file.fileId);
  };

  const handleOpenTarikNomor = async (submission: LetterSubmission) => {
    setTarikNomorSubmission(submission);
    setIsLoadingTarik(true);
    try {
      const result = await tarikNomorSuratOtomatis(firestore, submission.letterType);
      setGeneratedNomorInfo(result);
      setCustomKodeSurat(result.kodeSurat);
      setCustomSeqNumber(result.nextSeqStr);
      setCustomBulanRomawi(result.bulanRomawi || BULAN_ROMAWI[new Date().getMonth()]);
      setCustomTahun(result.tahun);
    } catch (err: any) {
      console.error('Error tarik nomor:', err);
      toast({
        title: 'Gagal Menarik Nomor',
        description: err.message || 'Terjadi kesalahan saat menarik nomor surat otomatis.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTarik(false);
    }
  };

  const handleSaveTarikNomor = async () => {
    if (!tarikNomorSubmission || !firestore) return;

    const finalKode = (customKodeSurat || '400.12.2.2').trim();
    const seqInt = parseInt(customSeqNumber, 10);
    const finalSeq = isNaN(seqInt) ? '001' : String(seqInt).padStart(3, '0');
    const finalBulan = (customBulanRomawi || 'X').trim();
    const finalTahun = (customTahun || new Date().getFullYear().toString()).trim();

    // Format: KODE KLASIFIKASI/no urut/bulan/tahun (Contoh: 400.12.2.2/002/X/2026)
    const finalNumber = `${finalKode}/${finalSeq}/${finalBulan}/${finalTahun}`;

    setIsSubmittingTarik(true);
    try {
      await simpanNomorSuratDanAgenda(firestore, {
        submission: tarikNomorSubmission,
        finalNumber,
        userId: user?.uid,
      });
      refreshSubmissions();

      toast({
        title: 'Nomor Surat Berhasil Diterbitkan',
        description: `Nomor ${finalNumber} telah disimpan dan otomatis dicatat ke Buku Agenda Surat Keluar.`,
      });

      setTarikNomorSubmission(null);
    } catch (e: any) {
      console.error('Error simpan nomor:', e);
      toast({
        title: 'Gagal Menyimpan Nomor',
        description: e.message || 'Terjadi kesalahan saat menyimpan nomor surat.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingTarik(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    if (!firestore) return;
    try {
      await updateSubmissionStatus(firestore, id, status);
      refreshSubmissions();

      toast({
        title: `Status Diperbarui`,
        description: `Pengajuan telah ${status === 'approved' ? 'Disetujui' : 'Ditolak'}.`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const confirmPrint = () => {
    if (!signatorySubmission) return;
    const submissionId = signatorySubmission.id;
    setSignatorySubmission(null);
    const printUrl = `/print/preview?id=${encodeURIComponent(submissionId)}&signer=${encodeURIComponent(selectedSigner)}&ttd=${encodeURIComponent(selectedSignatureMode)}&part=${encodeURIComponent(selectedPrintPart)}&mode=opensid`;
    window.open(printUrl, '_blank');
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteSubmission(firestore, id);
      refreshSubmissions();
      toast({
        title: `Pengajuan Dihapus`,
        variant: 'destructive',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const formatLabel = (key: string) => {
    if (key === 'purpose') return 'Keperluan Pengajuan';
    const cleaned = key.replace(/^\[form_|\]$/gi, '').replace(/^form_/i, '').replace(/_/g, ' ');
    const result = cleaned.replace(/([A-Z])/g, ' $1').trim();
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  const formatValue = (value: any) => {
    if (value instanceof Date) {
      return value.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    }
    if (typeof value === 'object' && value !== null) {
      if ('toDate' in value && typeof value.toDate === 'function') {
        return value.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      }
      if ('seconds' in value && typeof value.seconds === 'number') {
        return new Date(value.seconds * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      }
      if ('name' in value) return value.name;
    }
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  };

  const statusVariant = {
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    processing: 'secondary',
  } as const;

  const statusText = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    processing: 'Memproses',
  };

  if (isLoading || !user) {
    return (
      <div className="p-4 sm:p-8 space-y-3 sm:space-y-4">
        <Skeleton className="h-10 sm:h-14 w-full rounded-xl sm:rounded-2xl" />
        <Skeleton className="h-10 sm:h-14 w-full rounded-xl sm:rounded-2xl" />
        <Skeleton className="h-10 sm:h-14 w-full rounded-xl sm:rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      {/* Search & Filter Toolbar */}
      <div className="p-3.5 sm:p-5 border-b border-black/[0.06] bg-slate-50/80 dark:bg-slate-900/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari nama pemohon, NIK, jenis surat, nomor surat..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9 h-9 sm:h-10 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xs focus-visible:ring-1"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
              title="Hapus pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="h-8 sm:h-9 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-0.5 text-slate-700 dark:text-slate-200 shadow-xs focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

          <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2.5 py-1 rounded-xl shadow-xs">
            Total: <strong>{filteredSubmissions.length}</strong> Data
          </span>
        </div>
      </div>

      {/* Tampilan Mobile: Kartu Responsif Penuh 1 Layar */}
      <div className="block sm:hidden p-3 space-y-3">
        {filteredSubmissions.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center text-slate-400 font-medium text-xs p-4 neu-inset rounded-2xl border border-white/60 gap-2">
            <p className="italic">
              {searchTerm || statusFilter !== 'all'
                ? 'Tidak ada pengajuan yang sesuai kriteria pencarian.'
                : 'Belum ada pengajuan yang masuk.'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className="h-7 text-[10px] font-bold rounded-lg"
              >
                Reset Pencarian
              </Button>
            )}
          </div>
        ) : (
          paginatedSubmissions.map((submission) => (
            <div key={submission.id} className="p-3.5 space-y-2.5 neu-dashboard-card rounded-2xl border border-white/80">
              {/* Baris 1: Nama Pemohon & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-black text-xs uppercase text-slate-800 leading-tight truncate">
                    {submission.requesterName}
                  </h4>
                  <div className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">
                    NIK: {submission.nik}
                  </div>
                </div>
                <Badge
                  variant={statusVariant[submission.status]}
                  className="neu-pill-elevated text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                >
                  {submission.status === 'processing' && <Loader2 className="mr-1 h-2 w-2 animate-spin" />}
                  {statusText[submission.status]}
                </Badge>
              </div>

              {/* Baris 2: Jenis Surat & Tanggal */}
              <div className="flex flex-col gap-1 text-[10px]">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded font-bold uppercase text-[9px] truncate max-w-[200px]">
                    <FileText className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{submission.letterType}</span>
                  </div>
                  <span className="text-slate-400 font-medium text-[10px] shrink-0">
                    {new Date(submission.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {getAttachmentBadge(submission.letterType) && (
                  <div className="flex items-center">
                    <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 border border-purple-200">
                      + Lampiran {getAttachmentBadge(submission.letterType)}
                    </span>
                  </div>
                )}
              </div>

              {/* Baris 3: Nomor Surat & Tombol Opsi */}
              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
                <div className="min-w-0 flex-1">
                  {submission.documentNumber ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">No:</span>
                      <span className="font-mono text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 truncate inline-block max-w-[130px]">
                        {formatDisplayNomorSurat(submission.documentNumber)}
                      </span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenTarikNomor(submission)}
                      disabled={submission.status !== 'approved'}
                      className="h-6 px-2 text-[8px] font-black uppercase tracking-wider rounded-md border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1 shrink-0"
                      title="Tarik Nomor Surat Otomatis"
                    >
                      <Hash className="mr-0.5 h-2.5 w-2.5 text-emerald-600" />
                      <span>Tarik Nomor</span>
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTimeout(() => setSelectedSubmission(submission), 100);
                    }}
                    className="h-7 px-2 text-[10px] font-bold text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Detail</span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-slate-200 hover:bg-slate-100">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl p-2 font-sans text-xs w-48">
                      <DropdownMenuLabel className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Opsi Pengelolaan</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setTimeout(() => setSelectedSubmission(submission), 100);
                        }}
                        className="rounded-lg font-bold cursor-pointer text-xs"
                      >
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        <span>Lihat Detail</span>
                      </DropdownMenuItem>

                      {submission.status === 'approved' && (
                        <DropdownMenuItem
                          onClick={() => handleOpenTarikNomor(submission)}
                          className="rounded-lg font-bold cursor-pointer text-emerald-700 dark:text-emerald-400 focus:bg-emerald-50 text-xs"
                        >
                          <Hash className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                          <span>{submission.documentNumber ? 'Tarik Ulang Nomor' : 'Tarik Nomor Otomatis'}</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator className="opacity-50" />
                      <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'approved')} className="rounded-lg font-bold cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 text-xs">
                        <CheckCircle className="mr-2 h-3.5 w-3.5" />
                        <span>Setujui</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'rejected')} className="rounded-lg font-bold cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 text-xs">
                        <XCircle className="mr-2 h-3.5 w-3.5" />
                        <span>Tolak</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => handleOpenSignatoryDialog(submission)}
                        disabled={submission.status !== 'approved' || !submission.documentNumber}
                        className="rounded-lg font-bold cursor-pointer text-xs"
                      >
                        <Printer className="mr-2 h-3.5 w-3.5" />
                        <span>Cetak Dokumen</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => handleOpenSignatoryDialog(submission)}
                        disabled={submission.status !== 'approved' || !submission.documentNumber}
                        className="rounded-lg font-bold cursor-pointer text-xs"
                      >
                        <FileDown className="mr-2 h-3.5 w-3.5" />
                        <span>Unduh PDF</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="opacity-50" />
                      <DropdownMenuItem onClick={() => handleDelete(submission.id)} className="rounded-lg font-bold cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50 text-xs">
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        <span>Hapus Permanen</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tampilan Desktop / Tablet: Tabel Lengkap */}
      <div className="hidden sm:block overflow-x-auto w-full">
        <Table className="w-full min-w-[640px]">
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="pl-3.5 sm:pl-8 h-10 sm:h-14 font-black uppercase text-[9px] sm:text-[10px] tracking-wider text-slate-400">Pemohon</TableHead>
              <TableHead className="hidden sm:table-cell h-10 sm:h-14 font-black uppercase text-[9px] sm:text-[10px] tracking-wider text-slate-400">Jenis Surat</TableHead>
              <TableHead className="h-10 sm:h-14 font-black uppercase text-[9px] sm:text-[10px] tracking-wider text-slate-400">Nomor Surat</TableHead>
              <TableHead className="hidden md:table-cell h-10 sm:h-14 font-black uppercase text-[9px] sm:text-[10px] tracking-wider text-slate-400">Tanggal</TableHead>
              <TableHead className="text-center h-10 sm:h-14 font-black uppercase text-[9px] sm:text-[10px] tracking-wider text-slate-400">Status</TableHead>
              <TableHead className="text-right pr-3.5 sm:pr-8 h-10 sm:h-14 font-black uppercase text-[9px] sm:text-[10px] tracking-wider text-slate-400">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-slate-400 font-medium text-xs sm:text-sm">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="italic">
                      {searchTerm || statusFilter !== 'all'
                        ? 'Tidak ada pengajuan yang cocok dengan kriteria pencarian.'
                        : 'Belum ada pengajuan yang masuk.'}
                    </p>
                    {(searchTerm || statusFilter !== 'all') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setCurrentPage(1);
                        }}
                        className="h-8 text-xs font-bold rounded-xl"
                      >
                        Reset Pencarian
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedSubmissions.map((submission) => (
                <TableRow key={submission.id} className="hover:bg-slate-50/80 transition-colors group">
                  <TableCell className="pl-3.5 sm:pl-8 py-2.5 sm:py-5">
                    <div className="font-black text-xs sm:text-sm uppercase text-slate-700 leading-tight truncate max-w-[120px] sm:max-w-none">{submission.requesterName}</div>
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold font-mono tracking-tighter">{submission.nik}</span>
                      <span className="sm:hidden text-[8px] font-black uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded leading-none">{submission.letterType}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-700 uppercase">{submission.letterType}</span>
                      {getAttachmentBadge(submission.letterType) && (
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/80 w-fit">
                          + Lampiran {getAttachmentBadge(submission.letterType)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 sm:py-5">
                    {submission.documentNumber ? (
                      <span className="font-mono text-[9px] sm:text-[11px] font-black text-primary bg-primary/5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg border border-primary/10 truncate inline-block max-w-[130px] sm:max-w-none" title={formatDisplayNomorSurat(submission.documentNumber)}>
                        {formatDisplayNomorSurat(submission.documentNumber)}
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenTarikNomor(submission)}
                        disabled={submission.status !== 'approved'}
                        className="h-7 sm:h-8 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 whitespace-nowrap gap-1.5"
                        title="Tarik Nomor Surat Otomatis"
                      >
                        <Hash className="mr-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600 shrink-0" />
                        <span>Tarik Nomor Otomatis</span>
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-[10px] font-bold text-slate-400 uppercase">
                    {new Date(submission.date).toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell className="text-center py-2.5 sm:py-5">
                    <Badge variant={statusVariant[submission.status]} className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider sm:tracking-widest px-2 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                      {submission.status === 'processing' && <Loader2 className="mr-1 sm:mr-1.5 h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" />}
                      {statusText[submission.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-3.5 sm:pr-8 py-2.5 sm:py-5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl hover:bg-slate-200">
                          <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl p-2 font-sans text-xs">
                        <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Opsi Pengelolaan</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setTimeout(() => setSelectedSubmission(submission), 100);
                          }}
                          className="rounded-xl font-bold cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Lihat Detail</span>
                        </DropdownMenuItem>

                        {submission.status === 'approved' && (
                          <DropdownMenuItem
                            onClick={() => handleOpenTarikNomor(submission)}
                            className="rounded-xl font-bold cursor-pointer text-emerald-700 dark:text-emerald-400 focus:bg-emerald-50"
                          >
                            <Hash className="mr-2 h-4 w-4 text-emerald-600" />
                            <span>{submission.documentNumber ? 'Tarik Ulang Nomor' : 'Tarik Nomor Otomatis'}</span>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className="opacity-50" />
                        <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'approved')} className="rounded-xl font-bold cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          <span>Setujui</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'rejected')} className="rounded-xl font-bold cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                          <XCircle className="mr-2 h-4 w-4" />
                          <span>Tolak</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleOpenSignatoryDialog(submission)}
                          disabled={submission.status !== 'approved' || !submission.documentNumber}
                          className="rounded-xl font-bold cursor-pointer"
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          <span>Cetak Dokumen</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleOpenSignatoryDialog(submission)}
                          disabled={submission.status !== 'approved' || !submission.documentNumber}
                          className="rounded-xl font-bold cursor-pointer"
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          <span>Unduh PDF</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="opacity-50" />
                        <DropdownMenuItem onClick={() => handleDelete(submission.id)} className="rounded-xl font-bold cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Hapus Permanen</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Tampilan Pagination di Bawah Sendiri */}
      {filteredSubmissions.length > 0 && (
        <div className="p-3.5 sm:px-6 sm:py-4 border-t border-black/[0.06] bg-slate-50/70 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
            Menampilkan{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{' '}
            -{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredSubmissions.length)}
            </span>{' '}
            dari{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {filteredSubmissions.length}
            </span>{' '}
            pengajuan masuk
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
            {/* Tombol Sebelumnya */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="h-8 px-2 sm:px-3 text-xs font-bold rounded-lg border-slate-200 dark:border-slate-800 disabled:opacity-40 gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </Button>

            {/* Tombol Nomor Halaman: 1, 2, 3, 4, 5, dst */}
            {pageNumbers.map((page, idx) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-xs font-bold text-slate-400 select-none"
                  >
                    ...
                  </span>
                );
              }
              const pageNum = Number(page);
              const isActive = pageNum === safeCurrentPage;
              return (
                <Button
                  key={`page-${pageNum}`}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-8 min-w-[32px] px-2 text-xs font-black rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-xs pointer-events-none'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}

            {/* Tombol Selanjutnya */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="h-8 px-2 sm:px-3 text-xs font-bold rounded-lg border-slate-200 dark:border-slate-800 disabled:opacity-40 gap-1"
            >
              <span className="hidden sm:inline">Selanjutnya</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedSubmission}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) {
            setSelectedSubmission(null);
            if (typeof document !== 'undefined') {
              document.body.style.pointerEvents = 'auto';
            }
          }
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-2xl rounded-2xl sm:rounded-[28px] p-0 overflow-hidden neu-card-elevated bg-[#ECE8E1] border border-white/80 shadow-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="bg-gradient-to-r from-[#0d1520] via-[#101b28] to-[#0a111a] p-4 sm:p-7 md:p-8 text-white shrink-0 border-b border-white/10">
            <DialogTitle className="text-base sm:text-2xl font-black uppercase tracking-tight leading-tight">Detail Pengajuan: {selectedSubmission?.letterType}</DialogTitle>
            <DialogDescription className="text-white/60 text-[10px] sm:text-xs font-medium">ID: {selectedSubmission?.id}</DialogDescription>
          </DialogHeader>

          <div className="p-4 sm:p-8 space-y-5 sm:space-y-8 overflow-y-auto flex-1">
            {selectedSubmission && (
              <>
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl neu-inset border border-white/60 flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-2.5 neu-convex rounded-xl text-emerald-800"><Phone className="h-4 w-4 sm:h-5 sm:w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-[10px] text-emerald-800 font-black uppercase tracking-widest">WhatsApp</p>
                      <p className="text-xs sm:text-sm font-black truncate text-slate-800">{selectedSubmission.phoneNumber || 'Tidak ada'}</p>
                    </div>
                  </div>
                  <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl neu-inset border border-white/60 flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-2.5 neu-convex rounded-xl text-teal-800"><Mail className="h-4 w-4 sm:h-5 sm:w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-[10px] text-teal-800 font-black uppercase tracking-widest">Email</p>
                      <p className="text-xs sm:text-sm font-black truncate text-slate-800">{selectedSubmission.email || 'Tidak ada'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 border-l-4 border-emerald-600 pl-2.5 sm:pl-3">Data Formulir Warga</h4>
                  <div className="rounded-xl sm:rounded-2xl neu-inset border border-white/60 overflow-hidden">
                    <Table>
                      <TableBody>
                        {Object.entries(selectedSubmission.formData).map(([key, value]) => {
                          if (
                            [
                              'id',
                              'status',
                              'createdAt',
                              'updatedAt',
                              'formData',
                              'fileLinks',
                              'letterType',
                              'requestorAuthUid',
                              'ticketNumber',
                              'nik',
                              'requesterName',
                              'documentNumber',
                              'openSidRenderedPages',
                              'openSidHeaderHtml',
                              'openSidFooterHtml',
                              'openSidCustomKonsepHtml',
                              'openSidMargin',
                              'openSidPelakuBagian',
                              'openSidUkuran',
                              'openSidOrientasi',
                              'openSidHeaderMode',
                              'openSidShowFooter',
                              'masterSuratId',
                              'urlSurat',
                              'date',
                            ].includes(key)
                          )
                            return null;
                          return (
                            <TableRow key={key} className="hover:bg-transparent">
                              <TableCell className="font-black uppercase text-[8px] sm:text-[9px] tracking-widest text-slate-400 bg-slate-50/50 w-1/3 p-2.5 sm:p-4">{formatLabel(key)}</TableCell>
                              <TableCell className="text-xs font-bold text-slate-700 py-2.5 sm:py-4 px-3 sm:px-4">{formatValue(value)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {selectedSubmission.fileLinks && selectedSubmission.fileLinks.length > 0 && (
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 border-l-4 border-primary pl-2.5 sm:pl-3">Berkas Lampiran (Google Drive)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      {selectedSubmission.fileLinks.map((file) => (
                        <Button key={file.fileId} variant="outline" className="justify-between h-auto py-3 sm:py-4 px-3.5 sm:px-6 rounded-xl sm:rounded-2xl border-slate-100 bg-slate-50/30 hover:bg-primary hover:text-white transition-all group" onClick={() => handleDownload(file)}>
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 group-hover:text-white shrink-0" />
                            <span className="font-bold text-[9px] sm:text-[10px] uppercase tracking-widest truncate">{formatLabel(file.fieldName)}</span>
                          </div>
                          <FileSignature className="h-3 w-3 opacity-20 shrink-0" />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="p-3.5 sm:p-6 bg-slate-50 border-t shrink-0">
            <Button className="w-full h-10 sm:h-12 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm" onClick={() => { setSelectedSubmission(null); if (typeof document !== 'undefined') document.body.style.pointerEvents = 'auto'; }}>Tutup Jendela</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tarik Nomor Otomatis Dialog */}
      <Dialog
        open={!!tarikNomorSubmission}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) {
            setTarikNomorSubmission(null);
            if (typeof document !== 'undefined') document.body.style.pointerEvents = 'auto';
          }
        }}
      >
        <DialogContent className="w-[94vw] sm:max-w-[480px] rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 border border-stone-200 dark:border-white/10 shadow-2xl bg-[#FAF8F5] dark:bg-stone-900">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <Hash className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Tarik Nomor Surat Otomatis
                </DialogTitle>
                <DialogDescription className="font-medium text-[11px] text-slate-500 dark:text-slate-400">
                  Format: KODE KLASIFIKASI / no urut / bulan / tahun (Contoh: 400.12.2.2/002/X/2026)
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isLoadingTarik ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <span className="text-xs font-bold">Menarik data klasifikasi & buku agenda...</span>
            </div>
          ) : (
            <div className="space-y-4 my-2 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-200/50 dark:bg-stone-800/50 border border-stone-300/50 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Jenis Surat:</span>
                  <span className="font-bold text-slate-900 dark:text-white bg-white/80 dark:bg-stone-900 px-2 py-0.5 rounded border border-stone-300/40">
                    {tarikNomorSubmission?.letterType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Pemohon:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {tarikNomorSubmission?.requesterName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Nomor Terakhir di Agenda:</span>
                  <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                    {generatedNomorInfo?.lastNomor || 'Belum ada data (Mulai 001)'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl neu-inset bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Pratinjau Nomor Resmi yang Diterbitkan:
                </p>
                <div className="font-mono text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-wide bg-white/95 dark:bg-stone-950 px-3 py-2 rounded-xl border border-emerald-500/30 shadow-inner break-all select-all">
                  {`${customKodeSurat || '400.12.2.2'}/${String(parseInt(customSeqNumber, 10) || 1).padStart(3, '0')}/${customBulanRomawi || 'X'}/${customTahun || new Date().getFullYear()}`}
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                      Kode Klasifikasi
                    </Label>
                    <Input
                      value={customKodeSurat}
                      onChange={(e) => setCustomKodeSurat(e.target.value)}
                      placeholder="400.12.2.2"
                      className="h-9 text-xs font-mono font-bold rounded-xl neu-card-elevated"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                      Nomor Urut Surat
                    </Label>
                    <Input
                      type="number"
                      value={customSeqNumber}
                      onChange={(e) => setCustomSeqNumber(e.target.value)}
                      placeholder="002"
                      className="h-9 text-xs font-mono font-bold rounded-xl neu-card-elevated"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                      Bulan (Romawi)
                    </Label>
                    <Input
                      value={customBulanRomawi}
                      onChange={(e) => setCustomBulanRomawi(e.target.value.toUpperCase())}
                      placeholder="X"
                      className="h-9 text-xs font-mono font-bold rounded-xl neu-card-elevated uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                      Tahun
                    </Label>
                    <Input
                      value={customTahun}
                      onChange={(e) => setCustomTahun(e.target.value)}
                      placeholder="2026"
                      className="h-9 text-xs font-mono font-bold rounded-xl neu-card-elevated"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 italic">
                * Nomor ini akan otomatis tersimpan di permohonan surat dan dicatat ke <strong>Buku Agenda Surat Keluar</strong> (menu Register Nomor Surat).
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmittingTarik || isLoadingTarik}
              onClick={() => {
                setTarikNomorSubmission(null);
                if (typeof document !== 'undefined') document.body.style.pointerEvents = 'auto';
              }}
              className="neu-card-elevated rounded-xl text-xs h-10 px-4"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveTarikNomor}
              disabled={isSubmittingTarik || isLoadingTarik || !customKodeSurat || !customSeqNumber}
              className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-10 px-5 gap-1.5 shadow-md border border-white/10"
            >
              {isSubmittingTarik ? (
                <>
                  <Loader2 className="animate-spin h-3.5 w-3.5" />
                  <span>Menyimpan & Mencatat...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Tarik & Catat Surat Keluar</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signatory & Signature Method (QR vs Manual) Choice Dialog */}
      <Dialog
        open={!!signatorySubmission}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) {
            setSignatorySubmission(null);
            if (typeof document !== 'undefined') document.body.style.pointerEvents = 'auto';
          }
        }}
      >
        <DialogContent className="w-[92vw] sm:max-w-[480px] rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 border-none shadow-2xl">
          <DialogHeader className="space-y-2 sm:space-y-3">
            <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-black uppercase tracking-tight italic">
              <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
              Pilih Penandatangan
            </DialogTitle>
            <DialogDescription className="font-medium text-xs sm:text-sm">
              Tentukan pejabat penandatangan serta metode penandatanganan (QR Code atau Manual).
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 sm:py-6 space-y-5">
            <div className="space-y-2.5">
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500">
                1. Pilih Pejabat Penandatangan
              </p>
              <RadioGroup
                value={selectedSigner}
                onValueChange={(v: string) => setSelectedSigner(v as 'kades' | 'sekdes')}
                className="grid gap-2.5 sm:gap-3"
              >
                <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-100 cursor-pointer hover:bg-slate-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                  <RadioGroupItem value="kades" id="signer-kades" />
                  <Label htmlFor="signer-kades" className="flex-1 cursor-pointer space-y-0.5">
                    <p className="font-black uppercase tracking-tight text-slate-800 text-xs sm:text-sm">
                      Kepala {identity.sebutanDesa}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {identity.namaKepalaDesa}
                    </p>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-100 cursor-pointer hover:bg-slate-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                  <RadioGroupItem value="sekdes" id="signer-sekdes" />
                  <Label htmlFor="signer-sekdes" className="flex-1 cursor-pointer space-y-0.5">
                    <p className="font-black uppercase tracking-tight text-slate-800 text-xs sm:text-sm">
                      Sekretaris {identity.sebutanDesa}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {identity.namaSekretarisDesa}
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500">
                2. Pilih Metode Penandatanganan
              </p>
              <RadioGroup
                value={selectedSignatureMode}
                onValueChange={(v: string) => setSelectedSignatureMode(v as 'manual' | 'qr')}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3"
              >
                {/* 1. Pilihan Pertama: Penandatanganan Manual (Basah & Stempel Tanpa QR) */}
                <div className="flex items-center space-x-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-200 cursor-pointer hover:bg-slate-50 has-[:checked]:border-slate-900 has-[:checked]:bg-slate-100/80 transition-all">
                  <RadioGroupItem value="manual" id="ttd-mode-manual" />
                  <Label htmlFor="ttd-mode-manual" className="flex-1 cursor-pointer space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <PenTool className="h-3.5 w-3.5 text-slate-800 shrink-0" />
                      <p className="font-black uppercase tracking-tight text-slate-900 text-xs">
                        Penandatanganan Manual
                      </p>
                    </div>
                    <p className="text-[9px] text-slate-500 font-semibold leading-tight">
                      Tanda tangan basah & stempel (Tanpa QR)
                    </p>
                  </Label>
                </div>

                {/* 2. Pilihan Kedua: Penandatanganan QR */}
                <div className="flex items-center space-x-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-200 cursor-pointer hover:bg-emerald-50/40 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50/60 transition-all">
                  <RadioGroupItem value="qr" id="ttd-mode-qr" />
                  <Label htmlFor="ttd-mode-qr" className="flex-1 cursor-pointer space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <QrCode className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <p className="font-black uppercase tracking-tight text-slate-900 text-xs">
                        Penandatanganan QR
                      </p>
                    </div>
                    <p className="text-[9px] text-slate-500 font-semibold leading-tight">
                      Sematkan QR Code verifikasi dokumen
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 3. Pilihan Bagian Dokumen (Jika Memiliki Lampiran) */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500">
                  3. Bagian Dokumen yang Dicetak
                </p>
                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Opsional
                </span>
              </div>
              <RadioGroup
                value={selectedPrintPart}
                onValueChange={(v: string) => setSelectedPrintPart(v as 'all' | 'pengantar' | 'lampiran')}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
              >
                <div className="flex items-center space-x-2.5 p-2.5 sm:p-3 rounded-xl border-2 border-slate-200 cursor-pointer hover:bg-slate-50 has-[:checked]:border-slate-900 has-[:checked]:bg-slate-100/80 transition-all">
                  <RadioGroupItem value="all" id="part-all" />
                  <Label htmlFor="part-all" className="cursor-pointer space-y-0.5">
                    <p className="font-bold text-slate-900 text-xs">Cetak Lengkap</p>
                    <p className="text-[9px] text-slate-500">Semua Lembar</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2.5 p-2.5 sm:p-3 rounded-xl border-2 border-slate-200 cursor-pointer hover:bg-slate-50 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50/60 transition-all">
                  <RadioGroupItem value="pengantar" id="part-pengantar" />
                  <Label htmlFor="part-pengantar" className="cursor-pointer space-y-0.5">
                    <p className="font-bold text-slate-900 text-xs">Pengantar Saja</p>
                    <p className="text-[9px] text-slate-500">Surat Pengantar</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2.5 p-2.5 sm:p-3 rounded-xl border-2 border-slate-200 cursor-pointer hover:bg-slate-50 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50/60 transition-all">
                  <RadioGroupItem value="lampiran" id="part-lampiran" />
                  <Label htmlFor="part-lampiran" className="cursor-pointer space-y-0.5">
                    <p className="font-bold text-slate-900 text-xs">Lampiran Saja</p>
                    <p className="text-[9px] text-slate-500">Formulir Lampiran</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="flex-1 h-10 sm:h-12 rounded-xl font-bold text-xs sm:text-sm"
              onClick={() => {
                setSignatorySubmission(null);
                if (typeof document !== 'undefined') document.body.style.pointerEvents = 'auto';
              }}
            >
              BATAL
            </Button>
            <Button
              onClick={confirmPrint}
              className="flex-1 h-10 sm:h-12 rounded-xl font-black uppercase tracking-widest text-xs sm:text-sm shadow-lg shadow-primary/20"
            >
              LANJUTKAN CETAK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
