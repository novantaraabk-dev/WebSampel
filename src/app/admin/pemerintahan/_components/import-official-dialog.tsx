'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useFirestore } from '@/firebase';
import { invalidateCollectionCache } from '@/firebase/firestore/use-collection';
import { doc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';
import { OfficialCategory } from './official-form';

interface ImportOfficialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: OfficialCategory;
  onSuccess?: () => void;
}

export function ImportOfficialDialog({ open, onOpenChange, defaultCategory = 'perangkat', onSuccess }: ImportOfficialDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<OfficialCategory>(defaultCategory);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setCategory(defaultCategory);
      setSelectedFile(null);
    }
  }, [open, defaultCategory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile || !firestore) return;
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        const validRows = json
          .map((row) => ({
            name: row.Nama || row.NAMA || row.nama,
            position: row.Jabatan || row.JABATAN || row.jabatan,
          }))
          .filter((row) => row.name && row.position);

        if (validRows.length === 0) {
          throw new Error("Tidak ada baris valid dengan kolom Nama dan Jabatan yang ditemukan.");
        }

        const CHUNK_SIZE = 450;
        for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
          const batch = writeBatch(firestore);
          validRows.slice(i, i + CHUNK_SIZE).forEach((row) => {
            const newDocRef = doc(collection(firestore, 'officials'));
            batch.set(newDocRef, {
              name: String(row.name).trim().toUpperCase(),
              position: String(row.position).trim(),
              category,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          });
          await batch.commit();
        }

        invalidateCollectionCache('officials');
        onSuccess?.();
        toast({ title: "Impor Berhasil", description: `${validRows.length} data pengurus disimpan ke kategori ${category}.` });
        onOpenChange(false);
      } catch (err: any) {
        toast({ title: "Gagal Impor", description: err.message, variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const categoryLabels: Record<OfficialCategory, string> = {
    perangkat: 'Perangkat Desa',
    bpd: 'BPD Desa',
    rtrw: 'RT / RW',
    linmas: 'Satuan Linmas (Satlinmas)',
    posyandu: 'Kader Posyandu',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold">Impor Data {categoryLabels[category]}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Unggah file Excel (.xlsx / .xls) yang berisi kolom <strong>Nama</strong> dan <strong>Jabatan</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 sm:py-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm font-semibold">Kategori Tujuan</Label>
            <Select value={category} onValueChange={(v: any) => setCategory(v)}>
              <SelectTrigger className="h-10 sm:h-11 rounded-xl text-xs sm:text-sm">
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="perangkat">Perangkat Desa</SelectItem>
                <SelectItem value="bpd">BPD Desa</SelectItem>
                <SelectItem value="rtrw">RT / RW</SelectItem>
                <SelectItem value="linmas">Satuan Linmas</SelectItem>
                <SelectItem value="posyandu">Kader Posyandu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm font-semibold">Pilih File Excel</Label>
            <Input type="file" accept=".xlsx, .xls" onChange={handleFileChange} disabled={isProcessing} className="h-10 text-xs sm:text-sm rounded-xl" />
          </div>
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1 h-9 sm:h-10 text-xs sm:text-sm rounded-xl" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Batal
          </Button>
          <Button onClick={handleImport} disabled={!selectedFile || isProcessing} className="flex-1 h-9 sm:h-10 text-xs sm:text-sm rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white">
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Mulai Impor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
