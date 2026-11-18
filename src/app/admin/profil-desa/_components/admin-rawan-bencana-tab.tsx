'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { uploadToCloudinary } from '@/lib/upload-cloudinary';
import {
  PetaKebencanaanConfig,
  RisikoBencanaItem,
  TempatEvakuasiItem,
  KontakDaruratItem,
  SopBencanaItem
} from '@/lib/types';
import {
  AlertTriangle,
  Map,
  ShieldAlert,
  PhoneCall,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Save,
  Loader2,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Search,
  X,
  MapPin,
  Users,
  Eye,
  Layers,
  LifeBuoy
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

// ─── DEFAULT SEED DATA DESA SAMPELDES ───
export const SEED_PETA_KEBENCANAAN: PetaKebencanaanConfig = {
  judulPeta: 'Peta Tematik Kerawanan Bencana & Jalur Evakuasi Warga Desa Sampeldes',
  gambarPetaUrl: '/images/peta-kebencanaan-sampeldes.jpg',
  deskripsiNarasi: `Peta mitigasi kebencanaan ini disusun secara partisipatif bersama Pemerintah Desa Sampeldes, BPD, dan Tim Siaga Bencana Desa (TSBD) Kecamatan Gandrungmangu.

Peta ini memetakan secara detail zona kerawanan banjir genangan limpasan sungai di kawasan dataran rendah Dusun Pangampiran, ancaman angin puting beliung di koridor persawahan terbuka Dusun Ciloning, serta titik aman jalur evakuasi menuju Tempat Evakuasi Sementara (TES) resmi desa. Setiap warga diimbau mengenali rute evakuasi terdekat dari tempat tinggal masing-masing.`,
  tanggalUpdate: 'Oktober 2026',
  legenda: [
    { label: 'Zona Merah', warna: '#ef4444', deskripsi: 'Daerah Rawan Banjir Limpasan Saluran & Genangan Air Sawah' },
    { label: 'Zona Kuning', warna: '#eab308', deskripsi: 'Daerah Waspada Hembusan Angin Kencang / Puting Beliung' },
    { label: 'Jalur Hijau', warna: '#10b981', deskripsi: 'Rute Utama Jalur Evakuasi Cepat (Bebas Hambatan & Terang)' },
    { label: 'Titik Kumpul (TES)', warna: '#3b82f6', deskripsi: 'Tempat Evakuasi Sementara & Posko Logistik Kesehatan' }
  ]
};

export const SEED_RISIKO_BENCANA: RisikoBencanaItem[] = [
  {
    jenisBencana: 'Banjir Luapan / Genangan Saluran',
    lokasiRawan: 'Dusun Pangampiran (RT 01, 02, 03 / RW 01)',
    musimPemicu: 'Puncak Musim Hujan (Desember - Februari) curah hujan > 100mm/hari',
    dampakPotensial: 'Tergenangnya 35 Ha sawah padi siap panen, 24 rumah dataran rendah kemasukan air 30-50 cm, akses jalan terhambat.',
    rekomendasiMitigasi: 'Normalisasi sedimentasi saluran pembuang, siaga mesin pompa alkon desa, peninggian tanggul karung pasir, posko pantau debit air sungai.',
    tingkatRisiko: 'Tinggi'
  },
  {
    jenisBencana: 'Angin Puting Beliung / Badai Kencang',
    lokasiRawan: 'Dusun Ciloning (RT 01 - 04 / RW 02)',
    musimPemicu: 'Masa Pancaroba & Awal Musim Hujan (Oktober - November)',
    dampakPotensial: 'Kerusakan atap rumah warga, dahan pohon besar tumbang memutus jaringan listrik dan menghalangi jalan poros desa.',
    rekomendasiMitigasi: 'Pemangkasan rutin dahan pohon lapuk/rimbun di pinggir jalan, perkuatan struktur rangka atap bangunan, kesiagaan gergaji mesin (chainsaw) Linmas.',
    tingkatRisiko: 'Sedang'
  },
  {
    jenisBencana: 'Kekeringan & Defisit Air Bersih Warga',
    lokasiRawan: 'Dusun Sampeldes (RT 03 & 04 / RW 02)',
    musimPemicu: 'Puncak Kemarau Panjang (Juli - September) saat tidak hujan > 45 hari',
    dampakPotensial: 'Surutnya air sumur gali warga untuk konsumsi dan MCK, ancaman puso bagi tanaman palawija lahan tadah hujan.',
    rekomendasiMitigasi: 'Optimalisasi sumur bor artesis PAMSIMAS desa, mobilisasi dropping tangki air bersih BPBD Kab. Cilacap, edukasi hemat air.',
    tingkatRisiko: 'Sedang'
  },
  {
    jenisBencana: 'Erosi & Amblesan Tanggul Irigasi',
    lokasiRawan: 'Batas Dusun Pangampiran & Ciloning (Saluran Sekunder)',
    musimPemicu: 'Arus deras saat debit banjir puncak bersamaan air pasang',
    dampakPotensial: 'Amblesnya bahu jalan usaha tani dan jebolnya dinding penahan saluran irigasi ke persawahan.',
    rekomendasiMitigasi: 'Pemasangan turap bambu cerucuk darurat, usulan pembangunan talud beton permanen melalui alokasi Dana Desa (DD).',
    tingkatRisiko: 'Rendah'
  }
];

export const SEED_TEMPAT_EVAKUASI: TempatEvakuasiItem[] = [
  {
    kodeNama: 'TES-01: Kompleks Kantor & Balai Desa Sampeldes',
    alamatDusun: 'Jl. Raya Sampeldes No. 01, Dusun Sampeldes',
    kapasitas: '250 Jiwa (±65 Kepala Keluarga)',
    fasilitas: 'Pendopo Terbuka, Aula Pelayanan, Dapur Umum Siaga, 4 Toilet/Sanitasi, Genset Darurat 5 KVA, Posko Medis Bidan Desa',
    penanggungJawab: 'Kepala Desa & Sekdes Sampeldes (0812-3456-7890)',
    statusKesiapan: 'Siap Digunakan',
    fotoUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=1200&auto=format&fit=crop'
  },
  {
    kodeNama: 'TES-02: Gedung Serbaguna & Lapangan Pangampiran',
    alamatDusun: 'Dusun Pangampiran RT 01 / RW 01',
    kapasitas: '180 Jiwa (±45 Kepala Keluarga)',
    fasilitas: 'Ruang Indoor Luas, Lapangan Terbuka untuk Helipad/Tenda Pleton, Tandon Air Bersih, 2 Toilet, Akses Ambulans Lancar',
    penanggungJawab: 'Kadus Pangampiran & Ketua RW 01 (0856-1122-3344)',
    statusKesiapan: 'Siap Digunakan',
    fotoUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200&auto=format&fit=crop'
  },
  {
    kodeNama: 'TES-03: Balai Pertemuan & Masjid Dusun Ciloning',
    alamatDusun: 'Dusun Ciloning RT 02 / RW 02',
    kapasitas: '150 Jiwa (±40 Kepala Keluarga)',
    fasilitas: 'Ruang Pertemuan Tertutup, Pengeras Suara Informasi (Toa), Dapur Logistik, Tempat Wudhu & Sanitasi Higienis',
    penanggungJawab: 'Kadus Ciloning & Tokoh Masyarakat (0878-5566-7788)',
    statusKesiapan: 'Siap Digunakan',
    fotoUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?q=80&w=1200&auto=format&fit=crop'
  }
];

export const SEED_KONTAK_DARURAT: KontakDaruratItem[] = [
  { namaInstansi: 'Posko Siaga Bencana Desa Sampeldes (24 Jam)', nomorTelepon: '0812-3456-7890', peran: 'Komando Tanggap Darurat & Informasi Desa', layananJam: '24 Jam Nonstop', isHotlineUtama: true },
  { namaInstansi: 'Mobil Ambulans Siaga Desa Sampeldes', nomorTelepon: '0857-1234-5678', peran: 'Evakuasi Medis Warga & Ibu Hamil', layananJam: '24 Jam Standby', isHotlineUtama: true },
  { namaInstansi: 'Bhabinkamtibmas Desa Sampeldes', nomorTelepon: '0813-2233-4455', peran: 'Keamanan, Ketertiban & Evakuasi Warga', layananJam: '24 Jam' },
  { namaInstansi: 'Babinsa Koramil Gandrungmangu', nomorTelepon: '0821-3344-5566', peran: 'Bantuan Taktis, Tenda Darurat & Evakuasi', layananJam: '24 Jam' },
  { namaInstansi: 'BPBD Kabupaten Cilacap', nomorTelepon: '(0282) 534110 / 0811-260-1113', peran: 'Bantuan Logistik, Perahu Karet & Dropping Air', layananJam: '24 Jam Posko Induk' },
  { namaInstansi: 'Puskesmas Gandrungmangu I', nomorTelepon: '(0280) 5260119', peran: 'Penanganan Medis Darurat & Rujukan Pasien', layananJam: 'UGD 24 Jam' },
  { namaInstansi: 'Pemadam Kebakaran (Damkar) Kroya / Sidareja', nomorTelepon: '113 / (0282) 611113', peran: 'Penanganan Kebakaran & Evakuasi Pohon Tumbang', layananJam: '24 Jam' },
  { namaInstansi: 'PLN Pengaduan Gangguan', nomorTelepon: '123', peran: 'Pemutusan Darurat Kabel Putus / Tiang Roboh', layananJam: '24 Jam' }
];

export const SEED_SOP_BENCANA: SopBencanaItem[] = [
  {
    fase: 'pra',
    judul: 'Tahap 1: Pra-Bencana (Kesiapsiagaan & Peringatan Dini)',
    deskripsi: 'Langkah pencegahan dan pembiasaan keluarga sebelum bencana terjadi.',
    langkah: [
      'Simpan dokumen penting (KK, KTP, Ijazah, Sertifikat, Akta) dalam map plastik tahan air di tempat yang mudah dijangkau.',
      'Siapkan Tas Siaga Bencana (TSB) berisi pakaian ganti, senter, baterai cadangan, obat-obatan pribadi, air minum, dan biskuit.',
      'Pantau informasi resmi cuaca ekstrem dari BMKG dan pengumuman pengeras suara masjid / kentongan siaga desa.',
      'Kenali tanda bunyi kentongan bahaya: Kentongan bertalu-talu cepat (titir) menandakan bahaya darurat dan warga segera berkumpul.'
    ]
  },
  {
    fase: 'saat',
    judul: 'Tahap 2: Saat Bencana (Evakuasi Terarah & Cepat)',
    deskripsi: 'Tindakan yang harus dilakukan saat sirine atau tanda bahaya dibunyikan.',
    langkah: [
      'Segera matikan meteran listrik utama rumah (MCB) dan lepas regulator tabung gas elpiji.',
      'Dahulukan penyelamatan kelompok rentan: bayi/balita, ibu hamil, lansia, dan warga disabilitas.',
      'Berjalan tenang namun sigap mengikuti rute Jalur Evakuasi Hijau menuju Tempat Evakuasi Sementara (TES) terdekat.',
      'Hindari melintasi tiang listrik, pohon besar yang rapuh, atau jembatan dengan arus air deras yang meluap.',
      'Lapor segera ke petugas Posko TES untuk pencatatan anggota keluarga yang telah tiba.'
    ]
  },
  {
    fase: 'pasca',
    judul: 'Tahap 3: Pasca-Bencana (Pendataan, Logistik & Pemulihan)',
    deskripsi: 'Prosedur keselamatan setelah kondisi darurat dinyatakan mereda oleh aparat desa.',
    langkah: [
      'Tetap berada di Tempat Evakuasi Sementara sampai ada instruksi resmi dari Kepala Desa bahwa situasi telah aman.',
      'Pemeriksaan kesehatan oleh tim Bidan Desa dan Posko Kesehatan bagi warga yang mengalami luka atau trauma.',
      'Jangan langsung menyalakan instalasi listrik rumah sebelum kabel dan soket dipastikan kering dan aman.',
      'Gotong royong bersama relawan dan aparat untuk pembersihan sisa lumpur, sampah saluran, dan desinfeksi lingkungan.'
    ]
  }
];

export function AdminRawanBencanaTab() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sub-tabs dalam manajemen bencana
  const [activeSubTab, setActiveSubTab] = useState<'peta' | 'risiko' | 'evakuasi' | 'sop'>('peta');
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Data Config Peta & Redaksi
  const configDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'rawanBencanaConfig', 'default');
  }, [firestore]);
  const { data: configData, isLoading: isLoadingConfig } = useDoc<PetaKebencanaanConfig>(configDocRef);

  // Form State Peta
  const [petaForm, setPetaForm] = useState<PetaKebencanaanConfig>({
    judulPeta: '',
    gambarPetaUrl: '',
    deskripsiNarasi: '',
    tanggalUpdate: 'Oktober 2026',
    legenda: []
  });

  useEffect(() => {
    if (configData) {
      const rawUrl = configData.gambarPetaUrl;
      const isOldWorldMap = rawUrl && rawUrl.includes('1524661135-423995f22d0b');
      setPetaForm({
        judulPeta: configData.judulPeta || SEED_PETA_KEBENCANAAN.judulPeta,
        gambarPetaUrl: (rawUrl && !isOldWorldMap) ? rawUrl : '/images/peta-kebencanaan-sampeldes.jpg',
        deskripsiNarasi: configData.deskripsiNarasi || SEED_PETA_KEBENCANAAN.deskripsiNarasi,
        tanggalUpdate: configData.tanggalUpdate || SEED_PETA_KEBENCANAAN.tanggalUpdate,
        legenda: configData.legenda || SEED_PETA_KEBENCANAAN.legenda
      });
    } else {
      setPetaForm(SEED_PETA_KEBENCANAAN);
    }
  }, [configData]);

  // 2. Data Risiko Bencana
  const risikoQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'risikoBencana'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: rawRisikoList, isLoading: isLoadingRisiko } = useCollection<RisikoBencanaItem>(risikoQuery);

  // 3. Data Tempat Evakuasi (TES)
  const evakuasiQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tempatEvakuasi'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: rawEvakuasiList, isLoading: isLoadingEvakuasi } = useCollection<TempatEvakuasiItem>(evakuasiQuery);

  // Modals & States for CRUD Risiko
  const [isRisikoModalOpen, setIsRisikoModalOpen] = useState(false);
  const [editingRisikoId, setEditingRisikoId] = useState<string | null>(null);
  const [risikoForm, setRisikoForm] = useState<Partial<RisikoBencanaItem>>({
    jenisBencana: '',
    lokasiRawan: '',
    musimPemicu: '',
    dampakPotensial: '',
    rekomendasiMitigasi: '',
    tingkatRisiko: 'Tinggi'
  });

  // Modals & States for CRUD Tempat Evakuasi
  const [isEvakuasiModalOpen, setIsEvakuasiModalOpen] = useState(false);
  const [editingEvakuasiId, setEditingEvakuasiId] = useState<string | null>(null);
  const [evakuasiForm, setEvakuasiForm] = useState<Partial<TempatEvakuasiItem>>({
    kodeNama: '',
    alamatDusun: '',
    kapasitas: '',
    fasilitas: '',
    penanggungJawab: '',
    fotoUrl: '',
    statusKesiapan: 'Siap Digunakan'
  });

  // Upload Peta Image
  const handleUploadPeta = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadToCloudinary(file, 'peta_bencana');
      setPetaForm(prev => ({ ...prev, gambarPetaUrl: url }));
      toast({
        title: 'Gambar Peta Berhasil Diunggah',
        description: 'Tautan gambar peta bencana berhasil diperbarui.'
      });
    } catch (err: any) {
      toast({
        title: 'Gagal Unggah Gambar',
        description: err.message || 'Terjadi kesalahan.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save Peta Config
  const handleSavePetaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    try {
      setIsSavingConfig(true);
      await setDoc(doc(firestore, 'rawanBencanaConfig', 'default'), {
        ...petaForm,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast({
        title: 'Peta & Redaksi Disimpan',
        description: 'Konfigurasi peta kebencanaan dan narasi berhasil disimpan ke database.'
      });
    } catch (err: any) {
      toast({
        title: 'Gagal Menyimpan Peta',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Save / Edit Risiko Bencana
  const handleSaveRisiko = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    try {
      if (editingRisikoId) {
        await updateDoc(doc(firestore, 'risikoBencana', editingRisikoId), {
          ...risikoForm,
          updatedAt: serverTimestamp()
        });
        toast({ title: 'Risiko Bencana Diperbarui' });
      } else {
        await addDoc(collection(firestore, 'risikoBencana'), {
          ...risikoForm,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast({ title: 'Risiko Bencana Ditambahkan' });
      }
      setIsRisikoModalOpen(false);
      setEditingRisikoId(null);
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err.message, variant: 'destructive' });
    }
  };

  // Delete Risiko
  const handleDeleteRisiko = async (id: string) => {
    if (!firestore || !confirm('Hapus baris pemetaan risiko bencana ini?')) return;
    try {
      await deleteDoc(doc(firestore, 'risikoBencana', id));
      toast({ title: 'Data Dihapus' });
    } catch (err: any) {
      toast({ title: 'Gagal Menghapus', description: err.message, variant: 'destructive' });
    }
  };

  // Save / Edit Tempat Evakuasi
  const handleSaveEvakuasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    try {
      if (editingEvakuasiId) {
        await updateDoc(doc(firestore, 'tempatEvakuasi', editingEvakuasiId), {
          ...evakuasiForm,
          updatedAt: serverTimestamp()
        });
        toast({ title: 'Tempat Evakuasi Diperbarui' });
      } else {
        await addDoc(collection(firestore, 'tempatEvakuasi'), {
          ...evakuasiForm,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast({ title: 'Tempat Evakuasi Ditambahkan' });
      }
      setIsEvakuasiModalOpen(false);
      setEditingEvakuasiId(null);
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err.message, variant: 'destructive' });
    }
  };

  // Delete Evakuasi
  const handleDeleteEvakuasi = async (id: string) => {
    if (!firestore || !confirm('Hapus data tempat evakuasi sementara ini?')) return;
    try {
      await deleteDoc(doc(firestore, 'tempatEvakuasi', id));
      toast({ title: 'Data Dihapus' });
    } catch (err: any) {
      toast({ title: 'Gagal Menghapus', description: err.message, variant: 'destructive' });
    }
  };

  // Inisialisasi Data Demo Bencana
  const handleSeedBencanaData = async () => {
    if (!firestore || !confirm('Inisialisasi data sampel Peta Rawan Bencana, Titik Kumpul, dan Risiko ke database?')) return;

    try {
      setIsSeeding(true);
      const batch = writeBatch(firestore);

      // 1. Config Peta
      const configRef = doc(firestore, 'rawanBencanaConfig', 'default');
      batch.set(configRef, {
        ...SEED_PETA_KEBENCANAAN,
        updatedAt: serverTimestamp()
      });

      // 2. Risiko Bencana
      SEED_RISIKO_BENCANA.forEach(item => {
        const docRef = doc(collection(firestore, 'risikoBencana'));
        batch.set(docRef, { ...item, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });

      // 3. Tempat Evakuasi
      SEED_TEMPAT_EVAKUASI.forEach(item => {
        const docRef = doc(collection(firestore, 'tempatEvakuasi'));
        batch.set(docRef, { ...item, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });

      await batch.commit();
      toast({
        title: 'Inisialisasi Data Sampel Berhasil',
        description: 'Data Peta, Risiko Bencana, dan Tempat Evakuasi Sampeldes telah terisi.'
      });
    } catch (err: any) {
      toast({ title: 'Gagal Inisialisasi', description: err.message, variant: 'destructive' });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 bg-[#070b10] rounded-[24px] border border-white/10 text-white">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold">
              Kesiapsiagaan &amp; Mitigasi
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-condensed font-bold uppercase tracking-tight text-white">
            Peta Rawan Bencana &amp; Jalur Evakuasi
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Atur gambar peta kebencanaan, rincian risiko per dusun, direktori Tempat Evakuasi Sementara (TES), serta panduan SOP tanggap darurat warga.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedBencanaData}
            disabled={isSeeding}
            className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10 font-bold text-xs rounded-xl gap-2 h-10 px-4"
          >
            {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Inisialisasi Data Bencana</span>
          </Button>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION (4 TABS) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#070b10] border border-white/10 rounded-2xl">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveSubTab('peta')}
          className={`rounded-xl text-xs font-bold uppercase tracking-wide px-3.5 py-2 h-9 transition-all ${activeSubTab === 'peta'
            ? 'bg-teal-500 text-slate-950 hover:bg-teal-500'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <Map className="h-3.5 w-3.5 mr-1.5" />
          Tab 1. Peta &amp; Narasi
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveSubTab('risiko')}
          className={`rounded-xl text-xs font-bold uppercase tracking-wide px-3.5 py-2 h-9 transition-all ${activeSubTab === 'risiko'
            ? 'bg-teal-500 text-slate-950 hover:bg-teal-500'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
          Tab 2. Risiko per Wilayah ({rawRisikoList?.length || 0})
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveSubTab('evakuasi')}
          className={`rounded-xl text-xs font-bold uppercase tracking-wide px-3.5 py-2 h-9 transition-all ${activeSubTab === 'evakuasi'
            ? 'bg-teal-500 text-slate-950 hover:bg-teal-500'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <LifeBuoy className="h-3.5 w-3.5 mr-1.5" />
          Tab 3. Titik Kumpul &amp; TES ({rawEvakuasiList?.length || 0})
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveSubTab('sop')}
          className={`rounded-xl text-xs font-bold uppercase tracking-wide px-3.5 py-2 h-9 transition-all ${activeSubTab === 'sop'
            ? 'bg-teal-500 text-slate-950 hover:bg-teal-500'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
        >
          <PhoneCall className="h-3.5 w-3.5 mr-1.5" />
          Tab 4. Panduan SOP &amp; Kontak Cepat
        </Button>
      </div>

      {/* ─── TAB 1: PETA & NARASI EDITOR ─── */}
      {activeSubTab === 'peta' && (
        <form onSubmit={handleSavePetaConfig} className="space-y-6">
          <Card className="bg-[#070b10] border-white/10 rounded-2xl text-white">
            <CardHeader className="p-5 sm:p-6 pb-2">
              <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Map className="h-4 w-4 text-teal-400" />
                <span>Konfigurasi Gambar Peta &amp; Isian Redaksi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-200">Judul Peta Kebencanaan</Label>
                <Input
                  required
                  value={petaForm.judulPeta || ''}
                  onChange={e => setPetaForm({ ...petaForm, judulPeta: e.target.value })}
                  placeholder="Contoh: Peta Tematik Kerawanan Bencana & Jalur Evakuasi Desa Sampeldes"
                  className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-200">Gambar Peta Kebencanaan</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={petaForm.gambarPetaUrl || ''}
                      onChange={e => setPetaForm({ ...petaForm, gambarPetaUrl: e.target.value })}
                      placeholder="URL Gambar Peta (https://...)"
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10 flex-1"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleUploadPeta}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-white/10 bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-10 px-3 shrink-0 gap-1.5 text-xs font-bold"
                    >
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      <span>Unggah Gambar</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-200">Bulan / Tahun Pemutakhiran</Label>
                  <Input
                    value={petaForm.tanggalUpdate || ''}
                    onChange={e => setPetaForm({ ...petaForm, tanggalUpdate: e.target.value })}
                    placeholder="Contoh: Oktober 2026"
                    className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                  />
                </div>
              </div>

              {/* PREVIEW GAMBAR PETA */}
              {petaForm.gambarPetaUrl && (
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-bold text-slate-400">Preview Visual Peta:</Label>
                  <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
                    <img
                      src={petaForm.gambarPetaUrl}
                      alt="Preview Peta"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-200">Deskripsi &amp; Narasi Kesiapsiagaan Warga</Label>
                <Textarea
                  rows={5}
                  value={petaForm.deskripsiNarasi || ''}
                  onChange={e => setPetaForm({ ...petaForm, deskripsiNarasi: e.target.value })}
                  placeholder="Jelaskan karakteristik kerawanan wilayah, petunjuk arah evakuasi, dan himbauan tanggap darurat..."
                  className="bg-slate-900 border-white/10 text-white rounded-xl text-xs leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSavingConfig}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold uppercase text-xs tracking-wider rounded-xl h-10 px-6 gap-2"
                >
                  {isSavingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Simpan Peta &amp; Narasi</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* ─── TAB 2: TABEL PEMETAAN RISIKO BENCANA ─── */}
      {activeSubTab === 'risiko' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Daftar Risiko Bencana per Wilayah ({rawRisikoList?.length || 0})
            </h3>
            <Button
              size="sm"
              onClick={() => {
                setEditingRisikoId(null);
                setRisikoForm({
                  jenisBencana: '',
                  lokasiRawan: '',
                  musimPemicu: '',
                  dampakPotensial: '',
                  rekomendasiMitigasi: '',
                  tingkatRisiko: 'Tinggi'
                });
                setIsRisikoModalOpen(true);
              }}
              className="bg-teal-500 text-slate-950 font-bold text-xs rounded-xl gap-1.5 h-9"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Risiko Bencana</span>
            </Button>
          </div>

          {isLoadingRisiko ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl bg-slate-900" />)}
            </div>
          ) : (!rawRisikoList || rawRisikoList.length === 0) ? (
            <div className="p-8 text-center bg-[#070b10] border border-white/10 rounded-2xl text-slate-400">
              Belum ada data risiko bencana. Klik &quot;Tambah Risiko Bencana&quot; atau &quot;Inisialisasi Data Bencana&quot;.
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#070b10] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0f172a] text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Jenis Ancaman Bencana</th>
                      <th className="py-3 px-4">Lokasi Rawan (Dusun/RT/RW)</th>
                      <th className="py-3 px-4">Musim / Pemicu Utama</th>
                      <th className="py-3 px-4">Dampak Potensial</th>
                      <th className="py-3 px-4">Rekomendasi Tindakan &amp; Mitigasi</th>
                      <th className="py-3 px-4 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {rawRisikoList.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${item.tingkatRisiko === 'Tinggi' ? 'bg-rose-500' : item.tingkatRisiko === 'Sedang' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} />
                            <span>{item.jenisBencana}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{item.lokasiRawan}</td>
                        <td className="py-3 px-4 text-slate-300">{item.musimPemicu}</td>
                        <td className="py-3 px-4 text-slate-300">{item.dampakPotensial}</td>
                        <td className="py-3 px-4 text-slate-300">{item.rekomendasiMitigasi}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingRisikoId(item.id || null);
                                setRisikoForm(item);
                                setIsRisikoModalOpen(true);
                              }}
                              className="h-8 w-8 text-slate-300 hover:text-white"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => item.id && handleDeleteRisiko(item.id)}
                              className="h-8 w-8 text-rose-400 hover:text-rose-200"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: TITIK KUMPUL & TEMPAT EVAKUASI (TES) ─── */}
      {activeSubTab === 'evakuasi' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Direktori Titik Kumpul &amp; Tempat Evakuasi Sementara ({rawEvakuasiList?.length || 0})
            </h3>
            <Button
              size="sm"
              onClick={() => {
                setEditingEvakuasiId(null);
                setEvakuasiForm({
                  kodeNama: '',
                  alamatDusun: '',
                  kapasitas: '',
                  fasilitas: '',
                  penanggungJawab: '',
                  fotoUrl: '',
                  statusKesiapan: 'Siap Digunakan'
                });
                setIsEvakuasiModalOpen(true);
              }}
              className="bg-teal-500 text-slate-950 font-bold text-xs rounded-xl gap-1.5 h-9"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Lokasi TES</span>
            </Button>
          </div>

          {isLoadingEvakuasi ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl bg-slate-900" />)}
            </div>
          ) : (!rawEvakuasiList || rawEvakuasiList.length === 0) ? (
            <div className="p-8 text-center bg-[#070b10] border border-white/10 rounded-2xl text-slate-400">
              Belum ada lokasi evakuasi sementara. Klik &quot;Tambah Lokasi TES&quot;.
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#070b10] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0f172a] text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Kode &amp; Nama Lokasi</th>
                      <th className="py-3 px-4">Alamat / Dusun</th>
                      <th className="py-3 px-4">Kapasitas Tampung</th>
                      <th className="py-3 px-4">Fasilitas Tersedia</th>
                      <th className="py-3 px-4">Penanggung Jawab (PIC)</th>
                      <th className="py-3 px-4 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {rawEvakuasiList.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-white">
                          <div>{item.kodeNama}</div>
                          {item.statusKesiapan && (
                            <span className="text-[10px] text-emerald-400 font-mono">{item.statusKesiapan}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{item.alamatDusun}</td>
                        <td className="py-3 px-4 font-mono font-bold text-teal-400">{item.kapasitas}</td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs">{item.fasilitas}</td>
                        <td className="py-3 px-4 text-slate-300">{item.penanggungJawab}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingEvakuasiId(item.id || null);
                                setEvakuasiForm(item);
                                setIsEvakuasiModalOpen(true);
                              }}
                              className="h-8 w-8 text-slate-300 hover:text-white"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => item.id && handleDeleteEvakuasi(item.id)}
                              className="h-8 w-8 text-rose-400 hover:text-rose-200"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: PANDUAN SOP & KONTAK CEPAT (INFO RESMI) ─── */}
      {activeSubTab === 'sop' && (
        <div className="space-y-6">
          <Card className="bg-[#070b10] border-white/10 rounded-2xl text-white">
            <CardHeader className="p-5 sm:p-6 pb-2">
              <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-emerald-400" />
                <span>Direktori Kontak Cepat Tanggap Darurat Bencana</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SEED_KONTAK_DARURAT.map((kontak, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-900 border border-white/10 space-y-1.5">
                    <div className="font-bold text-xs text-white line-clamp-1">{kontak.namaInstansi}</div>
                    <div className="font-mono text-sm font-bold text-teal-400">{kontak.nomorTelepon}</div>
                    <div className="text-[10px] text-slate-400">{kontak.peran} ({kontak.layananJam})</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#070b10] border-white/10 rounded-2xl text-white">
            <CardHeader className="p-5 sm:p-6 pb-2">
              <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-teal-400" />
                <span>Panduan SOP Tanggap Darurat Bencana (3 Tahapan Resmi)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              {SEED_SOP_BENCANA.map((sop, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-400 text-[10px] font-bold uppercase">
                      {sop.fase.toUpperCase()}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{sop.judul}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400">{sop.deskripsi}</p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 pt-1">
                    {sop.langkah.map((l, j) => (
                      <li key={j} className="leading-relaxed">{l}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── MODAL FORM RISIKO BENCANA ─── */}
      <Dialog open={isRisikoModalOpen} onOpenChange={setIsRisikoModalOpen}>
        <DialogContent className="max-w-xl bg-[#070b10] border-white/10 text-white p-5 sm:p-7">
          <DialogHeader>
            <DialogTitle className="text-lg font-condensed font-bold uppercase text-white">
              {editingRisikoId ? 'Edit Risiko Bencana' : 'Tambah Pemetaan Risiko Bencana'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Isi parameter identifikasi potensi ancaman bahaya per dusun/wilayah.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveRisiko} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-200">Jenis Ancaman Bencana</Label>
              <Input
                required
                placeholder="Contoh: Banjir Luapan / Genangan Sungai"
                value={risikoForm.jenisBencana || ''}
                onChange={e => setRisikoForm({ ...risikoForm, jenisBencana: e.target.value })}
                className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-200">Lokasi Rawan (Dusun / RT / RW)</Label>
              <Input
                required
                placeholder="Contoh: Dusun Pangampiran (RT 01, 02 / RW 01)"
                value={risikoForm.lokasiRawan || ''}
                onChange={e => setRisikoForm({ ...risikoForm, lokasiRawan: e.target.value })}
                className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-200">Musim / Pemicu Utama</Label>
                <Input
                  required
                  placeholder="Contoh: Puncak Hujan (Desember - Februari)"
                  value={risikoForm.musimPemicu || ''}
                  onChange={e => setRisikoForm({ ...risikoForm, musimPemicu: e.target.value })}
                  className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-200">Tingkat Risiko</Label>
                <Select
                  value={risikoForm.tingkatRisiko || 'Tinggi'}
                  onValueChange={v => setRisikoForm({ ...risikoForm, tingkatRisiko: v })}
                >
                  <SelectTrigger className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="Tinggi">Tinggi (Zona Merah)</SelectItem>
                    <SelectItem value="Sedang">Sedang (Zona Kuning)</SelectItem>
                    <SelectItem value="Rendah">Rendah (Zona Waspada)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-200">Dampak Potensial</Label>
              <Textarea
                rows={2}
                required
                placeholder="Contoh: Tergenangnya sawah, jalan terhambat, air masuk ke rumah warga..."
                value={risikoForm.dampakPotensial || ''}
                onChange={e => setRisikoForm({ ...risikoForm, dampakPotensial: e.target.value })}
                className="bg-slate-900 border-white/10 text-white rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-200">Rekomendasi Tindakan &amp; Mitigasi</Label>
              <Textarea
                rows={2}
                required
                placeholder="Contoh: Normalisasi saluran, siaga pompa alkon, peninggian tanggul karung pasir..."
                value={risikoForm.rekomendasiMitigasi || ''}
                onChange={e => setRisikoForm({ ...risikoForm, rekomendasiMitigasi: e.target.value })}
                className="bg-slate-900 border-white/10 text-white rounded-xl text-xs"
              />
            </div>
            <DialogFooter className="pt-3">
              <Button type="button" variant="ghost" onClick={() => setIsRisikoModalOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-teal-500 text-slate-950 font-bold">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL FORM TEMPAT EVAKUASI (TES) ─── */}
      <Dialog open={isEvakuasiModalOpen} onOpenChange={setIsEvakuasiModalOpen}>
        <DialogContent className="max-w-xl bg-[#070b10] border-white/10 text-white p-5 sm:p-7">
          <DialogHeader>
            <DialogTitle className="text-lg font-condensed font-bold uppercase text-white">
              {editingEvakuasiId ? 'Edit Lokasi Evakuasi' : 'Tambah Tempat Evakuasi Sementara (TES)'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Isi data fasilitas penampungan dan titik kumpul darurat warga.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEvakuasi} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-200">Kode &amp; Nama Lokasi</Label>
              <Input
                required
                placeholder="Contoh: TES-01: Kompleks Kantor & Balai Desa Sampeldes"
                value={evakuasiForm.kodeNama || ''}
                onChange={e => setEvakuasiForm({ ...evakuasiForm, kodeNama: e.target.value })}
                className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-200">Alamat / Dusun</Label>
                <Input
                  required
                  placeholder="Contoh: Jl. Raya Sampeldes No. 01, Dusun Sampeldes"
                  value={evakuasiForm.alamatDusun || ''}
                  onChange={e => setEvakuasiForm({ ...evakuasiForm, alamatDusun: e.target.value })}
                  className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-200">Kapasitas Tampung</Label>
                <Input
                  required
                  placeholder="Contoh: 250 Jiwa (±65 KK)"
                  value={evakuasiForm.kapasitas || ''}
                  onChange={e => setEvakuasiForm({ ...evakuasiForm, kapasitas: e.target.value })}
                  className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-200">Fasilitas Tersedia</Label>
              <Textarea
                rows={2}
                required
                placeholder="Contoh: Pendopo, Aula, Dapur Umum, 4 Toilet, Genset 5 KVA, Posko Medis..."
                value={evakuasiForm.fasilitas || ''}
                onChange={e => setEvakuasiForm({ ...evakuasiForm, fasilitas: e.target.value })}
                className="bg-slate-900 border-white/10 text-white rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-200">Penanggung Jawab Lokasi (PIC)</Label>
              <Input
                required
                placeholder="Contoh: Bpk. Kades & Sekdes (0812-3456-7890)"
                value={evakuasiForm.penanggungJawab || ''}
                onChange={e => setEvakuasiForm({ ...evakuasiForm, penanggungJawab: e.target.value })}
                className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-200">Foto Lokasi (Opsional)</Label>
              <Input
                placeholder="URL Foto (https://...)"
                value={evakuasiForm.fotoUrl || ''}
                onChange={e => setEvakuasiForm({ ...evakuasiForm, fotoUrl: e.target.value })}
                className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
              />
            </div>
            <DialogFooter className="pt-3">
              <Button type="button" variant="ghost" onClick={() => setIsEvakuasiModalOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-teal-500 text-slate-950 font-bold">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
