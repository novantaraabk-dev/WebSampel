import { Firestore, collection, getDocs, doc, setDoc, updateDoc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { LetterSubmission } from './types';
import { SEED_PERMOHONAN_SURAT, PermohonanSuratItem } from './permohonan-surat-data';
import { format } from 'date-fns';
import { invalidateCollectionCache } from '@/firebase/firestore/use-collection';
import { getCachedVillageIdentity } from './village-identity';

// Cache In-Memory untuk pengaturan_permohonan_surat agar tidak membaca seluruh koleksi berulang kali
let cachedPengaturanSurat: PermohonanSuratItem[] | null = null;
let cachedPengaturanTimestamp = 0;
const PENGATURAN_CACHE_TTL = 30 * 60 * 1000; // 30 Menit

/**
 * Normalisasi string teks untuk pencocokan toleran
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * 1. Ambil Kode Surat berdasarkan Jenis Surat dari Seed Data atau Cache Firestore
 * Sesuai dengan konfigurasi di /admin/settings?tab=register-surat - Permohonan Surat
 */
export async function getKodeSuratByJenis(
  firestore: Firestore | null,
  letterType: string
): Promise<{ kodeSurat: string; matchedItem?: PermohonanSuratItem }> {
  const fallbackItem = SEED_PERMOHONAN_SURAT.find(
    (item) => normalizeText(item.jenisSurat) === normalizeText(letterType)
  ) || SEED_PERMOHONAN_SURAT.find(
    (item) =>
      item.jenisSurat.toLowerCase().includes(letterType.toLowerCase()) ||
      letterType.toLowerCase().includes(item.jenisSurat.toLowerCase())
  );

  // HEMAT KUOTA: Jika sudah cocok persis di SEED_PERMOHONAN_SURAT lokal (0 Read!), gunakan langsung kecuali sudah ada di cache memori
  if (!firestore || (fallbackItem && !cachedPengaturanSurat)) {
    return {
      kodeSurat: fallbackItem ? fallbackItem.kodeSurat : '400.7.22.1',
      matchedItem: fallbackItem,
    };
  }

  try {
    let remoteItems: PermohonanSuratItem[] = [];
    if (cachedPengaturanSurat && Date.now() - cachedPengaturanTimestamp < PENGATURAN_CACHE_TTL) {
      remoteItems = cachedPengaturanSurat;
    } else {
      const colRef = collection(firestore, 'pengaturan_permohonan_surat');
      const snap = await getDocs(query(colRef, limit(50)));
      remoteItems = snap.docs.map((d) => d.data() as PermohonanSuratItem);
      cachedPengaturanSurat = remoteItems;
      cachedPengaturanTimestamp = Date.now();
    }

    if (remoteItems.length > 0) {

      // 1. Exact match
      let found = remoteItems.find(
        (item) => (item.jenisSurat || '').trim().toLowerCase() === letterType.trim().toLowerCase()
      );

      // 2. Normalized match
      if (!found) {
        found = remoteItems.find(
          (item) => normalizeText(item.jenisSurat || '') === normalizeText(letterType)
        );
      }

      // 3. Partial / contains match
      if (!found) {
        found = remoteItems.find(
          (item) =>
            (item.jenisSurat || '').toLowerCase().includes(letterType.toLowerCase()) ||
            letterType.toLowerCase().includes((item.jenisSurat || '').toLowerCase())
        );
      }

      if (found && found.kodeSurat) {
        return { kodeSurat: found.kodeSurat.trim(), matchedItem: found };
      }
    }
  } catch (err) {
    console.warn('Gagal membaca pengaturan_permohonan_surat dari Firestore, fallback ke seed:', err);
  }

  return {
    kodeSurat: fallbackItem ? fallbackItem.kodeSurat : '400.7.22.1',
    matchedItem: fallbackItem,
  };
}

/**
 * 2. Ambil Nomor Urut Surat Keluar Terakhir dari Buku Agenda
 * Sesuai data di /admin/settings?tab=register-surat - Surat Keluar
 */
export async function getNextSuratKeluarSeq(
  firestore: Firestore | null
): Promise<{ nextSeq: number; nextSeqStr: string; lastNomor: string | null }> {
  const currentYear = new Date().getFullYear();

  if (!firestore) {
    return { nextSeq: 1, nextSeqStr: '001', lastNomor: null };
  }

  try {
    // HEMAT KUOTA: Batasi limit(25) dokumen surat_keluar agar tidak membaca seluruh arsip tahunan!
    const q = query(
      collection(firestore, 'buku_agenda'),
      where('kategori', '==', 'surat_keluar'),
      limit(25)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return { nextSeq: 1, nextSeqStr: '001', lastNomor: null };
    }

    let maxSeq = 0;
    let mostRecentNomor: string | null = null;
    let latestTime = 0;

    snap.docs.forEach((d) => {
      const data = d.data();
      const nomorStr = String(data.nomor || '').trim();
      const createdAt = data.createdAt ? new Date(data.createdAt).getTime() : 0;

      if (createdAt > latestTime) {
        latestTime = createdAt;
        mostRecentNomor = nomorStr;
      }

      if (!nomorStr) return;

      // Cek apakah nomor mengandung format standard:
      // Format baru: KODE/no urut/bulan/tahun (contoh: 400.12.2.2/002/X/2026) -> parts[1] adalah no urut
      // Format lama: no urut/KODE/bulan/tahun (contoh: 002/400.12.2.2/X/2026) -> parts[0] adalah no urut
      const parts = nomorStr.split('/');
      let parsedCandidate = 0;

      if (parts.length >= 3) {
        // Cek bagian kedua (format standar KODE/no urut/bulan/tahun)
        const seqPart1 = parseInt(parts[1], 10);
        if (!isNaN(seqPart1) && seqPart1 > 0 && seqPart1 < 100000 && !parts[1].includes('.')) {
          parsedCandidate = seqPart1;
        } else {
          // Cek bagian pertama jika format terbalik no urut/KODE/...
          const seqPart0 = parseInt(parts[0], 10);
          if (!isNaN(seqPart0) && seqPart0 > 0 && seqPart0 < 100000 && !parts[0].includes('.')) {
            parsedCandidate = seqPart0;
          }
        }
      }

      // Fallback jika bukan format standar dengan slash
      if (parsedCandidate === 0) {
        // Cari angka berurutan di nomor surat yang bukan tahun
        const matches = nomorStr.match(/\b\d{1,5}\b/g);
        if (matches) {
          for (const m of matches) {
            const num = parseInt(m, 10);
            if (num !== currentYear && num !== 2011 && num !== 11 && num > 0 && num < 100000) {
              parsedCandidate = Math.max(parsedCandidate, num);
            }
          }
        }
      }

      if (parsedCandidate > maxSeq) {
        maxSeq = parsedCandidate;
      }
    });

    const nextSeq = maxSeq + 1;
    const nextSeqStr = String(nextSeq).padStart(3, '0');

    return {
      nextSeq,
      nextSeqStr,
      lastNomor: mostRecentNomor,
    };
  } catch (err) {
    console.warn('Gagal membaca buku_agenda surat_keluar:', err);
    return { nextSeq: 1, nextSeqStr: '001', lastNomor: null };
  }
}

export const BULAN_ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export interface GeneratedNomorSuratResult {
  kodeSurat: string;
  nextSeq: number;
  nextSeqStr: string;
  kodeDesa: string;
  bulanRomawi: string;
  tahun: string;
  formattedNumber: string;
  lastNomor: string | null;
  matchedJenisSurat?: string;
}

/**
 * 3. Tarik & Hitung Nomor Surat Otomatis Lengkap
 * Format: KODE KLASIFIKASI / no urut / bulan / tahun
 * Contoh: 400.12.2.2/002/X/2026
 */
export async function tarikNomorSuratOtomatis(
  firestore: Firestore | null,
  letterType: string
): Promise<GeneratedNomorSuratResult> {
  const { kodeSurat, matchedItem } = await getKodeSuratByJenis(firestore, letterType);
  const { nextSeq, nextSeqStr, lastNomor } = await getNextSuratKeluarSeq(firestore);

  const now = new Date();
  const bulanRomawi = BULAN_ROMAWI[now.getMonth()];
  const tahun = now.getFullYear().toString();
  const kodeDesa = getCachedVillageIdentity().kodeSuratDesa || '10';

  // Format baku sesuai instruksi: KODE KLASIFIKASI/no urut/bulan/tahun
  // Contoh: 400.12.2.2/002/X/2026
  const formattedNumber = `${kodeSurat}/${nextSeqStr}/${bulanRomawi}/${tahun}`;

  return {
    kodeSurat,
    nextSeq,
    nextSeqStr,
    kodeDesa,
    bulanRomawi,
    tahun,
    formattedNumber,
    lastNomor,
    matchedJenisSurat: matchedItem?.jenisSurat,
  };
}

/**
 * 4. Simpan Nomor Surat ke Pengajuan DAN Otomatis Catat ke Buku Agenda Surat Keluar
 */
export async function simpanNomorSuratDanAgenda(
  firestore: Firestore,
  params: {
    submission: LetterSubmission;
    finalNumber: string;
    userId?: string;
  }
): Promise<{ success: boolean; nomor: string; agendaId: string }> {
  const { submission, finalNumber, userId } = params;

  // 1. Simpan ke Pengajuan (letterRequests & submissions)
  try {
    const lrRef = doc(firestore, 'letterRequests', submission.id);
    await updateDoc(lrRef, {
      documentNumber: finalNumber,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    try {
      const subRef = doc(firestore, 'submissions', submission.id);
      await updateDoc(subRef, {
        documentNumber: finalNumber,
        updatedAt: serverTimestamp(),
      });
    } catch (innerErr) {
      console.warn('Gagal update ke submissions:', innerErr);
    }
  }

  // 2. Simpan juga otomatis ke Buku Agenda Surat Keluar
  const agendaId = doc(collection(firestore, 'buku_agenda')).id;
  const perihal = `${submission.letterType} - a.n. ${submission.requesterName}${submission.nik ? ` (NIK: ${submission.nik})` : ''}`;

  await setDoc(doc(firestore, 'buku_agenda', agendaId), {
    id: agendaId,
    kategori: 'surat_keluar',
    nomor: finalNumber,
    perihal,
    tanggal: format(new Date(), 'yyyy-MM-dd'),
    userId: userId || 'admin',
    createdAt: new Date().toISOString(),
    submissionId: submission.id,
    ticketNumber: submission.ticketNumber || '',
  });

  invalidateCollectionCache('letterRequests');
  invalidateCollectionCache('buku_agenda');

  return { success: true, nomor: finalNumber, agendaId };
}
