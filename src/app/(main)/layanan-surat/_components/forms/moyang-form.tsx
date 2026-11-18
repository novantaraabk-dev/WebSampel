'use client';

import { phoneValidationSchema, validatePhoneForSubmission } from './form-helpers';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, UploadCloud, FileCheck, User, Paperclip, Users, FileText, Sparkles } from 'lucide-react';

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
    <div className="space-y-1.5">
      <label className={cn("block text-xs font-bold uppercase tracking-wider text-slate-700", isRequired && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
        {label}
      </label>
      <div className="relative border-2 border-dashed rounded-xl p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
        <Input
          type="file"
          onChange={handleFileChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          accept="image/jpeg,image/png,application/pdf"
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="truncate pr-4 font-medium">{fileName || 'Pilih berkas JPG, PNG, atau PDF...'}</span>
          {fileName ? <FileCheck className="h-5 w-5 text-emerald-600 shrink-0" /> : <UploadCloud className="h-5 w-5 text-slate-400 shrink-0" />}
        </div>
      </div>
    </div>
  );
}

const FormSection = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) => (
  <div className="space-y-6 rounded-2xl border p-5 md:p-7 bg-white shadow-sm">
    <div className="flex items-center gap-3 border-b pb-3">
      {Icon && (
        <div className="p-2 bg-primary/10 rounded-xl text-primary">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
  </div>
);

const formSchema = z.object({
  // I. Identitas Orang yang Diterangkan / Pemohon
  nik: z.string().length(16, 'NIK harus 16 digit.'),
  name: z.string().min(1, 'Nama lengkap wajib diisi.'),
  gender: z.string().min(1, 'Jenis kelamin wajib diisi.'),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi.'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi.'),
  nationality: z.string().min(1, 'Kewarganegaraan wajib diisi.'),
  religion: z.string().min(1, 'Agama wajib diisi.'),
  job: z.string().min(1, 'Pekerjaan wajib diisi.'),
  address: z.string().min(1, 'Alamat domisili wajib diisi.'),
  phone: phoneValidationSchema,

  // II. Data Moyang / Silsilah (Opsional)
  moyangName: z.string().optional(),
  moyangNik: z.string().optional(),
  moyangRelation: z.string().optional(),

  // III. Redaksi Keterangan (Format Cetak)
  keteranganStatus: z.string().min(1, 'Keterangan status pokok wajib diisi.'),
  keteranganTambahan: z.string().optional(),
  purpose: z.string().min(1, 'Keperluan pengajuan surat wajib diisi.'),
});

export function MoyangForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingPemohon, setIsSearchingPemohon] = useState(false);
  const [isSearchingMoyang, setIsSearchingMoyang] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<Array<{ fieldName: string; file: File }>>([]);

  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: '',
      name: '',
      gender: 'Laki-Laki',
      birthPlace: '',
      birthDate: '',
      nationality: 'WNI',
      religion: 'Islam',
      job: '',
      address: '',
      phone: '',
      moyangName: '',
      moyangNik: '',
      moyangRelation: 'Kakek Kandung dari Pihak Ayah',
      keteranganStatus: 'Bahwa orang tersebut di atas adalah benar-benar penduduk Desa Sampeldes',
      keteranganTambahan: '',
      purpose: 'Pembuatan Akta Kelahiran di Kantor Disdukcapil',
    },
  });

  const pemohonNik = form.watch('nik');
  const moyangNik = form.watch('moyangNik');

  // Auto-fill Data Pemohon dari NIK Kependudukan
  useEffect(() => {
    const fetchPemohon = async () => {
      if (pemohonNik?.length === 16 && firestore) {
        setIsSearchingPemohon(true);
        try {
          const res = await getResidentByNik(firestore, pemohonNik);
          if (res) {
            form.setValue('name', res.fullName.toUpperCase());
            form.setValue('gender', res.gender);
            form.setValue('birthPlace', res.placeOfBirth);
            form.setValue('birthDate', formatDbDateToForm(res.dateOfBirth));
            form.setValue('religion', res.religion || 'Islam');
            form.setValue('job', res.occupation || '');
            const fullAddress = `${res.address}, RT ${res.rt} RW ${res.rw}, ${res.kelurahan}, Kec. Gandrungmangu, Kab. Cilacap`.toUpperCase();
            form.setValue('address', fullAddress);

            if ((res as any).telepon && !form.getValues('phone')) {
              form.setValue('phone', (res as any).telepon);
            }

            toast({ title: "Data Warga Ditemukan", description: `Memuat identitas: ${res.fullName}` });
          }
        } finally {
          setIsSearchingPemohon(false);
        }
      }
    };
    fetchPemohon();
  }, [pemohonNik, firestore, form, toast]);

  // Auto-fill Data Moyang jika NIK Moyang diinput
  useEffect(() => {
    const fetchMoyang = async () => {
      if (moyangNik && moyangNik.length === 16 && firestore) {
        setIsSearchingMoyang(true);
        try {
          const res = await getResidentByNik(firestore, moyangNik);
          if (res) {
            form.setValue('moyangName', res.fullName.toUpperCase());
            toast({ title: "Data Moyang/Keluarga Ditemukan", description: `Nama: ${res.fullName}` });
          }
        } finally {
          setIsSearchingMoyang(false);
        }
      }
    };
    fetchMoyang();
  }, [moyangNik, firestore, form, toast]);

  const handleFileSelect = (file: File, fieldName: string) => {
    setFilesToUpload(prev => [...prev.filter(f => f.fieldName !== fieldName), { file, fieldName }]);
  };

  const applyStatusTemplate = (type: 'penduduk' | 'silsilah' | 'beda_nama') => {
    const mName = form.getValues('moyangName');
    const mRel = form.getValues('moyangRelation');
    if (type === 'penduduk') {
      form.setValue('keteranganStatus', 'Bahwa orang tersebut di atas adalah benar-benar penduduk Desa Sampeldes.');
    } else if (type === 'silsilah') {
      const relStr = mName ? ` dan merupakan garis keturunan sah dari ${mName}${mRel ? ` (${mRel})` : ''}.` : ' dan merupakan garis keturunan sah dari keluarga/moyang di Desa Sampeldes.';
      form.setValue('keteranganStatus', `Bahwa orang tersebut di atas adalah benar-benar penduduk Desa Sampeldes${relStr}`);
    } else if (type === 'beda_nama') {
      form.setValue('keteranganStatus', 'Bahwa orang tersebut di atas adalah benar-benar penduduk Desa Sampeldes yang memiliki perbedaan penulisan nama/data pada dokumen kependudukan namun adalah satu orang yang sama.');
    }
  };

  const generateTicketNumber = () => `BLS-${Date.now().toString().slice(-6)}`;

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
        letterType: 'Surat Keterangan Moyang',
        purpose: values.purpose,
        formData: {
          ...values,
          fullName: values.name,
          nik: values.nik,
          placeOfBirth: values.birthPlace,
          dateOfBirth: values.birthDate,
          gender: values.gender,
          religion: values.religion,
          job: values.job,
          address: values.address,

          // Redaksi Surat Sesuai Format Resmi
          form_keterangan_status_moyang: values.keteranganStatus,
          keterangan_status_moyang: values.keteranganStatus,
          keteranganStatus: values.keteranganStatus,

          form_keterangan_tambahan: values.keteranganTambahan || '',
          keterangan_tambahan: values.keteranganTambahan || '',
          keteranganTambahan: values.keteranganTambahan || '',

          form_keperluan: values.purpose,
          keperluan: values.purpose,
          purpose: values.purpose,

          // Silsilah Moyang
          nama_moyang: values.moyangName || '',
          form_nama_moyang: values.moyangName || '',
          hubungan_moyang: values.moyangRelation || '',
          form_hubungan_moyang: values.moyangRelation || '',

          // Kompatibilitas objek lama
          moyang: {
            name: values.moyangName || values.name,
            nik: values.moyangNik || values.nik,
            gender: values.gender,
            birthPlace: values.birthPlace,
            birthDate: values.birthDate,
            nationality: values.nationality,
            religion: values.religion,
            job: values.job,
            address: values.address,
            relation: values.moyangRelation || '',
          },
          anak: {
            name: values.name,
            nik: values.nik,
            gender: values.gender,
            birthPlace: values.birthPlace,
            birthDate: values.birthDate,
            nationality: values.nationality,
            religion: values.religion,
            job: values.job,
            address: values.address,
          },

          phone: values.phone,
          telepon: values.phone,
          form_telepon: values.phone,
        },
        filesToUpload: filesPayload,
      });

      setTicketNumber(newTicketNumber);
      setIsSubmitted(true);
      toast({ title: "Pengajuan Berhasil Disimpan", description: `Nomor tiket Anda: ${newTicketNumber}` });
    } catch (error: any) {
      toast({ title: "Gagal Mengajukan Surat", description: error.message, variant: "destructive" });
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
          setIsSubmitted(false);
          setFilesToUpload([]);
        }}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* I. DATA PEMOHON */}
        <FormSection title="I. Identitas Orang yang Diterangkan" icon={User}>
          <FormField
            control={form.control}
            name="nik"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">
                  NIK Orang yang Diterangkan {isSearchingPemohon && <Loader2 className="inline h-3 w-3 animate-spin ml-1 text-primary" />}
                </FormLabel>
                <FormControl>
                  <Input placeholder="16 digit NIK..." maxLength={16} {...field} disabled={isSubmitting} />
                </FormControl>
                <FormDescription>Masukkan 16 digit NIK untuk pencarian otomatis dari data kependudukan desa.</FormDescription>
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
                <FormControl><Input placeholder="Nama lengkap sesuai KTP..." {...field} disabled={isSubmitting} className="uppercase font-semibold" /></FormControl>
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
                <FormControl><Input placeholder="Laki-Laki / Perempuan" {...field} disabled={isSubmitting} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="birthPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Tempat Lahir</FormLabel>
                  <FormControl><Input placeholder="Kota/Kab" {...field} disabled={isSubmitting} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Tgl Lahir</FormLabel>
                  <FormControl><Input type="date" {...field} disabled={isSubmitting} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Kewarganegaraan</FormLabel>
                <FormControl><Input placeholder="WNI" {...field} disabled={isSubmitting} /></FormControl>
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
                <FormControl><Input placeholder="Islam / Kristen / dll" {...field} disabled={isSubmitting} /></FormControl>
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
                <FormControl><Input placeholder="Pekerjaan..." {...field} disabled={isSubmitting} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="font-bold">
                  Nomor HP / WhatsApp Pemohon {isAdmin ? <span className="text-slate-400 font-normal text-xs">(Opsional)</span> : <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl><Input placeholder={isAdmin ? "Opsional untuk pengajuan admin" : "Contoh: 081234567890"} {...field} disabled={isSubmitting} /></FormControl>
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
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">Alamat Domisili Lengkap</FormLabel>
                  <FormControl><Textarea placeholder="Alamat lengkap sesuai KTP / Kartu Keluarga" {...field} disabled={isSubmitting} rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* II. DATA MOYANG / SILSILAH */}
        <FormSection title="II. Data Moyang / Silsilah Leluhur" icon={Users}>
          <div className="md:col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs leading-relaxed">
            Bagian ini dapat diisi jika surat menerangkan hubungan silsilah garis keturunan dari kakek/nenek/orang tua yang pernah tinggal di Desa Sampeldes.
          </div>

          <FormField
            control={form.control}
            name="moyangName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Nama Lengkap Moyang / Leluhur</FormLabel>
                <FormControl><Input placeholder="Contoh: Alm. Sastro Dikromo" {...field} disabled={isSubmitting} /></FormControl>
                <FormDescription>Nama kakek, nenek, atau leluhur yang diterangkan.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="moyangRelation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Hubungan Silsilah dengan Pemohon</FormLabel>
                <FormControl><Input placeholder="Contoh: Kakek Kandung dari Pihak Ayah" {...field} disabled={isSubmitting} /></FormControl>
                <FormDescription>Hubungan kekeluargaan dengan orang yang diterangkan.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="moyangNik"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="font-bold">
                  NIK Moyang / Leluhur (Bila Ada) {isSearchingMoyang && <Loader2 className="inline h-3 w-3 animate-spin ml-1 text-primary" />}
                </FormLabel>
                <FormControl><Input placeholder="16 digit NIK bila almarhum/moyang memiliki NIK..." maxLength={16} {...field} disabled={isSubmitting} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* III. REDAKSI KETERANGAN SURAT */}
        <FormSection title="III. Format Redaksi Surat Keterangan Moyang" icon={FileText}>
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Sparkles className="h-4 w-4 text-amber-500" /> Pilihan Cepat Format Keterangan Status:
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => applyStatusTemplate('penduduk')} className="text-xs">
                Penduduk Desa Sampeldes
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyStatusTemplate('silsilah')} className="text-xs">
                Garis Keturunan / Moyang
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyStatusTemplate('beda_nama')} className="text-xs">
                Perbedaan Nama pada Dokumen
              </Button>
            </div>
          </div>

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="keteranganStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">
                    Keterangan Status Pokok (Redaksi Paragraf Pertama)
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Bahwa orang tersebut di atas adalah benar-benar penduduk Desa Sampeldes / (atau isi keterangan spesifik, misal: memiliki perbedaan nama/data pada dokumen... atau merupakan garis keturunan dari...)" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    Redaksi ini akan dicetak langsung pada paragraf pembuka keterangan surat.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="keteranganTambahan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">
                    Keterangan Tambahan Sesuai Keperluan (Opsional)
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Contoh: Yang bersangkutan telah meninggalkan desa sejak tahun 1980 / menerangkan hubungan keluarga/moyang..." {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    Diisi riwayat atau catatan keterangan tambahan jika diperlukan. Jika dikosongkan, paragraf ini tidak dicetak.
                  </FormDescription>
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
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 font-bold">
                    Keperluan Pengajuan Surat
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Pembuatan Akta Kelahiran di Kantor Disdukcapil" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    Dicetak pada kalimat penutup: <em>&quot;Demikian surat keterangan ini dibuat dengan sebenar-benarnya dalam keadaan sadar dan untuk dipergunakan sebagaimana mestinya (<strong>Keperluan</strong>).&quot;</em>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* IV. UNGGAH BERKAS LAMPIRAN */}
        <FormSection title="IV. Berkas Pendukung" icon={Paperclip}>
          <div className="md:col-span-2 text-xs text-slate-500">
            Unggah file scan/foto dokumen format JPG, PNG, atau PDF. Khusus admin, berkas lampiran bersifat opsional.
          </div>
          <GoogleFileUploader label="Foto KTP Pemohon" fieldName="ktp" onFileSelect={handleFileSelect} isRequired={!isAdmin} disabled={isSubmitting} />
          <GoogleFileUploader label="Foto Kartu Keluarga (KK)" fieldName="kk" onFileSelect={handleFileSelect} isRequired={false} disabled={isSubmitting} />
          <GoogleFileUploader label="Dokumen Pendukung Moyang / Silsilah" fieldName="dokumen_moyang" onFileSelect={handleFileSelect} isRequired={false} disabled={isSubmitting} />
          <GoogleFileUploader label="Surat Pengantar RT/RW (Bila Ada)" fieldName="pengantarRt" onFileSelect={handleFileSelect} isRequired={false} disabled={isSubmitting} />
        </FormSection>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold tracking-wide"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sedang Menyimpan...
              </>
            ) : (
              'Ajukan Surat Keterangan Moyang'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
