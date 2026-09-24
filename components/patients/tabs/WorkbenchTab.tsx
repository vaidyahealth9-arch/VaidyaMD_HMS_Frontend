'use client';

import React from 'react';
import OPDWorkbench from '@/components/opd/OPDWorkbench';

interface WorkbenchTabProps {
  patientId: string;
  appointment?: any;
  activeAppointment?: any;
  onBack: () => void;
}

export default function WorkbenchTab({
  patientId,
  appointment,
  activeAppointment: propActiveAppt,
  onBack,
}: WorkbenchTabProps) {
  const activeAppointment = appointment || propActiveAppt;
  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <OPDWorkbench
        patientId={patientId}
        appointment={activeAppointment}
        triageData={activeAppointment?.metadata_?.triage || activeAppointment?.metadata?.triage}
        onBack={onBack}
      />
    </div>
  );
}
