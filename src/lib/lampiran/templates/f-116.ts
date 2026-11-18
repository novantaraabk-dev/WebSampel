import type { OpenSidRenderContext } from '../../opensid-surat-engine';
import { getCachedVillageIdentity, formatTanggalIndonesia } from '../../opensid-surat-engine';

export function buildF116PortraitHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};
  const vId = getCachedVillageIdentity();

  const namaPemohon = vIndividu?.nama || fValues['form_nama'] || fValues['nama'] || '';
  const nikPemohon = vIndividu?.nik || fValues['form_nik'] || fValues['nik'] || '';
  const namaKepalaKk = vIndividu?.kepala_kk || vIndividu?.nama || fValues['form_kepala_kk'] || '';
  const noKk = vIndividu?.no_kk || fValues['form_no_kk'] || fValues['no_kk'] || '';

  const alamat = vIndividu?.alamat || '';
  const desa = ctx?.namaDesa || vId.namaDesa || 'Sampeldes';
  const kec = ctx?.namaKecamatan || vId.namaKecamatan || 'Gandrungmangu';
  const kab = ctx?.namaKabupaten || vId.namaKabupaten || 'Cilacap';
  const prov = ctx?.namaProvinsi || vId.namaProvinsi || 'Jawa Tengah';
  const kodePos = ctx?.kodePos || vId.kodePos || '53254';
  const telp = (vIndividu as any)?.telepon || fValues['form_telepon'] || fValues['telepon'] || '';

  // Helper ekstrak RT dan RW 2 digit (misal: '001' -> '01', '005' -> '05')
  const extract2DigitRtRw = (val?: string | number, rawAlamat?: string, type: 'rt' | 'rw' = 'rt'): string => {
    let str = (val !== undefined && val !== null ? String(val) : '').trim();
    if (!str && rawAlamat) {
      const reg = type === 'rt' ? /rt\.?\s*(\d+)/i : /rw\.?\s*(\d+)/i;
      const m = rawAlamat.match(reg);
      if (m) str = m[1];
    }
    if (!str) return type === 'rt' ? '01' : '05';
    const num = parseInt(str.replace(/\D/g, ''), 10);
    if (!isNaN(num)) {
      return String(num).padStart(2, '0').slice(-2);
    }
    return str.padStart(2, '0').slice(-2);
  };

  const rtClean = extract2DigitRtRw(vIndividu?.rt || fValues['rt'] || fValues['form_rt'], alamat, 'rt');
  const rwClean = extract2DigitRtRw(vIndividu?.rw || fValues['rw'] || fValues['form_rw'], alamat, 'rw');

  // Data Lama
  const namaKepalaKkLama = fValues['form_nama_kepala_kk_lama'] || fValues['nama_kepala_kk_lama'] || namaKepalaKk;
  const noKkLama = fValues['form_no_kk_lama'] || fValues['no_kk_lama'] || noKk;
  const alamatLama = fValues['form_alamat_lama'] || fValues['alamat_lama'] || alamat;
  const rtLamaClean = extract2DigitRtRw(
    fValues['form_rt_lama'] || fValues['rt_lama'] || vIndividu?.rt || fValues['rt'],
    alamatLama,
    'rt'
  );
  const rwLamaClean = extract2DigitRtRw(
    fValues['form_rw_lama'] || fValues['rw_lama'] || vIndividu?.rw || fValues['rw'],
    alamatLama,
    'rw'
  );
  const desaLama = fValues['form_desa_lama'] || fValues['desa_lama'] || desa;
  const kecLama = fValues['form_kecamatan_lama'] || fValues['kecamatan_lama'] || kec;
  const kabLama = fValues['form_kabupaten_lama'] || fValues['kabupaten_lama'] || kab;
  const provLama = fValues['form_provinsi_lama'] || fValues['provinsi_lama'] || prov;
  const kodePosLama = fValues['form_kode_pos_lama'] || fValues['kode_pos_lama'] || kodePos;
  const telpLama = fValues['form_telepon_lama'] || fValues['telepon_lama'] || telp;

  // Pejabat & Penandatangan
  const namaKades = ctx?.namaKepalaDesa || ctx?.namaPamong || vId.namaKepalaDesa || 'TUKIMAN';
  const nipKades = ctx?.nipKepalaDesa || ctx?.nipPamong || vId.nipKepalaDesa || '-';
  const namaCamat = ctx?.namaCamat || vId.namaCamat || 'FATHURROHMAN, S.STP., M.Si.';
  const nipCamat = ctx?.nipCamat || vId.nipCamat || '19780410 199803 1 004';
  const namaKadis = ctx?.namaKadisDukcapil || vId.namaKadisDukcapil || '';
  const nipKadis = ctx?.nipKadisDukcapil || vId.nipKadisDukcapil || '';
  const tglTtd = ctx?.tanggalSurat || formatTanggalIndonesia(new Date());

  // Helpers
  const renderBoxedDigits = (val: string, totalCount = 16, boxWidth = '12px', boxHeight = '13.5px') => {
    const clean = (val || '').toString().replace(/[^0-9a-zA-Z]/g, '');
    const chars = clean.padEnd(totalCount, ' ').slice(0, totalCount).split('');
    return `<table style="border-collapse: collapse; display: inline-table; vertical-align: middle; margin: 0;">
      <tr>
        ${chars.map(c => `<td style="border: 1px solid #000; width: ${boxWidth}; height: ${boxHeight}; text-align: center; font-family: monospace; font-size: 7pt; font-weight: bold; padding: 0; background: #fff;">${c === ' ' ? '&nbsp;' : c}</td>`).join('')}
      </tr>
    </table>`;
  };

  const renderCharBoxes = (str: string, totalCount = 33, boxWidth = '10.5px', boxHeight = '13px') => {
    const chars = (str || '').toUpperCase().padEnd(totalCount, ' ').slice(0, totalCount).split('');
    return `<table style="border-collapse: collapse; display: inline-table; vertical-align: middle; margin: 0;">
      <tr>
        ${chars.map(c => `<td style="border: 1px solid #000; width: ${boxWidth}; height: ${boxHeight}; text-align: center; font-family: monospace; font-size: 6.5pt; font-weight: bold; padding: 0; background: #fff;">${c === ' ' ? '&nbsp;' : c}</td>`).join('')}
      </tr>
    </table>`;
  };

  const renderOptionSquare = (codeVal: string | number) =>
    `<span style="display:inline-block;width:17px;height:13.5px;border:1px solid #000;text-align:center;line-height:13px;font-family:monospace;font-size:7.5pt;font-weight:bold;margin-right:6px;vertical-align:middle;background:#fff;">${codeVal ? codeVal : '&nbsp;'}</span>`;

  // Alasan Permohonan (1: Penambahan, 2: Pengurangan, 3: Lainnya)
  const alasanRaw = (fValues['form_alasan_kk'] || fValues['form_alasan'] || fValues['alasan_kk'] || fValues['alasan'] || '').toLowerCase();
  let codeAlasan = '1';
  if (alasanRaw.includes('kurang') || alasanRaw.includes('mati') || alasanRaw.includes('pindah') || alasanRaw.startsWith('2')) codeAlasan = '2';
  else if (alasanRaw.includes('lain') || alasanRaw.startsWith('3')) codeAlasan = '3';
  else codeAlasan = '1';

  // Anggota keluarga
  const rawMembers = ctx?.familyMembers && ctx.familyMembers.length > 0 ? ctx.familyMembers : [];
  const membersList = rawMembers.length > 0 ? rawMembers : (namaPemohon ? [{ nik: nikPemohon, nama: namaPemohon, shdk: '01' }] : []);
  const jmlAnggota = membersList.length > 0 ? membersList.length.toString() : '1';

  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.5pt; line-height: 1.15; color: #000; width: 100%; box-sizing: border-box; border: 1px solid #000; padding: 6px;">
  <!-- HEADER -->
  <div style="text-align: right; margin-bottom: 2px;">
    <span style="border: 1.5px solid #000; padding: 2px 14px; font-weight: bold; font-size: 10.5pt; font-family: Arial, sans-serif; display: inline-block;">F-1.16</span>
  </div>

  <div style="text-align: center; font-weight: bold; font-size: 9.8pt; margin-bottom: 5px; letter-spacing: 0.3px;">
    FORMULIR PERMOHONAN PERUBAHAN KARTU KELUARGA (KK) WARGA NEGARA INDONESIA
  </div>

  <!-- PERHATIAN -->
  <div style="border: 1px solid #000; padding: 3px 6px; font-size: 6.5pt; line-height: 1.25; margin-bottom: 4px;">
    <strong>Perhatian :</strong><br/>
    1. Harap diisi dengan huruf cetak dan menggunakan tinta hitam<br/>
    2. Setelah formulir ini diisi dan ditandatangani, harap diserahkan kembali ke Kantor Desa/Kelurahan
  </div>

  <!-- WILAYAH -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 4px; border: 1px solid #000;" border="1">
    <tbody>
      <tr>
        <td style="width: 155px; border: none; padding: 1px 4px;">PEMERINTAH PROPINSI</td>
        <td style="width: 10px; border: none; text-align: center;">:</td>
        <td style="width: 30px; border: 1px solid #000; text-align: center; font-family: monospace; font-weight: bold;">33</td>
        <td style="border: none; padding-left: 6px;">
          <div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold; width: 85%;">${prov || '&nbsp;'}</div>
        </td>
      </tr>
      <tr>
        <td style="border: none; padding: 1px 4px;">PEMERINTAH KABUPATEN/KOTA</td>
        <td style="border: none; text-align: center;">:</td>
        <td style="border: 1px solid #000; text-align: center; font-family: monospace; font-weight: bold;">01</td>
        <td style="border: none; padding-left: 6px;">
          <div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold; width: 85%;">${kab || '&nbsp;'}</div>
        </td>
      </tr>
      <tr>
        <td style="border: none; padding: 1px 4px;">KECAMATAN</td>
        <td style="border: none; text-align: center;">:</td>
        <td style="border: 1px solid #000; text-align: center; font-family: monospace; font-weight: bold;">10</td>
        <td style="border: none; padding-left: 6px;">
          <div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold; width: 85%;">${kec || '&nbsp;'}</div>
        </td>
      </tr>
      <tr>
        <td style="border: none; padding: 1px 4px;">KELURAHAN/DESA</td>
        <td style="border: none; text-align: center;">:</td>
        <td style="border: 1px solid #000; text-align: center; font-family: monospace; font-weight: bold;">2011</td>
        <td style="border: none; padding-left: 6px;">
          <div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold; width: 85%;">${desa || '&nbsp;'}</div>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN 1 - 10 -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
    <tbody>
      <tr>
        <td style="width: 140px; padding: 1px 4px; border: 1px solid #000;">1. Nama Lengkap Pemohon</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">${renderCharBoxes(namaPemohon, 33)}</td>
      </tr>
      <tr>
        <td style="padding: 1px 4px; border: 1px solid #000;">2. NIK Pemohon</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">${renderBoxedDigits(nikPemohon, 16)}</td>
      </tr>
      <tr>
        <td style="padding: 1px 4px; border: 1px solid #000;">3. Nama Kepala Keluarga</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">${renderCharBoxes(namaKepalaKk, 33)}</td>
      </tr>
      <tr>
        <td style="padding: 1px 4px; border: 1px solid #000;">4. No. KK</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">${renderBoxedDigits(noKk, 16)}</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 4px; border: 1px solid #000;">5. Alamat</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">
          <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 2px;">
            <tr>
              <td><div style="border: 1px solid #000; padding: 1px 4px; min-height: 11px; background: #fff;">${alamat || '&nbsp;'}</div></td>
              <td style="width: 25px; text-align: right; padding-right: 3px;">RT</td>
              <td style="width: 28px;">${renderBoxedDigits(rtClean, 2)}</td>
              <td style="width: 30px; text-align: right; padding-right: 3px;">RW</td>
              <td style="width: 28px;">${renderBoxedDigits(rwClean, 2)}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 2px;">
            <tr>
              <td style="width: 85px;">a. Desa/Kelurahan</td>
              <td style="border: 1px solid #000; padding: 1px 4px; width: 38%;">${desa || '&nbsp;'}</td>
              <td style="width: 15px;"></td>
              <td style="width: 75px;">b. Kecamatan</td>
              <td style="border: 1px solid #000; padding: 1px 4px;">${kec || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 2px;">
            <tr>
              <td style="width: 85px;">c. Kabupaten/Kota</td>
              <td style="border: 1px solid #000; padding: 1px 4px; width: 38%;">${kab || '&nbsp;'}</td>
              <td style="width: 15px;"></td>
              <td style="width: 75px;">d. Propinsi</td>
              <td style="border: 1px solid #000; padding: 1px 4px;">${prov || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt;">
            <tr>
              <td style="width: 85px;">Kode Pos</td>
              <td style="width: 75px;">${renderBoxedDigits(kodePos, 5)}</td>
              <td style="width: 25px;"></td>
              <td style="width: 75px;">Telepon</td>
              <td>${renderBoxedDigits(telp, 10)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 4px; border: 1px solid #000;">6. Nama Kepala Keluarga Lama</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">${renderCharBoxes(namaKepalaKkLama, 33)}</td>
      </tr>
      <tr>
        <td style="padding: 1px 4px; border: 1px solid #000;">7. No. KK Lama</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">${renderBoxedDigits(noKkLama, 16)}</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 4px; border: 1px solid #000;">8. Alamat Keluarga Lama</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">
          <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 2px;">
            <tr>
              <td><div style="border: 1px solid #000; padding: 1px 4px; min-height: 11px; background: #fff;">${alamatLama || '&nbsp;'}</div></td>
              <td style="width: 25px; text-align: right; padding-right: 3px;">RT</td>
              <td style="width: 28px;">${renderBoxedDigits(rtLamaClean, 2)}</td>
              <td style="width: 30px; text-align: right; padding-right: 3px;">RW</td>
              <td style="width: 28px;">${renderBoxedDigits(rwLamaClean, 2)}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 2px;">
            <tr>
              <td style="width: 85px;">a. Desa/Kelurahan</td>
              <td style="border: 1px solid #000; padding: 1px 4px; width: 38%;">${desaLama || '&nbsp;'}</td>
              <td style="width: 15px;"></td>
              <td style="width: 75px;">b. Kecamatan</td>
              <td style="border: 1px solid #000; padding: 1px 4px;">${kecLama || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 2px;">
            <tr>
              <td style="width: 85px;">c. Kabupaten/Kota</td>
              <td style="border: 1px solid #000; padding: 1px 4px; width: 38%;">${kabLama || '&nbsp;'}</td>
              <td style="width: 15px;"></td>
              <td style="width: 75px;">d. Propinsi</td>
              <td style="border: 1px solid #000; padding: 1px 4px;">${provLama || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt;">
            <tr>
              <td style="width: 85px;">Kode Pos</td>
              <td style="width: 75px;">${renderBoxedDigits(kodePosLama, 5)}</td>
              <td style="width: 25px;"></td>
              <td style="width: 75px;">Telepon</td>
              <td>${renderBoxedDigits(telpLama, 10)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 4px; border: 1px solid #000;">9. Alasan Permohonan</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">
          <table style="border-collapse: collapse; font-size: 6.5pt;">
            <tr>
              <td style="vertical-align: top;">${renderOptionSquare(codeAlasan)}</td>
              <td style="padding-right: 25px;">
                1. Karena Penambahan Anggota Keluarga (Kelahiran, Kedatangan)<br/>
                2. Karena Pengurangan Anggota Keluarga (Kematian, Kepindahan)
              </td>
              <td style="vertical-align: top;">3. Lainnya</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 4px; border: 1px solid #000;">10. Jumlah Anggota Keluarga</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">
          ${renderBoxedDigits(jmlAnggota, 2)} &nbsp;&nbsp; orang
        </td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN 11: DAFTAR ANGGOTA KELUARGA PEMOHON -->
  <div style="font-size: 6.5pt; font-weight: bold; margin-top: 2px; margin-bottom: 1.5px;">
    11. DAFTAR ANGGOTA KELUARGA PEMOHON (hanya diisi Anggota keluarga saja)
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
    <thead>
      <tr style="text-align: center; font-weight: bold; background: #fff;">
        <th style="border: 1px solid #000; width: 5%; padding: 1px;">No.</th>
        <th style="border: 1px solid #000; width: 44%; padding: 1px;">NIK</th>
        <th style="border: 1px solid #000; width: 43%; padding: 1px;">Nama Lengkap</th>
        <th style="border: 1px solid #000; width: 8%; padding: 1px;">SHDK*)</th>
      </tr>
    </thead>
    <tbody>
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      .map((idx) => {
        const m = membersList[idx - 1];
        const shdkCode = m ? (m.shdk && m.shdk.length <= 2 ? m.shdk : '0' + idx) : '';
        return `<tr style="height: 13px;">
            <td style="border: 1px solid #000; text-align: center; padding: 0;">${idx}</td>
            <td style="border: 1px solid #000; text-align: center; padding: 0;">${renderBoxedDigits(m ? m.nik : '', 16, '11px', '11px')}</td>
            <td style="border: 1px solid #000; padding: 0 4px; font-weight: ${m ? 'bold' : 'normal'}; text-align: left;">${m ? m.nama : '&nbsp;'}</td>
            <td style="border: 1px solid #000; text-align: center; padding: 0;">${renderBoxedDigits(shdkCode, 2, '10px', '11px')}</td>
          </tr>`;
      })
      .join('')}
    </tbody>
  </table>

  <!-- TANDA TANGAN -->
  <div style="text-align: right; margin-bottom: 3px; font-size: 6.8pt; font-weight: bold; padding-right: 25px;">
    ${desa}, ${tglTtd}
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; table-layout: fixed;">
    <tr>
      <td style="width: 74%; vertical-align: top; padding-right: 6px;">
        <div style="text-align: center; font-weight: bold; margin-bottom: 2px;">Mengetahui :</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; text-align: center; table-layout: fixed;">
          <tr>
            <td style="width: 35%; vertical-align: top; padding: 0 4px;">
              Kepala Dinas Kependudukan dan<br/>Pencatatan Sipil Kab/Kota
              <div style="height: 38px;"></div>
              <div>( <strong>${namaKadis || '...........................................'}</strong> )</div>
              <div style="margin-top: 2px;">NIP. ${nipKadis || '...........................................'}</div>
            </td>
            <td style="width: 30%; vertical-align: top; padding: 0 4px;">
              Camat ${kec}
              <div style="height: 38px;"></div>
              <div>( <strong>${namaCamat || '...........................................'}</strong> )</div>
              <div style="margin-top: 2px;">NIP. ${nipCamat || '...........................................'}</div>
            </td>
            <td style="width: 35%; vertical-align: top; padding: 0 4px;">
              Kepala Desa ${desa}
              <div style="height: 38px;"></div>
              <div>( <strong style="text-decoration: underline;">${namaKades}</strong> )</div>
              <div style="margin-top: 2px;">${nipKades && nipKades !== '-' ? `NIP. ${nipKades}` : 'NIAP. -'}</div>
            </td>
          </tr>
        </table>
      </td>
      <td style="width: 26%; vertical-align: top; text-align: center; padding-left: 6px;">
        <div style="height: 12px;"></div>
        <div>Pemohon,</div>
        <div style="height: 38px;"></div>
        <div>( <strong style="text-decoration: underline;">${namaPemohon ? namaPemohon.toUpperCase() : '...........................................'}</strong> )</div>
      </td>
    </tr>
  </table>

  <!-- BOTTOM PETUGAS BOX & PAGE NUMBER -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-top: 2px;">
    <tr>
      <td style="width: 55%;"></td>
      <td style="width: 40%; text-align: left;">
        <div style="margin-bottom: 2px;">Tanggal Pemasukan Data</div>
        <div style="margin-bottom: 4px;">
          Tgl &nbsp;${renderBoxedDigits('', 2)} &nbsp;&nbsp; Bln &nbsp;${renderBoxedDigits('', 2)} &nbsp;&nbsp; Thn &nbsp;${renderBoxedDigits('', 4)}
        </div>
        <table style="border-collapse: collapse; font-size: 6.5pt;">
          <tr>
            <td style="padding-right: 6px;">Paraf Petugas</td>
            <td style="border: 1px solid #000; width: 110px; height: 16px; background: #fff;"></td>
          </tr>
        </table>
      </td>
      <td style="width: 5%; text-align: right; vertical-align: bottom; font-weight: bold; font-size: 8pt;">
        61
      </td>
    </tr>
  </table>
</div>`;
}
