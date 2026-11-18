'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, formatFullDate, formatDateIndo, formatGender } from './print-layout';

export function IjinKeramaianPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT PENGANTAR REKOMENDASI IZIN KERAMAIAN
    // ========================================================
    {
      showKop: true,
      title: 'SURAT PENGANTAR IZIN KERAMAIAN',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-2.5 text-justify text-[11pt] leading-normal">
          <div className="text-right text-[10.5pt] mb-1">
            <p>Kepada Yth.</p>
            <p className="font-semibold">Kapolsek Gandrungmangu</p>
            <p>di - <span className="underline">Gandrungmangu</span></p>
          </div>

          <p className="leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Penanggung Jawab" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Jenis Kelamin" value={formatGender(formData.gender)} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.job || 'Wiraswasta'} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={`${formData.address}, RT ${formData.rt || '00'} / RW ${formData.rw || '00'}, Desa Sampeldes`} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Orang tersebut di atas bermaksud menyelenggarakan kegiatan keramaian masyarakat dengan rincian sebagai berikut:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama / Jenis Acara" value={formData.eventName || 'Hajatan Pernikahan / Khitanan'} />
              <DataRow compact="tight" label="Jenis Hiburan" value={formData.eventEntertainment || 'Musik Akustik / Orkes Melayu'} />
              <DataRow compact="tight" label="Waktu Pelaksanaan" value={`${formatFullDate(formData.eventDate)} s.d. ${formatFullDate(formData.eventEndDate || formData.eventDate)}`} />
              <DataRow compact="tight" label="Perkiraan Jumlah Undangan" value={formData.guestCount ? `${formData.guestCount} Orang` : '± 300 Orang'} />
              <DataRow compact="tight" label="Lokasi / Tempat Acara" value={formData.eventLocation || formData.address} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Pemerintah Desa Sampeldes pada prinsipnya <strong>TIDAK BERKEBERATAN</strong> dan memberikan rekomendasi izin keramaian tersebut sepanjang yang bersangkutan mematuhi ketentuan perundang-undangan dan menjaga ketertiban umum.
          </p>

          <p className="mt-1 leading-relaxed">
            Demikian surat pengantar rekomendasi ini dibuat untuk dapat dipergunakan sebagai persyaratan penerbitan Surat Izin Keramaian oleh pihak Kepolisian.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 2,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN SURAT PERNYATAAN KESANGGUPAN KAMTIBMAS BERMETERAI
    // ========================================================
    {
      showKop: false,
      title: 'SURAT PERNYATAAN KESANGGUPAN MENJAGA KETERTIBAN',
      subtitle: 'LAMPIRAN PERMOHONAN IZIN KERAMAIAN MASYARAKAT',
      content: (
        <div className="space-y-3 text-justify text-[10.5pt] leading-normal">
          <p className="leading-relaxed">
            Yang bertanda tangan di bawah ini penanggung jawab kegiatan:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Penanggung Jawab" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.job || 'Wiraswasta'} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={`${formData.address}, Desa Sampeldes`} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Sehubungan dengan rencana pelaksanaan acara <strong>{formData.eventName || 'Hajatan'}</strong> pada tanggal <strong>{formatFullDate(formData.eventDate)}</strong>, dengan ini menyatakan dengan sesungguhnya bahwa saya:
          </p>

          <ol className="list-decimal pl-5 space-y-1 text-[10pt] leading-relaxed">
            <li>
              Sanggup menjaga keamanan, ketertiban umum, dan ketentraman lingkungan selama kegiatan berlangsung.
            </li>
            <li>
              Tidak akan menyediakan, memperjualbelikan, atau mengizinkan peredaran minuman keras (beralkohol), obat-obatan terlarang, narkotika, dan perjudian dalam bentuk apapun di lokasi acara.
            </li>
            <li>
              Sanggup mematuhi batas waktu pelaksanaan hiburan musik sesuai dengan izin yang ditetapkan oleh pihak Kepolisian (maksimal pukul 23.00 WIB).
            </li>
            <li>
              Bertanggung jawab penuh secara moral maupun hukum (pidana dan perdata) apabila timbul gangguan kamtibmas, kerusuhan, atau kerusakan fasilitas umum yang diakibatkan oleh kegiatan ini.
            </li>
          </ol>

          <p className="mt-1 leading-relaxed text-[10pt]">
            Demikian surat pernyataan kesanggupan ini saya buat dengan sadar dan penuh rasa tanggung jawab di atas kertas bermeterai cukup tanpa ada paksaan dari pihak manapun.
          </p>

          {/* Area Tanda Tangan */}
          <div className="pt-4 grid grid-cols-2 text-center text-[9.5pt]">
            <div className="space-y-16">
              <p>Mengetahui,</p>
              <p className="font-semibold">Kepala Desa Sampeldes</p>
              <div className="h-10" />
              <p className="font-bold underline">TUKIMAN</p>
              <p className="text-[8pt] text-slate-500"></p>
            </div>

            <div className="space-y-4">
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
              <div className="border border-dashed border-slate-400 py-3 px-2 w-28 mx-auto text-[7.5pt] text-slate-400 uppercase">
                Meterai<br />Rp 10.000
              </div>
              <p className="font-bold underline uppercase">{formData.name}</p>
            </div>
          </div>
        </div>
      ),
      pageNumber: 2,
      totalPages: 2,
      showSignatures: false,
    },
  ];

  return <PrintLayout submission={submission} fontSize="11pt" pages={pages} />;
}

