import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawUsername = body.username || ""
    const rawPassword = body.password || ""

    const cleanUsername = rawUsername.toLowerCase().trim()
    const cleanPassword = String(rawPassword).trim()

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json(
        { success: false, error: "Username aparatur dan kata sandi wajib diisi." },
        { status: 400 }
      )
    }

    // Blokir akun admin di portal mandiri perangkat
    if (
      cleanUsername === "adminsampeldes" ||
      cleanUsername === "admin@sampeldes.id" ||
      cleanUsername === "adminsampeldes@sampeldes.id" ||
      cleanUsername === "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Akun Administrator tidak dapat digunakan untuk presensi mandiri. Silakan login melalui Portal Admin Absensi (/absensi-admin/login)."
        },
        { status: 403 }
      )
    }

    const db = getAdminFirestore()
    const auth = getAdminAuth()

    // 1. Cari data di koleksi 'personel' berdasarkan username
    const personelRef = db.collection("personel")
    const snapshot = await personelRef.where("username", "==", cleanUsername).limit(1).get()

    let matchedDoc = null
    let matchedData: any = null

    if (!snapshot.empty) {
      matchedDoc = snapshot.docs[0]
      matchedData = matchedDoc.data()
    } else {
      // Coba cari alternatif: username diawali '@' atau tanpa spasi
      const altSnap = await personelRef.where("username", "==", cleanUsername.replace(/^@/, "")).limit(1).get()
      if (!altSnap.empty) {
        matchedDoc = altSnap.docs[0]
        matchedData = matchedDoc.data()
      }
    }

    // 2. Jika akun terdaftar di 'personel'
    if (matchedDoc && matchedData) {
      if (matchedData.aktif === false) {
        return NextResponse.json(
          { success: false, error: "Akun Anda telah dinonaktifkan oleh Administrator. Hubungi Admin Desa." },
          { status: 403 }
        )
      }

      if (
        matchedData.role === "admin" ||
        matchedData.role === "admin_absensi" ||
        matchedData.is_admin === true
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Akun Administrator tidak dapat digunakan untuk presensi mandiri. Silakan login melalui Portal Admin Absensi (/absensi-admin/login)."
          },
          { status: 403 }
        )
      }

      // Verifikasi kata sandi
      const savedPassword = matchedData.password || "sampeldes123"
      if (cleanPassword !== savedPassword) {
        return NextResponse.json(
          {
            success: false,
            error: "Username atau kata sandi salah. Pastikan sudah sesuai dengan data di Manajemen Akun."
          },
          { status: 401 }
        )
      }

      // Pertahankan UID persisten agar seluruh riwayat presensi masa lalu tetap cocok
      const persistentUid = matchedData.uid || matchedDoc.id
      const targetEmail = (matchedData.email || `${cleanUsername}@sampeldes.id`).toLowerCase()
      const displayName = matchedData.nama || cleanUsername

      // Sinkronkan UID ke dokumen jika belum ada
      if (!matchedData.uid) {
        try {
          await matchedDoc.ref.set({ uid: persistentUid, last_login: new Date().toISOString() }, { merge: true })
        } catch (e) {
          console.warn("Gagal update UID personel:", e)
        }
      } else {
        matchedDoc.ref.set({ last_login: new Date().toISOString() }, { merge: true }).catch(() => {})
      }

      // Buat Firebase Custom Token (Kebal dari auth/too-many-requests Google Identity)
      const customToken = await auth.createCustomToken(persistentUid, {
        role: "perangkat",
        email: targetEmail,
        nama: displayName
      })

      return NextResponse.json({
        success: true,
        customToken,
        user: {
          id: matchedDoc.id,
          uid: persistentUid,
          nama: displayName,
          username: cleanUsername,
          email: targetEmail,
          jabatan: matchedData.jabatan || "Perangkat Desa"
        }
      })
    }

    // 3. Fallback: Cek apakah ada di master Pemerintahan Desa 'officials'
    const officialsRef = db.collection("officials")
    const officialsSnap = await officialsRef.where("category", "==", "perangkat").get()

    let matchedOfficial: any = null
    officialsSnap.forEach((doc) => {
      const data = doc.data()
      const nameClean = (data.name || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15)
      const firstName = (data.name || "").toLowerCase().split(" ")[0].replace(/[^a-z0-9]/g, "")
      if (
        nameClean === cleanUsername ||
        firstName === cleanUsername ||
        doc.id.toLowerCase() === cleanUsername
      ) {
        matchedOfficial = { id: doc.id, ...data }
      }
    })

    if (matchedOfficial) {
      // Default password perangkat yang belum dikaderisasi
      const defaultPassword = "sampeldes123"
      if (cleanPassword !== defaultPassword) {
        return NextResponse.json(
          {
            success: false,
            error: "Username atau kata sandi salah. Untuk perangkat baru gunakan sandi awal 'sampeldes123'."
          },
          { status: 401 }
        )
      }

      // Otomatis buatkan dokumen personel agar kredensial terkunci
      const newDocRef = personelRef.doc()
      const persistentUid = newDocRef.id
      const targetEmail = `${cleanUsername}@sampeldes.id`
      const displayName = matchedOfficial.name || cleanUsername

      await newDocRef.set({
        id: persistentUid,
        official_id: matchedOfficial.id,
        nama: displayName,
        jabatan: matchedOfficial.position || "Perangkat Desa",
        username: cleanUsername,
        password: defaultPassword,
        email: targetEmail,
        aktif: true,
        role: "perangkat",
        uid: persistentUid,
        auth_synced: true,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      })

      const customToken = await auth.createCustomToken(persistentUid, {
        role: "perangkat",
        email: targetEmail,
        nama: displayName
      })

      return NextResponse.json({
        success: true,
        customToken,
        user: {
          id: persistentUid,
          uid: persistentUid,
          nama: displayName,
          username: cleanUsername,
          email: targetEmail,
          jabatan: matchedOfficial.position || "Perangkat Desa"
        }
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Username atau kata sandi salah. Pastikan sudah terdaftar di Sistem Pemerintahan Desa."
      },
      { status: 401 }
    )
  } catch (error: any) {
    console.error("Error pada API Login Presensi:", error)
    let errorMessage = error.message || "Terjadi kendala pada server saat memproses login."
    if (
      errorMessage.includes("Could not load the default credentials") ||
      errorMessage.includes("default credentials")
    ) {
      errorMessage =
        "Server hosting belum memiliki kredensial Firebase Admin SDK. Pastikan variabel lingkungan (FIREBASE_PRIVATE_KEY dan FIREBASE_CLIENT_EMAIL) sudah ditambahkan di pengaturan Environment Variables hosting Anda."
    }
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    )
  }
}
