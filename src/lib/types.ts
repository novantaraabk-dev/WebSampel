
import { Timestamp } from "firebase/firestore";

export type Announcement = {
  id: string;
  title: string;
  content: string;
  publishDate: Timestamp;
  authorName: string;
  imageUrl?: string;
};

export type PelayananDoc = {
  id: string;
  title: string;
  category: string;
  fileId: string;
  fileName: string;
  createdAt: Timestamp;
  link?: string;
};

export type News = {
  id: string;
  title: string;
  subtitle: string;
  content?: string;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  mediaType?: 'photo' | 'video' | 'both';
  date: string;
  author: string;
  isHeadline?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type Complaint = {
  id: string;
  description: string;
  submissionDate: Timestamp;
  summaryLLM: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
  submitterAuthUid?: string;
  adminResponse?: string;
  reporterName?: string;
  reporterAddress?: string;
  phoneNumber?: string;
  email?: string;
};

export type LetterSubmissionData = {
  requesterName: string;
  nik: string;
  letterType: string;
  formData: Record<string, any>;
  files?: { fieldName: string; file: File }[];
};

export type UploadedFile = {
  fieldName: string;
  fileName: string;
  fileId: string;
}

export type LetterSubmission = {
  id: string;
  requesterName: string;
  nik: string;
  phoneNumber?: string;
  email?: string;
  letterType: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  formData: Record<string, any>;
  documentNumber?: string;
  fileLinks?: UploadedFile[];
  driveFiles?: Array<{ fileId: string; fileName: string; fileUrl?: string; fieldName?: string }>;
  submissionData?: string;
  requestorAuthUid?: string;
  ticketNumber?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type Resident = {
  id: string;
  nik: string;
  noKk: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  age: string;
  placeOfBirth: string;
  address: string;
  rt: string;
  rw: string;
  kelurahan: string;
  relationshipToHeadOfFamily: string;
  maritalStatus: string;
  educationLevel: string;
  religion: string;
  occupation: string;
  bloodType: string;
  hasBirthCertificate: string;
  birthCertificateNumber: string;
  hasMarriageCertificate: string;
  marriageCertificateNumber: string;
  hasDivorceCertificate: string;
  divorceCertificateNumber: string;
  fatherName: string;
  motherName: string;
  nationality?: string;
  passportNumber?: string;
  kitasNumber?: string;
  marriageDate?: string;
  tagIdCard?: string;
  dusun?: string;
  statusDasar?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type CitizenProfile = {
  uid: string;
  phoneNumber: string;
  email: string;
  updatedAt: any;
};

export type KopSuratInfo = {
  letterheadImageUrl: string;
};

export type VillageLogoInfo = {
  logoImageUrl: string;
};

export type VillageProfileInfo = {
  description?: string;
  imageUrl?: string;
  youtubeVideoUrl?: string;
  kadesPhotoUrl?: string;
  pengaduanImageUrl?: string;
};

export type SocialLinksInfo = {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  updatedAt?: any;
};

export type DriveSettingsInfo = {
  googleDriveLink: string;
  appsScriptUrl: string;
  rootFolderId: string;
};

// Tata Kelola Desa Types
export type ApbdesItem = {
  bidang: string;
  kodeRekening: string;
  kegiatan: string;
  volume: number;
  nominal: number;
  sumberAnggaran: string;
};

export type ApbdesData = {
  id: string;
  tahun: number;
  totalAnggaran: number;
  items: ApbdesItem[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type RealisasiApbdesItem = {
  bidang: string;
  kodeRekening: string;
  kegiatan: string;
  volume: number;
  nominal: number;
  sumberAnggaran: string;
};

export type RealisasiApbdesData = {
  id: string;
  tahun: number;
  totalRealisasi: number;
  items: RealisasiApbdesItem[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type ProdukHukumDesa = {
  id: string;
  jenis: 'perdes' | 'perkades' | 'rpjmdes' | 'rkpdes' | 'sk_desa' | 'lppd' | 'lkpd';
  tahun: number;
  nama: string;
  nomor: string;
  filePdfUrl?: string;
  filePdfId?: string;
  driveLink?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type FooterLogoItem = {
  id: string;
  url: string;
  link?: string;
  name?: string;
};

export type FooterLogosInfo = {
  logo1Url?: string;
  logo2Url?: string;
  logo3Url?: string;
  logo4Url?: string;
  logo1Link?: string;
  logo2Link?: string;
  logo3Link?: string;
  logo4Link?: string;
  items?: FooterLogoItem[];
};

export type PotensiDesa = {
  id: string;
  category: 'pariwisata-kebudayaan' | 'umkm-industri' | 'bumdes' | 'pertanian-perkebunan' | 'sda-lingkungan';
  title: string;
  subtitle: string;
  narrative: string;
  imageUrls: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type ImportantNumberContact = {
  id: string;
  label: string;
  number: string;
  category: 'pemerintah' | 'keamanan' | 'kesehatan' | 'wilayah';
};

export type ImportantNumbersData = {
  contacts: ImportantNumberContact[];
  servicePhoneNumber?: string;
  updatedAt?: any;
};

export type ProductUmkm = {
  id: string;
  name: string;
  category: string;
  businessName: string;
  owner: string;
  price: number;
  priceUnit: string;
  location?: string;
  phone: string;
  badge?: string;
  imageUrl: string;
  description: string;
  features?: string[];
  shopeeUrl?: string;
  tokopediaUrl?: string;
  lazadaUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type PbbRecord = {
  noUrut?: string | number;
  dhkp?: string;
  namaPemilikTanah?: string;
  alamatPemilikTanah?: string;
  nop: string;
  tahun: string | number;
  namaWp: string;
  alamatObjek: string;
  alamatWp?: string;
  luasBumi: number;
  luasBangunan: number;
  njopBumi?: number;
  njopBangunan?: number;
  njopSppt?: number;
  pbbYangDibayar: number;
  denda?: number;
  keterangan: string;
  petugasPemungut?: string;
  tanggalBayar?: string;
  tunggakanTahunLalu?: number;
};

export type PbbSettings = {
  scriptUrl?: string;
  sheetName?: string;
  contactWhatsApp?: string;
  updatedAt?: any;
};

export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  tag?: string;
  actionText?: string;
  actionUrl?: string;
  layout?: 'center' | 'bottom-left' | 'mid-left';
  bgImage?: string;
};

export type HeroSliderInfo = {
  slides?: HeroSlide[];
  autoSlideInterval?: number;
  updatedAt?: any;
};

export type ServiceCardConfig = {
  id: string;
  title: string;
  subtitle: string;
  category?: string;
  badge?: string;
  href: string;
  imageUrl?: string;
};

export type ServiceCardsSettingsInfo = {
  cards?: ServiceCardConfig[];
  updatedAt?: any;
};

export type Official = {
  id: string;
  name: string;
  position: string;
  imageUrl?: string;
  category: 'perangkat' | 'bpd' | 'rtrw' | 'linmas' | 'posyandu';
  period?: string;
  phone?: string;
  email?: string;
};

// Profil Desa - Jalan Kabupaten & Jalan Desa
export type JalanKabupatenItem = {
  id: string;
  noRuas: string;
  namaRuas: string;
  pangkalRuas: string;
  ujungRuas: string;
  panjangRuas: number; // Meter
  lebarRuas: number;   // Meter
  kondisiBaik: number; // Meter
  kondisiSedang: number; // Meter
  kondisiRusakRingan: number; // Meter
  kondisiRusakBerat: number;  // Meter
  fotoUrl?: string;
  youtubeUrl?: string;
  videoUrl?: string;
  keterangan?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type JalanDesaItem = {
  id: string;
  no: number;
  desa: string;
  noUrut: string;
  namaJalan: string;
  panjang: number; // Meter
  panjangMeter?: number;
  lebar: number;   // Meter
  lebarMeter?: number;
  pangkal: string;
  ujung: string;
  jenisPerkerasan: string; // Aspal, Rabat Beton, Makadam, Tanah, dll.
  kondisiBaik: number;     // Meter
  kondisiSedang: number;   // Meter
  kondisiRusakRingan: number; // Meter
  kondisiRusakBerat: number;  // Meter
  fotoUrl?: string;
  youtubeUrl?: string;
  videoUrl?: string;
  keterangan?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type ProfilDesaContent = {
  // Profil & Sambutan
  sambutanTitle?: string;
  kadesName?: string;
  kadesTitle?: string;
  kadesSlogan?: string;
  sambutanText?: string;
  kadesPhotoUrl?: string;
  tagsSambutan?: string[];

  // Kenali Kami / Visi Misi
  visiText?: string;
  misiList?: string[];
  budayaKerja?: string;

  // Sejarah Desa
  sejarahAsalUsul?: string;
  sejarahPeriodeList?: { era: string; title: string; desc: string }[];
  daftarKadesList?: { periode: string; nama: string; catatan?: string }[];

  // Peta & Batas Wilayah
  batasUtara?: string;
  batasSelatan?: string;
  batasBarat?: string;
  batasTimur?: string;
  koordinatLat?: string;
  koordinatLng?: string;
  deskripsiPeta?: string;

  // Data Wilayah & Penduduk
  luasWilayahKm2?: number;
  jumlahPenduduk?: number;
  jumlahLakiLaki?: number;
  jumlahPerempuan?: number;
  jumlahDusun?: number;
  jumlahRW?: number;
  jumlahRT?: number;
  jarakKecamatanKm?: number;
  jarakKabupatenKm?: number;

  // Potensi Unggulan
  ringkasanPotensi?: string;
  sektorPertanian?: string;
  sektorPeternakan?: string;
  sektorUMKM?: string;

  // Galeri Media
  youtubeVideoUrl?: string;
  videoTitle?: string;
  videoDescription?: string;

  updatedAt?: any;
};

export type PembangunanDesa = {
  id?: string;
  judul: string;
  lokasi: string;
  volume: string;
  anggaran: number;
  sumberAnggaran: string;
  tahun: number;
  status?: 'perencanaan' | 'berjalan' | 'selesai';
  redaksi: string;
  fotoUrls: string[];
  fotoUrl?: string;
  pelaksana?: string;
  tanggal?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type KategoriAsetDesa = 'tanah' | 'gedung' | 'kendaraan' | 'alsintan';

export type AsetDesa = {
  id?: string;
  kategori: KategoriAsetDesa;

  // Tab 1: Aset Tanah Kas Desa
  kodeAset?: string; // Kode Aset
  namaAset?: string; // Nama Aset
  lokasi?: string; // Lokasi (Blok/Dusun)
  luas?: string; // Luas (m2)
  buktiKepemilikan?: string; // Bukti Kepemilikan (Letter C, Sertifikat Hak Pakai, dll)
  pemanfaatan?: string; // Pemanfaatan Saat Ini (Sawah Kas Desa, Bengkok, Fasum, Disewakan, dll)
  kontribusiPades?: string; // Kontribusi PADes / Ket.

  // Tab 2: Gedung & Bangunan
  namaBangunan?: string; // Nama Bangunan
  luasBangunan?: string; // Luas Bangunan (m2)
  tahunBangun?: string; // Tahun Bangun / Rehab
  sumberAnggaran?: string; // Sumber Anggaran (Dana Desa, APBD Kab, Banprov, dll)
  statusPemanfaatan?: string; // Status Pemanfaatan (Kantor Desa, Balai Pertemuan, PKD/Polindes, Posyandu, dll)

  // Tab 3: Kendaraan Operasional & Layanan (Ambulans / Mobil Siaga)
  jenisMerk?: string; // Jenis & Merk Kendaraan (misal: Mobil Ambulans Desa / Suzuki APV, Motor Dinas)
  nomorPolisi?: string; // Nomor Polisi (Plat Merah / Dinas)
  tahunPerolehan?: string; // Tahun Perolehan
  sumberDana?: string; // Sumber Dana
  kondisi?: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | string; // Kondisi
  penanggungJawab?: string; // Peruntukan & Penanggung Jawab (PIC)

  // Tab 4: Alat Pertanian (Alsintan) & Sarana Pemberdayaan
  namaAlat?: string; // Nama Alat / Barang (Traktor, Pompa Air, Thresher, dll)
  jumlah?: string; // Jumlah (Unit/Pcs)
  tahunSumberDana?: string; // Tahun & Sumber Dana
  pengelola?: string; // Pengelola / Kelompok Pemegang (Gapoktan / Poktan)
  statusPinjam?: string; // Status Pinjam Pakai (Tersedia / Dipinjamkan / Standby)

  // Extra / Media
  keterangan?: string;
  fotoUrl?: string;
  fotoUrls?: string[];
  createdAt?: any;
  updatedAt?: any;
};

// ─── TIPE RAWAN BENCANA & EVAKUASI ───
export type PetaKebencanaanConfig = {
  judulPeta?: string;
  gambarPetaUrl?: string;
  deskripsiNarasi?: string;
  tanggalUpdate?: string;
  legenda?: Array<{ label: string; warna: string; deskripsi: string }>;
  updatedAt?: any;
};

export type RisikoBencanaItem = {
  id?: string;
  jenisBencana: string; // Jenis Ancaman Bencana
  lokasiRawan: string; // Lokasi Rawan (Dusun / RT / RW)
  musimPemicu: string; // Musim / Pemicu Utama
  dampakPotensial: string; // Dampak Potensial
  rekomendasiMitigasi: string; // Rekomendasi Tindakan & Mitigasi
  tingkatRisiko?: 'Tinggi' | 'Sedang' | 'Rendah' | string;
  createdAt?: any;
  updatedAt?: any;
};

export type TempatEvakuasiItem = {
  id?: string;
  kodeNama: string; // Kode & Nama Lokasi
  alamatDusun: string; // Alamat / Dusun
  kapasitas: string; // Kapasitas Tampung
  fasilitas: string; // Fasilitas Tersedia
  penanggungJawab: string; // Penanggung Jawab Lokasi (PIC)
  fotoUrl?: string;
  titikKordinat?: string;
  statusKesiapan?: 'Siap Digunakan' | 'Dalam Penyiapan' | string;
  createdAt?: any;
  updatedAt?: any;
};

export type KontakDaruratItem = {
  id?: string;
  namaInstansi: string;
  nomorTelepon: string;
  peran: string;
  layananJam?: string;
  alamat?: string;
  isHotlineUtama?: boolean;
};

export type SopBencanaItem = {
  id?: string;
  fase: 'pra' | 'saat' | 'pasca';
  judul: string;
  deskripsi: string;
  langkah: string[];
};

export type RawanBencanaData = {
  config?: PetaKebencanaanConfig;
  risikoList?: RisikoBencanaItem[];
  evakuasiList?: TempatEvakuasiItem[];
  kontakList?: KontakDaruratItem[];
  sopList?: SopBencanaItem[];
};

// ─── TIPE DATA PEMILU, PILKADA & PILKADES ───
export type TpsWilayahItem = {
  id: string;
  nomorTps: string; // Nomor TPS
  namaTempat: string; // Lokasi / Nama Tempat TPS
  cakupanWilayah: string; // Cakupan Wilayah (Dusun / RT / RW)
  dptLaki: number; // Jumlah DPT (L)
  dptPerempuan: number; // Jumlah DPT (P)
  totalDpt: number; // Total DPT
};

export type RekapitulasiSuaraItem = {
  id: string;
  nomorUrut: number;
  namaKandidat: string;
  namaWakil?: string;
  keterangan?: string;
  perolehanSuara: number;
  persentase?: number;
  fotoUrl?: string;
  isPemenang?: boolean;
};

export type PenyelenggaraItem = {
  id: string;
  nama: string;
  jabatan: string;
  kategori: 'pps' | 'sekretariat' | 'panitia';
  kontak?: string;
  fotoUrl?: string;
  desa?: string;
  jenisKelamin?: 'L' | 'P' | string;
  agama?: string;
};

export type DemografiGenerasiItem = {
  nama: string;
  rentangUsia: string;
  jumlah: number;
  persen: number;
  color?: string;
};

export type DemografiDisabilitasItem = {
  jenis: string;
  jumlah: number;
  color?: string;
};

// ─── TIPE DATA HASIL PEMILU LEGISLATIF, DPD & PILPRES PER TPS ───
export type CalegItem = {
  noUrut: number | string;
  namaCaleg: string;
  suaraSampeldes: number;
  suaraDapil?: number;
};

export type ParpolHasilItem = {
  nomorParpol: number;
  namaParpol: string;
  singkatanParpol?: string;
  suaraPartai: number;
  suaraPartaiDapil?: number;
  totalSuaraSampeldes: number;
  totalSuaraDapil?: number;
  calegList: CalegItem[];
  color?: string;
};

export type DpdHasilItem = {
  noUrut: number;
  namaCalon: string;
  suaraSampeldes: number;
  suaraKecamatan: number;
  suaraPerTps?: number[];
  persentase?: number;
};

export type PilpresPerTpsItem = {
  tps: string;
  dpt: number;
  suara01: number;
  persen01: number;
  suara02: number;
  persen02: number;
  suara03: number;
  persen03: number;
  tidakSah: number;
  sah: number;
  kehadiran: number;
  persenHdr: number;
};

export type TpsRekapDetailItem = {
  tps: string;
  dptL: number;
  dptP: number;
  dptTotal: number;
  penggunaDpt: number;
  penggunaDptb?: number;
  penggunaDpk: number;
  penggunaTotal: number;
  ssDiterima: number;
  ssSah: number;
  ssTidakSah: number;
  ssRusak: number;
  ssTidakDigunakan: number;
};

export type PilkadaDesaItem = {
  no: number;
  desa?: string;
  namaDesa?: string;
  paslon1: number;
  persen1: number;
  paslon2: number;
  persen2: number;
  paslon3: number;
  persen3: number;
  paslon4: number;
  persen4: number;
  tdkSah: number;
  sah: number;
  tpsMasuk: number;
  persenTpsMsk: number;
  tps: number;
  dpt: number;
  hadir: number;
  persenHadir: number;
};

export type PilgubTpsItem = {
  tps?: string;
  nomorTps?: string;
  kecamatan?: string;
  desa?: string;
  dpt: number;
  paslon1: number;
  paslon2: number;
  tdkSah?: number;
  tidakSah?: number;
  totalSuara: number;
  status: number;
  kehadiran: number;
};

export type PemiluPilkadaConfig = {
  id?: string;
  tahun: number;
  kategori: 'pemilu' | 'pilkada' | 'pilkades';
  namaKegiatan: string;
  tanggalPelaksanaan?: string;
  deskripsi?: string;

  // 1. Kartu Ringkasan Statistik Pemilih
  totalDpt: number;
  dptLaki: number;
  dptPerempuan: number;
  jumlahTps: number;
  tingkatPartisipasi: number; // Contoh: 84.5%
  totalSuaraSah?: number;
  totalSuaraTidakSah?: number;
  totalSuaraMasuk?: number;

  // 2. Visualisasi Demografi Pemilih (Interaktif)
  demografiGenerasi: DemografiGenerasiItem[];
  demografiDisabilitas: DemografiDisabilitasItem[];

  // 3. Tabel Sebaran TPS & Wilayah Cakupan
  tpsList: TpsWilayahItem[];

  // 4. Rekapitulasi & Arsip Hasil Suara Tingkat Desa
  rekapitulasiList: RekapitulasiSuaraItem[];

  // Data Rinci Pemilu 2024 (Pilpres per TPS, DPR RI, DPRD Kab, DPD Jateng, Rekap DPT TPS)
  dprRiList?: ParpolHasilItem[];
  dprdKabList?: ParpolHasilItem[];
  dpdList?: DpdHasilItem[];
  pilpresTpsList?: PilpresPerTpsItem[];
  tpsRekapDetail?: TpsRekapDetailItem[];

  // Data Rinci Pilkada 2024 (Pilbup 14 Desa se-Kecamatan & Pilgub Jateng 12 TPS Sampeldes)
  pilkadaBupatiDesaList?: PilkadaDesaItem[];
  pilgubTpsList?: PilgubTpsItem[];
  rekapitulasiPilgubList?: RekapitulasiSuaraItem[];

  // 5. Penyelenggara Tingkat Desa (PPS & Sekretariat / Panitia Pilkades)
  penyelenggaraList: PenyelenggaraItem[];

  createdAt?: any;
  updatedAt?: any;
};

// ─── TIPE DATA STATISTIK SOSIAL & DTSEN ───
export type DtsenItem = {
  id?: string;
  nomor_kartu_keluarga: string;
  provinsi?: string;
  kabupaten_kota?: string;
  kecamatan?: string;
  kelurahan_desa?: string;
  alamat?: string;
  nama_anggota_keluarga: string;
  desil_nasional: number | string; // 1, 2, 3, 4
  id_pelanggan_pln?: string;
  status_kepemilikan_rumah?: string;
  jenis_lantai_terluas?: string;
  luas_lantai?: string | number;
  jenis_dinding_terluas?: string;
  jenis_atap_terluas?: string;
  sumber_air_minum_utama?: string;
  sumber_penerangan_utama?: string;
  daya_terpasang?: string;
  bahan_bakar_utama_memasak?: string;
  fasilitas_bab?: string;
  jenis_kloset?: string;
  pembuangan_akhir_tinja?: string;
  kepemilikan_aset?: string;
  aset_bergerak_tabung_gas?: string;
  aset_bergerak_lemari_es?: string;
  aset_bergerak_ac?: string;
  aset_bergerak_pemanas_air?: string;
  aset_bergerak_telepon_rumah?: string;
  aset_bergerak_tv_datar?: string;
  aset_bergerak_emas_perhiasan?: string;
  aset_bergerak_komputer_laptop_tablet?: string;
  aset_bergerak_sepeda_motor?: string;
  aset_bergerak_sepeda?: string;
  aset_bergerak_mobil?: string;
  aset_bergerak_perahu?: string;
  aset_bergerak_kapal_perahu_motor?: string;
  aset_bergerak_smartphone?: string;
  aset_tidak_bergerak_lahan_lainnya?: string;
  jumlah_ternak_sapi?: string | number;
  jumlah_ternak_kerbau?: string | number;
  jumlah_ternak_kuda?: string | number;
  jumlah_ternak_babi?: string | number;
  jumlah_ternak_kambing_domba?: string | number;
  kode_kelurahan_desa?: string;
  createdAt?: any;
};

export type DesilStatistikItem = {
  desil: number;
  label: string; // Desil 1 (Sangat Miskin / Ekstrem), dll
  kategori: string;
  jumlahKpm: number;
  persen: number;
  warna: string;
  keterangan: string;
};

export type TrenKemiskinanItem = {
  tahun: number;
  jumlahWargaMiskin: number;
  persentase: number;
  kpmBlt: number;
  keterangan?: string;
};

export type BansosProgramItem = {
  id: string;
  kode: 'blt-dd' | 'pkh' | 'bpnt' | 'cbp' | 'pbi-jkn' | string;
  namaProgram: string;
  sumberDana: string;
  jumlahKpm: number;
  satuan: string; // KPM / Jiwa
  paguAnggaran?: number; // Khusus BLT-DD
  realisasiAnggaran?: number;
  statusPenyaluran: string;
  periode: string;
  keterangan?: string;
};

export type StatistikSosialConfig = {
  id?: string;
  tahun: number;
  judulDtsen: string;
  deskripsiDtsen: string;
  totalKpmDtsen: number;
  desilList: DesilStatistikItem[];
  trenList: TrenKemiskinanItem[];
  bansosList: BansosProgramItem[];
  updatedAt?: any;
};

export type KlasifikasiSuratItem = {
  id: string;
  klasifikasiPokok: string;
  kode: string;
  uraian: string;
  keterangan?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type KodeDinasItem = {
  id: string;
  kode: string;
  namaPerangkatDaerah: string;
  singkatan: string;
  keterangan?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Family = {
  id: string;
  noKk: string;
  kepalaKeluarga: string;
  nikKepala: string;
  genderKepala: string;
  alamat: string;
  dusun: string;
  rw: string;
  rt: string;
  jumlahAnggota: number;
  statusKk: 'KK Aktif' | 'KK Hilang/Pindah/Mati' | 'KK Kosong' | 'No. KK Sementara';
  tagIdCard?: string;
  programBantuan?: string;
  tanggalTerdaftar?: string;
  anggota?: Resident[];
  createdAt?: any;
  updatedAt?: any;
};

export type VillageProfileHistoryItem = {
  id?: string;
  timestamp: any;
  savedAt: string;
  action: string;
  tab: string;
  summary?: string;
  dataSnapshot: Partial<ProfilDesaContent>;
};

// ==========================================
// Tipe Data Terpadu Statistik Desa Sampeldes
// ==========================================

export type StatistikPendidikanData = {
  melekHuruf: number | string;
  wajibBelajar: number | string;
  satuanDasar: string;
  satuanPaud: string;
  eduStats: { label: string; percent: number; count: number; color?: string }[];
  localSchools: { name: string; jenjang: string; status: string; kategori: string }[];
  kecamatanSchools: { jenjang: string; jumlah: number; keterangan: string }[];
  educationalPillars: { title: string; desc: string; tag: string }[];
  bannerTitle?: string;
  bannerDesc?: string;
};

export type StatistikKesehatanData = {
  bpjsPercent: number | string;
  stuntingStatus: string;
  posyanduCount: string;
  aksesFaskes: string;
  kecamatanFacilities: { jenis: string; desaMemiliki: number; keterangan: string }[];
  healthServices: { title: string; desc: string; tag: string }[];
  healthInitiatives: { title: string; desc: string; badge: string; color: string }[];
  bannerTitle?: string;
  bannerDesc?: string;
};

export type StatistikEkonomiData = {
  pertanianPercent: number | string;
  padiTahunanTon: number | string;
  umkmCount: number | string;
  bumdesName: string;
  bumdesSubtitle?: string;
  bumdesUnits: { title: string; desc: string }[];
  komoditas: { name: string; yield: string; area: string }[];
  ternak: { sapi: number; kambing: number; unggas: string | number };
  peluangDesc?: string;
  bannerTitle?: string;
  bannerDesc?: string;
};

export type StatistikPembangunanData = {
  jalanDesaPanjang: string;
  aksesKabupaten: string;
  transportasiDarat: string;
  pjuTitik: string;
  catatanAksesibilitas?: string;
  tenDirections: { no: number; title: string; desc: string }[];
  prioritasInfrastruktur: { title: string; desc: string; status: string; tag: string }[];
  bannerTitle?: string;
  bannerDesc?: string;
};

export type StatistikSdgsData = {
  skorTotal: number;
  goals: { no: number; title: string; score: number; color: string; status: string }[];
  bannerTitle?: string;
  bannerDesc?: string;
};

export type StatistikIndeksDimensi = {
  id: string;
  no: number;
  name: string;
  fullName: string;
  scoreAvg: number;
  status: string;
  badgeClass?: string;
  starIcon?: string;
  desc: string;
  totalIndicators: number;
  color?: string;
};

export type StatistikIndeksData = {
  skorTotal: number;
  status: string;
  dimensions: StatistikIndeksDimensi[];
  rekomendasiStrategis?: { title: string; desc: string; target: string }[];
  bannerTitle?: string;
  bannerDesc?: string;
};

export type VillageStatisticsData = {
  // Demografi (Kependudukan)
  total?: number;
  totalKK?: number;
  maleCount?: number;
  femaleCount?: number;
  density?: number;
  sexRatio?: number;
  malePercent?: number;
  femalePercent?: number;
  rwBreakdown?: { rw: string; rt: number; label: string }[];
  ageData?: { name: string; value: number }[];
  jobData?: { name: string; value: number }[];
  eduData?: { name: string; value: number }[];
  mutationData?: { month: string; lahir: number; mati: number; datang: number; pindah: number }[];
  dusunData?: Record<string, any>;

  // Sidebar Pokok
  sidebarInfo?: {
    luasWilayah?: string | number;
    totalPenduduk?: string | number;
    kepadatan?: string | number;
    rasioJenisKelamin?: string | number;
    rwRt?: string;
    jarakKecamatan?: string | number;
    jarakKabupaten?: string | number;
    pendudukKecPercent?: string | number;
    luasKecPercent?: string | number;
  };

  // Sub-bidang Lainnya
  pendidikan?: Partial<StatistikPendidikanData>;
  kesehatan?: Partial<StatistikKesehatanData>;
  ekonomi?: Partial<StatistikEkonomiData>;
  pembangunan?: Partial<StatistikPembangunanData>;
  sdgs?: Partial<StatistikSdgsData>;
  indeks?: Partial<StatistikIndeksData>;
  socialConfig?: Partial<StatistikSosialConfig>;

  updatedAt?: any;
};

export type StatisticsHistoryItem = {
  id: string;
  timestamp: any;
  tab: string;
  action: string;
  summary: string;
  author: string;
  snapshotData: Partial<VillageStatisticsData> | Record<string, any>;
};





