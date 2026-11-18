import { formatTanggalIndonesia, type OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildModelN5PortraitHtml(ctx?: OpenSidRenderContext): string {
  const ind = ctx?.individu || {};
  const fv = ctx?.formValues || {};
  const ayah = ctx?.pelakuBagian?.ayah || {};
  const ibu = ctx?.pelakuBagian?.ibu || {};
  const pasangan = ctx?.pelakuBagian?.pasangan || ctx?.pelakuBagian?.calon_pasangan || {};

  const namaDesa = ctx?.namaDesa || 'Sampeldes';
  const tanggalSurat = ctx?.tanggalSurat || formatTanggalIndonesia(new Date());

  const alamatDefault =
    ind.alamat ||
    `Dusun ${ind.dusun || 'Sampeldes'} RT ${ind.rt || '002'} / RW ${ind.rw || '001'} Desa ${namaDesa} Kec. ${ctx?.namaKecamatan || 'Gandrungmangu'} Kab. ${ctx?.namaKabupaten || 'Cilacap'}`;

  // Data Ayah (A)
  const namaAyah = (ayah.nama || fv.form_nama_ayah || ind.nama_ayah || 'H. SUPRIYADI').toUpperCase();
  const binAyah = (fv.form_bin_ayah || 'H. KARTO SUWIRYO').toUpperCase();
  const nikAyah = ayah.nik || fv.form_nik_ayah || ind.nik_ayah || '3301100504650001';
  const tempatLahirAyah = ayah.tempat_lahir || fv.form_tempat_lahir_ayah || 'Cilacap';
  const tglLahirAyah = ayah.tanggal_lahir
    ? formatTanggalIndonesia(ayah.tanggal_lahir)
    : fv.form_tanggal_lahir_ayah
      ? formatTanggalIndonesia(fv.form_tanggal_lahir_ayah)
      : '05 April 1965';
  const wnAyah = ayah.warga_negara || fv.form_warga_negara_ayah || 'WNI';
  const agamaAyah = ayah.agama || fv.form_agama_ayah || 'Islam';
  const pekerjaanAyah = ayah.pekerjaan || fv.form_pekerjaan_ayah || 'Petani/Pekebun';
  const alamatAyah = ayah.alamat || fv.form_alamat_ayah || alamatDefault;

  // Data Ibu (B)
  const namaIbu = (ibu.nama || fv.form_nama_ibu || ind.nama_ibu || 'HJ. SUMIATI').toUpperCase();
  const bintiIbu = (fv.form_binti_ibu || 'H. MANSYUR').toUpperCase();
  const nikIbu = ibu.nik || fv.form_nik_ibu || ind.nik_ibu || '3301105208680002';
  const tempatLahirIbu = ibu.tempat_lahir || fv.form_tempat_lahir_ibu || 'Cilacap';
  const tglLahirIbu = ibu.tanggal_lahir
    ? formatTanggalIndonesia(ibu.tanggal_lahir)
    : fv.form_tanggal_lahir_ibu
      ? formatTanggalIndonesia(fv.form_tanggal_lahir_ibu)
      : '12 Agustus 1968';
  const wnIbu = ibu.warga_negara || fv.form_warga_negara_ibu || 'WNI';
  const agamaIbu = ibu.agama || fv.form_agama_ibu || 'Islam';
  const pekerjaanIbu = ibu.pekerjaan || fv.form_pekerjaan_ibu || 'Mengurus Rumah Tangga';
  const alamatIbu = ibu.alamat || fv.form_alamat_ibu || alamatDefault;

  // Data Anak / Calon Pengantin (I)
  const namaAnak = (ind.nama || 'AHMAD FAUZI SETIAWAN').toUpperCase();
  const jenisKelaminAnak = ind.jenis_kelamin || 'Laki-laki';
  const isAnakLaki = !jenisKelaminAnak.toLowerCase().includes('perempuan');
  const nikAnak = ind.nik || '3301101708940002';
  const tempatLahirAnak = ind.tempat_lahir || 'Cilacap';
  const tglLahirAnak = ind.tanggal_lahir ? formatTanggalIndonesia(ind.tanggal_lahir) : '17 Agustus 1994';
  const wnAnak = ind.warga_negara || 'WNI';
  const agamaAnak = ind.agama || 'Islam';
  const pekerjaanAnak = ind.pekerjaan || 'Karyawan Swasta';

  // Data Calon Pasangan (II)
  const namaPasangan = (
    pasangan.nama ||
    fv.form_nama_calon_pasangan ||
    fv.form_nama_pasangan ||
    (isAnakLaki ? 'SITI NUR AISYAH' : 'AHMAD FAUZI SETIAWAN')
  ).toUpperCase();
  const binPasangan = (
    fv.form_bin_calon_pasangan ||
    fv.form_nama_ayah_pasangan ||
    pasangan.nama_ayah ||
    'H. ABDUL KARIM'
  ).toUpperCase();
  const nikPasangan =
    pasangan.nik ||
    fv.form_nik_calon_pasangan ||
    fv.form_nik_pasangan ||
    '3301105509960003';
  const tempatLahirPasangan = pasangan.tempat_lahir || fv.form_tempat_lahir_pasangan || 'Cilacap';
  const tglLahirPasangan = pasangan.tanggal_lahir
    ? formatTanggalIndonesia(pasangan.tanggal_lahir)
    : fv.form_tanggal_lahir_pasangan
      ? formatTanggalIndonesia(fv.form_tanggal_lahir_pasangan)
      : '15 September 1996';
  const wnPasangan = pasangan.warga_negara || fv.form_warga_negara_pasangan || 'WNI';
  const agamaPasangan = pasangan.agama || fv.form_agama_pasangan || 'Islam';
  const pekerjaanPasangan = pasangan.pekerjaan || fv.form_pekerjaan_pasangan || 'Karyawan Swasta';
  const alamatPasangan =
    pasangan.alamat ||
    fv.form_alamat_pasangan ||
    `Dusun Sampeldes RT 003 / RW 002 Desa ${namaDesa} Kec. ${ctx?.namaKecamatan || 'Gandrungmangu'} Kab. ${ctx?.namaKabupaten || 'Cilacap'}`;

  return `<div style="font-family: 'Times New Roman', Times, serif; font-size: 9.5pt; line-height: 1.26; color: #000;">
  <!-- HEADER KANAN ATAS: LAMPIRAN IX KEPDIRJEN BIMAS ISLAM NO. 473 TAHUN 2020 -->
  <div style="text-align: right; font-size: 8pt; line-height: 1.2; margin-bottom: 2px;">
    Lampiran IX<br />
    Keputusan Direktur Jenderal Bimbingan Masyarakat Islam<br />
    Nomor 473 Tahun 2020<br />
    Tentang<br />
    Petunjuk Teknis Pelaksanaan Pencatatan Nikah
  </div>

  <div style="text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 1px;">
    FORMULIR SURAT IZIN ORANG TUA
  </div>

  <div style="text-align: right; font-weight: bold; font-size: 10pt; margin-bottom: 2px;">
    Model : N-5
  </div>

  <div style="text-align: center; font-weight: bold; font-size: 11pt; text-decoration: underline; margin-bottom: 6px;">
    SURAT IZIN ORANG TUA
  </div>

  <p style="margin: 2px 0 3px 0;">Yang bertanda tangan dibawah ini :</p>

  <!-- A. DATA AYAH -->
  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 4px;">
    <tbody>
      <tr>
        <td style="width: 3%; font-weight: bold;">A.</td>
        <td style="width: 33%; padding: 0.5px 0;">1. Nama lengkap dan alias</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 62%; font-weight: bold;">${namaAyah}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.5px 0;">2. Bin</td>
        <td style="text-align: center;">:</td>
        <td>${binAyah}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.5px 0;">3. Nomor Induk Kependudukan</td>
        <td style="text-align: center;">:</td>
        <td>${nikAyah}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.5px 0;">4. Tempat dan tanggal lahir</td>
        <td style="text-align: center;">:</td>
        <td>${tempatLahirAyah}, ${tglLahirAyah}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.5px 0;">5. Kewarganegaraan</td>
        <td style="text-align: center;">:</td>
        <td>${wnAyah}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.5px 0;">6. Agama</td>
        <td style="text-align: center;">:</td>
        <td>${agamaAyah}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.5px 0;">7. Pekerjaan</td>
        <td style="text-align: center;">:</td>
        <td>${pekerjaanAyah}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.5px 0; vertical-align: top;">8. Alamat</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td>${alamatAyah}</td>
      </tr>
    </tbody>
  </table>

  <!-- B. DATA IBU -->
  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 4px;">
    <tbody>
      <tr>
        <td style="width: 3%; font-weight: bold;">B.</td>
        <td style="width: 33%; padding: 0.5px 0;">1. Nama lengkap dan alias</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 62%; font-weight: bold;">${namaIbu}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.5px 0;">2. Binti</td>
        <td style="text-align: center;">:</td>
        <td>${bintiIbu}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.5px 0;">3. Nomor Induk Kependudukan</td>
        <td style="text-align: center;">:</td>
        <td>${nikIbu}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.5px 0;">4. Tempat dan tanggal lahir</td>
        <td style="text-align: center;">:</td>
        <td>${tempatLahirIbu}, ${tglLahirIbu}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.5px 0;">5. Kewarganegaraan</td>
        <td style="text-align: center;">:</td>
        <td>${wnIbu}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.5px 0;">6. Agama</td>
        <td style="text-align: center;">:</td>
        <td>${agamaIbu}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.5px 0;">7. Pekerjaan</td>
        <td style="text-align: center;">:</td>
        <td>${pekerjaanIbu}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.5px 0; vertical-align: top;">8. Alamat</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td>${alamatIbu}</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 3px 0;">adalah ayah kandung dan ibu kandung / wali / pengampu dari :</p>

  <!-- DATA ANAK -->
  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-left: 16px; margin-bottom: 4px;">
    <tbody>
      <tr>
        <td style="width: 34%; padding: 0.5px 0;">1. Nama lengkap dan alias</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 64%; font-weight: bold;">${namaAnak}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">2. Bin / Binti</td>
        <td style="text-align: center;">:</td>
        <td>${namaAyah}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">3. Nomor Induk Kependudukan</td>
        <td style="text-align: center;">:</td>
        <td>${nikAnak}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">4. Tempat dan tanggal lahir</td>
        <td style="text-align: center;">:</td>
        <td>${tempatLahirAnak}, ${tglLahirAnak}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">5. Kewarganegaraan</td>
        <td style="text-align: center;">:</td>
        <td>${wnAnak}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">6. Agama</td>
        <td style="text-align: center;">:</td>
        <td>${agamaAnak}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">7. Pekerjaan</td>
        <td style="text-align: center;">:</td>
        <td>${pekerjaanAnak}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0; vertical-align: top;">8. Alamat</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td>${alamatDefault}</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 3px 0;">Memberi izin kepadanya untuk melakukan perkawinan dengan :</p>

  <!-- DATA CALON PASANGAN -->
  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-left: 16px; margin-bottom: 6px;">
    <tbody>
      <tr>
        <td style="width: 34%; padding: 0.5px 0;">1. Nama lengkap dan alias</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 64%; font-weight: bold;">${namaPasangan}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">2. Bin / Binti</td>
        <td style="text-align: center;">:</td>
        <td>${binPasangan}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">3. Nomor Induk Kependudukan</td>
        <td style="text-align: center;">:</td>
        <td>${nikPasangan}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">4. Tempat dan tanggal lahir</td>
        <td style="text-align: center;">:</td>
        <td>${tempatLahirPasangan}, ${tglLahirPasangan}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">5. Kewarganegaraan</td>
        <td style="text-align: center;">:</td>
        <td>${wnPasangan}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">6. Agama</td>
        <td style="text-align: center;">:</td>
        <td>${agamaPasangan}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">7. Pekerjaan</td>
        <td style="text-align: center;">:</td>
        <td>${pekerjaanPasangan}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0; vertical-align: top;">8. Alamat</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td>${alamatPasangan}</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 4px 0 8px 0; text-align: justify;">
    Demikian surat izin ini dibuat dengan kesadaran tanpa ada paksaan dari siapapun dan untuk digunakan seperlunya.
  </p>

  <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
    <tbody>
      <tr>
        <td style="width: 50%;"></td>
        <td style="width: 50%; text-align: center; padding-bottom: 2px;">${namaDesa}, ${tanggalSurat}</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: bold;">Ayah/wali/pengampu</td>
        <td style="text-align: center; font-weight: bold;">Ibu/wali/pengampu</td>
      </tr>
      <tr>
        <td style="height: 48px;"></td>
        <td style="height: 48px;"></td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: bold; text-decoration: underline;">${namaAyah}</td>
        <td style="text-align: center; font-weight: bold; text-decoration: underline;">${namaIbu}</td>
      </tr>
    </tbody>
  </table>
</div>`;
}
