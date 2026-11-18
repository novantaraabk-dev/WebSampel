'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Save,
  Eye,
  Search,
  Filter,
  FileText,
  ExternalLink,
  MapPin,
  Compass,
  Milestone,
  Image as ImageIcon,
  Video,
  PlayCircle,
  CheckCircle2,
  Upload,
  Sparkles,
  Layers,
  Building2,
  User,
  History,
  Zap,
  RefreshCw,
  X,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileDown,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminRawanBencanaTab } from './_components/admin-rawan-bencana-tab';
import { AdminHistoriTab } from './_components/admin-histori-tab';
import { saveProfileWithHistory } from './_components/save-profile-helper';
import { uploadToCloudinary } from '@/lib/upload-cloudinary';
import { useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  setDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { JalanKabupatenItem, JalanDesaItem, ProfilDesaContent } from '@/lib/types';
import * as XLSX from 'xlsx';

// Helper Format Meter & Rupiah
const formatNumber = (num: any) => {
  const n = Number(num) || 0;
  return new Intl.NumberFormat('id-ID').format(n);
};

function AdminProfilDesaView() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'sambutan');

  useEffect(() => {
    if (tabParam && ['sambutan', 'kenali', 'sejarah', 'peta', 'wilayah', 'potensi', 'jalan-kabupaten', 'jalan-desa', 'rawan-bencana', 'galeri', 'histori'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // 1. Data Redaksi Profil Desa
  const profilRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'default');
  }, [firestore]);

  const { data: profileDocData, isLoading: isLoadingProfil } = useDoc<any>(profilRef);

  // 2. Data Jalan Kabupaten
  const jalanKabQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jalanKabupaten'), orderBy('noRuas', 'asc'));
  }, [firestore]);
  const { data: jalanKabList, isLoading: isLoadingJalanKab } = useCollection<JalanKabupatenItem>(jalanKabQuery);

  // 3. Data Jalan Desa
  const jalanDesaQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jalanDesa'), orderBy('no', 'asc'));
  }, [firestore]);
  const { data: jalanDesaList, isLoading: isLoadingJalanDesa } = useCollection<JalanDesaItem>(jalanDesaQuery);

  return (
    <div className="w-full max-w-full space-y-6 min-w-0">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/admin/pelayanan">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali
              </Button>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
              Data &amp; Informasi Web
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manajemen Profil Desa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola seluruh redaksi profil desa, struktur sambutan, data wilayah, serta inventarisasi Jalan Kabupaten &amp; Jalan Desa.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <a href="/profil-desa" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs">
              <Eye className="h-3.5 w-3.5" />
              <span>Lihat Halaman Publik</span>
              <ExternalLink className="h-3 w-3 text-slate-400 ml-1" />
            </Button>
          </a>
        </div>
      </div>

      {/* Tabs Menu Manajemen */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full max-w-full min-w-0">
        {/* Mobile Dropdown Navigator (Layar HP < sm) */}
        <div className="sm:hidden bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
            Pilih Sub Menu Profil Desa:
          </label>
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 appearance-none pr-8"
            >
              <option value="sambutan">1. Sambutan &amp; Profil</option>
              <option value="kenali">2. Visi &amp; Misi</option>
              <option value="sejarah">3. Sejarah Desa</option>
              <option value="peta">4. Peta &amp; Batas</option>
              <option value="wilayah">5. Data Wilayah</option>
              <option value="potensi">6. Potensi Unggulan</option>
              <option value="jalan-kabupaten">7. Jalan Kabupaten ({jalanKabList?.length || 0})</option>
              <option value="jalan-desa">8. Jalan Desa ({jalanDesaList?.length || 0})</option>
              <option value="rawan-bencana">9. Peta Rawan Bencana &amp; Jalur Evakuasi</option>
              <option value="galeri">10. Media &amp; Video</option>
              <option value="histori">11. Riwayat &amp; Histori Perubahan</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Tab Pills Navigasi (PC & Tablet: Flex-wrap rapih, pas satu tampilan presisi) */}
        <div className="hidden sm:block w-full max-w-full min-w-0">
          <TabsList className="w-full flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl h-auto border border-slate-200/80">
            <TabsTrigger value="sambutan" className="rounded-xl text-xs font-bold py-2 px-3 sm:px-3.5 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">
              <User className="h-3.5 w-3.5 mr-1.5" />
              1. Sambutan &amp; Profil
            </TabsTrigger>
            <TabsTrigger value="kenali" className="rounded-xl text-xs font-bold py-2 px-3 sm:px-3.5 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">
              <Building2 className="h-3.5 w-3.5 mr-1.5" />
              2. Visi &amp; Misi
            </TabsTrigger>
            <TabsTrigger value="sejarah" className="rounded-xl text-xs font-bold py-2 px-3 sm:px-3.5 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">
              <History className="h-3.5 w-3.5 mr-1.5" />
              3. Sejarah Desa
            </TabsTrigger>
            <TabsTrigger value="peta" className="rounded-xl text-xs font-bold py-2 px-3 sm:px-3.5 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">
              <Compass className="h-3.5 w-3.5 mr-1.5" />
              4. Peta &amp; Batas
            </TabsTrigger>
            <TabsTrigger value="wilayah" className="rounded-xl text-xs font-bold py-2 px-3 sm:px-3.5 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">
              <Milestone className="h-3.5 w-3.5 mr-1.5" />
              5. Data Wilayah
            </TabsTrigger>
            <TabsTrigger value="potensi" className="rounded-xl text-xs font-bold py-2 px-3 sm:px-3.5 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              6. Potensi Unggulan
            </TabsTrigger>
            <TabsTrigger value="jalan-kabupaten" className="rounded-xl text-xs font-black py-2 px-3 sm:px-3.5 data-[state=active]:bg-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-sm">
              <Milestone className="h-3.5 w-3.5 mr-1.5" />
              7. Jalan Kabupaten ({jalanKabList?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="jalan-desa" className="rounded-xl text-xs font-black py-2 px-3 sm:px-3.5 data-[state=active]:bg-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-sm">
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              8. Jalan Desa ({jalanDesaList?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="rawan-bencana" className="rounded-xl text-xs font-black py-2 px-3 sm:px-3.5 data-[state=active]:bg-rose-700 data-[state=active]:text-white data-[state=active]:shadow-sm">
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
              9. Peta Rawan Bencana &amp; Jalur Evakuasi
            </TabsTrigger>
            <TabsTrigger value="galeri" className="rounded-xl text-xs font-bold py-2 px-3 sm:px-3.5 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">
              <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
              10. Media &amp; Video
            </TabsTrigger>
            <TabsTrigger value="histori" className="rounded-xl text-xs font-black py-2 px-3 sm:px-3.5 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
              <History className="h-3.5 w-3.5 mr-1.5 text-amber-300" />
              11. Riwayat &amp; Histori Perubahan
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── TAB 1: SAMBUTAN & PROFIL ─── */}
        <TabsContent value="sambutan" className="space-y-6">
          <AdminSambutanEditor currentData={profileDocData} firestore={firestore} />
        </TabsContent>

        {/* ─── TAB 2: KENALI KAMI / VISI MISI ─── */}
        <TabsContent value="kenali" className="space-y-6">
          <AdminVisiMisiEditor currentData={profileDocData} firestore={firestore} />
        </TabsContent>

        {/* ─── TAB 3: SEJARAH DESA ─── */}
        <TabsContent value="sejarah" className="space-y-6">
          <AdminSejarahEditor currentData={profileDocData} firestore={firestore} />
        </TabsContent>

        {/* ─── TAB 4: PETA & BATAS WILAYAH ─── */}
        <TabsContent value="peta" className="space-y-6">
          <AdminPetaEditor currentData={profileDocData} firestore={firestore} />
        </TabsContent>

        {/* ─── TAB 5: DATA WILAYAH ─── */}
        <TabsContent value="wilayah" className="space-y-6">
          <AdminWilayahEditor currentData={profileDocData} firestore={firestore} />
        </TabsContent>

        {/* ─── TAB 6: POTENSI UNGGULAN ─── */}
        <TabsContent value="potensi" className="space-y-6">
          <AdminPotensiEditor currentData={profileDocData} firestore={firestore} />
        </TabsContent>

        {/* ─── TAB 7: JALAN KABUPATEN ─── */}
        <TabsContent value="jalan-kabupaten" className="space-y-6">
          <AdminJalanKabupatenManager list={jalanKabList} isLoading={isLoadingJalanKab} firestore={firestore} />
        </TabsContent>

        {/* ─── TAB 8: JALAN DESA ─── */}
        <TabsContent value="jalan-desa" className="space-y-6">
          <AdminJalanDesaManager list={jalanDesaList} isLoading={isLoadingJalanDesa} firestore={firestore} />
        </TabsContent>

        {/* ─── TAB 9: RAWAN BENCANA & EVAKUASI ─── */}
        <TabsContent value="rawan-bencana" className="space-y-6">
          <AdminRawanBencanaTab />
        </TabsContent>

        {/* ─── TAB 10: MEDIA & VIDEO ─── */}
        <TabsContent value="galeri" className="space-y-6">
          <AdminMediaEditor currentData={profileDocData} firestore={firestore} />
        </TabsContent>

        {/* ─── TAB 11: HISTORI & RIWAYAT PERUBAHAN ─── */}
        <TabsContent value="histori" className="space-y-6">
          <AdminHistoriTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SUB-KOMPONEN: SAMBUTAN & PROFIL EDITOR (DENGAN UPLOAD CLOUDINARY & SEKSI LENGKAP)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_KARAKTERISTIK = [
  {
    title: 'Jejak Pemekaran Wilayah',
    desc: 'Bagian dinamika perdesaan Gandrungmangu (catatan pemekaran 1990 dari Gandrungmanis bersama Layansari), guna mendekatkan tata kelola pelayanan masyarakat.'
  },
  {
    title: 'Harmoni & Gotong Royong',
    desc: 'Masyarakat Desa Sampeldes memelihara semangat kebersamaan, musyawarah mufakat, kekeluargaan, serta gotong royong dalam setiap denyut pembangunan desa.'
  },
  {
    title: 'Pertanian & Ketahanan Pangan',
    desc: 'Ketersediaan lahan sawah produktif dan kekayaan agraris menjadi penopang utama ketahanan pangan serta kemandirian keluarga warga desa.'
  },
  {
    title: 'Perekonomian & UMKM',
    desc: 'Aktivitas perdagangan, usaha mikro dan kecil, pengolahan produk lokal, serta peningkatan kapasitas dan perluasan jaringan pemasaran digital.'
  },
  {
    title: 'Seni, Budaya & Kearifan Lokal',
    desc: 'Tradisi gotong royong, musyawarah, kesenian lokal, dan keteladanan leluhur yang menjunjung tinggi kebaikan dan kejujuran hidup.'
  },
  {
    title: 'Transformasi Digital Desa',
    desc: 'Penyelenggaraan tata kelola desa berbasis teknologi informasi untuk meningkatkan kualitas pelayanan publik yang transparan, mudah, dan cepat.'
  }
];

const DEFAULT_ARAH_PEMBANGUNAN = [
  {
    title: 'Peningkatan Kualitas Pelayanan Publik',
    desc: 'Mewujudkan pelayanan pemerintahan yang cepat, mudah, transparan, dan responsif bagi seluruh lapisan masyarakat.'
  },
  {
    title: 'Penguatan Ekonomi Masyarakat',
    desc: 'Mengembangkan pertanian, UMKM, perdagangan, jasa, dan kegiatan ekonomi berbasis potensi lokal desa.'
  },
  {
    title: 'Peningkatan Kualitas Sumber Daya Manusia',
    desc: 'Mendorong pendidikan, keterampilan, kesehatan, kepemudaan, dan pemberdayaan masyarakat secara terpadu.'
  },
  {
    title: 'Penguatan Ketahanan Pangan',
    desc: 'Mengembangkan potensi pertanian tanaman pangan dan usaha masyarakat untuk mendukung ketahanan pangan mandiri.'
  },
  {
    title: 'Pengembangan Infrastruktur',
    desc: 'Meningkatkan kualitas jalan desa, jalan lingkungan, saluran irigasi, dan sarana umum penunjang aktivitas warga.'
  },
  {
    title: 'Pelestarian Budaya Lokal',
    desc: 'Menjaga sejarah, tradisi, kesenian, gotong royong, dan kearifan lokal sebagai identitas luhur desa.'
  },
  {
    title: 'Transformasi Digital Desa',
    desc: 'Memanfaatkan teknologi informasi untuk pelayanan, transparansi anggaran, administrasi surat, dan publikasi desa.'
  }
];

const DEFAULT_PRINSIP_TATA_KELOLA = [
  { label: 'Pelayanan Masyarakat', desc: 'Pelayanan yang cepat, ramah, adil, dan mengutamakan kepentingan warga.' },
  { label: 'Transparansi', desc: 'Keterbukaan informasi publik dan akuntabilitas pengelolaan keuangan desa.' },
  { label: 'Akuntabilitas', desc: 'Setiap kebijakan dan program pembangunan dapat dipertanggungjawabkan secara terbuka.' },
  { label: 'Partisipasi Masyarakat', desc: 'Perencanaan pembangunan yang partisipatif melibatkan seluruh elemen masyarakat.' },
  { label: 'Keterbukaan Informasi', desc: 'Akses informasi pembangunan yang terbuka dan mudah dijangkau seluruh warga.' },
  { label: 'Efektivitas & Efisiensi', desc: 'Pemanfaatan sumber daya desa secara tepat sasaran, berdaya guna, dan berkelanjutan.' },
  { label: 'Pemanfaatan Teknologi', desc: 'Pengembangan pelayanan publik berbasis digital untuk efisiensi birokrasi desa.' }
];

function AdminSambutanEditor({ currentData, firestore }: any) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    kadesName: '',
    kadesTitle: 'Kepala Desa Sampeldes',
    kadesPhotoUrl: '',
    kadesSlogan: 'Tumbuh dalam Kebersamaan, Berkarya untuk Kemajuan Desa.',
    description: '',
    tagsSambutan: [
      "Luas 5,09 km² (4,27%)",
      "Penduduk 8.403 Jiwa (2024)",
      "6 RW & 38 RT",
      "2 km ke Pusat Kecamatan",
      "45 km ke Ibu Kota Kabupaten",
      "Kepadatan 1.651 jiwa/km²",
      "Pertanian & Ketahanan Pangan",
      "Pemberdayaan UMKM",
      "Transformasi Digital Desa"
    ],
    tagsText: '',
    karakteristikList: DEFAULT_KARAKTERISTIK,
    arahPembangunanList: DEFAULT_ARAH_PEMBANGUNAN,
    prinsipTataKelolaList: DEFAULT_PRINSIP_TATA_KELOLA,
    visiMisiTextBawah: 'Desa Sampeldes memiliki modal yang kuat untuk terus berkembang. Letak wilayah, potensi pertanian, sumber daya manusia, aktivitas ekonomi masyarakat, serta kehidupan sosial yang tumbuh dari semangat kebersamaan menjadi bagian penting dalam perjalanan pembangunan desa. Ke depan, pembangunan Sampeldes tidak hanya berorientasi pada pembangunan fisik, tetapi juga peningkatan kualitas manusia, penguatan ekonomi masyarakat, pelestarian budaya, perlindungan lingkungan, serta peningkatan kualitas tata kelola pemerintahan berbasis digital.',
  });

  useEffect(() => {
    if (currentData) {
      const existingTags = Array.isArray(currentData.tagsSambutan) && currentData.tagsSambutan.length > 0
        ? currentData.tagsSambutan
        : formData.tagsSambutan;

      setFormData({
        kadesName: currentData.kadesName || 'TUKIMAN',
        kadesTitle: currentData.kadesTitle || 'Kepala Desa Sampeldes',
        kadesPhotoUrl: currentData.kadesPhotoUrl || '',
        kadesSlogan: currentData.kadesSlogan || 'Tumbuh dalam Kebersamaan, Berkarya untuk Kemajuan Desa.',
        description: currentData.description || '',
        tagsSambutan: existingTags,
        tagsText: existingTags.join('\n'),
        karakteristikList: Array.isArray(currentData.karakteristikList) && currentData.karakteristikList.length > 0
          ? currentData.karakteristikList
          : DEFAULT_KARAKTERISTIK,
        arahPembangunanList: Array.isArray(currentData.arahPembangunanList) && currentData.arahPembangunanList.length > 0
          ? currentData.arahPembangunanList
          : DEFAULT_ARAH_PEMBANGUNAN,
        prinsipTataKelolaList: Array.isArray(currentData.prinsipTataKelolaList) && currentData.prinsipTataKelolaList.length > 0
          ? currentData.prinsipTataKelolaList
          : DEFAULT_PRINSIP_TATA_KELOLA,
        visiMisiTextBawah: currentData.visiMisiTextBawah || formData.visiMisiTextBawah,
      });
    }
  }, [currentData]);

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const uploadedUrl = await uploadToCloudinary(file, 'profil_kades');
      setFormData(prev => ({ ...prev, kadesPhotoUrl: uploadedUrl }));
      toast({ title: 'Foto Terunggah!', description: 'Foto kepala desa berhasil diunggah ke Cloudinary.' });
    } catch (err: any) {
      toast({ title: 'Gagal Mengunggah', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;
    setIsSaving(true);
    try {
      const parsedTags = formData.tagsText
        ? formData.tagsText.split('\n').map(t => t.trim()).filter(Boolean)
        : formData.tagsSambutan;

      const payload = {
        kadesName: formData.kadesName.trim(),
        kadesTitle: formData.kadesTitle.trim(),
        kadesPhotoUrl: formData.kadesPhotoUrl.trim(),
        kadesSlogan: formData.kadesSlogan.trim(),
        description: formData.description.trim(),
        tagsSambutan: parsedTags,
        karakteristikList: formData.karakteristikList,
        arahPembangunanList: formData.arahPembangunanList,
        prinsipTataKelolaList: formData.prinsipTataKelolaList,
        visiMisiTextBawah: formData.visiMisiTextBawah.trim(),
      };

      await saveProfileWithHistory({
        firestore,
        tab: 'sambutan',
        action: 'Pembaruan Sambutan & Profil Desa',
        summary: `Kepala Desa: ${formData.kadesName} | Slogan: "${formData.kadesSlogan}"`,
        partialData: payload,
      });

      toast({
        title: 'Berhasil Disimpan & Dicatat ke Histori!',
        description: 'Tampilan profil dan sambutan di /profil-desa telah berhasil diperbarui.'
      });
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardContent className="p-5 sm:p-7 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
            Tab 1 • Profil &amp; Sambutan
          </span>
          <h3 className="text-lg font-black text-slate-900 uppercase mt-1">Kelola Profil Resmi &amp; Sambutan Kepala Desa</h3>
          <p className="text-xs text-slate-500">Seluruh foto, nama, narasi sambutan, pilar karakteristik, arah pembangunan, dan prinsip tata kelola di halaman /profil-desa dapat dikontrol penuh di sini.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* FOTO KADES */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Foto Resmi Kepala Desa
            </Label>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="w-28 h-36 rounded-2xl overflow-hidden border-2 border-emerald-600 bg-stone-200 shrink-0 relative shadow-sm">
                {formData.kadesPhotoUrl ? (
                  <img
                    src={formData.kadesPhotoUrl}
                    alt="Foto Kades"
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center p-2">
                    Belum Ada Foto
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1 w-full">
                <div className="flex items-center gap-2 flex-wrap">
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
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="rounded-xl h-10 text-xs font-bold gap-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span>{isUploading ? 'Mengunggah ke Cloudinary...' : 'Unggah Foto dari Perangkat'}</span>
                  </Button>
                  {formData.kadesPhotoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setFormData({ ...formData, kadesPhotoUrl: '' })}
                      className="rounded-xl h-10 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Hapus Foto
                    </Button>
                  )}
                </div>
                <Input
                  value={formData.kadesPhotoUrl}
                  onChange={(e) => setFormData({ ...formData, kadesPhotoUrl: e.target.value })}
                  placeholder="Atau tempel link URL foto langsung di sini..."
                  className="rounded-xl h-9 text-xs bg-white"
                />
                <span className="text-[10px] text-slate-500 block">
                  Foto ini akan tampil pada kartu sambutan di halaman utama dan halaman /profil-desa.
                </span>
              </div>
            </div>
          </div>

          {/* IDENTITAS KADES */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-slate-700">Nama Kepala Desa</Label>
              <Input
                value={formData.kadesName}
                onChange={(e) => setFormData({ ...formData, kadesName: e.target.value })}
                placeholder="Contoh: TUKIMAN"
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-bold"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Jabatan / Gelar</Label>
              <Input
                value={formData.kadesTitle}
                onChange={(e) => setFormData({ ...formData, kadesTitle: e.target.value })}
                placeholder="Kepala Desa Sampeldes"
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-bold"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Slogan / Kutipan Sambutan</Label>
            <Input
              value={formData.kadesSlogan}
              onChange={(e) => setFormData({ ...formData, kadesSlogan: e.target.value })}
              placeholder="Kutipan inspiratif kepala desa"
              className="mt-1 rounded-xl h-10 text-xs sm:text-sm italic"
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Teks Narasi Sambutan &amp; Gambaran Umum</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tuliskan narasi sambutan resmi kepala desa atau gambaran umum desa di sini..."
              rows={7}
              className="mt-1 rounded-xl text-xs sm:text-sm leading-relaxed"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Bila dikosongkan, halaman profil akan menggunakan narasi standar BPS/profil Desa Sampeldes.
            </span>
          </div>

          {/* PILL TAGS SAMBUTAN */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700">Pill Tag / Ringkasan Cepat Sambutan (Satu per baris)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFormData({ ...formData, tagsText: formData.tagsSambutan.join('\n') })}
                className="h-7 text-[10px] font-bold text-emerald-800"
              >
                Reset Default Tags
              </Button>
            </div>
            <Textarea
              value={formData.tagsText}
              onChange={(e) => setFormData({ ...formData, tagsText: e.target.value })}
              rows={4}
              placeholder="Luas 5,09 km² (4,27%)\nPenduduk 8.403 Jiwa (2024)\n6 RW & 38 RT..."
              className="mt-1 rounded-xl text-xs font-mono"
            />
          </div>

          {/* 6 PILAR KARAKTERISTIK */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  6 Karakteristik &amp; Identitas Desa Sampeldes
                </h4>
                <p className="text-[11px] text-slate-500">Kelola 6 kartu karakteristik luhur yang tampil di bagian bawah sambutan.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({ ...formData, karakteristikList: DEFAULT_KARAKTERISTIK })}
                className="h-7 text-[10px] font-bold border-slate-300"
              >
                Kembalikan Default 6 Karakteristik
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-3 pt-2">
              {formData.karakteristikList.map((item, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">Pilar #{idx + 1}</span>
                  <Input
                    value={item.title}
                    onChange={(e) => {
                      const updated = [...formData.karakteristikList];
                      updated[idx].title = e.target.value;
                      setFormData({ ...formData, karakteristikList: updated });
                    }}
                    placeholder="Judul Karakteristik"
                    className="h-8 text-xs font-bold"
                  />
                  <Textarea
                    value={item.desc}
                    onChange={(e) => {
                      const updated = [...formData.karakteristikList];
                      updated[idx].desc = e.target.value;
                      setFormData({ ...formData, karakteristikList: updated });
                    }}
                    rows={2}
                    placeholder="Deskripsi pilar..."
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 7 ARAH PEMBANGUNAN */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  7 Fokus Arah Pembangunan Desa
                </h4>
                <p className="text-[11px] text-slate-500">Kelola poin arah prioritas pembangunan masa depan.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({ ...formData, arahPembangunanList: DEFAULT_ARAH_PEMBANGUNAN })}
                className="h-7 text-[10px] font-bold border-slate-300"
              >
                Kembalikan Default 7 Fokus
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {formData.arahPembangunanList.map((item, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">Fokus #{idx + 1}</span>
                  <Input
                    value={item.title}
                    onChange={(e) => {
                      const updated = [...formData.arahPembangunanList];
                      updated[idx].title = e.target.value;
                      setFormData({ ...formData, arahPembangunanList: updated });
                    }}
                    placeholder="Judul Fokus"
                    className="h-8 text-xs font-bold"
                  />
                  <Textarea
                    value={item.desc}
                    onChange={(e) => {
                      const updated = [...formData.arahPembangunanList];
                      updated[idx].desc = e.target.value;
                      setFormData({ ...formData, arahPembangunanList: updated });
                    }}
                    rows={2}
                    placeholder="Uraian fokus..."
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SAMPELDES MENUJU DESA MANDIRI */}
          <div>
            <Label className="text-xs font-bold text-slate-700">Narasi Penutup: Sampeldes Menuju Desa Mandiri dan Berkelanjutan</Label>
            <Textarea
              value={formData.visiMisiTextBawah}
              onChange={(e) => setFormData({ ...formData, visiMisiTextBawah: e.target.value })}
              rows={4}
              placeholder="Narasi komitmen menuju desa mandiri..."
              className="mt-1 rounded-xl text-xs sm:text-sm leading-relaxed"
            />
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-2 h-10 px-6 shadow-sm"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? 'Menyimpan & Mencatat Histori...' : 'Simpan Perubahan Sambutan & Profil'}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SUB-KOMPONEN: VISI & MISI EDITOR
// ─────────────────────────────────────────────────────────────────────────────
function AdminVisiMisiEditor({ currentData, firestore }: any) {
  const { toast } = useToast();
  const [visi, setVisi] = useState('');
  const [misiText, setMisiText] = useState('');
  const [budayaKerja, setBudayaKerja] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentData) {
      setVisi(currentData.visiText || 'Mewujudkan Desa Sampeldes yang Mandiri, Sejahtera, Berkarakter, dan Berkelanjutan melalui Tata Kelola Pemerintahan yang Bersih, Partisipatif, dan Berorientasi Pelayanan.');
      setBudayaKerja(currentData.budayaKerja || 'RESPONSIF, TRANSPARAN, AKUNTABEL, DAN GOTONG ROYONG');
      if (Array.isArray(currentData.misiList)) {
        setMisiText(currentData.misiList.join('\n'));
      } else {
        setMisiText(
          '1. Meningkatkan kualitas tata kelola pemerintahan desa yang transparan, akuntabel, dan berbasis teknologi informasi.\n' +
          '2. Mengembangkan perekonomian desa berbasis potensi lokal pertanian, UMKM, dan penguatan kelembagaan BUMDes.\n' +
          '3. Meningkatkan ketersediaan dan kualitas infrastruktur pedesaan yang merata dan berwawasan lingkungan.\n' +
          '4. Meningkatkan kualitas sumber daya manusia melalui pelayanan pendidikan, kesehatan, dan pembinaan generasi muda.\n' +
          '5. Memperkokoh kerukunan masyarakat berlandaskan nilai-nilai keagamaan, kearifan lokal, dan semangat gotong royong.'
        );
      }
    }
  }, [currentData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;
    setIsSaving(true);
    try {
      const list = misiText.split('\n').map(s => s.trim()).filter(Boolean);
      const payload = {
        visiText: visi.trim(),
        misiList: list,
        budayaKerja: budayaKerja.trim(),
      };

      await saveProfileWithHistory({
        firestore,
        tab: 'kenali',
        action: 'Pembaruan Visi & Misi Desa',
        summary: `Visi: "${visi.slice(0, 60)}..." | ${list.length} Poin Misi`,
        partialData: payload,
      });

      toast({
        title: 'Visi & Misi Berhasil Disimpan!',
        description: 'Perubahan telah disimpan dan dicatat dalam histori riwayat.'
      });
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardContent className="p-5 sm:p-7 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
            Tab 2 • Visi &amp; Misi Desa
          </span>
          <h3 className="text-lg font-black text-slate-900 uppercase mt-1">Visi, Misi &amp; Budaya Pelayanan Desa Sampeldes</h3>
          <p className="text-xs text-slate-500">Teks ini akan tampil secara menonjol pada tab <strong>Kenali Kami</strong> di halaman /profil-desa.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label className="text-xs font-bold text-slate-700">Teks Visi Desa</Label>
            <Textarea
              value={visi}
              onChange={(e) => setVisi(e.target.value)}
              rows={3}
              placeholder="Tuliskan Visi Desa..."
              className="mt-1 rounded-xl text-xs sm:text-sm font-medium leading-relaxed"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Poin Misi Desa (Satu baris untuk setiap poin misi)</Label>
            <Textarea
              value={misiText}
              onChange={(e) => setMisiText(e.target.value)}
              rows={7}
              placeholder="Tuliskan misi desa (pisahkan tiap poin dengan baris baru)..."
              className="mt-1 rounded-xl text-xs sm:text-sm leading-relaxed"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Slogan Budaya Kerja / Nilai Pelayanan (Opsional)</Label>
            <Input
              value={budayaKerja}
              onChange={(e) => setBudayaKerja(e.target.value)}
              placeholder="Contoh: BERAKHLAK, TRANSPARAN, GOTONG ROYONG"
              className="mt-1 rounded-xl h-10 text-xs sm:text-sm uppercase font-bold"
            />
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-2 h-10 px-6 shadow-sm"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Visi & Misi'}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SUB-KOMPONEN: SEJARAH DESA EDITOR (DENGAN TIMELINE LENGKAP & EDITABLE)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_TIMELINE = [
  {
    period: 'Tradisi Tutur & Sejarah Lokal',
    title: 'Wilayah Umbut Pait & Cerita Sesepuh',
    desc: 'Tulisan sejarah lokal dan cerita sesepuh menyebut bahwa wilayah Sampeldes pada masa sebelumnya dikenal dengan nama "Umbut Pait", yang juga dikaitkan dengan sebutan "Desa Majapahit".'
  },
  {
    period: 'Tahun 1990',
    title: 'Pemekaran Wilayah Gandrungmanis',
    desc: 'Berdasarkan catatan sejarah pada situs resmi Desa Layansari, pada tahun 1990 Desa Gandrungmanis dimekarkan menjadi tiga desa: Desa Gandrungmanis (desa induk), Desa Layansari, dan Desa Sampeldes.'
  },
  {
    period: 'Penelusuran & Pencocokan Arsip',
    title: 'Verifikasi Dokumen Resmi & Asal-Usul Nama',
    desc: 'Penetapan tahun pembentukan, batas wilayah awal, dasar hukum pemekaran, serta penelusuran hubungan historis nama Sampeldes terus dicocokkan dengan dokumen resmi pemerintah daerah, arsip kecamatan, dan dokumen desa.'
  },
  {
    period: 'Warisan & Ingatan Kolektif',
    title: 'Menjaga Memori Kolektif Lintas Generasi',
    desc: 'Kisah balai desa terdahulu, tradisi lumbung penyimpanan padi, dan gotong royong terus didokumentasikan secara proporsional untuk menjaga ingatan kolektif masyarakat dan bekal generasi mendatang.'
  }
];

function AdminSejarahEditor({ currentData, firestore }: any) {
  const { toast } = useToast();
  const [sejarahTitle, setSejarahTitle] = useState('Sejarah Desa Sampeldes');
  const [asalUsul, setAsalUsul] = useState('');
  const [timeline, setTimeline] = useState(DEFAULT_TIMELINE);
  const [catatanVerifikasi, setCatatanVerifikasi] = useState('');
  const [amanatLuhur, setAmanatLuhur] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentData) {
      setSejarahTitle(currentData.sejarahTitle || 'Sejarah Desa Sampeldes');
      setAsalUsul(currentData.sejarahAsalUsul || currentData.sejarahContent || '');
      setTimeline(
        Array.isArray(currentData.sejarahTimeline) && currentData.sejarahTimeline.length > 0
          ? currentData.sejarahTimeline
          : DEFAULT_TIMELINE
      );
      setCatatanVerifikasi(currentData.catatanVerifikasiSejarah || '');
      setAmanatLuhur(currentData.amanatNilaiLuhur || '');
    }
  }, [currentData]);

  const handleAddTimeline = () => {
    setTimeline([
      ...timeline,
      { period: 'Era Baru', title: 'Peristiwa Penting', desc: 'Deskripsi peristiwa sejarah desa...' }
    ]);
  };

  const handleRemoveTimeline = (index: number) => {
    setTimeline(timeline.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;
    setIsSaving(true);
    try {
      const payload = {
        sejarahTitle: sejarahTitle.trim(),
        sejarahAsalUsul: asalUsul.trim(),
        sejarahContent: asalUsul.trim(),
        sejarahTimeline: timeline,
        catatanVerifikasiSejarah: catatanVerifikasi.trim(),
        amanatNilaiLuhur: amanatLuhur.trim(),
      };

      await saveProfileWithHistory({
        firestore,
        tab: 'sejarah',
        action: 'Pembaruan Sejarah Desa',
        summary: `Judul: ${sejarahTitle} | ${timeline.length} Peristiwa Timeline`,
        partialData: payload,
      });

      toast({
        title: 'Sejarah Desa Berhasil Disimpan!',
        description: 'Narasi dan timeline sejarah telah diperbarui di /profil-desa dan dicatat di histori.'
      });
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardContent className="p-5 sm:p-7 space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
            Tab 3 • Sejarah Desa
          </span>
          <h3 className="text-lg font-black text-slate-900 uppercase mt-1">Sejarah, Asal-Usul &amp; Timeline Jejak Perjalanan Desa</h3>
          <p className="text-xs text-slate-500">Kelola narasi sejarah asal-usul Desa Sampeldes serta tonggak peristiwa sejarah yang tampil dalam garis waktu.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <Label className="text-xs font-bold text-slate-700">Judul Utama Halaman Sejarah</Label>
            <Input
              value={sejarahTitle}
              onChange={(e) => setSejarahTitle(e.target.value)}
              placeholder="Contoh: Sejarah Desa Sampeldes"
              className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-bold"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Narasi Lengkap Sejarah &amp; Asal-Usul Berdirinya Desa</Label>
            <Textarea
              value={asalUsul}
              onChange={(e) => setAsalUsul(e.target.value)}
              rows={8}
              placeholder="Ceritakan asal mula nama Sampeldes, tokoh pendiri desa, serta dinamika perkembangannya..."
              className="mt-1 rounded-xl text-xs sm:text-sm leading-relaxed"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Bila dikosongkan, halaman /profil-desa akan menampilkan teks narasi sejarah default Desa Sampeldes.
            </span>
          </div>

          {/* TIMELINE PERISTIWA */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Tahapan Timeline Perjalanan Desa ({timeline.length} Peristiwa)
                </h4>
                <p className="text-[11px] text-slate-500">Peristiwa bersejarah yang ditampilkan dalam timeline garis waktu.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTimeline(DEFAULT_TIMELINE)}
                  className="h-8 text-xs font-bold border-slate-300"
                >
                  Reset Default
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddTimeline}
                  className="h-8 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Tambah Peristiwa
                </Button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {timeline.map((event, idx) => (
                <div key={idx} className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                      Peristiwa #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTimeline(idx)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] font-bold text-slate-600">Era / Periode</Label>
                      <Input
                        value={event.period}
                        onChange={(e) => {
                          const updated = [...timeline];
                          updated[idx].period = e.target.value;
                          setTimeline(updated);
                        }}
                        placeholder="Contoh: Tahun 1990"
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-bold text-slate-600">Judul Peristiwa</Label>
                      <Input
                        value={event.title}
                        onChange={(e) => {
                          const updated = [...timeline];
                          updated[idx].title = e.target.value;
                          setTimeline(updated);
                        }}
                        placeholder="Contoh: Pemekaran Wilayah"
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-600">Deskripsi Peristiwa</Label>
                    <Textarea
                      value={event.desc}
                      onChange={(e) => {
                        const updated = [...timeline];
                        updated[idx].desc = e.target.value;
                        setTimeline(updated);
                      }}
                      rows={2}
                      placeholder="Penjelasan ringkas peristiwa..."
                      className="text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-slate-700">Catatan Verifikasi Sumber Sejarah</Label>
              <Textarea
                value={catatanVerifikasi}
                onChange={(e) => setCatatanVerifikasi(e.target.value)}
                rows={3}
                placeholder="Catatan sumber arsip dan tokoh desa..."
                className="mt-1 rounded-xl text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Amanat Nilai Luhur Desa</Label>
              <Textarea
                value={amanatLuhur}
                onChange={(e) => setAmanatLuhur(e.target.value)}
                rows={3}
                placeholder="Pesan moral dan amanat leluhur untuk generasi desa..."
                className="mt-1 rounded-xl text-xs italic"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-2 h-10 px-6 shadow-sm"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Sejarah Desa'}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SUB-KOMPONEN: PETA & BATAS WILAYAH EDITOR
// ─────────────────────────────────────────────────────────────────────────────
function AdminPetaEditor({ currentData, firestore }: any) {
  const { toast } = useToast();
  const [batas, setBatas] = useState({
    batasUtara: '',
    batasSelatan: '',
    batasBarat: '',
    batasTimur: '',
    koordinatLat: '',
    koordinatLng: '',
    deskripsiPeta: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentData) {
      setBatas({
        batasUtara: currentData.batasUtara || 'Desa Gandrungmanis / Desa Cinanggu',
        batasSelatan: currentData.batasSelatan || 'Desa Wringinharjo',
        batasBarat: currentData.batasBarat || 'Desa Gandrungmangu',
        batasTimur: currentData.batasTimur || 'Kecamatan Bantarsari',
        koordinatLat: currentData.koordinatLat || '-7.5136184',
        koordinatLng: currentData.koordinatLng || '108.8401798',
        deskripsiPeta: currentData.deskripsiPeta || 'Secara umum, wilayah Desa Sampeldes memiliki karakter pedesaan dengan kawasan permukiman warga yang asri, bentangan persawahan subur, lahan pertanian tanaman pangan, perkebunan, serta berbagai denyut aktivitas ekonomi masyarakat.',
      });
    }
  }, [currentData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;
    setIsSaving(true);
    try {
      await saveProfileWithHistory({
        firestore,
        tab: 'peta',
        action: 'Pembaruan Peta & Batas Wilayah',
        summary: `Batas Utara: ${batas.batasUtara} | Koordinat: ${batas.koordinatLat}, ${batas.koordinatLng}`,
        partialData: {
          batasUtara: batas.batasUtara.trim(),
          batasSelatan: batas.batasSelatan.trim(),
          batasBarat: batas.batasBarat.trim(),
          batasTimur: batas.batasTimur.trim(),
          koordinatLat: batas.koordinatLat.trim(),
          koordinatLng: batas.koordinatLng.trim(),
          deskripsiPeta: batas.deskripsiPeta.trim(),
        },
      });

      toast({
        title: 'Batas Wilayah Berhasil Disimpan!',
        description: 'Peta dan batas administratif di /profil-desa telah diperbarui.'
      });
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardContent className="p-5 sm:p-7 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
            Tab 4 • Peta &amp; Batas Wilayah
          </span>
          <h3 className="text-lg font-black text-slate-900 uppercase mt-1">Peta &amp; Batas Administratif Wilayah</h3>
          <p className="text-xs text-slate-500">Tentukan batas-batas wilayah desa terhadap desa/kecamatan tetangga serta titik pusat koordinat peta.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-slate-700">Batas Utara</Label>
              <Input
                value={batas.batasUtara}
                onChange={(e) => setBatas({ ...batas, batasUtara: e.target.value })}
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-medium"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Batas Selatan</Label>
              <Input
                value={batas.batasSelatan}
                onChange={(e) => setBatas({ ...batas, batasSelatan: e.target.value })}
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-medium"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Batas Barat</Label>
              <Input
                value={batas.batasBarat}
                onChange={(e) => setBatas({ ...batas, batasBarat: e.target.value })}
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-medium"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Batas Timur</Label>
              <Input
                value={batas.batasTimur}
                onChange={(e) => setBatas({ ...batas, batasTimur: e.target.value })}
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <Label className="text-xs font-bold text-slate-700">Titik Latitude (Garis Lintang)</Label>
              <Input
                value={batas.koordinatLat}
                onChange={(e) => setBatas({ ...batas, koordinatLat: e.target.value })}
                placeholder="-7.5136184"
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-mono font-bold"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Titik Longitude (Garis Bujur)</Label>
              <Input
                value={batas.koordinatLng}
                onChange={(e) => setBatas({ ...batas, koordinatLng: e.target.value })}
                placeholder="108.8401798"
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Deskripsi Karakteristik Geografis Wilayah</Label>
            <Textarea
              value={batas.deskripsiPeta}
              onChange={(e) => setBatas({ ...batas, deskripsiPeta: e.target.value })}
              rows={3}
              placeholder="Karakteristik bentang alam, persawahan, permukiman..."
              className="mt-1 rounded-xl text-xs sm:text-sm leading-relaxed"
            />
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-2 h-10 px-6 shadow-sm"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Batas Wilayah & Peta'}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SUB-KOMPONEN: DATA WILAYAH EDITOR
// ─────────────────────────────────────────────────────────────────────────────
function AdminWilayahEditor({ currentData, firestore }: any) {
  const { toast } = useToast();
  const [data, setData] = useState({
    luasWilayahKm2: 5.09,
    jumlahPenduduk: 8403,
    jumlahLakiLaki: 4307,
    jumlahPerempuan: 4096,
    jumlahRW: 6,
    jumlahRT: 38,
    jarakKecamatanKm: 2,
    jarakKabupatenKm: 45,
    catatanWilayahDusun: 'Publikasi BPS yang digunakan tidak mencantumkan daftar lengkap nama dusun di Desa Sampeldes. Karena itu, nama dan jumlah dusun perlu dikonfirmasi melalui Pemerintah Desa Sampeldes sebelum ditampilkan secara definitif di website.',
    catatanSumberBps: 'Badan Pusat Statistik Kabupaten Cilacap. Kecamatan Gandrungmangu Dalam Angka 2025, Volume 36, 2025.',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentData) {
      setData({
        luasWilayahKm2: Number(currentData.luasWilayahKm2 || currentData.luasWilayah) || 5.09,
        jumlahPenduduk: Number(currentData.jumlahPenduduk || currentData.totalPenduduk) || 8403,
        jumlahLakiLaki: Number(currentData.jumlahLakiLaki) || 4307,
        jumlahPerempuan: Number(currentData.jumlahPerempuan) || 4096,
        jumlahRW: Number(currentData.jumlahRW || currentData.jumlahRw) || 6,
        jumlahRT: Number(currentData.jumlahRT || currentData.jumlahRt) || 38,
        jarakKecamatanKm: Number(currentData.jarakKecamatanKm || currentData.jarakKecamatan) || 2,
        jarakKabupatenKm: Number(currentData.jarakKabupatenKm || currentData.jarakKabupaten) || 45,
        catatanWilayahDusun: currentData.catatanWilayahDusun || data.catatanWilayahDusun,
        catatanSumberBps: currentData.catatanSumberBps || data.catatanSumberBps,
      });
    }
  }, [currentData]);

  // Kalkulasi Live Otomatis
  const kepadatan = data.luasWilayahKm2 > 0
    ? Math.round(data.jumlahPenduduk / data.luasWilayahKm2)
    : 0;

  const rasioGender = data.jumlahPerempuan > 0
    ? ((data.jumlahLakiLaki / data.jumlahPerempuan) * 100).toFixed(2)
    : '100.00';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;
    setIsSaving(true);
    try {
      const payload = {
        luasWilayahKm2: data.luasWilayahKm2,
        luasWilayah: data.luasWilayahKm2,
        jumlahPenduduk: data.jumlahPenduduk,
        totalPenduduk: data.jumlahPenduduk,
        jumlahLakiLaki: data.jumlahLakiLaki,
        jumlahPerempuan: data.jumlahPerempuan,
        jumlahRW: data.jumlahRW,
        jumlahRw: data.jumlahRW,
        jumlahRT: data.jumlahRT,
        jumlahRt: data.jumlahRT,
        jarakKecamatanKm: data.jarakKecamatanKm,
        jarakKecamatan: data.jarakKecamatanKm,
        jarakKabupatenKm: data.jarakKabupatenKm,
        jarakKabupaten: data.jarakKabupatenKm,
        kepadatanPenduduk: kepadatan,
        rasioJenisKelamin: rasioGender,
        catatanWilayahDusun: data.catatanWilayahDusun.trim(),
        catatanSumberBps: data.catatanSumberBps.trim(),
      };

      await saveProfileWithHistory({
        firestore,
        tab: 'wilayah',
        action: 'Pembaruan Data Wilayah & Penduduk',
        summary: `Penduduk: ${formatNumber(data.jumlahPenduduk)} jiwa, Luas: ${data.luasWilayahKm2} km², Kepadatan: ${formatNumber(kepadatan)}/km²`,
        partialData: payload,
      });

      toast({
        title: 'Data Wilayah Berhasil Disimpan!',
        description: 'Data statistik kependudukan dan kewilayahan telah sinkron dengan /profil-desa.'
      });
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardContent className="p-5 sm:p-7 space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
            Tab 5 • Data Wilayah &amp; Kependudukan
          </span>
          <h3 className="text-lg font-black text-slate-900 uppercase mt-1">Statistik Wilayah &amp; Kependudukan Resmi</h3>
          <p className="text-xs text-slate-500">Nilai-nilai ini langsung memperbarui ringkasan sidebar, tabel BPS, dan kartu indikator di halaman /profil-desa.</p>
        </div>

        {/* Live Calculation Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Penduduk</span>
            <p className="text-lg font-mono font-black text-slate-900">{formatNumber(data.jumlahPenduduk)} <span className="text-xs font-normal text-slate-500">Jiwa</span></p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Luas Wilayah</span>
            <p className="text-lg font-mono font-black text-slate-900">{data.luasWilayahKm2} <span className="text-xs font-normal text-slate-500">km²</span></p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase">Kepadatan (Otomatis)</span>
            <p className="text-lg font-mono font-black text-emerald-800">{formatNumber(kepadatan)} <span className="text-xs font-normal text-slate-500">jiwa/km²</span></p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase">Rasio Gender (Otomatis)</span>
            <p className="text-lg font-mono font-black text-emerald-800">{rasioGender} <span className="text-xs font-normal text-slate-500">L/100 P</span></p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs font-bold text-slate-700">Luas Wilayah (km²)</Label>
              <Input
                type="number"
                step="0.01"
                value={data.luasWilayahKm2}
                onChange={(e) => setData({ ...data, luasWilayahKm2: parseFloat(e.target.value) || 0 })}
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-bold font-mono"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Total Penduduk (Jiwa)</Label>
              <Input
                type="number"
                value={data.jumlahPenduduk}
                onChange={(e) => setData({ ...data, jumlahPenduduk: parseInt(e.target.value) || 0 })}
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-bold font-mono"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Penduduk Laki-Laki (Jiwa)</Label>
              <Input
                type="number"
                value={data.jumlahLakiLaki}
                onChange={(e) => setData({ ...data, jumlahLakiLaki: parseInt(e.target.value) || 0 })}
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-bold font-mono"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Penduduk Perempuan (Jiwa)</Label>
              <Input
                type="number"
                value={data.jumlahPerempuan}
                onChange={(e) => setData({ ...data, jumlahPerempuan: parseInt(e.target.value) || 0 })}
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-bold font-mono"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
            <div>
              <Label className="text-xs font-bold text-slate-700">Jumlah RW</Label>
              <Input
                type="number"
                value={data.jumlahRW}
                onChange={(e) => setData({ ...data, jumlahRW: parseInt(e.target.value) || 0 })}
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-bold font-mono"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Jumlah RT</Label>
              <Input
                type="number"
                value={data.jumlahRT}
                onChange={(e) => setData({ ...data, jumlahRT: parseInt(e.target.value) || 0 })}
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-bold font-mono"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Jarak ke Kecamatan (km)</Label>
              <Input
                type="number"
                step="0.1"
                value={data.jarakKecamatanKm}
                onChange={(e) => setData({ ...data, jarakKecamatanKm: parseFloat(e.target.value) || 0 })}
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-bold font-mono"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Jarak ke Kabupaten (km)</Label>
              <Input
                type="number"
                step="0.1"
                value={data.jarakKabupatenKm}
                onChange={(e) => setData({ ...data, jarakKabupatenKm: parseFloat(e.target.value) || 0 })}
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-bold font-mono"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <Label className="text-xs font-bold text-slate-700">Catatan Wilayah Dusun</Label>
              <Textarea
                value={data.catatanWilayahDusun}
                onChange={(e) => setData({ ...data, catatanWilayahDusun: e.target.value })}
                rows={3}
                placeholder="Catatan mengenai status nama dusun..."
                className="mt-1 rounded-xl text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Catatan Rujukan Sumber BPS</Label>
              <Textarea
                value={data.catatanSumberBps}
                onChange={(e) => setData({ ...data, catatanSumberBps: e.target.value })}
                rows={3}
                placeholder="Judul dan volume publikasi BPS rujukan..."
                className="mt-1 rounded-xl text-xs"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-2 h-10 px-6 shadow-sm"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Data Wilayah & Penduduk'}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SUB-KOMPONEN: POTENSI UNGGULAN EDITOR
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_POTENSI_LIST = [
  {
    title: '1. Potensi Pertanian',
    desc: 'Pengembangan pertanian tanaman pangan (padi & palawija), pengolahan hasil panen, penguatan kelompok tani, serta penerapan teknologi ramah lingkungan yang berkelanjutan.'
  },
  {
    title: '2. Potensi UMKM & Perdagangan',
    desc: 'Pengembangan usaha rumah tangga, perdagangan, jasa, dan produk lokal melalui peningkatan kualitas produk, standardisasi kemasan, dan perluasan jaringan pasar.'
  },
  {
    title: '3. Potensi Sumber Daya Manusia',
    desc: 'Peningkatan keterampilan dan keahlian masyarakat melalui pelatihan kewirausahaan, vokasi, pemberdayaan perempuan, dan penguatan lembaga ekonomi desa.'
  },
  {
    title: '4. Potensi Pemuda & Generasi Muda',
    desc: 'Wadah pembinaan kepemudaan dalam bidang olahraga, seni budaya, kewirausahaan muda, kepemimpinan organisasi, serta motor inovasi transformasi digital desa.'
  },
  {
    title: '5. Potensi Sosial Budaya & Kearifan Lokal',
    desc: 'Pelestarian tradisi leluhur, kesenian lokal, semangat gotong royong warga, musyawarah desa, dan nilai keteladanan yang diwariskan turun-temurun.'
  },
  {
    title: '6. Potensi Ekonomi Digital',
    desc: 'Pemanfaatan teknologi informasi untuk pelayanan publik online, transparansi informasi, promosi produk UMKM desa, dan publikasi potensi desa ke pasar luas.'
  },
  {
    title: '7. Potensi Ketahanan Pangan',
    desc: 'Pengembangan sektor pertanian dan aktivitas ekonomi masyarakat desa untuk memperkuat ketersediaan, keterjangkauan, dan ketahanan pangan desa secara mandiri.'
  }
];

const DEFAULT_STRATEGI_UMKM = [
  "Peningkatan kualitas produk lokal",
  "Pengemasan & standardisasi produk",
  "Pemasaran digital berbasis media sosial & web",
  "Perluasan jaringan pemasaran antarwilayah",
  "Peningkatan kapasitas & pelatihan pelaku usaha",
  "Penguatan kelembagaan ekonomi masyarakat",
  "Pengembangan produk unggulan khas desa",
  "Pemanfaatan teknologi informasi pemasaran"
];

const DEFAULT_INFRASTRUKTUR = [
  "Pembangunan dan pemeliharaan jalan desa serta jalan lingkungan",
  "Normalisasi dan perbaikan saluran irigasi pertanian",
  "Penyediaan dan peningkatan sarana air bersih warga",
  "Fasilitas umum, fasilitas sosial, dan sarana ekonomi"
];

function AdminPotensiEditor({ currentData, firestore }: any) {
  const { toast } = useToast();
  const [data, setData] = useState({
    ringkasanPotensi: '',
    sektorPertanian: '',
    sektorPeternakan: '',
    sektorUMKM: '',
    potensiList: DEFAULT_POTENSI_LIST,
    strategiUmkmText: DEFAULT_STRATEGI_UMKM.join('\n'),
    infrastrukturText: DEFAULT_INFRASTRUKTUR.join('\n'),
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentData) {
      setData({
        ringkasanPotensi: currentData.ringkasanPotensi || '',
        sektorPertanian: currentData.sektorPertanian || currentData.potensiPertanian || '',
        sektorPeternakan: currentData.sektorPeternakan || '',
        sektorUMKM: currentData.sektorUMKM || currentData.potensiUmkm || '',
        potensiList: Array.isArray(currentData.potensiList) && currentData.potensiList.length > 0
          ? currentData.potensiList
          : DEFAULT_POTENSI_LIST,
        strategiUmkmText: Array.isArray(currentData.strategiUmkm) && currentData.strategiUmkm.length > 0
          ? currentData.strategiUmkm.join('\n')
          : DEFAULT_STRATEGI_UMKM.join('\n'),
        infrastrukturText: Array.isArray(currentData.infrastrukturPembangunan) && currentData.infrastrukturPembangunan.length > 0
          ? currentData.infrastrukturPembangunan.join('\n')
          : DEFAULT_INFRASTRUKTUR.join('\n'),
      });
    }
  }, [currentData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;
    setIsSaving(true);
    try {
      const strategiList = data.strategiUmkmText.split('\n').map(s => s.trim()).filter(Boolean);
      const infraList = data.infrastrukturText.split('\n').map(s => s.trim()).filter(Boolean);

      const payload = {
        ringkasanPotensi: data.ringkasanPotensi.trim(),
        sektorPertanian: data.sektorPertanian.trim(),
        potensiPertanian: data.sektorPertanian.trim(),
        sektorPeternakan: data.sektorPeternakan.trim(),
        sektorUMKM: data.sektorUMKM.trim(),
        potensiUmkm: data.sektorUMKM.trim(),
        potensiList: data.potensiList,
        strategiUmkm: strategiList,
        infrastrukturPembangunan: infraList,
      };

      await saveProfileWithHistory({
        firestore,
        tab: 'potensi',
        action: 'Pembaruan Potensi Unggulan',
        summary: `Potensi Sektor: Pertanian, UMKM, Peternakan & ${data.potensiList.length} Sektor Utama`,
        partialData: payload,
      });

      toast({
        title: 'Potensi Unggulan Berhasil Disimpan!',
        description: 'Seluruh kartu potensi dan strategi di /profil-desa telah diperbarui.'
      });
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardContent className="p-5 sm:p-7 space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
            Tab 6 • Potensi Unggulan Desa
          </span>
          <h3 className="text-lg font-black text-slate-900 uppercase mt-1">Potensi Unggulan &amp; Pilar Ekonomi Desa</h3>
          <p className="text-xs text-slate-500">Kelola narasi potensi utama pertanian, peternakan, perikanan, UMKM serta 7 pilar keunggulan desa.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label className="text-xs font-bold text-slate-700">Ringkasan Potensi Umum Desa</Label>
            <Textarea
              value={data.ringkasanPotensi}
              onChange={(e) => setData({ ...data, ringkasanPotensi: e.target.value })}
              rows={3}
              placeholder="Gambaran umum potensi alam dan ekonomi masyarakat desa..."
              className="mt-1 rounded-xl text-xs sm:text-sm leading-relaxed"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-bold text-slate-700">Potensi Pertanian &amp; Ketahanan Pangan</Label>
              <Textarea
                value={data.sektorPertanian}
                onChange={(e) => setData({ ...data, sektorPertanian: e.target.value })}
                rows={4}
                placeholder="Komoditas padi, palawija, hortikultura..."
                className="mt-1 rounded-xl text-xs sm:text-sm leading-relaxed"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Potensi Peternakan &amp; Perikanan</Label>
              <Textarea
                value={data.sektorPeternakan}
                onChange={(e) => setData({ ...data, sektorPeternakan: e.target.value })}
                rows={4}
                placeholder="Ternak sapi, kambing, unggas, budidaya ikan air tawar..."
                className="mt-1 rounded-xl text-xs sm:text-sm leading-relaxed"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Potensi UMKM &amp; Ekonomi Kreatif</Label>
              <Textarea
                value={data.sektorUMKM}
                onChange={(e) => setData({ ...data, sektorUMKM: e.target.value })}
                rows={4}
                placeholder="Produk olahan makanan, kerajinan tangan, perdagangan lokal..."
                className="mt-1 rounded-xl text-xs sm:text-sm leading-relaxed"
              />
            </div>
          </div>

          {/* 7 KARTU POTENSI UNGGULAN */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  7 Kartu Potensi Unggulan Desa
                </h4>
                <p className="text-[11px] text-slate-500">Kelola 7 kartu potensi yang tampil di grid tab Potensi Unggulan.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setData({ ...data, potensiList: DEFAULT_POTENSI_LIST })}
                className="h-7 text-[10px] font-bold border-slate-300"
              >
                Reset Default 7 Potensi
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {data.potensiList.map((item, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">Potensi #{idx + 1}</span>
                  <Input
                    value={item.title}
                    onChange={(e) => {
                      const updated = [...data.potensiList];
                      updated[idx].title = e.target.value;
                      setData({ ...data, potensiList: updated });
                    }}
                    placeholder="Judul Potensi"
                    className="h-8 text-xs font-bold"
                  />
                  <Textarea
                    value={item.desc}
                    onChange={(e) => {
                      const updated = [...data.potensiList];
                      updated[idx].desc = e.target.value;
                      setData({ ...data, potensiList: updated });
                    }}
                    rows={2}
                    placeholder="Uraian potensi..."
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-slate-700">Strategi Pengembangan UMKM (Satu per baris)</Label>
              <Textarea
                value={data.strategiUmkmText}
                onChange={(e) => setData({ ...data, strategiUmkmText: e.target.value })}
                rows={4}
                placeholder="Peningkatan kualitas produk lokal..."
                className="mt-1 rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700">Prioritas Pembangunan Infrastruktur (Satu per baris)</Label>
              <Textarea
                value={data.infrastrukturText}
                onChange={(e) => setData({ ...data, infrastrukturText: e.target.value })}
                rows={4}
                placeholder="Pembangunan dan pemeliharaan jalan..."
                className="mt-1 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-2 h-10 px-6 shadow-sm"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Potensi Unggulan'}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SUB-KOMPONEN: JALAN KABUPATEN MANAGER (CRUD DENGAN FOTO & VIDEO)
// ─────────────────────────────────────────────────────────────────────────────
function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) return cleanUrl;
  const vParamMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vParamMatch && vParamMatch[1]) return vParamMatch[1];
  const pathMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/);
  if (pathMatch && pathMatch[1]) return pathMatch[1];
  const broadMatch = cleanUrl.match(/(?:[=\/])([a-zA-Z0-9_-]{11})(?:[?&#\s]|$)/);
  if (broadMatch && broadMatch[1]) return broadMatch[1];
  return null;
}

function getYouTubeThumbnail(url?: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function AdminJalanKabupatenManager({ list, isLoading, firestore }: any) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const initialForm = {
    noRuas: '',
    namaRuas: '',
    pangkalRuas: '',
    ujungRuas: '',
    panjangRuas: 0,
    lebarRuas: 0,
    kondisiBaik: 0,
    kondisiSedang: 0,
    kondisiRusakRingan: 0,
    kondisiRusakBerat: 0,
    fotoUrl: '',
    youtubeUrl: '',
    keterangan: '',
  };

  const [form, setForm] = useState(initialForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    if (!form.namaRuas.trim()) {
      toast({ title: 'Gagal', description: 'Nama Ruas Jalan wajib diisi', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        noRuas: form.noRuas.trim(),
        namaRuas: form.namaRuas.trim(),
        pangkalRuas: form.pangkalRuas.trim(),
        ujungRuas: form.ujungRuas.trim(),
        panjangRuas: Number(form.panjangRuas) || 0,
        lebarRuas: Number(form.lebarRuas) || 0,
        kondisiBaik: Number(form.kondisiBaik) || 0,
        kondisiSedang: Number(form.kondisiSedang) || 0,
        kondisiRusakRingan: Number(form.kondisiRusakRingan) || 0,
        kondisiRusakBerat: Number(form.kondisiRusakBerat) || 0,
        fotoUrl: form.fotoUrl.trim(),
        youtubeUrl: form.youtubeUrl.trim(),
        keterangan: form.keterangan.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(firestore, 'jalanKabupaten', editingId), payload);
        toast({ title: 'Berhasil!', description: `Ruas ${form.namaRuas} berhasil diperbarui.` });
        setEditingId(null);
      } else {
        await addDoc(collection(firestore, 'jalanKabupaten'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Berhasil!', description: `Ruas ${form.namaRuas} berhasil ditambahkan.` });
      }

      setForm(initialForm);
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    }
  };

  const handleEdit = (item: JalanKabupatenItem) => {
    setEditingId(item.id);
    setForm({
      noRuas: item.noRuas || '',
      namaRuas: item.namaRuas || '',
      pangkalRuas: item.pangkalRuas || '',
      ujungRuas: item.ujungRuas || '',
      panjangRuas: item.panjangRuas || 0,
      lebarRuas: item.lebarRuas || 0,
      kondisiBaik: item.kondisiBaik || 0,
      kondisiSedang: item.kondisiSedang || 0,
      kondisiRusakRingan: item.kondisiRusakRingan || 0,
      kondisiRusakBerat: item.kondisiRusakBerat || 0,
      fotoUrl: item.fotoUrl || '',
      youtubeUrl: item.youtubeUrl || (item as any).videoUrl || '',
      keterangan: item.keterangan || '',
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!firestore) return;
    if (!confirm(`Hapus ruas jalan kabupaten "${nama}"?`)) return;
    try {
      await deleteDoc(doc(firestore, 'jalanKabupaten', id));
      toast({ title: 'Terhapus', description: `Ruas ${nama} berhasil dihapus.` });
    } catch (err: any) {
      toast({ title: 'Gagal Menghapus', description: err.message, variant: 'destructive' });
    }
  };

  const filteredList = useMemo(() => {
    if (!list) return [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((it: any) =>
      it.namaRuas?.toLowerCase().includes(q) ||
      it.noRuas?.toLowerCase().includes(q) ||
      it.pangkalRuas?.toLowerCase().includes(q) ||
      it.ujungRuas?.toLowerCase().includes(q)
    );
  }, [list, search]);

  return (
    <div className="grid xl:grid-cols-12 gap-6 items-start w-full min-w-0">
      {/* FORM INPUT / EDIT */}
      <Card className="xl:col-span-5 rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden w-full min-w-0">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
                Form Ruas Jalan Kabupaten
              </span>
              <h3 className="text-base font-black text-slate-900 uppercase mt-1">
                {editingId ? 'Edit Ruas Jalan Kabupaten' : 'Tambah Ruas Jalan Kabupaten'}
              </h3>
            </div>
            {editingId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setEditingId(null); setForm(initialForm); }}
                className="h-8 text-xs text-rose-600 gap-1 border border-rose-200/60"
              >
                <X className="h-3.5 w-3.5" /> Batal
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">NO RUAS</Label>
                <Input
                  value={form.noRuas}
                  onChange={(e) => setForm({ ...form, noRuas: e.target.value })}
                  placeholder="e.g. 045"
                  className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-bold"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">LEBAR RUAS (Meter)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.lebarRuas || ''}
                  onChange={(e) => setForm({ ...form, lebarRuas: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 5.0"
                  className="mt-1 rounded-xl h-10 text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">NAMA RUAS JALAN</Label>
              <Input
                value={form.namaRuas}
                onChange={(e) => setForm({ ...form, namaRuas: e.target.value })}
                placeholder="Contoh: Jl. Raya Sampeldes - Gandrungmanis"
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">PANGKAL RUAS</Label>
                <Input
                  value={form.pangkalRuas}
                  onChange={(e) => setForm({ ...form, pangkalRuas: e.target.value })}
                  placeholder="Titik Awal (Batas Barat/Utara)"
                  className="mt-1 rounded-xl h-10 text-xs sm:text-sm"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">UJUNG RUAS</Label>
                <Input
                  value={form.ujungRuas}
                  onChange={(e) => setForm({ ...form, ujungRuas: e.target.value })}
                  placeholder="Titik Akhir (Batas Desa)"
                  className="mt-1 rounded-xl h-10 text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">PANJANG RUAS TOTAL (Meter)</Label>
              <Input
                type="number"
                value={form.panjangRuas || ''}
                onChange={(e) => setForm({ ...form, panjangRuas: parseFloat(e.target.value) || 0 })}
                placeholder="Panjang dalam satuan Meter (e.g. 3500)"
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-bold font-mono"
                required
              />
            </div>

            {/* KONDISI FISIK (METER) */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                Rincian Kondisi Jalan (Satuan Meter):
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-[11px] font-bold text-emerald-800">KONDISI BAIK (M)</Label>
                  <Input
                    type="number"
                    value={form.kondisiBaik || ''}
                    onChange={(e) => setForm({ ...form, kondisiBaik: parseFloat(e.target.value) || 0 })}
                    placeholder="Meter"
                    className="mt-1 rounded-xl h-9 text-xs font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-amber-800">KONDISI SEDANG (M)</Label>
                  <Input
                    type="number"
                    value={form.kondisiSedang || ''}
                    onChange={(e) => setForm({ ...form, kondisiSedang: parseFloat(e.target.value) || 0 })}
                    placeholder="Meter"
                    className="mt-1 rounded-xl h-9 text-xs font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-orange-800">RUSAK RINGAN (M)</Label>
                  <Input
                    type="number"
                    value={form.kondisiRusakRingan || ''}
                    onChange={(e) => setForm({ ...form, kondisiRusakRingan: parseFloat(e.target.value) || 0 })}
                    placeholder="Meter"
                    className="mt-1 rounded-xl h-9 text-xs font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-rose-800">RUSAK BERAT (M)</Label>
                  <Input
                    type="number"
                    value={form.kondisiRusakBerat || ''}
                    onChange={(e) => setForm({ ...form, kondisiRusakBerat: parseFloat(e.target.value) || 0 })}
                    placeholder="Meter"
                    className="mt-1 rounded-xl h-9 text-xs font-mono font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* DOKUMENTASI MEDIA (FOTO & YOUTUBE) */}
            <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-600/20 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-emerald-700" />
                Dokumentasi Media Ruas Jalan (Opsional)
              </span>

              <div>
                <Label className="text-[11px] font-bold text-slate-700">Upload Foto atau Link Foto (URL)</Label>
                <Input
                  value={form.fotoUrl}
                  onChange={(e) => setForm({ ...form, fotoUrl: e.target.value })}
                  placeholder="https://.../foto-jalan.jpg"
                  className="mt-1 rounded-xl h-9 text-xs bg-white"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold text-slate-700">Link Video YouTube Ruas Jalan</Label>
                <Input
                  value={form.youtubeUrl}
                  onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=... atau youtu.be/..."
                  className="mt-1 rounded-xl h-9 text-xs bg-white"
                />
                {getYouTubeThumbnail(form.youtubeUrl) && (
                  <div className="mt-2 p-2 bg-rose-50/80 rounded-xl border border-rose-200 flex items-center gap-2.5">
                    <img
                      src={getYouTubeThumbnail(form.youtubeUrl)!}
                      alt="Preview Cuplikan"
                      className="w-16 h-10 object-cover rounded-md border border-rose-200 shrink-0"
                    />
                    <div className="text-[10.5px] min-w-0">
                      <span className="font-bold text-rose-700 flex items-center gap-1">
                        <PlayCircle className="w-3.5 h-3.5" /> Cuplikan YouTube Aktif
                      </span>
                      <span className="text-slate-500 block truncate">Cuplikan ini otomatis tampil pada kartu Profil Desa.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Keterangan Tambahan (Opsional)</Label>
              <Input
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                placeholder="e.g. Ruas utama jalur perekonomian warga"
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm"
              />
            </div>

            <Button type="submit" className="w-full rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white h-11 text-xs gap-2">
              <Save className="h-4 w-4" />
              {editingId ? 'Simpan Perubahan Ruas' : 'Tambahkan Ruas Jalan Kabupaten'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* DAFTAR RUAS JALAN KABUPATEN */}
      <div className="xl:col-span-7 space-y-4 w-full min-w-0">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">
                Daftar Ruas Jalan Kabupaten ({filteredList.length})
              </h3>
              <p className="text-xs text-slate-500">
                Inventarisasi kondisi jaringan jalan kabupaten di wilayah Desa Sampeldes
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama ruas, nomor ruas, atau pangkal/ujung..."
              className="pl-9 h-9 text-xs rounded-xl border-slate-300"
            />
          </div>
        </div>

        {/* Tabel / Card Ruas */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <Card className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
            <CardContent className="p-8 text-center space-y-2">
              <Milestone className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-slate-700 font-bold text-sm">Belum ada data ruas jalan kabupaten</p>
              <p className="text-slate-500 text-xs">Silakan input data ruas jalan kabupaten melalui formulir di sebelah kiri.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredList.map((item: JalanKabupatenItem) => {
              const mantap = (Number(item.kondisiBaik) || 0) + (Number(item.kondisiSedang) || 0);
              const mantapPct = item.panjangRuas > 0 ? ((mantap / item.panjangRuas) * 100).toFixed(1) : '0';

              return (
                <Card key={item.id} className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden hover:border-emerald-300 transition-all">
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md font-mono">
                            NO RUAS: {item.noRuas}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md font-mono">
                            {formatNumber(item.panjangRuas)} M ({((item.panjangRuas || 0) / 1000).toFixed(2)} KM)
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md">
                            Lebar: {item.lebarRuas} M
                          </span>
                        </div>
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug break-words">{item.namaRuas}</h4>
                        <p className="text-xs text-slate-600 break-words leading-relaxed">
                          Pangkal: <span className="font-semibold text-slate-800">{item.pangkalRuas}</span> &bull; Ujung: <span className="font-semibold text-slate-800">{item.ujungRuas}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-8 px-2.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg gap-1 border border-slate-200/60"
                        >
                          <Edit className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id, item.namaRuas)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200/60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Breakdown Kondisi Meter */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center text-[10.5px]">
                      <div className="bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100">
                        <span className="block text-[9px] font-bold text-emerald-700">BAIK</span>
                        <span className="font-bold text-emerald-950 font-mono">{formatNumber(item.kondisiBaik)} M</span>
                      </div>
                      <div className="bg-amber-50/70 p-1.5 rounded-lg border border-amber-100">
                        <span className="block text-[9px] font-bold text-amber-700">SEDANG</span>
                        <span className="font-bold text-amber-950 font-mono">{formatNumber(item.kondisiSedang)} M</span>
                      </div>
                      <div className="bg-orange-50/70 p-1.5 rounded-lg border border-orange-100">
                        <span className="block text-[9px] font-bold text-orange-700">R. RINGAN</span>
                        <span className="font-bold text-orange-950 font-mono">{formatNumber(item.kondisiRusakRingan)} M</span>
                      </div>
                      <div className="bg-rose-50/70 p-1.5 rounded-lg border border-rose-100">
                        <span className="block text-[9px] font-bold text-rose-700">R. BERAT</span>
                        <span className="font-bold text-rose-950 font-mono">{formatNumber(item.kondisiRusakBerat)} M</span>
                      </div>
                    </div>

                    {/* Status Foto / Video jika ada */}
                    {(() => {
                      const video = item.youtubeUrl || (item as any).videoUrl;
                      const ytThumb = getYouTubeThumbnail(video);
                      const displayImg = item.fotoUrl || ytThumb;
                      if (!displayImg && !video) return null;

                      return (
                        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          {displayImg && (
                            <img
                              src={displayImg}
                              alt="Thumbnail Ruas"
                              className="w-14 h-9 object-cover rounded-md border border-slate-200 shrink-0"
                            />
                          )}
                          <div className="flex items-center gap-3 flex-wrap">
                            {item.fotoUrl && (
                              <a href={item.fotoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-700 hover:underline">
                                <ImageIcon className="h-3 w-3" /> Ada Foto Dokumentasi
                              </a>
                            )}
                            {video && (
                              <a href={video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-rose-600 hover:underline">
                                <PlayCircle className="h-3 w-3" /> {ytThumb ? 'Ada Video YouTube (Cuplikan Aktif)' : 'Ada Video YouTube'}
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. SUB-KOMPONEN: JALAN DESA MANAGER (13 KOLOM DENGAN FOTO & VIDEO)
// ─────────────────────────────────────────────────────────────────────────────
function AdminJalanDesaManager({ list, isLoading, firestore }: any) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initialForm = {
    no: (list?.length || 0) + 1,
    desa: 'Sampeldes',
    noUrut: '',
    namaJalan: '',
    panjang: 0,
    lebar: 0,
    pangkal: '',
    ujung: '',
    jenisPerkerasan: 'Rabat Beton',
    kondisiBaik: 0,
    kondisiSedang: 0,
    kondisiRusakRingan: 0,
    kondisiRusakBerat: 0,
    fotoUrl: '',
    youtubeUrl: '',
    keterangan: '',
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!editingId && list) {
      setForm(prev => ({ ...prev, no: list.length + 1 }));
    }
  }, [list, editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    if (!form.namaJalan.trim()) {
      toast({ title: 'Gagal', description: 'Nama Jalan wajib diisi', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        no: Number(form.no) || 1,
        desa: form.desa.trim() || 'Sampeldes',
        noUrut: form.noUrut.trim(),
        namaJalan: form.namaJalan.trim(),
        panjang: Number(form.panjang) || 0,
        lebar: Number(form.lebar) || 0,
        pangkal: form.pangkal.trim(),
        ujung: form.ujung.trim(),
        jenisPerkerasan: form.jenisPerkerasan.trim(),
        kondisiBaik: Number(form.kondisiBaik) || 0,
        kondisiSedang: Number(form.kondisiSedang) || 0,
        kondisiRusakRingan: Number(form.kondisiRusakRingan) || 0,
        kondisiRusakBerat: Number(form.kondisiRusakBerat) || 0,
        fotoUrl: form.fotoUrl.trim(),
        youtubeUrl: form.youtubeUrl.trim(),
        keterangan: form.keterangan.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(firestore, 'jalanDesa', editingId), payload);
        toast({ title: 'Berhasil!', description: `Jalan ${form.namaJalan} berhasil diperbarui.` });
        setEditingId(null);
      } else {
        await addDoc(collection(firestore, 'jalanDesa'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Berhasil!', description: `Jalan ${form.namaJalan} berhasil ditambahkan.` });
      }

      setForm(initialForm);
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    }
  };

  const handleEdit = (item: JalanDesaItem) => {
    setEditingId(item.id);
    setForm({
      no: item.no || 1,
      desa: item.desa || 'Sampeldes',
      noUrut: item.noUrut || '',
      namaJalan: item.namaJalan || '',
      panjang: item.panjang || 0,
      lebar: item.lebar || 0,
      pangkal: item.pangkal || '',
      ujung: item.ujung || '',
      jenisPerkerasan: item.jenisPerkerasan || 'Rabat Beton',
      kondisiBaik: item.kondisiBaik || 0,
      kondisiSedang: item.kondisiSedang || 0,
      kondisiRusakRingan: item.kondisiRusakRingan || 0,
      kondisiRusakBerat: item.kondisiRusakBerat || 0,
      fotoUrl: item.fotoUrl || '',
      youtubeUrl: item.youtubeUrl || (item as any).videoUrl || '',
      keterangan: item.keterangan || '',
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!firestore) return;
    if (!confirm(`Hapus data jalan desa "${nama}"?`)) return;
    try {
      await deleteDoc(doc(firestore, 'jalanDesa', id));
      toast({ title: 'Terhapus', description: `Jalan ${nama} berhasil dihapus.` });
    } catch (err: any) {
      toast({ title: 'Gagal Menghapus', description: err.message, variant: 'destructive' });
    }
  };

  // Unduh Template Format Excel
  const handleDownloadFormatExcel = () => {
    try {
      const templateRows = [
        {
          'NO': 1,
          'DESA': 'Sampeldes',
          'NO URUT': 'JD-01',
          'NAMA JALAN': 'Jl. Kedungprahu RT 02/RW 01',
          'PANJANG (M)': 500,
          'LEBAR (M)': 3.0,
          'PANGKAL': 'Rumah Bpk. Slamet',
          'UJUNG': 'Jembatan Kali Ireng',
          'JENIS PERKERASAN': 'Rabat Beton',
          'BAIK (M)': 450,
          'SEDANG (M)': 50,
          'RUSAK RINGAN (M)': 0,
          'RUSAK BERAT (M)': 0,
          'FOTO URL': 'https://example.com/foto-jalan-desa.jpg',
          'YOUTUBE URL': 'https://youtube.com/watch?v=sample',
          'KETERANGAN': 'Pembangunan TA 2024'
        },
        {
          'NO': 2,
          'DESA': 'Sampeldes',
          'NO URUT': 'JD-02',
          'NAMA JALAN': 'Jl. Lingkar Pesantren RT 01/RW 03',
          'PANJANG (M)': 750,
          'LEBAR (M)': 3.5,
          'PANGKAL': 'Pertigaan Mushola Al-Ikhlas',
          'UJUNG': 'Batas Sawah Timur',
          'JENIS PERKERASAN': 'Aspal Hotmix',
          'BAIK (M)': 600,
          'SEDANG (M)': 150,
          'RUSAK RINGAN (M)': 0,
          'RUSAK BERAT (M)': 0,
          'FOTO URL': '',
          'YOUTUBE URL': '',
          'KETERANGAN': 'Rencana pelapisan ulang'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateRows);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 12 },
        { wch: 12 },
        { wch: 35 },
        { wch: 14 },
        { wch: 12 },
        { wch: 28 },
        { wch: 28 },
        { wch: 18 },
        { wch: 12 },
        { wch: 12 },
        { wch: 18 },
        { wch: 18 },
        { wch: 32 },
        { wch: 32 },
        { wch: 30 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'JALAN_DESA');
      XLSX.writeFile(wb, 'Format_Inventaris_Jalan_Desa_Sampeldes.xlsx');

      toast({
        title: 'Format Excel Terunduh',
        description: 'Template format inventaris jalan desa siap diisi dan diimpor.',
      });
    } catch (err: any) {
      toast({
        title: 'Gagal Mengunduh Format',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Impor Data dari File Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firestore) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      const ws = wb.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (!rawRows || rawRows.length === 0) {
        throw new Error('File Excel kosong atau tidak memiliki data.');
      }

      const findVal = (row: any, ...keys: string[]) => {
        const rowKeys = Object.keys(row);
        for (const k of keys) {
          const match = rowKeys.find(rk => rk.trim().toLowerCase() === k.trim().toLowerCase());
          if (match && row[match] !== undefined && row[match] !== '') return row[match];
        }
        for (const k of keys) {
          const match = rowKeys.find(rk => rk.trim().toLowerCase().includes(k.trim().toLowerCase()));
          if (match && row[match] !== undefined && row[match] !== '') return row[match];
        }
        return '';
      };

      const parseNum = (val: any) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const cleaned = String(val).replace(/[^0-9.,-]/g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };

      const parsedItems: any[] = [];

      rawRows.forEach((row, idx) => {
        const namaJalan = String(findVal(row, 'NAMA JALAN', 'nama jalan', 'nama_jalan', 'nama')).trim();
        if (!namaJalan) return;

        const no = parseInt(String(findVal(row, 'NO', 'no', 'nomor'))) || (idx + 1);
        const desa = String(findVal(row, 'DESA', 'desa') || 'Sampeldes').trim();
        const noUrut = String(findVal(row, 'NO URUT', 'no urut', 'no_urut', 'kode') || `JD-${String(idx + 1).padStart(2, '0')}`).trim();
        const panjang = parseNum(findVal(row, 'PANJANG (M)', 'panjang (meter)', 'panjang', 'panjang_m'));
        const lebar = parseNum(findVal(row, 'LEBAR (M)', 'lebar (meter)', 'lebar', 'lebar_m'));
        const pangkal = String(findVal(row, 'PANGKAL', 'titik awal', 'pangkal ruas') || '-').trim();
        const ujung = String(findVal(row, 'UJUNG', 'titik akhir', 'ujung ruas') || '-').trim();
        const jenisPerkerasan = String(findVal(row, 'JENIS PERKERASAN', 'perkerasan', 'jenis') || 'Rabat Beton').trim();
        const kondisiBaik = parseNum(findVal(row, 'BAIK (M)', 'baik (meter)', 'baik', 'kondisi baik'));
        const kondisiSedang = parseNum(findVal(row, 'SEDANG (M)', 'sedang (meter)', 'sedang', 'kondisi sedang'));
        const kondisiRusakRingan = parseNum(findVal(row, 'RUSAK RINGAN (M)', 'rusak ringan', 'r. ringan', 'kondisi rusak ringan'));
        const kondisiRusakBerat = parseNum(findVal(row, 'RUSAK BERAT (M)', 'rusak berat', 'r. berat', 'kondisi rusak berat'));
        const fotoUrl = String(findVal(row, 'FOTO URL', 'foto url', 'foto', 'link foto') || '').trim();
        const youtubeUrl = String(findVal(row, 'YOUTUBE URL', 'youtube url', 'youtube', 'video url', 'video') || '').trim();
        const keterangan = String(findVal(row, 'KETERANGAN', 'keterangan', 'catatan') || '').trim();

        parsedItems.push({
          no,
          desa,
          noUrut,
          namaJalan,
          panjang,
          lebar,
          pangkal,
          ujung,
          jenisPerkerasan,
          kondisiBaik,
          kondisiSedang,
          kondisiRusakRingan,
          kondisiRusakBerat,
          fotoUrl,
          youtubeUrl,
          keterangan,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      if (parsedItems.length === 0) {
        throw new Error('Tidak ditemukan data baris jalan desa yang valid (kolom NAMA JALAN wajib terisi).');
      }

      const chunkSize = 400;
      for (let i = 0; i < parsedItems.length; i += chunkSize) {
        const chunk = parsedItems.slice(i, i + chunkSize);
        const batch = writeBatch(firestore);
        chunk.forEach(item => {
          const newDocRef = doc(collection(firestore, 'jalanDesa'));
          batch.set(newDocRef, item);
        });
        await batch.commit();
      }

      toast({
        title: 'Impor Berhasil!',
        description: `Sebanyak ${parsedItems.length} data inventaris jalan desa berhasil ditambahkan ke database.`,
      });
    } catch (err: any) {
      toast({
        title: 'Gagal Impor Excel',
        description: err.message || 'Terjadi kesalahan saat membaca file Excel.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredList = useMemo(() => {
    if (!list) return [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((it: any) =>
      it.namaJalan?.toLowerCase().includes(q) ||
      it.noUrut?.toLowerCase().includes(q) ||
      it.pangkal?.toLowerCase().includes(q) ||
      it.ujung?.toLowerCase().includes(q) ||
      it.jenisPerkerasan?.toLowerCase().includes(q)
    );
  }, [list, search]);

  return (
    <div className="grid xl:grid-cols-12 gap-6 items-start w-full min-w-0">
      {/* FORM INPUT / EDIT JALAN DESA */}
      <Card className="xl:col-span-5 rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden w-full min-w-0">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
                Form Inventaris Jalan Desa
              </span>
              <h3 className="text-base font-black text-slate-900 uppercase mt-1">
                {editingId ? 'Edit Data Jalan Desa' : 'Tambah Data Jalan Desa'}
              </h3>
            </div>
            {editingId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setEditingId(null); setForm(initialForm); }}
                className="h-8 text-xs text-rose-600 gap-1"
              >
                <X className="h-3.5 w-3.5" /> Batal
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <Label className="text-xs font-bold text-slate-700">NO</Label>
                <Input
                  type="number"
                  value={form.no}
                  onChange={(e) => setForm({ ...form, no: parseInt(e.target.value) || 1 })}
                  className="mt-1 rounded-xl h-10 text-xs font-bold font-mono"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">DESA</Label>
                <Input
                  value={form.desa}
                  onChange={(e) => setForm({ ...form, desa: e.target.value })}
                  placeholder="Sampeldes"
                  className="mt-1 rounded-xl h-10 text-xs font-bold"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">NO URUT</Label>
                <Input
                  value={form.noUrut}
                  onChange={(e) => setForm({ ...form, noUrut: e.target.value })}
                  placeholder="e.g. JD-01"
                  className="mt-1 rounded-xl h-10 text-xs font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">NAMA JALAN</Label>
              <Input
                value={form.namaJalan}
                onChange={(e) => setForm({ ...form, namaJalan: e.target.value })}
                placeholder="Contoh: Jl. Kedungprahu RT 02/RW 01"
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <Label className="text-xs font-bold text-slate-700">PANJANG (M)</Label>
                <Input
                  type="number"
                  value={form.panjang || ''}
                  onChange={(e) => setForm({ ...form, panjang: parseFloat(e.target.value) || 0 })}
                  placeholder="Meter"
                  className="mt-1 rounded-xl h-10 text-xs font-bold font-mono"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">LEBAR (M)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.lebar || ''}
                  onChange={(e) => setForm({ ...form, lebar: parseFloat(e.target.value) || 0 })}
                  placeholder="Meter"
                  className="mt-1 rounded-xl h-10 text-xs font-bold"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">PERKERASAN</Label>
                <Select value={form.jenisPerkerasan} onValueChange={(v) => setForm({ ...form, jenisPerkerasan: v })}>
                  <SelectTrigger className="mt-1 rounded-xl h-10 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rabat Beton">Rabat Beton</SelectItem>
                    <SelectItem value="Aspal Hotmix">Aspal Hotmix</SelectItem>
                    <SelectItem value="Aspal Lapen">Aspal Lapen</SelectItem>
                    <SelectItem value="Telford / Makadam">Telford / Makadam</SelectItem>
                    <SelectItem value="Paving Block">Paving Block</SelectItem>
                    <SelectItem value="Tanah">Tanah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">PANGKAL (Titik Awal)</Label>
                <Input
                  value={form.pangkal}
                  onChange={(e) => setForm({ ...form, pangkal: e.target.value })}
                  placeholder="e.g. Rumah Bpk. Slamet"
                  className="mt-1 rounded-xl h-10 text-xs"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">UJUNG (Titik Akhir)</Label>
                <Input
                  value={form.ujung}
                  onChange={(e) => setForm({ ...form, ujung: e.target.value })}
                  placeholder="e.g. Jembatan Kali Ireng"
                  className="mt-1 rounded-xl h-10 text-xs"
                  required
                />
              </div>
            </div>

            {/* KONDISI FISIK JALAN DESA (METER) */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                Rincian Kondisi Perkerasan (Meter):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <Label className="text-[11px] font-bold text-emerald-800">BAIK (M)</Label>
                  <Input
                    type="number"
                    value={form.kondisiBaik || ''}
                    onChange={(e) => setForm({ ...form, kondisiBaik: parseFloat(e.target.value) || 0 })}
                    placeholder="Meter"
                    className="mt-1 rounded-xl h-9 text-xs font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-amber-800">SEDANG (M)</Label>
                  <Input
                    type="number"
                    value={form.kondisiSedang || ''}
                    onChange={(e) => setForm({ ...form, kondisiSedang: parseFloat(e.target.value) || 0 })}
                    placeholder="Meter"
                    className="mt-1 rounded-xl h-9 text-xs font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-orange-800">R. RINGAN (M)</Label>
                  <Input
                    type="number"
                    value={form.kondisiRusakRingan || ''}
                    onChange={(e) => setForm({ ...form, kondisiRusakRingan: parseFloat(e.target.value) || 0 })}
                    placeholder="Meter"
                    className="mt-1 rounded-xl h-9 text-xs font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-rose-800">R. BERAT (M)</Label>
                  <Input
                    type="number"
                    value={form.kondisiRusakBerat || ''}
                    onChange={(e) => setForm({ ...form, kondisiRusakBerat: parseFloat(e.target.value) || 0 })}
                    placeholder="Meter"
                    className="mt-1 rounded-xl h-9 text-xs font-mono font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* DOKUMENTASI MEDIA (FOTO & YOUTUBE) */}
            <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-600/20 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-emerald-700" />
                Dokumentasi Media Jalan Desa (Opsional)
              </span>

              <div>
                <Label className="text-[11px] font-bold text-slate-700">Upload Foto atau Link Foto (URL)</Label>
                <Input
                  value={form.fotoUrl}
                  onChange={(e) => setForm({ ...form, fotoUrl: e.target.value })}
                  placeholder="https://.../foto-jalan-desa.jpg"
                  className="mt-1 rounded-xl h-9 text-xs bg-white"
                />
              </div>

              <div>
                <Label className="text-[11px] font-bold text-slate-700">Link Video YouTube Jalan Desa</Label>
                <Input
                  value={form.youtubeUrl}
                  onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=... atau youtu.be/..."
                  className="mt-1 rounded-xl h-9 text-xs bg-white"
                />
                {getYouTubeThumbnail(form.youtubeUrl) && (
                  <div className="mt-2 p-2 bg-rose-50/80 rounded-xl border border-rose-200 flex items-center gap-2.5">
                    <img
                      src={getYouTubeThumbnail(form.youtubeUrl)!}
                      alt="Preview Cuplikan"
                      className="w-16 h-10 object-cover rounded-md border border-rose-200 shrink-0"
                    />
                    <div className="text-[10.5px] min-w-0">
                      <span className="font-bold text-rose-700 flex items-center gap-1">
                        <PlayCircle className="w-3.5 h-3.5" /> Cuplikan YouTube Aktif
                      </span>
                      <span className="text-slate-500 block truncate">Cuplikan ini otomatis tampil pada kartu Profil Desa.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Keterangan Tambahan (Opsional)</Label>
              <Input
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                placeholder="Catatan jalan, rencana pengaspalan, dll."
                className="mt-1 rounded-xl h-10 text-xs sm:text-sm"
              />
            </div>

            <Button type="submit" className="w-full rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white h-11 text-xs gap-2 shadow-sm">
              <Save className="h-4 w-4" />
              {editingId ? 'Simpan Perubahan Jalan Desa' : 'Tambahkan Jalan Desa'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* DAFTAR JALAN DESA */}
      <div className="xl:col-span-7 space-y-4 w-full min-w-0">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">
                Daftar Inventaris Jalan Desa ({filteredList.length})
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan lengkap 13 kolom jalan desa dan status fisiknya
              </p>
            </div>

            {/* Tombol Format Excel & Impor Excel */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadFormatExcel}
                className="h-9 px-3 text-xs font-bold rounded-xl border-slate-300 hover:bg-slate-50 text-slate-700 gap-1.5 shadow-sm"
              >
                <FileDown className="h-4 w-4 text-emerald-600" />
                <span>Format Excel</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="h-9 px-3.5 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 shadow-sm"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mengimpor...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Impor Excel</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama jalan, no urut, perkerasan, atau lokasi..."
              className="pl-9 h-9 text-xs rounded-xl border-slate-300"
            />
          </div>
        </div>

        {/* Tabel / Card Ruas */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <Card className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
            <CardContent className="p-8 text-center space-y-2">
              <MapPin className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-slate-700 font-bold text-sm">Belum ada data jalan desa</p>
              <p className="text-slate-500 text-xs">Silakan input data inventaris jalan desa melalui formulir di sebelah kiri.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredList.map((item: JalanDesaItem) => (
              <Card key={item.id} className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden hover:border-emerald-300 transition-all">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black bg-slate-800 text-white px-2 py-0.5 rounded font-mono">
                          #{item.no}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">
                          {item.noUrut || 'JD'}
                        </span>
                        <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded">
                          {item.jenisPerkerasan}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded font-mono">
                          {formatNumber(item.panjang)} M x {item.lebar} M
                        </span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug break-words">{item.namaJalan}</h4>
                      <p className="text-xs text-slate-500 break-words leading-relaxed">
                        {item.pangkal} &rarr; {item.ujung} &bull; Desa {item.desa || 'Sampeldes'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="h-8 px-2.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg gap-1"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id, item.namaJalan)}
                        className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Breakdown Kondisi Meter */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center text-[10.5px]">
                    <div className="bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100">
                      <span className="block text-[9px] font-bold text-emerald-700">BAIK</span>
                      <span className="font-bold text-emerald-950 font-mono">{formatNumber(item.kondisiBaik)} M</span>
                    </div>
                    <div className="bg-amber-50/70 p-1.5 rounded-lg border border-amber-100">
                      <span className="block text-[9px] font-bold text-amber-700">SEDANG</span>
                      <span className="font-bold text-amber-950 font-mono">{formatNumber(item.kondisiSedang)} M</span>
                    </div>
                    <div className="bg-orange-50/70 p-1.5 rounded-lg border border-orange-100">
                      <span className="block text-[9px] font-bold text-orange-700">R. RINGAN</span>
                      <span className="font-bold text-orange-950 font-mono">{formatNumber(item.kondisiRusakRingan)} M</span>
                    </div>
                    <div className="bg-rose-50/70 p-1.5 rounded-lg border border-rose-100">
                      <span className="block text-[9px] font-bold text-rose-700">R. BERAT</span>
                      <span className="font-bold text-rose-950 font-mono">{formatNumber(item.kondisiRusakBerat)} M</span>
                    </div>
                  </div>

                  {/* Status Foto / Video jika ada */}
                  {(() => {
                    const video = item.youtubeUrl || (item as any).videoUrl;
                    const ytThumb = getYouTubeThumbnail(video);
                    const displayImg = item.fotoUrl || ytThumb;
                    if (!displayImg && !video) return null;

                    return (
                      <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex-wrap">
                        {displayImg && (
                          <img
                            src={displayImg}
                            alt="Thumbnail Jalan"
                            className="w-14 h-9 object-cover rounded-md border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="flex items-center gap-3 flex-wrap min-w-0">
                          {item.fotoUrl && (
                            <a href={item.fotoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-700 hover:underline truncate">
                              <ImageIcon className="h-3 w-3" /> Ada Foto Dokumentasi
                            </a>
                          )}
                          {video && (
                            <a href={video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-rose-600 hover:underline truncate">
                              <PlayCircle className="h-3 w-3" /> {ytThumb ? 'Ada Video YouTube (Cuplikan Aktif)' : 'Ada Video YouTube'}
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. SUB-KOMPONEN: MEDIA & VIDEO EDITOR
// ─────────────────────────────────────────────────────────────────────────────
function AdminMediaEditor({ currentData, firestore }: any) {
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('Video Profil Resmi Desa Sampeldes');
  const [videoDescription, setVideoDescription] = useState('Dokumentasi potensi alam, dinamika perdesaan, dan transformasi tata kelola Desa Sampeldes.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentData) {
      setVideoUrl(currentData.youtubeVideoUrl || '');
      if (currentData.videoTitle !== undefined) setVideoTitle(currentData.videoTitle);
      if (currentData.videoDescription !== undefined) setVideoDescription(currentData.videoDescription);
    }
  }, [currentData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      await saveProfileWithHistory({
        firestore,
        tab: 'galeri',
        action: 'Update Video Profil Desa',
        summary: `Memperbarui video profil YouTube: ${videoTitle || videoUrl}`,
        partialData: {
          youtubeVideoUrl: videoUrl.trim(),
          videoTitle: videoTitle.trim(),
          videoDescription: videoDescription.trim(),
        }
      });
      toast({ title: 'Berhasil Disimpan & Dicatat ke Histori!', description: 'Link video dan deskripsi profil YouTube desa telah diperbarui.' });
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ytThumb = getYouTubeThumbnail(videoUrl);

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardContent className="p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
              <Video className="h-5 w-5 text-rose-600" />
              Video Profil Desa Sampeldes
            </h3>
            <p className="text-xs text-slate-500">Tautkan video YouTube profil resmi desa yang akan diputar di halaman Profil Desa (Tab Galeri Media).</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <PlayCircle className="h-3.5 w-3.5" /> Video Profil Publik
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">Link Video YouTube</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                  className="mt-1 rounded-xl h-10 text-xs sm:text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Format yang didukung: URL watch biasa, tautan pendek youtu.be, atau URL embed.
                </span>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Judul Video Profil</Label>
                <Input
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Contoh: Video Profil Resmi Desa Sampeldes"
                  className="mt-1 rounded-xl h-10 text-xs sm:text-sm font-semibold"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Deskripsi / Ringkasan Video</Label>
                <Textarea
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Jelaskan isi cuplikan video profil..."
                  rows={3}
                  className="mt-1 rounded-xl text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Preview Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-2 block">Pratinjau Video</Label>
                {videoUrl ? (
                  <div className="space-y-3">
                    {ytThumb ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-black group">
                        <img src={ytThumb} alt="Preview" className="w-full h-full object-cover opacity-90" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <PlayCircle className="h-12 w-12 text-white drop-shadow-lg" />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                        Format link video terdeteksi non-standar, namun tetap dapat disimpan.
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{videoTitle || 'Tanpa Judul'}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{videoDescription || 'Tanpa deskripsi'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <Video className="h-10 w-10 mb-2 opacity-50" />
                    <span className="text-xs font-bold">Belum Ada Video Ditautkan</span>
                    <span className="text-[10px]">Masukkan tautan YouTube di kolom sebelah kiri</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-2 h-10 px-6 shadow-sm"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Link Video & Catat Histori
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AdminProfilDesaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#ECE8E1] dark:bg-[#070b10]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-800 dark:text-[#d4e157] mb-4" />
            <p className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">
              Memuat Admin Profil Desa...
            </p>
          </div>
        </div>
      }
    >
      <AdminProfilDesaView />
    </Suspense>
  );
}
