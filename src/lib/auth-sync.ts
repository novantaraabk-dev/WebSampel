"use client"

import { initializeApp, getApps } from "firebase/app"
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth"
import { firebaseConfig } from "@/firebase/config"

/**
 * Inisialisasi Firebase Auth pada app sekunder sebagai fallback
 */
export function getSecondaryAuth() {
  const secondaryAppName = "SecondaryAuthApp"
  const existingApp = getApps().find(app => app.name === secondaryAppName)
  const secondaryApp = existingApp || initializeApp(firebaseConfig, secondaryAppName)
  return getAuth(secondaryApp)
}

/**
 * Sinkronisasi akun personel ke Firebase Authentication.
 * Mengutamakan API backend via Firebase Admin SDK agar kebal dari auth/too-many-requests.
 *
 * @param email - e.g. username@sampeldes.id
 * @param password - Kata sandi baru/aktif
 * @param oldPassword - Kata sandi lama (opsional)
 * @param uid - UID target jika sudah ada
 */
export async function syncUserToFirebaseAuth(
  email: string,
  password: string,
  oldPassword?: string,
  uid?: string
): Promise<{ success: boolean; created?: boolean; updated?: boolean; uid?: string; message?: string }> {
  const cleanEmail = email.toLowerCase().trim()

  // 1. Jalur Utama: API Backend Server (Firebase Admin SDK)
  // Menjamin perubahan kredensial langsung aktif tanpa terkena rate-limit browser
  try {
    const res = await fetch("/api/absensi/auth/sync-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, password, uid })
    })
    const data = await res.json()
    if (res.ok && data.success) {
      return {
        success: true,
        created: data.created,
        updated: data.updated,
        uid: data.uid
      }
    }
  } catch (apiErr: any) {
    console.warn("Backend sync-user fetch warning:", apiErr.message)
  }

  // 2. Fallback aman sisi client (tanpa loop percobaan sandi yang memicu blokir IP)
  const secondaryAuth = getSecondaryAuth()
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password)
    const newUid = userCredential.user.uid
    await signOut(secondaryAuth)
    return { success: true, created: true, uid: newUid }
  } catch (createErr: any) {
    if (createErr.code === "auth/email-already-in-use") {
      try {
        const cred = await signInWithEmailAndPassword(secondaryAuth, cleanEmail, password)
        const loggedUid = cred.user.uid
        await signOut(secondaryAuth)
        return { success: true, updated: false, uid: loggedUid }
      } catch {
        return { success: true, updated: false }
      }
    }
    return { success: false, message: createErr.message }
  } finally {
    try {
      await signOut(secondaryAuth)
    } catch { }
  }
}
