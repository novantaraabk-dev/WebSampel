import type { OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildF106PortraitHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};

  const namaPemohon = vIndividu?.nama || fValues['form_nama'] || fValues['nama'] || '';
  const nikPemohon = vIndividu?.nik || fValues['form_nik'] || fValues['nik'] || '';
  const noKk = vIndividu?.no_kk || fValues['form_no_kk'] || fValues['no_kk'] || '';

  let alamatRumah = vIndividu?.alamat || '';
  if (vIndividu?.rt || vIndividu?.rw) {
    alamatRumah += (alamatRumah ? ', ' : '') + `RT ${vIndividu?.rt || '00'} / RW ${vIndividu?.rw || '00'}`;
  }
  if (ctx?.namaDesa) {
    alamatRumah += (alamatRumah ? ', ' : '') + `Desa ${ctx.namaDesa}`;
  }
  if (ctx?.namaKecamatan) {
    alamatRumah += `, Kec. ${ctx.namaKecamatan}`;
  }

  const rawMembers = ctx?.familyMembers && ctx.familyMembers.length > 0 ? ctx.familyMembers : [];
  const membersList = rawMembers.length > 0 ? rawMembers : (namaPemohon ? [{ nik: nikPemohon, nama: namaPemohon, shdk: 'KEPALA KELUARGA' }] : []);

  const tglTtd = ctx?.tanggalSurat || '................................ 20.........';
  const kotaTtd = ctx?.namaDesa || 'Sampeldes';

  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 7.6pt; line-height: 1.22; color: #000; width: 100%; box-sizing: border-box;">
  <!-- HEADER -->
  <div style="text-align: right; margin-bottom: 2px;">
    <span style="border: 1.5px solid #000; padding: 2px 14px; font-weight: bold; font-size: 11pt; font-family: Arial, sans-serif; display: inline-block;">F 1.06</span>
  </div>

  <div style="text-align: center; font-weight: bold; font-size: 10.5pt; margin-bottom: 10px; letter-spacing: 0.3px;">
    SURAT PERNYATAAN PERUBAHAN ELEMEN DATA KEPENDUDUKAN
  </div>

  <div style="margin-bottom: 4px;">Yang bertanda tangan di bawah ini :</div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 7.6pt;">
    <tbody>
      <tr>
        <td style="width: 120px; padding: 1.5px 0;">Nama Lengkap</td>
        <td style="width: 15px; text-align: center;">:</td>
        <td style="border-bottom: 1px dotted #000; font-weight: bold; padding: 1.5px 4px;">${namaPemohon || '&nbsp;'}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">NIK</td>
        <td style="text-align: center;">:</td>
        <td style="border-bottom: 1px dotted #000; font-family: monospace; font-size: 8pt; font-weight: bold; padding: 1.5px 4px;">${nikPemohon || '&nbsp;'}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">Nomor KK</td>
        <td style="text-align: center;">:</td>
        <td style="border-bottom: 1px dotted #000; font-family: monospace; font-size: 8pt; font-weight: bold; padding: 1.5px 4px;">${noKk || '&nbsp;'}</td>
      </tr>
      <tr>
        <td style="padding: 1.5px 0;">Alamat rumah</td>
        <td style="text-align: center;">:</td>
        <td style="border-bottom: 1px dotted #000; padding: 1.5px 4px;">${alamatRumah || '&nbsp;'}</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-bottom: 3px;">Dengan rincian KK sebagai berikut :</div>

  <!-- TABEL 1: RINCIAN KK -->
  <table style="width: 100%; border-collapse: collapse; font-size: 7.3pt; margin-bottom: 6px; border: 1px solid #000;" border="1">
    <thead>
      <tr style="text-align: center; font-weight: bold; height: 18px;">
        <th style="border: 1px solid #000; width: 6%; padding: 2px;">NO</th>
        <th style="border: 1px solid #000; width: 34%; padding: 2px;">Nama</th>
        <th style="border: 1px solid #000; width: 26%; padding: 2px;">NIK</th>
        <th style="border: 1px solid #000; width: 16%; padding: 2px;">SHDK</th>
        <th style="border: 1px solid #000; width: 18%; padding: 2px;">Keterangan</th>
      </tr>
    </thead>
    <tbody>
      ${[1, 2, 3, 4, 5, 6, 7]
      .map((idx) => {
        const m = membersList[idx - 1];
        return `<tr style="height: 15px;">
            <td style="border: 1px solid #000; text-align: center; padding: 1px;">${idx}.</td>
            <td style="border: 1px solid #000; padding: 1px 4px; font-weight: ${m ? 'bold' : 'normal'};">${m ? m.nama : '&nbsp;'}</td>
            <td style="border: 1px solid #000; padding: 1px 4px; font-family: monospace; text-align: center;">${m ? m.nik : '&nbsp;'}</td>
            <td style="border: 1px solid #000; padding: 1px 4px; text-align: center;">${m ? (m.shdk || m.hubungan || '') : '&nbsp;'}</td>
            <td style="border: 1px solid #000; padding: 1px 4px;">${m ? (idx === 1 ? 'Pemohon' : '') : '&nbsp;'}</td>
          </tr>`;
      })
      .join('')}
    </tbody>
  </table>

  <div style="margin-bottom: 2px;">
    Menyatakan bahwa data elemen data kependudukan saya anggota sekeluarga saya telah berubah,<br/>
    Dengan rincian :
  </div>

  <!-- BAGIAN A: PENDIDIKAN DAN PEKERJAAN -->
  <div style="margin-bottom: 2px; font-weight: normal;">A. Pendidikan dan Pekerjaan :</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 7.1pt; margin-bottom: 6px; border: 1px solid #000;" border="1">
    <thead>
      <tr style="text-align: center; font-weight: bold;">
        <th rowspan="3" style="border: 1px solid #000; width: 5%; padding: 2px;">No</th>
        <th colspan="6" style="border: 1px solid #000; padding: 2px;">Elemen Data</th>
        <th rowspan="3" style="border: 1px solid #000; width: 16%; padding: 2px;">Keterangan</th>
      </tr>
      <tr style="text-align: center; font-weight: bold;">
        <th colspan="3" style="border: 1px solid #000; padding: 2px; width: 39%;">Pendidikan terakhir</th>
        <th colspan="3" style="border: 1px solid #000; padding: 2px; width: 40%;">Pekerjaan</th>
      </tr>
      <tr style="text-align: center; font-weight: bold;">
        <th style="border: 1px solid #000; padding: 2px; width: 13%;">Semula</th>
        <th style="border: 1px solid #000; padding: 2px; width: 13%;">Menjadi</th>
        <th style="border: 1px solid #000; padding: 2px; width: 13%;">Dasar<br/>Perubahan</th>
        <th style="border: 1px solid #000; padding: 2px; width: 13%;">Semula</th>
        <th style="border: 1px solid #000; padding: 2px; width: 13%;">Menjadi</th>
        <th style="border: 1px solid #000; padding: 2px; width: 14%;">Dasar<br/>Perubahan</th>
      </tr>
    </thead>
    <tbody>
      ${[1, 2, 3, 4, 5, 6, 7]
      .map((idx) => {
        return `<tr style="height: 15px;">
            <td style="border: 1px solid #000; text-align: center; padding: 1px;">${idx}.</td>
            <td style="border: 1px solid #000; padding: 1px 3px;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 1px 3px;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 1px 3px;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 1px 3px;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 1px 3px;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 1px 3px;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 1px 3px;">&nbsp;</td>
          </tr>`;
      })
      .join('')}
    </tbody>
  </table>

  <!-- BAGIAN B: AGAMA DAN PERUBAHAN LAINNYA -->
  <div style="margin-bottom: 2px; font-weight: normal;">B. Agama dan perubahan Lainnya</div>
  <table style="width: 100%; border-collapse: collapse; font-size: 7.1pt; margin-bottom: 6px; border: 1px solid #000;" border="1">
    <thead>
      <tr style="text-align: center; font-weight: bold;">
        <th rowspan="3" style="border: 1px solid #000; width: 5%; padding: 2px;">No</th>
        <th colspan="6" style="border: 1px solid #000; padding: 2px;">Elemen Data</th>
        <th rowspan="3" style="border: 1px solid #000; width: 16%; padding: 2px;">Keterangan</th>
      </tr>
      <tr style="text-align: center; font-weight: bold;">
        <th colspan="3" style="border: 1px solid #000; padding: 2px; width: 39%;">Agama</th>
        <th colspan="3" style="border: 1px solid #000; padding: 2px; width: 40%;">Lainnya, yaitu..........................................*)</th>
      </tr>
      <tr style="text-align: center; font-weight: bold;">
        <th style="border: 1px solid #000; padding: 2px; width: 13%;">Semula</th>
        <th style="border: 1px solid #000; padding: 2px; width: 13%;">Menjadi</th>
        <th style="border: 1px solid #000; padding: 2px; width: 13%;">Dasar<br/>Perubahan</th>
        <th style="border: 1px solid #000; padding: 2px; width: 13%;">Semula</th>
        <th style="border: 1px solid #000; padding: 2px; width: 13%;">Menjadi</th>
        <th style="border: 1px solid #000; padding: 2px; width: 14%;">Dasar<br/>Perubahan</th>
      </tr>
    </thead>
    <tbody>
      ${[1, 2, 3, 4, 5, 6, 7]
      .map((idx) => {
        return `<tr style="height: 15px;">
            <td style="border: 1px solid #000; text-align: center; padding: 1px;">${idx}.</td>
            <td style="border: 1px solid #000; padding: 1px 3px;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 1px 3px;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 1px 3px;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 1px 3px;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 1px 3px;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 1px 3px;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 1px 3px;">&nbsp;</td>
          </tr>`;
      })
      .join('')}
    </tbody>
  </table>

  <!-- KETERANGAN PENUTUP -->
  <div style="font-size: 7.3pt; margin-bottom: 4px;">
    Terlampir disampaikan fotokopi berkas-berkas yang terkait dengan perubahan elemen data tersebut.
  </div>

  <div style="text-align: justify; font-size: 7.3pt; margin-bottom: 8px; line-height: 1.25;">
    Demikian Surat Pernyataan ini saya buat dengan sebenarnya, apabila daam keterangan yang saya berikan terdapat hal-hal yang tidak berdasarkan keadaan yang sebenarnya, saya bersedia dikenakan sanksi sesuaiketentuan peraturan perundangan-undangan yang berlaku.
  </div>

  <!-- TANDA TANGAN -->
  <table style="width: 100%; border-collapse: collapse; font-size: 7.6pt; margin-bottom: 8px;">
    <tr>
      <td style="width: 55%;"></td>
      <td style="width: 45%; text-align: center; vertical-align: top;">
        <div>${kotaTtd}, ${tglTtd}</div>
        <div style="margin-top: 2px; font-weight: normal;">Yang membuat pernyataan,</div>
        <div style="margin: 6px auto; width: 68px; height: 50px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 6.8pt; line-height: 1.2;">
          Materai<br/>Cukup
        </div>
        <div style="border-bottom: 1px solid #000; width: 170px; margin: 0 auto; min-height: 14px;">
          ${namaPemohon ? `&nbsp;${namaPemohon}&nbsp;` : '&nbsp;'}
        </div>
      </td>
    </tr>
  </table>

  <!-- CATATAN KAKI -->
  <div style="font-size: 6.8pt; line-height: 1.25;">
    <strong>Keterangan :</strong><br/>
    *) &nbsp;Perubahan lainnya ini, juga dapat digunakan untuk merubah data kependudukan yang diakibatkan adanya kesalahan pada waktu pengisian Formulir Biodata maupunkesalahan pada saat peng-entry-an biodata penduduk dimksud.
  </div>
</div>`;
}
