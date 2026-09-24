'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Phone, Mail, Globe, Clock } from 'lucide-react';

export interface PrintableReportFooterProps {
  signatoryName?: string;
  signatoryTitle?: string;
  signatorySubtitle?: string;
  signatoryQualification?: string;
  showSignatory?: boolean;
  witnessName?: string;
  witnessTitle?: string;
  showWitness?: boolean;
  notes?: React.ReactNode;
  disclaimer?: string;
  customBranchDetails?: string;
  showBranchSummary?: boolean;
  showComputerGeneratedNotice?: boolean;
  hideHospitalFooter?: boolean;
  headerBoldColor?: string;
  headerSmallColor?: string;
  className?: string;
  pageNumber?: number;
  totalPages?: number;
}

export default function PrintableReportFooter({
  signatoryName,
  signatoryTitle = 'Authorized Medical Signatory',
  signatorySubtitle,
  signatoryQualification,
  showSignatory = true,
  witnessName,
  witnessTitle,
  showWitness = false,
  notes,
  disclaimer,
  customBranchDetails,
  showBranchSummary = true,
  showComputerGeneratedNotice = false,
  hideHospitalFooter = false,
  headerBoldColor: propBoldColor,
  headerSmallColor: propSmallColor,
  className = '',
  pageNumber,
  totalPages,
}: PrintableReportFooterProps) {
  const { currentBranch, user } = useAuth() || {};

  const effectiveBoldColor =
    propBoldColor ||
    currentBranch?.receipt_header?.header_bold_color ||
    '#4A2E2B';
  const effectiveSmallColor =
    propSmallColor ||
    currentBranch?.receipt_header?.header_small_color ||
    '#C29B7F';
  const padFooterHeight = currentBranch?.receipt_header?.pad_footer_height_mm
    ? `${currentBranch.receipt_header.pad_footer_height_mm}mm`
    : '22mm';

  const address =
    currentBranch?.address ||
    'Indravati Prime, Opposite Vijaya Diagnostic Center, High Tension Road, Kondapur - 500084';

  const phone = currentBranch?.phone || '77806 12539';
  const email = currentBranch?.email || 'matrikafertilityhyd@gmail.com';
  const website =
    (currentBranch as any)?.website ||
    (currentBranch as any)?.receipt_header?.website ||
    'www.matrikafertility.in';
  const timings =
    (currentBranch as any)?.timings ||
    (currentBranch as any)?.receipt_header?.timings ||
    'Mon-Sat: 9:00 AM - 6:00 PM';

  return (
    <div
      className={`printable-report-footer print-footer-anchor w-full bg-white shrink-0 pt-2 mt-auto text-xs text-slate-700 ${className}`}
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <div className="px-6 sm:px-8 print:px-[12mm] space-y-2">
        {/* Optional Custom Notes / Instructions */}
        {notes && (
          <div className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
            {notes}
          </div>
        )}

        {/* Signatories Row (Doctor / Attendant / Witness) */}
        {(showSignatory || showWitness || witnessName) && (
          <div className="flex items-end justify-between gap-6 pb-1">
            {/* Witness / Left Signatory */}
            {(showWitness || witnessName) ? (
              <div className="text-center w-40">
                <div className="h-8" />
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold text-xs text-slate-900 leading-tight truncate">
                    {witnessName || 'Witness Signatory'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {witnessTitle || 'Patient / Attendant Signature'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-[9px] text-slate-400 italic">
                {disclaimer || (showComputerGeneratedNotice ? 'Computer-generated certified clinical documentation.' : '')}
              </div>
            )}

            {/* Right: Primary Signatory */}
            {showSignatory && (
              <div className="text-center w-48 ml-auto">
                <div className="h-8" />
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold text-xs text-slate-900 leading-tight truncate">
                    {signatoryName || user?.name || 'Authorized Signatory'}
                  </p>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight">
                    {signatoryTitle}
                    {signatoryQualification ? ` · ${signatoryQualification}` : ''}
                  </p>
                  {signatorySubtitle && (
                    <p className="text-[9px] text-slate-400 mt-0.5">{signatorySubtitle}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Conditional Footer: Full Letterhead or Pre-printed Spacer ── */}
        {!hideHospitalFooter ? (
          <>
            {/* ── Thin Divider Line Above Address (Full Bleed) ── */}
            <div
              className="w-full"
              style={{
                height: '1.5px',
                backgroundColor: effectiveSmallColor,
                borderTop: `1.5px solid ${effectiveSmallColor}`,
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            />

            {/* ── Official Letterhead Footer Format (Matching Reference Design) ── */}
            <div className="pt-1 pb-0.5 space-y-1 text-center">
              {/* Address Row */}
              {address && (
                <div className="flex items-start justify-center gap-1.5 font-semibold text-slate-700 text-[10px]">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                  <span>{address}</span>
                </div>
              )}

              {/* Contact Info Row — all inline with separators like reference image */}
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[9.5px] text-slate-600 font-medium">
                {phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                    <span>{phone}</span>
                  </div>
                )}
                {phone && email && <span className="text-slate-300 text-[8px]">|</span>}
                {email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                    <span>{email}</span>
                  </div>
                )}
                {(email || phone) && website && <span className="text-slate-300 text-[8px]">|</span>}
                {website && (
                  <div className="flex items-center gap-1">
                    <Globe className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                    <span>{website}</span>
                  </div>
                )}
                {(email || phone || website) && timings && <span className="text-slate-300 text-[8px]">|</span>}
                {timings && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                    <span>{timings}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Page Counter & Certified Note Bar */}
            <div className="flex items-center justify-between text-[8.5px] text-slate-400 pb-0.5">
              <span className="italic truncate">{disclaimer || (showComputerGeneratedNotice ? 'Certified computer-generated medical record.' : '')}</span>
              <span className="print-page-number font-mono font-medium shrink-0">
                Page {pageNumber || 1}{totalPages && totalPages > 1 ? ` of ${totalPages}` : ''}
              </span>
            </div>
          </>
        ) : (
          /* Bottom spacer for pre-printed letterhead pad prints */
          <div style={{ height: padFooterHeight }} className="w-full flex items-center justify-center">
            <span className="text-[9px] text-slate-300 italic print:hidden">
              [Pre-printed Letterhead Footer Space ({currentBranch?.receipt_header?.pad_footer_height_mm || 25} mm)]
            </span>
          </div>
        )}
      </div>

      {/* ── Bottom Bold Accent Stripe (Full Bleed to Paper Edges) ── */}
      {!hideHospitalFooter && (
        <div
          className="h-2 w-full block m-0 p-0 shrink-0"
          style={{
            backgroundColor: effectiveBoldColor,
            borderTop: `6px solid ${effectiveBoldColor}`,
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        />
      )}
    </div>
  );
}
