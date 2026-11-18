import type { OpenSidRenderContext } from '../../opensid-surat-engine';

export function buildF101LandscapeHtml(ctx?: OpenSidRenderContext): string {
  const vIndividu = ctx?.individu;
  const rawMembers: any[] = ctx?.familyMembers || [];

  const rawKepalaKk =
    ctx?.formValues?.['[form_kepala_kk]'] ||
    ctx?.formValues?.['form_kepala_kk'] ||
    ctx?.formValues?.['kepala_kk'] ||
    ctx?.formValues?.['kepalaKk'] ||
    vIndividu?.kepala_kk ||
    '';
  const isPemohonKepala = Boolean(vIndividu?.hubungan_kk && vIndividu.hubungan_kk.toUpperCase().includes('KEPALA'));
  const headNama = String(
    rawKepalaKk && rawKepalaKk !== '-'
      ? rawKepalaKk
      : (isPemohonKepala ? vIndividu?.nama || '-' : (vIndividu?.nama || '-'))
  ).toUpperCase();
  const headAlamat = vIndividu?.alamat || `Sampeldes RT. ${vIndividu?.rt || '001'} RW. ${vIndividu?.rw || '005'}, Desa ${ctx?.namaDesa || 'Sampeldes'}, Kecamatan ${ctx?.namaKecamatan || 'Gandrungmangu'}, Kabupaten ${ctx?.namaKabupaten || 'Cilacap'}`;
  const headRt = String(vIndividu?.rt || ctx?.formValues?.['rt'] || '001').replace(/[^0-9]/g, '').padStart(3, '0').slice(-3);
  const headRw = String(vIndividu?.rw || ctx?.formValues?.['rw'] || '005').replace(/[^0-9]/g, '').padStart(3, '0').slice(-3);
  const headPos = (ctx?.formValues?.['form_kode_pos'] || ctx?.kodePos || '53254').replace(/[^0-9]/g, '').slice(0, 5).padEnd(5, ' ');
  const headTelp = (ctx?.formValues?.['[form_telepon]'] || ctx?.formValues?.['form_telepon'] || ctx?.formValues?.['telepon'] || ctx?.teleponDesa || '').replace(/[^0-9]/g, '').slice(0, 16);
  const headEmail = ctx?.formValues?.['[form_email]'] || ctx?.formValues?.['form_email'] || ctx?.formValues?.['email'] || ctx?.emailDesa || '-';

  const kdProv = (ctx?.kodeProvinsi || '33').replace(/[^0-9]/g, '').slice(0, 2).padEnd(2, ' ');
  const nmProv = (ctx?.namaProvinsi || 'JAWA TENGAH').toUpperCase();
  const kdKab = (ctx?.kodeKabupaten || '01').replace(/[^0-9]/g, '').slice(0, 2).padEnd(2, ' ');
  const nmKab = (ctx?.namaKabupaten || 'CILACAP').toUpperCase();
  const kdKec = (ctx?.kodeKecamatan || '10').replace(/[^0-9]/g, '').slice(0, 2).padEnd(2, ' ');
  const nmKec = (ctx?.namaKecamatan || 'GANDRUNGMANGU').toUpperCase();
  const rawKodeDesa = (ctx?.kodeDesa || '2011').replace(/[^0-9]/g, '');
  const kdDesa = (rawKodeDesa.length >= 4 ? rawKodeDesa.slice(-4) : rawKodeDesa.slice(-2)).padEnd(2, ' ');
  const nmDesa = (ctx?.namaDesa || 'SAMPELDES').toUpperCase();
  const nmDusun = (vIndividu?.dusun || ctx?.namaDesa || 'SAMPELDES').toUpperCase();

  const namaKadis = ctx?.namaKadisDukcapil || '...........................................';
  const nipKadis = ctx?.nipKadisDukcapil || '...........................................';

  const mapJk = (jk?: string) => {
    if (!jk) return '1';
    const s = jk.toLowerCase();
    return s.startsWith('p') || s === 'perempuan' ? '2' : '1';
  };

  const mapStatusKawin = (st?: string) => {
    if (!st) return '2';
    const s = st.toLowerCase();
    if (s.includes('belum')) return '1';
    if (s.includes('mati')) return '4';
    if (s.includes('cerai')) return '3';
    if (s.includes('kawin')) return '2';
    return '1';
  };

  const mapShdk = (sh?: string) => {
    if (!sh) return '1';
    const s = sh.toLowerCase();
    if (s.includes('kepala')) return '1';
    if (s.includes('suami')) return '2';
    if (s.includes('istri')) return '3';
    if (s.includes('anak')) return '4';
    if (s.includes('menantu')) return '5';
    if (s.includes('cucu')) return '6';
    if (s.includes('orang tua') || s.includes('ayah') || s.includes('ibu')) return '7';
    if (s.includes('mertua')) return '8';
    if (s.includes('famili')) return '9';
    if (s.includes('pembantu')) return '10';
    return '11';
  };

  const formatTgl = (dStr?: string) => {
    if (!dStr || dStr === '-') return '-';
    try {
      const clean = dStr.trim();
      const m = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (m) return `${m[3].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[1]}`;
      const m2 = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
      if (m2) return `${m2[1].padStart(2, '0')}/${m2[2].padStart(2, '0')}/${m2[3]}`;
      return clean;
    } catch {
      return dStr;
    }
  };

  interface F101RowData {
    nama: string;
    gelarDepan?: string;
    gelarBelakang?: string;
    paspor?: string;
    tglPaspor?: string;
    sponsor?: string;
    tipeSponsor?: string;
    alamatSponsor?: string;
    jkCode: string;
    tempatLahir: string;
    tglLahir: string;
    kewarganegaraan: string;
    skWni?: string;
    aktaLahirCode: string;
    noAktaLahir?: string;
    golDarah: string;
    agama: string;
    organisasiKepercayaan?: string;
    statusKawinCode: string;
    aktaKawinCode: string;
    noAktaKawin?: string;
    tglKawin?: string;
    aktaCeraiCode: string;
    noAktaCerai?: string;
    tglCerai?: string;
    shdkCode: string;
    kelainan: string;
    cacat: string;
    pendidikan: string;
    pekerjaan: string;
    nikIbu: string;
    namaIbu: string;
    nikAyah: string;
    namaAyah: string;
  }

  const rows: (F101RowData | null)[] = [];

  // Baris 1: Kepala Keluarga / Pemohon Utama
  rows.push({
    nama: (vIndividu?.nama || headNama || '-').toUpperCase(),
    gelarDepan: '-',
    gelarBelakang: '-',
    paspor: ctx?.formValues?.['[form_dokumen_pasport]'] || ctx?.formValues?.['dokumen_pasport'] || ctx?.formValues?.['paspor'] || '-',
    tglPaspor: formatTgl(ctx?.formValues?.['[form_tanggal_akhir_paspor]'] || ctx?.formValues?.['tanggal_akhir_paspor'] || ctx?.formValues?.['tgl_paspor']),
    sponsor: '-',
    tipeSponsor: '-',
    alamatSponsor: '-',
    jkCode: mapJk(vIndividu?.jenis_kelamin),
    tempatLahir: (vIndividu?.tempat_lahir || nmKab).toUpperCase(),
    tglLahir: formatTgl(vIndividu?.tanggal_lahir),
    kewarganegaraan: (vIndividu?.warga_negara || '').toUpperCase() === 'WNA' ? 'WNA' : 'WNI',
    skWni: '-',
    aktaLahirCode: (ctx?.formValues?.['[form_akta_lahir]'] || ctx?.formValues?.['akta_lahir']) && ctx?.formValues?.['akta_lahir'] !== '-' ? '2' : '1',
    noAktaLahir: ctx?.formValues?.['[form_akta_lahir]'] || ctx?.formValues?.['akta_lahir'] || ctx?.formValues?.['no_akta_lahir'] || '-',
    golDarah: vIndividu?.golongan_darah || '-',
    agama: (vIndividu?.agama || 'Islam').toUpperCase(),
    organisasiKepercayaan: '-',
    statusKawinCode: mapStatusKawin(vIndividu?.status_kawin),
    aktaKawinCode: (ctx?.formValues?.['[form_akta_perkawinan]'] || ctx?.formValues?.['akta_perkawinan']) && ctx?.formValues?.['akta_perkawinan'] !== '-' ? '2' : '1',
    noAktaKawin: ctx?.formValues?.['[form_akta_perkawinan]'] || ctx?.formValues?.['akta_perkawinan'] || ctx?.formValues?.['no_akta_kawin'] || '-',
    tglKawin: formatTgl(ctx?.formValues?.['[form_tanggalperkawinan]'] || ctx?.formValues?.['tanggalperkawinan'] || ctx?.formValues?.['tgl_kawin']),
    aktaCeraiCode: (ctx?.formValues?.['[form_akta_perceraian]'] || ctx?.formValues?.['akta_perceraian']) && ctx?.formValues?.['akta_perceraian'] !== '-' ? '2' : '1',
    noAktaCerai: ctx?.formValues?.['[form_akta_perceraian]'] || ctx?.formValues?.['akta_perceraian'] || ctx?.formValues?.['no_akta_cerai'] || '-',
    tglCerai: formatTgl(ctx?.formValues?.['[form_tanggalperceraian]'] || ctx?.formValues?.['tanggalperceraian'] || ctx?.formValues?.['tgl_cerai']),
    shdkCode: mapShdk(vIndividu?.hubungan_kk || 'Kepala Keluarga'),
    kelainan: '1',
    cacat: ctx?.formValues?.['[form_cacat]'] || ctx?.formValues?.['cacat'] || '-',
    pendidikan: (vIndividu?.pendidikan_kk || 'SLTA / Sederajat').toUpperCase(),
    pekerjaan: (vIndividu?.pekerjaan || 'WIRASWASTA').toUpperCase(),
    nikIbu: ctx?.formValues?.['form_nik_ibu'] || ctx?.formValues?.['nik_ibu'] || vIndividu?.nik_ibu || '-',
    namaIbu: (ctx?.formValues?.['form_nama_ibu'] || ctx?.formValues?.['nama_ibu'] || vIndividu?.nama_ibu || '-').toUpperCase(),
    nikAyah: ctx?.formValues?.['form_nik_ayah'] || ctx?.formValues?.['nik_ayah'] || vIndividu?.nik_ayah || '-',
    namaAyah: (ctx?.formValues?.['form_nama_ayah'] || ctx?.formValues?.['nama_ayah'] || vIndividu?.nama_ayah || '-').toUpperCase(),
  });

  // Baris 2..10 dari rawMembers
  for (let i = 0; i < 9; i++) {
    const mem = rawMembers[i];
    if (mem && (mem.nama || mem.fullName || mem.nik)) {
      const memNama = (mem.nama || mem.fullName || '-').toUpperCase();
      rows.push({
        nama: memNama,
        gelarDepan: mem.gelarDepan || '-',
        gelarBelakang: mem.gelarBelakang || '-',
        paspor: mem.paspor || mem.nomorPaspor || '-',
        tglPaspor: formatTgl(mem.tglPaspor || mem.tanggalPaspor),
        sponsor: mem.sponsor || '-',
        tipeSponsor: mem.tipeSponsor || '-',
        alamatSponsor: mem.alamatSponsor || '-',
        jkCode: mapJk(mem.jenis_kelamin || mem.gender || mem.jk),
        tempatLahir: (mem.tempat_lahir || mem.tempatLahir || '-').toUpperCase(),
        tglLahir: formatTgl(mem.tanggal_lahir || mem.tanggalLahir),
        kewarganegaraan: (mem.warga_negara || mem.kewarganegaraan || '').toUpperCase() === 'WNA' ? 'WNA' : 'WNI',
        skWni: '-',
        aktaLahirCode: mem.noAktaLahir || mem.nomor_akta_lahir ? '2' : '1',
        noAktaLahir: mem.noAktaLahir || mem.nomor_akta_lahir || '-',
        golDarah: mem.golongan_darah || mem.golDarah || '-',
        agama: (mem.agama || 'Islam').toUpperCase(),
        organisasiKepercayaan: mem.organisasiKepercayaan || '-',
        statusKawinCode: mapStatusKawin(mem.status_kawin || mem.statusKawin),
        aktaKawinCode: mem.noAktaKawin || mem.nomor_akta_kawin ? '2' : '1',
        noAktaKawin: mem.noAktaKawin || mem.nomor_akta_kawin || '-',
        tglKawin: formatTgl(mem.tglKawin || mem.tanggalKawin),
        aktaCeraiCode: mem.noAktaCerai || mem.nomor_akta_cerai ? '2' : '1',
        noAktaCerai: mem.noAktaCerai || mem.nomor_akta_cerai || '-',
        tglCerai: formatTgl(mem.tglCerai || mem.tanggalCerai),
        shdkCode: mapShdk(mem.hubungan_kk || mem.shdk),
        kelainan: '1',
        cacat: mem.cacat || '-',
        pendidikan: (mem.pendidikan_kk || mem.pendidikan || 'SLTA / Sederajat').toUpperCase(),
        pekerjaan: (mem.pekerjaan || '-').toUpperCase(),
        nikIbu: mem.nik_ibu || mem.nikIbu || '-',
        namaIbu: (mem.nama_ibu || mem.namaIbu || '-').toUpperCase(),
        nikAyah: mem.nik_ayah || mem.nikAyah || '-',
        namaAyah: (mem.nama_ayah || mem.namaAyah || '-').toUpperCase(),
      });
    } else {
      rows.push(null);
    }
  }

  const memberCountStr = String(rows.filter(Boolean).length).padStart(2, '0');

  const renderDigitBoxes = (val: string = '', count = 1, boxW = '11px', boxH = '12px', fontSize = '6.5pt') => {
    const clean = (val || '').toString().replace(/[^0-9a-zA-Z]/g, '');
    const chars = clean.padEnd(count, ' ').slice(0, count).split('');
    return `<table style="border-collapse: collapse; display: inline-table; vertical-align: middle; margin: 0; line-height: 1;"><tr>${chars.map(c => `<td style="border: 1px solid #000; width: ${boxW}; height: ${boxH}; text-align: center; font-family: monospace; font-size: ${fontSize}; font-weight: bold; padding: 0; background: #fff;">${c === ' ' ? '&nbsp;' : c}</td>`).join('')}</tr></table>`;
  };

  // =========================================================================
  // HALAMAN 1 (Landscape F4): DATA KEPALA KELUARGA, DATA WILAYAH, ALAMAT LUAR NEGERI
  // =========================================================================
  const page1 = `
<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.8pt; line-height: 1.15; color: #000; width: 100%; box-sizing: border-box;">
  <!-- TOP HEADER PERMENDAGRI -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 3px;">
    <tr>
      <td style="width: 78%; font-size: 6.2pt; font-weight: bold; line-height: 1.15; text-transform: uppercase;">
        FORMULIR PENGAJUAN PELAYANAN, FORMULIR HASIL PELAYANAN PENDAFTARAN PENDUDUK, PENCATATAN SIPIL,<br/>
        PEMANFAATAN DATA, CATATAN PINGGIR, PETUNJUK PENGISIAN BUKU CETAKAN, DAN SPESIFIKASI STEMPEL JABATAN<br/>
        PEJABAT PENCATATAN SIPIL
      </td>
      <td style="width: 22%; text-align: right; vertical-align: top;">
        <div style="border: 1.5px solid #000; display: inline-block; padding: 2px 12px; font-weight: bold; font-size: 11pt; font-family: monospace;">F-1.01</div>
      </td>
    </tr>
    <tr>
      <td colspan="2" style="text-align: center; font-size: 7.2pt; font-weight: bold; padding-top: 2px; text-transform: uppercase;">
        KOP PEMERINTAH KABUPATEN ${nmKab}
      </td>
    </tr>
    <tr>
      <td colspan="2" style="text-align: center; padding-top: 1px;">
        <strong style="font-size: 11pt; letter-spacing: 0.5px;">FORMULIR BIODATA KELUARGA</strong>
      </td>
    </tr>
  </table>

  <!-- BANNER PERHATIAN -->
  <div style="background-color: #cbd5e1; border: 1px solid #000; padding: 2.5px 5px; font-weight: bold; font-size: 6.6pt; text-transform: uppercase; margin-bottom: 4px;">
    PERHATIAN : Isilah Formulir ini dengan huruf cetak dan jelas serta mengikuti "TATA CARA PENGISIAN FORMULIR"
  </div>

  <!-- PILIHAN WNI / ORANG ASING -->
  <table style="width: 100%; font-size: 6.8pt; border-collapse: collapse; margin-bottom: 4px;">
    <tr><td colspan="2" style="font-weight: bold;">Pilih salah satu:</td></tr>
    <tr>
      <td style="width: 18px; text-align: center;"><span style="border: 1px solid #000; width: 11px; height: 11px; display: inline-block; line-height: 11px; font-weight: bold; font-family: monospace; font-size: 8pt;">X</span></td>
      <td>&nbsp;Input Data Kepala Keluarga dan Anggota Keluarga WNI</td>
    </tr>
    <tr>
      <td style="text-align: center;"><span style="border: 1px solid #000; width: 11px; height: 11px; display: inline-block; line-height: 11px;">&nbsp;</span></td>
      <td>&nbsp;Input Data Kepala Keluarga dan Anggota Keluarga Orang Asing</td>
    </tr>
    <tr>
      <td style="text-align: center;"><span style="border: 1px solid #000; width: 11px; height: 11px; display: inline-block; line-height: 11px;">&nbsp;</span></td>
      <td>&nbsp;Input Data Kepala Keluarga dan Anggota Keluarga WNI diluar Negeri</td>
    </tr>
  </table>

  <!-- DATA KEPALA KELUARGA -->
  <div style="font-weight: bold; font-size: 7.2pt; margin-top: 3px; margin-bottom: 2px;">DATA KEPALA KELUARGA</div>
  <table style="width: 100%; font-size: 6.8pt; border-collapse: collapse; margin-bottom: 4px;">
    <tr>
      <td style="width: 2%;">1.</td>
      <td style="width: 25%;">Nama Kepala Keluarga/ <i>Name of Head of the Family</i></td>
      <td style="width: 1%;">:</td>
      <td colspan="10" style="border: 1px solid #000; padding: 1.5px 5px; font-weight: bold;">${headNama}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding-top: 2px;">2.</td>
      <td style="vertical-align: top; padding-top: 2px;">Alamat/ <i>Address</i></td>
      <td style="vertical-align: top; padding-top: 2px;">:</td>
      <td colspan="10" style="border: 1px solid #000; padding: 2px 5px; height: 24px; vertical-align: top;">${headAlamat}</td>
    </tr>
    <tr>
      <td>3.</td>
      <td>Kode Pos/ <i>Post Code</i></td>
      <td>:</td>
      <td style="width: 16%;">
        ${renderDigitBoxes(headPos, 5)}
      </td>
      <td style="width: 5%; text-align: right; font-weight: 600;">4. RT</td>
      <td style="width: 9%;">
        ${renderDigitBoxes(headRt, 3)}
      </td>
      <td style="width: 5%; text-align: right; font-weight: 600;">5. RW</td>
      <td style="width: 9%;">
        ${renderDigitBoxes(headRw, 3)}
      </td>
      <td style="width: 16%; text-align: right; font-weight: 600;">6. Jumlah Anggota Keluarga</td>
      <td style="width: 7%;">
        ${renderDigitBoxes(memberCountStr, 2)}
      </td>
      <td style="width: 6%;">orang</td>
    </tr>
    <tr>
      <td>7.</td>
      <td>Telepon/ <i>Telephone Number/ Handphone</i></td>
      <td>:</td>
      <td colspan="8">
        ${renderDigitBoxes(headTelp, 16)}
      </td>
    </tr>
    <tr>
      <td>8.</td>
      <td>Email</td>
      <td>:</td>
      <td colspan="8" style="border: 1px solid #000; padding: 1.5px 5px;">${headEmail}</td>
    </tr>
  </table>

  <!-- DATA WILAYAH -->
  <div style="font-size: 6.2pt; font-style: italic; color: #475569; margin-top: 3px;">Kode wilayah diisi oleh Petugas Kependudukan dan Pencatatan Sipil</div>
  <div style="font-weight: bold; font-size: 7.2pt; margin-bottom: 2px;">DATA WILAYAH</div>
  <table style="width: 100%; font-size: 6.8pt; border-collapse: collapse; margin-bottom: 4px;">
    <tr>
      <td style="width: 2%;">9.</td>
      <td style="width: 27%;">Kode-Nama Provinsi/ <i>Code-Province</i></td>
      <td style="width: 1%;">:</td>
      <td style="width: 5%;">${renderDigitBoxes(kdProv, 2)}</td>
      <td style="border: 1px solid #000; padding: 1.5px 5px; font-weight: 600;">${nmProv}</td>
    </tr>
    <tr>
      <td>10.</td>
      <td>Kode-Nama Kabupaten/Kota/ <i>Code-Regency/Municipality</i></td>
      <td>:</td>
      <td>${renderDigitBoxes(kdKab, 2)}</td>
      <td style="border: 1px solid #000; padding: 1.5px 5px; font-weight: 600;">${nmKab}</td>
    </tr>
    <tr>
      <td>11.</td>
      <td>Kode-Nama Kecamatan/ <i>Code-Sub District</i></td>
      <td>:</td>
      <td>${renderDigitBoxes(kdKec, 2)}</td>
      <td style="border: 1px solid #000; padding: 1.5px 5px; font-weight: 600;">${nmKec}</td>
    </tr>
    <tr>
      <td>12.</td>
      <td>Kode-Nama Kelurahan/Desa/ <i>Code-Village</i></td>
      <td>:</td>
      <td>${renderDigitBoxes(kdDesa, 4)}</td>
      <td style="border: 1px solid #000; padding: 1.5px 5px; font-weight: 600;">${nmDesa}</td>
    </tr>
    <tr>
      <td>13.</td>
      <td>Nama Dusun/Dukuh/Kampung/ <i>Sub-Village</i></td>
      <td>:</td>
      <td></td>
      <td style="border: 1px solid #000; padding: 1.5px 5px; font-weight: 600;">${nmDusun}</td>
    </tr>
  </table>

  <!-- ALAMAT DI LUAR NEGERI -->
  <div style="font-weight: bold; font-size: 6.8pt; margin-top: 3px;">Alamat di Luar Negeri (diisi oleh WNI di luar negeri)</div>
  <table style="width: 100%; font-size: 6.6pt; border-collapse: collapse; margin-bottom: 2px;">
    <tr>
      <td style="width: 2%;">1.</td>
      <td style="width: 15%;">Alamat</td>
      <td style="width: 1%;">:</td>
      <td colspan="7" style="border: 1px solid #000; height: 18px;">&nbsp;</td>
    </tr>
    <tr>
      <td>2.</td><td>Kota</td><td>:</td>
      <td style="border: 1px solid #000; width: 30%;">&nbsp;</td>
      <td style="width: 2%;">3.</td>
      <td style="width: 18%;">Provinsi/ Negara Bagian</td>
      <td style="width: 1%;">:</td>
      <td style="border: 1px solid #000;">&nbsp;</td>
    </tr>
    <tr>
      <td>4.</td><td>Negara</td><td>:</td>
      <td colspan="5" style="border: 1px solid #000; height: 14px;">&nbsp;</td>
    </tr>
    <tr>
      <td>5.</td><td>Kode Pos</td><td>:</td>
      <td style="border: 1px solid #000;">&nbsp;</td>
      <td>6.</td>
      <td>Jumlah Anggota Keluarga</td>
      <td>:</td>
      <td>${renderDigitBoxes('', 2)} &nbsp;Orang</td>
    </tr>
    <tr>
      <td>7.</td><td>Telepon/ Telephone Number/ Handphone</td><td>:</td>
      <td colspan="5">${renderDigitBoxes('', 14)}</td>
    </tr>
    <tr>
      <td>8.</td><td>Email</td><td>:</td>
      <td colspan="5" style="border: 1px solid #000; height: 13px;">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="8" style="font-style: italic; padding-top: 2px; font-weight: 600;">Diisi oleh Petugas</td>
    </tr>
    <tr>
      <td colspan="2">Kode-Nama Negara</td><td>:</td>
      <td colspan="5">${renderDigitBoxes('', 3)} &nbsp;<span style="border: 1px solid #000; display: inline-block; width: 62%; height: 13px; vertical-align: middle;">&nbsp;</span></td>
    </tr>
    <tr>
      <td colspan="2">Kode-Nama Perwakilan RI</td><td>:</td>
      <td colspan="5">${renderDigitBoxes('', 3)} &nbsp;<span style="border: 1px solid #000; display: inline-block; width: 62%; height: 13px; vertical-align: middle;">&nbsp;</span></td>
    </tr>
  </table>
</div>
`;

  // =========================================================================
  // HALAMAN 2 (Landscape F4): DATA ANGGOTA KELUARGA (TABEL 1-7, 8-15, 16-23)
  // =========================================================================
  const page2 = `
<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.8pt; line-height: 1.15; color: #000; width: 100%; box-sizing: border-box;">
  <div style="font-weight: bold; font-size: 7.4pt; margin-top: 2px; margin-bottom: 2px;">DATA ANGGOTA KELUARGA</div>
  <div style="font-size: 6.2pt; line-height: 1.15; margin-bottom: 4px; color: #1e293b;">
    Catatan:<br/>
    &nbsp;&nbsp;&nbsp;- Bagi Penduduk WNI mengisi Kolom 2 s.d 6, 10 s.d 31, 38 s.d 41<br/>
    &nbsp;&nbsp;&nbsp;- <i>For foreigners only, please fill column 2 to 13, 15 to 41</i><br/>
    &nbsp;&nbsp;&nbsp;- Bagi WNI di luar wilayah NKRI mengisi nomor 2 s.d 31, 38 s/d 41
  </div>

  <!-- TABEL 1 : KOLOM 1 SAMPAI 7 -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 4px;" border="1">
    <tr style="font-weight: bold; text-align: center; background: #fff;">
      <td rowspan="2" style="width: 3%; padding: 2px 1px;">No.<br/>.</td>
      <td rowspan="2" style="width: 32%; padding: 2px 3px;">Nama Lengkap<br/><i>Full Name</i></td>
      <td colspan="2" style="width: 14%; padding: 2px 1px;">Gelar</td>
      <td rowspan="2" style="width: 17%; padding: 2px 2px;">Nomor Paspor<br/><i>Passport Number</i></td>
      <td rowspan="2" style="width: 17%; padding: 2px 2px;">Tgl Berakhir Passport<br/><i>Date of Expiry</i></td>
      <td rowspan="2" style="width: 17%; padding: 2px 2px;">Nama Sponsor<br/><i>Sponsor Name</i></td>
    </tr>
    <tr style="font-weight: bold; text-align: center; background: #fff;">
      <td style="width: 7%; padding: 1px;">Depan</td>
      <td style="width: 7%; padding: 1px;">Belakang</td>
    </tr>
    <tr style="text-align: center; font-size: 6pt; background: #fff;">
      <td style="padding: 1px;">(1)</td>
      <td style="padding: 1px;">(2)</td>
      <td style="padding: 1px;">(3)</td>
      <td style="padding: 1px;">(4)</td>
      <td style="padding: 1px;">(5)</td>
      <td style="padding: 1px;">(6)</td>
      <td style="padding: 1px;">(7)</td>
    </tr>
    ${rows
      .map((r, idx) => {
        const no = `${idx + 1}.`;
        if (!r) {
          return `<tr style="height: 12.5px;">
            <td style="text-align: center;">${no}</td>
            <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
          </tr>`;
        }
        return `<tr style="height: 12.5px;">
          <td style="text-align: center;">${no}</td>
          <td style="font-weight: bold; padding: 1px 4px; text-transform: uppercase;">${r.nama}</td>
          <td style="text-align: center;">${r.gelarDepan || '-'}</td>
          <td style="text-align: center;">${r.gelarBelakang || '-'}</td>
          <td style="text-align: center;">${r.paspor || '-'}</td>
          <td style="text-align: center;">${r.tglPaspor || '-'}</td>
          <td style="text-align: center;">${r.sponsor || '-'}</td>
        </tr>`;
      })
      .join('')}
  </table>

  <!-- TABEL 2 : KOLOM 8 SAMPAI 15 -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 4px;" border="1">
    <tr style="font-weight: bold; text-align: center; background: #fff;">
      <td style="width: 3%; padding: 2px 1px;">No.<br/>.</td>
      <td style="width: 11%; padding: 2px 1px;">Tipe Sponsor<br/><i>Type of Sponsor</i></td>
      <td style="width: 18%; padding: 2px 2px;">Alamat Sponsor<br/><i>Sponsor Address</i></td>
      <td style="width: 9%; padding: 2px 1px;">Jenis Kelamin<br/><i>Sex</i></td>
      <td style="width: 16%; padding: 2px 2px;">Tempat Lahir<br/><i>Place of Birth</i></td>
      <td style="width: 17%; padding: 2px 2px;">Tanggal, Bulan, Tahun Lahir<br/><i>Date of Birth</i></td>
      <td style="width: 12%; padding: 2px 1px;">Kewarganegaraan<br/><i>Nationality</i></td>
      <td style="width: 8%; padding: 2px 1px;">No SK<br/>PEnetapan WNI</td>
      <td style="width: 6%; padding: 2px 1px;">Akta Lahir</td>
    </tr>
    <tr style="text-align: center; font-size: 6pt; background: #fff;">
      <td style="padding: 1px;">&nbsp;</td>
      <td style="padding: 1px;">(8)</td>
      <td style="padding: 1px;">(9)</td>
      <td style="padding: 1px;">(10)</td>
      <td style="padding: 1px;">(11)</td>
      <td style="padding: 1px;">(12)</td>
      <td style="padding: 1px;">(13)</td>
      <td style="padding: 1px;">(14)</td>
      <td style="padding: 1px;">(15)</td>
    </tr>
    ${rows
      .map((r, idx) => {
        const no = `${idx + 1}.`;
        if (!r) {
          return `<tr style="height: 12.5px;">
            <td style="text-align: center;">${no}</td>
            <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
          </tr>`;
        }
        return `<tr style="height: 12.5px;">
          <td style="text-align: center;">${no}</td>
          <td style="text-align: center;">${r.tipeSponsor || '-'}</td>
          <td style="text-align: center;">${r.alamatSponsor || '-'}</td>
          <td style="text-align: center;">${r.jkCode}</td>
          <td style="text-align: center; text-transform: uppercase;">${r.tempatLahir}</td>
          <td style="text-align: center;">${r.tglLahir}</td>
          <td style="text-align: center;">${r.kewarganegaraan}</td>
          <td style="text-align: center;">${r.skWni || '-'}</td>
          <td style="text-align: center;">${r.aktaLahirCode}</td>
        </tr>`;
      })
      .join('')}
  </table>

  <!-- TABEL 3 : KOLOM 16 SAMPAI 23 -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt;" border="1">
    <tr style="font-weight: bold; text-align: center; background: #fff;">
      <td style="width: 3%; padding: 2px 1px;">No.<br/>.</td>
      <td style="width: 16%; padding: 2px 2px;">Nomor Akta Kelahiran</td>
      <td style="width: 7%; padding: 2px 1px;">Gol. Darah<br/><i>Type of Blood</i></td>
      <td style="width: 10%; padding: 2px 1px;">Agama<br/><i>Religion</i></td>
      <td style="width: 22%; padding: 2px 2px;">Nama Organisasi Kepercayaan terhadap Tuhan YME</td>
      <td style="width: 13%; padding: 2px 1px;">Status Perkawinan<br/><i>Marital Status</i></td>
      <td style="width: 9%; padding: 2px 1px;">Akta Perkawinan</td>
      <td style="width: 10%; padding: 2px 1px;">Nomor Akta Perkawinan</td>
      <td style="width: 10%; padding: 2px 1px;">Tanggal Perkawinan</td>
    </tr>
    <tr style="text-align: center; font-size: 6pt; background: #fff;">
      <td style="padding: 1px;">&nbsp;</td>
      <td style="padding: 1px;">(16)</td>
      <td style="padding: 1px;">(17)</td>
      <td style="padding: 1px;">(18)</td>
      <td style="padding: 1px;">(19)</td>
      <td style="padding: 1px;">(20)</td>
      <td style="padding: 1px;">(21)</td>
      <td style="padding: 1px;">(22)</td>
      <td style="padding: 1px;">(23)</td>
    </tr>
    ${rows
      .map((r, idx) => {
        const no = `${idx + 1}.`;
        if (!r) {
          return `<tr style="height: 12.5px;">
            <td style="text-align: center;">${no}</td>
            <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
          </tr>`;
        }
        return `<tr style="height: 12.5px;">
          <td style="text-align: center;">${no}</td>
          <td style="text-align: center;">${r.noAktaLahir || '-'}</td>
          <td style="text-align: center;">${r.golDarah || '-'}</td>
          <td style="text-align: center; text-transform: uppercase;">${r.agama || '-'}</td>
          <td style="text-align: center;">${r.organisasiKepercayaan || '-'}</td>
          <td style="text-align: center;">${r.statusKawinCode}</td>
          <td style="text-align: center;">${r.aktaKawinCode}</td>
          <td style="text-align: center;">${r.noAktaKawin || '-'}</td>
          <td style="text-align: center;">${r.tglKawin || '-'}</td>
        </tr>`;
      })
      .join('')}
  </table>
</div>
`;

  // =========================================================================
  // HALAMAN 3 (Landscape F4): DATA ANGGOTA KELUARGA (TABEL 24-33, 34-41) + TANDA TANGAN & PERNYATAAN
  // =========================================================================
  const page3 = `
<div style="font-family: Arial, Helvetica, sans-serif; font-size: 6.8pt; line-height: 1.15; color: #000; width: 100%; box-sizing: border-box;">
  <!-- TABEL 4 : KOLOM 24 SAMPAI 33 -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-top: 2px; margin-bottom: 4px;" border="1">
    <tr style="font-weight: bold; text-align: center; background: #fff;">
      <td style="width: 3%; padding: 2px 1px;">No.<br/>.</td>
      <td style="width: 7%; padding: 2px 1px;">Akta Cerai</td>
      <td style="width: 11%; padding: 2px 1px;">Nomor Akta Cerai</td>
      <td style="width: 9%; padding: 2px 1px;">Tanggal Perceraian</td>
      <td style="width: 14%; padding: 2px 1px;">Status Hubungan<br/>dalam Keluarga</td>
      <td style="width: 10%; padding: 2px 1px;">Kelainan Fisik &<br/>Mental</td>
      <td style="width: 9%; padding: 2px 1px;">Penyandang<br/>Cacat</td>
      <td style="width: 13%; padding: 2px 1px;">Pendidikan<br/>Terakhir</td>
      <td style="width: 12%; padding: 2px 1px;">Jenis Pekerjaan</td>
      <td style="width: 6%; padding: 2px 1px;">Nomor ITAS/ ITAP</td>
      <td style="width: 6%; padding: 2px 1px;">Tempat Terbit ITAS/ITAP</td>
    </tr>
    <tr style="text-align: center; font-size: 6pt; background: #fff;">
      <td style="padding: 1px;">&nbsp;</td>
      <td style="padding: 1px;">(24)</td>
      <td style="padding: 1px;">(25)</td>
      <td style="padding: 1px;">(26)</td>
      <td style="padding: 1px;">(27)</td>
      <td style="padding: 1px;">(28)</td>
      <td style="padding: 1px;">(29)</td>
      <td style="padding: 1px;">(30)</td>
      <td style="padding: 1px;">(31)</td>
      <td style="padding: 1px;">(32)</td>
      <td style="padding: 1px;">(33)</td>
    </tr>
    ${rows
      .map((r, idx) => {
        const no = `${idx + 1}.`;
        if (!r) {
          return `<tr style="height: 12.5px;">
            <td style="text-align: center;">${no}</td>
            <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
          </tr>`;
        }
        return `<tr style="height: 12.5px;">
          <td style="text-align: center;">${no}</td>
          <td style="text-align: center;">${r.aktaCeraiCode}</td>
          <td style="text-align: center;">${r.noAktaCerai || '-'}</td>
          <td style="text-align: center;">${r.tglCerai || '-'}</td>
          <td style="text-align: center;">${r.shdkCode}</td>
          <td style="text-align: center;">${r.kelainan}</td>
          <td style="text-align: center;">${r.cacat}</td>
          <td style="text-align: center; text-transform: uppercase;">${r.pendidikan}</td>
          <td style="text-align: center; text-transform: uppercase;">${r.pekerjaan}</td>
          <td style="text-align: center;">-</td>
          <td style="text-align: center;">-</td>
        </tr>`;
      })
      .join('')}
  </table>

  <!-- TABEL 5 : KOLOM 34 SAMPAI 41 -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6.5pt; margin-bottom: 8px;" border="1">
    <tr style="font-weight: bold; text-align: center; background: #fff;">
      <td style="width: 3%; padding: 2px 1px;">No.<br/>.</td>
      <td style="width: 10%; padding: 2px 1px;">Tanggal Terbit<br/>ITAS/ITAP</td>
      <td style="width: 10%; padding: 2px 1px;">Tanggal Akhir ITAS/ITAP</td>
      <td style="width: 11%; padding: 2px 1px;">Tempat Datang Pertama</td>
      <td style="width: 11%; padding: 2px 1px;">Tgl Kedatangan Pertama</td>
      <td style="width: 13%; padding: 2px 1px;">NIK Ibu</td>
      <td style="width: 14%; padding: 2px 1px;">Nama Ibu</td>
      <td style="width: 13%; padding: 2px 1px;">NIK Ayah</td>
      <td style="width: 15%; padding: 2px 1px;">Nama Ayah</td>
    </tr>
    <tr style="text-align: center; font-size: 6pt; background: #fff;">
      <td style="padding: 1px;">&nbsp;</td>
      <td style="padding: 1px;">(34)</td>
      <td style="padding: 1px;">(35)</td>
      <td style="padding: 1px;">(36)</td>
      <td style="padding: 1px;">(37)</td>
      <td style="padding: 1px;">(38)</td>
      <td style="padding: 1px;">(39)</td>
      <td style="padding: 1px;">(40)</td>
      <td style="padding: 1px;">(41)</td>
    </tr>
    ${rows
      .map((r, idx) => {
        const no = `${idx + 1}.`;
        if (!r) {
          return `<tr style="height: 12.5px;">
            <td style="text-align: center;">${no}</td>
            <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
          </tr>`;
        }
        return `<tr style="height: 12.5px;">
          <td style="text-align: center;">${no}</td>
          <td style="text-align: center;">-</td>
          <td style="text-align: center;">-</td>
          <td style="text-align: center;">-</td>
          <td style="text-align: center;">-</td>
          <td style="text-align: center;">${r.nikIbu}</td>
          <td style="text-align: center; text-transform: uppercase;">${r.namaIbu}</td>
          <td style="text-align: center;">${r.nikAyah}</td>
          <td style="text-align: center; text-transform: uppercase;">${r.namaAyah}</td>
        </tr>`;
      })
      .join('')}
  </table>

  <!-- TANDA TANGAN PERSIS PDF -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 6.8pt;">
    <tr>
      <td style="width: 3%;"></td>
      <td style="width: 45%; text-align: left; vertical-align: top; line-height: 1.25;">
        Mengetahui,<br/>
        Kepala Dinas Kependudukan<br/>
        dan Pencatatan Sipil/ UPT Dinas Dukcapil/<br/>
        Kepala Perwakilan RI di …………………………………..
        <div style="height: 38px;"></div>
        Nama Lengkap : <span style="border-bottom: 1px solid #000; display: inline-block; min-width: 160px;">${namaKadis}</span><br/>
        NIP. <span style="display: inline-block; min-width: 160px;">${nipKadis}</span>
      </td>
      <td style="width: 8%;"></td>
      <td style="width: 41%; text-align: center; vertical-align: top; line-height: 1.25;">
        Kepala Keluarga/ <i>Head of Family</i>
        <div style="height: 48px;"></div>
        Nama Jelas/ <i>Name</i> : <span style="border-bottom: 1px solid #000; font-weight: bold; text-transform: uppercase; padding: 0 10px;">${headNama}</span>
      </td>
      <td style="width: 3%;"></td>
    </tr>
  </table>

  <!-- PERNYATAAN PERSIS PDF -->
  <div style="margin-top: 10px; font-size: 6.5pt; line-height: 1.25;">
    <strong>PERNYATAAN</strong><br/>
    Demikian Formulir ini saya/ kami isi dengan sesungguhnya. Apabila keterangan tersebut tidak sesuai dengan keadaan sebenarnya, saya bersedia dikenakan sanksi sesuai ketentuan peraturan perundang-undangan yang berlaku
  </div>
</div>
`;

  return `${page1}\n<!-- PAGE_BREAK -->\n${page2}\n<!-- PAGE_BREAK -->\n${page3}`;
}
