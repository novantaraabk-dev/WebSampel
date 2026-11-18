"use client"

import { useState, useMemo } from "react"
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, setDoc, query, orderBy, writeBatch } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  UserPlus,
  Loader2,
  Save,
  AlertCircle,
  Info,
  ShieldCheck,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Sparkles,
  Layers,
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { getHolidayDescription } from "@/lib/indonesian-holidays"

const DAYS_MAP = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']

export default function InputAbsensiManual() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [savingProgress, setSavingProgress] = useState("")

  // Guard: Admin terotentikasi
  const isAuthorized = !!user

  // 1. Ambil Pengaturan Global Absensi (Hari Kerja & Hari Libur Nasional)
  const settingsRef = useMemoFirebase(() =>
    (db && user && isAuthorized) ? doc(db, "absensi_settings", "global") : null,
    [db, user, isAuthorized])
  const { data: globalSettings } = useDoc(settingsRef)

  // 2. Ambil daftar dari 'personel' (Database Akun) sebagai sumber utama
  const accountsRef = useMemoFirebase(() =>
    (db && user && isAuthorized) ? query(collection(db, "personel"), orderBy("nama", "asc")) : null,
    [db, user, isAuthorized])
  const { data: accountList, isLoading: isAccountsLoading } = useCollection(accountsRef)

  // Mode Pilihan Waktu: 'daily' (per tanggal) atau 'monthly' (1 bulan penuh)
  const [timeMode, setTimeMode] = useState<"daily" | "monthly">("daily")
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"))
  const [onlyWorkDays, setOnlyWorkDays] = useState<boolean>(true)

  const [formData, setFormData] = useState({
    accountId: "",
    tanggal: format(new Date(), "yyyy-MM-dd"),
    jam_masuk: "08:00",
    jam_pulang: "15:30",
    status: "hadir"
  })

  // Analisis Hari dalam Bulan Terpilih (Hari Kerja vs Hari Libur)
  const monthAnalysis = useMemo(() => {
    if (!selectedMonth) return { days: [], workDays: [], holidaysCount: 0, holidayList: [] }
    try {
      const [yearStr, monthStr] = selectedMonth.split("-")
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10) - 1
      const endDate = new Date(year, month + 1, 0)
      const totalDaysInMonth = endDate.getDate()

      const workDaysConfig: string[] = globalSettings?.hari_kerja || ["senin", "selasa", "rabu", "kamis", "jumat"]
      const holidaysConfig: string[] = globalSettings?.hari_libur || []

      const allDays: Array<{
        dateStr: string
        dayName: string
        dayNum: number
        isWorkDay: boolean
        isHoliday: boolean
        holidayTitle?: string
      }> = []

      const holidayList: Array<{ dateStr: string; title: string }> = []

      for (let day = 1; day <= totalDaysInMonth; day++) {
        const cur = new Date(year, month, day)
        const dateStr = format(cur, "yyyy-MM-dd")
        const dayName = DAYS_MAP[cur.getDay()]
        const isNormalWorkDay = workDaysConfig.includes(dayName)
        const isHol = holidaysConfig.includes(dateStr)
        const holTitle = getHolidayDescription(dateStr)

        if (isHol) {
          holidayList.push({
            dateStr,
            title: holTitle || "Hari Libur Nasional / Khusus"
          })
        }

        allDays.push({
          dateStr,
          dayName,
          dayNum: day,
          isWorkDay: isNormalWorkDay && !isHol,
          isHoliday: isHol || !isNormalWorkDay,
          holidayTitle: holTitle || undefined
        })
      }

      const activeWorkDays = allDays.filter(d => d.isWorkDay)

      return {
        totalDays: totalDaysInMonth,
        allDays,
        workDays: activeWorkDays,
        holidayList,
        year,
        monthName: format(new Date(year, month, 1), "MMMM yyyy")
      }
    } catch {
      return { totalDays: 0, allDays: [], workDays: [], holidayList: [] }
    }
  }, [selectedMonth, globalSettings])

  // Tanggal yang akan disimpan berdasarkan mode
  const targetDates = useMemo(() => {
    if (timeMode === "daily") {
      return [formData.tanggal]
    }
    if (onlyWorkDays) {
      return (monthAnalysis.workDays || []).map(d => d.dateStr)
    }
    return (monthAnalysis.allDays || []).map(d => d.dateStr)
  }, [timeMode, formData.tanggal, onlyWorkDays, monthAnalysis])

  // Hitung jumlah personil yang menjadi target
  const targetAccounts = useMemo(() => {
    const accounts = accountList || []
    if (formData.accountId === "all") {
      return accounts.filter(a => a.role !== "admin")
    }
    return accounts.filter(a => a.id === formData.accountId)
  }, [accountList, formData.accountId])

  const totalCalculatedEntries = targetAccounts.length * targetDates.length

  const handleSubmit = async () => {
    if (!db || !formData.accountId) {
      toast({ variant: "destructive", title: "Pilih Personel", description: "Silakan pilih akun perangkat terlebih dahulu." })
      return
    }

    if (targetDates.length === 0) {
      toast({
        variant: "destructive",
        title: "Tidak Ada Tanggal Terpilih",
        description: "Tidak ada hari kerja atau tanggal aktif pada bulan yang dipilih."
      })
      return
    }

    if (targetAccounts.length === 0) {
      toast({ variant: "destructive", title: "Data Personel Kosong", description: "Tidak ada akun perangkat yang cocok." })
      return
    }

    setIsSaving(true)
    setSavingProgress("Mempersiapkan data presensi...")

    try {
      let successEntriesCount = 0
      let unsyncedNames: string[] = []

      // Siapkan seluruh payload data presensi
      const payloadList: Array<{
        id: string
        personel_id: string
        nama: string
        tanggal: string
        jam_masuk: string
        jam_pulang: string
        status: string
        created_at: string
        input_by: string
      }> = []

      for (const acc of targetAccounts) {
        const targetUid = acc.uid || acc.id
        if (!acc.uid) {
          unsyncedNames.push(acc.nama)
        }

        for (const tgl of targetDates) {
          const absenId = `${targetUid}_${tgl}`
          payloadList.push({
            id: absenId,
            personel_id: targetUid,
            nama: acc.nama,
            tanggal: tgl,
            jam_masuk: formData.jam_masuk,
            jam_pulang: formData.jam_pulang,
            status: formData.status,
            created_at: new Date().toISOString(),
            input_by: "admin"
          })
        }
      }

      // Gunakan writeBatch chunking (maks 400 operasi per commit agar aman di bawah limit 500 Firestore)
      const BATCH_SIZE = 400
      let currentBatch = writeBatch(db)
      let opCount = 0

      for (let i = 0; i < payloadList.length; i++) {
        const item = payloadList[i]
        currentBatch.set(doc(db, "absensi", item.id), item, { merge: true })
        opCount++
        successEntriesCount++

        if (opCount >= BATCH_SIZE) {
          setSavingProgress(`Menyimpan ${i + 1} dari ${payloadList.length} data...`)
          await currentBatch.commit()
          currentBatch = writeBatch(db)
          opCount = 0
        }
      }

      if (opCount > 0) {
        await currentBatch.commit()
      }

      if (unsyncedNames.length > 0) {
        toast({
          variant: "destructive",
          title: "Catatan Akun Belum Sinkron UID",
          description: `${unsyncedNames.length} Perangkat (termasuk ${unsyncedNames[0]}) tersimpan dengan ID dokumen. Minta personel login di portal presensi untuk sinkronisasi UID penuh.`
        })
      }

      if (timeMode === "monthly") {
        toast({
          title: "Presensi 1 Bulan Berhasil Disimpan",
          description: `Berhasil mencatat ${successEntriesCount} presensi (${targetDates.length} hari untuk ${targetAccounts.length} personel) pada bulan ${selectedMonth}.`
        })
      } else {
        toast({
          title: "Presensi Harian Berhasil Disimpan",
          description: `${successEntriesCount} data presensi tanggal ${formData.tanggal} berhasil dicatat.`
        })
      }

    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: e.message || "Terjadi kesalahan saat menyimpan presensi." })
    } finally {
      setIsSaving(false)
      setSavingProgress("")
    }
  }

  if (!isAuthorized) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <header>
        <h1 className="text-2xl sm:text-3xl font-condensed font-extrabold text-slate-900 uppercase tracking-tight">
          Input Absensi Manual
        </h1>
        <p className="text-xs text-slate-600 font-bold uppercase mt-1">
          Pencatatan Presensi Khusus & Verifikasi Aparatur Desa (Harian & Bulanan)
        </p>
      </header>

      {/* Form Card Neumorphic */}
      <div className="bg-white dark:bg-[#081d27] rounded-3xl p-6 sm:p-8 shadow-md border border-white/60 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-300/60">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-condensed font-extrabold text-slate-900 uppercase tracking-wider">
              Formulir Input Presensi
            </h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase">
              Hasil input otomatis tercatat dan tersinkronisasi ke portal presensi
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Pilih Akun Perangkat */}
          <div className="space-y-1.5">
            <Label className="text-[10.5px] font-condensed font-extrabold uppercase text-slate-700 tracking-wider ml-1">
              Pilih Akun Perangkat Desa
            </Label>
            <div className="bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 rounded-2xl p-1">
              <Select value={formData.accountId} onValueChange={v => setFormData(p => ({ ...p, accountId: v }))}>
                <SelectTrigger className="h-11 border-none bg-transparent font-condensed font-extrabold uppercase text-xs text-slate-900 focus:ring-0">
                  <SelectValue placeholder={isAccountsLoading ? "Memuat Akun..." : "Pilih Nama Personel..."} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#081d27] border-white/60 shadow-2xl rounded-2xl">
                  <SelectItem value="all" className="font-condensed font-extrabold text-amber-800 uppercase text-xs bg-amber-500/10">
                    --- SELURUH PERANGKAT ({accountList?.filter(a => a.role !== 'admin').length || 0} PERSONEL MASSAL) ---
                  </SelectItem>
                  {accountList?.filter(a => a.role !== 'admin').map(a => (
                    <SelectItem key={a.id} value={a.id} className="font-condensed font-bold uppercase text-xs text-slate-800">
                      {a.nama} {!a.uid && " (BELUM SINKRON)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* PILIHAN MODE WAKTU: HARIAN ATAU BULANAN */}
          <div className="space-y-2 p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50">
            <div className="flex items-center justify-between">
              <Label className="text-[10.5px] font-condensed font-extrabold uppercase text-slate-800 tracking-wider">
                Mode Rentang Presensi
              </Label>
              <span className="text-[10px] font-bold uppercase text-stone-500">
                {timeMode === "daily" ? "Input 1 Tanggal" : "Input 1 Bulan Penuh"}
              </span>
            </div>

            {/* Segmented Buttons Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white dark:bg-[#081d27] shadow-inner">
              <button
                type="button"
                onClick={() => setTimeMode("daily")}
                className={`h-10 rounded-lg flex items-center justify-center gap-2 text-xs font-condensed font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  timeMode === "daily"
                    ? "bg-[#0284c7] text-white shadow-xs"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Harian (Per Tanggal)</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeMode("monthly")}
                className={`h-10 rounded-lg flex items-center justify-center gap-2 text-xs font-condensed font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  timeMode === "monthly"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                <span>Bulanan (1 Bulan Penuh)</span>
              </button>
            </div>

            {/* INPUT BERDASARKAN MODE */}
            {timeMode === "daily" ? (
              <div className="pt-2 space-y-1.5">
                <Label className="text-[10.5px] font-condensed font-extrabold uppercase text-slate-700 tracking-wider ml-1">
                  Tanggal Presensi
                </Label>
                <div className="bg-white dark:bg-[#081d27] shadow-xs border border-white/80 rounded-xl px-3 py-1">
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={e => setFormData(p => ({ ...p, tanggal: e.target.value }))}
                    className="w-full h-10 border-none bg-transparent font-mono font-bold text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="pt-2 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[10.5px] font-condensed font-extrabold uppercase text-slate-700 tracking-wider ml-1">
                    Pilih Bulan Presensi
                  </Label>
                  <div className="bg-white dark:bg-[#081d27] shadow-xs border border-white/80 rounded-xl px-3 py-1">
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="w-full h-10 border-none bg-transparent font-mono font-bold text-xs text-slate-900 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Opsi Lewati Akhir Pekan & Hari Libur Nasional */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40">
                  <div className="space-y-0.5">
                    <p className="text-xs font-condensed font-extrabold text-slate-900 uppercase">
                      Hanya Hari Kerja Resmi
                    </p>
                    <p className="text-[10px] text-stone-500 font-bold uppercase">
                      Sabtu, Minggu & Hari Libur Nasional dilewati otomatis
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="onlyWorkDaysCheck"
                    checked={onlyWorkDays}
                    onChange={e => setOnlyWorkDays(e.target.checked)}
                    className="h-5 w-5 accent-amber-600 rounded cursor-pointer"
                  />
                </div>

                {/* Pratinjau Rangkuman Hari dalam Bulan */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-600/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-condensed font-extrabold text-amber-900 uppercase">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-700" />
                      Pratinjau Bulan {selectedMonth}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px]">
                      {targetDates.length} Hari Kerja Terpilih
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-950 font-bold leading-relaxed">
                    Total hari kerja yang akan dicatat: <strong>{targetDates.length} Hari</strong> dari total {monthAnalysis.totalDays} hari kalender.
                    {monthAnalysis.holidayList && monthAnalysis.holidayList.length > 0 && onlyWorkDays && (
                      <span className="block text-[10px] text-amber-800 mt-1">
                        Libur Nasional yang dilewati: {monthAnalysis.holidayList.map(h => `${h.dateStr} (${h.title})`).join(", ")}.
                      </span>
                    )}
                  </p>

                  {targetAccounts.length > 0 && (
                    <div className="text-[11px] font-condensed font-extrabold text-slate-800 uppercase pt-1 border-t border-amber-600/20 flex items-center justify-between">
                      <span>Estimasi Data Presensi:</span>
                      <span className="text-amber-800 font-black">
                        {targetAccounts.length} Perangkat × {targetDates.length} Hari = {totalCalculatedEntries} Presensi
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status Kehadiran */}
          <div className="space-y-1.5">
            <Label className="text-[10.5px] font-condensed font-extrabold uppercase text-slate-700 tracking-wider ml-1">
              Status Kehadiran
            </Label>
            <div className="bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 rounded-2xl p-1">
              <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                <SelectTrigger className="h-10 border-none bg-transparent font-condensed font-extrabold uppercase text-xs text-slate-900 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#081d27] border-white/60 shadow-2xl rounded-2xl">
                  <SelectItem value="hadir" className="font-condensed font-bold text-emerald-700 text-xs uppercase">HADIR (TEPAT WAKTU)</SelectItem>
                  <SelectItem value="telat" className="font-condensed font-bold text-amber-700 text-xs uppercase">TELAT</SelectItem>
                  <SelectItem value="izin" className="font-condensed font-bold text-sky-700 text-xs uppercase">IZIN / SAKIT / CUTI</SelectItem>
                  <SelectItem value="dinas_luar" className="font-condensed font-bold text-indigo-700 text-xs uppercase">DINAS LUAR (DL)</SelectItem>
                  <SelectItem value="alpha" className="font-condensed font-bold text-rose-700 text-xs uppercase">ALPHA / TANPA KETERANGAN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            {/* Jam Masuk */}
            <div className="space-y-1.5">
              <Label className="text-[10.5px] font-condensed font-extrabold uppercase text-slate-700 tracking-wider ml-1">
                Jam Masuk
              </Label>
              <div className="bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 rounded-2xl px-3 py-1">
                <input
                  type="time"
                  value={formData.jam_masuk}
                  onChange={e => setFormData(p => ({ ...p, jam_masuk: e.target.value }))}
                  className="w-full h-10 border-none bg-transparent font-mono font-bold text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Jam Pulang */}
            <div className="space-y-1.5">
              <Label className="text-[10.5px] font-condensed font-extrabold uppercase text-slate-700 tracking-wider ml-1">
                Jam Pulang
              </Label>
              <div className="bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 rounded-2xl px-3 py-1">
                <input
                  type="time"
                  value={formData.jam_pulang}
                  onChange={e => setFormData(p => ({ ...p, jam_pulang: e.target.value }))}
                  className="w-full h-10 border-none bg-transparent font-mono font-bold text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className={`w-full h-13 rounded-2xl text-white font-condensed font-extrabold uppercase tracking-wider text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                timeMode === "monthly"
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  : "bg-[#0284c7] hover:bg-[#0369a1]"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                  <span>{savingProgress || "Menyimpan ke Database..."}</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 text-white" />
                  <span>
                    {timeMode === "monthly"
                      ? `Simpan Presensi 1 Bulan (${targetDates.length} Hari Kerja)`
                      : "Simpan Presensi Manual (Harian)"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Kartu Informasi Neumorphic */}
      <div className="p-5 bg-white dark:bg-[#081d27] rounded-2xl shadow-[5px_5px_12px_#c9c5be,-5px_-5px_12px_#ffffff] border border-white/60 flex items-start gap-3.5">
        <div className="h-8 w-8 rounded-xl bg-sky-500/15 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-condensed font-extrabold text-slate-800 uppercase tracking-wide">
            Petunjuk Penggunaan Presensi Bulanan:
          </p>
          <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase">
            Fitur Bulanan memudahkan admin untuk menginput presensi satu bulan penuh sekaligus. Sistem secara otomatis mendeteksi hari kerja resmi desa serta melewati hari libur nasional (SKB 3 Menteri) yang terdaftar di sistem.
          </p>
        </div>
      </div>
    </div>
  )
}
