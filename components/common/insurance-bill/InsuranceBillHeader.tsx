'use client';

import React from 'react';
import type { InsuranceDetails, InsurancePatientInfo } from './types';

interface InsuranceBillHeaderProps {
  insurance: InsuranceDetails;
  patient: InsurancePatientInfo;
  hospitalName?: string;
}

export default function InsuranceBillHeader({
  insurance,
  patient,
  hospitalName,
}: InsuranceBillHeaderProps) {
  const patientFullName = [patient.title, patient.name].filter(Boolean).join(' ').trim() || patient.name;
  const ageSex = [
    patient.age ? `${patient.age}Y(s)` : null,
    patient.gender ? (patient.gender.toLowerCase() === 'female' ? 'Female' : patient.gender.toLowerCase() === 'male' ? 'Male' : patient.gender) : null,
  ]
    .filter(Boolean)
    .join('/');

  return (
    <div className="w-full text-slate-900 border-b border-slate-300 pb-2.5 space-y-1.5 font-sans">
      {/* 1. Hospital & Regulatory GST / Drug License Bar */}
      <div className="flex justify-between items-center text-[10px] text-slate-700 font-mono border-b border-slate-200 pb-1">
        <div>
          <span className="font-bold text-slate-600">GST No - </span>
          <span>{insurance.gst_no || '36AAMCS6700Q1ZP'}</span>
        </div>
        {hospitalName && (
          <div className="font-bold font-sans text-xs uppercase tracking-wider text-slate-900 text-center">
            {hospitalName}
          </div>
        )}
        <div>
          <span className="font-bold text-slate-600">DL No - </span>
          <span>{insurance.dl_no || '—'}</span>
        </div>
      </div>

      {/* 2. Official Bill Title */}
      <div className="text-center py-0.5">
        <h2 className="text-sm font-bold uppercase tracking-tight text-slate-950">
          {insurance.bill_type || 'IP Approximate Bill'}
        </h2>
        <p className="text-[11px] font-semibold text-slate-700 tracking-wide">
          Bill Of Supply
        </p>
      </div>

      {/* 3. Multi-Detail Insurance & Patient Demographics Grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] pt-1">
        {/* Left Column */}
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-36 shrink-0">Approx Bill No</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-mono font-bold text-slate-900 flex-1 truncate">
              {insurance.approx_bill_no || '—'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-36 shrink-0">ToBeDischargedDt</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-medium text-slate-800 flex-1 truncate">
              {insurance.to_be_discharged_dt || '—'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-36 shrink-0">Patient Name</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-bold text-slate-950 flex-1 truncate uppercase">
              {patientFullName}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-36 shrink-0">Age / Sex</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-medium text-slate-800 flex-1 truncate">
              {ageSex || '—'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-36 shrink-0">Consultant</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-bold text-slate-900 flex-1 truncate">
              {insurance.consultant || '—'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-36 shrink-0">Claim No.</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-mono font-bold text-slate-900 flex-1 truncate">
              {insurance.claim_no || '—'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-36 shrink-0">Emp ID/Policy No</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-mono text-slate-800 flex-1 truncate">
              {insurance.policy_no || '—'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-36 shrink-0">TPA Name</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-semibold text-slate-900 flex-1 truncate uppercase">
              {insurance.tpa_name || '—'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-36 shrink-0">Organization</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-medium text-slate-800 flex-1 truncate uppercase">
              {insurance.organization || insurance.tpa_name || '—'}
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-32 shrink-0">Admission No</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-mono font-bold text-slate-900 flex-1 truncate">
              {insurance.admission_no || '—'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-32 shrink-0">UMR No</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-mono font-bold text-slate-900 flex-1 truncate">
              {insurance.umr_no || patient.mrn || patient.vid || '—'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-32 shrink-0">Admission Date</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-medium text-slate-800 flex-1 truncate">
              {insurance.admission_date || '—'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-32 shrink-0">Discharge Date</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-medium text-slate-800 flex-1 truncate">
              {insurance.discharge_date || '—'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-32 shrink-0">Department</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-bold uppercase text-slate-900 flex-1 truncate">
              {insurance.department || 'Inpatient (IPD)'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-32 shrink-0">Admitted Bed</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-medium text-slate-800 flex-1 truncate">
              {insurance.admitted_bed || '—'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-32 shrink-0">Medical Card No.</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-mono text-slate-800 flex-1 truncate">
              {insurance.medical_card_no || '—'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-32 shrink-0">TPA GST No</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-mono text-slate-800 flex-1 truncate">
              {insurance.tpa_gst_no || '—'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-slate-600 w-32 shrink-0">Org. GST No</span>
            <span className="text-slate-500 mr-1">:</span>
            <span className="font-mono text-slate-800 flex-1 truncate">
              {insurance.org_gst_no || insurance.tpa_gst_no || '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
