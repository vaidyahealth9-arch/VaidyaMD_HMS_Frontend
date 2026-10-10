'use client';

import React from 'react';
import { resolveLogoUrl } from './PrintableReportHeader';
import { useAuth } from '@/contexts/AuthContext';

export interface A4SheetProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  watermarkUrl?: string;
  watermarkOpacity?: number;
  className?: string;
  pageSize?: 'a4' | 'a5';
}

/**
 * A4Sheet — Self-contained authentic A4 / A5 page component with strict flex layout.
 * • Dimensions: 210mm x 297mm (A4 portrait), 297mm x 210mm (A4 landscape), or 148mm x 210mm (A5) with paper drop-shadow.
 * • Strict flexbox: Header at top (shrink-0), Content in middle with flex-1, Footer pinned at bottom (mt-auto).
 * • Zero margin @page enables full-bleed stripes touching paper edges.
 */
export default function A4Sheet({
  children,
  header,
  footer,
  watermarkUrl,
  watermarkOpacity,
  className = '',
  pageSize = 'a4',
}: A4SheetProps) {
  const { currentBranch } = useAuth() || {};

  const effectiveWatermark =
    watermarkUrl !== undefined
      ? resolveLogoUrl(watermarkUrl)
      : resolveLogoUrl(currentBranch?.receipt_header?.watermark_url);

  const effectiveOpacity =
    watermarkOpacity !== undefined
      ? watermarkOpacity
      : Number(currentBranch?.receipt_header?.watermark_opacity ?? 0.08);

  const sheetSizeClass = pageSize === 'a5' ? 'a5-print-sheet' : 'a4-print-sheet';

  return (
    <div
      className={`${sheetSizeClass} relative flex flex-col justify-between bg-white text-slate-900 text-xs ${className}`}
      style={{ fontFamily: 'Inter, Arial, sans-serif' }}
    >
      {/* Centered Watermark Background on each sheet */}
      {effectiveWatermark && (
        <div
          className="print-watermark pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden z-0"
          aria-hidden="true"
        >
          <img
            src={effectiveWatermark}
            alt=""
            className="w-[280px] sm:w-[350px] max-h-[350px] object-contain"
            style={{ opacity: effectiveOpacity }}
          />
        </div>
      )}

      {header && (
        <div className="printable-header-container w-full shrink-0 relative z-10">
          {header}
        </div>
      )}

      <div className="a4-sheet-content flex-1 flex flex-col justify-start relative z-10 w-full min-h-0">
        {children}
      </div>

      {footer && (
        <div className="printable-footer-container w-full shrink-0 mt-auto relative z-10">
          {footer}
        </div>
      )}
    </div>
  );
}
