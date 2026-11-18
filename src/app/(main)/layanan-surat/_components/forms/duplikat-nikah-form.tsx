'use client';

import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, UploadCloud, FileCheck, User, Users, HeartHandshake, FileText, CheckCircle2 } from 'lucide-react';

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
import { getNamaHariIndonesia, formatTanggalIndonesia } from '@/lib/opensid-surat-engine';

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
  // Data Suami
  husbandNik: z.string().length(16, 'NIK Suami harus 16 digit.'),
  husbandName: z.string().min(1, 'Nama lengkap suami wajib diisi.'),
  husbandBirthPlace: z.string().min(1, 'Tempat lahir suami wajib diisi.'),
  husbandBirthDate: z.string().min(1, 'Tanggal lahir suami wajib diisi.'),
  husbandReligion: z.string().min(1, 'Agama suami wajib diisi.'),
  husbandJob: z.string().min(1, 'Pekerjaan suami wajib diisi.'),
  husbandAddress: z.string().min(1, 'Alamat suami wajib diisi.'),

  // Data Istri
  wifeNik: z.string().length(16, 'NIK Istri harus 16 digit.'),
  wifeName: z.string().min(1, 'Nama lengkap istri wajib diisi.'),
  wifeBirthPlace: z.string().min(1, 'Tempat lahir istri wajib diisi.'),
  wifeBirthDate: z.string().min(1, 'Tanggal lahir istri wajib diisi.'),
  wifeReligion: z.string().min(1, 'Agama istri wajib diisi.'),
  wifeJob: z.string().min(1, 'Pekerjaan istri wajib diisi.'),
  wifeAddress: z.string().min(1, 'Alamat istri wajib diisi.'),

  // Kontak Pemohon
  phone: phoneValidationSchema,

  // Data Pernikahan
  weddingDate: z.string().min(1, 'Tanggal pernikahan terdahulu wajib diisi.'),
  weddingPlace: z.string().min(1, 'Tempat akad nikah wajib diisi.'),
  kuaName: z.string().min(1, 'KUA Kecamatan tempat menikah wajib diisi.'),
  marriageBookNumber: z.string().optional(),
  condition: z.enum(['Hilang', 'Rusak']),
  chronology: z.string().optional(),

  // Saksi-Saksi (untuk lampiran SP-HILANG)
  witness1Nik: z.string().optional(),
  witness1Name: z.string().min(1, 'Nama Saksi I wajib diisi.'),
  witness2Nik: z.string().optional(),
  witness2Name: z.string().min(1, 'Nama Saksi II wajib diisi.'),
});

export function DuplikatNikahForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingHusband, setIsSearchingHusband] = useState(false);
  const [isSearchingWife, setIsSearchingWife] = useState(false);
  const [isSearchingWitness1, setIsSearchingWitness1] = useState(false);
  const [isSearchingWitness2, setIsSearchingWitness2] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<Array<{ fieldName: string; file: File }>>([]);

  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      husbandNik: '',
      husbandName: '',
      husbandBirthPlace: '',
      husbandBirthDate: '',
      husbandReligion: 'Islam',
      husbandJob: 'Wiraswasta',
      husbandAddress: '',

      wifeNik: '',
      wifeName: '',
      wifeBirthPlace: '',
      wifeBirthDate: '',
      wifeReligion: 'Islam',
      wifeJob: 'Mengurus Rumah Tangga',
      wifeAddress: '',

      phone: '',

      weddingDate: '',
      weddingPlace: 'KUA Kecamatan Gandrungmangu',
      kuaName: 'Gandrungmangu',
      marriageBookNumber: '',
      condition: 'Hilang',
      chronology: 'Buku Nikah asli tercecer dan hilang saat pindahan rumah dan telah dilaporkan ke Polsek setempat.',

      witness1Nik: '',
      witness1Name: '',
      witness2Nik: '',
      witness2Name: '',
    },
  });

  const handleNikLookupHusband = async (nikValue: string) => {
    if (nikValue.length !== 16 || !firestore) return;
    setIsSearchingHusband(true);
    try {
      const resident = await getResidentByNik(firestore, nikValue);
      if (resident) {
        form.setValue('husbandName', resident.fullName);
        if (resident.placeOfBirth) form.setValue('husbandBirthPlace', resident.placeOfBirth);
        if (resident.dateOfBirth) form.setValue('husbandBirthDate', formatDbDateToForm(resident.dateOfBirth));
        if (resident.religion) form.setValue('husbandReligion', resident.religion);
        if (resident.occupation) form.setValue('husbandJob', resident.occupation);
        if (resident.address) {
          const fullAddress = `Desa Sampeldes RT ${resident.rt || '001'} / RW ${resident.rw || '001'}, Kecamatan Gandrungmangu`;
          form.setValue('husbandAddress', fullAddress);
        }
        toast({ title: 'Data Suami Ditemukan', description: `Data kependudukan ${resident.fullName} berhasil dimuat.` });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingHusband(false);
    }
  };

  const handleNikLookupWife = async (nikValue: string) => {
    if (nikValue.length !== 16 || !firestore) return;
    setIsSearchingWife(true);
    try {
      const resident = await getResidentByNik(firestore, nikValue);
      if (resident) {
        form.setValue('wifeName', resident.fullName);
        if (resident.placeOfBirth) form.setValue('wifeBirthPlace', resident.placeOfBirth);
        if (resident.dateOfBirth) form.setValue('wifeBirthDate', formatDbDateToForm(resident.dateOfBirth));
        if (resident.religion) form.setValue('wifeReligion', resident.religion);
        if (resident.occupation) form.setValue('wifeJob', resident.occupation);
        if (resident.address) {
          const fullAddress = `Desa Sampeldes RT ${resident.rt || '001'} / RW ${resident.rw || '001'}, Kecamatan Gandrungmangu`;
          form.setValue('wifeAddress', fullAddress);
        }
        toast({ title: 'Data Istri Ditemukan', description: `Data kependudukan ${resident.fullName} berhasil dimuat.` });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingWife(false);
    }
  };

  const handleNikLookupWitness1 = async (nikValue: string) => {
    if (nikValue.length !== 16 || !firestore) return;
    setIsSearchingWitness1(true);
    try {
      const resident = await getResidentByNik(firestore, nikValue);
      if (resident) {
        form.setValue('witness1Name', resident.fullName);
        toast({ title: 'Data Saksi I Ditemukan', description: `${resident.fullName} berhasil dimuat.` });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingWitness1(false);
    }
  };

  const handleNikLookupWitness2 = async (nikValue: string) => {
    if (nikValue.length !== 16 || !firestore) return;
    setIsSearchingWitness2(true);
    try {
      const resident = await getResidentByNik(firestore, nikValue);
      if (resident) {
        form.setValue('witness2Name', resident.fullName);
        toast({ title: 'Data Saksi II Ditemukan', description: `${resident.fullName} berhasil dimuat.` });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingWitness2(false);
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
      if (!filesToUpload.some((f) => f.fieldName === 'ktp_suami' || f.fieldName === 'ktp')) {
        toast({ title: 'Berkas Belum Lengkap', description: 'Mohon unggah KTP Pemohon / Suami / Istri.', variant: 'destructive' });
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
            targetFileName: `${item.fieldName}_${values.husbandNik}`,
            fieldName: item.fieldName,
          };
        }),
      );

      // Hitung nama hari dan format tanggal nikah
      let hariNikah = 'Senin';
      let tglNikahFormatted = values.weddingDate;
      try {
        const dNikah = new Date(values.weddingDate);
        if (!isNaN(dNikah.getTime())) {
          hariNikah = getNamaHariIndonesia(dNikah);
          tglNikahFormatted = formatTanggalIndonesia(dNikah);
        }
      } catch {}

      const openSidPelakuBagian = {
        suami: {
          nik: values.husbandNik,
          nama: values.husbandName,
          jenis_kelamin: 'Laki-laki',
          tempat_lahir: values.husbandBirthPlace,
          tanggal_lahir: values.husbandBirthDate,
          agama: values.husbandReligion,
          pekerjaan: values.husbandJob,
          alamat: values.husbandAddress,
        },
        istri: {
          nik: values.wifeNik,
          nama: values.wifeName,
          jenis_kelamin: 'Perempuan',
          tempat_lahir: values.wifeBirthPlace,
          tanggal_lahir: values.wifeBirthDate,
          agama: values.wifeReligion,
          pekerjaan: values.wifeJob,
          alamat: values.wifeAddress,
        },
        saksi_1: {
          nik: values.witness1Nik || '-',
          nama: values.witness1Name,
        },
        saksi_2: {
          nik: values.witness2Nik || '-',
          nama: values.witness2Name,
        },
      };

      await addSubmission(firestore, {
        ticketNumber: newTicketNumber,
        requesterName: values.husbandName,
        nik: values.husbandNik,
        letterType: 'Surat Permohonan Duplikat Surat Nikah',
        formData: {
          ...values,
          letterType: 'Surat Permohonan Duplikat Surat Nikah',
          openSidPelakuBagian,
          phone: values.phone,
          telepon: values.phone,
          // Format Suami
          form_nama_calon_suami: values.husbandName,
          form_nama_suami: values.husbandName,
          form_ttl_calon_suami: `${values.husbandBirthPlace}, ${values.husbandBirthDate}`,
          form_ttl_suami: `${values.husbandBirthPlace}, ${values.husbandBirthDate}`,
          form_agama_calon_suami: values.husbandReligion,
          form_agama_suami: values.husbandReligion,
          form_pekerjaan_calon_suami: values.husbandJob,
          form_pekerjaan_suami: values.husbandJob,
          form_alamat_calon_suami: values.husbandAddress,
          form_alamat_suami: values.husbandAddress,
          // Format Istri
          form_nama_calon_istri: values.wifeName,
          form_nama_istri: values.wifeName,
          form_ttl_calon_istri: `${values.wifeBirthPlace}, ${values.wifeBirthDate}`,
          form_ttl_istri: `${values.wifeBirthPlace}, ${values.wifeBirthDate}`,
          form_agama_calon_istri: values.wifeReligion,
          form_agama_istri: values.wifeReligion,
          form_pekerjaan_calon_istri: values.wifeJob,
          form_pekerjaan_istri: values.wifeJob,
          form_alamat_calon_istri: values.wifeAddress,
          form_alamat_istri: values.wifeAddress,
          // Format Pernikahan
          form_hari_tanggal_nikah: `${hariNikah}, ${tglNikahFormatted}`,
          form_tempat_akad_nikah: values.weddingPlace,
          form_kua_tempat_nikah: values.kuaName,
          form_no_akta_nikah: values.marriageBookNumber || '-',
          form_status_buku_nikah: values.condition,
          form_kondisi_buku_nikah: values.condition,
          form_keperluan: `Permohonan Duplikat Buku Nikah yang ${values.condition}`,
          // Saksi-Saksi untuk SP-HILANG
          form_nama_saksi_1: values.witness1Name,
          form_nik_saksi_1: values.witness1Nik || '-',
          form_nama_saksi_2: values.witness2Name,
          form_nik_saksi_2: values.witness2Nik || '-',
          form_lost_items: 'Buku Nikah (Kutipan Akta Nikah)',
          form_alasan_duplikat: values.chronology || `Buku Nikah asli mengalami ${values.condition}`,
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
          setIsSubmitted(false);
          form.reset();
        }}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
        {/* BAGIAN 1: DATA SUAMI */}
        <div className="rounded-[2rem] border p-6 md:p-8 bg-white shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-800">
                1. Data Suami
              </h3>
              <p className="text-xs text-slate-500">Identitas lengkap pihak suami sesuai KTP dan Akta Nikah</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="husbandNik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">NIK Suami *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="16 digit NIK Suami"
                        maxLength={16}
                        className="rounded-xl font-mono text-sm"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (e.target.value.length === 16) {
                            handleNikLookupHusband(e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl px-3 font-bold text-xs"
                      disabled={isSearchingHusband || field.value.length !== 16}
                      onClick={() => handleNikLookupHusband(field.value)}
                    >
                      {isSearchingHusband ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cari'}
                    </Button>
                  </div>
                  <FormDescription className="text-[11px]">Ketik 16 digit NIK untuk pencarian otomatis</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="husbandName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">Nama Lengkap Suami *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap suami" className="rounded-xl uppercase font-semibold" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="husbandBirthPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">Tempat Lahir Suami *</FormLabel>
                  <FormControl>
                    <Input placeholder="Kota / Kabupaten Lahir" className="rounded-xl uppercase" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="husbandBirthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">Tanggal Lahir Suami *</FormLabel>
                  <FormControl>
                    <Input type="date" className="rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="husbandReligion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">Agama Suami *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Pilih Agama" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Islam">Islam</SelectItem>
                      <SelectItem value="Kristen">Kristen</SelectItem>
                      <SelectItem value="Katolik">Katolik</SelectItem>
                      <SelectItem value="Hindu">Hindu</SelectItem>
                      <SelectItem value="Buddha">Buddha</SelectItem>
                      <SelectItem value="Khonghucu">Khonghucu</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="husbandJob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">Pekerjaan Suami *</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Wiraswasta / Karyawan" className="rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="husbandAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-600">Alamat Tempat Tinggal Suami *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Desa Sampeldes RT 001 / RW 005, Kecamatan Gandrungmangu"
                        className="rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">Format: Desa ... RT ... / RW ..., Kecamatan ...</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 2: DATA ISTRI */}
        <div className="rounded-[2rem] border p-6 md:p-8 bg-white shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-800">
                2. Data Istri
              </h3>
              <p className="text-xs text-slate-500">Identitas lengkap pihak istri sesuai KTP dan Akta Nikah</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="wifeNik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">NIK Istri *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="16 digit NIK Istri"
                        maxLength={16}
                        className="rounded-xl font-mono text-sm"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (e.target.value.length === 16) {
                            handleNikLookupWife(e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl px-3 font-bold text-xs"
                      disabled={isSearchingWife || field.value.length !== 16}
                      onClick={() => handleNikLookupWife(field.value)}
                    >
                      {isSearchingWife ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cari'}
                    </Button>
                  </div>
                  <FormDescription className="text-[11px]">Ketik 16 digit NIK untuk pencarian otomatis</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wifeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">Nama Lengkap Istri *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap istri" className="rounded-xl uppercase font-semibold" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wifeBirthPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">Tempat Lahir Istri *</FormLabel>
                  <FormControl>
                    <Input placeholder="Kota / Kabupaten Lahir" className="rounded-xl uppercase" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wifeBirthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">Tanggal Lahir Istri *</FormLabel>
                  <FormControl>
                    <Input type="date" className="rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wifeReligion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">Agama Istri *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Pilih Agama" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Islam">Islam</SelectItem>
                      <SelectItem value="Kristen">Kristen</SelectItem>
                      <SelectItem value="Katolik">Katolik</SelectItem>
                      <SelectItem value="Hindu">Hindu</SelectItem>
                      <SelectItem value="Buddha">Buddha</SelectItem>
                      <SelectItem value="Khonghucu">Khonghucu</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wifeJob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">Pekerjaan Istri *</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Mengurus Rumah Tangga" className="rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="wifeAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-600">Alamat Tempat Tinggal Istri *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Desa Sampeldes RT 001 / RW 005, Kecamatan Gandrungmangu"
                        className="rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">Format: Desa ... RT ... / RW ..., Kecamatan ...</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 3: DATA PERNIKAHAN & KONDISI BUKU NIKAH */}
        <div className="rounded-[2rem] border p-6 md:p-8 bg-white shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-800">
                3. Data Pernikahan & Status Buku Nikah
              </h3>
              <p className="text-xs text-slate-500">Rincian akad nikah dan keterangan kehilangan atau kerusakan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="weddingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">Hari / Tanggal Nikah *</FormLabel>
                  <FormControl>
                    <Input type="date" className="rounded-xl" {...field} />
                  </FormControl>
                  <FormDescription className="text-[11px]">Sistem otomatis menerjemahkan nama hari pada hasil cetak</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weddingPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">Tempat Akad Nikah *</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Balai Nikah KUA / Masjid Sampeldes" className="rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kuaName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">Dicatat di KUA Kecamatan *</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Gandrungmangu" className="rounded-xl" {...field} />
                  </FormControl>
                  <FormDescription className="text-[11px]">Kecamatan lokasi KUA penerbit buku nikah</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="marriageBookNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">Nomor Akta Nikah (Opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: 123/45/VI/2018" className="rounded-xl font-mono" {...field} />
                  </FormControl>
                  <FormDescription className="text-[11px]">Kosongkan jika tidak ingat, nanti dicek petugas KUA</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">Kondisi Buku Nikah *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl font-bold">
                        <SelectValue placeholder="Pilih Kondisi" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Hilang">Hilang (Tercecer / Lupa Tempat Simpan / Bencana)</SelectItem>
                      <SelectItem value="Rusak">Rusak (Robek / Terbakar / Luntur)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-600">No. HP / WhatsApp Pemohon *</FormLabel>
                  <FormControl>
                    <Input placeholder="08xxxxxxxxxx" className="rounded-xl font-mono" {...field} />
                  </FormControl>
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
                    <FormLabel className="text-xs font-bold uppercase text-slate-600">Keterangan Kronologi (Untuk Lampiran SP-HILANG)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jelaskan secara singkat perkiraan waktu dan tempat terjadinya kehilangan/kerusakan buku nikah..."
                        className="rounded-xl min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 4: SAKSI-SAKSI (UNTUK LAMPIRAN SP-HILANG) */}
        <div className="rounded-[2rem] border p-6 md:p-8 bg-white shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-800">
                4. Data Saksi-Saksi (Lampiran SP-HILANG)
              </h3>
              <p className="text-xs text-slate-500">Diisi oleh Ketua RT/RW atau tokoh masyarakat sebagai saksi</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Saksi 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">Identitas Saksi I</span>
              <FormField
                control={form.control}
                name="witness1Nik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600">NIK Saksi I (Opsional)</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="16 digit NIK"
                          maxLength={16}
                          className="rounded-xl font-mono text-xs bg-white"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (e.target.value.length === 16) {
                              handleNikLookupWitness1(e.target.value);
                            }
                          }}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl px-2.5 text-xs"
                        disabled={isSearchingWitness1 || (field.value || '').length !== 16}
                        onClick={() => handleNikLookupWitness1(field.value || '')}
                      >
                        {isSearchingWitness1 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Cari'}
                      </Button>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="witness1Name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600">Nama Lengkap Saksi I *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: HUSNI MUBAROK (Ketua RT 01)" className="rounded-xl uppercase font-semibold bg-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Saksi 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">Identitas Saksi II</span>
              <FormField
                control={form.control}
                name="witness2Nik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600">NIK Saksi II (Opsional)</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="16 digit NIK"
                          maxLength={16}
                          className="rounded-xl font-mono text-xs bg-white"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (e.target.value.length === 16) {
                              handleNikLookupWitness2(e.target.value);
                            }
                          }}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl px-2.5 text-xs"
                        disabled={isSearchingWitness2 || (field.value || '').length !== 16}
                        onClick={() => handleNikLookupWitness2(field.value || '')}
                      >
                        {isSearchingWitness2 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Cari'}
                      </Button>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="witness2Name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600">Nama Lengkap Saksi II *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: UWAIS NGABDURROHMAN (Ketua RW 05)" className="rounded-xl uppercase font-semibold bg-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 5: UNGGAH PERSYARATAN */}
        <div className="rounded-[2rem] border p-6 md:p-8 bg-white shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-800">
                5. Berkas Persyaratan
              </h3>
              <p className="text-xs text-slate-500">
                {isAdmin ? 'Khusus admin desa: Berkas unggahan bersifat opsional' : 'Unggah foto/scan dokumen pendukung'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <GoogleFileUploader
              label="KTP Pemohon / Suami / Istri"
              fieldName="ktp"
              onFileSelect={handleFileSelect}
              isRequired={!isAdmin}
            />
            <GoogleFileUploader
              label="Kartu Keluarga (KK)"
              fieldName="kk"
              onFileSelect={handleFileSelect}
              isRequired={false}
            />
            <GoogleFileUploader
              label="Surat Kehilangan Polisi / Buku Nikah Rusak"
              fieldName="berkas_kehilangan"
              onFileSelect={handleFileSelect}
              isRequired={false}
            />
          </div>
        </div>

        {/* TOMBOL SUBMIT */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl px-8 py-6 font-bold text-sm bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses Permohonan...
              </>
            ) : (
              'Kirim Permohonan Duplikat Buku Nikah'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

