'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRightLeft,
  LogOut,
  Stethoscope,
  Activity,
  Pill,
  Droplets,
  Receipt,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import TabBar from '@/components/common/TabBar';
import Spinner from '@/components/common/Spinner';
import { ipdApi } from '@/features/ipd/api';
import { toast } from '@/contexts/ToastContext';
import type { AdmissionDetails } from '@/features/ipd/types';
import InpatientDemographicHeader from './InpatientDemographicHeader';
import DoctorRoundsTab from './DoctorRoundsTab';
import VitalsFlowsheetTab from './VitalsFlowsheetTab';
import BedsideOrdersTab from './BedsideOrdersTab';
import FluidBalanceTab from './FluidBalanceTab';
import RollingBillLedger from './RollingBillLedger';
import RescheduleVitalModal from '../modals/RescheduleVitalModal';

interface InpatientBedsideChartProps {
  admissionId: string;
  onBack: () => void;
  onTransfer: (admission: any) => void;
  onInterimBill: (admissionId: string) => void;
  onDischarge: (admissionId: string) => void;
  onOpenVitalsModal: (admissionId: string, bedId: string, patientName: string, bedNumber: string) => void;
  onRefreshParent: () => void;
}

export default function InpatientBedsideChart({
  admissionId,
  onBack,
  onTransfer,
  onDischarge,
  onOpenVitalsModal,
}: InpatientBedsideChartProps) {
  const [activeChartTab, setActiveChartTab] = useState<'rounds' | 'vitals' | 'orders' | 'fluids' | 'finance'>('rounds');
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedRescheduleTask, setSelectedRescheduleTask] = useState<any | null>(null);

  const handleOpenRescheduleModal = (task: any) => {
    setSelectedRescheduleTask(task);
    setRescheduleModalOpen(true);
  };

  // Query Inpatient Admission Details
  const { data: admission, isLoading, isError, error, refetch } = useQuery<AdmissionDetails>({
    queryKey: ['ipd-admission-details', admissionId],
    queryFn: () => ipdApi.getAdmissionDetails(admissionId),
    enabled: !!admissionId,
    refetchInterval: 15000,
  });

  // Allergy Update Mutation
  const allergyMutation = useMutation({
    mutationFn: (allergies: string[]) => ipdApi.updateAdmission(admissionId, { allergies }),
    onSuccess: () => {
      toast.success('Allergies Updated', 'Patient allergy profile updated.');
      refetch();
    },
    onError: (err: any) => toast.error('Error', err?.message),
  });

  // Risk Factors Update Mutation
  const riskMutation = useMutation({
    mutationFn: (risk_factors: Record<string, boolean>) => ipdApi.updateAdmission(admissionId, { risk_factors }),
    onSuccess: () => {
      toast.success('Clinical Risk Updated', 'Bedside clinical risk badge modified.');
      refetch();
    },
    onError: (err: any) => toast.error('Error', err?.message),
  });

  const handleAddAllergy = (allergy: string) => {
    if (!admission) return;
    const current = admission.allergies || [];
    if (!current.includes(allergy)) {
      allergyMutation.mutate([...current, allergy]);
    }
  };

  const handleRemoveAllergy = (allergy: string) => {
    if (!admission) return;
    const current = admission.allergies || [];
    allergyMutation.mutate(current.filter((a) => a !== allergy));
  };

  const handleToggleRisk = (key: string) => {
    if (!admission) return;
    const current = admission.risk_factors || {};
    riskMutation.mutate({
      ...current,
      [key]: !current[key as keyof typeof current],
    });
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="font-medium">Loading Inpatient Clinical Bedside Chart...</span>
      </div>
    );
  }

  if (isError || !admission) {
    return (
      <div className="p-12 text-center text-xs text-slate-600 flex flex-col items-center justify-center gap-3 bg-white rounded-xl border border-slate-200">
        <div className="p-3 rounded-full bg-rose-50 text-rose-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="font-semibold text-slate-800 text-sm">Unable to load bedside chart</div>
        <div className="text-slate-500 max-w-sm">{(error as any)?.message || 'There was an issue fetching the admission details. Please try again.'}</div>
        <div className="flex items-center gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={onBack} className="h-8 text-xs font-semibold">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Bedboard
          </Button>
          <Button size="sm" onClick={() => refetch()} className="h-8 text-xs font-semibold bg-[#2878a8] hover:bg-[#20638c] text-white">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="h-8 gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-300 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Bedboard Census</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onTransfer(admission)}
            className="h-8 text-xs font-semibold gap-1.5 border-slate-300 text-slate-700"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Transfer Bed</span>
          </Button>

          <Button
            size="sm"
            onClick={() => onDischarge(admission.id)}
            className="h-8 text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Discharge & Settle</span>
          </Button>
        </div>
      </div>

      {/* 2. Demographic & Safety Header */}
      <InpatientDemographicHeader
        admission={admission}
        onAddAllergy={handleAddAllergy}
        onRemoveAllergy={handleRemoveAllergy}
        onToggleRisk={handleToggleRisk}
        onRefreshAdmission={refetch}
      />

      {/* 3. Subtabs Bar */}
      <TabBar
        activeTab={activeChartTab}
        onChange={(v) => setActiveChartTab(v as any)}
        tabs={[
          { id: 'rounds', label: "Doctor's Daily Rounds", icon: Stethoscope, badge: admission.round_notes?.length || undefined },
          { id: 'vitals', label: 'Vitals & Telemetry Flowsheet', icon: Activity },
          { id: 'orders', label: 'Medications & Orders', icon: Pill, badge: admission.orders?.length || undefined },
          { id: 'fluids', label: 'Fluid Intake / Output (I/O)', icon: Droplets },
          { id: 'finance', label: 'Rolling Bill & Ledger', icon: Receipt, badge: 'Live' },
        ]}
      />

      {/* 4. Subtab Content Area */}
      <div className="space-y-4">
        {activeChartTab === 'rounds' && (
          <DoctorRoundsTab
            admissionId={admission.id}
            roundNotes={admission.round_notes || []}
            onNoteAdded={() => refetch()}
          />
        )}

        {activeChartTab === 'vitals' && (
          <VitalsFlowsheetTab
            admissionId={admission.id}
            bedId={admission.bed.id}
            patientName={admission.patient.name}
            bedNumber={admission.bed.bed_number}
            nursingTasks={admission.nursing_tasks || []}
            onOpenVitalsModal={onOpenVitalsModal}
            onOpenRescheduleModal={handleOpenRescheduleModal}
          />
        )}

        {activeChartTab === 'orders' && (
          <BedsideOrdersTab
            admissionId={admission.id}
            orders={admission.orders || []}
            patient={admission.patient}
            bed={admission.bed}
            onOrderAdded={() => refetch()}
          />
        )}

        {activeChartTab === 'fluids' && (
          <FluidBalanceTab
            admissionId={admission.id}
            fluidBalances={admission.fluid_balances || []}
            onFluidAdded={() => refetch()}
          />
        )}

        {activeChartTab === 'finance' && (
          <RollingBillLedger
            admissionId={admission.id}
            patientName={admission.patient.name}
            bedNumber={admission.bed.bed_number}
            wardName={admission.bed.ward_name}
            admittingDoctor={admission.admitting_doctor?.name || 'Attending Physician'}
            onDischarge={onDischarge}
          />
        )}
      </div>
    </div>
  );
}