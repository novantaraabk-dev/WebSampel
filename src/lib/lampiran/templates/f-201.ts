import type { OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildF201PortraitHtml(ctx?: OpenSidRenderContext, subType?: string): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};

  const namaDesa = ctx?.namaDesa || 'Sampeldes';
  const namaKec = ctx?.namaKecamatan || 'Gandrungmangu';
  const namaKab = ctx?.namaKabupaten || 'Cilacap';
  const namaProv = ctx?.namaProvinsi || 'Jawa Tengah';

  // Subtype detection
  const detectedSub = (subType || '').toUpperCase();
  const isKelahiran = detectedSub.includes('LAHIR') || (!detectedSub.includes('MATI') && !detectedSub.includes('KAWIN') && !detectedSub.includes('CERAI'));
  const isKematian = detectedSub.includes('MATI') || detectedSub.includes('KEMATIAN');
  const isPerkawinan = detectedSub.includes('KAWIN') || detectedSub.includes('NIKAH');
  const isPerceraian = detectedSub.includes('CERAI');

  // Helpers
  const renderBoxedDigits = (val: string, totalCount = 16, boxWidth = '11px', boxHeight = '12.5px') => {
    const clean = (val || '').toString().replace(/[^0-9a-zA-Z]/g, '');
    const chars = clean.padEnd(totalCount, ' ').slice(0, totalCount).split('');
    return `<table style="border-collapse: collapse; display: inline-table; vertical-align: middle; margin: 0;">
      <tr>
        ${chars.map(c => `<td style="border: 1px solid #000; width: ${boxWidth}; height: ${boxHeight}; text-align: center; font-family: monospace; font-size: 6.5pt; font-weight: bold; padding: 0; background: #fff;">${c === ' ' ? '&nbsp;' : c}</td>`).join('')}
      </tr>
    </table>`;
  };

  const renderCharBoxes = (str: string, totalCount = 33, boxWidth = '10px', boxHeight = '12px') => {
    const chars = (str || '').toUpperCase().padEnd(totalCount, ' ').slice(0, totalCount).split('');
    return `<table style="border-collapse: collapse; display: inline-table; vertical-align: middle; margin: 0;">
      <tr>
        ${chars.map(c => `<td style="border: 1px solid #000; width: ${boxWidth}; height: ${boxHeight}; text-align: center; font-family: monospace; font-size: 6.2pt; font-weight: bold; padding: 0; background: #fff;">${c === ' ' ? '&nbsp;' : c}</td>`).join('')}
      </tr>
    </table>`;
  };

  const renderCheckbox = (checked: boolean, label: string) =>
    `<span style="display:inline-block; margin-right: 8px;"><span style="display:inline-block; width: 10px; height: 10px; border: 1px solid #000; text-align: center; line-height: 9px; font-size: 7pt; font-weight: bold; margin-right: 3px; vertical-align: middle; background: #fff;">${checked ? '&#10003;' : '&nbsp;'}</span><span style="vertical-align: middle;">${label}</span></span>`;

  const parseDateParts = (dateStr: string): { day: string; month: string; year: string } => {
    if (!dateStr) return { day: '', month: '', year: '' };
    const str = String(dateStr).trim();
    const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmy) {
      return {
        day: dmy[1].padStart(2, '0'),
        month: dmy[2].padStart(2, '0'),
        year: dmy[3],
      };
    }
    const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (ymd) {
      return {
        day: ymd[3].padStart(2, '0'),
        month: ymd[2].padStart(2, '0'),
        year: ymd[1],
      };
    }
    return { day: '', month: '', year: '' };
  };

  const getNamaHariFromDateStr = (dateStr: string): string => {
    const parts = parseDateParts(dateStr);
    if (!parts.year || !parts.month || !parts.day) return '-';
    try {
      const d = new Date(parseInt(parts.year, 10), parseInt(parts.month, 10) - 1, parseInt(parts.day, 10));
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return dayNames[d.getDay()] || '-';
    } catch {
      return '-';
    }
  };

  // Pelapor data
  const namaPelapor = fValues['reporterName'] || fValues['form_nama_pelapor'] || fValues['nama_pelapor'] || vIndividu?.nama || '';
  const nikPelapor = fValues['reporterNik'] || fValues['form_nik_pelapor'] || fValues['nik_pelapor'] || vIndividu?.nik || '';
  const validNoKkCandidate = [
    fValues['kkNumber'],
    fValues['noKk'],
    fValues['no_kk'],
    fValues['form_no_kk'],
    vIndividu?.no_kk,
  ].find((v) => v && String(v).replace(/[^0-9]/g, '').length >= 10);

  const noKkPelapor = validNoKkCandidate ? String(validNoKkCandidate).replace(/[^0-9]/g, '') : '';

  // Saksi data
  const namaSaksi1 =
    fValues['witness1Name'] ||
    fValues['form_nama_saksi_1'] ||
    fValues['form_nama_saksi_i'] ||
    fValues['nama_saksi_1'] ||
    fValues['form_nama_saksi1'] ||
    (ctx?.pelakuBagian?.saksi_1?.nama) ||
    (ctx?.pelakuBagian?.saksi_i?.nama) ||
    '';
  const nikSaksi1 =
    fValues['witness1Nik'] ||
    fValues['form_nik_saksi_1'] ||
    fValues['form_nik_saksi_i'] ||
    fValues['nik_saksi_1'] ||
    fValues['form_nik_saksi1'] ||
    (ctx?.pelakuBagian?.saksi_1?.nik) ||
    (ctx?.pelakuBagian?.saksi_i?.nik) ||
    '';
  const namaSaksi2 =
    fValues['witness2Name'] ||
    fValues['form_nama_saksi_2'] ||
    fValues['form_nama_saksi_ii'] ||
    fValues['nama_saksi_2'] ||
    fValues['form_nama_saksi2'] ||
    (ctx?.pelakuBagian?.saksi_2?.nama) ||
    (ctx?.pelakuBagian?.saksi_ii?.nama) ||
    '';
  const nikSaksi2 =
    fValues['witness2Nik'] ||
    fValues['form_nik_saksi_2'] ||
    fValues['form_nik_saksi_ii'] ||
    fValues['nik_saksi_2'] ||
    fValues['form_nik_saksi2'] ||
    (ctx?.pelakuBagian?.saksi_2?.nik) ||
    (ctx?.pelakuBagian?.saksi_ii?.nik) ||
    '';

  // Orang tua data
  const namaAyah = fValues['fatherName'] || fValues['form_nama_ayah'] || fValues['nama_ayah'] || vIndividu?.nama_ayah || (vIndividu as any)?.ayah_nama || '';
  const nikAyah = fValues['fatherNik'] || fValues['form_nik_ayah'] || fValues['nik_ayah'] || vIndividu?.nik_ayah || (vIndividu as any)?.ayah_nik || '';
  const tempatLahirAyah = fValues['fatherBirthPlace'] || fValues['form_tempat_lahir_ayah'] || fValues['tempat_lahir_ayah'] || namaKab;
  const tglLahirAyah = fValues['fatherBirthDate'] || fValues['form_tgl_lahir_ayah'] || fValues['tgl_lahir_ayah'] || '';
  const ayahDateParts = parseDateParts(tglLahirAyah);

  const namaIbu = fValues['motherName'] || fValues['form_nama_ibu'] || fValues['nama_ibu'] || vIndividu?.nama_ibu || (vIndividu as any)?.ibu_nama || '';
  const nikIbu = fValues['motherNik'] || fValues['form_nik_ibu'] || fValues['nik_ibu'] || vIndividu?.nik_ibu || (vIndividu as any)?.ibu_nik || '';
  const tempatLahirIbu = fValues['motherBirthPlace'] || fValues['form_tempat_lahir_ibu'] || fValues['tempat_lahir_ibu'] || namaKab;
  const tglLahirIbu = fValues['motherBirthDate'] || fValues['form_tgl_lahir_ibu'] || fValues['tgl_lahir_ibu'] || '';
  const ibuDateParts = parseDateParts(tglLahirIbu);

  // Bayi / Anak data
  const namaBayi = fValues['childName'] || fValues['form_nama_bayi'] || fValues['nama_bayi'] || fValues['nama_anak'] || '';
  const nikBayi = fValues['childNik'] || fValues['form_nik_bayi'] || fValues['nik_bayi'] || '';
  const jkBayi = (fValues['childGender'] || fValues['form_jk_bayi'] || fValues['jenis_kelamin'] || '').toLowerCase();
  const isLaki = jkBayi.includes('l') || jkBayi.includes('laki');
  const isPerempuan = jkBayi.includes('p') || jkBayi.includes('perempuan');

  // Tempat dilahirkan
  const rawChildBirthLoc = (fValues['childBirthLocation'] || fValues['form_tempat_dilahirkan'] || '').toLowerCase();
  const isLocRs = rawChildBirthLoc.includes('rs') || rawChildBirthLoc.includes('rumah sakit') || rawChildBirthLoc.includes('rb');
  const isLocPuskesmas = rawChildBirthLoc.includes('puskesmas') || rawChildBirthLoc.includes('pkm');
  const isLocPolindes = rawChildBirthLoc.includes('polindes') || rawChildBirthLoc.includes('poskesdes') || rawChildBirthLoc.includes('klinik');
  const isLocRumah = rawChildBirthLoc.includes('rumah') && !rawChildBirthLoc.includes('sakit');
  const isLocLainnya = !isLocRs && !isLocPuskesmas && !isLocPolindes && !isLocRumah && rawChildBirthLoc.length > 0;
  const effectiveLocPuskesmas = isLocPuskesmas || (!isLocRs && !isLocPolindes && !isLocRumah && !isLocLainnya);

  // Tempat kelahiran anak
  const tempatLahirBayi = fValues['childBirthPlace'] || fValues['form_tempat_kelahiran'] || namaKab;

  // Tanggal & Hari lahir anak
  const tglLahirBayi = fValues['childBirthDate'] || fValues['form_tgl_lahir_anak'] || '';
  const bayiDateParts = parseDateParts(tglLahirBayi);
  const hariLahirBayi = fValues['hari_lahir'] || getNamaHariFromDateStr(tglLahirBayi) || '-';

  // Pukul
  let pukulLahirBayi = fValues['childBirthTime'] || fValues['form_pukul'] || '08:00 WIB';
  if (pukulLahirBayi && !pukulLahirBayi.toLowerCase().includes('wib')) {
    pukulLahirBayi = `${pukulLahirBayi} WIB`;
  }

  // Jenis kelahiran
  const rawBirthType = (fValues['birthType'] || fValues['form_jenis_kelahiran'] || 'Tunggal').toLowerCase();
  const isJenisKembar2 = rawBirthType.includes('kembar 2') || rawBirthType.includes('kembar dua');
  const isJenisKembar3 = rawBirthType.includes('kembar 3') || rawBirthType.includes('kembar tiga');
  const isJenisKembar4 = rawBirthType.includes('kembar 4') || rawBirthType.includes('kembar empat');
  const isJenisLainnya = rawBirthType.includes('lain');
  const isJenisTunggal = !isJenisKembar2 && !isJenisKembar3 && !isJenisKembar4 && !isJenisLainnya;

  // Kelahiran ke
  const kelahiranKe = String(fValues['childOrder'] || fValues['form_kelahiran_ke'] || '1').replace(/[^0-9]/g, '') || '1';

  // Penolong kelahiran
  const rawAssistant = (fValues['birthAssistant'] || fValues['form_penolong_kelahiran'] || 'Bidan').toLowerCase();
  const isPenolongDokter = rawAssistant.includes('dokter') || rawAssistant.includes('dr');
  const isPenolongDukun = rawAssistant.includes('dukun');
  const isPenolongLainnya = rawAssistant.includes('lain');
  const isPenolongBidan = !isPenolongDokter && !isPenolongDukun && !isPenolongLainnya;

  // Berat bayi
  const rawBerat = String(fValues['birthWeight'] || fValues['form_berat_bayi'] || '3.2').trim();
  const beratBayi = rawBerat.toLowerCase().includes('kg') ? rawBerat : `${rawBerat} Kg`;

  // Panjang bayi
  const rawPanjang = String(fValues['birthLength'] || fValues['form_panjang_bayi'] || '49').trim();
  const panjangBayi = rawPanjang.toLowerCase().includes('cm') ? rawPanjang : `${rawPanjang} cm`;

  // Tanda tangan
  const namaKades = ctx?.namaPamong || ctx?.namaKepalaDesa || 'TUKIMAN';

  // Kematian data
  const namaJenazah = fValues['form_nama_jenazah'] || (isKematian ? (vIndividu?.nama || '') : '');
  const nikJenazah = fValues['form_nik_jenazah'] || (isKematian ? (vIndividu?.nik || '') : '');

  // PAGE 1
  const page1 = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.2pt; line-height: 1.15; color: #000; width: 100%; box-sizing: border-box; border: 1px solid #000; padding: 5px;">
    <!-- HEADER -->
    <div style="float: right; border: 1.5px solid #000; padding: 2px 14px; font-weight: bold; font-size: 10pt; background: #fff;">F-2.01</div>
    <table style="width: 70%; border-collapse: collapse; font-size: 6.2pt; margin-bottom: 3px;">
      <tr><td style="width: 80px;">Provinsi</td><td style="width: 8px;">:</td><td>${namaProv}</td></tr>
      <tr><td>Kabupaten/Kota</td><td>:</td><td>${namaKab}</td></tr>
      <tr><td>Kecamatan</td><td>:</td><td>${namaKec}</td></tr>
      <tr><td>Desa/Kelurahan</td><td>:</td><td>${namaDesa}</td></tr>
      <tr><td>Kode Wilayah</td><td>:</td><td>${renderBoxedDigits('3301102011', 10, '11px', '12px')}</td></tr>
    </table>
    <div style="clear: both;"></div>

    <div style="text-align: center; font-weight: bold; font-size: 8.5pt; margin: 3px 0 5px 0;">
      FORMULIR PELAPORAN PENCATATAN SIPIL DI DALAM WILAYAH NKRI
    </div>

    <!-- JENIS PELAPORAN PENCATATAN SIPIL -->
    <div style="border: 1px solid #000; padding: 3px; margin-bottom: 4px;">
      <div style="font-weight: bold; margin-bottom: 2px;">Jenis Pelaporan Pencatatan Sipil</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 6pt;">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            ${renderCheckbox(isKelahiran, 'Kelahiran')}<br/>
            ${renderCheckbox(false, 'Lahir Mati')}<br/>
            ${renderCheckbox(isPerkawinan, 'Perkawinan')}<br/>
            ${renderCheckbox(false, 'Pembatalan Perkawinan')}<br/>
            ${renderCheckbox(isPerceraian, 'Perceraian')}<br/>
            ${renderCheckbox(false, 'Pembatalan Perceraian')}<br/>
            ${renderCheckbox(isKematian, 'Kematian')}<br/>
            ${renderCheckbox(false, 'Pengangkatan Anak')}
          </td>
          <td style="width: 50%; vertical-align: top;">
            ${renderCheckbox(false, 'Pengakuan Anak')}<br/>
            ${renderCheckbox(false, 'Pengesahan Anak')}<br/>
            ${renderCheckbox(false, 'Perubahan Nama')}<br/>
            ${renderCheckbox(false, 'Perubahan Status Kewarganegaraan')}<br/>
            ${renderCheckbox(false, 'Pencatatan Peristiwa Penting Lainnya')}<br/>
            ${renderCheckbox(false, 'Pembetulan Akta')}<br/>
            ${renderCheckbox(false, 'Pembatalan Akta')}<br/>
            ${renderCheckbox(false, 'Pelaporan Pencatatan Sipil dari Luar Wilayah NKRI')}
          </td>
        </tr>
      </table>
    </div>

    <!-- DATA PELAPOR -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">DATA PELAPOR</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 130px; padding: 1px 3px;">Nama</td><td style="padding: 1px 3px;">${renderCharBoxes(namaPelapor, 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">NIK</td><td style="padding: 1px 3px;">${renderBoxedDigits(nikPelapor, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">Nomor Dokumen Perjalanan*</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">Nomor Kartu Keluarga</td><td style="padding: 1px 3px;">${renderBoxedDigits(noKkPelapor, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">Kewarganegaraan</td><td style="padding: 1px 3px;">WNI</td></tr>
    </table>

    <!-- DATA SUBJEK AKTA KESATU -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">DATA SUBJEK AKTA KESATU</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 130px; padding: 1px 3px;">Nama</td><td style="padding: 1px 3px;">${renderCharBoxes(namaBayi || namaJenazah || namaPelapor, 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">NIK</td><td style="padding: 1px 3px;">${renderBoxedDigits(nikBayi || nikJenazah, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">Nomor Dokumen Perjalanan*</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">Nomor Kartu Keluarga</td><td style="padding: 1px 3px;">${renderBoxedDigits(noKkPelapor, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">Kewarganegaraan</td><td style="padding: 1px 3px;">WNI</td></tr>
    </table>

    <!-- DATA SUBJEK AKTA KEDUA (JIKA ADA) -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">DATA SUBJEK AKTA KEDUA (JIKA ADA)</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 130px; padding: 1px 3px;">Nama</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">NIK</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">Nomor Dokumen Perjalanan*</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">Nomor Kartu Keluarga</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">Kewarganegaraan</td><td style="padding: 1px 3px;">WNI</td></tr>
    </table>

    <!-- DATA SAKSI I -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">DATA SAKSI I</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 130px; padding: 1px 3px;">Nama</td><td style="padding: 1px 3px;">${renderCharBoxes(namaSaksi1, 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">NIK</td><td style="padding: 1px 3px;">${renderBoxedDigits(nikSaksi1, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">Nomor Kartu Keluarga</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">Kewarganegaraan</td><td style="padding: 1px 3px;">WNI</td></tr>
    </table>

    <!-- DATA SAKSI II -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">DATA SAKSI II</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 130px; padding: 1px 3px;">Nama</td><td style="padding: 1px 3px;">${renderCharBoxes(namaSaksi2, 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">NIK</td><td style="padding: 1px 3px;">${renderBoxedDigits(nikSaksi2, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">Nomor Kartu Keluarga</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">Kewarganegaraan</td><td style="padding: 1px 3px;">WNI</td></tr>
    </table>

    <!-- DATA ORANG TUA -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">DATA ORANG TUA** (hanya diisi untuk keperluan pencatatan kelahiran, lahir mati dan kematian)</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 130px; padding: 1px 3px;">Nama Ayah</td><td style="padding: 1px 3px;">${renderCharBoxes(namaAyah, 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">NIK Ayah</td><td style="padding: 1px 3px;">${renderBoxedDigits(nikAyah, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">Tempat Lahir Ayah</td><td style="padding: 1px 3px;">${tempatLahirAyah}</td></tr>
      <tr><td style="padding: 1px 3px;">Tanggal Lahir Ayah</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits(ayahDateParts.day, 2)} Bln : ${renderBoxedDigits(ayahDateParts.month, 2)} Thn : ${renderBoxedDigits(ayahDateParts.year, 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">Kewarganegaraan</td><td style="padding: 1px 3px;">WNI</td></tr>
      <tr><td style="padding: 1px 3px;">Nama Ibu</td><td style="padding: 1px 3px;">${renderCharBoxes(namaIbu, 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">NIK Ibu</td><td style="padding: 1px 3px;">${renderBoxedDigits(nikIbu, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">Tempat Lahir Ibu</td><td style="padding: 1px 3px;">${tempatLahirIbu}</td></tr>
      <tr><td style="padding: 1px 3px;">Tanggal Lahir Ibu</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits(ibuDateParts.day, 2)} Bln : ${renderBoxedDigits(ibuDateParts.month, 2)} Thn : ${renderBoxedDigits(ibuDateParts.year, 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">Kewarganegaraan</td><td style="padding: 1px 3px;">WNI</td></tr>
    </table>

    <!-- DATA ANAK -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">DATA ANAK</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; border: 1px solid #000;" border="1">
      <tr><td style="width: 130px; padding: 1px 3px;">1. Nama</td><td style="padding: 1px 3px;">${renderCharBoxes(namaBayi, 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">2. Jenis kelamin</td><td style="padding: 1px 3px;">${renderCheckbox(isLaki, '1. Laki-Laki')} ${renderCheckbox(isPerempuan, '2. Perempuan')}</td></tr>
      <tr><td style="padding: 1px 3px;">3. Tempat dilahirkan</td><td style="padding: 1px 3px;">${renderCheckbox(isLocRs, '1. RS/RB')} ${renderCheckbox(effectiveLocPuskesmas, '2. Puskesmas')} ${renderCheckbox(isLocPolindes, '3. Polindes')} ${renderCheckbox(isLocRumah, '4. Rumah')} ${renderCheckbox(isLocLainnya, '5. Lainnya')}</td></tr>
      <tr><td style="padding: 1px 3px;">4. Tempat kelahiran</td><td style="padding: 1px 3px;">${tempatLahirBayi}</td></tr>
      <tr><td style="padding: 1px 3px;">5. Hari dan tanggal lahir</td><td style="padding: 1px 3px;">Hari : ${hariLahirBayi} &nbsp;&nbsp;&nbsp;&nbsp; Tgl : ${renderBoxedDigits(bayiDateParts.day, 2)} Bln : ${renderBoxedDigits(bayiDateParts.month, 2)} Thn : ${renderBoxedDigits(bayiDateParts.year, 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">6. Pukul</td><td style="padding: 1px 3px;">${pukulLahirBayi}</td></tr>
      <tr><td style="padding: 1px 3px;">7. Jenis kelahiran</td><td style="padding: 1px 3px;">${renderCheckbox(isJenisTunggal, '1. Tunggal')} ${renderCheckbox(isJenisKembar2, '2. Kembar 2')} ${renderCheckbox(isJenisKembar3, '3. Kembar 3')} ${renderCheckbox(isJenisKembar4, '4. Kembar 4')} ${renderCheckbox(isJenisLainnya, '5. Lainnya')}</td></tr>
      <tr><td style="padding: 1px 3px;">8. Kelahiran ke</td><td style="padding: 1px 3px;">${renderBoxedDigits(kelahiranKe, 1, '12px', '12px')}</td></tr>
      <tr><td style="padding: 1px 3px;">9. Penolong kelahiran</td><td style="padding: 1px 3px;">${renderCheckbox(isPenolongDokter, '1. Dokter')} ${renderCheckbox(isPenolongBidan, '2. Bidan/Perawat')} ${renderCheckbox(isPenolongDukun, '3. Dukun')} ${renderCheckbox(isPenolongLainnya, '4. Lainnya')}</td></tr>
      <tr><td style="padding: 1px 3px;">10. Berat bayi</td><td style="padding: 1px 3px;">${beratBayi}</td></tr>
      <tr><td style="padding: 1px 3px;">11. Panjang bayi</td><td style="padding: 1px 3px;">${panjangBayi}</td></tr>
    </table>
  </div>`;

  // PAGE 2
  const page2 = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.2pt; line-height: 1.15; color: #000; width: 100%; box-sizing: border-box; border: 1px solid #000; padding: 5px;">
    <!-- YANG LAHIR MATI -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">YANG LAHIR MATI</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 140px; padding: 1px 3px;">1. Lamanya dalam kandungan</td><td style="padding: 1px 3px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Bulan</td></tr>
      <tr><td style="padding: 1px 3px;">2. Jenis kelamin</td><td style="padding: 1px 3px;">${renderCheckbox(false, '1. Laki-Laki')} ${renderCheckbox(false, '2. Perempuan')}</td></tr>
      <tr><td style="padding: 1px 3px;">3. Tanggal lahir mati</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">4. Jenis kelahiran</td><td style="padding: 1px 3px;">${renderCheckbox(false, '1. Tunggal')} ${renderCheckbox(false, '2. Kembar 2')} ${renderCheckbox(false, '3. Kembar 3')} ${renderCheckbox(false, '4. Kembar 4')} ${renderCheckbox(false, '5. Lainnya')}</td></tr>
      <tr><td style="padding: 1px 3px;">5. Anak ke</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 1, '12px', '12px')}</td></tr>
      <tr><td style="padding: 1px 3px;">6. Tempat dilahirkan</td><td style="padding: 1px 3px;">${renderCheckbox(false, '1. RS/RB')} ${renderCheckbox(false, '2. Puskesmas')} ${renderCheckbox(false, '3. Polindes')} ${renderCheckbox(false, '4. Rumah')} ${renderCheckbox(false, '5. Lainnya')}</td></tr>
      <tr><td style="padding: 1px 3px;">7. Penolong kelahiran</td><td style="padding: 1px 3px;">${renderCheckbox(false, '1. Dokter')} ${renderCheckbox(false, '2. Bidan/Perawat')} ${renderCheckbox(false, '3. Dukun')} ${renderCheckbox(false, '4. Lainnya')}</td></tr>
      <tr><td style="padding: 1px 3px;">8. Sebab lahir mati</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">9. Yang menentukan</td><td style="padding: 1px 3px;">${renderCheckbox(false, '1. Dokter')} ${renderCheckbox(false, '2. Bidan/Perawat')} ${renderCheckbox(false, '3. Tenaga Kes.')} ${renderCheckbox(false, '4. Kepolisian')} ${renderCheckbox(false, '5. Lainnya')}</td></tr>
      <tr><td style="padding: 1px 3px;">10. Tempat kelahiran</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
    </table>

    <!-- PERKAWINAN ATAU PEMBATALAN PERKAWINAN -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">PERKAWINAN ATAU PEMBATALAN PERKAWINAN</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 2px; border: 1px solid #000;" border="1">
      <tr><td style="width: 140px; padding: 1px 3px;">1. NIK Ayah dari Suami</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">2. Nama Ayah dari Suami</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">3. NIK Ibu dari Suami</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">4. Nama Ibu dari Suami</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">5. NIK Ayah dari Istri</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">6. Nama Ayah dari Istri</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">7. NIK Ibu dari Istri</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">8. Nama Ibu dari Istri</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">9. Status Perkawinan Sebelum Kawin</td><td style="padding: 1px 3px;">${renderCheckbox(false, 'Kawin')} ${renderCheckbox(true, 'Belum Kawin')} ${renderCheckbox(false, 'Cerai Hidup')} ${renderCheckbox(false, 'Cerai Mati')}</td></tr>
      <tr><td style="padding: 1px 3px;">10. Perkawinan yang Ke-</td><td style="padding: 1px 3px;">1</td></tr>
      <tr><td style="padding: 1px 3px;">11. Istri yang Ke- (bagi yang poligami)</td><td style="padding: 1px 3px;">-</td></tr>
      <tr><td style="padding: 1px 3px;">12. Tanggal Pemberkatan Perkawinan</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">13. Tanggal Melapor</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">14. Jam Pelaporan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">15. Agama</td><td style="padding: 1px 3px;">${renderCheckbox(true, '1. Islam')} ${renderCheckbox(false, '2. Kristen')} ${renderCheckbox(false, '3. Katolik')} ${renderCheckbox(false, '4. Hindu')} ${renderCheckbox(false, '5. Budha')} ${renderCheckbox(false, '6. Konghuchu')}</td></tr>
      <tr><td style="padding: 1px 3px;">16. Kepercayaan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">17. Nama Organisasi Kepercayaan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">18. Nama Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">19. Nomor Penetapan Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">20. Tanggal Penetapan Pengadilan</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">21. Nama Pemuka Agama/Kepercayaan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">22. Nomor Surat Izin dari Perwakilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">23. Nomor Pasport</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">24. Perjanjian Perkawinan dibuat oleh Notaris</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">25. Nomor Akta Notaris</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">26. Tanggal Akta Notaris</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">27. Jumlah Anak</td><td style="padding: 1px 3px;">-</td></tr>
    </table>
    <div style="font-style: italic; font-size: 5.5pt; margin: 0.5px 0;">Bagi Pemohon Pembatalan Perkawinan Harap Mengisi Data di bawah ini:</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 2px; border: 1px solid #000;" border="1">
      <tr><td style="width: 140px; padding: 1px 3px;">1. Tanggal Perkawinan</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">2. Nomor Akta Perkawinan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">3. Tanggal Akta Perkawinan</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">4. Nama Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">5. Nomor Putusan Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">6. Tanggal Putusan Pengadilan</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">7. Tanggal Pelaporan Perkawinan di Luar Negeri</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
    </table>

    <!-- PERCERAIAN ATAU PEMBATALAN PERCERAIAN -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">PERCERAIAN ATAU PEMBATALAN PERCERAIAN</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 2px; border: 1px solid #000;" border="1">
      <tr><td style="width: 140px; padding: 1px 3px;">Yang mengajukan perceraian</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">1. Nomor akta Perkawinan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">2. Tanggal Akta Perkawinan</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">3. Tempat Pencatatan Perkawinan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">4. Nama Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">5. Tanggal Putusan Pengadilan</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">6. Nomor Putusan Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">7. Nomor Surat Keterangan Panitera Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">8. Tanggal Surat Keterangan Panitera Pengadilan</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">9. Tanggal Melapor</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
    </table>

    <!-- KEMATIAN -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">KEMATIAN</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; border: 1px solid #000;" border="1">
      <tr><td style="width: 140px; padding: 1px 3px;">1. NIK</td><td style="padding: 1px 3px;">${renderBoxedDigits(nikJenazah, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">2. Nama lengkap</td><td style="padding: 1px 3px;">${renderCharBoxes(namaJenazah, 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">3. Tanggal kematian</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">4. Pukul</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">5. Sebab Kematian</td><td style="padding: 1px 3px;">${renderCheckbox(true, '1. Sakit biasa / tua')} ${renderCheckbox(false, '2. Wabah Penyakit')} ${renderCheckbox(false, '3. Kecelakaan')} ${renderCheckbox(false, '4. Kriminalitas')} ${renderCheckbox(false, '5. Bunuh Diri')} ${renderCheckbox(false, '6. Lainnya')}</td></tr>
      <tr><td style="padding: 1px 3px;">6. Tempat kematian</td><td style="padding: 1px 3px;">${namaDesa}</td></tr>
      <tr><td style="padding: 1px 3px;">7. Yang menerangkan</td><td style="padding: 1px 3px;">${renderCheckbox(false, '1. Dokter')} ${renderCheckbox(true, '2. Tenaga Kesehatan')} ${renderCheckbox(false, '3. Kepolisian')} ${renderCheckbox(false, '4. Lainnya')}</td></tr>
    </table>
  </div>`;

  // PAGE 3
  const page3 = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.2pt; line-height: 1.15; color: #000; width: 100%; box-sizing: border-box; border: 1px solid #000; padding: 5px;">
    <!-- PENGANGKATAN ANAK -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">PENGANGKATAN ANAK</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 140px; padding: 1px 3px;">1. Nama anak angkat</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">2. Nomor Akta Kelahiran</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">3. Tanggal/Bulan/Tahun Penerbitan Akta Kelahiran</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">4. Dinas Kabupaten/Kota yang menerbitkan Akta Kelahiran</td><td style="padding: 1px 3px;">${namaKab}</td></tr>
      <tr><td style="padding: 1px 3px;">5. Nama Ibu Kandung</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">6. NIK Ibu Kandung</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">7. Kewarganegaraan</td><td style="padding: 1px 3px;">WNI</td></tr>
      <tr><td style="padding: 1px 3px;">8. Nama Ayah</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">9. NIK Ayah Kandung</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">10. Kewarganegaraan</td><td style="padding: 1px 3px;">WNI</td></tr>
      <tr><td style="padding: 1px 3px;">11. Nama Ibu Angkat</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">12. NIK Ibu Angkat</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">13. Nomor Paspor</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">14. Nama Ayah Angkat</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">15. NIK Ayah Angkat</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">16. Nomor Paspor</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">17. Nama Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">18. Tanggal Penetapan Pengadilan</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">19. Nomor Penetapan Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">20. Nama lembaga Penetapan Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">21. Tempat lembaga penetapan pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
    </table>

    <!-- PENGAKUAN ANAK -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">PENGAKUAN ANAK</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 140px; padding: 1px 3px;">1. Nomor Akta Kelahiran</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">2. Tanggal/Bulan/Tahun Penerbitan Akta Kelahiran</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">3. Dinas Kabupaten/Kota yang menerbitkan Akta Kelahiran</td><td style="padding: 1px 3px;">${namaKab}</td></tr>
      <tr><td style="padding: 1px 3px;">4. Tanggal/Bulan/Tahun Kelahiran Anak</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">5. Tanggal/Bulan/Tahun Perkawinan Agama</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">6. Nama Ibu Kandung</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">7. NIK Ibu Kandung</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">8. Kewarganegaraan Ibu Kandung</td><td style="padding: 1px 3px;">WNI</td></tr>
      <tr><td style="padding: 1px 3px;">9. Nama Ayah Kandung</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">10. NIK Ayah Kandung</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">11. Kewarganegaraan Ayah Kandung</td><td style="padding: 1px 3px;">WNI</td></tr>
      <tr><td style="padding: 1px 3px;">12. Tanggal Penetapan Pengadilan</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">13. Nomor Penetapan Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">14. Nama lembaga Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
    </table>

    <!-- PENGESAHAN ANAK -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">PENGESAHAN ANAK</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 140px; padding: 1px 3px;">1. Nomor Akta Kelahiran</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">2. Tanggal/Bulan/Tahun Penerbitan Akta Kelahiran</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">3. Dinas Kabupaten/Kota yang menerbitkan Akta Kelahiran</td><td style="padding: 1px 3px;">${namaKab}</td></tr>
      <tr><td style="padding: 1px 3px;">4. Tanggal/Bulan/Tahun Kelahiran Anak</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">5. Tanggal/Bulan/Tahun Perkawinan Agama</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">6. Nomor Tanggal/Bulan/Tahun Akta Perkawinan/Buku Nikah</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">7. Nama Ibu Kandung</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">8. NIK Ibu Kandung</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">9. Kewarganegaraan Ibu Kandung</td><td style="padding: 1px 3px;">WNI</td></tr>
      <tr><td style="padding: 1px 3px;">10. Nama Ayah Kandung</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">11. NIK Ayah Kandung</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">12. Kewarganegaraan Ayah Kandung</td><td style="padding: 1px 3px;">WNI</td></tr>
      <tr><td style="padding: 1px 3px;">13. Nomor Penetapan Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">14. Tanggal Penetapan Pengadilan</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">15. Nama lembaga Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
    </table>

    <!-- PERUBAHAN NAMA -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">PERUBAHAN NAMA</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; border: 1px solid #000;" border="1">
      <tr><td style="width: 140px; padding: 1px 3px;">1. Nama Lama</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">2. Nama Baru</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">3. Nomor Akta Kelahiran</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">4. Nama Ayah/Ibu/Wali (bagi yang di bawah umur)</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">5. NIK Nama Ayah/Ibu/Wali</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">6. Kewarganegaraan</td><td style="padding: 1px 3px;">WNI</td></tr>
      <tr><td style="padding: 1px 3px;">7. Nomor Penetapan Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">8. Tanggal Penetapan Pengadilan</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">9. Nama lembaga Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
    </table>
  </div>`;

  // PAGE 4
  const page4 = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.2pt; line-height: 1.15; color: #000; width: 100%; box-sizing: border-box; border: 1px solid #000; padding: 5px;">
    <!-- PERUBAHAN STATUS KEWARGANEGARAAN -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">PERUBAHAN STATUS KEWARGANEGARAAN</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 140px; padding: 1px 3px;">1. Kewarganegaraan Baru</td><td style="padding: 1px 3px;">WNI</td></tr>
      <tr><td style="padding: 1px 3px;">2. Nomor Akta Kelahiran</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">3. Nomor Akta Perkawinan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">4. Nama Suami atau Istri</td><td style="padding: 1px 3px;">${renderCharBoxes('', 33)}</td></tr>
      <tr><td style="padding: 1px 3px;">5. NIK Suami atau Istri</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">6. Nomor Paspor</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">7. Nomor Afidavit</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">8. Nomor Keputusan Presiden</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">9. Tanggal/Bulan/Tahun</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">10. Nomor Berita Acara Sumpah/Janji Setia</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">11. Nama Jabatan yang menerbitkan BAS/Janji Setia</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">12. Tanggal/Bulan/Tahun</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">13. Nomor Keputusan Menteri (Bidang Kewarganegaraan)</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">14. Tanggal/Bulan/Tahun</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
    </table>

    <!-- PERUBAHAN PERISTIWA PENTING LAINNYA -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">PERUBAHAN PERISTIWA PENTING LAINNYA</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 140px; padding: 1px 3px;">1. Nomor Akta Kelahiran</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">2. Jenis Kelamin Lama</td><td style="padding: 1px 3px;">${renderCheckbox(false, '1. Laki-Laki')} ${renderCheckbox(false, '2. Perempuan')}</td></tr>
      <tr><td style="padding: 1px 3px;">3. Jenis Kelamin Baru</td><td style="padding: 1px 3px;">${renderCheckbox(false, '1. Laki-Laki')} ${renderCheckbox(false, '2. Perempuan')}</td></tr>
      <tr><td style="padding: 1px 3px;">4. Nomor Penetapan Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">5. Tanggal Penetapan Pengadilan</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">6. Nama lembaga Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
    </table>

    <!-- PEMBETULAN AKTA & PEMBATALAN AKTA -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">PEMBETULAN AKTA</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 140px; padding: 1px 3px;">1. Nomor Akta yang akan dibetulkan/ditarik</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">2. Nama Ayah/Ibu / wali (yang di bawah umur)</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">3. NIK Ayah/Ibu /Wali</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 16)}</td></tr>
    </table>

    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">PEMBATALAN AKTA</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 140px; padding: 1px 3px;">1. Akta yang dibatalkan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">2. Nomor Akta yang dibatalkan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">3. Nomor Putusan Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">4. Tanggal Putusan Pengadilan</td><td style="padding: 1px 3px;">Tgl : ${renderBoxedDigits('', 2)} Bln : ${renderBoxedDigits('', 2)} Thn : ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">5. Nama lembaga Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
    </table>

    <!-- PELAPORAN PENCATATAN SIPIL DARI LUAR WILAYAH NKRI -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">PELAPORAN PENCATATAN SIPIL DARI LUAR WILAYAH NKRI</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 4px; border: 1px solid #000;" border="1">
      <tr>
        <td style="width: 140px; padding: 1px 3px;">1. Jenis peristiwa penting</td>
        <td style="padding: 1px 3px;">
          ${renderCheckbox(false, '1. Kelahiran')} ${renderCheckbox(false, '2. Perkawinan')} ${renderCheckbox(false, '3. Perceraian')} ${renderCheckbox(false, '4. Kematian')}<br/>
          ${renderCheckbox(false, '5. Pengangkatan Anak')} ${renderCheckbox(false, '6. Pelepasan Kewarganegaraan RI')}
        </td>
      </tr>
      <tr><td style="padding: 1px 3px;">2. Nomor Surat Keterangan Pelaporan Pencatatan Sipil dari Perwakilan RI</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">3. Tanggal Surat Keterangan Pelaporan Pencatatan Sipil dari Perwakilan RI</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">4. Kantor Perwakilan yang Melakukan pencatatan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">5. Nomor Bukti Pencatatan Sipil dari Negara Setempat</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">6. Tanggal Penerbitan dari Negara Setempat</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
    </table>

    <!-- TANDA TANGAN -->
    <div style="text-align: right; margin-bottom: 2px; font-size: 6.2pt; padding-right: 30px;">
      ${namaDesa}, ${ctx?.tanggalSurat || '.................................... 20....'}
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6.2pt; text-align: center; margin-bottom: 4px;">
      <tr>
        <td style="width: 50%; vertical-align: top;">
          Mengetahui :<br/>
          Kepala Desa / Lurah<br/>
          Pejabat Dukcapil Yang Membidangi
          <div style="height: 38px;"></div>
          ( <u><b>${namaKades}</b></u> )
        </td>
        <td style="width: 50%; vertical-align: top;">
          <br/>
          Pelapor
          <div style="height: 48px;"></div>
          ( <u><b>${namaPelapor || '...........................................................'}</b></u> )
        </td>
      </tr>
    </table>
    <div style="font-size: 5.5pt; font-style: italic;">* Jika Ada</div>
  </div>`;

  return [page1, page2, page3, page4].join('\n<!-- PAGE_BREAK -->\n');
}
