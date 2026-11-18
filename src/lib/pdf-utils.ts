
import { jsPDF } from "jspdf"
import { format, getDate, getMonth, getYear, addMinutes as dateAddMinutes } from "date-fns"
import { id as localeID } from "date-fns/locale"

const LOGO_CILACAP_FALLBACK = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Lambang_Kabupaten_Cilacap.png/120px-Lambang_Kabupaten_Cilacap.png";

export const resolveLogoSource = (logoBase64?: string | null): string => {
  if (!logoBase64 || typeof logoBase64 !== "string") {
    return LOGO_CILACAP_FALLBACK;
  }
  const clean = logoBase64.trim();
  if (clean.length < 50) {
    return LOGO_CILACAP_FALLBACK;
  }
  if (clean.startsWith("data:image/") || clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("/")) {
    return clean;
  }
  return `data:image/png;base64,${clean}`;
};

export const getRomanMonth = (dateStr: string) => {
  if (!dateStr) return "I";
  const month = new Date(dateStr).getMonth() + 1
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]
  return roman[month - 1]
}

/**
 * Konversi angka menjadi teks terbilang bahasa Indonesia.
 * Mendukung ribuan, jutaan, hingga miliaran.
 */
export const terbilang = (n: number): string => {
  if (n === 0) return "nol";
  const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  let temp = "";
  if (n < 12) {
    temp = " " + satuan[n];
  } else if (n < 20) {
    temp = terbilang(n - 10) + " belas";
  } else if (n < 100) {
    temp = terbilang(Math.floor(n / 10)) + " puluh";
    if (n % 10 !== 0) temp += " " + terbilang(n % 10);
  } else if (n < 200) {
    temp = " seratus";
    if (n - 100 !== 0) temp += " " + terbilang(n - 100);
  } else if (n < 1000) {
    temp = terbilang(Math.floor(n / 100)) + " ratus";
    if (n % 100 !== 0) temp += " " + terbilang(n % 100);
  } else if (n < 2000) {
    temp = " seribu";
    if (n - 1000 !== 0) temp += " " + terbilang(n - 1000);
  } else if (n < 1000000) {
    temp = terbilang(Math.floor(n / 1000)) + " ribu";
    if (n % 1000 !== 0) temp += " " + terbilang(n % 1000);
  } else if (n < 1000000000) {
    temp = terbilang(Math.floor(n / 1000000)) + " juta";
    if (n % 1000000 !== 0) temp += " " + terbilang(n % 1000000);
  } else if (n < 1000000000000) {
    temp = terbilang(Math.floor(n / 1000000000)) + " miliar";
    if (n % 1000000000 !== 0) temp += " " + terbilang(n % 1000000000);
  }
  return temp.trim();
};

const hitungLamaHari = (mulai: string, selesai: string): number => {
  const start = new Date(mulai);
  const end = new Date(selesai);
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((utcEnd - utcStart) / (1000 * 60 * 60 * 24)) + 1;
};

export const loadImage = (url: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    // JANGAN gunakan crossOrigin anonymous pada data: atau blob: URI karena memicu blokir CORS / SecurityError
    if (!url.startsWith("data:") && !url.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Jika URL gagal dan bukan fallback, coba fallback sebagai opsi terakhir
      if (url !== LOGO_CILACAP_FALLBACK) {
        const fallback = new Image();
        fallback.crossOrigin = "anonymous";
        fallback.onload = () => resolve(fallback);
        fallback.onerror = () => resolve(null);
        fallback.src = LOGO_CILACAP_FALLBACK;
      } else {
        resolve(null);
      }
    };
    img.src = url;
  });
};

export const addKopSuratSync = (doc: jsPDF, img: HTMLImageElement | null, margin: number, pageWidth: number) => {
  if (img) {
    try {
      let format: string | undefined = undefined;
      const src = img.src || "";
      if (src.startsWith("data:image/jpeg") || src.startsWith("data:image/jpg")) {
        format = "JPEG";
      } else if (src.startsWith("data:image/png")) {
        format = "PNG";
      } else if (src.startsWith("data:image/webp")) {
        format = "WEBP";
      }

      if (format) {
        doc.addImage(img, format, margin, 10, 18, 22);
      } else {
        try {
          doc.addImage(img, "PNG", margin, 10, 18, 22);
        } catch {
          doc.addImage(img, "JPEG", margin, 10, 18, 22);
        }
      }
    } catch (e) {
      console.error("PDF Logo Error:", e);
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("PEMERINTAH KABUPATEN CILACAP", pageWidth / 2 + 10, 15, { align: "center" });
  doc.text("KECAMATAN GANDRUNGMANGU", pageWidth / 2 + 10, 20, { align: "center" });
  doc.setFontSize(16);
  doc.text("DESA SAMPELDES", pageWidth / 2 + 10, 27, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Jl. Slamet Riyadi No. 60, Desa Sampeldes, Kec. Gandrungmangu, Cilacap, Jawa Tengah,", pageWidth / 2 + 10, 31, { align: "center" });
  doc.text("Tlp. 0877-0524-5801, Laman : www.sampeldes-cilacap.desa.id, Pos-el : www.sampeldes2020@gmail.com", pageWidth / 2 + 10, 35, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text("Kode Pos 53254", pageWidth - margin, 38.5, { align: "right" });
  doc.setLineWidth(0.8);
  doc.line(margin, 40, pageWidth - margin, 40);
  doc.setLineWidth(0.2);
  doc.line(margin, 41, pageWidth - margin, 41);
}

export const formatTanggalSurat = (startDate: Date, endDate?: Date) => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  const startDay = format(start, "d", { locale: localeID });
  const startMonthYear = format(start, "MMMM yyyy", { locale: localeID });
  if (!end || start.toDateString() === end.toDateString()) {
    return `pada tanggal ${format(start, "d MMMM yyyy", { locale: localeID })}`;
  }
  const endDay = format(end, "d", { locale: localeID });
  const endMonthYear = format(end, "MMMM yyyy", { locale: localeID });
  if (start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear()) {
    return `pada tanggal ${startDay} ${format(start, "MMMM", { locale: localeID })} s.d ${format(end, "d MMMM yyyy", { locale: localeID })}`;
  }
  return `pada tanggal ${startDay} s.d ${endDay} ${startMonthYear}`;
};

const formatDateIndo = (dateStr: string) => {
  if (!dateStr || dateStr === "-" || dateStr === "") return "-";
  try {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    return format(dateObj, "d MMMM yyyy", { locale: localeID });
  } catch (e) {
    return dateStr;
  }
};

const formatHariTanggalIndo = (dateStr: string) => {
  if (!dateStr || dateStr === "-" || dateStr === "") return "-";
  try {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    return format(dateObj, "EEEE, d MMMM yyyy", { locale: localeID });
  } catch (e) {
    return dateStr;
  }
};

const formatWaktuIndo = (timeStr?: string) => {
  if (!timeStr || timeStr.trim() === "") return "Pukul 09.00 WIB s.d selesai";
  const clean = timeStr.trim();
  if (clean.toLowerCase().includes("pukul")) {
    return clean;
  }
  const formattedTime = clean.replace(":", ".");
  if (formattedTime.toLowerCase().includes("wib")) {
    return `Pukul ${formattedTime}`;
  }
  return `Pukul ${formattedTime} WIB s.d selesai`;
};

export const generateNotulenPDF = async (values: any, logoBase64?: string | null): Promise<Blob> => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);
  const logoSource = resolveLogoSource(logoBase64);
  const logoImg = await loadImage(logoSource);

  // 1. Tambahkan Kop Surat di Halaman 1
  addKopSuratSync(doc, logoImg, margin, pageWidth);

  // 2. Judul NOTULEN (posisi efisien di Y=48 agar hemat ruang vertikal)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("NOTULEN", pageWidth / 2, 48.5, { align: "center" });

  // 3. Metadata Rapat (Kegiatan, Hari/Tanggal, Waktu, Tempat)
  const labelWidth = 26;
  const colonX = margin + labelWidth;
  const valueStartX = colonX + 3;
  const valueWidth = contentWidth - labelWidth - 3;
  const displayHariTanggal = formatHariTanggalIndo(values.date);
  const displayWaktu = formatWaktuIndo(values.time);

  let currentY = 54.5;
  const addLabeledRow = (label: string, text: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(label, margin, currentY);
    doc.text(":", colonX, currentY);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text || "-", valueWidth);
    lines.forEach((line: string, i: number) => {
      doc.text(line, valueStartX, currentY + (i * 4.3));
    });
    currentY += Math.max(lines.length * 4.3, 4.3) + 1.6;
  };

  addLabeledRow("Kegiatan", values.title);
  addLabeledRow("Hari/Tanggal", displayHariTanggal);
  addLabeledRow("Waktu", displayWaktu);
  addLabeledRow("Tempat", values.location || "Balai Desa Sampeldes");

  // Garis pemisah horizontal tipis di bawah metadata
  doc.setLineWidth(0.2);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6; // Jarak ke awal alinea notulen

  // 4. Pengolahan Isi Notulen (Smart Auto-fit: paksakan 3 alinea menjadi 1 lembar)
  const descriptionText = values.description || "(Belum ada isi ringkasan)";
  const rawParagraphs = descriptionText
    .split('\n')
    .map((p: string) => p.trim())
    .filter((p: string) => p.length > 0);

  // Hitung perkiraan total baris jika menggunakan font standar
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let totalRawLines = 0;
  rawParagraphs.forEach((p: string) => {
    totalRawLines += doc.splitTextToSize(p, contentWidth).length;
  });

  // Penyesuaian adaptif cerdas:
  // Redaksi 3 alinea (biasanya 20-33 baris) disesuaikan line-spacing & font agar PASTI MUAT 1 LEMBAR
  let fontSize = 10;
  let lineStep = 4.3;
  let paraSpacing = 3.6;

  if (totalRawLines <= 22) {
    fontSize = 10;
    lineStep = 4.4;
    paraSpacing = 4.0;
  } else if (totalRawLines <= 33) {
    // 3 alinea panjang / standar: padatkan proporsional agar pasti muat 1 lembar
    fontSize = 9.5;
    lineStep = 4.0;
    paraSpacing = 3.2;
  } else if (totalRawLines <= 38) {
    // 3-4 alinea padat: font 9pt dengan spasi efisien
    fontSize = 9.0;
    lineStep = 3.8;
    paraSpacing = 2.8;
  } else {
    // Teks sangat panjang (>40 baris / multi halaman), gunakan ukuran standar dinas 10pt
    fontSize = 10;
    lineStep = 4.4;
    paraSpacing = 4.0;
  }

  doc.setFontSize(fontSize);

  // Batas bawah halaman 1 agar tanda tangan (butuh ~30mm) muat di bawahnya
  const safeBottomY = 248;
  const safeBottomYMulti = 268;

  // Render alinea demi alinea dengan rata kanan-kiri (Justified)
  rawParagraphs.forEach((para: string) => {
    const lines = doc.splitTextToSize(para, contentWidth);
    const paraHeight = lines.length * lineStep;
    const currentMaxY = doc.getNumberOfPages() === 1 ? safeBottomY : safeBottomYMulti;

    // Jika seluruh alinea muat di halaman saat ini:
    if (currentY + paraHeight <= currentMaxY) {
      doc.text(lines, margin, currentY, { align: "justify", maxWidth: contentWidth });
      currentY += (lines.length * lineStep) + paraSpacing;
    } else {
      // Jika alinea tidak muat, buat halaman baru
      doc.addPage();
      addKopSuratSync(doc, logoImg, margin, pageWidth);
      // PENTING: Garis kop surat selesai di Y=41mm, maka teks halaman 2 MULAI DI Y=52mm (TIDAK MENABRAK KOP)
      currentY = 52;
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", "normal");

      // Cek apakah alinea muat di halaman baru
      if (currentY + paraHeight <= safeBottomYMulti) {
        doc.text(lines, margin, currentY, { align: "justify", maxWidth: contentWidth });
        currentY += (lines.length * lineStep) + paraSpacing;
      } else {
        // Jika alinea sangat panjang melebihi 1 halaman:
        const availableLines = Math.max(1, Math.floor((safeBottomYMulti - currentY) / lineStep));
        const part1 = lines.slice(0, availableLines);
        const part2 = lines.slice(availableLines);

        doc.text(part1, margin, currentY, { align: "justify", maxWidth: contentWidth });
        currentY += (part1.length * lineStep);

        doc.addPage();
        addKopSuratSync(doc, logoImg, margin, pageWidth);
        currentY = 52;
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", "normal");
        doc.text(part2, margin, currentY, { align: "justify", maxWidth: contentWidth });
        currentY += (part2.length * lineStep) + paraSpacing;
      }
    }
  });

  // 5. Tanda Tangan Pelaksana Kegiatan
  const signatureHeight = 32;
  if (currentY + signatureHeight > 275) {
    doc.addPage();
    addKopSuratSync(doc, logoImg, margin, pageWidth);
    currentY = 52;
  }

  const officialParts = (values.officialName || "").split(" - ");
  const signatureName = officialParts[0]?.trim()?.toUpperCase() || "PELAKSANA KEGIATAN";
  const signatureJabatan = officialParts[1]?.trim() || "";

  const signatureX = pageWidth - margin - 45;
  const signatureY = currentY + 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Pelaksana Kegiatan,", signatureX, signatureY, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.text(signatureName, signatureX, signatureY + 20, { align: "center" });

  const nameWidth = doc.getTextWidth(signatureName);
  doc.setLineWidth(0.3);
  doc.line(signatureX - (nameWidth / 2) - 2, signatureY + 21, signatureX + (nameWidth / 2) + 2, signatureY + 21);

  if (signatureJabatan) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(signatureJabatan, signatureX, signatureY + 25.5, { align: "center" });
  }

  // 6. Jika dokumen menjadi 2 lembar (multi-halaman), tambahkan nomor halaman resmi di footer
  const totalPages = doc.getNumberOfPages();
  if (totalPages > 1) {
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }
  }

  return doc.output("blob");
};

export const generateBASTPDF = async (values: any, logoBase64?: string | null): Promise<Blob> => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (margin * 2);
  const d = new Date(values.date);
  const logoSource = resolveLogoSource(logoBase64);
  const logoImg = await loadImage(logoSource);
  addKopSuratSync(doc, logoImg, margin, pageWidth);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const titleY = 56;
  const titleText = [
    "BERITA ACARA SERAH TERIMA 100 % PEKERJAAN PELAKSANA KEGIATAN",
    "ANGGARAN KEPADA PEMEGANG KEKUASAAN PENGELOLAAN KEUANGAN DESA"
  ];
  doc.text(titleText[0], pageWidth / 2, titleY, { align: "center" });
  doc.text(titleText[1], pageWidth / 2, titleY + 5, { align: "center" });
  const numY = titleY + 15;
  const numText = `Nomor : ..... / BA / ${getRomanMonth(values.date)} / ${getYear(d)}`;
  doc.text(numText, pageWidth / 2, numY, { align: "center" });
  const textWidth = doc.getTextWidth(numText);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - textWidth / 2, numY + 1, pageWidth / 2 + textWidth / 2, numY + 1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const openingY = numY + 12;
  const openingText = `Pada hari ini ${format(d, "EEEE", { locale: localeID })} tanggal ${terbilang(getDate(d))} bulan ${format(d, "MMMM", { locale: localeID })} tahun ${terbilang(getYear(d))} bertempat di Desa Sampeldes, kami yang bertanda tangan dibawah ini :`;
  const splitOpening = doc.splitTextToSize(openingText, contentWidth);
  doc.text(splitOpening, margin, openingY, { align: "justify", maxWidth: contentWidth });
  let currentY = openingY + (splitOpening.length * 5) + 6;
  const labelWidth = 25;
  const dotX = margin + labelWidth + 5;
  const addIdentitas = (num: string, name: string, job: string, role: string) => {
    doc.setFont("helvetica", "normal");
    doc.text(num, margin, currentY);
    doc.text("Nama", margin + 8, currentY);
    doc.text(":", dotX, currentY);
    doc.setFont("helvetica", "bold");
    doc.text(name.toUpperCase(), dotX + 3, currentY);
    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.text("Jabatan", margin + 8, currentY);
    doc.text(":", dotX, currentY);
    doc.text(job, dotX + 3, currentY);
    currentY += 6;
    doc.text("Alamat", margin + 8, currentY);
    doc.text(":", dotX, currentY);
    const alamatFull = `Desa Sampeldes Kecamatan Gandrungmangu yang selanjutnya disebut ${role}`;
    const splitAlamat = doc.splitTextToSize(alamatFull, contentWidth - labelWidth - 15);
    doc.text(splitAlamat, dotX + 3, currentY);
    currentY += (splitAlamat.length * 5) + 4;
  };
  const officialName = values.officialName?.split(" - ")[0] || "PETUGAS";
  const officialJob = values.officialName?.split(" - ")[1] || "PERANGKAT DESA";
  addIdentitas("I", officialName, `Pelaksana Kegiatan Anggaran (${officialJob})`, "PIHAK KESATU");
  addIdentitas("II", "TUKIMAN", "Pemegang Kekuasaan Pengelolaan Keuangan Desa", "PIHAK KEDUA");
  currentY += 2;
  const midText = "Dengan ini menyatakan bahwa PIHAK KESATU telah menyerahkan barang/pekerjaan kepada PIHAK KEDUA dan PIHAK KEDUA telah menerima barang/pekerjaan dari PIHAK KESATU berupa :";
  const splitMid = doc.splitTextToSize(midText, contentWidth);
  doc.text(splitMid, margin, currentY, { align: "justify", maxWidth: contentWidth });
  currentY += (splitMid.length * 5) + 8;
  const colW = [12, 105, 30, 33];
  const tableHeaders = ["NO", "NAMA KEGIATAN", "VOLUME", "TTD"];
  const headerH = 10;
  const rowH = 20;
  doc.setFont("helvetica", "bold");
  let hX = margin;
  tableHeaders.forEach((h, i) => {
    doc.rect(hX, currentY, colW[i], headerH);
    doc.text(h, hX + colW[i] / 2, currentY + 6.5, { align: "center" });
    hX += colW[i];
  });
  currentY += headerH;
  doc.setFont("helvetica", "normal");
  let rX = margin;
  doc.rect(rX, currentY, colW[0], rowH);
  doc.text("1", rX + colW[0] / 2, currentY + rowH / 2 + 1.5, { align: "center" });
  rX += colW[0];
  doc.rect(rX, currentY, colW[1], rowH);
  const splitKegiatan = doc.splitTextToSize(values.title || "-", colW[1] - 6);
  doc.text(splitKegiatan, rX + 3, currentY + (rowH / 2) - ((splitKegiatan.length - 1) * 2.5) + 1);
  rX += colW[1];
  doc.rect(rX, currentY, colW[2], rowH);
  doc.text("1 Kegiatan", rX + colW[2] / 2, currentY + rowH / 2 + 1.5, { align: "center" });
  rX += colW[2];
  doc.rect(rX, currentY, colW[3], rowH);
  currentY += rowH + 15;
  doc.text(`Sampeldes, ${format(d, "d MMMM yyyy", { locale: localeID })}`, pageWidth - margin, currentY, { align: "right" });
  const signY = currentY + 10;
  doc.setFont("helvetica", "bold");
  doc.text("PIHAK KEDUA", margin + 35, signY, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("Pemegang Kekuasaan", margin + 35, signY + 5, { align: "center" });
  doc.text("Pengelolaan Keuangan Desa", margin + 35, signY + 10, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text("PIHAK KESATU", pageWidth - margin - 35, signY, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("Pelaksana Kegiatan Anggaran", pageWidth - margin - 35, signY + 5, { align: "center" });
  const nameY = signY + 32;
  doc.setFont("helvetica", "bold");
  doc.text("TUKIMAN", margin + 35, nameY, { align: "center" });
  const w1 = doc.getTextWidth("TUKIMAN");
  doc.line(margin + 35 - w1 / 2, nameY + 1, margin + 35 + w1 / 2, nameY + 1);
  const sigName = officialName.toUpperCase();
  doc.text(sigName, pageWidth - margin - 35, nameY, { align: "center" });
  const w2 = doc.getTextWidth(sigName);
  doc.line(pageWidth - margin - 35 - w2 / 2, nameY + 1, pageWidth - margin - 35 + w2 / 2, nameY + 1);
  return doc.output("blob");
}

export const imageToJpegDataUrl = async (source: File | string): Promise<{ dataUrl: string; width: number; height: number }> => {
  // Helper internal untuk menggambar gambar ke canvas dan menghasilkan JPEG dataUrl murni
  const renderToJpegCanvas = (imageElement: HTMLImageElement): { dataUrl: string; width: number; height: number } => {
    const canvas = document.createElement("canvas");
    canvas.width = imageElement.naturalWidth || imageElement.width || 800;
    canvas.height = imageElement.naturalHeight || imageElement.height || 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Gagal menginisialisasi 2D Canvas context");
    // Isi background putih untuk mengantisipasi gambar PNG/transparan
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    return { dataUrl, width: canvas.width, height: canvas.height };
  };

  // Kasus 1: Sumber berupa File object lokal
  if (source instanceof File) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(source);
      const img = new window.Image();
      img.onload = () => {
        try {
          const result = renderToJpegCanvas(img);
          URL.revokeObjectURL(objectUrl);
          resolve(result);
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Gagal memuat file lokal ${source.name}`));
      };
      img.src = objectUrl;
    });
  }

  // Kasus 2: Sumber berupa string URL atau Base64 DataURL
  let url = source.trim();

  // Jika sudah merupakan JPEG data:image, kita dapatkan dimensinya langsung
  if (url.startsWith("data:image/jpeg") || url.startsWith("data:image/jpg")) {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve({ dataUrl: url, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
      img.onerror = reject;
      img.src = url;
    });
  }

  // Jika URL Cloudinary, optimalkan agar selalu dikirimkan format JPEG murni
  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    // Normalisasi transformasi agar f_jpg,q_auto selalu aktif dan replace f_auto jika ada
    url = url.replace(/\/upload\/(?:[^/]+\/)?(?=v\d+|[a-zA-Z0-9_-]+$)/, "/upload/f_jpg,q_auto/");
    if (!url.includes("f_jpg")) {
      url = url.replace("/upload/", "/upload/f_jpg,q_auto/");
    }
  }

  // Tambahkan query parameter khusus cache-buster untuk menghindari browser reusing tainted cache dari <img>
  const requestUrl = (!url.startsWith("data:") && !url.startsWith("blob:"))
    ? `${url}${url.includes("?") ? "&" : "?"}_pdf=${Date.now()}`
    : url;

  // Coba metode 1: HTMLImageElement dengan crossOrigin anonymous
  try {
    const result = await new Promise<{ dataUrl: string; width: number; height: number }>((resolve, reject) => {
      const img = new window.Image();
      if (!url.startsWith("data:") && !url.startsWith("blob:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        try {
          resolve(renderToJpegCanvas(img));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = (e) => reject(new Error("Image element load failed"));
      img.src = requestUrl;
    });
    return result;
  } catch (firstAttemptErr) {
    // Metode 2 (Fallback): Fetch blob langsung lalu jadikan object URL lokal (kebal terhadap CORS canvas tainting)
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const localBlobUrl = URL.createObjectURL(blob);
      const fallbackResult = await new Promise<{ dataUrl: string; width: number; height: number }>((resolve, reject) => {
        const fallbackImg = new window.Image();
        fallbackImg.onload = () => {
          try {
            const res = renderToJpegCanvas(fallbackImg);
            URL.revokeObjectURL(localBlobUrl);
            resolve(res);
          } catch (e) {
            URL.revokeObjectURL(localBlobUrl);
            reject(e);
          }
        };
        fallbackImg.onerror = (e) => {
          URL.revokeObjectURL(localBlobUrl);
          reject(e);
        };
        fallbackImg.src = localBlobUrl;
      });
      return fallbackResult;
    } catch (fallbackErr) {
      console.error("Gagal total memuat gambar untuk PDF:", url, fallbackErr);
      throw fallbackErr;
    }
  }
};

export const generateDokumentasiPDF = async (
  values: any,
  sectionTitle: string,
  files: Array<File | string>,
  logoBase64?: string | null
): Promise<Blob> => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);
  const logoSource = resolveLogoSource(logoBase64);
  const logoImg = await loadImage(logoSource);

  const addPageHeader = () => {
    addKopSuratSync(doc, logoImg, margin, pageWidth);

    // Cukup judul "LAPORAN DOKUMENTASI"
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("LAPORAN DOKUMENTASI", pageWidth / 2, 48.5, { align: "center" });

    // Metadata Rapat/Kegiatan
    const labelWidth = 26;
    const colonX = margin + labelWidth;
    const valueStartX = colonX + 3;
    const valueWidth = contentWidth - labelWidth - 3;
    const displayHariTanggal = formatHariTanggalIndo(values.date);
    const displayWaktu = formatWaktuIndo(values.time);

    let currentMetaY = 55;
    const addLabeledRow = (label: string, text: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(label, margin, currentMetaY);
      doc.text(":", colonX, currentMetaY);
      doc.setFont("helvetica", "normal");
      // Split text agar bila judul kegiatan panjang otomatis menjadi 2 baris (atau lebih)
      const lines = doc.splitTextToSize(text || "-", valueWidth);
      lines.forEach((line: string, i: number) => {
        doc.text(line, valueStartX, currentMetaY + (i * 4.4));
      });
      currentMetaY += Math.max(lines.length * 4.4, 4.4) + 1.8;
    };

    addLabeledRow("Kegiatan", values.title);
    addLabeledRow("Hari/Tanggal", displayHariTanggal);
    addLabeledRow("Waktu", displayWaktu);
    addLabeledRow("Tempat", values.location || "Balai Desa Sampeldes");

    // Garis pemisah horizontal tipis di bawah rincian metadata
    doc.setLineWidth(0.2);
    doc.line(margin, currentMetaY, pageWidth - margin, currentMetaY);
    return currentMetaY + 8;
  };

  let currentY = addPageHeader();
  for (let f = 0; f < files.length; f++) {
    const item = files[f];
    try {
      const { dataUrl, width, height } = await imageToJpegDataUrl(item);

      let imgWidth = contentWidth;
      let imgHeight = (height * imgWidth) / width;

      // Batasi tinggi jika melebihi ruang ideal foto (maks 130mm)
      if (imgHeight > 130) {
        imgHeight = 130;
        imgWidth = (width * imgHeight) / height;
      }

      // Jika sisa halaman tidak cukup untuk foto ini, buat halaman baru
      if (currentY + imgHeight > pageHeight - 20) {
        doc.addPage();
        currentY = addPageHeader();
      }

      const imgX = margin + (contentWidth - imgWidth) / 2;
      doc.addImage(dataUrl, 'JPEG', imgX, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 10;
    } catch (err) {
      console.warn("Gagal menambahkan foto ke dokumen PDF:", err);
    }
  }

  // Tambahkan nomor halaman di footer jika multi-halaman
  const totalPages = doc.getNumberOfPages();
  if (totalPages > 1) {
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }
  }

  return doc.output("blob");
};

export const generateSiltapPDF = async (values: any, logoBase64?: string | null): Promise<Blob> => {
  const doc = new jsPDF();
  const margin = 20;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  const logoSource = (logoBase64 && logoBase64.length > 50 && logoBase64.startsWith('data:image')) ? logoBase64 : LOGO_CILACAP_FALLBACK;
  const logoImg = await loadImage(logoSource);

  const colW = [10, 40, 55, 25, 40];
  const rowH = 12;
  const headers = ["NO", "NAMA", "JABATAN", "NOMINAL", "TTD"];

  const drawHeader = (startY: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    let hX = margin;
    headers.forEach((h, i) => {
      doc.rect(hX, startY, colW[i], 10);
      doc.text(h, hX + colW[i] / 2, startY + 6.5, { align: "center" });
      hX += colW[i];
    });
    return startY + 10;
  }

  addKopSuratSync(doc, logoImg, margin, pageWidth);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(values.title.toUpperCase(), pageWidth / 2, 56, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Bulan : ${values.month}`, margin, 66);

  let currentY = 71;
  currentY = drawHeader(currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  let totalSiltap = 0;
  const totalItems = values.data.length;
  const signatureSpace = 65;

  values.data.forEach((item: any, i: number) => {
    totalSiltap += (item.nominal || 0);
    const splitJabatan = doc.splitTextToSize(item.jabatan || "", colW[2] - 4);
    const splitNama = doc.splitTextToSize(item.name || "", colW[1] - 4);
    const itemHeight = Math.max(rowH, splitJabatan.length * 5 + 4, splitNama.length * 5 + 4);

    const remainingRows = totalItems - i;
    const neededSpaceForRemainder = (remainingRows * itemHeight) + signatureSpace;
    const spaceLeft = pageHeight - currentY;

    if (remainingRows <= 3 && spaceLeft < neededSpaceForRemainder) {
      doc.addPage();
      addKopSuratSync(doc, logoImg, margin, pageWidth);
      currentY = 40;
      currentY = drawHeader(currentY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    }
    else if (currentY + itemHeight > pageHeight - 20) {
      doc.addPage();
      addKopSuratSync(doc, logoImg, margin, pageWidth);
      currentY = 40;
      currentY = drawHeader(currentY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    }

    const startY = currentY;
    let rX = margin;

    doc.rect(rX, startY, colW[0], itemHeight);
    doc.text((i + 1).toString(), rX + colW[0] / 2, startY + (itemHeight / 2) + 1.5, { align: "center" });
    rX += colW[0];

    doc.rect(rX, startY, colW[1], itemHeight);
    doc.text(splitNama, rX + 2, startY + 5);
    rX += colW[1];

    doc.rect(rX, startY, colW[2], itemHeight);
    doc.text(splitJabatan, rX + 2, startY + 5);
    rX += colW[2];

    doc.rect(rX, startY, colW[3], itemHeight);
    doc.text((item.nominal || 0).toLocaleString('id-ID'), rX + colW[3] - 2, startY + (itemHeight / 2) + 1.5, { align: "right" });
    rX += colW[3];

    doc.rect(rX, startY, colW[4], itemHeight);
    const signX = (i % 2 === 0) ? rX + 3 : rX + (colW[4] / 2);
    doc.setFontSize(8);
    doc.text(`${i + 1}. .......`, signX, startY + (itemHeight / 2) + 1);
    doc.setFontSize(10);

    currentY += itemHeight;
  });

  // BARIS TOTAL
  const totalH = 10;
  if (currentY + totalH > pageHeight - 20) {
    doc.addPage();
    addKopSuratSync(doc, logoImg, margin, pageWidth);
    currentY = 40;
    currentY = drawHeader(currentY);
  }

  const startTotalY = currentY;
  const totalLabelW = colW[0] + colW[1] + colW[2];
  doc.setFont("helvetica", "bold");
  doc.rect(margin, startTotalY, totalLabelW, totalH);
  doc.text("TOTAL", margin + totalLabelW / 2, startTotalY + 6.5, { align: "center" });

  doc.rect(margin + totalLabelW, startTotalY, colW[3], totalH);
  doc.text(totalSiltap.toLocaleString('id-ID'), margin + totalLabelW + colW[3] - 2, startTotalY + 6.5, { align: "right" });

  doc.rect(margin + totalLabelW + colW[3], startTotalY, colW[4], totalH);
  currentY += totalH;

  if (currentY > pageHeight - 60) {
    doc.addPage();
    addKopSuratSync(doc, logoImg, margin, pageWidth);
    currentY = 40;
  }

  currentY += 15;
  const sigX = pageWidth - margin - 65;
  doc.setFont("helvetica", "normal");
  doc.text(`Sampeldes, ${formatDateIndo(values.date)}`, sigX, currentY);
  doc.setFont("helvetica", "bold");
  doc.text("Kepala Desa Sampeldes,", sigX, currentY + 6);
  currentY += 25;
  doc.text("TUKIMAN", sigX, currentY);
  const nW = doc.getTextWidth("TUKIMAN");
  doc.line(sigX, currentY + 1, sigX + nW, currentY + 1);

  return doc.output("blob");
}

export const generateInsentifPDF = async (values: any, logoBase64?: string | null): Promise<Blob> => {
  const doc = new jsPDF();
  const margin = 15;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoSource = (logoBase64 && logoBase64.length > 50 && logoBase64.startsWith('data:image')) ? logoBase64 : LOGO_CILACAP_FALLBACK;
  const logoImg = await loadImage(logoSource);
  const nom = parseInt(values.nominal) || 0;
  const taxPercent = parseInt(values.tax) || 0;
  const taxVal = Math.round(nom * (taxPercent / 100));
  const netVal = nom - taxVal;

  addKopSuratSync(doc, logoImg, margin, pageWidth);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`TANDA TERIMA INSENTIF ${values.category.toUpperCase()}`, pageWidth / 2, 56, { align: "center" });

  let currentY = 66;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Bulan : ${values.month}`, margin, currentY);
  currentY += 5;

  const colW = [10, 40, 40, 22, 18, 22, 28];
  const rowH = 10;
  const headers = ["NO", "NAMA", "JABATAN", "NOMINAL", "PAJAK", "DITERIMA", "TTD"];

  const drawHeader = (startY: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    let hX = margin;
    headers.forEach((h, i) => {
      doc.rect(hX, startY, colW[i], 10);
      doc.text(h, hX + colW[i] / 2, startY + 6.5, { align: "center" });
      hX += colW[i];
    });
    return startY + 10;
  }

  currentY = drawHeader(currentY);

  const kuota = values.jumlahOrang || 0;
  const totalItems = kuota;
  const signatureSpace = 65;

  let currentNominalTotal = 0;
  let currentTaxTotal = 0;
  let currentNetTotal = 0;

  for (let i = 0; i < totalItems; i++) {
    const p = values.participants?.[i] || { name: "", position: "" };

    if (p.name) {
      currentNominalTotal += nom;
      currentTaxTotal += taxVal;
      currentNetTotal += netVal;
    }

    const remainingRows = totalItems - i;
    const neededSpaceForRemainder = (remainingRows * rowH) + signatureSpace;
    const spaceLeft = pageHeight - currentY;

    if (remainingRows <= 3 && spaceLeft < neededSpaceForRemainder) {
      doc.addPage();
      addKopSuratSync(doc, logoImg, margin, pageWidth);
      currentY = 40;
      currentY = drawHeader(currentY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    }
    else if (currentY + rowH > pageHeight - 20) {
      doc.addPage();
      addKopSuratSync(doc, logoImg, margin, pageWidth);
      currentY = 40;
      currentY = drawHeader(currentY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    }

    let rX = margin;
    colW.forEach((w) => { doc.rect(rX, currentY, w, rowH); rX += w; });

    let cX = margin;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text((i + 1).toString(), cX + colW[0] / 2, currentY + 6.5, { align: "center" });
    cX += colW[0];

    doc.setFontSize(8);
    doc.text((p.name || "").toUpperCase(), cX + 2, currentY + 6.5, { maxWidth: colW[1] - 4 });
    cX += colW[1];
    doc.text((p.position || "").toUpperCase(), cX + 2, currentY + 6.5, { maxWidth: colW[2] - 4 });
    cX += colW[2];

    doc.setFontSize(9);
    if (p.name) {
      doc.text(nom.toLocaleString('id-ID'), cX + colW[3] - 2, currentY + 6.5, { align: "right" });
      cX += colW[3];
      doc.text(taxVal.toLocaleString('id-ID'), cX + colW[4] - 2, currentY + 6.5, { align: "right" });
      cX += colW[4];
      doc.text(netVal.toLocaleString('id-ID'), cX + colW[5] - 2, currentY + 6.5, { align: "right" });
      cX += colW[5];
    } else {
      cX += colW[3] + colW[4] + colW[5];
    }

    doc.setFontSize(8);
    const signX = (i % 2 === 0) ? cX + 2 : cX + (colW[6] / 2);
    doc.text(`${i + 1}. .......`, signX, currentY + 6.5);
    currentY += rowH;
  }

  // BARIS TOTAL UNTUK INSENTIF
  const totalH = 10;
  if (currentY + totalH > pageHeight - 20) {
    doc.addPage();
    addKopSuratSync(doc, logoImg, margin, pageWidth);
    currentY = 40;
    currentY = drawHeader(currentY);
  }

  const startTotalY = currentY;
  const totalLabelW = colW[0] + colW[1] + colW[2];
  doc.setFont("helvetica", "bold");
  doc.rect(margin, startTotalY, totalLabelW, totalH);
  doc.text("TOTAL", margin + totalLabelW / 2, startTotalY + 6.5, { align: "center" });

  let totalCX = margin + totalLabelW;
  doc.rect(totalCX, startTotalY, colW[3], totalH);
  doc.text(currentNominalTotal.toLocaleString('id-ID'), totalCX + colW[3] - 2, startTotalY + 6.5, { align: "right" });
  totalCX += colW[3];

  doc.rect(totalCX, startTotalY, colW[4], totalH);
  doc.text(currentTaxTotal.toLocaleString('id-ID'), totalCX + colW[4] - 2, startTotalY + 6.5, { align: "right" });
  totalCX += colW[4];

  doc.rect(totalCX, startTotalY, colW[5], totalH);
  doc.text(currentNetTotal.toLocaleString('id-ID'), totalCX + colW[5] - 2, startTotalY + 6.5, { align: "right" });
  totalCX += colW[5];

  doc.rect(totalCX, startTotalY, colW[6], totalH);
  currentY += totalH;

  if (currentY > pageHeight - 60) {
    doc.addPage();
    addKopSuratSync(doc, logoImg, margin, pageWidth);
    currentY = 40;
  }

  currentY += 15;
  const sigX = pageWidth - margin - 65;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Sampeldes, ${formatDateIndo(values.date)}`, sigX, currentY);
  doc.setFont("helvetica", "bold");
  doc.text("Kepala Desa Sampeldes,", sigX, currentY + 6);
  currentY += 25;
  doc.text("TUKIMAN", sigX, currentY);
  const nW = doc.getTextWidth("TUKIMAN");
  doc.line(sigX, currentY + 1, sigX + nW, currentY + 1);
  return doc.output("blob");
}

export const generateHonorNarasumberPDF = async (values: any, logoBase64?: string | null): Promise<Blob> => {
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const d = values.date ? new Date(values.date) : new Date();
  const logoSource = (logoBase64 && logoBase64.length > 50 && logoBase64.startsWith('data:image')) ? logoBase64 : LOGO_CILACAP_FALLBACK;
  const logoImg = await loadImage(logoSource);
  addKopSuratSync(doc, logoImg, margin, pageWidth);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const docHeading = (values.docTitle || "TANDA TERIMA HONORARIUM NARASUMBER").toUpperCase();
  doc.text(docHeading, pageWidth / 2, 56, { align: "center" });
  let currentY = 66;
  doc.setFontSize(10);
  const addHeaderRow = (label: string, text: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, currentY);
    doc.text(":", margin + 30, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(text || "-", margin + 33, currentY);
    currentY += 6;
  };
  addHeaderRow("Kegiatan", values.title);
  addHeaderRow("Hari / Tanggal", format(d, "EEEE, d MMMM yyyy", { locale: localeID }));
  addHeaderRow("Tempat", values.location || "Balai Desa Sampeldes");
  const timeFormatted = values.time
    ? (values.time.trim().toLowerCase().startsWith("pukul")
      ? values.time.trim()
      : `Pukul ${values.time.trim()}`)
    : "Pukul 09:00 WIB - Selesai";
  addHeaderRow("Waktu", timeFormatted);
  currentY += 4;
  const colW = [8, 40, 36, 24, 18, 24, 30];
  const headers = ["NO", "NAMA", "JABATAN", "HONOR", "PAJAK", "DITERIMA", "TANDA TANGAN"];
  const drawHeader = (startY: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    let hX = margin;
    headers.forEach((h, i) => {
      doc.rect(hX, startY, colW[i], 10);
      doc.text(h, hX + colW[i] / 2, startY + 6.5, { align: "center" });
      hX += colW[i];
    });
    return startY + 10;
  };
  currentY = drawHeader(currentY);
  doc.setFont("helvetica", "normal");
  const totalNarsum = values.narsum.length;
  values.narsum.forEach((item: any, i: number) => {
    const nom = parseInt(item.nominal) || 0;
    const taxPercent = parseInt(item.tax) || 0;
    const taxVal = Math.round(nom * (taxPercent / 100));
    const netVal = nom - taxVal;
    const splitName = doc.splitTextToSize((item.name || "").toUpperCase(), colW[1] - 4);
    const splitPos = doc.splitTextToSize((item.position || "").toUpperCase(), colW[2] - 4);
    const itemHeight = Math.max(12, splitName.length * 5 + 4, splitPos.length * 5 + 4);
    const isLast = i === totalNarsum - 1;
    const threshold = isLast ? pageHeight - 65 : pageHeight - 20;
    if (currentY + itemHeight > threshold) {
      doc.addPage();
      addKopSuratSync(doc, logoImg, margin, pageWidth);
      currentY = 40;
      currentY = drawHeader(currentY);
      doc.setFont("helvetica", "normal");
    }
    let cX = margin;
    doc.rect(cX, currentY, colW[0], itemHeight);
    doc.setFontSize(9);
    doc.text((i + 1).toString(), cX + colW[0] / 2, currentY + itemHeight / 2 + 1.5, { align: "center" });
    cX += colW[0];
    doc.rect(cX, currentY, colW[1], itemHeight);
    const nameOffsetY = currentY + (itemHeight - (splitName.length - 1) * 4) / 2 + 1.5;
    doc.text(splitName, cX + 2, nameOffsetY);
    cX += colW[1];
    doc.rect(cX, currentY, colW[2], itemHeight);
    const posOffsetY = currentY + (itemHeight - (splitPos.length - 1) * 4) / 2 + 1.5;
    doc.text(splitPos, cX + 2, posOffsetY);
    cX += colW[2];
    doc.rect(cX, currentY, colW[3], itemHeight);
    doc.setFontSize(8.5);
    doc.text(`Rp. ${nom.toLocaleString('id-ID')}`, cX + colW[3] / 2, currentY + itemHeight / 2 + 1.5, { align: "center" });
    cX += colW[3];
    doc.rect(cX, currentY, colW[4], itemHeight);
    doc.text(`Rp. ${taxVal.toLocaleString('id-ID')}`, cX + colW[4] / 2, currentY + itemHeight / 2 + 1.5, { align: "center" });
    cX += colW[4];
    doc.rect(cX, currentY, colW[5], itemHeight);
    doc.text(`Rp. ${netVal.toLocaleString('id-ID')}`, cX + colW[5] / 2, currentY + itemHeight / 2 + 1.5, { align: "center" });
    cX += colW[5];
    doc.rect(cX, currentY, colW[6], itemHeight);
    const isOdd = (i % 2 === 0);
    const signX = isOdd ? cX + 2 : cX + (colW[6] / 2);
    doc.setFontSize(8);
    doc.text(`${i + 1}. ....................`, signX, currentY + itemHeight / 2 + 1);
    doc.setFontSize(9);
    currentY += itemHeight;
  });
  if (currentY > pageHeight - 60) {
    doc.addPage();
    addKopSuratSync(doc, logoImg, margin, pageWidth);
    currentY = 40;
  }
  currentY += 15;
  const sigX = pageWidth - margin - 65;
  doc.text(`Sampeldes, ${formatDateIndo(values.date)}`, sigX, currentY);
  doc.setFont("helvetica", "bold");
  doc.text("Kepala Desa Sampeldes,", sigX, currentY + 6);
  currentY += 25;
  doc.text("TUKIMAN", sigX, currentY);
  const nW = doc.getTextWidth("TUKIMAN");
  doc.line(sigX, currentY + 1, sigX + nW, currentY + 1);
  return doc.output("blob");
}

export const generateHonorKegiatanPDF = generateHonorNarasumberPDF;

export const generateSuratTugasPDF = async (values: any, logoBase64?: string | null): Promise<Blob> => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const d = values.startDate ? new Date(values.startDate) : new Date();
  let currentY = 75;
  const logoSource = resolveLogoSource(logoBase64);
  const logoImg = await loadImage(logoSource);
  const ensurePageSpace = (neededHeight = 20) => {
    if (currentY + neededHeight > pageHeight - margin) {
      doc.addPage();
      currentY = 25;
      addHeader(true);
    }
  };
  const parsePerson = (value?: string) => {
    if (!value) return { name: "-", job: "-" };
    const parts = value.split(" - ").map((v) => v.trim());
    return { name: parts[0] || "-", job: parts[1] || "-" };
  };
  const addHeader = (isNewPage = false) => {
    if (!isNewPage) {
      addKopSuratSync(doc, logoImg, margin, pageWidth);
      currentY = 56;
    } else {
      currentY = 25;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("SURAT TUGAS", pageWidth / 2, currentY, { align: "center" });
    currentY += 5;
    const nomorSurat = values.letterNumber || ".....";
    doc.setFontSize(11);
    doc.text(`Nomor : ${nomorSurat}`, pageWidth / 2, currentY, { align: "center" });
    currentY += 14;
  };
  const drawDasar = () => {
    ensurePageSpace(40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Dasar", margin, currentY);
    doc.text(":", margin + 25, currentY);
    const numberX = margin + 28;
    const textX = margin + 35;
    const textWidth = pageWidth - textX - margin;
    const items = values.dasar ? values.dasar.split("\n").filter(Boolean) : [
      "Peraturan Bupati Cilacap Nomor 2 Tahun 2024 tentang Perjalanan Dinas.",
      "Peraturan Desa Sampeldes Nomor 16 tahun 2025 tentang Anggaran Pendapatan dan Belanja Desa (APBDes) Tahun Anggaran 2026.",
    ];
    items.forEach((item: string, index: number) => {
      ensurePageSpace(20);
      const lines = doc.splitTextToSize(item, textWidth);
      doc.text(`${index + 1}.`, numberX, currentY);
      doc.text(lines, textX, currentY, { align: "justify", maxWidth: textWidth, lineHeightFactor: 1.5 });
      currentY += lines.length * 6;
    });
    currentY += 6;
    doc.setFont("helvetica", "bold");
    doc.text("MEMERINTAHKAN:", pageWidth / 2, currentY, { align: "center" });
    currentY += 10;
  };
  const drawKepada = () => {
    ensurePageSpace(30);
    doc.setFont("helvetica", "normal");
    doc.text("Kepada", margin, currentY);
    doc.text(":", margin + 25, currentY);
    const renderPerson = (index: number, person: any) => {
      const numberX = margin + 28;
      const labelX = margin + 34;
      const colonX = margin + 60;
      const valueX = margin + 63;
      doc.setFont("helvetica", "normal");
      doc.text(`${index}.`, numberX, currentY);
      doc.text("Nama", labelX, currentY);
      doc.text(":", colonX, currentY);
      doc.setFont("helvetica", "bold");
      doc.text(String(person.name || "-").toUpperCase(), valueX, currentY);
      currentY += 6;
      doc.setFont("helvetica", "normal");
      doc.text("Jabatan", labelX, currentY);
      doc.text(":", colonX, currentY);
      doc.text(String(person.job || "-"), valueX, currentY);
      currentY += 8;
    };
    const official = parsePerson(values.officialName);
    renderPerson(1, official);
    const companions = (values.companions || "").split("\n").filter(Boolean);
    companions.forEach((item: string, i: number) => {
      const person = parsePerson(item);
      renderPerson(i + 2, person);
    });
    currentY += 4;
  };
  const drawUntuk = () => {
    ensurePageSpace(50);
    doc.setFont("helvetica", "normal");
    doc.text("Untuk", margin, currentY);
    doc.text(":", margin + 25, currentY);
    const numberX = margin + 28;
    const textX = margin + 35;
    const textWidth = pageWidth - textX - margin;
    const kegiatanDate = formatTanggalSurat(values.startDate, values.endDate);
    const items = [
      `Melaksanakan tugas dalam rangka ${values.description || "-"} ${kegiatanDate} di ${values.destination || "-"}.`,
      "Melaksanakan tugas dengan penuh rasa tanggungjawab sesuai dengan peraturan perundang-undangan yang berlaku;",
      "Melaporkan hasilnya setelah melaksanakan tugas;",
      "Surat ini digunakan untuk melengkapi administrasi pertanggungjawaban keuangan perjalanan dinas.",
    ];
    items.forEach((item, index) => {
      ensurePageSpace(20);
      const lines = doc.splitTextToSize(item, textWidth);
      doc.text(`${index + 1}.`, numberX, currentY);
      doc.text(lines, textX, currentY, { align: "justify", maxWidth: textWidth, lineHeightFactor: 1.5 });
      currentY += lines.length * 6;
    });
    currentY += 4;
  };
  const drawSignature = () => {
    ensurePageSpace(40);
    const sigX = pageWidth - margin - 60;
    doc.setFont("helvetica", "normal");
    doc.text(`Sampeldes, ${format(d, "d MMMM yyyy", { locale: localeID })}`, sigX, currentY);
    doc.setFont("helvetica", "bold");
    doc.text("Kepala Desa Sampeldes,", sigX, currentY + 6);
    currentY += 28;
    doc.text("TUKIMAN", sigX, currentY);
    const width = doc.getTextWidth("TUKIMAN");
    doc.line(sigX, currentY + 1, sigX + width, currentY + 1);
  };
  addHeader();
  drawDasar();
  drawKepada();
  drawUntuk();
  drawSignature();
  return doc.output("blob");
};

export const generateSPPDPDF = async (values: any, logoBase64?: string | null): Promise<Blob> => {
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);
  const d = values.startDate ? new Date(values.startDate) : new Date();
  const midX = pageWidth / 2;
  const logoSource = resolveLogoSource(logoBase64);
  const logoImg = await loadImage(logoSource);
  addKopSuratSync(doc, logoImg, margin, pageWidth);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const topInfoY = 46;
  const infoX = pageWidth - 85;
  const colonX = pageWidth - 65;
  const valX = pageWidth - 62;
  doc.text("Lembar ke", infoX, topInfoY);
  doc.text(":", colonX, topInfoY);
  doc.text(values.lembarKe || "", valX, topInfoY);
  doc.text("Kode No", infoX, topInfoY + 4.5);
  doc.text(":", colonX, topInfoY + 4.5);
  doc.text(values.kodeNo || "", valX, topInfoY + 4.5);
  doc.text("Nomor", infoX, topInfoY + 9);
  doc.text(":", colonX, topInfoY + 9);
  doc.text(values.documentNumber || "-", valX, topInfoY + 9);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("SURAT PERJALANAN DINAS (SPD)", pageWidth / 2, 65, { align: "center" });
  let currentY = 72;
  const col1W = 8;
  const col2W = 80;
  const col3W = contentWidth - col1W - col2W;
  const rowH = 7;
  const addRow = (no: string, label: string, val: string) => {
    const splitVal = doc.splitTextToSize(val || "-", col3W - 4);
    const splitLabel = doc.splitTextToSize(label || "-", col2W - 4);
    const lineHeight = 4.5;
    const textHeight = Math.max(splitVal.length, splitLabel.length) * lineHeight;
    const h = Math.max(rowH, textHeight + 4);
    doc.rect(margin, currentY, col1W, h);
    doc.text(no, margin + 2, currentY + 4);
    doc.rect(margin + col1W, currentY, col2W, h);
    doc.text(splitLabel, margin + col1W + 2, currentY + 4);
    doc.rect(margin + col1W + col2W, currentY, col3W, h);
    doc.text(splitVal, margin + col1W + col2W + 2, currentY + 4);
    currentY += h;
  };
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const officialName = (values.officialName || "PERSONEL").split(' - ')[0].toUpperCase();
  const officialJob = (values.officialName || "JABATAN").split(' - ')[1] || "PERANGKAT DESA";
  const lamaHari = hitungLamaHari(values.startDate, values.endDate);
  addRow("1", "Pejabat berwenang yang memberi perintah", "Kepala Desa Sampeldes");
  addRow("2", "Nama / NIP Pegawai yang diperintah", officialName);
  addRow("3", "a. Pangkat dan Golongan", "-");
  addRow("", "b. Jabatan / Instansi", officialJob);
  addRow("", "c. Tingkat Biaya Perjalanan Dinas", "-");
  addRow("4", "Maksud Perjalanan Dinas", values.description || "-");
  addRow("5", "Alat angkut yang dipergunakan", "Kendaraan Pribadi / Umum");
  addRow("6", "a. Tempat Berangkat", "Desa Sampeldes");
  addRow("", "b. Tempat Tujuan", values.destination || "-");
  addRow("7", "a. Lamanya perjalanan dinas", `${lamaHari} (${terbilang(lamaHari)}) hari`);
  addRow("", "b. Tanggal berangkat", formatDateIndo(values.startDate));
  addRow("", "c. Tanggal harus kembali", formatDateIndo(values.endDate));
  addRow("8", "Pengikut: Nama", values.companions ? values.companions.split('\n').join(', ') : "-");
  addRow("9", "Pembebanan Anggaran", "APBDes Desa Sampeldes 2026");
  addRow("", "a. Instansi", "Pemerintah Desa Sampeldes");
  addRow("", "b. Akun", "Belanja Perjalanan Dinas");
  addRow("10", "Keterangan Lain-lain", "-");
  currentY += 15;
  const sigX = pageWidth - margin - 65;
  doc.text(`Dikeluarkan di : Sampeldes`, sigX, currentY);
  doc.text(`Pada Tanggal   : ${format(d, "d MMMM yyyy", { locale: localeID })}`, sigX, currentY + 5);
  doc.setFont("helvetica", "bold");
  doc.text("Kepala Desa Sampeldes,", sigX, currentY + 12);
  currentY += 32;
  doc.text("TUKIMAN", sigX, currentY);
  const nW = doc.getTextWidth("TUKIMAN");
  doc.line(sigX, currentY + 1, sigX + nW, currentY + 1);
  doc.addPage();
  currentY = margin;
  const colW2 = (pageWidth - (margin * 2)) / 2;
  const rowH2 = 45;
  doc.setLineWidth(0.2);
  doc.rect(margin, margin, pageWidth - (margin * 2), rowH2 * 4 + 10 + 30);
  doc.line(midX, margin, midX, margin + (rowH2 * 4));
  for (let i = 1; i <= 4; i++) {
    doc.line(margin, margin + (rowH2 * i), pageWidth - margin, margin + (rowH2 * i));
  }
  doc.line(margin, margin + (rowH2 * 4) + 10, pageWidth - margin, margin + (rowH2 * 4) + 10);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");

  // Helper untuk mencetak field dengan text-wrapping otomatis pada kolom bergaris
  const drawFieldWithWrap = (
    label: string,
    val: string,
    lblX: number,
    colX: number,
    vX: number,
    startY: number,
    maxW: number,
    lineHeight = 3.8
  ): number => {
    doc.text(label, lblX, startY);
    doc.text(":", colX, startY);
    const splitLines = doc.splitTextToSize(val || "-", maxW);
    splitLines.forEach((line: string, idx: number) => {
      doc.text(line, vX, startY + (idx * lineHeight));
    });
    return startY + (Math.max(splitLines.length, 1) * lineHeight) + 1;
  };

  const colLeftMaxW = midX - (margin + 25) - 3; // ~62 mm
  const colRightMaxW = (pageWidth - margin) - (midX + 27) - 3; // ~60 mm

  // ==================== KOTAK I (Kanan) ====================
  doc.text("I.", midX + 2, margin + 4.5);
  let curY_I = margin + 4.5;
  curY_I = drawFieldWithWrap("Berangkat dari", "Desa Sampeldes", midX + 6, midX + 30, midX + 33, curY_I, 55);
  doc.setFontSize(7.5);
  doc.text("(Tempat Kedudukan)", midX + 33, curY_I - 0.5);
  curY_I += 3.5;
  doc.setFontSize(8.5);
  curY_I = drawFieldWithWrap("Ke", values.destination || "-", midX + 6, midX + 30, midX + 33, curY_I, 55);
  curY_I = drawFieldWithWrap("Pada tanggal", formatDateIndo(values.startDate), midX + 6, midX + 30, midX + 33, curY_I, 55);

  doc.setFont("helvetica", "bold");
  doc.text("Kepala Desa Sampeldes,", midX + colW2 / 2, margin + 28, { align: "center" });
  doc.text("TUKIMAN", midX + colW2 / 2, margin + 41, { align: "center" });
  const wH1 = doc.getTextWidth("TUKIMAN");
  doc.line(midX + colW2 / 2 - wH1 / 2, margin + 42, midX + colW2 / 2 + wH1 / 2, margin + 42);
  doc.setFont("helvetica", "normal");

  // ==================== KOTAK II ====================
  let y2 = margin + rowH2;
  // Kolom Kiri Kotak II
  doc.text("II.", margin + 2, y2 + 4.5);
  let curY_II_L = y2 + 4.5;
  curY_II_L = drawFieldWithWrap("Tiba di", values.destination || "-", margin + 6, margin + 28, margin + 31, curY_II_L, 56);
  curY_II_L = drawFieldWithWrap("Pada tanggal", formatDateIndo(values.startDate), margin + 6, margin + 28, margin + 31, curY_II_L, 56);

  // Kolom Kanan Kotak II
  let curY_II_R = y2 + 4.5;
  curY_II_R = drawFieldWithWrap("Berangkat dari", values.destination || "Desa Sampeldes", midX + 6, midX + 30, midX + 33, curY_II_R, 55);
  curY_II_R = drawFieldWithWrap("Ke", "Desa Sampeldes", midX + 6, midX + 30, midX + 33, curY_II_R, 55);
  curY_II_R = drawFieldWithWrap("Pada tanggal", formatDateIndo(values.endDate), midX + 6, midX + 30, midX + 33, curY_II_R, 55);

  // ==================== KOTAK III ====================
  y2 += rowH2;
  // Kolom Kiri Kotak III
  doc.text("III.", margin + 2, y2 + 4.5);
  let curY_III_L = y2 + 4.5;
  curY_III_L = drawFieldWithWrap("Tiba di", "-", margin + 6, margin + 28, margin + 31, curY_III_L, 56);
  curY_III_L = drawFieldWithWrap("Pada tanggal", "-", margin + 6, margin + 28, margin + 31, curY_III_L, 56);

  // Kolom Kanan Kotak III
  let curY_III_R = y2 + 4.5;
  curY_III_R = drawFieldWithWrap("Berangkat dari", "-", midX + 6, midX + 30, midX + 33, curY_III_R, 55);
  curY_III_R = drawFieldWithWrap("Ke", "-", midX + 6, midX + 30, midX + 33, curY_III_R, 55);
  curY_III_R = drawFieldWithWrap("Pada tanggal", "-", midX + 6, midX + 30, midX + 33, curY_III_R, 55);

  // ==================== KOTAK IV ====================
  y2 += rowH2;
  // Kolom Kiri Kotak IV
  doc.text("IV.", margin + 2, y2 + 4.5);
  let curY_IV_L = y2 + 4.5;
  curY_IV_L = drawFieldWithWrap("Tiba kembali di", "Desa Sampeldes", margin + 6, margin + 33, margin + 36, curY_IV_L, 52);
  doc.setFontSize(7.5);
  doc.text("(Tempat Kedudukan)", margin + 36, curY_IV_L - 0.5);
  curY_IV_L += 3.5;
  doc.setFontSize(8.5);
  curY_IV_L = drawFieldWithWrap("Pada tanggal", formatDateIndo(values.endDate), margin + 6, margin + 33, margin + 36, curY_IV_L, 52);

  doc.setFont("helvetica", "bold");
  doc.text("Kepala Desa Sampeldes,", margin + colW2 / 2, y2 + 28, { align: "center" });
  doc.text("TUKIMAN", margin + colW2 / 2, y2 + 41, { align: "center" });
  const wH2 = doc.getTextWidth("TUKIMAN");
  doc.line(margin + colW2 / 2 - wH2 / 2, y2 + 42, margin + colW2 / 2 + wH2 / 2, y2 + 42);
  doc.setFont("helvetica", "normal");

  // Kolom Kanan Kotak IV (Hanya Teks Verifikasi, tanpa tanda tangan ganda)
  const verifyText = "Telah diperiksa dengan keterangan bahwa perjalanan tersebut di atas benar-benar dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.";
  const splitVerify = doc.splitTextToSize(verifyText, colW2 - 8);
  doc.text(splitVerify, midX + 4, y2 + 5, { align: "justify", maxWidth: colW2 - 8, lineHeightFactor: 1.2 });

  // ==================== KOTAK V & VI ====================
  y2 += rowH2;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("V. CATATAN LAIN-LAIN", margin + 3, y2 + 7);
  doc.setFont("helvetica", "normal");

  y2 += 10;
  doc.setFont("helvetica", "bold");
  doc.text("VI. PERHATIAN", margin + 3, y2 + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const attentionText = "Pejabat yang berwenang menerbitkan SPPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba, serta bendaharawan pengeluaran bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila Negara menderita rugi akibat kesalahan, kelalaian dan kealpaannya.";
  const splitAttention = doc.splitTextToSize(attentionText, pageWidth - (margin * 2) - 8);
  doc.text(splitAttention, margin + 4, y2 + 8.5, { align: "justify", maxWidth: pageWidth - (margin * 2) - 8, lineHeightFactor: 1.15 });
  return doc.output("blob");
}

export const generateRAPDF = async (values: any, logoBase64?: string | null): Promise<Blob> => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (margin * 2);
  const logoSource = (logoBase64 && logoBase64.length > 50 && logoBase64.startsWith('data:image')) ? logoBase64 : LOGO_CILACAP_FALLBACK;
  const logoImg = await loadImage(logoSource);

  addKopSuratSync(doc, logoImg, margin, pageWidth);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("RUNDOWN KEGIATAN", pageWidth / 2, 56, { align: "center" });

  let currentY = 70;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Nama Kegiatan :", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(values.title || "-", margin + 35, currentY);
  currentY += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Hari/Tanggal     :", margin, currentY);
  doc.setFont("helvetica", "normal");
  // Update format: Kamis, 04 Juni 2026
  const displayDate = values.date ? format(new Date(values.date), "EEEE, dd MMMM yyyy", { locale: localeID }) : "-";
  doc.text(displayDate, margin + 35, currentY);
  currentY += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Tempat             :", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(values.location || "-", margin + 35, currentY);
  currentY += 10;

  // Table Configuration
  const colW = [12, 45, 113];
  const rowH = 10;
  const headers = ["No", "Waktu", "Uraian Kegiatan"];

  doc.setFont("helvetica", "bold");
  let hX = margin;
  headers.forEach((h, i) => {
    doc.rect(hX, currentY, colW[i], rowH);
    doc.text(h, hX + colW[i] / 2, currentY + 6.5, { align: "center" });
    hX += colW[i];
  });
  currentY += rowH;

  // Rundown Calculation Logic
  const startTime = values.time || "08:00";
  const [h, m] = startTime.split(':').map(Number);
  let baseDate = new Date();
  baseDate.setHours(h || 8, m || 0, 0, 0);

  const formatT = (d: Date) => format(d, "HH.mm");

  const items = [
    { label: "Registrasi Peserta", duration: 30 },
    { label: "Pembukaan", duration: 30 },
    { label: "Doa dan Menyanyikan Lagu Indonesia Raya", duration: 15 },
    { label: "Sambutan-sambutan", duration: 45 },
    { label: "Pelaksanaan Kegiatan Inti", duration: 60 },
    { label: "Diskusi dan Tanya Jawab", duration: 30 },
    { label: "Penutup", duration: 30 },
    { label: "Selesai", duration: 0 }
  ];

  doc.setFont("helvetica", "normal");
  items.forEach((item, i) => {
    let rX = margin;
    const start = formatT(baseDate);

    if (item.duration > 0) {
      const nextDate = dateAddMinutes(baseDate, item.duration);
      const range = `${start} – ${formatT(nextDate)}`;

      doc.rect(rX, currentY, colW[0], rowH);
      doc.text((i + 1).toString(), rX + colW[0] / 2, currentY + 6.5, { align: "center" });
      rX += colW[0];

      doc.rect(rX, currentY, colW[1], rowH);
      doc.text(range, rX + colW[1] / 2, currentY + 6.5, { align: "center" });
      rX += colW[1];

      doc.rect(rX, currentY, colW[2], rowH);
      doc.text(item.label, rX + 3, currentY + 6.5);

      baseDate = nextDate;
    } else {
      // Last row (Selesai)
      doc.rect(rX, currentY, colW[0], rowH);
      doc.text((i + 1).toString(), rX + colW[0] / 2, currentY + 6.5, { align: "center" });
      rX += colW[0];

      doc.rect(rX, currentY, colW[1], rowH);
      doc.text(start, rX + colW[1] / 2, currentY + 6.5, { align: "center" });
      rX += colW[1];

      doc.rect(rX, currentY, colW[2], rowH);
      doc.text(item.label, rX + 3, currentY + 6.5);
    }

    currentY += rowH;
  });

  return doc.output("blob");
}
