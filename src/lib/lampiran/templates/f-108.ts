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

export function buildF108PortraitHtml(ctx?: OpenSidRenderContext): string {
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

  const renderBoxedDigits = (val: string | number | undefined, totalCount = 16, boxWidth = '13px', boxHeight = '14px') => {
    let clean = (val ?? '').toString().replace(/[^0-9a-zA-Z]/g, '');
    if (!clean) {
      return `<table style="border-collapse: collapse; display: inline-table; vertical-align: middle; margin: 0;">
        <tr>
          ${Array(totalCount).fill(0).map(() => `<td style="border: 1px solid #000; width: ${boxWidth}; height: ${boxHeight}; text-align: center; font-family: monospace; font-size: 7.2pt; font-weight: bold; padding: 0; background: #fff;">&nbsp;</td>`).join('')}
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
        ${chars.map(c => `<td style="border: 1px solid #000; width: ${boxWidth}; height: ${boxHeight}; text-align: center; font-family: monospace; font-size: 7.2pt; font-weight: bold; padding: 0; background: #fff;">${c === ' ' ? '&nbsp;' : c}</td>`).join('')}
      </tr>
    </table>`;
  };

  const renderOptionSquare = (codeVal: string | number) =>
    `<span style="display:inline-block;width:18px;height:14px;border:1px solid #000;text-align:center;line-height:13px;font-family:monospace;font-size:7.5pt;font-weight:bold;margin-right:6px;vertical-align:middle;background:#fff;">${codeVal ? codeVal : '&nbsp;'}</span>`;

  // Alasan Pindah (1 s/d 7)
  const alasanRaw = (fValues['form_alasan_pindah'] || fValues['alasan_pindah'] || fValues['alasanPindah'] || fValues['purpose'] || '').toLowerCase();
  let codeAlasan = '';
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
  const kecPindah = toTitleCaseIndonesian(fValues['form_kecamatan_tujuan'] || fValues['kecamatan_tujuan'] || fValues['destinationKecamatan'] || '');
  const kabPindah = toTitleCaseIndonesian(fValues['form_kabupaten_tujuan'] || fValues['kabupaten_tujuan'] || fValues['destinationKabupaten'] || '');
  const provPindah = toTitleCaseIndonesian(fValues['form_provinsi_tujuan'] || fValues['provinsi_tujuan'] || fValues['destinationProvinsi'] || '');
  const kodePosPindah = fValues['form_kode_pos_tujuan'] || fValues['kode_pos_tujuan'] || fValues['destinationPostalCode'] || '';
  const telpPindah = fValues['form_telepon_tujuan'] || fValues['telepon_tujuan'] || telpAsal;

  // Klasifikasi Pindah (1 s/d 5)
  const klasifikasiRaw = (fValues['form_klasifikasi_pindah'] || fValues['klasifikasi_pindah'] || fValues['klasifikasiPindah'] || '').toLowerCase();
  let codeKlasifikasi = '4';
  if (klasifikasiRaw.includes('satu desa') || klasifikasiRaw.startsWith('1')) codeKlasifikasi = '1';
  else if (klasifikasiRaw.includes('antar desa') || klasifikasiRaw.startsWith('2')) codeKlasifikasi = '2';
  else if (klasifikasiRaw.includes('antar kec') || klasifikasiRaw.startsWith('3')) codeKlasifikasi = '3';
  else if (klasifikasiRaw.includes('antar kab') || klasifikasiRaw.startsWith('4')) codeKlasifikasi = '4';
  else if (klasifikasiRaw.includes('antar prov') || klasifikasiRaw.startsWith('5')) codeKlasifikasi = '5';

  // Jenis Kepindahan (1 s/d 4)
  const jenisKepindahanRaw = (fValues['form_jenis_kepindahan'] || fValues['jenis_kepindahan'] || fValues['jenisKepindahan'] || '').toLowerCase();
  let codeJenisKepindahan = '1';
  if (jenisKepindahanRaw === 'kepala keluarga' || jenisKepindahanRaw.startsWith('1')) codeJenisKepindahan = '1';
  else if (jenisKepindahanRaw.includes('seluruh') || jenisKepindahanRaw.startsWith('2')) codeJenisKepindahan = '2';
  else if (jenisKepindahanRaw.includes('sebagian') || jenisKepindahanRaw.startsWith('3')) codeJenisKepindahan = '3';
  else if (jenisKepindahanRaw.includes('anggota') || jenisKepindahanRaw.startsWith('4')) codeJenisKepindahan = '4';

  // Status KK Tdk Pindah (1 s/d 4)
  const tdkPindahRaw = (fValues['form_status_kk_tidak_pindah'] || fValues['status_kk_tidak_pindah'] || fValues['statusKkTidakPindah'] || '').toLowerCase();
  let codeStatusTdkPindah = '4';
  if (tdkPindahRaw.includes('numpang') || tdkPindahRaw.startsWith('1')) codeStatusTdkPindah = '1';
  else if (tdkPindahRaw.includes('baru') || tdkPindahRaw.startsWith('2')) codeStatusTdkPindah = '2';
  else if (tdkPindahRaw.includes('tidak ada') || tdkPindahRaw.startsWith('3')) codeStatusTdkPindah = '3';
  else if (tdkPindahRaw.includes('tetap') || tdkPindahRaw.startsWith('4')) codeStatusTdkPindah = '4';

  // Status KK Pindah (1 s/d 3)
  const pPindahRaw = (fValues['form_status_kk_pindah'] || fValues['status_kk_pindah'] || fValues['statusKkPindah'] || '').toLowerCase();
  let codeStatusPindah = '2';
  if (pPindahRaw.includes('numpang') || pPindahRaw.startsWith('1')) codeStatusPindah = '1';
  else if (pPindahRaw.includes('baru') || pPindahRaw.startsWith('2')) codeStatusPindah = '2';
  else if (pPindahRaw.includes('tetap') || pPindahRaw.startsWith('3')) codeStatusPindah = '3';

  // Rencana Tanggal Pindah
  const tglPindahRaw = fValues['form_tanggal_pindah'] || fValues['tanggal_pindah'] || fValues['moveDate'] || '';
  const dPindah = tglPindahRaw ? tglPindahRaw.slice(8, 10) : '';
  const mPindah = tglPindahRaw ? tglPindahRaw.slice(5, 7) : '';
  const yPindah = tglPindahRaw ? tglPindahRaw.slice(0, 4) : '';

  // Data Anggota Keluarga Pindah
  const rawMembers = ctx?.familyMembers && ctx.familyMembers.length > 0 ? ctx.familyMembers : [];
  const membersList = rawMembers.length > 0
    ? rawMembers.map((m: any) => ({
      nik: m.nik || '',
      nama: toTitleCaseIndonesian(m.nama || m.name || ''),
      shdk: toTitleCaseIndonesian(m.shdk || m.relationship || m.hubungan || 'Kepala Keluarga'),
    }))
    : (namaPemohon ? [{ nik: nikPemohon, nama: namaPemohon, shdk: 'Kepala Keluarga' }] : []);

  // Data Daerah Tujuan
  const noKkTujuan = fValues['form_no_kk_tujuan'] || fValues['no_kk_tujuan'] || noKkAsal;
  const kepalaKkTujuan = toTitleCaseIndonesian(fValues['form_kepala_kk_tujuan'] || fValues['kepala_kk_tujuan'] || kepalaKkAsal);
  const nikKkTujuan = fValues['form_nik_kepala_kk_tujuan'] || fValues['nik_kepala_kk_tujuan'] || nikPemohon;

  const tglKedatanganRaw = fValues['form_tanggal_kedatangan'] || fValues['tanggal_kedatangan'] || tglPindahRaw || '';
  const dDatang = tglKedatanganRaw ? tglKedatanganRaw.slice(8, 10) : '';
  const mDatang = tglKedatanganRaw ? tglKedatanganRaw.slice(5, 7) : '';
  const yDatang = tglKedatanganRaw ? tglKedatanganRaw.slice(0, 4) : '';

  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.8pt; line-height: 1.15; color: #000; width: 100%; box-sizing: border-box;">
  <!-- HEADER -->
  <div style="position: relative; margin-bottom: 2px;">
    <div style="float: right; border: 1.5px solid #000; padding: 2px 12px; font-weight: bold; font-size: 10.5pt; font-family: Arial, sans-serif; background: #fff;">F- 1.08</div>
    <div style="text-align: center; font-weight: bold; font-size: 10.5pt; padding-top: 2px; letter-spacing: 0.3px;">
      SURAT KETERANGAN PINDAH DATANG WNI
    </div>
    <div style="clear: both;"></div>
  </div>

  <!-- BAGIAN I: DATA DAERAH ASAL -->
  <div style="font-weight: bold; font-size: 7.2pt; margin-top: 2px; margin-bottom: 2px;">DATA DAERAH ASAL</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 2px;">
    <tbody>
      <tr>
        <td style="width: 135px; padding: 1px 0;">1. Nomor Kartu Keluarga</td>
        <td style="padding: 1px 0;">${renderBoxedDigits(noKkAsal, 16)}</td>
      </tr>
      <tr>
        <td style="padding: 1px 0;">2. Nama Kepala Keluarga</td>
        <td style="padding: 1px 0;">
          <div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold; background: #fff; min-height: 12px;">${kepalaKkAsal || '&nbsp;'}</div>
        </td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">3. Alamat</td>
        <td style="padding: 1px 0;">
          <div style="border: 1px solid #000; padding: 1px 4px; margin-bottom: 1.5px; background: #fff; min-height: 12px;">${alamatAsal || '&nbsp;'}</div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 1.5px;">
            <tr>
              <td style="width: 80px;">a. Desa/Kelurahan</td>
              <td style="border: 1px solid #000; padding: 1px 4px; background: #fff;">${desaAsal || '&nbsp;'}</td>
              <td style="width: 15px;"></td>
              <td style="width: 20px; text-align: right; padding-right: 3px;">RT</td>
              <td style="width: 32px;">${renderBoxedDigits(rtAsal, 2)}</td>
              <td style="width: 10px;"></td>
              <td style="width: 20px; text-align: right; padding-right: 3px;">RW</td>
              <td style="width: 32px;">${renderBoxedDigits(rwAsal, 2)}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 1.5px;">
            <tr>
              <td style="width: 80px;">b. Kecamatan</td>
              <td style="border: 1px solid #000; padding: 1px 4px; width: 42%; background: #fff;">${kecAsal || '&nbsp;'}</td>
              <td style="width: 15px;"></td>
              <td style="width: 60px;">c. Kab/Kota</td>
              <td style="border: 1px solid #000; padding: 1px 4px; background: #fff;">${kabAsal || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 1.5px;">
            <tr>
              <td style="width: 80px;">Kode Pos</td>
              <td style="width: 85px;">${renderBoxedDigits(kodePosAsal, 5)}</td>
              <td style="width: 15px;"></td>
              <td style="width: 60px;">d. Provinsi</td>
              <td style="border: 1px solid #000; padding: 1px 4px; background: #fff;">${provAsal || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt;">
            <tr>
              <td style="width: 80px;"></td>
              <td style="width: 85px;"></td>
              <td style="width: 15px;"></td>
              <td style="width: 60px;">Telepon</td>
              <td>${renderBoxedDigits(telpAsal, 12)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN II: DATA KEPINDAHAN -->
  <div style="font-weight: bold; font-size: 7.2pt; margin-top: 3px; margin-bottom: 2px;">DATA KEPINDAHAN</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 2px;">
    <tbody>
      <tr>
        <td style="width: 135px; vertical-align: top; padding: 1px 0;">1. Alasan Pindah</td>
        <td style="padding: 1px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 6.7pt;">
            <tr>
              <td style="width: 25px; vertical-align: top;">${renderOptionSquare(codeAlasan)}</td>
              <td style="width: 23%;">1. Pekerjaan<br/>2. Pendidikan</td>
              <td style="width: 23%;">3. Keamanan<br/>4. Kesehatan</td>
              <td style="width: 23%;">5. Perumahan<br/>6. Keluarga</td>
              <td style="width: 26%;">7. Lainnya (sebutkan)<br/>...................................</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">2. Alamat Tujuan Pindah</td>
        <td style="padding: 1px 0;">
          <div style="border: 1px solid #000; padding: 1px 4px; margin-bottom: 1.5px; background: #fff; min-height: 12px;">${alamatPindah || '&nbsp;'}</div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 1.5px;">
            <tr>
              <td style="width: 80px;">a. Desa/Kelurahan</td>
              <td style="border: 1px solid #000; padding: 1px 4px; background: #fff;">${desaPindah || '&nbsp;'}</td>
              <td style="width: 15px;"></td>
              <td style="width: 20px; text-align: right; padding-right: 3px;">RT</td>
              <td style="width: 32px;">${renderBoxedDigits(rtPindah, 2)}</td>
              <td style="width: 10px;"></td>
              <td style="width: 20px; text-align: right; padding-right: 3px;">RW</td>
              <td style="width: 32px;">${renderBoxedDigits(rwPindah, 2)}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 1.5px;">
            <tr>
              <td style="width: 80px;">b. Kecamatan</td>
              <td style="border: 1px solid #000; padding: 1px 4px; width: 42%; background: #fff;">${kecPindah || '&nbsp;'}</td>
              <td style="width: 15px;"></td>
              <td style="width: 60px;">c. Kab/Kota</td>
              <td style="border: 1px solid #000; padding: 1px 4px; background: #fff;">${kabPindah || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 1.5px;">
            <tr>
              <td style="width: 80px;">Kode Pos</td>
              <td style="width: 85px;">${renderBoxedDigits(kodePosPindah, 5)}</td>
              <td style="width: 15px;"></td>
              <td style="width: 60px;">d. Provinsi</td>
              <td style="border: 1px solid #000; padding: 1px 4px; background: #fff;">${provPindah || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt;">
            <tr>
              <td style="width: 80px;"></td>
              <td style="width: 85px;"></td>
              <td style="width: 15px;"></td>
              <td style="width: 60px;">Telepon</td>
              <td>${renderBoxedDigits(telpPindah, 12)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">3. Klasifikasi Pindah</td>
        <td style="padding: 1px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 6.7pt;">
            <tr>
              <td style="width: 25px; vertical-align: top;">${renderOptionSquare(codeKlasifikasi)}</td>
              <td style="width: 44%;">1. Dalam satu Desa/Kelurahan<br/>2. Antar Desa/Kelurahan</td>
              <td style="width: 28%;">3. Antar Kecamatan<br/>4. Antar Kab/Kota</td>
              <td>5. Antar Provinsi</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">4. Jenis Kepindahan</td>
        <td style="padding: 1px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 6.7pt;">
            <tr>
              <td style="width: 25px; vertical-align: top;">${renderOptionSquare(codeJenisKepindahan)}</td>
              <td style="width: 50%;">1. Kep. Keluarga<br/>2. Kep. Keluarga dan Seluruh Angg. Keluarga</td>
              <td>3. Kep. Keluarga dan Sbg. Angg. Keluarga<br/>4. Angg. Keluarga</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">5. Status Nomor KK<br/><span style="font-size: 6.2pt;">Bagi Yang Tidak Pindah</span></td>
        <td style="padding: 1px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 6.7pt;">
            <tr>
              <td style="width: 25px; vertical-align: top;">${renderOptionSquare(codeStatusTdkPindah)}</td>
              <td style="width: 50%;">1. Numpang KK<br/>2. Membuat KK Baru</td>
              <td>3. Tidak Ada Angg. Keluarga Yang Ditinggal<br/>4. Nomor KK Tetap</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">6. Status Nomor KK<br/><span style="font-size: 6.2pt;">Bagi Yang Pindah</span></td>
        <td style="padding: 1px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 6.7pt;">
            <tr>
              <td style="width: 25px; vertical-align: top;">${renderOptionSquare(codeStatusPindah)}</td>
              <td>1. Numpang KK &nbsp;&nbsp;&nbsp;&nbsp; 2. Membuat KK Baru &nbsp;&nbsp;&nbsp;&nbsp; 3. Nama Kep. Keluarga dan Nomor KK Tetap</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 0;">7. Rencana Tgl Pindah</td>
        <td style="padding: 1px 0;">
          ${renderBoxedDigits(dPindah, 2)} &nbsp;&nbsp; ${renderBoxedDigits(mPindah, 2)} &nbsp;&nbsp; ${renderBoxedDigits(yPindah, 4)}
        </td>
      </tr>
    </tbody>
  </table>

  <!-- TABEL 8: KELUARGA YANG PINDAH -->
  <div style="font-size: 6.8pt; margin-top: 1px; margin-bottom: 1.5px;">8. Keluarga Yang Pindah</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 6.7pt; margin-bottom: 2px; border: 1px solid #000;" border="1">
    <thead>
      <tr style="text-align: center; font-weight: bold; background: #fff;">
        <th style="border: 1px solid #000; width: 6%; padding: 1px;">NO</th>
        <th style="border: 1px solid #000; width: 44%; padding: 1px;">N I K</th>
        <th style="border: 1px solid #000; width: 38%; padding: 1px;">N A M A</th>
        <th style="border: 1px solid #000; width: 12%; padding: 1px;">SHDK</th>
      </tr>
    </thead>
    <tbody>
      ${[1, 2, 3, 4, 5]
      .map((idx) => {
        const m = membersList[idx - 1];
        return `<tr style="height: 14px;">
            <td style="border: 1px solid #000; text-align: center; padding: 0;">${idx}</td>
            <td style="border: 1px solid #000; text-align: center; padding: 0;">${renderBoxedDigits(m ? m.nik : '', 16, '11px', '12px')}</td>
            <td style="border: 1px solid #000; padding: 0 4px; font-weight: ${m ? 'bold' : 'normal'}; text-align: left;">${m ? m.nama : '&nbsp;'}</td>
            <td style="border: 1px solid #000; text-align: center; padding: 0;">${m ? ((m as any).shdk || (m as any).hubungan || '') : '&nbsp;'}</td>
          </tr>`;
      })
      .join('')}
    </tbody>
  </table>

  <!-- TANDA TANGAN DAERAH ASAL (3 KOLOM) -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; text-align: center; margin-bottom: 3px;">
    <tr>
      <td style="width: 33%; vertical-align: top; text-align: left; padding-left: 10px;">
        Diketahui oleh :<br/>
        Camat<br/>
        No. ......................, tgl. ........., 20.....
        <div style="height: 24px;"></div>
        (............................................................)<br/>
        NIP.
      </td>
      <td style="width: 34%; vertical-align: top; text-align: center;">
        <br/>
        Pemohon
        <div style="height: 28px;"></div>
        (&nbsp;<strong><u>${namaPemohon || '............................................................'}</u></strong>&nbsp;)
      </td>
      <td style="width: 33%; vertical-align: top; text-align: left; padding-left: 10px;">
        Dikeluarkan oleh :<br/>
        ${jabatanPenandatangan}<br/>
        No. ${ctx?.nomorSurat || '......................'}, tgl. ${ctx?.tanggalSurat || '........., 20.....'}
        <div style="height: 28px;"></div>
        (&nbsp;<strong><u>${namaKades}</u></strong>&nbsp;)<br/>
        ${sebutanNip}
      </td>
    </tr>
  </table>

  <!-- BAGIAN III: DATA DAERAH TUJUAN -->
  <div style="font-weight: bold; font-size: 7.2pt; margin-top: 2px; margin-bottom: 2px; border-top: 1px solid #000; padding-top: 2px;">
    DATA DAERAH TUJUAN
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 2px;">
    <tbody>
      <tr>
        <td style="width: 135px; padding: 1px 0;">1. Nomor Kartu Keluarga</td>
        <td style="padding: 1px 0;">${renderBoxedDigits(noKkTujuan, 16)}</td>
      </tr>
      <tr>
        <td style="padding: 1px 0;">2. Nama Kepala Keluarga</td>
        <td style="padding: 1px 0;">
          <div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold; background: #fff; min-height: 12px;">${kepalaKkTujuan || '&nbsp;'}</div>
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 0;">3. NIK Kepala Keluarga</td>
        <td style="padding: 1px 0;">${renderBoxedDigits(nikKkTujuan, 16)}</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">4. Status Nomor KK<br/><span style="font-size: 6.2pt;">Bagi Yang Pindah</span></td>
        <td style="padding: 1px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 6.7pt;">
            <tr>
              <td style="width: 25px; vertical-align: top;">${renderOptionSquare(codeStatusPindah)}</td>
              <td>1. Numpang KK &nbsp;&nbsp;&nbsp;&nbsp; 2. Membuat KK Baru &nbsp;&nbsp;&nbsp;&nbsp; 3. Nama Kep. Keluarga dan Nomor KK Tetap</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 0;">5. Tanggal Kedatangan</td>
        <td style="padding: 1px 0;">
          ${renderBoxedDigits(dDatang, 2)} &nbsp;&nbsp; ${renderBoxedDigits(mDatang, 2)} &nbsp;&nbsp; ${renderBoxedDigits(yDatang, 4)}
        </td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">6. Alamat</td>
        <td style="padding: 1px 0;">
          <div style="border: 1px solid #000; padding: 1px 4px; margin-bottom: 1.5px; background: #fff; min-height: 12px;">${alamatPindah || '&nbsp;'}</div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 1.5px;">
            <tr>
              <td style="width: 80px;">a. Desa/Kelurahan</td>
              <td style="border: 1px solid #000; padding: 1px 4px; background: #fff;">${desaPindah || '&nbsp;'}</td>
              <td style="width: 15px;"></td>
              <td style="width: 20px; text-align: right; padding-right: 3px;">RT</td>
              <td style="width: 32px;">${renderBoxedDigits(rtPindah, 2)}</td>
              <td style="width: 10px;"></td>
              <td style="width: 20px; text-align: right; padding-right: 3px;">RW</td>
              <td style="width: 32px;">${renderBoxedDigits(rwPindah, 2)}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 1.5px;">
            <tr>
              <td style="width: 80px;">b. Kecamatan</td>
              <td style="border: 1px solid #000; padding: 1px 4px; width: 42%; background: #fff;">${kecPindah || '&nbsp;'}</td>
              <td style="width: 15px;"></td>
              <td style="width: 60px;">c. Kab/Kota</td>
              <td style="border: 1px solid #000; padding: 1px 4px; background: #fff;">${kabPindah || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt;">
            <tr>
              <td style="width: 80px;"></td>
              <td style="width: 42%;"></td>
              <td style="width: 15px;"></td>
              <td style="width: 60px;">d. Provinsi</td>
              <td style="border: 1px solid #000; padding: 1px 4px; background: #fff;">${provPindah || '&nbsp;'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- TABEL 7: KELUARGA YANG DATANG -->
  <div style="font-size: 6.8pt; margin-top: 1px; margin-bottom: 1.5px;">7. Keluarga Yang Datang</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 6.7pt; margin-bottom: 2px; border: 1px solid #000;" border="1">
    <thead>
      <tr style="text-align: center; font-weight: bold; background: #fff;">
        <th style="border: 1px solid #000; width: 6%; padding: 1px;">NO</th>
        <th style="border: 1px solid #000; width: 44%; padding: 1px;">N I K</th>
        <th style="border: 1px solid #000; width: 38%; padding: 1px;">N A M A</th>
        <th style="border: 1px solid #000; width: 12%; padding: 1px;">SHDK</th>
      </tr>
    </thead>
    <tbody>
      ${[1, 2, 3, 4, 5]
      .map((idx) => {
        const m = membersList[idx - 1];
        return `<tr style="height: 14px;">
            <td style="border: 1px solid #000; text-align: center; padding: 0;">${idx}</td>
            <td style="border: 1px solid #000; text-align: center; padding: 0;">${renderBoxedDigits(m ? m.nik : '', 16, '11px', '12px')}</td>
            <td style="border: 1px solid #000; padding: 0 4px; font-weight: ${m ? 'bold' : 'normal'}; text-align: left;">${m ? m.nama : '&nbsp;'}</td>
            <td style="border: 1px solid #000; text-align: center; padding: 0;">${m ? ((m as any).shdk || (m as any).hubungan || '') : '&nbsp;'}</td>
          </tr>`;
      })
      .join('')}
    </tbody>
  </table>

  <!-- TANDA TANGAN DAERAH TUJUAN (2 KOLOM) -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; text-align: center;">
    <tr>
      <td style="width: 50%; vertical-align: top; text-align: left; padding-left: 40px;">
        Diketahui oleh :<br/>
        Camat<br/>
        No. ......................, tgl. ........., 20.....
        <div style="height: 24px;"></div>
        (............................................................)<br/>
        NIP.
      </td>
      <td style="width: 50%; vertical-align: top; text-align: left; padding-left: 40px;">
        Diterima oleh :<br/>
        Kepala Desa/Lurah<br/>
        No. ......................, tgl. ........., 20.....
        <div style="height: 24px;"></div>
        (............................................................)<br/>
        NIP.
      </td>
    </tr>
  </table>
</div>`;
}
