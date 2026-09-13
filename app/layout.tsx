import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import QueryProvider from '@/components/providers/QueryProvider';
import { TooltipProvider } from '@/shared/ui/tooltip';
import ErrorBoundary from '@/components/common/ErrorBoundary';

/** Self-hosted Inter — zero CDN round-trip, preloaded */
const inter = localFont({
  src: [
    { path: '../public/fonts/Inter-Regular.woff2',  weight: '400', style: 'normal' },
    { path: '../public/fonts/Inter-Medium.woff2',   weight: '500', style: 'normal' },
    { path: '../public/fonts/Inter-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/Inter-Bold.woff2',     weight: '700', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

/** Self-hosted Instrument Serif — used only on printable documents */
const instrumentSerif = localFont({
  src: [
    { path: '../public/fonts/InstrumentSerif-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/InstrumentSerif-Italic.ttf',  weight: '400', style: 'italic' },
  ],
  variable: '--font-instrument-serif',
  display: 'swap',
  preload: false, // Not needed for first paint
});

export const metadata: Metadata = {
  title: 'VaidyaMD HMS — Fertility & Hospital Management System',
  description:
    'VaidyaMD Health — Comprehensive HMS for Fertility & IVF Clinics. Clinical workflows for OPD, IPD, Embryology, LIMS, Pharmacy & Billing.',
  keywords: ['hospital management', 'IVF', 'fertility clinic', 'EMR', 'HMS', 'ART'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body className="antialiased" style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>
        <ErrorBoundary>
          <QueryProvider>
            <TooltipProvider>
              <AuthProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </AuthProvider>
            </TooltipProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
