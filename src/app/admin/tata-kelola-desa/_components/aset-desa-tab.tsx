'use client';

import { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { uploadToCloudinary } from '@/lib/upload-cloudinary';
import { AsetDesa, KategoriAsetDesa } from '@/lib/types';
import {
  Plus,
  Trash2,
  Edit3,
  Upload,
  Loader2,
  Image as ImageIcon,
  X,
  Search,
  MapPin,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  Check,
  Building,
  Car,
  Tractor,
  Landmark,
  FileSpreadsheet,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

export const SEED_ASET_DESA: AsetDesa[] = [
  // 1. Tanah Kas Desa
  {
    kategori: 'tanah',
    kodeAset: 'TKD-BLS-01',
    namaAset: 'Tanah Kas Desa Blok Sawah Cengkelek',
    lokasi: 'Dusun Pangampiran RT 02 / RW 01',
    luas: '14.500 m²',
    buktiKepemilikan: 'Letter C Desa No. 124',
    pemanfaatan: 'Sawah Kas Desa (Lelang Terbuka)',
    kontribusiPades: 'Rp 22.500.000 / Tahun',
    keterangan: 'Tanah produktif dengan irigasi teknis lancar sepanjang tahun',
    fotoUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop'
  },
  {
    kategori: 'tanah',
    kodeAset: 'TKD-BLS-02',
    namaAset: 'Tanah Bengkok Kepala Desa & Sekdes',
    lokasi: 'Dusun Ciloning RT 01 / RW 02',
    luas: '25.000 m²',
    buktiKepemilikan: 'Letter C Desa No. 002',
    pemanfaatan: 'Tanah Bengkok / Garapan Pertanian',
    kontribusiPades: 'Tunjangan Jabatan SOTK',
    keterangan: 'Garapan padi sawah kelas I sesuai Perdes SOTK',
    fotoUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1200&auto=format&fit=crop'
  },
  {
    kategori: 'tanah',
    kodeAset: 'TKD-BLS-03',
    namaAset: 'Tanah Lapangan Olahraga & Balai Desa',
    lokasi: 'Dusun Sampeldes RT 01 / RW 02',
    luas: '8.200 m²',
    buktiKepemilikan: 'Sertifikat Hak Pakai No. 05',
    pemanfaatan: 'Fasilitas Umum & Olahraga Warga',
    kontribusiPades: 'Pemanfaatan Publik Gratis',
    keterangan: 'Pusat kegiatan upacara kemerdekaan, turnamen bola, dan senam warga',
    fotoUrl: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=1200&auto=format&fit=crop'
  },
  {
    kategori: 'tanah',
    kodeAset: 'TKD-BLS-04',
    namaAset: 'Tanah Kas Desa Blok Kebun Karetan',
    lokasi: 'Dusun Ciloning RT 04 / RW 02',
    luas: '11.800 m²',
    buktiKepemilikan: 'Letter C Desa No. 215',
    pemanfaatan: 'Kebun Palawija & Sewa Poktan',
    kontribusiPades: 'Rp 14.000.000 / Tahun',
    keterangan: 'Ditanami jagung hibrida dan kedelai bekerjasama dengan Poktan',
    fotoUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69102656?q=80&w=1200&auto=format&fit=crop'
  },

  // 2. Gedung & Bangunan
  {
    kategori: 'gedung',
    namaBangunan: 'Kantor & Balai Pertemuan Desa Sampeldes',
    lokasi: 'Jl. Raya Sampeldes No. 01, Dusun Sampeldes',
    luasBangunan: '450 m²',
    tahunBangun: '2016 / Rehab 2024',
    sumberAnggaran: 'Alokasi Dana Desa (ADD) & Banprov',
    statusPemanfaatan: 'Kantor Pelayanan Administrasi & Balai Musyawarah',
    keterangan: 'Lengkap dengan ruang pelayanan terpadu, aula pertemuan, dan ruang BPD',
    fotoUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=1200&auto=format&fit=crop'
  },
  {
    kategori: 'gedung',
    namaBangunan: 'Gedung Pos Kesehatan Desa (PKD / Polindes)',
    lokasi: 'Dusun Sampeldes RT 02 / RW 02',
    luasBangunan: '120 m²',
    tahunBangun: '2019 / Rehab 2023',
    sumberAnggaran: 'Dana Desa (DD)',
    statusPemanfaatan: 'Pelayanan Kesehatan Dasar & Posyandu Terpadu',
    keterangan: 'Fasilitas ruang bidan desa, ruang periksa ibu hamil, dan ruang obat',
    fotoUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?q=80&w=1200&auto=format&fit=crop'
  },
  {
    kategori: 'gedung',
    namaBangunan: 'Gedung Serbaguna & Balai Kesenian Rakyat',
    lokasi: 'Dusun Pangampiran RT 01 / RW 01',
    luasBangunan: '280 m²',
    tahunBangun: '2021',
    sumberAnggaran: 'Bantuan Keuangan Provinsi & DD',
    statusPemanfaatan: 'Kegiatan Kepemudaan, Olahraga Indoor & UMKM',
    keterangan: 'Dapat digunakan untuk latihan bulu tangkis, pentas seni kenthongan, dan pameran desa',
    fotoUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200&auto=format&fit=crop'
  },
  {
    kategori: 'gedung',
    namaBangunan: 'Gudang Logistik & Lumbung Pangan Desa',
    lokasi: 'Dusun Ciloning RT 03 / RW 02',
    luasBangunan: '160 m²',
    tahunBangun: '2022',
    sumberAnggaran: 'Dana Desa (DD) Bidang Ketahanan Pangan',
    statusPemanfaatan: 'Penyimpanan Alsintan & Cadangan Gabah Pertanian',
    keterangan: 'Dilengkapi lantai jemur gabah dan ruang penyimpanan mesin pertanian',
    fotoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop'
  },

  // 3. Kendaraan Operasional & Layanan
  {
    kategori: 'kendaraan',
    jenisMerk: 'Mobil Ambulans Siaga Desa - Suzuki APV Luxury Ambulance',
    nomorPolisi: 'R 9981 XB (Plat Merah)',
    tahunPerolehan: '2021',
    sumberDana: 'Dana Desa (DD) TA 2021',
    kondisi: 'Baik',
    penanggungJawab: 'Layanan Siaga Darurat 24 Jam / Driver: Bpk. Taryono (0857-1234-5678)',
    keterangan: 'Fasilitas oksigen portable, brankar darurat, sirine, dan kotak P3K lengkap',
    fotoUrl: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?q=80&w=1200&auto=format&fit=crop'
  },
  {
    kategori: 'kendaraan',
    jenisMerk: 'Mobil Patroli Linmas & Operasional - Daihatsu Gran Max Pickup',
    nomorPolisi: 'R 9982 XB (Plat Merah)',
    tahunPerolehan: '2020',
    sumberDana: 'Alokasi Dana Desa (ADD) & PADes',
    kondisi: 'Baik',
    penanggungJawab: 'Seksi Ketenteraman & Ketertiban Desa (Kasi Trantib)',
    keterangan: 'Operasional ronda malam gabungan, pengangkutan sampah, dan tanggap bencana',
    fotoUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1200&auto=format&fit=crop'
  },
  {
    kategori: 'kendaraan',
    jenisMerk: 'Sepeda Motor Dinas Pelayanan - Honda Supra X 125 FI',
    nomorPolisi: 'R 2315 TB',
    tahunPerolehan: '2019',
    sumberDana: 'Bagi Hasil Pajak & Retribusi (BHPR)',
    kondisi: 'Baik',
    penanggungJawab: 'Kaur Keuangan & Pengurusan Administrasi Lapangan',
    keterangan: 'Kondisi mesin terawat, servis rutin AHASS berkala',
    fotoUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1200&auto=format&fit=crop'
  },
  {
    kategori: 'kendaraan',
    jenisMerk: 'Sepeda Motor Dinas Petugas Lapangan - Yamaha Jupiter Z1',
    nomorPolisi: 'R 2418 TB',
    tahunPerolehan: '2018',
    sumberDana: 'Alokasi Dana Desa (ADD)',
    kondisi: 'Rusak Ringan',
    penanggungJawab: 'Kadus Pangampiran (Dalam Jadwal Perawatan Servis)',
    keterangan: 'Rencana pergantian ban dan rantai roda pada triwulan ini',
    fotoUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=1200&auto=format&fit=crop'
  },

  // 4. Alat Pertanian (Alsintan) & Sarana Pemberdayaan
  {
    kategori: 'alsintan',
    namaAlat: 'Traktor Roda 2 (Hand Tractor) Quick Kubota RD 85',
    jumlah: '3 Unit',
    tahunSumberDana: '2022 - Bantuan Kementan & APBD Kab. Cilacap',
    kondisi: 'Baik',
    pengelola: 'Gapoktan Tani Makmur Sampeldes',
    statusPinjam: 'Tersedia / Siap Pinjam Pakai Kelompok Tani',
    keterangan: 'Dipakai bergiliran sesuai jadwal olah tanah masa tanam padi',
    fotoUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=1200&auto=format&fit=crop'
  },
  {
    kategori: 'alsintan',
    namaAlat: 'Mesin Pompa Air Irigasi 3 Inch (Alkon Diesel)',
    jumlah: '4 Unit',
    tahunSumberDana: '2023 - Dana Desa (DD) Ketahanan Pangan',
    kondisi: 'Baik',
    pengelola: 'Poktan Sumber Rejeki (Dusun Pangampiran & Ciloning)',
    statusPinjam: 'Sedang Dipakai Pengairan Masa Tanam II',
    keterangan: 'Membantu pompanisasi sawah tadah hujan saat kemarau',
    fotoUrl: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?q=80&w=1200&auto=format&fit=crop'
  },
  {
    kategori: 'alsintan',
    namaAlat: 'Mesin Perontok Padi Multifungsi (Power Thresher)',
    jumlah: '2 Unit',
    tahunSumberDana: '2021 - Banprov Jawa Tengah',
    kondisi: 'Baik',
    pengelola: 'Gapoktan Tani Makmur Sampeldes',
    statusPinjam: 'Tersedia di Gudang Lumbung Desa',
    keterangan: 'Kapasitas perontok hingga 800 kg gabah/jam dengan efisiensi tinggi',
    fotoUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=1200&auto=format&fit=crop'
  },
  {
    kategori: 'alsintan',
    namaAlat: 'Drone Sprayer Pupuk & Pestisida Pertanian 16L',
    jumlah: '1 Unit',
    tahunSumberDana: '2024 - Dana Desa (Inovasi Pertanian Presisi)',
    kondisi: 'Baik',
    pengelola: 'Unit Usaha Pertanian BUMDes Sampeldes',
    statusPinjam: 'Standby Operator Terlatih BUMDes',
    keterangan: 'Layanan penyemprotan massal pupuk cair organik untuk petani desa',
    fotoUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1200&auto=format&fit=crop'
  }
];

export function AsetDesaTab() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [activeSubTab, setActiveSubTab] = useState<KategoriAsetDesa>('tanah');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<AsetDesa | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<AsetDesa>>({
    kategori: 'tanah',
    kodeAset: '',
    namaAset: '',
    lokasi: '',
    luas: '',
    buktiKepemilikan: 'Letter C Desa',
    pemanfaatan: 'Sawah Kas Desa',
    kontribusiPades: '',
    namaBangunan: '',
    luasBangunan: '',
    tahunBangun: '',
    sumberAnggaran: 'Dana Desa (DD)',
    statusPemanfaatan: 'Aktif Pelayanan',
    jenisMerk: '',
    nomorPolisi: '',
    tahunPerolehan: '',
    sumberDana: 'Dana Desa (DD)',
    kondisi: 'Baik',
    penanggungJawab: '',
    namaAlat: '',
    jumlah: '1 Unit',
    tahunSumberDana: '',
    pengelola: '',
    statusPinjam: 'Tersedia',
    keterangan: '',
    fotoUrl: ''
  });

  // Query
  const asetQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'asetDesa'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: rawAsetList, isLoading } = useCollection<AsetDesa>(asetQuery);

  // Filtered List
  const asetList = useMemo(() => {
    const list = rawAsetList || [];
    return list.filter(item => {
      if (item.kategori !== activeSubTab) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.namaAset?.toLowerCase().includes(q) ||
        item.kodeAset?.toLowerCase().includes(q) ||
        item.namaBangunan?.toLowerCase().includes(q) ||
        item.jenisMerk?.toLowerCase().includes(q) ||
        item.nomorPolisi?.toLowerCase().includes(q) ||
        item.namaAlat?.toLowerCase().includes(q) ||
        item.lokasi?.toLowerCase().includes(q) ||
        item.pengelola?.toLowerCase().includes(q) ||
        item.penanggungJawab?.toLowerCase().includes(q)
      );
    });
  }, [rawAsetList, activeSubTab, searchQuery]);

  // Summary counts
  const summaryCounts = useMemo(() => {
    const list = rawAsetList || [];
    return {
      tanah: list.filter(i => i.kategori === 'tanah').length,
      gedung: list.filter(i => i.kategori === 'gedung').length,
      kendaraan: list.filter(i => i.kategori === 'kendaraan').length,
      alsintan: list.filter(i => i.kategori === 'alsintan').length,
      total: list.length
    };
  }, [rawAsetList]);

  // Open Add Dialog
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      kategori: activeSubTab,
      kodeAset: '',
      namaAset: '',
      lokasi: '',
      luas: '',
      buktiKepemilikan: 'Letter C Desa',
      pemanfaatan: 'Sawah Kas Desa',
      kontribusiPades: '',
      namaBangunan: '',
      luasBangunan: '',
      tahunBangun: '',
      sumberAnggaran: 'Dana Desa (DD)',
      statusPemanfaatan: 'Aktif Pelayanan',
      jenisMerk: '',
      nomorPolisi: '',
      tahunPerolehan: '',
      sumberDana: 'Dana Desa (DD)',
      kondisi: 'Baik',
      penanggungJawab: '',
      namaAlat: '',
      jumlah: '1 Unit',
      tahunSumberDana: '',
      pengelola: '',
      statusPinjam: 'Tersedia',
      keterangan: '',
      fotoUrl: ''
    });
    setIsDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item: AsetDesa) => {
    setEditingId(item.id || null);
    setFormData({
      kategori: item.kategori,
      kodeAset: item.kodeAset || '',
      namaAset: item.namaAset || '',
      lokasi: item.lokasi || '',
      luas: item.luas || '',
      buktiKepemilikan: item.buktiKepemilikan || 'Letter C Desa',
      pemanfaatan: item.pemanfaatan || 'Sawah Kas Desa',
      kontribusiPades: item.kontribusiPades || '',
      namaBangunan: item.namaBangunan || '',
      luasBangunan: item.luasBangunan || '',
      tahunBangun: item.tahunBangun || '',
      sumberAnggaran: item.sumberAnggaran || 'Dana Desa (DD)',
      statusPemanfaatan: item.statusPemanfaatan || 'Aktif Pelayanan',
      jenisMerk: item.jenisMerk || '',
      nomorPolisi: item.nomorPolisi || '',
      tahunPerolehan: item.tahunPerolehan || '',
      sumberDana: item.sumberDana || 'Dana Desa (DD)',
      kondisi: item.kondisi || 'Baik',
      penanggungJawab: item.penanggungJawab || '',
      namaAlat: item.namaAlat || '',
      jumlah: item.jumlah || '1 Unit',
      tahunSumberDana: item.tahunSumberDana || '',
      pengelola: item.pengelola || '',
      statusPinjam: item.statusPinjam || 'Tersedia',
      keterangan: item.keterangan || '',
      fotoUrl: item.fotoUrl || ''
    });
    setIsDialogOpen(true);
  };

  // Upload Photo
  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadToCloudinary(file, 'aset_desa');
      setFormData(prev => ({ ...prev, fotoUrl: url }));
      toast({
        title: 'Foto Berhasil Diunggah',
        description: 'Tautan foto aset berhasil diperbarui.'
      });
    } catch (err: any) {
      toast({
        title: 'Gagal Mengunggah Foto',
        description: err.message || 'Terjadi kesalahan jaringan.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    try {
      const payload: Partial<AsetDesa> = {
        ...formData,
        kategori: activeSubTab,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(firestore, 'asetDesa', editingId), payload);
        toast({
          title: 'Aset Berhasil Diperbarui',
          description: 'Data aset desa telah disimpan di database.'
        });
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(firestore, 'asetDesa'), payload);
        toast({
          title: 'Aset Berhasil Ditambahkan',
          description: 'Aset baru telah tercatat dalam sistem informasi desa.'
        });
      }

      setIsDialogOpen(false);
      setEditingId(null);
    } catch (err: any) {
      toast({
        title: 'Gagal Menyimpan Data',
        description: err.message || 'Terjadi kesalahan saat menyimpan ke Firestore.',
        variant: 'destructive'
      });
    }
  };

  // Delete Action
  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (!confirm('Apakah Anda yakin ingin menghapus data aset ini? Tindakan ini tidak dapat dibatalkan.')) return;

    try {
      setIsDeleting(true);
      await deleteDoc(doc(firestore, 'asetDesa', id));
      toast({
        title: 'Aset Dihapus',
        description: 'Data aset desa telah dihapus dari sistem.'
      });
      if (selectedDetail?.id === id) {
        setIsDetailOpen(false);
        setSelectedDetail(null);
      }
    } catch (err: any) {
      toast({
        title: 'Gagal Menghapus',
        description: err.message || 'Terjadi kendala saat menghapus data.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Inisialisasi Data Demo
  const handleSeedDemoData = async () => {
    if (!firestore) return;
    if (!confirm('Inisialisasi data sampel resmi Aset Desa Sampeldes ke dalam database?')) return;

    try {
      setIsSeeding(true);
      const batch = writeBatch(firestore);
      const asetCol = collection(firestore, 'asetDesa');

      SEED_ASET_DESA.forEach(item => {
        const newDocRef = doc(asetCol);
        batch.set(newDocRef, {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      toast({
        title: 'Inisialisasi Data Sampel Berhasil',
        description: `${SEED_ASET_DESA.length} data aset desa Sampeldes telah ditambahkan ke database.`
      });
    } catch (err: any) {
      toast({
        title: 'Gagal Inisialisasi Data',
        description: err.message || 'Gagal menyimpan batch data.',
        variant: 'destructive'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const getSubTabTitle = () => {
    switch (activeSubTab) {
      case 'tanah': return 'Aset Tanah Kas Desa (TKD)';
      case 'gedung': return 'Gedung & Bangunan Desa';
      case 'kendaraan': return 'Kendaraan Operasional & Layanan (Ambulans / Siaga)';
      case 'alsintan': return 'Alat Pertanian (Alsintan) & Sarana Pemberdayaan';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 bg-[#070b10] rounded-[24px] border border-white/10 text-white">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg">
              <Landmark className="h-4 w-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-bold">
              Manajemen Inventarisasi
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-condensed font-bold uppercase tracking-tight text-white">
            Inventaris &amp; Aset Milik Desa
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Kelola pencatatan tanah kas desa, gedung pemerintahan, kendaraan operasional (ambulans/siaga), dan sarana pertanian warga secara transparan dan akuntabel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {(!rawAsetList || rawAsetList.length === 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDemoData}
              disabled={isSeeding}
              className="border-teal-500/40 text-teal-400 hover:bg-teal-500/10 font-bold text-xs rounded-xl gap-2 h-10 px-4"
            >
              {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>Inisialisasi Data Sampel</span>
            </Button>
          )}

          <Button
            onClick={handleOpenAdd}
            className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold uppercase text-xs tracking-wider rounded-xl gap-2 h-10 px-5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Aset {activeSubTab === 'tanah' ? 'Tanah' : activeSubTab === 'gedung' ? 'Gedung' : activeSubTab === 'kendaraan' ? 'Kendaraan' : 'Alsintan'}</span>
          </Button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveSubTab('tanah')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${activeSubTab === 'tanah'
              ? 'bg-[#0f172a] border-teal-500 shadow-md shadow-teal-500/20'
              : 'bg-[#070b10] border-white/10 hover:border-white/20'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tanah Kas Desa</span>
            <div className={`p-2 rounded-xl ${activeSubTab === 'tanah' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-teal-400'}`}>
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-condensed font-extrabold text-white">{summaryCounts.tanah}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Bidang Tanah Terinventarisir</p>
          </div>
        </div>

        <div
          onClick={() => setActiveSubTab('gedung')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${activeSubTab === 'gedung'
              ? 'bg-[#0f172a] border-teal-500 shadow-md shadow-teal-500/20'
              : 'bg-[#070b10] border-white/10 hover:border-white/20'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gedung &amp; Bangunan</span>
            <div className={`p-2 rounded-xl ${activeSubTab === 'gedung' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-teal-400'}`}>
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-condensed font-extrabold text-white">{summaryCounts.gedung}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Unit Fasilitas Pemerintahan</p>
          </div>
        </div>

        <div
          onClick={() => setActiveSubTab('kendaraan')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${activeSubTab === 'kendaraan'
              ? 'bg-[#0f172a] border-teal-500 shadow-md shadow-teal-500/20'
              : 'bg-[#070b10] border-white/10 hover:border-white/20'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kendaraan Siaga</span>
            <div className={`p-2 rounded-xl ${activeSubTab === 'kendaraan' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-teal-400'}`}>
              <Car className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-condensed font-extrabold text-white">{summaryCounts.kendaraan}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Unit Ambulans &amp; Operasional</p>
          </div>
        </div>

        <div
          onClick={() => setActiveSubTab('alsintan')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${activeSubTab === 'alsintan'
              ? 'bg-[#0f172a] border-teal-500 shadow-md shadow-teal-500/20'
              : 'bg-[#070b10] border-white/10 hover:border-white/20'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alsintan &amp; Sarana</span>
            <div className={`p-2 rounded-xl ${activeSubTab === 'alsintan' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-teal-400'}`}>
              <Tractor className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-condensed font-extrabold text-white">{summaryCounts.alsintan}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Unit Alat Pertanian Kelompok</p>
          </div>
        </div>
      </div>

      {/* SUB-TABS SELECTOR & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-[#070b10] border border-white/10 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('tanah')}
            className={`rounded-xl text-xs font-bold uppercase tracking-wide px-3.5 py-2 h-9 transition-all ${activeSubTab === 'tanah'
                ? 'bg-teal-500 text-slate-950 hover:bg-teal-500'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Landmark className="h-3.5 w-3.5 mr-1.5" />
            1. Tanah Kas Desa
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('gedung')}
            className={`rounded-xl text-xs font-bold uppercase tracking-wide px-3.5 py-2 h-9 transition-all ${activeSubTab === 'gedung'
                ? 'bg-teal-500 text-slate-950 hover:bg-teal-500'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Building className="h-3.5 w-3.5 mr-1.5" />
            2. Gedung &amp; Bangunan
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('kendaraan')}
            className={`rounded-xl text-xs font-bold uppercase tracking-wide px-3.5 py-2 h-9 transition-all ${activeSubTab === 'kendaraan'
                ? 'bg-teal-500 text-slate-950 hover:bg-teal-500'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Car className="h-3.5 w-3.5 mr-1.5" />
            3. Kendaraan &amp; Ambulans
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('alsintan')}
            className={`rounded-xl text-xs font-bold uppercase tracking-wide px-3.5 py-2 h-9 transition-all ${activeSubTab === 'alsintan'
                ? 'bg-teal-500 text-slate-950 hover:bg-teal-500'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Tractor className="h-3.5 w-3.5 mr-1.5" />
            4. Alsintan &amp; Sarana
          </Button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aset..."
            className="pl-9 h-9 bg-slate-900 border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus-visible:ring-teal-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* TABLE / CARD VIEW */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-20 w-full rounded-2xl bg-slate-900/60" />
          ))}
        </div>
      ) : asetList.length === 0 ? (
        <Card className="bg-[#070b10] border-white/10 rounded-2xl py-12 text-center">
          <CardContent className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Belum Ada Data {getSubTabTitle()}</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchQuery
                ? 'Tidak ditemukan data yang cocok dengan kata kunci pencarian Anda.'
                : 'Silakan klik tombol "Tambah Aset" atau gunakan "Inisialisasi Data Sampel" untuk memulai pencatatan.'}
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <Button
                size="sm"
                onClick={handleOpenAdd}
                className="bg-teal-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Tambah Aset Sekarang
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#070b10] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f172a] text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  {activeSubTab === 'tanah' && (
                    <>
                      <th className="py-3.5 px-4">Kode &amp; Nama Aset</th>
                      <th className="py-3.5 px-4">Lokasi (Blok/Dusun)</th>
                      <th className="py-3.5 px-4">Luas</th>
                      <th className="py-3.5 px-4">Bukti Kepemilikan</th>
                      <th className="py-3.5 px-4">Pemanfaatan Saat Ini</th>
                      <th className="py-3.5 px-4">Kontribusi PADes / Ket.</th>
                    </>
                  )}
                  {activeSubTab === 'gedung' && (
                    <>
                      <th className="py-3.5 px-4">Nama Bangunan</th>
                      <th className="py-3.5 px-4">Lokasi</th>
                      <th className="py-3.5 px-4">Luas Bangunan</th>
                      <th className="py-3.5 px-4">Tahun Bangun/Rehab</th>
                      <th className="py-3.5 px-4">Sumber Anggaran</th>
                      <th className="py-3.5 px-4">Status Pemanfaatan</th>
                    </>
                  )}
                  {activeSubTab === 'kendaraan' && (
                    <>
                      <th className="py-3.5 px-4">Jenis &amp; Merk</th>
                      <th className="py-3.5 px-4">Nomor Polisi</th>
                      <th className="py-3.5 px-4">Tahun Perolehan</th>
                      <th className="py-3.5 px-4">Sumber Dana</th>
                      <th className="py-3.5 px-4">Kondisi</th>
                      <th className="py-3.5 px-4">Peruntukan &amp; PIC</th>
                    </>
                  )}
                  {activeSubTab === 'alsintan' && (
                    <>
                      <th className="py-3.5 px-4">Nama Alat / Barang</th>
                      <th className="py-3.5 px-4">Jumlah</th>
                      <th className="py-3.5 px-4">Tahun &amp; Sumber Dana</th>
                      <th className="py-3.5 px-4">Kondisi</th>
                      <th className="py-3.5 px-4">Pengelola / Pemegang</th>
                      <th className="py-3.5 px-4">Status Pinjam Pakai</th>
                    </>
                  )}
                  <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {asetList.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">{idx + 1}</td>

                    {/* TAB 1: TANAH */}
                    {activeSubTab === 'tanah' && (
                      <>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{item.namaAset}</div>
                          <div className="text-[10px] font-mono text-teal-400 mt-0.5">{item.kodeAset || '-'}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{item.lokasi || '-'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-white">{item.luas || '-'}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-medium text-slate-300 border border-white/10">
                            {item.buktiKepemilikan || '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{item.pemanfaatan || '-'}</td>
                        <td className="py-3.5 px-4 font-medium text-emerald-400">{item.kontribusiPades || '-'}</td>
                      </>
                    )}

                    {/* TAB 2: GEDUNG */}
                    {activeSubTab === 'gedung' && (
                      <>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{item.namaBangunan}</div>
                          {item.keterangan && <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.keterangan}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{item.lokasi || '-'}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-white">{item.luasBangunan || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-300">{item.tahunBangun || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-300">{item.sumberAnggaran || '-'}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-950/60 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                            {item.statusPemanfaatan || '-'}
                          </span>
                        </td>
                      </>
                    )}

                    {/* TAB 3: KENDARAAN */}
                    {activeSubTab === 'kendaraan' && (
                      <>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{item.jenisMerk}</div>
                          {item.keterangan && <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.keterangan}</div>}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-400">{item.nomorPolisi || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-300">{item.tahunPerolehan || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-300">{item.sumberDana || '-'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.kondisi?.toLowerCase().includes('baik')
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                              : item.kondisi?.toLowerCase().includes('berat')
                                ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                                : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                            }`}>
                            {item.kondisi || 'Baik'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{item.penanggungJawab || '-'}</td>
                      </>
                    )}

                    {/* TAB 4: ALSINTAN */}
                    {activeSubTab === 'alsintan' && (
                      <>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{item.namaAlat}</div>
                          {item.keterangan && <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.keterangan}</div>}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-white">{item.jumlah || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-300">{item.tahunSumberDana || '-'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.kondisi?.toLowerCase().includes('baik')
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                            }`}>
                            {item.kondisi || 'Baik'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{item.pengelola || '-'}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-blue-950/60 text-[10px] font-semibold text-blue-300 border border-blue-500/30">
                            {item.statusPinjam || '-'}
                          </span>
                        </td>
                      </>
                    )}

                    {/* AKSI */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(item)}
                          className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                          title="Edit Aset"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDeleting}
                          onClick={() => item.id && handleDelete(item.id)}
                          className="h-8 w-8 text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 rounded-lg"
                          title="Hapus Aset"
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

      {/* MODAL TAMBAH / EDIT ASET */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#070b10] border-white/10 text-white p-5 sm:p-7 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-condensed font-bold uppercase tracking-tight text-white flex items-center gap-2">
              <span className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg">
                <Landmark className="h-4 w-4" />
              </span>
              <span>{editingId ? 'Edit Data Aset' : 'Tambah Aset Baru'} ({activeSubTab.toUpperCase()})</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Isi parameter inventarisasi aset desa sesuai data fisik lapangan dan dokumen resmi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            {/* TAB 1: FORM TANAH */}
            {activeSubTab === 'tanah' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Kode Aset</Label>
                    <Input
                      required
                      placeholder="Contoh: TKD-BLS-01"
                      value={formData.kodeAset || ''}
                      onChange={e => setFormData({ ...formData, kodeAset: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Nama Aset Tanah</Label>
                    <Input
                      required
                      placeholder="Contoh: Tanah Kas Desa Blok Sawah Cengkelek"
                      value={formData.namaAset || ''}
                      onChange={e => setFormData({ ...formData, namaAset: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Lokasi (Blok/Dusun)</Label>
                    <Input
                      required
                      placeholder="Contoh: Dusun Pangampiran RT 02 / RW 01"
                      value={formData.lokasi || ''}
                      onChange={e => setFormData({ ...formData, lokasi: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Luas (m²)</Label>
                    <Input
                      required
                      placeholder="Contoh: 14.500 m²"
                      value={formData.luas || ''}
                      onChange={e => setFormData({ ...formData, luas: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Bukti Kepemilikan</Label>
                    <Input
                      required
                      placeholder="Contoh: Letter C Desa No. 124 / Sertifikat Hak Pakai"
                      value={formData.buktiKepemilikan || ''}
                      onChange={e => setFormData({ ...formData, buktiKepemilikan: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Pemanfaatan Saat Ini</Label>
                    <Input
                      required
                      placeholder="Contoh: Sawah Kas Desa (Lelang Terbuka) / Bengkok"
                      value={formData.pemanfaatan || ''}
                      onChange={e => setFormData({ ...formData, pemanfaatan: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-200">Kontribusi PADes / Keterangan Hasil</Label>
                  <Input
                    placeholder="Contoh: Rp 22.500.000 / Tahun ke Kas Desa"
                    value={formData.kontribusiPades || ''}
                    onChange={e => setFormData({ ...formData, kontribusiPades: e.target.value })}
                    className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: FORM GEDUNG */}
            {activeSubTab === 'gedung' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-200">Nama Gedung / Bangunan</Label>
                  <Input
                    required
                    placeholder="Contoh: Balai Pertemuan & Kantor Desa Sampeldes"
                    value={formData.namaBangunan || ''}
                    onChange={e => setFormData({ ...formData, namaBangunan: e.target.value })}
                    className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Lokasi Bangunan</Label>
                    <Input
                      required
                      placeholder="Contoh: Jl. Raya Sampeldes No. 01, Dusun Sampeldes"
                      value={formData.lokasi || ''}
                      onChange={e => setFormData({ ...formData, lokasi: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Luas Bangunan (m²)</Label>
                    <Input
                      required
                      placeholder="Contoh: 450 m²"
                      value={formData.luasBangunan || ''}
                      onChange={e => setFormData({ ...formData, luasBangunan: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Tahun Bangun / Rehab</Label>
                    <Input
                      required
                      placeholder="Contoh: 2018 / Rehab 2024"
                      value={formData.tahunBangun || ''}
                      onChange={e => setFormData({ ...formData, tahunBangun: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Sumber Anggaran</Label>
                    <Input
                      required
                      placeholder="Contoh: Dana Desa (DD) & Banprov"
                      value={formData.sumberAnggaran || ''}
                      onChange={e => setFormData({ ...formData, sumberAnggaran: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-200">Status Pemanfaatan</Label>
                  <Input
                    required
                    placeholder="Contoh: Kantor Pelayanan Administrasi & Aula Pertemuan Warga"
                    value={formData.statusPemanfaatan || ''}
                    onChange={e => setFormData({ ...formData, statusPemanfaatan: e.target.value })}
                    className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: FORM KENDARAAN */}
            {activeSubTab === 'kendaraan' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Jenis &amp; Merk Kendaraan</Label>
                    <Input
                      required
                      placeholder="Contoh: Mobil Ambulans Siaga - Suzuki APV"
                      value={formData.jenisMerk || ''}
                      onChange={e => setFormData({ ...formData, jenisMerk: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Nomor Polisi (Plat)</Label>
                    <Input
                      required
                      placeholder="Contoh: R 9981 XB"
                      value={formData.nomorPolisi || ''}
                      onChange={e => setFormData({ ...formData, nomorPolisi: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Tahun Perolehan</Label>
                    <Input
                      required
                      placeholder="Contoh: 2021"
                      value={formData.tahunPerolehan || ''}
                      onChange={e => setFormData({ ...formData, tahunPerolehan: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Sumber Dana</Label>
                    <Input
                      required
                      placeholder="Contoh: Dana Desa (DD) TA 2021"
                      value={formData.sumberDana || ''}
                      onChange={e => setFormData({ ...formData, sumberDana: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Kondisi Fisik</Label>
                    <Select
                      value={formData.kondisi || 'Baik'}
                      onValueChange={val => setFormData({ ...formData, kondisi: val })}
                    >
                      <SelectTrigger className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10">
                        <SelectValue placeholder="Pilih Kondisi" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="Baik">Baik (Prima)</SelectItem>
                        <SelectItem value="Rusak Ringan">Rusak Ringan</SelectItem>
                        <SelectItem value="Rusak Berat">Rusak Berat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-200">Peruntukan &amp; Penanggung Jawab (PIC)</Label>
                  <Input
                    required
                    placeholder="Contoh: Layanan Siaga 24 Jam / Driver: Bpk. Taryono (0857-1234-5678)"
                    value={formData.penanggungJawab || ''}
                    onChange={e => setFormData({ ...formData, penanggungJawab: e.target.value })}
                    className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: FORM ALSINTAN */}
            {activeSubTab === 'alsintan' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Nama Alat / Barang</Label>
                    <Input
                      required
                      placeholder="Contoh: Traktor Roda 2 Quick Kubota RD 85"
                      value={formData.namaAlat || ''}
                      onChange={e => setFormData({ ...formData, namaAlat: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Jumlah Unit</Label>
                    <Input
                      required
                      placeholder="Contoh: 3 Unit"
                      value={formData.jumlah || ''}
                      onChange={e => setFormData({ ...formData, jumlah: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Tahun &amp; Sumber Dana</Label>
                    <Input
                      required
                      placeholder="Contoh: 2022 - Bantuan Kementan & APBD"
                      value={formData.tahunSumberDana || ''}
                      onChange={e => setFormData({ ...formData, tahunSumberDana: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Kondisi Alat</Label>
                    <Select
                      value={formData.kondisi || 'Baik'}
                      onValueChange={val => setFormData({ ...formData, kondisi: val })}
                    >
                      <SelectTrigger className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10">
                        <SelectValue placeholder="Pilih Kondisi" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="Baik">Baik (Siap Pakai)</SelectItem>
                        <SelectItem value="Rusak Ringan">Rusak Ringan</SelectItem>
                        <SelectItem value="Rusak Berat">Rusak Berat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Pengelola / Kelompok Pemegang</Label>
                    <Input
                      required
                      placeholder="Contoh: Gapoktan Tani Makmur Sampeldes"
                      value={formData.pengelola || ''}
                      onChange={e => setFormData({ ...formData, pengelola: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-200">Status Pinjam Pakai</Label>
                    <Input
                      required
                      placeholder="Contoh: Tersedia / Sedang Dipakai Poktan"
                      value={formData.statusPinjam || ''}
                      onChange={e => setFormData({ ...formData, statusPinjam: e.target.value })}
                      className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SHARED: FOTO & KETERANGAN */}
            <div className="pt-2 border-t border-white/10 space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-200">Catatan / Keterangan Tambahan</Label>
                <Textarea
                  placeholder="Informasi kondisi fisik, spesifikasi teknis, atau catatan riwayat perolehan..."
                  value={formData.keterangan || ''}
                  onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                  className="bg-slate-900 border-white/10 text-white rounded-xl text-xs min-h-[60px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-200">Foto Dokumentasi Aset (Opsional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="URL foto (https://...)"
                    value={formData.fotoUrl || ''}
                    onChange={e => setFormData({ ...formData, fotoUrl: e.target.value })}
                    className="bg-slate-900 border-white/10 text-white rounded-xl text-xs h-10 flex-1"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUploadPhoto}
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
                    <span>Unggah</span>
                  </Button>
                </div>
                {formData.fotoUrl && (
                  <div className="mt-2 relative w-24 h-16 rounded-lg overflow-hidden border border-white/10">
                    <img src={formData.fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fotoUrl: '' })}
                      className="absolute top-1 right-1 p-0.5 bg-black/70 text-white rounded-full hover:bg-black"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-white/10 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="text-slate-400 hover:text-white rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold uppercase text-xs tracking-wider rounded-xl px-5 h-10"
              >
                {editingId ? 'Simpan Perubahan' : 'Tambahkan Aset'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
