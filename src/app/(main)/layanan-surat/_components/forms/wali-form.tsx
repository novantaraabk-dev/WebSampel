'use client';
import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, ShieldCheck, User, Baby, UploadCloud, FileCheck, School, Copy, Sparkles } from 'lucide-react';

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

// --- Helper Functions ---
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
      <FormLabel className={cn("text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2", isRequired && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
        {label}
      </FormLabel>
      <FormControl>
        <div className={cn(
          "relative group border-2 border-dashed rounded-2xl p-4 transition-all hover:border-primary/50 bg-slate-50/50",
          fileName && "border-emerald-200 bg-emerald-50/30",
          disabled && "opacity-50 cursor-not-allowed"
        )}>
          <input
            type="file"
            onChange={handleFileChange}
            disabled={disabled || !!fileName}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            accept="image/jpeg,image/png,application/pdf"
          />
          <div className="flex flex-col items-center justify-center text-center gap-2 py-2">
            {fileName ? (
              <>
                <div className="p-2 bg-white rounded-full shadow-sm">
                  <FileCheck className="h-6 w-6 text-emerald-600 animate-in zoom-in" />
                </div>
                <p className="text-[10px] font-black text-emerald-700 line-clamp-1 uppercase px-2 tracking-tight">{fileName}</p>
              </>
            ) : (
              <>
                <div className="p-2 bg-white rounded-full shadow-sm">
                  <UploadCloud className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-600 transition-colors">
                  Pilih Berkas
                </p>
              </>
            )}
          </div>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

const FormSection = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="space-y-6 rounded-[2rem] border p-6 md:p-8 bg-white shadow-sm">
    <div className="flex items-center gap-3 border-b pb-4">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-800">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
  </div>
);

const waliSchema = z.object({
  nik: z.string().length(16, 'NIK Wali harus 16 digit.'),
  name: z.string().min(1, 'Nama Kepala Keluarga / Wali wajib diisi.'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  religion: z.string().min(1, 'Agama wajib diisi.'),
  job: z.string().min(1, 'Pekerjaan utama wajib diisi.'),
  address: z.string().min(1, 'Alamat wajib diisi.'),
});

const anakSchema = z.object({
  name: z.string().min(1, 'Nama siswa / anak wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir anak wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir anak wajib diisi.'),
  noKk: z.string().min(1, 'No. KK anak wajib diisi.'),
  nik: z.string().length(16, 'NIK anak harus 16 digit.'),
  fatherName: z.string().min(1, 'Nama ayah kandung wajib diisi.'),
  motherName: z.string().min(1, 'Nama ibu kandung wajib diisi.'),
  gender: z.string().min(1, 'Jenis kelamin anak wajib diisi.'),
  religion: z.string().min(1, 'Agama anak wajib diisi.'),
  job: z.string().min(1, 'Pekerjaan utama anak wajib diisi.'),
  schoolName: z.string().min(1, 'Nama sekolah wajib diisi.'),
  grade: z.string().min(1, 'Kelas wajib diisi.'),
  address: z.string().min(1, 'Alamat anak wajib diisi.'),
});

const formSchema = z.object({
  purpose: z.string().min(1, 'Keperluan surat keterangan wali wajib diisi.'),
  phone: phoneValidationSchema,
  wali: waliSchema,
  anak: anakSchema,
});

export function WaliForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingWali, setIsSearchingWali] = useState(false);
  const [isSearchingAnak, setIsSearchingAnak] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<Array<{ fieldName: string; file: File }>>([]);

  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purpose: 'Pengambilan/Pencairan Bantuan Program Indonesia Pintar (PIP)',
      phone: '',
      wali: {
        nik: '',
        name: '',
        gender: 'Perempuan',
        birthPlace: '',
        birthDate: '',
        religion: 'Islam',
        job: 'Mengurus Rumah Tangga',
        address: '',
      },
      anak: {
        nik: '',
        noKk: '',
        name: '',
        gender: 'Perempuan',
        birthPlace: '',
        birthDate: '',
        religion: 'Islam',
        fatherName: '',
        motherName: '',
        job: 'Pelajar',
        schoolName: '',
        grade: '',
        address: '',
      },
    },
  });

  const waliNik = form.watch('wali.nik');
  const anakNik = form.watch('anak.nik');

  // Auto-fill Data Wali dari Database Kependudukan
  useEffect(() => {
    const fetchWali = async () => {
      if (waliNik?.length === 16 && firestore) {
        setIsSearchingWali(true);
        try {
          const res = await getResidentByNik(firestore, waliNik);
          if (res) {
            form.setValue('wali.name', res.fullName.toUpperCase());
            form.setValue('wali.gender', res.gender || 'Perempuan');
            form.setValue('wali.birthPlace', res.placeOfBirth || '');
            form.setValue('wali.birthDate', formatDbDateToForm(res.dateOfBirth));
            form.setValue('wali.religion', res.religion || 'Islam');
            form.setValue('wali.job', res.occupation || 'Mengurus Rumah Tangga');
            if (res.noKk && !form.getValues('anak.noKk')) {
              form.setValue('anak.noKk', res.noKk);
            }
            if ((res as any).telepon && !form.getValues('phone')) {
              form.setValue('phone', (res as any).telepon);
            }
            const fullAddress = `${res.address}, RT ${res.rt} RW ${res.rw}, ${res.kelurahan}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
            form.setValue('wali.address', fullAddress);

            toast({ title: 'Data Wali Ditemukan', description: `${res.fullName} berhasil dimuat.` });
          }
        } catch (error) {
          console.error('Error autofill wali:', error);
        } finally {
          setIsSearchingWali(false);
        }
      }
    };
    fetchWali();
  }, [waliNik, firestore, form, toast]);

  // Auto-fill Data Anak dari Database Kependudukan
  useEffect(() => {
    const fetchAnak = async () => {
      if (anakNik?.length === 16 && firestore) {
        setIsSearchingAnak(true);
        try {
          const res = await getResidentByNik(firestore, anakNik);
          if (res) {
            form.setValue('anak.name', res.fullName.toUpperCase());
            form.setValue('anak.gender', res.gender || 'Perempuan');
            form.setValue('anak.birthPlace', res.placeOfBirth || '');
            form.setValue('anak.birthDate', formatDbDateToForm(res.dateOfBirth));
            form.setValue('anak.religion', res.religion || 'Islam');
            if (res.noKk) form.setValue('anak.noKk', res.noKk);
            if ((res as any).fatherName) form.setValue('anak.fatherName', (res as any).fatherName.toUpperCase());
            if ((res as any).motherName) form.setValue('anak.motherName', (res as any).motherName.toUpperCase());
            form.setValue('anak.job', res.occupation || 'Pelajar');

            const fullAddress = `${res.address}, RT ${res.rt} RW ${res.rw}, ${res.kelurahan}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
            if (!form.getValues('anak.address')) {
              form.setValue('anak.address', fullAddress);
            }

            toast({ title: 'Data Anak Ditemukan', description: `${res.fullName} berhasil dimuat.` });
          }
        } catch (error) {
          console.error('Error autofill anak:', error);
        } finally {
          setIsSearchingAnak(false);
        }
      }
    };
    fetchAnak();
  }, [anakNik, firestore, form, toast]);

  const handleCopyWaliAddress = () => {
    const addr = form.getValues('wali.address');
    if (addr) {
      form.setValue('anak.address', addr);
      toast({ title: 'Alamat Disalin', description: 'Alamat siswa/anak disamakan dengan alamat wali.' });
    }
  };

  const handleSelectPurpose = (text: string) => {
    form.setValue('purpose', text);
  };

  const handleFileSelect = (file: File, fieldName: string) => {
    setFilesToUpload(prev => [...prev.filter(f => f.fieldName !== fieldName), { file, fieldName }]);
  };

  const generateTicketNumber = () => `WLI-${Date.now().toString().slice(-6)}`;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    if (!isAdmin) {
      if (!validatePhoneForSubmission(values.phone, isAdmin)) {
        form.setError('phone', { message: 'Nomor HP / WhatsApp wajib diisi (minimal 9 digit).' });
        return;
      }
      const hasKtp = filesToUpload.some(f => f.fieldName === 'ktp');
      const hasKk = filesToUpload.some(f => f.fieldName === 'kk');
      if (!hasKtp || !hasKk) {
        toast({ title: 'Berkas Belum Lengkap', description: 'Mohon unggah foto KTP dan KK Wali.', variant: 'destructive' });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const newTicketNumber = generateTicketNumber();

      const filesPayload = await Promise.all(
        filesToUpload.map(async (fileData) => {
          const base64Data = await convertFileToBase64(fileData.file);
          return {
            base64Data,
            mimeType: fileData.file.type,
            targetFileName: `${fileData.fieldName}_${values.wali.nik}`,
            fieldName: fileData.fieldName,
          };
        })
      );

      const ttlWaliStr = `${values.wali.birthPlace}, ${values.wali.birthDate}`;
      const ttlAnakStr = `${values.anak.birthPlace}, ${values.anak.birthDate}`;

      await addSubmission(firestore, {
        ticketNumber: newTicketNumber,
        requesterName: values.wali.name,
        nik: values.wali.nik,
        letterType: 'Surat Keterangan Wali',
        purpose: values.purpose,
        formData: {
          ...values,
          wali: values.wali,
          anak: values.anak,
          purpose: values.purpose,
          keperluan: values.purpose,
          form_keperluan: values.purpose,

          // Data Wali (Kepala Keluarga)
          nama_wali: values.wali.name,
          form_nama_wali: values.wali.name,
          nik_wali: values.wali.nik,
          form_nik_wali: values.wali.nik,
          ttl_wali: ttlWaliStr,
          form_ttl_wali: ttlWaliStr,
          tempat_lahir_wali: values.wali.birthPlace,
          tanggal_lahir_wali: values.wali.birthDate,
          jenis_kelamin_wali: values.wali.gender,
          form_jenis_kelamin_wali: values.wali.gender,
          agama_wali: values.wali.religion,
          form_agama_wali: values.wali.religion,
          pekerjaan_wali: values.wali.job,
          form_pekerjaan_wali: values.wali.job,
          alamat_wali: values.wali.address,
          form_alamat_wali: values.wali.address,

          // Data Siswa / Anak
          nama_anak: values.anak.name,
          form_nama_anak: values.anak.name,
          ttl_anak: ttlAnakStr,
          form_ttl_anak: ttlAnakStr,
          tempat_lahir_anak: values.anak.birthPlace,
          tanggal_lahir_anak: values.anak.birthDate,
          no_kk_anak: values.anak.noKk,
          form_no_kk_anak: values.anak.noKk,
          nik_anak: values.anak.nik,
          form_nik_anak: values.anak.nik,
          nama_ayah_kandung: values.anak.fatherName,
          form_nama_ayah_kandung: values.anak.fatherName,
          nama_ibu_kandung: values.anak.motherName,
          form_nama_ibu_kandung: values.anak.motherName,
          jenis_kelamin_anak: values.anak.gender,
          form_jenis_kelamin_anak: values.anak.gender,
          agama_anak: values.anak.religion,
          form_agama_anak: values.anak.religion,
          pekerjaan_anak: values.anak.job || 'Pelajar',
          form_pekerjaan_anak: values.anak.job || 'Pelajar',
          nama_sekolah: values.anak.schoolName,
          form_nama_sekolah: values.anak.schoolName,
          kelas_anak: values.anak.grade,
          form_kelas_anak: values.anak.grade,
          alamat_anak: values.anak.address,
          form_alamat_anak: values.anak.address,

          phone: values.phone,
          telepon: values.phone,
          form_telepon: values.phone,
        },
        filesToUpload: filesPayload,
      });

      setTicketNumber(newTicketNumber);
      setIsSubmitted(true);
      toast({ title: 'Pengajuan Berhasil', description: `Nomor tiket Anda: ${newTicketNumber}` });
    } catch (error: any) {
      toast({ title: 'Gagal Mengajukan', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <SubmissionSuccess
        ticketNumber={ticketNumber}
        onReset={() => {
          form.reset();
          setIsSubmitted(false);
          setFilesToUpload([]);
        }}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Banner Keperluan Surat */}
        <div className="p-6 md:p-8 border-2 border-primary/20 rounded-[2.5rem] bg-emerald-50/40 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary text-white rounded-2xl shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-800">
                Keperluan Surat Keterangan Wali
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Pilih atau isi maksud penggunaan surat (contoh: PIP, Administrasi Sekolah, dll).
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input
                    placeholder="Contoh: Pengambilan/Pencairan Bantuan Program Indonesia Pintar (PIP)"
                    {...field}
                    disabled={isSubmitting}
                    className="h-13 bg-white rounded-xl border-slate-200 font-bold text-slate-800 text-sm shadow-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500 self-center mr-1">Pilihan Cepat:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSelectPurpose('Pengambilan/Pencairan Bantuan Program Indonesia Pintar (PIP)')}
              className="text-xs rounded-lg h-8 bg-white hover:bg-emerald-100 hover:text-emerald-900 border-emerald-200"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              Pencairan PIP
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSelectPurpose('Persyaratan Administrasi Pendaftaran Sekolah')}
              className="text-xs rounded-lg h-8 bg-white hover:bg-slate-100 border-slate-200"
            >
              Pendaftaran Sekolah
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSelectPurpose('Pengurusan Pembukaan Rekening Bank Siswa / Tabungan SimPel')}
              className="text-xs rounded-lg h-8 bg-white hover:bg-slate-100 border-slate-200"
            >
              Rekening Bank Siswa
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSelectPurpose('Pengurusan Beasiswa Pendidikan')}
              className="text-xs rounded-lg h-8 bg-white hover:bg-slate-100 border-slate-200"
            >
              Beasiswa
            </Button>
          </div>
        </div>

        {/* Bagian I: Data Wali (Kepala Keluarga) */}
        <FormSection title="I. Identitas Kepala Keluarga / Wali" icon={User}>
          <FormField
            control={form.control}
            name="wali.nik"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="font-bold text-primary">NIK Wali (16 Digit) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="3301xxxxxxxxxxxx"
                      {...field}
                      disabled={isSubmitting}
                      maxLength={16}
                      className="h-12 rounded-xl font-mono text-base tracking-wider"
                    />
                    {isSearchingWali && <Loader2 className="absolute right-4 top-3 h-6 w-6 animate-spin text-primary" />}
                  </div>
                </FormControl>
                <p className="text-[11px] text-slate-400 mt-1">Ketik 16 digit NIK warga desa untuk pengisian data otomatis.</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="wali.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">Nama Kepala Keluarga / Wali *</FormLabel>
                <FormControl>
                  <Input placeholder="Sesuai KTP" {...field} disabled={isSubmitting} className="uppercase h-12 rounded-xl font-semibold" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="wali.gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">Jenis Kelamin Wali *</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Perempuan / Laki-Laki" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="wali.birthPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">Tempat Lahir *</FormLabel>
                  <FormControl>
                    <Input placeholder="Kota/Kab" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wali.birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">Tanggal Lahir *</FormLabel>
                  <FormControl>
                    <Input placeholder="DD-MM-YYYY" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="wali.religion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">Agama Wali *</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Islam" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="wali.job"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">Pekerjaan Utama Wali *</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Mengurus Rumah Tangga / Wiraswasta" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">
                  Nomor HP / WhatsApp {!isAdmin && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={isAdmin ? "Opsional untuk pengajuan admin" : "Contoh: 081234567890"}
                    {...field}
                    disabled={isSubmitting}
                    className="h-12 rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="wali.address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="font-semibold text-slate-700">Alamat Tempat Tinggal Wali *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Contoh: Kp. Cihanja II RT 02 RW 08 Desa Sampeldes Kec. Gandrungmangu Kab. Cilacap"
                    {...field}
                    disabled={isSubmitting}
                    className="uppercase rounded-2xl min-h-[70px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* Bagian II: Data Siswa / Anak yang Diwakili */}
        <FormSection title="II. Identitas Siswa / Anak yang Diwakili" icon={Baby}>
          <FormField
            control={form.control}
            name="anak.nik"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="font-bold text-primary">NIK Siswa / Anak (16 Digit) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="3301xxxxxxxxxxxx"
                      {...field}
                      disabled={isSubmitting}
                      maxLength={16}
                      className="h-12 rounded-xl font-mono text-base tracking-wider"
                    />
                    {isSearchingAnak && <Loader2 className="absolute right-4 top-3 h-6 w-6 animate-spin text-primary" />}
                  </div>
                </FormControl>
                <p className="text-[11px] text-slate-400 mt-1">Ketik 16 digit NIK anak untuk memuat data identitas secara otomatis.</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="anak.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">Nama Lengkap Siswa / Anak *</FormLabel>
                <FormControl>
                  <Input placeholder="Sesuai KK / Akta Kelahiran" {...field} disabled={isSubmitting} className="uppercase h-12 rounded-xl font-semibold" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="anak.noKk"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">Nomor Kartu Keluarga (KK) Anak *</FormLabel>
                <FormControl>
                  <Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} className="h-12 rounded-xl font-mono" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="anak.birthPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">Tempat Lahir *</FormLabel>
                  <FormControl>
                    <Input placeholder="Kota/Kab" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="anak.birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">Tanggal Lahir *</FormLabel>
                  <FormControl>
                    <Input placeholder="DD-MM-YYYY" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="anak.gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">Jenis Kelamin Anak *</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Perempuan / Laki-Laki" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="anak.religion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">Agama Anak *</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Islam" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="anak.job"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">Pekerjaan Utama *</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Pelajar" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="anak.fatherName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">Nama Ayah Kandung *</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Ayah Kandung" {...field} disabled={isSubmitting} className="uppercase h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="anak.motherName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">Nama Ibu Kandung *</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Ibu Kandung" {...field} disabled={isSubmitting} className="uppercase h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="anak.schoolName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <School className="h-4 w-4 text-primary" />
                  Nama Sekolah *
                </FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: SD IT CIHANJA / SDN 01 SAMPELDES" {...field} disabled={isSubmitting} className="uppercase h-12 rounded-xl font-semibold" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="anak.grade"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">Kelas *</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: 2 (Dua) / Kelas VII" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel className="font-semibold text-slate-700">Alamat Lengkap Siswa / Anak *</FormLabel>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyWaliAddress}
                className="text-xs h-7 text-primary hover:text-primary hover:bg-primary/10 gap-1"
              >
                <Copy className="h-3.5 w-3.5" />
                Sama dengan Alamat Wali
              </Button>
            </div>
            <FormField
              control={form.control}
              name="anak.address"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Kp. Cihanja II RT 02 RW 08 Desa Sampeldes Kec. Gandrungmangu Kab. Cilacap"
                      {...field}
                      disabled={isSubmitting}
                      className="uppercase rounded-2xl min-h-[70px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Bagian III: Berkas Persyaratan */}
        <FormSection title="III. Unggah Berkas Lampiran" icon={UploadCloud}>
          <div className="col-span-1 md:col-span-2 space-y-4">
            <p className="text-xs text-slate-500 font-medium">
              Unggah file format foto (JPG, PNG) atau PDF. {!isAdmin && <span className="text-red-500 font-semibold">* Wajib diisi untuk pengajuan mandiri warga.</span>}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              <GoogleFileUploader label="Foto KTP Wali" fieldName="ktp" onFileSelect={handleFileSelect} isRequired={!isAdmin} disabled={isSubmitting} />
              <GoogleFileUploader label="Foto Kartu Keluarga (KK)" fieldName="kk" onFileSelect={handleFileSelect} isRequired={!isAdmin} disabled={isSubmitting} />
              <GoogleFileUploader label="Surat Pengantar RT / RW" fieldName="pengantarRt" onFileSelect={handleFileSelect} isRequired={false} disabled={isSubmitting} />
            </div>
          </div>
        </FormSection>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full h-15 rounded-2xl bg-primary text-white font-black uppercase tracking-wider text-sm shadow-xl shadow-primary/20 hover:scale-[1.005] transition-all active:scale-95"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              MEMPROSES PENGAJUAN...
            </>
          ) : (
            'Ajukan Surat Keterangan Wali'
          )}
        </Button>
      </form>
    </Form>
  );
}
