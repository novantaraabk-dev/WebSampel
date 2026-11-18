import type { LampiranSuratItem } from '../types';
import { buildF101LandscapeHtml } from './f-101';
import { buildF102PortraitHtml } from './f-102';
import { buildF103PortraitHtml } from './f-103';
import { buildF106PortraitHtml } from './f-106';
import { buildF108PortraitHtml } from './f-108';
import { buildF115PortraitHtml } from './f-115';
import { buildF116PortraitHtml } from './f-116';
import { buildF121PortraitHtml } from './f-121';
import { buildF125PortraitHtml } from './f-125';
import { buildF201PortraitHtml } from './f-201';
import { buildF203PortraitHtml } from './f-203';
import { buildF204PortraitHtml } from './f-204';
import { buildF212PortraitHtml } from './f-212';
import { buildF229PortraitHtml } from './f-229';
import { buildF230PortraitHtml } from './f-230';
import { buildModelN1PortraitHtml } from './model-n1';
import { buildModelN2PortraitHtml } from './model-n2';
import { buildModelN4PortraitHtml } from './model-n4';
import { buildModelN5PortraitHtml } from './model-n5';
import { buildModelN6PortraitHtml } from './model-n6';
import { buildSpsPortraitHtml } from './sps';
import { buildSwnPortraitHtml } from './swn';
import { buildSptjmBnPortraitHtml } from './sptjm-bn';

export function getDefaultLampiranHtmlTemplate(item: LampiranSuratItem): string {
  if (item.useCustomTemplate && item.templateHtml && item.templateHtml.trim().length > 0) {
    return item.templateHtml;
  }

  const kodeNorm = item.kode
    .toUpperCase()
    .replace(/MODEL\s+/g, '')
    .trim();

  // =========================================================================
  // 1. F-1.01: FORMULIR BIODATA KELUARGA (OpenSID storage/app/template/lampiran/f-1.01/view.php)
  // =========================================================================
  if (kodeNorm === 'F-1.01' || kodeNorm === 'F1.01') {
    return buildF101LandscapeHtml();
  }

  // =========================================================================
  // 2. F-1.02: FORMULIR PENDAFTARAN PERISTIWA KEPENDUDUKAN (OpenSID f-1.02/view.php)
  // =========================================================================
  if (kodeNorm === 'F-1.02' || kodeNorm === 'F1.02') {
    return buildF102PortraitHtml();
  }

  // =========================================================================
  // 3. F-1.03: FORMULIR PENDAFTARAN PERPINDAHAN PENDUDUK (OpenSID f-1.03/view.php)
  // =========================================================================
  if (kodeNorm === 'F-1.03' || kodeNorm === 'F1.03') {
    return buildF103PortraitHtml();
  }

  // =========================================================================
  // 4. F-1.06: SURAT PERNYATAAN PERUBAHAN ELEMEN DATA KEPENDUDUKAN (OpenSID f-1.06/view.php)
  // =========================================================================
  if (kodeNorm === 'F-1.06' || kodeNorm === 'F1.06') {
    return buildF106PortraitHtml();
  }

  // =========================================================================
  // 5. F-1.08: SURAT KETERANGAN PINDAH DATANG WNI
  // =========================================================================
  if (kodeNorm === 'F-1.08' || kodeNorm === 'F1.08') {
    return buildF108PortraitHtml();
  }

  // =========================================================================
  // 6. F-1.25: FORMULIR PERMOHONAN PINDAH WNI (Antar Desa/Kelurahan Dalam Satu Kecamatan)
  // =========================================================================
  if (kodeNorm === 'F-1.25' || kodeNorm === 'F.1-25') {
    return buildF125PortraitHtml();
  }

  // =========================================================================
  // 6b. F-1.27: FORMULIR PINDAH DATANG WNI (OpenSID f-1.27)
  // =========================================================================
  if (kodeNorm === 'F-1.27') {
    const isDatang = true;
    return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 9pt; line-height: 1.3; color: #000;">
  <div style="text-align: right; margin-bottom: 4px;">
    <span style="border: 1.5px solid #000; padding: 3px 12px; font-weight: bold; font-size: 11pt;">${item.kode}</span>
  </div>
  <table style="width: 55%; border-collapse: collapse; font-size: 8pt; margin-bottom: 6px;">
    <tbody>
      <tr><td style="width: 48%;">PEMERINTAH PROVINSI</td><td style="width: 3%;">:</td><td>33 - [NAma_provinsi]</td></tr>
      <tr><td>PEMERINTAH KABUPATEN/KOTA</td><td>:</td><td>01 - [NAma_kabupaten]</td></tr>
      <tr><td>KECAMATAN</td><td>:</td><td>10 - [NAma_kecamatan]</td></tr>
      <tr><td>DESA/KELURAHAN</td><td>:</td><td>2011 - [NAma_desa]</td></tr>
    </tbody>
  </table>
  <div style="text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 6px; text-decoration: underline;">
    ${item.nama.toUpperCase()}
  </div>

  <div style="font-weight: bold; font-size: 8.5pt; margin-bottom: 2px;">DATA DAERAH ASAL</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 6px;" border="1">
    <tbody>
      <tr><td style="padding: 3px 6px; width: 34%;">1. Nomor Kartu Keluarga</td><td style="padding: 3px 6px; font-family: monospace; font-weight: bold;">[No_kK]</td></tr>
      <tr><td style="padding: 3px 6px;">2. Nama Kepala Keluarga</td><td style="padding: 3px 6px; font-weight: bold;">[KEpala_kk]</td></tr>
      <tr><td style="padding: 3px 6px;">3. Alamat Daerah Asal</td><td style="padding: 3px 6px;">[Alamat] — Kode Pos: [Kode_poS]</td></tr>
      <tr><td style="padding: 3px 6px;">4. NIK Pemohon</td><td style="padding: 3px 6px; font-family: monospace; font-weight: bold;">[Nik]</td></tr>
      <tr><td style="padding: 3px 6px;">5. Nama Lengkap Pemohon</td><td style="padding: 3px 6px; font-weight: bold;">[NAma]</td></tr>
    </tbody>
  </table>

  <div style="font-weight: bold; font-size: 8.5pt; margin-bottom: 2px;">${isDatang ? 'DATA DAERAH TUJUAN KEDATANGAN' : 'DATA KEPINDAHAN'}</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 6px;" border="1">
    <tbody>
      <tr><td style="padding: 3px 6px; width: 34%;">1. Alasan Pindah</td><td style="padding: 3px 6px;">[form_alasan_pindah]</td></tr>
      <tr><td style="padding: 3px 6px;">2. Alamat Tujuan</td><td style="padding: 3px 6px;">[form_alamat_tujuan] RT [form_rt_tujuan] / RW [form_rw_tujuan], Desa [form_desa_tujuan], Kec. [form_kecamatan_tujuan], Kab. [form_kabupaten_tujuan]</td></tr>
      <tr><td style="padding: 3px 6px;">3. Jenis Kepindahan</td><td style="padding: 3px 6px;">[form_jenis_kepindahan]</td></tr>
      <tr><td style="padding: 3px 6px;">4. Status KK Bagi Yang Tidak Pindah</td><td style="padding: 3px 6px;">[form_status_kk_tidak_pindah]</td></tr>
      <tr><td style="padding: 3px 6px;">5. Status KK Bagi Yang Pindah</td><td style="padding: 3px 6px;">[form_status_kk_pindah]</td></tr>
      <tr><td style="padding: 3px 6px;">6. Tanggal Rencana Pindah / Datang</td><td style="padding: 3px 6px;">[form_tanggal_pindah]</td></tr>
    </tbody>
  </table>

  <div style="font-weight: bold; font-size: 8.5pt; margin-bottom: 2px;">DAFTAR KELUARGA YANG ${isDatang ? 'DATANG' : 'PINDAH'}</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 10px;" border="1">
    <thead>
      <tr style="background: #f1f5f9; text-align: center; font-weight: bold;">
        <th style="padding: 3px; width: 6%;">No</th>
        <th style="padding: 3px; width: 26%;">NIK</th>
        <th style="padding: 3px; width: 38%;">Nama Lengkap</th>
        <th style="padding: 3px; width: 15%;">Masa Berlaku KTP</th>
        <th style="padding: 3px; width: 15%;">SHDK</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 3px; text-align: center;">1</td>
        <td style="padding: 3px; text-align: center; font-family: monospace;">[Nik]</td>
        <td style="padding: 3px; font-weight: bold;">[NAma]</td>
        <td style="padding: 3px; text-align: center;">SEUMUR HIDUP</td>
        <td style="padding: 3px; text-align: center;">[Hubungan_kK]</td>
      </tr>
      <tr><td style="padding: 3px; text-align: center;">2</td><td>&nbsp;</td><td></td><td></td><td></td></tr>
    </tbody>
  </table>

  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; text-align: center; margin-top: 8px;">
    <tbody>
      <tr>
        <td style="width: 33%; vertical-align: top;">
          Mengetahui,<br/><strong>Camat [Nama_kecamataN]</strong>
          <div style="height: 48px;"></div>
          ( ...................................... )
        </td>
        <td style="width: 34%; vertical-align: top;">
          Mengetahui,<br/><strong>[Jabatan] [Nama_desA]</strong>
          <div style="height: 48px;"></div>
          <strong style="text-decoration: underline;">[NAma_pamong]</strong>
        </td>
        <td style="width: 33%; vertical-align: top;">
          [Nama_desA], [Tanggal_suraT]<br/><strong>Pemohon,</strong>
          <div style="height: 48px;"></div>
          <strong style="text-decoration: underline;">[NAma]</strong>
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
  }

  // =========================================================================
  // 6. F-1.15: FORMULIR PERMOHONAN KARTU KELUARGA (KK) BARU WNI
  // =========================================================================
  if (kodeNorm === 'F-1.15') {
    return buildF115PortraitHtml();
  }

  // =========================================================================
  // 6b. F-1.16: FORMULIR PERMOHONAN PERUBAHAN KK WNI
  // =========================================================================
  if (kodeNorm === 'F-1.16') {
    return buildF116PortraitHtml();
  }

  // =========================================================================
  // 7. F.1-21 / F-1.21: FORMULIR PERMOHONAN KTP WNI (OpenSID f.1-21/view.php)
  // =========================================================================
  if (kodeNorm === 'F.1-21' || kodeNorm === 'F-1.21') {
    return buildF121PortraitHtml();
  }

  // =========================================================================
  // =========================================================================
  // 8. F-2.01: FORMULIR PELAPORAN PENCATATAN SIPIL DI DALAM WILAYAH NKRI
  // =========================================================================
  if (kodeNorm.startsWith('F-2.01')) {
    return buildF201PortraitHtml(undefined, item.kode);
  }

  // =========================================================================
  // 8b. F-2.03: SPTJM KEBENARAN DATA KELAHIRAN
  // =========================================================================
  if (kodeNorm === 'F-2.03' || kodeNorm === 'F2.03') {
    return buildF203PortraitHtml();
  }

  // =========================================================================
  // 8c. F-2.04: SPTJM KEBENARAN SEBAGAI PASANGAN SUAMI ISTERI
  // =========================================================================
  if (kodeNorm === 'F-2.04' || kodeNorm === 'F2.04') {
    return buildF204PortraitHtml();
  }

  // =========================================================================
  // 8d. F-2.12: FORMULIR PENCATATAN PERKAWINAN (Kemendagri 4 Halaman)
  // =========================================================================
  if (kodeNorm === 'F-2.12' || kodeNorm === 'F2.12') {
    return buildF212PortraitHtml();
  }

  // =========================================================================
  // 9. F-2.29 & F-2.30: SURAT KETERANGAN KEMATIAN & PELAPORAN KEMATIAN (OpenSID f-2.29 & f-2.30)
  // =========================================================================
  if (kodeNorm === 'F-2.29' || kodeNorm === 'F2.29') {
    return buildF229PortraitHtml();
  }

  if (kodeNorm === 'F-2.30' || kodeNorm === 'F2.30') {
    return buildF230PortraitHtml();
  }

  // =========================================================================
  // 10. MODEL N-1: PENGANTAR NIKAH (OpenSID storage/app/template/lampiran/n-1/view_pria.php)
  // =========================================================================
  if (kodeNorm === 'N-1' || kodeNorm === 'N1') {
    return buildModelN1PortraitHtml();
  }

  // =========================================================================
  // 11. MODEL N-2: PERMOHONAN KEHENDAK NIKAH (OpenSID storage/app/template/lampiran/n-2/view_pria.php)
  // =========================================================================
  if (kodeNorm === 'N-2' || kodeNorm === 'N2') {
    return buildModelN2PortraitHtml();
  }

  // =========================================================================
  // 12. MODEL N-4: PERSETUJUAN CALON PENGANTIN (OpenSID storage/app/template/lampiran/n-4/view_pria.php)
  // =========================================================================
  if (kodeNorm === 'N-4' || kodeNorm === 'N4') {
    return buildModelN4PortraitHtml();
  }

  // =========================================================================
  // 13. MODEL N-5: SURAT IZIN ORANG TUA (OpenSID storage/app/template/lampiran/n-5/view_pria.php)
  // =========================================================================
  if (kodeNorm === 'N-5' || kodeNorm === 'N5') {
    return buildModelN5PortraitHtml();
  }

  // =========================================================================
  // 14. MODEL N-6: SURAT KETERANGAN KEMATIAN SUAMI/ISTRI (OpenSID n-6/view_pria.php)
  // =========================================================================
  if (kodeNorm === 'N-6' || kodeNorm === 'N6') {
    return buildModelN6PortraitHtml();
  }

  // =========================================================================
  // 14b. SPTJM-BN: SPTJM PERBEDAAN IDENTITAS & NAMA BERMETERAI
  // =========================================================================
  if (kodeNorm === 'SPTJM-BN' || kodeNorm === 'SPTJM_BN' || kodeNorm.includes('SPTJM-BN')) {
    return buildSptjmBnPortraitHtml();
  }

  // =========================================================================
  // 15. SPS: SURAT PERNYATAAN STATUS PERKAWINAN & DATA CATIN, WALI, SAKSI
  // =========================================================================
  if (kodeNorm === 'SPS') {
    return buildSpsPortraitHtml();
  }

  // =========================================================================
  // 16. SWN: SURAT KETERANGAN & PERNYATAAN WALI NIKAH
  // =========================================================================
  if (kodeNorm === 'SWN') {
    return buildSwnPortraitHtml();
  }

  // Fallback untuk lampiran desa / kustom lainnya
  const saksiBlock =
    (item.jumlahSaksi || 0) > 0
      ? `<div style="margin-top: 16px;">
  <p style="font-weight: bold; margin-bottom: 6px;">Saksi-Saksi:</p>
  <table style="width: 100%; border-collapse: collapse; font-size: 10.5pt;">
    <tbody>
      <tr>
        <td style="width: 50%; padding: 4px 8px; vertical-align: top;">
          1. <strong>[Form_Nama_Saksi_1]</strong> (NIK: [Form_Nik_Saksi_1])<br/>
          <span style="font-size: 9pt; color: #475569;">Tanda Tangan: ..............................</span>
        </td>
        ${
          (item.jumlahSaksi || 0) >= 2
            ? `<td style="width: 50%; padding: 4px 8px; vertical-align: top;">
          2. <strong>[Form_Nama_Saksi_2]</strong> (NIK: [Form_Nik_Saksi_2])<br/>
          <span style="font-size: 9pt; color: #475569;">Tanda Tangan: ..............................</span>
        </td>`
            : '<td></td>'
        }
      </tr>
    </tbody>
  </table>
</div>`
      : '';

  const meteraiBlock = item.perluMeterai
    ? `<div style="margin: 6px auto 0 auto; width: 110px; height: 38px; line-height: 38px; border: 1px dashed #000; font-size: 8pt; background-color: #fafafa; border-radius: 2px;">Meterai ${item.nominalMeterai || 'Rp 10.000'}</div><div style="height: 24px;"></div>`
    : '<div style="height: 68px;"></div>';

  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.4; color: #000;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
    <div style="font-size: 9.5pt;">
      <strong>PEMERINTAH KABUPATEN [NAma_kabupaten]</strong><br/>
      KECAMATAN [NAma_kecamatan]<br/>
      <strong>DESA [NAma_desa]</strong>
    </div>
    <div style="border: 1.5px solid #000; padding: 3px 12px; font-weight: bold; font-family: monospace; font-size: 11pt;">
      ${item.kode}
    </div>
  </div>

  <div style="text-align: center; margin: 12px 0 16px 0;">
    <h3 style="margin: 0; font-size: 12pt; font-weight: bold; text-transform: uppercase; text-decoration: underline;">
      ${item.nama}
    </h3>
    <p style="margin: 3px 0 0 0; font-size: 9.5pt;">
      Dasar Regulasi: ${item.dasarHukum} | Instansi: ${item.instansi}
    </p>
  </div>

  <p style="text-align: justify; margin-bottom: 10px;">
    Yang bertanda tangan di bawah ini menerangkan dengan sebenarnya data identitas subjek lampiran <strong>${item.nama} (${item.kode})</strong> sebagai berikut:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
    <tbody>
      <tr>
        <td style="width: 34%; padding: 2px 0;">1. Nama Lengkap</td>
        <td style="width: 2%;">:</td>
        <td style="font-weight: bold;">[NAma]</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">2. NIK / Nomor KTP</td>
        <td>:</td>
        <td>[Nik]</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">3. Nomor Kartu Keluarga (KK)</td>
        <td>:</td>
        <td>[No_kK] (Kepala Keluarga: [Kepala_kK])</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">4. Tempat / Tanggal Lahir</td>
        <td>:</td>
        <td>[Tempat_lahiR], [Tanggal_lahiR] ([Usia])</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">5. Jenis Kelamin / Agama</td>
        <td>:</td>
        <td>[Jenis_kelamiN] / [Agama]</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">6. Pekerjaan / Pendidikan</td>
        <td>:</td>
        <td>[Pekerjaan] / [Pendidikan]</td>
      </tr>
      <tr>
        <td style="padding: 2px 0;">7. Status Perkawinan</td>
        <td>:</td>
        <td>[Status_kawin]</td>
      </tr>
      <tr>
        <td style="padding: 2px 0; vertical-align: top;">8. Alamat Domisili</td>
        <td style="vertical-align: top;">:</td>
        <td>[Alamat]</td>
      </tr>
      <tr>
        <td style="padding: 2px 0; vertical-align: top;">9. Keterangan / Keperluan</td>
        <td style="vertical-align: top;">:</td>
        <td>[Form_Keperluan_Lampiran]</td>
      </tr>
    </tbody>
  </table>

  <p style="text-align: justify; margin-bottom: 12px;">
    ${item.deskripsi} Demikian formulir lampiran <strong>${item.kode}</strong> ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya pada <strong>${item.instansi}</strong>.
  </p>

  ${saksiBlock}

  <table style="width: 100%; margin-top: 24px; text-align: center; border-collapse: collapse;">
    <tbody>
      <tr>
        <td style="width: 50%; vertical-align: top; padding: 0 10px;">
          Mengetahui,<br/>
          <strong>[Jabatan] [Nama_desA]</strong>
          <div style="height: 68px;"></div>
          <strong style="text-decoration: underline;">[NAma_pamong]</strong>
        </td>
        <td style="width: 50%; vertical-align: top; padding: 0 10px;">
          [Nama_desA], [Tanggal_suraT]<br/>
          <strong>Pemohon / Yang Menyatakan,</strong>
          ${meteraiBlock}
          <strong style="text-decoration: underline;">[NAma]</strong>
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
}

/**
 * Menyelesaikan kode alias lampiran (format OpenSID, singkatan, nama dokumen, atau varian string lainnya)
 */
