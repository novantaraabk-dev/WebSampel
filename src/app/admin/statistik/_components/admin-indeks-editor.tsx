'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Award,
  Layers,
  Save,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { StatistikIndeksData } from '@/lib/types';
import { DEFAULT_VILLAGE_STATISTICS } from '@/lib/statistik-default-data';

interface AdminIndeksEditorProps {
  initialData?: Partial<StatistikIndeksData>;
  onSave: (data: Partial<StatistikIndeksData>, summary: string) => Promise<void>;
  isSaving: boolean;
}

export function AdminIndeksEditor({
  initialData,
  onSave,
  isSaving,
}: AdminIndeksEditorProps) {
  const [form, setForm] = useState<Partial<StatistikIndeksData>>(() => ({
    ...DEFAULT_VILLAGE_STATISTICS.indeks,
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
    const summary = `Pembaruan data Indeks Desa: Skor ${form.skorTotal}, Status ${form.status}, 7 Dimensi IDM`;
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
              Modul 8 • Indeks Desa Membangun (IDM)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-emerald-700" />
            Kelola Status & Indeks Desa (IDM)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Atur skor total IDM, status kemajuan desa (Mandiri / Maju / Berkembang), nilai 7 dimensi strategis, dan rekomendasi arah kebijakan.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSaving}
          className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-11 px-6 gap-2 border border-white/10 shrink-0"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Simpan Data Indeks Desa</span>
        </Button>
      </div>

      {/* Grid 1: Skor IDM & Status */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base border-b border-stone-200/60 pb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-700" />
          1. Skor Agregat & Status Kemajuan Desa
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Skor Total Indeks (0 - 100)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.skorTotal ?? 83.80}
              onChange={(e) => setForm({ ...form, skorTotal: Number(e.target.value) || 0 })}
              className="neu-inset h-10 text-xs font-bold text-emerald-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Definitif Desa</Label>
            <Input
              type="text"
              value={form.status || 'Desa Mandiri'}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Judul Banner IDM</Label>
            <Input
              type="text"
              value={form.bannerTitle || 'Status Desa: DESA MANDIRI (Skor IDM: 83.80)'}
              onChange={(e) => setForm({ ...form, bannerTitle: e.target.value })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Uraian / Deskripsi Banner IDM</Label>
          <Textarea
            value={form.bannerDesc || ''}
            onChange={(e) => setForm({ ...form, bannerDesc: e.target.value })}
            rows={2}
            className="neu-inset text-xs rounded-xl"
          />
        </div>
      </Card>

      {/* Grid 2: 7 Dimensi Indeks Desa */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div className="border-b border-stone-200/60 pb-3">
          <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base">
            2. Nilai Rata-rata 7 Dimensi Strategis Indeks Desa
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Nilai skala 1.00 – 5.00 pada masing-masing dimensi komprehensif IDM.
          </p>
        </div>

        <div className="space-y-3.5">
          {(form.dimensions || []).map((dim, idx) => (
            <div key={dim.id || idx} className="p-4 neu-inset rounded-2xl border border-stone-300/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-[#070b10] text-[#d4e157] font-condensed font-bold text-xs flex items-center justify-center shrink-0">
                    {dim.no || idx + 1}
                  </span>
                  <Input
                    type="text"
                    value={dim.fullName || dim.name}
                    onChange={(e) => {
                      const copy = [...(form.dimensions || [])];
                      copy[idx] = { ...copy[idx], fullName: e.target.value, name: e.target.value };
                      setForm({ ...form, dimensions: copy });
                    }}
                    className="h-8 neu-inset text-xs font-bold max-w-sm"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[11px] font-bold">Skor Rata-rata:</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={dim.scoreAvg}
                      onChange={(e) => {
                        const copy = [...(form.dimensions || [])];
                        copy[idx] = { ...copy[idx], scoreAvg: Number(e.target.value) || 0 };
                        setForm({ ...form, dimensions: copy });
                      }}
                      className="h-8 w-20 neu-inset text-xs font-bold text-emerald-700"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Label className="text-[11px] font-bold">Status:</Label>
                    <Input
                      type="text"
                      value={dim.status}
                      onChange={(e) => {
                        const copy = [...(form.dimensions || [])];
                        copy[idx] = { ...copy[idx], status: e.target.value };
                        setForm({ ...form, dimensions: copy });
                      }}
                      className="h-8 w-28 neu-inset text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Deskripsi Capaian Dimensi</Label>
                <Textarea
                  value={dim.desc}
                  onChange={(e) => {
                    const copy = [...(form.dimensions || [])];
                    copy[idx] = { ...copy[idx], desc: e.target.value };
                    setForm({ ...form, dimensions: copy });
                  }}
                  rows={2}
                  className="neu-inset text-xs rounded-xl"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </form>
  );
}
