import type { OpenSidRenderContext } from '../../opensid-surat-engine';
import { toTitleCaseIndonesian } from '../../opensid-surat-engine';

function extractRtRwFromText(addressText?: string | null): { rt: string; rw: string } {
  if (!addressText) return { rt: '', rw: '' };
  const mRt = addressText.match(/\brt\s*[:./\-]?\s*0*(\d+)/i);
  const mRw = addressText.match(/\brw\s*[:./\-]?\s*0*(\d+)/i);
  return {
    rt: mRt ? mRt[1] : '',
    rw: mRw ? mRw[1] : '',
  };
}

export function buildF125PortraitHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};

  const noKkAsal = vIndividu?.no_kk || fValues['form_no_kk'] || fValues['no_kk'] || fValues['kkNumber'] || '';
  const kepalaKkAsal = toTitleCaseIndonesian(vIndividu?.kepala_kk || vIndividu?.nama || fValues['form_kepala_kk'] || fValues['kkHead'] || fValues['kepala_kk'] || '');
  const namaPemohon = toTitleCaseIndonesian(
    vIndividu?.nama ||
    fValues['form_nama'] ||
    fValues['nama'] ||
    fValues['fullName'] ||
    fValues['name'] ||
    fValues['requesterName'] ||
    ctx?.requesterName ||
    ''
  );
  const nikPemohon = vIndividu?.nik || fValues['form_nik'] || fValues['nik'] || '';
  const alamatAsal = toTitleCaseIndonesian(vIndividu?.alamat || fValues['currentAddressStreet'] || fValues['alamat'] || '');
  const dsnAsal = toTitleCaseIndonesian(vIndividu?.dusun || fValues['currentAddressDusun'] || fValues['dusun'] || '');
  const rawRtAsal = vIndividu?.rt || fValues['currentAddressRt'] || fValues['rt'] || fValues['form_rt'] || '';
  const rawRwAsal = vIndividu?.rw || fValues['currentAddressRw'] || fValues['rw'] || fValues['form_rw'] || '';
  const fullAlamatAsal = `${vIndividu?.alamat || ''} ${fValues['currentAddressStreet'] || ''} ${fValues['alamat'] || ''} ${fValues['address'] || ''}`;
  const extractedAsal = extractRtRwFromText(fullAlamatAsal);
  let rtAsal = (rawRtAsal || '').toString().trim();
  let rwAsal = (rawRwAsal || '').toString().trim();
  if (!rtAsal || rtAsal === '0' || rtAsal === '00' || rtAsal === '000') {
    rtAsal = extractedAsal.rt || '1';
  }
  if (!rwAsal || rwAsal === '0' || rwAsal === '00' || rwAsal === '000') {
    rwAsal = extractedAsal.rw || '1';
  }
  const desaAsal = toTitleCaseIndonesian(ctx?.namaDesa || 'Sampeldes');
  const kecAsal = toTitleCaseIndonesian(ctx?.namaKecamatan || 'Gandrungmangu');
  const kabAsal = toTitleCaseIndonesian(ctx?.namaKabupaten || 'Cilacap');
  const provAsal = toTitleCaseIndonesian(ctx?.namaProvinsi || 'Jawa Tengah');
  const kodePosAsal = ctx?.kodePos || '53254';
  const telpAsal = (vIndividu as any)?.telepon || fValues['form_telepon'] || fValues['telepon'] || fValues['phone'] || '';

  const namaKades = toTitleCaseIndonesian(ctx?.namaPamong || ctx?.namaKepalaDesa || 'TUKIMAN');
  const nipKades = ctx?.nipPamong && ctx?.nipPamong !== '-' ? ctx.nipPamong : (ctx?.nipKepalaDesa && ctx?.nipKepalaDesa !== '-' ? ctx.nipKepalaDesa : '');
  const sebutanNip = nipKades ? `NIP. ${nipKades}` : 'NIAP. -';
  const jabatanPenandatangan = ctx?.jabatanPamong || `Kepala Desa ${ctx?.namaDesa || 'Sampeldes'}`;

  // Helpers
  const renderBoxedDigits = (val: string | number | undefined, totalCount = 16, boxWidth = '12px', boxHeight = '13.5px') => {
    let clean = (val ?? '').toString().replace(/[^0-9a-zA-Z]/g, '');
    if (!clean) {
      return `<table style="border-collapse: collapse; display: inline-table; vertical-align: middle; margin: 0;">
        <tr>
          ${Array(totalCount).fill(0).map(() => `<td style="border: 1px solid #000; width: ${boxWidth}; height: ${boxHeight}; text-align: center; font-family: monospace; font-size: 7pt; font-weight: bold; padding: 0; background: #fff;">&nbsp;</td>`).join('')}
        </tr>
      </table>`;
    }
    if (/^\d+$/.test(clean)) {
      const num = parseInt(clean, 10);
      if (!isNaN(num)) {
        clean = String(num).padStart(totalCount, '0');
      }
    }
    const chars = (clean.length > totalCount ? clean.slice(-totalCount) : clean.padStart(totalCount, '0')).split('');
    return `<table style="border-collapse: collapse; display: inline-table; vertical-align: middle; margin: 0;">
      <tr>
        ${chars.map(c => `<td style="border: 1px solid #000; width: ${boxWidth}; height: ${boxHeight}; text-align: center; font-family: monospace; font-size: 7pt; font-weight: bold; padding: 0; background: #fff;">${c === ' ' ? '&nbsp;' : c}</td>`).join('')}
      </tr>
    </table>`;
  };

  const renderOptionSquare = (codeVal: string | number) =>
    `<span style="display:inline-block;width:17px;height:13.5px;border:1px solid #000;text-align:center;line-height:13px;font-family:monospace;font-size:7.5pt;font-weight:bold;margin-right:6px;vertical-align:middle;background:#fff;">${codeVal ? codeVal : '&nbsp;'}</span>`;

  // Alasan Pindah (1 s/d 7)
  const alasanRaw = (fValues['form_alasan_pindah'] || fValues['alasan_pindah'] || fValues['alasanPindah'] || fValues['purpose'] || '').toLowerCase();
  let codeAlasan = '1';
  if (alasanRaw.includes('kerja') || alasanRaw.startsWith('1')) codeAlasan = '1';
  else if (alasanRaw.includes('didik') || alasanRaw.includes('sekolah') || alasanRaw.startsWith('2')) codeAlasan = '2';
  else if (alasanRaw.includes('aman') || alasanRaw.startsWith('3')) codeAlasan = '3';
  else if (alasanRaw.includes('sehat') || alasanRaw.startsWith('4')) codeAlasan = '4';
  else if (alasanRaw.includes('rumah') || alasanRaw.startsWith('5')) codeAlasan = '5';
  else if (alasanRaw.includes('keluarga') || alasanRaw.startsWith('6')) codeAlasan = '6';
  else if (alasanRaw.includes('lain') || alasanRaw.startsWith('7')) codeAlasan = '7';

  // Alamat Tujuan
  const alamatPindah = toTitleCaseIndonesian(fValues['form_alamat_tujuan'] || fValues['alamat_tujuan'] || fValues['form_alamat_pindah'] || fValues['destinationStreet'] || fValues['destinationAddress'] || '');
  const dsnPindah = toTitleCaseIndonesian(fValues['form_dusun_tujuan'] || fValues['dusun_tujuan'] || fValues['destinationDusun'] || '');
  const rawRtPindah = fValues['form_rt_tujuan'] || fValues['rt_tujuan'] || fValues['destinationAddressRt'] || fValues['destinationRt'] || fValues['rtTujuan'] || '';
  const rawRwPindah = fValues['form_rw_tujuan'] || fValues['rw_tujuan'] || fValues['destinationAddressRw'] || fValues['destinationRw'] || fValues['rwTujuan'] || '';
  const fullAlamatPindah = `${fValues['form_alamat_tujuan'] || ''} ${fValues['alamat_tujuan'] || ''} ${fValues['destinationStreet'] || ''} ${fValues['destinationAddress'] || ''}`;
  const extractedPindah = extractRtRwFromText(fullAlamatPindah);
  let rtPindah = (rawRtPindah || '').toString().trim();
  let rwPindah = (rawRwPindah || '').toString().trim();
  if (!rtPindah || rtPindah === '0' || rtPindah === '00' || rtPindah === '000') {
    rtPindah = extractedPindah.rt || '';
  }
  if (!rwPindah || rwPindah === '0' || rwPindah === '00' || rwPindah === '000') {
    rwPindah = extractedPindah.rw || '';
  }
  const desaPindah = toTitleCaseIndonesian(fValues['form_desa_tujuan'] || fValues['desa_tujuan'] || fValues['destinationAddress'] || '');
  const kecPindah = toTitleCaseIndonesian(fValues['form_kecamatan_tujuan'] || fValues['kecamatan_tujuan'] || fValues['destinationKecamatan'] || kecAsal);
  const kabPindah = toTitleCaseIndonesian(fValues['form_kabupaten_tujuan'] || fValues['kabupaten_tujuan'] || fValues['destinationKabupaten'] || kabAsal);
  const provPindah = toTitleCaseIndonesian(fValues['form_provinsi_tujuan'] || fValues['provinsi_tujuan'] || fValues['destinationProvinsi'] || provAsal);
  const kodePosPindah = fValues['form_kode_pos_tujuan'] || fValues['kode_pos_tujuan'] || fValues['destinationPostalCode'] || '';
  const telpPindah = fValues['form_telepon_tujuan'] || fValues['telepon_tujuan'] || telpAsal;

  // Jenis Kepindahan (1 s/d 4)
  const jenisRaw = (fValues['form_jenis_kepindahan'] || fValues['jenis_kepindahan'] || fValues['jenisKepindahan'] || '').toLowerCase();
  let codeJenis = '2';
  if (jenisRaw.includes('seluruh') || jenisRaw.startsWith('2')) codeJenis = '2';
  else if (jenisRaw.includes('sebagian') || jenisRaw.startsWith('3')) codeJenis = '3';
  else if (jenisRaw.includes('anggota') || jenisRaw.startsWith('4')) codeJenis = '4';
  else if (jenisRaw.includes('kepala') || jenisRaw.startsWith('1')) codeJenis = '1';

  // Status KK Tidak Pindah (1 s/d 3)
  const statusTdkRaw = (fValues['form_status_kk_tidak_pindah'] || fValues['status_kk_tidak_pindah'] || fValues['statusKkTidakPindah'] || '').toLowerCase();
  let codeStatusTdk = '3';
  if (statusTdkRaw.includes('numpang') || statusTdkRaw.startsWith('1')) codeStatusTdk = '1';
  else if (statusTdkRaw.includes('baru') || statusTdkRaw.startsWith('2')) codeStatusTdk = '2';
  else if (statusTdkRaw.includes('tetap') || statusTdkRaw.startsWith('3')) codeStatusTdk = '3';

  // Status KK Pindah (1 s/d 3)
  const statusPindahRaw = (fValues['form_status_kk_pindah'] || fValues['status_kk_pindah'] || fValues['statusKkPindah'] || '').toLowerCase();
  let codeStatusPindah = '2';
  if (statusPindahRaw.includes('numpang') || statusPindahRaw.startsWith('1')) codeStatusPindah = '1';
  else if (statusPindahRaw.includes('baru') || statusPindahRaw.startsWith('2')) codeStatusPindah = '2';
  else if (statusPindahRaw.includes('tetap') || statusPindahRaw.startsWith('3')) codeStatusPindah = '3';

  const rawMembers = ctx?.familyMembers && ctx.familyMembers.length > 0 ? ctx.familyMembers : [];
  const membersList = rawMembers.length > 0
    ? rawMembers.map((m: any) => ({
      nik: m.nik || '',
      nama: toTitleCaseIndonesian(m.nama || m.name || ''),
      shdk: toTitleCaseIndonesian(m.shdk || m.relationship || m.hubungan || 'Kepala Keluarga'),
      masa_berlaku: m.masa_berlaku || m.masaBerlaku || 'SEUMUR HIDUP',
    }))
    : (namaPemohon ? [{ nik: nikPemohon, nama: namaPemohon, shdk: 'Kepala Keluarga', masa_berlaku: 'SEUMUR HIDUP' }] : []);

  const tglTtd = ctx?.tanggalSurat || '............................................';
  const kotaTtd = ctx?.namaDesa || 'Sampeldes';

  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.5pt; line-height: 1.15; color: #000; width: 100%; box-sizing: border-box; border: 1px solid #000; padding: 6px;">
  <!-- HEADER & WILAYAH ATAS -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 2px;">
    <tr>
      <td style="width: 75%; vertical-align: top;">
        <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt;">
          <tr>
            <td style="width: 120px; padding: 0.5px 0;">PROVINSI</td>
            <td style="width: 10px; text-align: center;">:</td>
            <td style="width: 28px;">${renderBoxedDigits('33', 2)}</td>
            <td style="width: 15px; text-align: center;">*)</td>
            <td><div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold; width: 95%;">${provAsal || '&nbsp;'}</div></td>
          </tr>
          <tr>
            <td style="padding: 0.5px 0;">KABUPATEN/KOTA</td>
            <td style="text-align: center;">:</td>
            <td>${renderBoxedDigits('01', 2)}</td>
            <td style="text-align: center;">*)</td>
            <td><div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold; width: 95%;">${kabAsal || '&nbsp;'}</div></td>
          </tr>
          <tr>
            <td style="padding: 0.5px 0;">KECAMATAN</td>
            <td style="text-align: center;">:</td>
            <td>${renderBoxedDigits('10', 2)}</td>
            <td style="text-align: center;">*)</td>
            <td><div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold; width: 95%;">${kecAsal || '&nbsp;'}</div></td>
          </tr>
          <tr>
            <td style="padding: 0.5px 0;">DESA/KELURAHAN</td>
            <td style="text-align: center;">:</td>
            <td>${renderBoxedDigits('2011', 4)}</td>
            <td style="text-align: center;">*)</td>
            <td><div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold; width: 95%;">${desaAsal || '&nbsp;'}</div></td>
          </tr>
          <tr>
            <td style="padding: 0.5px 0;">DUSUN/DUKUH/KAMPUNG</td>
            <td style="text-align: center;">:</td>
            <td colspan="3"><div style="border: 1px solid #000; padding: 1px 4px; width: 98%;">${dsnAsal || '&nbsp;'}</div></td>
          </tr>
        </table>
      </td>
      <td style="width: 25%; vertical-align: top; text-align: right;">
        <span style="border: 1.5px solid #000; padding: 2px 14px; font-weight: bold; font-size: 11pt; font-family: Arial, sans-serif; display: inline-block;">F.1-25</span>
      </td>
    </tr>
  </table>

  <!-- JUDUL FORMULIR -->
  <div style="text-align: center; margin: 4px 0 6px 0;">
    <div style="font-weight: bold; font-size: 9.8pt; letter-spacing: 0.3px;">FORMULIR PERMOHONAN PINDAH WNI</div>
    <div style="font-weight: bold; font-size: 7.8pt;">Antar Desa/Kelurahan Dalam Satu Kecamatan</div>
    <div style="font-size: 7.2pt;">No. ....................................................</div>
  </div>

  <!-- BAGIAN I: DATA DAERAH ASAL -->
  <div style="font-weight: bold; font-size: 7pt; margin-bottom: 2px;">DATA DAERAH ASAL</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 3px;">
    <tbody>
      <tr>
        <td style="width: 135px; padding: 1px 0;">1. Nomor Kartu Keluarga</td>
        <td style="padding: 1px 0;">${renderBoxedDigits(noKkAsal, 16)}</td>
      </tr>
      <tr>
        <td style="padding: 1px 0;">2. Nama Kepala Keluarga</td>
        <td style="padding: 1px 0;"><div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold;">${kepalaKkAsal || '&nbsp;'}</div></td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">3. Alamat</td>
        <td style="padding: 1px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 1.5px;">
            <tr>
              <td><div style="border: 1px solid #000; padding: 1px 4px; min-height: 11px;">${alamatAsal || '&nbsp;'}</div></td>
              <td style="width: 25px; text-align: right; padding-right: 3px;">RT</td>
              <td style="width: 28px;">${renderBoxedDigits(rtAsal, 2)}</td>
              <td style="width: 30px; text-align: right; padding-right: 3px;">RW</td>
              <td style="width: 28px;">${renderBoxedDigits(rwAsal, 2)}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 1.5px;">
            <tr>
              <td style="width: 105px;">Dusun/Dukuh/Kampung</td>
              <td colspan="3"><div style="border: 1px solid #000; padding: 1px 4px;">${dsnAsal || '&nbsp;'}</div></td>
            </tr>
            <tr>
              <td style="width: 105px;">a. Desa/Kelurahan</td>
              <td style="border: 1px solid #000; padding: 1px 4px; width: 38%;">${desaAsal || '&nbsp;'}</td>
              <td style="width: 15px;"></td>
              <td style="width: 80px;">c. Kab/Kota</td>
              <td style="border: 1px solid #000; padding: 1px 4px;">${kabAsal || '&nbsp;'}</td>
            </tr>
            <tr>
              <td>b. Kecamatan</td>
              <td style="border: 1px solid #000; padding: 1px 4px;">${kecAsal || '&nbsp;'}</td>
              <td></td>
              <td>d. Provinsi</td>
              <td style="border: 1px solid #000; padding: 1px 4px;">${provAsal || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt;">
            <tr>
              <td style="width: 105px;">Kode Pos</td>
              <td style="width: 75px;">${renderBoxedDigits(kodePosAsal, 5)}</td>
              <td style="width: 25px;"></td>
              <td style="width: 80px;">Telepon</td>
              <td>${renderBoxedDigits(telpAsal, 10)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 0;">4. NIK Pemohon</td>
        <td style="padding: 1px 0;">${renderBoxedDigits(nikPemohon, 16)}</td>
      </tr>
      <tr>
        <td style="padding: 1px 0;">5. Nama Lengkap</td>
        <td style="padding: 1px 0;"><div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold;">${namaPemohon || '&nbsp;'}</div></td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN II: DATA KEPINDAHAN -->
  <div style="font-weight: bold; font-size: 7pt; margin-top: 2px; margin-bottom: 2px;">DATA KEPINDAHAN</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 3px;">
    <tbody>
      <tr>
        <td style="width: 135px; padding: 1px 0; vertical-align: top;">1. Alasan Pindah</td>
        <td style="padding: 1px 0;">
          <table style="border-collapse: collapse; font-size: 6.5pt;">
            <tr>
              <td style="vertical-align: top;">${renderOptionSquare(codeAlasan)}</td>
              <td style="padding-right: 15px;">
                1. Pekerjaan<br/>
                2. Pendidikan
              </td>
              <td style="padding-right: 15px;">
                3. Keamanan<br/>
                4. Kesehatan
              </td>
              <td style="padding-right: 15px;">
                5. Perumahan<br/>
                6. Keluarga
              </td>
              <td style="vertical-align: top;">
                7. Lainnya (sebutkan)<br/>
                .........................
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">2. Alamat Tujuan Pindah</td>
        <td style="padding: 1px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 1.5px;">
            <tr>
              <td><div style="border: 1px solid #000; padding: 1px 4px; min-height: 11px;">${alamatPindah || '&nbsp;'}</div></td>
              <td style="width: 25px; text-align: right; padding-right: 3px;">RT</td>
              <td style="width: 28px;">${renderBoxedDigits(rtPindah, 2)}</td>
              <td style="width: 30px; text-align: right; padding-right: 3px;">RW</td>
              <td style="width: 28px;">${renderBoxedDigits(rwPindah, 2)}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 1.5px;">
            <tr>
              <td style="width: 105px;">Dusun/Dukuh/Kampung</td>
              <td colspan="3"><div style="border: 1px solid #000; padding: 1px 4px;">${dsnPindah || '&nbsp;'}</div></td>
            </tr>
            <tr>
              <td style="width: 105px;">a. Desa/Kelurahan</td>
              <td style="border: 1px solid #000; padding: 1px 4px; width: 38%;">${desaPindah || '&nbsp;'}</td>
              <td style="width: 15px;"></td>
              <td style="width: 80px;">c. Kab/Kota</td>
              <td style="border: 1px solid #000; padding: 1px 4px;">${kabPindah || '&nbsp;'}</td>
            </tr>
            <tr>
              <td>b. Kecamatan</td>
              <td style="border: 1px solid #000; padding: 1px 4px;">${kecPindah || '&nbsp;'}</td>
              <td></td>
              <td>d. Provinsi</td>
              <td style="border: 1px solid #000; padding: 1px 4px;">${provPindah || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt;">
            <tr>
              <td style="width: 105px;">Kode Pos</td>
              <td style="width: 75px;">${renderBoxedDigits(kodePosPindah, 5)}</td>
              <td style="width: 25px;"></td>
              <td style="width: 80px;">Telepon</td>
              <td>${renderBoxedDigits(telpPindah, 10)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 0; vertical-align: top;">3. Jenis Kepindahan</td>
        <td style="padding: 1px 0;">
          <table style="border-collapse: collapse; font-size: 6.5pt;">
            <tr>
              <td style="vertical-align: top;">${renderOptionSquare(codeJenis)}</td>
              <td style="padding-right: 20px;">
                1. Kep. Keluarga<br/>
                2. Kep. Keluarga dan Seluruh Angg. Keluarga
              </td>
              <td>
                3. Kep. Keluarga dan Sbg. Angg. Keluarga<br/>
                4. Angg. Keluarga
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 0; vertical-align: top;">4. Status KK Bagi Yang Tidak Pindah</td>
        <td style="padding: 1px 0;">
          <table style="border-collapse: collapse; font-size: 6.5pt;">
            <tr>
              <td style="vertical-align: top;">${renderOptionSquare(codeStatusTdk)}</td>
              <td>1. Numpang KK &nbsp;&nbsp;&nbsp;&nbsp; 2. Membuat KK Baru &nbsp;&nbsp;&nbsp;&nbsp; 3. Nomor KK Tetap</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 0; vertical-align: top;">5. Status KK Bagi Yang Pindah</td>
        <td style="padding: 1px 0;">
          <table style="border-collapse: collapse; font-size: 6.5pt;">
            <tr>
              <td style="vertical-align: top;">${renderOptionSquare(codeStatusPindah)}</td>
              <td>1. Numpang KK &nbsp;&nbsp;&nbsp;&nbsp; 2. Membuat KK Baru &nbsp;&nbsp;&nbsp;&nbsp; 3. Nomor KK Tetap</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top: 2px;">
          <strong>6. Keluarga Yang Pindah</strong>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- TABEL KELUARGA YANG PINDAH -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 4px; border: 1px solid #000;" border="1">
    <thead>
      <tr style="text-align: center; font-weight: bold; background: #fff;">
        <th style="border: 1px solid #000; width: 5%; padding: 1.5px;">NO.</th>
        <th style="border: 1px solid #000; width: 44%; padding: 1.5px;">N I K</th>
        <th style="border: 1px solid #000; width: 33%; padding: 1.5px;">N A M A</th>
        <th style="border: 1px solid #000; width: 10%; padding: 1.5px;">MASA BERLAKU<br/>KTP S/D</th>
        <th style="border: 1px solid #000; width: 8%; padding: 1.5px;">SHDK</th>
      </tr>
    </thead>
    <tbody>
      ${[1, 2, 3, 4, 5]
      .map((idx) => {
        const m = membersList[idx - 1];
        const shdkName = m ? (m.shdk || 'KEPALA KELUARGA') : '';
        return `<tr style="height: 13.5px;">
            <td style="border: 1px solid #000; text-align: center; padding: 0;">${idx}</td>
            <td style="border: 1px solid #000; text-align: center; padding: 0;">${renderBoxedDigits(m ? m.nik : '', 16, '11px', '11.5px')}</td>
            <td style="border: 1px solid #000; padding: 0 4px; font-weight: ${m ? 'bold' : 'normal'}; text-align: left;">${m ? m.nama : '&nbsp;'}</td>
            <td style="border: 1px solid #000; text-align: center; font-size: 6pt;">${m ? 'SEUMUR HIDUP' : '&nbsp;'}</td>
            <td style="border: 1px solid #000; text-align: center; font-size: 6pt;">${shdkName || '&nbsp;'}</td>
          </tr>`;
      })
      .join('')}
    </tbody>
  </table>

  <!-- TANDA TANGAN -->
  <div style="text-align: right; margin-bottom: 2px; font-size: 6.5pt; padding-right: 30px;">
    ${kotaTtd}, ${tglTtd}
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; text-align: center; margin-bottom: 4px;">
    <tr>
      <td style="width: 50%; vertical-align: top;">
        Mengetahui,<br/>
        ${jabatanPenandatangan}
        <div style="height: 32px;"></div>
        (&nbsp;<strong><u>${namaKades}</u></strong>&nbsp;)<br/>
        ${sebutanNip}
      </td>
      <td style="width: 50%; vertical-align: top;">
        <br/>
        Pemohon
        <div style="height: 32px;"></div>
        (&nbsp;<strong><u>${namaPemohon || '...........................................................'}</u></strong>&nbsp;)
      </td>
    </tr>
  </table>

  <!-- FOOTER -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-top: 2px;">
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <strong>Keterangan :</strong><br/>
        *) Diisi Oleh Petugas.
      </td>
      <td style="width: 50%; text-align: right; vertical-align: bottom; font-weight: bold; font-size: 8pt;">
        70
      </td>
    </tr>
  </table>
</div>`;
}
