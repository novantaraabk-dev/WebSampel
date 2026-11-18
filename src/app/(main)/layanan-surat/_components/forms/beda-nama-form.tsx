'use client';
import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, FileSpreadsheet, User, UploadCloud, FileCheck, Paperclip, Users } from 'lucide-react';

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

  // Dokumen 1 (Acuan Utama, e.g. KTP / KK)
  doc1Name: z.string().min(1, 'Nama dokumen pertama wajib diisi.'), // misal: KTP / Kartu Keluarga
  doc1Number: z.string().optional(),
  doc1Data: z.string().min(1, 'Nama / data yang tercantum pada dokumen 1 wajib diisi.'),

  // Dokumen 2 (Yang Berbeda, e.g. Ijazah / Sertifikat / Buku Nikah / Paspor)
  doc2Name: z.string().min(1, 'Nama dokumen kedua wajib diisi.'), // misal: Ijazah / Buku Nikah
  doc2Number: z.string().optional(),
  doc2Data: z.string().min(1, 'Nama / data yang tercantum pada dokumen 2 wajib diisi.'),

  // Penjelasan perbedaan & keperluan
  differenceDesc: z.string().min(1, 'Penjelasan perbedaan identitas wajib diisi.'),
  purpose: z.string().min(1, 'Keperluan surat wajib diisi.'),

  // Saksi-Saksi untuk Lampiran SPTJM-BN
  witness1Nik: z.string().optional(),
  witness1Name: z.string().optional(),
  witness2Nik: z.string().optional(),
  witness2Name: z.string().optional(),
});

export function BedaNamaForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchingNik, setSearchingNik] = useState<string | null>(null);
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
      doc1Name: 'Kartu Tanda Penduduk',
      doc1Number: '',
      doc1Data: '',
      doc2Name: 'Ijazah',
      doc2Number: '',
      doc2Data: '',
      differenceDesc: 'Terdapat perbedaan penulisan nama pada dokumen tersebut namun sebenarnya adalah satu orang yang sama.',
      purpose: 'Penyesuaian administrasi dan perbaikan dokumen kependudukan',
      witness1Nik: '',
      witness1Name: '',
      witness2Nik: '',
      witness2Name: '',
    },
  });

  const nikValue = form.watch('nik');
  const witness1NikValue = form.watch('witness1Nik');
  const witness2NikValue = form.watch('witness2Nik');

  useEffect(() => {
    const fetchWitness1 = async () => {
      if (witness1NikValue?.length === 16 && firestore) {
        setSearchingNik('witness1');
        try {
          const res = await getResidentByNik(firestore, witness1NikValue);
          if (res) {
            form.setValue('witness1Name', res.fullName.toUpperCase());
            toast({ title: 'Saksi 1 Ditemukan', description: res.fullName });
          }
        } finally {
          setSearchingNik(null);
        }
      }
    };
    fetchWitness1();
  }, [witness1NikValue, firestore, form, toast]);

  useEffect(() => {
    const fetchWitness2 = async () => {
      if (witness2NikValue?.length === 16 && firestore) {
        setSearchingNik('witness2');
        try {
          const res = await getResidentByNik(firestore, witness2NikValue);
          if (res) {
            form.setValue('witness2Name', res.fullName.toUpperCase());
            toast({ title: 'Saksi 2 Ditemukan', description: res.fullName });
          }
        } finally {
          setSearchingNik(null);
        }
      }
    };
    fetchWitness2();
  }, [witness2NikValue, firestore, form, toast]);

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
            form.setValue('doc1Number', resident.nik);
            form.setValue('doc1Data', resident.fullName.toUpperCase());
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

      await addSubmission(firestore, {
        ticketNumber: newTicketNumber,
        requesterName: values.name,
        nik: values.nik,
        letterType: 'Surat Keterangan Beda Nama',
        formData: {
          ...values,
          jenisDokumen1: values.doc1Name,
          docType1: values.doc1Name,
          namaDokumen1: values.doc1Data,
          form_nama_dokumen_1: values.doc1Name,
          form_nama_di_dokumen_1: values.doc1Data,

          jenisDokumen2: values.doc2Name,
          docType2: values.doc2Name,
          namaDokumen2: values.doc2Data,
          form_jenis_dokumen_2: values.doc2Name,
          form_nama_kartu_identitas: values.doc2Name,
          form_nama_di_dokumen_2: values.doc2Data,
          form_nama: values.doc2Data,

          phone: values.phone,
          telepon: values.phone,
          form_telepon: values.phone,

          // Saksi 1 & Saksi 2 untuk SPTJM-BN
          witness1Nik: values.witness1Nik || '',
          witness1Name: values.witness1Name || '',
          witness2Nik: values.witness2Nik || '',
          witness2Name: values.witness2Name || '',

          form_nama_saksi_1: values.witness1Name || '',
          form_nik_saksi_1: values.witness1Nik || '',
          form_nama_saksi_i: values.witness1Name || '',
          form_nik_saksi_i: values.witness1Nik || '',
          nama_saksi_1: values.witness1Name || '',
          nik_saksi_1: values.witness1Nik || '',

          form_nama_saksi_2: values.witness2Name || '',
          form_nik_saksi_2: values.witness2Nik || '',
          form_nama_saksi_ii: values.witness2Name || '',
          form_nik_saksi_ii: values.witness2Nik || '',
          nama_saksi_2: values.witness2Name || '',
          nik_saksi_2: values.witness2Nik || '',

          openSidPelakuBagian: {
            saksi_1: {
              nama: values.witness1Name || '',
              nik: values.witness1Nik || '',
            },
            saksi_2: {
              nama: values.witness2Name || '',
              nik: values.witness2Nik || '',
            },
          },
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
        <FormSection title="I. Identitas Pemohon" icon={<User className="h-5 w-5" />}>
          <FormField
            control={form.control}
            name="nik"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">
                  NIK Pemohon {isSearching && <Loader2 className="inline h-3 w-3 animate-spin ml-1 text-primary" />}
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
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Alamat Lengkap</FormLabel>
                  <FormControl><Textarea placeholder="Alamat domisili pemohon..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* II. DOKUMEN YANG BERBEDA */}
        <FormSection title="II. Perbandingan Data Dokumen" icon={<FileSpreadsheet className="h-5 w-5" />}>
          <div className="md:col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs leading-relaxed">
            Sebutkan dua dokumen yang memiliki perbedaan penulisan nama, tanggal lahir, atau identitas lainnya agar pemerintah desa dapat menerangkan kesamaan orang tersebut.
          </div>

          {/* DOKUMEN 1 */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Dokumen Pertama (Acuan Utama)</h4>
            <FormField
              control={form.control}
              name="doc1Name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Jenis Dokumen 1</FormLabel>
                  <FormControl><Input placeholder="Contoh: Kartu Tanda Penduduk" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="doc1Number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Dokumen 1 (Bila ada)</FormLabel>
                  <FormControl><Input placeholder="Nomor KTP/KK..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="doc1Data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Nama Tertulis Pada Dokumen 1</FormLabel>
                  <FormControl><Input placeholder="Nama lengkap persis sesuai KTP..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* DOKUMEN 2 */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Dokumen Kedua (Data Berbeda)</h4>
            <FormField
              control={form.control}
              name="doc2Name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Jenis Dokumen 2</FormLabel>
                  <FormControl><Input placeholder="Contoh: Ijazah / Buku Nikah / Sertifikat / Paspor" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="doc2Number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Dokumen 2 (Bila ada)</FormLabel>
                  <FormControl><Input placeholder="Nomor Ijazah/Buku Nikah..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="doc2Data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Nama Tertulis Pada Dokumen 2</FormLabel>
                  <FormControl><Input placeholder="Nama yang tercantum di Ijazah / Dokumen 2..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="differenceDesc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Keterangan Penegasan</FormLabel>
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
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Keperluan Surat</FormLabel>
                  <FormControl><Input placeholder="Contoh: Pengurusan Hak Waris / Perbaikan Ijazah / BPJS..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* III. SAKSI-SAKSI */}
        <FormSection title="III. Identitas Saksi-Saksi (Untuk Lampiran SPTJM)" icon={<Users className="h-5 w-5" />}>
          <div className="md:col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs leading-relaxed">
            Masukkan identitas Saksi 1 dan Saksi 2 (Nama &amp; NIK) yang mengetahui dan membenarkan perbedaan identitas/nama untuk pengisian lembar lampiran <strong>SPTJM-BN</strong>. Masukkan 16 digit NIK untuk pencarian otomatis dari data kependudukan desa.
          </div>

          {/* SAKSI 1 */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              Identitas Saksi I
            </h4>
            <FormField
              control={form.control}
              name="witness1Nik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">
                    NIK Saksi 1 {searchingNik === 'witness1' && <Loader2 className="inline h-3 w-3 animate-spin ml-1 text-primary" />}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="16 digit NIK saksi 1..." maxLength={16} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="witness1Name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Nama Lengkap Saksi 1</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama saksi 1..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* SAKSI 2 */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              Identitas Saksi II
            </h4>
            <FormField
              control={form.control}
              name="witness2Nik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">
                    NIK Saksi 2 {searchingNik === 'witness2' && <Loader2 className="inline h-3 w-3 animate-spin ml-1 text-primary" />}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="16 digit NIK saksi 2..." maxLength={16} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="witness2Name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Nama Lengkap Saksi 2</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama saksi 2..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* IV. BERKAS PENDUKUNG */}
        <FormSection title="IV. Berkas Pendukung" icon={<Paperclip className="h-5 w-5" />}>
          <GoogleFileUploader
            label="KTP Pemohon"
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
            label="Foto Dokumen Yang Berbeda (Ijazah / Buku Nikah / Sertifikat)"
            fieldName="dokumen_pembanding"
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
              'Kirim Pengajuan Surat Beda Nama'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
