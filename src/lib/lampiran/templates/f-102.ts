import type { OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildF102PortraitHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};
  const letterTitle = (ctx?.judulSurat || '').toLowerCase();

  // Helper check circle (○ / ●)
  const circle = (val: boolean) =>
    `<span style="display:inline-block;width:11px;height:11px;border:1.2px solid #000;border-radius:50%;text-align:center;line-height:9px;font-size:7pt;margin-right:6px;vertical-align:middle;">${val ? '&#9679;' : '&nbsp;'}</span>`;

  // Helper check cell (✓)
  const check = (val: boolean) =>
    val ? '<span style="font-weight:bold;font-size:8pt;">&#10003;</span>' : '&nbsp;';

  // Deteksi status checkmark otomatis berdasarkan konteks surat
  const isKkBaru = letterTitle.includes('kk baru') || letterTitle.includes('kartu keluarga baru');
  const isKkUbah = letterTitle.includes('perubahan kartu keluarga') || letterTitle.includes('perubahan kk') || letterTitle.includes('beda nama') || letterTitle.includes('beda identitas');
  const isKtp = letterTitle.includes('ktp');
  const isPindah = letterTitle.includes('pindah');
  const isHilang = letterTitle.includes('hilang') || letterTitle.includes('kehilangan');
  const isKia = letterTitle.includes('kia') || letterTitle.includes('anak');

  // I. Kartu Keluarga
  const checkKkBaru = check(isKkBaru);
  const checkKkBentukBaru = check(isKkBaru);
  const checkKkGantiKades = check(false);
  const checkKkPisah = check(false);
  const checkKkPindahDatang = check(isPindah);
  const checkKkWniLn = check(false);
  const checkKkRentan = check(false);
  const checkKkUbahData = check(isKkUbah);
  const checkKkNumpang = check(false);
  const checkKkPeristiwaPenting = check(false);
  const checkKkUbahElemen = check(isKkUbah);
  const checkKkHilangRusak = check(isHilang && !isKtp);
  const checkKkHilang = check(isHilang && !isKtp);
  const checkKkRusak = check(false);

  // II. KTP-el
  const checkKtpBaru = check(isKtp && !isHilang && !isPindah);
  const checkKtpPindahDatang = check(isPindah && isKtp);
  const checkKtpHilangRusak = check(isHilang && isKtp);
  const checkKtpHilang = check(isHilang && isKtp);
  const checkKtpRusak = check(false);
  const checkKtpItap = check(false);
  const checkKtpWn = check(false);
  const checkKtpLuarDomisili = check(false);
  const checkKtpTransmigrasi = check(false);

  // III. KIA
  const checkKiaBaru = check(isKia);
  const checkKiaHilangRusak = check(false);
  const checkKiaHilang = check(false);
  const checkKiaRusak = check(false);
  const checkKiaItap = check(false);
  const checkKiaLain = check(false);

  // IV. Perubahan Data
  const checkUbahKk = check(isKkUbah || isKkBaru);
  const checkUbahKtp = check(isKtp);
  const checkUbahKia = check(isKia);

  // Persyaratan yang dilampirkan (Section III)
  const reqKkLama = isKkUbah || isKkBaru || isKtp || isPindah;
  const reqBukuNikah = isKkBaru || letterTitle.includes('nikah');
  const reqAktaCerai = letterTitle.includes('cerai');
  const reqSkpwni = isPindah;
  const reqPindahLn = false;
  const reqKtpRusak = false;
  const reqDokPerjalanan = false;
  const reqHilangPolisi = isHilang;

  const reqBuktiUbah = isKkUbah;
  const reqSptjmNikah = false;
  const reqAktaKematian = letterTitle.includes('kematian') || letterTitle.includes('mati');
  const reqSuketHilangRusak = isHilang;
  const reqPindahPerwakilan = false;
  const reqTerimaKeluarga = false;
  const reqKuasaAnak = false;
  const reqItap = false;

  const namaPemohon = vIndividu?.nama || '[NAma]';
  const nikPemohon = vIndividu?.nik || '[Nik]';
  const noKkPemohon = vIndividu?.no_kk || '[No_kK]';
  const tglCetak = ctx?.tanggalSurat && ctx?.namaDesa ? `[Nama_desA], [Tanggal_suraT]` : '.................., ................................ 20...';
  const namaPamong = ctx?.namaPamong || '[NAma_pamong]';

  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; line-height: 1.25; color: #000; width: 100%;">
  <div style="position: relative; text-align: center; margin-bottom: 6px;">
    <div style="font-size: 9pt; color: #333;">- 30 -</div>
    <div style="position: absolute; right: 0; top: 0; border: 1.5px solid #000; padding: 2px 14px; font-weight: bold; font-size: 10pt; letter-spacing: 1px;">
      F 1.02
    </div>
  </div>

  <div style="text-align: center; font-weight: bold; font-size: 10.5pt; margin-bottom: 12px; letter-spacing: 0.5px;">
    FORMULIR PENDAFTARAN PERISTIWA KEPENDUDUKAN
  </div>

  <div style="font-weight: bold; font-size: 8.5pt; margin-bottom: 3px;">
    I. DATA PEMOHON:
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 8.5pt;">
    <tbody>
      <tr>
        <td style="width: 25px; vertical-align: middle; padding: 2px 0;">1.</td>
        <td style="width: 190px; vertical-align: middle; padding: 2px 0;">NAMA LENGKAP</td>
        <td style="width: 15px; vertical-align: middle; text-align: center;">:</td>
        <td style="border: 1px solid #000; padding: 3px 8px; font-weight: bold; background: #fff;">
          ${namaPemohon}
        </td>
      </tr>
      <tr>
        <td style="vertical-align: middle; padding: 2px 0;">2.</td>
        <td style="vertical-align: middle; padding: 2px 0;">No. Induk Kependudukan</td>
        <td style="vertical-align: middle; text-align: center;">:</td>
        <td style="border: 1px solid #000; padding: 3px 8px; font-weight: bold; letter-spacing: 1px; font-family: monospace; background: #fff;">
          ${nikPemohon}
        </td>
      </tr>
      <tr>
        <td style="vertical-align: middle; padding: 2px 0;">3.</td>
        <td style="vertical-align: middle; padding: 2px 0;">Nomor Kartu Keluarga</td>
        <td style="vertical-align: middle; text-align: center;">:</td>
        <td style="border: 1px solid #000; padding: 3px 8px; font-weight: bold; letter-spacing: 1px; font-family: monospace; background: #fff;">
          ${noKkPemohon}
        </td>
      </tr>
    </tbody>
  </table>

  <div style="font-weight: bold; font-size: 8.5pt; margin-bottom: 3px;">
    II. JENIS PERMOHONAN:
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 7.5pt; border: 1px solid #000;" border="1">
    <thead>
      <tr style="text-align: left; font-weight: bold;">
        <th style="padding: 3px 4px; width: 28%; vertical-align: top;" colspan="2">I &nbsp; KARTU KELUARGA</th>
        <th style="padding: 3px 4px; width: 26%; vertical-align: top;" colspan="2">II &nbsp; KTP-el</th>
        <th style="padding: 3px 4px; width: 25%; vertical-align: top;" colspan="2">III &nbsp; KARTU IDENTITAS ANAK</th>
        <th style="padding: 3px 4px; width: 21%; vertical-align: top;" colspan="2">IV &nbsp; PERUBAHAN DATA</th>
      </tr>
    </thead>
    <tbody>
      <tr style="font-weight: bold;">
        <td style="padding: 2px 4px;">A &nbsp; BARU</td>
        <td style="width: 22px; text-align: center; padding: 1px;">${checkKkBaru}</td>
        <td style="padding: 2px 4px;">A. &nbsp; BARU</td>
        <td style="width: 20px; text-align: center; padding: 1px;">${checkKtpBaru}</td>
        <td style="padding: 2px 4px;">A &nbsp; BARU</td>
        <td style="width: 20px; text-align: center; padding: 1px;">${checkKiaBaru}</td>
        <td style="padding: 2px 4px;">A &nbsp; KK</td>
        <td style="width: 20px; text-align: center; padding: 1px;">${checkUbahKk}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 4px; padding-left: 10px;">1. Membentuk Keluarga Baru</td>
        <td style="text-align: center; padding: 1px;">${checkKkBentukBaru}</td>
        <td style="padding: 1.5px 4px; font-weight: bold;">B &nbsp; PINDAH DATANG</td>
        <td style="text-align: center; padding: 1px;">${checkKtpPindahDatang}</td>
        <td style="padding: 1.5px 4px; font-weight: bold;">B &nbsp; HILANG/RUSAK</td>
        <td style="text-align: center; padding: 1px;">${checkKiaHilangRusak}</td>
        <td style="padding: 1.5px 4px;">B &nbsp; KTP-el</td>
        <td style="text-align: center; padding: 1px;">${checkUbahKtp}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 4px; padding-left: 10px;">2. Penggantian Kepala Keluarga</td>
        <td style="text-align: center; padding: 1px;">${checkKkGantiKades}</td>
        <td style="padding: 1.5px 4px; font-weight: bold;">C &nbsp; HILANG/RUSAK</td>
        <td style="text-align: center; padding: 1px;">${checkKtpHilangRusak}</td>
        <td style="padding: 1.5px 4px; padding-left: 10px;">1. Hilang</td>
        <td style="text-align: center; padding: 1px;">${checkKiaHilang}</td>
        <td style="padding: 1.5px 4px;">C &nbsp; KIA</td>
        <td style="text-align: center; padding: 1px;">${checkUbahKia}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 4px; padding-left: 10px;">3. Pisah KK</td>
        <td style="text-align: center; padding: 1px;">${checkKkPisah}</td>
        <td style="padding: 1.5px 4px; padding-left: 10px;">1. Hilang</td>
        <td style="text-align: center; padding: 1px;">${checkKtpHilang}</td>
        <td style="padding: 1.5px 4px; padding-left: 10px;">2. Rusak</td>
        <td style="text-align: center; padding: 1px;">${checkKiaRusak}</td>
        <td style="padding: 2px 4px; font-size: 7pt; line-height: 1.15; vertical-align: top;" colspan="2" rowspan="11">
          melampirkan:<br/>
          1) Formulir Perubahan Data; dan<br/>
          2) Bukti Perubahan Data
        </td>
      </tr>
      <tr>
        <td style="padding: 1.5px 4px; padding-left: 10px;">4. Pindah Datang</td>
        <td style="text-align: center; padding: 1px;">${checkKkPindahDatang}</td>
        <td style="padding: 1.5px 4px; padding-left: 10px;">2. Rusak</td>
        <td style="text-align: center; padding: 1px;">${checkKtpRusak}</td>
        <td style="padding: 1.5px 4px; font-weight: bold;">C. Perpanjangan ITAP</td>
        <td style="text-align: center; padding: 1px;">${checkKiaItap}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 4px; padding-left: 10px;">5. WNI dari LN karena Pindah</td>
        <td style="text-align: center; padding: 1px;">${checkKkWniLn}</td>
        <td style="padding: 1.5px 4px; font-weight: bold;">D &nbsp; PERPANJANGAN ITAP</td>
        <td style="text-align: center; padding: 1px;">${checkKtpItap}</td>
        <td style="padding: 1.5px 4px; font-weight: bold;">D &nbsp; Lainnya</td>
        <td style="text-align: center; padding: 1px;">${checkKiaLain}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 4px; padding-left: 10px;">6. Rentan Adminduk</td>
        <td style="text-align: center; padding: 1px;">${checkKkRentan}</td>
        <td style="padding: 1.5px 4px; font-weight: bold;" rowspan="2">E. PERUBAHAN STATUS KEWARGANEGARAAN</td>
        <td style="text-align: center; padding: 1px;" rowspan="2">${checkKtpWn}</td>
        <td style="padding: 1.5px 4px; border-bottom: none;">&nbsp;</td>
        <td style="padding: 1px; border-bottom: none;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding: 2px 4px; font-weight: bold;">B. PERUBAHAN DATA</td>
        <td style="text-align: center; padding: 1px;">${checkKkUbahData}</td>
        <td style="padding: 1.5px 4px; border-top: none; border-bottom: none;">&nbsp;</td>
        <td style="padding: 1px; border-top: none; border-bottom: none;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 4px; padding-left: 10px;">1. Menumpang dalam KK</td>
        <td style="text-align: center; padding: 1px;">${checkKkNumpang}</td>
        <td style="padding: 1.5px 4px; font-weight: bold;">F &nbsp; LUAR DOMISILI</td>
        <td style="text-align: center; padding: 1px;">${checkKtpLuarDomisili}</td>
        <td style="padding: 1.5px 4px; border-top: none; border-bottom: none;">&nbsp;</td>
        <td style="padding: 1px; border-top: none; border-bottom: none;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 4px; padding-left: 10px;">2. Peristiwa Penting</td>
        <td style="text-align: center; padding: 1px;">${checkKkPeristiwaPenting}</td>
        <td style="padding: 1.5px 4px; font-weight: bold;">G &nbsp; TRANSMIGRASI</td>
        <td style="text-align: center; padding: 1px;">${checkKtpTransmigrasi}</td>
        <td style="padding: 1.5px 4px; border-top: none; border-bottom: none;">&nbsp;</td>
        <td style="padding: 1px; border-top: none; border-bottom: none;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 4px; padding-left: 10px;">3. Perubahan elemen data yang tercantum dalam KK</td>
        <td style="text-align: center; padding: 1px;">${checkKkUbahElemen}</td>
        <td style="padding: 1.5px 4px; border-bottom: none;">&nbsp;</td>
        <td style="padding: 1px; border-bottom: none;">&nbsp;</td>
        <td style="padding: 1.5px 4px; border-top: none; border-bottom: none;">&nbsp;</td>
        <td style="padding: 1px; border-top: none; border-bottom: none;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding: 2px 4px; font-weight: bold;">C. HILANG/RUSAK</td>
        <td style="text-align: center; padding: 1px;">${checkKkHilangRusak}</td>
        <td style="padding: 1.5px 4px; border-top: none; border-bottom: none;">&nbsp;</td>
        <td style="padding: 1px; border-top: none; border-bottom: none;">&nbsp;</td>
        <td style="padding: 1.5px 4px; border-top: none; border-bottom: none;">&nbsp;</td>
        <td style="padding: 1px; border-top: none; border-bottom: none;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 4px; padding-left: 10px;">1. Hilang</td>
        <td style="text-align: center; padding: 1px;">${checkKkHilang}</td>
        <td style="padding: 1.5px 4px; border-top: none; border-bottom: none;">&nbsp;</td>
        <td style="padding: 1px; border-top: none; border-bottom: none;">&nbsp;</td>
        <td style="padding: 1.5px 4px; border-top: none; border-bottom: none;">&nbsp;</td>
        <td style="padding: 1px; border-top: none; border-bottom: none;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 4px; padding-left: 10px;">2. Rusak</td>
        <td style="text-align: center; padding: 1px;">${checkKkRusak}</td>
        <td style="padding: 1.5px 4px; border-top: none;">&nbsp;</td>
        <td style="padding: 1px; border-top: none;">&nbsp;</td>
        <td style="padding: 1.5px 4px; border-top: none;">&nbsp;</td>
        <td style="padding: 1px; border-top: none;">&nbsp;</td>
      </tr>
    </tbody>
  </table>

  <div style="font-weight: bold; font-size: 8.5pt; margin-bottom: 4px;">
    III. PERSYARATAN YANG DILAMPIRKAN
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; line-height: 1.35; margin-bottom: 16px;">
    <tbody>
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 10px;">
          <div style="margin-bottom: 3px;">${circle(reqKkLama)} KK Lama/KK Rusak</div>
          <div style="margin-bottom: 3px;">${circle(reqBukuNikah)} Buku nikah/kutipan akta perkawinan</div>
          <div style="margin-bottom: 3px;">${circle(reqAktaCerai)} Kutipan akta perceraian;</div>
          <div style="margin-bottom: 3px;">${circle(reqSkpwni)} Surat Keterangan Pindah</div>
          <div style="margin-bottom: 3px;">${circle(reqPindahLn)} Surat Keterangan Pindah Luar Negeri</div>
          <div style="margin-bottom: 3px;">${circle(reqKtpRusak)} KTP-El Rusak</div>
          <div style="margin-bottom: 3px;">${circle(reqDokPerjalanan)} Dokumen Perjalanan</div>
          <div style="margin-bottom: 3px;">${circle(reqHilangPolisi)} Surat keterangan hilang dari kepolisian</div>
        </td>
        <td style="width: 50%; vertical-align: top; padding-left: 10px;">
          <div style="margin-bottom: 3px;">${circle(reqBuktiUbah)} Surat keterangan/bukti perubahan Peristiwa Kependudukan dan Peristiwa Penting</div>
          <div style="margin-bottom: 3px;">${circle(reqSptjmNikah)} SPTJM perkawinan/perceraian belum tercatat</div>
          <div style="margin-bottom: 3px;">${circle(reqAktaKematian)} Akta Kematian</div>
          <div style="margin-bottom: 3px;">${circle(reqSuketHilangRusak)} Surat pernyataan penyebab terjadinya hilang atau rusak</div>
          <div style="margin-bottom: 3px;">${circle(reqPindahPerwakilan)} Surat Keterangan Pindah dari Perwakilan RI</div>
          <div style="margin-bottom: 3px;">${circle(reqTerimaKeluarga)} Surat pernyataan bersedia menerima sebagai anggota keluarga</div>
          <div style="margin-bottom: 3px;">${circle(reqKuasaAnak)} Surat kuasa pengasuhan anak dari orang tua/wali</div>
          <div style="margin-bottom: 3px;">${circle(reqItap)} Kartu izin tinggal tetap;</div>
        </td>
      </tr>
    </tbody>
  </table>

  <div style="text-align: right; margin-bottom: 4px; font-size: 8.5pt;">
    ${tglCetak}
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; text-align: center;">
    <tbody>
      <tr>
        <td style="width: 45%; vertical-align: top;">
          Petugas,
          <div style="height: 50px;"></div>
          [ ${namaPamong} ]
        </td>
        <td style="width: 10%;"></td>
        <td style="width: 45%; vertical-align: top;">
          Pemohon,
          <div style="height: 50px;"></div>
          (&nbsp;${namaPemohon}&nbsp;)
        </td>
      </tr>
    </tbody>
  </table>
</div>`;
}
