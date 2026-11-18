'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  School,
  Plus,
  Trash2,
  Save,
  Loader2,
  BookOpen,
  Award,
  Laptop,
  Users,
} from 'lucide-react';
import { StatistikPendidikanData } from '@/lib/types';
import { DEFAULT_VILLAGE_STATISTICS } from '@/lib/statistik-default-data';

interface AdminPendidikanEditorProps {
  initialData?: Partial<StatistikPendidikanData>;
  onSave: (data: Partial<StatistikPendidikanData>, summary: string) => Promise<void>;
  isSaving: boolean;
}

export function AdminPendidikanEditor({
  initialData,
  onSave,
  isSaving,
}: AdminPendidikanEditorProps) {
  const [form, setForm] = useState<Partial<StatistikPendidikanData>>(() => ({
    ...DEFAULT_VILLAGE_STATISTICS.pendidikan,
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
    const summary = `Pembaruan data pendidikan: Melek Huruf ${form.melekHuruf}, Wajib Belajar ${form.wajibBelajar}, ${form.localSchools?.length || 0} Satuan Sekolah`;
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
              Modul 2 • Pendidikan & SDM
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-emerald-700" />
            Kelola Statistik Pendidikan Desa Sampeldes
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Atur metrik capaian melek huruf, program wajib belajar, daftar lembaga sekolah terdaftar di Sampeldes, dan pilar pembangunan SDM.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSaving}
          className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-11 px-6 gap-2 border border-white/10 shrink-0"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Simpan Data Pendidikan</span>
        </Button>
      </div>

      {/* Grid 1: Ringkasan Capaian Pendidikan */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base border-b border-stone-200/60 pb-3 flex items-center gap-2">
          <Award className="h-4 w-4 text-emerald-700" />
          1. Indikator & Metrik Utama Pendidikan
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Angka Melek Huruf</Label>
            <Input
              type="text"
              value={form.melekHuruf || '99.4%'}
              onChange={(e) => setForm({ ...form, melekHuruf: e.target.value })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tuntas Wajib Belajar 12 Th</Label>
            <Input
              type="text"
              value={form.wajibBelajar || '97.2%'}
              onChange={(e) => setForm({ ...form, wajibBelajar: e.target.value })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Satuan Pendidikan Dasar</Label>
            <Input
              type="text"
              value={form.satuanDasar || '5 Satuan'}
              onChange={(e) => setForm({ ...form, satuanDasar: e.target.value })}
              className="neu-inset h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Satuan PAUD & TK</Label>
            <Input
              type="text"
              value={form.satuanPaud || '2+ Unit'}
              onChange={(e) => setForm({ ...form, satuanPaud: e.target.value })}
              className="neu-inset h-10 text-xs"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Narasi Banner Pendidikan</Label>
          <Textarea
            value={form.bannerDesc || ''}
            onChange={(e) => setForm({ ...form, bannerDesc: e.target.value })}
            rows={2}
            className="neu-inset text-xs rounded-xl"
          />
        </div>
      </Card>

      {/* Grid 2: Daftar Sekolah di Desa Sampeldes */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
          <div className="flex items-center gap-2">
            <School className="h-4 w-4 text-emerald-700" />
            <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base">
              2. Daftar Lembaga Satuan Pendidikan di Wilayah Sampeldes
            </h3>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const current = form.localSchools || [];
              setForm({
                ...form,
                localSchools: [
                  ...current,
                  { name: '', jenjang: 'Sekolah Dasar (SD)', status: 'Negeri', kategori: 'Pendidikan Dasar' },
                ],
              });
            }}
            className="rounded-xl text-xs font-bold gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Sekolah
          </Button>
        </div>

        <div className="space-y-3">
          {(form.localSchools || []).map((sch, idx) => (
            <div key={idx} className="p-3.5 neu-inset rounded-2xl border border-stone-300/40 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-4 space-y-1">
                <Label className="text-[11px] font-bold">Nama Sekolah / Lembaga</Label>
                <Input
                  type="text"
                  value={sch.name}
                  onChange={(e) => {
                    const copy = [...(form.localSchools || [])];
                    copy[idx] = { ...copy[idx], name: e.target.value };
                    setForm({ ...form, localSchools: copy });
                  }}
                  placeholder="Contoh: SD Negeri Sampeldes 01"
                  className="h-9 neu-inset text-xs font-bold"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <Label className="text-[11px] font-bold">Jenjang Pendidikan</Label>
                <Input
                  type="text"
                  value={sch.jenjang}
                  onChange={(e) => {
                    const copy = [...(form.localSchools || [])];
                    copy[idx] = { ...copy[idx], jenjang: e.target.value };
                    setForm({ ...form, localSchools: copy });
                  }}
                  className="h-9 neu-inset text-xs"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label className="text-[11px] font-bold">Status</Label>
                <Input
                  type="text"
                  value={sch.status}
                  onChange={(e) => {
                    const copy = [...(form.localSchools || [])];
                    copy[idx] = { ...copy[idx], status: e.target.value };
                    setForm({ ...form, localSchools: copy });
                  }}
                  className="h-9 neu-inset text-xs"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label className="text-[11px] font-bold">Kategori</Label>
                <Input
                  type="text"
                  value={sch.kategori}
                  onChange={(e) => {
                    const copy = [...(form.localSchools || [])];
                    copy[idx] = { ...copy[idx], kategori: e.target.value };
                    setForm({ ...form, localSchools: copy });
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
                    const copy = (form.localSchools || []).filter((_, i) => i !== idx);
                    setForm({ ...form, localSchools: copy });
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
    </form>
  );
}
