import type { OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildF209PortraitHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};

  const namaDesa = ctx?.namaDesa || 'Sampeldes';
  const namaKec = ctx?.namaKecamatan || 'Gandrungmangu';
  const namaKab = ctx?.namaKabupaten || 'Cilacap';
  const namaProv = ctx?.namaProvinsi || 'Jawa Tengah';
  const rawKodeWil = (ctx?.kodeDesa || '33.01.10.2011').replace(/[^0-9]/g, '');
  const tanggalSurat = ctx?.tanggalSurat || '';
  const namaKades = ctx?.namaKepalaDesa || ctx?.namaPamong || 'TUKIMAN';
  const nomorSurat = ctx?.nomorSurat || '';

  // Helpers untuk Box Digit dan Karakter yang kompak
  const renderBoxedDigits = (val: string | number, totalCount = 16, boxWidth = '9.8px', boxHeight = '11.5px', fontSize = '5.8pt') => {
    const clean = (val ?? '').toString().replace(/[^0-9a-zA-Z]/g, '');
    const chars = clean.padEnd(totalCount, ' ').slice(0, totalCount).split('');
    return `<table style="border-collapse: collapse; display: inline-table; vertical-align: middle; margin: 0; line-height: 1;">
      <tr>
        ${chars.map(c => `<td style="border: 1px solid #000; width: ${boxWidth}; height: ${boxHeight}; text-align: center; font-family: monospace; font-size: ${fontSize}; font-weight: bold; padding: 0; background: #fff;">${c === ' ' ? '&nbsp;' : c}</td>`).join('')}
      </tr>
    </table>`;
  };

  const renderCharBoxes = (str: string, totalCount = 33, boxWidth = '9px', boxHeight = '11.5px', fontSize = '5.6pt') => {
    const chars = (str || '').toUpperCase().padEnd(totalCount, ' ').slice(0, totalCount).split('');
    return `<table style="border-collapse: collapse; display: inline-table; vertical-align: middle; margin: 0; line-height: 1;">
      <tr>
        ${chars.map(c => `<td style="border: 1px solid #000; width: ${boxWidth}; height: ${boxHeight}; text-align: center; font-family: monospace; font-size: ${fontSize}; font-weight: bold; padding: 0; background: #fff;">${c === ' ' ? '&nbsp;' : c}</td>`).join('')}
      </tr>
    </table>`;
  };

  const renderOptionSquare = (codeVal: string | number) =>
    `<span style="display:inline-block; width:13px; height:11px; border:1px solid #000; text-align:center; line-height:11px; font-family:monospace; font-size:6pt; font-weight:bold; margin-right:4px; vertical-align:middle; background:#fff;">${codeVal ? codeVal : '&nbsp;'}</span>`;

  const renderAddressGrid = (desa: string, kec: string, kab: string, prov: string) => `
    <table style="width: 100%; border-collapse: collapse; font-size: 5.4pt; border: 1px solid #000; margin-top: 1px; line-height: 1.1;" border="1">
      <tr>
        <td style="width: 80px; padding: 0.5px 2px; border: 1px solid #000;">a. Desa/Kelurahan</td>
        <td style="width: 130px; padding: 0.5px 2px; border: 1px solid #000; font-weight: 500;">${desa}</td>
        <td style="width: 65px; padding: 0.5px 2px; border: 1px solid #000;">c. Kab/Kota</td>
        <td style="padding: 0.5px 2px; border: 1px solid #000; font-weight: 500;">${kab}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 2px; border: 1px solid #000;">b. Kecamatan</td>
        <td style="padding: 0.5px 2px; border: 1px solid #000; font-weight: 500;">${kec}</td>
        <td style="padding: 0.5px 2px; border: 1px solid #000;">d. Provinsi</td>
        <td style="padding: 0.5px 2px; border: 1px solid #000; font-weight: 500;">${prov}</td>
      </tr>
    </table>`;

  function parseDateParts(dateStr?: string) {
    if (!dateStr) return { hari: '', tgl: '', bln: '', thn: '' };
    try {
      const cleanStr = String(dateStr).trim();
      const dmy = cleanStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
      if (dmy) {
        const d = new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10));
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
        const hari = !isNaN(d.getTime()) ? days[d.getDay()] : '';
        return { hari, tgl: dmy[1].padStart(2, '0'), bln: dmy[2].padStart(2, '0'), thn: dmy[3] };
      }
      const d = new Date(cleanStr);
      if (!isNaN(d.getTime())) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
        const hari = days[d.getDay()];
        const tgl = String(d.getDate()).padStart(2, '0');
        const bln = String(d.getMonth() + 1).padStart(2, '0');
        const thn = String(d.getFullYear());
        return { hari, tgl, bln, thn };
      }
      const parts = cleanStr.split(/[-/ ]/);
      if (parts.length === 3) {
        return { hari: '', tgl: parts[0].padStart(2, '0'), bln: parts[1].padStart(2, '0'), thn: parts[2] };
      }
      return { hari: '', tgl: '', bln: '', thn: '' };
    } catch {
      return { hari: '', tgl: '', bln: '', thn: '' };
    }
  }

  function calculateAgeFromBirthDate(birthDateStr?: string): string {
    if (!birthDateStr) return '';
    try {
      const p = parseDateParts(birthDateStr);
      if (p.thn) {
        const birthYear = parseInt(p.thn, 10);
        const currentYear = new Date().getFullYear();
        const diff = currentYear - birthYear;
        if (diff > 0 && diff < 120) return String(diff);
      }
    } catch {
      // ignore
    }
    return '';
  }

  const anyIndividu = (vIndividu as any) || {};

  // --- DATA KEPALA KELUARGA & KK ---
  const validNoKkCandidate = [
    fValues['kkNumber'],
    fValues['noKk'],
    fValues['no_kk'],
    fValues['form_no_kk'],
    vIndividu?.no_kk,
  ].find((v) => v && String(v).replace(/[^0-9]/g, '').length >= 10);

  const noKk = validNoKkCandidate ? String(validNoKkCandidate).replace(/[^0-9]/g, '') : '';
  const namaKepalaKk =
    fValues['nama_kepala_keluarga'] ||
    fValues['nama_kepala_kk'] ||
    fValues['form_nama_kepala_keluarga'] ||
    fValues['kepalaKk'] ||
    anyIndividu?.nama_kepala_kk ||
    (anyIndividu?.shdk?.toUpperCase() === 'KEPALA KELUARGA' ? vIndividu?.nama : '') ||
    '';

  // --- 1. DATA YANG LAHIR MATI ---
  const lamaKandungan = String(
    fValues['lamaKandungan'] ||
    fValues['form_lama_kandungan'] ||
    fValues['gestationAge'] ||
    fValues['lama_kandungan'] ||
    '8'
  ).replace(/[^0-9]/g, '');

  const rawJkBayi = (
    fValues['form_sex_bayi'] ||
    fValues['sexBayi'] ||
    fValues['childGender'] ||
    fValues['gender'] ||
    fValues['jenis_kelamin_bayi'] ||
    ''
  ).toLowerCase();
  const jkBayiCode = rawJkBayi.includes('perempuan') ? '2' : (rawJkBayi.includes('laki') ? '1' : '');

  const rawTglLahir = fValues['form_tanggal_lahir_mati'] || fValues['deathDate'] || fValues['tanggal_lahir_mati'] || fValues['birthDate'] || '';
  const dateBayi = parseDateParts(rawTglLahir);

  const rawJenisKelahiran = (
    fValues['form_jenis_kelahiran'] ||
    fValues['birthType'] ||
    fValues['jenis_kelahiran'] ||
    '1'
  ).toString().toLowerCase();
  let kodeJenisKelahiran = '1';
  if (rawJenisKelahiran.includes('kembar 2') || rawJenisKelahiran === '2') kodeJenisKelahiran = '2';
  else if (rawJenisKelahiran.includes('kembar 3') || rawJenisKelahiran === '3') kodeJenisKelahiran = '3';
  else if (rawJenisKelahiran.includes('kembar 4') || rawJenisKelahiran === '4') kodeJenisKelahiran = '4';
  else if (rawJenisKelahiran.includes('lain')) kodeJenisKelahiran = '5';
  else if (rawJenisKelahiran.includes('tunggal') || rawJenisKelahiran === '1') kodeJenisKelahiran = '1';

  const rawAnakKe = String(
    fValues['form_kelahiran_ke'] ||
    fValues['form_anak_ke'] ||
    fValues['childOrder'] ||
    fValues['anak_ke'] ||
    '1'
  ).replace(/[^0-9]/g, '');

  const rawTempatLahirType = (
    fValues['form_tempat_dilahirkan'] ||
    fValues['birthPlaceType'] ||
    '1'
  ).toString().toLowerCase();
  let kodeTempatLahir = '1';
  if (rawTempatLahirType.includes('puskesmas') || rawTempatLahirType === '2') kodeTempatLahir = '2';
  else if (rawTempatLahirType.includes('polindes') || rawTempatLahirType === '3') kodeTempatLahir = '3';
  else if (rawTempatLahirType.includes('rumah') || rawTempatLahirType === '4') kodeTempatLahir = '4';
  else if (rawTempatLahirType.includes('lain') || rawTempatLahirType === '5') kodeTempatLahir = '5';
  else if (rawTempatLahirType.includes('rs') || rawTempatLahirType.includes('rb') || rawTempatLahirType === '1') kodeTempatLahir = '1';

  const rawPenolongType = (
    fValues['form_penolong_kelahiran'] ||
    fValues['birthAttendantType'] ||
    '2'
  ).toString().toLowerCase();
  let kodePenolong = '2';
  if (rawPenolongType.includes('dokter') || rawPenolongType === '1') kodePenolong = '1';
  else if (rawPenolongType.includes('bidan') || rawPenolongType.includes('perawat') || rawPenolongType === '2') kodePenolong = '2';
  else if (rawPenolongType.includes('dukun') || rawPenolongType === '3') kodePenolong = '3';
  else if (rawPenolongType.includes('lain') || rawPenolongType === '4') kodePenolong = '4';

  const sebabLahirMati = (
    fValues['form_sebab_lahir_mati'] ||
    fValues['cause'] ||
    fValues['sebab_lahir_mati'] ||
    'IUFD (Intrauterine Fetal Death)'
  ).toString();

  const rawYangMenentukan = (
    fValues['form_yang_menentukan'] ||
    fValues['whoDetermined'] ||
    '2'
  ).toString().toLowerCase();
  let kodeYangMenentukan = '2';
  if (rawYangMenentukan.includes('dokter') || rawYangMenentukan === '1') kodeYangMenentukan = '1';
  else if (rawYangMenentukan.includes('bidan') || rawYangMenentukan.includes('perawat') || rawYangMenentukan === '2') kodeYangMenentukan = '2';
  else if (rawYangMenentukan.includes('tenaga kes') || rawYangMenentukan.includes('nakes') || rawYangMenentukan === '3') kodeYangMenentukan = '3';
  else if (rawYangMenentukan.includes('polisi') || rawYangMenentukan.includes('kepolisian') || rawYangMenentukan === '4') kodeYangMenentukan = '4';
  else if (rawYangMenentukan.includes('lain') || rawYangMenentukan === '5') kodeYangMenentukan = '5';

  const tempatKelahiran = (
    fValues['form_tempat_kelahiran'] ||
    fValues['birthPlace'] ||
    fValues['form_nama_tempat_dilahirkan'] ||
    namaKab
  ).toString();

  // --- 2. DATA IBU ---
  const isPemohonIbu = Boolean(vIndividu && vIndividu.jenis_kelamin?.toLowerCase() === 'perempuan');
  const nikIbu = String(
    fValues['form_nik_ibu'] ||
    fValues['motherNik'] ||
    fValues['nik_ibu'] ||
    (isPemohonIbu ? (vIndividu ? vIndividu.nik || '' : '') : anyIndividu?.nik_ibu || '')
  );

  const namaIbu = String(
    fValues['form_nama_ibu'] ||
    fValues['motherName'] ||
    fValues['nama_ibu'] ||
    (isPemohonIbu ? (vIndividu ? vIndividu.nama || '' : '') : (vIndividu ? vIndividu.nama_ibu || '' : ''))
  );

  const rawTglLahirIbu = String(
    fValues['form_tanggal_lahir_ibu'] ||
    fValues['motherBirthDate'] ||
    fValues['tgl_lahir_ibu'] ||
    (isPemohonIbu && vIndividu ? vIndividu.tanggal_lahir || '' : '')
  );
  const dateIbu = parseDateParts(rawTglLahirIbu);
  const umurIbu = String(
    fValues['form_umur_ibu'] ||
    fValues['motherAge'] ||
    calculateAgeFromBirthDate(rawTglLahirIbu) ||
    '30'
  ).replace(/[^0-9]/g, '');

  const pekerjaanIbu = String(
    fValues['form_pekerjaan_ibu'] ||
    fValues['motherJob'] ||
    fValues['pekerjaan_ibu'] ||
    (isPemohonIbu && vIndividu ? vIndividu.pekerjaan || '' : 'Mengurus Rumah Tangga')
  );

  const desaIbu = fValues['form_desa_ibu'] || (isPemohonIbu ? anyIndividu?.desa || namaDesa : namaDesa);
  const kecIbu = fValues['form_kecamatan_ibu'] || (isPemohonIbu ? anyIndividu?.kecamatan || namaKec : namaKec);
  const kabIbu = fValues['form_kabupaten_ibu'] || (isPemohonIbu ? anyIndividu?.kabupaten || namaKab : namaKab);
  const provIbu = fValues['form_provinsi_ibu'] || (isPemohonIbu ? anyIndividu?.provinsi || namaProv : namaProv);

  const kewarganegaraanIbu = String(fValues['form_kewarganegaraan_ibu'] || '1').toUpperCase().includes('WNA') ? '2' : '1';
  const kebangsaanIbu = fValues['form_kebangsaan_ibu'] || 'Indonesia';

  const rawTglNikah = fValues['form_tgl_nikah'] || fValues['marriageDate'] || fValues['tgl_perkawinan'] || '';
  const dateNikah = parseDateParts(rawTglNikah);

  // --- 3. DATA AYAH ---
  const isPemohonAyah = Boolean(vIndividu && vIndividu.jenis_kelamin?.toLowerCase() === 'laki-laki');
  const nikAyah = String(
    fValues['form_nik_ayah'] ||
    fValues['fatherNik'] ||
    fValues['nik_ayah'] ||
    (isPemohonAyah ? (vIndividu ? vIndividu.nik || '' : '') : anyIndividu?.nik_ayah || '')
  );

  const namaAyah = String(
    fValues['form_nama_ayah'] ||
    fValues['fatherName'] ||
    fValues['nama_ayah'] ||
    (isPemohonAyah ? (vIndividu ? vIndividu.nama || '' : '') : (vIndividu ? vIndividu.nama_ayah || '' : ''))
  );

  const rawTglLahirAyah = String(
    fValues['form_tanggal_lahir_ayah'] ||
    fValues['fatherBirthDate'] ||
    fValues['tgl_lahir_ayah'] ||
    (isPemohonAyah && vIndividu ? vIndividu.tanggal_lahir || '' : '')
  );
  const dateAyah = parseDateParts(rawTglLahirAyah);
  const umurAyah = String(
    fValues['form_umur_ayah'] ||
    fValues['fatherAge'] ||
    calculateAgeFromBirthDate(rawTglLahirAyah) ||
    '34'
  ).replace(/[^0-9]/g, '');

  const pekerjaanAyah = String(
    fValues['form_pekerjaan_ayah'] ||
    fValues['fatherJob'] ||
    fValues['pekerjaan_ayah'] ||
    (isPemohonAyah && vIndividu ? vIndividu.pekerjaan || '' : 'Wiraswasta')
  );

  const desaAyah = fValues['form_desa_ayah'] || (isPemohonAyah ? anyIndividu?.desa || namaDesa : namaDesa);
  const kecAyah = fValues['form_kecamatan_ayah'] || (isPemohonAyah ? anyIndividu?.kecamatan || namaKec : namaKec);
  const kabAyah = fValues['form_kabupaten_ayah'] || (isPemohonAyah ? anyIndividu?.kabupaten || namaKab : namaKab);
  const provAyah = fValues['form_provinsi_ayah'] || (isPemohonAyah ? anyIndividu?.provinsi || namaProv : namaProv);

  const kewarganegaraanAyah = String(fValues['form_kewarganegaraan_ayah'] || '1').toUpperCase().includes('WNA') ? '2' : '1';
  const kebangsaanAyah = fValues['form_kebangsaan_ayah'] || 'Indonesia';

  // --- 4. DATA PELAPOR ---
  const nikPelapor = String(
    fValues['form_nik_pelapor'] ||
    fValues['reporterNik'] ||
    fValues['nik_pelapor'] ||
    vIndividu?.nik ||
    ''
  );

  const namaPelapor = String(
    fValues['form_nama_pelapor'] ||
    fValues['reporterName'] ||
    fValues['nama_pelapor'] ||
    vIndividu?.nama ||
    ''
  );

  const umurPelapor = String(
    fValues['form_umur_pelapor'] ||
    fValues['reporterAge'] ||
    anyIndividu?.umur ||
    (vIndividu?.tanggal_lahir ? calculateAgeFromBirthDate(vIndividu.tanggal_lahir) : '35')
  ).replace(/[^0-9]/g, '');

  const rawJkPelapor = String(
    fValues['form_sex_pelapor'] ||
    fValues['reporterGender'] ||
    vIndividu?.jenis_kelamin ||
    'Laki-laki'
  ).toLowerCase();
  const jkPelaporCode = rawJkPelapor.includes('perempuan') ? '2' : '1';

  const pekerjaanPelapor = String(
    fValues['form_pekerjaan_pelapor'] ||
    fValues['reporterJob'] ||
    vIndividu?.pekerjaan ||
    'Wiraswasta'
  );

  const desaPelapor = fValues['form_desa_pelapor'] || anyIndividu?.desa || namaDesa;
  const kecPelapor = fValues['form_kecamatan_pelapor'] || anyIndividu?.kecamatan || namaKec;
  const kabPelapor = fValues['form_kabupaten_pelapor'] || anyIndividu?.kabupaten || namaKab;
  const provPelapor = fValues['form_provinsi_pelapor'] || anyIndividu?.provinsi || namaProv;

  // =========================================================================
  // FORMULIR F-2.09 DESAIN SATU LEMBAR PORTRAIT RESMI DISDUKCAPIL
  // =========================================================================
  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6pt; line-height: 1.1; color: #000; width: 100%; box-sizing: border-box; padding: 0 1px;">
  <!-- HEADER & KODE -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 2px;">
    <tr>
      <!-- Kiri: Identitas Pemda -->
      <td style="vertical-align: top; width: 42%;">
        <table style="font-size: 5.8pt; font-family: Arial, sans-serif; line-height: 1.15; border-collapse: collapse;">
          <tr>
            <td style="width: 120px; padding: 0.2px 0;">Pemerintah Desa/Kelurahan</td>
            <td style="width: 6px;">:</td>
            <td style="font-weight: 600;">${namaDesa}</td>
          </tr>
          <tr>
            <td style="padding: 0.2px 0;">Kecamatan</td>
            <td>:</td>
            <td style="font-weight: 600;">${namaKec}</td>
          </tr>
          <tr>
            <td style="padding: 0.2px 0;">Kabupaten/Kota</td>
            <td>:</td>
            <td style="font-weight: 600;">${namaKab}</td>
          </tr>
          <tr>
            <td style="padding: 0.2px 0;">Kode Wilayah</td>
            <td>:</td>
            <td>${renderBoxedDigits(rawKodeWil, 10, '9.5px', '11px', '5.8pt')}</td>
          </tr>
        </table>
      </td>

      <!-- Tengah: Keterangan Lembar -->
      <td style="vertical-align: top; width: 38%; font-size: 5.4pt; font-family: Arial, sans-serif; line-height: 1.15; padding-left: 6px;">
        <table style="border-collapse: collapse;">
          <tr>
            <td style="vertical-align: top; font-weight: bold; padding-right: 3px;">Ket :</td>
            <td style="padding-right: 3px; font-weight: 600;">Lembar 1</td>
            <td>: Untuk yang bersangkutan</td>
          </tr>
          <tr>
            <td></td>
            <td style="padding-right: 3px; font-weight: 600;">Lembar 2</td>
            <td>: UPTD/Instansi Pelaksana</td>
          </tr>
          <tr>
            <td></td>
            <td style="padding-right: 3px; font-weight: 600;">Lembar 3</td>
            <td>: Desa/Kelurahan</td>
          </tr>
          <tr>
            <td></td>
            <td style="padding-right: 3px; font-weight: 600;">Lembar 4</td>
            <td>: Kecamatan</td>
          </tr>
        </table>
      </td>

      <!-- Kanan: Box Kode . F-2.09 -->
      <td style="vertical-align: top; width: 20%; text-align: right;">
        <div style="display: inline-block; border: 1.5px solid #000; padding: 2px 10px; font-size: 8.5pt; font-weight: bold; font-family: Arial, sans-serif; text-align: center; letter-spacing: 0.5px;">
          Kode . F-2.09
        </div>
      </td>
    </tr>
  </table>

  <!-- JUDUL FORMULIR -->
  <div style="text-align: center; margin-top: 3px; margin-bottom: 3px;">
    <div style="font-weight: bold; font-size: 8pt; font-family: Arial, sans-serif; letter-spacing: 0.5px;">
      SURAT KETERANGAN LAHIR MATI
    </div>
    <div style="font-weight: bold; font-size: 7pt; font-family: Arial, sans-serif;">
      (WARGA NEGARA INDONESIA)
    </div>
    <div style="font-size: 6.5pt; font-family: Arial, sans-serif; margin-top: 1px;">
      No. : ${nomorSurat ? nomorSurat : '................................................'}
    </div>
  </div>

  <!-- DATA KEPALA KELUARGA & KK -->
  <table style="width: 100%; font-size: 5.8pt; font-family: Arial, sans-serif; border-collapse: collapse; margin-bottom: 2px;">
    <tr>
      <td style="width: 130px; padding: 0.4px 0;">Nama Kepala Keluarga</td>
      <td style="width: 8px;">:</td>
      <td>${renderCharBoxes(namaKepalaKk, 33, '8.8px', '11px')}</td>
    </tr>
    <tr>
      <td style="padding: 0.4px 0;">Nomor Kartu Keluarga</td>
      <td>:</td>
      <td>${renderBoxedDigits(noKk, 16, '9.8px', '11px')}</td>
    </tr>
  </table>

  <!-- TABEL UTAMA 4 SEKSI BER-BORDER -->
  <div style="border: 1px solid #000; padding: 0; margin-top: 1px;">
    
    <!-- 1. YANG LAHIR MATI -->
    <div style="border-bottom: 1px solid #000; padding: 2px 3px;">
      <div style="font-weight: bold; font-size: 6.2pt; font-family: Arial, sans-serif; margin-bottom: 1.5px;">
        YANG LAHIR MATI
      </div>
      <table style="width: 100%; font-size: 5.6pt; font-family: Arial, sans-serif; border-collapse: collapse;">
        <tr>
          <td style="width: 130px; padding: 0.3px 0;">1. &nbsp;Lamanya dalam kandungan</td>
          <td style="width: 8px;">:</td>
          <td>
            ${renderOptionSquare(lamaKandungan)}
            <span style="vertical-align: middle;">Bulan</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">2. &nbsp;Jenis kelamin</td>
          <td>:</td>
          <td>
            ${renderOptionSquare(jkBayiCode)}
            <span style="vertical-align: middle;">1. Laki-Laki &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2. Perempuan</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">3. &nbsp;Tanggal lahir</td>
          <td>:</td>
          <td>
            <span style="vertical-align: middle; margin-right: 2px;">Tgl</span>
            ${renderBoxedDigits(dateBayi.tgl, 2, '9.5px', '11px')}
            <span style="vertical-align: middle; margin: 0 2px 0 6px;">Bln</span>
            ${renderBoxedDigits(dateBayi.bln, 2, '9.5px', '11px')}
            <span style="vertical-align: middle; margin: 0 2px 0 6px;">Thn</span>
            ${renderBoxedDigits(dateBayi.thn, 4, '9.5px', '11px')}
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">4. &nbsp;Jenis kelahiran</td>
          <td>:</td>
          <td>
            ${renderOptionSquare(kodeJenisKelahiran)}
            <span style="vertical-align: middle;">1. Tunggal &nbsp;&nbsp;&nbsp;&nbsp; 2. Kembar 2 &nbsp;&nbsp;&nbsp;&nbsp; 3. Kembar 3 &nbsp;&nbsp;&nbsp;&nbsp; 4. Kembar 4 &nbsp;&nbsp;&nbsp;&nbsp; 5. Lainnya</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">5. &nbsp;Anak ini lahir yang ke</td>
          <td>:</td>
          <td>
            ${renderOptionSquare(rawAnakKe)}
            <span style="vertical-align: middle;">1. Kesatu &nbsp;&nbsp;&nbsp;&nbsp; 2. Kedua &nbsp;&nbsp;&nbsp;&nbsp; 3. Ketiga &nbsp;&nbsp;&nbsp;&nbsp; 4. ........</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">6. &nbsp;Tempat dilahirkan</td>
          <td>:</td>
          <td>
            ${renderOptionSquare(kodeTempatLahir)}
            <span style="vertical-align: middle;">1. RS/RB &nbsp;&nbsp;&nbsp;&nbsp; 2. Puskesmas &nbsp;&nbsp;&nbsp;&nbsp; 3. Polindes &nbsp;&nbsp;&nbsp;&nbsp; 4. Rumah &nbsp;&nbsp;&nbsp;&nbsp; 5. Lainnya</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">7. &nbsp;Penolong kelahiran</td>
          <td>:</td>
          <td>
            ${renderOptionSquare(kodePenolong)}
            <span style="vertical-align: middle;">1. Dokter &nbsp;&nbsp;&nbsp;&nbsp; 2. Bidan/Perawat &nbsp;&nbsp;&nbsp;&nbsp; 3. Dukun &nbsp;&nbsp;&nbsp;&nbsp; 4. Lainnya</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">8. &nbsp;Sebab lahir mati</td>
          <td>:</td>
          <td>
            <span style="display: inline-block; border-bottom: 1px dotted #000; min-width: 260px; font-weight: 500; padding-bottom: 0.5px;">${sebabLahirMati || '&nbsp;'}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">9. &nbsp;Yang menentukan</td>
          <td>:</td>
          <td>
            ${renderOptionSquare(kodeYangMenentukan)}
            <span style="vertical-align: middle;">1. Dokter &nbsp;&nbsp;&nbsp;&nbsp; 2. Bidan/Perawat &nbsp;&nbsp;&nbsp;&nbsp; 3. Tenaga Kes. &nbsp;&nbsp;&nbsp;&nbsp; 4. Kepolisian &nbsp;&nbsp;&nbsp;&nbsp; 5. Lainnya</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">10. Tempat kelahiran</td>
          <td>:</td>
          <td>
            <span style="display: inline-block; border-bottom: 1px dotted #000; min-width: 260px; font-weight: 500; padding-bottom: 0.5px;">${tempatKelahiran || '&nbsp;'}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- 2. IBU -->
    <div style="border-bottom: 1px solid #000; padding: 2px 3px;">
      <div style="font-weight: bold; font-size: 6.2pt; font-family: Arial, sans-serif; margin-bottom: 1.5px;">
        IBU
      </div>
      <table style="width: 100%; font-size: 5.6pt; font-family: Arial, sans-serif; border-collapse: collapse;">
        <tr>
          <td style="width: 130px; padding: 0.3px 0;">1. &nbsp;NIK</td>
          <td style="width: 8px;">:</td>
          <td>${renderBoxedDigits(nikIbu, 16, '9.8px', '11px')}</td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">2. &nbsp;Nama lengkap</td>
          <td>:</td>
          <td>${renderCharBoxes(namaIbu, 33, '8.8px', '11px')}</td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">3. &nbsp;Tanggal Lahir / Umur</td>
          <td>:</td>
          <td>
            <span style="vertical-align: middle; margin-right: 2px;">Tgl</span>
            ${renderBoxedDigits(dateIbu.tgl, 2, '9.5px', '11px')}
            <span style="vertical-align: middle; margin: 0 2px 0 6px;">Bln</span>
            ${renderBoxedDigits(dateIbu.bln, 2, '9.5px', '11px')}
            <span style="vertical-align: middle; margin: 0 2px 0 6px;">Thn</span>
            ${renderBoxedDigits(dateIbu.thn, 4, '9.5px', '11px')}
            <span style="vertical-align: middle; margin-left: 10px; margin-right: 2px;">Umur</span>
            ${renderBoxedDigits(umurIbu, 2, '9.5px', '11px')}
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">4. &nbsp;Pekerjaan</td>
          <td>:</td>
          <td>
            <span style="display: inline-block; border-bottom: 1px dotted #000; min-width: 220px; font-weight: 500;">${pekerjaanIbu || '&nbsp;'}</span>
          </td>
        </tr>
        <tr>
          <td style="vertical-align: top; padding: 0.3px 0;">5. &nbsp;Alamat</td>
          <td style="vertical-align: top;">:</td>
          <td>
            ${renderAddressGrid(desaIbu, kecIbu, kabIbu, provIbu)}
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">6. &nbsp;Kewarganegaraan</td>
          <td>:</td>
          <td>
            ${renderOptionSquare(kewarganegaraanIbu)}
            <span style="vertical-align: middle;">1. WNI &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2. WNA</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">7. &nbsp;Kebangsaan</td>
          <td>:</td>
          <td>
            <span style="display: inline-block; border-bottom: 1px dotted #000; min-width: 180px; font-weight: 500;">${kebangsaanIbu || '&nbsp;'}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">8. &nbsp;Tgl Pencatatan Perkawinan</td>
          <td>:</td>
          <td>
            <span style="vertical-align: middle; margin-right: 2px;">Tgl</span>
            ${renderBoxedDigits(dateNikah.tgl, 2, '9.5px', '11px')}
            <span style="vertical-align: middle; margin: 0 2px 0 6px;">Bln</span>
            ${renderBoxedDigits(dateNikah.bln, 2, '9.5px', '11px')}
            <span style="vertical-align: middle; margin: 0 2px 0 6px;">Thn</span>
            ${renderBoxedDigits(dateNikah.thn, 4, '9.5px', '11px')}
          </td>
        </tr>
      </table>
    </div>

    <!-- 3. AYAH -->
    <div style="border-bottom: 1px solid #000; padding: 2px 3px;">
      <div style="font-weight: bold; font-size: 6.2pt; font-family: Arial, sans-serif; margin-bottom: 1.5px;">
        AYAH
      </div>
      <table style="width: 100%; font-size: 5.6pt; font-family: Arial, sans-serif; border-collapse: collapse;">
        <tr>
          <td style="width: 130px; padding: 0.3px 0;">1. &nbsp;NIK</td>
          <td style="width: 8px;">:</td>
          <td>${renderBoxedDigits(nikAyah, 16, '9.8px', '11px')}</td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">2. &nbsp;Nama lengkap</td>
          <td>:</td>
          <td>${renderCharBoxes(namaAyah, 33, '8.8px', '11px')}</td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">3. &nbsp;Tanggal Lahir / Umur</td>
          <td>:</td>
          <td>
            <span style="vertical-align: middle; margin-right: 2px;">Tgl</span>
            ${renderBoxedDigits(dateAyah.tgl, 2, '9.5px', '11px')}
            <span style="vertical-align: middle; margin: 0 2px 0 6px;">Bln</span>
            ${renderBoxedDigits(dateAyah.bln, 2, '9.5px', '11px')}
            <span style="vertical-align: middle; margin: 0 2px 0 6px;">Thn</span>
            ${renderBoxedDigits(dateAyah.thn, 4, '9.5px', '11px')}
            <span style="vertical-align: middle; margin-left: 10px; margin-right: 2px;">Umur</span>
            ${renderBoxedDigits(umurAyah, 2, '9.5px', '11px')}
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">4. &nbsp;Pekerjaan</td>
          <td>:</td>
          <td>
            <span style="display: inline-block; border-bottom: 1px dotted #000; min-width: 220px; font-weight: 500;">${pekerjaanAyah || '&nbsp;'}</span>
          </td>
        </tr>
        <tr>
          <td style="vertical-align: top; padding: 0.3px 0;">5. &nbsp;Alamat</td>
          <td style="vertical-align: top;">:</td>
          <td>
            ${renderAddressGrid(desaAyah, kecAyah, kabAyah, provAyah)}
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">6. &nbsp;Kewarganegaraan</td>
          <td>:</td>
          <td>
            ${renderOptionSquare(kewarganegaraanAyah)}
            <span style="vertical-align: middle;">1. WNI &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2. WNA</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">7. &nbsp;Kebangsaan</td>
          <td>:</td>
          <td>
            <span style="display: inline-block; border-bottom: 1px dotted #000; min-width: 180px; font-weight: 500;">${kebangsaanAyah || '&nbsp;'}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- 4. PELAPOR -->
    <div style="padding: 2px 3px;">
      <div style="font-weight: bold; font-size: 6.2pt; font-family: Arial, sans-serif; margin-bottom: 1.5px;">
        PELAPOR
      </div>
      <table style="width: 100%; font-size: 5.6pt; font-family: Arial, sans-serif; border-collapse: collapse;">
        <tr>
          <td style="width: 130px; padding: 0.3px 0;">1. &nbsp;NIK</td>
          <td style="width: 8px;">:</td>
          <td>${renderBoxedDigits(nikPelapor, 16, '9.8px', '11px')}</td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">2. &nbsp;Nama lengkap</td>
          <td>:</td>
          <td>${renderCharBoxes(namaPelapor, 33, '8.8px', '11px')}</td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">3. &nbsp;Umur</td>
          <td>:</td>
          <td>
            ${renderBoxedDigits(umurPelapor, 2, '9.5px', '11px')}
            <span style="vertical-align: middle; margin-left: 4px;">Tahun</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">4. &nbsp;Jenis Kelamin</td>
          <td>:</td>
          <td>
            ${renderOptionSquare(jkPelaporCode)}
            <span style="vertical-align: middle;">1. Laki-laki &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2. Perempuan</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.3px 0;">5. &nbsp;Pekerjaan</td>
          <td>:</td>
          <td>
            <span style="display: inline-block; border-bottom: 1px dotted #000; min-width: 220px; font-weight: 500;">${pekerjaanPelapor || '&nbsp;'}</span>
          </td>
        </tr>
        <tr>
          <td style="vertical-align: top; padding: 0.3px 0;">6. &nbsp;Alamat</td>
          <td style="vertical-align: top;">:</td>
          <td>
            ${renderAddressGrid(desaPelapor, kecPelapor, kabPelapor, provPelapor)}
          </td>
        </tr>
      </table>
    </div>

  </div>

  <!-- TANDA TANGAN & FOOTER -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 6px;">
    <tr>
      <td style="width: 55%;"></td>
      <td style="width: 45%; text-align: center; font-size: 6pt; font-family: Arial, sans-serif; line-height: 1.25;">
        <div>${namaDesa}, ${tanggalSurat ? tanggalSurat : '.................................... 20....'}</div>
        <div style="margin-top: 1px;">an. Kepala Dinas Kependudukan</div>
        <div>dan Pencatatan Sipil Kab/Kota</div>
        <div style="font-weight: 600;">Kepala Desa/Lurah</div>
        <div style="height: 38px;"></div>
        <div style="font-weight: bold; text-decoration: underline;">( ${namaKades} )</div>
      </td>
    </tr>
  </table>

  <!-- NOMOR HALAMAN POJOK KANAN BAWAH -->
  <div style="text-align: right; font-size: 7pt; font-family: Arial, sans-serif; margin-top: 2px; padding-right: 5px;">
    237
  </div>
</div>`;
}
