'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  History,
  RotateCcw,
  Eye,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  FileText,
  User,
  Compass,
  Milestone,
  Zap,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, setDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { VillageProfileHistoryItem, ProfilDesaContent } from '@/lib/types';

export function AdminHistoriTab() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState<VillageProfileHistoryItem | null>(null);
  const [restoreItem, setRestoreItem] = useState<VillageProfileHistoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const historyQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'villageProfileHistory'), orderBy('timestamp', 'desc'));
  }, [firestore]);

  const { data: historyList, isLoading } = useCollection<VillageProfileHistoryItem>(historyQuery);

  const filteredHistory = (historyList || []).filter((item) => {
    const matchesTab = filterTab === 'all' || item.tab === filterTab;
    const matchesSearch =
      searchTerm === '' ||
      item.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.savedAt?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleRestore = async () => {
    if (!restoreItem || !firestore) return;
    setIsRestoring(true);
    try {
      const snapshot = restoreItem.dataSnapshot || {};
      const targetDocRef = doc(firestore, 'villageProfile', 'default');

      // Update current document with snapshot
      await setDoc(targetDocRef, {
        ...snapshot,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Record restore action to history
      await addDoc(collection(firestore, 'villageProfileHistory'), {
        action: 'Pemulihan Versi Profil',
        tab: 'restore',
        summary: `Mengembalikan profil desa ke kondisi versi ${restoreItem.savedAt || 'sebelumnya'}`,
        timestamp: serverTimestamp(),
        savedAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        dataSnapshot: snapshot,
      });

      toast({
        title: 'Versi Berhasil Dipulihkan!',
        description: 'Tampilan di /profil-desa telah dikembalikan ke kondisi versi terpilih.',
      });
      setRestoreItem(null);
    } catch (err: any) {
      toast({
        title: 'Gagal Memulihkan',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'villageProfileHistory', id));
      toast({
        title: 'Histori Dihapus',
        description: 'Catatan riwayat berhasil dihapus.',
      });
      setDeleteId(null);
    } catch (err: any) {
      toast({
        title: 'Gagal Menghapus',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const getTabIcon = (tab?: string) => {
    switch (tab) {
      case 'sambutan':
        return <User className="h-4 w-4 text-emerald-700" />;
      case 'kenali':
        return <CheckCircle2 className="h-4 w-4 text-blue-700" />;
      case 'sejarah':
        return <History className="h-4 w-4 text-amber-700" />;
      case 'peta':
        return <Compass className="h-4 w-4 text-indigo-700" />;
      case 'wilayah':
        return <Milestone className="h-4 w-4 text-teal-700" />;
      case 'potensi':
        return <Zap className="h-4 w-4 text-purple-700" />;
      case 'galeri':
        return <ImageIcon className="h-4 w-4 text-rose-700" />;
      default:
        return <FileText className="h-4 w-4 text-slate-700" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Informasi Histori */}
      <Card className="rounded-2xl border-slate-200 shadow-sm bg-gradient-to-r from-emerald-50 via-teal-50 to-white overflow-hidden">
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-700 text-white shadow-xs">
                <History className="h-4 w-4" />
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                Riwayat &amp; Histori Isian Profil Desa
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Setiap kali Anda mengubah redaksi atau data profil desa, sistem mencatat riwayat perubahan secara otomatis. Anda dapat melihat kembali isian lampau atau <strong>memulihkan (restore)</strong> versi sebelumnya kapan saja.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <Badge variant="outline" className="bg-white px-3 py-1 text-xs font-bold border-emerald-300 text-emerald-800">
              Total Riwayat: {historyList?.length || 0}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari riwayat perubahan..."
            className="pl-9 h-9 text-xs rounded-xl border-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={filterTab}
            onChange={(e) => setFilterTab(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="all">Semua Bagian</option>
            <option value="sambutan">1. Sambutan &amp; Profil</option>
            <option value="kenali">2. Visi &amp; Misi</option>
            <option value="sejarah">3. Sejarah Desa</option>
            <option value="peta">4. Peta &amp; Batas</option>
            <option value="wilayah">5. Data Wilayah</option>
            <option value="potensi">6. Potensi Unggulan</option>
            <option value="galeri">10. Media &amp; Video</option>
            <option value="restore">Pemulihan Versi</option>
          </select>
        </div>
      </div>

      {/* Daftar Histori */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mx-auto" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Memuat riwayat perubahan...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-slate-300 p-8 text-center bg-white">
          <History className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">Belum Ada Riwayat Perubahan</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Riwayat akan terisi secara otomatis ketika admin melakukan penyimpanan data profil desa pada tab menu di atas.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <Card
              key={item.id}
              className="rounded-2xl border-slate-200 hover:border-emerald-300 transition-all shadow-xs hover:shadow-sm bg-white overflow-hidden"
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="p-1.5 rounded-lg bg-slate-100 shrink-0">
                      {getTabIcon(item.tab)}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{item.action}</span>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
                      {item.tab}
                    </Badge>
                  </div>
                  {item.summary && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" />
                      {item.savedAt || 'Baru saja'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedItem(item)}
                    className="h-8 gap-1 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                    <span>Lihat Isian</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setRestoreItem(item)}
                    className="h-8 gap-1 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Pulihkan</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteId(item.id || null)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog: Lihat Snapshot Data Lengkap */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs uppercase font-bold text-emerald-800 border-emerald-300">
                  {selectedItem.tab}
                </Badge>
                <DialogTitle className="text-lg font-black text-slate-900">
                  {selectedItem.action}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Disimpan pada: {selectedItem.savedAt}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              {selectedItem.summary && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 font-medium leading-relaxed">
                  <strong>Ringkasan:</strong> {selectedItem.summary}
                </div>
              )}

              {/* Rincian data Snapshot */}
              <div className="space-y-3">
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Rincian Data Tersimpan dalam Versi Ini:
                </h5>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 font-mono text-xs max-h-80 overflow-y-auto">
                  {Object.entries(selectedItem.dataSnapshot || {}).map(([key, val]) => {
                    if (val === undefined || val === null || val === '') return null;
                    return (
                      <div key={key} className="border-b border-slate-200/60 pb-2">
                        <span className="text-emerald-800 font-bold block">{key}:</span>
                        <span className="text-slate-700 whitespace-pre-wrap break-words font-sans text-xs">
                          {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(null)}
                className="rounded-xl text-xs font-bold"
              >
                Tutup
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setRestoreItem(selectedItem);
                  setSelectedItem(null);
                }}
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Pulihkan Versi Ini
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Alert Dialog Konfirmasi Restore */}
      <AlertDialog open={!!restoreItem} onOpenChange={() => setRestoreItem(null)}>
        <AlertDialogContent className="rounded-3xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black text-slate-900">
              Pulihkan Versi Ini ke /profil-desa?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan menimpa isian profil desa saat ini dengan data yang tersimpan pada versi tanggal{' '}
              <strong>{restoreItem?.savedAt}</strong> ({restoreItem?.action}). Halaman publik <code>/profil-desa</code> akan segera menampilkan data hasil pemulihan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs font-bold">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={isRestoring}
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {isRestoring ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
              Ya, Pulihkan Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog Konfirmasi Hapus */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black text-slate-900">
              Hapus Catatan Histori?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 leading-relaxed">
              Catatan riwayat ini akan dihapus permanen. Data aktif profil desa tidak akan terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs font-bold">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
