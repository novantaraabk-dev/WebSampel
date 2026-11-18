import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Mengonversi tanggal dari database (MM/DD/YY atau format lain) 
 * ke format pengisian formulir (DD-MM-YYYY).
 */
export function formatDbDateToForm(dateStr: string | undefined): string {
  if (!dateStr) return '';
  
  const clean = dateStr.trim();
  
  // Jika format menggunakan / (biasanya Excel/DB format MM/DD/YY)
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      // Sesuai permintaan: Database MM/DD/YY -> Form DD-MM-YYYY
      let mm = parts[0].padStart(2, '0');
      let dd = parts[1].padStart(2, '0');
      let yy = parts[2];
      
      let yyyy = yy;
      if (yy.length === 2) {
        const yearNum = parseInt(yy);
        // Ambang batas 40 (1941-2040)
        yyyy = (yearNum > 40 ? '19' : '20') + yy;
      }
      return `${dd}-${mm}-${yyyy}`;
    }
  }

  return clean;
}

export function formatDateToDDMMYYYY(dateStr?: string | null, nik?: string): string {
  if (!dateStr && !nik) return '-';
  const str = String(dateStr || '').trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  const yyyyMmDd = formatDbDateToForm(str);
  if (yyyyMmDd && /^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) {
    const [y, m, d] = yyyyMmDd.split('-');
    return `${d}/${m}/${y}`;
  }

  if (nik && nik.length === 16) {
    const clean = nik.replace(/\D/g, '');
    if (clean.length === 16) {
      const dayRaw = parseInt(clean.substring(6, 8), 10);
      const month = parseInt(clean.substring(8, 10), 10);
      const yearShort = parseInt(clean.substring(10, 12), 10);
      if (!isNaN(dayRaw) && !isNaN(month) && !isNaN(yearShort)) {
        const day = dayRaw > 40 ? dayRaw - 40 : dayRaw;
        const currentYearShort = new Date().getFullYear() % 100;
        const year = yearShort > (currentYearShort + 2) ? 1900 + yearShort : 2000 + yearShort;
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        }
      }
    }
  }

  return str || '-';
}

/**
 * Mendapatkan URL situs publik utama untuk navigasi antar-domain dari panel admin/login.
 * Menghindari loop redirect ketika berada di domain admin (adminsampeldes.gandrungmangu.id)
 * dan mengarahkan langsung ke https://sampeldes.gandrungmangu.id/
 */
export function getPublicSiteUrl(path: string = '/'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const publicDomain = (
    process.env.NEXT_PUBLIC_SITE_DOMAIN || 'sampeldes.gandrungmangu.id'
  ).toLowerCase();

  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname.toLowerCase();
    // Di localhost atau IP dev, tetap gunakan path relatif agar dev server lokal tetap nyaman
    if (
      currentHost === 'localhost' ||
      currentHost === '127.0.0.1' ||
      currentHost.endsWith('.local')
    ) {
      return cleanPath;
    }
    const protocol = window.location.protocol;
    return `${protocol}//${publicDomain}${cleanPath}`;
  }

  return `https://${publicDomain}${cleanPath}`;
}
