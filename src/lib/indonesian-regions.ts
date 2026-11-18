import { toTitleCaseIndonesian } from './opensid-surat-engine';

export interface RegionItem {
  id: string;
  name: string;
  rawName: string;
}

// 38 Provinsi Resmi Indonesia sebagai fallback instan (0ms)
export const FALLBACK_PROVINCES: RegionItem[] = [
  { id: '11', name: 'Aceh', rawName: 'ACEH' },
  { id: '12', name: 'Sumatera Utara', rawName: 'SUMATERA UTARA' },
  { id: '13', name: 'Sumatera Barat', rawName: 'SUMATERA BARAT' },
  { id: '14', name: 'Riau', rawName: 'RIAU' },
  { id: '15', name: 'Jambi', rawName: 'JAMBI' },
  { id: '16', name: 'Sumatera Selatan', rawName: 'SUMATERA SELATAN' },
  { id: '17', name: 'Bengkulu', rawName: 'BENGKULU' },
  { id: '18', name: 'Lampung', rawName: 'LAMPUNG' },
  { id: '19', name: 'Kepulauan Bangka Belitung', rawName: 'KEPULAUAN BANGKA BELITUNG' },
  { id: '21', name: 'Kepulauan Riau', rawName: 'KEPULAUAN RIAU' },
  { id: '31', name: 'DKI Jakarta', rawName: 'DKI JAKARTA' },
  { id: '32', name: 'Jawa Barat', rawName: 'JAWA BARAT' },
  { id: '33', name: 'Jawa Tengah', rawName: 'JAWA TENGAH' },
  { id: '34', name: 'DI Yogyakarta', rawName: 'DAERAH ISTIMEWA YOGYAKARTA' },
  { id: '35', name: 'Jawa Timur', rawName: 'JAWA TIMUR' },
  { id: '36', name: 'Banten', rawName: 'BANTEN' },
  { id: '51', name: 'Bali', rawName: 'BALI' },
  { id: '52', name: 'Nusa Tenggara Barat', rawName: 'NUSA TENGGARA BARAT' },
  { id: '53', name: 'Nusa Tenggara Timur', rawName: 'NUSA TENGGARA TIMUR' },
  { id: '61', name: 'Kalimantan Barat', rawName: 'KALIMANTAN BARAT' },
  { id: '62', name: 'Kalimantan Tengah', rawName: 'KALIMANTAN TENGAH' },
  { id: '63', name: 'Kalimantan Selatan', rawName: 'KALIMANTAN SELATAN' },
  { id: '64', name: 'Kalimantan Timur', rawName: 'KALIMANTAN TIMUR' },
  { id: '65', name: 'Kalimantan Utara', rawName: 'KALIMANTAN UTARA' },
  { id: '71', name: 'Sulawesi Utara', rawName: 'SULAWESI UTARA' },
  { id: '72', name: 'Sulawesi Tengah', rawName: 'SULAWESI TENGAH' },
  { id: '73', name: 'Sulawesi Selatan', rawName: 'SULAWESI SELATAN' },
  { id: '74', name: 'Sulawesi Tenggara', rawName: 'SULAWESI TENGGARA' },
  { id: '75', name: 'Gorontalo', rawName: 'GORONTALO' },
  { id: '76', name: 'Sulawesi Barat', rawName: 'SULAWESI BARAT' },
  { id: '81', name: 'Maluku', rawName: 'MALUKU' },
  { id: '82', name: 'Maluku Utara', rawName: 'MALUKU UTARA' },
  { id: '91', name: 'Papua Barat', rawName: 'PAPUA BARAT' },
  { id: '92', name: 'Papua Barat Daya', rawName: 'PAPUA BARAT DAYA' },
  { id: '93', name: 'Papua Selatan', rawName: 'PAPUA SELATAN' },
  { id: '94', name: 'Papua Tengah', rawName: 'PAPUA TENGAH' },
  { id: '95', name: 'Papua Pegunungan', rawName: 'PAPUA PEGUNUNGAN' },
  { id: '96', name: 'Papua', rawName: 'PAPUA' },
];

const memoryCache = new Map<string, RegionItem[]>();

async function fetchWithCache(url: string, cacheKey: string, fallback?: RegionItem[]): Promise<RegionItem[]> {
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`id_region_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored) as RegionItem[];
        memoryCache.set(cacheKey, parsed);
        return parsed;
      }
    } catch {
      // Ignore sessionStorage error
    }
  }

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const rawData = await res.json();
    if (Array.isArray(rawData)) {
      const formatted: RegionItem[] = rawData.map((it: any) => ({
        id: String(it.id),
        name: toTitleCaseIndonesian(it.name || ''),
        rawName: String(it.name || '').trim(),
      }));

      memoryCache.set(cacheKey, formatted);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(`id_region_${cacheKey}`, JSON.stringify(formatted));
        } catch {
          // ignore
        }
      }
      return formatted;
    }
  } catch (err) {
    console.warn(`[IndonesianRegions] Failed to fetch ${url}, using fallback if available:`, err);
  }

  if (fallback && fallback.length > 0) {
    memoryCache.set(cacheKey, fallback);
    return fallback;
  }

  return [];
}

/**
 * Mengambil daftar seluruh Provinsi di Indonesia
 */
export async function getProvinces(): Promise<RegionItem[]> {
  return fetchWithCache(
    'https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json',
    'provinces',
    FALLBACK_PROVINCES,
  );
}

/**
 * Mengambil daftar Kabupaten / Kota berdasarkan ID Provinsi
 */
export async function getRegencies(provinceId: string): Promise<RegionItem[]> {
  if (!provinceId) return [];
  return fetchWithCache(
    `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`,
    `regencies_${provinceId}`,
  );
}

/**
 * Mengambil daftar Kecamatan berdasarkan ID Kabupaten / Kota
 */
export async function getDistricts(regencyId: string): Promise<RegionItem[]> {
  if (!regencyId) return [];
  return fetchWithCache(
    `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regencyId}.json`,
    `districts_${regencyId}`,
  );
}

/**
 * Mengambil daftar Desa / Kelurahan berdasarkan ID Kecamatan
 */
export async function getVillages(districtId: string): Promise<RegionItem[]> {
  if (!districtId) return [];
  return fetchWithCache(
    `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${districtId}.json`,
    `villages_${districtId}`,
  );
}

const postalMemoryCache = new Map<string, string>();

/**
 * Mencari kode pos resmi Indonesia secara otomatis berdasarkan nama Desa, Kecamatan, Kabupaten, atau Provinsi.
 */
export async function findPostalCode(params: {
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
}): Promise<string | null> {
  const { desa, kecamatan, kabupaten } = params;
  const cleanStr = (s?: string) =>
    (s || '')
      .toLowerCase()
      .replace(/^(kabupaten|kota|kecamatan|desa|kelurahan|administrasi)\s+/i, '')
      .trim();

  const cDesa = cleanStr(desa);
  const cKec = cleanStr(kecamatan);
  const cKab = cleanStr(kabupaten);

  const cacheKey = `postal_${cDesa}_${cKec}_${cKab}`;
  if (postalMemoryCache.has(cacheKey)) {
    return postalMemoryCache.get(cacheKey)!;
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`id_${cacheKey}`);
      if (stored) {
        postalMemoryCache.set(cacheKey, stored);
        return stored;
      }
    } catch {
      // Ignore
    }
  }

  const queries = [
    [cDesa, cKec].filter(Boolean).join(' '),
    [cDesa, cKab].filter(Boolean).join(' '),
    cDesa,
    [cKec, cKab].filter(Boolean).join(' '),
    cKec,
  ].filter(Boolean);

  for (const q of queries) {
    try {
      const res = await fetch(`https://kodepos.vercel.app/search/?q=${encodeURIComponent(q)}`);
      if (!res.ok) continue;
      const json = await res.json();
      const list = json.data || [];
      if (!Array.isArray(list) || list.length === 0) continue;

      // 1. Exact match (desa + kec + kab)
      const exact = list.find((item: any) => {
        const itemDesa = cleanStr(item.village);
        const itemKec = cleanStr(item.district);
        const itemKab = cleanStr(item.regency);
        const matchDesa = !cDesa || itemDesa === cDesa;
        const matchKec = !cKec || itemKec === cKec;
        const matchKab = !cKab || itemKab.includes(cKab) || cKab.includes(itemKab);
        return matchDesa && matchKec && matchKab;
      });
      if (exact?.code) {
        const codeStr = String(exact.code);
        postalMemoryCache.set(cacheKey, codeStr);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(`id_${cacheKey}`, codeStr);
          } catch {}
        }
        return codeStr;
      }

      // 2. Match desa + kec
      const matchDesaKec = list.find((item: any) => {
        const itemDesa = cleanStr(item.village);
        const itemKec = cleanStr(item.district);
        return (!cDesa || itemDesa === cDesa) && (!cKec || itemKec === cKec);
      });
      if (matchDesaKec?.code) {
        const codeStr = String(matchDesaKec.code);
        postalMemoryCache.set(cacheKey, codeStr);
        return codeStr;
      }

      // 3. Match desa + kab
      const matchDesaKab = list.find((item: any) => {
        const itemDesa = cleanStr(item.village);
        const itemKab = cleanStr(item.regency);
        return (!cDesa || itemDesa === cDesa) && (!cKab || itemKab.includes(cKab) || cKab.includes(itemKab));
      });
      if (matchDesaKab?.code) {
        const codeStr = String(matchDesaKab.code);
        postalMemoryCache.set(cacheKey, codeStr);
        return codeStr;
      }

      // 4. Match kec + kab
      const matchKecKab = list.find((item: any) => {
        const itemKec = cleanStr(item.district);
        const itemKab = cleanStr(item.regency);
        return (!cKec || itemKec === cKec) && (!cKab || itemKab.includes(cKab) || cKab.includes(itemKab));
      });
      if (matchKecKab?.code) {
        const codeStr = String(matchKecKab.code);
        postalMemoryCache.set(cacheKey, codeStr);
        return codeStr;
      }
    } catch {
      // Continue to next query
    }
  }

  return null;
}

