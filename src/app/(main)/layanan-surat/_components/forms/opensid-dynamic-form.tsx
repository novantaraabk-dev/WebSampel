'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Users,
  Eye,
  Printer,
  Save,
  Info,
  Calendar,
  Edit3,
  RefreshCw,
  Upload,
  Phone,
  Send,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, getDoc, getDocs, query, where, limit, orderBy, getCountFromServer } from 'firebase/firestore';
import { getResidentByNik, getResidentsByKk, searchResidentsQuotaSafe } from '@/lib/residents';
import type { Resident, KopSuratInfo } from '@/lib/types';
import { useVillageIdentity } from '@/lib/village-identity';
import type { PermohonanSuratItem } from '@/lib/permohonan-surat-data';
import { addSubmission, type FileToUpload } from '@/lib/submissions';
import { GoogleFileUploader } from './form-helpers';
import { SubmissionSuccess } from '../submission-success';
import {
  OPENSID_REFERENSI_DATA,
  OPENSID_GLOBAL_SETTINGS_DEFAULT,
  OPENSID_FORMAT_NOMOR_DEFAULT,
  enrichPermohonanSuratWithOpenSid,
  normalizeFormSectionConfig,
  formatPenomoranSuratOpenSid,
  formatTanggalIndonesia,
  getNamaHariIndonesia,
  hitungMasaBerlakuTanggal,
  hitungUmurIndonesia,
  renderOpenSidDocumentPages,
  type OpenSidPersonData,
  type OpenSidRenderContext,
  type OpenSidGlobalSuratSettings,
} from '@/lib/opensid-surat-engine';

const GLOBAL_SETTINGS_STORAGE_KEY = 'opensid_global_surat_settings_v1';

interface OpenSidDynamicFormProps {
  masterItem: PermohonanSuratItem;
  isAdmin?: boolean;
}

const PAMONG_LIST = [
  {
    id: 'kades',
    atasNama: 'Kepala Desa Sampeldes',
    jabatan: 'Kepala Desa',
    nama: 'TUKIMAN',
    nip: '-',
    pangkat: '-',
  },
  {
    id: 'sekdes',
    atasNama: 'a.n. Kepala Desa Sampeldes\nSekretaris Desa',
    jabatan: 'Sekretaris Desa',
    nama: 'PRIYO SUMARNO',
    nip: '-',
    pangkat: '-',
  },
  {
    id: 'kasipem',
    atasNama: 'a.n. Kepala Desa Sampeldes\nKasi Pemerintahan',
    jabatan: 'Kasi Pemerintahan',
    nama: 'PERANGKAT DESA SAMPELDES',
    nip: '-',
    pangkat: '-',
  },
];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      if (base64Data) {
        resolve(base64Data);
      } else {
        reject(new Error(`Gagal membaca berkas: ${file.name}`));
      }
    };
    reader.onerror = (error) => reject(error);
  });


/**
 * Helper mencocokkan nilai data kependudukan ke opsi referensi resmi OpenSID.
 * Bila tidak ada opsi yang cocok persis atau relevan, kembalikan string kosong ('')
 * agar pemohon/admin diwajibkan memilih opsi dropdown yang sah.
 */
function matchReferenceOption(
  rawVal: string | undefined | null,
  options: string[],
): string {
  if (!rawVal) return '';
  const clean = String(rawVal).trim().toLowerCase();
  if (
    !clean ||
    clean === '-' ||
    clean === 'tidak tahu' ||
    clean === 'null' ||
    clean === 'undefined'
  ) {
    return '';
  }

  // Exact match case-insensitive
  const exact = options.find((opt) => opt.trim().toLowerCase() === clean);
  if (exact) return exact;

  // Jenis Kelamin
  if (options.includes('Laki-laki') && options.includes('Perempuan')) {
    if (clean === 'l' || clean.startsWith('laki') || clean === 'pria' || clean === '1') return 'Laki-laki';
    if (clean === 'p' || clean.startsWith('perempuan') || clean === 'wanita' || clean === '2') return 'Perempuan';
    return '';
  }

  // Agama
  if (options.includes('Islam')) {
    if (clean.includes('islam')) return 'Islam';
    if (clean.includes('protestan') || clean === 'kristen') return 'Kristen';
    if (clean.includes('katolik') || clean.includes('katholik')) return 'Katholik';
    if (clean.includes('hindu')) return 'Hindu';
    if (clean.includes('budha') || clean.includes('buddha')) return 'Buddha';
    if (clean.includes('konghucu') || clean.includes('khonghucu')) return 'Konghucu';
    if (clean.includes('kepercayaan')) {
      const kep = options.find((o) => o.toLowerCase().includes('kepercayaan'));
      if (kep) return kep;
    }
    return '';
  }

  // Status Perkawinan
  if (options.some((o) => o.toLowerCase().includes('kawin'))) {
    if (clean.includes('belum kawin') || clean === 'lajang' || clean === 'single') {
      const bk = options.find((o) => o.toLowerCase() === 'belum kawin');
      if (bk) return bk;
    }
    if (clean.includes('cerai mati') || clean.includes('duda') || clean.includes('janda')) {
      const cm = options.find((o) => o.toLowerCase().includes('cerai mati'));
      if (cm) return cm;
    }
    if (clean.includes('cerai hidup') || clean.includes('cerai')) {
      const ch = options.find((o) => o.toLowerCase().includes('cerai hidup'));
      if (ch) return ch;
    }
    if (clean.includes('belum tercatat')) {
      const kbt = options.find((o) => o.toLowerCase().includes('belum tercatat'));
      if (kbt) return kbt;
    }
    if (clean.includes('tercatat')) {
      const kt = options.find(
        (o) =>
          o.toLowerCase().includes('kawin tercatat') ||
          (o.toLowerCase().includes('tercatat') && !o.toLowerCase().includes('belum')),
      );
      if (kt) return kt;
    }
    if (clean === 'kawin' || clean === 'menikah') {
      const k =
        options.find((o) => o.toLowerCase() === 'kawin') ||
        options.find((o) => o.toLowerCase().includes('kawin tercatat'));
      if (k) return k;
    }
    return '';
  }

  // Pendidikan Dalam KK
  if (
    options.some(
      (o) =>
        o.toLowerCase().includes('tamat') ||
        o.toLowerCase().includes('slta') ||
        o.toLowerCase().includes('strata'),
    )
  ) {
    const directMatch = options.find((opt) => {
      const o = opt.toLowerCase();
      return (
        o === clean ||
        o.replace(/[^a-z0-9]/g, '') === clean.replace(/[^a-z0-9]/g, '')
      );
    });
    if (directMatch) return directMatch;

    if (clean.includes('tidak') || clean.includes('belum sekolah')) {
      const o = options.find(
        (x) => x.toLowerCase().includes('tidak / belum') || x.toLowerCase().includes('tidak'),
      );
      if (o) return o;
    }
    if (clean.includes('sd') || clean.includes('sederajat')) {
      if (clean.includes('belum')) {
        const o = options.find((x) => x.toLowerCase().includes('belum tamat'));
        if (o) return o;
      }
      const o = options.find((x) => x.toLowerCase().includes('tamat sd'));
      if (o) return o;
    }
    if (clean.includes('sltp') || clean.includes('smp')) {
      const o = options.find((x) => x.toLowerCase().includes('sltp') || x.toLowerCase().includes('smp'));
      if (o) return o;
    }
    if (clean.includes('slta') || clean.includes('sma') || clean.includes('smk')) {
      const o = options.find((x) => x.toLowerCase().includes('slta') || x.toLowerCase().includes('sma'));
      if (o) return o;
    }
    if (clean.includes('diploma i') || clean.includes('d1') || clean.includes('d2')) {
      const o = options.find(
        (x) => x.toLowerCase().includes('diploma i / ii') || x.toLowerCase().includes('diploma i'),
      );
      if (o) return o;
    }
    if (clean.includes('diploma iii') || clean.includes('d3') || clean.includes('akademi')) {
      const o = options.find(
        (x) => x.toLowerCase().includes('diploma iii') || x.toLowerCase().includes('akademi'),
      );
      if (o) return o;
    }
    if (
      clean.includes('diploma iv') ||
      clean.includes('strata i') ||
      clean.includes('s1') ||
      clean.includes('sarjana')
    ) {
      const o = options.find(
        (x) => x.toLowerCase().includes('strata i') || x.toLowerCase().includes('diploma iv'),
      );
      if (o) return o;
    }
    if (clean.includes('strata ii') || clean.includes('s2') || clean.includes('magister')) {
      const o = options.find((x) => x.toLowerCase().includes('strata ii'));
      if (o) return o;
    }
    if (clean.includes('strata iii') || clean.includes('s3') || clean.includes('doktor')) {
      const o = options.find((x) => x.toLowerCase().includes('strata iii'));
      if (o) return o;
    }
    return '';
  }

  // Golongan Darah
  if (
    options.includes('A') &&
    options.includes('B') &&
    options.includes('AB') &&
    options.includes('O')
  ) {
    const up = clean.toUpperCase();
    if (['A', 'B', 'AB', 'O'].includes(up)) return up;
    if (clean.includes('tahu') || clean === '-') {
      const tt = options.find((o) => o.toLowerCase().includes('tahu'));
      if (tt) return tt;
    }
    return '';
  }

  return '';
}

/**
 * Helper label dinamis untuk Surat Pernyataan Belum Memiliki Akta Lahir (SPTJM)
 * Menyesuaikan label kolom berdasarkan peruntukan pengajuan (Anak, Diri Sendiri, Pasangan, Keluarga Lain)
 */
function getDynamicBelumAktaLabel(
  label: string,
  kode: string,
  target: 'anak' | 'diri_sendiri' | 'istri' | 'suami' | 'keluarga_lain',
): string {
  const cleanKode = kode.replace(/^\[|\]$/g, '').toLowerCase();

  if (target === 'diri_sendiri') {
    if (cleanKode === 'form_nama_anak' || cleanKode === 'nama_anak')
      return 'Nama Lengkap Pemohon (Yang Belum Memiliki Akta)';
    if (cleanKode === 'form_nik_anak' || cleanKode === 'nik_anak')
      return 'NIK Pemohon (Sesuai KTP / KK)';
    if (cleanKode === 'form_tempat_lahir_anak' || cleanKode === 'tempat_lahir_anak')
      return 'Tempat Lahir Pemohon';
    if (cleanKode === 'form_tanggal_lahir_anak' || cleanKode === 'tanggal_lahir_anak')
      return 'Tanggal Lahir Pemohon';
    if (cleanKode === 'form_hari_lahir_anak' || cleanKode === 'hari_lahir_anak')
      return 'Hari Lahir Pemohon';
    if (cleanKode === 'form_alamat_anak' || cleanKode === 'alamat_anak')
      return 'Alamat Tempat Tinggal Pemohon';
    if (cleanKode === 'form_kelahiran_ke' || cleanKode === 'kelahiran_ke')
      return 'Urutan Kelahiran (Anak Ke-)';
    if (cleanKode === 'form_jenis_kelahiran' || cleanKode === 'jenis_kelahiran')
      return 'Jenis Kelahiran Pemohon';
    if (cleanKode === 'form_nama_ibu' || cleanKode === 'nama_ibu')
      return 'Nama Lengkap Ibu Kandung Pemohon';
    if (cleanKode === 'form_nik_ibu' || cleanKode === 'nik_ibu')
      return 'NIK Ibu Kandung Pemohon (16 Digit)';
    if (cleanKode === 'form_tempat_lahir_ibu' || cleanKode === 'tempat_lahir_ibu')
      return 'Tempat Lahir Ibu Kandung';
    if (cleanKode === 'form_tanggal_lahir_ibu' || cleanKode === 'tanggal_lahir_ibu')
      return 'Tanggal Lahir Ibu Kandung';
    if (cleanKode === 'form_pekerjaan_ibu' || cleanKode === 'pekerjaan_ibu')
      return 'Pekerjaan Ibu Kandung';
    if (cleanKode === 'form_alamat_ibu' || cleanKode === 'alamat_ibu')
      return 'Alamat Ibu Kandung';
    if (cleanKode === 'form_nama_ayah' || cleanKode === 'nama_ayah')
      return 'Nama Lengkap Ayah Kandung Pemohon';
    if (cleanKode === 'form_nik_ayah' || cleanKode === 'nik_ayah')
      return 'NIK Ayah Kandung Pemohon (16 Digit)';
    return label.replace(/\banak\b/gi, 'Pemohon');
  }

  if (target === 'istri' || target === 'suami') {
    if (cleanKode === 'form_nama_anak' || cleanKode === 'nama_anak')
      return 'Nama Lengkap Suami / Istri (Yang Belum Memiliki Akta)';
    if (cleanKode === 'form_nik_anak' || cleanKode === 'nik_anak')
      return 'NIK Suami / Istri (Sesuai KTP / KK)';
    if (cleanKode === 'form_tempat_lahir_anak' || cleanKode === 'tempat_lahir_anak')
      return 'Tempat Lahir Suami / Istri';
    if (cleanKode === 'form_tanggal_lahir_anak' || cleanKode === 'tanggal_lahir_anak')
      return 'Tanggal Lahir Suami / Istri';
    if (cleanKode === 'form_hari_lahir_anak' || cleanKode === 'hari_lahir_anak')
      return 'Hari Lahir Suami / Istri';
    if (cleanKode === 'form_alamat_anak' || cleanKode === 'alamat_anak')
      return 'Alamat Suami / Istri';
    if (cleanKode === 'form_nama_ibu' || cleanKode === 'nama_ibu')
      return 'Nama Lengkap Ibu Kandung Suami / Istri';
    if (cleanKode === 'form_nik_ibu' || cleanKode === 'nik_ibu')
      return 'NIK Ibu Kandung Suami / Istri';
    if (cleanKode === 'form_nama_ayah' || cleanKode === 'nama_ayah')
      return 'Nama Lengkap Ayah Kandung Suami / Istri';
    if (cleanKode === 'form_nik_ayah' || cleanKode === 'nik_ayah')
      return 'NIK Ayah Kandung Suami / Istri';
    return label.replace(/\banak\b/gi, 'Suami / Istri');
  }

  if (target === 'keluarga_lain') {
    if (cleanKode === 'form_nama_anak' || cleanKode === 'nama_anak')
      return 'Nama Lengkap Anggota Keluarga (Yang Belum Memiliki Akta)';
    if (cleanKode === 'form_nik_anak' || cleanKode === 'nik_anak')
      return 'NIK Anggota Keluarga (Sesuai KTP / KK)';
    if (cleanKode === 'form_tempat_lahir_anak' || cleanKode === 'tempat_lahir_anak')
      return 'Tempat Lahir Anggota Keluarga';
    if (cleanKode === 'form_tanggal_lahir_anak' || cleanKode === 'tanggal_lahir_anak')
      return 'Tanggal Lahir Anggota Keluarga';
    if (cleanKode === 'form_hari_lahir_anak' || cleanKode === 'hari_lahir_anak')
      return 'Hari Lahir Anggota Keluarga';
    if (cleanKode === 'form_alamat_anak' || cleanKode === 'alamat_anak')
      return 'Alamat Anggota Keluarga';
    if (cleanKode === 'form_nama_ibu' || cleanKode === 'nama_ibu')
      return 'Nama Lengkap Ibu Kandung Anggota Keluarga';
    if (cleanKode === 'form_nik_ibu' || cleanKode === 'nik_ibu')
      return 'NIK Ibu Kandung Anggota Keluarga';
    if (cleanKode === 'form_nama_ayah' || cleanKode === 'nama_ayah')
      return 'Nama Lengkap Ayah Kandung Anggota Keluarga';
    if (cleanKode === 'form_nik_ayah' || cleanKode === 'nik_ayah')
      return 'NIK Ayah Kandung Anggota Keluarga';
    return label.replace(/\banak\b/gi, 'Anggota Keluarga');
  }

  // target === 'anak'
  return label;
}

export function OpenSidDynamicForm({ masterItem, isAdmin = false }: OpenSidDynamicFormProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { identity } = useVillageIdentity();

  const pamongList = useMemo(
    () => [
      {
        id: 'kades',
        atasNama: `Kepala ${identity.sebutanDesa} ${identity.namaDesa}`,
        jabatan: `Kepala ${identity.sebutanDesa}`,
        nama: identity.namaKepalaDesa || 'TUKIMAN',
        nip: identity.nipKepalaDesa || '-',
        pangkat: identity.pangkatKepalaDesa || '-',
      },
      {
        id: 'sekdes',
        atasNama: `a.n. Kepala ${identity.sebutanDesa} ${identity.namaDesa}\nSekretaris ${identity.sebutanDesa}`,
        jabatan: `Sekretaris ${identity.sebutanDesa}`,
        nama: identity.namaSekretarisDesa || 'PRIYO SUMARNO',
        nip: identity.nipSekretarisDesa || '-',
        pangkat: identity.pangkatSekretarisDesa || '-',
      },
      {
        id: 'kasipem',
        atasNama: `a.n. Kepala ${identity.sebutanDesa} ${identity.namaDesa}\nKasi Pemerintahan`,
        jabatan: 'Kasi Pemerintahan',
        nama: `PERANGKAT ${identity.sebutanDesa.toUpperCase()} ${identity.namaDesa.toUpperCase()}`,
        nip: '-',
        pangkat: '-',
      },
    ],
    [identity],
  );

  // Ambil Kop Surat dari /admin/settings - Templat Kop Surat (kopSurat/default)
  const kopSuratRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'kopSurat', 'default') : null),
    [firestore],
  );
  const { data: kopInfo } = useDoc<KopSuratInfo>(kopSuratRef);

  const enrichedItem = useMemo(
    () => enrichPermohonanSuratWithOpenSid(masterItem),
    [masterItem],
  );

  // Load Global Settings (Header, Footer, Margin, Format Nomor)
  const [globalSettings, setGlobalSettings] = useState<OpenSidGlobalSuratSettings>(
    OPENSID_GLOBAL_SETTINGS_DEFAULT,
  );
  useEffect(() => {
    try {
      const saved = localStorage.getItem(GLOBAL_SETTINGS_STORAGE_KEY);
      if (saved) {
        setGlobalSettings({ ...OPENSID_GLOBAL_SETTINGS_DEFAULT, ...JSON.parse(saved) });
      }
    } catch {
      // ignore
    }
  }, []);

  const effectiveGlobalSettings = useMemo<OpenSidGlobalSuratSettings>(
    () => ({
      ...globalSettings,
      letterheadImageUrl: kopInfo?.letterheadImageUrl || globalSettings.letterheadImageUrl,
    }),
    [globalSettings, kopInfo?.letterheadImageUrl],
  );

  // State On-Demand Search Penduduk (SUPER HEMAT QUOTA: Hanya query maks 8 dokumen saat user mengetik)
  const [matchingResidentsBySection, setMatchingResidentsBySection] = useState<Record<string, Resident[]>>({});
  const [isSearchingResident, setIsSearchingResident] = useState<Record<string, boolean>>({});
  const residentSearchCacheRef = React.useRef<Map<string, Resident[]>>(new Map());

  const formIsianMap = useMemo(
    () =>
      enrichedItem.formIsian || {
        individu: normalizeFormSectionConfig('individu', {}),
      },
    [enrichedItem.formIsian],
  );
  const sectionKeys = useMemo(() => Object.keys(formIsianMap), [formIsianMap]);

  // State Nomor Urut & Nomor Surat (Digunakan ketika isAdmin === true)
  const [nomorUrut, setNomorUrut] = useState<number>(1);
  const [nomorSurat, setNomorSurat] = useState<string>('');
  const [tanggalSurat, setTanggalSurat] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );

  // Hitung Masa Berlaku Default
  const defaultMasa = useMemo(
    () =>
      hitungMasaBerlakuTanggal(
        new Date(tanggalSurat || new Date()),
        enrichedItem.masaBerlakuValue ?? 1,
        enrichedItem.satuanMasaBerlaku || 'M',
      ),
    [tanggalSurat, enrichedItem.masaBerlakuValue, enrichedItem.satuanMasaBerlaku],
  );
  const [mulaiBerlaku, setMulaiBerlaku] = useState<string>(defaultMasa.mulaiBerlaku);
  const [berlakuSampai, setBerlakuSampai] = useState<string>(defaultMasa.berlakuSampai);

  useEffect(() => {
    setMulaiBerlaku(defaultMasa.mulaiBerlaku);
    setBerlakuSampai(defaultMasa.berlakuSampai);
  }, [defaultMasa]);

  // Auto-generate Nomor Surat dari jumlah surat yang sudah ada (khusus Admin - HEMAT KUOTA dengan Cache 5 Menit)
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    async function fetchNextNumber() {
      let nextNo = 1;
      if (firestore) {
        const COUNT_CACHE_KEY = 'sampeldes_letter_count_cache';
        const COUNT_TTL = 5 * 60 * 1000;
        let cachedCount: number | null = null;
        if (typeof window !== 'undefined') {
          try {
            const raw = sessionStorage.getItem(COUNT_CACHE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (typeof parsed.count === 'number' && Date.now() - parsed.ts < COUNT_TTL) {
                cachedCount = parsed.count;
              }
            }
          } catch {
            // ignore
          }
        }

        if (cachedCount !== null) {
          nextNo = cachedCount + 1;
        } else {
          try {
            const coll = collection(firestore, 'letterRequests');
            const countSnap = await getCountFromServer(coll);
            const cnt = countSnap.data().count;
            nextNo = cnt + 1;
            if (typeof window !== 'undefined') {
              try {
                sessionStorage.setItem(COUNT_CACHE_KEY, JSON.stringify({ count: cnt, ts: Date.now() }));
              } catch {
                // ignore
              }
            }
          } catch {
            try {
              const lastSnap = await getDocs(
                query(collection(firestore, 'letterRequests'), orderBy('createdAt', 'desc'), limit(1)),
              );
              nextNo = lastSnap.empty ? 1 : (lastSnap.docs[0].data().nomorUrut || lastSnap.size) + 1;
            } catch {
              nextNo = 1;
            }
          }
        }
      }
      if (!active) return;
      setNomorUrut(nextNo);
      const fmt = enrichedItem.formatNomorGlobal
        ? globalSettings.formatNomorGlobal || OPENSID_FORMAT_NOMOR_DEFAULT
        : enrichedItem.formatNomor || OPENSID_FORMAT_NOMOR_DEFAULT;
      setNomorSurat(
        formatPenomoranSuratOpenSid({
          formatNomor: fmt,
          nomorUrut: nextNo,
          kodeSurat: enrichedItem.kodeSurat || '470',
          tanggal: new Date(tanggalSurat || new Date()),
        }),
      );
    }
    fetchNextNumber();
    return () => {
      active = false;
    };
  }, [
    isAdmin,
    firestore,
    enrichedItem.kodeSurat,
    enrichedItem.formatNomor,
    enrichedItem.formatNomorGlobal,
    globalSettings.formatNomorGlobal,
    tanggalSurat,
  ]);

  // State Sumber Data per Bagian Form ('1' = Penduduk Desa, '2' = Penduduk Luar Desa)
  const [sumberModeBySection, setSumberModeBySection] = useState<Record<string, '1' | '2'>>({});
  // State Pencarian Penduduk per Bagian
  const [searchResidentBySection, setSearchResidentBySection] = useState<Record<string, string>>({});

  // Efek pencarian penduduk on-demand (SUPER HEMAT QUOTA: Hanya query saat user mengetik minimal 3 karakter dengan cache 3-lapis)
  useEffect(() => {
    if (!firestore) return;

    const entries = Object.entries(searchResidentBySection);
    const activeEntry = entries.find(([_, q]) => (q || '').trim().length >= 3);

    if (!activeEntry) {
      setMatchingResidentsBySection({});
      return;
    }

    const [secKey, rawQuery] = activeEntry;
    const cleanQ = rawQuery.trim();
    const cacheKey = `${secKey}_${cleanQ.toLowerCase()}`;

    // Cek cache lokal memori (0 Read Firestore!)
    if (residentSearchCacheRef.current.has(cacheKey)) {
      setMatchingResidentsBySection((prev) => ({
        ...prev,
        [secKey]: residentSearchCacheRef.current.get(cacheKey) || [],
      }));
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingResident((prev) => ({ ...prev, [secKey]: true }));
      try {
        // Gunakan fungsi pencarian hemat kuota terpusat (0 Read jika di cache, 1 Read jika 16 digit NIK)
        const list = await searchResidentsQuotaSafe(firestore, cleanQ, 6);
        residentSearchCacheRef.current.set(cacheKey, list);
        setMatchingResidentsBySection((prev) => ({
          ...prev,
          [secKey]: list,
        }));
      } catch (err) {
        console.error('Error searching residents:', err);
      } finally {
        setIsSearchingResident((prev) => ({ ...prev, [secKey]: false }));
      }
    }, 550);

    return () => clearTimeout(timer);
  }, [searchResidentBySection, firestore]);

  // State Data Pelaku per Bagian (individu + bagian tambahan)
  const [personDataBySection, setPersonDataBySection] = useState<Record<string, OpenSidPersonData>>({
    individu: {
      warga_negara: 'WNI',
      agama: '',
      pendidikan_kk: '',
      status_kawin: '',
      jenis_kelamin: '',
      pekerjaan: '',
      hubungan_kk: '',
      rt: '001',
      rw: '001',
      dusun: 'Sampeldes',
    },
  });

  // State Nilai Kode Isian Dinamis ([form_...])
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // State Penandatangan (Pamong)
  const [selectedPamongId, setSelectedPamongId] = useState<string>('kades');
  const selectedPamong = useMemo(
    () => pamongList.find((p) => p.id === selectedPamongId) || pamongList[0],
    [pamongList, selectedPamongId],
  );

  // State Konsep Surat (Preview & Edit HTML sebelum simpan/cetak)
  const [showKonsepModal, setShowKonsepModal] = useState(false);
  const [customKonsepHtml, setCustomKonsepHtml] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [requesterEmail, setRequesterEmail] = useState<string>('');
  const [filesToUpload, setFilesToUpload] = useState<Record<string, File>>({});
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const isSuratBelumAkta = useMemo(() => {
    const normJenis = (enrichedItem.jenisSurat || '').toLowerCase();
    const urlSurat = (enrichedItem.urlSurat || '').toLowerCase();
    const kodeSurat = (enrichedItem.kodeSurat || '').toLowerCase();
    return (
      normJenis.includes('belum memiliki akta') ||
      normJenis.includes('sptjm') ||
      urlSurat.includes('belum-memiliki-akta') ||
      kodeSurat === 's-19'
    );
  }, [enrichedItem]);

  // Pilihan Pengajuan: Anak Kandung / Diri Sendiri / Suami / Istri / Anggota Keluarga Lain
  const [targetPengajuan, setTargetPengajuan] = useState<
    'anak' | 'diri_sendiri' | 'istri' | 'suami' | 'keluarga_lain'
  >('anak');

  const isF101Required = useMemo(() => {
    const normJenis = (enrichedItem.jenisSurat || '').toLowerCase();
    const urlSurat = (enrichedItem.urlSurat || '').toLowerCase();
    const kodeSurat = (enrichedItem.kodeSurat || '').toLowerCase();
    const hasLampiranF101 = (enrichedItem.lampiran || []).some(
      (l) => l.toUpperCase().includes('F-1.01') || l.toUpperCase().includes('F1.01')
    );
    return (
      hasLampiranF101 ||
      normJenis.includes('f-1.01') ||
      normJenis.includes('kartu keluarga') ||
      normJenis.includes('biodata penduduk') ||
      urlSurat.includes('f-1.01') ||
      kodeSurat === 's-03'
    );
  }, [enrichedItem]);

  // Anggota satu KK dengan pemohon (On-Demand dari Firestore - HANYA diambil jika surat ini butuh daftar anggota keluarga!)
  const [familyMembersInKk, setFamilyMembersInKk] = useState<Resident[]>([]);
  const currentNoKk = (personDataBySection.individu?.no_kk || '').trim();

  useEffect(() => {
    // HEMAT KUOTA: Jangan tarik anggota KK jika jenis surat bukan SPTJM / Belum Akta / F-1.01!
    if (!isSuratBelumAkta && !isF101Required) {
      setFamilyMembersInKk([]);
      return;
    }
    if (!firestore || !currentNoKk || currentNoKk === '-' || currentNoKk.length < 5) {
      setFamilyMembersInKk([]);
      return;
    }
    let active = true;
    async function loadFamilyKk() {
      try {
        const members = await getResidentsByKk(firestore!, currentNoKk);
        if (active) {
          setFamilyMembersInKk(members);
        }
      } catch (e) {
        console.error('Error fetching KK members:', e);
      }
    }
    loadFamilyKk();
    return () => {
      active = false;
    };
  }, [currentNoKk, firestore, isSuratBelumAkta, isF101Required]);

  // Fungsi pengisian data subjek (anak/diri sendiri/pasangan/keluarga lain)
  const applySubjectData = (
    res: Resident | null,
    mode: 'anak' | 'diri_sendiri' | 'istri' | 'suami' | 'keluarga_lain',
  ) => {
    const p = personDataBySection.individu || {};
    if (mode === 'diri_sendiri') {
      const tglLahir = p.tanggal_lahir || '';
      const hari = tglLahir ? getNamaHariIndonesia(tglLahir) : '';
      setFormValues((prev) => ({
        ...prev,
        '[form_nama_anak]': p.nama || '',
        form_nama_anak: p.nama || '',
        '[form_nik_anak]': p.nik || '',
        form_nik_anak: p.nik || '',
        '[form_tempat_lahir_anak]': p.tempat_lahir || '',
        form_tempat_lahir_anak: p.tempat_lahir || '',
        '[form_tanggal_lahir_anak]': tglLahir,
        form_tanggal_lahir_anak: tglLahir,
        '[form_hari_lahir_anak]': hari || 'Senin',
        form_hari_lahir_anak: hari || 'Senin',
        '[form_alamat_anak]': p.alamat || '',
        form_alamat_anak: p.alamat || '',
        '[form_kelahiran_ke]': prev['[form_kelahiran_ke]'] || '1',
        form_kelahiran_ke: prev.form_kelahiran_ke || '1',
        '[form_jenis_kelahiran]': prev['[form_jenis_kelahiran]'] || 'Tunggal',
        form_jenis_kelahiran: prev.form_jenis_kelahiran || 'Tunggal',
        '[form_nama_ibu]': p.nama_ibu && p.nama_ibu !== '-' ? p.nama_ibu : prev['[form_nama_ibu]'] || '',
        form_nama_ibu: p.nama_ibu && p.nama_ibu !== '-' ? p.nama_ibu : prev.form_nama_ibu || '',
        '[form_nik_ibu]': p.nik_ibu && p.nik_ibu !== '-' ? p.nik_ibu : prev['[form_nik_ibu]'] || '',
        form_nik_ibu: p.nik_ibu && p.nik_ibu !== '-' ? p.nik_ibu : prev.form_nik_ibu || '',
        '[form_nama_ayah]': p.nama_ayah && p.nama_ayah !== '-' ? p.nama_ayah : prev['[form_nama_ayah]'] || '',
        form_nama_ayah: p.nama_ayah && p.nama_ayah !== '-' ? p.nama_ayah : prev.form_nama_ayah || '',
        '[form_nik_ayah]': p.nik_ayah && p.nik_ayah !== '-' ? p.nik_ayah : prev['[form_nik_ayah]'] || '',
        form_nik_ayah: p.nik_ayah && p.nik_ayah !== '-' ? p.nik_ayah : prev.form_nik_ayah || '',
      }));
      toast({
        title: 'Pengajuan Untuk Diri Sendiri Aktif',
        description: 'Data yang diterangkan belum memiliki akta disinkronkan langsung dari Identitas Pemohon.',
      });
      return;
    }

    if (res) {
      const anyR = res as any;
      const tglLahir = res.dateOfBirth || anyR.birthDate || '';
      const hari = tglLahir ? getNamaHariIndonesia(tglLahir) : '';
      const rt = (res.rt || p.rt || '001').trim();
      const rw = (res.rw || p.rw || '001').trim();
      const alamatSubjek =
        p.alamat ||
        `${res.address || 'Dusun Sampeldes'} RT ${rt} RW ${rw}, ${identity.sebutanDesa} ${identity.namaDesa}, Kecamatan ${identity.namaKecamatan}, ${identity.sebutanKabupaten} ${identity.namaKabupaten}`;

      let namaIbu = anyR.motherName || anyR.nama_ibu || '';
      let nikIbu = anyR.motherNik || anyR.nik_ibu || '';
      let namaAyah = anyR.fatherName || anyR.nama_ayah || '';
      let nikAyah = anyR.fatherNik || anyR.nik_ayah || '';

      if (mode === 'anak') {
        if ((p.jenis_kelamin || '').toLowerCase().startsWith('p')) {
          if (!namaIbu) namaIbu = p.nama || '';
          if (!nikIbu) nikIbu = p.nik || '';
        } else if ((p.jenis_kelamin || '').toLowerCase().startsWith('l')) {
          if (!namaAyah) namaAyah = p.nama || '';
          if (!nikAyah) nikAyah = p.nik || '';
        }
      }

      setFormValues((prev) => ({
        ...prev,
        '[form_nama_anak]': res.fullName || '',
        form_nama_anak: res.fullName || '',
        '[form_nik_anak]': res.nik || '',
        form_nik_anak: res.nik || '',
        '[form_tempat_lahir_anak]': res.placeOfBirth || anyR.birthPlace || identity.namaKabupaten || '',
        form_tempat_lahir_anak: res.placeOfBirth || anyR.birthPlace || identity.namaKabupaten || '',
        '[form_tanggal_lahir_anak]': tglLahir,
        form_tanggal_lahir_anak: tglLahir,
        '[form_hari_lahir_anak]': hari || 'Senin',
        form_hari_lahir_anak: hari || 'Senin',
        '[form_alamat_anak]': alamatSubjek,
        form_alamat_anak: alamatSubjek,
        ...(namaIbu ? { '[form_nama_ibu]': namaIbu, form_nama_ibu: namaIbu } : {}),
        ...(nikIbu ? { '[form_nik_ibu]': nikIbu, form_nik_ibu: nikIbu } : {}),
        ...(namaAyah ? { '[form_nama_ayah]': namaAyah, form_nama_ayah: namaAyah } : {}),
        ...(nikAyah ? { '[form_nik_ayah]': nikAyah, form_nik_ayah: nikAyah } : {}),
      }));

      toast({
        title: `Data Subjek (${res.fullName}) Berhasil Terisi`,
        description: `NIK: ${res.nik} • TTL: ${res.placeOfBirth || identity.namaKabupaten}, ${tglLahir}`,
      });
    }
  };

  // Sinkronisasi otomatis real-time data pemohon ke field subjek ketika peruntukan "Untuk Diri Sendiri"
  useEffect(() => {
    if (!isSuratBelumAkta || targetPengajuan !== 'diri_sendiri') return;
    const p = personDataBySection.individu || {};
    const tglLahir = p.tanggal_lahir || '';
    const hari = tglLahir ? getNamaHariIndonesia(tglLahir) : '';
    setFormValues((prev) => ({
      ...prev,
      '[form_nama_anak]': p.nama || '',
      form_nama_anak: p.nama || '',
      '[form_nik_anak]': p.nik || '',
      form_nik_anak: p.nik || '',
      '[form_tempat_lahir_anak]': p.tempat_lahir || '',
      form_tempat_lahir_anak: p.tempat_lahir || '',
      '[form_tanggal_lahir_anak]': tglLahir,
      form_tanggal_lahir_anak: tglLahir,
      '[form_hari_lahir_anak]': hari || 'Senin',
      form_hari_lahir_anak: hari || 'Senin',
      '[form_alamat_anak]': p.alamat || '',
      form_alamat_anak: p.alamat || '',
      ...(p.nama_ibu && p.nama_ibu !== '-' ? { '[form_nama_ibu]': p.nama_ibu, form_nama_ibu: p.nama_ibu } : {}),
      ...(p.nik_ibu && p.nik_ibu !== '-' ? { '[form_nik_ibu]': p.nik_ibu, form_nik_ibu: p.nik_ibu } : {}),
      ...(p.nama_ayah && p.nama_ayah !== '-' ? { '[form_nama_ayah]': p.nama_ayah, form_nama_ayah: p.nama_ayah } : {}),
      ...(p.nik_ayah && p.nik_ayah !== '-' ? { '[form_nik_ayah]': p.nik_ayah, form_nik_ayah: p.nik_ayah } : {}),
    }));
  }, [
    isSuratBelumAkta,
    targetPengajuan,
    personDataBySection.individu?.nama,
    personDataBySection.individu?.nik,
    personDataBySection.individu?.tempat_lahir,
    personDataBySection.individu?.tanggal_lahir,
    personDataBySection.individu?.alamat,
    personDataBySection.individu?.nama_ibu,
    personDataBySection.individu?.nik_ibu,
    personDataBySection.individu?.nama_ayah,
    personDataBySection.individu?.nik_ayah,
  ]);

  // State Daftar Anggota Keluarga (Khusus Surat Berlampiran F-1.01)
  const [familyMembers, setFamilyMembers] = useState<
    {
      id: string;
      nama: string;
      nik: string;
      jenis_kelamin: string;
      tempat_lahir: string;
      tanggal_lahir: string;
      hubungan_kk: string;
      golongan_darah: string;
      agama: string;
      status_kawin: string;
      pendidikan_kk: string;
      pekerjaan: string;
      nama_ibu: string;
      nik_ibu: string;
      nama_ayah: string;
      nik_ayah: string;
      paspor?: string;
      tgl_paspor?: string;
      no_akta_lahir?: string;
      no_akta_kawin?: string;
      tgl_kawin?: string;
      no_akta_cerai?: string;
      tgl_cerai?: string;
    }[]
  >([]);

  const addFamilyMember = () => {
    if (familyMembers.length >= 9) {
      toast({
        variant: 'destructive',
        title: 'Batas Anggota Tercapai',
        description: 'Maksimal 10 orang anggota keluarga (1 Kepala Keluarga + 9 Anggota) sesuai formulir F-1.01.',
      });
      return;
    }
    const newMember = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      nama: '',
      nik: '',
      jenis_kelamin: 'Laki-laki',
      tempat_lahir: identity.namaKabupaten || '',
      tanggal_lahir: '',
      hubungan_kk: 'ANAK',
      golongan_darah: 'Tidak Tahu',
      agama: 'Islam',
      status_kawin: 'Belum Kawin',
      pendidikan_kk: 'SLTA / Sederajat',
      pekerjaan: 'Pelajar / Mahasiswa',
      nama_ibu: personDataBySection.individu?.nama_ibu || '',
      nik_ibu: personDataBySection.individu?.nik_ibu || '',
      nama_ayah: personDataBySection.individu?.nama || '',
      nik_ayah: personDataBySection.individu?.nik || '',
    };
    setFamilyMembers((prev) => [...prev, newMember]);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFamilyMember = (index: number, field: string, value: string) => {
    setFamilyMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAutoFillFamilyFromDatabase = async () => {
    const curKk = personDataBySection.individu?.no_kk;
    const curNik = personDataBySection.individu?.nik;
    if (!curKk || curKk === '-' || curKk.length < 5 || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Nomor Kartu Keluarga Kosong',
        description: 'Pilih penduduk atau isi Nomor Kartu Keluarga (KK) terlebih dahulu.',
      });
      return;
    }
    try {
      const allKkMembers = await getResidentsByKk(firestore, curKk);
      const matchedResidents = allKkMembers.filter(
        (r) => (r.nik || '').trim() !== (curNik || '').trim()
      );
      if (matchedResidents.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Tidak Ada Data Warga Terkait',
          description: `Tidak ditemukan anggota lain dengan No KK "${curKk}" di database warga.`,
        });
        return;
      }
      const importedMembers = matchedResidents.slice(0, 9).map((r) => {
        const anyR = r as any;
        return {
          id: `mem_res_${r.id || r.nik}`,
          nama: r.fullName || '',
          nik: r.nik || '',
          jenis_kelamin: (r.gender || '').toLowerCase().startsWith('p') ? 'Perempuan' : 'Laki-laki',
          tempat_lahir: r.placeOfBirth || anyR.birthPlace || identity.namaKabupaten || '',
          tanggal_lahir: r.dateOfBirth || anyR.birthDate || '',
          hubungan_kk: (anyR.shdk || r.relationshipToHeadOfFamily || 'ANAK').toUpperCase(),
          golongan_darah: anyR.bloodType || anyR.golongan_darah || 'Tidak Tahu',
          agama: anyR.religion || anyR.agama || 'Islam',
          status_kawin: r.maritalStatus || 'Belum Kawin',
          pendidikan_kk: r.educationLevel || 'SLTA / Sederajat',
          pekerjaan: anyR.occupation || anyR.pekerjaan || '-',
          nama_ibu: anyR.motherName || anyR.nama_ibu || '',
          nik_ibu: anyR.motherNik || anyR.nik_ibu || '',
          nama_ayah: anyR.fatherName || anyR.nama_ayah || '',
          nik_ayah: anyR.fatherNik || anyR.nik_ayah || '',
        };
      });
      setFamilyMembers(importedMembers);
      toast({
        title: 'Data Anggota Keluarga Berhasil Dimuat',
        description: `Berhasil memuat ${importedMembers.length} anggota keluarga dari No KK ${curKk}.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal Memuat Anggota Keluarga',
        description: err?.message || 'Terjadi kesalahan saat mengambil data KK.',
      });
    }
  };

  const syaratList = useMemo(
    () =>
      Array.isArray(enrichedItem.syaratSurat) && enrichedItem.syaratSurat.length > 0
        ? enrichedItem.syaratSurat
        : ['KTP-el Pemohon / Pelapor', 'Kartu Keluarga (KK)', 'Surat Pengantar RT / RW'],
    [enrichedItem.syaratSurat],
  );

  const handleFileSelect = (file: File, fieldName: string) => {
    setFilesToUpload((prev) => ({ ...prev, [fieldName]: file }));
  };

  const handleResetForm = () => {
    setSubmittedTicket(null);
    setPersonDataBySection({
      individu: {
        warga_negara: 'WNI',
        agama: 'Islam',
        pendidikan_kk: 'SLTA / Sederajat',
        hubungan_kk: 'Kepala Keluarga',
        rt: '001',
        rw: '001',
        dusun: 'Sampeldes',
      },
    });
    setFormValues({});
    setFilesToUpload({});
    setWhatsappNumber('');
    setRequesterEmail('');
  };

  // Helper pilih penduduk dari database warga desa
  const handleSelectResidentForSection = (secKey: string, res: Resident) => {
    const rt = (res.rt || '001').trim();
    const rw = (res.rw || '001').trim();
    const dusun = res.dusun || res.address || identity.namaDesa;
    const alamatLengkapKtp =
      res.address && res.address.includes('RT')
        ? `${res.address}, ${identity.sebutanDesa} ${identity.namaDesa}, Kecamatan ${identity.namaKecamatan}, ${identity.sebutanKabupaten} ${identity.namaKabupaten}`
        : `${dusun} RT ${rt} RW ${rw}, ${identity.sebutanDesa} ${identity.namaDesa}, Kecamatan ${identity.namaKecamatan}, ${identity.sebutanKabupaten} ${identity.namaKabupaten}`;

    const anyR = res as any;

    const person: OpenSidPersonData = {
      nama: res.fullName || '',
      nik: res.nik || '',
      no_kk: res.noKk || '',
      kepala_kk: res.fullName || '',
      tempat_lahir: res.placeOfBirth || anyR.birthPlace || identity.namaKabupaten || '',
      tanggal_lahir: res.dateOfBirth || anyR.birthDate || '',
      jenis_kelamin: matchReferenceOption(res.gender || anyR.jenis_kelamin, ['Laki-laki', 'Perempuan']),
      agama: matchReferenceOption(res.religion || anyR.agama, OPENSID_REFERENSI_DATA.Agama),
      pendidikan_kk: matchReferenceOption(
        res.educationLevel || anyR.pendidikan,
        OPENSID_REFERENSI_DATA['Pendidikan Dalam KK'],
      ),
      pekerjaan: (res.occupation || anyR.pekerjaan || '').trim(),
      warga_negara: res.nationality || 'WNI',
      status_kawin: matchReferenceOption(
        res.maritalStatus || anyR.status_kawin,
        OPENSID_REFERENSI_DATA['Status Perkawinan'],
      ),
      golongan_darah: matchReferenceOption(
        res.bloodType || anyR.golongan_darah,
        OPENSID_REFERENSI_DATA['Golongan Darah'],
      ),
      alamat: alamatLengkapKtp,
      rt,
      rw,
      dusun,
      hubungan_kk: res.relationshipToHeadOfFamily || anyR.shdk || '',
      nama_ayah: res.fatherName || anyR.nama_ayah || '',
      nik_ayah: (anyR.fatherNik || anyR.nik_ayah || '').trim() || '',
      nama_ibu: res.motherName || anyR.nama_ibu || '',
      nik_ibu: (anyR.motherNik || anyR.nik_ibu || '').trim() || '',
    };

    setPersonDataBySection((prev) => {
      const next = { ...prev, [secKey]: person };
      if (secKey === 'individu') {
        if (sectionKeys.includes('ayah') && !prev.ayah?.nama && person.nama_ayah) {
          next.ayah = { ...(prev.ayah || {}), nama: person.nama_ayah, nik: person.nik_ayah };
        }
        if (sectionKeys.includes('ibu') && !prev.ibu?.nama && person.nama_ibu) {
          next.ibu = { ...(prev.ibu || {}), nama: person.nama_ibu, nik: person.nik_ibu };
        }
      }
      return next;
    });

    const isSuratTanah =
      (enrichedItem.kodeSurat || '').toLowerCase() === 's-49' ||
      (enrichedItem.urlSurat || '').toLowerCase().includes('kepemilikan-tanah');

    if (secKey === 'individu' && isSuratTanah && person.nama) {
      setFormValues((prev) => {
        const upd: Record<string, string> = {};
        if (!prev['[form_atas_nama_tanah]'] && !prev.form_atas_nama_tanah && !prev.atas_nama_tanah) {
          upd['[form_atas_nama_tanah]'] = person.nama || '';
          upd.form_atas_nama_tanah = person.nama || '';
          upd.atas_nama_tanah = person.nama || '';
        }
        return { ...prev, ...upd };
      });
    }

    // Sinkronisasi otomatis ke formValues jika bagian ini saksi_1 / saksi_2
    if (secKey === 'saksi_1' || secKey === 'saksi1' || secKey === 'saksi_i') {
      const usiaSaksi1 = (person as any).usia || '';
      setFormValues((prev) => ({
        ...prev,
        '[form_nama_saksi_1]': person.nama || '',
        form_nama_saksi_1: person.nama || '',
        namasaksii: person.nama || '',
        nama_saksi_i: person.nama || '',
        nama_saksi_1: person.nama || '',
        '[form_nik_saksi_1]': person.nik || '',
        form_nik_saksi_1: person.nik || '',
        nik_saksi_1: person.nik || '',
        '[form_tempat_lahir_saksi_1]': person.tempat_lahir || '',
        form_tempat_lahir_saksi_1: person.tempat_lahir || '',
        tempat_lahir_saksi_1: person.tempat_lahir || '',
        '[form_tanggal_lahir_saksi_1]': person.tanggal_lahir || '',
        form_tanggal_lahir_saksi_1: person.tanggal_lahir || '',
        tanggal_lahir_saksi_1: person.tanggal_lahir || '',
        '[form_umur_saksi_1]': String(usiaSaksi1).replace(/Tahun/i, '').trim(),
        form_umur_saksi_1: String(usiaSaksi1).replace(/Tahun/i, '').trim(),
        umursaksii: String(usiaSaksi1).replace(/Tahun/i, '').trim(),
        usia_saksi_i: String(usiaSaksi1).replace(/Tahun/i, '').trim(),
        '[form_agama_saksi_1]': person.agama || '',
        form_agama_saksi_1: person.agama || '',
        agama_saksi_1: person.agama || '',
        '[form_pekerjaan_saksi_1]': person.pekerjaan || '',
        form_pekerjaan_saksi_1: person.pekerjaan || '',
        pekerjaansaksii: person.pekerjaan || '',
        pekerjaan_saksi_i: person.pekerjaan || '',
        pekerjaan_saksi_1: person.pekerjaan || '',
        '[form_alamat_saksi_1]': person.alamat || '',
        form_alamat_saksi_1: person.alamat || '',
        alamatsaksii: person.alamat || '',
        alamat_saksi_i: person.alamat || '',
        alamat_saksi_1: person.alamat || '',
      }));
    } else if (secKey === 'saksi_2' || secKey === 'saksi2' || secKey === 'saksi_ii') {
      const usiaSaksi2 = (person as any).usia || '';
      setFormValues((prev) => ({
        ...prev,
        '[form_nama_saksi_2]': person.nama || '',
        form_nama_saksi_2: person.nama || '',
        namasaksiii: person.nama || '',
        nama_saksi_ii: person.nama || '',
        nama_saksi_2: person.nama || '',
        '[form_nik_saksi_2]': person.nik || '',
        form_nik_saksi_2: person.nik || '',
        nik_saksi_2: person.nik || '',
        '[form_tempat_lahir_saksi_2]': person.tempat_lahir || '',
        form_tempat_lahir_saksi_2: person.tempat_lahir || '',
        tempat_lahir_saksi_2: person.tempat_lahir || '',
        '[form_tanggal_lahir_saksi_2]': person.tanggal_lahir || '',
        form_tanggal_lahir_saksi_2: person.tanggal_lahir || '',
        tanggal_lahir_saksi_2: person.tanggal_lahir || '',
        '[form_umur_saksi_2]': String(usiaSaksi2).replace(/Tahun/i, '').trim(),
        form_umur_saksi_2: String(usiaSaksi2).replace(/Tahun/i, '').trim(),
        umursaksiii: String(usiaSaksi2).replace(/Tahun/i, '').trim(),
        usia_saksi_ii: String(usiaSaksi2).replace(/Tahun/i, '').trim(),
        '[form_agama_saksi_2]': person.agama || '',
        form_agama_saksi_2: person.agama || '',
        agama_saksi_2: person.agama || '',
        '[form_pekerjaan_saksi_2]': person.pekerjaan || '',
        form_pekerjaan_saksi_2: person.pekerjaan || '',
        pekerjaansaksiii: person.pekerjaan || '',
        pekerjaan_saksi_ii: person.pekerjaan || '',
        pekerjaan_saksi_2: person.pekerjaan || '',
        '[form_alamat_saksi_2]': person.alamat || '',
        form_alamat_saksi_2: person.alamat || '',
        alamatsaksiii: person.alamat || '',
        alamat_saksi_ii: person.alamat || '',
        alamat_saksi_2: person.alamat || '',
      }));
    } else if (secKey === 'pasangan') {
      const ttlPasangan = person.tempat_lahir && person.tanggal_lahir ? `${person.tempat_lahir}, ${person.tanggal_lahir}` : (person.tempat_lahir || person.tanggal_lahir || '');
      setFormValues((prev) => ({
        ...prev,
        '[form_nama_pasangan]': person.nama || '',
        form_nama_pasangan: person.nama || '',
        nama_pasangan: person.nama || '',
        '[form_nama_ayah_pasangan]': person.nama_ayah || '',
        form_nama_ayah_pasangan: person.nama_ayah || '',
        nama_ayah_pasangan: person.nama_ayah || '',
        '[form_tempatlahir_pasangan]': person.tempat_lahir || '',
        form_tempatlahir_pasangan: person.tempat_lahir || '',
        tempatlahir_pasangan: person.tempat_lahir || '',
        '[form_tanggallahir_pasangan]': person.tanggal_lahir || '',
        form_tanggallahir_pasangan: person.tanggal_lahir || '',
        tanggallahir_pasangan: person.tanggal_lahir || '',
        '[form_tempatdan_tgllahir_pasangan]': ttlPasangan,
        form_tempatdan_tgllahir_pasangan: ttlPasangan,
        '[form_nik_pasangan]': person.nik || '',
        form_nik_pasangan: person.nik || '',
        nik_pasangan: person.nik || '',
        '[form_wn_pasangan]': person.warga_negara || 'WNI',
        form_wn_pasangan: person.warga_negara || 'WNI',
        '[form_agama_pasangan]': person.agama || 'Islam',
        form_agama_pasangan: person.agama || 'Islam',
        '[form_pekerjaan_pasangan]': person.pekerjaan || '',
        form_pekerjaan_pasangan: person.pekerjaan || '',
        '[form_alamat_pasangan]': person.alamat || '',
        form_alamat_pasangan: person.alamat || '',
      }));
    } else if (secKey === 'individu') {
      // Jika pemohon pada SPTJM Belum Memiliki Akta Lahir dipilih:
      if (isSuratBelumAkta) {
        if (targetPengajuan === 'diri_sendiri') {
          applySubjectData(res, 'diri_sendiri');
        } else if (targetPengajuan === 'anak') {
          setFormValues((prev) => {
            const upd: Record<string, string> = {};
            if ((person.jenis_kelamin || '').toLowerCase().startsWith('p')) {
              if (!prev['[form_nama_ibu]'] && !prev.form_nama_ibu) {
                upd['[form_nama_ibu]'] = person.nama || '';
                upd.form_nama_ibu = person.nama || '';
                upd['[form_nik_ibu]'] = person.nik || '';
                upd.form_nik_ibu = person.nik || '';
              }
            } else if ((person.jenis_kelamin || '').toLowerCase().startsWith('l')) {
              if (!prev['[form_nama_ayah]'] && !prev.form_nama_ayah) {
                upd['[form_nama_ayah]'] = person.nama || '';
                upd.form_nama_ayah = person.nama || '';
                upd['[form_nik_ayah]'] = person.nik || '';
                upd.form_nik_ayah = person.nik || '';
              }
            }
            return { ...prev, ...upd };
          });
        }
      }
    }

    setSearchResidentBySection((prev) => ({ ...prev, [secKey]: '' }));
    toast({
      title: `Data Pelaku (${secKey === 'individu' ? 'Utama' : secKey}) Terisi`,
      description: `${res.fullName} — NIK ${res.nik}`,
    });
  };

  const updatePersonField = (
    secKey: string,
    field: keyof OpenSidPersonData,
    value: string,
  ) => {
    setPersonDataBySection((prev) => ({
      ...prev,
      [secKey]: {
        ...(prev[secKey] || {}),
        [field]: value,
      },
    }));

    const isSaksi1 = secKey === 'saksi_1' || secKey === 'saksi1' || secKey === 'saksi_i';
    const isSaksi2 = secKey === 'saksi_2' || secKey === 'saksi2' || secKey === 'saksi_ii';
    if (isSaksi1) {
      if (field === 'nama') {
        setFormValues((prev) => ({ ...prev, '[form_nama_saksi_1]': value, form_nama_saksi_1: value, nama_saksi_1: value, namasaksii: value, nama_saksi_i: value }));
      } else if (field === 'nik') {
        setFormValues((prev) => ({ ...prev, '[form_nik_saksi_1]': value, form_nik_saksi_1: value, nik_saksi_1: value }));
      } else if (field === 'tempat_lahir') {
        setFormValues((prev) => ({ ...prev, '[form_tempat_lahir_saksi_1]': value, form_tempat_lahir_saksi_1: value, tempat_lahir_saksi_1: value }));
      } else if (field === 'tanggal_lahir') {
        setFormValues((prev) => ({ ...prev, '[form_tanggal_lahir_saksi_1]': value, form_tanggal_lahir_saksi_1: value, tanggal_lahir_saksi_1: value }));
      } else if ((field as string) === 'usia') {
        const cleanAge = value.replace(/Tahun/i, '').trim();
        setFormValues((prev) => ({ ...prev, '[form_umur_saksi_1]': cleanAge, form_umur_saksi_1: cleanAge, umursaksii: cleanAge, usia_saksi_i: cleanAge }));
      } else if (field === 'agama') {
        setFormValues((prev) => ({ ...prev, '[form_agama_saksi_1]': value, form_agama_saksi_1: value, agama_saksi_1: value }));
      } else if (field === 'pekerjaan') {
        setFormValues((prev) => ({ ...prev, '[form_pekerjaan_saksi_1]': value, form_pekerjaan_saksi_1: value, pekerjaan_saksi_1: value, pekerjaansaksii: value, pekerjaan_saksi_i: value }));
      } else if (field === 'alamat') {
        setFormValues((prev) => ({ ...prev, '[form_alamat_saksi_1]': value, form_alamat_saksi_1: value, alamat_saksi_1: value, alamatsaksii: value, alamat_saksi_i: value }));
      }
    } else if (isSaksi2) {
      if (field === 'nama') {
        setFormValues((prev) => ({ ...prev, '[form_nama_saksi_2]': value, form_nama_saksi_2: value, nama_saksi_2: value, namasaksiii: value, nama_saksi_ii: value }));
      } else if (field === 'nik') {
        setFormValues((prev) => ({ ...prev, '[form_nik_saksi_2]': value, form_nik_saksi_2: value, nik_saksi_2: value }));
      } else if (field === 'tempat_lahir') {
        setFormValues((prev) => ({ ...prev, '[form_tempat_lahir_saksi_2]': value, form_tempat_lahir_saksi_2: value, tempat_lahir_saksi_2: value }));
      } else if (field === 'tanggal_lahir') {
        setFormValues((prev) => ({ ...prev, '[form_tanggal_lahir_saksi_2]': value, form_tanggal_lahir_saksi_2: value, tanggal_lahir_saksi_2: value }));
      } else if ((field as string) === 'usia') {
        const cleanAge = value.replace(/Tahun/i, '').trim();
        setFormValues((prev) => ({ ...prev, '[form_umur_saksi_2]': cleanAge, form_umur_saksi_2: cleanAge, umursaksiii: cleanAge, usia_saksi_ii: cleanAge }));
      } else if (field === 'agama') {
        setFormValues((prev) => ({ ...prev, '[form_agama_saksi_2]': value, form_agama_saksi_2: value, agama_saksi_2: value }));
      } else if (field === 'pekerjaan') {
        setFormValues((prev) => ({ ...prev, '[form_pekerjaan_saksi_2]': value, form_pekerjaan_saksi_2: value, pekerjaan_saksi_2: value, pekerjaansaksiii: value, pekerjaan_saksi_ii: value }));
      } else if (field === 'alamat') {
        setFormValues((prev) => ({ ...prev, '[form_alamat_saksi_2]': value, form_alamat_saksi_2: value, alamat_saksi_2: value, alamatsaksiii: value, alamat_saksi_ii: value }));
      }
    } else if (secKey === 'pasangan') {
      if (field === 'nama') {
        setFormValues((prev) => ({ ...prev, '[form_nama_pasangan]': value, form_nama_pasangan: value, nama_pasangan: value }));
      } else if (field === 'nama_ayah') {
        setFormValues((prev) => ({ ...prev, '[form_nama_ayah_pasangan]': value, form_nama_ayah_pasangan: value, nama_ayah_pasangan: value }));
      } else if (field === 'nik') {
        setFormValues((prev) => ({ ...prev, '[form_nik_pasangan]': value, form_nik_pasangan: value, nik_pasangan: value }));
      } else if (field === 'tempat_lahir') {
        setFormValues((prev) => ({ ...prev, '[form_tempatlahir_pasangan]': value, form_tempatlahir_pasangan: value, tempatlahir_pasangan: value }));
      } else if (field === 'tanggal_lahir') {
        setFormValues((prev) => ({ ...prev, '[form_tanggallahir_pasangan]': value, form_tanggallahir_pasangan: value, tanggallahir_pasangan: value }));
      } else if (field === 'warga_negara') {
        setFormValues((prev) => ({ ...prev, '[form_wn_pasangan]': value, form_wn_pasangan: value }));
      } else if (field === 'agama') {
        setFormValues((prev) => ({ ...prev, '[form_agama_pasangan]': value, form_agama_pasangan: value }));
      } else if (field === 'pekerjaan') {
        setFormValues((prev) => ({ ...prev, '[form_pekerjaan_pasangan]': value, form_pekerjaan_pasangan: value }));
      } else if (field === 'alamat') {
        setFormValues((prev) => ({ ...prev, '[form_alamat_pasangan]': value, form_alamat_pasangan: value }));
      }
    }

    // AUTOFILL HEMAT KUOTA (0 Read jika di cache / 1 Read jika 16 digit NIK diketik langsung di form Umum maupun Admin)
    const cleanDigits = value.replace(/\D/g, '').trim();
    if (cleanDigits.length === 16 && firestore) {
      if (field === 'nik' && (sumberModeBySection[secKey] || '1') === '1') {
        // 1. Cek di daftar anggota 1 KK jika sudah ada di memori (0 Read!)
        const inKk = familyMembersInKk.find((r) => (r.nik || '').trim() === cleanDigits);
        if (inKk) {
          handleSelectResidentForSection(secKey, inKk);
          return;
        }
        // 2. Ambil dari cache 3-lapis atau getDoc langsung 1 dokumen
        setIsSearchingResident((prev) => ({ ...prev, [secKey]: true }));
        getResidentByNik(firestore, cleanDigits)
          .then((matched) => {
            if (matched) {
              handleSelectResidentForSection(secKey, matched);
            }
          })
          .catch((err) => console.error('Error autofilling NIK:', err))
          .finally(() => {
            setIsSearchingResident((prev) => ({ ...prev, [secKey]: false }));
          });
      } else if (field === 'nik_ayah') {
        const inKk = familyMembersInKk.find((r) => (r.nik || '').trim() === cleanDigits);
        const applyFather = (res: Resident) => {
          setPersonDataBySection((prev) => ({
            ...prev,
            [secKey]: {
              ...(prev[secKey] || {}),
              nik_ayah: cleanDigits,
              nama_ayah: res.fullName || prev[secKey]?.nama_ayah || '',
            },
          }));
          if (sectionKeys.includes('ayah')) {
            handleSelectResidentForSection('ayah', res);
          } else {
            toast({ title: 'Data Ayah Ditemukan', description: `${res.fullName} — NIK ${res.nik}` });
          }
        };
        if (inKk) {
          applyFather(inKk);
        } else {
          getResidentByNik(firestore, cleanDigits)
            .then((matched) => {
              if (matched) applyFather(matched);
            })
            .catch(() => { });
        }
      } else if (field === 'nik_ibu') {
        const inKk = familyMembersInKk.find((r) => (r.nik || '').trim() === cleanDigits);
        const applyMother = (res: Resident) => {
          setPersonDataBySection((prev) => ({
            ...prev,
            [secKey]: {
              ...(prev[secKey] || {}),
              nik_ibu: cleanDigits,
              nama_ibu: res.fullName || prev[secKey]?.nama_ibu || '',
            },
          }));
          if (sectionKeys.includes('ibu')) {
            handleSelectResidentForSection('ibu', res);
          } else {
            toast({ title: 'Data Ibu Ditemukan', description: `${res.fullName} — NIK ${res.nik}` });
          }
        };
        if (inKk) {
          applyMother(inKk);
        } else {
          getResidentByNik(firestore, cleanDigits)
            .then((matched) => {
              if (matched) applyMother(matched);
            })
            .catch(() => { });
        }
      }
    }
  };

  // Bangun konteks render untuk mesin template OpenSID
  const currentRenderContext: OpenSidRenderContext = useMemo(() => {
    const pelakuBagian: Record<string, OpenSidPersonData> = {};
    for (const key of sectionKeys) {
      if (key === 'individu') continue;
      pelakuBagian[key] = personDataBySection[key] || {};
      const prefix = formIsianMap[key]?.prefix;
      if (prefix && prefix !== key) {
        pelakuBagian[prefix] = personDataBySection[key] || {};
      }
    }

    const tglObj = tanggalSurat ? new Date(tanggalSurat) : new Date();
    return {
      judulSurat: enrichedItem.jenisSurat,
      nomorSurat: isAdmin ? nomorSurat : '',
      kodeSurat: enrichedItem.kodeSurat || '470',
      tanggalSurat: formatTanggalIndonesia(tglObj),
      hariSurat: getNamaHariIndonesia(tglObj),
      mulaiBerlaku,
      berlakuSampai,
      logoGaruda: Boolean(enrichedItem.logoGaruda),
      qrCode: Boolean(enrichedItem.qrCode),
      letterheadImageUrl: effectiveGlobalSettings.letterheadImageUrl,
      atasNama: selectedPamong.atasNama.replace(/\n/g, '<br/>'),
      jabatanPamong: selectedPamong.jabatan,
      namaPamong: selectedPamong.nama,
      nipPamong: selectedPamong.nip,
      pangkatPamong: selectedPamong.pangkat,
      individu: personDataBySection.individu || {},
      pelakuBagian,
      formValues: {
        ...formValues,
        targetPengajuan,
        peruntukanPengajuan: targetPengajuan,
      },
      familyMembers,
    };
  }, [
    sectionKeys,
    personDataBySection,
    formIsianMap,
    tanggalSurat,
    enrichedItem,
    isAdmin,
    nomorSurat,
    mulaiBerlaku,
    berlakuSampai,
    selectedPamong,
    formValues,
    familyMembers,
    effectiveGlobalSettings.letterheadImageUrl,
    targetPengajuan,
  ]);

  const renderedPreview = useMemo(
    () =>
      renderOpenSidDocumentPages(
        enrichedItem,
        currentRenderContext,
        effectiveGlobalSettings,
        customKonsepHtml || undefined,
      ),
    [enrichedItem, currentRenderContext, effectiveGlobalSettings, customKonsepHtml],
  );

  // Buka Modal Konsep Surat (seperti konsep.blade.php di OpenSID)
  const handleOpenKonsep = () => {
    const initialRendered = renderOpenSidDocumentPages(
      enrichedItem,
      currentRenderContext,
      effectiveGlobalSettings,
    );
    setCustomKonsepHtml(initialRendered.pagesHtml.join('\n<!-- pagebreak -->\n'));
    setShowKonsepModal(true);
  };

  // Simpan Pengajuan / Terbitkan Surat & Cetak
  const handleSaveSubmission = async (openPrintImmediately: boolean) => {
    const mainPerson = personDataBySection.individu || {};
    if (!mainPerson.nama || !mainPerson.nik) {
      toast({
        variant: 'destructive',
        title: 'Identitas Pemohon Belum Lengkap',
        description: 'Mohon lengkapi Nama Lengkap dan NIK (16 Digit) pada bagian Identitas Pemohon.',
      });
      return;
    }

    if (!mainPerson.jenis_kelamin) {
      toast({
        variant: 'destructive',
        title: 'Jenis Kelamin Belum Dipilih',
        description: 'Mohon pilih Jenis Kelamin pada Identitas Pemohon.',
      });
      return;
    }
    if (!mainPerson.agama) {
      toast({
        variant: 'destructive',
        title: 'Agama Belum Dipilih',
        description: 'Mohon pilih Agama pada Identitas Pemohon.',
      });
      return;
    }
    if (!mainPerson.pendidikan_kk) {
      toast({
        variant: 'destructive',
        title: 'Pendidikan Belum Dipilih',
        description: 'Mohon pilih Pendidikan dalam KK pada Identitas Pemohon.',
      });
      return;
    }
    if (!mainPerson.status_kawin) {
      toast({
        variant: 'destructive',
        title: 'Status Perkawinan Belum Dipilih',
        description: 'Mohon pilih Status Perkawinan pada Identitas Pemohon.',
      });
      return;
    }
    if (!mainPerson.pekerjaan || !mainPerson.pekerjaan.trim()) {
      toast({
        variant: 'destructive',
        title: 'Pekerjaan Belum Diisi',
        description: 'Mohon isi Pekerjaan pada Identitas Pemohon.',
      });
      return;
    }

    // Validasi saksi 1 & saksi 2 jika ada
    if (sectionKeys.includes('saksi_1')) {
      const s1 = personDataBySection.saksi_1 || {};
      if (s1.nik && !s1.pekerjaan) {
        toast({
          variant: 'destructive',
          title: 'Pekerjaan Saksi I Belum Diisi',
          description: 'Mohon lengkapi pekerjaan pada Identitas Saksi I.',
        });
        return;
      }
    }
    if (sectionKeys.includes('saksi_2')) {
      const s2 = personDataBySection.saksi_2 || {};
      if (s2.nik && !s2.pekerjaan) {
        toast({
          variant: 'destructive',
          title: 'Pekerjaan Saksi II Belum Diisi',
          description: 'Mohon lengkapi pekerjaan pada Identitas Saksi II.',
        });
        return;
      }
    }

    if (!isAdmin && (!whatsappNumber || whatsappNumber.trim().length < 9)) {
      toast({
        variant: 'destructive',
        title: 'Nomor WhatsApp Wajib Diisi',
        description: 'Mohon isi Nomor WhatsApp aktif (minimal 9 digit).',
      });
      return;
    }

    // Validasi kode isian yang wajib diisi (required === '1')
    for (const ki of enrichedItem.kodeIsian || []) {
      const isReq = ki.required === '1' || ki.required === 1 || ki.required === true;
      if (!isReq) continue;
      const cleanKode = ki.kode.replace(/^\[|\]$/g, '').toLowerCase();
      const val = formValues[ki.kode] ?? formValues[cleanKode] ?? '';
      if (!String(val).trim()) {
        toast({
          variant: 'destructive',
          title: 'Isian Wajib Belum Lengkap',
          description: `Mohon isi kolom "${ki.label || ki.nama}" terlebih dahulu.`,
        });
        return;
      }
    }

    // Validasi Berkas Lampiran untuk Pengajuan Umum (!isAdmin)
    if (!isAdmin && syaratList.length > 0) {
      const primaryReqCount = Math.min(2, syaratList.length);
      for (let i = 0; i < primaryReqCount; i++) {
        const fieldKey = `berkas_${i + 1}`;
        if (!filesToUpload[fieldKey]) {
          toast({
            variant: 'destructive',
            title: 'Berkas Persyaratan Belum Lengkap',
            description: `Mohon unggah berkas "${syaratList[i]}" terlebih dahulu.`,
          });
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const finalRendered = renderOpenSidDocumentPages(
        enrichedItem,
        currentRenderContext,
        effectiveGlobalSettings,
        customKonsepHtml || undefined,
      );

      // Konversi berkas lampiran yang diunggah
      const filesData: FileToUpload[] = await Promise.all(
        Object.entries(filesToUpload).map(async ([fieldKey, file]) => {
          const base64Data = await fileToBase64(file);
          const idx = Number(fieldKey.replace('berkas_', '')) - 1;
          const labelDoc = (syaratList[idx] || fieldKey)
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .toUpperCase();
          return {
            fieldName: syaratList[idx] || fieldKey,
            base64Data,
            mimeType: file.type,
            targetFileName: `${labelDoc}_${mainPerson.nik}.${file.name.split('.').pop()}`,
          };
        }),
      );

      const resolvedPurpose =
        formValues['[form_keperluan]'] ||
        formValues.form_keperluan ||
        formValues['[form_keterangan]'] ||
        formValues.form_keterangan ||
        formValues['[form_tujuan]'] ||
        formValues.form_tujuan ||
        `Permohonan ${enrichedItem.jenisSurat}`;

      // Siapkan formData gabungan agar kompatibel baik dengan OpenSID template, lampiran, maupun detail submission-list
      const combinedFormData: Record<string, any> = {
        fullName: mainPerson.nama,
        name: mainPerson.nama,
        nik: mainPerson.nik,
        kkNumber: mainPerson.no_kk || '-',
        headOfFamilyName: mainPerson.kepala_kk || mainPerson.nama || '-',
        placeOfBirth: mainPerson.tempat_lahir || '-',
        dateOfBirth: mainPerson.tanggal_lahir || '-',
        birthPlace: mainPerson.tempat_lahir || '-',
        birthDate: mainPerson.tanggal_lahir || '-',
        gender: mainPerson.jenis_kelamin || 'Laki-laki',
        religion: mainPerson.agama || 'Islam',
        education: mainPerson.pendidikan_kk || 'SLTA / Sederajat',
        occupation: mainPerson.pekerjaan || '-',
        job: mainPerson.pekerjaan || '-',
        maritalStatus: mainPerson.status_kawin || 'Kawin',
        nationality: mainPerson.warga_negara || 'WNI',
        bloodType: mainPerson.golongan_darah || '-',
        shdk: mainPerson.hubungan_kk || 'Kepala Keluarga',
        address: mainPerson.alamat || '-',
        rt: mainPerson.rt || '001',
        rw: mainPerson.rw || '001',
        dusun: mainPerson.dusun || 'Sampeldes',
        fatherName: mainPerson.nama_ayah || '-',
        fatherNik: mainPerson.nik_ayah || '-',
        motherName: mainPerson.nama_ibu || '-',
        motherNik: mainPerson.nik_ibu || '-',
        phoneNumber: whatsappNumber || '-',
        email: requesterEmail || '',
        purpose: resolvedPurpose,
        mulaiBerlaku,
        berlakuSampai,
        pejabatNama: selectedPamong.nama,
        pejabatJabatan: selectedPamong.jabatan,
        atasNama: selectedPamong.atasNama,
        urlSurat: enrichedItem.urlSurat || '',
        kodeSurat: enrichedItem.kodeSurat || '470',
        masterSuratId: enrichedItem.id,
        targetPengajuan,
        peruntukanPengajuan: targetPengajuan,
        familyMembers,
        anggotaKeluarga: familyMembers,
        witness1Name: personDataBySection.saksi_1?.nama || formValues['[form_nama_saksi_1]'] || formValues.form_nama_saksi_1 || '',
        witness1Nik: personDataBySection.saksi_1?.nik || formValues['[form_nik_saksi_1]'] || formValues.form_nik_saksi_1 || '',
        witness1BirthPlace: personDataBySection.saksi_1?.tempat_lahir || formValues['[form_tempat_lahir_saksi_1]'] || formValues.form_tempat_lahir_saksi_1 || '',
        witness1BirthDate: personDataBySection.saksi_1?.tanggal_lahir || formValues['[form_tanggal_lahir_saksi_1]'] || formValues.form_tanggal_lahir_saksi_1 || '',
        witness1Religion: personDataBySection.saksi_1?.agama || formValues['[form_agama_saksi_1]'] || formValues.form_agama_saksi_1 || '',
        witness1Job: personDataBySection.saksi_1?.pekerjaan || formValues['[form_pekerjaan_saksi_1]'] || formValues.form_pekerjaan_saksi_1 || '',
        witness1Address: personDataBySection.saksi_1?.alamat || formValues['[form_alamat_saksi_1]'] || formValues.form_alamat_saksi_1 || '',
        witness2Name: personDataBySection.saksi_2?.nama || formValues['[form_nama_saksi_2]'] || formValues.form_nama_saksi_2 || '',
        witness2Nik: personDataBySection.saksi_2?.nik || formValues['[form_nik_saksi_2]'] || formValues.form_nik_saksi_2 || '',
        witness2BirthPlace: personDataBySection.saksi_2?.tempat_lahir || formValues['[form_tempat_lahir_saksi_2]'] || formValues.form_tempat_lahir_saksi_2 || '',
        witness2BirthDate: personDataBySection.saksi_2?.tanggal_lahir || formValues['[form_tanggal_lahir_saksi_2]'] || formValues.form_tanggal_lahir_saksi_2 || '',
        witness2Religion: personDataBySection.saksi_2?.agama || formValues['[form_agama_saksi_2]'] || formValues.form_agama_saksi_2 || '',
        witness2Job: personDataBySection.saksi_2?.pekerjaan || formValues['[form_pekerjaan_saksi_2]'] || formValues.form_pekerjaan_saksi_2 || '',
        witness2Address: personDataBySection.saksi_2?.alamat || formValues['[form_alamat_saksi_2]'] || formValues.form_alamat_saksi_2 || '',
        ...formValues,
        openSidPelakuBagian: personDataBySection,
        openSidRenderedPages: isAdmin ? finalRendered.pagesHtml : [],
        openSidCustomKonsepHtml: customKonsepHtml || '',
        openSidHeaderHtml: finalRendered.headerRendered || '',
        openSidFooterHtml: finalRendered.footerRendered || '',
        openSidMargin: finalRendered.margin,
        openSidUkuran: finalRendered.ukuran || 'F4',
        openSidOrientasi: finalRendered.orientasi || 'Potrait',
        openSidHeaderMode: enrichedItem.header ?? 1,
        openSidShowFooter: enrichedItem.footer !== false,
      };

      // Bersihkan seluruh nilai undefined agar kompatibel 100% dengan Firestore
      const cleanCombinedFormData: Record<string, any> = {};
      for (const [k, v] of Object.entries(combinedFormData)) {
        if (v !== undefined) {
          cleanCombinedFormData[k] = v;
        }
      }

      const ticketNumber = `BLS-${Date.now().toString().slice(-6)}`;

      if (firestore) {
        const docRef = await addSubmission(firestore, {
          ticketNumber,
          nik: mainPerson.nik,
          requesterName: mainPerson.nama,
          phoneNumber: whatsappNumber || '-',
          email: requesterEmail || '',
          letterType: enrichedItem.jenisSurat,
          urlSurat: enrichedItem.urlSurat || '',
          kodeSurat: enrichedItem.kodeSurat || '470',
          masterSuratId: enrichedItem.id,
          status: isAdmin ? 'approved' : 'pending',
          documentNumber: isAdmin ? nomorSurat : '',
          purpose: resolvedPurpose,
          formData: cleanCombinedFormData,
          filesToUpload: filesData,
        });

        if (isAdmin) {
          toast({
            title: 'Surat Berhasil Diterbitkan',
            description: `Nomor Surat: ${nomorSurat}`,
          });
          if (openPrintImmediately) {
            router.push(`/print/${docRef.id}?mode=opensid`);
          } else {
            router.push('/admin/surat');
          }
        } else {
          toast({
            title: 'Permohonan Surat Berhasil Dikirim!',
            description: `Nomor Tiket Anda: ${ticketNumber}`,
          });
          setSubmittedTicket(ticketNumber);
        }
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan Permohonan Surat',
        description: err?.message || 'Terjadi kesalahan saat menyimpan data surat.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tampilkan Tiket Pengecekan Progres setelah warga selesai mengisi form di tampilan umum (/layanan-surat)
  if (!isAdmin && submittedTicket) {
    return <SubmissionSuccess ticketNumber={submittedTicket} onReset={handleResetForm} />;
  }

  return (
    <div className="space-y-6">
      {/* Banner Info Layanan Surat */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">{enrichedItem.jenisSurat}</h4>
              <Badge className="bg-emerald-700 text-[10px] text-white">
                Kode: {enrichedItem.kodeSurat}
              </Badge>
              {isAdmin && (
                <Badge variant="outline" className="border-emerald-300 bg-white text-[10px] text-emerald-800">
                  {sectionKeys.length} Bagian Pelaku • {(enrichedItem.kodeIsian || []).length} Isian Form
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-600">
              {isAdmin
                ? 'Formulir ini mengikuti konfigurasi Umum, Template, dan Form Isian pada Master Surat OpenSID.'
                : 'Lengkapi data identitas pemohon, keperluan pengajuan surat, dan unggah berkas persyaratan di bawah ini.'}
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenKonsep}
              className="gap-1.5 border-indigo-300 bg-white text-xs font-bold text-indigo-700 hover:bg-indigo-50"
            >
              <Eye className="h-3.5 w-3.5" />
              Pratinjau & Sunting Konsep Surat
            </Button>
          </div>
        )}
      </div>

      {/* 1. KHUSUS ADMIN: PENGATURAN NOMOR SURAT, TANGGAL, MASA BERLAKU & PENANDATANGAN */}
      {isAdmin ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
            <Calendar className="h-4 w-4 text-emerald-700" />
            Penomoran Surat, Masa Berlaku & Pejabat Penandatangan
          </h4>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-5">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Nomor Surat <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1.5">
                <Input
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                  className="font-mono text-xs font-bold"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const fmt = enrichedItem.formatNomorGlobal
                      ? globalSettings.formatNomorGlobal || OPENSID_FORMAT_NOMOR_DEFAULT
                      : enrichedItem.formatNomor || OPENSID_FORMAT_NOMOR_DEFAULT;
                    setNomorSurat(
                      formatPenomoranSuratOpenSid({
                        formatNomor: fmt,
                        nomorUrut,
                        kodeSurat: enrichedItem.kodeSurat || '470',
                        tanggal: new Date(tanggalSurat || new Date()),
                      }),
                    );
                  }}
                  title="Reset Nomor Otomatis"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Tanggal Cetak Surat
              </label>
              <Input
                type="date"
                value={tanggalSurat}
                onChange={(e) => setTanggalSurat(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="md:col-span-4">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Ditandatangani Oleh (Pamong / Atas Nama)
              </label>
              <select
                value={selectedPamongId}
                onChange={(e) => setSelectedPamongId(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold"
              >
                {pamongList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.jabatan} — {p.nama}
                  </option>
                ))}
              </select>
            </div>

            {(enrichedItem.masaBerlakuValue ?? 1) > 0 && (
              <>
                <div className="md:col-span-4">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Mulai Berlaku
                  </label>
                  <Input
                    value={mulaiBerlaku}
                    onChange={(e) => setMulaiBerlaku(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Berlaku Sampai ({enrichedItem.masaBerlaku || '1 Bulan'})
                  </label>
                  <Input
                    value={berlakuSampai}
                    onChange={(e) => setBerlakuSampai(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-4">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                No. WhatsApp Pemohon (Notifikasi) {isAdmin ? <span className="text-slate-400 font-normal text-xs">(Opsional)</span> : <span className="text-red-500">*</span>}
              </label>
              <Input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder={isAdmin ? "Opsional untuk pengajuan admin" : "Contoh: 081234567890"}
                className="text-xs"
              />
            </div>
          </div>
        </div>
      ) : (
        /* TAMPILAN UMUM (/layanan-surat): KONTAK & NOTIFIKASI PEMOHON (Tanpa Penomoran Surat / Pejabat) */
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
            <Phone className="h-4 w-4 text-emerald-700" />
            Kontak & Notifikasi Pemohon
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-6">
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Nomor WhatsApp Aktif {isAdmin ? <span className="text-slate-400 font-normal text-xs">(Opsional)</span> : <span className="text-red-500">*</span>}
              </label>
              <Input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder={isAdmin ? "Opsional untuk pengajuan admin" : "Contoh: 081234567890 (Untuk notifikasi status & tiket surat)"}
                className="h-9 text-xs"
              />
            </div>
            <div className="md:col-span-6">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Alamat Email Pemohon (Opsional)
              </label>
              <Input
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                placeholder="nama@email.com"
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* KHUSUS SURAT PERNYATAAN BELUM MEMILIKI AKTA LAHIR (SPTJM): PILIHAN TARGET PENGAJUAN */}
      {isSuratBelumAkta && (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/60 p-5 shadow-xs">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                ★
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                Peruntukan Pengajuan Surat Pernyataan Belum Memiliki Akta Lahir (SPTJM)
              </h4>
            </div>
            <span className="text-[11px] text-indigo-700">
              Pilih siapa subjek yang dimohonkan/diterangkan belum memiliki akta kelahiran
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => {
                setTargetPengajuan('anak');
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center transition-all ${targetPengajuan === 'anak'
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}
            >
              <span className="text-xs font-bold sm:text-sm">🧒 Untuk Anak Kandung</span>
              <span className="text-[10px] opacity-80">Orang Tua sebagai Pemohon</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTargetPengajuan('diri_sendiri');
                applySubjectData(null, 'diri_sendiri');
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center transition-all ${targetPengajuan === 'diri_sendiri'
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}
            >
              <span className="text-xs font-bold sm:text-sm">👤 Untuk Diri Sendiri</span>
              <span className="text-[10px] opacity-80">Pemohon Belum Punya Akta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTargetPengajuan('istri');
                const istriRes = familyMembersInKk.find(
                  (r) =>
                    (r as any).shdk === 'ISTRI' ||
                    (r as any).shdk === 'SUAMI' ||
                    r.relationshipToHeadOfFamily === 'ISTRI' ||
                    r.relationshipToHeadOfFamily === 'SUAMI',
                );
                if (istriRes) applySubjectData(istriRes, 'istri');
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center transition-all ${targetPengajuan === 'istri'
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}
            >
              <span className="text-xs font-bold sm:text-sm">💍 Untuk Suami / Istri</span>
              <span className="text-[10px] opacity-80">Pengajuan untuk Pasangan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTargetPengajuan('keluarga_lain');
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center transition-all ${targetPengajuan === 'keluarga_lain'
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}
            >
              <span className="text-xs font-bold sm:text-sm">👥 Keluarga Lain</span>
              <span className="text-[10px] opacity-80">Famili / Kerabat dalam KK</span>
            </button>
          </div>

          {/* Quick-pick dari Anggota 1 KK bila tersedia */}
          {targetPengajuan !== 'diri_sendiri' && familyMembersInKk.length > 0 && (
            <div className="mt-3.5 rounded-xl border border-indigo-200/80 bg-white p-3.5">
              <label className="mb-2 block text-xs font-bold text-indigo-950">
                Pilih Cepat Subjek dari Anggota Keluarga 1 KK (No. KK: {personDataBySection.individu?.no_kk || '-'}) :
              </label>
              <div className="flex flex-wrap gap-2">
                {familyMembersInKk.map((r) => {
                  const isCur =
                    formValues['[form_nik_anak]'] === r.nik || formValues.form_nik_anak === r.nik;
                  return (
                    <button
                      key={r.id || r.nik}
                      type="button"
                      onClick={() => applySubjectData(r, targetPengajuan)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${isCur
                        ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/60'
                        }`}
                    >
                      <span className="font-semibold">{r.fullName}</span>
                      <Badge variant="outline" className="border-indigo-200 text-[10px]">
                        {(r as any).shdk || r.relationshipToHeadOfFamily || 'Anggota'}
                      </Badge>
                      <span className="font-mono text-[10px] text-slate-400">NIK: {r.nik}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. LOOP SETIAP BAGIAN FORM PELAKU & KODE ISIAN (individu, ayah, ibu, saksi_i, pembeli, barang, tanah, dll.) */}
      {sectionKeys.map((secKey) => {
        const cfg = formIsianMap[secKey] || normalizeFormSectionConfig(secKey, {});
        const showSumberPenduduk = Number(cfg.sumber ?? 1) === 1;
        const allowedDataSources = Array.isArray(cfg.data) && cfg.data.length > 0 ? cfg.data : ['1'];
        const currentSumberMode =
          sumberModeBySection[secKey] || (allowedDataSources.includes('1') ? '1' : '2');
        const person = personDataBySection[secKey] || {};
        const searchQ = searchResidentBySection[secKey] || '';

        // Hasil pencarian on-demand dari Firestore (Maks 8 dokumen per query)
        const matchingResidents = (matchingResidentsBySection[secKey] || []).filter((r) => {
          if (cfg.sex === '1' && r.gender !== 'Laki-laki') return false;
          if (cfg.sex === '2' && r.gender !== 'Perempuan') return false;
          return true;
        });

        const sectionKodeIsian = (enrichedItem.kodeIsian || []).filter(
          (ki) => (ki.kategori || 'individu') === secKey,
        );

        return (
          <div
            key={secKey}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs"
          >
            {/* Header Bagian Form */}
            {cfg.label !== '-' && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    {isSuratBelumAkta && secKey === 'individu'
                      ? targetPengajuan === 'diri_sendiri'
                        ? 'Identitas Pemohon (Yang Membuat Pernyataan & Belum Memiliki Akta)'
                        : targetPengajuan === 'istri' || targetPengajuan === 'suami'
                          ? 'Yang Membuat Pernyataan (Pemohon / Pasangan)'
                          : targetPengajuan === 'keluarga_lain'
                            ? 'Yang Membuat Pernyataan (Pemohon / Penanggung Jawab)'
                            : 'Yang Membuat Pernyataan (Pemohon / Orang Tua)'
                      : cfg.label || cfg.judul || (secKey === 'individu' ? 'Identitas Pemohon' : secKey)}
                  </h4>
                  {Number(cfg.sumber_wajib) === 1 && (
                    <Badge variant="outline" className="border-red-200 bg-red-50 text-[10px] text-red-700">
                      Wajib Diisi
                    </Badge>
                  )}
                </div>

                {/* Pilihan Sumber Data: Penduduk Desa vs Penduduk Luar Desa */}
                {showSumberPenduduk && allowedDataSources.length > 1 && (
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                    {allowedDataSources.includes('1') && (
                      <button
                        type="button"
                        onClick={() =>
                          setSumberModeBySection((prev) => ({ ...prev, [secKey]: '1' }))
                        }
                        className={`rounded px-2.5 py-1 text-xs font-semibold ${currentSumberMode === '1'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        Penduduk Desa
                      </button>
                    )}
                    {allowedDataSources.includes('2') && (
                      <button
                        type="button"
                        onClick={() =>
                          setSumberModeBySection((prev) => ({ ...prev, [secKey]: '2' }))
                        }
                        className={`rounded px-2.5 py-1 text-xs font-semibold ${currentSumberMode === '2'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        Penduduk Luar Desa
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-5 p-5">
              {/* Alert Info Bagian (Jika ada) */}
              {cfg.info && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>{cfg.info}</span>
                </div>
              )}

              {/* Blok Pencarian & Identitas Penduduk (Jika sumber == 1) */}
              {showSumberPenduduk && (
                <div className="space-y-4">
                  {isAdmin && currentSumberMode === '1' && (
                    <div className="relative">
                      <label className="mb-1 block text-xs font-bold text-slate-700">
                        Cari NIK / Nama Penduduk Desa Sampeldes
                      </label>
                      <div className="relative">
                        <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                        <Input
                          value={searchQ}
                          onChange={(e) =>
                            setSearchResidentBySection((prev) => ({
                              ...prev,
                              [secKey]: e.target.value,
                            }))
                          }
                          placeholder="Ketik NIK atau Nama Lengkap Warga untuk mengisi otomatis..."
                          className="border-blue-200 bg-blue-50/30 pl-9 pr-8 text-xs"
                        />
                        {isSearchingResident[secKey] && (
                          <div className="absolute right-2.5 top-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          </div>
                        )}
                      </div>

                      {matchingResidents.length > 0 && (
                        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                          {matchingResidents.map((res) => (
                            <button
                              key={res.id}
                              type="button"
                              onClick={() => handleSelectResidentForSection(secKey, res)}
                              className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-2.5 text-left text-xs hover:bg-blue-50"
                            >
                              <div>
                                <span className="font-bold text-slate-900">{res.fullName}</span>
                                <span className="ml-2 font-mono text-slate-500">NIK: {res.nik}</span>
                                <span className="block text-[11px] text-slate-500">
                                  {res.gender} • {res.placeOfBirth}, {res.dateOfBirth} • {res.address} RT {res.rt}/RW {res.rw}
                                </span>
                              </div>
                              <Badge className="bg-blue-600 text-white">Pilih</Badge>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Data Individu / Pelaku */}
                  <div className="grid grid-cols-1 gap-3.5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <label className="mb-1 flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>
                          NIK (16 Digit) <span className="text-red-500">*</span>
                        </span>
                        {isSearchingResident[secKey] ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600">
                            <Loader2 className="h-3 w-3 animate-spin" /> Memuat data...
                          </span>
                        ) : (
                          <span className="text-[10px] font-normal text-emerald-700">
                            Auto-fill 16 digit
                          </span>
                        )}
                      </label>
                      <Input
                        value={person.nik || ''}
                        onChange={(e) => updatePersonField(secKey, 'nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                        placeholder="Ketik 16 Digit NIK (Isi Otomatis)"
                        maxLength={16}
                        className="h-8 bg-white font-mono text-xs"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={person.nama || ''}
                        onChange={(e) => updatePersonField(secKey, 'nama', e.target.value)}
                        placeholder="Nama Lengkap Sesuai KTP"
                        className="h-8 bg-white text-xs font-semibold"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Nomor Kartu Keluarga (KK)
                      </label>
                      <Input
                        value={person.no_kk || ''}
                        onChange={(e) => updatePersonField(secKey, 'no_kk', e.target.value.replace(/\D/g, '').slice(0, 16))}
                        placeholder="16 Digit Nomor KK"
                        maxLength={16}
                        className="h-8 bg-white font-mono text-xs"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Tempat Lahir
                      </label>
                      <Input
                        value={person.tempat_lahir || ''}
                        onChange={(e) => updatePersonField(secKey, 'tempat_lahir', e.target.value)}
                        placeholder="Pasuruan"
                        className="h-8 bg-white text-xs"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Tanggal Lahir ({person.tanggal_lahir ? hitungUmurIndonesia(person.tanggal_lahir) : 'Umur'})
                      </label>
                      <Input
                        type="date"
                        value={person.tanggal_lahir || ''}
                        onChange={(e) => updatePersonField(secKey, 'tanggal_lahir', e.target.value)}
                        className="h-8 bg-white text-xs"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Jenis Kelamin <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={person.jenis_kelamin || ''}
                        onChange={(e) => updatePersonField(secKey, 'jenis_kelamin', e.target.value)}
                        className={`h-8 w-full rounded border px-2 text-xs transition-colors ${!person.jenis_kelamin
                          ? 'border-red-400 bg-red-50/20 font-medium text-red-900'
                          : 'border-slate-300 bg-white'
                          }`}
                      >
                        <option value="">-- Pilih Jenis Kelamin --</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                      {!person.jenis_kelamin && (
                        <span className="mt-0.5 block text-[10px] font-medium text-red-600">
                          * Wajib dipilih
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-3">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Agama <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={person.agama || ''}
                        onChange={(e) => updatePersonField(secKey, 'agama', e.target.value)}
                        className={`h-8 w-full rounded border px-2 text-xs transition-colors ${!person.agama
                          ? 'border-red-400 bg-red-50/20 font-medium text-red-900'
                          : 'border-slate-300 bg-white'
                          }`}
                      >
                        <option value="">-- Pilih Agama --</option>
                        {OPENSID_REFERENSI_DATA.Agama.map((ag) => (
                          <option key={ag} value={ag}>
                            {ag}
                          </option>
                        ))}
                      </select>
                      {!person.agama && (
                        <span className="mt-0.5 block text-[10px] font-medium text-red-600">
                          * Wajib dipilih
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-4">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Pendidikan dalam KK <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={person.pendidikan_kk || ''}
                        onChange={(e) => updatePersonField(secKey, 'pendidikan_kk', e.target.value)}
                        className={`h-8 w-full rounded border px-2 text-xs transition-colors ${!person.pendidikan_kk
                          ? 'border-red-400 bg-red-50/20 font-medium text-red-900'
                          : 'border-slate-300 bg-white'
                          }`}
                      >
                        <option value="">-- Pilih Pendidikan dalam KK --</option>
                        {OPENSID_REFERENSI_DATA['Pendidikan Dalam KK'].map((pd) => (
                          <option key={pd} value={pd}>
                            {pd}
                          </option>
                        ))}
                      </select>
                      {!person.pendidikan_kk && (
                        <span className="mt-0.5 block text-[10px] font-medium text-red-600">
                          * Wajib dipilih
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-4">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Pekerjaan <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={person.pekerjaan || ''}
                        onChange={(e) => updatePersonField(secKey, 'pekerjaan', e.target.value)}
                        placeholder="Wiraswasta / Karyawan Swasta / Pelajar"
                        className={`h-8 text-xs ${!person.pekerjaan
                          ? 'border-red-400 bg-red-50/20 text-red-900'
                          : 'border-slate-300 bg-white'
                          }`}
                      />
                      {!person.pekerjaan && (
                        <span className="mt-0.5 block text-[10px] font-medium text-red-600">
                          * Wajib diisi
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-4">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Status Perkawinan <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={person.status_kawin || ''}
                        onChange={(e) => updatePersonField(secKey, 'status_kawin', e.target.value)}
                        className={`h-8 w-full rounded border px-2 text-xs transition-colors ${!person.status_kawin
                          ? 'border-red-400 bg-red-50/20 font-medium text-red-900'
                          : 'border-slate-300 bg-white'
                          }`}
                      >
                        <option value="">-- Pilih Status Perkawinan --</option>
                        {OPENSID_REFERENSI_DATA['Status Perkawinan'].map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      {!person.status_kawin && (
                        <span className="mt-0.5 block text-[10px] font-medium text-red-600">
                          * Wajib dipilih
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-3">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Kewarganegaraan
                      </label>
                      <Input
                        value={person.warga_negara || 'WNI'}
                        onChange={(e) => updatePersonField(secKey, 'warga_negara', e.target.value)}
                        className="h-8 bg-white text-xs"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Golongan Darah
                      </label>
                      <select
                        value={person.golongan_darah || ''}
                        onChange={(e) => updatePersonField(secKey, 'golongan_darah', e.target.value)}
                        className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                      >
                        <option value="">-- Pilih Golongan Darah --</option>
                        {OPENSID_REFERENSI_DATA['Golongan Darah'].map((gd) => (
                          <option key={gd} value={gd}>
                            {gd}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        RT
                      </label>
                      <Input
                        value={person.rt || ''}
                        onChange={(e) => updatePersonField(secKey, 'rt', e.target.value)}
                        placeholder="001"
                        className="h-8 bg-white text-xs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        RW
                      </label>
                      <Input
                        value={person.rw || ''}
                        onChange={(e) => updatePersonField(secKey, 'rw', e.target.value)}
                        placeholder="001"
                        className="h-8 bg-white text-xs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Dusun
                      </label>
                      <Input
                        value={person.dusun || ''}
                        onChange={(e) => updatePersonField(secKey, 'dusun', e.target.value)}
                        placeholder="Sampeldes"
                        className="h-8 bg-white text-xs"
                      />
                    </div>

                    <div className="md:col-span-12">
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Alamat Tempat Tinggal Lengkap
                      </label>
                      <Input
                        value={person.alamat || ''}
                        onChange={(e) => updatePersonField(secKey, 'alamat', e.target.value)}
                        placeholder="Dusun Sampeldes RT 001 / RW 001, Desa Sampeldes, Kec. Gempol, Kab. Pasuruan"
                        className="h-8 bg-white text-xs"
                      />
                    </div>

                    {secKey === 'individu' && (
                      <>
                        <div className="md:col-span-3">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            Nama Ayah Kandung
                          </label>
                          <Input
                            value={person.nama_ayah || ''}
                            onChange={(e) => updatePersonField(secKey, 'nama_ayah', e.target.value)}
                            placeholder="Nama Lengkap Ayah"
                            className="h-8 bg-white text-xs"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            NIK Ayah Kandung
                          </label>
                          <Input
                            value={person.nik_ayah || ''}
                            onChange={(e) => updatePersonField(secKey, 'nik_ayah', e.target.value)}
                            placeholder="16 Digit NIK Ayah (Opsional)"
                            className="h-8 bg-white font-mono text-xs"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            Nama Ibu Kandung
                          </label>
                          <Input
                            value={person.nama_ibu || ''}
                            onChange={(e) => updatePersonField(secKey, 'nama_ibu', e.target.value)}
                            placeholder="Nama Lengkap Ibu"
                            className="h-8 bg-white text-xs"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            NIK Ibu Kandung
                          </label>
                          <Input
                            value={person.nik_ibu || ''}
                            onChange={(e) => updatePersonField(secKey, 'nik_ibu', e.target.value)}
                            placeholder="16 Digit NIK Ibu (Opsional)"
                            className="h-8 bg-white font-mono text-xs"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Banner Penjelas Subjek SPTJM Belum Berakta */}
              {isSuratBelumAkta && secKey === 'individu' && (
                <div className="mb-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-white to-blue-50/80 p-3.5 text-indigo-950 shadow-xs">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px]">
                      ★
                    </span>
                    <span className="tracking-wide">
                      {targetPengajuan === 'diri_sendiri'
                        ? 'DATA PEMOHON YANG DITERANGKAN BELUM MEMILIKI AKTA LAHIR & KELAHIRAN'
                        : targetPengajuan === 'istri' || targetPengajuan === 'suami'
                          ? 'DATA SUAMI / ISTRI YANG DITERANGKAN BELUM MEMILIKI AKTA LAHIR & KELAHIRAN'
                          : targetPengajuan === 'keluarga_lain'
                            ? 'DATA ANGGOTA KELUARGA YANG DITERANGKAN BELUM MEMILIKI AKTA LAHIR & KELAHIRAN'
                            : 'DATA ANAK KANDUNG YANG DITERANGKAN BELUM MEMILIKI AKTA LAHIR & KELAHIRAN'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-indigo-700">
                    {targetPengajuan === 'diri_sendiri'
                      ? 'Data diri pemohon otomatis tersinkronisasi ke isian di bawah ini. Silakan lengkapi data urutan kelahiran, orang tua kandung, penolong kelahiran, dan para saksi.'
                      : 'Isian di bawah ini telah disesuaikan untuk subjek yang dimohonkan. Silakan lengkapi identitas kelahiran, orang tua kandung, penolong kelahiran, dan para saksi.'}
                  </p>
                </div>
              )}

              {/* Daftar Kode Isian Dinamis pada Bagian Ini */}
              {sectionKodeIsian.length > 0 && (
                <div className="grid grid-cols-1 gap-4 pt-1 md:grid-cols-12">
                  {sectionKodeIsian.map((ki, idx) => {
                    const colNum = Math.min(12, Math.max(3, Number(ki.kolom || 6)));
                    const colClass =
                      colNum === 12
                        ? 'md:col-span-12'
                        : colNum >= 8
                          ? 'md:col-span-8'
                          : colNum === 6
                            ? 'md:col-span-6'
                            : colNum === 4
                              ? 'md:col-span-4'
                              : 'md:col-span-3';

                    const isReq = ki.required === '1' || ki.required === 1 || ki.required === true;
                    const cleanKode = ki.kode.replace(/^\[|\]$/g, '').toLowerCase();
                    const val = formValues[ki.kode] ?? formValues[cleanKode] ?? '';

                    const fieldLabel = isSuratBelumAkta
                      ? getDynamicBelumAktaLabel(ki.label || ki.nama, ki.kode, targetPengajuan)
                      : ki.label || ki.nama;

                    const handleChangeVal = (nextVal: string) => {
                      setFormValues((prev) => ({
                        ...prev,
                        [ki.kode]: nextVal,
                        [cleanKode]: nextVal,
                      }));

                      // Autofill kodeIsian bertipe NIK (Ayah, Ibu, Saksi 1, Saksi 2, Pasangan, dll.) dengan 0/1 Read
                      if (cleanKode.includes('nik') && cleanKode !== 'form_nik_anak' && cleanKode !== 'nik_anak') {
                        const cleanDigits = nextVal.replace(/\D/g, '').trim();
                        if (cleanDigits.length === 16 && firestore) {
                          const inKk = familyMembersInKk.find((r) => (r.nik || '').trim() === cleanDigits);
                          const applyDynamicNik = (res: Resident) => {
                            const anyR = res as any;
                            const rt = (res.rt || '001').trim();
                            const rw = (res.rw || '001').trim();
                            const alamatRes =
                              res.address && res.address.includes('RT')
                                ? `${res.address}, ${identity.sebutanDesa} ${identity.namaDesa}`
                                : `${res.address || 'Dusun Sampeldes'} RT ${rt} RW ${rw}, ${identity.sebutanDesa} ${identity.namaDesa}`;
                            const tglLahir = res.dateOfBirth || anyR.birthDate || '';
                            const umurStr = tglLahir ? hitungUmurIndonesia(tglLahir) : '';
                            const pekerjaanRes = (res.occupation || anyR.pekerjaan || '-').trim();
                            const tempatLahirRes = res.placeOfBirth || anyR.birthPlace || '';
                            const agamaRes = res.religion || anyR.agama || 'Islam';

                            // Deteksi sufik peran (ayah, ibu, saksi_1, saksi_2, pasangan, istri, suami)
                            const roleSuffix = cleanKode
                              .replace(/^form_nik_/, '')
                              .replace(/^nik_/, '');

                            if (roleSuffix) {
                              setFormValues((prev) => {
                                const upd: Record<string, string> = {
                                  [`[form_nama_${roleSuffix}]`]: res.fullName || '',
                                  [`form_nama_${roleSuffix}`]: res.fullName || '',
                                  [`[form_tempat_lahir_${roleSuffix}]`]: tempatLahirRes,
                                  [`form_tempat_lahir_${roleSuffix}`]: tempatLahirRes,
                                  [`[form_tanggal_lahir_${roleSuffix}]`]: tglLahir,
                                  [`form_tanggal_lahir_${roleSuffix}`]: tglLahir,
                                  [`[form_umur_${roleSuffix}]`]: umurStr,
                                  [`form_umur_${roleSuffix}`]: umurStr,
                                  [`[form_pekerjaan_${roleSuffix}]`]: pekerjaanRes,
                                  [`form_pekerjaan_${roleSuffix}`]: pekerjaanRes,
                                  [`[form_agama_${roleSuffix}]`]: agamaRes,
                                  [`form_agama_${roleSuffix}`]: agamaRes,
                                  [`[form_alamat_${roleSuffix}]`]: alamatRes,
                                  [`form_alamat_${roleSuffix}`]: alamatRes,
                                };
                                return { ...prev, ...upd };
                              });
                              toast({
                                title: `Data ${roleSuffix.replace(/_/g, ' ').toUpperCase()} Terisi Otomatis`,
                                description: `${res.fullName} — NIK ${res.nik}`,
                              });
                            }
                          };

                          if (inKk) {
                            applyDynamicNik(inKk);
                          } else {
                            getResidentByNik(firestore, cleanDigits)
                              .then((matched) => {
                                if (matched) applyDynamicNik(matched);
                              })
                              .catch(() => { });
                          }
                        }
                      }
                    };

                    return (
                      <div key={`${ki.kode}-${idx}`} className={colClass}>
                        <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>
                            {fieldLabel}{' '}
                            {isReq && <span className="text-red-500">*</span>}
                            {isSuratBelumAkta && targetPengajuan === 'diri_sendiri' && cleanKode.includes('anak') && (
                              <span className="ml-1.5 inline-flex items-center rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700">
                                Sinkron Pemohon
                              </span>
                            )}
                          </span>
                          {isAdmin && (
                            <code className="font-mono text-[10px] font-normal text-slate-400">
                              {ki.kode}
                            </code>
                          )}
                        </label>

                        {ki.tipe === 'textarea' ? (
                          <Textarea
                            value={val}
                            onChange={(e) => handleChangeVal(e.target.value)}
                            placeholder={ki.deskripsi || `Masukkan ${fieldLabel}...`}
                            className="min-h-[80px] text-xs"
                          />
                        ) : ki.tipe === 'select-manual' || (ki.tipe === 'select' && Array.isArray(ki.pilihan)) ? (
                          <select
                            value={val}
                            onChange={(e) => handleChangeVal(e.target.value)}
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs"
                          >
                            <option value="">-- Pilih {fieldLabel} --</option>
                            {(Array.isArray(ki.pilihan) ? ki.pilihan : []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : ki.tipe === 'select-otomatis' ? (
                          <select
                            value={val}
                            onChange={(e) => handleChangeVal(e.target.value)}
                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs"
                          >
                            <option value="">-- Pilih {fieldLabel} --</option>
                            {(OPENSID_REFERENSI_DATA[ki.refrensi || 'Agama'] || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : ki.tipe === 'date' || ki.tipe === 'hari-tanggal' ? (
                          <Input
                            type="date"
                            value={val}
                            onChange={(e) => {
                              const rawDate = e.target.value;
                              if (ki.tipe === 'hari-tanggal' && rawDate) {
                                handleChangeVal(
                                  `${getNamaHariIndonesia(rawDate)}, ${formatTanggalIndonesia(rawDate)}`,
                                );
                              } else {
                                handleChangeVal(rawDate);
                              }
                            }}
                            className="h-9 text-xs"
                          />
                        ) : ki.tipe === 'time' ? (
                          <Input
                            type="time"
                            value={val}
                            onChange={(e) => handleChangeVal(e.target.value)}
                            className="h-9 text-xs"
                          />
                        ) : ki.tipe === 'number' ? (
                          <Input
                            type="number"
                            value={val}
                            onChange={(e) => handleChangeVal(e.target.value)}
                            placeholder={ki.deskripsi || '0'}
                            className="h-9 text-xs"
                          />
                        ) : cleanKode === 'form_nik_anak' || cleanKode === 'nik_anak' ? (
                          <div className="space-y-1">
                            <Input
                              type="text"
                              value={val}
                              onChange={async (e) => {
                                const inputNik = e.target.value.replace(/\D/g, '').slice(0, 16);
                                handleChangeVal(inputNik);
                                if (inputNik.length === 16 && firestore) {
                                  // 1. Cek dulu di keluarga 1 KK (0 Read Firestore)
                                  const inKk = familyMembersInKk.find((r) => (r.nik || '').trim() === inputNik);
                                  if (inKk) {
                                    applySubjectData(inKk, targetPengajuan);
                                    return;
                                  }
                                  // 2. Query 1 dokumen by NIK
                                  try {
                                    const matched = await getResidentByNik(firestore, inputNik);
                                    if (matched) {
                                      applySubjectData(matched, targetPengajuan);
                                    }
                                  } catch (err) {
                                    console.error('Error fetching child by NIK:', err);
                                  }
                                }
                              }}
                              placeholder={
                                isSuratBelumAkta
                                  ? `16 Digit NIK ${targetPengajuan === 'diri_sendiri'
                                    ? 'Pemohon'
                                    : targetPengajuan === 'istri' || targetPengajuan === 'suami'
                                      ? 'Suami / Istri'
                                      : targetPengajuan === 'keluarga_lain'
                                        ? 'Anggota Keluarga'
                                        : 'Anak'
                                  } (kosongkan jika belum ada di KK)`
                                  : '16 Digit NIK Anak (kosongkan jika belum ada di KK)'
                              }
                              maxLength={16}
                              disabled={isSuratBelumAkta && targetPengajuan === 'diri_sendiri'}
                              className={`h-9 font-mono text-xs ${isSuratBelumAkta && targetPengajuan === 'diri_sendiri'
                                ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                                : 'bg-white'
                                }`}
                            />
                            {isSuratBelumAkta && targetPengajuan === 'diri_sendiri' && (
                              <span className="block text-[10px] font-medium text-indigo-700">
                                ℹ Tersinkron otomatis dari NIK Pemohon (Pengajuan Diri Sendiri)
                              </span>
                            )}
                            {(!isSuratBelumAkta || targetPengajuan !== 'diri_sendiri') &&
                              val &&
                              val.length === 16 && (
                                <span className="block text-[10px] font-medium text-emerald-700">
                                  ✓ NIK {targetPengajuan === 'istri' || targetPengajuan === 'suami' ? 'Suami / Istri' : targetPengajuan === 'keluarga_lain' ? 'Anggota Keluarga' : 'Anak'} terisi (data otomatis disinkronkan bila terdaftar)
                                </span>
                              )}
                          </div>
                        ) : (cleanKode === 'form_nama_anak' || cleanKode === 'nama_anak') &&
                          isSuratBelumAkta &&
                          targetPengajuan === 'diri_sendiri' ? (
                          <div className="space-y-1">
                            <Input
                              type="text"
                              value={val}
                              onChange={(e) => handleChangeVal(e.target.value)}
                              disabled
                              className="h-9 bg-slate-100 text-xs font-semibold text-slate-600 cursor-not-allowed"
                            />
                            <span className="block text-[10px] font-medium text-indigo-700">
                              ℹ Tersinkron otomatis dari Nama Pemohon (Pengajuan Diri Sendiri)
                            </span>
                          </div>
                        ) : (
                          <Input
                            type="text"
                            value={val}
                            onChange={(e) => handleChangeVal(e.target.value)}
                            placeholder={ki.deskripsi || `Masukkan ${fieldLabel}...`}
                            className="h-9 text-xs"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* KHUSUS LAMPIRAN F-1.01 : DATA ANGGOTA KELUARGA */}
      {isF101Required && (
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Daftar Anggota Keluarga (Lampiran F-1.01)
                </h4>
                <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                  Total {familyMembers.length + 1} Orang (Maks. 10)
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Data ini dicetak otomatis ke 41 kolom tabel Formulir Biodata Keluarga Dukcapil F-1.01. Anggota #1 otomatis adalah Kepala Keluarga/Pemohon.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {Boolean(personDataBySection.individu?.no_kk && personDataBySection.individu.no_kk.length >= 5) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoFillFamilyFromDatabase}
                  className="h-8 border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs"
                >
                  <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                  Tarik Anggota 1 KK dari Database Warga
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={addFamilyMember}
                disabled={familyMembers.length >= 9}
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Tambah Anggota Keluarga
              </Button>
            </div>
          </div>

          {/* Anggota #1: Kepala Keluarga (Otomatis dari Pemohon) */}
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                  1
                </span>
                <span className="text-xs font-bold uppercase text-slate-800">
                  {personDataBySection.individu?.nama || 'Kepala Keluarga / Pemohon'}
                </span>
                <Badge variant="outline" className="border-emerald-500 text-emerald-700 text-[10px]">
                  {personDataBySection.individu?.hubungan_kk || 'Kepala Keluarga'}
                </Badge>
                <span className="font-mono text-xs text-slate-500">
                  NIK: {personDataBySection.individu?.nik || '-'}
                </span>
              </div>
              <span className="text-[11px] italic text-slate-500">
                (Otomatis dari data Identitas Pemohon di atas)
              </span>
            </div>
          </div>

          {/* List Anggota Keluarga Tambahan (#2 s/d #10) */}
          {familyMembers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs font-medium text-slate-600">
                Belum ada anggota keluarga tambahan.
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Klik tombol <strong>&quot;Tambah Anggota Keluarga&quot;</strong> di atas untuk menambahkan istri, anak, atau anggota keluarga lainnya.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {familyMembers.map((mem, index) => (
                <div
                  key={mem.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-emerald-300 hover:bg-white"
                >
                  <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
                        {index + 2}
                      </span>
                      <span className="text-xs font-bold uppercase text-slate-800">
                        {mem.nama || `Anggota Keluarga #${index + 2}`}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {mem.hubungan_kk || 'ANAK'}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFamilyMember(index)}
                      className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Hapus
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Hubungan Keluarga (SHDK) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={mem.hubungan_kk}
                        onChange={(e) => updateFamilyMember(index, 'hubungan_kk', e.target.value)}
                        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
                      >
                        <option value="SUAMI">SUAMI</option>
                        <option value="ISTRI">ISTRI</option>
                        <option value="ANAK">ANAK</option>
                        <option value="MENANTU">MENANTU</option>
                        <option value="CUCU">CUCU</option>
                        <option value="ORANG TUA">ORANG TUA</option>
                        <option value="MERTUA">MERTUA</option>
                        <option value="FAMILI LAIN">FAMILI LAIN</option>
                        <option value="PEMBANTU">PEMBANTU</option>
                        <option value="LAINNYA">LAINNYA</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        NIK (16 Digit) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={mem.nik}
                        onChange={(e) => updateFamilyMember(index, 'nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                        placeholder="3301xxxxxxxxxxxx"
                        maxLength={16}
                        className="h-8 font-mono text-xs bg-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Nama Lengkap Sesuai KTP/Akta <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={mem.nama}
                        onChange={(e) => updateFamilyMember(index, 'nama', e.target.value.toUpperCase())}
                        placeholder="NAMA LENGKAP"
                        className="h-8 text-xs font-semibold uppercase bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Jenis Kelamin
                      </label>
                      <select
                        value={mem.jenis_kelamin}
                        onChange={(e) => updateFamilyMember(index, 'jenis_kelamin', e.target.value)}
                        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Tempat Lahir
                      </label>
                      <Input
                        value={mem.tempat_lahir}
                        onChange={(e) => updateFamilyMember(index, 'tempat_lahir', e.target.value)}
                        placeholder="Kota / Kab Lahir"
                        className="h-8 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Tanggal Lahir
                      </label>
                      <Input
                        type="date"
                        value={mem.tanggal_lahir}
                        onChange={(e) => updateFamilyMember(index, 'tanggal_lahir', e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Golongan Darah
                      </label>
                      <select
                        value={mem.golongan_darah}
                        onChange={(e) => updateFamilyMember(index, 'golongan_darah', e.target.value)}
                        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="AB">AB</option>
                        <option value="O">O</option>
                        <option value="Tidak Tahu">Tidak Tahu</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Agama
                      </label>
                      <select
                        value={mem.agama}
                        onChange={(e) => updateFamilyMember(index, 'agama', e.target.value)}
                        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
                      >
                        <option value="Islam">Islam</option>
                        <option value="Kristen">Kristen</option>
                        <option value="Katholik">Katholik</option>
                        <option value="Hindu">Hindu</option>
                        <option value="Buddha">Buddha</option>
                        <option value="Konghucu">Konghucu</option>
                        <option value="Kepercayaan">Kepercayaan</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Status Perkawinan
                      </label>
                      <select
                        value={mem.status_kawin}
                        onChange={(e) => updateFamilyMember(index, 'status_kawin', e.target.value)}
                        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
                      >
                        <option value="Belum Kawin">Belum Kawin</option>
                        <option value="Kawin Tercatat">Kawin Tercatat</option>
                        <option value="Kawin Belum Tercatat">Kawin Belum Tercatat</option>
                        <option value="Cerai Hidup">Cerai Hidup</option>
                        <option value="Cerai Mati">Cerai Mati</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Pendidikan Terakhir
                      </label>
                      <select
                        value={mem.pendidikan_kk}
                        onChange={(e) => updateFamilyMember(index, 'pendidikan_kk', e.target.value)}
                        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
                      >
                        <option value="Tidak / Belum Sekolah">Tidak / Belum Sekolah</option>
                        <option value="Belum Tamat SD/Sederajat">Belum Tamat SD/Sederajat</option>
                        <option value="Tamat SD / Sederajat">Tamat SD / Sederajat</option>
                        <option value="SLTP/Sederajat">SLTP/Sederajat</option>
                        <option value="SLTA / Sederajat">SLTA / Sederajat</option>
                        <option value="Diploma I / II">Diploma I / II</option>
                        <option value="Akademi/ Diploma III/S. Muda">Akademi/ Diploma III/S. Muda</option>
                        <option value="Diploma IV/ Strata I">Diploma IV/ Strata I</option>
                        <option value="Strata II">Strata II</option>
                        <option value="Strata III">Strata III</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Pekerjaan
                      </label>
                      <Input
                        value={mem.pekerjaan}
                        onChange={(e) => updateFamilyMember(index, 'pekerjaan', e.target.value)}
                        placeholder="Pekerjaan / Belum Bekerja"
                        className="h-8 text-xs bg-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Nama Ibu Kandung
                      </label>
                      <Input
                        value={mem.nama_ibu}
                        onChange={(e) => updateFamilyMember(index, 'nama_ibu', e.target.value.toUpperCase())}
                        placeholder="NAMA IBU KANDUNG"
                        className="h-8 text-xs uppercase bg-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        NIK Ibu
                      </label>
                      <Input
                        value={mem.nik_ibu}
                        onChange={(e) => updateFamilyMember(index, 'nik_ibu', e.target.value.replace(/\D/g, '').slice(0, 16))}
                        placeholder="NIK Ibu Kandung (16 Digit)"
                        maxLength={16}
                        className="h-8 font-mono text-xs bg-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        Nama Ayah Kandung
                      </label>
                      <Input
                        value={mem.nama_ayah}
                        onChange={(e) => updateFamilyMember(index, 'nama_ayah', e.target.value.toUpperCase())}
                        placeholder="NAMA AYAH KANDUNG"
                        className="h-8 text-xs uppercase bg-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        NIK Ayah
                      </label>
                      <Input
                        value={mem.nik_ayah}
                        onChange={(e) => updateFamilyMember(index, 'nik_ayah', e.target.value.replace(/\D/g, '').slice(0, 16))}
                        placeholder="NIK Ayah Kandung (16 Digit)"
                        maxLength={16}
                        className="h-8 font-mono text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. UNGGAH BERKAS LAMPIRAN PERSYARATAN SURAT */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-emerald-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Unggah Berkas Lampiran Persyaratan ({syaratList.length} Dokumen)
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">
            {isAdmin ? 'Opsional untuk input langsung oleh Admin' : 'Format JPG, PNG, atau PDF (Maks. 5MB per berkas)'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {syaratList.map((syarat, idx) => {
            const fieldKey = `berkas_${idx + 1}`;
            const isRequiredDoc = !isAdmin && idx < 2;
            return (
              <GoogleFileUploader
                key={fieldKey}
                label={syarat}
                fieldName={fieldKey}
                onFileSelect={handleFileSelect}
                isRequired={isRequiredDoc}
                disabled={isSubmitting}
              />
            );
          })}
        </div>
      </div>

      {/* 4. TOMBOL AKSI */}
      <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        {isAdmin ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenKonsep}
              className="gap-2 border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            >
              <Edit3 className="h-4 w-4" />
              Tinjau Konsep & Sunting Isi Surat
            </Button>

            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveSubmission(false)}
              variant="outline"
              className="gap-2 border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan ke Arsip Layanan
            </Button>

            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveSubmission(true)}
              className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              Terbitkan & Cetak Surat Sekarang
            </Button>
          </>
        ) : (
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSaveSubmission(false)}
            className="w-full gap-2 rounded-2xl bg-emerald-800 py-6 text-xs font-black uppercase tracking-widest text-white shadow-lg hover:bg-emerald-900 sm:w-auto sm:px-10"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengirim Permohonan...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Kirim Permohonan Surat
              </>
            )}
          </Button>
        )}
      </div>

      {/* MODAL KONSEP SURAT (Khusus Admin - Sesuai resources/views/admin/surat/konsep.blade.php di OpenSID) */}
      {isAdmin && showKonsepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-slate-100 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-5 py-3.5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Konsep & Pratinjau Cetak: {enrichedItem.jenisSurat}
                </h3>
                <p className="text-xs text-slate-500">
                  Seluruh tag <code className="text-blue-600">[Kode_Isian]</code> telah diganti dengan data pemohon. Anda dapat menyunting teks naskah sebelum mencetak.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => handleSaveSubmission(true)}
                  className="gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800"
                >
                  <Printer className="h-4 w-4" />
                  Simpan & Cetak PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKonsepModal(false)}
                >
                  Tutup Konsep
                </Button>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 lg:grid-cols-12">
              {/* Editor Naskah Konsep */}
              <div className="flex flex-col rounded-xl border border-slate-200 bg-white lg:col-span-5">
                <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                  Sunting Naskah Konsep (HTML):
                </div>
                <Textarea
                  value={customKonsepHtml}
                  onChange={(e) => setCustomKonsepHtml(e.target.value)}
                  className="min-h-[540px] flex-1 rounded-none border-0 font-mono text-xs"
                />
              </div>

              {/* Lembar Kertas Hasil Cetak */}
              <div className="overflow-y-auto lg:col-span-7">
                {renderedPreview.pagesHtml.map((pageHtml, idx) => (
                  <div
                    key={idx}
                    className="mx-auto mb-6 bg-white text-black shadow-lg"
                    style={{
                      width: renderedPreview.orientasi === 'Landscape' ? '29.7cm' : '21cm',
                      maxWidth: '100%',
                      minHeight: '28cm',
                      paddingTop: `${renderedPreview.margin.atas}cm`,
                      paddingBottom: `${renderedPreview.margin.bawah}cm`,
                      paddingLeft: `${renderedPreview.margin.kiri}cm`,
                      paddingRight: `${renderedPreview.margin.kanan}cm`,
                      fontFamily: "Arial, Helvetica, sans-serif",
                      fontSize: '11pt',
                      lineHeight: 1.45,
                    }}
                  >
                    {(enrichedItem.header === 1 || (enrichedItem.header === 2 && idx === 0)) &&
                      renderedPreview.headerRendered && (
                        <div
                          className="mb-3"
                          dangerouslySetInnerHTML={{ __html: renderedPreview.headerRendered }}
                        />
                      )}
                    <div dangerouslySetInnerHTML={{ __html: pageHtml }} />
                    {enrichedItem.footer !== false && renderedPreview.footerRendered && (
                      <div
                        className="mt-6"
                        dangerouslySetInnerHTML={{
                          __html: renderedPreview.footerRendered.replace(
                            /\[\s*page_number\s*\]/gi,
                            String(idx + 1),
                          ),
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
