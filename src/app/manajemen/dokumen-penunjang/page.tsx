"use client"

// Updated with Honor Kegiatan module
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Printer,
  ArrowLeft,
  Users,
  UserCheck,
  Wallet,
  Briefcase,
  Calendar,
  Loader2,
  ChevronRight,
  Database,
  Type,
  UserPlus,
  Percent,
  Coins,
  Clock,
  Banknote,
  ShieldCheck,
  Info,
  Stethoscope,
  Baby,
  Award,
  ReceiptText,
  Plus,
  Trash2,
  Store,
  ShoppingBag,
  Palette,
  Fuel,
  Check,
  Sparkles,
  FileText,
  UploadCloud,
  X,
  ImageIcon,
  FileDown,
  FileImage,
  Download
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useState, Suspense, useMemo, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { BIDANG_NAMES, type ApbItem } from "@/lib/apbdes-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { collection, doc, query, where, orderBy } from "firebase/firestore"
import { convertPdfBlobToJpgBlob, triggerFileDownload } from "@/lib/pdf-to-image"
import { generateDaftarHadirPDF, generateUangSakuPDF, generateDaftarHadirPesertaPDF } from "@/lib/pdf-utils-v2"
import { generateHonorNarasumberPDF, generateInsentifPDF, generateSiltapPDF } from "@/lib/pdf-utils"
import {
  generateNotaDanFakturPDF,
  generateStrukBelanjaPDF,
  type TransactionItem,
  type StrukModelType,
  type StrukWarnaTintaType,
  type JenisDokumenTransaksi,
  type UkuranKertasTransaksi
} from "@/lib/pdf-transaction-docs"

// Define robust types for build safety
interface Participant {
  name: string;
  jabatan: string;
  category: string;
}

const HEALTH_CATEGORIES = [
  "Balita",
  "Stunting",
  "Lansia",
  "Disabilitas",
  "Ibu Hamil",
  "Ibu Menyusui",
  "Ibu Hamil KEK",
  "Remaja Anemia"
]

const STRUK_MODELS: {
  id: StrukModelType;
  no: number;
  name: string;
  badge: string;
  desc: string;
  icon: string;
  defaultToko: string;
  defaultAlamat: string;
  defaultItem: string;
  defaultSatuan: string;
  defaultHarga: number;
  defaultSubHeader?: string;
  defaultLabelKhusus?: string;
  defaultKeteranganKhusus?: string;
  defaultCatatanKaki1?: string;
  defaultCatatanKaki2?: string;
}[] = [
    {
      id: "kelontong",
      no: 1,
      name: "Minimarket / Kelontong",
      badge: "Model 1",
      desc: "Konsumsi balai desa, gula, kopi, sabun, tisu",
      icon: "🛒",
      defaultToko: "MINIMARKET SAMPELDES JAYA",
      defaultAlamat: "Jl. Raya Pelita KM 5 Sampeldes",
      defaultItem: "Kopi Kapal Api Special 165gr",
      defaultSatuan: "Bks",
      defaultHarga: 16500,
      defaultSubHeader: "MINIMARKET & KELONTONG KEBUTUHAN KANTOR DESA",
      defaultLabelKhusus: "Keperluan",
      defaultKeteranganKhusus: "Konsumsi Harian Balai Desa Sampeldes",
      defaultCatatanKaki1: "Barang yang sudah dibeli tidak dapat ditukar/dikembalikan",
      defaultCatatanKaki2: "Terima kasih atas kunjungan Anda",
    },
    {
      id: "sembako",
      no: 2,
      name: "Toko Sembako & Rapat",
      badge: "Model 2",
      desc: "Beras cadangan desa, snack dus rapat pemdes",
      icon: "🍚",
      defaultToko: "TOKO SEMBAKO BERKAH IBU",
      defaultAlamat: "Pasar Sampeldes Kios No. 12",
      defaultItem: "Snack Kotak Jamuan Rapat",
      defaultSatuan: "Kotak",
      defaultHarga: 12000,
      defaultSubHeader: "GROSIR & ECERAN SEMBAKO - KONSUMSI RAPAT DESA",
      defaultLabelKhusus: "Keperluan",
      defaultKeteranganKhusus: "Konsumsi Jamuan Musdes & Rapat Koordinasi",
      defaultCatatanKaki1: "Barang yang sudah dibeli tidak dapat ditukar/dikembalikan",
      defaultCatatanKaki2: "Semoga berkah & bermanfaat",
    },
    {
      id: "atk",
      no: 3,
      name: "Toko ATK & Percetakan",
      badge: "Model 3",
      desc: "Kertas F4/A4, map arsip, toner printer, banner",
      icon: "📎",
      defaultToko: "GRAFIKA MEDIA ATK & FOTOCOPY",
      defaultAlamat: "Jl. Diponegoro KM 2 Sampeldes",
      defaultItem: "Kertas HVS PaperOne F4 75gr",
      defaultSatuan: "Rim",
      defaultHarga: 58000,
      defaultSubHeader: "PUSAT ALAT TULIS KANTOR, BUKU & PERLENGKAPAN DINAS",
      defaultLabelKhusus: "Kirim Ke",
      defaultKeteranganKhusus: "Sekretariat Kantor Desa Sampeldes",
      defaultCatatanKaki1: "Barang yang sudah dibeli tidak dapat dikembalikan tanpa nota",
      defaultCatatanKaki2: "Terima kasih atas kerja sama Anda",
    },
    {
      id: "bangunan",
      no: 4,
      name: "Toko Bangunan & Material",
      badge: "Model 4",
      desc: "Semen, pasir, cat, besi cor fisik desa / RTLH",
      icon: "🧱",
      defaultToko: "TB. SAMPELDES MAKMUR",
      defaultAlamat: "Jl. Raya Pasar Sampeldes No. 05",
      defaultItem: "Semen Gresik 40kg",
      defaultSatuan: "Zak",
      defaultHarga: 58000,
      defaultSubHeader: "DISTRIBUTOR BAHAN BANGUNAN & MATERIAL PROYEK DESA",
      defaultLabelKhusus: "Lokasi Proyek",
      defaultKeteranganKhusus: "Kegiatan Fisik Drainase / RTLH Desa Sampeldes",
      defaultCatatanKaki1: "Retur material maksimal 2 hari kerja dengan nota asli",
      defaultCatatanKaki2: "Melayani pengiriman material ke lokasi kegiatan desa",
    },
    {
      id: "listrik",
      no: 5,
      name: "Toko Listrik & Elektronik",
      badge: "Model 5",
      desc: "Kabel NYM, lampu PJU jalan desa, stop kontak",
      icon: "💡",
      defaultToko: "SINAR JAYA LISTRIK & TEKNIK",
      defaultAlamat: "Jl. Ahmad Yani No. 88 Sampeldes",
      defaultItem: "Lampu LED Philips 20 Watt (PJU)",
      defaultSatuan: "Pcs",
      defaultHarga: 65000,
      defaultSubHeader: "SPESIALIS KABEL, LAMPU PJU & ALAT TEKNIK ELEKTRIKAL",
      defaultLabelKhusus: "Pemasangan",
      defaultKeteranganKhusus: "Lampu PJU Jalan Desa & Kantor Pelayanan",
      defaultCatatanKaki1: "Garansi lampu tukar toko 1 bulan dengan kotak utuh",
      defaultCatatanKaki2: "Terima kasih atas kerja sama Anda",
    },
    {
      id: "spbu",
      no: 6,
      name: "SPBU Pertamina (BBM)",
      badge: "Model 6",
      desc: "Bahan bakar kendaraan dinas operasional desa",
      icon: "⛽",
      defaultToko: "SPBU 44.532.09 GANDRUNGMANGU",
      defaultAlamat: "Jl. Raya Gandrungmangu No. 12 Cilacap",
      defaultItem: "PERTALITE",
      defaultSatuan: "Liter",
      defaultHarga: 10000,
      defaultSubHeader: "PT PERTAMINA (PERSERO) - RETAIL FUEL STATION",
      defaultLabelKhusus: "No. Kendaraan",
      defaultKeteranganKhusus: "R 9508 XB (Randis Pemdes Sampeldes)",
      defaultCatatanKaki1: "PASTIKAN ANGKA METERAN MULAI DARI NOL",
      defaultCatatanKaki2: "TERIMA KASIH DAN SELAMAT JALAN",
    },
    {
      id: "komputer",
      no: 7,
      name: "Toko Komputer & Servis IT",
      badge: "Model 7",
      desc: "Toner printer, servis laptop kades/bendahara",
      icon: "💻",
      defaultToko: "MEDIAKOM COMPUTER & IT STORE",
      defaultAlamat: "Jl. Gatot Subroto No. 14 Sampeldes",
      defaultItem: "Toner Cartridge Canon 325",
      defaultSatuan: "Pcs",
      defaultHarga: 220000,
      defaultSubHeader: "PENYEDIA HARDWARE, CONSUMABLES & SERVIS LAPTOP PEMDES",
      defaultLabelKhusus: "Unit / Divisi",
      defaultKeteranganKhusus: "Komputer Pelayanan & Keuangan Desa",
      defaultCatatanKaki1: "Garansi servis & suku cadang 1 bulan sejak nota diterbitkan",
      defaultCatatanKaki2: "Melayani perawatan berkala IT kantor desa",
    },
    {
      id: "resto",
      no: 8,
      name: "Rumah Makan & Katering",
      badge: "Model 8",
      desc: "Jamuan rapat dinas kecamatan, prasmanan musdes",
      icon: "🍽️",
      defaultToko: "WAROENG DESA & CATERING",
      defaultAlamat: "Jl. Pemuda No. 10 Sampeldes",
      defaultItem: "Nasi Kotak Ayam Bakar Komplit",
      defaultSatuan: "Porsi",
      defaultHarga: 25000,
      defaultSubHeader: "RUMAH MAKAN & JASA KATERING JAMUAN RAPAT DESA",
      defaultLabelKhusus: "Acara / Rapat",
      defaultKeteranganKhusus: "Jamuan Rapat Koordinasi Kepala Desa & BPD",
      defaultCatatanKaki1: "Pesanan nasi dus / prasmanan telah diterima dalam keadaan baik",
      defaultCatatanKaki2: "Selamat menikmati sajian kami",
    },
    {
      id: "apotek",
      no: 9,
      name: "Apotek & Alkes Posyandu",
      badge: "Model 9",
      desc: "Masker, vitamin, P3K desa, strip cek posyandu",
      icon: "💊",
      defaultToko: "APOTEK SEHAT SAMPELDES",
      defaultAlamat: "Jl. Raya Pelita No. 22 Sampeldes",
      defaultItem: "Strip Tes Gula Darah EasyTouch",
      defaultSatuan: "Box",
      defaultHarga: 95000,
      defaultSubHeader: "PELAYANAN KEFARMASIAN & ALKES POSYANDU DESA",
      defaultLabelKhusus: "Keperluan Posyandu",
      defaultKeteranganKhusus: "Posyandu Balita & Lansia Desa Sampeldes",
      defaultCatatanKaki1: "Obat yang dibeli tidak dapat dikembalikan / ditukar",
      defaultCatatanKaki2: "Semoga lekas sembuh & tetap sehat selalu",
    },
    {
      id: "pertanian",
      no: 10,
      name: "Toko Pertanian (Ketahanan Pangan)",
      badge: "Model 10",
      desc: "Pupuk NPK, bibit unggul program ketahanan pangan",
      icon: "🌾",
      defaultToko: "UD. TANI MAKMUR LESTARI",
      defaultAlamat: "Jl. Lingkar Sawah No. 03 Sampeldes",
      defaultItem: "Pupuk NPK Mutiara 16-16-16",
      defaultSatuan: "Kg",
      defaultHarga: 18000,
      defaultSubHeader: "SARANA PRODUKSI PERTANIAN & KETAHANAN PANGAN DESA",
      defaultLabelKhusus: "Program Desa",
      defaultKeteranganKhusus: "Program Ketahanan Pangan Desa (20%)",
      defaultCatatanKaki1: "Barang pupuk & bibit bersertifikat resmi",
      defaultCatatanKaki2: "Mendukung ketahanan pangan desa makmur",
    },
    {
      id: "mebeler",
      no: 11,
      name: "Toko Mebeler / Furniture",
      badge: "Model 11",
      desc: "Meja kerja kantor desa, kursi rapat, lemari arsip kayu",
      icon: "🪑",
      defaultToko: "UD. MEBEL JAYA SAMPELDES",
      defaultAlamat: "Jl. Industri Kayu No. 18 Sampeldes",
      defaultItem: "Kursi Rapat Busa Chrome / Meja Kantor",
      defaultSatuan: "Unit",
      defaultHarga: 350000,
      defaultSubHeader: "PRODUSEN FURNITURE, MEJA KERJA & KURSI RAPAT DESA",
      defaultLabelKhusus: "Penempatan",
      defaultKeteranganKhusus: "Ruang Pelayanan & Ruang Rapat Balai Desa",
      defaultCatatanKaki1: "Barang telah dicek dan diterima dalam keadaan rapi dan baik",
      defaultCatatanKaki2: "Melayani pembuatan furniture kantor sesuai pesanan",
    },
    {
      id: "tratag_sound",
      no: 12,
      name: "Sewa Tratag & Sound System",
      badge: "Model 12",
      desc: "Sewa tratag/tenda, panggung, sound system HUT RI & musdes",
      icon: "⛺",
      defaultToko: "PUTRA NADA TRATAG & SOUND SYSTEM",
      defaultAlamat: "Jl. Pangeran Diponegoro No. 45 Sampeldes",
      defaultItem: "Sewa Tratag Plafon & Sound System Acara Desa",
      defaultSatuan: "Paket",
      defaultHarga: 1500000,
      defaultSubHeader: "PERSEWAAN TRATAG, TENDA, PANGGUNG & SOUND SYSTEM DESA",
      defaultLabelKhusus: "Lokasi / Acara",
      defaultKeteranganKhusus: "Lapangan Desa / Balai Desa Sampeldes",
      defaultCatatanKaki1: "Sewa sound & tenda mencakup operator dan teknisi stand-by",
      defaultCatatanKaki2: "Terima kasih telah mempercayakan acara kepada kami",
    },
    {
      id: "percetakan",
      no: 13,
      name: "Percetakan & Digital Printing",
      badge: "Model 13",
      desc: "Banner APBDes, baliho informasi publik desa, spanduk HUT RI, stiker",
      icon: "🖨️",
      defaultToko: "CV. SAMPELDES GRAFIKA & PRINTING",
      defaultAlamat: "Jl. Pemuda No. 88 Sampeldes",
      defaultItem: "Cetak Banner Spanduk APBDes (Flexi 280gr)",
      defaultSatuan: "Meter",
      defaultHarga: 25000,
      defaultSubHeader: "DIGITAL PRINTING, SPANDUK BALIHO & OFFSET DESA",
      defaultLabelKhusus: "Pesanan / Finishing",
      defaultKeteranganKhusus: "Mata Ayam Tiap Sudut (Siap Pasang di Jalan)",
      defaultCatatanKaki1: "Barang cetakan yang telah dicetak tidak dapat dibatalkan",
      defaultCatatanKaki2: "Terima kasih atas kerja samanya",
    },
  ];

const STRUK_INK_COLORS: {
  id: StrukWarnaTintaType;
  name: string;
  desc: string;
  dotColor: string;
  textColor: string;
  sampleStyle: string;
}[] = [
    {
      id: "hitam",
      name: "Hitam Standar",
      desc: "Thermal Modern Kasir",
      dotColor: "#141414",
      textColor: "text-zinc-900",
      sampleStyle: "rgb(20, 20, 20)",
    },
    {
      id: "biru",
      name: "Biru Klasik (SPBU/POS)",
      desc: "Khas SPBU Pertamina / Navy",
      dotColor: "#163662",
      textColor: "text-blue-900",
      sampleStyle: "rgb(22, 54, 98)",
    },
    {
      id: "ungu",
      name: "Ungu Ribbon Matrix",
      desc: "Pita Kasir Epson TM-U220",
      dotColor: "#44165f",
      textColor: "text-purple-900",
      sampleStyle: "rgb(68, 22, 95)",
    },
    {
      id: "abu",
      name: "Abu Thermal Realistis",
      desc: "Charcoal Kertas Kasir",
      dotColor: "#374151",
      textColor: "text-slate-700",
      sampleStyle: "rgb(55, 65, 81)",
    },
    {
      id: "hijau",
      name: "Hijau Gelap",
      desc: "Eco / Koperasi Agro",
      dotColor: "#0f3d29",
      textColor: "text-emerald-900",
      sampleStyle: "rgb(15, 61, 41)",
    },
  ];

const STRUK_FONTS: {
  id: string;
  name: string;
  category: string;
  desc: string;
  family: string;
  sample: string;
  bestFor: string;
}[] = [
    {
      id: "courier",
      name: "Courier New",
      category: "Monospace",
      desc: "Standar kasir dot-matrix & printer pita",
      family: "'Courier New', Courier, monospace",
      sample: "Rp 150.000",
      bestFor: "Struk 58/80mm & Nota",
    },
    {
      id: "consolas",
      name: "Consolas POS",
      category: "Modern Mono",
      desc: "Angka bergaris tengah tegas & presisi tinggi",
      family: "'Consolas', 'Courier New', monospace",
      sample: "Rp 150.000",
      bestFor: "Struk Kasir Modern",
    },
    {
      id: "receipt_thermal",
      name: "Thermal Receipt",
      category: "Compact Mono",
      desc: "Rapat padat khas supermarket & SPBU",
      family: "'Lucida Console', Monaco, monospace",
      sample: "Rp 150.000",
      bestFor: "Struk Mini 58mm",
    },
    {
      id: "helvetica",
      name: "Helvetica / Arial",
      category: "Sans-Serif",
      desc: "Standar universal faktur & invoice resmi kantor",
      family: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      sample: "Rp 150.000",
      bestFor: "Invoice Faktur A4",
    },
    {
      id: "calibri",
      name: "Calibri Clean",
      category: "Corporate Sans",
      desc: "Modern, elegan, rapi untuk pembukuan SPJ dinas",
      family: "'Calibri', Candara, Segoe, sans-serif",
      sample: "Rp 150.000",
      bestFor: "Invoice & Tagihan",
    },
    {
      id: "roboto",
      name: "Roboto Retail",
      category: "Mobile POS",
      desc: "Standar aplikasi kasir tablet Android (Moka/Pawoon)",
      family: "'Roboto', 'Segoe UI', Tahoma, sans-serif",
      sample: "Rp 150.000",
      bestFor: "Struk & Invoice",
    },
    {
      id: "dot_matrix",
      name: "Dot-Matrix 9-Pin",
      category: "Impact Ribbon",
      desc: "Pita jarum otentik nota kontan rangkap & SPBU",
      family: "'Courier New', monospace",
      sample: "Rp 150.000",
      bestFor: "Nota Karbon / SPBU",
    },
    {
      id: "times",
      name: "Times New Roman",
      category: "Formal Serif",
      desc: "Klasik berwibawa standar dokumen legal & kwitansi",
      family: "'Times New Roman', Times, serif",
      sample: "Rp 150.000",
      bestFor: "Nota Dinas & Invoice",
    },
    {
      id: "trebuchet",
      name: "Trebuchet MS",
      category: "Humanist Sans",
      desc: "Angka tebal bersahabat ramah kasir resto & katering",
      family: "'Trebuchet MS', 'Segoe UI', sans-serif",
      sample: "Rp 150.000",
      bestFor: "Resto & Katering",
    },
    {
      id: "lucida",
      name: "Lucida Console",
      category: "Micro Mono",
      desc: "Ultra-compact hemat kertas untuk cetak ringkas",
      family: "'Lucida Console', monospace",
      sample: "Rp 150.000",
      bestFor: "Struk 58mm & Nota 1/6",
    },
  ];

const configs = {
  "daftar-hadir": {
    title: "Daftar Hadir",
    desc: "Cetak absensi rapat atau kegiatan umum desa.",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  "uang-saku": {
    title: "Uang Saku",
    desc: "Cetak tanda terima uang saku/transport peserta.",
    icon: Wallet,
    color: "text-teal-600",
    bgColor: "bg-teal-50"
  },
  "daftar-hadir-posyandu": {
    title: "Posyandu",
    desc: "Cetak daftar hadir Kader & Peserta Posyandu.",
    icon: Stethoscope,
    color: "text-rose-600",
    bgColor: "bg-rose-50"
  },
  "honor-narasumber": {
    title: "Honor Narasumber",
    desc: "Cetak tanda terima honorarium narasumber.",
    icon: UserPlus,
    color: "text-amber-600",
    bgColor: "bg-amber-50"
  },
  "honor-kegiatan": {
    title: "Honor Kegiatan",
    desc: "Cetak tanda terima honorarium kepanitiaan & petugas kegiatan desa.",
    icon: Award,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50"
  },
  "insentif": {
    title: "Insentif Lembaga",
    desc: "Cetak tanda terima insentif RT/RW, Kader, dll.",
    icon: Coins,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  "siltap": {
    title: "Siltap & BPD",
    desc: "Cetak tanda terima Siltap Perangkat & BPD.",
    icon: Banknote,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50"
  },
  "bukti-transaksi": {
    title: "Cetak Bukti Transaksi",
    desc: "Cetak Nota Pesanan, Faktur Pengiriman & Struk Belanja Kasir.",
    icon: ReceiptText,
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  }
}

/**
 * Utilitas Pengurutan Hierarkis untuk PDF
 */
const CATEGORY_ORDER = [
  "Pemerintah Desa",
  "BPD",
  "RT/RW",
  "Kader",
  "KPM",
  "Karang Taruna",
  "Linmas",
  "Pengurus BUMDes",
  "Pengurus KDMP",
  "Guru Ngaji",
  "Guru TK & Paud"
];

const getRankWeight = (jabatan: string) => {
  const j = jabatan.toUpperCase();
  if (j.includes("KEPALA DESA")) return 1;
  if (j.includes("SEKRETARIS DESA")) return 2;
  if (j.includes("KASI") || j.includes("KEPALA SEKSI")) return 3;
  if (j.includes("KAUR") || j.includes("KEPALA URUSAN")) return 4;
  if (j.includes("KEPALA DUSUN") || j.includes("KADUS")) return 5;
  if (j.includes("STAF")) return 6;
  return 100;
};

const getRtRwWeight = (jabatan: string) => {
  const j = jabatan.toUpperCase();
  const rwMatch = j.match(/RW\s*(\d+)/);
  const rtMatch = j.match(/RT\s*(\d+)/);
  const rwNum = rwMatch ? parseInt(rwMatch[1]) : 0;
  const rtNum = rtMatch ? parseInt(rtMatch[1]) : 0;
  let weight = rwNum * 1000;
  if (j.includes("KETUA RW") && !j.includes("RT")) {
    weight += 0;
  } else {
    weight += rtNum;
  }
  return weight;
};

const getKaderWeight = (jabatan: string) => {
  const j = jabatan.toUpperCase();
  const match = j.match(/(?:PUSPITASARI|LESTARI|RAHAYU)\s*(\d+)/i) || j.match(/(\d+)/);
  return match ? parseInt(match[1]) : 999;
};

const sortParticipants = (list: any[]) => {
  return list.sort((a, b) => {
    const catA = a.category;
    const catB = b.category;

    if (catA !== catB) {
      return CATEGORY_ORDER.indexOf(catA) - CATEGORY_ORDER.indexOf(catB);
    }

    if (catA === "Pemerintah Desa") {
      return getRankWeight(a.jabatan) - getRankWeight(b.jabatan);
    } else if (catA === "RT/RW") {
      return getRtRwWeight(a.jabatan) - getRtRwWeight(b.jabatan);
    } else if (catA === "Kader") {
      return getKaderWeight(a.jabatan) - getKaderWeight(b.jabatan);
    }

    return a.name.localeCompare(b.name);
  });
};

function DokumenContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type")
  const current = type ? configs[type as keyof typeof configs] : null
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingAction, setGeneratingAction] = useState<"print" | "download-pdf" | "download-jpg" | null>(null)
  const [mounted, setMounted] = useState(false)

  // Sub tab state for posyandu
  const [posyanduSubType, setPosyanduSubType] = useState<"kader" | "peserta">("kader")

  // FETCH APBDes Data from Firestore (Unified Source)
  const apbRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "apbdes"), orderBy("kode", "asc"))
  }, [db, user])
  const { data: currentApbData, isLoading: isApbLoading } = useCollection<any>(apbRef)

  // Mengambil data personil dari Firestore
  const personnelRef = useMemoFirebase(() => (db && user) ? collection(db, "personnel") : null, [db, user])
  const { data: dbOfficials } = useCollection(personnelRef)

  // GLOBAL CONFIG: Ambil Logo dari Pengaturan Desa
  const villageSettingsRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "settings", "village")
  }, [db])
  const { data: villageSettings } = useDoc(villageSettingsRef)

  const [useApbdes, setUseApbdes] = useState(true)
  const [selectedApbdesType, setSelectedApbdesType] = useState<"APBDes" | "APBDes Perubahan">("APBDes")
  const [selectedYear, setSelectedYear] = useState("2026")
  const [bidang, setBidang] = useState("")
  const [sumber, setSumber] = useState("")
  const [kegiatan, setKegiatan] = useState("")
  const [manualTitle, setManualTitle] = useState("")
  const [date, setDate] = useState("")
  const [location, setLocation] = useState("Balai Desa Sampeldes")
  const [time, setTime] = useState("09:00 WIB")

  const [jumlahOrang, setJumlahOrang] = useState<number>(15)
  const [jumlahKuotaPeserta, setJumlahKuotaPeserta] = useState<number>(30)
  const [participantSelections, setParticipantSelections] = useState(Array(6).fill("none"));

  const [uangSakuNominal, setUangSakuNominal] = useState("100000")
  const [uangSakuTax, setUangSakuTax] = useState("5")

  const [numNarsum, setNumNarsum] = useState<number>(1)
  const [narsumData, setNarsumData] = useState(
    Array(4).fill(null).map(() => ({ name: "", position: "", nominal: "", tax: "0" }))
  )

  // Honor Kegiatan States
  const HONOR_KEGIATAN_CATEGORIES = [
    "Honorarium Protokoler",
    "Honorarium Kebersihan",
    "Honorarium Petugas Registrasi",
    "Honorarium Tim Pelaksana Kegiatan",
    "Honorarium Operator",
    "Input Manual"
  ]

  const [honorKegiatanCat, setHonorKegiatanCat] = useState("Honorarium Protokoler")
  const [manualHonorCat, setManualHonorCat] = useState("")
  const [numHonorKegiatan, setNumHonorKegiatan] = useState<number>(1)
  const [honorKegiatanData, setHonorKegiatanData] = useState(
    Array(20).fill(null).map(() => ({ name: "", position: "Protokoler / MC", nominal: "", tax: "0" }))
  )
  const [batchHonorNominal, setBatchHonorNominal] = useState("")
  const [batchHonorTax, setBatchHonorTax] = useState("0")

  const [insentifCat, setInsentifCat] = useState("RT/RW")
  const [insentifMonth, setInsentifMonth] = useState("Januari")
  const [insentifNominal, setInsentifNominal] = useState("0")
  const [insentifTax, setInsentifTax] = useState("0")

  const [siltapSubType, setSiltapSubType] = useState<"perangkat" | "bpd">("perangkat")

  // Posyandu States
  const [selectedLestari, setSelectedLestari] = useState("")
  const [selectedHealthCategory, setSelectedHealthCategory] = useState("Balita")

  // Fetch actual health records data based on selection
  const healthDataQuery = useMemoFirebase(() => {
    if (!db || !user || type !== "daftar-hadir-posyandu" || posyanduSubType !== "peserta" || !selectedHealthCategory) return null;

    const colRef = collection(db, "health_records");
    if (selectedLestari && selectedLestari !== "SEMUA POSYANDU") {
      return query(colRef, where("category", "==", selectedHealthCategory), where("posyandu", "==", selectedLestari));
    }
    return query(colRef, where("category", "==", selectedHealthCategory));
  }, [db, user, type, posyanduSubType, selectedHealthCategory, selectedLestari]);
  const { data: healthRecords } = useCollection(healthDataQuery);

  // Bukti Transaksi States
  const [buktiTab, setBuktiTab] = useState<"nota-faktur" | "struk-belanja">("nota-faktur");

  // Tab 1: Nota & Faktur Pengiriman
  const [notaDate, setNotaDate] = useState("");
  const [notaPerangkatNama, setNotaPerangkatNama] = useState("");
  const [notaPerangkatJabatan, setNotaPerangkatJabatan] = useState("");
  const [notaKepalaDesa, setNotaKepalaDesa] = useState("AF. MAHFUR");
  const [notaNamaToko, setNotaNamaToko] = useState("");
  const [notaNamaPemilik, setNotaNamaPemilik] = useState("");
  const [notaAlamatToko, setNotaAlamatToko] = useState("SAMPELDES");
  const [notaNoTelp, setNotaNoTelp] = useState("");
  const [notaNoNota, setNotaNoNota] = useState("");
  const [notaNoFaktur, setNotaNoFaktur] = useState("");
  const [notaItems, setNotaItems] = useState<TransactionItem[]>([
    { jenisBarang: "", banyaknya: 1, satuan: "buah", hargaSatuan: "", jumlah: "" },
  ]);

  // Tab 2: Struk Belanja
  const [strukDate, setStrukDate] = useState("");
  const [strukJam, setStrukJam] = useState("14");
  const [strukMenit, setStrukMenit] = useState("30");
  const [strukDetik, setStrukDetik] = useState("00");
  const [strukNamaToko, setStrukNamaToko] = useState("");
  const [strukAlamatToko, setStrukAlamatToko] = useState("Jl. Raya Pelita KM 5 Sampeldes");
  const [strukNoTelp, setStrukNoTelp] = useState("");
  const [strukKasir, setStrukKasir] = useState("KASIR 01");
  const [strukNoRef, setStrukNoRef] = useState("");
  const [strukBayarTunai, setStrukBayarTunai] = useState("");
  const [strukItems, setStrukItems] = useState<TransactionItem[]>([
    { jenisBarang: "", banyaknya: 1, satuan: "Pcs", hargaSatuan: "", jumlah: "" },
  ]);
  const [strukModel, setStrukModel] = useState<StrukModelType>("kelontong");
  const [strukWarnaTinta, setStrukWarnaTinta] = useState<StrukWarnaTintaType>("hitam");
  const [strukSpbuNomor, setStrukSpbuNomor] = useState("SPBU 44.532.09 GANDRUNGMANGU");
  const [strukSpbuNoPompa, setStrukSpbuNoPompa] = useState("02 / 01");
  const [strukSpbuPlatNomor, setStrukSpbuPlatNomor] = useState("R 9508 XB (RANDIS DESA)");
  const [strukSpbuJenisBbm, setStrukSpbuJenisBbm] = useState("PERTALITE");

  // Skema Jenis Dokumen, Ukuran Kertas, Pilihan Font & Logo Toko
  const [strukJenisDokumen, setStrukJenisDokumen] = useState<JenisDokumenTransaksi>("struk");
  const [strukUkuranKertas, setStrukUkuranKertas] = useState<string>("80mm");
  const [strukFont, setStrukFont] = useState<string>("courier");
  const [strukLogoBase64, setStrukLogoBase64] = useState<string | null>(null);
  const [strukPembeliNama, setStrukPembeliNama] = useState("PEMERINTAH DESA SAMPELDES");
  const [strukPembeliAlamat, setStrukPembeliAlamat] = useState("Kecamatan Gandrungmangu, Kabupaten Cilacap - Jawa Tengah");
  const [strukKeperluan, setStrukKeperluan] = useState<string>("");

  // Pengaturan Tambahan Manual Rincian Toko, Dokumen & Transaksi
  const [strukSubHeader, setStrukSubHeader] = useState("MINIMARKET & KELONTONG KEBUTUHAN KANTOR DESA");
  const [strukLabelKhusus, setStrukLabelKhusus] = useState("Keperluan");
  const [strukKeteranganKhusus, setStrukKeteranganKhusus] = useState("Konsumsi Harian Balai Desa Sampeldes");
  const [strukCatatanKaki1, setStrukCatatanKaki1] = useState("Barang yang sudah dibeli tidak dapat ditukar/dikembalikan");
  const [strukCatatanKaki2, setStrukCatatanKaki2] = useState("Terima kasih atas kunjungan Anda");
  const [strukPenerimaNama, setStrukPenerimaNama] = useState("Bpk. Sekretaris Desa / TPK");
  const [strukStatusBayar, setStrukStatusBayar] = useState("LUNAS / TUNAI");
  const [strukTuanNota, setStrukTuanNota] = useState("Pemdes Sampeldes");

  // Diskon Belanja Barang (Nominal / Persen)
  const [strukDiskonTipe, setStrukDiskonTipe] = useState<"nominal" | "persen">("persen");
  const [strukDiskonNilai, setStrukDiskonNilai] = useState<string>("");

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Format Salah", description: "Harap pilih file gambar (PNG, JPG, WebP)", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setStrukLogoBase64(base64);
      toast({ title: "Logo Berhasil Dimuat", description: "Logo toko akan dicetak pada kop dokumen transaksi." });
    };
    reader.readAsDataURL(file);
  };

  const applyModelPreset = (m: typeof STRUK_MODELS[0]) => {
    setStrukModel(m.id);
    setStrukNamaToko(m.defaultToko);
    setStrukAlamatToko(m.defaultAlamat);
    if (m.defaultSubHeader) setStrukSubHeader(m.defaultSubHeader);
    if (m.defaultLabelKhusus) setStrukLabelKhusus(m.defaultLabelKhusus);
    if (m.defaultKeteranganKhusus) {
      setStrukKeteranganKhusus(m.defaultKeteranganKhusus);
      setStrukKeperluan(m.defaultKeteranganKhusus);
    }
    if (m.defaultCatatanKaki1) setStrukCatatanKaki1(m.defaultCatatanKaki1);
    if (m.defaultCatatanKaki2) setStrukCatatanKaki2(m.defaultCatatanKaki2);

    if (m.id === "spbu") {
      setStrukSpbuNomor(m.defaultToko);
      setStrukSpbuJenisBbm("PERTALITE");
      if (strukItems.length === 1 && (!strukItems[0].jenisBarang || strukItems[0].jenisBarang === "Belanja Barang")) {
        setStrukItems([{ jenisBarang: "PERTALITE", banyaknya: 15, satuan: "Liter", hargaSatuan: 10000, jumlah: 150000 }]);
      }
    } else {
      if (strukItems.length === 1 && (!strukItems[0].jenisBarang || strukItems[0].jenisBarang === "Belanja Barang")) {
        setStrukItems([{ jenisBarang: m.defaultItem, banyaknya: 1, satuan: m.defaultSatuan, hargaSatuan: m.defaultHarga, jumlah: m.defaultHarga }]);
      }
    }
  };

  const addQuickStrukItem = (jenisBarang: string, banyaknya: number, satuan: string, hargaSatuan: number) => {
    setStrukItems((prev) => {
      if (prev.length === 1 && (!prev[0].jenisBarang || prev[0].jenisBarang === "Belanja Barang")) {
        return [{ jenisBarang, banyaknya, satuan, hargaSatuan, jumlah: banyaknya * hargaSatuan }];
      }
      return [...prev, { jenisBarang, banyaknya, satuan, hargaSatuan, jumlah: banyaknya * hargaSatuan }];
    });
    toast({
      title: "Barang Ditambahkan",
      description: `${jenisBarang} (${banyaknya} ${satuan}) berhasil masuk ke tabel rincian barang.`,
    });
  };

  useEffect(() => {
    setMounted(true)
    const today = new Date().toISOString().split('T')[0]
    setDate(today)
    setNotaDate(today)
    setStrukDate(today)

    // Auto switch to manual mode for posyandu & bukti-transaksi
    if (type === "daftar-hadir-posyandu" || type === "bukti-transaksi") {
      setUseApbdes(false)
    }
  }, [type])

  const LestariGroups = useMemo(() => {
    if (!dbOfficials) return [];
    const kaders = dbOfficials.filter(o => o.category === "Kader");
    const groups = new Set<string>();
    kaders.forEach(k => {
      const job = k.jabatan?.toUpperCase() || "";
      // Cari pola "Puspitasari [Angka]" atau "Lestari [Angka]"
      const matchSari = job.match(/SARI\s+RAHAYU\s*(\d+)?/i);
      const matchLestari = job.match(/LESTARI\s*(\d+)?/i);

      if (matchSari) groups.add(matchSari[0].trim());
      else if (matchLestari) groups.add(matchLestari[0].trim());
      else if (job.includes("PUSPITASARI")) groups.add("PUSPITASARI");
      else if (job.includes("LESTARI")) groups.add("LESTARI");
    });

    const result = Array.from(groups).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
    return ["SEMUA POSYANDU", ...result];
  }, [dbOfficials]);

  const handleParticipantSelectionChange = (index: number, value: string) => {
    const newSelections = [...participantSelections];
    newSelections[index] = value;
    setParticipantSelections(newSelections);
  };

  const participantCategories = useMemo(() =>
    Array.from(new Set((dbOfficials || []).map(o => o.category).filter(c => c && c.trim() !== '')))
    , [dbOfficials]);

  const filteredSources = useMemo(() => {
    if (!bidang || !currentApbData) return []
    const sources = currentApbData
      .filter((item: any) => {
        const itemTipe = item.tipe || "APBDes";
        return String(item.bidang) === String(bidang) && item.tahun === selectedYear && itemTipe === selectedApbdesType;
      })
      .map((item: any) => String(item.sumber || "").trim())
      .filter(s => s !== "");
    return Array.from(new Set(sources))
  }, [bidang, selectedYear, currentApbData, selectedApbdesType])

  const filteredActivities = useMemo(() => {
    if (!bidang || !sumber || !currentApbData) return []
    return currentApbData.filter((item: any) => {
      const itemTipe = item.tipe || "APBDes";
      return String(item.bidang) === String(bidang) &&
        item.tahun === selectedYear &&
        itemTipe === selectedApbdesType &&
        String(item.sumber || "").trim() === String(sumber).trim();
    })
  }, [bidang, sumber, selectedYear, currentApbData, selectedApbdesType])

  const currentPaperSizeLabel = useMemo(() => {
    if (type === "bukti-transaksi") {
      if (buktiTab === "nota-faktur") {
        return "1/4 Folio";
      }
      return strukUkuranKertas || "80mm";
    }
    return "A4 / F4 Standar";
  }, [type, buktiTab, strukUkuranKertas]);

  const generateDocumentBlob = async (): Promise<{ blob: Blob; fileName: string }> => {
    const finalTitle = (type === "daftar-hadir-posyandu" || !useApbdes) ? manualTitle : kegiatan;

    let pdfBlob: Blob | undefined;
    let defaultFileName = "DOKUMEN";

    if (type === "daftar-hadir" || type === "uang-saku") {
      if (!finalTitle) throw new Error("Judul kegiatan harus diisi")
      const quota = jumlahOrang || 1;
      const selectedCats = participantSelections.filter(cat => cat && cat !== "none");
      let allParticipants: any[] = [];

      selectedCats.forEach(cat => {
        const members = (dbOfficials || []).filter(o => o.category === cat).map(o => ({
          name: String(o.name || ""),
          jabatan: String(o.jabatan || ""),
          category: String(o.category || "")
        }));
        allParticipants.push(...members);
      });

      const sorted = sortParticipants(allParticipants);
      const uniqueParticipants = Array.from(new Map(sorted.map(item => [item.name, item])).values());
      const finalParticipants = Array.from({ length: quota }, (_, i) =>
        uniqueParticipants[i] || { name: "", jabatan: "", category: "" }
      );

      const pdfData = {
        kegiatan: finalTitle,
        tanggal: date,
        participants: finalParticipants,
        nominal: uangSakuNominal,
        tax: uangSakuTax,
        location,
        time
      };

      if (type === "daftar-hadir") {
        pdfBlob = await generateDaftarHadirPDF(pdfData, villageSettings?.logoBase64);
      } else {
        pdfBlob = await generateUangSakuPDF(pdfData, villageSettings?.logoBase64);
      }
    }
    else if (type === "daftar-hadir-posyandu") {
      if (!finalTitle) throw new Error("Judul kegiatan harus diisi")
      if (!selectedLestari) throw new Error("Pilih Kelompok Posyandu")

      const isAll = selectedLestari === "SEMUA POSYANDU";
      const displayLestari = isAll ? "LESTARI" : selectedLestari;
      const reportTitle = isAll ? "DAFTAR HADIR POSYANDU" : `DAFTAR HADIR POSYANDU ${displayLestari}`;

      if (posyanduSubType === "kader") {
        const kaders = (dbOfficials || []).filter(o => o.category === "Kader" && (isAll || o.jabatan?.toUpperCase().includes(selectedLestari)));
        const quota = Math.max(kaders.length, 10);
        const sortedKaders = sortParticipants(kaders);
        const finalParticipants = Array.from({ length: quota }, (_, i) =>
          sortedKaders[i] ? { name: sortedKaders[i].name, jabatan: sortedKaders[i].jabatan, category: "Kader" } : { name: "", jabatan: "", category: "" }
        );
        const pdfData = {
          kegiatan: finalTitle,
          tanggal: date,
          participants: finalParticipants,
          mainTitle: reportTitle,
          location,
          time
        };
        pdfBlob = await generateDaftarHadirPDF(pdfData, villageSettings?.logoBase64);
      } else {
        const mappedParticipants = (healthRecords || []).map(r => ({
          name: r.name,
          jabatan: r.address,
          category: r.category
        }));
        mappedParticipants.sort((a, b) => a.name.localeCompare(b.name));
        const pdfData = {
          kegiatan: finalTitle,
          tanggal: date,
          participants: mappedParticipants,
          quota: Math.max(mappedParticipants.length, jumlahKuotaPeserta),
          mainTitle: isAll ? `DAFTAR HADIR ${selectedHealthCategory.toUpperCase()} POSYANDU` : `DAFTAR HADIR ${selectedHealthCategory.toUpperCase()} POSYANDU ${displayLestari}`,
          location,
          time
        };
        pdfBlob = await generateDaftarHadirPesertaPDF(pdfData, villageSettings?.logoBase64);
      }
    }
    else if (type === "honor-narasumber") {
      if (!finalTitle) throw new Error("Nama kegiatan harus diisi")
      const activeNarsum = narsumData.slice(0, numNarsum)
      pdfBlob = await generateHonorNarasumberPDF({ title: finalTitle, date, location, time, narsum: activeNarsum }, villageSettings?.logoBase64)
    }
    else if (type === "honor-kegiatan") {
      if (!finalTitle) throw new Error("Nama kegiatan harus diisi")
      const activeHonor = honorKegiatanData.slice(0, numHonorKegiatan)
      let categoryTitle = honorKegiatanCat === "Input Manual"
        ? (manualHonorCat.trim() || "HONORARIUM KEGIATAN")
        : honorKegiatanCat

      let formattedHeading = categoryTitle.toUpperCase()
      if (!formattedHeading.startsWith("TANDA TERIMA")) {
        formattedHeading = `TANDA TERIMA ${formattedHeading}`
      }

      pdfBlob = await generateHonorNarasumberPDF({
        docTitle: formattedHeading,
        title: finalTitle,
        date,
        location,
        time,
        narsum: activeHonor
      }, villageSettings?.logoBase64)
    }
    else if (type === "bukti-transaksi") {
      if (buktiTab === "nota-faktur") {
        if (!notaNamaToko.trim()) throw new Error("Nama toko / penyedia barang harus diisi")
        if (!notaPerangkatNama.trim()) throw new Error("Pilih perangkat / pelaksana yang membidangi")
        const valid = notaItems.filter(it => it.jenisBarang && it.jenisBarang.trim() !== "")
        if (valid.length === 0) throw new Error("Tambahkan minimal 1 barang pada nota")

        pdfBlob = await generateNotaDanFakturPDF({
          tanggal: notaDate,
          namaToko: notaNamaToko,
          namaPemilik: notaNamaPemilik,
          alamatToko: notaAlamatToko,
          noTeleponToko: notaNoTelp,
          perangkatNama: notaPerangkatNama,
          perangkatJabatan: notaPerangkatJabatan,
          kepalaDesaNama: notaKepalaDesa || "AF. MAHFUR",
          noNota: notaNoNota,
          noFaktur: notaNoFaktur,
          items: notaItems
        }, villageSettings?.logoBase64)
      } else {
        if (!strukNamaToko.trim() && strukModel !== "spbu") throw new Error("Nama toko / merchant harus diisi")
        const valid = strukItems.filter(it => it.jenisBarang && it.jenisBarang.trim() !== "")
        if (valid.length === 0) throw new Error("Tambahkan minimal 1 barang belanjaan pada struk")

        pdfBlob = await generateStrukBelanjaPDF({
          tanggal: strukDate,
          jam: strukJam,
          menit: strukMenit,
          detik: strukDetik,
          namaToko: strukModel === "spbu" && !strukNamaToko.trim() ? strukSpbuNomor : strukNamaToko,
          alamatToko: strukAlamatToko,
          noTelepon: strukNoTelp,
          namaKasir: strukKasir,
          noStruk: strukNoRef,
          bayarTunai: strukBayarTunai,
          items: strukItems,
          modelStruk: strukModel,
          warnaTinta: strukWarnaTinta,
          spbuNomor: strukSpbuNomor,
          spbuNoPompa: strukSpbuNoPompa,
          spbuPlatNomor: strukSpbuPlatNomor,
          spbuJenisBbm: strukSpbuJenisBbm,
          jenisDokumen: strukJenisDokumen,
          ukuranKertas: strukUkuranKertas,
          pilihanFont: strukFont,
          logoTokoBase64: strukLogoBase64,
          pembeliNama: strukPembeliNama,
          pembeliAlamat: strukPembeliAlamat,
          keperluanProgram: strukKeperluan || strukKeteranganKhusus,
          subHeaderToko: strukSubHeader,
          labelKeteranganKhusus: strukLabelKhusus,
          keteranganKhusus: strukKeteranganKhusus,
          catatanKaki1: strukCatatanKaki1,
          catatanKaki2: strukCatatanKaki2,
          penerimaNama: strukPenerimaNama,
          statusPembayaran: strukStatusBayar,
          tuanNota: strukTuanNota,
          diskonTipe: strukDiskonTipe,
          diskonNilai: strukDiskonNilai,
        })
      }
    }
    else if (type === "insentif") {
      let insentifParticipants: { name: string; position: string; category: string }[] = []
      const categoryMap = {
        "RT/RW": "RT/RW",
        "KADER POSYANDU": "Kader",
        "GURU PAUD": "Guru TK & Paud",
        "KADER KPM": "KPM",
        "HONORARIUM LINMAS": "Linmas"
      };
      const selectedCategory = (categoryMap as any)[insentifCat];
      if (selectedCategory) {
        const rawMembers = (dbOfficials || []).filter(o => o.category === selectedCategory).map(o => ({
          name: String(o.name || ""),
          position: String(o.jabatan || ""),
          category: String(o.category || ""),
          jabatan: String(o.jabatan || "")
        }));
        const sorted = sortParticipants(rawMembers);
        insentifParticipants = sorted.map(s => ({ name: s.name, position: s.position, category: s.category }));
      }

      pdfBlob = await generateInsentifPDF({
        category: insentifCat,
        month: insentifMonth,
        date: date,
        nominal: insentifNominal,
        tax: insentifTax,
        participants: insentifParticipants,
        jumlahOrang: insentifParticipants.length
      }, villageSettings?.logoBase64)
    }
    else if (type === "siltap") {
      let dataToPrint = [];
      if (siltapSubType === "perangkat") {
        dataToPrint = (dbOfficials || [])
          .filter(o => o.category === "Pemerintah Desa")
          .map(o => {
            let nominal = 0;
            const job = (o.jabatan || "").toUpperCase();
            if (job.includes("KEPALA DESA")) nominal = 4000000;
            else if (job.includes("SEKRETARIS DESA")) nominal = 3000000;
            else if (job.includes("KAUR KEUANGAN")) nominal = 2400000;
            else if (job.includes("KAUR UMUM") || job.includes("KAUR UMUM ADD")) nominal = 2400000;
            else if (job.includes("KASI PEMERINTAHAN")) nominal = 2400000;
            else if (job.includes("KASI KESEJAHTERAAN")) nominal = 2400000;
            else if (job.includes("KASI PELAYANAN")) nominal = 2400000;
            else if (job.includes("KEPALA DUSUN")) nominal = 2200000;
            else if (job.includes("STAF")) nominal = 2050000;
            else nominal = 0;
            return { name: o.name, jabatan: o.jabatan, nominal: nominal, category: o.category };
          });
        dataToPrint = sortParticipants(dataToPrint);
      } else {
        dataToPrint = (dbOfficials || [])
          .filter(o => o.category === "BPD")
          .map(o => {
            let nominal = 0;
            const job = (o.jabatan || "").toUpperCase();
            if (job.includes("KETUA") && !job.includes("WAKIL")) nominal = 550000;
            else if (job.includes("WAKIL KETUA")) nominal = 450000;
            else if (job.includes("SEKRETARIS")) nominal = 400000;
            else nominal = 350000;
            return { name: o.name, jabatan: o.jabatan, nominal: nominal, category: o.category };
          });
        dataToPrint.sort((a, b) => b.nominal - a.nominal || a.name.localeCompare(b.name));
      }
      pdfBlob = await generateSiltapPDF({
        month: insentifMonth,
        date,
        title: siltapSubType === "perangkat" ? "TANDA TERIMA PENGHASILAN TETAP" : "TANDA TERIMA INSENTIF BPD",
        data: dataToPrint
      }, villageSettings?.logoBase64)
    }

    // Penamaan file yang rapi dan deskriptif
    if (type === "daftar-hadir") {
      defaultFileName = `DAFTAR_HADIR_${(finalTitle || "KEGIATAN").replace(/[^a-zA-Z0-9]/g, "_")}`;
    } else if (type === "uang-saku") {
      defaultFileName = `UANG_SAKU_${(finalTitle || "KEGIATAN").replace(/[^a-zA-Z0-9]/g, "_")}`;
    } else if (type === "daftar-hadir-posyandu") {
      defaultFileName = `DAFTAR_HADIR_POSYANDU_${(selectedLestari || "LESTARI").replace(/[^a-zA-Z0-9]/g, "_")}`;
    } else if (type === "honor-narasumber") {
      defaultFileName = `HONOR_NARASUMBER_${(finalTitle || "KEGIATAN").replace(/[^a-zA-Z0-9]/g, "_")}`;
    } else if (type === "honor-kegiatan") {
      defaultFileName = `HONOR_KEGIATAN_${(finalTitle || "KEGIATAN").replace(/[^a-zA-Z0-9]/g, "_")}`;
    } else if (type === "bukti-transaksi") {
      if (buktiTab === "nota-faktur") {
        defaultFileName = `NOTA_KONTAN_${(notaNamaToko || "TOKO").replace(/[^a-zA-Z0-9]/g, "_")}_${(notaNoNota || "TRX").replace(/[^a-zA-Z0-9]/g, "_")}`;
      } else {
        const prefix = strukJenisDokumen === "struk" ? "STRUK" : strukJenisDokumen === "nota" ? "NOTA" : "INVOICE";
        const shop = (strukNamaToko || (strukModel === "spbu" ? strukSpbuNomor : "TOKO")).replace(/[^a-zA-Z0-9]/g, "_");
        const size = (strukUkuranKertas || "80mm").replace(/[^a-zA-Z0-9]/g, "_");
        const ref = (strukNoRef || "TRX").replace(/[^a-zA-Z0-9]/g, "_");
        defaultFileName = `${prefix}_${shop}_${size}_${ref}`;
      }
    } else if (type === "insentif") {
      defaultFileName = `INSENTIF_${(insentifCat || "LEMBAGA").replace(/[^a-zA-Z0-9]/g, "_")}_${(insentifMonth || "BULAN").replace(/[^a-zA-Z0-9]/g, "_")}`;
    } else if (type === "siltap") {
      defaultFileName = `SILTAP_${siltapSubType === "perangkat" ? "PERANGKAT" : "BPD"}_${(insentifMonth || "BULAN").replace(/[^a-zA-Z0-9]/g, "_")}`;
    }

    if (!pdfBlob) {
      throw new Error("Gagal menghasilkan dokumen.");
    }

    return { blob: pdfBlob, fileName: defaultFileName };
  };

  const handleExecute = async (action: "print" | "download-pdf" | "download-jpg") => {
    setIsGenerating(true);
    setGeneratingAction(action);
    try {
      const { blob: pdfBlob, fileName } = await generateDocumentBlob();

      if (action === "print") {
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, "_blank");
        toast({ title: "Berhasil", description: "Dokumen siap dicetak." });
      } else if (action === "download-pdf") {
        triggerFileDownload(pdfBlob, `${fileName}.pdf`);
        toast({
          title: "Download PDF Berhasil",
          description: `File ${fileName}.pdf (${currentPaperSizeLabel}) berhasil diunduh.`,
        });
      } else if (action === "download-jpg") {
        toast({
          title: "Memproses Gambar JPG...",
          description: "Sedang mengonversi dokumen ke format gambar JPG tajam...",
        });
        const jpgBlob = await convertPdfBlobToJpgBlob(pdfBlob, 3.0);
        triggerFileDownload(jpgBlob, `${fileName}.jpg`);
        toast({
          title: "Download JPG Berhasil",
          description: `Gambar ${fileName}.jpg (${currentPaperSizeLabel}) berhasil diunduh.`,
        });
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: action === "print" ? "Gagal Cetak" : "Gagal Mengunduh",
        description: e.message || "Terjadi kesalahan sistem.",
      });
    } finally {
      setIsGenerating(false);
      setGeneratingAction(null);
    }
  };

  const handlePrint = () => handleExecute("print");

  const updateNarsumData = (index: number, field: string, value: string) => {
    const newData = [...narsumData]
    newData[index] = { ...newData[index], [field]: value }
    setNarsumData(newData)
  }

  const getDefaultJob = (cat: string) => {
    switch (cat) {
      case "Honorarium Protokoler": return "Protokoler / MC";
      case "Honorarium Kebersihan": return "Petugas Kebersihan";
      case "Honorarium Petugas Registrasi": return "Petugas Registrasi";
      case "Honorarium Tim Pelaksana Kegiatan": return "Tim Pelaksana Kegiatan";
      case "Honorarium Operator": return "Operator / IT";
      default: return "Petugas Kegiatan";
    }
  }

  const handleSelectHonorCat = (cat: string) => {
    setHonorKegiatanCat(cat)
    const defaultPos = getDefaultJob(cat)
    setHonorKegiatanData(prev => prev.map(item => ({
      ...item,
      position: item.position === "" || [
        "Protokoler / MC",
        "Petugas Kebersihan",
        "Petugas Registrasi",
        "Tim Pelaksana Kegiatan",
        "Operator / IT",
        "Petugas Kegiatan"
      ].includes(item.position) ? defaultPos : item.position
    })))
  }

  const updateHonorKegiatanData = (index: number, field: string, value: string) => {
    const newData = [...honorKegiatanData]
    newData[index] = { ...newData[index], [field]: value }
    setHonorKegiatanData(newData)
  }

  const applyBatchHonor = () => {
    if (!batchHonorNominal) {
      toast({ variant: "destructive", title: "Nominal Kosong", description: "Masukkan nominal honor terlebih dahulu." })
      return
    }
    setHonorKegiatanData(prev => prev.map(item => ({
      ...item,
      nominal: batchHonorNominal,
      tax: batchHonorTax
    })))
    toast({ title: "Berhasil", description: `Nominal Rp ${parseInt(batchHonorNominal || "0").toLocaleString('id-ID')} & Pajak ${batchHonorTax}% diterapkan ke semua penerima.` })
  }

  const handleNotaItemChange = (index: number, field: keyof TransactionItem, value: any) => {
    setNotaItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };
      if (field === "banyaknya" || field === "hargaSatuan") {
        const qty = parseFloat(String(field === "banyaknya" ? value : current.banyaknya)) || 0;
        const price = parseFloat(String(field === "hargaSatuan" ? value : current.hargaSatuan).replace(/\D/g, "")) || 0;
        current.jumlah = qty * price;
      }
      updated[index] = current;
      return updated;
    });
  };

  const addNotaItem = () => {
    setNotaItems((prev) => [
      ...prev,
      { jenisBarang: "", banyaknya: 1, satuan: "Pcs", hargaSatuan: "", jumlah: "" },
    ]);
  };

  const removeNotaItem = (index: number) => {
    setNotaItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleStrukItemChange = (index: number, field: keyof TransactionItem, value: any) => {
    setStrukItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };
      if (field === "banyaknya" || field === "hargaSatuan") {
        const qty = parseFloat(String(field === "banyaknya" ? value : current.banyaknya)) || 0;
        const price = parseFloat(String(field === "hargaSatuan" ? value : current.hargaSatuan).replace(/\D/g, "")) || 0;
        current.jumlah = qty * price;
      }
      updated[index] = current;
      return updated;
    });
  };

  const addStrukItem = () => {
    setStrukItems((prev) => [
      ...prev,
      { jenisBarang: "", banyaknya: 1, satuan: "Pcs", hargaSatuan: "", jumlah: "" },
    ]);
  };

  const removeStrukItem = (index: number) => {
    setStrukItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const setCurrentTimeForStruk = () => {
    const now = new Date();
    setStrukJam(String(now.getHours()).padStart(2, "0"));
    setStrukMenit(String(now.getMinutes()).padStart(2, "0"));
    setStrukDetik(String(now.getSeconds()).padStart(2, "0"));
    toast({ title: "Waktu Disetel", description: "Jam, menit, detik telah diisi dengan waktu saat ini." });
  };

  if (!mounted) return null

  if (!current) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#081d27] p-4 md:p-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[2rem] bg-white dark:bg-[#081d27] shadow-md border border-white/80">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] transition-all" asChild>
                <Link href="/manajemen/dashboard">
                  <ArrowLeft className="h-5 w-5 text-slate-800" />
                </Link>
              </Button>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#081d27] text-emerald-800 shadow-inner border border-stone-300/50 text-[10px] font-black uppercase tracking-wider mb-1">
                  <Database className="h-3.5 w-3.5 text-emerald-700" />
                  Arsip & Format Cetak
                </div>
                <h1 className="text-2xl sm:text-3xl font-condensed font-black uppercase tracking-tight text-slate-900">
                  Pusat Dokumen Penunjang
                </h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Generator Berkas Administrasi & SPJ Pemerintah Desa Sampeldes
                </p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-2">
            {Object.entries(configs).map(([key, item]) => (
              <Link key={key} href={`/manajemen/dokumen-penunjang/?type=${key}`}>
                <Card className="rounded-[2rem] bg-white dark:bg-[#081d27] shadow-md hover:shadow-xl border border-white/80 overflow-hidden transition-all duration-300 cursor-pointer group active:scale-[0.98] h-full flex flex-col">
                  <CardHeader className="bg-[#e4e0d9]/60 p-5 md:p-6 flex flex-col items-center text-center sm:items-start sm:text-left border-b border-stone-300/60">
                    <div className="h-12 w-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                      <item.icon className="h-6 w-6 text-emerald-800" />
                    </div>
                    <CardTitle className="text-sm md:text-base font-condensed font-black uppercase tracking-tight leading-snug line-clamp-2 text-slate-900">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-5 flex-1 flex flex-col justify-between gap-3">
                    <p className="text-[11px] md:text-xs text-slate-600 font-bold leading-relaxed line-clamp-2 hidden sm:block">{item.desc}</p>
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-700 tracking-wider group-hover:text-emerald-900 transition-all pt-2.5 border-t border-stone-300/50">
                      <span>Pilih Berkas</span>
                      <span className="p-1.5 rounded-lg bg-white dark:bg-[#081d27] shadow-xs border border-white/80 group-hover:bg-emerald-800 group-hover:text-white transition-all">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#081d27] p-4 md:p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between gap-4 p-6 rounded-[2rem] bg-white dark:bg-[#081d27] shadow-md border border-white/80">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild className="h-10 w-10 rounded-xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] transition-all">
              <Link href="/manajemen/dokumen-penunjang/">
                <ArrowLeft className="h-5 w-5 text-slate-800" />
              </Link>
            </Button>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#081d27] text-emerald-800 shadow-inner border border-stone-300/50 text-[10px] font-black uppercase tracking-wider mb-1">
                <current.icon className="h-3.5 w-3.5 text-emerald-700" />
                Formulir Generator
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                {current.title}
              </h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{current.desc}</p>
            </div>
          </div>
        </header>

        <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 overflow-hidden mb-20">
          <CardHeader className="p-6 sm:p-8 bg-[#e4e0d9]/60 border-b border-stone-300/60">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center">
                <current.icon className="h-7 w-7 text-emerald-800" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-black uppercase text-slate-900 leading-none mb-1.5">{current.title}</CardTitle>
                <CardDescription className="text-xs font-bold text-slate-600">{current.desc}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-8">

            {type === "insentif" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Pilih Kelompok Penerima</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {["RT/RW", "KADER POSYANDU", "GURU PAUD", "KADER KPM", "HONORARIUM LINMAS"].map((cat) => (
                      <Button
                        key={cat}
                        type="button"
                        onClick={() => setInsentifCat(cat)}
                        className={cn(
                          "h-14 rounded-2xl font-black text-[10px] uppercase transition-all border-2",
                          insentifCat === cat
                            ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200"
                            : "bg-white border-muted text-purple-900 hover:bg-purple-50 hover:border-purple-200"
                        )}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Insentif Bulan</Label>
                    <Select value={insentifMonth} onValueChange={setInsentifMonth}>
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-none px-5 text-base font-bold">
                        <SelectValue placeholder="Pilih Bulan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map(m => (
                          <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Tgl Penyaluran</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-600/50" />
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-14 pl-12 rounded-2xl bg-muted/20 border-none font-bold text-base"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-purple-50/50 rounded-[2.5rem] border border-purple-100 shadow-inner grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-purple-900 tracking-widest ml-1">Nominal Insentif (RP)</Label>
                    <div className="relative">
                      <Coins className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-600" />
                      <Input
                        type="number"
                        placeholder="0"
                        value={insentifNominal}
                        onChange={(e) => setInsentifNominal(e.target.value)}
                        className="h-14 pl-12 rounded-2xl bg-white border-none font-black text-purple-900 text-lg shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-purple-900 tracking-widest ml-1">Pot Pajak (%)</Label>
                    <div className="relative">
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-600" />
                      <Input
                        type="number"
                        placeholder="0"
                        value={insentifTax}
                        onChange={(e) => setInsentifTax(e.target.value)}
                        className="h-14 pl-12 rounded-2xl bg-white border-none font-black text-purple-900 text-lg shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {type === "siltap" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Pilih Jenis Pembayaran</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      type="button"
                      onClick={() => setSiltapSubType("perangkat")}
                      className={cn(
                        "h-16 rounded-2xl font-black text-xs uppercase gap-3 transition-all",
                        siltapSubType === "perangkat" ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200" : "bg-muted/30 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 border-2 border-transparent"
                      )}
                    >
                      <Users className="h-5 w-5" /> SILTAP PERANGKAT
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setSiltapSubType("bpd")}
                      className={cn(
                        "h-16 rounded-2xl font-black text-xs uppercase gap-3 transition-all",
                        siltapSubType === "bpd" ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200" : "bg-muted/30 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 border-2 border-transparent"
                      )}
                    >
                      <ShieldCheck className="h-5 w-5" /> INSENTIF BPD
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Pilih Bulan / Tunjangan</Label>
                    <Select value={insentifMonth} onValueChange={setInsentifMonth}>
                      <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-none px-5 text-base font-bold">
                        <SelectValue placeholder="Pilih Bulan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map(m => (
                          <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Tgl Cetak</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-14 pl-12 rounded-2xl bg-muted/20 border-none font-bold text-base"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {type === "daftar-hadir-posyandu" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <Tabs value={posyanduSubType} onValueChange={(v: any) => setPosyanduSubType(v)} className="w-full">
                  <TabsList className="grid grid-cols-2 w-full h-12 mb-6 bg-rose-50 p-1 rounded-xl">
                    <TabsTrigger value="kader" className="gap-2 text-[10px] font-black uppercase rounded-lg data-[state=active]:bg-rose-600 data-[state=active]:text-white">
                      <UserCheck className="h-4 w-4" />
                      Daftar Kader
                    </TabsTrigger>
                    <TabsTrigger value="peserta" className="gap-2 text-[10px] font-black uppercase rounded-lg data-[state=active]:bg-rose-600 data-[state=active]:text-white">
                      <Baby className="h-4 w-4" />
                      Daftar Peserta Posyandu
                    </TabsTrigger>
                  </TabsList>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-rose-600 tracking-widest ml-1">Judul Kegiatan</Label>
                      <Input
                        placeholder="Contoh: Posyandu Balita & Lansia"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        className="h-14 rounded-2xl bg-rose-50/50 border-rose-100 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-rose-600 tracking-widest ml-1">Pilih Kelompok Posyandu</Label>
                      <Select value={selectedLestari} onValueChange={setSelectedLestari}>
                        <SelectTrigger className="h-14 rounded-2xl bg-rose-50 border-rose-100 font-black">
                          <SelectValue placeholder="Pilih Posyandu..." />
                        </SelectTrigger>
                        <SelectContent>
                          {LestariGroups.map(group => (
                            <SelectItem key={group} value={group} className="font-bold">{group}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {posyanduSubType === "peserta" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-1">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-rose-600 tracking-widest ml-1">Pilih Jenis Peserta</Label>
                          <Select value={selectedHealthCategory} onValueChange={setSelectedHealthCategory}>
                            <SelectTrigger className="h-14 rounded-2xl bg-rose-50 border-rose-100 font-bold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {HEALTH_CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-rose-600 tracking-widest ml-1">Minimal Baris (Jika Data Sedikit)</Label>
                          <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-rose-600/50" />
                            <Input
                              type="number"
                              value={jumlahKuotaPeserta}
                              onChange={(e) => setJumlahKuotaPeserta(parseInt(e.target.value) || 0)}
                              className="h-14 pl-12 rounded-2xl bg-rose-50/30 border-rose-100 font-black text-rose-900"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-rose-600 tracking-widest ml-1">Tanggal</Label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-rose-600 tracking-widest ml-1">Waktu</Label>
                        <Input value={time} onChange={e => setTime(e.target.value)} placeholder="09:00 WIB" className="h-12 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-rose-600 tracking-widest ml-1">Lokasi (Manual)</Label>
                      <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Contoh: Rumah Ibu RW 01" className="h-12 rounded-xl" />
                    </div>
                  </div>
                </Tabs>
              </div>
            )}

            {type === "bukti-transaksi" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                {/* TAB SELECTOR DENGAN SOLID ORANGE BUTTONS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full p-1.5 rounded-2xl bg-orange-50/70 border border-orange-200">
                  <button
                    type="button"
                    onClick={() => setBuktiTab("nota-faktur")}
                    className={cn(
                      "flex items-center justify-center gap-2.5 h-13 py-3 px-4 rounded-xl text-xs font-black uppercase transition-all cursor-pointer",
                      buktiTab === "nota-faktur"
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-500/20"
                        : "bg-white text-slate-700 hover:bg-orange-100/60 hover:text-orange-950 border border-orange-200/80"
                    )}
                  >
                    <Store className={cn("h-4 w-4", buktiTab === "nota-faktur" ? "text-white" : "text-orange-600")} />
                    1. Nota &amp; Faktur Pengiriman
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuktiTab("struk-belanja")}
                    className={cn(
                      "flex items-center justify-center gap-2.5 h-13 py-3 px-4 rounded-xl text-xs font-black uppercase transition-all cursor-pointer",
                      buktiTab === "struk-belanja"
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-500/20"
                        : "bg-white text-slate-700 hover:bg-orange-100/60 hover:text-orange-950 border border-orange-200/80"
                    )}
                  >
                    <ReceiptText className={cn("h-4 w-4", buktiTab === "struk-belanja" ? "text-white" : "text-orange-600")} />
                    2. Struk Belanja Kasir
                  </button>
                </div>

                {/* TAB 1: NOTA & FAKTUR PENGIRIMAN */}
                {buktiTab === "nota-faktur" && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-2">
                    {/* Identitas Toko & Perangkat */}
                    <div className="p-6 rounded-3xl bg-orange-50/40 border border-orange-200/80 space-y-5">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-orange-600" />
                        <h3 className="text-xs font-black uppercase text-orange-950 tracking-wider">
                          Identitas Toko &amp; Penerima Barang
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Tanggal Transaksi / Pesanan</Label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-600" />
                            <Input
                              type="date"
                              value={notaDate}
                              onChange={(e) => setNotaDate(e.target.value)}
                              className="h-12 pl-12 rounded-xl bg-white border-orange-200 font-bold"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Perangkat / Pemesan Barang</Label>
                            {dbOfficials && dbOfficials.length > 0 && (
                              <Select
                                onValueChange={(val) => {
                                  const off = dbOfficials.find(o => o.name === val);
                                  if (off) {
                                    setNotaPerangkatNama(off.name);
                                    setNotaPerangkatJabatan(off.jabatan || off.category);
                                  }
                                }}
                              >
                                <SelectTrigger className="h-6 text-[9px] font-bold border-orange-200 text-orange-700 bg-white w-auto px-2 rounded-lg">
                                  <SelectValue placeholder="Pilih Personil" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(dbOfficials || []).map((o, oIdx) => (
                                    <SelectItem key={oIdx} value={o.name} className="text-xs font-medium">
                                      {o.name} ({o.jabatan || o.category})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <Input
                            placeholder="Contoh: TEDY TRISNANTO"
                            value={notaPerangkatNama}
                            onChange={(e) => setNotaPerangkatNama(e.target.value)}
                            className="h-12 rounded-xl bg-white border-orange-200 font-bold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Penerima Faktur (Kepala Desa)</Label>
                            {dbOfficials && dbOfficials.length > 0 && (
                              <Select
                                onValueChange={(val) => setNotaKepalaDesa(val)}
                              >
                                <SelectTrigger className="h-6 text-[9px] font-bold border-orange-200 text-orange-700 bg-white w-auto px-2 rounded-lg">
                                  <SelectValue placeholder="Pilih Kades" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(dbOfficials || []).map((o, oIdx) => (
                                    <SelectItem key={oIdx} value={o.name} className="text-xs font-medium">
                                      {o.name} ({o.jabatan || o.category})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <Input
                            placeholder="Contoh: AF. MAHFUR"
                            value={notaKepalaDesa}
                            onChange={(e) => setNotaKepalaDesa(e.target.value)}
                            className="h-12 rounded-xl bg-white border-orange-200 font-bold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Nama Pemilik Toko / Pengirim</Label>
                          <Input
                            placeholder="Contoh: DEDI"
                            value={notaNamaPemilik}
                            onChange={(e) => setNotaNamaPemilik(e.target.value)}
                            className="h-12 rounded-xl bg-white border-orange-200 font-bold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Nama Toko / Usaha</Label>
                          <Input
                            placeholder="Contoh: NAYA"
                            value={notaNamaToko}
                            onChange={(e) => setNotaNamaToko(e.target.value)}
                            className="h-12 rounded-xl bg-white border-orange-200 font-bold text-orange-950"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Desa / Lokasi Toko (Di-)</Label>
                          <Input
                            placeholder="Contoh: SAMPELDES"
                            value={notaAlamatToko}
                            onChange={(e) => setNotaAlamatToko(e.target.value)}
                            className="h-12 rounded-xl bg-white border-orange-200 font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Daftar Barang Nota */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase text-orange-950 tracking-widest ml-1 flex items-center gap-1.5">
                          <ShoppingBag className="h-3.5 w-3.5 text-orange-600" />
                          Rincian Barang Belanja ({notaItems.length} Item)
                        </Label>
                        <Button
                          type="button"
                          onClick={addNotaItem}
                          variant="outline"
                          size="sm"
                          className="h-9 gap-1.5 rounded-xl border-orange-200 bg-white text-orange-950 hover:bg-orange-50 hover:text-orange-900 text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 text-orange-600" />
                          <span className="text-orange-950 font-bold">Tambah Barang</span>
                        </Button>
                      </div>

                      {/* Tabel Rincian Barang 1 Baris */}
                      <div className="rounded-2xl border border-orange-200/90 bg-white overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-orange-100/70 border-b border-orange-200 text-[10px] font-black uppercase text-orange-950 tracking-wider">
                                <th className="py-3 px-2 text-center w-12">No</th>
                                <th className="py-3 px-3">Jenis / Nama Barang</th>
                                <th className="py-3 px-2 text-center w-24">Banyaknya</th>
                                <th className="py-3 px-2 text-center w-28">Satuan</th>
                                <th className="py-3 px-3 text-right w-36">Harga Satuan (Rp)</th>
                                <th className="py-3 px-3 text-right w-36">Subtotal</th>
                                <th className="py-3 px-2 text-center w-14">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-orange-100">
                              {notaItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-orange-50/40 transition-colors">
                                  {/* 1. No */}
                                  <td className="py-2.5 px-2 text-center">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 text-xs font-black text-orange-950">
                                      {idx + 1}
                                    </span>
                                  </td>

                                  {/* 2. Jenis / Nama Barang */}
                                  <td className="py-2.5 px-3">
                                    <Input
                                      placeholder="Contoh: Foto Copy Undangan dan Materi"
                                      value={item.jenisBarang}
                                      onChange={(e) => handleNotaItemChange(idx, "jenisBarang", e.target.value)}
                                      className="h-10 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 font-bold text-xs md:text-sm text-slate-800 w-full"
                                    />
                                  </td>

                                  {/* 3. Banyaknya */}
                                  <td className="py-2.5 px-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      placeholder="1"
                                      value={item.banyaknya}
                                      onChange={(e) => handleNotaItemChange(idx, "banyaknya", e.target.value)}
                                      className="h-10 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 font-bold text-center text-xs md:text-sm text-slate-800 w-full"
                                    />
                                  </td>

                                  {/* 4. Satuan */}
                                  <td className="py-2.5 px-2">
                                    <Input
                                      placeholder="buah / Rim"
                                      value={item.satuan}
                                      onChange={(e) => handleNotaItemChange(idx, "satuan", e.target.value)}
                                      className="h-10 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 font-medium text-center text-xs md:text-sm text-slate-800 w-full"
                                    />
                                  </td>

                                  {/* 5. Harga Satuan */}
                                  <td className="py-2.5 px-3">
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={item.hargaSatuan}
                                      onChange={(e) => handleNotaItemChange(idx, "hargaSatuan", e.target.value)}
                                      className="h-10 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 font-bold text-right text-xs md:text-sm text-orange-950 w-full"
                                    />
                                  </td>

                                  {/* 6. Subtotal */}
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <span className="font-black text-xs text-orange-800 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-200/80 block text-right">
                                      Rp {(Number(item.jumlah) || 0).toLocaleString("id-ID")}
                                    </span>
                                  </td>

                                  {/* 7. Aksi */}
                                  <td className="py-2.5 px-2 text-center">
                                    {notaItems.length > 1 ? (
                                      <Button
                                        type="button"
                                        onClick={() => removeNotaItem(idx)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg cursor-pointer"
                                        title="Hapus baris"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      <span className="text-muted-foreground/30 text-xs">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Total Baris Nota */}
                      <div className="p-5 rounded-2xl bg-orange-500 text-white flex items-center justify-between shadow-lg shadow-orange-500/20">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-wider opacity-90">Total Nota &amp; Faktur</p>
                          <p className="text-xl font-black">
                            Rp {notaItems.reduce((acc, it) => acc + (Number(it.jumlah) || 0), 0).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={addNotaItem}
                          variant="outline"
                          className="rounded-xl font-black text-xs gap-1.5 h-10 bg-white text-orange-950 border border-orange-200 hover:bg-orange-50 hover:text-orange-900 shadow-sm cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 text-orange-600" />
                          <span className="text-orange-950 font-black">Tambah Barang</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: STRUK BELANJA KASIR */}
                {buktiTab === "struk-belanja" && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-2">
                    {/* PENGATURAN SKEMA: JENIS DOKUMEN, UKURAN KERTAS & UPLOAD LOGO TOKO */}
                    <div className="p-6 rounded-3xl bg-white border border-orange-200/90 shadow-xs space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-100 pb-3">
                        <div className="flex items-center gap-2">
                          <ReceiptText className="h-4 w-4 text-orange-600" />
                          <h3 className="text-xs font-black uppercase text-orange-950 tracking-wider">
                            Format Dokumen Transaksi, Ukuran Kertas &amp; Logo Toko
                          </h3>
                        </div>
                        <span className="text-[10px] font-bold text-orange-800 bg-orange-100/70 px-3 py-1 rounded-full w-fit">
                          Format Aktif: {strukJenisDokumen.toUpperCase()} ({strukUkuranKertas})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* 1. Pilihan Jenis Dokumen (Struk, Invoice, Nota) */}
                        <div className="lg:col-span-5 space-y-2">
                          <Label className="text-[10px] font-black uppercase text-orange-950 tracking-wider flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-orange-600" />
                            1. Jenis Dokumen Transaksi
                          </Label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "struk", name: "Struk", sub: "Thermal POS", icon: "🧾" },
                              { id: "invoice", name: "Invoice", sub: "Format A4 Resmi", icon: "📑" },
                              { id: "nota", name: "Nota", sub: "Pecahan Folio", icon: "📝" },
                            ].map((docType) => {
                              const isSelected = strukJenisDokumen === docType.id;
                              return (
                                <button
                                  key={docType.id}
                                  type="button"
                                  onClick={() => {
                                    setStrukJenisDokumen(docType.id as JenisDokumenTransaksi);
                                    if (docType.id === "struk") setStrukUkuranKertas("80mm");
                                    else if (docType.id === "invoice") setStrukUkuranKertas("A4");
                                    else if (docType.id === "nota") setStrukUkuranKertas("1/4_folio");
                                  }}
                                  className={cn(
                                    "p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1",
                                    isSelected
                                      ? "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/20 scale-[1.02]"
                                      : "bg-slate-50 hover:bg-orange-50/50 border-slate-200 text-slate-800 hover:border-orange-300"
                                  )}
                                >
                                  <span className="text-xl">{docType.icon}</span>
                                  <span className="text-xs font-black tracking-wide">{docType.name}</span>
                                  <span className={cn("text-[9px] font-semibold", isSelected ? "text-orange-100" : "text-muted-foreground")}>
                                    {docType.sub}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Pilihan Ukuran Kertas Sesuai Jenis Dokumen */}
                        <div className="lg:col-span-7 space-y-2">
                          <Label className="text-[10px] font-black uppercase text-orange-950 tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Store className="h-3.5 w-3.5 text-orange-600" />
                              2. Pilihan Ukuran Kertas ({strukJenisDokumen.toUpperCase()})
                            </span>
                            <span className="text-[9px] text-muted-foreground lowercase font-medium">
                              {strukJenisDokumen === "struk" && "pilihan lebar kertas thermal"}
                              {strukJenisDokumen === "invoice" && "standar dokumen tagihan resmi"}
                              {strukJenisDokumen === "nota" && "pilihan pecahan kertas folio (F4)"}
                            </span>
                          </Label>

                          {/* OPSI UKURAN STRUK */}
                          {strukJenisDokumen === "struk" && (
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: "58mm", name: "58 mm", desc: "Mini Portable / Bluetooth" },
                                { id: "80mm", name: "80 mm", desc: "Standar Kasir Supermarket" },
                                { id: "76mm", name: "76 mm", desc: "Dot-Matrix Kasir / Pita" },
                              ].map((sz) => {
                                const isSelected = strukUkuranKertas === sz.id;
                                return (
                                  <button
                                    key={sz.id}
                                    type="button"
                                    onClick={() => setStrukUkuranKertas(sz.id)}
                                    className={cn(
                                      "p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center",
                                      isSelected
                                        ? "bg-orange-50 border-orange-500 ring-2 ring-orange-500/20 text-orange-950 font-black shadow-xs"
                                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 text-xs font-bold"
                                    )}
                                  >
                                    <span className="text-xs font-black">{sz.name}</span>
                                    <span className="text-[9px] text-muted-foreground">{sz.desc}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* OPSI UKURAN INVOICE */}
                          {strukJenisDokumen === "invoice" && (
                            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                              <div className="space-y-0.5">
                                <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                                  <Check className="h-4 w-4 text-blue-600" /> Format Otomatis Ukuran A4 (210 x 297 mm)
                                </span>
                                <p className="text-[10px] text-blue-800/80">
                                  Standar baku faktur penagihan resmi rekanan / toko kepada Pemerintah Desa.
                                </p>
                              </div>
                              <span className="px-3 py-1 rounded-xl bg-blue-600 text-white text-[11px] font-black">
                                A4
                              </span>
                            </div>
                          )}

                          {/* OPSI UKURAN NOTA */}
                          {strukJenisDokumen === "nota" && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { id: "1/2_folio", name: "1/2 Folio", dim: "16,5 x 21,5 cm", note: "Nota Besar" },
                                { id: "1/3_folio", name: "1/3 Folio", dim: "11,0 x 21,5 cm", note: "Nota Panjang" },
                                { id: "1/4_folio", name: "1/4 Folio", dim: "10,7 x 16,5 cm", note: "Buku Standar" },
                                { id: "1/6_folio", name: "1/6 Folio", dim: "10,7 x 11,0 cm", note: "Nota Ringkas" },
                              ].map((sz) => {
                                const isSelected = strukUkuranKertas === sz.id;
                                return (
                                  <button
                                    key={sz.id}
                                    type="button"
                                    onClick={() => setStrukUkuranKertas(sz.id)}
                                    className={cn(
                                      "p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5",
                                      isSelected
                                        ? "bg-orange-50 border-orange-500 ring-2 ring-orange-500/20 text-orange-950 font-black shadow-xs"
                                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                    )}
                                  >
                                    <span className="text-xs font-black">{sz.name}</span>
                                    <span className="text-[9px] font-semibold text-orange-700">{sz.dim}</span>
                                    <span className="text-[8px] text-muted-foreground">{sz.note}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. PILIH FONT (10 FONT PALING UMUM HASIL CETAK STRUK, INVOICE & NOTA) */}
                      <div className="space-y-2.5 pt-2 border-t border-orange-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Type className="h-3.5 w-3.5 text-orange-600" />
                            <span>Pilih Font (10 Font Paling Umum untuk Hasil Cetak)</span>
                          </Label>
                          <span className="text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 self-start sm:self-auto">
                            Aktif: <strong className="font-black text-orange-950">{STRUK_FONTS.find(f => f.id === strukFont)?.name || "Courier New"}</strong>
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Pilih tipografi hasil cetak dokumen transaksi. Setiap font dirancang khusus untuk keterbacaan printer struk kasir, faktur invoice, maupun nota rangkap.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {STRUK_FONTS.map((font) => {
                            const isSelected = strukFont === font.id;
                            return (
                              <button
                                key={font.id}
                                type="button"
                                onClick={() => setStrukFont(font.id)}
                                className={cn(
                                  "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group",
                                  isSelected
                                    ? "bg-orange-50/90 border-orange-500 ring-2 ring-orange-500/20 text-orange-950 shadow-xs"
                                    : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700"
                                )}
                              >
                                <div className="space-y-1 w-full">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[11px] font-black truncate">{font.name}</span>
                                    {isSelected && (
                                      <span className="h-4 w-4 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                                        <Check className="h-2.5 w-2.5" />
                                      </span>
                                    )}
                                  </div>
                                  <span className="inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/80 border border-slate-200 text-slate-600">
                                    {font.category}
                                  </span>
                                </div>

                                <div className="my-1.5 p-1.5 rounded-lg bg-white border border-slate-200/80 text-center">
                                  <span
                                    className="text-[12px] font-bold block tracking-tight text-slate-900"
                                    style={{ fontFamily: font.family }}
                                  >
                                    {font.sample}
                                  </span>
                                  <span
                                    className="text-[9px] block text-slate-500 truncate"
                                    style={{ fontFamily: font.family }}
                                  >
                                    1234567890
                                  </span>
                                </div>

                                <div className="space-y-0.5">
                                  <p className="text-[9px] text-muted-foreground line-clamp-1 leading-tight">
                                    {font.desc}
                                  </p>
                                  <span className="text-[8px] font-semibold text-orange-700 block truncate">
                                    Cocok: {font.bestFor}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 4. UPLOAD LOGO TOKO / MERCHANT (OPSIONAL) */}
                      <div className="pt-2 border-t border-orange-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="flex items-center gap-3">
                            {strukLogoBase64 ? (
                              <div className="relative group w-12 h-12 rounded-xl border border-orange-300 bg-white p-1 flex items-center justify-center shadow-xs">
                                <img src={strukLogoBase64} alt="Logo Toko" className="max-w-full max-h-full object-contain rounded" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-900">Upload Logo Toko / Merchant (Opsional)</span>
                                {strukLogoBase64 && (
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Check className="h-2.5 w-2.5" /> Terpasang
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                Logo akan otomatis dicetak di kop dokumen Struk, Invoice, maupun Nota Kontan.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                              />
                              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-orange-50 border border-orange-200 text-orange-950 text-xs font-bold shadow-xs transition-colors">
                                <UploadCloud className="h-3.5 w-3.5 text-orange-600" />
                                <span>{strukLogoBase64 ? "Ganti Logo" : "Pilih Logo Toko"}</span>
                              </span>
                            </label>

                            {strukLogoBase64 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setStrukLogoBase64(null)}
                                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold"
                                title="Hapus Logo"
                              >
                                <X className="h-3.5 w-3.5 mr-1" /> Hapus
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PILIHAN MODEL TRANSAKSI & STRUK BELANJA (MODEL 1 S/D 13) */}
                    <div className="p-6 rounded-3xl bg-white border border-orange-200/90 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-orange-600" />
                          <h3 className="text-xs font-black uppercase text-orange-950 tracking-wider">
                            Pilihan Model Transaksi &amp; Struk Belanja (Model 1 s/d 13)
                          </h3>
                        </div>
                        <span className="text-[10px] font-bold text-orange-700 bg-orange-100/70 px-2.5 py-1 rounded-full w-fit">
                          Aktif: {STRUK_MODELS.find(m => m.id === strukModel)?.badge} - {STRUK_MODELS.find(m => m.id === strukModel)?.name}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Pilih format desain usaha sesuai peruntukan SPJ belanja desa. Form rincian toko &amp; waktu transaksi di bawah akan menyesuaikan kebutuhan model yang Anda pilih.
                      </p>

                      {/* Grid 12 Model Struk */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {STRUK_MODELS.map((m) => {
                          const isSelected = strukModel === m.id;
                          return (
                            <div
                              key={m.id}
                              onClick={() => applyModelPreset(m)}
                              className={cn(
                                "relative group p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2.5",
                                isSelected
                                  ? "bg-orange-50/90 border-orange-500 ring-2 ring-orange-500/20 shadow-sm"
                                  : "bg-slate-50/60 hover:bg-orange-50/40 border-slate-200 hover:border-orange-300"
                              )}
                            >
                              <div className="flex items-start justify-between">
                                <span className="text-2xl" role="img" aria-label={m.name}>
                                  {m.icon}
                                </span>
                                <span
                                  className={cn(
                                    "text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider",
                                    isSelected
                                      ? "bg-orange-600 text-white"
                                      : "bg-slate-200 text-slate-700 group-hover:bg-orange-200 group-hover:text-orange-950"
                                  )}
                                >
                                  {m.badge}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <h4 className="text-xs font-black text-slate-900 group-hover:text-orange-950 line-clamp-1">
                                  {m.name}
                                </h4>
                                <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                                  {m.desc}
                                </p>
                              </div>

                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  applyModelPreset(m);
                                }}
                                className={cn(
                                  "h-7 text-[9px] font-bold w-full rounded-lg px-1.5 transition-colors",
                                  isSelected
                                    ? "bg-orange-200/80 text-orange-950 hover:bg-orange-300"
                                    : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                                )}
                                title="Terapkan contoh nama & alamat toko untuk model ini"
                              >
                                <Sparkles className="h-2.5 w-2.5 mr-1 text-orange-600" />
                                <span>Pakai Contoh</span>
                              </Button>
                            </div>
                          );
                        })}
                      </div>

                      {/* RINCIAN TOKO & WAKTU TRANSAKSI (ADAPTIF MENYESUAIKAN JENIS DOKUMEN & MODEL) */}
                      {(() => {
                        const curModel = STRUK_MODELS.find((m) => m.id === strukModel) || STRUK_MODELS[0];
                        return (
                          <div className="mt-5 p-5 sm:p-6 rounded-3xl bg-orange-50/50 border border-orange-200/90 space-y-6 animate-in fade-in-50 duration-200">
                            {/* Header Rincian */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-200/60 pb-4">
                              <div className="flex items-center gap-3">
                                <span className="text-3xl" role="img" aria-label={curModel.name}>
                                  {curModel.icon}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-black uppercase text-orange-950 tracking-wider">
                                      Rincian Toko &amp; Waktu Transaksi
                                    </h4>
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-600 text-white">
                                      {curModel.badge}
                                    </span>
                                    {/* Badge Jenis Dokumen Transaksi Aktif */}
                                    <span
                                      className={cn(
                                        "text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border shadow-2xs",
                                        strukJenisDokumen === "struk"
                                          ? "bg-amber-100 text-amber-900 border-amber-300"
                                          : strukJenisDokumen === "invoice"
                                            ? "bg-blue-100 text-blue-900 border-blue-300"
                                            : "bg-emerald-100 text-emerald-900 border-emerald-300"
                                      )}
                                    >
                                      {strukJenisDokumen === "struk" && `🧾 Mode: Struk Kasir Thermal (${strukUkuranKertas})`}
                                      {strukJenisDokumen === "invoice" && "📄 Mode: Invoice Tagihan Resmi A4"}
                                      {strukJenisDokumen === "nota" && `📝 Mode: Nota Kontan (${strukUkuranKertas.replace("_", " ")})`}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-orange-900/80 font-medium">
                                    Model Aktif: <strong className="font-bold">{curModel.name}</strong> — {curModel.desc}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                  type="button"
                                  onClick={() => applyModelPreset(curModel)}
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-xl border-orange-200 bg-white text-orange-800 hover:bg-orange-100 text-[10px] font-bold shadow-2xs"
                                  title="Terapkan contoh nama & keterangan toko model ini"
                                >
                                  <Sparkles className="h-3 w-3 mr-1 text-orange-600" /> Terapkan Contoh Model
                                </Button>
                                {strukJenisDokumen === "struk" && (
                                  <Button
                                    type="button"
                                    onClick={setCurrentTimeForStruk}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-xl border-orange-200 bg-white text-orange-700 hover:bg-orange-100 text-[10px] font-bold shadow-2xs"
                                  >
                                    <Clock className="h-3 w-3 mr-1 text-orange-600" /> Waktu Sekarang
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* 1. IDENTITAS KOP TOKO / PENYEDIA JASA (DAPAT DISETTING MANUAL 100%) */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-orange-950 tracking-wider flex items-center gap-1.5">
                                  <Store className="h-3.5 w-3.5 text-orange-600" />
                                  1. Identitas Toko / Merchant / Rekanan (Manual Setting)
                                </span>
                                <span className="text-[9px] text-muted-foreground font-medium">
                                  Semua kolom dapat Anda sesuaikan bebas
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {/* Nama Toko */}
                                <div className="space-y-1.5 sm:col-span-2">
                                  <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                    {strukModel === "spbu"
                                      ? "Nama / Nomor Unit SPBU Pertamina"
                                      : strukModel === "tratag_sound"
                                        ? "Nama Persewaan Tratag & Sound"
                                        : strukModel === "percetakan"
                                          ? "Nama Usaha Percetakan / Digital Printing"
                                          : strukModel === "mebeler"
                                            ? "Nama Toko / Pengrajin Mebel"
                                            : "Nama Toko / Minimarket / Badan Usaha"}
                                  </Label>
                                  <Input
                                    placeholder={curModel.defaultToko}
                                    value={strukNamaToko}
                                    onChange={(e) => setStrukNamaToko(e.target.value)}
                                    className="h-10 rounded-xl bg-white border-orange-200 font-bold text-orange-950 text-xs"
                                  />
                                </div>

                                {/* Sub Header Toko / Bidang Usaha */}
                                <div className="space-y-1.5 sm:col-span-2">
                                  <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                    Sub-Header / Bidang Usaha Toko (Di Bawah Nama Toko)
                                  </Label>
                                  <Input
                                    placeholder={curModel.defaultSubHeader || "Contoh: JASA DIGITAL PRINTING & OFFSET DESA"}
                                    value={strukSubHeader}
                                    onChange={(e) => setStrukSubHeader(e.target.value)}
                                    className="h-10 rounded-xl bg-white border-orange-200 font-semibold text-slate-800 text-xs"
                                  />
                                </div>

                                {/* Alamat Toko */}
                                <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                                  <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                    Alamat Lengkap Toko / Lokasi Usaha
                                  </Label>
                                  <Input
                                    placeholder={curModel.defaultAlamat}
                                    value={strukAlamatToko}
                                    onChange={(e) => setStrukAlamatToko(e.target.value)}
                                    className="h-10 rounded-xl bg-white border-orange-200 font-medium text-xs"
                                  />
                                </div>

                                {/* No Telp Toko */}
                                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                                  <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                    No. Telepon / HP Toko (Opsional)
                                  </Label>
                                  <Input
                                    placeholder="Contoh: 0812-3456-7890"
                                    value={strukNoTelp}
                                    onChange={(e) => setStrukNoTelp(e.target.value)}
                                    className="h-10 rounded-xl bg-white border-orange-200 font-medium text-xs"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 2. RINCIAN DOKUMEN & WAKTU (ADAPTIF MENYESUAIKAN 1. JENIS DOKUMEN TRANSAKSI) */}
                            <div className="pt-3 border-t border-orange-200/80 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-orange-950 tracking-wider flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-orange-600" />
                                  2. Rincian Penomoran &amp; Waktu Transaksi (Mode: {strukJenisDokumen.toUpperCase()})
                                </span>
                                <span className="text-[9px] text-muted-foreground font-medium">
                                  Tampilan otomatis menyesuaikan jenis dokumen yang dipilih
                                </span>
                              </div>

                              {/* KONDISI A: MODE STRUK THERMAL */}
                              {strukJenisDokumen === "struk" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white/70 p-3.5 rounded-2xl border border-orange-100">
                                  {/* Tanggal Transaksi */}
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                      Tanggal Pembelian Struk
                                    </Label>
                                    <Input
                                      type="date"
                                      value={strukDate}
                                      onChange={(e) => setStrukDate(e.target.value)}
                                      className="h-10 rounded-xl bg-white border-orange-200 font-bold text-xs"
                                    />
                                  </div>

                                  {/* Jam Menit Detik */}
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                      Waktu (Jam : Menit : Detik)
                                    </Label>
                                    <div className="grid grid-cols-3 gap-1">
                                      <Input
                                        placeholder="Jam"
                                        value={strukJam}
                                        onChange={(e) => setStrukJam(e.target.value)}
                                        className="h-10 rounded-xl bg-white border-orange-200 text-center font-bold text-xs"
                                      />
                                      <Input
                                        placeholder="Mnt"
                                        value={strukMenit}
                                        onChange={(e) => setStrukMenit(e.target.value)}
                                        className="h-10 rounded-xl bg-white border-orange-200 text-center font-bold text-xs"
                                      />
                                      <Input
                                        placeholder="Dtk"
                                        value={strukDetik}
                                        onChange={(e) => setStrukDetik(e.target.value)}
                                        className="h-10 rounded-xl bg-white border-orange-200 text-center font-bold text-xs"
                                      />
                                    </div>
                                  </div>

                                  {/* Kasir / Operator */}
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                      Nama Kasir / Operator Struk
                                    </Label>
                                    <Input
                                      placeholder="KASIR 01"
                                      value={strukKasir}
                                      onChange={(e) => setStrukKasir(e.target.value)}
                                      className="h-10 rounded-xl bg-white border-orange-200 font-medium text-xs"
                                    />
                                  </div>

                                  {/* No. Ref / Struk */}
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                      No. Struk / Transaksi (Opsional)
                                    </Label>
                                    <Input
                                      placeholder="Otomatis jika kosong"
                                      value={strukNoRef}
                                      onChange={(e) => setStrukNoRef(e.target.value)}
                                      className="h-10 rounded-xl bg-white border-orange-200 font-medium text-xs"
                                    />
                                  </div>

                                  {/* Baris Keterangan Khusus Struk (Manual) */}
                                  <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                      Label Keterangan Struk
                                    </Label>
                                    <Input
                                      placeholder="Contoh: Kirim Ke / Pesanan / No. Kendaraan"
                                      value={strukLabelKhusus}
                                      onChange={(e) => setStrukLabelKhusus(e.target.value)}
                                      className="h-10 rounded-xl bg-white border-orange-200 font-medium text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                      Isi Keterangan Struk (Dicetak jika diisi)
                                    </Label>
                                    <Input
                                      placeholder="Contoh: Balai Desa Sampeldes / Randis Desa"
                                      value={strukKeteranganKhusus}
                                      onChange={(e) => setStrukKeteranganKhusus(e.target.value)}
                                      className="h-10 rounded-xl bg-white border-orange-200 font-medium text-xs"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* KONDISI B: MODE INVOICE RESMI A4 */}
                              {strukJenisDokumen === "invoice" && (
                                <div className="space-y-3 bg-white/70 p-3.5 rounded-2xl border border-blue-100">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {/* Tanggal Invoice */}
                                    <div className="space-y-1.5">
                                      <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                        Tanggal Faktur / Invoice
                                      </Label>
                                      <Input
                                        type="date"
                                        value={strukDate}
                                        onChange={(e) => setStrukDate(e.target.value)}
                                        className="h-10 rounded-xl bg-white border-blue-200 font-bold text-xs"
                                      />
                                    </div>

                                    {/* Nomor Invoice */}
                                    <div className="space-y-1.5">
                                      <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                        Nomor Invoice / Faktur
                                      </Label>
                                      <Input
                                        placeholder="Contoh: INV/2026/05/BLS-001"
                                        value={strukNoRef}
                                        onChange={(e) => setStrukNoRef(e.target.value)}
                                        className="h-10 rounded-xl bg-white border-blue-200 font-bold text-blue-950 text-xs"
                                      />
                                    </div>

                                    {/* Status Pembayaran Invoice */}
                                    <div className="space-y-1.5">
                                      <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                        Status Pembayaran Invoice
                                      </Label>
                                      <Input
                                        placeholder="Contoh: LUNAS / TUNAI"
                                        value={strukStatusBayar}
                                        onChange={(e) => setStrukStatusBayar(e.target.value)}
                                        className="h-10 rounded-xl bg-white border-blue-200 font-bold text-emerald-800 text-xs"
                                      />
                                    </div>

                                    {/* Penanggung Jawab Toko / Hormat Kami */}
                                    <div className="space-y-1.5">
                                      <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                        Penanggung Jawab Toko (Ttd)
                                      </Label>
                                      <Input
                                        placeholder="Nama Pimpinan / Kasir Toko"
                                        value={strukKasir}
                                        onChange={(e) => setStrukKasir(e.target.value)}
                                        className="h-10 rounded-xl bg-white border-blue-200 font-medium text-xs"
                                      />
                                    </div>

                                    {/* Billed To / Nama Pembeli */}
                                    <div className="space-y-1.5 sm:col-span-2">
                                      <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                        Tagihan Kepada (Billed To / Pembeli)
                                      </Label>
                                      <Input
                                        placeholder="PEMERINTAH DESA SAMPELDES"
                                        value={strukPembeliNama}
                                        onChange={(e) => setStrukPembeliNama(e.target.value)}
                                        className="h-10 rounded-xl bg-white border-blue-200 font-bold text-xs"
                                      />
                                    </div>

                                    {/* Alamat Pembeli */}
                                    <div className="space-y-1.5 sm:col-span-2">
                                      <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                        Alamat Instansi Pembeli
                                      </Label>
                                      <Input
                                        placeholder="Kecamatan Gandrungmangu, Kabupaten Cilacap"
                                        value={strukPembeliAlamat}
                                        onChange={(e) => setStrukPembeliAlamat(e.target.value)}
                                        className="h-10 rounded-xl bg-white border-blue-200 font-medium text-xs"
                                      />
                                    </div>

                                    {/* Penerima Barang / Tanda Tangan */}
                                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                                      <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                        Nama Penerima Barang (Tanda Tangan Penerima pada Invoice)
                                      </Label>
                                      <Input
                                        placeholder="Contoh: Bpk. Sekretaris Desa / TPK"
                                        value={strukPenerimaNama}
                                        onChange={(e) => setStrukPenerimaNama(e.target.value)}
                                        className="h-10 rounded-xl bg-white border-blue-200 font-medium text-xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* KONDISI C: MODE NOTA KONTAN */}
                              {strukJenisDokumen === "nota" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white/70 p-3.5 rounded-2xl border border-emerald-100">
                                  {/* Tanggal Nota */}
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                      Tanggal Nota Kontan
                                    </Label>
                                    <Input
                                      type="date"
                                      value={strukDate}
                                      onChange={(e) => setStrukDate(e.target.value)}
                                      className="h-10 rounded-xl bg-white border-emerald-200 font-bold text-xs"
                                    />
                                  </div>

                                  {/* Nomor Nota */}
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                      Nomor Nota Kontan
                                    </Label>
                                    <Input
                                      placeholder="Contoh: NK/2026/042"
                                      value={strukNoRef}
                                      onChange={(e) => setStrukNoRef(e.target.value)}
                                      className="h-10 rounded-xl bg-white border-emerald-200 font-bold text-emerald-950 text-xs"
                                    />
                                  </div>

                                  {/* Tuan / Kepada Yth */}
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                      Tuan / Kepada Yth. (Nota Kontan)
                                    </Label>
                                    <Input
                                      placeholder="Contoh: Pemdes Sampeldes"
                                      value={strukTuanNota}
                                      onChange={(e) => setStrukTuanNota(e.target.value)}
                                      className="h-10 rounded-xl bg-white border-emerald-200 font-bold text-xs"
                                    />
                                  </div>

                                  {/* Yang Menyerahkan / Kasir Toko */}
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                      Tanda Tangan Hormat Kami (Toko)
                                    </Label>
                                    <Input
                                      placeholder="Nama Kasir / Toko"
                                      value={strukKasir}
                                      onChange={(e) => setStrukKasir(e.target.value)}
                                      className="h-10 rounded-xl bg-white border-emerald-200 font-medium text-xs"
                                    />
                                  </div>

                                  {/* Tanda Terima Pembeli */}
                                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                      Nama Tanda Terima Pembeli (Kolom Kiri Nota)
                                    </Label>
                                    <Input
                                      placeholder="Contoh: Penerima Barang / TPK"
                                      value={strukPenerimaNama}
                                      onChange={(e) => setStrukPenerimaNama(e.target.value)}
                                      className="h-10 rounded-xl bg-white border-emerald-200 font-medium text-xs"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 3. KEPERLUAN PROGRAM & CATATAN KAKI BAWAH (SEMUA DAPAT DISETTING MANUAL) */}
                            <div className="pt-3 border-t border-orange-200/80 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-orange-950 tracking-wider flex items-center gap-1.5">
                                  <FileText className="h-3.5 w-3.5 text-orange-600" />
                                  3. Keperluan / Program Belanja &amp; Pesan Footer (Manual Setting)
                                </span>
                                <span className="text-[9px] text-muted-foreground font-medium">
                                  Berlaku untuk Struk, Invoice, &amp; Nota Kontan
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {/* Keperluan / Program Desa */}
                                <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-1.5">
                                      <span>Uraian Keperluan / Program Kegiatan Desa (Manual)</span>
                                      {strukModel === "pertanian" && (
                                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                                          Model Pertanian
                                        </span>
                                      )}
                                      {strukModel === "percetakan" && (
                                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded-full">
                                          Model Percetakan
                                        </span>
                                      )}
                                    </Label>
                                    <span className="text-[9px] font-semibold text-slate-500">
                                      {strukKeperluan.trim() ? "Akan dicetak pada dokumen" : "Kosong (tidak dicetak)"}
                                    </span>
                                  </div>
                                  <div className="relative">
                                    <Input
                                      placeholder={
                                        strukModel === "pertanian"
                                          ? "Isi manual program, contoh: Program Ketahanan Pangan Desa (20%) (opsional)"
                                          : strukModel === "percetakan"
                                            ? "Isi manual keperluan, contoh: Publikasi Transparansi APBDes & Sosialisasi Desa (opsional)"
                                            : "Keterangan keperluan transaksi / belanja (opsional, kosongkan jika tidak ingin dicetak)"
                                      }
                                      value={strukKeperluan}
                                      onChange={(e) => setStrukKeperluan(e.target.value)}
                                      className="h-10 pl-3 pr-8 rounded-xl bg-white border-orange-200 font-medium text-xs"
                                    />
                                    {strukKeperluan && (
                                      <button
                                        type="button"
                                        onClick={() => setStrukKeperluan("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 text-xs font-bold p-1 cursor-pointer"
                                        title="Kosongkan isian"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Catatan Kaki 1 (Klausul Footer) */}
                                <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                                  <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                    Catatan Kaki 1 / Klausul Footer Toko
                                  </Label>
                                  <Input
                                    placeholder={curModel.defaultCatatanKaki1 || "Barang yang sudah dibeli tidak dapat ditukar/dikembalikan"}
                                    value={strukCatatanKaki1}
                                    onChange={(e) => setStrukCatatanKaki1(e.target.value)}
                                    className="h-10 rounded-xl bg-white border-orange-200 font-medium text-xs"
                                  />
                                </div>

                                {/* Catatan Kaki 2 (Pesan Ramah Tamah) */}
                                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                                  <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                                    Catatan Kaki 2 / Pesan Tambahan
                                  </Label>
                                  <Input
                                    placeholder={curModel.defaultCatatanKaki2 || "Terima kasih atas kerja samanya"}
                                    value={strukCatatanKaki2}
                                    onChange={(e) => setStrukCatatanKaki2(e.target.value)}
                                    className="h-10 rounded-xl bg-white border-orange-200 font-medium text-xs"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 4. PANEL CEPAT SPESIFIK MODEL */}
                            {/* KEBUTUHAN KHUSUS MODEL: PERCETAKAN & DIGITAL PRINTING (MODEL 13) */}
                            {strukModel === "percetakan" && (
                              <div className="pt-3 border-t border-indigo-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">🖨️</span>
                                    <h5 className="text-[11px] font-black uppercase text-indigo-950 tracking-wider">
                                      Pilihan Cepat Barang / Jasa Percetakan &amp; Reklame Desa
                                    </h5>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    Klik untuk menambahkan ke daftar barang
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { name: "Cetak Banner Spanduk APBDes (Flexi 280gr)", qty: 6, unit: "Meter", price: 25000 },
                                    { name: "Baliho Transparansi Anggaran Desa (3x4 Meter)", qty: 1, unit: "Paket", price: 300000 },
                                    { name: "Spanduk Musdes / Musrenbangdes (1x4 Meter)", qty: 1, unit: "Paket", price: 100000 },
                                    { name: "Banner Edukasi Stunting & Posyandu (Flexi 280gr)", qty: 4, unit: "Meter", price: 25000 },
                                    { name: "Prasasti Dana Desa Bahan Granit Hitam (40x60cm)", qty: 1, unit: "Unit", price: 450000 },
                                    { name: "Cetak Stiker Nomor Rumah RT/RW (Cromo Vinyl)", qty: 50, unit: "Lembar", price: 8000 },
                                  ].map((item) => (
                                    <button
                                      key={item.name}
                                      type="button"
                                      onClick={() => addQuickStrukItem(item.name, item.qty, item.unit, item.price)}
                                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-950 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                                    >
                                      <span>+ {item.name}</span>
                                      <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[9px]">
                                        Rp {item.price.toLocaleString("id-ID")}
                                      </span>
                                    </button>
                                  ))}
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  <span className="text-[9px] font-bold text-indigo-900">Pilih Cepat Keterangan / Finishing:</span>
                                  {[
                                    "Mata Ayam Tiap Sudut (Siap Pasang)",
                                    "Finishing Kolong Kayu Bambu Kiri Kanan",
                                    "Finishing Lem Lipat Keliling Rapi",
                                    "Publikasi Transparansi APBDes Desa Sampeldes",
                                  ].map((fin) => (
                                    <button
                                      key={fin}
                                      type="button"
                                      onClick={() => {
                                        setStrukKeteranganKhusus(fin);
                                        setStrukKeperluan(fin);
                                      }}
                                      className="px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-[9px] font-bold text-indigo-900 transition-colors cursor-pointer"
                                    >
                                      + {fin}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* KEBUTUHAN KHUSUS MODEL: TOKO PERTANIAN (PILIHAN CEPAT PROGRAM) */}
                            {strukModel === "pertanian" && (
                              <div className="pt-3 border-t border-emerald-200/80 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase text-emerald-950 flex items-center gap-1.5">
                                    <span>🌱 Pilihan Cepat Keperluan / Program Pertanian:</span>
                                  </span>
                                  <span className="text-[9px] text-muted-foreground">
                                    Klik untuk mengisi ke form
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    "Program Ketahanan Pangan Desa (20%)",
                                    "Pengadaan Bibit Tanaman Pangan & Palawija",
                                    "Bantuan Pupuk Organik Kelompok Tani",
                                    "Sarana Pengendalian Hama Tanaman Padi",
                                  ].map((prog) => (
                                    <button
                                      key={prog}
                                      type="button"
                                      onClick={() => {
                                        setStrukKeperluan(prog);
                                        setStrukKeteranganKhusus(prog);
                                      }}
                                      className={cn(
                                        "px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer",
                                        strukKeperluan === prog
                                          ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs"
                                          : "bg-white hover:bg-emerald-100/80 border-emerald-300 text-emerald-950"
                                      )}
                                    >
                                      + {prog}
                                    </button>
                                  ))}
                                  {strukKeperluan && (
                                    <button
                                      type="button"
                                      onClick={() => setStrukKeperluan("")}
                                      className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-[10px] font-bold text-red-700 transition-colors cursor-pointer"
                                    >
                                      ✕ Kosongkan
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* KEBUTUHAN KHUSUS MODEL: SPBU PERTAMINA */}
                            {strukModel === "spbu" && (
                              <div className="pt-3 border-t border-amber-200/80 space-y-3">
                                <div className="flex items-center gap-2">
                                  <Fuel className="h-4 w-4 text-amber-700" />
                                  <h5 className="text-[11px] font-black uppercase text-amber-950 tracking-wider">
                                    Rincian Khusus SPBU Pertamina (BBM Kendaraan Dinas)
                                  </h5>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-amber-900">Nomor / Unit SPBU</Label>
                                    <Input
                                      value={strukSpbuNomor}
                                      onChange={(e) => setStrukSpbuNomor(e.target.value)}
                                      placeholder="SPBU 44.532.09 GANDRUNGMANGU"
                                      className="h-10 text-xs font-bold bg-white border-amber-300"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-amber-900">No Pompa / Selang</Label>
                                    <Input
                                      value={strukSpbuNoPompa}
                                      onChange={(e) => setStrukSpbuNoPompa(e.target.value)}
                                      placeholder="02 / 01"
                                      className="h-10 text-xs font-bold bg-white border-amber-300"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-amber-900">No. Polisi Randis Desa</Label>
                                    <Input
                                      value={strukSpbuPlatNomor}
                                      onChange={(e) => {
                                        setStrukSpbuPlatNomor(e.target.value);
                                        setStrukKeteranganKhusus(e.target.value);
                                      }}
                                      placeholder="R 9508 XB (RANDIS DESA)"
                                      className="h-10 text-xs font-bold bg-white border-amber-300"
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <span className="text-[10px] font-bold text-amber-950">Pilih Cepat Produk BBM:</span>
                                  {[
                                    { name: "PERTALITE", price: 10000, liter: 15 },
                                    { name: "PERTAMAX", price: 12950, liter: 10 },
                                    { name: "SOLAR / BIO SOLAR", price: 6800, liter: 20 },
                                    { name: "DEXLITE", price: 14500, liter: 10 },
                                  ].map((bbm) => (
                                    <button
                                      key={bbm.name}
                                      type="button"
                                      onClick={() => {
                                        setStrukSpbuJenisBbm(bbm.name);
                                        setStrukItems([
                                          {
                                            jenisBarang: bbm.name,
                                            banyaknya: bbm.liter,
                                            satuan: "Liter",
                                            hargaSatuan: bbm.price,
                                            jumlah: bbm.liter * bbm.price,
                                          },
                                        ]);
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-950 transition-colors cursor-pointer"
                                    >
                                      ⛽ {bbm.name} ({bbm.liter}L @ Rp {bbm.price.toLocaleString("id-ID")})
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* KEBUTUHAN KHUSUS MODEL: TOKO MEBELER / FURNITURE */}
                            {strukModel === "mebeler" && (
                              <div className="pt-3 border-t border-orange-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">🪑</span>
                                    <h5 className="text-[11px] font-black uppercase text-orange-950 tracking-wider">
                                      Pilihan Cepat Barang Mebeler / Furniture Balai Desa
                                    </h5>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    Klik untuk menambahkan ke daftar barang
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { name: "Kursi Rapat Busa Chrome", qty: 6, unit: "Unit", price: 350000 },
                                    { name: "Meja Kerja 1/2 Biro Kayu Jati", qty: 2, unit: "Unit", price: 1250000 },
                                    { name: "Lemari Arsip Kantor 2 Pintu", qty: 1, unit: "Unit", price: 1850000 },
                                    { name: "Kursi Susun Rapat BPD Besi", qty: 10, unit: "Unit", price: 175000 },
                                    { name: "Meja Rapat Panjang Balai Desa", qty: 1, unit: "Unit", price: 3500000 },
                                  ].map((item) => (
                                    <button
                                      key={item.name}
                                      type="button"
                                      onClick={() => addQuickStrukItem(item.name, item.qty, item.unit, item.price)}
                                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-orange-100/80 border border-orange-200 text-[10px] font-bold text-orange-950 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                                    >
                                      <span>+ {item.name}</span>
                                      <span className="text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded text-[9px]">
                                        Rp {item.price.toLocaleString("id-ID")}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* KEBUTUHAN KHUSUS MODEL: SEWA TRATAG & SOUND SYSTEM */}
                            {strukModel === "tratag_sound" && (
                              <div className="pt-3 border-t border-orange-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">⛺</span>
                                    <h5 className="text-[11px] font-black uppercase text-orange-950 tracking-wider">
                                      Pilihan Cepat Paket Sewa Tratag, Tenda &amp; Sound System Desa
                                    </h5>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    Klik untuk menambahkan ke daftar barang
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { name: "Sewa Tratag Plafon VIP (3 Plong)", qty: 1, unit: "Paket", price: 750000 },
                                    { name: "Sewa Sound System 5000W + 4 Mic Wireless", qty: 1, unit: "Paket", price: 1500000 },
                                    { name: "Sewa Panggung Acara 4 x 6 Meter", qty: 1, unit: "Paket", price: 800000 },
                                    { name: "Paket Komplit Tratag + Sound HUT RI / Musdes", qty: 1, unit: "Paket", price: 2500000 },
                                    { name: "Sewa Kursi Tamu Plastik + Sarung (100 Unit)", qty: 1, unit: "Paket", price: 300000 },
                                  ].map((item) => (
                                    <button
                                      key={item.name}
                                      type="button"
                                      onClick={() => addQuickStrukItem(item.name, item.qty, item.unit, item.price)}
                                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-orange-100/80 border border-orange-200 text-[10px] font-bold text-orange-950 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                                    >
                                      <span>+ {item.name}</span>
                                      <span className="text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded text-[9px]">
                                        Rp {item.price.toLocaleString("id-ID")}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* KEBUTUHAN MODEL LAINNYA: REKOMENDASI CEPAT ITEM */}
                            {strukModel !== "spbu" &&
                              strukModel !== "mebeler" &&
                              strukModel !== "tratag_sound" &&
                              strukModel !== "percetakan" && (
                                <div className="pt-3 border-t border-orange-200/80 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-orange-950">
                                      Rekomendasi Cepat Belanja {curModel.name}:
                                    </span>
                                    <span className="text-[9px] text-muted-foreground">
                                      Klik untuk tambah ke tabel
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => addQuickStrukItem(curModel.defaultItem, 1, curModel.defaultSatuan, curModel.defaultHarga)}
                                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-orange-100/80 border border-orange-200 text-[10px] font-bold text-orange-950 transition-colors cursor-pointer"
                                    >
                                      + {curModel.defaultItem} (Rp {curModel.defaultHarga.toLocaleString("id-ID")})
                                    </button>
                                  </div>
                                </div>
                              )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* PILIHAN WARNA TINTA STRUK */}
                    <div className="p-6 rounded-3xl bg-white border border-orange-200/90 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4 text-orange-600" />
                          <h3 className="text-xs font-black uppercase text-orange-950 tracking-wider">
                            Pilihan Warna Tinta Struk
                          </h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full w-fit">
                          Efek Hasil Cetak Thermal / Dot-Matrix
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Pilih warna tinta hasil cetak struk agar menyerupai struk fisik asli (hitam thermal standar, biru klasik SPBU, pita ungu dot-matrix, dsb).
                      </p>

                      {/* Grid 5 Pilihan Warna Tinta */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {STRUK_INK_COLORS.map((ink) => {
                          const isSelected = strukWarnaTinta === ink.id;
                          return (
                            <div
                              key={ink.id}
                              onClick={() => setStrukWarnaTinta(ink.id)}
                              className={cn(
                                "p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2 relative",
                                isSelected
                                  ? "bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/20 shadow-sm"
                                  : "bg-slate-50/50 hover:bg-slate-100/70 border-slate-200 hover:border-slate-300"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-4 h-4 rounded-full border border-black/10 shadow-xs flex-shrink-0"
                                    style={{ backgroundColor: ink.dotColor }}
                                  />
                                  <span className="text-xs font-black text-slate-900">
                                    {ink.name}
                                  </span>
                                </div>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-orange-600 flex-shrink-0" />
                                )}
                              </div>

                              <p className="text-[10px] text-muted-foreground">
                                {ink.desc}
                              </p>

                              <div
                                className="px-2 py-1 rounded-md bg-white border border-slate-200/80 text-[10px] font-mono font-bold text-center"
                                style={{ color: ink.sampleStyle }}
                              >
                                Rp 150.000 (Preview)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Daftar Barang Struk */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase text-orange-950 tracking-widest ml-1 flex items-center gap-1.5">
                          <ShoppingBag className="h-3.5 w-3.5 text-orange-600" />
                          Barang Belanjaan Struk ({strukItems.length} Item)
                        </Label>
                        <Button
                          type="button"
                          onClick={addStrukItem}
                          variant="outline"
                          size="sm"
                          className="h-9 gap-1.5 rounded-xl border-orange-200 bg-white text-orange-950 hover:bg-orange-50 hover:text-orange-900 text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 text-orange-600" />
                          <span className="text-orange-950 font-bold">Tambah Barang</span>
                        </Button>
                      </div>

                      {/* Tabel Rincian Barang 1 Baris */}
                      <div className="rounded-2xl border border-orange-200/90 bg-white overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-orange-100/70 border-b border-orange-200 text-[10px] font-black uppercase text-orange-950 tracking-wider">
                                <th className="py-3 px-2 text-center w-12">No</th>
                                <th className="py-3 px-3">Jenis / Nama Barang</th>
                                <th className="py-3 px-2 text-center w-24">Banyaknya</th>
                                <th className="py-3 px-2 text-center w-28">Satuan</th>
                                <th className="py-3 px-3 text-right w-36">Harga Satuan (Rp)</th>
                                <th className="py-3 px-3 text-right w-36">Subtotal</th>
                                <th className="py-3 px-2 text-center w-14">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-orange-100">
                              {strukItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-orange-50/40 transition-colors">
                                  {/* 1. No */}
                                  <td className="py-2.5 px-2 text-center">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 text-xs font-black text-orange-950">
                                      {idx + 1}
                                    </span>
                                  </td>

                                  {/* 2. Jenis / Nama Barang */}
                                  <td className="py-2.5 px-3">
                                    <Input
                                      placeholder="Contoh: Aqua Botol 600ml"
                                      value={item.jenisBarang}
                                      onChange={(e) => handleStrukItemChange(idx, "jenisBarang", e.target.value)}
                                      className="h-10 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 font-bold text-xs md:text-sm text-slate-800 w-full"
                                    />
                                  </td>

                                  {/* 3. Banyaknya */}
                                  <td className="py-2.5 px-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      placeholder="1"
                                      value={item.banyaknya}
                                      onChange={(e) => handleStrukItemChange(idx, "banyaknya", e.target.value)}
                                      className="h-10 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 font-bold text-center text-xs md:text-sm text-slate-800 w-full"
                                    />
                                  </td>

                                  {/* 4. Satuan */}
                                  <td className="py-2.5 px-2">
                                    <Input
                                      placeholder="Pcs / Btl"
                                      value={item.satuan}
                                      onChange={(e) => handleStrukItemChange(idx, "satuan", e.target.value)}
                                      className="h-10 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 font-medium text-center text-xs md:text-sm text-slate-800 w-full"
                                    />
                                  </td>

                                  {/* 5. Harga Satuan */}
                                  <td className="py-2.5 px-3">
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={item.hargaSatuan}
                                      onChange={(e) => handleStrukItemChange(idx, "hargaSatuan", e.target.value)}
                                      className="h-10 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 font-bold text-right text-xs md:text-sm text-orange-950 w-full"
                                    />
                                  </td>

                                  {/* 6. Subtotal */}
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <span className="font-black text-xs text-orange-800 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-200/80 block text-right">
                                      Rp {(Number(item.jumlah) || 0).toLocaleString("id-ID")}
                                    </span>
                                  </td>

                                  {/* 7. Aksi */}
                                  <td className="py-2.5 px-2 text-center">
                                    {strukItems.length > 1 ? (
                                      <Button
                                        type="button"
                                        onClick={() => removeStrukItem(idx)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg cursor-pointer"
                                        title="Hapus baris"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      <span className="text-muted-foreground/30 text-xs">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Total Baris Struk (Subtotal) */}
                      {(() => {
                        const subtotalBelanjaStruk = strukItems.reduce((acc, it) => acc + (Number(it.jumlah) || 0), 0);
                        const diskonRawNum = strukDiskonNilai ? parseFloat(strukDiskonNilai.replace(/[^0-9.]/g, "")) || 0 : 0;
                        const diskonNominal = strukDiskonTipe === "persen"
                          ? Math.round((subtotalBelanjaStruk * Math.min(100, Math.max(0, diskonRawNum))) / 100)
                          : Math.min(subtotalBelanjaStruk, Math.max(0, diskonRawNum));
                        const grandTotalBelanjaStruk = Math.max(0, subtotalBelanjaStruk - diskonNominal);
                        const bayarNominal = Number(strukBayarTunai) || 0;
                        const kembalian = bayarNominal >= grandTotalBelanjaStruk ? bayarNominal - grandTotalBelanjaStruk : 0;
                        const kurangBayar = bayarNominal > 0 && bayarNominal < grandTotalBelanjaStruk ? grandTotalBelanjaStruk - bayarNominal : 0;

                        return (
                          <div className="space-y-4">
                            {/* Banner Total Belanja Struk (Subtotal) */}
                            <div className="p-5 rounded-2xl bg-orange-500 text-white flex items-center justify-between shadow-lg shadow-orange-500/20">
                              <div>
                                <p className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                                  Total Belanja Struk {diskonNominal > 0 ? "(Sebelum Diskon)" : ""}
                                </p>
                                <p className="text-xl font-black">
                                  Rp {subtotalBelanjaStruk.toLocaleString("id-ID")}
                                </p>
                              </div>
                              <Button
                                type="button"
                                onClick={addStrukItem}
                                variant="outline"
                                className="rounded-xl font-black text-xs gap-1.5 h-10 bg-white text-orange-950 border border-orange-200 hover:bg-orange-50 hover:text-orange-900 shadow-sm cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5 text-orange-600" />
                                <span className="text-orange-950 font-black">Tambah Barang</span>
                              </Button>
                            </div>

                            {/* ISIAN DISKON BARANG (NOMINAL ATAU PERSENTASE) */}
                            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-200/90 shadow-xs space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
                                <div className="flex items-center gap-2">
                                  <Percent className="h-4 w-4 text-rose-600" />
                                  <h4 className="text-xs font-black uppercase text-rose-950 tracking-wider">
                                    Potongan / Diskon Belanja Barang (Opsional)
                                  </h4>
                                </div>

                                {/* Toggle Tipe Diskon: Persen (%) vs Nominal (Rp) */}
                                <div className="flex items-center bg-rose-50 p-1 rounded-xl border border-rose-200/80 gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setStrukDiskonTipe("persen")}
                                    className={cn(
                                      "px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1",
                                      strukDiskonTipe === "persen"
                                        ? "bg-rose-600 text-white shadow-xs"
                                        : "text-rose-900 hover:bg-rose-100/70"
                                    )}
                                  >
                                    <span>%</span> Persentase
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setStrukDiskonTipe("nominal")}
                                    className={cn(
                                      "px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1",
                                      strukDiskonTipe === "nominal"
                                        ? "bg-rose-600 text-white shadow-xs"
                                        : "text-rose-900 hover:bg-rose-100/70"
                                    )}
                                  >
                                    <span>Rp</span> Nominal
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                                {/* Input Besaran Diskon */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase text-rose-950 tracking-wider">
                                      {strukDiskonTipe === "persen" ? "Besaran Diskon Persen (%)" : "Besaran Diskon Tunai (Rp)"}
                                    </Label>
                                    {strukDiskonNilai && (
                                      <button
                                        type="button"
                                        onClick={() => setStrukDiskonNilai("")}
                                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                                      >
                                        ✕ Hapus Diskon
                                      </button>
                                    )}
                                  </div>

                                  <div className="relative">
                                    {strukDiskonTipe === "nominal" ? (
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm text-rose-400">
                                        Rp
                                      </span>
                                    ) : null}
                                    <Input
                                      type="number"
                                      placeholder={strukDiskonTipe === "persen" ? "Contoh: 10 (artinya 10%)" : "Contoh: 15000"}
                                      value={strukDiskonNilai}
                                      onChange={(e) => setStrukDiskonNilai(e.target.value)}
                                      className={cn(
                                        "h-12 rounded-xl bg-rose-50/30 border border-rose-200 focus:bg-white focus:border-rose-500 font-black text-base text-rose-950",
                                        strukDiskonTipe === "nominal" ? "pl-12 pr-4" : "pl-4 pr-10"
                                      )}
                                    />
                                    {strukDiskonTipe === "persen" ? (
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-sm text-rose-500">
                                        %
                                      </span>
                                    ) : null}
                                  </div>

                                  {/* Tombol Cepat Pilihan Diskon */}
                                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <span className="text-[9px] font-bold text-rose-900 mr-1">Pilih Cepat:</span>
                                    {strukDiskonTipe === "persen" ? (
                                      [5, 10, 15, 20, 25, 50].map((p) => (
                                        <button
                                          key={p}
                                          type="button"
                                          onClick={() => setStrukDiskonNilai(String(p))}
                                          className={cn(
                                            "px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer",
                                            strukDiskonNilai === String(p)
                                              ? "bg-rose-600 text-white border-rose-700 shadow-2xs"
                                              : "bg-white hover:bg-rose-100/70 border-rose-200 text-rose-900"
                                          )}
                                        >
                                          {p}%
                                        </button>
                                      ))
                                    ) : (
                                      [5000, 10000, 25000, 50000, 100000].map((nom) => (
                                        <button
                                          key={nom}
                                          type="button"
                                          onClick={() => setStrukDiskonNilai(String(nom))}
                                          className={cn(
                                            "px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer",
                                            strukDiskonNilai === String(nom)
                                              ? "bg-rose-600 text-white border-rose-700 shadow-2xs"
                                              : "bg-white hover:bg-rose-100/70 border-rose-200 text-rose-900"
                                          )}
                                        >
                                          Rp {(nom / 1000)}rb
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Box Rekapitulasi Rincian Diskon & Total Akhir */}
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50/40 border border-rose-200/80 space-y-2.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground font-semibold">Total Belanja (Subtotal):</span>
                                    <span className="font-bold text-slate-800">
                                      Rp {subtotalBelanjaStruk.toLocaleString("id-ID")}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-rose-700 font-bold flex items-center gap-1.5">
                                      <span>Potongan Diskon:</span>
                                      {diskonNominal > 0 && strukDiskonTipe === "persen" && (
                                        <span className="text-[9px] bg-rose-200 text-rose-950 px-1.5 py-0.5 rounded font-black">
                                          {Math.min(100, Math.max(0, parseFloat(strukDiskonNilai) || 0))}%
                                        </span>
                                      )}
                                    </span>
                                    <span className="font-black text-rose-700">
                                      {diskonNominal > 0 ? `- Rp ${diskonNominal.toLocaleString("id-ID")}` : "Rp 0"}
                                    </span>
                                  </div>
                                  <div className="pt-2.5 border-t border-rose-200 flex items-center justify-between">
                                    <div>
                                      <span className="text-xs font-black uppercase text-rose-950 block">
                                        Total Akhir Bayar
                                      </span>
                                      <span className="text-[9px] text-muted-foreground font-medium">
                                        {diskonNominal > 0 ? "Setelah dipotong diskon" : "Tanpa diskon"}
                                      </span>
                                    </div>
                                    <span className="text-xl font-black text-rose-950">
                                      Rp {grandTotalBelanjaStruk.toLocaleString("id-ID")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* PEMBAYARAN TUNAI & KEMBALIAN (OTOMATIS MENGHITUNG DARI TOTAL AKHIR) */}
                            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-orange-200/90 shadow-xs space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-100 pb-3">
                                <div className="flex items-center gap-2">
                                  <Banknote className="h-4 w-4 text-emerald-600" />
                                  <h4 className="text-xs font-black uppercase text-orange-950 tracking-wider">
                                    Pembayaran Tunai &amp; Kembalian (Dihitung Otomatis)
                                  </h4>
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full w-fit">
                                  Menyesuaikan Hasil Cetak Struk, Invoice &amp; Nota
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Input Uang Dibayarkan */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase text-orange-950 tracking-wider">
                                      Uang Dibayarkan (Rp)
                                    </Label>
                                    {bayarNominal > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setStrukBayarTunai("")}
                                        className="text-[10px] text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                                      >
                                        Reset ke Uang Pas
                                      </button>
                                    )}
                                  </div>
                                  <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm text-slate-400">
                                      Rp
                                    </span>
                                    <Input
                                      type="number"
                                      placeholder={grandTotalBelanjaStruk > 0 ? String(grandTotalBelanjaStruk) : "Masukkan nominal pembayaran..."}
                                      value={strukBayarTunai}
                                      onChange={(e) => setStrukBayarTunai(e.target.value)}
                                      className="h-12 pl-12 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 font-black text-base text-slate-900"
                                    />
                                  </div>

                                  {/* Tombol Cepat Nominal */}
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setStrukBayarTunai(String(grandTotalBelanjaStruk))}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold transition-colors cursor-pointer"
                                      title="Isi dengan uang pas"
                                    >
                                      Uang Pas (Rp {grandTotalBelanjaStruk.toLocaleString("id-ID")})
                                    </button>
                                    {[10000, 20000, 50000, 100000].map((add) => (
                                      <button
                                        key={add}
                                        type="button"
                                        onClick={() => {
                                          const base = bayarNominal > 0 ? bayarNominal : grandTotalBelanjaStruk;
                                          setStrukBayarTunai(String(base + add));
                                        }}
                                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
                                      >
                                        +Rp {(add / 1000)}rb
                                      </button>
                                    ))}
                                    {grandTotalBelanjaStruk > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const round50k = Math.ceil(grandTotalBelanjaStruk / 50000) * 50000;
                                          setStrukBayarTunai(String(round50k === grandTotalBelanjaStruk ? round50k + 50000 : round50k));
                                        }}
                                        className="px-2 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-bold transition-colors cursor-pointer"
                                      >
                                        Bulatkan Rp 50rb
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Display Kembalian Otomatis */}
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-orange-950 tracking-wider">
                                    Uang Kembalian (Otomatis)
                                  </Label>
                                  <div
                                    className={cn(
                                      "h-12 px-4 rounded-xl flex items-center justify-between border transition-all",
                                      kurangBayar > 0
                                        ? "bg-rose-50 border-rose-200 text-rose-900"
                                        : bayarNominal >= grandTotalBelanjaStruk && grandTotalBelanjaStruk > 0
                                          ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                                          : "bg-slate-50 border-slate-200 text-slate-700"
                                    )}
                                  >
                                    <span className="text-xs font-bold uppercase tracking-wider">
                                      {kurangBayar > 0 ? "Kurang Bayar:" : "Kembalian:"}
                                    </span>
                                    <span className="text-lg font-black font-mono">
                                      {kurangBayar > 0
                                        ? `- Rp ${kurangBayar.toLocaleString("id-ID")}`
                                        : `Rp ${kembalian.toLocaleString("id-ID")}`}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-[10px] pt-0.5">
                                    {kurangBayar > 0 ? (
                                      <span className="font-bold text-rose-600 bg-rose-100/70 px-2.5 py-0.5 rounded-md">
                                        ⚠️ Nominal bayar kurang Rp {kurangBayar.toLocaleString("id-ID")}
                                      </span>
                                    ) : bayarNominal >= grandTotalBelanjaStruk && grandTotalBelanjaStruk > 0 ? (
                                      <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                        ✓ LUNAS {kembalian === 0 ? "(Uang Pas)" : `(Kembalian Rp ${kembalian.toLocaleString("id-ID")})`}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        * Default jika dikosongkan: tercetak pembayaran uang pas (Lunas).
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(type !== "siltap" && type !== "insentif" && type !== "daftar-hadir-posyandu" && type !== "bukti-transaksi") && (
              <div className="space-y-8">
                <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
                  <Button
                    variant={useApbdes ? "default" : "ghost"}
                    className={cn("flex-1 text-[10px] uppercase font-black gap-2 h-10", useApbdes && "shadow-md")}
                    onClick={() => setUseApbdes(true)}
                  >
                    <Database className="h-3 w-3" /> APBDes
                  </Button>
                  <Button
                    variant={!useApbdes ? "default" : "ghost"}
                    className={cn("flex-1 text-[10px] uppercase font-black gap-2 h-10", !useApbdes && "shadow-md")}
                    onClick={() => setUseApbdes(false)}
                  >
                    <Type className="h-3 w-3" /> Manual
                  </Button>
                </div>

                <div className="grid gap-5">
                  {useApbdes ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1 flex items-center gap-2">
                          <Wallet className="h-3 w-3" /> Jenis APBDes
                        </Label>
                        <Select value={selectedApbdesType} onValueChange={(val: "APBDes" | "APBDes Perubahan") => { setSelectedApbdesType(val); setSumber(""); setKegiatan(""); }}>
                          <SelectTrigger className="h-12 rounded-xl bg-primary/5 border-primary/10 px-5 font-black text-primary">
                            <SelectValue placeholder="Pilih Jenis..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="APBDes" className="font-bold">1. APBDes</SelectItem>
                            <SelectItem value="APBDes Perubahan" className="font-bold">2. APBDes Perubahan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1 flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> Pilih Tahun APBDes
                        </Label>
                        <Select value={selectedYear} onValueChange={(val) => { setSelectedYear(val); setSumber(""); setKegiatan(""); }}>
                          <SelectTrigger className="h-12 rounded-xl bg-primary/5 border-primary/10 px-5 font-black text-primary">
                            <SelectValue placeholder="Pilih Tahun..." />
                          </SelectTrigger>
                          <SelectContent>
                            {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map(y => (
                              <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pilih Bidang</Label>
                        <Select onValueChange={(val) => { setBidang(val); setSumber(""); setKegiatan(""); }}>
                          <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none px-5">
                            <SelectValue placeholder="Pilih..." />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(BIDANG_NAMES).map(([id, name]) => (
                              <SelectItem key={id} value={id}>Bidang {id} - {name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sumber Dana ({selectedApbdesType} {selectedYear})</Label>
                        <Select disabled={!bidang || isApbLoading} onValueChange={(val) => { setSumber(val); setKegiatan(""); }}>
                          <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none px-5">
                            <SelectValue placeholder={isApbLoading ? "Memuat..." : "Pilih..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredSources.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pilih Kegiatan (Database {selectedApbdesType} {selectedYear})</Label>
                        <Select disabled={!sumber || isApbLoading} onValueChange={setKegiatan}>
                          <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none px-5">
                            <SelectValue placeholder={isApbLoading ? "Memuat..." : "Pilih Uraian..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredActivities.map((item: any) => (
                              <SelectItem key={item.id} value={item.uraian}>{item.uraian}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nama Kegiatan</Label>
                      <Input
                        placeholder="Ketik perihal kegiatan..."
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        className="h-14 rounded-2xl bg-muted/20 border-none px-5 text-base font-medium"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tanggal</Label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="h-12 pl-12 rounded-xl bg-muted/20 border-none font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Waktu</Label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="09:00 WIB"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="h-12 pl-12 rounded-xl bg-muted/20 border-none font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Lokasi</Label>
                    <Input
                      placeholder="Lokasi kegiatan..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-12 rounded-xl bg-muted/20 border-none px-5 font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {type === "honor-narasumber" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Jumlah Narasumber</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((n) => (
                      <Button
                        key={n}
                        type="button"
                        variant={numNarsum === n ? "default" : "outline"}
                        onClick={() => setNumNarsum(n)}
                        className={cn(
                          "h-14 rounded-2xl font-black text-sm transition-all",
                          numNarsum === n ? "bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-200" : "border-amber-200 hover:bg-amber-50 text-amber-900"
                        )}
                      >
                        {n} Orang
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {Array.from({ length: numNarsum }).map((_, i) => (
                    <div key={i} className="p-6 rounded-[2rem] border border-amber-100 bg-amber-50/30 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600 opacity-20" />
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black uppercase text-amber-800 tracking-[0.2em]">Narasumber {i + 1}</h3>
                        <Briefcase className="h-4 w-4 text-amber-600 opacity-40" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-amber-900/60 ml-1">Nama Lengkap</Label>
                          <Input
                            placeholder="Ketik nama..."
                            value={narsumData[i].name}
                            onChange={(e) => updateNarsumData(i, "name", e.target.value)}
                            className="h-12 rounded-xl bg-white border-amber-100 focus:border-amber-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-amber-900/60 ml-1">Jabatan</Label>
                          <Input
                            placeholder="Jabatan/Instansi..."
                            value={narsumData[i].position}
                            onChange={(e) => updateNarsumData(i, "position", e.target.value)}
                            className="h-12 rounded-xl bg-white border-amber-100 focus:border-amber-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-amber-900/60 ml-1">Nominal Honor (Rp)</Label>
                          <div className="relative">
                            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600 opacity-50" />
                            <Input
                              type="number"
                              placeholder="0"
                              value={narsumData[i].nominal}
                              onChange={(e) => updateNarsumData(i, "nominal", e.target.value)}
                              className="h-12 pl-10 rounded-xl bg-white border-amber-100 focus:border-amber-400 font-bold"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-amber-900/60 ml-1">Pajak (%)</Label>
                          <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600 opacity-50" />
                            <Input
                              type="number"
                              placeholder="0"
                              value={narsumData[i].tax}
                              onChange={(e) => setNarsumData(prev => {
                                const next = [...prev];
                                next[i] = { ...next[i], tax: e.target.value };
                                return next;
                              })}
                              className="h-12 pl-10 rounded-xl bg-white border-amber-100 focus:border-amber-400 font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {type === "honor-kegiatan" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-indigo-900 tracking-widest ml-1">
                    Pilih Kategori Honor Kegiatan
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {HONOR_KEGIATAN_CATEGORIES.map((cat, idx) => (
                      <Button
                        key={cat}
                        type="button"
                        onClick={() => handleSelectHonorCat(cat)}
                        className={cn(
                          "h-14 rounded-2xl font-black text-xs transition-all border-2 text-left justify-start px-4",
                          honorKegiatanCat === cat
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:border-indigo-700"
                            : "bg-white border-muted text-indigo-950 hover:bg-indigo-50/50 hover:border-indigo-200"
                        )}
                      >
                        <span className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center text-[10px] mr-2 shrink-0 font-black",
                          honorKegiatanCat === cat ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                        )}>
                          {idx + 1}
                        </span>
                        <span className="truncate">{cat}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {honorKegiatanCat === "Input Manual" && (
                  <div className="space-y-2 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 animate-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black uppercase text-indigo-800 tracking-widest ml-1">
                      Nama Kategori Honor (Input Manual)
                    </Label>
                    <Input
                      placeholder="Contoh: Honorarium Tim Teknis Lapangan"
                      value={manualHonorCat}
                      onChange={(e) => setManualHonorCat(e.target.value)}
                      className="h-12 rounded-xl bg-white border-indigo-200 font-bold text-indigo-950"
                    />
                    <p className="text-[10px] text-indigo-700/70 font-medium ml-1 italic">
                      * Judul dokumen pada PDF akan dicetak: &quot;TANDA TERIMA {manualHonorCat.trim().toUpperCase() || "HONORARIUM KEGIATAN"}&quot;
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                      Jumlah Penerima Honor
                    </Label>
                    <span className="text-xs font-black text-indigo-600">{numHonorKegiatan} Orang</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                      <Button
                        key={n}
                        type="button"
                        variant={numHonorKegiatan === n ? "default" : "outline"}
                        onClick={() => setNumHonorKegiatan(n)}
                        className={cn(
                          "h-12 rounded-xl font-black text-xs transition-all",
                          numHonorKegiatan === n
                            ? "bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 text-white"
                            : "border-indigo-100 hover:bg-indigo-50 text-indigo-900"
                        )}
                      >
                        {n} Org
                      </Button>
                    ))}
                  </div>
                  {numHonorKegiatan > 10 && (
                    <div className="flex items-center gap-3 pt-1">
                      <Label className="text-[10px] font-bold text-muted-foreground">Kustom Jumlah:</Label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={numHonorKegiatan}
                        onChange={(e) => setNumHonorKegiatan(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                        className="w-24 h-10 rounded-lg text-center font-bold"
                      />
                    </div>
                  )}
                </div>

                <div className="p-6 bg-indigo-50/40 rounded-3xl border border-indigo-100 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-indigo-600" />
                      <Label className="text-xs font-black uppercase text-indigo-950 tracking-tight">
                        Pengisian Nominal Cepat (Otomatis ke Semua)
                      </Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold uppercase text-indigo-900/70 ml-1">Nominal Honor (Rp)</Label>
                      <Input
                        type="number"
                        placeholder="Contoh: 150000"
                        value={batchHonorNominal}
                        onChange={(e) => setBatchHonorNominal(e.target.value)}
                        className="h-11 rounded-xl bg-white border-indigo-200 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold uppercase text-indigo-900/70 ml-1">Pajak (%)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={batchHonorTax}
                        onChange={(e) => setBatchHonorTax(e.target.value)}
                        className="h-11 rounded-xl bg-white border-indigo-200 font-bold"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={applyBatchHonor}
                        className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs"
                      >
                        Terapkan ke Semua
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {Array.from({ length: numHonorKegiatan }).map((_, i) => {
                    const item = honorKegiatanData[i] || { name: "", position: "", nominal: "", tax: "0" };
                    const nom = parseInt(item.nominal) || 0;
                    const taxPercent = parseInt(item.tax) || 0;
                    const taxVal = Math.round(nom * (taxPercent / 100));
                    const netVal = nom - taxVal;

                    return (
                      <div key={i} className="p-6 rounded-3xl border border-indigo-100 bg-white shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-70" />
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                              {i + 1}
                            </span>
                            <h3 className="text-xs font-black uppercase text-indigo-950 tracking-wider">
                              Penerima {i + 1}
                            </h3>
                          </div>
                          {nom > 0 && (
                            <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                              Diterima: Rp {netVal.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5 sm:col-span-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Nama Penerima</Label>
                              {dbOfficials && dbOfficials.length > 0 && (
                                <Select
                                  onValueChange={(val) => {
                                    const off = dbOfficials.find(o => o.name === val);
                                    if (off) {
                                      updateHonorKegiatanData(i, "name", off.name);
                                      if (off.jabatan) {
                                        updateHonorKegiatanData(i, "position", off.jabatan);
                                      }
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-[10px] font-bold border-indigo-100 text-indigo-600 bg-indigo-50/50 w-auto px-2 rounded-lg">
                                    <SelectValue placeholder="Pilih dari Data Personil Desa" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(dbOfficials || []).map((o, oIdx) => (
                                      <SelectItem key={oIdx} value={o.name} className="text-xs font-medium">
                                        {o.name} ({o.jabatan || o.category})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                            <Input
                              placeholder="Ketik nama lengkap penerima..."
                              value={item.name}
                              onChange={(e) => updateHonorKegiatanData(i, "name", e.target.value)}
                              className="h-12 rounded-xl bg-muted/20 border-none font-bold"
                            />
                          </div>

                          <div className="space-y-1.5 sm:col-span-2">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Jabatan / Peran</Label>
                            <Input
                              placeholder="Contoh: Protokoler / Petugas / Anggota"
                              value={item.position}
                              onChange={(e) => updateHonorKegiatanData(i, "position", e.target.value)}
                              className="h-12 rounded-xl bg-muted/20 border-none font-medium"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Nominal Honor (Rp)</Label>
                            <div className="relative">
                              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600 opacity-60" />
                              <Input
                                type="number"
                                placeholder="0"
                                value={item.nominal}
                                onChange={(e) => updateHonorKegiatanData(i, "nominal", e.target.value)}
                                className="h-12 pl-10 rounded-xl bg-muted/20 border-none font-black text-indigo-950"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Potongan Pajak (%)</Label>
                            <div className="relative">
                              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600 opacity-60" />
                              <Input
                                type="number"
                                placeholder="0"
                                value={item.tax}
                                onChange={(e) => updateHonorKegiatanData(i, "tax", e.target.value)}
                                className="h-12 pl-10 rounded-xl bg-muted/20 border-none font-black text-indigo-950"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(type === "daftar-hadir" || type === "uang-saku") && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Kuota Peserta (Master Baris Tabel)</Label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input
                      type="number"
                      value={jumlahOrang}
                      onChange={(e) => setJumlahOrang(parseInt(e.target.value) || 0)}
                      className="h-12 pl-12 rounded-xl bg-primary/5 border-primary/10 font-black text-primary"
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground font-bold italic">* Tabel PDF akan dibuat dengan tepat {jumlahOrang} nomor baris sesuai kuota.</p>
                </div>

                {type === "uang-saku" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-teal-50 rounded-3xl border border-teal-100 shadow-inner">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-teal-900 tracking-widest">Nominal Uang Saku (Rp)</Label>
                      <div className="relative">
                        <Coins className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600" />
                        <Input
                          type="number"
                          placeholder="0"
                          value={uangSakuNominal}
                          onChange={(e) => setUangSakuNominal(e.target.value)}
                          className="h-12 pl-12 rounded-xl bg-white border-teal-200 font-black text-teal-700"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-teal-900 tracking-widest">Pot Pajak (%)</Label>
                      <div className="relative">
                        <Percent className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-teal-600" />
                        <Input
                          type="number"
                          placeholder="0"
                          value={uangSakuTax}
                          onChange={(e) => setUangSakuTax(e.target.value)}
                          className="h-12 pl-12 rounded-xl bg-white border-teal-200 font-black text-teal-700"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <section className={cn("p-6 rounded-3xl border space-y-4", type === "uang-saku" ? "bg-teal-50/50 border-teal-100" : "bg-primary/5 border-primary/10")}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", type === "uang-saku" ? "bg-teal-600" : "bg-primary")}>
                      <UserPlus className="h-4 w-4 text-white" />
                    </div>
                    <h3 className={cn("text-sm font-black uppercase tracking-tight", type === "uang-saku" ? "text-teal-900" : "text-primary")}>Otomatisasi Nama Peserta</h3>
                  </div>
                  <p className={cn("text-[10px] font-bold leading-relaxed mb-4 italic", type === "uang-saku" ? "text-teal-700" : "text-primary/80")}>
                    * Pilih kategori peserta. Nama akan diisi otomatis berdasarkan prioritas urutan input 1 ke 6.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {participantSelections.map((selection, i) => (
                      <div key={i} className="space-y-1.5">
                        <Label className={cn("text-[9px] font-black uppercase ml-1", type === "uang-saku" ? "text-teal-800" : "text-primary/90")}>Kelompok Peserta {i + 1}</Label>
                        <Select
                          value={selection}
                          onValueChange={(value) => handleParticipantSelectionChange(i, value)}
                        >
                          <SelectTrigger className={cn("h-11 rounded-xl bg-white", type === "uang-saku" ? "border-teal-200" : "border-primary/20")}>
                            <SelectValue placeholder="Pilih Kelompok..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- Kosong --</SelectItem>
                            {participantCategories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            <div className="pt-6 border-t border-stone-300/60 space-y-4">
              <Button
                className="w-full h-16 gap-3 text-sm font-black uppercase tracking-wider rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm border border-white/40 active:scale-95 transition-all"
                onClick={() => handleExecute("print")}
                disabled={isGenerating}
              >
                {isGenerating && generatingAction === "print" ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Printer className="h-6 w-6" />
                )}
                Cetak PDF Sekarang
              </Button>

              {/* DUA TOMBOL DOWNLOAD SESUAI UKURAN YANG DIPILIH */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 gap-3 font-black uppercase text-xs tracking-wider rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] text-slate-800 active:scale-95 transition-all"
                  onClick={() => handleExecute("download-pdf")}
                  disabled={isGenerating}
                >
                  {isGenerating && generatingAction === "download-pdf" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-800" />
                  ) : (
                    <div className="h-9 w-9 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center shrink-0">
                      <FileDown className="h-5 w-5 text-emerald-800" />
                    </div>
                  )}
                  <div className="flex flex-col items-start text-left leading-tight">
                    <span className="text-xs font-black text-slate-900 uppercase">Download PDF</span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      Ukuran: <span className="text-emerald-800 font-black">{currentPaperSizeLabel}</span>
                    </span>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-14 gap-3 font-black uppercase text-xs tracking-wider rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] text-slate-800 active:scale-95 transition-all"
                  onClick={() => handleExecute("download-jpg")}
                  disabled={isGenerating}
                >
                  {isGenerating && generatingAction === "download-jpg" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-800" />
                  ) : (
                    <div className="h-9 w-9 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center shrink-0">
                      <FileImage className="h-5 w-5 text-emerald-800" />
                    </div>
                  )}
                  <div className="flex flex-col items-start text-left leading-tight">
                    <span className="text-xs font-black text-slate-900 uppercase">Download JPG</span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      Gambar: <span className="text-emerald-800 font-black">{currentPaperSizeLabel}</span>
                    </span>
                  </div>
                </Button>
              </div>

              <p className="text-[10px] text-center text-slate-500 italic font-bold">
                * Hasil cetak maupun download (PDF / JPG) otomatis menyesuaikan format & ukuran kertas terpilih ({currentPaperSizeLabel}).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DokumenSuspense() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <StatusChecker />
    </Suspense>
  )
}

function StatusChecker() {
  return <DokumenContent />
}

export default function DokumenPenunjangPage() {
  return <DokumenSuspense />
}