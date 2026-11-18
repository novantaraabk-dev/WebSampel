'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Share2, ExternalLink, RotateCcw } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { SocialLinksInfo } from '@/lib/types';

export const DEFAULT_SOCIAL_LINKS: Required<Omit<SocialLinksInfo, 'updatedAt'>> = {
  facebook: 'https://www.facebook.com/Desa%20Sampeldes,Gandrungmangu,Cilacap/?locale=id_ID',
  instagram: 'https://www.instagram.com/desa_sampeldes/',
  tiktok: 'https://www.tiktok.com/@mascamat.gandrungmangu',
  youtube: 'https://www.youtube.com/@Mascamat.Gandrungmangu',
};

export function SocialLinksSettingsForm() {
  const [formState, setFormState] = useState<SocialLinksInfo>({
    facebook: DEFAULT_SOCIAL_LINKS.facebook,
    instagram: DEFAULT_SOCIAL_LINKS.instagram,
    tiktok: DEFAULT_SOCIAL_LINKS.tiktok,
    youtube: DEFAULT_SOCIAL_LINKS.youtube,
  });

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const socialLinksRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'socialLinks');
  }, [firestore]);

  const { data: socialData, isLoading: isDataLoading } = useDoc<SocialLinksInfo>(socialLinksRef);

  useEffect(() => {
    if (socialData) {
      setFormState({
        facebook: socialData.facebook ?? DEFAULT_SOCIAL_LINKS.facebook,
        instagram: socialData.instagram ?? DEFAULT_SOCIAL_LINKS.instagram,
        tiktok: socialData.tiktok ?? DEFAULT_SOCIAL_LINKS.tiktok,
        youtube: socialData.youtube ?? DEFAULT_SOCIAL_LINKS.youtube,
      });
    }
  }, [socialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !socialLinksRef) return;
    setIsSaving(true);

    try {
      await setDoc(
        socialLinksRef,
        {
          facebook: formState.facebook?.trim() || '',
          instagram: formState.instagram?.trim() || '',
          tiktok: formState.tiktok?.trim() || '',
          youtube: formState.youtube?.trim() || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      toast({
        title: 'Tautan Media Sosial Disimpan',
        description: 'Tautan media sosial footer berhasil diperbarui dan langsung aktif.',
      });
    } catch (error) {
      console.error('Error saving social links:', error);
      toast({
        title: 'Gagal Menyimpan',
        description: 'Terjadi kesalahan saat menyimpan tautan media sosial.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setFormState({
      facebook: DEFAULT_SOCIAL_LINKS.facebook,
      instagram: DEFAULT_SOCIAL_LINKS.instagram,
      tiktok: DEFAULT_SOCIAL_LINKS.tiktok,
      youtube: DEFAULT_SOCIAL_LINKS.youtube,
    });
    toast({
      title: 'Tautan Direset',
      description: 'Format tautan bawaan telah dimuat. Klik Simpan Perubahan untuk menerapkan.',
    });
  };

  if (isDataLoading) {
    return <Skeleton className="h-[360px] w-full rounded-2xl sm:rounded-3xl" />;
  }

  return (
    <Card className="border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs">
      <CardHeader className="p-3.5 sm:p-6 pb-2.5 sm:pb-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-xs sm:text-base font-bold text-slate-900">
              <Share2 className="h-4 w-4 text-amber-500 shrink-0" />
              Tautan Media Sosial Footer
            </CardTitle>
            <CardDescription className="text-[11px] sm:text-xs text-slate-500 mt-1">
              Atur URL akun media sosial resmi desa. Ketika pengunjung mengklik tombol ikon di footer, mereka akan diarahkan ke tautan ini.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            disabled={isSaving}
            className="h-8 text-[11px] font-medium text-slate-600 hover:text-slate-900 border-slate-200 w-fit shrink-0"
          >
            <RotateCcw className="mr-1.5 h-3 w-3" />
            Reset Default
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 sm:p-6 pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Facebook */}
            <div className="space-y-1.5 rounded-xl border border-slate-200/80 p-3 sm:p-4 bg-white hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between">
                <Label htmlFor="facebook-url" className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </span>
                  Facebook
                </Label>
                {formState.facebook && (
                  <a
                    href={formState.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800"
                    title="Uji buka link"
                  >
                    Uji Link <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="facebook-url"
                type="url"
                placeholder="https://www.facebook.com/..."
                value={formState.facebook || ''}
                onChange={(e) => setFormState((prev) => ({ ...prev, facebook: e.target.value }))}
                disabled={isSaving}
                className="text-xs h-8 sm:h-9"
              />
              <p className="text-[10.5px] text-muted-foreground">Contoh: https://www.facebook.com/nama-halaman-desa</p>
            </div>

            {/* Instagram */}
            <div className="space-y-1.5 rounded-xl border border-slate-200/80 p-3 sm:p-4 bg-white hover:border-pink-300 transition-colors">
              <div className="flex items-center justify-between">
                <Label htmlFor="instagram-url" className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white">
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </span>
                  Instagram
                </Label>
                {formState.instagram && (
                  <a
                    href={formState.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-pink-600 hover:text-pink-800"
                    title="Uji buka link"
                  >
                    Uji Link <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="instagram-url"
                type="url"
                placeholder="https://www.instagram.com/..."
                value={formState.instagram || ''}
                onChange={(e) => setFormState((prev) => ({ ...prev, instagram: e.target.value }))}
                disabled={isSaving}
                className="text-xs h-8 sm:h-9"
              />
              <p className="text-[10.5px] text-muted-foreground">Contoh: https://www.instagram.com/desa_sampeldes/</p>
            </div>

            {/* TikTok */}
            <div className="space-y-1.5 rounded-xl border border-slate-200/80 p-3 sm:p-4 bg-white hover:border-slate-400 transition-colors">
              <div className="flex items-center justify-between">
                <Label htmlFor="tiktok-url" className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.82.94 1.93 1.63 3.16 2.01v3.74c-1.39-.02-2.77-.42-3.95-1.16-.72-.45-1.36-1.02-1.87-1.7v7.66c0 1.25-.26 2.47-.79 3.6-1.06 2.22-3.15 3.8-5.6 4.21-1.35.23-2.74.15-4.05-.24-2.26-.67-4.14-2.31-5.11-4.47-.6-1.34-.84-2.82-.7-4.29.28-2.9 2.06-5.46 4.81-6.42 1.27-.45 2.64-.5 3.94-.16v3.83c-.8-.28-1.68-.28-2.47.01-1.33.49-2.28 1.77-2.39 3.18-.12 1.63.89 3.16 2.46 3.51.68.15 1.39.11 2.05-.12.98-.35 1.72-1.19 1.92-2.2.06-.31.08-.63.08-.94V0h.02z" />
                    </svg>
                  </span>
                  TikTok
                </Label>
                {formState.tiktok && (
                  <a
                    href={formState.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-800 hover:text-black"
                    title="Uji buka link"
                  >
                    Uji Link <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="tiktok-url"
                type="url"
                placeholder="https://www.tiktok.com/@..."
                value={formState.tiktok || ''}
                onChange={(e) => setFormState((prev) => ({ ...prev, tiktok: e.target.value }))}
                disabled={isSaving}
                className="text-xs h-8 sm:h-9"
              />
              <p className="text-[10.5px] text-muted-foreground">Contoh: https://www.tiktok.com/@mascamat.gandrungmangu</p>
            </div>

            {/* YouTube */}
            <div className="space-y-1.5 rounded-xl border border-slate-200/80 p-3 sm:p-4 bg-white hover:border-red-300 transition-colors">
              <div className="flex items-center justify-between">
                <Label htmlFor="youtube-url" className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white">
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </span>
                  YouTube
                </Label>
                {formState.youtube && (
                  <a
                    href={formState.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-800"
                    title="Uji buka link"
                  >
                    Uji Link <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/@..."
                value={formState.youtube || ''}
                onChange={(e) => setFormState((prev) => ({ ...prev, youtube: e.target.value }))}
                disabled={isSaving}
                className="text-xs h-8 sm:h-9"
              />
              <p className="text-[10.5px] text-muted-foreground">Contoh: https://www.youtube.com/@Mascamat.Gandrungmangu</p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500 order-2 sm:order-1">
              Perubahan akan langsung terlihat pada 4 tombol ikon media sosial di footer publik.
            </p>
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto h-9 px-5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 order-1 sm:order-2 shadow-xs"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan Tautan Sosial Media
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
