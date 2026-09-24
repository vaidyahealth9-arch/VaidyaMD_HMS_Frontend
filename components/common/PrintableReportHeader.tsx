'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface PrintableReportHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  includeHeader?: boolean;
  hideHospitalHeader?: boolean;
  onTogglePrePrintedPad?: () => void;
  department?: string;
  hospitalName?: string;
  hospitalSubtext?: string;
  logoUrl?: string;
  patient?: {
    name?: string;
    vid?: string;
    mrn?: string;
    age?: number | string;
    gender?: string;
    phone?: string;
    blood_group?: string;
    partner_name?: string;
    partner_vid?: string;
    partner_age?: number | string;
    [key: string]: any;
  };
  partner?: {
    name?: string;
    vid?: string;
    age?: number | string;
    gender?: string;
    [key: string]: any;
  };
  doctor?: {
    name?: string;
    qualification?: string;
    reg_number?: string;
    department?: string;
    [key: string]: any;
  };
  date?: string;
  metaFields?: Array<{ label: string; value: React.ReactNode }>;
  headerBoldColor?: string;
  headerSmallColor?: string;
  [key: string]: any;
}

export function resolveLogoUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const rawApi = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const backendRoot = rawApi.replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendRoot}${cleanPath}`;
}

export default function PrintableReportHeader({
  title,
  subtitle,
  badge,
  includeHeader = true,
  hideHospitalHeader,
  onTogglePrePrintedPad,
  department = 'Clinical Department & Medical Records',
  hospitalName,
  hospitalSubtext,
  logoUrl,
  patient,
  partner,
  doctor,
  date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  metaFields,
  headerBoldColor: propBoldColor,
  headerSmallColor: propSmallColor,
}: PrintableReportHeaderProps) {
  const isHeaderVisible = hideHospitalHeader !== undefined ? !hideHospitalHeader : includeHeader;
  const { currentBranch, user } = useAuth() || {};

  const rawLogoUrl =
    logoUrl ||
    currentBranch?.receipt_header?.logo_url ||
    (currentBranch?.receipt_header as any)?.logo ||
    user?.hospital_logo_url;

  const effectiveLogoUrl = resolveLogoUrl(rawLogoUrl);

  const effectiveHospitalName =
    hospitalName ||
    currentBranch?.receipt_header?.hospital_name ||
    user?.hospital_name ||
    'Hospital & Healthcare Institute';

  const effectiveSubtitle =
    subtitle ||
    (currentBranch ? `${currentBranch.name}` : 'Main Facility');

  const effectiveSubtext =
    hospitalSubtext ||
    [
      currentBranch?.address,
      currentBranch?.phone ? `Tel: ${currentBranch.phone}` : null,
      currentBranch?.email ? `Email: ${currentBranch.email}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

  const gstinPart = currentBranch?.gstin
    ? `GSTIN: ${currentBranch.gstin}`
    : currentBranch?.receipt_header?.gstin
    ? `GSTIN: ${currentBranch.receipt_header.gstin}`
    : '';

  const regPart = currentBranch?.receipt_header?.reg_number
    ? `Reg No: ${currentBranch.receipt_header.reg_number}`
    : currentBranch?.code
    ? `Branch Code: ${currentBranch.code}`
    : '';

  const statutoryLine = [regPart, gstinPart].filter(Boolean).join(' · ');
  const effectiveBoldColor =
    propBoldColor ||
    currentBranch?.receipt_header?.header_bold_color ||
    '#4A2E2B';
  const effectiveSmallColor =
    propSmallColor ||
    currentBranch?.receipt_header?.header_small_color ||
    '#C29B7F';
  const padHeaderHeight = currentBranch?.receipt_header?.pad_header_height_mm
    ? `${currentBranch.receipt_header.pad_header_height_mm}mm`
    : '32mm';
  const initialLetter = (effectiveHospitalName || 'H').charAt(0).toUpperCase();

  return (
    <div className="printable-report-header printable-header-container w-full">
      {onTogglePrePrintedPad && (
        <div className="flex justify-end print:hidden px-6 sm:px-8 pt-2 pb-1">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            <input
              type="checkbox"
              checked={hideHospitalHeader ?? !includeHeader}
              onChange={onTogglePrePrintedPad}
              className="rounded text-[#0B4F6C] focus:ring-[#0B4F6C]"
            />
            <span>Hide Hospital Header (for pre-printed stationery)</span>
          </label>
        </div>
      )}

      {/* ── Header container: standard flex flow at top of sheet on screen and in print ── */}
      <div className="print-header-anchor w-full bg-white shrink-0">
        {/* ── Top Bold Accent Stripe (Full Bleed to Paper Edges) ── */}
        {isHeaderVisible ? (
          <div
            className="h-2 w-full block m-0 p-0 shrink-0"
            style={{
              backgroundColor: effectiveBoldColor,
              borderTop: `6px solid ${effectiveBoldColor}`,
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          />
        ) : null}

        {/* ── Hospital Letterhead Banner (Logo Only, Centered & Clean) ── */}
        {isHeaderVisible ? (
          <div className="px-6 sm:px-8 print:px-[12mm] pb-2 pt-2 flex flex-col items-center justify-center text-center gap-1">
            {effectiveLogoUrl ? (
              /* Logo-only header — matching reference letterhead */
              <img
                src={effectiveLogoUrl}
                alt={effectiveHospitalName}
                className="max-h-24 max-w-[400px] object-contain mx-auto"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const sib = e.currentTarget.nextElementSibling as HTMLElement;
                  if (sib) sib.style.display = 'flex';
                }}
              />
            ) : null}
            {/* Text fallback — shown only when no logo or logo fails to load */}
            <div
              className={`flex items-center justify-center gap-2 ${effectiveLogoUrl ? 'hidden' : 'flex'}`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow"
                style={{
                  backgroundColor: effectiveBoldColor,
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
              >
                {initialLetter}
              </div>
              <div className="text-left">
                <h1 className="font-bold text-xl leading-tight text-slate-900 tracking-wide uppercase">
                  {effectiveHospitalName}
                </h1>
                {effectiveSubtitle && (
                  <p className="text-xs font-semibold text-slate-500">{effectiveSubtitle}</p>
                )}
              </div>
            </div>
            {/* ── Small / Thin Divider Line Under Logo (Full Bleed) ── */}
            <div
              className="w-full mt-2"
              style={{
                height: '1.5px',
                backgroundColor: effectiveSmallColor,
                borderTop: `1.5px solid ${effectiveSmallColor}`,
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            />
          </div>
        ) : (
          /* Top spacing for pre-printed letterhead pads (repeats on every page in print) */
          <div
            className="w-full flex items-end justify-between border-b border-slate-300 print:border-none pb-2 px-6 sm:px-8 print:px-[12mm]"
            style={{ height: padHeaderHeight }}
          >
            <span className="text-[10px] text-slate-400 italic print:hidden">
              [Pre-printed Letterhead Pad Space ({currentBranch?.receipt_header?.pad_header_height_mm || 35} mm)]
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              Date: {date}
            </span>
          </div>
        )}
      </div>

      {/* ── Page Clinical Demographics & Document Title ── */}
      <div className="px-6 sm:px-8 print:px-[12mm] pt-2 space-y-3">
        {/* ── Document Title ── */}
        {title && (
          <div className="text-center my-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-wide uppercase">
              {title}
            </h2>
          </div>
        )}

        {/* ── Patient & Clinical Demographics Strip ── */}
        {(patient || partner || doctor || metaFields) && (
          <div
            className="rounded-lg p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
          >
          {patient?.name && (
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">
                {partner?.name ? 'Female / Patient' : 'Patient Name'}
              </span>
              <p className="font-bold text-slate-900 leading-tight">
                {patient.name}
              </p>
              {(patient.age || patient.gender) && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {[patient.age ? `${patient.age} Y` : null, patient.gender].filter(Boolean).join(' / ')}
                </p>
              )}
            </div>
          )}

          {patient?.vid && (
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">
                VID / MRN
              </span>
              <p className="font-mono font-bold text-slate-800">
                {patient.vid}
              </p>
              {patient.blood_group && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Blood Group: <strong className="text-slate-800">{patient.blood_group}</strong>
                </p>
              )}
            </div>
          )}

          {(partner?.name || patient?.partner_name) && (
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">
                Male Partner / Spouse
              </span>
              <p className="font-bold text-slate-900 leading-tight">
                {partner?.name || patient?.partner_name}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {[
                  (partner?.age || patient?.partner_age) ? `${partner?.age || patient?.partner_age} Y` : null,
                  (partner?.vid || patient?.partner_vid) ? `VID: ${partner?.vid || patient?.partner_vid}` : null,
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}

          {doctor?.name && (
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">
                Consultant / Clinician
              </span>
              <p className="font-bold text-slate-900 leading-tight">
                {doctor.name}
              </p>
              {doctor.qualification && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {doctor.qualification} {doctor.reg_number ? `· Reg: ${doctor.reg_number}` : ''}
                </p>
              )}
            </div>
          )}

          {/* Custom Meta Fields */}
          {metaFields?.map((f, i) => (
            <div key={i}>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">
                {f.label}
              </span>
              <div className="font-semibold text-slate-800 text-xs">
                {f.value}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

