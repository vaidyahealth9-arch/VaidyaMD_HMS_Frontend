'use client';

import React from 'react';
import OPDWorkbench from '@/components/opd/OPDWorkbench';

interface WorkbenchTabProps {
  patientId: string;
  patient?: any;
  partner?: any;
  appointment?: any;
  activeAppointment?: any;
  onBack: () => void;
}

export default function WorkbenchTab({
  patientId,
  patient,
  partner,
  appointment,
  activeAppointment: propActiveAppt,
  onBack,
}: WorkbenchTabProps) {
  const activeAppointment = appointment || propActiveAppt;
  const enrichedPatient = patient
    ? {
        ...patient,
        partner: partner || patient.partner,
      }
    : patient;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <OPDWorkbench
        patientId={patientId}
        patient={enrichedPatient}
        partner={partner || patient?.partner}
        appointment={activeAppointment}
        triageData={activeAppointment?.metadata_?.triage || activeAppointment?.metadata?.triage}
        onBack={onBack}
      />
    </div>
  );
}
