'use client';

import React from 'react';
import PrintableModal from '@/components/common/PrintableModal';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import PrintableReportFooter from '@/components/common/PrintableReportFooter';
import A4Sheet from '@/components/common/A4Sheet';
import { formatDateTime } from '@/lib/utils';
import type { AdmissionDetails, NursingTask } from '@/features/ipd/types';

interface PrintVitalsFlowsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission?: AdmissionDetails;
  patientName?: string;
  bedNumber?: string;
  vitalsTasks?: NursingTask[];
  tasks?: NursingTask[];
}

export default function PrintVitalsFlowsheetModal({
  isOpen,
  onClose,
  admission,
  patientName,
  bedNumber,
  vitalsTasks,
  tasks,
}: PrintVitalsFlowsheetModalProps) {
  if (!isOpen) return null;

  const rawList = vitalsTasks || tasks || [];
  const completedVitals = rawList
    .filter((t) => (t.task_type || '').toLowerCase().includes('vital') || (t.vitals_payload && Object.keys(t.vitals_payload).length > 0))
    .sort((a, b) => {
      const tb = new Date(b.completed_at || b.scheduled_time || 0).getTime();
      const ta = new Date(a.completed_at || a.scheduled_time || 0).getTime();
      return tb - ta;
    });

  const pName = patientName || admission?.patient.name || 'Inpatient';
  const bNum = bedNumber || admission?.bed.bed_number || '—';

  return (
    <PrintableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Inpatient Vitals & Telemetry Flowsheet"
      subtitle={`Bedside physiological observations for ${pName} (${bNum})`}
      maxWidth="max-w-4xl"
    >
      {({ hideHeader }: { hideHeader: boolean }) => (
        <A4Sheet
          header={
            <PrintableReportHeader
              title="Vitals & Telemetry Flowsheet"
              badge="IPD CLINICAL OBSERVATION"
              hideHospitalHeader={hideHeader}
              department="Inpatient Department (IPD)"
              patient={{
                name: pName,
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
                { label: 'Ward & Bed', value: `${admission?.bed.ward_name || 'IPD'} • Bed ${bNum}` },
                { label: 'Admit Date', value: admission?.admission_date ? formatDateTime(admission.admission_date) : '—' },
              ]}
            />
          }
          footer={<PrintableReportFooter />}
          className="space-y-4 text-xs font-sans text-slate-800 p-8"
        >
          {/* Vitals Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-900 font-bold uppercase text-center">
                  <th className="p-2 text-left">Time Recorded</th>
                  <th className="p-2">BP (mmHg)</th>
                  <th className="p-2">Pulse (bpm)</th>
                  <th className="p-2">Temp (°F)</th>
                  <th className="p-2">SpO2 (%)</th>
                  <th className="p-2">Resp Rate</th>
                  <th className="p-2">Pain (0-10)</th>
                  <th className="p-2 text-left">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedVitals.map((v, idx) => {
                  const p = (v.vitals_payload || {}) as Record<string, any>;
                  const pulse = p.pulse ?? p.pulse_bpm;
                  const spo2 = p.spo2 ?? p.spo2_percent;
                  const temp = p.temperature ?? p.temperature_f;
                  const resp = p.respiratory_rate ?? p.respiratory_rate_bpm;
                  const pain = p.pain_score;

                  return (
                    <tr key={v.id || idx} className="text-center hover:bg-slate-50/50">
                      <td className="p-2 text-left font-mono font-medium text-slate-700">
                        {formatDateTime(v.completed_at || v.scheduled_time)}
                      </td>
                      <td className="p-2 font-bold text-slate-900">
                        {p.bp_systolic && p.bp_diastolic
                          ? `${p.bp_systolic}/${p.bp_diastolic}`
                          : p.bp || '—'}
                      </td>
                      <td className="p-2 font-semibold text-slate-800">{pulse ? `${pulse} bpm` : '—'}</td>
                      <td className="p-2 font-bold text-indigo-700">{spo2 ? `${spo2}%` : '—'}</td>
                      <td className="p-2">{temp ? `${temp}°F` : '—'}</td>
                      <td className="p-2">{resp ? String(resp) : '—'}</td>
                      <td className="p-2 font-semibold">{pain !== undefined && pain !== null && pain !== '' ? `${pain}/10` : '—'}</td>
                      <td className="p-2 text-left text-slate-600">{v.completed_by_name || 'Staff Nurse'}</td>
                    </tr>
                  );
                })}

                {completedVitals.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                      No vitals records logged yet for this admission.
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
