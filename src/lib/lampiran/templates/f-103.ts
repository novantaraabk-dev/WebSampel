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

export function buildF103PortraitHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const fValues = ctx?.formValues || {};

  const noKk = vIndividu?.no_kk || fValues['form_no_kk'] || fValues['no_kk'] || '';
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

  const square = (checked: boolean) =>
    `<span style="display:inline-block;width:10px;height:10px;border:1px solid #000;text-align:center;line-height:8px;font-size:7pt;margin-right:4px;vertical-align:middle;background:#fff;font-family:Arial,sans-serif;">${checked ? '&#10003;' : '&nbsp;'}</span>`;

  const formJenisPermohonan = (fValues['form_jenis_permohonan_pindah'] || fValues['jenis_permohonan'] || '').toLowerCase();
  const isSuketKependudukan = formJenisPermohonan.includes('kependudukan');
  const isSkp = !isSuketKependudukan && !formJenisPermohonan.includes('luar negeri') && !formJenisPermohonan.includes('tempat tinggal');
  const isSkpln = formJenisPermohonan.includes('luar negeri') || formJenisPermohonan.includes('skpln');
  const isSktt = formJenisPermohonan.includes('tempat tinggal') || formJenisPermohonan.includes('sktt');

  const noHp = (vIndividu as any)?.telepon || fValues['form_telepon'] || fValues['telepon'] || fValues['form_hp'] || fValues['phone'] || '';
  const email = (vIndividu as any)?.email || fValues['form_email'] || fValues['email'] || '';

  const alamatAsal = toTitleCaseIndonesian(vIndividu?.alamat || fValues['currentAddressStreet'] || '');
  const dsnAsal = toTitleCaseIndonesian(vIndividu?.dusun || fValues['currentAddressDusun'] || '');
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

  const klasifikasiRaw = (fValues['form_klasifikasi_pindah'] || fValues['klasifikasi_pindah'] || fValues['klasifikasiPindah'] || '').toLowerCase();
  const k1 = klasifikasiRaw.includes('satu desa') || klasifikasiRaw.startsWith('1');
  const k2 = klasifikasiRaw.includes('antar desa') || klasifikasiRaw.startsWith('2');
  const k3 = klasifikasiRaw.includes('antar kec') || klasifikasiRaw.startsWith('3');
  const k4 = klasifikasiRaw.includes('antar kab') || klasifikasiRaw.startsWith('4');
  const k5 = klasifikasiRaw.includes('antar prov') || klasifikasiRaw.startsWith('5') || (!k1 && !k2 && !k3 && !k4);

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

  const alasanRaw = (fValues['form_alasan_pindah'] || fValues['alasan_pindah'] || fValues['alasanPindah'] || fValues['purpose'] || '').toLowerCase();
  const aPekerjaan = alasanRaw.includes('kerja') || alasanRaw.startsWith('1');
  const aPendidikan = alasanRaw.includes('didik') || alasanRaw.includes('sekolah') || alasanRaw.startsWith('2');
  const aKeamanan = alasanRaw.includes('aman') || alasanRaw.startsWith('3');
  const aKesehatan = alasanRaw.includes('sehat') || alasanRaw.startsWith('4');
  const aPerumahan = alasanRaw.includes('rumah') || alasanRaw.startsWith('5');
  const aKeluarga = alasanRaw.includes('keluarga') || alasanRaw.startsWith('6') || (!aPekerjaan && !aPendidikan && !aKeamanan && !aKesehatan && !aPerumahan);
  const aLainnya = alasanRaw.includes('lain') || alasanRaw.startsWith('7');
  const ketLainnya = aLainnya ? (fValues['form_alasan_pindah_lainnya'] || '') : '';

  const jenisKepindahanRaw = (fValues['form_jenis_kepindahan'] || fValues['jenis_kepindahan'] || fValues['jenisKepindahan'] || '').toLowerCase();
  const jKk = jenisKepindahanRaw === 'kepala keluarga' || jenisKepindahanRaw.startsWith('1');
  const jKkSemua = jenisKepindahanRaw.includes('seluruh') || jenisKepindahanRaw.startsWith('2');
  const jKkSebagian = jenisKepindahanRaw.includes('sebagian') || jenisKepindahanRaw.startsWith('3');
  const jAnggota = (jenisKepindahanRaw.includes('anggota keluarga') && !jKkSemua && !jKkSebagian) || jenisKepindahanRaw.startsWith('4') || (!jKk && !jKkSemua && !jKkSebagian);

  const tdkPindahRaw = (fValues['form_status_kk_tidak_pindah'] || fValues['status_kk_tidak_pindah'] || fValues['statusKkTidakPindah'] || '').toLowerCase();
  const tpNumpang = tdkPindahRaw.includes('numpang') || tdkPindahRaw.startsWith('1');
  const tpKkBaru = tdkPindahRaw.includes('baru') || tdkPindahRaw.startsWith('2') || (!tpNumpang);

  const pPindahRaw = (fValues['form_status_kk_pindah'] || fValues['status_kk_pindah'] || fValues['statusKkPindah'] || '').toLowerCase();
  const pNumpang = pPindahRaw.includes('numpang') || pPindahRaw.startsWith('1');
  const pKkBaru = pPindahRaw.includes('baru') || pPindahRaw.startsWith('2') || (!pNumpang);

  const rawMembers = ctx?.familyMembers && ctx.familyMembers.length > 0 ? ctx.familyMembers : [];
  const membersList = rawMembers.length > 0
    ? rawMembers.map((m: any) => ({
      nik: m.nik || '',
      nama: toTitleCaseIndonesian(m.nama || m.name || ''),
      shdk: toTitleCaseIndonesian(m.shdk || m.relationship || m.hubungan || 'Kepala Keluarga'),
    }))
    : (namaPemohon ? [{ nik: nikPemohon, nama: namaPemohon, shdk: 'Kepala Keluarga' }] : []);

  const tglTtd = ctx?.tanggalSurat || '........................ 20.....';
  const kotaTtd = ctx?.namaDesa || 'Sampeldes';

  return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 7.3pt; line-height: 1.18; color: #000; width: 100%; box-sizing: border-box;">
  <!-- HEADER -->
  <div style="position: relative; margin-bottom: 2px;">
    <div style="float: right; border: 1.5px solid #000; padding: 2px 14px; font-weight: bold; font-size: 11pt; font-family: Arial, sans-serif; background: #fff;">F1.03</div>
    <div style="text-align: center; font-weight: bold; font-size: 11pt; padding-top: 2px; letter-spacing: 0.3px;">
      FORMULIR PENDAFTARAN PERPINDAHAN PENDUDUK
    </div>
    <div style="clear: both;"></div>
  </div>

  <div style="font-size: 7pt; margin-bottom: 4px; line-height: 1.2;">
    <strong>Perhatian:</strong><br/>
    Harap diisi dengan huruf cetak dan menggunakan tinta hitam
  </div>

  <!-- BAGIAN 1 - 4 -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 3px; font-size: 7.3pt;">
    <tbody>
      <tr>
        <td style="width: 130px; vertical-align: middle; padding: 1px 0;">1. No KK</td>
        <td style="width: 12px; vertical-align: middle; text-align: center;">:</td>
        <td style="border: 1px solid #000; padding: 1.5px 6px; font-family: monospace; font-weight: bold; font-size: 8pt; letter-spacing: 1px; background: #fff;">
          ${noKk || '&nbsp;'}
        </td>
      </tr>
      <tr>
        <td style="vertical-align: middle; padding: 1px 0;">2. Nama Lengkap Pemoh</td>
        <td style="vertical-align: middle; text-align: center;">:</td>
        <td style="border: 1px solid #000; padding: 1.5px 6px; font-weight: bold; background: #fff;">
          ${namaPemohon || '&nbsp;'}
        </td>
      </tr>
      <tr>
        <td style="vertical-align: middle; padding: 1px 0;">3. NIK</td>
        <td style="vertical-align: middle; text-align: center;">:</td>
        <td style="border: 1px solid #000; padding: 1.5px 6px; font-family: monospace; font-weight: bold; font-size: 8pt; letter-spacing: 1px; background: #fff;">
          ${nikPemohon || '&nbsp;'}
        </td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">4. Jenis Permohonan</td>
        <td style="vertical-align: top; text-align: center; padding: 2px 0;">:</td>
        <td style="padding: 1px 0;">
          <div style="margin-bottom: 1.5px;">${square(isSuketKependudukan)} SURAT KETERANGAN KEPENDUDUKAN</div>
          <div style="margin-bottom: 1.5px;">${square(isSkp)} Surat Keterangan Pindah</div>
          <div style="margin-bottom: 1.5px;">${square(isSkpln)} Surat Keterangan Pindah Luar Negeri (SKPLN)</div>
          <div style="margin-bottom: 1px;">${square(isSktt)} Surat Keterangan Tempat Tinggal (SKTT)</div>
          <div style="padding-left: 16px; font-size: 6.8pt; color: #222; margin-bottom: 3px;">Bagi Orang Asing Tinggal Terbatas</div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 7.2pt;">
            <tr>
              <td style="width: 110px; vertical-align: middle;">Nomor Handphone :</td>
              <td style="width: 160px; border: 1px solid #000; padding: 1px 5px; font-family: monospace; background: #fff;">${noHp || '&nbsp;'}</td>
              <td style="width: 15px;"></td>
              <td style="width: 50px; vertical-align: middle;">Email :</td>
              <td style="border: 1px solid #000; padding: 1px 5px; background: #fff;">${email || '&nbsp;'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN 5: ALAMAT ASAL -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 3px; font-size: 7.3pt;">
    <tbody>
      <tr>
        <td style="width: 130px; vertical-align: top; padding: 1px 0;">5. Alamat asal</td>
        <td style="width: 12px; vertical-align: top; text-align: center; padding: 1px 0;">:</td>
        <td style="padding: 0;">
          <div style="border: 1px solid #000; padding: 1.5px 5px; margin-bottom: 2px; min-height: 13px; background: #fff;">${alamatAsal || '&nbsp;'}</div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 7.2pt; margin-bottom: 2px;">
            <tr>
              <td style="width: 70px;">Dsn/Lingk.</td>
              <td style="border: 1px solid #000; padding: 1px 4px; background: #fff;">${dsnAsal || '&nbsp;'}</td>
              <td style="width: 10px;"></td>
              <td style="width: 25px; text-align: right; padding-right: 4px;">RT</td>
              <td style="width: 45px; border: 1px solid #000; padding: 1px 4px; text-align: center; font-family: monospace; background: #fff;">${rtAsal || '&nbsp;'}</td>
              <td style="width: 10px;"></td>
              <td style="width: 25px; text-align: right; padding-right: 4px;">RW</td>
              <td style="width: 45px; border: 1px solid #000; padding: 1px 4px; text-align: center; font-family: monospace; background: #fff;">${rwAsal || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 7.2pt; margin-bottom: 2px;">
            <tr>
              <td style="width: 70px;">a. Desa/Kel.</td>
              <td style="width: 42%; border: 1px solid #000; padding: 1px 4px; background: #fff;">${desaAsal || '&nbsp;'}</td>
              <td style="width: 10px;"></td>
              <td style="width: 75px;">b. Kecamatan</td>
              <td style="border: 1px solid #000; padding: 1px 4px; background: #fff;">${kecAsal || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 7.2pt; margin-bottom: 2px;">
            <tr>
              <td style="width: 70px;">c. Kab./Kota</td>
              <td style="width: 42%; border: 1px solid #000; padding: 1px 4px; background: #fff;">${kabAsal || '&nbsp;'}</td>
              <td style="width: 10px;"></td>
              <td style="width: 75px;">d. Provinsi</td>
              <td style="border: 1px solid #000; padding: 1px 4px; background: #fff;">${provAsal || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 7.2pt;">
            <tr>
              <td style="width: 70px;">Kode Pos</td>
              <td style="width: 80px; border: 1px solid #000; padding: 1px 4px; font-family: monospace; text-align: center; background: #fff;">${kodePosAsal || '&nbsp;'}</td>
              <td></td>
            </tr>
          </table>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN 6: KLASIFIKASI KEPINDAHAN -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 3px; font-size: 7.3pt;">
    <tbody>
      <tr>
        <td style="width: 130px; vertical-align: top; padding: 1px 0;">6. Klasifikasi Kepindahan</td>
        <td style="width: 12px; vertical-align: top; text-align: center; padding: 1px 0;">:</td>
        <td style="padding: 0;">
          <div style="margin-bottom: 1.5px;">${square(k1)} Dalam satu desa/ Kelurahan atau yang disebut dengan nama lain</div>
          <div style="margin-bottom: 1.5px;">${square(k2)} Antar desa/kelurahan atau yang disebut dengan nama lain dalam satu kecamatan</div>
          <div style="margin-bottom: 1.5px;">${square(k3)} Antar kecamatan atau yang disebut dengan nama lain dalam satu kabupaten/kota;</div>
          <div style="margin-bottom: 1.5px;">${square(k4)} Antar kabupaten/kota dalam satu provinsi</div>
          <div>${square(k5)} Antar provinsi</div>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN 7: ALAMAT PINDAH -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 3px; font-size: 7.3pt;">
    <tbody>
      <tr>
        <td style="width: 130px; vertical-align: top; padding: 1px 0;">7. Alamat Pindah</td>
        <td style="width: 12px; vertical-align: top; text-align: center; padding: 1px 0;">:</td>
        <td style="padding: 0;">
          <div style="border: 1px solid #000; padding: 1.5px 5px; margin-bottom: 2px; min-height: 13px; background: #fff;">${alamatPindah || '&nbsp;'}</div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 7.2pt; margin-bottom: 2px;">
            <tr>
              <td style="width: 70px;">Dsn/Lingk.</td>
              <td style="border: 1px solid #000; padding: 1px 4px; background: #fff;">${dsnPindah || '&nbsp;'}</td>
              <td style="width: 10px;"></td>
              <td style="width: 25px; text-align: right; padding-right: 4px;">RT</td>
              <td style="width: 45px; border: 1px solid #000; padding: 1px 4px; text-align: center; font-family: monospace; background: #fff;">${rtPindah || '&nbsp;'}</td>
              <td style="width: 10px;"></td>
              <td style="width: 25px; text-align: right; padding-right: 4px;">RW</td>
              <td style="width: 45px; border: 1px solid #000; padding: 1px 4px; text-align: center; font-family: monospace; background: #fff;">${rwPindah || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 7.2pt; margin-bottom: 2px;">
            <tr>
              <td style="width: 70px;">a. Desa/Kel.</td>
              <td style="width: 42%; border: 1px solid #000; padding: 1px 4px; background: #fff;">${desaPindah || '&nbsp;'}</td>
              <td style="width: 10px;"></td>
              <td style="width: 75px;">b. Kecamatan</td>
              <td style="border: 1px solid #000; padding: 1px 4px; background: #fff;">${kecPindah || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 7.2pt; margin-bottom: 2px;">
            <tr>
              <td style="width: 70px;">c. Kab./Kota</td>
              <td style="width: 42%; border: 1px solid #000; padding: 1px 4px; background: #fff;">${kabPindah || '&nbsp;'}</td>
              <td style="width: 10px;"></td>
              <td style="width: 75px;">d. Provinsi</td>
              <td style="border: 1px solid #000; padding: 1px 4px; background: #fff;">${provPindah || '&nbsp;'}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 7.2pt;">
            <tr>
              <td style="width: 70px;">Kode Pos</td>
              <td style="width: 80px; border: 1px solid #000; padding: 1px 4px; font-family: monospace; text-align: center; background: #fff;">${kodePosPindah || '&nbsp;'}</td>
              <td></td>
            </tr>
          </table>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN 8: ALASAN PINDAH -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 3px; font-size: 7.3pt;">
    <tbody>
      <tr>
        <td style="width: 130px; vertical-align: top; padding: 1px 0;">8. Alasan Pindah</td>
        <td style="width: 12px; vertical-align: top; text-align: center; padding: 1px 0;">:</td>
        <td style="padding: 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 7.2pt;">
            <tr>
              <td style="width: 25%; padding: 1px 0;">${square(aPekerjaan)} Pekerjaan</td>
              <td style="width: 25%; padding: 1px 0;">${square(aKeamanan)} Keamanan</td>
              <td style="width: 25%; padding: 1px 0;">${square(aPerumahan)} Perumahan</td>
              <td style="width: 25%; padding: 1px 0;">${square(aLainnya)} Lainnya (Sebutkan)</td>
            </tr>
            <tr>
              <td style="padding: 1px 0;">${square(aPendidikan)} Pendidikan</td>
              <td style="padding: 1px 0;">${square(aKesehatan)} Kesehatan</td>
              <td style="padding: 1px 0;">${square(aKeluarga)} Keluarga</td>
              <td style="padding: 1px 0; border-bottom: 1px dotted #000; font-style: italic;">${ketLainnya || '&nbsp;'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN 9: JENIS KEPINDAHAN -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 3px; font-size: 7.3pt;">
    <tbody>
      <tr>
        <td style="width: 130px; vertical-align: top; padding: 1px 0;">9. Jenis Kepindahan</td>
        <td style="width: 12px; vertical-align: top; text-align: center; padding: 1px 0;">:</td>
        <td style="padding: 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 7.2pt;">
            <tr>
              <td style="width: 50%; padding: 1px 0;">${square(jKk)} Kepala Keluarga</td>
              <td style="width: 50%; padding: 1px 0;">${square(jKkSebagian)} Kepala Keluarga dan Sebagaian Anggota keluarga</td>
            </tr>
            <tr>
              <td style="padding: 1px 0;">${square(jKkSemua)} Kepala Keluarga dan Seluruh Anggota Keluarga</td>
              <td style="padding: 1px 0;">${square(jAnggota)} Anggota Keluarga</td>
            </tr>
          </table>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN 10 & 11: STATUS KK -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 3px; font-size: 7.3pt;">
    <tbody>
      <tr>
        <td style="width: 130px; vertical-align: top; padding: 1px 0;">10. Anggota Keluarga yang Tidak Pindah</td>
        <td style="width: 12px; vertical-align: top; text-align: center; padding: 1px 0;">:</td>
        <td style="padding: 1px 0;">
          ${square(tpNumpang)} Numpang KK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${square(tpKkBaru)} Membuat KK Baru
        </td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">11. Anggota Keluarga yang Pindah</td>
        <td style="vertical-align: top; text-align: center; padding: 1px 0;">:</td>
        <td style="padding: 1px 0;">
          ${square(pNumpang)} Numpang KK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${square(pKkBaru)} Membuat KK Baru
        </td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN 12: DAFTAR ANGGOTA KELUARGA YANG PINDAH -->
  <div style="font-weight: normal; font-size: 7.3pt; margin-top: 2px; margin-bottom: 2px;">
    12. Daftar Anggota Keluarga yang Pind:
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 7.2pt; margin-bottom: 4px; border: 1px solid #000;" border="1">
    <thead>
      <tr style="background: #e5e7eb; font-weight: bold; text-align: center;">
        <th style="padding: 2px; width: 6%; border: 1px solid #000;">NO</th>
        <th style="padding: 2px; width: 34%; border: 1px solid #000;">NIK</th>
        <th style="padding: 2px; width: 44%; border: 1px solid #000;">NAMA LENGKAP</th>
        <th style="padding: 2px; width: 16%; border: 1px solid #000;">SHDK</th>
      </tr>
    </thead>
    <tbody>
      ${[1, 2, 3, 4, 5]
      .map((idx) => {
        const m = membersList[idx - 1];
        const noVal = idx;
        const nikVal = m ? (m.nik || '') : '';
        const namaVal = m ? (m.nama || '') : '';
        const shdkVal = m ? ((m as any).shdk || (m as any).hubungan || '') : '';
        return `<tr style="height: 15px;">
            <td style="border: 1px solid #000; text-align: center; padding: 1px;">${noVal}</td>
            <td style="border: 1px solid #000; padding: 1px 4px; font-family: monospace; font-size: 7.5pt;">${nikVal}</td>
            <td style="border: 1px solid #000; padding: 1px 4px; font-weight: ${m ? 'bold' : 'normal'};">${namaVal}</td>
            <td style="border: 1px solid #000; text-align: center; padding: 1px 2px;">${shdkVal}</td>
          </tr>`;
      })
      .join('')}
    </tbody>
  </table>

  <!-- SUB-BAGIAN ORANG ASING (13 - 16) -->
  <div style="font-size: 6.8pt; font-weight: bold; margin-top: 3px; margin-bottom: 2px; line-height: 1.2;">
    Diisi oleh Penduduk (Orang Asing) Pemegang ITAS yg Mengajukan SKTT dan OA Pemegang ITAP yg Mengajukan Surat Keterangan Kependudukan Lainnya
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 3px; font-size: 7.2pt;">
    <tbody>
      <tr>
        <td style="width: 130px; vertical-align: middle; padding: 1px 0;">13. Nama Sponsor</td>
        <td style="width: 12px; vertical-align: middle; text-align: center;">:</td>
        <td style="border: 1px solid #000; padding: 1px 4px; height: 13px; background: #fff;">&nbsp;</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">14. Tipe Sponsor</td>
        <td style="vertical-align: top; text-align: center;">:</td>
        <td style="padding: 1px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 7.2pt;">
            <tr>
              <td style="width: 33%; padding: 1px 0;">${square(false)} Organisasi Internasional</td>
              <td style="width: 33%; padding: 1px 0;">${square(false)} Pemerintah</td>
              <td style="width: 34%; padding: 1px 0;">${square(false)} Perusahaan</td>
            </tr>
            <tr>
              <td style="padding: 1px 0;">${square(false)} Perorangan</td>
              <td style="padding: 1px 0;" colspan="2">${square(false)} Tanpa Sponsor</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="vertical-align: middle; padding: 1px 0;">15. Alamat Sponsor</td>
        <td style="vertical-align: middle; text-align: center;">:</td>
        <td style="border: 1px solid #000; padding: 1px 4px; height: 13px; background: #fff;">&nbsp;</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">16. Nomor dan Tanggal KITAS &amp; KITAP</td>
        <td style="vertical-align: top; text-align: center;">:</td>
        <td style="padding: 1px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 6.8pt;">
            <tr>
              <td style="width: 45%; border: 1px solid #000; height: 13px; background: #fff;">&nbsp;</td>
              <td style="width: 10%;"></td>
              <td style="width: 45%; border: 1px solid #000; height: 13px; background: #fff;">&nbsp;</td>
            </tr>
            <tr>
              <td style="text-align: center; padding-top: 1px;">Nomor</td>
              <td></td>
              <td style="text-align: center; padding-top: 1px;">Tanggal Masa Berlaku</td>
            </tr>
          </table>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- SUB-BAGIAN PINDAH LUAR NEGERI (17 - 20) -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 2px; margin-bottom: 2px; font-size: 6.8pt;">
    <tr>
      <td style="font-weight: bold; line-height: 1.2;">
        Diisi oleh Penduduk yang Mengajukan Surat Keterangan Pindah Luar Negeri
      </td>
      <td style="width: 80px; text-align: right; padding-right: 4px;">Kode Negara</td>
      <td style="width: 60px; border: 1px solid #000; height: 13px; background: #fff;">&nbsp;</td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 7.2pt;">
    <tbody>
      <tr>
        <td style="width: 130px; vertical-align: middle; padding: 1px 0;">17. Negara Tujuan</td>
        <td style="width: 12px; vertical-align: middle; text-align: center;">:</td>
        <td style="border: 1px solid #000; padding: 1px 4px; height: 13px; background: #fff;">&nbsp;</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 1px 0;">18 Alamat Tujuan</td>
        <td style="vertical-align: top; text-align: center;">:</td>
        <td style="padding: 0;">
          <div style="border: 1px solid #000; height: 13px; margin-bottom: 2px; background: #fff;">&nbsp;</div>
          <div style="border: 1px solid #000; height: 13px; background: #fff;">&nbsp;</div>
        </td>
      </tr>
      <tr>
        <td style="vertical-align: middle; padding: 1px 0;">19. Penanggung Jawab</td>
        <td style="vertical-align: middle; text-align: center;">:</td>
        <td style="border: 1px solid #000; padding: 1px 4px; height: 13px; background: #fff;">&nbsp;</td>
      </tr>
      <tr>
        <td style="vertical-align: middle; padding: 1px 0;">20. Rencana Pindah tgl</td>
        <td style="vertical-align: middle; text-align: center;">:</td>
        <td style="padding: 1px 0;">
          <table style="border-collapse: collapse; font-size: 7.2pt;">
            <tr>
              <td style="padding-right: 4px;">Tgl</td>
              <td style="width: 35px; border: 1px solid #000; height: 13px; text-align: center; background: #fff;">&nbsp;</td>
              <td style="padding: 0 4px 0 10px;">Bln</td>
              <td style="width: 35px; border: 1px solid #000; height: 13px; text-align: center; background: #fff;">&nbsp;</td>
              <td style="padding: 0 4px 0 10px;">Thn</td>
              <td style="width: 55px; border: 1px solid #000; height: 13px; text-align: center; background: #fff;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- TANDA TANGAN PEMOHON -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 7.5pt;">
    <tr>
      <td style="width: 55%;"></td>
      <td style="width: 45%; text-align: center; vertical-align: top;">
        <div>${kotaTtd}, ${tglTtd}</div>
        <div style="font-weight: bold; margin-top: 2px;">Pemohon</div>
        <div style="height: 38px;"></div>
        <div>(&nbsp;<strong><u>${namaPemohon || '...............................................................'}</u></strong>&nbsp;)</div>
      </td>
    </tr>
  </table>
</div>`;
}
