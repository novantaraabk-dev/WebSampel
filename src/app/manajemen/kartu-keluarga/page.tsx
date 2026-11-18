'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import {
  collection,
  getDocs,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { Resident, Family } from '@/lib/types';
import { DataKeluargaTable } from './_components/data-keluarga-table';
import { DaftarAnggotaKeluarga } from './_components/daftar-anggota-keluarga';
import { SalinanKartuKeluarga } from './_components/salinan-kartu-keluarga';
import { Loader2 } from 'lucide-react';
import {
  getStoredFamilies,
  saveStoredFamilies,
  clearStoredFamilies,
  getCachedKkMembers,
  cacheKkMembers,
  invalidateKkMembers,
} from '@/lib/kk-cache';
import { useToast } from '@/hooks/use-toast';

export default function ManajemenKartuKeluargaPage() {
  const db = useFirestore();
  const { toast } = useToast();

  // View state: 'list' (Tabel KK) | 'members' (Detail Anggota) | 'salinan' (Cetak Salinan KK)
  const [currentView, setCurrentView] = useState<'list' | 'members' | 'salinan'>('list');
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Resident[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<Family[]>([]);
  const [isCached, setIsCached] = useState(false);

  // Load Village Settings (untuk titimangsa & nama kades di blangko KK)
  const villageSettingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'settings', 'village');
  }, [db]);
  const { data: villageSettings } = useDoc(villageSettingsRef);

  // Sorting Prioritas SHDK Sesuai Format Resmi Dukcapil
  const sortMembersDukcapil = (members: Resident[]): Resident[] => {
    const getShdkPriority = (shdk?: string) => {
      const s = (shdk || '').toUpperCase().trim();
      if (s === 'KEPALA KELUARGA') return 1;
      if (s === 'ISTRI' || s === 'SUAMI') return 2;
      if (s === 'ANAK') return 3;
      if (s === 'MENANTU') return 4;
      if (s === 'CUCU') return 5;
      if (s === 'ORANG TUA' || s === 'ORANGTUA') return 6;
      if (s === 'MERTUA') return 7;
      if (s === 'FAMILI LAIN') return 8;
      return 9;
    };

    return [...members].sort((a, b) => {
      const pA = getShdkPriority(a.relationshipToHeadOfFamily);
      const pB = getShdkPriority(b.relationshipToHeadOfFamily);
      if (pA !== pB) return pA - pB;
      // Jika sama-sama anak, urutkan berdasarkan tanggal lahir (tertua ke termuda)
      return (a.dateOfBirth || '').localeCompare(b.dateOfBirth || '');
    });
  };

  // Fungsi Langsung Mengambil Anggota KK dengan Dukungan Cache Lokal (0 Read jika ada di cache)
  const fetchMembersByKk = useCallback(async (noKk: string, forceServer = false): Promise<Resident[]> => {
    if (!db || !noKk) return [];
    const cleanKk = String(noKk).trim();

    // 1. Cek Cache Lokal terlebih dahulu jika tidak dipaksa ambil dari server (0 Read)
    if (!forceServer) {
      const cached = getCachedKkMembers(cleanKk);
      if (cached && cached.length > 0) {
        return cached;
      }
    }

    try {
      // 2. Query terarah langsung ke noKk spesifik (Hanya 2-5 read)
      const q = query(collection(db, 'residents'), where('noKk', '==', cleanKk));
      const snap = await getDocs(q);
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Resident));

      // Fallback jika tersimpan dengan field no_kk
      if (list.length === 0) {
        const q2 = query(collection(db, 'residents'), where('no_kk', '==', cleanKk));
        const snap2 = await getDocs(q2);
        list = snap2.docs.map(d => ({ id: d.id, ...d.data() } as Resident));
      }

      const sorted = sortMembersDukcapil(list);
      // Simpan ke cache lokal agar pembacaan berikutnya 0 Read
      cacheKkMembers(cleanKk, sorted);
      return sorted;
    } catch (err) {
      console.error('Error fetching members by KK:', err);
      return [];
    }
  }, [db]);

  // Load Master Data Keluarga dengan Strategi Cache First
  const loadData = useCallback(async (forceRefresh = false) => {
    if (!db) return;

    // 1. Cek apakah ada di cache lokal (0 Read Firestore)
    if (!forceRefresh) {
      const cachedFamilies = getStoredFamilies();
      if (cachedFamilies && cachedFamilies.length > 0) {
        setFamilies(cachedFamilies);
        setIsCached(true);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setIsCached(false);
    try {
      // 2. Query Hemat Quota: Ambil KEPALA KELUARGA (Hanya ~2.700 dokumen dibanding 9.000 dokumen)
      const headsSnap = await getDocs(
        query(
          collection(db, 'residents'),
          where('relationshipToHeadOfFamily', '==', 'KEPALA KELUARGA')
        )
      );
      const headsList = headsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Resident));

      // 3. Ambil metadata families jika ada
      const familiesSnap = await getDocs(collection(db, 'families'));
      const familiesMetadataMap = new Map<string, any>();
      familiesSnap.docs.forEach(d => {
        familiesMetadataMap.set(d.id, d.data());
      });

      // 4. Bangun daftar keluarga dari kepala keluarga
      const familyArray: Family[] = [];
      const processedKkSet = new Set<string>();

      headsList.forEach(head => {
        const kk = String(head.noKk || (head as any).no_kk || '').trim();
        if (kk && !processedKkSet.has(kk)) {
          processedKkSet.add(kk);
          const meta = familiesMetadataMap.get(kk) || {};

          familyArray.push({
            id: kk,
            noKk: kk,
            kepalaKeluarga: meta.kepalaKeluarga || head.fullName || 'TIDAK DIKETAHUI',
            nikKepala: meta.nikKepala || head.nik || '-',
            genderKepala: meta.genderKepala || head.gender || 'Laki-laki',
            alamat: meta.alamat || head.address || 'DUSUN SAMPELDES',
            dusun: meta.dusun || head.dusun || 'SAMPELDES',
            rw: meta.rw || head.rw || '001',
            rt: meta.rt || head.rt || '001',
            jumlahAnggota: meta.jumlahAnggota || 1, // Diupdate otomatis saat detail dibuka
            statusKk: meta.statusKk || 'KK Aktif',
            tagIdCard: meta.tagIdCard || head.tagIdCard || '-',
            programBantuan: meta.programBantuan || '-',
            tanggalTerdaftar: meta.tanggalTerdaftar || (head.createdAt?.toDate ? head.createdAt.toDate().toISOString().split('T')[0] : '19 Jan 2026'),
          });
        }
      });

      // Tambahkan KK dari dokumen families yang belum tercakup
      familiesMetadataMap.forEach((meta, kk) => {
        if (!processedKkSet.has(kk)) {
          processedKkSet.add(kk);
          familyArray.push({
            id: kk,
            noKk: kk,
            kepalaKeluarga: meta.kepalaKeluarga || 'TIDAK DIKETAHUI',
            nikKepala: meta.nikKepala || '-',
            genderKepala: meta.genderKepala || 'Laki-laki',
            alamat: meta.alamat || 'DUSUN SAMPELDES',
            dusun: meta.dusun || 'SAMPELDES',
            rw: meta.rw || '001',
            rt: meta.rt || '001',
            jumlahAnggota: meta.jumlahAnggota || 0,
            statusKk: meta.statusKk || 'KK Kosong',
            tagIdCard: meta.tagIdCard || '-',
            programBantuan: meta.programBantuan || '-',
            tanggalTerdaftar: meta.tanggalTerdaftar || '19 Jan 2026',
          });
        }
      });

      // Urutkan KK berdasarkan Nomor KK
      familyArray.sort((a, b) => (a.noKk || '').localeCompare(b.noKk || ''));

      // 5. Simpan ke Cache Lokal (LocalStorage) dengan TTL 12 Jam
      saveStoredFamilies(familyArray);
      setFamilies(familyArray);
      setIsCached(true);

      if (forceRefresh) {
        toast({
          title: 'Sinkronisasi Selesai',
          description: `Berhasil memuat ${familyArray.length} data Kartu Keluarga dari server.`,
        });
      }
    } catch (error: any) {
      console.error('Error loading families data:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal Memuat Data',
        description: error.message || 'Terjadi kesalahan saat memuat data keluarga.',
      });
    } finally {
      setLoading(false);
    }
  }, [db, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler pemilihan KK untuk detail atau salinan
  const handleSelectFamily = async (family: Family, view: 'members' | 'salinan') => {
    setSelectedFamily(family);
    setCurrentView(view);
    setLoadingMembers(true);
    try {
      // Mengambil anggota KK (Cek cache dulu -> jika tidak ada, query 3-5 reads)
      const members = await fetchMembersByKk(family.noKk);
      setFamilyMembers(members);

      // Sinkronkan jumlah anggota di state dan cache
      const updatedFam = {
        ...family,
        jumlahAnggota: members.length,
        anggota: members,
      };
      setSelectedFamily(updatedFam);

      // Perbarui jumlah anggota di list master secara lokal (0 read!)
      setFamilies(prev => {
        const next = prev.map(f => f.noKk === family.noKk ? { ...f, jumlahAnggota: members.length } : f);
        saveStoredFamilies(next);
        return next;
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleReloadMembers = async () => {
    if (!selectedFamily) return;
    setLoadingMembers(true);
    try {
      // Invalidate cache dan ambil fresh dari server
      invalidateKkMembers(selectedFamily.noKk);
      const members = await fetchMembersByKk(selectedFamily.noKk, true);
      setFamilyMembers(members);
      setSelectedFamily(prev => prev ? { ...prev, jumlahAnggota: members.length, anggota: members } : null);

      // Update jumlah anggota di list master
      setFamilies(prev => {
        const next = prev.map(f => f.noKk === selectedFamily.noKk ? { ...f, jumlahAnggota: members.length } : f);
        saveStoredFamilies(next);
        return next;
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleForceRefreshServer = () => {
    clearStoredFamilies();
    loadData(true);
  };

  return (
    <div className="min-h-[85vh] space-y-6">
      {currentView === 'list' && (
        <DataKeluargaTable
          families={families}
          loading={loading}
          isCached={isCached}
          onSelectFamily={handleSelectFamily}
          onReload={() => loadData(false)}
          onForceSyncServer={handleForceRefreshServer}
        />
      )}

      {currentView === 'members' && selectedFamily && (
        loadingMembers ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 neu-dashboard-card rounded-[24px] border border-white/80 dark:border-white/10 text-slate-600 dark:text-slate-300">
            <div className="w-9 h-9 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold tracking-tight">Memuat data susunan anggota keluarga No. {selectedFamily.noKk}...</p>
          </div>
        ) : (
          <DaftarAnggotaKeluarga
            family={selectedFamily}
            members={familyMembers}
            onBackToFamilyList={() => setCurrentView('list')}
            onOpenSalinanKk={() => setCurrentView('salinan')}
            onReload={handleReloadMembers}
          />
        )
      )}

      {currentView === 'salinan' && selectedFamily && (
        loadingMembers ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 neu-dashboard-card rounded-[24px] border border-white/80 dark:border-white/10 text-slate-600 dark:text-slate-300">
            <div className="w-9 h-9 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold tracking-tight">Menyiapkan pratinjau salinan Kartu Keluarga No. {selectedFamily.noKk}...</p>
          </div>
        ) : (
          <SalinanKartuKeluarga
            family={selectedFamily}
            members={familyMembers}
            onBackToMembers={() => setCurrentView('members')}
            onBackToFamilyList={() => setCurrentView('list')}
            villageSettings={villageSettings}
          />
        )
      )}
    </div>
  );
}
