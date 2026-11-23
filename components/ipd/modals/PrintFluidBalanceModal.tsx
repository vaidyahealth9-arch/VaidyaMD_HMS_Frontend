'use client';

import React from 'react';
import PrintableModal from '@/components/common/PrintableModal';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import PrintableReportFooter from '@/components/common/PrintableReportFooter';
import A4Sheet from '@/components/common/A4Sheet';
import { formatDateTime } from '@/lib/utils';
import type { FluidBalance, AdmissionDetails } from '@/features/ipd/types';

interface PrintFluidBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission?: AdmissionDetails;
  fluidBalances: FluidBalance[];
}

export default function PrintFluidBalanceModal({
  isOpen,
  onClose,
  admission,
  fluidBalances,
}: PrintFluidBalanceModalProps) {
  if (!isOpen) return null;

  return (
    <PrintableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Inpatient Fluid Intake / Output (I/O) Chart"
      subtitle={`Cumulative bedside fluid balance chart for ${admission?.patient.name || 'Inpatient'}`}
      maxWidth="max-w-4xl"
    >
      {({ hideHeader }: { hideHeader: boolean }) => (
        <A4Sheet
          header={
            <PrintableReportHeader
              title="Fluid Intake / Output (I/O) Balance Chart"
              badge="IPD FLUID BALANCE"
              hideHospitalHeader={hideHeader}
              department="Inpatient Department (IPD)"
              patient={{
                name: admission?.patient.name,
                vid: admission?.patient.vid,
                age: admission?.patient.age,
                gender: admission?.patient.gender,
                blood_group: admission?.patient.blood_group,
              }}
              doctor={{
                name: typeof admission?.admitting_doctor === 'object' ? admission?.admitting_doctor?.name : admission?.admitting_doctor,
              }}
              metaFields={[
                { label: 'Admission #', value: admission?.admission_number || '—' },
                { label: 'Ward & Bed', value: `${admission?.bed.ward_name || 'IPD'} • Bed ${admission?.bed.bed_number || '—'}` },
                { label: 'Chart Date', value: formatDateTime(new Date().toISOString()) },
              ]}
            />
          }
          footer={<PrintableReportFooter />}
          className="space-y-4 text-xs font-sans text-slate-800 p-8"
        >
          {/* Fluid Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-900 font-bold uppercase text-center">
                  <th className="p-2 text-left">Date &amp; Shift</th>
                  <th className="p-2">Oral (mL)</th>
                  <th className="p-2">IV Fluids (mL)</th>
                  <th className="p-2">Total Intake</th>
                  <th className="p-2">Urine (mL)</th>
                  <th className="p-2">Drain / Other</th>
                  <th className="p-2">Total Output</th>
                  <th className="p-2 text-right">Net Balance (mL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(fluidBalances || []).map((fb, idx) => {
                  const totalIn = (fb.intake_oral || 0) + (fb.intake_iv || 0) + (fb.intake_other || 0);
                  const totalOut = (fb.output_urine || 0) + (fb.output_drain || 0) + (fb.output_vomitus || 0) + (fb.output_other || 0);
                  const net = totalIn - totalOut;

                  return (
                    <tr key={fb.id || idx} className="text-center hover:bg-slate-50/50">
                      <td className="p-2 text-left font-medium text-slate-800">
                        <span className="font-mono text-slate-500 mr-1">
                          {fb.record_date ? new Date(fb.record_date).toLocaleDateString('en-IN') : '—'}
                        </span>
                        <span className="font-semibold text-slate-900">({fb.shift})</span>
                      </td>
                      <td className="p-2 font-mono">{fb.intake_oral || 0}</td>
                      <td className="p-2 font-mono">{fb.intake_iv || 0}</td>
                      <td className="p-2 font-mono font-bold text-emerald-700">+{totalIn}</td>
                      <td className="p-2 font-mono">{fb.output_urine || 0}</td>
                      <td className="p-2 font-mono">{(fb.output_drain || 0) + (fb.output_vomitus || 0)}</td>
                      <td className="p-2 font-mono font-bold text-amber-700">-{totalOut}</td>
                      <td className={`p-2 font-mono font-bold text-right ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {net >= 0 ? `+${net}` : net} mL
                      </td>
                    </tr>
                  );
                })}

                {(!fluidBalances || fluidBalances.length === 0) && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                      No fluid intake/output entries recorded for this admission yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </A4Sheet>
      )}
    </PrintableModal>
  );
}
