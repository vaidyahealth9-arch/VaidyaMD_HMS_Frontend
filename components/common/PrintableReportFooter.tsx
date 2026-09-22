'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

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
  className?: string;
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
  showComputerGeneratedNotice = true,
  className = '',
}: PrintableReportFooterProps) {
  const { currentBranch, user } = useAuth() || {};

  const hospitalName =
    currentBranch?.receipt_header?.hospital_name ||
    user?.hospital_name ||
    'Hospital & Healthcare Institute';

  const branchName = currentBranch?.name || 'Main Facility';

  const branchContact =
    customBranchDetails ||
    [
      currentBranch?.address,
      currentBranch?.phone ? `Tel: ${currentBranch.phone}` : null,
      currentBranch?.email ? `Email: ${currentBranch.email}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

  const defaultDisclaimer = `This is a certified clinical record generated electronically from ${hospitalName} (${branchName}). In case of acute clinical symptoms, report immediately to the hospital emergency desk.`;

  return (
    <div className={`pt-4 mt-3 print:pt-2 print:mt-2 border-t border-slate-300 text-xs text-slate-700 page-break-avoid avoid-break space-y-3 print:space-y-1.5 ${className}`}>
      {/* Optional Custom Notes / Instructions */}
      {notes && (
        <div className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
          {notes}
        </div>
      )}

      {/* Signatory & Legal Information Grid */}
      <div className="flex items-end justify-between gap-6">
        {/* Left Column: Branch & Legal Metadata */}
        <div className="flex-1 min-w-0 pr-4 space-y-1">
          {showBranchSummary && (
            <div>
              <p className="font-bold text-slate-900 text-xs leading-tight">
                {hospitalName} — <span className="font-semibold text-slate-700">{branchName}</span>
              </p>
              {branchContact && (
                <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                  {branchContact}
                </p>
              )}
            </div>
          )}
          <p className="text-[9px] text-slate-400 italic leading-relaxed pt-1">
            {disclaimer || defaultDisclaimer}
          </p>
          <p className="text-[8.5px] text-slate-400 font-mono">
            Document Generated: {new Date().toLocaleString('en-IN')}
          </p>
        </div>

        {/* Right Column: Signatories */}
        <div className="flex items-end gap-6 flex-shrink-0">
          {(showWitness || witnessName) && (
            <div className="text-center w-40">
              <div className="h-9" />
              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-xs text-slate-900 leading-tight truncate">{witnessName || 'Witness Signatory'}</p>
                <p className="text-[10px] text-slate-500">{witnessTitle || 'Patient / Attendant Signature'}</p>
              </div>
            </div>
          )}

          {showSignatory && (
            <div className="text-center w-44">
              <div className="h-9" />
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
      </div>
    </div>
  );
}
