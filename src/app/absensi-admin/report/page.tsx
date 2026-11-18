
"use client"

import { useState, useMemo } from "react"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Printer,
  FileSpreadsheet,
  Loader2,
  FileText,
  ChevronRight,
  Download
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, getDaysInMonth } from "date-fns"
import { id as localeID } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { generateAttendancePDF } from "@/lib/pdf-attendance-report"
import * as XLSX from "xlsx"

export default function CetakDokumenAbsensi() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const [filterMonth, setFilterMonth] = useState(format(new Date(), "MM"))
  const [filterYear, setFilterYear] = useState(format(new Date(), "yyyy"))
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isPrintingPDF, setIsPrintingPDF] = useState(false)

  const isAuthorized = !!user;

  // 1. Ambil Data Desa (untuk Logo & Info)
  const villageRef = useMemoFirebase(() => (db && user && isAuthorized) ? doc(db, "settings", "village") : null, [db, user, isAuthorized])
  const { data: villageSettings } = useDoc(villageRef)

  // 2. Ambil Master Personel dari Database Akun
  const personnelRef = useMemoFirebase(() => (db && user && isAuthorized) ? collection(db, "personel") : null, [db, user, isAuthorized])
  const { data: personnelList, isLoading: isPersonnelLoading } = useCollection(personnelRef)

  // 3. Ambil Seluruh Data Absensi
  const absensiRef = useMemoFirebase(() =>
    (db && user && isAuthorized) ? query(collection(db, "absensi"), orderBy("tanggal", "asc")) : null,
    [db, user, isAuthorized])
  const { data: attendanceData, isLoading: isAttendanceLoading } = useCollection(absensiRef)

  // 4. Ambil Pengaturan Absensi (Hari Kerja & Libur)
  const settingsRef = useMemoFirebase(() =>
    (db && user && isAuthorized) ? doc(db, "absensi_settings", "global") : null,
    [db, user, isAuthorized])
  const { data: attendanceSettings, isLoading: isSettingsLoading } = useDoc(settingsRef)

  // 5. Logika Rekap Data Laporan & Alpha Otomatis
  const reportData = useMemo(() => {
    if (!personnelList || !attendanceData || !attendanceSettings) return []

    const workDays = attendanceSettings.hari_kerja || ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
    const holidays = attendanceSettings.hari_libur || [];
    const daysInMonth = getDaysInMonth(new Date(parseInt(filterYear), parseInt(filterMonth) - 1));
    const todayStr = format(new Date(), "yyyy-MM-dd");

    return personnelList
      .filter(p => p.role !== 'admin')
      .map(p => {
        const userMonthData: Record<number, any> = {}
        let s = 0, tk = 0, dl = 0, h = 0, t = 0

        const uid = p.uid || p.id;

        // Cari data absen yang cocok dengan personel ini di bulan terpilih
        const filteredAbsen = attendanceData.filter(a => {
          const matchesId = a.personel_id === uid || a.id.startsWith(uid);
          const matchesMonth = a.tanggal?.startsWith(`${filterYear}-${filterMonth}`);
          return matchesId && matchesMonth;
        })

        // Masukkan data absen real ke dalam kalender bulan
        filteredAbsen.forEach(a => {
          const parts = a.tanggal.split('-');
          if (parts.length === 3) {
            const d = parseInt(parts[2]);
            userMonthData[d] = a;
          }
        })

        // Cek setiap tanggal untuk Alpha Otomatis
        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${filterYear}-${filterMonth}-${d.toString().padStart(2, '0')}`;

          if (!userMonthData[d]) {
            const checkDate = new Date(parseInt(filterYear), parseInt(filterMonth) - 1, d);
            const dayName = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'][checkDate.getDay()];

            // Jika hari kerja, bukan hari libur manual, dan di masa lalu/hari ini
            if (dateStr <= todayStr && workDays.includes(dayName) && !holidays.includes(dateStr)) {
              userMonthData[d] = { status: 'alpha' };
            }
          }

          // Hitung Statistik
          const record = userMonthData[d];
          if (record) {
            // Logika baru: Jika masuk tapi tidak pulang, anggap telat/incomplete (T)
            const isStillWorking = record.jam_masuk && !record.jam_pulang && record.status !== 'alpha' && record.status !== 'izin' && record.status !== 'dinas_luar';

            if (record.status === 'izin') s++;
            else if (record.status === 'alpha') tk++;
            else if (record.status === 'dinas_luar') dl++;
            else if (isStillWorking || record.status === 'telat') t++;
            else if (record.status === 'hadir') h++;
          }
        }

        return {
          ...p,
          name: (p.nama || p.username || "-").toUpperCase(),
          jabatan: (p.jabatan || "PERANGKAT DESA").toUpperCase(),
          attendance: userMonthData,
          stats: { h, t, s, tk, dl }
        }
      })
  }, [personnelList, attendanceData, attendanceSettings, filterMonth, filterYear])

  const handleDownloadExcel = () => {
    if (reportData.length === 0) return

    const daysInMonth = getDaysInMonth(new Date(parseInt(filterYear), parseInt(filterMonth) - 1))
    const monthName = format(new Date(2024, parseInt(filterMonth) - 1, 1), "MMMM", { locale: localeID }).toUpperCase()

    const excelRows = reportData.map((row, idx) => {
      const data: any = {
        "NO": idx + 1,
        "NAMA LENGKAP": row.name,
        "JABATAN": row.jabatan
      }

      for (let d = 1; d <= 31; d++) {
        if (d <= daysInMonth) {
          const record = row.attendance[d]
          let statusText = "";
          if (record) {
            const isStillWorking = record.jam_masuk && !record.jam_pulang && record.status !== 'alpha' && record.status !== 'izin' && record.status !== 'dinas_luar';
            statusText = isStillWorking ? "TELAT" : record.status.toUpperCase();
          }
          data[d.toString()] = statusText;
        } else {
          data[d.toString()] = "-"
        }
      }

      data["HADIR"] = row.stats.h
      data["TELAT"] = row.stats.t
      data["IJIN/SAKIT"] = row.stats.s
      data["ALPHA"] = row.stats.tk
      data["DL"] = row.stats.dl

      return data
    })

    const ws = XLSX.utils.json_to_sheet(excelRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi")
    XLSX.writeFile(wb, `REKAP_ABSENSI_${monthName}_${filterYear}.xlsx`)
    toast({ title: "Excel Berhasil", description: "Laporan telah diunduh." })
  }

  const handleDownloadPDF = async () => {
    if (reportData.length === 0) {
      toast({ variant: "destructive", title: "Data Belum Siap", description: "Menunggu sinkronisasi database..." });
      return;
    }
    setIsGeneratingPDF(true)
    try {
      const pdfBlob = await generateAttendancePDF({
        month: filterMonth,
        year: filterYear,
        data: reportData,
        logoBase64: villageSettings?.logoBase64,
        settings: attendanceSettings
      })
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `REKAP_ABSENSI_DESA_${filterMonth}_${filterYear}.pdf`
      link.click()
      toast({ title: "PDF Berhasil", description: "Laporan siap dicetak." })
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal Cetak", description: "Terjadi kesalahan sistem." })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handlePrintPDF = async () => {
    if (reportData.length === 0) {
      toast({ variant: "destructive", title: "Data Belum Siap", description: "Menunggu sinkronisasi database..." });
      return;
    }
    setIsPrintingPDF(true)
    try {
      const pdfBlob = await generateAttendancePDF({
        month: filterMonth,
        year: filterYear,
        data: reportData,
        logoBase64: villageSettings?.logoBase64,
        settings: attendanceSettings
      })
      const url = URL.createObjectURL(pdfBlob)

      // Cetak via iframe tersembunyi
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      iframe.src = url
      document.body.appendChild(iframe)

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        } catch {
          window.open(url, '_blank')
        }
      }

      toast({ title: "Membuka Dialog Cetak", description: "Menyiapkan dialog printer..." })
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal Cetak", description: "Terjadi kesalahan sistem." })
    } finally {
      setIsPrintingPDF(false)
    }
  }

  if (!isAuthorized) return <div className="p-10 text-center font-bold">Akses Ditolak</div>;

  const isLoading = isPersonnelLoading || isAttendanceLoading || isSettingsLoading;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-condensed font-extrabold text-slate-900 uppercase tracking-tight">
          Cetak Dokumen Absensi
        </h1>
        <p className="text-xs text-slate-600 font-bold uppercase mt-1">
          Laporan Rekapitulasi Presensi Resmi Berbasis Database Aparatur Desa
        </p>
      </header>

      {/* Main Card Neumorphic */}
      <div className="bg-white dark:bg-[#081d27] rounded-3xl p-6 sm:p-10 shadow-md border border-white/60 space-y-8">
        <div className="flex items-center gap-3.5 pb-4 border-b border-stone-300/60">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/15 text-indigo-700 flex items-center justify-center shrink-0">
            <Printer className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-condensed font-extrabold text-slate-900 uppercase tracking-wider">
              Konfigurasi Periode Laporan
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase">
              Pilih bulan dan tahun rekapan presensi yang ingin diekspor
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Pilih Bulan */}
          <div className="space-y-2">
            <label className="text-[10.5px] font-condensed font-extrabold uppercase text-slate-700 tracking-wider ml-1">
              Pilih Bulan Laporan
            </label>
            <div className="bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 rounded-2xl p-1.5">
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="h-12 border-none bg-transparent font-condensed font-extrabold text-base uppercase text-slate-900 px-4 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#081d27] border-white/60 shadow-2xl rounded-2xl">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString().padStart(2, '0')} className="font-condensed font-bold uppercase text-xs text-slate-800">
                      {format(new Date(2024, i, 1), "MMMM", { locale: localeID })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pilih Tahun */}
          <div className="space-y-2">
            <label className="text-[10.5px] font-condensed font-extrabold uppercase text-slate-700 tracking-wider ml-1">
              Pilih Tahun Laporan
            </label>
            <div className="bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 rounded-2xl p-1.5">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="h-12 border-none bg-transparent font-condensed font-extrabold text-base uppercase text-slate-900 px-4 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#081d27] border-white/60 shadow-2xl rounded-2xl">
                  {[2024, 2025, 2026, 2027].map(y => (
                    <SelectItem key={y} value={y.toString()} className="font-condensed font-bold text-xs text-slate-800">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Status Kesiapan Data Neumorphic Inset Well */}
        <div className="p-5 sm:p-6 bg-white dark:bg-[#081d27] rounded-2xl shadow-inner border border-stone-300/50 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-slate-300/60 text-slate-700 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-condensed font-extrabold uppercase text-slate-900 tracking-wider">
                Kesiapan Data Laporan
              </p>
              <p className="text-[11px] font-bold text-slate-600 uppercase">
                {isLoading ? "Menyinkronkan data..." : `${reportData.length} Akun Aparatur Siap Diekspor`}
              </p>
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-400" />
          )}
        </div>

        {/* Tombol Aksi Cetak & Unduh */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {/* Tombol Cetak Langsung */}
          <button
            type="button"
            onClick={handlePrintPDF}
            disabled={isPrintingPDF || isLoading || reportData.length === 0}
            className="h-16 rounded-2xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-condensed font-extrabold uppercase tracking-wider text-xs sm:text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
          >
            {isPrintingPDF ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <span>Menyiapkan Cetak...</span>
              </>
            ) : (
              <>
                <Printer className="h-5 w-5 text-white" />
                <span>Cetak Laporan</span>
              </>
            )}
          </button>

          {/* Tombol Unduh PDF */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF || isLoading || reportData.length === 0}
            className="h-16 rounded-2xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-condensed font-extrabold uppercase tracking-wider text-xs sm:text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <span>Menyiapkan PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5 text-white" />
                <span>Unduh Laporan PDF</span>
              </>
            )}
          </button>

          {/* Tombol Unduh Format Excel */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={isLoading || reportData.length === 0}
            className="h-16 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-condensed font-extrabold uppercase tracking-wider text-xs sm:text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
          >
            <FileSpreadsheet className="h-5 w-5 text-white" />
            <span>Unduh Format Excel</span>
          </button>
        </div>
      </div>

      {/* Keterangan / Legenda Kode Presensi Neumorphic */}
      <div className="p-5 sm:p-6 bg-white dark:bg-[#081d27] rounded-3xl shadow-md border border-white/60 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-stone-300/60">
          <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-condensed font-extrabold uppercase text-slate-900 tracking-wider">
              Keterangan & Penjelasan Kode Rekapitulasi (PDF & Excel)
            </h3>
            <p className="text-[10px] text-stone-500 font-bold uppercase">
              Arti singkatan kolom statistik dan tanda kehadiran pada dokumen laporan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
              H
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-800 uppercase">Hadir</span>
              <span className="text-[9.5px] text-stone-500 font-bold">Tepat Waktu</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-lg bg-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
              T
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-800 uppercase">Terlambat</span>
              <span className="text-[9.5px] text-stone-500 font-bold">Telat / Belum Pulang</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-lg bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
              S
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-800 uppercase">Sakit / Izin</span>
              <span className="text-[9.5px] text-stone-500 font-bold">Izin Sah / Cuti</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
              TK
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-800 uppercase">Tanpa Ket.</span>
              <span className="text-[9.5px] text-stone-500 font-bold">Alpha / Tidak Hadir</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center gap-2.5 col-span-2 sm:col-span-1">
            <span className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
              DL
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-800 uppercase">Dinas Luar</span>
              <span className="text-[9.5px] text-stone-500 font-bold">Tugas Luar Kantor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Catatan / Keterangan Neumorphic */}
      <div className="p-5 bg-white dark:bg-[#081d27] rounded-2xl shadow-[5px_5px_12px_#c9c5be,-5px_-5px_12px_#ffffff] border border-white/60 flex items-start gap-3.5">
        <div className="h-8 w-8 rounded-xl bg-sky-500/15 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
          <Download className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-condensed font-extrabold text-slate-800 uppercase tracking-wide">
            Informasi Dokumen:
          </p>
          <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase">
            Format laporan resmi telah disesuaikan dengan standar rekapitulasi presensi perangkat desa Sampeldes. Keterlambatan dan jam kerja dikalkulasi otomatis secara akurat.
          </p>
        </div>
      </div>
    </div>
  )
}
