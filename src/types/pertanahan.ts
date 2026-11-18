export type KategoriTanah =
  | 'milik_adat'
  | 'tkd_bengkok'
  | 'shm'
  | 'hgb'
  | 'tanah_negara'
  | 'wakaf'
  | 'fasilitas_umum';

export type JenisTanah = 'darat' | 'sawah' | 'tegalan';

export type StatusSertifikat =
  | 'letter_c'
  | 'petok_d'
  | 'shm'
  | 'hgb'
  | 'hpl'
  | 'belum_bersertifikat';

export type JenisPemilik = 'penduduk' | 'luar_desa' | 'pemerintah' | 'fasilitas_umum';

export interface DataPersil {
  id: string;
  nomorPersil: string; // Contoh: "12", "12a", "45"
  nomorUrutBidang?: string; // NUB (Nomor Urut Bidang)
  nomorCDesa: string; // Nomor Kohir C-Desa terkait, cth: "152"
  cDesaId?: string; // ID dokumen Firestore cdesa jika terhubung

  // Subjek Pemilik / Penguasa
  jenisPemilik: JenisPemilik;
  pemilikNik?: string; // NIK warga jika penduduk lokal
  pemilikNama: string; // Nama pemilik sesuai Buku C / Sertifikat
  pemilikAlamat: string;

  // Klasifikasi Bidang
  kategoriTanah: KategoriTanah;
  kelasTanah: string; // Contoh: 'D.I', 'D.II', 'S.I', 'S.II', 'T.I'
  jenisTanah: JenisTanah;
  peruntukanTanah: string; // Pekarangan, Sawah Irigasi, Perumahan, dll.
  luasM2: number;

  // Letak Wilayah Administratif
  dusun: string; // Contoh: Dusun Krajan, Dusun Barat, dsb.
  rw: string;
  rt: string;
  namaBlok?: string; // Nama blok lokal

  // Batas-batas Sempadan Bidang
  batasUtara: string;
  batasTimur: string;
  batasSelatan: string;
  batasBarat: string;

  // Pajak PBB-P2 & Legalitas
  nopPbb?: string;
  statusSertifikat: StatusSertifikat;
  nomorSertifikat?: string;

  // Koordinat Spasial GIS
  latitude?: number;
  longitude?: number;
  polygonGeoJson?: string;

  // Catatan & Metadata
  keterangan?: string;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface CDesa {
  id: string;
  nomorC: string; // Nomor Kohir, contoh: "001", "152"
  
  // Pemilik Induk
  jenisPemilik: 'penduduk' | 'luar_desa' | 'alm_waris';
  nik?: string;
  namaPemilik: string; // Nama terdaftar di Buku C
  alamat: string;
  namaWaris?: string; // Nama ahli waris jika atas nama almarhum

  // Rekapitulasi Luas (Dihitung otomatis)
  totalLuasDaratM2: number;
  totalLuasSawahM2: number;
  totalLuasTotalM2: number;
  jumlahPersil: number;

  status: 'aktif' | 'mutasi_penuh';
  catatan?: string;

  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export type SebabMutasi =
  | 'jual_beli'
  | 'waris'
  | 'hibah'
  | 'tukar_menukar'
  | 'wakaf'
  | 'lelang'
  | 'pemecahan'
  | 'penggabungan'
  | 'penetapan_pengadilan';

export interface MutasiCDesa {
  id: string;
  cDesaId: string; // ID C-Desa asal
  nomorCAsal: string; // Nomor Kohir C asal
  namaPemilikAsal: string;

  persilId: string; // ID persil yang dimutasi
  nomorPersil: string;
  kelasTanah: string;

  tanggalMutasi: string; // YYYY-MM-DD
  sebabMutasi: SebabMutasi;

  luasDimutasiM2: number;
  sisaLuasM2: number;

  // Pihak Penerima
  jenisPenerima: 'penduduk' | 'luar_desa';
  cDesaTujuanNomor?: string; // Nomor Kohir baru jika ada
  namaPenerima: string;
  nikPenerima?: string;
  alamatPenerima: string;

  // Legalitas / Dasar Surat
  nomorAkta: string; // No. AJB / Surat Keterangan Waris / Akta Hibah
  tanggalAkta: string;
  pejabatPembuatAkta: string; // PPAT / Notaris / Camat / Kades

  keterangan?: string;
  createdAt?: any;
  createdBy?: string;
}
