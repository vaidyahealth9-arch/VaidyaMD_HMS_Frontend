'use client';

import React, { useState } from 'react';
import { Activity, Clock, CalendarClock, Printer } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime } from '@/lib/utils';
import type { NursingTask, AdmissionDetails } from '@/features/ipd/types';
import PrintVitalsFlowsheetModal from '../modals/PrintVitalsFlowsheetModal';

interface VitalsFlowsheetTabProps {
  admissionId: string;
  bedId: string;
  patientName: string;
  bedNumber: string;
  nursingTasks: NursingTask[];
  admission?: AdmissionDetails;
  onOpenVitalsModal: (admissionId: string, bedId: string, patientName: string, bedNumber: string) => void;
  onOpenRescheduleModal?: (task: any) => void;
}

export default function VitalsFlowsheetTab({
  admissionId,
  bedId,
  patientName,
  bedNumber,
  nursingTasks,
  admission,
  onOpenVitalsModal,
  onOpenRescheduleModal,
}: VitalsFlowsheetTabProps) {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const completedVitals = (nursingTasks || []).filter(
    (t) => t.vitals_payload && Object.keys(t.vitals_payload).length > 0
  );

  const pendingVitalTask = (nursingTasks || []).find(
    (t) => (t.task_type || '').toLowerCase().includes('vital') && (t.status || '').toLowerCase() === 'pending'
  );
  const activeFrequency = pendingVitalTask?.frequency || 'Q4H';

  return (
    <>
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">Physiological Vitals Telemetry Flowsheet</CardTitle>
            <p className="text-xs text-slate-500">Record and review bedside telemetry, SpO2, blood pressure, and pain scores</p>
          </div>
          <div className="flex items-center gap-2">
            {completedVitals.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPrintModalOpen(true)}
                className="h-8 text-xs font-semibold gap-1 text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print Flowsheet</span>
              </Button>
            )}

            {onOpenRescheduleModal && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onOpenRescheduleModal(
                    pendingVitalTask || {
                      id: undefined,
                      admission_id: admissionId,
                      bed_id: bedId,
                      patient_name: patientName,
                      bed_number: bedNumber,
                      frequency: activeFrequency,
                    }
                  )
                }
                className="h-8 text-xs font-semibold gap-1.5 border-slate-200 hover:bg-slate-100 shadow-2xs"
              >
                <CalendarClock className="w-3.5 h-3.5 text-blue-600" />
                <span>Update Schedule</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => onOpenVitalsModal(admissionId, bedId, patientName, bedNumber)}
              className="h-8 text-xs font-bold gap-1 bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Record Vitals Reading</span>
            </Button>
          </div>
        </CardHeader>

        {/* Monitoring Regimen Strip */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-medium">Active Monitoring Regimen:</span>
            <Badge variant="purple" className="text-xs font-bold">
              {activeFrequency}
            </Badge>
            {pendingVitalTask?.scheduled_time && (
              <span className="text-slate-500 text-[11px] flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                Next Scheduled: {formatDateTime(pendingVitalTask.scheduled_time)}
              </span>
            )}
          </div>
        </div>

        <CardContent className="p-0">
          {completedVitals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Recorded At</th>
                    <th className="p-3">Blood Pressure (mmHg)</th>
                    <th className="p-3">Pulse (bpm)</th>
                    <th className="p-3">SpO2 (%)</th>
                    <th className="p-3">Body Temp (°F)</th>
                    <th className="p-3">Resp. Rate</th>
                    <th className="p-3">GRBS (mg/dL)</th>
                    <th className="p-3">Pain Score</th>
                    <th className="p-3">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedVitals.map((v) => {
                    const payload = (v.vitals_payload || {}) as Record<string, any>;
                    const pulse = payload.pulse ?? payload.pulse_bpm;
                    const spo2 = payload.spo2 ?? payload.spo2_percent;
                    const temp = payload.temperature ?? payload.temperature_f;
                    const resp = payload.respiratory_rate ?? payload.respiratory_rate_bpm;
                    const grbs = payload.grbs ?? payload.grbs_mg_dl;
                    const pain = payload.pain_score;

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-medium text-slate-700">
                          {formatDateTime(v.completed_at || v.scheduled_time)}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {payload.bp_systolic && payload.bp_diastolic
                            ? `${payload.bp_systolic}/${payload.bp_diastolic}`
                            : payload.bp || '—'}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{pulse ? `${pulse} bpm` : '—'}</td>
                        <td className="p-3 font-bold text-indigo-700">{spo2 ? `${spo2}%` : '—'}</td>
                        <td className="p-3">{temp ? `${temp}°F` : '—'}</td>
                        <td className="p-3">{resp ? String(resp) : '—'}</td>
                        <td className="p-3 font-mono">{grbs ? `${grbs} mg/dL` : '—'}</td>
                        <td className="p-3 font-semibold text-rose-600">
                          {pain !== undefined && pain !== null && pain !== '' ? `${pain}/10` : '—'}
                        </td>
                        <td className="p-3 text-slate-500">{v.completed_by_name || 'Staff Nurse'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No Vitals Recorded Yet"
              subtitle="Capture initial baseline vitals and monitor bedside telemetry."
              action={
                <Button
                  size="sm"
                  onClick={() => onOpenVitalsModal(admissionId, bedId, patientName, bedNumber)}
                  className="h-8 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
                >
                  Record First Reading
                </Button>
              }
              className="py-12"
            />
          )}
        </CardContent>
      </Card>

      {/* Print Flowsheet Modal */}
      {isPrintModalOpen && (
        <PrintVitalsFlowsheetModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          admission={admission}
          patientName={patientName}
          bedNumber={bedNumber}
          vitalsTasks={nursingTasks}
        />
      )}
    </>
  );
}
