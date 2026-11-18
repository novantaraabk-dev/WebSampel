import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase';
import { FaviconManager } from '@/components/favicon-manager';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Plus_Jakarta_Sans, Fraunces, Oswald } from 'next/font/google';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const display = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-display',
});

const condensed = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-condensed',
});

export const metadata: Metadata = {
  title: 'PELAYANAN DESA SAMPELDES',
  description: 'Aplikasi Pelayanan Publik Desa Sampeldes',
  verification: {
    google: '1MaQZBpo4f5eZPxpWxUHPdJqc-2zgMaRurPOuMv5DdM',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="1MaQZBpo4f5eZPxpWxUHPdJqc-2zgMaRurPOuMv5DdM" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedTheme = localStorage.getItem('sampeldes_theme');
                if (savedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${sans.variable} ${display.variable} ${condensed.variable} font-sans antialiased relative min-h-screen overflow-x-hidden`} suppressHydrationWarning>
        <ThemeProvider>
          <FirebaseClientProvider>
            <FaviconManager />
            {children}
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
