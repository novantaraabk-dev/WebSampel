import { formatTanggalIndonesia, getNamaHariIndonesia, type OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildModelN2PortraitHtml(ctx?: OpenSidRenderContext): string {
  const ind = ctx?.individu || {};
  const fv = ctx?.formValues || {};
  const pasangan = ctx?.pelakuBagian?.pasangan || ctx?.pelakuBagian?.calon_pasangan || {};

  const namaDesa = ctx?.namaDesa || 'Sampeldes';
  const namaKecamatan = ctx?.namaKecamatan || 'Gandrungmangu';
  const tanggalSurat = ctx?.tanggalSurat || formatTanggalIndonesia(new Date());

  const namaPemohon = (ind.nama || 'AHMAD FAUZI SETIAWAN').toUpperCase();
  const jenisKelaminPemohon = ind.jenis_kelamin || 'Laki-laki';
  const isPemohonLaki = !jenisKelaminPemohon.toLowerCase().includes('perempuan');

  const namaPasangan = (
    pasangan.nama ||
    fv.form_nama_calon_pasangan ||
    fv.form_nama_pasangan ||
    (isPemohonLaki ? 'SITI NUR AISYAH' : 'AHMAD FAUZI SETIAWAN')
  ).toUpperCase();

  const calonSuami = isPemohonLaki ? namaPemohon : namaPasangan;
  const calonIstri = !isPemohonLaki ? namaPemohon : namaPasangan;

  const rawTglAkad = fv.form_tanggal_akad || fv.akadDate || fv.tanggal_akad || '';
  const hariAkad =
    fv.form_hari_akad ||
    (rawTglAkad ? getNamaHariIndonesia(rawTglAkad) : ctx?.hariSurat || 'Minggu');
  const tglAkad = rawTglAkad ? formatTanggalIndonesia(rawTglAkad) : tanggalSurat;
  const jamAkad = fv.form_jam_akad || '09.00 WIB';
  const hariTanggalJamAkad =
    fv.form_hari_tanggal_jam_akad || `${hariAkad}, ${tglAkad} / Pukul ${jamAkad}`;

  const kuaTujuan = fv.form_kua_tujuan || fv.kuaLocation || `KUA Kecamatan ${namaKecamatan}`;
  const tempatAkad = fv.form_tempat_akad || kuaTujuan;

  return `<div style="font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; line-height: 1.42; color: #000;">
  <!-- HEADER KANAN ATAS: LAMPIRAN V KEPDIRJEN BIMAS ISLAM NO. 473 TAHUN 2020 -->
  <div style="text-align: right; font-size: 8.5pt; line-height: 1.25; margin-bottom: 6px;">
    Lampiran V<br />
    Keputusan Direktur Jenderal Bimbingan Masyarakat Islam<br />
    Nomor 473 Tahun 2020<br />
    Tentang<br />
    Petunjuk Teknis Pelaksanaan Pencatatan Nikah
  </div>

  <div style="text-align: center; font-weight: bold; font-size: 11.5pt; margin-bottom: 2px;">
    FORMULIR PERMOHONAN KEHENDAK PERKAWINAN
  </div>

  <div style="text-align: right; font-weight: bold; font-size: 10.5pt; margin-bottom: 10px;">
    Model : N-2
  </div>

  <table style="width: 100%; border-collapse: collapse; font-size: 10.5pt; margin-bottom: 12px;">
    <tbody>
      <tr>
        <td style="width: 12%;">Perihal</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 46%;">Permohonan Kehendak Perkawinan</td>
        <td style="width: 40%; text-align: right;">${namaDesa}, ${tanggalSurat}</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-bottom: 12px;">
    Kepada Yth.<br />
    Kepala KUA Kecamatan / PPN LN<br />
    di <strong>${kuaTujuan}</strong>
  </div>

  <p style="margin: 8px 0;">Dengan hormat, kami mengajukan permohonan kehendak perkawinan untuk atas nama :</p>

  <table style="width: 100%; border-collapse: collapse; font-size: 10.5pt; margin-left: 8px; margin-bottom: 12px;">
    <tbody>
      <tr>
        <td style="width: 28%; padding: 2.5px 0;">Calon suami</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 70%; font-weight: bold;">${calonSuami}</td>
      </tr>
      <tr>
        <td style="padding: 2.5px 0;">Calon istri</td>
        <td style="text-align: center;">:</td>
        <td style="font-weight: bold;">${calonIstri}</td>
      </tr>
      <tr>
        <td style="padding: 2.5px 0;">Hari/tanggal/jam</td>
        <td style="text-align: center;">:</td>
        <td>${hariTanggalJamAkad}</td>
      </tr>
      <tr>
        <td style="padding: 2.5px 0;">Tempat Akad Nikah</td>
        <td style="text-align: center;">:</td>
        <td>${tempatAkad}</td>
      </tr>
    </tbody>
  </table>

  <p style="margin: 8px 0 4px 0; text-align: justify;">
    Bersama ini kami sampaikan surat-surat yang diperlukan untuk diperiksa sebagai berikut:
  </p>
  <ol style="margin: 4px 0 12px 24px; padding: 0; font-size: 10pt; line-height: 1.45;">
    <li>Surat pengantar perkawinan dari desa/kelurahan</li>
    <li>Persetujuan calon mempelai</li>
    <li>Fotokopi KTP</li>
    <li>Fotokopi akta kelahiran</li>
    <li>Fotokopi kartu keluarga</li>
    <li>Paspoto 2x3 = 4 lembar dan 4x6 = 1 lembar berlatar belakang biru</li>
    <li>....................................................................................</li>
    <li>....................................................................................</li>
  </ol>

  <p style="margin: 8px 0 18px 0; text-align: justify;">
    Demikian permohonan ini kami sampaikan, kiranya dapat diperiksa, dihadiri dan dicatat sesuai dengan ketentuan peraturan perundang-undangan.
  </p>

  <table style="width: 100%; border-collapse: collapse; font-size: 10.5pt; margin-top: 14px;">
    <tbody>
      <tr>
        <td style="width: 52%; vertical-align: top;">
          <div>Diterima tanggal .......................................</div>
          <div>Yang menerima,</div>
          <div style="font-weight: bold;">Kepala KUA / PPN LN</div>
          <div style="height: 68px;"></div>
          <div>.................................................................</div>
        </td>
        <td style="width: 48%; vertical-align: top; text-align: center;">
          <div>&nbsp;</div>
          <div>Wassalam,</div>
          <div style="font-weight: bold;">Pemohon</div>
          <div style="height: 68px;"></div>
          <div style="font-weight: bold; text-decoration: underline;">${namaPemohon}</div>
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
}
