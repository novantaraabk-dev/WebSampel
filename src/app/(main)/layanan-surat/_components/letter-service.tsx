'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ShieldCheck,
  MapPinned,
  Store,
  Baby,
  Skull,
  Heart,
  Home,
  Music,
  Users,
  Flower2,
  UserCheck,
  Activity,
  HandHelping,
  ArrowLeft,
  HeartHandshake,
  FileSpreadsheet,
  Coins,
  ShieldAlert,
  FileSignature,
  Landmark,
  ShoppingBag,
  Building2,
  Briefcase,
  Navigation,
  Search,
  CreditCard,
  IdCard,
  Car,
  FilePlus,
  Scale,
  Send,
  User,
  Church,
  Scroll,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SktmForm } from './forms/sktm-form';
import { SkckForm } from './forms/skck-form';
import { PindahForm } from './forms/pindah-form';
import { SkuForm } from './forms/sku-form';
import { KelahiranForm } from './forms/kelahiran-form';
import { KematianForm } from './forms/kematian-form';
import { BelumMenikahForm } from './forms/belum-menikah-form';
import { DomisiliForm } from './forms/domisili-form';
import { IjinKeramaianForm } from './forms/ijin-keramaian-form';
import { MoyangForm } from './forms/moyang-form';
import { PemakamanForm } from './forms/pemakaman-form';
import { WaliForm } from './forms/wali-form';
import { WaliHakimForm } from './forms/wali-hakim-form';
import { DuplikatNikahForm } from './forms/duplikat-nikah-form';
import { ReaktivasiBpjsForm } from './forms/reaktivasi-bpjs-form';
import { PengantarUmumForm } from './forms/pengantar-umum-form';
import { KeteranganUmumForm } from './forms/keterangan-umum-form';
import { NikahForm } from './forms/nikah-form';
import { BedaNamaForm } from './forms/beda-nama-form';
import { PenghasilanForm } from './forms/penghasilan-form';
import { KehilanganForm } from './forms/kehilangan-form';
import { SporadikForm } from './forms/sporadik-form';
import { KepemilikanTanahForm } from './forms/kepemilikan-tanah-form';
import { JualBeliForm } from './forms/jual-beli-form';
import { DomisiliUsahaForm } from './forms/domisili-usaha-form';
import { IzinKeluargaForm } from './forms/izin-keluarga-form';
import { SuratJalanForm } from './forms/surat-jalan-form';
import { SuratKuasaForm } from './forms/surat-kuasa-form';
import { SuratLanjutanForm } from './forms/surat-lanjutan-form';
import { OpenSidDynamicForm } from './forms/opensid-dynamic-form';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { SEED_PERMOHONAN_SURAT, type PermohonanSuratItem } from '@/lib/permohonan-surat-data';
import { enrichPermohonanSuratWithOpenSid, matchMasterSuratItem } from '@/lib/opensid-surat-engine';

interface LetterServiceProps {
  isAdmin?: boolean;
}

export type LetterCategory =
  | 'Semua'
  | 'Kependudukan'
  | 'Pernikahan'
  | 'Pertanahan'
  | 'Ekonomi & Usaha'
  | 'Sosial & Bantuan'
  | 'Umum';

export interface LetterOptionItem {
  type: string;
  icon: any;
  color: string;
  category: Exclude<LetterCategory, 'Semua'>;
  description: string;
  lampiranSummary?: string;
}

const letterOptions: LetterOptionItem[] = [
  // --- KEPENDUDUKAN (10 Surat) ---
  {
    type: 'Surat Pengantar Pindah',
    icon: MapPinned,
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
    category: 'Kependudukan',
    description: 'Keterangan pindah domisili & formulir F-1.03 SKPWNI.',
    lampiranSummary: 'Formulir F-1.03 SKPWNI',
  },
  {
    type: 'Surat Keterangan Kelahiran',
    icon: Baby,
    color: 'bg-pink-100 text-pink-600 dark:bg-pink-950/60 dark:text-pink-300',
    category: 'Kependudukan',
    description: 'Data kelahiran baru & lampiran F-2.01 / SPTJM Kelahiran.',
    lampiranSummary: 'Formulir F-2.01 & SPTJM F-2.03',
  },
  {
    type: 'Surat Keterangan Kematian',
    icon: Skull,
    color: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    category: 'Kependudukan',
    description: 'Keterangan duka cita & lampiran F-2.01 Pelaporan Kematian.',
    lampiranSummary: 'Formulir F-2.01 Kematian Dukcapil',
  },
  {
    type: 'Surat Keterangan Domisili',
    icon: Home,
    color: 'bg-[#d4e157]/20 text-[#384405] dark:bg-[#d4e157]/10 dark:text-[#d4e157]',
    category: 'Kependudukan',
    description: 'Keterangan tempat tinggal sementara penduduk.',
    lampiranSummary: 'Format Standar Berkop',
  },
  {
    type: 'Surat Keterangan Penduduk',
    icon: User,
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    category: 'Kependudukan',
    description: 'Keterangan status penduduk definitif aktif Desa Sampeldes.',
    lampiranSummary: 'Register Kependudukan Desa',
  },
  {
    type: 'Surat Keterangan KTP dalam Proses',
    icon: IdCard,
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    category: 'Kependudukan',
    description: 'Pengganti KTP-el sementara selama blangko dalam proses rekam.',
    lampiranSummary: 'Formulir F-1.21 + Foto 3x4 (6 Bulan)',
  },
  {
    type: 'Surat Permohonan Kartu Keluarga Baru',
    icon: Users,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    category: 'Kependudukan',
    description: 'Permohonan KK baru pengantin baru / pemisahan KK.',
    lampiranSummary: 'Formulir F-1.15 Dukcapil',
  },
  {
    type: 'Surat Permohonan Perubahan Kartu Keluarga',
    icon: FileSpreadsheet,
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
    category: 'Kependudukan',
    description: 'Revisi susunan anggota keluarga / elemen data kependudukan.',
    lampiranSummary: 'Formulir F-1.16 & F-1.06',
  },
  {
    type: 'Surat Permohonan Akta Kelahiran',
    icon: Baby,
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    category: 'Kependudukan',
    description: 'Pengantar penerbitan kutipan akta lahir ke Disdukcapil.',
    lampiranSummary: 'Formulir F-2.01 Pelaporan Lahir',
  },
  {
    type: 'Surat Pernyataan Belum Memiliki Akta Lahir (SPTJM)',
    icon: FileCheck2,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    category: 'Kependudukan',
    description: 'SPTJM kebenaran kelahiran bagi warga belum berakta.',
    lampiranSummary: 'Formulir F-2.03 Bermeterai + Saksi',
  },
  {
    type: 'Surat Permohonan Duplikat Akta Kelahiran',
    icon: FilePlus,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    category: 'Kependudukan',
    description: 'Rekomendasi penerbitan duplikat akta lahir hilang/rusak.',
    lampiranSummary: 'Pernyataan Kehilangan Bermeterai',
  },
  {
    type: 'Surat Keterangan Lahir Mati',
    icon: Skull,
    color: 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
    category: 'Kependudukan',
    description: 'Keterangan bayi lahir mati (kandungan >= 28 minggu).',
    lampiranSummary: 'Formulir F-2.09 Lahir Mati',
  },
  {
    type: 'Surat Biodata Penduduk (F-1.01)',
    icon: FileText,
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    category: 'Kependudukan',
    description: 'Formulir biodata lengkap WNI format SIAK Ditjen Dukcapil.',
    lampiranSummary: 'Formulir F-1.01 Lengkap 2 Lembar',
  },
  {
    type: 'Surat Keterangan Beda Nama',
    icon: FileSpreadsheet,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    category: 'Kependudukan',
    description: 'Pernyataan perbedaan identitas dokumen kependudukan.',
    lampiranSummary: 'Tabel Pembanding & SPTJM',
  },
  {
    type: 'Surat Keterangan Moyang',
    icon: Users,
    color: 'bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:text-teal-300',
    category: 'Kependudukan',
    description: 'Keterangan silsilah keluarga / garis keturunan leluhur.',
    lampiranSummary: 'Silsilah Asal-Usul Warga',
  },
  {
    type: 'Surat Keterangan Wali',
    icon: UserCheck,
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
    category: 'Kependudukan',
    description: 'Keterangan perwalian anak di bawah umur.',
    lampiranSummary: 'Surat Keterangan Hak Asuh',
  },

  // --- PERNIKAHAN (7 Surat) ---
  {
    type: 'Surat Pengantar Nikah (N-1 - N-4)',
    icon: HeartHandshake,
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    category: 'Pernikahan',
    description: 'Pengantar nikah KUA resmi paket lengkap N-1, N-2, N-4, N-5, N-6, SPS, dan SWN.',
    lampiranSummary: 'Model N-1, N-2, N-4, N-5, N-6, SPS & SWN',
  },
  {
    type: 'Surat Keterangan Belum Menikah',
    icon: Heart,
    color: 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300',
    category: 'Pernikahan',
    description: 'Pernyataan status lajang / belum pernah menikah.',
    lampiranSummary: 'Format Standar Berkop',
  },
  {
    type: 'Surat Keterangan Pergi Kawin (Numpang Nikah)',
    icon: Navigation,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    category: 'Pernikahan',
    description: 'Rekomendasi nikah di KUA luar kecamatan/daerah tujuan lengkap dengan lampiran N-1, N-2, N-4, N-5, N-6, SPS & SWN.',
    lampiranSummary: 'Model N-1, N-2, N-4, N-5, N-6, SPS & SWN',
  },
  {
    type: 'Surat Keterangan Wali Hakim',
    icon: Scale,
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    category: 'Pernikahan',
    description: 'Permohonan wali hakim KUA jika wali nasab adhal/mafqud.',
    lampiranSummary: 'Surat Pernyataan Wali Bermeterai',
  },
  {
    type: 'Surat Permohonan Duplikat Surat Nikah',
    icon: FilePlus,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
    category: 'Pernikahan',
    description: 'Rekomendasi duplikat buku nikah yang hilang atau rusak.',
    lampiranSummary: 'Lampiran SP-HILANG + Saksi-Saksi',
  },
  {
    type: 'Surat Keterangan Nikah Non-Muslim',
    icon: Church,
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
    category: 'Pernikahan',
    description: 'Pengantar pencatatan perkawinan agama ke Catatan Sipil.',
    lampiranSummary: 'Formulir F-2.01 Pencatatan Sipil',
  },
  {
    type: 'Surat Pengantar Cerai / Rujuk',
    icon: Scale,
    color: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    category: 'Pernikahan',
    description: 'Pengantar pendaftaran perkara ke Pengadilan Agama.',
    lampiranSummary: 'Pernyataan Duduk Perkara Rumah Tangga',
  },

  // --- PERTANAHAN (3 Surat) ---
  {
    type: 'Surat Pernyataan Penguasaan Fisik Bidang Tanah (SPORADIK)',
    icon: FileSignature,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
    category: 'Pertanahan',
    description: 'Pernyataan fisik tanah & Berita Acara Kesaksian Batas BPN.',
    lampiranSummary: 'Berita Acara Kesaksian Batas BPN',
  },
  {
    type: 'Surat Keterangan Kepemilikan Tanah',
    icon: Landmark,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    category: 'Pertanahan',
    description: 'Keterangan hak milik tanah & kutipan Letter C Desa.',
    lampiranSummary: 'Kutipan Buku C Desa',
  },
  {
    type: 'Surat Keterangan Jual Beli',
    icon: ShoppingBag,
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    category: 'Pertanahan',
    description: 'Pengesahan transaksi jual beli tanah / hewan / barang.',
    lampiranSummary: 'Surat Perjanjian & Saksi Batas',
  },

  // --- EKONOMI & USAHA (3 Surat) ---
  {
    type: 'Surat Keterangan Usaha',
    icon: Store,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300',
    category: 'Ekonomi & Usaha',
    description: 'Untuk pengajuan pinjaman KUR / legalitas UMKM.',
    lampiranSummary: 'Format Standar Berkop',
  },
  {
    type: 'Surat Keterangan Domisili Usaha',
    icon: Building2,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    category: 'Ekonomi & Usaha',
    description: 'Domisili badan usaha, toko, CV, PT & perizinan OSS.',
    lampiranSummary: 'Keterangan Operasional Perusahaan',
  },
  {
    type: 'Surat Keterangan Kepemilikan Kendaraan',
    icon: Car,
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300',
    category: 'Ekonomi & Usaha',
    description: 'Bukti fisik motor/mobil untuk lapor hilang BPKB/leasing.',
    lampiranSummary: 'Pernyataan Fisik Bermeterai + 2 Saksi',
  },

  // --- SOSIAL & BANTUAN (6 Surat) ---
  {
    type: 'Surat Keterangan Tidak Mampu',
    icon: HandHelping,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-300',
    category: 'Sosial & Bantuan',
    description: 'Untuk bantuan sosial, biaya berobat, & sekolah.',
    lampiranSummary: 'Format Standar Berkop',
  },
  {
    type: 'Surat Keterangan Penghasilan Orang Tua',
    icon: Coins,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    category: 'Sosial & Bantuan',
    description: 'Rincian penghasilan gabungan ortu untuk beasiswa & KIP-K.',
    lampiranSummary: 'Slip / Rincian Beban Keluarga',
  },
  {
    type: 'Surat Keterangan Penghasilan Ayah',
    icon: Briefcase,
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
    category: 'Sosial & Bantuan',
    description: 'Rincian penghasilan mandiri pihak ayah / kepala keluarga.',
    lampiranSummary: 'Rincian Tanggungan Bulanan',
  },
  {
    type: 'Surat Keterangan Penghasilan Ibu',
    icon: Coins,
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300',
    category: 'Sosial & Bantuan',
    description: 'Rincian penghasilan mandiri atau status IRT pihak ibu.',
    lampiranSummary: 'Pernyataan Beban Tanggungan',
  },
  {
    type: 'Surat Keterangan Beda Identitas KIS',
    icon: CreditCard,
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    category: 'Sosial & Bantuan',
    description: 'Sinkronisasi data e-KTP/KK vs Kartu BPJS Kesehatan.',
    lampiranSummary: 'SPTJM Satu Orang Sama BPJS',
  },
  {
    type: 'Surat Keterangan Reaktivasi BPJS Kesehatan',
    icon: Activity,
    color: 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300',
    category: 'Sosial & Bantuan',
    description: 'Rekomendasi pengaktifan kembali BPJS PBI yang terblokir.',
    lampiranSummary: 'Rekomendasi Faskes Puskesmas',
  },
  {
    type: 'Surat Keterangan Pemakaman',
    icon: Flower2,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    category: 'Sosial & Bantuan',
    description: 'Izin dan penetapan lokasi pemakaman di TPU Desa Sampeldes.',
    lampiranSummary: 'Format Standar Berkop',
  },

  // --- UMUM & KEDINASAN (6 Surat) ---
  {
    type: 'Surat Keterangan Umum',
    icon: FileText,
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    category: 'Umum',
    description: 'Keperluan administratif desa secara umum.',
    lampiranSummary: 'Format Standar Berkop',
  },
  {
    type: 'Surat Pengantar Umum',
    icon: FileText,
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    category: 'Umum',
    description: 'Pengantar administrasi umum ke instansi luar desa.',
    lampiranSummary: 'Format Standar Berkop',
  },
  {
    type: 'Surat Pengantar SKCK',
    icon: ShieldCheck,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    category: 'Umum',
    description: 'Persyaratan melamar pekerjaan / pengantar kepolisian.',
    lampiranSummary: 'Format Standar Berkop',
  },
  {
    type: 'Surat Pengantar Kehilangan',
    icon: ShieldAlert,
    color: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
    category: 'Umum',
    description: 'Pengantar laporan kehilangan ke Polsek Gandrungmangu.',
    lampiranSummary: 'Format Standar Berkop',
  },
  {
    type: 'Surat Ijin Keramaian',
    icon: Music,
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300',
    category: 'Umum',
    description: 'Penyelenggaraan acara hajatan, hiburan, & keramaian.',
    lampiranSummary: 'Format Standar Berkop',
  },
  {
    type: 'Surat Izin Keluarga (Bekerja / Merantau)',
    icon: Briefcase,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    category: 'Umum',
    description: 'Izin orang tua / suami / istri untuk bekerja merantau.',
    lampiranSummary: 'Persetujuan Keluarga Bekerja',
  },
  {
    type: 'Surat Keterangan Jalan',
    icon: Navigation,
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
    category: 'Umum',
    description: 'Surat jalan resmi bepergian dinas atau luar daerah.',
    lampiranSummary: 'Format Standar Berkop',
  },
  {
    type: 'Surat Kuasa Administrasi Desa',
    icon: FileSignature,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    category: 'Umum',
    description: 'Pelimpahan hak kuasa pengurusan administrasi warga.',
    lampiranSummary: 'Surat Kuasa Bermeterai + Legalisir Kades',
  },
  {
    type: 'Surat Perintah Perjalanan Dinas (SPPD)',
    icon: Send,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    category: 'Umum',
    description: 'Surat Perintah Tugas (SPT) & Lembar Visum Perjalanan Dinas.',
    lampiranSummary: 'SPT + Lembar Visum Pejabat Tujuan',
  },
];

export interface CategoryConfig {
  label: LetterCategory;
  icon: any;
}

const CATEGORY_ROWS: CategoryConfig[][] = [
  // Baris 1: 4 Kategori
  [
    { label: 'Semua', icon: Sparkles },
    { label: 'Kependudukan', icon: Users },
    { label: 'Pernikahan', icon: HeartHandshake },
    { label: 'Pertanahan', icon: Landmark },
  ],
  // Baris 2: 3 Kategori
  [
    { label: 'Ekonomi & Usaha', icon: Store },
    { label: 'Sosial & Bantuan', icon: HandHelping },
    { label: 'Umum', icon: FileText },
  ],
];

const ALL_CATEGORIES = CATEGORY_ROWS.flat();

export function LetterService({ isAdmin = false }: LetterServiceProps) {
  const firestore = useFirestore();
  const masterSuratRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'pengaturan_permohonan_surat') : null),
    [firestore],
  );
  // HEMAT KUOTA: Cache daftar master surat selama 60 menit (0 Read saat pindah halaman Umum / Admin)
  const { data: dbMasterItems } = useCollection<PermohonanSuratItem>(masterSuratRef, {
    cacheTtl: 60 * 60 * 1000,
  });

  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<LetterCategory>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  const enrichedMasterList = useMemo(() => {
    const map = new Map<string, PermohonanSuratItem>();
    SEED_PERMOHONAN_SURAT.forEach((seed) => {
      map.set(seed.id, seed);
    });

    if (dbMasterItems && dbMasterItems.length > 0) {
      dbMasterItems.forEach((dbItem) => {
        let key = dbItem.id;
        if (!map.has(key)) {
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
          map.set(dbItem.id || `custom-${Math.random()}`, dbItem);
        }
      });
    }

    return Array.from(map.values()).map((item) => enrichPermohonanSuratWithOpenSid(item));
  }, [dbMasterItems]);

  // Gabungkan letterOptions dengan daftar surat aktif (ON) dari Master Surat OpenSID (/admin/surat/master)
  const mergedLetterOptions: LetterOptionItem[] = useMemo(() => {
    const baseMap = new Map<string, LetterOptionItem>();
    for (const opt of letterOptions) {
      baseMap.set(opt.type.toLowerCase(), opt);
    }

    // Saring letterOptions: sembunyikan surat yang statusnya OFF (isActive === false) di /admin/surat/master
    const result: LetterOptionItem[] = letterOptions.filter((opt) => {
      const matched = matchMasterSuratItem(enrichedMasterList, opt.type);
      if (matched && matched.isActive === false) {
        return false;
      }
      return true;
    });

    for (const master of enrichedMasterList) {
      if (master.isActive === false) continue;
      const key = master.jenisSurat.toLowerCase();
      const alreadyInOptions =
        baseMap.has(key) ||
        letterOptions.some((opt) => matchMasterSuratItem([master], opt.type) !== undefined);
      if (!alreadyInOptions) {
        result.push({
          type: master.jenisSurat,
          icon: FileText,
          color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
          category: (master.kategori as Exclude<LetterCategory, 'Semua'>) || 'Umum',
          description: master.uraian || `Layanan penerbitan ${master.jenisSurat} standar OpenSID.`,
          lampiranSummary: (master.lampiran || []).join(', ') || `Kode: ${master.kodeSurat}`,
        });
      }
    }
    return result;
  }, [enrichedMasterList]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qSurat = params.get('surat');
      if (qSurat) {
        const matched = matchMasterSuratItem(enrichedMasterList, qSurat);
        if (matched) {
          setSelectedLetter(matched.jenisSurat);
        }
      }
    }
  }, [enrichedMasterList]);

  // Filter letters by category and search query
  const filteredLetters = useMemo(() => {
    return mergedLetterOptions.filter((opt) => {
      const matchCategory = activeCategory === 'Semua' || opt.category === activeCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        opt.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [mergedLetterOptions, activeCategory, searchQuery]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: mergedLetterOptions.length };
    for (const cat of ALL_CATEGORIES) {
      if (cat.label !== 'Semua') {
        counts[cat.label] = mergedLetterOptions.filter((opt) => opt.category === cat.label).length;
      }
    }
    return counts;
  }, [mergedLetterOptions]);

  const currentMasterItem = useMemo(() => {
    if (!selectedLetter) return undefined;
    return matchMasterSuratItem(enrichedMasterList, selectedLetter);
  }, [selectedLetter, enrichedMasterList]);

  const renderForm = () => {
    const props = { isAdmin };

    switch (selectedLetter) {
      // 25 Existing Specialized Forms
      case 'Surat Keterangan Umum': return <KeteranganUmumForm {...props} />;
      case 'Surat Pengantar Nikah (N-1 - N-4)':
      case 'Surat Keterangan Nikah':
      case 'Surat Keterangan Pergi Kawin (Numpang Nikah)':
      case 'Surat Keterangan Pergi Kawin':
        return <NikahForm {...props} letterType={selectedLetter} />;
      case 'Surat Keterangan Beda Nama': return <BedaNamaForm {...props} />;
      case 'Surat Keterangan Penghasilan Orang Tua': return <PenghasilanForm {...props} />;
      case 'Surat Pengantar Kehilangan': return <KehilanganForm {...props} />;
      case 'Surat Pernyataan Penguasaan Fisik Bidang Tanah (SPORADIK)': return <SporadikForm {...props} />;
      case 'Surat Keterangan Kepemilikan Tanah': return <KepemilikanTanahForm {...props} />;
      case 'Surat Keterangan Jual Beli': return <JualBeliForm {...props} />;
      case 'Surat Keterangan Domisili Usaha': return <DomisiliUsahaForm {...props} />;
      case 'Surat Izin Keluarga (Bekerja / Merantau)': return <IzinKeluargaForm {...props} />;
      case 'Surat Kuasa Administrasi Desa':
      case 'Surat Kuasa':
        return <SuratKuasaForm {...props} />;
      case 'Surat Keterangan Jalan':
      case 'Surat Keterangan Bepergian / Jalan':
      case 'Surat Keterangan Bepergian':
      case 'Surat Keterangan Jalan/Berpergian':
        return <SuratJalanForm {...props} />;
      case 'Surat Keterangan Tidak Mampu': return <SktmForm {...props} />;
      case 'Surat Pengantar SKCK': return <SkckForm {...props} />;
      case 'Surat Pengantar Pindah': return <PindahForm {...props} />;
      case 'Surat Keterangan Usaha': return <SkuForm {...props} />;
      case 'Surat Keterangan Kelahiran': return <KelahiranForm {...props} />;
      case 'Surat Keterangan Kematian': return <KematianForm {...props} />;
      case 'Surat Keterangan Belum Menikah': return <BelumMenikahForm {...props} />;
      case 'Surat Keterangan Domisili': return <DomisiliForm {...props} />;
      case 'Surat Ijin Keramaian': return <IjinKeramaianForm {...props} />;
      case 'Surat Keterangan Moyang': return <MoyangForm {...props} />;
      case 'Surat Keterangan Pemakaman': return <PemakamanForm {...props} />;
      case 'Surat Keterangan Wali': return <WaliForm {...props} />;
      case 'Surat Keterangan Wali Hakim': return <WaliHakimForm {...props} />;
      case 'Surat Permohonan Duplikat Surat Nikah':
      case 'Surat Keterangan Duplikat Buku Nikah':
      case 'Surat Permohonan Duplikat Buku Nikah':
        return <DuplikatNikahForm {...props} />;
      case 'Surat Keterangan Reaktivasi BPJS Kesehatan':
      case 'Surat Keterangan JAMKESOS / Reaktivasi BPJS':
      case 'Surat Keterangan JAMKESOS':
        return <ReaktivasiBpjsForm {...props} />;
      case 'Surat Pengantar Umum': return <PengantarUmumForm {...props} />;

      default:
        if (currentMasterItem) {
          return <OpenSidDynamicForm masterItem={currentMasterItem} isAdmin={isAdmin} />;
        }
        return <SuratLanjutanForm letterType={selectedLetter} isAdmin={isAdmin} />;
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {!selectedLetter ? (
        <div className="space-y-6 sm:space-y-8">
          {/* ── Section Title ── */}
          <div className="text-center space-y-2">
            <h2 className="text-xl min-[380px]:text-2xl md:text-3xl font-condensed font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Pilih <span className="text-emerald-800 dark:text-[#d4e157]">Layanan Surat</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-lg mx-auto">
              Tersedia <strong>{mergedLetterOptions.length} Jenis Layanan Surat Resmi</strong> standar OpenSID dan Permendagri. Pilih kategori atau gunakan kolom pencarian untuk mempercepat pengajuan.
            </p>
          </div>

          {/* ── Search Bar & Filter Controls ── */}
          <div className="w-full max-w-5xl mx-auto space-y-3.5">
            {/* Search Input */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400 dark:text-stone-500" />
              <Input
                type="text"
                placeholder="Cari jenis surat (misal: Numpang Nikah, KK Baru, Akta, SPPD)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9 py-2 text-xs sm:text-sm rounded-full bg-white dark:bg-[#0d141e] border-stone-200/90 dark:border-white/10 shadow-xs focus-visible:ring-emerald-700 h-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-3 top-2.5 w-5 h-5 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-500 flex items-center justify-center text-xs font-bold transition-colors"
                >
                  &times;
                </button>
              )}
            </div>

            {/* ── Category Tabs: 2 Neat Balanced Rows on Mobile & PC (No Horizontal Scroll) ── */}
            <div className="w-full flex flex-col items-center gap-1.5 sm:gap-2.5 max-w-4xl mx-auto px-1 sm:px-0">
              {CATEGORY_ROWS.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className="flex items-center justify-center gap-1 min-[360px]:gap-1.5 sm:gap-2.5 w-full max-w-full"
                >
                  {row.map((cat) => {
                    const isActive = activeCategory === cat.label;
                    const count = categoryCounts[cat.label] || 0;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setActiveCategory(cat.label)}
                        className={cn(
                          'shrink-0 h-7 min-[360px]:h-7.5 sm:h-9 md:h-9.5 px-1.5 min-[360px]:px-2 min-[400px]:px-2.5 sm:px-3.5 md:px-4 rounded-full text-[9px] min-[360px]:text-[10px] min-[400px]:text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1 sm:gap-1.5 cursor-pointer select-none',
                          isActive
                            ? 'bg-emerald-800 text-white dark:bg-[#d4e157] dark:text-slate-950 shadow-md ring-2 ring-emerald-800/20 dark:ring-[#d4e157]/30 scale-[1.02]'
                            : 'bg-white/90 hover:bg-white dark:bg-[#0d141e]/90 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-white/10 shadow-2xs hover:border-stone-300'
                        )}
                      >
                        <Icon className={cn('h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 hidden min-[420px]:inline-block', isActive ? 'text-white dark:text-slate-950' : 'text-stone-500 dark:text-stone-400')} />
                        <span className="whitespace-nowrap">{cat.label}</span>
                        <span
                          className={cn(
                            'text-[8.5px] min-[360px]:text-[9.5px] sm:text-[10px] font-mono font-bold px-1 min-[360px]:px-1.5 py-0.5 rounded-full leading-none transition-colors',
                            isActive
                              ? 'bg-emerald-950/40 text-white dark:bg-black/20 dark:text-slate-900'
                              : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400'
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* ── Empty State when no match ── */}
          {filteredLetters.length === 0 && (
            <div className="text-center py-12 px-4 bg-stone-50 dark:bg-[#070b10] rounded-3xl border border-dashed border-stone-200 dark:border-white/10 max-w-md mx-auto space-y-3">
              <Search className="h-8 w-8 text-stone-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                Tidak ada surat yang sesuai dengan pencarian "{searchQuery}"
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('Semua');
                }}
                className="text-xs"
              >
                Reset Pencarian & Kategori
              </Button>
            </div>
          )}

          {/* ── Card Grid (45 Letters) ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 min-[400px]:gap-3 sm:gap-4">
            {filteredLetters.map((opt) => (
              <button
                key={opt.type}
                onClick={() => {
                  setSelectedLetter(opt.type);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative neu-card-elevated rounded-[20px] min-[400px]:rounded-[24px] sm:rounded-[28px] p-2.5 min-[400px]:p-3.5 sm:p-5 flex flex-col items-center text-center gap-2 min-[400px]:gap-3 border border-white/60 dark:border-white/10 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer text-left"
              >
                {/* Category mini badge */}
                <span className="text-[8px] font-black uppercase tracking-wider text-stone-600 dark:text-stone-300 bg-stone-200/80 dark:bg-stone-800/80 px-2 py-0.5 rounded-full mb-0.5">
                  {opt.category}
                </span>

                {/* Icon well */}
                <div className="neu-inset w-10 h-10 min-[400px]:w-12 min-[400px]:h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 p-1.5 sm:p-2">
                  <div className={cn(
                    'w-full h-full rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                    opt.color
                  )}>
                    <opt.icon className="h-4 w-4 min-[400px]:h-5 min-[400px]:w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-0.5 sm:space-y-1 w-full text-center">
                  <h3 className="text-[11px] min-[400px]:text-xs sm:text-sm font-condensed font-bold uppercase text-slate-800 dark:text-white leading-tight group-hover:text-emerald-800 dark:group-hover:text-[#d4e157] transition-colors line-clamp-2">
                    {opt.type}
                  </h3>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2 hidden sm:block">
                    {opt.description}
                  </p>
                  {opt.lampiranSummary && (
                    <span className="hidden sm:inline-block text-[9px] text-emerald-800 dark:text-[#d4e157] font-medium italic line-clamp-1">
                      Lampiran: {opt.lampiranSummary}
                    </span>
                  )}
                </div>

                {/* CTA hint */}
                <span className="neu-pill text-[8px] min-[400px]:text-[9px] sm:text-[10px] font-black text-emerald-800 dark:text-[#d4e157] uppercase tracking-wider px-2 py-0.5 min-[400px]:px-2.5 sm:px-3 sm:py-1 group-hover:text-emerald-950 dark:group-hover:text-white transition-colors mt-auto">
                  Ajukan &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>

      ) : (
        /* ── Form Card ── */
        <div className="neu-card-elevated rounded-[22px] sm:rounded-[36px] overflow-hidden border border-white/60 dark:border-white/10 animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-[#0f172a] dark:bg-[#070b10] p-4 min-[400px]:p-5 sm:p-7 md:p-8 text-white relative overflow-hidden border-b border-white/10">
            <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-5 pointer-events-none text-white">
              <FileText className="w-20 h-20 sm:w-32 sm:h-32" />
            </div>
            <div className="space-y-2.5 sm:space-y-4 relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedLetter('')}
                  className="neu-btn px-3.5 py-1.5 rounded-full font-bold uppercase text-[9px] sm:text-[10px] tracking-wider text-slate-800 dark:text-white inline-flex items-center gap-1.5 hover:text-emerald-800 dark:hover:text-[#d4e157] transition-colors"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-700 dark:text-[#d4e157]" />
                  <span>Kembali ke Pilihan Surat</span>
                </button>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg min-[380px]:text-xl sm:text-2xl md:text-3xl font-condensed font-black uppercase tracking-tight leading-tight text-white">
                  {selectedLetter}
                </h3>
                <p className="text-slate-300 text-[11px] sm:text-sm">
                  Lengkapi formulir pengajuan {isAdmin ? 'oleh Admin Desa ' : ''}secara akurat dan lengkap.
                </p>
              </div>
            </div>
          </div>

          <div className="p-2.5 min-[400px]:p-3.5 sm:p-6 md:p-8 neu-form-container">
            {renderForm()}
          </div>
        </div>
      )}
    </div>
  );
}
