import { formatTanggalIndonesia, hitungUmurIndonesia, type OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildSpSktmPortraitHtml(ctx: OpenSidRenderContext): string {
  const ind = ctx?.individu || ({} as any);
  const fv = ctx?.formValues || {};

  const namaDesa = (ctx?.namaDesa || 'Sampeldes').toUpperCase();
  const namaKecamatan = (ctx?.namaKecamatan || 'Gandrungmangu').toUpperCase();
  const namaKabupaten = (ctx?.namaKabupaten || 'Cilacap').toUpperCase();
  const tanggalSurat = ctx?.tanggalSurat || formatTanggalIndonesia(new Date().toISOString());
  const namaKades = ctx?.namaPamong || 'TUKIMAN';

  const isChildMode =
    fv.submissionType === 'child' ||
    Boolean(fv.childName || fv.child_name || fv.form_nama_anak || fv['[form_nama_anak]']);

  // Data Pemohon / Orang Tua / Wali
  const namaPemohon = (fv.applicantName || fv.nama_pemohon || ind.nama || fv.name || 'ARI KUSMIYATUN').toUpperCase();
  const nikPemohon = fv.applicantNik || fv.nik_pemohon || ind.nik || fv.nik || '3301105001880001';
  const noKk = ind.no_kk || fv.noKk || fv.no_kk || fv.kkNumber || '-';
  const tempatLahir = fv.applicantBirthPlace || fv.tempat_lahir_pemohon || ind.tempat_lahir || fv.birthPlace || 'Cilacap';
  const rawTglLahir = fv.applicantBirthDate || fv.tanggal_lahir_pemohon || ind.tanggal_lahir || fv.birthDate || '1988-01-10';
  const tglLahir = formatTanggalIndonesia(rawTglLahir);
  const rawUmur = hitungUmurIndonesia(rawTglLahir);
  const umurText = rawUmur && rawUmur !== '-' ? (rawUmur.toLowerCase().includes('tahun') ? rawUmur : `${rawUmur} Tahun`) : '';
  const jenisKelamin = fv.applicantGender || fv.jenis_kelamin_pemohon || ind.jenis_kelamin || fv.gender || 'Perempuan';
  const agama = fv.applicantReligion || fv.agama_pemohon || ind.agama || fv.religion || 'Islam';
  const pekerjaan = fv.applicantJob || fv.pekerjaan_pemohon || ind.pekerjaan || fv.job || 'Karyawan Swasta';
  const alamatPemohon = fv.applicantAddress || fv.alamat_pemohon || ind.alamat || fv.address || `Desa ${ctx?.namaDesa || 'Sampeldes'}, Kec. ${ctx?.namaKecamatan || 'Gandrungmangu'}`;
  const keperluan = fv.purpose || fv.form_keperluan || fv.keperluan || 'Keringanan Biaya Sekolah';

  // Data Anak (jika pengajuan untuk anak)
  const namaAnak = (fv.childName || fv.form_nama_anak || fv.nama_anak || '-').toUpperCase();
  const nikAnak = fv.childNik || fv.form_nik_anak || fv.nik_anak || '-';
  const tempatLahirAnak = fv.childBirthPlace || fv.form_tempat_lahir_anak || fv.tempat_lahir_anak || 'Cilacap';
  const rawTglLahirAnak = fv.childBirthDate || fv.form_tanggal_lahir_anak || fv.tanggal_lahir_anak || '';
  const tglLahirAnak = rawTglLahirAnak ? formatTanggalIndonesia(rawTglLahirAnak) : '-';
  const jenisKelaminAnak = fv.childGender || fv.form_jenis_kelamin_anak || fv.jenis_kelamin_anak || 'Laki-Laki';
  const pekerjaanAnak = fv.childJob || fv.form_pekerjaan_anak || fv.pekerjaan_anak || 'Pelajar / Mahasiswa';
  const alamatAnak = fv.childAddress || fv.form_alamat_anak || fv.alamat_anak || alamatPemohon;

  // Data Saksi 1 & Saksi 2
  const saksi1 = ctx?.pelakuBagian?.saksi_1 || (ctx as any)?.saksi1 || {};
  const saksi2 = ctx?.pelakuBagian?.saksi_2 || (ctx as any)?.saksi2 || {};

  const namaSaksi1 = (
    saksi1.nama ||
    fv.witness1Name ||
    fv.form_nama_saksi_1 ||
    fv.form_nama_saksi_i ||
    'SLAMET RIYADI'
  ).toUpperCase();
  const nikSaksi1 =
    saksi1.nik ||
    fv.witness1Nik ||
    fv.form_nik_saksi_1 ||
    fv.form_nik_saksi_i ||
    '3301101506750001';

  const namaSaksi2 = (
    saksi2.nama ||
    fv.witness2Name ||
    fv.form_nama_saksi_2 ||
    fv.form_nama_saksi_ii ||
    'BAMBANG SUTRISNO'
  ).toUpperCase();
  const nikSaksi2 =
    saksi2.nik ||
    fv.witness2Nik ||
    fv.form_nik_saksi_2 ||
    fv.form_nik_saksi_ii ||
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
            SP-SKTM
          </span>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- JUDUL SURAT -->
  <div style="text-align: center; margin-bottom: 6px;">
    <div style="font-weight: bold; font-size: 11pt; text-decoration: underline; letter-spacing: 0.5px;">
      SURAT PERNYATAAN KELUARGA TIDAK MAMPU
    </div>
    <div style="font-size: 8pt; color: #444; margin-top: 1px;">
      Dasar Regulasi: Kemensos RI / Permensos 146/2013 | Instansi: Pemerintah Desa ${ctx?.namaDesa || 'Sampeldes'}
    </div>
  </div>

  <p style="margin: 0 0 4px 0; text-align: justify;">
    Yang bertanda tangan di bawah ini menerangkan dengan sebenarnya data identitas diri sebagai berikut:
  </p>

  <!-- DATA PEMOHON / ORANG TUA / WALI -->
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
        <td style="padding: 0.8px 0;">6. Pekerjaan</td>
        <td style="text-align: center;">:</td>
        <td>${pekerjaan}</td>
      </tr>
      <tr>
        <td style="padding: 0.8px 0; vertical-align: top;">7. Alamat Tempat Tinggal</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td>${alamatPemohon}</td>
      </tr>
    </tbody>
  </table>

  ${isChildMode
      ? `
  <p style="margin: 3px 0 3px 0; font-weight: bold; font-size: 8.5pt;">
    Adalah benar orang tua kandung / wali yang bertanggung jawab atas anak/anggota keluarga:
  </p>
  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-left: 6px; margin-bottom: 6px;">
    <tbody>
      <tr>
        <td style="width: 32%; padding: 0.6px 0;">a. Nama Anak / Siswa</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 66%; font-weight: bold;">${namaAnak}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0;">b. NIK Anak</td>
        <td style="text-align: center;">:</td>
        <td>${nikAnak}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0;">c. Tempat / Tanggal Lahir</td>
        <td style="text-align: center;">:</td>
        <td>${tempatLahirAnak}, ${tglLahirAnak}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0;">d. Jenis Kelamin / Pekerjaan</td>
        <td style="text-align: center;">:</td>
        <td>${jenisKelaminAnak} / ${pekerjaanAnak}</td>
      </tr>
      <tr>
        <td style="padding: 0.6px 0; vertical-align: top;">e. Alamat Anak</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td>${alamatAnak}</td>
      </tr>
    </tbody>
  </table>
  `
      : ''
    }

  <!-- BOX PERNYATAAN BERSUMPAH -->
  <div style="border: 1px solid #999; border-radius: 4px; padding: 5px 8px; margin-bottom: 6px; background-color: #fafafa;">
    <p style="margin: 0 0 2px 0; font-weight: bold; font-size: 8.5pt;">
      Dengan ini menyatakan dengan sesungguhnya di hadapan Pemerintah Desa ${ctx?.namaDesa || 'Sampeldes'} dan saksi-saksi bahwa:
    </p>
    <ol style="margin: 0 0 0 16px; padding: 0; font-size: 8pt; line-height: 1.2;">
      <li style="margin-bottom: 1.5px;">
        Keluarga kami benar-benar dalam keadaan ekonomi tidak mampu / tergolong keluarga berpenghasilan rendah dan memerlukan bantuan/keringanan biaya: <strong>${keperluan}</strong>.
      </li>
      <li style="margin-bottom: 1.5px;">
        Kondisi tempat tinggal, pendapatan riil, dan tanggungan yang kami laporkan adalah data yang sebenarnya tanpa rekayasa.
      </li>
      <li style="margin-bottom: 1.5px;">
        Pernyataan ini dibuat dengan itikad baik dan penuh rasa tanggung jawab.
      </li>
      <li>
        Apabila di kemudian hari terbukti pernyataan ini tidak benar, kami bersedia dituntut sesuai ketentuan peraturan perundang-undangan.
      </li>
    </ol>
  </div>

  <p style="margin: 2px 0 4px 0; text-align: justify; font-size: 8pt;">
    Demikian surat pernyataan ini saya buat dengan sadar dan sukarela di atas kertas bermeterai cukup untuk dipergunakan sebagaimana mestinya.
  </p>

  <!-- PENANDATANGANAN SAKSI-SAKSI -->
  <div style="margin-top: 4px; margin-bottom: 8px;">
    <div style="font-weight: bold; font-size: 8.5pt; margin-bottom: 4px;">Saksi-Saksi :</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
      <tbody>
        <tr>
          <!-- SAKSI 1 -->
          <td style="width: 50%; vertical-align: top; padding-right: 12px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
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
                  <td style="vertical-align: top; font-family: monospace; font-size: 8pt;">${nikSaksi1}</td>
                </tr>
              </tbody>
            </table>
            <div style="margin-top: 4px; margin-left: 16px; font-size: 8pt; color: #222;">
              <div>Tanda Tangan Saksi I :</div>
              <div style="height: 38px;"></div>
              <div>( <strong>${namaSaksi1}</strong> )</div>
            </div>
          </td>

          <!-- SAKSI 2 -->
          <td style="width: 50%; vertical-align: top; padding-left: 12px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
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
                  <td style="vertical-align: top; font-family: monospace; font-size: 8pt;">${nikSaksi2}</td>
                </tr>
              </tbody>
            </table>
            <div style="margin-top: 4px; margin-left: 16px; font-size: 8pt; color: #222;">
              <div>Tanda Tangan Saksi II :</div>
              <div style="height: 38px;"></div>
              <div>( <strong>${namaSaksi2}</strong> )</div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- TANDA TANGAN KADES & PEMOHON DENGAN METERAI -->
  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 4px;">
    <tbody>
      <tr>
        <td style="width: 50%; text-align: center; vertical-align: top; padding: 0 10px;">
          <div>Mengetahui,</div>
          <div style="font-weight: bold;">Kepala Desa ${ctx?.namaDesa || 'Sampeldes'}</div>
          <div style="height: 55px;"></div>
          <div style="font-weight: bold; text-decoration: underline;">${namaKades}</div>
        </td>
        <td style="width: 50%; text-align: center; vertical-align: top; padding: 0 10px;">
          <div>${ctx?.namaDesa || 'Sampeldes'}, ${tanggalSurat}</div>
          <div style="font-weight: bold;">Pemohon / Yang Menyatakan,</div>
          <div style="margin: 4px auto 0 auto; width: 95px; height: 32px; line-height: 32px; border: 1px dashed #666; font-size: 7pt; color: #555; background-color: #fafafa; border-radius: 2px;">
            Meterai Rp 10.000
          </div>
          <div style="height: 18px;"></div>
          <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">${namaPemohon}</div>
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
}

