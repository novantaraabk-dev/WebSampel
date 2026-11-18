import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"
import { getFirestore, type Firestore } from "firebase-admin/firestore"

let cachedApp: App | null = null

export function getFirebaseAdminApp(): App {
  if (cachedApp) return cachedApp
  if (getApps().length > 0) {
    cachedApp = getApp()
    return cachedApp
  }

  let projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_PROJECT_ID ||
    "websampel-acb0d"

  let clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL ||
    process.env.GDRIVE_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_CLIENT_EMAIL ||
    "firebase-adminsdk-fbsvc@websampel-acb0d.iam.gserviceaccount.com"

  let privateKey =
    process.env.FIREBASE_PRIVATE_KEY ||
    process.env.GDRIVE_PRIVATE_KEY ||
    process.env.GOOGLE_PRIVATE_KEY ||
    ""

  // Attempt using full JSON credentials if available (e.g. pasted directly in hosting env)
  const fullJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON

  if (fullJson) {
    try {
      const parsed = typeof fullJson === "string" ? JSON.parse(fullJson) : fullJson
      if (parsed.private_key) {
        privateKey = parsed.private_key
      }
      if (parsed.client_email && !process.env.FIREBASE_CLIENT_EMAIL) {
        clientEmail = parsed.client_email
      }
      if (parsed.project_id && !process.env.FIREBASE_PROJECT_ID) {
        projectId = parsed.project_id
      }
    } catch (e) {
      console.warn("Gagal parse Firebase Service Account JSON dari environment:", e)
    }
  }

  if (privateKey) {
    // Strip surrounding quotes if present (common when copy-pasted into hosting dashboards)
    privateKey = privateKey.trim()
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1)
    }
    // Replace escaped newlines if any
    privateKey = privateKey.replace(/\\n/g, "\n")
  }

  if (privateKey && clientEmail) {
    try {
      cachedApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      })
      return cachedApp
    } catch (certError: any) {
      console.error("Gagal initializeApp dengan cert:", certError)
      throw new Error(
        `Gagal inisialisasi Firebase Admin dengan kredensial: ${certError.message}`
      )
    }
  }

  // Fallback to default credentials (works on GCP environments with metadata server or local ADC)
  console.warn(
    "Firebase Admin: FIREBASE_PRIVATE_KEY belum ditemukan di environment. Mencoba fallback ke Google Application Default Credentials..."
  )
  cachedApp = initializeApp({ projectId })
  return cachedApp
}

export function getAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp())
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp())
}
