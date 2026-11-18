"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useFirestore } from "@/firebase"
import { ShieldCheck, Eye, EyeOff, ArrowLeft, ArrowRight, User, KeyRound, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, setDoc, collection, query, where, getDocs, getDoc, limit } from "firebase/firestore"
import { INTERNAL_USERS } from "@/lib/internal-users"
import Link from "next/link"

const loginSchema = z.object({
  username: z.string().min(1, "Username admin diperlukan."),
  password: z.string().min(1, "Password admin diperlukan."),
})

export default function AdminAbsensiLoginPage() {
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Pastikan sesi lama tidak mem-bypass login: wajib isi username dan password setiap kali membuka login
  useEffect(() => {
    setMounted(true)
    if (auth && auth.currentUser) {
      signOut(auth).catch(() => { })
    }
  }, [auth])

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    if (!db || !auth) return
    setIsProcessing(true)
    try {
      const cleanUsername = values.username.trim().toLowerCase()

      // 0. ISOLASI: Cek apakah akun terdaftar sebagai perangkat desa di koleksi 'personel'
      try {
        const personelQuery = query(collection(db, "personel"), where("username", "==", cleanUsername), limit(1))
        const querySnap = await getDocs(personelQuery)
        if (!querySnap.empty) {
          const uData = querySnap.docs[0].data()
          if (uData.role === "perangkat") {
            throw new Error(
              "Akun Anda terdaftar sebagai Perangkat Desa. Silakan login melalui Portal Presensi Mandiri (/absensi/login)."
            )
          }
        }
      } catch (checkErr: any) {
        if (checkErr.message?.includes("Perangkat Desa")) {
          throw checkErr
        }
      }

      const targetAdmin = INTERNAL_USERS.find(
        (u) => u.username === cleanUsername && (u.role === "admin_absensi" || u.role === "admin")
      )

      const targetEmail = targetAdmin
        ? targetAdmin.email
        : cleanUsername.includes("@")
          ? cleanUsername
          : `${cleanUsername}@sampeldes.id`

      try {
        // Coba masuk langsung dengan email & password
        const userCred = await signInWithEmailAndPassword(auth, targetEmail, values.password)

        // Verifikasi kembali setelah auth: pastikan bukan role perangkat
        try {
          const userDoc = await getDoc(doc(db, "personel", userCred.user.uid))
          if (userDoc.exists() && userDoc.data().role === "perangkat") {
            await signOut(auth)
            throw new Error(
              "Akun Anda terdaftar sebagai Perangkat Desa. Silakan login melalui Portal Presensi Mandiri (/absensi/login)."
            )
          }
        } catch (verifyErr: any) {
          if (verifyErr.message?.includes("Perangkat Desa")) {
            throw verifyErr
          }
        }
      } catch (authErr: any) {
        // Jika targetAdmin ada di INTERNAL_USERS tapi belum terdaftar di Firebase Auth
        if (targetAdmin && (authErr.code === "auth/user-not-found" || authErr.code === "auth/invalid-credential")) {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, targetAdmin.email, values.password)
            // Daftarkan di Firestore personel agar terverifikasi role-nya
            await setDoc(
              doc(db, "personel", userCredential.user.uid),
              {
                uid: userCredential.user.uid,
                email: targetAdmin.email,
                username: cleanUsername,
                nama: targetAdmin.nama,
                role: targetAdmin.role || "admin",
                aktif: true,
                updated_at: new Date().toISOString(),
              },
              { merge: true }
            )
          } catch {
            throw authErr
          }
        } else {
          throw authErr
        }
      }

      toast({
        title: "Login Admin Berhasil",
        description: "Selamat datang di Panel Monitoring & Rekapitulasi Presensi.",
      })
      router.push("/absensi-admin/dashboard/")
    } catch (error: any) {
      let msg = "Gagal masuk ke panel admin absensi."
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        msg = "Username atau kata sandi administrator salah."
      } else if (error.code === "auth/too-many-requests") {
        msg = "Terlalu banyak percobaan login gagal. Akses diblokir sementara oleh Firebase demi keamanan. Silakan tunggu sekitar 10–15 menit sebelum mencoba kembali."
      } else if (error.code === "auth/network-request-failed") {
        msg = "Gagal terhubung ke server autentikasi Firebase. Silakan periksa koneksi internet Anda."
      } else {
        msg = error.message || msg
      }
      toast({ variant: "destructive", title: "Akses Ditolak", description: msg })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#081d27] neu-canvas">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600/50" />
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
        <div className="flex justify-center mb-3 pt-2">
          <span className="neu-pill px-3 py-1 rounded-full text-[9.5px] font-sans font-bold uppercase tracking-widest text-amber-900 bg-white dark:bg-[#081d27] border border-white/80">
            Admin Portal • Presensi Desa
          </span>
        </div>

        {/* Emblem Ikon Neumorphism */}
        <div className="neu-convex mx-auto h-20 w-20 rounded-2xl flex items-center justify-center shadow-md mb-4 bg-gradient-to-br from-white/90 to-[#ded8cd]">
          <ShieldCheck className="h-10 w-10 text-amber-600" />
        </div>

        {/* Judul & Keterangan */}
        <div className="text-center space-y-1 mb-6">
          <h1 className="text-2xl sm:text-[26px] font-display font-light uppercase tracking-tight text-slate-900">
            Admin Absensi
          </h1>
          <p className="text-xs text-slate-600 font-sans max-w-xs mx-auto">
            Panel monitoring kehadiran harian, verifikasi status, dan rekapitulasi data aparatur desa
          </p>
        </div>

        {/* Form Login Admin */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-[10.5px] font-sans font-bold uppercase tracking-wider text-slate-700 ml-1">
                    Username Admin
                  </FormLabel>
                  <FormControl>
                    <div className="neu-inset rounded-xl flex items-center px-3.5 h-12 bg-white dark:bg-[#081d27] border border-white/60 focus-within:ring-2 focus-within:ring-amber-500/30 transition-all">
                      <User className="h-4 w-4 text-slate-400 shrink-0" />
                      <input
                        placeholder="adminsampeldes"
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
                    <div className="neu-inset rounded-xl flex items-center px-3.5 h-12 bg-white dark:bg-[#081d27] border border-white/60 focus-within:ring-2 focus-within:ring-amber-500/30 transition-all">
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
              className="neu-btn-dark w-full h-12 rounded-xl text-xs sm:text-sm font-sans font-extrabold uppercase tracking-wider shadow-md hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60 cursor-pointer text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  <span>Memverifikasi Admin...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  <span>Masuk Panel Admin</span>
                </>
              )}
            </button>
          </form>
        </Form>

        {/* Footer Link & Akses Cepat */}
        <div className="pt-5 mt-6 border-t border-slate-300/60 flex flex-col items-center gap-2 text-center">
          <Link
            href="/absensi/login"
            className="text-[11px] font-sans text-slate-600 hover:text-emerald-800 transition-colors flex items-center gap-1 font-semibold group"
          >
            <span>Bukan Admin? Masuk Presensi Karyawan</span>
            <ArrowRight className="h-3 w-3 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
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
