'use client';

import React from 'react';
import OPDWorkbench from '@/components/opd/OPDWorkbench';

interface WorkbenchTabProps {
  patientId: string;
  patient?: any;
  appointment?: any;
  activeAppointment?: any;
  onBack: () => void;
}

export default function WorkbenchTab({
  patientId,
  patient,
  appointment,
  activeAppointment: propActiveAppt,
  onBack,
}: WorkbenchTabProps) {
  const activeAppointment = appointment || propActiveAppt;
  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <OPDWorkbench
        patientId={patientId}
        patient={patient}
        appointment={activeAppointment}
        triageData={activeAppointment?.metadata_?.triage || activeAppointment?.metadata?.triage}
        onBack={onBack}
      />
    </div>
  );
}
