import {
  type OpenSidRenderContext,
  formatTanggalIndonesia,
  toTitleCaseIndonesian,
} from '../../opensid-surat-engine';

export function buildSpHilangPortraitHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};
  const pelaku = ctx?.pelakuBagian || {};

  const namaDesa = ctx?.namaDesa || 'Sampeldes';
  const namaKecamatan = ctx?.namaKecamatan || 'Gandrungmangu';
  const namaKabupaten = ctx?.namaKabupaten || 'Cilacap';

  // Helper for value or dots
  const fillOrDots = (val?: any) => {
    if (val === undefined || val === null) {
      return '............................................................................................';
    }
    const str = String(val).trim();
    if (str.length > 0 && str !== '-' && str !== 'undefined' && str !== 'null') {
      return str;
    }
    return '............................................................................................';
  };

  // 1. Data Pemohon / Pelapor
  const namaPelapor =
    fValues['form_nama_pelapor'] ||
    fValues['nama_pelapor'] ||
    pelaku.individu?.nama ||
    vIndividu?.nama ||
    ctx?.requesterName ||
    '';
  const nikPelapor =
    fValues['form_nik_pelapor'] ||
    fValues['nik_pelapor'] ||
    pelaku.individu?.nik ||
    vIndividu?.nik ||
    '';
  const noKkPelapor =
    fValues['form_no_kk'] ||
    fValues['no_kk'] ||
    pelaku.individu?.no_kk ||
    vIndividu?.no_kk ||
    '-';
  const kepalaKkPelapor =
    fValues['form_kepala_kk'] ||
    fValues['kepala_kk'] ||
    pelaku.individu?.kepala_kk ||
    vIndividu?.kepala_kk ||
    namaPelapor ||
    '-';

  const tempatLahir = vIndividu?.tempat_lahir || pelaku.individu?.tempat_lahir || '';
  const tanggalLahir = vIndividu?.tanggal_lahir || pelaku.individu?.tanggal_lahir || '';
  const ttlPelapor =
    tempatLahir && tanggalLahir
      ? `${tempatLahir}, ${formatTanggalIndonesia(tanggalLahir)}`
      : tempatLahir || (tanggalLahir ? formatTanggalIndonesia(tanggalLahir) : '-');

  const usia = tanggalLahir ? hitungUsiaString(tanggalLahir) : '';

  const sex = vIndividu?.jenis_kelamin || pelaku.individu?.jenis_kelamin || 'Laki-Laki';
  const agama = vIndividu?.agama || pelaku.individu?.agama || 'Islam';
  const pekerjaan = vIndividu?.pekerjaan || pelaku.individu?.pekerjaan || 'Wiraswasta';
  const pendidikan = vIndividu?.pendidikan_kk || pelaku.individu?.pendidikan_kk || 'SLTA / Sederajat';
  const statusKawin = vIndividu?.status_kawin || pelaku.individu?.status_kawin || 'Kawin Tercatat';
  const alamat = vIndividu?.alamat || pelaku.individu?.alamat || `Desa ${namaDesa}, Kecamatan ${namaKecamatan}`;

  // 2. Keterangan / Keperluan Kehilangan & Dokumen yang Hilang
  const isDuplikatNikah =
    (ctx?.judulSurat || '').toLowerCase().includes('nikah') ||
    (ctx?.kodeSurat || '').toLowerCase() === 's-33';

  const isDuplikatAkta =
    ((ctx?.judulSurat || '').toLowerCase().includes('akta') ||
      (ctx?.kodeSurat || '').toLowerCase() === 's-20') && !isDuplikatNikah;

  let dokumenHilangName = '';
  if (isDuplikatNikah) {
    dokumenHilangName = 'Buku Nikah (Kutipan Akta Nikah)';
  } else if (isDuplikatAkta) {
    dokumenHilangName = 'Kutipan Akta Kelahiran';
  } else {
    dokumenHilangName =
      fValues['form_lost_items'] ||
      fValues['form_nama_barang'] ||
      fValues['lostItems'] ||
      fValues['nama_barang'] ||
      fValues['form_jenis_dokumen'] ||
      fValues['jenis_dokumen'] ||
      'Dokumen / Barang Berharga';
  }

  const rawKeperluan =
    fValues['form_keperluan_lampiran'] ||
    fValues['form_keperluan'] ||
    fValues['form_alasan_duplikat'] ||
    fValues['alasan_duplikat'] ||
    fValues['keperluan'] ||
    fValues['purpose'] ||
    '';

  let keteranganKeperluan = rawKeperluan;
  if (!keteranganKeperluan || keteranganKeperluan.trim().length === 0 || keteranganKeperluan === '[Form_Keperluan_Lampiran]') {
    if (isDuplikatNikah) {
      const namaSuami = fValues['form_nama_calon_suami'] || fValues['form_nama_suami'] || fValues['husbandName'] || '';
      const namaIstri = fValues['form_nama_calon_istri'] || fValues['form_nama_istri'] || fValues['wifeName'] || '';
      const noAkta = fValues['form_no_akta_nikah'] || fValues['marriageBookNumber'] || '';
      const kondisi = fValues['form_status_buku_nikah'] || 'Hilang';
      keteranganKeperluan = `Permohonan Duplikat Buku Nikah${namaSuami && namaIstri ? ` atas pernikahan ${toTitleCaseIndonesian(namaSuami)} dengan ${toTitleCaseIndonesian(namaIstri)}` : ''}${noAkta && noAkta !== '-' ? ` (No. Akta Nikah: ${noAkta})` : ''} dikarenakan Buku Nikah asli telah ${kondisi}.`;
    } else if (isDuplikatAkta) {
      const noAkta = fValues['form_no_akta_kelahiran'] || fValues['form_no_akta'] || '';
      const namaAnak = fValues['form_nama_anak'] || '';
      keteranganKeperluan = `Permohonan Duplikat Akta Kelahiran${namaAnak ? ` atas nama ${namaAnak}` : ''}${noAkta ? ` (No. Akta: ${noAkta})` : ''} dikarenakan dokumen Akta Kelahiran Asli Rusak / Hilang Tercecer.`;
    } else {
      keteranganKeperluan = `Surat Pernyataan Kehilangan ${dokumenHilangName} untuk pengurusan penerbitan dokumen baru / laporan ke pihak berwajib.`;
    }
  }

  // 3. Saksi I & Saksi II
  const namaSaksi1 =
    fValues['form_nama_saksi_1'] ||
    fValues['form_nama_saksi_i'] ||
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

  // 4. Pejabat & Tanggal
  const jabatanPamong = ctx?.jabatanPamong || 'Kepala Desa';
  const namaPamong = ctx?.namaPamong || ctx?.namaKepalaDesa || 'TUKIMAN';
  const tanggalSuratFormatted = ctx?.tanggalSurat
    ? formatTanggalIndonesia(ctx.tanggalSurat)
    : formatTanggalIndonesia(new Date());

  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 1.4; color: #000; width: 100%; box-sizing: border-box; padding: 5px 25px;">
  <!-- KOP HEADER LAMPIRAN -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
    <div style="font-size: 9pt; line-height: 1.3;">
      <strong>PEMERINTAH KABUPATEN ${namaKabupaten.toUpperCase()}</strong><br/>
      KECAMATAN ${namaKecamatan.toUpperCase()}<br/>
      <strong>DESA ${namaDesa.toUpperCase()}</strong>
    </div>
    <div style="border: 1.5px solid #000; padding: 2px 14px; font-weight: bold; font-family: monospace; font-size: 10.5pt; background: #fff;">
      SP-HILANG
    </div>
  </div>

  <!-- JUDUL DOKUMEN -->
  <div style="text-align: center; margin: 10px 0 14px 0;">
    <h3 style="margin: 0; font-size: 11pt; font-weight: bold; text-transform: uppercase; text-decoration: underline;">
      SURAT PERNYATAAN KEHILANGAN DOKUMEN / BARANG
    </h3>
    <p style="margin: 3px 0 0 0; font-size: 8.5pt; color: #333;">
      Dasar Regulasi: Standar SPKT Kepolisian RI | Instansi: Pemerintah Desa ${namaDesa}
    </p>
  </div>

  <p style="text-align: justify; margin-bottom: 8px; font-size: 9pt; line-height: 1.4;">
    Yang bertanda tangan di bawah ini menerangkan dengan sebenarnya data identitas subjek lampiran <strong>Surat Pernyataan Kehilangan Dokumen / Barang (SP-HILANG)</strong> sebagai berikut:
  </p>

  <!-- TABEL IDENTITAS -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9pt; line-height: 1.45;">
    <tbody>
      <tr>
        <td style="width: 32%; padding: 2px 0;">1. Nama Lengkap</td>
        <td style="width: 2%;">:</td>
        <td style="font-weight: bold;">${namaPelapor ? toTitleCaseIndonesian(namaPelapor) : fillOrDots(undefined)}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">2. NIK / Nomor KTP</td>
        <td>:</td>
        <td style="font-family: monospace; font-size: 9.5pt;">${fillOrDots(nikPelapor)}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">3. Nomor Kartu Keluarga (KK)</td>
        <td>:</td>
        <td>${fillOrDots(noKkPelapor)} ${kepalaKkPelapor && kepalaKkPelapor !== '-' ? `(Kepala Keluarga: ${toTitleCaseIndonesian(kepalaKkPelapor)})` : ''}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">4. Tempat / Tanggal Lahir</td>
        <td>:</td>
        <td>${ttlPelapor}${usia ? ` (${usia})` : ''}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">5. Jenis Kelamin / Agama</td>
        <td>:</td>
        <td>${toTitleCaseIndonesian(sex)} / ${toTitleCaseIndonesian(agama)}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">6. Pekerjaan / Pendidikan</td>
        <td>:</td>
        <td>${toTitleCaseIndonesian(pekerjaan)} / ${toTitleCaseIndonesian(pendidikan)}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">7. Status Perkawinan</td>
        <td>:</td>
        <td>${toTitleCaseIndonesian(statusKawin)}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0; vertical-align: top;">8. Alamat Domisili</td>
        <td style="vertical-align: top;">:</td>
        <td style="vertical-align: top;">${toTitleCaseIndonesian(alamat)}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">9. Dokumen yang Hilang/Rusak</td>
        <td>:</td>
        <td style="font-weight: bold; color: #000;">${toTitleCaseIndonesian(dokumenHilangName)}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0; vertical-align: top;">10. Keterangan / Kronologi</td>
        <td style="vertical-align: top;">:</td>
        <td style="vertical-align: top; font-weight: 500;">${keteranganKeperluan}</td>
      </tr>
    </tbody>
  </table>

  <!-- PARAGRAF PENUTUP -->
  <p style="text-align: justify; margin-bottom: 12px; font-size: 8.8pt; line-height: 1.4;">
    Surat rincian kronologi kehilangan / kerusakan dokumen <strong>${toTitleCaseIndonesian(dokumenHilangName)}</strong> sebagai dasar kelengkapan berkas permohonan penerbitan duplikat / surat pengantar kehilangan. Demikian formulir lampiran <strong>SP-HILANG</strong> ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya pada <strong>Pemerintah Desa ${namaDesa}</strong>.
  </p>

  <!-- PENANDATANGANAN SAKSI-SAKSI -->
  <div style="margin-top: 10px; margin-bottom: 14px;">
    <p style="font-weight: bold; margin: 0 0 6px 0; font-size: 9pt;">Saksi-Saksi :</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 8.8pt;">
      <tbody>
        <tr>
          <td style="width: 50%; vertical-align: top; padding-right: 14px;">
            1. <strong>${namaSaksi1 ? toTitleCaseIndonesian(namaSaksi1) : '...................................................'}</strong><br/>
            &nbsp;&nbsp;&nbsp;&nbsp;NIK: ${nikSaksi1 ? nikSaksi1 : '...................................................'}<br/>
            <div style="margin-top: 4px; font-size: 8pt; color: #444;">Tanda Tangan:</div>
            <div style="height: 40px;"></div>
            ...................................................
          </td>
          <td style="width: 50%; vertical-align: top; padding-left: 14px;">
            2. <strong>${namaSaksi2 ? toTitleCaseIndonesian(namaSaksi2) : '...................................................'}</strong><br/>
            &nbsp;&nbsp;&nbsp;&nbsp;NIK: ${nikSaksi2 ? nikSaksi2 : '...................................................'}<br/>
            <div style="margin-top: 4px; font-size: 8pt; color: #444;">Tanda Tangan:</div>
            <div style="height: 40px;"></div>
            ...................................................
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- TANDA TANGAN MENGETAHUI & PEMOHON -->
  <table style="width: 100%; margin-top: 14px; text-align: center; border-collapse: collapse; font-size: 9pt;">
    <tbody>
      <tr>
        <td style="width: 50%; vertical-align: top;">
          Mengetahui,<br/>
          <strong>${jabatanPamong} ${namaDesa}</strong>
          <div style="height: 48px;"></div>
          <strong style="text-decoration: underline;">${toTitleCaseIndonesian(namaPamong)}</strong>
        </td>
        <td style="width: 50%; vertical-align: top;">
          ${namaDesa}, ${tanggalSuratFormatted}<br/>
          <strong>Pemohon / Yang Menyatakan,</strong><br/>
          <div style="height: 18px;"></div>
          <div style="margin-bottom: 2px;"><span style="border: 1px dashed #64748b; padding: 2px 6px; font-size: 7.5pt; color: #475569;">Meterai Rp 10.000</span></div>
          <div style="height: 22px;"></div>
          <strong style="text-decoration: underline;">${namaPelapor ? toTitleCaseIndonesian(namaPelapor) : fillOrDots(undefined)}</strong>
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
}

function hitungUsiaString(tglLahir: string): string {
  try {
    const birth = new Date(tglLahir);
    if (isNaN(birth.getTime())) return '';
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age} Tahun` : '';
  } catch {
    return '';
  }
}

