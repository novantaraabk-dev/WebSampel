
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useAuth } from "@/firebase"
import { doc, collection, query, where, orderBy, setDoc, limit } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  Calendar as CalendarIcon,
  Navigation,
  Timer,
  RefreshCw,
  Clock,
  Filter,
  UserCheck,
  Home
} from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { id as localeID } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { calculateDistance, isHoliday, isWorkDay, parseTime } from "@/lib/attendance-utils"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const DAYS_MAP = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

export default function AbsensiDashboard() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [isLocLoading, setIsLocLoading] = useState(false)
  const [isAbsenLoading, setIsAbsenLoading] = useState(false)
  const [distance, setDistance] = useState<number | null>(null)

  const [filterStart, setFilterStart] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [filterEnd, setFilterEnd] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"))

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.replace("/absensi/login/")
      return;
    }
    // Jika admin, arahkan ke dashboard admin
    if (user.email === "admin@sampeldes.id" || user.uid === "sYuWEkzcvbUr1mYltcTqzxXEIr53") {
      router.replace("/absensi-admin/dashboard/")
    }
  }, [user, isUserLoading, router])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // PROFIL: Selalu sinkron dengan data yang dikelola Admin di Manajemen Akun
  const profileQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    const cleanEmail = (user.email || "").toLowerCase()
    if (cleanEmail && cleanEmail.endsWith("@sampeldes.id")) {
      return query(collection(db, "personel"), where("email", "==", cleanEmail), limit(1))
    }
    return query(collection(db, "personel"), where("uid", "==", user.uid), limit(1))
  }, [db, user])
  const { data: profileDocs, isLoading: isProfileLoading } = useCollection(profileQuery)
  const personelData = profileDocs && profileDocs.length > 0 ? profileDocs[0] : null

  // FOTO: Ambil data foto resmi dari /admin/pemerintahan (officials)
  const officialRef = useMemoFirebase(() => {
    if (!db || !personelData?.official_id) return null
    return doc(db, "officials", personelData.official_id)
  }, [db, personelData?.official_id])
  const { data: officialDoc } = useDoc(officialRef)

  // Fallback cari official berdasarkan nama jika official_id belum tersambung
  const officialByNameQuery = useMemoFirebase(() => {
    if (!db || !personelData?.nama || personelData?.official_id) return null
    return query(collection(db, "officials"), where("name", "==", personelData.nama), limit(1))
  }, [db, personelData?.nama, personelData?.official_id])
  const { data: officialByNameDocs } = useCollection(officialByNameQuery)
  const officialByName = officialByNameDocs?.[0] || null

  const userPhotoUrl = officialDoc?.imageUrl || officialByName?.imageUrl || personelData?.foto || ""

  const settingsRef = useMemoFirebase(() =>
    (db && user) ? doc(db, "absensi_settings", "global") : null,
    [db, user])
  const { data: settings } = useDoc(settingsRef)

  const effectiveUid = personelData?.uid || personelData?.historical_uid || user?.uid || ""
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const absenId = effectiveUid ? `${effectiveUid}_${todayStr}` : ""

  // REAL-TIME: Pantau data absensi hari ini (bisa dari input Admin atau HP)
  const todayAbsenRef = useMemoFirebase(() =>
    (db && user && absenId) ? doc(db, "absensi", absenId) : null,
    [db, user, absenId])
  const { data: todayAbsen } = useDoc(todayAbsenRef)

  const historyQuery = useMemoFirebase(() => {
    if (!db || !user || !effectiveUid) return null
    return query(
      collection(db, "absensi"),
      where("personel_id", "==", effectiveUid),
      where("tanggal", ">=", filterStart),
      where("tanggal", "<=", filterEnd),
      orderBy("tanggal", "desc")
    )
  }, [db, user, effectiveUid, filterStart, filterEnd])

  const { data: history, isLoading: isHistoryLoading } = useCollection(historyQuery)

  // Gabungkan riwayat kehadiran bulan ini: Data presensi riil + Tanggal hari kerja tanpa absen otomatis menjadi ALPHA
  const completeHistory = useMemo(() => {
    if (!user) return []

    // Map existing history by tanggal
    const historyMap = new Map<string, any>()
    ;(history || []).forEach((item) => {
      if (item.tanggal) {
        historyMap.set(item.tanggal, item)
      }
    })

    // Masukkan data hari ini jika ada
    if (todayAbsen?.tanggal && todayAbsen?.jam_masuk) {
      historyMap.set(todayAbsen.tanggal, { ...todayAbsen, ...historyMap.get(todayAbsen.tanggal) })
    }

    const workDays = settings?.hari_kerja || ['senin', 'selasa', 'rabu', 'kamis', 'jumat']
    const holidays = settings?.hari_libur || []

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed
    const todayDateNum = now.getDate()

    // Jadwal pulang hari ini untuk menentukan apakah hari ini sudah selesai jam kerjanya
    const todayDayName = DAYS_MAP[now.getDay()]
    const todaySchedule = settings?.jadwal?.[todayDayName] || { masuk: settings?.jam_masuk, pulang: settings?.jam_pulang }
    const jamPulangSetting = parseTime(todaySchedule.pulang || "15:00")
    const isTodayWorkHoursEnded = now > jamPulangSetting

    const result: any[] = []

    // Iterasi dari hari ini mundur ke tanggal 1 bulan ini
    for (let day = todayDateNum; day >= 1; day--) {
      const dateObj = new Date(currentYear, currentMonth, day)
      const dateStr = format(dateObj, "yyyy-MM-dd")
      const dayName = DAYS_MAP[dateObj.getDay()]

      const isWorkDayName = workDays.includes(dayName)
      const isManualHoliday = holidays.includes(dateStr)

      const existingRecord = historyMap.get(dateStr)

      if (existingRecord) {
        result.push(existingRecord)
      } else {
        // Jika tidak ada catatan presensi pada tanggal tersebut:
        // Tampilkan sebagai ALPHA hanya jika hari kerja dan bukan hari libur
        if (isWorkDayName && !isManualHoliday) {
          // Khusus hari ini: hanya tandai alpha jika jam kerja sudah berakhir dan belum ada absen sama sekali
          if (dateStr === todayStr) {
            if (isTodayWorkHoursEnded) {
              result.push({
                id: `alpha_${user.uid}_${dateStr}`,
                tanggal: dateStr,
                jam_masuk: "-",
                jam_pulang: "-",
                status: "alpha",
              })
            }
          } else {
            // Hari kerja di masa lalu yang dilewati tanpa presensi -> ALPHA
            result.push({
              id: `alpha_${user.uid}_${dateStr}`,
              tanggal: dateStr,
              jam_masuk: "-",
              jam_pulang: "-",
              status: "alpha",
            })
          }
        }
      }
    }

    return result
  }, [user, history, todayAbsen, settings, todayStr])

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("absensi_device_session")
        localStorage.removeItem("absensi_saved_username")
        localStorage.removeItem("absensi_saved_name")
        localStorage.removeItem("absensi_saved_email")
      }
      if (auth) {
        await signOut(auth)
      }
      router.replace("/absensi/login/?logout=true")
    } catch (error) {
      console.error("Sign out error", error)
      router.replace("/absensi/login/?logout=true")
    }
  }

  const getGeolocation = useCallback(() => {
    setIsLocLoading(true)
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "GPS Error", description: "Browser tidak mendukung lokasi." })
      setIsLocLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocation(coords)
        if (settings?.lokasi_kantor) {
          const d = calculateDistance(coords.lat, coords.lng, settings.lokasi_kantor.lat, settings.lokasi_kantor.lng)
          setDistance(d)
        }
        setIsLocLoading(false)
      },
      (err) => {
        toast({ variant: "destructive", title: "GPS Gagal", description: "Izinkan akses lokasi." })
        setIsLocLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }, [settings, toast])

  useEffect(() => {
    if (settings && !location) getGeolocation()
  }, [settings, location, getGeolocation])

  const handleAbsenMasuk = async () => {
    if (!user || !settings || !location || !db || !personelData) return

    if (personelData.aktif === false) {
      toast({ variant: "destructive", title: "Akun Dinonaktifkan" });
      return;
    }

    if (distance !== null && distance > (settings.radius_lokasi || 100)) {
      toast({ variant: "destructive", title: "Luar Jangkauan", description: "Anda berada di luar radius kantor." })
      return
    }

    setIsAbsenLoading(true)
    const todayDayName = DAYS_MAP[currentTime.getDay()];
    const todaySchedule = settings.jadwal?.[todayDayName] || { masuk: settings.jam_masuk, pulang: settings.jam_pulang };
    const jamMasukSetting = parseTime(todaySchedule.masuk || "08:00")
    const limitMasuk = new Date(jamMasukSetting.getTime() + ((settings.toleransi_telat || 0) * 60000))
    const statusMasuk = currentTime > limitMasuk ? "telat" : "hadir"
    // Belum absen pulang -> status sementara dianggap 'telat' (belum lengkap)
    const status = "telat"

    try {
      await setDoc(doc(db, "absensi", absenId), {
        id: absenId,
        personel_id: effectiveUid,
        nama: personelData.nama || "Perangkat Desa",
        tanggal: todayStr,
        jam_masuk: format(currentTime, "HH:mm:ss"),
        status_masuk: statusMasuk,
        status: status,
        lokasi_masuk: location,
        created_at: new Date().toISOString()
      }, { merge: true })
      toast({ title: "Absen Berangkat Berhasil", description: statusMasuk === 'telat' ? 'TELAT MASUK' : 'TEPAT WAKTU (BELUM ABSEN PULANG)' })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal Simpan" })
    } finally {
      setIsAbsenLoading(false)
    }
  }

  const handleAbsenPulang = async () => {
    if (!user || !todayAbsen || !location || !db || !settings) return
    setIsAbsenLoading(true)
    try {
      const todayDayName = DAYS_MAP[currentTime.getDay()];
      const todaySchedule = settings.jadwal?.[todayDayName] || { masuk: settings.jam_masuk, pulang: settings.jam_pulang };
      const jamMasukSetting = parseTime(todaySchedule.masuk || "08:00")
      const limitMasuk = new Date(jamMasukSetting.getTime() + ((settings.toleransi_telat || 0) * 60000))

      // Evaluasi apakah jam masuk hari ini tepat waktu
      const jamMasukTime = todayAbsen.jam_masuk ? parseTime(todayAbsen.jam_masuk) : null
      const isLateMasuk = todayAbsen.status_masuk ? todayAbsen.status_masuk === 'telat' : (jamMasukTime ? jamMasukTime > limitMasuk : false)
      const finalStatus = isLateMasuk ? "telat" : "hadir"

      await setDoc(doc(db, "absensi", absenId), {
        jam_pulang: format(currentTime, "HH:mm:ss"),
        lokasi_pulang: location,
        status: finalStatus,
      }, { merge: true })
      toast({ title: "Absen Pulang Berhasil", description: finalStatus === 'hadir' ? 'PRESENSI LENGKAP (HADIR)' : 'TELAT' })
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal Simpan" })
    } finally {
      setIsAbsenLoading(false)
    }
  }

  // Helper: Dapatkan status efektif presensi
  // Bila sudah absen masuk tetapi belum absensi pulang (dan bukan izin/dinas luar/alpha) -> dianggap "telat" (orange)
  const getEffectiveStatus = (record?: {
    status?: string;
    jam_masuk?: string;
    jam_pulang?: string;
  } | null): string => {
    if (!record) return "";
    if (record.status === "izin" || record.status === "dinas_luar" || record.status === "alpha") {
      return record.status;
    }
    // Jika belum ada jam masuk atau belum ada jam pulang -> dianggap "telat"
    if (!record.jam_masuk || !record.jam_pulang) {
      return "telat";
    }
    return record.status === "telat" ? "telat" : "hadir";
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-700/50 mx-auto" />
          <p className="text-[11px] font-condensed font-extrabold text-slate-600 uppercase tracking-widest">
            Sinkronisasi Sesi Presensi...
          </p>
        </div>
      </div>
    )
  }

  if (!user) return null
  const inRadius = distance !== null && distance <= (settings?.radius_lokasi || 100)
  const todayDayName = DAYS_MAP[currentTime.getDay()];
  const displaySchedule = settings?.jadwal?.[todayDayName] || { masuk: settings?.jam_masuk, pulang: settings?.jam_pulang };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-16">
      {/* Kartu Profil Aparatur Neumorphic */}
      <div className="bg-white dark:bg-[#081d27] rounded-3xl p-5 sm:p-6 shadow-md border border-white/60 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700 shrink-0 shadow-inner">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-condensed font-extrabold text-slate-900 uppercase tracking-tight leading-none">
              Portal Presensi Mandiri
            </h1>
            <div className="mt-1">
              <p className="text-sm font-condensed font-extrabold text-slate-800 uppercase leading-tight">
                {personelData?.nama || "PENGGUNA"}
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {personelData?.jabatan || "PERANGKAT DESA"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={getGeolocation}
          disabled={isLocLoading}
          className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm active:scale-95 border border-stone-200/60 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-emerald-700 transition-all cursor-pointer shrink-0"
          title="Segarkan Lokasi GPS"
        >
          <RefreshCw className={cn("h-4 w-4", isLocLoading && "animate-spin text-emerald-600")} />
        </button>
      </div>

      {/* Clock & Geolocation Card in #0e1620 Dark Blue */}
      <section className="bg-[#0e1620] text-white p-5 sm:p-7 rounded-3xl shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Timer className="h-36 w-36" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-6">
          {/* Foto Resmi dari Pemerintahan Desa di Sebelah Kiri */}
          <div className="relative shrink-0">
            {userPhotoUrl ? (
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)] bg-slate-900/80">
                <img
                  src={userPhotoUrl}
                  alt={personelData?.nama || "Perangkat Desa"}
                  className="h-full w-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e1620]/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-1 left-1 right-1 px-1 py-0.5 rounded-sm bg-black/60 backdrop-blur-xs text-[8px] font-bold uppercase text-center text-emerald-400 tracking-wider truncate">
                  Perangkat Desa
                </div>
              </div>
            ) : (
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-2 border-white/15 bg-white/5 flex flex-col items-center justify-center text-slate-400 shadow-inner">
                <div className="h-11 w-11 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-black text-base flex items-center justify-center mb-1">
                  {personelData?.nama ? personelData.nama.substring(0, 2).toUpperCase() : "PD"}
                </div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-stone-400">
                  Foto Resmi
                </span>
              </div>
            )}
          </div>

          {/* Bagian Jam, Tanggal & GPS */}
          <div className="flex-1 flex flex-col justify-center text-center sm:text-left space-y-2.5 min-w-0">
            <p className="text-xs font-condensed font-extrabold uppercase tracking-[0.2em] text-emerald-400">
              {format(currentTime, "EEEE, d MMMM yyyy", { locale: localeID })}
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-condensed font-black tracking-tight leading-none">
              {format(currentTime, "HH:mm")}
              <span className="text-xl ml-2 font-mono text-emerald-400 font-bold">
                {format(currentTime, "ss")}
              </span>
            </h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider">
                  {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "MENCARI GPS..."}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <p className="text-[10px] font-condensed font-extrabold uppercase tracking-wider">
                  JADWAL: {displaySchedule?.masuk || '--'} - {displaySchedule?.pulang || '--'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Jam Masuk & Pulang Stats Neumorphic */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#081d27] rounded-3xl p-5 shadow-[5px_5px_12px_#c9c5be,-5px_-5px_12px_#ffffff] border border-white/60 space-y-1">
          <p className="text-[10px] font-condensed font-extrabold uppercase text-slate-500 tracking-wider">Jam Masuk</p>
          <p className="text-2xl sm:text-3xl font-mono font-black text-slate-900 leading-tight">
            {todayAbsen?.jam_masuk || "--:--"}
          </p>
          {todayAbsen?.jam_masuk && (
            <Badge variant="outline" className={cn(
              "text-[9px] font-condensed font-extrabold uppercase mt-1 px-2 py-0.5",
              getEffectiveStatus(todayAbsen) === 'telat' ? 'text-amber-700 border-amber-300 bg-amber-500/10' :
                getEffectiveStatus(todayAbsen) === 'hadir' ? 'text-emerald-700 border-emerald-300 bg-emerald-500/10' :
                  todayAbsen.status === 'izin' || todayAbsen.status === 'dinas_luar' ? 'text-sky-700 border-sky-300 bg-sky-500/10' :
                    'text-rose-700 border-rose-300 bg-rose-500/10'
            )}>
              {getEffectiveStatus(todayAbsen)}
            </Badge>
          )}
        </div>

        <div className="bg-white dark:bg-[#081d27] rounded-3xl p-5 shadow-[5px_5px_12px_#c9c5be,-5px_-5px_12px_#ffffff] border border-white/60 space-y-1">
          <p className="text-[10px] font-condensed font-extrabold uppercase text-slate-500 tracking-wider">Jam Pulang</p>
          <p className="text-2xl sm:text-3xl font-mono font-black text-slate-900 leading-tight">
            {todayAbsen?.jam_pulang || "--:--"}
          </p>
          {todayAbsen?.jam_pulang && (
            <Badge variant="outline" className="text-[9px] font-condensed font-extrabold uppercase text-emerald-700 border-emerald-300 bg-emerald-500/10 mt-1 px-2 py-0.5">
              SELESAI
            </Badge>
          )}
        </div>
      </div>

      {/* Tombol Utama Presensi Neumorphic */}
      <div className="space-y-4">
        {!todayAbsen?.jam_masuk ? (
          <button
            type="button"
            onClick={handleAbsenMasuk}
            disabled={isAbsenLoading || isLocLoading || !inRadius || personelData?.aktif === false}
            className="w-full h-18 sm:h-20 rounded-full text-lg sm:text-xl font-condensed font-black uppercase tracking-wider shadow-[0_12px_28px_-4px_rgba(5,150,105,0.55)] hover:shadow-[0_16px_34px_-4px_rgba(5,150,105,0.7)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-3.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 text-white border-2 border-emerald-300/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAbsenLoading ? (
              <Loader2 className="animate-spin h-6 w-6 text-white" />
            ) : (
              <Navigation className="h-6 w-6 text-white" />
            )}
            <span>{personelData?.aktif === false ? 'AKUN NONAKTIF' : 'Absen Berangkat'}</span>
          </button>
        ) : !todayAbsen?.jam_pulang ? (
          <button
            type="button"
            onClick={handleAbsenPulang}
            disabled={isAbsenLoading || isLocLoading}
            className="w-full h-18 sm:h-20 rounded-full text-lg sm:text-xl font-condensed font-black uppercase tracking-wider shadow-[0_12px_28px_-4px_rgba(234,88,12,0.55)] hover:shadow-[0_16px_34px_-4px_rgba(234,88,12,0.7)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:via-orange-400 hover:to-rose-500 text-white border-2 border-amber-300/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAbsenLoading ? (
              <Loader2 className="animate-spin h-6 w-6 text-white" />
            ) : (
              <Navigation className="h-6 w-6 rotate-180 text-white" />
            )}
            <span>Absen Pulang</span>
          </button>
        ) : (
          <div className="bg-white dark:bg-[#081d27] rounded-3xl p-6 shadow-inner border border-stone-300/50 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <p className="text-sm font-condensed font-extrabold text-emerald-800 uppercase tracking-wider">
              Presensi Hari Ini Selesai
            </p>
            <p className="text-xs text-slate-600 font-bold">
              Terima kasih atas dedikasi dan kerja keras Anda hari ini.
            </p>
          </div>
        )}

        {/* Indikator Radius GPS Neumorphic */}
        <div className={cn(
          "p-4 rounded-2xl flex items-center gap-3.5 border transition-all shadow-[5px_5px_12px_#c9c5be,-5px_-5px_12px_#ffffff]",
          inRadius ? "bg-white dark:bg-[#081d27] border-emerald-400/60" : "bg-white dark:bg-[#081d27] border-rose-400/60"
        )}>
          {inRadius ? (
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-xl bg-rose-500/20 text-rose-700 flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-condensed font-extrabold uppercase text-slate-800">
              {inRadius ? "Berada Dalam Radius Kantor Desa" : "Berada di Luar Radius Kantor Desa"}
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase truncate">
              {distance ? `${Math.round(distance)} meter dari titik koordinat kantor` : "Memeriksa jangkauan GPS..."}
            </p>
          </div>
          <button
            onClick={getGeolocation}
            disabled={isLocLoading}
            className="h-8 w-8 rounded-xl bg-white dark:bg-[#081d27] shadow-xs active:scale-95 flex items-center justify-center text-slate-600 hover:text-emerald-700"
            title="Update Titik Lokasi"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLocLoading && "animate-spin text-emerald-600")} />
          </button>
        </div>
      </div>

      {/* Riwayat Kehadiran Neumorphic */}
      <section className="space-y-3.5 pt-2">
        <h3 className="text-sm font-condensed font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 px-1">
          <CalendarIcon className="h-4 w-4 text-emerald-700" />
          <span>Riwayat Kehadiran Bulan Ini</span>
        </h3>

        <div className="grid gap-3">
          {isHistoryLoading ? (
            <div className="py-12 text-center bg-white dark:bg-[#081d27] rounded-3xl shadow-inner border border-stone-300/40">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-700 mx-auto" />
              <p className="text-xs font-condensed font-bold uppercase text-slate-500 mt-2">Memuat riwayat presensi...</p>
            </div>
          ) : completeHistory.length === 0 ? (
            <div className="py-10 text-center bg-white dark:bg-[#081d27] rounded-3xl shadow-inner border border-stone-300/40">
              <p className="text-xs font-condensed font-bold uppercase text-slate-500">Belum ada catatan presensi pada periode ini.</p>
            </div>
          ) : (
            completeHistory.map((h, idx) => {
              const effStatus = getEffectiveStatus(h);
              const isAlpha = effStatus === 'alpha';
              return (
                <div
                  key={`${h.id || 'hist'}-${h.tanggal || idx}`}
                  className={cn(
                    "p-4 bg-white dark:bg-[#081d27] rounded-2xl shadow-[4px_4px_10px_#c9c5be,-4px_-4px_10px_#ffffff] border flex items-center justify-between transition-all hover:scale-[1.01]",
                    isAlpha ? "border-rose-300/60 dark:border-rose-500/30 bg-rose-500/[0.03]" : "border-white/60"
                  )}
                >
                  <div>
                    <p className={cn(
                      "text-xs font-condensed font-extrabold uppercase",
                      isAlpha ? "text-rose-700 dark:text-rose-400" : "text-slate-900 dark:text-white"
                    )}>
                      {format(new Date(h.tanggal.includes("T") ? h.tanggal : h.tanggal + "T00:00:00"), "EEEE, d MMMM yyyy", { locale: localeID })}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                      Masuk: {h.jam_masuk || "-"} • Pulang: {h.jam_pulang || "-"}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "text-[9px] font-condensed font-extrabold uppercase px-2.5 py-1 rounded-lg border-0 shadow-xs",
                      effStatus === 'hadir' ? 'bg-emerald-600 text-white' :
                        effStatus === 'telat' ? 'bg-amber-500 text-white' :
                          effStatus === 'izin' || effStatus === 'dinas_luar' ? 'bg-sky-600 text-white' :
                            'bg-rose-600 text-white'
                    )}
                  >
                    {effStatus}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  )
}
