'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Plus, X, FileCheck, FlaskConical, Users, Calendar } from 'lucide-react';
import TreatmentCycleWizard from '@/components/fertility/TreatmentCycleWizard';
import StimulationCalendarGrid from '@/components/fertility/StimulationCalendarGrid';
import { treatmentCyclesApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';

interface TreatmentCyclesTabProps {
  patientId: string;
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

  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [addingMedDay, setAddingMedDay] = useState<number | null>(null);
  const [newMedForm, setNewMedForm] = useState({ drug_name: '', dose: '1 tab', frequency: 'OD', instructions: '' });
  const [isSavingMed, setIsSavingMed] = useState(false);

  // Automatically refresh calendar when activeCycle changes
  useEffect(() => {
    if (activeCycle?.id && (!cycleCalendar || cycleCalendar.cycle_id !== activeCycle.cycle_id)) {
      treatmentCyclesApi.getCalendar(activeCycle.id)
        .then((cal: any) => setCycleCalendar(cal))
        .catch(() => {});
    }
  }, [activeCycle?.id]);

  const handleAddMedicationToCycle = async (dayNumber: number) => {
    if (!newMedForm.drug_name.trim() || !activeCycle) return;
    setIsSavingMed(true);
    try {
      await treatmentCyclesApi.addMedication(activeCycle.id, {
        day_number: dayNumber,
        ...newMedForm,
      });
      setAddingMedDay(null);
      setNewMedForm({ drug_name: '', dose: '1 tab', frequency: 'OD', instructions: '' });
      // Refresh calendar
      treatmentCyclesApi.getCalendar(activeCycle.id)
        .then((cal: any) => setCycleCalendar(cal))
        .catch(() => {});
    } catch (err: any) {
      toast.error('Failed to add medication', err.message || 'An error occurred');
    } finally {
      setIsSavingMed(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {isCreatingCycle ? (
        <div className="space-y-4 w-full animate-in fade-in">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-5 py-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Initiate New Treatment Cycle</h2>
                <p className="text-[11px] text-slate-500">
                  Configure stimulation protocol, sentinel milestone dates &amp; gonadotropins
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatingCycle(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-md transition-colors flex items-center gap-1.5 shadow-2xs border border-slate-200"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel &amp; Return</span>
            </button>
          </div>

          <TreatmentCycleWizard
            patientId={patientId}
            partnerId={partner?.id}
            userId={userId}
            onCancel={() => setIsCreatingCycle(false)}
            onSuccess={(newCycle) => {
              setIsCreatingCycle(false);
              onRefreshData();
              if (newCycle) {
                setActiveCycle(newCycle);
                treatmentCyclesApi.getCalendar(newCycle.id)
                  .then((cal: any) => setCycleCalendar(cal))
                  .catch(() => {});
              }
            }}
          />
        </div>
      ) : activeCycle ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                  {activeCycle.cycle_id}
                </span>
                {cycles.length > 1 && (
                  <select
                    value={activeCycle.id}
                    onChange={(e) => {
                      const found = cycles.find((c) => c.id === e.target.value);
                      if (found) {
                        setActiveCycle(found);
                        treatmentCyclesApi.getCalendar(found.id)
                          .then((cal: any) => setCycleCalendar(cal))
                          .catch(() => {});
                      }
                    }}
                    className="text-xs font-bold bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-slate-700 cursor-pointer"
                  >
                    {cycles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.cycle_id} — {c.treatment_type} (Attempt #{c.attempt_number})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {activeCycle.treatment_type} Cycle (Attempt #{activeCycle.attempt_number})
              </h2>
              <p className="text-xs text-slate-500">
                {activeCycle.treatment_type?.includes('FET') ? (
                  <>
                    LMP Day 1: <strong>{activeCycle.sentinel_dates?.lmp_day1 || '—'}</strong> · P0 Date: <strong>{activeCycle.sentinel_dates?.p0_date || '—'}</strong> · Transfer Date: <strong>{activeCycle.sentinel_dates?.et || activeCycle.sentinel_dates?.transfer_date || '—'}</strong> · β-hCG: <strong>{activeCycle.sentinel_dates?.beta_hcg_date || '—'}</strong>
                  </>
                ) : activeCycle.treatment_type?.includes('IUI') || activeCycle.treatment_type?.includes('OI') ? (
                  <>
                    Cycle Day 1: <strong>{activeCycle.sentinel_dates?.lmp_day1 || '—'}</strong> · Trigger: <strong>{activeCycle.sentinel_dates?.trigger || '—'}</strong> · Insemination: <strong>{activeCycle.sentinel_dates?.insemination || activeCycle.sentinel_dates?.opu || '—'}</strong> · β-hCG: <strong>{activeCycle.sentinel_dates?.beta_hcg_date || '—'}</strong>
                  </>
                ) : (
                  <>
                    Stimulation Start: <strong>{activeCycle.sentinel_dates?.stim_start || activeCycle.sentinel_dates?.lmp_day1 || '—'}</strong> · Trigger: <strong>{activeCycle.sentinel_dates?.trigger || '—'}</strong> · OPU: <strong>{activeCycle.sentinel_dates?.opu || '—'}</strong> · ET: <strong>{activeCycle.sentinel_dates?.et || '—'}</strong>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => setShowMatrixModal(true)}
                className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-md font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Prescription Matrix & Protocol Grid"
              >
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Prescription Matrix</span>
              </button>
              <button
                type="button"
                onClick={onOpenConsentModal}
                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-md font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                title="Statutory Consent Forms"
              >
                <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Consents</span>
              </button>
              <button
                type="button"
                onClick={onOpenOpuModal}
                className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-md font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                title="Egg Retrieval / OPU Aspiration Report"
              >
                <Activity className="w-3.5 h-3.5 text-purple-600" />
                <span>OPU Report</span>
              </button>
              <button
                type="button"
                onClick={onOpenEmbryologyModal}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-md font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                title="Master Embryology & Insemination Form"
              >
                <FlaskConical className="w-3.5 h-3.5 text-primary" />
                <span>Embryology Form</span>
              </button>
              <button
                type="button"
                onClick={onOpenEtDischargeModal}
                className="px-2.5 py-1.5 bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 rounded-md font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                title="Embryo Transfer Discharge Protocol"
              >
                <Users className="w-3.5 h-3.5 text-pink-600" />
                <span>ET Protocol</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingCycle(true)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-md font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Cycle</span>
              </button>
              <button
                onClick={() => router.push(`/ivf-lab?cycle_id=${activeCycle.id}`)}
                className="px-3 py-1.5 bg-primary hover:bg-primary-mid text-white rounded-md font-bold text-xs transition-colors shadow-sm flex items-center gap-1"
              >
                <span>IVF Lab →</span>
              </button>
            </div>
          </div>

          {/* Day by Day Timetable */}
          {cycleCalendar && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Day-by-Day {activeCycle.treatment_type || 'Treatment'} Timetable &amp; Milestones
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sentinel milestones and scheduled daily medications for this cycle
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMatrixModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-mid transition-colors bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Open Interactive Matrix Grid →</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {cycleCalendar.days?.map((d: any) => (
                  <div
                    key={d.day_number}
                    className={`p-3 rounded-lg border ${
                      d.milestone || d.phase ? 'border-accent/40 bg-accent-light/50 shadow-sm' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b pb-1 mb-1">
                      <span className="font-bold text-xs text-slate-800">{d.display_date}</span>
                      <span className="text-[10px] text-slate-400">{d.day_of_week}</span>
                    </div>
                    {(d.milestone || d.phase) && (
                      <p className="text-xs font-bold text-primary-mid mb-1">
                        {d.milestone || d.phase}
                      </p>
                    )}
                    {d.stim_day_label && (
                      <span className="inline-block text-[10px] font-semibold text-slate-500 mb-1">
                        {d.stim_day_label}
                      </span>
                    )}
                    {d.medications?.map((m: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-1.5 rounded text-[11px] font-medium text-slate-700 mt-1">
                        <strong>{m.drug_name}</strong> — {m.dose} ({m.frequency})
                        {m.instructions && <span className="block text-[10px] text-slate-400">{m.instructions}</span>}
                      </div>
                    ))}

                    {addingMedDay === d.day_number ? (
                      <div className="mt-2 p-2 bg-surface-muted rounded-md border border-primary/20 space-y-2 text-xs">
                        <input
                          type="text"
                          placeholder="Drug name (e.g. Inj. Recagon 225 IU)"
                          value={newMedForm.drug_name}
                          onChange={(e) => setNewMedForm({ ...newMedForm, drug_name: e.target.value })}
                          className="vmd-input text-xs py-1 px-2 w-full font-bold"
                          autoFocus
                        />
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Dose"
                            value={newMedForm.dose}
                            onChange={(e) => setNewMedForm({ ...newMedForm, dose: e.target.value })}
                            className="vmd-input text-xs py-1 px-2 w-1/2"
                          />
                          <select
                            value={newMedForm.frequency}
                            onChange={(e) => setNewMedForm({ ...newMedForm, frequency: e.target.value })}
                            className="vmd-input text-xs py-1 px-2 w-1/2"
                          >
                            <option value="OD">OD</option>
                            <option value="BD">BD</option>
                            <option value="TDS">TDS</option>
                            <option value="Stat">Stat</option>
                            <option value="SOS">SOS</option>
                          </select>
                        </div>
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setAddingMedDay(null)}
                            className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isSavingMed || !newMedForm.drug_name.trim()}
                            onClick={() => handleAddMedicationToCycle(d.day_number)}
                            className="px-2.5 py-1 text-[10px] font-bold bg-primary text-white rounded-lg hover:bg-primary-mid transition-colors shadow-sm disabled:opacity-50"
                          >
                            {isSavingMed ? 'Adding...' : 'Add'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingMedDay(d.day_number);
                          setNewMedForm({ drug_name: '', dose: '1 tab', frequency: 'OD', instructions: '' });
                        }}
                        className="w-full mt-2 py-1 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/15 rounded-lg border border-dashed border-primary/20 transition-colors"
                      >
                        + Add Medication
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
          <Activity className="w-8 h-8 text-primary mx-auto opacity-70" />
          <h3 className="text-sm font-bold text-slate-800">No Treatment Cycle Active</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No active IVF, ICSI, or IUI treatment cycle is currently recorded for this patient. Start a new cycle to configure stimulation protocols, sentinel milestones, and medication timetables.
          </p>
          <button
            type="button"
            onClick={() => setIsCreatingCycle(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-mid text-white rounded-md font-bold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Cycle</span>
          </button>
        </div>
      )}

      {/* Interactive Prescription Matrix Modal */}
      {showMatrixModal && activeCycle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Prescription Matrix &amp; Protocol Grid — {activeCycle.treatment_type} (Cycle {activeCycle.cycle_id})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Live day-by-day prescription dosing, sentinel milestones, and folliculometry
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <StimulationCalendarGrid
                cycleId={activeCycle.id}
                startDate={activeCycle.sentinel_dates?.stim_start || activeCycle.sentinel_dates?.lmp_day1 || activeCycle.start_date}
                initialDays={cycleCalendar?.days || activeCycle.medication_calendar}
                treatmentType={activeCycle.treatment_type}
                protocolCategory={activeCycle.treatment_type?.includes('FET') ? 'fet' : 'stimulation'}
                sentinelDates={activeCycle.sentinel_dates}
                onCalendarSaved={() => {
                  treatmentCyclesApi.getCalendar(activeCycle.id)
                    .then((cal: any) => setCycleCalendar(cal))
                    .catch(() => {});
                  onRefreshData();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
