'use client';

import React, { useState, useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import PrintableReportHeader, { PrintableReportHeaderProps } from './PrintableReportHeader';
import PrintableReportFooter, { PrintableReportFooterProps } from './PrintableReportFooter';

export interface PrintableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode | ((props: { hideHeader: boolean }) => React.ReactNode);
  defaultIncludeHeader?: boolean;
  maxWidth?: string;
  onPrint?: () => void;
  headerProps?: PrintableReportHeaderProps;
  footerProps?: PrintableReportFooterProps;
  showPrePrintedToggle?: boolean;
}

export default function PrintableModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  defaultIncludeHeader = true,
  maxWidth = 'max-w-4xl',
  onPrint,
  headerProps,
  footerProps,
  showPrePrintedToggle = true,
}: PrintableModalProps) {
  const [includeHeader, setIncludeHeader] = useState(defaultIncludeHeader);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-start pt-16 sm:pt-20 pb-8 px-4 overflow-y-auto print:p-0 print:static print:bg-transparent print:overflow-visible animate-in fade-in duration-150"
      style={{ background: 'rgba(0,0,0,0.65)' }}
    >
      <div
        className={`bg-white w-full ${maxWidth} shadow-2xl overflow-hidden flex flex-col my-auto sm:my-0 rounded-xl border border-slate-200 print:shadow-none print:rounded-none print:m-0 print:max-w-full print:border-none print:bg-transparent`}
      >
        {/* Preview Top Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 gap-2 print:hidden bg-slate-900 text-white flex-shrink-0">
          <div>
            <p className="text-sm font-semibold">{title}</p>
            {subtitle && <p className="text-xs opacity-60 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            {/* Header / Pre-printed Pad Toggle */}
            {showPrePrintedToggle && (
              <div className="flex items-center bg-slate-800 p-0.5 rounded-md border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setIncludeHeader(true)}
                  className={`px-2.5 py-1 rounded transition-colors font-medium ${
                    includeHeader
                      ? 'bg-[rgb(var(--clr-primary))] text-white font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  With Header
                </button>
                <button
                  type="button"
                  onClick={() => setIncludeHeader(false)}
                  className={`px-2.5 py-1 rounded transition-colors font-medium ${
                    !includeHeader
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Use for pre-printed letterhead pads"
                >
                  Pre-printed Pad
                </button>
              </div>
            )}

            {/* Print Action Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-opacity hover:opacity-90 shadow-sm bg-[rgb(var(--clr-primary))] text-white"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (A4)</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 opacity-60 hover:opacity-100 transition-opacity"
              title="Close Preview (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          className="p-6 sm:p-8 space-y-6 printable-document print:p-6 text-slate-900 text-xs"
          style={{ fontFamily: 'Inter, Arial, sans-serif' }}
        >
          {headerProps && (
            <PrintableReportHeader
              {...headerProps}
              hideHospitalHeader={!includeHeader}
            />
          )}

          {typeof children === 'function'
            ? children({ hideHeader: !includeHeader })
            : children}

          {footerProps && <PrintableReportFooter {...footerProps} />}
        </div>
      </div>
    </div>
  );
}
