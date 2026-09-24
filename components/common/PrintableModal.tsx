'use client';

import React, { useState, useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import PrintableReportHeader, { PrintableReportHeaderProps } from './PrintableReportHeader';
import PrintableReportFooter, { PrintableReportFooterProps } from './PrintableReportFooter';
import A4Sheet from './A4Sheet';

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

  const renderedChildren =
    typeof children === 'function'
      ? children({ hideHeader: !includeHeader })
      : children;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/85 backdrop-blur-xs overflow-hidden print:static print:bg-transparent print:overflow-visible print:p-0 print:m-0 animate-in fade-in duration-150">
      {/* Top Preview Toolbar - Fixed at top on screen */}
      <header className="flex items-center justify-between px-6 py-2.5 shrink-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-lg print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight">{title}</h3>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              A4 Sheet Preview
            </span>
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {/* Header / Pre-printed Pad Toggle */}
          {showPrePrintedToggle && (
            <div className="flex items-center bg-slate-800/90 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setIncludeHeader(true)}
                className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                  includeHeader
                    ? 'bg-[rgb(var(--clr-primary))] text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                With Header
              </button>
              <button
                type="button"
                onClick={() => setIncludeHeader(false)}
                className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                  !includeHeader
                    ? 'bg-amber-600 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Use when printing on pre-printed hospital stationery"
              >
                Pre-printed Pad
              </button>
            </div>
          )}

          {/* Print Action Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md bg-[rgb(var(--clr-primary))] hover:brightness-110 active:scale-95 text-white cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print (A4)</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Preview (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Document Canvas — Displays stacked A4 paper cards (Google Docs / Word style) */}
      <main
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center gap-8 print:p-0 print:m-0 print:gap-0 print:overflow-visible print:block"
      >
        {/* If headerProps or footerProps were passed directly to PrintableModal */}
        {headerProps || footerProps ? (
          <A4Sheet
            header={
              headerProps ? (
                <PrintableReportHeader
                  {...headerProps}
                  hideHospitalHeader={!includeHeader}
                />
              ) : undefined
            }
            footer={
              footerProps ? (
                <PrintableReportFooter
                  {...footerProps}
                  hideHospitalFooter={!includeHeader}
                />
              ) : undefined
            }
          >
            {renderedChildren}
          </A4Sheet>
        ) : (
          renderedChildren
        )}
      </main>
    </div>
  );
}
