'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  HeartPulse,
  Plus,
  Trash2,
  Save,
  Loader2,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { StatistikKesehatanData } from '@/lib/types';
import { DEFAULT_VILLAGE_STATISTICS } from '@/lib/statistik-default-data';

interface AdminKesehatanEditorProps {
  initialData?: Partial<StatistikKesehatanData>;
  onSave: (data: Partial<StatistikKesehatanData>, summary: string) => Promise<void>;
  isSaving: boolean;
}

export function AdminKesehatanEditor({
  initialData,
  onSave,
  isSaving,
}: AdminKesehatanEditorProps) {
  const [form, setForm] = useState<Partial<StatistikKesehatanData>>(() => ({
    ...DEFAULT_VILLAGE_STATISTICS.kesehatan,
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
    const summary = `Pembaruan data kesehatan: BPJS ${form.bpjsPercent}, Stunting ${form.stuntingStatus}, Posyandu ${form.posyanduCount}, ${form.healthServices?.length || 0} Layanan`;
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
              Modul 3 • Kesehatan & Sanitasi Masyarakat
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-700" />
            Kelola Statistik Kesehatan Desa Sampeldes
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Atur metrik cakupan BPJS/KIS, status penanganan stunting, jaringan posyandu 6 RW, faskes rujukan, dan sarana kesehatan masyarakat.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSaving}
          className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-11 px-6 gap-2 border border-white/10 shrink-0"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Simpan Data Kesehatan</span>
        </Button>
      </div>

      {/* Grid 1: Indikator & Metrik Utama */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base border-b border-stone-200/60 pb-3 flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-emerald-700" />
          1. Indikator Pokok Kesehatan Warga
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cakupan BPJS / KIS</Label>
            <Input
              type="text"
              value={form.bpjsPercent || '95.4%'}
              onChange={(e) => setForm({ ...form, bpjsPercent: e.target.value })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Stunting</Label>
            <Input
              type="text"
              value={form.stuntingStatus || 'Terkendali'}
              onChange={(e) => setForm({ ...form, stuntingStatus: e.target.value })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Jaringan Posyandu</Label>
            <Input
              type="text"
              value={form.posyanduCount || 'Jaringan 6 RW'}
              onChange={(e) => setForm({ ...form, posyanduCount: e.target.value })}
              className="neu-inset h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Jarak Akses Faskes</Label>
            <Input
              type="text"
              value={form.aksesFaskes || '± 2 Km'}
              onChange={(e) => setForm({ ...form, aksesFaskes: e.target.value })}
              className="neu-inset h-10 text-xs"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Narasi Banner Kesehatan</Label>
          <Textarea
            value={form.bannerDesc || ''}
            onChange={(e) => setForm({ ...form, bannerDesc: e.target.value })}
            rows={2}
            className="neu-inset text-xs rounded-xl"
          />
        </div>
      </Card>

      {/* Grid 2: Sarana dan Layanan Kesehatan */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-emerald-700" />
            <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base">
              2. Sarana & Layanan Kesehatan Masyarakat Desa
            </h3>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const current = form.healthServices || [];
              setForm({
                ...form,
                healthServices: [
                  ...current,
                  { title: '', desc: '', tag: 'Layanan Komunitas' },
                ],
              });
            }}
            className="rounded-xl text-xs font-bold gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Layanan
          </Button>
        </div>

        <div className="space-y-3">
          {(form.healthServices || []).map((srv, idx) => (
            <div key={idx} className="p-4 neu-inset rounded-2xl border border-stone-300/40 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 flex-1">
                  <div className="sm:col-span-8 space-y-1">
                    <Label className="text-[11px] font-bold">Judul Layanan / Program</Label>
                    <Input
                      type="text"
                      value={srv.title}
                      onChange={(e) => {
                        const copy = [...(form.healthServices || [])];
                        copy[idx] = { ...copy[idx], title: e.target.value };
                        setForm({ ...form, healthServices: copy });
                      }}
                      className="h-9 neu-inset text-xs font-bold"
                    />
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-[11px] font-bold">Tag / Kategori</Label>
                    <Input
                      type="text"
                      value={srv.tag}
                      onChange={(e) => {
                        const copy = [...(form.healthServices || [])];
                        copy[idx] = { ...copy[idx], tag: e.target.value };
                        setForm({ ...form, healthServices: copy });
                      }}
                      className="h-9 neu-inset text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const copy = (form.healthServices || []).filter((_, i) => i !== idx);
                    setForm({ ...form, healthServices: copy });
                  }}
                  className="h-9 w-9 p-0 text-red-600 hover:bg-red-50 mt-5 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Uraian / Deskripsi Cakupan Layanan</Label>
                <Textarea
                  value={srv.desc}
                  onChange={(e) => {
                    const copy = [...(form.healthServices || [])];
                    copy[idx] = { ...copy[idx], desc: e.target.value };
                    setForm({ ...form, healthServices: copy });
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
