/**
 * @fileOverview Konfigurasi terpusat untuk integrasi layanan Google.
 */

interface GoogleConfig {
  /**
   * URL hasil deploy Google Apps Script yang berfungsi sebagai backend.
   */
  appsScriptUrl: string;

  /**
   * ID Kalender Google yang akan digunakan untuk manajemen agenda.
   * Menggunakan 'primary' adalah opsi paling aman untuk merujuk ke kalender utama.
   */
  calendarId: string;

  /**
   * ID folder "parent" di Google Drive tempat laporan-laporan baru akan disimpan.
   */
  parentFolderId: string;
}

export const GOOGLE_CONFIG: GoogleConfig = {
  // URL Deployment sesuai parameter backend user
  appsScriptUrl: process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzF7371GbnkBJSHDmONo5yBHYZPcRaSfZh55xJyPMukBY4TVapdrWTA62eAYm8K9Fla/exec",
  calendarId: "primary", // Diubah ke 'primary' untuk mencegah error 'Not Found'
  parentFolderId: process.env.NEXT_PUBLIC_GDRIVE_FOLDER_ID || "1olavKLr2dU_ecQ_DiZPLxgiZH7oEzVTr",
};
