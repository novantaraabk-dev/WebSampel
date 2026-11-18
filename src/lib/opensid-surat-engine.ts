import rawOpenSidTemplates from './opensid-templates.json';
import type { PermohonanSuratItem } from './permohonan-surat-data';
import { getCachedVillageIdentity } from './village-identity';
export { getCachedVillageIdentity };
import {
  resolveEffectiveQrSettings,
  buildOpenSidQrHtmlBlock,
  buildOpenSidFooterTteHtml,
  getCachedVillageLogoUrl,
  type OpenSidQrSignatureSettings,
} from './opensid-qr-signature';

export interface OpenSidMargin {
  kiri: number;
  atas: number;
  kanan: number;
  bawah: number;
}

export interface OpenSidFormSectionConfig {
  sumber?: number | string; // 1 = Tampil sumber data penduduk, 0 = Tidak
  sumber_wajib?: number | string; // 1 = Wajib diisi, 0 = Tidak
  data?: string[]; // ['1'] = Penduduk Desa, ['2'] = Penduduk Luar Desa, ['1','2'] = Keduanya
  sex?: string | number; // '' = Semua, '1' = Laki-laki, '2' = Perempuan
  status_dasar?: string[]; // ['1'] Hidup, ['2'] Mati, ['3'] Pindah, ['4'] Hilang, ['6'] Pergi, ['9'] Tidak Valid
  kk_level?: string[]; // ['1'..'11'] SHDK
  data_orang_tua?: number | string; // '1' = Ya, '0' = Tidak
  data_pasangan?: number | string; // '1' = Ya, '0' = Tidak
  judul?: string; // Judul tab bagian (misal: 'Utama', 'Ayah', 'Ibu', 'Saksi I')
  label?: string; // Label header bagian (misal: 'Identitas Pemohon', '-' untuk sembunyikan)
  info?: string; // Teks peringatan / info di bagian form
  prefix?: string; // Prefix/suffix kode isian bagian (misal: 'ayah', 'ibu', 'saksi_i')
  sebagai?: number | string; // 0 = Tidak Ada, 1 = Terlapor/Utama, 2 = Pelapor/Pemohon
  hubungan?: string | null; // Key bagian lain jika terhubung
}

export type OpenSidFormIsian = Record<string, OpenSidFormSectionConfig>;

export interface OpenSidKaitkanRule {
  nilai_isian: string[];
  kode_isian_terkait: string[];
  tampilkan: string | number | boolean;
}

export interface OpenSidKodeIsian {
  kategori?: string; // 'individu' (default) atau key kategori lain (misal 'ayah', 'barang', 'tanah')
  tipe: string; // 'text' | 'number' | 'email' | 'url' | 'date' | 'time' | 'textarea' | 'select-manual' | 'select-otomatis' | 'hari' | 'hari-tanggal'
  kode: string; // '[form_nama_usaha]'
  nama: string; // 'Nama Usaha'
  label?: string; // Label kustom pada form
  deskripsi?: string; // Placeholder / deskripsi
  atribut?: string; // Atribut HTML tambahan
  pilihan?: string[] | string; // Pilihan untuk select-manual
  refrensi?: string; // Referensi untuk select-otomatis
  kolom?: number | string; // Lebar kolom Bootstrap 1..12 (default 6 atau 12)
  required?: string | number | boolean; // '1' atau '0'
  kaitkan_kode?: string | OpenSidKaitkanRule[];
}

export interface OpenSidRawTemplateItem {
  nama: string;
  url_surat: string;
  kode_surat: string;
  lampiran: string | null;
  kunci: boolean;
  favorit: boolean;
  jenis: number;
  mandiri: boolean;
  masa_berlaku: number;
  satuan_masa_berlaku: string;
  qr_code: boolean;
  logo_garuda: boolean;
  kecamatan?: boolean;
  syarat_surat: string | string[] | null;
  template: string;
  template_desa: string | null;
  form_isian: OpenSidFormIsian | string;
  kode_isian: OpenSidKodeIsian[] | string | null;
  orientasi: string;
  ukuran: string;
  margin: string | OpenSidMargin;
  margin_global: string | number | boolean;
  footer: number;
  header: number;
  format_nomor: string | null;
}

export interface OpenSidGlobalSuratSettings {
  headerHtml: string;
  footerHtml: string;
  footerTteHtml: string;
  formatNomorGlobal: string;
  marginGlobal: OpenSidMargin;
  fontUtama: string;
  tinggiHeader: number;
  tinggiFooter: number;
  letterheadImageUrl?: string;
}

export const OPENSID_MARGIN_DEFAULT: OpenSidMargin = {
  kiri: 1.78,
  atas: 0.63,
  kanan: 1.78,
  bawah: 1.37,
};

export const OPENSID_FORMAT_NOMOR_DEFAULT = '[kode_surat]/[nomor_surat, 3]/[bulan_romawi]/[tahun]';

export const OPENSID_HEADER_DEFAULT = `<table style="border-collapse: collapse; width: 100%; border-bottom: 3px double #000000; padding-bottom: 6px; margin-bottom: 12px;">
<tbody>
<tr>
<td style="width: 14%; text-align: center; vertical-align: middle;">[logo_surat]</td>
<td style="text-align: center; width: 86%; vertical-align: middle;">
<p style="margin: 0; text-align: center; line-height: 1.25;"><span style="font-size: 13pt; font-weight: bold;">PEMERINTAH [SEbutan_kabupaten] [NAma_kabupaten]<br />[SEbutan_kecamatan] [NAma_kecamatan]<br />[SEbutan_desa] [NAma_desa]</span></p>
<p style="margin: 3px 0 0 0; text-align: center;"><span style="font-size: 9.5pt; font-style: italic;">Alamat : [Alamat_desA] Kode Pos : [Kode_poS]</span></p>
</td>
</tr>
</tbody>
</table>`;

export const OPENSID_FOOTER_DEFAULT = `<table style="border-collapse: collapse; width: 100%; height: 10px; margin-top: 16px;" border="0">
<tbody>
<tr>
<td style="width: 100%; height: 10px;">
<p style="text-align: center; margin: 0;"><span style="font-size: 9pt;">- [page_number] -</span></p>
</td>
</tr>
</tbody>
</table>`;

export const OPENSID_FOOTER_TTE_DEFAULT = `<table style="border-collapse: collapse; width: 100%; border-top: 1px solid #cbd5e1; margin-top: 16px; padding-top: 6px;" border="0">
<tbody>
<tr>
<td style="width: 10%; text-align: center;">[logo_bsre]</td>
<td style="width: 90%; font-size: 8.5pt; color: #334155;">
UU ITE No. 11 Tahun 2008 Pasal 5 Ayat 1: "Informasi Elektronik dan/atau Dokumen Elektronik dan/atau hasil cetaknya merupakan alat bukti hukum yang sah."<br />
Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan BSrE.
</td>
</tr>
</tbody>
</table>`;

export const OPENSID_GLOBAL_SETTINGS_DEFAULT: OpenSidGlobalSuratSettings = {
  headerHtml: OPENSID_HEADER_DEFAULT,
  footerHtml: OPENSID_FOOTER_DEFAULT,
  footerTteHtml: OPENSID_FOOTER_TTE_DEFAULT,
  formatNomorGlobal: OPENSID_FORMAT_NOMOR_DEFAULT,
  marginGlobal: { ...OPENSID_MARGIN_DEFAULT },
  fontUtama: 'Arial',
  tinggiHeader: 2.5,
  tinggiFooter: 1.0,
};

export const OPENSID_TIPE_ISIAN_OPTIONS: { value: string; label: string }[] = [
  { value: 'text', label: 'Text (Satu Baris)' },
  { value: 'number', label: 'Number (Angka)' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL / Tautan' },
  { value: 'date', label: 'Tanggal (Date)' },
  { value: 'time', label: 'Jam / Waktu (Time)' },
  { value: 'textarea', label: 'Textarea (Paragraf)' },
  { value: 'select-manual', label: 'Pilihan Kustom (Select Manual)' },
  { value: 'select-otomatis', label: 'Pilihan Referensi (Select Otomatis)' },
  { value: 'hari', label: 'Hari (Otomatis dari Tanggal)' },
  { value: 'hari-tanggal', label: 'Hari & Tanggal Lengkap' },
];

export const OPENSID_REFERENSI_DATA: Record<string, string[]> = {
  'Agama': ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Budha', 'Khonghucu', 'Kepercayaan Terhadap Tuhan YME / Lainnya'],
  'Pendidikan Dalam KK': [
    'Tidak / Belum Sekolah',
    'Belum Tamat SD/Sederajat',
    'Tamat SD / Sederajat',
    'SLTP/Sederajat',
    'SLTA / Sederajat',
    'Diploma I / II',
    'Akademi/ Diploma III/S. Muda',
    'Diploma IV/ Strata I',
    'Strata II',
    'Strata III',
  ],
  'Pendidikan Sedang Ditempuh': [
    'Belum Masuk TK/Kelompok Bermain',
    'Sedang TK/Kelompok Bermain',
    'Tidak Pernah Sekolah',
    'Sedang SD/Sederajat',
    'Tidak Tamat SD/Sederajat',
    'Sedang SLTP/Sederajat',
    'Sedang SLTA/Sederajat',
    'Sedang D-1/Sederajat',
    'Sedang D-2/Sederajat',
    'Sedang D-3/Sederajat',
    'Sedang S-1/Sederajat',
    'Sedang S-2/Sederajat',
    'Sedang S-3/Sederajat',
    'Sedang SLB A/Sederajat',
    'Sedang SLB B/Sederajat',
    'Sedang SLB C/Sederajat',
    'Tidak Dapat Membaca dan Menulis Huruf Latin/Arab',
    'Tidak Sedang Sekolah',
  ],
  'Pekerjaan': [
    'Belum/Tidak Bekerja',
    'Mengurus Rumah Tangga',
    'Pelajar/Mahasiswa',
    'Pensiunan',
    'Pegawai Negeri Sipil (PNS)',
    'Tentara Nasional Indonesia (TNI)',
    'Kepolisian RI (POLRI)',
    'Perdagangan',
    'Petani/Pekebun',
    'Peternak',
    'Nelayan/Perikanan',
    'Industri',
    'Konstruksi',
    'Transportasi',
    'Karyawan Swasta',
    'Karyawan BUMN',
    'Karyawan BUMD',
    'Karyawan Honorer',
    'Buruh Harian Lepas',
    'Buruh Tani/Perkebunan',
    'Buruh Nelayan/Perikanan',
    'Buruh Peternakan',
    'Pembantu Rumah Tangga',
    'Tukang Cukur',
    'Tukang Listrik',
    'Tukang Batu',
    'Tukang Kayu',
    'Tukang Sol Sepatu',
    'Tukang Las/Pandai Besi',
    'Tukang Jahit',
    'Tukang Gigi',
    'Penata Rias',
    'Penata Busana',
    'Penata Rambut',
    'Mekanik',
    'Seniman',
    'Tabib',
    'Paraji',
    'Perancang Busana',
    'Penterjemah',
    'Imam Masjid',
    'Pendeta',
    'Pastor',
    'Wartawan',
    'Ustadz/Mubaligh',
    'Juru Masak',
    'Promotor Acara',
    'Anggota DPR-RI',
    'Anggota DPD',
    'Anggota BPK',
    'Presiden',
    'Wakil Presiden',
    'Anggota Mahkamah Konstitusi',
    'Anggota Kabinet Kementerian',
    'Duta Besar',
    'Gubernur',
    'Wakil Gubernur',
    'Bupati',
    'Wakil Bupati',
    'Walikota',
    'Wakil Walikota',
    'Anggota DPRD Provinsi',
    'Anggota DPRD Kabupaten/Kota',
    'Dosen',
    'Guru',
    'Pilot',
    'Pengacara',
    'Notaris',
    'Arsitek',
    'Akuntan',
    'Konsultan',
    'Dokter',
    'Bidan',
    'Perawat',
    'Apoteker',
    'Psikiater/Psikolog',
    'Penyiar Televisi',
    'Penyiar Radio',
    'Pelaut',
    'Peneliti',
    'Sopir',
    'Pialang',
    'Paranormal',
    'Pedagang',
    'Perangkat Desa',
    'Kepala Desa',
    'Biarawati',
    'Wiraswasta',
    'Lainnya',
  ],
  'Status Perkawinan': ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'],
  'Golongan Darah': ['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Tidak Tahu'],
  'Warga Negara': ['WNI', 'WNA', 'Dua Kewarganegaraan'],
  'Hubungan Dalam Keluarga': [
    'Kepala Keluarga',
    'Suami',
    'Istri',
    'Anak',
    'Menantu',
    'Cucu',
    'Orangtua',
    'Mertua',
    'Famili Lain',
    'Pembantu',
    'Lainnya',
  ],
  'Tempat Dilahirkan': ['RS/RB', 'Puskesmas', 'Polindes', 'Rumah', 'Lainnya'],
  'Jenis Kelahiran': ['Tunggal', 'Kembar 2', 'Kembar 3', 'Kembar 4'],
  'Penolong Kelahiran': ['Dokter', 'Bidan Perawat', 'Dukun', 'Lainnya'],
};

export const OPENSID_SHDK_OPTIONS: { id: string; label: string }[] = [
  { id: '1', label: 'Kepala Keluarga' },
  { id: '2', label: 'Suami' },
  { id: '3', label: 'Istri' },
  { id: '4', label: 'Anak' },
  { id: '5', label: 'Menantu' },
  { id: '6', label: 'Cucu' },
  { id: '7', label: 'Orangtua' },
  { id: '8', label: 'Mertua' },
  { id: '9', label: 'Famili Lain' },
  { id: '10', label: 'Pembantu' },
  { id: '11', label: 'Lainnya' },
];

export const OPENSID_STATUS_DASAR_OPTIONS: { id: string; label: string }[] = [
  { id: '1', label: 'Hidup' },
  { id: '2', label: 'Mati' },
  { id: '3', label: 'Pindah' },
  { id: '4', label: 'Hilang' },
  { id: '6', label: 'Pergi' },
  { id: '9', label: 'Tidak Valid' },
];

export const OPENSID_DATA_PELAKU_OPTIONS: { id: string; label: string }[] = [
  { id: '1', label: 'Penduduk Desa' },
  { id: '2', label: 'Penduduk Luar Desa' },
];

export const OPENSID_JENIS_KELAMIN_OPTIONS: { id: string; label: string }[] = [
  { id: '', label: 'SEMUA' },
  { id: '1', label: 'Laki-Laki' },
  { id: '2', label: 'Perempuan' },
];

export const OPENSID_SEBAGAI_OPTIONS: { id: number; label: string }[] = [
  { id: 0, label: 'Tidak Ada' },
  { id: 1, label: 'Terlapor / Subjek Utama' },
  { id: 2, label: 'Pelapor / Pemohon' },
];

export const OPENSID_SATUAN_MASA_BERLAKU: { id: 'd' | 'w' | 'M' | 'y'; label: string }[] = [
  { id: 'd', label: 'Hari' },
  { id: 'w', label: 'Minggu' },
  { id: 'M', label: 'Bulan' },
  { id: 'y', label: 'Tahun' },
];

export const OPENSID_UKURAN_KERTAS_OPTIONS: { id: string; label: string }[] = [
  { id: 'F4', label: 'F4 / Folio (21.5 x 33 cm)' },
  { id: 'A4', label: 'A4 (21.0 x 29.7 cm)' },
  { id: 'A5', label: 'A5 (14.8 x 21.0 cm)' },
  { id: 'Legal', label: 'Legal (21.6 x 35.6 cm)' },
  { id: 'Letter', label: 'Letter (21.6 x 27.9 cm)' },
];

export const OPENSID_LAMPIRAN_OPTIONS: { id: string; label: string }[] = [
  { id: 'f-1.01', label: 'F-1.01 (Formulir Biodata Keluarga)' },
  { id: 'f-1.02', label: 'F-1.02 (Formulir Pendaftaran Peristiwa Kependudukan)' },
  { id: 'f-1.03', label: 'F-1.03 (Formulir Pendaftaran Perpindahan Penduduk)' },
  { id: 'f-1.06', label: 'F-1.06 (Surat Pernyataan Perubahan Elemen Data Kependudukan)' },
  { id: 'f-1.08', label: 'F-1.08 (Surat Keterangan Pindah Datang WNI)' },
  { id: 'f-1.15', label: 'F-1.15 (Formulir Permohonan Kartu Keluarga Baru WNI)' },
  { id: 'f-1.16', label: 'F-1.16 (Formulir Permohonan Perubahan Kartu Keluarga WNI)' },
  { id: 'f.1-21', label: 'F-1.21 (Formulir Permohonan Kartu Tanda Penduduk)' },
  { id: 'f-1.25', label: 'F-1.25 (Formulir Permohonan Pindah WNI Antar Desa/Kec)' },
  { id: 'f-1.27', label: 'F-1.27 (Formulir Permohonan Pindah Datang WNI Antar Desa/Kec)' },
  { id: 'f-2.01', label: 'F-2.01 (Formulir Pelaporan Pencatatan Sipil di Dalam Wilayah NKRI)' },
  { id: 'f-2.01-kelahiran', label: 'F-2.01 Kelahiran (Pelaporan Kelahiran di Dalam Wilayah NKRI)' },
  { id: 'f-2.01-kematian', label: 'F-2.01 Kematian (Pelaporan Kematian di Dalam Wilayah NKRI)' },
  { id: 'f-2.01-perkawinan', label: 'F-2.01 Perkawinan (Pelaporan Perkawinan di Dalam Wilayah NKRI)' },
  { id: 'f-2.03', label: 'F-2.03 (SPTJM Kebenaran Data Kelahiran)' },
  { id: 'f-2.04', label: 'F-2.04 (SPTJM Kebenaran Sebagai Pasangan Suami Istri)' },
  { id: 'f-2.12', label: 'F-2.12 (Formulir Pencatatan Perkawinan Capil)' },
  { id: 'f-2.29', label: 'F-2.29 (Surat Keterangan Kematian 4 Lembar)' },
  { id: 'f-2.30', label: 'F-2.30 (Formulir Pelaporan Kematian)' },
  { id: 'n-1', label: 'N-1 (Pengantar Nikah)' },
  { id: 'n-2', label: 'N-2 (Permohonan Kehendak Nikah)' },
  { id: 'n-4', label: 'N-4 (Persetujuan Calon Pengantin)' },
  { id: 'n-5', label: 'N-5 (Surat Izin Orang Tua)' },
  { id: 'n-6', label: 'N-6 (Surat Keterangan Kematian Suami/Istri)' },
  { id: 'sps', label: 'SPS (Surat Pernyataan Status Perkawinan)' },
  { id: 'swn', label: 'SWN (Surat Keterangan Wali Nikah)' },
];

export interface OpenSidKodeIsianCatalogGroup {
  kategori: string;
  items: { kode: string; judul: string; keterangan: string }[];
}

export const OPENSID_KODE_ISIAN_STANDAR: OpenSidKodeIsianCatalogGroup[] = [
  {
    kategori: 'Surat & Tanggal',
    items: [
      { kode: '[JUdul_surat]', judul: 'Judul Surat (HURUF BESAR)', keterangan: 'Nama layanan surat tanpa kata "Surat" di awal jika sudah ada' },
      { kode: '[Format_nomor_suraT]', judul: 'Nomor Surat Lengkap', keterangan: 'Nomor surat sesuai format penomoran' },
      { kode: '[Kode_suraT]', judul: 'Kode / Klasifikasi Surat', keterangan: 'Kode klasifikasi surat (mis. 470, 500, S-01)' },
      { kode: '[Tanggal_suraT]', judul: 'Tanggal Surat', keterangan: 'Tanggal cetak surat (mis. 31 Oktober 2026)' },
      { kode: '[Hari_suraT]', judul: 'Hari Cetak Surat', keterangan: 'Nama hari saat surat dicetak (mis. Sabtu)' },
      { kode: '[Bulan_romawI]', judul: 'Bulan Romawi', keterangan: 'Bulan cetak dalam angka Romawi (I - XII)' },
      { kode: '[TahuN]', judul: 'Tahun Surat', keterangan: 'Tahun berjalan (4 digit)' },
      { kode: '[Mulai_berlakU]', judul: 'Mulai Berlaku', keterangan: 'Tanggal mulai masa berlaku surat' },
      { kode: '[Berlaku_sampaI]', judul: 'Berlaku Sampai', keterangan: 'Tanggal berakhir masa berlaku surat' },
      { kode: '[Qr_codE]', judul: 'QR Code Verifikasi Surat', keterangan: 'Gambar QR Code keabsahan surat' },
      { kode: '[Logo_garudA]', judul: 'Logo Burung Garuda', keterangan: 'Lambang Garuda Pancasila untuk kop/header' },
    ],
  },
  {
    kategori: 'Identitas Desa & Wilayah',
    items: [
      { kode: '[Nama_desA]', judul: 'Nama Desa', keterangan: 'Sampeldes' },
      { kode: '[Kode_desA]', judul: 'Kode Wilayah Desa', keterangan: '33.01.10.2011' },
      { kode: '[Kode_poS]', judul: 'Kode Pos', keterangan: '53254' },
      { kode: '[Sebutan_desA]', judul: 'Sebutan Desa', keterangan: 'Desa' },
      { kode: '[Sebutan_dusuN]', judul: 'Sebutan Dusun', keterangan: 'Dusun' },
      { kode: '[Alamat_desA]', judul: 'Alamat Kantor Desa', keterangan: 'Jl. Raya Sampeldes No. 01, Kec. Gandrungmangu, Kab. Cilacap' },
      { kode: '[Email_desA]', judul: 'Email Desa', keterangan: 'pemdes@sampeldes.desa.id' },
      { kode: '[Telepon_desA]', judul: 'Telepon Desa', keterangan: '(0280) 521234' },
      { kode: '[Website_desA]', judul: 'Website Desa', keterangan: 'https://sampeldes.desa.id' },
      { kode: '[Nama_kecamataN]', judul: 'Nama Kecamatan', keterangan: 'Gandrungmangu' },
      { kode: '[Sebutan_kecamataN]', judul: 'Sebutan Kecamatan', keterangan: 'Kecamatan' },
      { kode: '[Nama_camat]', judul: 'Nama Camat', keterangan: 'Nama Camat aktif' },
      { kode: '[Nip_camat]', judul: 'NIP Camat', keterangan: 'NIP Camat aktif' },
      { kode: '[Nama_kabupateN]', judul: 'Nama Kabupaten', keterangan: 'Cilacap' },
      { kode: '[Sebutan_kabupateN]', judul: 'Sebutan Kabupaten', keterangan: 'Kabupaten' },
      { kode: '[Nama_provinsI]', judul: 'Nama Provinsi', keterangan: 'Jawa Tengah' },
      { kode: '[Logo_surAT]', judul: 'Logo Pemerintah Desa', keterangan: 'Logo Kabupaten/Desa pada Kop Surat' },
    ],
  },
  {
    kategori: 'Penandatangan (Pamong)',
    items: [
      { kode: '[Atas_namA]', judul: 'Atas Nama (a.n.)', keterangan: 'Kepala Desa Sampeldes / a.n. Kepala Desa Sampeldes Sekretaris Desa' },
      { kode: '[Jabatan]', judul: 'Jabatan Penandatangan', keterangan: 'Kepala Desa / Sekretaris Desa / Kasi Pemerintahan' },
      { kode: '[Nama_pamonG]', judul: 'Nama Pejabat Penandatangan', keterangan: 'TUKIMAN' },
      { kode: '[Sebutan_nip_desA]', judul: 'Label NIP / NIAP', keterangan: 'NIP / NIAP' },
      { kode: '[Nip_pamoNG]', judul: 'NIP / NIAP Penandatangan', keterangan: 'Nomor Induk Pejabat Penandatangan' },
      { kode: '[Pangkat_pamonG]', judul: 'Pangkat / Golongan Pamong', keterangan: 'Pangkat golongan pejabat penandatangan' },
    ],
  },
  {
    kategori: 'Data Individu / Pemohon Utama',
    items: [
      { kode: '[Nama]', judul: 'Nama Lengkap Pemohon', keterangan: 'Nama lengkap penduduk pemohon' },
      { kode: '[Nik]', judul: 'NIK Pemohon', keterangan: '16 digit Nomor Induk Kependudukan' },
      { kode: '[No_kK]', judul: 'Nomor KK', keterangan: '16 digit Nomor Kartu Keluarga' },
      { kode: '[Kepala_kK]', judul: 'Nama Kepala Keluarga', keterangan: 'Nama Kepala Keluarga dari KK pemohon' },
      { kode: '[Tempat_lahiR]', judul: 'Tempat Lahir', keterangan: 'Kota/Kabupaten tempat lahir' },
      { kode: '[Tanggal_lahiR]', judul: 'Tanggal Lahir', keterangan: 'Tanggal lahir format Indonesia' },
      { kode: '[Tempat_tanggal_lahiR]', judul: 'Tempat / Tanggal Lahir', keterangan: 'Gabungan Tempat, Tanggal Lahir' },
      { kode: '[Ttl]', judul: 'TTL (Singkat)', keterangan: 'Tempat/Tanggal Lahir' },
      { kode: '[Usia]', judul: 'Usia / Umur', keterangan: 'Umur penduduk (mis. 34 Tahun)' },
      { kode: '[Jenis_kelamiN]', judul: 'Jenis Kelamin', keterangan: 'Laki-laki / Perempuan' },
      { kode: '[Agama]', judul: 'Agama', keterangan: 'Agama penduduk' },
      { kode: '[Pendidikan_kK]', judul: 'Pendidikan dalam KK', keterangan: 'Pendidikan terakhir sesuai KK' },
      { kode: '[Pekerjaan]', judul: 'Pekerjaan', keterangan: 'Pekerjaan penduduk' },
      { kode: '[Warga_negarA]', judul: 'Kewarganegaraan', keterangan: 'WNI / WNA' },
      { kode: '[Status_kawin]', judul: 'Status Perkawinan', keterangan: 'Belum Kawin / Kawin / Cerai Hidup / Cerai Mati' },
      { kode: '[Golongan_daraH]', judul: 'Golongan Darah', keterangan: 'A / B / AB / O' },
      { kode: '[Alamat]', judul: 'Alamat Lengkap', keterangan: 'Alamat lengkap beserta RT/RW dan Dusun' },
      { kode: '[Rt]', judul: 'Nomor RT', keterangan: '001' },
      { kode: ' [Rw]', judul: 'Nomor RW', keterangan: '001' },
      { kode: '[Dusun]', judul: 'Nama Dusun', keterangan: 'Nama Dusun tempat tinggal' },
      { kode: '[Nama_ayaH]', judul: 'Nama Ayah Kandung', keterangan: 'Nama Ayah dari data penduduk' },
      { kode: '[Nik_ayaH]', judul: 'NIK Ayah Kandung', keterangan: 'NIK Ayah dari data penduduk' },
      { kode: '[Nama_ibU]', judul: 'Nama Ibu Kandung', keterangan: 'Nama Ibu dari data penduduk' },
      { kode: '[Nik_ibU]', judul: 'NIK Ibu Kandung', keterangan: 'NIK Ibu dari data penduduk' },
    ],
  },
];

// Cast imported JSON
export const OPENSID_RAW_TEMPLATES: OpenSidRawTemplateItem[] = rawOpenSidTemplates as unknown as OpenSidRawTemplateItem[];

const templateByUrlMap = new Map<string, OpenSidRawTemplateItem>();
const templateByKodeMap = new Map<string, OpenSidRawTemplateItem>();
for (const item of OPENSID_RAW_TEMPLATES) {
  if (item.url_surat) templateByUrlMap.set(item.url_surat, item);
  if (item.kode_surat && !templateByKodeMap.has(item.kode_surat)) {
    templateByKodeMap.set(item.kode_surat, item);
  }
}

export function parseOpenSidMargin(raw: string | OpenSidMargin | undefined | null): OpenSidMargin {
  if (!raw) return { ...OPENSID_MARGIN_DEFAULT };
  if (typeof raw === 'object') {
    return {
      kiri: Number(raw.kiri ?? OPENSID_MARGIN_DEFAULT.kiri),
      atas: Number(raw.atas ?? OPENSID_MARGIN_DEFAULT.atas),
      kanan: Number(raw.kanan ?? OPENSID_MARGIN_DEFAULT.kanan),
      bawah: Number(raw.bawah ?? OPENSID_MARGIN_DEFAULT.bawah),
    };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      kiri: Number(parsed.kiri ?? OPENSID_MARGIN_DEFAULT.kiri),
      atas: Number(parsed.atas ?? OPENSID_MARGIN_DEFAULT.atas),
      kanan: Number(parsed.kanan ?? OPENSID_MARGIN_DEFAULT.kanan),
      bawah: Number(parsed.bawah ?? OPENSID_MARGIN_DEFAULT.bawah),
    };
  } catch {
    return { ...OPENSID_MARGIN_DEFAULT };
  }
}

export function normalizeFormSectionConfig(key: string, cfg?: Partial<OpenSidFormSectionConfig>): OpenSidFormSectionConfig {
  const isUtama = key === 'individu';
  const defaultTitle = isUtama
    ? 'Utama'
    : key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    sumber: cfg?.sumber !== undefined ? Number(cfg.sumber) : 1,
    sumber_wajib: cfg?.sumber_wajib !== undefined ? Number(cfg.sumber_wajib) : isUtama ? 1 : 0,
    data: Array.isArray(cfg?.data) && cfg!.data.length > 0 ? cfg!.data.map(String) : ['1'],
    sex: cfg?.sex !== undefined && cfg?.sex !== null ? String(cfg.sex) : '',
    status_dasar:
      Array.isArray(cfg?.status_dasar) && cfg!.status_dasar.length > 0
        ? cfg!.status_dasar.map(String)
        : ['1'],
    kk_level:
      Array.isArray(cfg?.kk_level) && cfg!.kk_level.length > 0
        ? cfg!.kk_level.map(String)
        : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
    data_orang_tua: cfg?.data_orang_tua !== undefined ? Number(cfg.data_orang_tua) : 0,
    data_pasangan: cfg?.data_pasangan !== undefined ? Number(cfg.data_pasangan) : 0,
    judul: cfg?.judul || defaultTitle,
    label: cfg?.label !== undefined ? cfg.label : isUtama ? 'Identitas Pemohon' : defaultTitle,
    info: cfg?.info || '',
    prefix: cfg?.prefix || (isUtama ? '' : key.toLowerCase()),
    sebagai: cfg?.sebagai !== undefined ? Number(cfg.sebagai) : isUtama ? 1 : 0,
    hubungan: cfg?.hubungan ?? '',
  };
}

export function parseOpenSidFormIsian(raw: OpenSidFormIsian | string | undefined | null): OpenSidFormIsian {
  let obj: Record<string, Partial<OpenSidFormSectionConfig>> = {};
  if (raw) {
    if (typeof raw === 'string') {
      try {
        obj = JSON.parse(raw) || {};
      } catch {
        obj = {};
      }
    } else if (typeof raw === 'object') {
      obj = raw as Record<string, Partial<OpenSidFormSectionConfig>>;
    }
  }
  const result: OpenSidFormIsian = {};
  const keys = Object.keys(obj);
  if (!keys.includes('individu')) {
    result.individu = normalizeFormSectionConfig('individu', {});
  }
  for (const key of keys) {
    result[key] = normalizeFormSectionConfig(key, obj[key]);
  }
  return result;
}

export function parseOpenSidKodeIsian(raw: OpenSidKodeIsian[] | string | undefined | null): OpenSidKodeIsian[] {
  if (!raw) return [];
  let arr: OpenSidKodeIsian[] = [];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) arr = parsed;
    } catch {
      arr = [];
    }
  } else if (Array.isArray(raw)) {
    arr = raw;
  }
  return arr.map((item) => {
    const kategori = item.kategori || 'individu';
    const cleanNama = item.nama || '';
    const autoKode = item.kode || buildFormKodeTag(cleanNama, kategori);
    let pilihan: string[] = [];
    if (Array.isArray(item.pilihan)) {
      pilihan = item.pilihan.map(String);
    } else if (typeof item.pilihan === 'string' && item.pilihan.trim()) {
      pilihan = item.pilihan
        .split(/[\n,|]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return {
      kategori,
      tipe: item.tipe || 'text',
      kode: autoKode,
      nama: cleanNama,
      label: item.label || cleanNama,
      deskripsi: item.deskripsi || '',
      atribut: item.atribut || '',
      pilihan,
      refrensi: item.refrensi || '',
      kolom: Number(item.kolom || (item.tipe === 'textarea' ? 12 : 6)),
      required: item.required === '1' || item.required === 1 || item.required === true ? '1' : '0',
      kaitkan_kode: item.kaitkan_kode || '',
    };
  });
}

export function buildFormKodeTag(nama: string, kategori = 'individu'): string {
  const slug = (nama || 'isian')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!kategori || kategori === 'individu' || kategori === 'utama') {
    return `[form_${slug || 'isian'}]`;
  }
  const katSlug = kategori
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (slug.endsWith(`_${katSlug}`)) {
    return `[form_${slug}]`;
  }
  return `[form_${slug || 'isian'}_${katSlug}]`;
}

export const LETTER_NAME_ALIASES: Record<string, string[]> = {
  'surat pengantar nikah (n-1 - n-4)': ['surat keterangan nikah', 'sistem-surat-keterangan-nikah'],
  'surat keterangan nikah': ['surat pengantar nikah (n-1 - n-4)', 'sistem-surat-keterangan-nikah'],
  'surat keterangan pergi kawin (numpang nikah)': ['surat keterangan pergi kawin', 'sistem-surat-keterangan-pergi-kawin'],
  'surat keterangan pergi kawin': ['surat keterangan pergi kawin (numpang nikah)', 'sistem-surat-keterangan-pergi-kawin'],
  'surat keterangan reaktivasi bpjs kesehatan': ['surat keterangan jamkesos / reaktivasi bpjs', 'sistem-surat-keterangan-jamkesos'],
  'surat keterangan jamkesos / reaktivasi bpjs': ['surat keterangan reaktivasi bpjs kesehatan', 'sistem-surat-keterangan-jamkesos'],
  'surat izin keluarga (bekerja / merantau)': ['surat keterangan izin orang tua / suami / istri', 'sistem-surat-keterangan-izin-orang-tua-suami-istri'],
  'surat keterangan izin orang tua / suami / istri': ['surat izin keluarga (bekerja / merantau)', 'sistem-surat-keterangan-izin-orang-tua-suami-istri'],
  'surat keterangan umum': ['surat keterangan umum', 'sistem-surat-keterangan-pengantar', 'surat keterangan', 'surat pengantar umum'],
  'surat keterangan': ['surat keterangan umum', 'sistem-surat-keterangan-pengantar'],
  'surat pengantar umum': ['surat keterangan umum', 'sistem-surat-keterangan-pengantar'],
  'surat keterangan jalan': ['surat keterangan bepergian / jalan', 'sistem-surat-keterangan-bepergian-jalan'],
  'surat keterangan bepergian / jalan': ['surat keterangan jalan', 'sistem-surat-keterangan-bepergian-jalan'],
};

export function matchMasterSuratItem(
  list: PermohonanSuratItem[],
  queryOrType?: string | null,
  urlSurat?: string | null,
  id?: string | null,
): PermohonanSuratItem | undefined {
  if (!list || list.length === 0) return undefined;
  if (id) {
    const byId = list.find((m) => m.id === id);
    if (byId) return byId;
  }
  if (urlSurat) {
    const byUrl = list.find((m) => m.urlSurat === urlSurat);
    if (byUrl) return byUrl;
  }
  if (!queryOrType) return undefined;
  const q = queryOrType.trim().toLowerCase();
  if (!q) return undefined;

  // 1. Exact match on jenisSurat or urlSurat
  const exact = list.find(
    (m) => m.jenisSurat.trim().toLowerCase() === q || (m.urlSurat && m.urlSurat.trim().toLowerCase() === q),
  );
  if (exact) return exact;

  // 2. Alias match
  const aliases = LETTER_NAME_ALIASES[q] || [];
  if (aliases.length > 0) {
    const byAlias = list.find(
      (m) =>
        aliases.includes(m.jenisSurat.trim().toLowerCase()) ||
        (m.urlSurat ? aliases.includes(m.urlSurat.trim().toLowerCase()) : false),
    );
    if (byAlias) return byAlias;
  }

  // 3. Substring match
  return list.find(
    (m) =>
      m.jenisSurat.toLowerCase().includes(q) ||
      q.includes(m.jenisSurat.toLowerCase()),
  );
}

const FALLBACK_KODE_ISIAN_BY_URL: Record<string, OpenSidKodeIsian[]> = {
  'sistem-surat-pernyataan-belum-memiliki-akta-lahir': [
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_anak]', nama: 'Nama Lengkap Anak', label: 'Nama Lengkap Anak (Yang Diterangkan Belum Berakta)', deskripsi: 'Nama lengkap anak yang dimohonkan penerbitan akta lahir', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nik_anak]', nama: 'NIK Anak', label: 'NIK Anak (Sesuai KK, Kosongkan bila belum ada)', deskripsi: '16 digit NIK anak jika sudah tercantum di KK', kolom: 6, required: '0' },
    { kategori: 'individu', tipe: 'text', kode: '[form_tempat_lahir_anak]', nama: 'Tempat Lahir Anak', label: 'Tempat Lahir Anak', deskripsi: 'Kota/Kabupaten tempat anak dilahirkan', kolom: 4, required: '1' },
    { kategori: 'individu', tipe: 'date', kode: '[form_tanggal_lahir_anak]', nama: 'Tanggal Lahir Anak', label: 'Tanggal Lahir Anak', deskripsi: 'Tanggal lahir anak yang bersangkutan', kolom: 4, required: '1' },
    { kategori: 'individu', tipe: 'select', kode: '[form_hari_lahir_anak]', nama: 'Hari Lahir Anak', label: 'Hari Lahir Anak', deskripsi: 'Hari kelahiran anak', pilihan: ["Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu", "Minggu"], kolom: 4, required: '1' },
    { kategori: 'individu', tipe: 'number', kode: '[form_kelahiran_ke]', nama: 'Anak Ke-', label: 'Urutan Kelahiran (Anak Ke-)', deskripsi: 'Contoh: 1, 2, 3, dst', kolom: 4, required: '1' },
    { kategori: 'individu', tipe: 'select', kode: '[form_jenis_kelahiran]', nama: 'Jenis Kelahiran', label: 'Jenis Kelahiran', deskripsi: 'Tunggal / Kembar', pilihan: ["Tunggal", "Kembar 2", "Kembar 3", "Kembar 4", "Lainnya"], kolom: 4, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_alamat_anak]', nama: 'Alamat Tempat Tinggal Anak', label: 'Alamat Tempat Tinggal Anak', deskripsi: 'Alamat domisili anak saat ini', kolom: 4, required: '0' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_ibu]', nama: 'Nama Lengkap Ibu Kandung', label: 'Nama Lengkap Ibu Kandung', deskripsi: 'Nama ibu kandung anak', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nik_ibu]', nama: 'NIK Ibu Kandung', label: 'NIK Ibu Kandung (16 Digit)', deskripsi: 'Nomor Induk Kependudukan Ibu Kandung', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_tempat_lahir_ibu]', nama: 'Tempat Lahir Ibu', label: 'Tempat Lahir Ibu Kandung', deskripsi: 'Kota/Kabupaten kelahiran ibu', kolom: 4, required: '0' },
    { kategori: 'individu', tipe: 'date', kode: '[form_tanggal_lahir_ibu]', nama: 'Tanggal Lahir Ibu', label: 'Tanggal Lahir Ibu Kandung', deskripsi: 'Tanggal lahir ibu kandung', kolom: 4, required: '0' },
    { kategori: 'individu', tipe: 'text', kode: '[form_pekerjaan_ibu]', nama: 'Pekerjaan Ibu', label: 'Pekerjaan Ibu Kandung', deskripsi: 'Pekerjaan ibu (contoh: Mengurus Rumah Tangga / Wiraswasta)', kolom: 4, required: '0' },
    { kategori: 'individu', tipe: 'text', kode: '[form_alamat_ibu]', nama: 'Alamat Ibu Kandung', label: 'Alamat Ibu Kandung', deskripsi: 'Alamat domisili lengkap ibu kandung', kolom: 6, required: '0' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_ayah]', nama: 'Nama Lengkap Ayah Kandung', label: 'Nama Lengkap Ayah Kandung', deskripsi: 'Nama ayah kandung anak', kolom: 6, required: '0' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nik_ayah]', nama: 'NIK Ayah Kandung', label: 'NIK Ayah Kandung (16 Digit)', deskripsi: 'Nomor Induk Kependudukan Ayah Kandung', kolom: 6, required: '0' },
    { kategori: 'individu', tipe: 'text', kode: '[form_penolong_kelahiran]', nama: 'Nama Penolong Kelahiran', label: 'Nama Penolong Kelahiran (Dokter / Bidan / Dukun)', deskripsi: 'Nama tenaga medis atau penolong saat persalinan', kolom: 4, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_profesi_penolong]', nama: 'Profesi / Pekerjaan Penolong', label: 'Profesi / Jabatan Penolong', deskripsi: 'Contoh: Bidan Desa, Dokter Kandungan, dll', kolom: 4, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_alamat_penolong]', nama: 'Alamat / Lokasi Bersalin', label: 'Alamat Tempat Bersalin / Klinik / Puskesmas', deskripsi: 'Lokasi persalinan kelahiran anak', kolom: 4, required: '0' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_saksi_1]', nama: 'Nama Lengkap Saksi I', label: 'Nama Lengkap Saksi I', deskripsi: 'Nama lengkap saksi pertama', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nik_saksi_1]', nama: 'NIK Saksi I', label: 'NIK Saksi I (16 Digit)', deskripsi: 'Nomor Induk Kependudukan Saksi Pertama', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_saksi_2]', nama: 'Nama Lengkap Saksi II', label: 'Nama Lengkap Saksi II', deskripsi: 'Nama lengkap saksi kedua', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nik_saksi_2]', nama: 'NIK Saksi II', label: 'NIK Saksi II (16 Digit)', deskripsi: 'Nomor Induk Kependudukan Saksi Kedua', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'textarea', kode: '[form_keperluan]', nama: 'Keperluan Pengajuan Surat', label: 'Keperluan Pengajuan Surat', deskripsi: 'Tuliskan keperluan pengajuan surat secara lengkap', kolom: 12, required: '1' },
  ],
  'sistem-surat-keterangan-kepemilikan-tanah': [
    {
      kategori: 'tanah',
      tipe: 'select-manual',
      kode: '[form_jenis_tanah]',
      nama: 'Jenis Tanah',
      label: 'Jenis Tanah *',
      deskripsi: '- Pilih Jenis Tanah -',
      pilihan: ['Tanah Darat', 'Tanah Sawah', 'Tanah Bangunan', 'Tanah Pekarangan', 'Tanah Kering', 'Lainnya'],
      kolom: 4,
      required: '1',
    },
    {
      kategori: 'tanah',
      tipe: 'text',
      kode: '[form_atas_nama_tanah]',
      nama: 'Atas Nama Tanah',
      label: 'Atas Nama Pemilik Tanah *',
      deskripsi: 'Nama pemilik tanah sesuai bukti hak',
      kolom: 4,
      required: '1',
    },
    {
      kategori: 'tanah',
      tipe: 'text',
      kode: '[form_luas_tanah]',
      nama: 'Luas Tanah',
      label: 'Luas Tanah (M²) *',
      deskripsi: 'Luas tanah dalam meter persegi (contoh: 250)',
      kolom: 4,
      required: '1',
    },
    {
      kategori: 'tanah',
      tipe: 'select-manual',
      kode: '[form_bukti_kepemilikan_tanah]',
      nama: 'Bukti Kepemilikan',
      label: 'Bukti Kepemilikan Tanah *',
      deskripsi: '- Pilih Bukti Kepemilikan -',
      pilihan: ['Letter C', 'Petok D', 'Sit Segel', 'Akta Jual Beli', 'Girik', 'SPPT PBB', 'Buku Krawangan Desa', 'Sertifikat Hak Milik', 'Lainnya'],
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'tanah',
      tipe: 'text',
      kode: '[form_nomor_bukti_kepemilikan_tanah]',
      nama: 'Nomor Bukti Kepemilikan',
      label: 'Nomor Bukti Kepemilikan *',
      deskripsi: 'Nomor bukti hak (contoh: Buku C No. 123 / Kohir No. 45 / NOP PBB)',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'tanah',
      tipe: 'text',
      kode: '[form_batas_utara_tanah]',
      nama: 'Batas Sebelah Utara',
      label: 'Batas Sebelah Utara *',
      deskripsi: 'Batas sebelah utara (nama pemilik / jalan / saluran)',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'tanah',
      tipe: 'text',
      kode: '[form_batas_timur_tanah]',
      nama: 'Batas Sebelah Timur',
      label: 'Batas Sebelah Timur *',
      deskripsi: 'Batas sebelah timur (nama pemilik / jalan / saluran)',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'tanah',
      tipe: 'text',
      kode: '[form_batas_selatan_tanah]',
      nama: 'Batas Sebelah Selatan',
      label: 'Batas Sebelah Selatan *',
      deskripsi: 'Batas sebelah selatan (nama pemilik / jalan / saluran)',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'tanah',
      tipe: 'text',
      kode: '[form_batas_barat_tanah]',
      nama: 'Batas Sebelah Barat',
      label: 'Batas Sebelah Barat *',
      deskripsi: 'Batas sebelah barat (nama pemilik / jalan / saluran)',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'tanah',
      tipe: 'select-manual',
      kode: '[form_asal_kepemilikan_tanah]',
      nama: 'Asal Kepemilikan',
      label: 'Asal Kepemilikan Tanah *',
      deskripsi: '- Pilih Asal Kepemilikan -',
      pilihan: ['Jual Beli', 'Warisan', 'Hibah', 'Pemberian Adat', 'Yayasan', 'Lainnya'],
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'tanah',
      tipe: 'text',
      kode: '[form_bukti_pendukung_kepemilikan_tanah]',
      nama: 'Bukti Pendukung Kepemilikan',
      label: 'Bukti Pendukung Kepemilikan Sementara *',
      deskripsi: 'Contoh: Akta Jual Beli / Surat Keterangan Waris / Pernyataan Hibah',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'textarea',
      kode: '[form_keperluan]',
      nama: 'Keperluan Pengajuan Surat',
      label: 'Keperluan Pengajuan Surat *',
      deskripsi: 'Tuliskan keperluan pengajuan surat keterangan kepemilikan tanah',
      kolom: 12,
      required: '1',
    },
  ],
  'sistem-surat-pernyataan-penguasaan-fisik-bidang-tanah-sporadik': [
    { kategori: 'letak', tipe: 'text', kode: '[form_jalan]', nama: 'Jalan / RT', label: 'Jalan / RT Lokasi Tanah *', deskripsi: 'Nama jalan atau RT tempat bidang tanah terletak', kolom: 6, required: '1' },
    { kategori: 'letak', tipe: 'text', kode: '[form_rt_rw]', nama: 'Dusun / RW', label: 'Dusun / RW Lokasi Tanah *', deskripsi: 'Nama Dusun atau RW lokasi tanah', kolom: 6, required: '1' },
    { kategori: 'letak', tipe: 'text', kode: '[form_desa_kelurahan]', nama: 'Desa / Kelurahan', label: 'Desa / Kelurahan Lokasi Tanah *', deskripsi: 'Desa atau Kelurahan letak tanah', kolom: 4, required: '1' },
    { kategori: 'letak', tipe: 'text', kode: '[form_kecamatan]', nama: 'Kecamatan', label: 'Kecamatan Lokasi Tanah *', deskripsi: 'Kecamatan lokasi tanah', kolom: 4, required: '1' },
    { kategori: 'letak', tipe: 'text', kode: '[form_kabupaten_kota]', nama: 'Kabupaten / Kota', label: 'Kabupaten / Kota Lokasi Tanah *', deskripsi: 'Kabupaten letak tanah', kolom: 4, required: '1' },
    { kategori: 'letak', tipe: 'text', kode: '[form_nib]', nama: 'NIB Tanah', label: 'Nomor Identifikasi Bidang (NIB)', deskripsi: 'NIB jika sudah ada, atau kosongkan / isi -', kolom: 4, required: '0' },
    { kategori: 'letak', tipe: 'text', kode: '[form_status_tanah]', nama: 'Status Tanah', label: 'Status Penguasaan / Hak Tanah *', deskripsi: 'Contoh: Hak Milik Adat / Girik / Petuk D', kolom: 4, required: '1' },
    { kategori: 'letak', tipe: 'text', kode: '[form_dipergunakan]', nama: 'Dipergunakan Untuk', label: 'Peruntukan Penggunaan Tanah *', deskripsi: 'Contoh: Tempat Tinggal / Pekarangan / Pertanian', kolom: 4, required: '1' },
    { kategori: 'letak', tipe: 'text', kode: '[form_luas_tanah_m2]', nama: 'Luas Tanah (M²)', label: 'Luas Bidang Tanah (M²) *', deskripsi: 'Luas tanah dalam satuan meter persegi', kolom: 4, required: '1' },
    { kategori: 'batas', tipe: 'text', kode: '[form_batas_sebelah_utara]', nama: 'Batas Sebelah Utara', label: 'Batas Sebelah Utara *', deskripsi: 'Batas tanah sebelah utara (nama pemilik / jalan)', kolom: 6, required: '1' },
    { kategori: 'batas', tipe: 'text', kode: '[form_batas_sebelah_selatan]', nama: 'Batas Sebelah Selatan', label: 'Batas Sebelah Selatan *', deskripsi: 'Batas tanah sebelah selatan (nama pemilik / jalan)', kolom: 6, required: '1' },
    { kategori: 'batas', tipe: 'text', kode: '[form_batas_sebelah_timur]', nama: 'Batas Sebelah Timur', label: 'Batas Sebelah Timur *', deskripsi: 'Batas tanah sebelah timur (nama pemilik / jalan)', kolom: 6, required: '1' },
    { kategori: 'batas', tipe: 'text', kode: '[form_batas_sebelah_barat]', nama: 'Batas Sebelah Barat', label: 'Batas Sebelah Barat *', deskripsi: 'Batas tanah sebelah barat (nama pemilik / jalan)', kolom: 6, required: '1' },
    { kategori: 'asal', tipe: 'text', kode: '[form_tanah_diperoleh_dari_]', nama: 'Tanah Diperoleh Dari', label: 'Tanah Diperoleh Dari (Nama Pemilik Asal) *', deskripsi: 'Nama orang atau pihak asal tanah diperoleh', kolom: 4, required: '1' },
    { kategori: 'asal', tipe: 'text', kode: '[form_diperoleh_sejak_tahun]', nama: 'Diperoleh Sejak Tahun', label: 'Diperoleh Sejak Tahun *', deskripsi: 'Tahun pertama kali tanah dikuasai/diperoleh', kolom: 4, required: '1' },
    { kategori: 'asal', tipe: 'text', kode: '[form_dengan_jalan]', nama: 'Dengan Jalan', label: 'Dengan Jalan / Cara Perolehan *', deskripsi: 'Contoh: Jual Beli / Warisan / Hibah', kolom: 4, required: '1' },
    { kategori: 'saksi_i', tipe: 'text', kode: '[form_nama_saksi_1]', nama: 'Nama Saksi I', label: 'Nama Lengkap Saksi I *', deskripsi: 'Nama lengkap saksi batas pertama', kolom: 6, required: '1' },
    { kategori: 'saksi_i', tipe: 'text', kode: '[form_umur_saksi_1]', nama: 'Umur Saksi I (Tahun)', label: 'Umur Saksi I (Tahun) *', deskripsi: 'Usia saksi pertama dalam tahun (misal: 45)', kolom: 6, required: '1' },
    { kategori: 'saksi_i', tipe: 'text', kode: '[form_pekerjaan_saksi_1]', nama: 'Pekerjaan Saksi I', label: 'Pekerjaan Saksi I *', deskripsi: 'Pekerjaan saksi pertama', kolom: 6, required: '1' },
    { kategori: 'saksi_i', tipe: 'text', kode: '[form_alamat_saksi_1]', nama: 'Alamat Saksi I', label: 'Alamat Saksi I *', deskripsi: 'Alamat domisili lengkap saksi pertama', kolom: 6, required: '1' },
    { kategori: 'saksi_ii', tipe: 'text', kode: '[form_nama_saksi_2]', nama: 'Nama Saksi II', label: 'Nama Lengkap Saksi II *', deskripsi: 'Nama lengkap saksi batas kedua', kolom: 6, required: '1' },
    { kategori: 'saksi_ii', tipe: 'text', kode: '[form_umur_saksi_2]', nama: 'Umur Saksi II (Tahun)', label: 'Umur Saksi II (Tahun) *', deskripsi: 'Usia saksi kedua dalam tahun (misal: 50)', kolom: 6, required: '1' },
    { kategori: 'saksi_ii', tipe: 'text', kode: '[form_pekerjaan_saksi_2]', nama: 'Pekerjaan Saksi II', label: 'Pekerjaan Saksi II *', deskripsi: 'Pekerjaan saksi kedua', kolom: 6, required: '1' },
    { kategori: 'saksi_ii', tipe: 'text', kode: '[form_alamat_saksi_2]', nama: 'Alamat Saksi II', label: 'Alamat Saksi II *', deskripsi: 'Alamat domisili lengkap saksi kedua', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'textarea', kode: '[form_keperluan]', nama: 'Keperluan Pengajuan Surat', label: 'Keperluan Pengajuan Surat', deskripsi: 'Tuliskan keperluan pengajuan surat secara lengkap', kolom: 12, required: '1' },
  ],
  'sistem-surat-keterangan-lahir-mati': [
    {
      kategori: 'individu',
      tipe: 'select-manual',
      kode: '[form_lama_kandungan]',
      nama: 'Lamanya Dalam Kandungan (Bulan)',
      label: 'Lama Dalam Kandungan (Bulan) *',
      deskripsi: 'Usia janin/bayi dalam kandungan saat lahir mati',
      pilihan: ['6', '7', '8', '9', '10'],
      kolom: 4,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'select-manual',
      kode: '[form_sex_bayi]',
      nama: 'Jenis Kelamin Bayi',
      label: 'Jenis Kelamin Bayi *',
      deskripsi: 'Jenis kelamin bayi lahir mati',
      pilihan: ['Laki-laki', 'Perempuan'],
      kolom: 4,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'date',
      kode: '[form_tanggal_lahir_mati]',
      nama: 'Tanggal Lahir Mati',
      label: 'Tanggal Lahir Mati *',
      deskripsi: 'Tanggal bayi dilahirkan dalam keadaan meninggal dunia',
      kolom: 4,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_jam_lahir_mati]',
      nama: 'Pukul / Jam Lahir Mati',
      label: 'Waktu / Jam Lahir Mati (WIB) *',
      deskripsi: 'Contoh: 08:30 atau 14:15',
      kolom: 4,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'select-manual',
      kode: '[form_jenis_kelahiran]',
      nama: 'Jenis Kelahiran',
      label: 'Jenis Kelahiran *',
      deskripsi: 'Jenis persalinan kelahiran',
      pilihan: ['Tunggal', 'Kembar 2', 'Kembar 3', 'Kembar 4', 'Lainnya'],
      kolom: 4,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'number',
      kode: '[form_kelahiran_ke]',
      nama: 'Anak Ini Lahir Yang Ke-',
      label: 'Kelahiran Anak Yang Ke- *',
      deskripsi: 'Urutan kelahiran anak dalam keluarga (Contoh: 1, 2, 3)',
      kolom: 4,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'select-manual',
      kode: '[form_tempat_dilahirkan]',
      nama: 'Tempat Dilahirkan',
      label: 'Kategori Tempat Dilahirkan *',
      deskripsi: 'Jenis fasilitas tempat melahirkan',
      pilihan: ['RS/RB', 'Puskesmas', 'Polindes', 'Rumah', 'Lainnya'],
      kolom: 4,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_nama_tempat_dilahirkan]',
      nama: 'Nama Faskes / Tempat Bersalin',
      label: 'Nama Tempat / Faskes Bersalin *',
      deskripsi: 'Contoh: RSUD Cilacap / Puskesmas Gandrungmangu / Rumah Sendiri',
      kolom: 8,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'select-manual',
      kode: '[form_penolong_kelahiran]',
      nama: 'Penolong Kelahiran',
      label: 'Profesi Penolong Kelahiran *',
      deskripsi: 'Kategori penolong persalinan',
      pilihan: ['Dokter', 'Bidan/Perawat', 'Dukun', 'Lainnya'],
      kolom: 4,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_nama_penolong]',
      nama: 'Nama Lengkap Penolong Kelahiran',
      label: 'Nama Dokter / Bidan Penolong *',
      deskripsi: 'Nama lengkap tenaga penolong medis',
      kolom: 8,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_sebab_lahir_mati]',
      nama: 'Sebab Lahir Mati',
      label: 'Sebab Lahir Mati *',
      deskripsi: 'Keterangan medis sebab kematian janin (Contoh: IUFD / Asfiksia Berat)',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'select-manual',
      kode: '[form_yang_menentukan]',
      nama: 'Yang Menentukan Kematian',
      label: 'Pihak Yang Menentukan *',
      deskripsi: 'Pihak resmi/medis yang menyatakan lahir mati',
      pilihan: ['Dokter', 'Bidan/Perawat', 'Tenaga Kes.', 'Kepolisian', 'Lainnya'],
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_tempat_kelahiran]',
      nama: 'Kota / Kabupaten Tempat Lahir',
      label: 'Kota / Kabupaten Tempat Lahir *',
      deskripsi: 'Contoh: CILACAP',
      kolom: 12,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_nik_ibu]',
      nama: 'NIK Ibu Kandung',
      label: 'NIK Ibu Kandung (16 Digit) *',
      deskripsi: 'Ketik NIK 16 digit ibu untuk mengisi data otomatis',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_nama_ibu]',
      nama: 'Nama Lengkap Ibu Kandung',
      label: 'Nama Lengkap Ibu Kandung *',
      deskripsi: 'Nama lengkap ibu kandung bayi',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'date',
      kode: '[form_tanggal_lahir_ibu]',
      nama: 'Tanggal Lahir Ibu',
      label: 'Tanggal Lahir Ibu',
      deskripsi: 'Tanggal lahir ibu',
      kolom: 4,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'number',
      kode: '[form_umur_ibu]',
      nama: 'Umur Ibu',
      label: 'Umur Ibu (Tahun)',
      deskripsi: 'Usia ibu saat persalinan',
      kolom: 2,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_pekerjaan_ibu]',
      nama: 'Pekerjaan Ibu',
      label: 'Pekerjaan Ibu',
      deskripsi: 'Contoh: Mengurus Rumah Tangga / Karyawan Swasta',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_alamat_ibu]',
      nama: 'Alamat Domisili Ibu',
      label: 'Alamat Domisili Ibu',
      deskripsi: 'Alamat tempat tinggal lengkap ibu',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'date',
      kode: '[form_tgl_nikah]',
      nama: 'Tanggal Pencatatan Perkawinan',
      label: 'Tanggal Perkawinan / Buku Nikah Orang Tua',
      deskripsi: 'Sesuai buku nikah / akta perkawinan',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_nik_ayah]',
      nama: 'NIK Ayah Kandung',
      label: 'NIK Ayah Kandung (16 Digit) *',
      deskripsi: 'Ketik NIK 16 digit ayah untuk mengisi data otomatis',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_nama_ayah]',
      nama: 'Nama Lengkap Ayah Kandung',
      label: 'Nama Lengkap Ayah Kandung *',
      deskripsi: 'Nama lengkap ayah kandung bayi',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'date',
      kode: '[form_tanggal_lahir_ayah]',
      nama: 'Tanggal Lahir Ayah',
      label: 'Tanggal Lahir Ayah',
      deskripsi: 'Tanggal lahir ayah',
      kolom: 4,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'number',
      kode: '[form_umur_ayah]',
      nama: 'Umur Ayah',
      label: 'Umur Ayah (Tahun)',
      deskripsi: 'Usia ayah dalam tahun',
      kolom: 2,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_pekerjaan_ayah]',
      nama: 'Pekerjaan Ayah',
      label: 'Pekerjaan Ayah',
      deskripsi: 'Contoh: Wiraswasta / Petani',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_alamat_ayah]',
      nama: 'Alamat Domisili Ayah',
      label: 'Alamat Domisili Ayah',
      deskripsi: 'Alamat tempat tinggal lengkap ayah',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'select-manual',
      kode: '[form_hubungan_pelapor]',
      nama: 'Hubungan Pelapor',
      label: 'Hubungan Pelapor dengan Bayi *',
      deskripsi: 'Status hubungan pemohon terhadap bayi yang lahir mati',
      pilihan: ['Ayah Kandung', 'Ibu Kandung', 'Keluarga Lain'],
      kolom: 12,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'textarea',
      kode: '[form_keperluan]',
      nama: 'Keperluan Pengajuan Surat',
      label: 'Keperluan Pengajuan Surat',
      deskripsi: 'Tuliskan keperluan pengajuan surat secara lengkap',
      kolom: 12,
      required: '1',
    },
  ],
  'sistem-surat-keterangan-ktp-dalam-proses': [
    { kategori: 'individu', tipe: 'date', kode: '[form_tanggal_permohonan_ktp]', nama: 'Tanggal Rekam KTP-el', label: 'Tanggal Perekaman / Permohonan KTP-el', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_keterangan]', nama: 'Keterangan Status KTP-el', label: 'Keterangan Status KTP-el', deskripsi: 'Sedang dalam proses pencetakan di Disdukcapil', kolom: 6, required: '1' },
  ],
  'sistem-surat-keterangan-wali-hakim': [
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_calon_istri]', nama: 'Nama Calon Mempelai Wanita', label: 'Nama Lengkap Calon Mempelai Wanita *', deskripsi: 'Nama lengkap calon pengantin wanita', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_ttl_calon_istri]', nama: 'Tempat, Tanggal Lahir Calon Wanita', label: 'Tempat, Tanggal Lahir Calon Mempelai Wanita *', deskripsi: 'Contoh: BANDUNG 18-01-1997', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_agama_calon_istri]', nama: 'Agama Calon Wanita', label: 'Agama Calon Mempelai Wanita *', deskripsi: 'Islam', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'textarea', kode: '[form_alamat_calon_istri]', nama: 'Alamat Calon Wanita', label: 'Alamat Tempat Tinggal Calon Mempelai Wanita *', deskripsi: 'Alamat lengkap tempat tinggal', kolom: 12, required: '1' },
    { kategori: 'pasangan', tipe: 'text', kode: '[form_nama_calon_suami]', nama: 'Nama Calon Suami', label: 'Nama Lengkap Calon Mempelai Pria (Suami) *', deskripsi: 'Nama lengkap calon suami', kolom: 6, required: '1' },
    { kategori: 'pasangan', tipe: 'text', kode: '[form_ttl_calon_suami]', nama: 'Tempat, Tanggal Lahir Calon Suami', label: 'Tempat, Tanggal Lahir Calon Mempelai Pria *', deskripsi: 'Contoh: RUMBAI 23-12-1986', kolom: 6, required: '1' },
    { kategori: 'pasangan', tipe: 'text', kode: '[form_agama_calon_suami]', nama: 'Agama Calon Suami', label: 'Agama Calon Mempelai Pria *', deskripsi: 'Islam', kolom: 6, required: '1' },
    { kategori: 'pasangan', tipe: 'textarea', kode: '[form_alamat_calon_suami]', nama: 'Alamat Calon Suami', label: 'Alamat Tempat Tinggal Calon Mempelai Pria *', deskripsi: 'Alamat lengkap tempat tinggal calon suami', kolom: 12, required: '1' },
    { kategori: 'individu', tipe: 'textarea', kode: '[form_keterangan_wali_hakim]', nama: 'Keterangan Wali Hakim', label: 'Keterangan Susunan Wali / Alasan Menggunakan Wali Hakim *', deskripsi: 'Contoh: susunan wali, Nikah untuk mempelai wanita sudah habis barisan wali/Tidak ada, maka untuk melangsungkan pernikahannya dengan memakai WALI HAKIM.', kolom: 12, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_kua_tujuan]', nama: 'KUA Kecamatan Tujuan', label: 'KUA Kecamatan Tujuan Akad Nikah', deskripsi: 'Contoh: KUA Kecamatan Gandrungmangu', kolom: 6, required: '0' },
  ],
  'sistem-surat-permohonan-duplikat-surat-nikah': [
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_calon_suami]', nama: 'Nama Lengkap Suami', label: 'Nama Lengkap Suami *', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_ttl_calon_suami]', nama: 'Tempat, Tanggal Lahir Suami', label: 'Tempat, Tanggal Lahir Suami *', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_agama_calon_suami]', nama: 'Agama Suami', label: 'Agama Suami *', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_pekerjaan_calon_suami]', nama: 'Pekerjaan Suami', label: 'Pekerjaan Suami *', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'textarea', kode: '[form_alamat_calon_suami]', nama: 'Alamat Suami', label: 'Alamat Suami (Desa, RT/RW, Kecamatan) *', kolom: 12, required: '1' },
    { kategori: 'pasangan', tipe: 'text', kode: '[form_nama_calon_istri]', nama: 'Nama Lengkap Istri', label: 'Nama Lengkap Istri *', kolom: 6, required: '1' },
    { kategori: 'pasangan', tipe: 'text', kode: '[form_ttl_calon_istri]', nama: 'Tempat, Tanggal Lahir Istri', label: 'Tempat, Tanggal Lahir Istri *', kolom: 6, required: '1' },
    { kategori: 'pasangan', tipe: 'text', kode: '[form_agama_calon_istri]', nama: 'Agama Istri', label: 'Agama Istri *', kolom: 6, required: '1' },
    { kategori: 'pasangan', tipe: 'text', kode: '[form_pekerjaan_calon_istri]', nama: 'Pekerjaan Istri', label: 'Pekerjaan Istri *', kolom: 6, required: '1' },
    { kategori: 'pasangan', tipe: 'textarea', kode: '[form_alamat_calon_istri]', nama: 'Alamat Istri', label: 'Alamat Istri (Desa, RT/RW, Kecamatan) *', kolom: 12, required: '1' },
    { kategori: 'pernikahan', tipe: 'text', kode: '[form_hari_tanggal_nikah]', nama: 'Hari / Tanggal Nikah', label: 'Hari / Tanggal Pernikahan *', deskripsi: 'Contoh: Senin, 12 Agustus 2018', kolom: 6, required: '1' },
    { kategori: 'pernikahan', tipe: 'text', kode: '[form_tempat_akad_nikah]', nama: 'Tempat Akad Nikah', label: 'Tempat Akad Nikah *', deskripsi: 'Contoh: Balai Nikah KUA Gandrungmangu', kolom: 6, required: '1' },
    { kategori: 'pernikahan', tipe: 'text', kode: '[form_kua_tempat_nikah]', nama: 'Dicatat di KUA Kecamatan', label: 'Dicatat di KUA Kecamatan *', deskripsi: 'Contoh: Gandrungmangu', kolom: 6, required: '1' },
    { kategori: 'pernikahan', tipe: 'text', kode: '[form_no_akta_nikah]', nama: 'Nomor Akta Nikah', label: 'Nomor Akta Nikah (Opsional)', deskripsi: 'Kosongkan jika tidak ingat, nanti dicek KUA', kolom: 6, required: '0' },
    { kategori: 'pernikahan', tipe: 'select-manual', kode: '[form_status_buku_nikah]', nama: 'Kondisi Buku Nikah', label: 'Kondisi Buku Nikah *', pilihan: ['Hilang', 'Rusak'], kolom: 6, required: '1' },
    { kategori: 'saksi_1', tipe: 'text', kode: '[form_nama_saksi_1]', nama: 'Nama Lengkap Saksi I', label: 'Nama Lengkap Saksi I *', kolom: 6, required: '1' },
    { kategori: 'saksi_1', tipe: 'text', kode: '[form_nik_saksi_1]', nama: 'NIK Saksi I', label: 'NIK Saksi I (16 Digit)', kolom: 6, required: '0' },
    { kategori: 'saksi_2', tipe: 'text', kode: '[form_nama_saksi_2]', nama: 'Nama Lengkap Saksi II', label: 'Nama Lengkap Saksi II *', kolom: 6, required: '1' },
    { kategori: 'saksi_2', tipe: 'text', kode: '[form_nik_saksi_2]', nama: 'NIK Saksi II', label: 'NIK Saksi II (16 Digit)', kolom: 6, required: '0' },
  ],
  'sistem-surat-keterangan-untuk-nikah-warga-non-muslim': [
    { kategori: 'kawin', tipe: 'text', kode: '[form_nama_badan_peradilan_kawin]', nama: 'Tempat Perkawinan / Nama Gereja / Tempat Ibadah', label: 'Tempat Perkawinan / Nama Tempat Ibadah (Gereja / Pura / Vihara) *', deskripsi: 'Contoh: Gereja Kristen Jawa Gandrungmangu', kolom: 6, required: '1' },
    { kategori: 'kawin', tipe: 'date', kode: '[form_tanggal_putusan_penetapan_pengadilan_kawin]', nama: 'Tanggal Pemberkatan / Perkawinan', label: 'Tanggal Pemberkatan / Perkawinan *', kolom: 6, required: '1' },
    { kategori: 'kawin', tipe: 'text', kode: '[form_nama_pemuka_agama]', nama: 'Nama Pemuka Agama / Pendeta', label: 'Nama Pemuka Agama / Pendeta / Romo *', deskripsi: 'Nama pemuka agama yang memberkati pernikahan', kolom: 6, required: '1' },
    { kategori: 'kawin', tipe: 'text', kode: '[form_no_surat_pemberkatan]', nama: 'Nomor Surat Perkawinan Agama', label: 'Nomor Surat Perkawinan Agama / Piagam', deskripsi: 'Contoh: 025/GKJ/X/2026 atau strip (-)', kolom: 6, required: '0' },
    { kategori: 'saksi_1', tipe: 'text', kode: '[form_nama_saksi_1]', nama: 'Nama Lengkap Saksi I', label: 'Nama Lengkap Saksi I *', deskripsi: 'Nama lengkap saksi pernikahan pertama', kolom: 6, required: '1' },
    { kategori: 'saksi_1', tipe: 'text', kode: '[form_nik_saksi_1]', nama: 'NIK Saksi I', label: 'NIK Saksi I (16 Digit)', deskripsi: '16 digit NIK Saksi Pertama', kolom: 6, required: '0' },
    { kategori: 'saksi_1', tipe: 'text', kode: '[form_tempat_lahir_saksi_1]', nama: 'Tempat Lahir Saksi I', label: 'Tempat Lahir Saksi I', kolom: 6, required: '0' },
    { kategori: 'saksi_1', tipe: 'date', kode: '[form_tanggal_lahir_saksi_1]', nama: 'Tanggal Lahir Saksi I', label: 'Tanggal Lahir Saksi I', kolom: 6, required: '0' },
    { kategori: 'saksi_1', tipe: 'text', kode: '[form_agama_saksi_1]', nama: 'Agama Saksi I', label: 'Agama Saksi I', kolom: 6, required: '0' },
    { kategori: 'saksi_1', tipe: 'text', kode: '[form_pekerjaan_saksi_1]', nama: 'Pekerjaan Saksi I', label: 'Pekerjaan Saksi I', kolom: 6, required: '0' },
    { kategori: 'saksi_1', tipe: 'textarea', kode: '[form_alamat_saksi_1]', nama: 'Alamat Saksi I', label: 'Alamat Lengkap Saksi I', kolom: 12, required: '0' },
    { kategori: 'saksi_2', tipe: 'text', kode: '[form_nama_saksi_2]', nama: 'Nama Lengkap Saksi II', label: 'Nama Lengkap Saksi II *', deskripsi: 'Nama lengkap saksi pernikahan kedua', kolom: 6, required: '1' },
    { kategori: 'saksi_2', tipe: 'text', kode: '[form_nik_saksi_2]', nama: 'NIK Saksi II', label: 'NIK Saksi II (16 Digit)', deskripsi: '16 digit NIK Saksi Kedua', kolom: 6, required: '0' },
    { kategori: 'saksi_2', tipe: 'text', kode: '[form_tempat_lahir_saksi_2]', nama: 'Tempat Lahir Saksi II', label: 'Tempat Lahir Saksi II', kolom: 6, required: '0' },
    { kategori: 'saksi_2', tipe: 'date', kode: '[form_tanggal_lahir_saksi_2]', nama: 'Tanggal Lahir Saksi II', label: 'Tanggal Lahir Saksi II', kolom: 6, required: '0' },
    { kategori: 'saksi_2', tipe: 'text', kode: '[form_agama_saksi_2]', nama: 'Agama Saksi II', label: 'Agama Saksi II', kolom: 6, required: '0' },
    { kategori: 'saksi_2', tipe: 'text', kode: '[form_pekerjaan_saksi_2]', nama: 'Pekerjaan Saksi II', label: 'Pekerjaan Saksi II', kolom: 6, required: '0' },
    { kategori: 'saksi_2', tipe: 'textarea', kode: '[form_alamat_saksi_2]', nama: 'Alamat Saksi II', label: 'Alamat Lengkap Saksi II', kolom: 12, required: '0' },
    { kategori: 'individu', tipe: 'textarea', kode: '[form_keperluan]', nama: 'Keperluan', label: 'Keperluan Pengajuan Surat', deskripsi: 'Pencatatan Perkawinan Non-Muslim pada Dinas Kependudukan dan Pencatatan Sipil', kolom: 12, required: '1' },
  ],
  'sistem-surat-keterangan-pengantar-rujuk-atau-cerai': [
    {
      kategori: 'cerai_rujuk',
      tipe: 'select-manual',
      kode: '[form_status_cerai_rujuk]',
      nama: 'Status Pengajuan',
      label: 'Status Pengajuan (Cerai / Rujuk) *',
      deskripsi: 'Pilih apakah pengantar ini untuk permohonan cerai atau pendaftaran rujuk',
      pilihan: ['Cerai', 'Rujuk', 'Rujuk / Cerai'],
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'pasangan',
      tipe: 'text',
      kode: '[form_nama_pasangan]',
      nama: 'Nama Lengkap Pasangan',
      label: 'Nama Lengkap Pasangan (Suami / Istri) *',
      deskripsi: 'Nama lengkap pasangan yang diceraikan / dirujuk',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'pasangan',
      tipe: 'text',
      kode: '[form_nama_ayah_pasangan]',
      nama: 'Nama Ayah Pasangan',
      label: 'Nama Ayah Pasangan (Bin / Binti) *',
      deskripsi: 'Nama ayah kandung pasangan untuk penulisan Bin / Binti',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'pasangan',
      tipe: 'text',
      kode: '[form_tempatlahir_pasangan]',
      nama: 'Tempat Lahir Pasangan',
      label: 'Tempat Lahir Pasangan *',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'pasangan',
      tipe: 'date',
      kode: '[form_tanggallahir_pasangan]',
      nama: 'Tanggal Lahir Pasangan',
      label: 'Tanggal Lahir Pasangan *',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'pasangan',
      tipe: 'text',
      kode: '[form_nik_pasangan]',
      nama: 'NIK Pasangan',
      label: 'NIK Pasangan (16 Digit)',
      deskripsi: '16 digit NIK pasangan jika ada',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'pasangan',
      tipe: 'text',
      kode: '[form_wn_pasangan]',
      nama: 'Kewarganegaraan Pasangan',
      label: 'Kewarganegaraan Pasangan',
      deskripsi: 'Contoh: WNI',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'pasangan',
      tipe: 'text',
      kode: '[form_agama_pasangan]',
      nama: 'Agama Pasangan',
      label: 'Agama Pasangan',
      deskripsi: 'Contoh: Islam',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'pasangan',
      tipe: 'text',
      kode: '[form_pekerjaan_pasangan]',
      nama: 'Pekerjaan Pasangan',
      label: 'Pekerjaan Pasangan',
      deskripsi: 'Contoh: Wiraswasta / Karyawan Swasta / Mengurus Rumah Tangga',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'pasangan',
      tipe: 'textarea',
      kode: '[form_alamat_pasangan]',
      nama: 'Alamat Pasangan',
      label: 'Alamat Lengkap Tempat Tinggal Pasangan *',
      deskripsi: 'Alamat tempat tinggal pasangan saat ini (RT/RW, Desa, Kecamatan, Kab/Kota)',
      kolom: 12,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'textarea',
      kode: '[form_keperluan]',
      nama: 'Keperluan',
      label: 'Keperluan Pengajuan Surat',
      deskripsi: 'Kelengkapan administrasi pengajuan gugatan / permohonan ke Pengadilan Agama / KUA',
      kolom: 12,
      required: '1',
    },
  ],
  'sistem-surat-permohonan-cerai': [
    {
      kategori: 'pasangan',
      tipe: 'text',
      kode: '[form_nama_pasangan]',
      nama: 'Nama Lengkap Pasangan',
      label: 'Nama Lengkap Pasangan (Suami / Istri) *',
      deskripsi: 'Nama lengkap pasangan yang diceraikan',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'pasangan',
      tipe: 'text',
      kode: '[form_nama_ayah_pasangan]',
      nama: 'Nama Ayah Pasangan',
      label: 'Nama Ayah Pasangan (Bin / Binti) *',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'pasangan',
      tipe: 'text',
      kode: '[form_tempatlahir_pasangan]',
      nama: 'Tempat Lahir Pasangan',
      label: 'Tempat Lahir Pasangan *',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'pasangan',
      tipe: 'date',
      kode: '[form_tanggallahir_pasangan]',
      nama: 'Tanggal Lahir Pasangan',
      label: 'Tanggal Lahir Pasangan *',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'pasangan',
      tipe: 'text',
      kode: '[form_nik_pasangan]',
      nama: 'NIK Pasangan',
      label: 'NIK Pasangan (16 Digit)',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'pasangan',
      tipe: 'textarea',
      kode: '[form_alamat_pasangan]',
      nama: 'Alamat Pasangan',
      label: 'Alamat Lengkap Tempat Tinggal Pasangan *',
      kolom: 12,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'textarea',
      kode: '[form_alasan_cerai]',
      nama: 'Alasan Perceraian',
      label: 'Alasan Pengajuan Cerai *',
      deskripsi: 'Uraikan secara singkat alasan perselisihan rumah tangga',
      kolom: 12,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'textarea',
      kode: '[form_keperluan]',
      nama: 'Keperluan',
      label: 'Keperluan Pengajuan Surat',
      deskripsi: 'Pendaftaran Gugatan / Permohonan Cerai pada Pengadilan Agama',
      kolom: 12,
      required: '1',
    },
  ],
  'sistem-surat-biodata-penduduk': [
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_alamat_sebelumnya]',
      nama: 'Alamat Sebelumnya',
      label: 'Alamat Sebelumnya (Jika Pernah Pindah / Domisili Luar)',
      deskripsi: 'Isi alamat sebelumnya jika ada, atau beri tanda strip (-) jika sejak lahir di desa',
      kolom: 12,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_dokumen_pasport]',
      nama: 'Nomor Dokumen Paspor',
      label: 'Nomor Paspor (Jika Memiliki)',
      deskripsi: 'Kosongkan atau beri tanda strip (-) jika tidak memiliki paspor',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'date',
      kode: '[form_tanggal_akhir_paspor]',
      nama: 'Tanggal Berakhir Paspor',
      label: 'Tanggal Berakhir Masa Berlaku Paspor',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_akta_lahir]',
      nama: 'Akta Kelahiran / Surat Kelahiran',
      label: 'Nomor / Kepemilikan Akta Kelahiran',
      deskripsi: 'Contoh: Ada (No: 3301-LT-12052015-0012) atau strip (-)',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_akta_perkawinan]',
      nama: 'Akta Perkawinan / Buku Nikah',
      label: 'Nomor Akta Perkawinan / Buku Nikah (Jika Ada)',
      deskripsi: 'Contoh: 123/45/V/2010 atau strip (-)',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'date',
      kode: '[form_tanggalperkawinan]',
      nama: 'Tanggal Akta Perkawinan / Buku Nikah',
      label: 'Tanggal Akta Perkawinan / Pernikahan',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_akta_perceraian]',
      nama: 'Akta Perceraian',
      label: 'Nomor Akta Perceraian (Jika Bercerai)',
      deskripsi: 'Beri tanda strip (-) jika tidak ada',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'date',
      kode: '[form_tanggalperceraian]',
      nama: 'Tanggal Perceraian',
      label: 'Tanggal Akta Perceraian',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'select',
      kode: '[form_cacat]',
      nama: 'Kelainan Fisik / Mental',
      label: 'Kelainan Fisik & Mental / Penyandang Disabilitas',
      deskripsi: 'Pilih kondisi fisik/mental penduduk',
      pilihan: [
        'Tidak Ada',
        'Cacat Fisik',
        'Cacat Netra/Buta',
        'Cacat Rungu/Wicara',
        'Cacat Mental/Jiwa',
        'Cacat Fisik dan Mental',
        'Cacat Lainnya',
      ],
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_telepon]',
      nama: 'Nomor Telepon / Handphone',
      label: 'Nomor Telepon / WhatsApp Pemohon',
      deskripsi: 'Nomor telepon aktif kepala keluarga / pemohon',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_email]',
      nama: 'Email Pemohon',
      label: 'Alamat Email (Jika Ada)',
      deskripsi: 'Alamat email aktif kepala keluarga / pemohon',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'textarea',
      kode: '[form_keperluan]',
      nama: 'Keperluan / Peruntukan Surat',
      label: 'Keperluan Pengajuan Surat Biodata Penduduk',
      deskripsi: 'Tuliskan keperluan pengajuan surat (contoh: Persyaratan Pengurusan Dokumen Kependudukan / Pendaftaran Sekolah / dll)',
      kolom: 12,
      required: '1',
    },
  ],
  'sistem-surat-permohonan-duplikat-kelahiran': [
    {
      kategori: 'individu',
      tipe: 'select-manual',
      kode: '[form_hubungan_dengan_ybs]',
      nama: 'Hubungan Pelapor dengan Ybs',
      label: 'Hubungan Pelapor dengan Yang Bersangkutan',
      deskripsi: 'Pilih status hubungan pelapor terhadap pemilik akta kelahiran',
      pilihan: ['Orang Tua (Bapak / Ibu)', 'Yang Bersangkutan (Diri Sendiri)', 'Kuasa / Famili Lain'],
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_nik_anak]',
      nama: 'NIK Yang Bersangkutan (Pemilik Akta)',
      label: 'NIK Yang Bersangkutan / Anak (Pemilik Akta)',
      deskripsi: '16 digit NIK pemilik akta kelahiran yang dimohonkan duplikat',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_nama_anak]',
      nama: 'Akta Atas Nama',
      label: 'Akta Atas Nama (Nama Lengkap Pemilik Akta)',
      deskripsi: 'Nama lengkap yang tercantum pada kutipan akta kelahiran',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_no_akta_kelahiran]',
      nama: 'Nomor Akta Kelahiran',
      label: 'Nomor Akta Kelahiran yang Hilang / Rusak',
      deskripsi: 'Nomor kutipan akta kelahiran lama jika masih memiliki salinan / foto',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_no_akta_nikah]',
      nama: 'Nomor Akta Nikah Orang Tua',
      label: 'Nomor Akta Nikah / Buku Nikah Orang Tua',
      deskripsi: 'Nomor akta perkawinan / buku nikah orang tua kandung',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'date',
      kode: '[form_tgl_akta_nikah]',
      nama: 'Tanggal Akta Nikah Orang Tua',
      label: 'Tanggal Akta Nikah / Buku Nikah Orang Tua',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'select-manual',
      kode: '[form_alasan_duplikat]',
      nama: 'Alasan Permohonan Duplikat',
      label: 'Alasan Permohonan Duplikat (Hilang / Rusak / Ralat)',
      deskripsi: 'Pilih penyebab permohonan penerbitan kembali kutipan akta kelahiran',
      pilihan: ['Akta Kelahiran Hilang Tercecer', 'Akta Kelahiran Rusak / Lapuk / Terbakar', 'Permohonan Ralat Data Akta Kelahiran', 'Lainnya'],
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_lokasi_kehilangan]',
      nama: 'Lokasi / Perkiraan Hilang',
      label: 'Lokasi Hilang / Kejadian Kerusakan',
      deskripsi: 'Contoh: Di perjalanan sekitar Gandrungmangu / Rumah Tempat Tinggal',
      kolom: 6,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'textarea',
      kode: '[form_keperluan]',
      nama: 'Keterangan Kronologi / Keperluan',
      label: 'Keterangan Kronologi / Keperluan Pengajuan',
      deskripsi: 'Tuliskan rincian kronologi kehilangan/kerusakan akta untuk lampiran SP-HILANG',
      kolom: 12,
      required: '0',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_nama_saksi_1]',
      nama: 'Nama Lengkap Saksi I',
      label: 'Nama Lengkap Saksi I',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_nik_saksi_1]',
      nama: 'NIK Saksi I',
      label: 'NIK Saksi I (16 Digit)',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_nama_saksi_2]',
      nama: 'Nama Lengkap Saksi II',
      label: 'Nama Lengkap Saksi II',
      kolom: 6,
      required: '1',
    },
    {
      kategori: 'individu',
      tipe: 'text',
      kode: '[form_nik_saksi_2]',
      nama: 'NIK Saksi II',
      label: 'NIK Saksi II (16 Digit)',
      kolom: 6,
      required: '1',
    },
  ],
  'sistem-surat-pengantar-permohonan-penerbitan-buku-pas-lintas': [
    { kategori: 'individu', tipe: 'text', kode: '[form_tujuan_pas_lintas]', nama: 'Wilayah Tujuan Lintas Batas', label: 'Negara / Wilayah Tujuan Lintas Batas', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_maksud_kunjungan]', nama: 'Maksud Kunjungan', label: 'Maksud Kunjungan Lintas Batas', kolom: 6, required: '1' },
  ],
  'sistem-surat-keterangan-belum-menikah': [
    {
      kategori: 'individu',
      tipe: 'select-manual',
      kode: '[form_status_perkawinan]',
      nama: 'Status Perkawinan Saat Ini',
      label: 'Status Perkawinan Saat Ini',
      pilihan: ['Belum Pernah Kawin (Jejaka / Perawan)', 'Belum Kawin', 'Jejaka', 'Perawan', 'Duda Cerai Hidup', 'Duda Cerai Mati', 'Janda Cerai Hidup', 'Janda Cerai Mati'],
      kolom: 6,
      required: '1',
    },
    { kategori: 'individu', tipe: 'text', kode: '[form_keperluan]', nama: 'Keperluan Surat', label: 'Keperluan Pengajuan Surat', deskripsi: 'Contoh: Persyaratan Pendaftaran Pernikahan di KUA / Melamar Pekerjaan / Berkas CPNS', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_tujuan]', nama: 'Instansi / Pihak Tujuan', label: 'Instansi / Pihak Tujuan', deskripsi: 'Contoh: Kantor KUA Kec. Gandrungmangu / HRD Perusahaan', kolom: 6, required: '0' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_ayah]', nama: 'Nama Ayah Kandung', label: 'Nama Lengkap Ayah Kandung', kolom: 6, required: '0' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nik_ayah]', nama: 'NIK Ayah', label: 'NIK Ayah (16 Digit)', kolom: 6, required: '0' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_ibu]', nama: 'Nama Ibu Kandung', label: 'Nama Lengkap Ibu Kandung', kolom: 6, required: '0' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nik_ibu]', nama: 'NIK Ibu', label: 'NIK Ibu (16 Digit)', kolom: 6, required: '0' },
    { kategori: 'saksi_1', tipe: 'text', kode: '[form_nama_saksi_1]', nama: 'Nama Saksi I', label: 'Nama Lengkap Saksi I', kolom: 6, required: '1' },
    { kategori: 'saksi_1', tipe: 'text', kode: '[form_nik_saksi_1]', nama: 'NIK Saksi I', label: 'NIK Saksi I (16 Digit)', kolom: 6, required: '1' },
    { kategori: 'saksi_1', tipe: 'text', kode: '[form_pekerjaan_saksi_1]', nama: 'Pekerjaan Saksi I', label: 'Pekerjaan Saksi I', kolom: 6, required: '0' },
    { kategori: 'saksi_1', tipe: 'text', kode: '[form_jabatan_saksi_1]', nama: 'Jabatan / Hubungan Saksi I', label: 'Jabatan / Keterangan Saksi I (Contoh: Ketua RT 001)', kolom: 6, required: '0' },
    { kategori: 'saksi_1', tipe: 'textarea', kode: '[form_alamat_saksi_1]', nama: 'Alamat Saksi I', label: 'Alamat Tempat Tinggal Saksi I', kolom: 12, required: '0' },
    { kategori: 'saksi_2', tipe: 'text', kode: '[form_nama_saksi_2]', nama: 'Nama Saksi II', label: 'Nama Lengkap Saksi II', kolom: 6, required: '1' },
    { kategori: 'saksi_2', tipe: 'text', kode: '[form_nik_saksi_2]', nama: 'NIK Saksi II', label: 'NIK Saksi II (16 Digit)', kolom: 6, required: '1' },
    { kategori: 'saksi_2', tipe: 'text', kode: '[form_pekerjaan_saksi_2]', nama: 'Pekerjaan Saksi II', label: 'Pekerjaan Saksi II', kolom: 6, required: '0' },
    { kategori: 'saksi_2', tipe: 'text', kode: '[form_jabatan_saksi_2]', nama: 'Jabatan / Hubungan Saksi II', label: 'Jabatan / Keterangan Saksi II (Contoh: Ketua RW 005)', kolom: 6, required: '0' },
    { kategori: 'saksi_2', tipe: 'textarea', kode: '[form_alamat_saksi_2]', nama: 'Alamat Saksi II', label: 'Alamat Tempat Tinggal Saksi II', kolom: 12, required: '0' },
  ],
  'sistem-surat-keterangan-moyang': [
    { kategori: 'individu', tipe: 'text', kode: '[form_keterangan_status_moyang]', nama: 'Keterangan Status / Moyang', label: 'Keterangan Status Pokok (Redaksi Surat)', deskripsi: 'Contoh: Bahwa orang tersebut di atas adalah benar-benar penduduk Desa Sampeldes / memiliki perbedaan nama/data pada dokumen... / merupakan garis keturunan dari...', kolom: 12, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_keterangan_tambahan]', nama: 'Keterangan Tambahan', label: 'Keterangan Tambahan Sesuai Keperluan', deskripsi: 'Contoh: meninggalkan desa sejak tahun ... atau menerangkan hubungan keluarga/moyang', kolom: 12, required: '0' },
    { kategori: 'individu', tipe: 'text', kode: '[form_keperluan]', nama: 'Keperluan Surat', label: 'Keperluan Pengajuan Surat', deskripsi: 'Contoh: Pembuatan Akta Kelahiran di Kantor Disdukcapil', kolom: 12, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_moyang]', nama: 'Nama Moyang / Leluhur', label: 'Nama Lengkap Kakek / Nenek / Moyang', kolom: 6, required: '0' },
    { kategori: 'individu', tipe: 'text', kode: '[form_hubungan_moyang]', nama: 'Hubungan Silsilah', label: 'Hubungan Silsilah dengan Pemohon', deskripsi: 'Contoh: Kakek Kandung dari Pihak Ayah', kolom: 6, required: '0' },
  ],
  'sistem-surat-keterangan-wali': [
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_wali]', nama: 'Nama Kepala Keluarga / Wali', label: 'Nama Lengkap Wali (Kepala Keluarga)', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nik_wali]', nama: 'NIK Wali', label: 'NIK Wali (16 Digit)', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_ttl_wali]', nama: 'Tempat Tanggal Lahir Wali', label: 'Tempat, Tanggal Lahir Wali', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'select-manual', pilihan: ['Laki-Laki', 'Perempuan'], kode: '[form_jenis_kelamin_wali]', nama: 'Jenis Kelamin Wali', label: 'Jenis Kelamin Wali', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_agama_wali]', nama: 'Agama Wali', label: 'Agama Wali', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_pekerjaan_wali]', nama: 'Pekerjaan Utama Wali', label: 'Pekerjaan Utama Wali', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'textarea', kode: '[form_alamat_wali]', nama: 'Alamat Wali', label: 'Alamat Lengkap Tempat Tinggal Wali', kolom: 12, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_anak]', nama: 'Nama Siswa / Anak', label: 'Nama Siswa / Anak yang Diwakili', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_ttl_anak]', nama: 'Tempat Tanggal Lahir Anak', label: 'Tempat, Tanggal Lahir Siswa / Anak', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_no_kk_anak]', nama: 'No. KK Anak', label: 'Nomor Kartu Keluarga (KK) Siswa / Anak', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nik_anak]', nama: 'NIK Siswa / Anak', label: 'NIK Siswa / Anak (16 Digit)', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_ayah_kandung]', nama: 'Nama Ayah Kandung', label: 'Nama Ayah Kandung Siswa / Anak', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_ibu_kandung]', nama: 'Nama Ibu Kandung', label: 'Nama Ibu Kandung Siswa / Anak', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'select-manual', pilihan: ['Laki-Laki', 'Perempuan'], kode: '[form_jenis_kelamin_anak]', nama: 'Jenis Kelamin Anak', label: 'Jenis Kelamin Siswa / Anak', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_agama_anak]', nama: 'Agama Anak', label: 'Agama Siswa / Anak', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_pekerjaan_anak]', nama: 'Pekerjaan Utama Anak', label: 'Pekerjaan Utama (Contoh: Pelajar)', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_sekolah]', nama: 'Nama Sekolah', label: 'Nama Sekolah (Contoh: SD IT Cihanja / SDN 01 Sampeldes)', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_kelas_anak]', nama: 'Kelas', label: 'Kelas (Contoh: 2 (Dua))', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'textarea', kode: '[form_alamat_anak]', nama: 'Alamat Siswa / Anak', label: 'Alamat Lengkap Siswa / Anak', kolom: 12, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_keperluan]', nama: 'Keperluan Surat', label: 'Keperluan Penggunaan Surat', deskripsi: 'Contoh: Pengambilan/Pencairan Bantuan Program Indonesia Pintar (PIP)', kolom: 12, required: '1' },
  ],
  'sistem-surat-keterangan-pemakaman': [
    { kategori: 'individu', tipe: 'text', kode: '[form_nama_jenazah]', nama: 'Nama Almarhum / Almarhumah', label: 'Nama Lengkap Almarhum / Almarhumah', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'date', kode: '[form_tanggal_meninggal]', nama: 'Hari & Tanggal Meninggal', label: 'Hari & Tanggal Meninggal Dunia', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_jam_kematian]', nama: 'Waktu Meninggal', label: 'Waktu / Jam Meninggal (Contoh: 09.00 WIB)', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'date', kode: '[form_tanggal_pemakaman]', nama: 'Dimakamkan Pada', label: 'Dimakamkan Pada (Hari & Tanggal)', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_jam_pemakaman]', nama: 'Waktu Pemakaman', label: 'Waktu Pemakaman (Contoh: 13.00 WIB)', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_lokasi_tpu]', nama: 'Tempat Pemakaman', label: 'Tempat Pemakaman (Contoh: Pemakaman Islam Desa Sampeldes)', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'textarea', kode: '[form_keperluan]', nama: 'Keperluan', label: 'Keperluan Surat', deskripsi: 'Contoh: Administrasi Keterangan Pemakaman Jenazah / Klaim Santunan Kematian', kolom: 12, required: '1' },
  ],
  'sistem-surat-pengantar-umum': [
    { kategori: 'individu', tipe: 'text', kode: '[form_tujuan]', nama: 'Instansi / Pihak Tujuan', label: 'Instansi / Pihak Tujuan Surat Pengantar', kolom: 12, required: '1' },
  ],
  'sistem-surat-keterangan-jamkesos': [
    { kategori: 'individu', tipe: 'text', kode: '[form_rekam_medis]', nama: 'No. Rekam Medis', label: 'Nomor Rekam Medis Pasien', deskripsi: 'Nomor Rekam Medis dari fasilitas kesehatan / RS', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_jenis_penyakit]', nama: 'Jenis Penyakit', label: 'Jenis Penyakit / Diagnosa Medis', deskripsi: 'Diagnosa penyakit pasien (contoh: Gagal Ginjal)', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_no_bpjs]', nama: 'No. BPJS Kesehatan', label: 'Nomor Kartu BPJS Kesehatan', deskripsi: '13 digit nomor kartu BPJS Kesehatan / KIS', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'textarea', kode: '[form_keperluan]', nama: 'Keperluan', label: 'Keperluan Pengajuan Surat', deskripsi: 'Tuliskan keperluan pengajuan surat secara lengkap', kolom: 12, required: '1' },
  ],
  'sistem-surat-keterangan-reaktivasi-bpjs': [
    { kategori: 'individu', tipe: 'text', kode: '[form_rekam_medis]', nama: 'No. Rekam Medis', label: 'Nomor Rekam Medis Pasien', deskripsi: 'Nomor Rekam Medis dari fasilitas kesehatan / RS', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_jenis_penyakit]', nama: 'Jenis Penyakit', label: 'Jenis Penyakit / Diagnosa Medis', deskripsi: 'Diagnosa penyakit pasien (contoh: Gagal Ginjal)', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'text', kode: '[form_no_bpjs]', nama: 'No. BPJS Kesehatan', label: 'Nomor Kartu BPJS Kesehatan', deskripsi: '13 digit nomor kartu BPJS Kesehatan / KIS', kolom: 6, required: '1' },
    { kategori: 'individu', tipe: 'textarea', kode: '[form_keperluan]', nama: 'Keperluan', label: 'Keperluan Pengajuan Surat', deskripsi: 'Tuliskan keperluan pengajuan surat secara lengkap', kolom: 12, required: '1' },
  ],
};

export const SURAT_KETERANGAN_KEMATIAN_TEMPLATE = `<h4 style="margin: 0; text-align: center;"><span style="text-decoration: underline;">SURAT KETERANGAN KEMATIAN</span></h4>
<p style="margin: 0; text-align: center;">Nomor : [Format_nomor_suraT]<br><br></p>
<p style="text-align: justify; text-indent: 36px; margin-top: 10px; margin-bottom: 12px;">Yang bertanda tangan dibawah ini Kepala Desa [NaMa_desa] Kecamatan [NaMa_kecamatan] Kabupaten [NaMa_kabupaten], menerangkan dengan sesungguhnya bahwa :</p>
<table style="border-collapse: collapse; width: 100%; margin-left: 20px; margin-bottom: 12px;" border="0">
<tbody>
<tr>
<td style="width: 30%; padding: 2px 0;">Nama</td>
<td style="width: 2%; text-align: center; padding: 2px 0;">:</td>
<td style="width: 68%; padding: 2px 0;"><strong>[NAma]</strong></td>
</tr>
<tr>
<td style="padding: 2px 0;">Tempat tanggal lahir</td>
<td style="text-align: center; padding: 2px 0;">:</td>
<td style="padding: 2px 0;">[Tempat_tanggal_lahiR]</td>
</tr>
<tr>
<td style="padding: 2px 0;">Jenis Kelamin</td>
<td style="text-align: center; padding: 2px 0;">:</td>
<td style="padding: 2px 0;">[Jenis_kelamin]</td>
</tr>
<tr>
<td style="padding: 2px 0;">Pekerjaan</td>
<td style="text-align: center; padding: 2px 0;">:</td>
<td style="padding: 2px 0;">[Pekerjaan]</td>
</tr>
<tr>
<td style="padding: 2px 0; vertical-align: top;">Alamat rumah</td>
<td style="text-align: center; padding: 2px 0; vertical-align: top;">:</td>
<td style="padding: 2px 0; vertical-align: top;">[Alamat_rumah]</td>
</tr>
<tr>
<td style="padding: 2px 0;">Agama</td>
<td style="text-align: center; padding: 2px 0;">:</td>
<td style="padding: 2px 0;">[Agama]</td>
</tr>
</tbody>
</table>
<p style="text-align: justify; margin-top: 14px; margin-bottom: 8px;">Yang bersangkutan benar telah Meninggal Dunia pada :</p>
<table style="border-collapse: collapse; width: 100%; margin-left: 20px; margin-bottom: 14px;" border="0">
<tbody>
<tr>
<td style="width: 30%; padding: 2px 0;">Hari / tanggal</td>
<td style="width: 2%; text-align: center; padding: 2px 0;">:</td>
<td style="width: 68%; padding: 2px 0;">[Hari_kematiaN], [Tanggal_kematiaN]</td>
</tr>
<tr>
<td style="padding: 2px 0;">Jam</td>
<td style="text-align: center; padding: 2px 0;">:</td>
<td style="padding: 2px 0;">[Jam_kematiaN]</td>
</tr>
<tr>
<td style="padding: 2px 0;">Sebab Kematian</td>
<td style="text-align: center; padding: 2px 0;">:</td>
<td style="padding: 2px 0;">[Sebab_kematiaN]</td>
</tr>
<tr>
<td style="padding: 2px 0; vertical-align: top;">Yang menerangkan Kematian</td>
<td style="text-align: center; padding: 2px 0; vertical-align: top;">:</td>
<td style="padding: 2px 0; vertical-align: top;">[Yang_menerangkaN]</td>
</tr>
<tr>
<td style="padding: 2px 0; vertical-align: top;">Tempat Kematian</td>
<td style="text-align: center; padding: 2px 0; vertical-align: top;">:</td>
<td style="padding: 2px 0; vertical-align: top;">[Tempat_kematiaN]</td>
</tr>
</tbody>
</table>
<p style="text-align: justify; text-indent: 36px; margin-top: 14px; margin-bottom: 20px;">Demikian Surat Keterangan Kematian ini diberikan untuk dapat dipergunakan sebagaimana mestinya.</p>
<table style="border-collapse: collapse; width: 100%; margin-top: 10px;" border="0">
<tbody>
<tr>
<td style="width: 48%; text-align: left; vertical-align: top;">
<div style="font-size: 10pt; line-height: 1.45; margin-top: 10px;">
<p style="margin: 0; font-weight: bold;">Persyaratan :</p>
<ol style="margin: 3px 0 0 16px; padding: 0;">
<li>Foto kopi KTP yang meninggal dan pelapor</li>
<li>Foto kopi Kartu Keluarga</li>
</ol>
</div>
</td>
<td style="width: 52%; text-align: center; vertical-align: top;">
<div>[NaMa_desa], [TgL_surat]</div>
<div style="margin-top: 2px;">[Atas_namA]</div>
<div style="min-height: 52px; display: flex; align-items: center; justify-content: center; margin: 4px 0;">[qr_bsre]</div>
<div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">[Nama_pamonG]</div>
<div style="margin-top: 2px; font-size: 10pt;">[SEbutan_nip_desa] : [nip_pamong]</div>
</td>
</tr>
</tbody>
</table>`;

export const SURAT_KETERANGAN_DOMISILI_TEMPLATE = `<h4 style="margin: 0; text-align: center; font-weight: bold;"><span style="text-decoration: underline;"><strong>SURAT KETERANGAN DOMISILI</strong></span></h4>
<p style="margin: 2px 0 16px 0; text-align: center; font-size: 11pt;">Nomor : [Format_nomor_suraT]</p>
<p style="text-align: justify; text-indent: 36px; margin: 0 0 10px 0; line-height: 1.5;">Yang bertanda tangan di bawah ini [JaBatan] [NaMa_desa], Kecamatan [NaMa_kecamatan], [SeButan_kabupaten] [NaMa_kabupaten], Provinsi [NaMa_provinsi] menerangkan dengan sebenarnya bahwa :</p>
<table style="border-collapse: collapse; width: 100%; margin-left: 20px; margin-bottom: 12px; line-height: 1.45;" border="0">
<tbody>
<tr>
  <td style="width: 4%; vertical-align: top; padding: 2px 0;">1.</td>
  <td style="width: 34%; vertical-align: top; padding: 2px 0;">Nama Lengkap</td>
  <td style="width: 2%; text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="width: 60%; vertical-align: top; padding: 2px 0;"><strong>[NAma]</strong></td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">2.</td>
  <td style="vertical-align: top; padding: 2px 0;">NIK / No. KTP</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[Nik]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">3.</td>
  <td style="vertical-align: top; padding: 2px 0;">Tempat / Tanggal Lahir</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[Tempat_tanggal_lahiR]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">4.</td>
  <td style="vertical-align: top; padding: 2px 0;">Jenis Kelamin</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[Jenis_kelamin]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">5.</td>
  <td style="vertical-align: top; padding: 2px 0;">Agama</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[Agama]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">6.</td>
  <td style="vertical-align: top; padding: 2px 0;">Status Perkawinan</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[Status_kawin]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">7.</td>
  <td style="vertical-align: top; padding: 2px 0;">Pendidikan</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[Pendidikan_kk]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">8.</td>
  <td style="vertical-align: top; padding: 2px 0;">Pekerjaan</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[Pekerjaan]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">9.</td>
  <td style="vertical-align: top; padding: 2px 0;">Kewarganegaraan</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[Warga_negara]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">10.</td>
  <td style="vertical-align: top; padding: 2px 0;">Alamat / Tempat Tinggal</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[Alamat_lengkap]</td>
</tr>
</tbody>
</table>
<p style="text-align: justify; text-indent: 36px; margin: 12px 0 8px 0; line-height: 1.5;">Orang tersebut di atas adalah benar-benar warga kami yang bertempat tinggal di [Alamat] dan tercatat dengan No. KK : [No_kK] Kepala Keluarga : [Kepala_kK].</p>
<p style="text-align: justify; text-indent: 36px; margin: 8px 0; line-height: 1.5;">Surat Keterangan ini dibuat untuk Keperluan : <strong>[Form_keperluaN]</strong></p>
<p style="text-align: justify; text-indent: 36px; margin: 8px 0 20px 0; line-height: 1.5;">Demikian surat keterangan ini dibuat dengan sebenarnya, untuk dipergunakan sebagaimana mestinya.</p>
<table style="border-collapse: collapse; width: 100%; margin-top: 16px;" border="0">
<tbody>
<tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center; font-size: 11pt;">[NaMa_desa], [TgL_surat]</td>
</tr>
<tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center; font-size: 11pt;">[Atas_namA]</td>
</tr>
<tr style="height: 52px;">
  <td style="width: 50%; text-align: center; height: 52px;">&nbsp;</td>
  <td style="width: 50%; text-align: center; height: 52px; vertical-align: middle;">[qr_bsre]</td>
</tr>
<tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center; font-size: 11pt;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_pamonG]</u></strong></td>
</tr>
<tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center; font-size: 10pt; color: #333;">[SEbutan_nip_desa] : [nip_pamong]</td>
</tr>
</tbody>
</table>`;

export const SURAT_PERMOHONAN_PERUBAHAN_KK_TEMPLATE = `<h4 style="margin: 0; text-align: center; font-weight: bold;"><span style="text-decoration: underline;"><strong>SURAT PERMOHONAN PERUBAHAN KARTU KELUARGA</strong></span></h4>
<p style="margin: 2px 0 16px 0; text-align: center; font-size: 11pt;">Nomor : [Format_nomor_suraT]</p>
<p style="text-align: justify; text-indent: 36px; margin: 0 0 10px 0; line-height: 1.5;">Yang bertanda tangan di bawah ini [Jabatan] [Nama_desa], Kecamatan [Nama_kecamatan], [Sebutan_kabupaten] [Nama_kabupaten], Provinsi [Nama_provinsi] menerangkan dengan sebenarnya bahwa :</p>
<table style="border-collapse: collapse; width: 100%; margin-left: 20px; margin-bottom: 12px; line-height: 1.45;" border="0">
<tbody>
<tr>
  <td style="width: 4%; vertical-align: top; padding: 2px 0;">1.</td>
  <td style="width: 34%; vertical-align: top; padding: 2px 0;">Nama Lengkap</td>
  <td style="width: 2%; text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="width: 60%; vertical-align: top; padding: 2px 0;"><strong>[NAma]</strong></td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">2.</td>
  <td style="vertical-align: top; padding: 2px 0;">Tempat/tanggal lahir</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[TtL]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">3.</td>
  <td style="vertical-align: top; padding: 2px 0;">Umur</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[UsIa]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">4.</td>
  <td style="vertical-align: top; padding: 2px 0;">Warga negara</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[WArga_negara]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">5.</td>
  <td style="vertical-align: top; padding: 2px 0;">Agama</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[AgAma]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">6.</td>
  <td style="vertical-align: top; padding: 2px 0;">Jenis Kelamin</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[JeNis_kelamin]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">7.</td>
  <td style="vertical-align: top; padding: 2px 0;">Pekerjaan</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[Pekerjaan]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">8.</td>
  <td style="vertical-align: top; padding: 2px 0;">Tempat tinggal</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[Alamat_lengkaP]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">9.</td>
  <td style="vertical-align: top; padding: 2px 0;">Surat bukti diri</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">&nbsp;</td>
  <td style="vertical-align: top; padding: 2px 0;">&nbsp;</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">&nbsp;</td>
  <td style="vertical-align: top; padding: 2px 0; padding-left: 12px;">- KTP</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[Nik]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">&nbsp;</td>
  <td style="vertical-align: top; padding: 2px 0; padding-left: 12px;">- KK</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[No_kk]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">10.</td>
  <td style="vertical-align: top; padding: 2px 0;">Keperluan</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">Permohonan Perubahan Kartu Keluarga WNI.</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">11.</td>
  <td style="vertical-align: top; padding: 2px 0;">Keterangan lain-lain</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">Orang tersebut di atas adalah benar-benar penduduk desa kami dan adat istiadat baik.</td>
</tr>
</tbody>
</table>
<p style="text-align: justify; text-indent: 36px; margin: 10px 0 16px 0; line-height: 1.5;">Demikian surat ini dibuat, untuk dipergunakan sebagaimana mestinya.</p>
<table style="border-collapse: collapse; width: 100%; margin-top: 16px;" border="0">
<tbody>
<tr>
  <td style="width: 35%; text-align: center;">&nbsp;</td>
  <td style="width: 30%;">&nbsp;</td>
  <td style="width: 35%; text-align: center; font-size: 11pt;">[NaMa_desa], [TgL_surat]</td>
</tr>
<tr>
  <td style="width: 35%; text-align: center; font-size: 11pt;">Pemegang Surat</td>
  <td style="width: 30%;">&nbsp;</td>
  <td style="width: 35%; text-align: center; font-size: 11pt;">[Atas_namA]</td>
</tr>
<tr style="height: 52px;">
  <td style="width: 35%; text-align: center; height: 52px;">&nbsp;</td>
  <td style="width: 30%; height: 52px;">&nbsp;</td>
  <td style="width: 35%; height: 52px; text-align: center; vertical-align: middle;">[qr_bsre]</td>
</tr>
<tr>
  <td style="width: 35%; text-align: center; font-size: 11pt;"><strong><u>[NAma]</u></strong></td>
  <td style="width: 30%;">&nbsp;</td>
  <td style="width: 35%; text-align: center; font-size: 11pt;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_pamonG]</u></strong></td>
</tr>
<tr>
  <td style="width: 35%;">&nbsp;</td>
  <td style="width: 30%;">&nbsp;</td>
  <td style="width: 35%; text-align: center; font-size: 10pt; color: #333;">[SEbutan_nip_desa] : [nip_pamong]</td>
</tr>
<tr>
  <td style="width: 35%;">&nbsp;</td>
  <td style="width: 30%; height: 16px;">&nbsp;</td>
  <td style="width: 35%;">&nbsp;</td>
</tr>
<tr>
  <td style="width: 35%;">&nbsp;</td>
  <td style="width: 30%; text-align: center; font-size: 11pt;">Mengetahui,</td>
  <td style="width: 35%;">&nbsp;</td>
</tr>
<tr>
  <td style="width: 35%;">&nbsp;</td>
  <td style="width: 30%; text-align: center; font-size: 11pt;">Camat [NaMa_kecamatan]</td>
  <td style="width: 35%;">&nbsp;</td>
</tr>
<tr style="height: 50px;">
  <td style="width: 35%;">&nbsp;</td>
  <td style="width: 30%; height: 50px;">&nbsp;</td>
  <td style="width: 35%;">&nbsp;</td>
</tr>
<tr>
  <td style="width: 35%;">&nbsp;</td>
  <td style="width: 30%; text-align: center; font-size: 11pt;"><strong><u>[Nama_camat]</u></strong></td>
  <td style="width: 35%;">&nbsp;</td>
</tr>
<tr>
  <td style="width: 35%;">&nbsp;</td>
  <td style="width: 30%; text-align: center; font-size: 10pt; color: #333;">NIP : [Nip_camat]</td>
  <td style="width: 35%;">&nbsp;</td>
</tr>
</tbody>
</table>`;

export const SURAT_PERMOHONAN_DUPLIKAT_AKTA_KELAHIRAN_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; line-height: 1.3; color: #000; width: 100%; box-sizing: border-box; padding: 0 4px;">
  <!-- JUDUL FORMULIR RESMI DISDUKCAPIL -->
  <div style="text-align: center; margin-top: 4px; margin-bottom: 2px;">
    <h3 style="margin: 0; font-size: 10.5pt; font-weight: bold; text-decoration: underline; letter-spacing: 0.5px;">
      FORMULIR PENDAFTARAN RALAT/DUPLIKAT AKTA KELAHIRAN
    </h3>
  </div>

  <div style="text-align: center; font-weight: bold; font-size: 8.5pt; margin-bottom: 8px;">
    YANG MELAPORKAN ( Bapak/Ibu/Ybs/Kuasa )
  </div>

  <!-- DATA YANG MELAPORKAN (PELAPOR / PEMOHON) -->
  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; line-height: 1.35; margin-bottom: 4px;">
    <tbody>
      <tr>
        <td style="width: 160px; padding: 1px 0; vertical-align: top;">N.I.K</td>
        <td style="width: 15px; text-align: center; vertical-align: top;">:</td>
        <td style="font-family: monospace; font-size: 9pt; vertical-align: top;">[Nik]</td>
      </tr>
      <tr>
        <td style="padding: 1px 0; vertical-align: top;">N a m a</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td style="font-weight: bold; text-transform: uppercase; vertical-align: top;">[NAma]</td>
      </tr>
      <tr>
        <td style="padding: 1px 0; vertical-align: top;">Tgl/Bln/Th Lahir</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td style="vertical-align: top;">[Tanggal_lahiR]</td>
      </tr>
      <tr>
        <td style="padding: 1px 0; vertical-align: top;">Alamat</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td style="vertical-align: top;">[Alamat_lengkaP]</td>
      </tr>
      <tr>
        <td style="padding: 1px 0; vertical-align: top;">Pekerjaan</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td style="vertical-align: top;">[Pekerjaan]</td>
      </tr>
      <tr>
        <td style="padding: 1px 0; vertical-align: top;">Hubungan dengan Ybs</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td style="vertical-align: top;">[Form_Hubungan_Dengan_Ybs]</td>
      </tr>
    </tbody>
  </table>

  <!-- KETERANGAN PENGAMBILAN & TANDA TANGAN PELAPOR -->
  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin: 4px 0 6px 0;">
    <tbody>
      <tr>
        <td style="width: 60%; vertical-align: middle; line-height: 1.3; padding-left: 2px;">
          * Yang berhak mengambil Kutipan Akta Kelahiran<br/>
          &nbsp;&nbsp;adalah yang melaporkan pada saat pendaftaran
        </td>
        <td style="width: 40%; text-align: center; vertical-align: top;">
          Tanda Tangan Pelapor,<br/>
          <div style="height: 35px;"></div>
          ( <strong>[NAma]</strong> )
        </td>
      </tr>
    </tbody>
  </table>

  <!-- DATA AKTA KELAHIRAN YANG DIMOHONKAN -->
  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; line-height: 1.35; margin-bottom: 6px;">
    <tbody>
      <tr>
        <td style="width: 160px; padding: 1px 0; vertical-align: top;">N.I.K</td>
        <td style="width: 15px; text-align: center; vertical-align: top;">:</td>
        <td style="font-family: monospace; font-size: 9pt; vertical-align: top;">[Form_Nik_Anak]</td>
      </tr>
      <tr>
        <td style="padding: 1px 0; vertical-align: top;">Akta Atas Nama</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td style="font-weight: bold; text-transform: uppercase; vertical-align: top;">[Form_Nama_Anak]</td>
      </tr>
      <tr>
        <td style="padding: 1px 0; vertical-align: top;">Nomor Akta</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td style="font-weight: bold; vertical-align: top;">[Form_No_Akta_Kelahiran]</td>
      </tr>
      <tr>
        <td colspan="3" style="padding: 1px 0; vertical-align: top;">
          Akta Nikah/Akta Perkawinan Orang Tua Nomor : <strong>[Form_No_Akta_Nikah]</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Tanggal : <strong>[Form_Tgl_Akta_Nikah]</strong>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- YANG AKAN DIPERBAIKI -->
  <div style="text-align: center; font-weight: bold; font-size: 9pt; margin: 6px 0 5px 0; letter-spacing: 0.5px;">
    YANG AKAN DIPERBAIKI
  </div>

  <table style="width: 100%; border-collapse: collapse; font-size: 8pt; line-height: 1.25; margin-bottom: 4px;">
    <tbody>
      <tr>
        <!-- KOLOM KIRI (50%) -->
        <td style="width: 50%; vertical-align: top; padding-right: 8px;">
          <!-- 1. Nama Anak pada Akta -->
          <div style="margin-bottom: 5px;">
            <table style="border-collapse: collapse; margin-bottom: 1px;">
              <tr>
                <td style="width: 22px; vertical-align: middle;">
                  <div style="width: 17px; height: 13px; border: 1.5px solid #000; text-align: center; line-height: 12px; font-weight: bold; font-size: 8.5pt;">[Centang_Nama_Anak]</div>
                </td>
                <td style="vertical-align: middle; font-weight: bold; font-size: 8.5pt; padding-left: 4px;">
                  Nama Anak pada Akta
                </td>
              </tr>
            </table>
            <div style="padding-left: 22px; font-size: 8pt; color: #222;">
              Tertulis ( [Form_Ralat_Nama_Anak_Lama] )<br/>
              yang benar ( [Form_Ralat_Nama_Anak_Baru] )
            </div>
          </div>

          <!-- 2. Nama Ayah / Bapak -->
          <div style="margin-bottom: 5px;">
            <table style="border-collapse: collapse; margin-bottom: 1px;">
              <tr>
                <td style="width: 22px; vertical-align: middle;">
                  <div style="width: 17px; height: 13px; border: 1.5px solid #000; text-align: center; line-height: 12px; font-weight: bold; font-size: 8.5pt;">[Centang_Nama_Ayah]</div>
                </td>
                <td style="vertical-align: middle; font-weight: bold; font-size: 8.5pt; padding-left: 4px;">
                  Nama Ayah / Bapak
                </td>
              </tr>
            </table>
            <div style="padding-left: 22px; font-size: 8pt; color: #222;">
              Tertulis ( [Form_Ralat_Nama_Ayah_Lama] )<br/>
              yang benar ( [Form_Ralat_Nama_Ayah_Baru] )
            </div>
          </div>

          <!-- 3. Nama Ibu -->
          <div style="margin-bottom: 5px;">
            <table style="border-collapse: collapse; margin-bottom: 1px;">
              <tr>
                <td style="width: 22px; vertical-align: middle;">
                  <div style="width: 17px; height: 13px; border: 1.5px solid #000; text-align: center; line-height: 12px; font-weight: bold; font-size: 8.5pt;">[Centang_Nama_Ibu]</div>
                </td>
                <td style="vertical-align: middle; font-weight: bold; font-size: 8.5pt; padding-left: 4px;">
                  Nama Ibu
                </td>
              </tr>
            </table>
            <div style="padding-left: 22px; font-size: 8pt; color: #222;">
              Tertulis ( [Form_Ralat_Nama_Ibu_Lama] )<br/>
              yang benar ( [Form_Ralat_Nama_Ibu_Baru] )
            </div>
          </div>

          <!-- 4. Jenis Kelamin -->
          <div style="margin-bottom: 5px;">
            <table style="border-collapse: collapse; margin-bottom: 1px;">
              <tr>
                <td style="width: 22px; vertical-align: middle;">
                  <div style="width: 17px; height: 13px; border: 1.5px solid #000; text-align: center; line-height: 12px; font-weight: bold; font-size: 8.5pt;">[Centang_Sex]</div>
                </td>
                <td style="vertical-align: middle; font-weight: bold; font-size: 8.5pt; padding-left: 4px;">
                  Jenis Kelamin
                </td>
              </tr>
            </table>
            <div style="padding-left: 22px; font-size: 8pt; color: #222;">
              Tertulis ( [Form_Ralat_Sex_Lama] )<br/>
              yang benar ( [Form_Ralat_Sex_Baru] )
            </div>
          </div>
        </td>

        <!-- KOLOM KANAN (50%) -->
        <td style="width: 50%; vertical-align: top; padding-left: 8px;">
          <!-- 5. Tempat Lahir -->
          <div style="margin-bottom: 5px;">
            <table style="border-collapse: collapse; margin-bottom: 1px;">
              <tr>
                <td style="width: 22px; vertical-align: middle;">
                  <div style="width: 17px; height: 13px; border: 1.5px solid #000; text-align: center; line-height: 12px; font-weight: bold; font-size: 8.5pt;">[Centang_Tempat_Lahir]</div>
                </td>
                <td style="vertical-align: middle; font-weight: bold; font-size: 8.5pt; padding-left: 4px;">
                  Tempat Lahir
                </td>
              </tr>
            </table>
            <div style="padding-left: 22px; font-size: 8pt; color: #222;">
              Tertulis ( [Form_Ralat_Tempat_Lahir_Lama] )<br/>
              yang benar ( [Form_Ralat_Tempat_Lahir_Baru] )
            </div>
          </div>

          <!-- 6. Tanggal Lahir -->
          <div style="margin-bottom: 5px;">
            <table style="border-collapse: collapse; margin-bottom: 1px;">
              <tr>
                <td style="width: 22px; vertical-align: middle;">
                  <div style="width: 17px; height: 13px; border: 1.5px solid #000; text-align: center; line-height: 12px; font-weight: bold; font-size: 8.5pt;">[Centang_Tanggal_Lahir]</div>
                </td>
                <td style="vertical-align: middle; font-weight: bold; font-size: 8.5pt; padding-left: 4px;">
                  Tanggal Lahir
                </td>
              </tr>
            </table>
            <div style="padding-left: 22px; font-size: 8pt; color: #222;">
              Tertulis ( [Form_Ralat_Tanggal_Lahir_Lama] )<br/>
              yang benar ( [Form_Ralat_Tanggal_Lahir_Baru] )
            </div>
          </div>

          <!-- 7. Anak ke -->
          <div style="margin-bottom: 5px;">
            <table style="border-collapse: collapse; margin-bottom: 1px;">
              <tr>
                <td style="width: 22px; vertical-align: middle;">
                  <div style="width: 17px; height: 13px; border: 1.5px solid #000; text-align: center; line-height: 12px; font-weight: bold; font-size: 8.5pt;">[Centang_Anak_Ke]</div>
                </td>
                <td style="vertical-align: middle; font-weight: bold; font-size: 8.5pt; padding-left: 4px;">
                  Anak ke
                </td>
              </tr>
            </table>
            <div style="padding-left: 22px; font-size: 8pt; color: #222;">
              Tertulis ( [Form_Ralat_Anak_Ke_Lama] )<br/>
              yang benar ( [Form_Ralat_Anak_Ke_Baru] )
            </div>
          </div>

          <!-- 8. Akta Rusak / Hilang (Duplikat) -->
          <div style="margin-bottom: 5px;">
            <table style="border-collapse: collapse; margin-bottom: 1px;">
              <tr>
                <td style="width: 22px; vertical-align: middle;">
                  <div style="width: 17px; height: 13px; border: 1.5px solid #000; text-align: center; line-height: 12px; font-weight: bold; font-size: 8.5pt;">[Centang_Rusak_Hilang]</div>
                </td>
                <td style="vertical-align: middle; font-weight: bold; font-size: 8.5pt; padding-left: 4px;">
                  Akta Rusak/Hilang
                </td>
              </tr>
            </table>
            <div style="padding-left: 22px; font-size: 8pt; color: #222;">
              Tertulis ( [Form_Ralat_Rusak_Hilang_Lama] )<br/>
              yang benar ( [Form_Ralat_Rusak_Hilang_Baru] )
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>

  <p style="font-size: 7.5pt; margin: 3px 0 6px 0; font-style: italic;">
    ** beri tanda ( √ ) dalam kotak pada bagaian yang akan diperbaiki dalam akta kelahiran
  </p>

  <!-- PERSYARATAN -->
  <div style="font-size: 7.5pt; line-height: 1.25; border-top: 1px dashed #777; padding-top: 4px;">
    <strong style="text-decoration: underline; font-size: 8pt;">Persyaratan:</strong>
    <ol style="margin: 2px 0 0 16px; padding: 0;">
      <li>Foto Copy Kartu Keluarga ( KK )</li>
      <li>Foto Copy Kartu Tanda Penduduk ( KTP ) Ybs/Ortu</li>
      <li>Foto Copy Kartu Tanda Penduduk ( KTP ) Pelapor</li>
      <li>Foto Copy Surat Nikah / Akta Perkawinan Orang Tua dilegalisir ( untuk meralat nama Orang Tua )</li>
      <li>Melampirkan Akta Kelahiran Asli yang akan di ralat/duplikat</li>
      <li>Surat Kehilangan Kepolisian untuk Akta yang hilang ( minimal memiliki FC Akta Kelahiran yang hilang )</li>
      <li>Foto Copy KTP saksi 2 ( dua ) orang</li>
    </ol>
  </div>
</div>`;

export const SURAT_KETERANGAN_LAHIR_MATI_TEMPLATE = `<h4 style="margin: 0; text-align: center; font-weight: bold;"><span style="text-decoration: underline;"><strong>SURAT KETERANGAN LAHIR MATI</strong></span></h4>
<p style="margin: 2px 0 16px 0; text-align: center; font-size: 11pt;">Nomor : [Format_nomor_suraT]</p>
<p style="text-align: justify; text-indent: 36px; margin: 0 0 10px 0; line-height: 1.5;">Yang bertanda tangan di bawah ini [JaBatan] [NaMa_desa], Kecamatan [NaMa_kecamatan], [SeButan_kabupaten] [NaMa_kabupaten], Provinsi [NaMa_provinsi] menerangkan dengan sebenarnya bahwa :</p>
<table style="border-collapse: collapse; width: 100%; margin-left: 20px; margin-bottom: 10px; line-height: 1.45;" border="0">
<tbody>
<tr>
  <td style="width: 4%; vertical-align: top; padding: 2px 0;">1.</td>
  <td style="width: 32%; vertical-align: top; padding: 2px 0;">Nama Lengkap Ibu</td>
  <td style="width: 2%; text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="width: 62%; vertical-align: top; padding: 2px 0;"><strong>[form_nama_ibu]</strong></td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">2.</td>
  <td style="vertical-align: top; padding: 2px 0;">NIK Ibu</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[form_nik_ibu]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">3.</td>
  <td style="vertical-align: top; padding: 2px 0;">Nama Lengkap Ayah</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;"><strong>[form_nama_ayah]</strong></td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">4.</td>
  <td style="vertical-align: top; padding: 2px 0;">NIK Ayah</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[form_nik_ayah]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">5.</td>
  <td style="vertical-align: top; padding: 2px 0;">Alamat Orang Tua</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[Alamat_lengkaP]</td>
</tr>
</tbody>
</table>
<p style="text-align: justify; text-indent: 36px; margin: 10px 0 8px 0; line-height: 1.5;">Telah melahirkan seorang bayi dalam keadaan <strong>MENINGGAL DUNIA (LAHIR MATI)</strong> pada :</p>
<table style="border-collapse: collapse; width: 100%; margin-left: 20px; margin-bottom: 12px; line-height: 1.45;" border="0">
<tbody>
<tr>
  <td style="width: 4%; vertical-align: top; padding: 2px 0;">a.</td>
  <td style="width: 32%; vertical-align: top; padding: 2px 0;">Hari / Tanggal Lahir Mati</td>
  <td style="width: 2%; text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="width: 62%; vertical-align: top; padding: 2px 0;">[form_hari_tanggal_lahir_mati]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">b.</td>
  <td style="vertical-align: top; padding: 2px 0;">Pukul / Jam</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[form_jam_lahir_mati]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">c.</td>
  <td style="vertical-align: top; padding: 2px 0;">Jenis Kelamin Bayi</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[form_sex_bayi]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">d.</td>
  <td style="vertical-align: top; padding: 2px 0;">Lamanya dalam Kandungan</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[form_lama_kandungan] Bulan</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">e.</td>
  <td style="vertical-align: top; padding: 2px 0;">Anak Lahir yang ke-</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[form_kelahiran_ke]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">f.</td>
  <td style="vertical-align: top; padding: 2px 0;">Tempat Dilahirkan</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[form_tempat_dilahirkan] ([form_nama_tempat_dilahirkan])</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">g.</td>
  <td style="vertical-align: top; padding: 2px 0;">Penolong Kelahiran</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[form_penolong_kelahiran] ([form_nama_penolong])</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">h.</td>
  <td style="vertical-align: top; padding: 2px 0;">Sebab Lahir Mati</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[form_sebab_lahir_mati]</td>
</tr>
<tr>
  <td style="vertical-align: top; padding: 2px 0;">i.</td>
  <td style="vertical-align: top; padding: 2px 0;">Yang Menentukan</td>
  <td style="text-align: center; vertical-align: top; padding: 2px 0;">:</td>
  <td style="vertical-align: top; padding: 2px 0;">[form_yang_menentukan]</td>
</tr>
</tbody>
</table>
<p style="text-align: justify; text-indent: 36px; margin: 8px 0; line-height: 1.5;">Surat keterangan ini diterbitkan berdasarkan pelaporan dari <strong>[form_nama_pelapor]</strong> (NIK: [form_nik_pelapor]) dan dipergunakan sebagai lampiran persyaratan pelaporan pencatatan sipil Lahir Mati (Formulir F-2.09).</p>
<p style="text-align: justify; text-indent: 36px; margin: 8px 0 20px 0; line-height: 1.5;">Demikian surat keterangan ini dibuat dengan sebenarnya, untuk dipergunakan sebagaimana mestinya.</p>
<table style="border-collapse: collapse; width: 100%; margin-top: 16px;" border="0">
<tbody>
<tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center; font-size: 11pt;">[NaMa_desa], [TgL_surat]</td>
</tr>
<tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center; font-size: 11pt;">[Atas_namA]</td>
</tr>
<tr style="height: 52px;">
  <td style="width: 50%; text-align: center; height: 52px;">&nbsp;</td>
  <td style="width: 50%; text-align: center; height: 52px; vertical-align: middle;">[qr_bsre]</td>
</tr>
<tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center; font-size: 11pt;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_pamonG]</u></strong></td>
</tr>
<tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center; font-size: 10pt; color: #333;">[SEbutan_nip_desa] : [nip_pamong]</td>
</tr>
</tbody>
</table>`;

export const SURAT_PERNYATAAN_BEDA_NAMA_TEMPLATE = `<div style="font-family: 'Times New Roman', Times, serif; font-size: 11.5pt; line-height: 1.45; color: #000; width: 100%; box-sizing: border-box; padding: 4px 10px 0 10px;">
  <div style="text-align: center; margin-top: 4px; margin-bottom: 18px;">
    <h3 style="margin: 0; font-size: 13pt; font-weight: bold; text-decoration: underline; letter-spacing: 0.5px;">
      SURAT PERNYATAAN BEDA NAMA
    </h3>
    <p style="margin: 2px 0 0 0; text-align: center; font-size: 11pt;">Nomor : [Format_nomor_suraT]</p>
  </div>

  <p style="margin: 0 0 12px 0; font-size: 11.5pt; line-height: 1.45;">
    Yang bertanda tangan dibawah ini :
  </p>

  <table style="width: 100%; border-collapse: collapse; font-size: 11.5pt; line-height: 1.55; margin-bottom: 16px;">
    <tbody>
      <tr>
        <td style="width: 190px; padding: 2px 0; vertical-align: top;">Nama</td>
        <td style="width: 25px; text-align: center; vertical-align: top;">:</td>
        <td style="vertical-align: top; font-weight: bold; text-transform: uppercase;">[NAma]</td>
      </tr>
      <tr>
        <td style="padding: 2px 0; vertical-align: top;">NIK</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td style="vertical-align: top; font-family: monospace; font-size: 11.5pt;">[Nik]</td>
      </tr>
      <tr>
        <td style="padding: 2px 0; vertical-align: top;">Tempat/Tgl lahir</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td style="vertical-align: top;">[TtL]</td>
      </tr>
      <tr>
        <td style="padding: 2px 0; vertical-align: top;">Jenis Kelamin</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td style="vertical-align: top;">[Jenis_kelamin]</td>
      </tr>
      <tr>
        <td style="padding: 2px 0; vertical-align: top;">Alamat</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td style="vertical-align: top;">[Alamat_lengkaP]</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 0 0 12px 0; font-size: 11.5pt; line-height: 1.45;">
    Dengan ini menerangkan dengan sebenarnya bahwa nama yang tercantum dalam :
  </p>

  <table style="width: 100%; border-collapse: collapse; font-size: 11.5pt; line-height: 1.55; margin-bottom: 18px;">
    <tbody>
      <tr>
        <td style="width: 220px; padding: 2px 0; vertical-align: top;">[Form_nama_dokumen_1]</td>
        <td style="width: 25px; text-align: center; vertical-align: top;">:</td>
        <td style="vertical-align: top; font-weight: bold; text-transform: uppercase;">[Form_nama_di_dokumen_1]</td>
      </tr>
      <tr>
        <td style="padding: 2px 0; vertical-align: top;">[Form_nama_kartu_identitas]</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td style="vertical-align: top; font-weight: bold; text-transform: uppercase;">[Form_nama_di_dokumen_2]</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: justify; font-size: 11.5pt; line-height: 1.55; margin: 0 0 12px 0;">
    Adalah orang yang sama atau bukan orang lain meskipun terjadi perbedaan antara yang tercatat di dalam [Form_nama_dokumen_1_lengkap] dengan [Form_nama_kartu_identitas]. Jika dikemudian hari surat keterangan ini ditemukan pelanggaran hukum, maka saya siap mempertanggung jawabkannya.
  </p>

  <p style="text-align: justify; font-size: 11.5pt; line-height: 1.55; margin: 0 0 30px 0;">
    Demikian surat pernyataan ini saya buat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
  </p>

  <table style="width: 100%; border-collapse: collapse; font-size: 11.5pt; line-height: 1.45;">
    <tbody>
      <tr>
        <td style="width: 50%;"></td>
        <td style="width: 50%; text-align: center;">
          [NaMa_desa], [TgL_surat]<br>
          Yang membuat pernyataan,
          <div style="height: 70px;">&nbsp;</div>
          <strong style="text-transform: uppercase;">[NAma]</strong>
        </td>
      </tr>
    </tbody>
  </table>
</div>`;

export const SURAT_KETERANGAN_MOYANG_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45;">
<p style="text-align: center; margin-bottom: 4px;"><strong><span style="font-size: 14pt; text-decoration: underline;">SURAT KETERANGAN MOYANG</span></strong></p>
<p style="text-align: center; margin-top: 0; margin-bottom: 18px;">Nomor : [Format_nomor_suraT]</p>
<p style="text-align: justify; text-indent: 36px;">Yang bertanda tangan di bawah ini [Jabatan] [Nama_desA], Kecamatan [Nama_kecamataN], Kabupaten [Nama_kabupateN], Provinsi [Nama_provinsI] menerangkan dengan sebenarnya bahwa :</p>
<table style="border-collapse: collapse; width: 100%; margin-left: 24px; margin-bottom: 12px;" border="0">
<tbody>
<tr><td style="width: 32%;">1. Nama Lengkap</td><td style="width: 2%;">:</td><td style="width: 66%;"><strong>[Nama]</strong></td></tr>
<tr><td>2. NIK / No. KTP</td><td>:</td><td>[Nik]</td></tr>
<tr><td>3. Nomor KK</td><td>:</td><td>[No_kK]</td></tr>
<tr><td>4. Tempat / Tanggal Lahir</td><td>:</td><td>[Tempat_tanggal_lahiR]</td></tr>
<tr><td>5. Jenis Kelamin</td><td>:</td><td>[Jenis_kelamiN]</td></tr>
<tr><td>6. Kewarganegaraan</td><td>:</td><td>[Warga_negarA]</td></tr>
<tr><td>7. Agama</td><td>:</td><td>[Agama]</td></tr>
<tr><td>8. Status Perkawinan</td><td>:</td><td>[Status_kawin]</td></tr>
<tr><td>9. Pekerjaan</td><td>:</td><td>[Pekerjaan]</td></tr>
<tr><td>10. Alamat Tempat Tinggal</td><td>:</td><td>[Alamat]</td></tr>
</tbody>
</table>
<p style="text-align: justify; text-indent: 36px; margin-bottom: 8px;">[Form_keterangan_status_moyang]</p>
<p style="text-align: justify; text-indent: 36px; margin-bottom: 12px;">[Form_keterangan_tambahan]</p>
<p style="text-align: justify; text-indent: 36px; margin-bottom: 24px;">Demikian surat keterangan ini dibuat dengan sebenar-benarnya dalam keadaan sadar dan untuk dipergunakan sebagaimana mestinya ([Form_keperluan]).</p>
<table style="border-collapse: collapse; width: 100%; margin-top: 24px;" border="0">
<tbody>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Nama_desA], [Tanggal_suraT]</td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Atas_namA]</td>
</tr>
<tr style="height: 52px;">
<td style="width: 50%; text-align: center; height: 52px;">&nbsp;</td>
<td style="width: 50%; text-align: center; height: 52px; vertical-align: middle;">[qr_bsre]</td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;"><strong><u>[Nama_pamonG]</u></strong></td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Sebutan_nip_desA] : [Nip_pamoNG]</td>
</tr>
</tbody>
</table>
</div>`;


export const SURAT_KETERANGAN_WALI_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45;">
<p style="text-align: center; margin-bottom: 4px;"><strong><span style="font-size: 14pt; text-decoration: underline;">SURAT KETERANGAN WALI</span></strong></p>
<p style="text-align: center; margin-top: 0; margin-bottom: 18px;">Nomor : [Format_nomor_suraT]</p>

<p style="text-align: justify; text-indent: 36px; margin-bottom: 10px;">Yang bertandatangan di bawah ini Kepala Desa [Nama_desA] Kecamatan [Nama_kecamataN] [Sebutan_kabupaten] [Nama_kabupateN] menerangkan bahwa :</p>

<table style="border-collapse: collapse; width: 100%; margin-left: 20px; margin-bottom: 12px;" border="0">
<tbody>
<tr><td style="width: 32%; padding: 2px 0;">Nama Kepala Keluarga</td><td style="width: 2%;">:</td><td style="width: 66%; font-weight: bold; text-transform: uppercase;">[Nama_wali]</td></tr>
<tr><td style="padding: 2px 0;">Tempat Tanggal Lahir</td><td>:</td><td>[Ttl_wali]</td></tr>
<tr><td style="padding: 2px 0;">NIK</td><td>:</td><td>[Nik_wali]</td></tr>
<tr><td style="padding: 2px 0;">Jenis Kelamin</td><td>:</td><td>[Jenis_kelamin_wali]</td></tr>
<tr><td style="padding: 2px 0;">Agama</td><td>:</td><td>[Agama_wali]</td></tr>
<tr><td style="padding: 2px 0;">Pekerjaan Utama</td><td>:</td><td>[Pekerjaan_wali]</td></tr>
<tr><td style="padding: 2px 0; vertical-align: top;">Alamat</td><td style="vertical-align: top;">:</td><td>[Alamat_wali]</td></tr>
</tbody>
</table>

<p style="text-align: justify; text-indent: 36px; margin-top: 10px; margin-bottom: 10px;">Berdasarkan data dan keterangan dari Ketua RT dan RW di wilayah tempat tinggalnya, serta sepengetahuan kami bahwa yang orang tersebut di atas adalah <strong>WALI</strong> dari :</p>

<table style="border-collapse: collapse; width: 100%; margin-left: 20px; margin-bottom: 14px;" border="0">
<tbody>
<tr><td style="width: 32%; padding: 2px 0;">Nama Siswa/Anak</td><td style="width: 2%;">:</td><td style="width: 66%; font-weight: bold; text-transform: uppercase;">[Nama_anak]</td></tr>
<tr><td style="padding: 2px 0;">Tempat Tanggal Lahir</td><td>:</td><td>[Ttl_anak]</td></tr>
<tr><td style="padding: 2px 0;">No. KK</td><td>:</td><td>[No_kk_anak]</td></tr>
<tr><td style="padding: 2px 0;">NIK</td><td>:</td><td>[Nik_anak]</td></tr>
<tr><td style="padding: 2px 0;">Nama Ayah Kandung</td><td>:</td><td style="text-transform: uppercase;">[Nama_ayah_kandung]</td></tr>
<tr><td style="padding: 2px 0;">Nama Ibu Kandung</td><td>:</td><td style="text-transform: uppercase;">[Nama_ibu_kandung]</td></tr>
<tr><td style="padding: 2px 0;">Jenis Kelamin</td><td>:</td><td>[Jenis_kelamin_anak]</td></tr>
<tr><td style="padding: 2px 0;">Agama</td><td>:</td><td>[Agama_anak]</td></tr>
<tr><td style="padding: 2px 0;">Pekerjaan Utama</td><td>:</td><td>[Pekerjaan_anak]</td></tr>
<tr><td style="padding: 2px 0;">Nama Sekolah</td><td>:</td><td>[Nama_sekolah]</td></tr>
<tr><td style="padding: 2px 0;">Kelas</td><td>:</td><td>[Kelas_anak]</td></tr>
<tr><td style="padding: 2px 0; vertical-align: top;">Alamat</td><td style="vertical-align: top;">:</td><td>[Alamat_anak]</td></tr>
</tbody>
</table>

<p style="text-align: justify; text-indent: 36px; margin-bottom: 24px;">Demikian Surat Keterangan ini kami buat dengan sebenarnya dan akan di pergunakan untuk : <strong>[Form_keperluan]</strong>. Mohon kepada yang berkepentingan mengetahui dan menjadi maklum, Terima Kasih.</p>

<table style="border-collapse: collapse; width: 100%; margin-top: 20px;" border="0">
<tbody>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Nama_desA], [Tanggal_suraT]</td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Atas_namA]</td>
</tr>
<tr style="height: 52px;">
<td style="width: 50%; text-align: center; height: 52px;">&nbsp;</td>
<td style="width: 50%; text-align: center; height: 52px; vertical-align: middle;">[qr_bsre]</td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;"><strong><u>[Nama_pamonG]</u></strong></td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Sebutan_nip_desA] : [Nip_pamoNG]</td>
</tr>
</tbody>
</table>
</div>`;


export const SURAT_KETERANGAN_BELUM_MENIKAH_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.4; color: #000;">
<p style="text-align: center; margin-bottom: 2px;"><strong><span style="font-size: 12pt; text-decoration: underline;">SURAT KETERANGAN BELUM MENIKAH</span></strong></p>
<p style="text-align: center; margin-top: 0; margin-bottom: 12px;">Nomor : [Format_nomor_suraT]</p>

<p style="text-align: justify; text-indent: 28px; margin-bottom: 8px;">Yang bertanda tangan di bawah ini Kepala Desa [Nama_desA], Kecamatan [Nama_kecamataN], [Sebutan_kabupateN] [Nama_kabupateN], menerangkan dengan sesungguhnya bahwa :</p>

<table style="border-collapse: collapse; width: 100%; margin-left: 12px; margin-bottom: 10px;" border="0">
<tbody>
<tr><td style="width: 34%; padding: 1.5px 0;">1. Nama Lengkap</td><td style="width: 2%;">:</td><td style="width: 64%; font-weight: bold;">[NAma]</td></tr>
<tr><td style="padding: 1.5px 0;">2. Nomor Induk Kependudukan (NIK)</td><td>:</td><td>[Nik]</td></tr>
<tr><td style="padding: 1.5px 0;">3. Jenis Kelamin</td><td>:</td><td>[Jenis_kelamiN]</td></tr>
<tr><td style="padding: 1.5px 0;">4. Tempat dan Tanggal Lahir</td><td>:</td><td>[Tempat_tanggal_lahiR]</td></tr>
<tr><td style="padding: 1.5px 0;">5. Kewarganegaraan</td><td>:</td><td>[Warga_negarA]</td></tr>
<tr><td style="padding: 1.5px 0;">6. Agama</td><td>:</td><td>[Agama]</td></tr>
<tr><td style="padding: 1.5px 0;">7. Pekerjaan &amp; Pendidikan Terakhir</td><td>:</td><td>[Pekerjaan] - [Pendidikan_kK]</td></tr>
<tr><td style="padding: 1.5px 0; vertical-align: top;">8. Alamat Tempat Tinggal</td><td style="vertical-align: top;">:</td><td>[Alamat]</td></tr>
<tr><td style="padding: 1.5px 0;">9. Status Perkawinan</td><td>:</td><td><strong>[Form_status_perkawinan]</strong></td></tr>
</tbody>
</table>

<p style="text-align: justify; text-indent: 28px; margin-bottom: 8px;">Berdasarkan data administrasi kependudukan dan catatan registrasi yang ada pada Kantor Desa [Nama_desA], serta sepengetahuan kami, orang tersebut di atas benar-benar penduduk Desa [Nama_desA] yang berstatus <strong>[Form_status_perkawinan]</strong> dan hingga saat surat keterangan ini dibuat belum pernah melangsungkan pernikahan/perkawinan baik secara hukum agama, adat, maupun hukum negara.</p>

<p style="text-align: justify; text-indent: 28px; margin-bottom: 12px;">Surat keterangan ini diberikan kepada yang bersangkutan untuk keperluan: <strong>[Form_keperluan]</strong>.</p>

<p style="text-align: justify; text-indent: 28px; margin-bottom: 14px;">Demikian surat keterangan ini dibuat dengan sebenarnya dan penuh rasa tanggung jawab agar dapat dipergunakan sebagaimana mestinya.</p>

<table style="border-collapse: collapse; width: 100%; margin-top: 10px;" border="0">
<tbody>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Nama_desA], [Tanggal_suraT]</td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Atas_namA]</td>
</tr>
<tr style="height: 52px;">
<td style="width: 50%; text-align: center; height: 52px;">&nbsp;</td>
<td style="width: 50%; text-align: center; height: 52px; vertical-align: middle;">[qr_bsre]</td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;"><strong><u>[Nama_pamonG]</u></strong></td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Sebutan_nip_desA] : [Nip_pamoNG]</td>
</tr>
</tbody>
</table>
</div>`;


export const SURAT_KETERANGAN_WALI_HAKIM_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45; color: #000;">
<p style="text-align: center; margin-bottom: 2px;"><strong><span style="font-size: 13pt; text-decoration: underline;">SURAT KETERANGAN WALI HAKIM</span></strong></p>
<p style="text-align: center; margin-top: 0; margin-bottom: 18px;">Nomor : [Format_nomor_suraT]</p>

<p style="text-align: justify; text-indent: 32px; margin-bottom: 12px;">Yang bertanda tangan di bawah ini kami Kepala Desa [Nama_desA] Kecamatan [Nama_kecamataN] [Sebutan_kabupateN] [Nama_kabupateN] menerangkan bahwa :</p>

<table style="border-collapse: collapse; width: 100%; margin-left: 20px; margin-bottom: 14px;" border="0">
<tbody>
<tr><td style="width: 25%; padding: 2px 0;">Nama</td><td style="width: 2%;">:</td><td style="width: 73%; font-weight: bold;">[Form_nama_calon_istri]</td></tr>
<tr><td style="padding: 2px 0;">Tempat Tgl.Lahir</td><td>:</td><td>[Form_ttl_calon_istri]</td></tr>
<tr><td style="padding: 2px 0;">Agama</td><td>:</td><td>[Form_agama_calon_istri]</td></tr>
<tr><td style="padding: 2px 0; vertical-align: top;">Alamat</td><td style="vertical-align: top;">:</td><td>[Form_alamat_calon_istri]</td></tr>
</tbody>
</table>

<p style="text-align: justify; text-indent: 32px; margin-bottom: 12px;">Orang tersebut diatas adalah Calon Mempelai Wanita yang akan melangsungkan pertikahan dengan seorang laki-laki :</p>

<table style="border-collapse: collapse; width: 100%; margin-left: 20px; margin-bottom: 14px;" border="0">
<tbody>
<tr><td style="width: 25%; padding: 2px 0;">Nama</td><td style="width: 2%;">:</td><td style="width: 73%; font-weight: bold;">[Form_nama_calon_suami]</td></tr>
<tr><td style="padding: 2px 0;">Tempat Tgl.lahir</td><td>:</td><td>[Form_ttl_calon_suami]</td></tr>
<tr><td style="padding: 2px 0;">Agama</td><td>:</td><td>[Form_agama_calon_suami]</td></tr>
<tr><td style="padding: 2px 0; vertical-align: top;">Alamat</td><td style="vertical-align: top;">:</td><td>[Form_alamat_calon_suami]</td></tr>
</tbody>
</table>

<p style="text-align: justify; text-indent: 32px; margin-bottom: 12px;">Dengan ini menerangkan bahwa [Form_keterangan_wali_hakim].</p>

<p style="text-align: justify; text-indent: 32px; margin-bottom: 20px;">Demikian surat keterangan ini dibuat agar kepada pihak yang berpentingan mengetahui.</p>

<table style="border-collapse: collapse; width: 100%; margin-top: 14px;" border="0">
<tbody>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Nama_desA], [Tanggal_suraT]</td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Atas_namA]</td>
</tr>
<tr style="height: 52px;">
<td style="width: 50%; text-align: center; height: 52px;">&nbsp;</td>
<td style="width: 50%; text-align: center; height: 52px; vertical-align: middle;">[qr_bsre]</td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;"><strong><u>[Nama_pamonG]</u></strong></td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Sebutan_nip_desA] : [Nip_pamoNG]</td>
</tr>
</tbody>
</table>
</div>`;

export const SURAT_KETERANGAN_NIKAH_NON_MUSLIM_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.35; color: #000;">
  <p style="text-align: center; margin-bottom: 2px;"><strong><span style="font-size: 12pt; text-decoration: underline;">SURAT KETERANGAN UNTUK NIKAH (WARGA NON MUSLIM)</span></strong></p>
  <p style="text-align: center; margin-top: 0; margin-bottom: 12px;">Nomor : [Format_nomor_suraT]</p>

  <p style="text-align: justify; text-indent: 28px; margin-bottom: 6px;">Yang bertanda tangan di bawah ini [JaBatan] [NaMa_desa], Kecamatan [NaMa_kecamatan], [SeButan_kabupaten] [NaMa_kabupaten], Provinsi [NaMa_provinsi] menerangkan dengan sebenarnya bahwa :</p>

  <p style="margin: 4px 0 2px 0; font-weight: bold;">I. Calon Mempelai Pria (Suami):</p>
  <table style="border-collapse: collapse; width: 100%; margin-left: 12px; margin-bottom: 6px;" border="0">
  <tbody>
  <tr><td style="width: 28%; padding: 1px 0;">1. Nama Lengkap</td><td style="width: 2%;">:</td><td style="width: 70%; font-weight: bold;">[NAma]</td></tr>
  <tr><td style="padding: 1px 0;">2. Tempat / Tanggal Lahir</td><td>:</td><td>[TtL]</td></tr>
  <tr><td style="padding: 1px 0;">3. Jenis Kelamin</td><td>:</td><td>[Jenis_kelamiN]</td></tr>
  <tr><td style="padding: 1px 0;">4. NIK / No. KTP</td><td>:</td><td>[NiK]</td></tr>
  <tr><td style="padding: 1px 0;">5. Nomor Kartu Keluarga</td><td>:</td><td>[No_kK]</td></tr>
  <tr><td style="padding: 1px 0;">6. Warga Negara</td><td>:</td><td>[Warga_negarA]</td></tr>
  <tr><td style="padding: 1px 0;">7. Agama</td><td>:</td><td>[AgamA]</td></tr>
  <tr><td style="padding: 1px 0;">8. Pekerjaan</td><td>:</td><td>[PekerjaaN]</td></tr>
  <tr><td style="padding: 1px 0; vertical-align: top;">9. Alamat Tempat Tinggal</td><td style="vertical-align: top;">:</td><td>[Alamat_lengkaP]</td></tr>
  </tbody>
  </table>

  <p style="text-align: justify; margin-bottom: 4px;">Nama tersebut di atas betul telah menikah dengan seorang perempuan yang bernama :</p>

  <p style="margin: 4px 0 2px 0; font-weight: bold;">II. Calon Mempelai Wanita (Istri):</p>
  <table style="border-collapse: collapse; width: 100%; margin-left: 12px; margin-bottom: 6px;" border="0">
  <tbody>
  <tr><td style="width: 28%; padding: 1px 0;">1. Nama Lengkap</td><td style="width: 2%;">:</td><td style="width: 70%; font-weight: bold;">[Nama_cpW]</td></tr>
  <tr><td style="padding: 1px 0;">2. Tempat / Tanggal Lahir</td><td>:</td><td>[Ttl_cpW]</td></tr>
  <tr><td style="padding: 1px 0;">3. Jenis Kelamin</td><td>:</td><td>[Jenis_kelamin_cpW]</td></tr>
  <tr><td style="padding: 1px 0;">4. NIK / No. KTP</td><td>:</td><td>[Nik_cpW]</td></tr>
  <tr><td style="padding: 1px 0;">5. Nomor Kartu Keluarga</td><td>:</td><td>[No_kk_cpW]</td></tr>
  <tr><td style="padding: 1px 0;">6. Warga Negara</td><td>:</td><td>[Warga_negara_cpW]</td></tr>
  <tr><td style="padding: 1px 0;">7. Agama</td><td>:</td><td>[Agama_cpW]</td></tr>
  <tr><td style="padding: 1px 0;">8. Pekerjaan</td><td>:</td><td>[Pekerjaan_cpW]</td></tr>
  <tr><td style="padding: 1px 0; vertical-align: top;">9. Alamat Tempat Tinggal</td><td style="vertical-align: top;">:</td><td>[Alamat_cpW]</td></tr>
  </tbody>
  </table>

  <p style="margin: 4px 0 2px 0; font-weight: bold;">III. Pelaksanaan Perkawinan:</p>
  <table style="border-collapse: collapse; width: 100%; margin-left: 12px; margin-bottom: 6px;" border="0">
  <tbody>
  <tr><td style="width: 28%; padding: 1px 0;">1. Tempat / Nama Gereja / Ibadah</td><td style="width: 2%;">:</td><td style="width: 70%;">[Form_nama_badan_peradilan_kawiN]</td></tr>
  <tr><td style="padding: 1px 0;">2. Tanggal Pemberkatan</td><td>:</td><td>[Form_tanggal_putusan_penetapan_pengadilan_kawiN]</td></tr>
  <tr><td style="padding: 1px 0;">3. Pemuka Agama / Pendeta</td><td>:</td><td>[Form_nama_pemuka_agama]</td></tr>
  </tbody>
  </table>

  <p style="text-align: justify; text-indent: 28px; margin-top: 8px; margin-bottom: 12px;">Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan dalam proses pencatatan perkawinan pada Dinas Kependudukan dan Pencatatan Sipil.</p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 10px;" border="0">
  <tbody>
  <tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center;">[Nama_desA], [Tanggal_suraT]</td>
  </tr>
  <tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center;">[Atas_namA]</td>
  </tr>
  <tr style="height: 52px;">
  <td style="width: 50%; text-align: center; height: 52px;">&nbsp;</td>
  <td style="width: 50%; text-align: center; height: 52px; vertical-align: middle;">[qr_bsre]</td>
  </tr>
  <tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center;"><strong><u>[Nama_pamonG]</u></strong></td>
  </tr>
  <tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center;">[Sebutan_nip_desA] : [Nip_pamoNG]</td>
  </tr>
  </tbody>
  </table>
</div>`;

export const SURAT_PERMOHONAN_DUPLIKAT_SURAT_NIKAH_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.35; color: #000;">
  <p style="text-align: center; margin-bottom: 2px;"><strong><span style="font-size: 12pt; text-decoration: underline;">SURAT PERMOHONAN DUPLIKAT SURAT NIKAH</span></strong></p>
  <p style="text-align: center; margin-top: 0; margin-bottom: 12px;">Nomor : [Format_nomor_suraT]</p>

  <p style="text-align: justify; text-indent: 28px; margin-bottom: 6px;">Yang bertanda tangan di bawah ini Kepala Desa [Nama_desA], Kecamatan [Nama_kecamataN], Kabupaten [Nama_kabupateN], menerangkan dengan sebenarnya bahwa:</p>

  <p style="margin: 4px 0 2px 0; font-weight: bold;">1. Data Suami:</p>
  <table style="border-collapse: collapse; width: 100%; margin-left: 12px; margin-bottom: 6px;" border="0">
  <tbody>
  <tr><td style="width: 28%; padding: 1px 0;">• Nama Lengkap</td><td style="width: 2%;">:</td><td style="width: 70%; font-weight: bold;">[Form_nama_calon_suami]</td></tr>
  <tr><td style="padding: 1px 0;">• Tempat, Tgl. Lahir</td><td>:</td><td>[Form_ttl_calon_suami]</td></tr>
  <tr><td style="padding: 1px 0;">• Agama</td><td>:</td><td>[Form_agama_calon_suami]</td></tr>
  <tr><td style="padding: 1px 0;">• Pekerjaan</td><td>:</td><td>[Form_pekerjaan_calon_suami]</td></tr>
  <tr><td style="padding: 1px 0; vertical-align: top;">• Alamat</td><td style="vertical-align: top;">:</td><td>[Form_alamat_calon_suami]</td></tr>
  </tbody>
  </table>

  <p style="margin: 4px 0 2px 0; font-weight: bold;">2. Data Istri:</p>
  <table style="border-collapse: collapse; width: 100%; margin-left: 12px; margin-bottom: 6px;" border="0">
  <tbody>
  <tr><td style="width: 28%; padding: 1px 0;">• Nama Lengkap</td><td style="width: 2%;">:</td><td style="width: 70%; font-weight: bold;">[Form_nama_calon_istri]</td></tr>
  <tr><td style="padding: 1px 0;">• Tempat, Tgl. Lahir</td><td>:</td><td>[Form_ttl_calon_istri]</td></tr>
  <tr><td style="padding: 1px 0;">• Agama</td><td>:</td><td>[Form_agama_calon_istri]</td></tr>
  <tr><td style="padding: 1px 0;">• Pekerjaan</td><td>:</td><td>[Form_pekerjaan_calon_istri]</td></tr>
  <tr><td style="padding: 1px 0; vertical-align: top;">• Alamat</td><td style="vertical-align: top;">:</td><td>[Form_alamat_calon_istri]</td></tr>
  </tbody>
  </table>

  <p style="text-align: justify; margin-bottom: 4px;">Adalah benar-benar warga penduduk Desa [Nama_desA] yang telah melangsungkan pernikahan pada:</p>
  <table style="border-collapse: collapse; width: 100%; margin-left: 12px; margin-bottom: 6px;" border="0">
  <tbody>
  <tr><td style="width: 28%; padding: 1px 0;">• Hari / Tanggal Nikah</td><td style="width: 2%;">:</td><td style="width: 70%;">[Form_hari_tanggal_nikah]</td></tr>
  <tr><td style="padding: 1px 0;">• Tempat Akad Nikah</td><td>:</td><td>[Form_tempat_akad_nikah]</td></tr>
  <tr><td style="padding: 1px 0;">• Dicatat di KUA</td><td>:</td><td>Kecamatan [Form_kua_tempat_nikah]</td></tr>
  <tr><td style="padding: 1px 0;">• Nomor Akta Nikah</td><td>:</td><td>[Form_no_akta_nikah]</td></tr>
  </tbody>
  </table>

  <p style="text-align: justify; text-indent: 28px; margin-bottom: 6px;">Sehubungan dengan Buku Nikah milik yang bersangkutan mengalami <strong>[Form_status_buku_nikah]</strong>, maka melalui surat pengantar ini kami mohon kepada Bapak Kepala Kantor Urusan Agama (KUA) Kecamatan [Form_kua_tempat_nikah] untuk dapat menerbitkan Duplikat Buku Nikah yang bersangkutan.</p>

  <p style="text-align: justify; text-indent: 28px; margin-bottom: 10px;">Demikian surat keterangan/pengantar ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.</p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 6px;" border="0">
  <tbody>
  <tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center;">[Nama_desA], [Tanggal_suraT]</td>
  </tr>
  <tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center;">[Atas_namA]</td>
  </tr>
  <tr style="height: 40px;">
  <td style="width: 50%; text-align: center; height: 40px;">&nbsp;</td>
  <td style="width: 50%; text-align: center; height: 40px; vertical-align: middle;">[qr_bsre]</td>
  </tr>
  <tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center;"><strong><u>[Nama_pamonG]</u></strong></td>
  </tr>
  <tr>
  <td style="width: 50%; text-align: center;">&nbsp;</td>
  <td style="width: 50%; text-align: center;">[Sebutan_nip_desA] : [Nip_pamoNG]</td>
  </tr>
  </tbody>
  </table>
</div>`;

export const SURAT_PENGANTAR_CERAI_RUJUK_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.35; color: #000;">
  <p style="text-align: center; margin-bottom: 2px;"><strong><span style="font-size: 12pt; text-decoration: underline;">SURAT PENGANTAR CERAI / RUJUK</span></strong></p>
  <p style="text-align: center; margin-top: 0; margin-bottom: 12px;">Nomor : [Format_nomor_suraT]</p>

  <p style="text-align: justify; text-indent: 28px; margin-bottom: 6px;">Yang bertanda tangan di bawah ini Kepala [Nama_desA], Kecamatan [Nama_kecamataN], [Sebutan_kabupaten] [Nama_kabupateN], Provinsi [Nama_provinsI] menerangkan dengan sebenarnya bahwa:</p>

  <table style="border-collapse: collapse; width: 100%; margin-left: 14px; margin-bottom: 6px;" border="0">
  <tbody>
  <tr>
    <td style="width: 4%; padding: 1.5px 0; vertical-align: top;">1.</td>
    <td style="width: 32%; padding: 1.5px 0; vertical-align: top;">Nama Lengkap</td>
    <td style="width: 2%; padding: 1.5px 0; vertical-align: top;">:</td>
    <td style="width: 62%; padding: 1.5px 0; vertical-align: top; font-weight: bold;">[NAma]</td>
  </tr>
  <tr>
    <td style="padding: 1.5px 0; vertical-align: top;">2.</td>
    <td style="padding: 1.5px 0; vertical-align: top;">[Label_bin_pemohon]</td>
    <td style="padding: 1.5px 0; vertical-align: top;">:</td>
    <td style="padding: 1.5px 0; vertical-align: top;">[NaMa_ayah]</td>
  </tr>
  <tr>
    <td style="padding: 1.5px 0; vertical-align: top;">3.</td>
    <td style="padding: 1.5px 0; vertical-align: top;">Tempat / Tanggal Lahir</td>
    <td style="padding: 1.5px 0; vertical-align: top;">:</td>
    <td style="padding: 1.5px 0; vertical-align: top;">[TtL]</td>
  </tr>
  <tr>
    <td style="padding: 1.5px 0; vertical-align: top;">4.</td>
    <td style="padding: 1.5px 0; vertical-align: top;">Kewarganegaraan</td>
    <td style="padding: 1.5px 0; vertical-align: top;">:</td>
    <td style="padding: 1.5px 0; vertical-align: top;">[WArga_negara]</td>
  </tr>
  <tr>
    <td style="padding: 1.5px 0; vertical-align: top;">5.</td>
    <td style="padding: 1.5px 0; vertical-align: top;">Agama</td>
    <td style="padding: 1.5px 0; vertical-align: top;">:</td>
    <td style="padding: 1.5px 0; vertical-align: top;">[AgamA]</td>
  </tr>
  <tr>
    <td style="padding: 1.5px 0; vertical-align: top;">6.</td>
    <td style="padding: 1.5px 0; vertical-align: top;">Pekerjaan</td>
    <td style="padding: 1.5px 0; vertical-align: top;">:</td>
    <td style="padding: 1.5px 0; vertical-align: top;">[PekerjaaN]</td>
  </tr>
  <tr>
    <td style="padding: 1.5px 0; vertical-align: top;">7.</td>
    <td style="padding: 1.5px 0; vertical-align: top;">Alamat/Tempat Tinggal</td>
    <td style="padding: 1.5px 0; vertical-align: top;">:</td>
    <td style="padding: 1.5px 0; vertical-align: top;">[Alamat_lengkaP]</td>
  </tr>
  </tbody>
  </table>

  <p style="margin: 8px 0 4px 0; font-weight: bold;">Telah rujuk/cerai*) dengan:</p>

  <table style="border-collapse: collapse; width: 100%; margin-left: 14px; margin-bottom: 6px;" border="0">
  <tbody>
  <tr>
    <td style="width: 4%; padding: 1.5px 0; vertical-align: top;">8.</td>
    <td style="width: 32%; padding: 1.5px 0; vertical-align: top;">Nama</td>
    <td style="width: 2%; padding: 1.5px 0; vertical-align: top;">:</td>
    <td style="width: 62%; padding: 1.5px 0; vertical-align: top; font-weight: bold;">[Form_nama_pasangan]</td>
  </tr>
  <tr>
    <td style="padding: 1.5px 0; vertical-align: top;">9.</td>
    <td style="padding: 1.5px 0; vertical-align: top;">[Label_bin_pasangan]</td>
    <td style="padding: 1.5px 0; vertical-align: top;">:</td>
    <td style="padding: 1.5px 0; vertical-align: top;">[Form_nama_ayah_pasangan]</td>
  </tr>
  <tr>
    <td style="padding: 1.5px 0; vertical-align: top;">10.</td>
    <td style="padding: 1.5px 0; vertical-align: top;">Tempat dan Tgl. Lahir</td>
    <td style="padding: 1.5px 0; vertical-align: top;">:</td>
    <td style="padding: 1.5px 0; vertical-align: top;">[Form_tempatlahir_pasangan], [Form_tanggallahir_pasangan]</td>
  </tr>
  <tr>
    <td style="padding: 1.5px 0; vertical-align: top;">11.</td>
    <td style="padding: 1.5px 0; vertical-align: top;">Kewarganegaraan</td>
    <td style="padding: 1.5px 0; vertical-align: top;">:</td>
    <td style="padding: 1.5px 0; vertical-align: top;">[Form_wn_pasangan]</td>
  </tr>
  <tr>
    <td style="padding: 1.5px 0; vertical-align: top;">12.</td>
    <td style="padding: 1.5px 0; vertical-align: top;">Agama</td>
    <td style="padding: 1.5px 0; vertical-align: top;">:</td>
    <td style="padding: 1.5px 0; vertical-align: top;">[Form_agama_pasangan]</td>
  </tr>
  <tr>
    <td style="padding: 1.5px 0; vertical-align: top;">13.</td>
    <td style="padding: 1.5px 0; vertical-align: top;">Pekerjaan</td>
    <td style="padding: 1.5px 0; vertical-align: top;">:</td>
    <td style="padding: 1.5px 0; vertical-align: top;">[Form_pekerjaan_pasangan]</td>
  </tr>
  <tr>
    <td style="padding: 1.5px 0; vertical-align: top;">14.</td>
    <td style="padding: 1.5px 0; vertical-align: top;">Alamat</td>
    <td style="padding: 1.5px 0; vertical-align: top;">:</td>
    <td style="padding: 1.5px 0; vertical-align: top;">[Form_alamat_pasangan]</td>
  </tr>
  </tbody>
  </table>

  <p style="text-align: justify; text-indent: 28px; margin-top: 10px; margin-bottom: 12px;">Demikian surat keterangan ini dibuat dengan sebenarnya, untuk dipergunakan sebagaimana mestinya.</p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 10px;" border="0">
  <tbody>
  <tr>
    <td style="width: 50%; text-align: center;">&nbsp;</td>
    <td style="width: 50%; text-align: center;">[Nama_desA], [Tanggal_suraT]</td>
  </tr>
  <tr>
    <td style="width: 50%; text-align: center;">&nbsp;</td>
    <td style="width: 50%; text-align: center;">[Atas_namA]</td>
  </tr>
  <tr style="height: 52px;">
    <td style="width: 50%; text-align: center; height: 52px;">&nbsp;</td>
    <td style="width: 50%; text-align: center; height: 52px; vertical-align: middle;">[qr_bsre]</td>
  </tr>
  <tr>
    <td style="width: 50%; text-align: center;">&nbsp;</td>
    <td style="width: 50%; text-align: center;"><strong><u>[Nama_pamonG]</u></strong></td>
  </tr>
  <tr>
    <td style="width: 50%; text-align: center;">&nbsp;</td>
    <td style="width: 50%; text-align: center;">[Sebutan_nip_desA] : [Nip_pamoNG]</td>
  </tr>
  </tbody>
  </table>
</div>`;

export const SURAT_SPORADIK_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; line-height: 1.2; color: #000;">
  <p style="margin: 0 0 3px 0; text-align: justify;">Yang bertanda tangan di bawah ini :</p>

  <table style="border-collapse: collapse; width: 100%; margin-left: 12px; margin-bottom: 3px;" border="0">
  <tbody>
    <tr>
      <td style="width: 28%; padding: 0.5px 0; vertical-align: top;">Nama Lengkap</td>
      <td style="width: 2%; padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="width: 70%; padding: 0.5px 0; vertical-align: top; font-weight: bold;">[nama_non_warga]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">Tempat &amp; Tgl. Lahir</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[tempatlahir_pemohon], [tanggallahir_pemohon]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">Umur</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[umur_pemohon]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">Pekerjaan</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[pekerjaan_pemohon]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">Nomor KTP</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[nik_non_warga]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">Alamat</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[alamat_pemohon]</td>
    </tr>
  </tbody>
  </table>

  <p style="margin: 0 0 3px 0; text-align: justify;">Dengan ini menyatakan bahwa saya dengan itikad baik telah menguasai sebidang tanah yang terletak :</p>

  <table style="border-collapse: collapse; width: 100%; margin-left: 12px; margin-bottom: 3px;" border="0">
  <tbody>
    <tr>
      <td style="width: 28%; padding: 0.5px 0; vertical-align: top;">Jalan/ RT</td>
      <td style="width: 2%; padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="width: 70%; padding: 0.5px 0; vertical-align: top;">[jalan]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">Dusun</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[rtrw]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">Desa/ Kelurahan</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[desalurah]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">Kecamatan</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[camatt]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">Kabupaten</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[kabb]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">NIB</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[nib]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">Status Tanah</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[statustanah]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">Dipergunakan untuk</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[tanahuntuk]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">Luas</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[luashak] M²</td>
    </tr>
  </tbody>
  </table>

  <p style="margin: 0 0 2px 0; text-align: justify;">Batas-Batas Tanah :</p>

  <table style="border-collapse: collapse; width: 100%; margin-left: 12px; margin-bottom: 3px;" border="0">
  <tbody>
    <tr>
      <td style="width: 28%; padding: 0.5px 0; vertical-align: top;">Sebelah Utara</td>
      <td style="width: 2%; padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="width: 70%; padding: 0.5px 0; vertical-align: top;">[utara]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">Sebelah Selatan</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[selatan]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">Sebelah Timur</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[timur]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;">Sebelah Barat</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[barat]</td>
    </tr>
  </tbody>
  </table>

  <p style="margin: 0 0 2px 0; text-align: justify;">Bidang Tanah tersebut saya peroleh dari [peroleh] tahun [perolehtahun] dengan jalan [denganjalan]/ terlampir yang sampai saat ini saya kuasai secara terus menerus dan</p>

  <table style="border-collapse: collapse; width: 100%; margin-left: 14px; margin-bottom: 2px;" border="0">
  <tbody>
    <tr>
      <td style="width: 3%; padding: 0.5px 0; vertical-align: top; text-align: center;">-</td>
      <td style="padding: 0.5px 0; vertical-align: top;">Tidak diajukan/ menjadi jaminan hutang</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top; text-align: center;">-</td>
      <td style="padding: 0.5px 0; vertical-align: top;">Tidak dalam keadaan sengketa</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top; text-align: center;">-</td>
      <td style="padding: 0.5px 0; vertical-align: top;">Tidak merupakan tanah warisan yang belum di bagi</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top; text-align: center;">-</td>
      <td style="padding: 0.5px 0; vertical-align: top;">Belum bersertifikat</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top; text-align: center;">-</td>
      <td style="padding: 0.5px 0; vertical-align: top;">Penggunaannya tidak pernah di ganggu gugat</td>
    </tr>
  </tbody>
  </table>

  <p style="margin: 0 0 2px 0; text-align: justify;">Surat pernyataan ini saya bubuhkan cap jempol setelah saya dibacakan dan mengerti isi/ maksud, dibuat dengan sebenarnya dengan penuh tanggung jawab dan saya bersedia untuk mengangkat sumpah bila diperlukan.<br>Demikian dan apabila ini tidak benar, saya bersedia dituntut di hadapan pihak berwenang.</p>

  <p style="margin: 3px 0 2px 0; font-weight: bold;">SAKSI-SAKSI</p>

  <table style="border-collapse: collapse; width: 100%; margin-left: 6px; margin-bottom: 2px;" border="0">
  <tbody>
    <tr>
      <td style="width: 3%; padding: 0.5px 0; vertical-align: top;">1.</td>
      <td style="width: 18%; padding: 0.5px 0; vertical-align: top;">Nama</td>
      <td style="width: 2%; padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="width: 77%; padding: 0.5px 0; vertical-align: top;">[namasaksii]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;"></td>
      <td style="padding: 0.5px 0; vertical-align: top;">Umur</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[umursaksii] Tahun</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;"></td>
      <td style="padding: 0.5px 0; vertical-align: top;">Pekerjaan</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[pekerjaansaksii]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;"></td>
      <td style="padding: 0.5px 0; vertical-align: top;">Alamat</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[alamatsaksii]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;"></td>
      <td style="padding: 0.5px 0; vertical-align: top;">Tanda Tangan</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top; height: 16px;"></td>
    </tr>
  </tbody>
  </table>

  <table style="border-collapse: collapse; width: 100%; margin-left: 6px; margin-bottom: 4px;" border="0">
  <tbody>
    <tr>
      <td style="width: 3%; padding: 0.5px 0; vertical-align: top;">2.</td>
      <td style="width: 18%; padding: 0.5px 0; vertical-align: top;">Nama</td>
      <td style="width: 2%; padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="width: 77%; padding: 0.5px 0; vertical-align: top;">[namasaksiii]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;"></td>
      <td style="padding: 0.5px 0; vertical-align: top;">Umur</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[umursaksiii] Tahun</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;"></td>
      <td style="padding: 0.5px 0; vertical-align: top;">Pekerjaan</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[pekerjaansaksiii]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;"></td>
      <td style="padding: 0.5px 0; vertical-align: top;">Alamat</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top;">[alamatsaksiii]</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0; vertical-align: top;"></td>
      <td style="padding: 0.5px 0; vertical-align: top;">Tanda Tangan</td>
      <td style="padding: 0.5px 0; text-align: center; vertical-align: top;">:</td>
      <td style="padding: 0.5px 0; vertical-align: top; height: 16px;"></td>
    </tr>
  </tbody>
  </table>

  <table style="border-collapse: collapse; width: 100%; margin-top: 4px;" border="0">
  <tbody>
    <tr>
      <td style="width: 50%; vertical-align: top; padding: 0;">
        Reg. No : __________________<br>
        Tanggal : __________________<br>
        Mengetahui/ membenarkan<br>
        [penandatangan]
        <div style="height: 44px;"></div>
        <strong>[nama_pejabat]</strong>
      </td>
      <td style="width: 50%; vertical-align: top; padding: 0; text-align: center;">
        [nama_des], [tgl_surat]<br>
        Hormat Kami,
        <div style="height: 44px;"></div>
        <strong>[nama]</strong>
      </td>
    </tr>
  </tbody>
  </table>
</div>`;

export const SURAT_KETERANGAN_KEPEMILIKAN_TANAH_TEMPLATE = `<h4 style="margin: 0; text-align: center;"><span style="text-decoration: underline;">[JUdul_surat]</span></h4>
<p style="margin: 2px 0 14px 0; text-align: center; font-size: 11pt;">Nomor : [Format_nomor_suraT]</p>

<p style="text-indent: 30px; text-align: justify; margin: 0 0 6px 0; line-height: 1.5;">Yang bertanda tangan di bawah ini :</p>
<table style="border-collapse: collapse; width: 100%; margin-bottom: 10px;" border="0" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="width: 4%; text-align: left; vertical-align: top; padding: 1.5px 0;">&nbsp;</td>
<td style="width: 28%; text-align: left; vertical-align: top; padding: 1.5px 0;">Nama</td>
<td style="width: 2%; text-align: center; vertical-align: top; padding: 1.5px 0;">:</td>
<td style="width: 66%; text-align: justify; vertical-align: top; padding: 1.5px 0;"><strong>[NAma_pamong]</strong></td>
</tr>
<tr>
<td style="width: 4%; text-align: left; vertical-align: top; padding: 1.5px 0;">&nbsp;</td>
<td style="width: 28%; text-align: left; vertical-align: top; padding: 1.5px 0;">Jabatan</td>
<td style="width: 2%; text-align: center; vertical-align: top; padding: 1.5px 0;">:</td>
<td style="width: 66%; text-align: justify; vertical-align: top; padding: 1.5px 0;">[JaBatan] [NaMa_desa], [SeButan_kecamatan] [NaMa_kecamatan], [SeButan_kabupaten] [NaMa_kabupaten], Provinsi [NaMa_provinsi]</td>
</tr>
</tbody>
</table>

<p style="text-align: justify; text-indent: 30px; margin: 0 0 6px 0; line-height: 1.5;">Dengan ini menerangkan bahwa :</p>
<table style="border-collapse: collapse; width: 100%; margin-bottom: 10px;" border="0" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="width: 4%; text-align: left; vertical-align: top; padding: 1.5px 0;">&nbsp;</td>
<td style="width: 28%; text-align: left; vertical-align: top; padding: 1.5px 0;">Nama</td>
<td style="width: 2%; text-align: center; vertical-align: top; padding: 1.5px 0;">:</td>
<td style="width: 66%; text-align: justify; vertical-align: top; padding: 1.5px 0;"><strong>[NamA]</strong></td>
</tr>
<tr>
<td style="width: 4%; text-align: left; vertical-align: top; padding: 1.5px 0;">&nbsp;</td>
<td style="width: 28%; text-align: left; vertical-align: top; padding: 1.5px 0;">Tempat / Tanggal Lahir</td>
<td style="width: 2%; text-align: center; vertical-align: top; padding: 1.5px 0;">:</td>
<td style="width: 66%; text-align: justify; vertical-align: top; padding: 1.5px 0;">[Tempat_tanggal_lahir]</td>
</tr>
<tr>
<td style="width: 4%; text-align: left; vertical-align: top; padding: 1.5px 0;">&nbsp;</td>
<td style="width: 28%; text-align: left; vertical-align: top; padding: 1.5px 0;">Umur</td>
<td style="width: 2%; text-align: center; vertical-align: top; padding: 1.5px 0;">:</td>
<td style="width: 66%; text-align: justify; vertical-align: top; padding: 1.5px 0;">[UsiA]</td>
</tr>
<tr>
<td style="width: 4%; text-align: left; vertical-align: top; padding: 1.5px 0;">&nbsp;</td>
<td style="width: 28%; text-align: left; vertical-align: top; padding: 1.5px 0;">Jenis Kelamin</td>
<td style="width: 2%; text-align: center; vertical-align: top; padding: 1.5px 0;">:</td>
<td style="width: 66%; text-align: justify; vertical-align: top; padding: 1.5px 0;">[Jenis_kelamiN]</td>
</tr>
<tr>
<td style="width: 4%; text-align: left; vertical-align: top; padding: 1.5px 0;">&nbsp;</td>
<td style="width: 28%; text-align: left; vertical-align: top; padding: 1.5px 0;">Pekerjaan</td>
<td style="width: 2%; text-align: center; vertical-align: top; padding: 1.5px 0;">:</td>
<td style="width: 66%; text-align: justify; vertical-align: top; padding: 1.5px 0;">[PekerjaaN]</td>
</tr>
<tr>
<td style="width: 4%; text-align: left; vertical-align: top; padding: 1.5px 0;">&nbsp;</td>
<td style="width: 28%; text-align: left; vertical-align: top; padding: 1.5px 0;">Alamat</td>
<td style="width: 2%; text-align: center; vertical-align: top; padding: 1.5px 0;">:</td>
<td style="width: 66%; text-align: justify; vertical-align: top; padding: 1.5px 0;">[AlamaT]</td>
</tr>
</tbody>
</table>

<p style="text-indent: 30px; text-align: justify; margin: 0 0 6px 0; line-height: 1.5;">Adalah benar-benar penduduk [Sebutan_desA] [NaMa_desa], yang memiliki/menguasai tanah/lahan berupa <strong>[FoRm_jenis_tanah]</strong> atas nama <strong>[Form_atas_nama_tanaH]</strong>, yang berada di [Sebutan_desA] [NaMa_desa]. Tercatat dalam <strong>[FOrm_bukti_kepemilikan_tanah]</strong>, Nomor : <strong>[Form_nomor_bukti_kepemilikan_tanaH]</strong>, Luas : <strong>[Form_luas_tanaH]</strong> M<sup>2</sup>, dengan batas-batas :</p>

<table style="border-collapse: collapse; width: 100%; margin-bottom: 8px;" border="0" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="width: 4%; text-align: left; vertical-align: top; padding: 1.5px 0;">&nbsp;</td>
<td style="width: 28%; text-align: left; vertical-align: top; padding: 1.5px 0;">Sebelah Utara</td>
<td style="width: 2%; text-align: center; vertical-align: top; padding: 1.5px 0;">:</td>
<td style="width: 66%; text-align: justify; vertical-align: top; padding: 1.5px 0;">[Form_batas_utara_tanaH]</td>
</tr>
<tr>
<td style="width: 4%; text-align: left; vertical-align: top; padding: 1.5px 0;">&nbsp;</td>
<td style="width: 28%; text-align: left; vertical-align: top; padding: 1.5px 0;">Sebelah Timur</td>
<td style="width: 2%; text-align: center; vertical-align: top; padding: 1.5px 0;">:</td>
<td style="width: 66%; text-align: justify; vertical-align: top; padding: 1.5px 0;">[Form_batas_timur_tanaH]</td>
</tr>
<tr>
<td style="width: 4%; text-align: left; vertical-align: top; padding: 1.5px 0;">&nbsp;</td>
<td style="width: 28%; text-align: left; vertical-align: top; padding: 1.5px 0;">Sebelah Selatan</td>
<td style="width: 2%; text-align: center; vertical-align: top; padding: 1.5px 0;">:</td>
<td style="width: 66%; text-align: justify; vertical-align: top; padding: 1.5px 0;">[Form_batas_selatan_tanaH]</td>
</tr>
<tr>
<td style="width: 4%; text-align: left; vertical-align: top; padding: 1.5px 0;">&nbsp;</td>
<td style="width: 28%; text-align: left; vertical-align: top; padding: 1.5px 0;">Sebelah Barat</td>
<td style="width: 2%; text-align: center; vertical-align: top; padding: 1.5px 0;">:</td>
<td style="width: 66%; text-align: justify; vertical-align: top; padding: 1.5px 0;">[Form_batas_barat_tanaH]</td>
</tr>
</tbody>
</table>

<ol style="margin: 0 0 8px 20px; padding: 0; line-height: 1.45;">
<li style="text-align: justify; padding-bottom: 2px;">Tanah tersebut benar-benar <em>MILIK</em> yang bersangkutan dan <strong>tidak dalam keadaan sengketa</strong>.</li>
<li style="text-align: justify; padding-bottom: 2px;">Tanah tersebut berasal dari <strong>[FOrm_asal_kepemilikan_tanah]</strong> dan sampai dengan sekarang belum terdaftar / didaftarkan Hak nya ke BPN (belumditerbitkan : SIIM / SIIGB / SIIGU / LAINNYA)</li>
<li style="text-align: justify; padding-bottom: 2px;">Bukti pendukung kepemilikan sementara ini berupa <strong>[Form_bukti_pendukung_kepemilikan_tanah]</strong>.</li>
</ol>

<p style="text-indent: 30px; margin: 0 0 12px 0; line-height: 1.5;">Demikian surat ini dibuat, untuk dipergunakan sebagaimana mestinya.</p>

<table style="border-collapse: collapse; width: 100%; margin-top: 10px;" border="0">
<tbody>
<tr>
<td style="width: 40%; text-align: center; vertical-align: top;">&nbsp;</td>
<td style="width: 20%;">&nbsp;</td>
<td style="width: 40%; text-align: center; vertical-align: top;">[NaMa_desa], [TgL_surat]</td>
</tr>
<tr>
<td style="width: 40%; text-align: center; vertical-align: top;">Pemilik</td>
<td style="width: 20%;">&nbsp;</td>
<td style="width: 40%; text-align: center; vertical-align: top;">[Atas_namA]</td>
</tr>
<tr style="height: 65px;">
<td style="width: 40%; text-align: center; vertical-align: bottom; height: 65px;">&nbsp;</td>
<td style="width: 20%; height: 65px;">&nbsp;</td>
<td style="width: 40%; height: 65px; text-align: center; vertical-align: middle;">[qr_bsre]</td>
</tr>
<tr>
<td style="width: 40%; text-align: center; font-weight: bold; text-decoration: underline;">[NAma]</td>
<td style="width: 20%;">&nbsp;</td>
<td style="width: 40%; text-align: center; font-weight: bold; text-decoration: underline;">[Nama_pamonG]</td>
</tr>
<tr>
<td style="width: 40%;">&nbsp;</td>
<td style="width: 20%;">&nbsp;</td>
<td style="width: 40%; text-align: center;">[SEbutan_nip_desa] : [nip_pamong]</td>
</tr>
</tbody>
</table>
<div style="text-align: center;">[qr_code]</div>
</div>`;

export const SURAT_KETERANGAN_JUAL_BELI_TANAH_TEMPLATE = `<div style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.45; color: #000;">
  <div style="text-align: center; margin-bottom: 14px;">
    <h3 style="margin: 0; text-decoration: underline; font-weight: bold; font-size: 12.5pt; letter-spacing: 0.5px;">SURAT KETERANGAN JUAL BELI TANAH</h3>
    <p style="margin: 3px 0 0 0; font-size: 10.5pt;">Nomor : [Format_nomor_suraT]</p>
  </div>

  <p style="margin: 0 0 8px 0;">Kami yang bertanda tangan di bawah ini:</p>

  <p style="margin: 8px 0 3px 0; font-weight: bold;">I. PIHAK PERTAMA (Penjual)</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;" border="0">
    <tbody>
      <tr>
        <td style="width: 25%; vertical-align: top; padding: 1.5px 0;">Nama</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="width: 72%; vertical-align: top; padding: 1.5px 0;"><strong>[Nama_penjual]</strong></td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Tempat/Tanggal Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Ttl_penjual]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Pekerjaan_penjual]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Nomor KTP/NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Nik_penjual]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">Desa [Desa_penjual], RT [Rt_penjual] / RW [Rw_penjual], Kecamatan [Kecamatan_penjual], Kabupaten [Kabupaten_penjual]</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 10px 0 3px 0; font-weight: bold;">II. PIHAK KEDUA (Pembeli)</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;" border="0">
    <tbody>
      <tr>
        <td style="width: 25%; vertical-align: top; padding: 1.5px 0;">Nama</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="width: 72%; vertical-align: top; padding: 1.5px 0;"><strong>[Nama_pembeli]</strong></td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Tempat/Tanggal Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Ttl_pembeli]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Pekerjaan_pembeli]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Nomor KTP/NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Nik_pembeli]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">Desa [Desa_pembeli], RT [Rt_pembeli] / RW [Rw_pembeli], Kecamatan [Kecamatan_pembeli], Kabupaten [Kabupaten_pembeli]</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 12px 0 10px 0; text-align: justify; line-height: 1.5;">
    Pada hari ini, <strong>[Hari_transaksi]</strong> tanggal <strong>[Tgl_angka_transaksi]</strong> bulan <strong>[Bulan_transaksi]</strong> tahun <strong>[Tahun_transaksi]</strong>, Pihak Pertama telah menjual sebidang tanah milik pribadi kepada Pihak Kedua, dengan rincian obyek sebagai berikut:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;" border="0">
    <tbody>
      <tr>
        <td style="width: 32%; vertical-align: top; padding: 2px 0;">Letak / Alamat Tanah</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="width: 65%; vertical-align: top; padding: 2px 0;">Desa [Desa_tanah], Kecamatan [Kecamatan_tanah], Kabupaten [Kabupaten_tanah]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Luas Tanah</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">&plusmn; [Luas_tanah] m<sup>2</sup> (panjang [Panjang_tanah] meter, lebar [Lebar_tanah] meter)</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Nomor Sertifikat / Alas Hak</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Alas_hak_lengkap]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Batas-batas Tanah</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;"></td>
      </tr>
      <tr>
        <td colspan="3" style="padding: 1px 0 1px 25px;">
          <table style="width: 100%; border-collapse: collapse;" border="0">
            <tbody>
              <tr>
                <td style="width: 40%; vertical-align: top; padding: 1.5px 0;">- Sebelah Utara berbatasan dengan</td>
                <td style="width: 3%; vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
                <td style="width: 57%; vertical-align: top; padding: 1.5px 0;">[Batas_utara]</td>
              </tr>
              <tr>
                <td style="vertical-align: top; padding: 1.5px 0;">- Sebelah Selatan berbatasan dengan</td>
                <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
                <td style="vertical-align: top; padding: 1.5px 0;">[Batas_selatan]</td>
              </tr>
              <tr>
                <td style="vertical-align: top; padding: 1.5px 0;">- Sebelah Timur berbatasan dengan</td>
                <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
                <td style="vertical-align: top; padding: 1.5px 0;">[Batas_timur]</td>
              </tr>
              <tr>
                <td style="vertical-align: top; padding: 1.5px 0;">- Sebelah Barat berbatasan dengan</td>
                <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
                <td style="vertical-align: top; padding: 1.5px 0;">[Batas_barat]</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>

  <h4 style="margin: 14px 0 8px 0; text-align: center; text-decoration: underline; font-weight: bold; font-size: 11pt; letter-spacing: 0.5px;">KETENTUAN / PASAL-PASAL KESEPAKATAN</h4>

  <p style="margin: 6px 0 2px 0; font-weight: bold;">1. Harga dan Pembayaran:</p>
  <p style="margin: 0; text-align: justify; line-height: 1.5; text-indent: 20px;">
    Tanah tersebut dijual dengan harga Rp <strong>[Harga_transaksi]</strong> (terbilang: <em>[Harga_terbilang]</em>), yang dibayarkan secara tunai oleh Pihak Kedua kepada Pihak Pertama pada saat penandatanganan surat ini.
  </p>
</div>

<!-- pagebreak -->

<div style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.5; color: #000; padding-top: 55px;">
  <p style="margin: 0 0 2px 0; font-weight: bold;">2. Jaminan:</p>
  <p style="margin: 0 0 10px 0; text-align: justify; line-height: 1.5; text-indent: 20px;">
    Pihak Pertama menjamin sepenuhnya bahwa tanah yang dijual tersebut adalah benar milik pribadi, bebas dari sengketa, tidak sedang digadaikan, tidak disita, dan tidak tersangkut masalah hukum dengan pihak lain. Jika di kemudian hari ada klaim atau gugatan dari pihak lain, Pihak Pertama bertanggung jawab sepenuhnya menyelesaikan tanpa melibatkan Pihak Kedua.
  </p>

  <p style="margin: 10px 0 2px 0; font-weight: bold;">3. Peralihan Hak:</p>
  <p style="margin: 0 0 10px 0; text-align: justify; line-height: 1.5; text-indent: 20px;">
    Sejak ditandatanganinya surat ini dan pelunasan pembayaran, maka tanah tersebut secara sah menjadi hak milik Pihak Kedua. Segala keuntungan maupun resiko yang timbul dari tanah tersebut menjadi hak dan tanggungan Pihak Kedua.
  </p>

  <p style="margin: 10px 0 2px 0; font-weight: bold;">4. Biaya-biaya:</p>
  <p style="margin: 0 0 18px 0; text-align: justify; line-height: 1.5; text-indent: 20px;">
    Segala biaya pembuatan surat keterangan, saksi-saksi, hingga proses balik nama selanjutnya ditanggung oleh <strong>[Biaya_ditanggung_oleh]</strong>.
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;" border="0">
    <tbody>
      <tr>
        <td style="width: 55%;">&nbsp;</td>
        <td style="width: 45%; text-align: left; line-height: 1.4;">
          Dibuat di : Desa [NaMa_desa]<br>
          Pada tanggal : [Tgl_surat_format]
        </td>
      </tr>
    </tbody>
  </table>

  <table style="width: 100%; border-collapse: collapse; text-align: center; margin-bottom: 18px;" border="0">
    <tbody>
      <tr>
        <td style="width: 50%; font-weight: bold; padding-bottom: 6px;">PIHAK KEDUA (Pembeli)</td>
        <td style="width: 50%; font-weight: bold; padding-bottom: 6px;">PIHAK PERTAMA (Penjual)</td>
      </tr>
      <tr>
        <td style="height: 75px; vertical-align: bottom;">&nbsp;</td>
        <td style="height: 75px; vertical-align: top; padding-top: 4px;">
          <div style="display: inline-block; border: 1px dashed #666; padding: 4px 8px; font-size: 8.5pt; color: #555;">[ Materai Rp 10.000 ]</div>
        </td>
      </tr>
      <tr>
        <td>( <strong>[Nama_pembeli]</strong> )</td>
        <td>( <strong>[Nama_penjual]</strong> )</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 12px 0 4px 0; font-weight: bold;">Saksi-Saksi:</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;" border="0">
    <tbody>
      <tr>
        <td style="width: 25%; vertical-align: middle; padding: 5px 0;">1. Saksi dari Pihak I</td>
        <td style="width: 2%; vertical-align: middle; text-align: center; padding: 5px 0;">:</td>
        <td style="width: 38%; vertical-align: middle; padding: 5px 0;">( <strong>[Saksi_pihak_1]</strong> )</td>
        <td style="width: 35%; vertical-align: middle; text-align: right; padding: 5px 0;">1. ....................................................</td>
      </tr>
      <tr>
        <td style="vertical-align: middle; padding: 5px 0;">2. Saksi dari Pihak II</td>
        <td style="vertical-align: middle; text-align: center; padding: 5px 0;">:</td>
        <td style="vertical-align: middle; padding: 5px 0;">( <strong>[Saksi_pihak_2]</strong> )</td>
        <td style="vertical-align: middle; text-align: right; padding: 5px 0;">2. ....................................................</td>
      </tr>
    </tbody>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-top: 22px;" border="0">
    <tbody>
      <tr>
        <td style="width: 20%;">&nbsp;</td>
        <td style="width: 60%; text-align: center; line-height: 1.45;">
          Mengetahui / Mengesahkan:<br>
          <strong style="text-transform: uppercase;">[Atas_namA]</strong>
          <div style="height: 18px;"></div>
          <span style="font-size: 9pt; color: #666; font-style: italic;"></span>
          <div style="height: 65px;"></div>
          ( <strong style="text-decoration: underline; text-transform: uppercase;">[Nama_pamong]</strong> )
        </td>
        <td style="width: 20%;">&nbsp;</td>
      </tr>
    </tbody>
  </table>
</div>`;

export const SURAT_PENGANTAR_UMUM_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.5; color: #000;">
  <div style="text-align: center; margin-bottom: 18px;">
    <h3 style="margin: 0; text-decoration: underline; font-weight: bold; font-size: 13pt; letter-spacing: 0.5px;">SURAT PENGANTAR UMUM</h3>
    <p style="margin: 4px 0 0 0; font-size: 11pt; font-weight: bold;">Nomor : [Format_nomor_suraT]</p>
  </div>

  <p style="text-align: justify; margin: 0 0 14px 0; line-height: 1.5;">
    Yang bertanda tangan di bawah ini Kepala Desa [NaMa_desa], Kecamatan [NaMa_kecamatan], Kabupaten [NaMa_kabupaten], menerangkan dengan sebenarnya bahwa:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; line-height: 1.5;" border="0">
    <tbody>
      <tr>
        <td style="width: 28%; vertical-align: top; padding: 2.5px 0;">Nama Lengkap</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="width: 69%; vertical-align: top; padding: 2.5px 0;">[NAma]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Nik]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Jenis Kelamin</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Jenis_kelamin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Tempat / Tgl Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Tempat_tanggal_lahiR]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[PeKerjaan]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Alamat_lengkaP]</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: justify; margin: 0 0 14px 0; line-height: 1.5;">
    Berdasarkan catatan yang ada di kantor kami, nama tersebut di atas adalah benar-benar warga Desa [NaMa_desa], Kecamatan [NaMa_kecamatan], Kabupaten [NaMa_kabupaten].
  </p>

  <p style="text-align: justify; margin: 0 0 14px 0; line-height: 1.5;">
    Surat pengantar ini diberikan kepada yang bersangkutan untuk dipergunakan sebagaimana mestinya, yaitu untuk keperluan : <strong>[Form_keperluan]</strong>.
  </p>

  <p style="text-align: justify; margin: 0 0 24px 0; line-height: 1.5;">
    Demikian surat pengantar ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
  </p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 28px;" border="0">
    <tbody>
      <tr>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">[NaMa_desa], [TgL_surat]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">Pemohon</td>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">[Atas_namA]</td>
      </tr>
      <tr style="height: 65px;">
        <td style="width: 50%; text-align: center; height: 65px; vertical-align: middle;">&nbsp;</td>
        <td style="width: 50%; text-align: center; height: 65px; vertical-align: middle;">[qr_bsre]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[NAma]</u></strong></td>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_pamonG]</u></strong></td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 10pt; color: #333;">[SEbutan_nip_desa] : [nip_pamong]</td>
      </tr>
    </tbody>
  </table>
  <div style="text-align: center;"><br>[qr_code]</div>
</div>`;

export const SURAT_KETERANGAN_UMUM_TEMPLATE = SURAT_PENGANTAR_UMUM_TEMPLATE;

export const SURAT_PENGANTAR_SKCK_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45; color: #000;">
  <div style="text-align: center; margin-bottom: 16px;">
    <h3 style="margin: 0; text-decoration: underline; font-weight: bold; font-size: 13pt; letter-spacing: 0.5px;">SURAT PENGANTAR SKCK</h3>
    <p style="margin: 4px 0 0 0; font-size: 11pt; font-weight: bold;">Nomor : [Format_nomor_suraT]</p>
  </div>

  <p style="text-align: justify; margin: 0 0 12px 0; line-height: 1.45;">
    Yang bertanda tangan di bawah ini Kepala Desa [NaMa_desa], Kecamatan [NaMa_kecamatan], Kabupaten [NaMa_kabupaten], menerangkan dengan sebenar-benarnya bahwa:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; line-height: 1.45;" border="0">
    <tbody>
      <tr>
        <td style="width: 28%; vertical-align: top; padding: 2px 0;">Nama Lengkap</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="width: 69%; vertical-align: top; padding: 2px 0;">[NAma]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Nik]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Jenis Kelamin</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Jenis_kelamin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Tempat/Tgl Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Tempat_tanggal_lahiR]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Kewarganegaraan</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[WArga_negara]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Agama</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[AgAma]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[PeKerjaan]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Alamat_lengkaP]</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: justify; margin: 0 0 10px 0; line-height: 1.45;">
    Berdasarkan data kependudukan dan catatan yang ada di kantor kami, nama tersebut di atas adalah benar-benar warga kami yang berdomisili di alamat tersebut. Sepanjang pengetahuan kami, yang bersangkutan berkelakuan baik, tidak pernah tersangkut perkara pidana maupun perdata, dan tidak sedang dalam pengawasan pihak berwajib.
  </p>

  <p style="text-align: justify; margin: 0 0 10px 0; line-height: 1.45;">
    Surat keterangan ini dibuat sebagai pengantar untuk keperluan: <strong>[Form_keperluan]</strong>.
  </p>

  <p style="text-align: justify; margin: 0 0 16px 0; line-height: 1.45;">
    Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.
  </p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 14px; line-height: 1.3;" border="0">
    <tbody>
      <tr>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">[NaMa_desa], [TgL_surat]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">Tanda Tangan Pemegang</td>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">[Atas_namA]</td>
      </tr>
      <tr style="height: 52px;">
        <td style="width: 50%; text-align: center; height: 52px; vertical-align: middle;">&nbsp;</td>
        <td style="width: 50%; text-align: center; height: 52px; vertical-align: middle;">[qr_bsre]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[NAma]</u></strong></td>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_pamonG]</u></strong></td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 14px; text-align: center;">
    <p style="margin: 0 0 8px 0; font-weight: bold; text-decoration: underline; font-size: 11pt;">MENGETAHUI :</p>
    <table style="border-collapse: collapse; width: 100%; line-height: 1.3;" border="0">
      <tbody>
        <tr>
          <td style="width: 33.33%; text-align: center; vertical-align: top; font-size: 10.5pt;">
            <strong>CAMAT</strong><br />
            <span>[NaMa_kecamatan]</span>
          </td>
          <td style="width: 33.33%; text-align: center; vertical-align: top; font-size: 10.5pt;">
            <strong>DAN RAMIL 10</strong><br />
            <span>[NaMa_kecamatan]</span>
          </td>
          <td style="width: 33.33%; text-align: center; vertical-align: top; font-size: 10.5pt;">
            <strong>KAPOLSEK</strong><br />
            <span>[NaMa_kecamatan]</span>
          </td>
        </tr>
        <tr style="height: 50px;">
          <td style="height: 50px; vertical-align: bottom; text-align: center;">
            <div style="border-bottom: 1.5px solid #000; width: 80%; margin: 0 auto;"></div>
          </td>
          <td style="height: 50px; vertical-align: bottom; text-align: center;">
            <div style="border-bottom: 1.5px solid #000; width: 80%; margin: 0 auto;"></div>
          </td>
          <td style="height: 50px; vertical-align: bottom; text-align: center;">
            <div style="border-bottom: 1.5px solid #000; width: 80%; margin: 0 auto;"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div style="text-align: center;"><br />[qr_code]</div>
</div>`;

export const SURAT_KETERANGAN_IZIN_KELUARGA_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.4; color: #000;">
  <div style="text-align: center; margin-bottom: 14px;">
    <h3 style="margin: 0; text-decoration: underline; font-weight: bold; font-size: 13pt; letter-spacing: 0.5px;">SURAT KETERANGAN IZIN KELUARGA</h3>
    <p style="margin: 3px 0 0 0; font-size: 11pt; font-weight: bold;">Nomor: [Format_nomor_suraT]</p>
  </div>

  <p style="text-align: justify; margin: 0 0 10px 0; line-height: 1.4;">
    Yang bertandatangan dibawah ini Kepala Desa [NaMa_desa] Kecamatan [NaMa_kecamatan] Kabupaten [NaMa_kabupaten] dengan ini menerangkan bahwa :
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; line-height: 1.35;" border="0">
    <tbody>
      <tr>
        <td style="width: 28%; vertical-align: top; padding: 1.5px 0;">Nama</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="width: 69%; vertical-align: top; padding: 1.5px 0;"><strong>[Nama_pemberi_izin]</strong></td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Nik_pemberi_izin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Tempat/Tgl. Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Ttl_pemberi_izin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Warga Negara/Agama</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Warga_negara_agama_pemberi_izin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Pekerjaan_pemberi_izin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Status Perkawinan</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Status_perkawinan_pemberi_izin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Alamat_pemberi_izin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 3px 0 1px 0;">&nbsp;</td>
        <td style="vertical-align: top; text-align: center; padding: 3px 0 1px 0;">&nbsp;</td>
        <td style="vertical-align: top; padding: 3px 0 1px 0;">&nbsp;</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Hubungan Dengan CTKI</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Hubungan_dengan_ctki]</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: justify; margin: 8px 0 8px 0; line-height: 1.4;">
    Dengan ini memberikan beserta tanggung jawab penuh untuk bekerja keluar negeri kepada [Panggilan_hubungan_penerima] :
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; line-height: 1.35;" border="0">
    <tbody>
      <tr>
        <td style="width: 28%; vertical-align: top; padding: 1.5px 0;">Nama</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="width: 69%; vertical-align: top; padding: 1.5px 0;"><strong>[Nama_penerima_izin]</strong></td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Nik_penerima_izin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Tempat/Tgl. Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Ttl_penerima_izin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Warga Negara/Agama</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Warga_negara_agama_penerima_izin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Pekerjaan_penerima_izin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Status Perkawinan</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Status_perkawinan_penerima_izin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Alamat terdahulu</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Alamat_penerima_izin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 3px 0 1px 0;">&nbsp;</td>
        <td style="vertical-align: top; text-align: center; padding: 3px 0 1px 0;">&nbsp;</td>
        <td style="vertical-align: top; padding: 3px 0 1px 0;">&nbsp;</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1.5px 0;">Tujuan</td>
        <td style="vertical-align: top; text-align: center; padding: 1.5px 0;">:</td>
        <td style="vertical-align: top; padding: 1.5px 0;">[Tujuan_kerja]</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: justify; margin: 0 0 6px 0; line-height: 1.4;">
    Untuk bekerja keluar negeri dengan masa kontrak [Masa_kontrak].
  </p>
  <p style="text-align: justify; margin: 0 0 14px 0; line-height: 1.4;">
    Demikian surat keterangan izin keluarga ini kami buat dengan sebenarnya dalam keadaan sadar dan tanpa ada paksaan dari pihak mana pun dan dapat dipertanggungjawabkan.
  </p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 10px; line-height: 1.3;" border="0">
    <tbody>
      <tr>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">
          Yang diberi izin
        </td>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">
          Yang mengizinkan
        </td>
      </tr>
      <tr style="height: 52px;">
        <td style="width: 50%; text-align: center; height: 52px; vertical-align: bottom;">&nbsp;</td>
        <td style="width: 50%; text-align: center; height: 52px; vertical-align: bottom;">
          <span style="font-size: 8pt; font-style: italic; color: #555;">Materai Rp. 10.000</span>
        </td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">
          <strong>[Nama_penerima_izin]</strong>
        </td>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">
          <strong>[Nama_pemberi_izin]</strong>
        </td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 14px; text-align: center;">
    <p style="margin: 0; font-size: 11pt;">Mengetahui</p>
    <p style="margin: 2px 0 0 0; font-size: 11pt;">Kepala Desa/Kelurahan</p>
    <div style="height: 50px; display: flex; align-items: center; justify-content: center; margin: 2px 0;">
      [qr_bsre]
    </div>
    <p style="margin: 0; font-size: 11pt; font-weight: bold;">
      <u style="text-decoration: underline;">[Nama_pamonG]</u>
    </p>
  </div>
  <div style="text-align: center;"><br />[qr_code]</div>
</div>`;

export const SURAT_KETERANGAN_BEPERGIAN_JALAN_TEMPLATE = `<div style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.5; color: #000;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h3 style="margin: 0; text-decoration: underline; font-weight: bold; font-size: 12pt; letter-spacing: 0.5px;">SURAT KETERANGAN JALAN/BERPERGIAN</h3>
    <p style="margin: 4px 0 0 0; font-size: 11pt;">Nomor : [Format_nomor_suraT]</p>
  </div>

  <p style="text-align: justify; margin: 0 0 16px 0; line-height: 1.5;">
    Yang bertanda tangan dibawah ini, Kami Kepala Desa [NaMa_desa], Kecamatan [NaMa_kecamatan], Kabupaten [NaMa_kabupaten], menerangkan dengan sebenarnya bahwa :
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; line-height: 1.5;" border="0">
    <tbody>
      <tr>
        <td style="width: 28%; vertical-align: top; padding: 3px 0;">Nama</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 3px 0;">:</td>
        <td style="width: 69%; vertical-align: top; padding: 3px 0; font-weight: bold; text-transform: uppercase;">[NAma]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 3px 0;">Jenis Kelamin</td>
        <td style="vertical-align: top; text-align: center; padding: 3px 0;">:</td>
        <td style="vertical-align: top; padding: 3px 0;">[SEx]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 3px 0;">Tempat Tgl Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 3px 0;">:</td>
        <td style="vertical-align: top; padding: 3px 0;">[Tempat_tanggal_lahiR]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 3px 0;">Status Perkawinan</td>
        <td style="vertical-align: top; text-align: center; padding: 3px 0;">:</td>
        <td style="vertical-align: top; padding: 3px 0;">[Status_kawiN]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 3px 0;">Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 3px 0;">:</td>
        <td style="vertical-align: top; padding: 3px 0;">[PeKerjaan]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 3px 0;">Agama</td>
        <td style="vertical-align: top; text-align: center; padding: 3px 0;">:</td>
        <td style="vertical-align: top; padding: 3px 0;">[AgamA]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 3px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 3px 0;">:</td>
        <td style="vertical-align: top; padding: 3px 0;">[Alamat_lengkaP]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 3px 0;">Tanggal Berangkat</td>
        <td style="vertical-align: top; text-align: center; padding: 3px 0;">:</td>
        <td style="vertical-align: top; padding: 3px 0;">[Form_tanggal_berangkat]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 3px 0;">Alamat Yang Dituju</td>
        <td style="vertical-align: top; text-align: center; padding: 3px 0;">:</td>
        <td style="vertical-align: top; padding: 3px 0;">[Form_alamat_tujuan]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 3px 0;">Keperluan</td>
        <td style="vertical-align: top; text-align: center; padding: 3px 0;">:</td>
        <td style="vertical-align: top; padding: 3px 0;">[Form_keperluan]</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: justify; margin: 16px 0 24px 0; line-height: 1.5;">
    Demikian Surat Keterangan ini dibuat dengan sebenarnya dan agar dapat dipergunakan sebagaimana mestinya.
  </p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 24px;" border="0">
    <tbody>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;">[NaMa_desa], [TgL_surat]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;">[Atas_namA]</td>
      </tr>
      <tr style="height: 60px;">
        <td style="width: 50%; text-align: center; height: 60px;">&nbsp;</td>
        <td style="width: 50%; text-align: center; height: 60px; vertical-align: middle;">[qr_bsre]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_pamonG]</u></strong></td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 10pt; color: #333;">[SEbutan_nip_desa] : [nip_pamong]</td>
      </tr>
    </tbody>
  </table>
  <div style="text-align: center;"><br>[qr_code]</div>
</div>`;

export const SURAT_KETERANGAN_JALAN_TEMPLATE = SURAT_KETERANGAN_BEPERGIAN_JALAN_TEMPLATE;

export const SURAT_KUASA_ADMINISTRASI_DESA_TEMPLATE = `<div style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.45; color: #000;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h3 style="margin: 0; font-weight: bold; font-size: 13pt; letter-spacing: 0.5px; text-transform: uppercase;">SURAT KUASA</h3>
  </div>

  <p style="text-align: justify; margin: 0 0 12px 0; line-height: 1.45;">
    Yang bertandatangan dibawah ini :
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; line-height: 1.4;" border="0">
    <tbody>
      <tr>
        <td style="width: 28%; vertical-align: top; padding: 2.5px 0;">Nama</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="width: 69%; vertical-align: top; padding: 2.5px 0; font-weight: bold; text-transform: uppercase;">[Nama_pemberi_kuasa]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Tempat / Tanggal lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Ttl_pemberi_kuasa]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Nik_pemberi_kuasa]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Jabatan</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Jabatan_pemberi_kuasa]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Alamat_pemberi_kuasa]</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: justify; margin: 12px 0 12px 0; line-height: 1.45;">
    Dengan surat ini , Saya sebagai <strong>Pemberi Kuasa</strong> Memberikan kuasa penuh kepada <strong>[Label_jabatan_penerima_kuasa]</strong> ( <strong>Penerima Kuasa</strong> ) Untuk melakukan [Tujuan_kuasa] kepada :
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; line-height: 1.4;" border="0">
    <tbody>
      <tr>
        <td style="width: 28%; vertical-align: top; padding: 2.5px 0;">Nama</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="width: 69%; vertical-align: top; padding: 2.5px 0; font-weight: bold; text-transform: uppercase;">[Nama_penerima_kuasa_1]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Tempat Tanggal Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Ttl_penerima_kuasa_1]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Jabatan</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Jabatan_penerima_kuasa_1]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Alamat_penerima_kuasa_1]</td>
      </tr>
    </tbody>
  </table>

  <!-- BLOK_PENERIMA_2_START -->
  <p style="margin: 6px 0; font-weight: bold;">Dan</p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; line-height: 1.4;" border="0">
    <tbody>
      <tr>
        <td style="width: 28%; vertical-align: top; padding: 2.5px 0;">Nama</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="width: 69%; vertical-align: top; padding: 2.5px 0; font-weight: bold; text-transform: uppercase;">[Nama_penerima_kuasa_2]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Tempat Tanggal Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Ttl_penerima_kuasa_2]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Jabatan</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Jabatan_penerima_kuasa_2]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Alamat_penerima_kuasa_2]</td>
      </tr>
    </tbody>
  </table>
  <!-- BLOK_PENERIMA_2_END -->

  <p style="text-align: justify; margin: 12px 0 24px 0; line-height: 1.45;">
    Demikian surat kuasa ini saya buat dengan kesadaran penuh dan tanpa ada paksaan dari pihak manapun dan semoga dapat dipergunakan sebagaimana mestinya.
  </p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 18px;" border="0">
    <tbody>
      <tr>
        <td style="width: 60%; text-align: center; vertical-align: top; font-size: 11pt;">
          <p style="margin: 0; font-weight: bold;"><u>Penerima Kuasa</u></p>
        </td>
        <td style="width: 40%; text-align: center; vertical-align: top; font-size: 11pt;">
          <p style="margin: 0;">[NaMa_desa], [TgL_surat]</p>
          <p style="margin: 2px 0 0 0; font-weight: bold;"><u>Pemberi Kuasa</u></p>
          <p style="margin: 2px 0 0 0;">[Jabatan_pemberi_kuasa]</p>
        </td>
      </tr>
      <tr>
        <td style="width: 60%; height: 65px; vertical-align: bottom; text-align: center;">
          <table style="width: 100%; border-collapse: collapse;" border="0">
            <tbody>
              <tr>
                <td style="width: 50%; text-align: center; vertical-align: bottom;">
                  <strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_penerima_kuasa_1]</u></strong>
                </td>
                <td style="width: 50%; text-align: center; vertical-align: bottom;">
                  [Ttd_penerima_kuasa_2]
                </td>
              </tr>
            </tbody>
          </table>
        </td>
        <td style="width: 40%; height: 65px; text-align: center; vertical-align: bottom;">
          <strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_pemberi_kuasa]</u></strong>
        </td>
      </tr>
    </tbody>
  </table>
  <div style="text-align: center;"><br>[qr_code]</div>
</div>`;

export const SURAT_KUASA_TEMPLATE = SURAT_KUASA_ADMINISTRASI_DESA_TEMPLATE;

export const SURAT_PENGANTAR_KEHILANGAN_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45; color: #000;">
  <div style="text-align: center; margin-bottom: 16px;">
    <h3 style="margin: 0; text-decoration: underline; font-weight: bold; font-size: 13pt; letter-spacing: 0.5px;">SURAT PENGANTAR KEHILANGAN</h3>
    <p style="margin: 4px 0 0 0; font-size: 11pt; font-weight: bold;">Nomor : [Format_nomor_suraT]</p>
  </div>

  <p style="text-align: justify; margin: 0 0 12px 0; line-height: 1.45;">
    Yang bertanda tangan di bawah ini Kepala Desa [NaMa_desa], Kecamatan [NaMa_kecamatan], Kabupaten [NaMa_kabupaten], menerangkan dengan sebenarnya bahwa:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; line-height: 1.45;" border="0">
    <tbody>
      <tr>
        <td style="width: 28%; vertical-align: top; padding: 2px 0;">Nama Lengkap</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="width: 69%; vertical-align: top; padding: 2px 0;"><strong>[NAma]</strong></td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Nik]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Jenis Kelamin</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Jenis_kelamin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Tempat / Tgl Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Tempat_tanggal_lahiR]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[PeKerjaan]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Alamat_lengkaP]</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: justify; margin: 0 0 10px 0; line-height: 1.45;">
    Nama tersebut di atas adalah benar-benar warga kami yang bertempat tinggal di alamat tersebut. Orang tersebut telah datang melapor kepada kami bahwa telah kehilangan barang / dokumen berharga dengan rincian sebagai berikut:
  </p>

  <div style="border: 1px solid #000; border-radius: 4px; padding: 8px 12px; margin-bottom: 12px; background-color: #fafafa;">
    <table style="width: 100%; border-collapse: collapse; line-height: 1.4;" border="0">
      <tbody>
        <tr>
          <td style="width: 32%; vertical-align: top; padding: 3px 0; font-weight: bold;">Rincian Barang / Dokumen Hilang</td>
          <td style="width: 3%; vertical-align: top; text-align: center; padding: 3px 0;">:</td>
          <td style="width: 65%; vertical-align: top; padding: 3px 0; font-weight: bold; text-align: justify;">[Form_rincian_barang]</td>
        </tr>
        <tr>
          <td style="vertical-align: top; padding: 3px 0;">Perkiraan Waktu Hilang</td>
          <td style="vertical-align: top; text-align: center; padding: 3px 0;">:</td>
          <td style="vertical-align: top; padding: 3px 0;">[Form_waktu_hilang]</td>
        </tr>
        <tr>
          <td style="vertical-align: top; padding: 3px 0;">Perkiraan Tempat Hilang</td>
          <td style="vertical-align: top; text-align: center; padding: 3px 0;">:</td>
          <td style="vertical-align: top; padding: 3px 0;">[Form_tempat_hilang]</td>
        </tr>
        <tr>
          <td style="vertical-align: top; padding: 3px 0;">Keterangan Kejadian</td>
          <td style="vertical-align: top; text-align: center; padding: 3px 0;">:</td>
          <td style="vertical-align: top; padding: 3px 0; text-align: justify;">[Form_keterangan]</td>
        </tr>
      </tbody>
    </table>
  </div>

  <p style="text-align: justify; margin: 0 0 10px 0; line-height: 1.45;">
    Surat pengantar ini dibuat dan diberikan kepada yang bersangkutan untuk keperluan: <strong>[Form_keperluan]</strong>.
  </p>

  <p style="text-align: justify; margin: 0 0 18px 0; line-height: 1.45;">
    Demikian surat pengantar kehilangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya oleh pihak yang berwenang.
  </p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 16px; line-height: 1.3;" border="0">
    <tbody>
      <tr>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">[NaMa_desa], [TgL_surat]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">Pelapor / Pemohon</td>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">[Atas_namA]</td>
      </tr>
      <tr style="height: 55px;">
        <td style="width: 50%; text-align: center; height: 55px; vertical-align: middle;">&nbsp;</td>
        <td style="width: 50%; text-align: center; height: 55px; vertical-align: middle;">[qr_bsre]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[NAma]</u></strong></td>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_pamonG]</u></strong></td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 10pt; color: #333;">[SEbutan_nip_desa] : [nip_pamong]</td>
      </tr>
    </tbody>
  </table>
  <div style="text-align: center;"><br>[qr_code]</div>
</div>`;

export const SURAT_IJIN_KERAMAIAN_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45; color: #000;">
  <div style="text-align: center; margin-bottom: 16px;">
    <h3 style="margin: 0; text-decoration: underline; font-weight: bold; font-size: 13pt; letter-spacing: 0.5px;">SURAT IJIN KERAMAIAN</h3>
    <p style="margin: 4px 0 0 0; font-size: 11pt;">Nomor : [Format_nomor_suraT]</p>
  </div>

  <p style="text-align: justify; margin: 0 0 12px 0; line-height: 1.45;">
    Yang bertanda tangan dibawah ini kepala Desa [NaMa_desa], Kecamatan [NaMa_kecamatan], Kabupaten [NaMa_kabupaten], menerangkan dengan sebenarnya bahwa:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; line-height: 1.45;" border="0">
    <tbody>
      <tr>
        <td style="width: 28%; vertical-align: top; padding: 2px 0;">Nama</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="width: 69%; vertical-align: top; padding: 2px 0;">[NAma]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Nik]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Tempat / Tgl Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Tempat_tanggal_lahiR]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[PeKerjaan]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Alamat_lengkaP]</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: justify; margin: 0 0 10px 0; line-height: 1.45;">
    Orang tersebut di atas adalah benar-benar penduduk Desa [NaMa_desa], Kecamatan [NaMa_kecamatan], Kabupaten [NaMa_kabupaten].
  </p>

  <p style="text-align: justify; margin: 0 0 10px 0; line-height: 1.45;">
    Adapun Surat keterangan ini untuk dipergunakan sebagai persyaratan ijin keramaian pada:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; line-height: 1.45;" border="0">
    <tbody>
      <tr>
        <td style="width: 28%; vertical-align: top; padding: 2px 0;">Tanggal Acara</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="width: 69%; vertical-align: top; padding: 2px 0;">[Form_tanggal_acara]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Sampai dengan Tanggal</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_sampai_tanggal]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Jumlah Undangan</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_jumlah_undangan]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Acara</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_acara]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Hiburan</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_hiburan]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Tempat</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_tempat_acara]</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: justify; margin: 0 0 16px 0; line-height: 1.45;">
    Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.
  </p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 14px; line-height: 1.3;" border="0">
    <tbody>
      <tr>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">[NaMa_desa], [TgL_surat]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">Pemohon</td>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;">[Atas_namA]</td>
      </tr>
      <tr style="height: 52px;">
        <td style="width: 50%; text-align: center; height: 52px; vertical-align: middle;">&nbsp;</td>
        <td style="width: 50%; text-align: center; height: 52px; vertical-align: middle;">[qr_bsre]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[NAma]</u></strong></td>
        <td style="width: 50%; text-align: center; font-size: 11pt; vertical-align: top;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_pamonG]</u></strong></td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 14px; text-align: center;">
    <p style="margin: 0 0 8px 0; font-weight: bold; text-decoration: underline; font-size: 11pt;">MENGETAHUI :</p>
    <table style="border-collapse: collapse; width: 100%; line-height: 1.3;" border="0">
      <tbody>
        <tr>
          <td style="width: 33.33%; text-align: center; vertical-align: top; font-size: 10.5pt;">
            <strong>CAMAT</strong><br />
            <span>[NaMa_kecamatan]</span>
          </td>
          <td style="width: 33.33%; text-align: center; vertical-align: top; font-size: 10.5pt;">
            <strong>DAN RAMIL 10</strong><br />
            <span>[NaMa_kecamatan]</span>
          </td>
          <td style="width: 33.33%; text-align: center; vertical-align: top; font-size: 10.5pt;">
            <strong>KAPOLSEK</strong><br />
            <span>[NaMa_kecamatan]</span>
          </td>
        </tr>
        <tr style="height: 50px;">
          <td style="height: 50px; vertical-align: bottom; text-align: center;">
            <div style="border-bottom: 1.5px solid #000; width: 80%; margin: 0 auto;"></div>
          </td>
          <td style="height: 50px; vertical-align: bottom; text-align: center;">
            <div style="border-bottom: 1.5px solid #000; width: 80%; margin: 0 auto;"></div>
          </td>
          <td style="height: 50px; vertical-align: bottom; text-align: center;">
            <div style="border-bottom: 1.5px solid #000; width: 80%; margin: 0 auto;"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div style="text-align: center;"><br />[qr_code]</div>
</div>`;

export const SURAT_KETERANGAN_USAHA_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45; color: #000;">
  <div style="text-align: center; margin-bottom: 16px;">
    <h3 style="margin: 0; text-decoration: underline; font-weight: bold; font-size: 13pt; letter-spacing: 0.5px;">SURAT KETERANGAN USAHA</h3>
    <p style="margin: 3px 0 0 0; font-size: 10.5pt;">Nomor : [Format_nomor_suraT]</p>
  </div>

  <p style="text-align: justify; margin: 0 0 12px 0; line-height: 1.5;">
    Yang bertanda tangan di bawah ini Kepala Desa [NaMa_desa], Kecamatan [NaMa_kecamatan], Kabupaten [NaMa_kabupaten], menerangkan dengan sebenar-benarnya bahwa :
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; line-height: 1.45;" border="0">
    <tbody>
      <tr>
        <td style="width: 25%; vertical-align: top; padding: 2px 0;">Nama</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="width: 72%; vertical-align: top; padding: 2px 0;"><strong>[NAma]</strong></td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Nik]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Tempat/Tgl Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Tempat_tanggal_lahiR]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Jenis Kelamin</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Jenis_kelamiN]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Alamat_lengkaP]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[PeKerjaan]</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 12px 0 10px 0; line-height: 1.5;">
    Adalah benar yang bersangkutan memiliki usaha dengan keterangan sebagai berikut:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; line-height: 1.45;" border="0">
    <tbody>
      <tr>
        <td style="width: 25%; vertical-align: top; padding: 2px 0;">Nama Usaha</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="width: 72%; vertical-align: top; padding: 2px 0;">[Form_nama_usaha]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Jenis Usaha</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_jenis_usaha]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Alamat Usaha</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_alamat_usaha]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Berdiri Sejak</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_berdiri_sejak]</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 12px 0 10px 0; line-height: 1.5;">
    Surat keterangan ini dibuat untuk keperluan : <strong>[Form_keperluaN]</strong>
  </p>

  <p style="text-align: justify; margin: 10px 0 18px 0; line-height: 1.5;">
    Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.
  </p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 18px;" border="0">
    <tbody>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;">[NaMa_desa], [TgL_surat]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;">[Atas_namA]</td>
      </tr>
      <tr style="height: 60px;">
        <td style="width: 50%; text-align: center; height: 60px;">&nbsp;</td>
        <td style="width: 50%; text-align: center; height: 60px; vertical-align: middle;">[qr_bsre]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_pamonG]</u></strong></td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 10pt; color: #333;">[SEbutan_nip_desa] : [nip_pamong]</td>
      </tr>
    </tbody>
  </table>
  <div style="text-align: center;"><br>[qr_code]</div>
</div>`;

export const SURAT_KETERANGAN_TIDAK_MAMPU_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45; color: #000;">
  <div style="text-align: center; margin-bottom: 16px;">
    <h3 style="margin: 0; text-decoration: underline; font-weight: bold; font-size: 13pt; letter-spacing: 0.5px;">SURAT KETERANGAN TIDAK MAMPU</h3>
    <p style="margin: 3px 0 0 0; font-size: 10.5pt;">Nomor : [Format_nomor_suraT]</p>
  </div>

  <p style="text-align: justify; margin: 0 0 12px 0; line-height: 1.5;">
    Yang bertanda tangan di bawah ini Kepala Desa [NaMa_desa], Kecamatan [NaMa_kecamatan], Kabupaten [NaMa_kabupaten], menerangkan dengan sebenar-benarnya bahwa:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; line-height: 1.45;" border="0">
    <tbody>
      <tr>
        <td style="width: 25%; vertical-align: top; padding: 2px 0;">Nama</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="width: 72%; vertical-align: top; padding: 2px 0;">[NAma_pemohon]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Nik_pemohon]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Tempat/Tgl Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Ttl_pemohon]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Jenis Kelamin</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Jenis_kelamin_pemohon]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Agama</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Agama_pemohon]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Pekerjaan_pemohon]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Alamat_pemohon]</td>
      </tr>
    </tbody>
  </table>

  <!-- BLOK_ANAK_START -->
  <p style="margin: 12px 0 10px 0; line-height: 1.5;">
    Adalah benar orang tua / wali dari:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; line-height: 1.45;" border="0">
    <tbody>
      <tr>
        <td style="width: 25%; vertical-align: top; padding: 2px 0;">Nama</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="width: 72%; vertical-align: top; padding: 2px 0;">[Form_nama_anak]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_nik_anak]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Tempat/Tgl Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_ttl_anak]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Jenis Kelamin</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_jenis_kelamin_anak]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_pekerjaan_anak]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_alamat_anak]</td>
      </tr>
    </tbody>
  </table>
  <!-- BLOK_ANAK_END -->

  <p style="text-align: justify; margin: 12px 0 10px 0; line-height: 1.5;">
    Nama tersebut di atas adalah benar-benar warga kami dan tergolong keluarga yang tidak mampu / keluarga berpenghasilan rendah. Surat keterangan ini dibuat untuk keperluan : <strong>[Form_keperluaN]</strong>.
  </p>

  <p style="text-align: justify; margin: 10px 0 18px 0; line-height: 1.5;">
    Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.
  </p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 20px;" border="0">
    <tbody>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;">[NaMa_desa], [TgL_surat]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;">[Atas_namA]</td>
      </tr>
      <tr style="height: 60px;">
        <td style="width: 50%; text-align: center; height: 60px;">&nbsp;</td>
        <td style="width: 50%; text-align: center; height: 60px; vertical-align: middle;">[qr_bsre]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_pamonG]</u></strong></td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 10pt; color: #333;">[SEbutan_nip_desa] : [nip_pamong]</td>
      </tr>
    </tbody>
  </table>
  <div style="text-align: center;"><br>[qr_code]</div>
</div>`;

export const SURAT_KETERANGAN_DOMISILI_USAHA_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45; color: #000;">
  <div style="text-align: center; margin-bottom: 16px;">
    <h3 style="margin: 0; text-decoration: underline; font-weight: bold; font-size: 13pt; letter-spacing: 0.5px;">SURAT KETERANGAN DOMISILI USAHA</h3>
    <p style="margin: 3px 0 0 0; font-size: 10.5pt;">Nomor : [Format_nomor_suraT]</p>
  </div>

  <p style="text-align: justify; margin: 0 0 12px 0; line-height: 1.5;">
    Yang bertanda tangan di bawah ini Kepala Desa [NaMa_desa], Kecamatan [NaMa_kecamatan], Kabupaten [NaMa_kabupaten], dengan ini menerangkan bahwa:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; line-height: 1.45;" border="0">
    <tbody>
      <tr>
        <td style="width: 30%; vertical-align: top; padding: 2px 0;">Nama Lengkap</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="width: 67%; vertical-align: top; padding: 2px 0;"><strong>[NAma]</strong></td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">NIK / No. KTP</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Nik]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Tempat/Tanggal Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Tempat_tanggal_lahiR]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[PeKerjaan]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Alamat KTP</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Alamat_lengkaP]</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 14px 0 12px 0; line-height: 1.5;">
    Adalah benar memiliki usaha yang berdomisili di wilayah Desa [NaMa_desa] dengan data usaha sebagai berikut:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; line-height: 1.45;" border="0">
    <tbody>
      <tr>
        <td style="width: 30%; vertical-align: top; padding: 2px 0;">Nama Usaha / Perusahaan</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="width: 67%; vertical-align: top; padding: 2px 0;"><strong>[Form_nama_usaha]</strong></td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Jenis / Bidang Usaha</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_jenis_usaha]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Alamat Usaha</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_alamat_usaha]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Status Bangunan Tempat Usaha</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_status_bangunan]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Penanggung Jawab</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_penanggung_jawab]</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: justify; margin: 14px 0 20px 0; line-height: 1.5;">
    Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
  </p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 20px;" border="0">
    <tbody>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;">[NaMa_desa], [TgL_surat]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;">[Atas_namA]</td>
      </tr>
      <tr style="height: 60px;">
        <td style="width: 50%; text-align: center; height: 60px;">&nbsp;</td>
        <td style="width: 50%; text-align: center; height: 60px; vertical-align: middle;">[qr_bsre]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_pamonG]</u></strong></td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 10pt; color: #333;">[SEbutan_nip_desa] : [nip_pamong]</td>
      </tr>
    </tbody>
  </table>
  <div style="text-align: center;"><br>[qr_code]</div>
</div>`;

export const SURAT_KETERANGAN_PENGHASILAN_ORANG_TUA_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45; color: #000;">
  <!-- LEMBAR 1 -->
  <div style="text-align: center; margin-bottom: 16px;">
    <h3 style="margin: 0; text-decoration: underline; font-weight: bold; font-size: 13pt; letter-spacing: 0.5px;">SURAT KETERANGAN PENGHASILAN ORANG TUA</h3>
    <p style="margin: 4px 0 0 0; font-size: 10.5pt;">Nomor : [Format_nomor_suraT]</p>
  </div>

  <p style="text-align: justify; margin: 0 0 10px 0; line-height: 1.5;">
    Yang bertanda tangan di bawah ini Kepala Desa [NaMa_desa], Kecamatan [NaMa_kecamatan], Kabupaten [NaMa_kabupaten], menerangkan dengan sebenarnya bahwa:
  </p>

  <p style="margin: 6px 0 4px 0; font-weight: bold; font-size: 10.5pt; text-decoration: underline;">
    I. Identitas Siswa / Mahasiswa (Anak):
  </p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; line-height: 1.45;" border="0">
    <tbody>
      <tr>
        <td style="width: 32%; vertical-align: top; padding: 2px 0;">1. Nama Lengkap</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="width: 65%; vertical-align: top; padding: 2px 0;"><strong>[NAma_anak]</strong></td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">2. NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Nik_anak]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">3. Tempat / Tanggal Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Ttl_anak]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">4. Jenis Kelamin</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Jenis_kelamin_anak]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">5. Agama</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Agama_anak]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">6. Sekolah / Perguruan Tinggi</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;"><strong>[Form_sekolahperguruan_tinggI]</strong></td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">7. NISN / NIM</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_nomor_induk_siswamahasiswA]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">8. Jurusan / Fakultas / Prodi</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_jurusanfakultasprodI]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">9. Kelas / Semester</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Form_kelassemesteR]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">10. Alamat Tempat Tinggal</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Alamat_anak]</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: justify; margin: 10px 0 8px 0; line-height: 1.5;">
    Nama tersebut di atas adalah benar-benar warga penduduk Desa [NaMa_desa], Kecamatan [NaMa_kecamatan], Kabupaten [NaMa_kabupaten], dan merupakan <strong>anak kandung / tanggungan</strong> dari orang tua:
  </p>

  <!-- DATA AYAH -->
  <p style="margin: 6px 0 4px 0; font-weight: bold; font-size: 10.5pt; text-decoration: underline;">
    II. Data Ayah:
  </p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; line-height: 1.45;" border="0">
    <tbody>
      <tr>
        <td style="width: 32%; vertical-align: top; padding: 2px 0;">1. Nama Lengkap Ayah</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="width: 65%; vertical-align: top; padding: 2px 0;"><strong>[Nama_ayaH]</strong></td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">2. NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Nik_ayaH]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">3. Tempat / Tanggal Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Ttl_ayaH]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">4. Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Pekerjaan_ayaH]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">5. Alamat Tempat Tinggal</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Alamat_ayaH]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">6. Penghasilan / Bulan</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;"><strong>[Form_penghasilan_ayaH]</strong> <em>([Terbilang_penghasilan_ayah])</em></td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 24px; text-align: right; font-size: 9pt; color: #666; font-style: italic;">
    * Bersambung ke Lembar 2
  </div>
</div>

<!-- pagebreak -->

<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45; color: #000; padding-top: 24px;">
  <!-- LEMBAR 2 (TANPA KOP DAN TANPA REDAKSI LEMBAR LANJUTAN) -->
  <!-- DATA IBU -->
  <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 10.5pt; text-decoration: underline;">
    III. Data Ibu:
  </p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; line-height: 1.45;" border="0">
    <tbody>
      <tr>
        <td style="width: 32%; vertical-align: top; padding: 2px 0;">1. Nama Lengkap Ibu</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="width: 65%; vertical-align: top; padding: 2px 0;"><strong>[Nama_ibU]</strong></td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">2. NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Nik_ibU]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">3. Tempat / Tanggal Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Ttl_ibU]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">4. Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Pekerjaan_ibU]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">5. Alamat Tempat Tinggal</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">[Alamat_ibU]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">6. Penghasilan / Bulan</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;"><strong>[Form_penghasilan_ibU]</strong> <em>([Terbilang_penghasilan_ibu])</em></td>
      </tr>
    </tbody>
  </table>

  <!-- TOTAL PENGHASILAN & TANGGUNGAN -->
  <p style="margin: 12px 0 6px 0; font-weight: bold; font-size: 10.5pt; text-decoration: underline;">
    IV. Rangkuman Penghasilan Gabungan & Tanggungan:
  </p>
  <div style="margin: 6px 0 14px 0; padding: 10px 14px; border: 1px solid #999; background-color: #fafafa; border-radius: 4px;">
    <table style="width: 100%; border-collapse: collapse; line-height: 1.5;" border="0">
      <tbody>
        <tr>
          <td style="width: 36%; vertical-align: top; padding: 2.5px 0;">Total Penghasilan Gabungan</td>
          <td style="width: 3%; vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
          <td style="width: 61%; vertical-align: top; padding: 2.5px 0;"><strong>[Total_penghasilan_orang_tua]</strong></td>
        </tr>
        <tr>
          <td style="vertical-align: top; padding: 2.5px 0;">Terbilang</td>
          <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
          <td style="vertical-align: top; padding: 2.5px 0; font-style: italic;"><strong>([Terbilang_total_penghasilan])</strong></td>
        </tr>
        <tr>
          <td style="vertical-align: top; padding: 2.5px 0;">Jumlah Tanggungan Keluarga</td>
          <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
          <td style="vertical-align: top; padding: 2.5px 0;"><strong>[Form_jumlah_tanggungan] Orang</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <p style="text-align: justify; margin: 10px 0 8px 0; line-height: 1.5;">
    Surat keterangan ini dibuat dan diberikan untuk keperluan : <strong>[Form_keperluaN]</strong>.
  </p>

  <p style="text-align: justify; margin: 8px 0 16px 0; line-height: 1.5;">
    Demikian Surat Keterangan Penghasilan Orang Tua ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
  </p>

  <!-- TANDA TANGAN (KIRI ORANG TUA / WALI DENGAN JARAK PAS, KANAN KEPALA DESA) -->
  <table style="border-collapse: collapse; width: 100%; margin-top: 28px;" border="0">
    <tbody>
      <tr>
        <td style="width: 48%; text-align: center; vertical-align: top; font-size: 11pt;">
          Mengetahui / Yang Menyatakan,<br>
          Orang Tua / Wali
        </td>
        <td style="width: 4%;"></td>
        <td style="width: 48%; text-align: center; vertical-align: top; font-size: 11pt;">
          [NaMa_desa], [TgL_surat]<br>
          [Atas_namA]
        </td>
      </tr>
      <tr style="height: 75px;">
        <td style="height: 75px; vertical-align: bottom;">&nbsp;</td>
        <td></td>
        <td style="text-align: center; height: 75px; vertical-align: middle;">
          [qr_bsre]
        </td>
      </tr>
      <tr>
        <td style="text-align: center; font-size: 11pt; vertical-align: top;">
          ( <strong>[Nama_ayaH]</strong> )
        </td>
        <td></td>
        <td style="text-align: center; font-size: 11pt; vertical-align: top;">
          <strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_pamonG]</u></strong>
        </td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td style="text-align: center; font-size: 10pt; color: #333;">
          [SEbutan_nip_desa] : [nip_pamong]
        </td>
      </tr>
    </tbody>
  </table>
  <div style="text-align: center;"><br>[qr_code]</div>
</div>`;

export const SURAT_KETERANGAN_REAKTIVASI_BPJS_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.5; color: #000;">
  <div style="text-align: center; margin-bottom: 16px;">
    <h3 style="margin: 0; text-decoration: underline; font-weight: bold; font-size: 13pt; letter-spacing: 0.5px;">SURAT KETERANGAN REAKTIVASI BPJS KESEHATAN</h3>
    <p style="margin: 4px 0 0 0; font-size: 11pt;">Nomor : [Format_nomor_suraT]</p>
  </div>

  <p style="text-align: justify; margin: 0 0 12px 0; line-height: 1.5;">
    Yang bertanda tangan di bawah ini Kepala Desa [NaMa_desa], Kecamatan [NaMa_kecamatan], Kabupaten [NaMa_kabupaten], menerangkan dengan sebenarnya bahwa:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; line-height: 1.5;" border="0">
    <tbody>
      <tr>
        <td style="width: 28%; vertical-align: top; padding: 2.5px 0;">Rekam Medis</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="width: 69%; vertical-align: top; padding: 2.5px 0;">[Form_rekam_medis]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Jenis Penyakit</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Form_jenis_penyakit]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">No. BPJS</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Form_no_bpjs]</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 14px 0 6px 0; font-weight: bold; font-size: 11pt;">
    Menerangkan bahwa:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; line-height: 1.5;" border="0">
    <tbody>
      <tr>
        <td style="width: 28%; vertical-align: top; padding: 2.5px 0;">Nama</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="width: 69%; vertical-align: top; padding: 2.5px 0;">[NAma]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Nik]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Tempat/Tanggal Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Tempat_tanggal_lahiR]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[PeKerjaan]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Alamat_lengkaP]</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: justify; margin: 12px 0 10px 0; line-height: 1.5;">
    Adalah benar bahwa yang bersangkutan saat ini sedang sakit <strong>[Form_jenis_penyakit]</strong> dan membutuhkan pelayanan serta keberlanjutan pengobatan secara medis.
  </p>

  <p style="text-align: justify; margin: 10px 0 12px 0; line-height: 1.5;">
    Surat ini dipergunakan untuk keperluan <strong>Reaktivasi BPJS Kesehatan</strong> dengan Nomor: <strong>[Form_no_bpjs]</strong>, bahwa yang bersangkutan benar memerlukan jaminan pelayanan kesehatan sesuai dengan ketentuan yang berlaku.
  </p>

  <p style="text-align: justify; margin: 12px 0 24px 0; line-height: 1.5;">
    Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
  </p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 24px;" border="0">
    <tbody>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;">[NaMa_desa], [TgL_surat]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;">[Atas_namA]</td>
      </tr>
      <tr style="height: 60px;">
        <td style="width: 50%; text-align: center; height: 60px;">&nbsp;</td>
        <td style="width: 50%; text-align: center; height: 60px; vertical-align: middle;">[qr_bsre]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_pamonG]</u></strong></td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 10pt; color: #333;">[SEbutan_nip_desa] : [nip_pamong]</td>
      </tr>
    </tbody>
  </table>
  <div style="text-align: center;"><br>[qr_code]</div>
</div>`;

export const SURAT_KETERANGAN_PEMAKAMAN_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.5; color: #000;">
  <div style="text-align: center; margin-bottom: 16px;">
    <h3 style="margin: 0; text-decoration: underline; font-weight: bold; font-size: 13pt; letter-spacing: 0.5px;">SURAT KETERANGAN PEMAKAMAN</h3>
    <p style="margin: 4px 0 0 0; font-size: 11pt; font-weight: bold;">NOMOR : [Format_nomor_suraT]</p>
  </div>

  <p style="text-align: justify; margin: 0 0 12px 0; line-height: 1.5;">
    Yang bertanda tangan di bawah ini Kepala Desa [NaMa_desa], menerangkan bahwa :
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; line-height: 1.5;" border="0">
    <tbody>
      <tr>
        <td style="width: 28%; vertical-align: top; padding: 2.5px 0;">Nama</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="width: 69%; vertical-align: top; padding: 2.5px 0;">[NAma]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Tempat Tanggal Lahir</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Tempat_tanggal_lahiR]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Jenis Kelamin</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Jenis_kelamin]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Alamat</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Alamat_lengkaP]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Agama</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[AgAma]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Pekerjaan</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[PeKerjaan]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Nomor KK</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[No_kk]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Nomor NIK</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Nik]</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 16px 0 10px 0; font-weight: bold; line-height: 1.5;">
    Bahwa orang tersebut di atas adalah benar telah Meninggal Dunia :
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; line-height: 1.5;" border="0">
    <tbody>
      <tr>
        <td style="width: 28%; vertical-align: top; padding: 2.5px 0;">Hari &amp; Tanggal</td>
        <td style="width: 3%; vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="width: 69%; vertical-align: top; padding: 2.5px 0;">[Hari_dan_tanggal_kematian]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Waktu Meninggal</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Jam_kematian]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Dimakamkan pada</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Hari_dan_tanggal_pemakaman]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Waktu Pemakaman</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Jam_pemakaman]</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2.5px 0;">Tempat</td>
        <td style="vertical-align: top; text-align: center; padding: 2.5px 0;">:</td>
        <td style="vertical-align: top; padding: 2.5px 0;">[Tempat_pemakaman]</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: justify; margin: 16px 0 24px 0; line-height: 1.5;">
    Demikian Surat Keterangan ini diterbitkan agar digunakan sebagaimana mestinya.
  </p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 24px;" border="0">
    <tbody>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;">[NaMa_desa], [TgL_surat]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;">[Atas_namA]</td>
      </tr>
      <tr style="height: 60px;">
        <td style="width: 50%; text-align: center; height: 60px;">&nbsp;</td>
        <td style="width: 50%; text-align: center; height: 60px; vertical-align: middle;">[qr_bsre]</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 11pt;"><strong style="text-decoration: underline; text-transform: uppercase;"><u>[Nama_pamonG]</u></strong></td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">&nbsp;</td>
        <td style="width: 50%; text-align: center; font-size: 10pt; color: #333;">[SEbutan_nip_desa] : [nip_pamong]</td>
      </tr>
    </tbody>
  </table>
  <div style="text-align: center;"><br>[qr_code]</div>
</div>`;

export const SURAT_PENGANTAR_NIKAH_TEMPLATE = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 1.25; color: #000;">
<p style="text-align: center; margin-bottom: 2px;"><strong><span style="font-size: 11.5pt; text-decoration: underline;">SURAT KETERANGAN UNTUK NIKAH</span></strong></p>
<p style="text-align: center; margin-top: 0; margin-bottom: 6px;">Nomor : [Format_nomor_suraT]</p>

<p style="text-align: justify; text-indent: 24px; margin-bottom: 4px;">Yang bertanda tangan di bawah ini Kepala Desa [Nama_desA], Kecamatan [Nama_kecamataN], [Sebutan_kabupateN] [Nama_kabupateN], menerangkan dengan sesungguhnya bahwa :</p>

<table style="border-collapse: collapse; width: 100%; margin-left: 10px; margin-bottom: 4px;" border="0">
<tbody>
<tr><td style="width: 34%; padding: 0.5px 0;">1. Nama Lengkap</td><td style="width: 2%;">:</td><td style="width: 64%; font-weight: bold;">[NAma]</td></tr>
<tr><td style="padding: 0.5px 0;">2. Nomor Induk Kependudukan (NIK)</td><td>:</td><td>[Nik]</td></tr>
<tr><td style="padding: 0.5px 0;">3. Jenis Kelamin</td><td>:</td><td>[Jenis_kelamiN]</td></tr>
<tr><td style="padding: 0.5px 0;">4. Tempat dan Tanggal Lahir</td><td>:</td><td>[Tempat_tanggal_lahiR]</td></tr>
<tr><td style="padding: 0.5px 0;">5. Kewarganegaraan</td><td>:</td><td>[Warga_negarA]</td></tr>
<tr><td style="padding: 0.5px 0;">6. Agama</td><td>:</td><td>[Agama]</td></tr>
<tr><td style="padding: 0.5px 0;">7. Pekerjaan &amp; Pendidikan Terakhir</td><td>:</td><td>[Pekerjaan] - [Pendidikan_kK]</td></tr>
<tr><td style="padding: 0.5px 0; vertical-align: top;">8. Alamat Tempat Tinggal</td><td style="vertical-align: top;">:</td><td>[Alamat]</td></tr>
<tr><td style="padding: 0.5px 0;">9. Status Perkawinan</td><td>:</td><td><strong>[Form_status_kawin]</strong></td></tr>
</tbody>
</table>

<p style="margin: 3px 0 2px 0; font-weight: bold;">Adalah benar anak dari perkawinan seorang pria :</p>
<table style="border-collapse: collapse; width: 100%; margin-left: 10px; margin-bottom: 4px;" border="0">
<tbody>
<tr><td style="width: 34%; padding: 0.5px 0;">1. Nama Lengkap dan Alias</td><td style="width: 2%;">:</td><td style="width: 64%; font-weight: bold;">[Form_nama_ayah]</td></tr>
<tr><td style="padding: 0.5px 0;">2. Nomor Induk Kependudukan (NIK)</td><td>:</td><td>[Form_nik_ayah]</td></tr>
<tr><td style="padding: 0.5px 0;">3. Tempat dan Tanggal Lahir</td><td>:</td><td>[Form_ttl_ayah]</td></tr>
<tr><td style="padding: 0.5px 0;">4. Kewarganegaraan / Agama</td><td>:</td><td>WNI / [Form_agama_ayah]</td></tr>
<tr><td style="padding: 0.5px 0;">5. Pekerjaan</td><td>:</td><td>[Form_pekerjaan_ayah]</td></tr>
<tr><td style="padding: 0.5px 0; vertical-align: top;">6. Alamat</td><td style="vertical-align: top;">:</td><td>[Form_alamat_ayah]</td></tr>
</tbody>
</table>

<p style="margin: 3px 0 2px 0; font-weight: bold;">dengan seorang wanita :</p>
<table style="border-collapse: collapse; width: 100%; margin-left: 10px; margin-bottom: 4px;" border="0">
<tbody>
<tr><td style="width: 34%; padding: 0.5px 0;">1. Nama Lengkap dan Alias</td><td style="width: 2%;">:</td><td style="width: 64%; font-weight: bold;">[Form_nama_ibu]</td></tr>
<tr><td style="padding: 0.5px 0;">2. Nomor Induk Kependudukan (NIK)</td><td>:</td><td>[Form_nik_ibu]</td></tr>
<tr><td style="padding: 0.5px 0;">3. Tempat dan Tanggal Lahir</td><td>:</td><td>[Form_ttl_ibu]</td></tr>
<tr><td style="padding: 0.5px 0;">4. Kewarganegaraan / Agama</td><td>:</td><td>WNI / [Form_agama_ibu]</td></tr>
<tr><td style="padding: 0.5px 0;">5. Pekerjaan</td><td>:</td><td>[Form_pekerjaan_ibu]</td></tr>
<tr><td style="padding: 0.5px 0; vertical-align: top;">6. Alamat</td><td style="vertical-align: top;">:</td><td>[Form_alamat_ibu]</td></tr>
</tbody>
</table>

<p style="margin: 3px 0 2px 0; font-weight: bold;">Adapun yang bersangkutan bermaksud akan melangsungkan pernikahan dengan :</p>
<table style="border-collapse: collapse; width: 100%; margin-left: 10px; margin-bottom: 5px;" border="0">
<tbody>
<tr><td style="width: 34%; padding: 0.5px 0;">1. Nama Lengkap Calon Pasangan</td><td style="width: 2%;">:</td><td style="width: 64%;"><strong>[Form_nama_calon_pasangan]</strong> ([Form_label_bin_pasangan]: <strong>[Form_bin_calon_pasangan]</strong>)</td></tr>
<tr><td style="padding: 0.5px 0;">2. Nomor Induk Kependudukan (NIK)</td><td>:</td><td>[Form_nik_calon_pasangan]</td></tr>
<tr><td style="padding: 0.5px 0;">3. Tempat dan Tanggal Lahir</td><td>:</td><td>[Form_ttl_pasangan]</td></tr>
<tr><td style="padding: 0.5px 0;">4. Kewarganegaraan / Agama</td><td>:</td><td>[Form_warga_negara_pasangan] / [Form_agama_pasangan]</td></tr>
<tr><td style="padding: 0.5px 0;">5. Pekerjaan</td><td>:</td><td>[Form_pekerjaan_pasangan]</td></tr>
<tr><td style="padding: 0.5px 0;">6. Status Perkawinan</td><td>:</td><td>[Form_status_pasangan]</td></tr>
<tr><td style="padding: 0.5px 0; vertical-align: top;">7. Alamat Tempat Tinggal</td><td style="vertical-align: top;">:</td><td>[Form_alamat_pasangan]</td></tr>
<tr><td style="padding: 0.5px 0;">8. Tempat / KUA Tujuan Nikah</td><td>:</td><td><strong>[Form_kua_tujuan]</strong></td></tr>
</tbody>
</table>

<p style="text-align: justify; text-indent: 24px; margin-bottom: 6px;">Demikian surat pengantar nikah ini dibuat dengan mengingat sumpah jabatan dan untuk dipergunakan sebagaimana mestinya.</p>

<table style="border-collapse: collapse; width: 100%; margin-top: 4px;" border="0">
<tbody>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Nama_desA], [Tanggal_suraT]</td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Atas_namA]</td>
</tr>
<tr style="height: 38px;">
<td style="width: 50%; text-align: center; height: 38px;">&nbsp;</td>
<td style="width: 50%; text-align: center; height: 38px; vertical-align: middle;">[qr_bsre]</td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;"><strong><u>[Nama_pamonG]</u></strong></td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Sebutan_nip_desA] : [Nip_pamoNG]</td>
</tr>
</tbody>
</table>
</div>`;


export function findOpenSidRawTemplate(
  urlSurat?: string,
  kodeSurat?: string,
  namaOrJenis?: string,
): OpenSidRawTemplateItem | undefined {
  if (urlSurat && templateByUrlMap.has(urlSurat)) {
    return templateByUrlMap.get(urlSurat);
  }
  if (kodeSurat && templateByKodeMap.has(kodeSurat)) {
    return templateByKodeMap.get(kodeSurat);
  }
  if (namaOrJenis) {
    const q = namaOrJenis.trim().toLowerCase();
    const cleanQ = q.replace(/^surat\s+/i, '').trim();
    if (q.includes('kematian') || cleanQ.includes('kematian')) {
      const deathTpl = OPENSID_RAW_TEMPLATES.find((tpl) => (tpl.nama || '').toLowerCase().includes('kematian'));
      if (deathTpl) return deathTpl;
    }
    const byName = OPENSID_RAW_TEMPLATES.find((tpl) => {
      const tn = (tpl.nama || '').trim().toLowerCase();
      const cleanTn = tn.replace(/^surat\s+/i, '').trim();
      return tn === q || tn === cleanQ || cleanTn === q || cleanTn === cleanQ;
    });
    if (byName) return byName;
    const partial = OPENSID_RAW_TEMPLATES.find((tpl) => {
      const tn = (tpl.nama || '').trim().toLowerCase();
      return tn.includes(cleanQ) || cleanQ.includes(tn);
    });
    if (partial) return partial;
  }
  return undefined;
}

/**
 * Menggabungkan item PermohonanSuratItem dengan skema lengkap OpenSID (template, form_isian, kode_isian, margin, dll.)
 */
export function enrichPermohonanSuratWithOpenSid(item: PermohonanSuratItem): PermohonanSuratItem {
  const isKematian =
    (item.jenisSurat || '').toLowerCase().includes('kematian') ||
    (item.urlSurat || '').toLowerCase().includes('kematian');
  const isDomisili =
    ((item.jenisSurat || '').toLowerCase().includes('domisili') ||
      (item.urlSurat || '').toLowerCase().includes('domisili')) &&
    !((item.jenisSurat || '').toLowerCase().includes('usaha') || (item.urlSurat || '').toLowerCase().includes('usaha'));
  const isPerubahanKk =
    (item.jenisSurat || '').toLowerCase().includes('perubahan kartu keluarga') ||
    (item.jenisSurat || '').toLowerCase().includes('perubahan kk') ||
    (item.urlSurat || '').toLowerCase().includes('perubahan-kartu-keluarga');
  const isBelumAkta =
    (item.jenisSurat || '').toLowerCase().includes('belum memiliki akta') ||
    (item.jenisSurat || '').toLowerCase().includes('sptjm') ||
    (item.urlSurat || '').toLowerCase().includes('belum-memiliki-akta');
  const isDuplikatAktaLahir =
    (item.jenisSurat || '').toLowerCase().includes('duplikat akta kelahiran') ||
    (item.jenisSurat || '').toLowerCase().includes('duplikat kelahiran') ||
    (item.urlSurat || '').toLowerCase().includes('duplikat-kelahiran') ||
    (item.kodeSurat || '').toLowerCase() === 's-20';
  const isLahirMati =
    (item.jenisSurat || '').toLowerCase().includes('lahir mati') ||
    (item.urlSurat || '').toLowerCase().includes('lahir-mati') ||
    (item.kodeSurat || '').toLowerCase() === 's-22';
  const isBedaNama =
    (item.jenisSurat || '').toLowerCase().includes('beda nama') ||
    (item.jenisSurat || '').toLowerCase().includes('beda identitas') ||
    (item.urlSurat || '').toLowerCase().includes('beda-identitas') ||
    (item.urlSurat || '').toLowerCase().includes('beda-nama') ||
    (item.kodeSurat || '').toLowerCase() === '471.1';
  const isMoyang =
    (item.jenisSurat || '').toLowerCase().includes('moyang') ||
    (item.urlSurat || '').toLowerCase().includes('moyang');
  const isBelumMenikah =
    (item.jenisSurat || '').toLowerCase().includes('belum pernah menikah') ||
    (item.jenisSurat || '').toLowerCase().includes('belum menikah') ||
    (item.jenisSurat || '').toLowerCase().includes('belum kawin') ||
    (item.urlSurat || '').toLowerCase().includes('belum-menikah') ||
    (item.kodeSurat || '').toLowerCase() === 's-18' ||
    (item.kodeSurat || '').toLowerCase() === '470';
  const isNikahNonMuslim =
    item.id === 'prm-32' ||
    (item.urlSurat || '').toLowerCase().includes('nikah-warga-non-muslim') ||
    (item.urlSurat || '').toLowerCase().includes('nikah-non-muslim') ||
    (item.kodeSurat || '').toLowerCase() === 's-50' ||
    (item.jenisSurat || '').toLowerCase().includes('non-muslim') ||
    (item.jenisSurat || '').toLowerCase().includes('non muslim');
  const isSuratNikah =
    !isNikahNonMuslim &&
    (item.id === 'prm-40' ||
      (item.urlSurat || '').toLowerCase() === 'sistem-surat-keterangan-nikah' ||
      (item.urlSurat || '').toLowerCase().includes('pergi-kawin') ||
      (item.kodeSurat || '').toLowerCase() === 's-23' ||
      (item.kodeSurat || '').toLowerCase() === 's-30' ||
      (item.jenisSurat || '').toLowerCase().includes('pengantar nikah') ||
      (item.jenisSurat || '').toLowerCase().includes('pergi kawin') ||
      (item.jenisSurat || '').toLowerCase().includes('numpang nikah') ||
      (item.jenisSurat || '').toLowerCase().trim() === 'surat keterangan nikah');
  const isWaliHakim =
    item.id === 'prm-14' ||
    (item.urlSurat || '').toLowerCase().includes('wali-hakim') ||
    (item.kodeSurat || '').toLowerCase() === 's-32' ||
    (item.jenisSurat || '').toLowerCase().includes('wali hakim');
  const isDuplikatNikah =
    item.id === 'prm-24' ||
    (item.urlSurat || '').toLowerCase().includes('duplikat-surat-nikah') ||
    (item.urlSurat || '').toLowerCase().includes('duplikat-nikah') ||
    (item.kodeSurat || '').toLowerCase() === 's-33' ||
    (item.jenisSurat || '').toLowerCase().includes('duplikat surat nikah') ||
    (item.jenisSurat || '').toLowerCase().includes('duplikat buku nikah');
  const isCeraiRujuk =
    item.id === 'prm-28' ||
    item.id === 'prm-16' ||
    (item.urlSurat || '').toLowerCase().includes('cerai') ||
    (item.urlSurat || '').toLowerCase().includes('rujuk') ||
    (item.kodeSurat || '').toLowerCase() === 's-35' ||
    (item.kodeSurat || '').toLowerCase() === 's-34' ||
    (item.jenisSurat || '').toLowerCase().includes('cerai') ||
    (item.jenisSurat || '').toLowerCase().includes('rujuk');
  const isSporadik =
    item.id === 'prm-37' ||
    (item.urlSurat || '').toLowerCase().includes('sporadik') ||
    (item.kodeSurat || '').toLowerCase() === 's-40' ||
    (item.jenisSurat || '').toLowerCase().includes('sporadik') ||
    (item.jenisSurat || '').toLowerCase().includes('penguasaan fisik bidang tanah');
  const isKepemilikanTanah =
    item.id === 'prm-25' ||
    (item.urlSurat || '').toLowerCase().includes('kepemilikan-tanah') ||
    (item.kodeSurat || '').toLowerCase() === 's-49' ||
    (item.jenisSurat || '').toLowerCase().includes('kepemilikan tanah');
  const isJualBeli =
    item.id === 'prm-10' ||
    (item.urlSurat || '').toLowerCase().includes('jual-beli') ||
    (item.kodeSurat || '').toLowerCase() === 's-05' ||
    (item.jenisSurat || '').toLowerCase().includes('jual beli');
  const isDomisiliUsaha =
    item.id === 'prm-08' ||
    (item.urlSurat || '').toLowerCase().includes('domisili-usaha') ||
    (item.kodeSurat || '').toLowerCase() === 's-16' ||
    (item.jenisSurat || '').toLowerCase().includes('domisili usaha');
  const isKeramaian =
    item.id === 'prm-05' ||
    (item.urlSurat || '').toLowerCase().includes('keramaian') ||
    (item.jenisSurat || '').toLowerCase().includes('keramaian') ||
    (item.kodeSurat || '').toLowerCase() === 's-12' ||
    (item.kodeSurat || '').toLowerCase() === '100.3.12';
  const isPemakaman =
    item.id === 'prm-44' ||
    (item.urlSurat || '').toLowerCase().includes('pemakaman') ||
    (item.kodeSurat || '').toLowerCase() === '474.3' ||
    (item.jenisSurat || '').toLowerCase().includes('pemakaman');
  const isKehilangan =
    item.id === 'prm-02' ||
    (item.urlSurat || '').toLowerCase().includes('kehilangan') ||
    (item.jenisSurat || '').toLowerCase().includes('kehilangan') ||
    (item.kodeSurat || '').toLowerCase() === 's-13';
  const isSkck =
    item.id === 'prm-15' ||
    (item.urlSurat || '').toLowerCase().includes('catatan-kepolisian') ||
    (item.urlSurat || '').toLowerCase().includes('skck') ||
    (item.jenisSurat || '').toLowerCase().includes('skck') ||
    (item.jenisSurat || '').toLowerCase().includes('catatan kepolisian') ||
    (item.kodeSurat || '').toLowerCase() === 's-07';
  const isIzinKeluarga =
    item.id === 'prm-31' ||
    (item.urlSurat || '').toLowerCase().includes('izin-orang-tua') ||
    (item.urlSurat || '').toLowerCase().includes('izin-keluarga') ||
    (item.jenisSurat || '').toLowerCase().includes('izin orang tua') ||
    (item.jenisSurat || '').toLowerCase().includes('izin keluarga') ||
    (item.kodeSurat || '').toLowerCase() === 's-39' ||
    (item.kodeSurat || '').toLowerCase() === '140';
  const isSuratJalan =
    item.id === 'prm-42' ||
    (item.urlSurat || '').toLowerCase().includes('bepergian') ||
    (item.urlSurat || '').toLowerCase().includes('jalan') ||
    (item.jenisSurat || '').toLowerCase().includes('bepergian') ||
    (item.jenisSurat || '').toLowerCase().includes('surat jalan') ||
    (item.jenisSurat || '').toLowerCase().includes('keterangan jalan') ||
    (item.kodeSurat || '').toLowerCase() === 's-10' ||
    (item.kodeSurat || '').toLowerCase() === '470';
  const isSuratKuasa =
    item.id === 'prm-30' ||
    (item.urlSurat || '').toLowerCase().includes('surat-kuasa') ||
    (item.jenisSurat || '').toLowerCase().includes('surat kuasa') ||
    (item.kodeSurat || '').toLowerCase() === 's-47';
  const isKeteranganUmum =
    !isSkck &&
    !isKehilangan &&
    !isKeramaian &&
    !isPemakaman &&
    !isIzinKeluarga &&
    !isSuratJalan &&
    !isSuratKuasa &&
    (item.id === 'prm-03' ||
      (item.urlSurat || '').toLowerCase().includes('keterangan-pengantar') ||
      (item.urlSurat || '').toLowerCase().includes('pengantar-umum') ||
      (item.urlSurat || '').toLowerCase().includes('keterangan-umum') ||
      (item.jenisSurat || '').toLowerCase().includes('pengantar umum') ||
      (item.jenisSurat || '').toLowerCase().includes('keterangan umum') ||
      (item.jenisSurat || '').toLowerCase().trim() === 'surat pengantar' ||
      (item.jenisSurat || '').toLowerCase().trim() === 'surat keterangan' ||
      (item.kodeSurat || '').toLowerCase() === 's-01' ||
      ((item.kodeSurat || '').toLowerCase() === '400.7.22.1' &&
        !(item.jenisSurat || '').toLowerCase().includes('skck') &&
        !(item.jenisSurat || '').toLowerCase().includes('kehilangan') &&
        !(item.jenisSurat || '').toLowerCase().includes('keramaian') &&
        !(item.jenisSurat || '').toLowerCase().includes('kepolisian')));
  const isUsaha =
    !isDomisiliUsaha &&
    !isKeteranganUmum &&
    (item.id === 'prm-01' ||
      (item.urlSurat || '').toLowerCase().includes('keterangan-usaha') ||
      (item.kodeSurat || '').toLowerCase() === '500' ||
      (item.jenisSurat || '').toLowerCase() === 'surat keterangan usaha' ||
      ((item.jenisSurat || '').toLowerCase().includes('keterangan usaha') && !(item.jenisSurat || '').toLowerCase().includes('umum')));
  const isSktm =
    !isPemakaman &&
    (item.id === 'prm-12' ||
      (item.urlSurat || '').toLowerCase().includes('kurang-mampu') ||
      (item.urlSurat || '').toLowerCase().includes('tidak-mampu') ||
      (item.kodeSurat || '').toLowerCase() === 's-11' ||
      (item.jenisSurat || '').toLowerCase().includes('tidak mampu') ||
      (item.jenisSurat || '').toLowerCase().includes('kurang mampu'));
  const isPenghasilanOrtu =
    item.id === 'prm-21' ||
    (item.urlSurat || '').toLowerCase().includes('penghasilan-orang-tua') ||
    (item.kodeSurat || '').toLowerCase() === 's-42' ||
    (item.jenisSurat || '').toLowerCase().includes('penghasilan orang tua');
  const isReaktivasiBpjs =
    item.id === 'prm-09' ||
    (item.urlSurat || '').toLowerCase().includes('jamkesos') ||
    (item.urlSurat || '').toLowerCase().includes('bpjs') ||
    (item.kodeSurat || '').toLowerCase() === 's-15' ||
    (item.jenisSurat || '').toLowerCase().includes('jamkesos') ||
    (item.jenisSurat || '').toLowerCase().includes('reaktivasi bpjs');
  const raw = findOpenSidRawTemplate(item.urlSurat, item.kodeSurat, item.jenisSurat);
  const rawMargin = item.margin
    ? parseOpenSidMargin(item.margin)
    : raw
      ? parseOpenSidMargin(raw.margin)
      : { ...OPENSID_MARGIN_DEFAULT };

  const formIsian =
    item.formIsian && Object.keys(item.formIsian).length > 0
      ? parseOpenSidFormIsian(item.formIsian)
      : raw
        ? parseOpenSidFormIsian(raw.form_isian)
        : parseOpenSidFormIsian(undefined);

  if (isBelumAkta || isDuplikatAktaLahir || isBedaNama || isBelumMenikah || isDuplikatNikah || isNikahNonMuslim || isSporadik || isSktm) {
    if (!formIsian.saksi_1) {
      formIsian.saksi_1 = normalizeFormSectionConfig('saksi_1', {
        judul: 'Identitas Saksi I',
        label: 'Identitas Saksi I',
        data: ['1', '2'],
      });
    } else {
      formIsian.saksi_1.data = ['1', '2'];
    }
    if (!formIsian.saksi_2) {
      formIsian.saksi_2 = normalizeFormSectionConfig('saksi_2', {
        judul: 'Identitas Saksi II',
        label: 'Identitas Saksi II',
        data: ['1', '2'],
      });
    } else {
      formIsian.saksi_2.data = ['1', '2'];
    }
    if (formIsian.saksi_i) {
      formIsian.saksi_i.data = ['1', '2'];
    }
    if (formIsian.saksi_ii) {
      formIsian.saksi_ii.data = ['1', '2'];
    }
    if (isNikahNonMuslim) {
      if (formIsian.saksi_i) delete formIsian.saksi_i;
      if (formIsian.saksi_ii) delete formIsian.saksi_ii;
    }
  }

  if (isCeraiRujuk) {
    if (!formIsian.pasangan) {
      formIsian.pasangan = normalizeFormSectionConfig('pasangan', {
        judul: 'Identitas Pasangan (Mantan Suami / Istri)',
        label: 'Identitas Pasangan (Mantan Suami / Istri)',
        data: ['1', '2'],
      });
    }
  }

  if (isKepemilikanTanah) {
    if (!formIsian.individu) {
      formIsian.individu = normalizeFormSectionConfig('individu', {
        judul: 'Pemohon',
        label: 'Keterangan Pemohon',
      });
    }
    if (!formIsian.tanah) {
      formIsian.tanah = normalizeFormSectionConfig('tanah', {
        judul: 'Tanah',
        label: 'DETAIL INFORMASI TANAH / LAHAN',
        sumber: 0,
      });
    }
  }

  const parsedKodeIsian =
    item.kodeIsian && Array.isArray(item.kodeIsian) && item.kodeIsian.length > 0
      ? parseOpenSidKodeIsian(item.kodeIsian)
      : raw && raw.kode_isian
        ? parseOpenSidKodeIsian(raw.kode_isian)
        : [];

  const fallbackForUrl =
    parsedKodeIsian.length === 0 && item.urlSurat && FALLBACK_KODE_ISIAN_BY_URL[item.urlSurat]
      ? parseOpenSidKodeIsian(FALLBACK_KODE_ISIAN_BY_URL[item.urlSurat])
      : [];

  const kodeIsian = [...(parsedKodeIsian.length > 0 ? parsedKodeIsian : fallbackForUrl)];

  if (isReaktivasiBpjs) {
    if (!kodeIsian.some((ki) => /rekam_medis/i.test(ki.kode || ''))) {
      kodeIsian.unshift({
        kategori: 'individu',
        tipe: 'text',
        kode: '[form_rekam_medis]',
        nama: 'No. Rekam Medis',
        label: 'Nomor Rekam Medis Pasien',
        deskripsi: 'Nomor Rekam Medis dari RS / Fasilitas Kesehatan',
        kolom: 6,
        required: '1',
      });
    }
    if (!kodeIsian.some((ki) => /jenis_penyakit/i.test(ki.kode || ''))) {
      kodeIsian.splice(1, 0, {
        kategori: 'individu',
        tipe: 'text',
        kode: '[form_jenis_penyakit]',
        nama: 'Jenis Penyakit',
        label: 'Jenis Penyakit / Diagnosa Medis',
        deskripsi: 'Diagnosa penyakit (contoh: Gagal Ginjal)',
        kolom: 6,
        required: '1',
      });
    }
    if (!kodeIsian.some((ki) => /no_bpjs/i.test(ki.kode || ''))) {
      kodeIsian.splice(2, 0, {
        kategori: 'individu',
        tipe: 'text',
        kode: '[form_no_bpjs]',
        nama: 'No. BPJS Kesehatan',
        label: 'Nomor Kartu BPJS Kesehatan',
        deskripsi: '13 digit nomor BPJS Kesehatan / KIS',
        kolom: 6,
        required: '1',
      });
    }
  }

  // Pastikan setiap permohonan surat memiliki kolom isian "Keperluan" ([form_keperluan])
  const hasKeperluan = kodeIsian.some(
    (ki) =>
      /keperluan/i.test(ki.kode || '') ||
      /keperluan/i.test(ki.nama || '') ||
      /keperluan/i.test(ki.label || ''),
  );
  if (!hasKeperluan) {
    kodeIsian.push({
      kategori: 'individu',
      tipe: 'textarea',
      kode: '[form_keperluan]',
      nama: 'Keperluan',
      label: 'Keperluan / Peruntukan Pengajuan Surat',
      deskripsi: `Tuliskan keperluan pengajuan ${item.jenisSurat} secara lengkap`,
      atribut: '',
      pilihan: [],
      refrensi: '',
      kolom: 12,
      required: '1',
      kaitkan_kode: '',
    });
  }

  const syaratSuratList =
    Array.isArray(item.syaratSurat) && item.syaratSurat.length > 0
      ? item.syaratSurat
      : isBelumAkta
        ? ['KTP-el Pemohon / Pelapor', 'Kartu Keluarga (KK)', 'KTP Saksi I & II', 'Surat Keterangan Lahir (Bidan / RS / Desa)', 'Surat Pengantar RT / RW']
        : isDuplikatAktaLahir
          ? [
            'Foto Copy Kartu Keluarga ( KK )',
            'Foto Copy Kartu Tanda Penduduk ( KTP ) Ybs/Ortu',
            'Foto Copy Kartu Tanda Penduduk ( KTP ) Pelapor',
            'Foto Copy Surat Nikah / Akta Perkawinan Orang Tua dilegalisir ( untuk meralat nama Orang Tua )',
            'Melampirkan Akta Kelahiran Asli yang akan di ralat/duplikat',
            'Surat Kehilangan Kepolisian untuk Akta yang hilang ( minimal memiliki FC Akta Kelahiran yang hilang )',
            'Foto Copy KTP saksi 2 ( dua ) orang',
          ]
          : ['KTP-el Pemohon / Pelapor', 'Kartu Keluarga (KK)', 'Surat Pengantar RT / RW'];

  const individuCfg = formIsian.individu || normalizeFormSectionConfig('individu', {});
  const pemohonWarga =
    item.pemohonSurat ||
    (Array.isArray(individuCfg.data) && individuCfg.data.includes('2') && !individuCfg.data.includes('1')
      ? 'non_warga'
      : 'warga');

  let rawLampiranList =
    item.lampiran && Array.isArray(item.lampiran) && item.lampiran.length > 0
      ? [...item.lampiran]
      : raw?.lampiran
        ? String(raw.lampiran)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        : [];

  if (isSuratNikah) {
    rawLampiranList = ['Model N-1', 'Model N-2', 'Model N-4', 'Model N-5', 'Model N-6', 'SPS', 'SWN'];
  }
  if (isNikahNonMuslim) {
    rawLampiranList = ['F-2.12', 'F-2.01 Perkawinan'];
  }
  if (isBelumMenikah && !rawLampiranList.some((l) => l.toUpperCase().includes('SP-BM') || l.toUpperCase().includes('BELUM MENIKAH'))) {
    rawLampiranList.push('SP-BM');
  }
  if (isBelumAkta && !rawLampiranList.some((l) => l.toUpperCase().includes('F-2.03') || l.toUpperCase().includes('F2.03'))) {
    rawLampiranList.push('F-2.03');
  }
  if (isDuplikatAktaLahir && !rawLampiranList.some((l) => l.toUpperCase().includes('SP-HILANG'))) {
    rawLampiranList.push('SP-HILANG');
  }
  if (isDuplikatNikah && !rawLampiranList.some((l) => l.toUpperCase().includes('SP-HILANG'))) {
    rawLampiranList.push('SP-HILANG');
  }
  if (isLahirMati && !rawLampiranList.some((l) => l.toUpperCase().includes('F-2.09') || l.toUpperCase().includes('F2.09'))) {
    rawLampiranList.push('F-2.09');
  }

  return {
    ...item,
    isActive: item.isActive !== false,
    mandiri: item.isActive !== false,
    syaratSurat: syaratSuratList,
    lampiran: rawLampiranList,
    pemohonSurat: pemohonWarga,
    satuanMasaBerlaku:
      item.satuanMasaBerlaku ||
      ((raw?.satuan_masa_berlaku?.toUpperCase() as 'D' | 'W' | 'M' | 'Y') ?? 'M'),
    masaBerlakuValue: item.masaBerlakuValue ?? raw?.masa_berlaku ?? 1,
    orientasi: (item.orientasi || raw?.orientasi || 'Potrait') as 'Potrait' | 'Landscape',
    ukuran: (isBelumMenikah || isWaliHakim || isSuratNikah || isDuplikatNikah || isNikahNonMuslim || isCeraiRujuk || isKepemilikanTanah || isKeramaian ? 'A4' : isSporadik ? 'F4' : (item.ukuran || raw?.ukuran || 'F4')) as 'A4' | 'F4' | 'Legal' | 'Letter',
    marginGlobal:
      item.marginGlobal !== undefined
        ? Boolean(item.marginGlobal)
        : raw
          ? String(raw.margin_global) === '1'
          : true,
    margin: rawMargin,
    formatNomorGlobal:
      item.formatNomorGlobal !== undefined
        ? Boolean(item.formatNomorGlobal)
        : !(item.formatNomor || raw?.format_nomor),
    formatNomor: item.formatNomor ?? raw?.format_nomor ?? '',
    header: isJualBeli ? 2 : ((item.header ?? raw?.header ?? 1) as 0 | 1 | 2),
    footer: (isDuplikatAktaLahir || isBedaNama || isWaliHakim || isDuplikatNikah || isNikahNonMuslim || isCeraiRujuk || isSporadik || isKepemilikanTanah || isJualBeli) ? false : (item.footer !== undefined ? item.footer : raw ? Boolean(raw.footer) : true),
    logoGaruda: item.logoGaruda !== undefined ? item.logoGaruda : Boolean(raw?.logo_garuda),
    qrCode: item.qrCode !== undefined ? item.qrCode : Boolean(raw?.qr_code ?? true),
    qrCodeTte: item.qrCodeTte !== undefined ? item.qrCodeTte : false,
    qrSettings: resolveEffectiveQrSettings(
      item.qrSettings,
      item.qrCode !== undefined ? item.qrCode : Boolean(raw?.qr_code ?? true),
      item.qrCodeTte,
    ),
    kecamatan: item.kecamatan !== undefined ? item.kecamatan : Boolean(raw?.kecamatan),
    sumberPendudukBerulang: item.sumberPendudukBerulang ?? false,
    template:
      isSuratKuasa
        ? SURAT_KUASA_ADMINISTRASI_DESA_TEMPLATE
        : isSuratJalan
          ? SURAT_KETERANGAN_BEPERGIAN_JALAN_TEMPLATE
          : isIzinKeluarga
            ? SURAT_KETERANGAN_IZIN_KELUARGA_TEMPLATE
            : isKeramaian
              ? SURAT_IJIN_KERAMAIAN_TEMPLATE
              : isKehilangan
                ? SURAT_PENGANTAR_KEHILANGAN_TEMPLATE
                : isSkck
                  ? SURAT_PENGANTAR_SKCK_TEMPLATE
                  : isKeteranganUmum
                    ? SURAT_KETERANGAN_UMUM_TEMPLATE
                    : isPemakaman
                      ? SURAT_KETERANGAN_PEMAKAMAN_TEMPLATE
                      : isReaktivasiBpjs
                        ? SURAT_KETERANGAN_REAKTIVASI_BPJS_TEMPLATE
                        : isPenghasilanOrtu
                          ? SURAT_KETERANGAN_PENGHASILAN_ORANG_TUA_TEMPLATE
                          : isSktm
                            ? SURAT_KETERANGAN_TIDAK_MAMPU_TEMPLATE
                            : isKematian
                              ? SURAT_KETERANGAN_KEMATIAN_TEMPLATE
                              : isDomisili
                                ? SURAT_KETERANGAN_DOMISILI_TEMPLATE
                                : isPerubahanKk
                                  ? SURAT_PERMOHONAN_PERUBAHAN_KK_TEMPLATE
                                  : isDuplikatAktaLahir
                                    ? SURAT_PERMOHONAN_DUPLIKAT_AKTA_KELAHIRAN_TEMPLATE
                                    : isLahirMati
                                      ? SURAT_KETERANGAN_LAHIR_MATI_TEMPLATE
                                      : isBedaNama
                                        ? SURAT_PERNYATAAN_BEDA_NAMA_TEMPLATE
                                        : isNikahNonMuslim
                                          ? SURAT_KETERANGAN_NIKAH_NON_MUSLIM_TEMPLATE
                                          : isSuratNikah
                                            ? SURAT_PENGANTAR_NIKAH_TEMPLATE
                                            : isWaliHakim
                                              ? SURAT_KETERANGAN_WALI_HAKIM_TEMPLATE
                                              : isDuplikatNikah
                                                ? SURAT_PERMOHONAN_DUPLIKAT_SURAT_NIKAH_TEMPLATE
                                                : isCeraiRujuk
                                                  ? SURAT_PENGANTAR_CERAI_RUJUK_TEMPLATE
                                                  : isSporadik
                                                    ? SURAT_SPORADIK_TEMPLATE
                                                    : isKepemilikanTanah
                                                      ? SURAT_KETERANGAN_KEPEMILIKAN_TANAH_TEMPLATE
                                                      : isJualBeli
                                                        ? SURAT_KETERANGAN_JUAL_BELI_TANAH_TEMPLATE
                                                        : isDomisiliUsaha
                                                          ? SURAT_KETERANGAN_DOMISILI_USAHA_TEMPLATE
                                                          : isUsaha
                                                            ? SURAT_KETERANGAN_USAHA_TEMPLATE
                                                            : item.template &&
                                                              !/\[\s*Atas_namA\s*\]\s*<br\s*\/?>\s*\[\s*qr_code\s*\]/i.test(item.template) &&
                                                              !/\[\s*Form_hubungan_pelapor_dengan_yang_matI\s*\]/i.test(item.template)
                                                              ? item.template
                                                              : raw?.template || getFallbackTemplateHtml(item.jenisSurat),
    templateDesa:
      (isKematian && item.templateDesa && !item.templateDesa.toLowerCase().includes('meninggal dunia')) ||
        (isDomisili && item.templateDesa && !item.templateDesa.includes('SURAT KETERANGAN DOMISILI')) ||
        (isPerubahanKk && item.templateDesa && !item.templateDesa.includes('SURAT PERMOHONAN PERUBAHAN KARTU KELUARGA')) ||
        (isDuplikatAktaLahir && item.templateDesa && !item.templateDesa.includes('FORMULIR PENDAFTARAN RALAT/DUPLIKAT AKTA KELAHIRAN')) ||
        (isLahirMati && item.templateDesa && !item.templateDesa.includes('SURAT KETERANGAN LAHIR MATI')) ||
        (isBedaNama && item.templateDesa && !item.templateDesa.includes('SURAT PERNYATAAN BEDA NAMA')) ||
        (isMoyang && item.templateDesa && !item.templateDesa.includes('SURAT KETERANGAN MOYANG')) ||
        (isWaliHakim && item.templateDesa && !item.templateDesa.includes('WALI HAKIM')) ||
        (isNikahNonMuslim && item.templateDesa && (!item.templateDesa.includes('WARGA NON MUSLIM') || item.templateDesa.includes('Orang tersebut di atas adalah benar-benar penduduk'))) ||
        (isSuratNikah && item.templateDesa && (!item.templateDesa.includes('SURAT KETERANGAN UNTUK NIKAH') || item.templateDesa.includes('NUMPANG NIKAH'))) ||
        (isDuplikatNikah && item.templateDesa && (!item.templateDesa.includes('1. Data Suami') || item.templateDesa.includes('Orang tersebut di atas adalah benar-benar penduduk'))) ||
        (isCeraiRujuk && item.templateDesa && (!item.templateDesa.includes('SURAT PENGANTAR CERAI / RUJUK') || item.templateDesa.includes('berdasarkan keterangan dari'))) ||
        (isSporadik && item.templateDesa && (!item.templateDesa.includes('dengan itikad baik telah menguasai') || !item.templateDesa.includes('[namasaksii]') || item.templateDesa.includes('Orang tersebut di atas adalah benar-benar penduduk'))) ||
        (isKepemilikanTanah && item.templateDesa && (!item.templateDesa.includes('SURAT KETERANGAN KEPEMILIKAN TANAH') || item.templateDesa.includes('[TempatlahiR] / [TanggallahiR]') || item.templateDesa.includes('Provinsi [NaMa_provinsi]</td>'))) ||
        (isJualBeli && item.templateDesa && (!item.templateDesa.includes('SURAT KETERANGAN JUAL BELI TANAH') || item.templateDesa.includes('hendak menjual'))) ||
        (isDomisiliUsaha && item.templateDesa && (!item.templateDesa.includes('SURAT KETERANGAN DOMISILI USAHA') || item.templateDesa.includes('Orang tersebut di atas adalah benar-benar') || !item.templateDesa.includes('Status Bangunan Tempat Usaha'))) ||
        (isUsaha && item.templateDesa && (!item.templateDesa.includes('memiliki usaha dengan keterangan sebagai berikut') || item.templateDesa.includes('Orang tersebut di atas adalah benar-benar') || item.templateDesa.includes('memiliki usaha [Form_nama_usaha]'))) ||
        (isSktm && item.templateDesa && (!item.templateDesa.includes('SURAT KETERANGAN TIDAK MAMPU') || item.templateDesa.includes('KLg1_nik') || item.templateDesa.includes('Orang tersebut di atas adalah benar-benar penduduk'))) ||
        (isPenghasilanOrtu && item.templateDesa && (!item.templateDesa.includes('SURAT KETERANGAN PENGHASILAN ORANG TUA') || item.templateDesa.includes('[HitunG]') || item.templateDesa.includes('width: 4.31655%') || item.templateDesa.includes('Orang tersebut di atas adalah benar-benar penduduk'))) ||
        (isReaktivasiBpjs && item.templateDesa && (!item.templateDesa.includes('SURAT KETERANGAN REAKTIVASI BPJS KESEHATAN') || item.templateDesa.includes('Kartu Peserta Jamkesos') || item.templateDesa.includes('Orang tersebut di atas adalah benar-benar'))) ||
        (isPemakaman && item.templateDesa && (!item.templateDesa.includes('SURAT KETERANGAN PEMAKAMAN') || !item.templateDesa.includes('Dimakamkan pada') || item.templateDesa.includes('Orang tersebut di atas adalah benar-benar'))) ||
        (isKehilangan && item.templateDesa && (!item.templateDesa.includes('SURAT PENGANTAR KEHILANGAN') || item.templateDesa.includes('Orang tersebut adalah benar-benar warga') || item.templateDesa.includes('1.</td>'))) ||
        (isKeramaian && item.templateDesa && (!item.templateDesa.includes('SURAT IJIN KERAMAIAN') || !item.templateDesa.includes('DAN RAMIL') || item.templateDesa.includes('1.</td>') || item.templateDesa.includes('Orang tersebut di atas adalah benar-benar penduduk Desa') === false)) ||
        (isSkck && item.templateDesa && (!item.templateDesa.includes('SURAT PENGANTAR SKCK') || !item.templateDesa.includes('DAN RAMIL') || item.templateDesa.includes('Orang tersebut di atas adalah benar-benar') || item.templateDesa.includes('1.</td>'))) ||
        (isIzinKeluarga && item.templateDesa && (!item.templateDesa.includes('SURAT KETERANGAN IZIN KELUARGA') || item.templateDesa.includes('1.</td>') || item.templateDesa.includes('[Form_memberi_izin_selakU]'))) ||
        (isSuratJalan && item.templateDesa && (!item.templateDesa.includes('SURAT KETERANGAN JALAN/BERPERGIAN') || item.templateDesa.includes('Orang tersebut di atas adalah benar-benar penduduk'))) ||
        (isSuratKuasa && item.templateDesa && (!item.templateDesa.includes('SURAT KUASA') || !item.templateDesa.includes('Pemberi Kuasa') || item.templateDesa.includes('Orang tersebut di atas adalah benar-benar penduduk'))) ||
        (isKeteranganUmum && item.templateDesa && (!item.templateDesa.includes('SURAT PENGANTAR UMUM') || item.templateDesa.includes('SURAT KETERANGAN UMUM') || item.templateDesa.includes('SURAT KETERANGAN USAHA') || item.templateDesa.includes('memiliki usaha') || item.templateDesa.includes('Orang tersebut di atas adalah benar-benar')))
        ? ''
        : item.templateDesa ?? raw?.template_desa ?? '',
    formIsian,
    kodeIsian,
  };
}

export function getFallbackTemplateHtml(judulSurat = 'SURAT KETERANGAN'): string {
  const cleanTitle = judulSurat.replace(/^Surat\s+/i, '').toUpperCase();
  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45;">
<p style="text-align: center; margin-bottom: 4px;"><strong><span style="font-size: 14pt; text-decoration: underline;">SURAT ${cleanTitle}</span></strong></p>
<p style="text-align: center; margin-top: 0; margin-bottom: 18px;">Nomor : [Format_nomor_suraT]</p>
<p style="text-align: justify; text-indent: 36px;">Yang bertanda tangan di bawah ini [Jabatan] [Nama_desA], Kecamatan [Nama_kecamataN], Kabupaten [Nama_kabupateN], Provinsi [Nama_provinsI] menerangkan dengan sebenarnya bahwa :</p>
<table style="border-collapse: collapse; width: 100%; margin-left: 24px; margin-bottom: 12px;" border="0">
<tbody>
<tr><td style="width: 32%;">1. Nama Lengkap</td><td style="width: 2%;">:</td><td style="width: 66%;"><strong>[Nama]</strong></td></tr>
<tr><td>2. NIK / No. KTP</td><td>:</td><td>[Nik]</td></tr>
<tr><td>3. Nomor KK</td><td>:</td><td>[No_kK]</td></tr>
<tr><td>4. Tempat / Tanggal Lahir</td><td>:</td><td>[Tempat_tanggal_lahiR]</td></tr>
<tr><td>5. Jenis Kelamin</td><td>:</td><td>[Jenis_kelamiN]</td></tr>
<tr><td>6. Agama</td><td>:</td><td>[Agama]</td></tr>
<tr><td>7. Status Perkawinan</td><td>:</td><td>[Status_kawin]</td></tr>
<tr><td>8. Pekerjaan</td><td>:</td><td>[Pekerjaan]</td></tr>
<tr><td>9. Alamat Tempat Tinggal</td><td>:</td><td>[Alamat]</td></tr>
</tbody>
</table>
<p style="text-align: justify; text-indent: 36px;">Orang tersebut di atas adalah benar-benar penduduk [Sebutan_desA] [Nama_desA] Kecamatan [Nama_kecamataN] Kabupaten [Nama_kabupateN]. Surat keterangan ini diberikan untuk keperluan : <strong>[form_keperluan]</strong>.</p>
<p style="text-align: justify; text-indent: 36px;">Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
<table style="border-collapse: collapse; width: 100%; margin-top: 24px;" border="0">
<tbody>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Nama_desA], [Tanggal_suraT]</td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Atas_namA]</td>
</tr>
<tr style="height: 52px;">
<td style="width: 50%; text-align: center; height: 52px;">&nbsp;</td>
<td style="width: 50%; text-align: center; height: 52px; vertical-align: middle;">[qr_bsre]</td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;"><strong><u>[Nama_pamonG]</u></strong></td>
</tr>
<tr>
<td style="width: 50%; text-align: center;">&nbsp;</td>
<td style="width: 50%; text-align: center;">[Sebutan_nip_desA] : [Nip_pamoNG]</td>
</tr>
</tbody>
</table>
</div>`;

}

/**
 * Mengubah string teks menjadi Title Case (diawali huruf besar per kata).
 * Singkatan resmi seperti RT, RW, NIK, KK, KTP, WNI, SLTA, dll. tetap dipertahankan huruf besar.
 */
export function toTitleCaseIndonesian(input: string): string {
  if (!input || typeof input !== 'string') return '';
  if (/<[a-z][\s\S]*>/i.test(input) || /^https?:\/\//i.test(input)) {
    return input;
  }

  const ACRONYMS = new Set([
    'RT', 'RW', 'NIK', 'KK', 'KTP', 'WNI', 'WNA', 'SLTA', 'SLTP',
    'SD', 'SMP', 'SMA', 'SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3',
    'PNS', 'TNI', 'POLRI', 'BPJS', 'KUA', 'SKCK', 'SKU', 'SKTM', 'SKP',
    'SKPWNI', 'TPU', 'RI', 'ID', 'NO', 'HP', 'PT', 'CV', 'UD', 'SHDK', 'BSRE',
    'NIP', 'NIAP', 'KUR', 'BRI', 'BCA', 'BNI', 'BSI', 'BTN', 'MANDIRI', 'UMKM',
    'OSS', 'NIB',
    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
  ]);

  return input.replace(/[a-zA-Z0-9]+/g, (word) => {
    const upper = word.toUpperCase();
    if (ACRONYMS.has(upper)) {
      return upper;
    }
    // Cek angka romawi (misal I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, dst)
    if (/^(M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3}))$/.test(upper) && upper.length > 0) {
      return upper;
    }
    if (/^[BCDFGHJKLMNPQRSTVWXYZ]{2,5}$/.test(upper)) {
      return upper;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

/**
 * Konversi pola huruf sesuai helper `caseWord` & `getFormatIsian` di OpenSID:
 * - [NAma] (huruf 1 & 2 kapital, huruf terakhir tidak kapital) -> UPPERCASE
 * - [NaMa] (huruf 1 & 3 kapital) -> Title Case (ucwords)
 * - [Nama_lengkaP] -> Title Case
 * - [Nama] (hanya huruf 1 kapital) -> Title Case (per kata diawali huruf besar)
 * - [nama] / [form_...] -> Title Case (per kata diawali huruf besar sesuai instruksi cetak)
 */
export function applyOpenSidCasePattern(matchedTagWithoutBrackets: string, replacementValue: string): string {
  if (!replacementValue) return '';
  // Jika berisi tag HTML (seperti <img ...> atau <b>), jangan ubah case HTML
  if (/<[a-z][\s\S]*>/i.test(replacementValue)) {
    return replacementValue;
  }

  const cleanLower = matchedTagWithoutBrackets.toLowerCase().trim();

  // Khusus nama penandatangan (Kepala Desa, Pamong, Sekretaris Desa, Pejabat):
  // Format hasil cetak resmi mensyaratkan NAMA PEJABAT PENANDATANGAN SELALU HURUF BESAR SEMUA (UPPERCASE)
  if (
    cleanLower === 'nama_kepala_desa' ||
    cleanLower === 'nama_pamong' ||
    cleanLower === 'nama_sekretaris_desa' ||
    cleanLower === 'nama_pejabat' ||
    cleanLower === 'pamong_nama' ||
    cleanLower === 'pejabat_nama'
  ) {
    return replacementValue.toUpperCase();
  }

  // Khusus Atas Nama ([Atas_namA]), jika mengandung tag baris baru (<br /> atau \n), pertahankan pemisah barisnya
  if (cleanLower === 'atas_nama') {
    return replacementValue.replace(/\r?\n/g, '<br />');
  }

  // Khusus nomor surat, kode surat, NIK, KK, NIP, NIAP, bulan romawi, kontak/website:
  // Jangan diubah ke Title Case agar format nomor dokumen & angka romawi tetap utuh (misal XI bukan Xi)
  const isDocumentCodeOrNumber =
    cleanLower.includes('nomor') ||
    cleanLower.includes('no_') ||
    cleanLower.includes('kode') ||
    cleanLower.includes('nik') ||
    cleanLower.includes('kk') ||
    cleanLower.includes('nip') ||
    cleanLower.includes('niap') ||
    cleanLower.includes('bulan_romawi') ||
    cleanLower.includes('telepon') ||
    cleanLower.includes('phone') ||
    cleanLower.includes('email') ||
    cleanLower.includes('url') ||
    cleanLower.includes('website');

  if (isDocumentCodeOrNumber) {
    // Pastikan singkatan angka romawi di nomor surat / kode tetap UPPERCASE
    return normalizeRomanNumeralsInDocNumber(replacementValue);
  }

  const lettersOnly = matchedTagWithoutBrackets.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly.length < 2) {
    return toTitleCaseIndonesian(replacementValue);
  }
  const firstIsUpper = lettersOnly[0] === lettersOnly[0].toUpperCase();
  const secondIsUpper = lettersOnly[1] === lettersOnly[1].toUpperCase();
  const thirdIsUpper = lettersOnly.length >= 3 && lettersOnly[2] === lettersOnly[2].toUpperCase();
  const lastIsUpper = lettersOnly[lettersOnly.length - 1] === lettersOnly[lettersOnly.length - 1].toUpperCase();

  // [NAma] atau [NAMA] -> UPPERCASE
  if (firstIsUpper && secondIsUpper) {
    return replacementValue.toUpperCase();
  }
  // [Nama_suraT] (first & last uppercase, second lowercase) -> Title Case
  if (firstIsUpper && lastIsUpper && !secondIsUpper) {
    return toTitleCaseIndonesian(replacementValue);
  }
  // [NaMa] (first & third uppercase) -> Title Case (ucwords)
  if (firstIsUpper && thirdIsUpper && !secondIsUpper) {
    return toTitleCaseIndonesian(replacementValue);
  }
  // [nama] (all lowercase) atau [form_...] -> Title Case
  if (matchedTagWithoutBrackets === matchedTagWithoutBrackets.toLowerCase()) {
    return toTitleCaseIndonesian(replacementValue);
  }
  // [Nama] (first uppercase only) -> Title Case (per kata diawali huruf besar)
  if (firstIsUpper) {
    return toTitleCaseIndonesian(replacementValue);
  }
  return toTitleCaseIndonesian(replacementValue);
}

export function caseReplaceOpenSid(searchTag: string, replacementValue: string, htmlContent: string): string {
  if (!htmlContent) return '';
  const cleanKey = searchTag.replace(/^\[|\]$/g, '').trim();
  if (!cleanKey) return htmlContent;
  const escaped = cleanKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\[\\s*(${escaped})\\s*\\]`, 'gi');
  return htmlContent.replace(regex, (_fullMatch, innerTag: string) => {
    return applyOpenSidCasePattern(innerTag, String(replacementValue ?? ''));
  });
}

export const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const HARI_INDONESIA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const BULAN_ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/**
 * Normalisasi berbagai format tanggal (Date, Firestore Timestamp instance, Timestamp object {seconds, nanoseconds},
 * string serialized "Timestamp(Seconds=..., Nanoseconds=...)", string ISO, string DD-MM-YYYY, atau teks tanggal Indo).
 */
export function normalizeDateInput(dateInput?: any): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  // Firestore Timestamp instance
  if (typeof dateInput === 'object' && typeof dateInput.toDate === 'function') {
    try {
      const d = dateInput.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    } catch {
      // ignore
    }
  }
  // Serialized Firestore Timestamp object { seconds, nanoseconds }
  if (
    typeof dateInput === 'object' &&
    dateInput !== null &&
    typeof dateInput.seconds === 'number'
  ) {
    const d = new Date(dateInput.seconds * 1000);
    if (!isNaN(d.getTime())) return d;
  }
  // String format Timestamp(...) mis. "Timestamp(Seconds=1791306000, Nanoseconds=0)"
  const str = String(dateInput).trim();
  const tsMatch = str.match(/Timestamp\s*\(\s*seconds\s*=\s*(\d+)/i);
  if (tsMatch) {
    const secs = parseInt(tsMatch[1], 10);
    const d = new Date(secs * 1000);
    if (!isNaN(d.getTime())) return d;
  }
  // Format DD-MM-YYYY atau DD/MM/YYYY atau DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  // Format tanggal teks Indonesia: "10 Januari 2020" atau "Jum'at, 10 Januari 2020"
  const indoMatch = str.match(/(?:(?:Senin|Selasa|Rabu|Kamis|Jum'?at|Sabtu|Minggu)[,\s]+)?(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/i);
  if (indoMatch) {
    const day = parseInt(indoMatch[1], 10);
    const monthName = indoMatch[2].toLowerCase();
    const year = parseInt(indoMatch[3], 10);
    const mIdx = BULAN_INDONESIA.findIndex((b) => b.toLowerCase() === monthName);
    if (mIdx !== -1) {
      const d = new Date(year, mIdx, day);
      if (!isNaN(d.getTime())) return d;
    }
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
}

export function formatTanggalIndonesia(dateInput?: any): string {
  if (!dateInput) {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')} ${BULAN_INDONESIA[now.getMonth()]} ${now.getFullYear()}`;
  }
  const norm = normalizeDateInput(dateInput);
  if (norm) {
    return `${String(norm.getDate()).padStart(2, '0')} ${BULAN_INDONESIA[norm.getMonth()]} ${norm.getFullYear()}`;
  }
  const str = String(dateInput).trim();
  // Jika sudah berbentuk "12 Januari 2026"
  if (/[a-zA-Z]{3,}/.test(str) && !str.toLowerCase().includes('timestamp') && !/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str;
  }
  return str;
}

export function getNamaHariIndonesia(dateInput?: any): string {
  if (!dateInput) {
    const hari = HARI_INDONESIA[new Date().getDay()];
    return hari === 'Jumat' ? "Jum'at" : hari;
  }
  const norm = normalizeDateInput(dateInput);
  if (norm) {
    const hari = HARI_INDONESIA[norm.getDay()];
    return hari === 'Jumat' ? "Jum'at" : hari;
  }
  const hari = HARI_INDONESIA[new Date().getDay()];
  return hari === 'Jumat' ? "Jum'at" : hari;
}

export function hitungUmurIndonesia(birthDateStr?: string | null): string {
  if (!birthDateStr) return '-';
  const d = new Date(birthDateStr);
  if (isNaN(d.getTime())) return '-';
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age >= 0 ? `${age} Tahun` : '-';
}

export function terbilangIndonesia(nilaiInput: number | string): string {
  const angka = Math.abs(Number(String(nilaiInput).replace(/[^0-9]/g, '')));
  if (isNaN(angka) || angka === 0) return 'nol';
  const huruf = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  const sebut = (n: number): string => {
    if (n < 12) return huruf[n];
    if (n < 20) return `${sebut(n - 10)} belas`;
    if (n < 100) return `${sebut(Math.floor(n / 10))} puluh ${sebut(n % 10)}`.trim();
    if (n < 200) return `seratus ${sebut(n - 100)}`.trim();
    if (n < 1000) return `${sebut(Math.floor(n / 100))} ratus ${sebut(n % 100)}`.trim();
    if (n < 2000) return `seribu ${sebut(n - 1000)}`.trim();
    if (n < 1000000) return `${sebut(Math.floor(n / 1000))} ribu ${sebut(n % 1000)}`.trim();
    if (n < 1000000000) return `${sebut(Math.floor(n / 1000000))} juta ${sebut(n % 1000000)}`.trim();
    if (n < 1000000000000) return `${sebut(Math.floor(n / 1000000000))} miliar ${sebut(n % 1000000000)}`.trim();
    if (n < 1000000000000000) return `${sebut(Math.floor(n / 1000000000000))} triliun ${sebut(n % 1000000000000)}`.trim();
    return String(n);
  };
  return sebut(angka).replace(/\s+/g, ' ').trim();
}

export function normalizeRomanNumeralsInDocNumber(docNum: string): string {
  if (!docNum) return '';
  return docNum.replace(/(^|[/\\.-])(x[ivx]*|v?i{1,3}|ix|iv)(?=[/\\.-]|$)/gi, (_m, prefix, roman) => {
    return prefix + roman.toUpperCase();
  });
}

export function formatPenomoranSuratOpenSid(params: {
  formatNomor?: string;
  nomorUrut?: number | string;
  kodeSurat?: string;
  kodeDesa?: string;
  tanggal?: Date;
}): string {
  const tpl = (params.formatNomor || OPENSID_FORMAT_NOMOR_DEFAULT).trim();
  const d = params.tanggal || new Date();
  const rawUrut = String(params.nomorUrut ?? 1).replace(/[^0-9]/g, '') || '1';
  const kodeSurat = params.kodeSurat || '470';
  const kodeDesa = params.kodeDesa || '33.01.10.2011';
  const bulanRomawi = BULAN_ROMAWI[d.getMonth()];
  const bulanAngka = String(d.getMonth() + 1).padStart(2, '0');
  const tahun = String(d.getFullYear());

  let output = tpl.replace(/\[\s*nomor_surat\s*(?:,\s*(\d+)\s*)?\]/gi, (_m, padLen) => {
    const len = padLen ? Number(padLen) : 3;
    return rawUrut.padStart(len, '0');
  });
  output = output
    .replace(/\[\s*kode_surat\s*\]/gi, kodeSurat)
    .replace(/\[\s*kode_desa\s*\]/gi, kodeDesa)
    .replace(/\[\s*bulan_romawi\s*\]/gi, bulanRomawi)
    .replace(/\[\s*bulan\s*\]/gi, bulanAngka)
    .replace(/\[\s*tahun\s*\]/gi, tahun);

  return normalizeRomanNumeralsInDocNumber(output);
}

export function hitungMasaBerlakuTanggal(
  mulaiDate: Date,
  jumlah = 1,
  satuan: string = 'M',
): { mulaiBerlaku: string; berlakuSampai: string } {
  const start = new Date(mulaiDate);
  const end = new Date(mulaiDate);
  const n = Math.max(0, Number(jumlah || 0));
  const unit = satuan.toLowerCase();
  if (unit === 'd') {
    end.setDate(end.getDate() + n);
  } else if (unit === 'w') {
    end.setDate(end.getDate() + n * 7);
  } else if (unit === 'y') {
    end.setFullYear(end.getFullYear() + n);
  } else {
    end.setMonth(end.getMonth() + n);
  }
  return {
    mulaiBerlaku: formatTanggalIndonesia(start),
    berlakuSampai: formatTanggalIndonesia(end),
  };
}

export interface OpenSidPersonData {
  nama?: string;
  nik?: string;
  no_kk?: string;
  kepala_kk?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  agama?: string;
  pendidikan_kk?: string;
  pekerjaan?: string;
  warga_negara?: string;
  status_kawin?: string;
  golongan_darah?: string;
  alamat?: string;
  rt?: string;
  rw?: string;
  dusun?: string;
  hubungan_kk?: string;
  nama_ayah?: string;
  nik_ayah?: string;
  nama_ibu?: string;
  nik_ibu?: string;
}

export interface OpenSidRenderContext {
  // Surat
  judulSurat?: string;
  nomorSurat?: string;
  kodeSurat?: string;
  tanggalSurat?: string;
  hariSurat?: string;
  mulaiBerlaku?: string;
  berlakuSampai?: string;
  logoGaruda?: boolean;
  qrCode?: boolean;
  qrSettings?: Partial<OpenSidQrSignatureSettings>;
  submissionId?: string;
  signerCode?: 'kades' | 'sekdes';
  requesterPurpose?: string;
  // Desa & Wilayah
  namaDesa?: string;
  sebutanDesa?: string;
  kodeDesa?: string;
  kodePos?: string;
  alamatDesa?: string;
  emailDesa?: string;
  teleponDesa?: string;
  websiteDesa?: string;
  namaKecamatan?: string;
  sebutanKecamatan?: string;
  kodeKecamatan?: string;
  namaCamat?: string;
  nipCamat?: string;
  pangkatCamat?: string;
  namaDanramil?: string;
  nrpDanramil?: string;
  jabatanDanramil?: string;
  namaKapolsek?: string;
  nrpKapolsek?: string;
  jabatanKapolsek?: string;
  namaKua?: string;
  namaKepalaKua?: string;
  namaKabupaten?: string;
  sebutanKabupaten?: string;
  kodeKabupaten?: string;
  namaKadisDukcapil?: string;
  nipKadisDukcapil?: string;
  namaProvinsi?: string;
  sebutanProvinsi?: string;
  kodeProvinsi?: string;
  logoUrl?: string;
  villageLogoUrl?: string;
  letterheadImageUrl?: string;
  // Penandatangan
  atasNama?: string;
  jabatanPamong?: string;
  namaPamong?: string;
  nipPamong?: string;
  niapPamong?: string;
  pangkatPamong?: string;
  namaKepalaDesa?: string;
  nipKepalaDesa?: string;
  namaSekretarisDesa?: string;
  nipSekretarisDesa?: string;
  // Individu utama
  individu?: OpenSidPersonData;
  requesterName?: string;
  // Pelaku bagian tambahan (ayah, ibu, saksi_i, pembeli, pasangan, anak, dll.)
  pelakuBagian?: Record<string, OpenSidPersonData>;
  // Nilai form_isian dinamis (key dengan atau tanpa kurung siku, mis. '[form_nama_usaha]' atau 'form_nama_usaha')
  formValues?: Record<string, string>;
  // Anggota keluarga untuk lampiran formulir keluarga (F-1.01, F-1.02, F-1.03, F-1.15)
  familyMembers?: any[];
}

/**
 * Memformat alamat standar lengkap KTP dengan susunan:
 * [Jalan/Dusun] RT. [001] RW. [005], Desa [Nama Desa], Kecamatan [Nama Kecamatan], Kabupaten [Nama Kabupaten]
 */
export function formatAlamatLengkapKtp(
  addressInput?: string,
  rtInput?: string | number,
  rwInput?: string | number,
  dusunInput?: string,
  desaInput?: string,
  kecamatanInput?: string,
  kabupatenInput?: string,
): string {
  const vId = getCachedVillageIdentity();
  const effectiveDesa = (desaInput || vId.namaDesa || 'Sampeldes').trim();
  const effectiveKec = (kecamatanInput || vId.namaKecamatan || 'Gandrungmangu').trim();
  const effectiveKab = (kabupatenInput || vId.namaKabupaten || 'Cilacap').trim();

  let rt = rtInput !== undefined && rtInput !== null ? String(rtInput).trim() : '';
  let rw = rwInput !== undefined && rwInput !== null ? String(rwInput).trim() : '';
  let raw = (addressInput || '').trim();

  // Ekstrak RT / RW jika tersimpan di dalam string alamat
  if (!rt) {
    const matchRt = raw.match(/rt\.?\s*(\d+)/i);
    if (matchRt) rt = matchRt[1];
  }
  if (!rw) {
    const matchRw = raw.match(/rw\.?\s*(\d+)/i);
    if (matchRw) rw = matchRw[1];
  }

  // Bersihkan teks jalan/dusun dari duplikasi kabupaten, kecamatan, desa, dan RT/RW yang bertumpuk
  let cleanStreet = raw;
  if (cleanStreet) {
    cleanStreet = cleanStreet.replace(new RegExp(`,?\\s*(?:kabupaten|kab\\.?)\\s*${effectiveKab}`, 'gi'), '');
    cleanStreet = cleanStreet.replace(new RegExp(`,?\\s*(?:kecamatan|kec\\.?)\\s*${effectiveKec}`, 'gi'), '');
    cleanStreet = cleanStreet.replace(new RegExp(`,?\\s*(?:desa|kelurahan)?\\s*${effectiveDesa}\\s*$`, 'gi'), '');
    cleanStreet = cleanStreet.replace(/,?\s*rt\.?\s*\d+\s*(?:\/|\s*rw\.?\s*)\d*/gi, '');
    cleanStreet = cleanStreet.replace(/,?\s*rt\.?\s*\d+/gi, '');
    cleanStreet = cleanStreet.replace(/,?\s*rw\.?\s*\d+/gi, '');
    cleanStreet = cleanStreet.replace(/,\s*,+/g, ',').replace(/^[,\s]+|[,\s]+$/g, '').trim();

    // Jika kata desa berulang (contoh "Sampeldes, Sampeldes")
    const dupeDesaRegex = new RegExp(`\\b${effectiveDesa}\\b(?:\\s*,?\\s*\\b${effectiveDesa}\\b)+`, 'gi');
    cleanStreet = cleanStreet.replace(dupeDesaRegex, effectiveDesa);
    cleanStreet = cleanStreet.replace(/,\s*,+/g, ',').replace(/^[,\s]+|[,\s]+$/g, '').trim();
  }

  if (!cleanStreet || cleanStreet.toLowerCase() === effectiveDesa.toLowerCase()) {
    cleanStreet = dusunInput && dusunInput.trim() && dusunInput.toLowerCase() !== effectiveDesa.toLowerCase()
      ? `Dusun ${dusunInput.trim()}`
      : effectiveDesa;
  }

  const rtPadded = rt ? String(rt).replace(/^0+/, '').padStart(3, '0') : '001';
  const rwPadded = rw ? String(rw).replace(/^0+/, '').padStart(3, '0') : '001';
  const rtRwStr = `RT. ${rtPadded} RW. ${rwPadded}`;

  return `${cleanStreet} ${rtRwStr}, Desa ${effectiveDesa}, Kecamatan ${effectiveKec}, Kabupaten ${effectiveKab}`;
}

function buildPersonReplacements(person: OpenSidPersonData, suffix = ''): Record<string, string> {
  const sfx = suffix ? `_${suffix.toLowerCase()}` : '';
  const tglLahirFmt = person.tanggal_lahir ? formatTanggalIndonesia(person.tanggal_lahir) : '-';
  const tempatLahir = person.tempat_lahir || '-';
  const ttlGabung =
    tempatLahir !== '-' && tglLahirFmt !== '-'
      ? `${toTitleCaseIndonesian(tempatLahir)}, ${tglLahirFmt}`
      : tempatLahir !== '-'
        ? toTitleCaseIndonesian(tempatLahir)
        : tglLahirFmt;
  const vId = getCachedVillageIdentity();
  const usia = person.tanggal_lahir ? hitungUmurIndonesia(person.tanggal_lahir) : '-';
  const rt = person.rt || '001';
  const rw = person.rw || '001';
  const dusun = toTitleCaseIndonesian(person.dusun || vId.namaDesa || 'Sampeldes');
  const alamatLengkap = formatAlamatLengkapKtp(
    person.alamat,
    rt,
    rw,
    dusun,
    vId.namaDesa,
    vId.namaKecamatan,
    vId.namaKabupaten,
  );

  const rawKepalaKk = (person.kepala_kk || '').trim();
  const rawNama = (person.nama || '').trim();
  const safeKepalaKk = rawKepalaKk && rawKepalaKk !== '-' && rawKepalaKk !== '.' ? rawKepalaKk : (rawNama || '-');

  const map: Record<string, string> = {
    [`nama${sfx}`]: toTitleCaseIndonesian(person.nama || '-'),
    [`nik${sfx}`]: person.nik || '-',
    [`no_kk${sfx}`]: person.no_kk || '-',
    [`kepala_kk${sfx}`]: toTitleCaseIndonesian(safeKepalaKk),
    [`tempat_lahir${sfx}`]: toTitleCaseIndonesian(tempatLahir),
    [`tempatlahir${sfx}`]: toTitleCaseIndonesian(tempatLahir),
    [`tanggal_lahir${sfx}`]: tglLahirFmt,
    [`tanggallahir${sfx}`]: tglLahirFmt,
    [`tempat_tanggal_lahir${sfx}`]: ttlGabung,
    [`ttl${sfx}`]: ttlGabung,
    [`usia${sfx}`]: usia,
    [`umur${sfx}`]: usia,
    [`jenis_kelamin${sfx}`]: toTitleCaseIndonesian(person.jenis_kelamin || '-'),
    [`kelamin${sfx}`]: toTitleCaseIndonesian(person.jenis_kelamin || '-'),
    [`agama${sfx}`]: toTitleCaseIndonesian(person.agama || 'Islam'),
    [`pendidikan_kk${sfx}`]: toTitleCaseIndonesian(person.pendidikan_kk || 'SLTA / Sederajat'),
    [`pendidikan${sfx}`]: toTitleCaseIndonesian(person.pendidikan_kk || 'SLTA / Sederajat'),
    [`pekerjaan${sfx}`]: toTitleCaseIndonesian(person.pekerjaan || 'Wiraswasta'),
    [`warga_negara${sfx}`]: (person.warga_negara || 'WNI').toUpperCase(),
    [`kewarganegaraan${sfx}`]: (person.warga_negara || 'WNI').toUpperCase(),
    [`status_kawin${sfx}`]: toTitleCaseIndonesian(person.status_kawin || 'Kawin'),
    [`status_perkawinan${sfx}`]: toTitleCaseIndonesian(person.status_kawin || 'Kawin'),
    [`golongan_darah${sfx}`]: (person.golongan_darah || '-').toUpperCase(),
    [`gol_darah${sfx}`]: (person.golongan_darah || '-').toUpperCase(),
    [`alamat${sfx}`]: toTitleCaseIndonesian(alamatLengkap),
    [`alamat_lengkap${sfx}`]: toTitleCaseIndonesian(alamatLengkap),
    [`alamat_tempat_tinggal${sfx}`]: toTitleCaseIndonesian(alamatLengkap),
    [`alamat_rumah${sfx}`]: toTitleCaseIndonesian(alamatLengkap),
    [`alamat_jalan${sfx}`]: toTitleCaseIndonesian(person.alamat || `Dusun ${dusun}`),
    [`rt${sfx}`]: rt,
    [`rw${sfx}`]: rw,
    [`dusun${sfx}`]: dusun,
    [`nama_dusun${sfx}`]: dusun,
    [`hubungan_kk${sfx}`]: toTitleCaseIndonesian(person.hubungan_kk || 'Kepala Keluarga'),
    [`shdk${sfx}`]: toTitleCaseIndonesian(person.hubungan_kk || 'Kepala Keluarga'),
  };

  if (!suffix) {
    map.nama_ayah = toTitleCaseIndonesian(person.nama_ayah || '-');
    map.nik_ayah = person.nik_ayah || '-';
    map.nama_ibu = toTitleCaseIndonesian(person.nama_ibu || '-');
    map.nik_ibu = person.nik_ibu || '-';
    map.form_nama_non_warga = toTitleCaseIndonesian(person.nama || '-');
    map.form_nik_non_warga = person.nik || '-';
  }

  return map;
}

/**
 * Mengganti seluruh `[Kode_Isian]` di dalam HTML template sesuai aturan `TinyMCE::gantiKodeIsian` di OpenSID.
 */
export function replaceOpenSidKodeIsian(htmlTemplate: string, ctx: OpenSidRenderContext): string {
  if (!htmlTemplate) return '';
  let result = htmlTemplate;

  const now = new Date();
  const judulBersih = (ctx.judulSurat || 'KETERANGAN').replace(/^Surat\s+/i, '').trim();
  const nomorSurat = normalizeRomanNumeralsInDocNumber(
    ctx.nomorSurat ||
    formatPenomoranSuratOpenSid({
      kodeSurat: ctx.kodeSurat || '470',
      nomorUrut: 1,
      tanggal: now,
    }));

  const resolvedVillageLogo = ctx.villageLogoUrl || ctx.logoUrl || getCachedVillageLogoUrl() || '/logo-pasuruan.png';
  const logoImgHtml = ctx.logoGaruda
    ? `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/National_emblem_of_Indonesia_Garuda_Pancasila.svg/200px-National_emblem_of_Indonesia_Garuda_Pancasila.svg.png" alt="Garuda" style="width: 68px; height: auto; display: block; margin: 0 auto;" />`
    : `<img src="${resolvedVillageLogo}" onerror="this.style.display='none'" alt="Logo Desa" style="width: 68px; height: auto; display: block; margin: 0 auto;" />`;

  const effectiveQrCfg = resolveEffectiveQrSettings(ctx.qrSettings, ctx.qrCode);
  const qrImgHtml = ctx.qrCode
    ? buildOpenSidQrHtmlBlock(
      { ...effectiveQrCfg, villageLogoUrl: resolvedVillageLogo, enabled: true },
      {
        submissionId: ctx.submissionId || 'preview',
        nomorSurat,
        judulSurat: ctx.judulSurat || `Surat ${judulBersih}`,
        tanggalSurat: ctx.tanggalSurat || formatTanggalIndonesia(now),
        namaPemohon: ctx.individu?.nama || '-',
        nikPemohon: ctx.individu?.nik || '-',
        jabatanPenandatangan: ctx.jabatanPamong || 'Kepala Desa',
        namaPenandatangan: ctx.namaPamong || ctx.namaKepalaDesa,
        signerCode: ctx.signerCode || 'kades',
      },
      resolvedVillageLogo,
    )
    : '';

  const vId = getCachedVillageIdentity();
  const effectiveNamaDesa = ctx.namaDesa || vId.namaDesa || 'Sampeldes';
  const effectiveSebutanDesa = ctx.sebutanDesa || vId.sebutanDesa || 'Desa';
  const effectiveKodeDesa = ctx.kodeDesa || vId.kodeDesa || '33.01.10.2011';
  const effectiveKodePos = ctx.kodePos || vId.kodePos || '53254';
  const effectiveAlamatDesa =
    ctx.alamatDesa ||
    vId.alamatDesa ||
    `Jl. Raya ${effectiveNamaDesa} No. 01, Kec. ${vId.namaKecamatan || 'Gandrungmangu'}, Kab. ${vId.namaKabupaten || 'Cilacap'}`;
  const effectiveNamaKecamatan = ctx.namaKecamatan || vId.namaKecamatan || 'Gandrungmangu';
  const effectiveKodeKecamatan = ctx.kodeKecamatan || vId.kodeKecamatan || '33.01.10';
  const effectiveNamaCamat = ctx.namaCamat || vId.namaCamat || 'FATHURROHMAN, S.STP., M.Si.';
  const effectiveNipCamat = ctx.nipCamat || vId.nipCamat || '19780410 199803 1 004';
  const effectiveNamaDanramil = ctx.namaDanramil || vId.namaDanramil || '';
  const effectiveNrpDanramil = ctx.nrpDanramil || vId.nrpDanramil || '-';
  const effectiveJabatanDanramil = ctx.jabatanDanramil || vId.jabatanDanramil || `DANRAMIL 10 / ${effectiveNamaKecamatan.toUpperCase()}`;
  const effectiveNamaKapolsek = ctx.namaKapolsek || vId.namaKapolsek || '';
  const effectiveNrpKapolsek = ctx.nrpKapolsek || vId.nrpKapolsek || '-';
  const effectiveJabatanKapolsek = ctx.jabatanKapolsek || vId.jabatanKapolsek || `KAPOLSEK ${effectiveNamaKecamatan.toUpperCase()}`;
  const effectiveNamaKabupaten = ctx.namaKabupaten || vId.namaKabupaten || 'Cilacap';
  const effectiveKodeKabupaten = ctx.kodeKabupaten || vId.kodeKabupaten || '33.01';
  const effectiveNamaProvinsi = ctx.namaProvinsi || vId.namaProvinsi || 'Jawa Tengah';
  const effectiveKodeProvinsi = ctx.kodeProvinsi || vId.kodeProvinsi || '33';
  const defaultNamaKades = 'TUKIMAN';
  const rawNamaKades = ctx.namaKepalaDesa || vId.namaKepalaDesa || defaultNamaKades;
  const effectiveNamaKades = String(rawNamaKades).toUpperCase();
  const effectiveNipKades = ctx.nipKepalaDesa || vId.nipKepalaDesa || '-';
  const defaultNamaSekdes = 'PRIYO SUMARNO';
  const rawNamaSekdes = ctx.namaSekretarisDesa || vId.namaSekretarisDesa || defaultNamaSekdes;
  const effectiveNamaSekdes = String(rawNamaSekdes).toUpperCase();
  const effectiveNipSekdes = ctx.nipSekretarisDesa || vId.nipSekretarisDesa || '-';
  const rawNamaPamong = ctx.namaPamong || effectiveNamaKades;
  const effectiveNamaPamong = String(rawNamaPamong).toUpperCase();
  const effectiveJabatanPamong = ctx.jabatanPamong || 'Kepala Desa';

  // Deteksi penandatanganan Sekretaris Desa sesuai format contoh:
  // Kepala Desa Sampeldes
  // a.n Kepala Desa
  // (space)
  // PRIYO SUMARNO (HURUF BESAR SEMUA)
  const isSekdesSigner =
    (ctx as any).signerCode === 'sekdes' ||
    (ctx.jabatanPamong && ctx.jabatanPamong.toLowerCase().includes('sekretaris')) ||
    (ctx.atasNama && ctx.atasNama.toLowerCase().includes('sekretaris'));

  let effectiveAtasNama = ctx.atasNama;
  if (!effectiveAtasNama) {
    if (isSekdesSigner) {
      effectiveAtasNama = `Kepala ${effectiveSebutanDesa} ${effectiveNamaDesa}<br />a.n Kepala ${effectiveSebutanDesa}`;
    } else {
      effectiveAtasNama = `Kepala ${effectiveSebutanDesa} ${effectiveNamaDesa}`;
    }
  } else {
    effectiveAtasNama = effectiveAtasNama.replace(/\r?\n/g, '<br />');
    if (isSekdesSigner && !effectiveAtasNama.toLowerCase().includes('a.n')) {
      effectiveAtasNama = `Kepala ${effectiveSebutanDesa} ${effectiveNamaDesa}<br />a.n Kepala ${effectiveSebutanDesa}`;
    }
  }

  const baseMap: Record<string, string> = {
    // Surat
    judul_surat: ctx.judulSurat && ctx.judulSurat.toUpperCase().startsWith('SURAT')
      ? ctx.judulSurat.toUpperCase()
      : `SURAT ${judulBersih}`,
    nama_surat: ctx.judulSurat || `Surat ${judulBersih}`,
    format_nomor_surat: nomorSurat,
    nomor_surat: nomorSurat,
    nomor_urut: '001',
    kode_surat: ctx.kodeSurat || '470',
    tanggal_surat: ctx.tanggalSurat || formatTanggalIndonesia(now),
    tgl_surat: ctx.tanggalSurat || formatTanggalIndonesia(now),
    tanggal_surat_lengkap: `${ctx.hariSurat || getNamaHariIndonesia(now)}, ${ctx.tanggalSurat || formatTanggalIndonesia(now)}`,
    hari_surat: ctx.hariSurat || getNamaHariIndonesia(now),
    hari: ctx.hariSurat || getNamaHariIndonesia(now),
    tanggal: ctx.tanggalSurat || formatTanggalIndonesia(now),
    bulan_romawi: BULAN_ROMAWI[now.getMonth()],
    tahun: String(now.getFullYear()),
    mulai_berlaku: ctx.mulaiBerlaku || formatTanggalIndonesia(now),
    berlaku_sampai:
      ctx.berlakuSampai ||
      hitungMasaBerlakuTanggal(now, 1, 'M').berlakuSampai,
    logo_surat: logoImgHtml,
    logo_garuda: logoImgHtml,
    qr_code: /\[\s*qr_bsre\s*\]/i.test(result) ? '' : qrImgHtml,
    qr_bsre: ctx.qrCode ? qrImgHtml : '<div style="height: 50px;">&nbsp;</div>',
    logo_bsre: '[BSrE]',
    page_number: '1',
    versi: '',

    // Tag khusus peristiwa kematian (Surat Keterangan Kematian standar OpenSID)
    hari_kematian:
      ctx.formValues?.hari_kematian && ctx.formValues?.hari_kematian.toLowerCase() !== 'jumat'
        ? ctx.formValues?.hari_kematian
        : ctx.formValues?.hari_kematian?.toLowerCase() === 'jumat'
          ? "Jum'at"
          : getNamaHariIndonesia(ctx.formValues?.tanggal_kematian || ctx.formValues?.form_tanggal_kematian || now),
    tanggal_kematian: formatTanggalIndonesia(ctx.formValues?.tanggal_kematian || ctx.formValues?.form_tanggal_kematian || now),
    jam_kematian: ctx.formValues?.jam_kematian || ctx.formValues?.form_jam_kematian || '08.35 WIB',
    sebab_kematian: ctx.formValues?.sebab_kematian || ctx.formValues?.form_sebab_kematian || 'Sakit',
    yang_menerangkan: ctx.formValues?.yang_menerangkan || ctx.formValues?.yang_menerangkan_kematian || ctx.formValues?.form_yang_menerangkan || 'Dokter / Tenaga Medis',
    yang_menerangkan_kematian: ctx.formValues?.yang_menerangkan_kematian || ctx.formValues?.yang_menerangkan || ctx.formValues?.form_yang_menerangkan || 'Dokter / Tenaga Medis',
    tempat_kematian: ctx.formValues?.tempat_kematian || ctx.formValues?.form_tempat_kematian || `Pemakaman Umum Desa ${effectiveNamaDesa}`,

    // Identitas Desa & Wilayah
    nama_desa: effectiveNamaDesa,
    nama_des: effectiveNamaDesa,
    kode_desa: effectiveKodeDesa,
    kode_pos: effectiveKodePos,
    sebutan_desa: effectiveSebutanDesa,
    sebutan_dusun: 'Dusun',
    alamat_desa: effectiveAlamatDesa,
    alamat_kantor: effectiveAlamatDesa,
    email_desa: ctx.emailDesa || vId.emailDesa || 'pemdes@sampeldes.desa.id',
    telepon_desa: ctx.teleponDesa || vId.teleponDesa || '0857-4714-6302',
    website_desa: ctx.websiteDesa || vId.websiteDesa || 'https://sampeldes.desa.id',
    nama_kecamatan: effectiveNamaKecamatan,
    nama_kec: effectiveNamaKecamatan,
    kode_kecamatan: effectiveKodeKecamatan,
    sebutan_kecamatan: ctx.sebutanKecamatan || vId.sebutanKecamatan || 'Kecamatan',
    sebutan_camat: 'Camat',
    nama_camat: effectiveNamaCamat,
    nip_camat: effectiveNipCamat,
    pangkat_camat: ctx.pangkatCamat || vId.pangkatCamat || '-',
    nama_danramil: effectiveNamaDanramil || '...........................................',
    nrp_danramil: effectiveNrpDanramil,
    jabatan_danramil: effectiveJabatanDanramil,
    nama_kapolsek: effectiveNamaKapolsek || '...........................................',
    nrp_kapolsek: effectiveNrpKapolsek,
    jabatan_kapolsek: effectiveJabatanKapolsek,
    nama_kua: ctx.namaKua || vId.namaKua || `KUA Kecamatan ${effectiveNamaKecamatan}`,
    nama_kepala_kua: ctx.namaKepalaKua || vId.namaKepalaKua || '-',
    nama_kabupaten: effectiveNamaKabupaten,
    nama_kab: effectiveNamaKabupaten,
    kode_kabupaten: effectiveKodeKabupaten,
    sebutan_kabupaten: ctx.sebutanKabupaten || vId.sebutanKabupaten || 'Kabupaten',
    nama_kadis_dukcapil:
      ctx.namaKadisDukcapil ||
      vId.namaKadisDukcapil ||
      '( ........................................... )',
    nip_kadis_dukcapil:
      ctx.nipKadisDukcapil ||
      vId.nipKadisDukcapil ||
      '.......................................',
    nama_provinsi: effectiveNamaProvinsi,
    nama_prov: effectiveNamaProvinsi,
    kode_provinsi: effectiveKodeProvinsi,
    sebutan_provinsi: ctx.sebutanProvinsi || vId.sebutanProvinsi || 'Provinsi',

    // Penandatangan / Pamong
    atas_nama: effectiveAtasNama,
    jabatan: effectiveJabatanPamong,
    jabatan_desa: `${effectiveJabatanPamong} ${effectiveNamaDesa}`,
    nama_pamong: effectiveNamaPamong,
    sebutan_nip_desa: ctx.nipPamong && ctx.nipPamong !== '-' ? 'NIP' : 'NIAP',
    nip_pamong: ctx.nipPamong || ctx.niapPamong || effectiveNipKades || '-',
    pangkat_pamong: ctx.pangkatPamong || vId.pangkatKepalaDesa || '-',
    nama_kepala_desa: effectiveNamaKades,
    nip_kepala_desa: effectiveNipKades,
    nama_sekretaris_desa: effectiveNamaSekdes,
    nip_sekretaris_desa: effectiveNipSekdes,
  };

  // Individu utama
  const mainPerson = buildPersonReplacements(ctx.individu || {}, '');
  Object.assign(baseMap, mainPerson);

  // Pelaku bagian tambahan (ayah, ibu, saksi_i, saksi_ii, pembeli, pasangan, anak, dll.)
  if (ctx.pelakuBagian) {
    for (const [secKey, personData] of Object.entries(ctx.pelakuBagian)) {
      if (!personData) continue;
      const secMap = buildPersonReplacements(personData, secKey);
      Object.assign(baseMap, secMap);
    }
  }

  // Form values dinamis
  if (ctx.formValues) {
    for (const [rawKey, val] of Object.entries(ctx.formValues)) {
      const cleanKey = rawKey.replace(/^\[|\]$/g, '').trim().toLowerCase();
      if (!cleanKey) continue;
      const strVal = String(val ?? '');
      // Pertahankan angka murni atau field NIK/KK/nomor telepon, lainnya Title Case
      const formattedVal =
        /^\d+$/.test(strVal) || cleanKey.includes('nik') || cleanKey.includes('kk') || cleanKey.includes('telepon') || cleanKey.includes('phone')
          ? strVal
          : toTitleCaseIndonesian(strVal);
      baseMap[cleanKey] = formattedVal;
      if (!cleanKey.startsWith('form_')) {
        baseMap[`form_${cleanKey}`] = formattedVal;
      }
    }
  }

  // Penyesuaian khusus untuk Surat Pernyataan Belum Memiliki Akta Lahir (SPTJM)
  const isSuratBelumAkta =
    (ctx.judulSurat || '').toLowerCase().includes('belum memiliki akta') ||
    (ctx.judulSurat || '').toLowerCase().includes('sptjm') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-19';

  if (isSuratBelumAkta) {
    const targetPengajuan =
      baseMap.targetPengajuan ||
      baseMap.peruntukanPengajuan ||
      (ctx.formValues && (ctx.formValues.targetPengajuan || ctx.formValues.peruntukanPengajuan)) ||
      'anak';

    if (baseMap.form_nama_ibu && baseMap.form_nama_ibu !== '-') {
      baseMap.nama_ibu = baseMap.form_nama_ibu;
    }
    if (baseMap.form_nik_ibu && baseMap.form_nik_ibu !== '-') {
      baseMap.nik_ibu = baseMap.form_nik_ibu;
    }
    if (baseMap.form_nama_ayah && baseMap.form_nama_ayah !== '-') {
      baseMap.nama_ayah = baseMap.form_nama_ayah;
    }
    if (baseMap.form_nik_ayah && baseMap.form_nik_ayah !== '-') {
      baseMap.nik_ayah = baseMap.form_nik_ayah;
    }

    if (targetPengajuan === 'diri_sendiri') {
      // Subjek surat yang belum memiliki akta kelahiran adalah diri pemohon sendiri
      if (ctx.individu?.nama) baseMap.nama = ctx.individu.nama;
      if (ctx.individu?.nik) baseMap.nik = ctx.individu.nik;
      if (ctx.individu?.tempat_lahir && ctx.individu?.tanggal_lahir) {
        baseMap.ttl = `${ctx.individu.tempat_lahir}, ${formatTanggalIndonesia(ctx.individu.tanggal_lahir)}`;
      }
      if (ctx.individu?.alamat) {
        baseMap.alamat_lengkap = ctx.individu.alamat;
        baseMap.alamat = ctx.individu.alamat;
      }
      if (ctx.individu?.jenis_kelamin) {
        baseMap.jenis_kelamin = ctx.individu.jenis_kelamin;
        baseMap.sex = ctx.individu.jenis_kelamin;
      }
    } else {
      // Subjek surat adalah anak / pasangan / keluarga lain yang diajukan
      if (baseMap.form_nama_anak && baseMap.form_nama_anak !== '-') {
        baseMap.nama = baseMap.form_nama_anak;
        const tLahir = baseMap.form_tempat_lahir_anak || '';
        const dLahir = baseMap.form_tanggal_lahir_anak ? formatTanggalIndonesia(baseMap.form_tanggal_lahir_anak) : '';
        if (tLahir || dLahir) {
          baseMap.ttl = [tLahir, dLahir].filter(Boolean).join(', ');
        }
        if (baseMap.form_alamat_anak && baseMap.form_alamat_anak !== '-') {
          baseMap.alamat_lengkap = baseMap.form_alamat_anak;
          baseMap.alamat = baseMap.form_alamat_anak;
        }
      }
    }
  }

  // Penyesuaian khusus untuk Surat Permohonan Duplikat Akta Kelahiran
  const isSuratDuplikatAkta =
    (ctx.judulSurat || '').toLowerCase().includes('duplikat akta kelahiran') ||
    (ctx.judulSurat || '').toLowerCase().includes('duplikat kelahiran') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-20';

  if (isSuratDuplikatAkta) {
    // 1. Data Akta Kelahiran yang dimohonkan
    const namaAnak = baseMap.form_nama_anak || baseMap.nama_anak || baseMap.nama || '-';
    const nikAnak = baseMap.form_nik_anak || baseMap.nik_anak || baseMap.nik || '-';
    const noAkta = baseMap.form_no_akta_kelahiran || baseMap.no_akta_kelahiran || baseMap.form_no_akta || '-';
    const noAktaNikah = baseMap.form_no_akta_nikah || baseMap.no_akta_nikah || '-';
    const tglAktaNikah = baseMap.form_tgl_akta_nikah
      ? formatTanggalIndonesia(baseMap.form_tgl_akta_nikah)
      : (baseMap.tgl_akta_nikah ? formatTanggalIndonesia(baseMap.tgl_akta_nikah) : '-');
    const hubunganYbs = baseMap.form_hubungan_dengan_ybs || baseMap.hubungan_pelapor || 'Orang Tua / Pemohon';

    baseMap.form_nama_anak = namaAnak;
    baseMap.form_nik_anak = nikAnak;
    baseMap.form_no_akta_kelahiran = noAkta;
    baseMap.form_no_akta_nikah = noAktaNikah;
    baseMap.form_tgl_akta_nikah = tglAktaNikah;
    baseMap.form_hubungan_dengan_ybs = hubunganYbs;

    // 2. Checklist Ralat / Duplikat (Default dicentang pada Akta Rusak/Hilang)
    baseMap.centang_rusak_hilang = '✓';
    baseMap.form_ralat_rusak_hilang_lama = baseMap.form_ralat_rusak_hilang_lama || (noAkta !== '-' ? noAkta : 'Hilang / Rusak');
    baseMap.form_ralat_rusak_hilang_baru = baseMap.form_ralat_rusak_hilang_baru || 'Penerbitan Kutipan Duplikat Akta Kelahiran';

    // Ralat lainnya default string kosong "" agar tidak ada teks &NBSP di dalam kotak
    baseMap.centang_nama_anak = baseMap.form_ralat_nama_anak_baru ? '✓' : '';
    baseMap.form_ralat_nama_anak_lama = baseMap.form_ralat_nama_anak_lama || '................................................';
    baseMap.form_ralat_nama_anak_baru = baseMap.form_ralat_nama_anak_baru || '................................................';

    baseMap.centang_nama_ayah = baseMap.form_ralat_nama_ayah_baru ? '✓' : '';
    baseMap.form_ralat_nama_ayah_lama = baseMap.form_ralat_nama_ayah_lama || '................................................';
    baseMap.form_ralat_nama_ayah_baru = baseMap.form_ralat_nama_ayah_baru || '................................................';

    baseMap.centang_nama_ibu = baseMap.form_ralat_nama_ibu_baru ? '✓' : '';
    baseMap.form_ralat_nama_ibu_lama = baseMap.form_ralat_nama_ibu_lama || '................................................';
    baseMap.form_ralat_nama_ibu_baru = baseMap.form_ralat_nama_ibu_baru || '................................................';

    baseMap.centang_sex = baseMap.form_ralat_sex_baru ? '✓' : '';
    baseMap.form_ralat_sex_lama = baseMap.form_ralat_sex_lama || '................................................';
    baseMap.form_ralat_sex_baru = baseMap.form_ralat_sex_baru || '................................................';

    baseMap.centang_tempat_lahir = baseMap.form_ralat_tempat_lahir_baru ? '✓' : '';
    baseMap.form_ralat_tempat_lahir_lama = baseMap.form_ralat_tempat_lahir_lama || '................................................';
    baseMap.form_ralat_tempat_lahir_baru = baseMap.form_ralat_tempat_lahir_baru || '................................................';

    baseMap.centang_tanggal_lahir = baseMap.form_ralat_tanggal_lahir_baru ? '✓' : '';
    baseMap.form_ralat_tanggal_lahir_lama = baseMap.form_ralat_tanggal_lahir_lama || '................................................';
    baseMap.form_ralat_tanggal_lahir_baru = baseMap.form_ralat_tanggal_lahir_baru || '................................................';

    baseMap.centang_anak_ke = baseMap.form_ralat_anak_ke_baru ? '✓' : '';
    baseMap.form_ralat_anak_ke_lama = baseMap.form_ralat_anak_ke_lama || '................................................';
    baseMap.form_ralat_anak_ke_baru = baseMap.form_ralat_anak_ke_baru || '................................................';
  }

  // Penyesuaian khusus untuk Surat Biodata Penduduk (F-1.01)
  const isSuratBiodata =
    (ctx.judulSurat || '').toLowerCase().includes('biodata penduduk') ||
    (ctx.judulSurat || '').toLowerCase().includes('f-1.01') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-03';

  if (isSuratBiodata) {
    // 1. Data Kepala Keluarga (utamakan nama kepala KK jika ada, atau nama pemohon jika berstatus Kepala Keluarga)
    const rawKk = (ctx.individu?.kepala_kk || '').trim();
    const indNama = (ctx.individu?.nama || '').trim();
    const isKepala = (ctx.individu?.hubungan_kk || '').toUpperCase().includes('KEPALA');
    const safeKepala =
      baseMap.form_kepala_kk ||
      baseMap.kepala_kk ||
      (rawKk && rawKk !== '-' && rawKk !== '.' ? rawKk : (isKepala ? indNama : (ctx.requesterName || indNama || '-')));
    baseMap.kepala_kk = toTitleCaseIndonesian(safeKepala);
    baseMap.form_kepala_kk = toTitleCaseIndonesian(safeKepala);

    // 2. Tempat Lahir & TTL (pastikan [tempatlahir] tanpa garis bawah terpeta presisi)
    const tempatLahirClean = ctx.individu?.tempat_lahir || baseMap.tempat_lahir || '-';
    baseMap.tempatlahir = toTitleCaseIndonesian(tempatLahirClean);
    baseMap.tempat_lahir = toTitleCaseIndonesian(tempatLahirClean);

    // 3. Alamat Sebelumnya
    const almtSblm = baseMap.form_alamat_sebelumnya || baseMap.alamat_sebelumnya || '-';
    baseMap.alamat_sebelumnya = toTitleCaseIndonesian(almtSblm);
    baseMap.form_alamat_sebelumnya = toTitleCaseIndonesian(almtSblm);

    // 4. Nomor Paspor & Masa Berlaku
    const paspor =
      baseMap.form_dokumen_pasport ||
      baseMap.form_no_paspor ||
      baseMap.form_paspor ||
      baseMap.dokumen_pasport ||
      baseMap.paspor ||
      '-';
    baseMap.dokumen_pasport = paspor;
    baseMap.form_dokumen_pasport = paspor;
    baseMap.paspor = paspor;

    const tglPaspor =
      baseMap.form_tanggal_akhir_paspor ||
      baseMap.form_tgl_paspor ||
      baseMap.tanggal_akhir_paspor ||
      baseMap.tgl_paspor ||
      '-';
    const tglPasporFmt =
      tglPaspor && tglPaspor !== '-'
        ? (normalizeDateInput(tglPaspor) ? formatTanggalIndonesia(tglPaspor) : tglPaspor)
        : '-';
    baseMap.tanggal_akhir_paspor = tglPasporFmt;
    baseMap.form_tanggal_akhir_paspor = tglPasporFmt;
    baseMap.tgl_paspor = tglPasporFmt;

    // 5. Akta Kelahiran
    const aktaLahir =
      baseMap.form_akta_lahir ||
      baseMap.form_no_akta_lahir ||
      baseMap.akta_lahir ||
      baseMap.no_akta_lahir ||
      '-';
    baseMap.akta_lahir = aktaLahir;
    baseMap.form_akta_lahir = aktaLahir;

    // 6. Akta Perkawinan & Tanggal Perkawinan
    const aktaKawin =
      baseMap.form_akta_perkawinan ||
      baseMap.form_no_akta_kawin ||
      baseMap.form_no_akta_perkawinan ||
      baseMap.akta_perkawinan ||
      baseMap.no_akta_kawin ||
      '-';
    baseMap.akta_perkawinan = aktaKawin;
    baseMap.form_akta_perkawinan = aktaKawin;

    const tglKawin =
      baseMap.form_tanggalperkawinan ||
      baseMap.form_tanggal_perkawinan ||
      baseMap.form_tgl_kawin ||
      baseMap.tanggalperkawinan ||
      baseMap.tgl_kawin ||
      '-';
    const tglKawinFmt =
      tglKawin && tglKawin !== '-'
        ? (normalizeDateInput(tglKawin) ? formatTanggalIndonesia(tglKawin) : tglKawin)
        : '-';
    baseMap.tanggalperkawinan = tglKawinFmt;
    baseMap.form_tanggalperkawinan = tglKawinFmt;
    baseMap.tanggal_perkawinan = tglKawinFmt;

    // 7. Akta Perceraian & Tanggal Perceraian
    const aktaCerai =
      baseMap.form_akta_perceraian ||
      baseMap.form_no_akta_cerai ||
      baseMap.akta_perceraian ||
      baseMap.no_akta_cerai ||
      '-';
    baseMap.akta_perceraian = aktaCerai;
    baseMap.form_akta_perceraian = aktaCerai;

    const tglCerai =
      baseMap.form_tanggalperceraian ||
      baseMap.form_tanggal_perceraian ||
      baseMap.form_tgl_cerai ||
      baseMap.tanggalperceraian ||
      baseMap.tgl_cerai ||
      '-';
    const tglCeraiFmt =
      tglCerai && tglCerai !== '-'
        ? (normalizeDateInput(tglCerai) ? formatTanggalIndonesia(tglCerai) : tglCerai)
        : '-';
    baseMap.tanggalperceraian = tglCeraiFmt;
    baseMap.form_tanggalperceraian = tglCeraiFmt;
    baseMap.tanggal_perceraian = tglCeraiFmt;

    // 8. Kelainan Fisik / Mental (Cacat)
    const cacat =
      baseMap.form_cacat ||
      baseMap.form_kelainan_fisik_mental ||
      baseMap.cacat ||
      'Tidak Ada';
    baseMap.cacat = toTitleCaseIndonesian(cacat);
    baseMap.form_cacat = toTitleCaseIndonesian(cacat);

    // 9. NIK & Nama Orang Tua
    baseMap.nama_ibu = toTitleCaseIndonesian(baseMap.form_nama_ibu || baseMap.nama_ibu || ctx.individu?.nama_ibu || '-');
    baseMap.nik_ibu = baseMap.form_nik_ibu || baseMap.nik_ibu || ctx.individu?.nik_ibu || '-';
    baseMap.nama_ayah = toTitleCaseIndonesian(baseMap.form_nama_ayah || baseMap.nama_ayah || ctx.individu?.nama_ayah || '-');
    baseMap.nik_ayah = baseMap.form_nik_ayah || baseMap.nik_ayah || ctx.individu?.nik_ayah || '-';
  }

  // Penyesuaian khusus untuk Surat Keterangan / Pernyataan Beda Nama
  const isSuratBedaNama =
    (ctx.judulSurat || '').toLowerCase().includes('beda nama') ||
    (ctx.judulSurat || '').toLowerCase().includes('beda identitas') ||
    (ctx.kodeSurat || '').toLowerCase() === '471.1';

  if (isSuratBedaNama) {
    // 1. Dokumen 1 (Acuan Utama)
    const rawDoc1Name =
      baseMap.form_nama_dokumen_1 ||
      baseMap.form_doc1name ||
      baseMap.form_jenis_dokumen_1 ||
      baseMap.doc1name ||
      baseMap.jenis_dokumen_1 ||
      'Kartu Tanda Penduduk';
    const doc1Name = toTitleCaseIndonesian(rawDoc1Name);
    baseMap.form_nama_dokumen_1 = doc1Name;
    baseMap.nama_dokumen_1 = doc1Name;

    // Nama/data pada dokumen 1
    const rawDoc1Data =
      baseMap.form_nama_di_dokumen_1 ||
      baseMap.form_doc1data ||
      baseMap.doc1data ||
      baseMap.nama_di_dokumen_1 ||
      ctx.individu?.nama ||
      baseMap.nama ||
      '-';
    const doc1Data = rawDoc1Data !== '-' ? toTitleCaseIndonesian(rawDoc1Data) : '-';
    baseMap.form_nama_di_dokumen_1 = doc1Data;
    baseMap.nama_di_dokumen_1 = doc1Data;

    // Dokumen 1 Lengkap (mis. "Kartu Tanda Penduduk (KTP)" jika KTP)
    const doc1Lengkap =
      doc1Name.toLowerCase().includes('ktp') || doc1Name.toLowerCase().includes('kartu tanda penduduk')
        ? 'Kartu Tanda Penduduk (KTP)'
        : doc1Name;
    baseMap.form_nama_dokumen_1_lengkap = doc1Lengkap;
    baseMap.nama_dokumen_1_lengkap = doc1Lengkap;

    // 2. Dokumen 2 (Jenis Dokumen 2 - Misal: Ijazah / Buku Nikah / dll)
    const rawDoc2Name =
      baseMap.form_nama_kartu_identitas ||
      baseMap.form_jenis_dokumen_2 ||
      baseMap.form_doc2name ||
      baseMap.nama_kartu_identitas ||
      baseMap.jenis_dokumen_2 ||
      baseMap.doc2name ||
      'Ijazah';
    const doc2Name = toTitleCaseIndonesian(rawDoc2Name);
    baseMap.form_nama_kartu_identitas = doc2Name;
    baseMap.nama_kartu_identitas = doc2Name;
    baseMap.form_jenis_dokumen_2 = doc2Name;
    baseMap.jenis_dokumen_2 = doc2Name;

    // Nama/data pada dokumen 2
    const rawDoc2Data =
      baseMap.form_nama_di_dokumen_2 ||
      baseMap.form_doc2data ||
      baseMap.doc2data ||
      baseMap.form_nama ||
      baseMap.nama_di_dokumen_2 ||
      '-';
    const doc2Data = rawDoc2Data !== '-' ? toTitleCaseIndonesian(rawDoc2Data) : '-';
    baseMap.form_nama_di_dokumen_2 = doc2Data;
    baseMap.nama_di_dokumen_2 = doc2Data;
  }

  // Penyesuaian khusus untuk Surat Keterangan Moyang
  const isSuratMoyang =
    (ctx.judulSurat || '').toLowerCase().includes('moyang') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-moyang';

  if (isSuratMoyang) {
    const rawNamaMoyang =
      baseMap.form_nama_moyang ||
      baseMap.nama_moyang ||
      baseMap.moyangname ||
      (ctx.pelakuBagian?.moyang?.nama) ||
      '';
    const namaMoyang = rawNamaMoyang ? toTitleCaseIndonesian(rawNamaMoyang) : '';

    const rawHubunganMoyang =
      baseMap.form_hubungan_moyang ||
      baseMap.hubungan_moyang ||
      baseMap.moyangrelation ||
      '';
    const hubunganMoyang = rawHubunganMoyang ? toTitleCaseIndonesian(rawHubunganMoyang) : '';

    let statusMoyang =
      baseMap.form_keterangan_status_moyang ||
      baseMap.form_keterangan_status ||
      baseMap.keteranganstatus ||
      baseMap.keterangan_status_moyang ||
      baseMap.keterangan_status ||
      '';

    if (!statusMoyang || statusMoyang === '[Form_keterangan_status_moyang]') {
      if (namaMoyang) {
        statusMoyang = `Bahwa orang tersebut di atas adalah benar-benar penduduk Desa ${effectiveNamaDesa} dan merupakan garis keturunan / keluarga dari ${namaMoyang}${hubunganMoyang ? ` (${hubunganMoyang})` : ''}.`;
      } else {
        statusMoyang = `Bahwa orang tersebut di atas adalah benar-benar penduduk Desa ${effectiveNamaDesa}.`;
      }
    }
    baseMap.form_keterangan_status_moyang = statusMoyang;
    baseMap.keterangan_status_moyang = statusMoyang;

    let keteranganTambahan =
      baseMap.form_keterangan_tambahan ||
      baseMap.keterangantambahan ||
      baseMap.keterangan_tambahan ||
      '';

    if (keteranganTambahan === '[Form_keterangan_tambahan]') {
      keteranganTambahan = '';
    }
    baseMap.form_keterangan_tambahan = keteranganTambahan;
    baseMap.keterangan_tambahan = keteranganTambahan;

    let keperluanMoyang =
      baseMap.form_keperluan ||
      baseMap.keperluan ||
      ctx.requesterPurpose ||
      '';
    if (!keperluanMoyang || keperluanMoyang === '[form_keperluan]') {
      keperluanMoyang = 'Pembuatan Akta Kelahiran di Kantor Disdukcapil';
    }
    baseMap.form_keperluan = keperluanMoyang;
    baseMap.keperluan = keperluanMoyang;
  }

  // Penyesuaian khusus untuk Surat Keterangan Wali (Wali Siswa / Anak / PIP)
  const isSuratWali =
    ((ctx.judulSurat || '').toLowerCase().includes('keterangan wali') ||
      (ctx.kodeSurat || '').toLowerCase() === 's-wali' ||
      (ctx.kodeSurat || '').toLowerCase() === '420') &&
    !(ctx.judulSurat || '').toLowerCase().includes('hakim');

  if (isSuratWali) {
    // 1. Data Wali (Kepala Keluarga)
    const namaWali = baseMap.form_nama_wali || baseMap.nama_wali || baseMap.nama || ctx.requesterName || '-';
    const nikWali = baseMap.form_nik_wali || baseMap.nik_wali || baseMap.nik || '-';
    const ttlWali = baseMap.form_ttl_wali || baseMap.ttl_wali || baseMap.tempat_tanggal_lahir || '-';
    const jenisKelaminWali = baseMap.form_jenis_kelamin_wali || baseMap.jenis_kelamin_wali || baseMap.jenis_kelamin || baseMap.sex || 'Perempuan';
    const agamaWali = baseMap.form_agama_wali || baseMap.agama_wali || baseMap.agama || 'Islam';
    const pekerjaanWali = baseMap.form_pekerjaan_wali || baseMap.pekerjaan_wali || baseMap.pekerjaan || 'Mengurus Rumah Tangga';
    const alamatWali = baseMap.form_alamat_wali || baseMap.alamat_wali || baseMap.alamat_lengkap || baseMap.alamat || '-';

    baseMap.nama_wali = namaWali;
    baseMap.form_nama_wali = namaWali;
    baseMap.nik_wali = nikWali;
    baseMap.form_nik_wali = nikWali;
    baseMap.ttl_wali = ttlWali;
    baseMap.form_ttl_wali = ttlWali;
    baseMap.jenis_kelamin_wali = jenisKelaminWali;
    baseMap.form_jenis_kelamin_wali = jenisKelaminWali;
    baseMap.agama_wali = agamaWali;
    baseMap.form_agama_wali = agamaWali;
    baseMap.pekerjaan_wali = pekerjaanWali;
    baseMap.form_pekerjaan_wali = pekerjaanWali;
    baseMap.alamat_wali = alamatWali;
    baseMap.form_alamat_wali = alamatWali;

    // 2. Data Siswa / Anak
    const namaAnak = baseMap.form_nama_anak || baseMap.nama_anak || baseMap.nama_siswa || '-';
    const ttlAnak = baseMap.form_ttl_anak || baseMap.ttl_anak || baseMap.tempat_tanggal_lahir_anak || '-';
    const noKkAnak = baseMap.form_no_kk_anak || baseMap.no_kk_anak || baseMap.no_kk || '-';
    const nikAnak = baseMap.form_nik_anak || baseMap.nik_anak || '-';
    const ayahAnak = baseMap.form_nama_ayah_kandung || baseMap.nama_ayah_kandung || baseMap.ayah_kandung || '-';
    const ibuAnak = baseMap.form_nama_ibu_kandung || baseMap.nama_ibu_kandung || baseMap.ibu_kandung || '-';
    const jenisKelaminAnak = baseMap.form_jenis_kelamin_anak || baseMap.jenis_kelamin_anak || 'Perempuan';
    const agamaAnak = baseMap.form_agama_anak || baseMap.agama_anak || 'Islam';
    const pekerjaanAnak = baseMap.form_pekerjaan_anak || baseMap.pekerjaan_anak || 'Pelajar';
    const sekolahAnak = baseMap.form_nama_sekolah || baseMap.nama_sekolah || '-';
    const kelasAnak = baseMap.form_kelas_anak || baseMap.kelas_anak || '-';
    const alamatAnak = baseMap.form_alamat_anak || baseMap.alamat_anak || alamatWali;

    baseMap.nama_anak = namaAnak;
    baseMap.form_nama_anak = namaAnak;
    baseMap.ttl_anak = ttlAnak;
    baseMap.form_ttl_anak = ttlAnak;
    baseMap.no_kk_anak = noKkAnak;
    baseMap.form_no_kk_anak = noKkAnak;
    baseMap.nik_anak = nikAnak;
    baseMap.form_nik_anak = nikAnak;
    baseMap.nama_ayah_kandung = ayahAnak;
    baseMap.form_nama_ayah_kandung = ayahAnak;
    baseMap.nama_ibu_kandung = ibuAnak;
    baseMap.form_nama_ibu_kandung = ibuAnak;
    baseMap.jenis_kelamin_anak = jenisKelaminAnak;
    baseMap.form_jenis_kelamin_anak = jenisKelaminAnak;
    baseMap.agama_anak = agamaAnak;
    baseMap.form_agama_anak = agamaAnak;
    baseMap.pekerjaan_anak = pekerjaanAnak;
    baseMap.form_pekerjaan_anak = pekerjaanAnak;
    baseMap.nama_sekolah = sekolahAnak;
    baseMap.form_nama_sekolah = sekolahAnak;
    baseMap.kelas_anak = kelasAnak;
    baseMap.form_kelas_anak = kelasAnak;
    baseMap.alamat_anak = alamatAnak;
    baseMap.form_alamat_anak = alamatAnak;

    // 3. Keperluan
    let keperluanWali =
      baseMap.form_keperluan ||
      baseMap.keperluan ||
      ctx.requesterPurpose ||
      '';
    if (!keperluanWali || keperluanWali === '[form_keperluan]') {
      keperluanWali = 'Pengambilan/Pencairan Bantuan Program Indonesia Pintar (PIP)';
    }
    baseMap.form_keperluan = keperluanWali;
    baseMap.keperluan = keperluanWali;
  }

  // Penyesuaian khusus untuk Surat Keterangan / Pengantar Nikah (N-1 - N-4 / Numpang Nikah / Nikah Non-Muslim)
  const isSuratNikahContext =
    (ctx.judulSurat || '').toLowerCase().includes('pengantar nikah') ||
    (ctx.judulSurat || '').toLowerCase().includes('keterangan nikah') ||
    (ctx.judulSurat || '').toLowerCase().includes('untuk nikah') ||
    (ctx.judulSurat || '').toLowerCase().includes('pergi kawin') ||
    (ctx.judulSurat || '').toLowerCase().includes('numpang nikah') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-23' ||
    (ctx.kodeSurat || '').toLowerCase() === 's-30' ||
    (ctx.kodeSurat || '').toLowerCase() === 's-31' ||
    (ctx.kodeSurat || '').toLowerCase() === '474.2' ||
    result.includes('[Form_ttl_ayah]') ||
    result.includes('[Form_nama_calon_pasangan]');

  const formatTtlLahirHelper = (tempat?: string, tanggal?: string) => {
    const cleanTmp = (tempat || '').trim();
    const cleanTgl = (tanggal || '').trim();
    const fmtTmp = cleanTmp && cleanTmp !== '-' ? toTitleCaseIndonesian(cleanTmp) : '';
    let fmtTgl = '';
    if (cleanTgl && cleanTgl !== '-') {
      const norm = normalizeDateInput(cleanTgl);
      fmtTgl = norm ? formatTanggalIndonesia(norm) : cleanTgl;
    }
    if (fmtTmp && fmtTgl) return `${fmtTmp}, ${fmtTgl}`;
    if (fmtTmp) return fmtTmp;
    if (fmtTgl) return fmtTgl;
    return '-';
  };

  if (isSuratNikahContext) {
    const isMalePemohon = (ctx.individu?.jenis_kelamin || baseMap.jenis_kelamin || '').toLowerCase().includes('laki');

    // TTL Ayah
    const tmpLahirAyah = baseMap.form_tempat_lahir_ayah || baseMap.tempat_lahir_ayah || ctx.pelakuBagian?.ayah?.tempat_lahir || '';
    const tglLahirAyah = baseMap.form_tanggal_lahir_ayah || baseMap.tanggal_lahir_ayah || ctx.pelakuBagian?.ayah?.tanggal_lahir || '';
    const ttlAyah = baseMap.form_ttl_ayah || baseMap.ttl_ayah || formatTtlLahirHelper(tmpLahirAyah, tglLahirAyah);
    baseMap.form_ttl_ayah = ttlAyah;
    baseMap.ttl_ayah = ttlAyah;

    // TTL Ibu
    const tmpLahirIbu = baseMap.form_tempat_lahir_ibu || baseMap.tempat_lahir_ibu || ctx.pelakuBagian?.ibu?.tempat_lahir || '';
    const tglLahirIbu = baseMap.form_tanggal_lahir_ibu || baseMap.tanggal_lahir_ibu || ctx.pelakuBagian?.ibu?.tanggal_lahir || '';
    const ttlIbu = baseMap.form_ttl_ibu || baseMap.ttl_ibu || formatTtlLahirHelper(tmpLahirIbu, tglLahirIbu);
    baseMap.form_ttl_ibu = ttlIbu;
    baseMap.ttl_ibu = ttlIbu;

    // Data Calon Pasangan
    const namaPasangan =
      baseMap.form_nama_calon_pasangan ||
      baseMap.form_nama_pasangan ||
      baseMap.nama_calon_pasangan ||
      baseMap.nama_pasangan ||
      ctx.pelakuBagian?.pasangan?.nama ||
      ctx.pelakuBagian?.calon_pasangan?.nama ||
      '-';
    baseMap.form_nama_calon_pasangan = namaPasangan;
    baseMap.form_nama_pasangan = namaPasangan;
    baseMap.nama_calon_pasangan = namaPasangan;
    baseMap.nama_pasangan = namaPasangan;

    const nikPasangan =
      baseMap.form_nik_calon_pasangan ||
      baseMap.form_nik_pasangan ||
      baseMap.nik_calon_pasangan ||
      baseMap.nik_pasangan ||
      ctx.pelakuBagian?.pasangan?.nik ||
      ctx.pelakuBagian?.calon_pasangan?.nik ||
      '-';
    baseMap.form_nik_calon_pasangan = nikPasangan;
    baseMap.form_nik_pasangan = nikPasangan;
    baseMap.nik_calon_pasangan = nikPasangan;
    baseMap.nik_pasangan = nikPasangan;

    const binPasangan =
      baseMap.form_bin_calon_pasangan ||
      baseMap.form_bin_pasangan ||
      baseMap.bin_calon_pasangan ||
      baseMap.bin_pasangan ||
      ctx.pelakuBagian?.pasangan?.nama_ayah ||
      ctx.pelakuBagian?.calon_pasangan?.nama_ayah ||
      '-';
    baseMap.form_bin_calon_pasangan = binPasangan;
    baseMap.form_bin_pasangan = binPasangan;
    baseMap.bin_calon_pasangan = binPasangan;
    baseMap.bin_pasangan = binPasangan;

    const labelBinPasangan = isMalePemohon ? 'Binti' : 'Bin';
    baseMap.form_label_bin_pasangan = labelBinPasangan;
    baseMap.label_bin_pasangan = labelBinPasangan;

    const tmpLahirPasangan =
      baseMap.form_tempat_lahir_pasangan ||
      baseMap.tempat_lahir_pasangan ||
      ctx.pelakuBagian?.pasangan?.tempat_lahir ||
      ctx.pelakuBagian?.calon_pasangan?.tempat_lahir ||
      '';
    const tglLahirPasangan =
      baseMap.form_tanggal_lahir_pasangan ||
      baseMap.tanggal_lahir_pasangan ||
      ctx.pelakuBagian?.pasangan?.tanggal_lahir ||
      ctx.pelakuBagian?.calon_pasangan?.tanggal_lahir ||
      '';
    const ttlPasangan = baseMap.form_ttl_pasangan || baseMap.ttl_pasangan || formatTtlLahirHelper(tmpLahirPasangan, tglLahirPasangan);
    baseMap.form_ttl_pasangan = ttlPasangan;
    baseMap.ttl_pasangan = ttlPasangan;

    const wnPasangan =
      baseMap.form_warga_negara_pasangan ||
      baseMap.form_wn_pasangan ||
      baseMap.warga_negara_pasangan ||
      ctx.pelakuBagian?.pasangan?.warga_negara ||
      'WNI';
    baseMap.form_warga_negara_pasangan = wnPasangan;
    baseMap.form_wn_pasangan = wnPasangan;
    baseMap.warga_negara_pasangan = wnPasangan;

    const agamaPasangan =
      baseMap.form_agama_pasangan ||
      baseMap.agama_pasangan ||
      ctx.pelakuBagian?.pasangan?.agama ||
      'Islam';
    baseMap.form_agama_pasangan = agamaPasangan;
    baseMap.agama_pasangan = agamaPasangan;

    const pekerjaanPasangan =
      baseMap.form_pekerjaan_pasangan ||
      baseMap.pekerjaan_pasangan ||
      ctx.pelakuBagian?.pasangan?.pekerjaan ||
      '-';
    baseMap.form_pekerjaan_pasangan = pekerjaanPasangan;
    baseMap.pekerjaan_pasangan = pekerjaanPasangan;

    const statusPasangan =
      baseMap.form_status_pasangan ||
      baseMap.status_pasangan ||
      ctx.pelakuBagian?.pasangan?.status_kawin ||
      (isMalePemohon ? 'Perawan' : 'Jejaka');
    baseMap.form_status_pasangan = statusPasangan;
    baseMap.status_pasangan = statusPasangan;

    const alamatPasangan =
      baseMap.form_alamat_pasangan ||
      baseMap.alamat_pasangan ||
      ctx.pelakuBagian?.pasangan?.alamat ||
      '-';
    baseMap.form_alamat_pasangan = alamatPasangan;
    baseMap.alamat_pasangan = alamatPasangan;

    const kuaTujuan =
      baseMap.form_kua_tujuan ||
      baseMap.kua_tujuan ||
      baseMap.form_tempat_nikah ||
      `KUA Kecamatan ${effectiveNamaKecamatan}`;
    baseMap.form_kua_tujuan = kuaTujuan;
    baseMap.kua_tujuan = kuaTujuan;
  }

  // Penyesuaian khusus untuk Surat Keterangan Nikah Non-Muslim
  const isSuratNikahNonMuslimContext =
    (ctx.judulSurat || '').toLowerCase().includes('non-muslim') ||
    (ctx.judulSurat || '').toLowerCase().includes('non muslim') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-50' ||
    result.includes('WARGA NON MUSLIM') ||
    result.includes('[Nama_cpW]');

  if (isSuratNikahNonMuslimContext) {
    const isPemohonPria = (ctx.individu?.jenis_kelamin || baseMap.jenis_kelamin || '').toLowerCase().includes('laki');

    // Suami (Mempelai Pria)
    if (!isPemohonPria) {
      const namaSuami = baseMap.form_nama_calon_suami || baseMap.form_nama_pasangan || baseMap.nama_pasangan || ctx.pelakuBagian?.pasangan?.nama || '';
      if (namaSuami) {
        baseMap.nama = toTitleCaseIndonesian(namaSuami);
        baseMap.form_nama_calon_suami = toTitleCaseIndonesian(namaSuami);
      }
      const nikSuami = baseMap.form_nik_calon_suami || baseMap.form_nik_pasangan || baseMap.nik_pasangan || ctx.pelakuBagian?.pasangan?.nik || '';
      if (nikSuami) baseMap.nik = nikSuami;
      const kkSuami = baseMap.form_no_kk_calon_suami || baseMap.form_no_kk_pasangan || ctx.pelakuBagian?.pasangan?.no_kk || '';
      if (kkSuami) baseMap.no_kk = kkSuami;
      const tmpSuami = baseMap.form_tempat_lahir_calon_suami || baseMap.tempat_lahir_pasangan || ctx.pelakuBagian?.pasangan?.tempat_lahir || '';
      const tglSuami = baseMap.form_tanggal_lahir_calon_suami || baseMap.tanggal_lahir_pasangan || ctx.pelakuBagian?.pasangan?.tanggal_lahir || '';
      if (tmpSuami || tglSuami) baseMap.ttl = formatTtlLahirHelper(tmpSuami, tglSuami);
      baseMap.jenis_kelamin = 'Laki-Laki';
      const agamaSuami = baseMap.form_agama_calon_suami || baseMap.agama_pasangan || ctx.pelakuBagian?.pasangan?.agama || '';
      if (agamaSuami) baseMap.agama = toTitleCaseIndonesian(agamaSuami);
      const pekerjaanSuami = baseMap.form_pekerjaan_calon_suami || baseMap.pekerjaan_pasangan || ctx.pelakuBagian?.pasangan?.pekerjaan || '';
      if (pekerjaanSuami) baseMap.pekerjaan = pekerjaanSuami;
      const alamatSuami = baseMap.form_alamat_calon_suami || baseMap.alamat_pasangan || ctx.pelakuBagian?.pasangan?.alamat || '';
      if (alamatSuami) {
        baseMap.alamat = alamatSuami;
        baseMap.alamat_lengkap = alamatSuami;
      }
    }

    // Istri (Calon Mempelai Wanita)
    const namaIstri = isPemohonPria
      ? (baseMap.form_nama_calon_istri || baseMap.form_nama_cpw || baseMap.form_nama_pasangan || baseMap.form_nama_calon_pasangan || baseMap.nama_pasangan || ctx.pelakuBagian?.pasangan?.nama || '')
      : (ctx.individu?.nama || baseMap.nama || '');
    const nikIstri = isPemohonPria
      ? (baseMap.form_nik_calon_istri || baseMap.form_nik_cpw || baseMap.form_nik_pasangan || baseMap.nik_pasangan || ctx.pelakuBagian?.pasangan?.nik || '-')
      : (ctx.individu?.nik || baseMap.nik || '-');
    const kkIstri = isPemohonPria
      ? (baseMap.form_no_kk_calon_istri || baseMap.form_no_kk_cpw || baseMap.form_no_kk_pasangan || ctx.pelakuBagian?.pasangan?.no_kk || baseMap.no_kk || '-')
      : (ctx.individu?.no_kk || baseMap.no_kk || '-');
    const tmpIstri = isPemohonPria
      ? (baseMap.form_tempat_lahir_calon_istri || baseMap.tempat_lahir_pasangan || ctx.pelakuBagian?.pasangan?.tempat_lahir || '')
      : (ctx.individu?.tempat_lahir || baseMap.tempat_lahir || '');
    const tglIstri = isPemohonPria
      ? (baseMap.form_tanggal_lahir_calon_istri || baseMap.tanggal_lahir_pasangan || ctx.pelakuBagian?.pasangan?.tanggal_lahir || '')
      : (ctx.individu?.tanggal_lahir || baseMap.tanggal_lahir || '');
    const ttlIstri = formatTtlLahirHelper(tmpIstri, tglIstri);
    const wnIstri = isPemohonPria
      ? (baseMap.form_warga_negara_calon_istri || baseMap.form_warga_negara_pasangan || ctx.pelakuBagian?.pasangan?.warga_negara || 'WNI')
      : (ctx.individu?.warga_negara || baseMap.warga_negara || 'WNI');
    const agamaIstri = isPemohonPria
      ? (baseMap.form_agama_calon_istri || baseMap.form_agama_pasangan || ctx.pelakuBagian?.pasangan?.agama || 'Kristen')
      : (ctx.individu?.agama || baseMap.agama || 'Kristen');
    const pekerjaanIstri = isPemohonPria
      ? (baseMap.form_pekerjaan_calon_istri || baseMap.form_pekerjaan_pasangan || ctx.pelakuBagian?.pasangan?.pekerjaan || '-')
      : (ctx.individu?.pekerjaan || baseMap.pekerjaan || '-');
    const alamatIstri = isPemohonPria
      ? (baseMap.form_alamat_calon_istri || baseMap.form_alamat_pasangan || ctx.pelakuBagian?.pasangan?.alamat || '-')
      : (ctx.individu?.alamat || baseMap.alamat || '-');

    baseMap.nama_cpw = toTitleCaseIndonesian(namaIstri);
    baseMap.form_nama_cpw = toTitleCaseIndonesian(namaIstri);
    baseMap.nik_cpw = nikIstri;
    baseMap.form_nik_cpw = nikIstri;
    baseMap.no_kk_cpw = kkIstri;
    baseMap.form_no_kk_cpw = kkIstri;
    baseMap.ttl_cpw = ttlIstri;
    baseMap.form_ttl_cpw = ttlIstri;
    baseMap.jenis_kelamin_cpw = 'Perempuan';
    baseMap.warga_negara_cpw = wnIstri;
    baseMap.agama_cpw = toTitleCaseIndonesian(agamaIstri);
    baseMap.pekerjaan_cpw = toTitleCaseIndonesian(pekerjaanIstri);
    baseMap.alamat_cpw = alamatIstri;

    // Pelaksanaan Perkawinan
    const tempatGereja = baseMap.form_nama_badan_peradilan_kawin || baseMap.form_tempat_perkawinan || baseMap.form_tempat_nikah || '-';
    baseMap.form_nama_badan_peradilan_kawin = tempatGereja;
    baseMap.nama_badan_peradilan_kawin = tempatGereja;

    const rawTglPemberkatan = baseMap.form_tanggal_putusan_penetapan_pengadilan_kawin || baseMap.form_tanggal_pemberkatan || baseMap.form_tanggal_nikah || '';
    const normTglPemberkatan = rawTglPemberkatan ? (normalizeDateInput(rawTglPemberkatan) ? formatTanggalIndonesia(normalizeDateInput(rawTglPemberkatan)!) : rawTglPemberkatan) : '-';
    baseMap.form_tanggal_putusan_penetapan_pengadilan_kawin = normTglPemberkatan;
    baseMap.tanggal_putusan_penetapan_pengadilan_kawin = normTglPemberkatan;

    const pemukaAgama = baseMap.form_nama_pemuka_agama || baseMap.nama_pemuka_agama || '-';
    baseMap.form_nama_pemuka_agama = pemukaAgama;
    baseMap.nama_pemuka_agama = pemukaAgama;

    const noSuratPemberkatan = baseMap.form_no_surat_pemberkatan || baseMap.no_surat_pemberkatan || '-';
    baseMap.form_no_surat_pemberkatan = noSuratPemberkatan;
    baseMap.no_surat_pemberkatan = noSuratPemberkatan;
  }

  // Penyesuaian khusus untuk Surat Keterangan Wali Hakim
  const isSuratWaliHakimContext =
    (ctx.judulSurat || '').toLowerCase().includes('wali hakim') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-32';

  if (isSuratWaliHakimContext) {
    const isPemohonWanita = (ctx.individu?.jenis_kelamin || baseMap.jenis_kelamin || '').toLowerCase().includes('perempuan');

    // Calon Mempelai Wanita
    const namaIstri = baseMap.form_nama_calon_istri || (isPemohonWanita ? ctx.individu?.nama : baseMap.nama_pasangan || baseMap.form_nama_calon_pasangan) || '-';
    const ttlIstri = baseMap.form_ttl_calon_istri || (isPemohonWanita ? (ctx.individu?.tempat_lahir && ctx.individu?.tanggal_lahir ? `${toTitleCaseIndonesian(ctx.individu.tempat_lahir)}, ${ctx.individu.tanggal_lahir}` : '-') : baseMap.form_ttl_pasangan || '-') || '-';
    const agamaIstri = toTitleCaseIndonesian(baseMap.form_agama_calon_istri || (isPemohonWanita ? (ctx.individu?.agama || 'Islam') : baseMap.form_agama_pasangan || 'Islam'));
    const alamatIstri = baseMap.form_alamat_calon_istri || (isPemohonWanita ? (ctx.individu?.alamat || '-') : baseMap.form_alamat_pasangan || '-');

    baseMap.form_nama_calon_istri = toTitleCaseIndonesian(namaIstri).toUpperCase();
    baseMap.nama_calon_istri = baseMap.form_nama_calon_istri;
    baseMap.form_ttl_calon_istri = ttlIstri.toUpperCase();
    baseMap.ttl_calon_istri = baseMap.form_ttl_calon_istri;
    baseMap.form_agama_calon_istri = agamaIstri;
    baseMap.agama_calon_istri = agamaIstri;
    baseMap.form_alamat_calon_istri = alamatIstri;
    baseMap.alamat_calon_istri = alamatIstri;

    // Calon Mempelai Pria (Suami)
    const namaSuami = baseMap.form_nama_calon_suami || baseMap.form_nama_calon_pasangan || (!isPemohonWanita ? ctx.individu?.nama : baseMap.nama_pasangan) || '-';
    const ttlSuami = baseMap.form_ttl_calon_suami || baseMap.form_ttl_pasangan || (!isPemohonWanita ? (ctx.individu?.tempat_lahir && ctx.individu?.tanggal_lahir ? `${toTitleCaseIndonesian(ctx.individu.tempat_lahir)}, ${ctx.individu.tanggal_lahir}` : '-') : '-') || '-';
    const agamaSuami = toTitleCaseIndonesian(baseMap.form_agama_calon_suami || baseMap.form_agama_pasangan || (!isPemohonWanita ? (ctx.individu?.agama || 'Islam') : 'Islam'));
    const alamatSuami = baseMap.form_alamat_calon_suami || baseMap.form_alamat_pasangan || (!isPemohonWanita ? (ctx.individu?.alamat || '-') : '-');

    baseMap.form_nama_calon_suami = toTitleCaseIndonesian(namaSuami).toUpperCase();
    baseMap.nama_calon_suami = baseMap.form_nama_calon_suami;
    baseMap.form_ttl_calon_suami = ttlSuami.toUpperCase();
    baseMap.ttl_calon_suami = baseMap.form_ttl_calon_suami;
    baseMap.form_agama_calon_suami = agamaSuami;
    baseMap.agama_calon_suami = agamaSuami;
    baseMap.form_alamat_calon_suami = alamatSuami;
    baseMap.alamat_calon_suami = alamatSuami;

    // Keterangan Wali Hakim
    let ketWaliHakim = baseMap.form_keterangan_wali_hakim || baseMap.form_alasan_wali_hakim || baseMap.keterangan_wali_hakim || '';
    if (!ketWaliHakim || ketWaliHakim === '[Form_keterangan_wali_hakim]') {
      ketWaliHakim = 'susunan wali, Nikah untuk mempelai wanita sudah habis barisan wali/Tidak ada, maka untuk melangsungkan pernikahannya dengan memakai WALI HAKIM';
    }
    baseMap.form_keterangan_wali_hakim = ketWaliHakim;
    baseMap.keterangan_wali_hakim = ketWaliHakim;
  }

  // Penyesuaian khusus untuk Surat Keterangan Belum Menikah
  const isSuratBelumMenikahContext =
    (ctx.judulSurat || '').toLowerCase().includes('belum pernah menikah') ||
    (ctx.judulSurat || '').toLowerCase().includes('belum menikah') ||
    (ctx.judulSurat || '').toLowerCase().includes('belum kawin') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-18' ||
    (ctx.kodeSurat || '').toLowerCase() === '470';

  if (isSuratBelumMenikahContext) {
    const rawStatusKawin =
      baseMap.form_status_perkawinan ||
      baseMap.form_status_kawin ||
      baseMap.status_perkawinan ||
      baseMap.maritalstatus ||
      (ctx.individu?.status_kawin) ||
      'Belum Menikah (Jejaka / Perawan)';
    baseMap.form_status_perkawinan = rawStatusKawin;
    baseMap.status_perkawinan = rawStatusKawin;
    baseMap.form_status_kawin = rawStatusKawin;
    baseMap.status_kawin = rawStatusKawin;

    let keperluanBelumMenikah =
      baseMap.form_keperluan ||
      baseMap.keperluan ||
      ctx.requesterPurpose ||
      '';
    if (!keperluanBelumMenikah || keperluanBelumMenikah === '[form_keperluan]') {
      keperluanBelumMenikah = 'Persyaratan Pendaftaran Pernikahan / Kelengkapan Berkas Resmi';
    }
    baseMap.form_keperluan = keperluanBelumMenikah;
    baseMap.keperluan = keperluanBelumMenikah;
  }

  // Penyesuaian khusus untuk Surat Permohonan Duplikat Surat Nikah
  const isSuratDuplikatNikahContext =
    (ctx.judulSurat || '').toLowerCase().includes('duplikat surat nikah') ||
    (ctx.judulSurat || '').toLowerCase().includes('duplikat buku nikah') ||
    (ctx.judulSurat || '').toLowerCase().includes('duplikat nikah') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-33' ||
    result.includes('SURAT PERMOHONAN DUPLIKAT SURAT NIKAH') ||
    result.includes('1. Data Suami :') ||
    result.includes('1. Data Suami:');

  if (isSuratDuplikatNikahContext) {
    const isPemohonPria = (ctx.individu?.jenis_kelamin || baseMap.jenis_kelamin || '').toLowerCase().includes('laki');

    // Data Suami
    const namaSuami = baseMap.form_nama_calon_suami || (isPemohonPria ? ctx.individu?.nama : baseMap.form_nama_pasangan || baseMap.nama_pasangan) || '-';
    const tmpSuami = baseMap.form_tempat_lahir_suami || (isPemohonPria ? ctx.individu?.tempat_lahir : baseMap.form_tempat_lahir_pasangan) || '';
    const rawTglSuami = baseMap.form_tanggal_lahir_suami || (isPemohonPria ? ctx.individu?.tanggal_lahir : baseMap.form_tanggal_lahir_pasangan) || '';
    const tglSuamiFmt = rawTglSuami ? (normalizeDateInput(rawTglSuami) ? formatTanggalIndonesia(normalizeDateInput(rawTglSuami)!) : rawTglSuami) : '';
    const ttlSuami = baseMap.form_ttl_calon_suami || (tmpSuami && tglSuamiFmt ? `${toTitleCaseIndonesian(tmpSuami)}, ${tglSuamiFmt}` : (tmpSuami || tglSuamiFmt || '-'));
    const agamaSuami = toTitleCaseIndonesian(baseMap.form_agama_calon_suami || (isPemohonPria ? ctx.individu?.agama : baseMap.form_agama_pasangan) || 'Islam');
    const pekerjaanSuami = toTitleCaseIndonesian(baseMap.form_pekerjaan_calon_suami || (isPemohonPria ? ctx.individu?.pekerjaan : baseMap.form_pekerjaan_pasangan) || 'Wiraswasta');
    const alamatSuami = baseMap.form_alamat_calon_suami || (isPemohonPria ? ctx.individu?.alamat : baseMap.form_alamat_pasangan) || baseMap.alamat || '-';

    baseMap.form_nama_calon_suami = toTitleCaseIndonesian(namaSuami).toUpperCase();
    baseMap.form_ttl_calon_suami = ttlSuami;
    baseMap.form_agama_calon_suami = agamaSuami;
    baseMap.form_pekerjaan_calon_suami = pekerjaanSuami;
    baseMap.form_alamat_calon_suami = alamatSuami;

    // Data Istri
    const namaIstri = baseMap.form_nama_calon_istri || (!isPemohonPria ? ctx.individu?.nama : baseMap.form_nama_pasangan || baseMap.nama_pasangan) || '-';
    const tmpIstri = baseMap.form_tempat_lahir_istri || (!isPemohonPria ? ctx.individu?.tempat_lahir : baseMap.form_tempat_lahir_pasangan) || '';
    const rawTglIstri = baseMap.form_tanggal_lahir_istri || (!isPemohonPria ? ctx.individu?.tanggal_lahir : baseMap.form_tanggal_lahir_pasangan) || '';
    const tglIstriFmt = rawTglIstri ? (normalizeDateInput(rawTglIstri) ? formatTanggalIndonesia(normalizeDateInput(rawTglIstri)!) : rawTglIstri) : '';
    const ttlIstri = baseMap.form_ttl_calon_istri || (tmpIstri && tglIstriFmt ? `${toTitleCaseIndonesian(tmpIstri)}, ${tglIstriFmt}` : (tmpIstri || tglIstriFmt || '-'));
    const agamaIstri = toTitleCaseIndonesian(baseMap.form_agama_calon_istri || (!isPemohonPria ? ctx.individu?.agama : baseMap.form_agama_pasangan) || 'Islam');
    const pekerjaanIstri = toTitleCaseIndonesian(baseMap.form_pekerjaan_calon_istri || (!isPemohonPria ? ctx.individu?.pekerjaan : baseMap.form_pekerjaan_pasangan) || 'Mengurus Rumah Tangga');
    const alamatIstri = baseMap.form_alamat_calon_istri || (!isPemohonPria ? ctx.individu?.alamat : baseMap.form_alamat_pasangan) || baseMap.alamat || '-';

    baseMap.form_nama_calon_istri = toTitleCaseIndonesian(namaIstri).toUpperCase();
    baseMap.form_ttl_calon_istri = ttlIstri;
    baseMap.form_agama_calon_istri = agamaIstri;
    baseMap.form_pekerjaan_calon_istri = pekerjaanIstri;
    baseMap.form_alamat_calon_istri = alamatIstri;

    // Data Pernikahan
    const hariNikah = baseMap.form_hari_nikah || baseMap.form_hari_pernikahan || '';
    const rawTglNikah = baseMap.form_tanggal_nikah || baseMap.form_tgl_nikah || '';
    const tglNikahFmt = rawTglNikah ? (normalizeDateInput(rawTglNikah) ? formatTanggalIndonesia(normalizeDateInput(rawTglNikah)!) : rawTglNikah) : '';
    const hariTglNikah = baseMap.form_hari_tanggal_nikah || (hariNikah && tglNikahFmt ? `${toTitleCaseIndonesian(hariNikah)}, ${tglNikahFmt}` : (hariNikah || tglNikahFmt || '-'));
    baseMap.form_hari_tanggal_nikah = hariTglNikah;

    const tempatAkad = baseMap.form_tempat_akad_nikah || baseMap.form_tempat_nikah || baseMap.form_tempat_akad || `KUA Kecamatan ${effectiveNamaKecamatan}`;
    baseMap.form_tempat_akad_nikah = tempatAkad;

    const kuaNikah = baseMap.form_kua_tempat_nikah || baseMap.form_kua_nikah || baseMap.form_kua_tujuan || effectiveNamaKecamatan;
    baseMap.form_kua_tempat_nikah = kuaNikah;

    const noAkta = baseMap.form_no_akta_nikah || baseMap.form_nomor_akta_nikah || baseMap.form_no_buku_nikah || '-';
    baseMap.form_no_akta_nikah = noAkta;

    const statusBuku = baseMap.form_status_buku_nikah || baseMap.form_kondisi_buku || baseMap.form_kondisi || 'Hilang';
    baseMap.form_status_buku_nikah = statusBuku;
  }

  // Penyesuaian khusus untuk Surat Pengantar Cerai / Rujuk
  const isSuratCeraiRujukContext =
    (ctx.judulSurat || '').toLowerCase().includes('cerai') ||
    (ctx.judulSurat || '').toLowerCase().includes('rujuk') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-35' ||
    (ctx.kodeSurat || '').toLowerCase() === 's-34' ||
    result.includes('SURAT PENGANTAR CERAI / RUJUK') ||
    result.includes('Telah rujuk/cerai*) dengan:');

  if (isSuratCeraiRujukContext) {
    const isPemohonPria = (ctx.individu?.jenis_kelamin || baseMap.jenis_kelamin || '').toLowerCase().includes('laki');
    baseMap.label_bin_pemohon = isPemohonPria ? 'Bin' : 'Binti';
    baseMap.label_bin_pasangan = isPemohonPria ? 'Binti' : 'Bin';

    // Data Pasangan (Mantan Suami / Istri)
    const namaPasangan =
      baseMap.form_nama_pasangan ||
      baseMap.nama_pasangan ||
      ctx.pelakuBagian?.pasangan?.nama ||
      '-';
    const ayahPasangan =
      baseMap.form_nama_ayah_pasangan ||
      baseMap.nama_ayah_pasangan ||
      ctx.pelakuBagian?.pasangan?.nama_ayah ||
      baseMap.form_bin_calon_pasangan ||
      '-';
    const tmpPasangan =
      baseMap.form_tempatlahir_pasangan ||
      baseMap.form_tempat_lahir_pasangan ||
      ctx.pelakuBagian?.pasangan?.tempat_lahir ||
      '';
    const rawTglPasangan =
      baseMap.form_tanggallahir_pasangan ||
      baseMap.form_tanggal_lahir_pasangan ||
      ctx.pelakuBagian?.pasangan?.tanggal_lahir ||
      '';
    const tglPasanganFmt = rawTglPasangan
      ? (normalizeDateInput(rawTglPasangan) ? formatTanggalIndonesia(normalizeDateInput(rawTglPasangan)!) : rawTglPasangan)
      : '';
    const ttlPasangan = (tmpPasangan && tglPasanganFmt)
      ? `${toTitleCaseIndonesian(tmpPasangan)}, ${tglPasanganFmt}`
      : (tmpPasangan || tglPasanganFmt || '-');

    const wnPasangan =
      baseMap.form_wn_pasangan ||
      baseMap.form_warga_negara_pasangan ||
      ctx.pelakuBagian?.pasangan?.warga_negara ||
      'WNI';
    const agamaPasangan = toTitleCaseIndonesian(
      baseMap.form_agama_pasangan ||
      ctx.pelakuBagian?.pasangan?.agama ||
      'Islam'
    );
    const pekerjaanPasangan = toTitleCaseIndonesian(
      baseMap.form_pekerjaan_pasangan ||
      ctx.pelakuBagian?.pasangan?.pekerjaan ||
      'Wiraswasta'
    );
    const alamatPasangan =
      baseMap.form_alamat_pasangan ||
      ctx.pelakuBagian?.pasangan?.alamat ||
      '-';

    baseMap.form_nama_pasangan = toTitleCaseIndonesian(namaPasangan);
    baseMap.nama_pasangan = baseMap.form_nama_pasangan;
    baseMap.form_nama_ayah_pasangan = toTitleCaseIndonesian(ayahPasangan);
    baseMap.nama_ayah_pasangan = baseMap.form_nama_ayah_pasangan;
    baseMap.form_tempatlahir_pasangan = toTitleCaseIndonesian(tmpPasangan);
    baseMap.form_tanggallahir_pasangan = tglPasanganFmt;
    baseMap.form_tempatdan_tgllahir_pasangan = ttlPasangan;
    baseMap.form_wn_pasangan = wnPasangan;
    baseMap.form_agama_pasangan = agamaPasangan;
    baseMap.form_pekerjaan_pasangan = pekerjaanPasangan;
    baseMap.form_alamat_pasangan = alamatPasangan;
  }

  // Penyesuaian khusus untuk Surat Pernyataan Penguasaan Fisik Bidang Tanah (SPORADIK)
  const isSuratSporadikContext =
    (ctx.judulSurat || '').toLowerCase().includes('sporadik') ||
    (ctx.judulSurat || '').toLowerCase().includes('penguasaan fisik bidang tanah') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-40' ||
    result.includes('telah menguasai sebidang tanah') ||
    result.includes('[namasaksii]') ||
    result.includes('[namasaksiii]');

  if (isSuratSporadikContext) {
    const pemohonNama = ctx.individu?.nama || baseMap.nama || '-';
    const pemohonTempat = ctx.individu?.tempat_lahir || baseMap.tempat_lahir || baseMap.tempatlahir || effectiveNamaKabupaten;
    const rawPemohonTgl = ctx.individu?.tanggal_lahir || baseMap.tanggal_lahir || '';
    const pemohonTglFmt = rawPemohonTgl ? (normalizeDateInput(rawPemohonTgl) ? formatTanggalIndonesia(normalizeDateInput(rawPemohonTgl)!) : rawPemohonTgl) : '-';
    const rawPemohonUmur = (ctx.individu as any)?.usia || baseMap.usia || baseMap.umur || (rawPemohonTgl ? hitungUmurIndonesia(rawPemohonTgl) : '');
    const pemohonUmur = rawPemohonUmur ? (String(rawPemohonUmur).includes('Tahun') ? String(rawPemohonUmur) : `${rawPemohonUmur} Tahun`) : '-';
    const pemohonPekerjaan = ctx.individu?.pekerjaan || baseMap.pekerjaan || '-';
    const pemohonNik = ctx.individu?.nik || baseMap.nik || '-';
    const pemohonAlamat = ctx.individu?.alamat || baseMap.alamat || '-';

    baseMap.nama_non_warga = toTitleCaseIndonesian(pemohonNama);
    baseMap.tempatlahir_pemohon = toTitleCaseIndonesian(pemohonTempat);
    baseMap.tanggallahir_pemohon = pemohonTglFmt;
    baseMap.umur_pemohon = pemohonUmur;
    baseMap.pekerjaan_pemohon = toTitleCaseIndonesian(pemohonPekerjaan);
    baseMap.nik_non_warga = pemohonNik;
    baseMap.alamat_pemohon = pemohonAlamat;

    const jalan = baseMap.form_jalan || baseMap.jalan || '-';
    const rtrw = baseMap.form_rt_rw || baseMap.rtrw || '-';
    const desalurah = baseMap.form_desa_kelurahan || baseMap.desalurah || effectiveNamaDesa;
    const camatt = baseMap.form_kecamatan || baseMap.camatt || effectiveNamaKecamatan;
    const kabb = baseMap.form_kabupaten_kota || baseMap.kabb || effectiveNamaKabupaten;
    const nib = baseMap.form_nib || baseMap.nib || '-';
    const statustanah = baseMap.form_status_tanah || baseMap.statustanah || 'Hak Milik Adat';
    const tanahuntuk = baseMap.form_dipergunakan || baseMap.tanahuntuk || 'Perumahan / Pekarangan';
    const luashak = baseMap.form_luas_tanah_m2 || baseMap.luashak || '0';

    baseMap.jalan = jalan;
    baseMap.form_jalan = jalan;
    baseMap.rtrw = rtrw;
    baseMap.form_rt_rw = rtrw;
    baseMap.desalurah = desalurah;
    baseMap.form_desa_kelurahan = desalurah;
    baseMap.camatt = camatt;
    baseMap.form_kecamatan = camatt;
    baseMap.kabb = kabb;
    baseMap.form_kabupaten_kota = kabb;
    baseMap.nib = nib;
    baseMap.form_nib = nib;
    baseMap.statustanah = statustanah;
    baseMap.form_status_tanah = statustanah;
    baseMap.tanahuntuk = tanahuntuk;
    baseMap.form_dipergunakan = tanahuntuk;
    baseMap.luashak = luashak;
    baseMap.form_luas_tanah_m2 = luashak;

    const utara = baseMap.form_batas_sebelah_utara || baseMap.utara || '-';
    const timur = baseMap.form_batas_sebelah_timur || baseMap.timur || '-';
    const selatan = baseMap.form_batas_sebelah_selatan || baseMap.selatan || '-';
    const barat = baseMap.form_batas_sebelah_barat || baseMap.barat || '-';

    baseMap.utara = utara;
    baseMap.form_batas_sebelah_utara = utara;
    baseMap.timur = timur;
    baseMap.form_batas_sebelah_timur = timur;
    baseMap.selatan = selatan;
    baseMap.form_batas_sebelah_selatan = selatan;
    baseMap.barat = barat;
    baseMap.form_batas_sebelah_barat = barat;

    const peroleh = baseMap.form_tanah_diperoleh_dari_ || baseMap.peroleh || '-';
    const perolehtahun = baseMap.form_diperoleh_sejak_tahun || baseMap.perolehtahun || '-';
    const denganjalan = baseMap.form_dengan_jalan || baseMap.denganjalan || 'Jual Beli / Warisan';

    baseMap.peroleh = peroleh;
    baseMap.form_tanah_diperoleh_dari_ = peroleh;
    baseMap.perolehtahun = perolehtahun;
    baseMap.form_diperoleh_sejak_tahun = perolehtahun;
    baseMap.denganjalan = denganjalan;
    baseMap.form_dengan_jalan = denganjalan;

    baseMap.penandatangan = ctx.jabatanPamong || (ctx as any).penandatanganJabatan || `Kepala Desa ${effectiveNamaDesa}`;
    baseMap.nama_pejabat = ctx.namaPamong || (ctx as any).penandatanganNama || effectiveNamaPamong;
    baseMap.nama_des = effectiveNamaDesa;
    baseMap.tgl_surat = formatTanggalIndonesia(now);
  }

  // Penyesuaian khusus untuk Surat Keterangan Kepemilikan Tanah (S-49)
  const isSuratKepemilikanTanahContext =
    (ctx.judulSurat || '').toLowerCase().includes('kepemilikan tanah') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-49' ||
    result.includes('memiliki/menguasai tanah/lahan berupa') ||
    result.includes('[form_jenis_tanah]') ||
    result.includes('[form_luas_tanah]');

  if (isSuratKepemilikanTanahContext) {
    const jenisTanah = baseMap.form_jenis_tanah || baseMap.jenis_tanah || 'Tanah Darat';
    const atasNamaTanah = baseMap.form_atas_nama_tanah || baseMap.atas_nama_tanah || ctx.individu?.nama || baseMap.nama || '-';
    const buktiHak = baseMap.form_bukti_kepemilikan_tanah || baseMap.bukti_kepemilikan_tanah || 'Letter C';
    const noBukti = baseMap.form_nomor_bukti_kepemilikan_tanah || baseMap.nomor_bukti_kepemilikan_tanah || '-';
    const luasTanah = baseMap.form_luas_tanah || baseMap.luas_tanah || baseMap.form_luas_tanah_m2 || baseMap.luashak || '-';
    const bUtara = baseMap.form_batas_utara_tanah || baseMap.batas_utara_tanah || baseMap.form_batas_sebelah_utara || baseMap.utara || '-';
    const bTimur = baseMap.form_batas_timur_tanah || baseMap.batas_timur_tanah || baseMap.form_batas_sebelah_timur || baseMap.timur || '-';
    const bSelatan = baseMap.form_batas_selatan_tanah || baseMap.batas_selatan_tanah || baseMap.form_batas_sebelah_selatan || baseMap.selatan || '-';
    const bBarat = baseMap.form_batas_barat_tanah || baseMap.batas_barat_tanah || baseMap.form_batas_sebelah_barat || baseMap.barat || '-';
    const asalTanah = baseMap.form_asal_kepemilikan_tanah || baseMap.asal_kepemilikan_tanah || baseMap.form_dengan_jalan || 'Jual Beli';
    const buktiDukung = baseMap.form_bukti_pendukung_kepemilikan_tanah || baseMap.bukti_pendukung_kepemilikan_tanah || 'Akta Jual Beli';

    baseMap.form_jenis_tanah = jenisTanah;
    baseMap.jenis_tanah = jenisTanah;
    baseMap.form_atas_nama_tanah = toTitleCaseIndonesian(atasNamaTanah);
    baseMap.atas_nama_tanah = toTitleCaseIndonesian(atasNamaTanah);
    baseMap.form_bukti_kepemilikan_tanah = buktiHak;
    baseMap.bukti_kepemilikan_tanah = buktiHak;
    baseMap.form_nomor_bukti_kepemilikan_tanah = noBukti;
    baseMap.nomor_bukti_kepemilikan_tanah = noBukti;
    baseMap.form_luas_tanah = luasTanah;
    baseMap.luas_tanah = luasTanah;
    baseMap.form_batas_utara_tanah = bUtara;
    baseMap.batas_utara_tanah = bUtara;
    baseMap.form_batas_timur_tanah = bTimur;
    baseMap.batas_timur_tanah = bTimur;
    baseMap.form_batas_selatan_tanah = bSelatan;
    baseMap.batas_selatan_tanah = bSelatan;
    baseMap.form_batas_barat_tanah = bBarat;
    baseMap.batas_barat_tanah = bBarat;
    baseMap.form_asal_kepemilikan_tanah = asalTanah;
    baseMap.asal_kepemilikan_tanah = asalTanah;
    baseMap.form_bukti_pendukung_kepemilikan_tanah = buktiDukung;
    baseMap.bukti_pendukung_kepemilikan_tanah = buktiDukung;
  }

  // Penyesuaian khusus untuk Surat Keterangan Domisili Usaha (S-16)
  const isSuratDomisiliUsahaContext =
    (ctx.judulSurat || '').toLowerCase().includes('domisili usaha') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-16' ||
    result.includes('SURAT KETERANGAN DOMISILI USAHA') ||
    result.includes('Status Bangunan Tempat Usaha') ||
    result.includes('[Form_status_bangunan]') ||
    result.includes('[Form_penanggung_jawab]');

  if (isSuratDomisiliUsahaContext) {
    const rawNamaUsaha =
      baseMap.form_nama_usaha ||
      baseMap.businessname ||
      baseMap.form_businessname ||
      ctx.formValues?.businessName ||
      ctx.formValues?.namaUsaha ||
      ctx.formValues?.['[form_nama_usaha]'] ||
      'UD. Berkah Mandiri Sampeldes';
    const rawJenisUsaha =
      baseMap.form_jenis_usaha ||
      baseMap.businesstype ||
      baseMap.form_businesstype ||
      ctx.formValues?.businessType ||
      ctx.formValues?.jenisUsaha ||
      ctx.formValues?.['[form_jenis_usaha]'] ||
      'Perdagangan Sembako & Hasil Pertanian';

    let rawAlamatUsaha =
      baseMap.form_alamat_usaha ||
      baseMap.businessaddress ||
      baseMap.form_businessaddress ||
      ctx.formValues?.businessAddress ||
      ctx.formValues?.alamatUsaha ||
      ctx.formValues?.['[form_alamat_usaha]'];

    const rtVal = ctx.formValues?.businessRt || ctx.formValues?.rt_usaha || baseMap.businessrt || '';
    const rwVal = ctx.formValues?.businessRw || ctx.formValues?.rw_usaha || baseMap.businessrw || '';
    const dusunVal = ctx.formValues?.businessDusun || ctx.formValues?.dusun_usaha || baseMap.businessdusun || '';

    if (rtVal || rwVal || dusunVal) {
      const parts = [`RT ${rtVal || '...'}`, `RW ${rwVal || '...'}`].join(' / ');
      const dusunStr = dusunVal ? `Dusun ${dusunVal}` : 'Dusun Sampeldes';
      const detailStr = (rawAlamatUsaha && !rawAlamatUsaha.includes('RT') && rawAlamatUsaha !== '-') ? `${rawAlamatUsaha}, ` : '';
      rawAlamatUsaha = `${detailStr}${parts} ${dusunStr}`.trim();
    } else if (!rawAlamatUsaha || rawAlamatUsaha === '-') {
      rawAlamatUsaha = `RT 001 / RW 001 Dusun Sampeldes`;
    }

    const rawStatusBangunan =
      baseMap.form_status_bangunan ||
      baseMap.status_bangunan ||
      baseMap.buildingstatus ||
      ctx.formValues?.buildingStatus ||
      ctx.formValues?.statusBangunan ||
      ctx.formValues?.['[form_status_bangunan]'] ||
      'Milik Sendiri';

    const rawPenanggungJawab =
      baseMap.form_penanggung_jawab ||
      baseMap.penanggung_jawab ||
      baseMap.responsibleperson ||
      ctx.formValues?.responsiblePerson ||
      ctx.formValues?.penanggungJawab ||
      ctx.formValues?.['[form_penanggung_jawab]'] ||
      ctx.individu?.nama ||
      baseMap.nama ||
      '-';

    baseMap.form_nama_usaha = toTitleCaseIndonesian(rawNamaUsaha);
    baseMap.form_jenis_usaha = toTitleCaseIndonesian(rawJenisUsaha);
    baseMap.form_alamat_usaha = toTitleCaseIndonesian(rawAlamatUsaha);
    baseMap.form_status_bangunan = toTitleCaseIndonesian(rawStatusBangunan);
    baseMap.status_bangunan = toTitleCaseIndonesian(rawStatusBangunan);
    baseMap.form_penanggung_jawab = toTitleCaseIndonesian(rawPenanggungJawab);
    baseMap.penanggung_jawab = toTitleCaseIndonesian(rawPenanggungJawab);
  }

  // Penyesuaian khusus untuk Surat Keterangan Usaha (500)
  const isSuratUsahaContext =
    !isSuratDomisiliUsahaContext &&
    ((ctx.judulSurat || '').toLowerCase().includes('keterangan usaha') ||
      (ctx.kodeSurat || '').toLowerCase() === '500' ||
      result.includes('SURAT KETERANGAN USAHA') ||
      result.includes('memiliki usaha dengan keterangan sebagai berikut') ||
      result.includes('[Form_nama_usaha]'));

  if (isSuratUsahaContext) {
    const rawNamaUsaha =
      baseMap.form_nama_usaha ||
      baseMap.businessname ||
      baseMap.form_businessname ||
      ctx.formValues?.businessName ||
      ctx.formValues?.namaUsaha ||
      ctx.formValues?.['[form_nama_usaha]'] ||
      'Kelontong Havid';
    const rawJenisUsaha =
      baseMap.form_jenis_usaha ||
      baseMap.businesstype ||
      baseMap.form_businesstype ||
      ctx.formValues?.businessType ||
      ctx.formValues?.jenisUsaha ||
      ctx.formValues?.['[form_jenis_usaha]'] ||
      'Kelontong';
    const rawAlamatUsaha =
      baseMap.form_alamat_usaha ||
      baseMap.businessaddress ||
      baseMap.form_businessaddress ||
      ctx.formValues?.businessAddress ||
      ctx.formValues?.alamatUsaha ||
      ctx.formValues?.['[form_alamat_usaha]'] ||
      baseMap.alamat_lengkap ||
      baseMap.alamat ||
      '-';
    const rawBerdiriSejak =
      baseMap.form_berdiri_sejak ||
      baseMap.berdiri_sejak ||
      baseMap.businesssince ||
      baseMap.form_businesssince ||
      ctx.formValues?.businessSince ||
      ctx.formValues?.berdiriSejak ||
      ctx.formValues?.['[form_berdiri_sejak]'] ||
      ctx.formValues?.tahunBerdiri ||
      '2011';
    const rawKeperluanUsaha =
      baseMap.form_keperluan ||
      baseMap.purpose ||
      ctx.formValues?.purpose ||
      ctx.formValues?.keperluan ||
      ctx.formValues?.['[form_keperluan]'] ||
      'Pengajuan KUR BRI';

    baseMap.form_nama_usaha = toTitleCaseIndonesian(rawNamaUsaha);
    baseMap.form_jenis_usaha = rawJenisUsaha;
    baseMap.form_alamat_usaha = toTitleCaseIndonesian(rawAlamatUsaha);
    baseMap.form_berdiri_sejak = rawBerdiriSejak;
    baseMap.berdiri_sejak = rawBerdiriSejak;
    baseMap.form_keperluan = toTitleCaseIndonesian(rawKeperluanUsaha);
  }

  // Penyesuaian khusus untuk Surat Keterangan Tidak Mampu (S-11 / prm-12)
  const isSuratSktmContext =
    (ctx.judulSurat || '').toLowerCase().includes('tidak mampu') ||
    (ctx.judulSurat || '').toLowerCase().includes('kurang mampu') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-11' ||
    result.includes('SURAT KETERANGAN TIDAK MAMPU') ||
    result.includes('keluarga yang tidak mampu / keluarga berpenghasilan rendah') ||
    result.includes('[NAma_pemohon]') ||
    result.includes('[Nik_pemohon]');

  if (isSuratSktmContext) {
    const rawPemohonNama = ctx.formValues?.applicantName || ctx.formValues?.namaPemohon || baseMap.nama_pemohon || ctx.individu?.nama || 'ARI KUSMIYATUN';
    const rawPemohonNik = ctx.formValues?.applicantNik || ctx.formValues?.nikPemohon || baseMap.nik_pemohon || ctx.individu?.nik || '3301105001880001';
    const rawPemohonTmp = ctx.formValues?.applicantBirthPlace || baseMap.tempat_lahir_pemohon || ctx.individu?.tempat_lahir || effectiveNamaKabupaten;
    const rawPemohonTgl = ctx.formValues?.applicantBirthDate || baseMap.tanggal_lahir_pemohon || ctx.individu?.tanggal_lahir || '';
    const normPemohonTgl = rawPemohonTgl && rawPemohonTgl !== '-' ? normalizeDateInput(rawPemohonTgl) : null;
    const tglPemohonFmt = normPemohonTgl ? formatTanggalIndonesia(normPemohonTgl) : (rawPemohonTgl || '-');
    const ttlPemohon = rawPemohonTmp && tglPemohonFmt !== '-' ? `${toTitleCaseIndonesian(rawPemohonTmp)}, ${tglPemohonFmt}` : (toTitleCaseIndonesian(rawPemohonTmp) || tglPemohonFmt || '-');
    const rawPemohonKelamin = ctx.formValues?.applicantGender || baseMap.jenis_kelamin_pemohon || ctx.individu?.jenis_kelamin || 'PEREMPUAN';
    const rawPemohonAgama = ctx.formValues?.applicantReligion || baseMap.agama_pemohon || ctx.individu?.agama || 'ISLAM';
    const rawPemohonKerja = ctx.formValues?.applicantJob || baseMap.pekerjaan_pemohon || ctx.individu?.pekerjaan || 'Karyawan Swasta';
    const rawPemohonAlamat = ctx.formValues?.applicantAddress || baseMap.alamat_pemohon || baseMap.alamat_lengkap || baseMap.alamat || `Desa ${effectiveNamaDesa}, Kec. ${effectiveNamaKecamatan}, Kab. ${effectiveNamaKabupaten}`;

    baseMap.nama_pemohon = toTitleCaseIndonesian(rawPemohonNama);
    baseMap.nik_pemohon = rawPemohonNik;
    baseMap.ttl_pemohon = ttlPemohon;
    baseMap.jenis_kelamin_pemohon = String(rawPemohonKelamin).toUpperCase();
    baseMap.agama_pemohon = String(rawPemohonAgama).toUpperCase();
    baseMap.pekerjaan_pemohon = toTitleCaseIndonesian(rawPemohonKerja);
    baseMap.alamat_pemohon = toTitleCaseIndonesian(rawPemohonAlamat);

    // Data Anak (jika pengajuan untuk anak)
    const rawAnakNama = ctx.formValues?.childName || ctx.formValues?.form_nama_anak || baseMap.form_nama_anak || 'ARI MARIYONO';
    const rawAnakNik = ctx.formValues?.childNik || ctx.formValues?.form_nik_anak || baseMap.form_nik_anak || '3301100603940005';
    const rawAnakTmp = ctx.formValues?.childBirthPlace || ctx.formValues?.form_tempat_lahir_anak || effectiveNamaKabupaten;
    const rawAnakTgl = ctx.formValues?.childBirthDate || ctx.formValues?.form_tanggal_lahir_anak || '';
    const normAnakTgl = rawAnakTgl && rawAnakTgl !== '-' ? normalizeDateInput(rawAnakTgl) : null;
    const tglAnakFmt = normAnakTgl ? formatTanggalIndonesia(normAnakTgl) : (rawAnakTgl || '-');
    const ttlAnak = rawAnakTmp && tglAnakFmt !== '-' ? `${toTitleCaseIndonesian(rawAnakTmp)}, ${tglAnakFmt}` : (toTitleCaseIndonesian(rawAnakTmp) || tglAnakFmt || '-');
    const rawAnakKelamin = ctx.formValues?.childGender || ctx.formValues?.form_jenis_kelamin_anak || 'LAKI-LAKI';
    const rawAnakKerja = ctx.formValues?.childJob || ctx.formValues?.form_pekerjaan_anak || 'Belum/Tidak Bekerja';
    const rawAnakAlamat = ctx.formValues?.childAddress || ctx.formValues?.form_alamat_anak || baseMap.alamat_pemohon;

    baseMap.form_nama_anak = toTitleCaseIndonesian(rawAnakNama);
    baseMap.form_nik_anak = rawAnakNik;
    baseMap.form_ttl_anak = ttlAnak;
    baseMap.form_jenis_kelamin_anak = String(rawAnakKelamin).toUpperCase();
    baseMap.form_pekerjaan_anak = toTitleCaseIndonesian(rawAnakKerja);
    baseMap.form_alamat_anak = toTitleCaseIndonesian(rawAnakAlamat);

    const rawKeperluan = ctx.formValues?.purpose || ctx.formValues?.form_keperluan || baseMap.form_keperluan || 'KERINGANAN BIAYA SEKOLAH';
    baseMap.form_keperluan = String(rawKeperluan).toUpperCase();
  }

  // Penyesuaian khusus untuk Surat Keterangan Penghasilan Orang Tua (S-42 / prm-21)
  const isSuratPenghasilanOrtuContext =
    (ctx.judulSurat || '').toLowerCase().includes('penghasilan orang tua') ||
    (ctx.judulSurat || '').toLowerCase().includes('penghasilan ortu') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-42' ||
    result.includes('SURAT KETERANGAN PENGHASILAN ORANG TUA') ||
    result.includes('[Form_sekolahperguruan_tinggI]') ||
    result.includes('[Form_penghasilan_ayaH]');

  if (isSuratPenghasilanOrtuContext) {
    // 1. Data Anak / Siswa / Mahasiswa
    const rawAnakNama = ctx.formValues?.childName || ctx.formValues?.nama_anak || ctx.formValues?.nama || ctx.individu?.nama || 'ARI MARIYONO';
    const rawAnakNik = ctx.formValues?.childNik || ctx.formValues?.nik_anak || ctx.formValues?.nik || ctx.individu?.nik || '3301100603940005';
    const rawAnakTmp = ctx.formValues?.childBirthPlace || ctx.individu?.tempat_lahir || effectiveNamaKabupaten;
    const rawAnakTgl = ctx.formValues?.childBirthDate || ctx.individu?.tanggal_lahir || '';
    const normAnakTgl = rawAnakTgl && rawAnakTgl !== '-' ? normalizeDateInput(rawAnakTgl) : null;
    const tglAnakFmt = normAnakTgl ? formatTanggalIndonesia(normAnakTgl) : (rawAnakTgl || '-');
    const ttlAnak = rawAnakTmp && tglAnakFmt !== '-' ? `${toTitleCaseIndonesian(rawAnakTmp)}, ${tglAnakFmt}` : (toTitleCaseIndonesian(rawAnakTmp) || tglAnakFmt || '-');
    const rawAnakKelamin = ctx.formValues?.childGender || ctx.individu?.jenis_kelamin || 'Laki-Laki';
    const rawAnakAgama = ctx.formValues?.childReligion || ctx.individu?.agama || 'Islam';
    const rawSekolah = ctx.formValues?.schoolName || ctx.formValues?.['[form_sekolahperguruan_tinggi]'] || ctx.formValues?.form_sekolahperguruan_tinggi || 'Universitas Jenderal Soedirman';
    const rawNis = ctx.formValues?.childNis || ctx.formValues?.nisn || ctx.formValues?.nim || ctx.formValues?.['[form_nomor_induk_siswamahasiswa]'] || ctx.formValues?.form_nomor_induk_siswamahasiswa || '-';
    const rawJurusan = ctx.formValues?.childMajor || ctx.formValues?.major || ctx.formValues?.jurusan || ctx.formValues?.['[form_jurusanfakultasprodi]'] || ctx.formValues?.form_jurusanfakultasprodi || '-';
    const rawKelas = ctx.formValues?.childClass || ctx.formValues?.grade || ctx.formValues?.semester || ctx.formValues?.kelas || ctx.formValues?.['[form_kelassemester]'] || ctx.formValues?.form_kelassemester || '-';
    const rawAnakAlamat = ctx.formValues?.childAddress || ctx.formValues?.address || ctx.individu?.alamat || `Desa ${effectiveNamaDesa}, Kec. ${effectiveNamaKecamatan}, Kab. ${effectiveNamaKabupaten}`;

    baseMap.nama_anak = toTitleCaseIndonesian(rawAnakNama);
    baseMap.nik_anak = rawAnakNik;
    baseMap.ttl_anak = ttlAnak;
    baseMap.jenis_kelamin_anak = toTitleCaseIndonesian(rawAnakKelamin);
    baseMap.agama_anak = toTitleCaseIndonesian(rawAnakAgama);
    baseMap.form_sekolahperguruan_tinggi = toTitleCaseIndonesian(rawSekolah);
    baseMap.form_nomor_induk_siswamahasiswa = rawNis;
    baseMap.form_jurusanfakultasprodi = toTitleCaseIndonesian(rawJurusan);
    baseMap.form_kelassemester = toTitleCaseIndonesian(rawKelas);
    baseMap.alamat_anak = toTitleCaseIndonesian(rawAnakAlamat);

    // 2. Data Ayah
    const rawAyahNama = ctx.formValues?.fatherName || ctx.formValues?.namaAyah || ctx.formValues?.name || ctx.pelakuBagian?.ayah?.nama || baseMap.nama_ayah || 'SUGIONO';
    const rawAyahNik = ctx.formValues?.fatherNik || ctx.formValues?.nikAyah || ctx.pelakuBagian?.ayah?.nik || baseMap.nik_ayah || '-';
    const rawAyahTmp = ctx.formValues?.fatherBirthPlace || ctx.pelakuBagian?.ayah?.tempat_lahir || effectiveNamaKabupaten;
    const rawAyahTgl = ctx.formValues?.fatherBirthDate || ctx.pelakuBagian?.ayah?.tanggal_lahir || '';
    const normAyahTgl = rawAyahTgl && rawAyahTgl !== '-' ? normalizeDateInput(rawAyahTgl) : null;
    const tglAyahFmt = normAyahTgl ? formatTanggalIndonesia(normAyahTgl) : (rawAyahTgl || '-');
    const ttlAyah = rawAyahTmp && tglAyahFmt !== '-' ? `${toTitleCaseIndonesian(rawAyahTmp)}, ${tglAyahFmt}` : (toTitleCaseIndonesian(rawAyahTmp) || tglAyahFmt || '-');
    const rawAyahKerja = ctx.formValues?.fatherJob || ctx.formValues?.job || ctx.pelakuBagian?.ayah?.pekerjaan || baseMap.pekerjaan_ayah || 'Petani / Pekebun';
    const rawAyahAlamat = ctx.formValues?.fatherAddress || ctx.formValues?.address || ctx.pelakuBagian?.ayah?.alamat || baseMap.alamat_ayah || rawAnakAlamat;
    const rawPenghasilanAyah = ctx.formValues?.fatherIncome || ctx.formValues?.penghasilanAyah || ctx.formValues?.monthlyIncome || ctx.formValues?.['[form_penghasilan_ayah]'] || ctx.formValues?.form_penghasilan_ayah || '1500000';
    const numPenghasilanAyah = Number(String(rawPenghasilanAyah).replace(/[^0-9]/g, '')) || 0;
    const strPenghasilanAyah = numPenghasilanAyah > 0 ? `Rp ${numPenghasilanAyah.toLocaleString('id-ID')}` : 'Rp 0';
    const terbilangAyah = numPenghasilanAyah > 0 ? `${toTitleCaseIndonesian(terbilangIndonesia(numPenghasilanAyah))} Rupiah` : 'Nol Rupiah';

    baseMap.nama_ayah = toTitleCaseIndonesian(rawAyahNama);
    baseMap.nik_ayah = rawAyahNik;
    baseMap.ttl_ayah = ttlAyah;
    baseMap.pekerjaan_ayah = toTitleCaseIndonesian(rawAyahKerja);
    baseMap.alamat_ayah = toTitleCaseIndonesian(rawAyahAlamat);
    baseMap.form_penghasilan_ayah = strPenghasilanAyah;
    baseMap.terbilang_penghasilan_ayah = terbilangAyah;

    // 3. Data Ibu
    const rawIbuNama = ctx.formValues?.motherName || ctx.formValues?.namaIbu || ctx.pelakuBagian?.ibu?.nama || baseMap.nama_ibu || 'SUMINAH';
    const rawIbuNik = ctx.formValues?.motherNik || ctx.formValues?.nikIbu || ctx.pelakuBagian?.ibu?.nik || baseMap.nik_ibu || '-';
    const rawIbuTmp = ctx.formValues?.motherBirthPlace || ctx.pelakuBagian?.ibu?.tempat_lahir || effectiveNamaKabupaten;
    const rawIbuTgl = ctx.formValues?.motherBirthDate || ctx.pelakuBagian?.ibu?.tanggal_lahir || '';
    const normIbuTgl = rawIbuTgl && rawIbuTgl !== '-' ? normalizeDateInput(rawIbuTgl) : null;
    const tglIbuFmt = normIbuTgl ? formatTanggalIndonesia(normIbuTgl) : (rawIbuTgl || '-');
    const ttlIbu = rawIbuTmp && tglIbuFmt !== '-' ? `${toTitleCaseIndonesian(rawIbuTmp)}, ${tglIbuFmt}` : (toTitleCaseIndonesian(rawIbuTmp) || tglIbuFmt || '-');
    const rawIbuKerja = ctx.formValues?.motherJob || ctx.pelakuBagian?.ibu?.pekerjaan || baseMap.pekerjaan_ibu || 'Ibu Rumah Tangga';
    const rawIbuAlamat = ctx.formValues?.motherAddress || ctx.formValues?.address || ctx.pelakuBagian?.ibu?.alamat || baseMap.alamat_ibu || rawAnakAlamat;
    const rawPenghasilanIbu = ctx.formValues?.motherIncome || ctx.formValues?.penghasilanIbu || ctx.formValues?.['[form_penghasilan_ibu]'] || ctx.formValues?.form_penghasilan_ibu || '0';
    const numPenghasilanIbu = Number(String(rawPenghasilanIbu).replace(/[^0-9]/g, '')) || 0;
    const strPenghasilanIbu = numPenghasilanIbu > 0 ? `Rp ${numPenghasilanIbu.toLocaleString('id-ID')}` : 'Rp 0';
    const terbilangIbu = numPenghasilanIbu > 0 ? `${toTitleCaseIndonesian(terbilangIndonesia(numPenghasilanIbu))} Rupiah` : 'Nol Rupiah';

    baseMap.nama_ibu = toTitleCaseIndonesian(rawIbuNama);
    baseMap.nik_ibu = rawIbuNik;
    baseMap.ttl_ibu = ttlIbu;
    baseMap.pekerjaan_ibu = toTitleCaseIndonesian(rawIbuKerja);
    baseMap.alamat_ibu = toTitleCaseIndonesian(rawIbuAlamat);
    baseMap.form_penghasilan_ibu = strPenghasilanIbu;
    baseMap.terbilang_penghasilan_ibu = terbilangIbu;

    // 4. Total Penghasilan & Keperluan
    const numTotal = numPenghasilanAyah + numPenghasilanIbu > 0
      ? numPenghasilanAyah + numPenghasilanIbu
      : (Number(String(ctx.formValues?.monthlyIncome).replace(/[^0-9]/g, '')) || 1500000);
    const strTotal = `Rp ${numTotal.toLocaleString('id-ID')}`;
    const terbilangTotal = `${toTitleCaseIndonesian(terbilangIndonesia(numTotal))} Rupiah`;
    const tanggungan = ctx.formValues?.dependentsCount || ctx.formValues?.jumlahTanggungan || '3';
    const keperluan = ctx.formValues?.purpose || ctx.formValues?.form_keperluan || 'Persyaratan Beasiswa / KIP Kuliah';

    baseMap.total_penghasilan_orang_tua = strTotal;
    baseMap.terbilang_total_penghasilan = terbilangTotal;
    baseMap.form_jumlah_tanggungan = String(tanggungan).replace(/[^0-9]/g, '') || '3';
    baseMap.form_keperluan = toTitleCaseIndonesian(keperluan);
  }

  // Penyesuaian khusus untuk Surat Keterangan Reaktivasi BPJS Kesehatan (S-15)
  const isSuratReaktivasiBpjsContext =
    (ctx.judulSurat || '').toLowerCase().includes('reaktivasi bpjs') ||
    (ctx.judulSurat || '').toLowerCase().includes('jamkesos') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-15' ||
    result.includes('SURAT KETERANGAN REAKTIVASI BPJS KESEHATAN') ||
    result.includes('[Form_rekam_medis]') ||
    result.includes('[Form_no_bpjs]');

  if (isSuratReaktivasiBpjsContext) {
    const rawRekamMedis =
      baseMap.form_rekam_medis ||
      baseMap.rekam_medis ||
      baseMap.rekammedis ||
      baseMap.form_rekammedis ||
      baseMap.norekammedis ||
      ctx.formValues?.rekamMedis ||
      ctx.formValues?.noRekamMedis ||
      ctx.formValues?.form_rekam_medis ||
      ctx.formValues?.['[form_rekam_medis]'] ||
      '0000003';

    const rawJenisPenyakit =
      baseMap.form_jenis_penyakit ||
      baseMap.jenis_penyakit ||
      baseMap.jenispenyakit ||
      baseMap.form_jenispenyakit ||
      baseMap.diagnosa ||
      ctx.formValues?.jenisPenyakit ||
      ctx.formValues?.diagnosa ||
      ctx.formValues?.form_jenis_penyakit ||
      ctx.formValues?.['[form_jenis_penyakit]'] ||
      'Gagal Ginjal';

    const rawNoBpjs =
      baseMap.form_no_bpjs ||
      baseMap.no_bpjs ||
      baseMap.nobpjs ||
      baseMap.form_nobpjs ||
      baseMap.no_kartu_jamkesos ||
      baseMap.form_no_kartu_jamkesos ||
      baseMap.nokartu ||
      ctx.formValues?.noBpjs ||
      ctx.formValues?.noBpjsKesehatan ||
      ctx.formValues?.form_no_bpjs ||
      ctx.formValues?.['[form_no_bpjs]'] ||
      ctx.formValues?.form_no_kartu_jamkesos ||
      '0000000006677';

    baseMap.form_rekam_medis = String(rawRekamMedis).trim();
    baseMap.rekam_medis = String(rawRekamMedis).trim();
    baseMap.form_jenis_penyakit = toTitleCaseIndonesian(String(rawJenisPenyakit).trim());
    baseMap.jenis_penyakit = toTitleCaseIndonesian(String(rawJenisPenyakit).trim());
    baseMap.form_no_bpjs = String(rawNoBpjs).trim();
    baseMap.no_bpjs = String(rawNoBpjs).trim();
  }

  // Penyesuaian khusus untuk Surat Keterangan Pemakaman (474.3)
  const isSuratPemakamanContext =
    (ctx.judulSurat || '').toLowerCase().includes('pemakaman') ||
    (ctx.kodeSurat || '').toLowerCase() === '474.3' ||
    result.includes('SURAT KETERANGAN PEMAKAMAN') ||
    result.includes('Dimakamkan pada') ||
    result.includes('[Hari_dan_tanggal_pemakaman]') ||
    result.includes('[Tempat_pemakaman]');

  if (isSuratPemakamanContext) {
    // 1. Data Kematian
    const rawDeathDate =
      ctx.formValues?.deathDate ||
      ctx.formValues?.tanggal_kematian ||
      ctx.formValues?.deathDateFormatted ||
      baseMap.tanggal_kematian ||
      '';
    let deathDateFmt = baseMap.tanggal_kematian || '-';
    let deathDayFmt = baseMap.hari_kematian || '-';
    let deathDayDateFmt = baseMap.hari_dan_tanggal_kematian || '';

    if (rawDeathDate) {
      const d = new Date(rawDeathDate);
      if (!isNaN(d.getTime())) {
        deathDateFmt = formatTanggalIndonesia(d);
        deathDayFmt = getNamaHariIndonesia(d);
        deathDayDateFmt = `${deathDayFmt}, ${deathDateFmt}`;
      } else {
        deathDayDateFmt = String(rawDeathDate);
      }
    }

    const rawDeathTime =
      ctx.formValues?.deathTime ||
      ctx.formValues?.jam_kematian ||
      ctx.formValues?.waktu_kematian ||
      baseMap.jam_kematian ||
      '09.00 WIB';

    // 2. Data Pemakaman
    const rawBurialDate =
      ctx.formValues?.burialDate ||
      ctx.formValues?.tanggal_pemakaman ||
      ctx.formValues?.burialDateFormatted ||
      rawDeathDate;
    let burialDateFmt = '-';
    let burialDayFmt = '-';
    let burialDayDateFmt = baseMap.hari_dan_tanggal_pemakaman || '';

    if (rawBurialDate) {
      const d = new Date(rawBurialDate);
      if (!isNaN(d.getTime())) {
        burialDateFmt = formatTanggalIndonesia(d);
        burialDayFmt = getNamaHariIndonesia(d);
        burialDayDateFmt = `${burialDayFmt}, ${burialDateFmt}`;
      } else {
        burialDayDateFmt = String(rawBurialDate);
      }
    } else {
      burialDayDateFmt = deathDayDateFmt;
    }

    const rawBurialTime =
      ctx.formValues?.burialTime ||
      ctx.formValues?.jam_pemakaman ||
      ctx.formValues?.waktu_pemakaman ||
      '13.00 WIB';

    const rawBurialLoc =
      ctx.formValues?.burialLocation ||
      ctx.formValues?.tempat_pemakaman ||
      ctx.formValues?.lokasi_tpu ||
      `Pemakaman Islam Desa ${effectiveNamaDesa}`;

    const rawNoKk =
      ctx.formValues?.noKk ||
      ctx.formValues?.no_kk ||
      ctx.formValues?.nomor_kk ||
      ctx.individu?.no_kk ||
      baseMap.no_kk ||
      '-';

    baseMap.hari_dan_tanggal_kematian = deathDayDateFmt;
    baseMap.hari_tanggal_kematian = deathDayDateFmt;
    baseMap.jam_kematian = String(rawDeathTime);
    baseMap.waktu_kematian = String(rawDeathTime);
    baseMap.hari_dan_tanggal_pemakaman = burialDayDateFmt;
    baseMap.hari_tanggal_pemakaman = burialDayDateFmt;
    baseMap.jam_pemakaman = String(rawBurialTime);
    baseMap.waktu_pemakaman = String(rawBurialTime);
    baseMap.tempat_pemakaman = toTitleCaseIndonesian(String(rawBurialLoc));
    baseMap.lokasi_pemakaman = toTitleCaseIndonesian(String(rawBurialLoc));
    baseMap.lokasi_tpu = toTitleCaseIndonesian(String(rawBurialLoc));
    baseMap.no_kk = String(rawNoKk);
    baseMap.nomor_kk = String(rawNoKk);
  }

  // Penyesuaian khusus untuk Surat Keterangan Jual Beli (S-05)
  const isSuratJualBeliContext =
    (ctx.judulSurat || '').toLowerCase().includes('jual beli') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-05' ||
    result.includes('SURAT KETERANGAN JUAL BELI TANAH') ||
    result.includes('hendak menjual') ||
    result.includes('[Form_rincian_barang]') ||
    result.includes('[NAma_pembeli]');

  if (isSuratJualBeliContext) {
    // 1. Data Penjual (Pihak I)
    const rawNamaPenjual = ctx.individu?.nama || baseMap.nama_penjual || baseMap.nama || '-';
    const rawTmpPenjual = ctx.individu?.tempat_lahir || baseMap.tempatlahir_penjual || baseMap.tempat_lahir || effectiveNamaKabupaten;
    const rawTglPenjual = ctx.individu?.tanggal_lahir || baseMap.tanggallahir_penjual || baseMap.tanggal_lahir || '';
    const normTglPenjual = rawTglPenjual && rawTglPenjual !== '-' ? normalizeDateInput(rawTglPenjual) : null;
    const tglPenjualFmt = normTglPenjual ? formatTanggalIndonesia(normTglPenjual) : (rawTglPenjual || '-');
    const ttlPenjual = (rawTmpPenjual && tglPenjualFmt !== '-') ? `${toTitleCaseIndonesian(rawTmpPenjual)}, ${tglPenjualFmt}` : (rawTmpPenjual || tglPenjualFmt || '-');
    const rawKerjaPenjual = ctx.individu?.pekerjaan || baseMap.pekerjaan_penjual || baseMap.pekerjaan || 'Petani / Wiraswasta';
    const rawNikPenjual = ctx.individu?.nik || baseMap.nik_penjual || baseMap.nik || '-';
    const rawDesaPenjual = baseMap.desa_penjual || ctx.formValues?.sellerDesa || ctx.individu?.dusun || effectiveNamaDesa;
    const rawRtPenjual = baseMap.rt_penjual || ctx.formValues?.sellerRt || ctx.individu?.rt || '001';
    const rawRwPenjual = baseMap.rw_penjual || ctx.formValues?.sellerRw || ctx.individu?.rw || '001';
    const rawKecPenjual = baseMap.kecamatan_penjual || ctx.formValues?.sellerKecamatan || effectiveNamaKecamatan;
    const rawKabPenjual = baseMap.kabupaten_penjual || ctx.formValues?.sellerKabupaten || effectiveNamaKabupaten;

    baseMap.nama_penjual = toTitleCaseIndonesian(rawNamaPenjual);
    baseMap.ttl_penjual = ttlPenjual;
    baseMap.pekerjaan_penjual = toTitleCaseIndonesian(rawKerjaPenjual);
    baseMap.nik_penjual = rawNikPenjual;
    baseMap.desa_penjual = toTitleCaseIndonesian(rawDesaPenjual);
    baseMap.rt_penjual = rawRtPenjual;
    baseMap.rw_penjual = rawRwPenjual;
    baseMap.kecamatan_penjual = toTitleCaseIndonesian(rawKecPenjual);
    baseMap.kabupaten_penjual = toTitleCaseIndonesian(rawKabPenjual);

    // 2. Data Pembeli (Pihak II)
    const pembeliObj = (ctx.pelakuBagian as any)?.pembeli || {};
    const rawNamaPembeli =
      baseMap.nama_pembeli ||
      baseMap.form_nama_pembeli ||
      ctx.formValues?.buyerName ||
      ctx.formValues?.nama_pembeli ||
      pembeliObj.nama ||
      '-';
    const rawNikPembeli =
      baseMap.nik_pembeli ||
      baseMap.form_nik_pembeli ||
      ctx.formValues?.buyerNik ||
      ctx.formValues?.nik_pembeli ||
      pembeliObj.nik ||
      '-';
    const rawTmpPembeli =
      baseMap.tempatlahir_pembeli ||
      baseMap.tempat_lahir_pembeli ||
      baseMap.form_tempatlahir_pembeli ||
      ctx.formValues?.buyerBirthPlace ||
      ctx.formValues?.tempatlahir_pembeli ||
      pembeliObj.tempat_lahir ||
      effectiveNamaKabupaten;
    const rawTglPembeli =
      baseMap.tanggallahir_pembeli ||
      baseMap.tanggal_lahir_pembeli ||
      baseMap.form_tanggallahir_pembeli ||
      ctx.formValues?.buyerBirthDate ||
      ctx.formValues?.tanggallahir_pembeli ||
      pembeliObj.tanggal_lahir ||
      '';
    const normTglPembeli = rawTglPembeli && rawTglPembeli !== '-' ? normalizeDateInput(rawTglPembeli) : null;
    const tglPembeliFmt = normTglPembeli ? formatTanggalIndonesia(normTglPembeli) : (rawTglPembeli || '-');
    const ttlPembeli = (rawTmpPembeli && tglPembeliFmt !== '-') ? `${toTitleCaseIndonesian(rawTmpPembeli)}, ${tglPembeliFmt}` : (rawTmpPembeli || tglPembeliFmt || '-');

    const rawJkPembeli =
      baseMap.jenis_kelamin_pembeli ||
      baseMap.form_jenis_kelamin_pembeli ||
      ctx.formValues?.buyerGender ||
      ctx.formValues?.jenis_kelamin_pembeli ||
      pembeliObj.jenis_kelamin ||
      'Laki-Laki';
    const jkPembeli =
      String(rawJkPembeli).toLowerCase().includes('perempuan') || String(rawJkPembeli).toLowerCase() === 'p'
        ? 'Perempuan'
        : 'Laki-Laki';

    const rawKerjaPembeli =
      baseMap.pekerjaan_pembeli ||
      baseMap.form_pekerjaan_pembeli ||
      ctx.formValues?.buyerJob ||
      ctx.formValues?.pekerjaan_pembeli ||
      pembeliObj.pekerjaan ||
      'Wiraswasta';

    const rawDesaPembeli = baseMap.desa_pembeli || ctx.formValues?.buyerDesa || (pembeliObj as any)?.dusun || (pembeliObj as any)?.desa || effectiveNamaDesa;
    const rawRtPembeli = baseMap.rt_pembeli || ctx.formValues?.buyerRt || (pembeliObj as any)?.rt || '001';
    const rawRwPembeli = baseMap.rw_pembeli || ctx.formValues?.buyerRw || (pembeliObj as any)?.rw || '001';
    const rawKecPembeli = baseMap.kecamatan_pembeli || ctx.formValues?.buyerKecamatan || effectiveNamaKecamatan;
    const rawKabPembeli = baseMap.kabupaten_pembeli || ctx.formValues?.buyerKabupaten || effectiveNamaKabupaten;
    const rawAlamatPembeli =
      baseMap.alamat_pembeli ||
      baseMap.form_alamat_pembeli ||
      ctx.formValues?.buyerAddress ||
      ctx.formValues?.alamat_pembeli ||
      pembeliObj.alamat ||
      `Desa ${rawDesaPembeli}, RT ${rawRtPembeli} / RW ${rawRwPembeli}, Kecamatan ${rawKecPembeli}, Kabupaten ${rawKabPembeli}`;

    baseMap.nama_pembeli = rawNamaPembeli !== '-' ? toTitleCaseIndonesian(rawNamaPembeli) : '-';
    baseMap.ttl_pembeli = ttlPembeli;
    baseMap.nik_pembeli = rawNikPembeli;
    baseMap.tempatlahir_pembeli = rawTmpPembeli !== '-' ? toTitleCaseIndonesian(rawTmpPembeli) : effectiveNamaKabupaten;
    baseMap.tanggallahir_pembeli = tglPembeliFmt;
    baseMap.jenis_kelamin_pembeli = jkPembeli;
    baseMap.alamat_pembeli = rawAlamatPembeli !== '-' ? toTitleCaseIndonesian(rawAlamatPembeli) : '-';
    baseMap.pekerjaan_pembeli = rawKerjaPembeli !== '-' ? toTitleCaseIndonesian(rawKerjaPembeli) : '-';
    baseMap.desa_pembeli = toTitleCaseIndonesian(rawDesaPembeli);
    baseMap.rt_pembeli = rawRtPembeli;
    baseMap.rw_pembeli = rawRwPembeli;
    baseMap.kecamatan_pembeli = toTitleCaseIndonesian(rawKecPembeli);
    baseMap.kabupaten_pembeli = toTitleCaseIndonesian(rawKabPembeli);

    // 3. Tanggal Transaksi (Hari, Tanggal, Bulan, Tahun)
    const rawTxDate = ctx.formValues?.transactionDate || baseMap.transactionDate || baseMap.tanggal_transaksi || '';
    let parsedTxDate: Date | null = null;
    if (rawTxDate && !isNaN(new Date(rawTxDate).getTime())) {
      parsedTxDate = new Date(rawTxDate);
    } else {
      parsedTxDate = now;
    }
    baseMap.hari_transaksi = getNamaHariIndonesia(parsedTxDate);
    baseMap.tgl_angka_transaksi = String(parsedTxDate.getDate()).padStart(2, '0');
    baseMap.bulan_transaksi = BULAN_INDONESIA[parsedTxDate.getMonth()];
    baseMap.tahun_transaksi = String(parsedTxDate.getFullYear());

    // 4. Rincian Objek Tanah
    const rawDesaTanah = baseMap.desa_tanah || ctx.formValues?.landDesa || effectiveNamaDesa;
    const rawKecTanah = baseMap.kecamatan_tanah || ctx.formValues?.landKecamatan || effectiveNamaKecamatan;
    const rawKabTanah = baseMap.kabupaten_tanah || ctx.formValues?.landKabupaten || effectiveNamaKabupaten;
    const rawLuasTanah = baseMap.luas_tanah || ctx.formValues?.landArea || baseMap.luashak || '350';
    const rawPanjangTanah = baseMap.panjang_tanah || ctx.formValues?.landLength || '25';
    const rawLebarTanah = baseMap.lebar_tanah || ctx.formValues?.landWidth || '14';
    const rawJenisAlasHak = baseMap.jenis_alas_hak || ctx.formValues?.certificateType || 'Letter C';
    const rawNomorAlasHak = baseMap.nomor_alas_hak || ctx.formValues?.certificateNumber || '-';
    const alasHakLengkap = rawNomorAlasHak.toLowerCase().includes(rawJenisAlasHak.toLowerCase())
      ? rawNomorAlasHak
      : `${rawJenisAlasHak} No. ${rawNomorAlasHak}`;

    const rawBatasU = baseMap.batas_utara || ctx.formValues?.boundaryNorth || '-';
    const rawBatasS = baseMap.batas_selatan || ctx.formValues?.boundarySouth || '-';
    const rawBatasT = baseMap.batas_timur || ctx.formValues?.boundaryEast || '-';
    const rawBatasB = baseMap.batas_barat || ctx.formValues?.boundaryWest || '-';

    baseMap.desa_tanah = toTitleCaseIndonesian(rawDesaTanah);
    baseMap.kecamatan_tanah = toTitleCaseIndonesian(rawKecTanah);
    baseMap.kabupaten_tanah = toTitleCaseIndonesian(rawKabTanah);
    baseMap.luas_tanah = rawLuasTanah;
    baseMap.panjang_tanah = rawPanjangTanah;
    baseMap.lebar_tanah = rawLebarTanah;
    baseMap.jenis_alas_hak = rawJenisAlasHak;
    baseMap.nomor_alas_hak = rawNomorAlasHak;
    baseMap.alas_hak_lengkap = alasHakLengkap;
    baseMap.batas_utara = toTitleCaseIndonesian(rawBatasU);
    baseMap.batas_selatan = toTitleCaseIndonesian(rawBatasS);
    baseMap.batas_timur = toTitleCaseIndonesian(rawBatasT);
    baseMap.batas_barat = toTitleCaseIndonesian(rawBatasB);

    // 5. Harga dan Biaya
    const rawHargaVal = String(ctx.formValues?.transactionPrice || baseMap.transactionPrice || baseMap.harga_transaksi || '0').replace(/[^0-9]/g, '');
    const numHarga = Number(rawHargaVal) || 0;
    const fmtHarga = numHarga > 0 ? `${numHarga.toLocaleString('id-ID')},-` : (ctx.formValues?.transactionPrice || '-');
    const terbilangHarga = (ctx.formValues?.priceInWords || baseMap.harga_terbilang || (numHarga > 0 ? `${terbilangIndonesia(numHarga)} rupiah` : '-')).trim();

    baseMap.harga_transaksi = fmtHarga;
    baseMap.harga_terbilang = terbilangHarga;
    baseMap.biaya_ditanggung_oleh = baseMap.biaya_ditanggung_oleh || ctx.formValues?.costBearer || 'Pihak Kedua (Pembeli)';

    // 6. Tanggal Surat & Saksi
    baseMap.tgl_surat_format = formatTanggalIndonesia(ctx.tanggalSurat || now);

    const rawSaksi1 = baseMap.saksi_pihak_1 || ctx.formValues?.witness1 || baseMap.witness1 || '....................................';
    const rawSaksi2 = baseMap.saksi_pihak_2 || ctx.formValues?.witness2 || baseMap.witness2 || '....................................';
    baseMap.saksi_pihak_1 = rawSaksi1 !== '....................................' ? toTitleCaseIndonesian(rawSaksi1) : rawSaksi1;
    baseMap.saksi_pihak_2 = rawSaksi2 !== '....................................' ? toTitleCaseIndonesian(rawSaksi2) : rawSaksi2;

    // Backward compatibility OpenSID legacy fields
    baseMap.form_jenis_barang = 'Sebidang Tanah Pekarangan';
    baseMap.jenis_barang = 'Sebidang Tanah Pekarangan';
    baseMap.form_rincian_barang = `${alasHakLengkap} Luas &plusmn; ${rawLuasTanah} m2 terletak di Desa ${rawDesaTanah}`;
    baseMap.rincian_barang = baseMap.form_rincian_barang;
    baseMap.form_keterangan = `Pengesahan Bukti Transaksi Jual Beli Tanah di Pemerintah Desa ${effectiveNamaDesa}`;
    baseMap.form_nama_ketua_adat = '...........................................';
  }

  // Sinkronisasi data Saksi I, Saksi II, dan Keperluan Lampiran (mis. SP-HILANG & SPTJM-BN & SP-BM & F-2.12 / F-2.01)
  const resolvedNamaSaksi1 =
    baseMap.form_nama_saksi_1 ||
    baseMap.form_nama_saksi_i ||
    baseMap.nama_saksi_1 ||
    baseMap.form_nama_saksi1 ||
    baseMap.witness1name ||
    (ctx.pelakuBagian?.saksi_1?.nama) ||
    (ctx.pelakuBagian?.saksi_i?.nama) ||
    '-';
  const resolvedNikSaksi1 =
    baseMap.form_nik_saksi_1 ||
    baseMap.form_nik_saksi_i ||
    baseMap.nik_saksi_1 ||
    baseMap.form_nik_saksi1 ||
    baseMap.witness1nik ||
    (ctx.pelakuBagian?.saksi_1?.nik) ||
    (ctx.pelakuBagian?.saksi_i?.nik) ||
    '-';
  const resolvedTmpLahirSaksi1 =
    baseMap.form_tempat_lahir_saksi_1 ||
    baseMap.form_tempat_lahir_saksi_i ||
    baseMap.tempat_lahir_saksi_1 ||
    baseMap.form_tempat_lahir_saksi1 ||
    baseMap.witness1birthplace ||
    (ctx.pelakuBagian?.saksi_1?.tempat_lahir) ||
    (ctx.pelakuBagian?.saksi_i?.tempat_lahir) ||
    '';
  const resolvedTglLahirSaksi1 =
    baseMap.form_tanggal_lahir_saksi_1 ||
    baseMap.form_tanggal_lahir_saksi_i ||
    baseMap.tanggal_lahir_saksi_1 ||
    baseMap.form_tanggal_lahir_saksi1 ||
    baseMap.witness1birthdate ||
    (ctx.pelakuBagian?.saksi_1?.tanggal_lahir) ||
    (ctx.pelakuBagian?.saksi_i?.tanggal_lahir) ||
    '';
  const resolvedTtlSaksi1 =
    baseMap.form_ttl_saksi_1 ||
    baseMap.form_ttl_saksi_i ||
    baseMap.ttl_saksi_1 ||
    formatTtlLahirHelper(resolvedTmpLahirSaksi1, resolvedTglLahirSaksi1);
  const resolvedAgamaSaksi1 =
    baseMap.form_agama_saksi_1 ||
    baseMap.form_agama_saksi_i ||
    baseMap.agama_saksi_1 ||
    baseMap.form_agama_saksi1 ||
    baseMap.witness1religion ||
    (ctx.pelakuBagian?.saksi_1?.agama) ||
    (ctx.pelakuBagian?.saksi_i?.agama) ||
    'Islam';
  const resolvedPekerjaanSaksi1 =
    baseMap.form_pekerjaan_saksi_1 ||
    baseMap.form_pekerjaan_saksi_i ||
    baseMap.pekerjaan_saksi_1 ||
    baseMap.form_pekerjaan_saksi1 ||
    baseMap.witness1job ||
    (ctx.pelakuBagian?.saksi_1?.pekerjaan) ||
    (ctx.pelakuBagian?.saksi_i?.pekerjaan) ||
    '-';
  const resolvedAlamatSaksi1 =
    baseMap.form_alamat_saksi_1 ||
    baseMap.form_alamat_saksi_i ||
    baseMap.alamat_saksi_1 ||
    baseMap.form_alamat_saksi1 ||
    baseMap.witness1address ||
    (ctx.pelakuBagian?.saksi_1?.alamat) ||
    (ctx.pelakuBagian?.saksi_i?.alamat) ||
    '-';

  const resolvedNamaSaksi2 =
    baseMap.form_nama_saksi_2 ||
    baseMap.form_nama_saksi_ii ||
    baseMap.nama_saksi_2 ||
    baseMap.form_nama_saksi2 ||
    baseMap.witness2name ||
    (ctx.pelakuBagian?.saksi_2?.nama) ||
    (ctx.pelakuBagian?.saksi_ii?.nama) ||
    '-';
  const resolvedNikSaksi2 =
    baseMap.form_nik_saksi_2 ||
    baseMap.form_nik_saksi_ii ||
    baseMap.nik_saksi_2 ||
    baseMap.form_nik_saksi2 ||
    baseMap.witness2nik ||
    (ctx.pelakuBagian?.saksi_2?.nik) ||
    (ctx.pelakuBagian?.saksi_ii?.nik) ||
    '-';
  const resolvedTmpLahirSaksi2 =
    baseMap.form_tempat_lahir_saksi_2 ||
    baseMap.form_tempat_lahir_saksi_ii ||
    baseMap.tempat_lahir_saksi_2 ||
    baseMap.form_tempat_lahir_saksi2 ||
    baseMap.witness2birthplace ||
    (ctx.pelakuBagian?.saksi_2?.tempat_lahir) ||
    (ctx.pelakuBagian?.saksi_ii?.tempat_lahir) ||
    '';
  const resolvedTglLahirSaksi2 =
    baseMap.form_tanggal_lahir_saksi_2 ||
    baseMap.form_tanggal_lahir_saksi_ii ||
    baseMap.tanggal_lahir_saksi_2 ||
    baseMap.form_tanggal_lahir_saksi2 ||
    baseMap.witness2birthdate ||
    (ctx.pelakuBagian?.saksi_2?.tanggal_lahir) ||
    (ctx.pelakuBagian?.saksi_ii?.tanggal_lahir) ||
    '';
  const resolvedTtlSaksi2 =
    baseMap.form_ttl_saksi_2 ||
    baseMap.form_ttl_saksi_ii ||
    baseMap.ttl_saksi_2 ||
    formatTtlLahirHelper(resolvedTmpLahirSaksi2, resolvedTglLahirSaksi2);
  const resolvedAgamaSaksi2 =
    baseMap.form_agama_saksi_2 ||
    baseMap.form_agama_saksi_ii ||
    baseMap.agama_saksi_2 ||
    baseMap.form_agama_saksi2 ||
    baseMap.witness2religion ||
    (ctx.pelakuBagian?.saksi_2?.agama) ||
    (ctx.pelakuBagian?.saksi_ii?.agama) ||
    'Islam';
  const resolvedPekerjaanSaksi2 =
    baseMap.form_pekerjaan_saksi_2 ||
    baseMap.form_pekerjaan_saksi_ii ||
    baseMap.pekerjaan_saksi_2 ||
    baseMap.form_pekerjaan_saksi2 ||
    baseMap.witness2job ||
    (ctx.pelakuBagian?.saksi_2?.pekerjaan) ||
    (ctx.pelakuBagian?.saksi_ii?.pekerjaan) ||
    '-';
  const resolvedAlamatSaksi2 =
    baseMap.form_alamat_saksi_2 ||
    baseMap.form_alamat_saksi_ii ||
    baseMap.alamat_saksi_2 ||
    baseMap.form_alamat_saksi2 ||
    baseMap.witness2address ||
    (ctx.pelakuBagian?.saksi_2?.alamat) ||
    (ctx.pelakuBagian?.saksi_ii?.alamat) ||
    '-';

  const resolvedUmurSaksi1 =
    baseMap.form_umur_saksi_1 ||
    baseMap.umursaksii ||
    baseMap.form_usia_saksi_1 ||
    baseMap.usia_saksi_1 ||
    baseMap.umur_saksi_1 ||
    baseMap.usia_saksi_i ||
    (resolvedTglLahirSaksi1 ? hitungUmurIndonesia(resolvedTglLahirSaksi1).replace(/Tahun/i, '').trim() : '') ||
    '-';

  const resolvedUmurSaksi2 =
    baseMap.form_umur_saksi_2 ||
    baseMap.umursaksiii ||
    baseMap.form_usia_saksi_2 ||
    baseMap.usia_saksi_2 ||
    baseMap.umur_saksi_2 ||
    baseMap.usia_saksi_ii ||
    (resolvedTglLahirSaksi2 ? hitungUmurIndonesia(resolvedTglLahirSaksi2).replace(/Tahun/i, '').trim() : '') ||
    '-';

  baseMap.form_nama_saksi_1 = toTitleCaseIndonesian(resolvedNamaSaksi1);
  baseMap.nama_saksi_1 = toTitleCaseIndonesian(resolvedNamaSaksi1);
  baseMap.form_nama_saksi1 = toTitleCaseIndonesian(resolvedNamaSaksi1);
  baseMap.namasaksii = toTitleCaseIndonesian(resolvedNamaSaksi1);
  baseMap.nama_saksi_i = toTitleCaseIndonesian(resolvedNamaSaksi1);
  baseMap.form_nik_saksi_1 = resolvedNikSaksi1;
  baseMap.nik_saksi_1 = resolvedNikSaksi1;
  baseMap.form_nik_saksi1 = resolvedNikSaksi1;
  baseMap.form_tempat_lahir_saksi_1 = resolvedTmpLahirSaksi1;
  baseMap.tempat_lahir_saksi_1 = resolvedTmpLahirSaksi1;
  baseMap.form_tanggal_lahir_saksi_1 = resolvedTglLahirSaksi1;
  baseMap.tanggal_lahir_saksi_1 = resolvedTglLahirSaksi1;
  baseMap.form_ttl_saksi_1 = resolvedTtlSaksi1;
  baseMap.ttl_saksi_1 = resolvedTtlSaksi1;
  baseMap.form_umur_saksi_1 = resolvedUmurSaksi1;
  baseMap.umursaksii = resolvedUmurSaksi1;
  baseMap.usia_saksi_i = resolvedUmurSaksi1;
  baseMap.form_agama_saksi_1 = toTitleCaseIndonesian(resolvedAgamaSaksi1);
  baseMap.agama_saksi_1 = toTitleCaseIndonesian(resolvedAgamaSaksi1);
  baseMap.form_pekerjaan_saksi_1 = toTitleCaseIndonesian(resolvedPekerjaanSaksi1);
  baseMap.pekerjaan_saksi_1 = toTitleCaseIndonesian(resolvedPekerjaanSaksi1);
  baseMap.pekerjaansaksii = toTitleCaseIndonesian(resolvedPekerjaanSaksi1);
  baseMap.pekerjaan_saksi_i = toTitleCaseIndonesian(resolvedPekerjaanSaksi1);
  baseMap.form_alamat_saksi_1 = resolvedAlamatSaksi1;
  baseMap.alamat_saksi_1 = resolvedAlamatSaksi1;
  baseMap.alamatsaksii = resolvedAlamatSaksi1;
  baseMap.alamat_saksi_i = resolvedAlamatSaksi1;

  baseMap.form_nama_saksi_2 = toTitleCaseIndonesian(resolvedNamaSaksi2);
  baseMap.nama_saksi_2 = toTitleCaseIndonesian(resolvedNamaSaksi2);
  baseMap.form_nama_saksi2 = toTitleCaseIndonesian(resolvedNamaSaksi2);
  baseMap.namasaksiii = toTitleCaseIndonesian(resolvedNamaSaksi2);
  baseMap.nama_saksi_ii = toTitleCaseIndonesian(resolvedNamaSaksi2);
  baseMap.form_nik_saksi_2 = resolvedNikSaksi2;
  baseMap.nik_saksi_2 = resolvedNikSaksi2;
  baseMap.form_nik_saksi2 = resolvedNikSaksi2;
  baseMap.form_tempat_lahir_saksi_2 = resolvedTmpLahirSaksi2;
  baseMap.tempat_lahir_saksi_2 = resolvedTmpLahirSaksi2;
  baseMap.form_tanggal_lahir_saksi_2 = resolvedTglLahirSaksi2;
  baseMap.tanggal_lahir_saksi_2 = resolvedTglLahirSaksi2;
  baseMap.form_ttl_saksi_2 = resolvedTtlSaksi2;
  baseMap.ttl_saksi_2 = resolvedTtlSaksi2;
  baseMap.form_umur_saksi_2 = resolvedUmurSaksi2;
  baseMap.umursaksiii = resolvedUmurSaksi2;
  baseMap.usia_saksi_ii = resolvedUmurSaksi2;
  baseMap.form_agama_saksi_2 = toTitleCaseIndonesian(resolvedAgamaSaksi2);
  baseMap.agama_saksi_2 = toTitleCaseIndonesian(resolvedAgamaSaksi2);
  baseMap.form_pekerjaan_saksi_2 = toTitleCaseIndonesian(resolvedPekerjaanSaksi2);
  baseMap.pekerjaan_saksi_2 = toTitleCaseIndonesian(resolvedPekerjaanSaksi2);
  baseMap.pekerjaansaksiii = toTitleCaseIndonesian(resolvedPekerjaanSaksi2);
  baseMap.pekerjaan_saksi_ii = toTitleCaseIndonesian(resolvedPekerjaanSaksi2);
  baseMap.form_alamat_saksi_2 = resolvedAlamatSaksi2;
  baseMap.alamat_saksi_2 = resolvedAlamatSaksi2;
  baseMap.alamatsaksiii = resolvedAlamatSaksi2;
  baseMap.alamat_saksi_ii = resolvedAlamatSaksi2;

  let resolvedKeperluanLampiran =
    baseMap.form_keperluan_lampiran ||
    baseMap.form_keperluan ||
    baseMap.form_alasan_duplikat ||
    baseMap.keperluan ||
    '';

  if (!resolvedKeperluanLampiran || resolvedKeperluanLampiran === '[Form_Keperluan_Lampiran]') {
    if (isSuratDuplikatAkta) {
      const namaAnak = baseMap.form_nama_anak || baseMap.nama_anak || '';
      const noAkta = baseMap.form_no_akta_kelahiran || '';
      resolvedKeperluanLampiran = `Permohonan Duplikat Akta Kelahiran${namaAnak && namaAnak !== '-' ? ` atas nama ${namaAnak}` : ''}${noAkta && noAkta !== '-' ? ` (No. Akta: ${noAkta})` : ''} dikarenakan dokumen Akta Kelahiran Asli Rusak / Hilang Tercecer.`;
    } else {
      resolvedKeperluanLampiran = 'Surat Keterangan Kehilangan Dokumen / Barang untuk pengurusan penerbitan dokumen baru.';
    }
  }
  baseMap.form_keperluan_lampiran = resolvedKeperluanLampiran;
  baseMap.jabatan_pamong = effectiveJabatanPamong;

  // Penyesuaian khusus untuk Surat Keterangan Izin Keluarga (Bekerja / Merantau / CTKI)
  const isSuratIzinKeluarga =
    (ctx.judulSurat || '').toLowerCase().includes('izin keluarga') ||
    (ctx.judulSurat || '').toLowerCase().includes('izin orang tua') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-39' ||
    (ctx.kodeSurat || '').toLowerCase() === '140' ||
    Boolean(
      ctx.formValues?.grantorName ||
      ctx.formValues?.granteeName ||
      baseMap.grantorName ||
      baseMap.granteeName ||
      baseMap.nama_pemberi_izin ||
      baseMap.nama_penerima_izin
    );

  if (isSuratIzinKeluarga) {
    // 1. Data Pihak yang Memberi Izin (Grantor)
    const rawNamaGrantor =
      baseMap.nama_pemberi_izin ||
      baseMap.form_nama_pemberi_izin ||
      ctx.formValues?.grantorName ||
      ctx.formValues?.grantor_name ||
      ctx.formValues?.nama_pemberi_izin ||
      baseMap.nama ||
      ctx.requesterName ||
      '-';
    const rawNikGrantor =
      baseMap.nik_pemberi_izin ||
      baseMap.form_nik_pemberi_izin ||
      ctx.formValues?.grantorNik ||
      ctx.formValues?.grantor_nik ||
      ctx.formValues?.nik_pemberi_izin ||
      baseMap.nik ||
      '-';
    const rawTmpGrantor =
      baseMap.tempat_lahir_pemberi_izin ||
      ctx.formValues?.grantorBirthPlace ||
      ctx.formValues?.grantor_birth_place ||
      baseMap.tempat_lahir ||
      effectiveNamaKabupaten;
    const rawTglGrantor =
      baseMap.tanggal_lahir_pemberi_izin ||
      ctx.formValues?.grantorBirthDate ||
      ctx.formValues?.grantor_birth_date ||
      baseMap.tanggal_lahir ||
      '';
    const normTglGrantor = rawTglGrantor && rawTglGrantor !== '-' ? normalizeDateInput(rawTglGrantor) : null;
    const tglGrantorFmt = normTglGrantor ? formatTanggalIndonesia(normTglGrantor) : (rawTglGrantor || '-');
    const ttlGrantor = (rawTmpGrantor && tglGrantorFmt !== '-') ? `${toTitleCaseIndonesian(rawTmpGrantor)}, ${tglGrantorFmt}` : (toTitleCaseIndonesian(rawTmpGrantor) || tglGrantorFmt || '-');

    const rawWnaGrantor =
      baseMap.warga_negara_pemberi_izin ||
      ctx.formValues?.grantorNationality ||
      ctx.formValues?.grantor_nationality ||
      'Indonesia';
    const rawAgamaGrantor =
      baseMap.agama_pemberi_izin ||
      ctx.formValues?.grantorReligion ||
      ctx.formValues?.grantor_religion ||
      'Islam';
    const wnaAgamaGrantor = `${toTitleCaseIndonesian(rawWnaGrantor)}/${toTitleCaseIndonesian(rawAgamaGrantor)}`;

    const rawKerjaGrantor =
      baseMap.pekerjaan_pemberi_izin ||
      ctx.formValues?.grantorJob ||
      ctx.formValues?.grantor_job ||
      'Wiraswasta';
    const rawStatusKawinGrantor =
      baseMap.status_perkawinan_pemberi_izin ||
      ctx.formValues?.grantorMaritalStatus ||
      ctx.formValues?.grantor_marital_status ||
      'Kawin';
    const rawAlamatGrantor =
      baseMap.alamat_pemberi_izin ||
      ctx.formValues?.grantorAddress ||
      ctx.formValues?.grantor_address ||
      baseMap.alamat_lengkap ||
      baseMap.alamat ||
      `Desa ${effectiveNamaDesa}, Kec. ${effectiveNamaKecamatan}, Kab. ${effectiveNamaKabupaten}`;
    const rawHubCtki =
      baseMap.hubungan_dengan_ctki ||
      ctx.formValues?.grantorRelation ||
      ctx.formValues?.hubCtki ||
      ctx.formValues?.hubungan_ctki ||
      'SUAMI';

    baseMap.nama_pemberi_izin = toTitleCaseIndonesian(rawNamaGrantor);
    baseMap.nik_pemberi_izin = rawNikGrantor;
    baseMap.ttl_pemberi_izin = ttlGrantor;
    baseMap.warga_negara_agama_pemberi_izin = wnaAgamaGrantor;
    baseMap.pekerjaan_pemberi_izin = toTitleCaseIndonesian(rawKerjaGrantor);
    baseMap.status_perkawinan_pemberi_izin = toTitleCaseIndonesian(rawStatusKawinGrantor);
    baseMap.alamat_pemberi_izin = toTitleCaseIndonesian(rawAlamatGrantor);
    baseMap.hubungan_dengan_ctki = String(rawHubCtki).toUpperCase();

    // 2. Hubungan Panggilan Antara
    let panggilanHub =
      baseMap.panggilan_hubungan_penerima ||
      ctx.formValues?.recipientRelationCall ||
      ctx.formValues?.panggilan_hubungan_penerima ||
      '';
    if (!panggilanHub) {
      const hUpper = String(rawHubCtki).toUpperCase();
      if (hUpper.includes('SUAMI')) {
        panggilanHub = 'isteri';
      } else if (hUpper.includes('ISTRI')) {
        panggilanHub = 'suami';
      } else if (hUpper.includes('AYAH') || hUpper.includes('IBU') || hUpper.includes('ORANG TUA')) {
        panggilanHub = 'anak kandung';
      } else {
        panggilanHub = 'keluarga';
      }
    }
    baseMap.panggilan_hubungan_penerima = panggilanHub;

    // 3. Data Pihak yang Diberi Izin (Grantee / CTKI)
    const rawNamaGrantee =
      baseMap.nama_penerima_izin ||
      baseMap.form_nama_penerima_izin ||
      ctx.formValues?.granteeName ||
      ctx.formValues?.grantee_name ||
      ctx.formValues?.nama_penerima_izin ||
      '-';
    const rawNikGrantee =
      baseMap.nik_penerima_izin ||
      baseMap.form_nik_penerima_izin ||
      ctx.formValues?.granteeNik ||
      ctx.formValues?.grantee_nik ||
      ctx.formValues?.nik_penerima_izin ||
      '-';
    const rawTmpGrantee =
      baseMap.tempat_lahir_penerima_izin ||
      ctx.formValues?.granteeBirthPlace ||
      ctx.formValues?.grantee_birth_place ||
      effectiveNamaKabupaten;
    const rawTglGrantee =
      baseMap.tanggal_lahir_penerima_izin ||
      ctx.formValues?.granteeBirthDate ||
      ctx.formValues?.grantee_birth_date ||
      '';
    const normTglGrantee = rawTglGrantee && rawTglGrantee !== '-' ? normalizeDateInput(rawTglGrantee) : null;
    const tglGranteeFmt = normTglGrantee ? formatTanggalIndonesia(normTglGrantee) : (rawTglGrantee || '-');
    const ttlGrantee = (rawTmpGrantee && tglGranteeFmt !== '-') ? `${toTitleCaseIndonesian(rawTmpGrantee)}, ${tglGranteeFmt}` : (toTitleCaseIndonesian(rawTmpGrantee) || tglGranteeFmt || '-');

    const rawWnaGrantee =
      baseMap.warga_negara_penerima_izin ||
      ctx.formValues?.granteeNationality ||
      ctx.formValues?.grantee_nationality ||
      'Indonesia';
    const rawAgamaGrantee =
      baseMap.agama_penerima_izin ||
      ctx.formValues?.granteeReligion ||
      ctx.formValues?.grantee_religion ||
      'Islam';
    const wnaAgamaGrantee = `${toTitleCaseIndonesian(rawWnaGrantee)}/${toTitleCaseIndonesian(rawAgamaGrantee)}`;

    const rawKerjaGrantee =
      baseMap.pekerjaan_penerima_izin ||
      ctx.formValues?.granteeJob ||
      ctx.formValues?.grantee_job ||
      'Mengurus Rumah Tangga';
    const rawStatusKawinGrantee =
      baseMap.status_perkawinan_penerima_izin ||
      ctx.formValues?.granteeMaritalStatus ||
      ctx.formValues?.grantee_marital_status ||
      rawStatusKawinGrantor;
    const rawAlamatGrantee =
      baseMap.alamat_penerima_izin ||
      ctx.formValues?.granteeAddress ||
      ctx.formValues?.grantee_address ||
      rawAlamatGrantor;

    const rawTujuan =
      baseMap.tujuan_kerja ||
      ctx.formValues?.destinationLocation ||
      ctx.formValues?.tujuan ||
      ctx.formValues?.country ||
      'HONGKONG';
    const rawMasaKontrak =
      baseMap.masa_kontrak ||
      ctx.formValues?.contractDuration ||
      ctx.formValues?.masa_kontrak ||
      '2 s/d 3 tahun';

    baseMap.nama_penerima_izin = toTitleCaseIndonesian(rawNamaGrantee);
    baseMap.nik_penerima_izin = rawNikGrantee;
    baseMap.ttl_penerima_izin = ttlGrantee;
    baseMap.warga_negara_agama_penerima_izin = wnaAgamaGrantee;
    baseMap.pekerjaan_penerima_izin = toTitleCaseIndonesian(rawKerjaGrantee);
    baseMap.status_perkawinan_penerima_izin = toTitleCaseIndonesian(rawStatusKawinGrantee);
    baseMap.alamat_penerima_izin = toTitleCaseIndonesian(rawAlamatGrantee);
    baseMap.tujuan_kerja = String(rawTujuan).toUpperCase();
    baseMap.masa_kontrak = String(rawMasaKontrak).toLowerCase().includes('tahun') || String(rawMasaKontrak).toLowerCase().includes('bulan')
      ? String(rawMasaKontrak)
      : `${rawMasaKontrak} tahun`;

    // Compatibility aliases with OpenSID legacy template placeholders
    baseMap.nama = baseMap.nama_pemberi_izin;
    baseMap.nik = baseMap.nik_pemberi_izin;
    baseMap.ttl = baseMap.ttl_pemberi_izin;
    baseMap.warga_negara = toTitleCaseIndonesian(rawWnaGrantor);
    baseMap.agama = toTitleCaseIndonesian(rawAgamaGrantor);
    baseMap.pekerjaan = baseMap.pekerjaan_pemberi_izin;
    baseMap.alamat_lengkap = baseMap.alamat_pemberi_izin;
    baseMap.alamat = baseMap.alamat_pemberi_izin;

    baseMap.form_memberi_izin_selaku = rawHubCtki;
    baseMap.form_hubungan_dengan_pemberi_izin = panggilanHub;
    baseMap.form_negara_tujuan = baseMap.tujuan_kerja;
    baseMap.form_nama_pptkis = ctx.formValues?.destinationCompany || '-';
    baseMap.form_status_pekerjaan_tki_tkw = ctx.formValues?.jobPosition || 'Tenaga Kerja Indonesia (TKI)';
    baseMap.form_masa_kontrak_tahun = baseMap.masa_kontrak;
  }

  const isSuratJalan =
    (ctx.judulSurat || '').toLowerCase().includes('jalan') ||
    (ctx.judulSurat || '').toLowerCase().includes('bepergian') ||
    Boolean(ctx.formValues?.destinationAddress || ctx.formValues?.alamatYangDituju || ctx.formValues?.departureDate || ctx.formValues?.tanggal_berangkat);

  if (isSuratJalan) {
    const rawTglBerangkat =
      baseMap.form_tanggal_berangkat ||
      baseMap.tanggal_berangkat ||
      ctx.formValues?.departureDate ||
      ctx.formValues?.tanggalBerangkat ||
      ctx.formValues?.tgl_berangkat;
    const normTglBerangkat = rawTglBerangkat ? normalizeDateInput(rawTglBerangkat) : null;
    const tglBerangkatFmt = normTglBerangkat ? formatTanggalIndonesia(normTglBerangkat) : (rawTglBerangkat || '-');

    const rawAlamatTujuan =
      baseMap.form_alamat_tujuan ||
      baseMap.alamat_tujuan ||
      baseMap.alamat_yang_dituju ||
      ctx.formValues?.destinationAddress ||
      ctx.formValues?.alamatYangDituju ||
      ctx.formValues?.destinationCity ||
      ctx.formValues?.tujuan ||
      '-';

    const rawKeperluan =
      baseMap.form_keperluan ||
      baseMap.keperluan ||
      ctx.formValues?.purpose ||
      ctx.formValues?.keperluan ||
      'Bekerja';

    baseMap.form_tanggal_berangkat = tglBerangkatFmt;
    baseMap.tanggal_berangkat = tglBerangkatFmt;
    baseMap.form_alamat_tujuan = rawAlamatTujuan;
    baseMap.alamat_tujuan = rawAlamatTujuan;
    baseMap.alamat_yang_dituju = rawAlamatTujuan;
    baseMap.form_keperluan = rawKeperluan;
    baseMap.keperluan = rawKeperluan;
  }

  const isSuratKuasa =
    (ctx.judulSurat || '').toLowerCase().includes('kuasa') ||
    Boolean(ctx.formValues?.grantorName || ctx.formValues?.grantee1Name || ctx.formValues?.authorizedPerson || ctx.formValues?.proxyName);

  if (isSuratKuasa) {
    const rawGrantorName =
      baseMap.nama_pemberi_kuasa ||
      ctx.formValues?.grantorName ||
      ctx.formValues?.name ||
      ctx.formValues?.nama ||
      ctx.individu?.nama ||
      'SANTOSO';
    const rawGrantorNik =
      baseMap.nik_pemberi_kuasa ||
      ctx.formValues?.grantorNik ||
      ctx.formValues?.nik ||
      ctx.individu?.nik ||
      '-';
    const rawGrantorBirthPlace =
      ctx.formValues?.grantorBirthPlace ||
      ctx.formValues?.birthPlace ||
      ctx.individu?.tempat_lahir ||
      '';
    const rawGrantorBirthDate =
      ctx.formValues?.grantorBirthDate ||
      ctx.formValues?.birthDate ||
      ctx.individu?.tanggal_lahir ||
      '';
    const normGrantorBirthDate = rawGrantorBirthDate ? normalizeDateInput(rawGrantorBirthDate) : null;
    const grantorBirthDateFmt = normGrantorBirthDate ? formatTanggalIndonesia(normGrantorBirthDate) : (rawGrantorBirthDate || '-');
    const grantorTtl = (rawGrantorBirthPlace && grantorBirthDateFmt !== '-') ? `${toTitleCaseIndonesian(rawGrantorBirthPlace)} , ${grantorBirthDateFmt}` : (toTitleCaseIndonesian(rawGrantorBirthPlace) || grantorBirthDateFmt || '-');
    const grantorPos =
      baseMap.jabatan_pemberi_kuasa ||
      ctx.formValues?.grantorPosition ||
      ctx.formValues?.jabatan ||
      `Kepala Desa ${ctx.namaDesa || ''}`.trim();
    const grantorAddr =
      baseMap.alamat_pemberi_kuasa ||
      ctx.formValues?.grantorAddress ||
      ctx.formValues?.address ||
      ctx.formValues?.alamat ||
      ctx.individu?.alamat ||
      `Desa ${ctx.namaDesa || ''}`.trim();

    const rawTujuanKuasa =
      baseMap.tujuan_kuasa ||
      ctx.formValues?.powerScope ||
      ctx.formValues?.purpose ||
      ctx.formValues?.keperluan ||
      'Pengambilan uang secara tunai di Bank Jatim / Bank Jateng';

    // Penerima Kuasa 1
    const rawGrantee1Name =
      baseMap.nama_penerima_kuasa_1 ||
      ctx.formValues?.grantee1Name ||
      ctx.formValues?.proxyName ||
      ctx.formValues?.authorizedPerson ||
      'IMAM';
    const rawGrantee1BirthPlace =
      ctx.formValues?.grantee1BirthPlace ||
      ctx.formValues?.proxyBirthPlace ||
      '';
    const rawGrantee1BirthDate =
      ctx.formValues?.grantee1BirthDate ||
      ctx.formValues?.proxyBirthDate ||
      '';
    const normGrantee1BirthDate = rawGrantee1BirthDate ? normalizeDateInput(rawGrantee1BirthDate) : null;
    const grantee1BirthDateFmt = normGrantee1BirthDate ? formatTanggalIndonesia(normGrantee1BirthDate) : (rawGrantee1BirthDate || '-');
    const grantee1Ttl = (rawGrantee1BirthPlace && grantee1BirthDateFmt !== '-') ? `${toTitleCaseIndonesian(rawGrantee1BirthPlace)}, ${grantee1BirthDateFmt}` : (toTitleCaseIndonesian(rawGrantee1BirthPlace) || grantee1BirthDateFmt || '-');
    const grantee1Pos =
      baseMap.jabatan_penerima_kuasa_1 ||
      ctx.formValues?.grantee1Position ||
      ctx.formValues?.proxyPosition ||
      `Sekretaris Desa ${ctx.namaDesa || ''}`.trim();
    const grantee1Addr =
      baseMap.alamat_penerima_kuasa_1 ||
      ctx.formValues?.grantee1Address ||
      ctx.formValues?.proxyAddress ||
      `Desa ${ctx.namaDesa || ''}`.trim();

    // Penerima Kuasa 2
    const rawGrantee2Name =
      baseMap.nama_penerima_kuasa_2 ||
      ctx.formValues?.grantee2Name ||
      '';
    const rawGrantee2BirthPlace =
      ctx.formValues?.grantee2BirthPlace ||
      '';
    const rawGrantee2BirthDate =
      ctx.formValues?.grantee2BirthDate ||
      '';
    const normGrantee2BirthDate = rawGrantee2BirthDate ? normalizeDateInput(rawGrantee2BirthDate) : null;
    const grantee2BirthDateFmt = normGrantee2BirthDate ? formatTanggalIndonesia(normGrantee2BirthDate) : (rawGrantee2BirthDate || '-');
    const grantee2Ttl = (rawGrantee2BirthPlace && grantee2BirthDateFmt !== '-') ? `${toTitleCaseIndonesian(rawGrantee2BirthPlace)}, ${grantee2BirthDateFmt}` : (toTitleCaseIndonesian(rawGrantee2BirthPlace) || grantee2BirthDateFmt || '-');
    const grantee2Pos =
      baseMap.jabatan_penerima_kuasa_2 ||
      ctx.formValues?.grantee2Position ||
      `Bendahara Desa ${ctx.namaDesa || ''}`.trim();
    const grantee2Addr =
      baseMap.alamat_penerima_kuasa_2 ||
      ctx.formValues?.grantee2Address ||
      `Desa ${ctx.namaDesa || ''}`.trim();

    let labelJabatanPenerima =
      baseMap.label_jabatan_penerima_kuasa ||
      ctx.formValues?.granteePositionLabel ||
      '';
    if (!labelJabatanPenerima) {
      if (rawGrantee2Name) {
        labelJabatanPenerima = `${grantee1Pos} dan ${grantee2Pos} ${ctx.namaDesa || ''}`.trim();
      } else {
        labelJabatanPenerima = `${grantee1Pos} ${ctx.namaDesa || ''}`.trim();
      }
    }

    baseMap.nama_pemberi_kuasa = String(rawGrantorName).toUpperCase();
    baseMap.ttl_pemberi_kuasa = grantorTtl;
    baseMap.nik_pemberi_kuasa = rawGrantorNik;
    baseMap.jabatan_pemberi_kuasa = grantorPos;
    baseMap.alamat_pemberi_kuasa = grantorAddr;

    baseMap.label_jabatan_penerima_kuasa = labelJabatanPenerima;
    baseMap.tujuan_kuasa = rawTujuanKuasa;

    baseMap.nama_penerima_kuasa_1 = String(rawGrantee1Name).toUpperCase();
    baseMap.ttl_penerima_kuasa_1 = grantee1Ttl;
    baseMap.jabatan_penerima_kuasa_1 = grantee1Pos;
    baseMap.alamat_penerima_kuasa_1 = grantee1Addr;

    baseMap.nama_penerima_kuasa_2 = String(rawGrantee2Name).toUpperCase();
    baseMap.ttl_penerima_kuasa_2 = grantee2Ttl;
    baseMap.jabatan_penerima_kuasa_2 = grantee2Pos;
    baseMap.alamat_penerima_kuasa_2 = grantee2Addr;

    baseMap.ttd_penerima_kuasa_2 = rawGrantee2Name
      ? `<strong style="text-decoration: underline; text-transform: uppercase;"><u>${String(rawGrantee2Name).toUpperCase()}</u></strong>`
      : '';

    // Legacy aliases
    baseMap.nama = baseMap.nama_pemberi_kuasa;
    baseMap.nik = baseMap.nik_pemberi_kuasa;

    if (!rawGrantee2Name) {
      result = result.replace(/<!--\s*BLOK_PENERIMA_2_START\s*-->[\s\S]*?<!--\s*BLOK_PENERIMA_2_END\s*-->/gi, '');
    }
  }

  // Jika mode penandatanganan manual (!ctx.qrCode):
  // 1. Jika ada blok QR yang sudah ter-render sebelumnya di custom HTML, ganti dengan ruang tanda tangan manual (50px)
  // 2. Jika ada [qr_code] di antara [Atas_namA] dan [Nama_pamonG] (seperti pada template lama), ganti dengan ruang tanda tangan manual (50px)
  if (!ctx.qrCode) {
    result = result.replace(
      /<div[^>]*class=["'][^"']*opensid-qr-signature[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
      '<div style="height: 50px;">&nbsp;</div>',
    );
    result = result.replace(
      /<img[^>]*alt=["']qrcode-surat["'][^>]*>/gi,
      '<div style="height: 50px;">&nbsp;</div>',
    );
    result = result.replace(
      /(\[\s*(?:atas_nama|jabatan|sebutan_kepala_desa)\s*\](?:[\s\S]{0,160}?))<br\s*\/?>\s*\[\s*qr_code\s*\]\s*<br\s*\/?>/gi,
      '$1<div style="height: 50px;">&nbsp;</div>',
    );
    // Normalisasi tinggi baris ruang ttd manual di table menjadi 50px agar proporsional dan rapi
    result = result.replace(
      /(<tr[^>]*style=["'][^"']*height:\s*)(?:[6-9][0-9]|1[0-9][0-9]|200)px([^"']*["'][^>]*>)/gi,
      '$145px$2',
    );
    result = result.replace(
      /(<td[^>]*style=["'][^"']*height:\s*)(?:[6-9][0-9]|1[0-9][0-9]|200)px([^"']*["'][^>]*>)/gi,
      '$145px$2',
    );
    // Bersihkan br bertumpuk di dalam kolom ttd manual agar jarak proporsional dan tidak terlalu tinggi
    result = result.replace(/(?:<br\s*\/?>\s*){2,}/gi, '<br />');
  }

  // Jika mode QR aktif namun template belum memiliki tag [qr_code] maupun [qr_bsre],
  // sisipkan [qr_code] secara otomatis di area tanda tangan di atas [Nama_pamonG] / [Nama_kepala_desA]
  if (
    ctx.qrCode &&
    !/\[\s*(?:qr_code|qr_bsre)\s*\]/i.test(result) &&
    /\[\s*(?:nama_pamong|nama_kepala_desa)\s*\]/i.test(result)
  ) {
    result = result.replace(
      /(?:<br\s*\/?>\s*){2,}(\s*(?:<(?:strong|b|u)>\s*)*\[\s*(?:nama_pamong|nama_kepala_desa)\s*\])/i,
      '<br />[qr_code]<br />$1',
    );
  }

  // Pastikan tag [nama_pamong], [nama_kepala_desa], [nama_sekretaris_desa] di blok TTD selalu dibungkus <strong><u>
  result = result.replace(
    /(?:<p[^>]*>|<td[^>]*>)\s*(?:<span[^>]*>)?\s*(?!<strong|<b|<u)\[\s*(?:nama_pamong|nama_kepala_desa|nama_sekretaris_desa)\s*\]\s*(?:<\/span>)?\s*(?:<\/p>|<\/td>)/gi,
    (match) => {
      return match.replace(/\[\s*(?:nama_pamong|nama_kepala_desa|nama_sekretaris_desa)\s*\]/i, '<strong><u>$&</u></strong>');
    },
  );

  // Safeguard absolut: pastikan seluruh placeholder umum nikah, orang tua, dan pasangan selalu memiliki nilai valid
  if (!baseMap.form_ttl_ayah) {
    const tmp = baseMap.form_tempat_lahir_ayah || baseMap.tempat_lahir_ayah || ctx.pelakuBagian?.ayah?.tempat_lahir || '';
    const tgl = baseMap.form_tanggal_lahir_ayah || baseMap.tanggal_lahir_ayah || ctx.pelakuBagian?.ayah?.tanggal_lahir || '';
    baseMap.form_ttl_ayah = tmp && tgl ? `${toTitleCaseIndonesian(tmp)}, ${normalizeDateInput(tgl) ? formatTanggalIndonesia(normalizeDateInput(tgl)!) : tgl}` : (tmp || tgl || '-');
  }
  if (!baseMap.form_ttl_ibu) {
    const tmp = baseMap.form_tempat_lahir_ibu || baseMap.tempat_lahir_ibu || ctx.pelakuBagian?.ibu?.tempat_lahir || '';
    const tgl = baseMap.form_tanggal_lahir_ibu || baseMap.tanggal_lahir_ibu || ctx.pelakuBagian?.ibu?.tanggal_lahir || '';
    baseMap.form_ttl_ibu = tmp && tgl ? `${toTitleCaseIndonesian(tmp)}, ${normalizeDateInput(tgl) ? formatTanggalIndonesia(normalizeDateInput(tgl)!) : tgl}` : (tmp || tgl || '-');
  }
  if (!baseMap.form_ttl_pasangan) {
    const tmp = baseMap.form_tempat_lahir_pasangan || baseMap.tempat_lahir_pasangan || ctx.pelakuBagian?.pasangan?.tempat_lahir || '';
    const tgl = baseMap.form_tanggal_lahir_pasangan || baseMap.tanggal_lahir_pasangan || ctx.pelakuBagian?.pasangan?.tanggal_lahir || '';
    baseMap.form_ttl_pasangan = tmp && tgl ? `${toTitleCaseIndonesian(tmp)}, ${normalizeDateInput(tgl) ? formatTanggalIndonesia(normalizeDateInput(tgl)!) : tgl}` : (tmp || tgl || '-');
  }
  if (!baseMap.form_nama_calon_pasangan) {
    baseMap.form_nama_calon_pasangan = baseMap.form_nama_pasangan || baseMap.nama_pasangan || ctx.pelakuBagian?.pasangan?.nama || '-';
  }
  if (!baseMap.form_bin_calon_pasangan) {
    baseMap.form_bin_calon_pasangan = baseMap.form_bin_pasangan || ctx.pelakuBagian?.pasangan?.nama_ayah || '-';
  }
  if (!baseMap.form_label_bin_pasangan) {
    const isMale = (ctx.individu?.jenis_kelamin || baseMap.jenis_kelamin || '').toLowerCase().includes('laki');
    baseMap.form_label_bin_pasangan = isMale ? 'Binti' : 'Bin';
  }
  if (!baseMap.form_nik_calon_pasangan) {
    baseMap.form_nik_calon_pasangan = baseMap.form_nik_pasangan || ctx.pelakuBagian?.pasangan?.nik || '-';
  }
  if (!baseMap.form_warga_negara_pasangan) {
    baseMap.form_warga_negara_pasangan = baseMap.form_wn_pasangan || ctx.pelakuBagian?.pasangan?.warga_negara || 'WNI';
  }

  // Lakukan case-sensitive replacement untuk semua key di baseMap
  for (const [key, val] of Object.entries(baseMap)) {
    if (key === 'logo_surat' || key === 'logo_garuda' || key === 'qr_code' || key === 'qr_bsre' || key.startsWith('centang_')) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(`\\[\\s*${escaped}\\s*\\]`, 'gi'), val);
    } else {
      result = caseReplaceOpenSid(key, val, result);
    }
  }

  const escapedPamong = effectiveNamaPamong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Bila penandatangan adalah Sekretaris Desa (isSekdesSigner),
  // pastikan teks jabatan penandatangan di atas ttd pemohon/pamong selalu mengikuti format resmi sesuai contoh:
  // Kepala Desa Sampeldes<br />a.n Kepala Desa
  if (isSekdesSigner) {
    result = result.replace(
      /(<td[^>]*>)\s*(?:<p[^>]*>)?\s*Kepala\s+Desa\s*(?:\[(?:NaMa_desa|Nama_desA)\]|[A-Za-z]+)?\s*(?:<\/p>)?(?=\s*<\/td>[\s\S]{0,350}?(?:\[(?:qr_bsre|qr_code|nama_pamong)\]|<strong|<u|${escapedPamong}))/gi,
      `$1${effectiveAtasNama}`
    );
    result = result.replace(
      new RegExp(
        `(<td[^>]*>)\\s*(?:<p[^>]*>)?\\s*Kepala\\s+${effectiveSebutanDesa}\\s+${effectiveNamaDesa}\\s*(?:<\\/p>)?(?=\\s*<\\/td>[\\s\\S]{0,350}?(?:<strong|<u|${escapedPamong}|\\[nama_pamong\\]|\\[qr))`,
        'gi'
      ),
      `$1${effectiveAtasNama}`
    );
  }

  // Bila mode penandatanganan manual (!ctx.qrCode), pastikan seluruh varian tag QR dihapus total tanpa sisa
  // dan pastikan jarak vertikal antara jabatan ([Atas_namA]) dan nama pejabat ([Nama_pamonG]) proporsional dan rapi
  if (!ctx.qrCode) {
    result = result.replace(/\[\s*(?:qr_code|qr_bsre|qr|qrcode|kode_qr|qr_tte)\s*\]/gi, '');
    result = result.replace(/<div[^>]*text-align:\s*center[^>]*>\s*(?:<br\s*\/?>\s*)*\s*<\/div>/gi, '');
    if (escapedPamong) {
      result = result.replace(
        new RegExp(
          `((?:Kepala|Sekretaris)\\s+${effectiveSebutanDesa}(?:\\s+${effectiveNamaDesa})?(?:\\s*<br\\s*\\/?>\\s*a\\.n\\s+Kepala\\s+${effectiveSebutanDesa})?)\\s*(?:<br\\s*\\/?>\\s*){1,3}((?:<(?:strong|b|u|span[^>]*?)>\\s*)*${escapedPamong})`,
          'gi',
        ),
        '$1<div style="height: 50px;">&nbsp;</div>$2',
      );
    }
    // Normalisasi jika masih ada baris kosong ttd dengan tinggi berlebih
    result = result.replace(
      /(<tr[^>]*style=["'][^"']*height:\s*)(?:8[0-9]|9[0-9]|1[0-3][0-9])px([^"']*["'][^>]*>)/gi,
      '$150px$2',
    );
    result = result.replace(
      /(<td[^>]*style=["'][^"']*height:\s*)(?:8[0-9]|9[0-9]|1[0-3][0-9])px([^"']*["'][^>]*>)/gi,
      '$150px$2',
    );
  }

  // Tangani fungsi spesial OpenSID: [Terbilang][...] atau [Hitung][...]
  if (isSuratPenghasilanOrtuContext) {
    result = result.replace(/\[\s*terbilang\s*\]\[\s*\[\s*hitung\s*\]\[[\s\S]*?\]\s*\]/gi, baseMap.terbilang_total_penghasilan || '');
    result = result.replace(/\[\s*hitung\s*\]\[[\s\S]*?\]/gi, baseMap.total_penghasilan_orang_tua || '');
  }

  result = result.replace(/\[\s*(terbilang)\s*\]\[\s*([^\]]+)\s*\]/gi, (_m, cmd: string, targetKey: string) => {
    const cleanTarget = targetKey.trim().toLowerCase();
    const targetVal = baseMap[cleanTarget] || baseMap[`form_${cleanTarget}`] || targetKey;
    const words = terbilangIndonesia(targetVal);
    return applyOpenSidCasePattern(cmd, words);
  });

  result = result.replace(/\[\s*(hitung)\s*\]\[\s*([^\]]+)\s*\]/gi, (_m, cmd: string, targetKey: string) => {
    const cleanTarget = targetKey.trim().toLowerCase();
    const targetVal = baseMap[cleanTarget] || baseMap[`form_${cleanTarget}`] || '';
    const umur = hitungUmurIndonesia(targetVal);
    return applyOpenSidCasePattern(cmd, umur);
  });

  // Pastikan judul SURAT KETERANGAN DOMISILI dicetak bold bergaris bawah
  result = result.replace(
    /<h4[^>]*>[\s\S]*?(?:SURAT\s+)?KETERANGAN\s+DOMISILI[\s\S]*?<\/h4>/gi,
    '<h4 style="margin: 0; text-align: center; font-weight: bold;"><span style="text-decoration: underline;"><strong>SURAT KETERANGAN DOMISILI</strong></span></h4>',
  );
  result = result.replace(
    /(?:<span[^>]*>|<u[^>]*>)\s*(?:<(?:strong|b)[^>]*>)?\s*(?:SURAT\s+)?KETERANGAN\s+DOMISILI\s*(?:<\/(?:strong|b)>)?\s*(?:<\/u>|<\/span>)/gi,
    '<span style="text-decoration: underline;"><strong>SURAT KETERANGAN DOMISILI</strong></span>',
  );

  // Pastikan redaksi SURAT PERMOHONAN PERUBAHAN KARTU KELUARGA dicetak bold bergaris bawah
  result = result.replace(
    /<h4[^>]*>[\s\S]*?(?:SURAT\s+)?PERMOHONAN\s+PERUBAHAN\s+KARTU\s+KELUARGA[\s\S]*?<\/h4>/gi,
    '<h4 style="margin: 0; text-align: center; font-weight: bold;"><span style="text-decoration: underline;"><strong>SURAT PERMOHONAN PERUBAHAN KARTU KELUARGA</strong></span></h4>',
  );
  result = result.replace(
    /(?:<span[^>]*>|<u[^>]*>)\s*(?:<(?:strong|b)[^>]*>)?\s*(?:SURAT\s+)?PERMOHONAN\s+PERUBAHAN\s+KARTU\s+KELUARGA\s*(?:<\/(?:strong|b)>)?\s*(?:<\/u>|<\/span>)/gi,
    '<span style="text-decoration: underline;"><strong>SURAT PERMOHONAN PERUBAHAN KARTU KELUARGA</strong></span>',
  );

  // Hilangkan baris No dan Tanggal di atas Mengetahui Camat pada surat
  result = result.replace(
    /<tr[^>]*>\s*<td[^>]*>(?:&nbsp;|\s*)<\/td>\s*<td[^>]*>\s*No\s*<\/td>\s*<td[^>]*>:\s*<\/td>\s*<\/tr>\s*<tr[^>]*>\s*<td[^>]*>(?:&nbsp;|\s*)<\/td>\s*<td[^>]*>\s*Tanggal\s*<\/td>\s*<td[^>]*>:\s*<\/td>\s*<\/tr>/gi,
    '',
  );
  result = result.replace(
    /<tr[^>]*>[\s\S]*?<td[^>]*>\s*No\s*<\/td>[\s\S]*?<\/tr>\s*<tr[^>]*>[\s\S]*?<td[^>]*>\s*Tanggal\s*<\/td>[\s\S]*?<\/tr>(?=\s*<tr[^>]*>[\s\S]*?Mengetahui[\s\S]*?<\/tr>)/gi,
    '',
  );

  // Jika masih ada struktur tabel domisili versi lama dengan kolom dummy kosong dan label sempit 30.5%
  if (result.includes('30.5174%') && result.includes('Alamat / Tempat Tinggal')) {
    result = result.replace(/<td style="width:\s*4\.3222%[^"]*">&nbsp;<\/td>/gi, '');
    result = result.replace(/<td style="width:\s*4\.3222%[^"]*">\s*<\/td>/gi, '');
    result = result.replace(/width:\s*3\.92927%/gi, 'width: 4%');
    result = result.replace(/width:\s*30\.5174%/gi, 'width: 34%');
    result = result.replace(/width:\s*1\.24427%/gi, 'width: 2%');
    result = result.replace(/width:\s*60\.0524%/gi, 'width: 60%');
  }

  // Hilangkan pengulangan sebutan desa / nama desa di belakang alamat domisili
  result = result.replace(
    new RegExp(`(bertempat tinggal di [^.]*?)(?:\\s+Desa\\s+${effectiveNamaDesa}\\s+Desa\\s+${effectiveNamaDesa})`, 'gi'),
    `$1 Desa ${effectiveNamaDesa}`,
  );
  result = result.replace(
    new RegExp(`(bertempat tinggal di [^.]*?${effectiveNamaKabupaten})\\s+Desa\\s+${effectiveNamaDesa}`, 'gi'),
    '$1',
  );
  // Bersihkan duplikasi pengulangan Desa / Kecamatan / Kabupaten pada alamat
  result = result.replace(
    /((?:Desa|Kelurahan)\s+[^,]+,\s+Kecamatan\s+[^,]+,\s+Kabupaten\s+[^,\s<]+)\s+(?:Desa|Kelurahan)\s+[^,]+,\s+Kecamatan\s+[^,]+,\s+Kabupaten\s+[^,\s<]+(?:,\s+Provinsi\s+[^,\s<]+)?/gi,
    '$1, Provinsi Jawa Tengah',
  );

  // Bersihkan tag tempatlahir & tanggallahir (misal: [TempatlahiR] / [TanggallahiR])
  const tlClear = ctx.individu?.tempat_lahir || baseMap.tempat_lahir || baseMap.tempatlahir || '';
  const tglClear = ctx.individu?.tanggal_lahir
    ? formatTanggalIndonesia(ctx.individu.tanggal_lahir)
    : (baseMap.tanggal_lahir || baseMap.tanggallahir || '');
  if (tlClear) {
    result = result.replace(/\[\s*tempatlahir\s*\]/gi, toTitleCaseIndonesian(tlClear));
  }
  if (tglClear) {
    result = result.replace(/\[\s*tanggallahir\s*\]/gi, tglClear);
  }

  // Bersihkan tag-tag khusus Surat Keterangan Kepemilikan Tanah
  if (isSuratKepemilikanTanahContext) {
    result = result.replace(/\[\s*FoRm_jenis_tanah\s*\]/gi, baseMap.form_jenis_tanah || 'Tanah Darat');
    result = result.replace(/\[\s*Form_atas_nama_tanah\s*\]/gi, baseMap.form_atas_nama_tanah || ctx.individu?.nama || '-');
    result = result.replace(/\[\s*FOrm_bukti_kepemilikan_tanah\s*\]/gi, baseMap.form_bukti_kepemilikan_tanah || 'Letter C');
    result = result.replace(/\[\s*Form_nomor_bukti_kepemilikan_tanah\s*\]/gi, baseMap.form_nomor_bukti_kepemilikan_tanah || '-');
    result = result.replace(/\[\s*Form_luas_tanah\s*\]/gi, baseMap.form_luas_tanah || '-');
    result = result.replace(/\[\s*Form_batas_utara_tanah\s*\]/gi, baseMap.form_batas_utara_tanah || '-');
    result = result.replace(/\[\s*Form_batas_timur_tanah\s*\]/gi, baseMap.form_batas_timur_tanah || '-');
    result = result.replace(/\[\s*Form_batas_selatan_tanah\s*\]/gi, baseMap.form_batas_selatan_tanah || '-');
    result = result.replace(/\[\s*Form_batas_barat_tanah\s*\]/gi, baseMap.form_batas_barat_tanah || '-');
    result = result.replace(/\[\s*FOrm_asal_kepemilikan_tanah\s*\]/gi, baseMap.form_asal_kepemilikan_tanah || 'Jual Beli');
    result = result.replace(/\[\s*Form_bukti_pendukung_kepemilikan_tanah\s*\]/gi, baseMap.form_bukti_pendukung_kepemilikan_tanah || 'Akta Jual Beli');
  }

  // Bersihkan tag-tag khusus Surat Keterangan Jual Beli
  if (isSuratJualBeliContext) {
    // Tag format baru (SURAT KETERANGAN JUAL BELI TANAH)
    result = result.replace(/\[\s*Nama_penjual\s*\]/gi, baseMap.nama_penjual || '-');
    result = result.replace(/\[\s*Ttl_penjual\s*\]/gi, baseMap.ttl_penjual || '-');
    result = result.replace(/\[\s*Pekerjaan_penjual\s*\]/gi, baseMap.pekerjaan_penjual || '-');
    result = result.replace(/\[\s*Nik_penjual\s*\]/gi, baseMap.nik_penjual || '-');
    result = result.replace(/\[\s*Desa_penjual\s*\]/gi, baseMap.desa_penjual || effectiveNamaDesa);
    result = result.replace(/\[\s*Rt_penjual\s*\]/gi, baseMap.rt_penjual || '001');
    result = result.replace(/\[\s*Rw_penjual\s*\]/gi, baseMap.rw_penjual || '001');
    result = result.replace(/\[\s*Kecamatan_penjual\s*\]/gi, baseMap.kecamatan_penjual || effectiveNamaKecamatan);
    result = result.replace(/\[\s*Kabupaten_penjual\s*\]/gi, baseMap.kabupaten_penjual || effectiveNamaKabupaten);

    result = result.replace(/\[\s*Nama_pembeli\s*\]/gi, baseMap.nama_pembeli || '-');
    result = result.replace(/\[\s*Ttl_pembeli\s*\]/gi, baseMap.ttl_pembeli || '-');
    result = result.replace(/\[\s*Pekerjaan_pembeli\s*\]/gi, baseMap.pekerjaan_pembeli || '-');
    result = result.replace(/\[\s*Nik_pembeli\s*\]/gi, baseMap.nik_pembeli || '-');
    result = result.replace(/\[\s*Desa_pembeli\s*\]/gi, baseMap.desa_pembeli || effectiveNamaDesa);
    result = result.replace(/\[\s*Rt_pembeli\s*\]/gi, baseMap.rt_pembeli || '001');
    result = result.replace(/\[\s*Rw_pembeli\s*\]/gi, baseMap.rw_pembeli || '001');
    result = result.replace(/\[\s*Kecamatan_pembeli\s*\]/gi, baseMap.kecamatan_pembeli || effectiveNamaKecamatan);
    result = result.replace(/\[\s*Kabupaten_pembeli\s*\]/gi, baseMap.kabupaten_pembeli || effectiveNamaKabupaten);

    result = result.replace(/\[\s*Hari_transaksi\s*\]/gi, baseMap.hari_transaksi || '-');
    result = result.replace(/\[\s*Tgl_angka_transaksi\s*\]/gi, baseMap.tgl_angka_transaksi || '-');
    result = result.replace(/\[\s*Bulan_transaksi\s*\]/gi, baseMap.bulan_transaksi || '-');
    result = result.replace(/\[\s*Tahun_transaksi\s*\]/gi, baseMap.tahun_transaksi || '-');

    result = result.replace(/\[\s*Desa_tanah\s*\]/gi, baseMap.desa_tanah || effectiveNamaDesa);
    result = result.replace(/\[\s*Kecamatan_tanah\s*\]/gi, baseMap.kecamatan_tanah || effectiveNamaKecamatan);
    result = result.replace(/\[\s*Kabupaten_tanah\s*\]/gi, baseMap.kabupaten_tanah || effectiveNamaKabupaten);
    result = result.replace(/\[\s*Luas_tanah\s*\]/gi, baseMap.luas_tanah || '-');
    result = result.replace(/\[\s*Panjang_tanah\s*\]/gi, baseMap.panjang_tanah || '-');
    result = result.replace(/\[\s*Lebar_tanah\s*\]/gi, baseMap.lebar_tanah || '-');
    result = result.replace(/\[\s*Jenis_alas_hak\s*\]/gi, baseMap.jenis_alas_hak || 'Letter C');
    result = result.replace(/\[\s*Nomor_alas_hak\s*\]/gi, baseMap.nomor_alas_hak || '-');
    result = result.replace(/\[\s*Alas_hak_lengkap\s*\]/gi, baseMap.alas_hak_lengkap || '-');

    result = result.replace(/\[\s*Batas_utara\s*\]/gi, baseMap.batas_utara || '-');
    result = result.replace(/\[\s*Batas_selatan\s*\]/gi, baseMap.batas_selatan || '-');
    result = result.replace(/\[\s*Batas_timur\s*\]/gi, baseMap.batas_timur || '-');
    result = result.replace(/\[\s*Batas_barat\s*\]/gi, baseMap.batas_barat || '-');

    result = result.replace(/\[\s*Harga_transaksi\s*\]/gi, baseMap.harga_transaksi || '-');
    result = result.replace(/\[\s*Harga_terbilang\s*\]/gi, baseMap.harga_terbilang || '-');
    result = result.replace(/\[\s*Biaya_ditanggung_oleh\s*\]/gi, baseMap.biaya_ditanggung_oleh || 'Pihak Kedua (Pembeli)');

    result = result.replace(/\[\s*Tgl_surat_format\s*\]/gi, baseMap.tgl_surat_format || formatTanggalIndonesia(now));
    result = result.replace(/\[\s*Saksi_pihak_1\s*\]/gi, baseMap.saksi_pihak_1 || '....................................');
    result = result.replace(/\[\s*Saksi_pihak_2\s*\]/gi, baseMap.saksi_pihak_2 || '....................................');

    // Tag format OpenSID legacy
    result = result.replace(/\[\s*Form_rincian_barang\s*\]/gi, baseMap.form_rincian_barang || '-');
    result = result.replace(/\[\s*Form_jenis_barang\s*\]/gi, baseMap.form_jenis_barang || 'Sebidang Tanah Pekarangan');
    result = result.replace(/\[\s*NAma_pembeli\s*\]/gi, baseMap.nama_pembeli || '-');
    result = result.replace(/\[\s*Nik_pembelI\s*\]/gi, baseMap.nik_pembeli || '-');
    result = result.replace(/\[\s*TeMpatlahir_pembeli\s*\]/gi, baseMap.tempatlahir_pembeli || effectiveNamaKabupaten);
    result = result.replace(/\[\s*Tanggallahir_pembelI\s*\]/gi, baseMap.tanggallahir_pembeli || '-');
    result = result.replace(/\[\s*Jenis_kelamin_pembeli\s*\]/gi, baseMap.jenis_kelamin_pembeli || 'Laki-Laki');
    result = result.replace(/\[\s*AlAmat_pembeli\s*\]/gi, baseMap.alamat_pembeli || '-');
    result = result.replace(/\[\s*PeKerjaan_pembeli\s*\]/gi, baseMap.pekerjaan_pembeli || '-');
    result = result.replace(/\[\s*Form_keterangaN\s*\]/gi, baseMap.form_keterangan || '-');
    result = result.replace(/\[\s*Form_nama_ketua_adaT\s*\]/gi, baseMap.form_nama_ketua_adat || '...........................................');
  }

  // Bersihkan tag-tag khusus Surat Keterangan Domisili Usaha
  if (isSuratDomisiliUsahaContext) {
    result = result.replace(/\[\s*Form_nama_usaha\s*\]/gi, baseMap.form_nama_usaha || '-');
    result = result.replace(/\[\s*Form_jenis_usaha\s*\]/gi, baseMap.form_jenis_usaha || '-');
    result = result.replace(/\[\s*Form_alamat_usaha\s*\]/gi, baseMap.form_alamat_usaha || '-');
    result = result.replace(/\[\s*(?:Form_status_bangunan|Status_bangunan)\s*\]/gi, baseMap.form_status_bangunan || baseMap.status_bangunan || 'Milik Sendiri');
    result = result.replace(/\[\s*(?:Form_penanggung_jawab|Penanggung_jawab)\s*\]/gi, baseMap.form_penanggung_jawab || baseMap.penanggung_jawab || '-');
  }

  // Bersihkan tag-tag khusus Surat Keterangan Usaha
  if (isSuratUsahaContext) {
    result = result.replace(/\[\s*Form_nama_usaha\s*\]/gi, baseMap.form_nama_usaha || '-');
    result = result.replace(/\[\s*Form_jenis_usaha\s*\]/gi, baseMap.form_jenis_usaha || '-');
    result = result.replace(/\[\s*Form_alamat_usaha\s*\]/gi, baseMap.form_alamat_usaha || '-');
    result = result.replace(/\[\s*Form_berdiri_sejak\s*\]/gi, baseMap.form_berdiri_sejak || baseMap.berdiri_sejak || '-');
    result = result.replace(/\[\s*Berdiri_sejak\s*\]/gi, baseMap.form_berdiri_sejak || baseMap.berdiri_sejak || '-');
    result = result.replace(/\[\s*Form_keperluaN\s*\]/gi, baseMap.form_keperluan || 'Pengajuan KUR BRI');
  }

  // Bersihkan tag-tag khusus Surat Pengantar Umum
  const isSuratPengantarUmumContext =
    (ctx.judulSurat || '').toLowerCase().includes('pengantar umum') ||
    (ctx.judulSurat || '').toLowerCase().includes('keterangan umum') ||
    (ctx.kodeSurat || '').toLowerCase() === '400.7.22.1' ||
    (ctx.kodeSurat || '').toLowerCase() === 's-01' ||
    result.includes('SURAT PENGANTAR UMUM') ||
    result.includes('SURAT KETERANGAN UMUM') ||
    result.includes('Surat pengantar ini diberikan') ||
    result.includes('Surat keterangan ini diberikan kepada yang bersangkutan untuk dipergunakan sebagaimana mestinya, yaitu untuk keperluan');

  if (isSuratPengantarUmumContext) {
    const rawKeperluan =
      ctx.formValues?.purpose ||
      ctx.formValues?.form_keperluan ||
      ctx.formValues?.keperluan ||
      ctx.formValues?.['[form_keperluan]'] ||
      baseMap.form_keperluan ||
      baseMap.purpose ||
      baseMap.keperluan ||
      'BPJS Kesehatan';
    baseMap.form_keperluan = toTitleCaseIndonesian(rawKeperluan);
    result = result.replace(/\[\s*Form_keperluaN\s*\]/gi, baseMap.form_keperluan);
  }

  // Bersihkan tag-tag khusus Surat Pengantar SKCK
  const isSuratSkckContext =
    (ctx.judulSurat || '').toLowerCase().includes('skck') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-07' ||
    result.includes('SURAT PENGANTAR SKCK') ||
    result.includes('DAN RAMIL 10') ||
    result.includes('KAPOLSEK');

  if (isSuratSkckContext) {
    const rawKeperluan =
      ctx.formValues?.purpose ||
      ctx.formValues?.otherPurpose ||
      ctx.formValues?.form_keperluan ||
      ctx.formValues?.keperluan ||
      ctx.formValues?.keterangan ||
      ctx.formValues?.form_keterangan ||
      ctx.formValues?.['[form_keterangan]'] ||
      ctx.formValues?.['[form_keperluan]'] ||
      baseMap.form_keperluan ||
      baseMap.purpose ||
      baseMap.keperluan ||
      'Melamar Pekerjaan';
    baseMap.form_keperluan = toTitleCaseIndonesian(rawKeperluan);
    result = result.replace(/\[\s*Form_keperluaN\s*\]/gi, baseMap.form_keperluan);
    result = result.replace(/\[\s*Form_keterangaN\s*\]/gi, baseMap.form_keperluan);
  }

  // Bersihkan tag-tag khusus Surat Pengantar Kehilangan
  const isSuratKehilanganContext =
    (ctx.judulSurat || '').toLowerCase().includes('kehilangan') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-13' ||
    result.includes('SURAT PENGANTAR KEHILANGAN') ||
    result.includes('SURAT KETERANGAN KEHILANGAN') ||
    result.includes('[Form_rincian_barang]') ||
    result.includes('[Form_barang_hilang]') ||
    result.includes('[Form_nama_barang]');

  if (isSuratKehilanganContext) {
    const rawBarang =
      ctx.formValues?.lostItems ||
      ctx.formValues?.rincian_barang ||
      ctx.formValues?.form_rincian_barang ||
      ctx.formValues?.barang_hilang ||
      ctx.formValues?.form_barang_hilang ||
      ctx.formValues?.['[form_rincian_barang]'] ||
      ctx.formValues?.form_rincian ||
      ctx.formValues?.form_nama_barang ||
      ctx.formValues?.nama_barang ||
      baseMap.form_rincian_barang ||
      baseMap.form_barang_hilang ||
      baseMap.form_nama_barang ||
      baseMap.rincian_barang ||
      '1 (satu) buah Kartu Tanda Penduduk Elektronik (KTP-el)';

    const rawWaktu =
      ctx.formValues?.lostDate ||
      ctx.formValues?.waktu_hilang ||
      ctx.formValues?.form_waktu_hilang ||
      ctx.formValues?.['[form_waktu_hilang]'] ||
      baseMap.form_waktu_hilang ||
      baseMap.waktu_hilang ||
      '-';

    const rawTempat =
      ctx.formValues?.lostLocation ||
      ctx.formValues?.tempat_hilang ||
      ctx.formValues?.form_tempat_hilang ||
      ctx.formValues?.['[form_tempat_hilang]'] ||
      baseMap.form_tempat_hilang ||
      baseMap.tempat_hilang ||
      `Wilayah Kecamatan ${effectiveNamaKecamatan}`;

    const rawKronologi =
      ctx.formValues?.chronology ||
      ctx.formValues?.kronologi ||
      ctx.formValues?.form_kronologi ||
      ctx.formValues?.keterangan ||
      ctx.formValues?.form_keterangan ||
      ctx.formValues?.['[form_keterangan]'] ||
      baseMap.form_kronologi ||
      baseMap.form_keterangan ||
      'Barang/dokumen tersebut di atas benar telah tercecer atau hilang dan telah diupayakan pencarian namun hingga saat ini belum ditemukan.';

    const rawKeperluan =
      ctx.formValues?.purpose ||
      ctx.formValues?.keperluan ||
      ctx.formValues?.form_keperluan ||
      ctx.formValues?.['[form_keperluan]'] ||
      baseMap.form_keperluan ||
      baseMap.keperluan ||
      'Pengantar permohonan Surat Tanda Penerimaan Laporan Kehilangan Barang (STPLKB) ke Polsek';

    baseMap.form_rincian_barang = rawBarang;
    baseMap.form_barang_hilang = rawBarang;
    baseMap.form_nama_barang = rawBarang;
    baseMap.form_rincian = rawBarang;
    baseMap.rincian_barang = rawBarang;
    baseMap.barang_hilang = rawBarang;

    baseMap.form_waktu_hilang = rawWaktu;
    baseMap.waktu_hilang = rawWaktu;

    baseMap.form_tempat_hilang = rawTempat;
    baseMap.tempat_hilang = rawTempat;

    baseMap.form_kronologi = rawKronologi;
    baseMap.form_keterangan = rawKronologi;
    baseMap.keterangan = rawKronologi;

    baseMap.form_keperluan = rawKeperluan;
    baseMap.keperluan = rawKeperluan;

    result = result.replace(/\[\s*Form_rincian_barang\s*\]/gi, rawBarang);
    result = result.replace(/\[\s*Form_barang_hilang\s*\]/gi, rawBarang);
    result = result.replace(/\[\s*Form_nama_barang\s*\]/gi, rawBarang);
    result = result.replace(/\[\s*Form_rincian\s*\]/gi, rawBarang);
    result = result.replace(/\[\s*Form_waktu_hilang\s*\]/gi, rawWaktu);
    result = result.replace(/\[\s*Form_tempat_hilang\s*\]/gi, rawTempat);
    result = result.replace(/\[\s*Form_kronologi\s*\]/gi, rawKronologi);
    result = result.replace(/\[\s*Form_keterangaN\s*\]/gi, rawKronologi);
    result = result.replace(/\[\s*Form_keperluaN\s*\]/gi, rawKeperluan);
  }

  // Penyesuaian khusus untuk Surat Ijin Keramaian
  const isSuratKeramaianContext =
    (ctx.judulSurat || '').toLowerCase().includes('keramaian') ||
    (ctx.kodeSurat || '').toLowerCase() === 's-12' ||
    (ctx.kodeSurat || '').toLowerCase() === '100.3.12' ||
    result.includes('SURAT IJIN KERAMAIAN') ||
    result.includes('persyaratan ijin keramaian') ||
    result.includes('[Form_tanggal_acara]') ||
    result.includes('[Form_acara]');

  if (isSuratKeramaianContext) {
    const rawTglAcara =
      ctx.formValues?.eventDate ||
      ctx.formValues?.tanggal_acara ||
      ctx.formValues?.form_tanggal_acara ||
      ctx.formValues?.['[form_tanggal_acara]'] ||
      baseMap.form_tanggal_acara ||
      baseMap.tanggal_acara ||
      '-';
    const normTglAcara = rawTglAcara && rawTglAcara !== '-' ? (normalizeDateInput(rawTglAcara) ? formatTanggalIndonesia(normalizeDateInput(rawTglAcara)!) : rawTglAcara) : '-';

    const rawTglSelesai =
      ctx.formValues?.eventEndDate ||
      ctx.formValues?.sampai_tanggal ||
      ctx.formValues?.form_sampai_tanggal ||
      ctx.formValues?.['[form_sampai_tanggal]'] ||
      baseMap.form_sampai_tanggal ||
      baseMap.sampai_tanggal ||
      normTglAcara;
    const normTglSelesai = rawTglSelesai && rawTglSelesai !== '-' ? (normalizeDateInput(rawTglSelesai) ? formatTanggalIndonesia(normalizeDateInput(rawTglSelesai)!) : rawTglSelesai) : normTglAcara;

    const rawUndangan =
      ctx.formValues?.guestCount ||
      ctx.formValues?.jumlah_undangan ||
      ctx.formValues?.form_jumlah_undangan ||
      ctx.formValues?.['[form_jumlah_undangan]'] ||
      baseMap.form_jumlah_undangan ||
      baseMap.jumlah_undangan ||
      '500 Orang';
    const fmtUndangan = String(rawUndangan).toLowerCase().includes('orang') ? String(rawUndangan) : `${rawUndangan} Orang`;

    const rawAcara =
      ctx.formValues?.eventName ||
      ctx.formValues?.acara ||
      ctx.formValues?.form_acara ||
      ctx.formValues?.form_jenis_acara ||
      ctx.formValues?.['[form_acara]'] ||
      baseMap.form_acara ||
      baseMap.acara ||
      'Resepsi Pernikahan';

    const rawHiburan =
      ctx.formValues?.eventEntertainment ||
      ctx.formValues?.hiburan ||
      ctx.formValues?.form_hiburan ||
      ctx.formValues?.['[form_hiburan]'] ||
      baseMap.form_hiburan ||
      baseMap.hiburan ||
      'Orgen Tunggal';

    const rawTempat =
      ctx.formValues?.eventLocation ||
      ctx.formValues?.tempat_acara ||
      ctx.formValues?.form_tempat_acara ||
      ctx.formValues?.tempat ||
      ctx.formValues?.['[form_tempat_acara]'] ||
      baseMap.form_tempat_acara ||
      baseMap.tempat_acara ||
      baseMap.alamat ||
      `Desa ${effectiveNamaDesa}, Kec. ${effectiveNamaKecamatan}`;

    baseMap.form_tanggal_acara = normTglAcara;
    baseMap.form_sampai_tanggal = normTglSelesai;
    baseMap.form_jumlah_undangan = fmtUndangan;
    baseMap.form_acara = toTitleCaseIndonesian(rawAcara);
    baseMap.form_hiburan = toTitleCaseIndonesian(rawHiburan);
    baseMap.form_tempat_acara = rawTempat;

    result = result.replace(/\[\s*Form_tanggal_acara\s*\]/gi, normTglAcara);
    result = result.replace(/\[\s*Form_sampai_tanggal\s*\]/gi, normTglSelesai);
    result = result.replace(/\[\s*Form_jumlah_undangan\s*\]/gi, fmtUndangan);
    result = result.replace(/\[\s*Form_acara\s*\]/gi, toTitleCaseIndonesian(rawAcara));
    result = result.replace(/\[\s*Form_hiburan\s*\]/gi, toTitleCaseIndonesian(rawHiburan));
    result = result.replace(/\[\s*Form_tempat_acara\s*\]/gi, rawTempat);
  }

  // Bersihkan tag-tag khusus Surat Keterangan Tidak Mampu
  if (isSuratSktmContext) {
    result = result.replace(/\[\s*NAma_pemohon\s*\]/gi, baseMap.nama_pemohon || '-');
    result = result.replace(/\[\s*Nik_pemohon\s*\]/gi, baseMap.nik_pemohon || '-');
    result = result.replace(/\[\s*Ttl_pemohon\s*\]/gi, baseMap.ttl_pemohon || '-');
    result = result.replace(/\[\s*Jenis_kelamin_pemohon\s*\]/gi, baseMap.jenis_kelamin_pemohon || '-');
    result = result.replace(/\[\s*Agama_pemohon\s*\]/gi, baseMap.agama_pemohon || '-');
    result = result.replace(/\[\s*Pekerjaan_pemohon\s*\]/gi, baseMap.pekerjaan_pemohon || '-');
    result = result.replace(/\[\s*Alamat_pemohon\s*\]/gi, baseMap.alamat_pemohon || '-');

    result = result.replace(/\[\s*Form_nama_anak\s*\]/gi, baseMap.form_nama_anak || '-');
    result = result.replace(/\[\s*Form_nik_anak\s*\]/gi, baseMap.form_nik_anak || '-');
    result = result.replace(/\[\s*Form_ttl_anak\s*\]/gi, baseMap.form_ttl_anak || '-');
    result = result.replace(/\[\s*Form_jenis_kelamin_anak\s*\]/gi, baseMap.form_jenis_kelamin_anak || '-');
    result = result.replace(/\[\s*Form_pekerjaan_anak\s*\]/gi, baseMap.form_pekerjaan_anak || '-');
    result = result.replace(/\[\s*Form_alamat_anak\s*\]/gi, baseMap.form_alamat_anak || '-');

    result = result.replace(/\[\s*Form_keperluaN\s*\]/gi, baseMap.form_keperluan || 'KERINGANAN BIAYA SEKOLAH');
  }

  // Bersihkan Kepala Keluarga : . jika kosong
  result = result.replace(/Kepala Keluarga\s*:\s*\./gi, () => {
    const kNama = ctx.individu?.nama ? toTitleCaseIndonesian(ctx.individu.nama) : '';
    return kNama ? `Kepala Keluarga : ${kNama}.` : 'Kepala Keluarga : -';
  });

  // Bersihkan sisa tag kurung siku pada Surat Biodata Penduduk (F-1.01)
  if (isSuratBiodata) {
    result = result.replace(
      /\[\s*(?:alamat_sebelumnya|dokumen_pasport|tanggal_akhir_paspor|tempatlahir|akta_lahir|akta_perkawinan|tanggalperkawinan|akta_perceraian|tanggalperceraian|cacat)\s*\]/gi,
      '-',
    );
  }

  // Pastikan nama penandatangan di blok TTD selalu bold bergaris bawah
  const pamongCandidates = [
    effectiveNamaPamong,
    effectiveNamaKades,
    effectiveNamaSekdes,
  ].filter(Boolean);

  for (const pamongName of pamongCandidates) {
    const escaped = pamongName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pamongRegex = new RegExp(`(?<!<(?:strong|b|u)[^>]*>)\\b(${escaped})\\b(?!<\\/(?:strong|b|u)>)`, 'gi');
    result = result.replace(pamongRegex, '<strong><u>$1</u></strong>');
  }

  // Pembersihan tag mentah pada lampiran SP-HILANG & formulir saksi
  result = result.replace(/\[\s*Form_Keperluan_Lampiran\s*\]/gi, baseMap.form_keperluan_lampiran || 'Permohonan penerbitan dokumen administrasi');
  result = result.replace(/\[\s*Form_Nama_Saksi_1\s*\]/gi, baseMap.form_nama_saksi_1 || '-');
  result = result.replace(/\[\s*Form_Nik_Saksi_1\s*\]/gi, baseMap.form_nik_saksi_1 || '-');
  result = result.replace(/\[\s*Form_Nama_Saksi_2\s*\]/gi, baseMap.form_nama_saksi_2 || '-');
  result = result.replace(/\[\s*Form_Nik_Saksi_2\s*\]/gi, baseMap.form_nik_saksi_2 || '-');
  // Penggantian tag khusus Surat Keterangan Moyang
  result = result.replace(
    /\[\s*Form_keterangan_status_moyang\s*\]/gi,
    baseMap.form_keterangan_status_moyang || `Bahwa orang tersebut di atas adalah benar-benar penduduk Desa ${effectiveNamaDesa}.`
  );
  if (!baseMap.form_keterangan_tambahan || !baseMap.form_keterangan_tambahan.trim() || baseMap.form_keterangan_tambahan === '-') {
    result = result.replace(/<p[^>]*>\s*\[\s*Form_keterangan_tambahan\s*\]\s*<\/p>/gi, '');
    result = result.replace(/\[\s*Form_keterangan_tambahan\s*\]/gi, '');
  } else {
    result = result.replace(/\[\s*Form_keterangan_tambahan\s*\]/gi, baseMap.form_keterangan_tambahan);
  }
  result = result.replace(/\[\s*Form_nama_moyang\s*\]/gi, baseMap.form_nama_moyang || '-');
  result = result.replace(/\[\s*Form_hubungan_moyang\s*\]/gi, baseMap.form_hubungan_moyang || 'Garis Keturunan');

  result = result.replace(/\[\s*Jabatan_Pamong\s*\]/gi, effectiveJabatanPamong);
  result = result.replace(/\[\s*&NBSP;?\s*\]/gi, '');
  result = result.replace(/&NBSP;?/gi, '');

  return result;
}

/**
 * Menghasilkan konteks data simulasi/dummy lengkap untuk fitur "Tinjau PDF" di `/admin/surat/master`
 */
export function buildDummyPreviewContext(item: PermohonanSuratItem): OpenSidRenderContext {
  const enriched = enrichPermohonanSuratWithOpenSid(item);
  const now = new Date();
  const masa = hitungMasaBerlakuTanggal(
    now,
    enriched.masaBerlakuValue ?? 1,
    enriched.satuanMasaBerlaku ?? 'M',
  );
  const nomorSurat = formatPenomoranSuratOpenSid({
    formatNomor: enriched.formatNomorGlobal ? OPENSID_FORMAT_NOMOR_DEFAULT : enriched.formatNomor,
    kodeSurat: enriched.kodeSurat || '470',
    nomorUrut: 12,
    tanggal: now,
  });

  const dummyFormValues: Record<string, string> = {
    form_keperluan: `Pengurusan administrasi ${enriched.jenisSurat}`,
    form_keterangan: `Yang bersangkutan berkelakuan baik dan terdaftar sebagai warga Desa Sampeldes`,
    form_nama_usaha: 'UD. Berkah Mandiri Sampeldes',
    form_jenis_usaha: 'Perdagangan Sembako & Hasil Pertanian',
    form_alamat_usaha: 'Dusun Sampeldes RT 002 / RW 001 Desa Sampeldes',
    form_tujuan: 'Dinas Kependudukan dan Pencatatan Sipil Kabupaten Cilacap',

    // Isian simulasi Jual Beli (S-05)
    form_jenis_barang: 'Sebidang Tanah Pekarangan',
    jenis_barang: 'Sebidang Tanah Pekarangan',
    form_rincian_barang: 'Sebidang Tanah Pekarangan Blok C Luas 250 M2 tercatat dalam Letter C No. 1234',
    rincian_barang: 'Sebidang Tanah Pekarangan Blok C Luas 250 M2 tercatat dalam Letter C No. 1234',
    form_nama_ketua_adat: 'H. Sudarsono',
    nama_ketua_adat: 'H. Sudarsono',
    nama_penjual: 'AHMAD FAUZI SETIAWAN',
    ttl_penjual: 'Cilacap, 17 Agustus 1994',
    pekerjaan_penjual: 'Karyawan Swasta',
    nik_penjual: '3301101708940002',
    desa_penjual: 'Sampeldes',
    rt_penjual: '002',
    rw_penjual: '001',
    kecamatan_penjual: 'Gandrungmangu',
    kabupaten_penjual: 'Cilacap',
    nama_pembeli: 'BAMBANG HERMANTO',
    ttl_pembeli: 'Cilacap, 12 Mei 1980',
    nik_pembeli: '3301101205800003',
    tempatlahir_pembeli: 'Cilacap',
    tanggallahir_pembeli: '12 Mei 1980',
    jenis_kelamin_pembeli: 'Laki-Laki',
    alamat_pembeli: 'Sampeldes RT. 002 RW. 003, Desa Sampeldes',
    pekerjaan_pembeli: 'Wiraswasta',
    desa_pembeli: 'Sampeldes',
    rt_pembeli: '002',
    rw_pembeli: '003',
    kecamatan_pembeli: 'Gandrungmangu',
    kabupaten_pembeli: 'Cilacap',
    desa_tanah: 'Sampeldes',
    kecamatan_tanah: 'Gandrungmangu',
    kabupaten_tanah: 'Cilacap',
    luas_tanah: '350',
    panjang_tanah: '25',
    lebar_tanah: '14',
    jenis_alas_hak: 'Letter C',
    nomor_alas_hak: '1234',
    alas_hak_lengkap: 'Letter C No. 1234',
    batas_utara: 'Tanah Milik Bpk. Supriyadi',
    batas_selatan: 'Jalan Desa Sampeldes',
    batas_timur: 'Saluran Irigasi',
    batas_barat: 'Tanah Milik Ibu Siti Aminah',
    harga_transaksi: '85.000.000,-',
    harga_terbilang: 'delapan puluh lima juta rupiah',
    biaya_ditanggung_oleh: 'Pihak Kedua (Pembeli)',
    saksi_pihak_1: 'H. Sudarsono',
    saksi_pihak_2: 'Budi Santoso',

    // Isian simulasi Pindah (F-1.03, F-1.08, F-1.25, F-1.27)
    form_alasan_pindah: 'Pekerjaan',
    alasan_pindah: 'Pekerjaan',
    form_klasifikasi_pindah: 'Antar Kabupaten/Kota',
    klasifikasi_pindah: 'Antar Kabupaten/Kota',
    form_jenis_kepindahan: 'Kepala Keluarga Dan Seluruh Anggota Keluarga',
    jenis_kepindahan: 'Kepala Keluarga Dan Seluruh Anggota Keluarga',
    form_status_kk_tidak_pindah: 'Nomor KK Tetap',
    status_kk_tidak_pindah: 'Nomor KK Tetap',
    form_status_kk_pindah: 'Membuat KK Baru',
    status_kk_pindah: 'Membuat KK Baru',
    form_tanggal_pindah: formatTanggalIndonesia(now),
    tanggal_pindah: formatTanggalIndonesia(now),
    form_alamat_tujuan: 'Jl. Merpati Indah No. 45',
    alamat_tujuan: 'Jl. Merpati Indah No. 45',
    form_dusun_tujuan: 'Dusun Sukamaju',
    dusun_tujuan: 'Dusun Sukamaju',
    form_rt_tujuan: '003',
    rt_tujuan: '003',
    form_rw_tujuan: '005',
    rw_tujuan: '005',
    form_desa_tujuan: 'Sukamaju',
    desa_tujuan: 'Sukamaju',
    form_desa_atau_kelurahan_tujuan: 'Sukamaju',
    form_kecamatan_tujuan: 'Majenang',
    kecamatan_tujuan: 'Majenang',
    form_kabupaten_tujuan: 'Cilacap',
    kabupaten_tujuan: 'Cilacap',
    form_provinsi_tujuan: 'Jawa Tengah',
    provinsi_tujuan: 'Jawa Tengah',
    form_kode_pos_tujuan: '53257',
    kode_pos_tujuan: '53257',
    form_telepon: '081234567890',
    telepon: '081234567890',
    form_kepala_kk: 'Ahmad Fauzi Setiawan',
    kepala_kk: 'Ahmad Fauzi Setiawan',
    form_jumlah_pengikut: '2',

    // Isian simulasi Nikah (N-1 s/d N-6, SPS, SWN)
    form_status_kawin: 'Jejaka',
    form_status_perkawinan_catin: 'Jejaka',
    form_pendidikan_pemohon: 'SLTA / Sederajat',
    form_nama_ayah: 'H. SUPRIYADI',
    form_bin_ayah: 'H. KARTO SUWIRYO',
    form_nik_ayah: '3301100504650001',
    form_ttl_ayah: 'Cilacap, 05 April 1965',
    form_tempat_lahir_ayah: 'Cilacap',
    form_tanggal_lahir_ayah: '05 April 1965',
    form_agama_ayah: 'Islam',
    form_pekerjaan_ayah: 'Petani/Pekebun',
    form_alamat_ayah: 'Dusun Sampeldes RT 002 / RW 001 Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap',
    form_nama_ibu: 'HJ. SUMIATI',
    form_binti_ibu: 'H. MANSYUR',
    form_nik_ibu: '3301105208680002',
    form_ttl_ibu: 'Cilacap, 12 Agustus 1968',
    form_tempat_lahir_ibu: 'Cilacap',
    form_tanggal_lahir_ibu: '12 Agustus 1968',
    form_agama_ibu: 'Islam',
    form_pekerjaan_ibu: 'Mengurus Rumah Tangga',
    form_alamat_ibu: 'Dusun Sampeldes RT 002 / RW 001 Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap',
    form_nama_calon_pasangan: 'SITI NUR AISYAH',
    form_label_bin_pasangan: 'Binti',
    form_bin_calon_pasangan: 'H. ABDUL KARIM',
    form_nama_ibu_pasangan: 'HJ. SITI AMINAH',
    form_nik_calon_pasangan: '3301105509960003',
    form_ttl_pasangan: 'Cilacap, 15 September 1996',
    form_tempat_lahir_pasangan: 'Cilacap',
    form_tanggal_lahir_pasangan: '15 September 1996',
    form_warga_negara_pasangan: 'WNI',
    form_agama_pasangan: 'Islam',
    form_pekerjaan_pasangan: 'Karyawan Swasta',
    form_pendidikan_pasangan: 'SLTA / Sederajat',
    form_status_pasangan: 'Perawan',
    form_alamat_pasangan: 'Dusun Sampeldes RT 003 / RW 002 Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap',
    form_kua_tujuan: 'KUA Kecamatan Gandrungmangu',
    form_tempat_akad: 'KUA Kecamatan Gandrungmangu',
    form_hari_akad: getNamaHariIndonesia(now),
    form_tanggal_akad: formatTanggalIndonesia(now),
    form_jam_akad: '09.00 WIB',
    form_mas_kawin: 'Seperangkat Alat Sholat dan Perhiasan Emas 5 Gram Tunai',
    form_nama_wali_nikah: 'H. ABDUL KARIM',
    form_bin_wali_nikah: 'H. AHMAD DAHLAN',
    form_nik_wali_nikah: '3301101003660002',
    form_tempat_lahir_wali_nikah: 'Cilacap',
    form_tanggal_lahir_wali_nikah: '10 Maret 1966',
    form_agama_wali_nikah: 'Islam',
    form_pekerjaan_wali_nikah: 'Wiraswasta',
    form_alamat_wali_nikah: 'Dusun Sampeldes RT 003 / RW 002 Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap',
    form_hubungan_wali_nikah: 'Ayah Kandung',
    form_alasan_wali_nikah: '-',
    form_nama_saksi_1: 'SLAMET RIYADI',
    form_nik_saksi_1: '3301101203750001',
    form_nama_saksi_2: 'BAMBANG SUTRISNO',
    form_nik_saksi_2: '3301102407720002',
  };

  for (const ki of enriched.kodeIsian || []) {
    const cleanKode = ki.kode.replace(/^\[|\]$/g, '').toLowerCase();
    if (dummyFormValues[cleanKode]) continue;
    if (ki.tipe === 'date' || ki.tipe === 'hari-tanggal') {
      dummyFormValues[cleanKode] = formatTanggalIndonesia(now);
    } else if (ki.tipe === 'hari') {
      dummyFormValues[cleanKode] = getNamaHariIndonesia(now);
    } else if (ki.tipe === 'time') {
      dummyFormValues[cleanKode] = '09:00 WIB';
    } else if (ki.tipe === 'number') {
      dummyFormValues[cleanKode] = '1';
    } else if (ki.tipe === 'select-manual' && Array.isArray(ki.pilihan) && ki.pilihan.length > 0) {
      dummyFormValues[cleanKode] = ki.pilihan[0];
    } else if (ki.tipe === 'select-otomatis' && ki.refrensi && OPENSID_REFERENSI_DATA[ki.refrensi]?.length) {
      dummyFormValues[cleanKode] = OPENSID_REFERENSI_DATA[ki.refrensi][0];
    } else {
      dummyFormValues[cleanKode] = ki.deskripsi || `Contoh ${ki.nama || cleanKode}`;
    }
  }

  const dummyPelakuBagian: Record<string, OpenSidPersonData> = {
    ayah: {
      nama: 'H. SUPRIYADI',
      nik: '3301100504650001',
      no_kk: '3301100101100001',
      tempat_lahir: 'Cilacap',
      tanggal_lahir: '1965-04-05',
      jenis_kelamin: 'Laki-laki',
      agama: 'Islam',
      pekerjaan: 'Petani/Pekebun',
      warga_negara: 'WNI',
      status_kawin: 'Kawin',
      alamat: 'Dusun Sampeldes RT 001 / RW 001 Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap',
    },
    ibu: {
      nama: 'HJ. SUMIATI',
      nik: '3301105208680002',
      no_kk: '3301100101100001',
      tempat_lahir: 'Cilacap',
      tanggal_lahir: '1968-08-12',
      jenis_kelamin: 'Perempuan',
      agama: 'Islam',
      pekerjaan: 'Mengurus Rumah Tangga',
      warga_negara: 'WNI',
      status_kawin: 'Kawin',
      alamat: 'Dusun Sampeldes RT 001 / RW 001 Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap',
    },
  };

  for (const secKey of Object.keys(enriched.formIsian || {})) {
    if (secKey === 'individu' || dummyPelakuBagian[secKey]) continue;
    dummyPelakuBagian[secKey] = {
      nama: `CONTOH NAMA (${secKey.toUpperCase().replace(/_/g, ' ')})`,
      nik: '3301101506850003',
      no_kk: '3301100101120003',
      tempat_lahir: 'Cilacap',
      tanggal_lahir: '1985-06-15',
      jenis_kelamin: 'Laki-laki',
      agama: 'Islam',
      pekerjaan: 'Wiraswasta',
      warga_negara: 'WNI',
      status_kawin: 'Kawin',
      alamat: 'Dusun Sampeldes RT 003 / RW 002 Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap',
    };
  }

  return {
    judulSurat: enriched.jenisSurat,
    nomorSurat,
    kodeSurat: enriched.kodeSurat || '470',
    tanggalSurat: formatTanggalIndonesia(now),
    hariSurat: getNamaHariIndonesia(now),
    mulaiBerlaku: masa.mulaiBerlaku,
    berlakuSampai: masa.berlakuSampai,
    logoGaruda: Boolean(enriched.logoGaruda),
    qrCode:
      enriched.qrSettings !== undefined
        ? Boolean(enriched.qrSettings.enabled && enriched.qrSettings.defaultSignMode !== 'manual')
        : Boolean(enriched.qrCode),
    qrSettings: enriched.qrSettings,
    individu: {
      nama: 'AHMAD FAUZI SETIAWAN',
      nik: '3301101708940002',
      no_kk: '3301100101150004',
      kepala_kk: 'AHMAD FAUZI SETIAWAN',
      tempat_lahir: 'Cilacap',
      tanggal_lahir: '1994-08-17',
      jenis_kelamin: 'Laki-laki',
      agama: 'Islam',
      pendidikan_kk: 'Diploma IV/ Strata I',
      pekerjaan: 'Karyawan Swasta',
      warga_negara: 'WNI',
      status_kawin: 'Kawin',
      golongan_darah: 'O',
      rt: '002',
      rw: '001',
      dusun: 'Sampeldes',
      hubungan_kk: 'Kepala Keluarga',
      nama_ayah: 'H. SUPRIYADI',
      nik_ayah: '3301100504650001',
      nama_ibu: 'HJ. SUMIATI',
      nik_ibu: '3301105208680002',
    },
    pelakuBagian: dummyPelakuBagian,
    formValues: dummyFormValues,
    familyMembers: [
      {
        nik: '3301105509950001',
        nama: 'Siti Nur Aisyah',
        name: 'Siti Nur Aisyah',
        shdk: 'Istri',
        relationship: 'Istri',
        masa_berlaku: 'SEUMUR HIDUP',
      },
      {
        nik: '3301102010180002',
        nama: 'Muhammad Rizky Pratama',
        name: 'Muhammad Rizky Pratama',
        shdk: 'Anak',
        relationship: 'Anak',
        masa_berlaku: 'SEUMUR HIDUP',
      },
    ],
  };
}

/**
 * Merender dokumen surat lengkap (Header Kop + Body Template + Footer) sesuai pengaturan surat OpenSID
 * Khusus pada sistem ini: jika `letterheadImageUrl` dari `/admin/settings - Templat Kop Surat` tersedia
 * dan surat tidak menggunakan `logoGaruda`, kop surat otomatis dirender dari gambar Kop Surat tersebut.
 */
export function renderOpenSidDocumentPages(
  item: PermohonanSuratItem,
  ctx: OpenSidRenderContext,
  globalSettings: OpenSidGlobalSuratSettings = OPENSID_GLOBAL_SETTINGS_DEFAULT,
  customBodyHtmlOverride?: string,
): {
  pagesHtml: string[];
  headerRendered: string;
  footerRendered: string;
  margin: OpenSidMargin;
  orientasi: 'Potrait' | 'Landscape';
  ukuran: string;
} {
  const enriched = enrichPermohonanSuratWithOpenSid(item);
  const isKematianLetter =
    (ctx.judulSurat || '').toLowerCase().includes('kematian') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('kematian') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('kematian');

  const isDomisiliLetter =
    ((ctx.judulSurat || '').toLowerCase().includes('domisili') ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('domisili') ||
      (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('domisili')) &&
    !((ctx.judulSurat || '').toLowerCase().includes('usaha') ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('usaha') ||
      (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('usaha'));

  const isPerubahanKkLetter =
    (ctx.judulSurat || '').toLowerCase().includes('perubahan kartu keluarga') ||
    (ctx.judulSurat || '').toLowerCase().includes('perubahan kk') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('perubahan kartu keluarga') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('perubahan kk') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('perubahan-kartu-keluarga');

  const isDuplikatAktaLahirLetter =
    (ctx.judulSurat || '').toLowerCase().includes('duplikat akta kelahiran') ||
    (ctx.judulSurat || '').toLowerCase().includes('duplikat kelahiran') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('duplikat akta kelahiran') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('duplikat kelahiran') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('duplikat-kelahiran') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-20';

  const isLahirMatiLetter =
    (ctx.judulSurat || '').toLowerCase().includes('lahir mati') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('lahir mati') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('lahir-mati') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-22';

  const isBedaNamaLetter =
    (ctx.judulSurat || '').toLowerCase().includes('beda nama') ||
    (ctx.judulSurat || '').toLowerCase().includes('beda identitas') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('beda nama') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('beda identitas') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('beda-identitas') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('beda-nama') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === '471.1';

  const isMoyangLetter =
    (ctx.judulSurat || '').toLowerCase().includes('moyang') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('moyang') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('moyang');

  const isWaliLetter =
    ((ctx.judulSurat || '').toLowerCase().includes('keterangan wali') ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('keterangan wali') ||
      (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('keterangan-wali')) &&
    !((ctx.judulSurat || '').toLowerCase().includes('hakim') ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('hakim') ||
      (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('wali-hakim'));

  const isNikahNonMuslimLetter =
    item.id === 'prm-32' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('nikah-warga-non-muslim') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('nikah-non-muslim') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-50' ||
    (ctx.judulSurat || '').toLowerCase().includes('non-muslim') ||
    (ctx.judulSurat || '').toLowerCase().includes('non muslim') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('non-muslim') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('non muslim');

  const isNikahLetter =
    !isNikahNonMuslimLetter &&
    (item.id === 'prm-40' ||
      (enriched.urlSurat || item.urlSurat || '').toLowerCase() === 'sistem-surat-keterangan-nikah' ||
      (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('pergi-kawin') ||
      (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-23' ||
      (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-30' ||
      (ctx.judulSurat || '').toLowerCase().includes('pengantar nikah') ||
      (ctx.judulSurat || '').toLowerCase().includes('pergi kawin') ||
      (ctx.judulSurat || '').toLowerCase().includes('numpang nikah') ||
      (ctx.judulSurat || '').toLowerCase().trim() === 'surat keterangan nikah' ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('pengantar nikah') ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('pergi kawin') ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('numpang nikah') ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().trim() === 'surat keterangan nikah');

  const isBelumMenikahLetter =
    (ctx.judulSurat || '').toLowerCase().includes('belum pernah menikah') ||
    (ctx.judulSurat || '').toLowerCase().includes('belum menikah') ||
    (ctx.judulSurat || '').toLowerCase().includes('belum kawin') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('belum pernah menikah') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('belum menikah') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('belum kawin') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('belum-menikah') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-18' ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === '470';

  const isWaliHakimLetter =
    (ctx.judulSurat || '').toLowerCase().includes('wali hakim') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('wali hakim') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('wali-hakim') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-32' ||
    item.id === 'prm-14';

  const isDuplikatNikahLetter =
    item.id === 'prm-24' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('duplikat-surat-nikah') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('duplikat-nikah') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-33' ||
    (ctx.judulSurat || '').toLowerCase().includes('duplikat surat nikah') ||
    (ctx.judulSurat || '').toLowerCase().includes('duplikat buku nikah') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('duplikat surat nikah') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('duplikat buku nikah');

  const isCeraiRujukLetter =
    item.id === 'prm-28' ||
    item.id === 'prm-16' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('cerai') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('rujuk') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-35' ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-34' ||
    (ctx.judulSurat || '').toLowerCase().includes('cerai') ||
    (ctx.judulSurat || '').toLowerCase().includes('rujuk') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('cerai') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('rujuk');

  const isSporadikLetter =
    item.id === 'prm-37' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('sporadik') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-40' ||
    (ctx.judulSurat || '').toLowerCase().includes('sporadik') ||
    (ctx.judulSurat || '').toLowerCase().includes('penguasaan fisik bidang tanah') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('sporadik') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('penguasaan fisik bidang tanah');

  const isKepemilikanTanahLetter =
    item.id === 'prm-25' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('kepemilikan-tanah') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-49' ||
    (ctx.judulSurat || '').toLowerCase().includes('kepemilikan tanah') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('kepemilikan tanah');

  const isJualBeliLetter =
    item.id === 'prm-10' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('jual-beli') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-05' ||
    (ctx.judulSurat || '').toLowerCase().includes('jual beli') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('jual beli');

  const isDomisiliUsahaLetter =
    item.id === 'prm-08' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('domisili-usaha') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-16' ||
    (ctx.judulSurat || '').toLowerCase().includes('domisili usaha') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('domisili usaha');

  const isSkckLetter =
    item.id === 'prm-15' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('catatan-kepolisian') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('skck') ||
    (ctx.judulSurat || '').toLowerCase().includes('skck') ||
    (ctx.judulSurat || '').toLowerCase().includes('catatan kepolisian') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('skck') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('catatan kepolisian') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-07';

  const isKehilanganLetter =
    item.id === 'prm-02' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('kehilangan') ||
    (ctx.judulSurat || '').toLowerCase().includes('kehilangan') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('kehilangan') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-13';

  const isKeramaianLetter =
    item.id === 'prm-05' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('keramaian') ||
    (ctx.judulSurat || '').toLowerCase().includes('keramaian') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('keramaian') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-12' ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === '100.3.12';

  const isIzinKeluargaLetter =
    item.id === 'prm-31' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('izin-orang-tua') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('izin-keluarga') ||
    (ctx.judulSurat || '').toLowerCase().includes('izin keluarga') ||
    (ctx.judulSurat || '').toLowerCase().includes('izin orang tua') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('izin orang tua') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('izin keluarga') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-39' ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === '140';

  const isSuratJalanLetter =
    item.id === 'prm-42' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('bepergian') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('jalan') ||
    (ctx.judulSurat || '').toLowerCase().includes('jalan') ||
    (ctx.judulSurat || '').toLowerCase().includes('bepergian') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('bepergian') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('surat jalan') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('keterangan jalan') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-10' ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === '470';

  const isSuratKuasaLetter =
    item.id === 'prm-30' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('surat-kuasa') ||
    (ctx.judulSurat || '').toLowerCase().includes('surat kuasa') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('surat kuasa') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-47';

  const isKeteranganUmumLetter =
    !isSkckLetter &&
    !isKehilanganLetter &&
    !isKeramaianLetter &&
    !isIzinKeluargaLetter &&
    !isSuratJalanLetter &&
    !isSuratKuasaLetter &&
    (item.id === 'prm-03' ||
      (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('keterangan-pengantar') ||
      (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('pengantar-umum') ||
      (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('keterangan-umum') ||
      (ctx.judulSurat || '').toLowerCase() === 'surat pengantar umum' ||
      (ctx.judulSurat || '').toLowerCase() === 'surat keterangan umum' ||
      (ctx.judulSurat || '').toLowerCase() === 'surat pengantar' ||
      (ctx.judulSurat || '').toLowerCase() === 'surat keterangan' ||
      (ctx.judulSurat || '').toLowerCase().includes('pengantar umum') ||
      (ctx.judulSurat || '').toLowerCase().includes('keterangan umum') ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase() === 'surat pengantar umum' ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase() === 'surat keterangan umum' ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase() === 'surat pengantar' ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase() === 'surat keterangan' ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('pengantar umum') ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('keterangan umum') ||
      (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-01' ||
      ((enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === '400.7.22.1' &&
        !(ctx.judulSurat || enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('skck') &&
        !(ctx.judulSurat || enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('kehilangan') &&
        !(ctx.judulSurat || enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('keramaian') &&
        !(ctx.judulSurat || enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('kepolisian')));

  const isUsahaLetter =
    !isDomisiliUsahaLetter &&
    !isKeteranganUmumLetter &&
    !isSkckLetter &&
    !isKehilanganLetter &&
    !isKeramaianLetter &&
    (item.id === 'prm-01' ||
      (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('keterangan-usaha') ||
      (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === '500' ||
      ((ctx.judulSurat || '').toLowerCase().includes('keterangan usaha') && !(ctx.judulSurat || '').toLowerCase().includes('umum')) ||
      ((enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('keterangan usaha') && !(enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('umum')));

  const isPemakamanLetter =
    item.id === 'prm-44' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('pemakaman') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === '474.3' ||
    (ctx.judulSurat || '').toLowerCase().includes('pemakaman') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('pemakaman') ||
    Boolean(ctx.formValues?.burialDate || ctx.formValues?.tanggal_pemakaman || ctx.formValues?.lokasi_tpu || ctx.formValues?.burialLocation);

  const isSktmLetter =
    !isPemakamanLetter &&
    (item.id === 'prm-12' ||
      (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('kurang-mampu') ||
      (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('tidak-mampu') ||
      (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-11' ||
      (ctx.judulSurat || '').toLowerCase().includes('tidak mampu') ||
      (ctx.judulSurat || '').toLowerCase().includes('kurang mampu') ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('tidak mampu') ||
      (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('kurang mampu'));

  const isPenghasilanOrtuLetter =
    item.id === 'prm-21' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('penghasilan-orang-tua') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-42' ||
    (ctx.judulSurat || '').toLowerCase().includes('penghasilan orang tua') ||
    (ctx.judulSurat || '').toLowerCase().includes('penghasilan ortu') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('penghasilan orang tua') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('penghasilan ortu');

  const isReaktivasiBpjsLetter =
    item.id === 'prm-09' ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('jamkesos') ||
    (enriched.urlSurat || item.urlSurat || '').toLowerCase().includes('bpjs') ||
    (enriched.kodeSurat || item.kodeSurat || '').toLowerCase() === 's-15' ||
    (ctx.judulSurat || '').toLowerCase().includes('reaktivasi bpjs') ||
    (ctx.judulSurat || '').toLowerCase().includes('jamkesos') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('jamkesos') ||
    (enriched.jenisSurat || item.jenisSurat || '').toLowerCase().includes('reaktivasi bpjs');

  if (isPenghasilanOrtuLetter || isPemakamanLetter || isNikahLetter || isBelumMenikahLetter || isWaliHakimLetter || isDuplikatNikahLetter || isNikahNonMuslimLetter || isCeraiRujukLetter || isKepemilikanTanahLetter || isSkckLetter || isKehilanganLetter || isKeramaianLetter || isIzinKeluargaLetter || isSuratJalanLetter || isSuratKuasaLetter) {
    enriched.ukuran = 'A4';
  }

  if (isJualBeliLetter || isPenghasilanOrtuLetter) {
    enriched.header = 2;
    enriched.footer = false;
  }

  let rawBody = customBodyHtmlOverride;
  if (isKematianLetter && (!rawBody || !rawBody.toLowerCase().includes('meninggal dunia') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KETERANGAN_KEMATIAN_TEMPLATE;
  } else if (isDomisiliLetter && (!rawBody || !rawBody.includes('SURAT KETERANGAN DOMISILI') || rawBody.includes('width: 30.5174%'))) {
    rawBody = SURAT_KETERANGAN_DOMISILI_TEMPLATE;
  } else if (isPerubahanKkLetter && (!rawBody || !rawBody.includes('SURAT PERMOHONAN PERUBAHAN KARTU KELUARGA') || rawBody.includes('>No</td>'))) {
    rawBody = SURAT_PERMOHONAN_PERUBAHAN_KK_TEMPLATE;
  } else if (isDuplikatAktaLahirLetter && (!rawBody || !rawBody.includes('FORMULIR PENDAFTARAN RALAT/DUPLIKAT AKTA KELAHIRAN') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_PERMOHONAN_DUPLIKAT_AKTA_KELAHIRAN_TEMPLATE;
  } else if (isLahirMatiLetter && (!rawBody || !rawBody.includes('SURAT KETERANGAN LAHIR MATI') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KETERANGAN_LAHIR_MATI_TEMPLATE;
  } else if (isBedaNamaLetter && (!rawBody || !rawBody.includes('SURAT PERNYATAAN BEDA NAMA') || rawBody.includes('Identitas dalam KK') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_PERNYATAAN_BEDA_NAMA_TEMPLATE;
  } else if (isMoyangLetter && (!rawBody || !rawBody.includes('SURAT KETERANGAN MOYANG') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KETERANGAN_MOYANG_TEMPLATE;
  } else if (isWaliLetter && (!rawBody || !rawBody.includes('SURAT KETERANGAN WALI') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KETERANGAN_WALI_TEMPLATE;
  } else if (isWaliHakimLetter && (!rawBody || !rawBody.includes('WALI HAKIM') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KETERANGAN_WALI_HAKIM_TEMPLATE;
  } else if (isNikahNonMuslimLetter && (!rawBody || !rawBody.includes('WARGA NON MUSLIM') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KETERANGAN_NIKAH_NON_MUSLIM_TEMPLATE;
  } else if (isNikahLetter && (!rawBody || !rawBody.includes('SURAT KETERANGAN UNTUK NIKAH') || rawBody.includes('NUMPANG NIKAH') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_PENGANTAR_NIKAH_TEMPLATE;
  } else if (isBelumMenikahLetter && (!rawBody || !rawBody.includes('SURAT KETERANGAN BELUM MENIKAH') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KETERANGAN_BELUM_MENIKAH_TEMPLATE;
  } else if (isDuplikatNikahLetter && (!rawBody || !rawBody.includes('1. Data Suami') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_PERMOHONAN_DUPLIKAT_SURAT_NIKAH_TEMPLATE;
  } else if (isCeraiRujukLetter && (!rawBody || !rawBody.includes('SURAT PENGANTAR CERAI / RUJUK') || rawBody.includes('berdasarkan keterangan dari') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_PENGANTAR_CERAI_RUJUK_TEMPLATE;
  } else if (isSporadikLetter && (!rawBody || !rawBody.includes('dengan itikad baik telah menguasai') || !rawBody.includes('[namasaksii]') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_SPORADIK_TEMPLATE;
  } else if (isKepemilikanTanahLetter && (!rawBody || !rawBody.includes('SURAT KETERANGAN KEPEMILIKAN TANAH') || rawBody.includes('[TempatlahiR] / [TanggallahiR]') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KETERANGAN_KEPEMILIKAN_TANAH_TEMPLATE;
  } else if (isJualBeliLetter && (!rawBody || !rawBody.includes('SURAT KETERANGAN JUAL BELI TANAH') || rawBody.includes('hendak menjual') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KETERANGAN_JUAL_BELI_TANAH_TEMPLATE;
  } else if (isDomisiliUsahaLetter && (!rawBody || !rawBody.includes('SURAT KETERANGAN DOMISILI USAHA') || rawBody.includes('Orang tersebut di atas adalah benar-benar') || !rawBody.includes('Status Bangunan Tempat Usaha'))) {
    rawBody = SURAT_KETERANGAN_DOMISILI_USAHA_TEMPLATE;
  } else if (isIzinKeluargaLetter && (!rawBody || !rawBody.includes('SURAT KETERANGAN IZIN KELUARGA') || rawBody.includes('1.</td>') || rawBody.includes('[Form_memberi_izin_selakU]'))) {
    rawBody = SURAT_KETERANGAN_IZIN_KELUARGA_TEMPLATE;
  } else if (isSuratJalanLetter && (!rawBody || !rawBody.includes('SURAT KETERANGAN JALAN/BERPERGIAN') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KETERANGAN_BEPERGIAN_JALAN_TEMPLATE;
  } else if (isSuratKuasaLetter && (!rawBody || !rawBody.includes('SURAT KUASA') || !rawBody.includes('Pemberi Kuasa') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KUASA_ADMINISTRASI_DESA_TEMPLATE;
  } else if (isSkckLetter && (!rawBody || !rawBody.includes('SURAT PENGANTAR SKCK') || !rawBody.includes('DAN RAMIL') || rawBody.includes('1.</td>'))) {
    rawBody = SURAT_PENGANTAR_SKCK_TEMPLATE;
  } else if (isKehilanganLetter && (!rawBody || !rawBody.includes('SURAT PENGANTAR KEHILANGAN') || rawBody.includes('Orang tersebut adalah benar-benar warga') || rawBody.includes('1.</td>'))) {
    rawBody = SURAT_PENGANTAR_KEHILANGAN_TEMPLATE;
  } else if (isKeramaianLetter && (!rawBody || !rawBody.includes('SURAT IJIN KERAMAIAN') || !rawBody.includes('DAN RAMIL') || rawBody.includes('1.</td>') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk Desa') === false)) {
    rawBody = SURAT_IJIN_KERAMAIAN_TEMPLATE;
  } else if (isPemakamanLetter && (!rawBody || !rawBody.includes('SURAT KETERANGAN PEMAKAMAN') || !rawBody.includes('Dimakamkan pada') || rawBody.includes('SURAT KETERANGAN TIDAK MAMPU') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KETERANGAN_PEMAKAMAN_TEMPLATE;
  } else if (isKeteranganUmumLetter && (!rawBody || !rawBody.includes('SURAT PENGANTAR UMUM') || rawBody.includes('SURAT KETERANGAN UMUM') || rawBody.includes('SURAT KETERANGAN USAHA') || rawBody.includes('memiliki usaha') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_PENGANTAR_UMUM_TEMPLATE;
  } else if (isUsahaLetter && (!rawBody || !rawBody.includes('memiliki usaha dengan keterangan sebagai berikut') || rawBody.includes('Orang tersebut di atas adalah benar-benar') || rawBody.includes('memiliki usaha [Form_nama_usaha]'))) {
    rawBody = SURAT_KETERANGAN_USAHA_TEMPLATE;
  } else if (isSktmLetter && (!rawBody || !rawBody.includes('SURAT KETERANGAN TIDAK MAMPU') || rawBody.includes('KLg1_nik') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KETERANGAN_TIDAK_MAMPU_TEMPLATE;
  } else if (isPenghasilanOrtuLetter && (!rawBody || !rawBody.includes('SURAT KETERANGAN PENGHASILAN ORANG TUA') || !rawBody.includes('<!-- pagebreak -->') || rawBody.includes('[HitunG]') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KETERANGAN_PENGHASILAN_ORANG_TUA_TEMPLATE;
  } else if (isReaktivasiBpjsLetter && (!rawBody || !rawBody.includes('SURAT KETERANGAN REAKTIVASI BPJS KESEHATAN') || rawBody.includes('Kartu Peserta Jamkesos') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KETERANGAN_REAKTIVASI_BPJS_TEMPLATE;
  } else if (!rawBody) {
    if (enriched.templateDesa && enriched.templateDesa.trim() && !enriched.templateDesa.includes('Orang tersebut di atas adalah benar-benar penduduk')) {
      rawBody = enriched.templateDesa;
    } else if (enriched.template && !enriched.template.includes('Orang tersebut di atas adalah benar-benar penduduk')) {
      rawBody = enriched.template;
    } else {
      rawBody = getFallbackTemplateHtml(enriched.jenisSurat);
    }
  }

  if (isSktmLetter && rawBody) {
    const isModeAnak =
      ctx.formValues?.submissionType === 'child' ||
      Boolean(ctx.formValues?.childName || ctx.formValues?.form_nama_anak || ctx.formValues?.nama_anak);
    if (!isModeAnak) {
      rawBody = rawBody.replace(/<!--\s*BLOK_ANAK_START\s*-->[\s\S]*?<!--\s*BLOK_ANAK_END\s*-->/gi, '');
    }
  }

  const effectiveLetterheadUrl = ctx.letterheadImageUrl || globalSettings.letterheadImageUrl;

  let headerRendered = '';
  if (enriched.header !== 0) {
    if (effectiveLetterheadUrl && !enriched.logoGaruda) {
      headerRendered = `<div style="width: 100%; margin-bottom: 8px;"><img src="${effectiveLetterheadUrl}" alt="Kop Surat" style="width: 100%; height: auto; display: block;" /></div>`;
    } else {
      const headerTpl = globalSettings.headerHtml;
      headerRendered = headerTpl ? replaceOpenSidKodeIsian(headerTpl, ctx) : '';
    }
  }

  const showTteFooter =
    Boolean(enriched.footer) &&
    !isDuplikatAktaLahirLetter &&
    !isBedaNamaLetter &&
    !isSporadikLetter &&
    !isKepemilikanTanahLetter &&
    !isJualBeliLetter &&
    !isSkckLetter &&
    !isIzinKeluargaLetter &&
    !isSuratJalanLetter &&
    !isSuratKuasaLetter &&
    Boolean(ctx.qrCode) &&
    Boolean(enriched.qrCodeTte || enriched.qrSettings?.showFooterTte || enriched.qrSettings?.tteEnabled);

  const cleanedFooterTpl = (globalSettings.footerHtml || '')
    .replace(/\[\s*kode_desa\s*\]/gi, '')
    .replace(/\[\s*versi\s*\]/gi, '');

  const footerRendered = (!enriched.footer || isDuplikatAktaLahirLetter || isBedaNamaLetter || isSporadikLetter || isKepemilikanTanahLetter || isJualBeliLetter || isSkckLetter || isIzinKeluargaLetter || isSuratJalanLetter || isSuratKuasaLetter)
    ? ''
    : showTteFooter
      ? buildOpenSidFooterTteHtml(
        ctx.kodeDesa || getCachedVillageIdentity().kodeDesa || '33.01.10.2011',
        enriched.kodeSurat || '470',
      )
      : cleanedFooterTpl
        ? replaceOpenSidKodeIsian(cleanedFooterTpl, ctx)
          .replace(/33\.01\.10\.2011/g, '')
          .replace(/Layanan\s+surat\s+digital\s+(?:desa|kelurahan)?\s*sampeldes/gi, '')
        : '';

  if (isSuratKuasaLetter) {
    ctx.judulSurat = 'SURAT KUASA';
  } else if (isSuratJalanLetter) {
    ctx.judulSurat = 'SURAT KETERANGAN JALAN/BERPERGIAN';
  } else if (isPemakamanLetter) {
    ctx.judulSurat = 'SURAT KETERANGAN PEMAKAMAN';
  } else if (isIzinKeluargaLetter) {
    ctx.judulSurat = 'SURAT KETERANGAN IZIN KELUARGA';
  } else if (isSkckLetter) {
    ctx.judulSurat = 'SURAT PENGANTAR SKCK';
  } else if (isKehilanganLetter) {
    ctx.judulSurat = 'SURAT PENGANTAR KEHILANGAN';
  } else if (isKeramaianLetter) {
    ctx.judulSurat = 'SURAT IJIN KERAMAIAN';
  } else if (isKeteranganUmumLetter) {
    ctx.judulSurat = 'SURAT PENGANTAR UMUM';
  }

  if (isSuratKuasaLetter && rawBody && (!rawBody.includes('SURAT KUASA') || !rawBody.includes('Pemberi Kuasa') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KUASA_ADMINISTRASI_DESA_TEMPLATE;
  }

  if (isSuratJalanLetter && rawBody && (!rawBody.includes('SURAT KETERANGAN JALAN/BERPERGIAN') || rawBody.includes('Orang tersebut di atas adalah benar-benar penduduk'))) {
    rawBody = SURAT_KETERANGAN_BEPERGIAN_JALAN_TEMPLATE;
  }

  if (isIzinKeluargaLetter && rawBody && (!rawBody.includes('SURAT KETERANGAN IZIN KELUARGA') || rawBody.includes('1.</td>') || rawBody.includes('[Form_memberi_izin_selakU]'))) {
    rawBody = SURAT_KETERANGAN_IZIN_KELUARGA_TEMPLATE;
  }

  if (isKeramaianLetter && rawBody && (rawBody.includes('1.</td>') || !rawBody.includes('DAN RAMIL') || !rawBody.includes('SURAT IJIN KERAMAIAN'))) {
    rawBody = SURAT_IJIN_KERAMAIAN_TEMPLATE;
  }

  if (isSkckLetter && rawBody && (!rawBody.includes('SURAT PENGANTAR SKCK') || !rawBody.includes('DAN RAMIL') || rawBody.includes('SURAT PENGANTAR UMUM') || rawBody.includes('1.</td>'))) {
    rawBody = SURAT_PENGANTAR_SKCK_TEMPLATE;
  }

  if (isKeteranganUmumLetter && rawBody) {
    rawBody = rawBody
      .replace(/SURAT KETERANGAN UMUM/g, 'SURAT PENGANTAR UMUM')
      .replace(/Surat keterangan ini diberikan/gi, 'Surat pengantar ini diberikan')
      .replace(/Demikian surat keterangan ini dibuat/gi, 'Demikian surat pengantar ini dibuat')
      .replace(/surat keterangan ini/gi, 'surat pengantar ini');
  }

  // Ganti [header] di dalam template dengan string kosong karena header ditampilkan oleh layout halaman
  const cleanedBody = rawBody.replace(/\[\s*header\s*\]/gi, '');
  const bodyRendered = replaceOpenSidKodeIsian(cleanedBody, ctx);

  const ukuranKertas = enriched.ukuran || 'F4';

  // Pisahkan halaman berdasarkan <!-- pagebreak -->
  let pagesHtml: string[] = [];
  if (bodyRendered.includes('<!-- PAGEBREAK_NIKAH -->')) {
    // Format Surat Keterangan Untuk Nikah dipastikan muat utuh dalam 1 lembar A4/F4 tanpa terpotong
    pagesHtml = [bodyRendered.replace(/<!--\s*PAGEBREAK_NIKAH\s*-->/gi, '')];
  } else {
    pagesHtml = bodyRendered
      .split(/<!--\s*pagebreak\s*-->/i)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  const margin = enriched.marginGlobal ? globalSettings.marginGlobal : enriched.margin || OPENSID_MARGIN_DEFAULT;

  return {
    pagesHtml: pagesHtml.length > 0 ? pagesHtml : [bodyRendered],
    headerRendered,
    footerRendered,
    margin,
    orientasi: enriched.orientasi || 'Potrait',
    ukuran: ukuranKertas,
  };
}


