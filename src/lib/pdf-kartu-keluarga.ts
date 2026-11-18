import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Resident } from '@/lib/types';
import { formatDateToDDMMYYYY } from '@/lib/utils';

export interface SalinanKkPdfData {
  noKk: string;
  kepalaKeluarga: string;
  alamat?: string;
  dusun?: string;
  rt?: string;
  rw?: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  kodePos?: string;
  provinsi?: string;
  members: Resident[];
  kepalaDesaName?: string;
  tanggalCetak?: string;
}

export function generateSalinanKartuKeluargaPdf(data: SalinanKkPdfData) {
  const {
    noKk,
    kepalaKeluarga,
    alamat = 'DUSUN SAMPELDES',
    dusun = 'SAMPELDES',
    rt = '001',
    rw = '001',
    desa = 'SAMPELDES',
    kecamatan = 'GANDRUNGMANGU',
    kabupaten = 'CILACAP',
    kodePos = '53254',
    provinsi = 'JAWA TENGAH',
    members = [],
    kepalaDesaName = 'TUKIMAN',
    tanggalCetak,
  } = data;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // 1. Header Judul
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('SALINAN KARTU KELUARGA', pageWidth / 2, 15, { align: 'center' });
  pdf.setFontSize(11);
  pdf.text(`No. ${noKk || '-'}`, pageWidth / 2, 21, { align: 'center' });

  // 2. Metadata Wilayah (2 Kolom Grid)
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'bold');

  const startMetaY = 27;
  const lineSpacing = 4.2;

  // Kolom Kiri
  const leftX1 = margin;
  const leftX2 = margin + 35;
  const alamatLengkap = `${alamat ? alamat.toUpperCase() : ''} ${dusun ? 'DUSUN ' + dusun.toUpperCase() : ''}`.trim() || 'SAMPELDES';

  pdf.text('ALAMAT', leftX1, startMetaY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`: ${alamatLengkap}`, leftX2, startMetaY);

  pdf.setFont('helvetica', 'bold');
  pdf.text('RT/RW', leftX1, startMetaY + lineSpacing);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`: ${String(rt).padStart(3, '0')} / ${String(rw).padStart(3, '0')}`, leftX2, startMetaY + lineSpacing);

  pdf.setFont('helvetica', 'bold');
  pdf.text('DESA / KELURAHAN', leftX1, startMetaY + lineSpacing * 2);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`: ${desa.toUpperCase()}`, leftX2, startMetaY + lineSpacing * 2);

  pdf.setFont('helvetica', 'bold');
  pdf.text('KECAMATAN', leftX1, startMetaY + lineSpacing * 3);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`: ${kecamatan.toUpperCase()}`, leftX2, startMetaY + lineSpacing * 3);

  // Kolom Kanan
  const rightX1 = 175;
  const rightX2 = 210;

  pdf.setFont('helvetica', 'bold');
  pdf.text('KABUPATEN', rightX1, startMetaY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`: ${kabupaten.toUpperCase()}`, rightX2, startMetaY);

  pdf.setFont('helvetica', 'bold');
  pdf.text('KODE POS', rightX1, startMetaY + lineSpacing);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`: ${kodePos}`, rightX2, startMetaY + lineSpacing);

  pdf.setFont('helvetica', 'bold');
  pdf.text('PROVINSI', rightX1, startMetaY + lineSpacing * 2);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`: ${provinsi.toUpperCase()}`, rightX2, startMetaY + lineSpacing * 2);

  pdf.setFont('helvetica', 'bold');
  pdf.text('JUMLAH ANGGOTA', rightX1, startMetaY + lineSpacing * 3);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`: ${members.length}`, rightX2, startMetaY + lineSpacing * 3);

  // 3. TABEL 1 (Biodata, Pendidikan & Pekerjaan)
  const table1Columns = [
    { header: 'No', dataKey: 'no' },
    { header: 'Nama Lengkap', dataKey: 'nama' },
    { header: 'NIK', dataKey: 'nik' },
    { header: 'Jenis Kelamin', dataKey: 'jk' },
    { header: 'Tempat Lahir', dataKey: 'tempatLahir' },
    { header: 'Tanggal Lahir', dataKey: 'tglLahir' },
    { header: 'Agama', dataKey: 'agama' },
    { header: 'Pendidikan', dataKey: 'pendidikan' },
    { header: 'Jenis Pekerjaan', dataKey: 'pekerjaan' },
    { header: 'Golongan Darah', dataKey: 'golDarah' },
  ];

  const table1Rows = members.map((m, idx) => ({
    no: idx + 1,
    nama: (m.fullName || '-').toUpperCase(),
    nik: m.nik || '-',
    jk: (m.gender || '-').toUpperCase(),
    tempatLahir: (m.placeOfBirth || '-').toUpperCase(),
    tglLahir: m.dateOfBirth || '-',
    agama: (m.religion || '-').toUpperCase(),
    pendidikan: (m.educationLevel || '-').toUpperCase(),
    pekerjaan: (m.occupation || '-').toUpperCase(),
    golDarah: (m.bloodType && m.bloodType !== '-' ? m.bloodType : '-').toUpperCase(),
  }));

  autoTable(pdf, {
    columns: table1Columns,
    body: table1Rows,
    startY: startMetaY + lineSpacing * 3 + 4,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [50, 50, 50],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [235, 238, 242],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      no: { halign: 'center', cellWidth: 8 },
      nama: { cellWidth: 48 },
      nik: { halign: 'center', cellWidth: 34 },
      jk: { halign: 'center', cellWidth: 24 },
      tempatLahir: { cellWidth: 26 },
      tglLahir: { halign: 'center', cellWidth: 22 },
      agama: { halign: 'center', cellWidth: 20 },
      pendidikan: { cellWidth: 30 },
      pekerjaan: { cellWidth: 39 },
      golDarah: { halign: 'center', cellWidth: 18 },
    },
  });

  const lastTable1Y = (pdf as any).lastAutoTable.finalY || 90;

  // 4. TABEL 2 (Status Hukum, Hubungan & Orang Tua)
  const table2Columns = [
    { header: 'No', dataKey: 'no' },
    { header: 'Status Perkawinan', dataKey: 'statusKawin' },
    { header: 'Tanggal Perkawinan', dataKey: 'tglKawin' },
    { header: 'Status Hubungan Dalam Keluarga', dataKey: 'shdk' },
    { header: 'Kewarganegaraan', dataKey: 'kewarganegaraan' },
    { header: 'No. Paspor', dataKey: 'paspor' },
    { header: 'No. KITAS / KITAP', dataKey: 'kitas' },
    { header: 'Nama Ayah', dataKey: 'ayah' },
    { header: 'Nama Ibu', dataKey: 'ibu' },
  ];

  const table2Rows = members.map((m, idx) => ({
    no: idx + 1,
    statusKawin: (m.maritalStatus || '-').toUpperCase(),
    tglKawin: (m.marriageDate || '-').toUpperCase(),
    shdk: (m.relationshipToHeadOfFamily || '-').toUpperCase(),
    kewarganegaraan: (m.nationality || 'WNI').toUpperCase(),
    paspor: (m.passportNumber || '-').toUpperCase(),
    kitas: (m.kitasNumber || '-').toUpperCase(),
    ayah: (m.fatherName || '-').toUpperCase(),
    ibu: (m.motherName || '-').toUpperCase(),
  }));

  autoTable(pdf, {
    columns: table2Columns,
    body: table2Rows,
    startY: lastTable1Y + 4,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [50, 50, 50],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [235, 238, 242],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      no: { halign: 'center', cellWidth: 8 },
      statusKawin: { halign: 'center', cellWidth: 28 },
      tglKawin: { halign: 'center', cellWidth: 26 },
      shdk: { cellWidth: 48 },
      kewarganegaraan: { halign: 'center', cellWidth: 24 },
      paspor: { halign: 'center', cellWidth: 24 },
      kitas: { halign: 'center', cellWidth: 24 },
      ayah: { cellWidth: 43 },
      ibu: { cellWidth: 44 },
    },
  });

  const lastTable2Y = (pdf as any).lastAutoTable.finalY || 140;

  // 5. Bagian Tanda Tangan
  const sigY = Math.min(lastTable2Y + 8, 175);
  const now = new Date();
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const formattedDate = tanggalCetak || `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'normal');

  // Kiri: Kepala Keluarga
  const sigLeftX = margin + 10;
  pdf.text('KEPALA KELUARGA', sigLeftX, sigY + 5);
  pdf.setFont('helvetica', 'bold');
  const namaKeluargaUpper = (kepalaKeluarga || '-').toUpperCase();
  pdf.text(namaKeluargaUpper, sigLeftX, sigY + 23);
  const widthKeluarga = pdf.getTextWidth(namaKeluargaUpper);
  pdf.setLineWidth(0.2);
  pdf.line(sigLeftX, sigY + 24, sigLeftX + widthKeluarga, sigY + 24);

  // Kanan: Kepala Desa Sampeldes
  const sigRightX = pageWidth - margin - 60;
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Sampeldes, ${formattedDate}`, sigRightX, sigY);
  pdf.text('KEPALA DESA SAMPELDES', sigRightX, sigY + 5);
  pdf.setFont('helvetica', 'bold');
  const namaKadesUpper = (kepalaDesaName || 'TUKIMAN').toUpperCase();
  pdf.text(namaKadesUpper, sigRightX, sigY + 23);
  const widthKades = pdf.getTextWidth(namaKadesUpper);
  pdf.line(sigRightX, sigY + 24, sigRightX + widthKades, sigY + 24);

  // Simpan / Download Berkas
  const cleanKk = String(noKk || 'KK').replace(/\D/g, '');
  const cleanName = String(kepalaKeluarga || 'Keluarga').replace(/[^a-zA-Z0-9]/g, '_');
  pdf.save(`Salinan_KK_${cleanKk}_${cleanName}.pdf`);
}
