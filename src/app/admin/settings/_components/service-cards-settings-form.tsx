'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Upload, RotateCcw, Image as ImageIcon, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { ServiceCardConfig, ServiceCardsSettingsInfo } from '@/lib/types';
import { DEFAULT_SERVICE_CARDS } from '@/lib/default-service-cards';
import { uploadToCloudinary } from '@/lib/upload-cloudinary';
import Image from 'next/image';

export function ServiceCardsSettingsForm() {
  const [cards, setCards] = useState<ServiceCardConfig[]>(DEFAULT_SERVICE_CARDS);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const { toast } = useToast();

  const firestore = useFirestore();

  const serviceCardsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'serviceCards');
  }, [firestore]);

  const { data: remoteData, isLoading } = useDoc<ServiceCardsSettingsInfo>(serviceCardsRef, {
    suppressGlobalError: true,
  });

  const resolveCardImage = (foundUrl: string | undefined, defUrl: string | undefined): string | undefined => {
    if (!foundUrl) return defUrl;
    const isOldPlaceholder =
      foundUrl.includes('toac8ivq1eaxjmkzlq9v') ||
      foundUrl.includes('photo-1526304640581') ||
      foundUrl.includes('photo-1497366216548') ||
      foundUrl.includes('photo-1500382017468') ||
      foundUrl.includes('photo-1506744038136') ||
      foundUrl.includes('photo-1511632765486') ||
      foundUrl.includes('photo-1529156069898') ||
      foundUrl.includes('photo-1517457373958');
    return isOldPlaceholder ? defUrl : foundUrl;
  };

  // Sync data dari Firestore jika sudah ada
  useEffect(() => {
    if (remoteData?.cards && Array.isArray(remoteData.cards) && remoteData.cards.length > 0) {
      // Gabungkan dengan default untuk menjaga kelengkapan 8 kartu
      const merged = DEFAULT_SERVICE_CARDS.map((def) => {
        const found = remoteData.cards?.find((c) => c.id === def.id);
        if (!found) return def;
        return {
          ...def,
          ...found,
          imageUrl: resolveCardImage(found.imageUrl, def.imageUrl),
        };
      });
      setCards(merged);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cached_service_cards_v3', JSON.stringify(merged));
        } catch (e) {
          // ignore
        }
      }
    }
  }, [remoteData]);

  const handleFieldChange = (id: string, field: keyof ServiceCardConfig, value: string) => {
    setCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, [field]: value } : card))
    );
  };

  const handleFileUpload = async (id: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Ukuran File Terlalu Besar',
        description: 'Maksimal ukuran foto kartu adalah 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingId(id);
    try {
      const url = await uploadToCloudinary(file, 'layanan-mandiri');
      handleFieldChange(id, 'imageUrl', url);
      toast({
        title: 'Foto Kartu Berhasil Diunggah',
        description: 'Foto telah diunggah ke Cloudinary. Klik "Simpan Pengaturan Kartu" untuk menyimpan ke database.',
      });
    } catch (err: any) {
      console.error('Error uploading service card image:', err);
      toast({
        title: 'Gagal Mengunggah Foto',
        description: err.message || 'Terjadi kesalahan saat mengunggah foto ke Cloudinary.',
        variant: 'destructive',
      });
    } finally {
      setUploadingId(null);
    }
  };

  const handleResetCard = (id: string) => {
    const defaultCard = DEFAULT_SERVICE_CARDS.find((c) => c.id === id);
    if (!defaultCard) return;
    setCards((prev) =>
      prev.map((card) => (card.id === id ? { ...defaultCard } : card))
    );
    toast({
      title: 'Direset ke Default',
      description: `Kartu "${defaultCard.title}" telah dikembalikan ke foto bawaan.`,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !serviceCardsRef) return;
    setIsSaving(true);

    try {
      const payload: ServiceCardsSettingsInfo = {
        cards,
        updatedAt: new Date(),
      };
      await setDoc(serviceCardsRef, payload, { merge: true });

      // Simpan langsung ke cache lokal agar halaman utama langsung menampilkan foto tanpa jeda
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cached_service_cards', JSON.stringify(cards));
        } catch (e) {
          // ignore
        }
      }

      toast({
        title: 'Pengaturan Kartu Berhasil Disimpan',
        description: 'Gambar dan konten kartu Layanan Mandiri di halaman beranda telah diperbarui.',
      });
    } catch (err: any) {
      console.error('Error saving service cards settings:', err);
      toast({
        title: 'Gagal Menyimpan Pengaturan',
        description: err.message || 'Terjadi kesalahan saat menyimpan data ke Firestore.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <ImageIcon className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold text-slate-900">
                Foto &amp; Kartu Layanan Mandiri (Anjungan Digital)
              </CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm text-slate-500 mt-1">
              Kelola gambar latar belakang, lencana, dan kategori untuk 8 kartu layanan mandiri yang tampil di halaman depan beranda.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-slate-900 hover:bg-emerald-800 text-white shadow-sm shrink-0 font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan Pengaturan Kartu
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {cards.map((card, idx) => {
            const isUploading = uploadingId === card.id;
            const currentImg = card.imageUrl || DEFAULT_SERVICE_CARDS[idx]?.imageUrl || '';

            return (
              <div
                key={card.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all duration-300 hover:border-emerald-300 hover:bg-white hover:shadow-md"
              >
                <div>
                  {/* Header Nomor & Judul */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/70">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      {card.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleResetCard(card.id)}
                      title="Reset ke gambar bawaan"
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Visual Pratinjau Bentuk Kapsul Arch Sesuai Desain Halaman Depan */}
                  <div className="mb-4 flex flex-col items-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Pratinjau Tampilan Beranda
                    </span>
                    <div className="relative w-full max-w-[210px] aspect-[1/1.3] rounded-[36px] overflow-hidden shadow-md border-2 border-white ring-1 border-slate-200 bg-slate-100 flex flex-col justify-end p-2">
                      {/* Background Photo */}
                      {currentImg ? (
                        <Image
                          src={currentImg}
                          alt={card.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-white/50 text-xs">
                          Belum ada foto
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35 pointer-events-none" />

                      {/* Inner White Container matching reference photo */}
                      <div className="relative z-10 w-full bg-white/95 rounded-t-[16px] rounded-b-[28px] pt-2 pb-2 px-2 shadow-xs flex flex-col items-center text-center">
                        {/* Theme pill badge */}
                        <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-900 text-white text-[8px] font-bold uppercase tracking-wider shadow-xs -mt-4 mb-0.5 ring-1 ring-white">
                          {card.badge || 'LAYANAN'}
                        </div>

                        {/* Category emerald text */}
                        <span className="text-[8px] font-bold text-emerald-700 uppercase tracking-wider line-clamp-1">
                          {card.category || 'LAYANAN WARGA'}
                        </span>

                        {/* Title */}
                        <h4 className="font-display font-medium text-[11px] text-slate-900 uppercase tracking-wide line-clamp-1 mt-0.5">
                          {card.title}
                        </h4>

                        {/* Subtitle */}
                        <p className="text-[8.5px] text-slate-500 line-clamp-1 leading-tight mt-0.5 px-0.5">
                          {card.subtitle}
                        </p>

                        {/* Circular Arrow Button */}
                        <div className="mt-1 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs">
                          <ArrowRight className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Upload & URL */}
                  <div className="space-y-3">
                    {/* Tombol Unggah File Langsung */}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => {
                          fileInputRefs.current[card.id] = el;
                        }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(card.id, file);
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        onClick={() => fileInputRefs.current[card.id]?.click()}
                        className="w-full h-8 text-xs font-medium border-slate-300 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 transition-colors"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-orange-600" />
                            Mengunggah ke Cloudinary...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 mr-1.5 text-orange-600" />
                            Unggah Foto Kartu
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Input URL Gambar */}
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-600">
                        URL Gambar (Cloudinary / Eksternal)
                      </Label>
                      <Input
                        type="text"
                        value={card.imageUrl || ''}
                        onChange={(e) => handleFieldChange(card.id, 'imageUrl', e.target.value)}
                        placeholder="https://res.cloudinary.com/..."
                        className="h-8 text-xs mt-1 bg-white"
                      />
                    </div>

                    {/* Input Lencana Biru (Badge) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] font-semibold text-slate-600">
                          Lencana Biru (Atas)
                        </Label>
                        <Input
                          type="text"
                          value={card.badge || ''}
                          onChange={(e) => handleFieldChange(card.id, 'badge', e.target.value)}
                          placeholder="PELAYANAN 24/7"
                          className="h-7 text-xs mt-0.5 bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-semibold text-slate-600">
                          Teks Oranye (Kategori)
                        </Label>
                        <Input
                          type="text"
                          value={card.category || ''}
                          onChange={(e) => handleFieldChange(card.id, 'category', e.target.value)}
                          placeholder="LAYANAN WARGA"
                          className="h-7 text-xs mt-0.5 bg-white"
                        />
                      </div>
                    </div>

                    {/* Judul & Keterangan */}
                    <div>
                      <Label className="text-[10px] font-semibold text-slate-600">
                        Judul Kartu
                      </Label>
                      <Input
                        type="text"
                        value={card.title || ''}
                        onChange={(e) => handleFieldChange(card.id, 'title', e.target.value)}
                        className="h-7 text-xs mt-0.5 bg-white font-medium"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] font-semibold text-slate-600">
                        Deskripsi Singkat
                      </Label>
                      <Input
                        type="text"
                        value={card.subtitle || ''}
                        onChange={(e) => handleFieldChange(card.id, 'subtitle', e.target.value)}
                        className="h-7 text-xs mt-0.5 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tombol Simpan Bawah */}
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white shadow-sm font-semibold px-6"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan Seluruh Pengaturan Kartu
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
