"use client"

import { useState, useMemo, useEffect } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, query, orderBy, where, doc } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Search, 
  Info,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  RefreshCw,
  Clock,
  Timer,
  LayoutList
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, getDaysInMonth, parseISO } from "date-fns"
import { id as localeID } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/**
 * Utilitas konversi waktu untuk kalkulasi
 */
const timeToSeconds = (t: string) => {
  if (!t) return 0;
  const parts = t.split(':').map(Number);
  return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
};

const formatSeconds = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}|${String(m).padStart(2, '0')}|${String(s).padStart(2, '0')}`;
};

export default function MonitoringAbsensiGrid() {
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "MM"))
  const [filterYear, setFilterYear] = useState(format(new Date(), "yyyy"))
  const [now, setNow] = useState(new Date())

  // Timer untuk update perhitungan jam kerja real-time setiap detik
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Otorisasi dasar: Jika user ada, kita izinkan tarik data personel (Rules Firestore mengizinkan publik baca)
  const canFetchData = !!(db && user && !isUserLoading);

  // Pengaturan Global
  const settingsRef = useMemoFirebase(() => 
    canFetchData ? doc(db, "absensi_settings", "global") : null, 
  [db, user, isUserLoading, canFetchData])
  const { data: settings } = useDoc(settingsRef)

  // Ambil Master Akun dari koleksi 'personel' (yang diinput di Manajemen Akun)
  const personelRef = useMemoFirebase(() => 
    canFetchData ? query(collection(db, "personel"), orderBy("nama", "asc")) : null, 
  [db, user, isUserLoading, canFetchData])
  const { data: personnelList, isLoading: isPersonelLoading } = useCollection(personelRef)

  // Ambil Data Absensi Bulan Terpilih
  const absensiRef = useMemoFirebase(() => {
    if (!canFetchData) return null;
    const startDate = `${filterYear}-${filterMonth}-01`;
    const endDate = `${filterYear}-${filterMonth}-31`; 
    return query(
        collection(db, "absensi"), 
        where("tanggal", ">=", startDate),
        where("tanggal", "<=", endDate),
        orderBy("tanggal", "asc")
    );
  }, [db, user, isUserLoading, canFetchData, filterMonth, filterYear])
  
  const { data: attendanceData, isLoading: isAttendanceLoading } = useCollection(absensiRef)

  const rekapGrid = useMemo(() => {
    // personnelList harus ada, tapi settings boleh null (pake default)
    if (!personnelList) return []

    const safeSettings = settings || {
        hari_kerja: ['senin', 'selasa', 'rabu', 'kamis', 'jumat'],
        hari_libur: [],
        jam_masuk: "08:00",
        toleransi_telat: 15,
        jadwal: {}
    };

    const workDays = safeSettings.hari_kerja || ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
    const holidays = safeSettings.hari_libur || [];
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const daysInMonth = getDaysInMonth(new Date(parseInt(filterYear), parseInt(filterMonth) - 1));
    
    const nowSec = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();

    return personnelList
      .filter(p => (p.nama || "").toLowerCase().includes(searchTerm.toLowerCase()) && p.role !== 'admin')
      .map(p => {
        const userMonthData: Record<number, any> = {}
        let s = 0, tk = 0, dl = 0
        let totalLatenessSec = 0
        let totalWorkSec = 0

        const uid = p.uid || p.id;

        if (attendanceData && uid) {
            const userAbsen = attendanceData.filter(a => a.personel_id === uid || a.id.startsWith(uid));
            userAbsen.forEach(a => {
                const parts = a.tanggal.split('-');
                if (parts.length === 3) {
                  const d = parseInt(parts[2]);
                  userMonthData[d] = a;
                }
            })
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${filterYear}-${filterMonth}-${d.toString().padStart(2, '0')}`;
            const checkDate = new Date(parseInt(filterYear), parseInt(filterMonth) - 1, d);
            const dayName = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'][checkDate.getDay()];
            
            // Logic Alpha Otomatis
            if (!userMonthData[d]) {
                if (dateStr <= todayStr && workDays.includes(dayName) && !holidays.includes(dateStr)) {
                    userMonthData[d] = { status: 'alpha' };
                }
            }

            const record = userMonthData[d];
            if (record) {
                if (record.status === 'izin') s++;
                if (record.status === 'alpha') tk++;
                if (record.status === 'dinas_luar') dl++;

                // Hitung Keterlambatan
                if (record.jam_masuk && record.status !== 'alpha' && record.status !== 'izin') {
                  const schedIn = safeSettings.jadwal?.[dayName]?.masuk || safeSettings.jam_masuk || "08:00";
                  const schedInSec = timeToSeconds(schedIn);
                  const actualInSec = timeToSeconds(record.jam_masuk);
                  
                  if (actualInSec > (schedInSec + ((safeSettings.toleransi_telat || 0) * 60))) {
                    totalLatenessSec += (actualInSec - schedInSec);
                  }

                  // Hitung Jam Kerja
                  if (record.jam_pulang) {
                    const actualOutSec = timeToSeconds(record.jam_pulang);
                    totalWorkSec += Math.max(0, actualOutSec - actualInSec);
                  } else if (dateStr === todayStr) {
                    // Masih bekerja (Orange status)
                    totalWorkSec += Math.max(0, nowSec - actualInSec);
                  }
                }
            }
        }

        return {
          ...p,
          attendance: userMonthData,
          stats: { s, tk, dl, totalLatenessSec, totalWorkSec },
          hasUid: !!p.uid
        }
      })
  }, [personnelList, attendanceData, searchTerm, settings, filterMonth, filterYear, now])

  const tableHeaderDays = Array.from({ length: 31 }, (_, i) => i + 1);

  // Perhitungan ringkasan statistik
  const totalPersonel = rekapGrid.length;
  const totalLatenessAll = rekapGrid.reduce((acc, curr) => acc + (curr.stats?.totalLatenessSec || 0), 0);
  const totalWorkAll = rekapGrid.reduce((acc, curr) => acc + (curr.stats?.totalWorkSec || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-condensed font-extrabold text-slate-900 uppercase tracking-tight leading-none">
            Monitoring Absensi
          </h1>
          <p className="text-xs text-slate-600 font-bold uppercase mt-1">
            Database Perangkat Desa • Presensi Harian & Kalkulasi Waktu Real-Time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Inset Search Input */}
          <div className="relative w-full sm:w-56 lg:w-64">
            <Search className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500", (isPersonelLoading || isAttendanceLoading) && "animate-spin text-amber-600")} />
            <input
              placeholder="Cari nama aparatur..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 h-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {/* Month & Year Filter Inset Pill */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 rounded-2xl p-1.5">
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[125px] h-8 border-none font-condensed font-extrabold uppercase text-xs bg-transparent text-slate-800 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#081d27] border-white/60 shadow-xl rounded-xl">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i+1} value={(i+1).toString().padStart(2, '0')} className="font-condensed font-bold uppercase text-xs text-slate-800">
                    {format(new Date(2024, i, 1), "MMMM", { locale: localeID })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="w-px h-4 bg-slate-300" />

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[85px] h-8 border-none font-condensed font-extrabold uppercase text-xs bg-transparent text-slate-800 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#081d27] border-white/60 shadow-xl rounded-xl">
                {["2024", "2025", "2026", "2027"].map(y => (
                  <SelectItem key={y} value={y} className="font-condensed font-bold text-xs text-slate-800">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Kartu Ringkasan Statistik Neumorphic */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#081d27] rounded-2xl p-4 shadow-[5px_5px_12px_#c9c5be,-5px_-5px_12px_#ffffff] border border-white/60 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-500/15 text-sky-700 flex items-center justify-center shrink-0">
            <LayoutList className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-condensed font-extrabold uppercase text-slate-500 tracking-wider">Total Personel</p>
            <p className="text-xl font-condensed font-black text-slate-900 leading-tight">{totalPersonel} Orang</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#081d27] rounded-2xl p-4 shadow-[5px_5px_12px_#c9c5be,-5px_-5px_12px_#ffffff] border border-white/60 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500/15 text-orange-600 flex items-center justify-center shrink-0">
            <Timer className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-condensed font-extrabold uppercase text-slate-500 tracking-wider">Total Terlambat</p>
            <p className="text-lg font-mono font-black text-orange-600 leading-tight truncate">{formatSeconds(totalLatenessAll)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#081d27] rounded-2xl p-4 shadow-[5px_5px_12px_#c9c5be,-5px_-5px_12px_#ffffff] border border-white/60 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-condensed font-extrabold uppercase text-slate-500 tracking-wider">Total Jam Kerja</p>
            <p className="text-lg font-mono font-black text-emerald-700 leading-tight truncate">{formatSeconds(totalWorkAll)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#081d27] rounded-2xl p-4 shadow-[5px_5px_12px_#c9c5be,-5px_-5px_12px_#ffffff] border border-white/60 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/15 text-indigo-700 flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-condensed font-extrabold uppercase text-slate-500 tracking-wider">Periode Aktif</p>
            <p className="text-sm font-condensed font-extrabold text-slate-900 leading-tight uppercase truncate">
              {format(new Date(parseInt(filterYear), parseInt(filterMonth) - 1, 1), "MMMM yyyy", { locale: localeID })}
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Utama Monitoring Presensi */}
      <div className="bg-white dark:bg-[#081d27] rounded-3xl p-3 sm:p-5 shadow-md border border-white/60 overflow-hidden">
        <div className="overflow-x-auto rounded-2xl border border-stone-300/60 shadow-inner">
          {isPersonelLoading ? (
            <div className="py-24 text-center flex flex-col items-center gap-3 bg-white dark:bg-[#081d27]">
              <Loader2 className="h-9 w-9 animate-spin text-amber-600" />
              <p className="text-xs font-condensed font-extrabold uppercase text-slate-600 tracking-wider">
                Sinkronisasi Database Presensi...
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-[#0e1620] text-white">
                  <th className="px-2 py-3.5 text-center font-condensed font-black border border-white/10 min-w-[32px]">NO</th>
                  <th className="px-2 py-3.5 text-center font-condensed font-black border border-white/10 min-w-[75px] bg-orange-700 text-white">TERLAMBAT</th>
                  <th className="px-2 py-3.5 text-center font-condensed font-black border border-white/10 min-w-[75px] bg-emerald-700 text-white">JAM KERJA</th>
                  <th className="px-4 py-3.5 text-left font-condensed font-black border border-white/10 min-w-[190px]">NAMA AKUN / JABATAN</th>
                  {tableHeaderDays.map(d => (
                    <th key={d} className="w-8 py-3.5 text-center font-mono font-bold border border-white/10 text-slate-200">{d}</th>
                  ))}
                  <th className="px-2 py-3.5 text-center font-condensed font-black border border-white/10 bg-sky-700 text-white" title="Sakit / Izin">S</th>
                  <th className="px-2 py-3.5 text-center font-condensed font-black border border-white/10 bg-rose-700 text-white" title="Tanpa Keterangan / Alpha">TK</th>
                  <th className="px-2 py-3.5 text-center font-condensed font-black border border-white/10 bg-indigo-700 text-white" title="Dinas Luar">DL</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {rekapGrid.length === 0 ? (
                  <tr>
                    <td colSpan={38} className="py-20 text-center bg-white dark:bg-[#081d27]/40">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <AlertCircle className="h-9 w-9 opacity-40 text-amber-600" />
                        <p className="text-sm font-condensed font-extrabold uppercase">Belum ada data aparatur terdaftar</p>
                        <p className="text-xs">Kelola personel melalui menu Pengaturan &gt; Manajemen Akun</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rekapGrid.map((row, idx) => (
                    <tr key={`${row.id || 'row'}-${idx}`} className={cn("hover:bg-amber-50/40 transition-colors border-b border-stone-200", !row.hasUid && "bg-amber-50/20")}>
                      <td className="px-2 py-2.5 text-center font-bold text-slate-600 border-r border-stone-200 bg-stone-50/50">{idx + 1}</td>
                      <td className="px-2 py-2.5 text-center font-mono font-black text-orange-600 border-r border-stone-200 bg-orange-50/30">{formatSeconds(row.stats.totalLatenessSec)}</td>
                      <td className="px-2 py-2.5 text-center font-mono font-black text-emerald-600 border-r border-stone-200 bg-emerald-50/30">{formatSeconds(row.stats.totalWorkSec)}</td>
                      <td className="px-4 py-2 border-r border-stone-200 relative group bg-white">
                        <div className="flex items-center gap-2">
                          <p className="font-condensed font-extrabold text-slate-900 uppercase leading-tight truncate max-w-[150px]">{row.nama}</p>
                          {!row.hasUid ? (
                            <div className="group/hint relative shrink-0">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                              <div className="absolute left-full top-0 ml-2 px-3 py-2 bg-slate-900 text-white text-[9px] rounded-xl opacity-0 group-hover/hint:opacity-100 transition-all whitespace-nowrap z-50 shadow-2xl pointer-events-none">
                                <p className="font-black mb-1 text-amber-400">UID BELUM TERTAUT</p>
                                <p className="font-medium opacity-80">Personel harus login minimal sekali di HP<br/>agar datanya sinkron di panel ini.</p>
                              </div>
                            </div>
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase truncate max-w-[170px]">{row.jabatan || 'PERANGKAT DESA'}</p>
                      </td>
                      {tableHeaderDays.map(d => {
                        const record = row.attendance[d]
                        const isDayValid = d <= getDaysInMonth(new Date(parseInt(filterYear), parseInt(filterMonth) - 1))

                        let statusColor = "bg-white"
                        if (record) {
                          if (record.jam_masuk && !record.jam_pulang && record.status !== 'alpha') statusColor = "bg-orange-500"
                          else if (record.status === 'hadir') statusColor = "bg-emerald-600"
                          else if (record.status === 'telat') statusColor = "bg-amber-500"
                          else if (record.status === 'alpha') statusColor = "bg-rose-600"
                          else if (record.status === 'izin' || record.status === 'dinas_luar') statusColor = "bg-sky-600"
                        }

                        return (
                          <td key={d} className={cn("border-r border-stone-200 text-center align-middle p-0.5", !isDayValid && "bg-stone-100")}>
                            {isDayValid && (
                              <div className={cn("w-full h-8 flex flex-col items-center justify-center rounded-sm transition-all shadow-xs", statusColor, record ? "text-white" : "text-transparent")}>
                                {record?.jam_masuk && <span className="font-mono font-bold leading-none text-[8.5px]">{record.jam_masuk.substring(0,5)}</span>}
                                {record?.jam_pulang && <span className="font-mono font-semibold text-[7px] mt-0.5 opacity-90">{record.jam_pulang.substring(0,5)}</span>}
                                {record?.status === 'alpha' && <span className="font-black text-[9px]">A</span>}
                                {record?.jam_masuk && !record?.jam_pulang && <span className="text-[5px] font-black mt-0.5 animate-pulse">AKTIF</span>}
                              </div>
                            )}
                          </td>
                        )
                      })}
                      <td className="text-center font-black bg-sky-50 border-r border-stone-200 text-sky-800">{row.stats.s || 0}</td>
                      <td className="text-center font-black bg-rose-50 border-r border-stone-200 text-rose-700">{row.stats.tk || 0}</td>
                      <td className="text-center font-black bg-indigo-50 border-r border-stone-200 text-indigo-800">{row.stats.dl || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Legenda Keterangan Neumorphic */}
      <div className="flex flex-wrap items-center gap-6 px-6 py-4 bg-white dark:bg-[#081d27] rounded-2xl shadow-[5px_5px_12px_#c9c5be,-5px_-5px_12px_#ffffff] border border-white/60">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-emerald-600 rounded-md shadow-xs" />
          <span className="text-[10px] font-condensed font-extrabold uppercase text-slate-700 tracking-wider">Hadir Tepat Waktu</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-amber-500 rounded-md shadow-xs" />
          <span className="text-[10px] font-condensed font-extrabold uppercase text-slate-700 tracking-wider">Terlambat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-orange-500 rounded-md shadow-xs" />
          <span className="text-[10px] font-condensed font-extrabold uppercase text-slate-700 tracking-wider">Sedang Bekerja (Aktif)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-rose-600 rounded-md shadow-xs" />
          <span className="text-[10px] font-condensed font-extrabold uppercase text-slate-700 tracking-wider">Alpha (TK)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-sky-600 rounded-md shadow-xs" />
          <span className="text-[10px] font-condensed font-extrabold uppercase text-slate-700 tracking-wider">Izin / Dinas Luar</span>
        </div>
      </div>
    </div>
  )
}
