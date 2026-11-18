import { formatTanggalIndonesia, normalizeDateInput, type OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildModelN4PortraitHtml(ctx?: OpenSidRenderContext): string {
  const ind = ctx?.individu || {};
  const fv = ctx?.formValues || {};
  const ayah = ctx?.pelakuBagian?.ayah || {};
  const pasangan = ctx?.pelakuBagian?.pasangan || ctx?.pelakuBagian?.calon_pasangan || {};

  const namaDesa = ctx?.namaDesa || 'Sampeldes';
  const tanggalSurat = ctx?.tanggalSurat || formatTanggalIndonesia(new Date());

  const jenisKelaminPemohon = ind.jenis_kelamin || 'Laki-laki';
  const isPemohonLaki = !jenisKelaminPemohon.toLowerCase().includes('perempuan');

  // Format helper
  const cleanVal = (val?: string | null) => (val && val !== '-' && val.trim() ? val.trim() : '');

  const formatTgl = (raw?: string | null) => {
    if (!raw || raw === '-') return '';
    const norm = normalizeDateInput(raw);
    return norm ? formatTanggalIndonesia(norm) : raw;
  };

  // Data Pemohon
  const pemohonData = {
    nama: cleanVal(ind.nama || fv.form_nama || fv.name)?.toUpperCase() || '',
    bin:
      cleanVal(
        ayah.nama ||
        fv.form_nama_ayah ||
        fv.fatherName ||
        ind.nama_ayah ||
        fv.form_bin_pemohon ||
        ayah.nama_ayah
      )?.toUpperCase() || '',
    nik: cleanVal(ind.nik || fv.form_nik || fv.nik) || '',
    tempatLahir: cleanVal(ind.tempat_lahir || fv.form_tempat_lahir || fv.birthPlace) || '',
    tglLahir: formatTgl(ind.tanggal_lahir || fv.form_tanggal_lahir || fv.birthDate),
    wn: cleanVal(ind.warga_negara || fv.form_warga_negara || fv.nationality) || 'WNI',
    agama: cleanVal(ind.agama || fv.form_agama || fv.religion) || 'Islam',
    pekerjaan: cleanVal(ind.pekerjaan || fv.form_pekerjaan || fv.job) || '',
    pendidikan: cleanVal(fv.form_pendidikan || fv.education || ind.pendidikan_kk) || '',
    alamat:
      cleanVal(ind.alamat || fv.form_alamat || fv.address) ||
      (ind.dusun || ind.rt
        ? `Dusun ${ind.dusun || 'Sampeldes'} RT ${ind.rt || '002'} / RW ${ind.rw || '001'} Desa ${namaDesa} Kec. ${ctx?.namaKecamatan || 'Gandrungmangu'} Kab. ${ctx?.namaKabupaten || 'Cilacap'}`
        : ''),
  };

  // Data Calon Pasangan
  const pasanganData = {
    nama:
      cleanVal(
        pasangan.nama ||
        fv.form_nama_calon_pasangan ||
        fv.form_nama_pasangan ||
        fv.spouseName
      )?.toUpperCase() || '',
    bin:
      cleanVal(
        fv.form_bin_calon_pasangan ||
        fv.form_bin_pasangan ||
        fv.spouseFatherName ||
        fv.form_nama_ayah_pasangan ||
        pasangan.nama_ayah ||
        (pasangan as any).namaAyah
      )?.toUpperCase() || '',
    nik:
      cleanVal(
        pasangan.nik ||
        fv.form_nik_calon_pasangan ||
        fv.form_nik_pasangan ||
        fv.spouseNik
      ) || '',
    tempatLahir: cleanVal(
      pasangan.tempat_lahir ||
      fv.form_tempat_lahir_pasangan ||
      fv.spouseBirthPlace
    ) || '',
    tglLahir: formatTgl(pasangan.tanggal_lahir || fv.form_tanggal_lahir_pasangan || fv.spouseBirthDate),
    wn: cleanVal(pasangan.warga_negara || fv.form_wn_pasangan || fv.spouseNationality) || 'WNI',
    agama: cleanVal(pasangan.agama || fv.form_agama_pasangan || fv.spouseReligion) || 'Islam',
    pekerjaan: cleanVal(pasangan.pekerjaan || fv.form_pekerjaan_pasangan || fv.spouseJob) || '',
    pendidikan: cleanVal(
      fv.form_pendidikan_pasangan ||
      fv.spouseEducation ||
      pasangan.pendidikan_kk
    ) || '',
    alamat: cleanVal(
      pasangan.alamat ||
      fv.form_alamat_pasangan ||
      fv.spouseAddress
    ) || '',
  };

  const calonSuami = isPemohonLaki ? pemohonData : pasanganData;
  const calonIstri = !isPemohonLaki ? pemohonData : pasanganData;

  // Fallback titik-titik jika belum terisi
  const dots = '...........................................................................';
  const dotsNama = '...................................................';

  const formatTtl = (tmp: string, tgl: string) => {
    if (tmp && tgl) return `${tmp}, ${tgl}`;
    if (tmp) return tmp;
    if (tgl) return tgl;
    return dots;
  };

  const suamiTtl = formatTtl(calonSuami.tempatLahir, calonSuami.tglLahir);
  const istriTtl = formatTtl(calonIstri.tempatLahir, calonIstri.tglLahir);

  // Pekerjaan & Pendidikan calon istri
  let pekerjaanPendidikanIstri = '';
  if (calonIstri.pekerjaan && calonIstri.pendidikan) {
    pekerjaanPendidikanIstri = `${calonIstri.pekerjaan} - ${calonIstri.pendidikan}`;
  } else if (calonIstri.pekerjaan) {
    pekerjaanPendidikanIstri = calonIstri.pekerjaan;
  } else if (calonIstri.pendidikan) {
    pekerjaanPendidikanIstri = calonIstri.pendidikan;
  } else {
    pekerjaanPendidikanIstri = dots;
  }

  return `<div style="font-family: 'Times New Roman', Times, serif; font-size: 10pt; line-height: 1.32; color: #000; box-sizing: border-box; width: 100%;">
  <!-- HEADER ATAS: KIRI REGULASI & KANAN MODEL : N-4 -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
    <tbody>
      <tr>
        <td style="width: 72%; vertical-align: top; font-size: 9pt; line-height: 1.25;">
          Lampiran VIII<br />
          Keputusan Direktur Jenderal Bimbingan Masyarakat Islam<br />
          Nomor 473 Tahun 2020
        </td>
        <td style="width: 28%; vertical-align: top; text-align: right; font-weight: bold; font-size: 10pt;">
          Model : N-4
        </td>
      </tr>
    </tbody>
  </table>

  <!-- JUDUL DOKUMEN -->
  <div style="text-align: center; margin-bottom: 14px;">
    <div style="font-weight: bold; font-size: 11pt; margin-bottom: 3px; letter-spacing: 0.5px;">
      FORMULIR PERSETUJUAN CALON PENGANTIN
    </div>
    <div style="font-weight: bold; font-size: 11pt; text-decoration: underline; letter-spacing: 0.5px;">
      PERSETUJUAN CALON PENGANTIN
    </div>
  </div>

  <p style="margin: 0 0 8px 0; font-size: 10pt;">Yang bertanda tangan di bawah ini:</p>

  <!-- BAGIAN A: CALON SUAMI -->
  <div style="font-size: 10pt; margin-bottom: 3px;">A. Calon Suami</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-left: 14px; margin-bottom: 8px;">
    <tbody>
      <tr>
        <td style="width: 32%; padding: 1.5px 0;">1. Nama lengkap dan alias</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 66%; font-weight: bold;">${calonSuami.nama || dots}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">2. Bin</td>
        <td style="text-align: center;">:</td>
        <td>${calonSuami.bin || dots}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">3. Nomor induk kependudukan</td>
        <td style="text-align: center;">:</td>
        <td>${calonSuami.nik || dots}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">4. Tempat dan tanggal lahir</td>
        <td style="text-align: center;">:</td>
        <td>${suamiTtl}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">5. Kewarganegaraan</td>
        <td style="text-align: center;">:</td>
        <td>${calonSuami.wn || dots}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">6. Agama</td>
        <td style="text-align: center;">:</td>
        <td>${calonSuami.agama || dots}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">7. Pekerjaan</td>
        <td style="text-align: center;">:</td>
        <td>${calonSuami.pekerjaan || dots}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0; vertical-align: top;">8. Alamat</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td>${calonSuami.alamat || dots}</td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN B: CALON ISTRI -->
  <div style="font-size: 10pt; margin-bottom: 3px;">B. Calon Istri</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-left: 14px; margin-bottom: 10px;">
    <tbody>
      <tr>
        <td style="width: 32%; padding: 1.5px 0;">1. Nama</td>
        <td style="width: 2%; text-align: center;">:</td>
        <td style="width: 66%; font-weight: bold;">${calonIstri.nama || dots}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">2. Binti</td>
        <td style="text-align: center;">:</td>
        <td>${calonIstri.bin || dots}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">3. Nomor Induk Kependudukan (NIK)</td>
        <td style="text-align: center;">:</td>
        <td>${calonIstri.nik || dots}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">4. Tempat dan tanggal lahir</td>
        <td style="text-align: center;">:</td>
        <td>${istriTtl}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">5. Kewarganegaraan</td>
        <td style="text-align: center;">:</td>
        <td>${calonIstri.wn || dots}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">6. Agama</td>
        <td style="text-align: center;">:</td>
        <td>${calonIstri.agama || dots}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">7. Pekerjaan &amp; Penddikan terakhir</td>
        <td style="text-align: center;">:</td>
        <td>${pekerjaanPendidikanIstri}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0; vertical-align: top;">8. Alamat</td>
        <td style="text-align: center; vertical-align: top;">:</td>
        <td>${calonIstri.alamat || dots}</td>
      </tr>
    </tbody>
  </table>

  <!-- PERNYATAAN -->
  <p style="margin: 8px 0 4px 0; text-align: justify; font-size: 10pt; line-height: 1.35;">
    Menyatakan dengan sesungguhnya bahwa atas dasar suka rela, dengan kesadaran sendiri, tanpa paksaan dari siapapun juga, setuju untuk melangsungkan pernikahan.
  </p>
  <p style="margin: 4px 0 14px 0; text-align: justify; font-size: 10pt; line-height: 1.35;">
    Demikian surat persetujuan ini dibuat untuk digunakan seperlunya.
  </p>

  <!-- TANDA TANGAN -->
  <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 14px;">
    <tbody>
      <tr>
        <td style="width: 50%;"></td>
        <td style="width: 50%; text-align: center; padding-bottom: 4px;">${namaDesa}, ${tanggalSurat}</td>
      </tr>
      <tr>
        <td style="width: 50%; text-align: center;">Calon Suami</td>
        <td style="width: 50%; text-align: center;">Calon Istri</td>
      </tr>
      <tr>
        <td style="height: 60px;"></td>
        <td style="height: 60px;"></td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: bold; text-decoration: underline;">
          ${calonSuami.nama || dotsNama}
        </td>
        <td style="text-align: center; font-weight: bold; text-decoration: underline;">
          ${calonIstri.nama || dotsNama}
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
}
