import React from 'react';
import {
  Activity,
  Baby,
  BarChart,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Flower2,
  HandHelping,
  Heart,
  Home,
  Info,
  LayoutGrid,
  LibraryBig,
  ScrollText,
  ShieldCheck,
  Skull,
  Star,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react';

/**
 * Konten halaman /pelayanan-desa yang dapat diubah dari /admin/pelayanan.
 * Disimpan pada Firestore: settings/pelayananDesa
 */

export const PELAYANAN_CONTENT_DOC = { collection: 'settings', id: 'pelayananDesa' } as const;

export type PelayananTabId =
  | 'visi-misi'
  | 'maklumat'
  | 'standar'
  | 'jenis'
  | 'sop'
  | 'ikm'
  | 'survey'
  | 'pojok-baca'
  | 'agenda-desa';

export interface TabSetting {
  label: string;
  description: string;
  visible: boolean;
}

export interface StandarItem {
  title: string;
  time: string;
  req: string;
  badge: string;
}

export interface JenisItem {
  type: string;
  desc: string;
  icon: string;
  color: string;
}

export interface SopStep {
  label: string;
  desc: string;
  icon: string;
}

export interface IkmStat {
  value: string;
  label: string;
}

export interface PelayananContent {
  tabs: Record<PelayananTabId, TabSetting>;
  general: {
    badgeText: string;
    sidebarTitle: string;
    helpEyebrow: string;
    helpTitle: string;
    helpDescription: string;
    helpButtonText: string;
    helpButtonLink: string;
    attachmentTitlePrefix: string;
    attachmentDescription: string;
    attachmentEmptyText: string;
  };
  visiMisi: {
    visiTitle: string;
    visiText: string;
    motoTitle: string;
    motoText: string;
    motoSubtext: string;
    misiTitle: string;
    misiItems: string[];
  };
  maklumat: {
    title: string;
    paragraph1: string;
    paragraph2: string;
    signatory: string;
    location: string;
  };
  standar: {
    noticeTitle: string;
    noticeText: string;
    durationLabel: string;
    requirementLabel: string;
    items: StandarItem[];
  };
  jenis: {
    headerTitle: string;
    headerDescription: string;
    buttonText: string;
    buttonLink: string;
    feeLabel: string;
    applyLabel: string;
    items: JenisItem[];
  };
  sop: {
    title: string;
    description: string;
    steps: SopStep[];
  };
  ikm: {
    scoreLabel: string;
    score: string;
    gradeBadge: string;
    reportTitle: string;
    reportText: string;
    stats: IkmStat[];
  };
  survey: {
    eyebrow: string;
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
  };
  pojokBaca: {
    bannerTitle: string;
    bannerDescription: string;
    bannerButtonText: string;
    bannerButtonLink: string;
    emptyText: string;
  };
}

/** Urutan & ikon tab bersifat tetap; teks dan visibilitas dapat diatur admin. */
export const PELAYANAN_TAB_META: { id: PelayananTabId; icon: LucideIcon; color: string }[] = [
  { id: 'visi-misi', icon: Star, color: 'text-teal-600 dark:text-teal-400' },
  { id: 'maklumat', icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'standar', icon: ClipboardCheck, color: 'text-blue-600 dark:text-blue-400' },
  { id: 'jenis', icon: ScrollText, color: 'text-rose-600 dark:text-rose-400' },
  { id: 'sop', icon: LayoutGrid, color: 'text-cyan-600 dark:text-cyan-400' },
  { id: 'ikm', icon: BarChart, color: 'text-teal-600 dark:text-teal-400' },
  { id: 'survey', icon: BookOpen, color: 'text-purple-600 dark:text-purple-400' },
  { id: 'pojok-baca', icon: LibraryBig, color: 'text-slate-500 dark:text-slate-400' },
  { id: 'agenda-desa', icon: Calendar, color: 'text-amber-600 dark:text-amber-400' },
];

/** Pilihan ikon yang bisa dipakai pada item Jenis Layanan & langkah SOP. */
export const PELAYANAN_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  store: { icon: Store, label: 'Toko / Usaha' },
  handHelping: { icon: HandHelping, label: 'Bantuan Sosial' },
  home: { icon: Home, label: 'Rumah / Domisili' },
  shield: { icon: ShieldCheck, label: 'Perisai / Keamanan' },
  baby: { icon: Baby, label: 'Bayi / Kelahiran' },
  skull: { icon: Skull, label: 'Kematian' },
  users: { icon: Users, label: 'Penduduk / Keluarga' },
  heart: { icon: Heart, label: 'Hati / Pernikahan' },
  flower: { icon: Flower2, label: 'Bunga / Pemakaman' },
  check: { icon: CheckCircle2, label: 'Centang / Selesai' },
  activity: { icon: Activity, label: 'Kesehatan' },
  book: { icon: BookOpen, label: 'Buku / Pengajuan' },
  file: { icon: FileText, label: 'Dokumen' },
  clipboard: { icon: ClipboardCheck, label: 'Checklist' },
  star: { icon: Star, label: 'Bintang' },
  info: { icon: Info, label: 'Informasi' },
  scroll: { icon: ScrollText, label: 'Surat' },
};

export const getPelayananIcon = (key: string): LucideIcon => PELAYANAN_ICONS[key]?.icon ?? FileText;

/** Pilihan warna ikon. */
export const PELAYANAN_COLORS: Record<string, { className: string; label: string }> = {
  lime: { className: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40', label: 'Toska Segar' },
  emerald: { className: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40', label: 'Hijau Zamrud' },
  teal: { className: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40', label: 'Toska' },
  blue: { className: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40', label: 'Biru' },
  purple: { className: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40', label: 'Ungu' },
  pink: { className: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40', label: 'Merah Muda' },
  rose: { className: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40', label: 'Merah Mawar' },
  orange: { className: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40', label: 'Oranye' },
  slate: { className: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10', label: 'Abu-abu' },
};

export const getPelayananColor = (key: string): string =>
  PELAYANAN_COLORS[key]?.className ?? PELAYANAN_COLORS.lime.className;

export const DEFAULT_PELAYANAN_CONTENT: PelayananContent = {
  tabs: {
    'visi-misi': { label: 'Visi & Misi', description: 'Visi, misi, dan komitmen mutu pelayanan.', visible: true },
    maklumat: { label: 'Maklumat', description: 'Janji penyelenggaraan pelayanan resmi.', visible: true },
    standar: { label: 'Standar Layanan', description: 'Syarat, biaya gratis, dan waktu pengurusan.', visible: true },
    jenis: { label: 'Jenis Layanan', description: 'Daftar seluruh surat administrasi warga.', visible: true },
    sop: { label: 'Alur & SOP', description: 'Tahapan standar pengurusan surat.', visible: true },
    ikm: { label: 'Laporan IKM', description: 'Hasil indeks kepuasan masyarakat.', visible: true },
    survey: { label: 'Survey Warga', description: 'Kuesioner evaluasi dan penilaian layanan.', visible: true },
    'pojok-baca': { label: 'Pojok Baca', description: 'Transparansi regulasi dan materi desa.', visible: true },
    'agenda-desa': { label: 'Agenda Desa', description: 'Jadwal kegiatan dinas & disposisi pejabat.', visible: true },
  },
  general: {
    badgeText: 'Desa Sampeldes',
    sidebarTitle: 'Kategori Pelayanan',
    helpEyebrow: 'Pusat Bantuan',
    helpTitle: 'Ada Kendala Layanan?',
    helpDescription: 'Layanan pengaduan masyarakat siap menerima kritik dan masukan secara terbuka.',
    helpButtonText: 'Lapor Aduan Warga',
    helpButtonLink: '/pengaduan/',
    attachmentTitlePrefix: 'Dokumen Lampiran',
    attachmentDescription: 'Unduh atau buka pratinjau berkas resmi di bawah ini.',
    attachmentEmptyText: 'Belum ada dokumen lampiran untuk kategori ini.',
  },
  visiMisi: {
    visiTitle: 'Visi Pelayanan',
    visiText:
      'Terwujudnya pelayanan administrasi desa yang cepat, transparan, dan akuntabel demi kepuasan dan kesejahteraan seluruh masyarakat Desa Sampeldes.',
    motoTitle: 'Moto Pelayanan',
    motoText: 'MELAYANI DENGAN PRIMA, RAMAH, DAN SEPENUH HATI',
    motoSubtext: 'Komitmen aparatur pemerintah desa dalam memberikan hak pelayanan terbaik untuk seluruh warga.',
    misiTitle: 'Komitmen Misi Pelayanan Kami',
    misiItems: [
      'Memberikan pelayanan publik yang ramah, sopan, dan non-diskriminatif.',
      'Menyelesaikan permohonan surat tepat waktu sesuai standar pelayanan.',
      'Menerapkan transparansi penuh: seluruh layanan Rp 0,- (Gratis).',
      'Memanfaatkan sistem digitalisasi untuk kecepatan dan kemudahan akses.',
      'Menyediakan ruang pelayanan dan sarana prasarana yang bersih dan nyaman.',
      'Merespon setiap kritik, masukan, dan pengaduan warga secara solutif.',
    ],
  },
  maklumat: {
    title: 'Maklumat Pelayanan Publik',
    paragraph1:
      'Dengan ini, kami segenap jajaran aparatur Pemerintah Desa Sampeldes menyatakan sanggup menyelenggarakan pelayanan administrasi publik sesuai dengan standar pelayanan yang telah ditetapkan.',
    paragraph2:
      'Dan apabila kami tidak menepati janji maklumat ini, kami siap menerima sanksi dan konsekuensi sesuai peraturan perundang-undangan yang berlaku.',
    signatory: 'Pemerintah Desa Sampeldes',
    location: 'Kecamatan Gandrungmangu, Kabupaten Cilacap',
  },
  standar: {
    noticeTitle: 'Prinsip Bebas Biaya (Gratis Rp 0,-)',
    noticeText:
      'Seluruh pengurusan dokumen administrasi surat-menyurat di Kantor Desa Sampeldes adalah **100% GRATIS tanpa dipungut biaya apapun**.',
    durationLabel: 'Durasi',
    requirementLabel: 'Persyaratan',
    items: [
      { title: 'KTP Elektronik / Pemula', time: '1 - 2 Hari Kerja', req: 'Fotokopi KK, KTP Lama (jika rusak/ganti data)', badge: 'Kependudukan' },
      { title: 'Kartu Keluarga (KK Baru / Perubahan)', time: '2 - 4 Hari Kerja', req: 'Surat Pengantar RT/RW, KK Asli Lama, Buku Nikah/Akta', badge: 'Kependudukan' },
      { title: 'Surat Keterangan Tidak Mampu (SKTM)', time: 'Langsung Jadi (15 - 30 Menit)', req: 'KTP Asli, KK, Surat Pengantar RT/RW, Bukti Pendukung', badge: 'Sosial' },
      { title: 'Surat Pengantar SKCK Polsek', time: 'Langsung Jadi (15 - 30 Menit)', req: 'KTP, KK, Surat Pengantar RT/RW, Pasfoto 4x6', badge: 'Hukum & Kamtibmas' },
      { title: 'Surat Keterangan Usaha (SKU)', time: 'Langsung Jadi (15 - 30 Menit)', req: 'KTP, KK, Keterangan jenis dan lokasi usaha', badge: 'Ekonomi UMKM' },
      { title: 'Pengantar Nikah (Model N1 - N4)', time: '1 - 2 Hari Kerja', req: 'KTP, KK, Akta Lahir, Ijazah, Surat Pengantar RT', badge: 'Pernikahan' },
    ],
  },
  jenis: {
    headerTitle: 'Daftar Seluruh Surat Pelayanan Desa',
    headerDescription: 'Pilih jenis surat yang ingin Anda ajukan secara online melalui portal layanan resmi.',
    buttonText: 'Buka Layanan Surat',
    buttonLink: '/layanan-surat/',
    feeLabel: 'Gratis Rp 0',
    applyLabel: 'Ajukan',
    items: [
      { type: 'Surat Keterangan Usaha (SKU)', icon: 'store', color: 'purple', desc: 'Identitas legalitas usaha mikro & permohonan KUR perbankan.' },
      { type: 'Surat Keterangan Tidak Mampu (SKTM)', icon: 'handHelping', color: 'orange', desc: 'Bantuan sosial, beasiswa sekolah, atau KIP Kuliah.' },
      { type: 'Surat Keterangan Domisili', icon: 'home', color: 'lime', desc: 'Bukti tempat tinggal sementara atau domisili usaha.' },
      { type: 'Surat Pengantar SKCK', icon: 'shield', color: 'emerald', desc: 'Pengantar catatan kepolisian untuk kerja atau pendaftaran.' },
      { type: 'Surat Keterangan Kelahiran', icon: 'baby', color: 'pink', desc: 'Penerbitan akta kelahiran anak dan pembaruan KK.' },
      { type: 'Surat Keterangan Kematian', icon: 'skull', color: 'slate', desc: 'Pelaporan duka cita, klaim asuransi, & akta kematian.' },
      { type: 'Surat Keterangan Pindah Penduduk', icon: 'users', color: 'blue', desc: 'Permohonan mutasi domisili antar RT/desa/kabupaten.' },
      { type: 'Surat Belum Menikah', icon: 'heart', color: 'rose', desc: 'Keterangan lajang untuk pendaftaran kerja atau KUA.' },
      { type: 'Surat Keterangan Moyang', icon: 'users', color: 'teal', desc: 'Garis silsilah keluarga dan kejelasan trah leluhur.' },
      { type: 'Surat Keterangan Pemakaman', icon: 'flower', color: 'emerald', desc: 'Pemberitahuan pemakaman di TPU resmi desa.' },
      { type: 'Surat Keterangan Wali Nikah', icon: 'check', color: 'teal', desc: 'Keterangan wali hakim atau pengganti wali nasab.' },
      { type: 'Reaktivasi BPJS Kesehatan', icon: 'activity', color: 'rose', desc: 'Rekomendasi pengaktifan kepesertaan PBI JKN nonaktif.' },
    ],
  },
  sop: {
    title: 'Alur Standar Pengurusan Dokumen',
    description: 'Empat langkah mudah dari permohonan hingga dokumen resmi selesai diterima warga.',
    steps: [
      { label: 'Pengajuan', desc: 'Warga mengajukan online lewat portal atau datang ke kantor desa membawa berkas.', icon: 'book' },
      { label: 'Verifikasi Data', desc: 'Petugas loket memverifikasi data dan kelengkapan persyaratan secara teliti.', icon: 'shield' },
      { label: 'Penandatanganan', desc: 'Dokumen dicetak dan ditandatangani oleh Kepala Desa / Sekdes secara resmi.', icon: 'file' },
      { label: 'Selesai & Pengambilan', desc: 'Surat resmi selesai diterbitkan dan siap diambil warga atau diunduh.', icon: 'check' },
    ],
  },
  ikm: {
    scoreLabel: 'Skor Indeks Kepuasan',
    score: '85.5',
    gradeBadge: 'Mutu: SANGAT BAIK (A)',
    reportTitle: 'Laporan Hasil Evaluasi Pelayanan',
    reportText:
      'Berdasarkan rekapitulasi data survei kepuasan masyarakat semester berjalan di Desa Sampeldes, masyarakat memberikan apresiasi tinggi pada kecepatan waktu pelayanan, kejelasan persyaratan, keramahan petugas loket, serta kepastian bebas pungutan liar (Rp 0,-).',
    stats: [
      { value: '100%', label: 'Gratis Rp 0,-' },
      { value: '< 30 Mnt', label: 'Layanan Cepat' },
      { value: '98.2%', label: 'Tingkat Kepuasan' },
    ],
  },
  survey: {
    eyebrow: 'Suara Anda Penting',
    title: 'Bantu Kami Terus Meningkatkan Kualitas Layanan',
    description:
      'Partisipasi Anda dalam mengisi kuesioner evaluasi kepuasan layanan sangat berharga sebagai masukan berkelanjutan untuk reformasi birokrasi Desa Sampeldes.',
    buttonText: 'Isi Survey Online',
    buttonLink: 'https://sisukma.cilacapkab.go.id/Home/pelayanan/4012002',
  },
  pojokBaca: {
    bannerTitle: 'Perpustakaan & Regulasi Digital Desa',
    bannerDescription: 'Koleksi materi publikasi, buku, peraturan desa, dan bahan bacaan literasi warga.',
    bannerButtonText: '',
    bannerButtonLink: '',
    emptyText: 'Belum ada konten Pojok Baca yang dipublikasikan.',
  },
};

/** Gabungkan data tersimpan dengan default agar field baru/terlewat tetap terisi. */
export function mergePelayananContent(stored?: Partial<PelayananContent> | null): PelayananContent {
  const d = DEFAULT_PELAYANAN_CONTENT;
  if (!stored) return d;
  const tabs = { ...d.tabs };
  (Object.keys(d.tabs) as PelayananTabId[]).forEach((id) => {
    tabs[id] = { ...d.tabs[id], ...(stored.tabs?.[id] || {}) };
  });
  return {
    tabs,
    general: { ...d.general, ...(stored.general || {}) },
    visiMisi: { ...d.visiMisi, ...(stored.visiMisi || {}) },
    maklumat: { ...d.maklumat, ...(stored.maklumat || {}) },
    standar: { ...d.standar, ...(stored.standar || {}) },
    jenis: { ...d.jenis, ...(stored.jenis || {}) },
    sop: { ...d.sop, ...(stored.sop || {}) },
    ikm: { ...d.ikm, ...(stored.ikm || {}) },
    survey: { ...d.survey, ...(stored.survey || {}) },
    pojokBaca: { ...d.pojokBaca, ...(stored.pojokBaca || {}) },
  };
}

/** Render teks sederhana: **tebal** dan baris baru. */
export function renderRichText(text: string): React.ReactNode {
  return text.split('\n').map((line, li, arr) => (
    <React.Fragment key={li}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, pi) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={pi}>{part.slice(2, -2)}</strong>
        ) : (
          <React.Fragment key={pi}>{part}</React.Fragment>
        )
      )}
      {li < arr.length - 1 && <br />}
    </React.Fragment>
  ));
}

export const isExternalLink = (href: string) => /^https?:\/\//i.test(href);
