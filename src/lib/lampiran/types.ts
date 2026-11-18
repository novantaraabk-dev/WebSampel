import type { OpenSidKodeIsian, OpenSidFormSectionConfig } from '../opensid-surat-engine';

export type OpenSidKodeIsianItem = OpenSidKodeIsian;
export type { OpenSidFormSectionConfig };

export interface LampiranMarginConfig {
  kiri: number;
  atas: number;
  kanan: number;
  bawah: number;
}

export interface LampiranKotakConfig {
  jarak: number;
  lebar: number;
}

export const DEFAULT_LAMPIRAN_MARGIN: LampiranMarginConfig = {
  kiri: 1.78,
  atas: 0.63,
  kanan: 1.78,
  bawah: 1.37,
};

export const DEFAULT_LAMPIRAN_KOTAK: LampiranKotakConfig = {
  jarak: 2,
  lebar: 5,
};

export interface LampiranSuratItem {
  id: string;
  slug?: string; // e.g. "f-1.01", "n-1"
  kode: string; // e.g. "F-1.01", "F-2.01", "Model N-1", "SPTJM-01"
  nama: string;
  jenis?: 1 | 2; // 1 = Lampiran Sistem (OpenSID), 2 = Lampiran Desa (Kustom)
  kategori: 'Kependudukan & Capil' | 'Pernikahan KUA' | 'SPTJM & Pernyataan' | 'Pertanahan' | 'Surat Dinas';
  dasarHukum: string;
  instansi: string; // e.g. "Dinas Kependudukan dan Catatan Sipil", "KUA / Kementerian Agama", "Badan Pertanahan Nasional (BPN)", "Pemerintah Desa"
  deskripsi: string;
  formatLembar: 'A4' | 'F4' | 'Legal';
  orientasi?: 'Potrait' | 'Landscape';
  marginGlobal?: boolean;
  margin?: LampiranMarginConfig;
  kotak?: LampiranKotakConfig;
  jumlahSaksi?: number;
  perluMeterai?: boolean;
  nominalMeterai?: string;
  suratTerkait: string[]; // nama-nama jenis surat yang memakai lampiran ini
  isActive: boolean;
  useCustomTemplate?: boolean;
  templateHtml?: string;
  formIsian?: Record<string, OpenSidFormSectionConfig>;
  kodeIsian?: OpenSidKodeIsianItem[];
  updatedAt?: string;
}
