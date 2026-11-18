"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AbsensiAdminRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Gerbang /absensi-admin/ selalu mengarahkan ke form login admin absensi
    router.replace("/absensi-admin/login/")
  }, [router])

  return (
    <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-[#081d27] neu-canvas">
      <Loader2 className="h-10 w-10 animate-spin text-amber-700/40" />
    </div>
  )
}
