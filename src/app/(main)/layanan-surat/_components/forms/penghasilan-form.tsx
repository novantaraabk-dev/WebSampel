'use client';
import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';

import { useState, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Coins, User, GraduationCap, UploadCloud, FileCheck, Paperclip, Users, Calculator } from 'lucide-react';

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
import { terbilangIndonesia } from '@/lib/opensid-surat-engine';

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
  // 1. Data Siswa / Mahasiswa (Anak)
  childNik: z.string().min(1, 'NIK Siswa/Mahasiswa wajib diisi.').length(16, 'NIK harus 16 digit.'),
  childName: z.string().min(1, 'Nama siswa/mahasiswa wajib diisi.'),
  childBirthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  childBirthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  childGender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  childReligion: z.string().min(1, 'Agama wajib diisi.'),
  childAddress: z.string().min(1, 'Alamat tempat tinggal wajib diisi.'),
  schoolName: z.string().min(1, 'Nama sekolah / universitas wajib diisi.'),
  childNis: z.string().optional(),
  childMajor: z.string().optional(),
  childClass: z.string().optional(),

  // 2. Data Ayah
  fatherNik: z.string().min(1, 'NIK Ayah wajib diisi.').length(16, 'NIK Ayah harus 16 digit.'),
  fatherName: z.string().min(1, 'Nama lengkap ayah wajib diisi.'),
  fatherBirthPlace: z.string().min(1, 'Tempat lahir ayah wajib diisi.'),
  fatherBirthDate: z.string().min(1, 'Tanggal lahir ayah wajib diisi.'),
  fatherJob: z.string().min(1, 'Pekerjaan ayah wajib diisi.'),
  fatherAddress: z.string().min(1, 'Alamat ayah wajib diisi.'),
  fatherIncome: z.string().min(1, 'Penghasilan ayah per bulan wajib diisi.'),

  // 3. Data Ibu
  motherNik: z.string().min(1, 'NIK Ibu wajib diisi.').length(16, 'NIK Ibu harus 16 digit.'),
  motherName: z.string().min(1, 'Nama lengkap ibu wajib diisi.'),
  motherBirthPlace: z.string().min(1, 'Tempat lahir ibu wajib diisi.'),
  motherBirthDate: z.string().min(1, 'Tanggal lahir ibu wajib diisi.'),
  motherJob: z.string().min(1, 'Pekerjaan ibu wajib diisi.'),
  motherAddress: z.string().min(1, 'Alamat ibu wajib diisi.'),
  motherIncome: z.string().min(1, 'Penghasilan ibu per bulan wajib diisi.'),

  // 4. Finansial & Keperluan
  dependentsCount: z.string().min(1, 'Jumlah tanggungan wajib diisi.'),
  purpose: z.string().min(1, 'Keperluan surat wajib diisi.'),
  phone: phoneValidationSchema,
});

export function PenghasilanForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchingField, setSearchingField] = useState<'child' | 'father' | 'mother' | null>(null);
  const [filesToUpload, setFilesToUpload] = useState<Array<{ fieldName: string; file: File }>>([]);

  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      childNik: '',
      childName: '',
      childBirthPlace: '',
      childBirthDate: '',
      childGender: 'Laki-Laki',
      childReligion: 'Islam',
      childAddress: '',
      schoolName: '',
      childNis: '',
      childMajor: '',
      childClass: '',

      fatherNik: '',
      fatherName: '',
      fatherBirthPlace: '',
      fatherBirthDate: '',
      fatherJob: 'Petani / Wiraswasta',
      fatherAddress: '',
      fatherIncome: '1500000',

      motherNik: '',
      motherName: '',
      motherBirthPlace: '',
      motherBirthDate: '',
      motherJob: 'Ibu Rumah Tangga',
      motherAddress: '',
      motherIncome: '0',

      dependentsCount: '3',
      purpose: 'Persyaratan Beasiswa / KIP Kuliah',
      phone: '',
    },
  });

  const childNikValue = form.watch('childNik');
  const fatherNikValue = form.watch('fatherNik');
  const motherNikValue = form.watch('motherNik');
  const fatherIncomeValue = form.watch('fatherIncome');
  const motherIncomeValue = form.watch('motherIncome');

  // Auto-fetch data anak
  useEffect(() => {
    const cleanNik = (childNikValue || '').replace(/\D/g, '').trim();
    if (cleanNik.length === 16 && firestore) {
      setSearchingField('child');
      let active = true;
      getResidentByNik(firestore, cleanNik)
        .then((res) => {
          if (!active || !res) return;
          form.setValue('childName', res.fullName.toUpperCase());
          if (res.placeOfBirth) form.setValue('childBirthPlace', res.placeOfBirth);
          if (res.dateOfBirth) form.setValue('childBirthDate', formatDbDateToForm(res.dateOfBirth));
          if (res.gender) form.setValue('childGender', res.gender === 'Laki-laki' || res.gender === 'LAKI-LAKI' ? 'Laki-Laki' : 'Perempuan');
          if (res.religion) form.setValue('childReligion', res.religion);
          const fullAddr = `${res.address || ''}, RT ${res.rt || '001'} RW ${res.rw || '001'}, ${res.kelurahan || 'Sampeldes'}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
          form.setValue('childAddress', fullAddr);
          toast({ title: 'Data Anak Ditemukan', description: `Memuat: ${res.fullName}` });
        })
        .finally(() => {
          if (active) setSearchingField(null);
        });
      return () => {
        active = false;
      };
    }
  }, [childNikValue, firestore, form, toast]);

  // Auto-fetch data ayah
  useEffect(() => {
    const cleanNik = (fatherNikValue || '').replace(/\D/g, '').trim();
    if (cleanNik.length === 16 && firestore) {
      setSearchingField('father');
      let active = true;
      getResidentByNik(firestore, cleanNik)
        .then((res) => {
          if (!active || !res) return;
          form.setValue('fatherName', res.fullName.toUpperCase());
          if (res.placeOfBirth) form.setValue('fatherBirthPlace', res.placeOfBirth);
          if (res.dateOfBirth) form.setValue('fatherBirthDate', formatDbDateToForm(res.dateOfBirth));
          if (res.occupation) form.setValue('fatherJob', res.occupation);
          const fullAddr = `${res.address || ''}, RT ${res.rt || '001'} RW ${res.rw || '001'}, ${res.kelurahan || 'Sampeldes'}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
          form.setValue('fatherAddress', fullAddr);
          toast({ title: 'Data Ayah Ditemukan', description: `Memuat: ${res.fullName}` });
        })
        .finally(() => {
          if (active) setSearchingField(null);
        });
      return () => {
        active = false;
      };
    }
  }, [fatherNikValue, firestore, form, toast]);

  // Auto-fetch data ibu
  useEffect(() => {
    const cleanNik = (motherNikValue || '').replace(/\D/g, '').trim();
    if (cleanNik.length === 16 && firestore) {
      setSearchingField('mother');
      let active = true;
      getResidentByNik(firestore, cleanNik)
        .then((res) => {
          if (!active || !res) return;
          form.setValue('motherName', res.fullName.toUpperCase());
          if (res.placeOfBirth) form.setValue('motherBirthPlace', res.placeOfBirth);
          if (res.dateOfBirth) form.setValue('motherBirthDate', formatDbDateToForm(res.dateOfBirth));
          if (res.occupation) form.setValue('motherJob', res.occupation);
          const fullAddr = `${res.address || ''}, RT ${res.rt || '001'} RW ${res.rw || '001'}, ${res.kelurahan || 'Sampeldes'}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
          form.setValue('motherAddress', fullAddr);
          toast({ title: 'Data Ibu Ditemukan', description: `Memuat: ${res.fullName}` });
        })
        .finally(() => {
          if (active) setSearchingField(null);
        });
      return () => {
        active = false;
      };
    }
  }, [motherNikValue, firestore, form, toast]);

  // Live calculation total income
  const totalFinancial = useMemo(() => {
    const nAyah = Number(String(fatherIncomeValue || '0').replace(/\D/g, '')) || 0;
    const nIbu = Number(String(motherIncomeValue || '0').replace(/\D/g, '')) || 0;
    const total = nAyah + nIbu;
    return {
      numFather: nAyah,
      numMother: nIbu,
      total,
      strTotal: `Rp ${total.toLocaleString('id-ID')}`,
      terbilang: total > 0 ? `${terbilangIndonesia(total)} Rupiah` : 'Nol Rupiah',
    };
  }, [fatherIncomeValue, motherIncomeValue]);

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
        toast({ title: "Berkas Belum Lengkap", description: "Mohon unggah KTP Orang Tua.", variant: "destructive" });
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
            targetFileName: `${fileData.fieldName}_${values.childNik}`,
            fieldName: fileData.fieldName,
          };
        })
      );

      const numPenghasilanAyah = Number(String(values.fatherIncome).replace(/\D/g, '')) || 0;
      const numPenghasilanIbu = Number(String(values.motherIncome).replace(/\D/g, '')) || 0;
      const totalPenghasilan = numPenghasilanAyah + numPenghasilanIbu;
      const formattedTotal = `Rp ${totalPenghasilan.toLocaleString('id-ID')}`;

      await addSubmission(firestore, {
        ticketNumber: newTicketNumber,
        requesterName: values.childName,
        nik: values.childNik,
        letterType: 'Surat Keterangan Penghasilan Orang Tua',
        formData: {
          ...values,
          // Mapping Anak (Siswa/Mahasiswa)
          name: values.childName,
          nik: values.childNik,
          birthPlace: values.childBirthPlace,
          birthDate: values.childBirthDate,
          gender: values.childGender,
          religion: values.childReligion,
          address: values.childAddress,
          childName: values.childName,
          childNik: values.childNik,
          childBirthPlace: values.childBirthPlace,
          childBirthDate: values.childBirthDate,
          childGender: values.childGender,
          childReligion: values.childReligion,
          childAddress: values.childAddress,
          schoolName: values.schoolName,
          childNis: values.childNis || '-',
          childMajor: values.childMajor || '-',
          childClass: values.childClass || '-',

          // Mapping Ayah
          fatherName: values.fatherName,
          fatherNik: values.fatherNik,
          fatherBirthPlace: values.fatherBirthPlace,
          fatherBirthDate: values.fatherBirthDate,
          fatherJob: values.fatherJob,
          fatherAddress: values.fatherAddress,
          fatherIncome: `Rp ${numPenghasilanAyah.toLocaleString('id-ID')}`,

          // Mapping Ibu
          motherName: values.motherName,
          motherNik: values.motherNik,
          motherBirthPlace: values.motherBirthPlace,
          motherBirthDate: values.motherBirthDate,
          motherJob: values.motherJob,
          motherAddress: values.motherAddress,
          motherIncome: `Rp ${numPenghasilanIbu.toLocaleString('id-ID')}`,

          // Finansial & Tanggungan
          monthlyIncome: formattedTotal,
          totalIncome: formattedTotal,
          incomeSource: 'Pekerjaan Orang Tua',
          dependentsCount: values.dependentsCount,
          purpose: values.purpose,
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
        {/* I. DATA SISWA / MAHASISWA */}
        <FormSection title="I. Identitas Siswa / Mahasiswa (Anak)" icon={<GraduationCap className="h-5 w-5" />}>
          <FormField
            control={form.control}
            name="childNik"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">
                  NIK Siswa / Mahasiswa {searchingField === 'child' && <Loader2 className="inline h-3 w-3 animate-spin ml-1 text-primary" />}
                </FormLabel>
                <FormControl><Input placeholder="16 digit NIK..." maxLength={16} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="childName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Nama Lengkap Siswa / Mahasiswa</FormLabel>
                <FormControl><Input placeholder="Nama lengkap..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="childBirthPlace"
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
            name="childBirthDate"
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
            name="childGender"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Jenis Kelamin</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
            name="childReligion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Agama</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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

          <FormField
            control={form.control}
            name="schoolName"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Sekolah / Perguruan Tinggi</FormLabel>
                <FormControl><Input placeholder="Contoh: Universitas Jenderal Soedirman / SMAN 1..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="childNis"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">NISN / NIM</FormLabel>
                <FormControl><Input placeholder="Contoh: 210103001..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="childMajor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Jurusan / Fakultas / Prodi</FormLabel>
                <FormControl><Input placeholder="Contoh: Teknik Informatika..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="childClass"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Kelas / Semester</FormLabel>
                <FormControl><Input placeholder="Contoh: Semester V (Lima)..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="childAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Alamat Tempat Tinggal</FormLabel>
                  <FormControl><Textarea placeholder="Alamat domisili anak..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* II. DATA AYAH */}
        <FormSection title="II. Identitas & Penghasilan Ayah" icon={<User className="h-5 w-5" />}>
          <FormField
            control={form.control}
            name="fatherNik"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">
                  NIK Ayah {searchingField === 'father' && <Loader2 className="inline h-3 w-3 animate-spin ml-1 text-primary" />}
                </FormLabel>
                <FormControl><Input placeholder="16 digit NIK ayah..." maxLength={16} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fatherName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Nama Lengkap Ayah</FormLabel>
                <FormControl><Input placeholder="Nama ayah..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fatherBirthPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Tempat Lahir Ayah</FormLabel>
                <FormControl><Input placeholder="Kota/Kab lahir ayah..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fatherBirthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Tanggal Lahir Ayah</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fatherJob"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Pekerjaan Ayah</FormLabel>
                <FormControl><Input placeholder="Petani / Buruh / Wiraswasta..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fatherIncome"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Penghasilan Ayah / Bulan (Rp)</FormLabel>
                <FormControl><Input placeholder="Contoh: 1500000" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="fatherAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Alamat Ayah</FormLabel>
                  <FormControl><Textarea placeholder="Alamat domisili ayah..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* III. DATA IBU */}
        <FormSection title="III. Identitas & Penghasilan Ibu" icon={<Users className="h-5 w-5" />}>
          <FormField
            control={form.control}
            name="motherNik"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">
                  NIK Ibu {searchingField === 'mother' && <Loader2 className="inline h-3 w-3 animate-spin ml-1 text-primary" />}
                </FormLabel>
                <FormControl><Input placeholder="16 digit NIK ibu..." maxLength={16} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motherName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Nama Lengkap Ibu</FormLabel>
                <FormControl><Input placeholder="Nama ibu..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motherBirthPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Tempat Lahir Ibu</FormLabel>
                <FormControl><Input placeholder="Kota/Kab lahir ibu..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motherBirthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Tanggal Lahir Ibu</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motherJob"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Pekerjaan Ibu</FormLabel>
                <FormControl><Input placeholder="Ibu Rumah Tangga / Pedagang..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motherIncome"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Penghasilan Ibu / Bulan (Rp)</FormLabel>
                <FormControl><Input placeholder="Contoh: 0 atau 500000" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="motherAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Alamat Ibu</FormLabel>
                  <FormControl><Textarea placeholder="Alamat domisili ibu..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* IV. TOTAL PENGHASILAN & KEPERLUAN */}
        <FormSection title="IV. Total Penghasilan & Keperluan Surat" icon={<Coins className="h-5 w-5" />}>
          {/* Kalkulator Total Penghasilan Live Card */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <Calculator className="h-4 w-4" />
              <span>Rangkuman Penghasilan Gabungan Orang Tua</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-slate-500 block">Penghasilan Ayah:</span>
                <span className="font-bold text-slate-800 text-sm">Rp {totalFinancial.numFather.toLocaleString('id-ID')}</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-slate-500 block">Penghasilan Ibu:</span>
                <span className="font-bold text-slate-800 text-sm">Rp {totalFinancial.numMother.toLocaleString('id-ID')}</span>
              </div>
              <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-xs">
                <span className="text-emerald-100 block">Total Gabungan:</span>
                <span className="font-black text-sm sm:text-base">{totalFinancial.strTotal}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 italic pt-1">
              Terbilang: <strong>{totalFinancial.terbilang}</strong>
            </p>
          </div>

          <FormField
            control={form.control}
            name="dependentsCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Jumlah Tanggungan Keluarga (Orang)</FormLabel>
                <FormControl><Input placeholder="Contoh: 3" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">
                  Nomor HP / WhatsApp {isAdmin ? <span className="text-slate-400 font-normal text-xs">(Opsional)</span> : <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl><Input placeholder={isAdmin ? "Opsional untuk pengajuan admin" : "Contoh: 081234567890"} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Keperluan Surat</FormLabel>
                  <FormControl><Input placeholder="Contoh: Persyaratan Beasiswa / KIP Kuliah / Keringanan Biaya Pendidikan..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* V. BERKAS PENDUKUNG */}
        <FormSection title="V. Berkas Pendukung" icon={<Paperclip className="h-5 w-5" />}>
          <GoogleFileUploader
            label="KTP Orang Tua (Ayah / Ibu)"
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
            label="Kartu Pelajar / Mahasiswa / Bukti Pembayaran Sekolah"
            fieldName="berkas_pendukung"
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
              'Kirim Pengajuan Surat Keterangan Penghasilan'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
