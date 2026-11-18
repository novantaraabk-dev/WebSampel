'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import {
  DEFAULT_PELAYANAN_CONTENT,
  PELAYANAN_COLORS,
  PELAYANAN_CONTENT_DOC,
  PELAYANAN_ICONS,
  PELAYANAN_TAB_META,
  PelayananContent,
  PelayananTabId,
  getPelayananColor,
  getPelayananIcon,
  mergePelayananContent,
} from '@/lib/pelayanan-content';
import { PelayananDoc } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Link2,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Trash2,
} from 'lucide-react';

type Section = keyof PelayananContent;

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

function Field({
  label,
  value,
  onChange,
  multiline,
  placeholder,
  hint,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</Label>
      {multiline ? (
        <Textarea
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-xl text-xs sm:text-sm border-stone-200 focus-visible:ring-teal-500 resize-y"
        />
      ) : (
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 rounded-xl text-xs sm:text-sm border-stone-200 focus-visible:ring-teal-500"
        />
      )}
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border border-stone-200/90 shadow-2xs bg-white">
      <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
        <CardTitle className="text-sm font-condensed font-extrabold uppercase tracking-tight text-slate-900">{title}</CardTitle>
        {description && <CardDescription className="text-[11px]">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-0 space-y-4">{children}</CardContent>
    </Card>
  );
}

/** Editor daftar generik dengan tambah, hapus, dan ubah urutan. */
function ListEditor<T>({
  items,
  onChange,
  createItem,
  addLabel,
  renderItem,
  itemTitle,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  createItem: () => T;
  addLabel: string;
  itemTitle: (item: T, index: number) => string;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-5 w-5 rounded-full bg-[#070b10] text-teal-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-xs font-bold uppercase text-slate-700 truncate">{itemTitle(item, i) || '(tanpa judul)'}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Naikkan">
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === items.length - 1} onClick={() => move(i, i + 1)} aria-label="Turunkan">
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                aria-label="Hapus"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {renderItem(
            item,
            (patch) => onChange(items.map((it, idx) => (idx === i ? ({ ...it, ...patch } as T) : it))),
            i
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-xl border-dashed border-stone-300 text-xs font-bold uppercase tracking-wider h-10"
        onClick={() => onChange([...items, createItem()])}
      >
        <Plus className="h-4 w-4 mr-1.5" /> {addLabel}
      </Button>
    </div>
  );
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ikon</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 rounded-xl text-xs border-stone-200">
          <SelectValue placeholder="Pilih ikon" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PELAYANAN_ICONS).map(([key, { icon: Icon, label }]) => (
            <SelectItem key={key} value={key}>
              <span className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5" /> {label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ColorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Warna</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 rounded-xl text-xs border-stone-200">
          <SelectValue placeholder="Pilih warna" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PELAYANAN_COLORS).map(([key, { className, label }]) => (
            <SelectItem key={key} value={key}>
              <span className="flex items-center gap-2">
                <span className={cn('h-3.5 w-3.5 rounded', className)} /> {label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main editor
// ---------------------------------------------------------------------------

export function PelayananContentEditor() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const contentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, PELAYANAN_CONTENT_DOC.collection, PELAYANAN_CONTENT_DOC.id) : null),
    [firestore]
  );
  const { data: stored, isLoading } = useDoc<Partial<PelayananContent> & { updatedAt?: any }>(contentRef, {
    realtime: true,
    suppressGlobalError: true,
  });

  const [form, setForm] = useState<PelayananContent>(DEFAULT_PELAYANAN_CONTENT);
  const [initialized, setInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const pojokDocsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'pelayananDocs'),
      where('category', '==', 'pojok-baca'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);
  const { data: pojokDocs } = useCollection<PelayananDoc>(pojokDocsQuery);

  const savedContent = useMemo(() => mergePelayananContent(stored), [stored]);

  // Muat data tersimpan sekali saat pertama kali tersedia
  useEffect(() => {
    if (!isLoading && !initialized && firestore) {
      setForm(savedContent);
      setInitialized(true);
    }
  }, [isLoading, initialized, savedContent, firestore]);

  const isDirty = initialized && JSON.stringify(form) !== JSON.stringify(savedContent);

  // Peringatan saat meninggalkan halaman dengan perubahan belum disimpan
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const set = <S extends Section>(section: S, patch: Partial<PelayananContent[S]>) =>
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));

  const setTab = (id: PelayananTabId, patch: Partial<PelayananContent['tabs'][PelayananTabId]>) =>
    setForm((prev) => ({ ...prev, tabs: { ...prev.tabs, [id]: { ...prev.tabs[id], ...patch } } }));

  const handleSave = async () => {
    if (!contentRef) return;
    if (!Object.values(form.tabs).some((t) => t.visible)) {
      toast({ title: 'Minimal satu menu harus ditampilkan', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      await setDoc(contentRef, { ...form, updatedAt: serverTimestamp() });
      toast({ title: 'Konten Pelayanan Disimpan', description: 'Perubahan langsung tampil di halaman /pelayanan-desa.' });
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const resetSection = (section: Section) => {
    setForm((prev) => ({ ...prev, [section]: structuredClone(DEFAULT_PELAYANAN_CONTENT[section]) }));
    toast({ title: 'Bagian dikembalikan ke teks bawaan', description: 'Klik "Simpan Konten" untuk menerapkan.' });
  };

  const ResetButton = ({ section }: { section: Section }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 text-[10px] font-bold uppercase tracking-wider text-slate-500"
      onClick={() => resetSection(section)}
    >
      <RotateCcw className="h-3 w-3 mr-1" /> Kembalikan Bawaan
    </Button>
  );

  if (!initialized) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat konten...
      </div>
    );
  }

  const sections: { value: string; label: string }[] = [
    { value: 'menu', label: 'Menu & Umum' },
    ...PELAYANAN_TAB_META.map((m) => ({ value: m.id, label: form.tabs[m.id].label })),
  ];

  return (
    <div className="space-y-4">
      {/* Save bar */}
      <div className="sticky top-16 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#070b10] text-white px-4 py-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <Settings2 className="h-4 w-4 text-teal-400 shrink-0" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Konten Halaman Pelayanan Desa</p>
            <p className="text-[10px] text-slate-400">
              {isDirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan sudah tersimpan.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 rounded-xl bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white text-xs">
            <a href="/pelayanan-desa/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Lihat Halaman
            </a>
          </Button>
          {isDirty && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white text-xs"
              onClick={() => setForm(savedContent)}
            >
              Batalkan
            </Button>
          )}
          <Button
            size="sm"
            disabled={!isDirty || isSaving}
            onClick={handleSave}
            className="h-9 rounded-xl bg-teal-600 text-white hover:bg-teal-500 font-black uppercase tracking-wider text-xs"
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Simpan Konten
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 px-1">
        Tips: gunakan <code className="bg-stone-100 px-1 rounded">**teks**</code> untuk menebalkan kata dan Enter untuk baris baru pada kolom paragraf.
      </p>

      <Tabs defaultValue="menu" className="w-full">
        <TabsList className="flex flex-wrap h-auto justify-start gap-1 bg-stone-100 p-1 rounded-xl">
          {sections.map((s) => (
            <TabsTrigger
              key={s.value}
              value={s.value}
              className="text-[11px] font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* MENU & UMUM */}
        <TabsContent value="menu" className="space-y-4 mt-4">
          <SectionCard title="Daftar Menu" description="Ubah nama, deskripsi, dan tampilkan/sembunyikan menu di halaman Pelayanan Desa.">
            <div className="flex justify-end -mt-2"><ResetButton section="tabs" /></div>
            <div className="space-y-3">
              {PELAYANAN_TAB_META.map((meta) => {
                const tab = form.tabs[meta.id];
                return (
                  <div key={meta.id} className={cn('rounded-xl border p-3 sm:p-4 space-y-3', tab.visible ? 'border-stone-200 bg-stone-50/60' : 'border-dashed border-stone-300 bg-white opacity-70')}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <meta.icon className={cn('h-4 w-4', meta.color)} />
                        <span className="text-xs font-bold uppercase text-slate-700">{tab.label}</span>
                      </div>
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                        {tab.visible ? 'Ditampilkan' : 'Disembunyikan'}
                        <Switch checked={tab.visible} onCheckedChange={(v) => setTab(meta.id, { visible: v })} />
                      </label>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Nama Menu" value={tab.label} onChange={(v) => setTab(meta.id, { label: v })} />
                      <Field label="Deskripsi Singkat" value={tab.description} onChange={(v) => setTab(meta.id, { description: v })} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Teks Umum Halaman">
            <div className="flex justify-end -mt-2"><ResetButton section="general" /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Judul Sidebar Menu" value={form.general.sidebarTitle} onChange={(v) => set('general', { sidebarTitle: v })} />
              <Field label="Label Badge Header" value={form.general.badgeText} onChange={(v) => set('general', { badgeText: v })} hint="Kosongkan untuk menyembunyikan." />
            </div>
          </SectionCard>

          <SectionCard title="Banner Pusat Bantuan" description="Kotak bantuan di bawah menu sidebar (desktop).">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Label Kecil" value={form.general.helpEyebrow} onChange={(v) => set('general', { helpEyebrow: v })} />
              <Field label="Judul" value={form.general.helpTitle} onChange={(v) => set('general', { helpTitle: v })} />
            </div>
            <Field label="Deskripsi" multiline value={form.general.helpDescription} onChange={(v) => set('general', { helpDescription: v })} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Teks Tombol" value={form.general.helpButtonText} onChange={(v) => set('general', { helpButtonText: v })} />
              <Field label="Link Tombol" value={form.general.helpButtonLink} onChange={(v) => set('general', { helpButtonLink: v })} placeholder="/pengaduan/ atau https://..." />
            </div>
          </SectionCard>

          <SectionCard title="Bagian Dokumen Lampiran" description="Tabel lampiran PDF yang muncul di menu Standar, Jenis, SOP, IKM, dan Survey.">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Awalan Judul" value={form.general.attachmentTitlePrefix} onChange={(v) => set('general', { attachmentTitlePrefix: v })} hint='Contoh hasil: "Dokumen Lampiran Standar Layanan"' />
              <Field label="Teks Jika Kosong" value={form.general.attachmentEmptyText} onChange={(v) => set('general', { attachmentEmptyText: v })} />
            </div>
            <Field label="Deskripsi" value={form.general.attachmentDescription} onChange={(v) => set('general', { attachmentDescription: v })} />
          </SectionCard>
        </TabsContent>

        {/* VISI MISI */}
        <TabsContent value="visi-misi" className="space-y-4 mt-4">
          <SectionCard title="Visi & Moto" description="Ditampilkan jika belum ada gambar Visi Misi yang diunggah pada tab Dokumen.">
            <div className="flex justify-end -mt-2"><ResetButton section="visiMisi" /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Judul Visi" value={form.visiMisi.visiTitle} onChange={(v) => set('visiMisi', { visiTitle: v })} />
              <Field label="Judul Moto" value={form.visiMisi.motoTitle} onChange={(v) => set('visiMisi', { motoTitle: v })} />
            </div>
            <Field label="Isi Visi" multiline value={form.visiMisi.visiText} onChange={(v) => set('visiMisi', { visiText: v })} />
            <Field label="Isi Moto" value={form.visiMisi.motoText} onChange={(v) => set('visiMisi', { motoText: v })} />
            <Field label="Keterangan Moto" multiline rows={2} value={form.visiMisi.motoSubtext} onChange={(v) => set('visiMisi', { motoSubtext: v })} />
          </SectionCard>
          <SectionCard title="Misi Pelayanan">
            <Field label="Judul Daftar Misi" value={form.visiMisi.misiTitle} onChange={(v) => set('visiMisi', { misiTitle: v })} hint="Jumlah misi otomatis ditambahkan di depan judul." />
            <ListEditor
              items={form.visiMisi.misiItems}
              onChange={(misiItems) => set('visiMisi', { misiItems })}
              createItem={() => ''}
              addLabel="Tambah Misi"
              itemTitle={(m) => m.slice(0, 60)}
              renderItem={(item, _u, i) => (
                <Textarea
                  value={item}
                  rows={2}
                  onChange={(e) =>
                    set('visiMisi', { misiItems: form.visiMisi.misiItems.map((m, idx) => (idx === i ? e.target.value : m)) })
                  }
                  className="rounded-xl text-xs sm:text-sm border-stone-200 bg-white"
                />
              )}
            />
          </SectionCard>
        </TabsContent>

        {/* MAKLUMAT */}
        <TabsContent value="maklumat" className="space-y-4 mt-4">
          <SectionCard title="Maklumat Pelayanan" description="Ditampilkan jika belum ada gambar Maklumat yang diunggah pada tab Dokumen.">
            <div className="flex justify-end -mt-2"><ResetButton section="maklumat" /></div>
            <Field label="Judul" value={form.maklumat.title} onChange={(v) => set('maklumat', { title: v })} />
            <Field label="Paragraf Pernyataan" multiline rows={4} value={form.maklumat.paragraph1} onChange={(v) => set('maklumat', { paragraph1: v })} />
            <Field label="Paragraf Sanksi" multiline rows={3} value={form.maklumat.paragraph2} onChange={(v) => set('maklumat', { paragraph2: v })} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Penanda Tangan" value={form.maklumat.signatory} onChange={(v) => set('maklumat', { signatory: v })} />
              <Field label="Lokasi" value={form.maklumat.location} onChange={(v) => set('maklumat', { location: v })} />
            </div>
          </SectionCard>
        </TabsContent>

        {/* STANDAR */}
        <TabsContent value="standar" className="space-y-4 mt-4">
          <SectionCard title="Pengumuman Biaya">
            <div className="flex justify-end -mt-2"><ResetButton section="standar" /></div>
            <Field label="Judul Pengumuman" value={form.standar.noticeTitle} onChange={(v) => set('standar', { noticeTitle: v })} />
            <Field label="Isi Pengumuman" multiline value={form.standar.noticeText} onChange={(v) => set('standar', { noticeText: v })} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Label Durasi" value={form.standar.durationLabel} onChange={(v) => set('standar', { durationLabel: v })} />
              <Field label="Label Persyaratan" value={form.standar.requirementLabel} onChange={(v) => set('standar', { requirementLabel: v })} />
            </div>
          </SectionCard>
          <SectionCard title="Daftar Standar Layanan">
            <ListEditor
              items={form.standar.items}
              onChange={(items) => set('standar', { items })}
              createItem={() => ({ title: '', time: '', req: '', badge: '' })}
              addLabel="Tambah Layanan"
              itemTitle={(it) => it.title}
              renderItem={(item, update) => (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Nama Layanan" value={item.title} onChange={(v) => update({ title: v })} />
                    <Field label="Kategori (Badge)" value={item.badge} onChange={(v) => update({ badge: v })} />
                  </div>
                  <Field label="Waktu Penyelesaian" value={item.time} onChange={(v) => update({ time: v })} />
                  <Field label="Persyaratan" multiline rows={2} value={item.req} onChange={(v) => update({ req: v })} />
                </div>
              )}
            />
          </SectionCard>
        </TabsContent>

        {/* JENIS */}
        <TabsContent value="jenis" className="space-y-4 mt-4">
          <SectionCard title="Header Jenis Layanan">
            <div className="flex justify-end -mt-2"><ResetButton section="jenis" /></div>
            <Field label="Judul" value={form.jenis.headerTitle} onChange={(v) => set('jenis', { headerTitle: v })} />
            <Field label="Deskripsi" multiline rows={2} value={form.jenis.headerDescription} onChange={(v) => set('jenis', { headerDescription: v })} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Teks Tombol" value={form.jenis.buttonText} onChange={(v) => set('jenis', { buttonText: v })} />
              <Field label="Link Tombol & Ajukan" value={form.jenis.buttonLink} onChange={(v) => set('jenis', { buttonLink: v })} />
              <Field label="Label Biaya" value={form.jenis.feeLabel} onChange={(v) => set('jenis', { feeLabel: v })} />
              <Field label="Label Tombol Ajukan" value={form.jenis.applyLabel} onChange={(v) => set('jenis', { applyLabel: v })} />
            </div>
          </SectionCard>
          <SectionCard title="Daftar Jenis Surat">
            <ListEditor
              items={form.jenis.items}
              onChange={(items) => set('jenis', { items })}
              createItem={() => ({ type: '', desc: '', icon: 'file', color: 'lime' })}
              addLabel="Tambah Jenis Surat"
              itemTitle={(it) => it.type}
              renderItem={(item, update) => {
                const Icon = getPelayananIcon(item.icon);
                return (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={cn('mt-6 w-9 h-9 rounded-lg flex items-center justify-center shrink-0', getPelayananColor(item.color))}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1"><Field label="Nama Surat" value={item.type} onChange={(v) => update({ type: v })} /></div>
                    </div>
                    <Field label="Keterangan" multiline rows={2} value={item.desc} onChange={(v) => update({ desc: v })} />
                    <div className="grid grid-cols-2 gap-3">
                      <IconSelect value={item.icon} onChange={(v) => update({ icon: v })} />
                      <ColorSelect value={item.color} onChange={(v) => update({ color: v })} />
                    </div>
                  </div>
                );
              }}
            />
          </SectionCard>
        </TabsContent>

        {/* SOP */}
        <TabsContent value="sop" className="space-y-4 mt-4">
          <SectionCard title="Alur & SOP">
            <div className="flex justify-end -mt-2"><ResetButton section="sop" /></div>
            <Field label="Judul" value={form.sop.title} onChange={(v) => set('sop', { title: v })} />
            <Field label="Deskripsi" multiline rows={2} value={form.sop.description} onChange={(v) => set('sop', { description: v })} />
          </SectionCard>
          <SectionCard title="Tahapan" description="Nomor urut ditambahkan otomatis.">
            <ListEditor
              items={form.sop.steps}
              onChange={(steps) => set('sop', { steps })}
              createItem={() => ({ label: '', desc: '', icon: 'check' })}
              addLabel="Tambah Tahapan"
              itemTitle={(it) => it.label}
              renderItem={(item, update) => (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Nama Tahap" value={item.label} onChange={(v) => update({ label: v })} />
                    <IconSelect value={item.icon} onChange={(v) => update({ icon: v })} />
                  </div>
                  <Field label="Penjelasan" multiline rows={2} value={item.desc} onChange={(v) => update({ desc: v })} />
                </div>
              )}
            />
          </SectionCard>
        </TabsContent>

        {/* IKM */}
        <TabsContent value="ikm" className="space-y-4 mt-4">
          <SectionCard title="Skor IKM">
            <div className="flex justify-end -mt-2"><ResetButton section="ikm" /></div>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Label Skor" value={form.ikm.scoreLabel} onChange={(v) => set('ikm', { scoreLabel: v })} />
              <Field label="Nilai Skor" value={form.ikm.score} onChange={(v) => set('ikm', { score: v })} />
              <Field label="Predikat Mutu" value={form.ikm.gradeBadge} onChange={(v) => set('ikm', { gradeBadge: v })} />
            </div>
          </SectionCard>
          <SectionCard title="Laporan Evaluasi">
            <Field label="Judul Laporan" value={form.ikm.reportTitle} onChange={(v) => set('ikm', { reportTitle: v })} />
            <Field label="Isi Laporan" multiline rows={4} value={form.ikm.reportText} onChange={(v) => set('ikm', { reportText: v })} />
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block pt-1">Statistik Ringkas</Label>
            <ListEditor
              items={form.ikm.stats}
              onChange={(stats) => set('ikm', { stats })}
              createItem={() => ({ value: '', label: '' })}
              addLabel="Tambah Statistik"
              itemTitle={(it) => `${it.value} ${it.label}`}
              renderItem={(item, update) => (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nilai" value={item.value} onChange={(v) => update({ value: v })} />
                  <Field label="Keterangan" value={item.label} onChange={(v) => update({ label: v })} />
                </div>
              )}
            />
          </SectionCard>
        </TabsContent>

        {/* SURVEY */}
        <TabsContent value="survey" className="space-y-4 mt-4">
          <SectionCard title="Ajakan Survey">
            <div className="flex justify-end -mt-2"><ResetButton section="survey" /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Label Kecil" value={form.survey.eyebrow} onChange={(v) => set('survey', { eyebrow: v })} />
              <Field label="Teks Tombol" value={form.survey.buttonText} onChange={(v) => set('survey', { buttonText: v })} />
            </div>
            <Field label="Judul" value={form.survey.title} onChange={(v) => set('survey', { title: v })} />
            <Field label="Deskripsi" multiline value={form.survey.description} onChange={(v) => set('survey', { description: v })} />
            <Field label="Link Survey" value={form.survey.buttonLink} onChange={(v) => set('survey', { buttonLink: v })} placeholder="https://..." />
          </SectionCard>
        </TabsContent>

        {/* POJOK BACA */}
        <TabsContent value="pojok-baca" className="space-y-4 mt-4">
          <SectionCard title="Banner & Tautan Utama Pojok Baca" description="Tautan akses katalog digital, e-perpus, atau koleksi buku resmi desa.">
            <div className="flex justify-end -mt-2"><ResetButton section="pojokBaca" /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Judul Banner" value={form.pojokBaca.bannerTitle} onChange={(v) => set('pojokBaca', { bannerTitle: v })} />
              <Field label="Teks Tombol Link" value={form.pojokBaca.bannerButtonText} onChange={(v) => set('pojokBaca', { bannerButtonText: v })} placeholder="Contoh: Buka Perpustakaan Digital" />
            </div>
            <Field label="Deskripsi Banner" multiline rows={2} value={form.pojokBaca.bannerDescription} onChange={(v) => set('pojokBaca', { bannerDescription: v })} />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Link URL yang Dituju</Label>
                {form.pojokBaca.bannerButtonLink && (
                  <a
                    href={form.pojokBaca.bannerButtonLink.startsWith('http') ? form.pojokBaca.bannerButtonLink : `https://${form.pojokBaca.bannerButtonLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Buka Link yang Dituju
                  </a>
                )}
              </div>
              <div className="relative">
                <Input
                  value={form.pojokBaca.bannerButtonLink}
                  onChange={(e) => set('pojokBaca', { bannerButtonLink: e.target.value })}
                  placeholder="Contoh: https://e-perpus.desa.id atau https://drive.google.com/..."
                  className="h-10 rounded-xl text-xs sm:text-sm border-stone-200 focus-visible:ring-teal-500 pr-10"
                />
                {form.pojokBaca.bannerButtonLink && (
                  <a
                    href={form.pojokBaca.bannerButtonLink.startsWith('http') ? form.pojokBaca.bannerButtonLink : `https://${form.pojokBaca.bannerButtonLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Buka link yang dituju di tab baru"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-emerald-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
            <Field label="Teks Jika Belum Ada Konten" value={form.pojokBaca.emptyText} onChange={(v) => set('pojokBaca', { emptyText: v })} />
          </SectionCard>

          <SectionCard title="Daftar Tautan Buku / Dokumen Pojok Baca" description="Buku yang telah diinput pada tab Dokumen & Lampiran beserta link yang dituju.">
            {pojokDocs && pojokDocs.length > 0 ? (
              <div className="space-y-2.5">
                {pojokDocs.map((docItem) => {
                  const targetUrl = docItem.link || (docItem.fileId.startsWith('http') ? docItem.fileId : `https://drive.google.com/file/d/${docItem.fileId}/view`);
                  return (
                    <div key={docItem.id} className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="font-bold text-xs uppercase text-slate-800 truncate">{docItem.title}</p>
                        <div className="text-[10px] text-slate-500 truncate">
                          {docItem.link ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Link2 className="h-3 w-3 shrink-0" /> Link Tujuan: {docItem.link}
                            </span>
                          ) : (
                            <span className="italic text-slate-400">Link tujuan belum diset (menggunakan file pratinjau)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 border-emerald-200 shadow-2xs" asChild>
                          <a href={targetUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Buka Link yang Dituju</span>
                          </a>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs italic bg-stone-50 rounded-xl border border-dashed border-stone-200">
                Belum ada buku/dokumen Pojok Baca. Unggah buku dan atur link tujuannya pada tab Dokumen &amp; Lampiran.
              </div>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
