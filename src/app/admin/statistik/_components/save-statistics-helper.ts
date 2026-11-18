import { Firestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { VillageStatisticsData } from '@/lib/types';

export interface SaveStatisticsParams {
  firestore: Firestore;
  tab: string;
  action: string;
  summary: string;
  partialData: Partial<VillageStatisticsData>;
  author?: string;
}

/**
 * Menyimpan data statistik ke dokumen 'villageProfile/statistics'
 * dan mencatat rekaman histori perubahan ke koleksi 'statisticsHistory'
 */
export async function saveStatisticsWithHistory({
  firestore,
  tab,
  action,
  summary,
  partialData,
  author = 'Administrator Desa',
}: SaveStatisticsParams): Promise<Record<string, any>> {
  if (!firestore) {
    throw new Error('Koneksi database Firestore tidak tersedia');
  }

  const statsDocRef = doc(firestore, 'villageProfile', 'statistics');

  // 1. Ambil data saat ini untuk menjaga keutuhan data (non-destructive merge)
  let existingData: Record<string, any> = {};
  try {
    const snap = await getDoc(statsDocRef);
    if (snap.exists()) {
      existingData = snap.data();
    }
  } catch (err) {
    console.warn('Gagal membaca data statistik eksisting sebelum merge:', err);
  }

  // 2. Gabungkan data baru ke data lama
  const mergedData: Record<string, any> = {
    ...existingData,
    ...partialData,
  };

  // Pastikan sub-objek tergabung rapi
  if (partialData.sidebarInfo) {
    mergedData.sidebarInfo = {
      ...(existingData.sidebarInfo || {}),
      ...partialData.sidebarInfo,
    };
  }
  if (partialData.pendidikan) {
    mergedData.pendidikan = {
      ...(existingData.pendidikan || {}),
      ...partialData.pendidikan,
    };
  }
  if (partialData.kesehatan) {
    mergedData.kesehatan = {
      ...(existingData.kesehatan || {}),
      ...partialData.kesehatan,
    };
  }
  if (partialData.ekonomi) {
    mergedData.ekonomi = {
      ...(existingData.ekonomi || {}),
      ...partialData.ekonomi,
    };
  }
  if (partialData.pembangunan) {
    mergedData.pembangunan = {
      ...(existingData.pembangunan || {}),
      ...partialData.pembangunan,
    };
  }
  if (partialData.sdgs) {
    mergedData.sdgs = {
      ...(existingData.sdgs || {}),
      ...partialData.sdgs,
    };
  }
  if (partialData.indeks) {
    mergedData.indeks = {
      ...(existingData.indeks || {}),
      ...partialData.indeks,
    };
  }

  // 3. Simpan ke 'villageProfile/statistics'
  await setDoc(
    statsDocRef,
    {
      ...mergedData,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // 4. Sinkronkan nilai ringkasan wilayah jika diubah (juga disimpan di villageProfile/default untuk konsistensi seluruh web)
  try {
    const profileDefaultRef = doc(firestore, 'villageProfile', 'default');
    const syncProfile: Record<string, any> = {};
    if (partialData.total) syncProfile.totalPenduduk = partialData.total;
    if (partialData.density) syncProfile.kepadatanPenduduk = partialData.density;
    if (partialData.sexRatio) syncProfile.rasioJenisKelamin = partialData.sexRatio;
    if (partialData.sidebarInfo?.luasWilayah) syncProfile.luasWilayah = partialData.sidebarInfo.luasWilayah;
    if (partialData.sidebarInfo?.totalPenduduk) syncProfile.totalPenduduk = partialData.sidebarInfo.totalPenduduk;
    if (partialData.sidebarInfo?.kepadatan) syncProfile.kepadatanPenduduk = partialData.sidebarInfo.kepadatan;
    if (partialData.sidebarInfo?.rasioJenisKelamin) syncProfile.rasioJenisKelamin = partialData.sidebarInfo.rasioJenisKelamin;
    if (partialData.sidebarInfo?.jarakKecamatan) syncProfile.jarakKecamatan = partialData.sidebarInfo.jarakKecamatan;
    if (partialData.sidebarInfo?.jarakKabupaten) syncProfile.jarakKabupaten = partialData.sidebarInfo.jarakKabupaten;

    if (Object.keys(syncProfile).length > 0) {
      await setDoc(profileDefaultRef, { ...syncProfile, updatedAt: serverTimestamp() }, { merge: true });
    }
  } catch (syncErr) {
    console.warn('Gagal sinkronisasi data statistik ke villageProfile/default:', syncErr);
  }

  // 5. Catat riwayat perubahan ke 'statisticsHistory'
  try {
    const historyCol = collection(firestore, 'statisticsHistory');
    await addDoc(historyCol, {
      tab,
      action,
      summary,
      author,
      timestamp: serverTimestamp(),
      snapshotData: mergedData,
    });
  } catch (histErr) {
    console.error('Gagal mencatat histori perubahan statistik:', histErr);
  }

  return mergedData;
}
