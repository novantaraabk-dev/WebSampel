/**
 * @fileOverview Client-side Gemini API helper using the REST API directly.
 * This replaces Genkit-based flows which are server-only and incompatible
 * with Next.js static export (output: 'export').
 */

// Model-model Gemini multimodal yang aktif di Google Generative Language API
// Diurutkan berdasarkan ketersediaan kuota dan latensi tercepat
export const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
];

export function getGeminiUrl(modelName: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
}

const GEMINI_PRIMARY_URL = getGeminiUrl('gemini-flash-lite-latest');
const GEMINI_FALLBACK_URL = getGeminiUrl('gemini-3.5-flash-lite');

// Read from env — set NEXT_PUBLIC_GEMINI_API_KEY in .env.local
const API_KEY =
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  '';

async function callGemini(prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set.');
  }

  let lastError = '';
  // Coba model secara berurutan jika ada model yang overload/high demand
  for (const model of GEMINI_MODELS) {
    const url = getGeminiUrl(model);
    try {
      const res = await fetch(`${url}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) return text;
      } else {
        const errJson = await res.json().catch(() => ({}));
        lastError = errJson.error?.message || `HTTP ${res.status}`;
        console.warn(`Percobaan model Gemini ${model} gagal:`, lastError);
      }
    } catch (e: any) {
      lastError = e?.message || String(e);
      console.warn(`Percobaan model Gemini ${model} error:`, e);
    }
  }

  throw new Error(`Gagal memproses permintaan AI: ${lastError || 'Semua endpoint model Gemini sedang sibuk'}`);
}

// ---------------------------------------------------------------------------
// Equivalents of Genkit flows — callable from client components
// ---------------------------------------------------------------------------

export interface SummarizeComplaintFeedbackInput {
  complaintText: string;
}
export interface SummarizeComplaintFeedbackOutput {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
}

export async function summarizeComplaintFeedback(
  input: SummarizeComplaintFeedbackInput
): Promise<SummarizeComplaintFeedbackOutput> {
  const text = (input.complaintText || '').trim();
  const fallbackSummary = text.length > 120 ? text.slice(0, 117) + '...' : text;
  const fallbackResult: SummarizeComplaintFeedbackOutput = {
    summary: fallbackSummary || 'Aspirasi warga desa',
    sentiment: 'neutral',
    keywords: ['Pengaduan', 'Aspirasi', 'Warga'],
  };

  if (!API_KEY) {
    return fallbackResult;
  }

  try {
    const prompt = `Kamu adalah asisten AI yang membantu merangkum pengaduan atau masukan warga untuk administrator desa.
Berikan ringkasan singkat, identifikasi sentimen (positive/neutral/negative), dan kata kunci utama.
Balas HANYA dalam format JSON berikut tanpa penjelasan tambahan:
{"summary":"...","sentiment":"neutral","keywords":["...", "..."]}

Teks Pengaduan:
${input.complaintText}`;

    const raw = await callGemini(prompt);
    // Extract JSON from the response
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return fallbackResult;
    const parsed = JSON.parse(match[0]);
    return {
      summary: parsed.summary || fallbackResult.summary,
      sentiment: parsed.sentiment || 'neutral',
      keywords: Array.isArray(parsed.keywords) && parsed.keywords.length > 0 ? parsed.keywords : fallbackResult.keywords,
    };
  } catch (err) {
    console.warn('Gemini AI summarize skipped/failed, using fallback:', err);
    return fallbackResult;
  }
}

// ---------------------------------------------------------------------------

export interface SummarizeVillageDocumentInput {
  documentContent: string;
}
export interface SummarizeVillageDocumentOutput {
  summary: string;
}

export async function summarizeVillageDocument(
  input: SummarizeVillageDocumentInput
): Promise<SummarizeVillageDocumentOutput> {
  const prompt = `Kamu adalah ahli administrator desa. Ringkas dokumen berikut menjadi poin-poin penting yang jelas dan singkat dalam bahasa Indonesia.
Balas HANYA dalam format JSON: {"summary":"..."}

Isi Dokumen:
${input.documentContent}`;

  const raw = await callGemini(prompt);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Invalid response from Gemini');
  return JSON.parse(match[0]) as SummarizeVillageDocumentOutput;
}

// ---------------------------------------------------------------------------

export interface GenerateVillageNewsDraftInput {
  title?: string;
  subtitle?: string;
  date?: string;
  author?: string;
  promptNotes?: string;
}
export interface GenerateVillageNewsDraftOutput {
  title: string;
  subtitle: string;
  content: string;
}

export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      return word.replace(/^([^a-zA-Z0-9À-ž]*)([a-zA-Z0-9À-ž])(.*)$/, (_, prefix, firstChar, rest) => {
        return prefix + firstChar.toUpperCase() + rest.toLowerCase();
      });
    })
    .join(' ');
}

export async function generateVillageNewsDraft(
  input: GenerateVillageNewsDraftInput
): Promise<GenerateVillageNewsDraftOutput> {
  const promptNotes = (input.promptNotes || '').trim();
  const rawTitle = (input.title || '').trim();
  const rawSubtitle = (input.subtitle || '').trim();
  const date = (input.date || '').trim() || 'Hari ini';
  const author = (input.author || '').trim() || 'Tim Media Desa Sampeldes';

  const systemInstruction = `Kamu adalah jurnalis dan humas resmi Pemerintah Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, Jawa Tengah.
Tugasmu adalah menyusun draf berita kegiatan desa yang profesional, faktual, informatif, dan menarik untuk dipublikasikan di portal resmi desa.
Desa Sampeldes memiliki 2 dusun resmi: Dusun Pangampiran dan Dusun Ciloning.

Instruksi Khusus Format:
1. JUDUL: Rumuskan judul berita WAJIB DALAM HURUF KAPITAL SEMUA (UPPERCASE), formal, padat, berbobot, dan mencerminkan esensi kegiatan (10-15 kata). Contoh: DESA SAMPELDES RAIH JUARA KETIGA FESTIVAL KEUANGAN DESA TINGKAT KECAMATAN GANDRUNGMANGU
2. SUB JUDUL: Rumuskan sub judul/ringkasan berita WAJIB DALAM FORMAT HURUF KAPITAL DI SETIAP AWAL KATA (Title Case), 1-2 kalimat (15-25 kata). Contoh: Pencapaian Ini Menegaskan Komitmen Desa Sampeldes Dalam Pengelolaan Keuangan Yang Transparan Dan Partisipatif
3. ISI BERITA (NARASI):
   - Awali paragraf pertama dengan format standar: "SAMPELDES — [isi paragraf pembuka mencakup 5W+1H: Siapa, Apa, Kapan, Di mana, Mengapa, dan Bagaimana]".
   - Gunakan bahasa Indonesia baku (EYD), gaya jurnalistik resmi, santun, dan positif.
   - Terdiri dari 3 sampai 5 paragraf yang mengalir:
     * Paragraf 1: Pembuka kegiatan, tempat, waktu (${date}), dan pihak yang terlibat.
     * Paragraf 2: Rincian jalannya kegiatan, latar belakang, dan dinamika acara.
     * Paragraf 3: Pernyataan/kutipan apresiasi dari Kepala Desa atau tokoh masyarakat Sampeldes.
     * Paragraf 4: Penutup mengenai tindak lanjut program dan harapan bagi kemajuan warga Desa Sampeldes.
   - Pisahkan antar-paragraf dengan dua kali enter (baris kosong). Jangan gunakan markdown bintang (*) untuk cetak tebal di dalam teks narasi.

Balas HANYA format JSON valid berikut tanpa backtick markdown (\`\`\`json):
{
  "title": "...",
  "subtitle": "...",
  "content": "..."
}`;

  const userContext = [
    promptNotes ? `Catatan / Arahan Detail Kegiatan (Prompt):\n${promptNotes}` : '',
    rawTitle ? `Judul Acuan/Awal: ${rawTitle}` : '',
    rawSubtitle ? `Sub Judul Acuan/Awal: ${rawSubtitle}` : '',
    `Tanggal Kegiatan: ${date}`,
    `Penulis / Pelapor: ${author}`,
  ].filter(Boolean).join('\n\n');

  try {
    const raw = await callGemini(`${systemInstruction}\n\nINFORMASI KEGIATAN:\n${userContext}`);
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.content) {
        const generatedTitle = (parsed.title || rawTitle || 'KEGIATAN DESA SAMPELDES').trim().toUpperCase();
        const generatedSubtitle = toTitleCase((parsed.subtitle || rawSubtitle || 'Pembangunan Dan Pelayanan Masyarakat').trim());
        return {
          title: generatedTitle,
          subtitle: generatedSubtitle,
          content: parsed.content.trim(),
        };
      }
    }
  } catch (err) {
    console.warn('callGemini in generateVillageNewsDraft failed, using fallback:', err);
  }

  // Fallback jika API sedang offline / quota habis
  const cleanTitle = (rawTitle || (promptNotes ? promptNotes.slice(0, 70) : 'Kegiatan Desa Sampeldes')).toUpperCase();
  const cleanSubtitle = toTitleCase(rawSubtitle || 'Pembangunan Dan Pelayanan Masyarakat Desa Sampeldes');

  const fallbackDraft = `SAMPELDES — Pemerintah Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap terus menggiatkan berbagai agenda pembangunan dan pelayanan prima untuk masyarakat. Pada ${date}, diselenggarakan kegiatan "${cleanTitle}" yang berfokus pada ${cleanSubtitle}.

Kegiatan ini diikuti oleh jajaran perangkat desa, Badan Permusyawaratan Desa (BPD), pengurus RT/RW, dan tokoh masyarakat dengan semangat kebersamaan dan gotong royong yang tinggi.
${promptNotes ? `\nBerdasarkan pantauan di lokasi, kegiatan difokuskan pada: ${promptNotes}.\n` : ''}
Pemerintah Desa Sampeldes menegaskan komitmennya untuk terus mendukung inisiatif positif yang berdampak langsung bagi peningkatan kesejahteraan warga di 2 Dusun (Dusun Pangampiran dan Dusun Ciloning).

Melalui sinergi yang solid antara pemerintah desa dan seluruh lapisan masyarakat, program ini diharapkan dapat berjalan secara berkesinambungan demi mewujudkan Desa Sampeldes yang maju, mandiri, dan sejahtera.`;

  return {
    title: cleanTitle,
    subtitle: cleanSubtitle,
    content: fallbackDraft,
  };
}

// ---------------------------------------------------------------------------

export interface GenerateDocumentNumberInput {
  manualNumber: number;
}
export type GenerateDocumentNumberOutput = string;

function toRoman(num: number): string {
  const roman: Record<string, number> = {
    M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90,
    L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1,
  };
  let str = '';
  for (const i of Object.keys(roman)) {
    const q = Math.floor(num / roman[i]);
    num -= q * roman[i];
    str += i.repeat(q);
  }
  return str;
}

export function generateDocumentNumber(
  input: GenerateDocumentNumberInput
): GenerateDocumentNumberOutput {
  // This function is purely computational — no AI needed
  const now = new Date();
  const monthInRoman = toRoman(now.getMonth() + 1);
  const year = now.getFullYear();
  const villageCode = '13';
  return `${String(input.manualNumber).padStart(3, '0')}/${monthInRoman}/${villageCode}/${year}`;
}

// ---------------------------------------------------------------------------
// Pemindaian Dokumen Undangan (PDF, JPG, PNG, DOCX) via Multimodal AI
// ---------------------------------------------------------------------------

export interface ScannedInvitationOutput {
  letterNumber?: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventNotes?: string;
}

export async function scanInvitationDocument(file: File): Promise<ScannedInvitationOutput> {
  if (!API_KEY) {
    throw new Error('API Key Gemini belum dikonfigurasi di lingkungan aplikasi.');
  }

  const fileName = file.name.toLowerCase();
  const isDocx = fileName.endsWith('.docx') || fileName.endsWith('.doc');

  const currentYear = new Date().getFullYear();
  const extractionPrompt = `Kamu adalah asisten administrasi pemerintah desa di Indonesia yang ahli membaca surat undangan dinas resmi.
Tugasmu adalah menganalisis dokumen surat undangan terlampir dan mengekstrak rincian acara secara akurat.

Petunjuk ekstraksi:
1. Nomor Surat ("letterNumber"): Cari bagian "Nomor: ..." atau nomor surat dinas di kepala/kop surat (contoh: "400.10.2.1/338/49"). Ambil nomor surat lengkapnya. Jika tidak ada nomor surat, kosongkan string "".
2. Acara ("eventTitle"): Topik atau inti pokok acara/kegiatan yang diundang (contoh: "Sosialisasi Pelaksanaan BPJS Ketenagakerjaan").
3. Hari/Tanggal ("eventDate"): Ambil dari bagian "Hari/tanggal" atau tanggal pelaksanaan dan konversikan ke format YYYY-MM-DD (contoh: "Jumat, 21 Agustus 2026" menjadi "2026-08-21"). Jika tahun tidak tercantum, gunakan tahun saat ini (${currentYear}).
4. Waktu ("eventTime"): Ambil jam mulai acara dalam format 24 jam HH:mm (contoh: "Pukul 08.30 WIB s.d. selesai" menjadi "08:30").
5. Tempat ("eventLocation"): Lokasi tempat pelaksanaan acara (contoh: "Pendopo Kecamatan Gandrungmangu").
6. Catatan ("eventNotes"): Catatan, ketentuan kehadiran, kelengkapan berkas, atau instruksi tambahan jika ada (contoh: "1. Kepala Desa hadir bersama Ketua dan Bendahara...").

Balas HANYA dalam format JSON valid tanpa tanda backtick markdown atau teks pendahuluan:
{
  "letterNumber": "...",
  "eventTitle": "...",
  "eventDate": "YYYY-MM-DD",
  "eventTime": "HH:mm",
  "eventLocation": "...",
  "eventNotes": "..."
}`;

  let contentsPayload: any[] = [];

  if (isDocx) {
    // Ekstraksi teks dari dokumen Word (.docx)
    let extractedText = '';
    try {
      const arrayBuffer = await file.arrayBuffer();
      const PizZip = (await import('pizzip')).default;
      const zip = new PizZip(arrayBuffer);
      const docXml = zip.file('word/document.xml')?.asText();
      if (docXml) {
        extractedText = docXml
          .replace(/<w:p[^>]*>/g, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .trim();
      }
    } catch (docxErr) {
      console.warn('Gagal membaca docx dengan PizZip, mencoba fallback text:', docxErr);
      extractedText = await file.text();
    }

    contentsPayload = [
      {
        parts: [
          {
            text: `${extractionPrompt}\n\nIsi Dokumen Undangan:\n${extractedText}`,
          },
        ],
      },
    ];
  } else {
    // Dokumen PDF atau Gambar (JPG, PNG, WebP) via Multimodal
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] || '');
      };
      reader.onerror = (err) => reject(err);
    });

    let mimeType = file.type;
    if (!mimeType) {
      if (fileName.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (fileName.endsWith('.png')) mimeType = 'image/png';
      else if (fileName.endsWith('.webp')) mimeType = 'image/webp';
      else mimeType = 'image/jpeg';
    }

    contentsPayload = [
      {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: extractionPrompt,
          },
        ],
      },
    ];
  }

  // Kirim ke Gemini API (coba secara berurutan sesuai prioritas model yang aktif)
  let rawResponse = '';
  let lastError = '';

  for (const model of GEMINI_MODELS) {
    const url = getGeminiUrl(model);
    try {
      const res = await fetch(`${url}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: contentsPayload }),
      });

      if (res.ok) {
        const data = await res.json();
        rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (rawResponse) break;
      } else {
        const errJson = await res.json().catch(() => ({}));
        lastError = errJson.error?.message || `HTTP ${res.status}`;
        console.warn(`Gemini scanInvitation model ${model} gagal:`, lastError);
      }
    } catch (e: any) {
      lastError = e?.message || String(e);
      console.warn(`Percobaan Gemini API model ${model} error:`, e);
    }
  }

  if (!rawResponse) {
    throw new Error(
      lastError
        ? `AI gagal memproses dokumen: ${lastError}`
        : 'AI tidak dapat membaca dokumen undangan. Pastikan format file PDF/JPG/PNG/Word jelas dan tidak terkunci.'
    );
  }

  const match = rawResponse.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Format respon AI tidak dapat dipahami. Coba pindai ulang berkas.');
  }

  const parsed = JSON.parse(match[0]);
  return {
    letterNumber: parsed.letterNumber?.trim() || undefined,
    eventTitle: parsed.eventTitle?.trim() || file.name.replace(/\.[^/.]+$/, ''),
    eventDate: parsed.eventDate?.trim() || new Date().toISOString().split('T')[0],
    eventTime: parsed.eventTime?.trim() || '08:00',
    eventLocation: parsed.eventLocation?.trim() || 'Balai Desa Sampeldes',
    eventNotes: parsed.eventNotes?.trim() || undefined,
  };
}

// ---------------------------------------------------------------------------
// Penyusunan Notulen Resmi Kegiatan via Multimodal AI
// ---------------------------------------------------------------------------

export interface GenerateNotulenInput {
  title: string;
  location?: string;
  date?: string;
  time?: string;
  manualNotes?: string;
  materialFile?: File | null;
}

export interface GenerateNotulenOutput {
  notulen: string;
}

export async function generateNotulenWithAI(
  input: GenerateNotulenInput
): Promise<GenerateNotulenOutput> {
  const currentKey =
    API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    '';

  if (!currentKey) {
    throw new Error('API Key Gemini belum disetel.');
  }

  const {
    title,
    location = 'Balai Desa Sampeldes',
    date = new Date().toISOString().split('T')[0],
    time = '',
    manualNotes,
    materialFile
  } = input;

  let extractedDocText = '';
  let inlinePart: any = null;

  if (materialFile) {
    const fName = materialFile.name.toLowerCase();
    const isPdf = fName.endsWith('.pdf') || materialFile.type === 'application/pdf';
    const isImage =
      fName.endsWith('.jpg') ||
      fName.endsWith('.jpeg') ||
      fName.endsWith('.png') ||
      fName.endsWith('.webp') ||
      materialFile.type.startsWith('image/');
    const isPptx = fName.endsWith('.pptx');
    const isDocx = fName.endsWith('.docx');

    if (isPdf || isImage) {
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(materialFile);
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || '');
          };
          reader.onerror = reject;
        });

        inlinePart = {
          inlineData: {
            mimeType: isPdf ? 'application/pdf' : materialFile.type || 'image/jpeg',
            data: base64Data,
          },
        };
      } catch (e) {
        console.warn('Gagal membaca file gambar/pdf materi:', e);
      }
    } else if (isPptx || isDocx) {
      try {
        const JSZip = (await import('jszip')).default;
        const arrayBuffer = await materialFile.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        if (isPptx) {
          const slideFiles = Object.keys(zip.files).filter((name) =>
            /^ppt\/slides\/slide\d+\.xml$/.test(name)
          );
          slideFiles.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
            const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
            return numA - numB;
          });

          let slidesText = '';
          for (let i = 0; i < slideFiles.length; i++) {
            const xml = await zip.files[slideFiles[i]].async('text');
            const matches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g);
            if (matches) {
              const textContent = matches
                .map((m) => m.replace(/<[^>]+>/g, '').trim())
                .filter(Boolean)
                .join(' ');
              if (textContent) {
                slidesText += `[Slide ${i + 1}]: ${textContent}\n`;
              }
            }
          }
          if (slidesText) {
            extractedDocText = `Rangkuman Isi Presentasi Slide (${materialFile.name}):\n${slidesText.slice(0, 15000)}`;
          }
        } else if (isDocx) {
          const docXmlFile = zip.file('word/document.xml');
          if (docXmlFile) {
            const xml = await docXmlFile.async('text');
            const cleanText = xml
              .replace(/<w:p[^>]*>/g, '\n')
              .replace(/<[^>]+>/g, '')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .trim();
            extractedDocText = `Isi Dokumen Materi (${materialFile.name}):\n${cleanText.slice(0, 15000)}`;
          }
        }
      } catch (docErr) {
        console.warn('Gagal ekstrak dokumen presentasi PPTX/DOCX:', docErr);
      }
    } else {
      try {
        const txt = await materialFile.text();
        extractedDocText = `Isi Catatan Materi:\n${txt.slice(0, 10000)}`;
      } catch (txtErr) {
        console.warn('Gagal membaca teks file materi:', txtErr);
      }
    }
  }

  const promptText = `Anda adalah asisten administrasi profesional Pemerintah Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap.
Tugas Anda adalah menyusun draf notulen formal hasil kegiatan/rapat desa berdasarkan data berikut:

Nama Kegiatan: ${title}
Lokasi Pelaksanaan: ${location}
Tanggal: ${date}
Waktu/Jam: ${time || '-'}

${manualNotes?.trim() ? `Catatan Lapangan / Poin Hasil Rapat Manual:\n${manualNotes.trim()}\n` : ''}
${extractedDocText ? `Materi Paparan / Dokumen Pendukung Terlampir:\n${extractedDocText}\n` : ''}

Panduan Penyusunan Notulen Resmi:
1. Buat draf notulen dalam 3 sampai 4 paragraf narasi formal yang padat, komprehensif, dan baku sesuai standar korespondensi dan tata naskah dinas pemerintahan desa di Indonesia.
2. SANGAT PENTING: Jika ada catatan manual atau materi presentasi/dokumen yang terlampir di atas, integrasikan poin-poin utama, pembahasan materi, arahan narasumber, serta masukan peserta tersebut secara mendalam ke dalam tubuh notulensi.
3. Struktur Narasi Notulen:
   - Paragraf 1: Pembukaan kegiatan, penyampaian maksud dan tujuan diselenggarakannya acara, serta sambutan pembuka.
   - Paragraf 2 (dan 3 bila materi cukup banyak): Inti materi bahasan, jalannya diskusi, poin-poin teknis/materi paparan yang disampaikan, serta dinamika tanya jawab peserta.
   - Paragraf Penutup: Kesimpulan rapat, rencana tindak lanjut (RTL), kesepakatan bersama, dan penutupan acara secara resmi.
4. Jangan sertakan judul, kop surat, nomor surat, tanggal di atas narasi, atau frasa metadata. Langsung sajikan paragraf isi notulensinya saja.
5. Gunakan Bahasa Indonesia formal (EYD), santun, dan profesional.`;

  const parts: any[] = [];
  if (inlinePart) {
    parts.push(inlinePart);
  }
  parts.push({ text: promptText });

  let rawResponse = '';
  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    const url = getGeminiUrl(model);
    try {
      const res = await fetch(`${url}?key=${currentKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] }),
      });

      if (res.ok) {
        const data = await res.json();
        rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (rawResponse) break;
      } else {
        const errJson = await res.json().catch(() => ({}));
        lastError = errJson.error?.message || `HTTP ${res.status}`;
      }
    } catch (e: any) {
      lastError = e.message;
    }
  }

  if (!rawResponse) {
    throw new Error(lastError || 'Layanan AI tidak dapat memproses draf notulen saat ini.');
  }

  return { notulen: rawResponse.trim() };
}

// ---------------------------------------------------------------------------
// Penyusunan Redaksi Transparansi Pembangunan Desa via AI (Gemini)
// ---------------------------------------------------------------------------

export interface GeneratePembangunanRedaksiInput {
  judul: string;
  lokasi: string;
  volume: string;
  anggaran: number | string;
  sumberAnggaran: string;
  tahun?: number | string;
  pelaksana?: string;
  catatanTambahan?: string;
}

export async function generatePembangunanRedaksiAI(
  input: GeneratePembangunanRedaksiInput
): Promise<string> {
  const formatRupiah = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9]/g, '')) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const formattedAnggaran = formatRupiah(input.anggaran);
  const prompt = `Anda adalah asisten humas dan jurnalisme resmi Pemerintah Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap.
Tugas Anda adalah menyusun redaksi narasi berita transparansi kegiatan pembangunan desa yang faktual, formal, informatif, dan mengedepankan akuntabilitas publik.

Data Rincian Pembangunan Desa:
- Judul Pembangunan: ${input.judul || 'Pembangunan Infrastruktur Desa'}
- Lokasi Pembangunan: ${input.lokasi || 'Desa Sampeldes'}
- Volume Pembangunan: ${input.volume || '-'}
- Besaran Anggaran: ${formattedAnggaran}
- Sumber Anggaran: ${input.sumberAnggaran || 'Dana Desa (DD)'}
- Tahun Anggaran: ${input.tahun || new Date().getFullYear()}
${input.pelaksana ? `- Tim Pelaksana: ${input.pelaksana}` : '- Tim Pelaksana: Tim Pelaksana Kegiatan (TPK) Desa Sampeldes'}
${input.catatanTambahan?.trim() ? `- Poin Tambahan / Catatan Khusus: ${input.catatanTambahan.trim()}` : ''}

Ketentuan Format Penulisan:
1. Susun dalam 3 hingga 4 paragraf narasi berita standar pers desa (5W+1H).
2. Paragraf 1: Pengumuman realisasi pembangunan, tujuan strategis, lokasi spesifik, dan keterbukaan informasi publik desa.
3. Paragraf 2: Rincian spesifikasi fisik (volume), alokasi pembiayaan anggaran, sumber pos dana yang digunakan, serta transparansi kerja Tim Pelaksana Kegiatan (TPK).
4. Paragraf 3: Dampak positif dan manfaat langsung bagi aktivitas sosial-ekonomi masyarakat Sampeldes, serta pesan gotong royong dan imbauan merawat aset infrastruktur bersama.
5. Gunakan Bahasa Indonesia baku (EYD), lugas, santun, dan menumbuhkan rasa bangga serta kepedulian warga.
6. HANYA berikan teks narasi beritanya saja (jangan sertakan judul pengantar, meta tag, atau kalimat percakapan bot seperti "Tentu...").`;

  try {
    const raw = await callGemini(prompt);
    return raw.trim();
  } catch (err: any) {
    console.warn('Gemini generatePembangunanRedaksiAI error, using fallback:', err);
    return `SAMPELDES – Sebagai wujud nyata transparansi dan akuntabilitas tata kelola pemerintahan desa kepada masyarakat, Pemerintah Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap merealisasikan kegiatan ${input.judul || 'Pembangunan Sarana & Prasarana'} yang berlokasi di ${input.lokasi || 'wilayah Desa Sampeldes'}.

Kegiatan pembangunan ini memiliki volume fisik ${input.volume || 'sesuai rancangan teknis'} dengan alokasi pembiayaan sebesar ${formattedAnggaran} yang bersumber dari ${input.sumberAnggaran || 'Dana Desa (DD)'} Tahun Anggaran ${input.tahun || new Date().getFullYear()}. Pengerjaan infrastruktur ini dilaksanakan secara terpadu dan transparan oleh Tim Pelaksana Kegiatan (TPK) Desa Sampeldes dengan memberdayakan tenaga kerja lokal warga sekitar.

Realisasi pembangunan fisik ini diharapkan mampu meningkatkan konektivitas antar-wilayah, memperlancar mobilitas hasil bumi pertanian, serta memberikan kenyamanan bagi aktivitas harian warga masyarakat. Pemerintah Desa Sampeldes mengajak seluruh elemen warga untuk bersama-sama menjaga, memelihara, dan merawat sarana yang telah terbangun agar kebermanfaatannya dapat dirasakan dalam jangka panjang.`;
  }
}

