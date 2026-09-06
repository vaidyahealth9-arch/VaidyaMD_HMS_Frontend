import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import QueryProvider from '@/components/providers/QueryProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'VaidyaMD HMS — Hospital Management System',
  description: 'VaidyaMD Health — Comprehensive HMS for Fertility & Wellness Clinics. Powered by AI-driven clinical workflows.',
  keywords: ['hospital management', 'IVF', 'fertility clinic', 'EMR', 'HMS'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-slate-50 text-slate-800 antialiased">
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

