'use client';

import React from 'react';
import PrintableModal from '@/components/common/PrintableModal';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import PrintableReportFooter from '@/components/common/PrintableReportFooter';
import A4Sheet from '@/components/common/A4Sheet';
import { formatDateTime } from '@/lib/utils';
import type { AdmissionDetails } from '@/features/ipd/types';

interface PrintCaseDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: AdmissionDetails;
}

export default function PrintCaseDossierModal({
  isOpen,
  onClose,
  admission,
}: PrintCaseDossierModalProps) {
  if (!isOpen) return null;

  return (
    <PrintableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Inpatient Comprehensive Case Dossier"
      subtitle={`Complete clinical case file for ${admission.patient.name}`}
      maxWidth="max-w-4xl"
    >
      {({ hideHeader }: { hideHeader: boolean }) => (
        <A4Sheet
          header={
            <PrintableReportHeader
              title="Inpatient Clinical Case Dossier"
              badge="IPD COMPLETE DOSSIER"
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
                { label: 'Admit Date', value: formatDateTime(admission.admission_date) },
                { label: 'Diagnosis', value: admission.diagnosis || 'Clinical Care' },
              ]}
            />
          }
          footer={<PrintableReportFooter />}
          className="space-y-4 text-xs font-sans text-slate-800 p-8"
        >
          {/* Active Diagnoses & Allergies */}
          <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <span className="font-bold text-slate-500 uppercase text-[9px] block">Primary Diagnosis / Indication</span>
              <span className="font-semibold text-slate-900">{admission.diagnosis || 'Standard inpatient care'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase text-[9px] block">Documented Allergies</span>
              <span className="font-semibold text-rose-700">
                {admission.allergies && admission.allergies.length > 0 ? admission.allergies.join(', ') : 'No known drug allergies (NKDA)'}
              </span>
            </div>
          </div>

          {/* Section 1: Doctor SOAP Rounds Summary */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900 text-xs uppercase border-b border-slate-200 pb-1 block">
              1. Attending Physician SOAP Notes ({admission.round_notes?.length || 0})
            </span>
            <div className="space-y-2">
              {(admission.round_notes || []).map((rn, idx) => {
                const docName = (rn.doctor_name || '').replace(/^dr\.?\s+/i, '');
                return (
                  <div key={rn.id || idx} className="p-2.5 border border-slate-200 rounded bg-white text-[10px]">
                    <div className="flex justify-between font-bold text-slate-800 mb-1">
                      <span>Dr. {docName || 'Attending Physician'}</span>
                      <span className="font-mono text-slate-500">{formatDateTime(rn.round_time || rn.created_at)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div><strong className="text-indigo-900">S:</strong> {rn.subjective || '—'}</div>
                      <div><strong className="text-indigo-900">O:</strong> {rn.objective || '—'}</div>
                      <div><strong className="text-indigo-900">A:</strong> {rn.assessment || '—'}</div>
                      <div><strong className="text-indigo-900">P:</strong> {rn.plan || '—'}</div>
                    </div>
                  </div>
                );
              })}
              {(!admission.round_notes || admission.round_notes.length === 0) && (
                <p className="text-slate-400 italic text-[11px]">No progress notes recorded.</p>
              )}
            </div>
          </div>

          {/* Section 2: Active Bedside Orders / Prescriptions */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900 text-xs uppercase border-b border-slate-200 pb-1 block">
              2. Active Bedside Orders &amp; Medication Schedule ({admission.orders?.length || 0})
            </span>
            <table className="w-full border-collapse border border-slate-200 text-[10px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold">
                  <th className="p-1.5 text-left border-r border-slate-200">Item Name</th>
                  <th className="p-1.5 border-r border-slate-200">Dosage</th>
                  <th className="p-1.5 border-r border-slate-200">Route</th>
                  <th className="p-1.5 border-r border-slate-200">Frequency</th>
                  <th className="p-1.5 border-r border-slate-200">Start Date</th>
                  <th className="p-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {(admission.orders || []).map((ord, idx) => (
                  <tr key={ord.id || idx} className="border-b border-slate-200">
                    <td className="p-1.5 font-bold border-r border-slate-200">{ord.item_name}</td>
                    <td className="p-1.5 text-center border-r border-slate-200">{ord.dosage || '—'}</td>
                    <td className="p-1.5 text-center border-r border-slate-200">{ord.route || 'Oral'}</td>
                    <td className="p-1.5 text-center font-bold border-r border-slate-200">{ord.frequency || 'OD'}</td>
                    <td className="p-1.5 text-center font-mono border-r border-slate-200">{ord.start_date ? new Date(ord.start_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="p-1.5 text-center font-semibold">{ord.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: Operation Theatre Operative Procedures */}
          {admission.ot_records && admission.ot_records.length > 0 && (
            <div className="space-y-2">
              <span className="font-bold text-slate-900 text-xs uppercase border-b border-slate-200 pb-1 block">
                3. Surgical &amp; Operation Theatre Procedures ({admission.ot_records.length})
              </span>
              <div className="space-y-2">
                {admission.ot_records.map((ot, idx) => (
                  <div key={ot.id || idx} className="p-2.5 border border-slate-200 rounded bg-white text-[10px] space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{ot.procedure_name} ({ot.surgery_category})</span>
                      <span className="font-mono text-indigo-700">{ot.total_ot_hours} hrs OT duration</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div><strong>Surgeon:</strong> {ot.primary_surgeon?.name ? `Dr. ${ot.primary_surgeon.name}` : '—'}</div>
                      <div><strong>Anesthesia:</strong> {ot.anesthesia_type} {ot.anesthetist?.name ? `(Dr. ${ot.anesthetist.name})` : ''}</div>
                    </div>
                    {ot.operative_notes && (
                      <div className="text-slate-600 pt-1">
                        <strong>Technique:</strong> {ot.operative_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </A4Sheet>
      )}
    </PrintableModal>
  );
}
