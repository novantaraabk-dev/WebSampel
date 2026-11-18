import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase-admin"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = body.email || ""
    const password = body.password || ""
    const requestedUid = body.uid || null

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email dan password wajib diisi." },
        { status: 400 }
      )
    }

    const auth = getAdminAuth()
    const cleanEmail = String(email).toLowerCase().trim()

    let finalUid = requestedUid
    let created = false
    let updated = false

    try {
      // 1. Cek apakah user sudah terdaftar di Firebase Auth
      const existingUser = await auth.getUserByEmail(cleanEmail)
      finalUid = existingUser.uid

      // Update password secara instan di Firebase Auth tanpa limit
      await auth.updateUser(existingUser.uid, { password: String(password) })
      updated = true
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        // 2. Buat user baru dengan Firebase Admin SDK
        const createPayload: any = {
          email: cleanEmail,
          password: String(password),
          emailVerified: true
        }
        if (finalUid) {
          createPayload.uid = finalUid
        }
        const newUser = await auth.createUser(createPayload)
        finalUid = newUser.uid
        created = true
      } else {
        throw err
      }
    }

    return NextResponse.json({
      success: true,
      uid: finalUid,
      created,
      updated
    })
  } catch (error: any) {
    console.error("Error pada sync-user backend:", error)
    let errorMessage = error.message || "Gagal sinkronisasi user via backend."
    if (
      errorMessage.includes("Could not load the default credentials") ||
      errorMessage.includes("default credentials")
    ) {
      errorMessage =
        "Server hosting belum memiliki kredensial Firebase Admin SDK. Pastikan variabel lingkungan (FIREBASE_PRIVATE_KEY dan FIREBASE_CLIENT_EMAIL) sudah ditambahkan di pengaturan Environment Variables hosting Anda."
    }
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
