import { KlasifikasiSuratItem, KodeDinasItem } from './types';

export const DAFTAR_KLASIFIKASI_POKOK = [
  '000 UMUM',
  '100 PEMERINTAHAN',
  '200 POLITIK',
  '300 KEAMANAN & KETERTIBAN',
  '400 KESEJAHTERAAN RAKYAT',
  '500 PEREKONOMIAN',
  '600 PEKERJAAN UMUM',
  '700 PENGAWASAN',
  '800 KEPEGAWAIAN',
  '900 KEUANGAN',
] as const;

export const SEED_KLASIFIKASI_SURAT: KlasifikasiSuratItem[] = [
  // 000 UMUM
  { id: 'klas_000', klasifikasiPokok: '000 UMUM', kode: '000', uraian: 'Umum & Tata Usaha', keterangan: 'Urusan persuratan, tata usaha umum, dan ketatausahaan desa' },
  { id: 'klas_005', klasifikasiPokok: '000 UMUM', kode: '005', uraian: 'Undangan Resmi', keterangan: 'Surat undangan musyawarah, pertemuan, upacara, dan kegiatan' },
  { id: 'klas_010', klasifikasiPokok: '000 UMUM', kode: '010', uraian: 'Lambang, Logo & Identitas Daerah', keterangan: 'Atribut lambang desa, pataka, dan identitas resmi' },
  { id: 'klas_020', klasifikasiPokok: '000 UMUM', kode: '020', uraian: 'Peralatan & Gedung Kantor', keterangan: 'Inventarisasi ruang kerja, pemeliharaan kantor dan balai desa' },
  { id: 'klas_040', klasifikasiPokok: '000 UMUM', kode: '040', uraian: 'Perpustakaan & Dokumentasi Desa', keterangan: 'Arsip literatur, pustaka desa, dan dokumentasi sejarah' },
  { id: 'klas_050', klasifikasiPokok: '000 UMUM', kode: '050', uraian: 'Perencanaan Pembangunan Desa', keterangan: 'Musrenbangdes, RPJMDes, dan RKPDes tahunan' },

  // 100 PEMERINTAHAN
  { id: 'klas_100', klasifikasiPokok: '100 PEMERINTAHAN', kode: '100', uraian: 'Pemerintahan Umum', keterangan: 'Tata laksana dan kebijakan umum pemerintahan desa' },
  { id: 'klas_140', klasifikasiPokok: '100 PEMERINTAHAN', kode: '140', uraian: 'Pemerintahan Desa / Kelurahan', keterangan: 'Penyelenggaraan tata praja dan birokrasi tingkat desa' },
  { id: 'klas_141', klasifikasiPokok: '100 PEMERINTAHAN', kode: '141', uraian: 'Perangkat Desa & Pamong', keterangan: 'Sekretariat desa, kepala urusan, dan kepala seksi' },
  { id: 'klas_142', klasifikasiPokok: '100 PEMERINTAHAN', kode: '142', uraian: 'Badan Permusyawaratan Desa (BPD)', keterangan: 'Musyawarah BPD, persetujuan bersama, dan pengawasan' },
  { id: 'klas_143', klasifikasiPokok: '100 PEMERINTAHAN', kode: '143', uraian: 'Lembaga Kemasyarakatan Desa (LKD)', keterangan: 'RT, RW, PKK, Karang Taruna, LPMD, dan Posyandu' },
  { id: 'klas_145', klasifikasiPokok: '100 PEMERINTAHAN', kode: '145', uraian: 'Administrasi Pemerintahan Desa', keterangan: 'Regulasi desa, buku register, dan arsip desa' },
  { id: 'klas_146', klasifikasiPokok: '100 PEMERINTAHAN', kode: '146', uraian: 'Kekayaan & Aset Milik Desa', keterangan: 'Pengelolaan inventaris barang milik desa dan legalitas aset' },
  { id: 'klas_147', klasifikasiPokok: '100 PEMERINTAHAN', kode: '147', uraian: 'Pemberdayaan Masyarakat Desa', keterangan: 'Program swadaya, pemberdayaan ekonomi, dan pelatihan' },
  { id: 'klas_148', klasifikasiPokok: '100 PEMERINTAHAN', kode: '148', uraian: 'Pemilihan Kepala Desa (Pilkades / PAW)', keterangan: 'Panitia pemilihan, pencalonan, dan pelantikan kades' },
  { id: 'klas_149', klasifikasiPokok: '100 PEMERINTAHAN', kode: '149', uraian: 'Pertanahan Desa & Tanah Kas Desa (TKD)', keterangan: 'Buku C desa, lelang bengkok, dan pendaftaran tanah' },

  // 200 POLITIK
  { id: 'klas_200', klasifikasiPokok: '200 POLITIK', kode: '200', uraian: 'Politik Dalam Negeri', keterangan: 'Wawasan kebangsaan dan situasi politik wilayah' },
  { id: 'klas_210', klasifikasiPokok: '200 POLITIK', kode: '210', uraian: 'Organisasi Kemasyarakatan & LSM', keterangan: 'Koordinasi ormas pemuda, keagamaan, dan komunitas' },
  { id: 'klas_270', klasifikasiPokok: '200 POLITIK', kode: '270', uraian: 'Pemilihan Umum & Pilkada (PPS/KPPS)', keterangan: 'Daftar pemilih tetap (DPT), logistik pemilu, dan KPPS' },

  // 300 KEAMANAN & KETERTIBAN
  { id: 'klas_300', klasifikasiPokok: '300 KEAMANAN & KETERTIBAN', kode: '300', uraian: 'Ketenteraman & Ketertiban Umum', keterangan: 'Keamanan lingkungan dan ketertiban masyarakat' },
  { id: 'klas_330', klasifikasiPokok: '300 KEAMANAN & KETERTIBAN', kode: '330', uraian: 'Pertahanan Sipil & Linmas (Satlinmas)', keterangan: 'Penugasan ronda malam dan pengamanan pos kamling' },
  { id: 'klas_360', klasifikasiPokok: '300 KEAMANAN & KETERTIBAN', kode: '360', uraian: 'Penanggulangan Bencana Alam (Satgana)', keterangan: 'Mitigasi banjir, tanggap darurat, dan posko bencana' },

  // 400 KESEJAHTERAAN RAKYAT
  { id: 'klas_400', klasifikasiPokok: '400 KESEJAHTERAAN RAKYAT', kode: '400', uraian: 'Kesejahteraan Rakyat', keterangan: 'Kesejahteraan sosial, bantuan, dan jaminan hidup' },
  { id: 'klas_410', klasifikasiPokok: '400 KESEJAHTERAAN RAKYAT', kode: '410', uraian: 'Pembangunan Masyarakat Desa', keterangan: 'Pengembangan kapasitas keluarga dan sarana komunal' },
  { id: 'klas_420', klasifikasiPokok: '400 KESEJAHTERAAN RAKYAT', kode: '420', uraian: 'Pendidikan & Kebudayaan', keterangan: 'PAUD desa, beasiswa siswa miskin, dan seni budaya' },
  { id: 'klas_430', klasifikasiPokok: '400 KESEJAHTERAAN RAKYAT', kode: '430', uraian: 'Kesehatan Masyarakat & Sanitasi', keterangan: 'Posyandu balita/lansia, penanganan stunting, dan sanitasi' },
  { id: 'klas_440', klasifikasiPokok: '400 KESEJAHTERAAN RAKYAT', kode: '440', uraian: 'Kesejahteraan Sosial & Fakir Miskin', keterangan: 'Bansos PKH, BPNT, BLT-DD, DTSEN, dan fakir miskin' },
  { id: 'klas_470', klasifikasiPokok: '400 KESEJAHTERAAN RAKYAT', kode: '470', uraian: 'Kependudukan & Administrasi Warga', keterangan: 'Statistik kependudukan, surat pengantar, dan mutasi' },
  { id: 'klas_471', klasifikasiPokok: '400 KESEJAHTERAAN RAKYAT', kode: '471', uraian: 'KTP & Kartu Keluarga (KK)', keterangan: 'Pengantar penerbitan dan perubahan data KTP-el / KK' },
  { id: 'klas_472', klasifikasiPokok: '400 KESEJAHTERAAN RAKYAT', kode: '472', uraian: 'Pindah Datang Penduduk (SKPWNI)', keterangan: 'Surat keterangan pindah keluar dan masuk penduduk' },
  { id: 'klas_474', klasifikasiPokok: '400 KESEJAHTERAAN RAKYAT', kode: '474', uraian: 'Catatan Sipil (Kelahiran & Kematian)', keterangan: 'Surat keterangan kelahiran, kematian, dan akta' },

  // 500 PEREKONOMIAN
  { id: 'klas_500', klasifikasiPokok: '500 PEREKONOMIAN', kode: '500', uraian: 'Perekonomian Desa', keterangan: 'Aktivitas perniagaan, sirkulasi modal, dan ekonomi lokal' },
  { id: 'klas_510', klasifikasiPokok: '500 PEREKONOMIAN', kode: '510', uraian: 'Perdagangan & Pasar Desa', keterangan: 'Pengelolaan kios pasar desa dan izin keramaian dagang' },
  { id: 'klas_520', klasifikasiPokok: '500 PEREKONOMIAN', kode: '520', uraian: 'Pertanian, Peternakan & Ketahanan Pangan', keterangan: 'Kelompok tani, pupuk subsidi, irigasi sawah, ternak' },
  { id: 'klas_530', klasifikasiPokok: '500 PEREKONOMIAN', kode: '530', uraian: 'Perindustrian, Kerajinan & UMKM', keterangan: 'Sentra industri rumah tangga dan izin usaha mikro' },
  { id: 'klas_580', klasifikasiPokok: '500 PEREKONOMIAN', kode: '580', uraian: 'BUMDes (Badan Usaha Milik Desa)', keterangan: 'Penyertaan modal, unit usaha, dan laporan laba BUMDes' },

  // 600 PEKERJAAN UMUM
  { id: 'klas_600', klasifikasiPokok: '600 PEKERJAAN UMUM', kode: '600', uraian: 'Pekerjaan Umum & Tata Ruang', keterangan: 'Tata ruang desa, drainase, dan fasilitas umum' },
  { id: 'klas_620', klasifikasiPokok: '600 PEKERJAAN UMUM', kode: '620', uraian: 'Jalan Lingkungan & Jembatan Desa', keterangan: 'Pavingisasi jalan lingkungan, jembatan, dan talud' },
  { id: 'klas_640', klasifikasiPokok: '600 PEKERJAAN UMUM', kode: '640', uraian: 'Bangunan Gedung & Rumah Tidak Layak Huni (RTLH)', keterangan: 'Bedah rumah RTLH warga miskin dan fasilitas publik' },

  // 700 PENGAWASAN
  { id: 'klas_700', klasifikasiPokok: '700 PENGAWASAN', kode: '700', uraian: 'Pengawasan & Akuntabilitas', keterangan: 'Pengawasan internal, pengaduan masyarakat, audit desa' },
  { id: 'klas_710', klasifikasiPokok: '700 PENGAWASAN', kode: '710', uraian: 'Inspektorat & Pemeriksaan Dana Desa', keterangan: 'Pemeriksaan reguler inspektorat kabupaten dan tindak lanjut' },

  // 800 KEPEGAWAIAN
  { id: 'klas_800', klasifikasiPokok: '800 KEPEGAWAIAN', kode: '800', uraian: 'Kepegawaian Aparatur Desa', keterangan: 'Disiplin kerja, absensi, cuti, dan kinerja perangkat' },
  { id: 'klas_840', klasifikasiPokok: '800 KEPEGAWAIAN', kode: '840', uraian: 'Pengangkatan & Pemberhentian Perangkat', keterangan: 'Surat keputusan kepala desa untuk mutasi & SK pamong' },
  { id: 'klas_890', klasifikasiPokok: '800 KEPEGAWAIAN', kode: '890', uraian: 'Pendidikan, Pelatihan & Bimtek', keterangan: 'Surat tugas bimtek, seminar, dan sertifikasi pamong' },

  // 900 KEUANGAN
  { id: 'klas_900', klasifikasiPokok: '900 KEUANGAN', kode: '900', uraian: 'Keuangan Daerah & Desa', keterangan: 'Rekening kas desa, pengelolaan perbankan, dan SILK' },
  { id: 'klas_910', klasifikasiPokok: '900 KEUANGAN', kode: '910', uraian: 'Anggaran Pendapatan & Belanja Desa (APBDes)', keterangan: 'Perdes APBDes murni dan APBDes perubahan' },
  { id: 'klas_912', klasifikasiPokok: '900 KEUANGAN', kode: '912', uraian: 'Laporan Pertanggungjawaban (SPJ & LPJ)', keterangan: 'Surat pertanggungjawaban realisasi kegiatan dana desa' },
  { id: 'klas_920', klasifikasiPokok: '900 KEUANGAN', kode: '920', uraian: 'Pajak Bumi dan Bangunan (PBB-P2)', keterangan: 'Pungutan PBB, SPPT, dan setoran ke kas daerah' },
  { id: 'klas_970', klasifikasiPokok: '900 KEUANGAN', kode: '970', uraian: 'Bantuan Keuangan Khusus (BKK / Bankeu)', keterangan: 'Alokasi bantuan keuangan aspirasi kabupaten / provinsi' },
];

export const SEED_KODE_DINAS: KodeDinasItem[] = [
  { id: 'dinas_01', kode: '01', namaPerangkatDaerah: 'Sekretariat Daerah Kabupaten', singkatan: 'SETDA', keterangan: 'Sekda dan bagian-bagian di bawah Setda kabupaten' },
  { id: 'dinas_02', kode: '02', namaPerangkatDaerah: 'Badan Perencanaan Pembangunan Daerah', singkatan: 'BAPPEDA', keterangan: 'Perencanaan pembangunan makro wilayah kabupaten' },
  { id: 'dinas_03', kode: '03', namaPerangkatDaerah: 'Badan Pengelolaan Keuangan dan Aset Daerah', singkatan: 'BPKAD', keterangan: 'Penyaluran dana transfer desa (ADD, DD, Bagi Hasil)' },
  { id: 'dinas_04', kode: '04', namaPerangkatDaerah: 'Dinas Pemberdayaan Masyarakat dan Desa', singkatan: 'DISPERMADES', keterangan: 'Instansi pembina teknis utama pemerintahan & pembangunan desa' },
  { id: 'dinas_05', kode: '05', namaPerangkatDaerah: 'Dinas Sosial', singkatan: 'DINSOS', keterangan: 'Pengelolaan data kemiskinan DTSEN, PKH, dan kebencanaan' },
  { id: 'dinas_06', kode: '06', namaPerangkatDaerah: 'Dinas Kesehatan', singkatan: 'DINKES', keterangan: 'Pembinaan puskesmas, posyandu, dan pencegahan stunting' },
  { id: 'dinas_07', kode: '07', namaPerangkatDaerah: 'Dinas Pendidikan dan Kebudayaan', singkatan: 'DISDIKBUD', keterangan: 'Pendidikan dasar dan pelestarian adat istiadat kebudayaan' },
  { id: 'dinas_08', kode: '08', namaPerangkatDaerah: 'Dinas Kependudukan dan Pencatatan Sipil', singkatan: 'DISDUKCAPIL', keterangan: 'Layanan Adminduk, KTP-el, KIA, Akta, dan sinkronisasi SIAK' },
  { id: 'dinas_09', kode: '09', namaPerangkatDaerah: 'Dinas Pekerjaan Umum dan Penataan Ruang', singkatan: 'DPU-PR', keterangan: 'Infrastruktur jalan kabupaten, irigasi primer, dan tata ruang' },
  { id: 'dinas_10', kode: '10', namaPerangkatDaerah: 'Dinas Pertanian dan Pangan', singkatan: 'DISTAN', keterangan: 'Alokasi pupuk bersubsidi, PPL pertanian, dan ketahanan pangan' },
  { id: 'dinas_11', kode: '11', namaPerangkatDaerah: 'Dinas Komunikasi dan Informatika', singkatan: 'DISKOMINFO', keterangan: 'Sistem informasi desa, jaringan internet, dan keterbukaan informasi' },
  { id: 'dinas_12', kode: '12', namaPerangkatDaerah: 'Inspektorat Daerah Kabupaten', singkatan: 'INSPEKTORAT', keterangan: 'Aparat pengawasan intern pemerintah (APIP) dan audit APBDes' },
  { id: 'dinas_13', kode: '13', namaPerangkatDaerah: 'Kantor Kecamatan Sayung', singkatan: 'KEC. SAYUNG', keterangan: 'Pemerintah kecamatan pembina wilayah administratif Desa Sampeldes' },
  { id: 'dinas_14', kode: '14', namaPerangkatDaerah: 'Kepolisian Sektor Sayung', singkatan: 'POLSEK', keterangan: 'Kamtibmas dan pembinaan Babinkamtibmas di Desa Sampeldes' },
  { id: 'dinas_15', kode: '15', namaPerangkatDaerah: 'Komando Rayon Militer Sayung', singkatan: 'KORAMIL', keterangan: 'Ketahanan wilayah dan pembinaan Babinsa di Desa Sampeldes' },
  { id: 'dinas_16', kode: '16', namaPerangkatDaerah: 'Kantor Urusan Agama (KUA)', singkatan: 'KUA', keterangan: 'Pencatatan nikah, wakaf, dan pembinaan kemasjidan' },
  { id: 'dinas_17', kode: '17', namaPerangkatDaerah: 'Pusat Kesehatan Masyarakat (Puskesmas)', singkatan: 'PUSKESMAS', keterangan: 'Fasilitas kesehatan tingkat pertama rujukan desa' },
  { id: 'dinas_18', kode: '18', namaPerangkatDaerah: 'Badan Permusyawaratan Desa Sampeldes', singkatan: 'BPD', keterangan: 'Lembaga legislasi dan penampung aspirasi warga Desa Sampeldes' },
  { id: 'dinas_19', kode: '19', namaPerangkatDaerah: 'Pemerintah Desa Sampeldes', singkatan: 'PEMDES', keterangan: 'Kepala desa dan perangkat desa pelaksana eksekutif desa' },
  { id: 'dinas_20', kode: '20', namaPerangkatDaerah: 'Badan Usaha Milik Desa Makmur Sampeldes', singkatan: 'BUMDES', keterangan: 'Unit usaha ekonomi produktif milik desa' },
];
