
import { jsPDF } from "jspdf";
import { format, lastDayOfMonth } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { loadImage } from "./pdf-utils";

interface AttendanceReportData {
  month: string;
  year: string;
  data: any[];
  logoBase64?: string | null;
  settings?: any;
}

const DAYS_MAP = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

export const generateAttendancePDF = async (report: AttendanceReportData): Promise<Blob> => {
  const { month, year, data, logoBase64, settings } = report;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);
  const monthIdx = parseInt(month) - 1;
  const dateObj = new Date(parseInt(year), monthIdx, 1);
  const monthName = format(dateObj, "MMMM", { locale: localeID }).toUpperCase();
  const daysInMonth = new Date(parseInt(year), monthIdx + 1, 0).getDate();

  const logoSource = (logoBase64 && logoBase64.length > 50) ? logoBase64 : "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Lambang_Kabupaten_Cilacap.png/120px-Lambang_Kabupaten_Cilacap.png";
  const logoImg = await loadImage(logoSource);

  const addLandscapeKop = () => {
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', margin + 10, 10, 15, 18);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PEMERINTAH KABUPATEN CILACAP", pageWidth / 2, 14, { align: "center" });
    doc.text("KECAMATAN GANDRUNGMANGU", pageWidth / 2, 19, { align: "center" });
    doc.setFontSize(14);
    doc.text("DESA SAMPELDES", pageWidth / 2, 25, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Jl. Slamet Riyadi No. 60, Desa Sampeldes, Kec. Gandrungmangu, Cilacap, Jawa Tengah,", pageWidth / 2, 29, { align: "center" });
    doc.text("Tlp. 0877-0524-5801, Laman : www.sampeldes-cilacap.desa.id, Pos-el : www.sampeldes2020@gmail.com", pageWidth / 2, 33, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(margin, 35, pageWidth - margin, 35);
    doc.setLineWidth(0.1);
    doc.line(margin, 35.8, pageWidth - margin, 35.8);
  };

  addLandscapeKop();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const title = `ABSENSI PERANGKAT DESA SAMPELDES BULAN ${monthName} ${year}`;
  doc.text(title, pageWidth / 2, 48, { align: "center" });

  let currentY = 54;
  const colNoW = 8;
  const colNameW = 45;
  const colDayW = (contentWidth - colNoW - colNameW - 25) / 31;

  const drawHeader = (y: number) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    let x = margin;

    doc.rect(x, y, colNoW, 8);
    doc.text("NO", x + colNoW / 2, y + 5, { align: "center" });
    x += colNoW;

    doc.rect(x, y, colNameW, 8);
    doc.text("NAMA / JABATAN", x + colNameW / 2, y + 5, { align: "center" });
    x += colNameW;

    for (let i = 1; i <= 31; i++) {
      if (i <= daysInMonth) {
        const checkDate = new Date(parseInt(year), monthIdx, i);
        const dayName = DAYS_MAP[checkDate.getDay()];
        const dateStr = `${year}-${month}-${i.toString().padStart(2, '0')}`;
        const isWeekend = settings?.hari_kerja ? !settings.hari_kerja.includes(dayName) : false;
        const isManualHoliday = settings?.hari_libur ? settings.hari_libur.includes(dateStr) : false;

        if (isWeekend || isManualHoliday) {
          doc.setFillColor(255, 200, 200);
          doc.rect(x, y, colDayW, 8, 'F');
        }
      }
      doc.rect(x, y, colDayW, 8);
      doc.text(i.toString(), x + colDayW / 2, y + 5, { align: "center" });
      x += colDayW;
    }

    const stats = ["H", "T", "S", "TK", "DL"];
    const statWTotal = 25 / 5;
    stats.forEach(s => {
      doc.rect(x, y, statWTotal, 8);
      doc.text(s, x + statWTotal / 2, y + 5, { align: "center" });
      x += statWTotal;
    });

    return y + 8;
  };

  currentY = drawHeader(currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);

  data.forEach((row, i) => {
    const rowH = 7;
    if (currentY + rowH > pageHeight - 50) {
      doc.addPage();
      addLandscapeKop();
      currentY = drawHeader(40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
    }

    let x = margin;

    doc.rect(x, currentY, colNoW, rowH);
    doc.text((i + 1).toString(), x + colNoW / 2, currentY + 4.5, { align: "center" });
    x += colNoW;

    doc.rect(x, currentY, colNameW, rowH);
    doc.setFont("helvetica", "bold");
    doc.text(row.name.substring(0, 25), x + 1, currentY + 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.text(row.jabatan.substring(0, 35), x + 1, currentY + 5.5);
    doc.setFontSize(6);
    x += colNameW;

    for (let d = 1; d <= 31; d++) {
      if (d <= daysInMonth) {
        const checkDate = new Date(parseInt(year), monthIdx, d);
        const dayName = DAYS_MAP[checkDate.getDay()];
        const dateStr = `${year}-${month}-${d.toString().padStart(2, '0')}`;
        const isWeekend = settings?.hari_kerja ? !settings.hari_kerja.includes(dayName) : false;
        const isManualHoliday = settings?.hari_libur ? settings.hari_libur.includes(dateStr) : false;

        if (isWeekend || isManualHoliday) {
          doc.setFillColor(255, 235, 235);
          doc.rect(x, currentY, colDayW, rowH, 'F');
        }
      }

      doc.rect(x, currentY, colDayW, rowH);

      if (d <= daysInMonth) {
        const record = row.attendance[d];
        if (record) {
          let mark = "";
          // Logika baru: Jika masuk tapi tidak pulang, anggap terlambat (T)
          const isStillWorking = record.jam_masuk && !record.jam_pulang && record.status !== 'alpha' && record.status !== 'izin' && record.status !== 'dinas_luar';

          if (record.status === 'alpha') mark = "TK";
          else if (record.status === 'izin') mark = "S";
          else if (record.status === 'dinas_luar') mark = "DL";
          else if (isStillWorking || record.status === 'telat') mark = "T";
          else if (record.status === 'hadir') mark = "H";

          if (mark === "H") doc.setTextColor(0, 150, 0);
          else if (mark === "TK") doc.setTextColor(200, 0, 0);
          else if (mark === "T") doc.setTextColor(230, 81, 0); // Orange for T
          else if (mark === "S") doc.setTextColor(2, 132, 199); // Blue for S
          else if (mark === "DL") doc.setTextColor(109, 40, 217); // Purple for DL
          else doc.setTextColor(0, 0, 0);

          doc.text(mark, x + colDayW / 2, currentY + 4.5, { align: "center" });
          doc.setTextColor(0, 0, 0);
        }
      } else {
        doc.setFillColor(240, 240, 240);
        doc.rect(x, currentY, colDayW, rowH, 'F');
        doc.rect(x, currentY, colDayW, rowH);
      }
      x += colDayW;
    }

    const statWTotal = 25 / 5;
    [row.stats.h, row.stats.t, row.stats.s, row.stats.tk, row.stats.dl].forEach(statVal => {
      doc.rect(x, currentY, statWTotal, rowH);
      doc.text(statVal.toString(), x + statWTotal / 2, currentY + 4.5, { align: "center" });
      x += statWTotal;
    });

    currentY += rowH;
  });

  const lastDay = lastDayOfMonth(dateObj);
  const footerDate = format(lastDay, "d MMMM yyyy", { locale: localeID });

  // Cek apakah halaman cukup untuk tabel keterangan + tanda tangan (tinggi sekitar 35mm)
  if (currentY > pageHeight - 48) {
    doc.addPage();
    addLandscapeKop();
    currentY = 42;
  }

  // --- KOTAK PENJELASAN KETERANGAN (LEGENDA DI BAWAH TABEL) ---
  const legendX = margin;
  const legendY = currentY + 4;
  const legendW = 145;
  const legendH = 26;

  // Background dan Border Kotak Keterangan
  doc.setFillColor(252, 252, 252);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.rect(legendX, legendY, legendW, legendH, 'FD');

  // Judul Keterangan
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("KETERANGAN KODE PRESENSI :", legendX + 3.5, legendY + 5.5);

  // Kolom Kiri Legenda: H, T, S
  const col1X = legendX + 4;
  doc.setFontSize(7);

  // H - Hadir
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 150, 0);
  doc.text("H", col1X, legendY + 11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(": Hadir (Tepat Waktu)", col1X + 7, legendY + 11);

  // T - Terlambat
  doc.setFont("helvetica", "bold");
  doc.setTextColor(230, 81, 0);
  doc.text("T", col1X, legendY + 16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(": Terlambat", col1X + 7, legendY + 16);

  // S - Sakit / Izin
  doc.setFont("helvetica", "bold");
  doc.setTextColor(2, 132, 199);
  doc.text("S", col1X, legendY + 21);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(": Sakit / Izin / Cuti", col1X + 7, legendY + 21);

  // Kolom Kanan Legenda: TK, DL & Warna Libur
  const col2X = legendX + 68;

  // TK - Tanpa Keterangan
  doc.setFont("helvetica", "bold");
  doc.setTextColor(200, 0, 0);
  doc.text("TK", col2X, legendY + 11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(": Tanpa Keterangan (Alpha)", col2X + 9, legendY + 11);

  // DL - Dinas Luar
  doc.setFont("helvetica", "bold");
  doc.setTextColor(109, 40, 217);
  doc.text("DL", col2X, legendY + 16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(": Dinas Luar", col2X + 9, legendY + 16);

  // Libur / Akhir Pekan
  doc.setFillColor(255, 235, 235);
  doc.rect(col2X, legendY + 18.5, 4.5, 3.5, 'F');
  doc.setDrawColor(220, 160, 160);
  doc.rect(col2X, legendY + 18.5, 4.5, 3.5, 'D');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(": Hari Libur Resmi / Bebas Presensi", col2X + 9, legendY + 21.2);

  // Reset warna
  doc.setTextColor(0, 0, 0);

  // --- TANDA TANGAN KEPALA DESA ---
  const sigX = pageWidth - margin - 60;
  const sigY = legendY + 2;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Sampeldes, ${footerDate}`, sigX, sigY);
  doc.setFont("helvetica", "bold");
  doc.text("Kepala Desa Sampeldes,", sigX, sigY + 5);

  const kadesY = sigY + 20;
  doc.text("TUKIMAN", sigX, kadesY);
  const nW = doc.getTextWidth("TUKIMAN");
  doc.setLineWidth(0.3);
  doc.line(sigX, kadesY + 1, sigX + nW, kadesY + 1);

  return doc.output("blob");
};
