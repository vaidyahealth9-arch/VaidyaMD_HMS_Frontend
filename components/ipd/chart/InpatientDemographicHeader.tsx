'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import {
  Droplet,
  Phone,
  ExternalLink,
  Edit2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { authApi } from '@/lib/api';
import type { AdmissionDetails } from '@/features/ipd/types';
import EditAdmissionMetadataModal, { formatDoctorName } from '../modals/EditAdmissionMetadataModal';
import InpatientFinancialSummary from './InpatientFinancialSummary';
import InpatientAllergyRiskBar from './InpatientAllergyRiskBar';

interface InpatientDemographicHeaderProps {
  admission: AdmissionDetails;
  onAddAllergy: (allergy: string) => void;
  onRemoveAllergy: (allergy: string) => void;
  onToggleRisk: (key: string) => void;
  onRefreshAdmission?: () => void;
}

export default function InpatientDemographicHeader({
  admission,
  onAddAllergy,
  onRemoveAllergy,
  onToggleRisk,
  onRefreshAdmission,
}: InpatientDemographicHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFinancialSummary, setShowFinancialSummary] = useState(false);

  // Fetch doctors roster for re-assignment
  const { data: doctors = [] } = useQuery({
    queryKey: ['ipd-doctors'],
    queryFn: () => authApi.getDoctors(),
    staleTime: 60000,
  });

  const doctorDisplayName = formatDoctorName(admission.admitting_doctor?.name);
  const doctorSpecialization = admission.admitting_doctor?.specialization;

  return (
    <Card className="border-slate-200 shadow-2xs overflow-hidden bg-white">
      {/* 1. Main Demographic & Identity Bar */}
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-start gap-3.5 min-w-0">
          {/* Patient Photo or Initial Avatar */}
          {admission.patient.photo_url ? (
            <img
              src={admission.patient.photo_url}
              alt={admission.patient.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-lg flex items-center justify-center shadow-xs shrink-0">
              {admission.patient.name?.[0]?.toUpperCase() || 'P'}
            </div>
          )}

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">{admission.patient.name}</h2>
              <Badge variant="purple" className="font-mono text-xs font-bold">
                {admission.patient.vid}
              </Badge>
              <Badge variant="success" className="text-xs font-bold">
                Day {admission.duration_days} of stay
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs text-slate-600">
                {admission.admission_number}
              </Badge>

              {/* Patient 360 EMR Quick Link */}
              <a
                href={`/patients/${admission.patient.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 hover:text-indigo-900 border border-indigo-200 rounded-md hover:bg-indigo-100/70 transition-colors shadow-2xs"
                title="Open comprehensive Patient 360 EMR profile in new tab"
              >
                <ExternalLink className="w-3 h-3 text-indigo-600" />
                <span>Patient 360</span>
              </a>
            </div>

            <div className="flex items-center gap-3.5 text-xs text-slate-500 flex-wrap">
              <span>
                {admission.patient.gender || ''} {admission.patient.age ? `· ${admission.patient.age}y` : ''}
              </span>
              {admission.patient.blood_group && (
                <span className="flex items-center gap-1 font-semibold text-rose-600">
                  <Droplet className="w-3 h-3 fill-rose-600" />
                  {admission.patient.blood_group}
                </span>
              )}
              {admission.patient.phone && (
                <a
                  href={`tel:${admission.patient.phone}`}
                  className="flex items-center gap-1 hover:text-indigo-600 font-medium"
                >
                  <Phone className="w-3 h-3" />
                  {admission.patient.phone}
                </a>
              )}
              <span>
                Admitted:{' '}
                <span className="font-semibold text-slate-700">
                  {new Date(admission.admission_date).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Bed Location & Attending Doctor (With Quick Edit) */}
        <div className="flex items-center gap-4 lg:border-l lg:pl-5 border-slate-200 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bed Location</span>
            <p className="text-base font-bold text-indigo-700 font-mono">{admission.bed.bed_number}</p>
            <p className="text-xs text-slate-500">{admission.bed.ward_name} ({admission.bed.bed_type})</p>
          </div>

          <div className="h-9 w-px bg-slate-200 hidden sm:block" />

          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attending Doctor</span>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-colors"
                title="Reassign doctor or edit diagnosis"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
            <p className="text-sm font-bold text-slate-900">{doctorDisplayName}</p>
            <p className="text-xs text-slate-500">
              {doctorSpecialization || `Rate: ${formatCurrency(admission.bed.daily_rate)}/day`}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Clinical Diagnosis, Allergies, & Safety Risk Chips Bar */}
      <InpatientAllergyRiskBar
        diagnosis={admission.diagnosis}
        allergies={admission.allergies}
        riskFactors={admission.risk_factors}
        onAddAllergy={onAddAllergy}
        onRemoveAllergy={onRemoveAllergy}
        onToggleRisk={onToggleRisk}
        onEditMetadata={() => setIsEditModalOpen(true)}
        showFinancialSummary={showFinancialSummary}
        onToggleFinancialSummary={() => setShowFinancialSummary((prev) => !prev)}
      />

      {/* 3. Collapsible Financial & Partner Details */}
      {showFinancialSummary && <InpatientFinancialSummary admission={admission} />}

      {/* 4. Edit Doctor & Diagnosis Metadata Modal */}
      <EditAdmissionMetadataModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        admissionId={admission.id}
        currentDoctorId={admission.admitting_doctor?.id}
        currentDiagnosis={admission.diagnosis}
        currentCreditLimit={admission.credit_limit}
        doctors={doctors}
        onSuccess={() => onRefreshAdmission?.()}
      />
    </Card>
  );
}
