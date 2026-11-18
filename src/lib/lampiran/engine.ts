import {
  buildDummyPreviewContext,
  replaceOpenSidKodeIsian,
  type OpenSidRenderContext,
} from '../opensid-surat-engine';
import {
  type LampiranSuratItem,
  DEFAULT_LAMPIRAN_MARGIN,
  DEFAULT_LAMPIRAN_KOTAK,
} from './types';
import { MASTER_LAMPIRAN_SURAT } from './master-data';
import { getDefaultLampiranFormIsian, getDefaultLampiranKodeIsian } from './form-isian';
import {
  buildF101LandscapeHtml,
  buildF102PortraitHtml,
  buildF103PortraitHtml,
  buildF106PortraitHtml,
  buildF108PortraitHtml,
  buildF115PortraitHtml,
  buildF116PortraitHtml,
  buildF121PortraitHtml,
  buildF125PortraitHtml,
  buildF127PortraitHtml,
  buildF201PortraitHtml,
  buildF203PortraitHtml,
  buildF204PortraitHtml,
  buildF209PortraitHtml,
  buildF212PortraitHtml,
  buildF229PortraitHtml,
  buildF230PortraitHtml,
  buildModelN1PortraitHtml,
  buildModelN2PortraitHtml,
  buildModelN4PortraitHtml,
  buildModelN5PortraitHtml,
  buildModelN6PortraitHtml,
  buildSpsPortraitHtml,
  buildSwnPortraitHtml,
  buildSpHilangPortraitHtml,
  buildSptjmBnPortraitHtml,
  buildSpBmPortraitHtml,
  buildSpSktmPortraitHtml,
  getDefaultLampiranHtmlTemplate,
} from './templates';

export function resolveLampiranAlias(raw: string): string {
  const s = (raw || '').toLowerCase().trim();
  if (!s) return '';

  // 1. F-2.01 spesifik kematian / kelahiran / perkawinan
  if (s.includes('2.01') || s.includes('2-01')) {
    if (s.includes('kematian') || s.includes('mati')) return 'F-2.01 Kematian';
    if (s.includes('kelahiran') || s.includes('lahir')) return 'F-2.01 Kelahiran';
    if (s.includes('perkawinan') || s.includes('nikah')) return 'F-2.01 Perkawinan';
    return 'F-2.01 Kelahiran';
  }

  // 2. Kode Dukcapil Standar
  if (s.includes('1.01') || s.includes('1-01')) return 'F-1.01';
  if (s.includes('1.02') || s.includes('1-02')) return 'F-1.02';
  if (s.includes('1.03') || s.includes('1-03') || s.includes('skpwni')) return 'F-1.03';
  if (s.includes('1.06') || s.includes('1-06')) return 'F-1.06';
  if (s.includes('1.08') || s.includes('1-08')) return 'F-1.08';
  if (s.includes('1.15') || s.includes('1-15')) return 'F-1.15';
  if (s.includes('1.16') || s.includes('1-16')) return 'F-1.16';
  if (s.includes('1.25') || s.includes('1-25')) return 'F-1.25';
  if (s.includes('1.27') || s.includes('1-27')) return 'F-1.27';
  if (s.includes('1-21') || s.includes('1.21')) return 'F.1-21';
  if (s.includes('2.12') || s.includes('2-12')) return 'F-2.12';
  if (s.includes('2.03') || s.includes('2-03')) return 'F-2.03';
  if (s.includes('2.04') || s.includes('2-04')) return 'F-2.04';
  if (s.includes('2.09') || s.includes('2-09')) return 'F-2.09';
  if (s.includes('2.29') || s.includes('2-29')) return 'F-2.29';
  if (s.includes('2.30') || s.includes('2-30')) return 'F-2.30';

  // 3. Model Nikah KUA
  if (/\bn[- ]?1\b/.test(s) || s.startsWith('model n-1') || s.includes('n-1')) return 'Model N-1';
  if (/\bn[- ]?2\b/.test(s) || s.startsWith('model n-2') || s.includes('n-2')) return 'Model N-2';
  if (/\bn[- ]?4\b/.test(s) || s.startsWith('model n-4') || s.includes('n-4')) return 'Model N-4';
  if (/\bn[- ]?3\b/.test(s) || s.startsWith('model n-3') || s.includes('n-3')) return 'Model N-4';
  if (/\bn[- ]?5\b/.test(s) || s.startsWith('model n-5') || s.includes('n-5')) return 'Model N-5';
  if (/\bn[- ]?6\b/.test(s) || s.startsWith('model n-6') || s.includes('n-6')) return 'Model N-6';
  if (s.includes('swn') || s.includes('wali nikah') || s.includes('susunan wali')) return 'SWN';
  if (s.includes('sps') || s.includes('status perkawinan')) return 'SPS';

  // 4. Sporadik & Tanah
  if (s.includes('sporadik-l3') || s.includes('riwayat tanah') || s.includes('buku c')) return 'SPORADIK-L3';
  if (s.includes('sporadik-l2') || s.includes('batas tanah') || s.includes('kesaksian batas')) return 'SPORADIK-L2';
  if (s.includes('sporadik-l1') || s.includes('penguasaan fisik') || s.includes('sporadik')) return 'SPORADIK-L1';

  // 5. Pernyataan & Surat Khusus
  if (s.includes('sptjm-bn') || s.includes('beda identitas') || s.includes('beda nama')) return 'SPTJM-BN';
  if (s.includes('sp-bm') || s.includes('belum pernah menikah') || s.includes('belum menikah')) return 'SP-BM';
  if (s.includes('sp-sktm') || s.includes('kurang mampu') || s.includes('sktm')) return 'SP-SKTM';
  if (s.includes('sp-kamtibmas') || s.includes('ketertiban') || s.includes('keramaian')) return 'SP-KAMTIBMAS';
  if (s.includes('sp-hilang') || s.includes('kehilangan')) return 'SP-HILANG';
  if (s.includes('sppd') || s.includes('visum') || s.includes('spt') || s.includes('perjalanan dinas')) return 'SPPD-L2';
  if (s.includes('ba-desa') || s.includes('musyawarah desa') || s.includes('kesepakatan')) return 'BA-DESA';

  return '';
}

/**
 * Mencari item LampiranSuratItem berdasarkan kode atau slug lampiran OpenSID (mis. "f-1.01", "n-1", "f-2.01-kelahiran", dll.)
 */
export function findLampiranByCodeOrSlug(
  codeOrSlug: string,
  customList: LampiranSuratItem[] = MASTER_LAMPIRAN_SURAT,
): LampiranSuratItem | undefined {
  if (!codeOrSlug) return undefined;

  // 1. Coba pencocokan langsung kode persis (case insensitive)
  const exactMatch = customList.find(
    (item) => item.kode.toLowerCase().trim() === codeOrSlug.toLowerCase().trim()
  );
  if (exactMatch) return enrichLampiranItem(exactMatch);

  // 2. Coba pencocokan alias cerdas
  const resolvedCode = resolveLampiranAlias(codeOrSlug);
  if (resolvedCode) {
    const aliasMatch = customList.find(
      (item) => item.kode.toLowerCase().trim() === resolvedCode.toLowerCase().trim()
    );
    if (aliasMatch) return enrichLampiranItem(aliasMatch);
  }

  // 3. Coba pencocokan slug bersih
  const clean = codeOrSlug
    .toLowerCase()
    .replace(/model\s+/g, '')
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  for (const item of customList) {
    const itemSlug = (item.slug || item.kode)
      .toLowerCase()
      .replace(/model\s+/g, '')
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (itemSlug === clean) {
      return enrichLampiranItem(item);
    }
  }

  // 4. Pencocokan parsial nama lampiran
  const byName = customList.find(
    (item) =>
      item.nama.toLowerCase().includes(codeOrSlug.toLowerCase().trim()) ||
      codeOrSlug.toLowerCase().includes(item.nama.toLowerCase().trim())
  );
  if (byName) return enrichLampiranItem(byName);

  return undefined;
}

/**
 * Merender seluruh halaman lampiran yang terkait dengan surat pengantar OpenSID
 */
export function renderLampiranPagesForLetter(
  lampiranCodes: string[] | undefined,
  ctx: OpenSidRenderContext,
  customList: LampiranSuratItem[] = MASTER_LAMPIRAN_SURAT,
): { kode: string; nama: string; orientasi: 'Potrait' | 'Landscape'; html: string }[] {
  if (!lampiranCodes || lampiranCodes.length === 0) return [];
  const results: { kode: string; nama: string; orientasi: 'Potrait' | 'Landscape'; html: string }[] = [];

  for (const rawCode of lampiranCodes) {
    const matched = findLampiranByCodeOrSlug(rawCode, customList);
    if (!matched || matched.isActive === false) continue;

    const isF101 = matched.kode.toUpperCase().includes('F-1.01') || matched.kode.toUpperCase() === 'F1.01';
    const isF102 = matched.kode.toUpperCase().includes('F-1.02') || matched.kode.toUpperCase() === 'F1.02';
    const isF103 = matched.kode.toUpperCase().includes('F-1.03') || matched.kode.toUpperCase() === 'F1.03';
    const isF106 = matched.kode.toUpperCase().includes('F-1.06') || matched.kode.toUpperCase() === 'F1.06';
    const isF108 = matched.kode.toUpperCase().includes('F-1.08') || matched.kode.toUpperCase() === 'F1.08';
    const isF115 = matched.kode.toUpperCase().includes('F-1.15') || matched.kode.toUpperCase() === 'F1.15';
    const isF116 = matched.kode.toUpperCase().includes('F-1.16') || matched.kode.toUpperCase() === 'F1.16';
    const isF121 = matched.kode.toUpperCase().includes('1-21') || matched.kode.toUpperCase().includes('1.21');
    const isF125 = matched.kode.toUpperCase().includes('F-1.25') || matched.kode.toUpperCase().includes('F.1-25') || matched.kode.toUpperCase() === 'F1.25';
    const isF127 = matched.kode.toUpperCase().includes('F-1.27') || matched.kode.toUpperCase().includes('F.1-27') || matched.kode.toUpperCase() === 'F1.27';
    const isF201 = matched.kode.toUpperCase().includes('F-2.01') || matched.kode.toUpperCase() === 'F2.01';
    const isF203 = matched.kode.toUpperCase().includes('F-2.03') || matched.kode.toUpperCase() === 'F2.03';
    const isF204 = matched.kode.toUpperCase().includes('F-2.04') || matched.kode.toUpperCase() === 'F2.04';
    const isF209 = matched.kode.toUpperCase().includes('F-2.09') || matched.kode.toUpperCase() === 'F2.09' || matched.kode.toUpperCase().includes('F.2.09') || matched.kode.toUpperCase().includes('F. 2.09');
    const isF212 = matched.kode.toUpperCase().includes('F-2.12') || matched.kode.toUpperCase() === 'F2.12';
    const isF229 = matched.kode.toUpperCase().includes('F-2.29') || matched.kode.toUpperCase() === 'F2.29';
    const isF230 = matched.kode.toUpperCase().includes('F-2.30') || matched.kode.toUpperCase() === 'F2.30';
    const isN1 = matched.kode.toUpperCase().includes('N-1') || matched.kode.toUpperCase() === 'N1' || matched.kode.toUpperCase().includes('MODEL N-1');
    const isN2 = matched.kode.toUpperCase().includes('N-2') || matched.kode.toUpperCase() === 'N2' || matched.kode.toUpperCase().includes('MODEL N-2');
    const isN4 = matched.kode.toUpperCase().includes('N-4') || matched.kode.toUpperCase() === 'N4' || matched.kode.toUpperCase().includes('MODEL N-4');
    const isN5 = matched.kode.toUpperCase().includes('N-5') || matched.kode.toUpperCase() === 'N5' || matched.kode.toUpperCase().includes('MODEL N-5');
    const isN6 = matched.kode.toUpperCase().includes('N-6') || matched.kode.toUpperCase() === 'N6' || matched.kode.toUpperCase().includes('MODEL N-6');
    const isSps = matched.kode.toUpperCase() === 'SPS' || matched.kode.toUpperCase().includes('SPS');
    const isSwn = matched.kode.toUpperCase() === 'SWN' || matched.kode.toUpperCase().includes('SWN');
    const isSpHilang = matched.kode.toUpperCase().includes('SP-HILANG') || matched.kode.toUpperCase() === 'SP-HILANG' || matched.nama.toLowerCase().includes('kehilangan');
    const isSptjmBn = matched.kode.toUpperCase().includes('SPTJM-BN') || matched.kode.toUpperCase() === 'SPTJM-BN' || matched.nama.toLowerCase().includes('beda identitas') || matched.nama.toLowerCase().includes('beda nama');
    const isSpBm = matched.kode.toUpperCase().includes('SP-BM') || matched.kode.toUpperCase() === 'SP-BM' || matched.nama.toLowerCase().includes('belum pernah menikah') || matched.nama.toLowerCase().includes('belum menikah');
    const isSpSktm = matched.kode.toUpperCase().includes('SP-SKTM') || matched.kode.toUpperCase() === 'SP-SKTM' || matched.nama.toLowerCase().includes('kurang mampu') || matched.nama.toLowerCase().includes('tidak mampu');

    // Jika F-1.01, F-1.02, F-1.03, F-1.06, F-1.08, F-1.15, F-1.16, F.1-21, F-1.25, F-2.01, F-2.03, F-2.04, F-2.12, F-2.29, F-2.30, Model N-1 s/d N-6, SPS, SWN, SP-HILANG, SPTJM-BN, SP-BM, atau SP-SKTM dan tidak memakai template HTML override khusus, bangun HTML dinamis berisi data riil
    const rawHtml =
      isF101 && !matched.useCustomTemplate
        ? buildF101LandscapeHtml(ctx)
        : isF102 && !matched.useCustomTemplate
          ? buildF102PortraitHtml(ctx)
          : isF103 && !matched.useCustomTemplate
            ? buildF103PortraitHtml(ctx)
            : isF106 && !matched.useCustomTemplate
              ? buildF106PortraitHtml(ctx)
              : isF108 && !matched.useCustomTemplate
                ? buildF108PortraitHtml(ctx)
                : isF115 && !matched.useCustomTemplate
                  ? buildF115PortraitHtml(ctx)
                  : isF116 && !matched.useCustomTemplate
                    ? buildF116PortraitHtml(ctx)
                    : isF121 && !matched.useCustomTemplate
                       ? buildF121PortraitHtml(ctx)
                    : isF125 && !matched.useCustomTemplate
                      ? buildF125PortraitHtml(ctx)
                    : isF127 && !matched.useCustomTemplate
                      ? buildF127PortraitHtml(ctx)
                    : isF201 && !matched.useCustomTemplate
                      ? buildF201PortraitHtml(ctx, matched.kode)
                      : isF203 && !matched.useCustomTemplate
                        ? buildF203PortraitHtml(ctx)
                      : isF204 && !matched.useCustomTemplate
                        ? buildF204PortraitHtml(ctx)
                      : isF209 && !matched.useCustomTemplate
                        ? buildF209PortraitHtml(ctx)
                      : isF212 && !matched.useCustomTemplate
                        ? buildF212PortraitHtml(ctx)
                      : isF229 && !matched.useCustomTemplate
                        ? buildF229PortraitHtml(ctx)
                      : isF230 && !matched.useCustomTemplate
                        ? buildF230PortraitHtml(ctx)
                      : isN1 && !matched.useCustomTemplate
                        ? buildModelN1PortraitHtml(ctx)
                      : isN2 && !matched.useCustomTemplate
                        ? buildModelN2PortraitHtml(ctx)
                      : isN4 && !matched.useCustomTemplate
                        ? buildModelN4PortraitHtml(ctx)
                      : isN5 && !matched.useCustomTemplate
                        ? buildModelN5PortraitHtml(ctx)
                      : isN6 && !matched.useCustomTemplate
                        ? buildModelN6PortraitHtml(ctx)
                      : isSps && !matched.useCustomTemplate
                        ? buildSpsPortraitHtml(ctx)
                      : isSwn && !matched.useCustomTemplate
                        ? buildSwnPortraitHtml(ctx)
                      : isSpHilang && !matched.useCustomTemplate
                        ? buildSpHilangPortraitHtml(ctx)
                      : isSptjmBn && !matched.useCustomTemplate
                        ? buildSptjmBnPortraitHtml(ctx)
                      : isSpBm && !matched.useCustomTemplate
                        ? buildSpBmPortraitHtml(ctx)
                      : isSpSktm && !matched.useCustomTemplate
                        ? buildSpSktmPortraitHtml(ctx)
                        : matched.templateHtml || getDefaultLampiranHtmlTemplate(matched);

    const renderedHtml = replaceOpenSidKodeIsian(rawHtml, ctx);

    // Pisahkan bila ada penanda pemisah halaman <!-- PAGE_BREAK -->
    const rawPages = renderedHtml
      .split(/<!--\s*PAGE_BREAK\s*-->/i)
      .map((p) => p.trim())
      .filter(Boolean);

    const pages = rawPages.length > 0 ? rawPages : [renderedHtml];

    pages.forEach((pageHtml, idx) => {
      const pageSuffix = pages.length > 1 ? ` (Hal ${idx + 1}/${pages.length})` : '';
      results.push({
        kode: `${matched.kode}${pageSuffix}`,
        nama: matched.nama,
        orientasi: matched.orientasi || (isF101 ? 'Landscape' : 'Potrait'),
        html: pageHtml,
      });
    });
  }

  return results;
}

export function enrichLampiranItem(item: LampiranSuratItem): LampiranSuratItem {
  const isF101 = item.kode.toUpperCase().includes('F-1.01') || item.kode.toUpperCase() === 'F1.01';
  const defaultSlug = item.kode
    .toLowerCase()
    .replace(/model\s+/g, '')
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return {
    ...item,
    slug: item.slug || defaultSlug,
    jenis: item.jenis || 1,
    orientasi: item.orientasi || (isF101 ? 'Landscape' : 'Potrait'),
    marginGlobal: item.marginGlobal ?? true,
    margin: item.margin || { ...DEFAULT_LAMPIRAN_MARGIN },
    kotak: item.kotak || { ...DEFAULT_LAMPIRAN_KOTAK },
    useCustomTemplate: item.useCustomTemplate ?? false,
    templateHtml:
      item.useCustomTemplate && item.templateHtml && item.templateHtml.trim().length > 0
        ? item.templateHtml
        : getDefaultLampiranHtmlTemplate(item),
    formIsian: getDefaultLampiranFormIsian(item),
    kodeIsian: getDefaultLampiranKodeIsian(item),
  };
}

export function buildLampiranDummyPreviewContext(item: LampiranSuratItem): OpenSidRenderContext {
  const enriched = enrichLampiranItem(item);
  return buildDummyPreviewContext({
    id: enriched.id,
    jenisSurat: enriched.nama,
    klasifikasi: enriched.kategori,
    kodeSurat: enriched.kode,
    uraian: enriched.deskripsi,
    formIsian: enriched.formIsian,
    kodeIsian: enriched.kodeIsian,
  });
}
