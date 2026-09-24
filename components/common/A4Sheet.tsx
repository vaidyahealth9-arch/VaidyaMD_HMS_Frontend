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
}

/**
 * A4Sheet — Self-contained authentic A4 page component.
 * • Dimensions: 210mm x 297mm proportions on screen with paper shadow.
 * • Print: Exact 210mm x 296mm sheet with page-break-after: always.
 * • Strict flex-col layout: Content sits between Header and Footer with ZERO overlap.
 * • Full bleed: Top and bottom stripes reach extreme edges with 0 margin.
 */
export default function A4Sheet({
  children,
  header,
  footer,
  watermarkUrl,
  watermarkOpacity,
  className = '',
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

  return (
    <div
      className={`a4-print-sheet relative flex flex-col justify-between bg-white text-slate-900 text-xs ${className}`}
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

      {/* Top Header — sits strictly at top */}
      {header && <div className="shrink-0 relative z-10 w-full">{header}</div>}

      {/* Middle Content Area — strictly in between header and footer, cannot overlap! */}
      <div className="a4-sheet-content flex-1 flex flex-col justify-between relative z-10 w-full">
        {children}
      </div>

      {/* Bottom Footer — sits strictly at bottom */}
      {footer && <div className="shrink-0 mt-auto relative z-10 w-full">{footer}</div>}
    </div>
  );
}
