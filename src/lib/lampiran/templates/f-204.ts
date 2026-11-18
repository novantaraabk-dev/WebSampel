import type { OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildF204PortraitHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};

  const namaDesa = ctx?.namaDesa || 'Sampeldes';

  // Helper for value or dots
  const fillOrDots = (val?: any) => {
    const str = val !== undefined && val !== null ? String(val).trim() : '';
    if (str.length > 0) {
      return `<span style="font-weight: bold; text-transform: uppercase;">${str}</span>`;
    }
    return '............................................................................................';
  };

  // Pelapor / Yang bertanda tangan
  const namaPelapor = fValues['form_nama_pelapor'] || fValues['nama_pelapor'] || vIndividu?.nama || '';
  const nikPelapor = fValues['form_nik_pelapor'] || fValues['nik_pelapor'] || vIndividu?.nik || '';
  const ttlPelapor = (vIndividu?.tempat_lahir && vIndividu?.tanggal_lahir)
    ? `${vIndividu.tempat_lahir}, ${vIndividu.tanggal_lahir}`
    : (fValues['form_ttl_pelapor'] || '');
  const pekerjaanPelapor = vIndividu?.pekerjaan || fValues['form_pekerjaan_pelapor'] || '';
  const alamatPelapor = vIndividu?.alamat
    ? `${vIndividu.alamat}${vIndividu.rt ? ` RT ${vIndividu.rt}` : ''}${vIndividu.rw ? ` RW ${vIndividu.rw}` : ''}`
    : (fValues['form_alamat_pelapor'] || '');

  // Pihak 1 (Suami)
  const namaSuami = fValues['form_nama_suami'] || fValues['nama_suami'] || ((vIndividu?.jenis_kelamin || '').toLowerCase().includes('l') ? vIndividu?.nama : '') || namaPelapor;
  const nikSuami = fValues['form_nik_suami'] || fValues['nik_suami'] || ((vIndividu?.jenis_kelamin || '').toLowerCase().includes('l') ? vIndividu?.nik : '') || nikPelapor;
  const ttlSuami = fValues['form_ttl_suami'] || (((vIndividu?.jenis_kelamin || '').toLowerCase().includes('l')) ? ttlPelapor : '');
  const pekerjaanSuami = fValues['form_pekerjaan_suami'] || (((vIndividu?.jenis_kelamin || '').toLowerCase().includes('l')) ? pekerjaanPelapor : '');
  const alamatSuami = fValues['form_alamat_suami'] || alamatPelapor;

  // Pihak 2 (Isteri)
  const namaIstri = fValues['form_nama_istri'] || fValues['nama_istri'] || ((vIndividu?.jenis_kelamin || '').toLowerCase().includes('p') ? vIndividu?.nama : '') || '';
  const nikIstri = fValues['form_nik_istri'] || fValues['nik_istri'] || ((vIndividu?.jenis_kelamin || '').toLowerCase().includes('p') ? vIndividu?.nik : '') || '';
  const ttlIstri = fValues['form_ttl_istri'] || (((vIndividu?.jenis_kelamin || '').toLowerCase().includes('p')) ? ttlPelapor : '');
  const pekerjaanIstri = fValues['form_pekerjaan_istri'] || (((vIndividu?.jenis_kelamin || '').toLowerCase().includes('p')) ? pekerjaanPelapor : '');
  const alamatIstri = fValues['form_alamat_istri'] || alamatPelapor;

  // Nomor KK
  const noKk = vIndividu?.no_kk || fValues['form_no_kk'] || fValues['no_kk'] || '';

  // Saksi
  const namaSaksi1 = fValues['form_nama_saksi_i'] || fValues['form_nama_saksi_1'] || fValues['nama_saksi_1'] || '';
  const nikSaksi1 = fValues['form_nik_saksi_i'] || fValues['form_nik_saksi_1'] || fValues['nik_saksi_1'] || '';
  const namaSaksi2 = fValues['form_nama_saksi_ii'] || fValues['form_nama_saksi_2'] || fValues['nama_saksi_2'] || '';
  const nikSaksi2 = fValues['form_nik_saksi_ii'] || fValues['form_nik_saksi_2'] || fValues['nik_saksi_2'] || '';

  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 9.2pt; line-height: 1.35; color: #000; width: 100%; box-sizing: border-box; padding: 10px 25px;">
  <!-- KODE FORMULIR -->
  <div style="text-align: right; margin-bottom: 20px;">
    <span style="border: 1.5px solid #000; padding: 2px 14px; font-weight: bold; font-size: 10.5pt; background: #fff;">F-2.04</span>
  </div>

  <!-- JUDUL -->
  <div style="text-align: center; font-weight: bold; font-size: 11pt; line-height: 1.3; margin-bottom: 22px;">
    SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK (SPTJM)<br/>
    KEBENARAN SEBAGAI PASANGAN SUAMI ISTERI
  </div>

  <!-- BAGIAN 1: SAYA YANG BERTANDA TANGAN DI BAWAH INI -->
  <p style="margin: 0 0 4px 0;">Saya yang bertanda tangan di bawah ini :</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9.2pt;">
    <tr><td style="width: 175px; padding: 1.5px 0;">Nama</td><td style="width: 15px; text-align: center;">:</td><td>${fillOrDots(namaPelapor)}</td></tr>
    <tr><td style="padding: 1.5px 0;">NIK</td><td style="text-align: center;">:</td><td>${fillOrDots(nikPelapor)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Tempat/Tanggal Lahir</td><td style="text-align: center;">:</td><td>${fillOrDots(ttlPelapor)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Pekerjaan</td><td style="text-align: center;">:</td><td>${fillOrDots(pekerjaanPelapor)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Alamat</td><td style="text-align: center;">:</td><td>${fillOrDots(alamatPelapor)}</td></tr>
  </table>

  <!-- BAGIAN 2: MENYATAKAN BAHWA -->
  <p style="margin: 0 0 4px 0;">menyatakan bahwa :</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9.2pt;">
    <tr><td style="width: 175px; padding: 1.5px 0;">Nama</td><td style="width: 15px; text-align: center;">:</td><td>${fillOrDots(namaSuami)}</td></tr>
    <tr><td style="padding: 1.5px 0;">NIK</td><td style="text-align: center;">:</td><td>${fillOrDots(nikSuami)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Tempat/Tanggal Lahir</td><td style="text-align: center;">:</td><td>${fillOrDots(ttlSuami)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Pekerjaan</td><td style="text-align: center;">:</td><td>${fillOrDots(pekerjaanSuami)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Alamat</td><td style="text-align: center;">:</td><td>${fillOrDots(alamatSuami)}</td></tr>
  </table>

  <!-- BAGIAN 3: ADALAH SUAMI / ISTERI*) DARI -->
  <p style="margin: 0 0 4px 0;">adalah suami / isteri*) dari :</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9.2pt;">
    <tr><td style="width: 175px; padding: 1.5px 0;">Nama</td><td style="width: 15px; text-align: center;">:</td><td>${fillOrDots(namaIstri)}</td></tr>
    <tr><td style="padding: 1.5px 0;">NIK</td><td style="text-align: center;">:</td><td>${fillOrDots(nikIstri)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Tempat/Tanggal Lahir</td><td style="text-align: center;">:</td><td>${fillOrDots(ttlIstri)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Pekerjaan</td><td style="text-align: center;">:</td><td>${fillOrDots(pekerjaanIstri)}</td></tr>
    <tr><td style="padding: 1.5px 0;">Alamat</td><td style="text-align: center;">:</td><td>${fillOrDots(alamatIstri)}</td></tr>
  </table>

  <!-- BAGIAN 4: NOMOR KK -->
  <p style="margin: 0 0 16px 0;">
    sebagaimana tercantum dalam Kartu Keluarga (KK) Nomor : ${noKk ? `<strong>${noKk}</strong>` : '............................................................'}
  </p>

  <!-- PARAGRAF PENUTUP -->
  <p style="text-align: justify; line-height: 1.45; margin: 0 0 20px 0; text-indent: 0;">
    Demikian surat pernyataan ini saya buat dengan sebenar-benarnya dan apabila di kemudian hari ternyata pernyataan saya ini tidak benar, maka saya bersedia diproses secara hukum sesuai dengan peraturan perundang-undangan dan dokumen yang diterbitkan akibat dari pernyataan ini menjadi tidak sah.
  </p>

  <!-- TANDA TANGAN -->
  <table style="width: 100%; border-collapse: collapse; font-size: 9.2pt;">
    <tr>
      <td style="width: 52%; vertical-align: top;">
        Saksi I,
        <div style="height: 45px;"></div>
        ( ${namaSaksi1 ? `<strong>${namaSaksi1}</strong>` : '...................................................'} )<br/>
        NIK. ${nikSaksi1 || '...................................................'}

        <div style="height: 18px;"></div>
        Saksi II,
        <div style="height: 45px;"></div>
        ( ${namaSaksi2 ? `<strong>${namaSaksi2}</strong>` : '...................................................'} )<br/>
        NIK. ${nikSaksi2 || '...................................................'}
      </td>
      <td style="width: 48%; vertical-align: top; padding-left: 20px;">
        ${namaDesa}, .............................. 20 ....<br/>
        Saya yang menyatakan,
        <div style="height: 45px;"></div>
        ${namaPelapor ? `( <strong>${namaPelapor}</strong> )` : '......................................................'}
      </td>
    </tr>
  </table>
</div>`;
}
