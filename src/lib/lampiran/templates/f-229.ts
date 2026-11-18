import type { OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildF229PortraitHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};

  const namaDesa = ctx?.namaDesa || 'Sampeldes';
  const namaKec = ctx?.namaKecamatan || 'Gandrungmangu';
  const namaKab = ctx?.namaKabupaten || 'Cilacap';
  const namaProv = ctx?.namaProvinsi || 'Jawa Tengah';
  const rawKodeWil = (ctx?.kodeDesa || '33.01.10.2011').replace(/[^0-9]/g, '');

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
    <table style="width: 100%; border-collapse: collapse; font-size: 5.6pt; border: 1px solid #000; margin-top: 1px; line-height: 1.1;" border="1">
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

  const renderAddressGridCompact = (desa: string, kec: string, kab: string) => `
    <table style="width: 100%; border-collapse: collapse; font-size: 5.2pt; border: 1px solid #000; margin-top: 1px; line-height: 1.05;" border="1">
      <tr>
        <td style="width: 65px; padding: 0.5px 2px; border: 1px solid #000;">Desa/Kel.</td>
        <td style="padding: 0.5px 2px; border: 1px solid #000; font-weight: 500;">${desa}</td>
        <td style="width: 55px; padding: 0.5px 2px; border: 1px solid #000;">Kec.</td>
        <td style="padding: 0.5px 2px; border: 1px solid #000; font-weight: 500;">${kec}</td>
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

  function parseTimeParts(timeStr?: string) {
    if (!timeStr) return { jam: '08', menit: '35' };
    const clean = String(timeStr).replace(/[^0-9:]/g, '');
    const parts = clean.split(':');
    return {
      jam: parts[0]?.padStart(2, '0') || '08',
      menit: parts[1]?.padStart(2, '0') || '35',
    };
  }

  const getAgamaCode = (agama?: string) => {
    const a = (agama || '').toLowerCase();
    if (a.includes('islam')) return '01';
    if (a.includes('kristen') || a.includes('protestan')) return '02';
    if (a.includes('katolik')) return '03';
    if (a.includes('hindu')) return '04';
    if (a.includes('buddha') || a.includes('budha')) return '05';
    if (a.includes('konghucu')) return '06';
    return '01';
  };

  const getPekerjaanCode = (pek?: string) => {
    if (!pek) return '01';
    const digits = pek.replace(/[^0-9]/g, '');
    if (digits.length >= 2) return digits.slice(0, 2);
    const p = pek.toLowerCase();
    if (p.includes('petani') || p.includes('kebun')) return '06';
    if (p.includes('swasta') || p.includes('wiraswasta') || p.includes('dagang')) return '05';
    if (p.includes('rumah tangga') || p.includes('irt')) return '03';
    if (p.includes('pns') || p.includes('asn') || p.includes('perangkat')) return '02';
    if (p.includes('pelajar') || p.includes('mahasiswa')) return '04';
    return '01';
  };

  function calculateAge(dateStr?: string, fallbackAge?: string): string {
    if (fallbackAge && String(fallbackAge).trim() && String(fallbackAge).trim() !== '-') {
      return String(fallbackAge).replace(/[^0-9]/g, '') || '0';
    }
    if (!dateStr) return '';
    try {
      const parts = parseDateParts(dateStr);
      if (parts.thn && parts.bln && parts.tgl) {
        const d = new Date(parseInt(parts.thn, 10), parseInt(parts.bln, 10) - 1, parseInt(parts.tgl, 10));
        const today = new Date();
        let age = today.getFullYear() - d.getFullYear();
        const m = today.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
        return age >= 0 ? String(age) : '';
      }
    } catch {
      // ignore
    }
    return '';
  }

  // --- DATA KEPALA KELUARGA & NO KK ---
  const validNoKkCandidate = [
    fValues['kkNumber'],
    fValues['noKk'],
    fValues['no_kk'],
    fValues['form_no_kk'],
    vIndividu?.no_kk,
  ].find((v) => v && String(v).replace(/[^0-9]/g, '').length >= 10);
  const noKk = validNoKkCandidate ? String(validNoKkCandidate).replace(/[^0-9]/g, '') : (vIndividu?.no_kk || '3301102508120005');
  const namaKepalaKk = fValues['kkHead'] || fValues['form_kepala_kk'] || fValues['kepalaKk'] || vIndividu?.kepala_kk || vIndividu?.nama || 'TUKIMAN';

  // --- DATA JENAZAH ---
  const nikJenazah = fValues['nik'] || fValues['nik_jenazah'] || fValues['form_nik_jenazah'] || vIndividu?.nik || '3301101503450002';
  const namaJenazah = fValues['name'] || fValues['fullName'] || fValues['form_nama_jenazah'] || fValues['nama_jenazah'] || vIndividu?.nama || 'SITI AMINAH';
  const rawJk = (fValues['gender'] || fValues['form_sex_jenazah'] || fValues['sex_jenazah'] || vIndividu?.jenis_kelamin || 'P').toUpperCase();
  const jkCode = rawJk.startsWith('L') || rawJk === '1' ? '1' : '2';
  const tempatLahirJenazah = fValues['placeOfBirth'] || fValues['birthPlace'] || fValues['form_tempat_lahir_jenazah'] || vIndividu?.tempat_lahir || namaKab;
  const tglLahirJenazahRaw = fValues['birthDate'] || fValues['dateOfBirth'] || fValues['form_tanggal_lahir_jenazah'] || vIndividu?.tanggal_lahir || '1955-03-15';
  const tglLahirJ = parseDateParts(tglLahirJenazahRaw);
  const agamaJenazah = fValues['religion'] || fValues['agama'] || fValues['form_agama_jenazah'] || vIndividu?.agama || 'Islam';
  const agamaJenazahCode = getAgamaCode(agamaJenazah);
  const pekerjaanJenazah = fValues['occupation'] || fValues['job'] || fValues['pekerjaan'] || fValues['form_pekerjaan_jenazah'] || vIndividu?.pekerjaan || 'Mengurus Rumah Tangga';
  const pekerjaanJenazahCode = getPekerjaanCode(pekerjaanJenazah);
  const desaJenazah = vIndividu?.alamat || fValues['address'] || (vIndividu?.dusun ? `${vIndividu.dusun}, ${namaDesa}` : namaDesa);

  const anakKe = fValues['anakKe'] || fValues['form_anak_ke'] || fValues['anak_ke'] || '1';
  const tglMatiRaw = fValues['deathDate'] || fValues['tanggal_kematian'] || fValues['form_tanggal_kematian'] || fValues['tanggal_meninggal'] || fValues['form_tanggal_meninggal'] || '';
  const tglMati = parseDateParts(tglMatiRaw);
  const jamMatiRaw = fValues['deathTime'] || fValues['jam_kematian'] || fValues['form_jam_kematian'] || fValues['pukul_meninggal'] || '08:35';
  const timeMati = parseTimeParts(jamMatiRaw);

  const sebabRaw = (fValues['deathCause'] || fValues['sebab_kematian'] || fValues['form_sebab_kematian'] || 'Sakit Biasa/Tua').toLowerCase();
  let sebabCode = '1';
  if (sebabRaw.includes('2') || sebabRaw.includes('wabah') || sebabRaw.includes('covid')) sebabCode = '2';
  else if (sebabRaw.includes('3') || sebabRaw.includes('celaka') || sebabRaw.includes('tabrak')) sebabCode = '3';
  else if (sebabRaw.includes('4') || (sebabRaw.includes('kriminal') && !sebabRaw.includes('diri'))) sebabCode = '4';
  else if (sebabRaw.includes('5') || sebabRaw.includes('bunuh diri')) sebabCode = '5';
  else if (sebabRaw.includes('6') || sebabRaw.includes('lain')) sebabCode = '6';

  const tempatMatiRaw = (fValues['deathLocation'] || fValues['tempat_kematian'] || fValues['form_tempat_kematian'] || '').toLowerCase();
  let tempatMatiCode = '1';
  if (tempatMatiRaw.includes('rs') || tempatMatiRaw.includes('rumah sakit')) tempatMatiCode = '1';
  else if (tempatMatiRaw.includes('rumah') && !tempatMatiRaw.includes('sakit')) tempatMatiCode = '2';
  else if (tempatMatiRaw.length > 0) tempatMatiCode = '3';

  const yangMenerangkanRaw = (fValues['whoExplains'] || fValues['yang_menerangkan'] || fValues['form_yang_menerangkan'] || 'Dokter / Puskesmas').toLowerCase();
  let yangMenerangkanCode = '1';
  if (yangMenerangkanRaw.includes('dokter')) yangMenerangkanCode = '1';
  else if (yangMenerangkanRaw.includes('nakes') || yangMenerangkanRaw.includes('perawat') || yangMenerangkanRaw.includes('bidan')) yangMenerangkanCode = '2';
  else if (yangMenerangkanRaw.includes('polisi') || yangMenerangkanRaw.includes('polsek')) yangMenerangkanCode = '3';
  else if (yangMenerangkanRaw.length > 0) yangMenerangkanCode = '4';

  // --- DATA AYAH ---
  const nikAyah = fValues['fatherNik'] || fValues['nik_ayah'] || fValues['form_nik_ayah'] || vIndividu?.nik_ayah || '';
  const namaAyah = fValues['fatherName'] || fValues['nama_ayah'] || fValues['form_nama_ayah'] || vIndividu?.nama_ayah || '-';
  const tglLahirAyah = parseDateParts(fValues['fatherBirthDate'] || fValues['form_tgl_lahir_ayah'] || '');
  const umurAyah = calculateAge(fValues['fatherBirthDate'] || fValues['form_tgl_lahir_ayah'], fValues['form_umur_ayah'] || fValues['umur_ayah'] || '');
  const pekerjaanAyah = fValues['fatherJob'] || fValues['pekerjaan_ayah'] || fValues['form_pekerjaan_ayah'] || 'Petani / Pekebun';
  const pekerjaanAyahCode = getPekerjaanCode(pekerjaanAyah);

  // --- DATA IBU ---
  const nikIbu = fValues['motherNik'] || fValues['nik_ibu'] || fValues['form_nik_ibu'] || vIndividu?.nik_ibu || '';
  const namaIbu = fValues['motherName'] || fValues['nama_ibu'] || fValues['form_nama_ibu'] || vIndividu?.nama_ibu || '-';
  const tglLahirIbu = parseDateParts(fValues['motherBirthDate'] || fValues['form_tgl_lahir_ibu'] || '');
  const umurIbu = calculateAge(fValues['motherBirthDate'] || fValues['form_tgl_lahir_ibu'], fValues['form_umur_ibu'] || fValues['umur_ibu'] || '');
  const pekerjaanIbu = fValues['motherJob'] || fValues['pekerjaan_ibu'] || fValues['form_pekerjaan_ibu'] || 'Mengurus Rumah Tangga';
  const pekerjaanIbuCode = getPekerjaanCode(pekerjaanIbu);

  // --- DATA PELAPOR ---
  const nikPelapor = fValues['reporterNik'] || fValues['nik_pelapor'] || fValues['form_nik_pelapor'] || '';
  const namaPelapor = fValues['reporterName'] || fValues['nama_pelapor'] || fValues['form_nama_pelapor'] || '';
  const umurPelapor = calculateAge(fValues['reporterBirthDate'] || fValues['form_tgl_lahir_pelapor'], fValues['form_umur_pelapor'] || fValues['umur_pelapor'] || '');
  const rawJkPelapor = (fValues['reporterGender'] || fValues['form_sex_pelapor'] || fValues['sex_pelapor'] || 'L').toUpperCase();
  const jkPelaporCode = rawJkPelapor.startsWith('P') || rawJkPelapor === '2' ? '2' : '1';
  const pekerjaanPelapor = fValues['reporterJob'] || fValues['pekerjaan_pelapor'] || fValues['form_pekerjaan_pelapor'] || 'Wiraswasta';
  const pekerjaanPelaporCode = getPekerjaanCode(pekerjaanPelapor);

  // --- DATA SAKSI I ---
  const nikSaksi1 = fValues['witness1Nik'] || fValues['nik_saksi_1'] || fValues['form_nik_saksi_i'] || '';
  const namaSaksi1 = fValues['witness1Name'] || fValues['nama_saksi_1'] || fValues['form_nama_saksi_i'] || '';
  const tglLahirS1 = parseDateParts(fValues['witness1BirthDate'] || fValues['form_tgl_lahir_saksi_i'] || '');
  const umurSaksi1 = calculateAge(fValues['witness1BirthDate'] || fValues['form_tgl_lahir_saksi_i'], fValues['form_umur_saksi_i'] || fValues['umur_saksi_1'] || '');
  const pekerjaanSaksi1 = fValues['witness1Job'] || fValues['pekerjaan_saksi_1'] || fValues['form_pekerjaan_saksi_i'] || 'Wiraswasta';
  const pekerjaanSaksi1Code = getPekerjaanCode(pekerjaanSaksi1);

  // --- DATA SAKSI II ---
  const nikSaksi2 = fValues['witness2Nik'] || fValues['nik_saksi_2'] || fValues['form_nik_saksi_ii'] || '';
  const namaSaksi2 = fValues['witness2Name'] || fValues['nama_saksi_2'] || fValues['form_nama_saksi_ii'] || '';
  const tglLahirS2 = parseDateParts(fValues['witness2BirthDate'] || fValues['form_tgl_lahir_saksi_ii'] || '');
  const umurSaksi2 = calculateAge(fValues['witness2BirthDate'] || fValues['form_tgl_lahir_saksi_ii'], fValues['form_umur_saksi_ii'] || fValues['umur_saksi_2'] || '');
  const pekerjaanSaksi2 = fValues['witness2Job'] || fValues['pekerjaan_saksi_2'] || fValues['form_pekerjaan_saksi_ii'] || 'Wiraswasta';
  const pekerjaanSaksi2Code = getPekerjaanCode(pekerjaanSaksi2);

  const namaKades = ctx?.namaPamong || ctx?.namaKepalaDesa || 'TUKIMAN';
  const tanggalSurat = ctx?.tanggalSurat || '';

  // =========================================================================
  // FORMULIR F-2.29 DESAIN SATU LEMBAR PORTRAIT (COMPACT DUKCAPIL RESMI)
  // =========================================================================
  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6pt; line-height: 1.12; color: #000; width: 100%; box-sizing: border-box; padding: 0 1px;">
  <!-- HEADER & KODE -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 2px;">
    <tr>
      <!-- Kiri: Identitas Pemda -->
      <td style="vertical-align: top; width: 44%;">
        <table style="font-size: 6pt; font-family: Arial, sans-serif; line-height: 1.2; border-collapse: collapse;">
          <tr>
            <td style="font-weight: bold; width: 125px; padding: 0.3px 0;">Pemerintah Desa/Kelurahan</td>
            <td style="width: 6px;">:</td>
            <td style="font-weight: 600;">${namaDesa}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 0.3px 0;">Kecamatan</td>
            <td>:</td>
            <td style="font-weight: 600;">${namaKec}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 0.3px 0;">Kabupaten/Kota</td>
            <td>:</td>
            <td style="font-weight: 600;">${namaKab}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 0.3px 0;">Kode Wilayah</td>
            <td>:</td>
            <td>${renderBoxedDigits(rawKodeWil, 10, '9.5px', '11px', '5.8pt')}</td>
          </tr>
        </table>
      </td>

      <!-- Tengah: Keterangan Lembar -->
      <td style="vertical-align: top; width: 40%; font-size: 5.5pt; font-family: Arial, sans-serif; line-height: 1.2; padding-left: 8px;">
        <table style="border-collapse: collapse;">
          <tr>
            <td style="vertical-align: top; font-weight: bold; padding-right: 3px;">Ket :</td>
            <td style="padding-right: 3px; font-weight: 600;">Lembar 1</td>
            <td>: UPTD/ Instansi</td>
          </tr>
          <tr>
            <td></td>
            <td style="padding-right: 3px; font-weight: 600;">Lembar 2</td>
            <td>: Untuk yang Bersangkutan</td>
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

      <!-- Kanan: Box F-2.29 -->
      <td style="vertical-align: top; width: 16%; text-align: right;">
        <div style="display: inline-block; border: 2px solid #000; background: #d9d9d9; padding: 1px 12px; font-size: 12pt; font-weight: bold; font-family: Arial, sans-serif; text-align: center; letter-spacing: 0.5px;">
          F-2.29
        </div>
      </td>
    </tr>
  </table>

  <!-- BANNER JUDUL -->
  <div style="width: 100%; border: 1px solid #000; background: #bdd7ee; text-align: center; font-weight: bold; font-size: 8.5pt; font-family: Arial, sans-serif; letter-spacing: 0.5px; padding: 1.5px 0; margin-bottom: 2px;">
    SURAT KETERANGAN KEMATIAN
  </div>

  <!-- KEPALA KELUARGA & NO KK -->
  <table style="width: 100%; font-size: 6pt; font-family: Arial, sans-serif; border-collapse: collapse; margin-bottom: 2px;">
    <tr>
      <td style="width: 130px; padding: 0.5px 0;">Nama Kepala Keluarga</td>
      <td style="width: 8px;">:</td>
      <td>${renderCharBoxes(namaKepalaKk, 33, '8.8px', '11px')}</td>
    </tr>
    <tr>
      <td style="padding: 0.5px 0;">Nomor Kartu Keluarga</td>
      <td>:</td>
      <td>${renderBoxedDigits(noKk, 16, '9.8px', '11px')}</td>
    </tr>
  </table>

  <!-- JENAZAH -->
  <div style="font-weight: bold; font-size: 6.5pt; font-family: Arial, sans-serif; margin-top: 1px; margin-bottom: 0.5px;">
    JENAZAH
  </div>
  <table style="width: 100%; font-size: 5.8pt; font-family: Arial, sans-serif; border-collapse: collapse;">
    <tr>
      <td style="width: 130px; padding: 0.4px 0;">1. &nbsp;NIK</td>
      <td style="width: 8px;">:</td>
      <td>${renderBoxedDigits(nikJenazah, 16, '9.8px', '11px')}</td>
    </tr>
    <tr>
      <td style="padding: 0.4px 0;">2. &nbsp;Nama Lengkap</td>
      <td>:</td>
      <td>${renderCharBoxes(namaJenazah, 33, '8.8px', '11px')}</td>
    </tr>
    <tr>
      <td style="padding: 0.4px 0;">3. &nbsp;Jenis Kelamin</td>
      <td>:</td>
      <td>
        ${renderOptionSquare(jkCode)}
        <span style="vertical-align: middle;">1. Laki-laki &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2. Perempuan</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 0.4px 0;">4. &nbsp;Tempat kelahiran</td>
      <td>:</td>
      <td>${renderCharBoxes(tempatLahirJenazah, 22, '8.8px', '11px')}</td>
    </tr>
    <tr>
      <td style="padding: 0.4px 0;">5. &nbsp;Hari dan Tanggal lahir</td>
      <td>:</td>
      <td>
        Hari <span style="display:inline-block; border: 1px solid #000; min-width: 52px; height: 11px; line-height: 11px; text-align: center; font-family: monospace; font-size: 5.8pt; font-weight: bold; background: #fff; margin: 0 3px 0 2px;">${tglLahirJ.hari || '&nbsp;'}</span>
        Tgl ${renderBoxedDigits(tglLahirJ.tgl, 2, '9.5px', '11px')} &nbsp;
        Bln ${renderBoxedDigits(tglLahirJ.bln, 2, '9.5px', '11px')} &nbsp;
        Thn ${renderBoxedDigits(tglLahirJ.thn, 4, '9.5px', '11px')}
      </td>
    </tr>
    <tr>
      <td style="padding: 0.4px 0;">6. &nbsp;Agama</td>
      <td>:</td>
      <td>
        ${renderBoxedDigits(agamaJenazahCode, 2, '9.5px', '11px')}
        <span style="margin-left: 20px; font-weight: 500;">7. &nbsp;Pekerjaan :</span>
        <span style="margin-left: 6px;">${renderBoxedDigits(pekerjaanJenazahCode, 2, '9.5px', '11px')}</span>
        <span style="margin-left: 8px; color: #333;">(${pekerjaanJenazah})</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 0.4px 0; vertical-align: top;">8. &nbsp;Alamat</td>
      <td style="vertical-align: top;">:</td>
      <td>
        ${renderAddressGrid(desaJenazah, namaKec, namaKab, namaProv)}
      </td>
    </tr>
    <tr>
      <td style="padding: 0.4px 0;">9. &nbsp;Anak ke</td>
      <td>:</td>
      <td>
        ${renderOptionSquare(anakKe)}
        <span style="vertical-align: middle;">1. &nbsp;2. &nbsp;3. &nbsp;4. &nbsp;.......</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 0.4px 0;">10. Tanggal Kematian</td>
      <td>:</td>
      <td>
        Hari <span style="display:inline-block; border: 1px solid #000; min-width: 52px; height: 11px; line-height: 11px; text-align: center; font-family: monospace; font-size: 5.8pt; font-weight: bold; background: #fff; margin: 0 3px 0 2px;">${tglMati.hari || '&nbsp;'}</span>
        Tgl ${renderBoxedDigits(tglMati.tgl, 2, '9.5px', '11px')} &nbsp;
        Bln ${renderBoxedDigits(tglMati.bln, 2, '9.5px', '11px')} &nbsp;
        Thn ${renderBoxedDigits(tglMati.thn, 4, '9.5px', '11px')}
      </td>
    </tr>
    <tr>
      <td style="padding: 0.4px 0;">11. Pukul</td>
      <td>:</td>
      <td>
        ${renderBoxedDigits(timeMati.jam, 2, '9.5px', '11px')} : ${renderBoxedDigits(timeMati.menit, 2, '9.5px', '11px')} &nbsp; WIB
      </td>
    </tr>
    <tr>
      <td style="padding: 0.4px 0; vertical-align: top;">12. Sebab Kematian</td>
      <td style="vertical-align: top;">:</td>
      <td>
        <table style="border-collapse: collapse; font-size: 5.6pt; font-family: Arial, sans-serif;">
          <tr>
            <td style="vertical-align: top; padding-right: 3px;">${renderOptionSquare(sebabCode)}</td>
            <td>
              1. Sakit Biasa/Tua &nbsp;&nbsp;&nbsp;&nbsp; 2. Wabah Penyakit &nbsp;&nbsp;&nbsp;&nbsp; 3. Kecelakaan &nbsp;&nbsp;&nbsp;&nbsp; 4. Kriminalitas &nbsp;&nbsp;&nbsp;&nbsp; 5. Bunuh Diri &nbsp;&nbsp;&nbsp;&nbsp; 6. Lainnya
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 0.4px 0;">13. Tempat Kematian</td>
      <td>:</td>
      <td>
        ${renderOptionSquare(tempatMatiCode)}
        <span style="vertical-align: middle;">1. Rumah Sakit &nbsp;&nbsp;&nbsp;&nbsp; 2. Rumah / Kediaman &nbsp;&nbsp;&nbsp;&nbsp; 3. Lainnya</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 0.4px 0;">14. Yang Menerangkan</td>
      <td>:</td>
      <td>
        ${renderOptionSquare(yangMenerangkanCode)}
        <span style="vertical-align: middle;">1. Dokter &nbsp;&nbsp;&nbsp;&nbsp; 2. Tenaga Kesehatan &nbsp;&nbsp;&nbsp;&nbsp; 3. Kepolisian &nbsp;&nbsp;&nbsp;&nbsp; 4. Lainnya</span>
      </td>
    </tr>
  </table>

  <!-- ORANG TUA: AYAH & IBU (2 KOLOM BERDAMPINGAN) -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 1.5px; margin-bottom: 1.5px;" border="0">
    <tr>
      <!-- KOLOM AYAH (KIRI) -->
      <td style="width: 49.5%; vertical-align: top; padding-right: 4px; border-right: 1px dashed #999;">
        <div style="font-weight: bold; font-size: 6.5pt; font-family: Arial, sans-serif; margin-bottom: 0.5px;">
          AYAH
        </div>
        <table style="width: 100%; font-size: 5.6pt; font-family: Arial, sans-serif; border-collapse: collapse;">
          <tr>
            <td style="width: 90px; padding: 0.3px 0;">1. NIK</td>
            <td style="width: 6px;">:</td>
            <td>${renderBoxedDigits(nikAyah, 16, '9.2px', '11px', '5.5pt')}</td>
          </tr>
          <tr>
            <td style="padding: 0.3px 0;">2. Nama Lengkap</td>
            <td>:</td>
            <td>${renderCharBoxes(namaAyah, 24, '8.5px', '11px', '5.4pt')}</td>
          </tr>
          <tr>
            <td style="padding: 0.3px 0;">3. Tgl Lahir / Umur</td>
            <td>:</td>
            <td>
              Tgl ${renderBoxedDigits(tglLahirAyah.tgl, 2, '8.8px', '11px')} 
              Bln ${renderBoxedDigits(tglLahirAyah.bln, 2, '8.8px', '11px')} 
              Thn ${renderBoxedDigits(tglLahirAyah.thn, 4, '8.8px', '11px')}
              &nbsp; ${umurAyah ? `Umur ${umurAyah} Th` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 0.3px 0;">4. Pekerjaan</td>
            <td>:</td>
            <td>${renderBoxedDigits(pekerjaanAyahCode, 2, '9.2px', '11px')} <span style="margin-left: 4px;">(${pekerjaanAyah})</span></td>
          </tr>
          <tr>
            <td style="padding: 0.3px 0; vertical-align: top;">5. Alamat</td>
            <td style="vertical-align: top;">:</td>
            <td>${renderAddressGridCompact(namaDesa, namaKec, namaKab)}</td>
          </tr>
        </table>
      </td>

      <!-- KOLOM IBU (KANAN) -->
      <td style="width: 49.5%; vertical-align: top; padding-left: 4px;">
        <div style="font-weight: bold; font-size: 6.5pt; font-family: Arial, sans-serif; margin-bottom: 0.5px;">
          IBU
        </div>
        <table style="width: 100%; font-size: 5.6pt; font-family: Arial, sans-serif; border-collapse: collapse;">
          <tr>
            <td style="width: 90px; padding: 0.3px 0;">1. NIK</td>
            <td style="width: 6px;">:</td>
            <td>${renderBoxedDigits(nikIbu, 16, '9.2px', '11px', '5.5pt')}</td>
          </tr>
          <tr>
            <td style="padding: 0.3px 0;">2. Nama Lengkap</td>
            <td>:</td>
            <td>${renderCharBoxes(namaIbu, 24, '8.5px', '11px', '5.4pt')}</td>
          </tr>
          <tr>
            <td style="padding: 0.3px 0;">3. Tgl Lahir / Umur</td>
            <td>:</td>
            <td>
              Tgl ${renderBoxedDigits(tglLahirIbu.tgl, 2, '8.8px', '11px')} 
              Bln ${renderBoxedDigits(tglLahirIbu.bln, 2, '8.8px', '11px')} 
              Thn ${renderBoxedDigits(tglLahirIbu.thn, 4, '8.8px', '11px')}
              &nbsp; ${umurIbu ? `Umur ${umurIbu} Th` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 0.3px 0;">4. Pekerjaan</td>
            <td>:</td>
            <td>${renderBoxedDigits(pekerjaanIbuCode, 2, '9.2px', '11px')} <span style="margin-left: 4px;">(${pekerjaanIbu})</span></td>
          </tr>
          <tr>
            <td style="padding: 0.3px 0; vertical-align: top;">5. Alamat</td>
            <td style="vertical-align: top;">:</td>
            <td>${renderAddressGridCompact(namaDesa, namaKec, namaKab)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- PELAPOR -->
  <div style="font-weight: bold; font-size: 6.5pt; font-family: Arial, sans-serif; margin-top: 1px; margin-bottom: 0.5px;">
    PELAPOR
  </div>
  <table style="width: 100%; font-size: 5.8pt; font-family: Arial, sans-serif; border-collapse: collapse;">
    <tr>
      <td style="width: 130px; padding: 0.3px 0;">1. &nbsp;NIK</td>
      <td style="width: 8px;">:</td>
      <td>${renderBoxedDigits(nikPelapor, 16, '9.8px', '11px')}</td>
    </tr>
    <tr>
      <td style="padding: 0.3px 0;">2. &nbsp;Nama Lengkap</td>
      <td>:</td>
      <td>${renderCharBoxes(namaPelapor, 33, '8.8px', '11px')}</td>
    </tr>
    <tr>
      <td style="padding: 0.3px 0;">3. &nbsp;Umur / JK / Pekerjaan</td>
      <td>:</td>
      <td>
        ${renderBoxedDigits(umurPelapor || '35', 2, '9.5px', '11px')} Thn
        &nbsp;&nbsp;&nbsp;&nbsp; JK : ${renderOptionSquare(jkPelaporCode)} (1. L &nbsp; 2. P)
        &nbsp;&nbsp;&nbsp;&nbsp; Pekerjaan : ${renderBoxedDigits(pekerjaanPelaporCode, 2, '9.5px', '11px')} (${pekerjaanPelapor})
      </td>
    </tr>
    <tr>
      <td style="padding: 0.3px 0; vertical-align: top;">4. &nbsp;Alamat</td>
      <td style="vertical-align: top;">:</td>
      <td>
        ${renderAddressGrid(namaDesa, namaKec, namaKab, namaProv)}
      </td>
    </tr>
  </table>

  <!-- SAKSI I & SAKSI II (2 KOLOM BERDAMPINGAN) -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 1.5px; margin-bottom: 1.5px;" border="0">
    <tr>
      <!-- SAKSI I -->
      <td style="width: 49.5%; vertical-align: top; padding-right: 4px; border-right: 1px dashed #999;">
        <div style="font-weight: bold; font-size: 6.5pt; font-family: Arial, sans-serif; margin-bottom: 0.5px;">
          SAKSI I
        </div>
        <table style="width: 100%; font-size: 5.6pt; font-family: Arial, sans-serif; border-collapse: collapse;">
          <tr>
            <td style="width: 80px; padding: 0.3px 0;">1. NIK</td>
            <td style="width: 6px;">:</td>
            <td>${renderBoxedDigits(nikSaksi1, 16, '9.2px', '11px', '5.5pt')}</td>
          </tr>
          <tr>
            <td style="padding: 0.3px 0;">2. Nama Lengkap</td>
            <td>:</td>
            <td>${renderCharBoxes(namaSaksi1, 24, '8.5px', '11px', '5.4pt')}</td>
          </tr>
          <tr>
            <td style="padding: 0.3px 0;">3. Umur / Pekerjaan</td>
            <td>:</td>
            <td>
              ${umurSaksi1 ? `Umur ${umurSaksi1} Th` : ''} 
              Pek : ${renderBoxedDigits(pekerjaanSaksi1Code, 2, '8.8px', '11px')}
            </td>
          </tr>
          <tr>
            <td style="padding: 0.3px 0; vertical-align: top;">4. Alamat</td>
            <td style="vertical-align: top;">:</td>
            <td>${renderAddressGridCompact(namaDesa, namaKec, namaKab)}</td>
          </tr>
        </table>
      </td>

      <!-- SAKSI II -->
      <td style="width: 49.5%; vertical-align: top; padding-left: 4px;">
        <div style="font-weight: bold; font-size: 6.5pt; font-family: Arial, sans-serif; margin-bottom: 0.5px;">
          SAKSI II
        </div>
        <table style="width: 100%; font-size: 5.6pt; font-family: Arial, sans-serif; border-collapse: collapse;">
          <tr>
            <td style="width: 80px; padding: 0.3px 0;">1. NIK</td>
            <td style="width: 6px;">:</td>
            <td>${renderBoxedDigits(nikSaksi2, 16, '9.2px', '11px', '5.5pt')}</td>
          </tr>
          <tr>
            <td style="padding: 0.3px 0;">2. Nama Lengkap</td>
            <td>:</td>
            <td>${renderCharBoxes(namaSaksi2, 24, '8.5px', '11px', '5.4pt')}</td>
          </tr>
          <tr>
            <td style="padding: 0.3px 0;">3. Umur / Pekerjaan</td>
            <td>:</td>
            <td>
              ${umurSaksi2 ? `Umur ${umurSaksi2} Th` : ''} 
              Pek : ${renderBoxedDigits(pekerjaanSaksi2Code, 2, '8.8px', '11px')}
            </td>
          </tr>
          <tr>
            <td style="padding: 0.3px 0; vertical-align: top;">4. Alamat</td>
            <td style="vertical-align: top;">:</td>
            <td>${renderAddressGridCompact(namaDesa, namaKec, namaKab)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- TANDA TANGAN (1 LEMBAR SELESAI DENGAN RAPI) -->
  <div style="text-align: right; margin-top: 4px; margin-bottom: 2px; font-size: 6.5pt; font-family: Arial, sans-serif; padding-right: 40px;">
    ${namaDesa}, ${tanggalSurat || '.................................... 20....'}
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; font-family: Arial, sans-serif; text-align: center; margin-top: 2px;">
    <tr>
      <td style="width: 50%; vertical-align: top;">
        Mengetahui :<br/>
        Kepala Desa ${namaDesa}
        <div style="height: 38px;"></div>
        ( <u><b>${namaKades}</b></u> )
      </td>
      <td style="width: 50%; vertical-align: top;">
        <br/>
        Pelapor
        <div style="height: 38px;"></div>
        ( <u><b>${namaPelapor || '...........................................................'}</b></u> )
      </td>
    </tr>
  </table>
</div>`;
}
