/**
 * @fileOverview Utilitas komunikasi Google Apps Script untuk Sisi Client.
 * File ini dirancang khusus untuk kompatibilitas Static Export & CORS.
 */

import { GOOGLE_CONFIG } from '@/lib/google-config';

/**
 * Memanggil Google Apps Script menggunakan metode "Simple Request".
 * Kita menggunakan header 'text/plain' untuk melewati pengecekan preflight CORS 
 * yang sering menyebabkan error "Failed to fetch" di lingkungan browser ketat.
 */
export async function callAppsScript(payload: any, customUrl?: string) {
  try {
    const targetUrl = (customUrl || '').trim() || GOOGLE_CONFIG.appsScriptUrl;
    const response = await fetch(targetUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        // Menggunakan text/plain agar dianggap sebagai Simple Request oleh browser (Menghindari Preflight CORS)
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result && !result.success && result.message && !result.error) {
      result.error = result.message;
    }
    return result;
  } catch (error: any) {
    console.warn("Apps Script Communication Warning:", error?.message || error);
    
    // Memberikan pesan error yang sangat detail untuk membantu pengguna melakukan debug
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      return { 
        success: false, 
        error: "Koneksi ke Google diblokir oleh Browser (CORS). Pastikan Apps Script di-deploy dengan akses 'Anyone' (Siapa Saja) dan Anda sudah menjalankan fungsi forceGrantAllPermissions di Editor Skrip." 
      };
    }
    
    return { success: false, error: error.message || "Gagal menghubungi server Google." };
  }
}
