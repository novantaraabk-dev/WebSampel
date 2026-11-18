"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Archive,
  FileText,
  Scale,
  Loader2,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  AlertCircle,
  Database,
  Layers,
  Activity,
  Calendar,
  Mail,
  Building2,
  Inbox,
  Filter,
  Clock,
  MapPin,
  UserCheck,
  Wallet
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, doc, orderBy, query, where } from "firebase/firestore"
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { GOOGLE_CONFIG } from "@/lib/google-config"
import { BIDANG_NAMES } from "@/lib/apbdes-data"
import { cn } from "@/lib/utils"

export default function ArsipDokumenPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Form states for SPJ (Integrated with APBDes Firestore)
  const [spjTipeApbdes, setSpjTipeApbdes] = useState<"APBDes" | "APBDes Perubahan">("APBDes")
  const [spjTahun, setSpjTahun] = useState(new Date().getFullYear().toString())
  const [spjBidang, setSpjBidang] = useState("")
  const [spjSumber, setSpjSumber] = useState("")
  const [spjKegiatan, setSpjKegiatan] = useState("")
  const [spjBulan, setSpjBulan] = useState("")

  // Form states for Produk Hukum
  const [phNamaDokumen, setPhNamaDokumen] = useState("")
  const [phJenis, setPhJenis] = useState("")
  const [phJenisManual, setPhPhJenisManual] = useState("")
  const [phNomor, setPhNomor] = useState("")

  // Form states for Surat Desa (Internal & Eksternal)
  const [suratTipe, setSuratTipe] = useState<"Internal" | "Eksternal">("Eksternal")
  const [suratPerihal, setSuratPerihal] = useState("")
  const [suratNomor, setSuratNomor] = useState("")
  const [suratTanggal, setSuratTanggal] = useState(new Date().toISOString().split('T')[0])
  const [suratAsal, setSuratAsal] = useState("")
  const [suratDisposisi, setSuratDisposisi] = useState("")
  const [suratKeterangan, setSuratKeterangan] = useState("")
  const [suratSelectedFile, setSuratSelectedFile] = useState<File | null>(null)
  const [suratFilter, setSuratFilter] = useState<"semua" | "Internal" | "Eksternal">("semua")

  // LIVE APBDes Fetching from Firestore filtered by Tahun
  const apbQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "apbdes"),
      where("tahun", "==", spjTahun),
      orderBy("kode", "asc")
    )
  }, [db, user, spjTahun])
  const { data: apbData } = useCollection<any>(apbQuery)

  // APBDes Filtering logic for SPJ (disesuaikan dengan Jenis APBDes / APBDes Perubahan)
  const filteredSources = useMemo(() => {
    if (!spjBidang || !apbData) return []
    const sources = apbData
      .filter((item: any) => {
        const itemTipe = item.tipe || "APBDes";
        return item.bidang.toString() === spjBidang && itemTipe === spjTipeApbdes;
      })
      .map((item: any) => item.sumber)
    return Array.from(new Set(sources))
  }, [spjBidang, apbData, spjTipeApbdes])

  const filteredActivities = useMemo(() => {
    if (!spjBidang || !spjSumber || !apbData) return []
    return apbData.filter((item: any) => {
      const itemTipe = item.tipe || "APBDes";
      return item.bidang.toString() === spjBidang && item.sumber === spjSumber && itemTipe === spjTipeApbdes;
    })
  }, [spjBidang, spjSumber, apbData, spjTipeApbdes])

  // GLOBAL DATA FETCHING
  const villageSettingsRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "settings", "village")
  }, [db])
  const { data: villageSettings } = useDoc(villageSettingsRef)

  const spjRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "spjDesa"), orderBy("createdAt", "desc"))
  }, [db, user])

  const phRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "produkHukum"), orderBy("createdAt", "desc"))
  }, [db, user])

  // Koleksi Arsip Surat Desa (Otomatis dari Agenda & Arsip Manual)
  const suratRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "suratDesa"), orderBy("createdAt", "desc"))
  }, [db, user])

  const { data: spjList, isLoading: isSpjLoading } = useCollection(spjRef)
  const { data: phList, isLoading: isPhLoading } = useCollection(phRef)
  const { data: suratList, isLoading: isSuratLoading } = useCollection(suratRef)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast({ variant: "destructive", title: "Format Salah", description: "Hanya file PDF yang diperbolehkan." })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleSuratFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedExts = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"]
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
      if (!allowedExts.includes(ext) && file.type !== "application/pdf") {
        toast({ variant: "destructive", title: "Format Salah", description: "Gunakan file dokumen PDF atau Gambar (JPG/PNG)." })
        return
      }
      setSuratSelectedFile(file)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = error => reject(error)
    })
  }

  const uploadToDrive = async (fileName: string, targetFolderId: string, customFile?: File | null) => {
    const fileToUpload = customFile || selectedFile
    if (!fileToUpload) return null
    if (!targetFolderId) {
      toast({ variant: "destructive", title: "Folder Belum Diatur", description: "Silakan atur folder penyimpanan di halaman Pengaturan." })
      return null
    }

    const base64 = await fileToBase64(fileToUpload)
    const payload = {
      action: 'uploadArchiveFile',
      folderId: targetFolderId,
      fileName,
      fileData: {
        type: fileToUpload.type,
        base64: base64
      }
    }

    try {
      const response = await fetch(GOOGLE_CONFIG.appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        redirect: "follow"
      })
      const result = await response.json()
      return result.success ? result : null
    } catch (e) {
      console.error("Upload error:", e)
      return null
    }
  }

  const handleSaveSpj = async () => {
    if (!user || !spjTahun || !spjBidang || !spjKegiatan || !spjSumber || !spjBulan || !selectedFile) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "Mohon isi semua bidang dan pilih file PDF." })
      return
    }

    const targetFolderId = villageSettings?.spjFolderId;
    if (!targetFolderId) {
      toast({ variant: "destructive", title: "Folder Belum Diatur", description: "ID Folder SPJ belum diisi di Pengaturan." })
      return
    }

    setIsUploading(true)
    try {
      const fileName = `${spjKegiatan} | ${spjSumber} | ${spjTipeApbdes} TA ${spjTahun} | ${spjBulan}.pdf`
      const driveResult = await uploadToDrive(fileName, targetFolderId, selectedFile)

      if (driveResult) {
        const docData = {
          createdBy: user.uid,
          tipeApbdes: spjTipeApbdes,
          tahun: spjTahun,
          bidang: spjBidang,
          kegiatan: spjKegiatan,
          sumberAnggaran: spjSumber,
          bulan: spjBulan,
          fileUrl: driveResult.fileUrl,
          driveFileId: driveResult.fileId,
          createdAt: new Date().toISOString()
        }
        const ref = collection(db, "spjDesa")
        addDocumentNonBlocking(ref, docData)
        toast({ title: "Berhasil", description: `SPJ Desa (${spjTipeApbdes}) telah diarsipkan secara global.` })
        setSpjBidang(""); setSpjKegiatan(""); setSpjSumber(""); setSpjBulan(""); setSelectedFile(null)
      } else {
        throw new Error("Gagal unggah ke Drive. Cek izin akses folder.")
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal Simpan", description: e.message })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSavePh = async () => {
    const finalJenis = phJenis === "Lainnya" ? phJenisManual : phJenis
    if (!user || !phNamaDokumen || !finalJenis || !phNomor || !selectedFile) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "Mohon isi semua bidang dan pilih file PDF." })
      return
    }

    const targetFolderId = villageSettings?.produkHukumFolderId;
    if (!targetFolderId) {
      toast({ variant: "destructive", title: "Folder Belum Diatur", description: "ID Folder Produk Hukum belum diisi di Pengaturan." })
      return
    }

    setIsUploading(true)
    try {
      const fileName = `${phNamaDokumen} | ${finalJenis} No ${phNomor}.pdf`
      const driveResult = await uploadToDrive(fileName, targetFolderId, selectedFile)

      if (driveResult) {
        const docData = {
          createdBy: user.uid,
          namaDokumen: phNamaDokumen,
          jenisDok: finalJenis,
          nomorDok: phNomor,
          fileUrl: driveResult.fileUrl,
          driveFileId: driveResult.fileId,
          createdAt: new Date().toISOString()
        }
        const ref = collection(db, "produkHukum")
        addDocumentNonBlocking(ref, docData)
        toast({ title: "Berhasil", description: "Produk Hukum telah diarsipkan secara global." })
        setPhNamaDokumen(""); setPhJenis(""); setPhPhJenisManual(""); setPhNomor(""); setSelectedFile(null)
      } else {
        throw new Error("Gagal unggah ke Drive. Cek izin akses folder.")
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal Simpan", description: e.message })
    } finally {
      setIsUploading(false)
    }
  }

  // Simpan Arsip Surat Desa Manual
  const handleSaveSurat = async () => {
    if (!user || !suratPerihal.trim() || !suratSelectedFile) {
      toast({ variant: "destructive", title: "Data Belum Lengkap", description: "Mohon isi perihal / judul surat dan pilih dokumen PDF / Gambar." })
      return
    }

    const targetFolderId = villageSettings?.agendaFolderId || villageSettings?.spjFolderId || GOOGLE_CONFIG.parentFolderId;
    if (!targetFolderId) {
      toast({ variant: "destructive", title: "Folder Belum Diatur", description: "ID Folder Google Drive belum diatur di Pengaturan." })
      return
    }

    setIsUploading(true)
    try {
      const cleanNomor = suratNomor.trim() ? `No ${suratNomor.trim()}` : "Tanpa Nomor"
      const fileName = `[${suratTipe.toUpperCase()}] ${suratPerihal.trim()} | ${cleanNomor}.pdf`
      const driveResult = await uploadToDrive(fileName, targetFolderId, suratSelectedFile)

      if (driveResult) {
        const docData = {
          createdBy: user.uid,
          tipeSurat: suratTipe, // "Internal" | "Eksternal"
          namaDokumen: suratPerihal.trim(),
          perihal: suratPerihal.trim(),
          nomorSurat: suratNomor.trim() || "-",
          nomorDok: suratNomor.trim() || "-",
          tanggalSurat: suratTanggal || new Date().toISOString().split('T')[0],
          asalSurat: suratAsal.trim() || (suratTipe === "Internal" ? "Pemerintah Desa Sampeldes" : "Pihak Luar / Instansi"),
          disposisi: suratDisposisi.trim() || "-",
          keterangan: suratKeterangan.trim() || "-",
          fileUrl: driveResult.fileUrl,
          driveFileId: driveResult.fileId,
          fileName: suratSelectedFile.name,
          source: "manual",
          createdAt: new Date().toISOString()
        }
        const ref = collection(db, "suratDesa")
        addDocumentNonBlocking(ref, docData)
        toast({ title: "Berhasil Diarsipkan", description: `Surat ${suratTipe} telah tersimpan ke Arsip Surat Desa.` })
        setSuratPerihal(""); setSuratNomor(""); setSuratAsal(""); setSuratDisposisi(""); setSuratKeterangan(""); setSuratSelectedFile(null)
      } else {
        throw new Error("Gagal unggah berkas ke Google Drive. Periksa izin akses folder.")
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal Simpan", description: e.message })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = (id: string, collectionName: "spjDesa" | "produkHukum" | "suratDesa") => {
    if (!user) return
    const docRef = doc(db, collectionName, id)
    deleteDocumentNonBlocking(docRef)
    toast({ title: "Dihapus", description: "Dokumen telah dihapus dari arsip desa." })
  }

  const filteredSpj = (spjList || []).filter(item => (item.kegiatan || "").toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredPh = (phList || []).filter(item =>
    (item.namaDokumen || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.nomorDok || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.jenisDok || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter & Pencarian Surat Desa
  const filteredSurat = useMemo(() => {
    return (suratList || []).filter(item => {
      const q = searchTerm.toLowerCase()
      const matchesSearch =
        (item.namaDokumen || item.perihal || "").toLowerCase().includes(q) ||
        (item.nomorSurat || item.nomorDok || "").toLowerCase().includes(q) ||
        (item.asalSurat || "").toLowerCase().includes(q) ||
        (item.disposisi || "").toLowerCase().includes(q) ||
        (item.keterangan || "").toLowerCase().includes(q)

      if (!matchesSearch) return false

      if (suratFilter === "semua") return true
      return item.tipeSurat === suratFilter
    })
  }, [suratList, searchTerm, suratFilter])

  const suratStats = useMemo(() => {
    const list = suratList || []
    const total = list.length
    const internal = list.filter(s => s.tipeSurat === "Internal").length
    const eksternal = list.filter(s => s.tipeSurat === "Eksternal").length
    return { total, internal, eksternal }
  }, [suratList])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto font-sans">
      <header className="flex items-center gap-3.5">
        <div className="h-12 w-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 text-emerald-800 flex items-center justify-center shrink-0">
          <Archive className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-condensed font-extrabold text-slate-900 uppercase tracking-tight">Arsip Digital Terpadu</h1>
          <p className="text-xs text-stone-600 font-medium">Database Digital Dokumen SPJ, Surat Desa & Regulasi Produk Hukum Desa</p>
        </div>
      </header>

      {(!villageSettings?.spjFolderId || !villageSettings?.produkHukumFolderId) && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-amber-400/50 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-700 shrink-0" />
          <p className="text-xs font-bold text-amber-900">
            Folder penyimpanan Google Drive belum diatur. Silakan ke menu <Link href="/manajemen/settings" className="underline font-extrabold">Pengaturan Desa</Link> untuk melengkapi ID Folder.
          </p>
        </div>
      )}

      <Tabs defaultValue="spj" className="w-full">
        {/* TABS HEADER: SPJ DESA | SURAT DESA | PRODUK HUKUM */}
        <TabsList className="grid w-full grid-cols-3 h-14 bg-white dark:bg-[#081d27] p-1.5 rounded-2xl mb-6 shadow-inner border border-stone-300/40">
          <TabsTrigger
            value="spj"
            className="gap-2 text-[10px] sm:text-xs font-condensed font-bold uppercase rounded-xl h-full transition-all text-stone-600 data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80"
          >
            <FileText className="h-4 w-4 text-emerald-700" />
            SPJ DESA
          </TabsTrigger>
          <TabsTrigger
            value="surat"
            className="gap-2 text-[10px] sm:text-xs font-condensed font-bold uppercase rounded-xl h-full transition-all text-stone-600 data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80"
          >
            <Mail className="h-4 w-4 text-emerald-700" />
            SURAT DESA
            {suratStats.total > 0 && (
              <span className="hidden sm:inline-flex px-1.5 py-0.2 text-[9px] rounded-full bg-emerald-800 text-white font-bold">
                {suratStats.total}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="ph"
            className="gap-2 text-[10px] sm:text-xs font-condensed font-bold uppercase rounded-xl h-full transition-all text-stone-600 data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80"
          >
            <Scale className="h-4 w-4 text-emerald-700" />
            PRODUK HUKUM
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SPJ DESA */}
        <TabsContent value="spj" className="space-y-6">
          <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/70 overflow-hidden">
            <CardHeader className="bg-white dark:bg-[#081d27] border-b border-stone-300/40 p-6">
              <CardTitle className="text-base font-condensed font-extrabold uppercase tracking-tight text-slate-900 flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/60 flex items-center justify-center text-emerald-800">
                  <FileText className="h-4 w-4" />
                </div>
                Input SPJ Desa
              </CardTitle>
              <CardDescription className="text-xs text-stone-600 font-medium">Arsipkan dokumen pertanggungjawaban kegiatan APBDes ke Cloud.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700 flex items-center gap-2">
                    <Wallet className="h-3 w-3 text-emerald-800" /> Jenis Anggaran
                  </Label>
                  <Select value={spjTipeApbdes} onValueChange={(val: "APBDes" | "APBDes Perubahan") => { setSpjTipeApbdes(val); setSpjBidang(""); setSpjSumber(""); setSpjKegiatan(""); }}>
                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900">
                      <SelectValue placeholder="Pilih Jenis..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 rounded-2xl">
                      <SelectItem value="APBDes" className="font-bold text-xs">1. APBDes</SelectItem>
                      <SelectItem value="APBDes Perubahan" className="font-bold text-xs">2. APBDes Perubahan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700 flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-emerald-800" /> Pilih Tahun Anggaran
                  </Label>
                  <Select value={spjTahun} onValueChange={(val) => { setSpjTahun(val); setSpjBidang(""); setSpjSumber(""); setSpjKegiatan(""); }}>
                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900">
                      <SelectValue placeholder="Pilih Tahun..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 rounded-2xl">
                      {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map(y => (
                        <SelectItem key={y} value={y} className="font-bold text-xs">{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700 flex items-center gap-2">
                    <Layers className="h-3 w-3 text-emerald-800" /> Pilih Bidang
                  </Label>
                  <Select value={spjBidang} onValueChange={(val) => { setSpjBidang(val); setSpjSumber(""); setSpjKegiatan(""); }}>
                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900">
                      <SelectValue placeholder="Pilih Bidang..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 rounded-2xl">
                      {Object.entries(BIDANG_NAMES).map(([id, name]) => (
                        <SelectItem key={id} value={id} className="font-bold text-xs">Bidang {id} - {name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700 flex items-center gap-2">
                    <Database className="h-3 w-3 text-emerald-800" /> Sumber Anggaran ({spjTipeApbdes} TA {spjTahun})
                  </Label>
                  <Select value={spjSumber} disabled={!spjBidang} onValueChange={(val) => { setSpjSumber(val); setSpjKegiatan(""); }}>
                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 disabled:opacity-50">
                      <SelectValue placeholder="Pilih Sumber..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 rounded-2xl">
                      {filteredSources.length > 0 ? (
                        filteredSources.map(s => (
                          <SelectItem key={s} value={s} className="font-bold text-xs">{s}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>Data anggaran ({spjTipeApbdes} TA {spjTahun}) kosong</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700 flex items-center gap-2">
                    <Activity className="h-3 w-3 text-emerald-800" /> Nama Kegiatan ({spjTipeApbdes})
                  </Label>
                  <Select value={spjKegiatan} disabled={!spjSumber} onValueChange={setSpjKegiatan}>
                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 disabled:opacity-50">
                      <SelectValue placeholder="Pilih Kegiatan..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 rounded-2xl">
                      {filteredActivities.map((item: any) => (
                        <SelectItem key={item.id} value={item.uraian} className="font-bold text-xs">{item.uraian}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700">Pilih Bulan</Label>
                  <Select value={spjBulan} onValueChange={setSpjBulan}>
                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900">
                      <SelectValue placeholder="Pilih Bulan..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 rounded-2xl">
                      {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map(m => (
                        <SelectItem key={m} value={m} className="font-bold text-xs">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700">Upload Dokumen PDF</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="h-12 pt-2.5 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-dashed border-stone-400 font-bold text-xs text-slate-900"
                  />
                </div>
              </div>
              <Button
                className="w-full h-14 rounded-2xl font-black uppercase bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm active:scale-95 transition-all gap-2"
                disabled={isUploading || !villageSettings?.spjFolderId}
                onClick={handleSaveSpj}
              >
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                Arsipkan SPJ ({spjTipeApbdes} TA {spjTahun})
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-black text-slate-900 uppercase text-sm">Daftar Arsip SPJ</h3>
              <div className="relative w-48 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                <Input
                  placeholder="Cari kegiatan..."
                  className="pl-9 h-10 text-xs rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-slate-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3">
              {isSpjLoading ? (
                <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-800/40" /></div>
              ) : filteredSpj.length > 0 ? (
                filteredSpj.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/70 flex items-center justify-between gap-4 group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center shrink-0 text-emerald-800">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-slate-900 truncate">{item.kegiatan}</p>
                        <p className="text-[10px] text-stone-500 font-bold uppercase">
                          {item.tipeApbdes || "APBDes"} • TA {item.tahun} • {item.sumberAnggaran} • {item.bulan}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="h-9 rounded-xl gap-2 bg-white dark:bg-[#081d27] text-stone-700 shadow-sm border border-white/70 hover:bg-[#e4e0d9] font-bold text-xs" asChild>
                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 text-emerald-800" /> <span className="hidden sm:inline">Lihat</span>
                        </a>
                      </Button>
                      <Button size="icon" className="h-9 w-9 bg-white dark:bg-[#081d27] shadow-sm border border-white/70 hover:bg-rose-50 text-rose-600 rounded-xl" onClick={() => handleDelete(item.id, "spjDesa")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 text-stone-500 font-bold text-xs">
                  Belum ada arsip SPJ.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: SURAT DESA (TERHUBUNG OTOMATIS DARI AGENDA DESA) */}
        <TabsContent value="surat" className="space-y-6">
          {/* Form Input Manual Surat Desa */}
          <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/70 overflow-hidden">
            <CardHeader className="bg-white dark:bg-[#081d27] border-b border-stone-300/40 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-condensed font-extrabold uppercase tracking-tight text-slate-900 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/60 flex items-center justify-center text-emerald-800">
                      <Mail className="h-4 w-4" />
                    </div>
                    Input Arsip Surat Desa
                  </CardTitle>
                  <CardDescription className="text-xs text-stone-600 font-medium">
                    Arsipkan surat masuk atau surat keluar resmi desa. Undangan dari agenda otomatis masuk ke sini.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-white dark:bg-[#081d27] text-sky-800 shadow-inner border border-sky-400/40 font-bold text-[10px] px-2.5 py-1">
                    🏢 Internal: {suratStats.internal}
                  </Badge>
                  <Badge className="bg-white dark:bg-[#081d27] text-amber-900 shadow-inner border border-amber-400/40 font-bold text-[10px] px-2.5 py-1">
                    📨 Eksternal: {suratStats.eksternal}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pembeda Jenis Surat: Internal vs Eksternal */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700 flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5 text-emerald-800" />
                    Pilih Kategori Surat Desa
                  </Label>
                  <RadioGroup
                    value={suratTipe}
                    onValueChange={(val: "Internal" | "Eksternal") => setSuratTipe(val)}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <label
                      htmlFor="tipe-internal"
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all",
                        suratTipe === "Internal"
                          ? "bg-white dark:bg-[#081d27] shadow-inner border border-sky-500/60"
                          : "bg-white dark:bg-[#081d27] shadow-sm border border-white/70 hover:shadow-xs"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="Internal" id="tipe-internal" />
                        <div>
                          <p className="text-xs font-black uppercase text-sky-950 flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-sky-600" />
                            Surat Internal
                          </p>
                          <p className="text-[10px] text-stone-500 font-medium">
                            Surat keluar desa, undangan internal Pemdes, BPD, RT/RW, PKK, Posyandu
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-[10px] font-bold">
                        Internal
                      </Badge>
                    </label>

                    <label
                      htmlFor="tipe-eksternal"
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all",
                        suratTipe === "Eksternal"
                          ? "bg-white dark:bg-[#081d27] shadow-inner border border-amber-500/60"
                          : "bg-white dark:bg-[#081d27] shadow-sm border border-white/70 hover:shadow-xs"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="Eksternal" id="tipe-eksternal" />
                        <div>
                          <p className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                            <Mail className="h-4 w-4 text-amber-600" />
                            Surat Eksternal
                          </p>
                          <p className="text-[10px] text-stone-500 font-medium">
                            Surat masuk dari Kecamatan, Kabupaten, Dinas, Instansi luar, lembaga swasta
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px] font-bold">
                        Eksternal
                      </Badge>
                    </label>
                  </RadioGroup>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700">
                    Perihal / Nama Surat <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Contoh: Undangan Rapat Koordinasi Penanganan Stunting Kecamatan"
                    value={suratPerihal}
                    onChange={(e) => setSuratPerihal(e.target.value)}
                    className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700">Nomor Surat</Label>
                  <Input
                    placeholder="Contoh: 005/142/X/2026 (kosongkan jika tanpa nomor)"
                    value={suratNomor}
                    onChange={(e) => setSuratNomor(e.target.value)}
                    className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700">Tanggal Surat / Kegiatan</Label>
                  <Input
                    type="date"
                    value={suratTanggal}
                    onChange={(e) => setSuratTanggal(e.target.value)}
                    className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700">
                    {suratTipe === "Internal" ? "Asal Surat / Penandatangan" : "Instansi Pengirim (Asal Surat)"}
                  </Label>
                  <Input
                    placeholder={suratTipe === "Internal" ? "Contoh: Pemerintah Desa Sampeldes / BPD" : "Contoh: Kantor Kecamatan Gandrungmangu / Bapenda"}
                    value={suratAsal}
                    onChange={(e) => setSuratAsal(e.target.value)}
                    className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700">
                    {suratTipe === "Internal" ? "Tujuan Surat / Penerima" : "Disposisi / Ditugaskan Kepada"}
                  </Label>
                  <Input
                    placeholder="Contoh: Kepala Desa / Sekretaris Desa / Kasi Pelayanan"
                    value={suratDisposisi}
                    onChange={(e) => setSuratDisposisi(e.target.value)}
                    className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700">Catatan Tambahan (Opsional)</Label>
                  <Input
                    placeholder="Contoh: Pelaksanaan di Aula Kecamatan jam 09.00 WIB memakai pakaian dinas"
                    value={suratKeterangan}
                    onChange={(e) => setSuratKeterangan(e.target.value)}
                    className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700">
                    Upload Berkas Dokumen (PDF / JPG / PNG) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    onChange={handleSuratFileChange}
                    className="h-12 pt-2.5 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-dashed border-stone-400 font-bold text-xs text-slate-900"
                  />
                </div>
              </div>

              <Button
                className={cn(
                  "w-full h-14 rounded-2xl font-black uppercase shadow-sm active:scale-95 transition-all gap-2 text-sm",
                  suratTipe === "Internal"
                    ? "bg-sky-700 hover:bg-sky-800 text-white"
                    : "bg-amber-700 hover:bg-amber-800 text-white"
                )}
                disabled={isUploading}
                onClick={handleSaveSurat}
              >
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                Arsipkan Surat {suratTipe} Sekarang
              </Button>
            </CardContent>
          </Card>

          {/* Daftar Arsip Surat Desa & Filter Pembeda Internal/Eksternal */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
              <div>
                <h3 className="font-black text-slate-900 uppercase text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-800" />
                  Daftar Arsip Surat Desa
                </h3>
                <p className="text-[11px] text-stone-600 font-medium">
                  Menampilkan seluruh surat terarsip baik dari upload langsung maupun dari <strong>Agenda Desa (Input Jadwal Baru)</strong>.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                <Input
                  placeholder="Cari perihal, nomor, asal..."
                  className="pl-9 h-10 text-xs rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-slate-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Filter Buttons: Semua, Internal, Eksternal */}
            <div className="flex flex-wrap items-center gap-2 px-2">
              <Button
                type="button"
                size="sm"
                className={cn(
                  "h-9 px-4 text-xs font-bold rounded-xl transition-all",
                  suratFilter === "semua"
                    ? "bg-white dark:bg-[#081d27] text-slate-900 shadow-inner border border-stone-300/40"
                    : "bg-white dark:bg-[#081d27] text-stone-700 shadow-sm border border-white/70 hover:bg-[#e4e0d9]"
                )}
                onClick={() => setSuratFilter("semua")}
              >
                Semua Surat ({suratStats.total})
              </Button>

              <Button
                type="button"
                size="sm"
                className={cn(
                  "h-9 px-4 text-xs font-bold rounded-xl gap-1.5 transition-all",
                  suratFilter === "Internal"
                    ? "bg-white dark:bg-[#081d27] text-sky-900 shadow-inner border border-sky-400/40"
                    : "bg-white dark:bg-[#081d27] text-sky-800 shadow-sm border border-white/70 hover:bg-[#e4e0d9]"
                )}
                onClick={() => setSuratFilter("Internal")}
              >
                <Building2 className="h-3.5 w-3.5" />
                🏢 Surat Internal ({suratStats.internal})
              </Button>

              <Button
                type="button"
                size="sm"
                className={cn(
                  "h-9 px-4 text-xs font-bold rounded-xl gap-1.5 transition-all",
                  suratFilter === "Eksternal"
                    ? "bg-white dark:bg-[#081d27] text-amber-900 shadow-inner border border-amber-400/40"
                    : "bg-white dark:bg-[#081d27] text-amber-900 shadow-sm border border-white/70 hover:bg-[#e4e0d9]"
                )}
                onClick={() => setSuratFilter("Eksternal")}
              >
                <Mail className="h-3.5 w-3.5" />
                📨 Surat Eksternal ({suratStats.eksternal})
              </Button>
            </div>

            {/* Card List Dokumen Surat */}
            <div className="grid gap-3">
              {isSuratLoading ? (
                <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-800/40" /></div>
              ) : filteredSurat.length > 0 ? (
                filteredSurat.map((item) => {
                  const isInternal = item.tipeSurat === "Internal"
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "p-4 md:p-5 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/70 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all"
                      )}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Ikon Pembeda */}
                        <div
                          className={cn(
                            "h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40",
                            isInternal ? "text-sky-700" : "text-amber-700"
                          )}
                        >
                          {isInternal ? <Building2 className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                        </div>

                        <div className="min-w-0 space-y-1">
                          {/* Badges Bar: Pembeda Internal vs Eksternal & Sumber Agenda */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              className={cn(
                                "font-black text-[9px] uppercase px-2 py-0.5",
                                isInternal
                                  ? "bg-sky-700 text-white"
                                  : "bg-amber-700 text-white"
                              )}
                            >
                              {isInternal ? "SURAT INTERNAL DESA" : "SURAT EKSTERNAL / MASUK"}
                            </Badge>

                            {item.source === "agenda" && (
                              <Badge variant="outline" className="bg-white dark:bg-[#081d27] text-emerald-800 border-emerald-500/40 font-bold text-[9px] gap-1 px-2 py-0.5 shadow-xs">
                                <Calendar className="h-2.5 w-2.5 text-emerald-700" />
                                Dari Undangan Agenda Desa
                              </Badge>
                            )}

                            {item.nomorSurat && item.nomorSurat !== "-" && (
                              <span className="text-[11px] font-mono font-bold text-slate-800 bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/30 px-2 py-0.5 rounded-md">
                                No: {item.nomorSurat}
                              </span>
                            )}
                          </div>

                          {/* Perihal / Judul Surat */}
                          <p className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                            {item.namaDokumen || item.perihal}
                          </p>

                          {/* Detail Meta: Tanggal, Asal, Disposisi */}
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-stone-600 font-medium pt-0.5">
                            {item.tanggalSurat && (
                              <span className="flex items-center gap-1 text-slate-800 font-bold">
                                <Clock className="h-3 w-3 text-stone-400" />
                                {item.tanggalSurat}
                              </span>
                            )}

                            {item.asalSurat && item.asalSurat !== "-" && (
                              <span className="flex items-center gap-1">
                                <span className="font-semibold text-stone-500">Asal:</span> {item.asalSurat}
                              </span>
                            )}

                            {item.disposisi && item.disposisi !== "-" && (
                              <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                                <UserCheck className="h-3 w-3 text-emerald-700" />
                                Disposisi: {item.disposisi}
                              </span>
                            )}
                          </div>

                          {item.keterangan && item.keterangan !== "-" && (
                            <p className="text-[10px] text-stone-500 italic truncate max-w-xl">
                              * {item.keterangan}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tombol Aksi: Lihat File & Hapus */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0">
                        {item.fileUrl ? (
                          <Button size="sm" className="h-9 rounded-xl gap-2 font-bold bg-white dark:bg-[#081d27] text-stone-700 shadow-sm border border-white/70 hover:bg-[#e4e0d9]" asChild>
                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 text-emerald-800" />
                              <span>Lihat Berkas</span>
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" className="h-9 rounded-xl gap-2 text-stone-400 bg-white dark:bg-[#081d27] opacity-60" disabled>
                            Berkas Tidak Tersedia
                          </Button>
                        )}

                        <Button
                          size="icon"
                          className="h-9 w-9 bg-white dark:bg-[#081d27] shadow-sm border border-white/70 hover:bg-rose-50 text-rose-600 rounded-xl"
                          onClick={() => handleDelete(item.id, "suratDesa")}
                          title="Hapus dari arsip"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-20 text-center rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-2">
                  <Mail className="h-8 w-8 mx-auto text-stone-400" />
                  <p className="font-bold text-sm text-slate-800">Belum ada arsip surat desa.</p>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Arsip surat akan otomatis terisi saat Anda mengunggah berkas undangan di menu <strong>Agenda Desa (Input Jadwal Baru)</strong>, atau menginput langsung pada formulir di atas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: PRODUK HUKUM */}
        <TabsContent value="ph" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
          <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/70 overflow-hidden">
            <CardHeader className="bg-white dark:bg-[#081d27] border-b border-stone-300/40 p-6">
              <CardTitle className="text-base font-condensed font-extrabold uppercase tracking-tight text-slate-900 flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/60 flex items-center justify-center text-emerald-800">
                  <Scale className="h-4 w-4" />
                </div>
                Input Produk Hukum
              </CardTitle>
              <CardDescription className="text-xs text-stone-600 font-medium">Arsipkan SK, Perdes, Perkades, dan dokumen hukum lainnya.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700">Nama Dokumen</Label>
                  <Input
                    placeholder="Contoh: SK Pengangkatan Perangkat Desa"
                    value={phNamaDokumen}
                    onChange={(e) => setPhNamaDokumen(e.target.value)}
                    className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700">Jenis Dokumen</Label>
                  <Select value={phJenis} onValueChange={setPhJenis}>
                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900">
                      <SelectValue placeholder="Pilih Jenis..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 rounded-2xl">
                      {["SK", "Perdes", "Perkades", "BA", "Lainnya"].map(s => (
                        <SelectItem key={s} value={s} className="font-bold text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {phJenis === "Lainnya" && (
                  <div className="space-y-2 animate-in slide-in-from-top-1">
                    <Label className="text-[10px] font-black uppercase text-stone-700">Nama Dokumen Manual</Label>
                    <Input
                      placeholder="Ketik jenis dokumen..."
                      value={phJenisManual}
                      onChange={(e) => setPhPhJenisManual(e.target.value)}
                      className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700">Nomor Dokumen</Label>
                  <Input
                    placeholder="Contoh: 141/02/2026"
                    value={phNomor}
                    onChange={(e) => setPhNomor(e.target.value)}
                    className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-stone-700">Upload Dokumen PDF</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="h-12 pt-2.5 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-dashed border-stone-400 font-bold text-xs text-slate-900"
                  />
                </div>
              </div>
              <Button
                className="w-full h-14 rounded-2xl font-black uppercase bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm active:scale-95 transition-all gap-2"
                disabled={isUploading || !villageSettings?.produkHukumFolderId}
                onClick={handleSavePh}
              >
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                Arsipkan Produk Hukum
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-black text-slate-900 uppercase text-sm">Daftar Arsip Produk Hukum</h3>
              <div className="relative w-48 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                <Input
                  placeholder="Cari nama/nomor/jenis..."
                  className="pl-9 h-10 text-xs rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-slate-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3">
              {isPhLoading ? (
                <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-800/40" /></div>
              ) : filteredPh.length > 0 ? (
                filteredPh.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/70 flex items-center justify-between gap-4 group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center shrink-0 text-emerald-800">
                        <Scale className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-slate-900 truncate">{item.namaDokumen}</p>
                        <p className="text-[10px] text-stone-500 font-bold uppercase">{item.jenisDok} • {item.nomorDok}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="h-9 rounded-xl gap-2 bg-white dark:bg-[#081d27] text-stone-700 shadow-sm border border-white/70 hover:bg-[#e4e0d9] font-bold text-xs" asChild>
                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 text-emerald-800" /> <span className="hidden sm:inline">Lihat</span>
                        </a>
                      </Button>
                      <Button size="icon" className="h-9 w-9 bg-white dark:bg-[#081d27] shadow-sm border border-white/70 hover:bg-rose-50 text-rose-600 rounded-xl" onClick={() => handleDelete(item.id, "produkHukum")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 text-stone-500 font-bold text-xs">
                  Belum ada arsip Produk Hukum.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
