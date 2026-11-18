'use client';

import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, UploadCloud, FileCheck, User, Users, HeartHandshake } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
    <div className="flex flex-col">
      <label className={cn("text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2", isRequired && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
        {label}
      </label>
      <div className={cn(
        "relative group border-2 border-dashed rounded-2xl p-4 transition-all hover:border-primary/50 bg-slate-50/50",
        fileName && "border-emerald-200 bg-emerald-50/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        <input
          type="file"
          onChange={handleFileChange}
          disabled={disabled}
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
    </div>
  );
}

const FormSection = ({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="space-y-6 rounded-[2rem] border p-6 md:p-8 bg-white shadow-sm">
    <div className="flex items-center gap-3 border-b pb-4">
      <div className="p-2 bg-primary/5 rounded-lg text-primary">
        {Icon}
      </div>
      <div>
        <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
  </div>
);

const formSchema = z.object({
  // 1. Identitas Pemohon
  nik: z.string().length(16, 'NIK pemohon harus 16 digit.'),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  nationality: z.string().default('WNI'),
  religion: z.string().min(1, 'Agama wajib diisi.'),
  job: z.string().min(1, 'Pekerjaan wajib diisi.'),
  education: z.string().optional(),
  maritalStatus: z.string().min(1, 'Status pernikahan wajib dipilih.'),
  phone: phoneValidationSchema,
  address: z.string().min(1, 'Alamat wajib diisi.'),
  purpose: z.string().min(1, 'Keperluan pengajuan surat wajib diisi.'),

  // 2. Data Ayah Pemohon
  fatherNik: z.string().optional(),
  fatherName: z.string().optional(),
  fatherBirthPlace: z.string().optional(),
  fatherBirthDate: z.string().optional(),
  fatherReligion: z.string().optional(),
  fatherJob: z.string().optional(),
  fatherAddress: z.string().optional(),

  // 3. Data Ibu Pemohon
  motherNik: z.string().optional(),
  motherName: z.string().optional(),
  motherBirthPlace: z.string().optional(),
  motherBirthDate: z.string().optional(),
  motherReligion: z.string().optional(),
  motherJob: z.string().optional(),
  motherAddress: z.string().optional(),

  // 4. Data Saksi I & Saksi II (Untuk Lampiran SP-BM)
  witness1Nik: z.string().optional(),
  witness1Name: z.string().optional(),
  witness1BirthPlace: z.string().optional(),
  witness1BirthDate: z.string().optional(),
  witness1Religion: z.string().optional(),
  witness1Job: z.string().optional(),
  witness1Address: z.string().optional(),

  witness2Nik: z.string().optional(),
  witness2Name: z.string().optional(),
  witness2BirthPlace: z.string().optional(),
  witness2BirthDate: z.string().optional(),
  witness2Religion: z.string().optional(),
  witness2Job: z.string().optional(),
  witness2Address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function BelumMenikahForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingPemohon, setIsSearchingPemohon] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<Array<{ fieldName: string; file: File }>>([]);

  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: '',
      name: '',
      gender: '',
      birthPlace: '',
      birthDate: '',
      nationality: 'WNI',
      religion: '',
      job: '',
      education: 'SLTA / Sederajat',
      maritalStatus: 'Belum Pernah Kawin (Jejaka / Perawan)',
      phone: '',
      address: '',
      purpose: '',

      fatherNik: '',
      fatherName: '',
      fatherBirthPlace: '',
      fatherBirthDate: '',
      fatherReligion: 'Islam',
      fatherJob: '',
      fatherAddress: '',

      motherNik: '',
      motherName: '',
      motherBirthPlace: '',
      motherBirthDate: '',
      motherReligion: 'Islam',
      motherJob: '',
      motherAddress: '',

      witness1Nik: '',
      witness1Name: '',
      witness1BirthPlace: '',
      witness1BirthDate: '',
      witness1Religion: 'Islam',
      witness1Job: '',
      witness1Address: '',

      witness2Nik: '',
      witness2Name: '',
      witness2BirthPlace: '',
      witness2BirthDate: '',
      witness2Religion: 'Islam',
      witness2Job: '',
      witness2Address: '',
    },
  });

  const nikValue = form.watch('nik');
  const fatherNikValue = form.watch('fatherNik');
  const motherNikValue = form.watch('motherNik');
  const witness1NikValue = form.watch('witness1Nik');
  const witness2NikValue = form.watch('witness2Nik');

  // Auto-fill Data Pemohon saat NIK diketik 16 digit
  useEffect(() => {
    const cleanNik = (nikValue || '').replace(/\D/g, '').trim();
    if (cleanNik.length !== 16 || !firestore) return;

    let active = true;
    setIsSearchingPemohon(true);

    getResidentByNik(firestore, cleanNik)
      .then((resident) => {
        if (!active || !resident) return;
        form.setValue('name', resident.fullName.toUpperCase());
        form.setValue('gender', resident.gender || 'Laki-Laki');
        form.setValue('birthPlace', resident.placeOfBirth || '');
        if (resident.dateOfBirth) {
          form.setValue('birthDate', formatDbDateToForm(resident.dateOfBirth));
        }
        if (resident.religion) form.setValue('religion', resident.religion);
        if (resident.occupation) form.setValue('job', resident.occupation);
        if ((resident as any).pendidikan_kk || (resident as any).education) {
          form.setValue('education', (resident as any).pendidikan_kk || (resident as any).education);
        }
        if ((resident as any).telepon) form.setValue('phone', (resident as any).telepon);

        const fullAddress = `${resident.address || 'Desa Sampeldes'}, RT ${resident.rt || '00'} RW ${resident.rw || '00'}, ${resident.kelurahan || 'Sampeldes'}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
        form.setValue('address', fullAddress);

        // Jika ada data orang tua pada rekam kependudukan pemohon, sinkronkan nama
        if (resident.fatherName && !form.getValues('fatherName')) {
          form.setValue('fatherName', resident.fatherName.toUpperCase());
        }
        if (resident.motherName && !form.getValues('motherName')) {
          form.setValue('motherName', resident.motherName.toUpperCase());
        }

        toast({ title: 'Data Pemohon Ditemukan', description: `Memuat: ${resident.fullName}` });
      })
      .catch((e) => console.warn(e))
      .finally(() => {
        if (active) setIsSearchingPemohon(false);
      });

    return () => {
      active = false;
    };
  }, [nikValue, firestore, form, toast]);

  // Auto-fill NIK Ayah Pemohon
  useEffect(() => {
    const cleanNik = (fatherNikValue || '').replace(/\D/g, '').trim();
    if (cleanNik.length !== 16 || !firestore) return;
    let active = true;
    getResidentByNik(firestore, cleanNik)
      .then((res) => {
        if (!active || !res) return;
        form.setValue('fatherName', res.fullName.toUpperCase());
        if (res.placeOfBirth) form.setValue('fatherBirthPlace', res.placeOfBirth);
        if (res.dateOfBirth) form.setValue('fatherBirthDate', formatDbDateToForm(res.dateOfBirth));
        if (res.religion) form.setValue('fatherReligion', res.religion);
        if (res.occupation) form.setValue('fatherJob', res.occupation);
        const addr = `${res.address || 'Desa Sampeldes'}, RT ${res.rt || '00'} RW ${res.rw || '00'}, ${res.kelurahan || 'Sampeldes'}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
        form.setValue('fatherAddress', addr);
        toast({ title: 'Data Ayah Ditemukan', description: `Memuat: ${res.fullName}` });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [fatherNikValue, firestore, form, toast]);

  // Auto-fill NIK Ibu Pemohon
  useEffect(() => {
    const cleanNik = (motherNikValue || '').replace(/\D/g, '').trim();
    if (cleanNik.length !== 16 || !firestore) return;
    let active = true;
    getResidentByNik(firestore, cleanNik)
      .then((res) => {
        if (!active || !res) return;
        form.setValue('motherName', res.fullName.toUpperCase());
        if (res.placeOfBirth) form.setValue('motherBirthPlace', res.placeOfBirth);
        if (res.dateOfBirth) form.setValue('motherBirthDate', formatDbDateToForm(res.dateOfBirth));
        if (res.religion) form.setValue('motherReligion', res.religion);
        if (res.occupation) form.setValue('motherJob', res.occupation);
        const addr = `${res.address || 'Desa Sampeldes'}, RT ${res.rt || '00'} RW ${res.rw || '00'}, ${res.kelurahan || 'Sampeldes'}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
        form.setValue('motherAddress', addr);
        toast({ title: 'Data Ibu Ditemukan', description: `Memuat: ${res.fullName}` });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [motherNikValue, firestore, form, toast]);

  // Auto-fill NIK Saksi I
  useEffect(() => {
    const cleanNik = (witness1NikValue || '').replace(/\D/g, '').trim();
    if (cleanNik.length !== 16 || !firestore) return;
    let active = true;
    getResidentByNik(firestore, cleanNik)
      .then((res) => {
        if (!active || !res) return;
        form.setValue('witness1Name', res.fullName.toUpperCase());
        if (res.placeOfBirth) form.setValue('witness1BirthPlace', res.placeOfBirth);
        if (res.dateOfBirth) form.setValue('witness1BirthDate', formatDbDateToForm(res.dateOfBirth));
        if (res.religion) form.setValue('witness1Religion', res.religion);
        if (res.occupation) form.setValue('witness1Job', res.occupation);
        const addr = `${res.address || 'Desa Sampeldes'}, RT ${res.rt || '00'} RW ${res.rw || '00'}, ${res.kelurahan || 'Sampeldes'}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
        form.setValue('witness1Address', addr);
        toast({ title: 'Data Saksi I Ditemukan', description: `Memuat: ${res.fullName}` });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [witness1NikValue, firestore, form, toast]);

  // Auto-fill NIK Saksi II
  useEffect(() => {
    const cleanNik = (witness2NikValue || '').replace(/\D/g, '').trim();
    if (cleanNik.length !== 16 || !firestore) return;
    let active = true;
    getResidentByNik(firestore, cleanNik)
      .then((res) => {
        if (!active || !res) return;
        form.setValue('witness2Name', res.fullName.toUpperCase());
        if (res.placeOfBirth) form.setValue('witness2BirthPlace', res.placeOfBirth);
        if (res.dateOfBirth) form.setValue('witness2BirthDate', formatDbDateToForm(res.dateOfBirth));
        if (res.religion) form.setValue('witness2Religion', res.religion);
        if (res.occupation) form.setValue('witness2Job', res.occupation);
        const addr = `${res.address || 'Desa Sampeldes'}, RT ${res.rt || '00'} RW ${res.rw || '00'}, ${res.kelurahan || 'Sampeldes'}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
        form.setValue('witness2Address', addr);
        toast({ title: 'Data Saksi II Ditemukan', description: `Memuat: ${res.fullName}` });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [witness2NikValue, firestore, form, toast]);

  const handleFileSelect = (file: File, fieldName: string) => {
    setFilesToUpload((prev) => [...prev.filter((f) => f.fieldName !== fieldName), { file, fieldName }]);
  };

  const generateTicketNumber = () => {
    return `BLS-${Date.now().toString().slice(-6)}`;
  };

  async function onSubmit(values: FormValues) {
    if (!firestore) return;

    if (!isAdmin) {
      if (!validatePhoneForSubmission(values.phone, isAdmin)) {
        form.setError('phone', { message: 'Nomor HP / WhatsApp wajib diisi (minimal 9 digit).' });
        return;
      }
      if (!filesToUpload.some((f) => f.fieldName === 'ktp')) {
        toast({ title: 'Berkas Belum Lengkap', description: 'Mohon unggah foto KTP Pemohon.', variant: 'destructive' });
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
            targetFileName: `${fileData.fieldName}_${values.nik}`,
            fieldName: fileData.fieldName,
          };
        }),
      );

      const openSidPelakuBagian = {
        ayah: {
          nik: values.fatherNik || '',
          nama: values.fatherName || '',
          tempat_lahir: values.fatherBirthPlace || '',
          tanggal_lahir: values.fatherBirthDate || '',
          agama: values.fatherReligion || 'Islam',
          pekerjaan: values.fatherJob || '',
          alamat: values.fatherAddress || values.address,
        },
        ibu: {
          nik: values.motherNik || '',
          nama: values.motherName || '',
          tempat_lahir: values.motherBirthPlace || '',
          tanggal_lahir: values.motherBirthDate || '',
          agama: values.motherReligion || 'Islam',
          pekerjaan: values.motherJob || '',
          alamat: values.motherAddress || values.address,
        },
        saksi_1: {
          nik: values.witness1Nik || '',
          nama: values.witness1Name || '',
          tempat_lahir: values.witness1BirthPlace || '',
          tanggal_lahir: values.witness1BirthDate || '',
          agama: values.witness1Religion || 'Islam',
          pekerjaan: values.witness1Job || '',
          alamat: values.witness1Address || values.address,
        },
        saksi_2: {
          nik: values.witness2Nik || '',
          nama: values.witness2Name || '',
          tempat_lahir: values.witness2BirthPlace || '',
          tanggal_lahir: values.witness2BirthDate || '',
          agama: values.witness2Religion || 'Islam',
          pekerjaan: values.witness2Job || '',
          alamat: values.witness2Address || values.address,
        },
      };

      await addSubmission(firestore, {
        ticketNumber: newTicketNumber,
        requesterName: values.name,
        nik: values.nik,
        letterType: 'Surat Keterangan Belum Menikah',
        purpose: values.purpose,
        formData: {
          ...values,
          phone: values.phone,
          telepon: values.phone,
          form_telepon: values.phone,

          // Tag status perkawinan
          form_status_perkawinan: values.maritalStatus,
          status_perkawinan: values.maritalStatus,
          form_status_kawin: values.maritalStatus,
          status_kawin: values.maritalStatus,
          maritalStatus: values.maritalStatus,

          // Tag keperluan
          form_keperluan: values.purpose,
          keperluan: values.purpose,

          // Tag Ayah
          form_nama_ayah: values.fatherName || '',
          nama_ayah: values.fatherName || '',
          form_nik_ayah: values.fatherNik || '',
          nik_ayah: values.fatherNik || '',
          form_tempat_lahir_ayah: values.fatherBirthPlace || '',
          form_tanggal_lahir_ayah: values.fatherBirthDate || '',
          form_agama_ayah: values.fatherReligion || 'Islam',
          form_pekerjaan_ayah: values.fatherJob || '',
          form_alamat_ayah: values.fatherAddress || values.address,

          // Tag Ibu
          form_nama_ibu: values.motherName || '',
          nama_ibu: values.motherName || '',
          form_nik_ibu: values.motherNik || '',
          nik_ibu: values.motherNik || '',
          form_tempat_lahir_ibu: values.motherBirthPlace || '',
          form_tanggal_lahir_ibu: values.motherBirthDate || '',
          form_agama_ibu: values.motherReligion || 'Islam',
          form_pekerjaan_ibu: values.motherJob || '',
          form_alamat_ibu: values.motherAddress || values.address,

          // Tag Saksi 1
          form_nama_saksi_1: values.witness1Name || '',
          form_nama_saksi_i: values.witness1Name || '',
          nama_saksi_1: values.witness1Name || '',
          form_nik_saksi_1: values.witness1Nik || '',
          form_nik_saksi_i: values.witness1Nik || '',
          nik_saksi_1: values.witness1Nik || '',
          form_tempat_lahir_saksi_1: values.witness1BirthPlace || '',
          form_tanggal_lahir_saksi_1: values.witness1BirthDate || '',
          form_agama_saksi_1: values.witness1Religion || 'Islam',
          form_pekerjaan_saksi_1: values.witness1Job || '',
          form_alamat_saksi_1: values.witness1Address || values.address,

          // Tag Saksi 2
          form_nama_saksi_2: values.witness2Name || '',
          form_nama_saksi_ii: values.witness2Name || '',
          nama_saksi_2: values.witness2Name || '',
          form_nik_saksi_2: values.witness2Nik || '',
          form_nik_saksi_ii: values.witness2Nik || '',
          nik_saksi_2: values.witness2Nik || '',
          form_tempat_lahir_saksi_2: values.witness2BirthPlace || '',
          form_tanggal_lahir_saksi_2: values.witness2BirthDate || '',
          form_agama_saksi_2: values.witness2Religion || 'Islam',
          form_pekerjaan_saksi_2: values.witness2Job || '',
          form_alamat_saksi_2: values.witness2Address || values.address,

          openSidPelakuBagian,
          lampiran: ['SP-BM'],
        },
        filesToUpload: filesPayload,
      });

      setTicketNumber(newTicketNumber);
      setIsSubmitted(true);
      toast({ title: 'Pengajuan Berhasil', description: `Nomor tiket Anda: ${newTicketNumber}` });
    } catch (error: any) {
      console.error('Submission Error:', error);
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
          setFilesToUpload([]);
          setIsSubmitted(false);
        }}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* 1. IDENTITAS PEMOHON */}
        <FormSection
          title="1. Identitas Pemohon"
          subtitle="Data warga yang mengajukan surat keterangan belum pernah menikah"
          icon={<User className="h-5 w-5" />}
        >
          <FormField
            control={form.control}
            name="nik"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="font-bold text-primary after:content-['*'] after:ml-0.5 after:text-red-500">
                  NIK (Nomor Induk Kependudukan)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="3301xxxxxxxxxxxx"
                      {...field}
                      disabled={isSubmitting}
                      maxLength={16}
                      className="h-12 rounded-xl"
                    />
                    {isSearchingPemohon && (
                      <Loader2 className="absolute right-4 top-3 h-6 w-6 animate-spin text-primary" />
                    )}
                  </div>
                </FormControl>
                <FormDescription>Masukkan 16 digit NIK untuk pengisian otomatis dari database kependudukan.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">
                  Nama Lengkap
                </FormLabel>
                <FormControl>
                  <Input placeholder="Sesuai KTP" {...field} disabled={isSubmitting} className="uppercase h-12 rounded-xl font-semibold" />
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
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Jenis Kelamin</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Pilih Jenis Kelamin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Laki-Laki">Laki-Laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="birthPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Tempat Lahir</FormLabel>
                  <FormControl>
                    <Input placeholder="Cilacap" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
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
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Tanggal Lahir</FormLabel>
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
            name="religion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Agama</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Pilih Agama" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Islam">Islam</SelectItem>
                    <SelectItem value="Kristen">Kristen</SelectItem>
                    <SelectItem value="Katholik">Katholik</SelectItem>
                    <SelectItem value="Hindu">Hindu</SelectItem>
                    <SelectItem value="Buddha">Buddha</SelectItem>
                    <SelectItem value="Konghucu">Konghucu</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="job"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Pekerjaan</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Wiraswasta / Karyawan Swasta" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="education"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Pendidikan Terakhir</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: SLTA / Sederajat" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maritalStatus"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold text-primary">
                  Status Perkawinan Saat Ini
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl font-semibold">
                      <SelectValue placeholder="Pilih Status Perkawinan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Belum Pernah Kawin (Jejaka / Perawan)">Belum Pernah Kawin (Jejaka / Perawan)</SelectItem>
                    <SelectItem value="Jejaka">Jejaka</SelectItem>
                    <SelectItem value="Perawan">Perawan</SelectItem>
                    <SelectItem value="Duda (Cerai Hidup)">Duda (Cerai Hidup)</SelectItem>
                    <SelectItem value="Duda (Cerai Mati)">Duda (Cerai Mati)</SelectItem>
                    <SelectItem value="Janda (Cerai Hidup)">Janda (Cerai Hidup)</SelectItem>
                    <SelectItem value="Janda (Cerai Mati)">Janda (Cerai Mati)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Status yang akan dicetak pada Surat Keterangan dan Lampiran SP-BM.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">
                  Nomor HP / WhatsApp {isAdmin ? <span className="text-slate-400 font-normal text-xs">(Opsional)</span> : <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <Input placeholder={isAdmin ? "Opsional untuk admin" : "081234567890"} {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Kewarganegaraan</FormLabel>
                <FormControl>
                  <Input placeholder="WNI" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Alamat Tempat Tinggal</FormLabel>
                <FormControl>
                  <Textarea placeholder="Alamat domisili lengkap sesuai KTP" {...field} disabled={isSubmitting} className="uppercase rounded-2xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="font-bold text-primary after:content-['*'] after:ml-0.5 after:text-red-500">
                  Keperluan Pengajuan Surat
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Contoh: Persyaratan Pendaftaran Pernikahan di KUA / Persyaratan Melamar Pekerjaan / Kelengkapan Berkas Resmi"
                    {...field}
                    disabled={isSubmitting}
                    className="rounded-2xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* 2. DATA ORANG TUA PEMOHON */}
        <FormSection
          title="2. Data Orang Tua Pemohon"
          subtitle="Identitas Ayah & Ibu Kandung pemohon (sesuai dokumen KK / Akta Kelahiran)"
          icon={<HeartHandshake className="h-5 w-5" />}
        >
          {/* AYAH */}
          <div className="md:col-span-2 pt-2 border-t">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">Data Ayah Kandung</h4>
          </div>

          <FormField
            control={form.control}
            name="fatherNik"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">NIK Ayah</FormLabel>
                <FormControl>
                  <Input placeholder="3301xxxxxxxxxxxx (Opsional)" {...field} disabled={isSubmitting} maxLength={16} className="h-12 rounded-xl" />
                </FormControl>
                <FormDescription>Ketik 16 digit NIK untuk auto-fill jika warga desa.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fatherName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Nama Lengkap Ayah</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Ayah Kandung" {...field} disabled={isSubmitting} className="uppercase h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fatherBirthPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempat Lahir Ayah</FormLabel>
                  <FormControl>
                    <Input placeholder="Cilacap" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fatherBirthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Lahir Ayah</FormLabel>
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
            name="fatherJob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pekerjaan Ayah</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Petani/Pekebun" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* IBU */}
          <div className="md:col-span-2 pt-4 border-t">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">Data Ibu Kandung</h4>
          </div>

          <FormField
            control={form.control}
            name="motherNik"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">NIK Ibu</FormLabel>
                <FormControl>
                  <Input placeholder="3301xxxxxxxxxxxx (Opsional)" {...field} disabled={isSubmitting} maxLength={16} className="h-12 rounded-xl" />
                </FormControl>
                <FormDescription>Ketik 16 digit NIK untuk auto-fill jika warga desa.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motherName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Nama Lengkap Ibu</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Ibu Kandung" {...field} disabled={isSubmitting} className="uppercase h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="motherBirthPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempat Lahir Ibu</FormLabel>
                  <FormControl>
                    <Input placeholder="Cilacap" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="motherBirthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Lahir Ibu</FormLabel>
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
            name="motherJob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pekerjaan Ibu</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Mengurus Rumah Tangga" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* 3. DATA SAKSI-SAKSI */}
        <FormSection
          title="3. Data Saksi I & Saksi II"
          subtitle="Saksi yang mengetahui dan menandatangani Lampiran Surat Pernyataan Belum Pernah Menikah (SP-BM)"
          icon={<Users className="h-5 w-5" />}
        >
          {/* SAKSI I */}
          <div className="md:col-span-2 pt-2 border-t">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">Identitas Saksi I</h4>
          </div>

          <FormField
            control={form.control}
            name="witness1Nik"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">NIK Saksi I</FormLabel>
                <FormControl>
                  <Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} className="h-12 rounded-xl" />
                </FormControl>
                <FormDescription>Ketik 16 digit NIK saksi I untuk auto-fill warga desa.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="witness1Name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Nama Saksi I</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Lengkap Saksi I" {...field} disabled={isSubmitting} className="uppercase h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="witness1Job"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pekerjaan Saksi I</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Wiraswasta / Perangkat Desa" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="witness1Address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat Saksi I</FormLabel>
                <FormControl>
                  <Input placeholder="Alamat domisili Saksi I" {...field} disabled={isSubmitting} className="h-12 rounded-xl uppercase" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SAKSI II */}
          <div className="md:col-span-2 pt-4 border-t">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">Identitas Saksi II</h4>
          </div>

          <FormField
            control={form.control}
            name="witness2Nik"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">NIK Saksi II</FormLabel>
                <FormControl>
                  <Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} className="h-12 rounded-xl" />
                </FormControl>
                <FormDescription>Ketik 16 digit NIK saksi II untuk auto-fill warga desa.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="witness2Name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Nama Saksi II</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Lengkap Saksi II" {...field} disabled={isSubmitting} className="uppercase h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="witness2Job"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pekerjaan Saksi II</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Wiraswasta / Tokoh Masyarakat" {...field} disabled={isSubmitting} className="h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="witness2Address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat Saksi II</FormLabel>
                <FormControl>
                  <Input placeholder="Alamat domisili Saksi II" {...field} disabled={isSubmitting} className="h-12 rounded-xl uppercase" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* 4. UNGGAH BERKAS LAMPIRAN */}
        <FormSection
          title="4. Unggah Berkas Lampiran"
          subtitle="Lampirkan foto dokumen pendukung resmi (JPG, PNG, atau PDF)"
          icon={<UploadCloud className="h-5 w-5" />}
        >
          <div className="col-span-1 md:col-span-2 space-y-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Unggah file format gambar (JPG, PNG) atau PDF. Berkas bertanda * wajib diisi untuk pengajuan warga.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              <GoogleFileUploader label="Foto KTP Pemohon" fieldName="ktp" onFileSelect={handleFileSelect} isRequired={!isAdmin} disabled={isSubmitting} />
              <GoogleFileUploader label="Foto Kartu Keluarga (KK)" fieldName="kk" onFileSelect={handleFileSelect} disabled={isSubmitting} />
              <GoogleFileUploader label="Foto KTP Saksi I" fieldName="ktpSaksi1" onFileSelect={handleFileSelect} disabled={isSubmitting} />
              <GoogleFileUploader label="Foto KTP Saksi II" fieldName="ktpSaksi2" onFileSelect={handleFileSelect} disabled={isSubmitting} />
              <GoogleFileUploader label="Surat Pengantar RT/RW" fieldName="pengantarRt" onFileSelect={handleFileSelect} isRequired={false} disabled={isSubmitting} />
            </div>
          </div>
        </FormSection>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all active:scale-95"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Ajukan Surat Keterangan Belum Menikah'}
        </Button>
      </form>
    </Form>
  );
}