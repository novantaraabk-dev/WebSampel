"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"
import { Loader2 } from "lucide-react"

export default function AbsensiRedirectPage() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()

  useEffect(() => {
    if (isUserLoading) return

    const hasSavedSession = typeof window !== "undefined" && localStorage.getItem("absensi_device_session") === "true"

    if (hasSavedSession && user && user.email) {
      const email = user.email.toLowerCase()
      const isAparatur =
        email.endsWith("@sampeldes.id") &&
        email !== "admin@sampeldes.id" &&
        email !== "adminsampeldes@sampeldes.id"

      if (isAparatur) {
        // Jika sesi tersimpan aktif, langsung arahkan ke dashboard presensi
        router.replace("/absensi/dashboard/")
        return
      }
    }

    // Jika belum login atau sudah logout, arahkan ke login
    router.replace("/absensi/login/")
  }, [user, isUserLoading, router])

  return (
    <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-[#081d27] neu-canvas flex-col gap-3">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-700/40" />
      <p className="text-xs font-sans font-bold uppercase tracking-wider text-slate-500">
        Menghubungkan ke Portal Presensi...
      </p>
    </div>
  )
}
