'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Home,
  MapPin,
  TrendingUp,
  Activity,
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { VillageStatisticsData } from '@/lib/types';
import { DEFAULT_VILLAGE_STATISTICS } from '@/lib/statistik-default-data';

interface AdminKependudukanEditorProps {
  initialData?: Partial<VillageStatisticsData>;
  onSave: (data: Partial<VillageStatisticsData>, summary: string) => Promise<void>;
  isSaving: boolean;
}

export function AdminKependudukanEditor({
  initialData,
  onSave,
  isSaving,
}: AdminKependudukanEditorProps) {
  const [form, setForm] = useState<Partial<VillageStatisticsData>>(() => ({
    ...DEFAULT_VILLAGE_STATISTICS,
    ...(initialData || {}),
    sidebarInfo: {
      ...DEFAULT_VILLAGE_STATISTICS.sidebarInfo,
      ...(initialData?.sidebarInfo || {}),
    },
  }));

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
        sidebarInfo: {
          ...prev.sidebarInfo,
          ...(initialData.sidebarInfo || {}),
        },
      }));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const summary = `Pembaruan data kependudukan: Total ${form.total} Jiwa (${form.maleCount} Laki-laki, ${form.femaleCount} Perempuan), ${form.totalKK} KK`;
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
              Modul 1 • Demografi & Kependudukan
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-700" />
            Kelola Statistik Kependudukan & Wilayah
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Atur jumlah penduduk, kepala keluarga, rasio jenis kelamin, mutasi bulanan, serta indikator pokok wilayah yang tampil pada sidebar dan halaman publik.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSaving}
          className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-11 px-6 gap-2 border border-white/10 shrink-0"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Simpan Data Kependudukan</span>
        </Button>
      </div>

      {/* Grid 1: Indikator Pokok Demografi */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-200/60 pb-3">
          <Users className="h-4 w-4 text-emerald-700" />
          <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base">
            1. Indikator Pokok Demografi Penduduk
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Penduduk (Jiwa)</Label>
            <Input
              type="number"
              value={form.total ?? 8403}
              onChange={(e) => setForm({ ...form, total: Number(e.target.value) || 0 })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Kepala Keluarga (KK)</Label>
            <Input
              type="number"
              value={form.totalKK ?? 2710}
              onChange={(e) => setForm({ ...form, totalKK: Number(e.target.value) || 0 })}
              className="neu-inset h-10 text-xs font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Penduduk Laki-laki</Label>
            <Input
              type="number"
              value={form.maleCount ?? 4306}
              onChange={(e) => setForm({ ...form, maleCount: Number(e.target.value) || 0 })}
              className="neu-inset h-10 text-xs font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Penduduk Perempuan</Label>
            <Input
              type="number"
              value={form.femaleCount ?? 4097}
              onChange={(e) => setForm({ ...form, femaleCount: Number(e.target.value) || 0 })}
              className="neu-inset h-10 text-xs font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kepadatan (jiwa/km²)</Label>
            <Input
              type="number"
              value={form.density ?? 1651}
              onChange={(e) => setForm({ ...form, density: Number(e.target.value) || 0 })}
              className="neu-inset h-10 text-xs font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rasio Jenis Kelamin</Label>
            <Input
              type="number"
              step="0.01"
              value={form.sexRatio ?? 105.10}
              onChange={(e) => setForm({ ...form, sexRatio: Number(e.target.value) || 0 })}
              className="neu-inset h-10 text-xs font-medium"
            />
          </div>
        </div>
      </Card>

      {/* Grid 2: Sidebar Pokok Wilayah */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-200/60 pb-3">
          <MapPin className="h-4 w-4 text-emerald-700" />
          <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base">
            2. Parameter Ringkasan Sidebar Portal Publik (/statistik)
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Teks Luas Wilayah</Label>
            <Input
              type="text"
              value={form.sidebarInfo?.luasWilayah || '5,09 km² (4,27%)'}
              onChange={(e) =>
                setForm({
                  ...form,
                  sidebarInfo: { ...form.sidebarInfo, luasWilayah: e.target.value },
                })
              }
              className="neu-inset h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Teks Total Penduduk</Label>
            <Input
              type="text"
              value={form.sidebarInfo?.totalPenduduk || '8.403 Jiwa (7,17%)'}
              onChange={(e) =>
                setForm({
                  ...form,
                  sidebarInfo: { ...form.sidebarInfo, totalPenduduk: e.target.value },
                })
              }
              className="neu-inset h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Teks Kepadatan</Label>
            <Input
              type="text"
              value={form.sidebarInfo?.kepadatan || '1.651 jiwa/km²'}
              onChange={(e) =>
                setForm({
                  ...form,
                  sidebarInfo: { ...form.sidebarInfo, kepadatan: e.target.value },
                })
              }
              className="neu-inset h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Teks Rasio Kelamin</Label>
            <Input
              type="text"
              value={form.sidebarInfo?.rasioJenisKelamin || '105,10'}
              onChange={(e) =>
                setForm({
                  ...form,
                  sidebarInfo: { ...form.sidebarInfo, rasioJenisKelamin: e.target.value },
                })
              }
              className="neu-inset h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Teks Pembagian RW / RT</Label>
            <Input
              type="text"
              value={form.sidebarInfo?.rwRt || '6 RW / 38 RT'}
              onChange={(e) =>
                setForm({
                  ...form,
                  sidebarInfo: { ...form.sidebarInfo, rwRt: e.target.value },
                })
              }
              className="neu-inset h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Jarak ke Ibu Kota Kec.</Label>
            <Input
              type="text"
              value={form.sidebarInfo?.jarakKecamatan || '2 km'}
              onChange={(e) =>
                setForm({
                  ...form,
                  sidebarInfo: { ...form.sidebarInfo, jarakKecamatan: e.target.value },
                })
              }
              className="neu-inset h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Jarak ke Ibu Kota Kab.</Label>
            <Input
              type="text"
              value={form.sidebarInfo?.jarakKabupaten || '45 km'}
              onChange={(e) =>
                setForm({
                  ...form,
                  sidebarInfo: { ...form.sidebarInfo, jarakKabupaten: e.target.value },
                })
              }
              className="neu-inset h-10 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* Grid 3: Mutasi Penduduk Bulanan */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-700" />
            <h3 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-sm sm:text-base">
              3. Data Dinamika Mutasi Penduduk Bulanan
            </h3>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const current = form.mutationData || [];
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
              const nextMonth = months[current.length % 12];
              setForm({
                ...form,
                mutationData: [...current, { month: nextMonth, lahir: 0, mati: 0, datang: 0, pindah: 0 }],
              });
            }}
            className="rounded-xl text-xs font-bold gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Bulan
          </Button>
        </div>

        <div className="overflow-x-auto rounded-2xl neu-inset p-3 border border-stone-300/40">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-stone-300/40 text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300">
                <th className="py-2 px-3">Bulan</th>
                <th className="py-2 px-3">Lahir (Jiwa)</th>
                <th className="py-2 px-3">Mati (Jiwa)</th>
                <th className="py-2 px-3">Masuk / Datang</th>
                <th className="py-2 px-3">Keluar / Pindah</th>
                <th className="py-2 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/50">
              {(form.mutationData || []).map((row, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-3">
                    <Input
                      type="text"
                      value={row.month}
                      onChange={(e) => {
                        const copy = [...(form.mutationData || [])];
                        copy[idx] = { ...copy[idx], month: e.target.value };
                        setForm({ ...form, mutationData: copy });
                      }}
                      className="h-8 w-20 text-xs font-bold neu-inset"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Input
                      type="number"
                      value={row.lahir}
                      onChange={(e) => {
                        const copy = [...(form.mutationData || [])];
                        copy[idx] = { ...copy[idx], lahir: Number(e.target.value) || 0 };
                        setForm({ ...form, mutationData: copy });
                      }}
                      className="h-8 w-24 text-xs neu-inset"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Input
                      type="number"
                      value={row.mati}
                      onChange={(e) => {
                        const copy = [...(form.mutationData || [])];
                        copy[idx] = { ...copy[idx], mati: Number(e.target.value) || 0 };
                        setForm({ ...form, mutationData: copy });
                      }}
                      className="h-8 w-24 text-xs neu-inset"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Input
                      type="number"
                      value={row.datang}
                      onChange={(e) => {
                        const copy = [...(form.mutationData || [])];
                        copy[idx] = { ...copy[idx], datang: Number(e.target.value) || 0 };
                        setForm({ ...form, mutationData: copy });
                      }}
                      className="h-8 w-24 text-xs neu-inset"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Input
                      type="number"
                      value={row.pindah}
                      onChange={(e) => {
                        const copy = [...(form.mutationData || [])];
                        copy[idx] = { ...copy[idx], pindah: Number(e.target.value) || 0 };
                        setForm({ ...form, mutationData: copy });
                      }}
                      className="h-8 w-24 text-xs neu-inset"
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const copy = (form.mutationData || []).filter((_, i) => i !== idx);
                        setForm({ ...form, mutationData: copy });
                      }}
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </form>
  );
}
