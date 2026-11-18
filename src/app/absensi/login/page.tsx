"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { LogIn, UserCheck, Eye, EyeOff, ArrowLeft, ArrowRight, User, KeyRound, Loader2, Sparkles, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { signInWithCustomToken, signOut } from "firebase/auth"
import Link from "next/link"

const loginSchema = z.object({
  username: z.string().min(1, "Username aparatur / ID perangkat harus diisi."),
  password: z.string().min(1, "Kata sandi harus diisi."),
})

export default function AbsensiLoginPage() {
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const { user, isUserLoading } = useUser()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [savedUserGreeting, setSavedUserGreeting] = useState<string | null>(null)

  // Otomatis deteksi histori sesi: Jika sudah pernah login di perangkat ini, langsung masuk tanpa login ulang
  useEffect(() => {
    setMounted(true)

    if (typeof window !== "undefined") {
      // Jika ada parameter ?logout=true (misal baru saja klik keluar sesi), tampilkan form login
      const params = new URLSearchParams(window.location.search)
      if (params.get("logout") === "true") {
        setIsCheckingSession(false)
        return
      }

      // Pastikan ada sesi perangkat yang tersimpan (belum logout)
      const hasDeviceSession = localStorage.getItem("absensi_device_session") === "true"
      if (!hasDeviceSession) {
        setIsCheckingSession(false)
        return
      }

      const savedName = localStorage.getItem("absensi_saved_name")
      const savedUsername = localStorage.getItem("absensi_saved_username")
      if (savedName || savedUsername) {
        setSavedUserGreeting(savedName || savedUsername)
      }
    } else {
      setIsCheckingSession(false)
      return
    }

    // Tunggu status login Firebase siap
    if (isUserLoading) return

    // Cek apakah ada sesi login aparatur yang aktif
    if (user && user.email) {
      const cleanEmail = user.email.toLowerCase()
      const isOfficialAparatur =
        cleanEmail.endsWith("@sampeldes.id") &&
        cleanEmail !== "admin@sampeldes.id" &&
        cleanEmail !== "adminsampeldes@sampeldes.id" &&
        user.uid !== "sYuWEkzcvbUr1mYltcTqzxXEIr53"

      if (isOfficialAparatur) {
        // Histori sesi aktif ditemukan -> Otomatis langsung masuk ke dashboard presensi
        router.replace("/absensi/dashboard/")
        return
      }
    }

    // Jika tidak ada sesi aktif, tampilkan form login
    setIsCheckingSession(false)
  }, [user, isUserLoading, router])

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: typeof window !== "undefined" ? localStorage.getItem("absensi_saved_username") || "" : "",
      password: "",
    },
  })

  // Sinkronisasi username jika tersimpan di localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUsername = localStorage.getItem("absensi_saved_username")
      if (savedUsername && !form.getValues("username")) {
        form.setValue("username", savedUsername)
      }
    }
  }, [form])

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    if (!auth) return
    setIsProcessing(true)
    try {
      const cleanUsername = values.username.trim().toLowerCase()

      // 0. KEAMANAN: Blokir akun admin agar tidak bisa login di portal absensi karyawan mandiri
      if (
        cleanUsername === "adminsampeldes" ||
        cleanUsername === "admin@sampeldes.id" ||
        cleanUsername === "adminsampeldes@sampeldes.id" ||
        cleanUsername === "admin"
      ) {
        throw new Error(
          "Akun Administrator tidak dapat digunakan untuk presensi mandiri. Silakan login melalui Portal Admin Absensi (/absensi-admin/login)."
        )
      }

      // 1. Jalur Autentikasi Server Aman via API Route (/api/absensi/auth/login)
      // Kebal dari auth/too-many-requests dan mengunci UID persisten untuk menjaga histori absensi
      const res = await fetch("/api/absensi/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          password: values.password,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal masuk presensi. Periksa kembali username dan kata sandi Anda.")
      }

      // 2. Login ke Firebase Auth menggunakan Custom Token
      // Menjamin UID persisten cocok dengan histori presensi masa lalu di database
      const userCredential = await signInWithCustomToken(auth, data.customToken)
      const currentUser = userCredential.user

      const displayName = data.user?.nama || cleanUsername
      const targetEmail = data.user?.email || `${cleanUsername}@sampeldes.id`

      // 3. Simpan histori login perangkat di localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("absensi_device_session", "true")
        localStorage.setItem("absensi_saved_username", cleanUsername)
        localStorage.setItem("absensi_saved_name", displayName)
        localStorage.setItem("absensi_saved_email", targetEmail)
      }

      toast({
        title: "Berhasil Masuk Presensi",
        description: `Selamat bertugas, ${displayName}.`,
      })

      router.replace("/absensi/dashboard/")
    } catch (error: any) {
      console.error("Login Error:", error)
      let msg = "Gagal masuk. Periksa kembali username dan kata sandi Anda."

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        msg = "Username atau kata sandi salah. Pastikan sudah sesuai dengan data di Manajemen Akun."
      } else if (error.code === "auth/too-many-requests") {
        msg = "Terlalu banyak percobaan login gagal. Akses akun diblokir sementara oleh Firebase demi keamanan. Silakan tunggu sekitar 10–15 menit sebelum mencoba kembali, atau hubungi Admin Desa."
      } else if (error.code === "auth/network-request-failed") {
        msg = "Gagal terhubung ke server autentikasi Firebase. Silakan periksa koneksi internet Anda."
      } else if (error.code === "auth/user-disabled") {
        msg = "Akun ini telah dinonaktifkan di Firebase Console."
      } else if (error.message?.includes("Missing or insufficient permissions")) {
        msg = "Kendala izin akses sistem. Silakan muat ulang halaman atau hubungi Admin."
      } else {
        msg = error.message || msg
      }

      toast({ variant: "destructive", title: "Gagal Masuk", description: msg })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!mounted || isCheckingSession || isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#081d27] neu-canvas flex-col gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-emerald-700/60" />
        <p className="text-xs font-sans font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Memeriksa Histori Sesi Presensi...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#081d27] neu-canvas flex items-center justify-center p-4 sm:p-6 text-slate-800 font-sans">
      <div className="neu-card-elevated rounded-[28px] sm:rounded-[36px] w-full max-w-[440px] p-7 sm:p-10 border border-white/80 relative shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Tombol Kembali ke Login Utama */}
        <Link
          href="/login"
          title="Kembali ke Portal Login Utama"
          className="neu-btn-circle h-10 w-10 text-slate-600 hover:text-slate-900 absolute left-6 top-6 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {/* Badge Pill Header */}
        <div className="flex flex-col items-center justify-center mb-3 pt-2 gap-1.5">
          <span className="neu-pill px-3 py-1 rounded-full text-[9.5px] font-sans font-bold uppercase tracking-widest text-emerald-800 bg-white dark:bg-[#081d27] border border-white/80">
            Portal Karyawan • GPS Presensi
          </span>
          {savedUserGreeting && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10.5px] font-medium animate-in fade-in">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Akun Terdaftar: <strong>{savedUserGreeting}</strong></span>
            </div>
          )}
        </div>

        {/* Emblem Ikon Neumorphism */}
        <div className="neu-convex mx-auto h-20 w-20 rounded-2xl flex items-center justify-center shadow-md mb-4 bg-gradient-to-br from-white/90 to-[#ded8cd]">
          <UserCheck className="h-10 w-10 text-emerald-700" />
        </div>

        {/* Judul & Keterangan */}
        <div className="text-center space-y-1 mb-6">
          <h1 className="text-2xl sm:text-[26px] font-display font-light uppercase tracking-tight text-slate-900">
            Absensi Aparatur
          </h1>
          <p className="text-xs text-slate-600 font-sans max-w-xs mx-auto">
            Presensi mandiri harian perangkat &amp; staf desa berbasis titik lokasi GPS kantor
          </p>
        </div>

        {/* Form Login Presensi */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-[10.5px] font-sans font-bold uppercase tracking-wider text-slate-700 ml-1">
                    Username / ID Aparatur
                  </FormLabel>
                  <FormControl>
                    <div className="neu-inset rounded-xl flex items-center px-3.5 h-12 bg-white dark:bg-[#081d27] border border-white/60 focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all">
                      <User className="h-4 w-4 text-slate-400 shrink-0" />
                      <input
                        placeholder="Contoh: fitri (huruf kecil)"
                        {...field}
                        className="w-full border-0 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 px-2.5"
                        autoComplete="off"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-red-600 ml-1" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-[10.5px] font-sans font-bold uppercase tracking-wider text-slate-700 ml-1">
                    Kata Sandi
                  </FormLabel>
                  <FormControl>
                    <div className="neu-inset rounded-xl flex items-center px-3.5 h-12 bg-white dark:bg-[#081d27] border border-white/60 focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all">
                      <KeyRound className="h-4 w-4 text-slate-400 shrink-0" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        className="w-full border-0 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 px-2.5"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
                        aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-red-600 ml-1" />
                </FormItem>
              )}
            />

            <button
              type="submit"
              disabled={isProcessing}
              className="neu-btn-primary w-full h-12 rounded-xl text-xs sm:text-sm font-sans font-extrabold uppercase tracking-wider shadow-md hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60 cursor-pointer text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 text-white" />
                  <span>Masuk Presensi</span>
                </>
              )}
            </button>
          </form>
        </Form>

        {/* Footer Link & Akses Cepat */}
        <div className="pt-5 mt-6 border-t border-slate-300/60 flex flex-col items-center gap-2 text-center">
          <Link
            href="/absensi-admin/login"
            className="text-[11px] font-sans text-slate-600 hover:text-amber-800 transition-colors flex items-center gap-1 font-semibold group"
          >
            <span>Login sebagai Administrator Absensi?</span>
            <ArrowRight className="h-3 w-3 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1 mt-1"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Kembali ke Portal Login Utama</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
