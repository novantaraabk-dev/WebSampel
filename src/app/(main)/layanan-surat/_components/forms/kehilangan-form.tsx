'use client';
import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, ShieldAlert, User, Clock, MapPin, UploadCloud, FileCheck, Paperclip } from 'lucide-react';

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

// Helper base64
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

const FormSection = ({ title, icon: Icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="space-y-6 rounded-[2rem] border p-6 md:p-8 bg-white shadow-sm">
    <div className="flex items-center gap-3 border-b pb-4">
      <div className="p-2 bg-primary/5 rounded-lg text-primary">
        {Icon}
      </div>
      <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-800">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
  </div>
);

const formSchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 digit.'),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  religion: z.string().min(1, 'Agama wajib diisi.'),
  job: z.string().min(1, 'Pekerjaan wajib diisi.'),
  phone: phoneValidationSchema,
  address: z.string().min(1, 'Alamat wajib diisi.'),

  // Rincian Kehilangan
  lostItems: z.string().min(1, 'Rincian barang/dokumen yang hilang wajib diisi.'), // e.g. KTP-el Asli, Buku Tabungan BRI No Rek ..., STNK Honda Vario No Pol R-....
  lostDate: z.string().min(1, 'Tanggal/waktu perkiraan hilang wajib diisi.'),
  lostLocation: z.string().min(1, 'Perkiraan tempat kehilangan wajib diisi.'),
  chronology: z.string().optional(),
  purpose: z.string().min(1, 'Keperluan surat wajib diisi.'),
});

export function KehilanganForm({ isAdmin = false }: { isAdmin?: boolean }) {
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
      name: '',
      gender: 'Laki-laki',
      birthPlace: '',
      birthDate: '',
      religion: 'Islam',
      job: '',
      phone: '',
      address: '',
      lostItems: 'KTP-el / Kartu Keluarga / Buku Tabungan / SIM',
      lostDate: '',
      lostLocation: 'Di sekitar wilayah Kecamatan Gandrungmangu',
      chronology: 'Barang/dokumen tersebut tercecer atau hilang dan telah diupayakan pencarian namun belum ditemukan.',
      purpose: 'Pengantar permohonan Surat Tanda Penerimaan Laporan Kehilangan Barang (STPLKB) ke Polsek Gandrungmangu',
    },
  });

  const nikValue = form.watch('nik');

  useEffect(() => {
    const fetchResident = async () => {
      if (nikValue?.length === 16 && firestore) {
        setIsSearching(true);
        try {
          const resident = await getResidentByNik(firestore, nikValue);
          if (resident) {
            form.setValue('name', resident.fullName.toUpperCase());
            form.setValue('gender', resident.gender);
            form.setValue('birthPlace', resident.placeOfBirth);
            form.setValue('birthDate', formatDbDateToForm(resident.dateOfBirth));
            form.setValue('religion', resident.religion || 'Islam');
            form.setValue('job', resident.occupation || '');
            if ((resident as any).telepon) form.setValue('phone', (resident as any).telepon);
            const fullAddress = `${resident.address}, RT ${resident.rt} RW ${resident.rw}, ${resident.kelurahan}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
            form.setValue('address', fullAddress);
            toast({ title: "Data Warga Ditemukan", description: `Memuat: ${resident.fullName}` });
          }
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

  const generateTicketNumber = () => Math.random().toString().substring(2, 8);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    if (!isAdmin) {
      if (!validatePhoneForSubmission(values.phone, isAdmin)) {
        form.setError('phone', { message: 'Nomor HP / WhatsApp wajib diisi (minimal 9 digit).' });
        return;
      }
      if (!filesToUpload.some(f => f.fieldName === 'ktp' || f.fieldName === 'kk')) {
        toast({ title: "Berkas Belum Lengkap", description: "Mohon unggah KTP/KK pemohon.", variant: "destructive" });
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

      await addSubmission(firestore, {
        ticketNumber: newTicketNumber,
        requesterName: values.name,
        nik: values.nik,
        letterType: 'Surat Pengantar Kehilangan',
        masterSuratId: 'prm-02',
        urlSurat: 'sistem-surat-pengantar-laporan-kehilangan',
        kodeSurat: '400.7.22.1',
        formData: {
          ...values,
          phone: values.phone,
          telepon: values.phone,
          form_telepon: values.phone,
          // Field sinkronisasi cetak OpenSID & Dokumen Standar
          lostItems: values.lostItems,
          rincian_barang: values.lostItems,
          form_rincian_barang: values.lostItems,
          barang_hilang: values.lostItems,
          form_barang_hilang: values.lostItems,
          form_rincian: values.lostItems,
          rincian: values.lostItems,
          nama_barang: values.lostItems,
          form_nama_barang: values.lostItems,
          lostDate: values.lostDate,
          waktu_hilang: values.lostDate,
          form_waktu_hilang: values.lostDate,
          lostLocation: values.lostLocation,
          tempat_hilang: values.lostLocation,
          form_tempat_hilang: values.lostLocation,
          chronology: values.chronology || '',
          kronologi: values.chronology || '',
          form_kronologi: values.chronology || '',
          keterangan: values.chronology || '',
          form_keterangan: values.chronology || '',
          purpose: values.purpose,
          keperluan: values.purpose,
          form_keperluan: values.purpose,
        },
        filesToUpload: filesPayload,
      });

      setTicketNumber(newTicketNumber);
      setIsSubmitted(true);
      toast({ title: "Pengajuan Berhasil Disimpan", description: `Nomor tiket: ${newTicketNumber}` });
    } catch (error: any) {
      console.error(error);
      toast({ title: "Gagal Mengajukan Surat", description: error?.message, variant: "destructive" });
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* I. DATA PEMOHON */}
        <FormSection title="I. Identitas Pelapor / Pemohon" icon={<User className="h-5 w-5" />}>
          <FormField
            control={form.control}
            name="nik"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">
                  NIK Pelapor {isSearching && <Loader2 className="inline h-3 w-3 animate-spin ml-1 text-primary" />}
                </FormLabel>
                <FormControl><Input placeholder="16 digit NIK..." maxLength={16} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Nama Lengkap</FormLabel>
                <FormControl><Input placeholder="Nama lengkap..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Tempat Lahir</FormLabel>
                <FormControl><Input placeholder="Kota/Kab lahir..." {...field} /></FormControl>
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
                <FormControl><Input type="date" {...field} /></FormControl>
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
                <FormControl><Input placeholder="Laki-laki / Perempuan" {...field} /></FormControl>
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
                <FormControl><Input placeholder="Pekerjaan..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Nomor HP / WhatsApp {isAdmin ? <span className="text-slate-400 font-normal text-xs">(Opsional)</span> : <span className="text-red-500">*</span>}</FormLabel>
                <FormControl><Input placeholder={isAdmin ? "Opsional untuk pengajuan admin" : "Contoh: 081234567890"} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Alamat Tempat Tinggal</FormLabel>
                  <FormControl><Textarea placeholder="Alamat domisili pelapor..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* II. RINCIAN KEHILANGAN */}
        <FormSection title="II. Rincian Barang / Dokumen Hilang" icon={<ShieldAlert className="h-5 w-5" />}>
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="lostItems"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">
                    Barang / Dokumen yang Hilang
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Contoh: 1 (satu) buah Kartu Tanda Penduduk Elektronik (KTP-el) an. Ahmad Subari, NIK: 3301xxxxxxxxxxxx; serta 1 (satu) buah Buku Tabungan Bank BRI No. Rek: 1234xxxxxxx..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="lostDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Perkiraan Waktu Hilang</FormLabel>
                <FormControl><Input placeholder="Contoh: Hari Senin, 20 Oktober 2026 sekitar pukul 10.00 WIB" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lostLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Perkiraan Tempat Hilang</FormLabel>
                <FormControl><Input placeholder="Contoh: Di perjalanan antara Sampeldes menuju Pasar Gandrungmangu..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="chronology"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keterangan Singkat Kejadian</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Keperluan Pengantar</FormLabel>
                  <FormControl><Input placeholder="Contoh: Pengantar ke Polsek Gandrungmangu untuk membuat laporan kehilangan..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* III. BERKAS PENDUKUNG */}
        <FormSection title="III. Berkas Pendukung" icon={<Paperclip className="h-5 w-5" />}>
          <GoogleFileUploader
            label="KTP / Identitas Pengganti"
            fieldName="ktp"
            isRequired={!isAdmin}
            onFileSelect={handleFileSelect}
          />
          <GoogleFileUploader
            label="Kartu Keluarga (KK)"
            fieldName="kk"
            isRequired={false}
            onFileSelect={handleFileSelect}
          />
          <GoogleFileUploader
            label="Fotokopi Dokumen yang Hilang (Bila ada)"
            fieldName="fc_dokumen"
            isRequired={false}
            onFileSelect={handleFileSelect}
          />
        </FormSection>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold tracking-wide"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sedang Menyimpan...
              </>
            ) : (
              'Kirim Pengajuan Surat Pengantar Kehilangan'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
