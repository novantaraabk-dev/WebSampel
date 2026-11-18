"use client"

import { useState, useEffect, useMemo } from "react"
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection, useAuth } from "@/firebase"
import { doc, setDoc, collection, query, orderBy, deleteDoc } from "firebase/firestore"
import { updatePassword } from "firebase/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Settings,
  Save,
  Loader2,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Timer,
  Info,
  UserCheck,
  ShieldCheck,
  Search,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  UserCog,
  CheckCircle2,
  Users,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Landmark,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { syncUserToFirebaseAuth } from "@/lib/auth-sync"
import { getIndonesianHolidays, getHolidayDescription } from "@/lib/indonesian-holidays"

const DAYS = [
  { id: 'senin', label: 'SENIN' },
  { id: 'selasa', label: 'SELASA' },
  { id: 'rabu', label: 'RABU' },
  { id: 'kamis', label: 'KAMIS' },
  { id: 'jumat', label: 'JUMAT' },
  { id: 'sabtu', label: 'SABTU' },
  { id: 'minggu', label: 'MINGGU' }
]

export default function AdminAbsensiSettings() {
  const db = useFirestore()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  const [isSaving, setIsSaving] = useState(false)
  const [isSyncingKaderisasi, setIsSyncingKaderisasi] = useState(false)
  const [syncProgress, setSyncProgress] = useState("")
  const [newHoliday, setNewHoliday] = useState("")
  const [savingAccountId, setSavingAccountId] = useState<string | null>(null)
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null)
  const [deletedRowIds, setDeletedRowIds] = useState<Set<string>>(new Set())
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Tab 3 (Admin Account) State
  const [adminFormData, setAdminFormData] = useState({
    nama: "ADMINISTRATOR ABSENSI",
    username: "adminsampeldes",
    password: "superadmin00",
  })
  const [isAdminSaving, setIsAdminSaving] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)

  // 1. Pengaturan Global (Lokasi, Jam, Libur)
  const settingsRef = useMemoFirebase(() =>
    (db && user) ? doc(db, "absensi_settings", "global") : null,
    [db, user])
  const { data: initialSettings, isLoading: isSettingsLoading } = useDoc(settingsRef)

  // 1b. Daftar Perangkat Desa Resmi dari Pemerintahan Desa (/admin/pemerintahan)
  const officialsQuery = useMemoFirebase(() =>
    db ? query(collection(db, "officials"), orderBy("name", "asc")) : null,
    [db])
  const { data: rawOfficials, isLoading: isOfficialsLoading } = useCollection(officialsQuery)

  // 2. Daftar Seluruh Akun Personel yang Terdaftar di Absensi
  const accountsRef = useMemoFirebase(() =>
    (db && user) ? query(collection(db, "personel"), orderBy("nama", "asc")) : null,
    [db, user])
  const { data: accountList, isLoading: isAccountsLoading } = useCollection(accountsRef)

  // Filter khusus Perangkat Desa dari koleksi officials Pemerintahan Desa
  const officialsPerangkat = useMemo(() => {
    if (!rawOfficials) return []
    const getPerangkatRank = (pos: string) => {
      const p = (pos || '').toLowerCase()
      if (p.includes('kepala desa') || p.includes('kades')) return 1
      if (p.includes('sekretaris') || p.includes('sekdes')) return 2
      if (p.includes('kasi') || p.includes('kaur')) return 3
      if (p.includes('kadus') || p.includes('kepala dusun')) return 4
      if (p.includes('staf') || p.includes('staff')) return 5
      return 6
    }
    return [...rawOfficials]
      .filter((o: any) => o.category === 'perangkat')
      .sort((a: any, b: any) => getPerangkatRank(a.position) - getPerangkatRank(b.position))
  }, [rawOfficials])

  // Akun Personel Perangkat yang sudah ada di database absensi
  const existingPerangkatPersonel = useMemo(() => {
    return accountList?.filter(a => a.role !== 'admin' && a.role !== 'admin_absensi' && a.username !== 'admin' && a.username !== 'adminsampeldes') || []
  }, [accountList])

  const adminAccount = useMemo(() => {
    return accountList?.find(a => a.role === 'admin' || a.role === 'admin_absensi' || a.username === 'adminsampeldes' || a.username === 'admin') || null
  }, [accountList])

  // Penggabungan Data: Mengambil Data Perangkat Desa dari /admin/pemerintahan
  const mergedPerangkatList = useMemo(() => {
    const generateUsername = (name: string) => {
      const clean = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "")
      return clean.slice(0, 15) || "perangkat"
    }

    if (!officialsPerangkat || officialsPerangkat.length === 0) {
      // Fallback jika officials belum termuat atau belum ada
      const seenIds = new Set<string>()
      return existingPerangkatPersonel.map((p, idx) => {
        let uniqueId = p.id || `per_${idx}`
        if (seenIds.has(uniqueId)) {
          uniqueId = `${uniqueId}_${idx}`
        }
        seenIds.add(uniqueId)

        return {
          id: uniqueId,
          officialId: p.official_id || null,
          personelDocId: p.id,
          nama: p.nama || "",
          jabatan: p.jabatan || "",
          imageUrl: p.foto || "",
          username: p.username || generateUsername(p.nama),
          password: p.password || "sampeldes123",
          auth_synced: p.auth_synced ?? true,
          uid: p.uid || null,
          isFromOfficials: false,
          isSynced: Boolean(p.auth_synced && p.uid)
        }
      })
    }

    // Ambil data resmi dari /admin/pemerintahan dan pastikan tidak ada duplicate account binding
    const usedAccountIds = new Set<string>()
    const assignedRowIds = new Set<string>()

    const mappedOfficials = officialsPerangkat.map((off: any, idx: number) => {
      const defaultUser = generateUsername(off.name)

      // 1. Cari akun yang sesuai di accountList - utamakan exact matching
      const matched = accountList?.find(a => {
        if (usedAccountIds.has(a.id)) return false
        if (a.official_id && a.official_id === off.id) return true
        if (a.username && a.username.toLowerCase() === defaultUser.toLowerCase()) return true
        if (a.nama && off.name && a.nama.toLowerCase().trim() === off.name.toLowerCase().trim()) return true
        return false
      }) || accountList?.find(a => {
        // Fallback fuzzy match yang aman (panjang karakter > 3)
        if (usedAccountIds.has(a.id)) return false
        if (!a.nama || !off.name) return false
        const an = a.nama.toLowerCase().trim()
        const on = off.name.toLowerCase().trim()
        return an.length > 3 && on.length > 3 && (an.includes(on) || on.includes(an))
      })

      if (matched) {
        usedAccountIds.add(matched.id)
      }

      // Cari UID jika tersedia
      const matchedUid = matched?.uid || accountList?.find(a =>
        a.uid && (
          (a.official_id && a.official_id === off.id) ||
          (a.username && a.username.toLowerCase() === (matched?.username || defaultUser).toLowerCase()) ||
          (a.nama && off.name && a.nama.toLowerCase().trim() === off.name.toLowerCase().trim())
        )
      )?.uid || null

      const isSynced = Boolean(matched && (matched.auth_synced || matchedUid))

      // Pastikan ID row ini unik 100% dan tidak pernah bertabrakan
      let uniqueId = matched ? matched.id : `off_${off.id || idx}`
      if (assignedRowIds.has(uniqueId)) {
        uniqueId = `off_${off.id || idx}_${uniqueId}`
      }
      assignedRowIds.add(uniqueId)

      return {
        id: uniqueId,
        officialId: off.id,
        personelDocId: matched ? matched.id : null,
        nama: off.name, // Nama selalu ambil dari Pemerintahan Desa
        jabatan: off.position, // Jabatan selalu ambil dari Pemerintahan Desa
        imageUrl: off.imageUrl || matched?.foto || "",
        username: matched?.username || defaultUser,
        password: matched?.password || "sampeldes123",
        auth_synced: matched ? (matched.auth_synced ?? true) : false,
        uid: matchedUid,
        isFromOfficials: true,
        isSynced: isSynced
      }
    })

    // Masukkan akun mandiri dari personel yang belum ter-match
    const standaloneAccounts = existingPerangkatPersonel
      .filter(p => !usedAccountIds.has(p.id))
      .map((p, idx) => {
        let uniqueId = p.id || `per_${idx}`
        if (assignedRowIds.has(uniqueId)) {
          uniqueId = `per_${uniqueId}_${idx}`
        }
        assignedRowIds.add(uniqueId)

        return {
          id: uniqueId,
          officialId: p.official_id || null,
          personelDocId: p.id,
          nama: p.nama || "",
          jabatan: p.jabatan || "",
          imageUrl: p.foto || "",
          username: p.username || generateUsername(p.nama),
          password: p.password || "sampeldes123",
          auth_synced: p.auth_synced ?? true,
          uid: p.uid || null,
          isFromOfficials: false,
          isSynced: Boolean(p.auth_synced && p.uid)
        }
      })

    return [...mappedOfficials, ...standaloneAccounts]
  }, [officialsPerangkat, accountList, existingPerangkatPersonel])

  // Sinkron data form admin saat Firestore termuat
  useEffect(() => {
    if (adminAccount) {
      setAdminFormData({
        nama: adminAccount.nama || "ADMINISTRATOR ABSENSI",
        username: adminAccount.username || "adminsampeldes",
        password: adminAccount.password || "admin00",
      })
    }
  }, [adminAccount])

  const filteredPerangkat = useMemo(() => {
    const list = mergedPerangkatList.filter(p =>
      !deletedRowIds.has(p.id) &&
      (!p.officialId || !deletedRowIds.has(p.officialId)) &&
      (!p.personelDocId || !deletedRowIds.has(p.personelDocId))
    )
    if (!searchTerm.trim()) return list
    const term = searchTerm.toLowerCase().trim()
    return list.filter(p =>
      (p.nama || "").toLowerCase().includes(term) ||
      (p.jabatan || "").toLowerCase().includes(term) ||
      (p.username || "").toLowerCase().includes(term)
    )
  }, [mergedPerangkatList, searchTerm, deletedRowIds])

  const [formData, setFormData] = useState({
    jam_masuk: "08:00",
    jam_pulang: "16:00",
    toleransi_telat: 15,
    hari_kerja: ["senin", "selasa", "rabu", "kamis", "jumat"],
    hari_libur: [] as string[],
    radius_lokasi: 100,
    lokasi_kantor: { lat: -7.457829, lng: 108.862069 },
    jadwal: {
      senin: { masuk: "08:00", pulang: "15:30" },
      selasa: { masuk: "08:00", pulang: "15:30" },
      rabu: { masuk: "08:00", pulang: "15:30" },
      kamis: { masuk: "08:00", pulang: "15:30" },
      jumat: { masuk: "08:00", pulang: "11:00" },
      sabtu: { masuk: "08:00", pulang: "12:00" },
      minggu: { masuk: "08:00", pulang: "12:00" },
    }
  })

  const [accountEdits, setAccountEdits] = useState<Record<string, { username: string, password: string, nama: string, jabatan: string }>>({})
  const [newAccount, setNewAccount] = useState({ nama: "", jabatan: "", username: "", password: "" })

  // State Kustomisasi Kredensial (Show/Hide Password & Modal Kustomisasi)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [showAllPasswords, setShowAllPasswords] = useState(false)
  const [customModalItem, setCustomModalItem] = useState<any | null>(null)
  const [customUsername, setCustomUsername] = useState("")
  const [customPassword, setCustomPassword] = useState("")
  const [showCustomModalPassword, setShowCustomModalPassword] = useState(false)

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789"
    let result = "Bulu@"
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleGenerateRandomPass = (rowId: string) => {
    const newPass = generateRandomPassword()
    handleAccountFieldChange(rowId, 'password', newPass)
    setShowPasswords(prev => ({ ...prev, [rowId]: true }))
    toast({
      title: "Kata Sandi Acak Dibuat",
      description: `Sandi: ${newPass}. Klik SIMPAN atau Simpan Kaderisasi untuk mengaktifkan.`
    })
  }

  const handleResetToDefaultUsername = (rowId: string, name: string) => {
    const clean = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) || "perangkat"
    handleAccountFieldChange(rowId, 'username', clean)
    toast({ title: "Username Direset", description: `@${clean}` })
  }

  const toggleShowPassword = (rowId: string) => {
    setShowPasswords(prev => ({ ...prev, [rowId]: !prev[rowId] }))
  }

  const handleOpenCustomModal = (item: any) => {
    const edits = accountEdits[item.id]
    setCustomModalItem(item)
    setCustomUsername(edits?.username || item.username || "")
    setCustomPassword(edits?.password || item.password || "")
    setShowCustomModalPassword(false)
  }

  const handleSaveCustomModal = async (autoSaveToAuth: boolean = false) => {
    if (!customModalItem) return
    const cleanUser = customUsername.toLowerCase().trim().replace(/\s+/g, '')
    const cleanPass = customPassword.trim()

    if (!cleanUser || !cleanPass) {
      toast({ variant: "destructive", title: "Data Belum Lengkap", description: "Username dan Kata Sandi wajib diisi." })
      return
    }

    if (cleanPass.length < 6) {
      toast({ variant: "destructive", title: "Kata Sandi Terlalu Pendek", description: "Minimal 6 karakter untuk otentikasi sistem." })
      return
    }

    setAccountEdits(prev => ({
      ...prev,
      [customModalItem.id]: {
        username: cleanUser,
        password: cleanPass,
        nama: customModalItem.nama,
        jabatan: customModalItem.jabatan
      }
    }))

    if (autoSaveToAuth) {
      await handleSaveAccount({
        ...customModalItem,
        username: cleanUser,
        password: cleanPass
      })
    } else {
      toast({
        title: "Kredensial Diterapkan di Tabel",
        description: `Username @${cleanUser} & Sandi telah dicatat. Klik Simpan atau Simpan Kaderisasi untuk mengaktifkan.`
      })
    }

    setCustomModalItem(null)
  }

  useEffect(() => {
    if (initialSettings) {
      setFormData(prev => ({
        ...prev,
        ...initialSettings,
        jadwal: initialSettings.jadwal || prev.jadwal
      }))
    }
  }, [initialSettings])

  // --- Handlers Akun Perangkat ---
  const handleAccountFieldChange = (docId: string, field: string, value: string) => {
    const item = mergedPerangkatList.find(a => a.id === docId)
    const currentEdit = accountEdits[docId] || {
      username: item?.username || "",
      password: item?.password || "",
      nama: item?.nama || "",
      jabatan: item?.jabatan || ""
    }

    setAccountEdits(prev => ({
      ...prev,
      [docId]: { ...currentEdit, [field]: value }
    }))
  }

  const handleSaveAccount = async (item: any) => {
    if (!db || !user) return
    const edits = accountEdits[item.id]

    const nama = (edits?.nama || item.nama).toUpperCase().trim()
    const jabatan = (edits?.jabatan || item.jabatan).toUpperCase().trim()
    const username = (edits?.username || item.username).toLowerCase().trim()
    const password = edits?.password || item.password
    const oldPassword = item.password

    if (!nama || !username || !password) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "Nama, username, dan password wajib diisi." })
      return
    }

    setSavingAccountId(item.id)
    try {
      const existingUid = item.uid || accountList?.find(a =>
        a.uid && ((a.official_id && item.officialId && a.official_id === item.officialId) || (a.username && a.username.toLowerCase() === username.toLowerCase()))
      )?.uid || (item.personelDocId && !item.personelDocId.startsWith("off_") ? item.personelDocId : null)

      // Sinkronkan ke Firebase Authentication via Admin API
      const syncRes = await syncUserToFirebaseAuth(`${username}@sampeldes.id`, password, oldPassword, existingUid || undefined)
      const authUid = syncRes.uid || existingUid

      const targetDocId = item.personelDocId || (item.id.startsWith("off_") ? doc(collection(db, "personel")).id : item.id)

      await setDoc(doc(db, "personel", targetDocId), {
        id: targetDocId,
        official_id: item.officialId || null,
        nama,
        jabatan,
        username,
        password,
        foto: item.imageUrl || "",
        email: `${username}@sampeldes.id`,
        aktif: true,
        role: "perangkat",
        ...(authUid ? { uid: authUid } : {}),
        auth_synced: true,
        updated_at: new Date().toISOString()
      }, { merge: true })

      // Bersihkan duplikat dokumen lama jika ada
      const duplicateDocs = accountList?.filter(a =>
        a.id !== targetDocId && (
          (a.official_id && item.officialId && a.official_id === item.officialId) ||
          (a.username && a.username.toLowerCase() === username.toLowerCase()) ||
          (a.nama && nama && (
            a.nama.toLowerCase().trim() === nama.toLowerCase().trim() ||
            nama.toLowerCase().includes(a.nama.toLowerCase().trim())
          ))
        )
      ) || []
      for (const dup of duplicateDocs) {
        try {
          await deleteDoc(doc(db, "personel", dup.id))
        } catch { }
      }

      toast({
        title: "Kaderisasi Berhasil",
        description: `${nama} (${username}) berhasil disimpan & disinkronkan ke Firebase Authenticator.`
      })
      const newEdits = { ...accountEdits }
      delete newEdits[item.id]
      setAccountEdits(newEdits)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: e.message })
    } finally {
      setSavingAccountId(null)
    }
  }

  const handleAddAccount = async () => {
    if (!db || !newAccount.nama || !newAccount.username || !newAccount.password) {
      toast({ variant: "destructive", title: "Lengkapi isian akun baru." })
      return
    }

    const cleanUsername = newAccount.username.toLowerCase().trim()
    if (cleanUsername === "adminsampeldes" || cleanUsername === "admin") {
      toast({ variant: "destructive", title: "Username Terlarang", description: "Username ini dikhususkan untuk akun Administrator." })
      return
    }

    setIsSaving(true)
    try {
      const docId = doc(collection(db, "personel")).id
      const email = `${cleanUsername}@sampeldes.id`

      // Sinkronkan ke Firebase Authentication
      const syncRes = await syncUserToFirebaseAuth(email, newAccount.password)
      const authUid = syncRes.uid || null

      await setDoc(doc(db, "personel", docId), {
        id: docId,
        nama: newAccount.nama.toUpperCase().trim(),
        jabatan: newAccount.jabatan.toUpperCase().trim(),
        username: cleanUsername,
        password: newAccount.password,
        email,
        aktif: true,
        role: "perangkat",
        ...(authUid ? { uid: authUid } : {}),
        auth_synced: true,
        created_at: new Date().toISOString()
      })
      toast({
        title: "Akun Perangkat Berhasil Ditambah",
        description: `${newAccount.nama} siap digunakan untuk presensi mandiri.`
      })
      setIsAddModalOpen(false)
      setNewAccount({ nama: "", jabatan: "", username: "", password: "" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal Menambah Akun", description: e.message })
    } finally {
      setIsSaving(false)
    }
  }

  // --- Handlers Simpan Kaderisasi & Sinkronisasi Authenticator Seluruh Perangkat ---
  const handleSimpanKaderisasi = async () => {
    if (!db || !user) return
    if (!mergedPerangkatList || mergedPerangkatList.length === 0) {
      toast({
        variant: "destructive",
        title: "Tidak Ada Data Perangkat",
        description: "Belum ada data perangkat desa dari Pemerintahan (/admin/pemerintahan) untuk dikaderisasi."
      })
      return
    }

    setIsSyncingKaderisasi(true)
    let successCount = 0
    let failCount = 0

    try {
      for (let i = 0; i < mergedPerangkatList.length; i++) {
        const item = mergedPerangkatList[i]
        const edits = accountEdits[item.id]

        const nama = (edits?.nama ?? item.nama ?? "").toUpperCase().trim()
        const jabatan = (edits?.jabatan ?? item.jabatan ?? "").toUpperCase().trim()
        const username = (edits?.username ?? item.username ?? "").toLowerCase().trim()
        const password = edits?.password ?? item.password ?? ""
        const oldPassword = item.password
        const email = `${username}@sampeldes.id`

        setSyncProgress(`Mengaderisasi (${i + 1}/${mergedPerangkatList.length}): ${nama || username}...`)

        // 1. Sinkronkan akun ke Firebase Authenticator
        const existingUid = item.uid || accountList?.find(a =>
          a.uid && ((a.official_id && item.officialId && a.official_id === item.officialId) || (a.username && a.username.toLowerCase() === username.toLowerCase()))
        )?.uid || null
        let authUid = existingUid

        if (username && password) {
          try {
            const syncRes = await syncUserToFirebaseAuth(email, password, oldPassword, existingUid || undefined)
            if (syncRes.uid) {
              authUid = syncRes.uid
            }
          } catch (syncErr: any) {
            console.warn(`Sinkronisasi Auth perangkat ${username} warning:`, syncErr.message)
          }
        }

        // 2. Perbarui dokumen Firestore 'personel'
        try {
          const targetDocId = item.personelDocId || (item.id.startsWith("off_") ? doc(collection(db, "personel")).id : item.id)

          await setDoc(doc(db, "personel", targetDocId), {
            id: targetDocId,
            official_id: item.officialId || null,
            nama,
            jabatan,
            username,
            password,
            foto: item.imageUrl || "",
            email,
            aktif: true,
            role: "perangkat",
            ...(authUid ? { uid: authUid } : {}),
            auth_synced: true,
            updated_at: new Date().toISOString()
          }, { merge: true })

          // Bersihkan duplikat dokumen lama jika ada
          const duplicateDocs = accountList?.filter(a =>
            a.id !== targetDocId && (
              (a.official_id && item.officialId && a.official_id === item.officialId) ||
              (a.username && a.username.toLowerCase() === username.toLowerCase()) ||
              (a.nama && nama && (
                a.nama.toLowerCase().trim() === nama.toLowerCase().trim() ||
                nama.toLowerCase().includes(a.nama.toLowerCase().trim())
              ))
            )
          ) || []
          for (const dup of duplicateDocs) {
            try {
              await deleteDoc(doc(db, "personel", dup.id))
            } catch { }
          }

          successCount++
        } catch (dbErr: any) {
          console.error(`Gagal menyimpan personel ${item.id} ke Firestore:`, dbErr)
          failCount++
        }
      }

      // Bersihkan pending edits setelah seluruh data tersimpan
      setAccountEdits({})

      toast({
        title: "Kaderisasi Perangkat Berhasil",
        description: `Berhasil mengaderisasi & menyinkronkan ${successCount} akun perangkat desa dari Pemerintahan ke database & Authenticator.`
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan Kaderisasi",
        description: err.message || "Terjadi kesalahan saat sinkronisasi akun."
      })
    } finally {
      setIsSyncingKaderisasi(false)
      setSyncProgress("")
    }
  }

  const handleDeleteAccount = async (acc: any) => {
    const nama = acc.nama || "Perangkat Desa"
    if (!confirm(`Hapus permanen akun perangkat "${nama}" dari database presensi & sistem?`)) return

    // 1. LANGSUNG HILANGKAN DARI TAMPILAN SECARA INSTAN (OPTIMISTIC REMOVAL)
    setDeletedRowIds(prev => {
      const next = new Set(prev)
      next.add(acc.id)
      if (acc.officialId) next.add(acc.officialId)
      if (acc.personelDocId) next.add(acc.personelDocId)
      return next
    })

    // Bersihkan draft edit lokal
    setAccountEdits(prev => {
      const next = { ...prev }
      delete next[acc.id]
      return next
    })

    setDeletingAccountId(acc.id)

    try {
      // 2. Hapus dokumen akun dari koleksi 'personel'
      const personelIdsToDelete = new Set<string>()
      if (acc.personelDocId) personelIdsToDelete.add(acc.personelDocId)
      if (acc.id && !acc.id.startsWith("off_")) personelIdsToDelete.add(acc.id)

      accountList?.forEach(a => {
        if (
          (acc.officialId && a.official_id && a.official_id === acc.officialId) ||
          (acc.username && a.username && a.username.toLowerCase() === acc.username.toLowerCase()) ||
          (acc.nama && a.nama && a.nama.toLowerCase().trim() === acc.nama.toLowerCase().trim())
        ) {
          personelIdsToDelete.add(a.id)
        }
      })

      for (const pId of personelIdsToDelete) {
        try {
          await deleteDoc(doc(db, "personel", pId))
        } catch (delErr) {
          console.warn("Gagal menghapus doc personel:", pId, delErr)
        }
      }

      // 3. Hapus data aparatur dari koleksi 'officials'
      const offId = acc.officialId || (acc.id.startsWith("off_") ? acc.id.replace(/^off_/, '').split('_')[0] : null)
      if (offId) {
        try {
          await deleteDoc(doc(db, "officials", offId))
        } catch (offErr) {
          console.warn("Gagal menghapus doc officials:", offId, offErr)
        }
      }

      toast({
        title: "Akun Berhasil Dihapus",
        description: `Akun "${nama}" telah berhasil dibuang dari database & sistem.`
      })
    } catch (e: any) {
      console.error("Error menghapus akun:", e)
      toast({
        variant: "destructive",
        title: "Gagal Menghapus Akun",
        description: e.message || "Terjadi kendala saat menghapus dari database."
      })
    } finally {
      setDeletingAccountId(null)
    }
  }

  // --- Handlers Akun Admin ---
  const handleSaveAdminAccount = async () => {
    if (!db || !user) return
    const nama = adminFormData.nama.toUpperCase().trim()
    const username = adminFormData.username.toLowerCase().trim()
    const password = adminFormData.password.trim()

    if (!nama || !username || !password) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "Lengkapi nama, username, dan kata sandi admin." })
      return
    }

    setIsAdminSaving(true)
    try {
      // 1. Update Firebase Auth kata sandi untuk akun admin aktif
      if (auth?.currentUser) {
        try {
          await updatePassword(auth.currentUser, password)
        } catch (authErr: any) {
          console.warn("Direct Auth password update note:", authErr.message)
        }
      }

      // 2. Simpan kredensial admin ke Firestore 'personel'
      const adminDocId = adminAccount?.id || user.uid
      await setDoc(doc(db, "personel", adminDocId), {
        uid: user.uid,
        nama,
        username,
        password,
        email: `${username}@sampeldes.id`,
        role: "admin",
        aktif: true,
        updated_at: new Date().toISOString()
      }, { merge: true })

      toast({
        title: "Kredensial Admin Diperbarui",
        description: `Username: ${username} | Password berhasil diperbarui.`
      })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: e.message || "Gagal memperbarui akun admin." })
    } finally {
      setIsAdminSaving(false)
    }
  }

  // --- Handlers Sistem & Lokasi ---
  const handleSaveGlobal = async () => {
    if (!db || !user) return
    setIsSaving(true)
    try {
      await setDoc(doc(db, "absensi_settings", "global"), formData)
      toast({ title: "Konfigurasi Sistem Diperbarui" })
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal Menyimpan" })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      hari_kerja: prev.hari_kerja.includes(day)
        ? prev.hari_kerja.filter(d => d !== day)
        : [...prev.hari_kerja, day]
    }))
  }

  const updateDailyTime = (day: string, field: 'masuk' | 'pulang', value: string) => {
    setFormData(prev => ({
      ...prev,
      jadwal: {
        ...prev.jadwal,
        [day]: {
          ...prev.jadwal[day as keyof typeof prev.jadwal],
          [field]: value
        }
      }
    }))
  }

  const addHoliday = () => {
    if (!newHoliday) return
    if (formData.hari_libur.includes(newHoliday)) return
    setFormData(prev => ({ ...prev, hari_libur: [...prev.hari_libur, newHoliday].sort() }))
    setNewHoliday("")
  }

  const removeHoliday = (date: string) => {
    setFormData(prev => ({ ...prev, hari_libur: prev.hari_libur.filter(d => d !== date) }))
  }

  const [selectedHolidayYear, setSelectedHolidayYear] = useState<string>("2026")

  const handleAutoFillHolidays = (yearOption?: string) => {
    const yr = yearOption || selectedHolidayYear
    const holidays = getIndonesianHolidays(yr)
    const newDates = holidays.map(h => h.date)

    const merged = Array.from(new Set([...formData.hari_libur, ...newDates])).sort()
    const addedCount = merged.length - formData.hari_libur.length

    setFormData(prev => ({ ...prev, hari_libur: merged }))

    toast({
      title: "Libur Nasional Berhasil Dimuat",
      description: `Berhasil menambahkan ${newDates.length} hari libur nasional Indonesia (${addedCount} tanggal baru ditambahkan). Klik "Simpan Konfigurasi Sistem" untuk menyimpan perubahan permanen.`
    })
  }

  const handleClearAllHolidays = () => {
    if (!confirm("Kosongkan seluruh daftar hari libur nasional & khusus?")) return
    setFormData(prev => ({ ...prev, hari_libur: [] }))
    toast({ title: "Daftar Libur Dikosongkan" })
  }

  if (isUserLoading || isSettingsLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="p-8 rounded-3xl bg-white dark:bg-[#081d27] shadow-md border border-white/60 flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-700" />
          <p className="text-xs font-black uppercase tracking-widest text-stone-600">Memuat Pengaturan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-24">
      {/* Header Halaman */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 text-[10px] font-black uppercase tracking-widest text-stone-600 mb-2">
            <Settings className="h-3 w-3 text-emerald-700" />
            <span>Pusat Konfigurasi • Absensi Digital</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">Konfigurasi Sistem</h1>
          <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mt-1">Database Absensi, Hak Akses & Pengaturan Real-time</p>
        </div>
      </header>

      <Tabs defaultValue="perangkat" className="w-full">
        {/* Neumorphic Inset Tabs Header */}
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-14 bg-white dark:bg-[#081d27] p-1.5 rounded-2xl mb-6 gap-2 shadow-inner border border-stone-300/40">
          <TabsTrigger
            value="perangkat"
            className="gap-2 text-[10.5px] font-sans font-black uppercase rounded-xl h-11 sm:h-full transition-all text-stone-600 data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 cursor-pointer"
          >
            <UserCheck className="h-4 w-4 text-emerald-700" /> Akun Perangkat Desa
          </TabsTrigger>
          <TabsTrigger
            value="admin"
            className="gap-2 text-[10.5px] font-sans font-black uppercase rounded-xl h-11 sm:h-full transition-all text-stone-600 data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4 text-amber-700" /> Akun Administrator
          </TabsTrigger>
          <TabsTrigger
            value="sistem"
            className="gap-2 text-[10.5px] font-sans font-black uppercase rounded-xl h-11 sm:h-full transition-all text-stone-600 data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 cursor-pointer"
          >
            <Settings className="h-4 w-4 text-sky-700" /> Sistem & Lokasi
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================================= */}
        {/* TAB 1: AKUN PERANGKAT DESA */}
        {/* ========================================================================================= */}
        <TabsContent value="perangkat" className="space-y-6 w-full">
          <div className="bg-white dark:bg-[#081d27] rounded-3xl p-4 sm:p-6 shadow-md border border-white/60 w-full">
            {/* Header Card */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-stone-300/40">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 text-emerald-700 flex items-center justify-center shrink-0">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Manajemen Akun Perangkat</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-700 text-white shadow-sm">
                      {mergedPerangkatList.length} Perangkat
                    </span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mt-0.5 flex items-center gap-1.5">
                    <Landmark className="h-3 w-3 text-emerald-600" />
                    <span>Data Perangkat Terhubung dari Pemerintahan Desa (/admin/pemerintahan)</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-52">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    placeholder="CARI PERANGKAT..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 h-11 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs uppercase text-slate-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <Link href="/admin/pemerintahan" target="_blank">
                  <button
                    type="button"
                    className="w-full sm:w-auto rounded-xl font-black text-xs uppercase tracking-wider gap-2 bg-white dark:bg-[#081d27] hover:bg-stone-200 text-slate-800 h-11 px-3.5 shadow-sm border border-white/80 transition-all flex items-center justify-center cursor-pointer shrink-0"
                    title="Buka Halaman Pengelolaan Perangkat Desa di Website Admin"
                  >
                    <ExternalLink className="h-4 w-4 text-sky-700" /> Pemerintahan Desa
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={handleSimpanKaderisasi}
                  disabled={isSyncingKaderisasi}
                  className="rounded-xl font-black text-xs uppercase tracking-wider gap-2 bg-[#0e1620] hover:bg-slate-900 active:scale-95 text-amber-300 h-11 px-5 shadow-sm border border-white/10 transition-all flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-60"
                  title="Simpan seluruh kaderisasi dan sinkronkan akun ke Firebase Authenticator"
                >
                  {isSyncingKaderisasi ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                      <span>Menyinkronkan...</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 text-amber-300" />
                      <span>Simpan Kaderisasi</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Banner Keterangan Integrasi */}
            <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-800">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                <span className="font-sans">
                  <strong>Sumber Data Resmi:</strong> Nama & Jabatan otomatis sinkron dengan <strong>Pemerintahan Desa</strong>. Klik tombol <strong>Simpan Kaderisasi</strong> untuk mengaktifkan / menyinkronkan username & kata sandi ke sistem login presensi.
                </span>
              </div>
              <Badge variant="outline" className="shrink-0 bg-white/40 text-[10px] uppercase font-bold text-emerald-800 border-emerald-300/60 self-start sm:self-auto">
                Sinkronisasi Wajib Klik Kaderisasi
              </Badge>
            </div>

            {/* Indikator Progres Sinkronisasi */}
            {isSyncingKaderisasi && syncProgress && (
              <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs font-bold text-amber-950 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-amber-700 shrink-0" />
                <span className="font-mono tracking-wide">{syncProgress}</span>
              </div>
            )}

            {/* Table Area (Neumorphic Inset) - Full Width on PC without Horizontal Scroll */}
            <div className="mt-6 rounded-2xl overflow-hidden shadow-inner bg-white dark:bg-[#081d27] p-1 border border-stone-300/40 w-full">
              <div className="flex items-center justify-between p-2.5 sm:px-3 border-b border-stone-300/40 bg-stone-100/50">
                <span className="text-[10px] sm:text-[11px] font-black uppercase text-stone-600 tracking-wider flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  Kustomisasi Kredensial Perangkat Desa (Dapat Diedit Langsung)
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllPasswords(!showAllPasswords)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#081d27] shadow-xs border border-white/60 text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider text-stone-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {showAllPasswords ? <EyeOff className="h-3 w-3 text-amber-600" /> : <Eye className="h-3 w-3 text-emerald-600" />}
                  <span>{showAllPasswords ? "Sembunyikan Sandi" : "Tampilkan Semua Sandi"}</span>
                </button>
              </div>

              <div className="overflow-x-auto w-full">
                <Table className="w-full table-fixed">
                  <TableHeader className="bg-[#0e1620]">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="px-3 py-2 h-9 font-black text-[9px] uppercase text-stone-300 tracking-wider w-[21%]">Perangkat Desa</TableHead>
                      <TableHead className="px-2 py-2 h-9 font-black text-[9px] uppercase text-stone-300 tracking-wider w-[15%]">Jabatan</TableHead>
                      <TableHead className="px-1.5 py-2 h-9 text-center font-black text-[9px] uppercase text-stone-300 tracking-wider w-[13%]">Status Akun</TableHead>
                      <TableHead className="px-2 py-2 h-9 font-black text-[9px] uppercase text-stone-300 tracking-wider w-[15%]">Custom Username</TableHead>
                      <TableHead className="px-2 py-2 h-9 font-black text-[9px] uppercase text-stone-300 tracking-wider w-[19%]">Custom Password</TableHead>
                      <TableHead className="px-2 py-2 h-9 text-center font-black text-[9px] uppercase text-stone-300 tracking-wider w-[17%]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isAccountsLoading || isOfficialsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-stone-400" />
                          <p className="text-[10px] font-bold text-stone-500 uppercase mt-2">Memuat data perangkat desa...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredPerangkat.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center">
                          <div className="max-w-sm mx-auto space-y-2.5">
                            <div className="h-10 w-10 rounded-xl bg-white dark:bg-[#081d27] shadow-inner flex items-center justify-center mx-auto text-stone-400">
                              <UserCheck className="h-5 w-5" />
                            </div>
                            <p className="text-[10.5px] font-bold uppercase text-stone-500">
                              {searchTerm ? "Tidak ada perangkat yang cocok dengan pencarian." : "Belum ada data perangkat desa di Pemerintahan Desa."}
                            </p>
                            <Link href="/admin/pemerintahan" target="_blank">
                              <button
                                className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#081d27] shadow-xs border border-white/60 font-black text-[9px] uppercase tracking-wider text-emerald-800 hover:text-emerald-900 cursor-pointer"
                              >
                                Buka Menu Pemerintahan Desa
                              </button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredPerangkat.map((acc, idx) => {
                      const edits = accountEdits[acc.id] || null
                      const isRowSaving = savingAccountId === acc.id
                      const isSynced = acc.isSynced && !edits
                      const isPasswordVisible = showAllPasswords || showPasswords[acc.id]
                      const isEdited = Boolean(edits)

                      return (
                        <TableRow key={`${acc.id}-${acc.officialId || idx}`} className="border-b border-stone-300/30 hover:bg-stone-200/30 transition-colors">
                          {/* 1. Perangkat Desa */}
                          <TableCell className="px-2.5 py-2">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[9.5px] shrink-0 shadow-xs">
                                {acc.nama ? acc.nama.substring(0, 2).toUpperCase() : "PD"}
                              </div>
                              <div className="min-w-0">
                                <p className="font-condensed font-black text-[10.5px] uppercase text-slate-900 truncate leading-tight" title={acc.nama}>
                                  {acc.nama}
                                </p>
                                <span className="inline-block text-[7.5px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-500/15 px-1 py-0.2 rounded-xs leading-none">
                                  Perangkat
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* 2. Jabatan */}
                          <TableCell className="px-2 py-2">
                            <span className="font-condensed font-bold text-[10px] uppercase text-slate-700 block truncate leading-tight" title={acc.jabatan}>
                              {acc.jabatan || "-"}
                            </span>
                          </TableCell>

                          {/* 3. Status Akun */}
                          <TableCell className="px-1.5 py-2 text-center">
                            {isEdited ? (
                              <Badge variant="outline" className="bg-sky-500/15 text-sky-800 border-sky-300/60 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                Belum Disimpan
                              </Badge>
                            ) : isSynced ? (
                              <Badge className="bg-emerald-600/15 text-emerald-800 border-emerald-300/60 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-1 text-emerald-600 inline shrink-0" /> Terkaderisasi
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-500/15 text-amber-800 border-amber-300/60 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                <AlertTriangle className="h-2.5 w-2.5 mr-1 text-amber-600 inline shrink-0" /> Menunggu Kaderisasi
                              </Badge>
                            )}
                          </TableCell>

                          {/* 4. Custom Username */}
                          <TableCell className="px-2 py-2">
                            <div className="relative flex items-center">
                              <span className="absolute left-2 text-stone-400 font-mono text-[9.5px] select-none">@</span>
                              <input
                                value={edits?.username ?? acc.username}
                                onChange={e => handleAccountFieldChange(acc.id, 'username', e.target.value.toLowerCase().replace(/\s+/g, ''))}
                                className="w-full h-7 pl-5 pr-1 font-mono text-[10px] rounded-lg bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-bold"
                                placeholder="username"
                                title="Klik untuk mengubah username kustom"
                              />
                            </div>
                          </TableCell>

                          {/* 5. Custom Password */}
                          <TableCell className="px-2 py-2">
                            <div className="relative flex items-center gap-1">
                              <div className="relative flex-1 flex items-center">
                                <input
                                  type={isPasswordVisible ? "text" : "password"}
                                  value={edits?.password ?? acc.password}
                                  onChange={e => handleAccountFieldChange(acc.id, 'password', e.target.value)}
                                  className="w-full h-7 pl-2 pr-5 font-mono text-[10px] rounded-lg bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-bold"
                                  placeholder="kata sandi"
                                  title="Klik untuk mengubah kata sandi kustom"
                                />
                                <button
                                  type="button"
                                  onClick={() => toggleShowPassword(acc.id)}
                                  className="absolute right-1 text-stone-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                  title={isPasswordVisible ? "Sembunyikan sandi" : "Lihat sandi"}
                                >
                                  {isPasswordVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleGenerateRandomPass(acc.id)}
                                className="h-7 w-7 rounded-lg bg-white dark:bg-[#081d27] shadow-xs border border-white/60 text-amber-700 hover:text-amber-800 flex items-center justify-center cursor-pointer shrink-0 transition-transform active:scale-90"
                                title="Generate Kata Sandi Acak Otomatis"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </button>
                            </div>
                          </TableCell>

                          {/* 6. Aksi */}
                          <TableCell className="px-2 py-2 text-center">
                            <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenCustomModal(acc)}
                                className="h-7 px-2 rounded-lg font-black text-[8.5px] uppercase tracking-wider bg-white dark:bg-[#081d27] hover:bg-stone-200 text-slate-800 shadow-xs border border-white/60 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
                                title="Buka Dialog Kustomisasi Lanjutan Kredensial"
                              >
                                <KeyRound className="h-3 w-3 text-amber-600" />
                                <span>KUSTOM</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveAccount(acc)}
                                disabled={isRowSaving}
                                className="h-7 px-2.5 rounded-lg font-black text-[8.5px] uppercase tracking-wider bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-60 shrink-0"
                                title="Simpan & kaderisasi akun ini ke Firebase Authenticator"
                              >
                                {isRowSaving ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Save className="h-2.5 w-2.5" />}
                                <span>SIMPAN</span>
                              </button>
                              <button
                                type="button"
                                disabled={deletingAccountId === acc.id}
                                onClick={() => handleDeleteAccount(acc)}
                                className="h-7 w-7 rounded-lg bg-white dark:bg-[#081d27] shadow-xs border border-white/60 text-red-600 hover:text-red-700 active:scale-95 flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-50"
                                title="Hapus Akun Permanen"
                              >
                                {deletingAccountId === acc.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-red-600" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Banner Info & Quick Action Kaderisasi */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-[#0e1620] text-amber-300 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Users className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                  Sinkronisasi Otomatis Firestore &amp; Firebase Authenticator
                </p>
                <p className="text-[11px] font-bold text-stone-600 leading-relaxed uppercase">
                  Gunakan tombol <strong>&quot;Simpan Kaderisasi&quot;</strong> saat ada penambahan atau pergantian akun perangkat agar kredensial (Username &amp; Password) langsung aktif terdaftar di sistem Firebase Authenticator.
                </p>
                <p className="text-[10px] text-stone-500 font-semibold">
                  Perangkat desa dapat langsung masuk ke portal <code className="text-emerald-800 font-mono font-bold">/absensi/login</code> tanpa kendala autentikasi.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSimpanKaderisasi}
              disabled={isSyncingKaderisasi}
              className="h-12 px-6 rounded-2xl bg-[#0e1620] hover:bg-slate-900 active:scale-95 text-amber-300 font-black text-xs uppercase tracking-wider shadow-sm border border-white/10 flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-60 transition-all"
            >
              {isSyncingKaderisasi ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                  <span>Menyinkronkan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 text-amber-300" />
                  <span>Simpan Kaderisasi</span>
                </>
              )}
            </button>
          </div>
        </TabsContent>

        {/* ========================================================================================= */}
        {/* TAB 2: AKUN ADMINISTRATOR ABSENSI */}
        {/* ========================================================================================= */}
        <TabsContent value="admin" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-[#081d27] rounded-3xl p-6 sm:p-8 shadow-md border border-white/60 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-stone-300/40">
                <div className="h-12 w-12 rounded-2xl bg-[#0e1620] text-amber-400 flex items-center justify-center shrink-0 shadow-md">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Pengaturan Akun Administrator</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0e1620] text-amber-400">
                      Superadmin
                    </span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mt-0.5">
                    Hak Akses Panel Monitoring, Input Rekap, dan Laporan Absensi
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-stone-500 tracking-wider ml-1">
                    Nama Administrator
                  </Label>
                  <input
                    value={adminFormData.nama}
                    onChange={e => setAdminFormData(p => ({ ...p, nama: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-black text-sm uppercase text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-stone-500 tracking-wider ml-1">
                    Username Login Admin
                  </Label>
                  <input
                    value={adminFormData.username}
                    onChange={e => setAdminFormData(p => ({ ...p, username: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-mono text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-stone-500 tracking-wider ml-1">
                    Email Sistem (Otomatis)
                  </Label>
                  <input
                    readOnly
                    disabled
                    value={`${adminFormData.username.toLowerCase()}@sampeldes.id`}
                    className="w-full h-12 px-4 rounded-xl bg-stone-200/50 shadow-inner border border-stone-300/40 font-mono text-xs text-stone-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-stone-500 tracking-wider ml-1">
                    Kata Sandi Administrator
                  </Label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      value={adminFormData.password}
                      onChange={e => setAdminFormData(p => ({ ...p, password: e.target.value }))}
                      className="w-full h-12 pl-4 pr-11 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-mono text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                    >
                      {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAdminAccount}
                  disabled={isAdminSaving}
                  className="h-12 px-7 rounded-2xl bg-[#0e1620] hover:bg-slate-900 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                >
                  {isAdminSaving ? <Loader2 className="h-4 w-4 animate-spin text-amber-400" /> : <Save className="h-4 w-4 text-amber-400" />}
                  Simpan Kredensial Admin
                </button>
              </div>
            </div>

            {/* Panel Proteksi Keamanan Dark Theme */}
            <div className="bg-[#0e1620] shadow-md rounded-3xl p-6 sm:p-8 text-white flex flex-col justify-between border border-white/10">
              <div className="space-y-5">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-white">Proteksi Pemisahan Akses</h3>
                  <p className="text-xs text-stone-300 font-medium leading-relaxed mt-2">
                    Akun administrator ini memiliki hak akses penuh ke panel monitoring, cetak dokumen, dan pengaturan sistem.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> Keamanan Terjamin
                  </div>
                  <p className="text-[11px] text-stone-300 leading-relaxed">
                    Sistem secara otomatis <strong>menolak</strong> akun admin ini jika dicoba untuk login di Portal Presensi Karyawan (<code className="text-amber-300 font-mono">/absensi/login</code>) guna mencegah data presensi ganda.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] text-stone-400 font-mono uppercase">
                  Login Panel Admin: /absensi-admin/login
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================================= */}
        {/* TAB 3: SISTEM & LOKASI */}
        {/* ========================================================================================= */}
        <TabsContent value="sistem" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* TITIK LOKASI */}
            <div className="bg-white dark:bg-[#081d27] rounded-3xl p-6 sm:p-8 shadow-md border border-white/60 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-stone-300/40">
                <div className="h-10 w-10 rounded-xl bg-white dark:bg-[#081d27] shadow-inner flex items-center justify-center text-emerald-700">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Titik Lokasi Kantor</h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Koordinat Validasi GPS Presensi</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-stone-500 tracking-wider ml-1">Latitude</Label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lokasi_kantor.lat}
                    onChange={e => setFormData(p => ({ ...p, lokasi_kantor: { ...p.lokasi_kantor, lat: parseFloat(e.target.value) } }))}
                    className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-black text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-stone-500 tracking-wider ml-1">Longitude</Label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lokasi_kantor.lng}
                    onChange={e => setFormData(p => ({ ...p, lokasi_kantor: { ...p.lokasi_kantor, lng: parseFloat(e.target.value) } }))}
                    className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-black text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-stone-500 tracking-wider ml-1">Radius Presensi (Meter)</Label>
                <input
                  type="number"
                  value={formData.radius_lokasi}
                  onChange={e => setFormData(p => ({ ...p, radius_lokasi: parseInt(e.target.value) || 0 }))}
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-black text-base text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* PENGATURAN UMUM */}
            <div className="bg-white dark:bg-[#081d27] rounded-3xl p-6 sm:p-8 shadow-md border border-white/60 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-stone-300/40">
                <div className="h-10 w-10 rounded-xl bg-white dark:bg-[#081d27] shadow-inner flex items-center justify-center text-amber-700">
                  <Timer className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Pengaturan Waktu</h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Toleransi Keterlambatan</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-stone-500 tracking-wider ml-1">Toleransi Telat (Menit)</Label>
                <input
                  type="number"
                  value={formData.toleransi_telat}
                  onChange={e => setFormData(p => ({ ...p, toleransi_telat: parseInt(e.target.value) || 0 }))}
                  className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-black text-base text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-start gap-3">
                <Info className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
                <p className="text-[10.5px] font-bold text-stone-700 uppercase leading-relaxed">
                  Tip: Seluruh pengaturan waktu dan radius lokasi ini berlaku otomatis secara real-time untuk seluruh staf dan perangkat desa.
                </p>
              </div>
            </div>

            {/* DETAIL JADWAL HARIAN */}
            <div className="bg-white dark:bg-[#081d27] rounded-3xl p-6 sm:p-8 shadow-md border border-white/60 md:col-span-2 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-stone-300/40">
                <div className="h-10 w-10 rounded-xl bg-white dark:bg-[#081d27] shadow-inner flex items-center justify-center text-sky-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Jadwal Jam Kerja Harian</h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Tentukan Jam Masuk & Pulang Setiap Hari</p>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden shadow-inner bg-white dark:bg-[#081d27] p-1.5 border border-stone-300/40">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-[#0e1620]">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="px-6 h-12 font-black text-[10px] uppercase text-stone-300 tracking-wider">Hari</TableHead>
                        <TableHead className="h-12 font-black text-[10px] uppercase text-stone-300 tracking-wider">Jam Masuk</TableHead>
                        <TableHead className="h-12 font-black text-[10px] uppercase text-stone-300 tracking-wider">Jam Pulang</TableHead>
                        <TableHead className="px-6 h-12 text-center font-black text-[10px] uppercase text-stone-300 tracking-wider">Hari Kerja Aktif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {DAYS.map((day) => (
                        <TableRow key={day.id} className="border-b border-stone-300/30 hover:bg-stone-200/30 transition-colors">
                          <TableCell className="px-6 py-3.5">
                            <span className="font-black text-slate-800 text-xs uppercase tracking-wider">{day.label}</span>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <input
                              type="time"
                              value={formData.jadwal[day.id as keyof typeof formData.jadwal]?.masuk || "08:00"}
                              onChange={e => updateDailyTime(day.id, 'masuk', e.target.value)}
                              className="h-9 px-3 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 font-bold text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            />
                          </TableCell>
                          <TableCell className="py-3.5">
                            <input
                              type="time"
                              value={formData.jadwal[day.id as keyof typeof formData.jadwal]?.pulang || "15:30"}
                              onChange={e => updateDailyTime(day.id, 'pulang', e.target.value)}
                              className="h-9 px-3 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 font-bold text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            />
                          </TableCell>
                          <TableCell className="px-6 text-center">
                            <input
                              type="checkbox"
                              checked={formData.hari_kerja.includes(day.id)}
                              onChange={() => toggleDay(day.id)}
                              className="h-4 w-4 rounded accent-emerald-700 cursor-pointer"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* HARI LIBUR */}
            <div className="bg-white dark:bg-[#081d27] rounded-3xl p-6 sm:p-8 shadow-md border border-white/60 md:col-span-2 space-y-6">
              {/* Header Kartu Libur */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-300/40">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white dark:bg-[#081d27] shadow-inner flex items-center justify-center text-red-700">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Daftar Hari Libur Nasional & Khusus</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Tanggal Merah Bebas Presensi Pegawai Desa</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 text-stone-700">
                    {formData.hari_libur.length} Hari Libur Terdaftar
                  </span>
                </div>
              </div>

              {/* Panel Kontrol Otomatis Isi Libur Nasional Indonesia (SKB 3 Menteri) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Otomatisasi Libur Nasional RI (SKB 3 Menteri)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white dark:bg-[#081d27] shadow-xs border border-white/60 px-3 py-1.5 rounded-xl">
                      <span className="text-[10px] font-black uppercase text-stone-500">Tahun:</span>
                      <select
                        value={selectedHolidayYear}
                        onChange={e => setSelectedHolidayYear(e.target.value)}
                        className="bg-transparent text-xs font-black text-slate-900 focus:outline-none cursor-pointer"
                      >
                        <option value="2026">2026 (Tahun Ini)</option>
                        <option value="2025">2025</option>
                        <option value="2027">2027</option>
                        <option value="all">Semua Tahun</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAutoFillHolidays()}
                      className="h-10 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-sm hover:opacity-95 active:scale-95 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Isi Otomatis Libur Nasional
                    </button>

                    {formData.hari_libur.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllHolidays}
                        className="h-10 px-3.5 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/60 text-stone-600 hover:text-red-700 active:scale-95 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                        title="Kosongkan seluruh daftar libur"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Kosongkan
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 font-medium">
                  Klik tombol di atas untuk mengisi seluruh tanggal merah resmi Indonesia beserta Cuti Bersama. Data yang sudah ada tidak akan diduplikasi. Jangan lupa klik <strong>"Simpan Konfigurasi Sistem"</strong> di bawah setelah selesai.
                </p>
              </div>

              {/* Tambah Manual Tanggal Khusus Desa */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-stone-500 ml-1">
                  Tambah Manual Hari Libur / Acara Khusus Desa
                </Label>
                <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                  <input
                    type="date"
                    value={newHoliday}
                    onChange={e => setNewHoliday(e.target.value)}
                    className="h-11 px-4 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                  <button
                    type="button"
                    onClick={addHoliday}
                    className="h-11 px-5 rounded-xl bg-white dark:bg-[#081d27] shadow-sm border border-white/60 font-black text-xs uppercase tracking-wider text-slate-800 hover:text-red-700 active:scale-95 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="h-4 w-4" /> Tambah Tanggal
                  </button>
                </div>
              </div>

              {/* Daftar Tanggal Libur yang Terdaftar */}
              <div className="space-y-2 pt-2">
                <Label className="text-[10px] font-black uppercase text-stone-500 ml-1">
                  Daftar Tanggal Merah ({formData.hari_libur.length} Tanggal)
                </Label>
                <div className="flex flex-wrap gap-2.5 max-h-96 overflow-y-auto p-3 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40">
                  {formData.hari_libur.map(date => {
                    const desc = getHolidayDescription(date)
                    return (
                      <div
                        key={date}
                        className="flex items-center gap-2 bg-white dark:bg-[#081d27] shadow-xs border border-white/80 pl-3 pr-1.5 py-1.5 rounded-xl hover:shadow-xs transition-all"
                      >
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-red-700 font-mono tracking-tight">{date}</span>
                          {desc && (
                            <span className="text-[10px] font-bold text-stone-600 max-w-[200px] sm:max-w-[280px] truncate" title={desc}>
                              {desc}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeHoliday(date)}
                          className="h-6 w-6 ml-1 rounded-lg bg-white dark:bg-[#081d27] shadow-xs border border-white/60 flex items-center justify-center text-stone-400 hover:text-red-700 active:scale-90 cursor-pointer transition-all"
                          title={`Hapus libur ${date}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                  {formData.hari_libur.length === 0 && (
                    <div className="w-full py-6 text-center text-stone-400 italic text-xs">
                      Belum ada hari libur yang ditambahkan. Gunakan tombol "Isi Otomatis Libur Nasional" di atas untuk mengisi tanggal merah resmi Indonesia secara instan.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Simpan Konfigurasi */}
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={handleSaveGlobal}
              disabled={isSaving}
              className="w-full max-w-md h-14 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-3 cursor-pointer transition-all disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
              Simpan Konfigurasi Sistem
            </button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Tambah Perangkat (Neumorphic) */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="rounded-3xl border border-white/80 shadow-xl bg-white dark:bg-[#081d27] p-8 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-base text-slate-900 text-center flex items-center justify-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-700" /> Tambah Perangkat Baru
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-stone-500 ml-1">Nama Lengkap Perangkat</Label>
              <input
                placeholder="CONTOH: BUDI SANTOSO"
                value={newAccount.nama}
                onChange={e => setNewAccount(p => ({ ...p, nama: e.target.value }))}
                className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 uppercase font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-stone-500 ml-1">Jabatan Perangkat</Label>
              <input
                placeholder="CONTOH: KEPALA DUSUN I"
                value={newAccount.jabatan}
                onChange={e => setNewAccount(p => ({ ...p, jabatan: e.target.value }))}
                className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 uppercase font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-stone-500 ml-1">Username Login</Label>
              <input
                placeholder="CONTOH: budi01"
                value={newAccount.username}
                onChange={e => setNewAccount(p => ({ ...p, username: e.target.value }))}
                className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-stone-500 ml-1">Kata Sandi</Label>
              <input
                placeholder="KATA SANDI"
                value={newAccount.password}
                onChange={e => setNewAccount(p => ({ ...p, password: e.target.value }))}
                className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={handleAddAccount}
              disabled={isSaving}
              className="w-full h-12 rounded-xl font-black uppercase text-xs tracking-wider bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white shadow-sm transition-all flex items-center justify-center cursor-pointer disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "SIMPAN PERANGKAT BARU"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Kustomisasi Kredensial Perangkat (Customize Username & Password) */}
      <Dialog open={!!customModalItem} onOpenChange={(open) => !open && setCustomModalItem(null)}>
        <DialogContent className="rounded-3xl border border-white/80 shadow-xl bg-white dark:bg-[#081d27] p-8 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-base text-slate-900 text-center flex items-center justify-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-600" /> Kustomisasi Kredensial Akun
            </DialogTitle>
          </DialogHeader>

          {customModalItem && (
            <div className="space-y-4 py-4">
              {/* Info Perangkat dari Pemerintahan */}
              <div className="p-3.5 rounded-2xl bg-white/40 border border-stone-300/40 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shrink-0 shadow-xs">
                  {customModalItem.nama ? customModalItem.nama.substring(0, 2).toUpperCase() : "PD"}
                </div>
                <div className="min-w-0">
                  <p className="font-condensed font-black text-xs uppercase text-slate-900 truncate">
                    {customModalItem.nama}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-stone-500 truncate">
                    {customModalItem.jabatan}
                  </p>
                </div>
              </div>

              {/* Input Custom Username */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-stone-500 ml-1">Custom Username</Label>
                  <button
                    type="button"
                    onClick={() => {
                      const clean = (customModalItem.nama || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) || "perangkat"
                      setCustomUsername(clean)
                    }}
                    className="text-[9px] font-bold uppercase text-sky-700 hover:underline cursor-pointer"
                  >
                    Reset ke Nama Default
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-stone-400 font-mono text-xs select-none">@</span>
                  <input
                    placeholder="username_kustom"
                    value={customUsername}
                    onChange={e => setCustomUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full h-11 pl-8 pr-3.5 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <p className="text-[9px] text-stone-500 italic ml-1">
                  Login presensi menggunakan email: <span className="font-mono text-emerald-800 font-bold">{customUsername || "username"}@sampeldes.id</span>
                </p>
              </div>

              {/* Input Custom Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-stone-500 ml-1">Custom Kata Sandi</Label>
                  <button
                    type="button"
                    onClick={() => {
                      const pass = generateRandomPassword()
                      setCustomPassword(pass)
                      setShowCustomModalPassword(true)
                    }}
                    className="text-[9px] font-bold uppercase text-amber-700 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Buat Sandi Acak
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showCustomModalPassword ? "text" : "password"}
                    placeholder="KATA SANDI KUSTOM"
                    value={customPassword}
                    onChange={e => setCustomPassword(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomModalPassword(!showCustomModalPassword)}
                    className="absolute right-3 text-stone-400 hover:text-slate-700 p-1 cursor-pointer"
                    title={showCustomModalPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                  >
                    {showCustomModalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[9px] text-stone-500 italic ml-1">Minimal 6 karakter untuk otentikasi login portal.</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleSaveCustomModal(false)}
              className="flex-1 h-11 rounded-xl font-black uppercase text-xs tracking-wider bg-white dark:bg-[#081d27] hover:bg-stone-200 text-slate-800 shadow-sm border border-white/80 transition-all cursor-pointer"
            >
              Terapkan ke Tabel
            </button>
            <button
              type="button"
              onClick={() => handleSaveCustomModal(true)}
              className="flex-1 h-11 rounded-xl font-black uppercase text-xs tracking-wider bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              Simpan & Kaderisasi
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

