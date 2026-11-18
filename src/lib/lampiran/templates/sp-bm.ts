import { formatTanggalIndonesia, hitungUmurIndonesia, type OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildSpBmPortraitHtml(ctx: OpenSidRenderContext): string {
  const ind = ctx?.individu || ({} as any);
  const fv = ctx?.formValues || {};

  const namaDesa = (ctx?.namaDesa || 'Sampeldes').toUpperCase();
  const namaKecamatan = (ctx?.namaKecamatan || 'Gandrungmangu').toUpperCase();
  const namaKabupaten = (ctx?.namaKabupaten || 'Cilacap').toUpperCase();
  const tanggalSurat = ctx?.tanggalSurat || formatTanggalIndonesia(new Date().toISOString());
  const namaKades = ctx?.namaPamong || 'TUKIMAN';

  // Data Pemohon
  const namaPemohon = (ind.nama || fv.name || 'AGUS ABDUL MUTOLIB').toUpperCase();
  const nikPemohon = ind.nik || fv.nik || '3301100402820001';
  const noKk = ind.no_kk || fv.noKk || fv.no_kk || '3301101312100005';
  const tempatLahir = ind.tempat_lahir || fv.birthPlace || 'Cilacap';
  const rawTglLahir = ind.tanggal_lahir || fv.birthDate || '1982-02-04';
  const tglLahir = formatTanggalIndonesia(rawTglLahir);
  const rawUmur = hitungUmurIndonesia(rawTglLahir);
  const umurText = rawUmur && rawUmur !== '-' ? (rawUmur.toLowerCase().includes('tahun') ? rawUmur : `${rawUmur} Tahun`) : '';
  const jenisKelamin = ind.jenis_kelamin || fv.gender || 'Laki-Laki';
  const agama = ind.agama || fv.religion || 'Islam';
  const pekerjaan = ind.pekerjaan || fv.job || 'Wiraswasta';
  const pendidikan = ind.pendidikan_kk || fv.education || 'SLTA / Sederajat';
  const statusPerkawinan =
    fv.form_status_perkawinan ||
    fv.maritalStatus ||
    (jenisKelamin.toLowerCase().includes('perempuan') ? 'Perawan (Belum Kawin)' : 'Jejaka (Belum Kawin)');
  const keperluan =
    fv.form_keperluan ||
    fv.purpose ||
    fv.form_tujuan ||
    'Persyaratan Pendaftaran Pernikahan / Kelengkapan Berkas Resmi';

  const alamatPemohon =
    ind.alamat ||
    fv.address ||
    `Sampeldes RT. 001 RW. 005, Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap`;

  // Data Saksi 1 & Saksi 2 (sinkron dari input form atau data saksi)
  const saksi1 = ctx?.pelakuBagian?.saksi_1 || (ctx as any)?.saksi1 || {};
  const saksi2 = ctx?.pelakuBagian?.saksi_2 || (ctx as any)?.saksi2 || {};

  const namaSaksi1 = (
    saksi1.nama ||
    fv.form_nama_saksi_1 ||
    fv.form_nama_saksi_i ||
    fv.witness1Name ||
    'SLAMET RIYADI'
  ).toUpperCase();
  const nikSaksi1 =
    saksi1.nik ||
    fv.form_nik_saksi_1 ||
    fv.form_nik_saksi_i ||
    fv.witness1Nik ||
    '3301101506750001';

  const namaSaksi2 = (
    saksi2.nama ||
    fv.form_nama_saksi_2 ||
    fv.form_nama_saksi_ii ||
    fv.witness2Name ||
    'BAMBANG SUTRISNO'
  ).toUpperCase();
  const nikSaksi2 =
    saksi2.nik ||
    fv.form_nik_saksi_2 ||
    fv.form_nik_saksi_ii ||
    fv.witness2Nik ||
    '3301102407720002';

  return `<div style="font-family: 'Times New Roman', Times, serif; font-size: 9.5pt; line-height: 1.25; color: #000;">
  <!-- KOP SURAT LAMPIRAN -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
    <tbody>
      <tr>
        <td style="width: 75%; vertical-align: top;">
          <div style="font-size: 8.5pt; font-weight: bold; line-height: 1.15;">
            PEMERINTAH KABUPATEN ${namaKabupaten}<br />
            KECAMATAN ${namaKecamatan}<br />
            DESA ${namaDesa}
          </div>
        </td>
        <td style="width: 25%; text-align: right; vertical-align: top;">
          <span style="display: inline-block; border: 1.5px solid #000; padding: 2px 10px; font-weight: bold; font-size: 9.5pt; letter-spacing: 0.5px;">
            SP-BM
          </span>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- JUDUL SURAT -->
  <div style="text-align: center; margin-bottom: 6px;">
    <div style="font-weight: bold; font-size: 11pt; text-decoration: underline; letter-spacing: 0.5px;">
      SURAT PERNYATAAN BELUM PERNAH MENIKAH
    </div>
    <div style="font-size: 8pt; color: #444; margin-top: 1px;">
      Dasar Regulasi: UU No. 16 Tahun 2019 | Instansi: Pemerintah Desa ${ctx?.namaDesa || 'Sampeldes'}
    </div>
  </div>

  <p style="margin: 0 0 4px 0; text-align: justify;">
    Yang bertanda tangan di bawah ini menerangkan dengan sebenarnya data identitas diri sebagai berikut :
  </p>

  <!-- DATA PEMOHON -->
  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-left: 6px; margin-bottom: 6px;">
    <tbody>
      <tr>
        <td style="width: 32%; padding: 0.8px 0;">1. Nama Lengkap</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 66%; font-weight: bold;">${namaPemohon}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">2. NIK / Nomor KTP</td>
        <td style="text-align: center;">:</td>
        <td>${nikPemohon}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">3. Nomor Kartu Keluarga (KK)</td>
        <td style="text-align: center;">:</td>
        <td>${noKk}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">4. Tempat / Tanggal Lahir</td>
        <td style="text-align: center;">:</td>
        <td>${tempatLahir}, ${tglLahir}${umurText ? ` (${umurText})` : ''}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">5. Jenis Kelamin / Agama</td>
        <td style="text-align: center;">:</td>
        <td>${jenisKelamin} / ${agama}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">6. Pekerjaan / Pendidikan</td>
        <td style="text-align: center;">:</td>
        <td>${pekerjaan} / ${pendidikan}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0;">7. Status Perkawinan</td>
        <td style="text-align: center;">:</td>
        <td style="font-weight: bold;">${statusPerkawinan}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0; vertical-align: top;">8. Alamat Domisili</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td>${alamatPemohon}</td>
      </tr>
    </tbody>
  </table>

  <!-- BOX PERNYATAAN BERSUMPAH -->
  <div style="border: 1px solid #999; border-radius: 4px; padding: 6px 10px; margin-bottom: 6px; background-color: #fafafa;">
    <p style="margin: 0 0 3px 0; font-weight: bold;">
      Dengan ini menyatakan dengan sesungguhnya dan bersumpah di hadapan saksi-saksi bahwa :
    </p>
    <ol style="margin: 0 0 0 16px; padding: 0; font-size: 8.5pt; line-height: 1.25;">
      <li style="margin-bottom: 2px;">
        Hingga saat surat pernyataan ini saya tandatangani, saya <strong>BENAR-BENAR BELUM PERNAH MENIKAH / KAWIN (${jenisKelamin.toLowerCase().includes('perempuan') ? 'PERAWAN' : 'JEJAKA'})</strong> baik secara hukum agama, adat, maupun hukum negara dengan siapapun.
      </li>
      <li style="margin-bottom: 2px;">
        Saya tidak sedang terikat hubungan pernikahan atau status perkawinan yang sah dengan pihak manapun.
      </li>
      <li style="margin-bottom: 2px;">
        Surat pernyataan ini saya buat dengan kesadaran penuh tanpa ada paksaan dari pihak manapun untuk keperluan: <strong>${keperluan}</strong>.
      </li>
      <li>
        Apabila di kemudian hari ternyata pernyataan ini terbukti tidak benar atau ditemukan pemalsuan keterangan, maka saya bersedia dituntut di muka pengadilan dan diproses sesuai ketentuan hukum yang berlaku.
      </li>
    </ol>
  </div>

  <p style="margin: 3px 0 6px 0; text-align: justify; font-size: 8.5pt;">
    Demikian formulir lampiran <strong>SP-BM</strong> ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya pada <strong>Pemerintah Desa ${ctx?.namaDesa || 'Sampeldes'}</strong>.
  </p>

  <!-- PENANDATANGANAN SAKSI-SAKSI -->
  <div style="margin-top: 8px; margin-bottom: 12px;">
    <div style="font-weight: bold; font-size: 9pt; margin-bottom: 6px;">Saksi-Saksi :</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
      <tbody>
        <tr>
          <!-- SAKSI 1 -->
          <td style="width: 50%; vertical-align: top; padding-right: 14px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
              <tbody>
                <tr>
                  <td style="width: 16px; vertical-align: top;">1.</td>
                  <td style="width: 48px; vertical-align: top;">Nama</td>
                  <td style="width: 8px; vertical-align: top;">:</td>
                  <td style="vertical-align: top; font-weight: bold; text-transform: uppercase;">${namaSaksi1}</td>
                </tr>
                <tr>
                  <td>&nbsp;</td>
                  <td style="vertical-align: top;">NIK</td>
                  <td style="vertical-align: top;">:</td>
                  <td style="vertical-align: top; font-family: monospace; font-size: 8.5pt;">${nikSaksi1}</td>
                </tr>
              </tbody>
            </table>
            <div style="margin-top: 6px; margin-left: 16px; font-size: 8.5pt; color: #222;">
              <div>Tanda Tangan Saksi I :</div>
              <div style="height: 48px;"></div>
              <div>( <strong>${namaSaksi1}</strong> )</div>
            </div>
          </td>

          <!-- SAKSI 2 -->
          <td style="width: 50%; vertical-align: top; padding-left: 14px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
              <tbody>
                <tr>
                  <td style="width: 16px; vertical-align: top;">2.</td>
                  <td style="width: 48px; vertical-align: top;">Nama</td>
                  <td style="width: 8px; vertical-align: top;">:</td>
                  <td style="vertical-align: top; font-weight: bold; text-transform: uppercase;">${namaSaksi2}</td>
                </tr>
                <tr>
                  <td>&nbsp;</td>
                  <td style="vertical-align: top;">NIK</td>
                  <td style="vertical-align: top;">:</td>
                  <td style="vertical-align: top; font-family: monospace; font-size: 8.5pt;">${nikSaksi2}</td>
                </tr>
              </tbody>
            </table>
            <div style="margin-top: 6px; margin-left: 16px; font-size: 8.5pt; color: #222;">
              <div>Tanda Tangan Saksi II :</div>
              <div style="height: 48px;"></div>
              <div>( <strong>${namaSaksi2}</strong> )</div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- TANDA TANGAN KADES & PEMOHON DENGAN METERAI -->
  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 8px;">
    <tbody>
      <tr>
        <td style="width: 50%; text-align: center; vertical-align: top; padding: 0 10px;">
          <div>Mengetahui,</div>
          <div style="font-weight: bold;">Kepala Desa ${ctx?.namaDesa || 'Sampeldes'}</div>
          <div style="height: 72px;"></div>
          <div style="font-weight: bold; text-decoration: underline;">${namaKades}</div>
        </td>
        <td style="width: 50%; text-align: center; vertical-align: top; padding: 0 10px;">
          <div>${ctx?.namaDesa || 'Sampeldes'}, ${tanggalSurat}</div>
          <div style="font-weight: bold;">Pemohon / Yang Menyatakan,</div>
          <div style="margin: 8px auto 0 auto; width: 110px; height: 38px; line-height: 38px; border: 1px dashed #666; font-size: 7.5pt; color: #555; background-color: #fafafa; border-radius: 2px;">
            Meterai Rp 10.000
          </div>
          <div style="height: 24px;"></div>
          <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">${namaPemohon}</div>
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
}
