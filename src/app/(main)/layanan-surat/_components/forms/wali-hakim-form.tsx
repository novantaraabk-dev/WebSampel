'use client';

import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, UploadCloud, FileCheck, User, Users, HeartHandshake, Scale } from 'lucide-react';

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
              <div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
                <FileCheck className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{fileName}</p>
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Berkas Terpilih</span>
            </>
          ) : (
            <>
              <div className="p-2 rounded-full bg-slate-100 text-slate-400 group-hover:scale-110 transition-transform">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-600">Klik untuk unggah berkas</p>
              <span className="text-[10px] text-slate-400">JPG, PNG, atau PDF (Maks. 2MB)</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const formSchema = z.object({
  // Calon Mempelai Wanita (Pemohon)
  nik: z.string().length(16, 'NIK Calon Mempelai Wanita harus 16 digit.'),
  name: z.string().min(1, 'Nama lengkap calon mempelai wanita wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  religion: z.string().min(1, 'Agama wajib diisi.'),
  job: z.string().optional(),
  address: z.string().min(1, 'Alamat lengkap tempat tinggal wajib diisi.'),
  phone: phoneValidationSchema,

  // Calon Mempelai Pria (Calon Suami)
  groomNik: z.string().optional(),
  groomName: z.string().min(1, 'Nama lengkap calon suami wajib diisi.'),
  groomBirthPlace: z.string().min(1, 'Tempat lahir calon suami wajib diisi.'),
  groomBirthDate: z.string().min(1, 'Tanggal lahir calon suami wajib diisi.'),
  groomReligion: z.string().min(1, 'Agama calon suami wajib diisi.'),
  groomJob: z.string().optional(),
  groomAddress: z.string().min(1, 'Alamat lengkap tempat tinggal calon suami wajib diisi.'),

  // Keterangan Wali Hakim & KUA
  waliReason: z.string().min(1, 'Keterangan susunan wali / alasan wali hakim wajib diisi.'),
  kuaLocation: z.string().min(1, 'Lokasi KUA tujuan nikah wajib diisi.'),
  purpose: z.string().min(1, 'Keperluan surat wajib diisi.'),
});

export function WaliHakimForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingBride, setIsSearchingBride] = useState(false);
  const [isSearchingGroom, setIsSearchingGroom] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<Array<{ fieldName: string; file: File }>>([]);

  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: '',
      name: '',
      birthPlace: '',
      birthDate: '',
      religion: 'Islam',
      job: 'Mengurus Rumah Tangga',
      address: '',
      phone: '',

      groomNik: '',
      groomName: '',
      groomBirthPlace: '',
      groomBirthDate: '',
      groomReligion: 'Islam',
      groomJob: 'Wiraswasta',
      groomAddress: '',

      waliReason: 'susunan wali, Nikah untuk mempelai wanita sudah habis barisan wali/Tidak ada, maka untuk melangsungkan pernikahannya dengan memakai WALI HAKIM.',
      kuaLocation: 'KUA Kecamatan Gandrungmangu',
      purpose: 'Permohonan Pengantar Wali Hakim Pendaftaran Nikah di KUA',
    },
  });

  const handleNikLookupBride = async (nikValue: string) => {
    if (nikValue.length !== 16 || !firestore) return;
    setIsSearchingBride(true);
    try {
      const resident = await getResidentByNik(firestore, nikValue);
      if (resident) {
        form.setValue('name', resident.fullName);
        if (resident.placeOfBirth) form.setValue('birthPlace', resident.placeOfBirth);
        if (resident.dateOfBirth) form.setValue('birthDate', formatDbDateToForm(resident.dateOfBirth));
        if (resident.religion) form.setValue('religion', resident.religion);
        if (resident.occupation) form.setValue('job', resident.occupation);
        if (resident.address) {
          const fullAddress = `${resident.address}${resident.rt ? `, RT ${resident.rt}` : ''}${resident.rw ? `/RW ${resident.rw}` : ''}, Desa Sampeldes, Kec. Gandrungmangu`;
          form.setValue('address', fullAddress);
        }
        toast({ title: 'Data Mempelai Ditemukan', description: `Data kependudukan ${resident.fullName} berhasil dimuat.` });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingBride(false);
    }
  };

  const handleNikLookupGroom = async (nikValue: string) => {
    if (nikValue.length !== 16 || !firestore) return;
    setIsSearchingGroom(true);
    try {
      const resident = await getResidentByNik(firestore, nikValue);
      if (resident) {
        form.setValue('groomName', resident.fullName);
        if (resident.placeOfBirth) form.setValue('groomBirthPlace', resident.placeOfBirth);
        if (resident.dateOfBirth) form.setValue('groomBirthDate', formatDbDateToForm(resident.dateOfBirth));
        if (resident.religion) form.setValue('groomReligion', resident.religion);
        if (resident.occupation) form.setValue('groomJob', resident.occupation);
        if (resident.address) {
          const fullAddress = `${resident.address}${resident.rt ? `, RT ${resident.rt}` : ''}${resident.rw ? `/RW ${resident.rw}` : ''}, Desa Sampeldes, Kec. Gandrungmangu`;
          form.setValue('groomAddress', fullAddress);
        }
        toast({ title: 'Data Calon Suami Ditemukan', description: `Data kependudukan ${resident.fullName} berhasil dimuat.` });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingGroom(false);
    }
  };

  const handleFileSelect = (file: File, fieldName: string) => {
    setFilesToUpload((prev) => {
      const filtered = prev.filter((item) => item.fieldName !== fieldName);
      return [...filtered, { fieldName, file }];
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    if (!isAdmin) {
      if (!validatePhoneForSubmission(values.phone, isAdmin)) {
        form.setError('phone', { message: 'Nomor HP / WhatsApp wajib diisi (minimal 9 digit).' });
        return;
      }
      if (!filesToUpload.some((f) => f.fieldName === 'ktp')) {
        toast({ title: 'Berkas Belum Lengkap', description: 'Mohon unggah KTP Calon Mempelai Wanita.', variant: 'destructive' });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const newTicketNumber = `TKT-${Date.now().toString().slice(-6)}`;
      const filesPayload = await Promise.all(
        filesToUpload.map(async (item) => {
          const base64Data = await convertFileToBase64(item.file);
          return {
            base64Data,
            mimeType: item.file.type,
            targetFileName: `${item.fieldName}_${values.nik}`,
            fieldName: item.fieldName,
          };
        }),
      );

      const openSidPelakuBagian = {
        individu: {
          nik: values.nik,
          nama: values.name,
          jenis_kelamin: 'Perempuan',
          tempat_lahir: values.birthPlace,
          tanggal_lahir: values.birthDate,
          agama: values.religion,
          pekerjaan: values.job || 'Mengurus Rumah Tangga',
          alamat: values.address,
        },
        pasangan: {
          nik: values.groomNik || '-',
          nama: values.groomName,
          jenis_kelamin: 'Laki-laki',
          tempat_lahir: values.groomBirthPlace,
          tanggal_lahir: values.groomBirthDate,
          agama: values.groomReligion,
          pekerjaan: values.groomJob || 'Wiraswasta',
          alamat: values.groomAddress,
        },
      };

      await addSubmission(firestore, {
        ticketNumber: newTicketNumber,
        requesterName: values.name,
        nik: values.nik,
        letterType: 'Surat Keterangan Wali Hakim',
        formData: {
          ...values,
          letterType: 'Surat Keterangan Wali Hakim',
          openSidPelakuBagian,
          phone: values.phone,
          telepon: values.phone,
          // Mapping Calon Mempelai Wanita
          form_nama_calon_istri: values.name,
          form_ttl_calon_istri: `${values.birthPlace} ${values.birthDate}`,
          form_agama_calon_istri: values.religion,
          form_alamat_calon_istri: values.address,
          // Mapping Calon Mempelai Pria
          form_nama_calon_suami: values.groomName,
          form_nama_calon_pasangan: values.groomName,
          form_ttl_calon_suami: `${values.groomBirthPlace} ${values.groomBirthDate}`,
          form_agama_calon_suami: values.groomReligion,
          form_alamat_calon_suami: values.groomAddress,
          // Keterangan & KUA
          form_keterangan_wali_hakim: values.waliReason,
          form_alasan_wali_hakim: values.waliReason,
          form_kua_tujuan: values.kuaLocation,
          form_keperluan: values.purpose,
        },
        filesToUpload: filesPayload,
      });

      setTicketNumber(newTicketNumber);
      setIsSubmitted(true);
      toast({ title: 'Pengajuan Berhasil', description: `Nomor tiket Anda: ${newTicketNumber}` });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Gagal Mengajukan Surat', description: e?.message || 'Terjadi kesalahan sistem.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {/* SECTION 1: CALON MEMPELAI WANITA */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200 dark:border-stone-800">
            <User className="w-5 h-5 text-rose-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
              1. Identitas Calon Mempelai Wanita (Pemohon)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    NIK Calon Mempelai Wanita *
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="330110xxxxxxxxxx"
                        maxLength={16}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (e.target.value.length === 16) handleNikLookupBride(e.target.value);
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleNikLookupBride(field.value)}
                      disabled={isSearchingBride || field.value.length !== 16}
                    >
                      {isSearchingBride ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cek NIK'}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Nama Lengkap Calon Mempelai Wanita *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nama sesuai KTP-el" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="birthPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Tempat Lahir *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Bandung" {...field} />
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
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Tanggal Lahir *
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="religion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Agama *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Agama" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Islam">Islam</SelectItem>
                      <SelectItem value="Kristen">Kristen</SelectItem>
                      <SelectItem value="Katolik">Katolik</SelectItem>
                      <SelectItem value="Hindu">Hindu</SelectItem>
                      <SelectItem value="Buddha">Buddha</SelectItem>
                      <SelectItem value="Konghucu">Konghucu</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Alamat Lengkap Calon Mempelai Wanita *
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Jl. Peta No. 10 RT 05/RW 03..." rows={2} {...field} />
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
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Nomor WhatsApp / HP {!isAdmin && '*'}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="08xxxxxxxxxx" {...field} />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Digunakan untuk konfirmasi dan update status surat via WhatsApp.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* SECTION 2: CALON MEMPELAI PRIA */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200 dark:border-stone-800">
            <HeartHandshake className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
              2. Identitas Calon Mempelai Laki-laki (Calon Suami)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="groomNik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    NIK Calon Suami (Opsional jika luar desa)
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="330110xxxxxxxxxx"
                        maxLength={16}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (e.target.value.length === 16) handleNikLookupGroom(e.target.value);
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => field.value && handleNikLookupGroom(field.value)}
                      disabled={isSearchingGroom || !field.value || field.value.length !== 16}
                    >
                      {isSearchingGroom ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cek'}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="groomName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Nama Lengkap Calon Suami *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: AHDI MUQSITH" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="groomBirthPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Tempat Lahir Calon Suami *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: RUMBAI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="groomBirthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Tanggal Lahir Calon Suami *
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="groomReligion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Agama Calon Suami *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Agama" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Islam">Islam</SelectItem>
                      <SelectItem value="Kristen">Kristen</SelectItem>
                      <SelectItem value="Katolik">Katolik</SelectItem>
                      <SelectItem value="Hindu">Hindu</SelectItem>
                      <SelectItem value="Buddha">Buddha</SelectItem>
                      <SelectItem value="Konghucu">Konghucu</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="groomAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  Alamat Lengkap Calon Suami *
                </FormLabel>
                <FormControl>
                  <Textarea placeholder="Contoh: BILLY & MOON BLOK CE II/15A RT -009/010 PONDOK KELAPA" rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* SECTION 3: KETERANGAN WALI HAKIM & KUA */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200 dark:border-stone-800">
            <Scale className="w-5 h-5 text-amber-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
              3. Keterangan Penggunaan Wali Hakim &amp; KUA Tujuan
            </h3>
          </div>

          <FormField
            control={form.control}
            name="waliReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  Keterangan Susunan Wali / Alasan Memakai Wali Hakim *
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Tuliskan keterangan wali..."
                    {...field}
                  />
                </FormControl>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[11px] font-semibold text-stone-500">Opsi Cepat:</span>
                  <button
                    type="button"
                    onClick={() => form.setValue('waliReason', 'susunan wali, Nikah untuk mempelai wanita sudah habis barisan wali/Tidak ada, maka untuk melangsungkan pernikahannya dengan memakai WALI HAKIM.')}
                    className="text-[10px] bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-700 dark:text-stone-300 transition-colors"
                  >
                    Habis Barisan Wali / Tidak Ada
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setValue('waliReason', 'Wali nasab telah meninggal dunia seluruhnya dan tidak ada wali aqrab maupun ab\'ad yang sah menurut hukum Islam, maka untuk melangsungkan pernikahan menggunakan WALI HAKIM.')}
                    className="text-[10px] bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-700 dark:text-stone-300 transition-colors"
                  >
                    Wali Nasab Meninggal Seluruhnya
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setValue('waliReason', 'Wali nasab berhalangan / tidak diketahui keberadaannya (mafqud / ghaib), maka untuk melangsungkan pernikahannya dengan memakai WALI HAKIM.')}
                    className="text-[10px] bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-700 dark:text-stone-300 transition-colors"
                  >
                    Wali Ghaib / Mafqud
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="kuaLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    KUA Kecamatan Tujuan *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: KUA Kecamatan Gandrungmangu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Keperluan Pengajuan Surat *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Pengantar Rekomendasi Wali Hakim KUA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* SECTION 4: UNGGAH BERKAS PERSYARATAN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200 dark:border-stone-800">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
              4. Berkas Persyaratan {!isAdmin && '(Wajib Diunggah)'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GoogleFileUploader
              label="KTP Calon Mempelai Wanita"
              fieldName="ktp"
              onFileSelect={handleFileSelect}
              isRequired={!isAdmin}
            />
            <GoogleFileUploader
              label="Kartu Keluarga (KK)"
              fieldName="kk"
              onFileSelect={handleFileSelect}
              isRequired={!isAdmin}
            />
            <GoogleFileUploader
              label="KTP Calon Suami / Surat Pengantar"
              fieldName="lampiran_tambahan"
              onFileSelect={handleFileSelect}
              isRequired={false}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
          <Button
            type="submit"
            className="w-full sm:w-auto px-8 h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-900/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan Pengajuan...
              </>
            ) : (
              'Kirim Pengajuan Surat'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

