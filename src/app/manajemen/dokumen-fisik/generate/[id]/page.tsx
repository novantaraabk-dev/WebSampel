
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, setDoc, collection } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Printer,
  Loader2,
  Coins,
  FileCheck,
  ShieldCheck,
  Edit,
  History,
  FileText,
  Download,
  AlertTriangle,
  RefreshCw,
  Save,
  Users,
  Calendar,
  Briefcase,
  Sparkles,
  Camera,
  CloudUpload,
  Banknote,
  ClipboardList,
  ShoppingCart,
  Plus,
  Trash2,
  Percent,
  MapPin,
  DollarSign,
  Info,
  Store,
  Scale
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { generatePhysicalDocPDF } from "@/lib/pdf-physical-docs"
import { cn } from "@/lib/utils"
import { getNextSequenceNumber, saveToBukuAgenda } from "@/lib/naskah-dinas-utils"
import { terbilang } from "@/lib/pdf-utils"
import { ImageUploader } from "@/components/ui/image-uploader"
import { callAppsScript } from "@/app/agenda/actions"
import { format } from "date-fns"
import { id as localeID } from "date-fns/locale"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function GenerateHubPage() {
  const params = useParams()
  const id = params.id as string
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isSavingPBJ, setIsSavingPBJ] = useState(false)
  const [isSavingSPJ, setIsSavingSPJ] = useState(false)
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [isGeneratingDocx, setIsGeneratingDocx] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [isFetchingNumber, setIsFetchingNumber] = useState<string | null>(null)
  const [isSavingToAgenda, setIsSavingToAgenda] = useState<string | null>(null)

  // 1. Fetch Main Data
  const activityRef = useMemoFirebase(() => (db && id) ? doc(db, "physical_activities", id) : null, [db, id])
  const { data: activity, isLoading: isDataLoading } = useDoc(activityRef)

  const villageSettingsRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "settings", "village")
  }, [db, user])
  const { data: villageSettings } = useDoc(villageSettingsRef)

  // 2. Fetch Personnel for Dropdowns and Signature
  const personnelRef = useMemoFirebase(() => (db && user) ? collection(db, "personnel") : null, [db, user])
  const { data: officials } = useCollection(personnelRef)

  const sekdesName = useMemo(() => officials?.find(o => o.jabatan?.includes("SEKRETARIS DESA"))?.name || "PRIYO SUMARNO", [officials]);

  // 3. Form States
  const [pbjData, setPbjData] = useState<any>({
    nama_ketua_tpk: "", nama_sekretaris_tpk: "", nama_anggota_tpk: "",
    nomor_und_permintaan_penawaran: "", tanggal_und_permintaan_penawaran: "",
    pengumuman_permintaan_penawaran: "",
    pendaftaran_dan_pengambilan_dokumen_pengadaan_permintaan_penawaran: "",
    pemasukan_dokumen_enawaran_permintaan_penawaran: "", evaluasi_Penawaran_permintaan_penawaran: "",
    Penetapan_Pemenang_permintaan_penawaran: "",
    nama_cv1: "", nama_pemilik_cv1: "", alamat_cv1: "", no_identitas_pemilik_cv1: "", no_telepon_pemilik_cv1: "", email_pemilik_cv1: "",
    no_ijin_usaha_cv1: "", masa_berlaku_usaha_cv1: "2026", instansi_pemberi_ijin_cv1: "Pemerintah Kabupaten Cilacap", npwp_cv1: "",
    lapor_pajak_terakhir_cv1: "", nominal_cv1: 0, nominal_cv1_terbilang: "", no_penawaran_cv1: "", tanggal_penawaran_harga_cv1: "",
    nama_cv2: "", nama_pemilik_cv2: "", alamat_cv2: "", no_identitas_pemilik_cv2: "", no_telepon_pemilik_cv2: "", email_pemilik_cv2: "",
    no_ijin_usaha_cv2: "", masa_berlaku_usaha_cv2: "2026", instansi_pemberi_ijin_cv2: "Pemerintah Kabupaten Cilacap", npwp_cv2: "",
    lapor_pajak_terakhir_cv2: "", nominal_cv2: 0, nominal_cv2_terbilang: "", no_penawaran_cv2: "", tanggal_penawaran_harga_cv2: "",
    pemenang_selection: "none",
    nama_cvpemenang: "", nama_pemilik_cvpemenang: "", alamat_cvpemenang: "", nominal_cvpemenang: 0, nominal_cvpemenang_hanya_terbilang: "",
    no_penawaran_cvpemenang: "", tanggal_penawaran_cvpemenang: "",
    nomor_ba_pembahasan_pengadaan: "", tanggal_ba_pembahasan_pengadaan: "", pukul_ba_pembahasan_pengadaan: "Pukul 09.00 WIB",
    tempat_ba: "Balai Desa Sampeldes", perwakilan_bpd: "", tanggal_paktaintegritas_tpk: "",
    nomor_perjanjian_kerja: "", nomor_spk: "", tanggal_spk: "", no_pengumuman_pemenang_bpj: ""
  })

  const [spjData, setSpjData] = useState<any>({
    photoMode: "fisik", // "fisik" | "non-fisik"
    physicalPhotos: { p0: [], p50: [], p100: [] },
    nonPhysicalPhotos: { f1: [], f2: [] },
    nomor_bast: "",
    tanggal_bast: format(new Date(), "yyyy-MM-dd"),
    // Survey Harga
    num_shops: 3,
    nama_toko1: "",
    nama_toko2: "",
    nama_toko3: "",
    nama_toko4: "",
    survey_items: [{ no: 1, nama: "", satuan: "", h1: "", h2: "", h3: "", h4: "", hps: "", ppn: "0", pph: "0" }],
    // BA HPS
    ba_hps_date: format(new Date(), "yyyy-MM-dd"),
    ba_hps_time: "09:00",
    ba_hps_location: "Balai Desa Sampeldes",
    ba_hps_leader_name: "",
    ba_hps_secretary_name: "",
    ba_hps_narsum1_name: "",
    ba_hps_narsum1_inst: "",
    ba_hps_narsum2_name: "",
    ba_hps_narsum2_inst: "",
    selected_shop_hps: ""
  })

  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (activity && !isInitializedRef.current) {
      isInitializedRef.current = true
      setPbjData((prev: any) => ({ ...prev, ...activity }))
      setSpjData((prev: any) => ({
        ...prev,
        ...activity,
        photoMode: activity.photoMode || "fisik",
        physicalPhotos: activity.physicalPhotos || { p0: [], p50: [], p100: [] },
        nonPhysicalPhotos: activity.nonPhysicalPhotos || { f1: [], f2: [] },
        nomor_bast: activity.nomor_bast || "",
        tanggal_bast: activity.tanggal_bast || format(new Date(), "yyyy-MM-dd"),
        num_shops: activity.num_shops || 3,
        nama_toko1: activity.nama_toko1 || "",
        nama_toko2: activity.nama_toko2 || "",
        nama_toko3: activity.nama_toko3 || "",
        nama_toko4: activity.nama_toko4 || "",
        survey_items: activity.survey_items && activity.survey_items.length > 0
          ? activity.survey_items
          : [{ no: 1, nama: "", satuan: "", h1: "", h2: "", h3: "", h4: "", hps: "", ppn: "0", pph: "0" }],
        ba_hps_date: activity.ba_hps_date || format(new Date(), "yyyy-MM-dd"),
        ba_hps_time: activity.ba_hps_time || "09:00",
        ba_hps_location: activity.ba_hps_location || "Balai Desa Sampeldes",
        ba_hps_leader_name: activity.ba_hps_leader_name || "",
        ba_hps_secretary_name: activity.ba_hps_secretary_name || "",
        ba_hps_narsum1_name: activity.ba_hps_narsum1_name || "",
        ba_hps_narsum1_inst: activity.ba_hps_narsum1_inst || "",
        ba_hps_narsum2_name: activity.ba_hps_narsum2_name || "",
        ba_hps_narsum2_inst: activity.ba_hps_narsum2_inst || "",
        selected_shop_hps: activity.selected_shop_hps || ""
      }))
    }
  }, [activity])

  const updatePbjField = (key: string, value: any) => {
    setPbjData((prev: any) => {
      const updated = { ...prev, [key]: value };
      const toTitleCase = (str: string) => {
        if (!str) return "";
        return str.toLowerCase().split(' ').filter(word => word !== "").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      };
      if (key === 'nominal_cv1') {
        const num = Number(value) || 0;
        const words = terbilang(num);
        updated.nominal_cv1_terbilang = words ? toTitleCase(words + " Rupiah") : "";
      }
      if (key === 'nominal_cv2') {
        const num = Number(value) || 0;
        const words = terbilang(num);
        updated.nominal_cv2_terbilang = words ? toTitleCase(words + " Rupiah") : "";
      }
      if (key === 'pemenang_selection') {
        if (value === 'cv1') {
          updated.nama_cvpemenang = prev.nama_cv1;
          updated.nama_pemilik_cvpemenang = prev.nama_pemilik_cv1;
          updated.alamat_cvpemenang = prev.alamat_cv1;
          updated.nominal_cvpemenang = prev.nominal_cv1;
          const words = terbilang(Number(prev.nominal_cv1));
          updated.nominal_cvpemenang_hanya_terbilang = words ? toTitleCase(words + " Rupiah") : "";
          updated.no_penawaran_cvpemenang = prev.no_penawaran_cv1;
          updated.tanggal_penawaran_cvpemenang = prev.tanggal_penawaran_harga_cv1;
        } else if (value === 'cv2') {
          updated.nama_cvpemenang = prev.nama_cv2;
          updated.nama_pemilik_cvpemenang = prev.nama_pemilik_cv2;
          updated.alamat_cvpemenang = prev.alamat_cv2;
          updated.nominal_cvpemenang = prev.nominal_cv2;
          const words = terbilang(Number(prev.nominal_cv2));
          updated.nominal_cvpemenang_hanya_terbilang = words ? toTitleCase(words + " Rupiah") : "";
          updated.no_penawaran_cvpemenang = prev.no_penawaran_cv2;
          updated.tanggal_penawaran_cvpemenang = prev.tanggal_penawaran_harga_cv2;
        }
      }
      return updated;
    })
  }

  const handlePullNumber = async (field: string, subCode: string) => {
    if (!db || !user) return
    setIsFetchingNumber(field)
    try {
      const year = new Date().getFullYear();
      const rawNumString = await getNextSequenceNumber(db, "surat_keluar", "027");
      const match = rawNumString.match(/\/(\d+)\//) || rawNumString.match(/(\d{3})/);
      const seq = match ? (match[1].length === 3 ? match[1] : match[1].padStart(3, '0')) : "001";
      const finalNum = `027/${seq}/${subCode}/${year}`;

      if (field === "nomor_bast") setSpjData((p: any) => ({ ...p, [field]: finalNum }));
      else updatePbjField(field, finalNum);

      toast({ title: "Nomor Ditarik", description: finalNum });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal Tarik Nomor" });
    } finally {
      setIsFetchingNumber(null)
    }
  }

  const handleSaveToAgenda = async (field: string, subCode: string) => {
    let value = "";
    if (field === "nomor_bast") value = spjData[field];
    else value = pbjData[field];

    if (!db || !user || !value) {
      toast({ variant: "destructive", title: "Nomor Kosong" });
      return;
    }
    setIsSavingToAgenda(field);
    try {
      await saveToBukuAgenda(db, {
        kategori: "surat_keluar",
        nomor: value,
        perihal: `${subCode}: ${activity?.namaKegiatan || 'Kegiatan Fisik'}`,
        userId: user.uid
      });
      toast({ title: "Tersimpan ke Agenda", description: value });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal Simpan" });
    } finally {
      setIsSavingToAgenda(null);
    }
  }

  const handleGenericSave = async (data: any, setLoading: (b: boolean) => void) => {
    if (!db || !id) return
    setLoading(true)
    try {
      await setDoc(doc(db, "physical_activities", id), {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true })
      toast({ title: "Perubahan Tersimpan" })
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal Simpan" })
    } finally {
      setLoading(false)
    }
  }

  const handleClearPhotoHistory = async () => {
    if (!confirm("Hapus seluruh histori foto yang sudah diunggah? Tindakan ini tidak dapat dibatalkan.")) return;

    const clearedData = {
      ...spjData,
      physicalPhotos: { p0: [], p50: [], p100: [] },
      nonPhysicalPhotos: { f1: [], f2: [] }
    };

    setSpjData(clearedData);
    await handleGenericSave(clearedData, setIsSavingSPJ);
    toast({ title: "Histori Dihapus", description: "Daftar foto telah dikosongkan." });
  }

  const handleGeneratePDF = async (docType: string, label: string) => {
    if (!activity) return
    setIsGenerating(docType)
    try {
      // Otomatis sinkronkan dan simpan data foto saat cetak dokumentasi
      if (docType === 'spj_foto_fisik' && db && id) {
        await setDoc(doc(db, "physical_activities", id), {
          photoMode: spjData.photoMode,
          physicalPhotos: spjData.physicalPhotos,
          nonPhysicalPhotos: spjData.nonPhysicalPhotos,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => console.warn("Auto-save photo on print warning:", err));
      }

      const pdfBlob = await generatePhysicalDocPDF(docType, {
        ...activity,
        ...pbjData,
        ...spjData,
        nama_sekdes: sekdesName
      }, villageSettings?.logoBase64)
      const url = URL.createObjectURL(pdfBlob)
      window.open(url, "_blank")
    } catch (e: any) {
      console.error("Gagal generate PDF:", e)
      toast({ variant: "destructive", title: "Gagal PDF", description: e?.message || "Terjadi kesalahan saat membuat file PDF." })
    } finally {
      setIsGenerating(null)
    }
  }

  const handleDownloadDocx = async (docType: string, label: string) => {
    if (!activity) return
    setIsGeneratingDocx(docType)
    setLastError(null)
    try {
      let actualTemplate = docType;
      if (docType === 'pbj_sistem') actualTemplate = 'PBJ SISTEM.docx';

      const response = await fetch('/api/generate-docx/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            ...activity,
            ...pbjData,
            ...spjData,
            nama_sekdes: sekdesName
          },
          type: actualTemplate
        }),
      });
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || "Gagal menghubungi server generator.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.body.appendChild(document.createElement('a'));
      link.href = url;
      link.download = `${label.replace(/\s+/g, '_')}.docx`;
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Unduh Berhasil" })
    } catch (e: any) {
      setLastError(e.message);
      toast({ variant: "destructive", title: "Error Generator" })
    } finally {
      setIsGeneratingDocx(null)
    }
  }

  const LabelDocx = ({ label, placeholder, onTarik, isTarikLoading, onSimpan, isSimpanLoading }: any) => (
    <div className="flex items-center justify-between mb-1.5 px-1 gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider whitespace-nowrap">{label}</Label>
        {placeholder && <code className="text-[9px] font-bold text-primary/40">{"{{"}{placeholder}{"}}"}</code>}
      </div>
      <div className="flex items-center gap-3">
        {onTarik && (
          <button type="button" onClick={onTarik} disabled={isTarikLoading || isSimpanLoading} className="text-[9px] font-black text-primary uppercase hover:underline flex items-center gap-1 shrink-0">
            {isTarikLoading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />} Tarik Nomor
          </button>
        )}
        {onSimpan && (
          <button type="button" onClick={onSimpan} disabled={isTarikLoading || isSimpanLoading} className="text-[9px] font-black text-emerald-600 uppercase hover:underline flex items-center gap-1 shrink-0">
            {isSimpanLoading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Save className="h-2.5 w-2.5" />} Simpan
          </button>
        )}
      </div>
    </div>
  );

  const updateSurveyItem = (index: number, field: string, value: string) => {
    const newItems = [...spjData.survey_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setSpjData({ ...spjData, survey_items: newItems });
  }

  const addSurveyRow = () => {
    const newItems = [...spjData.survey_items];
    newItems.push({ no: newItems.length + 1, nama: "", satuan: "", h1: "", h2: "", h3: "", h4: "", hps: "", ppn: "0", pph: "0" });
    setSpjData({ ...spjData, survey_items: newItems });
  }

  const removeSurveyRow = (index: number) => {
    if (spjData.survey_items.length <= 1) return;
    const newItems = spjData.survey_items.filter((_: any, i: number) => i !== index).map((item: any, i: number) => ({ ...item, no: i + 1 }));
    setSpjData({ ...spjData, survey_items: newItems });
  }

  if (isDataLoading) return <div className="min-h-screen bg-white dark:bg-[#081d27] flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-emerald-800" /></div>

  const sections = [
    { id: "spj", label: "SPJ & Dokumentasi", icon: FileCheck, color: "text-emerald-800" },
    { id: "pbj", label: "PBJ & Pengadaan", icon: ShieldCheck, color: "text-slate-800" }
  ]

  const shopOptions = [
    { id: "nama_toko1", name: spjData.nama_toko1 },
    { id: "nama_toko2", name: spjData.nama_toko2 },
    { id: "nama_toko3", name: spjData.nama_toko3 },
    { id: "nama_toko4", name: spjData.nama_toko4 }
  ].filter(s => s.name && s.name.trim() !== "").slice(0, spjData.num_shops || 3);

  return (
    <div className="min-h-screen bg-white dark:bg-[#081d27] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 pb-32">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-[2rem] bg-white dark:bg-[#081d27] shadow-md border border-white/80">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild className="h-10 w-10 rounded-xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] transition-all">
              <Link href="/manajemen/dokumen-fisik/"><ArrowLeft className="h-5 w-5 text-slate-800" /></Link>
            </Button>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#081d27] text-emerald-800 shadow-inner border border-stone-300/50 text-[10px] font-black uppercase tracking-wider mb-1">
                <FileText className="h-3.5 w-3.5 text-emerald-700" />
                Generator Berkas
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">{activity?.namaKegiatan}</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Otomatisasi Dokumen TA {activity?.tahunAnggaran}</p>
            </div>
          </div>
          <Button asChild variant="outline" className="h-11 rounded-xl gap-2 font-black uppercase text-xs tracking-wider bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] text-slate-800 transition-all">
            <Link href={`/manajemen/dokumen-fisik/editor/?id=${id}`}><Edit className="h-4 w-4 text-emerald-800" /> Edit Master Data</Link>
          </Button>
        </header>

        {/* RINGKASAN PROYEK DI ATAS SENDIRI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 overflow-hidden">
            <CardHeader className="bg-[#e4e0d9]/60 p-6 border-b border-stone-300/60 pb-4">
              <CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-slate-700 tracking-wider">
                <History className="h-4 w-4 text-emerald-800" /> Informasi Utama Pembangunan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col sm:flex-row justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-emerald-700" /> Lokasi Kegiatan</p>
                  <p className="text-sm font-black uppercase text-slate-900 leading-tight">{activity?.lokasi}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-700" /> Total Anggaran</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Rp {new Intl.NumberFormat('id-ID').format(pbjData.nominal_cvpemenang || activity?.anggaran || 0)}</p>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40">
                <div className="h-12 w-12 rounded-xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 flex items-center justify-center">
                  <Coins className="h-6 w-6 text-emerald-800" />
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400">Sumber Dana</p>
                  <p className="text-xs font-black uppercase text-slate-900">{activity?.sumber_dana || 'Dana Desa (DD)'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-1 gap-6">
            <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 flex flex-col items-center justify-center p-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center mb-2">
                <FileCheck className="h-6 w-6 text-emerald-800" />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Status Berkas</p>
              <p className="text-xs font-black text-emerald-900 uppercase mt-1">SIAP DOKUMEN</p>
            </Card>
            <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 flex flex-col items-center justify-center p-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center mb-2">
                <Calendar className="h-6 w-6 text-emerald-800" />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tahun Anggaran</p>
              <p className="text-xl font-black text-slate-900">{activity?.tahunAnggaran || '2026'}</p>
            </Card>
          </div>
        </div>

        {lastError && (
          <div className="p-6 rounded-[2rem] bg-rose-50/80 shadow-[inset_2px_2px_6px_#fca5a5,inset_-2px_-2px_6px_#ffffff] border border-rose-200 flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-black text-rose-900 uppercase">Gagal Memproses Template Word</p>
              <p className="text-xs font-bold text-rose-700 leading-relaxed uppercase">{lastError}</p>
            </div>
          </div>
        )}

        <div className="w-full">
          <Tabs defaultValue="spj" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-16 bg-white dark:bg-[#081d27] p-1.5 rounded-2xl shadow-inner border border-stone-300/40 mb-8 gap-2">
              {sections.map((s) => (
                <TabsTrigger
                  key={s.id}
                  value={s.id}
                  className="flex items-center justify-center gap-2 text-xs font-black uppercase rounded-xl h-full data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 transition-all text-slate-600"
                >
                  <s.icon className="h-4 w-4 text-emerald-800" /><span>{s.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* TAB 1: SPJ */}
            <TabsContent value="spj" className="space-y-8 animate-in fade-in duration-300">
              <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 overflow-hidden">
                <CardHeader className="p-6 sm:p-8 bg-[#e4e0d9]/60 border-b border-stone-300/60">
                  <CardTitle className="text-lg sm:text-xl font-black uppercase flex items-center gap-3 text-slate-900">
                    <Camera className="h-6 w-6 text-emerald-800" /> 1. Cetak Foto Fisik dan Non Fisik
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-8">
                  <div className="space-y-4 p-6 bg-white dark:bg-[#081d27] rounded-2xl shadow-inner border border-stone-300/40">
                    <Label className="text-[10px] font-black uppercase text-emerald-800 tracking-widest ml-1">Pilih Mode Dokumentasi</Label>
                    <RadioGroup value={spjData.photoMode} onValueChange={v => setSpjData({ ...spjData, photoMode: v })} className="flex flex-wrap gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fisik" id="mode-fisik" className="border-stone-400 text-emerald-800" />
                        <Label htmlFor="mode-fisik" className="font-black text-xs text-slate-900 uppercase">FOTO FISIK (PROGRES %)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="non-fisik" id="mode-non-fisik" className="border-stone-400 text-emerald-800" />
                        <Label htmlFor="mode-non-fisik" className="font-black text-xs text-slate-900 uppercase">FOTO NON FISIK (BUKTI KEGIATAN)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {spjData.photoMode === "fisik" ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
                      <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40">
                        <span className="inline-block px-3 py-1 rounded-full bg-white dark:bg-[#081d27] text-emerald-800 shadow-inner border border-stone-300/50 text-[10px] font-black uppercase">
                          HALAMAN 1 (0%)
                        </span>
                        <ImageUploader
                          label="Foto 0%"
                          initialUrls={spjData.physicalPhotos?.p0 || []}
                          onUrlsChange={(urls: string[]) => setSpjData((p: any) => ({ ...p, physicalPhotos: { ...p.physicalPhotos, p0: urls } }))}
                          onUploadComplete={(urls: string[]) => setSpjData((p: any) => ({ ...p, physicalPhotos: { ...p.physicalPhotos, p0: urls } }))}
                        />
                      </div>
                      <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40">
                        <span className="inline-block px-3 py-1 rounded-full bg-white dark:bg-[#081d27] text-emerald-800 shadow-inner border border-stone-300/50 text-[10px] font-black uppercase">
                          HALAMAN 2 (50%)
                        </span>
                        <ImageUploader
                          label="Foto 50%"
                          initialUrls={spjData.physicalPhotos?.p50 || []}
                          onUrlsChange={(urls: string[]) => setSpjData((p: any) => ({ ...p, physicalPhotos: { ...p.physicalPhotos, p50: urls } }))}
                          onUploadComplete={(urls: string[]) => setSpjData((p: any) => ({ ...p, physicalPhotos: { ...p.physicalPhotos, p50: urls } }))}
                        />
                      </div>
                      <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40">
                        <span className="inline-block px-3 py-1 rounded-full bg-white dark:bg-[#081d27] text-emerald-800 shadow-inner border border-stone-300/50 text-[10px] font-black uppercase">
                          HALAMAN 3 (100%)
                        </span>
                        <ImageUploader
                          label="Foto 100%"
                          initialUrls={spjData.physicalPhotos?.p100 || []}
                          onUrlsChange={(urls: string[]) => setSpjData((p: any) => ({ ...p, physicalPhotos: { ...p.physicalPhotos, p100: urls } }))}
                          onUploadComplete={(urls: string[]) => setSpjData((p: any) => ({ ...p, physicalPhotos: { ...p.physicalPhotos, p100: urls } }))}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                      <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40">
                        <span className="inline-block px-3 py-1 rounded-full bg-white dark:bg-[#081d27] text-emerald-800 shadow-inner border border-stone-300/50 text-[10px] font-black uppercase">
                          DOKUMENTASI FOTO 1
                        </span>
                        <ImageUploader
                          label="Foto Bukti 1"
                          initialUrls={spjData.nonPhysicalPhotos?.f1 || []}
                          onUrlsChange={(urls: string[]) => setSpjData((p: any) => ({ ...p, nonPhysicalPhotos: { ...p.nonPhysicalPhotos, f1: urls } }))}
                          onUploadComplete={(urls: string[]) => setSpjData((p: any) => ({ ...p, nonPhysicalPhotos: { ...p.nonPhysicalPhotos, f1: urls } }))}
                        />
                      </div>
                      <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40">
                        <span className="inline-block px-3 py-1 rounded-full bg-white dark:bg-[#081d27] text-emerald-800 shadow-inner border border-stone-300/50 text-[10px] font-black uppercase">
                          DOKUMENTASI FOTO 2
                        </span>
                        <ImageUploader
                          label="Foto Bukti 2"
                          initialUrls={spjData.nonPhysicalPhotos?.f2 || []}
                          onUrlsChange={(urls: string[]) => setSpjData((p: any) => ({ ...p, nonPhysicalPhotos: { ...p.nonPhysicalPhotos, f2: urls } }))}
                          onUploadComplete={(urls: string[]) => setSpjData((p: any) => ({ ...p, nonPhysicalPhotos: { ...p.nonPhysicalPhotos, f2: urls } }))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-stone-300/60">
                    <Button onClick={() => handleGenericSave(spjData, setIsSavingSPJ)} disabled={isSavingSPJ} className="h-14 flex-1 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black uppercase text-xs tracking-wider shadow-sm border border-white/40 gap-2 active:scale-95 transition-all">
                      {isSavingSPJ ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />} Simpan Data Foto
                    </Button>
                    <Button onClick={() => handleGeneratePDF('spj_foto_fisik', 'Laporan Dokumentasi Foto')} disabled={!!isGenerating} variant="outline" className="h-14 flex-1 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] text-slate-800 font-black uppercase text-xs tracking-wider transition-all">
                      {isGenerating === 'spj_foto_fisik' ? <Loader2 className="h-5 w-5" /> : <Printer className="h-5 w-5 mr-2 text-emerald-800" />} Cetak PDF Dokumentasi
                    </Button>
                    <Button onClick={handleClearPhotoHistory} disabled={isSavingSPJ} variant="ghost" className="h-14 px-6 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 text-rose-600 hover:bg-rose-50 font-black uppercase text-xs tracking-wider gap-2 transition-all">
                      <Trash2 className="h-4 w-4" /> Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 overflow-hidden">
                <CardHeader className="p-6 sm:p-8 bg-[#e4e0d9]/60 border-b border-stone-300/60">
                  <CardTitle className="text-lg sm:text-xl font-black uppercase flex items-center gap-3 text-slate-900">
                    <FileCheck className="h-6 w-6 text-emerald-800" /> 2. Berita Acara Serah Terima (BAST)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <LabelDocx label="Nomor BAST" onTarik={() => handlePullNumber("nomor_bast", "BAST")} isTarikLoading={isFetchingNumber === "nomor_bast"} onSimpan={() => handleSaveToAgenda("nomor_bast", "BAST")} isSimpanLoading={isSavingToAgenda === "nomor_bast"} />
                      <Input
                        value={spjData.nomor_bast}
                        onChange={e => setSpjData({ ...spjData, nomor_bast: e.target.value })}
                        className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4 placeholder:text-slate-400"
                        placeholder="Otomatis Tarik Nomor..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Pilih Tanggal BAST</Label>
                      <Input
                        type="date"
                        value={spjData.tanggal_bast}
                        onChange={e => setSpjData({ ...spjData, tanggal_bast: e.target.value })}
                        className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-stone-300/60">
                    <Button onClick={() => handleGenericSave(spjData, setIsSavingSPJ)} disabled={isSavingSPJ} className="h-14 flex-1 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black uppercase text-xs tracking-wider shadow-sm border border-white/40 gap-2 active:scale-95 transition-all">
                      {isSavingSPJ ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />} Simpan Data BAST
                    </Button>
                    <Button
                      onClick={() => handleGeneratePDF('spj_bast_full', 'BAST 100%')}
                      disabled={!!isGenerating || !spjData.nomor_bast}
                      variant="outline"
                      className="h-14 flex-1 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] text-slate-800 font-black uppercase text-xs tracking-wider gap-2 transition-all"
                    >
                      {isGenerating === 'spj_bast_full' ? <Loader2 className="animate-spin h-5 w-5" /> : <Download className="h-5 w-5 text-emerald-800" />}
                      Unduh BAST (PDF)
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 overflow-hidden">
                <CardHeader className="p-6 sm:p-8 bg-[#e4e0d9]/60 border-b border-stone-300/60">
                  <CardTitle className="text-lg sm:text-xl font-black uppercase flex items-center gap-3 text-slate-900">
                    <ShoppingCart className="h-6 w-6 text-emerald-800" /> 3. Form Survey Harga & HPS
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-8">
                  <div className="p-6 bg-white dark:bg-[#081d27] rounded-2xl shadow-inner border border-stone-300/40 space-y-6">
                    <div className="space-y-2 max-w-xs">
                      <Label className="text-[10px] font-black uppercase text-slate-600 ml-1">Jumlah Toko Survey</Label>
                      <Select value={spjData.num_shops?.toString() || "3"} onValueChange={v => setSpjData({ ...spjData, num_shops: parseInt(v) })}>
                        <SelectTrigger className="h-12 bg-white dark:bg-[#081d27] rounded-xl shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl bg-white dark:bg-[#081d27] shadow-lg border border-white/80 text-slate-900">
                          <SelectItem value="2" className="font-bold text-xs focus:bg-emerald-50 focus:text-emerald-900 rounded-lg">2 TOKO</SelectItem>
                          <SelectItem value="3" className="font-bold text-xs focus:bg-emerald-50 focus:text-emerald-900 rounded-lg">3 TOKO</SelectItem>
                          <SelectItem value="4" className="font-bold text-xs focus:bg-emerald-50 focus:text-emerald-900 rounded-lg">4 TOKO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-600">Nama Toko 1</Label>
                        <Input placeholder="TOKO A" value={spjData.nama_toko1} onChange={e => setSpjData({ ...spjData, nama_toko1: e.target.value.toUpperCase() })} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-600">Nama Toko 2</Label>
                        <Input placeholder="TOKO B" value={spjData.nama_toko2} onChange={e => setSpjData({ ...spjData, nama_toko2: e.target.value.toUpperCase() })} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900" />
                      </div>
                      {(spjData.num_shops >= 3) && (
                        <div className="space-y-2 animate-in fade-in">
                          <Label className="text-[10px] font-black uppercase text-slate-600">Nama Toko 3</Label>
                          <Input placeholder="TOKO C" value={spjData.nama_toko3} onChange={e => setSpjData({ ...spjData, nama_toko3: e.target.value.toUpperCase() })} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900" />
                        </div>
                      )}
                      {(spjData.num_shops >= 4) && (
                        <div className="space-y-2 animate-in fade-in">
                          <Label className="text-[10px] font-black uppercase text-slate-600">Nama Toko 4</Label>
                          <Input placeholder="TOKO D" value={spjData.nama_toko4} onChange={e => setSpjData({ ...spjData, nama_toko4: e.target.value.toUpperCase() })} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="rounded-2xl overflow-hidden shadow-inner border border-stone-300/40 bg-white dark:bg-[#081d27]">
                      <ScrollArea className="w-full whitespace-nowrap">
                        <div className="min-w-[1200px]">
                          <Table>
                            <TableHeader className="bg-[#e4e0d9]/90 border-b border-stone-300/60 sticky top-0 z-10 backdrop-blur-md">
                              <TableRow className="border-stone-300/40">
                                <TableHead className="w-[50px] text-center text-[10px] font-black uppercase text-slate-700">NO</TableHead>
                                <TableHead className="w-[300px] text-[10px] font-black uppercase text-slate-700">NAMA JENIS BARANG</TableHead>
                                <TableHead className="w-[100px] text-[10px] font-black uppercase text-slate-700">SATUAN</TableHead>
                                {[...Array(spjData.num_shops || 3)].map((_, i) => (
                                  <TableHead key={i} className="w-[140px] text-[10px] font-black uppercase text-slate-700">HRG T{i + 1}</TableHead>
                                ))}
                                <TableHead className="w-[140px] text-[10px] font-black uppercase text-emerald-900 bg-emerald-500/10">HPS</TableHead>
                                <TableHead className="w-[90px] text-center text-[10px] font-black uppercase text-slate-700">PPN (%)</TableHead>
                                <TableHead className="w-[90px] text-center text-[10px] font-black uppercase text-slate-700">PPH (%)</TableHead>
                                <TableHead className="w-[60px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {spjData.survey_items.map((item: any, idx: number) => (
                                <TableRow key={idx} className="hover:bg-[#e4e0d9]/50 border-b border-stone-300/30 transition-colors">
                                  <TableCell className="text-center font-bold text-xs text-slate-500">{idx + 1}</TableCell>
                                  <TableCell><Input className="h-10 text-xs font-bold uppercase w-full bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 rounded-lg text-slate-900" placeholder="Contoh: Semen..." value={item.nama} onChange={e => updateSurveyItem(idx, 'nama', e.target.value)} /></TableCell>
                                  <TableCell><Input className="h-10 text-xs uppercase w-full bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 rounded-lg text-slate-900" placeholder="SAK/M3" value={item.satuan} onChange={e => updateSurveyItem(idx, 'satuan', e.target.value)} /></TableCell>
                                  {[...Array(spjData.num_shops || 3)].map((_, i) => (
                                    <TableCell key={i}>
                                      <Input
                                        type="number"
                                        className="h-10 text-xs font-mono font-bold w-full bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 rounded-lg text-slate-900"
                                        placeholder="0"
                                        value={item[`h${i + 1}` as keyof any]}
                                        onChange={e => updateSurveyItem(idx, `h${i + 1}`, e.target.value)}
                                      />
                                    </TableCell>
                                  ))}
                                  <TableCell className="bg-emerald-500/10"><Input type="number" className="h-10 text-xs font-mono font-black text-emerald-900 w-full bg-white dark:bg-[#081d27] shadow-inner border border-emerald-600/40 rounded-lg" placeholder="0" value={item.hps} onChange={e => updateSurveyItem(idx, 'hps', e.target.value)} /></TableCell>
                                  <TableCell><Input type="number" className="h-10 text-xs text-center font-bold w-full bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 rounded-lg text-slate-900" placeholder="0" value={item.ppn} onChange={e => updateSurveyItem(idx, 'ppn', e.target.value)} /></TableCell>
                                  <TableCell><Input type="number" className="h-10 text-xs text-center font-bold w-full bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 rounded-lg text-slate-900" placeholder="0" value={item.pph} onChange={e => updateSurveyItem(idx, 'pph', e.target.value)} /></TableCell>
                                  <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg" onClick={() => removeSurveyRow(idx)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                        <Info className="h-3.5 w-3.5 text-emerald-800" /> Geser tabel ke samping untuk isi harga dan pajak
                      </p>
                      <Button variant="outline" className="w-full sm:w-auto h-11 bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] text-emerald-800 gap-2 font-black uppercase text-[10px] rounded-xl px-8 transition-all" onClick={addSurveyRow}>
                        <Plus className="h-4 w-4" /> Tambah Baris Barang
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-stone-300/60">
                    <Button onClick={() => handleGenericSave(spjData, setIsSavingSPJ)} disabled={isSavingSPJ} className="h-14 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black uppercase text-xs tracking-wider shadow-sm border border-white/40 gap-2 active:scale-95 transition-all">
                      {isSavingSPJ ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />} Simpan Isian
                    </Button>
                    <Button
                      onClick={() => handleGeneratePDF('spj_survey_harga', 'Form Survey Harga')}
                      disabled={!!isGenerating || !spjData.nama_toko1}
                      variant="outline"
                      className="h-14 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] text-slate-800 font-black uppercase text-xs tracking-wider gap-2 transition-all"
                    >
                      {isGenerating === 'spj_survey_harga' ? <Loader2 className="animate-spin h-5 w-5" /> : <Store className="h-5 w-5 text-emerald-800" />}
                      Cetak Survey Toko
                    </Button>
                    <Button
                      onClick={() => handleGeneratePDF('spj_hps_kegiatan', 'Daftar HPS')}
                      disabled={!!isGenerating || !spjData.nama_toko1}
                      variant="outline"
                      className="h-14 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] text-slate-800 font-black uppercase text-xs tracking-wider gap-2 transition-all"
                    >
                      {isGenerating === 'spj_hps_kegiatan' ? <Loader2 className="animate-spin h-5 w-5" /> : <ClipboardList className="h-5 w-5 text-emerald-800" />}
                      Cetak Dokumen HPS
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 overflow-hidden">
                <CardHeader className="p-6 sm:p-8 bg-[#e4e0d9]/60 border-b border-stone-300/60">
                  <CardTitle className="text-lg sm:text-xl font-black uppercase flex items-center gap-3 text-slate-900">
                    <Scale className="h-6 w-6 text-emerald-800" /> 4. BERITA ACARA PENETAPAN HARGA PERKIRAAN SENDIRI (HPS)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-emerald-800 ml-1">Pilih Toko Pemakai HPS (Mufakat)</Label>
                      <Select value={spjData.selected_shop_hps} onValueChange={v => setSpjData({ ...spjData, selected_shop_hps: v })}>
                        <SelectTrigger className="h-12 bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 rounded-xl font-bold text-xs text-slate-900">
                          <SelectValue placeholder="Pilih Toko..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl bg-white dark:bg-[#081d27] shadow-lg border border-white/80 text-slate-900">
                          {shopOptions.map(opt => (
                            <SelectItem key={opt.id} value={opt.name} className="font-bold text-xs focus:bg-emerald-50 focus:text-emerald-900 rounded-lg">{opt.name}</SelectItem>
                          ))}
                          {shopOptions.length === 0 && <SelectItem disabled value="none">Isi Nama Toko di Survey Terlebih Dahulu</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-600">Pilih Tanggal BA</Label>
                      <Input type="date" value={spjData.ba_hps_date} onChange={e => setSpjData({ ...spjData, ba_hps_date: e.target.value })} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-600">Pilih Waktu</Label>
                      <Input type="time" value={spjData.ba_hps_time} onChange={e => setSpjData({ ...spjData, ba_hps_time: e.target.value })} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-600">Isian Tempat</Label>
                      <Input value={spjData.ba_hps_location} onChange={e => setSpjData({ ...spjData, ba_hps_location: e.target.value })} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-emerald-800 flex items-center gap-2"><Users className="h-4 w-4" /> Pimpinan Rapat</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-600">Nama Ketua</Label>
                        <Input value={spjData.ba_hps_leader_name} onChange={e => setSpjData({ ...spjData, ba_hps_leader_name: e.target.value.toUpperCase() })} placeholder="PIMPINAN MUSYAWARAH" className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-600">Nama Sekretaris</Label>
                        <Input value={spjData.ba_hps_secretary_name} onChange={e => setSpjData({ ...spjData, ba_hps_secretary_name: e.target.value.toUpperCase() })} placeholder="NOTULENSI / KASI KAUR" className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-emerald-800 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Narasumber Kegiatan</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="p-6 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-4">
                        <p className="text-[10px] font-black uppercase text-emerald-800">Narasumber 1</p>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-bold uppercase text-slate-500">Nama</Label>
                          <Input value={spjData.ba_hps_narsum1_name} onChange={e => setSpjData({ ...spjData, ba_hps_narsum1_name: e.target.value.toUpperCase() })} className="h-10 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 font-bold text-xs text-slate-900" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-bold uppercase text-slate-500">Instansi</Label>
                          <Input value={spjData.ba_hps_narsum1_inst} onChange={e => setSpjData({ ...spjData, ba_hps_narsum1_inst: e.target.value.toUpperCase() })} className="h-10 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 font-bold text-xs text-slate-900" />
                        </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-4">
                        <p className="text-[10px] font-black uppercase text-emerald-800">Narasumber 2</p>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-bold uppercase text-slate-500">Nama</Label>
                          <Input value={spjData.ba_hps_narsum2_name} onChange={e => setSpjData({ ...spjData, ba_hps_narsum2_name: e.target.value.toUpperCase() })} className="h-10 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 font-bold text-xs text-slate-900" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-bold uppercase text-slate-500">Instansi</Label>
                          <Input value={spjData.ba_hps_narsum2_inst} onChange={e => setSpjData({ ...spjData, ba_hps_narsum2_inst: e.target.value.toUpperCase() })} className="h-10 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 font-bold text-xs text-slate-900" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-stone-300/60">
                    <Button onClick={() => handleGenericSave(spjData, setIsSavingSPJ)} disabled={isSavingSPJ} className="h-14 flex-1 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black uppercase text-xs tracking-wider shadow-sm border border-white/40 gap-2 active:scale-95 transition-all">
                      {isSavingSPJ ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />} Simpan Isian BA HPS
                    </Button>
                    <Button
                      onClick={() => handleGeneratePDF('spj_ba_hps', 'Berita Acara Penetapan HPS')}
                      disabled={!!isGenerating || !spjData.ba_hps_leader_name}
                      variant="outline"
                      className="h-14 flex-1 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] text-slate-800 font-black uppercase text-xs tracking-wider gap-2 transition-all"
                    >
                      {isGenerating === 'spj_ba_hps' ? <Loader2 className="animate-spin h-5 w-5" /> : <Printer className="h-5 w-5 text-emerald-800" />}
                      Cetak PDF BA HPS
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: PBJ */}
            <TabsContent value="pbj" className="space-y-8 animate-in fade-in duration-300">
              <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 overflow-hidden">
                <CardHeader className="p-6 sm:p-8 bg-[#e4e0d9]/60 border-b border-stone-300/60">
                  <CardTitle className="text-lg sm:text-xl font-black uppercase flex items-center gap-3 text-slate-900">
                    <ShieldCheck className="h-6 w-6 text-emerald-800" /> Formulir Teknis PBJ
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 sm:p-8">
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-10 pb-10">
                      <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase text-emerald-800 flex items-center gap-2"><Users className="h-4 w-4" /> 1. TIM TPK</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <div className="space-y-2"><LabelDocx label="Ketua" placeholder="nama_ketua_tpk" /><Input value={pbjData.nama_ketua_tpk} onChange={e => updatePbjField("nama_ketua_tpk", e.target.value)} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900" /></div>
                          <div className="space-y-2"><LabelDocx label="Sekretaris" placeholder="nama_sekretaris_tpk" /><Input value={pbjData.nama_sekretaris_tpk} onChange={e => updatePbjField("nama_sekretaris_tpk", e.target.value)} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900" /></div>
                          <div className="space-y-2"><LabelDocx label="Anggota" placeholder="nama_anggota_tpk" /><Input value={pbjData.nama_anggota_tpk} onChange={e => updatePbjField("nama_anggota_tpk", e.target.value)} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900" /></div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase text-emerald-800 flex items-center gap-2"><FileText className="h-4 w-4" /> 2. PENOMORAN & TANGGAL UNDANGAN</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2"><LabelDocx label="No. Undangan PP" onTarik={() => handlePullNumber("nomor_und_permintaan_penawaran", "UND-PP")} isTarikLoading={isFetchingNumber === "nomor_und_permintaan_penawaran"} onSimpan={() => handleSaveToAgenda("nomor_und_permintaan_penawaran", "UND-PP")} isSimpanLoading={isSavingToAgenda === "nomor_und_permintaan_penawaran"} /><Input value={pbjData.nomor_und_permintaan_penawaran} onChange={e => updatePbjField("nomor_und_permintaan_penawaran", e.target.value)} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-mono text-xs text-slate-900" /></div>
                          <div className="space-y-2"><LabelDocx label="Tgl Undangan" placeholder="tanggal_und_permintaan_penawaran" /><Input type="date" value={pbjData.tanggal_und_permintaan_penawaran} onChange={e => updatePbjField("tanggal_und_permintaan_penawaran", e.target.value)} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900" /></div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase text-emerald-800 flex items-center gap-2"><Briefcase className="h-4 w-4" /> 3. DATA SUPLIYER 1</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40">
                          <div className="space-y-2"><LabelDocx label="Nama CV/Toko" placeholder="nama_cv1" /><Input value={pbjData.nama_cv1} onChange={e => updatePbjField("nama_cv1", e.target.value)} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 font-bold text-xs text-slate-900" /></div>
                          <div className="space-y-2"><LabelDocx label="Nama Pemilik" placeholder="nama_pemilik_cv1" /><Input value={pbjData.nama_pemilik_cv1} onChange={e => updatePbjField("nama_pemilik_cv1", e.target.value)} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 font-bold text-xs text-slate-900" /></div>
                          <div className="space-y-2 sm:col-span-2"><LabelDocx label="Nominal Penawaran" placeholder="nominal_cv1" /><Input type="number" value={pbjData.nominal_cv1} onChange={e => updatePbjField("nominal_cv1", e.target.value)} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 font-bold text-xs text-slate-900" /></div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase text-emerald-800 flex items-center gap-2"><Briefcase className="h-4 w-4" /> 4. DATA SUPLIYER 2</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40">
                          <div className="space-y-2"><LabelDocx label="Nama CV/Toko" placeholder="nama_cv2" /><Input value={pbjData.nama_cv2} onChange={e => updatePbjField("nama_cv2", e.target.value)} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 font-bold text-xs text-slate-900" /></div>
                          <div className="space-y-2"><LabelDocx label="Nama Pemilik" placeholder="nama_pemilik_cv2" /><Input value={pbjData.nama_pemilik_cv2} onChange={e => updatePbjField("nama_pemilik_cv2", e.target.value)} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 font-bold text-xs text-slate-900" /></div>
                          <div className="space-y-2 sm:col-span-2"><LabelDocx label="Nominal Penawaran" placeholder="nominal_cv2" /><Input type="number" value={pbjData.nominal_cv2} onChange={e => updatePbjField("nominal_cv2", e.target.value)} className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 font-bold text-xs text-slate-900" /></div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase text-emerald-800 flex items-center gap-2"><Sparkles className="h-4 w-4" /> 5. PENETAPAN PEMENANG</h3>
                        <div className="p-6 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-4">
                          <Label className="text-[10px] font-black uppercase text-emerald-800">Pilih Supplier Pemenang</Label>
                          <Select value={pbjData.pemenang_selection} onValueChange={v => updatePbjField("pemenang_selection", v)}>
                            <SelectTrigger className="h-12 bg-white dark:bg-[#081d27] rounded-xl shadow-inner border border-stone-300/40 font-bold text-xs text-slate-900">
                              <SelectValue placeholder="Pilih Pemenang..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl bg-white dark:bg-[#081d27] shadow-lg border border-white/80 text-slate-900">
                              <SelectItem value="none" className="font-bold text-xs focus:bg-emerald-50 focus:text-emerald-900 rounded-lg">Belum Dipilih</SelectItem>
                              <SelectItem value="cv1" className="font-bold text-xs focus:bg-emerald-50 focus:text-emerald-900 rounded-lg">{pbjData.nama_cv1 || "Supplier 1"}</SelectItem>
                              <SelectItem value="cv2" className="font-bold text-xs focus:bg-emerald-50 focus:text-emerald-900 rounded-lg">{pbjData.nama_cv2 || "Supplier 2"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                  <div className="pt-6 border-t border-stone-300/60 flex flex-col sm:flex-row gap-4">
                    <Button onClick={() => handleGenericSave(pbjData, setIsSavingPBJ)} disabled={isSavingPBJ} className="h-14 flex-1 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black uppercase text-xs tracking-wider shadow-sm border border-white/40 gap-2 active:scale-95 transition-all">
                      {isSavingPBJ ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />} Simpan Isian PBJ
                    </Button>
                    <Button onClick={() => handleDownloadDocx('pbj_sistem', 'PBJ Sistem Lengkap')} disabled={!!isGeneratingDocx} variant="outline" className="h-14 flex-1 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] text-slate-800 font-black uppercase text-xs tracking-wider gap-2 transition-all">
                      {isGeneratingDocx === 'pbj_sistem' ? <Loader2 className="animate-spin h-4 w-4" /> : <Download className="h-4 w-4 text-emerald-800" />} UNDUH DOCX PBJ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
