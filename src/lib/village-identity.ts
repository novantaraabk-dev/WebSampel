'use client';

import { useEffect, useMemo, useState } from 'react';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';

export interface VillageIdentityInfo {
  // 1. Identitas Desa
  namaDesa: string;
  sebutanDesa: string;
  kodeDesa: string;
  kodeSuratDesa: string;
  kodePos: string;
  alamatDesa: string;
  alamatSingkatDesa: string;
  teleponDesa: string;
  whatsappSiaga: string;
  emailDesa: string;
  websiteDesa: string;
  jamLayanan: string;

  // 2. Pejabat Pemerintah Desa
  namaKepalaDesa: string;
  nipKepalaDesa: string;
  pangkatKepalaDesa: string;
  periodeKepalaDesa: string;
  namaSekretarisDesa: string;
  nipSekretarisDesa: string;
  pangkatSekretarisDesa: string;

  // 3. Kecamatan & Forkopimcam (Camat, Danramil, Kapolsek, KUA)
  namaKecamatan: string;
  sebutanKecamatan: string;
  kodeKecamatan: string;
  namaCamat: string;
  nipCamat: string;
  pangkatCamat: string;
  namaDanramil: string;
  nrpDanramil: string;
  jabatanDanramil: string;
  namaKapolsek: string;
  nrpKapolsek: string;
  jabatanKapolsek: string;
  namaKua: string;
  namaKepalaKua: string;

  // 4. Kabupaten / Kota & Provinsi
  namaKabupaten: string;
  sebutanKabupaten: string;
  kodeKabupaten: string;
  namaKadisDukcapil: string;
  nipKadisDukcapil: string;
  namaProvinsi: string;
  sebutanProvinsi: string;
  kodeProvinsi: string;

  updatedAt?: any;
}

export const VILLAGE_IDENTITY_STORAGE_KEY = 'village_identity_cache_v1';

export const DEFAULT_VILLAGE_IDENTITY: VillageIdentityInfo = {
  // 1. Identitas Desa
  namaDesa: 'Sampeldes',
  sebutanDesa: 'Desa',
  kodeDesa: '33.01.10.2010',
  kodeSuratDesa: '10',
  kodePos: '53254',
  alamatDesa:
    'Jl. Raya Sampeldes, Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, Jawa Tengah 53254',
  alamatSingkatDesa: 'Jl. Raya Sampeldes No. 01',
  teleponDesa: '0857-4714-6302',
  whatsappSiaga: '6285747146302',
  emailDesa: 'pemdes.sampeldes@gmail.com',
  websiteDesa: 'https://sampeldes.gandrungmangu.id',
  jamLayanan: 'Senin - Jumat, 08.00 - 16.00 WIB',

  // 2. Pejabat Pemerintah Desa
  namaKepalaDesa: 'TUKIMAN',
  nipKepalaDesa: '-',
  pangkatKepalaDesa: '-',
  periodeKepalaDesa: 'Periode 2019-2027',
  namaSekretarisDesa: 'PRIYO SUMARNO',
  nipSekretarisDesa: '-',
  pangkatSekretarisDesa: '-',

  // 3. Kecamatan & Forkopimcam
  namaKecamatan: 'Gandrungmangu',
  sebutanKecamatan: 'Kecamatan',
  kodeKecamatan: '33.01.10',
  namaCamat: 'FATHURROHMAN, S.STP., M.Si.',
  nipCamat: '19780410 199803 1 004',
  pangkatCamat: 'Pembina Tingkat I',
  namaDanramil: '',
  nrpDanramil: '-',
  jabatanDanramil: 'DANRAMIL 10 / GANDRUNGMANGU',
  namaKapolsek: '',
  nrpKapolsek: '-',
  jabatanKapolsek: 'KAPOLSEK GANDRUNGMANGU',
  namaKua: 'KUA Kecamatan Gandrungmangu',
  namaKepalaKua: '-',

  // 4. Kabupaten & Provinsi
  namaKabupaten: 'Cilacap',
  sebutanKabupaten: 'Kabupaten',
  kodeKabupaten: '33.01',
  namaKadisDukcapil: '',
  nipKadisDukcapil: '',
  namaProvinsi: 'Jawa Tengah',
  sebutanProvinsi: 'Provinsi',
  kodeProvinsi: '33',
};

let inMemoryIdentityCache: VillageIdentityInfo = { ...DEFAULT_VILLAGE_IDENTITY };

export function getCachedVillageIdentity(): VillageIdentityInfo {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(VILLAGE_IDENTITY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        inMemoryIdentityCache = { ...DEFAULT_VILLAGE_IDENTITY, ...parsed };
        return inMemoryIdentityCache;
      }
    } catch {
      // ignore storage errors
    }
  }
  return inMemoryIdentityCache;
}

export function setCachedVillageIdentity(data: Partial<VillageIdentityInfo>): VillageIdentityInfo {
  const merged: VillageIdentityInfo = {
    ...DEFAULT_VILLAGE_IDENTITY,
    ...Object.fromEntries(
      Object.entries(data || {}).filter(([_, v]) => v !== undefined && v !== null),
    ),
  };
  inMemoryIdentityCache = merged;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VILLAGE_IDENTITY_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // ignore storage errors
    }
  }
  return merged;
}

export function useVillageIdentity() {
  const firestore = useFirestore();
  const docRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'villageProfile', 'identitas') : null),
    [firestore],
  );

  const { data, isLoading } = useDoc<Partial<VillageIdentityInfo>>(docRef, {
    suppressGlobalError: true,
  });

  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const identity = useMemo<VillageIdentityInfo>(() => {
    if (data) {
      return {
        ...DEFAULT_VILLAGE_IDENTITY,
        ...Object.fromEntries(
          Object.entries(data).filter(([_, v]) => v !== undefined && v !== null && v !== ''),
        ),
        // Allow intentionally empty optional officials like namaDanramil / namaKapolsek
        namaDanramil: data.namaDanramil ?? DEFAULT_VILLAGE_IDENTITY.namaDanramil,
        namaKapolsek: data.namaKapolsek ?? DEFAULT_VILLAGE_IDENTITY.namaKapolsek,
        namaKadisDukcapil: data.namaKadisDukcapil ?? DEFAULT_VILLAGE_IDENTITY.namaKadisDukcapil,
        nipKadisDukcapil: data.nipKadisDukcapil ?? DEFAULT_VILLAGE_IDENTITY.nipKadisDukcapil,
      };
    }
    // Mencegah hydration mismatch: hanya baca cache localStorage setelah komponen termount di client
    if (isClientMounted) {
      return getCachedVillageIdentity();
    }
    return DEFAULT_VILLAGE_IDENTITY;
  }, [data, isClientMounted]);

  useEffect(() => {
    if (data) {
      setCachedVillageIdentity(identity);
    }
  }, [data, identity]);

  return {
    identity,
    isLoading,
    docRef,
  };
}

/**
 * Mengganti teks statis bawaan (Sampeldes, Gandrungmangu, Cilacap, Jawa Tengah, TUKIMAN, dll.)
 * pada elemen DOM cetak apabila Admin mengubah Identitas Desa di `/admin/settings`.
 */
export function syncPrintElementWithVillageIdentity(
  rootEl: HTMLElement | null,
  identity: VillageIdentityInfo,
) {
  if (!rootEl) return;

  const replacements: Array<[RegExp, string]> = [];

  if (identity.namaKepalaDesa && identity.namaKepalaDesa !== 'TUKIMAN') {
    replacements.push([/TUKIMAN/g, identity.namaKepalaDesa.toUpperCase()]);
    replacements.push([/TUKIMAN/g, identity.namaKepalaDesa]);
  }
  if (identity.namaSekretarisDesa && identity.namaSekretarisDesa !== 'PRIYO SUMARNO') {
    replacements.push([/PRIYO SUMARNO/g, identity.namaSekretarisDesa.toUpperCase()]);
    replacements.push([/TM\.\s*DEWI ARUM HASANAH/gi, identity.namaSekretarisDesa.toUpperCase()]);
  }
  if (identity.namaDesa && identity.namaDesa.toLowerCase() !== 'sampeldes') {
    replacements.push([/SAMPELDES/g, identity.namaDesa.toUpperCase()]);
    replacements.push([/Sampeldes/g, identity.namaDesa]);
  }
  if (identity.namaKecamatan && identity.namaKecamatan.toLowerCase() !== 'gandrungmangu') {
    replacements.push([/GANDRUNGMANGU/g, identity.namaKecamatan.toUpperCase()]);
    replacements.push([/Gandrungmangu/g, identity.namaKecamatan]);
  }
  if (identity.namaKabupaten && identity.namaKabupaten.toLowerCase() !== 'cilacap') {
    replacements.push([/CILACAP/g, identity.namaKabupaten.toUpperCase()]);
    replacements.push([/Cilacap/g, identity.namaKabupaten]);
  }
  if (identity.namaProvinsi && identity.namaProvinsi.toLowerCase() !== 'jawa tengah') {
    replacements.push([/JAWA TENGAH/g, identity.namaProvinsi.toUpperCase()]);
    replacements.push([/Jawa Tengah/g, identity.namaProvinsi]);
  }

  if (replacements.length === 0) return;

  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    if (node.nodeValue && node.nodeValue.trim().length > 0) {
      let nextVal = node.nodeValue;
      for (const [regex, target] of replacements) {
        nextVal = nextVal.replace(regex, target);
      }
      if (nextVal !== node.nodeValue) {
        node.nodeValue = nextVal;
      }
    }
    node = walker.nextNode();
  }
}

