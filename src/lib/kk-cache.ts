import { Family, Resident } from '@/lib/types';

const KK_FAMILIES_CACHE_KEY = 'bulusari_families_master_v1';
const KK_TIMESTAMP_KEY = 'bulusari_families_timestamp_v1';
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000; // 12 Jam

// 1. In-Memory Cache untuk Anggota KK (0 Read saat beralih antara Daftar Anggota & Salinan KK)
const inMemoryMembersCache = new Map<string, Resident[]>();

export function getCachedKkMembers(noKk: string): Resident[] | null {
  if (!noKk) return null;
  const cleanKk = String(noKk).trim();

  // Cek Memory
  if (inMemoryMembersCache.has(cleanKk)) {
    return inMemoryMembersCache.get(cleanKk)!;
  }

  // Cek SessionStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`kk_members_${cleanKk}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Resident[];
        inMemoryMembersCache.set(cleanKk, parsed);
        return parsed;
      }
    } catch {
      // Ignore storage errors
    }
  }

  return null;
}

export function cacheKkMembers(noKk: string, members: Resident[]): void {
  if (!noKk || !members) return;
  const cleanKk = String(noKk).trim();
  inMemoryMembersCache.set(cleanKk, members);

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`kk_members_${cleanKk}`, JSON.stringify(members));
    } catch {
      // Ignore storage quota errors
    }
  }
}

export function invalidateKkMembers(noKk: string): void {
  if (!noKk) return;
  const cleanKk = String(noKk).trim();
  inMemoryMembersCache.delete(cleanKk);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(`kk_members_${cleanKk}`);
    } catch {
      // Ignore
    }
  }
}

// 2. Persistent Storage untuk Daftar Master Kartu Keluarga
export function getStoredFamilies(): Family[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const timestampStr = localStorage.getItem(KK_TIMESTAMP_KEY);
    if (!timestampStr) return null;

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();

    // Jika cache sudah lebih dari 12 jam, anggap kadaluarsa
    if (now - timestamp > DEFAULT_TTL_MS) {
      return null;
    }

    const dataStr = localStorage.getItem(KK_FAMILIES_CACHE_KEY);
    if (!dataStr) return null;

    return JSON.parse(dataStr) as Family[];
  } catch (error) {
    console.warn('Error reading families from localStorage cache:', error);
    return null;
  }
}

export function saveStoredFamilies(families: Family[]): void {
  if (typeof window === 'undefined' || !families || families.length === 0) return;

  try {
    // Simpan data esensial untuk menghemat ruang LocalStorage
    const lightweightFamilies = families.map(f => ({
      id: f.id,
      noKk: f.noKk,
      kepalaKeluarga: f.kepalaKeluarga,
      nikKepala: f.nikKepala,
      genderKepala: f.genderKepala,
      alamat: f.alamat,
      dusun: f.dusun,
      rw: f.rw,
      rt: f.rt,
      jumlahAnggota: f.jumlahAnggota,
      statusKk: f.statusKk || 'KK Aktif',
      tagIdCard: f.tagIdCard || '-',
      programBantuan: f.programBantuan || '-',
      tanggalTerdaftar: f.tanggalTerdaftar || '19 Jan 2026',
    }));

    localStorage.setItem(KK_FAMILIES_CACHE_KEY, JSON.stringify(lightweightFamilies));
    localStorage.setItem(KK_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Error saving families to localStorage cache:', error);
  }
}

export function clearStoredFamilies(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KK_FAMILIES_CACHE_KEY);
    localStorage.removeItem(KK_TIMESTAMP_KEY);
    inMemoryMembersCache.clear();
  } catch {
    // Ignore
  }
}
