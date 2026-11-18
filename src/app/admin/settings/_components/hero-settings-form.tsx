'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { HeroSlide, HeroSliderInfo } from '@/lib/types';
import { uploadToCloudinary } from '@/lib/upload-cloudinary';
import Image from 'next/image';

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    tag: 'PROFIL DESA',
    title: 'SAMPELDES',
    subtitle: 'GANDRUNGMANGU • CILACAP',
    description: 'Mengenal sejarah, visi misi, dan harmoni alam Desa Sampeldes yang mandiri serta berbudaya.',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop',
    actionText: 'PROFIL DESA',
    actionUrl: '/profil-desa/',
    layout: 'center',
  },
  {
    id: 'slide-2',
    tag: 'PELAYANAN MANDIRI',
    title: 'PELAYANAN',
    subtitle: 'ADMINISTRASI SURAT & LAYANAN PUBLIK DIGITAL',
    description: 'Kemudahan pengajuan surat pengantar dan layanan administrasi warga secara cepat dari rumah.',
    imageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop',
    actionText: 'URUS SURAT MANDIRI',
    actionUrl: '/layanan-surat/',
    layout: 'bottom-left',
  },
  {
    id: 'slide-3',
    tag: 'STATISTIK DESA',
    title: 'STATISTIK',
    subtitle: 'DATA KEPENDUDUKAN, APBDES & PERTANIAN',
    description: 'Transparansi informasi demografi warga, hamparan lahan pesawahan, dan indeks desa membangun.',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2070&auto=format&fit=crop',
    actionText: 'LIHAT DATA DESA',
    actionUrl: '/statistik/',
    layout: 'mid-left',
  },
  {
    id: 'slide-4',
    tag: 'POTENSI & WISATA DESA',
    title: 'POTENSI DESA',
    subtitle: 'PETERNAKAN KAMBING SAANEN & AGROWISATA',
    description: 'Sentra peternakan kambing perah Saanen unggulan, ketahanan pangan, dan wisata edukasi desa.',
    imageUrl: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?q=80&w=2070&auto=format&fit=crop',
    actionText: 'JELAJAHI POTENSI',
    actionUrl: '/potensi-desa/',
    layout: 'bottom-left',
  },
  {
    id: 'slide-5',
    tag: 'PENGADUAN WARGA',
    title: 'PENGADUAN',
    subtitle: 'LAYANAN ASPIRASI & KETERBUKAAN INFORMASI',
    description: 'Sampaikan saran, laporan infrastruktur, atau aspirasi pembangunan Desa Sampeldes secara langsung.',
    imageUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2070&auto=format&fit=crop',
    actionText: 'KIRIM ASPIRASI',
    actionUrl: '/pengaduan/',
    layout: 'center',
  },
];

export function HeroSettingsForm() {
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES);
  const [autoInterval, setAutoInterval] = useState<number>(5);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const firestore = useFirestore();

  const sliderRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'heroSlider');
  }, [firestore]);

  const legacyHeroRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'heroImage', 'default');
  }, [firestore]);

  const { data: sliderData, isLoading: isDataLoading } = useDoc<HeroSliderInfo>(sliderRef, { suppressGlobalError: true });

  useEffect(() => {
    if (sliderData?.slides && Array.isArray(sliderData.slides) && sliderData.slides.length > 0) {
      setSlides(sliderData.slides);
      if (sliderData.autoSlideInterval) {
        setAutoInterval(sliderData.autoSlideInterval);
      }
    }
  }, [sliderData]);

  const handleSlideChange = (index: number, field: keyof HeroSlide, value: string) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Ukuran File Terlalu Besar',
        description: 'Maksimal ukuran foto adalah 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingIndex(index);
    try {
      const url = await uploadToCloudinary(file, 'hero-slider');
      handleSlideChange(index, 'imageUrl', url);
      toast({
        title: 'Foto Terunggah ke Cloudinary',
        description: `Foto untuk slide #${index + 1} berhasil diunggah. Klik "Simpan Pengaturan Slider" untuk menyimpan perubahan.`,
      });
    } catch (err: any) {
      console.error('Error uploading hero slide:', err);
      toast({
        title: 'Gagal Mengunggah Foto',
        description: err.message || 'Terjadi kesalahan saat mengunggah foto ke Cloudinary.',
        variant: 'destructive',
      });
    } finally {
      setUploadingIndex(null);
    }
  };

  const addSlide = () => {
    if (slides.length >= 8) {
      toast({
        title: 'Maksimal 8 Slide',
        description: 'Untuk performa terbaik, batas maksimal adalah 8 slide.',
        variant: 'destructive',
      });
      return;
    }

    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      tag: 'Desa Sampeldes',
      title: 'JUDUL SLIDE BARU',
      subtitle: 'Subjudul atau Lokasi Slide',
      description: 'Tuliskan deskripsi singkat mengenai slide ini...',
      imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000',
      actionText: 'Lihat Selengkapnya',
      actionUrl: '/profil-desa/',
      layout: 'center',
    };

    setSlides([...slides, newSlide]);
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 1) {
      toast({
        title: 'Minimal 1 Slide',
        description: 'Slider harus memiliki minimal 1 slide.',
        variant: 'destructive',
      });
      return;
    }
    setSlides(slides.filter((_, i) => i !== index));
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const updated = [...slides];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSlides(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !sliderRef) return;

    setIsSaving(true);
    try {
      const payload: HeroSliderInfo = {
        slides,
        autoSlideInterval: Number(autoInterval) || 7,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(sliderRef, payload, { merge: true });

      // Simpan juga ke legacy heroImage agar sinkron jika ada komponen lain yang membaca
      if (legacyHeroRef && slides.length > 0 && slides[0].imageUrl) {
        await setDoc(legacyHeroRef, { imageUrl: slides[0].imageUrl }, { merge: true });
      }

      toast({
        title: 'Pengaturan Slider Berhasil Disimpan',
        description: `Telah tersimpan ${slides.length} slide carousel untuk halaman depan.`,
      });
    } catch (error: any) {
      console.error('Error saving hero slider:', error);
      toast({
        title: 'Gagal Menyimpan',
        description: error.message || 'Terjadi kesalahan saat menyimpan data ke Firestore.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isDataLoading) {
    return <Skeleton className="h-[250px] w-full rounded-2xl" />;
  }

  return (
    <Card className="rounded-[1.6rem] border border-stone-200/90 overflow-hidden shadow-sm bg-white">
      <CardHeader className="p-5 sm:p-6 pb-3 sm:pb-4 border-b border-stone-200 bg-stone-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2.5 text-sm sm:text-lg font-condensed font-extrabold uppercase tracking-tight text-slate-900">
              <div className="p-1.5 rounded-lg bg-[#070b10] text-teal-400 shrink-0">
                <Sliders className="h-4 w-4" />
              </div>
              Kelola Hero Slider (Cinematic Showcase)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Atur foto-foto latar belakang sinematik dan kartu thumbnail interaktif di halaman depan. Foto diunggah langsung ke <strong>Cloudinary</strong>.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              type="button"
              onClick={addSlide}
              variant="outline"
              size="sm"
              className="rounded-xl border-stone-200 hover:bg-white text-slate-800 font-bold text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Tambah Slide
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Opsi Kecepatan Slide Otomatis */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <Label className="text-xs font-bold text-slate-800">Interval Pergantian Otomatis (Detik)</Label>
              <p className="text-[11px] text-slate-500">Waktu slide berpindah otomatis saat pengunjung tidak berinteraksi.</p>
            </div>
            <div className="w-full sm:w-36">
              <Input
                type="number"
                min={3}
                max={20}
                value={autoInterval}
                onChange={(e) => setAutoInterval(Number(e.target.value))}
                className="text-xs h-9 bg-white"
              />
            </div>
          </div>

          {/* Daftar Slide */}
          <div className="space-y-4">
            {slides.map((slide, index) => (
              <div
                key={slide.id || index}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4 relative group"
              >
                {/* Header Kartu Slide */}
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#070b10] text-teal-400 text-xs font-black">
                      {index + 1}
                    </span>
                    <span className="text-xs font-condensed font-extrabold text-slate-800 uppercase tracking-wider">
                      {slide.title || `Slide #${index + 1}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveSlide(index, 'up')}
                      disabled={index === 0}
                      className="h-7 w-7 p-0"
                      title="Geser ke Atas"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveSlide(index, 'down')}
                      disabled={index === slides.length - 1}
                      className="h-7 w-7 p-0"
                      title="Geser ke Bawah"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSlide(index)}
                      className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      title="Hapus Slide"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Grid Form Slide: Preview & Input */}
                <div className="grid sm:grid-cols-12 gap-4 items-start">
                  {/* Preview Foto */}
                  <div className="sm:col-span-4 space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">Foto Slide (Cloudinary)</Label>
                    <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
                      {slide.imageUrl ? (
                        <Image
                          src={slide.imageUrl}
                          alt={slide.title || 'Slide Image'}
                          fill
                          sizes="300px"
                          className="object-cover"
                        />
                      ) : (
                        <p className="text-[10px] text-slate-400">Belum ada foto</p>
                      )}

                      {uploadingIndex === index && (
                        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-1">
                          <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
                          <span className="text-[10px] font-bold">Mengunggah ke Cloudinary...</span>
                        </div>
                      )}
                    </div>

                    {/* Input Upload Foto File */}
                    <div className="pt-1">
                      <Label
                        htmlFor={`file-upload-${index}`}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs transition-colors"
                      >
                        <Upload className="h-3.5 w-3.5 text-slate-700" />
                        Pilih & Upload Foto
                      </Label>
                      <input
                        id={`file-upload-${index}`}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(index, file);
                        }}
                      />
                    </div>
                  </div>

                  {/* Input Data Teks */}
                  <div className="sm:col-span-8 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">Kategori / Tag Lokasi</Label>
                        <Input
                          value={slide.tag || ''}
                          onChange={(e) => handleSlideChange(index, 'tag', e.target.value)}
                          placeholder="Contoh: Smart Gov • Sampeldes"
                          className="text-xs h-8 bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">Subjudul Kartu</Label>
                        <Input
                          value={slide.subtitle || ''}
                          onChange={(e) => handleSlideChange(index, 'subtitle', e.target.value)}
                          placeholder="Contoh: Kantor Pelayanan & Balai Desa"
                          className="text-xs h-8 bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600">Judul Utama (Huruf Kapital)</Label>
                      <Input
                        value={slide.title || ''}
                        onChange={(e) => handleSlideChange(index, 'title', e.target.value)}
                        placeholder="Contoh: PELAYANAN PUBLIK DIGITAL"
                        className="text-xs h-8 font-bold bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600">Deskripsi Singkat</Label>
                      <Textarea
                        value={slide.description || ''}
                        onChange={(e) => handleSlideChange(index, 'description', e.target.value)}
                        placeholder="Uraian singkat mengenai keunggulan atau fasilitas pada slide ini..."
                        rows={2}
                        className="text-xs bg-white resize-none"
                      />
                    </div>

                    {/* Tombol Aksi (CTA) & Tata Letak Sinematik */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">Teks Tombol Aksi</Label>
                        <Input
                          value={slide.actionText || ''}
                          onChange={(e) => handleSlideChange(index, 'actionText', e.target.value)}
                          placeholder="Contoh: PROFIL DESA"
                          className="text-xs h-8 bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">Link Tujuan Tombol</Label>
                        <Input
                          value={slide.actionUrl || ''}
                          onChange={(e) => handleSlideChange(index, 'actionUrl', e.target.value)}
                          placeholder="Contoh: /profil-desa/"
                          className="text-xs h-8 bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-600">Tata Letak Teks</Label>
                        <select
                          value={slide.layout || 'center'}
                          onChange={(e) => handleSlideChange(index, 'layout', e.target.value as any)}
                          className="w-full text-xs h-8 px-2.5 rounded-md border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                        >
                          <option value="center">Tengah (Center)</option>
                          <option value="bottom-left">Kiri Bawah (Bottom Left)</option>
                          <option value="mid-left">Kiri Tengah (Mid Left)</option>
                        </select>
                      </div>
                    </div>

                    {/* URL Gambar Langsung jika ingin paste link */}
                    <div className="space-y-1 pt-1">
                      <Label className="text-[10px] text-slate-500 font-medium">Tautan URL Gambar (Cloudinary / Eksternal)</Label>
                      <Input
                        value={slide.imageUrl || ''}
                        onChange={(e) => handleSlideChange(index, 'imageUrl', e.target.value)}
                        placeholder="https://res.cloudinary.com/..."
                        className="text-[11px] font-mono h-7 bg-slate-50 text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tombol Simpan */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Perubahan akan langsung diterapkan secara realtime di Hero Section Landing Page.
            </p>
            <Button
              type="submit"
              disabled={isSaving || uploadingIndex !== null}
              className="w-full sm:w-auto h-11 px-7 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-sm border border-black/10 transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pengaturan Slider
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
