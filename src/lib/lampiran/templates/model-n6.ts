import { formatTanggalIndonesia, type OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildModelN6PortraitHtml(ctx?: OpenSidRenderContext): string {
  const ind = ctx?.individu || {};
  const fv = ctx?.formValues || {};
  const ayah = ctx?.pelakuBagian?.ayah || {};
  const almarhum = ctx?.pelakuBagian?.almarhum || ctx?.pelakuBagian?.pasangan_lama || {};

  const namaDesa = (ctx?.namaDesa || 'Sampeldes').toUpperCase();
  const namaKecamatan = (ctx?.namaKecamatan || 'Gandrungmangu').toUpperCase();
  const namaKabupaten = (ctx?.namaKabupaten || 'Cilacap').toUpperCase();
  const nomorSurat = ctx?.nomorSurat || '474.3 / 001 / XI / 2026';
  const tanggalSurat = ctx?.tanggalSurat || formatTanggalIndonesia(new Date());
  const namaKades = (ctx?.namaPamong || ctx?.namaKepalaDesa || 'TUKIMAN').toUpperCase();

  // B. Data Suami / Istri yang ditinggalkan (Pemohon)
  const namaPemohon = (ind.nama || 'AHMAD FAUZI SETIAWAN').toUpperCase();
  const nikPemohon = ind.nik || '3301101708940002';
  const jenisKelaminPemohon = ind.jenis_kelamin || 'Laki-laki';
  const isPemohonLaki = !jenisKelaminPemohon.toLowerCase().includes('perempuan');
  const binPemohon = (ayah.nama || fv.form_nama_ayah || ind.nama_ayah || 'H. SUPRIYADI').toUpperCase();
  const tempatLahirPemohon = ind.tempat_lahir || 'Cilacap';
  const tglLahirPemohon = ind.tanggal_lahir ? formatTanggalIndonesia(ind.tanggal_lahir) : '17 Agustus 1994';
  const wnPemohon = ind.warga_negara || 'WNI';
  const agamaPemohon = ind.agama || 'Islam';
  const pekerjaanPemohon = ind.pekerjaan || 'Karyawan Swasta';
  const alamatPemohon =
    ind.alamat ||
    `Dusun ${ind.dusun || 'Sampeldes'} RT ${ind.rt || '002'} / RW ${ind.rw || '001'} Desa ${ctx?.namaDesa || 'Sampeldes'} Kec. ${ctx?.namaKecamatan || 'Gandrungmangu'} Kab. ${ctx?.namaKabupaten || 'Cilacap'}`;

  // A. Data Almarhum / Almarhumah Suami / Istri Terdahulu
  const namaAlmarhum = (
    almarhum.nama ||
    fv.form_nama_almarhum ||
    fv.form_nama_pasangan_lama ||
    '-'
  ).toUpperCase();

  const binAlmarhum = (
    fv.form_bin_almarhum ||
    almarhum.nama_ayah ||
    '-'
  ).toUpperCase();

  const nikAlmarhum =
    almarhum.nik ||
    fv.form_nik_almarhum ||
    '-';

  const tempatLahirAlmarhum = almarhum.tempat_lahir || fv.form_tempat_lahir_almarhum || '-';
  const tglLahirAlmarhum = almarhum.tanggal_lahir
    ? formatTanggalIndonesia(almarhum.tanggal_lahir)
    : fv.form_tanggal_lahir_almarhum
      ? formatTanggalIndonesia(fv.form_tanggal_lahir_almarhum)
      : '-';
  const ttlAlmarhum =
    tempatLahirAlmarhum !== '-' && tglLahirAlmarhum !== '-'
      ? `${tempatLahirAlmarhum}, ${tglLahirAlmarhum}`
      : tempatLahirAlmarhum !== '-'
        ? tempatLahirAlmarhum
        : '-';

  const wnAlmarhum = almarhum.warga_negara || fv.form_warga_negara_almarhum || (namaAlmarhum !== '-' ? 'WNI' : '-');
  const agamaAlmarhum = almarhum.agama || fv.form_agama_almarhum || (namaAlmarhum !== '-' ? 'Islam' : '-');
  const pekerjaanAlmarhum = almarhum.pekerjaan || fv.form_pekerjaan_almarhum || '-';
  const alamatAlmarhum = almarhum.alamat || fv.form_alamat_almarhum || (namaAlmarhum !== '-' ? alamatPemohon : '-');

  const tglMeninggal = fv.form_tanggal_meninggal_pasangan || fv.form_tanggal_kematian
    ? formatTanggalIndonesia(fv.form_tanggal_meninggal_pasangan || fv.form_tanggal_kematian)
    : '-';
  const tempatMeninggal =
    fv.form_tempat_meninggal_pasangan ||
    fv.form_tempat_kematian ||
    (namaAlmarhum !== '-' ? `Desa ${ctx?.namaDesa || 'Sampeldes'}` : '-');

  return `<div style="font-family: 'Times New Roman', Times, serif; font-size: 9.5pt; line-height: 1.24; color: #000;">
  <!-- HEADER KANAN ATAS: LAMPIRAN X KEPDIRJEN BIMAS ISLAM NO. 473 TAHUN 2020 -->
  <div style="text-align: right; font-size: 8pt; line-height: 1.15; margin-bottom: 2px;">
    Lampiran X<br />
    Keputusan Direktur Jenderal Bimbingan Masyarakat Islam<br />
    Nomor 473 Tahun 2020<br />
    Tentang<br />
    Petunjuk Teknis Pelaksanaan Pencatatan Nikah
  </div>

  <div style="text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 1px;">
    FORMULIR SURAT KETERANGAN KEMATIAN SUAMI / ISTRI
  </div>

  <div style="text-align: right; font-weight: bold; font-size: 10pt; margin-bottom: 2px;">
    Model : N-6
  </div>

  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 4px;">
    <tbody>
      <tr>
        <td style="width: 28%; padding: 0.5px 0;">KANTOR DESA/KELURAHAN</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 70%; font-weight: bold;">${namaDesa}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">KECAMATAN</td>
        <td style="text-align: center;">:</td>
        <td style="font-weight: bold;">${namaKecamatan}</td>
      </tr>
      <tr>
        <td style="padding: 0.5px 0;">KABUPATEN/KOTA</td>
        <td style="text-align: center;">:</td>
        <td style="font-weight: bold;">${namaKabupaten}</td>
      </tr>
    </tbody>
  </table>

  <div style="text-align: center; margin-bottom: 4px;">
    <div style="font-weight: bold; font-size: 11pt; text-decoration: underline;">SURAT KETERANGAN KEMATIAN SUAMI / ISTRI</div>
    <div style="font-size: 9.5pt;">Nomor : ${nomorSurat}</div>
  </div>

  <p style="margin: 2px 0 3px 0;">Yang bertanda tangan di bawah ini menerangkan dengan sesungguhnya bahwa :</p>

  <!-- A. DATA ALMARHUM / ALMARHUMAH -->
  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-left: 8px; margin-bottom: 4px;">
    <tbody>
      <tr>
        <td style="width: 3%; font-weight: bold;">A.</td>
        <td style="width: 33%; padding: 0.8px 0;">1. Nama lengkap dan alias</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 62%; font-weight: bold;">${namaAlmarhum}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.8px 0;">2. Bin / Binti</td>
        <td style="text-align: center;">:</td>
        <td>${binAlmarhum}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.8px 0;">3. Nomor Induk Kependudukan (NIK)</td>
        <td style="text-align: center;">:</td>
        <td>${nikAlmarhum}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.8px 0;">4. Tempat dan tanggal lahir</td>
        <td style="text-align: center;">:</td>
        <td>${ttlAlmarhum}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.8px 0;">5. Kewarganegaraan</td>
        <td style="text-align: center;">:</td>
        <td>${wnAlmarhum}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.8px 0;">6. Agama</td>
        <td style="text-align: center;">:</td>
        <td>${agamaAlmarhum}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.8px 0;">7. Pekerjaan terakhir</td>
        <td style="text-align: center;">:</td>
        <td>${pekerjaanAlmarhum}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.8px 0; vertical-align: top;">8. Alamat tempat tinggal terakhir</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td>${alamatAlmarhum}</td>
      </tr>
    </tbody>
  </table>

  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-left: 24px; margin-bottom: 4px;">
    <tbody>
      <tr>
        <td style="width: 32%; padding: 0.8px 0;">Telah meninggal dunia pada tanggal</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 66%; font-weight: bold;">${tglMeninggal}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">Di</td>
        <td style="text-align: center;">:</td>
        <td style="font-weight: bold;">${tempatMeninggal}</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 3px 0 2px 0;">Yang bersangkutan adalah <strong>${isPemohonLaki ? 'Istri' : 'Suami'}</strong> dari :</p>

  <!-- B. DATA PASANGAN YANG DITINGGALKAN -->
  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-left: 8px; margin-bottom: 6px;">
    <tbody>
      <tr>
        <td style="width: 3%; font-weight: bold;">B.</td>
        <td style="width: 33%; padding: 0.8px 0;">1. Nama lengkap dan alias</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 62%; font-weight: bold;">${namaPemohon}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.8px 0;">2. ${isPemohonLaki ? 'Bin' : 'Binti'}</td>
        <td style="text-align: center;">:</td>
        <td>${binPemohon}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.8px 0;">3. Nomor Induk Kependudukan (NIK)</td>
        <td style="text-align: center;">:</td>
        <td>${nikPemohon}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.8px 0;">4. Tempat dan tanggal lahir</td>
        <td style="text-align: center;">:</td>
        <td>${tempatLahirPemohon}, ${tglLahirPemohon}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.8px 0;">5. Kewarganegaraan</td>
        <td style="text-align: center;">:</td>
        <td>${wnPemohon}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.8px 0;">6. Agama</td>
        <td style="text-align: center;">:</td>
        <td>${agamaPemohon}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.8px 0;">7. Pekerjaan</td>
        <td style="text-align: center;">:</td>
        <td>${pekerjaanPemohon}</td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 0.8px 0; vertical-align: top;">8. Alamat</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td>${alamatPemohon}</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 4px 0 6px 0;">
    Demikian surat keterangan ini dibuat dengan mengingat sumpah jabatan dan untuk dapat digunakan seperlunya.
  </p>

  <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
    <tbody>
      <tr>
        <td style="width: 55%;"></td>
        <td style="width: 45%; text-align: center;">
          <div>${ctx?.namaDesa || 'Sampeldes'}, ${tanggalSurat}</div>
          <div style="font-weight: bold;">${ctx?.jabatanPamong || `Kepala Desa ${ctx?.namaDesa || 'Sampeldes'}`}</div>
          <div style="height: 48px;"></div>
          <div style="font-weight: bold; text-decoration: underline;">${namaKades}</div>
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
}
