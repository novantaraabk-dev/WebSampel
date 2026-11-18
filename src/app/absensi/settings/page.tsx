"use client"

import { useState, useEffect } from "react"
import { useFirestore, useDoc, useMemoFirebase, useUser, useAuth, useCollection } from "@/firebase"
import { doc, updateDoc, collection, query, where, limit } from "firebase/firestore"
import { updatePassword, signOut } from "firebase/auth"
import {
  User,
  KeyRound,
  ShieldCheck,
  Clock,
  MapPin,
  LogOut,
  Save,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  Timer,
  Building2,
  CalendarDays
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function AbsensiSettingsPage() {
  const db = useFirestore()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()
  const router = useRouter()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  // 1. Ambil data profil personel yang sedang login
  const profileQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "personel"), where("uid", "==", user.uid), limit(1))
  }, [db, user])
  const { data: profileDocs, isLoading: isProfileLoading } = useCollection(profileQuery)
  const personelData = profileDocs && profileDocs.length > 0 ? profileDocs[0] : null

  // 2. Ambil pengaturan jam & lokasi kantor (sebagai rujukan bagi aparatur)
  const settingsRef = useMemoFirebase(() =>
    (db && user) ? doc(db, "absensi_settings", "global") : null,
    [db, user]
  )
  const { data: settings } = useDoc(settingsRef)

  useEffect(() => {
    if (isUserLoading) return
    if (!user) {
      router.replace("/absensi/login/")
    }
  }, [user, isUserLoading, router])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword.trim()) {
      toast({ variant: "destructive", title: "Kata sandi tidak boleh kosong" })
      return
    }
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Kata sandi minimal 6 karakter" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Konfirmasi kata sandi tidak cocok" })
      return
    }

    setIsSavingPassword(true)
    try {
      // 1. Update di Firebase Auth
      if (auth?.currentUser) {
        try {
          await updatePassword(auth.currentUser, newPassword)
        } catch (authErr: any) {
          console.warn("Direct Auth update note:", authErr.message)
        }
      }

      // 2. Update di dokumen Firestore personel
      if (db && personelData?.id) {
        await updateDoc(doc(db, "personel", personelData.id), {
          password: newPassword,
          updated_at: new Date().toISOString()
        })
      }

      toast({
        title: "Kata Sandi Berhasil Diperbarui",
        description: "Gunakan kata sandi baru untuk login presensi berikutnya."
      })
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Mengubah Kata Sandi",
        description: err.message || "Silakan coba lagi."
      })
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleLogout = async () => {
    if (!auth) return
    if (confirm("Apakah Anda yakin ingin keluar dari sesi presensi?")) {
      try {
        await signOut(auth)
        toast({ title: "Sesi Berakhir", description: "Anda telah keluar dari Portal Absensi." })
        router.replace("/absensi/login/")
      } catch (err: any) {
        toast({ variant: "destructive", title: "Gagal Logout", description: err.message })
      }
    }
  }

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="p-8 rounded-3xl bg-white dark:bg-[#081d27] shadow-md border border-white/60 flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-700" />
          <p className="text-xs font-black uppercase tracking-widest text-stone-600">Memuat Profil...</p>
        </div>
      </div>
    )
  }

  const displayName = personelData?.nama || user?.displayName || "Aparatur Desa Sampeldes"
  const displayJabatan = personelData?.jabatan || "Perangkat Desa"
  const displayUsername = personelData?.username || user?.email?.replace("@sampeldes.id", "") || "-"

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-24">
      {/* Header Halaman */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-2">
            <User className="h-3 w-3 text-emerald-700" />
            <span>Portal Aparatur • Akun Presensi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">Profil &amp; Pengaturan Akun</h1>
          <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mt-1">Identitas Karyawan &amp; Keamanan Kredensial Pribadi</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="h-11 px-5 rounded-xl bg-white dark:bg-[#081d27] shadow-sm border border-white/60 font-black text-xs uppercase tracking-wider text-red-700 hover:text-red-800 active:scale-95 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <LogOut className="h-4 w-4" /> Keluar Sesi
        </button>
      </header>

      {/* Grid Profil & Ganti Password */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Kartu Profil Aparatur */}
        <div className="md:col-span-1 bg-white dark:bg-[#081d27] rounded-3xl p-6 sm:p-7 shadow-md border border-white/60 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center text-emerald-700 mb-4">
                <User className="h-12 w-12" />
              </div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">{displayName}</h2>
              <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-700 text-white">
                {displayJabatan}
              </span>
            </div>

            <div className="space-y-3 pt-4 border-t border-stone-300/40">
              <div className="p-3 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40">
                <p className="text-[9.5px] font-black uppercase tracking-wider text-stone-500">Username Login</p>
                <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{displayUsername}</p>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40">
                <p className="text-[9.5px] font-black uppercase tracking-wider text-stone-500">Status Akun</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Aktif &amp; Terverifikasi</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-stone-300/40 flex items-center justify-between text-[10px] text-stone-500 font-bold uppercase tracking-wider">
            <span>Desa Sampeldes</span>
            <span>Kec. Gandrungmangu</span>
          </div>
        </div>

        {/* Form Ganti Kata Sandi */}
        <div className="md:col-span-2 bg-white dark:bg-[#081d27] rounded-3xl p-6 sm:p-8 shadow-md border border-white/60 space-y-6">
          <div className="flex items-center gap-3.5 pb-5 border-b border-stone-300/40">
            <div className="h-11 w-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center text-amber-700">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Perbarui Kata Sandi Pribadi</h2>
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Ubah sandi untuk menjaga keamanan akun presensi Anda</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-stone-600 tracking-wider ml-1">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter..."
                  className="w-full h-12 pl-4 pr-11 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-mono text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 placeholder:text-stone-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-stone-600 tracking-wider ml-1">
                Ulangi Kata Sandi Baru
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru..."
                className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-mono text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 placeholder:text-stone-400"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingPassword}
                className="h-12 px-7 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
              >
                {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan Kata Sandi Baru
              </button>
            </div>
          </form>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-[10.5px] font-bold text-stone-700 uppercase leading-relaxed">
              Catatan: Pastikan mengingat kata sandi yang telah Anda ubah. Jika lupa, Anda dapat menghubungi Administrator Desa untuk melakukan reset kata sandi.
            </p>
          </div>
        </div>
      </div>

      {/* Rujukan Jam Kerja & Lokasi Kantor (Read-only) */}
      <div className="bg-white dark:bg-[#081d27] rounded-3xl p-6 sm:p-8 shadow-md border border-white/60 space-y-6">
        <div className="flex items-center gap-3.5 pb-5 border-b border-stone-300/40">
          <div className="h-11 w-11 rounded-2xl bg-[#0e1620] text-emerald-400 flex items-center justify-center shadow-md">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Aturan Jam Kerja &amp; Lokasi Absensi Kantor</h2>
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Standar operasional kehadiran yang berlaku di Kantor Balai Desa Sampeldes</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-1">
            <div className="flex items-center gap-2 text-sky-700 text-xs font-black uppercase">
              <Clock className="h-4 w-4" /> Jam Masuk Kerja
            </div>
            <p className="text-lg font-black text-slate-900 font-mono">
              {settings?.jam_masuk || "08:00"} <span className="text-xs font-sans font-bold text-stone-500">WIB</span>
            </p>
            <p className="text-[9.5px] text-stone-500 uppercase font-bold">Waktu Mulai Presensi Pagi</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-1">
            <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase">
              <Timer className="h-4 w-4" /> Toleransi Telat
            </div>
            <p className="text-lg font-black text-slate-900 font-mono">
              {settings?.toleransi_telat ?? 15} <span className="text-xs font-sans font-bold text-stone-500">Menit</span>
            </p>
            <p className="text-[9.5px] text-stone-500 uppercase font-bold">Batas Waktu Tepat Waktu</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-black uppercase">
              <MapPin className="h-4 w-4" /> Radius Presensi
            </div>
            <p className="text-lg font-black text-slate-900 font-mono">
              {settings?.radius_lokasi ?? 100} <span className="text-xs font-sans font-bold text-stone-500">Meter</span>
            </p>
            <p className="text-[9.5px] text-stone-500 uppercase font-bold">Jarak Maksimal dari Balai Desa</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-500 pt-2">
          <CalendarDays className="h-3.5 w-3.5 text-stone-400" />
          <span>Hari Kerja Aktif: {(settings?.hari_kerja || ['senin', 'selasa', 'rabu', 'kamis', 'jumat']).join(', ')}</span>
        </div>
      </div>
    </div>
  )
}
