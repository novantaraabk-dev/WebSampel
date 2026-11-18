'use client';
import { phoneValidationSchema } from './form-helpers';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, FileCheck, Paperclip, User, Users, MapPin, DollarSign, Calendar } from 'lucide-react';

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
import { formatTanggalIndonesia, terbilangIndonesia } from '@/lib/opensid-surat-engine';

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
  // Pihak I (Penjual)
  sellerNik: z.string().length(16, 'NIK Penjual harus 16 digit'),
  sellerName: z.string().min(1, 'Nama Penjual wajib diisi'),
  sellerBirthPlace: z.string().min(1, 'Tempat lahir penjual wajib diisi'),
  sellerBirthDate: z.string().min(1, 'Tanggal lahir penjual wajib diisi'),
  sellerJob: z.string().min(1, 'Pekerjaan penjual wajib diisi'),
  sellerDesa: z.string().min(1, 'Desa penjual wajib diisi'),
  sellerRt: z.string().min(1, 'RT wajib diisi'),
  sellerRw: z.string().min(1, 'RW wajib diisi'),
  sellerKecamatan: z.string().min(1, 'Kecamatan penjual wajib diisi'),
  sellerKabupaten: z.string().min(1, 'Kabupaten penjual wajib diisi'),
  sellerAddress: z.string().optional(),

  // Pihak II (Pembeli)
  buyerNik: z.string().length(16, 'NIK Pembeli harus 16 digit'),
  buyerName: z.string().min(1, 'Nama Pembeli wajib diisi'),
  buyerBirthPlace: z.string().min(1, 'Tempat lahir pembeli wajib diisi'),
  buyerBirthDate: z.string().min(1, 'Tanggal lahir pembeli wajib diisi'),
  buyerGender: z.enum(['Laki-Laki', 'Perempuan'], {
    required_error: 'Jenis kelamin pembeli wajib dipilih',
  }),
  buyerJob: z.string().min(1, 'Pekerjaan pembeli wajib diisi'),
  buyerDesa: z.string().min(1, 'Desa pembeli wajib diisi'),
  buyerRt: z.string().min(1, 'RT pembeli wajib diisi'),
  buyerRw: z.string().min(1, 'RW pembeli wajib diisi'),
  buyerKecamatan: z.string().min(1, 'Kecamatan pembeli wajib diisi'),
  buyerKabupaten: z.string().min(1, 'Kabupaten pembeli wajib diisi'),
  buyerAddress: z.string().optional(),

  // Objek Tanah
  landDesa: z.string().min(1, 'Desa letak tanah wajib diisi'),
  landKecamatan: z.string().min(1, 'Kecamatan letak tanah wajib diisi'),
  landKabupaten: z.string().min(1, 'Kabupaten letak tanah wajib diisi'),
  landArea: z.string().min(1, 'Luas tanah wajib diisi'),
  landLength: z.string().min(1, 'Panjang tanah wajib diisi'),
  landWidth: z.string().min(1, 'Lebar tanah wajib diisi'),
  certificateType: z.string().min(1, 'Jenis alas hak wajib dipilih'),
  certificateNumber: z.string().min(1, 'Nomor sertifikat / alas hak wajib diisi'),
  boundaryNorth: z.string().min(1, 'Batas sebelah utara wajib diisi'),
  boundarySouth: z.string().min(1, 'Batas sebelah selatan wajib diisi'),
  boundaryEast: z.string().min(1, 'Batas sebelah timur wajib diisi'),
  boundaryWest: z.string().min(1, 'Batas sebelah barat wajib diisi'),

  // Ketentuan & Harga
  transactionPrice: z.string().min(1, 'Harga transaksi wajib diisi'),
  priceInWords: z.string().min(1, 'Harga terbilang wajib diisi'),
  costBearer: z.string().min(1, 'Tanggungan biaya wajib dipilih'),
  transactionDate: z.string().min(1, 'Tanggal transaksi kesepakatan wajib diisi'),

  // Saksi-Saksi
  witness1: z.string().min(1, 'Nama Saksi dari Pihak I wajib diisi'),
  witness2: z.string().min(1, 'Nama Saksi dari Pihak II wajib diisi'),

  whatsapp: phoneValidationSchema,
});

type FormValues = z.infer<typeof formSchema>;

export function JualBeliForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<{ [key: string]: File }>({});
  const [fileErrors, setFileErrors] = useState<{ [key: string]: string }>({});
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sellerNik: '',
      sellerName: '',
      sellerBirthPlace: '',
      sellerBirthDate: '',
      sellerJob: '',
      sellerDesa: 'Sampeldes',
      sellerRt: '001',
      sellerRw: '001',
      sellerKecamatan: 'Gandrungmangu',
      sellerKabupaten: 'Cilacap',
      sellerAddress: '',

      buyerNik: '',
      buyerName: '',
      buyerBirthPlace: '',
      buyerBirthDate: '',
      buyerGender: 'Laki-Laki',
      buyerJob: '',
      buyerDesa: 'Sampeldes',
      buyerRt: '001',
      buyerRw: '001',
      buyerKecamatan: 'Gandrungmangu',
      buyerKabupaten: 'Cilacap',
      buyerAddress: '',

      landDesa: 'Sampeldes',
      landKecamatan: 'Gandrungmangu',
      landKabupaten: 'Cilacap',
      landArea: '',
      landLength: '',
      landWidth: '',
      certificateType: 'Letter C',
      certificateNumber: '',
      boundaryNorth: '',
      boundarySouth: '',
      boundaryEast: '',
      boundaryWest: '',

      transactionPrice: '',
      priceInWords: '',
      costBearer: 'Pihak Kedua (Pembeli)',
      transactionDate: new Date().toISOString().split('T')[0],

      witness1: '',
      witness2: '',
      whatsapp: '',
    },
  });

  const sellerNikValue = form.watch('sellerNik');
  const buyerNikValue = form.watch('buyerNik');
  const transactionPriceValue = form.watch('transactionPrice');

  // Auto-hitung terbilang saat harga diketik
  useEffect(() => {
    if (transactionPriceValue) {
      const cleanDigits = transactionPriceValue.replace(/[^0-9]/g, '');
      if (cleanDigits && Number(cleanDigits) > 0) {
        const words = `${terbilangIndonesia(cleanDigits)} rupiah`;
        const currentWords = form.getValues('priceInWords');
        if (!currentWords || currentWords.trim() === '' || currentWords.includes('rupiah')) {
          form.setValue('priceInWords', words);
        }
      }
    }
  }, [transactionPriceValue, form]);

  // Autofill Penjual
  useEffect(() => {
    async function fetchSeller() {
      if (sellerNikValue && sellerNikValue.length === 16 && firestore) {
        try {
          const res = await getResidentByNik(firestore, sellerNikValue);
          if (res) {
            form.setValue('sellerName', res.fullName ? res.fullName.toUpperCase() : form.getValues('sellerName'));
            form.setValue('sellerBirthPlace', res.placeOfBirth || form.getValues('sellerBirthPlace'));
            form.setValue('sellerBirthDate', res.dateOfBirth ? formatDbDateToForm(res.dateOfBirth) : form.getValues('sellerBirthDate'));
            form.setValue('sellerJob', res.occupation || form.getValues('sellerJob'));
            form.setValue('sellerDesa', res.dusun || 'Sampeldes');
            form.setValue('sellerRt', res.rt || '001');
            form.setValue('sellerRw', res.rw || '001');
            const fullAddress = `${res.address || ''} RT ${res.rt || '00'}/RW ${res.rw || '00'} Dusun ${res.dusun || ''}, Desa Sampeldes`.trim();
            form.setValue('sellerAddress', fullAddress);
            if ((res as any).telepon) form.setValue('whatsapp', (res as any).telepon);
            toast({
              title: 'Data Penjual Ditemukan',
              description: `Data terisi otomatis untuk ${res.fullName}`,
            });
          }
        } catch {
          // ignore
        }
      }
    }
    fetchSeller();
  }, [sellerNikValue, firestore, form, toast]);

  // Autofill Pembeli
  useEffect(() => {
    async function fetchBuyer() {
      if (buyerNikValue && buyerNikValue.length === 16 && firestore) {
        try {
          const res = await getResidentByNik(firestore, buyerNikValue);
          if (res) {
            form.setValue('buyerName', res.fullName ? res.fullName.toUpperCase() : form.getValues('buyerName'));
            form.setValue('buyerBirthPlace', res.placeOfBirth || form.getValues('buyerBirthPlace'));
            form.setValue('buyerBirthDate', res.dateOfBirth ? formatDbDateToForm(res.dateOfBirth) : form.getValues('buyerBirthDate'));
            if (res.gender) {
              const gNorm = res.gender.toLowerCase().includes('perempuan') || res.gender.toLowerCase() === 'p' ? 'Perempuan' : 'Laki-Laki';
              form.setValue('buyerGender', gNorm as any);
            }
            form.setValue('buyerJob', res.occupation || form.getValues('buyerJob'));
            form.setValue('buyerDesa', res.dusun || 'Sampeldes');
            form.setValue('buyerRt', res.rt || '001');
            form.setValue('buyerRw', res.rw || '001');
            const fullAddress = `${res.address || ''} RT ${res.rt || '00'}/RW ${res.rw || '00'} Dusun ${res.dusun || ''}, Desa Sampeldes`.trim();
            form.setValue('buyerAddress', fullAddress);
            toast({
              title: 'Data Pembeli Ditemukan',
              description: `Data terisi otomatis untuk ${res.fullName}`,
            });
          }
        } catch {
          // ignore
        }
      }
    }
    fetchBuyer();
  }, [buyerNikValue, firestore, form, toast]);

  const handleFileSelect = (file: File, fieldName: string) => {
    setFiles((prev) => ({ ...prev, [fieldName]: file }));
    setFileErrors((prev) => ({ ...prev, [fieldName]: '' }));
  };

  const onSubmit = async (values: FormValues) => {
    if (!firestore) return;

    if (!isAdmin) {
      const newFileErrors: { [key: string]: string } = {};
      if (!files['sellerKtp']) newFileErrors['sellerKtp'] = 'KTP Penjual wajib diunggah.';
      if (!files['buyerKtp']) newFileErrors['buyerKtp'] = 'KTP Pembeli wajib diunggah.';

      if (Object.keys(newFileErrors).length > 0) {
        setFileErrors(newFileErrors);
        toast({
          title: 'Berkas Kurang Lengkap',
          description: 'Mohon lengkapi KTP kedua belah pihak.',
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
            targetFileName: `${fieldName}_${values.sellerNik}`,
            fieldName,
          };
        })
      );

      const numVal = Number(String(values.transactionPrice).replace(/[^0-9]/g, '')) || 0;
      const formattedPrice = numVal > 0 ? `${numVal.toLocaleString('id-ID')},-` : values.transactionPrice;
      const certificateFull = values.certificateNumber.toLowerCase().includes(values.certificateType.toLowerCase())
        ? values.certificateNumber
        : `${values.certificateType} No. ${values.certificateNumber}`;

      await addSubmission(firestore, {
        ticketNumber: generatedTicket,
        requesterName: values.sellerName,
        nik: values.sellerNik,
        letterType: 'Surat Keterangan Jual Beli',
        formData: {
          ...values,
          // Pihak I (Penjual)
          nama_penjual: values.sellerName,
          nik_penjual: values.sellerNik,
          tempatlahir_penjual: values.sellerBirthPlace,
          tanggallahir_penjual: values.sellerBirthDate,
          ttl_penjual: `${values.sellerBirthPlace}, ${formatTanggalIndonesia(values.sellerBirthDate)}`,
          pekerjaan_penjual: values.sellerJob,
          desa_penjual: values.sellerDesa,
          rt_penjual: values.sellerRt,
          rw_penjual: values.sellerRw,
          kecamatan_penjual: values.sellerKecamatan,
          kabupaten_penjual: values.sellerKabupaten,

          // Pihak II (Pembeli)
          nama_pembeli: values.buyerName,
          nik_pembeli: values.buyerNik,
          tempatlahir_pembeli: values.buyerBirthPlace,
          tanggallahir_pembeli: formatTanggalIndonesia(values.buyerBirthDate),
          ttl_pembeli: `${values.buyerBirthPlace}, ${formatTanggalIndonesia(values.buyerBirthDate)}`,
          jenis_kelamin_pembeli: values.buyerGender,
          pekerjaan_pembeli: values.buyerJob,
          desa_pembeli: values.buyerDesa,
          rt_pembeli: values.buyerRt,
          rw_pembeli: values.buyerRw,
          kecamatan_pembeli: values.buyerKecamatan,
          kabupaten_pembeli: values.buyerKabupaten,
          alamat_pembeli: `Desa ${values.buyerDesa}, RT ${values.buyerRt} / RW ${values.buyerRw}, Kecamatan ${values.buyerKecamatan}, Kabupaten ${values.buyerKabupaten}`,

          // Objek Tanah
          desa_tanah: values.landDesa,
          kecamatan_tanah: values.landKecamatan,
          kabupaten_tanah: values.landKabupaten,
          luas_tanah: values.landArea,
          panjang_tanah: values.landLength,
          lebar_tanah: values.landWidth,
          jenis_alas_hak: values.certificateType,
          nomor_alas_hak: values.certificateNumber,
          alas_hak_lengkap: certificateFull,
          batas_utara: values.boundaryNorth,
          batas_selatan: values.boundarySouth,
          batas_timur: values.boundaryEast,
          batas_barat: values.boundaryWest,

          // Harga & Biaya
          harga_transaksi: formattedPrice,
          harga_terbilang: values.priceInWords,
          biaya_ditanggung_oleh: values.costBearer,
          tanggal_transaksi: values.transactionDate,

          // Saksi-Saksi
          saksi_pihak_1: values.witness1,
          saksi_pihak_2: values.witness2,

          // Backward compatibility fields
          form_jenis_barang: 'Sebidang Tanah Pekarangan',
          jenis_barang: 'Sebidang Tanah Pekarangan',
          form_rincian_barang: `${certificateFull} Luas ± ${values.landArea} m² di Desa ${values.landDesa}`,
          rincian_barang: `${certificateFull} Luas ± ${values.landArea} m² di Desa ${values.landDesa}`,
          form_keterangan: `Pengesahan Bukti Transaksi Jual Beli Tanah di Pemerintah Desa Sampeldes`,
          keterangan: `Pengesahan Bukti Transaksi Jual Beli Tanah di Pemerintah Desa Sampeldes`,
          form_nama_ketua_adat: '...........................................',

          openSidPelakuBagian: {
            pembeli: {
              nama: values.buyerName,
              nik: values.buyerNik,
              tempat_lahir: values.buyerBirthPlace,
              tanggal_lahir: formatTanggalIndonesia(values.buyerBirthDate),
              jenis_kelamin: values.buyerGender,
              pekerjaan: values.buyerJob,
              alamat: `Desa ${values.buyerDesa}, RT ${values.buyerRt} / RW ${values.buyerRw}, Kecamatan ${values.buyerKecamatan}, Kabupaten ${values.buyerKabupaten}`,
            },
          },
        },
        filesToUpload: filesPayload,
      });

      setTicketNumber(generatedTicket);
      toast({
        title: 'Pengajuan Berhasil Disimpan',
        description: `Nomor Tiket Anda: ${generatedTicket}. Dokumen Surat Keterangan Jual Beli siap dicetak.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Gagal Mengajukan Surat',
        description: 'Terjadi kesalahan sistem saat memproses berkas. Silakan coba lagi.',
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
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-700">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Surat Keterangan Jual Beli Tanah</h2>
          <p className="text-sm text-slate-500">
            Formulir kesepakatan dan pengesahan resmi transaksi jual beli tanah di Pemerintah Desa Sampeldes
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 1. Pihak I (Penjual) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" /> I. Pihak Pertama (Penjual)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sellerNik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIK Penjual *</FormLabel>
                    <FormControl>
                      <Input placeholder="3301..." maxLength={16} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap Penjual *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama penjual" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellerBirthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempat Lahir *</FormLabel>
                    <FormControl>
                      <Input placeholder="Cilacap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellerBirthDate"
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
                name="sellerJob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pekerjaan *</FormLabel>
                    <FormControl>
                      <Input placeholder="Petani / Wiraswasta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="sellerRt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RT *</FormLabel>
                      <FormControl>
                        <Input placeholder="001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sellerRw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RW *</FormLabel>
                      <FormControl>
                        <Input placeholder="001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="sellerDesa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desa Penjual *</FormLabel>
                    <FormControl>
                      <Input placeholder="Sampeldes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellerKecamatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kecamatan Penjual *</FormLabel>
                    <FormControl>
                      <Input placeholder="Gandrungmangu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellerKabupaten"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Kabupaten Penjual *</FormLabel>
                    <FormControl>
                      <Input placeholder="Cilacap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 2. Pihak II (Pembeli) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" /> II. Pihak Kedua (Pembeli)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="buyerNik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIK Pembeli *</FormLabel>
                    <FormControl>
                      <Input placeholder="3301..." maxLength={16} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buyerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap Pembeli *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama pembeli" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buyerBirthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempat Lahir *</FormLabel>
                    <FormControl>
                      <Input placeholder="Cilacap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buyerBirthDate"
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
                name="buyerGender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kelamin Pembeli *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                name="buyerJob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pekerjaan *</FormLabel>
                    <FormControl>
                      <Input placeholder="Wiraswasta / Karyawan Swasta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="buyerRt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RT *</FormLabel>
                      <FormControl>
                        <Input placeholder="001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="buyerRw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RW *</FormLabel>
                      <FormControl>
                        <Input placeholder="001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="buyerDesa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desa Pembeli *</FormLabel>
                    <FormControl>
                      <Input placeholder="Sampeldes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buyerKecamatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kecamatan Pembeli *</FormLabel>
                    <FormControl>
                      <Input placeholder="Gandrungmangu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buyerKabupaten"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Kabupaten Pembeli *</FormLabel>
                    <FormControl>
                      <Input placeholder="Cilacap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 3. Rincian Objek Tanah */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" /> III. Rincian Objek Tanah
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="landDesa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desa Letak Tanah *</FormLabel>
                    <FormControl>
                      <Input placeholder="Sampeldes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="landKecamatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kecamatan Letak Tanah *</FormLabel>
                    <FormControl>
                      <Input placeholder="Gandrungmangu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="landKabupaten"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kabupaten Letak Tanah *</FormLabel>
                    <FormControl>
                      <Input placeholder="Cilacap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="landArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Luas Tanah (m²) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: 350" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="landLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Panjang Tanah (meter) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: 25" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="landWidth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lebar Tanah (meter) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: 14" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="certificateType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Sertifikat / Alas Hak *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Jenis Alas Hak" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Letter C">Letter C</SelectItem>
                        <SelectItem value="SHM (Sertifikat Hak Milik)">SHM (Sertifikat Hak Milik)</SelectItem>
                        <SelectItem value="Girik">Girik</SelectItem>
                        <SelectItem value="Petok D">Petok D</SelectItem>
                        <SelectItem value="Sporadik">Sporadik</SelectItem>
                        <SelectItem value="Akta Jual Beli">Akta Jual Beli</SelectItem>
                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="certificateNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Sertifikat / Alas Hak *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: 142/Blok Krajan / 33.01..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Batas-Batas Tanah */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">Batas-Batas Tanah</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="boundaryNorth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Sebelah Utara Berbatasan Dengan *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Tanah Milik Bpk. Amin / Jalan Desa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="boundarySouth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Sebelah Selatan Berbatasan Dengan *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Tanah Milik Ibu Siti / Saluran Air" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="boundaryEast"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Sebelah Timur Berbatasan Dengan *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Jalan Lingkungan / Tanah Kas Desa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="boundaryWest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Sebelah Barat Berbatasan Dengan *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Tanah Milik Bpk. Rohman" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* 4. Ketentuan, Harga & Biaya */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> IV. Ketentuan, Harga & Biaya
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transactionPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Jual / Nilai Transaksi (Rp) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: 85.000.000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Transaksi Kesepakatan *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priceInWords"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Harga Terbilang (Huruf) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: delapan puluh lima juta rupiah" {...field} />
                    </FormControl>
                    <p className="text-[11px] text-slate-500">
                      Otomatis terisi saat angka harga diketik, dapat disesuaikan jika perlu.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="costBearer"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Segala Biaya Pembuatan Surat & Balik Nama Ditanggung Oleh *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Pihak Penanggung Biaya" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pihak Kedua (Pembeli)">Pihak Kedua (Pembeli)</SelectItem>
                        <SelectItem value="Pihak Pertama (Penjual)">Pihak Pertama (Penjual)</SelectItem>
                        <SelectItem value="Pihak Pertama dan Pihak Kedua secara bersama-sama">Pihak Pertama dan Pihak Kedua secara bersama-sama</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 5. Saksi-Saksi */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" /> V. Saksi-Saksi Transaksi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="witness1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saksi dari Pihak I (Penjual) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama saksi dari pihak penjual" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="witness2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saksi dari Pihak II (Pembeli) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama saksi dari pihak pembeli" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 6. Kontak & Berkas Persyaratan */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" /> VI. Kontak & Berkas Persyaratan
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
                  label="Scan / Foto KTP Penjual (Pihak I)"
                  fieldName="sellerKtp"
                  onFileSelect={handleFileSelect}
                  isRequired={!isAdmin}
                />
                {fileErrors.sellerKtp && (
                  <p className="text-xs text-destructive mt-1">{fileErrors.sellerKtp}</p>
                )}
              </div>
              <div>
                <GoogleFileUploader
                  label="Scan / Foto KTP Pembeli (Pihak II)"
                  fieldName="buyerKtp"
                  onFileSelect={handleFileSelect}
                  isRequired={!isAdmin}
                />
                {fileErrors.buyerKtp && (
                  <p className="text-xs text-destructive mt-1">{fileErrors.buyerKtp}</p>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses Permohonan Surat Jual Beli...
              </>
            ) : (
              'Kirim Permohonan Surat Keterangan Jual Beli Tanah'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
