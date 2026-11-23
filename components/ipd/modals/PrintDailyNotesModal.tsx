'use client';

import React from 'react';
import PrintableModal from '@/components/common/PrintableModal';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import PrintableReportFooter from '@/components/common/PrintableReportFooter';
import A4Sheet from '@/components/common/A4Sheet';
import { formatDateTime } from '@/lib/utils';
import type { AdmissionDetails, RoundNote } from '@/features/ipd/types';

interface PrintDailyNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: AdmissionDetails;
  notes?: RoundNote[];
  roundNotes?: RoundNote[];
}

export default function PrintDailyNotesModal({
  isOpen,
  onClose,
  admission,
  notes,
  roundNotes,
}: PrintDailyNotesModalProps) {
  if (!isOpen) return null;

  const notesList = roundNotes || notes || [];

  return (
    <PrintableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Physician Daily Progress Notes"
      subtitle={`Chronological SOAP rounds record for ${admission.patient.name}`}
      maxWidth="max-w-4xl"
    >
      {({ hideHeader }: { hideHeader: boolean }) => (
        <A4Sheet
          header={
            <PrintableReportHeader
              title="Doctor's Daily Progress Notes"
              badge="IPD CLINICAL SOAP"
              hideHospitalHeader={hideHeader}
              department="Inpatient Department (IPD)"
              patient={{
                name: admission.patient?.name,
                vid: admission.patient?.vid,
                age: admission.patient?.age,
                gender: admission.patient?.gender,
                blood_group: admission.patient?.blood_group,
              }}
              doctor={{
                name: typeof admission.admitting_doctor === 'object' ? admission.admitting_doctor?.name : admission.admitting_doctor,
              }}
              metaFields={[
                { label: 'Admission #', value: admission.admission_number },
                { label: 'Ward & Bed', value: `${admission.bed?.ward_name || 'IPD'} • Bed ${admission.bed?.bed_number || '—'}` },
                { label: 'Diagnosis', value: admission.diagnosis || 'Clinical Inpatient Care' },
              ]}
            />
          }
          footer={<PrintableReportFooter />}
          className="space-y-4 text-xs font-sans text-slate-800 p-8"
        >
          {/* Chronological Daily SOAP Notes */}
          <div className="space-y-4">
            {notesList.map((rn, idx) => {
              const docName = (rn.doctor_name || '').replace(/^dr\.?\s+/i, '');
              return (
                <div key={rn.id || idx} className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 text-[11px]">
                    <span className="font-bold text-slate-900">
                      Dr. {docName || 'Attending Physician'}
                    </span>
                    <span className="font-mono text-slate-500">
                      {formatDateTime(rn.round_time || rn.created_at)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="font-bold text-indigo-900 uppercase text-[9px] block">Subjective</span>
                      <p className="text-slate-700">{rn.subjective || '—'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-indigo-900 uppercase text-[9px] block">Objective</span>
                      <p className="text-slate-700">{rn.objective || '—'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-50">
                    <div>
                      <span className="font-bold text-indigo-900 uppercase text-[9px] block">Assessment</span>
                      <p className="text-slate-700">{rn.assessment || '—'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-indigo-900 uppercase text-[9px] block">Plan</span>
                      <p className="text-slate-700">{rn.plan || '—'}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {notesList.length === 0 && (
              <div className="p-8 text-center text-slate-400 italic border border-dashed rounded-lg">
                No progress notes recorded for this admission.
              </div>
            )}
          </div>
        </A4Sheet>
      )}
    </PrintableModal>
  );
}
