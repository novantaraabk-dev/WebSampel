'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  Plus,
  Trash2,
  Save,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { StatistikSdgsData } from '@/lib/types';
import { DEFAULT_VILLAGE_STATISTICS } from '@/lib/statistik-default-data';

interface AdminSdgsEditorProps {
  initialData?: Partial<StatistikSdgsData>;
  onSave: (data: Partial<StatistikSdgsData>, summary: string) => Promise<void>;
  isSaving: boolean;
}

export function AdminSdgsEditor({
  initialData,
  onSave,
  isSaving,
}: AdminSdgsEditorProps) {
  const [form, setForm] = useState<Partial<StatistikSdgsData>>(() => ({
    ...DEFAULT_VILLAGE_STATISTICS.sdgs,
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
    const summary = `Pembaruan data SDGs Desa: Skor Total ${form.skorTotal}, ${form.goals?.length || 18} Gol Pembangunan`;
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
              Modul 7 • 18 Tujuan SDGs Desa
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="h-6 w-6 text-emerald-700" />
            Kelola Skor & Capaian SDGs Desa Sampeldes
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Atur skor total pencapaian pembangunan berkelanjutan desa dan nilai capaian masing-masing dari 18 tujuan SDGs Desa Sampeldes.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSaving}
          className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-11 px-6 gap-2 border border-white/10 shrink-0"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Simpan Data SDGs Desa</span>
        </Button>
      </div>

      {/* Grid 1: Skor Total & Banner */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base border-b border-stone-200/60 pb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-700" />
          1. Skor Agregat SDGs Desa
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Skor Total SDGs Desa (0 - 100)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.skorTotal ?? 74.20}
              onChange={(e) => setForm({ ...form, skorTotal: Number(e.target.value) || 0 })}
              className="neu-inset h-10 text-xs font-bold text-emerald-700"
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Judul Banner SDGs</Label>
            <Input
              type="text"
              value={form.bannerTitle || 'Skor SDGs Desa: 74.20'}
              onChange={(e) => setForm({ ...form, bannerTitle: e.target.value })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Uraian / Deskripsi Banner SDGs</Label>
          <Textarea
            value={form.bannerDesc || ''}
            onChange={(e) => setForm({ ...form, bannerDesc: e.target.value })}
            rows={2}
            className="neu-inset text-xs rounded-xl"
          />
        </div>
      </Card>

      {/* Grid 2: 18 Gol SDGs Desa */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div className="border-b border-stone-200/60 pb-3">
          <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base">
            2. Capaian Masing-Masing 18 Gol SDGs Desa
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Ubah skor capaian (0-100) dan predikat status untuk masing-masing tujuan pembangunan berkelanjutan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {(form.goals || []).map((goal, idx) => (
            <div key={goal.no || idx} className="p-3.5 neu-inset rounded-2xl border border-stone-300/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-6 w-6 rounded-lg text-white font-condensed font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
                    style={{ backgroundColor: goal.color || '#059669' }}
                  >
                    {goal.no}
                  </span>
                  <span className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-xs truncate max-w-[200px] sm:max-w-xs">
                    {goal.title}
                  </span>
                </div>

                <Badge className="text-[9px] font-bold uppercase px-2 py-0.5">
                  {goal.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <Label className="text-[10px] font-bold">Skor (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={goal.score}
                    onChange={(e) => {
                      const copy = [...(form.goals || [])];
                      copy[idx] = { ...copy[idx], score: Number(e.target.value) || 0 };
                      setForm({ ...form, goals: copy });
                    }}
                    className="h-8 neu-inset text-xs font-bold"
                  />
                </div>

                <div>
                  <Label className="text-[10px] font-bold">Status Predikat</Label>
                  <Input
                    type="text"
                    value={goal.status}
                    onChange={(e) => {
                      const copy = [...(form.goals || [])];
                      copy[idx] = { ...copy[idx], status: e.target.value };
                      setForm({ ...form, goals: copy });
                    }}
                    className="h-8 neu-inset text-xs font-bold"
                  />
                </div>

                <div>
                  <Label className="text-[10px] font-bold">Warna HEX</Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={goal.color || '#059669'}
                      onChange={(e) => {
                        const copy = [...(form.goals || [])];
                        copy[idx] = { ...copy[idx], color: e.target.value };
                        setForm({ ...form, goals: copy });
                      }}
                      className="h-8 w-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                    />
                    <Input
                      type="text"
                      value={goal.color}
                      onChange={(e) => {
                        const copy = [...(form.goals || [])];
                        copy[idx] = { ...copy[idx], color: e.target.value };
                        setForm({ ...form, goals: copy });
                      }}
                      className="h-8 neu-inset text-[10px] font-mono px-1.5"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </form>
  );
}
