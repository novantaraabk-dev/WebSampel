import { formatTanggalIndonesia, type OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildSwnPortraitHtml(ctx?: OpenSidRenderContext): string {
  const ind = ctx?.individu || {};
  const fv = ctx?.formValues || {};
  const ayah = ctx?.pelakuBagian?.ayah || {};
  const pasangan = ctx?.pelakuBagian?.pasangan || ctx?.pelakuBagian?.calon_pasangan || {};
  const wali = ctx?.pelakuBagian?.wali || {};
  const saksi1 = ctx?.pelakuBagian?.saksi_1 || ctx?.pelakuBagian?.saksi1 || {};
  const saksi2 = ctx?.pelakuBagian?.saksi_2 || ctx?.pelakuBagian?.saksi2 || {};

  const namaDesa = (ctx?.namaDesa || 'Sampeldes').toUpperCase();
  const namaDesaTitle = ctx?.namaDesa || 'Sampeldes';
  const namaKecamatan = (ctx?.namaKecamatan || 'Gandrungmangu').toUpperCase();
  const namaKecamatanTitle = ctx?.namaKecamatan || 'Gandrungmangu';
  const namaKabupaten = (ctx?.namaKabupaten || 'Cilacap').toUpperCase();
  const namaKabupatenTitle = ctx?.namaKabupaten || 'Cilacap';
  const tanggalSurat = ctx?.tanggalSurat || formatTanggalIndonesia(new Date());
  const namaKades = (ctx?.namaPamong || ctx?.namaKepalaDesa || 'TUKIMAN').toUpperCase();

  const jenisKelaminPemohon = ind.jenis_kelamin || 'Laki-laki';
  const isPemohonLaki = !jenisKelaminPemohon.toLowerCase().includes('perempuan');

  // Data Calon Mempelai Perempuan (Calon Istri)
  const namaCalonIstri = (
    !isPemohonLaki
      ? ind.nama || 'SITI NUR AISYAH'
      : pasangan.nama || fv.form_nama_calon_pasangan || fv.form_nama_pasangan || 'SITI NUR AISYAH'
  ).toUpperCase();

  const bintiCalonIstri = (
    !isPemohonLaki
      ? ayah.nama || fv.form_nama_ayah || ind.nama_ayah || 'H. SUPRIYADI'
      : fv.form_bin_calon_pasangan || fv.form_nama_ayah_pasangan || pasangan.nama_ayah || 'H. ABDUL KARIM'
  ).toUpperCase();

  const nikCalonIstri = !isPemohonLaki
    ? ind.nik || '3301105509960003'
    : pasangan.nik || fv.form_nik_calon_pasangan || fv.form_nik_pasangan || '3301105509960003';

  const tempatLahirIstri = !isPemohonLaki
    ? ind.tempat_lahir || 'Cilacap'
    : pasangan.tempat_lahir || fv.form_tempat_lahir_pasangan || 'Cilacap';

  const tglLahirIstri = !isPemohonLaki
    ? ind.tanggal_lahir
      ? formatTanggalIndonesia(ind.tanggal_lahir)
      : '15 September 1996'
    : pasangan.tanggal_lahir
      ? formatTanggalIndonesia(pasangan.tanggal_lahir)
      : fv.form_tanggal_lahir_pasangan
        ? formatTanggalIndonesia(fv.form_tanggal_lahir_pasangan)
        : '15 September 1996';

  const wnCalonIstri = !isPemohonLaki
    ? ind.warga_negara || 'WNI'
    : pasangan.warga_negara || fv.form_warga_negara_pasangan || 'WNI';

  const agamaCalonIstri = !isPemohonLaki
    ? ind.agama || 'Islam'
    : pasangan.agama || fv.form_agama_pasangan || 'Islam';

  const pekerjaanCalonIstri = !isPemohonLaki
    ? ind.pekerjaan || 'Karyawan Swasta'
    : pasangan.pekerjaan || fv.form_pekerjaan_pasangan || 'Karyawan Swasta';

  const alamatCalonIstri = !isPemohonLaki
    ? ind.alamat || `Dusun ${ind.dusun || namaDesaTitle} RT ${ind.rt || '002'} / RW ${ind.rw || '001'} Desa ${namaDesaTitle} Kec. ${namaKecamatanTitle} Kab. ${namaKabupatenTitle}`
    : pasangan.alamat || fv.form_alamat_pasangan || `Dusun ${namaDesaTitle} RT 003 / RW 002 Desa ${namaDesaTitle} Kec. ${namaKecamatanTitle} Kab. ${namaKabupatenTitle}`;

  // Data Wali Nikah
  const namaWali = (
    wali.nama ||
    fv.form_nama_wali_nikah ||
    fv.form_nama_wali ||
    bintiCalonIstri ||
    'H. ABDUL KARIM'
  ).toUpperCase();

  const binWali = (
    fv.form_bin_wali_nikah ||
    fv.form_bin_wali ||
    'H. AHMAD DAHLAN'
  ).toUpperCase();

  const nikWali =
    wali.nik ||
    fv.form_nik_wali_nikah ||
    fv.form_nik_wali ||
    (!isPemohonLaki ? ayah.nik || fv.form_nik_ayah || '3301100504650001' : '3301101003660002');

  const tempatLahirWali =
    wali.tempat_lahir ||
    fv.form_tempat_lahir_wali_nikah ||
    (!isPemohonLaki ? ayah.tempat_lahir || fv.form_tempat_lahir_ayah || 'Cilacap' : 'Cilacap');

  const tglLahirWali = wali.tanggal_lahir
    ? formatTanggalIndonesia(wali.tanggal_lahir)
    : fv.form_tanggal_lahir_wali_nikah
      ? formatTanggalIndonesia(fv.form_tanggal_lahir_wali_nikah)
      : !isPemohonLaki && (ayah.tanggal_lahir || fv.form_tanggal_lahir_ayah)
        ? formatTanggalIndonesia(ayah.tanggal_lahir || fv.form_tanggal_lahir_ayah)
        : '10 Maret 1966';

  const agamaWali = wali.agama || fv.form_agama_wali_nikah || 'Islam';
  const pekerjaanWali =
    wali.pekerjaan ||
    fv.form_pekerjaan_wali_nikah ||
    (!isPemohonLaki ? ayah.pekerjaan || fv.form_pekerjaan_ayah || 'Wiraswasta' : 'Wiraswasta');
  const alamatWali =
    wali.alamat ||
    fv.form_alamat_wali_nikah ||
    (!isPemohonLaki ? ayah.alamat || fv.form_alamat_ayah || alamatCalonIstri : alamatCalonIstri);

  const hubunganWali =
    fv.form_hubungan_wali_nikah ||
    fv.form_hubungan_wali ||
    'Ayah Kandung';

  const alasanBukanAyah =
    fv.form_alasan_wali_nikah ||
    fv.form_alasan_bukan_wali_ayah ||
    '-';

  // Data Saksi 1 & Saksi 2
  const namaSaksi1 = (
    saksi1.nama ||
    fv.form_nama_saksi_1 ||
    fv.form_nama_saksi_i ||
    fv.nama_saksi_1 ||
    'SLAMET RIYADI'
  ).toUpperCase();

  const namaSaksi2 = (
    saksi2.nama ||
    fv.form_nama_saksi_2 ||
    fv.form_nama_saksi_ii ||
    fv.nama_saksi_2 ||
    'BAMBANG SUTRISNO'
  ).toUpperCase();

  return `<div style="font-family: 'Times New Roman', Times, serif; font-size: 9pt; line-height: 1.22; color: #000;">
  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 4px;">
    <tbody>
      <tr>
        <td style="width: 28%; padding: 0.5px 0;">KANTOR DESA/KELURAHAN</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 45%; font-weight: bold;">${namaDesa}</td>
        <td style="width: 25%; text-align: right; font-weight: bold;">Model : SWN</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">KECAMATAN</td>
        <td style="text-align: center;">:</td>
        <td style="font-weight: bold;">${namaKecamatan}</td>
        <td></td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">KABUPATEN/KOTA</td>
        <td style="text-align: center;">:</td>
        <td style="font-weight: bold;">${namaKabupaten}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <div style="text-align: center; font-weight: bold; font-size: 11pt; text-decoration: underline; margin-bottom: 6px; letter-spacing: 0.3px;">
    SURAT KETERANGAN &amp; PERNYATAAN WALI NIKAH
  </div>

  <p style="margin: 0 0 4px 0; text-align: justify;">
    Yang bertanda tangan di bawah ini Kepala Desa ${namaDesaTitle} Kecamatan ${namaKecamatanTitle} Kabupaten ${namaKabupatenTitle}, menerangkan dengan sesungguhnya bahwa:
  </p>

  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-left: 8px; margin-bottom: 4px;">
    <tbody>
      <tr>
        <td style="width: 34%; padding: 0.6px 0;">1. Nama lengkap dan alias</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 64%; font-weight: bold;">${namaWali}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0;">2. Bin</td>
        <td style="text-align: center;">:</td>
        <td>${binWali}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0;">3. Nomor Induk Kependudukan (NIK)</td>
        <td style="text-align: center;">:</td>
        <td>${nikWali}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0;">4. Tempat dan tanggal lahir</td>
        <td style="text-align: center;">:</td>
        <td>${tempatLahirWali}, ${tglLahirWali}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0;">5. Agama</td>
        <td style="text-align: center;">:</td>
        <td>${agamaWali}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0;">6. Pekerjaan</td>
        <td style="text-align: center;">:</td>
        <td>${pekerjaanWali}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0; vertical-align: top;">7. Alamat tempat tinggal</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td>${alamatWali}</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 3px 0 2px 0; font-weight: bold;">
    Sesuai dengan hukum Islam/Fiqh berhak menjadi WALI NIKAH dari:
  </p>

  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-left: 8px; margin-bottom: 4px;">
    <tbody>
      <tr>
        <td style="width: 34%; padding: 0.6px 0;">1. Nama lengkap dan alias</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 64%; font-weight: bold;">${namaCalonIstri}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0;">2. Binti</td>
        <td style="text-align: center;">:</td>
        <td>${bintiCalonIstri}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0;">3. Nomor Induk Kependudukan (NIK)</td>
        <td style="text-align: center;">:</td>
        <td>${nikCalonIstri}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0;">4. Tempat dan tanggal lahir</td>
        <td style="text-align: center;">:</td>
        <td>${tempatLahirIstri}, ${tglLahirIstri}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0;">5. Kewarganegaraan</td>
        <td style="text-align: center;">:</td>
        <td>${wnCalonIstri}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0;">6. Agama</td>
        <td style="text-align: center;">:</td>
        <td>${agamaCalonIstri}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0;">7. Pekerjaan</td>
        <td style="text-align: center;">:</td>
        <td>${pekerjaanCalonIstri}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0; vertical-align: top;">8. Alamat tempat tinggal</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td>${alamatCalonIstri}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0 0.6px 0; font-weight: bold;">Hubungan Wali Nikah</td>
        <td style="text-align: center;">:</td>
        <td style="font-weight: bold;">${hubunganWali}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0;">Alasan Bila Bukan Wali Ayah</td>
        <td style="text-align: center;">:</td>
        <td>${alasanBukanAyah}</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 3px 0 6px 0; text-align: justify;">
    Demikian Surat Keterangan Wali Nikah ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
  </p>

  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 4px;">
    <tbody>
      <tr>
        <td style="width: 52%; vertical-align: top; padding-right: 10px;">
          <div style="font-weight: bold; margin-bottom: 4px;">Saksi-Saksi :</div>
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
          <div style="font-weight: bold;">Yang Menyatakan (Wali Nikah)</div>
          <div style="height: 48px;"></div>
          <div style="font-weight: bold; text-decoration: underline;">${namaWali}</div>
        </td>
      </tr>
    </tbody>
  </table>

  <div style="text-align: center; font-size: 8.5pt; margin-top: 6px;">
    <div>Mengetahui,</div>
    <div style="font-weight: bold;">Kepala Desa ${namaDesaTitle}</div>
    <div style="height: 44px;"></div>
    <div style="font-weight: bold; text-decoration: underline;">${namaKades}</div>
  </div>
</div>`;
}

