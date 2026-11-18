'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Sprout,
  Store,
  Plus,
  Trash2,
  Save,
  Loader2,
  Building2,
  Coins,
} from 'lucide-react';
import { StatistikEkonomiData } from '@/lib/types';
import { DEFAULT_VILLAGE_STATISTICS } from '@/lib/statistik-default-data';

interface AdminEkonomiEditorProps {
  initialData?: Partial<StatistikEkonomiData>;
  onSave: (data: Partial<StatistikEkonomiData>, summary: string) => Promise<void>;
  isSaving: boolean;
}

export function AdminEkonomiEditor({
  initialData,
  onSave,
  isSaving,
}: AdminEkonomiEditorProps) {
  const [form, setForm] = useState<Partial<StatistikEkonomiData>>(() => ({
    ...DEFAULT_VILLAGE_STATISTICS.ekonomi,
    ...(initialData || {}),
  }));

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const summary = `Pembaruan data ekonomi: Pertanian ${form.pertanianPercent}, Padi ${form.padiTahunanTon}, UMKM ${form.umkmCount}, BUMDes ${form.bumdesName}`;
    onSave(form, summary);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 neu-card-elevated rounded-[28px] border border-white/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Modul 5 • Ekonomi, Pertanian & BUMDes
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-700" />
            Kelola Statistik Ekonomi & Pertanian
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Atur metrik produksi pertanian padi, unit usaha BUMDes Mitra Sari Nusantara, komoditas perkebunan, dan populasi peternakan warga.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSaving}
          className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-11 px-6 gap-2 border border-white/10 shrink-0"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Simpan Data Ekonomi</span>
        </Button>
      </div>

      {/* Grid 1: Indikator Pokok Ekonomi */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base border-b border-stone-200/60 pb-3 flex items-center gap-2">
          <Coins className="h-4 w-4 text-emerald-700" />
          1. Metrik Pokok Perekonomian & Kelembagaan
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Porsi Sektor Pertanian</Label>
            <Input
              type="text"
              value={form.pertanianPercent || '65%'}
              onChange={(e) => setForm({ ...form, pertanianPercent: e.target.value })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Estimasi Padi Tahunan</Label>
            <Input
              type="text"
              value={form.padiTahunanTon || '1.680 Ton'}
              onChange={(e) => setForm({ ...form, padiTahunanTon: e.target.value })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">UMKM Terdata</Label>
            <Input
              type="text"
              value={form.umkmCount || '160+'}
              onChange={(e) => setForm({ ...form, umkmCount: e.target.value })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Lembaga BUMDes</Label>
            <Input
              type="text"
              value={form.bumdesName || 'BUMDes Mitra Sari Nusantara'}
              onChange={(e) => setForm({ ...form, bumdesName: e.target.value })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Narasi Banner Perekonomian</Label>
          <Textarea
            value={form.bannerDesc || ''}
            onChange={(e) => setForm({ ...form, bannerDesc: e.target.value })}
            rows={2}
            className="neu-inset text-xs rounded-xl"
          />
        </div>
      </Card>

      {/* Grid 2: Komoditas Pertanian & Perkebunan */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-emerald-700" />
            <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base">
              2. Komoditas Pertanian, Perkebunan & Pangan
            </h3>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const current = form.komoditas || [];
              setForm({
                ...form,
                komoditas: [...current, { name: '', yield: '100 Ton / thn', area: '20 Ha' }],
              });
            }}
            className="rounded-xl text-xs font-bold gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Komoditas
          </Button>
        </div>

        <div className="space-y-3">
          {(form.komoditas || []).map((kom, idx) => (
            <div key={idx} className="p-3.5 neu-inset rounded-2xl border border-stone-300/40 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-5 space-y-1">
                <Label className="text-[11px] font-bold">Nama Komoditas</Label>
                <Input
                  type="text"
                  value={kom.name}
                  onChange={(e) => {
                    const copy = [...(form.komoditas || [])];
                    copy[idx] = { ...copy[idx], name: e.target.value };
                    setForm({ ...form, komoditas: copy });
                  }}
                  className="h-9 neu-inset text-xs font-bold"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <Label className="text-[11px] font-bold">Estimasi Hasil Panen</Label>
                <Input
                  type="text"
                  value={kom.yield}
                  onChange={(e) => {
                    const copy = [...(form.komoditas || [])];
                    copy[idx] = { ...copy[idx], yield: e.target.value };
                    setForm({ ...form, komoditas: copy });
                  }}
                  className="h-9 neu-inset text-xs font-bold text-emerald-700"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <Label className="text-[11px] font-bold">Luas Lahan Estimasi</Label>
                <Input
                  type="text"
                  value={kom.area}
                  onChange={(e) => {
                    const copy = [...(form.komoditas || [])];
                    copy[idx] = { ...copy[idx], area: e.target.value };
                    setForm({ ...form, komoditas: copy });
                  }}
                  className="h-9 neu-inset text-xs"
                />
              </div>

              <div className="sm:col-span-1 flex items-end justify-center">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const copy = (form.komoditas || []).filter((_, i) => i !== idx);
                    setForm({ ...form, komoditas: copy });
                  }}
                  className="h-9 w-9 p-0 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Grid 3: Populasi Peternakan */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base border-b border-stone-200/60 pb-3 flex items-center gap-2">
          <Store className="h-4 w-4 text-emerald-700" />
          3. Populasi Hewan Peternakan Warga & BUMDes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sapi (Ekor)</Label>
            <Input
              type="number"
              value={form.ternak?.sapi ?? 260}
              onChange={(e) =>
                setForm({
                  ...form,
                  ternak: { ...form.ternak, sapi: Number(e.target.value) || 0, kambing: form.ternak?.kambing ?? 940, unggas: form.ternak?.unggas ?? '14K+' },
                })
              }
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kambing / Domba (Ekor)</Label>
            <Input
              type="number"
              value={form.ternak?.kambing ?? 940}
              onChange={(e) =>
                setForm({
                  ...form,
                  ternak: { ...form.ternak, kambing: Number(e.target.value) || 0, sapi: form.ternak?.sapi ?? 260, unggas: form.ternak?.unggas ?? '14K+' },
                })
              }
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Unggas / Ayam Petelur (Ekor/Teks)</Label>
            <Input
              type="text"
              value={String(form.ternak?.unggas ?? '14K+')}
              onChange={(e) =>
                setForm({
                  ...form,
                  ternak: { ...form.ternak, unggas: e.target.value, sapi: form.ternak?.sapi ?? 260, kambing: form.ternak?.kambing ?? 940 },
                })
              }
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>
        </div>
      </Card>
    </form>
  );
}
