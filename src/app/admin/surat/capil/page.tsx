'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { FileDown, ExternalLink } from 'lucide-react';

const capilForms = [
  { title: "Formulir Pendaftaran Permohonan Perubahan", link: "https://drive.google.com/file/d/1dibj7P8OXSENh8_PiLAny3NotXXJcTEq/view" },
  { title: "Formulir Biodata Keluarga (F1.01)", link: "https://drive.google.com/file/d/18zQnZ0_5vB-4qPRWCKVkQDLDrUd_4HtW/view" },
  { title: "Formulir Pendaftaran Peristiwa Kependudukan (F1.02)", link: "https://drive.google.com/file/d/1_0hKY4L0hO_hn_EMnBT0oblAAwwOWdyz/view" },
  { title: "Formulir Pendaftaran Perpindahan Penduduk (F1.03)", link: "https://drive.google.com/file/d/122oChJHdpFrCHanTF15GWjqsjuStAZgj/view" },
  { title: "Formulir Pelaporan Pencatatan Sipil (F-2.01)", link: "https://drive.google.com/file/d/1CNuv64NO03hdNGIPWxMlrGJpKToTqmT_/view" },
  { title: "SPTJM Kebenaran Data Kelahiran (F-2.03)", link: "https://drive.google.com/file/d/10DAw77PoIA_8vAwVJXAH9neiM0QnvGTJ/view" },
  { title: "SPTJM Kebenaran Pasangan Suami Istri (F2.04)", link: "https://drive.google.com/file/d/1QQWGC1TQA9gXTyD2RMwnURRstlByUAmo/view" },
  { title: "Surat Keterangan Kematian (F2.29)", link: "https://drive.google.com/file/d/1gY-KxZpaXYQNEsKhPuvQhLGDwe5jkaaN/view" },
  { title: "Surat Pernyataan Perubahan Elemen Data (F1.06)", link: "https://drive.google.com/file/d/1bzLH_xgTuUSXs_IhgLpRAqg2ty7iZPVt/view" },
  { title: "Surat Pernyataan Data Hilang", link: "https://drive.google.com/file/d/1Ze-q1mEu6TZzEcX6y98iWvyUrgKNTR7U/view" },
  { title: "Formulir Permohonan Pindah WNI", link: "https://drive.google.com/file/d/1p5xQrW3n9Z9oANONloZPwOADH2-CAio0/view" },
  { title: "Permohonan Ganti Foto/TTD KTP-el", link: "https://drive.google.com/file/d/1sd865im36vfMdwcn4rFvvDr17bNrBzT_/view" },
  { title: "SPTJM Kebenaran Data Kematian", link: "https://drive.google.com/file/d/1LbZTkt02qe8YH6Effp7pOh8xVJ1n0gLI/view" },
  { title: "Surat Pengantar Pindah Luar Negeri (F1.59)", link: "https://drive.google.com/file/d/13WT-sPWvI78Znb2JLBOYtyrjjBSBvz7_/view" },
  { title: "SPTJM Perkawinan/Perceraian Belum Tercatat", link: "https://drive.google.com/file/d/1l783ewmUodY2DXtjmXtKXQii8JGxFawx/view" },
  { title: "Syarat Pembuatan Akta Capil Terbaru", link: "https://drive.google.com/file/d/1HUWd1fQzakshqbqon6GNHq_wtxgdN6_V/view" },
  { title: "Berita Acara Keabsahan Akta Kelahiran", link: "https://drive.google.com/file/d/1pHb0ukFmzAl50UL6gSzYf6Jf4YZwoKhb/view" },
  { title: "Tutorial Online Dolan Teluk Penyu", link: "https://drive.google.com/file/d/1NVAqryeIt9-Nd4MSCw0IHbpUPHeI7GW5/view" },
  { title: "SOP Identitas Kependudukan Digital", link: "https://drive.google.com/file/d/1LkXo8dCG4wsUOE3kn97smVI7-GKyZ2mk/view" },
];

export default function FormulirCapilPage() {
  return (
    <div className="space-y-4 sm:space-y-8">
      <PageHeader 
        title="Formulir Capil" 
        description="Daftar formulir resmi dari Dinas Kependudukan dan Catatan Sipil (Disdukcapil) Kabupaten Cilacap."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {capilForms.map((form, index) => (
          <a 
            key={index} 
            href={form.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="group"
          >
            <Card className="h-full border border-stone-200/90 shadow-xs hover:shadow-md transition-all duration-200 bg-white rounded-[1.4rem] sm:rounded-[1.6rem] overflow-hidden flex flex-col group-hover:-translate-y-0.5 hover:border-slate-900">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3.5 flex-1">
                <div className="p-2.5 sm:p-3 rounded-2xl bg-[#070b10] text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all duration-200 shrink-0 shadow-xs">
                  <FileDown className="h-5 w-5 sm:h-5 sm:w-5" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <h3 className="font-condensed font-extrabold uppercase tracking-tight text-slate-900 leading-snug group-hover:text-slate-950 transition-colors text-xs sm:text-sm line-clamp-2">
                    {form.title}
                  </h3>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider group-hover:text-teal-600 dark:text-teal-400 transition-colors">Unduh PDF</span>
                    <ExternalLink className="h-2.5 w-2.5 text-slate-400 group-hover:text-teal-600 dark:text-teal-400 shrink-0" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
