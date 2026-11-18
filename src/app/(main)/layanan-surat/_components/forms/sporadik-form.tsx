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

const FormSection = ({ title, icon: Icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="space-y-6 rounded-[2rem] border p-6 md:p-8 bg-white shadow-sm">
    <div className="flex items-center gap-3 border-b pb-4">
      <div className="p-2 bg-primary/5 rounded-lg text-primary">{Icon}</div>
      <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-800">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
  </div>
);

const formSchema = z.object({
  // 1. Pemohon (Pemilik Tanah)
  nik: z.string().length(16, 'NIK harus 16 digit.'),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  religion: z.string().min(1, 'Agama wajib diisi.'),
  job: z.string().min(1, 'Pekerjaan wajib diisi.'),
  phone: phoneValidationSchema,
  address: z.string().min(1, 'Alamat wajib diisi.'),

  // 2. Data Tanah
  landLocation: z.string().min(1, 'Lokasi / Blok tanah wajib diisi.'),
  landArea: z.string().min(1, 'Luas tanah wajib diisi.'),
  landUsage: z.string().default('Pekarangan / Perumahan / Pertanian'),
  landHistory: z.string().min(1, 'Riwayat perolehan tanah wajib diisi.'), // Hibah/Jual Beli/Waris dari ... tahun ...
  spptPbb: z.string().optional(),

  // 3. Batas-batas Tanah
  northBorder: z.string().min(1, 'Batas sebelah Utara wajib diisi.'),
  eastBorder: z.string().min(1, 'Batas sebelah Timur wajib diisi.'),
  southBorder: z.string().min(1, 'Batas sebelah Selatan wajib diisi.'),
  westBorder: z.string().min(1, 'Batas sebelah Barat wajib diisi.'),

  // 4. Saksi Batas / Tetangga (2 orang)
  witness1Name: z.string().min(1, 'Nama Saksi 1 (Tetangga batas) wajib diisi.'),
  witness1Age: z.string().optional(),
  witness1Address: z.string().min(1, 'Alamat Saksi 1 wajib diisi.'),

  witness2Name: z.string().min(1, 'Nama Saksi 2 (Tetangga batas) wajib diisi.'),
  witness2Age: z.string().optional(),
  witness2Address: z.string().min(1, 'Alamat Saksi 2 wajib diisi.'),
  purpose: z.string().min(1, 'Keperluan pengajuan surat wajib diisi.'),
});

export function SporadikForm({ isAdmin = false }: { isAdmin?: boolean }) {
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
      landLocation: 'Dusun Rawasari RT ... / RW ... Desa Sampeldes',
      landArea: '250 M²',
      landUsage: 'Pekarangan & Rumah Tinggal',
      landHistory: 'Diperoleh secara waris / jual beli dari orang tua secara turun temurun sejak tahun ... dan tidak dalam sengketa.',
      spptPbb: '',
      northBorder: 'Tanah milik Sdr. ...',
      eastBorder: 'Jalan Desa / Tanah milik Sdr. ...',
      southBorder: 'Tanah milik Sdr. ...',
      westBorder: 'Saluran air / Tanah milik Sdr. ...',
      witness1Name: '',
      witness1Age: '45',
      witness1Address: 'Desa Sampeldes, Gandrungmangu',
      witness2Name: '',
      witness2Age: '50',
      witness2Address: 'Desa Sampeldes, Gandrungmangu',
      purpose: 'Pendaftaran Sertifikat Tanah Pertama Kali (PTSL / Sporadik) di BPN',
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
            toast({ title: "Data Pemohon Ditemukan", description: `Memuat: ${resident.fullName}` });
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
      if (!filesToUpload.some(f => f.fieldName === 'ktp')) {
        toast({ title: "Berkas Belum Lengkap", description: "Mohon unggah foto KTP pemohon.", variant: "destructive" });
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
        letterType: 'Surat Pernyataan Penguasaan Fisik Bidang Tanah (SPORADIK)',
        formData: {
          ...values,
          phone: values.phone,
          telepon: values.phone,
          form_telepon: values.phone,
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
        <FormSection title="I. Identitas Pemilik / Pemohon" icon={<User className="h-5 w-5" />}>
          <FormField
            control={form.control}
            name="nik"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">
                  NIK Pemilik {isSearching && <Loader2 className="inline h-3 w-3 animate-spin ml-1 text-primary" />}
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
            name="job"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Pekerjaan</FormLabel>
                <FormControl><Input placeholder="Petani / Wiraswasta..." {...field} /></FormControl>
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
                  <FormControl><Textarea placeholder="Alamat domisili..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* II. DATA FISIK TANAH */}
        <FormSection title="II. Rincian Objek Bidang Tanah" icon={<Landmark className="h-5 w-5" />}>
          <FormField
            control={form.control}
            name="landLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Lokasi / Blok Tanah</FormLabel>
                <FormControl><Input placeholder="Nama Dusun / Blok RT RW..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="landArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Luas Bidang Tanah</FormLabel>
                <FormControl><Input placeholder="Contoh: 350 M²" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="landUsage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Penggunaan Tanah</FormLabel>
                <FormControl><Input placeholder="Pekarangan / Perumahan / Sawah..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spptPbb"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NOP SPPT PBB (Bila ada)</FormLabel>
                <FormControl><Input placeholder="Nomor Objek Pajak PBB..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="landHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Riwayat Penguasaan & Perolehan Tanah</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="Jelaskan asal-usul tanah (waris, jual beli, hibah) dan sejak tahun berapa dikuasai..." {...field} /></FormControl>
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
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Keperluan Pengajuan Surat</FormLabel>
                  <FormControl><Input placeholder="Contoh: Pendaftaran Sertifikat Tanah Pertama Kali (PTSL / Sporadik) di BPN" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* III. BATAS-BATAS BIDANG TANAH */}
        <FormSection title="III. Batas-Batas Bidang Tanah" icon={<MapPin className="h-5 w-5" />}>
          <FormField
            control={form.control}
            name="northBorder"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Batas Sebelah UTARA</FormLabel>
                <FormControl><Input placeholder="Berbatasan dengan tanah milik..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="eastBorder"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Batas Sebelah TIMUR</FormLabel>
                <FormControl><Input placeholder="Berbatasan dengan tanah milik / jalan..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="southBorder"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Batas Sebelah SELATAN</FormLabel>
                <FormControl><Input placeholder="Berbatasan dengan tanah milik..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="westBorder"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Batas Sebelah BARAT</FormLabel>
                <FormControl><Input placeholder="Berbatasan dengan tanah milik / saluran..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* IV. SAKSI BATAS TANAH */}
        <FormSection title="IV. Saksi Batas / Tetangga Perbatasan" icon={<User className="h-5 w-5" />}>
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Saksi Batas I</h4>
            <FormField
              control={form.control}
              name="witness1Name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Nama Saksi 1</FormLabel>
                  <FormControl><Input placeholder="Nama tetangga perbatasan 1..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="witness1Address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Alamat Saksi 1</FormLabel>
                  <FormControl><Input placeholder="Alamat saksi 1..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Saksi Batas II</h4>
            <FormField
              control={form.control}
              name="witness2Name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Nama Saksi 2</FormLabel>
                  <FormControl><Input placeholder="Nama tetangga perbatasan 2..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="witness2Address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Alamat Saksi 2</FormLabel>
                  <FormControl><Input placeholder="Alamat saksi 2..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* V. BERKAS PENDUKUNG */}
        <FormSection title="V. Berkas Pendukung" icon={<Paperclip className="h-5 w-5" />}>
          <GoogleFileUploader
            label="KTP Pemilik / Pemohon"
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
            label="Fotokopi SPPT PBB / Bukti Perolehan (Letter C / Akta / Kwitansi)"
            fieldName="berkas_tanah"
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
              'Kirim Pengajuan Surat SPORADIK'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
