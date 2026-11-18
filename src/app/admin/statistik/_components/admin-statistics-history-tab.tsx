'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc, deleteDoc, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { StatisticsHistoryItem, VillageStatisticsData } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  History,
  RotateCcw,
  Eye,
  Trash2,
  Search,
  Filter,
  Clock,
  User,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  FileText,
  RefreshCw,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminStatisticsHistoryTab() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTabFilter, setSelectedTabFilter] = useState('all');
  const [selectedItemForView, setSelectedItemForView] = useState<StatisticsHistoryItem | null>(null);
  const [selectedItemForRestore, setSelectedItemForRestore] = useState<StatisticsHistoryItem | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Firestore query for history entries
  const historyQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'statisticsHistory'), orderBy('timestamp', 'desc'), limit(50));
  }, [firestore, refreshKey]);

  const { data: historyItems, isLoading } = useCollection<StatisticsHistoryItem>(historyQuery, { realtime: true });

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!historyItems) return [];
    return historyItems.filter((item) => {
      const matchTab = selectedTabFilter === 'all' || item.tab === selectedTabFilter;
      const lower = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        (item.action || '').toLowerCase().includes(lower) ||
        (item.summary || '').toLowerCase().includes(lower) ||
        (item.tab || '').toLowerCase().includes(lower) ||
        (item.author || '').toLowerCase().includes(lower);
      return matchTab && matchSearch;
    });
  }, [historyItems, selectedTabFilter, searchQuery]);

  // Format timestamp helper
  const formatTime = (ts: any) => {
    if (!ts) return 'Waktu tidak tercatat';
    if (ts.toDate && typeof ts.toDate === 'function') {
      return ts.toDate().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
    if (ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
    try {
      return new Date(ts).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return String(ts);
    }
  };

  // Handle Restore Version
  const handleRestore = async () => {
    if (!firestore || !selectedItemForRestore) return;
    setIsRestoring(true);
    try {
      const snapshot = selectedItemForRestore.snapshotData as Partial<VillageStatisticsData>;
      if (!snapshot || typeof snapshot !== 'object') {
        throw new Error('Data snapshot tidak valid untuk dipulihkan');
      }

      // 1. Simpan snapshot data ke dokumen aktif 'villageProfile/statistics'
      const statsDocRef = doc(firestore, 'villageProfile', 'statistics');
      await setDoc(statsDocRef, {
        ...snapshot,
        updatedAt: serverTimestamp(),
      });

      // 2. Sinkronkan juga ringkasan pokok ke 'villageProfile/default' jika tersedia
      if (snapshot.sidebarInfo || snapshot.total) {
        const profileDefaultRef = doc(firestore, 'villageProfile', 'default');
        const syncProfile: Record<string, any> = {};
        if (snapshot.total) syncProfile.totalPenduduk = snapshot.total;
        if (snapshot.density) syncProfile.kepadatanPenduduk = snapshot.density;
        if (snapshot.sexRatio) syncProfile.rasioJenisKelamin = snapshot.sexRatio;
        if (snapshot.sidebarInfo?.luasWilayah) syncProfile.luasWilayah = snapshot.sidebarInfo.luasWilayah;
        if (snapshot.sidebarInfo?.totalPenduduk) syncProfile.totalPenduduk = snapshot.sidebarInfo.totalPenduduk;
        if (snapshot.sidebarInfo?.kepadatan) syncProfile.kepadatanPenduduk = snapshot.sidebarInfo.kepadatan;
        if (snapshot.sidebarInfo?.rasioJenisKelamin) syncProfile.rasioJenisKelamin = snapshot.sidebarInfo.rasioJenisKelamin;
        if (snapshot.sidebarInfo?.jarakKecamatan) syncProfile.jarakKecamatan = snapshot.sidebarInfo.jarakKecamatan;
        if (snapshot.sidebarInfo?.jarakKabupaten) syncProfile.jarakKabupaten = snapshot.sidebarInfo.jarakKabupaten;

        if (Object.keys(syncProfile).length > 0) {
          await setDoc(profileDefaultRef, { ...syncProfile, updatedAt: serverTimestamp() }, { merge: true });
        }
      }

      // 3. Catat aksi restore sebagai entri baru di 'statisticsHistory'
      await addDoc(collection(firestore, 'statisticsHistory'), {
        tab: 'Pemulihan Versi',
        action: `Pulihkan Versi: ${selectedItemForRestore.tab}`,
        summary: `Mengembalikan seluruh konfigurasi statistik ke versi tanggal ${formatTime(selectedItemForRestore.timestamp)} (${selectedItemForRestore.action})`,
        author: 'Administrator Desa',
        timestamp: serverTimestamp(),
        snapshotData: snapshot,
      });

      toast({
        title: 'Versi Berhasil Dipulihkan!',
        description: `Tampilan /statistik sekarang menggunakan data dari ${formatTime(selectedItemForRestore.timestamp)}.`,
      });

      setSelectedItemForRestore(null);
    } catch (err: any) {
      console.error('Error restoring history version:', err);
      toast({
        title: 'Gagal Memulihkan Versi',
        description: err?.message || 'Terjadi kesalahan saat memulihkan snapshot.',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Delete History Item
  const handleDeleteHistory = async (id: string) => {
    if (!firestore || !id) return;
    if (!confirm('Hapus catatan histori ini secara permanen?')) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, 'statisticsHistory', id));
      toast({
        title: 'Catatan Histori Dihapus',
        description: 'Entri riwayat telah dihapus dari log database.',
      });
    } catch (err: any) {
      toast({
        title: 'Gagal Menghapus',
        description: err?.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Informasi Histori */}
      <div className="p-5 sm:p-6 neu-card-elevated rounded-[28px] border border-white/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Audit Trail & Riwayat Isian Statistik
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <History className="h-6 w-6 text-emerald-700 dark:text-[#d4e157]" />
            Riwayat Perubahan Statistik Desa
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Setiap kali admin memperbarui data (Kependudukan, Pendidikan, Kesehatan, Sosial, Ekonomi, Pembangunan, SDGs, atau Indeks), sistem otomatis menyimpan snapshot data lengkap. Anda dapat meninjau isian sebelumnya dan memulihkannya kapan saja.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefreshKey((prev) => prev + 1);
              toast({ title: 'Memuat Ulang Histori', description: 'Daftar riwayat diperbarui.' });
            }}
            className="neu-card-elevated rounded-xl h-10 px-4 text-xs font-bold gap-2 text-slate-800 dark:text-slate-200 border border-stone-300 dark:border-white/10"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari berdasarkan aksi, ringkasan, atau modul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 neu-inset rounded-2xl border border-stone-300/40 text-xs"
          />
        </div>

        <div className="sm:col-span-4">
          <Select value={selectedTabFilter} onValueChange={setSelectedTabFilter}>
            <SelectTrigger className="h-11 neu-card-elevated rounded-2xl border border-white/60 text-xs font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-emerald-700" />
                <SelectValue placeholder="Pilih Modul Tab" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-white/60">
              <SelectItem value="all">Semua Modul Statistik</SelectItem>
              <SelectItem value="Kependudukan">Kependudukan</SelectItem>
              <SelectItem value="Pendidikan">Pendidikan</SelectItem>
              <SelectItem value="Kesehatan">Kesehatan</SelectItem>
              <SelectItem value="Sosial & DTSEN">Sosial & DTSEN</SelectItem>
              <SelectItem value="Ekonomi">Ekonomi</SelectItem>
              <SelectItem value="Pembangunan">Pembangunan</SelectItem>
              <SelectItem value="SDGs Desa">SDGs Desa</SelectItem>
              <SelectItem value="Indeks Desa">Indeks Desa</SelectItem>
              <SelectItem value="Pemulihan Versi">Pemulihan Versi (Restore)</SelectItem>
              <SelectItem value="Inisialisasi Data Default">Inisialisasi Default</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* History Items List */}
      {isLoading ? (
        <div className="p-12 text-center neu-card-elevated rounded-[28px] border border-white/60 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-700" />
          <p className="text-xs text-slate-600 dark:text-slate-400">Memuat catatan riwayat statistik...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center neu-card-elevated rounded-[28px] border border-white/60 space-y-3">
          <div className="w-12 h-12 rounded-2xl neu-inset mx-auto flex items-center justify-center text-slate-400">
            <History className="h-6 w-6" />
          </div>
          <h4 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-base">
            Belum Ada Riwayat Perubahan
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {searchQuery || selectedTabFilter !== 'all'
              ? 'Tidak ditemukan riwayat yang sesuai kriteria pencarian atau filter.'
              : 'Setiap kali Anda menekan Simpan di salah satu tab statistik, catatan versi akan muncul di sini secara otomatis.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item, index) => (
            <div
              key={item.id || index}
              className="p-4 sm:p-5 neu-card-elevated rounded-2xl sm:rounded-[24px] border border-white/60 hover:border-emerald-500/40 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 dark:border-white/10 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border',
                      item.tab === 'Pemulihan Versi'
                        ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30'
                        : item.tab === 'Sosial & DTSEN'
                        ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30'
                        : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                    )}
                  >
                    {item.tab}
                  </Badge>
                  <h4 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base">
                    {item.action || 'Pembaruan Data Statistik'}
                  </h4>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1 text-[11px] font-medium">
                    <Clock className="h-3.5 w-3.5 text-emerald-700" />
                    <span>{formatTime(item.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span>{item.author || 'Admin'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {item.summary || 'Pembaruan variabel statistik desa.'}
                </p>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedItemForView(item)}
                    className="h-8 rounded-xl text-xs font-bold gap-1.5 border border-stone-300 dark:border-white/10"
                  >
                    <Eye className="h-3.5 w-3.5 text-blue-600" />
                    <span>Lihat Isian</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setSelectedItemForRestore(item)}
                    className="neu-btn-dark text-[#d4e157] h-8 rounded-xl text-xs font-bold gap-1.5 border border-white/10"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-[#d4e157]" />
                    <span>Pulihkan Versi Ini</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteHistory(item.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10 rounded-xl"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DIALOG 1: LIHAT ISIAN / SNAPSHOT DATA */}
      <Dialog open={!!selectedItemForView} onOpenChange={(open) => !open && setSelectedItemForView(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-[#ECE8E1] dark:bg-stone-900 rounded-[28px] border border-stone-300 dark:border-white/10 p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center justify-between">
              <span>Isian Versi: {selectedItemForView?.tab}</span>
              <Badge className="font-bold text-[10px] uppercase">
                {selectedItemForView && formatTime(selectedItemForView.timestamp)}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              {selectedItemForView?.action} • Disimpan oleh {selectedItemForView?.author}
            </DialogDescription>
          </DialogHeader>

          {selectedItemForView && (
            <div className="space-y-4 my-2 text-xs">
              <div className="p-3.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                  Ringkasan Perubahan:
                </span>
                <p className="text-slate-700 dark:text-slate-300">{selectedItemForView.summary}</p>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                  Pratinjau Snapshot Data Lengkap (JSON):
                </span>
                <pre className="p-4 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 overflow-x-auto text-[11px] font-mono leading-relaxed max-h-96 text-slate-800 dark:text-slate-200">
                  {JSON.stringify(selectedItemForView.snapshotData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSelectedItemForView(null)}
              className="rounded-xl text-xs font-bold"
            >
              Tutup
            </Button>
            {selectedItemForView && (
              <Button
                onClick={() => {
                  const target = selectedItemForView;
                  setSelectedItemForView(null);
                  setSelectedItemForRestore(target);
                }}
                className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-10 px-5 gap-2 border border-white/10"
              >
                <RotateCcw className="h-4 w-4 text-[#d4e157]" />
                <span>Pulihkan Versi Ini</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: KONFIRMASI RESTORE VERSI */}
      <Dialog open={!!selectedItemForRestore} onOpenChange={(open) => !open && setSelectedItemForRestore(null)}>
        <DialogContent className="max-w-md bg-[#ECE8E1] dark:bg-stone-900 rounded-[28px] border border-stone-300 dark:border-white/10 p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Konfirmasi Pemulihan Versi
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              Apakah Anda yakin ingin memulihkan seluruh konfigurasi data statistik ke versi ini?
            </DialogDescription>
          </DialogHeader>

          {selectedItemForRestore && (
            <div className="p-4 rounded-2xl neu-inset border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/40 space-y-2 text-xs text-amber-950 dark:text-amber-200 my-2">
              <div>
                <strong>Modul:</strong> {selectedItemForRestore.tab}
              </div>
              <div>
                <strong>Waktu Snapshot:</strong> {formatTime(selectedItemForRestore.timestamp)}
              </div>
              <div>
                <strong>Aksi Sebelumnya:</strong> {selectedItemForRestore.action}
              </div>
              <div>
                <strong>Ringkasan:</strong> {selectedItemForRestore.summary}
              </div>
              <p className="text-[11px] leading-relaxed pt-1 text-slate-700 dark:text-slate-300">
                Tindakan ini akan menimpa isian aktif di database dengan snapshot versi terpilih dan langsung diperbarui di portal publik <code>/statistik</code>.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={isRestoring}
              onClick={() => setSelectedItemForRestore(null)}
              className="rounded-xl text-xs font-bold"
            >
              Batal
            </Button>
            <Button
              onClick={handleRestore}
              disabled={isRestoring}
              className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-10 px-5 gap-2 border border-white/10"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#d4e157]" />
                  <span>Memulihkan Data...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 text-[#d4e157]" />
                  <span>Ya, Pulihkan Sekarang</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
