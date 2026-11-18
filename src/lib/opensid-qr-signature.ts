'use client';

import { getCachedVillageIdentity, type VillageIdentityInfo } from './village-identity';

export type QrLogoMode = 'logo_desa' | 'garuda' | 'bsre' | 'custom' | 'none';
export type QrContentMode = 'url_verifikasi' | 'ringkasan_dokumen' | 'custom';
export type QrSignMode = 'qr' | 'manual';

/**
 * Skema Pengaturan Penandatanganan QR (Mengacu pada OpenSID:
 * - resources/views/admin/pengaturan_surat/umum.blade.php (qr_code, qr_code_tte)
 * - resources/views/admin/pengaturan_surat/partials/pengaturan_tte.blade.php (tte, visual_tte, visual_tte_gambar, tinggi, lebar)
 * - resources/views/admin/qrcode/setting_qr.blade.php & donjo-app/controllers/Qr_code.php (isiqr, changeqr, logoqr, sizeqr, foreqr)
 * - app/Libraries/TinyMCE/KodeIsianGambar.php ([qr_code], [logo_bsre], shouldIncludeQrCode)
 * - app/Libraries/TinyMCE.php (FOOTER_TTE)
 * )
 */
export interface OpenSidQrSignatureSettings {
  /** Tampilkan QR Code pada surat (qr_code di OpenSID) */
  enabled: boolean;
  /** Mode default saat cetak: 'qr' (Tanda Tangan QR) atau 'manual' (Tanda Tangan Basah) */
  defaultSignMode: QrSignMode;
  /** Aktifkan mode TTE / BSrE (qr_code_tte & visual_tte di OpenSID) */
  tteEnabled: boolean;
  /** Terapkan QR Code juga pada dokumen Lampiran Surat (F-1.01..N-4, dll.) */
  applyToLampiran: boolean;
  /** Tampilkan Footer TTE / Klausul UU ITE Pasal 5 Ayat 1 di bawah halaman surat */
  showFooterTte: boolean;
  /** Jenis sisipan logo di tengah QR Code (changeqr di OpenSID: Otomatis Logo Desa / Garuda / BSrE / Manual / Polos) */
  logoMode: QrLogoMode;
  /** URL logo kustom apabila logoMode === 'custom' */
  customLogoUrl: string;
  /** URL Logo Desa resmi dari /admin/settings (villageLogo/default) */
  villageLogoUrl?: string;
  /** Ukuran QR Code dalam piksel pada cetakan surat (sizeqr di OpenSID, default 90px) */
  sizePx: number;
  /** Warna depan matriks QR Code (foreqr di OpenSID, default #000000) */
  foreColor: string;
  /** Mode isi payload QR Code (isiqr di OpenSID) */
  contentMode: QrContentMode;
  /** Template isi QR kustom jika contentMode === 'custom' (maks 300 karakter) */
  customContentTemplate: string;
  /** Tampilkan label kecil keterangan TTE/Verifikasi di bawah QR Code */
  showCaptionBelowQr: boolean;
  /** Teks label di bawah QR Code */
  captionText: string;
}

export const DEFAULT_QR_SIGNATURE_SETTINGS: OpenSidQrSignatureSettings = {
  enabled: true,
  defaultSignMode: 'qr',
  tteEnabled: false,
  applyToLampiran: false,
  showFooterTte: false,
  logoMode: 'logo_desa',
  customLogoUrl: '',
  sizePx: 90,
  foreColor: '#000000',
  contentMode: 'url_verifikasi',
  customContentTemplate:
    'VERIFIKASI SURAT RESMI PEMERINTAH [sebutan_desa] [nama_desa] | No: [nomor_surat] | Layanan: [judul_surat] | Pemohon: [nama_pemohon] | Penandatangan: [jabatan] ([nama_pamong]) | Tanggal: [tanggal_surat]',
  showCaptionBelowQr: false,
  captionText: 'Ditandatangani secara elektronik',
};

export const QR_SIGNATURE_GLOBAL_STORAGE_KEY = 'opensid_qr_signature_settings_v1';
export const VILLAGE_LOGO_STORAGE_KEY = 'village_logo_cache_v1';

export function getCachedVillageLogoUrl(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(VILLAGE_LOGO_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setCachedVillageLogoUrl(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (url) {
      window.localStorage.setItem(VILLAGE_LOGO_STORAGE_KEY, url);
    } else {
      window.localStorage.removeItem(VILLAGE_LOGO_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function getCachedGlobalQrSettings(): OpenSidQrSignatureSettings {
  if (typeof window === 'undefined') return DEFAULT_QR_SIGNATURE_SETTINGS;
  try {
    const raw = window.localStorage.getItem(QR_SIGNATURE_GLOBAL_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_QR_SIGNATURE_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_QR_SIGNATURE_SETTINGS;
}

export function setCachedGlobalQrSettings(settings: OpenSidQrSignatureSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(QR_SIGNATURE_GLOBAL_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function resolveEffectiveQrSettings(
  itemQrSettings?: Partial<OpenSidQrSignatureSettings> | null,
  legacyQrCodeFlag?: boolean,
  legacyQrCodeTteFlag?: boolean,
): OpenSidQrSignatureSettings {
  const globalBase = getCachedGlobalQrSettings();
  return {
    ...globalBase,
    ...(itemQrSettings || {}),
    enabled:
      itemQrSettings?.enabled !== undefined
        ? itemQrSettings.enabled
        : legacyQrCodeFlag !== undefined
          ? legacyQrCodeFlag
          : globalBase.enabled,
    tteEnabled:
      itemQrSettings?.tteEnabled !== undefined
        ? itemQrSettings.tteEnabled
        : legacyQrCodeTteFlag !== undefined
          ? legacyQrCodeTteFlag
          : globalBase.tteEnabled,
  };
}

// ============================================================================
// ISO/IEC 18004 QR CODE MATRIX ENCODER (Versions 1..13, EC Level M, Byte Mode)
// Menghasilkan matriks 2D QR Code yang 100% dapat dipindai kamera HP / Scanner
// ============================================================================

interface VersionBlockSpec {
  version: number;
  totalDataCodewords: number;
  ecCodewordsPerBlock: number;
  numBlocksGroup1: number;
  dataCodewordsGroup1: number;
  numBlocksGroup2: number;
  dataCodewordsGroup2: number;
  alignmentPatterns: number[];
}

const VERSION_SPECS_EC_M: VersionBlockSpec[] = [
  { version: 1, totalDataCodewords: 16, ecCodewordsPerBlock: 10, numBlocksGroup1: 1, dataCodewordsGroup1: 16, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [] },
  { version: 2, totalDataCodewords: 28, ecCodewordsPerBlock: 16, numBlocksGroup1: 1, dataCodewordsGroup1: 28, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 18] },
  { version: 3, totalDataCodewords: 44, ecCodewordsPerBlock: 26, numBlocksGroup1: 1, dataCodewordsGroup1: 44, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 22] },
  { version: 4, totalDataCodewords: 64, ecCodewordsPerBlock: 18, numBlocksGroup1: 2, dataCodewordsGroup1: 32, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 26] },
  { version: 5, totalDataCodewords: 86, ecCodewordsPerBlock: 24, numBlocksGroup1: 2, dataCodewordsGroup1: 43, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 30] },
  { version: 6, totalDataCodewords: 108, ecCodewordsPerBlock: 16, numBlocksGroup1: 4, dataCodewordsGroup1: 27, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 34] },
  { version: 7, totalDataCodewords: 124, ecCodewordsPerBlock: 18, numBlocksGroup1: 4, dataCodewordsGroup1: 31, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 22, 38] },
  { version: 8, totalDataCodewords: 154, ecCodewordsPerBlock: 22, numBlocksGroup1: 2, dataCodewordsGroup1: 38, numBlocksGroup2: 2, dataCodewordsGroup2: 39, alignmentPatterns: [6, 24, 42] },
  { version: 9, totalDataCodewords: 182, ecCodewordsPerBlock: 22, numBlocksGroup1: 3, dataCodewordsGroup1: 36, numBlocksGroup2: 2, dataCodewordsGroup2: 37, alignmentPatterns: [6, 26, 46] },
  { version: 10, totalDataCodewords: 216, ecCodewordsPerBlock: 26, numBlocksGroup1: 4, dataCodewordsGroup1: 43, numBlocksGroup2: 1, dataCodewordsGroup2: 44, alignmentPatterns: [6, 28, 50] },
  { version: 11, totalDataCodewords: 254, ecCodewordsPerBlock: 30, numBlocksGroup1: 1, dataCodewordsGroup1: 50, numBlocksGroup2: 4, dataCodewordsGroup2: 51, alignmentPatterns: [6, 30, 54] },
  { version: 12, totalDataCodewords: 290, ecCodewordsPerBlock: 22, numBlocksGroup1: 6, dataCodewordsGroup1: 36, numBlocksGroup2: 2, dataCodewordsGroup2: 37, alignmentPatterns: [6, 32, 58] },
  { version: 13, totalDataCodewords: 334, ecCodewordsPerBlock: 22, numBlocksGroup1: 8, dataCodewordsGroup1: 37, numBlocksGroup2: 1, dataCodewordsGroup2: 38, alignmentPatterns: [6, 34, 62] },
];

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function getReedSolomonGeneratorPoly(degree: number): Uint8Array {
  let result = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(result.length + 1);
    const root = GF_EXP[i];
    for (let j = 0; j < result.length; j++) {
      next[j] ^= result[j];
      next[j + 1] ^= gfMul(result[j], root);
    }
    result = next;
  }
  return result;
}

function computeReedSolomonRemainder(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = getReedSolomonGeneratorPoly(ecLen);
  const rem = new Uint8Array(ecLen);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    rem.copyWithin(0, 1);
    rem[ecLen - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < ecLen; j++) {
        rem[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }
  return rem;
}

export function encodeQrMatrix(text: string): boolean[][] {
  const utf8Bytes = new TextEncoder().encode((text || 'https://verifikasi.desa.id').slice(0, 320));
  const byteLen = utf8Bytes.length;

  // Pilih versi terkecil yang muat
  let spec = VERSION_SPECS_EC_M[VERSION_SPECS_EC_M.length - 1];
  for (const candidate of VERSION_SPECS_EC_M) {
    const headerBits = candidate.version <= 9 ? 4 + 8 : 4 + 16;
    const maxBytes = Math.floor((candidate.totalDataCodewords * 8 - headerBits) / 8);
    if (byteLen <= maxBytes) {
      spec = candidate;
      break;
    }
  }

  // Susun bit stream
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  // Mode indicator Byte = 0100
  pushBits(0b0100, 4);
  // Character count indicator
  pushBits(byteLen, spec.version <= 9 ? 8 : 16);
  // Data bytes
  for (let i = 0; i < byteLen; i++) {
    pushBits(utf8Bytes[i], 8);
  }

  const totalDataBits = spec.totalDataCodewords * 8;
  // Terminator (up to 4 zeros)
  const terminatorLen = Math.min(4, totalDataBits - bits.length);
  pushBits(0, terminatorLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad bytes 0xEC, 0x11
  let padToggle = true;
  while (bits.length < totalDataBits) {
    pushBits(padToggle ? 0xec : 0x11, 8);
    padToggle = !padToggle;
  }

  const dataCodewords = new Uint8Array(spec.totalDataCodewords);
  for (let i = 0; i < spec.totalDataCodewords; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataCodewords[i] = b;
  }

  // Bagi ke dalam blok dan hitung EC tiap blok
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;

  for (let i = 0; i < spec.numBlocksGroup1; i++) {
    const block = dataCodewords.slice(offset, offset + spec.dataCodewordsGroup1);
    offset += spec.dataCodewordsGroup1;
    dataBlocks.push(block);
    ecBlocks.push(computeReedSolomonRemainder(block, spec.ecCodewordsPerBlock));
  }
  for (let i = 0; i < spec.numBlocksGroup2; i++) {
    const block = dataCodewords.slice(offset, offset + spec.dataCodewordsGroup2);
    offset += spec.dataCodewordsGroup2;
    dataBlocks.push(block);
    ecBlocks.push(computeReedSolomonRemainder(block, spec.ecCodewordsPerBlock));
  }

  // Interleave data codewords & EC codewords
  const interleaved: number[] = [];
  const maxDataBlockLen = Math.max(spec.dataCodewordsGroup1, spec.dataCodewordsGroup2);
  for (let col = 0; col < maxDataBlockLen; col++) {
    for (let b = 0; b < dataBlocks.length; b++) {
      if (col < dataBlocks[b].length) {
        interleaved.push(dataBlocks[b][col]);
      }
    }
  }
  for (let col = 0; col < spec.ecCodewordsPerBlock; col++) {
    for (let b = 0; b < ecBlocks.length; b++) {
      interleaved.push(ecBlocks[b][col]);
    }
  }

  const size = spec.version * 4 + 17;
  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r < 0 || r >= size || c < 0 || c >= size) return;
    modules[r][c] = dark;
    isFunction[r][c] = true;
  };

  // Timing patterns
  for (let i = 0; i < size; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Finder patterns (3 sudut)
  const drawFinder = (topR: number, leftC: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = topR + dr;
        const c = leftC + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const isBorder = dr === -1 || dr === 7 || dc === -1 || dc === 7;
        const isOuter = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const isInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(r, c, !isBorder && (isOuter || isInner));
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Alignment patterns
  const alignCoords = spec.alignmentPatterns;
  for (let i = 0; i < alignCoords.length; i++) {
    for (let j = 0; j < alignCoords.length; j++) {
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === alignCoords.length - 1) ||
        (i === alignCoords.length - 1 && j === 0)
      ) {
        continue;
      }
      const cr = alignCoords[i];
      const cc = alignCoords[j];
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          setFunctionModule(cr + dr, cc + dc, dist !== 1);
        }
      }
    }
  }

  // Reserve format information areas & dark module
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      isFunction[8][i] = true;
      isFunction[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunction[size - 1 - i][8] = true;
    isFunction[8][size - 1 - i] = true;
  }
  setFunctionModule(size - 8, 8, true);

  // Version information (for version >= 7)
  if (spec.version >= 7) {
    let rem = spec.version;
    for (let i = 0; i < 12; i++) {
      rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    }
    const verBits = (spec.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const bit = ((verBits >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunctionModule(a, b, bit);
      setFunctionModule(b, a, bit);
    }
  }

  // Place data bits in zigzag pattern
  let bitIdx = 0;
  const totalInterleavedBits = interleaved.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        if (!isFunction[r][c]) {
          let dark = false;
          if (bitIdx < totalInterleavedBits) {
            const byteVal = interleaved[bitIdx >>> 3];
            dark = ((byteVal >>> (7 - (bitIdx & 7))) & 1) !== 0;
            bitIdx++;
          }
          // Apply Mask 0: (r + c) % 2 === 0
          if ((r + c) % 2 === 0) {
            dark = !dark;
          }
          modules[r][c] = dark;
        }
      }
    }
  }

  // Format information for EC Level M (00) + Mask 0 (000) => data = 00000 => BCH + XOR 0x5412 = 0x5412
  const formatBits = 0x5412;
  for (let i = 0; i <= 5; i++) setFunctionModule(8, i, ((formatBits >>> i) & 1) !== 0);
  setFunctionModule(8, 7, ((formatBits >>> 6) & 1) !== 0);
  setFunctionModule(8, 8, ((formatBits >>> 7) & 1) !== 0);
  setFunctionModule(7, 8, ((formatBits >>> 8) & 1) !== 0);
  for (let i = 9; i < 15; i++) setFunctionModule(14 - i, 8, ((formatBits >>> i) & 1) !== 0);

  for (let i = 0; i < 8; i++) setFunctionModule(size - 1 - i, 8, ((formatBits >>> i) & 1) !== 0);
  for (let i = 8; i < 15; i++) setFunctionModule(8, size - 15 + i, ((formatBits >>> i) & 1) !== 0);

  return modules;
}

export interface QrPayloadContext {
  submissionId?: string;
  nomorSurat?: string;
  judulSurat?: string;
  tanggalSurat?: string;
  namaPemohon?: string;
  nikPemohon?: string;
  jabatanPenandatangan?: string;
  namaPenandatangan?: string;
  nipPenandatangan?: string;
  signerCode?: 'kades' | 'sekdes';
  identity?: Partial<VillageIdentityInfo>;
}

/**
 * Menyusun isi QR Code (isiqr) sesuai aturan OpenSID:
 * - 'url_verifikasi': mengarah ke halaman publik /verifikasi-surat?id=...
 * - 'ringkasan_dokumen': teks pengesahan dokumen resmi pemerintah desa
 * - 'custom': substitusi variabel pada template kustom
 */
export function buildQrVerificationPayload(
  settings: OpenSidQrSignatureSettings,
  ctx: QrPayloadContext,
): string {
  const vId = { ...getCachedVillageIdentity(), ...(ctx.identity || {}) };
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : vId.websiteDesa || 'https://sampeldes.gandrungmangu.id';

  const docId = ctx.submissionId || 'preview';
  const signerParam = ctx.signerCode || 'kades';
  const nomor = ctx.nomorSurat || '470/001/11/2026';
  const judul = ctx.judulSurat || 'Surat Keterangan';
  const tanggal = ctx.tanggalSurat || new Date().toLocaleDateString('id-ID');
  const pemohon = ctx.namaPemohon || 'Warga Desa';
  const jabatan =
    ctx.jabatanPenandatangan ||
    (signerParam === 'sekdes'
      ? `Sekretaris ${vId.sebutanDesa} ${vId.namaDesa}`
      : `Kepala ${vId.sebutanDesa} ${vId.namaDesa}`);
  const pamong =
    ctx.namaPenandatangan ||
    (signerParam === 'sekdes' ? vId.namaSekretarisDesa : vId.namaKepalaDesa);

  const verificationUrl = `${origin.replace(/\/$/, '')}/verifikasi-surat?id=${encodeURIComponent(
    docId,
  )}&signer=${encodeURIComponent(signerParam)}&no=${encodeURIComponent(nomor)}&perihal=${encodeURIComponent(
    judul,
  )}&pemohon=${encodeURIComponent(pemohon)}`;

  if (settings.contentMode === 'custom' && settings.customContentTemplate) {
    const tpl = settings.customContentTemplate;
    return tpl
      .replace(/\[nomor_surat\]/gi, nomor)
      .replace(/\[judul_surat\]/gi, judul)
      .replace(/\[tanggal_surat\]/gi, tanggal)
      .replace(/\[nama_pemohon\]/gi, pemohon)
      .replace(/\[nama\]/gi, pemohon)
      .replace(/\[nik\]/gi, ctx.nikPemohon || '-')
      .replace(/\[jabatan\]/gi, jabatan)
      .replace(/\[nama_pamong\]/gi, pamong)
      .replace(/\[nama_desa\]/gi, vId.namaDesa)
      .replace(/\[sebutan_desa\]/gi, vId.sebutanDesa)
      .replace(/\[nama_kecamatan\]/gi, vId.namaKecamatan)
      .replace(/\[nama_kabupaten\]/gi, vId.namaKabupaten)
      .replace(/\[url_verifikasi\]/gi, verificationUrl)
      .slice(0, 300);
  }

  if (settings.contentMode === 'ringkasan_dokumen') {
    return `DOKUMEN SAH PEMERINTAH ${vId.sebutanDesa.toUpperCase()} ${vId.namaDesa.toUpperCase()} (${vId.namaKabupaten.toUpperCase()}) | No: ${nomor} | ${judul} | Pemohon: ${pemohon} | Disahkan: ${jabatan} - ${pamong} | Tgl: ${tanggal}`;
  }

  // Default: Selalu kembalikan tautan URL publik agar pemindai kamera HP langsung mendeteksi web link
  return verificationUrl;
}

/**
 * Menghasilkan SVG string QR Code dengan lambang/logo tengah sesuai OpenSID (`pict_helper.php::qrcode_generate`).
 * Mendukung logo resmi Desa Sampeldes dari /admin/settings (villageLogo/default).
 */
export function generateQrCodeSvgString(
  payload: string,
  settings: Partial<OpenSidQrSignatureSettings> = {},
  logoUrlOverride?: string,
): string {
  const cfg = { ...DEFAULT_QR_SIGNATURE_SETTINGS, ...settings };
  const matrix = encodeQrMatrix(payload);
  const moduleCount = matrix.length;
  const quietZone = 2;
  const totalModules = moduleCount + quietZone * 2;
  const sizePx = Math.max(55, Math.min(240, Number(cfg.sizePx) || 90));
  const foreColor = /^#[0-9a-fA-F]{6}$/.test(cfg.foreColor || '') ? cfg.foreColor : '#000000';

  const hasCenterLogo = cfg.logoMode !== 'none';
  const centerStart = Math.floor(moduleCount * 0.37);
  const centerEnd = Math.ceil(moduleCount * 0.63);

  let pathD = '';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (!matrix[r][c]) continue;
      // Kosongkan area tengah untuk logo (sekitar 1/4 lebar QR)
      if (hasCenterLogo && r >= centerStart && r < centerEnd && c >= centerStart && c < centerEnd) {
        continue;
      }
      const x = c + quietZone;
      const y = r + quietZone;
      pathD += `M${x},${y}h1v1h-1z`;
    }
  }

  const centerCoord = totalModules / 2;
  const boxSize = totalModules * 0.26;
  const boxX = centerCoord - boxSize / 2;
  const boxY = centerCoord - boxSize / 2;

  let centerBadgeSvg = '';
  if (cfg.logoMode === 'logo_desa') {
    const resolvedVillageLogo =
      logoUrlOverride ||
      cfg.villageLogoUrl ||
      getCachedVillageLogoUrl() ||
      cfg.customLogoUrl ||
      '';

    if (resolvedVillageLogo) {
      // Sisipkan logo desa dari /admin/settings
      centerBadgeSvg = `
        <rect x="${boxX}" y="${boxY}" width="${boxSize}" height="${boxSize}" rx="1.5" fill="#ffffff" stroke="${foreColor}" stroke-width="0.35"/>
        <image href="${resolvedVillageLogo}" x="${boxX + boxSize * 0.08}" y="${boxY + boxSize * 0.08}" width="${boxSize * 0.84}" height="${boxSize * 0.84}" preserveAspectRatio="xMidYMid meet"/>
      `;
    } else {
      // Fallback lambang perisai jika logo desa belum diunggah
      centerBadgeSvg = `
        <rect x="${boxX}" y="${boxY}" width="${boxSize}" height="${boxSize}" rx="1.2" fill="#ffffff" stroke="${foreColor}" stroke-width="0.45"/>
        <path d="M${centerCoord},${boxY + boxSize * 0.14} L${boxX + boxSize * 0.84},${boxY + boxSize * 0.34} L${boxX + boxSize * 0.80},${boxY + boxSize * 0.72} L${centerCoord},${boxY + boxSize * 0.88} L${boxX + boxSize * 0.20},${boxY + boxSize * 0.72} L${boxX + boxSize * 0.16},${boxY + boxSize * 0.34} Z" fill="#0f766e" stroke="#ffffff" stroke-width="0.3"/>
        <polygon points="${centerCoord},${boxY + boxSize * 0.28} ${centerCoord + boxSize * 0.16},${boxY + boxSize * 0.56} ${centerCoord - boxSize * 0.16},${boxY + boxSize * 0.56}" fill="#facc15"/>
      `;
    }
  } else if (cfg.logoMode === 'garuda') {
    centerBadgeSvg = `
      <rect x="${boxX}" y="${boxY}" width="${boxSize}" height="${boxSize}" rx="1.2" fill="#ffffff" stroke="#b45309" stroke-width="0.45"/>
      <circle cx="${centerCoord}" cy="${centerCoord}" r="${boxSize * 0.36}" fill="#fef3c7" stroke="#d97706" stroke-width="0.4"/>
      <path d="M${centerCoord},${boxY + boxSize * 0.22} L${centerCoord + boxSize * 0.24},${centerCoord} L${centerCoord},${boxY + boxSize * 0.78} L${centerCoord - boxSize * 0.24},${centerCoord} Z" fill="#b45309"/>
    `;
  } else if (cfg.logoMode === 'bsre') {
    centerBadgeSvg = `
      <rect x="${boxX}" y="${boxY}" width="${boxSize}" height="${boxSize}" rx="1.2" fill="#ffffff" stroke="#0284c7" stroke-width="0.45"/>
      <rect x="${boxX + boxSize * 0.12}" y="${boxY + boxSize * 0.24}" width="${boxSize * 0.76}" height="${boxSize * 0.52}" rx="0.8" fill="#0284c7"/>
      <text x="${centerCoord}" y="${centerCoord + boxSize * 0.11}" font-family="Arial, sans-serif" font-size="${boxSize * 0.28}" font-weight="bold" fill="#ffffff" text-anchor="middle">TTE</text>
    `;
  } else if (cfg.logoMode === 'custom') {
    const customUrl = cfg.customLogoUrl || logoUrlOverride || '';
    if (customUrl) {
      centerBadgeSvg = `
        <rect x="${boxX}" y="${boxY}" width="${boxSize}" height="${boxSize}" rx="1.5" fill="#ffffff" stroke="${foreColor}" stroke-width="0.35"/>
        <image href="${customUrl}" x="${boxX + boxSize * 0.08}" y="${boxY + boxSize * 0.08}" width="${boxSize * 0.84}" height="${boxSize * 0.84}" preserveAspectRatio="xMidYMid meet"/>
      `;
    } else {
      centerBadgeSvg = `
        <rect x="${boxX}" y="${boxY}" width="${boxSize}" height="${boxSize}" rx="1.2" fill="#ffffff" stroke="${foreColor}" stroke-width="0.45"/>
        <circle cx="${centerCoord}" cy="${centerCoord}" r="${boxSize * 0.3}" fill="${foreColor}"/>
      `;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges"><rect width="${totalModules}" height="${totalModules}" fill="#ffffff"/><path d="${pathD}" fill="${foreColor}"/>${centerBadgeSvg}</svg>`;
}

export function generateQrCodeDataUri(
  payload: string,
  settings: Partial<OpenSidQrSignatureSettings> = {},
  logoUrlOverride?: string,
): string {
  const svg = generateQrCodeSvgString(payload, settings, logoUrlOverride);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Menghasilkan blok HTML gambar QR Code untuk menggantikan tag `[qr_code]` pada template OpenSID
 * sesuai `KodeIsianGambar::handleQrCode()` di OpenSID.
 */
export function buildOpenSidQrHtmlBlock(
  settings: Partial<OpenSidQrSignatureSettings>,
  ctx: QrPayloadContext,
  logoUrlOverride?: string,
): string {
  const cfg = { ...DEFAULT_QR_SIGNATURE_SETTINGS, ...settings };
  if (!cfg.enabled) return '';

  const payload = buildQrVerificationPayload(cfg, ctx);
  const dataUri = generateQrCodeDataUri(payload, cfg, logoUrlOverride || cfg.villageLogoUrl);
  const sizePx = Math.max(55, Math.min(240, Number(cfg.sizePx) || 90));

  const captionHtml =
    cfg.showCaptionBelowQr && cfg.captionText
      ? `<div style="font-size: 6.5pt; color: #334155; margin-top: 2px; line-height: 1.1; font-family: Arial, sans-serif;">${cfg.captionText}</div>`
      : '';

  return `<div class="opensid-qr-signature" style="display: inline-block; text-align: center; vertical-align: middle; margin: 2px auto; line-height: 1;"><img src="${dataUri}" width="${sizePx}" height="${sizePx}" alt="qrcode-surat" style="width: ${sizePx}px; height: ${sizePx}px; display: inline-block; margin: 0 auto;" />${captionHtml}</div>`;
}

/**
 * Menghasilkan blok Footer TTE / BSrE sesuai `TinyMCE::FOOTER_TTE` di OpenSID
 */
export function buildOpenSidFooterTteHtml(kodeDesa: string, kodeSurat: string): string {
  return `
    <div class="opensid-footer-tte" style="margin-top: 8px; padding-top: 4px; border-top: 1px solid #cbd5e1; font-family: Arial, sans-serif; color: #1e293b;">
      <table style="border-collapse: collapse; width: 100%; font-size: 6.5pt; line-height: 1.25;" border="0">
        <tbody>
          <tr>
            <td style="width: 14%; vertical-align: middle; text-align: center; padding-right: 6px;">
              <div style="display: inline-block; border: 1px solid #0284c7; background: #f0f9ff; color: #0369a1; border-radius: 4px; padding: 3px 6px; font-weight: bold; font-size: 7pt; line-height: 1.1;">
                BSrE - BSSN<br/><span style="font-size: 5.5pt; font-weight: normal;">TTE Tersertifikasi</span>
              </div>
            </td>
            <td style="width: 72%; text-align: left; vertical-align: middle;">
              <ul style="margin: 0; padding-left: 14px; font-size: 6pt;">
                <li>UU ITE No. 11 Tahun 2008 Pasal 5 Ayat 1: <em>"Informasi Elektronik dan/atau Dokumen Elektronik dan/atau hasil cetaknya merupakan alat bukti hukum yang sah."</em></li>
                <li>Dokumen ini telah ditandatangani secara elektronik / dilengkapi kode verifikasi digital resmi Pemerintah Desa (${kodeDesa}).</li>
                <li>Keaslian surat ini dapat dibuktikan dengan memindai (scan) QR Code yang tertera pada blok tanda tangan (${kodeSurat}).</li>
              </ul>
            </td>
            <td style="width: 14%; text-align: right; vertical-align: bottom; font-size: 6.5pt; font-family: monospace;">
              ${kodeSurat}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}


