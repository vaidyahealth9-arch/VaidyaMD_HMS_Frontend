'use client';

import React from 'react';
import { Activity, Clock, CalendarClock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime } from '@/lib/utils';
import type { NursingTask } from '@/features/ipd/types';

interface VitalsFlowsheetTabProps {
  admissionId: string;
  bedId: string;
  patientName: string;
  bedNumber: string;
  nursingTasks: NursingTask[];
  onOpenVitalsModal: (admissionId: string, bedId: string, patientName: string, bedNumber: string) => void;
  onOpenRescheduleModal?: (task: any) => void;
}

export default function VitalsFlowsheetTab({
  admissionId,
  bedId,
  patientName,
  bedNumber,
  nursingTasks,
  onOpenVitalsModal,
  onOpenRescheduleModal,
}: VitalsFlowsheetTabProps) {
  const completedVitals = (nursingTasks || []).filter(
    (t) => t.vitals_payload && Object.keys(t.vitals_payload).length > 0
  );

  const pendingVitalTask = (nursingTasks || []).find(
    (t) => (t.task_type || '').toLowerCase().includes('vital') && (t.status || '').toLowerCase() === 'pending'
  );
  const activeFrequency = pendingVitalTask?.frequency || 'Q4H';

  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900">Physiological Vitals Telemetry Flowsheet</CardTitle>
          <p className="text-xs text-slate-500">Record and review bedside telemetry, SpO2, blood pressure, and pain scores</p>
        </div>
        <div className="flex items-center gap-2">
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
            className="h-8 text-xs font-bold gap-1 bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
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
                  <th className="p-3">Staff Nurse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {completedVitals.map((t) => {
                  const vp = (t.vitals_payload || {}) as Record<string, any>;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-500">
                        {formatDateTime(t.completed_at)}
                      </td>
                      <td className="p-3 font-bold text-slate-900 font-mono">
                        {String(vp.bp || (vp.bp_systolic ? `${vp.bp_systolic}/${vp.bp_diastolic || ''}` : '—'))}
                      </td>
                      <td className="p-3 text-slate-800 font-mono">{vp.pulse ? `${String(vp.pulse)}` : '—'}</td>
                      <td className="p-3">
                        {vp.spo2 ? (
                          <Badge
                            variant={Number(vp.spo2) < 92 ? 'destructive' : 'success'}
                            className="font-mono text-xs"
                          >
                            {String(vp.spo2)}%
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 text-slate-800 font-mono">
                        {vp.temperature ? `${String(vp.temperature)} °F` : '—'}
                      </td>
                      <td className="p-3 text-slate-700 font-mono">{vp.respiratory_rate ? `${String(vp.respiratory_rate)}/min` : '—'}</td>
                      <td className="p-3 text-slate-700 font-mono">{vp.grbs ? `${String(vp.grbs)}` : '—'}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900">{String(vp.pain_score ?? 0)}</span>/10
                      </td>
                      <td className="p-3 text-slate-500">{t.completed_by_name || 'Staff Nurse'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Activity}
            title="No Vitals Telemetry Logged Yet"
            subtitle="Bedside vital signs recorded during nursing checks and rounds will populate this flowsheet."
          />
        )}
      </CardContent>
    </Card>
  );
}
