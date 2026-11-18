"use client"

import React, { useState, useEffect, useRef } from "react"
import imageCompression from "browser-image-compression"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ImagePlus, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CLOUDINARY_CONFIG, getOptimizedCloudinaryUrl } from "@/lib/cloudinary-config"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ImageUploaderProps {
  onUploadComplete?: (urls: string[]) => void
  onUrlsChange?: (urls: string[]) => void
  onActiveImagesChange?: (images: Array<File | string>) => void
  initialUrls?: string[]
  label: string
  folder?: string
  maxFiles?: number
}

interface UploadingFile {
  id: string
  file: File
  preview: string
  progress: number
  status: 'idle' | 'compressing' | 'uploading' | 'success' | 'error'
  resultUrl?: string
}

export function ImageUploader({ 
  onUploadComplete, 
  onUrlsChange, 
  onActiveImagesChange,
  initialUrls = [], 
  label, 
  folder = "dokumen-kegiatan",
  maxFiles = 5 
}: ImageUploaderProps) {
  const [files, setFiles] = useState<UploadingFile[]>([])
  const filesRef = useRef<UploadingFile[]>([])
  filesRef.current = files
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [isOverallLoading, setIsOverallLoading] = useState(false)
  const initialUrlsKey = (initialUrls || []).join("|")
  const prevKeyRef = useRef<string>("")

  const emitActiveImages = (items: UploadingFile[]) => {
    const active = items.map(f => {
      if (f.file && f.file.size > 0) return f.file;
      if (f.resultUrl) return f.resultUrl;
      return f.preview;
    });
    onActiveImagesChange?.(active);
  };

  // Sinkronisasi initialUrls saat pertama mount atau saat berganti kegiatan
  useEffect(() => {
    if (initialUrlsKey !== prevKeyRef.current) {
      prevKeyRef.current = initialUrlsKey;
      if (initialUrls && initialUrls.length > 0) {
        const initialItems: UploadingFile[] = initialUrls.map(url => ({
          id: Math.random().toString(36).substring(7),
          file: new File([], "image.jpg"),
          preview: url,
          progress: 100,
          status: 'success',
          resultUrl: url
        }));
        setFiles(initialItems);
        filesRef.current = initialItems;
        emitActiveImages(initialItems);
      } else if (!isOverallLoading) {
        setFiles([]);
        filesRef.current = [];
        emitActiveImages([]);
      }
    }
  }, [initialUrlsKey, initialUrls, isOverallLoading]);

  const uploadFile = async (item: UploadingFile): Promise<string | null> => {
    try {
      // 1. Kompresi gambar
      updateFileStatus(item.id, { status: 'compressing', progress: 15 });
      const compressionOptions = {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: 'image/webp'
      };
      const compressedFile = await imageCompression(item.file, compressionOptions);

      // 2. Upload ke Cloudinary via XHR (untuk tracking progress)
      updateFileStatus(item.id, { status: 'uploading', progress: 30 });
      const formData = new FormData();
      
      const cleanBaseName = (item.file?.name || 'foto')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 30);
      const uniqueFilename = `${cleanBaseName}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`;

      formData.append("file", compressedFile, uniqueFilename);
      formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
      formData.append("folder", folder || "dokumen-kegiatan");

      const xhr = new XMLHttpRequest();
      const uploadResult = await new Promise<string>((resolve, reject) => {
        xhr.open("POST", CLOUDINARY_CONFIG.baseUrl, true);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 65) + 35;
            updateFileStatus(item.id, { progress: percent });
          }
        };

        xhr.onload = () => {
          try {
            const response = JSON.parse(xhr.responseText);
            if (xhr.status === 200) {
              const optimized = getOptimizedCloudinaryUrl(response.secure_url);
              updateFileStatus(item.id, { status: 'success', progress: 100, resultUrl: optimized, preview: optimized });
              resolve(optimized);
            } else {
              reject(new Error(response.error?.message || "Upload gagal"));
            }
          } catch (e) {
            reject(new Error("Respon server tidak valid"));
          }
        };

        xhr.onerror = () => reject(new Error("Koneksi internet terputus"));
        xhr.send(formData);
      });

      return uploadResult;
    } catch (err: any) {
      console.error("Upload error:", err);
      updateFileStatus(item.id, { status: 'error', progress: 0 });
      toast({
        variant: "destructive",
        title: "Upload Foto Gagal",
        description: `${item.file.name}: ${err.message}`
      });
      return null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (filesRef.current.length + selectedFiles.length > maxFiles) {
      toast({ variant: "destructive", title: "Batas Foto Terlampaui", description: `Maksimal ${maxFiles} foto per kategori.` });
      return;
    }

    const newItems: UploadingFile[] = selectedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'idle'
    }));

    const combinedFiles = [...filesRef.current, ...newItems];
    setFiles(combinedFiles);
    filesRef.current = combinedFiles;
    emitActiveImages(combinedFiles);

    if (fileInputRef.current) fileInputRef.current.value = "";

    // Otomatis langsung jalankan upload untuk file-file baru
    setIsOverallLoading(true);
    const uploadedUrls: string[] = [];

    for (const item of newItems) {
      const url = await uploadFile(item);
      if (url) uploadedUrls.push(url);
    }

    setIsOverallLoading(false);

    // Kumpulkan semua URL yang sukses dari filesRef.current terkini atau dari uploadedUrls
    const currentSuccessUrls = filesRef.current
      .filter(f => (f.status === 'success' || f.resultUrl) && f.resultUrl)
      .map(f => f.resultUrl as string);

    const finalSuccessUrls = currentSuccessUrls.length > 0 ? currentSuccessUrls : uploadedUrls;

    // Update tracker key agar useEffect tidak menimpa ulang state
    prevKeyRef.current = finalSuccessUrls.join("|");

    // Panggil callback parent DI LUAR setFiles agar tidak memicu setState-in-render
    onUrlsChange?.(finalSuccessUrls);
    onUploadComplete?.(finalSuccessUrls);
    emitActiveImages(filesRef.current);

    if (uploadedUrls.length > 0) {
      toast({ title: "Foto Berhasil Diupload", description: `${uploadedUrls.length} foto siap dicetak dan disimpan.` });
    }
  };

  const removeFile = (id: string) => {
    const target = filesRef.current.find(f => f.id === id);
    if (target && !target.resultUrl) {
      URL.revokeObjectURL(target.preview);
    }
    const filtered = filesRef.current.filter(f => f.id !== id);
    filesRef.current = filtered;
    setFiles(filtered);

    const remainingUrls = filtered
      .filter(f => f.status === 'success' && f.resultUrl)
      .map(f => f.resultUrl as string);

    // Update tracker key
    prevKeyRef.current = remainingUrls.join("|");

    // Panggil callback parent DI LUAR setFiles
    onUrlsChange?.(remainingUrls);
    onUploadComplete?.(remainingUrls);
    emitActiveImages(filtered);
  };

  const clearAllFiles = () => {
    filesRef.current.forEach(f => {
      if (!f.resultUrl) URL.revokeObjectURL(f.preview);
    });
    filesRef.current = [];
    setFiles([]);
    prevKeyRef.current = "";
    onUrlsChange?.([]);
    onUploadComplete?.([]);
    emitActiveImages([]);
  };

  const updateFileStatus = (id: string, updates: Partial<UploadingFile>) => {
    filesRef.current = filesRef.current.map(f => f.id === id ? { ...f, ...updates } : f);
    setFiles([...filesRef.current]);
  };

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase text-primary tracking-widest">{label}</label>
        {files.length > 0 && (
          <button
            type="button"
            onClick={clearAllFiles}
            disabled={isOverallLoading}
            className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors uppercase"
          >
            Hapus Semua ({files.length})
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {files.map((item) => (
          <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 group bg-slate-50 shadow-xs">
            <Image 
              src={item.preview} 
              alt="Preview" 
              fill 
              className={cn("object-cover transition-all", (item.status === 'uploading' || item.status === 'compressing') && "opacity-40 grayscale")}
              unoptimized 
            />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 pointer-events-none">
              {item.status === 'compressing' && (
                <div className="bg-black/50 backdrop-blur-sm rounded-full p-2 animate-pulse">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
              {item.status === 'uploading' && (
                <div className="w-full space-y-2 px-2">
                  <Progress value={item.progress} className="h-1.5 bg-white/30" />
                  <p className="text-[9px] font-black text-white text-center uppercase drop-shadow-md">{item.progress}%</p>
                </div>
              )}
              {item.status === 'success' && (
                <div className="bg-emerald-500/90 rounded-full p-1 shadow-md opacity-80 group-hover:opacity-100 transition-opacity">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              )}
              {item.status === 'error' && (
                <div className="bg-red-500/90 rounded-full p-1 shadow-md">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            {/* Tombol Hapus X Selalu Muncul (Termasuk Foto Lama/Sukses) Selama Tidak Sedang Uploading */}
            {item.status !== 'uploading' && item.status !== 'compressing' && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(item.id);
                }}
                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-all z-10"
                title="Hapus foto ini"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}

        {files.length < maxFiles && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group text-center p-2",
              isOverallLoading && "opacity-50 pointer-events-none"
            )}
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <ImagePlus className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[9px] font-black uppercase text-slate-700 tracking-tight">Tambah Foto</span>
            <span className="text-[8px] text-muted-foreground font-medium">Otomatis Upload</span>
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        multiple 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  )
}
