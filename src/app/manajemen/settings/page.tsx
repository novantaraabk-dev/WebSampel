"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from "@/firebase"
import { invalidateDocCache } from "@/firebase/firestore/use-doc"
import { doc, setDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ImagePlus,
  CheckCircle2,
  Loader2,
  Save,
  Trash2,
  ArrowLeft,
  AlertCircle,
  LogOut,
  FolderOpen,
  ExternalLink,
  Zap,
  Building2,
  Mail,
  Phone,
  MapPin,
  CalendarDays
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GOOGLE_CONFIG } from "@/lib/google-config"

export default function SettingsPage() {
  const { user, isUserLoading: isAuthLoading } = useUser()
  const auth = useAuth()
  const router = useRouter()
  const db = useFirestore()
  const { toast } = useToast()

  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form states: Identitas & Kop Surat
  const [namaDesa, setNamaDesa] = useState("Desa Sampeldes")
  const [namaKecamatan, setNamaKecamatan] = useState("Kecamatan Gandrungmangu")
  const [namaKabupaten, setNamaKabupaten] = useState("Kabupaten Cilacap")
  const [alamatKantor, setAlamatKantor] = useState("Jl. Raya Sampeldes No. 01")
  const [kodePos, setKodePos] = useState("53254")
  const [emailDesa, setEmailDesa] = useState("pemdes.sampeldes@gmail.com")
  const [teleponDesa, setTeleponDesa] = useState("")

  // Form states: Folder Google Drive (Global)
  const [kegiatanId, setKegiatanId] = useState("")
  const [spjId, setSpjId] = useState("")
  const [phId, setPhId] = useState("")
  const [physicalDocId, setPhysicalDocId] = useState("")
  const [agendaFolderId, setAgendaFolderId] = useState("")

  // Form states: Integrasi Google Calendar & Apps Script
  const [googleCalendarId, setGoogleCalendarId] = useState("")
  const [appsScriptUrl, setAppsScriptUrl] = useState("")

  // GLOBAL SETTINGS: Read shared village settings document from Firestore
  const villageSettingsRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "settings", "village")
  }, [db])

  const { data: villageData, isLoading: isDataLoading, refresh: refreshVillageData } = useDoc(villageSettingsRef)

  // Populate data when loaded from Firestore
  useEffect(() => {
    if (villageData) {
      if (villageData.logoBase64) setLocalPreview(villageData.logoBase64)
      if (villageData.namaDesa) setNamaDesa(villageData.namaDesa)
      if (villageData.namaKecamatan) setNamaKecamatan(villageData.namaKecamatan)
      if (villageData.namaKabupaten) setNamaKabupaten(villageData.namaKabupaten)
      if (villageData.alamatKantor) setAlamatKantor(villageData.alamatKantor)
      if (villageData.kodePos) setKodePos(villageData.kodePos)
      if (villageData.emailDesa) setEmailDesa(villageData.emailDesa)
      if (villageData.teleponDesa) setTeleponDesa(villageData.teleponDesa)

      if (villageData.kegiatanFolderId) setKegiatanId(villageData.kegiatanFolderId)
      if (villageData.spjFolderId) setSpjId(villageData.spjFolderId)
      if (villageData.produkHukumFolderId) setPhId(villageData.produkHukumFolderId)
      if (villageData.physicalDocFolderId) setPhysicalDocId(villageData.physicalDocFolderId)
      if (villageData.agendaFolderId) setAgendaFolderId(villageData.agendaFolderId)

      setGoogleCalendarId(villageData.googleCalendarId || "")
      if (villageData.appsScriptUrl) {
        setAppsScriptUrl(villageData.appsScriptUrl)
      } else {
        setAppsScriptUrl(GOOGLE_CONFIG.appsScriptUrl)
      }
    } else {
      setAppsScriptUrl(GOOGLE_CONFIG.appsScriptUrl)
    }
  }, [villageData])

  // Helper: Extraksi ID Folder dari URL utuh jika pengguna memasukkan link Drive
  const extractFolderId = (input: string): string => {
    if (!input) return ""
    const trimmed = input.trim()
    const match = trimmed.match(/folders\/([a-zA-Z0-9_-]{25,})/)
    if (match) return match[1]
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{25,})/)
    if (idParamMatch) return idParamMatch[1]
    return trimmed
  }

  // Handle Logo Upload
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 800 * 1024) {
      toast({
        variant: "destructive",
        title: "File Terlalu Besar",
        description: "Maksimal ukuran logo adalah 800 KB."
      })
      return
    }

    setIsUploadingLogo(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string
        setLocalPreview(base64)

        if (db) {
          await setDoc(doc(db, "settings", "village"), {
            logoBase64: base64,
            updatedAt: new Date().toISOString(),
            updatedBy: user?.uid || "admin"
          }, { merge: true })
          invalidateDocCache("settings/village")
          refreshVillageData()
        }

        toast({
          title: "Logo Berhasil Disimpan",
          description: "Logo Pemerintah Desa telah diperbarui pada seluruh dokumen dan kop surat."
        })
      } catch (err: any) {
        console.error("Save logo error:", err)
        toast({
          variant: "destructive",
          title: "Gagal Menyimpan Logo",
          description: "Terjadi kesalahan saat menyimpan logo ke database."
        })
      } finally {
        setIsUploadingLogo(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle Remove Logo
  const removeLogo = async () => {
    if (!db) return
    try {
      setLocalPreview(null)
      await setDoc(doc(db, "settings", "village"), {
        logoBase64: null,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || "admin"
      }, { merge: true })
      invalidateDocCache("settings/village")
      refreshVillageData()

      toast({
        title: "Logo Dihapus",
        description: "Sistem akan kembali menggunakan logo standar."
      })
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menghapus Logo",
        description: e.message
      })
    }
  }

  // Handle Save All Settings (Tombol Simpan Utama)
  const handleSaveAllSettings = async () => {
    if (!db) {
      toast({
        variant: "destructive",
        title: "Koneksi Belum Siap",
        description: "Layanan database belum terhubung. Silakan muat ulang halaman."
      })
      return
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Akses Ditolak",
        description: "Sesi login belum terverifikasi. Silakan login kembali dengan akun pengelola desa."
      })
      return
    }

    setIsSaving(true)

    try {
      const finalKegiatan = extractFolderId(kegiatanId)
      const finalPhysical = extractFolderId(physicalDocId)
      const finalSpj = extractFolderId(spjId)
      const finalPh = extractFolderId(phId)
      const finalAgenda = extractFolderId(agendaFolderId)
      const finalCalendar = googleCalendarId.trim()
      const finalAppsScript = appsScriptUrl.trim()

      const payload = {
        logoBase64: localPreview,
        namaDesa: namaDesa.trim() || "Desa Sampeldes",
        namaKecamatan: namaKecamatan.trim() || "Kecamatan Gandrungmangu",
        namaKabupaten: namaKabupaten.trim() || "Kabupaten Cilacap",
        alamatKantor: alamatKantor.trim() || "Jl. Raya Sampeldes No. 01",
        kodePos: kodePos.trim() || "53254",
        emailDesa: emailDesa.trim() || "pemdes.sampeldes@gmail.com",
        teleponDesa: teleponDesa.trim() || "",

        kegiatanFolderId: finalKegiatan,
        physicalDocFolderId: finalPhysical,
        spjFolderId: finalSpj,
        produkHukumFolderId: finalPh,
        agendaFolderId: finalAgenda,

        googleCalendarId: finalCalendar,
        appsScriptUrl: finalAppsScript,

        updatedBy: user.uid,
        updatedAt: new Date().toISOString()
      }

      await setDoc(doc(db, "settings", "village"), payload, { merge: true })
      invalidateDocCache("settings/village")
      refreshVillageData()

      // Sinkronkan kembali state lokal dengan format ID bersih
      setKegiatanId(finalKegiatan)
      setPhysicalDocId(finalPhysical)
      setSpjId(finalSpj)
      setPhId(finalPh)
      setAgendaFolderId(finalAgenda)
      setGoogleCalendarId(finalCalendar)
      setAppsScriptUrl(finalAppsScript)

      toast({
        title: "Pengaturan Berhasil Disimpan!",
        description: "Seluruh identitas desa, folder Drive, Google Kalender, dan Apps Script telah terintegrasi ke sistem manajemen."
      })
    } catch (error: any) {
      console.error("Save settings error:", error)
      let errMsg = "Terjadi kesalahan saat menyimpan pengaturan."
      if (error?.code === "permission-denied" || error?.message?.includes("permission")) {
        errMsg = "Izin ditolak: Pastikan akun Anda memiliki akses admin manajemen desa."
      }
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan Pengaturan",
        description: errMsg
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Logout
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("isAdmin")
        localStorage.removeItem("adminEmail")
      }
      if (auth) {
        await auth.signOut()
      }
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#081d27]">
        <div className="text-center space-y-4 p-8 rounded-3xl bg-white dark:bg-[#081d27] shadow-lg border border-white/80">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-800 mx-auto" />
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Memuat Pengaturan Sistem...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-5xl mx-auto pb-32 font-sans bg-white dark:bg-[#081d27] min-h-screen">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-md border border-white/70">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-2xl h-11 w-11 bg-white dark:bg-[#081d27] text-slate-800 shadow-sm border border-white/70 hover:bg-[#e4e0d9] active:scale-95 transition-all"
          >
            <Link href="/manajemen/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
              Pengaturan Sistem Desa
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Konfigurasi identitas desa, kop surat, penyimpanan Drive, dan integrasi Google
            </p>
          </div>
        </div>

        {/* Action Button Simpan di Atas */}
        <Button
          onClick={handleSaveAllSettings}
          disabled={isSaving}
          className="h-11 px-6 gap-2 font-bold uppercase tracking-wider bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl shadow-sm border border-white/40 active:scale-95 transition-all"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </header>

      <div className="grid gap-8">
        {/* 1. Logo & Identitas Kop Surat */}
        <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 overflow-hidden">
          <CardHeader className="bg-[#0e1620] text-white p-6 sm:p-7 border-b border-white/10">
            <CardTitle className="text-lg font-extrabold uppercase tracking-tight text-amber-300 flex items-center gap-2.5">
              <Building2 className="h-5 w-5 text-amber-300" />
              Identitas & Logo Pemerintah Desa
            </CardTitle>
            <CardDescription className="text-xs text-slate-300">
              Logo dan nama instansi ini otomatis terintegrasi pada Kop Surat seluruh naskah dinas, dokumen penunjang, dan laporan PDF desa.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-7">
            {/* Logo Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40">
              <div
                className="relative h-28 w-28 rounded-2xl flex items-center justify-center bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] cursor-pointer overflow-hidden transition-all shrink-0"
                onClick={() => fileInputRef.current?.click()}
                title="Klik untuk memilih logo"
              >
                {localPreview ? (
                  <Image src={localPreview} alt="Logo Desa" fill className="object-contain p-2" unoptimized />
                ) : (
                  <div className="text-center p-2">
                    <ImagePlus className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Unggah Logo</span>
                  </div>
                )}
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-white dark:bg-[#081d27]/85 backdrop-blur-xs flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-800" />
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleLogoChange} />

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                  <h4 className="text-sm font-extrabold uppercase text-slate-900">Logo Resmi Desa (Format PNG / JPG)</h4>
                  {localPreview ? (
                    <Badge variant="outline" className="text-[10px] bg-white dark:bg-[#081d27] text-emerald-800 border-white/80 shadow-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> Terpasang
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-white dark:bg-[#081d27] text-amber-700 border-white/80 shadow-xs">
                      <AlertCircle className="h-3 w-3 mr-1 text-amber-500" /> Default
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Disarankan format transparan PNG berresolusi tajam dengan ukuran maksimal 800 KB. Logo akan langsung tampil di sidebar dan header dokumen PDF.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="h-9 px-4 rounded-xl text-xs font-bold uppercase bg-white dark:bg-[#081d27] shadow-xs border border-white/80 hover:bg-[#e4e0d9] text-slate-800 active:scale-95 transition-all"
                  >
                    <ImagePlus className="h-3.5 w-3.5 mr-1.5" /> Ganti Logo
                  </Button>
                  {localPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeLogo}
                      className="h-9 px-4 rounded-xl text-xs font-bold uppercase bg-white dark:bg-[#081d27] shadow-xs border border-white/80 text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 active:scale-95 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus Logo
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Identitas Instansi Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label className="text-[11px] font-extrabold uppercase text-slate-700 tracking-wider">Nama Desa</Label>
                <Input
                  value={namaDesa}
                  onChange={(e) => setNamaDesa(e.target.value)}
                  placeholder="Desa Sampeldes"
                  className="h-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-extrabold uppercase text-slate-700 tracking-wider">Kecamatan</Label>
                <Input
                  value={namaKecamatan}
                  onChange={(e) => setNamaKecamatan(e.target.value)}
                  placeholder="Kecamatan Gandrungmangu"
                  className="h-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-extrabold uppercase text-slate-700 tracking-wider">Kabupaten</Label>
                <Input
                  value={namaKabupaten}
                  onChange={(e) => setNamaKabupaten(e.target.value)}
                  placeholder="Kabupaten Cilacap"
                  className="h-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[11px] font-extrabold uppercase text-slate-700 tracking-wider">Alamat Kantor Desa</Label>
                <Input
                  value={alamatKantor}
                  onChange={(e) => setAlamatKantor(e.target.value)}
                  placeholder="Jl. Raya Sampeldes No. 01"
                  className="h-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-extrabold uppercase text-slate-700 tracking-wider">Kode Pos</Label>
                <Input
                  value={kodePos}
                  onChange={(e) => setKodePos(e.target.value)}
                  placeholder="53254"
                  className="h-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[11px] font-extrabold uppercase text-slate-700 tracking-wider">Email Resmi Desa</Label>
                <Input
                  value={emailDesa}
                  onChange={(e) => setEmailDesa(e.target.value)}
                  placeholder="pemdes.sampeldes@gmail.com"
                  className="h-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-extrabold uppercase text-slate-700 tracking-wider">Nomor Telepon / WhatsApp Desa</Label>
                <Input
                  value={teleponDesa}
                  onChange={(e) => setTeleponDesa(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="h-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Folder Google Drive (Pusat Arsip Digital) */}
        <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 overflow-hidden">
          <CardHeader className="bg-[#0e1620] text-white p-6 sm:p-7 border-b border-white/10">
            <CardTitle className="text-lg font-extrabold uppercase tracking-tight text-amber-300 flex items-center gap-2.5">
              <FolderOpen className="h-5 w-5 text-amber-300" />
              Folder Google Drive (Pusat Arsip Manajemen)
            </CardTitle>
            <CardDescription className="text-xs text-slate-300">
              Masukkan ID Folder atau tempel link URL Google Drive lengkap. Sistem otomatis mengenali dan menghubungkannya ke modul masing-masing.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Grid Folder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Folder Kegiatan */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-extrabold uppercase text-slate-800">
                    Folder Dokumentasi Kegiatan
                  </Label>
                  {kegiatanId.trim() ? (
                    <Badge variant="outline" className="text-[9px] bg-white dark:bg-[#081d27] text-emerald-800 border-white/80 shadow-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> Terintegrasi
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] bg-white dark:bg-[#081d27] text-slate-500 border-white/80 shadow-xs">
                      Belum Diatur
                    </Badge>
                  )}
                </div>
                <Input
                  placeholder="ID / Link Google Drive..."
                  value={kegiatanId}
                  onChange={(e) => setKegiatanId(e.target.value)}
                  className="h-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/60 text-xs font-mono font-bold text-slate-900"
                />
                <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-600 font-medium">
                  <span>Modul: Kegiatan Desa (Foto & Berkas)</span>
                  {kegiatanId.trim() && (
                    <a
                      href={`https://drive.google.com/drive/folders/${extractFolderId(kegiatanId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-extrabold"
                    >
                      <ExternalLink className="h-3 w-3" /> Buka Drive
                    </a>
                  )}
                </div>
              </div>

              {/* Folder Dokumen Fisik */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-extrabold uppercase text-slate-800">
                    Folder Dokumen Fisik & PBJ
                  </Label>
                  {physicalDocId.trim() ? (
                    <Badge variant="outline" className="text-[9px] bg-white dark:bg-[#081d27] text-emerald-800 border-white/80 shadow-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> Terintegrasi
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] bg-white dark:bg-[#081d27] text-slate-500 border-white/80 shadow-xs">
                      Belum Diatur
                    </Badge>
                  )}
                </div>
                <Input
                  placeholder="ID / Link Google Drive..."
                  value={physicalDocId}
                  onChange={(e) => setPhysicalDocId(e.target.value)}
                  className="h-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/60 text-xs font-mono font-bold text-slate-900"
                />
                <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-600 font-medium">
                  <span>Modul: Dokumen Fisik / Pembangunan</span>
                  {physicalDocId.trim() && (
                    <a
                      href={`https://drive.google.com/drive/folders/${extractFolderId(physicalDocId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-extrabold"
                    >
                      <ExternalLink className="h-3 w-3" /> Buka Drive
                    </a>
                  )}
                </div>
              </div>

              {/* Folder SPJ Desa */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-extrabold uppercase text-slate-800">
                    Folder Arsip SPJ Desa
                  </Label>
                  {spjId.trim() ? (
                    <Badge variant="outline" className="text-[9px] bg-white dark:bg-[#081d27] text-emerald-800 border-white/80 shadow-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> Terintegrasi
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] bg-white dark:bg-[#081d27] text-slate-500 border-white/80 shadow-xs">
                      Belum Diatur
                    </Badge>
                  )}
                </div>
                <Input
                  placeholder="ID / Link Google Drive..."
                  value={spjId}
                  onChange={(e) => setSpjId(e.target.value)}
                  className="h-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/60 text-xs font-mono font-bold text-slate-900"
                />
                <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-600 font-medium">
                  <span>Modul: Arsip Dokumen SPJ APBDes</span>
                  {spjId.trim() && (
                    <a
                      href={`https://drive.google.com/drive/folders/${extractFolderId(spjId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-extrabold"
                    >
                      <ExternalLink className="h-3 w-3" /> Buka Drive
                    </a>
                  )}
                </div>
              </div>

              {/* Folder Produk Hukum */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-extrabold uppercase text-slate-800">
                    Folder Produk Hukum (Perdes/Perkades)
                  </Label>
                  {phId.trim() ? (
                    <Badge variant="outline" className="text-[9px] bg-white dark:bg-[#081d27] text-emerald-800 border-white/80 shadow-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> Terintegrasi
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] bg-white dark:bg-[#081d27] text-slate-500 border-white/80 shadow-xs">
                      Belum Diatur
                    </Badge>
                  )}
                </div>
                <Input
                  placeholder="ID / Link Google Drive..."
                  value={phId}
                  onChange={(e) => setPhId(e.target.value)}
                  className="h-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/60 text-xs font-mono font-bold text-slate-900"
                />
                <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-600 font-medium">
                  <span>Modul: Arsip Perdes & Perkades</span>
                  {phId.trim() && (
                    <a
                      href={`https://drive.google.com/drive/folders/${extractFolderId(phId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-extrabold"
                    >
                      <ExternalLink className="h-3 w-3" /> Buka Drive
                    </a>
                  )}
                </div>
              </div>

              {/* Folder Undangan & Agenda */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-3 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-extrabold uppercase text-slate-800">
                    Folder Berkas Undangan & Agenda Desa
                  </Label>
                  {agendaFolderId.trim() ? (
                    <Badge variant="outline" className="text-[9px] bg-white dark:bg-[#081d27] text-emerald-800 border-white/80 shadow-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> Terintegrasi
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] bg-white dark:bg-[#081d27] text-slate-500 border-white/80 shadow-xs">
                      Belum Diatur
                    </Badge>
                  )}
                </div>
                <Input
                  placeholder="ID / Link Google Drive..."
                  value={agendaFolderId}
                  onChange={(e) => setAgendaFolderId(e.target.value)}
                  className="h-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/60 text-xs font-mono font-bold text-slate-900"
                />
                <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-600 font-medium">
                  <span>Modul: Input Agenda Surat Masuk / Undangan Masuk</span>
                  {agendaFolderId.trim() && (
                    <a
                      href={`https://drive.google.com/drive/folders/${extractFolderId(agendaFolderId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-extrabold"
                    >
                      <ExternalLink className="h-3 w-3" /> Buka Drive
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Integrasi Google Calendar */}
        <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 overflow-hidden">
          <CardHeader className="bg-[#0e1620] text-white p-6 sm:p-7 border-b border-white/10">
            <CardTitle className="text-lg font-extrabold uppercase tracking-tight text-amber-300 flex items-center gap-2.5">
              <CalendarDays className="h-5 w-5 text-amber-300" />
              Integrasi Google Calendar (Sinkronisasi Agenda Desa)
            </CardTitle>
            <CardDescription className="text-xs text-slate-300">
              Kalender ini dipakai untuk menampilkan agenda hari ini pada Dashboard manajemen, SPPD dinas luar, serta jadwal rapat desa.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-extrabold uppercase text-slate-800">
                  ID Google Kalender Desa (Email Kalender)
                </Label>
                {googleCalendarId.trim() ? (
                  <Badge variant="outline" className="text-[9px] bg-white dark:bg-[#081d27] text-emerald-800 border-white/80 shadow-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> Terintegrasi
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] bg-white dark:bg-[#081d27] text-slate-500 border-white/80 shadow-xs">
                    Belum Diatur
                  </Badge>
                )}
              </div>
              <Input
                placeholder="Contoh: pemdes.sampeldes@gmail.com atau id_kalender@group.calendar.google.com"
                value={googleCalendarId}
                onChange={(e) => setGoogleCalendarId(e.target.value)}
                className="h-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/60 text-xs font-mono font-bold text-slate-900"
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 text-[11px] text-slate-600 font-medium">
                <span>Terhubung ke: Dashboard (Agenda Hari Ini), Form Agenda, & SPPD Perjalanan Dinas</span>
                {googleCalendarId.trim() && (
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-extrabold"
                  >
                    <ExternalLink className="h-3 w-3" /> Buka Google Kalender
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrasi Backend Google Apps Script */}
        <Card className="rounded-3xl border border-stone-200/60 shadow-xl overflow-hidden bg-white/80 backdrop-blur-md">
          <CardHeader className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                <Zap className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-wider">
                  Backend Google Apps Script
                </CardTitle>
                <CardDescription className="text-xs text-emerald-100/80">
                  URL Web App Google Apps Script sebagai jembatan penyimpanan ke Google Drive & Kalender Desa.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-extrabold uppercase text-slate-800">
                  URL Web App Google Apps Script
                </Label>
                {appsScriptUrl.trim() ? (
                  <Badge variant="outline" className="text-[9px] bg-white dark:bg-[#081d27] text-emerald-800 border-white/80 shadow-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> Aktif
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] bg-white dark:bg-[#081d27] text-slate-500 border-white/80 shadow-xs">
                    Default Sistem
                  </Badge>
                )}
              </div>
              <Input
                placeholder="https://script.google.com/macros/s/.../exec"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                className="h-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/60 text-xs font-mono font-bold text-slate-900"
              />
              <p className="text-[11px] text-slate-500 font-medium">
                URL ini menghubungkan Form Agenda Kegiatan, Upload SPPD, dan Arsip Dokumen ke Google Cloud Desa Sampeldes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tombol Simpan Utama Bagian Bawah */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveAllSettings}
            disabled={isSaving}
            className="w-full sm:w-auto h-12 px-8 font-extrabold uppercase tracking-wider rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white shadow-md border border-white/70 active:scale-95 text-xs transition-all"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {isSaving ? "Menyimpan Konfigurasi..." : "Simpan Semua Pengaturan Sistem"}
          </Button>
        </div>

        {/* 4. Informasi Akun Aparatur & Logout */}
        <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Akun Login Pengelola Saat Ini:</p>
                <p className="text-sm font-black text-slate-900 font-mono">{user?.email || "Admin Lokal Terotorisasi"}</p>
                <p className="text-xs text-slate-600 mt-0.5">Sesi aktif pada Sistem Manajemen Operasional Desa Sampeldes</p>
              </div>
              <Button
                variant="destructive"
                className="h-11 px-6 gap-2 font-bold uppercase rounded-2xl shrink-0 bg-rose-600 hover:bg-rose-700 text-white shadow-sm active:scale-95 transition-all"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Keluar Sistem
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
