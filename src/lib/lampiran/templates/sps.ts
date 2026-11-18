import { formatTanggalIndonesia, hitungUmurIndonesia, type OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildSpsPortraitHtml(ctx?: OpenSidRenderContext): string {
  const ind = ctx?.individu || {};
  const fv = ctx?.formValues || {};
  const ayah = ctx?.pelakuBagian?.ayah || {};
  const ibu = ctx?.pelakuBagian?.ibu || {};
  const pasangan = ctx?.pelakuBagian?.pasangan || ctx?.pelakuBagian?.calon_pasangan || {};
  const wali = ctx?.pelakuBagian?.wali || {};
  const saksi1 = ctx?.pelakuBagian?.saksi_1 || ctx?.pelakuBagian?.saksi1 || {};
  const saksi2 = ctx?.pelakuBagian?.saksi_2 || ctx?.pelakuBagian?.saksi2 || {};

  const namaDesa = (ctx?.namaDesa || 'Sampeldes').toUpperCase();
  const namaDesaTitle = ctx?.namaDesa || 'Sampeldes';
  const namaKecamatan = (ctx?.namaKecamatan || 'Gandrungmangu').toUpperCase();
  const namaKabupaten = (ctx?.namaKabupaten || 'Cilacap').toUpperCase();
  const tanggalSurat = ctx?.tanggalSurat || formatTanggalIndonesia(new Date());
  const namaKades = (ctx?.namaPamong || ctx?.namaKepalaDesa || 'TUKIMAN').toUpperCase();

  // Data Pemohon
  const namaPemohon = (ind.nama || 'AHMAD FAUZI SETIAWAN').toUpperCase();
  const nikPemohon = ind.nik || '3301101708940002';
  const jenisKelaminPemohon = ind.jenis_kelamin || 'Laki-laki';
  const isPemohonLaki = !jenisKelaminPemohon.toLowerCase().includes('perempuan');
  const tempatLahirPemohon = ind.tempat_lahir || 'Cilacap';
  const tglLahirPemohon = ind.tanggal_lahir ? formatTanggalIndonesia(ind.tanggal_lahir) : '17 Agustus 1994';
  const ttlPemohon = `${tempatLahirPemohon}, ${tglLahirPemohon}`;
  const wnPemohon = ind.warga_negara || 'WNI';
  const agamaPemohon = ind.agama || 'Islam';
  const pekerjaanPemohon = ind.pekerjaan || 'Karyawan Swasta';
  const pendidikanPemohon = fv.form_pendidikan_pemohon || ind.pendidikan_kk || 'SLTA / Sederajat';
  const alamatPemohon =
    ind.alamat ||
    `Dusun ${ind.dusun || namaDesaTitle} RT ${ind.rt || '002'} / RW ${ind.rw || '001'} Desa ${namaDesaTitle} Kec. ${ctx?.namaKecamatan || 'Gandrungmangu'} Kab. ${ctx?.namaKabupaten || 'Cilacap'}`;
  const statusPemohon =
    fv.form_status_perkawinan_catin ||
    fv.form_status_kawin ||
    ind.status_kawin ||
    (isPemohonLaki ? 'Jejaka' : 'Perawan');

  const namaAyahPemohon = (ayah.nama || fv.form_nama_ayah || ind.nama_ayah || 'H. SUPRIYADI').toUpperCase();
  const namaIbuPemohon = (ibu.nama || fv.form_nama_ibu || ind.nama_ibu || 'HJ. SUMIATI').toUpperCase();

  // Data Calon Pasangan
  const namaPasangan = (
    pasangan.nama ||
    fv.form_nama_calon_pasangan ||
    fv.form_nama_pasangan ||
    (isPemohonLaki ? 'SITI NUR AISYAH' : 'AHMAD FAUZI SETIAWAN')
  ).toUpperCase();
  const binPasangan = (
    fv.form_bin_calon_pasangan ||
    fv.form_nama_ayah_pasangan ||
    pasangan.nama_ayah ||
    'H. ABDUL KARIM'
  ).toUpperCase();
  const ibuPasangan = (
    fv.form_nama_ibu_pasangan ||
    pasangan.nama_ibu ||
    'HJ. SITI AMINAH'
  ).toUpperCase();
  const nikPasangan =
    pasangan.nik ||
    fv.form_nik_calon_pasangan ||
    fv.form_nik_pasangan ||
    '3301105509960003';
  const tempatLahirPasangan =
    pasangan.tempat_lahir ||
    fv.form_tempat_lahir_pasangan ||
    'Cilacap';
  const tglLahirPasangan =
    pasangan.tanggal_lahir
      ? formatTanggalIndonesia(pasangan.tanggal_lahir)
      : fv.form_tanggal_lahir_pasangan
        ? formatTanggalIndonesia(fv.form_tanggal_lahir_pasangan)
        : '15 September 1996';
  const ttlPasangan = `${tempatLahirPasangan}, ${tglLahirPasangan}`;
  const wnPasangan = pasangan.warga_negara || fv.form_warga_negara_pasangan || 'WNI';
  const agamaPasangan = pasangan.agama || fv.form_agama_pasangan || 'Islam';
  const pekerjaanPasangan = pasangan.pekerjaan || fv.form_pekerjaan_pasangan || 'Karyawan Swasta';
  const pendidikanPasangan = fv.form_pendidikan_pasangan || pasangan.pendidikan_kk || 'SLTA / Sederajat';
  const alamatPasangan =
    pasangan.alamat ||
    fv.form_alamat_pasangan ||
    `Dusun ${namaDesaTitle} RT 003 / RW 002 Desa ${namaDesaTitle} Kec. ${ctx?.namaKecamatan || 'Gandrungmangu'} Kab. ${ctx?.namaKabupaten || 'Cilacap'}`;

  // Susun Calon Suami & Calon Istri untuk Halaman 2 SPS
  const suami = isPemohonLaki
    ? {
      nama: namaPemohon,
      ttl: ttlPemohon,
      nik: nikPemohon,
      wn: wnPemohon,
      agama: agamaPemohon,
      pekerjaan: pekerjaanPemohon,
      pendidikan: pendidikanPemohon,
      alamat: alamatPemohon,
      ayah: namaAyahPemohon,
      ibu: namaIbuPemohon,
    }
    : {
      nama: namaPasangan,
      ttl: ttlPasangan,
      nik: nikPasangan,
      wn: wnPasangan,
      agama: agamaPasangan,
      pekerjaan: pekerjaanPasangan,
      pendidikan: pendidikanPasangan,
      alamat: alamatPasangan,
      ayah: binPasangan,
      ibu: ibuPasangan,
    };

  const istri = !isPemohonLaki
    ? {
      nama: namaPemohon,
      ttl: ttlPemohon,
      nik: nikPemohon,
      wn: wnPemohon,
      agama: agamaPemohon,
      pekerjaan: pekerjaanPemohon,
      pendidikan: pendidikanPemohon,
      alamat: alamatPemohon,
      ayah: namaAyahPemohon,
      ibu: namaIbuPemohon,
    }
    : {
      nama: namaPasangan,
      ttl: ttlPasangan,
      nik: nikPasangan,
      wn: wnPasangan,
      agama: agamaPasangan,
      pekerjaan: pekerjaanPasangan,
      pendidikan: pendidikanPasangan,
      alamat: alamatPasangan,
      ayah: binPasangan,
      ibu: ibuPasangan,
    };

  // Data Wali Nikah
  const namaWali = (
    wali.nama ||
    fv.form_nama_wali_nikah ||
    fv.form_nama_wali ||
    istri.ayah ||
    'H. ABDUL KARIM'
  ).toUpperCase();
  const hubunganWali =
    fv.form_hubungan_wali_nikah ||
    fv.form_hubungan_wali ||
    'Ayah Kandung';
  const binWali = (
    fv.form_bin_wali_nikah ||
    fv.form_bin_wali ||
    'H. AHMAD DAHLAN'
  ).toUpperCase();
  const tempatLahirWali = wali.tempat_lahir || fv.form_tempat_lahir_wali_nikah || 'Cilacap';
  const tglLahirWali = wali.tanggal_lahir
    ? formatTanggalIndonesia(wali.tanggal_lahir)
    : fv.form_tanggal_lahir_wali_nikah
      ? formatTanggalIndonesia(fv.form_tanggal_lahir_wali_nikah)
      : '10 Maret 1966';
  const ttlWali = `${tempatLahirWali}, ${tglLahirWali}`;
  const agamaWali = wali.agama || fv.form_agama_wali_nikah || 'Islam';
  const pekerjaanWali = wali.pekerjaan || fv.form_pekerjaan_wali_nikah || 'Wiraswasta';
  const alamatWali = wali.alamat || fv.form_alamat_wali_nikah || istri.alamat;
  const masKawin = fv.form_mas_kawin || 'Seperangkat Alat Sholat dan Perhiasan Emas 5 Gram Tunai';

  // Data Saksi 1 & Saksi 2
  const namaSaksi1 = (
    saksi1.nama ||
    fv.form_nama_saksi_1 ||
    fv.form_nama_saksi_i ||
    fv.nama_saksi_1 ||
    'SLAMET RIYADI'
  ).toUpperCase();
  const nikSaksi1 =
    saksi1.nik ||
    fv.form_nik_saksi_1 ||
    fv.form_nik_saksi_i ||
    fv.nik_saksi_1 ||
    '3301101203750001';
  const tempatLahirSaksi1 = saksi1.tempat_lahir || fv.form_tempat_lahir_saksi_1 || 'Cilacap';
  const rawTglSaksi1 = saksi1.tanggal_lahir || fv.form_tanggal_lahir_saksi_1 || '1975-03-12';
  const tglLahirSaksi1 = formatTanggalIndonesia(rawTglSaksi1);
  const umurSaksi1 = fv.form_umur_saksi_1 || hitungUmurIndonesia(rawTglSaksi1);
  const agamaSaksi1 = saksi1.agama || fv.form_agama_saksi_1 || 'Islam';
  const pekerjaanSaksi1 = saksi1.pekerjaan || fv.form_pekerjaan_saksi_1 || 'Wiraswasta';
  const alamatSaksi1 =
    saksi1.alamat ||
    fv.form_alamat_saksi_1 ||
    `Desa ${namaDesaTitle} RT ${ind.rt || '002'} / RW ${ind.rw || '001'} Kec. ${ctx?.namaKecamatan || 'Gandrungmangu'}`;
  const jabatanSaksi1 = fv.form_jabatan_saksi_1 || `Ketua RT ${ind.rt || '002'}`;

  const namaSaksi2 = (
    saksi2.nama ||
    fv.form_nama_saksi_2 ||
    fv.form_nama_saksi_ii ||
    fv.nama_saksi_2 ||
    'BAMBANG SUTRISNO'
  ).toUpperCase();
  const nikSaksi2 =
    saksi2.nik ||
    fv.form_nik_saksi_2 ||
    fv.form_nik_saksi_ii ||
    fv.nik_saksi_2 ||
    '3301102407720002';
  const tempatLahirSaksi2 = saksi2.tempat_lahir || fv.form_tempat_lahir_saksi_2 || 'Cilacap';
  const rawTglSaksi2 = saksi2.tanggal_lahir || fv.form_tanggal_lahir_saksi_2 || '1972-07-24';
  const tglLahirSaksi2 = formatTanggalIndonesia(rawTglSaksi2);
  const umurSaksi2 = fv.form_umur_saksi_2 || hitungUmurIndonesia(rawTglSaksi2);
  const agamaSaksi2 = saksi2.agama || fv.form_agama_saksi_2 || 'Islam';
  const pekerjaanSaksi2 = saksi2.pekerjaan || fv.form_pekerjaan_saksi_2 || 'Perangkat Desa';
  const alamatSaksi2 =
    saksi2.alamat ||
    fv.form_alamat_saksi_2 ||
    `Desa ${namaDesaTitle} RT ${ind.rt || '002'} / RW ${ind.rw || '001'} Kec. ${ctx?.namaKecamatan || 'Gandrungmangu'}`;
  const jabatanSaksi2 = fv.form_jabatan_saksi_2 || `Ketua RW ${ind.rw || '001'}`;

  // Format pencoretan status yang tidak sesuai
  const sLower = statusPemohon.toLowerCase();
  const labelPerawan = sLower.includes('perawan') ? '<strong>Perawan</strong>' : '<span style="text-decoration: line-through;">Perawan</span>';
  const labelJejaka = sLower.includes('jejaka') || sLower.includes('belum') ? '<strong>Jejaka</strong>' : '<span style="text-decoration: line-through;">Jejaka</span>';
  const labelDuda = sLower.includes('duda') ? '<strong>Duda</strong>' : '<span style="text-decoration: line-through;">Duda</span>';
  const labelJanda = sLower.includes('janda') ? '<strong>Janda</strong>' : '<span style="text-decoration: line-through;">Janda</span>';

  return `<div style="font-family: 'Times New Roman', Times, serif; font-size: 9.5pt; line-height: 1.24; color: #000;">
  <!-- HALAMAN 1: SURAT PERNYATAAN BELUM MENIKAH / STATUS PERKAWINAN -->
  <div style="text-align: center; font-weight: bold; font-size: 11.5pt; text-decoration: underline; margin-bottom: 6px; letter-spacing: 0.3px;">
    SURAT PERNYATAAN BELUM MENIKAH
  </div>

  <p style="margin: 0 0 4px 0;">Yang bertanda tangan di bawah ini, saya :</p>

  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-left: 10px; margin-bottom: 4px;">
    <tbody>
      <tr>
        <td style="width: 32%; padding: 0.8px 0;">1. Nama</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 66%; font-weight: bold;">${namaPemohon}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">2. NIK</td>
        <td style="text-align: center;">:</td>
        <td>${nikPemohon}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">3. Tempat/Tanggal Lahir</td>
        <td style="text-align: center;">:</td>
        <td>${ttlPemohon}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">4. Warga Negara</td>
        <td style="text-align: center;">:</td>
        <td>${wnPemohon}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">5. Agama</td>
        <td style="text-align: center;">:</td>
        <td>${agamaPemohon}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">6. Pekerjaan</td>
        <td style="text-align: center;">:</td>
        <td>${pekerjaanPemohon}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0; vertical-align: top;">7. Tempat Tinggal</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td>${alamatPemohon}</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 4px 0; text-align: justify;">
    Dengan ini menyatakan dengan sebenarnya dan berani diangkat sumpah sesuai dengan agama yang saya anut bahwa sampai saat ini (sebelum keluarnya surat pengantar nikah dari Desa/Kelurahan) saya benar-benar masih berstatus ${labelPerawan} / ${labelJejaka} / ${labelDuda} / ${labelJanda}*) dan akan menikah dengan :
  </p>

  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-left: 10px; margin-bottom: 4px;">
    <tbody>
      <tr>
        <td style="width: 32%; padding: 0.8px 0;">Nama</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 66%;"><strong>${namaPasangan}</strong> &nbsp;&nbsp; ${isPemohonLaki ? 'Binti' : 'Bin'} : <strong>${binPasangan}</strong></td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">NIK</td>
        <td style="text-align: center;">:</td>
        <td>${nikPasangan}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">Tempat/Tanggal Lahir</td>
        <td style="text-align: center;">:</td>
        <td>${ttlPasangan}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">Warga Negara</td>
        <td style="text-align: center;">:</td>
        <td>${wnPasangan}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">Agama</td>
        <td style="text-align: center;">:</td>
        <td>${agamaPasangan}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">Pekerjaan</td>
        <td style="text-align: center;">:</td>
        <td>${pekerjaanPasangan}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0; vertical-align: top;">Tempat Tinggal</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td>${alamatPasangan}</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 4px 0 2px 0; text-align: justify;">
    Surat pernyataan ini saya buat dihadapan dua orang saksi sebagai berikut :
  </p>
  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-left: 10px; margin-bottom: 4px;">
    <tbody>
      <tr>
        <td style="width: 55%; padding: 0.8px 0;">1. <strong>${namaSaksi1}</strong> (NIK: ${nikSaksi1})</td>
        <td style="width: 45%; padding: 0.8px 0;">(${jabatanSaksi1})</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">2. <strong>${namaSaksi2}</strong> (NIK: ${nikSaksi2})</td>
        <td style="padding: 0.8px 0;">(${jabatanSaksi2})</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 3px 0 6px 0; text-align: justify;">
    Apabila pernyataan saya ini tidak benar, maka saya sanggup dituntut sesuai dengan hukum yang berlaku. Demikian untuk menjadikan periksa adanya.
  </p>

  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 4px;">
    <tbody>
      <tr>
        <td style="width: 52%; vertical-align: top; padding-right: 12px;">
          <div style="font-weight: bold; margin-bottom: 4px;">Saksi-saksi :</div>
          <div style="margin-bottom: 16px;">
            1. <strong>${namaSaksi1}</strong>
            <div style="margin-top: 14px;">( ................................................. )</div>
          </div>
          <div>
            2. <strong>${namaSaksi2}</strong>
            <div style="margin-top: 14px;">( ................................................. )</div>
          </div>
        </td>
        <td style="width: 48%; vertical-align: top; text-align: center;">
          <div>${namaDesaTitle}, ${tanggalSurat}</div>
          <div style="font-weight: bold;">Yang menyatakan,</div>
          <div style="height: 52px; display: flex; align-items: center; justify-content: center;">
            <span style="border: 1px dashed #666; padding: 4px 10px; font-size: 7.5pt; color: #555;">Materai 10.000</span>
          </div>
          <div style="font-weight: bold; text-decoration: underline;">${namaPemohon}</div>
        </td>
      </tr>
    </tbody>
  </table>

  <div style="text-align: center; font-size: 9.5pt; margin-top: 6px;">
    <div>Mengetahui :</div>
    <div style="font-weight: bold;">Kepala Desa ${namaDesaTitle}</div>
    <div style="height: 44px;"></div>
    <div style="font-weight: bold; text-decoration: underline;">${namaKades}</div>
  </div>

  <div style="font-size: 8pt; font-style: italic; margin-top: 4px;">
    Ket : *) Coret yang tidak perlu
  </div>
</div>
<!-- PAGE_BREAK -->
<div style="font-family: 'Times New Roman', Times, serif; font-size: 8.5pt; line-height: 1.2; color: #000;">
  <!-- HALAMAN 2: SURAT PERNYATAAN DATA CALON SUAMI, ISTERI, WALI DAN SAKSI -->
  <div style="text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 4px; line-height: 1.2;">
    SURAT PERNYATAAN<br />
    <span style="text-decoration: underline;">DATA CALON SUAMI, ISTERI, WALI DAN SAKSI</span>
  </div>

  <p style="margin: 0 0 3px 0; font-size: 8.5pt;">
    Yang bertanda tangan di bawah ini menyatakan sesungguhnya bahwa data yang tertera di bawah ini adalah benar :
  </p>

  <!-- I. DATA CALON SUAMI -->
  <div style="font-weight: bold; font-size: 9pt; margin-top: 2px; margin-bottom: 1px;">I. DATA CALON SUAMI</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-left: 8px; margin-bottom: 3px;">
    <tbody>
      <tr><td style="width: 33%; padding: 0.4px 0;">1. Nama Lengkap</td><td style="width: 2%; text-align: center;">:</td><td style="width: 65%; font-weight: bold;">${suami.nama}</td></tr>
      <tr><td style="padding: 0.4px 0;">2. Tempat / Tanggal Lahir</td><td style="text-align: center;">:</td><td>${suami.ttl}</td></tr>
      <tr><td style="padding: 0.4px 0;">3. Nomor KTP (NIK)</td><td style="text-align: center;">:</td><td>${suami.nik}</td></tr>
      <tr><td style="padding: 0.4px 0;">4. Kewarganegaraan</td><td style="text-align: center;">:</td><td>${suami.wn}</td></tr>
      <tr><td style="padding: 0.4px 0;">5. Agama</td><td style="text-align: center;">:</td><td>${suami.agama}</td></tr>
      <tr><td style="padding: 0.4px 0;">6. Pekerjaan</td><td style="text-align: center;">:</td><td>${suami.pekerjaan}</td></tr>
      <tr><td style="padding: 0.4px 0;">7. Pendidikan Terakhir</td><td style="text-align: center;">:</td><td>${suami.pendidikan}</td></tr>
      <tr><td style="padding: 0.4px 0; vertical-align: top;">8. Alamat</td><td style="text-align: center; vertical-align: top;">:</td><td>${suami.alamat}</td></tr>
      <tr><td style="padding: 0.4px 0;">9. Nama Ayah Kandung</td><td style="text-align: center;">:</td><td>${suami.ayah}</td></tr>
      <tr><td style="padding: 0.4px 0;">10. Nama Ibu Kandung</td><td style="text-align: center;">:</td><td>${suami.ibu}</td></tr>
    </tbody>
  </table>

  <!-- II. DATA CALON ISTRI -->
  <div style="font-weight: bold; font-size: 9pt; margin-top: 2px; margin-bottom: 1px;">II. DATA CALON ISTRI</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-left: 8px; margin-bottom: 3px;">
    <tbody>
      <tr><td style="width: 33%; padding: 0.4px 0;">1. Nama Lengkap</td><td style="width: 2%; text-align: center;">:</td><td style="width: 65%; font-weight: bold;">${istri.nama}</td></tr>
      <tr><td style="padding: 0.4px 0;">2. Tempat / Tanggal Lahir</td><td style="text-align: center;">:</td><td>${istri.ttl}</td></tr>
      <tr><td style="padding: 0.4px 0;">3. Nomor KTP (NIK)</td><td style="text-align: center;">:</td><td>${istri.nik}</td></tr>
      <tr><td style="padding: 0.4px 0;">4. Kewarganegaraan</td><td style="text-align: center;">:</td><td>${istri.wn}</td></tr>
      <tr><td style="padding: 0.4px 0;">5. Agama</td><td style="text-align: center;">:</td><td>${istri.agama}</td></tr>
      <tr><td style="padding: 0.4px 0;">6. Pekerjaan</td><td style="text-align: center;">:</td><td>${istri.pekerjaan}</td></tr>
      <tr><td style="padding: 0.4px 0;">7. Pendidikan Terakhir</td><td style="text-align: center;">:</td><td>${istri.pendidikan}</td></tr>
      <tr><td style="padding: 0.4px 0; vertical-align: top;">8. Alamat</td><td style="text-align: center; vertical-align: top;">:</td><td>${istri.alamat}</td></tr>
      <tr><td style="padding: 0.4px 0;">9. Nama Ayah Kandung</td><td style="text-align: center;">:</td><td>${istri.ayah}</td></tr>
      <tr><td style="padding: 0.4px 0;">10. Nama Ibu Kandung</td><td style="text-align: center;">:</td><td>${istri.ibu}</td></tr>
    </tbody>
  </table>

  <!-- III. DATA CALON WALI -->
  <div style="font-weight: bold; font-size: 9pt; margin-top: 2px; margin-bottom: 1px;">III. DATA CALON WALI</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-left: 8px; margin-bottom: 3px;">
    <tbody>
      <tr><td style="width: 33%; padding: 0.4px 0;">1. Nama Wali</td><td style="width: 2%; text-align: center;">:</td><td style="width: 65%; font-weight: bold;">${namaWali}</td></tr>
      <tr><td style="padding: 0.4px 0;">2. Hubungan Wali</td><td style="text-align: center;">:</td><td>${hubunganWali}</td></tr>
      <tr><td style="padding: 0.4px 0;">3. Bin</td><td style="text-align: center;">:</td><td>${binWali}</td></tr>
      <tr><td style="padding: 0.4px 0;">4. Tempat / Tanggal Lahir</td><td style="text-align: center;">:</td><td>${ttlWali}</td></tr>
      <tr><td style="padding: 0.4px 0;">5. Agama</td><td style="text-align: center;">:</td><td>${agamaWali}</td></tr>
      <tr><td style="padding: 0.4px 0;">6. Pekerjaan</td><td style="text-align: center;">:</td><td>${pekerjaanWali}</td></tr>
      <tr><td style="padding: 0.4px 0; vertical-align: top;">7. Alamat</td><td style="text-align: center; vertical-align: top;">:</td><td>${alamatWali}</td></tr>
      <tr><td style="padding: 0.4px 0;">8. Mas Kawin</td><td style="text-align: center;">:</td><td><strong>${masKawin}</strong></td></tr>
    </tbody>
  </table>

  <!-- IV. DATA SAKSI NIKAH -->
  <div style="font-weight: bold; font-size: 9pt; margin-top: 2px; margin-bottom: 1px;">IV. DATA SAKSI NIKAH</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-left: 8px; margin-bottom: 3px;">
    <tbody>
      <tr>
        <td colspan="3" style="font-weight: bold; padding: 1px 0;">SAKSI 1</td>
      </tr>
      <tr><td style="width: 33%; padding: 0.4px 0;">1. Nama Lengkap</td><td style="width: 2%; text-align: center;">:</td><td style="width: 65%; font-weight: bold;">${namaSaksi1}</td></tr>
      <tr><td style="padding: 0.4px 0;">2. Tempat/Tanggal Lahir (Umur)</td><td style="text-align: center;">:</td><td>${tempatLahirSaksi1}, ${tglLahirSaksi1} (${umurSaksi1})</td></tr>
      <tr><td style="padding: 0.4px 0;">3. Agama</td><td style="text-align: center;">:</td><td>${agamaSaksi1}</td></tr>
      <tr><td style="padding: 0.4px 0;">4. Pekerjaan</td><td style="text-align: center;">:</td><td>${pekerjaanSaksi1}</td></tr>
      <tr><td style="padding: 0.4px 0;">5. Tempat Tinggal</td><td style="text-align: center;">:</td><td>${alamatSaksi1}</td></tr>
      <tr>
        <td colspan="3" style="font-weight: bold; padding: 2px 0 1px 0;">SAKSI 2</td>
      </tr>
      <tr><td style="padding: 0.4px 0;">1. Nama Lengkap</td><td style="text-align: center;">:</td><td style="font-weight: bold;">${namaSaksi2}</td></tr>
      <tr><td style="padding: 0.4px 0;">2. Tempat/Tanggal Lahir (Umur)</td><td style="text-align: center;">:</td><td>${tempatLahirSaksi2}, ${tglLahirSaksi2} (${umurSaksi2})</td></tr>
      <tr><td style="padding: 0.4px 0;">3. Agama</td><td style="text-align: center;">:</td><td>${agamaSaksi2}</td></tr>
      <tr><td style="padding: 0.4px 0;">4. Pekerjaan</td><td style="text-align: center;">:</td><td>${pekerjaanSaksi2}</td></tr>
      <tr><td style="padding: 0.4px 0;">5. Tempat Tinggal</td><td style="text-align: center;">:</td><td>${alamatSaksi2}</td></tr>
    </tbody>
  </table>

  <p style="margin: 2px 0 4px 0; font-size: 8.5pt; text-align: justify;">
    Demikian surat pernyataan ini saya buat dengan sebenarnya dan apabila dikemudian hari ternyata tidak benar maka saya sanggup dituntut sesuai dengan peraturan yang berlaku.
  </p>

  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
    <tbody>
      <tr>
        <td style="width: 55%;"></td>
        <td style="width: 45%; text-align: center;">
          <div>${namaDesaTitle}, ${tanggalSurat}</div>
          <div style="font-weight: bold;">Yang membuat pernyataan,</div>
          <div style="height: 42px;"></div>
          <div style="font-weight: bold; text-decoration: underline;">${namaPemohon}</div>
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
}

