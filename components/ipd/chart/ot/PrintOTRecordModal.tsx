'use client';

import React from 'react';
import PrintableModal from '@/components/common/PrintableModal';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import PrintableReportFooter from '@/components/common/PrintableReportFooter';
import A4Sheet from '@/components/common/A4Sheet';
import { formatDateTime } from '@/lib/utils';
import type { AdmissionDetails } from '@/features/ipd/types';
import type { OTRecord } from './types';

interface PrintOTRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: AdmissionDetails;
  record: OTRecord;
}

const cleanDoc = (name?: string) => {
  if (!name) return '—';
  return name.replace(/^dr\.?\s+/i, '');
};

export default function PrintOTRecordModal({
  isOpen,
  onClose,
  admission,
  record,
}: PrintOTRecordModalProps) {
  if (!isOpen) return null;

  const leadSurgeon = cleanDoc(record.primary_surgeon?.name);
  const asstSurgeon = cleanDoc(record.assistant_surgeon?.name || (record as any).assistant_surgeon_name);
  const anesthetist = cleanDoc(record.anesthetist?.name || (record as any).anesthetist_name);
  const guestList: Array<{ name: string; role?: string; fee?: number }> = (record as any).guest_surgeons || [];

  return (
    <PrintableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Operation Theatre (OT) Operative Record"
      subtitle={`Surgical notes & anesthesia record for ${admission.patient.name}`}
      maxWidth="max-w-4xl"
    >
      {({ hideHeader }: { hideHeader: boolean }) => (
        <A4Sheet
          header={
            <PrintableReportHeader
              title="Operation Theatre & Operative Record"
              badge={`OT • ${record.surgery_category?.toUpperCase() || 'MAJOR'}`}
              hideHospitalHeader={hideHeader}
              department="Operation Theatre (OT) & Surgical Suites"
              patient={{
                name: admission.patient.name,
                vid: admission.patient.vid,
                age: admission.patient.age,
                gender: admission.patient.gender,
                blood_group: admission.patient.blood_group,
              }}
              doctor={{
                name: leadSurgeon !== '—' ? leadSurgeon : (typeof admission.admitting_doctor === 'object' ? admission.admitting_doctor?.name : admission.admitting_doctor),
              }}
              metaFields={[
                { label: 'Procedure', value: record.procedure_name },
                { label: 'OT Status', value: record.status },
                { label: 'Total Duration', value: `${record.total_ot_hours || 0} hrs` },
                { label: 'Ward & Bed', value: `${admission.bed.ward_name} • Bed ${admission.bed.bed_number}` },
              ]}
            />
          }
          footer={<PrintableReportFooter signatoryName={`Dr. ${leadSurgeon}`} signatoryTitle="Lead Operating Surgeon" />}
          className="space-y-4 text-xs font-sans text-slate-800 p-8"
        >
          {/* Timeline and Surgical Details */}
          <div className="border border-slate-300 rounded-lg p-3 bg-white space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] border-b border-slate-200 pb-2">
              <div>
                <span className="text-slate-400 text-[9px] uppercase block font-semibold">Wheel In Time</span>
                <span className="font-mono font-bold text-slate-800">{formatDateTime(record.wheel_in_time)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] uppercase block font-semibold">Wheel Out Time</span>
                <span className="font-mono font-bold text-slate-800">{formatDateTime(record.wheel_out_time)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] uppercase block font-semibold">Total OT Duration</span>
                <span className="font-bold text-indigo-700">{record.total_ot_hours} hours</span>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] uppercase block font-semibold">Surgery Classification</span>
                <span className="font-bold text-slate-800">{record.surgery_category}</span>
              </div>
            </div>

            {/* Surgical Team */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-400 text-[9px] uppercase block font-semibold">Lead Operating Surgeon</span>
                <span className="font-bold text-slate-900">Dr. {leadSurgeon}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] uppercase block font-semibold">Assistant Surgeon</span>
                <span className="font-semibold text-slate-800">{asstSurgeon !== '—' ? `Dr. ${asstSurgeon}` : '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] uppercase block font-semibold">Anesthesiologist</span>
                <span className="font-bold text-slate-900">{anesthetist !== '—' ? `Dr. ${anesthetist}` : '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] uppercase block font-semibold">Scrub Nurse</span>
                <span className="font-semibold text-slate-800">{record.scrub_nurse?.name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] uppercase block font-semibold">Circulating Nurse</span>
                <span className="font-semibold text-slate-800">{record.circulating_nurse?.name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] uppercase block font-semibold">Anesthesia Type</span>
                <span className="font-bold text-indigo-800">{record.anesthesia_type || 'General'}</span>
              </div>
            </div>

            {guestList.length > 0 && (
              <div className="pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-400 text-[9px] uppercase block font-semibold">Guest / Visiting Specialists</span>
                <div className="flex flex-wrap gap-2 mt-0.5">
                  {guestList.map((g, idx) => (
                    <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-medium">
                      Dr. {cleanDoc(g.name)} {g.role ? `(${g.role})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Diagnoses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
              <span className="font-bold text-slate-700 uppercase text-[9px] block mb-1">Pre-Operative Diagnosis</span>
              <p className="text-slate-800">{record.pre_op_diagnosis || '—'}</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
              <span className="font-bold text-slate-700 uppercase text-[9px] block mb-1">Post-Operative Diagnosis</span>
              <p className="text-slate-800">{record.post_op_diagnosis || record.pre_op_diagnosis || '—'}</p>
            </div>
          </div>

          {/* Operative Notes & Findings */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-1.5 text-[11px]">
            <span className="font-bold text-slate-700 uppercase text-[10px] block border-b pb-1">
              Operative Technique &amp; Findings
            </span>
            <p className="text-slate-800 whitespace-pre-line leading-relaxed">
              {record.operative_notes || 'No operative notes documented.'}
            </p>
          </div>

          {/* Post-Op Orders */}
          {record.post_op_orders && (
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-1 text-[11px]">
              <span className="font-bold text-slate-700 uppercase text-[10px] block border-b pb-1">
                Post-Operative Orders / Instructions
              </span>
              <p className="text-slate-800 whitespace-pre-line">{record.post_op_orders}</p>
            </div>
          )}
        </A4Sheet>
      )}
    </PrintableModal>
  );
}
