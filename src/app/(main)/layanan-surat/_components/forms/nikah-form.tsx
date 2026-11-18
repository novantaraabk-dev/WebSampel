'use client';
import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Heart, User, Users, Calendar, MapPin, UploadCloud, FileCheck, Paperclip, ShieldCheck, UserCheck, Copy } from 'lucide-react';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const FormSection = ({ title, subtitle, icon: Icon, action, children }: { title: string; subtitle?: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) => (
  <div className="space-y-6 rounded-[2rem] border p-6 md:p-8 bg-white shadow-sm">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/5 rounded-lg text-primary">
          {Icon}
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
  </div>
);

const HARI_INDONESIA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const formSchema = z.object({
  // 1. Data Pemohon (Calon Pengantin Desa - N1, N4, N5, SPS)
  nik: z.string().length(16, 'NIK pemohon harus 16 digit.'),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  nationality: z.string().default('WNI'),
  religion: z.string().min(1, 'Agama wajib diisi.'),
  job: z.string().min(1, 'Pekerjaan wajib diisi.'),
  education: z.string().optional(),
  phone: phoneValidationSchema,
  maritalStatus: z.string().min(1, 'Status pernikahan wajib diisi.'), // Jejaka, Perawan, Duda (Cerai Mati), Duda (Cerai Hidup), Janda (Cerai Mati), Janda (Cerai Hidup)
  beristriKe: z.string().optional(),
  address: z.string().min(1, 'Alamat domisili pemohon wajib diisi.'),

  // 2. Data Pasangan (Calon Suami / Istri - N2, N4, N5, SPS, SWN)
  spouseNik: z.string().optional(),
  spouseName: z.string().min(1, 'Nama calon pasangan wajib diisi.'),
  spouseFatherName: z.string().optional(), // Bin / Binti pasangan
  spouseMotherName: z.string().optional(), // Nama Ibu pasangan (SPS Hal 2)
  spouseBirthPlace: z.string().min(1, 'Tempat lahir pasangan wajib diisi.'),
  spouseBirthDate: z.string().min(1, 'Tanggal lahir pasangan wajib diisi.'),
  spouseNationality: z.string().default('WNI'),
  spouseReligion: z.string().min(1, 'Agama pasangan wajib diisi.'),
  spouseJob: z.string().min(1, 'Pekerjaan pasangan wajib diisi.'),
  spouseEducation: z.string().optional(),
  spouseStatus: z.string().min(1, 'Status pernikahan pasangan wajib diisi.'),
  spousePhone: z.string().optional(),
  spouseAddress: z.string().min(1, 'Alamat lengkap pasangan wajib diisi.'),

  // 3. Data Ayah Pemohon (N1, N5, SPS)
  fatherNik: z.string().optional(),
  fatherName: z.string().min(1, 'Nama ayah wajib diisi.'),
  fatherBin: z.string().optional(),
  fatherBirthPlace: z.string().optional(),
  fatherBirthDate: z.string().optional(),
  fatherNationality: z.string().default('WNI'),
  fatherReligion: z.string().optional(),
  fatherJob: z.string().optional(),
  fatherAddress: z.string().optional(),

  // 4. Data Ibu Pemohon (N1, N5, SPS)
  motherNik: z.string().optional(),
  motherName: z.string().min(1, 'Nama ibu wajib diisi.'),
  motherBinti: z.string().optional(),
  motherBirthPlace: z.string().optional(),
  motherBirthDate: z.string().optional(),
  motherNationality: z.string().default('WNI'),
  motherReligion: z.string().optional(),
  motherJob: z.string().optional(),
  motherAddress: z.string().optional(),

  // 5. Data Wali Nikah (SWN & SPS Hal 2)
  waliNik: z.string().optional(),
  waliName: z.string().optional(),
  waliBin: z.string().optional(),
  waliRelationship: z.string().optional(),
  waliReasonNotFather: z.string().optional(),
  waliBirthPlace: z.string().optional(),
  waliBirthDate: z.string().optional(),
  waliReligion: z.string().optional(),
  waliJob: z.string().optional(),
  waliAddress: z.string().optional(),

  // 6. Data Saksi I & Saksi II (SPS & SWN)
  witness1Nik: z.string().optional(),
  witness1Name: z.string().optional(),
  witness1BirthPlace: z.string().optional(),
  witness1BirthDate: z.string().optional(),
  witness1Religion: z.string().optional(),
  witness1Job: z.string().optional(),
  witness1Role: z.string().optional(),
  witness1Address: z.string().optional(),

  witness2Nik: z.string().optional(),
  witness2Name: z.string().optional(),
  witness2BirthPlace: z.string().optional(),
  witness2BirthDate: z.string().optional(),
  witness2Religion: z.string().optional(),
  witness2Job: z.string().optional(),
  witness2Role: z.string().optional(),
  witness2Address: z.string().optional(),

  // 7. Data Suami/Istri Terdahulu yang Meninggal (Khusus Model N-6 bila Cerai Mati)
  deceasedSpouseNik: z.string().optional(),
  deceasedSpouseName: z.string().optional(),
  deceasedSpouseBin: z.string().optional(),
  deceasedSpouseBirthPlace: z.string().optional(),
  deceasedSpouseBirthDate: z.string().optional(),
  deceasedSpouseNationality: z.string().optional(),
  deceasedSpouseReligion: z.string().optional(),
  deceasedSpouseJob: z.string().optional(),
  deceasedSpouseAddress: z.string().optional(),
  deceasedSpouseDeathDate: z.string().optional(),
  deceasedSpouseDeathPlace: z.string().optional(),

  // 8. Rencana Akad & KUA (N2 & SPS)
  akadDay: z.string().optional(),
  akadDate: z.string().optional(),
  akadTime: z.string().optional(),
  akadPlace: z.string().optional(),
  masKawin: z.string().optional(),
  kuaLocation: z.string().min(1, 'Lokasi KUA / Tempat Akad wajib diisi.'),
  purpose: z.string().min(1, 'Keperluan pengajuan surat wajib diisi.'),
});

export function NikahForm({ isAdmin = false, letterType }: { isAdmin?: boolean; letterType?: string }) {
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
      nationality: 'WNI',
      religion: 'Islam',
      job: '',
      education: 'SLTA / Sederajat',
      phone: '',
      maritalStatus: 'Jejaka',
      beristriKe: '-',
      address: '',
      spouseNik: '',
      spouseName: '',
      spouseFatherName: '',
      spouseMotherName: '',
      spouseBirthPlace: '',
      spouseBirthDate: '',
      spouseNationality: 'WNI',
      spouseReligion: 'Islam',
      spouseJob: '',
      spouseEducation: 'SLTA / Sederajat',
      spouseStatus: 'Perawan',
      spousePhone: '',
      spouseAddress: '',
      fatherNik: '',
      fatherName: '',
      fatherBin: '',
      fatherBirthPlace: '',
      fatherBirthDate: '',
      fatherNationality: 'WNI',
      fatherReligion: 'Islam',
      fatherJob: '',
      fatherAddress: '',
      motherNik: '',
      motherName: '',
      motherBinti: '',
      motherBirthPlace: '',
      motherBirthDate: '',
      motherNationality: 'WNI',
      motherReligion: 'Islam',
      motherJob: '',
      motherAddress: '',
      waliNik: '',
      waliName: '',
      waliBin: '',
      waliRelationship: 'Ayah Kandung',
      waliReasonNotFather: '-',
      waliBirthPlace: '',
      waliBirthDate: '',
      waliReligion: 'Islam',
      waliJob: '',
      waliAddress: '',
      witness1Nik: '',
      witness1Name: '',
      witness1BirthPlace: '',
      witness1BirthDate: '',
      witness1Religion: 'Islam',
      witness1Job: '',
      witness1Role: 'Ketua RT / Saksi I',
      witness1Address: '',
      witness2Nik: '',
      witness2Name: '',
      witness2BirthPlace: '',
      witness2BirthDate: '',
      witness2Religion: 'Islam',
      witness2Job: '',
      witness2Role: 'Ketua RW / Saksi II',
      witness2Address: '',
      deceasedSpouseNik: '',
      deceasedSpouseName: '',
      deceasedSpouseBin: '',
      deceasedSpouseBirthPlace: '',
      deceasedSpouseBirthDate: '',
      deceasedSpouseNationality: 'WNI',
      deceasedSpouseReligion: 'Islam',
      deceasedSpouseJob: '',
      deceasedSpouseAddress: '',
      deceasedSpouseDeathDate: '',
      deceasedSpouseDeathPlace: '',
      akadDay: '',
      akadDate: '',
      akadTime: '09.00 WIB',
      akadPlace: 'KUA Kecamatan Gandrungmangu',
      masKawin: 'Seperangkat Alat Sholat Dibayar Tunai',
      kuaLocation: 'KUA Kecamatan Gandrungmangu',
      purpose: 'Pengantar Pencatatan Pernikahan (N-1 s/d N-6, SPS & SWN) di KUA',
    },
  });

  const nikValue = form.watch('nik');
  const spouseNikValue = form.watch('spouseNik');
  const fatherNikValue = form.watch('fatherNik');
  const motherNikValue = form.watch('motherNik');
  const waliNikValue = form.watch('waliNik');
  const witness1NikValue = form.watch('witness1Nik');
  const witness2NikValue = form.watch('witness2Nik');
  const deceasedSpouseNikValue = form.watch('deceasedSpouseNik');
  const akadDateValue = form.watch('akadDate');
  const maritalStatusValue = form.watch('maritalStatus');

  // Auto-set hari akad dari tanggal akad
  useEffect(() => {
    if (!akadDateValue) return;
    const d = new Date(akadDateValue);
    if (!isNaN(d.getTime())) {
      const dayName = HARI_INDONESIA[d.getDay()];
      if (dayName) {
        form.setValue('akadDay', dayName);
      }
    }
  }, [akadDateValue, form]);

  // Auto-fill dari master data penduduk (Pemohon Utama)
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
            if (resident.educationLevel || (resident as any).education) {
              form.setValue('education', resident.educationLevel || (resident as any).education);
            }
            if ((resident as any).telepon) form.setValue('phone', (resident as any).telepon);
            if (resident.maritalStatus) {
              const st = resident.maritalStatus.toLowerCase();
              const isFemale = resident.gender.toLowerCase().includes('perempuan');
              if (st.includes('belum') || st.includes('kawin')) {
                form.setValue('maritalStatus', isFemale ? 'Perawan' : 'Jejaka');
                form.setValue('spouseStatus', isFemale ? 'Jejaka' : 'Perawan');
              } else if (st.includes('cerai mati') || st.includes('mati')) {
                form.setValue('maritalStatus', isFemale ? 'Janda (Cerai Mati)' : 'Duda (Cerai Mati)');
              } else if (st.includes('cerai hidup')) {
                form.setValue('maritalStatus', isFemale ? 'Janda (Cerai Hidup)' : 'Duda (Cerai Hidup)');
              }
            }
            const fullAddress = `${resident.address}, RT ${resident.rt} RW ${resident.rw}, ${resident.kelurahan}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
            form.setValue('address', fullAddress);

            // Ayah dan Ibu jika ada di data penduduk
            if (resident.fatherName) form.setValue('fatherName', resident.fatherName.toUpperCase());
            if (resident.motherName) form.setValue('motherName', resident.motherName.toUpperCase());
            if ((resident as any).nik_ayah) form.setValue('fatherNik', (resident as any).nik_ayah);
            if ((resident as any).nik_ibu) form.setValue('motherNik', (resident as any).nik_ibu);

            toast({ title: "Data Warga Ditemukan", description: `Memuat data: ${resident.fullName}` });
          }
        } finally {
          setIsSearching(false);
        }
      }
    };
    fetchResident();
  }, [nikValue, firestore, form, toast]);

  // Auto-fill NIK Calon Pasangan
  useEffect(() => {
    const cleanSpouseNik = (spouseNikValue || '').replace(/\D/g, '').trim();
    if (cleanSpouseNik.length !== 16 || !firestore) return;
    let active = true;
    getResidentByNik(firestore, cleanSpouseNik)
      .then((res) => {
        if (!active || !res) return;
        form.setValue('spouseName', res.fullName.toUpperCase());
        if (res.placeOfBirth) form.setValue('spouseBirthPlace', res.placeOfBirth);
        if (res.dateOfBirth) form.setValue('spouseBirthDate', formatDbDateToForm(res.dateOfBirth));
        if (res.religion) form.setValue('spouseReligion', res.religion);
        if (res.occupation) form.setValue('spouseJob', res.occupation);
        if (res.educationLevel || (res as any).education) {
          form.setValue('spouseEducation', res.educationLevel || (res as any).education);
        }
        if (res.fatherName) form.setValue('spouseFatherName', res.fatherName.toUpperCase());
        if (res.motherName) form.setValue('spouseMotherName', res.motherName.toUpperCase());
        const addr = `${res.address || 'Desa Sampeldes'}, RT ${res.rt || '00'} RW ${res.rw || '00'}, ${res.kelurahan || 'Sampeldes'}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
        form.setValue('spouseAddress', addr);
        toast({ title: 'Data Calon Pasangan Ditemukan', description: `Memuat: ${res.fullName}` });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [spouseNikValue, firestore, form, toast]);

  // Auto-fill NIK Ayah Pemohon
  useEffect(() => {
    const cleanFatherNik = (fatherNikValue || '').replace(/\D/g, '').trim();
    if (cleanFatherNik.length !== 16 || !firestore) return;
    let active = true;
    getResidentByNik(firestore, cleanFatherNik)
      .then((res) => {
        if (!active || !res) return;
        form.setValue('fatherName', res.fullName.toUpperCase());
        if (res.fatherName) form.setValue('fatherBin', res.fatherName.toUpperCase());
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
    const cleanMotherNik = (motherNikValue || '').replace(/\D/g, '').trim();
    if (cleanMotherNik.length !== 16 || !firestore) return;
    let active = true;
    getResidentByNik(firestore, cleanMotherNik)
      .then((res) => {
        if (!active || !res) return;
        form.setValue('motherName', res.fullName.toUpperCase());
        if (res.fatherName) form.setValue('motherBinti', res.fatherName.toUpperCase());
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

  // Auto-fill NIK Wali Nikah
  useEffect(() => {
    const cleanWaliNik = (waliNikValue || '').replace(/\D/g, '').trim();
    if (cleanWaliNik.length !== 16 || !firestore) return;
    let active = true;
    getResidentByNik(firestore, cleanWaliNik)
      .then((res) => {
        if (!active || !res) return;
        form.setValue('waliName', res.fullName.toUpperCase());
        if (res.fatherName) form.setValue('waliBin', res.fatherName.toUpperCase());
        if (res.placeOfBirth) form.setValue('waliBirthPlace', res.placeOfBirth);
        if (res.dateOfBirth) form.setValue('waliBirthDate', formatDbDateToForm(res.dateOfBirth));
        if (res.religion) form.setValue('waliReligion', res.religion);
        if (res.occupation) form.setValue('waliJob', res.occupation);
        const addr = `${res.address || 'Desa Sampeldes'}, RT ${res.rt || '00'} RW ${res.rw || '00'}, ${res.kelurahan || 'Sampeldes'}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
        form.setValue('waliAddress', addr);
        toast({ title: 'Data Wali Nikah Ditemukan', description: `Memuat: ${res.fullName}` });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [waliNikValue, firestore, form, toast]);

  // Auto-fill NIK Saksi 1
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

  // Auto-fill NIK Saksi 2
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

  // Auto-fill NIK Almarhum/Almarhumah Pasangan Terdahulu (N-6)
  useEffect(() => {
    const cleanNik = (deceasedSpouseNikValue || '').replace(/\D/g, '').trim();
    if (cleanNik.length !== 16 || !firestore) return;
    let active = true;
    getResidentByNik(firestore, cleanNik)
      .then((res) => {
        if (!active || !res) return;
        form.setValue('deceasedSpouseName', res.fullName.toUpperCase());
        if (res.fatherName) form.setValue('deceasedSpouseBin', res.fatherName.toUpperCase());
        if (res.placeOfBirth) form.setValue('deceasedSpouseBirthPlace', res.placeOfBirth);
        if (res.dateOfBirth) form.setValue('deceasedSpouseBirthDate', formatDbDateToForm(res.dateOfBirth));
        if (res.religion) form.setValue('deceasedSpouseReligion', res.religion);
        if (res.occupation) form.setValue('deceasedSpouseJob', res.occupation);
        const addr = `${res.address || 'Desa Sampeldes'}, RT ${res.rt || '00'} RW ${res.rw || '00'}, ${res.kelurahan || 'Sampeldes'}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
        form.setValue('deceasedSpouseAddress', addr);
        toast({ title: 'Data Almarhum/Almarhumah Ditemukan', description: `Memuat: ${res.fullName}` });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [deceasedSpouseNikValue, firestore, form, toast]);

  const copyFatherToWali = () => {
    const vals = form.getValues();
    form.setValue('waliNik', vals.fatherNik || '');
    form.setValue('waliName', vals.fatherName || '');
    form.setValue('waliBin', vals.fatherBin || '');
    form.setValue('waliRelationship', 'Ayah Kandung');
    form.setValue('waliReasonNotFather', '-');
    form.setValue('waliBirthPlace', vals.fatherBirthPlace || '');
    form.setValue('waliBirthDate', vals.fatherBirthDate || '');
    form.setValue('waliReligion', vals.fatherReligion || 'Islam');
    form.setValue('waliJob', vals.fatherJob || '');
    form.setValue('waliAddress', vals.fatherAddress || vals.address || '');
    toast({ title: 'Disalin dari Data Ayah', description: 'Data Ayah Kandung berhasil disalin sebagai Wali Nikah.' });
  };

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
        toast({ title: "Berkas Belum Lengkap", description: "Mohon unggah KTP pemohon.", variant: "destructive" });
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

      const isMaleApplicant = values.gender.toLowerCase().includes('laki');
      const resolvedWaliName = values.waliName || values.fatherName || '';
      const resolvedWaliNik = values.waliNik || values.fatherNik || '';
      const resolvedWaliBin = values.waliBin || values.fatherBin || '';
      const resolvedWaliBirthPlace = values.waliBirthPlace || values.fatherBirthPlace || '';
      const resolvedWaliBirthDate = values.waliBirthDate || values.fatherBirthDate || '';
      const resolvedWaliReligion = values.waliReligion || values.fatherReligion || 'Islam';
      const resolvedWaliJob = values.waliJob || values.fatherJob || '';
      const resolvedWaliAddress = values.waliAddress || values.fatherAddress || values.address || '';

      const openSidPelakuBagian = {
        individu: {
          nik: values.nik,
          nama: values.name,
          jenis_kelamin: values.gender,
          tempat_lahir: values.birthPlace,
          tanggal_lahir: values.birthDate,
          warga_negara: values.nationality || 'WNI',
          agama: values.religion,
          pekerjaan: values.job,
          pendidikan_kk: values.education || 'SLTA / Sederajat',
          status_kawin: values.maritalStatus,
          alamat: values.address,
          nama_ayah: values.fatherName,
          nama_ibu: values.motherName,
        },
        ayah: {
          nik: values.fatherNik || '-',
          nama: values.fatherName,
          nama_ayah: values.fatherBin || '-',
          tempat_lahir: values.fatherBirthPlace || '-',
          tanggal_lahir: values.fatherBirthDate || '-',
          warga_negara: values.fatherNationality || 'WNI',
          agama: values.fatherReligion || 'Islam',
          pekerjaan: values.fatherJob || '-',
          alamat: values.fatherAddress || values.address,
        },
        ibu: {
          nik: values.motherNik || '-',
          nama: values.motherName,
          nama_ayah: values.motherBinti || '-',
          tempat_lahir: values.motherBirthPlace || '-',
          tanggal_lahir: values.motherBirthDate || '-',
          warga_negara: values.motherNationality || 'WNI',
          agama: values.motherReligion || 'Islam',
          pekerjaan: values.motherJob || '-',
          alamat: values.motherAddress || values.address,
        },
        pasangan: {
          nik: values.spouseNik || '-',
          nama: values.spouseName,
          nama_ayah: values.spouseFatherName || '-',
          nama_ibu: values.spouseMotherName || '-',
          jenis_kelamin: isMaleApplicant ? 'Perempuan' : 'Laki-laki',
          tempat_lahir: values.spouseBirthPlace,
          tanggal_lahir: values.spouseBirthDate,
          warga_negara: values.spouseNationality || 'WNI',
          agama: values.spouseReligion || 'Islam',
          pekerjaan: values.spouseJob,
          pendidikan_kk: values.spouseEducation || 'SLTA / Sederajat',
          status_kawin: values.spouseStatus,
          alamat: values.spouseAddress,
        },
        calon_pasangan: {
          nik: values.spouseNik || '-',
          nama: values.spouseName,
          nama_ayah: values.spouseFatherName || '-',
          nama_ibu: values.spouseMotherName || '-',
          jenis_kelamin: isMaleApplicant ? 'Perempuan' : 'Laki-laki',
          tempat_lahir: values.spouseBirthPlace,
          tanggal_lahir: values.spouseBirthDate,
          warga_negara: values.spouseNationality || 'WNI',
          agama: values.spouseReligion || 'Islam',
          pekerjaan: values.spouseJob,
          pendidikan_kk: values.spouseEducation || 'SLTA / Sederajat',
          status_kawin: values.spouseStatus,
          alamat: values.spouseAddress,
        },
        wali: {
          nik: resolvedWaliNik || '-',
          nama: resolvedWaliName,
          nama_ayah: resolvedWaliBin || '-',
          tempat_lahir: resolvedWaliBirthPlace || '-',
          tanggal_lahir: resolvedWaliBirthDate || '-',
          warga_negara: 'WNI',
          agama: resolvedWaliReligion,
          pekerjaan: resolvedWaliJob || '-',
          alamat: resolvedWaliAddress,
          hubungan_kk: values.waliRelationship || 'Ayah Kandung',
        },
        saksi_1: {
          nik: values.witness1Nik || '-',
          nama: values.witness1Name || '-',
          tempat_lahir: values.witness1BirthPlace || '-',
          tanggal_lahir: values.witness1BirthDate || '-',
          agama: values.witness1Religion || 'Islam',
          pekerjaan: values.witness1Job || '-',
          alamat: values.witness1Address || values.address,
          hubungan_kk: values.witness1Role || 'Saksi I',
        },
        saksi_2: {
          nik: values.witness2Nik || '-',
          nama: values.witness2Name || '-',
          tempat_lahir: values.witness2BirthPlace || '-',
          tanggal_lahir: values.witness2BirthDate || '-',
          agama: values.witness2Religion || 'Islam',
          pekerjaan: values.witness2Job || '-',
          alamat: values.witness2Address || values.address,
          hubungan_kk: values.witness2Role || 'Saksi II',
        },
        almarhum: {
          nik: values.deceasedSpouseNik || '-',
          nama: values.deceasedSpouseName || '-',
          nama_ayah: values.deceasedSpouseBin || '-',
          tempat_lahir: values.deceasedSpouseBirthPlace || '-',
          tanggal_lahir: values.deceasedSpouseBirthDate || '-',
          warga_negara: values.deceasedSpouseNationality || 'WNI',
          agama: values.deceasedSpouseReligion || 'Islam',
          pekerjaan: values.deceasedSpouseJob || '-',
          alamat: values.deceasedSpouseAddress || '-',
        },
      };

      const effectiveLetterType = letterType || 'Surat Pengantar Nikah (N-1 - N-4)';

      await addSubmission(firestore, {
        ticketNumber: newTicketNumber,
        requesterName: values.name,
        nik: values.nik,
        letterType: effectiveLetterType,
        formData: {
          ...values,
          letterType: effectiveLetterType,
          lampiran: ['Model N-1', 'Model N-2', 'Model N-4', 'Model N-5', 'Model N-6', 'SPS', 'SWN'],
          openSidPelakuBagian,
          phone: values.phone,
          telepon: values.phone,
          form_telepon: values.phone,
          form_pendidikan: values.education || 'SLTA / Sederajat',
          form_status_kawin: values.maritalStatus,
          form_beristri_ke: values.beristriKe || '-',
          // Pasangan & Calon Pasangan
          form_nama_pasangan: values.spouseName,
          form_nama_calon_pasangan: values.spouseName,
          form_nik_pasangan: values.spouseNik || '-',
          form_nik_calon_pasangan: values.spouseNik || '-',
          form_bin_pasangan: values.spouseFatherName || '-',
          form_bin_calon_pasangan: values.spouseFatherName || '-',
          form_ibu_pasangan: values.spouseMotherName || '-',
          form_tempat_lahir_pasangan: values.spouseBirthPlace,
          form_tanggal_lahir_pasangan: values.spouseBirthDate,
          form_wn_pasangan: values.spouseNationality || 'WNI',
          form_warga_negara_pasangan: values.spouseNationality || 'WNI',
          form_agama_pasangan: values.spouseReligion || 'Islam',
          form_pekerjaan_pasangan: values.spouseJob,
          form_pendidikan_pasangan: values.spouseEducation || 'SLTA / Sederajat',
          form_status_pasangan: values.spouseStatus,
          form_alamat_pasangan: values.spouseAddress,
          form_no_hp_pasangan: values.spousePhone || '-',
          // Tujuan & KUA
          form_tujuan: values.kuaLocation,
          tujuan: values.kuaLocation,
          kua_tujuan: values.kuaLocation,
          destinationKua: values.kuaLocation,
          // Orang Tua
          form_nama_ayah: values.fatherName,
          form_nik_ayah: values.fatherNik || '-',
          form_bin_ayah: values.fatherBin || '-',
          form_tempat_lahir_ayah: values.fatherBirthPlace || '-',
          form_tanggal_lahir_ayah: values.fatherBirthDate || '-',
          form_wn_ayah: values.fatherNationality || 'WNI',
          form_agama_ayah: values.fatherReligion || 'Islam',
          form_pekerjaan_ayah: values.fatherJob || '-',
          form_alamat_ayah: values.fatherAddress || values.address,
          form_nama_ibu: values.motherName,
          form_nik_ibu: values.motherNik || '-',
          form_binti_ibu: values.motherBinti || '-',
          form_tempat_lahir_ibu: values.motherBirthPlace || '-',
          form_tanggal_lahir_ibu: values.motherBirthDate || '-',
          form_wn_ibu: values.motherNationality || 'WNI',
          form_agama_ibu: values.motherReligion || 'Islam',
          form_pekerjaan_ibu: values.motherJob || '-',
          form_alamat_ibu: values.motherAddress || values.address,
          // Wali Nikah
          form_nama_wali: resolvedWaliName,
          form_nik_wali: resolvedWaliNik || '-',
          form_bin_wali: resolvedWaliBin || '-',
          form_hubungan_wali: values.waliRelationship || 'Ayah Kandung',
          form_alasan_wali: values.waliReasonNotFather || '-',
          form_tempat_lahir_wali: resolvedWaliBirthPlace || '-',
          form_tanggal_lahir_wali: resolvedWaliBirthDate || '-',
          form_agama_wali: resolvedWaliReligion,
          form_pekerjaan_wali: resolvedWaliJob || '-',
          form_alamat_wali: resolvedWaliAddress,
          // Saksi 1 & 2
          form_nama_saksi1: values.witness1Name || '-',
          form_nik_saksi1: values.witness1Nik || '-',
          form_tempat_lahir_saksi1: values.witness1BirthPlace || '-',
          form_tanggal_lahir_saksi1: values.witness1BirthDate || '-',
          form_agama_saksi1: values.witness1Religion || 'Islam',
          form_pekerjaan_saksi1: values.witness1Job || '-',
          form_jabatan_saksi1: values.witness1Role || 'Ketua RT / Saksi I',
          form_alamat_saksi1: values.witness1Address || values.address,
          form_nama_saksi2: values.witness2Name || '-',
          form_nik_saksi2: values.witness2Nik || '-',
          form_tempat_lahir_saksi2: values.witness2BirthPlace || '-',
          form_tanggal_lahir_saksi2: values.witness2BirthDate || '-',
          form_agama_saksi2: values.witness2Religion || 'Islam',
          form_pekerjaan_saksi2: values.witness2Job || '-',
          form_jabatan_saksi2: values.witness2Role || 'Ketua RW / Saksi II',
          form_alamat_saksi2: values.witness2Address || values.address,
          // Almarhum/Almarhumah (N-6)
          form_nama_almarhum: values.deceasedSpouseName || '-',
          form_bin_almarhum: values.deceasedSpouseBin || '-',
          form_nik_almarhum: values.deceasedSpouseNik || '-',
          form_tempat_lahir_almarhum: values.deceasedSpouseBirthPlace || '-',
          form_tanggal_lahir_almarhum: values.deceasedSpouseBirthDate || '-',
          form_wn_almarhum: values.deceasedSpouseNationality || 'WNI',
          form_agama_almarhum: values.deceasedSpouseReligion || 'Islam',
          form_pekerjaan_almarhum: values.deceasedSpouseJob || '-',
          form_alamat_almarhum: values.deceasedSpouseAddress || '-',
          form_tanggal_meninggal: values.deceasedSpouseDeathDate || '-',
          form_tempat_meninggal: values.deceasedSpouseDeathPlace || '-',
          // Akad & KUA
          form_hari_nikah: values.akadDay || '-',
          form_tanggal_nikah: values.akadDate || '-',
          form_jam_nikah: values.akadTime || '09.00 WIB',
          form_tempat_nikah: values.akadPlace || values.kuaLocation,
          form_mas_kawin: values.masKawin || 'Seperangkat Alat Sholat Dibayar Tunai',
          form_kua_tujuan: values.kuaLocation,
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

  const isCeraiMati = maritalStatusValue.toLowerCase().includes('mati');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* I. DATA CALON MEMPELAI (PEMOHON) */}
        <FormSection
          title="I. Identitas Calon Pengantin (Pemohon)"
          subtitle="Digunakan pada Surat Pengantar Nikah, Model N-1, N-4, N-5, SPS, dan SWN"
          icon={<Heart className="h-5 w-5" />}
        >
          <FormField
            control={form.control}
            name="nik"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">
                  NIK Calon Pengantin {isSearching && <Loader2 className="inline h-3 w-3 animate-spin ml-1 text-primary" />}
                </FormLabel>
                <FormControl>
                  <Input placeholder="16 digit NIK..." maxLength={16} {...field} />
                </FormControl>
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
                <FormControl><Input placeholder="Nama calon pengantin..." {...field} /></FormControl>
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
                    <SelectTrigger><SelectValue placeholder="Pilih Jenis Kelamin" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
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
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Status Pernikahan</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Jejaka">Jejaka</SelectItem>
                    <SelectItem value="Perawan">Perawan</SelectItem>
                    <SelectItem value="Duda (Cerai Mati)">Duda (Cerai Mati)</SelectItem>
                    <SelectItem value="Duda (Cerai Hidup)">Duda (Cerai Hidup)</SelectItem>
                    <SelectItem value="Janda (Cerai Mati)">Janda (Cerai Mati)</SelectItem>
                    <SelectItem value="Janda (Cerai Hidup)">Janda (Cerai Hidup)</SelectItem>
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
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Tempat Lahir</FormLabel>
                <FormControl><Input placeholder="Kota/Kabupaten lahir..." {...field} /></FormControl>
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
            name="religion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Agama</FormLabel>
                <FormControl><Input placeholder="Islam..." {...field} /></FormControl>
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
                <FormControl><Input placeholder="WNI / Indonesia..." {...field} /></FormControl>
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
                <FormControl><Input placeholder="Wiraswasta / Karyawan..." {...field} /></FormControl>
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
                <FormControl><Input placeholder="SLTA / Sederajat / S1..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Nomor HP / WhatsApp {isAdmin ? <span className="text-slate-400 font-normal text-xs">(Opsional)</span> : <span className="text-red-500">*</span>}</FormLabel>
                <FormControl><Input placeholder={isAdmin ? "Opsional untuk pengajuan admin" : "Contoh: 081234567890"} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="beristriKe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Beristri Ke- (Jika Laki-laki Poligami)</FormLabel>
                <FormControl><Input placeholder="- (Kosongkan jika bukan poligami)" {...field} /></FormControl>
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
                  <FormControl><Textarea placeholder="Alamat lengkap calon pengantin..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* II. DATA CALON PASANGAN */}
        <FormSection
          title="II. Identitas Calon Pasangan (Suami / Istri)"
          subtitle="Digunakan pada Model N-2, N-4, N-5, SPS (Hal 1 & 2), dan SWN"
          icon={<User className="h-5 w-5" />}
        >
          <FormField
            control={form.control}
            name="spouseNik"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIK Calon Pasangan (Isi 16 digit untuk auto-fill jika warga desa)</FormLabel>
                <FormControl><Input placeholder="16 digit NIK pasangan..." maxLength={16} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spouseName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Nama Calon Pasangan</FormLabel>
                <FormControl><Input placeholder="Nama lengkap calon pasangan..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spouseFatherName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Bin / Binti (Nama Ayah Kandung Pasangan)</FormLabel>
                <FormControl><Input placeholder="Nama ayah kandung pasangan (untuk N-4, N-5, SPS)..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spouseMotherName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Ibu Kandung Pasangan</FormLabel>
                <FormControl><Input placeholder="Nama ibu kandung pasangan (untuk SPS)..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spouseBirthPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Tempat Lahir Pasangan</FormLabel>
                <FormControl><Input placeholder="Kota/Kab lahir..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spouseBirthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Tanggal Lahir Pasangan</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spouseReligion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Agama Pasangan</FormLabel>
                <FormControl><Input placeholder="Islam..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spouseNationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kewarganegaraan Pasangan</FormLabel>
                <FormControl><Input placeholder="WNI / Indonesia..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spouseJob"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Pekerjaan Pasangan</FormLabel>
                <FormControl><Input placeholder="Pekerjaan pasangan..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spouseEducation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pendidikan Terakhir Pasangan</FormLabel>
                <FormControl><Input placeholder="SLTA / Sederajat / S1..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spouseStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Status Calon Pasangan</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Jejaka">Jejaka</SelectItem>
                    <SelectItem value="Perawan">Perawan</SelectItem>
                    <SelectItem value="Duda">Duda</SelectItem>
                    <SelectItem value="Janda">Janda</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spousePhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor HP Calon Pasangan (Opsional)</FormLabel>
                <FormControl><Input placeholder="Contoh: 0812..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="spouseAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Alamat Calon Pasangan</FormLabel>
                  <FormControl><Textarea placeholder="Alamat domisili/asal pasangan..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* III. DATA ORANG TUA PEMOHON */}
        <FormSection
          title="III. Identitas Orang Tua Kandung Pemohon"
          subtitle="Digunakan pada Surat Pengantar Nikah, Model N-1, Model N-5 (Surat Izin Orang Tua), dan SPS"
          icon={<Users className="h-5 w-5" />}
        >
          <div className="md:col-span-2 border-b pb-2 font-bold text-slate-700 text-sm">A. DATA AYAH KANDUNG</div>
          <FormField
            control={form.control}
            name="fatherNik"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIK Ayah (Isi 16 digit untuk auto-fill)</FormLabel>
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
                <FormControl><Input placeholder="Nama ayah kandung..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fatherBin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bin Ayah (Nama Kakek dari pihak Ayah - untuk N-5)</FormLabel>
                <FormControl><Input placeholder="Bin / Nama ayah dari ayah..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fatherReligion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agama Ayah</FormLabel>
                <FormControl><Input placeholder="Islam..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fatherBirthPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempat Lahir Ayah</FormLabel>
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
                <FormLabel>Tanggal Lahir Ayah</FormLabel>
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
                <FormLabel>Pekerjaan Ayah</FormLabel>
                <FormControl><Input placeholder="Petani / Wiraswasta..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fatherAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat Ayah</FormLabel>
                <FormControl><Input placeholder="Alamat lengkap ayah..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2 border-b pb-2 pt-3 font-bold text-slate-700 text-sm">B. DATA IBU KANDUNG</div>
          <FormField
            control={form.control}
            name="motherNik"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIK Ibu (Isi 16 digit untuk auto-fill)</FormLabel>
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
                <FormControl><Input placeholder="Nama ibu kandung..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="motherBinti"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Binti Ibu (Nama Kakek dari pihak Ibu - untuk N-5)</FormLabel>
                <FormControl><Input placeholder="Binti / Nama ayah dari ibu..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="motherReligion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agama Ibu</FormLabel>
                <FormControl><Input placeholder="Islam..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="motherBirthPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempat Lahir Ibu</FormLabel>
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
                <FormLabel>Tanggal Lahir Ibu</FormLabel>
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
                <FormLabel>Pekerjaan Ibu</FormLabel>
                <FormControl><Input placeholder="Mengurus Rumah Tangga / Pedagang..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="motherAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat Ibu</FormLabel>
                <FormControl><Input placeholder="Alamat lengkap ibu..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* IV. DATA WALI NIKAH (SWN & SPS) */}
        <FormSection
          title="IV. Data Wali Nikah (Untuk Lampiran SWN & SPS)"
          subtitle="Jika dikosongkan, sistem otomatis menggunakan data Ayah Kandung sebagai Wali Nikah"
          icon={<ShieldCheck className="h-5 w-5" />}
          action={
            <Button type="button" variant="outline" size="sm" onClick={copyFatherToWali} className="rounded-xl text-xs font-bold">
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Salin dari Data Ayah
            </Button>
          }
        >
          <FormField
            control={form.control}
            name="waliNik"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIK Wali Nikah (Isi 16 digit untuk auto-fill)</FormLabel>
                <FormControl><Input placeholder="16 digit NIK wali nikah..." maxLength={16} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="waliName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Nama Lengkap Wali Nikah</FormLabel>
                <FormControl><Input placeholder="Nama lengkap wali nikah..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="waliBin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bin (Nama Ayah dari Wali Nikah)</FormLabel>
                <FormControl><Input placeholder="Nama ayah dari wali nikah..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="waliRelationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Hubungan Wali Nikah</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Pilih Hubungan Wali" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Ayah Kandung">Ayah Kandung</SelectItem>
                    <SelectItem value="Kakek Kandung">Kakek Kandung</SelectItem>
                    <SelectItem value="Saudara Laki-laki Kandung">Saudara Laki-laki Kandung</SelectItem>
                    <SelectItem value="Saudara Laki-laki Seayah">Saudara Laki-laki Seayah</SelectItem>
                    <SelectItem value="Paman Kandung (Saudara Ayah)">Paman Kandung (Saudara Ayah)</SelectItem>
                    <SelectItem value="Wali Hakim">Wali Hakim</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="waliBirthPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempat Lahir Wali</FormLabel>
                <FormControl><Input placeholder="Kota/Kab lahir wali..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="waliBirthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Lahir Wali</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="waliReligion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agama Wali</FormLabel>
                <FormControl><Input placeholder="Islam..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="waliJob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pekerjaan Wali</FormLabel>
                <FormControl><Input placeholder="Pekerjaan wali nikah..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="waliReasonNotFather"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alasan Bila Bukan Wali Ayah Kandung</FormLabel>
                <FormControl><Input placeholder="Misal: Ayah kandung telah meninggal dunia / -" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="waliAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat Tempat Tinggal Wali</FormLabel>
                <FormControl><Input placeholder="Alamat lengkap wali nikah..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* V. DATA SAKSI I & SAKSI II (SPS & SWN) */}
        <FormSection
          title="V. Data Saksi Pernikahan / Pernyataan (SPS & SWN)"
          subtitle="Digunakan untuk mengisi daftar Saksi I & Saksi II pada lampiran SPS dan SWN"
          icon={<UserCheck className="h-5 w-5" />}
        >
          <div className="md:col-span-2 border-b pb-2 font-bold text-slate-700 text-sm">A. DATA SAKSI I (KETUA RT / SAKSI NIKAH I)</div>
          <FormField
            control={form.control}
            name="witness1Nik"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIK Saksi I (Isi 16 digit untuk auto-fill)</FormLabel>
                <FormControl><Input placeholder="16 digit NIK Saksi I..." maxLength={16} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="witness1Name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Nama Lengkap Saksi I</FormLabel>
                <FormControl><Input placeholder="Nama lengkap Saksi I..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="witness1BirthPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempat Lahir Saksi I</FormLabel>
                <FormControl><Input placeholder="Tempat lahir Saksi I..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="witness1BirthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Lahir Saksi I</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
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
                <FormControl><Input placeholder="Pekerjaan Saksi I..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="witness1Role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jabatan / Keterangan Saksi I</FormLabel>
                <FormControl><Input placeholder="Contoh: Ketua RT 002 / Saksi I" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="witness1Address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Saksi I</FormLabel>
                  <FormControl><Input placeholder="Alamat lengkap Saksi I..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="md:col-span-2 border-b pb-2 pt-3 font-bold text-slate-700 text-sm">B. DATA SAKSI II (KETUA RW / SAKSI NIKAH II)</div>
          <FormField
            control={form.control}
            name="witness2Nik"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIK Saksi II (Isi 16 digit untuk auto-fill)</FormLabel>
                <FormControl><Input placeholder="16 digit NIK Saksi II..." maxLength={16} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="witness2Name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Nama Lengkap Saksi II</FormLabel>
                <FormControl><Input placeholder="Nama lengkap Saksi II..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="witness2BirthPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempat Lahir Saksi II</FormLabel>
                <FormControl><Input placeholder="Tempat lahir Saksi II..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="witness2BirthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Lahir Saksi II</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
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
                <FormControl><Input placeholder="Pekerjaan Saksi II..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="witness2Role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jabatan / Keterangan Saksi II</FormLabel>
                <FormControl><Input placeholder="Contoh: Ketua RW 001 / Saksi II" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="witness2Address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Saksi II</FormLabel>
                  <FormControl><Input placeholder="Alamat lengkap Saksi II..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* VI. DATA KEMATIAN SUAMI/ISTRI TERDAHULU (MODEL N-6) */}
        <FormSection
          title="VI. Data Kematian Suami / Istri Terdahulu (Khusus Model N-6)"
          subtitle={isCeraiMati ? "Status Pemohon adalah Cerai Mati — mohon lengkapi data almarhum/almarhumah untuk Model N-6" : "Opsional — hanya diisi apabila Pemohon berstatus Duda / Janda Cerai Mati untuk mengisi Formulir Model N-6"}
          icon={<Calendar className="h-5 w-5" />}
        >
          <FormField
            control={form.control}
            name="deceasedSpouseNik"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIK Almarhum / Almarhumah (Opsional)</FormLabel>
                <FormControl><Input placeholder="16 digit NIK almarhum/almarhumah..." maxLength={16} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deceasedSpouseName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Lengkap Almarhum / Almarhumah</FormLabel>
                <FormControl><Input placeholder="Nama suami/istri terdahulu yang telah meninggal..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deceasedSpouseBin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bin / Binti Almarhum / Almarhumah</FormLabel>
                <FormControl><Input placeholder="Nama ayah dari almarhum/almarhumah..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deceasedSpouseJob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pekerjaan Terakhir Almarhum / Almarhumah</FormLabel>
                <FormControl><Input placeholder="Pekerjaan terakhir..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deceasedSpouseBirthPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempat Lahir Almarhum / Almarhumah</FormLabel>
                <FormControl><Input placeholder="Tempat lahir..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deceasedSpouseBirthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Lahir Almarhum / Almarhumah</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deceasedSpouseDeathDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Meninggal Dunia</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deceasedSpouseDeathPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempat Meninggal Dunia</FormLabel>
                <FormControl><Input placeholder="Contoh: Desa Sampeldes / RSUD Cilacap" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="deceasedSpouseAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Terakhir Almarhum / Almarhumah</FormLabel>
                  <FormControl><Input placeholder="Alamat tempat tinggal terakhir..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* VII. RENCANA PERNIKAHAN & KUA */}
        <FormSection
          title="VII. Rencana Akad Nikah & Lokasi KUA (Model N-2 & SPS)"
          subtitle="Digunakan untuk mengisi Permohonan Kehendak Perkawinan (Model N-2) dan Data Mas Kawin di SPS"
          icon={<MapPin className="h-5 w-5" />}
        >
          <FormField
            control={form.control}
            name="akadDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rencana Tanggal Akad Nikah</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="akadDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hari Akad Nikah</FormLabel>
                <FormControl><Input placeholder="Otomatis dari tanggal / Contoh: Minggu" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="akadTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jam / Pukul Akad Nikah</FormLabel>
                <FormControl><Input placeholder="Contoh: 09.00 WIB" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="akadPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempat Pelaksanaan Akad Nikah</FormLabel>
                <FormControl><Input placeholder="Contoh: KUA Kec. Gandrungmangu / Rumah Mempelai Perempuan" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="masKawin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mas Kawin / Mahar (Untuk SPS Hal 2)</FormLabel>
                <FormControl><Input placeholder="Contoh: Seperangkat Alat Sholat Dibayar Tunai" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kuaLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">KUA Tujuan (Kepada Yth. Kepala KUA)</FormLabel>
                <FormControl><Input placeholder="KUA Kecamatan Gandrungmangu..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Keperluan Pengajuan Surat</FormLabel>
                <FormControl><Input placeholder="Contoh: Pengantar Pencatatan Pernikahan (N-1 s/d N-6, SPS & SWN) di KUA" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* VIII. BERKAS LAMPIRAN */}
        <FormSection title="VIII. Berkas Pendukung (KTP & KK)" icon={<Paperclip className="h-5 w-5" />}>
          <GoogleFileUploader
            label="KTP Calon Pengantin (Pemohon)"
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
            label="KTP Calon Pasangan / Akta Cerai / Surat Kematian"
            fieldName="berkas_pasangan"
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
              'Kirim Pengajuan Surat Pengantar Nikah (N-1 s/d N-6, SPS & SWN)'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
