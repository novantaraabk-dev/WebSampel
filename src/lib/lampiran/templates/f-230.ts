import type { OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildF230PortraitHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};

  const namaDesa = ctx?.namaDesa || 'Sampeldes';
  const namaKab = ctx?.namaKabupaten || 'Cilacap';
  const tanggalSurat = ctx?.tanggalSurat || '';

  const fillOrDots = (val?: any) => {
    const str = val !== undefined && val !== null ? String(val).trim() : '';
    if (str.length > 0) {
      return `<span style="font-weight: bold; text-transform: uppercase;">${str}</span>`;
    }
    return '..........................................................................................................';
  };

  // 1. DATA PELAPOR
  const namaPelapor = fValues['reporterName'] || fValues['form_nama_pelapor'] || fValues['nama_pelapor'] || 'AHMAD RIFAI';
  const nikPelapor = fValues['reporterNik'] || fValues['form_nik_pelapor'] || fValues['nik_pelapor'] || '3301102208800001';
  const umurPelaporRaw = fValues['reporterAge'] || fValues['form_umur_pelapor'] || fValues['umur_pelapor'] || '44';
  const umurPelapor = umurPelaporRaw ? (String(umurPelaporRaw).includes('Tahun') ? String(umurPelaporRaw) : `${umurPelaporRaw} Tahun`) : '';
  const pekerjaanPelapor = fValues['reporterJob'] || fValues['form_pekerjaan_pelapor'] || fValues['pekerjaan_pelapor'] || 'Wiraswasta';
  const alamatPelapor = fValues['reporterAddress'] || fValues['form_alamat_pelapor'] || fValues['alamat_pelapor'] || `RT 02 RW 03, Desa ${namaDesa}, Kec. ${ctx?.namaKecamatan || 'Gandrungmangu'}`;

  // HUBUNGAN DENGAN YANG MATI
  const hubungan = fValues['reporterRelationship'] || fValues['reporterRelation'] || fValues['form_hubungan_pelapor'] || fValues['hubungan_pelapor'] || fValues['form_hubungan'] || 'Anak Kandung';

  // 2. DATA YANG MENINGGAL (JENAZAH)
  const namaJenazah = fValues['name'] || fValues['fullName'] || fValues['form_nama_jenazah'] || fValues['nama_jenazah'] || vIndividu?.nama || 'SITI AMINAH';
  const nikJenazah = fValues['nik'] || fValues['nik_jenazah'] || fValues['form_nik_jenazah'] || vIndividu?.nik || '3301101503450002';
  const rawJk = String(fValues['gender'] || fValues['form_sex_jenazah'] || fValues['sex_jenazah'] || vIndividu?.jenis_kelamin || 'Perempuan').toUpperCase();
  const jkJenazah = rawJk.startsWith('L') || rawJk === '1' ? 'Laki-laki' : 'Perempuan';

  const tempatLahir = fValues['placeOfBirth'] || fValues['birthPlace'] || fValues['form_tempat_lahir_jenazah'] || vIndividu?.tempat_lahir || 'Cilacap';
  const tglLahirRaw = fValues['birthDate'] || fValues['dateOfBirth'] || fValues['form_tanggal_lahir_jenazah'] || vIndividu?.tanggal_lahir || '15-03-1955';
  let tglLahir = String(tglLahirRaw);
  if (tglLahir.includes('T')) {
    try {
      const d = new Date(tglLahir);
      if (!isNaN(d.getTime())) {
        tglLahir = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
      }
    } catch { }
  }
  const umurJenazahRaw = fValues['age'] || fValues['form_umur_jenazah'] || fValues['umur_jenazah'] || '69';
  const umurJenazah = umurJenazahRaw ? (String(umurJenazahRaw).includes('Tahun') ? String(umurJenazahRaw) : `${umurJenazahRaw} Tahun`) : '';
  const ttlJenazah = tempatLahir ? `${tempatLahir}, ${tglLahir}${umurJenazah ? ` (${umurJenazah})` : ''}` : `${tglLahir}${umurJenazah ? ` (${umurJenazah})` : ''}`;

  const agamaJenazah = fValues['religion'] || fValues['agama'] || fValues['form_agama_jenazah'] || vIndividu?.agama || 'Islam';
  const alamatJenazah = fValues['address'] || fValues['alamat_jenazah'] || (vIndividu?.alamat
    ? `${vIndividu.alamat}${vIndividu.rt ? ` RT ${vIndividu.rt}` : ''}${vIndividu.rw ? ` RW ${vIndividu.rw}` : ''}, Desa ${namaDesa}`
    : `RT 02 RW 03, Desa ${namaDesa}, Kec. ${ctx?.namaKecamatan || 'Gandrungmangu'}`);
  const kewarganegaraan = vIndividu?.warga_negara || 'WNI';

  // 3. KEJADIAN KEMATIAN
  const tglKematianRaw = fValues['deathDate'] || fValues['tanggal_kematian'] || fValues['form_tanggal_kematian'] || fValues['tanggal_meninggal'] || fValues['form_tanggal_meninggal'] || '';
  let hariKematian = fValues['hari_kematian'] || fValues['form_hari_kematian'] || fValues['form_hari_meninggal'] || '';
  let tglKematian = '';
  if (tglKematianRaw) {
    try {
      const d = new Date(tglKematianRaw);
      if (!isNaN(d.getTime())) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        if (!hariKematian) hariKematian = days[d.getDay()];
        tglKematian = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      } else {
        tglKematian = String(tglKematianRaw);
      }
    } catch {
      tglKematian = String(tglKematianRaw);
    }
  }
  if (!hariKematian) hariKematian = 'Minggu';
  if (!tglKematian) tglKematian = '12 Mei 2024';

  const rawJam = fValues['deathTime'] || fValues['form_jam_kematian'] || fValues['form_pukul_meninggal'] || fValues['jam_kematian'] || '08:30';
  const pukulKematian = rawJam ? (String(rawJam).includes('WIB') ? String(rawJam) : `${rawJam} WIB`) : '08:30 WIB';
  const tempatKematian = fValues['deathLocation'] || fValues['form_tempat_kematian'] || fValues['tempat_kematian'] || `Rumah Duka (Desa ${namaDesa} RT 02 RW 03)`;
  const penyebabKematian = fValues['deathCause'] || fValues['form_sebab_kematian'] || fValues['sebab_kematian'] || 'Sakit Biasa / Usia Lanjut';
  const buktiKematian = fValues['whoExplains'] || fValues['form_bukti_kematian'] || fValues['bukti_kematian'] || 'Surat Keterangan Kematian Puskesmas Gandrungmangu I';

  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 9.2pt; line-height: 1.35; color: #000; width: 100%; box-sizing: border-box; padding: 15px 25px;">
  <!-- KODE & KOP ATAS (DI LUAR BORDER) -->
  <div style="text-align: right; margin-bottom: 6px;">
    <span style="display: inline-block; border: 1.5px solid #000; padding: 3px 14px; font-weight: bold; font-size: 10.5pt; font-family: Arial, sans-serif; letter-spacing: 0.5px;">
      Kode . F-2.30
    </span>
  </div>

  <div style="font-size: 9.5pt; font-family: Arial, sans-serif; margin-bottom: 8px;">
    Pemerintah Kabupaten/Kota &nbsp;&nbsp;: &nbsp; <span style="font-weight: bold; text-transform: uppercase;">${namaKab}</span>
  </div>

  <!-- BINGKAI KOTAK UTAMA -->
  <div style="border: 2px solid #000; padding: 22px 28px 25px 28px; box-sizing: border-box;">
    <!-- JUDUL FORMULIR -->
    <div style="text-align: center; font-weight: bold; font-size: 11.5pt; font-family: Arial, sans-serif; letter-spacing: 0.5px; margin-bottom: 20px;">
      FORMULIR PELAPORAN KEMATIAN
    </div>

    <!-- I. DATA PELAPOR -->
    <div style="margin-left: 28px; margin-bottom: 4px; font-size: 9pt; font-family: Arial, sans-serif;">
      Yang bertanda tangan dibawah ini :
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 9pt; font-family: Arial, sans-serif; margin-bottom: 14px; line-height: 1.45;">
      <tr>
        <td style="width: 185px; padding: 1.5px 0;">Nama lengkap</td>
        <td style="width: 15px;">:</td>
        <td>${fillOrDots(namaPelapor)}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">NIK</td>
        <td>:</td>
        <td>${fillOrDots(nikPelapor)}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">Umur</td>
        <td>:</td>
        <td>${fillOrDots(umurPelapor)}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">Pekerjaan</td>
        <td>:</td>
        <td>${fillOrDots(pekerjaanPelapor)}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">Alamat</td>
        <td>:</td>
        <td>${fillOrDots(alamatPelapor)}</td>
      </tr>
    </table>

    <!-- HUBUNGAN DENGAN YANG MATI -->
    <table style="width: 100%; border-collapse: collapse; font-size: 9pt; font-family: Arial, sans-serif; margin-bottom: 16px; line-height: 1.45;">
      <tr>
        <td style="width: 185px; padding: 1.5px 0;">Hubungan dengan yang mati</td>
        <td style="width: 15px;">:</td>
        <td>${fillOrDots(hubungan)}</td>
      </tr>
    </table>

    <!-- II. DATA YANG MENINGGAL -->
    <div style="margin-left: 28px; margin-bottom: 4px; font-size: 9pt; font-family: Arial, sans-serif;">
      Melaporkan bahwa :
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 9pt; font-family: Arial, sans-serif; margin-bottom: 16px; line-height: 1.45;">
      <tr>
        <td style="width: 185px; padding: 1.5px 0;">Nama lengkap</td>
        <td style="width: 15px;">:</td>
        <td>${fillOrDots(namaJenazah)}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">NIK</td>
        <td>:</td>
        <td>${fillOrDots(nikJenazah)}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">Jenis kelamin</td>
        <td>:</td>
        <td>${fillOrDots(jkJenazah)}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">Tanggal lahir/umur</td>
        <td>:</td>
        <td>${fillOrDots(ttlJenazah)}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">Agama</td>
        <td>:</td>
        <td>${fillOrDots(agamaJenazah)}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">Alamat</td>
        <td>:</td>
        <td>${fillOrDots(alamatJenazah)}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">Kewarganegaraan</td>
        <td>:</td>
        <td>${fillOrDots(kewarganegaraan)}</td>
      </tr>
    </table>

    <!-- III. KEJADIAN KEMATIAN -->
    <div style="margin-left: 28px; margin-bottom: 4px; font-size: 9pt; font-family: Arial, sans-serif;">
      Telah meninggal dunia pada :
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 9pt; font-family: Arial, sans-serif; margin-bottom: 24px; line-height: 1.45;">
      <tr>
        <td style="width: 185px; padding: 1.5px 0;">Hari</td>
        <td style="width: 15px;">:</td>
        <td>${fillOrDots(hariKematian)}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">Tanggal kematian</td>
        <td>:</td>
        <td>${fillOrDots(tglKematian)}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">Pukul</td>
        <td>:</td>
        <td>${fillOrDots(pukulKematian)}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">Bertempat di</td>
        <td>:</td>
        <td>${fillOrDots(tempatKematian)}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">Penyebab kematian</td>
        <td>:</td>
        <td>${fillOrDots(penyebabKematian)}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">Bukti kematian</td>
        <td>:</td>
        <td>${fillOrDots(buktiKematian)}</td>
      </tr>
    </table>

    <!-- TANDA TANGAN PELAPOR (SISI KANAN) -->
    <div style="float: right; width: 280px; text-align: center; font-size: 9pt; font-family: Arial, sans-serif; margin-top: 15px;">
      <div>${namaDesa}, ${tanggalSurat || '.................................... 20...'}</div>
      <div style="margin-top: 4px;">Pelapor,</div>
      <div style="height: 65px;"></div>
      <div>( ${namaPelapor || '...................................................'} )</div>
    </div>
    <div style="clear: both;"></div>
  </div>
</div>`;
}

