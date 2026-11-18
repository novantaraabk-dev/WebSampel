"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  User,
  ArrowLeft,
  Search,
  Loader2,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Upload,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  SlidersHorizontal,
  X,
  Phone,
  MapPin,
  FileText,
  CreditCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { useState, useRef, useMemo } from "react"
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, getDocs, writeBatch } from "firebase/firestore"
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking
} from "@/firebase/non-blocking-updates"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import { cn } from "@/lib/utils"

export interface PersonnelCategoryConfig {
  id: string;
  name: string;
  columns: string[];
  integrateSPPD?: boolean;
  integrateCetakDokumen?: boolean;
  isDefault?: boolean;
}

const DEFAULT_CATEGORIES: PersonnelCategoryConfig[] = [
  { id: "pemerintah-desa", name: "Pemerintah Desa", columns: ["Nama", "Jabatan", "NIP", "Alamat", "No HP"], integrateSPPD: true, integrateCetakDokumen: true, isDefault: true },
  { id: "bpd", name: "BPD", columns: ["Nama", "Jabatan", "Alamat", "No HP"], integrateSPPD: true, integrateCetakDokumen: true, isDefault: true },
  { id: "rt-rw", name: "RT/RW", columns: ["Nama", "Jabatan", "Dusun / RT", "No HP"], integrateSPPD: false, integrateCetakDokumen: true, isDefault: true },
  { id: "kader", name: "Kader", columns: ["Nama", "Jabatan", "Dusun / RT", "No HP"], integrateSPPD: false, integrateCetakDokumen: true, isDefault: true },
  { id: "kpm", name: "KPM", columns: ["Nama", "Jabatan", "No HP"], integrateSPPD: false, integrateCetakDokumen: true, isDefault: true },
  { id: "karang-taruna", name: "Karang Taruna", columns: ["Nama", "Jabatan", "No HP"], integrateSPPD: false, integrateCetakDokumen: true, isDefault: true },
  { id: "linmas", name: "Linmas", columns: ["Nama", "Jabatan", "Dusun / RT", "No HP"], integrateSPPD: false, integrateCetakDokumen: true, isDefault: true },
  { id: "pengurus-bumdes", name: "Pengurus BUMDes", columns: ["Nama", "Jabatan", "No HP"], integrateSPPD: false, integrateCetakDokumen: true, isDefault: true },
  { id: "pengurus-kdmp", name: "Pengurus KDMP", columns: ["Nama", "Jabatan", "No HP"], integrateSPPD: false, integrateCetakDokumen: true, isDefault: true },
  { id: "guru-ngaji", name: "Guru Ngaji", columns: ["Nama", "Jabatan", "Alamat", "No HP"], integrateSPPD: false, integrateCetakDokumen: true, isDefault: true },
  { id: "guru-tk-paud", name: "Guru TK & Paud", columns: ["Nama", "Jabatan", "Alamat", "No HP"], integrateSPPD: false, integrateCetakDokumen: true, isDefault: true },
];

const QUICK_COLUMNS = [
  "Nama",
  "Jabatan",
  "Alamat",
  "No HP",
  "NIP",
  "NIK",
  "Keterangan",
  "Dusun / RT"
];

// Helper: Weighting for Pemerintah Desa hierarchy
const getRankWeight = (jabatan: string) => {
  const j = (jabatan || "").toUpperCase();
  if (j.includes("KEPALA DESA")) return 1;
  if (j.includes("SEKRETARIS DESA")) return 2;
  if (j.includes("KASI") || j.includes("KEPALA SEKSI")) return 3;
  if (j.includes("KAUR") || j.includes("KEPALA URUSAN")) return 4;
  if (j.includes("KEPALA DUSUN") || j.includes("KADUS")) return 5;
  if (j.includes("STAF")) return 6;
  return 100;
};

// Helper: Weighting for RT/RW sorting
const getRtRwWeight = (jabatan: string) => {
  const j = (jabatan || "").toUpperCase();
  const rwMatch = j.match(/RW\s*(\d+)/);
  const rtMatch = j.match(/RT\s*(\d+)/);

  const rwNum = rwMatch ? parseInt(rwMatch[1]) : 0;
  const rtNum = rtMatch ? parseInt(rtMatch[1]) : 0;

  let weight = rwNum * 1000;
  if (j.includes("KETUA RW") && !j.includes("RT")) {
    weight += 0;
  } else {
    weight += rtNum;
  }
  return weight;
};

// Helper: Weighting for Kader/Posyandu sorting
const getKaderWeight = (jabatan: string) => {
  const j = (jabatan || "").toUpperCase();
  const posyanduMatch = j.match(/RAHAYU\s*(\d+)/);
  return posyanduMatch ? parseInt(posyanduMatch[1]) : 999;
};

export default function ProfilePage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const personnelRef = useMemoFirebase(() => db ? collection(db, "personnel") : null, [db])
  const { data: officials, isLoading: isDataLoading } = useCollection(personnelRef)

  // Settings Firestore: Kategori & Kolom Personel Dinamis
  const categoriesDocRef = useMemoFirebase(() => db ? doc(db, "settings", "personnel_categories") : null, [db]);
  const { data: categoriesDoc, isLoading: isCategoriesLoading } = useDoc(categoriesDocRef);

  const categories: PersonnelCategoryConfig[] = useMemo(() => {
    if (categoriesDoc && Array.isArray(categoriesDoc.categories) && categoriesDoc.categories.length > 0) {
      return categoriesDoc.categories;
    }
    return DEFAULT_CATEGORIES;
  }, [categoriesDoc]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("Pemerintah Desa");

  // Modal Tambah Personel & Edit Personel
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteSingleConfirmOpen, setIsDeleteSingleConfirmOpen] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Modal Tambah Tab Kategori Baru (Gambar 2)
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColumns, setNewCategoryColumns] = useState<string[]>(["Nama", "Jabatan", "Alamat"]);
  const [newCustomColumnInput, setNewCustomColumnInput] = useState("");
  const [newIntegrateSPPD, setNewIntegrateSPPD] = useState(true);
  const [newIntegrateCetakDokumen, setNewIntegrateCetakDokumen] = useState(true);

  // Modal Atur Kolom Tab Aktif (Gambar 3)
  const [isEditColumnsModalOpen, setIsEditColumnsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PersonnelCategoryConfig | null>(null);
  const [editCategoryColumns, setEditCategoryColumns] = useState<string[]>([]);
  const [editCustomColumnInput, setEditCustomColumnInput] = useState("");
  const [editIntegrateSPPD, setEditIntegrateSPPD] = useState(true);
  const [editIntegrateCetakDokumen, setEditIntegrateCetakDokumen] = useState(true);

  // Form Data Dinamis Personel (Key-Value)
  const [personnelFormData, setPersonnelFormData] = useState<Record<string, string>>({});
  const [editingOfficial, setEditingOfficial] = useState<any>(null);
  const [deletingOfficial, setDeletingOfficial] = useState<any>(null);

  // Konfigurasi Kategori yang sedang aktif
  const currentCategoryConfig = useMemo(() => {
    return categories.find(c => c.name.toLowerCase() === activeTab.toLowerCase()) || {
      id: "default",
      name: activeTab,
      columns: ["Nama", "Jabatan"],
      integrateSPPD: true,
      integrateCetakDokumen: true
    };
  }, [categories, activeTab]);

  // Sorting logic combined with filtering
  const sortedOfficials = useMemo(() => {
    if (!officials) return [];

    const filtered = officials.filter(o => {
      const nameMatch = (o.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const jobMatch = (o.jabatan?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const nipMatch = (o.nip?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const fieldsMatch = o.fields ? Object.values(o.fields).some(v => String(v || '').toLowerCase().includes(searchTerm.toLowerCase())) : false;
      return nameMatch || jobMatch || nipMatch || fieldsMatch;
    });

    return filtered.sort((a, b) => {
      if (a.category !== b.category) return (a.category || "").localeCompare(b.category || "");

      const cat = a.category;

      if (cat === "Pemerintah Desa") {
        const wA = getRankWeight(a.jabatan);
        const wB = getRankWeight(b.jabatan);
        if (wA !== wB) return wA - wB;
      } else if (cat === "RT/RW") {
        const wA = getRtRwWeight(a.jabatan);
        const wB = getRtRwWeight(b.jabatan);
        if (wA !== wB) return wA - wB;
      } else if (cat === "Kader") {
        const wA = getKaderWeight(a.jabatan);
        const wB = getKaderWeight(b.jabatan);
        if (wA !== wB) return wA - wB;
      }

      return (a.name || "").localeCompare(b.name || "");
    });
  }, [officials, searchTerm]);

  // Helper mendapatkan value field dinamis
  const getFieldValue = (official: any, colName: string): string => {
    if (!official) return "";
    const cleanCol = colName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanCol === "nama" || cleanCol === "name") return official.name || "";
    if (cleanCol === "jabatan" || cleanCol === "job" || cleanCol === "role") return official.jabatan || "";
    if (cleanCol === "nip") return official.nip || official.fields?.[colName] || official.fields?.nip || "";
    if (cleanCol === "nik") return official.nik || official.fields?.[colName] || official.fields?.nik || "";
    if (cleanCol === "alamat") return official.alamat || official.fields?.[colName] || official.fields?.alamat || "";
    if (cleanCol === "nohp") return official.noHp || official.fields?.[colName] || official.fields?.noHp || "";
    if (cleanCol === "dusunrt" || cleanCol === "dusun") return official.dusun || official.fields?.[colName] || "";
    if (official.fields && official.fields[colName]) return official.fields[colName];
    return official[cleanCol] || "";
  };

  // Handler Buka Modal Tambah Personel
  const handleOpenAddOfficial = (cat: PersonnelCategoryConfig) => {
    const initialForm: Record<string, string> = {};
    (cat.columns || ["Nama", "Jabatan"]).forEach(col => {
      initialForm[col] = "";
    });
    setPersonnelFormData(initialForm);
    setIsAddModalOpen(true);
  };

  // Handler Buka Modal Edit Personel
  const handleOpenEditOfficial = (official: any) => {
    setEditingOfficial(official);
    const catConfig = categories.find(c => c.name.toLowerCase() === (official.category || "").toLowerCase());
    const cols = catConfig?.columns || ["Nama", "Jabatan"];
    const initialForm: Record<string, string> = {};
    cols.forEach(col => {
      initialForm[col] = getFieldValue(official, col);
    });
    setPersonnelFormData(initialForm);
    setIsEditModalOpen(true);
  };

  // Handler Simpan Tambah Personel
  const handleSaveAdd = () => {
    if (!db) return;
    const nameVal = personnelFormData["Nama"] || personnelFormData["nama"] || "";
    const jabatanVal = personnelFormData["Jabatan"] || personnelFormData["jabatan"] || "";
    if (!nameVal.trim() || !jabatanVal.trim()) {
      toast({ variant: "destructive", title: "Kolom Wajib Kosong", description: "Nama dan Jabatan wajib diisi." });
      return;
    }

    const colRef = collection(db, "personnel");
    addDocumentNonBlocking(colRef, {
      name: nameVal.toUpperCase().trim(),
      jabatan: jabatanVal.toUpperCase().trim(),
      category: activeTab,
      fields: personnelFormData,
      nip: personnelFormData["NIP"] || personnelFormData["nip"] || "",
      nik: personnelFormData["NIK"] || personnelFormData["nik"] || "",
      alamat: personnelFormData["Alamat"] || personnelFormData["alamat"] || personnelFormData["Dusun / RT"] || "",
      noHp: personnelFormData["No HP"] || personnelFormData["nohp"] || personnelFormData["noHp"] || "",
      active: true,
      createdAt: new Date().toISOString()
    });

    toast({ title: "Berhasil", description: `Personel baru ditambahkan ke tab ${activeTab}.` });
    setIsAddModalOpen(false);
    setPersonnelFormData({});
  };

  // Handler Simpan Edit Personel
  const handleSaveEdit = () => {
    if (!editingOfficial || !db) return;
    const nameVal = personnelFormData["Nama"] || personnelFormData["nama"] || editingOfficial.name || "";
    const jabatanVal = personnelFormData["Jabatan"] || personnelFormData["jabatan"] || editingOfficial.jabatan || "";

    const docRef = doc(db, "personnel", editingOfficial.id);
    setDocumentNonBlocking(docRef, {
      ...editingOfficial,
      name: nameVal.toUpperCase().trim(),
      jabatan: jabatanVal.toUpperCase().trim(),
      fields: {
        ...(editingOfficial.fields || {}),
        ...personnelFormData
      },
      nip: personnelFormData["NIP"] || personnelFormData["nip"] || editingOfficial.nip || "",
      nik: personnelFormData["NIK"] || personnelFormData["nik"] || editingOfficial.nik || "",
      alamat: personnelFormData["Alamat"] || personnelFormData["alamat"] || personnelFormData["Dusun / RT"] || editingOfficial.alamat || "",
      noHp: personnelFormData["No HP"] || personnelFormData["nohp"] || editingOfficial.noHp || "",
      updatedAt: new Date().toISOString()
    }, { merge: true });

    toast({ title: "Berhasil", description: "Data personel berhasil diperbarui." });
    setIsEditModalOpen(false);
  };

  // Handler Hapus 1 Personel
  const handleConfirmDeleteSingle = () => {
    if (!deletingOfficial || !db) return;
    const docRef = doc(db, "personnel", deletingOfficial.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Terhapus", description: "Data dihapus secara permanen." });
    setIsDeleteSingleConfirmOpen(false);
  };

  // Handler Simpan Tab Kategori Baru (Gambar 2)
  const handleSaveNewCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      toast({ variant: "destructive", title: "Judul Tab Kosong", description: "Masukkan judul tab kategori terlebih dahulu." });
      return;
    }

    if (categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast({ variant: "destructive", title: "Kategori Sudah Ada", description: `Tab dengan nama "${trimmedName}" sudah terdaftar.` });
      return;
    }

    if (newCategoryColumns.length === 0) {
      toast({ variant: "destructive", title: "Kolom Belum Ditentukan", description: "Tentukan minimal 1 kolom untuk formulir & tabel." });
      return;
    }

    const newSlug = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const newCatItem: PersonnelCategoryConfig = {
      id: newSlug,
      name: trimmedName,
      columns: newCategoryColumns,
      integrateSPPD: newIntegrateSPPD,
      integrateCetakDokumen: newIntegrateCetakDokumen,
      isDefault: false,
    };

    const updated = [...categories, newCatItem];
    if (db) {
      const docRef = doc(db, "settings", "personnel_categories");
      setDocumentNonBlocking(docRef, { categories: updated }, { merge: true });
    }

    toast({ title: "Tab Kategori Dibuat!", description: `Kategori "${trimmedName}" berhasil ditambahkan dengan ${newCategoryColumns.length} kolom.` });
    setIsAddCategoryModalOpen(false);
    setActiveTab(trimmedName);
  };

  // Handler Buka Modal Atur Kolom (Gambar 3)
  const handleOpenEditColumns = (cat: PersonnelCategoryConfig) => {
    setEditingCategory(cat);
    setEditCategoryColumns([...(cat.columns || ["Nama", "Jabatan"])]);
    setEditCustomColumnInput("");
    setEditIntegrateSPPD(cat.integrateSPPD !== false);
    setEditIntegrateCetakDokumen(cat.integrateCetakDokumen !== false);
    setIsEditColumnsModalOpen(true);
  };

  // Handler Simpan Atur Kolom (Gambar 3)
  const handleSaveEditColumns = () => {
    if (!editingCategory || !db) return;
    if (editCategoryColumns.length === 0) {
      toast({ variant: "destructive", title: "Kolom Kosong", description: "Minimal harus ada 1 kolom pada tab ini." });
      return;
    }

    const updated = categories.map(c => {
      if (c.name.toLowerCase() === editingCategory.name.toLowerCase() || c.id === editingCategory.id) {
        return {
          ...c,
          columns: editCategoryColumns,
          integrateSPPD: editIntegrateSPPD,
          integrateCetakDokumen: editIntegrateCetakDokumen
        };
      }
      return c;
    });

    const docRef = doc(db, "settings", "personnel_categories");
    setDocumentNonBlocking(docRef, { categories: updated }, { merge: true });

    toast({ title: "Kolom Berhasil Diperbarui!", description: `Rincian kolom untuk tab "${editingCategory.name}" telah disimpan.` });
    setIsEditColumnsModalOpen(false);
  };

  // Handler Hapus Tab Kustom
  const handleDeleteCustomTab = (cat: PersonnelCategoryConfig) => {
    if (cat.isDefault) {
      toast({ variant: "destructive", title: "Tab Bawaan Sistem", description: "Tab default tidak dapat dihapus." });
      return;
    }
    const updated = categories.filter(c => c.name.toLowerCase() !== cat.name.toLowerCase() && c.id !== cat.id);
    if (db) {
      const docRef = doc(db, "settings", "personnel_categories");
      setDocumentNonBlocking(docRef, { categories: updated }, { merge: true });
    }
    toast({ title: "Tab Dihapus", description: `Tab "${cat.name}" telah dihapus.` });
    setIsEditColumnsModalOpen(false);
    setActiveTab("Pemerintah Desa");
  };

  // Ekspor Excel Fleksibel Sesuai Kolom Aktif
  const handleExport = () => {
    if (!officials || officials.length === 0) return;
    const catCols = currentCategoryConfig?.columns || ["Nama", "Jabatan"];

    const exportData = sortedOfficials
      .filter(o => o.category === activeTab)
      .map(o => {
        const row: Record<string, any> = {};
        catCols.forEach(col => {
          row[col] = getFieldValue(o, col) || "-";
        });
        return row;
      });

    if (exportData.length === 0) {
      toast({ variant: "destructive", title: "Data Kosong", description: `Tidak ada data pada kategori ${activeTab} untuk diekspor.` });
      return;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Data ${activeTab.substring(0, 25)}`);
    XLSX.writeFile(wb, `Data_Personel_${activeTab.replace(/\s+/g, '_')}_sampeldes.xlsx`);
  };

  // Template Excel Fleksibel Sesuai Kolom Aktif Tab
  const handleDownloadTemplate = () => {
    const catCols = currentCategoryConfig?.columns || ["Nama", "Jabatan"];
    const rowSample1: Record<string, any> = {};
    const rowSample2: Record<string, any> = {};

    catCols.forEach(col => {
      const c = col.toLowerCase();
      if (c.includes("nama")) {
        rowSample1[col] = "BAMBANG SUDARMO, S.IP";
        rowSample2[col] = "SITI NURHALIZA, S.E";
      } else if (c.includes("jabatan")) {
        rowSample1[col] = "KEPALA DESA";
        rowSample2[col] = "SEKRETARIS DESA";
      } else if (c.includes("nip")) {
        rowSample1[col] = "19780512 200501 1 002";
        rowSample2[col] = "19820410 200802 2 004";
      } else if (c.includes("alamat")) {
        rowSample1[col] = "Jl. Raya Sampeldes No. 12 RT 01/RW 02";
        rowSample2[col] = "Dusun Sampeldes RT 03/RW 01";
      } else if (c.includes("no hp") || c.includes("telepon")) {
        rowSample1[col] = "081234567890";
        rowSample2[col] = "085712345678";
      } else {
        rowSample1[col] = `Contoh ${col} 1`;
        rowSample2[col] = `Contoh ${col} 2`;
      }
    });

    const templateData = [rowSample1, rowSample2];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `Template_${activeTab.replace(/\s+/g, '_')}.xlsx`);
    toast({
      title: "Template Terunduh",
      description: `Format Excel untuk kategori "${activeTab}" berhasil diunduh. Kolom: ${catCols.join(", ")}.`
    });
  };

  const cleanHeader = (val: any): string => {
    if (val === null || val === undefined) return "";
    return String(val).toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  const isNameHeader = (str: string): boolean => {
    return str.includes("nama") || str === "name" || str.includes("personel") || str.includes("pegawai") || str.includes("pejabat") || str.includes("aparatur") || str.includes("anggota");
  };

  const isJobHeader = (str: string): boolean => {
    return str.includes("jabatan") || str.includes("posisi") || str.includes("kedudukan") || str.includes("tugas") || str === "role" || str === "position";
  };

  const isCategoryHeader = (str: string): boolean => {
    return str.includes("kategori") || str.includes("lembaga") || str.includes("bidang") || str.includes("kelompok") || str === "category" || str.includes("instansi");
  };

  const matchCategory = (catRaw: any, defaultCat: string): string => {
    if (!catRaw) return defaultCat;
    const str = String(catRaw).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!str) return defaultCat;

    const found = categories.find(c => {
      const cNorm = c.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      return cNorm === str || str.includes(cNorm) || cNorm.includes(str);
    });

    return found ? found.name : defaultCat;
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!db) {
      toast({
        variant: "destructive",
        title: "Koneksi Belum Siap",
        description: "Layanan database belum terhubung. Silakan muat ulang halaman."
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Akses Ditolak",
        description: "Silakan login terlebih dahulu untuk mengimpor data."
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const firstSheetName = wb.SheetNames[0];
      const ws = wb.Sheets[firstSheetName];

      const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (!rawRows || rawRows.length === 0) {
        toast({ variant: "destructive", title: "File Kosong", description: "File Excel tidak memiliki data." });
        return;
      }

      let headerRowIdx = -1;
      let nameColIdx = -1;
      let jobColIdx = -1;
      let catColIdx = -1;

      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
        const row = rawRows[i];
        if (!Array.isArray(row)) continue;

        let nIdx = -1;
        let jIdx = -1;
        let cIdx = -1;

        for (let c = 0; c < row.length; c++) {
          const cleaned = cleanHeader(row[c]);
          if (cleaned) {
            if (nIdx === -1 && isNameHeader(cleaned)) nIdx = c;
            else if (jIdx === -1 && isJobHeader(cleaned)) jIdx = c;
            else if (cIdx === -1 && isCategoryHeader(cleaned)) cIdx = c;
          }
        }

        if (nIdx !== -1 && jIdx !== -1) {
          headerRowIdx = i;
          nameColIdx = nIdx;
          jobColIdx = jIdx;
          catColIdx = cIdx;
          break;
        }
      }

      const itemsToImport: any[] = [];

      if (headerRowIdx !== -1) {
        const headerRow = rawRows[headerRowIdx];
        for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!Array.isArray(row)) continue;

          const rawName = row[nameColIdx];
          const rawJob = row[jobColIdx];
          const rawCat = catColIdx !== -1 ? row[catColIdx] : null;

          const nameStr = String(rawName || "").trim();
          const jobStr = String(rawJob || "").trim();

          if (!nameStr || !jobStr) continue;
          if (isNameHeader(cleanHeader(nameStr)) && isJobHeader(cleanHeader(jobStr))) continue;

          const targetCategory = matchCategory(rawCat, activeTab);
          const fields: Record<string, string> = {};
          headerRow.forEach((h: any, colIdx: number) => {
            const hTitle = String(h || "").trim();
            if (hTitle && row[colIdx] !== undefined) {
              fields[hTitle] = String(row[colIdx] || "").trim();
            }
          });

          itemsToImport.push({
            name: nameStr.toUpperCase().trim(),
            jabatan: jobStr.toUpperCase().trim(),
            category: targetCategory,
            fields,
            nip: fields["NIP"] || fields["nip"] || "",
            alamat: fields["Alamat"] || fields["alamat"] || fields["Dusun / RT"] || "",
            noHp: fields["No HP"] || fields["nohp"] || "",
          });
        }
      } else {
        const jsonObjs: any[] = XLSX.utils.sheet_to_json(ws);
        if (jsonObjs.length > 0) {
          jsonObjs.forEach((row) => {
            const keys = Object.keys(row);
            const nKey = keys.find(k => isNameHeader(cleanHeader(k)));
            const jKey = keys.find(k => isJobHeader(cleanHeader(k)));
            const cKey = keys.find(k => isCategoryHeader(cleanHeader(k)));

            const nameValue = nKey ? row[nKey] : null;
            const jobValue = jKey ? row[jKey] : null;
            const catValue = cKey ? row[cKey] : null;

            if (nameValue && jobValue) {
              const nameStr = String(nameValue).trim();
              const jobStr = String(jobValue).trim();
              if (nameStr && jobStr) {
                itemsToImport.push({
                  name: nameStr.toUpperCase().trim(),
                  jabatan: jobStr.toUpperCase().trim(),
                  category: matchCategory(catValue, activeTab),
                  fields: row
                });
              }
            }
          });
        }
      }

      if (itemsToImport.length === 0) {
        toast({
          variant: "destructive",
          title: "Format Tidak Dikenali",
          description: "Pastikan file Excel memiliki kolom 'Nama' dan 'Jabatan'. Anda dapat mengunduh contoh Template terlebih dahulu."
        });
        return;
      }

      const colRef = collection(db, "personnel");
      const BATCH_SIZE = 400;
      let savedCount = 0;

      for (let i = 0; i < itemsToImport.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = itemsToImport.slice(i, i + BATCH_SIZE);

        chunk.forEach((item) => {
          const newDocRef = doc(colRef);
          batch.set(newDocRef, {
            name: item.name,
            jabatan: item.jabatan,
            category: item.category,
            fields: item.fields || {},
            nip: item.nip || "",
            alamat: item.alamat || "",
            noHp: item.noHp || "",
            active: true,
            createdAt: new Date().toISOString()
          });
        });

        await batch.commit();
        savedCount += chunk.length;
      }

      toast({
        title: "Impor Berhasil Tersimpan",
        description: `Sukses menyimpan ${savedCount} data personel ke database.`
      });

    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        variant: "destructive",
        title: "Gagal Mengimpor Excel",
        description: error?.message || "Terjadi kesalahan saat memproses file Excel."
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAll = async () => {
    if (!db || !user) return;
    setIsProcessing(true);
    try {
      const q = collection(db, "personnel");
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;

      const BATCH_SIZE = 400;
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        docs.slice(i, i + BATCH_SIZE).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      toast({ title: "Database Dikosongkan", description: "Seluruh data personel berhasil dihapus permanen." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Mengosongkan", description: err.message });
    } finally {
      setIsProcessing(false);
      setShowDeleteAllConfirm(false);
    }
  };

  if (isDataLoading || isCategoriesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sinkronisasi Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto pb-24 font-sans">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/manajemen/dashboard"
            className="rounded-2xl h-11 w-11 bg-white dark:bg-[#081d27] shadow-sm border border-white/70 text-slate-800 flex items-center justify-center hover:text-emerald-700 active:scale-95 transition-all shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-condensed font-extrabold uppercase text-slate-900 tracking-tight">Data Perangkat & Lembaga Desa</h1>
            <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">Manajemen Aparatur Pemerintah, BPD, RT/RW, dan Lembaga Kemasyarakatan</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {/* Tombol Plus (+) Tambah Tab Kategori Baru */}
          <button
            type="button"
            className="h-10 rounded-xl gap-2 font-condensed font-black text-xs uppercase bg-[#0e1620] hover:bg-slate-900 text-amber-300 shadow-sm border border-white/10 px-4 flex items-center active:scale-95 transition-all disabled:opacity-50"
            onClick={() => {
              setNewCategoryName("");
              setNewCategoryColumns(["Nama", "Jabatan", "Alamat"]);
              setNewCustomColumnInput("");
              setNewIntegrateSPPD(true);
              setNewIntegrateCetakDokumen(true);
              setIsAddCategoryModalOpen(true);
            }}
            disabled={isProcessing}
            title="Tambah Tab / Kategori Baru"
          >
            <Plus className="h-4 w-4" /> Tambah Tab / Kategori
          </button>
          <button
            type="button"
            className="h-10 rounded-xl gap-2 font-condensed font-black text-xs uppercase text-rose-700 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 shadow-xs px-3.5 flex items-center active:scale-95 transition-all disabled:opacity-50"
            onClick={() => setShowDeleteAllConfirm(true)}
            disabled={isProcessing}
          >
            <Trash2 className="h-3.5 w-3.5" /> Hapus Semua
          </button>
        </div>
      </header>

      <section className="grid gap-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            placeholder="Cari nama, jabatan, NIP, atau rincian lainnya..."
            className="w-full pl-11 pr-4 h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full h-auto p-1.5 bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex flex-row overflow-x-auto no-scrollbar md:flex-wrap rounded-2xl text-stone-600">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.name}
                value={cat.name}
                className="flex-shrink-0 px-4 py-2.5 text-[10px] sm:text-xs font-condensed font-black uppercase md:flex-1 md:min-w-[110px] rounded-xl data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 text-stone-600 hover:text-slate-900 transition-all"
              >
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => (
            <TabsContent key={cat.name} value={cat.name} className="mt-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-condensed font-extrabold uppercase text-slate-900 tracking-tight">{cat.name}</h3>
                  {cat.integrateSPPD && (
                    <span className="text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full text-emerald-800 bg-emerald-600/10 border border-emerald-600/20 shadow-inner">
                      SPPD
                    </span>
                  )}
                  {cat.integrateCetakDokumen && (
                    <span className="text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full text-sky-800 bg-sky-600/10 border border-sky-600/20 shadow-inner">
                      Cetak Dokumen
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx, .xls, .csv" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="h-10 px-3.5 rounded-xl gap-2 font-condensed font-black text-xs uppercase bg-white dark:bg-[#081d27] shadow-sm border border-white/70 text-slate-800 hover:text-emerald-700 active:scale-95 transition-all flex items-center disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-600" /> : <Upload className="h-3.5 w-3.5 text-emerald-700" />}
                    {isProcessing ? "Menyimpan..." : "Impor Excel"}
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={isProcessing}
                    className="h-10 px-3.5 rounded-xl gap-2 font-condensed font-black text-xs uppercase bg-white dark:bg-[#081d27] shadow-sm border border-white/70 text-slate-800 hover:text-emerald-700 active:scale-95 transition-all flex items-center disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5 text-stone-600" /> Ekspor
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={isProcessing}
                    title="Unduh contoh template format Excel"
                    className="h-10 px-3.5 rounded-xl gap-2 font-condensed font-black text-xs uppercase bg-emerald-600/10 text-emerald-800 border border-emerald-600/20 shadow-sm active:scale-95 transition-all flex items-center disabled:opacity-50"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" /> Template
                  </button>

                  {/* Tombol Atur Kolom */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditColumns(cat)}
                    disabled={isProcessing}
                    className="h-10 px-3.5 rounded-xl gap-2 font-condensed font-black text-xs uppercase bg-white dark:bg-[#081d27] shadow-sm border border-white/70 text-slate-800 hover:text-indigo-700 active:scale-95 transition-all flex items-center disabled:opacity-50"
                    title={`Sesuaikan rincian kolom tab ${cat.name}`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-700" /> Atur Kolom
                  </button>

                  {/* Tombol Tambah Personel */}
                  <button
                    type="button"
                    onClick={() => handleOpenAddOfficial(cat)}
                    disabled={isProcessing}
                    className="h-10 px-4 gap-2 text-xs font-condensed font-black uppercase bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm rounded-xl flex items-center active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah {cat.name}
                  </button>
                </div>
              </div>

              {/* Grid Card Personel */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedOfficials
                  .filter(o => o.category === cat.name)
                  .map((official) => {
                    const extraColumns = (cat.columns || [])
                      .filter(c => !["nama", "jabatan"].includes(c.toLowerCase()));

                    return (
                      <div
                        key={official.id}
                        className="bg-white dark:bg-[#081d27] shadow-md border border-white/60 rounded-3xl p-5 flex flex-col justify-between hover:scale-[1.01] active:scale-[0.99] transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="w-fit px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black text-emerald-800 border border-emerald-600/20 bg-emerald-600/10 shadow-inner">
                              {official.jabatan}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="h-8 w-8 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/70 flex items-center justify-center text-stone-600 hover:text-slate-900 active:scale-95 shrink-0">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl font-black uppercase text-[10px] p-2 bg-white dark:bg-[#081d27] shadow-md border border-white/70">
                                <DropdownMenuItem className="rounded-xl cursor-pointer hover:bg-white/40" onClick={() => handleOpenEditOfficial(official)}>
                                  <Edit className="mr-2 h-4 w-4 text-emerald-700" /> Edit Data
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-rose-600 rounded-xl cursor-pointer hover:bg-rose-50" onClick={() => {
                                  setDeletingOfficial(official);
                                  setIsDeleteSingleConfirmOpen(true);
                                }}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Hapus Permanen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <h4 className="text-base font-black truncate text-slate-900 font-condensed">{official.name}</h4>

                          {/* Rincian Kolom Tambahan Dinamis */}
                          {extraColumns.length > 0 && (
                            <div className="space-y-1.5 pt-3 mt-3 border-t border-stone-300/40">
                              {extraColumns.map(col => {
                                const val = getFieldValue(official, col);
                                if (!val) return null;
                                return (
                                  <div key={col} className="flex items-center justify-between text-[11px] gap-2">
                                    <span className="text-stone-500 font-bold uppercase tracking-wider text-[9px] truncate max-w-[90px]">{col}:</span>
                                    <span className="text-slate-800 font-bold truncate text-right">{val}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 text-[10px] text-stone-500 uppercase font-bold border-t border-stone-300/40">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-emerald-700/60" />
                            <span className="font-mono text-[9px]">ID: {official.id.substring(0, 6)}...</span>
                          </div>
                          <span className="text-[9px] text-emerald-700 font-black">Aktif</span>
                        </div>
                      </div>
                    );
                  })}
                {sortedOfficials.filter(o => o.category === cat.name).length === 0 && (
                  <div className="col-span-full py-20 text-center rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40">
                    <p className="font-black text-xs uppercase tracking-widest text-stone-400">Belum ada data di kategori {cat.name}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH TAB / KATEGORI BARU                                       */}
      {/* ========================================================================= */}
      <Dialog open={isAddCategoryModalOpen} onOpenChange={setIsAddCategoryModalOpen}>
        <DialogContent className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 p-6 sm:p-8 max-w-xl max-h-[92vh] overflow-y-auto text-slate-900">
          <DialogHeader className="space-y-2 pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white dark:bg-[#081d27] shadow-xs border border-white/60 text-emerald-800 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase text-slate-900 tracking-tight">Tambah Tab / Kategori Baru</DialogTitle>
                <p className="text-xs text-stone-600 font-medium">Isi judul tab dan tentukan kolom data yang ingin ditambahkan (kondisional per tab).</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* 1. ISI JUDUL TAB */}
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase text-stone-700 tracking-wider">1. Isi Judul Tab</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Contoh: Karang Taruna, Linmas, BPD, Posyandu..."
                className="h-13 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
              />
            </div>

            {/* 2. ATUR KOLOM / ISIAN FORM */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-black uppercase text-stone-700 tracking-wider">2. Atur Kolom / Isian Form</Label>
                <span className="text-[10px] font-bold text-stone-500 uppercase">{newCategoryColumns.length} kolom dipilih</span>
              </div>

              {/* KLIK (+) KOLOM CEPAT */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider block">Klik (+) Kolom Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_COLUMNS.map(col => {
                    const isSelected = newCategoryColumns.some(c => c.toLowerCase() === col.toLowerCase());
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          if (!isSelected) setNewCategoryColumns(prev => [...prev, col]);
                        }}
                        disabled={isSelected}
                        className={cn(
                          "h-8 px-3 rounded-xl text-[11px] font-bold uppercase transition-all flex items-center gap-1",
                          isSelected
                            ? "bg-white dark:bg-[#081d27] text-stone-400 shadow-inner border border-stone-300/30 cursor-not-allowed opacity-60"
                            : "bg-white dark:bg-[#081d27] text-slate-800 shadow-sm border border-white/70 hover:shadow-xs active:scale-95"
                        )}
                      >
                        <span className="text-emerald-700 font-extrabold">+</span> {col}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* INPUT KOLOM KUSTOM */}
              <div className="flex gap-2 pt-1">
                <Input
                  value={newCustomColumnInput}
                  onChange={(e) => setNewCustomColumnInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = newCustomColumnInput.trim();
                      if (val && !newCategoryColumns.some(c => c.toLowerCase() === val.toLowerCase())) {
                        setNewCategoryColumns(prev => [...prev, val]);
                        setNewCustomColumnInput("");
                      }
                    }
                  }}
                  placeholder="Ketik nama kolom kustom lain (misal: Unit Kerja, No SK, Golongan...)"
                  className="h-11 rounded-xl text-xs bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-3"
                />
                <Button
                  type="button"
                  onClick={() => {
                    const val = newCustomColumnInput.trim();
                    if (val && !newCategoryColumns.some(c => c.toLowerCase() === val.toLowerCase())) {
                      setNewCategoryColumns(prev => [...prev, val]);
                      setNewCustomColumnInput("");
                    }
                  }}
                  className="h-11 rounded-xl px-4 text-xs font-black uppercase bg-white dark:bg-[#081d27] shadow-sm border border-white/70 text-slate-800 hover:bg-[#e4e0d9] gap-1.5 shrink-0"
                >
                  <Plus className="h-4 w-4 text-emerald-700" /> Tambah
                </Button>
              </div>

              {/* DAFTAR URUTAN KOLOM FORMULIR & TABEL */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-2">
                <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider block">Urutan Kolom Formulir & Tabel:</span>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {newCategoryColumns.map((col, idx) => (
                    <span
                      key={col}
                      className="bg-white dark:bg-[#081d27] shadow-sm border border-white/70 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 flex items-center gap-2"
                    >
                      <span>{idx + 1}. <strong className="font-extrabold">{col}</strong></span>
                      <button
                        type="button"
                        onClick={() => setNewCategoryColumns(prev => prev.filter((_, i) => i !== idx))}
                        className="text-stone-400 hover:text-rose-600 transition-colors ml-0.5"
                        title={`Hapus kolom ${col}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                  {newCategoryColumns.length === 0 && (
                    <p className="text-xs text-rose-600 font-bold">Belum ada kolom dipilih. Klik tombol cepat di atas.</p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. INTEGRASI MENU PILIHAN */}
            <div className="space-y-2.5">
              <Label className="text-[11px] font-black uppercase text-stone-700 tracking-wider">3. Integrasi Menu Pilihan</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Switch SPPD */}
                <div className={cn(
                  "p-4 rounded-2xl border transition-all flex items-center justify-between gap-3",
                  newIntegrateSPPD
                    ? "bg-white dark:bg-[#081d27] shadow-md border-emerald-600/40"
                    : "bg-white dark:bg-[#081d27] shadow-sm border-white/60"
                )}>
                  <div className="space-y-0.5">
                    <span className="text-xs font-black uppercase text-slate-900 block">Masuk ke SPPD</span>
                    <p className="text-[10px] text-stone-500 font-medium leading-snug">Muncul di pilihan Lembaga/Jabatan menu /sppd/</p>
                  </div>
                  <Switch checked={newIntegrateSPPD} onCheckedChange={setNewIntegrateSPPD} />
                </div>

                {/* Switch Cetak Dokumen */}
                <div className={cn(
                  "p-4 rounded-2xl border transition-all flex items-center justify-between gap-3",
                  newIntegrateCetakDokumen
                    ? "bg-white dark:bg-[#081d27] shadow-md border-emerald-600/40"
                    : "bg-white dark:bg-[#081d27] shadow-sm border-white/60"
                )}>
                  <div className="space-y-0.5">
                    <span className="text-xs font-black uppercase text-slate-900 block">Masuk ke Cetak Dokumen</span>
                    <p className="text-[10px] text-stone-500 font-medium leading-snug">Muncul di pilihan peserta /dokumen-penunjang/</p>
                  </div>
                  <Switch checked={newIntegrateCetakDokumen} onCheckedChange={setNewIntegrateCetakDokumen} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t border-stone-300/40">
            <Button
              type="button"
              onClick={() => setIsAddCategoryModalOpen(false)}
              className="h-12 rounded-2xl px-6 font-bold uppercase bg-white dark:bg-[#081d27] text-stone-700 shadow-sm border border-white/70 hover:bg-[#e4e0d9]"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSaveNewCategory}
              className="h-12 rounded-2xl px-8 font-black uppercase text-white bg-emerald-800 hover:bg-emerald-900 shadow-sm flex-1 sm:flex-initial"
            >
              Simpan & Buat Tab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: ATUR KOLOM: {NAMA_TAB}                                           */}
      {/* ========================================================================= */}
      <Dialog open={isEditColumnsModalOpen} onOpenChange={setIsEditColumnsModalOpen}>
        <DialogContent className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 p-6 sm:p-8 max-w-xl max-h-[92vh] overflow-y-auto text-slate-900">
          <DialogHeader className="space-y-2 pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white dark:bg-[#081d27] shadow-xs border border-white/60 text-emerald-800 flex items-center justify-center">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase text-slate-900 tracking-tight">
                  Atur Kolom: {editingCategory?.name}
                </DialogTitle>
                <p className="text-xs text-stone-600 font-medium">
                  Tambah atau kurangi rincian kolom isian formulir & tabel pada tab {editingCategory?.name}.
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* TAMBAH KOLOM CEPAT */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider block">Tambah Kolom Cepat (+):</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_COLUMNS.map(col => {
                  const isSelected = editCategoryColumns.some(c => c.toLowerCase() === col.toLowerCase());
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => {
                        if (!isSelected) setEditCategoryColumns(prev => [...prev, col]);
                      }}
                      disabled={isSelected}
                      className={cn(
                        "h-8 px-3 rounded-xl text-[11px] font-bold uppercase transition-all flex items-center gap-1",
                        isSelected
                          ? "bg-white dark:bg-[#081d27] text-stone-400 shadow-inner border border-stone-300/30 cursor-not-allowed opacity-60"
                          : "bg-white dark:bg-[#081d27] text-slate-800 shadow-sm border border-white/70 hover:shadow-xs active:scale-95"
                      )}
                    >
                      <span className="text-emerald-700 font-extrabold">+</span> {col}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ATAU KETIK NAMA KOLOM KUSTOM */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider block">Atau Ketik Nama Kolom Kustom:</span>
              <div className="flex gap-2">
                <Input
                  value={editCustomColumnInput}
                  onChange={(e) => setEditCustomColumnInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = editCustomColumnInput.trim();
                      if (val && !editCategoryColumns.some(c => c.toLowerCase() === val.toLowerCase())) {
                        setEditCategoryColumns(prev => [...prev, val]);
                        setEditCustomColumnInput("");
                      }
                    }
                  }}
                  placeholder="Contoh: Unit Kerja, No SK, Golongan..."
                  className="h-11 rounded-xl text-xs bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-3"
                />
                <Button
                  type="button"
                  onClick={() => {
                    const val = editCustomColumnInput.trim();
                    if (val && !editCategoryColumns.some(c => c.toLowerCase() === val.toLowerCase())) {
                      setEditCategoryColumns(prev => [...prev, val]);
                      setEditCustomColumnInput("");
                    }
                  }}
                  className="h-11 rounded-xl px-4 text-xs font-black uppercase bg-white dark:bg-[#081d27] shadow-sm border border-white/70 text-slate-800 hover:bg-[#e4e0d9] gap-1.5 shrink-0"
                >
                  <Plus className="h-4 w-4 text-emerald-700" /> Tambah
                </Button>
              </div>
            </div>

            {/* DAFTAR RINCIAN KOLOM AKTIF */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider block">
                  Daftar Rincian Kolom Aktif ({editCategoryColumns.length}):
                </span>
                <span className="text-[9px] font-bold text-stone-400 uppercase">Klik (x) untuk mengurangi</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {editCategoryColumns.map((col, idx) => (
                  <span
                    key={col}
                    className="bg-white dark:bg-[#081d27] shadow-sm border border-white/70 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 flex items-center gap-2"
                  >
                    <span>{idx + 1}. <strong className="font-extrabold">{col}</strong></span>
                    <button
                      type="button"
                      onClick={() => setEditCategoryColumns(prev => prev.filter((_, i) => i !== idx))}
                      className="text-stone-400 hover:text-rose-600 transition-colors ml-0.5"
                      title={`Hapus kolom ${col}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                {editCategoryColumns.length === 0 && (
                  <p className="text-xs text-rose-600 font-bold">Minimal harus ada 1 kolom.</p>
                )}
              </div>
            </div>

            {/* PENGATURAN INTEGRASI MENU PILIHAN */}
            <div className="space-y-2.5">
              <Label className="text-[11px] font-black uppercase text-stone-700 tracking-wider">Pengaturan Integrasi Menu Pilihan</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={cn(
                  "p-4 rounded-2xl border transition-all flex items-center justify-between gap-3",
                  editIntegrateSPPD
                    ? "bg-white dark:bg-[#081d27] shadow-md border-emerald-600/40"
                    : "bg-white dark:bg-[#081d27] shadow-sm border-white/60"
                )}>
                  <div className="space-y-0.5">
                    <span className="text-xs font-black uppercase text-slate-900 block">Masuk ke SPPD</span>
                    <p className="text-[10px] text-stone-500 font-medium leading-snug">Muncul di pilihan Lembaga/Jabatan menu /sppd/</p>
                  </div>
                  <Switch checked={editIntegrateSPPD} onCheckedChange={setEditIntegrateSPPD} />
                </div>

                <div className={cn(
                  "p-4 rounded-2xl border transition-all flex items-center justify-between gap-3",
                  editIntegrateCetakDokumen
                    ? "bg-white dark:bg-[#081d27] shadow-md border-emerald-600/40"
                    : "bg-white dark:bg-[#081d27] shadow-sm border-white/60"
                )}>
                  <div className="space-y-0.5">
                    <span className="text-xs font-black uppercase text-slate-900 block">Masuk ke Cetak Dokumen</span>
                    <p className="text-[10px] text-stone-500 font-medium leading-snug">Muncul di pilihan peserta /dokumen-penunjang/</p>
                  </div>
                  <Switch checked={editIntegrateCetakDokumen} onCheckedChange={setEditIntegrateCetakDokumen} />
                </div>
              </div>
            </div>

            {/* Opsi Hapus Tab (khusus tab kustom buatan admin) */}
            {editingCategory && !editingCategory.isDefault && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-rose-300/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-700 uppercase">Hapus Kategori Tab Ini?</span>
                  <p className="text-[10px] text-stone-500">Menghapus tab &quot;{editingCategory.name}&quot; dari daftar kategori desa.</p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteCustomTab(editingCategory)}
                  className="rounded-xl font-bold uppercase text-[10px] h-9 shadow-sm"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus Tab
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t border-stone-300/40">
            <Button
              type="button"
              onClick={() => setIsEditColumnsModalOpen(false)}
              className="h-12 rounded-2xl px-6 font-bold uppercase bg-white dark:bg-[#081d27] text-stone-700 shadow-sm border border-white/70 hover:bg-[#e4e0d9]"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSaveEditColumns}
              className="h-12 rounded-2xl px-8 font-black uppercase text-white bg-emerald-800 hover:bg-emerald-900 shadow-sm flex-1 sm:flex-initial"
            >
              Simpan Perubahan Kolom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: TAMBAH PERSONEL DINAMIS                                          */}
      {/* ========================================================================= */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 p-6 sm:p-8 max-w-md max-h-[92vh] overflow-y-auto text-slate-900">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-black uppercase text-lg text-emerald-900">Tambah Personel</DialogTitle>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{activeTab}</p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(currentCategoryConfig?.columns || ["Nama", "Jabatan"]).map((col) => (
              <div key={col} className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-stone-700 ml-1">
                  {col} {["Nama", "Jabatan"].includes(col) && <span className="text-rose-600">*</span>}
                </Label>
                <Input
                  value={personnelFormData[col] || ""}
                  onChange={(e) => setPersonnelFormData(prev => ({ ...prev, [col]: e.target.value }))}
                  placeholder={`Masukkan ${col}...`}
                  className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleSaveAdd} className="w-full h-12 rounded-2xl font-black uppercase text-white bg-emerald-800 hover:bg-emerald-900 shadow-sm active:scale-95 transition-all">
              Simpan Personel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT PERSONEL DINAMIS                                           */}
      {/* ========================================================================= */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 p-6 sm:p-8 max-w-md max-h-[92vh] overflow-y-auto text-slate-900">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-black uppercase text-lg text-emerald-900">Edit Data Personel</DialogTitle>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{editingOfficial?.category || activeTab}</p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(currentCategoryConfig?.columns || ["Nama", "Jabatan"]).map((col) => (
              <div key={col} className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-stone-700 ml-1">
                  {col} {["Nama", "Jabatan"].includes(col) && <span className="text-rose-600">*</span>}
                </Label>
                <Input
                  value={personnelFormData[col] ?? ""}
                  onChange={(e) => setPersonnelFormData(prev => ({ ...prev, [col]: e.target.value }))}
                  placeholder={`Masukkan ${col}...`}
                  className="h-12 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit} className="w-full h-12 rounded-2xl font-black uppercase text-white bg-emerald-800 hover:bg-emerald-900 shadow-sm active:scale-95 transition-all">
              Perbarui Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single Alert */}
      <Dialog open={isDeleteSingleConfirmOpen} onOpenChange={setIsDeleteSingleConfirmOpen}>
        <DialogContent className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 p-8 max-w-xs text-center text-slate-900">
          <DialogHeader className="items-center">
            <div className="h-16 w-16 rounded-full bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center mb-2">
              <AlertTriangle className="h-8 w-8 text-rose-600" />
            </div>
            <DialogTitle className="font-black uppercase text-rose-600 tracking-wide">Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-xs font-bold uppercase text-stone-600 leading-relaxed">Hapus <strong>{deletingOfficial?.name}</strong> dari database secara permanen?</p>
          </div>
          <DialogFooter className="flex-col gap-2">
            <Button variant="destructive" onClick={handleConfirmDeleteSingle} className="w-full h-12 rounded-2xl font-black uppercase shadow-sm active:scale-95">
              Ya, Hapus Data
            </Button>
            <Button onClick={() => setIsDeleteSingleConfirmOpen(false)} className="w-full h-12 rounded-2xl font-bold uppercase bg-white dark:bg-[#081d27] text-stone-700 shadow-sm border border-white/70 hover:bg-[#e4e0d9]">Batal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Alert */}
      <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <AlertDialogContent className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 p-8 text-slate-900">
          <AlertDialogHeader className="items-center text-center">
            <div className="h-20 w-20 rounded-full bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center mb-4">
              <Trash2 className="h-10 w-10 text-rose-600" />
            </div>
            <AlertDialogTitle className="text-xl font-black uppercase text-rose-600">Hapus Seluruh Database?</AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-xs uppercase text-stone-600 leading-relaxed">
              Tindakan ini akan menghapus SEMUA data personel di seluruh kategori dari Firestore. Pastikan Anda sudah memiliki cadangan (Ekspor Excel).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-6">
            <AlertDialogCancel className="h-12 rounded-2xl font-bold uppercase w-full bg-white dark:bg-[#081d27] text-stone-700 shadow-sm border border-white/70 hover:bg-[#e4e0d9]">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="h-12 rounded-2xl font-black uppercase bg-rose-600 hover:bg-rose-700 text-white shadow-sm w-full" disabled={isProcessing}>
              {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Ya, Hapus Semua"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

