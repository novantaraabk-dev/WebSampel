
"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection, setDoc, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  Save,
  Printer,
  Loader2,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  RefreshCw,
  Info,
  Clock,
  MapPin,
  Sparkles,
  Tag
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { NASKAH_CONFIG, NaskahType, getNextSequenceNumber, saveToBukuAgenda } from "@/lib/naskah-dinas-utils"
import { DAFTAR_KLASIFIKASI_POKOK, SEED_KLASIFIKASI_SURAT } from "@/lib/klasifikasi-surat-data"
import { KlasifikasiSuratItem } from "@/lib/types"
import { generateNaskahPDF } from "@/lib/pdf-naskah-dinas"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

function EditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get("id")
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [type, setType] = useState<NaskahType>("UND")
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPullingNumber, setIsPullingNumber] = useState(false)
  const [selectedPokok, setSelectedPokok] = useState<string>("000 UMUM")
  const [selectedCode, setSelectedCode] = useState("000")
  const [locationType, setLocationType] = useState("balai")

  // Query Firestore untuk kategori terpilih (opsional/realtime jika ada update)
  const klasifikasiQuery = useMemoFirebase(() => {
    if (!db || !selectedPokok) return null
    return query(
      collection(db, "klasifikasi_surat"),
      where("klasifikasiPokok", "==", selectedPokok)
    )
  }, [db, selectedPokok])

  const { data: firestoreKlasifikasi } = useCollection<KlasifikasiSuratItem>(klasifikasiQuery)

  // Opsi kode klasifikasi berdasarkan Klasifikasi Pokok yang dipilih
  const availableCodes = useMemo(() => {
    if (firestoreKlasifikasi && firestoreKlasifikasi.length > 0) {
      return firestoreKlasifikasi.map((item) => ({
        code: item.kode,
        label: item.uraian,
        keterangan: item.keterangan || "",
      }))
    }
    const fromSeed = SEED_KLASIFIKASI_SURAT.filter(
      (item) => item.klasifikasiPokok === selectedPokok
    ).map((item) => ({
      code: item.kode,
      label: item.uraian,
      keterangan: item.keterangan || "",
    }))
    if (fromSeed.length > 0) return fromSeed
    return [{ code: selectedPokok.split(" ")[0] || "000", label: selectedPokok, keterangan: "" }]
  }, [selectedPokok, firestoreKlasifikasi])

  // Hasil info lengkap kode + uraian yang sedang terpilih
  const currentSelectedInfo = useMemo(() => {
    const foundInAvailable = availableCodes.find((c) => c.code === selectedCode)
    if (foundInAvailable) {
      return {
        code: foundInAvailable.code,
        uraian: foundInAvailable.label,
        keterangan: foundInAvailable.keterangan,
      }
    }
    const foundInSeed = SEED_KLASIFIKASI_SURAT.find((s) => s.kode === selectedCode)
    if (foundInSeed) {
      return {
        code: foundInSeed.kode,
        uraian: foundInSeed.uraian,
        keterangan: foundInSeed.keterangan || "",
      }
    }
    return {
      code: selectedCode,
      uraian: "Klasifikasi Surat Resmi",
      keterangan: "",
    }
  }, [availableCodes, selectedCode])

  const handlePokokChange = (newPokok: string) => {
    setSelectedPokok(newPokok)
    const firstItem = SEED_KLASIFIKASI_SURAT.find((item) => item.klasifikasiPokok === newPokok)
    if (firstItem) {
      setSelectedCode(firstItem.kode)
    } else {
      setSelectedCode(newPokok.split(" ")[0] || "000")
    }
  }

  // Document State
  const [formData, setFormData] = useState<any>({
    title: "",
    nomorSurat: "",
    status: "DRAFT",
    sifat: "Biasa",
    waktu: "09:00",
    tempat: "Balai Desa Sampeldes",
    menimbang: [""],
    mengingat: [""],
    keputusan: [""],
    petugas: [{ name: "", jabatan: "" }]
  })

  // Fetch Existing Data if Edit Mode
  const naskahRef = useMemoFirebase(() => (db && id) ? doc(db, "naskah_dinas", id) : null, [db, id])
  const { data: initialData, isLoading: isDataLoading } = useDoc(naskahRef)

  // GLOBAL CONFIG: Fetch from village settings document (for Logo)
  const villageSettingsRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "settings", "village")
  }, [db])
  const { data: villageSettings } = useDoc(villageSettingsRef)

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      setType(initialData.type as NaskahType)
      if (initialData.classificationCode) {
        setSelectedCode(initialData.classificationCode)
        const found = SEED_KLASIFIKASI_SURAT.find((item) => item.kode === initialData.classificationCode)
        if (found && found.klasifikasiPokok) {
          setSelectedPokok(found.klasifikasiPokok)
        } else {
          const prefix = initialData.classificationCode.charAt(0)
          const matched = DAFTAR_KLASIFIKASI_POKOK.find((p) => p.startsWith(prefix))
          if (matched) setSelectedPokok(matched)
        }
      }
      if (initialData.tempat === "Balai Desa Sampeldes") setLocationType("balai")
      else if (initialData.tempat) setLocationType("manual")
    }
  }, [initialData])

  const handlePullNumber = async () => {
    if (!db) return
    setIsPullingNumber(true)
    try {
      const config = NASKAH_CONFIG[type];
      const nextNum = await getNextSequenceNumber(db, config.kategori, selectedCode)
      setFormData((prev: any) => ({ ...prev, nomorSurat: nextNum, classificationCode: selectedCode }))
      toast({ title: "Nomor Berhasil Ditarik", description: nextNum })
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal Tarik Nomor" })
    } finally {
      setIsPullingNumber(false)
    }
  }

  const handleSave = async (status: 'DRAFT' | 'FINAL') => {
    if (!db || !user) return
    if (!formData.title) {
      toast({ variant: "destructive", title: "Judul Wajib Diisi" })
      return
    }

    setIsSaving(true)
    const docId = id || doc(collection(db, "naskah_dinas")).id
    const payload = {
      ...formData,
      id: docId,
      type,
      status,
      classificationCode: selectedCode,
      createdBy: user.uid,
      updatedAt: new Date().toISOString(),
      createdAt: formData.createdAt || new Date().toISOString()
    }

    try {
      await setDoc(doc(db, "naskah_dinas", docId), payload, { merge: true })

      // SINKRON KE BUKU AGENDA JIKA FINAL
      if (status === 'FINAL') {
        const config = NASKAH_CONFIG[type];
        await saveToBukuAgenda(db, {
          kategori: config.kategori,
          nomor: formData.nomorSurat || "-",
          perihal: formData.title,
          userId: user.uid
        });
      }

      toast({ title: "Tersimpan", description: `Naskah dinas telah disimpan sebagai ${status}.` })
      if (!id) router.replace(`/manajemen/naskah-dinas/editor/?id=${docId}`)
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal Menyimpan" })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = async () => {
    setIsGenerating(true)
    try {
      const pdfBlob = await generateNaskahPDF(type, formData, villageSettings?.logoBase64)
      const url = URL.createObjectURL(pdfBlob)
      window.open(url, "_blank")
      toast({ title: "Berhasil", description: "PDF siap dicetak." })
    } catch (e) {
      console.error(e)
      toast({ variant: "destructive", title: "Gagal PDF" })
    } finally {
      setIsGenerating(false)
    }
  }

  const updateField = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }))
  }

  const renderFormUndangan = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Sifat Surat</Label>
          <Select value={formData.sifat || "Biasa"} onValueChange={val => updateField("sifat", val)}>
            <SelectTrigger className="h-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 px-4 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600">
              <SelectValue placeholder="Pilih Sifat..." />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#081d27] rounded-2xl shadow-md border border-white/80">
              <SelectItem value="Umum" className="text-xs font-bold">Umum</SelectItem>
              <SelectItem value="Biasa" className="text-xs font-bold">Biasa</SelectItem>
              <SelectItem value="Rahasia" className="text-xs font-bold">Rahasia</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Tujuan Undangan</Label>
          <Textarea
            placeholder="Contoh: &#10;Bapak Ketua RW 01 &#10;Bapak Ketua RT 01"
            value={formData.tujuan || ""}
            onChange={e => updateField("tujuan", e.target.value)}
            className="min-h-[100px] rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 p-3 leading-relaxed"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Hari / Tanggal</Label>
          <Input
            type="date"
            value={formData.tanggal || ""}
            onChange={e => updateField("tanggal", e.target.value)}
            className="h-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1 flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-emerald-800" /> Pilih Jam
          </Label>
          <Input
            type="time"
            value={formData.waktu || "09:00"}
            onChange={e => updateField("waktu", e.target.value)}
            className="h-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1 flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-emerald-800" /> Lokasi Kegiatan
        </Label>
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-white dark:bg-[#081d27] rounded-2xl shadow-inner border border-stone-300/40">
          <button
            type="button"
            className={cn(
              "h-10 rounded-xl text-[10px] uppercase font-black transition-all tracking-wider",
              locationType === 'balai'
                ? "bg-white dark:bg-[#081d27] text-slate-900 shadow-sm border border-white/80"
                : "text-stone-600 hover:text-slate-900"
            )}
            onClick={() => {
              setLocationType('balai');
              updateField("tempat", "Balai Desa Sampeldes");
            }}
          >
            Balai Desa
          </button>
          <button
            type="button"
            className={cn(
              "h-10 rounded-xl text-[10px] uppercase font-black transition-all tracking-wider",
              locationType === 'manual'
                ? "bg-white dark:bg-[#081d27] text-slate-900 shadow-sm border border-white/80"
                : "text-stone-600 hover:text-slate-900"
            )}
            onClick={() => setLocationType('manual')}
          >
            Input Manual
          </button>
        </div>
        {locationType === 'manual' && (
          <Input
            placeholder="Masukkan lokasi acara..."
            value={formData.tempat === "Balai Desa Sampeldes" ? "" : formData.tempat}
            onChange={e => updateField("tempat", e.target.value)}
            className="h-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4 animate-in slide-in-from-top-1"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Acara / Agenda</Label>
        <Textarea
          placeholder="Membahas persiapan HUT RI ke-81..."
          value={formData.agenda || ""}
          onChange={e => updateField("agenda", e.target.value)}
          className="rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 p-3"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Catatan Tambahan (Opsional)</Label>
        <Textarea
          placeholder="Contoh: Hadir tepat waktu dengan pakaian dinas harian."
          value={formData.catatan || ""}
          onChange={e => updateField("catatan", e.target.value)}
          className="rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 p-3 min-h-[80px]"
        />
      </div>
    </div>
  )

  const renderFormSK = () => {
    const addListItem = (field: string) => {
      const current = formData[field] || []
      updateField(field, [...current, ""])
    }
    const updateListItem = (field: string, idx: number, val: string) => {
      const current = [...(formData[field] || [])]
      current[idx] = val
      updateField(field, current)
    }
    const removeListItem = (field: string, idx: number) => {
      const current = (formData[field] || []).filter((_: any, i: number) => i !== idx)
      updateField(field, current)
    }

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Tentang / Perihal SK</Label>
          <Textarea
            placeholder="Pembentukan Panitia Pengadaan Barang dan Jasa Desa..."
            value={formData.tentang || ""}
            onChange={e => updateField("tentang", e.target.value)}
            className="rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 p-3"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Konsideran (Menimbang)</Label>
            <Button
              type="button"
              size="sm"
              className="h-8 px-3 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/80 text-emerald-800 hover:bg-[#e4e0d9] font-black text-[10px] uppercase tracking-wider"
              onClick={() => addListItem("menimbang")}
            >
              <Plus className="h-3 w-3 mr-1" /> Tambah
            </Button>
          </div>
          {(formData.menimbang || []).map((item: string, idx: number) => (
            <div key={idx} className="flex gap-2 items-start">
              <Textarea
                className="min-h-[80px] rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 p-3"
                value={item}
                onChange={e => updateListItem("menimbang", idx, e.target.value)}
              />
              <Button
                type="button"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/80 text-rose-600 hover:bg-rose-50"
                onClick={() => removeListItem("menimbang", idx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Dasar Hukum (Mengingat)</Label>
            <Button
              type="button"
              size="sm"
              className="h-8 px-3 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/80 text-emerald-800 hover:bg-[#e4e0d9] font-black text-[10px] uppercase tracking-wider"
              onClick={() => addListItem("mengingat")}
            >
              <Plus className="h-3 w-3 mr-1" /> Tambah
            </Button>
          </div>
          {(formData.mengingat || []).map((item: string, idx: number) => (
            <div key={idx} className="flex gap-2 items-start">
              <Textarea
                className="min-h-[60px] rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 p-3"
                value={item}
                onChange={e => updateListItem("mengingat", idx, e.target.value)}
              />
              <Button
                type="button"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/80 text-rose-600 hover:bg-rose-50"
                onClick={() => removeListItem("mengingat", idx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Diktum Keputusan (Menetapkan)</Label>
            <Button
              type="button"
              size="sm"
              className="h-8 px-3 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/80 text-emerald-800 hover:bg-[#e4e0d9] font-black text-[10px] uppercase tracking-wider"
              onClick={() => addListItem("keputusan")}
            >
              <Plus className="h-3 w-3 mr-1" /> Tambah
            </Button>
          </div>
          {(formData.keputusan || []).map((item: string, idx: number) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1.5">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 text-emerald-800 text-[8px] font-black uppercase tracking-wider">
                  DIKTUM KE-{idx + 1}
                </span>
                <Textarea
                  className="min-h-[100px] rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 p-3"
                  value={item}
                  onChange={e => updateListItem("keputusan", idx, e.target.value)}
                />
              </div>
              <Button
                type="button"
                size="icon"
                className="h-10 w-10 shrink-0 mt-6 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/80 text-rose-600 hover:bg-rose-50"
                onClick={() => removeListItem("keputusan", idx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderFormBA = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Hari / Tanggal</Label>
          <Input
            type="date"
            value={formData.tanggal || ""}
            onChange={e => updateField("tanggal", e.target.value)}
            className="h-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Tempat</Label>
          <Input
            placeholder="Balai Desa Sampeldes"
            value={formData.tempat || ""}
            onChange={e => updateField("tempat", e.target.value)}
            className="h-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Isi Berita Acara (Narasi)</Label>
        <Textarea
          className="min-h-[200px] rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 p-3 leading-relaxed"
          placeholder="Bahwa pada hari ini telah dilakukan serah terima..."
          value={formData.isi || ""}
          onChange={e => updateField("isi", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Kesimpulan / Tindak Lanjut</Label>
        <Textarea
          placeholder="Para pihak sepakat untuk..."
          value={formData.kesimpulan || ""}
          onChange={e => updateField("kesimpulan", e.target.value)}
          className="rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 p-3"
        />
      </div>
    </div>
  )

  const renderFormST = () => {
    const addPetugas = () => updateField("petugas", [...(formData.petugas || []), { name: "", jabatan: "" }])
    const updatePetugas = (idx: number, f: string, v: string) => {
      const current = [...(formData.petugas || [])]
      current[idx] = { ...current[idx], [f]: v }
      updateField("petugas", current)
    }
    const removePetugas = (idx: number) => updateField("petugas", (formData.petugas || []).filter((_: any, i: number) => i !== idx))

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Dasar Penugasan</Label>
          <Textarea
            placeholder="Peraturan Desa Nomor 01 Tahun 2026..."
            value={formData.dasar || ""}
            onChange={e => updateField("dasar", e.target.value)}
            className="rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 p-3"
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Daftar Petugas</Label>
            <Button
              type="button"
              size="sm"
              className="h-8 px-3 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/80 text-emerald-800 hover:bg-[#e4e0d9] font-black text-[10px] uppercase tracking-wider"
              onClick={addPetugas}
            >
              <Plus className="h-3 w-3 mr-1" /> Tambah
            </Button>
          </div>
          {(formData.petugas || []).map((p: any, idx: number) => (
            <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/70 relative group">
              <Button
                type="button"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-white dark:bg-[#081d27] shadow-xs border border-white/80 text-rose-600 hover:bg-rose-50"
                onClick={() => removePetugas(idx)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-stone-600 tracking-wider">Nama Lengkap</Label>
                  <Input
                    className="h-10 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-3"
                    placeholder="SUDARSONO"
                    value={p.name}
                    onChange={e => updatePetugas(idx, "name", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-stone-600 tracking-wider">Jabatan</Label>
                  <Input
                    className="h-10 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-3"
                    placeholder="Kasi Pemerintahan"
                    value={p.jabatan}
                    onChange={e => updatePetugas(idx, "jabatan", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Maksud / Tujuan Tugas</Label>
          <Textarea
            placeholder="Menghadiri rapat koordinasi sinkronisasi data kependudukan..."
            value={formData.tujuanTugas || ""}
            onChange={e => updateField("tujuanTugas", e.target.value)}
            className="rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 p-3"
          />
        </div>
      </div>
    )
  }

  if (isDataLoading) return (
    <div className="min-h-screen bg-white dark:bg-[#081d27] flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-800" />
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-[#081d27] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8 pb-32">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              className="h-11 w-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/70 text-slate-800 hover:bg-[#e4e0d9] transition-all"
              asChild
            >
              <Link href="/manajemen/naskah-dinas">
                <ArrowLeft className="h-5 w-5 text-slate-800" />
              </Link>
            </Button>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                <FileText className="h-3.5 w-3.5 text-emerald-800" />
                {id ? "Sunting Dokumen" : "Buat Dokumen Baru"}
              </div>
              <h1 className="text-2xl sm:text-3xl font-condensed font-extrabold uppercase tracking-tight text-slate-900">
                Editor Naskah Dinas
              </h1>
              <p className="text-xs text-stone-600 font-bold uppercase tracking-wider">
                Pembuatan & Penerbitan Dokumen Resmi Pemerintahan Desa
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 p-6 md:p-8 space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-stone-300/50">
                <div className="space-y-1.5 w-full">
                  <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">
                    Judul Dokumen (Arsip Internal)
                  </Label>
                  <Input
                    placeholder="Contoh: Undangan Rapat HUT RI Ke-81"
                    className="h-12 text-sm sm:text-base font-extrabold rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
                    value={formData.title || ""}
                    onChange={e => updateField("title", e.target.value)}
                  />
                </div>
                {!id && (
                  <div className="shrink-0 flex flex-wrap gap-1.5 p-1.5 bg-white dark:bg-[#081d27] rounded-2xl shadow-inner border border-stone-300/40">
                    {(Object.keys(NASKAH_CONFIG) as NaskahType[]).map(t => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setType(t)}
                        className={cn(
                          "h-9 px-3.5 rounded-xl font-black text-[10px] uppercase transition-all tracking-wider",
                          type === t
                            ? "bg-white dark:bg-[#081d27] text-slate-900 shadow-sm border border-white/80"
                            : "text-stone-600 hover:text-slate-900"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 p-6 space-y-4">
                {/* Baris 1: Pemilihan Klasifikasi (2 Kolom Lebar & Proporsional) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Pilih Klasifikasi Pokok */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-emerald-800 tracking-wider ml-1 flex items-center gap-1.5">
                      <Tag className="h-3 w-3 text-emerald-700" />
                      1. Klasifikasi Pokok
                    </Label>
                    <Select value={selectedPokok} onValueChange={handlePokokChange}>
                      <SelectTrigger className="h-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 px-4 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600">
                        <SelectValue placeholder="Pilih Pokok..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#081d27] rounded-2xl shadow-md border border-white/80">
                        <ScrollArea className="h-[240px]">
                          {DAFTAR_KLASIFIKASI_POKOK.map((pokok) => (
                            <SelectItem key={pokok} value={pokok} className="text-xs font-bold text-slate-900 py-2">
                              {pokok}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 2. Pilih Kode Klasifikasi (Hasil Tampilan Lengkap Kode + Uraian) */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-emerald-800 tracking-wider ml-1">
                      2. Kode &amp; Uraian Klasifikasi
                    </Label>
                    <Select value={selectedCode} onValueChange={setSelectedCode}>
                      <SelectTrigger className="h-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 px-4 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-left">
                        <span className="truncate block">
                          {currentSelectedInfo.code} - {currentSelectedInfo.uraian}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#081d27] rounded-2xl shadow-md border border-white/80 max-w-[460px]">
                        <ScrollArea className="h-[260px]">
                          {availableCodes.map((c) => (
                            <SelectItem
                              key={c.code}
                              value={c.code}
                              className="text-xs font-bold text-slate-900 py-2.5 border-b border-stone-200/50 last:border-0"
                            >
                              <div className="flex flex-col text-left">
                                <span className="font-extrabold text-slate-900">
                                  {c.code} - {c.label}
                                </span>
                                {c.keterangan && (
                                  <span className="text-[10px] font-normal text-stone-600 line-clamp-1">
                                    {c.keterangan}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Baris 2: Nomor Surat Resmi (Lega, Terbaca Semua) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-emerald-800 tracking-wider ml-1">
                      Nomor Surat Resmi
                    </Label>
                    <span className="text-[10px] text-stone-500 font-medium">
                      Buku Agenda Penomoran Otomatis
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Contoh: 210 / 001 / 04 / 2026"
                        className="h-12 font-mono text-sm sm:text-base font-bold tracking-wide rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4 w-full"
                        value={formData.nomorSurat || ""}
                        onChange={(e) => updateField("nomorSurat", e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handlePullNumber}
                      disabled={isPullingNumber}
                      className="h-12 px-5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black uppercase text-xs tracking-wider shadow-sm active:scale-95 transition-all gap-2 shrink-0"
                      title="Tarik nomor urut otomatis dari buku agenda"
                    >
                      {isPullingNumber ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      <span>Tarik Nomor</span>
                    </Button>
                  </div>
                </div>

                {/* Keterangan & Rincian Kode Terpilih Lengkap */}
                <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 text-xs">
                  <Badge variant="outline" className="font-mono font-extrabold text-[11px] px-2.5 py-0.5 bg-emerald-800 text-white border-0 shrink-0">
                    KODE: {currentSelectedInfo.code}
                  </Badge>
                  <span className="font-extrabold text-slate-900 text-xs">
                    {currentSelectedInfo.uraian}
                  </span>
                  {currentSelectedInfo.keterangan && (
                    <span className="text-[11px] text-stone-600 hidden sm:inline">
                      — {currentSelectedInfo.keterangan}
                    </span>
                  )}
                </div>
              </div>

              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {type === 'UND' && renderFormUndangan()}
                {type === 'SK' && renderFormSK()}
                {type === 'BA' && renderFormBA()}
                {type === 'ST' && renderFormST()}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 p-6 md:p-8 sticky top-24 space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-300/40">
                <Info className="h-4 w-4 text-emerald-800" />
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">
                  Kontrol Dokumen
                </h3>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => handleSave('DRAFT')}
                  disabled={isSaving}
                  className="w-full h-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] text-slate-800 gap-2 font-bold uppercase text-[10px] tracking-wider transition-all active:scale-95"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Simpan Draft
                </Button>
                <Button
                  onClick={() => handleSave('FINAL')}
                  disabled={isSaving}
                  className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 shadow-sm text-white gap-2 font-black uppercase text-[10px] tracking-wider transition-all active:scale-95"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Finalkan Arsip
                </Button>
                <div className="h-px bg-stone-300/50 my-2" />
                <Button
                  onClick={handlePrint}
                  disabled={isGenerating}
                  className="w-full h-14 rounded-2xl bg-emerald-800 hover:bg-emerald-900 shadow-md text-white gap-3 font-black uppercase text-xs tracking-wider transition-all active:scale-95"
                >
                  {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
                  Cetak PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NaskahDinasEditor() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-[#081d27] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-800" />
      </div>
    }>
      <EditorContent />
    </Suspense>
  )
}
