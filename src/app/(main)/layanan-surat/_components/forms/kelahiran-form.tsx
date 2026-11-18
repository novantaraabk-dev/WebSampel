'use client';
import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, User, Users, Baby, UploadCloud, FileCheck } from 'lucide-react';

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

const FormSection = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div className="space-y-6 rounded-[2rem] border p-6 md:p-10 bg-white shadow-sm">
    <div className="flex items-center gap-3 border-b pb-4">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
  </div>
);

const formSchema = z.object({
  motherNik: z.string().length(16, 'NIK ibu harus 16 digit.'),
  kkNumber: z.string().refine(val => !val || val.length === 16, 'Nomor KK harus 16 digit.').optional(),
  childName: z.string().min(1, 'Nama anak wajib diisi.'),
  childGender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  childNik: z.string().optional(),
  childBirthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  childBirthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  childBirthTime: z.string().min(1, 'Waktu lahir wajib diisi.'),
  childBirthLocation: z.string().min(1, 'Tempat dilahirkan wajib diisi.'),
  childAddress: z.string().min(1, 'Alamat wajib diisi.'),
  birthType: z.string().default('Tunggal'),
  childOrder: z.string().min(1, 'Kelahiran ke- wajib diisi.'),
  birthAssistant: z.string().min(1, 'Penolong kelahiran wajib diisi.'),
  birthWeight: z.string().min(1, 'Berat bayi wajib diisi.'),
  birthLength: z.string().min(1, 'Panjang bayi wajib diisi.'),

  motherName: z.string().min(1, 'Nama ibu wajib diisi.'),
  motherBirthPlace: z.string().min(1, 'Tempat lahir ibu wajib diisi.'),
  motherBirthDate: z.string().min(1, 'Tanggal lahir ibu wajib diisi.'),
  motherJob: z.string().min(1, 'Pekerjaan ibu wajib diisi.'),
  phone: phoneValidationSchema,
  motherAddress: z.string().min(1, 'Alamat ibu wajib diisi.'),

  fatherNik: z.string().length(16, 'NIK ayah harus 16 digit.'),
  fatherName: z.string().min(1, 'Nama ayah wajib diisi.'),
  fatherBirthPlace: z.string().min(1, 'Tempat lahir ayah wajib diisi.'),
  fatherBirthDate: z.string().min(1, 'Tanggal lahir ayah wajib diisi.'),
  fatherJob: z.string().min(1, 'Pekerjaan ayah wajib diisi.'),
  fatherAddress: z.string().min(1, 'Alamat ayah wajib diisi.'),

  reporterNik: z.string().length(16, 'NIK pelapor harus 16 digit.'),
  reporterName: z.string().min(1, 'Nama pelapor wajib diisi.'),
  reporterAge: z.string().min(1, 'Umur pelapor wajib diisi.'),
  reporterJob: z.string().min(1, 'Pekerjaan pelapor wajib diisi.'),
  reporterAddress: z.string().min(1, 'Alamat pelapor wajib diisi.'),
  reporterRelationship: z.string().default('Ayah'),

  witness1Nik: z.string().length(16, 'NIK saksi 1 harus 16 digit.'),
  witness1Name: z.string().min(1, 'Nama saksi 1 wajib diisi.'),
  witness1Age: z.string().min(1, 'Umur saksi 1 wajib diisi.'),
  witness1Job: z.string().min(1, 'Pekerjaan saksi 1 wajib diisi.'),
  witness1Address: z.string().min(1, 'Alamat saksi 1 wajib diisi.'),

  witness2Nik: z.string().length(16, 'NIK saksi 2 harus 16 digit.'),
  witness2Name: z.string().min(1, 'Nama saksi 2 wajib diisi.'),
  witness2Age: z.string().min(1, 'Umur saksi 2 wajib diisi.'),
  witness2Job: z.string().min(1, 'Pekerjaan saksi 2 wajib diisi.'),
  witness2Address: z.string().min(1, 'Alamat saksi 2 wajib diisi.'),
  purpose: z.string().min(1, 'Keperluan pengajuan surat wajib diisi.'),
});

export function KelahiranForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchingNik, setSearchingNik] = useState<string | null>(null);
  const [filesToUpload, setFilesToUpload] = useState<Array<{ fieldName: string; file: File }>>([]);

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      motherNik: '',
      kkNumber: '',
      childName: '',
      childGender: 'Laki-Laki',
      childNik: '',
      childBirthPlace: 'CILACAP',
      childBirthDate: '',
      childBirthTime: '08:00',
      childBirthLocation: 'Puskesmas',
      childAddress: 'Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap',
      birthType: 'Tunggal',
      childOrder: '1',
      birthAssistant: 'Bidan',
      birthWeight: '3.2',
      birthLength: '49',
      motherName: '',
      motherBirthPlace: '',
      motherBirthDate: '',
      motherJob: '',
      phone: '',
      motherAddress: '',
      fatherNik: '',
      fatherName: '',
      fatherBirthPlace: '',
      fatherBirthDate: '',
      fatherJob: '',
      fatherAddress: '',
      reporterNik: '',
      reporterName: '',
      reporterAge: '',
      reporterJob: '',
      reporterAddress: '',
      reporterRelationship: 'Ayah',
      witness1Nik: '',
      witness1Name: '',
      witness1Age: '',
      witness1Job: '',
      witness1Address: '',
      witness2Nik: '',
      witness2Name: '',
      witness2Age: '',
      witness2Job: '',
      witness2Address: '',
      purpose: 'Pengurusan Akta Kelahiran dan Pembaruan Kartu Keluarga di Disdukcapil',
    },
  });

  const watchMotherNik = form.watch('motherNik');
  const watchFatherNik = form.watch('fatherNik');
  const watchReporterNik = form.watch('reporterNik');
  const watchWitness1Nik = form.watch('witness1Nik');
  const watchWitness2Nik = form.watch('witness2Nik');

  const handleFileSelect = (file: File, fieldName: string) => {
    setFilesToUpload(prev => {
      const filtered = prev.filter(f => f.fieldName !== fieldName);
      return [...filtered, { file, fieldName }];
    });
  };

  const calculateAge = (birthDateStr: string) => {
    try {
      if (!birthDateStr) return '';
      const parts = birthDateStr.split('-');
      if (parts.length !== 3) return '';
      const birthYear = parseInt(parts[2], 10);
      const currentYear = new Date().getFullYear();
      return (currentYear - birthYear).toString();
    } catch {
      return '';
    }
  };

  const handleAutoFill = async (nik: string, prefix: string) => {
    if (nik && nik.length === 16 && firestore) {
      setSearchingNik(prefix);
      try {
        const resident = await getResidentByNik(firestore, nik);
        if (resident) {
          form.setValue(`${prefix}Name` as any, resident.fullName.toUpperCase());

          if (prefix === 'mother' || prefix === 'father') {
            form.setValue(`${prefix}BirthPlace` as any, (resident.placeOfBirth || '').toUpperCase());
            form.setValue(`${prefix}BirthDate` as any, formatDbDateToForm(resident.dateOfBirth));
            if (prefix === 'mother' && (resident as any).telepon) {
              form.setValue('phone', (resident as any).telepon);
            }
          }

          const resKk = resident.noKk || (resident as any).kk || '';
          if (resKk && !form.getValues('kkNumber')) {
            form.setValue('kkNumber', resKk);
          }

          form.setValue(`${prefix}Job` as any, (resident.occupation || '').toUpperCase());
          const fullAddress = `${resident.address || ''}, RT ${resident.rt || ''} RW ${resident.rw || ''}, ${resident.kelurahan || ''}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
          form.setValue(`${prefix}Address` as any, fullAddress);

          if (prefix === 'reporter' || prefix === 'witness1' || prefix === 'witness2') {
            form.setValue(`${prefix}Age` as any, calculateAge(formatDbDateToForm(resident.dateOfBirth)));
          }

          toast({ title: `Data ${prefix.toUpperCase()} Berhasil Dimuat` });
        }
      } catch (e) {
        console.error("Auto-fill error:", e);
      } finally {
        setSearchingNik(null);
      }
    }
  };

  useEffect(() => { handleAutoFill(watchMotherNik, 'mother'); }, [watchMotherNik, firestore]);
  useEffect(() => { handleAutoFill(watchFatherNik, 'father'); }, [watchFatherNik, firestore]);
  useEffect(() => { handleAutoFill(watchReporterNik, 'reporter'); }, [watchReporterNik, firestore]);
  useEffect(() => { handleAutoFill(watchWitness1Nik, 'witness1'); }, [watchWitness1Nik, firestore]);
  useEffect(() => { handleAutoFill(watchWitness2Nik, 'witness2'); }, [watchWitness2Nik, firestore]);

  const generateTicketNumber = () => {
    return `BLS-${Date.now().toString().slice(-6)}`;
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    if (!isAdmin) {
      if (!validatePhoneForSubmission(values.phone, isAdmin)) {
        form.setError('phone', { message: 'Nomor HP / WhatsApp wajib diisi (minimal 9 digit).' });
        return;
      }
      const hasKtp = filesToUpload.some(f => f.fieldName === 'ktpIbu');
      const hasSuratLahir = filesToUpload.some(f => f.fieldName === 'suratRs');
      if (!hasKtp || !hasSuratLahir) {
        toast({ title: "Berkas Belum Lengkap", description: "Mohon unggah foto KTP Ibu dan Surat Lahir.", variant: "destructive" });
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
            targetFileName: `${fileData.fieldName}_${values.motherNik}`,
            fieldName: fileData.fieldName,
          };
        })
      );

      const primaryName = values.reporterName || values.motherName;
      const primaryNik = values.reporterNik || values.motherNik;

      await addSubmission(firestore, {
        ticketNumber: newTicketNumber,
        requesterName: primaryName,
        nik: primaryNik,
        letterType: 'Surat Keterangan Kelahiran',
        purpose: values.purpose,
        formData: {
          ...values,
          fullName: primaryName,
          name: primaryName,
          nik: primaryNik,
          noKk: values.kkNumber || '',
          no_kk: values.kkNumber || '',
          form_no_kk: values.kkNumber || '',
          kkNumber: values.kkNumber || '',
          birthType: values.birthType,
          form_jenis_kelahiran: values.birthType,
          reporterRelationship: values.reporterRelationship,
          form_hubungan_pelapor: values.reporterRelationship,
          phone: values.phone,
          telepon: values.phone,
          form_telepon: values.phone,
        },
        filesToUpload: filesPayload,
        requestorAuthUid: user?.uid,
      });

      setTicketNumber(newTicketNumber);
      setIsSubmitted(true);
      toast({ title: "Pengajuan Berhasil", description: `Nomor tiket Anda: ${newTicketNumber}` });
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({ title: "Gagal Mengajukan", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) return <SubmissionSuccess ticketNumber={ticketNumber} onReset={() => { form.reset(); setFilesToUpload([]); setIsSubmitted(false); }} />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        <FormSection title="Data Ibu (Pemohon)" icon={User}>
          <FormField control={form.control} name="motherNik" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="font-bold">NIK Ibu</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} className="h-12 rounded-xl" />
                  {searchingNik === 'mother' && <Loader2 className="absolute right-4 top-3 h-6 w-6 animate-spin text-primary" />}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="kkNumber" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="font-bold flex items-center justify-between">
                <span>Nomor Kartu Keluarga (KK)</span>
                <span className="text-xs text-slate-400 font-normal">Otomatis jika NIK terdaftar di database</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="3301xxxxxxxxxxxx (16 digit)" {...field} disabled={isSubmitting} maxLength={16} className="h-12 rounded-xl font-mono" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="motherName" render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Ibu</FormLabel>
              <FormControl><Input placeholder="Nama Lengkap" {...field} disabled={isSubmitting} className="uppercase h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="motherBirthPlace" render={({ field }) => (
              <FormItem>
                <FormLabel>Tempat Lahir</FormLabel>
                <FormControl><Input placeholder="Kota" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="motherBirthDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Tgl Lahir</FormLabel>
                <FormControl><Input placeholder="DD-MM-YYYY" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="motherJob" render={({ field }) => (
            <FormItem>
              <FormLabel>Pekerjaan</FormLabel>
              <FormControl><Input placeholder="Pekerjaan" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold">Nomor HP / WhatsApp {isAdmin ? <span className="text-slate-400 font-normal text-xs">(Opsional)</span> : <span className="text-red-500">*</span>}</FormLabel>
              <FormControl><Input placeholder={isAdmin ? "Opsional untuk pengajuan admin" : "Contoh: 081234567890"} {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="motherAddress" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Alamat Sesuai KTP</FormLabel>
              <FormControl><Textarea placeholder="Alamat lengkap" {...field} disabled={isSubmitting} className="uppercase rounded-2xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        <FormSection title="Data Anak" icon={Baby}>
          <FormField control={form.control} name="childName" render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Anak</FormLabel>
              <FormControl><Input placeholder="Nama Lengkap Anak" {...field} disabled={isSubmitting} className="uppercase h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="childGender" render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kelamin</FormLabel>
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
          )} />
          <FormField control={form.control} name="birthType" render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kelahiran</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Pilih Jenis Kelahiran" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Tunggal">1. Tunggal</SelectItem>
                  <SelectItem value="Kembar 2">2. Kembar 2</SelectItem>
                  <SelectItem value="Kembar 3">3. Kembar 3</SelectItem>
                  <SelectItem value="Kembar 4">4. Kembar 4</SelectItem>
                  <SelectItem value="Lainnya">5. Lainnya</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="childBirthPlace" render={({ field }) => (
            <FormItem>
              <FormLabel>Tempat Lahir Anak</FormLabel>
              <FormControl><Input placeholder="CILACAP" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="childBirthDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Tanggal Lahir Anak</FormLabel>
              <FormControl><Input placeholder="DD-MM-YYYY" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="childBirthTime" render={({ field }) => (
            <FormItem>
              <FormLabel>Waktu Lahir</FormLabel>
              <FormControl><Input placeholder="Pukul 08.00 WIB" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="childBirthLocation" render={({ field }) => (
            <FormItem>
              <FormLabel>Tempat Dilahirkan</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Pilih Tempat Lahir" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="RS/RB">1. Rumah Sakit (RS/RB)</SelectItem>
                  <SelectItem value="Puskesmas">2. Puskesmas</SelectItem>
                  <SelectItem value="Polindes">3. Polindes / Klinik / Poskesdes</SelectItem>
                  <SelectItem value="Rumah">4. Rumah</SelectItem>
                  <SelectItem value="Lainnya">5. Lainnya</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="childOrder" render={({ field }) => (
            <FormItem>
              <FormLabel>Kelahiran Ke-</FormLabel>
              <FormControl><Input placeholder="1" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="birthAssistant" render={({ field }) => (
            <FormItem>
              <FormLabel>Penolong Kelahiran</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Pilih Penolong Kelahiran" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Dokter">1. Dokter</SelectItem>
                  <SelectItem value="Bidan">2. Bidan / Perawat</SelectItem>
                  <SelectItem value="Dukun">3. Dukun</SelectItem>
                  <SelectItem value="Lainnya">4. Lainnya</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="birthWeight" render={({ field }) => (
              <FormItem>
                <FormLabel>Berat Bayi</FormLabel>
                <FormControl><Input placeholder="Kg" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="birthLength" render={({ field }) => (
              <FormItem>
                <FormLabel>Panjang Bayi</FormLabel>
                <FormControl><Input placeholder="Cm" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="childAddress" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Alamat Domisili Anak</FormLabel>
              <FormControl><Textarea placeholder="Alamat lengkap" {...field} disabled={isSubmitting} className="uppercase rounded-2xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        <FormSection title="Data Ayah" icon={User}>
          <FormField control={form.control} name="fatherNik" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold">NIK Ayah</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} className="h-12 rounded-xl" />
                  {searchingNik === 'father' && <Loader2 className="absolute right-4 top-3 h-6 w-6 animate-spin text-primary" />}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="fatherName" render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Ayah</FormLabel>
              <FormControl><Input placeholder="Nama Lengkap" {...field} disabled={isSubmitting} className="uppercase h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="fatherBirthPlace" render={({ field }) => (
              <FormItem>
                <FormLabel>Tempat Lahir</FormLabel>
                <FormControl><Input placeholder="Kota" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="fatherBirthDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Lahir</FormLabel>
                <FormControl><Input placeholder="DD-MM-YYYY" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="fatherJob" render={({ field }) => (
            <FormItem>
              <FormLabel>Pekerjaan</FormLabel>
              <FormControl><Input placeholder="Pekerjaan" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="fatherAddress" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Alamat Sesuai KTP</FormLabel>
              <FormControl><Textarea placeholder="Alamat lengkap" {...field} disabled={isSubmitting} className="uppercase rounded-2xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        <FormSection title="Data Pelapor & Keperluan" icon={User}>
          <FormField control={form.control} name="reporterNik" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold">NIK Pelapor</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} className="h-12 rounded-xl" />
                  {searchingNik === 'reporter' && <Loader2 className="absolute right-4 top-3 h-6 w-6 animate-spin text-primary" />}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="reporterName" render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Pelapor</FormLabel>
              <FormControl><Input placeholder="Nama Pelapor" {...field} disabled={isSubmitting} className="uppercase h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="reporterAge" render={({ field }) => (
              <FormItem>
                <FormLabel>Umur</FormLabel>
                <FormControl><Input placeholder="Umur" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="reporterJob" render={({ field }) => (
              <FormItem>
                <FormLabel>Pekerjaan</FormLabel>
                <FormControl><Input placeholder="Pekerjaan" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="reporterAddress" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Alamat</FormLabel>
              <FormControl><Textarea placeholder="Alamat pelapor" {...field} disabled={isSubmitting} className="uppercase rounded-2xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="reporterRelationship" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Hubungan Pelapor dengan Bayi</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Pilih Hubungan dengan Bayi" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Ayah">Ayah Kandung</SelectItem>
                  <SelectItem value="Ibu">Ibu Kandung</SelectItem>
                  <SelectItem value="Kakek">Kakek</SelectItem>
                  <SelectItem value="Nenek">Nenek</SelectItem>
                  <SelectItem value="Saudara Kandung">Saudara Kandung</SelectItem>
                  <SelectItem value="Kuasa">Kuasa / Famili Lain</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="purpose" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="font-bold text-primary">Keperluan Pengajuan Surat *</FormLabel>
              <FormControl><Textarea placeholder="Contoh: Pembuatan Akta Kelahiran Baru dan Penambahan Anggota Keluarga pada KK" {...field} disabled={isSubmitting} className="rounded-2xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        <FormSection title="Data Saksi" icon={Users}>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6 p-6 rounded-2xl border bg-slate-50/50">
              <h4 className="text-sm font-black text-primary uppercase">Saksi I</h4>
              <FormField control={form.control} name="witness1Nik" render={({ field }) => (
                <FormItem>
                  <FormLabel>NIK Saksi I</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="16 digit NIK" {...field} disabled={isSubmitting} maxLength={16} className="h-11 bg-white" />
                      {searchingNik === 'witness1' && <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-primary" />}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="witness1Name" render={({ field }) => (
                <FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input {...field} disabled={isSubmitting} className="h-11 bg-white uppercase" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="witness1Age" render={({ field }) => (
                  <FormItem><FormLabel>Umur</FormLabel><FormControl><Input {...field} disabled={isSubmitting} className="h-11 bg-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="witness1Job" render={({ field }) => (
                  <FormItem><FormLabel>Pekerjaan</FormLabel><FormControl><Input {...field} disabled={isSubmitting} className="h-11 bg-white" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="witness1Address" render={({ field }) => (
                <FormItem><FormLabel>Alamat</FormLabel><FormControl><Textarea {...field} disabled={isSubmitting} className="bg-white uppercase" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="space-y-6 p-6 rounded-2xl border bg-slate-50/50">
              <h4 className="text-sm font-black text-primary uppercase">Saksi II</h4>
              <FormField control={form.control} name="witness2Nik" render={({ field }) => (
                <FormItem>
                  <FormLabel>NIK Saksi II</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="16 digit NIK" {...field} disabled={isSubmitting} maxLength={16} className="h-11 bg-white" />
                      {searchingNik === 'witness2' && <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-primary" />}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="witness2Name" render={({ field }) => (
                <FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input {...field} disabled={isSubmitting} className="h-11 bg-white uppercase" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="witness2Age" render={({ field }) => (
                  <FormItem><FormLabel>Umur</FormLabel><FormControl><Input {...field} disabled={isSubmitting} className="h-11 bg-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="witness2Job" render={({ field }) => (
                  <FormItem><FormLabel>Pekerjaan</FormLabel><FormControl><Input {...field} disabled={isSubmitting} className="h-11 bg-white" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="witness2Address" render={({ field }) => (
                <FormItem><FormLabel>Alamat</FormLabel><FormControl><Textarea {...field} disabled={isSubmitting} className="bg-white uppercase" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </div>
        </FormSection>

        <FormSection title="Unggah Berkas Lampiran" icon={UploadCloud}>
          <div className="col-span-1 md:col-span-2 space-y-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Unggah file format gambar (JPG, PNG) atau PDF. Berkas bertanda * wajib diisi.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
              <GoogleFileUploader label="Foto KTP Ibu" fieldName="ktpIbu" onFileSelect={handleFileSelect} isRequired={!isAdmin} disabled={isSubmitting} />
              <GoogleFileUploader label="Kartu Keluarga" fieldName="kk" onFileSelect={handleFileSelect} disabled={isSubmitting} />
              <GoogleFileUploader label="Surat Lahir (RS/Bidan)" fieldName="suratRs" onFileSelect={handleFileSelect} isRequired={!isAdmin} disabled={isSubmitting} />
            </div>
          </div>
        </FormSection>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all active:scale-95">
          {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Ajukan Surat Keterangan Kelahiran'}
        </Button>
      </form>
    </Form>
  );
}
