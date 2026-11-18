'use client';
import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, FileText, User, UserCheck, ShieldCheck, CheckCircle2, Search, Paperclip, PlusCircle, Trash2 } from 'lucide-react';

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
  // Pihak Pemberi Kuasa
  grantorNik: z.string().length(16, 'NIK harus 16 digit angka'),
  grantorName: z.string().min(1, 'Nama pemberi kuasa wajib diisi'),
  grantorBirthPlace: z.string().min(1, 'Tempat lahir wajib diisi'),
  grantorBirthDate: z.string().min(1, 'Tanggal lahir wajib diisi'),
  grantorPosition: z.string().min(1, 'Jabatan pemberi kuasa wajib diisi'),
  grantorAddress: z.string().min(1, 'Alamat pemberi kuasa wajib diisi'),

  // Pelimpahan Kuasa & Keperluan
  powerScope: z.string().min(1, 'Keperluan / lingkup kuasa wajib diisi'),
  granteePositionLabel: z.string().optional(),

  // Pihak Penerima Kuasa 1
  grantee1Nik: z.string().optional(),
  grantee1Name: z.string().min(1, 'Nama penerima kuasa 1 wajib diisi'),
  grantee1BirthPlace: z.string().min(1, 'Tempat lahir penerima kuasa 1 wajib diisi'),
  grantee1BirthDate: z.string().min(1, 'Tanggal lahir penerima kuasa 1 wajib diisi'),
  grantee1Position: z.string().min(1, 'Jabatan penerima kuasa 1 wajib diisi'),
  grantee1Address: z.string().min(1, 'Alamat penerima kuasa 1 wajib diisi'),

  // Pihak Penerima Kuasa 2 (Opsional)
  hasSecondGrantee: z.boolean().default(true),
  grantee2Nik: z.string().optional(),
  grantee2Name: z.string().optional(),
  grantee2BirthPlace: z.string().optional(),
  grantee2BirthDate: z.string().optional(),
  grantee2Position: z.string().optional(),
  grantee2Address: z.string().optional(),

  whatsapp: phoneValidationSchema,
});

type FormValues = z.infer<typeof formSchema>;

export function SuratKuasaForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchingGrantor, setSearchingGrantor] = useState(false);
  const [searchingGrantee1, setSearchingGrantee1] = useState(false);
  const [searchingGrantee2, setSearchingGrantee2] = useState(false);
  const [files, setFiles] = useState<{ [key: string]: File }>({});
  const [fileErrors, setFileErrors] = useState<{ [key: string]: string }>({});
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grantorNik: '',
      grantorName: '',
      grantorBirthPlace: '',
      grantorBirthDate: '',
      grantorPosition: 'Kepala Desa Sampeldes',
      grantorAddress: 'Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap',

      powerScope: 'Pengambilan uang secara tunai di Bank Jateng Cabang Cilacap',
      granteePositionLabel: 'Sekretaris Desa dan Bendahara Desa Sampeldes',

      grantee1Nik: '',
      grantee1Name: '',
      grantee1BirthPlace: '',
      grantee1BirthDate: '',
      grantee1Position: 'Sekretaris Desa Sampeldes',
      grantee1Address: 'Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap',

      hasSecondGrantee: true,
      grantee2Nik: '',
      grantee2Name: '',
      grantee2BirthPlace: '',
      grantee2BirthDate: '',
      grantee2Position: 'Bendahara Desa Sampeldes',
      grantee2Address: 'Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap',

      whatsapp: '',
    },
  });

  const grantorNik = form.watch('grantorNik');
  const grantee1Nik = form.watch('grantee1Nik');
  const grantee2Nik = form.watch('grantee2Nik');
  const hasSecondGrantee = form.watch('hasSecondGrantee');

  const grantorBirthDate = form.watch('grantorBirthDate');
  const grantee1BirthDate = form.watch('grantee1BirthDate');
  const grantee2BirthDate = form.watch('grantee2BirthDate');

  const fetchGrantor = async (nikToFetch: string) => {
    if (!nikToFetch || nikToFetch.length !== 16 || !firestore) return;
    setSearchingGrantor(true);
    try {
      const res = await getResidentByNik(firestore, nikToFetch);
      if (res) {
        if (res.fullName) form.setValue('grantorName', res.fullName.toUpperCase());
        if (res.placeOfBirth) form.setValue('grantorBirthPlace', res.placeOfBirth);
        if (res.dateOfBirth) form.setValue('grantorBirthDate', formatDbDateToForm(res.dateOfBirth));
        const fullAddr = `${res.address || ''} RT ${res.rt || '00'}/RW ${res.rw || '00'} Dusun ${res.dusun || ''}, Desa Sampeldes`.replace(/\s+/g, ' ').trim();
        if (fullAddr) form.setValue('grantorAddress', fullAddr);
        if ((res as any).telepon) form.setValue('whatsapp', (res as any).telepon);

        toast({
          title: 'Data Pemberi Kuasa Ditemukan',
          description: `${res.fullName} berhasil dimuat.`,
        });
      }
    } catch {
      // ignore
    } finally {
      setSearchingGrantor(false);
    }
  };

  const fetchGrantee1 = async (nikToFetch: string) => {
    if (!nikToFetch || nikToFetch.length !== 16 || !firestore) return;
    setSearchingGrantee1(true);
    try {
      const res = await getResidentByNik(firestore, nikToFetch);
      if (res) {
        if (res.fullName) form.setValue('grantee1Name', res.fullName.toUpperCase());
        if (res.placeOfBirth) form.setValue('grantee1BirthPlace', res.placeOfBirth);
        if (res.dateOfBirth) form.setValue('grantee1BirthDate', formatDbDateToForm(res.dateOfBirth));
        const fullAddr = `${res.address || ''} RT ${res.rt || '00'}/RW ${res.rw || '00'} Dusun ${res.dusun || ''}, Desa Sampeldes`.replace(/\s+/g, ' ').trim();
        if (fullAddr) form.setValue('grantee1Address', fullAddr);

        toast({
          title: 'Data Penerima Kuasa 1 Ditemukan',
          description: `${res.fullName} berhasil dimuat.`,
        });
      }
    } catch {
      // ignore
    } finally {
      setSearchingGrantee1(false);
    }
  };

  const fetchGrantee2 = async (nikToFetch: string) => {
    if (!nikToFetch || nikToFetch.length !== 16 || !firestore) return;
    setSearchingGrantee2(true);
    try {
      const res = await getResidentByNik(firestore, nikToFetch);
      if (res) {
        if (res.fullName) form.setValue('grantee2Name', res.fullName.toUpperCase());
        if (res.placeOfBirth) form.setValue('grantee2BirthPlace', res.placeOfBirth);
        if (res.dateOfBirth) form.setValue('grantee2BirthDate', formatDbDateToForm(res.dateOfBirth));
        const fullAddr = `${res.address || ''} RT ${res.rt || '00'}/RW ${res.rw || '00'} Dusun ${res.dusun || ''}, Desa Sampeldes`.replace(/\s+/g, ' ').trim();
        if (fullAddr) form.setValue('grantee2Address', fullAddr);

        toast({
          title: 'Data Penerima Kuasa 2 Ditemukan',
          description: `${res.fullName} berhasil dimuat.`,
        });
      }
    } catch {
      // ignore
    } finally {
      setSearchingGrantee2(false);
    }
  };

  useEffect(() => {
    if (grantorNik?.length === 16 && firestore) fetchGrantor(grantorNik);
  }, [grantorNik, firestore]);

  useEffect(() => {
    if (grantee1Nik?.length === 16 && firestore) fetchGrantee1(grantee1Nik);
  }, [grantee1Nik, firestore]);

  useEffect(() => {
    if (grantee2Nik?.length === 16 && firestore) fetchGrantee2(grantee2Nik);
  }, [grantee2Nik, firestore]);

  const handleFileSelect = (file: File, fieldName: string) => {
    setFiles((prev) => ({ ...prev, [fieldName]: file }));
    setFileErrors((prev) => ({ ...prev, [fieldName]: '' }));
  };

  const onSubmit = async (values: FormValues) => {
    if (!firestore) return;

    if (!isAdmin) {
      const newFileErrors: { [key: string]: string } = {};
      if (!files['ktpFile']) newFileErrors['ktpFile'] = 'Scan/Foto KTP Pemberi Kuasa wajib diunggah.';
      if (Object.keys(newFileErrors).length > 0) {
        setFileErrors(newFileErrors);
        toast({
          title: 'Berkas Kurang Lengkap',
          description: 'Mohon unggah dokumen KTP Pemberi Kuasa.',
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
            targetFileName: `${fieldName}_${values.grantorNik}`,
            fieldName,
          };
        })
      );

      const grantee2FinalName = values.hasSecondGrantee && values.grantee2Name ? values.grantee2Name.toUpperCase() : '';

      await addSubmission(firestore, {
        ticketNumber: generatedTicket,
        requesterName: values.grantorName.toUpperCase(),
        nik: values.grantorNik,
        letterType: 'Surat Kuasa Administrasi Desa',
        formData: {
          ...values,
          name: values.grantorName.toUpperCase(),
          nama: values.grantorName.toUpperCase(),
          nik: values.grantorNik,
          grantorName: values.grantorName.toUpperCase(),
          grantee1Name: values.grantee1Name.toUpperCase(),
          grantee2Name: grantee2FinalName,
          // Proxy aliases
          proxyName: values.grantee1Name.toUpperCase(),
          authorizedPerson: values.grantee1Name.toUpperCase(),
          proxyNik: values.grantee1Nik || '',
          authorizedNik: values.grantee1Nik || '',
          proxyBirthPlace: values.grantee1BirthPlace,
          proxyBirthDate: values.grantee1BirthDate,
          proxyPosition: values.grantee1Position,
          proxyAddress: values.grantee1Address,
          powerScope: values.powerScope,
          purpose: values.powerScope,
          keperluan: values.powerScope,
          phone: values.whatsapp,
          telepon: values.whatsapp,
          form_telepon: values.whatsapp,
          masterSuratId: 'prm-30',
          urlSurat: 'sistem-surat-kuasa',
          kodeSurat: 'S-47',
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
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Surat Kuasa Administrasi Desa</h2>
          <p className="text-sm text-slate-500">
            Penerbitan surat kuasa resmi kedinasan desa untuk perbankan, penarikan dana, dan urusan administrasi
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 1. Pemberi Kuasa */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-600" /> 1. Data Pemberi Kuasa
              </h3>
              {grantorNik?.length === 16 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchGrantor(grantorNik)}
                  disabled={searchingGrantor}
                  className="text-xs text-amber-700 hover:bg-amber-50 gap-1 h-8 px-2"
                >
                  {searchingGrantor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Cari Penduduk
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grantorNik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      NIK Pemberi Kuasa (16 Digit) <span className="text-red-500">*</span>
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
                      {searchingGrantor && (
                        <div className="absolute right-3 top-2.5 text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grantorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      Nama Lengkap Pemberi Kuasa <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: SANTOSO"
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
                name="grantorBirthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      Tempat Lahir <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Bondowoso" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grantorBirthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700 flex items-center justify-between">
                      <span>Tanggal Lahir <span className="text-red-500">*</span></span>
                      {grantorBirthDate && (
                        <span className="text-xs text-amber-700 font-normal">
                          {formatTanggalIndonesia(grantorBirthDate)}
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input type="date" className="cursor-pointer bg-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grantorPosition"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="font-semibold text-slate-700">
                      Jabatan Pemberi Kuasa <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Kepala Desa Sampeldes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="grantorAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">
                    Alamat Lengkap Pemberi Kuasa <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Botolinggo RT. 042 RW. 014 / Dusun Sampeldes RT 001 RW 002"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 2. Lingkup & Keperluan Kuasa */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" /> 2. Rincian Pelimpahan &amp; Keperluan Kuasa
            </h3>

            <FormField
              control={form.control}
              name="powerScope"
              render={({ field }) => (
                <FormItem className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                  <FormLabel className="font-bold text-slate-800">
                    Maksud / Keperluan Pemberian Kuasa <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Pengambilan uang secara tunai di Bank Jatim Capem Prajekan / Pencairan Dana Bantuan Desa"
                      className="bg-white mt-1 font-medium"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'Pengambilan uang secara tunai di Bank Jatim Capem Prajekan',
                      'Pengambilan uang secara tunai di Bank Jateng Cabang Cilacap',
                      'Pengurusan administrasi dan pencairan Dana Desa (DD/ADD)',
                      'Pengambilan dokumen resmi dan administrasi perbankan',
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => form.setValue('powerScope', opt)}
                        className="px-2.5 py-1 text-[11px] bg-white border border-amber-300 rounded-lg text-slate-700 hover:bg-amber-100 transition-all text-left"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="granteePositionLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">
                    Sebutan Jabatan Penerima Kuasa Dalam Narasi Surat (Opsional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Sekretaris Desa dan Bendahara Desa Sampeldes"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-slate-500">
                    Otomatis terisi jika dikosongkan.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 3. Penerima Kuasa 1 */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" /> 3. Data Penerima Kuasa (Pertama)
              </h3>
              {grantee1Nik?.length === 16 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchGrantee1(grantee1Nik)}
                  disabled={searchingGrantee1}
                  className="text-xs text-emerald-700 hover:bg-emerald-50 gap-1 h-8 px-2"
                >
                  {searchingGrantee1 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Cari Penduduk
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grantee1Nik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      NIK Penerima Kuasa 1
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="16 digit NIK (opsional)..."
                        maxLength={16}
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grantee1Name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      Nama Lengkap Penerima Kuasa 1 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: IMAM"
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
                name="grantee1BirthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      Tempat Lahir <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Bondowoso" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grantee1BirthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700 flex items-center justify-between">
                      <span>Tanggal Lahir <span className="text-red-500">*</span></span>
                      {grantee1BirthDate && (
                        <span className="text-xs text-emerald-700 font-normal">
                          {formatTanggalIndonesia(grantee1BirthDate)}
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input type="date" className="cursor-pointer bg-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grantee1Position"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="font-semibold text-slate-700">
                      Jabatan Penerima Kuasa 1 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Sekretaris Desa Botolinggo / Sekretaris Desa Sampeldes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="grantee1Address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">
                    Alamat Lengkap Penerima Kuasa 1 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Botolinggo RT. 042 RW. 014, Kecamatan Botolinggo Kabupaten Bondowoso"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 4. Penerima Kuasa 2 (Opsional / Bersama) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" /> 4. Data Penerima Kuasa (Kedua - Contoh: Bendahara Desa)
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={hasSecondGrantee ? "outline" : "default"}
                  size="sm"
                  onClick={() => form.setValue('hasSecondGrantee', !hasSecondGrantee)}
                  className="text-xs h-8 gap-1"
                >
                  {hasSecondGrantee ? (
                    <>
                      <Trash2 className="w-3.5 h-3.5 text-red-500" /> Hapus Penerima 2
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-3.5 h-3.5" /> Tambah Penerima 2
                    </>
                  )}
                </Button>
              </div>
            </div>

            {hasSecondGrantee && (
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="grantee2Nik"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">
                          NIK Penerima Kuasa 2
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              placeholder="16 digit NIK (opsional)..."
                              maxLength={16}
                              {...field}
                              className="font-mono bg-white"
                            />
                          </FormControl>
                          {searchingGrantee2 && (
                            <div className="absolute right-3 top-2.5 text-slate-400">
                              <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grantee2Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">
                          Nama Lengkap Penerima Kuasa 2
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: FAWON ARISANTI"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            className="font-bold uppercase bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grantee2BirthPlace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">
                          Tempat Lahir
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Bondowoso" className="bg-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grantee2BirthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700 flex items-center justify-between">
                          <span>Tanggal Lahir</span>
                          {grantee2BirthDate && (
                            <span className="text-xs text-blue-700 font-normal">
                              {formatTanggalIndonesia(grantee2BirthDate)}
                            </span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input type="date" className="cursor-pointer bg-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grantee2Position"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="font-semibold text-slate-700">
                          Jabatan Penerima Kuasa 2
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Bendahara Desa Botolinggo / Kaur Keuangan Sampeldes" className="bg-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="grantee2Address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-700">
                        Alamat Lengkap Penerima Kuasa 2
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Contoh: Botolinggo RT. 014 RW. 006, Kecamatan Botolinggo Kabupaten Bondowoso"
                          rows={2}
                          className="bg-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* 5. Kontak & Berkas */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600" /> 5. Kontak &amp; Persyaratan Berkas
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
                      Untuk koordinasi penerbitan surat kuasa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isAdmin && (
                <div>
                  <GoogleFileUploader
                    label="Scan / Foto KTP Pemberi Kuasa"
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

          <Button type="submit" disabled={isSubmitting} className="w-full py-6 text-base font-bold bg-amber-600 hover:bg-amber-700 shadow-md">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Memproses Surat Kuasa...
              </>
            ) : (
              'Kirim Permohonan Surat Kuasa'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

