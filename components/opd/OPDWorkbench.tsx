'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi, opdApi, appointmentsApi } from '@/lib/api';
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
  Printer,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { Badge } from '@/shared/ui/badge';
import SmartOrderDialog from './SmartOrderDialog';
import PrintablePrescription from '@/components/common/PrintablePrescription';
import { calculateBMI, formatDateTime } from '@/lib/utils';

const CLINICAL_TEMPLATES = [
  {
    id: 'infertility_workup',
    name: 'Fertility Evaluation & Workup',
    complaint: 'Trying to conceive for > 1 year. Regular/irregular menstrual cycles.',
    hopi: 'Couple presenting for comprehensive fertility evaluation. Menstrual history, coital frequency, and previous treatments assessed.',
    diagnosis: 'Primary / Secondary Subfertility under evaluation',
    investigations: '1. Transvaginal Ultrasound (Pelvic TVS)\n2. Serum AMH, Day 2/3 FSH, LH, Estradiol, TSH, Prolactin\n3. Semen Analysis (WHO 6th Ed) for male partner\n4. Viral Markers (HBsAg, HCV, HIV)',
    plan: '1. Tab Folic Acid 5mg OD\n2. Schedule baseline TVS scan on Day 2 of next cycle\n3. Male partner semen analysis after 3 days abstinence\n4. Review in OPD with reports',
  },
  {
    id: 'follicular_monitoring',
    name: 'Ovulation Induction & Follicular Scan',
    complaint: 'Follow-up for follicle tracking / stimulation cycle.',
    hopi: 'Patient on ovarian stimulation. Monitoring endometrial lining and dominant follicular response.',
    diagnosis: 'Stimulated Ovulatory Cycle / Folliculometry',
    investigations: 'Serial Follicular Ultrasound (TVS)',
    plan: '1. Continue ongoing stimulation protocol as directed\n2. Next follicular tracking scan scheduled on day after tomorrow\n3. Timed intercourse instructions explained',
  },
  {
    id: 'pcos_metabolic',
    name: 'PCOS Metabolic & Lifestyle Review',
    complaint: 'Oligomenorrhea, weight gain, hirsutism.',
    hopi: 'Irregular cycles with delayed periods. History of acne and difficulty managing weight.',
    diagnosis: 'Polycystic Ovarian Syndrome (PCOS Phenotype)',
    investigations: 'Fasting Insulin, Fasting Glucose (HOMA-IR), Lipid Profile, Serum Total Testosterone, Pelvic USG',
    plan: '1. Low glycemic index diet, regular aerobic exercise 45 mins/day\n2. Tab Myo-inositol + D-Chiro-Inositol 2g BD\n3. Tab Metformin 500mg OD post-dinner if insulin resistance confirmed\n4. Review after 6 weeks',
  },
  {
    id: 'anc_first_trimester',
    name: 'Antenatal Checkup (ANC) - 1st Trimester',
    complaint: 'Confirmed pregnancy (Urine Pregnancy Test +ve). Routine first trimester antenatal care.',
    hopi: 'Spontaneous / ART conception. Mild nausea, no spotting or abdominal cramps.',
    diagnosis: 'Intrauterine Gestation - 1st Trimester (Antenatal Care)',
    investigations: 'Dating / Viability USG, Complete Blood Count, Blood Group & Rh, Thyroid Profile, HbA1c, Rubella IgG, Double Marker (11-13 weeks)',
    plan: '1. Tab Folic Acid 5mg OD\n2. Tab Doxylamine + Pyridoxine SOS for morning sickness\n3. Avoid heavy lifting and long travel\n4. Viability scan report review',
  },
  {
    id: 'general_opd',
    name: 'General OPD / Medical Review',
    complaint: 'General health checkup / non-specific symptoms.',
    hopi: 'Patient presenting for evaluation and supportive clinical care.',
    diagnosis: 'General Clinical Review',
    investigations: 'Complete Blood Count (CBC), Urine Routine',
    plan: '1. Symptomatic medical management\n2. Adequate hydration and balanced nutrition\n3. Follow up SOS or in 1 week',
  },
];

export default function OPDWorkbench({ patientId, triageData, appointment, onBack }: { patientId?: string; triageData?: any; appointment?: any; onBack?: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const selectedPatientId = patientId || '';
  const [smartOrderOpen, setSmartOrderOpen] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [printablePrescription, setPrintablePrescription] = useState<any>(null);

  // Workbench Mode: Doctor Consultation vs Nurse Triage View
  const [workbenchMode, setWorkbenchMode] = useState<'doctor' | 'nurse'>(user?.role === 'nurse' ? 'nurse' : 'doctor');

  // Collapsible States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDoctorVitalsExpanded, setIsDoctorVitalsExpanded] = useState(false); // Collapsed by default for Doctor
  const [isHistorySectionExpanded, setIsHistorySectionExpanded] = useState(true);
  const [isPlanSectionExpanded, setIsPlanSectionExpanded] = useState(true);

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

  // Fetch Patient Appointments (to locate today's triage / active appointment if not explicitly passed)
  const { data: appointmentResponse } = useQuery({
    queryKey: ['patient-appointments', selectedPatientId],
    queryFn: () => appointmentsApi.list({ patient_id: selectedPatientId }),
    enabled: !!selectedPatientId,
  });

  const patientAppointments = appointmentResponse?.appointments || [];

  // Active or linked appointment
  const currentAppointment = useMemo(() => {
    if (appointment) return appointment;
    if (!patientAppointments || patientAppointments.length === 0) return null;
    return (
      patientAppointments.find((a: any) => a.metadata?.triage || a.metadata_?.triage) ||
      patientAppointments.find((a: any) => a.status === 'scheduled' || a.status === 'in_consultation' || a.status === 'arrived') ||
      patientAppointments[0]
    );
  }, [appointment, patientAppointments]);

  // Compute effective triage data across all sources (Appointment, Props, or Past Nurse Triage Records)
  const effectiveTriage = useMemo(() => {
    // 1. Explicit triageData prop
    if (triageData?.vitals || triageData?.chief_complaint) {
      return {
        vitals: triageData.vitals,
        chief_complaint: triageData.chief_complaint,
        nurse_notes: triageData.nurse_notes,
        source: 'Appointment Triage',
      };
    }
    // 2. Appointment triage metadata
    const apptTriage = currentAppointment?.metadata?.triage || currentAppointment?.metadata_?.triage;
    if (apptTriage?.vitals || apptTriage?.chief_complaint) {
      return {
        vitals: apptTriage.vitals,
        chief_complaint: apptTriage.chief_complaint,
        nurse_notes: apptTriage.nurse_notes,
        source: 'Appointment Triage',
      };
    }
    // 3. Latest nurse triage record from consultationHistory
    const triageRecord = consultationHistory?.find(
      (r: any) => r.record_type === 'nurse_triage' || r.data?.record_type === 'nurse_triage' || (r.data?.vitals && !r.data?.plan)
    );
    if (triageRecord) {
      return {
        vitals: triageRecord.data?.vitals || {
          bp:
            triageRecord.data?.blood_pressure_systolic && triageRecord.data?.blood_pressure_diastolic
              ? `${triageRecord.data.blood_pressure_systolic}/${triageRecord.data.blood_pressure_diastolic}`
              : undefined,
          hr: triageRecord.data?.heart_rate,
          rr: triageRecord.data?.respiratory_rate,
          temp: triageRecord.data?.temperature,
          spo2: triageRecord.data?.spo2,
          weight: triageRecord.data?.weight,
          height: triageRecord.data?.height,
          bmi: triageRecord.data?.bmi,
        },
        chief_complaint: triageRecord.data?.chief_complaints || triageRecord.data?.chief_complaint,
        nurse_notes: triageRecord.data?.nurse_notes,
        cvs_findings: triageRecord.data?.cvs_findings,
        cns_findings: triageRecord.data?.cns_findings,
        rs_findings: triageRecord.data?.rs_findings,
        record_id: triageRecord.id,
        source: 'Nurse Triage Record',
      };
    }
    return null;
  }, [triageData, currentAppointment, consultationHistory]);

  // Form Setup with Clean Non-Dummy Defaults
  const { register, handleSubmit, setValue, watch, reset, control } = useForm({
    defaultValues: {
      weight: '',
      height: '',
      bmi: '',
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      heart_rate: '',
      respiratory_rate: '',
      temperature: '',
      spo2: '',
      chief_complaints: '',
      history_of_illness: '',
      provisional_diagnosis: '',
      differential_diagnosis: '',
      investigations_ordered: '',
      plan: '',
      nurse_notes: '',
      cvs_findings: '',
      cns_findings: '',
      rs_findings: '',
      previous_history: '',
      present_history: '',
      examination: '',
      previous_investigations: '',
      investigations_to_be_advised: '',
      treatment_notes: '',
      medications: [{ drug_name: '', dose: '', frequency: '', instructions: '' }],
      follow_up: '1_week',
    },
  });

  const { fields: medFields, append: appendMed, remove: removeMed } = useFieldArray({
    control,
    name: 'medications'
  });

  // Auto-populate Triage Data into form fields whenever effectiveTriage updates
  useEffect(() => {
    if (effectiveTriage) {
      const v = effectiveTriage.vitals;
      if (v) {
        if (v.weight) setValue('weight', String(v.weight));
        if (v.height) setValue('height', String(v.height));
        if (v.bmi) setValue('bmi', String(v.bmi));
        if (v.bp) {
          const parts = String(v.bp).split('/');
          if (parts[0]) setValue('blood_pressure_systolic', parts[0]);
          if (parts[1]) setValue('blood_pressure_diastolic', parts[1]);
        }
        if (v.hr) setValue('heart_rate', String(v.hr));
        if (v.rr) setValue('respiratory_rate', String(v.rr));
        if (v.temp) setValue('temperature', String(v.temp));
        if (v.spo2) setValue('spo2', String(v.spo2));
      }
      if (effectiveTriage.chief_complaint) {
        setValue('chief_complaints', effectiveTriage.chief_complaint);
      }
      if (effectiveTriage.nurse_notes) {
        setValue('nurse_notes', effectiveTriage.nurse_notes);
      }
      if (effectiveTriage.cvs_findings) setValue('cvs_findings', effectiveTriage.cvs_findings);
      if (effectiveTriage.cns_findings) setValue('cns_findings', effectiveTriage.cns_findings);
      if (effectiveTriage.rs_findings) setValue('rs_findings', effectiveTriage.rs_findings);
    }
  }, [effectiveTriage, setValue]);

  // Auto-apply template based on visit type if appointment is passed
  useEffect(() => {
    if (currentAppointment?.visit_type) {
      const typeMap: Record<string, string> = {
        consultation: 'general_opd',
        procedure: 'infertility_workup',
        scan: 'follicular_monitoring',
        follow_up: 'pcos_metabolic',
      };
      const templateIdToApply = typeMap[currentAppointment.visit_type] || 'general_opd';
      const tmpl = CLINICAL_TEMPLATES.find((t) => t.id === templateIdToApply);

      if (tmpl) {
        if (!watch('chief_complaints')) setValue('chief_complaints', tmpl.complaint);
        if (!watch('present_history')) setValue('present_history', tmpl.hopi);
        if (!watch('examination')) setValue('examination', tmpl.diagnosis);
        if (!watch('investigations_to_be_advised')) setValue('investigations_to_be_advised', tmpl.investigations);
        if (!watch('treatment_notes')) setValue('treatment_notes', tmpl.plan);
      }
    }
  }, [currentAppointment]);

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

  // Save Consultation Mutation (Doctor)
  const saveMutation = useMutation({
    mutationFn: (formData: any) => {
      const vitalsPayload = {
        bp:
          formData.blood_pressure_systolic && formData.blood_pressure_diastolic
            ? `${formData.blood_pressure_systolic}/${formData.blood_pressure_diastolic}`
            : undefined,
        hr: formData.heart_rate,
        rr: formData.respiratory_rate,
        temp: formData.temperature,
        spo2: formData.spo2,
        weight: formData.weight,
        height: formData.height,
        bmi: formData.bmi,
      };

      const consultationPayload = {
        ...formData,
        record_type: 'opd_consultation',
        vitals: vitalsPayload,
        nurse_triage_merged: !!effectiveTriage,
        triage_source: effectiveTriage?.source,
        linked_triage_record_id: effectiveTriage?.record_id,
        status: 'completed',
      };

      return opdApi.saveConsultation({
        patient_id: selectedPatientId,
        created_by: user?.id,
        record_id: effectiveTriage?.record_id, // Updates triage into unified doctor consultation!
        data: consultationPayload,
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['opd-history', selectedPatientId] });
      queryClient.invalidateQueries({ queryKey: ['patient', selectedPatientId] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-appointments', selectedPatientId] });

      // Automatically mark linked appointment as completed
      const linkedApptId = currentAppointment?.id || appointment?.id;
      if (linkedApptId) {
        try {
          await appointmentsApi.update(linkedApptId, { status: 'completed' });
          queryClient.invalidateQueries({ queryKey: ['appointment', linkedApptId] });
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
        } catch (err) {
          console.error('Failed to complete linked appointment:', err);
        }
      }

      setSaveSuccessMessage('OPD Consultation record (with triage vitals & prescription) successfully saved and added to EMR!');
      setTimeout(() => setSaveSuccessMessage(null), 5000);
    },
  });

  // Save Triage Mutation (Nurse)
  const saveNurseTriageMutation = useMutation({
    mutationFn: async (formData: any) => {
      const vitalsPayload = {
        bp:
          formData.blood_pressure_systolic && formData.blood_pressure_diastolic
            ? `${formData.blood_pressure_systolic}/${formData.blood_pressure_diastolic}`
            : undefined,
        hr: formData.heart_rate,
        rr: formData.respiratory_rate,
        temp: formData.temperature,
        spo2: formData.spo2,
        weight: formData.weight,
        height: formData.height,
        bmi: formData.bmi,
      };

      const linkedApptId = currentAppointment?.id || appointment?.id;
      if (linkedApptId) {
        await appointmentsApi.triage(linkedApptId, {
          vitals: vitalsPayload,
          chief_complaint: formData.chief_complaints,
          nurse_notes: formData.nurse_notes,
        });
      }

      return opdApi.saveConsultation({
        patient_id: selectedPatientId,
        created_by: user?.id,
        record_id: effectiveTriage?.record_id,
        data: {
          ...formData,
          record_type: 'nurse_triage',
          vitals: vitalsPayload,
          status: 'triage_completed',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opd-history', selectedPatientId] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-appointments', selectedPatientId] });
      setSaveSuccessMessage('Nurse triage vitals recorded successfully for Doctor OPD Consultation!');
      setTimeout(() => setSaveSuccessMessage(null), 5000);
    },
  });

  const onSubmit = (data: any, andPrint = false) => {
    if (workbenchMode === 'nurse') {
      saveNurseTriageMutation.mutate(data);
      return;
    }

    saveMutation.mutate(data, {
      onSuccess: () => {
        if (andPrint) {
          const meds = data.plan
            ? data.plan
                .split('\n')
                .filter((l: string) => l.trim().length > 0)
                .map((line: string) => ({
                  drug: line.replace(/^\d+[\.\)]\s*/, '').trim(),
                  instructions: 'As directed by physician',
                }))
            : [];
          setPrintablePrescription({
            patient: {
              name: patient?.name,
              mrn: patient?.mrn,
              age: patient?.age,
              gender: patient?.gender,
              phone: patient?.phone,
              blood_group: patient?.blood_group,
            },
            doctor: {
              name: user?.name || 'Dr. Consultant Specialist',
              department: 'Reproductive Medicine & Infertility',
            },
            visitDate: new Date().toISOString().split('T')[0],
            chiefComplaint: data.chief_complaints,
            hopi: data.history_of_illness,
            pastHistory: data.past_medical_history,
            vitals: {
              bp:
                data.blood_pressure_systolic && data.blood_pressure_diastolic
                  ? `${data.blood_pressure_systolic}/${data.blood_pressure_diastolic}`
                  : undefined,
              pulse: data.heart_rate ? `${data.heart_rate} bpm` : undefined,
              temp: data.temperature ? `${data.temperature} °F` : undefined,
              weight: data.weight ? `${data.weight} kg` : undefined,
              spo2: data.spo2 ? `${data.spo2}%` : undefined,
            },
            diagnosis: data.provisional_diagnosis,
            medications: meds,
            advice: data.plan,
            nextFollowUp:
              data.follow_up === '1_week'
                ? 'Review in 1 week'
                : data.follow_up === '2_weeks'
                ? 'Review in 2 weeks'
                : data.follow_up === '1_month'
                ? 'Review in 1 month'
                : 'As advised',
          });
        }
      },
    });
  };

  const handleApplyTemplate = (templateId: string) => {
    const tmpl = CLINICAL_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;
    setValue('chief_complaints', tmpl.complaint);
    setValue('present_history', tmpl.hopi);
    setValue('examination', tmpl.diagnosis); // Place diagnosis in examination or notes
    setValue('investigations_to_be_advised', tmpl.investigations);
    setValue('treatment_notes', tmpl.plan);
  };

  // Populate from Ambient Scribe
  const handleScribeParsed = (extracted: any) => {
    if (extracted.vitals) {
      Object.entries(extracted.vitals).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) setValue(k as any, v);
      });
    }
    if (extracted.clinical) {
      Object.entries(extracted.clinical).forEach(([k, v]) => {
        if (v) setValue(k as any, v);
      });
    }
    if (extracted.assessment) {
      Object.entries(extracted.assessment).forEach(([k, v]) => {
        if (v) setValue(k as any, v);
      });
    }
  };

  // Insert Order Set from Smart Order Palette
  const handleSelectOrderSet = (orderSet: any) => {
    const invItems = Array.isArray(orderSet.investigations) ? orderSet.investigations : [];
    const medItems = Array.isArray(orderSet.medications) ? orderSet.medications : [];

    const newInv = `[${orderSet.name}]:\n- ${invItems.join('\n- ')}`;
    const currentInv = watch('investigations_to_be_advised');
    setValue('investigations_to_be_advised', currentInv && currentInv.trim() ? `${currentInv.trim()}\n\n${newInv}` : newInv);

    const instPart = orderSet.instructions ? `\nInstructions: ${orderSet.instructions}` : '';
    if (instPart) {
      const currentPlan = watch('treatment_notes');
      setValue('treatment_notes', currentPlan && currentPlan.trim() ? `${currentPlan.trim()}\n\n[${orderSet.name}] ${instPart}` : `[${orderSet.name}] ${instPart}`);
    }

    // Append medications to the new structured table
    medItems.forEach((medStr: string) => {
      appendMed({ drug_name: medStr, dose: '', frequency: '', instructions: '' });
    });
  };

  const handlePrintPrevious = (rec: any) => {
    const meds = rec.data?.plan
      ? rec.data.plan
          .split('\n')
          .filter((l: string) => l.trim().length > 0)
          .map((line: string) => ({
            drug: line.replace(/^\d+[\.\)]\s*/, '').trim(),
            instructions: 'As directed by physician',
          }))
      : [];
    setPrintablePrescription({
      patient: {
        name: patient?.name,
        mrn: patient?.mrn,
        age: patient?.age,
        gender: patient?.gender,
        phone: patient?.phone,
        blood_group: patient?.blood_group,
      },
      doctor: {
        name: rec.created_by_name || user?.name || 'Dr. Treating Specialist',
        department: 'Reproductive Medicine & Infertility',
      },
      visitDate: rec.created_at ? rec.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      chiefComplaint: rec.data?.chief_complaints,
      hopi: rec.data?.history_of_illness,
      pastHistory: rec.data?.past_medical_history,
      vitals: {
        bp:
          rec.data?.blood_pressure_systolic && rec.data?.blood_pressure_diastolic
            ? `${rec.data.blood_pressure_systolic}/${rec.data.blood_pressure_diastolic}`
            : undefined,
        pulse: rec.data?.heart_rate ? `${rec.data.heart_rate} bpm` : undefined,
        temp: rec.data?.temperature ? `${rec.data.temperature} °F` : undefined,
        weight: rec.data?.weight ? `${rec.data.weight} kg` : undefined,
        spo2: rec.data?.spo2 ? `${rec.data.spo2}%` : undefined,
      },
      diagnosis: rec.data?.provisional_diagnosis,
      medications: meds,
      advice: rec.data?.plan,
      nextFollowUp:
        rec.data?.follow_up === '1_week'
          ? 'Review in 1 week'
          : rec.data?.follow_up === '2_weeks'
          ? 'Review in 2 weeks'
          : rec.data?.follow_up === '1_month'
          ? 'Review in 1 month'
          : 'As advised',
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50">
      {/* Top Patient Selector Bar */}
      <div className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[rgb(var(--clr-primary)/0.08)] border border-[rgb(var(--clr-primary)/0.2)] flex items-center justify-center text-[rgb(var(--clr-primary))]">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">OPD Clinical Workbench</h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Outpatient consultation, dynamic EMR charting &amp; ambient scribing</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher: Doctor Consultation vs Nurse Triage */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button
              type="button"
              onClick={() => setWorkbenchMode('doctor')}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
                workbenchMode === 'doctor'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
              <span>Doctor View</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkbenchMode('nurse')}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
                workbenchMode === 'nurse'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              <span>Nurse Triage</span>
            </button>
          </div>

          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="gap-1 text-xs font-bold bg-white text-slate-700 border-slate-200 hover:bg-slate-50 rounded-md h-8"
            >
              <span>&larr; Back to EMR</span>
            </Button>
          )}

          {workbenchMode === 'doctor' && (
            <>
              {/* Quick Template Selector */}
              <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <select
                  onChange={(e) => {
                    if (e.target.value) handleApplyTemplate(e.target.value);
                  }}
                  defaultValue=""
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>
                    — Clinical Template —
                  </option>
                  {CLINICAL_TEMPLATES.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSmartOrderOpen(true)}
                className="gap-1.5 text-xs font-bold bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))] border-[rgb(var(--clr-primary)/0.2)] hover:bg-[rgb(var(--clr-primary)/0.12)] rounded-md h-8"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Order Sets (Cmd+K)</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: Collapsible Consultation History Sidebar (Zero Demographics Duplication) */}
        <div
          className={`border-r border-slate-200 bg-white flex flex-col transition-all duration-300 flex-shrink-0 ${
            isSidebarOpen ? 'w-72 sm:w-80' : 'w-12'
          }`}
        >
          {/* Sidebar Header with Collapse Toggle */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            {isSidebarOpen ? (
              <>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Past Consultations</h3>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                    {consultationHistory?.length || 0}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60 transition-colors"
                  title="Collapse History Sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="w-full flex justify-center text-slate-500 hover:text-slate-800 p-1"
                title="Expand History Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Previous Consultations List */}
          {isSidebarOpen && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {/* Active Clinical Alerts in Sidebar (Compact if any) */}
              {patient?.alert_notes && patient.alert_notes.length > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-900">Clinical Alerts</span>
                    <span className="text-[11px]">{patient.alert_notes.join(', ')}</span>
                  </div>
                </div>
              )}

              {consultationHistory && consultationHistory.length > 0 ? (
                consultationHistory.map((rec: any) => (
                  <div
                    key={rec.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors group relative shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                      <span
                        onClick={() => setViewingRecord(rec)}
                        className="flex items-center gap-1 group-hover:text-[rgb(var(--clr-primary))] transition-colors cursor-pointer"
                      >
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDateTime(rec.created_at)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handlePrintPrevious(rec)}
                          className="px-1.5 py-0.5 text-[10px] font-bold bg-white hover:bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))] border border-[rgb(var(--clr-primary)/0.2)] rounded flex items-center gap-1 shadow-2xs"
                          title="Print Prescription (Rx)"
                        >
                          <Printer className="w-2.5 h-2.5" />
                          <span>Rx</span>
                        </button>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 font-medium ${
                            rec.data?.nurse_triage_merged || (rec.data?.vitals && rec.data?.plan)
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : rec.record_type === 'nurse_triage' || rec.data?.record_type === 'nurse_triage'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {rec.data?.nurse_triage_merged || (rec.data?.vitals && rec.data?.plan)
                            ? 'OPD (Vitals+Rx)'
                            : rec.record_type === 'nurse_triage' || rec.data?.record_type === 'nurse_triage'
                            ? 'Triage'
                            : 'OPD'}
                        </Badge>
                      </div>
                    </div>
                    <p
                      onClick={() => setViewingRecord(rec)}
                      className="text-xs font-bold text-slate-800 line-clamp-1 cursor-pointer"
                    >
                      Dx: {rec.data?.provisional_diagnosis || rec.data?.chief_complaints || 'Clinical Review'}
                    </p>
                    {rec.data?.plan && (
                      <p
                        onClick={() => setViewingRecord(rec)}
                        className="text-[10px] text-slate-600 line-clamp-2 mt-1 bg-white p-1 rounded border border-slate-100 cursor-pointer"
                      >
                        {rec.data.plan}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No previous consultations recorded for this patient.
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANE: Dynamic Form (Doctor Consultation vs Nurse Triage) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
          {saveSuccessMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* NURSE TRIAGE VIEW: ONLY PATIENT VITALS & ANTHROPOMETRICS */}
          {/* ========================================================= */}
          {workbenchMode === 'nurse' ? (
            <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-6 max-w-4xl pb-24">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/70 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    <CardTitle className="text-sm font-bold text-slate-900">Nurse Triage Assessment &amp; Vital Signs</CardTitle>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('blood_pressure_systolic', '120');
                      setValue('blood_pressure_diastolic', '80');
                      setValue('heart_rate', '72');
                      setValue('respiratory_rate', '16');
                      setValue('temperature', '98.6');
                      setValue('spo2', '98');
                      setValue('cvs_findings', 'S1 S2 heard, no murmurs');
                      setValue('cns_findings', 'Conscious, oriented, afebrile');
                      setValue('rs_findings', 'Bilateral vesicular breath sounds, clear');
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md transition-colors"
                  >
                    + Autofill Normal Vitals
                  </button>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Vitals Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">BP Systolic</label>
                      <Input type="number" {...register('blood_pressure_systolic')} placeholder="120" className="h-9 text-xs font-semibold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">BP Diastolic</label>
                      <Input type="number" {...register('blood_pressure_diastolic')} placeholder="80" className="h-9 text-xs font-semibold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Pulse (bpm)</label>
                      <Input type="number" {...register('heart_rate')} placeholder="72" className="h-9 text-xs font-semibold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Resp Rate</label>
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
                  </div>

                  {/* Calculated BMI */}
                  {watch('bmi') && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md text-xs">
                      <span className="font-semibold text-slate-600">Calculated Body Mass Index (BMI):</span>
                      <strong className="text-slate-900">{watch('bmi')} kg/m²</strong>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {Number(watch('bmi')) < 18.5
                          ? 'Underweight'
                          : Number(watch('bmi')) < 25
                          ? 'Normal'
                          : Number(watch('bmi')) < 30
                          ? 'Overweight'
                          : 'Obese'}
                      </span>
                    </div>
                  )}

                  {/* Triage Chief Complaint & Nurse Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Chief Complaint (Patient Statement) <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        {...register('chief_complaints', { required: true })}
                        rows={3}
                        placeholder="e.g. Lower abdominal pain since yesterday, feeling feverish..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Nurse Observation Notes</label>
                      <textarea
                        {...register('nurse_notes')}
                        rows={3}
                        placeholder="e.g. Patient ambulatory, alert. Accompanied by spouse..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                      />
                    </div>
                  </div>

                  {/* Quick Systemic Findings */}
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 mb-2">Preliminary Systemic Findings (Optional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">CVS</label>
                        <Input {...register('cvs_findings')} placeholder="e.g. Normal S1 S2" className="h-8 text-xs" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">CNS</label>
                        <Input {...register('cns_findings')} placeholder="e.g. Conscious, oriented" className="h-8 text-xs" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">RS</label>
                        <Input {...register('rs_findings')} placeholder="e.g. Clear breath sounds" className="h-8 text-xs" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Nurse Triage Save Action */}
              <div className="flex items-center justify-start gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="submit"
                  disabled={saveNurseTriageMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 h-10 rounded-md shadow-sm gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saveNurseTriageMutation.isPending ? 'Saving Triage...' : 'Save Nurse Triage Vitals'}</span>
                </Button>
              </div>
            </form>
          ) : (
            /* ========================================================= */
            /* DOCTOR CONSULTATION VIEW: COLLAPSED SUMMARY ON TOP        */
            /* ========================================================= */
            <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-5 max-w-5xl pb-24">
              {/* Top Collapsible Vitals & Triage Summary Banner (Doctor View) */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <HeartPulse className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span className="uppercase tracking-wider text-[11px] text-slate-500">Triage Vitals:</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
                        BP: <strong className="text-slate-900">{watch('blood_pressure_systolic') && watch('blood_pressure_diastolic') ? `${watch('blood_pressure_systolic')}/${watch('blood_pressure_diastolic')}` : '—'}</strong> mmHg
                      </span>
                      <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
                        HR: <strong className="text-slate-900">{watch('heart_rate') || '—'}</strong> bpm
                      </span>
                      <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
                        Temp: <strong className="text-slate-900">{watch('temperature') || '—'}</strong> °F
                      </span>
                      <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
                        SpO2: <strong className="text-slate-900">{watch('spo2') || '—'}</strong>%
                      </span>
                      <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
                        Wt: <strong className="text-slate-900">{watch('weight') || '—'}</strong> kg
                      </span>
                      {watch('bmi') && (
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded font-bold text-indigo-700">
                          BMI: {watch('bmi')}
                        </span>
                      )}
                    </div>
                    {effectiveTriage && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                        ✓ Triage Vitals Linked
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDoctorVitalsExpanded(!isDoctorVitalsExpanded)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2.5 py-1 rounded hover:bg-indigo-50 transition-colors self-end sm:self-center"
                  >
                    {isDoctorVitalsExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Collapse Vitals</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>Edit / View Vitals &amp; Exam</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Nurse Observation Notes Banner (if provided) */}
                {watch('nurse_notes') && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-start gap-2 text-xs bg-slate-50/80 p-2 rounded-md">
                    <FileText className="w-3.5 h-3.5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Nurse Triage Notes: </span>
                      <span className="text-slate-700 text-xs">{watch('nurse_notes')}</span>
                    </div>
                  </div>
                )}

                {/* Expanded Vitals & Systemic Exam Editor */}
                {isDoctorVitalsExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-1">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">BP Systolic</label>
                        <Input type="number" {...register('blood_pressure_systolic')} placeholder="120" className="h-8 text-xs font-semibold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">BP Diastolic</label>
                        <Input type="number" {...register('blood_pressure_diastolic')} placeholder="80" className="h-8 text-xs font-semibold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Heart Rate</label>
                        <Input type="number" {...register('heart_rate')} placeholder="72" className="h-8 text-xs font-semibold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Resp Rate</label>
                        <Input type="number" {...register('respiratory_rate')} placeholder="16" className="h-8 text-xs font-semibold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Temp (°F)</label>
                        <Input type="number" step="0.1" {...register('temperature')} placeholder="98.6" className="h-8 text-xs font-semibold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">SpO2 (%)</label>
                        <Input type="number" {...register('spo2')} placeholder="98" className="h-8 text-xs font-semibold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Weight (kg)</label>
                        <Input type="number" step="0.1" {...register('weight')} placeholder="65" className="h-8 text-xs font-semibold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Height (cm)</label>
                        <Input type="number" {...register('height')} placeholder="165" className="h-8 text-xs font-semibold" />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Examination Findings</label>
                      <textarea {...register('examination')} placeholder="e.g. Vitals stable, P/A soft, CVS normal..." rows={3} className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800" />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 1: Subjective / Clinical History (Collapsible Card) */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader
                  className="py-3 px-4 border-b border-slate-100 bg-slate-50/70 flex flex-row items-center justify-between cursor-pointer select-none"
                  onClick={() => setIsHistorySectionExpanded(!isHistorySectionExpanded)}
                >
                  <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Clinical History &amp; Subjective Assessment
                  </CardTitle>
                  <button type="button" className="text-slate-400 hover:text-slate-600">
                    {isHistorySectionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </CardHeader>
                {isHistorySectionExpanded && (
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Chief Complaints <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        {...register('chief_complaints', { required: true })}
                        rows={2}
                        placeholder="e.g. Primary subfertility for 3 years, irregular menses..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Present History</label>
                        <textarea
                          {...register('present_history')}
                          rows={3}
                          placeholder="Detailed chronological history of present illness..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Previous History</label>
                        <textarea
                          {...register('previous_history')}
                          rows={3}
                          placeholder="Previous hospitalizations, surgeries, drug allergies..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Previous Investigations</label>
                      <textarea
                        {...register('previous_investigations')}
                        rows={2}
                        placeholder="Past reports and imaging..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* SECTION 2: Assessment & Plan (Collapsible Card) */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader
                  className="py-3 px-4 border-b border-slate-100 bg-slate-50/70 flex flex-row items-center justify-between cursor-pointer select-none"
                  onClick={() => setIsPlanSectionExpanded(!isPlanSectionExpanded)}
                >
                  <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Assessment, Orders &amp; Management Plan
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSmartOrderOpen(true);
                      }}
                      className="gap-1.5 text-[11px] text-[rgb(var(--clr-primary))] bg-[rgb(var(--clr-primary)/0.08)] border-[rgb(var(--clr-primary)/0.2)] hover:bg-[rgb(var(--clr-primary)/0.12)] rounded h-7"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Insert Order Set</span>
                    </Button>
                    <button type="button" className="text-slate-400 hover:text-slate-600">
                      {isPlanSectionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </CardHeader>
                {isPlanSectionExpanded && (
                  <CardContent className="p-4 space-y-4">
                    {/* Provisional & Differential Diagnosis removed as per new standard template */}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5 text-[rgb(var(--clr-primary))]" />
                          <span>Investigations To Be Advised</span>
                        </label>
                      </div>
                      <textarea
                        {...register('investigations_to_be_advised')}
                        rows={3}
                        placeholder="e.g. AMH, Pelvic TVS, Semen Analysis, Day 2 FSH/LH..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))] font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-[rgb(var(--clr-primary))]" />
                          <span>Treatment (Medications)</span>
                        </label>
                      </div>
                      
                      {/* Structured Medication Array */}
                      <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                        {medFields.map((field, index) => (
                          <div key={field.id} className="flex gap-2 items-start relative">
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Drug Name (Searchable)</label>
                              <Input
                                {...register(`medications.${index}.drug_name`)}
                                list="drugList"
                                placeholder="e.g. Tab Paracetamol"
                                className="h-8 text-xs mt-1 bg-white"
                              />
                            </div>
                            <div className="w-24">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Dose</label>
                              <Input
                                {...register(`medications.${index}.dose`)}
                                placeholder="500mg"
                                className="h-8 text-xs mt-1 bg-white"
                              />
                            </div>
                            <div className="w-32">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Frequency</label>
                              <select
                                {...register(`medications.${index}.frequency`)}
                                className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                              >
                                <option value="">Select...</option>
                                <option value="OD">OD (Once daily)</option>
                                <option value="BD">BD (Twice daily)</option>
                                <option value="TDS">TDS (Thrice daily)</option>
                                <option value="QID">QID (Four times daily)</option>
                                <option value="SOS">SOS (As needed)</option>
                                <option value="Stat">Stat (Immediately)</option>
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Instructions</label>
                              <Input
                                {...register(`medications.${index}.instructions`)}
                                placeholder="After food, for 5 days"
                                className="h-8 text-xs mt-1 bg-white"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMed(index)}
                              className="mt-6 p-1.5 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-md hover:border-rose-200 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        
                        <datalist id="drugList">
                          <option value="Tab Paracetamol 500mg" />
                          <option value="Tab Metformin 500mg" />
                          <option value="Tab Folic Acid 5mg" />
                          <option value="Cap Doxycycline 100mg" />
                          <option value="Inj Progesterone 100mg" />
                        </datalist>

                        <button
                          type="button"
                          onClick={() => appendMed({ drug_name: '', dose: '', frequency: '', instructions: '' })}
                          className="text-xs font-bold text-[rgb(var(--clr-primary))] flex items-center gap-1 hover:underline pt-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Medicine
                        </button>
                      </div>

                      <div className="mt-3">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Treatment Notes (Non-Pharmacological / Dietary)</label>
                        <textarea
                          {...register('treatment_notes')}
                          rows={3}
                          placeholder="Dietary and lifestyle instructions, additional advice..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                        />
                      </div>
                    </div>

                    <div className="w-48">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Follow-Up Schedule</label>
                      <select
                        {...register('follow_up')}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
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
                )}
              </Card>

              {/* Bottom Form Actions - Left-aligned to keep bottom-right pinned Scribe button unobstructed */}
              <div className="flex items-center justify-start gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saveMutation.isPending}
                  onClick={handleSubmit((data) => onSubmit(data, true))}
                  className="bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 font-bold px-5 h-10 rounded-md shadow-xs gap-2"
                >
                  <Printer className="w-4 h-4 text-emerald-600" />
                  <span>Save &amp; Print Rx</span>
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold px-6 h-10 rounded-md shadow-xs gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saveMutation.isPending ? 'Saving to EMR...' : 'Save Consultation Record'}</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Smart Order Set Palette (Cmd+K) */}
      <SmartOrderDialog
        open={smartOrderOpen}
        onOpenChange={setSmartOrderOpen}
        onSelectOrderSet={handleSelectOrderSet}
      />

      {/* History Full View Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Consultation Record</h3>
                <p className="text-xs text-slate-500">{formatDateTime(viewingRecord.created_at)}</p>
              </div>
              <button
                onClick={() => setViewingRecord(null)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subjective &amp; History</h4>
                <div className="bg-slate-50 p-4 rounded-md border border-slate-100 space-y-3">
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
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assessment &amp; Plan</h4>
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
                  <div>
                    <span className="font-semibold text-slate-900 text-sm">Diagnosis:</span>
                    <p className="text-sm text-slate-800 font-bold mt-1">{viewingRecord.data?.provisional_diagnosis || 'None recorded'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 mt-3">
                    <div>
                      <span className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                        <FlaskConical className="w-3 h-3" /> Investigations:
                      </span>
                      <p className="text-xs text-slate-800 mt-1 whitespace-pre-line">{viewingRecord.data?.investigations_ordered || '-'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                        <Pill className="w-3 h-3" /> Prescriptions &amp; Plan:
                      </span>
                      <p className="text-xs text-slate-800 mt-1 whitespace-pre-line">{viewingRecord.data?.plan || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  handlePrintPrevious(viewingRecord);
                }}
                className="text-[rgb(var(--clr-primary))] border-[rgb(var(--clr-primary)/0.2)] hover:bg-[rgb(var(--clr-primary)/0.08)] rounded-md font-semibold px-4 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-[rgb(var(--clr-primary))]" />
                <span>Print Prescription (Rx)</span>
              </Button>
              <Button onClick={() => setViewingRecord(null)} className="bg-slate-900 text-white rounded-md font-bold px-6">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Prescription Modal */}
      {printablePrescription && (
        <PrintablePrescription
          {...printablePrescription}
          onClose={() => setPrintablePrescription(null)}
        />
      )}
    </div>
  );
}
