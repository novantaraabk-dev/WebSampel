'use client';
import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Navigation, User, MapPin, Calendar, FileCheck, Paperclip, Search, CheckCircle2 } from 'lucide-react';

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
import { formatTanggalIndonesia } from '@/lib/opensid-surat-engine';

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
  nik: z.string().length(16, 'NIK harus 16 digit angka'),
  name: z.string().min(1, 'Nama lengkap wajib diisi'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi'),
  maritalStatus: z.string().min(1, 'Status perkawinan wajib diisi'),
  job: z.string().min(1, 'Pekerjaan wajib diisi'),
  religion: z.string().min(1, 'Agama wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),

  // Rincian Bepergian / Perjalanan
  departureDate: z.string().min(1, 'Tanggal keberangkatan wajib diisi'),
  destinationAddress: z.string().min(1, 'Alamat yang dituju wajib diisi lengkap'),
  purpose: z.string().min(1, 'Keperluan bepergian wajib diisi'),

  // Field opsional / kompatibilitas tambahan
  destinationCity: z.string().optional(),
  validUntil: z.string().optional(),
  followers: z.string().optional(),
  goodsCarried: z.string().optional(),

  whatsapp: phoneValidationSchema,
});

type FormValues = z.infer<typeof formSchema>;

export function SuratJalanForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingResident, setIsSearchingResident] = useState(false);
  const [files, setFiles] = useState<{ [key: string]: File }>({});
  const [fileErrors, setFileErrors] = useState<{ [key: string]: string }>({});
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: '',
      name: '',
      gender: 'Laki-Laki',
      birthPlace: '',
      birthDate: '',
      maritalStatus: 'Belum Kawin',
      job: '',
      religion: 'Islam',
      address: '',
      departureDate: new Date().toISOString().split('T')[0],
      destinationAddress: '',
      purpose: 'Bekerja',
      destinationCity: '',
      validUntil: '',
      followers: '',
      goodsCarried: '',
      whatsapp: '',
    },
  });

  const nikValue = form.watch('nik');
  const departureDateValue = form.watch('departureDate');
  const birthDateValue = form.watch('birthDate');

  const fetchResidentData = async (nikToFetch: string) => {
    if (!nikToFetch || nikToFetch.length !== 16 || !firestore) return;
    setIsSearchingResident(true);
    try {
      const res = await getResidentByNik(firestore, nikToFetch);
      if (res) {
        if (res.fullName) form.setValue('name', res.fullName.toUpperCase());
        if (res.gender) form.setValue('gender', res.gender.toLowerCase().includes('perempuan') ? 'Perempuan' : 'Laki-Laki');
        if (res.placeOfBirth) form.setValue('birthPlace', res.placeOfBirth);
        if (res.dateOfBirth) form.setValue('birthDate', formatDbDateToForm(res.dateOfBirth));
        if (res.occupation) form.setValue('job', res.occupation);
        if (res.maritalStatus) form.setValue('maritalStatus', res.maritalStatus);
        if (res.religion) form.setValue('religion', res.religion);
        
        const fullAddress = `${res.address || ''} RT ${res.rt || '00'}/RW ${res.rw || '00'} Dusun ${res.dusun || ''}, Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap`.replace(/\s+/g, ' ').trim();
        form.setValue('address', fullAddress || form.getValues('address'));
        
        if ((res as any).telepon) form.setValue('whatsapp', (res as any).telepon);

        toast({
          title: 'Data Penduduk Ditemukan',
          description: `Data berhasil diisi otomatis untuk ${res.fullName}`,
        });
      } else {
        toast({
          title: 'Penduduk Tidak Ditemukan',
          description: 'NIK tidak ditemukan di database penduduk, silakan isi formulir secara manual.',
          variant: 'default',
        });
      }
    } catch (e: any) {
      console.error('Error fetching resident:', e);
    } finally {
      setIsSearchingResident(false);
    }
  };

  useEffect(() => {
    if (nikValue && nikValue.length === 16 && firestore) {
      fetchResidentData(nikValue);
    }
  }, [nikValue, firestore]);

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
          description: 'Mohon unggah dokumen KTP pemohon.',
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

      const effectiveDestination = values.destinationAddress || values.destinationCity || '';

      await addSubmission(firestore, {
        ticketNumber: generatedTicket,
        requesterName: values.name.toUpperCase(),
        nik: values.nik,
        letterType: 'Surat Keterangan Jalan',
        formData: {
          ...values,
          name: values.name.toUpperCase(),
          nama: values.name.toUpperCase(),
          destinationAddress: effectiveDestination,
          destinationCity: effectiveDestination,
          alamatYangDituju: effectiveDestination,
          alamat_tujuan: effectiveDestination,
          form_alamat_tujuan: effectiveDestination,
          departureDate: values.departureDate,
          tanggalBerangkat: values.departureDate,
          form_tanggal_berangkat: values.departureDate,
          purpose: values.purpose,
          keperluan: values.purpose,
          form_keperluan: values.purpose,
          maritalStatus: values.maritalStatus,
          statusPerkawinan: values.maritalStatus,
          status_kawin: values.maritalStatus,
          religion: values.religion,
          agama: values.religion,
          phone: values.whatsapp,
          telepon: values.whatsapp,
          form_telepon: values.whatsapp,
          masterSuratId: 'prm-42',
          urlSurat: 'sistem-surat-keterangan-bepergian',
          kodeSurat: '470',
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

  // Indonesian format preview for dates
  const departureDateIndo = departureDateValue ? formatTanggalIndonesia(departureDateValue) : '';
  const birthDateIndo = birthDateValue ? formatTanggalIndonesia(birthDateValue) : '';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-700">
          <Navigation className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Surat Keterangan Jalan / Berpergian</h2>
          <p className="text-sm text-slate-500">
            Penerbitan surat jalan / bepergian resmi sesuai standar OpenSID &amp; regulasi kedinasan
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Identitas Pemohon */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" /> 1. Identitas Pemohon / Pelaku Perjalanan
              </h3>
              {nikValue?.length === 16 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchResidentData(nikValue)}
                  disabled={isSearchingResident}
                  className="text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 gap-1 h-8 px-2"
                >
                  {isSearchingResident ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Cari Ulang Penduduk
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      NIK Pemohon (16 Digit) <span className="text-red-500">*</span>
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Masukkan 16 digit NIK..."
                          maxLength={16}
                          {...field}
                          className="font-mono text-base tracking-wider pr-10"
                        />
                      </FormControl>
                      {isSearchingResident && (
                        <div className="absolute right-3 top-2.5 text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      )}
                    </div>
                    <FormDescription className="text-xs text-slate-500">
                      Data otomatis terisi jika NIK terdaftar di sistem desa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: BASUNI DANI FAJAR FAUZI"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        className="font-bold uppercase"
                      />
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
                    <FormLabel className="font-semibold text-slate-700">
                      Jenis Kelamin <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
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

              <FormField
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      Status Perkawinan <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Pilih Status Perkawinan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Belum Kawin">Belum Kawin</SelectItem>
                        <SelectItem value="Kawin">Kawin</SelectItem>
                        <SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem>
                        <SelectItem value="Cerai Mati">Cerai Mati</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      Tempat Lahir <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Lamongan" {...field} />
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
                    <FormLabel className="font-semibold text-slate-700 flex items-center justify-between">
                      <span>Tanggal Lahir <span className="text-red-500">*</span></span>
                      {birthDateIndo && (
                        <span className="text-xs text-teal-600 font-normal">
                          {birthDateIndo}
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="cursor-pointer bg-white"
                        {...field}
                      />
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
                    <FormLabel className="font-semibold text-slate-700">
                      Pekerjaan <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Wiraswasta / Karyawan Swasta / -" {...field} />
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
                    <FormLabel className="font-semibold text-slate-700">
                      Agama <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">
                    Alamat Lengkap Asal (Domisili / KTP) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Dusun Sampeldes RT 001 RW 002, Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Rincian Perjalanan */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" /> 2. Rincian Perjalanan &amp; Alamat Tujuan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departureDate"
                render={({ field }) => (
                  <FormItem className="rounded-xl border border-teal-100 bg-teal-50/30 p-3.5">
                    <FormLabel className="font-bold text-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-teal-600" />
                        Tanggal Berangkat <span className="text-red-500">*</span>
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="cursor-pointer bg-white text-base font-semibold shadow-sm mt-1"
                        {...field}
                      />
                    </FormControl>
                    {departureDateIndo && (
                      <p className="text-xs text-teal-700 font-medium flex items-center gap-1 mt-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Terformat: <strong>{departureDateIndo}</strong>
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/40">
                    <FormLabel className="font-bold text-slate-800">
                      Keperluan / Maksud Bepergian <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Bekerja / Silaturahmi Keluarga / Berobat"
                        className="bg-white mt-1"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['Bekerja', 'Silaturahmi Keluarga', 'Urusan Bisnis', 'Berobat Medis', 'Menengok Keluarga'].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => form.setValue('purpose', chip)}
                          className={cn(
                            "px-2 py-0.5 text-[11px] rounded-md border transition-all",
                            form.watch('purpose') === chip
                              ? "bg-teal-600 text-white border-teal-600"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="destinationAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">
                    Alamat Yang Dituju (Lengkap) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Br. Babakan, Desa Canggu, Kecamatan Kuta Utara, Kabupaten Badung, Bali"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-slate-500">
                    Tuliskan nama jalan/dusun/banjar, desa/kelurahan, kecamatan, kab/kota, dan provinsi tujuan bepergian.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Kontak & Berkas */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-600" /> 3. Kontak &amp; Persyaratan Berkas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      Nomor WhatsApp Aktif {isAdmin ? <span className="text-slate-400 font-normal text-xs">(Opsional)</span> : <span className="text-red-500">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={isAdmin ? "081234567890 (opsional admin)" : "081234567890"} {...field} />
                    </FormControl>
                    <FormDescription className="text-xs text-slate-500">
                      Untuk notifikasi status verifikasi surat.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isAdmin && (
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
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full py-6 text-base font-bold bg-teal-600 hover:bg-teal-700 shadow-md">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Memproses Permohonan Surat Jalan...
              </>
            ) : (
              'Kirim Permohonan Surat Keterangan Jalan'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
