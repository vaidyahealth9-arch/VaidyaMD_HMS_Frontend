'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi, opdApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Stethoscope,
  HeartPulse,
  History,
  AlertTriangle,
  Sparkles,
  Save,
  CheckCircle,
  Plus,
  Calendar,
  User,
  FlaskConical,
  Pill,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AmbientScribeWidget from './AmbientScribeWidget';
import SmartOrderDialog from './SmartOrderDialog';
import { calculateBMI, formatDateTime } from '@/lib/utils';

export default function OPDWorkbench({ patientId, triageData, onBack }: { patientId?: string; triageData?: any; onBack?: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const selectedPatientId = patientId || '';
  const [smartOrderOpen, setSmartOrderOpen] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<any>(null);

  // Fetch Selected Patient Details
  const { data: patient } = useQuery({
    queryKey: ['patient', selectedPatientId],
    queryFn: () => patientsApi.get(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Fetch Patient OPD History
  const { data: consultationHistory } = useQuery({
    queryKey: ['opd-history', selectedPatientId],
    queryFn: () => opdApi.getPatientConsultations(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Form Setup
  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      weight: triageData?.vitals?.weight || 65,
      height: 165,
      bmi: '23.8',
      blood_pressure_systolic: triageData?.vitals?.bp?.split('/')[0] || 120,
      blood_pressure_diastolic: triageData?.vitals?.bp?.split('/')[1] || 80,
      heart_rate: triageData?.vitals?.hr || 72,
      respiratory_rate: 16,
      temperature: triageData?.vitals?.temp || 98.6,
      spo2: triageData?.vitals?.spo2 || 98,
      chief_complaints: triageData?.chief_complaint || '',
      history_of_illness: '',
      past_medical_history: '',
      cvs_findings: 'S1 S2 normal, no murmurs',
      cns_findings: 'Conscious, oriented',
      rs_findings: 'Bilateral vesicular breath sounds, clear',
      provisional_diagnosis: '',
      differential_diagnosis: '',
      investigations_ordered: '',
      plan: '',
      follow_up: '1_week',
    },
  });

  const weight = watch('weight');
  const height = watch('height');

  // Auto calculate BMI
  useEffect(() => {
    if (weight && height) {
      const calculated = calculateBMI(Number(weight), Number(height));
      setValue('bmi', calculated);
    }
  }, [weight, height, setValue]);

  // Keyboard shortcut Cmd+K / Ctrl+K for Smart Order Sets
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSmartOrderOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save Consultation Mutation
  const saveMutation = useMutation({
    mutationFn: (formData: any) =>
      opdApi.saveConsultation({
        patient_id: selectedPatientId,
        created_by: user?.id,
        data: formData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opd-history', selectedPatientId] });
      setSaveSuccessMessage('OPD Consultation record successfully saved and added to EMR!');
      setTimeout(() => setSaveSuccessMessage(null), 5000);
    },
  });

  const onSubmit = (data: any) => {
    saveMutation.mutate(data);
  };

  // Populate from Ambient Scribe
  const handleScribeParsed = (extracted: any) => {
    if (extracted.vitals) {
      Object.entries(extracted.vitals).forEach(([k, v]) => setValue(k as any, v));
    }
    if (extracted.clinical) {
      Object.entries(extracted.clinical).forEach(([k, v]) => setValue(k as any, v));
    }
    if (extracted.assessment) {
      Object.entries(extracted.assessment).forEach(([k, v]) => setValue(k as any, v));
    }
  };

  // Insert Order Set from Smart Order Palette
  const handleSelectOrderSet = (orderSet: any) => {
    const newInv = `[${orderSet.name}]:\n- ${orderSet.investigations.join('\n- ')}`;
    setValue('investigations_ordered', newInv);

    const newPlan = `Prescribed Order Set [${orderSet.name}]:\n- ${orderSet.medications.join('\n- ')}\nInstructions: ${orderSet.instructions || 'None'}`;
    setValue('plan', newPlan);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50">
      {/* Top Patient Selector Bar */}
      <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">OPD Clinical Workbench</h1>
            <p className="text-[11px] text-slate-500 font-medium">Outpatient consultation, dynamic EMR charting & ambient scribing</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="gap-1.5 text-xs font-bold bg-white text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl h-8 mr-2"
            >
              <span>&larr; Back to Queue</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSmartOrderOpen(true)}
            className="gap-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 rounded-xl h-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Order Sets (Cmd+K)</span>
          </Button>
        </div>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: Patient Details, Alerts, Vitals & Consultation History */}
        <div className="w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col overflow-y-auto flex-shrink-0">
          {/* Patient Card */}
          {patient && (
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{patient.name}</h2>
                  <p className="text-xs text-indigo-600 font-semibold">{patient.mrn || 'MRN: VAIDYA-2026-092'}</p>
                </div>
                <Badge variant="purple" className="text-xs font-bold">
                  {patient.gender || 'Female'}, {patient.age || 31}y
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">BLOOD GROUP</span>
                  <span className="font-bold text-slate-800">{patient.blood_group || 'B+ Positive'}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">PHONE</span>
                  <span className="font-semibold text-slate-800">{patient.phone || '+91 98450 12345'}</span>
                </div>
              </div>

              {/* Allergy / Clinical Alerts */}
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-900">Clinical Alerts</span>
                  <span>{patient.alert_notes?.[0] || 'Sulfa drug allergy. Monitored for PCOS metabolic profile.'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Previous Consultations History */}
          <div className="p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Consultation History</h3>
            </div>

            {consultationHistory && consultationHistory.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {consultationHistory.map((rec: any) => (
                  <div 
                    key={rec.id} 
                    onClick={() => setViewingRecord(rec)}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors group relative"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                      <span className="flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDateTime(rec.created_at)}
                      </span>
                      <Badge variant="outline" className="text-[10px]">{rec.record_type}</Badge>
                    </div>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">
                      Dx: {rec.data?.provisional_diagnosis || rec.data?.chief_complaints || 'General OPD'}
                    </p>
                    {rec.data?.plan && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 bg-white p-1.5 rounded border border-slate-100">
                        {rec.data.plan}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No previous consultations on record for this patient.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Dynamic OPD Clinical Consultation Form */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {saveSuccessMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl pb-24">
            <div className="space-y-6">
              {/* SECTION 1: Subjective */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                  <CardTitle className="text-sm">Clinical History & Subjective Assessment</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Chief Complaints <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register('chief_complaints', { required: true })}
                      rows={2}
                      placeholder="e.g. Primary subfertility for 3 years, irregular menses..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">History of Present Illness</label>
                      <textarea
                        {...register('history_of_illness')}
                        rows={3}
                        placeholder="Detailed chronological history..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Past Medical / Surgical History</label>
                      <textarea
                        {...register('past_medical_history')}
                        rows={3}
                        placeholder="Previous hospitalizations, surgeries, drug allergies..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 2: Objective & Vitals */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-indigo-600" />
                    <CardTitle className="text-sm">Patient Vitals & Anthropometrics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">BP Systolic</label>
                    <Input type="number" {...register('blood_pressure_systolic')} placeholder="120" className="h-9 text-xs font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">BP Diastolic</label>
                    <Input type="number" {...register('blood_pressure_diastolic')} placeholder="80" className="h-9 text-xs font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Heart Rate (bpm)</label>
                    <Input type="number" {...register('heart_rate')} placeholder="72" className="h-9 text-xs font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Resp Rate (/min)</label>
                    <Input type="number" {...register('respiratory_rate')} placeholder="16" className="h-9 text-xs font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Temp (°F)</label>
                    <Input type="number" step="0.1" {...register('temperature')} placeholder="98.6" className="h-9 text-xs font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">SpO2 (%)</label>
                    <Input type="number" {...register('spo2')} placeholder="98" className="h-9 text-xs font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Weight (kg)</label>
                    <Input type="number" step="0.1" {...register('weight')} placeholder="65" className="h-9 text-xs font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Height (cm)</label>
                    <Input type="number" {...register('height')} placeholder="165" className="h-9 text-xs font-semibold" />
                  </div>
                </CardContent>
                <div className="border-t border-slate-100 p-4">
                  <h4 className="text-xs font-bold text-slate-700 mb-3">Systemic Examination Findings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">CVS Findings</label>
                      <Input {...register('cvs_findings')} className="h-9 text-xs" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">CNS Findings</label>
                      <Input {...register('cns_findings')} className="h-9 text-xs" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">RS Findings</label>
                      <Input {...register('rs_findings')} className="h-9 text-xs" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* SECTION 3: Assessment */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Assessment, Orders & Management Plan</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSmartOrderOpen(true)}
                    className="gap-1.5 text-xs text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 rounded-lg h-7 mt-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Insert Order Set</span>
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Provisional Diagnosis</label>
                      <Input
                        {...register('provisional_diagnosis')}
                        placeholder="e.g. PCOS Phenotype A / Unexplained Infertility"
                        className="h-9 text-xs font-bold text-indigo-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Differential Diagnosis</label>
                      <Input
                        {...register('differential_diagnosis')}
                        placeholder="e.g. Hypothalamic amenorrhea, Hyperprolactinemia"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Investigations & Diagnostics Ordered</span>
                      </label>
                    </div>
                    <textarea
                      {...register('investigations_ordered')}
                      rows={3}
                      placeholder="e.g. AMH, Pelvic TVS, Semen Analysis, Day 2 FSH/LH..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Prescriptions & Management Plan</span>
                      </label>
                    </div>
                    <textarea
                      {...register('plan')}
                      rows={4}
                      placeholder="Detailed Rx with dosages, frequencies, dietary and lifestyle instructions..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="w-48">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Follow-Up Schedule</label>
                    <select
                      {...register('follow_up')}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="1_week">1 Week</option>
                      <option value="2_weeks">2 Weeks</option>
                      <option value="1_month">1 Month</option>
                      <option value="3_months">3 Months</option>
                      <option value="sos">SOS (As needed)</option>
                      <option value="no_followup">No Follow-up required</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 h-11 rounded-xl shadow-lg shadow-indigo-500/20 gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saveMutation.isPending ? 'Saving to EMR...' : 'Save Consultation Record'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Floating Ambient AI Scribe Widget */}
      <AmbientScribeWidget patientId={selectedPatientId} onDataParsed={handleScribeParsed} />

      {/* Smart Order Set Palette (Cmd+K) */}
      <SmartOrderDialog
        open={smartOrderOpen}
        onOpenChange={setSmartOrderOpen}
        onSelectOrderSet={handleSelectOrderSet}
      />

      {/* History Full View Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Consultation Record</h3>
                <p className="text-xs text-slate-500">{formatDateTime(viewingRecord.created_at)}</p>
              </div>
              <button 
                onClick={() => setViewingRecord(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subjective & History</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div>
                    <span className="font-semibold text-slate-700 text-sm">Chief Complaints:</span>
                    <p className="text-sm text-slate-600 mt-1">{viewingRecord.data?.chief_complaints || 'None recorded'}</p>
                  </div>
                  {(viewingRecord.data?.history_of_illness || viewingRecord.data?.past_medical_history) && (
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/60 mt-3">
                      <div>
                        <span className="font-semibold text-slate-700 text-xs">HPI:</span>
                        <p className="text-xs text-slate-600 mt-1">{viewingRecord.data?.history_of_illness || '-'}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 text-xs">Past Medical Hx:</span>
                        <p className="text-xs text-slate-600 mt-1">{viewingRecord.data?.past_medical_history || '-'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assessment & Plan</h4>
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
                  <div>
                    <span className="font-semibold text-indigo-900 text-sm">Diagnosis:</span>
                    <p className="text-sm text-indigo-800 font-bold mt-1">{viewingRecord.data?.provisional_diagnosis || 'None recorded'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-indigo-200/40 mt-3">
                    <div>
                      <span className="font-semibold text-indigo-900 text-xs flex items-center gap-1"><FlaskConical className="w-3 h-3"/> Investigations:</span>
                      <p className="text-xs text-indigo-800 mt-1 whitespace-pre-line">{viewingRecord.data?.investigations_ordered || '-'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-indigo-900 text-xs flex items-center gap-1"><Pill className="w-3 h-3"/> Prescriptions & Plan:</span>
                      <p className="text-xs text-indigo-800 mt-1 whitespace-pre-line">{viewingRecord.data?.plan || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button onClick={() => setViewingRecord(null)} className="bg-slate-900 text-white rounded-xl font-bold px-6">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
