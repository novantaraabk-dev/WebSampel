import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { terbilang, loadImage, resolveLogoSource } from "./pdf-utils";

export interface TransactionItem {
  jenisBarang: string;
  banyaknya: number | string;
  satuan: string;
  hargaSatuan: number | string;
  jumlah: number | string;
}

export interface NotaFakturData {
  tanggal: string;
  namaToko: string;
  namaPemilik: string;
  alamatToko?: string;
  noTeleponToko?: string;
  perangkatNama: string;
  perangkatJabatan?: string;
  kepalaDesaNama?: string;
  noNota?: string;
  noFaktur?: string;
  items: TransactionItem[];
}

export type StrukModelType =
  | "kelontong"
  | "sembako"
  | "atk"
  | "bangunan"
  | "listrik"
  | "spbu"
  | "komputer"
  | "resto"
  | "apotek"
  | "pertanian"
  | "mebeler"
  | "tratag_sound"
  | "percetakan";

export type StrukWarnaTintaType =
  | "hitam"
  | "biru"
  | "ungu"
  | "abu"
  | "hijau";

export type JenisDokumenTransaksi = "struk" | "invoice" | "nota";

export type UkuranKertasTransaksi =
  | "58mm"
  | "80mm"
  | "76mm"
  | "A4"
  | "1/2_folio"
  | "1/3_folio"
  | "1/4_folio"
  | "1/6_folio";

export interface StrukBelanjaData {
  tanggal: string;
  jam: string;
  menit: string;
  detik: string;
  namaToko: string;
  alamatToko: string;
  noTelepon?: string;
  namaKasir?: string;
  noStruk?: string;
  bayarTunai?: number | string;
  items: TransactionItem[];
  modelStruk?: StrukModelType;
  warnaTinta?: StrukWarnaTintaType;
  spbuNomor?: string;
  spbuNoPompa?: string;
  spbuPlatNomor?: string;
  spbuJenisBbm?: string;
  catatanKhusus?: string;
  jenisDokumen?: JenisDokumenTransaksi;
  ukuranKertas?: UkuranKertasTransaksi | string;
  logoTokoBase64?: string | null;
  pembeliNama?: string;
  pembeliAlamat?: string;
  pilihanFont?: string;
  keperluanProgram?: string;

  // Bidang Manual Pengaturan Toko, Waktu & Keterangan Transaksi
  subHeaderToko?: string;
  labelKeteranganKhusus?: string;
  keteranganKhusus?: string;
  catatanKaki1?: string;
  catatanKaki2?: string;
  penerimaNama?: string;
  statusPembayaran?: string;
  tuanNota?: string;

  // Diskon Belanja Barang (Nominal / Persen)
  diskonTipe?: "nominal" | "persen";
  diskonNilai?: number | string;
}

const formatDateIndo = (dateStr: string) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return format(d, "d MMMM yyyy", { locale: localeID });
  } catch {
    return dateStr;
  }
};

/**
 * GENERATE NOTA PESANAN & FAKTUR PENGIRIMAN BARANG
 * Sesuai format fisik:
 * - Halaman 1: NOTA PESANAN (Kop Surat Pemdes Sampeldes, Kepada Toko, Tabel Rincian, TTD Yang Menerima & Yang Memesan)
 * - Halaman 2: FAKTUR PENGIRIMAN BARANG (Dasar Pesanan, Kepada Kepala Desa, Tabel Rincian, TTD Yang Menerima & Yang Mengirim)
 */
export const generateNotaDanFakturPDF = async (
  data: NotaFakturData,
  logoBase64?: string | null
): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 20;
  const tableWidth = 170; // 210 - 40
  const tanggalFormatIndo = formatDateIndo(data.tanggal);

  // Filter valid items
  const validItems = data.items.filter(
    (it) => it.jenisBarang && it.jenisBarang.trim() !== ""
  );
  if (validItems.length === 0) {
    validItems.push({
      jenisBarang: "Foto Copy Undangan dan Materi",
      banyaknya: 280,
      satuan: "buah",
      hargaSatuan: 300,
      jumlah: 84000,
    });
  }

  const grandTotal = validItems.reduce((acc, curr) => {
    const val = typeof curr.jumlah === "number" ? curr.jumlah : parseInt(String(curr.jumlah).replace(/\D/g, "")) || 0;
    return acc + val;
  }, 0);

  // Load Logo for Kop Surat (Page 1)
  const logoSource = resolveLogoSource(logoBase64);
  const logoImg = await loadImage(logoSource);

  // Column definitions
  // Total width: 170mm
  // No: 12mm, Barang: 68mm, Banyaknya: 38mm, Satuan: 24mm, Jumlah: 28mm
  const colX = {
    no: margin,                    // 20
    barang: margin + 12,           // 32
    banyaknya: margin + 12 + 68,   // 100
    satuan: margin + 12 + 68 + 38, // 138
    jumlah: margin + 12 + 68 + 38 + 24, // 162
    end: margin + tableWidth,      // 190
  };

  const colW = {
    no: 12,
    barang: 68,
    banyaknya: 38,
    satuan: 24,
    jumlah: 28,
  };

  const minRows = 7;
  const totalRowsCount = Math.max(validItems.length, minRows);
  const rowHeight = 8.5;
  const headerHeight = 12;
  const tableContentHeight = totalRowsCount * rowHeight;
  const totalTableHeight = headerHeight + tableContentHeight;

  // =========================================================================
  // HALAMAN 1: NOTA PESANAN (KOP SURAT LENGKAP)
  // =========================================================================

  // 1. KOP SURAT
  if (logoImg) {
    try {
      doc.addImage(logoImg, "PNG", margin, 10, 16, 20);
    } catch (e) {
      console.error("Kop Logo Error:", e);
    }
  }

  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.text("PEMERINTAH KABUPATEN CILACAP", (pageWidth / 2) + 8, 14, { align: "center" });
  doc.text("KECAMATAN GANDRUNGMANGU", (pageWidth / 2) + 8, 19, { align: "center" });

  doc.setFontSize(13);
  doc.text("DESA SAMPELDES", (pageWidth / 2) + 8, 25, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.text("Sekretariat : Jl.Raya Sampeldes KM 05  Kode Pos 53254", (pageWidth / 2) + 8, 30, { align: "center" });

  // Double Line Kop
  doc.setLineWidth(0.8);
  doc.line(margin, 33.5, pageWidth - margin, 33.5);
  doc.setLineWidth(0.2);
  doc.line(margin, 34.5, pageWidth - margin, 34.5);

  // 2. KEPADA (TUAN TOKO) - RIGHT ALIGNED BLOCK
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text("Kepada :", 138, 43);
  doc.text(`Yth.Tuan ${data.namaPemilik || ""}`, 134, 48);
  doc.text(`Toko " ${data.namaToko || ""} "`, 147, 53);
  doc.text("Di-", 143, 58);

  const lokasiToko = (data.alamatToko && data.alamatToko.trim() !== "")
    ? data.alamatToko.toUpperCase()
    : "SAMPELDES";
  doc.setFont("times", "bold");
  doc.text(lokasiToko, 152, 63);
  const wLokasi = doc.getTextWidth(lokasiToko);
  doc.setLineWidth(0.3);
  doc.line(152, 63.8, 152 + wLokasi, 63.8);

  // 3. JUDUL DOKUMEN & PEMBUKA
  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.text("NOTA PESANAN", margin, 68);
  doc.line(margin, 68.8, margin + doc.getTextWidth("NOTA PESANAN"), 68.8);

  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text("Harap dikirim kepada kami :", margin, 74.5);

  // 4. TABEL NOTA PESANAN
  const table1Top = 78;

  // Outer double line border for crisp authentic print style
  doc.setLineWidth(0.4);
  doc.rect(margin, table1Top, tableWidth, totalTableHeight);
  doc.setLineWidth(0.15);
  doc.rect(margin - 0.4, table1Top - 0.4, tableWidth + 0.8, totalTableHeight + 0.8);

  // Horizontal Header Split Lines
  doc.setLineWidth(0.3);
  doc.line(margin, table1Top + headerHeight, colX.end, table1Top + headerHeight); // Bottom of header
  doc.line(colX.satuan, table1Top + 6, colX.end, table1Top + 6); // Sub-header separator for "H a r g a"

  // Vertical Column Separators in Header & Body
  doc.line(colX.barang, table1Top, colX.barang, table1Top + totalTableHeight);
  doc.line(colX.banyaknya, table1Top, colX.banyaknya, table1Top + totalTableHeight);
  doc.line(colX.satuan, table1Top, colX.satuan, table1Top + totalTableHeight);
  doc.line(colX.jumlah, table1Top + 6, colX.jumlah, table1Top + totalTableHeight);

  // Header Texts
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("No", colX.no + colW.no / 2, table1Top + 7.5, { align: "center" });
  doc.text("Jenis Barang", colX.barang + colW.barang / 2, table1Top + 7.5, { align: "center" });
  doc.text("Banyaknya", colX.banyaknya + colW.banyaknya / 2, table1Top + 7.5, { align: "center" });
  doc.text("H a r g a", colX.satuan + (colW.satuan + colW.jumlah) / 2, table1Top + 4.5, { align: "center" });
  doc.text("Satuan", colX.satuan + colW.satuan / 2, table1Top + 10.2, { align: "center" });
  doc.text("Jumlah", colX.jumlah + colW.jumlah / 2, table1Top + 10.2, { align: "center" });

  // Data Rows & Empty Grid Lines
  let currentY = table1Top + headerHeight;
  for (let i = 0; i < totalRowsCount; i++) {
    const item = validItems[i];
    const rowBottomY = currentY + rowHeight;

    // Draw row bottom line
    doc.setLineWidth(0.2);
    doc.line(margin, rowBottomY, colX.end, rowBottomY);

    if (item) {
      doc.setFont("times", "bold");
      doc.setFontSize(9.5);
      // Col 1: No
      doc.text(String(i + 1), colX.no + colW.no / 2, currentY + 5.5, { align: "center" });

      // Col 2: Jenis Barang (with word wrap if needed)
      const namaLines = doc.splitTextToSize(item.jenisBarang || "", colW.barang - 4);
      if (namaLines.length > 1) {
        doc.text(namaLines[0], colX.barang + 2, currentY + 4);
        doc.text(namaLines[1], colX.barang + 2, currentY + 7.5);
      } else {
        doc.text(item.jenisBarang || "", colX.barang + 2, currentY + 5.5);
      }

      // Col 3: Banyaknya
      doc.setFont("times", "normal");
      const unitText = item.satuan ? `${item.banyaknya} ${item.satuan}` : `${item.banyaknya}`;
      doc.text(unitText, colX.banyaknya + colW.banyaknya / 2, currentY + 5.5, { align: "center" });

      // Col 4: Satuan (Numeric)
      const hrgNum = typeof item.hargaSatuan === "number" ? item.hargaSatuan : parseInt(String(item.hargaSatuan).replace(/\D/g, "")) || 0;
      doc.text(hrgNum.toLocaleString("id-ID"), colX.satuan + colW.satuan - 3, currentY + 5.5, { align: "right" });

      // Col 5: Jumlah (Numeric)
      const jmlNum = typeof item.jumlah === "number" ? item.jumlah : parseInt(String(item.jumlah).replace(/\D/g, "")) || (hrgNum * Number(item.banyaknya || 1));
      doc.text(jmlNum.toLocaleString("id-ID"), colX.jumlah + colW.jumlah - 3, currentY + 5.5, { align: "right" });
    }

    currentY += rowHeight;
  }

  // Bottom Summary Box (JUMLAH | Rp  84,000)
  const summary1Y = table1Top + totalTableHeight;
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("JUMLAH", colX.satuan + colW.satuan / 2, summary1Y + 5, { align: "center" });

  // Bordered Box for Rp amount
  const sumBox1H = 7.5;
  doc.setLineWidth(0.4);
  doc.rect(colX.jumlah, summary1Y, colW.jumlah, sumBox1H);
  doc.setLineWidth(0.15);
  doc.rect(colX.jumlah - 0.3, summary1Y - 0.3, colW.jumlah + 0.6, sumBox1H + 0.6);

  doc.setFont("times", "bold");
  doc.setFontSize(9.5);
  doc.text("Rp", colX.jumlah + 2.5, summary1Y + 5.2);
  doc.text(grandTotal.toLocaleString("id-ID"), colX.jumlah + colW.jumlah - 2.5, summary1Y + 5.2, { align: "right" });

  // 5. TANDA TANGAN NOTA PESANAN
  const sign1DateY = summary1Y + 16;
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text(`Sampeldes, ${tanggalFormatIndo}`, 155, sign1DateY, { align: "center" });

  const sign1TitleY = sign1DateY + 6;
  doc.text("Yang Menerima", 55, sign1TitleY, { align: "center" });
  doc.text("Yang Memesan", 155, sign1TitleY, { align: "center" });

  const sign1NameY = sign1TitleY + 23;
  const ownerName = (data.namaPemilik || "DEDI").toUpperCase();
  const pemesanName = (data.perangkatNama || "TEDY TRISNANTO").toUpperCase();

  doc.setFont("times", "bold");
  doc.text(ownerName, 55, sign1NameY, { align: "center" });
  const wOwn = doc.getTextWidth(ownerName);
  doc.setLineWidth(0.3);
  doc.line(55 - wOwn / 2, sign1NameY + 0.8, 55 + wOwn / 2, sign1NameY + 0.8);

  doc.text(pemesanName, 155, sign1NameY, { align: "center" });
  const wPem = doc.getTextWidth(pemesanName);
  doc.line(155 - wPem / 2, sign1NameY + 0.8, 155 + wPem / 2, sign1NameY + 0.8);

  // =========================================================================
  // HALAMAN 2: FAKTUR PENGIRIMAN BARANG
  // =========================================================================
  doc.addPage("a4", "portrait");

  // 1. DASAR PESANAN & KEPADA
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text(`Dasar Pesanan tanggal : ${tanggalFormatIndo}`, margin, 20);
  const wDasar = doc.getTextWidth(`Dasar Pesanan tanggal : ${tanggalFormatIndo}`);
  doc.setLineWidth(0.25);
  doc.line(margin, 20.8, margin + wDasar, 20.8);

  // Kepada Kepala Desa (Right aligned block)
  doc.text("Kepada :", 138, 26);
  doc.text("Yth. Kepala Desa Sampeldes", 134, 31);
  doc.text("Di-", 143, 36);

  doc.setFont("times", "bold");
  doc.text("SAMPELDES", 148, 41);
  const wRk = doc.getTextWidth("SAMPELDES");
  doc.setLineWidth(0.3);
  doc.line(148, 41.8, 148 + wRk, 41.8);

  // 2. JUDUL DOKUMEN & PEMBUKA
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.text("FAKTUR PENGIRIMAN BARANG", pageWidth / 2, 51, { align: "center" });
  const wFakturTitle = doc.getTextWidth("FAKTUR PENGIRIMAN BARANG");
  doc.line(pageWidth / 2 - wFakturTitle / 2, 51.8, pageWidth / 2 + wFakturTitle / 2, 51.8);

  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text("Harap diterima dengan baik kiriman barang sebagai berikut :", margin, 58.5);

  // 3. TABEL FAKTUR PENGIRIMAN BARANG
  const table2Top = 62;

  // Outer double line border
  doc.setLineWidth(0.4);
  doc.rect(margin, table2Top, tableWidth, totalTableHeight);
  doc.setLineWidth(0.15);
  doc.rect(margin - 0.4, table2Top - 0.4, tableWidth + 0.8, totalTableHeight + 0.8);

  // Horizontal Header Split Lines
  doc.setLineWidth(0.3);
  doc.line(margin, table2Top + headerHeight, colX.end, table2Top + headerHeight);
  doc.line(colX.satuan, table2Top + 6, colX.end, table2Top + 6);

  // Vertical Column Separators
  doc.line(colX.barang, table2Top, colX.barang, table2Top + totalTableHeight);
  doc.line(colX.banyaknya, table2Top, colX.banyaknya, table2Top + totalTableHeight);
  doc.line(colX.satuan, table2Top, colX.satuan, table2Top + totalTableHeight);
  doc.line(colX.jumlah, table2Top + 6, colX.jumlah, table2Top + totalTableHeight);

  // Header Texts (Notice: "Nama Barang" in Faktur!)
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("No", colX.no + colW.no / 2, table2Top + 7.5, { align: "center" });
  doc.text("Nama Barang", colX.barang + colW.barang / 2, table2Top + 7.5, { align: "center" });
  doc.text("Banyaknya", colX.banyaknya + colW.banyaknya / 2, table2Top + 7.5, { align: "center" });
  doc.text("H a r g a", colX.satuan + (colW.satuan + colW.jumlah) / 2, table2Top + 4.5, { align: "center" });
  doc.text("Satuan", colX.satuan + colW.satuan / 2, table2Top + 10.2, { align: "center" });
  doc.text("Jumlah", colX.jumlah + colW.jumlah / 2, table2Top + 10.2, { align: "center" });

  // Data Rows & Empty Grid Lines
  currentY = table2Top + headerHeight;
  for (let i = 0; i < totalRowsCount; i++) {
    const item = validItems[i];
    const rowBottomY = currentY + rowHeight;

    doc.setLineWidth(0.2);
    doc.line(margin, rowBottomY, colX.end, rowBottomY);

    if (item) {
      doc.setFont("times", "bold");
      doc.setFontSize(9.5);
      // Col 1: No
      doc.text(String(i + 1), colX.no + colW.no / 2, currentY + 5.5, { align: "center" });

      // Col 2: Nama Barang
      const namaLines = doc.splitTextToSize(item.jenisBarang || "", colW.barang - 4);
      if (namaLines.length > 1) {
        doc.text(namaLines[0], colX.barang + 2, currentY + 4);
        doc.text(namaLines[1], colX.barang + 2, currentY + 7.5);
      } else {
        doc.text(item.jenisBarang || "", colX.barang + 2, currentY + 5.5);
      }

      // Col 3: Banyaknya
      doc.setFont("times", "normal");
      const unitText = item.satuan ? `${item.banyaknya} ${item.satuan}` : `${item.banyaknya}`;
      doc.text(unitText, colX.banyaknya + colW.banyaknya / 2, currentY + 5.5, { align: "center" });

      // Col 4: Satuan
      const hrgNum = typeof item.hargaSatuan === "number" ? item.hargaSatuan : parseInt(String(item.hargaSatuan).replace(/\D/g, "")) || 0;
      doc.text(hrgNum.toLocaleString("id-ID"), colX.satuan + colW.satuan - 3, currentY + 5.5, { align: "right" });

      // Col 5: Jumlah
      const jmlNum = typeof item.jumlah === "number" ? item.jumlah : parseInt(String(item.jumlah).replace(/\D/g, "")) || (hrgNum * Number(item.banyaknya || 1));
      doc.text(jmlNum.toLocaleString("id-ID"), colX.jumlah + colW.jumlah - 3, currentY + 5.5, { align: "right" });
    }

    currentY += rowHeight;
  }

  // Bottom Summary Box (Jumlah Rp. | Rp  84,000)
  const summary2Y = table2Top + totalTableHeight;
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("Jumlah Rp.", colX.satuan + colW.satuan / 2, summary2Y + 5, { align: "center" });

  const sumBox2H = 7.5;
  doc.setLineWidth(0.4);
  doc.rect(colX.jumlah, summary2Y, colW.jumlah, sumBox2H);
  doc.setLineWidth(0.15);
  doc.rect(colX.jumlah - 0.3, summary2Y - 0.3, colW.jumlah + 0.6, sumBox2H + 0.6);

  doc.setFont("times", "bold");
  doc.setFontSize(9.5);
  doc.text("Rp", colX.jumlah + 2.5, summary2Y + 5.2);
  doc.text(grandTotal.toLocaleString("id-ID"), colX.jumlah + colW.jumlah - 2.5, summary2Y + 5.2, { align: "right" });

  // 4. TANDA TANGAN FAKTUR PENGIRIMAN
  const sign2DateY = summary2Y + 16;
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text(`Sampeldes, ${tanggalFormatIndo}`, 155, sign2DateY, { align: "center" });

  const sign2TitleY = sign2DateY + 6;
  doc.text("Yang menerima", 55, sign2TitleY, { align: "center" });
  doc.text("Yang mengirim,", 155, sign2TitleY, { align: "center" });

  const sign2NameY = sign2TitleY + 23;
  const kadesName = (data.kepalaDesaNama || "AF. MAHFUR").toUpperCase();
  const senderName = (data.namaPemilik || "DEDI").toUpperCase();

  doc.setFont("times", "bold");
  doc.text(kadesName, 55, sign2NameY, { align: "center" });
  const wKad = doc.getTextWidth(kadesName);
  doc.setLineWidth(0.3);
  doc.line(55 - wKad / 2, sign2NameY + 0.8, 55 + wKad / 2, sign2NameY + 0.8);

  doc.text(senderName, 155, sign2NameY, { align: "center" });
  const wSend = doc.getTextWidth(senderName);
  doc.line(155 - wSend / 2, sign2NameY + 0.8, 155 + wSend / 2, sign2NameY + 0.8);

  return doc.output("blob");
};

/**
 * GENERATE STRUK, INVOICE, DAN NOTA TRANSAKSI
 * Mendukung:
 * 1. Struk Kasir Thermal (58 mm, 76 mm, 80 mm)
 * 2. Invoice A4 Formal Tagihan Rekanan / Perusahaan
 * 3. Nota Kontan Pecahan Folio (1/2, 1/3, 1/4, 1/6 Folio)
 * Serta 10 Model Usaha, 5 Pilihan Warna Tinta, dan Upload Logo Toko
 */
export const generateStrukBelanjaPDF = async (data: StrukBelanjaData): Promise<Blob> => {
  const jenisDoc: JenisDokumenTransaksi = data.jenisDokumen || "struk";
  const model: StrukModelType = data.modelStruk || "kelontong";
  const warna: StrukWarnaTintaType = data.warnaTinta || "hitam";

  // Mapping Warna Tinta Dokumen
  const INK_COLORS: Record<StrukWarnaTintaType, [number, number, number]> = {
    hitam: [20, 20, 20],        // Black thermal / standard
    biru: [22, 54, 98],         // Vintage SPBU / POS Navy
    ungu: [68, 22, 95],         // Ribbon Dot-Matrix Purple (Epson TM-U220)
    abu: [55, 65, 81],          // Charcoal / Realistic Faded Thermal
    hijau: [15, 61, 41],        // Forest / Eco-Thermal
  };

  const [inkR, inkG, inkB] = INK_COLORS[warna] || INK_COLORS.hitam;

  // Menentukan Font Dasar Dokumen Berdasarkan Pilihan Font (10 Font Paling Umum)
  let baseFont = jenisDoc === "invoice" ? "helvetica" : "courier";
  if (data.pilihanFont) {
    const pf = data.pilihanFont.toLowerCase();
    if (pf.includes("times")) {
      baseFont = "times";
    } else if (
      pf.includes("helvetica") ||
      pf.includes("calibri") ||
      pf.includes("roboto") ||
      pf.includes("trebuchet")
    ) {
      baseFont = "helvetica";
    } else {
      baseFont = "courier";
    }
  }

  const applyFont = (d: jsPDF, style: "bold" | "normal" | "italic" = "normal") => {
    let s: string = style;
    if (style === "italic" && baseFont === "courier") {
      s = "oblique";
    }
    d.setFont(baseFont as any, s);
  };

  // Load logo toko jika ada
  const logoImg = data.logoTokoBase64 ? await loadImage(data.logoTokoBase64) : null;

  const validItems = data.items.filter(
    (it) => it.jenisBarang && it.jenisBarang.trim() !== ""
  );
  if (validItems.length === 0) {
    validItems.push({
      jenisBarang: model === "spbu" ? "PERTALITE" : "Belanja Barang",
      banyaknya: model === "spbu" ? 15 : 1,
      satuan: model === "spbu" ? "Liter" : "Pcs",
      hargaSatuan: 10000,
      jumlah: model === "spbu" ? 150000 : 10000,
    });
  }

  const subtotal = validItems.reduce((acc, curr) => {
    const val = typeof curr.jumlah === "number" ? curr.jumlah : parseInt(String(curr.jumlah).replace(/\D/g, "")) || 0;
    return acc + val;
  }, 0);

  const totalQty = validItems.reduce((acc, curr) => {
    const q = typeof curr.banyaknya === "number" ? curr.banyaknya : parseFloat(String(curr.banyaknya)) || 1;
    return acc + q;
  }, 0);

  // Perhitungan Diskon Barang (Nominal atau Persentase)
  let diskonNominal = 0;
  let diskonPersen = 0;
  const diskonRaw = data.diskonNilai ? parseFloat(String(data.diskonNilai).replace(/[^0-9.]/g, "")) || 0 : 0;
  if (diskonRaw > 0) {
    if (data.diskonTipe === "persen") {
      diskonPersen = Math.min(100, Math.max(0, diskonRaw));
      diskonNominal = Math.round((subtotal * diskonPersen) / 100);
    } else {
      diskonNominal = Math.min(subtotal, Math.max(0, diskonRaw));
      if (subtotal > 0) {
        diskonPersen = Math.round((diskonNominal / subtotal) * 100);
      }
    }
  }

  const grandTotal = Math.max(0, subtotal - diskonNominal);
  const hasDiscount = diskonNominal > 0;
  const discountLabel = data.diskonTipe === "persen" ? `Diskon (${diskonPersen}%)` : "Diskon Barang";

  const payNom = data.bayarTunai ? (typeof data.bayarTunai === "number" ? data.bayarTunai : parseInt(String(data.bayarTunai).replace(/\D/g, "")) || grandTotal) : grandTotal;
  const changeNom = Math.max(0, payNom - grandTotal);

  const pad = (n: string | number) => String(n).padStart(2, "0");
  const timeStr = `${pad(data.jam || "00")}:${pad(data.menit || "00")}:${pad(data.detik || "00")}`;
  const dateStr = data.tanggal ? format(new Date(data.tanggal), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy");
  const noStruk = data.noStruk || `TRX${dateStr.replace(/\//g, "")}-${pad(data.jam || "12")}${pad(data.menit || "00")}`;

  // Helper menggambar logo toko dengan proporsional aspect ratio
  const drawLogoImage = (doc: jsPDF, x: number, y: number, maxW: number, maxH: number) => {
    if (!logoImg) return 0;
    try {
      let fmt = "PNG";
      if (logoImg.src?.startsWith("data:image/jpeg") || logoImg.src?.startsWith("data:image/jpg")) {
        fmt = "JPEG";
      }
      const ratio = (logoImg.naturalWidth || 1) / (logoImg.naturalHeight || 1);
      let w = maxW;
      let h = w / ratio;
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }
      doc.addImage(logoImg, fmt, x + (maxW - w) / 2, y + (maxH - h) / 2, w, h);
      return h;
    } catch (e) {
      console.error("Gagal menggambar logo toko:", e);
      return 0;
    }
  };

  // =========================================================================
  // PILIHAN 2: INVOICE (FORMAT A4 RESMI)
  // =========================================================================
  if (jenisDoc === "invoice") {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    doc.setTextColor(inkR, inkG, inkB);
    doc.setDrawColor(inkR, inkG, inkB);

    let y = 14;

    // Header Kiri: Logo Toko + Identitas Toko
    const logoBoxW = logoImg ? 26 : 0;
    const logoBoxH = logoImg ? 24 : 0;
    if (logoImg) {
      drawLogoImage(doc, margin, y, logoBoxW, logoBoxH);
    }

    const textLeftX = margin + (logoImg ? logoBoxW + 4 : 0);
    applyFont(doc, "bold");
    doc.setFontSize(14);
    const tokoName = (data.namaToko || "MINIMARKET SAMPELDES JAYA").toUpperCase();
    doc.text(tokoName, textLeftX, y + 5);

    doc.setFontSize(8.5);
    applyFont(doc, "normal");
    const subUsaha = data.subHeaderToko !== undefined ? data.subHeaderToko : (
      model === "spbu" ? "SPBU & PELAYANAN BAHAN BAKAR RESMI PERTAMINA" :
        model === "bangunan" ? "DEPOT BAHAN BANGUNAN & MATERIAL KONSTRUKSI" :
          model === "atk" ? "PUSAT ALAT TULIS KANTOR, PERCETAKAN & PENGGANDAAN" :
            model === "percetakan" ? "PERCETAKAN, BANNER, BALIHO & DIGITAL PRINTING" :
              model === "listrik" ? "TOKO ALAT LISTRIK, TEKNIK & KOMPONEN ELEKTRONIK" :
                model === "komputer" ? "SOLUSI IT, HARDWARE, PRINTER & PENGADAAN KOMPUTER" :
                  model === "resto" ? "RUMAH MAKAN, KATERING & JAMUAN KEGIATAN DESA" :
                    model === "apotek" ? "APOTEK, ALAT KESEHATAN & OBAT-OBATAN" :
                      model === "pertanian" ? "SARANA PRODUKSI PERTANIAN, PUPUK & BIBIT UNGGUL" :
                        model === "mebeler" ? "PRODUSEN & TOKO MEBELER, FURNITURE KANTOR DESA" :
                          model === "tratag_sound" ? "PERSEWAAN TRATAG, PANGGUNG, TENDA & SOUND SYSTEM" :
                            model === "sembako" ? "TOKO SEMBAKO, KONSUMSI & DISTRIBUTOR HASIL BUMI" :
                              "TOKO KELONTONG & PENYEDIA KEBUTUHAN UMUM DESA"
    );
    if (subUsaha) {
      doc.text(subUsaha, textLeftX, y + 10);
    }

    const addrLines = doc.splitTextToSize(data.alamatToko || "Kec. Gandrungmangu, Kab. Cilacap", 90);
    let addrY = y + 14;
    addrLines.forEach((l: string) => {
      doc.text(l, textLeftX, addrY);
      addrY += 4;
    });
    if (data.noTelepon) {
      doc.text(`Telp / WA: ${data.noTelepon}`, textLeftX, addrY);
      addrY += 4;
    }

    // Header Kanan: Box FAKTUR PENJUALAN
    applyFont(doc, "bold");
    doc.setFontSize(18);
    doc.text("FAKTUR / INVOICE", pageWidth - margin, y + 6, { align: "right" });

    doc.setFontSize(9);
    applyFont(doc, "normal");
    doc.text(`No. Faktur : ${noStruk}`, pageWidth - margin, y + 12, { align: "right" });
    doc.text(`Tanggal    : ${dateStr}`, pageWidth - margin, y + 17, { align: "right" });
    doc.text(`Waktu      : ${timeStr} WIB`, pageWidth - margin, y + 22, { align: "right" });
    doc.text(`Status     : ${data.statusPembayaran || "LUNAS / TUNAI"}`, pageWidth - margin, y + 27, { align: "right" });

    y = Math.max(addrY + 3, y + 32);

    // Garis Kop Ganda
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 1, pageWidth - margin, y + 1);
    y += 6;

    // Info Pembeli / Billed To
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentWidth, 22);

    applyFont(doc, "bold");
    doc.setFontSize(8.5);
    doc.text("TAGIHAN / DITUJUKAN KEPADA:", margin + 3, y + 5);

    applyFont(doc, "bold");
    doc.setFontSize(10);
    doc.text((data.pembeliNama || "PEMERINTAH DESA SAMPELDES").toUpperCase(), margin + 3, y + 11);

    applyFont(doc, "normal");
    doc.setFontSize(8.5);
    doc.text(data.pembeliAlamat || "Kecamatan Gandrungmangu, Kabupaten Cilacap - Jawa Tengah", margin + 3, y + 16);

    const customKeperluan = (data.keperluanProgram || data.keteranganKhusus || "").trim();
    let descModel = "";
    if (customKeperluan) {
      descModel = `Keperluan: ${customKeperluan}`;
    } else {
      descModel = model === "spbu" ? `BBM Randis: ${data.spbuPlatNomor || "R 9508 XB"} (Pompa ${data.spbuNoPompa || "02/01"})` :
        model === "bangunan" ? "Keperluan: Pengadaan Bahan Material Fisik APBDes" :
          model === "atk" ? "Keperluan: Pengadaan Kebutuhan ATK & Administrasi Pemdes" :
            model === "percetakan" ? "Keperluan: Cetak Banner, Baliho & Penggandaan Publikasi Desa" :
              model === "resto" ? "Keperluan: Konsumsi & Jamuan Rapat Koordinasi Desa" :
                model === "apotek" ? "Keperluan: Pengadaan Alkes & Sarana Posyandu/P3K" :
                  model === "pertanian" ? "" :
                    model === "mebeler" ? "Keperluan: Pengadaan Meja, Kursi & Furniture Kantor Desa" :
                      model === "tratag_sound" ? "Keperluan: Sewa Tratag, Panggung & Sound System Acara Desa" :
                        "Keperluan: Belanja Kebutuhan Operasional & Penunjang Kegiatan Desa";
    }
    if (descModel) {
      doc.text(descModel, pageWidth - margin - 3, y + 11, { align: "right" });
    }
    doc.text("Kasir / Petugas: " + (data.namaKasir || "ADMIN PENJUALAN"), pageWidth - margin - 3, y + 16, { align: "right" });

    y += 26;

    // TABEL TRANSAKSI A4
    const colNo = 12;
    const colName = 82;
    const colQty = 18;
    const colSat = 20;
    const colHrg = 25;
    const colSub = 25;

    // Header Tabel
    doc.setFillColor(245, 247, 250);
    doc.rect(margin, y, contentWidth, 8, "FD");

    applyFont(doc, "bold");
    doc.setFontSize(8.5);
    let curX = margin;
    doc.text("NO", curX + colNo / 2, y + 5.5, { align: "center" }); curX += colNo;
    doc.text("NAMA / URAIAN BARANG", curX + 2, y + 5.5); curX += colName;
    doc.text("QTY", curX + colQty / 2, y + 5.5, { align: "center" }); curX += colQty;
    doc.text("SATUAN", curX + colSat / 2, y + 5.5, { align: "center" }); curX += colSat;
    doc.text("HARGA (Rp)", curX + colHrg - 2, y + 5.5, { align: "right" }); curX += colHrg;
    doc.text("JUMLAH (Rp)", curX + colSub - 2, y + 5.5, { align: "right" });

    y += 8;

    // Isi Baris Barang
    applyFont(doc, "normal");
    doc.setFontSize(8.5);
    validItems.forEach((it, idx) => {
      const qty = String(it.banyaknya || 1);
      const unit = it.satuan || "Pcs";
      const hrg = typeof it.hargaSatuan === "number" ? it.hargaSatuan : parseInt(String(it.hargaSatuan).replace(/\D/g, "")) || 0;
      const sub = typeof it.jumlah === "number" ? it.jumlah : parseInt(String(it.jumlah).replace(/\D/g, "")) || (parseFloat(qty) * hrg);

      const rowH = 7.5;
      doc.rect(margin, y, contentWidth, rowH);

      let rx = margin;
      doc.text(String(idx + 1), rx + colNo / 2, y + 5, { align: "center" }); rx += colNo;

      const splitName = doc.splitTextToSize((it.jenisBarang || "").toUpperCase(), colName - 4);
      doc.text(splitName[0] || "", rx + 2, y + 5); rx += colName;

      doc.text(qty, rx + colQty / 2, y + 5, { align: "center" }); rx += colQty;
      doc.text(unit, rx + colSat / 2, y + 5, { align: "center" }); rx += colSat;
      doc.text(hrg.toLocaleString("id-ID"), rx + colHrg - 2, y + 5, { align: "right" }); rx += colHrg;
      doc.text(sub.toLocaleString("id-ID"), rx + colSub - 2, y + 5, { align: "right" });

      y += rowH;
    });

    // Ringkasan Total
    y += 3;
    doc.rect(margin, y, contentWidth, 26);

    // Kiri: Terbilang
    applyFont(doc, "bold");
    doc.setFontSize(8);
    doc.text("TERBILANG :", margin + 3, y + 5.5);
    applyFont(doc, "italic");
    const terbilangStr = `# ${terbilang(grandTotal).toUpperCase()} RUPIAH #`;
    const splitTerbilang = doc.splitTextToSize(terbilangStr, 105);
    doc.text(splitTerbilang, margin + 3, y + 10.5);

    // Catatan Khusus Model di Invoice
    applyFont(doc, "normal");
    doc.setFontSize(7.5);
    const klausulInvoice = data.catatanKaki1 || (
      model === "spbu" ? "* Harga sudah termasuk PPN 11% & PBBKB. Bahan Bakar Berkualitas." :
        model === "bangunan" ? "* Periksa kembali kondisi fisik material. Komplain semen basah/rusak max 1x24 jam." :
          model === "listrik" ? "* Garansi lampu/elektronik resmi pabrik. Barang telah dites sebelum serah terima." :
            model === "komputer" ? "* Garansi toko/servis hardware 1 bulan. Simpan faktur ini sebagai bukti garansi." :
              model === "resto" ? "* Pesanan telah diserahkan sesuai pesanan. Pajak PB1 Restoran telah termasuk." :
                model === "apotek" ? "* Obat & alkes terdaftar Kemenkes RI / BPOM. Konsultasikan dengan Apoteker." :
                  model === "pertanian" ? "* Benih & pupuk bersertifikasi resmi Kementan RI untuk ketahanan pangan desa." :
                    model === "mebeler" ? "* Barang mebeler telah diperiksa bersama dalam kondisi baru. Garansi finishing 1 bulan." :
                      model === "tratag_sound" ? "* Sewa tratag & sound system untuk kegiatan resmi desa. Kerusakan selama acara ditanggung bersama." :
                        model === "percetakan" ? "* Desain dan cetakan banner telah diperiksa bersama dengan hasil presisi." :
                          "* Pembayaran telah diterima lunas. Barang yang sudah dibeli tidak dapat ditukar/dikembalikan."
    );
    const splitKlausul = doc.splitTextToSize(klausulInvoice, 108);
    let klY = y + 21;
    splitKlausul.forEach((l: string) => {
      doc.text(l, margin + 3, klY);
      klY += 3.3;
    });

    // Kanan: Subtotal, Diskon (jika ada), Total, Bayar Tunai, Kembali
    const totalBoxX = margin + 115;
    applyFont(doc, "normal");
    doc.setFontSize(8);
    let rightY = y + 5.5;

    doc.text("Subtotal", totalBoxX, rightY);
    doc.text(`Rp ${subtotal.toLocaleString("id-ID")}`, pageWidth - margin - 3, rightY, { align: "right" });
    rightY += 5;

    if (hasDiscount) {
      doc.text(discountLabel, totalBoxX, rightY);
      doc.text(`- Rp ${diskonNominal.toLocaleString("id-ID")}`, pageWidth - margin - 3, rightY, { align: "right" });
      rightY += 5;
    }

    applyFont(doc, "bold");
    doc.text("Total Pembayaran", totalBoxX, rightY);
    doc.text(`Rp ${grandTotal.toLocaleString("id-ID")}`, pageWidth - margin - 3, rightY, { align: "right" });
    rightY += 5;

    applyFont(doc, "normal");
    doc.text("Uang Dibayarkan", totalBoxX, rightY);
    doc.text(`Rp ${payNom.toLocaleString("id-ID")}`, pageWidth - margin - 3, rightY, { align: "right" });
    rightY += 5;

    doc.text("Kembalian", totalBoxX, rightY);
    doc.text(`Rp ${changeNom.toLocaleString("id-ID")}`, pageWidth - margin - 3, rightY, { align: "right" });

    y = Math.max(y + 32, rightY + 6);

    // Dua Kolom Tanda Tangan
    const signColW = 60;
    const signLeftX = margin + 15;
    const signRightX = pageWidth - margin - signColW - 15;

    applyFont(doc, "normal");
    doc.setFontSize(8.5);
    doc.text("Yang Menerima / Memesan,", signLeftX + signColW / 2, y, { align: "center" });
    doc.text(data.pembeliNama || "Pemerintah Desa Sampeldes", signLeftX + signColW / 2, y + 4.5, { align: "center" });

    doc.text("Hormat Kami / Toko,", signRightX + signColW / 2, y, { align: "center" });
    doc.text(data.namaToko || "Cap & Tanda Tangan Toko", signRightX + signColW / 2, y + 4.5, { align: "center" });

    const signNameY = y + 24;
    applyFont(doc, "bold");
    const penerimaStr = data.penerimaNama && data.penerimaNama.trim() ? `( ${data.penerimaNama.trim()} )` : "( ..................................................... )";
    doc.text(penerimaStr, signLeftX + signColW / 2, signNameY, { align: "center" });
    doc.text(`( ${data.namaKasir || "Penanggung Jawab Toko"} )`, signRightX + signColW / 2, signNameY, { align: "center" });

    return doc.output("blob");
  }

  // =========================================================================
  // PILIHAN 3: NOTA KONTAN (PECAHAN FOLIO)
  // =========================================================================
  if (jenisDoc === "nota") {
    // Dimensi sesuai permintaan:
    // 1/2 Folio: 165 x 215 mm (landscape 215 x 165 mm sangat pas untuk buku nota)
    // 1/3 Folio: 215 x 110 mm
    // 1/4 Folio: 165 x 107 mm (standar buku nota kontan toko)
    // 1/6 Folio: 110 x 107 mm
    let pageW = 165;
    let pageH = 107;
    const uk = data.ukuranKertas || "1/4_folio";

    if (uk === "1/2_folio") {
      pageW = 215;
      pageH = 165;
    } else if (uk === "1/3_folio") {
      pageW = 215;
      pageH = 110;
    } else if (uk === "1/6_folio") {
      pageW = 110;
      pageH = 107;
    } else {
      // 1/4 Folio default
      pageW = 165;
      pageH = 107;
    }

    const doc = new jsPDF({
      orientation: pageW > pageH ? "landscape" : "portrait",
      unit: "mm",
      format: [pageW, pageH],
    });

    const margin = pageW <= 110 ? 5 : 7;
    const contentWidth = pageW - margin * 2;

    doc.setTextColor(inkR, inkG, inkB);
    doc.setDrawColor(inkR, inkG, inkB);

    let y = margin + 1;

    // Kop Nota Kiri: Logo Toko + Identitas Toko
    const logoW = logoImg ? (pageW <= 110 ? 12 : 16) : 0;
    const logoH = logoImg ? (pageW <= 110 ? 12 : 14) : 0;
    if (logoImg) {
      drawLogoImage(doc, margin, y, logoW, logoH);
    }

    const kopTextX = margin + (logoImg ? logoW + 2.5 : 0);
    applyFont(doc, "bold");
    doc.setFontSize(pageW <= 110 ? 9 : 11);
    doc.text((data.namaToko || "TOKO SAMPELDES").toUpperCase(), kopTextX, y + 3.5);

    applyFont(doc, "normal");
    doc.setFontSize(pageW <= 110 ? 6.5 : 7.5);
    const subToko = data.subHeaderToko !== undefined ? data.subHeaderToko : (
      model === "spbu" ? "SPBU PERTAMINA" :
        model === "bangunan" ? "DEPOT BAHAN BANGUNAN" :
          model === "atk" ? "ATK & PERCETAKAN" :
            model === "percetakan" ? "PERCETAKAN & DIGITAL PRINTING" :
              model === "listrik" ? "LISTRIK & ELEKTRONIK" :
                model === "komputer" ? "KOMPUTER & SERVIS IT" :
                  model === "resto" ? "RUMAH MAKAN & CATERING" :
                    model === "apotek" ? "APOTEK & ALKES" :
                      model === "pertanian" ? "SARANA PERTANIAN & BIBIT" :
                        model === "mebeler" ? "MEBELER & FURNITURE KANTOR" :
                          model === "tratag_sound" ? "SEWA TRATAG & SOUND SYSTEM" :
                            "TOKO KELONTONG & SEMBAKO"
    );
    if (subToko) {
      doc.text(subToko, kopTextX, y + 7);
    }

    const addrLines = doc.splitTextToSize(data.alamatToko || "Kec. Gandrungmangu, Cilacap", pageW <= 110 ? 45 : 75);
    let adY = y + 10.5;
    addrLines.forEach((l: string) => {
      doc.text(l, kopTextX, adY);
      adY += 3.2;
    });

    // Box NOTA KONTAN di Kanan Atas
    const boxW = pageW <= 110 ? 45 : 62;
    const boxH = pageW <= 110 ? 16 : 18;
    const boxX = pageW - margin - boxW;
    doc.setLineWidth(0.3);
    doc.rect(boxX, y, boxW, boxH);

    applyFont(doc, "bold");
    doc.setFontSize(pageW <= 110 ? 9 : 10.5);
    doc.text("NOTA KONTAN", boxX + boxW / 2, y + 4.5, { align: "center" });

    applyFont(doc, "normal");
    doc.setFontSize(pageW <= 110 ? 6.5 : 7.5);
    doc.text(`No.   : ${noStruk}`, boxX + 2, y + 8.5);
    doc.text(`Tgl.  : ${dateStr}`, boxX + 2, y + 12);
    const tuanStr = data.tuanNota || data.pembeliNama || "Pemdes Sampeldes";
    doc.text(`Tuan  : ${tuanStr}`, boxX + 2, y + 15.5);

    y = Math.max(adY, y + boxH) + 2;

    // Garis Kop Pembatas
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 0.8, pageW - margin, y + 0.8);
    y += 2.5;

    // TABEL NOTA KONTAN
    const colBanyak = pageW <= 110 ? 18 : 24;
    const colHarga = pageW <= 110 ? 22 : 28;
    const colJumlah = pageW <= 110 ? 24 : 32;
    const colNama = contentWidth - (colBanyak + colHarga + colJumlah);

    // Header Tabel Nota
    doc.setFillColor(248, 249, 250);
    doc.rect(margin, y, contentWidth, 5.5, "FD");
    applyFont(doc, "bold");
    doc.setFontSize(pageW <= 110 ? 6.5 : 7.5);

    let tx = margin;
    doc.text("BANYAKNYA", tx + colBanyak / 2, y + 3.8, { align: "center" }); tx += colBanyak;
    doc.text("NAMA BARANG", tx + 2, y + 3.8); tx += colNama;
    doc.text("HARGA", tx + colHarga - 2, y + 3.8, { align: "right" }); tx += colHarga;
    doc.text("JUMLAH (Rp)", tx + colJumlah - 2, y + 3.8, { align: "right" });

    y += 5.5;

    // Baris Barang Nota
    applyFont(doc, "normal");
    doc.setFontSize(pageW <= 110 ? 6.5 : 7.5);

    validItems.forEach((it) => {
      const qty = String(it.banyaknya || 1);
      const unit = it.satuan ? ` ${it.satuan}` : "";
      const hrg = typeof it.hargaSatuan === "number" ? it.hargaSatuan : parseInt(String(it.hargaSatuan).replace(/\D/g, "")) || 0;
      const sub = typeof it.jumlah === "number" ? it.jumlah : parseInt(String(it.jumlah).replace(/\D/g, "")) || (parseFloat(qty) * hrg);

      const rH = pageW <= 110 ? 5 : 5.8;
      doc.rect(margin, y, contentWidth, rH);

      let rx = margin;
      doc.text(`${qty}${unit}`, rx + colBanyak / 2, y + (rH - 1.8), { align: "center" }); rx += colBanyak;
      const sName = doc.splitTextToSize((it.jenisBarang || "").toUpperCase(), colNama - 4);
      doc.text(sName[0] || "", rx + 2, y + (rH - 1.8)); rx += colNama;
      doc.text(hrg.toLocaleString("id-ID"), rx + colHarga - 2, y + (rH - 1.8), { align: "right" }); rx += colHarga;
      doc.text(sub.toLocaleString("id-ID"), rx + colJumlah - 2, y + (rH - 1.8), { align: "right" });

      y += rH;
    });

    // Baris Total Nota & Pembayaran
    const hasCashInfo = payNom > 0 && payNom !== grandTotal;
    const rowStep = pageW <= 110 ? 3.4 : 4.0;
    const baseRows = (hasDiscount ? 2 : 0) + 1 + (hasCashInfo ? 2 : 0);
    const totalBoxH = baseRows * rowStep + (pageW <= 110 ? 1.5 : 2.5);
    doc.rect(margin, y, contentWidth, totalBoxH);

    let curTotalY = y + (pageW <= 110 ? 3.2 : 3.8);

    if (hasDiscount) {
      applyFont(doc, "normal");
      doc.setFontSize(pageW <= 110 ? 6 : 7.2);
      doc.text("SUBTOTAL", margin + colBanyak + colNama - 4, curTotalY, { align: "right" });
      doc.text(`Rp ${subtotal.toLocaleString("id-ID")}`, pageW - margin - 2, curTotalY, { align: "right" });
      curTotalY += rowStep;

      doc.text(discountLabel.toUpperCase(), margin + colBanyak + colNama - 4, curTotalY, { align: "right" });
      doc.text(`- Rp ${diskonNominal.toLocaleString("id-ID")}`, pageW - margin - 2, curTotalY, { align: "right" });
      curTotalY += rowStep;
    }

    applyFont(doc, "bold");
    doc.setFontSize(pageW <= 110 ? 7 : 8.5);
    doc.text(hasDiscount ? "TOTAL AKHIR" : "TOTAL", margin + colBanyak + colNama - 4, curTotalY, { align: "right" });
    doc.text(`Rp ${grandTotal.toLocaleString("id-ID")}`, pageW - margin - 2, curTotalY, { align: "right" });
    curTotalY += rowStep;

    if (hasCashInfo) {
      applyFont(doc, "normal");
      doc.setFontSize(pageW <= 110 ? 6 : 7.2);
      doc.text("BAYAR", margin + colBanyak + colNama - 4, curTotalY, { align: "right" });
      doc.text(`Rp ${payNom.toLocaleString("id-ID")}`, pageW - margin - 2, curTotalY, { align: "right" });
      curTotalY += rowStep;

      doc.text("KEMBALI", margin + colBanyak + colNama - 4, curTotalY, { align: "right" });
      doc.text(`Rp ${changeNom.toLocaleString("id-ID")}`, pageW - margin - 2, curTotalY, { align: "right" });
    }
    y += totalBoxH + 2;

    // Bagian Tanda Tangan Bawah Nota
    applyFont(doc, "normal");
    doc.setFontSize(pageW <= 110 ? 5.8 : 6.8);
    doc.text("Tanda Terima,", margin + 8, y);
    doc.text("Hormat Kami,", pageW - margin - (pageW <= 110 ? 25 : 32), y);

    const signY = y + (pageH <= 110 ? 9 : 12);
    const penerimaNotaStr = data.penerimaNama && data.penerimaNama.trim() ? `( ${data.penerimaNama.trim()} )` : "( ................. )";
    doc.text(penerimaNotaStr, margin + 5, signY);
    doc.text(`( ${data.namaKasir || "Toko"} )`, pageW - margin - (pageW <= 110 ? 27 : 35), signY);

    doc.setFontSize(pageW <= 110 ? 5 : 6);
    const notaNote = data.catatanKaki1 || "* Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.";
    const splitNotaNote = doc.splitTextToSize(notaNote, pageW - margin * 2);
    let noteY = pageH - 2.5 - (splitNotaNote.length - 1) * 2.3;
    splitNotaNote.forEach((l: string) => {
      doc.text(l, margin, noteY);
      noteY += 2.3;
    });

    return doc.output("blob");
  }

  // =========================================================================
  // PILIHAN 1: STRUK THERMAL (58 MM, 76 MM, 80 MM)
  // =========================================================================
  // Menentukan Lebar Kertas Struk
  let pageWidth = 80;
  let margin = 4;
  if (data.ukuranKertas === "58mm") {
    pageWidth = 58;
    margin = 2.5;
  } else if (data.ukuranKertas === "76mm") {
    pageWidth = 76;
    margin = 3.5;
  }

  const contentWidth = pageWidth - margin * 2;

  // Dynamic Height based on model, items & logo
  const logoExtraH = logoImg ? 18 : 0;
  const baseHeight = (model === "spbu" ? 165 : 145) + logoExtraH;
  const estimatedHeight = Math.max(baseHeight, 105 + logoExtraH + validItems.length * 12 + (model === "spbu" ? 35 : 20));

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [pageWidth, estimatedHeight],
  });

  // Terapkan warna tinta terpilih untuk teks dan garis
  doc.setTextColor(inkR, inkG, inkB);
  doc.setDrawColor(inkR, inkG, inkB);

  let y = 6;

  // Gambar Logo Toko di Kop Struk jika diunggah
  if (logoImg) {
    const logoW = pageWidth === 58 ? 14 : 18;
    const logoH = 14;
    drawLogoImage(doc, (pageWidth - logoW) / 2, y, logoW, logoH);
    y += logoH + 2;
  }

  // Separator styles
  const numDash = pageWidth === 58 ? 28 : (pageWidth === 76 ? 36 : 38);
  const lineEqual = "=".repeat(numDash);
  const lineDash = "-".repeat(numDash);
  const lineStar = "*".repeat(numDash);

  // ==========================================
  // RENDER HEADER STRUK SESUAI MODEL
  // ==========================================
  if (model === "spbu") {
    // MODEL 6: SPBU PERTAMINA
    applyFont(doc, "bold");
    doc.setFontSize(pageWidth === 58 ? 10.5 : 13);
    doc.text("PERTAMINA", pageWidth / 2, y, { align: "center" });
    y += 4.5;

    doc.setFontSize(pageWidth === 58 ? 7.5 : 8.5);
    const spbuNo = data.spbuNomor || data.namaToko || "SPBU 44.532.09 GANDRUNGMANGU";
    doc.text(spbuNo.toUpperCase(), pageWidth / 2, y, { align: "center" });
    y += 3.8;

    applyFont(doc, "normal");
    doc.setFontSize(pageWidth === 58 ? 6.5 : 7.5);
    const addrLines = doc.splitTextToSize(data.alamatToko || "Jl. Raya Gandrungmangu, Cilacap", contentWidth);
    addrLines.forEach((l: string) => {
      doc.text(l, pageWidth / 2, y, { align: "center" });
      y += 3.4;
    });

    applyFont(doc, "bold");
    doc.setFontSize(pageWidth === 58 ? 7 : 8);
    doc.text("PASTI PAS!", pageWidth / 2, y, { align: "center" });
    y += 3.5;

    doc.setFontSize(pageWidth === 58 ? 6.5 : 7.5);
    doc.text(lineStar, pageWidth / 2, y, { align: "center" });
    y += 3.8;

    // Metadata SPBU
    applyFont(doc, "normal");
    doc.text(`Waktu   : ${dateStr} ${timeStr}`, margin, y);
    y += 3.4;
    doc.text(`No.Trx  : ${noStruk}`, margin, y);
    y += 3.4;
    doc.text(`Pompa   : ${data.spbuNoPompa || "02 / 01"}`, margin, y);
    y += 3.4;
    if (data.spbuPlatNomor) {
      doc.text(`No.Pol  : ${data.spbuPlatNomor.toUpperCase()}`, margin, y);
      y += 3.4;
    }
    doc.text(`Operator: ${data.namaKasir || "PETUGAS 01"}`, margin, y);
    y += 3.6;

    doc.text(lineDash, pageWidth / 2, y, { align: "center" });
    y += 4;

  } else {
    // MODEL LAIN (1-5, 7-13)
    let subHeader = data.subHeaderToko !== undefined ? data.subHeaderToko : (
      model === "kelontong" ? "MINIMARKET / TOKO KELONTONG" :
        model === "sembako" ? "TOKO SEMBAKO & HASIL BUMI" :
          model === "atk" ? "PUSAT ATK, FOTOCOPY & PERCETAKAN" :
            model === "percetakan" ? "PERCETAKAN, BANNER & OFFSET" :
              model === "bangunan" ? "DEPOT BANGUNAN & MATERIAL FISIK" :
                model === "listrik" ? "TOKO LISTRIK, TEKNIK & ELEKTRONIK" :
                  model === "komputer" ? "COMPUTER, PRINTER & IT SOLUTIONS" :
                    model === "resto" ? "RUMAH MAKAN & CATERING DUS" :
                      model === "apotek" ? "APOTEK & ALAT KESEHATAN" :
                        model === "pertanian" ? "UD. SARANA PRODUKSI PERTANIAN & BIBIT" :
                          model === "mebeler" ? "TOKO MEBELER & MEBEL KANTOR DESA" :
                            model === "tratag_sound" ? "PERSEWAAN TRATAG, TENDA & SOUND SYSTEM" : ""
    );

    if (subHeader) {
      applyFont(doc, "bold");
      doc.setFontSize(pageWidth === 58 ? 6 : 7);
      const splitSub = doc.splitTextToSize(subHeader.trim(), pageWidth === 58 ? 48 : contentWidth);
      splitSub.forEach((line: string) => {
        doc.text(line, pageWidth / 2, y, { align: "center" });
        y += 3.3;
      });
      y += 0.5;
    }

    applyFont(doc, "bold");
    doc.setFontSize(pageWidth === 58 ? 9.0 : 10.5);
    const defaultTokoName = (data.namaToko || "MINIMARKET SAMPELDES JAYA").toUpperCase();
    const splitToko = doc.splitTextToSize(defaultTokoName, pageWidth === 58 ? 48 : contentWidth);
    splitToko.forEach((line: string) => {
      doc.text(line, pageWidth / 2, y, { align: "center" });
      y += 4.2;
    });

    applyFont(doc, "normal");
    doc.setFontSize(pageWidth === 58 ? 6.5 : 7.5);
    const addrLines = doc.splitTextToSize(data.alamatToko || "Kec. Gandrungmangu, Kab. Cilacap", contentWidth);
    addrLines.forEach((l: string) => {
      doc.text(l, pageWidth / 2, y, { align: "center" });
      y += 3.5;
    });

    if (data.noTelepon) {
      doc.text(`Telp: ${data.noTelepon}`, pageWidth / 2, y, { align: "center" });
      y += 3.5;
    }

    if (model === "apotek") {
      const izinApotek = data.catatanKhusus !== undefined ? data.catatanKhusus : "SIA: 440/128/SIA/2024 | SIPA: 19890214/SIPA/2021";
      if (izinApotek) {
        doc.setFontSize(pageWidth === 58 ? 5.8 : 6.8);
        doc.text(izinApotek, pageWidth / 2, y, { align: "center" });
        y += 3.4;
      }
    }

    doc.setFontSize(pageWidth === 58 ? 6.5 : 7.5);
    doc.text(lineEqual, pageWidth / 2, y, { align: "center" });
    y += 3.8;

    doc.text(`Tgl  : ${dateStr} ${timeStr}`, margin, y);
    y += 3.4;
    doc.text(`No   : ${noStruk}`, margin, y);
    y += 3.4;

    // Baris Kasir
    doc.text(`Kasir: ${data.namaKasir || "KASIR 01"}`, margin, y);
    y += 3.4;

    // Baris Keterangan Khusus Model (Kirim / Order / Tujuan / Prog / Acara)
    const rawKet = data.keteranganKhusus !== undefined
      ? data.keteranganKhusus
      : (
        model === "bangunan" ? "PROYEK FISIK / BALAI DESA" :
          model === "resto" ? "KONSUMSI / JAMUAN RAPAT" :
            model === "apotek" ? "POSYANDU / P3K DESA" :
              model === "pertanian" ? (data.keperluanProgram || "") :
                model === "mebeler" ? "INVENTARIS PEMDES SAMPELDES" :
                  model === "tratag_sound" ? "KEGIATAN RESMI PEMERINTAH DESA" :
                    model === "percetakan" ? "SPANDUK KEGIATAN DESA / BALIHO" : ""
      );

    if (rawKet && rawKet.trim()) {
      const defaultLbl = model === "bangunan" || model === "mebeler" ? "Kirim" :
        model === "resto" ? "Order" :
          model === "apotek" ? "Tujuan" :
            model === "pertanian" ? "Prog" :
              model === "tratag_sound" ? "Acara" :
                model === "percetakan" ? "Order" : "Ket";
      const lbl = data.labelKeteranganKhusus || defaultLbl;
      const splitKet = doc.splitTextToSize(`${lbl}: ${rawKet.trim().toUpperCase()}`, contentWidth);
      splitKet.forEach((l: string) => {
        doc.text(l, margin, y);
        y += 3.4;
      });
    }

    doc.text(lineDash, pageWidth / 2, y, { align: "center" });
    y += 4;
  }

  // DAFTAR ITEM BELANJA
  validItems.forEach((it, idx) => {
    const qty = String(it.banyaknya || 1);
    const unit = it.satuan ? ` ${it.satuan}` : "";
    const hrg = typeof it.hargaSatuan === "number" ? it.hargaSatuan : parseInt(String(it.hargaSatuan).replace(/\D/g, "")) || 0;
    const sub = typeof it.jumlah === "number" ? it.jumlah : parseInt(String(it.jumlah).replace(/\D/g, "")) || (parseFloat(qty) * hrg);

    if (model === "spbu") {
      applyFont(doc, "bold");
      doc.text(`PRODUK   : ${(it.jenisBarang || "PERTALITE").toUpperCase()}`, margin, y);
      y += 3.5;
      applyFont(doc, "normal");
      doc.text(`HARGA/L  : Rp ${hrg.toLocaleString("id-ID")}`, margin, y);
      y += 3.5;
      doc.text(`VOLUME   : ${qty} L`, margin, y);
      y += 3.5;
      applyFont(doc, "bold");
      doc.text(`TOTAL    : Rp ${sub.toLocaleString("id-ID")}`, margin, y);
      y += 4.5;
    } else {
      applyFont(doc, "bold");
      const nameLine = `${idx + 1}. ${(it.jenisBarang || "").toUpperCase()}`;
      const splitName = doc.splitTextToSize(nameLine, contentWidth);
      splitName.forEach((l: string) => {
        doc.text(l, margin, y);
        y += 3.5;
      });

      applyFont(doc, "normal");
      const qtyPrice = `   ${qty}${unit} x ${hrg.toLocaleString("id-ID")}`;
      const subStr = `Rp ${sub.toLocaleString("id-ID")}`;
      doc.text(qtyPrice, margin, y);
      doc.text(subStr, pageWidth - margin, y, { align: "right" });
      y += 4.2;
    }
  });

  doc.text(lineDash, pageWidth / 2, y, { align: "center" });
  y += 4;

  // TOTAL DAN PEMBAYARAN STRUK
  if (hasDiscount) {
    applyFont(doc, "normal");
    doc.setFontSize(pageWidth === 58 ? 6.8 : 7.8);
    doc.text("SUBTOTAL", margin, y);
    doc.text(`Rp ${subtotal.toLocaleString("id-ID")}`, pageWidth - margin, y, { align: "right" });
    y += 4;

    doc.text(discountLabel.toUpperCase(), margin, y);
    doc.text(`- Rp ${diskonNominal.toLocaleString("id-ID")}`, pageWidth - margin, y, { align: "right" });
    y += 4;
  }

  applyFont(doc, "bold");
  doc.setFontSize(pageWidth === 58 ? 7.5 : 8.5);
  doc.text(model === "spbu" ? "TOTAL RUPIAH" : (hasDiscount ? "TOTAL AKHIR" : "TOTAL BELANJA"), margin, y);
  doc.text(`Rp ${grandTotal.toLocaleString("id-ID")}`, pageWidth - margin, y, { align: "right" });
  y += 4.5;

  applyFont(doc, "normal");
  doc.setFontSize(pageWidth === 58 ? 7 : 8);
  doc.text(model === "spbu" ? "BAYAR CASH" : "TUNAI / CASH", margin, y);
  doc.text(`Rp ${payNom.toLocaleString("id-ID")}`, pageWidth - margin, y, { align: "right" });
  y += 4;

  doc.text("KEMBALI", margin, y);
  doc.text(`Rp ${changeNom.toLocaleString("id-ID")}`, pageWidth - margin, y, { align: "right" });
  y += 4;

  if (model !== "spbu") {
    doc.text(`TOTAL ITEM : ${totalQty} Qty`, margin, y);
    y += 4;
  }

  doc.setFontSize(pageWidth === 58 ? 6.5 : 7.5);
  doc.text(model === "spbu" ? lineStar : lineEqual, pageWidth / 2, y, { align: "center" });
  y += 4.5;

  // FOOTER STRUK (FLEKSIBEL MANUAL / PRESET MODEL)
  // Lebar aman khusus teks footer di struk thermal agar tidak menabrak garis tepi kertas
  const safeFooterWidth = pageWidth === 58 ? 44 : (pageWidth === 76 ? 58 : 62);

  const printFooterText = (text: string, fontSize: number, isBold: boolean, lineSpacing = 3.3) => {
    applyFont(doc, isBold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text.trim(), safeFooterWidth);
    lines.forEach((l: string) => {
      doc.text(l, pageWidth / 2, y, { align: "center" });
      y += lineSpacing;
    });
  };

  if (data.catatanKaki1 && data.catatanKaki1.trim()) {
    printFooterText(data.catatanKaki1, pageWidth === 58 ? 6.0 : (pageWidth === 76 ? 6.8 : 7.2), true, 3.4);

    if (data.catatanKaki2 && data.catatanKaki2.trim()) {
      y += 0.4;
      printFooterText(data.catatanKaki2, pageWidth === 58 ? 5.6 : (pageWidth === 76 ? 6.2 : 6.6), false, 3.1);
    }
  } else {
    if (model === "spbu") {
      printFooterText("PPN 11% & PBBKB Termasuk", pageWidth === 58 ? 5.8 : 6.8, false, 3.3);
      printFooterText("TERIMA KASIH & SELAMAT JALAN", pageWidth === 58 ? 6.2 : 7.2, true, 3.5);
      printFooterText("Utamakan Keselamatan Berkendara", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
    } else if (model === "bangunan") {
      printFooterText("TERIMA KASIH ATAS KUNJUNGAN ANDA", pageWidth === 58 ? 6.2 : 7.2, true, 3.5);
      printFooterText("Barang material telah diperiksa bersama", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
      printFooterText("Komplain kerusakan semen max 1x24 jam", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
    } else if (model === "listrik") {
      printFooterText("TERIMA KASIH ATAS KUNJUNGAN ANDA", pageWidth === 58 ? 6.2 : 7.2, true, 3.5);
      printFooterText("Garansi lampu resmi sesuai ketentuan pabrik", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
      printFooterText("Barang telah dites hidup sebelum dibawa", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
    } else if (model === "komputer") {
      printFooterText("TERIMA KASIH ATAS KEPERCAYAAN ANDA", pageWidth === 58 ? 6.2 : 7.2, true, 3.5);
      printFooterText("Garansi hardware servis/toko 1 bulan", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
      printFooterText("Simpan struk ini sebagai bukti garansi", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
    } else if (model === "resto") {
      printFooterText("SELAMAT MENIKMATI & TERIMA KASIH", pageWidth === 58 ? 6.2 : 7.2, true, 3.5);
      printFooterText("Pajak Restoran (PB1) Sudah Termasuk", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
      printFooterText("Menerima Pesanan Nasi Kotak & Jamuan", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
    } else if (model === "apotek") {
      printFooterText("SEMOGA LEKAS SEMBUH & SEHAT SELALU", pageWidth === 58 ? 6.2 : 7.2, true, 3.5);
      printFooterText("Konsultasikan penggunaan obat pada Apoteker", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
      printFooterText("Simpan obat di tempat sejuk & kering", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
    } else if (model === "pertanian") {
      printFooterText("MAJU BERSAMA PETANI DESA", pageWidth === 58 ? 6.2 : 7.2, true, 3.5);
      printFooterText("Produk resmi terdaftar di Kementan RI", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
      printFooterText("TERIMA KASIH ATAS KUNJUNGAN ANDA", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
    } else if (model === "atk") {
      printFooterText("TERIMA KASIH ATAS KUNJUNGAN ANDA", pageWidth === 58 ? 6.2 : 7.2, true, 3.5);
      printFooterText("Menyediakan ATK Kantor, Cetak & Jilid", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
    } else if (model === "percetakan") {
      printFooterText("TERIMA KASIH ATAS KEPERCAYAAN ANDA", pageWidth === 58 ? 6.2 : 7.2, true, 3.5);
      printFooterText("Desain & cetakan telah dicek bersama", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
      printFooterText("Garansi hasil cetak banner tajam & presisi", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
    } else if (model === "sembako") {
      printFooterText("MATUR NUWUN / TERIMA KASIH", pageWidth === 58 ? 6.2 : 7.2, true, 3.5);
      printFooterText("LUNAS / PEMBAYARAN CASH SAH", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
      printFooterText("Barang yang sudah dibeli tidak dapat ditukar", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
    } else if (model === "mebeler") {
      printFooterText("TERIMA KASIH ATAS KUNJUNGAN ANDA", pageWidth === 58 ? 6.2 : 7.2, true, 3.5);
      printFooterText("Barang mebeler telah dicek bersama", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
      printFooterText("Garansi perbaikan finishing 1 bulan", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
    } else if (model === "tratag_sound") {
      printFooterText("TERIMA KASIH ATAS KEPERCAYAAN ANDA", pageWidth === 58 ? 6.2 : 7.2, true, 3.5);
      printFooterText("Penyewaan tratag, panggung & sound system", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
      printFooterText("Melayani kegiatan desa & hajatan masyarakat", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
    } else {
      printFooterText("TERIMA KASIH ATAS KUNJUNGAN ANDA", pageWidth === 58 ? 6.2 : 7.2, true, 3.5);
      printFooterText("Barang yang sudah dibeli", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
      printFooterText("tidak dapat ditukar/dikembalikan", pageWidth === 58 ? 5.6 : 6.6, false, 3.1);
      y += 1.0;

      applyFont(doc, "bold");
      doc.setFontSize(pageWidth === 58 ? 7.5 : 9);
      doc.text("||||| |||| |||||| ||||| |||| ||||||", pageWidth / 2, y, { align: "center" });
      y += 3.2;
      applyFont(doc, "normal");
      doc.setFontSize(5.5);
      doc.text(`*${noStruk}*`, pageWidth / 2, y, { align: "center" });
    }
  }

  return doc.output("blob");
};
