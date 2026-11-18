import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Daftar rute khusus panel administrasi dan sistem internal desa
const ADMIN_ROUTE_PREFIXES = [
  '/admin',
  '/manajemen',
  '/absensi',
  '/absensi-admin',
  '/login',
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Lewati file internal Next.js, API route, favicon, serta asset statis
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') || // ekstensi gambar, css, js, font (.png, .jpg, .ico, dll)
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // 2. Dapatkan hostname request (tanpa port)
  const hostHeader = request.headers.get('host') || '';
  const hostname = hostHeader.split(':')[0].toLowerCase();

  // 3. Domain konfigurasi dari environment variable (dengan fallback)
  const publicDomain = (
    process.env.NEXT_PUBLIC_SITE_DOMAIN || 'sampeldes.gandrungmangu.id'
  ).toLowerCase();
  const adminDomain = (
    process.env.NEXT_PUBLIC_ADMIN_DOMAIN || 'adminsampeldes.gandrungmangu.id'
  ).toLowerCase();

  // Ambil protokol yang sesuai (https di production, atau http di dev)
  const protocol = request.headers.get('x-forwarded-proto') || 'https';

  // Periksa apakah path saat ini tergolong rute panel admin / internal
  const isAdminRoute = ADMIN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // =========================================================================
  // KASUS A: Pengguna mengakses DOMAIN ADMIN (misal: adminsampeldes.gandrungmangu.id)
  // =========================================================================
  if (hostname === adminDomain) {
    // 1. Jika membuka root domain admin (/), arahkan langsung ke /login
    if (pathname === '/') {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Jika mencoba membuka halaman publik di domain admin (misal: /profil-desa, /BeritaDesa),
    //    arahkan kembali ke domain publik utama agar domain admin bersih khusus panel
    if (!isAdminRoute) {
      const targetPublicUrl = new URL(
        `${protocol}://${publicDomain}${pathname}${search}`
      );
      return NextResponse.redirect(targetPublicUrl);
    }

    // Rute internal/admin diizinkan berjalan normal di domain admin
    return NextResponse.next();
  }

  // =========================================================================
  // KASUS B: Pengguna mengakses DOMAIN PUBLIK (misal: sampeldes.gandrungmangu.id)
  // =========================================================================
  if (hostname === publicDomain) {
    // Jika mencoba membuka paksa rute admin di domain publik, redirect ke domain admin
    if (isAdminRoute) {
      const targetAdminUrl = new URL(
        `${protocol}://${adminDomain}${pathname}${search}`
      );
      return NextResponse.redirect(targetAdminUrl);
    }

    // Rute publik diizinkan berjalan normal di domain publik
    return NextResponse.next();
  }

  // =========================================================================
  // KASUS C: Localhost / Development / Preview Domains
  // =========================================================================
  // Biarkan semua rute dapat diakses bebas saat pengujian lokal
  return NextResponse.next();
}

// Konfigurasi Matcher Next.js
export const config = {
  matcher: [
    /*
     * Jalankan middleware pada semua request kecuali:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
