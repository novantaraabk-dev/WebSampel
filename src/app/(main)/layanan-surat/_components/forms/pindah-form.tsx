'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Users, User, MapPin, UploadCloud, FileCheck, Trash2, Plus } from 'lucide-react';

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
import { getResidentByNik, getResidentsByKk } from '@/lib/residents';
import { Resident } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toTitleCaseIndonesian } from '@/lib/opensid-surat-engine';
import { IndonesianRegionPicker } from '@/components/ui/indonesian-region-picker';
import { findPostalCode } from '@/lib/indonesian-regions';
import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';

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

const FormSection = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: React.ElementType }) => (
  <div className="space-y-6 rounded-[2rem] border p-6 md:p-10 bg-white shadow-sm">
    <div className="flex items-center gap-3 border-b pb-4">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
  </div>
);

const formSchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 digit.'),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  kkNumber: z.string().min(1, 'Nomor KK wajib diisi.'),
  kkHead: z.string().min(1, 'Nama kepala keluarga wajib diisi.'),
  phone: phoneValidationSchema,
  currentAddressStreet: z.string().optional(),
  currentAddressRt: z.string().min(1, 'RT wajib diisi.'),
  currentAddressRw: z.string().min(1, 'RW wajib diisi.'),
  currentAddressDusun: z.string().optional(),
  
  alasanPindah: z.string().default('Keluarga'),
  purpose: z.string().min(1, 'Alasan / Keperluan pindah wajib diisi.'),
  klasifikasiPindah: z.string().default('Antar Kabupaten/Kota'),
  jenisKepindahan: z.string().default('Kepala Keluarga Dan Seluruh Anggota Keluarga'),
  statusKkTidakPindah: z.string().default('Nomor KK Tetap'),
  statusKkPindah: z.string().default('Membuat KK Baru'),
  moveDate: z.string().optional(),

  destinationStreet: z.string().optional(),
  destinationAddress: z.string().min(1, 'Desa / Kelurahan tujuan wajib diisi.'),
  destinationAddressRt: z.string().min(1, 'RT tujuan wajib diisi.'),
  destinationAddressRw: z.string().min(1, 'RW tujuan wajib diisi.'),
  destinationDusun: z.string().optional(),
  destinationKecamatan: z.string().min(1, 'Kecamatan tujuan wajib diisi.'),
  destinationKabupaten: z.string().min(1, 'Kabupaten/Kota tujuan wajib diisi.'),
  destinationProvinsi: z.string().min(1, 'Provinsi tujuan wajib diisi.'),
  destinationPostalCode: z.string().optional(),

  familyCount: z.coerce.number().min(0, 'Jumlah keluarga minimal 0.'),
  familyMembers: z.array(z.object({
    nik: z.string().optional(),
    name: z.string().min(1, 'Nama harus diisi.'),
    relationship: z.string().min(1, 'Hubungan (SHDK) harus diisi.'),
    masaBerlaku: z.string().default('SEUMUR HIDUP'),
  })).optional(),
});

export function PindahForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingResident, setIsSearchingResident] = useState(false);
  const [isLoadingFamily, setIsLoadingFamily] = useState(false);
  const [isSearchingPostalCode, setIsSearchingPostalCode] = useState(false);
  const [applicantResident, setApplicantResident] = useState<Resident | null>(null);
  const [filesToUpload, setFilesToUpload] = useState<Array<{ fieldName: string; file: File }>>([]);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: '',
      name: '',
      kkNumber: '',
      kkHead: '',
      phone: '',
      currentAddressStreet: '',
      currentAddressRt: '',
      currentAddressRw: '',
      currentAddressDusun: '',
      alasanPindah: 'Keluarga',
      purpose: 'Pindah Domisili Tempat Tinggal / Mengikuti Suami-Istri / Pekerjaan',
      klasifikasiPindah: 'Antar Kabupaten/Kota',
      jenisKepindahan: 'Kepala Keluarga Dan Seluruh Anggota Keluarga',
      statusKkTidakPindah: 'Nomor KK Tetap',
      statusKkPindah: 'Membuat KK Baru',
      moveDate: '',
      destinationStreet: '',
      destinationAddress: '',
      destinationAddressRt: '',
      destinationAddressRw: '',
      destinationDusun: '',
      destinationKecamatan: '',
      destinationKabupaten: '',
      destinationProvinsi: '',
      destinationPostalCode: '',
      familyCount: 0,
      familyMembers: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "familyMembers",
  });

  const nikValue = form.watch('nik');
  const familyCount = form.watch('familyCount');

  useEffect(() => {
    const fetchResident = async () => {
      if (nikValue.length === 16 && firestore) {
        setIsSearchingResident(true);
        try {
          const resident = await getResidentByNik(firestore, nikValue);
          if (resident) {
            setApplicantResident(resident);
            form.setValue('name', toTitleCaseIndonesian(resident.fullName));
            form.setValue('kkNumber', resident.noKk);
            form.setValue('kkHead', toTitleCaseIndonesian(resident.fullName));
            if (resident.rt) form.setValue('currentAddressRt', resident.rt);
            if (resident.rw) form.setValue('currentAddressRw', resident.rw);
            if (resident.dusun) form.setValue('currentAddressDusun', toTitleCaseIndonesian(resident.dusun));
            if (resident.address) form.setValue('currentAddressStreet', toTitleCaseIndonesian(resident.address));
            if ((resident as any).telepon || (resident as any).phone) form.setValue('phone', (resident as any).telepon || (resident as any).phone);

            // Otomatis tarik seluruh anggota keluarga dengan nomor KK yang sama
            if (resident.noKk) {
              setIsLoadingFamily(true);
              try {
                const familyList = await getResidentsByKk(firestore, resident.noKk);
                // Cari Kepala Keluarga untuk mengisi Nama Kepala Keluarga
                const head = familyList.find(f => {
                  const rel = (f.relationshipToHeadOfFamily || '').toUpperCase();
                  return rel.includes('KEPALA') || rel === 'KEPALA KELUARGA';
                });
                if (head) {
                  form.setValue('kkHead', toTitleCaseIndonesian(head.fullName));
                }

                // Anggota keluarga yang ikut pindah (semua anggota keluarga di KK selain pemohon)
                const otherFamilyMembers = familyList.filter(f => f.nik !== resident.nik);
                const movingMembers = otherFamilyMembers.map(m => ({
                  nik: m.nik,
                  name: toTitleCaseIndonesian(m.fullName),
                  relationship: toTitleCaseIndonesian(m.relationshipToHeadOfFamily || (m as any).shdk || 'Anggota Keluarga'),
                  masaBerlaku: 'SEUMUR HIDUP',
                }));

                form.setValue('familyMembers', movingMembers);
                form.setValue('familyCount', movingMembers.length);
              } catch (err) {
                console.error("Gagal menarik anggota keluarga dari KK:", err);
              } finally {
                setIsLoadingFamily(false);
              }
            }

            toast({ title: "Data Pemohon Ditemukan" });
          }
        } finally {
          setIsSearchingResident(false);
        }
      }
    };
    fetchResident();
  }, [nikValue, firestore, form, toast]);

  useEffect(() => {
    const count = Math.max(0, Number(familyCount) || 0);
    const currentLength = fields.length;
    if (count > currentLength) {
      for (let i = currentLength; i < count; i++) {
        append({ nik: '', name: '', relationship: 'Anggota Keluarga', masaBerlaku: 'SEUMUR HIDUP' }, { shouldFocus: false });
      }
    } else if (count < currentLength) {
      for (let i = currentLength - 1; i >= count; i--) {
        remove(i);
      }
    }
  }, [familyCount, fields.length, append, remove]);

  const destProv = form.watch('destinationProvinsi');
  const destKab = form.watch('destinationKabupaten');
  const destKec = form.watch('destinationKecamatan');
  const destDesa = form.watch('destinationAddress');

  useEffect(() => {
    if (!destKec && !destDesa) return;
    let isCancelled = false;
    const lookupPostalCode = async () => {
      setIsSearchingPostalCode(true);
      try {
        const code = await findPostalCode({
          desa: destDesa,
          kecamatan: destKec,
          kabupaten: destKab,
          provinsi: destProv,
        });
        if (!isCancelled && code) {
          form.setValue('destinationPostalCode', code, { shouldValidate: true });
        }
      } catch (err) {
        console.error('Error auto-lookup postal code:', err);
      } finally {
        if (!isCancelled) {
          setIsSearchingPostalCode(false);
        }
      }
    };
    const timer = setTimeout(lookupPostalCode, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [destDesa, destKec, destKab, destProv, form]);

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
        toast({ title: "Nomor HP / WA Wajib Diisi", description: "Mohon isi Nomor HP / WhatsApp aktif Anda.", variant: "destructive" });
        return;
      }
      const hasKtp = filesToUpload.some(f => f.fieldName === 'ktp');
      const hasKk = filesToUpload.some(f => f.fieldName === 'kk');
      if (!hasKtp || !hasKk) {
        toast({ title: "Berkas Belum Lengkap", description: "Mohon unggah foto KTP dan KK Anda.", variant: "destructive" });
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

      // Normalisasi nilai teks dengan Title Case
      const formattedName = toTitleCaseIndonesian(values.name);
      const formattedKkHead = toTitleCaseIndonesian(values.kkHead);
      const formattedPurpose = toTitleCaseIndonesian(values.purpose);
      const formattedDesaTujuan = toTitleCaseIndonesian(values.destinationAddress);
      const formattedKecTujuan = toTitleCaseIndonesian(values.destinationKecamatan);
      const formattedKabTujuan = toTitleCaseIndonesian(values.destinationKabupaten);
      const formattedProvTujuan = toTitleCaseIndonesian(values.destinationProvinsi);
      const formattedStreetTujuan = toTitleCaseIndonesian(values.destinationStreet || values.destinationAddress);
      const formattedDusunTujuan = toTitleCaseIndonesian(values.destinationDusun || '');

      const normalizedFamily = (values.familyMembers || []).map((m) => ({
        nik: m.nik || '',
        name: toTitleCaseIndonesian(m.name),
        nama: toTitleCaseIndonesian(m.name),
        relationship: toTitleCaseIndonesian(m.relationship),
        shdk: toTitleCaseIndonesian(m.relationship),
        masaBerlaku: m.masaBerlaku || 'SEUMUR HIDUP',
        masa_berlaku: m.masaBerlaku || 'SEUMUR HIDUP',
      }));

      const finalFormData = {
        ...values,
        name: formattedName,
        kkHead: formattedKkHead,
        purpose: formattedPurpose,
        destinationAddress: formattedDesaTujuan,
        destinationKecamatan: formattedKecTujuan,
        destinationKabupaten: formattedKabTujuan,
        destinationProvinsi: formattedProvTujuan,
        destinationStreet: formattedStreetTujuan,
        destinationDusun: formattedDusunTujuan,
        familyMembers: normalizedFamily,

        // Data Individu Pemohon (agar hasil cetak OpenSID lengkap & Title Case)
        gender: applicantResident?.gender || 'Laki-laki',
        jenisKelamin: applicantResident?.gender || 'Laki-laki',
        placeOfBirth: toTitleCaseIndonesian(applicantResident?.placeOfBirth || 'Cilacap'),
        tempatLahir: toTitleCaseIndonesian(applicantResident?.placeOfBirth || 'Cilacap'),
        dateOfBirth: applicantResident?.dateOfBirth || '',
        tanggalLahir: applicantResident?.dateOfBirth || '',
        religion: toTitleCaseIndonesian(applicantResident?.religion || 'Islam'),
        agama: toTitleCaseIndonesian(applicantResident?.religion || 'Islam'),
        maritalStatus: toTitleCaseIndonesian(applicantResident?.maritalStatus || 'Kawin Tercatat'),
        statusKawin: toTitleCaseIndonesian(applicantResident?.maritalStatus || 'Kawin Tercatat'),
        statusPerkawinan: toTitleCaseIndonesian(applicantResident?.maritalStatus || 'Kawin Tercatat'),
        occupation: toTitleCaseIndonesian(applicantResident?.occupation || 'Wiraswasta'),
        pekerjaan: toTitleCaseIndonesian(applicantResident?.occupation || 'Wiraswasta'),
        address: toTitleCaseIndonesian(applicantResident?.address || values.currentAddressStreet || ''),
        alamat: toTitleCaseIndonesian(applicantResident?.address || values.currentAddressStreet || ''),
        currentAddressStreet: toTitleCaseIndonesian(applicantResident?.address || values.currentAddressStreet || ''),

        // OpenSID Snake Case Bridges untuk Lampiran F-1.03, F-1.08, F-1.25, F-1.27
        form_alasan_pindah: toTitleCaseIndonesian(values.alasanPindah || formattedPurpose),
        alasan_pindah: toTitleCaseIndonesian(values.alasanPindah || formattedPurpose),
        form_klasifikasi_pindah: toTitleCaseIndonesian(values.klasifikasiPindah),
        klasifikasi_pindah: toTitleCaseIndonesian(values.klasifikasiPindah),
        form_jenis_kepindahan: toTitleCaseIndonesian(values.jenisKepindahan),
        jenis_kepindahan: toTitleCaseIndonesian(values.jenisKepindahan),
        form_status_kk_tidak_pindah: toTitleCaseIndonesian(values.statusKkTidakPindah),
        status_kk_tidak_pindah: toTitleCaseIndonesian(values.statusKkTidakPindah),
        form_status_kk_pindah: toTitleCaseIndonesian(values.statusKkPindah),
        status_kk_pindah: toTitleCaseIndonesian(values.statusKkPindah),
        form_tanggal_pindah: values.moveDate || '',
        tanggal_pindah: values.moveDate || '',
        form_alamat_tujuan: formattedStreetTujuan,
        alamat_tujuan: formattedStreetTujuan,
        form_dusun_tujuan: formattedDusunTujuan,
        dusun_tujuan: formattedDusunTujuan,
        form_rt_tujuan: values.destinationAddressRt,
        rt_tujuan: values.destinationAddressRt,
        form_rw_tujuan: values.destinationAddressRw,
        rw_tujuan: values.destinationAddressRw,
        form_desa_tujuan: formattedDesaTujuan,
        desa_tujuan: formattedDesaTujuan,
        form_desa_atau_kelurahan_tujuan: formattedDesaTujuan,
        form_kecamatan_tujuan: formattedKecTujuan,
        kecamatan_tujuan: formattedKecTujuan,
        form_kabupaten_tujuan: formattedKabTujuan,
        kabupaten_tujuan: formattedKabTujuan,
        form_provinsi_tujuan: formattedProvTujuan,
        provinsi_tujuan: formattedProvTujuan,
        form_kode_pos_tujuan: values.destinationPostalCode || '',
        kode_pos_tujuan: values.destinationPostalCode || '',
        form_telepon: values.phone || '',
        telepon: values.phone || '',
        form_kepala_kk: formattedKkHead,
        kepala_kk: formattedKkHead,
        form_jumlah_pengikut: String(values.familyCount || normalizedFamily.length),
      };

      await addSubmission(firestore, {
        ticketNumber: newTicketNumber,
        requesterName: formattedName,
        nik: values.nik,
        letterType: 'Surat Pengantar Pindah',
        formData: finalFormData,
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

  if (isSubmitted) return <SubmissionSuccess ticketNumber={ticketNumber} onReset={() => { form.reset(); setFilesToUpload([]); setIsSubmitted(false); }} />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        <FormSection title="Data Pemohon" icon={User}>
          <FormField control={form.control} name="nik" render={({ field }) => (
            <FormItem className="md:col-span-2"><FormLabel className="font-bold text-primary">NIK Pemohon</FormLabel><FormControl><div className="relative"><Input placeholder="3301xxxxxxxxxxxx" {...field} disabled={isSubmitting} maxLength={16} className="h-12 rounded-xl" />{isSearchingResident && <Loader2 className="absolute right-4 top-3 h-6 w-6 animate-spin text-primary" />}</div></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input placeholder="Sesuai KTP" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="kkNumber" render={({ field }) => (<FormItem><FormLabel>Nomor Kartu Keluarga</FormLabel><FormControl><Input placeholder="3301xxxxxxxxxxxxxxxx" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="kkHead" render={({ field }) => (<FormItem><FormLabel>Nama Kepala Keluarga</FormLabel><FormControl><Input placeholder="Sesuai KK" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold">
                Nomor HP / WhatsApp {isAdmin ? <span className="text-slate-400 font-normal text-xs">(Opsional)</span> : <span className="text-red-500">*</span>}
              </FormLabel>
              <FormControl><Input placeholder={isAdmin ? "Opsional untuk pengajuan admin" : "Contoh: 081234567890"} {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        <FormSection title="Detail Alasan & Klasifikasi Pindah" icon={MapPin}>
          <FormField control={form.control} name="alasanPindah" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold text-primary">Alasan Pindah (Standar Dukcapil)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Pilih Alasan Pindah" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Pekerjaan">1. Pekerjaan</SelectItem>
                  <SelectItem value="Pendidikan">2. Pendidikan</SelectItem>
                  <SelectItem value="Keamanan">3. Keamanan</SelectItem>
                  <SelectItem value="Kesehatan">4. Kesehatan</SelectItem>
                  <SelectItem value="Perumahan">5. Perumahan</SelectItem>
                  <SelectItem value="Keluarga">6. Keluarga</SelectItem>
                  <SelectItem value="Lainnya">7. Lainnya</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="klasifikasiPindah" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold text-primary">Klasifikasi Pindah</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Pilih Klasifikasi" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Dalam satu Desa/Kelurahan">1. Dalam satu Desa/Kelurahan</SelectItem>
                  <SelectItem value="Antar Desa/Kelurahan dalam satu Kecamatan">2. Antar Desa/Kelurahan dalam satu Kecamatan</SelectItem>
                  <SelectItem value="Antar Kecamatan dalam satu Kab/Kota">3. Antar Kecamatan dalam satu Kab/Kota</SelectItem>
                  <SelectItem value="Antar Kabupaten/Kota">4. Antar Kab/Kota dalam satu Provinsi</SelectItem>
                  <SelectItem value="Antar Provinsi">5. Antar Provinsi</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="jenisKepindahan" render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kepindahan</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Pilih Jenis Kepindahan" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Kepala Keluarga">1. Kepala Keluarga</SelectItem>
                  <SelectItem value="Kepala Keluarga Dan Seluruh Anggota Keluarga">2. Kepala Keluarga Dan Seluruh Anggota</SelectItem>
                  <SelectItem value="Kepala Keluarga Dan Sebagian Anggota Keluarga">3. Kepala Keluarga Dan Sebagian Anggota</SelectItem>
                  <SelectItem value="Anggota Keluarga">4. Anggota Keluarga</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="moveDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Rencana Tanggal Pindah / Datang</FormLabel>
              <FormControl><Input type="date" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="statusKkTidakPindah" render={({ field }) => (
            <FormItem>
              <FormLabel>Status KK Bagi Yang Tidak Pindah</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Pilih Status KK" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Numpang KK">1. Numpang KK</SelectItem>
                  <SelectItem value="Membuat KK Baru">2. Membuat KK Baru</SelectItem>
                  <SelectItem value="Nomor KK Tetap">3. Nomor KK Tetap</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="statusKkPindah" render={({ field }) => (
            <FormItem>
              <FormLabel>Status KK Bagi Yang Pindah</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Pilih Status KK" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Numpang KK">1. Numpang KK</SelectItem>
                  <SelectItem value="Membuat KK Baru">2. Membuat KK Baru</SelectItem>
                  <SelectItem value="Nomor KK Tetap">3. Nomor KK Tetap</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="purpose" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="font-bold text-primary">Keterangan / Keperluan Pindah Lengkap *</FormLabel>
              <FormControl><Input placeholder="Contoh: Mengikuti Suami / Istri dan Pindah Domisili Tempat Tinggal" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        <FormSection title="Alamat Asal" icon={MapPin}>
          <FormField control={form.control} name="currentAddressStreet" render={({ field }) => (
            <FormItem className="md:col-span-2"><FormLabel>Alamat Jalan / Dusun Asal</FormLabel><FormControl><Input placeholder="Contoh: Dusun Sampeldes" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="currentAddressRt" render={({ field }) => (<FormItem><FormLabel>RT</FormLabel><FormControl><Input placeholder="001" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="currentAddressRw" render={({ field }) => (<FormItem><FormLabel>RW</FormLabel><FormControl><Input placeholder="001" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <FormItem><FormLabel>Desa</FormLabel><FormControl><Input value="Sampeldes" disabled className="h-12 rounded-xl bg-slate-50" /></FormControl></FormItem>
          <FormItem><FormLabel>Kecamatan</FormLabel><FormControl><Input value="Gandrungmangu" disabled className="h-12 rounded-xl bg-slate-50" /></FormControl></FormItem>
          <FormItem><FormLabel>Kabupaten / Kota</FormLabel><FormControl><Input value="Cilacap" disabled className="h-12 rounded-xl bg-slate-50" /></FormControl></FormItem>
          <FormItem><FormLabel>Provinsi</FormLabel><FormControl><Input value="Jawa Tengah" disabled className="h-12 rounded-xl bg-slate-50" /></FormControl></FormItem>
        </FormSection>

        <FormSection title="Alamat Tujuan Pindah" icon={MapPin}>
          <div className="md:col-span-2">
            <IndonesianRegionPicker
              provinsiValue={form.watch('destinationProvinsi') || ''}
              kabupatenValue={form.watch('destinationKabupaten') || ''}
              kecamatanValue={form.watch('destinationKecamatan') || ''}
              desaValue={form.watch('destinationAddress') || ''}
              onChange={({ provinsi, kabupaten, kecamatan, desa }) => {
                form.setValue('destinationProvinsi', provinsi, { shouldValidate: true });
                form.setValue('destinationKabupaten', kabupaten, { shouldValidate: true });
                form.setValue('destinationKecamatan', kecamatan, { shouldValidate: true });
                form.setValue('destinationAddress', desa, { shouldValidate: true });
              }}
              onPostalCodeFound={(code) => {
                if (code) {
                  form.setValue('destinationPostalCode', code, { shouldValidate: true });
                }
              }}
              disabled={isSubmitting}
            />
          </div>

          <FormField control={form.control} name="destinationStreet" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>5. Alamat Jalan / Dusun / Kampung Tujuan</FormLabel>
              <FormControl><Input placeholder="Contoh: Jl. Merpati No. 12 / Dusun Krajan" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="destinationAddressRt" render={({ field }) => (<FormItem><FormLabel>6. RT Tujuan</FormLabel><FormControl><Input placeholder="001" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="destinationAddressRw" render={({ field }) => (<FormItem><FormLabel>7. RW Tujuan</FormLabel><FormControl><Input placeholder="001" {...field} disabled={isSubmitting} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <FormField
            control={form.control}
            name="destinationPostalCode"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="font-bold text-slate-700">8. Kode Pos Tujuan</FormLabel>
                  {isSearchingPostalCode ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Mencari kode pos otomatis...
                    </span>
                  ) : field.value ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      ✓ Terisi Otomatis
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Otomatis saat wilayah dipilih</span>
                  )}
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="53254 (Otomatis / manual)"
                      {...field}
                      disabled={isSubmitting}
                      maxLength={5}
                      className="h-12 rounded-xl pr-10 font-mono tracking-wider font-semibold"
                    />
                    {isSearchingPostalCode && (
                      <Loader2 className="absolute right-3.5 top-3.5 h-5 w-5 animate-spin text-emerald-600" />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <div className="space-y-6 rounded-[2.5rem] border p-6 md:p-10 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Daftar Anggota Keluarga Yang Pindah</h3>
            </div>
            {isLoadingFamily && (
              <span className="text-xs text-primary flex items-center gap-1.5 font-bold animate-pulse bg-primary/10 px-3 py-1 rounded-full">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sedang memuat anggota KK...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Anggota keluarga yang tercatat pada Nomor KK yang sama otomatis dimuat ke dalam daftar di bawah. Anda dapat menghapus anggota yang tidak ikut pindah dengan menekan tombol <strong>Hapus dari List</strong> atau menambah anggota secara manual. Data ini otomatis dicetak ke Formulir <strong>F-1.03, F-1.08, F-1.25, dan F-1.27</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <FormField control={form.control} name="familyCount" render={({ field }) => (
              <FormItem><FormLabel className="font-bold">Jumlah Anggota Keluarga Yang Ikut Pindah</FormLabel><FormControl><Input type="number" placeholder="0" {...field} disabled={isSubmitting} min={0} className="h-12 rounded-xl max-w-[200px]" /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  append({ nik: '', name: '', relationship: 'Anggota Keluarga', masaBerlaku: 'SEUMUR HIDUP' });
                  form.setValue('familyCount', fields.length + 1);
                }}
                className="h-12 px-4 rounded-xl border-dashed border-2 font-bold text-slate-700 hover:text-primary hover:border-primary hover:bg-primary/5 gap-2 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Anggota Keluarga</span>
              </Button>
            </div>
          </div>

          {fields.length > 0 && (
            <div className="space-y-4 rounded-3xl border-2 border-dashed p-6 bg-slate-50/50">
              {fields.map((item, index) => (
                <div key={item.id} className="p-6 bg-white border rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="px-3 py-1 rounded-full bg-primary text-white font-black text-[9px] uppercase tracking-widest shadow-sm">
                      Anggota {index + 1}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        remove(index);
                        form.setValue('familyCount', Math.max(0, fields.length - 1));
                      }}
                      className="h-8 px-2.5 rounded-lg text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-1.5 transition-colors"
                      title="Hapus dari daftar pindah"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus dari List</span>
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name={`familyMembers.${index}.nik`} render={({ field }) => (<FormItem><FormLabel className="text-[10px] uppercase font-black text-slate-400">NIK (16 Digit)</FormLabel><FormControl><Input placeholder="16 digit" {...field} disabled={isSubmitting} maxLength={16} className="h-10 rounded-lg" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`familyMembers.${index}.name`} render={({ field }) => (<FormItem><FormLabel className="text-[10px] uppercase font-black text-slate-400">Nama Lengkap</FormLabel><FormControl><Input placeholder="Sesuai KTP / KK" {...field} disabled={isSubmitting} className="h-10 rounded-lg" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`familyMembers.${index}.relationship`} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-black text-slate-400">SHDK (Hubungan Keluarga)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                          <FormControl><SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder="Pilih Hubungan" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Suami">Suami</SelectItem>
                            <SelectItem value="Istri">Istri</SelectItem>
                            <SelectItem value="Anak">Anak</SelectItem>
                            <SelectItem value="Menantu">Menantu</SelectItem>
                            <SelectItem value="Cucu">Cucu</SelectItem>
                            <SelectItem value="Orang Tua">Orang Tua</SelectItem>
                            <SelectItem value="Mertua">Mertua</SelectItem>
                            <SelectItem value="Famili Lain">Famili Lain</SelectItem>
                            <SelectItem value="Anggota Keluarga">Anggota Keluarga</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <FormSection title="Unggah Berkas Lampiran" icon={UploadCloud}>
          <div className="col-span-1 md:col-span-2 space-y-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Unggah file format gambar (JPG, PNG) atau PDF. Berkas bertanda * wajib diisi.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
              <GoogleFileUploader label="Foto KTP Pemohon" fieldName="ktp" onFileSelect={handleFileSelect} isRequired={!isAdmin} disabled={isSubmitting} />
              <GoogleFileUploader label="Foto KK" fieldName="kk" onFileSelect={handleFileSelect} isRequired={!isAdmin} disabled={isSubmitting} />
              <GoogleFileUploader label="Surat Pengantar RT/RW" fieldName="pengantarRt" onFileSelect={handleFileSelect} isRequired={false} disabled={isSubmitting} />
            </div>
          </div>
        </FormSection>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all active:scale-95">
          {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Ajukan Surat Pindah'}
        </Button>
      </form>
    </Form>
  );
}
