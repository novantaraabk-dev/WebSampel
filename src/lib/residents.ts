import {
  Firestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  writeBatch,
  collection,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
} from 'firebase/firestore';
import { Resident } from '@/lib/types';
import { getCachedKkMembers, cacheKkMembers, invalidateKkMembers } from '@/lib/kk-cache';
import { invalidateDocCache } from '@/firebase/firestore/use-doc';

// 1. In-Memory Cache untuk menghemat Quota Read Firestore saat Autofill NIK & Pencarian
const residentMemoryCache = new Map<string, Resident>();
const residentNotFoundCache = new Map<string, number>(); // Negative cache agar NIK salah/luar desa tidak query berulang
const inFlightNikRequests = new Map<string, Promise<Resident | null>>(); // Deduplikasi request NIK bersamaan
const residentSearchCache = new Map<string, { data: Resident[]; timestamp: number }>();
const RESIDENT_LOCAL_TTL_MS = 24 * 60 * 60 * 1000; // 24 Jam di LocalStorage
const NOT_FOUND_TTL_MS = 10 * 60 * 1000; // 10 Menit negative cache untuk NIK tidak terdaftar
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000; // 10 Menit untuk keyword pencarian yang sama

/**
 * Menyimpan data penduduk ke cache lokal 3-lapis (Memory + SessionStorage + LocalStorage 24 Jam)
 */
export const cacheResident = (resident: Resident) => {
  if (!resident || !resident.nik) return;
  const cleanNik = String(resident.nik).replace(/\D/g, '').trim();
  if (!cleanNik) return;
  residentMemoryCache.set(cleanNik, resident);
  residentNotFoundCache.delete(cleanNik);
  if (typeof window !== 'undefined') {
    try {
      const serialized = JSON.stringify(resident);
      sessionStorage.setItem(`res_cache_${cleanNik}`, serialized);
      sessionStorage.removeItem(`res_nf_${cleanNik}`);
      localStorage.setItem(
        `res_lcache_${cleanNik}`,
        JSON.stringify({ data: resident, ts: Date.now() })
      );
    } catch {
      // Ignore storage quota errors
    }
  }
};

/**
 * Menghapus cache penduduk tertentu ketika diedit/dihapus
 */
export const invalidateResidentCache = (nik?: string, noKk?: string) => {
  residentSearchCache.clear();
  if (nik) {
    const cleanNik = String(nik).replace(/\D/g, '').trim();
    residentMemoryCache.delete(cleanNik);
    residentNotFoundCache.delete(cleanNik);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(`res_cache_${cleanNik}`);
        sessionStorage.removeItem(`res_nf_${cleanNik}`);
        localStorage.removeItem(`res_lcache_${cleanNik}`);
      } catch {
        // Ignore
      }
    }
  }
  if (noKk) {
    invalidateKkMembers(noKk);
  }
};

/**
 * MENCARI DATA PENDUDUK BY NIK (ULTRA OPTIMIZED - ZERO / 1 READ QUERY SCHEMA)
 * 1. Cek Memory Cache (0 Read)
 * 2. Cek Negative Cache untuk NIK luar desa / salah ketik (0 Read)
 * 3. Cek SessionStorage & LocalStorage 24 Jam (0 Read)
 * 4. Deduplikasi In-Flight Request jika dipanggil bersamaan oleh beberapa hook
 * 5. Jika tidak ada di cache, panggil getDoc(doc(db, 'residents', nik)) (Tepat 1 Read tanpa scan index)
 */
export const getResidentByNik = async (db: Firestore, nik: string): Promise<Resident | null> => {
  if (!nik || !db) return null;
  const cleanNik = String(nik).replace(/\D/g, '').trim();
  if (cleanNik.length !== 16) return null;

  // 1. Cek Memory Cache (0 Read)
  if (residentMemoryCache.has(cleanNik)) {
    return residentMemoryCache.get(cleanNik)!;
  }

  // 2. Cek Negative Cache di Memory (0 Read)
  const nfTs = residentNotFoundCache.get(cleanNik);
  if (nfTs && Date.now() - nfTs < NOT_FOUND_TTL_MS) {
    return null;
  }

  // 3. Cek SessionStorage & LocalStorage Cache (0 Read)
  if (typeof window !== 'undefined') {
    try {
      const cachedStr = sessionStorage.getItem(`res_cache_${cleanNik}`);
      if (cachedStr) {
        const cachedRes = JSON.parse(cachedStr) as Resident;
        residentMemoryCache.set(cleanNik, cachedRes);
        return cachedRes;
      }

      const localStr = localStorage.getItem(`res_lcache_${cleanNik}`);
      if (localStr) {
        const parsed = JSON.parse(localStr) as { data: Resident; ts: number };
        if (parsed?.data && Date.now() - (parsed.ts || 0) < RESIDENT_LOCAL_TTL_MS) {
          residentMemoryCache.set(cleanNik, parsed.data);
          sessionStorage.setItem(`res_cache_${cleanNik}`, JSON.stringify(parsed.data));
          return parsed.data;
        }
      }

      const nfSession = sessionStorage.getItem(`res_nf_${cleanNik}`);
      if (nfSession && Date.now() - Number(nfSession) < NOT_FOUND_TTL_MS) {
        residentNotFoundCache.set(cleanNik, Number(nfSession));
        return null;
      }
    } catch {
      // Pass
    }
  }

  // 4. Deduplikasi request yang sedang berjalan untuk NIK yang sama
  if (inFlightNikRequests.has(cleanNik)) {
    return inFlightNikRequests.get(cleanNik)!;
  }

  // 5. Panggil Firestore getDoc (Hanya 1 Read langsung ke Document ID = NIK)
  const fetchPromise = (async () => {
    try {
      const docRef = doc(db, 'residents', cleanNik);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const resident = { id: docSnap.id, ...docSnap.data() } as Resident;
        cacheResident(resident);
        return resident;
      }

      // Simpan ke Negative Cache agar tidak memicu Read berulang jika re-render
      const now = Date.now();
      residentNotFoundCache.set(cleanNik, now);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(`res_nf_${cleanNik}`, String(now));
        } catch {
          // Ignore
        }
      }
      return null;
    } catch (error: any) {
      console.error("Error fetching resident by NIK:", error);
      throw error;
    } finally {
      inFlightNikRequests.delete(cleanNik);
    }
  })();

  inFlightNikRequests.set(cleanNik, fetchPromise);
  return fetchPromise;
};

/**
 * MENCARI SELURUH ANGGOTA KELUARGA BERDASARKAN NOMOR KK (noKk) DENGAN CACHE KK
 * - Cek kk-cache terlebih dahulu (0 Read jika sudah pernah dibuka di sesi ini)
 */
export const getResidentsByKk = async (db: Firestore, noKk: string): Promise<Resident[]> => {
  if (!noKk || !db) return [];
  const cleanKk = String(noKk).trim();
  if (!cleanKk) return [];

  // 1. Cek Cache KK terlebih dahulu (0 Read!)
  const cachedMembers = getCachedKkMembers(cleanKk);
  if (cachedMembers && cachedMembers.length > 0) {
    cachedMembers.forEach((m) => cacheResident(m));
    return cachedMembers;
  }

  try {
    const residentsRef = collection(db, 'residents');
    const q = query(residentsRef, where('noKk', '==', cleanKk), limit(20));
    const snapshot = await getDocs(q);
    const results: Resident[] = [];
    snapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Resident;
        cacheResident(data);
        results.push(data);
      }
    });

    // Fallback HANYA jika field 'noKk' benar-benar kosong (untuk data lama 'no_kk')
    if (results.length === 0) {
      try {
        const qLegacy = query(residentsRef, where('no_kk', '==', cleanKk), limit(20));
        const legacySnap = await getDocs(qLegacy);
        legacySnap.forEach((docSnap) => {
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() } as Resident;
            cacheResident(data);
            results.push(data);
          }
        });
      } catch {
        // Abaikan jika index belum ada
      }
    }

    if (results.length > 0) {
      cacheKkMembers(cleanKk, results);
    }

    return results;
  } catch (error: any) {
    console.error("Error fetching residents by KK:", error);
    return [];
  }
};

/**
 * PENCARIAN PENDUDUK HEMAT KUOTA (QUOTA-SAFE SEARCH)
 * Menggantikan praktek buruk `limit(300)` atau `limit(50)` tanpa filter yang membakar ratusan Read!
 * - Menggunakan Cache Pencarian In-Memory (0 Read untuk ketikan berulang)
 * - Jika 16 digit: Cek `getResidentByNik` (1 Read); hanya jika bukan NIK, cek `getResidentsByKk`
 * - Jika 3-15 digit: Prefix query pada field `nik` dengan `limit(maxLimit)`
 * - Jika >= 3 huruf: Prefix query pada field `fullName` (UPPERCASE) dengan `limit(maxLimit)`
 */
export const searchResidentsQuotaSafe = async (
  db: Firestore,
  rawTerm: string,
  maxLimit: number = 10
): Promise<Resident[]> => {
  if (!db || !rawTerm) return [];
  const trimmed = rawTerm.trim();
  if (trimmed.length < 3) return [];

  const cacheKey = `${trimmed.toUpperCase()}__${maxLimit}`;
  const cached = residentSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS) {
    return cached.data;
  }

  // Cek apakah di Memory Cache sudah ada kecocokan langsung jika 16 digit
  const cleanDigits = trimmed.replace(/\D/g, '');
  const isDigitsOnly = /^\d+$/.test(trimmed.replace(/\s+/g, ''));
  const resultsMap = new Map<string, Resident>();

  try {
    const residentsRef = collection(db, 'residents');

    if (isDigitsOnly && cleanDigits.length === 16) {
      // 1. Coba direct lookup NIK (0 Read jika di cache, 1 Read jika di Firestore)
      const directRes = await getResidentByNik(db, cleanDigits);
      if (directRes) {
        resultsMap.set(directRes.nik || directRes.id, directRes);
      } else {
        // 2. Hanya jika bukan NIK, cari sebagai Nomor KK
        const kkMembers = await getResidentsByKk(db, cleanDigits);
        kkMembers.forEach((m) => resultsMap.set(m.nik || m.id, m));
      }
    } else if (isDigitsOnly && cleanDigits.length >= 3) {
      // Prefix query NIK (maksimal maxLimit dokumen)
      const qNik = query(
        residentsRef,
        where('nik', '>=', cleanDigits),
        where('nik', '<=', cleanDigits + '\uf8ff'),
        limit(maxLimit)
      );
      const snap = await getDocs(qNik);
      snap.forEach((docSnap) => {
        if (docSnap.exists()) {
          const r = { id: docSnap.id, ...docSnap.data() } as Resident;
          cacheResident(r);
          resultsMap.set(r.nik || r.id, r);
        }
      });
    } else {
      // Prefix query Nama (UPPERCASE sesuai standar database penduduk)
      const upperTerm = trimmed.toUpperCase();
      const qName = query(
        residentsRef,
        orderBy('fullName'),
        where('fullName', '>=', upperTerm),
        where('fullName', '<=', upperTerm + '\uf8ff'),
        limit(maxLimit)
      );
      const snap = await getDocs(qName);
      snap.forEach((docSnap) => {
        if (docSnap.exists()) {
          const r = { id: docSnap.id, ...docSnap.data() } as Resident;
          cacheResident(r);
          resultsMap.set(r.nik || r.id, r);
        }
      });
    }

    const finalResults = Array.from(resultsMap.values());
    residentSearchCache.set(cacheKey, { data: finalResults, timestamp: Date.now() });
    return finalResults;
  } catch (error) {
    console.error("Error in searchResidentsQuotaSafe:", error);
    return [];
  }
};

/**
 * SEED DATA TESTING
 */
export const seedResidents = async (db: Firestore) => {
  const batch = writeBatch(db);
  const residentsRef = collection(db, 'residents');

  const testData = [
    {
      nik: "3301010101010001",
      noKk: "3301010101018888",
      fullName: "BUDI SANTOSO",
      gender: "Laki-laki",
      dateOfBirth: "12-05-1985",
      age: "39",
      placeOfBirth: "Cilacap",
      address: "Jl. Mawar No. 12, Sampeldes",
      rt: "001",
      rw: "002",
      kelurahan: "Sampeldes",
      relationshipToHeadOfFamily: "KEPALA KELUARGA",
      maritalStatus: "KAWIN",
      educationLevel: "SLTA / Sederajat",
      religion: "Islam",
      occupation: "Wiraswasta",
      bloodType: "O",
      hasBirthCertificate: "ADA",
      birthCertificateNumber: "12345/DISDUK/2010",
      hasMarriageCertificate: "ADA",
      marriageCertificateNumber: "987/KUA/2012",
      hasDivorceCertificate: "TIDAK",
      divorceCertificateNumber: "-",
      fatherName: "SUTRISNO",
      motherName: "SITI AMINAH"
    },
    {
      nik: "3301010101010002",
      noKk: "3301010101018888",
      fullName: "ANI WIDAYATI",
      gender: "Perempuan",
      dateOfBirth: "20-08-1988",
      age: "34",
      placeOfBirth: "Cilacap",
      address: "Jl. Mawar No. 12, Sampeldes",
      rt: "001",
      rw: "002",
      kelurahan: "Sampeldes",
      relationshipToHeadOfFamily: "ISTRI",
      maritalStatus: "KAWIN",
      educationLevel: "SLTA / Sederajat",
      religion: "Islam",
      occupation: "Ibu Rumah Tangga (IRT)",
      bloodType: "A",
      hasBirthCertificate: "ADA",
      birthCertificateNumber: "55432/DISDUK/2011",
      hasMarriageCertificate: "ADA",
      marriageCertificateNumber: "987/KUA/2012",
      hasDivorceCertificate: "TIDAK",
      divorceCertificateNumber: "-",
      fatherName: "KARTONO",
      motherName: "SUMIATI"
    }
  ];

  testData.forEach(data => {
    const docRef = doc(residentsRef, data.nik);
    batch.set(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit();
};

/**
 * MENGHITUNG STATISTIK KELOMPOK
 */
export function calculateStatsForGroup(residents: any[]) {
  const total = residents.length;
  const kkSet = new Set(residents.map(r => r.noKk).filter(Boolean));

  const maleCount = residents.filter(r => {
    const g = (r.gender || '').toLowerCase().trim();
    return g.startsWith('l') || g.includes('laki');
  }).length;

  const femaleCount = residents.filter(r => {
    const g = (r.gender || '').toLowerCase().trim();
    return g.startsWith('p') || g.startsWith('w') || g.includes('perempuan') || g.includes('wanita');
  }).length;

  const otherCount = Math.max(0, total - maleCount - femaleCount);

  const malePercent = total > 0 ? Math.round((maleCount / total) * 100) : 0;
  const femalePercent = total > 0 ? Math.round((femaleCount / total) * 100) : 0;

  // Kelompok Umur
  const ageGroups = [
    { name: 'Anak (0-14)', value: 0 },
    { name: 'Produktif (15-64)', value: 0 },
    { name: 'Lansia (65+)', value: 0 },
  ];

  // Pendidikan
  const eduMap: Record<string, number> = { 'SD': 0, 'SMP': 0, 'SMA': 0, 'Diploma/Sarjana': 0, 'Lainnya': 0 };

  // Pekerjaan
  const jobMap: Record<string, number> = { 'Petani': 0, 'Buruh': 0, 'Swasta': 0, 'Pelajar': 0, 'PNS/TNI': 0, 'Lainnya': 0 };

  // Sebaran RW
  const rwMap: Record<string, number> = {};

  // Sebaran RT
  const rtMap: Record<string, number> = {};

  residents.forEach(r => {
    // Kelompok Umur
    const age = parseInt(r.age || '0');
    if (age <= 14) ageGroups[0].value++;
    else if (age <= 64) ageGroups[1].value++;
    else ageGroups[2].value++;

    // Pendidikan
    const edu = (r.educationLevel || '').toUpperCase();
    if (edu.includes('SD')) eduMap['SD']++;
    else if (edu.includes('SMP')) eduMap['SMP']++;
    else if (edu.includes('SMA') || edu.includes('SLTA')) eduMap['SMA']++;
    else if (edu.includes('SARJANA') || edu.includes('DIPLOMA') || edu.includes('S1') || edu.includes('S2') || edu.includes('S3')) eduMap['Diploma/Sarjana']++;
    else eduMap['Lainnya']++;

    // Pekerjaan
    const job = (r.occupation || '').toUpperCase();
    if (job.includes('TANI')) jobMap['Petani']++;
    else if (job.includes('BURUH')) jobMap['Buruh']++;
    else if (job.includes('SWASTA') || job.includes('KARYAWAN') || job.includes('WIRASWASTA')) jobMap['Swasta']++;
    else if (job.includes('PELAJAR') || job.includes('MAHASISWA')) jobMap['Pelajar']++;
    else if (job.includes('PNS') || job.includes('TNI') || job.includes('POLRI') || job.includes('PEGAWAI')) jobMap['PNS/TNI']++;
    else jobMap['Lainnya']++;

    // RW
    const rwRaw = String(r.rw || '').trim();
    const rw = rwRaw ? `RW ${rwRaw.padStart(2, '0')}` : 'N/A';
    rwMap[rw] = (rwMap[rw] || 0) + 1;

    // RT
    const rtRaw = String(r.rt || '').trim();
    const rt = rtRaw ? rtRaw.padStart(3, '0') : 'N/A';
    rtMap[rt] = (rtMap[rt] || 0) + 1;
  });

  return {
    total,
    totalKK: kkSet.size,
    malePercent,
    femalePercent,
    maleCount,
    femaleCount,
    otherCount,
    ageData: ageGroups,
    eduData: Object.entries(eduMap).map(([name, value]) => ({ name, value })),
    jobData: Object.entries(jobMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    rwData: Object.entries(rwMap).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name)),
    rtData: Object.entries(rtMap).map(([name, value]) => ({ rt: name, count: value })).sort((a, b) => a.rt.localeCompare(b.rt)),
  };
}

/**
 * MENYIMPAN STATISTIK DARI ARRAY PENDUDUK DI MEMORI (0 READ FIRESTORE!)
 * Digunakan saat Import Excel agar tidak membaca ulang ribuan dokumen dari Firestore.
 */
export const saveCalculatedStatisticsFromList = async (db: Firestore, residents: any[]): Promise<any> => {
  const rootStats = calculateStatsForGroup(residents);

  const dusunNames = ["Dusun I", "Dusun II", "Dusun III", "Dusun IV"];
  const dusunData: Record<string, any> = {};

  dusunNames.forEach(dusun => {
    const filtered = residents.filter(r => (r.address || '').toUpperCase().includes(dusun.toUpperCase()));
    dusunData[dusun] = calculateStatsForGroup(filtered);
  });

  const finalStats = {
    ...rootStats,
    dusunData,
    updatedAt: serverTimestamp(),
  };

  const docRef = doc(db, 'villageProfile', 'statistics');
  await setDoc(docRef, finalStats, { merge: true });
  invalidateDocCache('villageProfile/statistics');

  return finalStats;
};

/**
 * UPDATE JUMLAH TOTAL PENDUDUK HEMAT KUOTA (HANYA 1 AGGREGATION READ!)
 * Digunakan saat Tambah / Edit / Hapus 1 penduduk agar TIDAK melakukan full-scan 10.000 dokumen!
 * Menghemat 9.999 Read setiap kali ada perubahan 1 data penduduk.
 */
export const updateStatisticsCountOnly = async (db: Firestore): Promise<void> => {
  try {
    const residentsCol = collection(db, 'residents');
    const countSnap = await getCountFromServer(residentsCol);
    const total = countSnap.data().count;

    const docRef = doc(db, 'villageProfile', 'statistics');
    await setDoc(
      docRef,
      {
        total,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    invalidateDocCache('villageProfile/statistics');
  } catch (error) {
    console.warn("Gagal update agregasi total penduduk:", error);
  }
};

/**
 * HITUNG ULANG STATISTIK KEPENDUDUKAN LENGKAP & SIMPAN KE DOCUMENT
 * PERINGATAN KUOTA: Fungsi ini membaca seluruh dokumen di koleksi `residents`.
 * HANYA BOLEH DIPANGGIL secara manual melalui tombol "Sinkronisasi Penuh Statistik" oleh Admin!
 */
export const recalculateStatistics = async (db: Firestore): Promise<any> => {
  try {
    const residentsCol = collection(db, 'residents');
    const snapshot = await getDocs(residentsCol);
    const residents: any[] = [];
    snapshot.forEach(docSnap => {
      residents.push({ id: docSnap.id, ...docSnap.data() });
    });

    return await saveCalculatedStatisticsFromList(db, residents);
  } catch (error) {
    console.error("Error recalculating statistics:", error);
    throw error;
  }
};
