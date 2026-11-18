'use client';
import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Landmark, User, MapPin, UploadCloud, FileCheck, Paperclip } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SubmissionSuccess } from '../submission-success';
import { addSubmission } from '@/lib/submissions';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getResidentByNik } from '@/lib/residents';
import { cn, formatDbDateToForm } from '@/lib/utils';

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
};

interface GoogleFileUploaderProps {
  label: string;
  onFileSelect: (file: File, fieldName: string) => void;
  fieldName: string;
  isRequired?: boolean;
  disabled?: boolean;
}

function GoogleFileUploader({ label, onFileSelect, fieldName, isRequired, disabled }: GoogleFileUploaderProps) {
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file, fieldName);
    }
  };

  return (
    <FormItem className="flex flex-col">
      <FormLabel className="text-sm font-medium text-slate-700">
        {label} {isRequired && <span className="text-destructive">*</span>}
      </FormLabel>
      <div className="flex items-center gap-2">
        <label
          className={cn(
            'flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary transition-all duration-200',
            disabled && 'opacity-50 cursor-not-allowed bg-slate-100 hover:bg-slate-100'
          )}
        >
          <Paperclip className="h-4 w-4 text-slate-500" />
          <span>Pilih File</span>
          <input
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            disabled={disabled}
          />
        </label>
        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
          {fileName || 'Belum ada file dipilih'}
        </span>
      </div>
      <FormMessage />
    </FormItem>
  );
}

const formSchema = z.object({
  // Identitas Pemohon
  name: z.string().min(1, 'Nama lengkap wajib diisi'),
  nik: z.string().length(16, 'NIK harus 16 digit'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi'),
  job: z.string().min(1, 'Pekerjaan wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),

  // Objek Tanah / Letter C
  letterCNumber: z.string().min(1, 'Nomor Letter C / Kohir wajib diisi'),
  persilNumber: z.string().min(1, 'Nomor Persil wajib diisi'),
  landClass: z.string().min(1, 'Kelas tanah wajib diisi (Contoh: D.I / S.II)'),
  registeredOwner: z.string().min(1, 'Nama terdaftar di Buku C Desa wajib diisi'),
  landArea: z.string().min(1, 'Luas tanah wajib diisi (misal: 1.250 m²)'),
  landLocation: z.string().min(1, 'Lokasi tanah / Blok / Dusun wajib diisi'),
  landUsage: z.string().default('Pekarangan / Bangunan Rumah'),
  acquisitionHistory: z.string().min(1, 'Riwayat perolehan tanah wajib diisi (contoh: Warisan dari alm. bapak sejak tahun 1998)'),

  // Batas-batas
  northBorder: z.string().min(1, 'Batas utara wajib diisi'),
  eastBorder: z.string().min(1, 'Batas timur wajib diisi'),
  southBorder: z.string().min(1, 'Batas selatan wajib diisi'),
  westBorder: z.string().min(1, 'Batas barat wajib diisi'),

  // Keperluan
  purpose: z.string().min(1, 'Keperluan surat keterangan wajib diisi'),
  whatsapp: phoneValidationSchema,
});

type FormValues = z.infer<typeof formSchema>;

export function KepemilikanTanahForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<{ [key: string]: File }>({});
  const [fileErrors, setFileErrors] = useState<{ [key: string]: string }>({});
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      nik: '',
      birthPlace: '',
      birthDate: '',
      gender: '',
      job: '',
      address: '',
      letterCNumber: '',
      persilNumber: '',
      landClass: 'D.I',
      registeredOwner: '',
      landArea: '',
      landLocation: '',
      landUsage: 'Pekarangan & Rumah Tinggal',
      acquisitionHistory: '',
      northBorder: '',
      eastBorder: '',
      southBorder: '',
      westBorder: '',
      purpose: 'Persyaratan Pendaftaran Tanah / Sertifikat (PTSL) & Bukti Kepemilikan Hak',
      whatsapp: '',
    },
  });

  const nikValue = form.watch('nik');

  useEffect(() => {
    async function fetchResident() {
      if (nikValue && nikValue.length === 16 && firestore) {
        try {
          const res = await getResidentByNik(firestore, nikValue);
          if (res) {
            form.setValue('name', res.fullName ? res.fullName.toUpperCase() : form.getValues('name'));
            form.setValue('birthPlace', res.placeOfBirth || form.getValues('birthPlace'));
            form.setValue('birthDate', res.dateOfBirth ? formatDbDateToForm(res.dateOfBirth) : form.getValues('birthDate'));
            form.setValue('gender', res.gender || form.getValues('gender'));
            form.setValue('job', res.occupation || form.getValues('job'));
            const fullAddress = `${res.address || ''} RT ${res.rt || '00'}/RW ${res.rw || '00'} Dusun ${res.dusun || ''}, Desa Sampeldes`.trim();
            form.setValue('address', fullAddress || form.getValues('address'));
            if ((res as any).telepon) form.setValue('whatsapp', (res as any).telepon);
            if (!form.getValues('registeredOwner')) {
              form.setValue('registeredOwner', res.fullName ? res.fullName.toUpperCase() : '');
            }
            toast({
              title: 'Data Ditemukan',
              description: `Data warga terisi otomatis untuk ${res.fullName}`,
            });
          }
        } catch {
          // ignore
        }
      }
    }
    fetchResident();
  }, [nikValue, firestore, form, toast]);

  const handleFileSelect = (file: File, fieldName: string) => {
    setFiles((prev) => ({ ...prev, [fieldName]: file }));
    setFileErrors((prev) => ({ ...prev, [fieldName]: '' }));
  };

  const onSubmit = async (values: FormValues) => {
    if (!firestore) return;

    if (!isAdmin) {
      const newFileErrors: { [key: string]: string } = {};
      if (!files['ktpFile']) newFileErrors['ktpFile'] = 'Scan/Foto KTP wajib diunggah.';
      if (!files['kkFile']) newFileErrors['kkFile'] = 'Scan/Foto Kartu Keluarga wajib diunggah.';

      if (Object.keys(newFileErrors).length > 0) {
        setFileErrors(newFileErrors);
        toast({
          title: 'Berkas Kurang Lengkap',
          description: 'Mohon unggah semua dokumen persyaratan yang diperlukan.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const generatedTicket = `TKT-${Date.now().toString().slice(-6)}`;
      const filesPayload = await Promise.all(
        Object.entries(files).map(async ([fieldName, file]) => {
          const base64Data = await convertFileToBase64(file);
          return {
            base64Data,
            mimeType: file.type,
            targetFileName: `${fieldName}_${values.nik}`,
            fieldName,
          };
        })
      );

      await addSubmission(firestore, {
        ticketNumber: generatedTicket,
        requesterName: values.name,
        nik: values.nik,
        letterType: 'Surat Keterangan Kepemilikan Tanah',
        formData: {
          ...values,
          phone: values.whatsapp,
          telepon: values.whatsapp,
          form_telepon: values.whatsapp,
        },
        filesToUpload: filesPayload,
      });

      setTicketNumber(generatedTicket);
      toast({
        title: 'Permohonan Berhasil Dikirim',
        description: `Nomor tiket Anda: ${generatedTicket}`,
      });
    } catch (error) {
      toast({
        title: 'Gagal Mengajukan Surat',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan sistem.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (ticketNumber) {
    return (
      <SubmissionSuccess
        ticketNumber={ticketNumber}
        onReset={() => {
          setTicketNumber(null);
          form.reset();
          setFiles({});
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
          <Landmark className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Surat Keterangan Kepemilikan Tanah (Letter C)
          </h2>
          <p className="text-sm text-slate-500">
            Keterangan hak kepemilikan tanah berdasarkan pencatatan Buku C Desa Sampeldes
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Identitas Pemohon */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <User className="w-4 h-4" /> 1. Identitas Pemilik / Pemohon
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIK (16 Digit)</FormLabel>
                    <FormControl>
                      <Input placeholder="3301..." maxLength={16} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama pemilik/pemohon" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempat Lahir</FormLabel>
                    <FormControl>
                      <Input placeholder="Cilacap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Lahir</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kelamin</FormLabel>
                    <FormControl>
                      <Input placeholder="Laki-laki / Perempuan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="job"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pekerjaan</FormLabel>
                    <FormControl>
                      <Input placeholder="Petani / Wiraswasta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Lengkap Pemilik</FormLabel>
                  <FormControl>
                    <Input placeholder="Jl. Melati RT 01/02 Dusun Sampeldes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Data Objek Tanah */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> 2. Rincian Objek Tanah & Letter C Desa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="letterCNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Kohir / Letter C</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: C. 1420" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="persilNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Persil</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: 14a" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="landClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kelas Tanah</FormLabel>
                    <FormControl>
                      <Input placeholder="D.I / S.II / Pekarangan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registeredOwner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atas Nama Tercatat di Buku C</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama pemilik tercatat" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="landArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Luas Bidang Tanah</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: 1.250 m²" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="landLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lokasi / Blok / Dusun</FormLabel>
                    <FormControl>
                      <Input placeholder="Blok Cikondang RT 02/03 Dusun Sampeldes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="landUsage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peruntukan / Penggunaan Tanah</FormLabel>
                    <FormControl>
                      <Input placeholder="Pekarangan & Rumah Tinggal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="acquisitionHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Riwayat Perolehan Hak Tanah</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Diperoleh dari pembagian warisan orang tua (alm. Bapak ...) pada tahun 2005 dan dikuasai sampai sekarang tanpa sengketa."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Batas-Batas Bidang Tanah */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Batas-Batas Bidang Tanah
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="northBorder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Sebelah UTARA berbatasan dengan</FormLabel>
                      <FormControl>
                        <Input placeholder="Jalan Desa / Tanah Bpk. Ahmad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eastBorder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Sebelah TIMUR berbatasan dengan</FormLabel>
                      <FormControl>
                        <Input placeholder="Tanah Ibu Siti" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="southBorder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Sebelah SELATAN berbatasan dengan</FormLabel>
                      <FormControl>
                        <Input placeholder="Saluran Air / Selokan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="westBorder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Sebelah BARAT berbatasan dengan</FormLabel>
                      <FormControl>
                        <Input placeholder="Tanah Bpk. Sudarsono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Keperluan & Kontak */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileCheck className="w-4 h-4" /> 3. Keperluan & Kontak
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tujuan / Keperluan Surat</FormLabel>
                    <FormControl>
                      <Input placeholder="Persyaratan sertifikasi tanah (PTSL) / Agunan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Nomor WhatsApp Aktif {isAdmin ? <span className="text-slate-400 font-normal text-xs">(Opsional)</span> : <span className="text-red-500">*</span>}</FormLabel>
                    <FormControl>
                      <Input placeholder={isAdmin ? "Opsional untuk pengajuan admin" : "081234567890"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Dokumen Persyaratan */}
          {!isAdmin && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <UploadCloud className="w-4 h-4" /> 4. Dokumen Persyaratan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <GoogleFileUploader
                    label="Scan / Foto KTP Pemohon"
                    fieldName="ktpFile"
                    onFileSelect={handleFileSelect}
                    isRequired
                  />
                  {fileErrors.ktpFile && (
                    <p className="text-xs text-destructive mt-1">{fileErrors.ktpFile}</p>
                  )}
                </div>
                <div>
                  <GoogleFileUploader
                    label="Scan / Foto Kartu Keluarga"
                    fieldName="kkFile"
                    onFileSelect={handleFileSelect}
                    isRequired
                  />
                  {fileErrors.kkFile && (
                    <p className="text-xs text-destructive mt-1">{fileErrors.kkFile}</p>
                  )}
                </div>
                <div>
                  <GoogleFileUploader
                    label="Bukti SPPT PBB Terakhir (Jika ada)"
                    fieldName="pbbFile"
                    onFileSelect={handleFileSelect}
                  />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses Permohonan...
              </>
            ) : (
              'Kirim Permohonan Surat Keterangan Tanah'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
