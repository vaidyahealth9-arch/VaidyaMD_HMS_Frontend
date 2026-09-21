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
  const initialLetter = (effectiveHospitalName || 'H').charAt(0).toUpperCase();

  return (
    <div className="space-y-4">
      {onTogglePrePrintedPad && (
        <div className="flex justify-end print:hidden -mb-2">
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
      {/* ── Hospital Letterhead Banner (Conditional) ── */}
      {isHeaderVisible ? (
        <div className="flex items-start justify-between pb-3 border-b-2 border-[#0B4F6C]">
          <div className="flex items-start gap-3">
            {effectiveLogoUrl ? (
              <div className="h-12 w-auto max-w-[150px] flex items-center justify-center shrink-0">
                <img
                  src={effectiveLogoUrl}
                  alt={effectiveHospitalName}
                  className="max-h-12 max-w-[150px] object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              </div>
            ) : null}
            <div
              className={`w-11 h-11 rounded-lg items-center justify-center flex-shrink-0 text-white font-bold text-lg shadow-xs ${
                effectiveLogoUrl ? 'hidden' : 'flex'
              }`}
              style={{ background: '#0B4F6C' }}
            >
              {initialLetter}
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg leading-tight text-[#0B4F6C]">
                {effectiveHospitalName}
              </h1>
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                {department} · {effectiveSubtitle}
              </p>
              {effectiveSubtext && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {effectiveSubtext}
                </p>
              )}
              {statutoryLine && (
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                  {statutoryLine}
                </p>
              )}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            {badge && (
              <span className="inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#0B4F6C] border border-blue-200">
                {badge}
              </span>
            )}
            <p className="text-[11px] font-mono text-slate-600 font-semibold mt-1">
              Date: {date}
            </p>
          </div>
        </div>
      ) : (
        /* Top spacing for pre-printed letterhead pads */
        <div className="h-20 print:h-24 flex items-end justify-between border-b border-slate-300 pb-2">
          <span className="text-[10px] text-slate-400 italic">
            [Pre-printed Letterhead Pad Space]
          </span>
          <span className="text-[10px] font-mono text-slate-500 font-bold">
            Date: {date}
          </span>
        </div>
      )}

      {/* ── Document Title ── */}
      <div className="text-center my-2">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-wide uppercase">
          {title}
        </h2>
      </div>

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
  );
}
