import type { LampiranSuratItem, OpenSidKodeIsianItem, OpenSidFormSectionConfig } from './types';

export function getDefaultLampiranFormIsian(item: LampiranSuratItem): Record<string, OpenSidFormSectionConfig> {
  if (item.formIsian && Object.keys(item.formIsian).length > 0) {
    return item.formIsian;
  }

  const sections: Record<string, OpenSidFormSectionConfig> = {
    individu: {
      judul: 'Pemohon / Subjek Utama',
      label: 'Data Pemohon Lampiran',
      info: `Sumber data utama untuk pengisian ${item.kode} - ${item.nama}`,
      prefix: '',
    },
    kepala_keluarga: {
      judul: 'Kepala Keluarga (KK)',
      label: 'Data Kepala Keluarga & Anggota KK',
      info: 'Digunakan pada formulir keluarga (F-1.01, F-1.02, F-1.03, F-1.15)',
      prefix: 'kk',
    },
  };

  if (item.kategori === 'Pernikahan KUA' || item.kode.toUpperCase().includes('F-2.01')) {
    sections.ayah = {
      judul: 'Ayah Kandung',
      label: 'Data Ayah Kandung',
      info: 'Data identitas Ayah untuk Lampiran Nikah (N-1 s/d N-5) atau Akta Capil (F-2.01)',
      prefix: 'ayah',
    };
    sections.ibu = {
      judul: 'Ibu Kandung',
      label: 'Data Ibu Kandung',
      info: 'Data identitas Ibu untuk Lampiran Nikah (N-1 s/d N-5) atau Akta Capil (F-2.01)',
      prefix: 'ibu',
    };
    sections.pasangan = {
      judul: 'Calon Pasangan / Suami / Istri',
      label: 'Data Calon Mempelai / Pasangan',
      info: 'Data pasangan untuk lampiran pernikahan atau pencatatan sipil',
      prefix: 'pasangan',
    };
  }

  if ((item.jumlahSaksi || 0) >= 1) {
    sections.saksi_1 = {
      judul: 'Saksi I',
      label: 'Data Identitas Saksi Kesatu',
      info: 'Data Saksi I untuk penandatanganan formulir lampiran',
      prefix: 'saksi1',
    };
  }
  if ((item.jumlahSaksi || 0) >= 2) {
    sections.saksi_2 = {
      judul: 'Saksi II',
      label: 'Data Identitas Saksi Kedua',
      info: 'Data Saksi II untuk penandatanganan formulir lampiran',
      prefix: 'saksi2',
    };
  }

  return sections;
}

export function getDefaultLampiranKodeIsian(item: LampiranSuratItem): OpenSidKodeIsianItem[] {
  if (item.kodeIsian && item.kodeIsian.length > 0) {
    return item.kodeIsian;
  }

  const base: OpenSidKodeIsianItem[] = [
    {
      tipe: 'text',
      kode: '[Form_Nomor_Dokumen]',
      nama: 'Nomor Dokumen / Register Lampiran',
      deskripsi: 'Nomor registrasi lampiran (opsional)',
      required: false,
      kolom: 6,
    },
    {
      tipe: 'textarea',
      kode: '[Form_Keperluan_Lampiran]',
      nama: 'Keterangan / Keperluan Lampiran',
      deskripsi: `Rincian keterangan tambahan pada ${item.nama}`,
      required: false,
      kolom: 12,
    },
  ];

  if ((item.jumlahSaksi || 0) >= 1) {
    base.push(
      {
        tipe: 'text',
        kode: '[Form_Nama_Saksi_1]',
        nama: 'Nama Lengkap Saksi I',
        deskripsi: 'Nama lengkap Saksi Pertama',
        required: false,
        kolom: 6,
      },
      {
        tipe: 'text',
        kode: '[Form_Nik_Saksi_1]',
        nama: 'NIK Saksi I',
        deskripsi: '16 digit NIK Saksi Pertama',
        required: false,
        kolom: 6,
      }
    );
  }

  if ((item.jumlahSaksi || 0) >= 2) {
    base.push(
      {
        tipe: 'text',
        kode: '[Form_Nama_Saksi_2]',
        nama: 'Nama Lengkap Saksi II',
        deskripsi: 'Nama lengkap Saksi Kedua',
        required: false,
        kolom: 6,
      },
      {
        tipe: 'text',
        kode: '[Form_Nik_Saksi_2]',
        nama: 'NIK Saksi II',
        deskripsi: '16 digit NIK Saksi Kedua',
        required: false,
        kolom: 6,
      }
    );
  }

  if (item.kategori === 'Pernikahan KUA') {
    base.push(
      {
        tipe: 'text',
        kode: '[Form_Nama_Calon_Pasangan]',
        nama: 'Nama Lengkap Calon Pasangan',
        deskripsi: 'Nama calon suami / istri',
        required: false,
        kolom: 6,
      },
      {
        tipe: 'text',
        kode: '[Form_Nik_Calon_Pasangan]',
        nama: 'NIK Calon Pasangan',
        deskripsi: 'NIK calon suami / istri',
        required: false,
        kolom: 6,
      },
      {
        tipe: 'text',
        kode: '[Form_Status_Perkawinan_Catin]',
        nama: 'Status Perkawinan (Jejaka / Perawan / Duda / Janda)',
        deskripsi: 'Status perkawinan calon pengantin pada lampiran KUA',
        required: false,
        kolom: 12,
      }
    );
  }

  if (item.kategori === 'Pertanahan') {
    base.push(
      {
        tipe: 'text',
        kode: '[Form_Letak_Tanah]',
        nama: 'Letak / Blok Bidang Tanah',
        deskripsi: 'Lokasi blok / persil tanah di desa',
        required: false,
        kolom: 6,
      },
      {
        tipe: 'text',
        kode: '[Form_Luas_Tanah]',
        nama: 'Luas Bidang Tanah (m²)',
        deskripsi: 'Luas tanah dalam meter persegi',
        required: false,
        kolom: 6,
      },
      {
        tipe: 'textarea',
        kode: '[Form_Batas_Tanah]',
        nama: 'Batas-Batas Tanah (Utara, Timur, Selatan, Barat)',
        deskripsi: 'Uraian batas bidang tanah',
        required: false,
        kolom: 12,
      }
    );
  }

  return base;
}

function renderDigitBoxes(value: string | undefined, length: number): string {
  const chars = (value || '').replace(/\s+/g, '').slice(0, length).split('');
  let html = '<span style="display: inline-flex; vertical-align: middle; margin: 0 1px;">';
  for (let i = 0; i < length; i++) {
    const char = chars[i] || '&nbsp;';
    html += `<span style="border: 1px solid #000; width: 13px; height: 15px; line-height: 15px; text-align: center; font-family: monospace; font-size: 7.5pt; font-weight: bold; margin-right: -1px; display: inline-block; background: #fff;">${char}</span>`;
  }
  html += '</span>';
  return html;
}
