import type { OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildF115PortraitHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};

  const namaPemohon = vIndividu?.nama || fValues['form_nama'] || fValues['nama'] || '';
  const nikPemohon = vIndividu?.nik || fValues['form_nik'] || fValues['nik'] || '';
  const noKkSemula = vIndividu?.no_kk || fValues['form_no_kk_semula'] || fValues['no_kk_semula'] || fValues['no_kk'] || '';

  const alamatPemohon = vIndividu?.alamat || '';
  const rtPemohon = vIndividu?.rt || '';
  const rwPemohon = vIndividu?.rw || '';
  const desaPemohon = ctx?.namaDesa || 'Sampeldes';
  const kecPemohon = ctx?.namaKecamatan || 'Gandrungmangu';
  const kabPemohon = ctx?.namaKabupaten || 'Cilacap';
  const provPemohon = ctx?.namaProvinsi || 'Jawa Tengah';
  const kodePosPemohon = ctx?.kodePos || '53254';
  const telpPemohon = (vIndividu as any)?.telepon || fValues['form_telepon'] || fValues['telepon'] || '';

  // Helpers
  const renderBoxedDigits = (val: string, totalCount = 16, boxWidth = '12.5px', boxHeight = '14px') => {
    const clean = (val || '').toString().replace(/[^0-9a-zA-Z]/g, '');
    const chars = clean.padEnd(totalCount, ' ').slice(0, totalCount).split('');
    return `<table style="border-collapse: collapse; display: inline-table; vertical-align: middle; margin: 0;">
      <tr>
        ${chars.map(c => `<td style="border: 1px solid #000; width: ${boxWidth}; height: ${boxHeight}; text-align: center; font-family: monospace; font-size: 7.2pt; font-weight: bold; padding: 0; background: #fff;">${c === ' ' ? '&nbsp;' : c}</td>`).join('')}
      </tr>
    </table>`;
  };

  const renderCharBoxes = (str: string, totalCount = 33, boxWidth = '11px', boxHeight = '13.5px') => {
    const chars = (str || '').toUpperCase().padEnd(totalCount, ' ').slice(0, totalCount).split('');
    return `<table style="border-collapse: collapse; display: inline-table; vertical-align: middle; margin: 0;">
      <tr>
        ${chars.map(c => `<td style="border: 1px solid #000; width: ${boxWidth}; height: ${boxHeight}; text-align: center; font-family: monospace; font-size: 6.8pt; font-weight: bold; padding: 0; background: #fff;">${c === ' ' ? '&nbsp;' : c}</td>`).join('')}
      </tr>
    </table>`;
  };

  const renderOptionSquare = (codeVal: string | number) =>
    `<span style="display:inline-block;width:18px;height:14px;border:1px solid #000;text-align:center;line-height:13px;font-family:monospace;font-size:7.5pt;font-weight:bold;margin-right:6px;vertical-align:middle;background:#fff;">${codeVal ? codeVal : '&nbsp;'}</span>`;

  // Alasan Permohonan (1, 2, 3)
  const alasanRaw = (fValues['form_alasan_kk'] || fValues['form_alasan'] || fValues['alasan_kk'] || '').toLowerCase();
  let codeAlasan = '1';
  if (alasanRaw.includes('hilang') || alasanRaw.includes('rusak') || alasanRaw.startsWith('2')) codeAlasan = '2';
  else if (alasanRaw.includes('lain') || alasanRaw.startsWith('3')) codeAlasan = '3';
  else codeAlasan = '1';

  // Anggota keluarga
  const rawMembers = ctx?.familyMembers && ctx.familyMembers.length > 0 ? ctx.familyMembers : [];
  const membersList = rawMembers.length > 0 ? rawMembers : (namaPemohon ? [{ nik: nikPemohon, nama: namaPemohon, shdk: '01' }] : []);
  const jmlAnggota = membersList.length > 0 ? membersList.length.toString() : '1';

  const tglTtd = ctx?.tanggalSurat || '............................................';
  const kotaTtd = ctx?.namaDesa || 'Sampeldes';

  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.8pt; line-height: 1.15; color: #000; width: 100%; box-sizing: border-box; border: 1px solid #000; padding: 8px;">
  <!-- HEADER -->
  <div style="text-align: right; margin-bottom: 2px;">
    <span style="border: 1.5px solid #000; padding: 2px 14px; font-weight: bold; font-size: 10.5pt; font-family: Arial, sans-serif; display: inline-block;">F-1.15</span>
  </div>

  <div style="text-align: center; font-weight: bold; font-size: 10pt; margin-bottom: 6px; letter-spacing: 0.3px;">
    FORMULIR PERMOHONAN KARTU KELUARGA (KK) BARU WARGA NEGARA INDONESIA
  </div>

  <!-- PERHATIAN -->
  <div style="border: 1px solid #000; padding: 3px 6px; font-size: 6.7pt; line-height: 1.25; margin-bottom: 4px;">
    <strong>Perhatian :</strong><br/>
    1. Harap diisi dengan huruf cetak dan menggunakan tinta hitam.<br/>
    2. Setelah formulir ini diisi dan ditandatangani, harap diserahkan kembali ke kantor desa/kelurahan.
  </div>

  <!-- WILAYAH -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 4px; border: 1px solid #000;" border="1">
    <tbody>
      <tr>
        <td style="width: 155px; border: none; padding: 1.5px 4px;">PEMERINTAH PROVINSI</td>
        <td style="width: 10px; border: none; text-align: center;">:</td>
        <td style="width: 32px; border: 1px solid #000; text-align: center; font-family: monospace; font-weight: bold;">33</td>
        <td style="border: none; padding-left: 6px;">
          <div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold; width: 85%;">${provPemohon || '&nbsp;'}</div>
        </td>
      </tr>
      <tr>
        <td style="border: none; padding: 1.5px 4px;">PEMERINTAH KABUPATEN/KOTA</td>
        <td style="border: none; text-align: center;">:</td>
        <td style="border: 1px solid #000; text-align: center; font-family: monospace; font-weight: bold;">01</td>
        <td style="border: none; padding-left: 6px;">
          <div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold; width: 85%;">${kabPemohon || '&nbsp;'}</div>
        </td>
      </tr>
      <tr>
        <td style="border: none; padding: 1.5px 4px;">KECAMATAN</td>
        <td style="border: none; text-align: center;">:</td>
        <td style="border: 1px solid #000; text-align: center; font-family: monospace; font-weight: bold;">10</td>
        <td style="border: none; padding-left: 6px;">
          <div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold; width: 85%;">${kecPemohon || '&nbsp;'}</div>
        </td>
      </tr>
      <tr>
        <td style="border: none; padding: 1.5px 4px;">KELURAHAN / DESA</td>
        <td style="border: none; text-align: center;">:</td>
        <td style="border: 1px solid #000; text-align: center; font-family: monospace; font-weight: bold;">2011</td>
        <td style="border: none; padding-left: 6px;">
          <div style="border: 1px solid #000; padding: 1px 4px; font-weight: bold; width: 85%;">${desaPemohon || '&nbsp;'}</div>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN 1 - 6 -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 3px; border: 1px solid #000;" border="1">
    <tbody>
      <tr>
        <td style="width: 140px; padding: 1px 4px; border: 1px solid #000;">1. Nama Lengkap Pemohon</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">${renderCharBoxes(namaPemohon, 33)}</td>
      </tr>
      <tr>
        <td style="padding: 1px 4px; border: 1px solid #000;">2. N I K Pemohon</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">${renderBoxedDigits(nikPemohon, 16)}</td>
      </tr>
      <tr>
        <td style="padding: 1px 4px; border: 1px solid #000;">3. No. KK Semula</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">
          ${renderBoxedDigits(noKkSemula, 16)} &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size: 6.2pt; color: #222;">*) Diisi oleh petugas</span>
        </td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 4px; border: 1px solid #000;">4. Alamat Pemohon</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">
          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 2px;">
            <tr>
              <td><div style="border: 1px solid #000; padding: 1px 4px; min-height: 12px; background: #fff;">${alamatPemohon || '&nbsp;'}</div></td>
              <td style="width: 30px; text-align: right; padding-right: 3px;">RT :</td>
              <td style="width: 32px;">${renderBoxedDigits(rtPemohon, 2)}</td>
              <td style="width: 35px; text-align: right; padding-right: 3px;">RW :</td>
              <td style="width: 32px;">${renderBoxedDigits(rwPemohon, 2)}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 2px;">
            <tr>
              <td style="width: 85px;">a. Desa/Kelurahan</td>
              <td style="border: 1px solid #000; padding: 1px 4px; width: 38%;">${desaPemohon || '&nbsp;'}</td>
              <td style="width: 15px;"></td>
              <td style="width: 75px;">b. Kecamatan</td>
              <td style="border: 1px solid #000; padding: 1px 4px;">${kecPemohon || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; margin-bottom: 2px;">
            <tr>
              <td style="width: 85px;">b. Kabupaten/Kota</td>
              <td style="border: 1px solid #000; padding: 1px 4px; width: 38%;">${kabPemohon || '&nbsp;'}</td>
              <td style="width: 15px;"></td>
              <td style="width: 75px;">c. Propinsi</td>
              <td style="border: 1px solid #000; padding: 1px 4px;">${provPemohon || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt;">
            <tr>
              <td style="width: 85px;">Kode Pos</td>
              <td style="width: 85px;">${renderBoxedDigits(kodePosPemohon, 5)}</td>
              <td style="width: 15px;"></td>
              <td style="width: 75px;">Telepon</td>
              <td>${renderBoxedDigits(telpPemohon, 10)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 4px; border: 1px solid #000;">5. Alasan Permohonan</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">
          <table style="border-collapse: collapse; font-size: 6.8pt;">
            <tr>
              <td style="vertical-align: top;">${renderOptionSquare(codeAlasan)}</td>
              <td style="padding-right: 25px;">
                1. Karena Membentuk Rumah Tangga Baru<br/>
                2. Karena Kartu Keluarga Hilang/Rusak
              </td>
              <td style="vertical-align: top;">3. Lainnya</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 1px 4px; border: 1px solid #000;">6. Jumlah Anggota Keluarga</td>
        <td style="padding: 1px 4px; border: 1px solid #000;">
          ${renderBoxedDigits(jmlAnggota, 2)} &nbsp;&nbsp; orang
        </td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN 7: DAFTAR ANGGOTA KELUARGA PEMOHON -->
  <div style="font-size: 6.8pt; font-weight: bold; margin-top: 3px; margin-bottom: 1.5px;">
    7. DAFTAR ANGGOTA KELUARGA PEMOHON (hanya diisi anggota keluarga saja)
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 6.7pt; margin-bottom: 4px; border: 1px solid #000;" border="1">
    <thead>
      <tr style="text-align: center; font-weight: bold; background: #fff;">
        <th style="border: 1px solid #000; width: 5%; padding: 1px;">No.</th>
        <th style="border: 1px solid #000; width: 44%; padding: 1px;">N I K</th>
        <th style="border: 1px solid #000; width: 43%; padding: 1px;">Nama &nbsp; Lengkap</th>
        <th style="border: 1px solid #000; width: 8%; padding: 1px;">SHDK*)</th>
      </tr>
    </thead>
    <tbody>
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      .map((idx) => {
        const m = membersList[idx - 1];
        const shdkCode = m ? (m.shdk && m.shdk.length <= 2 ? m.shdk : '0' + idx) : '';
        return `<tr style="height: 13.5px;">
            <td style="border: 1px solid #000; text-align: center; padding: 0;">${idx}</td>
            <td style="border: 1px solid #000; text-align: center; padding: 0;">${renderBoxedDigits(m ? m.nik : '', 16, '11px', '11.5px')}</td>
            <td style="border: 1px solid #000; padding: 0 4px; font-weight: ${m ? 'bold' : 'normal'}; text-align: left;">${m ? m.nama : '&nbsp;'}</td>
            <td style="border: 1px solid #000; text-align: center; padding: 0;">${renderBoxedDigits(shdkCode, 2, '10px', '11.5px')}</td>
          </tr>`;
      })
      .join('')}
    </tbody>
  </table>

  <!-- TANDA TANGAN -->
  <div style="text-align: right; margin-bottom: 2px; font-size: 6.8pt; padding-right: 30px;">
    ${kotaTtd}, ${tglTtd}
  </div>
  <div style="text-align: center; font-size: 6.8pt; margin-bottom: 2px;">
    Mengetahui :
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt; text-align: center; margin-bottom: 4px;">
    <tr>
      <td style="width: 33%; vertical-align: top;">
        C a m a t,
        <div style="height: 38px;"></div>
        ___________________________
      </td>
      <td style="width: 34%; vertical-align: top;">
        Kepala Desa / Lurah,
        <div style="height: 38px;"></div>
        ___________________________
      </td>
      <td style="width: 33%; vertical-align: top;">
        P e m o h o n,
        <div style="height: 38px;"></div>
        ___________________________
      </td>
    </tr>
  </table>

  <!-- BOTTOM PETUGAS BOX -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-top: 2px;">
    <tr>
      <td style="width: 60%;"></td>
      <td style="width: 40%; text-align: left;">
        <div style="margin-bottom: 2px;">Tanggal Pemasukan Data</div>
        <div style="margin-bottom: 4px;">
          Tgl. &nbsp;${renderBoxedDigits('', 2)} &nbsp;&nbsp; Bln. &nbsp;${renderBoxedDigits('', 2)} &nbsp;&nbsp; Thn. &nbsp;${renderBoxedDigits('', 4)}
        </div>
        <table style="border-collapse: collapse; font-size: 6.5pt;">
          <tr>
            <td style="padding-right: 6px;">Paraf Petugas</td>
            <td style="border: 1px solid #000; width: 110px; height: 18px; background: #fff;"></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`;
}
