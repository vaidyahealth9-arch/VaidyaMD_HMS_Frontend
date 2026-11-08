'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  BedDouble,
  UserCheck,
  Stethoscope,
  Activity,
  Pill,
  Droplets,
  Receipt,
  LogOut,
  ArrowRightLeft,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/shared/ui/sheet';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { ipdApi } from '@/features/ipd/api';
import { toast } from '@/contexts/ToastContext';
import { formatCurrency } from '@/lib/utils';
import type { AdmissionDetails, IPDOrder, RoundNote, FluidBalance } from '@/features/ipd/types';

interface InpatientBedsideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  admissionId: string | null;
  onTransfer: (admission: any) => void;
  onInterimBill: (admissionId: string) => void;
  onDischarge: (admissionId: string) => void;
  onOpenVitalsModal: (admissionId: string, bedId: string, patientName: string, bedNumber: string) => void;
  onRefreshParent: () => void;
}

export default function InpatientBedsideDrawer({
  isOpen,
  onClose,
  admissionId,
  onTransfer,
  onInterimBill,
  onDischarge,
  onOpenVitalsModal,
  onRefreshParent,
}: InpatientBedsideDrawerProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'rounds' | 'vitals' | 'orders' | 'fluids' | 'finance'>('rounds');

  // Round Note Form
  const [isAddingRoundNote, setIsAddingRoundNote] = useState(false);
  const [soapSubjective, setSoapSubjective] = useState('');
  const [soapObjective, setSoapObjective] = useState('');
  const [soapAssessment, setSoapAssessment] = useState('');
  const [soapPlan, setSoapPlan] = useState('');

  // Order Form
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [orderType, setOrderType] = useState('Medication');
  const [orderItem, setOrderItem] = useState('');
  const [orderDosage, setOrderDosage] = useState('');
  const [orderRoute, setOrderRoute] = useState('IV');
  const [orderFreq, setOrderFreq] = useState('BD');
  const [orderDuration, setOrderDuration] = useState('3 days');
  const [orderInstructions, setOrderInstructions] = useState('');

  // Fluid Balance Form
  const [isAddingFluid, setIsAddingFluid] = useState(false);
  const [fluidShift, setFluidShift] = useState('Morning');
  const [oralIn, setOralIn] = useState('');
  const [ivIn, setIvIn] = useState('');
  const [urineOut, setUrineOut] = useState('');
  const [drainOut, setDrainOut] = useState('');

  // Allergy Form
  const [newAllergy, setNewAllergy] = useState('');
  const [isAddingAllergy, setIsAddingAllergy] = useState(false);

  // Query Admission Details
  const { data: admission, isLoading, refetch } = useQuery<AdmissionDetails>({
    queryKey: ['ipd-admission-details', admissionId],
    queryFn: () => ipdApi.getAdmissionDetails(admissionId!),
    enabled: !!admissionId && isOpen,
    refetchInterval: 15000,
  });

  // Save Round Note Mutation
  const roundNoteMutation = useMutation({
    mutationFn: (data: any) => ipdApi.createRoundNote(admissionId!, data),
    onSuccess: () => {
      toast.success('Round Note Documented', 'Doctor progress note recorded.');
      setIsAddingRoundNote(false);
      setSoapSubjective('');
      setSoapObjective('');
      setSoapAssessment('');
      setSoapPlan('');
      refetch();
    },
    onError: (err: any) => toast.error('Error', err?.message),
  });

  // Save Order Mutation
  const orderMutation = useMutation({
    mutationFn: (data: any) => ipdApi.createOrder(admissionId!, data),
    onSuccess: () => {
      toast.success('Order Placed', 'Inpatient order added to nursing station & eMAR.');
      setIsAddingOrder(false);
      setOrderItem('');
      setOrderDosage('');
      setOrderInstructions('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['ipd-nursing-tasks'] });
    },
    onError: (err: any) => toast.error('Error', err?.message),
  });

  // Administer Order Dose Mutation
  const administerMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      ipdApi.administerOrder(orderId, { status, notes: 'Bedside nurse sign-off' }),
    onSuccess: () => {
      toast.success('Medication Administered', 'Dose signed off in eMAR.');
      refetch();
    },
    onError: (err: any) => toast.error('Error', err?.message),
  });

  // Save Fluid Balance Mutation
  const fluidMutation = useMutation({
    mutationFn: (data: any) => ipdApi.createFluidBalance(admissionId!, data),
    onSuccess: () => {
      toast.success('Fluid Record Saved', 'Intake & output logged.');
      setIsAddingFluid(false);
      setOralIn('');
      setIvIn('');
      setUrineOut('');
      setDrainOut('');
      refetch();
    },
    onError: (err: any) => toast.error('Error', err?.message),
  });

  // Update Clinical Safety Tags Mutation
  const safetyUpdateMutation = useMutation({
    mutationFn: (data: any) => ipdApi.updateAdmission(admissionId!, data),
    onSuccess: () => {
      refetch();
      onRefreshParent();
    },
    onError: (err: any) => toast.error('Error', err?.message),
  });

  if (!isOpen) return null;

  const handleToggleRisk = (riskKey: string) => {
    if (!admission) return;
    const current = admission.risk_factors || {};
    const updated = { ...current, [riskKey]: !(current as any)[riskKey] };
    safetyUpdateMutation.mutate({ risk_factors: updated });
  };

  const handleAddAllergy = () => {
    if (!newAllergy.trim() || !admission) return;
    const current = admission.allergies || [];
    if (!current.includes(newAllergy.trim())) {
      const updated = [...current, newAllergy.trim()];
      safetyUpdateMutation.mutate({ allergies: updated });
    }
    setNewAllergy('');
    setIsAddingAllergy(false);
  };

  const handleRemoveAllergy = (allergy: string) => {
    if (!admission) return;
    const updated = (admission.allergies || []).filter((a) => a !== allergy);
    safetyUpdateMutation.mutate({ allergies: updated });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col h-full overflow-hidden p-0">
        {/* Top Header */}
        <SheetHeader className="p-4 pb-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-base font-bold text-slate-900">
                  {admission?.patient?.name || 'Inpatient Bedside Chart'}
                </SheetTitle>
                <Badge variant="purple" className="font-mono text-[10px]">
                  {admission?.admission_number || '—'}
                </Badge>
                <Badge variant="success" className="text-[10px] font-bold">
                  Day {admission?.duration_days || 1}
                </Badge>
              </div>
              <SheetDescription className="text-xs text-slate-500 mt-0.5">
                MRN: {admission?.patient?.vid || '—'} · {admission?.patient?.gender || ''}{' '}
                {admission?.patient?.age ? `(${admission?.patient?.age}y)` : ''} · Attending:{' '}
                <span className="font-semibold text-slate-700">Dr. {admission?.admitting_doctor?.name || '—'}</span>
              </SheetDescription>
            </div>

            <div className="text-right">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 block">
                {admission?.bed?.bed_number} ({admission?.bed?.ward_name})
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                {formatCurrency(admission?.bed?.daily_rate || 2000)}/day
              </span>
            </div>
          </div>

          {/* Patient Safety & Risk Alert Banner */}
          <div className="mt-3 p-2 bg-amber-50/70 border border-amber-200/70 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="font-bold text-amber-900 text-[11px] uppercase tracking-wider">Allergies:</span>
              {admission?.allergies && admission.allergies.length > 0 ? (
                admission.allergies.map((all, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200"
                  >
                    {all}
                    <button onClick={() => handleRemoveAllergy(all)} className="hover:text-rose-950 font-black">
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-[11px] italic">No known drug allergies (NKDA)</span>
              )}

              {isAddingAllergy ? (
                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Allergy (e.g. Penicillin)"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    className="h-6 px-1.5 text-[10px] border border-amber-300 rounded bg-white"
                  />
                  <Button size="sm" onClick={handleAddAllergy} className="h-6 px-2 text-[10px] font-bold">
                    Add
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingAllergy(true)}
                  className="text-[10px] text-amber-800 font-bold hover:underline"
                >
                  + Add
                </button>
              )}
            </div>

            {/* Quick Safety Flags */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleToggleRisk('fall_risk')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  admission?.risk_factors?.fall_risk
                    ? 'bg-red-600 text-white border-red-700'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Fall Risk
              </button>
              <button
                onClick={() => handleToggleRisk('npo')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  admission?.risk_factors?.npo
                    ? 'bg-amber-600 text-white border-amber-700'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                NPO
              </button>
              <button
                onClick={() => handleToggleRisk('dvt_risk')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  admission?.risk_factors?.dvt_risk
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                DVT Risk
              </button>
            </div>
          </div>

          {/* Subtabs Header */}
          <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-slate-200/60 mt-2">
            {[
              { id: 'rounds', label: 'Doctor Rounds', icon: Stethoscope, count: admission?.round_notes?.length },
              { id: 'vitals', label: 'Vitals & Telemetry', icon: Activity },
              { id: 'orders', label: 'CPOE & eMAR', icon: Pill, count: admission?.orders?.length },
              { id: 'fluids', label: 'Intake / Output', icon: Droplets },
              { id: 'finance', label: 'Billing & Stay', icon: Receipt },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[10px] px-1 rounded-full ${
                        isActive ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 text-xs space-y-4">
          {/* 1. DOCTOR ROUNDS (SOAP NOTES) */}
          {activeTab === 'rounds' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Daily Progress Notes (Rounds)</h4>
                  <p className="text-[11px] text-slate-500">Document morning/evening physician rounds</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddingRoundNote(!isAddingRoundNote)}
                  className="h-7 text-xs font-bold gap-1 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingRoundNote ? 'Cancel' : 'Add Round Note'}</span>
                </Button>
              </div>

              {isAddingRoundNote && (
                <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-lg space-y-2.5">
                  <span className="font-bold text-indigo-950 block text-xs">New Round Note (SOAP Format)</span>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Subjective (Symptoms / Complaints)</label>
                    <textarea
                      rows={2}
                      value={soapSubjective}
                      onChange={(e) => setSoapSubjective(e.target.value)}
                      placeholder="e.g. Patient reports pain reduced to 2/10, slept well, tolerating oral fluids..."
                      className="w-full p-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Objective (Exam / Vitals / Labs)</label>
                    <textarea
                      rows={2}
                      value={soapObjective}
                      onChange={(e) => setSoapObjective(e.target.value)}
                      placeholder="e.g. Afebrile, Chest clear, Abdomen soft, non-tender, dressing clean and intact..."
                      className="w-full p-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Assessment (Impression)</label>
                      <textarea
                        rows={2}
                        value={soapAssessment}
                        onChange={(e) => setSoapAssessment(e.target.value)}
                        placeholder="e.g. Post-op Day 2, clinical course progressing favorably"
                        className="w-full p-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Plan</label>
                      <textarea
                        rows={2}
                        value={soapPlan}
                        onChange={(e) => setSoapPlan(e.target.value)}
                        placeholder="e.g. Step down IV antibiotics to oral, encourage ambulation, plan discharge tomorrow"
                        className="w-full p-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => setIsAddingRoundNote(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        roundNoteMutation.mutate({
                          subjective: soapSubjective,
                          objective: soapObjective,
                          assessment: soapAssessment,
                          plan: soapPlan,
                        })
                      }
                      disabled={roundNoteMutation.isPending}
                      className="bg-indigo-600 text-white font-bold"
                    >
                      {roundNoteMutation.isPending ? 'Saving...' : 'Sign & Save Note'}
                    </Button>
                  </div>
                </div>
              )}

              {/* List of past notes */}
              {admission?.round_notes && admission.round_notes.length > 0 ? (
                <div className="space-y-3">
                  {admission.round_notes.map((rn) => (
                    <div key={rn.id} className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-indigo-600" />
                          <span className="font-bold text-slate-900 text-sm">Dr. {rn.doctor_name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {rn.round_time ? new Date(rn.round_time).toLocaleString('en-IN') : ''}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {rn.subjective && (
                          <p>
                            <span className="font-bold text-indigo-900">S: </span>
                            <span className="text-slate-700">{rn.subjective}</span>
                          </p>
                        )}
                        {rn.objective && (
                          <p>
                            <span className="font-bold text-indigo-900">O: </span>
                            <span className="text-slate-700">{rn.objective}</span>
                          </p>
                        )}
                        {rn.assessment && (
                          <p>
                            <span className="font-bold text-indigo-900">A: </span>
                            <span className="text-slate-700">{rn.assessment}</span>
                          </p>
                        )}
                        {rn.plan && (
                          <p>
                            <span className="font-bold text-indigo-900">P: </span>
                            <span className="text-slate-700">{rn.plan}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg">
                  No doctor round notes logged yet for this admission.
                </div>
              )}
            </div>
          )}

          {/* 2. VITALS & MONITORING */}
          {activeTab === 'vitals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Physiological Vitals Flowsheet</h4>
                  <p className="text-[11px] text-slate-500">Track BP, Pulse, SpO2, Temperature bedside</p>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    onOpenVitalsModal(
                      admission!.id,
                      admission!.bed.id,
                      admission!.patient.name,
                      admission!.bed.bed_number
                    )
                  }
                  className="h-7 text-xs font-bold gap-1 bg-rose-600 text-white hover:bg-rose-700"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Record Vitals</span>
                </Button>
              </div>

              {/* Vitals Logs Table */}
              {admission?.nursing_tasks && admission.nursing_tasks.filter((t) => t.vitals_payload && Object.keys(t.vitals_payload).length > 0).length > 0 ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Date / Time</th>
                        <th className="p-2.5">BP (mmHg)</th>
                        <th className="p-2.5">Pulse</th>
                        <th className="p-2.5">SpO2</th>
                        <th className="p-2.5">Temp</th>
                        <th className="p-2.5">Nurse</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {admission.nursing_tasks
                        .filter((t) => t.vitals_payload && Object.keys(t.vitals_payload).length > 0)
                        .map((t) => {
                          const vp = t.vitals_payload || {};
                          return (
                            <tr key={t.id} className="hover:bg-slate-50">
                              <td className="p-2.5 font-mono text-[11px] text-slate-500">
                                {t.completed_at ? new Date(t.completed_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : '—'}
                              </td>
                              <td className="p-2.5 font-bold text-slate-900">
                                {String(vp.bp || (vp.bp_systolic ? `${vp.bp_systolic}/${vp.bp_diastolic || ''}` : '—'))}
                              </td>
                              <td className="p-2.5 text-slate-800">{vp.pulse ? `${String(vp.pulse)} bpm` : '—'}</td>
                              <td className="p-2.5">
                                {vp.spo2 ? (
                                  <Badge variant={Number(vp.spo2) < 92 ? 'destructive' : 'success'} className="text-[10px]">
                                    {String(vp.spo2)}%
                                  </Badge>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="p-2.5 text-slate-800">{vp.temperature ? `${String(vp.temperature)} °F` : '—'}</td>
                              <td className="p-2.5 text-slate-500 text-[11px]">{t.completed_by_name || 'Staff Nurse'}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg">
                  No completed vital sign telemetry recorded yet.
                </div>
              )}
            </div>
          )}

          {/* 3. CPOE & eMAR */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Inpatient Orders & Bedside eMAR</h4>
                  <p className="text-[11px] text-slate-500">Physician orders, pharmacy meds, and dose administration</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddingOrder(!isAddingOrder)}
                  className="h-7 text-xs font-bold gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingOrder ? 'Cancel' : 'New Order'}</span>
                </Button>
              </div>

              {isAddingOrder && (
                <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-2.5">
                  <span className="font-bold text-emerald-950 block text-xs">Create Bedside Clinical Order</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Order Category</label>
                      <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                        className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none"
                      >
                        <option value="Medication">Medication (Rx)</option>
                        <option value="Investigation">Lab Investigation</option>
                        <option value="Diet">Dietary Order</option>
                        <option value="Nursing Care">Nursing Instruction</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Item Name / Drug *</label>
                      <Input
                        placeholder="e.g. Inj. Pantoprazole"
                        value={orderItem}
                        onChange={(e) => setOrderItem(e.target.value)}
                        className="h-8 text-xs font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {orderType === 'Medication' && (
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Dosage</label>
                        <Input
                          placeholder="40mg"
                          value={orderDosage}
                          onChange={(e) => setOrderDosage(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Route</label>
                        <select
                          value={orderRoute}
                          onChange={(e) => setOrderRoute(e.target.value)}
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none"
                        >
                          <option value="IV">IV</option>
                          <option value="Oral">Oral</option>
                          <option value="IM">IM</option>
                          <option value="SC">SC</option>
                          <option value="Nebulization">Nebulization</option>
                          <option value="Topical">Topical</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Frequency</label>
                        <select
                          value={orderFreq}
                          onChange={(e) => setOrderFreq(e.target.value)}
                          className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none"
                        >
                          <option value="OD">OD (Once a day)</option>
                          <option value="BD">BD (Twice a day)</option>
                          <option value="TDS">TDS (Thrice a day)</option>
                          <option value="QID">QID (4 times a day)</option>
                          <option value="Stat">Stat (Immediately)</option>
                          <option value="SOS">SOS (As needed)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                        <Input
                          placeholder="3 days"
                          value={orderDuration}
                          onChange={(e) => setOrderDuration(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Special Instructions</label>
                    <Input
                      placeholder="e.g. Infuse slowly in 100ml NS over 30 mins..."
                      value={orderInstructions}
                      onChange={(e) => setOrderInstructions(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => setIsAddingOrder(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        orderMutation.mutate({
                          order_type: orderType,
                          item_name: orderItem,
                          dosage: orderDosage,
                          route: orderRoute,
                          frequency: orderFreq,
                          duration: orderDuration,
                          instructions: orderInstructions,
                        })
                      }
                      disabled={!orderItem || orderMutation.isPending}
                      className="bg-emerald-600 text-white font-bold"
                    >
                      {orderMutation.isPending ? 'Ordering...' : 'Confirm Order'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Active Orders List */}
              {admission?.orders && admission.orders.length > 0 ? (
                <div className="space-y-3">
                  {admission.orders.map((ord) => (
                    <div key={ord.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={ord.order_type === 'Medication' ? 'purple' : 'outline'} className="text-[10px]">
                            {ord.order_type}
                          </Badge>
                          <span className="font-bold text-slate-900 text-sm">
                            {ord.item_name} {ord.dosage || ''}
                          </span>
                          {ord.route && (
                            <span className="text-[11px] text-slate-500 font-medium">({ord.route})</span>
                          )}
                        </div>
                        <Badge variant={ord.status === 'Active' ? 'success' : 'secondary'} className="text-[10px]">
                          {ord.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <p>
                          Freq: <span className="font-bold text-slate-800">{ord.frequency}</span>
                          {ord.duration ? ` · Duration: ${ord.duration}` : ''}
                          {ord.instructions ? ` · ${ord.instructions}` : ''}
                        </p>

                        {/* Bedside eMAR Administer Button */}
                        {ord.order_type === 'Medication' && ord.status === 'Active' && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => administerMutation.mutate({ orderId: ord.id, status: 'Given' })}
                              disabled={administerMutation.isPending}
                              className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Give Dose</span>
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Administered Logs */}
                      {ord.administered_logs && ord.administered_logs.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-100 flex flex-wrap gap-2 text-[10px] text-slate-500">
                          <span className="font-bold text-slate-600">Dose Log:</span>
                          {ord.administered_logs.map((log: any, i: number) => (
                            <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                              ✓ {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} by {log.nurse_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg">
                  No active bedside orders placed yet.
                </div>
              )}
            </div>
          )}

          {/* 4. FLUID BALANCE (I/O) */}
          {activeTab === 'fluids' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Fluid Intake & Output (I/O) Chart</h4>
                  <p className="text-[11px] text-slate-500">24-hour hydration & drainage balance</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddingFluid(!isAddingFluid)}
                  className="h-7 text-xs font-bold gap-1 bg-cyan-600 text-white hover:bg-cyan-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingFluid ? 'Cancel' : 'Log Shift I/O'}</span>
                </Button>
              </div>

              {isAddingFluid && (
                <div className="p-3.5 bg-cyan-50/50 border border-cyan-200 rounded-lg space-y-2.5">
                  <span className="font-bold text-cyan-950 block text-xs">Record Shift Fluid Balance</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nursing Shift</label>
                      <select
                        value={fluidShift}
                        onChange={(e) => setFluidShift(e.target.value)}
                        className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none"
                      >
                        <option value="Morning">Morning Shift (08:00 - 14:00)</option>
                        <option value="Evening">Evening Shift (14:00 - 20:00)</option>
                        <option value="Night">Night Shift (20:00 - 08:00)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Oral Intake (ml)</label>
                      <Input
                        type="number"
                        placeholder="500"
                        value={oralIn}
                        onChange={(e) => setOralIn(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">IV Fluids (ml)</label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={ivIn}
                        onChange={(e) => setIvIn(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Urine Output (ml)</label>
                      <Input
                        type="number"
                        placeholder="800"
                        value={urineOut}
                        onChange={(e) => setUrineOut(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Drains / Vomitus (ml)</label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={drainOut}
                        onChange={(e) => setDrainOut(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => setIsAddingFluid(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        fluidMutation.mutate({
                          shift: fluidShift,
                          intake_oral: Number(oralIn) || 0,
                          intake_iv: Number(ivIn) || 0,
                          output_urine: Number(urineOut) || 0,
                          output_drain: Number(drainOut) || 0,
                        })
                      }
                      disabled={fluidMutation.isPending}
                      className="bg-cyan-600 text-white font-bold"
                    >
                      {fluidMutation.isPending ? 'Saving...' : 'Save Fluid Log'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Fluid Balance History */}
              {admission?.fluid_balances && admission.fluid_balances.length > 0 ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Date / Shift</th>
                        <th className="p-2.5 text-cyan-800">Total Intake</th>
                        <th className="p-2.5 text-amber-800">Total Output</th>
                        <th className="p-2.5">Net Balance</th>
                        <th className="p-2.5">Nurse</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {admission.fluid_balances.map((fb) => (
                        <tr key={fb.id} className="hover:bg-slate-50">
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900 block">{fb.shift}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {fb.record_date ? new Date(fb.record_date).toLocaleDateString('en-IN') : ''}
                            </span>
                          </td>
                          <td className="p-2.5 text-cyan-700 font-bold font-mono">+{fb.total_intake} ml</td>
                          <td className="p-2.5 text-amber-700 font-bold font-mono">-{fb.total_output} ml</td>
                          <td className="p-2.5">
                            <span
                              className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                fb.net_balance >= 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {fb.net_balance >= 0 ? `+${fb.net_balance}` : fb.net_balance} ml
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-500">{fb.recorded_by_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg">
                  No fluid intake/output recorded yet.
                </div>
              )}
            </div>
          )}

          {/* 5. BILLING & STAY DETAILS */}
          {activeTab === 'finance' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">Inpatient Tariff & Settlement Breakdown</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Admission Date</span>
                    <p className="font-bold text-slate-900">
                      {admission?.admission_date ? new Date(admission.admission_date).toLocaleString('en-IN') : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Current Duration</span>
                    <p className="font-bold text-slate-900">{admission?.duration_days} Day(s)</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Ward Rate</span>
                    <p className="font-bold text-slate-900">{formatCurrency(admission?.bed?.daily_rate || 2000)} / day</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Accrued Room Charges</span>
                    <p className="font-bold text-indigo-700 text-base">
                      {formatCurrency(admission?.total_accrued_amount || 0)}
                    </p>
                  </div>
                </div>

                {admission?.advance_amount ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs flex justify-between items-center">
                    <span>Admission Deposit Paid:</span>
                    <span className="font-bold">{formatCurrency(admission.advance_amount)}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onInterimBill(admission!.id)}
                  className="flex-1 text-xs font-bold border-slate-300 text-slate-800 gap-1.5"
                >
                  <Receipt className="w-4 h-4 text-slate-600" />
                  <span>Generate Interim Bill</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => onDischarge(admission!.id)}
                  className="flex-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Discharge & Settle</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Persistent Bottom Action Toolbar */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onTransfer(admission)}
            className="text-xs font-semibold gap-1 text-slate-700 border-slate-300 hover:bg-slate-50"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
            <span>Transfer Bed</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onInterimBill(admission!.id)}
              className="text-xs font-semibold gap-1 text-slate-700 border-slate-300 hover:bg-slate-50"
            >
              <Receipt className="w-3.5 h-3.5 text-slate-500" />
              <span>Interim Bill</span>
            </Button>
            <Button
              size="sm"
              onClick={() => onDischarge(admission!.id)}
              className="text-xs font-bold gap-1 bg-rose-600 hover:bg-rose-700 text-white"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Discharge & Settle</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
