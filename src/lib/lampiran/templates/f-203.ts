import {
  type OpenSidRenderContext,
  formatTanggalIndonesia,
  toTitleCaseIndonesian,
} from '../../opensid-surat-engine';

export function buildF203PortraitHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};
  const pelaku = ctx?.pelakuBagian || {};

  const namaDesa = ctx?.namaDesa || 'Sampeldes';

  // Helper for value or dots
  const fillOrDots = (val?: any) => {
    if (val === undefined || val === null) {
      return '............................................................................................';
    }
    const str = String(val).trim();
    if (str.length > 0 && str !== '-' && str !== 'undefined' && str !== 'null') {
      return `<span style="font-weight: bold; text-transform: uppercase;">${str}</span>`;
    }
    return '............................................................................................';
  };

  // 1. Pelapor / Yang Membuat Pernyataan (Pemohon)
  const namaPelapor =
    fValues['form_nama_pelapor'] ||
    fValues['nama_pelapor'] ||
    pelaku.individu?.nama ||
    pelaku.pelapor?.nama ||
    vIndividu?.nama ||
    ctx?.requesterName ||
    '';
  const nikPelapor =
    fValues['form_nik_pelapor'] ||
    fValues['nik_pelapor'] ||
    pelaku.individu?.nik ||
    pelaku.pelapor?.nik ||
    vIndividu?.nik ||
    '';
  const ttlPelapor =
    fValues['form_ttl_pelapor'] ||
    fValues['ttl_pelapor'] ||
    (vIndividu?.tempat_lahir && vIndividu?.tanggal_lahir
      ? `${vIndividu.tempat_lahir}, ${formatTanggalIndonesia(vIndividu.tanggal_lahir)}`
      : pelaku.individu?.tempat_lahir && pelaku.individu?.tanggal_lahir
        ? `${pelaku.individu.tempat_lahir}, ${formatTanggalIndonesia(pelaku.individu.tanggal_lahir)}`
        : '');
  const pekerjaanPelapor =
    fValues['form_pekerjaan_pelapor'] ||
    fValues['pekerjaan_pelapor'] ||
    vIndividu?.pekerjaan ||
    pelaku.individu?.pekerjaan ||
    '';
  const alamatPelapor =
    fValues['form_alamat_pelapor'] ||
    fValues['alamat_pelapor'] ||
    vIndividu?.alamat ||
    pelaku.individu?.alamat ||
    '';

  // Peruntukan Pengajuan (Anak, Diri Sendiri, Pasangan, Keluarga Lain)
  const targetPengajuan =
    fValues['targetPengajuan'] ||
    fValues['peruntukanPengajuan'] ||
    (ctx as any)?.targetPengajuan ||
    'anak';

  // 2. Subjek / Anak / Yang Dinyatakan (Kelahiran)
  const namaAnak =
    fValues['form_nama_anak'] ||
    fValues['nama_anak'] ||
    fValues['form_nama_bayi'] ||
    fValues['nama_bayi'] ||
    pelaku.anak?.nama ||
    (targetPengajuan === 'diri_sendiri' ? namaPelapor : '');
  const nikAnak =
    fValues['form_nik_anak'] ||
    fValues['nik_anak'] ||
    pelaku.anak?.nik ||
    (targetPengajuan === 'diri_sendiri' ? nikPelapor : '');
  const tempatLahirAnak =
    fValues['form_tempat_lahir_anak'] ||
    fValues['tempat_lahir_anak'] ||
    fValues['form_tempat_lahir_bayi'] ||
    pelaku.anak?.tempat_lahir ||
    (targetPengajuan === 'diri_sendiri' ? vIndividu?.tempat_lahir || pelaku.individu?.tempat_lahir || '' : '');
  const tglLahirAnak =
    fValues['form_tanggal_lahir_anak'] ||
    fValues['tanggal_lahir_anak'] ||
    fValues['form_tgl_lahir_bayi'] ||
    pelaku.anak?.tanggal_lahir ||
    (targetPengajuan === 'diri_sendiri' ? vIndividu?.tanggal_lahir || pelaku.individu?.tanggal_lahir || '' : '');
  const hariLahirAnak =
    fValues['form_hari_lahir_anak'] ||
    fValues['hari_lahir_anak'] ||
    fValues['form_hari_kelahiran'] ||
    (targetPengajuan === 'diri_sendiri' && tglLahirAnak ? '' : '');
  const ttlAnak =
    tempatLahirAnak && tglLahirAnak
      ? `${tempatLahirAnak}, ${formatTanggalIndonesia(tglLahirAnak)}`
      : tempatLahirAnak || (tglLahirAnak ? formatTanggalIndonesia(tglLahirAnak) : fValues['form_ttl_anak'] || (targetPengajuan === 'diri_sendiri' ? ttlPelapor : ''));
  const anakKe =
    fValues['form_kelahiran_ke'] ||
    fValues['form_anak_ke'] ||
    fValues['kelahiran_ke'] ||
    fValues['anak_ke'] ||
    '';
  const jenisKelahiran =
    fValues['form_jenis_kelahiran'] ||
    fValues['jenis_kelahiran'] ||
    'Tunggal';
  const alamatAnak =
    fValues['form_alamat_anak'] ||
    fValues['alamat_anak'] ||
    pelaku.anak?.alamat ||
    (targetPengajuan === 'diri_sendiri' ? alamatPelapor : alamatPelapor);

  // 3. Ibu Kandung
  const namaIbu =
    fValues['form_nama_ibu'] ||
    fValues['nama_ibu'] ||
    pelaku.ibu?.nama ||
    vIndividu?.nama_ibu ||
    (vIndividu as any)?.ibu_nama ||
    '';
  const nikIbu =
    fValues['form_nik_ibu'] ||
    fValues['nik_ibu'] ||
    pelaku.ibu?.nik ||
    vIndividu?.nik_ibu ||
    (vIndividu as any)?.ibu_nik ||
    '';
  const tempatLahirIbu =
    fValues['form_tempat_lahir_ibu'] ||
    pelaku.ibu?.tempat_lahir ||
    '';
  const tglLahirIbu =
    fValues['form_tanggal_lahir_ibu'] ||
    fValues['form_tgl_lahir_ibu'] ||
    pelaku.ibu?.tanggal_lahir ||
    '';
  const ttlIbu =
    tempatLahirIbu && tglLahirIbu
      ? `${tempatLahirIbu}, ${formatTanggalIndonesia(tglLahirIbu)}`
      : tempatLahirIbu || (tglLahirIbu ? formatTanggalIndonesia(tglLahirIbu) : fValues['form_ttl_ibu'] || '');
  const pekerjaanIbu =
    fValues['form_pekerjaan_ibu'] ||
    fValues['pekerjaan_ibu'] ||
    pelaku.ibu?.pekerjaan ||
    '';
  const alamatIbu =
    fValues['form_alamat_ibu'] ||
    fValues['alamat_ibu'] ||
    pelaku.ibu?.alamat ||
    alamatPelapor;

  // 4. Penolong Kelahiran
  const namaPenolong =
    fValues['form_penolong_kelahiran'] ||
    fValues['form_nama_penolong'] ||
    fValues['nama_penolong'] ||
    fValues['penolong_kelahiran'] ||
    pelaku.penolong?.nama ||
    '';
  const nikPenolong =
    fValues['form_nik_penolong'] ||
    fValues['nik_penolong'] ||
    pelaku.penolong?.nik ||
    '-';
  const pekerjaanPenolong =
    fValues['form_profesi_penolong'] ||
    fValues['form_pekerjaan_penolong'] ||
    fValues['pekerjaan_penolong'] ||
    pelaku.penolong?.pekerjaan ||
    '';
  const alamatPenolong =
    fValues['form_alamat_penolong'] ||
    fValues['alamat_penolong'] ||
    pelaku.penolong?.alamat ||
    '';

  // 5. Saksi I & Saksi II
  const namaSaksi1 =
    fValues['form_nama_saksi_1'] ||
    fValues['form_nama_saksi_i'] ||
    fValues['form_saksi_i'] ||
    fValues['form_saksi_1'] ||
    fValues['nama_saksi_1'] ||
    pelaku.saksi_1?.nama ||
    pelaku.saksi1?.nama ||
    pelaku.saksi_i?.nama ||
    '';
  const nikSaksi1 =
    fValues['form_nik_saksi_1'] ||
    fValues['form_nik_saksi_i'] ||
    fValues['nik_saksi_1'] ||
    pelaku.saksi_1?.nik ||
    pelaku.saksi1?.nik ||
    pelaku.saksi_i?.nik ||
    '';

  const namaSaksi2 =
    fValues['form_nama_saksi_2'] ||
    fValues['form_nama_saksi_ii'] ||
    fValues['form_saksi_ii'] ||
    fValues['form_saksi_2'] ||
    fValues['nama_saksi_2'] ||
    pelaku.saksi_2?.nama ||
    pelaku.saksi2?.nama ||
    pelaku.saksi_ii?.nama ||
    '';
  const nikSaksi2 =
    fValues['form_nik_saksi_2'] ||
    fValues['form_nik_saksi_ii'] ||
    fValues['nik_saksi_2'] ||
    pelaku.saksi_2?.nik ||
    pelaku.saksi2?.nik ||
    pelaku.saksi_ii?.nik ||
    '';

  // 6. Tanggal Surat
  const tanggalSuratFormatted = ctx?.tanggalSurat
    ? formatTanggalIndonesia(ctx.tanggalSurat)
    : formatTanggalIndonesia(new Date());

  // Redaksi dinamis berdasarkan peruntukan pengajuan
  let redaksiBagian2 = 'menyatakan bahwa :';
  let labelAnakKe = 'Anak ke &nbsp;*)';
  if (targetPengajuan === 'diri_sendiri') {
    redaksiBagian2 = 'menyatakan dengan sesungguhnya bahwa diri saya sendiri :';
    labelAnakKe = 'Urutan Lahir (Anak ke)';
  } else if (targetPengajuan === 'istri' || targetPengajuan === 'suami') {
    redaksiBagian2 = 'menyatakan dengan sesungguhnya bahwa suami / istri saya :';
  } else if (targetPengajuan === 'keluarga_lain') {
    redaksiBagian2 = 'menyatakan dengan sesungguhnya bahwa anggota keluarga saya :';
  } else {
    redaksiBagian2 = 'menyatakan bahwa anak kandung saya :';
  }

  const redaksiBagian3 =
    targetPengajuan === 'diri_sendiri'
      ? 'adalah anak kandung dari orang tua saya :'
      : targetPengajuan === 'istri' || targetPengajuan === 'suami'
        ? 'adalah anak kandung dari orang tua :'
        : 'adalah anak kandung dari :';

  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 9pt; line-height: 1.3; color: #000; width: 100%; box-sizing: border-box; padding: 5px 25px;">
  <!-- KODE FORMULIR -->
  <div style="text-align: right; margin-bottom: 12px;">
    <span style="border: 1.5px solid #000; padding: 2px 14px; font-weight: bold; font-size: 10.5pt; background: #fff;">F-2.03</span>
  </div>

  <!-- JUDUL -->
  <div style="text-align: center; font-weight: bold; font-size: 11pt; line-height: 1.3; margin-bottom: 16px;">
    SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK (SPTJM)<br/>
    KEBENARAN DATA KELAHIRAN
  </div>

  <!-- BAGIAN 1: SAYA YANG BERTANDA TANGAN -->
  <p style="margin: 0 0 3px 0; font-size: 9pt;">Saya yang bertanda tangan di bawah ini :</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9pt;">
    <tr><td style="width: 175px; padding: 1.5px 0;">Nama</td><td style="width: 15px; text-align: center;">:</td><td>${fillOrDots(namaPelapor)}</td></tr>
    <tr><td style="padding: 1.5px 0;">NIK</td><td style="text-align: center;">:</td><td>${fillOrDots(nikPelapor)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Tempat/Tanggal Lahir</td><td style="text-align: center;">:</td><td>${fillOrDots(ttlPelapor)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Pekerjaan</td><td style="text-align: center;">:</td><td>${fillOrDots(pekerjaanPelapor)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Alamat</td><td style="text-align: center;">:</td><td>${fillOrDots(alamatPelapor)}</td></tr>
  </table>

  <!-- BAGIAN 2: MENYATAKAN BAHWA -->
  <p style="margin: 0 0 3px 0; font-size: 9pt; font-weight: 500;">${redaksiBagian2}</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9pt;">
    <tr><td style="width: 175px; padding: 1.5px 0;">Nama</td><td style="width: 15px; text-align: center;">:</td><td>${fillOrDots(namaAnak)}</td></tr>
    <tr><td style="padding: 1.5px 0;">NIK</td><td style="text-align: center;">:</td><td>${fillOrDots(nikAnak)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Tempat/Tanggal Lahir</td><td style="text-align: center;">:</td><td>${fillOrDots(ttlAnak)}${hariLahirAnak ? ` (${hariLahirAnak})` : ''}</td></tr>
    <tr><td style="padding: 1.5px 0;">${labelAnakKe}</td><td style="text-align: center;">:</td><td>${fillOrDots(anakKe)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Jenis Kelahiran</td><td style="text-align: center;">:</td><td>${fillOrDots(jenisKelahiran)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Alamat</td><td style="text-align: center;">:</td><td>${fillOrDots(alamatAnak)}</td></tr>
  </table>

  <!-- BAGIAN 3: ADALAH ANAK KANDUNG DARI -->
  <p style="margin: 0 0 3px 0; font-size: 9pt; font-weight: 500;">${redaksiBagian3}</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9pt;">
    <tr><td style="width: 175px; padding: 1.5px 0;">Nama Ibu</td><td style="width: 15px; text-align: center;">:</td><td>${fillOrDots(namaIbu)}</td></tr>
    <tr><td style="padding: 1.5px 0;">NIK</td><td style="text-align: center;">:</td><td>${fillOrDots(nikIbu)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Tempat/Tanggal Lahir</td><td style="text-align: center;">:</td><td>${fillOrDots(ttlIbu)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Pekerjaan</td><td style="text-align: center;">:</td><td>${fillOrDots(pekerjaanIbu)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Alamat</td><td style="text-align: center;">:</td><td>${fillOrDots(alamatIbu)}</td></tr>
  </table>

  <!-- BAGIAN 4: YANG LAHIR DENGAN PENOLONG KELAHIRAN -->
  <p style="margin: 0 0 3px 0; font-size: 9pt;">yang lahir dengan penolong kelahiran :</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9pt;">
    <tr><td style="width: 175px; padding: 1.5px 0;">Nama</td><td style="width: 15px; text-align: center;">:</td><td>${fillOrDots(namaPenolong)}</td></tr>
    <tr><td style="padding: 1.5px 0;">NIK</td><td style="text-align: center;">:</td><td>${fillOrDots(nikPenolong)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Pekerjaan</td><td style="text-align: center;">:</td><td>${fillOrDots(pekerjaanPenolong)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Alamat</td><td style="text-align: center;">:</td><td>${fillOrDots(alamatPenolong)}</td></tr>
  </table>

  <!-- PARAGRAF PENUTUP -->
  <p style="text-align: justify; line-height: 1.4; margin: 0 0 16px 0; font-size: 8.8pt;">
    Demikian surat pernyataan ini saya buat dengan sebenar-benarnya dan apabila di kemudian hari ternyata pernyataan saya ini tidak benar, maka saya bersedia diproses secara hukum sesuai dengan peraturan perundang-undangan dan dokumen yang diterbitkan akibat dari pernyataan ini menjadi tidak sah.
  </p>

  <!-- TANDA TANGAN -->
  <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
    <tr>
      <td style="width: 52%; vertical-align: top;">
        Saksi I,
        <div style="height: 38px;"></div>
        ( ${namaSaksi1 ? `<strong>${namaSaksi1.toUpperCase()}</strong>` : '...................................................'} )<br/>
        NIK. ${nikSaksi1 || '...................................................'}

        <div style="height: 16px;"></div>
        Saksi II,
        <div style="height: 38px;"></div>
        ( ${namaSaksi2 ? `<strong>${namaSaksi2.toUpperCase()}</strong>` : '...................................................'} )<br/>
        NIK. ${nikSaksi2 || '...................................................'}
      </td>
      <td style="width: 48%; vertical-align: top; text-align: center; padding-left: 15px;">
        ${namaDesa}, ${tanggalSuratFormatted}<br/>
        Saya yang menyatakan,
        <div style="margin: 6px auto; width: 110px; height: 48px; border: 1px dashed #666; display: flex; align-items: center; justify-content: center; font-size: 7.5pt; color: #555; text-align: center; line-height: 1.2;">
          METERAI<br/>Rp 10.000
        </div>
        ( ${namaPelapor ? `<strong>${namaPelapor.toUpperCase()}</strong>` : '...................................................'} )
      </td>
    </tr>
  </table>
</div>`;
}
