'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, User, UploadCloud, FileCheck, FileText, HeartHandshake, Car, Briefcase, Users, FileSignature, Home, Building2, MapPin, Calendar, CreditCard, Shield, Baby } from 'lucide-react';

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
import { FormSection, GoogleFileUploader, phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';

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

interface SuratLanjutanFormProps {
  letterType: string;
  isAdmin?: boolean;
}

export function SuratLanjutanForm({ letterType, isAdmin = false }: SuratLanjutanFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<Array<{ fieldName: string; file: File }>>([]);

  const { firestore } = useFirebase();
  const { toast } = useToast();

  const isNumpangNikah = letterType.includes('Numpang Nikah') || letterType.includes('Pergi Kawin');
  const isWaliHakim = letterType.includes('Wali Hakim');
  const isKtpProses = letterType.includes('KTP dalam Proses');
  const isBedaKis = letterType.includes('Beda Identitas KIS');
  const isPenghasilan = letterType.includes('Penghasilan');
  const isKk = letterType.includes('Kartu Keluarga');
  const isAkta = letterType.includes('Akta Kelahiran') || letterType.includes('Akta Lahir');
  const isDuplikatNikah = letterType.includes('Duplikat Buku Nikah');
  const isLahirMati = letterType.includes('Lahir Mati');
  const isKendaraan = letterType.includes('Kendaraan');
  const isNikahNonMuslim = letterType.includes('Non-Muslim');
  const isSuratKuasa = letterType.includes('Surat Kuasa');
  const isCeraiRujuk = letterType.includes('Cerai') || letterType.includes('Rujuk');
  const isBiodata = letterType.includes('Biodata Penduduk');
  const isPenduduk = letterType.includes('Surat Keterangan Penduduk');
  const isSppd = letterType.includes('SPPD') || letterType.includes('Perjalanan Dinas');

  // Generic dynamic schema
  const formSchema = z.object({
    nik: z.string().length(16, 'NIK harus 16 digit.'),
    name: z.string().min(1, 'Nama lengkap wajib diisi.'),
    gender: z.string().optional(),
    birthPlace: z.string().optional(),
    birthDate: z.string().optional(),
    job: z.string().optional(),
    phone: phoneValidationSchema,
    address: z.string().min(1, 'Alamat wajib diisi.'),
    purpose: z.string().optional(),
    // Conditional extra fields
    kkNumber: z.string().optional(),
    rt: z.string().optional(),
    rw: z.string().optional(),
    maritalStatus: z.string().optional(),
    religion: z.string().optional(),
    nationality: z.string().optional(),
    // Pasangan / Mempelai
    spouseName: z.string().optional(),
    spouseNik: z.string().optional(),
    spouseBirthPlace: z.string().optional(),
    spouseBirthDate: z.string().optional(),
    spouseAddress: z.string().optional(),
    destinationKua: z.string().optional(),
    destinationCity: z.string().optional(),
    // Wali Hakim
    groomName: z.string().optional(),
    groomNik: z.string().optional(),
    waliReason: z.string().optional(),
    waliReasonDetail: z.string().optional(),
    witnessName: z.string().optional(),
    witnessNik: z.string().optional(),
    // KIS
    kisNumber: z.string().optional(),
    kisName: z.string().optional(),
    kisTtl: z.string().optional(),
    kisFaskes: z.string().optional(),
    // Penghasilan
    childName: z.string().optional(),
    childNik: z.string().optional(),
    childBirthPlace: z.string().optional(),
    childBirthDate: z.string().optional(),
    schoolName: z.string().optional(),
    income: z.string().optional(),
    dependentsCount: z.string().optional(),
    // Akta / Kelahiran
    birthOrder: z.string().optional(),
    fatherName: z.string().optional(),
    fatherNik: z.string().optional(),
    motherName: z.string().optional(),
    motherNik: z.string().optional(),
    // Kendaraan
    vehicleType: z.string().optional(),
    vehicleBrand: z.string().optional(),
    vehicleYear: z.string().optional(),
    plateNumber: z.string().optional(),
    chassisNumber: z.string().optional(),
    engineNumber: z.string().optional(),
    vehicleColor: z.string().optional(),
    vehicleOwner: z.string().optional(),
    // Surat Kuasa
    proxyName: z.string().optional(),
    proxyNik: z.string().optional(),
    proxyRelationship: z.string().optional(),
    proxyAddress: z.string().optional(),
    powerScope: z.string().optional(),
    // Cerai
    marriageBookNumber: z.string().optional(),
    divorceReason: z.string().optional(),
    // SPPD
    officerName: z.string().optional(),
    officerNip: z.string().optional(),
    officerPosition: z.string().optional(),
    dutyPurpose: z.string().optional(),
    destination: z.string().optional(),
    transportation: z.string().optional(),
    durationDays: z.string().optional(),
    departureDate: z.string().optional(),
    returnDate: z.string().optional(),
    // Lahir Mati (F-2.09)
    gestationAge: z.string().optional(),
    cause: z.string().optional(),
    deathDate: z.string().optional(),
    deathTime: z.string().optional(),
    childGender: z.string().optional(),
    childOrder: z.string().optional(),
    birthType: z.string().optional(),
    birthPlaceType: z.string().optional(),
    birthAttendantType: z.string().optional(),
    helperName: z.string().optional(),
    whoDetermined: z.string().optional(),
    motherBirthDate: z.string().optional(),
    motherAge: z.string().optional(),
    motherJob: z.string().optional(),
    fatherBirthDate: z.string().optional(),
    fatherAge: z.string().optional(),
    fatherJob: z.string().optional(),
    marriageDate: z.string().optional(),
    reporterRelationship: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: '',
      name: '',
      gender: 'Laki-laki',
      birthPlace: 'Cilacap',
      birthDate: '',
      job: 'Wiraswasta',
      phone: '',
      address: '',
      purpose: '',
      kkNumber: '',
      rt: '01',
      rw: '01',
      maritalStatus: 'Kawin',
      religion: 'Islam',
      nationality: 'Indonesia',
      spouseName: '',
      spouseNik: '',
      spouseBirthPlace: '',
      spouseBirthDate: '',
      spouseAddress: '',
      destinationKua: '',
      destinationCity: '',
      groomName: '',
      groomNik: '',
      waliReason: 'Ayah kandung telah meninggal dunia dan tiada wali nasab lainnya',
      waliReasonDetail: '',
      witnessName: '',
      witnessNik: '',
      kisNumber: '',
      kisName: '',
      kisTtl: '',
      kisFaskes: 'Puskesmas Gandrungmangu',
      childName: '',
      childNik: '',
      childBirthPlace: '',
      childBirthDate: '',
      schoolName: '',
      income: 'Rp 1.500.000,-',
      dependentsCount: '2',
      birthOrder: '1',
      fatherName: '',
      fatherNik: '',
      motherName: '',
      motherNik: '',
      vehicleType: 'Sepeda Motor (Roda 2)',
      vehicleBrand: '',
      vehicleYear: '2020',
      plateNumber: '',
      chassisNumber: '',
      engineNumber: '',
      vehicleColor: 'Hitam',
      vehicleOwner: '',
      proxyName: '',
      proxyNik: '',
      proxyRelationship: 'Anak Kandung / Kerabat',
      proxyAddress: '',
      powerScope: 'Pengurusan berkas administrasi dan dokumen resmi hingga tuntas.',
      marriageBookNumber: '',
      divorceReason: 'Perselisihan yang tidak dapat didamaikan kembali.',
      officerName: '',
      officerNip: '',
      officerPosition: 'Perangkat Desa',
      dutyPurpose: 'Menghadiri Rapat Koordinasi Kedinasan',
      destination: 'Kantor Kecamatan Gandrungmangu',
      transportation: 'Sepeda Motor',
      durationDays: '1',
      departureDate: new Date().toISOString().split('T')[0],
      returnDate: new Date().toISOString().split('T')[0],
      gestationAge: '8',
      cause: 'IUFD (Intrauterine Fetal Death)',
      deathDate: new Date().toISOString().split('T')[0],
      deathTime: '08:00',
      childGender: 'Laki-laki',
      childOrder: '1',
      birthType: 'Tunggal',
      birthPlaceType: 'RS/RB',
      birthAttendantType: 'Dokter',
      helperName: 'dr. Spesialis Kandungan',
      whoDetermined: 'Dokter',
      motherBirthDate: '',
      motherAge: '',
      motherJob: 'Mengurus Rumah Tangga',
      fatherBirthDate: '',
      fatherAge: '',
      fatherJob: 'Wiraswasta',
      marriageDate: '',
      reporterRelationship: 'Orang Tua / Pelapor',
    },
  });

  const nikValue = form.watch('nik');
  const spouseNikValue = form.watch('spouseNik');
  const groomNikValue = form.watch('groomNik');
  const witnessNikValue = form.watch('witnessNik');
  const proxyNikValue = form.watch('proxyNik');
  const motherNikValue = form.watch('motherNik');
  const fatherNikValue = form.watch('fatherNik');

  useEffect(() => {
    const fetchResident = async () => {
      if (nikValue?.length === 16 && firestore) {
        setIsSearching(true);
        try {
          const resident = await getResidentByNik(firestore, nikValue);
          if (resident) {
            form.setValue('name', resident.fullName.toUpperCase());
            if (resident.gender) form.setValue('gender', resident.gender);
            if (resident.placeOfBirth) form.setValue('birthPlace', resident.placeOfBirth);
            if (resident.dateOfBirth) form.setValue('birthDate', formatDbDateToForm(resident.dateOfBirth));
            if (resident.occupation) form.setValue('job', resident.occupation);
            if ((resident as any).telepon) form.setValue('phone', (resident as any).telepon);
            if (resident.religion) form.setValue('religion', resident.religion);
            if (resident.maritalStatus) form.setValue('maritalStatus', resident.maritalStatus);
            if (resident.noKk) form.setValue('kkNumber', resident.noKk);
            if (resident.fatherName) form.setValue('fatherName', resident.fatherName.toUpperCase());
            if (resident.motherName) form.setValue('motherName', resident.motherName.toUpperCase());
            if (resident.rt) form.setValue('rt', resident.rt);
            if (resident.rw) form.setValue('rw', resident.rw);
            const fullAddress = `${resident.address || 'Desa Sampeldes'}, RT ${resident.rt || '00'} RW ${resident.rw || '00'}, Sampeldes, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
            form.setValue('address', fullAddress);

            // Set vehicleOwner or proxyName default
            form.setValue('vehicleOwner', resident.fullName.toUpperCase());
            form.setValue('officerName', resident.fullName.toUpperCase());

            // Jika surat lahir mati, tetapkan data ayah / ibu otomatis berdasarkan gender pemohon
            if (isLahirMati) {
              if (resident.gender?.toLowerCase() === 'perempuan') {
                form.setValue('motherNik', resident.nik);
                form.setValue('motherName', resident.fullName.toUpperCase());
                if (resident.dateOfBirth) form.setValue('motherBirthDate', formatDbDateToForm(resident.dateOfBirth));
                if (resident.occupation) form.setValue('motherJob', resident.occupation);
                form.setValue('reporterRelationship', 'Ibu Kandung');
              } else {
                form.setValue('fatherNik', resident.nik);
                form.setValue('fatherName', resident.fullName.toUpperCase());
                if (resident.dateOfBirth) form.setValue('fatherBirthDate', formatDbDateToForm(resident.dateOfBirth));
                if (resident.occupation) form.setValue('fatherJob', resident.occupation);
                form.setValue('reporterRelationship', 'Ayah Kandung');
              }
            }

            toast({ title: 'Data Penduduk Terhubung', description: `Data atas nama ${resident.fullName} berhasil dimuat otomatis.` });
          }
        } finally {
          setIsSearching(false);
        }
      }
    };
    fetchResident();
  }, [nikValue, firestore, form, toast]);

  // Auto-fill NIK Calon Pasangan / Calon Suami / Saksi / Penerima Kuasa (0/1 Read)
  useEffect(() => {
    const cleanNik = (spouseNikValue || '').replace(/\D/g, '').trim();
    if (cleanNik.length !== 16 || !firestore) return;
    getResidentByNik(firestore, cleanNik).then((res) => {
      if (res) {
        form.setValue('spouseName', res.fullName.toUpperCase());
        toast({ title: 'Data Calon Pasangan Ditemukan', description: res.fullName });
      }
    }).catch(() => { });
  }, [spouseNikValue, firestore, form, toast]);

  useEffect(() => {
    const cleanNik = (groomNikValue || '').replace(/\D/g, '').trim();
    if (cleanNik.length !== 16 || !firestore) return;
    getResidentByNik(firestore, cleanNik).then((res) => {
      if (res) {
        form.setValue('groomName', res.fullName.toUpperCase());
        toast({ title: 'Data Calon Suami Ditemukan', description: res.fullName });
      }
    }).catch(() => { });
  }, [groomNikValue, firestore, form, toast]);

  useEffect(() => {
    const cleanNik = (witnessNikValue || '').replace(/\D/g, '').trim();
    if (cleanNik.length !== 16 || !firestore) return;
    getResidentByNik(firestore, cleanNik).then((res) => {
      if (res) {
        form.setValue('witnessName', res.fullName.toUpperCase());
        toast({ title: 'Data Saksi Ditemukan', description: res.fullName });
      }
    }).catch(() => { });
  }, [witnessNikValue, firestore, form, toast]);

  useEffect(() => {
    const cleanNik = (proxyNikValue || '').replace(/\D/g, '').trim();
    if (cleanNik.length !== 16 || !firestore) return;
    getResidentByNik(firestore, cleanNik).then((res) => {
      if (res) {
        form.setValue('proxyName', res.fullName.toUpperCase());
        toast({ title: 'Data Penerima Kuasa Ditemukan', description: res.fullName });
      }
    }).catch(() => { });
  }, [proxyNikValue, firestore, form, toast]);

  useEffect(() => {
    const cleanNik = (motherNikValue || '').replace(/\D/g, '').trim();
    if (cleanNik.length !== 16 || !firestore) return;
    getResidentByNik(firestore, cleanNik).then((res) => {
      if (res) {
        form.setValue('motherName', res.fullName.toUpperCase());
        if (res.dateOfBirth) form.setValue('motherBirthDate', formatDbDateToForm(res.dateOfBirth));
        if (res.occupation) form.setValue('motherJob', res.occupation);
        toast({ title: 'Data Ibu Ditemukan', description: res.fullName });
      }
    }).catch(() => { });
  }, [motherNikValue, firestore, form, toast]);

  useEffect(() => {
    const cleanNik = (fatherNikValue || '').replace(/\D/g, '').trim();
    if (cleanNik.length !== 16 || !firestore) return;
    getResidentByNik(firestore, cleanNik).then((res) => {
      if (res) {
        form.setValue('fatherName', res.fullName.toUpperCase());
        if (res.dateOfBirth) form.setValue('fatherBirthDate', formatDbDateToForm(res.dateOfBirth));
        if (res.occupation) form.setValue('fatherJob', res.occupation);
        toast({ title: 'Data Ayah Ditemukan', description: res.fullName });
      }
    }).catch(() => { });
  }, [fatherNikValue, firestore, form, toast]);

  const handleFileSelect = (file: File, fieldName: string) => {
    setFilesToUpload((prev) => {
      const filtered = prev.filter((item) => item.fieldName !== fieldName);
      return [...filtered, { fieldName, file }];
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;

    setIsSubmitting(true);
    try {
      const generatedTicket = `TKT-${Date.now().toString().slice(-6)}`;

      const filesData = await Promise.all(
        filesToUpload.map(async (f) => ({
          base64Data: await convertFileToBase64(f.file),
          mimeType: f.file.type,
          targetFileName: `${f.fieldName}_${values.nik}_${Date.now()}`,
          fieldName: f.fieldName,
        }))
      );

      await addSubmission(firestore, {
        ticketNumber: generatedTicket,
        requesterName: values.name,
        nik: values.nik,
        letterType: letterType,
        formData: {
          ...values,
          phone: values.phone,
          telepon: values.phone,
          form_telepon: values.phone,
          letterType,
          ...(isLahirMati
            ? {
              lampiran: ['F-2.09'],
              form_lama_kandungan: values.gestationAge,
              form_sex_bayi: values.childGender,
              form_tanggal_lahir_mati: values.deathDate,
              form_jam_lahir_mati: values.deathTime,
              form_jenis_kelahiran: values.birthType,
              form_kelahiran_ke: values.childOrder,
              form_tempat_dilahirkan: values.birthPlaceType,
              form_nama_tempat_dilahirkan: values.birthPlace,
              form_penolong_kelahiran: values.birthAttendantType,
              form_nama_penolong: values.helperName,
              form_sebab_lahir_mati: values.cause,
              form_yang_menentukan: values.whoDetermined,
              form_tempat_kelahiran: values.birthPlace,
              form_nik_ibu: values.motherNik,
              form_nama_ibu: values.motherName,
              form_tanggal_lahir_ibu: values.motherBirthDate,
              form_umur_ibu: values.motherAge,
              form_pekerjaan_ibu: values.motherJob,
              form_nik_ayah: values.fatherNik,
              form_nama_ayah: values.fatherName,
              form_tanggal_lahir_ayah: values.fatherBirthDate,
              form_umur_ayah: values.fatherAge,
              form_pekerjaan_ayah: values.fatherJob,
              form_tgl_nikah: values.marriageDate,
              form_hubungan_pelapor: values.reporterRelationship,
            }
            : {}),
          submittedAt: new Date().toISOString(),
        },
        filesToUpload: filesData,
      });

      setTicketNumber(generatedTicket);
      setIsSubmitted(true);
      toast({
        title: 'Pengajuan Berhasil Dikirim',
        description: `Nomor tiket pengajuan Anda adalah: ${generatedTicket}`,
      });
    } catch (err: any) {
      console.error('Error submitting form:', err);
      toast({
        variant: 'destructive',
        title: 'Pengajuan Gagal',
        description: 'Terjadi kesalahan sistem saat menyimpan pengajuan. Silakan coba kembali.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <SubmissionSuccess
        ticketNumber={ticketNumber}
        onReset={() => {
          setIsSubmitted(false);
          form.reset();
          setFilesToUpload([]);
        }}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ========================================================
            BAGIAN 1: DATA PEMOHON
           ======================================================== */}
        <FormSection title="I. Identitas Pemohon" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Nomor Induk Kependudukan (NIK) <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="16 Digit NIK Warga Sampeldes"
                        maxLength={16}
                        {...field}
                        className="font-mono text-sm tracking-wider"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-2.5">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                        </div>
                      )}
                    </div>
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
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nama Lengkap Sesuai KTP" {...field} />
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
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Jenis Kelamin
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Jenis Kelamin" />
                      </SelectTrigger>
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
              name="kkNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Nomor Kartu Keluarga (KK)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="16 Digit No. KK" maxLength={16} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Tempat Lahir
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Kota/Kabupaten Tempat Lahir" {...field} />
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
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Tanggal Lahir
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
              name="job"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Pekerjaan
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Mata Pencaharian / Pekerjaan" {...field} />
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
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Nomor HP / WhatsApp <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={isAdmin ? "Opsional untuk pengajuan admin" : "Contoh: 081234567890"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Alamat Domisili <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Dusun, RT/RW, Desa Sampeldes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* ========================================================
            BAGIAN 2: RINCIAN SPESIFIK BERDASARKAN JENIS SURAT
           ======================================================== */}

        {/* --- 2.A: NUMPANG NIKAH --- */}
        {isNumpangNikah && (
          <FormSection title="II. Calon Pasangan & KUA Tujuan" icon={HeartHandshake}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="spouseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Nama Calon Pasangan *</FormLabel>
                    <FormControl><Input placeholder="Nama Lengkap Calon Suami/Istri" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="spouseNik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">NIK Calon Pasangan</FormLabel>
                    <FormControl><Input placeholder="NIK Calon Pasangan" maxLength={16} {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destinationKua"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">KUA Kecamatan Tujuan *</FormLabel>
                    <FormControl><Input placeholder="Contoh: KUA Kec. Gandrungmangu" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destinationCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Kabupaten / Kota Tujuan *</FormLabel>
                    <FormControl><Input placeholder="Contoh: Kab. Cilacap / Kab. Banyumas" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Nama Ayah Kandung</FormLabel>
                    <FormControl><Input placeholder="Nama Ayah Kandung Pemohon" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="motherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Nama Ibu Kandung</FormLabel>
                    <FormControl><Input placeholder="Nama Ibu Kandung Pemohon" {...field} /></FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        )}

        {/* --- 2.B: WALI HAKIM --- */}
        {isWaliHakim && (
          <FormSection title="II. Rincian Permohonan Wali Hakim" icon={HeartHandshake}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="groomName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Nama Calon Suami *</FormLabel>
                    <FormControl><Input placeholder="Nama Lengkap Calon Suami" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="groomNik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">NIK Calon Suami</FormLabel>
                    <FormControl><Input placeholder="NIK Calon Suami" maxLength={16} {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="waliReason"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs font-bold uppercase">Alasan Permohonan Wali Hakim *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih Alasan" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Ayah kandung telah meninggal dunia dan tiada wali nasab lainnya">Ayah Kandung Meninggal & Tiada Wali Nasab Ashabah</SelectItem>
                        <SelectItem value="Wali nasab tidak diketahui keberadaannya (Mafqud)">Wali Nasab Hilang / Tidak Diketahui Keberadaannya (Mafqud)</SelectItem>
                        <SelectItem value="Wali nasab enggan / menolak menikahkan (Adhal)">Wali Nasab Menolak / Enggan (Adhal)</SelectItem>
                        <SelectItem value="Mualaf dan keluarga kandung berlainan agama">Mualaf & Keluarga Berlainan Agama</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="witnessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Nama Saksi Kerabat</FormLabel>
                    <FormControl><Input placeholder="Nama Saksi dari Pihak Keluarga" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="witnessNik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">NIK Saksi Kerabat</FormLabel>
                    <FormControl><Input placeholder="NIK Saksi" maxLength={16} {...field} /></FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        )}

        {/* --- 2.C: BEDA IDENTITAS KIS --- */}
        {isBedaKis && (
          <FormSection title="II. Perbandingan Data Kartu Indonesia Sehat (KIS)" icon={CreditCard}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="kisNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Nomor Kartu KIS / BPJS *</FormLabel>
                    <FormControl><Input placeholder="Contoh: 0001234567890" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kisName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Nama yang Tertulis di Kartu KIS *</FormLabel>
                    <FormControl><Input placeholder="Ejaan Nama Pada Fisik Kartu KIS" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kisTtl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">TTL di Kartu KIS</FormLabel>
                    <FormControl><Input placeholder="Contoh: Cilacap, 12-05-1980" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kisFaskes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Fasilitas Kesehatan Tk. 1</FormLabel>
                    <FormControl><Input placeholder="Puskesmas Gandrungmangu" {...field} /></FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        )}

        {/* --- 2.D: PENGHASILAN AYAH / IBU --- */}
        {isPenghasilan && (
          <FormSection title="II. Rincian Penghasilan & Tanggungan Anak" icon={Briefcase}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="income"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Rata-rata Penghasilan Per Bulan *</FormLabel>
                    <FormControl><Input placeholder="Contoh: Rp 1.500.000,-" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="childName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Nama Anak / Pelajar / Mahasiswa *</FormLabel>
                    <FormControl><Input placeholder="Nama Anak yang Mengajukan Beasiswa" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="schoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Sekolah / Universitas *</FormLabel>
                    <FormControl><Input placeholder="Contoh: Universitas Jenderal Soedirman / SMK" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dependentsCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Jumlah Tanggungan Anak</FormLabel>
                    <FormControl><Input placeholder="Contoh: 2 Orang" {...field} /></FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        )}

        {/* --- 2.E: AKTA KELAHIRAN / SPTJM --- */}
        {isAkta && (
          <FormSection title="II. Rincian Data Anak & Orang Tua" icon={Users}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="childName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Nama Lengkap Anak *</FormLabel>
                    <FormControl><Input placeholder="Nama Lengkap Anak" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Anak Ke-</FormLabel>
                    <FormControl><Input placeholder="Contoh: 1 (Satu)" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Nama Ayah Kandung</FormLabel>
                    <FormControl><Input placeholder="Nama Ayah Kandung" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="motherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Nama Ibu Kandung</FormLabel>
                    <FormControl><Input placeholder="Nama Ibu Kandung" {...field} /></FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        )}

        {/* --- 2.F: KENDARAAN BERMOTOR --- */}
        {isKendaraan && (
          <FormSection title="II. Rincian Spesifikasi Kendaraan Bermotor" icon={Car}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Jenis Kendaraan *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih Jenis" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Sepeda Motor (Roda 2)">Sepeda Motor (Roda 2)</SelectItem>
                        <SelectItem value="Mobil Penumpang (Roda 4)">Mobil Penumpang (Roda 4)</SelectItem>
                        <SelectItem value="Truk / Pick Up">Truk / Pick Up</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vehicleBrand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Merk / Type *</FormLabel>
                    <FormControl><Input placeholder="Contoh: Honda Vario 125 / Toyota Avanza" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plateNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Nomor Polisi (Plat) *</FormLabel>
                    <FormControl><Input placeholder="Contoh: R 1234 XX" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vehicleYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Tahun Pembuatan</FormLabel>
                    <FormControl><Input placeholder="Contoh: 2021" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chassisNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Nomor Rangka</FormLabel>
                    <FormControl><Input placeholder="Nomor Rangka Kendaraan" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="engineNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Nomor Mesin</FormLabel>
                    <FormControl><Input placeholder="Nomor Mesin Kendaraan" {...field} /></FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        )}

        {/* --- 2.G: SURAT KUASA --- */}
        {isSuratKuasa && (
          <FormSection title="II. Identitas Penerima Kuasa & Batasan Wewenang" icon={FileSignature}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="proxyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Nama Penerima Kuasa *</FormLabel>
                    <FormControl><Input placeholder="Nama Lengkap Penerima Kuasa" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="proxyNik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">NIK Penerima Kuasa *</FormLabel>
                    <FormControl><Input placeholder="16 Digit NIK Penerima Kuasa" maxLength={16} {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="proxyRelationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Hubungan Keluarga</FormLabel>
                    <FormControl><Input placeholder="Contoh: Anak Kandung / Suami / Istri" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="powerScope"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs font-bold uppercase">Wewenang Kuasa Khusus *</FormLabel>
                    <FormControl><Textarea placeholder="Rincian urusan dan hak yang dilimpahkan..." {...field} /></FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        )}

        {/* --- 2.H: SPPD KEDINASAN --- */}
        {isSppd && (
          <FormSection title="II. Rincian Perjalanan Dinas (SPPD)" icon={MapPin}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="officerPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Jabatan Pejabat / Pegawai *</FormLabel>
                    <FormControl><Input placeholder="Contoh: Kasi Pemerintahan / Kaur Keuangan" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Tempat Tujuan Dinas *</FormLabel>
                    <FormControl><Input placeholder="Contoh: Kantor Dispermades Kab. Cilacap" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dutyPurpose"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs font-bold uppercase">Maksud Perjalanan Tugas *</FormLabel>
                    <FormControl><Input placeholder="Contoh: Menghadiri Pelatihan Aplikasi OpenSID" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departureDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Tanggal Berangkat</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="returnDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase">Tanggal Kembali</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        )}

        {/* --- 2.I: SURAT KETERANGAN LAHIR MATI (F-2.09) --- */}
        {isLahirMati && (
          <>
            <FormSection title="II. Rincian Data Yang Lahir Mati" icon={Baby}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="gestationAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Lama Dalam Kandungan (Bulan) *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Usia Kandungan" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="6">6 Bulan</SelectItem>
                          <SelectItem value="7">7 Bulan</SelectItem>
                          <SelectItem value="8">8 Bulan</SelectItem>
                          <SelectItem value="9">9 Bulan</SelectItem>
                          <SelectItem value="10">10 Bulan</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="childGender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Jenis Kelamin Bayi *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Jenis Kelamin" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Laki-laki">1. Laki-Laki</SelectItem>
                          <SelectItem value="Perempuan">2. Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deathDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Tanggal Lahir Mati *</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deathTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Pukul / Jam (WIB) *</FormLabel>
                      <FormControl><Input placeholder="Contoh: 08:30" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Jenis Kelahiran *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Jenis Kelahiran" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Tunggal">1. Tunggal</SelectItem>
                          <SelectItem value="Kembar 2">2. Kembar 2</SelectItem>
                          <SelectItem value="Kembar 3">3. Kembar 3</SelectItem>
                          <SelectItem value="Kembar 4">4. Kembar 4</SelectItem>
                          <SelectItem value="Lainnya">5. Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="childOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Kelahiran Ke- *</FormLabel>
                      <FormControl><Input placeholder="Contoh: 1, 2, 3" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthPlaceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Tempat Dilahirkan *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Tempat" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="RS/RB">1. RS/RB</SelectItem>
                          <SelectItem value="Puskesmas">2. Puskesmas</SelectItem>
                          <SelectItem value="Polindes">3. Polindes</SelectItem>
                          <SelectItem value="Rumah">4. Rumah</SelectItem>
                          <SelectItem value="Lainnya">5. Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthPlace"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs font-bold uppercase">Nama Tempat / Faskes Bersalin *</FormLabel>
                      <FormControl><Input placeholder="Contoh: RSUD Cilacap / PKM Gandrungmangu" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthAttendantType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Penolong Kelahiran *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Penolong" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Dokter">1. Dokter</SelectItem>
                          <SelectItem value="Bidan/Perawat">2. Bidan / Perawat</SelectItem>
                          <SelectItem value="Dukun">3. Dukun</SelectItem>
                          <SelectItem value="Lainnya">4. Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="helperName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs font-bold uppercase">Nama Penolong Medis *</FormLabel>
                      <FormControl><Input placeholder="Contoh: dr. Ani Sp.OG / Bidan Siti" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cause"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs font-bold uppercase">Sebab Lahir Mati *</FormLabel>
                      <FormControl><Input placeholder="Contoh: IUFD / Asfiksia Berat" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="whoDetermined"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Yang Menentukan *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Pihak" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Dokter">1. Dokter</SelectItem>
                          <SelectItem value="Bidan/Perawat">2. Bidan/Perawat</SelectItem>
                          <SelectItem value="Tenaga Kes.">3. Tenaga Kes.</SelectItem>
                          <SelectItem value="Kepolisian">4. Kepolisian</SelectItem>
                          <SelectItem value="Lainnya">5. Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <FormSection title="III. Data Orang Tua & Pelapor (Formulir F-2.09)" icon={Users}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data Ibu */}
                <div className="p-3 border rounded-xl bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
                  <div className="font-bold text-xs uppercase text-rose-800 dark:text-rose-300">Data Ibu Kandung</div>
                  <FormField
                    control={form.control}
                    name="motherNik"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">NIK Ibu (16 Digit) *</FormLabel>
                        <FormControl><Input placeholder="16 Digit NIK Ibu" maxLength={16} {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="motherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">Nama Lengkap Ibu *</FormLabel>
                        <FormControl><Input placeholder="Nama Lengkap Ibu Kandung" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="motherBirthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase">Tgl Lahir Ibu</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="motherJob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase">Pekerjaan Ibu</FormLabel>
                          <FormControl><Input placeholder="Pekerjaan Ibu" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Data Ayah */}
                <div className="p-3 border rounded-xl bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
                  <div className="font-bold text-xs uppercase text-blue-800 dark:text-blue-300">Data Ayah Kandung</div>
                  <FormField
                    control={form.control}
                    name="fatherNik"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">NIK Ayah (16 Digit) *</FormLabel>
                        <FormControl><Input placeholder="16 Digit NIK Ayah" maxLength={16} {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fatherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">Nama Lengkap Ayah *</FormLabel>
                        <FormControl><Input placeholder="Nama Lengkap Ayah Kandung" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="fatherBirthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase">Tgl Lahir Ayah</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fatherJob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase">Pekerjaan Ayah</FormLabel>
                          <FormControl><Input placeholder="Pekerjaan Ayah" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Hubungan Pelapor & Pernikahan */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reporterRelationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">Hubungan Pelapor dengan Bayi *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Pilih Hubungan" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Ayah Kandung">Ayah Kandung</SelectItem>
                            <SelectItem value="Ibu Kandung">Ibu Kandung</SelectItem>
                            <SelectItem value="Keluarga Lain">Keluarga Lain</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="marriageDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">Tgl Perkawinan Orang Tua (Buku Nikah)</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </FormSection>
          </>
        )}

        {/* Keperluan Umum jika belum ada */}
        {!isSppd && !isSuratKuasa && (
          <FormSection title="Keperluan Pengajuan Surat" icon={FileText}>
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-700 dark:text-slate-200">
                    Keperluan / Peruntukan Dokumen
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Persyaratan Administrasi Resmi / Melamar Pekerjaan / Beasiswa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>
        )}

        {/* ========================================================
            BAGIAN 3: LAMPIRAN BERKAS PENDUKUNG
           ======================================================== */}
        <FormSection title="Lampiran Berkas Pendukung" icon={UploadCloud}>
          <p className="text-xs text-stone-600 dark:text-stone-300 mb-4">
            {isAdmin
              ? 'Khusus akun Admin Desa, unggah berkas fisik bersifat opsional / pelengkap.'
              : 'Unggah foto/scan dokumen KTP dan Kartu Keluarga asli pemohon.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GoogleFileUploader
              label="Foto / Scan e-KTP Pemohon"
              fieldName="ktpFile"
              isRequired={!isAdmin}
              onFileSelect={handleFileSelect}
            />
            <GoogleFileUploader
              label="Foto / Scan Kartu Keluarga (KK)"
              fieldName="kkFile"
              isRequired={!isAdmin}
              onFileSelect={handleFileSelect}
            />
          </div>
        </FormSection>

        {/* Tombol Submit */}
        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="neu-btn px-6 py-2.5 rounded-full font-bold uppercase tracking-wider text-xs text-emerald-800 dark:text-[#d4e157] inline-flex items-center gap-2 hover:scale-105 transition-all shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memproses Pengajuan...</span>
              </>
            ) : (
              <>
                <FileCheck className="h-4 w-4" />
                <span>Kirim Permohonan Surat</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
