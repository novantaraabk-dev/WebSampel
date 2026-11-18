import type { OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildF212PortraitHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};

  const namaDesa = ctx?.namaDesa || 'Sampeldes';
  const namaKec = ctx?.namaKecamatan || 'Gandrungmangu';
  const namaKab = ctx?.namaKabupaten || 'Cilacap';
  const namaProv = ctx?.namaProvinsi || 'Jawa Tengah';

  // Helpers
  const renderBoxedDigits = (val: string, totalCount = 16, boxWidth = '11px', boxHeight = '12px') => {
    const clean = (val || '').toString().replace(/[^0-9a-zA-Z]/g, '');
    const chars = clean.padEnd(totalCount, ' ').slice(0, totalCount).split('');
    return `<table style="border-collapse: collapse; display: inline-table; vertical-align: middle; margin: 0;">
      <tr>
        ${chars.map(c => `<td style="border: 1px solid #000; width: ${boxWidth}; height: ${boxHeight}; text-align: center; font-family: monospace; font-size: 6.5pt; font-weight: bold; padding: 0; background: #fff;">${c === ' ' ? '&nbsp;' : c}</td>`).join('')}
      </tr>
    </table>`;
  };

  const renderSingleBox = (val: string = '', width = '14px', height = '12px') =>
    `<span style="display: inline-block; border: 1px solid #000; width: ${width}; height: ${height}; text-align: center; line-height: ${height}; font-family: monospace; font-size: 6.5pt; font-weight: bold; background: #fff; vertical-align: middle;">${val || '&nbsp;'}</span>`;

  const renderCheckbox = (checked: boolean, label: string) =>
    `<span style="display:inline-block; margin-right: 8px;"><span style="display:inline-block; width: 9px; height: 9px; border: 1px solid #000; text-align: center; line-height: 8px; font-size: 6.5pt; font-weight: bold; margin-right: 3px; vertical-align: middle; background: #fff;">${checked ? '&#10003;' : '&nbsp;'}</span><span style="vertical-align: middle;">${label}</span></span>`;

  // Data fields
  // Suami
  const isPria = (vIndividu?.jenis_kelamin || '').toLowerCase().includes('l');
  const namaSuami = fValues['form_nama_suami'] || fValues['nama_suami'] || fValues['form_nama_calon_suami'] || (isPria ? vIndividu?.nama : '') || (ctx?.pelakuBagian?.pasangan?.nama) || '';
  const nikSuami = fValues['form_nik_suami'] || fValues['nik_suami'] || fValues['form_nik_calon_suami'] || (isPria ? vIndividu?.nik : '') || (ctx?.pelakuBagian?.pasangan?.nik) || '';
  const noKkSuami = fValues['form_no_kk_suami'] || fValues['form_no_kk_calon_suami'] || (isPria ? vIndividu?.no_kk : '') || (ctx?.pelakuBagian?.pasangan?.no_kk) || '';
  const pasporSuami = fValues['form_paspor_suami'] || '';
  const tempatLahirSuami = fValues['form_tempat_lahir_suami'] || fValues['form_tempat_lahir_calon_suami'] || (isPria ? vIndividu?.tempat_lahir : '') || (ctx?.pelakuBagian?.pasangan?.tempat_lahir) || '';
  const alamatSuami = fValues['form_alamat_suami'] || fValues['form_alamat_calon_suami'] || (isPria ? vIndividu?.alamat : '') || (ctx?.pelakuBagian?.pasangan?.alamat) || '';
  const rtSuami = fValues['form_rt_suami'] || (isPria ? vIndividu?.rt : '') || '';
  const rwSuami = fValues['form_rw_suami'] || (isPria ? vIndividu?.rw : '') || '';

  // Ayah Suami
  const namaAyahSuami = fValues['form_nama_ayah_suami'] || (isPria ? (vIndividu?.nama_ayah || (vIndividu as any)?.ayah_nama) : '') || '';
  const nikAyahSuami = fValues['form_nik_ayah_suami'] || (isPria ? (vIndividu?.nik_ayah || (vIndividu as any)?.ayah_nik) : '') || '';

  // Ibu Suami
  const namaIbuSuami = fValues['form_nama_ibu_suami'] || (isPria ? (vIndividu?.nama_ibu || (vIndividu as any)?.ibu_nama) : '') || '';
  const nikIbuSuami = fValues['form_nik_ibu_suami'] || (isPria ? (vIndividu?.nik_ibu || (vIndividu as any)?.ibu_nik) : '') || '';

  // Istri
  const isWanita = (vIndividu?.jenis_kelamin || '').toLowerCase().includes('p');
  const namaIstri = fValues['form_nama_istri'] || fValues['nama_istri'] || fValues['form_nama_calon_istri'] || fValues['form_nama_cpw'] || fValues['nama_cpw'] || (isWanita ? vIndividu?.nama : '') || (ctx?.pelakuBagian?.pasangan?.nama) || '';
  const nikIstri = fValues['form_nik_istri'] || fValues['nik_istri'] || fValues['form_nik_calon_istri'] || fValues['form_nik_cpw'] || fValues['nik_cpw'] || (isWanita ? vIndividu?.nik : '') || (ctx?.pelakuBagian?.pasangan?.nik) || '';
  const noKkIstri = fValues['form_no_kk_istri'] || fValues['form_no_kk_calon_istri'] || fValues['form_no_kk_cpw'] || (isWanita ? vIndividu?.no_kk : '') || (ctx?.pelakuBagian?.pasangan?.no_kk) || '';
  const tempatLahirIstri = fValues['form_tempat_lahir_istri'] || fValues['form_tempat_lahir_calon_istri'] || (isWanita ? vIndividu?.tempat_lahir : '') || (ctx?.pelakuBagian?.pasangan?.tempat_lahir) || '';
  const alamatIstri = fValues['form_alamat_istri'] || fValues['form_alamat_calon_istri'] || fValues['form_alamat_cpw'] || (isWanita ? vIndividu?.alamat : '') || (ctx?.pelakuBagian?.pasangan?.alamat) || '';
  const rtIstri = fValues['form_rt_istri'] || (isWanita ? vIndividu?.rt : '') || '';
  const rwIstri = fValues['form_rw_istri'] || (isWanita ? vIndividu?.rw : '') || '';

  // Ayah Istri
  const namaAyahIstri = fValues['form_nama_ayah_istri'] || (isWanita ? (vIndividu?.nama_ayah || (vIndividu as any)?.ayah_nama) : '') || '';
  const nikAyahIstri = fValues['form_nik_ayah_istri'] || (isWanita ? (vIndividu?.nik_ayah || (vIndividu as any)?.ayah_nik) : '') || '';

  // Ibu Istri
  const namaIbuIstri = fValues['form_nama_ibu_istri'] || (isWanita ? (vIndividu?.nama_ibu || (vIndividu as any)?.ibu_nama) : '') || '';
  const nikIbuIstri = fValues['form_nik_ibu_istri'] || (isWanita ? (vIndividu?.nik_ibu || (vIndividu as any)?.ibu_nik) : '') || '';

  // Saksi
  const namaSaksi1 =
    fValues['form_nama_saksi_1'] ||
    fValues['form_nama_saksi_i'] ||
    fValues['nama_saksi_1'] ||
    fValues['form_nama_saksi1'] ||
    fValues['witness1Name'] ||
    (ctx?.pelakuBagian?.saksi_1?.nama) ||
    (ctx?.pelakuBagian?.saksi_i?.nama) ||
    '';
  const nikSaksi1 =
    fValues['form_nik_saksi_1'] ||
    fValues['form_nik_saksi_i'] ||
    fValues['nik_saksi_1'] ||
    fValues['form_nik_saksi1'] ||
    fValues['witness1Nik'] ||
    (ctx?.pelakuBagian?.saksi_1?.nik) ||
    (ctx?.pelakuBagian?.saksi_i?.nik) ||
    '';
  const tempatLahirSaksi1 =
    fValues['form_tempat_lahir_saksi_1'] ||
    fValues['form_tempat_lahir_saksi_i'] ||
    fValues['tempat_lahir_saksi_1'] ||
    fValues['form_tempat_lahir_saksi1'] ||
    fValues['witness1BirthPlace'] ||
    (ctx?.pelakuBagian?.saksi_1?.tempat_lahir) ||
    namaKab;
  const rawTglLahirSaksi1 =
    fValues['form_tanggal_lahir_saksi_1'] ||
    fValues['form_tanggal_lahir_saksi_i'] ||
    fValues['tanggal_lahir_saksi_1'] ||
    fValues['form_tanggal_lahir_saksi1'] ||
    fValues['witness1BirthDate'] ||
    (ctx?.pelakuBagian?.saksi_1?.tanggal_lahir) ||
    '';
  const alamatSaksi1 =
    fValues['form_alamat_saksi_1'] ||
    fValues['form_alamat_saksi_i'] ||
    fValues['alamat_saksi_1'] ||
    fValues['form_alamat_saksi1'] ||
    fValues['witness1Address'] ||
    (ctx?.pelakuBagian?.saksi_1?.alamat) ||
    namaDesa;

  const namaSaksi2 =
    fValues['form_nama_saksi_2'] ||
    fValues['form_nama_saksi_ii'] ||
    fValues['nama_saksi_2'] ||
    fValues['form_nama_saksi2'] ||
    fValues['witness2Name'] ||
    (ctx?.pelakuBagian?.saksi_2?.nama) ||
    (ctx?.pelakuBagian?.saksi_ii?.nama) ||
    '';
  const nikSaksi2 =
    fValues['form_nik_saksi_2'] ||
    fValues['form_nik_saksi_ii'] ||
    fValues['nik_saksi_2'] ||
    fValues['form_nik_saksi2'] ||
    fValues['witness2Nik'] ||
    (ctx?.pelakuBagian?.saksi_2?.nik) ||
    (ctx?.pelakuBagian?.saksi_ii?.nik) ||
    '';
  const tempatLahirSaksi2 =
    fValues['form_tempat_lahir_saksi_2'] ||
    fValues['form_tempat_lahir_saksi_ii'] ||
    fValues['tempat_lahir_saksi_2'] ||
    fValues['form_tempat_lahir_saksi2'] ||
    fValues['witness2BirthPlace'] ||
    (ctx?.pelakuBagian?.saksi_2?.tempat_lahir) ||
    namaKab;
  const rawTglLahirSaksi2 =
    fValues['form_tanggal_lahir_saksi_2'] ||
    fValues['form_tanggal_lahir_saksi_ii'] ||
    fValues['tanggal_lahir_saksi_2'] ||
    fValues['form_tanggal_lahir_saksi2'] ||
    fValues['witness2BirthDate'] ||
    (ctx?.pelakuBagian?.saksi_2?.tanggal_lahir) ||
    '';
  const alamatSaksi2 =
    fValues['form_alamat_saksi_2'] ||
    fValues['form_alamat_saksi_ii'] ||
    fValues['alamat_saksi_2'] ||
    fValues['form_alamat_saksi2'] ||
    fValues['witness2Address'] ||
    (ctx?.pelakuBagian?.saksi_2?.alamat) ||
    namaDesa;

  // ==================== HALAMAN 1 (240) ====================
  const page1 = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.2pt; line-height: 1.15; color: #000; width: 100%; box-sizing: border-box; border: 1px solid #000; padding: 4px;">
    <!-- HEADER -->
    <div style="float: right; border: 1.5px solid #000; padding: 1.5px 12px; font-weight: bold; font-size: 9.5pt; background: #fff;">
      Kode. F-2.12
    </div>
    <table style="width: 70%; border-collapse: collapse; font-size: 6.2pt; margin-bottom: 2px;">
      <tr><td style="width: 140px; font-weight: bold;">PEMERINTAH KABUPATEN/KOTA</td><td style="width: 6px;">:</td><td>${namaKab.toUpperCase()}</td></tr>
      <tr><td style="font-weight: bold;">DINAS/KANTOR</td><td>:</td><td>DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL</td></tr>
      <tr><td style="font-weight: bold;">Kode Wilayah</td><td>:</td><td>${renderBoxedDigits('3301', 4, '11px', '12px')}</td></tr>
    </table>
    <div style="clear: both;"></div>

    <!-- TITLE -->
    <div style="border: 1px solid #000; text-align: center; font-weight: bold; font-size: 8pt; padding: 2px; margin: 2px auto 4px auto; width: 60%; background: #f8fafc;">
      FORMULIR PENCATATAN PERKAWINAN
    </div>

    <!-- I. DATA SUAMI -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">I. DATA SUAMI</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 155px; padding: 1px 3px;">1. Nomor Induk Kependudukan (NIK)</td><td style="padding: 1px 3px;">${renderBoxedDigits(nikSuami, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">2. Nomor Kartu Keluarga (Nomor KK)</td><td style="padding: 1px 3px;">${renderBoxedDigits(noKkSuami, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">3. Nomor Paspor</td><td style="padding: 1px 3px;">${pasporSuami || '&nbsp;'}</td></tr>
      <tr><td style="padding: 1px 3px;">4. Nama Lengkap</td><td style="padding: 1px 3px; font-weight: bold;">${namaSuami || '&nbsp;'}</td></tr>
      <tr><td style="padding: 1px 3px;">5. Tempat/Tanggal Lahir</td><td style="padding: 1px 3px;">${tempatLahirSuami || '&nbsp;'} &nbsp;&nbsp;&nbsp;&nbsp; Tgl ${renderBoxedDigits('', 2)} Bln ${renderBoxedDigits('', 2)} Thn ${renderBoxedDigits('', 4)}</td></tr>
      <tr>
        <td style="padding: 1px 3px;">6. Alamat</td>
        <td style="padding: 1px 3px;">
          ${alamatSuami || '&nbsp;'} &nbsp;&nbsp; RT ${renderBoxedDigits(rtSuami, 2)} RW ${renderBoxedDigits(rwSuami, 2)} &nbsp;&nbsp; Kode Pos ${renderBoxedDigits('53254', 5)} Telepon ${renderBoxedDigits('', 10)}<br/>
          <table style="width: 100%; border-collapse: collapse; font-size: 5.8pt; margin-top: 1px;">
            <tr><td style="width: 50%;">a. Desa/Kelurahan : ${namaDesa}</td><td style="width: 50%;">c. Kab./Kota : ${namaKab}</td></tr>
            <tr><td>b. Kecamatan : ${namaKec}</td><td>d. Propinsi : ${namaProv}</td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 3px;">7. Pendidikan Terakhir</td>
        <td style="padding: 1px 3px;">
          ${renderSingleBox('8')} &nbsp;&nbsp;
          1. Tidak/Belum Sekolah &nbsp; 2. Belum Tamat SD &nbsp; 3. SD/Sederajat &nbsp; 4. SLTP/Sederajat &nbsp; 5. SLTA/Sederajat<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 6. Diploma I/II &nbsp; 7. Akademi/Diploma III/S. Muda &nbsp; 8. Diploma IV/Strata I &nbsp; 9. Strata II &nbsp; 10. Strata III
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 3px;">8. Agama/Penghayat Kepercayaan</td>
        <td style="padding: 1px 3px;">
          ${renderSingleBox('1')} &nbsp;&nbsp;
          1. Islam &nbsp; 2. Kristen &nbsp; 3. Katholik &nbsp; 4. Hindu &nbsp; 5. Budha &nbsp; 6. Khonghucu &nbsp; 7. Penghayat Kepercayaan &nbsp; 8. Lainnya
        </td>
      </tr>
      <tr><td style="padding: 1px 3px;">9. Nama Organisasi Penghayat Kepercayaan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">10. Pekerjaan</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 2, '11px', '12px')} &nbsp; Lihat tata cara pengisian formulir X JENIS PEKERJAAN No. 1 s/d 88</td></tr>
      <tr><td style="padding: 1px 3px;">11. Anak ke</td><td style="padding: 1px 3px;">${renderBoxedDigits('1', 2, '11px', '12px')}</td></tr>
      <tr><td style="padding: 1px 3px;">12. Status Perkawinan Sebelum Nikah</td><td style="padding: 1px 3px;">${renderSingleBox('1')} &nbsp;&nbsp; 1. Belum kawin &nbsp;&nbsp; 2. Kawin &nbsp;&nbsp; 3. Cerai Hidup &nbsp;&nbsp; 4. Cerai Mati</td></tr>
      <tr><td style="padding: 1px 3px;">13. Perkawinan Yang Ke</td><td style="padding: 1px 3px;">${renderSingleBox('1')}</td></tr>
      <tr><td style="padding: 1px 3px;">14. Istri Yang Ke (bagi yang poligami)</td><td style="padding: 1px 3px;">${renderSingleBox('')}</td></tr>
      <tr><td style="padding: 1px 3px;">15. Kewarganegaraan</td><td style="padding: 1px 3px;">${renderSingleBox('1')} &nbsp;&nbsp; 1. WNI &nbsp;&nbsp; 2. WNA</td></tr>
      <tr><td style="padding: 1px 3px;">16. Kebangsaan (bagi WNA)</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
    </table>

    <!-- II. DATA AYAH DARI SUAMI -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">II. DATA AYAH DARI SUAMI</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 155px; padding: 1px 3px;">17. Nomor Induk Kependudukan (NIK)</td><td style="padding: 1px 3px;">${renderBoxedDigits(nikAyahSuami, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">18. Nama Lengkap</td><td style="padding: 1px 3px; font-weight: bold;">${namaAyahSuami || '&nbsp;'}</td></tr>
      <tr>
        <td style="padding: 1px 3px;">19. Agama/Penghayat Kepercayaan</td>
        <td style="padding: 1px 3px;">
          ${renderSingleBox('1')} &nbsp;&nbsp;
          1. Islam &nbsp; 2. Kristen &nbsp; 3. Katholik &nbsp; 4. Hindu &nbsp; 5. Budha &nbsp; 6. Khonghucu &nbsp; 7. Penghayat Kepercayaan &nbsp; 8. Lainnya
        </td>
      </tr>
      <tr><td style="padding: 1px 3px;">20. Nama Organisasi Penghayat Kepercayaan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">21. Tempat/Tanggal Lahir</td><td style="padding: 1px 3px;">${namaKab} &nbsp;&nbsp;&nbsp;&nbsp; Tgl ${renderBoxedDigits('', 2)} Bln ${renderBoxedDigits('', 2)} Thn ${renderBoxedDigits('', 4)}</td></tr>
      <tr>
        <td style="padding: 1px 3px;">22. Alamat</td>
        <td style="padding: 1px 3px;">
          ${alamatSuami || '&nbsp;'} &nbsp;&nbsp; RT ${renderBoxedDigits(rtSuami, 2)} RW ${renderBoxedDigits(rwSuami, 2)} &nbsp;&nbsp; Kode Pos ${renderBoxedDigits('53254', 5)} Telepon ${renderBoxedDigits('', 10)}<br/>
          <table style="width: 100%; border-collapse: collapse; font-size: 5.8pt; margin-top: 1px;">
            <tr><td style="width: 50%;">a. Desa/Kelurahan : ${namaDesa}</td><td style="width: 50%;">c. Kab./Kota : ${namaKab}</td></tr>
            <tr><td>b. Kecamatan : ${namaKec}</td><td>d. Propinsi : ${namaProv}</td></tr>
          </table>
        </td>
      </tr>
      <tr><td style="padding: 1px 3px;">23. Pekerjaan</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 2, '11px', '12px')} &nbsp; Lihat tata cara pengisian formulir X JENIS PEKERJAAN No. 1 s/d 88</td></tr>
    </table>

    <!-- III. DATA IBU DARI SUAMI (bag 1) -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">III. DATA IBU DARI SUAMI</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 2px; border: 1px solid #000;" border="1">
      <tr><td style="width: 155px; padding: 1px 3px;">24. Nomor Induk Kependudukan (NIK)</td><td style="padding: 1px 3px;">${renderBoxedDigits(nikIbuSuami, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">25. Nama Lengkap</td><td style="padding: 1px 3px; font-weight: bold;">${namaIbuSuami || '&nbsp;'}</td></tr>
      <tr>
        <td style="padding: 1px 3px;">26. Agama/Penghayat Kepercayaan</td>
        <td style="padding: 1px 3px;">
          ${renderSingleBox('1')} &nbsp;&nbsp;
          1. Islam &nbsp; 2. Kristen &nbsp; 3. Katholik &nbsp; 4. Hindu &nbsp; 5. Budha &nbsp; 6. Khonghucu &nbsp; 7. Penghayat Kepercayaan &nbsp; 8. Lainnya
        </td>
      </tr>
      <tr><td style="padding: 1px 3px;">27. Nama Organisasi Penghayat Kepercayaan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">28. Tempat/Tanggal Lahir</td><td style="padding: 1px 3px;">${namaKab} &nbsp;&nbsp;&nbsp;&nbsp; Tgl ${renderBoxedDigits('', 2)} Bln ${renderBoxedDigits('', 2)} Thn ${renderBoxedDigits('', 4)}</td></tr>
      <tr>
        <td style="padding: 1px 3px;">29. Alamat</td>
        <td style="padding: 1px 3px;">
          ${alamatSuami || '&nbsp;'} &nbsp;&nbsp; RT ${renderBoxedDigits(rtSuami, 2)} RW ${renderBoxedDigits(rwSuami, 2)} &nbsp;&nbsp; Kode Pos ${renderBoxedDigits('53254', 5)} Telepon ${renderBoxedDigits('', 10)}<br/>
          <table style="width: 100%; border-collapse: collapse; font-size: 5.8pt; margin-top: 1px;">
            <tr><td style="width: 50%;">a. Desa/Kelurahan : ${namaDesa}</td><td style="width: 50%;">c. Kab./Kota : ${namaKab}</td></tr>
            <tr><td>b. Kecamatan : ${namaKec}</td><td>d. Propinsi : ${namaProv}</td></tr>
          </table>
        </td>
      </tr>
    </table>
    <div style="text-align: right; font-weight: bold; font-size: 7pt; margin-top: 1px;">240</div>
  </div>`;

  // ==================== HALAMAN 2 (241) ====================
  const page2 = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.2pt; line-height: 1.15; color: #000; width: 100%; box-sizing: border-box; border: 1px solid #000; padding: 4px;">
    <!-- Continuing III. Data Ibu dari Suami -->
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 155px; padding: 1px 3px;">30. Pekerjaan</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 2, '11px', '12px')} &nbsp; Lihat tata cara pengisian formulir X JENIS PEKERJAAN No. 1 s/d 88</td></tr>
    </table>

    <!-- IV. DATA ISTRI -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">IV. DATA ISTRI</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 155px; padding: 1px 3px;">31. Nomor Induk Kependudukan (NIK)</td><td style="padding: 1px 3px;">${renderBoxedDigits(nikIstri, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">32. Nomor Kartu Keluarga (Nomor KK)</td><td style="padding: 1px 3px;">${renderBoxedDigits(noKkIstri, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">33. Nomor Paspor</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">34. Nama Lengkap</td><td style="padding: 1px 3px; font-weight: bold;">${namaIstri || '&nbsp;'}</td></tr>
      <tr><td style="padding: 1px 3px;">35. Tempat/Tanggal Lahir</td><td style="padding: 1px 3px;">${tempatLahirIstri || '&nbsp;'} &nbsp;&nbsp;&nbsp;&nbsp; Tgl ${renderBoxedDigits('', 2)} Bln ${renderBoxedDigits('', 2)} Thn ${renderBoxedDigits('', 4)}</td></tr>
      <tr>
        <td style="padding: 1px 3px;">36. Alamat</td>
        <td style="padding: 1px 3px;">
          ${alamatIstri || '&nbsp;'} &nbsp;&nbsp; RT ${renderBoxedDigits(rtIstri, 2)} RW ${renderBoxedDigits(rwIstri, 2)} &nbsp;&nbsp; Kode Pos ${renderBoxedDigits('53254', 5)} Telepon ${renderBoxedDigits('', 10)}<br/>
          <table style="width: 100%; border-collapse: collapse; font-size: 5.8pt; margin-top: 1px;">
            <tr><td style="width: 50%;">a. Desa/Kelurahan : ${namaDesa}</td><td style="width: 50%;">c. Kab./Kota : ${namaKab}</td></tr>
            <tr><td>b. Kecamatan : ${namaKec}</td><td>d. Propinsi : ${namaProv}</td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 3px;">37. Pendidikan Terakhir</td>
        <td style="padding: 1px 3px;">
          ${renderSingleBox('8')} &nbsp;&nbsp;
          1. Tidak/Belum Sekolah &nbsp; 2. Belum Tamat SD &nbsp; 3. SD/Sederajat &nbsp; 4. SLTP/Sederajat &nbsp; 5. SLTA/Sederajat<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 6. Diploma I/II &nbsp; 7. Akademi/Diploma III/S. Muda &nbsp; 8. Diploma IV/Strata I &nbsp; 9. Strata II &nbsp; 10. Strata III
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 3px;">38. Agama/Penghayat Kepercayaan</td>
        <td style="padding: 1px 3px;">
          ${renderSingleBox('1')} &nbsp;&nbsp;
          1. Islam &nbsp; 2. Kristen &nbsp; 3. Katholik &nbsp; 4. Hindu &nbsp; 5. Budha &nbsp; 6. Khonghucu &nbsp; 7. Penghayat Kepercayaan &nbsp; 8. Lainnya
        </td>
      </tr>
      <tr><td style="padding: 1px 3px;">39. Nama Organisasi Penghayat Kepercayaan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">40. Pekerjaan</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 2, '11px', '12px')} &nbsp; Lihat tata cara pengisian formulir X JENIS PEKERJAAN No. 1 s/d 88</td></tr>
      <tr><td style="padding: 1px 3px;">41. Anak ke</td><td style="padding: 1px 3px;">${renderBoxedDigits('1', 2, '11px', '12px')}</td></tr>
      <tr><td style="padding: 1px 3px;">42. Status Perkawinan Sebelum Nikah</td><td style="padding: 1px 3px;">${renderSingleBox('1')} &nbsp;&nbsp; 1. Blm Kawin &nbsp;&nbsp; 2. Kawin &nbsp;&nbsp; 3. Cerai Hidup &nbsp;&nbsp; 4. Cerai Mati</td></tr>
      <tr><td style="padding: 1px 3px;">43. Perkawinan Yang Ke</td><td style="padding: 1px 3px;">${renderSingleBox('1')}</td></tr>
      <tr><td style="padding: 1px 3px;">44. Kewarganegaraan</td><td style="padding: 1px 3px;">${renderSingleBox('1')} &nbsp;&nbsp; 1. WNI &nbsp;&nbsp; 2. WNA</td></tr>
      <tr><td style="padding: 1px 3px;">45. Kebangsaan (bagi WNA)</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
    </table>

    <!-- V. DATA AYAH DARI ISTRI -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">V. DATA AYAH DARI ISTRI</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 155px; padding: 1px 3px;">46. Nomor Induk Kependudukan (NIK)</td><td style="padding: 1px 3px;">${renderBoxedDigits(nikAyahIstri, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">47. Nama Lengkap</td><td style="padding: 1px 3px; font-weight: bold;">${namaAyahIstri || '&nbsp;'}</td></tr>
      <tr>
        <td style="padding: 1px 3px;">48. Agama/Penghayat Kepercayaan</td>
        <td style="padding: 1px 3px;">
          ${renderSingleBox('1')} &nbsp;&nbsp;
          1. Islam &nbsp; 2. Kristen &nbsp; 3. Katholik &nbsp; 4. Hindu &nbsp; 5. Budha &nbsp; 6. Khonghucu &nbsp; 7. Penghayat Kepercayaan &nbsp; 8. Lainnya
        </td>
      </tr>
      <tr><td style="padding: 1px 3px;">49. Nama Organisasi Penghayat Kepercayaan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">50. Tempat/Tanggal Lahir</td><td style="padding: 1px 3px;">${namaKab} &nbsp;&nbsp;&nbsp;&nbsp; Tgl ${renderBoxedDigits('', 2)} Bln ${renderBoxedDigits('', 2)} Thn ${renderBoxedDigits('', 4)}</td></tr>
      <tr>
        <td style="padding: 1px 3px;">51. Alamat</td>
        <td style="padding: 1px 3px;">
          ${alamatIstri || '&nbsp;'} &nbsp;&nbsp; RT ${renderBoxedDigits(rtIstri, 2)} RW ${renderBoxedDigits(rwIstri, 2)} &nbsp;&nbsp; Kode Pos ${renderBoxedDigits('53254', 5)} Telepon ${renderBoxedDigits('', 10)}<br/>
          <table style="width: 100%; border-collapse: collapse; font-size: 5.8pt; margin-top: 1px;">
            <tr><td style="width: 50%;">a. Desa/Kelurahan : ${namaDesa}</td><td style="width: 50%;">c. Kab./Kota : ${namaKab}</td></tr>
            <tr><td>b. Kecamatan : ${namaKec}</td><td>d. Propinsi : ${namaProv}</td></tr>
          </table>
        </td>
      </tr>
      <tr><td style="padding: 1px 3px;">52. Pekerjaan</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 2, '11px', '12px')} &nbsp; Lihat tata cara pengisian formulir X JENIS PEKERJAAN No. 1 s/d 88</td></tr>
    </table>

    <!-- VI. DATA IBU DARI ISTRI -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">VI. DATA IBU DARI ISTRI</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 2px; border: 1px solid #000;" border="1">
      <tr><td style="width: 155px; padding: 1px 3px;">53. Nomor Induk Kependudukan (NIK)</td><td style="padding: 1px 3px;">${renderBoxedDigits(nikIbuIstri, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">54. Nama Lengkap</td><td style="padding: 1px 3px; font-weight: bold;">${namaIbuIstri || '&nbsp;'}</td></tr>
      <tr>
        <td style="padding: 1px 3px;">55. Agama/Penghayat Kepercayaan</td>
        <td style="padding: 1px 3px;">
          ${renderSingleBox('1')} &nbsp;&nbsp;
          1. Islam &nbsp; 2. Kristen &nbsp; 3. Katholik &nbsp; 4. Hindu &nbsp; 5. Budha &nbsp; 6. Khonghucu &nbsp; 7. Penghayat Kepercayaan &nbsp; 8. Lainnya
        </td>
      </tr>
      <tr><td style="padding: 1px 3px;">56. Nama Organisasi Penghayat Kepercayaan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">57. Tempat/Tanggal Lahir</td><td style="padding: 1px 3px;">${namaKab} &nbsp;&nbsp;&nbsp;&nbsp; Tgl ${renderBoxedDigits('', 2)} Bln ${renderBoxedDigits('', 2)} Thn ${renderBoxedDigits('', 4)}</td></tr>
      <tr>
        <td style="padding: 1px 3px;">58. Alamat</td>
        <td style="padding: 1px 3px;">
          ${alamatIstri || '&nbsp;'} &nbsp;&nbsp; RT ${renderBoxedDigits(rtIstri, 2)} RW ${renderBoxedDigits(rwIstri, 2)} &nbsp;&nbsp; Kode Pos ${renderBoxedDigits('53254', 5)} Telepon ${renderBoxedDigits('', 10)}<br/>
          <table style="width: 100%; border-collapse: collapse; font-size: 5.8pt; margin-top: 1px;">
            <tr><td style="width: 50%;">a. Desa/Kelurahan : ${namaDesa}</td><td style="width: 50%;">c. Kab./Kota : ${namaKab}</td></tr>
            <tr><td>b. Kecamatan : ${namaKec}</td><td>d. Propinsi : ${namaProv}</td></tr>
          </table>
        </td>
      </tr>
      <tr><td style="padding: 1px 3px;">59. Pekerjaan</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 2, '11px', '12px')} &nbsp; Lihat tata cara pengisian formulir X JENIS PEKERJAAN No. 1 s/d 88</td></tr>
    </table>
    <div style="text-align: right; font-weight: bold; font-size: 7pt; margin-top: 1px;">241</div>
  </div>`;

  // ==================== HALAMAN 3 (242) ====================
  const page3 = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.2pt; line-height: 1.15; color: #000; width: 100%; box-sizing: border-box; border: 1px solid #000; padding: 4px;">
    <!-- VII. DATA SAKSI -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">VII. DATA SAKSI</div>
    <div style="font-weight: bold; font-size: 6pt; margin-left: 4px; margin-bottom: 1px;">DATA SAKSI I</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 155px; padding: 1px 3px;">60. Nomor Induk Kependudukan (NIK)</td><td style="padding: 1px 3px;">${renderBoxedDigits(nikSaksi1, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">61. Nama Lengkap</td><td style="padding: 1px 3px; font-weight: bold;">${namaSaksi1 || '&nbsp;'}</td></tr>
      <tr><td style="padding: 1px 3px;">62. Tempat/Tanggal Lahir</td><td style="padding: 1px 3px;">${namaKab} &nbsp;&nbsp;&nbsp;&nbsp; Tgl ${renderBoxedDigits('', 2)} Bln ${renderBoxedDigits('', 2)} Thn ${renderBoxedDigits('', 4)}</td></tr>
      <tr>
        <td style="padding: 1px 3px;">63. Agama/Penghayat Kepercayaan</td>
        <td style="padding: 1px 3px;">
          ${renderSingleBox('1')} &nbsp;&nbsp;
          1. Islam &nbsp; 2. Kristen &nbsp; 3. Katholik &nbsp; 4. Hindu &nbsp; 5. Budha &nbsp; 6. Khonghucu &nbsp; 7. Penghayat Kepercayaan &nbsp; 8. Lainnya
        </td>
      </tr>
      <tr><td style="padding: 1px 3px;">64. Nama Organisasi Penghayat Kepercayaan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr>
        <td style="padding: 1px 3px;">65. Alamat</td>
        <td style="padding: 1px 3px;">
          ${namaDesa} &nbsp;&nbsp; RT ${renderBoxedDigits('', 2)} RW ${renderBoxedDigits('', 2)} &nbsp;&nbsp; Kode Pos ${renderBoxedDigits('53254', 5)} Telepon ${renderBoxedDigits('', 10)}<br/>
          <table style="width: 100%; border-collapse: collapse; font-size: 5.8pt; margin-top: 1px;">
            <tr><td style="width: 50%;">a. Desa/Kelurahan : ${namaDesa}</td><td style="width: 50%;">c. Kab./Kota : ${namaKab}</td></tr>
            <tr><td>b. Kecamatan : ${namaKec}</td><td>d. Propinsi : ${namaProv}</td></tr>
          </table>
        </td>
      </tr>
      <tr><td style="padding: 1px 3px;">66. Pekerjaan</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 2, '11px', '12px')} &nbsp; Lihat tata cara pengisian formulir X JENIS PEKERJAAN No. 1 s/d 88</td></tr>
    </table>

    <div style="font-weight: bold; font-size: 6pt; margin-left: 4px; margin-bottom: 1px;">DATA SAKSI II</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
      <tr><td style="width: 155px; padding: 1px 3px;">67. Nomor Induk Kependudukan (NIK)</td><td style="padding: 1px 3px;">${renderBoxedDigits(nikSaksi2, 16)}</td></tr>
      <tr><td style="padding: 1px 3px;">68. Nama Lengkap</td><td style="padding: 1px 3px; font-weight: bold;">${namaSaksi2 || '&nbsp;'}</td></tr>
      <tr><td style="padding: 1px 3px;">69. Tempat/Tanggal Lahir</td><td style="padding: 1px 3px;">${namaKab} &nbsp;&nbsp;&nbsp;&nbsp; Tgl ${renderBoxedDigits('', 2)} Bln ${renderBoxedDigits('', 2)} Thn ${renderBoxedDigits('', 4)}</td></tr>
      <tr>
        <td style="padding: 1px 3px;">70. Agama/Penghayat Kepercayaan</td>
        <td style="padding: 1px 3px;">
          ${renderSingleBox('1')} &nbsp;&nbsp;
          1. Islam &nbsp; 2. Kristen &nbsp; 3. Katholik &nbsp; 4. Hindu &nbsp; 5. Budha &nbsp; 6. Khonghucu &nbsp; 7. Penghayat Kepercayaan &nbsp; 8. Lainnya
        </td>
      </tr>
      <tr><td style="padding: 1px 3px;">71. Nama Organisasi Penghayat Kepercayaan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr>
        <td style="padding: 1px 3px;">72. Alamat</td>
        <td style="padding: 1px 3px;">
          ${namaDesa} &nbsp;&nbsp; RT ${renderBoxedDigits('', 2)} RW ${renderBoxedDigits('', 2)} &nbsp;&nbsp; Kode Pos ${renderBoxedDigits('53254', 5)} Telepon ${renderBoxedDigits('', 10)}<br/>
          <table style="width: 100%; border-collapse: collapse; font-size: 5.8pt; margin-top: 1px;">
            <tr><td style="width: 50%;">a. Desa/Kelurahan : ${namaDesa}</td><td style="width: 50%;">c. Kab./Kota : ${namaKab}</td></tr>
            <tr><td>b. Kecamatan : ${namaKec}</td><td>d. Propinsi : ${namaProv}</td></tr>
          </table>
        </td>
      </tr>
      <tr><td style="padding: 1px 3px;">73. Pekerjaan</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 2, '11px', '12px')} &nbsp; Lihat tata cara pengisian formulir X JENIS PEKERJAAN No. 1 s/d 88</td></tr>
    </table>

    <!-- VIII. DATA PERKAWINAN -->
    <div style="font-weight: bold; font-size: 6.5pt; margin-bottom: 1px;">VIII. DATA PERKAWINAN</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 2px; border: 1px solid #000;" border="1">
      <tr><td style="width: 155px; padding: 1px 3px;">74. Tanggal Pemberkatan Perkawinan</td><td style="padding: 1px 3px;">Tgl ${renderBoxedDigits('', 2)} Bln ${renderBoxedDigits('', 2)} Thn ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">75. Hari, Tanggal, Bulan dan Tahun Melapor</td><td style="padding: 1px 3px;">Hari : Senin &nbsp;&nbsp;&nbsp;&nbsp; Tgl ${renderBoxedDigits('', 2)} Bln ${renderBoxedDigits('', 2)} Thn ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">76. Pukul</td><td style="padding: 1px 3px;">09:00 WIB</td></tr>
      <tr>
        <td style="padding: 1px 3px;">77. Agama/Penghayat Kepercayaan</td>
        <td style="padding: 1px 3px;">
          ${renderSingleBox('1')} &nbsp;&nbsp;
          1. Islam &nbsp; 2. Kristen &nbsp; 3. Katholik &nbsp; 4. Hindu &nbsp; 5. Budha &nbsp; 6. Khonghucu &nbsp; 7. Penghayat Kepercayaan &nbsp; 8. Lainnya
        </td>
      </tr>
      <tr><td style="padding: 1px 3px;">78. Nama Organisasi Penghayat Kepercayaan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">79. Nama Badan Peradilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">80. Nomor Putusan Penetapan Pengadilan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">81. Tanggal Putusan Penetapan Pengadilan</td><td style="padding: 1px 3px;">Tgl ${renderBoxedDigits('', 2)} Bln ${renderBoxedDigits('', 2)} Thn ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1px 3px;">82. Nama Pemuka Agama/Pghyt Kepercayaan</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">83. Ijin Perwakilan bagi WNA / Nomor</td><td style="padding: 1px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1px 3px;">84. Jumlah Anak Yang Telah Diakui dan Disahkan</td><td style="padding: 1px 3px;">${renderBoxedDigits('', 2, '11px', '12px')}</td></tr>
      <tr>
        <td style="padding: 1px 3px;">85. Nama Anak</td>
        <td style="padding: 1px 3px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 5.8pt;" border="1">
            <tr><td style="width: 20px; text-align: center;">1.</td><td>&nbsp;</td></tr>
            <tr><td style="text-align: center;">2.</td><td>&nbsp;</td></tr>
            <tr><td style="text-align: center;">3.</td><td>&nbsp;</td></tr>
            <tr><td style="text-align: center;">4.</td><td>&nbsp;</td></tr>
            <tr><td style="text-align: center;">5.</td><td>&nbsp;</td></tr>
            <tr><td style="text-align: center;">6.</td><td>&nbsp;</td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 3px;">86. No, Tgl. Akta Kelahiran</td>
        <td style="padding: 1px 3px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 5.8pt;" border="1">
            <tr><td style="width: 50%;">1. No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>Tgl. ${renderBoxedDigits('', 2)} ${renderBoxedDigits('', 2)} ${renderBoxedDigits('', 4)}</td></tr>
            <tr><td>2. No.</td><td>Tgl. ${renderBoxedDigits('', 2)} ${renderBoxedDigits('', 2)} ${renderBoxedDigits('', 4)}</td></tr>
            <tr><td>3. No.</td><td>Tgl. ${renderBoxedDigits('', 2)} ${renderBoxedDigits('', 2)} ${renderBoxedDigits('', 4)}</td></tr>
            <tr><td>4. No.</td><td>Tgl. ${renderBoxedDigits('', 2)} ${renderBoxedDigits('', 2)} ${renderBoxedDigits('', 4)}</td></tr>
            <tr><td>5. No.</td><td>Tgl. ${renderBoxedDigits('', 2)} ${renderBoxedDigits('', 2)} ${renderBoxedDigits('', 4)}</td></tr>
            <tr><td>6. No.</td><td>Tgl. ${renderBoxedDigits('', 2)} ${renderBoxedDigits('', 2)} ${renderBoxedDigits('', 4)}</td></tr>
          </table>
        </td>
      </tr>
    </table>
    <div style="text-align: right; font-weight: bold; font-size: 7pt; margin-top: 1px;">242</div>
  </div>`;

  // ==================== HALAMAN 4 (243) ====================
  const page4 = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.2pt; line-height: 1.15; color: #000; width: 100%; box-sizing: border-box; border: 1px solid #000; padding: 4px;">
    <!-- DATA ADMINISTRASI -->
    <div style="border: 1px solid #000; padding: 2px 4px; display: inline-block; font-weight: bold; font-size: 6.5pt; margin-bottom: 2px;">
      DATA ADMINISTRASI
    </div>
    <div style="font-style: italic; font-size: 5.8pt; margin-bottom: 2px;">Hanya Diisi oleh petugas</div>

    <!-- 87. Persyaratan -->
    <div style="border: 1px solid #000; padding: 3px; margin-bottom: 4px;">
      <div style="font-weight: bold; margin-bottom: 2px;">87. Persyaratan</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 5.8pt;">
        <tr><td style="padding: 1px 0;">${renderCheckbox(false, 'Surat Keterangan Perkawinan dari Pemuka Agama / Penghayat Kepercayaan / Salinan Penetapan Pengadilan')}</td></tr>
        <tr><td style="padding: 1px 0;">${renderCheckbox(false, 'Fotocopy Kutipan Akta Kelahiran')}</td></tr>
        <tr><td style="padding: 1px 0;">${renderCheckbox(true, 'Surat Keterangan dari Desa/Kelurahan')}</td></tr>
        <tr><td style="padding: 1px 0;">${renderCheckbox(true, 'Fotocopy KTP/KK yang Dilegalisir Pejabat yang Berwenang')}</td></tr>
        <tr><td style="padding: 1px 0;">${renderCheckbox(false, 'Pas Photo Berdampingan ukuran 4x6 cm sebanyak 3 (tiga) lembar')}</td></tr>
        <tr><td style="padding: 1px 0;">${renderCheckbox(true, '2 (dua) orang saksi yang telah berusia 21 tahun keatas')}</td></tr>
        <tr><td style="padding: 1px 0;">${renderCheckbox(false, 'Fotocopy Kutipan Akta Kelahiran Anak yang akan diakui / disyahkan.')}</td></tr>
        <tr><td style="padding: 1px 0;">${renderCheckbox(false, 'Fotocopy Akta Perceraian/Kematian jika yang bersangkutan telah pernah kawin')}</td></tr>
        <tr><td style="padding: 1px 0;">${renderCheckbox(false, 'Ijin dari Komandan bagi anggota TNI/POLRI')}</td></tr>
        <tr><td style="padding: 1px 0;">${renderCheckbox(false, 'Perjanjian Perkawinan')}</td></tr>
        <tr><td style="padding: 1px 0;">${renderCheckbox(false, 'STMD dari Kepolisian')}</td></tr>
        <tr><td style="padding: 1px 0;">${renderCheckbox(false, 'Surat ijin dari Isteri bagi yang berpoligami.')}</td></tr>
        <tr><td style="padding: 1px 0;">${renderCheckbox(false, 'Surat ijin dari Pengadilan Negeri bagi yang berpoligami.')}</td></tr>
        <tr><td style="padding: 1px 0;">${renderCheckbox(false, 'Surat ijin dari Perwakilan Negara Asing yang bersangkutan')}</td></tr>
        <tr><td style="padding: 1px 0;">${renderCheckbox(false, 'Paspor / dokumen Keimigrasian')}</td></tr>
        <tr><td style="padding: 1px 0;">${renderCheckbox(false, 'SKTT dari Dinas Kependudukan dan Catatan Sipil')}</td></tr>
      </table>
    </div>

    <!-- 88 - 92 Data Akta & Petugas -->
    <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 6px; border: 1px solid #000;" border="1">
      <tr><td style="width: 170px; padding: 1.5px 3px;">88. Nomor Akta Perkawinan</td><td style="padding: 1.5px 3px;">&nbsp;</td></tr>
      <tr><td style="padding: 1.5px 3px;">89. Tanggal Akta Perkawinan</td><td style="padding: 1.5px 3px;">Tgl ${renderBoxedDigits('', 2)} Bln ${renderBoxedDigits('', 2)} Thn ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1.5px 3px;">90. Tanggal Cetak Kutipan Akta</td><td style="padding: 1.5px 3px;">Tgl ${renderBoxedDigits('', 2)} Bln ${renderBoxedDigits('', 2)} Thn ${renderBoxedDigits('', 4)}</td></tr>
      <tr><td style="padding: 1.5px 3px;">91. Nama Petugas Entri Data</td><td style="padding: 1.5px 3px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; NIP : ${renderBoxedDigits('', 18)}</td></tr>
      <tr><td style="padding: 1.5px 3px;">92. Tanggal Entri Data</td><td style="padding: 1.5px 3px;">Tgl ${renderBoxedDigits('', 2)} Bln ${renderBoxedDigits('', 2)} Thn ${renderBoxedDigits('', 4)}</td></tr>
    </table>

    <!-- Tanda Tangan 93 - 97 -->
    <div style="text-align: right; margin-bottom: 4px; font-size: 6.2pt; padding-right: 20px;">
      93. ${namaDesa}, .................................... 20....
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 6.2pt; text-align: center; margin-bottom: 6px;">
      <tr>
        <td style="width: 33%; vertical-align: top;">
          Mengetahui,<br/>
          Kepala 94....................................<br/>
          <div style="height: 45px;"></div>
          95 ( ........................................................... )<br/>
          (Nama Jelas/NIP)
        </td>
        <td style="width: 34%; vertical-align: top;">
          <br/>
          Petugas Pencatat<br/>
          <div style="height: 45px;"></div>
          96 ( ........................................................... )<br/>
          (Nama Jelas/NIP)
        </td>
        <td style="width: 33%; vertical-align: top;">
          <br/>
          Pelapor<br/>
          <div style="height: 45px;"></div>
          97 ( ${namaSuami || namaIstri || '...........................................................'} )<br/>
          (Nama Jelas)
        </td>
      </tr>
    </table>
    <div style="text-align: right; font-weight: bold; font-size: 7pt; margin-top: 2px;">243</div>
  </div>`;

  return [page1, page2, page3, page4].join('\\n<!-- PAGE_BREAK -->\\n');
}
