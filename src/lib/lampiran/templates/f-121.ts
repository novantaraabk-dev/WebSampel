import type { OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildF121PortraitHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};

  const namaDesa = ctx?.namaDesa || 'Sampeldes';
  const namaKec = ctx?.namaKecamatan || 'Gandrungmangu';
  const namaKab = ctx?.namaKabupaten || 'Cilacap';
  const namaProv = ctx?.namaProvinsi || 'Jawa Tengah';
  const kodePos = ctx?.kodePos || '53254';

  // Kode wilayah pemda Sampeldes: 33.01.10.2011
  const rawKodeWil = (ctx?.kodeDesa || '33.01.10.2011').replace(/[^0-9]/g, '');
  const kodeProv = rawKodeWil.slice(0, 2) || '33';
  const kodeKab = rawKodeWil.slice(2, 4) || '01';
  const kodeKec = rawKodeWil.slice(4, 6) || '10';
  const kodeDesa = rawKodeWil.slice(6, 10) || '2011';

  // Data Pemohon
  const namaLengkap = vIndividu?.nama || fValues['form_nama'] || fValues['nama'] || 'TUKIMAN';
  const noKk = vIndividu?.no_kk || fValues['form_no_kk'] || fValues['no_kk'] || '3301102508120005';
  const nik = vIndividu?.nik || fValues['form_nik'] || fValues['nik'] || '3301101205800001';
  const alamat = vIndividu?.alamat || fValues['form_alamat'] || fValues['alamat'] || `Jl. Raya Sampeldes No. 219, Desa ${namaDesa}`;
  const rt = (vIndividu?.rt || fValues['form_rt'] || fValues['rt'] || '02').toString().padStart(3, '0');
  const rw = (vIndividu?.rw || fValues['form_rw'] || fValues['rw'] || '03').toString().padStart(3, '0');

  // Jenis Permohonan KTP: A. Baru, B. Perpanjangan, C. Penggantian
  const permohonanRaw = (fValues['form_jenis_permohonan'] || fValues['jenis_permohonan'] || fValues['form_permohonan_ktp'] || 'A. Baru').toLowerCase();
  const isPerpanjangan = permohonanRaw.includes('panjang') || permohonanRaw.includes('b.');
  const isPenggantian = permohonanRaw.includes('ganti') || permohonanRaw.includes('hilang') || permohonanRaw.includes('rusak') || permohonanRaw.includes('c.');
  const isBaru = !isPerpanjangan && !isPenggantian;

  const tanggalSurat = ctx?.tanggalSurat || '';
  const namaKades = ctx?.namaPamong || 'TUKIMAN';
  const nipKades = ctx?.nipPamong || '-';
  const namaCamat = ctx?.namaCamat || 'FATHURROHMAN, S.STP., M.Si.';
  const nipCamat = ctx?.nipCamat || '19780410 199803 1 004';

  // Helpers
  const renderBoxedDigits = (val: string | number, totalCount = 16, boxWidth = '13.5px', boxHeight = '16px') => {
    const clean = (val ?? '').toString().replace(/[^0-9a-zA-Z]/g, '');
    const chars = clean.padEnd(totalCount, ' ').slice(0, totalCount).split('');
    return `<table style="border-collapse: collapse; display: inline-table; vertical-align: middle; margin: 0;">
      <tr>
        ${chars.map(c => `<td style="border: 1px solid #000; width: ${boxWidth}; height: ${boxHeight}; text-align: center; font-family: monospace; font-size: 7.5pt; font-weight: bold; padding: 0; background: #fff;">${c === ' ' ? '&nbsp;' : c}</td>`).join('')}
      </tr>
    </table>`;
  };

  const renderCharBoxes = (str: string, totalCount = 33, boxWidth = '13.5px', boxHeight = '16px') => {
    const chars = (str || '').toUpperCase().padEnd(totalCount, ' ').slice(0, totalCount).split('');
    return `<table style="border-collapse: collapse; display: inline-table; vertical-align: middle; margin: 0;">
      <tr>
        ${chars.map(c => `<td style="border: 1px solid #000; width: ${boxWidth}; height: ${boxHeight}; text-align: center; font-family: monospace; font-size: 7.2pt; font-weight: bold; padding: 0; background: #fff;">${c === ' ' ? '&nbsp;' : c}</td>`).join('')}
      </tr>
    </table>`;
  };

  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 8pt; line-height: 1.25; color: #000; width: 100%; box-sizing: border-box; padding: 10px 15px;">
  <!-- KODE FORMULIR -->
  <div style="text-align: right; margin-bottom: 6px;">
    <div style="display: inline-block; border: 1.5px solid #000; padding: 2px 14px; font-weight: bold; font-size: 13pt; font-family: Arial, sans-serif;">
      F-1.21
    </div>
  </div>

  <!-- JUDUL FORMULIR -->
  <div style="text-align: center; font-weight: bold; font-size: 10.5pt; font-family: Arial, sans-serif; letter-spacing: 0.5px; margin-bottom: 8px;">
    FORMULIR PERMOHONAN KARTU TANDA PENDUDUK (KTP) WARGA NEGARA INDONESIA
  </div>

  <!-- KOTAK PERHATIAN -->
  <div style="border: 1px solid #000; padding: 3px 6px; font-size: 7.2pt; font-family: Arial, sans-serif; line-height: 1.35; margin-bottom: 8px;">
    <strong>Perhatian :</strong><br/>
    1. Harap diisi dengan huruf cetak dan menggunakan tinta hitam<br/>
    2. Untuk kolom pilihan, harap memberi tanda silang (X) pada kotak pilihan.<br/>
    3. Setelah formulir ini diisi dan ditandatangani, harap diserahkan kembali ke kantor Desa/Kelurahan
  </div>

  <!-- WILAYAH PEMERINTAHAN -->
  <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; font-family: Arial, sans-serif; margin-bottom: 6px;">
    <tr>
      <td style="width: 220px; font-weight: bold; padding: 1px 0;">PEMERINTAH PROPINSI</td>
      <td style="width: 10px; font-weight: bold;">:</td>
      <td style="width: 60px;">${renderBoxedDigits(kodeProv, 2, '14px', '15px')}</td>
      <td style="border: 1px solid #000; padding: 1px 6px; font-weight: bold;">${namaProv.toUpperCase()}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 1px 0;">PEMERINTAH KABUPATEN/KOTA</td>
      <td style="font-weight: bold;">:</td>
      <td>${renderBoxedDigits(kodeKab, 2, '14px', '15px')}</td>
      <td style="border: 1px solid #000; padding: 1px 6px; font-weight: bold;">${namaKab.toUpperCase()}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 1px 0;">KECAMATAN</td>
      <td style="font-weight: bold;">:</td>
      <td>${renderBoxedDigits(kodeKec, 2, '14px', '15px')}</td>
      <td style="border: 1px solid #000; padding: 1px 6px; font-weight: bold;">${namaKec.toUpperCase()}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 1px 0;">KELURAHAN/DESA</td>
      <td style="font-weight: bold;">:</td>
      <td>${renderBoxedDigits(kodeDesa, 4, '14px', '15px')}</td>
      <td style="border: 1px solid #000; padding: 1px 6px; font-weight: bold;">${namaDesa.toUpperCase()}</td>
    </tr>
  </table>

  <!-- JENIS PERMOHONAN KTP -->
  <div style="margin-bottom: 8px; font-size: 7.5pt; font-family: Arial, sans-serif; display: flex; align-items: center; gap: 15px;">
    <span style="font-weight: bold; text-decoration: underline;">PERMOHONAN KTP</span>
    
    <table style="border-collapse: collapse; display: inline-table; vertical-align: middle;">
      <tr>
        <td style="border: 1px solid #000; width: 20px; height: 16px; text-align: center; font-weight: bold; font-family: monospace; font-size: 8pt;">${isBaru ? 'X' : '&nbsp;'}</td>
        <td style="border: 1px solid #000; padding: 1px 12px; font-size: 7.2pt;">A. Baru</td>
      </tr>
    </table>

    <table style="border-collapse: collapse; display: inline-table; vertical-align: middle;">
      <tr>
        <td style="border: 1px solid #000; width: 20px; height: 16px; text-align: center; font-weight: bold; font-family: monospace; font-size: 8pt;">${isPerpanjangan ? 'X' : '&nbsp;'}</td>
        <td style="border: 1px solid #000; padding: 1px 12px; font-size: 7.2pt;">B. Perpanjangan</td>
      </tr>
    </table>

    <table style="border-collapse: collapse; display: inline-table; vertical-align: middle;">
      <tr>
        <td style="border: 1px solid #000; width: 20px; height: 16px; text-align: center; font-weight: bold; font-family: monospace; font-size: 8pt;">${isPenggantian ? 'X' : '&nbsp;'}</td>
        <td style="border: 1px solid #000; padding: 1px 12px; font-size: 7.2pt;">C. Penggantian</td>
      </tr>
    </table>
  </div>

  <!-- DATA PEMOHON -->
  <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; font-family: Arial, sans-serif; margin-bottom: 6px;">
    <tr>
      <td style="width: 130px; border: 1px solid #000; padding: 2px 4px; font-weight: 500;">1. Nama Lengkap</td>
      <td style="padding: 1.5px 0 1.5px 6px;">
        ${renderCharBoxes(namaLengkap, 33)}
      </td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 2px 4px; font-weight: 500;">2. No. KK</td>
      <td style="padding: 1.5px 0 1.5px 6px;">
        ${renderBoxedDigits(noKk, 16)}
      </td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 2px 4px; font-weight: 500;">3. NIK</td>
      <td style="padding: 1.5px 0 1.5px 6px;">
        ${renderBoxedDigits(nik, 16)}
      </td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 2px 4px; font-weight: 500; vertical-align: top;">4. Alamat</td>
      <td style="padding: 1.5px 0 1.5px 6px;">
        <div style="border: 1px solid #000; width: 100%; height: 16px; line-height: 16px; padding: 0 4px; font-size: 7.2pt; font-weight: 500; box-sizing: border-box; margin-bottom: 2px;">
          ${alamat}
        </div>
        <div style="border: 1px solid #000; width: 100%; height: 16px; line-height: 16px; padding: 0 4px; font-size: 7.2pt; box-sizing: border-box;">
          &nbsp;
        </div>
      </td>
    </tr>
  </table>

  <!-- RT / RW & KODE POS -->
  <div style="margin-left: 136px; margin-bottom: 12px; font-size: 7.5pt; font-family: Arial, sans-serif; display: flex; align-items: center; gap: 10px;">
    <table style="border-collapse: collapse; display: inline-table; vertical-align: middle;">
      <tr>
        <td style="border: 1px solid #000; padding: 1px 6px; font-size: 7.2pt; font-weight: bold;">RT</td>
        <td style="width: 6px;"></td>
        <td>${renderBoxedDigits(rt, 3, '14px', '16px')}</td>
      </tr>
    </table>

    <table style="border-collapse: collapse; display: inline-table; vertical-align: middle;">
      <tr>
        <td style="border: 1px solid #000; padding: 1px 6px; font-size: 7.2pt; font-weight: bold;">RW</td>
        <td style="width: 6px;"></td>
        <td>${renderBoxedDigits(rw, 3, '14px', '16px')}</td>
      </tr>
    </table>

    <table style="border-collapse: collapse; display: inline-table; vertical-align: middle;">
      <tr>
        <td style="border: 1px solid #000; padding: 1px 8px; font-size: 7.2pt; font-weight: bold;">Kode Pos:</td>
        <td style="width: 6px;"></td>
        <td>${renderBoxedDigits(kodePos, 5, '14px', '16px')}</td>
      </tr>
    </table>
  </div>

  <!-- AREA BAWAH: FOTO/CAP JEMPOL & TANDA TANGAN -->
  <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; font-family: Arial, sans-serif; margin-bottom: 15px;">
    <tr>
      <!-- KOTAK SPESIMEN & FOTO (KIRI) -->
      <td style="width: 52%; vertical-align: top;">
        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-size: 7pt; text-align: center;" border="1">
          <tr style="font-weight: 500;">
            <td style="width: 25%; padding: 2px; border: 1px solid #000;">Pas Photo (2 x 3)</td>
            <td style="width: 25%; padding: 2px; border: 1px solid #000;">Cap Jempol</td>
            <td style="width: 50%; padding: 2px; border: 1px solid #000;">Specimen Tanda Tangan</td>
          </tr>
          <tr>
            <!-- Pas Photo Oval -->
            <td style="height: 105px; vertical-align: middle; padding: 4px; border: 1px solid #000;">
              <div style="width: 52px; height: 74px; border: 1.5px dashed #000; border-radius: 50%; margin: 0 auto;"></div>
            </td>

            <!-- Cap Jempol -->
            <td style="vertical-align: middle; padding: 4px; border: 1px solid #000;">
              &nbsp;
            </td>

            <!-- Specimen Tanda Tangan -->
            <td style="vertical-align: top; padding: 4px; border: 1px solid #000; position: relative;">
              <div style="text-align: left; font-size: 7pt; color: #333; margin-top: 15px; margin-left: 5px;">
                Atau --&gt;
              </div>
              <div style="position: absolute; bottom: 3px; left: 4px; right: 4px; text-align: left; font-size: 6.8pt; border-top: 1px solid #ccc; padding-top: 2px;">
                Ket : &nbsp; Cap Jempol/Tanda Tangan
              </div>
            </td>
          </tr>
        </table>
      </td>

      <!-- TANDA TANGAN PEMOHON (KANAN) -->
      <td style="width: 48%; vertical-align: top; padding-left: 25px; text-align: center;">
        <div style="font-size: 7.5pt;">
          ${namaDesa}, ${tanggalSurat || '.................................... 20....'}
        </div>
        <div style="margin-top: 2px; font-size: 7.5pt;">Pemohon,</div>
        <div style="height: 65px;"></div>
        <div style="font-size: 7.5pt;">
          ( ${namaLengkap || '...................................................'} )
        </div>
      </td>
    </tr>
  </table>

  <!-- TANDA TANGAN MENGETAHUI (CAMAT & KEPALA DESA) -->
  <div style="text-align: center; font-size: 7.5pt; font-family: Arial, sans-serif; margin-top: 10px; margin-bottom: 2px;">
    Mengetahui,
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; font-family: Arial, sans-serif; text-align: center;">
    <tr>
      <!-- CAMAT -->
      <td style="width: 50%; vertical-align: top; padding: 0 10px;">
        Camat ${namaKec}
        <div style="height: 60px;"></div>
        ( ${namaCamat || '...................................................'} )<br/>
        NIP. ${nipCamat || '...................................................'}
      </td>

      <!-- KEPALA DESA -->
      <td style="width: 50%; vertical-align: top; padding: 0 10px;">
        Kepala Desa/Lurah ${namaDesa}
        <div style="height: 60px;"></div>
        ( ${namaKades || '...................................................'} )<br/>
        NIP. ${nipKades || '...................................................'}
      </td>
    </tr>
  </table>
</div>`;
}

