'use client';
import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Users, User, Briefcase, FileCheck, Paperclip, Globe, Calendar } from 'lucide-react';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    <div className="flex flex-col space-y-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label} {isRequired && <span className="text-destructive">*</span>}
      </label>
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
    </div>
  );
}

const formSchema = z.object({
  // Pihak yang Memberi Izin (Mengizinkan)
  grantorNik: z.string().length(16, 'NIK Pemberi Izin harus 16 digit'),
  grantorName: z.string().min(1, 'Nama Pemberi Izin wajib diisi'),
  grantorBirthPlace: z.string().min(1, 'Tempat lahir wajib diisi'),
  grantorBirthDate: z.string().min(1, 'Tanggal lahir wajib diisi'),
  grantorNationality: z.string().min(1, 'Kewarganegaraan wajib diisi'),
  grantorReligion: z.string().min(1, 'Agama wajib diisi'),
  grantorJob: z.string().min(1, 'Pekerjaan pemberi izin wajib diisi'),
  grantorMaritalStatus: z.string().min(1, 'Status perkawinan wajib diisi'),
  grantorAddress: z.string().min(1, 'Alamat pemberi izin wajib diisi'),
  grantorRelation: z.string().min(1, 'Hubungan dengan CTKI wajib diisi'),
  recipientRelationCall: z.string().min(1, 'Sebutan hubungan penerima izin wajib diisi'),

  // Pihak yang Diberi Izin (Penerima Izin / CTKI)
  granteeNik: z.string().length(16, 'NIK Yang Diberi Izin harus 16 digit'),
  granteeName: z.string().min(1, 'Nama Yang Diberi Izin wajib diisi'),
  granteeBirthPlace: z.string().min(1, 'Tempat lahir wajib diisi'),
  granteeBirthDate: z.string().min(1, 'Tanggal lahir wajib diisi'),
  granteeGender: z.string().min(1, 'Jenis kelamin wajib diisi'),
  granteeNationality: z.string().min(1, 'Kewarganegaraan wajib diisi'),
  granteeReligion: z.string().min(1, 'Agama wajib diisi'),
  granteeJob: z.string().min(1, 'Pekerjaan yang diberi izin wajib diisi'),
  granteeMaritalStatus: z.string().min(1, 'Status perkawinan wajib diisi'),
  granteeAddress: z.string().min(1, 'Alamat asal / terdahulu wajib diisi'),

  // Rincian Kegiatan Bekerja / Tujuan & Masa Kontrak
  destinationLocation: z.string().min(1, 'Negara / Kota tujuan kerja wajib diisi'),
  contractDuration: z.string().min(1, 'Masa kontrak kerja wajib diisi'),
  destinationCompany: z.string().optional(),
  jobPosition: z.string().optional(),
  purpose: z.string().min(1, 'Keperluan pengajuan surat wajib diisi'),

  whatsapp: phoneValidationSchema,
});

type FormValues = z.infer<typeof formSchema>;

export function IzinKeluargaForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      grantorNationality: 'Indonesia',
      grantorReligion: 'Islam',
      grantorJob: 'Wiraswasta',
      grantorMaritalStatus: 'Kawin',
      grantorAddress: '',
      grantorRelation: 'SUAMI',
      recipientRelationCall: 'isteri',

      granteeNik: '',
      granteeName: '',
      granteeBirthPlace: '',
      granteeBirthDate: '',
      granteeGender: 'Perempuan',
      granteeNationality: 'Indonesia',
      granteeReligion: 'Islam',
      granteeJob: 'Mengurus Rumah Tangga',
      granteeMaritalStatus: 'Kawin',
      granteeAddress: '',

      destinationLocation: 'HONGKONG',
      contractDuration: '2 s/d 3 tahun',
      destinationCompany: '-',
      jobPosition: 'Tenaga Kerja Indonesia (CTKI)',
      purpose: 'Persyaratan administrasi izin keluarga untuk bekerja ke luar negeri / merantau',
      whatsapp: '',
    },
  });

  const grantorNikValue = form.watch('grantorNik');
  const granteeNikValue = form.watch('granteeNik');
  const watchGrantorRelation = form.watch('grantorRelation');

  // Sinkronisasi otomatis sebutan hubungan penerima berdasarkan hubungan CTKI
  useEffect(() => {
    if (watchGrantorRelation) {
      const rel = watchGrantorRelation.toUpperCase();
      if (rel.includes('SUAMI')) {
        form.setValue('recipientRelationCall', 'isteri');
      } else if (rel.includes('ISTRI')) {
        form.setValue('recipientRelationCall', 'suami');
      } else if (rel.includes('AYAH') || rel.includes('IBU') || rel.includes('ORANG TUA')) {
        form.setValue('recipientRelationCall', 'anak kandung');
      }
    }
  }, [watchGrantorRelation, form]);

  // Autofill Pemberi Izin
  useEffect(() => {
    async function fetchGrantor() {
      if (grantorNikValue && grantorNikValue.length === 16 && firestore) {
        try {
          const res = await getResidentByNik(firestore, grantorNikValue);
          if (res) {
            form.setValue('grantorName', res.fullName ? res.fullName.toUpperCase() : form.getValues('grantorName'));
            form.setValue('grantorBirthPlace', res.placeOfBirth || form.getValues('grantorBirthPlace'));
            form.setValue('grantorBirthDate', res.dateOfBirth ? formatDbDateToForm(res.dateOfBirth) : form.getValues('grantorBirthDate'));
            if (res.nationality) form.setValue('grantorNationality', res.nationality);
            if (res.religion) form.setValue('grantorReligion', res.religion);
            if (res.occupation) form.setValue('grantorJob', res.occupation);
            if (res.maritalStatus) form.setValue('grantorMaritalStatus', res.maritalStatus);
            const fullAddress = `${res.address || ''} RT ${res.rt || '00'}/RW ${res.rw || '00'} Dusun ${res.dusun || ''}, Desa Sampeldes`.trim();
            form.setValue('grantorAddress', fullAddress || form.getValues('grantorAddress'));
            toast({
              title: 'Data Pemberi Izin Ditemukan',
              description: `Data terisi otomatis untuk ${res.fullName}`,
            });
          }
        } catch {
          // ignore
        }
      }
    }
    fetchGrantor();
  }, [grantorNikValue, firestore, form, toast]);

  // Autofill Yang Diberi Izin
  useEffect(() => {
    async function fetchGrantee() {
      if (granteeNikValue && granteeNikValue.length === 16 && firestore) {
        try {
          const res = await getResidentByNik(firestore, granteeNikValue);
          if (res) {
            form.setValue('granteeName', res.fullName ? res.fullName.toUpperCase() : form.getValues('granteeName'));
            form.setValue('granteeBirthPlace', res.placeOfBirth || form.getValues('granteeBirthPlace'));
            form.setValue('granteeBirthDate', res.dateOfBirth ? formatDbDateToForm(res.dateOfBirth) : form.getValues('granteeBirthDate'));
            form.setValue('granteeGender', res.gender || form.getValues('granteeGender'));
            if (res.nationality) form.setValue('granteeNationality', res.nationality);
            if (res.religion) form.setValue('granteeReligion', res.religion);
            if (res.occupation) form.setValue('granteeJob', res.occupation);
            if (res.maritalStatus) form.setValue('granteeMaritalStatus', res.maritalStatus);
            const fullAddress = `${res.address || ''} RT ${res.rt || '00'}/RW ${res.rw || '00'} Dusun ${res.dusun || ''}, Desa Sampeldes`.trim();
            form.setValue('granteeAddress', fullAddress || form.getValues('granteeAddress'));
            if ((res as any).telepon) form.setValue('whatsapp', (res as any).telepon);
            toast({
              title: 'Data Yang Diberi Izin Ditemukan',
              description: `Data terisi otomatis untuk ${res.fullName}`,
            });
          }
        } catch {
          // ignore
        }
      }
    }
    fetchGrantee();
  }, [granteeNikValue, firestore, form, toast]);

  const handleFileSelect = (file: File, fieldName: string) => {
    setFiles((prev) => ({ ...prev, [fieldName]: file }));
    setFileErrors((prev) => ({ ...prev, [fieldName]: '' }));
  };

  const onSubmit = async (values: FormValues) => {
    if (!firestore) return;

    if (!isAdmin) {
      if (!validatePhoneForSubmission(values.whatsapp, isAdmin)) {
        form.setError('whatsapp', { message: 'Nomor WhatsApp wajib diisi (minimal 9 digit).' });
        return;
      }
      const newFileErrors: { [key: string]: string } = {};
      if (!files['grantorKtp']) newFileErrors['grantorKtp'] = 'KTP Pemberi Izin wajib diunggah.';
      if (!files['kkFile']) newFileErrors['kkFile'] = 'Kartu Keluarga wajib diunggah.';

      if (Object.keys(newFileErrors).length > 0) {
        setFileErrors(newFileErrors);
        toast({
          title: 'Berkas Kurang Lengkap',
          description: 'Mohon unggah dokumen KTP dan Kartu Keluarga.',
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
            targetFileName: `${fieldName}_${values.granteeNik}`,
            fieldName,
          };
        })
      );

      await addSubmission(firestore, {
        ticketNumber: generatedTicket,
        requesterName: values.granteeName,
        nik: values.granteeNik,
        letterType: 'Surat Izin Keluarga (Bekerja / Merantau)',
        masterSuratId: 'prm-31',
        urlSurat: 'sistem-surat-keterangan-izin-orang-tua-suami-istri',
        kodeSurat: '140',
        formData: {
          ...values,
          // Aliases for OpenSID & templates
          nama_pemberi_izin: values.grantorName,
          nik_pemberi_izin: values.grantorNik,
          tempat_lahir_pemberi_izin: values.grantorBirthPlace,
          tanggal_lahir_pemberi_izin: values.grantorBirthDate,
          warga_negara_pemberi_izin: values.grantorNationality,
          agama_pemberi_izin: values.grantorReligion,
          pekerjaan_pemberi_izin: values.grantorJob,
          status_perkawinan_pemberi_izin: values.grantorMaritalStatus,
          alamat_pemberi_izin: values.grantorAddress,
          hubungan_dengan_ctki: values.grantorRelation,
          panggilan_hubungan_penerima: values.recipientRelationCall,

          nama_penerima_izin: values.granteeName,
          nik_penerima_izin: values.granteeNik,
          tempat_lahir_penerima_izin: values.granteeBirthPlace,
          tanggal_lahir_penerima_izin: values.granteeBirthDate,
          jenis_kelamin_penerima_izin: values.granteeGender,
          warga_negara_penerima_izin: values.granteeNationality,
          agama_penerima_izin: values.granteeReligion,
          pekerjaan_penerima_izin: values.granteeJob,
          status_perkawinan_penerima_izin: values.granteeMaritalStatus,
          alamat_penerima_izin: values.granteeAddress,
          tujuan_kerja: values.destinationLocation,
          masa_kontrak: values.contractDuration,

          phone: values.whatsapp,
          telepon: values.whatsapp,
          form_telepon: values.whatsapp,
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
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-700">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Surat Keterangan Izin Keluarga (Bekerja / Merantau)
          </h2>
          <p className="text-sm text-slate-500">
            Surat izin resmi dari orang tua / suami / istri untuk bekerja ke luar negeri (CTKI) atau merantau
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 1. Pihak yang Memberi Izin (Mengizinkan) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-2">
              <User className="w-4 h-4 text-primary" /> 1. Pihak yang Memberi Izin (Orang Tua / Suami / Istri)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grantorNik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIK Pemberi Izin *</FormLabel>
                    <FormControl>
                      <Input placeholder="3301..." maxLength={16} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grantorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap Pemberi Izin *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama lengkap pemberi izin" {...field} />
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
                    <FormLabel>Tempat Lahir *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Lampung Selatan / Cilacap" {...field} />
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
                    <FormLabel>Tanggal Lahir *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grantorNationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warga Negara *</FormLabel>
                    <FormControl>
                      <Input placeholder="Indonesia / WNI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grantorReligion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agama *</FormLabel>
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
                name="grantorJob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pekerjaan Pemberi Izin *</FormLabel>
                    <FormControl>
                      <Input placeholder="Wiraswasta / Petani / Karyawan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grantorMaritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Perkawinan *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Kawin">Kawin</SelectItem>
                        <SelectItem value="Belum Kawin">Belum Kawin</SelectItem>
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
                name="grantorRelation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hubungan Dengan CTKI *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Hubungan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SUAMI">SUAMI</SelectItem>
                        <SelectItem value="ISTRI">ISTRI</SelectItem>
                        <SelectItem value="AYAH KANDUNG">AYAH KANDUNG</SelectItem>
                        <SelectItem value="IBU KANDUNG">IBU KANDUNG</SelectItem>
                        <SelectItem value="ORANG TUA">ORANG TUA</SelectItem>
                        <SelectItem value="KELUARGA">KELUARGA</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recipientRelationCall"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sebutan Hubungan Penerima Izin *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: isteri / suami / anak kandung" {...field} />
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
                  <FormLabel>Alamat Lengkap Pemberi Izin *</FormLabel>
                  <FormControl>
                    <Input placeholder="Dusun, RT/RW, Desa, Kecamatan, Kabupaten, Provinsi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 2. Pihak yang Diberi Izin (Penerima Izin / CTKI) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-2">
              <Users className="w-4 h-4 text-primary" /> 2. Pihak yang Diberi Izin (Tenaga Kerja / CTKI)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="granteeNik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIK yang Diberi Izin *</FormLabel>
                    <FormControl>
                      <Input placeholder="3301..." maxLength={16} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="granteeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap yang Diberi Izin *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama yang diberi izin bekerja" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="granteeBirthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempat Lahir *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Labuhan Maringgai / Cilacap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="granteeBirthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Lahir *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="granteeGender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kelamin *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Jenis Kelamin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Perempuan">Perempuan</SelectItem>
                        <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="granteeNationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warga Negara *</FormLabel>
                    <FormControl>
                      <Input placeholder="Indonesia / WNI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="granteeReligion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agama *</FormLabel>
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
                name="granteeJob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pekerjaan Saat Ini *</FormLabel>
                    <FormControl>
                      <Input placeholder="Mengurus Rumah Tangga / Belum Bekerja" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="granteeMaritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Perkawinan *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Kawin">Kawin</SelectItem>
                        <SelectItem value="Belum Kawin">Belum Kawin</SelectItem>
                        <SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem>
                        <SelectItem value="Cerai Mati">Cerai Mati</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="granteeAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Terdahulu / Asal Tinggal *</FormLabel>
                  <FormControl>
                    <Input placeholder="Dusun, RT/RW, Desa, Kecamatan, Kabupaten, Provinsi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 3. Rincian Penempatan Kerja & Kontrak */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-2">
              <Globe className="w-4 h-4 text-primary" /> 3. Rincian Penempatan & Masa Kontrak
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="destinationLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kota / Negara Tujuan Bekerja *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: HONGKONG, TAIWAN, JEPANG, KOREA SELATAN, MALAYSIA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Masa Kontrak Kerja *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: 2 s/d 3 tahun atau 2 tahun" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destinationCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama PPTKIS / Perusahaan Penyalur (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Isi tanda '-' jika perorangan / belum ada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posisi / Jenis Pekerjaan (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Caregiver / Tenaga Kerja Formal / Informal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Keperluan Pengajuan Surat *</FormLabel>
                    <FormControl>
                      <Input placeholder="Persyaratan administrasi izin keluarga untuk bekerja ke luar negeri / merantau" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 4. Kontak & Dokumen Persyaratan */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b pb-2">
              <FileCheck className="w-4 h-4 text-primary" /> 4. Kontak & Dokumen Persyaratan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Nomor WhatsApp Aktif {isAdmin ? <span className="text-slate-400 font-normal text-xs">(Opsional)</span> : <span className="text-red-500">*</span>}</FormLabel>
                    <FormControl>
                      <Input placeholder={isAdmin ? "Opsional untuk pengajuan admin" : "081234567890"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <GoogleFileUploader
                  label="Scan / Foto KTP Pemberi Izin"
                  fieldName="grantorKtp"
                  onFileSelect={handleFileSelect}
                  isRequired={!isAdmin}
                />
                {fileErrors.grantorKtp && (
                  <p className="text-xs text-destructive mt-1">{fileErrors.grantorKtp}</p>
                )}
              </div>
              <div>
                <GoogleFileUploader
                  label="Scan / Foto Kartu Keluarga"
                  fieldName="kkFile"
                  onFileSelect={handleFileSelect}
                  isRequired={!isAdmin}
                />
                {fileErrors.kkFile && (
                  <p className="text-xs text-destructive mt-1">{fileErrors.kkFile}</p>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full py-6 text-base font-bold shadow-md">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Memproses Permohonan...
              </>
            ) : (
              'Kirim Permohonan Surat Izin Keluarga'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}