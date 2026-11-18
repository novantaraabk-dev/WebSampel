'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Image as ImageIcon, Sparkles, Star, Trash2, ArrowLeft, ArrowRight, Plus, Calendar as CalendarIcon, CalendarDays, Play, Video } from 'lucide-react';
import { doc, setDoc, addDoc, collection, serverTimestamp, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { News } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { generateVillageNewsDraft, toTitleCase } from '@/lib/gemini-client';
import { getVideoEmbedUrl } from '@/lib/video-utils';
import { NewsImageGrid } from '@/components/news-image-grid';
import { uploadToCloudinary } from '@/lib/upload-cloudinary';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

interface NewsFormProps {
  initialData?: News | null;
}

function parseIndonesianDate(dateStr?: string): Date | undefined {
  if (!dateStr || typeof dateStr !== 'string') return undefined;

  const direct = new Date(dateStr);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const monthsMap: Record<string, number> = {
    jan: 0, januari: 0,
    feb: 1, februari: 1,
    mar: 2, maret: 2,
    apr: 3, april: 3,
    mei: 4,
    jun: 5, juni: 5,
    jul: 6, juli: 6,
    agu: 7, agustus: 7,
    sep: 8, september: 8,
    okt: 9, oktober: 9,
    nop: 10, nov: 10, november: 10,
    des: 11, desember: 11
  };

  const clean = dateStr.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const parts = clean.split(/\s+/).filter(Boolean);
  let day: number | null = null;
  let month: number | null = null;
  let year: number | null = null;

  for (const p of parts) {
    if (/^\d{4}$/.test(p)) {
      year = parseInt(p, 10);
    } else if (/^\d{1,2}$/.test(p) && day === null) {
      day = parseInt(p, 10);
    } else if (monthsMap[p] !== undefined && month === null) {
      month = monthsMap[p];
    }
  }

  if (day !== null && month !== null && year !== null) {
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return undefined;
}

export function NewsForm({ initialData }: NewsFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    date: '',
    content: '',
    author: '',
    imageUrl: '', // Cloudinary URL for primary photo
    imageUrls: [] as string[], // Cloudinary URLs array
    videoUrl: '',
    mediaType: 'photo' as 'photo' | 'video' | 'both',
    isHeadline: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    const formatted = format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: localeID });
    setFormData(p => ({ ...p, date: formatted }));
    setIsCalendarOpen(false);
  };

  const handleSetToday = () => {
    const today = new Date();
    const formatted = format(today, 'EEEE, dd MMMM yyyy', { locale: localeID });
    setFormData(p => ({ ...p, date: formatted }));
  };

  useEffect(() => {
    if (initialData) {
      const urls = initialData.imageUrls && initialData.imageUrls.length > 0
        ? initialData.imageUrls
        : (initialData.imageUrl ? [initialData.imageUrl] : []);

      const hasV = Boolean(initialData.videoUrl && initialData.videoUrl.trim().length > 0);
      const hasP = urls.length > 0;
      let mType: 'photo' | 'video' | 'both' = 'photo';
      if (initialData.mediaType) {
        mType = initialData.mediaType;
      } else if (hasV && hasP) {
        mType = 'both';
      } else if (hasV) {
        mType = 'video';
      }

      setFormData({
        title: initialData.title ?? '',
        subtitle: initialData.subtitle ?? '',
        date: initialData.date ?? '',
        content: initialData.content ?? '',
        author: initialData.author ?? '',
        imageUrl: urls[0] || initialData.imageUrl || '',
        imageUrls: urls,
        videoUrl: initialData.videoUrl ?? '',
        mediaType: mType,
        isHeadline: initialData.isHeadline ?? false,
      });
    }
  }, [initialData]);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result;
        if (typeof dataUrl !== 'string') {
          reject(new Error('Gagal membaca file gambar.'));
          return;
        }

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDimension = 1600;
          let { width, height } = img;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Tidak dapat memproses gambar.'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          const tryCompress = (quality: number, attempt: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Gagal mengompresi gambar.'));
                  return;
                }

                const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });

                if (compressedFile.size > 700 * 1024 && attempt < 4) {
                  tryCompress(Math.max(0.55, quality - 0.15), attempt + 1);
                } else {
                  resolve(compressedFile);
                }
              },
              'image/jpeg',
              quality
            );
          };

          tryCompress(0.9, 1);
        };
        img.onerror = () => reject(new Error('Gambar tidak valid.'));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of files) {
        const processingFile = await compressImage(file);
        const secureUrl = await uploadToCloudinary(processingFile, 'berita-desa');
        newUrls.push(secureUrl);
      }

      setFormData(prev => {
        const updatedUrls = [...prev.imageUrls, ...newUrls];
        return {
          ...prev,
          imageUrls: updatedUrls,
          imageUrl: updatedUrls[0] || prev.imageUrl,
        };
      });

      toast({
        title: 'Unggah Berhasil',
        description: `${newUrls.length} gambar berhasil dikompresi dan diunggah ke Cloudinary.`,
      });
    } catch (error: any) {
      let description = error.message;
      if (error instanceof SyntaxError) {
        description = 'Respons dari server tidak valid. Periksa konfigurasi Cloudinary Anda.';
      }

      toast({
        title: 'Gagal Mengunggah',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormData(prev => {
      const updated = prev.imageUrls.filter((_, i) => i !== index);
      return {
        ...prev,
        imageUrls: updated,
        imageUrl: updated[0] || '',
      };
    });
  };

  const handleMovePhoto = (fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      if (toIndex < 0 || toIndex >= prev.imageUrls.length) return prev;
      const updated = [...prev.imageUrls];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      return {
        ...prev,
        imageUrls: updated,
        imageUrl: updated[0] || '',
      };
    });
  };

  const handleGenerateWithAI = async () => {
    const hasPrompt = Boolean(aiPrompt.trim());
    const hasTitle = Boolean(formData.title.trim());
    const hasSubtitle = Boolean(formData.subtitle.trim());

    if (!hasPrompt && !hasTitle && !hasSubtitle) {
      toast({
        title: 'Petunjuk belum diisi',
        description: 'Tuliskan catatan kegiatan pada kotak prompt detail atau isi judul kegiatan terlebih dahulu.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const draft = await generateVillageNewsDraft({
        promptNotes: aiPrompt.trim(),
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        date: formData.date || 'Hari ini',
        author: formData.author || 'Tim Media Desa Sampeldes',
      });

      const formatted = formatNewsContent(draft.content);
      const finalTitle = (draft.title || formData.title || '').trim().toUpperCase();
      const finalSubtitle = toTitleCase((draft.subtitle || formData.subtitle || '').trim());

      setFormData(prev => ({
        ...prev,
        title: finalTitle || prev.title.toUpperCase(),
        subtitle: finalSubtitle || toTitleCase(prev.subtitle),
        content: formatted,
      }));

      toast({
        title: 'Berita Berhasil Dibuat AI ✨',
        description: 'Judul utama, sub judul, dan narasi berita lengkap telah terisi otomatis.',
      });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      toast({
        title: 'Gagal membuat berita AI',
        description: error.message || 'Terjadi kesalahan saat memproses draft berita AI.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    if (formData.imageUrls.some(url => !url.includes('res.cloudinary.com'))) {
      toast({
        title: 'URL Gambar tidak valid',
        description: 'Harap unggah ulang gambar untuk mendapatkan URL Cloudinary yang benar.',
        variant: 'destructive',
      });
      return;
    }

    const trimmedVideo = (formData.videoUrl || '').trim();

    if (trimmedVideo && !getVideoEmbedUrl(trimmedVideo)) {
      toast({
        title: 'URL Video tidak valid',
        description: 'Harap masukkan tautan YouTube, TikTok, atau Instagram yang benar.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.mediaType === 'video' && !trimmedVideo) {
      toast({
        title: 'Tautan Video Diperlukan',
        description: 'Untuk jenis Berita Video, silakan masukkan tautan video liputan.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const primaryUrl = formData.imageUrls[0] || formData.imageUrl || '';
      const hasP = formData.imageUrls.length > 0 || Boolean(primaryUrl);
      const hasV = Boolean(trimmedVideo);

      let finalMediaType: 'photo' | 'video' | 'both' = formData.mediaType;
      if (hasP && hasV) {
        finalMediaType = 'both';
      } else if (hasV && !hasP) {
        finalMediaType = 'video';
      } else if (hasP && !hasV) {
        finalMediaType = 'photo';
      }

      const dataToSave = {
        title: formData.title,
        subtitle: formData.subtitle,
        date: formData.date,
        author: formData.author,
        isHeadline: formData.isHeadline,
        mediaType: finalMediaType,
        imageUrl: primaryUrl,
        imageUrls: formData.imageUrls,
        videoUrl: trimmedVideo,
        content: formData.content ? formatNewsContent(formData.content) : '',
      };

      if (initialData) {
        const batch = writeBatch(firestore);
        if (dataToSave.isHeadline) {
          const headlineQuery = query(collection(firestore, 'news'), where('isHeadline', '==', true));
          const headlineSnapshot = await getDocs(headlineQuery);
          headlineSnapshot.docs.forEach((docSnapshot) => {
            if (docSnapshot.id !== initialData.id) {
              batch.update(doc(firestore, 'news', docSnapshot.id), { isHeadline: false, updatedAt: serverTimestamp() });
            }
          });
        }
        batch.set(doc(firestore, 'news', initialData.id), {
          ...dataToSave,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        await batch.commit();
        toast({ title: 'Berhasil Diperbarui' });
      } else {
        if (dataToSave.isHeadline) {
          const batch = writeBatch(firestore);
          const headlineQuery = query(collection(firestore, 'news'), where('isHeadline', '==', true));
          const headlineSnapshot = await getDocs(headlineQuery);
          headlineSnapshot.docs.forEach((docSnapshot) => {
            batch.update(doc(firestore, 'news', docSnapshot.id), { isHeadline: false, updatedAt: serverTimestamp() });
          });
          const newDocRef = doc(collection(firestore, 'news'));
          batch.set(newDocRef, {
            ...dataToSave,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await batch.commit();
        } else {
          await addDoc(collection(firestore, 'news'), {
            ...dataToSave,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        toast({ title: 'Berita Berhasil Dibuat' });
      }
      router.push('/admin/berita');
    } catch (error: any) {
      toast({ title: 'Gagal Menyimpan', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNewsContent = (rawContent: string) => {
    return rawContent
      .split(/\n\s*\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .join('\n\n');
  };

  return (
    <Card className="max-w-4xl mx-auto rounded-[1.6rem] border border-stone-200/90 shadow-sm overflow-hidden bg-white">
      <CardHeader className="p-5 sm:p-7 border-b border-stone-200 bg-stone-50">
        <CardTitle className="text-lg sm:text-xl font-condensed font-extrabold uppercase tracking-tight text-slate-900">{initialData ? 'Edit Berita Kegiatan' : 'Buat Berita Baru'}</CardTitle>
        <CardDescription className="text-xs sm:text-sm text-slate-500 font-medium">Lengkapi informasi berita kegiatan desa di bawah ini. Anda dapat mengunggah beberapa foto sekaligus.</CardDescription>
      </CardHeader>
      <CardContent className="p-5 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            {/* KOLOM KIRI: PILIHAN JENIS BERITA */}
            <div className="space-y-4">
              <Label className="font-condensed font-bold uppercase text-xs text-slate-700 tracking-wider">
                Jenis Berita
              </Label>
              <Tabs
                value={formData.mediaType}
                onValueChange={(value: string) => setFormData((prev) => ({ ...prev, mediaType: value as 'photo' | 'video' | 'both' }))}
                className="w-full"
              >
                <TabsList className="bg-[#070b10] border border-white/10 p-1.5 rounded-2xl grid w-full grid-cols-3 gap-1">
                  <TabsTrigger
                    value="photo"
                    className="text-slate-400 hover:text-white data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md font-condensed font-extrabold uppercase tracking-wider text-[11px] py-2 rounded-xl"
                  >
                    Berita Foto
                  </TabsTrigger>
                  <TabsTrigger
                    value="video"
                    className="text-slate-400 hover:text-white data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md font-condensed font-extrabold uppercase tracking-wider text-[11px] py-2 rounded-xl"
                  >
                    Berita Video
                  </TabsTrigger>
                  <TabsTrigger
                    value="both"
                    className="text-slate-400 hover:text-white data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md font-condensed font-extrabold uppercase tracking-wider text-[11px] py-2 rounded-xl"
                  >
                    Foto &amp; Video
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  {formData.mediaType === 'both' ? (
                    <>
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <span>Mode Foto &amp; Video (Lengkap)</span>
                    </>
                  ) : formData.mediaType === 'video' ? (
                    <>
                      <Video className="w-4 h-4 text-teal-600" />
                      <span>Mode Berita Video Liputan</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 text-teal-600" />
                      <span>Mode Berita Foto Dokumentasi</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {formData.mediaType === 'both'
                    ? 'Anda dapat mengunggah galeri foto dokumentasi DAN menyertakan tautan video liputan dalam satu berita yang sama.'
                    : formData.mediaType === 'video'
                    ? 'Masukkan tautan video YouTube, TikTok, atau Instagram. Anda juga dapat menambahkan foto cover / dokumentasi pendukung.'
                    : 'Unggah satu atau banyak foto dokumentasi kegiatan. Foto akan ditampilkan dengan 1 foto utama dan galeri thumbnail di bawahnya.'}
                </p>
              </div>
            </div>

            {/* KOLOM KANAN: MEDIA UPLOAD (FOTO & VIDEO) */}
            <div className="space-y-6">
              {/* BAGIAN TAUTAN VIDEO (DITAMPILKAN PADA MODE VIDEO & BOTH, ATAU BISA DIAKTIFKAN PADA FOTO) */}
              {(formData.mediaType === 'video' || formData.mediaType === 'both') && (
                <div className="space-y-3 rounded-2xl border p-4 bg-slate-50/80">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="video-url-main" className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Play className="h-3.5 w-3.5 text-teal-600" />
                      <span>Tautan Video Liputan {formData.mediaType === 'video' ? '(Wajib)' : '(Opsional)'}</span>
                    </Label>
                    <span className="text-[10px] text-slate-500 font-mono">YouTube / TikTok / IG</span>
                  </div>
                  <Input
                    id="video-url-main"
                    type="url"
                    value={formData.videoUrl ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=... atau https://vt.tiktok.com/..."
                    disabled={isSubmitting}
                    required={formData.mediaType === 'video'}
                  />
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">
                    Dapat menggunakan link YouTube, TikTok, atau Instagram. Video dapat langsung diputar di halaman detail berita.
                  </p>

                  {/* PRATINJAU VIDEO EMBED */}
                  {Boolean(formData.videoUrl?.trim()) && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <p className="text-[11px] font-bold text-slate-700 mb-1.5">Pratinjau Pemutar Video:</p>
                      {getVideoEmbedUrl(formData.videoUrl.trim()) ? (
                        <div className="aspect-video w-full max-w-lg rounded-xl overflow-hidden border bg-black shadow-sm">
                          <iframe
                            src={getVideoEmbedUrl(formData.videoUrl.trim())!}
                            title="Preview Video Berita"
                            className="w-full h-full border-none"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                          Tautan video belum valid. Pastikan link berasal dari YouTube, TikTok, atau Instagram.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* BAGIAN UPLOAD FOTO KEGIATAN */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Foto Kegiatan ({formData.imageUrls.length} Foto Diunggah)
                  </Label>
                  {formData.imageUrls.length > 0 && (
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">
                      Foto #1 = Gambar Utama
                    </span>
                  )}
                </div>

                {/* UPLOAD BUTTON */}
                <div className="flex flex-wrap items-center gap-4">
                  <Label
                    htmlFor="multi-photo-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 font-medium text-sm transition-colors shadow-sm"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>{formData.imageUrls.length > 0 ? 'Tambah Foto Lain' : 'Unggah Foto'}</span>
                  </Label>
                  <Input
                    id="multi-photo-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    disabled={isUploading || isSubmitting}
                    className="hidden"
                  />
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Format JPG/PNG. Anda dapat memilih lebih dari satu foto sekaligus.
                  </span>
                </div>

                {/* THUMBNAILS LIST & REORDER */}
                {formData.imageUrls.length > 0 && (
                  <div className="space-y-3 rounded-2xl border p-4 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-700">Daftar Foto (Foto 1 = Utama / Cover):</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {formData.imageUrls.map((url, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border bg-white shadow-sm">
                          <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shadow">
                              Utama
                            </span>
                          )}
                          {/* ACTION OVERLAY */}
                          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                            {idx > 0 && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="h-7 w-7 rounded-full text-slate-800"
                                onClick={() => handleMovePhoto(idx, idx - 1)}
                                title="Geser ke kiri"
                              >
                                <ArrowLeft className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {idx < formData.imageUrls.length - 1 && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="h-7 w-7 rounded-full text-slate-800"
                                onClick={() => handleMovePhoto(idx, idx + 1)}
                                title="Geser ke kanan"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={() => handleRemovePhoto(idx)}
                              title="Hapus foto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* LIVE PREVIEW OF GRID LAYOUT */}
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Pratinjau Layout Tampilan ({formData.imageUrls.length} Foto — Foto 1 Utama, Thumbnail di Bawah):
                      </p>
                      <div className="max-w-xl rounded-2xl border bg-white p-3 shadow-inner">
                        <NewsImageGrid imageUrls={formData.imageUrls} title={formData.title || 'Pratinjau'} interactive={false} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* TAUTAN VIDEO OPSIONAL (PADA MODE BERITA FOTO) */}
              {formData.mediaType === 'photo' && (
                <div className="pt-3 border-t border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="optional-video-url" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Play className="h-3.5 w-3.5 text-teal-600" />
                      <span>Tambah Tautan Video Liputan (Opsional)</span>
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">YouTube / TikTok / IG</span>
                  </div>
                  <Input
                    id="optional-video-url"
                    type="url"
                    value={formData.videoUrl ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=... (opsional)"
                    disabled={isSubmitting}
                  />
                  {Boolean(formData.videoUrl?.trim()) && getVideoEmbedUrl(formData.videoUrl.trim()) && (
                    <div className="aspect-video w-full max-w-md rounded-xl overflow-hidden border bg-black shadow-sm mt-2">
                      <iframe
                        src={getVideoEmbedUrl(formData.videoUrl.trim())!}
                        title="Preview Video Opsional"
                        className="w-full h-full border-none"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-amber-50 p-4 rounded-xl border border-amber-100">
            <Checkbox
              id="isHeadline"
              checked={formData.isHeadline}
              onCheckedChange={(checked: boolean | 'indeterminate') => setFormData(p => ({ ...p, isHeadline: !!checked }))}
            />
            <Label htmlFor="isHeadline" className="flex items-center gap-2 cursor-pointer font-bold text-amber-900">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              Tandai sebagai Berita Headline (Utama)
            </Label>
          </div>

          {/* BOX PROMPT DETAIL BERITA (AI GENERATOR) */}
          <div className="bg-gradient-to-br from-teal-50/70 via-emerald-50/40 to-stone-50 border border-teal-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-sm shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    Prompt Detail Berita
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                      Opsional
                    </span>
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                    Tuliskan catatan/poin kegiatan. AI akan otomatis membuatkan Judul Utama, Sub Judul, dan Isi Berita.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateWithAI}
                disabled={isGenerating || isSubmitting || isUploading}
                className="shrink-0 bg-teal-600 hover:bg-teal-500 text-white hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm border-none transition-all h-9 px-4"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyusun Berita...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 text-amber-300" />
                    Buat dengan AI
                  </>
                )}
              </Button>
            </div>

            <Textarea
              id="aiPrompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Contoh: Tadi pagi jam 08.00 warga Dusun Pangampiran bersama Kepala Desa Sampeldes mengadakan kerja bakti pembersihan saluran irigasi menjelang musim tanam padi agar aliran air lancar dan mengantisipasi banjir..."
              rows={3}
              className="bg-white/95 border-stone-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-stone-400 focus:border-teal-500 focus:ring-teal-500 shadow-inner"
              disabled={isGenerating}
            />

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-teal-100/80 gap-2">
              <span className="flex items-center gap-1.5 text-teal-900 font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                <strong className="font-semibold text-teal-800">Petunjuk:</strong> Semakin lengkap catatan (siapa, waktu, tempat, tujuan), semakin akurat redaksi berita yang disusun AI.
              </span>
              {aiPrompt.trim() && (
                <button
                  type="button"
                  onClick={() => setAiPrompt('')}
                  className="text-stone-400 hover:text-red-500 transition-colors text-[11px] font-medium"
                >
                  Bersihkan Catatan
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Judul Kegiatan (Maskot)</Label>
            <Input
              id="title"
              value={formData.title ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder="Contoh: Musyawarah Desa Sampeldes 2026"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Sub Judul</Label>
            <Input
              id="subtitle"
              value={formData.subtitle ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, subtitle: e.target.value }))}
              placeholder="Ringkasan singkat berita..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="date" className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-emerald-700" />
                Tanggal Berita
              </Label>
              <span className="text-[11px] font-medium text-slate-500">
                Format: <span className="font-semibold text-emerald-800">Hari, DD MMMM YYYY</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="date-picker-trigger"
                    type="button"
                    variant="outline"
                    className={cn(
                      "flex-1 h-12 justify-start text-left font-normal rounded-xl border-stone-300 bg-white hover:bg-stone-50 px-3.5 transition-all shadow-sm",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2.5 h-4 w-4 text-emerald-700 shrink-0" />
                    {formData.date ? (
                      <span className="text-slate-900 font-bold text-sm tracking-tight">{formData.date}</span>
                    ) : (
                      <span className="text-stone-400 text-sm">Klik untuk memilih tanggal...</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-stone-200 bg-white z-50" align="start">
                  <div className="p-3 border-b border-stone-100 flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                      Pilih Tanggal Berita
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleSetToday();
                        setIsCalendarOpen(false);
                      }}
                      className="h-7 px-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg"
                    >
                      Pilih Hari Ini
                    </Button>
                  </div>
                  <Calendar
                    mode="single"
                    selected={parseIndonesianDate(formData.date)}
                    onSelect={handleDateSelect}
                    locale={localeID}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Button
                type="button"
                variant="outline"
                onClick={handleSetToday}
                className="h-12 px-4 text-xs font-black uppercase tracking-wider text-emerald-800 border-emerald-300/80 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl transition-all shadow-sm shrink-0"
              >
                Hari Ini
              </Button>
            </div>

            {/* Hidden input for HTML form validation */}
            <input
              type="text"
              id="date"
              name="date"
              value={formData.date ?? ''}
              onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
              required
              className="sr-only"
              tabIndex={-1}
            />

            {formData.date && (
              <p className="text-xs text-stone-500 flex items-center gap-1.5 pl-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Terpilih: <strong className="text-slate-800 font-semibold">{formData.date}</strong>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="content">Isi Berita</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateWithAI}
                disabled={isGenerating || isSubmitting || isUploading}
                className="border-teal-500/50 bg-teal-500/15 text-teal-600 dark:text-teal-400 hover:bg-teal-500/25 font-black uppercase text-xs tracking-wider rounded-xl transition-all"
              >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Buat dengan AI
              </Button>
            </div>
            <Textarea
              id="content"
              value={formData.content ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(p => ({ ...p, content: e.target.value }))}
              placeholder="Tulis narasi lengkap berita di sini..."
              rows={15}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Pembuat Berita</Label>
            <Input
              id="author"
              value={formData.author ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, author: e.target.value }))}
              placeholder="Nama Penulis / Tim Media Desa"
              required
            />
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting || isUploading} className="w-full bg-teal-600 text-white hover:bg-teal-500 font-black uppercase tracking-wider rounded-xl h-12 shadow-sm transition-all border border-black/10">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Berita
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
