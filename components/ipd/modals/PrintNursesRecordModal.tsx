'use client';

import React from 'react';
import PrintableModal from '@/components/common/PrintableModal';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import PrintableReportFooter from '@/components/common/PrintableReportFooter';
import A4Sheet from '@/components/common/A4Sheet';
import { formatDateTime } from '@/lib/utils';
import type { AdmissionDetails, IPDOrder } from '@/features/ipd/types';

interface PrintNursesRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: AdmissionDetails;
  orders?: IPDOrder[];
}

export default function PrintNursesRecordModal({
  isOpen,
  onClose,
  admission,
  orders,
}: PrintNursesRecordModalProps) {
  if (!isOpen) return null;

  const ordersList = orders || admission.orders || [];
  const activeOrders = ordersList.filter((o) => o.status === 'Active' || o.order_type === 'Medication');

  // Fill up to 10 rows to match the physical printed sheet look
  const paddedCount = Math.max(8, activeOrders.length);
  const rows = Array.from({ length: paddedCount }, (_, i) => activeOrders[i] || null);

  return (
    <PrintableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nurse's Administration Record (eMAR)"
      subtitle={`Official Medication Administration Sheet for ${admission.patient.name}`}
      maxWidth="max-w-4xl"
    >
      {({ hideHeader }: { hideHeader: boolean }) => (
        <A4Sheet
          header={
            <PrintableReportHeader
              title="Inpatient Nurses Administration Record"
              badge="NURSES RECORD"
              hideHospitalHeader={hideHeader}
              department="Inpatient Department (IPD)"
              patient={{
                name: admission.patient.name,
                vid: admission.patient.vid,
                age: admission.patient.age,
                gender: admission.patient.gender,
                blood_group: admission.patient.blood_group,
              }}
              doctor={{
                name: typeof admission.admitting_doctor === 'object' ? admission.admitting_doctor?.name : admission.admitting_doctor,
              }}
              metaFields={[
                { label: 'Admission #', value: admission.admission_number },
                { label: 'Ward & Bed', value: `${admission.bed.ward_name} • Bed ${admission.bed.bed_number}` },
                { label: 'Sheet Date', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
              ]}
            />
          }
          footer={<PrintableReportFooter />}
          className="space-y-3 text-xs font-sans text-slate-800 p-6"
        >
          {/* Nurses Record Title Box — Directly matching physical hospital proforma */}
          <div className="border border-slate-900 rounded p-1.5 text-center font-bold tracking-widest text-xs bg-slate-50 uppercase">
            NURSES MEDICATION &amp; ADMINISTRATION RECORD
          </div>

          {/* Nurses Record Grid Table (Exact Match to Physical Proforma) */}
          <div className="border border-slate-900 overflow-hidden">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 text-slate-950 font-bold uppercase text-center">
                  <th className="border-r border-slate-900 p-1 w-8">Sl.</th>
                  <th className="border-r border-slate-900 p-1 text-left px-2">Medicine / Formulation</th>
                  <th className="border-r border-slate-900 p-1 w-16">Dose</th>
                  <th className="border-r border-slate-900 p-1 w-14">Route</th>
                  <th className="border-r border-slate-900 p-1 w-14">Freq.</th>
                  <th className="border-r border-slate-900 p-1 w-20">Start Date</th>
                  <th className="border-r border-slate-900 p-1 text-center" colSpan={4}>
                    Timing &amp; Doses
                  </th>
                  <th className="p-1 text-left px-2 w-32">Remarks / Signed</th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-900 text-[9px] text-slate-600 font-bold text-center">
                  <th className="border-r border-slate-900" colSpan={6}></th>
                  <th className="border-r border-slate-900 p-0.5 w-12">M (08:00)</th>
                  <th className="border-r border-slate-900 p-0.5 w-12">A (14:00)</th>
                  <th className="border-r border-slate-900 p-0.5 w-12">E (18:00)</th>
                  <th className="border-r border-slate-900 p-0.5 w-12">N (22:00)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((ord, idx) => {
                  if (!ord) {
                    return (
                      <tr key={`empty-${idx}`} className="border-b border-slate-300 h-7 text-center">
                        <td className="border-r border-slate-900 p-1 text-slate-400">{idx + 1}</td>
                        <td className="border-r border-slate-900 p-1"></td>
                        <td className="border-r border-slate-900 p-1"></td>
                        <td className="border-r border-slate-900 p-1"></td>
                        <td className="border-r border-slate-900 p-1"></td>
                        <td className="border-r border-slate-900 p-1"></td>
                        <td className="border-r border-slate-900 p-1"></td>
                        <td className="border-r border-slate-900 p-1"></td>
                        <td className="border-r border-slate-900 p-1"></td>
                        <td className="border-r border-slate-900 p-1"></td>
                        <td className="p-1"></td>
                      </tr>
                    );
                  }

                  const dosesGiven = ord.administered_logs?.length || 0;
                  const latestLog = ord.administered_logs && ord.administered_logs.length > 0
                    ? ord.administered_logs[ord.administered_logs.length - 1]
                    : null;

                  return (
                    <tr key={ord.id || idx} className="border-b border-slate-300 min-h-[28px]">
                      <td className="border-r border-slate-900 p-1 text-center font-bold text-slate-800">
                        {idx + 1}
                      </td>
                      <td className="border-r border-slate-900 p-1 px-2 font-bold text-slate-950">
                        {ord.item_name}
                        {ord.instructions && (
                          <span className="block font-normal text-slate-500 text-[9px] italic">
                            {ord.instructions}
                          </span>
                        )}
                      </td>
                      <td className="border-r border-slate-900 p-1 text-center font-semibold">{ord.dosage || '—'}</td>
                      <td className="border-r border-slate-900 p-1 text-center">{ord.route || 'Oral'}</td>
                      <td className="border-r border-slate-900 p-1 text-center font-bold">{ord.frequency || 'OD'}</td>
                      <td className="border-r border-slate-900 p-1 text-center font-mono">
                        {ord.start_date ? new Date(ord.start_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="border-r border-slate-900 p-1 text-center font-bold text-emerald-800">
                        {dosesGiven > 0 ? '✓' : ''}
                      </td>
                      <td className="border-r border-slate-900 p-1 text-center font-bold text-emerald-800">
                        {dosesGiven > 1 ? '✓' : ''}
                      </td>
                      <td className="border-r border-slate-900 p-1 text-center font-bold text-emerald-800">
                        {dosesGiven > 2 ? '✓' : ''}
                      </td>
                      <td className="border-r border-slate-900 p-1 text-center font-bold text-emerald-800">
                        {dosesGiven > 3 ? '✓' : ''}
                      </td>
                      <td className="p-1 px-2 text-[9px] text-slate-700">
                        {latestLog ? (
                          <span>
                            Given by {latestLog.nurse_name}
                            {latestLog.timestamp && ` (${formatDateTime(latestLog.timestamp)})`}
                          </span>
                        ) : ord.status === 'Discontinued' ? (
                          <span className="text-rose-600 font-bold">Stopped: {ord.stop_reason || 'Discontinued'}</span>
                        ) : (
                          <span className="text-slate-400 italic">Scheduled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Investigation Box matching proforma */}
          <div className="border border-slate-900 rounded p-3 min-h-[90px] space-y-1">
            <span className="font-bold text-slate-900 text-[10px] uppercase block tracking-wider">
              INVESTIGATION &amp; SPECIAL BEDSIDE INSTRUCTIONS
            </span>
            <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-700 pt-1">
              <div>
                <span className="font-bold block text-slate-500">Dietary Instructions:</span>
                <span>Regular hospital inpatient diet, soft fluids as tolerated.</span>
              </div>
              <div>
                <span className="font-bold block text-slate-500">Clinical Alerts &amp; Allergies:</span>
                <span>{admission.allergies && admission.allergies.length > 0 ? admission.allergies.join(', ') : 'No known drug allergies (NKDA)'}</span>
              </div>
            </div>
          </div>
        </A4Sheet>
      )}
    </PrintableModal>
  );
}
