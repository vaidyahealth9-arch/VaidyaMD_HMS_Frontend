'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Plus, Check, FileCheck, FlaskConical, Users } from 'lucide-react';
import { treatmentCyclesApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import {
  CycleSubTab,
  TreatmentCycleRecord,
  TreatmentCyclesOverviewTable,
  TreatmentCycleSubTabs,
  IntendedTreatmentPanel,
  GametesPanel,
  PgsPgdPanel,
  TreatmentPlanPanel,
  EndometrialMonitoringPanel,
  SummaryPanel,
  PlanDetailsSubTabContent,
  createEmptyDraftCycle,
} from '@/components/fertility/plan-details';

interface TreatmentCyclesTabProps {
  patientId: string;
  patient?: any;
  partner?: any;
  userId: string;
  cycles: any[];
  activeCycle: any;
  cycleCalendar: any;
  setActiveCycle: (cycle: any) => void;
  setCycleCalendar: (cal: any) => void;
  onRefreshData: () => void;
  onOpenConsentModal: () => void;
  onOpenOpuModal: () => void;
  onOpenEmbryologyModal: () => void;
  onOpenEtDischargeModal: () => void;
  isCreatingCycle?: boolean;
  setIsCreatingCycle?: (val: boolean) => void;
}

export default function TreatmentCyclesTab({
  patientId,
  patient,
  partner,
  userId,
  cycles,
  activeCycle,
  cycleCalendar,
  setActiveCycle,
  setCycleCalendar,
  onRefreshData,
  onOpenConsentModal,
  onOpenOpuModal,
  onOpenEmbryologyModal,
  onOpenEtDischargeModal,
  isCreatingCycle: propIsCreating,
  setIsCreatingCycle: propSetIsCreating,
}: TreatmentCyclesTabProps) {
  const router = useRouter();
  const [internalIsCreating, setInternalIsCreating] = useState(false);
  const isCreatingCycle = propIsCreating !== undefined ? propIsCreating : internalIsCreating;
  const setIsCreatingCycle = propSetIsCreating || setInternalIsCreating;

  const [activeSubTab, setActiveSubTab] = useState<CycleSubTab>(
    isCreatingCycle ? 'intended' : 'plan_details'
  );

  const [draftCycle, setDraftCycle] = useState<TreatmentCycleRecord>(() =>
    createEmptyDraftCycle(patientId, (cycles?.length || 0) + 1)
  );
  const [draftCalendar, setDraftCalendar] = useState<any>({ days: [] });
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);

  useEffect(() => {
    if (isCreatingCycle) {
      setActiveSubTab('intended');
      setDraftCycle((prev) => ({
        ...prev,
        patient_id: patientId,
        attempt_number: (cycles?.length || 0) + 1,
      }));
    }
  }, [isCreatingCycle, cycles?.length, patientId]);

  const handleCycleUpdated = (updated: TreatmentCycleRecord) => {
    if (isCreatingCycle) {
      setDraftCycle(updated);
      if (updated.medication_calendar) setDraftCalendar({ days: updated.medication_calendar });
    } else {
      setActiveCycle(updated);
      onRefreshData();
    }
  };

  const handleFinalizeCreateCycle = async (forcedStatus?: 'planned' | 'running') => {
    setIsSubmittingDraft(true);
    try {
      const finalStatus = forcedStatus || draftCycle.status || 'running';
      const payload = {
        patient_id: patientId,
        partner_id: partner?.id || undefined,
        treating_doctor_id: draftCycle.treating_doctor_id || userId,
        treatment_type: draftCycle.treatment_type || 'ICSI',
        attempt_number: Number(draftCycle.attempt_number || 1),
        status: finalStatus,
        start_date: draftCycle.start_date || new Date().toISOString().split('T')[0],
        female_factors: draftCycle.female_factors || [],
        male_factors: draftCycle.male_factors || [],
        treatment_at_other_centre: draftCycle.treatment_at_other_centre || false,
        previous_centre_name: draftCycle.previous_centre_name || undefined,
        protocol_template_id: (draftCycle as any).protocol_template_id || undefined,
        sentinel_dates: draftCycle.sentinel_dates || {},
        gametes_source: draftCycle.gametes_source || {},
        pgs_pgd_data: draftCycle.pgs_pgd_data || {},
        endometrial_monitoring: draftCycle.endometrial_monitoring || [],
        medication_calendar: draftCalendar?.days || draftCycle.medication_calendar || [],
        remarks: draftCycle.remarks || '',
        created_by: userId,
      };

      const created = await treatmentCyclesApi.create(payload);
      toast.success('Treatment Cycle Started', `${created.cycle_id || 'Cycle'} created successfully with status ${finalStatus === 'running' ? 'In Progress' : 'Planned'}.`);
      setIsCreatingCycle(false);
      onRefreshData();
      if (created) {
        setActiveCycle(created);
        treatmentCyclesApi.getCalendar(created.id).then((cal: any) => setCycleCalendar(cal)).catch(() => {});
      }
    } catch (err: any) {
      toast.error('Failed to create cycle', err.message || 'An error occurred');
    } finally {
      setIsSubmittingDraft(false);
    }
  };

  const displayCycle = isCreatingCycle ? draftCycle : activeCycle;
  const displayCalendar = isCreatingCycle ? draftCalendar : cycleCalendar;

  const quickActions = [
    { label: 'Consents', icon: FileCheck, cls: 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800', onClick: onOpenConsentModal },
    { label: 'OPU Report', icon: Activity, cls: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800', onClick: onOpenOpuModal },
    { label: 'Embryology', icon: FlaskConical, cls: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800', onClick: onOpenEmbryologyModal },
    { label: 'ET Protocol', icon: Users, cls: 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700', onClick: onOpenEtDischargeModal },
  ];

  const subTabContent = useMemo(() => {
    if (!displayCycle) return null;
    switch (activeSubTab) {
      case 'intended':
        return <IntendedTreatmentPanel cycle={displayCycle} partner={partner} onUpdateCycle={handleCycleUpdated} onNavigateNext={() => setActiveSubTab('gametes')} />;
      case 'gametes':
        return <GametesPanel cycle={displayCycle} onUpdateCycle={handleCycleUpdated} onNavigateNext={() => setActiveSubTab('pgs_pgd')} />;
      case 'pgs_pgd':
        return <PgsPgdPanel cycle={displayCycle} onUpdateCycle={handleCycleUpdated} onNavigateNext={() => setActiveSubTab('treatment_plan')} />;
      case 'treatment_plan':
        return <TreatmentPlanPanel cycle={displayCycle} onUpdateCycle={handleCycleUpdated} onNavigateNext={() => setActiveSubTab('endometrial')} />;
      case 'endometrial':
        return <EndometrialMonitoringPanel cycle={displayCycle} onUpdateCycle={handleCycleUpdated} onNavigateNext={() => setActiveSubTab('plan_details')} />;
      case 'summary':
        return <SummaryPanel cycle={displayCycle} patient={patient} partner={partner} onUpdateCycle={handleCycleUpdated} onStartCycle={isCreatingCycle ? () => handleFinalizeCreateCycle('running') : undefined} />;
      case 'plan_details':
      default:
        return (
          <PlanDetailsSubTabContent
            activeCycle={displayCycle}
            cycleCalendar={displayCalendar}
            initialDays={displayCalendar?.days || displayCycle?.medication_calendar || []}
            onDaysChange={(savedDays, protocolInfo) => {
              if (isCreatingCycle) {
                setDraftCalendar({ days: savedDays });
                setDraftCycle((prev) => ({
                  ...prev,
                  medication_calendar: savedDays,
                  ...(protocolInfo?.protocolId ? { protocol_template_id: protocolInfo.protocolId } : {}),
                  ...(protocolInfo?.protocolName
                    ? {
                        sentinel_dates: {
                          ...(prev.sentinel_dates || {}),
                          protocol_name: protocolInfo.protocolName,
                        },
                      }
                    : {}),
                }));
              }
            }}
            patient={patient}
            partner={partner}
            onRefreshData={onRefreshData}
            onNavigateNext={() => setActiveSubTab('summary')}
          />
        );
    }
  }, [activeSubTab, displayCycle, displayCalendar, partner, patient, isCreatingCycle]);

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      <TreatmentCyclesOverviewTable
        cycles={cycles as TreatmentCycleRecord[]}
        activeCycleId={activeCycle?.id}
        onSelectCycle={(c) => {
          setIsCreatingCycle(false);
          setActiveCycle(c);
          treatmentCyclesApi.getCalendar(c.id).then((cal: any) => setCycleCalendar(cal)).catch(() => {});
        }}
      />

      {isCreatingCycle || activeCycle ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {isCreatingCycle ? (
                  <>
                    <span className="font-mono text-xs font-bold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded border border-amber-200">NEW CYCLE (DRAFT)</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">Attempt #{draftCycle?.attempt_number || 1}</span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded border border-primary/20">{activeCycle?.cycle_id}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize">{activeCycle?.status || 'Running'}</span>
                  </>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {displayCycle?.treatment_type || 'Treatment'} Cycle {isCreatingCycle ? '(Drafting New Cycle)' : `(Attempt #${displayCycle?.attempt_number || 1})`}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isCreatingCycle ? (
                  <span>Start: <strong>{displayCycle?.start_date || 'Today'}</strong> · Complete tabs and click <strong>&quot;Finalize &amp; Start Cycle&quot;</strong></span>
                ) : (
                  <span>Start: <strong>{activeCycle?.start_date || '—'}</strong> · Est. Trigger: <strong>{activeCycle?.sentinel_dates?.trigger || activeCycle?.sentinel_dates?.trigger_datetime || 'Pending'}</strong> · Est. OPU: <strong>{activeCycle?.sentinel_dates?.opu || activeCycle?.sentinel_dates?.opu_datetime || '—'}</strong></span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isCreatingCycle ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingCycle(false);
                      setDraftCycle(createEmptyDraftCycle(patientId, (cycles?.length || 0) + 1));
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinalizeCreateCycle('running')}
                    disabled={isSubmittingDraft}
                    className="px-4 py-1.5 bg-primary hover:bg-primary-mid text-white rounded-md font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSubmittingDraft ? 'Starting Cycle...' : 'Finalize & Start Cycle'}</span>
                  </button>
                </>
              ) : (
                <>
                  {quickActions.map((act) => (
                    <button key={act.label} type="button" onClick={act.onClick} className={`px-2.5 py-1.5 border rounded-md font-bold text-xs flex items-center gap-1 cursor-pointer ${act.cls}`}>
                      <act.icon className="w-3.5 h-3.5" />
                      <span>{act.label}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => router.push(`/ivf-lab?cycle_id=${activeCycle.id}`)}
                    className="px-3 py-1.5 bg-primary hover:bg-primary-mid text-white rounded-md font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>IVF Lab →</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <TreatmentCycleSubTabs
            activeTab={activeSubTab}
            onSelectTab={(tab) => {
              if (isCreatingCycle && !draftCycle.treatment_type && tab !== 'intended') {
                toast.warning('Step 1 Required', 'Please select Treatment Modality in Step 1 to unlock subsequent cycle steps.');
                return;
              }
              setActiveSubTab(tab);
            }}
            onAddNewCycle={() => {
              setDraftCycle(createEmptyDraftCycle(patientId, (cycles?.length || 0) + 1));
              setDraftCalendar({ days: [] });
              setIsCreatingCycle(true);
              setActiveSubTab('intended');
            }}
            isDraftMode={isCreatingCycle}
            isModalitySelected={Boolean(draftCycle.treatment_type)}
          />

          {subTabContent}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-2xs">
          <Activity className="w-8 h-8 text-primary mx-auto opacity-70" />
          <h3 className="text-sm font-bold text-slate-800">No Treatment Cycle Selected</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select a cycle from the overview table above or click <strong>&quot;Add New Cycle&quot;</strong> to configure a treatment timetable.
          </p>
          <button
            type="button"
            onClick={() => {
              setDraftCycle(createEmptyDraftCycle(patientId, (cycles?.length || 0) + 1));
              setDraftCalendar({ days: [] });
              setIsCreatingCycle(true);
              setActiveSubTab('intended');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-mid text-white rounded-md font-bold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Cycle</span>
          </button>
        </div>
      )}
    </div>
  );
}
