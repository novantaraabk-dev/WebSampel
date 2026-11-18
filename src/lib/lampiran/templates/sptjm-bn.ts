import {
  type OpenSidRenderContext,
  formatTanggalIndonesia,
  toTitleCaseIndonesian,
} from '../../opensid-surat-engine';

function hitungUsiaString(tglLahir: string): string {
  try {
    const parts = tglLahir.split('-');
    if (parts.length === 3) {
      const birth = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age > 0 ? `${age} Tahun` : '';
    }
  } catch {
    // ignore
  }
  return '';
}

export function buildSptjmBnPortraitHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};
  const pelaku = ctx?.pelakuBagian || {};

  const namaDesa = ctx?.namaDesa || 'Sampeldes';
  const namaKecamatan = ctx?.namaKecamatan || 'Gandrungmangu';
  const namaKabupaten = ctx?.namaKabupaten || 'Cilacap';

  // 1. Data Pemohon / Subjek
  const namaSubjek =
    fValues['form_nama_pemohon'] ||
    fValues['nama_pemohon'] ||
    pelaku.individu?.nama ||
    vIndividu?.nama ||
    ctx?.requesterName ||
    '-';
  const nikSubjek =
    fValues['form_nik_pemohon'] ||
    fValues['nik_pemohon'] ||
    pelaku.individu?.nik ||
    vIndividu?.nik ||
    '-';
  const noKkSubjek =
    fValues['form_no_kk'] ||
    fValues['no_kk'] ||
    pelaku.individu?.no_kk ||
    vIndividu?.no_kk ||
    '-';
  const kepalaKkSubjek =
    fValues['form_kepala_kk'] ||
    fValues['kepala_kk'] ||
    pelaku.individu?.kepala_kk ||
    vIndividu?.kepala_kk ||
    namaSubjek ||
    '-';

  const tempatLahir = vIndividu?.tempat_lahir || pelaku.individu?.tempat_lahir || '';
  const tanggalLahir = vIndividu?.tanggal_lahir || pelaku.individu?.tanggal_lahir || '';
  const ttlSubjek =
    tempatLahir && tanggalLahir
      ? `${tempatLahir}, ${formatTanggalIndonesia(tanggalLahir)}`
      : tempatLahir || (tanggalLahir ? formatTanggalIndonesia(tanggalLahir) : '-');

  const usia = tanggalLahir ? hitungUsiaString(tanggalLahir) : '';
  const usiaText = usia ? ` (${usia})` : '';

  const sex = vIndividu?.jenis_kelamin || pelaku.individu?.jenis_kelamin || 'Laki-Laki';
  const agama = vIndividu?.agama || pelaku.individu?.agama || 'Islam';
  const pekerjaan = vIndividu?.pekerjaan || pelaku.individu?.pekerjaan || 'Wiraswasta';
  const pendidikan = vIndividu?.pendidikan_kk || pelaku.individu?.pendidikan_kk || 'SLTA / Sederajat';
  const statusKawin = vIndividu?.status_kawin || pelaku.individu?.status_kawin || 'Kawin Tercatat';
  const alamat = vIndividu?.alamat || pelaku.individu?.alamat || `Sampeldes RT. 001 RW. 005, Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap`;

  // 2. Data Perbandingan Dokumen (Dokumen 1 vs Dokumen 2)
  const doc1Name =
    fValues['form_nama_dokumen_1'] ||
    fValues['nama_dokumen_1'] ||
    fValues['doc1Name'] ||
    fValues['jenisDokumen1'] ||
    'KTP / Kartu Keluarga';

  const doc1Data =
    fValues['form_nama_di_dokumen_1'] ||
    fValues['nama_di_dokumen_1'] ||
    fValues['doc1Data'] ||
    namaSubjek;

  const doc2Name =
    fValues['form_nama_kartu_identitas'] ||
    fValues['form_jenis_dokumen_2'] ||
    fValues['nama_kartu_identitas'] ||
    fValues['jenis_dokumen_2'] ||
    fValues['doc2Name'] ||
    'Ijazah / Buku Nikah / Sertifikat';

  const doc2Data =
    fValues['form_nama_di_dokumen_2'] ||
    fValues['nama_di_dokumen_2'] ||
    fValues['doc2Data'] ||
    namaSubjek;

  const doc1Lengkap =
    doc1Name.toLowerCase().includes('ktp') || doc1Name.toLowerCase().includes('kartu tanda penduduk')
      ? 'Kartu Tanda Penduduk (KTP)'
      : doc1Name;

  // 3. Saksi I & Saksi II
  const rawNamaSaksi1 =
    fValues['form_nama_saksi_1'] ||
    fValues['form_nama_saksi_i'] ||
    fValues['nama_saksi_1'] ||
    fValues['witness1Name'] ||
    pelaku.saksi_1?.nama ||
    pelaku.saksi_i?.nama ||
    '';
  const rawNikSaksi1 =
    fValues['form_nik_saksi_1'] ||
    fValues['form_nik_saksi_i'] ||
    fValues['nik_saksi_1'] ||
    fValues['witness1Nik'] ||
    pelaku.saksi_1?.nik ||
    pelaku.saksi_i?.nik ||
    '';

  const rawNamaSaksi2 =
    fValues['form_nama_saksi_2'] ||
    fValues['form_nama_saksi_ii'] ||
    fValues['nama_saksi_2'] ||
    fValues['witness2Name'] ||
    pelaku.saksi_2?.nama ||
    pelaku.saksi_ii?.nama ||
    '';
  const rawNikSaksi2 =
    fValues['form_nik_saksi_2'] ||
    fValues['form_nik_saksi_ii'] ||
    fValues['nik_saksi_2'] ||
    fValues['witness2Nik'] ||
    pelaku.saksi_2?.nik ||
    pelaku.saksi_ii?.nik ||
    '';

  const namaSaksi1 = rawNamaSaksi1 ? toTitleCaseIndonesian(rawNamaSaksi1) : '...................................................';
  const nikSaksi1 = rawNikSaksi1 || '................................';

  const namaSaksi2 = rawNamaSaksi2 ? toTitleCaseIndonesian(rawNamaSaksi2) : '...................................................';
  const nikSaksi2 = rawNikSaksi2 || '................................';

  // 4. Pejabat Penandatangan
  const jabatanPamong = ctx?.jabatanPamong || 'Kepala Desa';
  const namaPamong = ctx?.namaPamong || 'TUKIMAN';
  const tanggalSurat = ctx?.tanggalSurat || formatTanggalIndonesia(new Date());

  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.4; color: #000; width: 100%; box-sizing: border-box; padding: 4px 6px;">
  <!-- HEADER & KODE LAMPIRAN -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
    <tbody>
      <tr>
        <td style="width: 72%; vertical-align: top; font-size: 9.5pt; font-weight: bold; line-height: 1.25;">
          PEMERINTAH KABUPATEN ${namaKabupaten.toUpperCase()}<br/>
          KECAMATAN ${namaKecamatan.toUpperCase()}<br/>
          DESA ${namaDesa.toUpperCase()}
        </td>
        <td style="width: 28%; text-align: right; vertical-align: top;">
          <div style="border: 1.5px solid #000; display: inline-block; padding: 4px 10px; font-weight: bold; font-size: 10.5pt; letter-spacing: 0.5px; background: #fff;">
            SPTJM-BN
          </div>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- JUDUL SURAT LAMPIRAN -->
  <div style="text-align: center; margin: 4px 0 14px 0;">
    <div style="font-weight: bold; font-size: 11.5pt; text-decoration: underline; text-transform: uppercase; letter-spacing: 0.5px;">
      SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK (SPTJM)<br/>PERBEDAAN IDENTITAS & NAMA
    </div>
    <div style="font-size: 8pt; color: #333; margin-top: 2px;">
      Dasar Regulasi: Permendagri No. 108 Tahun 2019 | Instansi: Pemerintah Desa ${namaDesa}
    </div>
  </div>

  <p style="text-align: justify; margin: 0 0 10px 0; font-size: 9.5pt; line-height: 1.45;">
    Yang bertanda tangan di bawah ini menerangkan dengan sebenarnya data identitas subjek lampiran <strong>Surat Pernyataan Tanggung Jawab Mutlak Perbedaan Identitas & Nama (SPTJM-BN)</strong> sebagai berikut:
  </p>

  <!-- DATA SUBJEK -->
  <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 12px; line-height: 1.45;">
    <tbody>
      <tr>
        <td style="width: 32%; padding: 2px 0;">1. Nama Lengkap</td>
        <td style="width: 2%;">:</td>
        <td style="font-weight: bold; text-transform: uppercase;">${namaSubjek}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">2. NIK / Nomor KTP</td>
        <td>:</td>
        <td>${nikSubjek}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">3. Nomor Kartu Keluarga (KK)</td>
        <td>:</td>
        <td>${noKkSubjek}${kepalaKkSubjek && kepalaKkSubjek !== '-' ? ` (Kepala Keluarga: ${kepalaKkSubjek})` : ''}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">4. Tempat / Tanggal Lahir</td>
        <td>:</td>
        <td>${ttlSubjek}${usiaText}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">5. Jenis Kelamin / Agama</td>
        <td>:</td>
        <td>${sex} / ${agama}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">6. Pekerjaan / Pendidikan</td>
        <td>:</td>
        <td>${pekerjaan} / ${pendidikan}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">7. Status Perkawinan</td>
        <td>:</td>
        <td>${statusKawin}</td>
      </tr>
      <tr>
        <td style="padding: 2px 0; vertical-align: top;">8. Alamat Domisili</td>
        <td style="vertical-align: top;">:</td>
        <td>${alamat}</td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN PERBEDAAN IDENTITAS DOKUMEN 1 VS DOKUMEN 2 -->
  <div style="background-color: #fafafa; border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px 14px; margin-bottom: 12px;">
    <p style="margin: 0 0 6px 0; font-size: 9.5pt;">
      Dengan ini menerangkan dengan sebenarnya bahwa nama yang tercantum dalam :
    </p>

    <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; line-height: 1.5; margin-bottom: 8px;">
      <tbody>
        <tr>
          <td style="width: 230px; padding: 2px 0; vertical-align: top; font-weight: 500;">${doc1Name}</td>
          <td style="width: 20px; text-align: center; vertical-align: top;">:</td>
          <td style="vertical-align: top; font-weight: bold; text-transform: uppercase;">${doc1Data}</td>
        </tr>
        <tr>
          <td style="padding: 2px 0; vertical-align: top; font-weight: 500;">${doc2Name}</td>
          <td style="text-align: center; vertical-align: top;">:</td>
          <td style="vertical-align: top; font-weight: bold; text-transform: uppercase;">${doc2Data}</td>
        </tr>
      </tbody>
    </table>

    <p style="text-align: justify; font-size: 9.5pt; line-height: 1.45; margin: 0 0 6px 0;">
      Adalah orang yang sama atau bukan orang lain meskipun terjadi perbedaan antara yang tercatat di dalam ${doc1Lengkap} dengan ${doc2Name}. Jika dikemudian hari surat keterangan ini ditemukan pelanggaran hukum, maka saya siap mempertanggung jawabkannya.
    </p>
  </div>

  <p style="text-align: justify; font-size: 9.5pt; line-height: 1.45; margin: 0 0 10px 0;">
    Demikian formulir lampiran <strong>SPTJM-BN</strong> ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya pada <strong>Pemerintah Desa ${namaDesa}</strong>.
  </p>

  <!-- PENANDATANGANAN SAKSI-SAKSI -->
  <div style="margin-top: 10px; margin-bottom: 18px;">
    <div style="font-weight: bold; font-size: 9.5pt; margin-bottom: 8px;">Saksi-Saksi :</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
      <tbody>
        <tr>
          <!-- SAKSI 1 -->
          <td style="width: 50%; vertical-align: top; padding-right: 18px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
              <tbody>
                <tr>
                  <td style="width: 18px; vertical-align: top;">1.</td>
                  <td style="width: 52px; vertical-align: top;">Nama</td>
                  <td style="width: 10px; vertical-align: top;">:</td>
                  <td style="vertical-align: top; font-weight: bold; text-transform: uppercase;">${namaSaksi1}</td>
                </tr>
                <tr>
                  <td>&nbsp;</td>
                  <td style="vertical-align: top;">NIK</td>
                  <td style="vertical-align: top;">:</td>
                  <td style="vertical-align: top; font-family: monospace; font-size: 9pt;">${nikSaksi1}</td>
                </tr>
              </tbody>
            </table>
            <div style="margin-top: 8px; margin-left: 18px; font-size: 8.5pt; color: #222;">
              <div>Tanda Tangan Saksi I :</div>
              <div style="height: 48px;"></div>
              <div>( ${rawNamaSaksi1 ? `<strong>${toTitleCaseIndonesian(rawNamaSaksi1)}</strong>` : '...................................................'} )</div>
            </div>
          </td>

          <!-- SAKSI 2 -->
          <td style="width: 50%; vertical-align: top; padding-left: 18px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
              <tbody>
                <tr>
                  <td style="width: 18px; vertical-align: top;">2.</td>
                  <td style="width: 52px; vertical-align: top;">Nama</td>
                  <td style="width: 10px; vertical-align: top;">:</td>
                  <td style="vertical-align: top; font-weight: bold; text-transform: uppercase;">${namaSaksi2}</td>
                </tr>
                <tr>
                  <td>&nbsp;</td>
                  <td style="vertical-align: top;">NIK</td>
                  <td style="vertical-align: top;">:</td>
                  <td style="vertical-align: top; font-family: monospace; font-size: 9pt;">${nikSaksi2}</td>
                </tr>
              </tbody>
            </table>
            <div style="margin-top: 8px; margin-left: 18px; font-size: 8.5pt; color: #222;">
              <div>Tanda Tangan Saksi II :</div>
              <div style="height: 48px;"></div>
              <div>( ${rawNamaSaksi2 ? `<strong>${toTitleCaseIndonesian(rawNamaSaksi2)}</strong>` : '...................................................'} )</div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- TANDA TANGAN PEMOHON & KADES -->
  <table style="width: 100%; margin-top: 14px; text-align: center; border-collapse: collapse; font-size: 9.5pt;">
    <tbody>
      <tr>
        <td style="width: 50%; vertical-align: top; padding: 0 10px;">
          Mengetahui,<br/>
          <strong>${jabatanPamong} ${namaDesa}</strong>
          <div style="height: 68px;"></div>
          <strong style="text-decoration: underline;">${namaPamong}</strong>
        </td>
        <td style="width: 50%; vertical-align: top; padding: 0 10px;">
          ${namaDesa}, ${tanggalSurat}<br/>
          <strong>Pemohon / Yang Menyatakan,</strong>
          <div style="margin: 6px auto 0 auto; width: 110px; height: 38px; line-height: 38px; border: 1px dashed #666; font-size: 7.5pt; color: #555; background-color: #fafafa; border-radius: 2px;">
            Meterai Rp 10.000
          </div>
          <div style="height: 24px;"></div>
          <strong style="text-decoration: underline; text-transform: uppercase;">${namaSubjek}</strong>
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
}

