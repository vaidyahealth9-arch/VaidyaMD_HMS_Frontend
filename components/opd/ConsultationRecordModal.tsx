'use client';

import React from 'react';
import {
  X,
  Clock,
  FileText,
  HeartPulse,
  Stethoscope,
  FlaskConical,
  Pill,
  Printer,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { formatDateTime } from '@/lib/utils';

interface ConsultationRecordModalProps {
  record: any;
  onClose: () => void;
  onLoadForEdit: (record: any) => void;
  onPrintRx: (record: any) => void;
}

export default function ConsultationRecordModal({
  record,
  onClose,
  onLoadForEdit,
  onPrintRx,
}: ConsultationRecordModalProps) {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rail-bg/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg">Consultation Record</h3>
              <Badge
                variant="outline"
                className="text-[10px] bg-primary/10 text-primary border-primary/20"
              >
                {record.record_type || 'OPD Consultation'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {formatDateTime(record.created_at || record.updated_at || record.data?.created_at)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 divide-y divide-slate-100">
          {/* Section 1: Subjective & History */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Subjective &amp; History</span>
            </h4>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/70 space-y-3">
              <div>
                <span className="font-semibold text-slate-700 text-xs">Chief Complaints:</span>
                <p className="text-xs font-medium text-slate-900 mt-1 whitespace-pre-line">
                  {record.data?.chief_complaints || 'None recorded'}
                </p>
              </div>
              {(record.data?.history_of_illness ||
                record.data?.present_history ||
                record.data?.previous_history ||
                record.data?.past_medical_history) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200/60">
                  {(record.data?.history_of_illness || record.data?.present_history) && (
                    <div>
                      <span className="font-semibold text-slate-600 text-xs">History of Present Illness (HPI):</span>
                      <p className="text-xs text-slate-800 mt-0.5 whitespace-pre-line">
                        {record.data?.history_of_illness || record.data?.present_history}
                      </p>
                    </div>
                  )}
                  {(record.data?.previous_history || record.data?.past_medical_history) && (
                    <div>
                      <span className="font-semibold text-slate-600 text-xs">Past Medical / Surgical Hx:</span>
                      <p className="text-xs text-slate-800 mt-0.5 whitespace-pre-line">
                        {record.data?.previous_history || record.data?.past_medical_history}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Vitals & Physical Examination */}
          {(record.data?.vitals ||
            record.data?.examination ||
            record.data?.cvs_findings ||
            record.data?.rs_findings ||
            record.data?.cns_findings) && (
            <div className="pt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                <span>Objective &amp; Examination</span>
              </h4>

              {record.data?.vitals && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-rose-50/30 p-3 rounded-lg border border-rose-100">
                  <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">BP</span>
                    <span className="text-xs font-bold text-slate-800">{record.data.vitals.bp || '—'}</span>
                  </div>
                  <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Heart Rate</span>
                    <span className="text-xs font-bold text-slate-800">{record.data.vitals.hr ? `${record.data.vitals.hr} bpm` : '—'}</span>
                  </div>
                  <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Resp Rate</span>
                    <span className="text-xs font-bold text-slate-800">{record.data.vitals.rr ? `${record.data.vitals.rr} /m` : '—'}</span>
                  </div>
                  <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Temp</span>
                    <span className="text-xs font-bold text-slate-800">{record.data.vitals.temp ? `${record.data.vitals.temp} °F` : '—'}</span>
                  </div>
                  <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">SpO2</span>
                    <span className="text-xs font-bold text-slate-800">{record.data.vitals.spo2 ? `${record.data.vitals.spo2}%` : '—'}</span>
                  </div>
                  <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Weight</span>
                    <span className="text-xs font-bold text-slate-800">{record.data.vitals.weight ? `${record.data.vitals.weight} kg` : '—'}</span>
                  </div>
                  <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Height</span>
                    <span className="text-xs font-bold text-slate-800">{record.data.vitals.height ? `${record.data.vitals.height} cm` : '—'}</span>
                  </div>
                  <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">BMI</span>
                    <span className="text-xs font-bold text-slate-800">{record.data.vitals.bmi || '—'}</span>
                  </div>
                </div>
              )}

              {record.data?.examination && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                  <span className="font-semibold text-slate-700 text-xs">Physical Examination:</span>
                  <p className="text-xs text-slate-800 mt-1 whitespace-pre-line">{record.data.examination}</p>
                </div>
              )}

              {(record.data?.cvs_findings || record.data?.rs_findings || record.data?.cns_findings) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                  {record.data?.cvs_findings && (
                    <div>
                      <span className="font-bold text-slate-500 text-[10px] uppercase">CVS</span>
                      <p className="text-slate-800 mt-0.5">{record.data.cvs_findings}</p>
                    </div>
                  )}
                  {record.data?.rs_findings && (
                    <div>
                      <span className="font-bold text-slate-500 text-[10px] uppercase">RS</span>
                      <p className="text-slate-800 mt-0.5">{record.data.rs_findings}</p>
                    </div>
                  )}
                  {record.data?.cns_findings && (
                    <div>
                      <span className="font-bold text-slate-500 text-[10px] uppercase">CNS</span>
                      <p className="text-slate-800 mt-0.5">{record.data.cns_findings}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 3: Assessment & Diagnostics */}
          <div className="pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-primary" />
              <span>Assessment &amp; Diagnosis</span>
            </h4>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/70 space-y-3">
              <div>
                <span className="font-semibold text-slate-700 text-xs">Provisional / Final Diagnosis:</span>
                <p className="text-sm font-bold text-text-main mt-0.5">
                  {record.data?.provisional_diagnosis || record.data?.diagnosis || 'Clinical Review'}
                </p>
              </div>
              {(record.data?.investigations_to_be_advised ||
                record.data?.investigations_ordered ||
                record.data?.previous_investigations) && (
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                    <FlaskConical className="w-3.5 h-3.5 text-primary" />
                    <span>Investigations:</span>
                  </span>
                  <p className="text-xs text-slate-800 mt-1 whitespace-pre-line">
                    {record.data?.investigations_to_be_advised ||
                      record.data?.investigations_ordered ||
                      record.data?.previous_investigations}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Treatment & Medications */}
          <div className="pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-emerald-600" />
              <span>Treatment Plan &amp; Regimen</span>
            </h4>

            {Array.isArray(record.data?.medications) && record.data.medications.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Drug / Medicine Name</th>
                      <th className="p-2.5">Dose</th>
                      <th className="p-2.5">Frequency</th>
                      <th className="p-2.5">Duration</th>
                      <th className="p-2.5">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {record.data.medications.map((m: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">{m.drug_name || m.drug || '—'}</td>
                        <td className="p-2.5 font-semibold text-slate-700">{m.dose || '—'}</td>
                        <td className="p-2.5">
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 text-[11px] font-bold">
                            {m.frequency || m.freq || 'OD'}
                          </span>
                        </td>
                        <td className="p-2.5 font-medium text-slate-700">{m.duration || '—'}</td>
                        <td className="p-2.5 text-slate-600">{m.instructions || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(record.data?.treatment_notes || record.data?.plan) && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                <span className="font-semibold text-slate-700 text-xs">Treatment &amp; Dietary Advice:</span>
                <p className="text-xs text-slate-800 mt-1 whitespace-pre-line">
                  {record.data?.treatment_notes || record.data?.plan}
                </p>
              </div>
            )}

            {record.data?.future_consultation_notes && (
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  <span>Notes for Future Consultation Reference</span>
                </h4>
                <p className="text-xs text-amber-950 whitespace-pre-line font-medium">
                  {record.data.future_consultation_notes}
                </p>
              </div>
            )}

            {record.data?.follow_up && (
              <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                <span className="font-bold text-slate-500">Next Follow-Up:</span>
                <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {record.data.follow_up.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onLoadForEdit(record);
                onClose();
              }}
              className="text-amber-800 border-amber-300 hover:bg-amber-50 rounded-md font-bold px-4 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Load into Workbench (Edit)</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onPrintRx(record)}
              className="text-[rgb(var(--clr-primary))] border-[rgb(var(--clr-primary)/0.2)] hover:bg-[rgb(var(--clr-primary)/0.08)] rounded-md font-semibold px-4 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[rgb(var(--clr-primary))]" />
              <span>Print Prescription (Rx)</span>
            </Button>
          </div>
          <Button
            type="button"
            onClick={onClose}
            className="bg-primary hover:bg-primary-mid text-white rounded-md font-bold px-6 cursor-pointer"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
