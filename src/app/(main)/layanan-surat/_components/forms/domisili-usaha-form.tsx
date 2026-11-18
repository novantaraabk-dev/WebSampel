'use client';
import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Building2, User, MapPin, FileCheck, Paperclip, UploadCloud } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  // Identitas Pemohon / Pemilik Usaha
  nik: z.string().length(16, 'NIK harus 16 digit'),
  name: z.string().min(1, 'Nama lengkap wajib diisi'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi'),
  job: z.string().min(1, 'Pekerjaan wajib diisi'),
  address: z.string().min(1, 'Alamat KTP wajib diisi'),

  // Data Usaha / Perusahaan
  businessName: z.string().min(1, 'Nama usaha / perusahaan wajib diisi'),
  businessType: z.string().min(1, 'Jenis / bidang usaha wajib diisi (contoh: Perdagangan Sembako / Jasa Bengkel)'),
  businessRt: z.string().optional().default(''),
  businessRw: z.string().optional().default(''),
  businessDusun: z.string().optional().default(''),
  businessAddress: z.string().optional().default(''),
  buildingStatus: z.string().min(1, 'Status bangunan tempat usaha wajib dipilih'),
  responsiblePerson: z.string().min(1, 'Penanggung jawab usaha wajib diisi'),
  nibNumber: z.string().default('-'),
  employeeCount: z.string().default('2 orang'),
  establishmentYear: z.string().default(new Date().getFullYear().toString()),

  // Keperluan
  purpose: z.string().min(1, 'Keperluan surat domisili wajib diisi'),
  whatsapp: phoneValidationSchema,
});

type FormValues = z.infer<typeof formSchema>;

export function DomisiliUsahaForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<{ [key: string]: File }>({});
  const [fileErrors, setFileErrors] = useState<{ [key: string]: string }>({});
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: '',
      name: '',
      birthPlace: '',
      birthDate: '',
      gender: '',
      job: '',
      address: '',
      businessName: '',
      businessType: '',
      businessRt: '',
      businessRw: '',
      businessDusun: '',
      businessAddress: '',
      buildingStatus: 'Milik Sendiri',
      responsiblePerson: '',
      nibNumber: '-',
      employeeCount: '2 orang',
      establishmentYear: new Date().getFullYear().toString(),
      purpose: 'Persyaratan Pembukaan Rekening Perusahaan & Izin Operasional Usaha',
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
            const pName = res.fullName ? res.fullName.toUpperCase() : form.getValues('name');
            form.setValue('name', pName);
            if (!form.getValues('responsiblePerson')) {
              form.setValue('responsiblePerson', pName);
            }
            form.setValue('birthPlace', res.placeOfBirth || form.getValues('birthPlace'));
            form.setValue('birthDate', res.dateOfBirth ? formatDbDateToForm(res.dateOfBirth) : form.getValues('birthDate'));
            form.setValue('gender', res.gender || form.getValues('gender'));
            form.setValue('job', res.occupation || form.getValues('job'));
            const fullAddress = `${res.address || ''} RT ${res.rt || '00'}/RW ${res.rw || '00'} Dusun ${res.dusun || ''}, Desa Sampeldes`.trim();
            form.setValue('address', fullAddress || form.getValues('address'));
            if (!form.getValues('businessRt') && res.rt) {
              form.setValue('businessRt', res.rt);
            }
            if (!form.getValues('businessRw') && res.rw) {
              form.setValue('businessRw', res.rw);
            }
            if (!form.getValues('businessDusun') && res.dusun) {
              form.setValue('businessDusun', res.dusun);
            }
            if ((res as any).telepon) form.setValue('whatsapp', (res as any).telepon);
            if (!form.getValues('businessAddress')) {
              form.setValue('businessAddress', fullAddress);
            }
            toast({
              title: 'Data Ditemukan',
              description: `Data terisi otomatis untuk ${res.fullName}`,
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
      if (Object.keys(newFileErrors).length > 0) {
        setFileErrors(newFileErrors);
        toast({
          title: 'Berkas Kurang Lengkap',
          description: 'Mohon unggah KTP penanggung jawab usaha.',
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

      let alamatUsahaFormatted = '';
      const rtUsaha = values.businessRt?.trim();
      const rwUsaha = values.businessRw?.trim();
      const dusunUsaha = values.businessDusun?.trim();

      if (rtUsaha || rwUsaha || dusunUsaha) {
        const parts = [`RT ${rtUsaha || '...'}` , `RW ${rwUsaha || '...'}`].join(' / ');
        const dusunStr = dusunUsaha ? `Dusun ${dusunUsaha}` : 'Dusun Sampeldes';
        const roadStr = values.businessAddress?.trim() && !values.businessAddress.includes('RT') ? `${values.businessAddress.trim()}, ` : '';
        alamatUsahaFormatted = `${roadStr}${parts} ${dusunStr}`.trim();
      } else if (values.businessAddress?.trim()) {
        alamatUsahaFormatted = values.businessAddress.trim();
      } else {
        alamatUsahaFormatted = `RT 001 / RW 001 Dusun Sampeldes`;
      }

      await addSubmission(firestore, {
        ticketNumber: generatedTicket,
        requesterName: values.name,
        nik: values.nik,
        letterType: 'Surat Keterangan Domisili Usaha',
        formData: {
          ...values,
          phone: values.whatsapp,
          telepon: values.whatsapp,
          form_telepon: values.whatsapp,
          businessAddress: alamatUsahaFormatted,
          form_nama_usaha: values.businessName,
          nama_usaha: values.businessName,
          form_jenis_usaha: values.businessType,
          jenis_usaha: values.businessType,
          form_alamat_usaha: alamatUsahaFormatted,
          alamat_usaha: alamatUsahaFormatted,
          form_status_bangunan: values.buildingStatus,
          status_bangunan: values.buildingStatus,
          form_penanggung_jawab: values.responsiblePerson || values.name,
          penanggung_jawab: values.responsiblePerson || values.name,
          form_keperluan: values.purpose,
          keperluan: values.purpose,
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
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-700">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Surat Keterangan Domisili Usaha</h2>
          <p className="text-sm text-slate-500">
            Keterangan domisili operasional tempat usaha / perusahaan / yayasan / UMKM di Desa Sampeldes
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Identitas Penanggung Jawab */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <User className="w-4 h-4" /> 1. Identitas Penanggung Jawab / Pimpinan Usaha
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIK Penanggung Jawab</FormLabel>
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
                      <Input placeholder="Nama pimpinan / pemilik usaha" {...field} />
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
                      <Input placeholder="Wiraswasta" {...field} />
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
                  <FormLabel>Alamat Penanggung Jawab</FormLabel>
                  <FormControl>
                    <Input placeholder="Alamat lengkap tinggal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Data Badan Usaha */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> 2. Rincian Badan Usaha / Perusahaan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Usaha / Perusahaan <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: CV. MAJU BERSAMA / UD. BERKAH JAYA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis / Bidang Usaha <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Perdagangan Sembako, Pertanian, Jasa Bengkel, dll" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buildingStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Bangunan Tempat Usaha <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status bangunan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Milik Sendiri">Milik Sendiri</SelectItem>
                        <SelectItem value="Sewa">Sewa</SelectItem>
                        <SelectItem value="Kontrak">Kontrak</SelectItem>
                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="responsiblePerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Penanggung Jawab Usaha <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Nama penanggung jawab / pemilik" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Alamat Usaha (RT, RW, Dusun) */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-700">Alamat Usaha di Wilayah Desa Sampeldes</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="businessRt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">RT Usaha</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: 002" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessRw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">RW Usaha</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: 005" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessDusun"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Dusun Usaha</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Sampeldes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="businessAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-slate-600">Nama Jalan / Lokasi Tambahan Tempat Usaha (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Jl. Raya Sampeldes No. 12 (opsional, jika ada nama jalan)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <FormField
                control={form.control}
                name="nibNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Induk Berusaha (NIB) / Akta</FormLabel>
                    <FormControl>
                      <Input placeholder="Isi '-' jika belum ada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="establishmentYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun Berdiri Usaha</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: 2021" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employeeCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Tenaga Kerja</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: 2 orang" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Keperluan & Kontak */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileCheck className="w-4 h-4" /> 3. Keperluan & Dokumen Persyaratan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keperluan Surat Keterangan Domisili</FormLabel>
                    <FormControl>
                      <Input placeholder="Persyaratan pembukaan rekening bank / OSS NIB" {...field} />
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

            {!isAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <GoogleFileUploader
                    label="Scan / Foto KTP Penanggung Jawab"
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
                    label="Foto Tempat Usaha / NIB (Bila ada)"
                    fieldName="nibFile"
                    onFileSelect={handleFileSelect}
                  />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses Permohonan...
              </>
            ) : (
              'Kirim Permohonan Surat Domisili Usaha'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
