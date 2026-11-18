'use client';
import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CalendarIcon, Loader2, Skull, UploadCloud, FileCheck, Clock, MapPin, User, FileText, CheckCircle2 } from 'lucide-react';

import { cn, formatDbDateToForm } from '@/lib/utils';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { SubmissionSuccess } from '../submission-success';
import { addSubmission } from '@/lib/submissions';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getResidentByNik } from '@/lib/residents';

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

const FormSection = ({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) => (
  <div className="space-y-6 rounded-[2rem] border p-6 md:p-10 bg-white shadow-sm">
    <div className="flex items-center gap-3 border-b pb-4">
      {Icon && <Icon className="h-5 w-5 text-primary" />}
      <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
  </div>
);

const formSchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 digit.'),
  noKk: z.string().min(1, 'Nomor KK wajib diisi.'),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  religion: z.string().min(1, 'Agama wajib diisi.'),
  job: z.string().min(1, 'Pekerjaan wajib diisi.'),
  maritalStatus: z.string().min(1, 'Status perkawinan wajib diisi.'),
  nationality: z.string().min(1, 'Kewarganegaraan wajib diisi.'),
  phone: phoneValidationSchema,
  address: z.string().min(1, 'Alamat wajib diisi.'),

  // Kejadian Meninggal Dunia
  deathDate: z.date({ required_error: 'Hari / Tanggal kematian wajib dipilih.' }),
  deathTime: z.string().min(1, 'Waktu / Jam kematian wajib diisi.'),
  deathLocation: z.string().min(1, 'Tempat kematian wajib diisi.'),
  deathCause: z.string().min(1, 'Sebab kematian wajib diisi.'),

  // Pemakaman
  burialDate: z.date({ required_error: 'Hari / Tanggal pemakaman wajib dipilih.' }),
  burialTime: z.string().min(1, 'Waktu pemakaman wajib diisi.'),
  burialLocation: z.string().min(1, 'Tempat pemakaman wajib diisi.'),

  purpose: z.string().min(1, 'Keperluan pengajuan surat wajib diisi.'),
});

export function PemakamanForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<Array<{ fieldName: string; file: File }>>([]);

  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: '',
      noKk: '',
      name: '',
      birthPlace: '',
      birthDate: '',
      gender: 'Laki-Laki',
      religion: 'Islam',
      maritalStatus: 'Kawin',
      job: 'Pensiunan',
      nationality: 'WNI',
      phone: '',
      address: '',
      deathDate: new Date(),
      deathTime: '09.00 WIB',
      deathLocation: 'Rumah Duka',
      deathCause: 'Sakit / Usia Lanjut',
      burialDate: new Date(),
      burialTime: '13.00 WIB (Ba\'da Dzuhur)',
      burialLocation: 'Pemakaman Islam Desa Sampeldes',
      purpose: 'Administrasi Keterangan Pemakaman Jenazah / Pengurusan Hak Ahli Waris',
    },
  });

  const nikValue = form.watch('nik');
  const deathDateValue = form.watch('deathDate');

  useEffect(() => {
    const fetchResident = async () => {
      if (nikValue?.length === 16 && firestore) {
        setIsSearching(true);
        try {
          const resident = await getResidentByNik(firestore, nikValue);
          if (resident) {
            form.setValue('name', resident.fullName.toUpperCase());
            form.setValue('gender', resident.gender || 'Laki-Laki');
            form.setValue('birthPlace', resident.placeOfBirth);
            form.setValue('birthDate', formatDbDateToForm(resident.dateOfBirth));
            form.setValue('religion', resident.religion || 'Islam');
            form.setValue('job', resident.occupation || 'Pensiunan');
            form.setValue('maritalStatus', resident.maritalStatus || 'Kawin');
            const foundKk = (resident as any).noKk || (resident as any).no_kk || (resident as any).familyCardNumber || '';
            if (foundKk) form.setValue('noKk', foundKk);

            const fullAddress = `${resident.address}, RT ${resident.rt} RW ${resident.rw}, ${resident.kelurahan}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
            form.setValue('address', fullAddress);

            toast({ title: "Data Almarhum/ah Ditemukan", description: "Data identitas telah diisi otomatis dari database desa." });
          }
        } catch (error: any) {
          console.error("Auto-fill error:", error);
        } finally {
          setIsSearching(false);
        }
      }
    };
    fetchResident();
  }, [nikValue, firestore, form, toast]);

  const handleFileSelect = (file: File, fieldName: string) => {
    setFilesToUpload(prev => [...prev.filter(f => f.fieldName !== fieldName), { file, fieldName }]);
  };

  const generateTicketNumber = () => {
    return Math.random().toString().substring(2, 8);
  };

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
        toast({ title: "Berkas Belum Lengkap", description: "Mohon unggah foto KTP Almarhum dan KK.", variant: "destructive" });
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
        })
      );

      const deathDateFormatted = values.deathDate
        ? format(values.deathDate, 'EEEE, d MMMM yyyy', { locale: idLocale })
        : '';
      const deathDateIso = values.deathDate ? format(values.deathDate, 'yyyy-MM-dd') : '';

      const burialDateFormatted = values.burialDate
        ? format(values.burialDate, 'EEEE, d MMMM yyyy', { locale: idLocale })
        : deathDateFormatted;
      const burialDateIso = values.burialDate ? format(values.burialDate, 'yyyy-MM-dd') : deathDateIso;

      await addSubmission(firestore, {
        ticketNumber: newTicketNumber,
        requesterName: values.name,
        nik: values.nik,
        letterType: 'Surat Keterangan Pemakaman',
        masterSuratId: 'prm-44',
        urlSurat: 'sistem-surat-keterangan-pemakaman',
        kodeSurat: '474.3',
        formData: {
          ...values,
          masterSuratId: 'prm-44',
          urlSurat: 'sistem-surat-keterangan-pemakaman',
          kodeSurat: '474.3',
          noKk: values.noKk,
          no_kk: values.noKk,
          nomor_kk: values.noKk,
          deathDate: deathDateIso,
          deathDateFormatted,
          tanggal_kematian: deathDateFormatted,
          hari_dan_tanggal_kematian: deathDateFormatted,
          hari_kematian: values.deathDate ? format(values.deathDate, 'EEEE', { locale: idLocale }) : '',
          jam_kematian: values.deathTime,
          waktu_kematian: values.deathTime,
          burialDate: burialDateIso,
          burialDateFormatted,
          tanggal_pemakaman: burialDateFormatted,
          hari_dan_tanggal_pemakaman: burialDateFormatted,
          hari_pemakaman: values.burialDate ? format(values.burialDate, 'EEEE', { locale: idLocale }) : '',
          jam_pemakaman: values.burialTime,
          waktu_pemakaman: values.burialTime,
          tempat_pemakaman: values.burialLocation,
          lokasi_tpu: values.burialLocation,
          form_lokasi_tpu: values.burialLocation,
          phone: values.phone,
          telepon: values.phone,
          form_telepon: values.phone,
        },
        filesToUpload: filesPayload,
      });

      setTicketNumber(newTicketNumber);
      setIsSubmitted(true);
      toast({ title: "Pengajuan Berhasil", description: `Nomor tiket Anda: ${newTicketNumber}` });
    } catch (error: any) {
      toast({ title: "Gagal Mengajukan", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleReset = () => {
    form.reset();
    setIsSubmitted(false);
    setTicketNumber('');
    setFilesToUpload([]);
  };

  if (isSubmitted) {
    return <SubmissionSuccess ticketNumber={ticketNumber} onReset={handleReset} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        {/* ── BAGIAN 1: IDENTITAS ALMARHUM / ALMARHUMAH ── */}
        <FormSection title="Identitas Almarhum / Almarhumah" icon={Skull}>
          <FormField control={form.control} name="nik" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="font-bold text-primary">NIK Almarhum / Almarhumah (Jenazah) *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} className="h-12 rounded-xl text-base font-medium" />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Ketik 16 digit NIK untuk otomatis mencari data penduduk dari database Desa.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Nama Lengkap Jenazah *</FormLabel>
              <FormControl><Input {...field} disabled={isSubmitting} className="uppercase h-12 rounded-xl font-bold" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="noKk" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Nomor Kartu Keluarga (KK) *</FormLabel>
              <FormControl><Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="birthPlace" render={({ field }) => (
              <FormItem>
                <FormLabel>Tempat Lahir</FormLabel>
                <FormControl><Input {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="birthDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Tgl Lahir</FormLabel>
                <FormControl><Input placeholder="DD-MM-YYYY" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="gender" render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kelamin</FormLabel>
              <FormControl><Input placeholder="LAKI-LAKI / PEREMPUAN" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="religion" render={({ field }) => (
            <FormItem>
              <FormLabel>Agama</FormLabel>
              <FormControl><Input placeholder="Islam" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="job" render={({ field }) => (
            <FormItem>
              <FormLabel>Pekerjaan</FormLabel>
              <FormControl><Input placeholder="Pensiunan / Wiraswasta" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="maritalStatus" render={({ field }) => (
            <FormItem>
              <FormLabel>Status Perkawinan</FormLabel>
              <FormControl><Input placeholder="KAWIN / CERAI MATI" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold">Nomor HP / WhatsApp Pelapor {isAdmin ? <span className="text-slate-400 font-normal text-xs">(Opsional)</span> : <span className="text-red-500">*</span>}</FormLabel>
              <FormControl><Input placeholder={isAdmin ? "Opsional untuk pengajuan admin" : "Contoh: 081234567890"} {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="font-semibold">Alamat Lengkap KTP</FormLabel>
              <FormControl><Textarea {...field} disabled={isSubmitting} className="uppercase rounded-2xl min-h-[80px]" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        {/* ── BAGIAN 2: KEJADIAN MENINGGAL DUNIA & PEMAKAMAN ── */}
        <FormSection title="Kejadian Meninggal Dunia & Pemakaman" icon={Clock}>
          {/* Kalender Modern: Hari / Tanggal Kematian */}
          <FormField control={form.control} name="deathDate" render={({ field }) => (
            <FormItem className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <FormLabel className="font-bold text-slate-800">Hari / Tanggal Kematian *</FormLabel>
                {field.value && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {format(field.value, 'EEEE', { locale: idLocale })}
                  </span>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full h-12 rounded-xl pl-4 pr-3 text-left font-medium border-slate-200 hover:border-primary/60 bg-white transition-all shadow-sm flex items-center justify-between group',
                        !field.value && 'text-muted-foreground'
                      )}
                      disabled={isSubmitting}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <CalendarIcon className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="truncate">
                          {field.value ? format(field.value, 'EEEE, d MMMM yyyy', { locale: idLocale }) : 'Pilih Hari / Tanggal Kematian'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md shrink-0">
                        Ubah
                      </span>
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4 rounded-3xl border border-slate-200/80 shadow-2xl bg-white z-50 space-y-3" align="start">
                  {/* Header Popover Kalender Modern */}
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">Pilih Tanggal</span>
                    <span className="text-xs font-semibold text-primary">
                      {field.value ? format(field.value, 'd MMM yyyy', { locale: idLocale }) : 'Hari Ini'}
                    </span>
                  </div>

                  {/* Tombol Pintas Tanggal Cepat */}
                  <div className="grid grid-cols-3 gap-1.5 pb-1">
                    <button
                      type="button"
                      onClick={() => field.onChange(new Date())}
                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange(subDays(new Date(), 1))}
                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                    >
                      Kemarin
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange(subDays(new Date(), 2))}
                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                    >
                      2 Hari Lalu
                    </button>
                  </div>

                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(date);
                        // Otomatis sinkronkan tanggal pemakaman jika tanggal pemakaman masih sebelum tanggal kematian
                        const currentBurial = form.getValues('burialDate');
                        if (!currentBurial || currentBurial < date) {
                          form.setValue('burialDate', date);
                        }
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="rounded-2xl border-0 p-0"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="deathTime" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold text-slate-800">Waktu Meninggal *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="Contoh: 09.00 WIB" {...field} disabled={isSubmitting} className="h-12 rounded-xl pl-10" />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="deathLocation" render={({ field }) => (
            <FormItem>
              <FormLabel>Tempat Kematian</FormLabel>
              <FormControl><Input placeholder="Contoh: Rumah Duka / RSUD" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="deathCause" render={({ field }) => (
            <FormItem>
              <FormLabel>Sebab Kematian</FormLabel>
              <FormControl><Input placeholder="Contoh: Sakit / Usia Lanjut" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Kalender Modern: Dimakamkan Pada (Hari & Tanggal Pemakaman) */}
          <FormField control={form.control} name="burialDate" render={({ field }) => (
            <FormItem className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <FormLabel className="font-bold text-slate-800">Dimakamkan Pada (Hari & Tanggal) *</FormLabel>
                {field.value && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {format(field.value, 'EEEE', { locale: idLocale })}
                  </span>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full h-12 rounded-xl pl-4 pr-3 text-left font-medium border-slate-200 hover:border-primary/60 bg-white transition-all shadow-sm flex items-center justify-between group',
                        !field.value && 'text-muted-foreground'
                      )}
                      disabled={isSubmitting}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <CalendarIcon className="h-4 w-4 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="truncate">
                          {field.value ? format(field.value, 'EEEE, d MMMM yyyy', { locale: idLocale }) : 'Pilih Hari / Tanggal Pemakaman'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md shrink-0">
                        Ubah
                      </span>
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4 rounded-3xl border border-slate-200/80 shadow-2xl bg-white z-50 space-y-3" align="start">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">Tanggal Pemakaman</span>
                    <span className="text-xs font-semibold text-blue-600">
                      {field.value ? format(field.value, 'd MMM yyyy', { locale: idLocale }) : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pb-1">
                    <button
                      type="button"
                      onClick={() => field.onChange(deathDateValue || new Date())}
                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-colors"
                    >
                      Sama Hari Kematian
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange(new Date())}
                      className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                    >
                      Hari Ini
                    </button>
                  </div>

                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      if (date) field.onChange(date);
                    }}
                    initialFocus
                    className="rounded-2xl border-0 p-0"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="burialTime" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold text-slate-800">Waktu Pemakaman *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="Contoh: 13.00 WIB (Ba'da Dzuhur)" {...field} disabled={isSubmitting} className="h-12 rounded-xl pl-10" />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="burialLocation" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="font-bold text-slate-800">Tempat Pemakaman *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="Contoh: Pemakaman Islam Desa Sampeldes" {...field} disabled={isSubmitting} className="h-12 rounded-xl pl-10" />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Sesuai format surat: Pemakaman Islam Desa [Nama Desa] atau nama TPU setempat.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="purpose" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="font-bold text-primary">Keperluan Pengajuan Surat *</FormLabel>
              <FormControl><Input placeholder="Contoh: Administrasi Keterangan Pemakaman Jenazah / Klaim Santunan" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        {/* ── BAGIAN 3: BERKAS LAMPIRAN ── */}
        <FormSection title="Unggah Berkas Lampiran" icon={UploadCloud}>
          <div className="col-span-1 md:col-span-2 space-y-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Unggah file format gambar (JPG, PNG) atau PDF. Berkas bertanda * wajib diisi untuk verifikasi data pemohon.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
              <GoogleFileUploader label="Foto KTP Almarhum/ah" fieldName="ktp" onFileSelect={handleFileSelect} isRequired={!isAdmin} disabled={isSubmitting} />
              <GoogleFileUploader label="Foto Kartu Keluarga (KK)" fieldName="kk" onFileSelect={handleFileSelect} isRequired={!isAdmin} disabled={isSubmitting} />
              <GoogleFileUploader label="Surat Kematian RS / Bidan" fieldName="suratKematian" onFileSelect={handleFileSelect} isRequired={false} disabled={isSubmitting} />
            </div>
          </div>
        </FormSection>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all active:scale-95">
          {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Ajukan Surat Keterangan Pemakaman'}
        </Button>
      </form>
    </Form>
  );
}
