'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Truck,
  Plus,
  Trash2,
  Save,
  Loader2,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { StatistikPembangunanData } from '@/lib/types';
import { DEFAULT_VILLAGE_STATISTICS } from '@/lib/statistik-default-data';

interface AdminPembangunanEditorProps {
  initialData?: Partial<StatistikPembangunanData>;
  onSave: (data: Partial<StatistikPembangunanData>, summary: string) => Promise<void>;
  isSaving: boolean;
}

export function AdminPembangunanEditor({
  initialData,
  onSave,
  isSaving,
}: AdminPembangunanEditorProps) {
  const [form, setForm] = useState<Partial<StatistikPembangunanData>>(() => ({
    ...DEFAULT_VILLAGE_STATISTICS.pembangunan,
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
    const summary = `Pembaruan data pembangunan: Jalan Desa ${form.jalanDesaPanjang}, Akses Kab ${form.aksesKabupaten}, PJU ${form.pjuTitik}, 10 Arah RPJMDes`;
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
              Modul 6 • Pembangunan & Infrastruktur
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-emerald-700" />
            Kelola Statistik Pembangunan Desa Sampeldes
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Atur metrik infrastruktur jalan, transportasi, titik PJU, 10 arah kebijakan pembangunan RPJMDes, dan capaian prioritas fisik desa.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSaving}
          className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-11 px-6 gap-2 border border-white/10 shrink-0"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Simpan Data Pembangunan</span>
        </Button>
      </div>

      {/* Grid 1: Indikator Infrastruktur Utama */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base border-b border-stone-200/60 pb-3 flex items-center gap-2">
          <Truck className="h-4 w-4 text-emerald-700" />
          1. Indikator Pokok Infrastruktur & Transportasi
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Panjang Jalan Desa</Label>
            <Input
              type="text"
              value={form.jalanDesaPanjang || '18.4 Km'}
              onChange={(e) => setForm({ ...form, jalanDesaPanjang: e.target.value })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Jarak Akses Kabupaten</Label>
            <Input
              type="text"
              value={form.aksesKabupaten || '45 Km'}
              onChange={(e) => setForm({ ...form, aksesKabupaten: e.target.value })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Akses Transportasi Darat</Label>
            <Input
              type="text"
              value={form.transportasiDarat || '100%'}
              onChange={(e) => setForm({ ...form, transportasiDarat: e.target.value })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Penerangan Jalan (PJU)</Label>
            <Input
              type="text"
              value={form.pjuTitik || '360 Titik'}
              onChange={(e) => setForm({ ...form, pjuTitik: e.target.value })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Catatan Aksesibilitas BPS & Pemdes</Label>
          <Textarea
            value={form.catatanAksesibilitas || ''}
            onChange={(e) => setForm({ ...form, catatanAksesibilitas: e.target.value })}
            rows={2}
            className="neu-inset text-xs rounded-xl"
          />
        </div>
      </Card>

      {/* Grid 2: 10 Arah Kebijakan Pembangunan RPJMDes */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-200/60 pb-3">
          <Layers className="h-4 w-4 text-emerald-700" />
          <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base">
            2. 10 Arah Kebijakan Pembangunan Desa Sampeldes (RPJMDes)
          </h3>
        </div>

        <div className="space-y-3">
          {(form.tenDirections || []).map((dir, idx) => (
            <div key={idx} className="p-3.5 neu-inset rounded-2xl border border-stone-300/40 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-[#070b10] text-[#d4e157] font-condensed font-bold text-xs flex items-center justify-center shrink-0">
                  {dir.no || idx + 1}
                </span>
                <Input
                  type="text"
                  value={dir.title}
                  onChange={(e) => {
                    const copy = [...(form.tenDirections || [])];
                    copy[idx] = { ...copy[idx], title: e.target.value };
                    setForm({ ...form, tenDirections: copy });
                  }}
                  className="h-9 neu-inset text-xs font-bold flex-1"
                />
              </div>

              <Textarea
                value={dir.desc}
                onChange={(e) => {
                  const copy = [...(form.tenDirections || [])];
                  copy[idx] = { ...copy[idx], desc: e.target.value };
                  setForm({ ...form, tenDirections: copy });
                }}
                rows={2}
                className="neu-inset text-xs rounded-xl pl-8"
              />
            </div>
          ))}
        </div>
      </Card>
    </form>
  );
}
