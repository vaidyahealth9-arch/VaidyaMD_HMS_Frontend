'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi, opdApi, appointmentsApi, counselingApi, CounselingNote, billingApi } from '@/lib/api';
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
  SlidersHorizontal,
  HeartHandshake,
  Eye,
  ClipboardList,
  Heart,
  Baby,
  Activity,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { Badge } from '@/shared/ui/badge';
import SmartOrderDialog from './SmartOrderDialog';
import TemplateManagementDialog, { ClinicalTemplateItem, RxTemplateItem } from './TemplateManagementDialog';
import PrintablePrescription from '@/components/common/PrintablePrescription';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import ClinicalHistoryProformaModal from './ClinicalHistoryProformaModal';
import EditAlertsModal from '@/components/patients/EditAlertsModal';
import { toast } from '@/contexts/ToastContext';
import { calculateBMI, formatDateTime } from '@/lib/utils';

const CLINICAL_TEMPLATES: ClinicalTemplateItem[] = [];

interface RxTemplate {
  id: string;
  name: string;
  category: string;
  medications: Array<{
    drug_name: string;
    dose: string;
    frequency: string;
    duration?: string;
    instructions: string;
  }>;
  advice?: string;
}

const COMMON_INVESTIGATION_OPTIONS = [
  'Pelvic TVS Scan',
  'Serum AMH',
  'Day 2/3 FSH & LH',
  'Serum Estradiol (E2)',
  'Serum Progesterone (P4)',
  'Serum Prolactin',
  'Thyroid (TSH)',
  'Semen Analysis (WHO 6th)',
  'CASA Semen Analysis',
  'Sperm DFI',
  'Viral Markers (HIV, HBsAg, HCV)',
  'Complete Blood Picture (CBP)',
  'Blood Group & Rh',
  'HbA1c',
  'Tubal Patency (HSG)',
  'Diagnostic Hysteroscopy',
  'Karyotyping (Couple)',
];

const RX_TEMPLATES: RxTemplate[] = [];

export default function OPDWorkbench({ patientId, triageData, appointment, onBack }: { patientId?: string; triageData?: any; appointment?: any; onBack?: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const selectedPatientId = patientId || '';
  const [smartOrderOpen, setSmartOrderOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDialogTab, setTemplateDialogTab] = useState<'clinical' | 'rx'>('clinical');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [printablePrescription, setPrintablePrescription] = useState<any>(null);
  const [activeConsultationRecordId, setActiveConsultationRecordId] = useState<string | null>(null);
  const [showEditAlertsModal, setShowEditAlertsModal] = useState(false);
  const [localAlerts, setLocalAlerts] = useState<string[] | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'consultations' | 'counseling'>('consultations');
  const [viewingCounselingNote, setViewingCounselingNote] = useState<CounselingNote | null>(null);
  const [clinicalHistoryTemplate, setClinicalHistoryTemplate] = useState<'standard' | 'fertility' | 'gynaecology' | 'obstetric'>('standard');

  // Fetch Counselor Notes for selected patient
  const { data: counselingNotes = [] } = useQuery<CounselingNote[]>({
    queryKey: ['counseling-notes', selectedPatientId],
    queryFn: () => counselingApi.listNotes({ patient_id: selectedPatientId }),
    enabled: !!selectedPatientId,
  });

  // Workbench Mode: Doctor Consultation vs Nurse Triage View
  const [workbenchMode, setWorkbenchMode] = useState<'doctor' | 'nurse'>(user?.role === 'nurse' ? 'nurse' : 'doctor');

  // Collapsible States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDoctorVitalsExpanded, setIsDoctorVitalsExpanded] = useState(false); // Collapsed by default for Doctor
  const [isHistorySectionExpanded, setIsHistorySectionExpanded] = useState(true);
  const [isPlanSectionExpanded, setIsPlanSectionExpanded] = useState(true);

  // Reset local alerts when patient changes
  useEffect(() => {
    setLocalAlerts(null);
  }, [selectedPatientId]);

  // Fetch Selected Patient Details
  const { data: patient } = useQuery({
    queryKey: ['patient', selectedPatientId],
    queryFn: () => patientsApi.get(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  const activeAlerts = localAlerts !== null ? localAlerts : (patient?.alert_notes || []);

  // Fetch custom templates from backend
  const { data: customClinicalData = [], refetch: refetchClinicalTemplates } = useQuery({
    queryKey: ['custom-clinical-templates'],
    queryFn: async () => {
      try {
        const res = await opdApi.getTemplates('clinical_template');
        if (Array.isArray(res)) {
          return res.map((t: any) => ({
            id: t.id,
            name: t.title,
            isCustom: true,
            complaint: t.schema_json?.complaint || '',
            hopi: t.schema_json?.hopi || '',
            diagnosis: t.schema_json?.diagnosis || '',
            investigations: t.schema_json?.investigations || '',
            plan: t.schema_json?.plan || '',
          }));
        }
      } catch (err) {
        console.error('Failed to load custom clinical templates', err);
      }
      return [];
    },
  });

  const { data: customRxData = [], refetch: refetchRxTemplates } = useQuery({
    queryKey: ['custom-rx-templates'],
    queryFn: async () => {
      try {
        const res = await opdApi.getTemplates('rx_template');
        if (Array.isArray(res)) {
          return res.map((t: any) => ({
            id: t.id,
            name: t.title,
            isCustom: true,
            category: t.schema_json?.category || 'General',
            medications: t.schema_json?.medications || [],
            advice: t.schema_json?.advice || '',
          }));
        }
      } catch (err) {
        console.error('Failed to load custom rx templates', err);
      }
      return [];
    },
  });

  const allClinicalTemplates: ClinicalTemplateItem[] = useMemo(() => {
    return [...CLINICAL_TEMPLATES, ...customClinicalData];
  }, [customClinicalData]);

  const allRxTemplates: RxTemplateItem[] = useMemo(() => {
    return customRxData.length > 0 ? customRxData : RX_TEMPLATES;
  }, [customRxData]);

  // Dynamic Service Catalog for Investigations
  const { data: serviceCatalog = [] } = useQuery({
    queryKey: ['service-catalog'],
    queryFn: () => billingApi.getServiceCatalog().catch(() => []),
  });

  const dynamicInvestigations = useMemo(() => {
    if (Array.isArray(serviceCatalog) && serviceCatalog.length > 0) {
      const invs = serviceCatalog
        .filter((s: any) => ['investigation', 'lab', 'diagnostics', 'radiology'].includes(s.service_category?.toLowerCase()))
        .map((s: any) => s.service_name);
      if (invs.length > 0) return Array.from(new Set(invs));
    }
    return COMMON_INVESTIGATION_OPTIONS;
  }, [serviceCatalog]);

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
      future_consultation_notes: '',
      medications: [{ drug_name: '', dose: '', frequency: '', duration: '', instructions: '' }],
      follow_up: '1_week',
      clinical_proforma: null as any,
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

  // Helper to extract structured prescription medications with fallback
  const resolvePrescriptionMeds = (rawMeds: any[], fallbackPlan?: string) => {
    if (Array.isArray(rawMeds) && rawMeds.length > 0) {
      const valid = rawMeds
        .filter((m: any) => (m.drug_name || m.drug) && (m.drug_name || m.drug).trim())
        .map((m: any) => ({
          drug: m.drug_name || m.drug,
          dose: m.dose || '1 tab',
          freq: m.frequency || m.freq || 'OD',
          duration: m.duration || '—',
          instructions: m.instructions || 'After food',
        }));
      if (valid.length > 0) return valid;
    }

    if (fallbackPlan) {
      return fallbackPlan
        .split('\n')
        .filter((l: string) => l.trim().length > 0)
        .map((line: string) => ({
          drug: line.replace(/^\d+[\.\)]\s*/, '').trim(),
          dose: 'As advised',
          freq: 'OD',
          duration: '—',
          instructions: 'As directed by physician',
        }));
    }
    return [];
  };

  // Apply Rx Template to structured medications array
  const handleApplyRxTemplate = (templateId: string) => {
    const tmpl = allRxTemplates.find((t) => t.id === templateId);
    if (!tmpl) return;

    // Filter out completely blank rows
    const currentMeds = watch('medications') || [];
    const existing = currentMeds.filter((f: any) => f.drug_name && f.drug_name.trim());
    
    // Set medications with template rows
    setValue('medications', [
      ...existing,
      ...tmpl.medications.map((m) => ({
        drug_name: m.drug_name,
        dose: m.dose,
        frequency: m.frequency,
        duration: m.duration || '',
        instructions: m.instructions,
      })),
    ]);

    if (tmpl.advice) {
      const currentAdvice = watch('treatment_notes');
      setValue('treatment_notes', currentAdvice && currentAdvice.trim() ? `${currentAdvice.trim()}\n\n${tmpl.advice}` : tmpl.advice);
    }

    toast.success('Rx Template Applied', `Loaded "${tmpl.name}" with ${tmpl.medications.length} medications`);
  };

  // Load an existing past consultation into Workbench in in-place update mode
  const handleLoadConsultationForEdit = (rec: any) => {
    setActiveConsultationRecordId(rec.id);
    const d = rec.data || {};

    if (d.vitals) {
      if (d.vitals.weight) setValue('weight', String(d.vitals.weight));
      if (d.vitals.height) setValue('height', String(d.vitals.height));
      if (d.vitals.bmi) setValue('bmi', String(d.vitals.bmi));
      if (d.vitals.bp) {
        const parts = String(d.vitals.bp).split('/');
        if (parts[0]) setValue('blood_pressure_systolic', parts[0]);
        if (parts[1]) setValue('blood_pressure_diastolic', parts[1]);
      }
      if (d.vitals.hr) setValue('heart_rate', String(d.vitals.hr));
      if (d.vitals.rr) setValue('respiratory_rate', String(d.vitals.rr));
      if (d.vitals.temp) setValue('temperature', String(d.vitals.temp));
      if (d.vitals.spo2) setValue('spo2', String(d.vitals.spo2));
    }
    if (d.chief_complaints) setValue('chief_complaints', d.chief_complaints);
    if (d.history_of_illness) setValue('history_of_illness', d.history_of_illness);
    if (d.previous_history) setValue('previous_history', d.previous_history);
    if (d.present_history) setValue('present_history', d.present_history);
    if (d.examination) setValue('examination', d.examination);
    if (d.provisional_diagnosis) setValue('provisional_diagnosis', d.provisional_diagnosis);
    if (d.investigations_to_be_advised) setValue('investigations_to_be_advised', d.investigations_to_be_advised);
    if (d.treatment_notes) setValue('treatment_notes', d.treatment_notes);
    if (d.plan) setValue('plan', d.plan);
    if (d.future_consultation_notes) setValue('future_consultation_notes', d.future_consultation_notes);
    if (d.follow_up) setValue('follow_up', d.follow_up);
    if (Array.isArray(d.medications) && d.medications.length > 0) {
      setValue('medications', d.medications);
    }

    toast.info('Consultation Loaded', `Loaded consultation (${rec.created_at?.split('T')[0] || 'history'}) in in-place update mode`);
  };

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

      const targetRecordId = activeConsultationRecordId; // In-place update if already saved in current consultation!
 
       const consultationPayload = {
         ...formData,
         record_type: 'opd_consultation',
         vitals: vitalsPayload,
         nurse_triage_merged: !!effectiveTriage,
         triage_source: effectiveTriage?.source,
         linked_triage_record_id: effectiveTriage?.record_id,
         future_consultation_notes: formData.future_consultation_notes,
         status: 'completed',
       };

       return opdApi.saveConsultation({
         patient_id: selectedPatientId,
         created_by: user?.id,
         record_id: targetRecordId || undefined,
         record_type: 'opd_consultation',
         plugin_id: 'opd',
         data: consultationPayload,
       });
     },
     onError: (err: any) => {
       console.error('Failed to save consultation', err);
       toast.error('Failed to Save Consultation', err?.message || 'Server error saving clinical record');
     },
     onSuccess: async (savedRecord: any) => {
       if (savedRecord?.id) {
         setActiveConsultationRecordId(savedRecord.id);
       }
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

       setSaveSuccessMessage(
         activeConsultationRecordId
           ? 'OPD Consultation updated in-place successfully!'
           : 'OPD Consultation record successfully saved and added to EMR!'
       );
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
         record_type: 'nurse_triage',
         plugin_id: 'opd',
         data: {
           ...formData,
           record_type: 'nurse_triage',
           vitals: vitalsPayload,
           status: 'triage_completed',
         },
       });
     },
     onError: (err: any) => {
       console.error('Failed to save nurse triage', err);
       toast.error('Failed to Save Triage', err?.message || 'Server error saving nurse triage');
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
          const meds = resolvePrescriptionMeds(data.medications, data.treatment_notes || data.plan);
          setPrintablePrescription({
            patient: {
              name: patient?.name,
              vid: patient?.vid,
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
            hopi: data.present_history || data.history_of_illness,
            pastHistory: data.previous_history || data.past_medical_history,
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
            diagnosis: data.examination || data.provisional_diagnosis || 'Fertility Review',
            investigations: data.investigations_to_be_advised || data.investigations_ordered || data.previous_investigations,
            medications: meds,
            advice: data.treatment_notes || data.plan,
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
    const tmpl = allClinicalTemplates.find((t) => t.id === templateId);
    if (!tmpl) return;
    setValue('chief_complaints', tmpl.complaint);
    setValue('present_history', tmpl.hopi);
    setValue('examination', tmpl.diagnosis);
    setValue('investigations_to_be_advised', tmpl.investigations);
    setValue('treatment_notes', tmpl.plan);
    toast.success('Clinical Template Applied', `Loaded "${tmpl.name}"`);
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
    medItems.forEach((medItem: any) => {
      if (typeof medItem === 'string') {
        appendMed({ drug_name: medItem, dose: '', frequency: '', duration: '', instructions: '' });
      } else {
        appendMed({
          drug_name: medItem.drug_name || '',
          dose: medItem.dose || '',
          frequency: medItem.frequency || '',
          duration: medItem.duration || '',
          instructions: medItem.instructions || ''
        });
      }
    });
  };

  const handlePrintPrevious = (rec: any) => {
    const meds = resolvePrescriptionMeds(rec.data?.medications, rec.data?.treatment_notes || rec.data?.plan);
    setPrintablePrescription({
      patient: {
        name: patient?.name,
        vid: patient?.vid,
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
      hopi: rec.data?.present_history || rec.data?.history_of_illness,
      pastHistory: rec.data?.previous_history || rec.data?.past_medical_history,
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
      diagnosis: rec.data?.examination || rec.data?.provisional_diagnosis || 'Fertility Review',
      investigations: rec.data?.investigations_to_be_advised || rec.data?.investigations_ordered || rec.data?.previous_investigations,
      medications: meds,
      advice: rec.data?.treatment_notes || rec.data?.plan,
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
              <Stethoscope className="w-3.5 h-3.5 text-primary" />
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
              <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleApplyTemplate(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[180px] truncate"
                >
                  <option value="" disabled>
                    — Clinical Template —
                  </option>
                  {allClinicalTemplates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.isCustom ? `★ ${tmpl.name}` : tmpl.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setTemplateDialogTab('clinical');
                    setTemplateDialogOpen(true);
                  }}
                  className="p-1 text-slate-400 hover:text-primary rounded hover:bg-slate-200 transition-colors"
                  title="Manage & Edit Clinical Templates"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Templates Studio Dialog Trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTemplateDialogTab('clinical');
                  setTemplateDialogOpen(true);
                }}
                className="gap-1.5 text-xs font-bold bg-white text-slate-700 border-slate-300 hover:bg-slate-50 rounded-md h-8"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Templates Studio</span>
              </Button>

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
          {/* Sidebar Header with Collapse Toggle & Mode Switch */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
            {isSidebarOpen ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Clinical Records</span>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60 transition-colors"
                    title="Collapse History Sidebar"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>
                {/* 2-Tab Switcher: Consultations vs Counselor Notes */}
                <div className="grid grid-cols-2 p-0.5 bg-slate-200/70 rounded-md text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSidebarTab('consultations')}
                    className={`py-1 px-1.5 rounded text-[11px] flex items-center justify-center gap-1 transition-all ${
                      sidebarTab === 'consultations'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <History className="w-3 h-3 text-slate-500" />
                    <span>Consults ({consultationHistory?.length || 0})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarTab('counseling')}
                    className={`py-1 px-1.5 rounded text-[11px] flex items-center justify-center gap-1 transition-all relative ${
                      sidebarTab === 'counseling'
                        ? 'bg-white text-violet-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <HeartHandshake className="w-3 h-3 text-violet-600" />
                    <span>Counseling ({counselingNotes?.length || 0})</span>
                    {counselingNotes && counselingNotes.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
                    )}
                  </button>
                </div>
              </div>
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

          {/* Previous Records List */}
          {isSidebarOpen && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {/* Active Clinical Alerts in Sidebar */}
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-900">Clinical Alerts</span>
                    <span className="text-[11px] truncate block">
                      {activeAlerts && activeAlerts.length > 0 ? activeAlerts.join(', ') : 'No active alerts'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditAlertsModal(true)}
                  className="text-[10px] font-bold text-amber-900 hover:underline flex-shrink-0 px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 transition-colors"
                >
                  Edit
                </button>
              </div>

              {sidebarTab === 'consultations' ? (
                /* Doctor Consultations List */
                consultationHistory && consultationHistory.length > 0 ? (
                  consultationHistory.map((rec: any) => (
                    <div
                      key={rec.id}
                      className={`p-2.5 border rounded-md transition-colors group relative shadow-2xs ${
                        activeConsultationRecordId === rec.id
                          ? 'bg-amber-50/70 border-amber-400 ring-1 ring-amber-400'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
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
                            onClick={() => handleLoadConsultationForEdit(rec)}
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded flex items-center gap-0.5 shadow-2xs"
                            title="Load into Workbench to edit / update this record"
                          >
                            Edit
                          </button>
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
                                : 'bg-primary/10 text-primary border-primary/20'
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
                )
              ) : (
                /* Pre-ART Counselor Sessions List */
                counselingNotes && counselingNotes.length > 0 ? (
                  counselingNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => setViewingCounselingNote(note)}
                      className="p-2.5 bg-violet-50/50 hover:bg-violet-50 border border-violet-200 rounded-md transition-all group cursor-pointer shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1 text-slate-500 font-medium">
                          <Clock className="w-3 h-3 text-violet-500" />
                          {formatDateTime(note.created_at)}
                        </span>
                        <Badge className="bg-violet-100 text-violet-800 border-violet-300 text-[10px] px-1.5 py-0 font-bold">
                          {note.procedure || 'Pre-ART'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900">
                          Source: <span className="text-violet-700">{note.source || 'Direct'}</span>
                        </span>
                        <span className="text-[10px] font-bold text-violet-600 bg-white px-1.5 py-0.5 rounded border border-violet-200 shadow-2xs group-hover:bg-violet-600 group-hover:text-white transition-colors">
                          View 8-Pt Sheet →
                        </span>
                      </div>
                      {note.discussion && (
                        <p className="text-[10px] text-slate-600 line-clamp-2 bg-white/80 p-1 rounded border border-violet-100">
                          <strong>Discussion:</strong> {note.discussion}
                        </p>
                      )}
                      <div className="pt-0.5 flex items-center justify-between text-[10px] text-slate-500 border-t border-violet-100/60">
                        <span>By: <strong>{note.counselor_name || 'Counselor'}</strong></span>
                        <span className="italic text-slate-400">Sig: {note.signature || 'Signed'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    <HeartHandshake className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                    No pre-ART counseling sessions recorded for this patient.
                  </div>
                )
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
                    className="text-[11px] font-bold text-primary hover:text-primary-mid bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md transition-colors"
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
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
              {/* Active Consultation In-Place Update Alert */}
              {activeConsultationRecordId && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between shadow-2xs animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-amber-950">Editing Existing Consultation (In-Place Update Mode)</p>
                      <p className="text-[10px] text-amber-700">Any changes saved will directly update this consultation in EMR without creating duplicates.</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveConsultationRecordId(null);
                      reset();
                      toast.info('New Consultation', 'Reset form to start a brand new consultation record');
                    }}
                    className="h-7 text-xs font-bold bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  >
                    + Start New Consult
                  </Button>
                </div>
              )}

              {/* Pre-ART Counselor Session Quick Review Banner (Doctor Consultation) */}
              {counselingNotes && counselingNotes.length > 0 && (
                <div className="p-3 bg-violet-50/90 border border-violet-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-violet-100 text-violet-700 flex items-center justify-center flex-shrink-0">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-violet-950">Pre-ART Counselor Notes on File ({counselingNotes.length})</p>
                        <Badge className="bg-violet-600 text-white text-[10px] px-1.5 py-0">
                          {counselingNotes[0].procedure || 'Pre-ART Consultation'}
                        </Badge>
                        <span className="text-[10px] text-violet-700 font-semibold hidden sm:inline">
                          Source: {counselingNotes[0].source || 'Direct'}
                        </span>
                      </div>
                      <p className="text-[11px] text-violet-800 line-clamp-1">
                        Counselor: <strong>{counselingNotes[0].counselor_name || 'Counselor'}</strong> · {formatDateTime(counselingNotes[0].created_at)}
                        {counselingNotes[0].discussion ? ` · Discussion: ${counselingNotes[0].discussion.slice(0, 80)}...` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setViewingCounselingNote(counselingNotes[0])}
                      className="h-7 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-2xs gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Review 8-Point Case Sheet</span>
                    </Button>
                  </div>
                </div>
              )}

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
                        <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded font-bold text-primary">
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
                    className="text-xs font-bold text-primary hover:text-primary-mid flex items-center gap-1 px-2.5 py-1 rounded hover:bg-primary/10 transition-colors self-end sm:self-center"
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
                    <FileText className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
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

              {/* SECTION 1: Subjective / Clinical History (Collapsible Card with Inline Template Support) */}
              <Card id="clinical-history-section" className="border-slate-200 shadow-sm scroll-mt-20">
                <CardHeader
                  className="py-3 px-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap gap-2 items-center justify-between cursor-pointer select-none"
                  onClick={() => setIsHistorySectionExpanded(!isHistorySectionExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Clinical History &amp; Subjective Assessment
                    </CardTitle>
                    {clinicalHistoryTemplate !== 'standard' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2878a8]/10 text-[#2878a8] border border-[#2878a8]/20 capitalize">
                        {clinicalHistoryTemplate} Template Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Template Mode Switcher right on Section 1 */}
                    <div className="flex items-center bg-slate-200/80 p-0.5 rounded-md text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setClinicalHistoryTemplate('standard')}
                        className={`px-2.5 py-1 rounded transition-all ${
                          clinicalHistoryTemplate === 'standard'
                            ? 'bg-white text-slate-900 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Free-text Chief Complaints & Present History"
                      >
                        Free-text
                      </button>
                      <button
                        type="button"
                        onClick={() => setClinicalHistoryTemplate('fertility')}
                        className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                          clinicalHistoryTemplate === 'fertility'
                            ? 'bg-[#2878a8] text-white shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Structured Fertility Assessment & Couple Proforma"
                      >
                        <Heart className="w-3 h-3 text-rose-500" />
                        <span>Fertility</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setClinicalHistoryTemplate('gynaecology')}
                        className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                          clinicalHistoryTemplate === 'gynaecology'
                            ? 'bg-[#2878a8] text-white shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Structured Gynaecology Clinical History"
                      >
                        <Activity className="w-3 h-3 text-violet-500" />
                        <span>Gynaecology</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setClinicalHistoryTemplate('obstetric')}
                        className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                          clinicalHistoryTemplate === 'obstetric'
                            ? 'bg-[#2878a8] text-white shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Structured Obstetric Antenatal Record"
                      >
                        <Baby className="w-3 h-3 text-emerald-500" />
                        <span>Obstetric</span>
                      </button>
                    </div>

                    <button type="button" className="text-slate-400 hover:text-slate-600 p-1">
                      {isHistorySectionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </CardHeader>

                {isHistorySectionExpanded && (
                  <CardContent className="p-4 space-y-4">
                    {clinicalHistoryTemplate === 'standard' ? (
                      /* Mode A: Standard Free-text Textareas */
                      <>
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

                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">Present History</label>
                            <textarea
                              {...register('present_history')}
                              rows={12}
                              placeholder="Detailed chronological history of present illness..."
                              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">Previous History</label>
                            <textarea
                              {...register('previous_history')}
                              rows={5}
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
                      </>
                    ) : (
                      /* Mode B: Structured Clinical Template replacing the Free-Text inputs directly inline */
                      <div className="-mx-4 -my-4 border-t border-slate-200">
                        <ClinicalHistoryProformaModal
                          patient={patient}
                          partner={patient?.partner}
                          inline={true}
                          initialType={clinicalHistoryTemplate}
                          onClose={() => setClinicalHistoryTemplate('standard')}
                          onDataChange={(proformaData, summary) => {
                            if (summary.complaints) setValue('chief_complaints', summary.complaints);
                            if (summary.history) setValue('present_history', summary.history);
                            if (summary.pastHistory) setValue('previous_history', summary.pastHistory);
                            if (summary.exam) setValue('examination', summary.exam);
                            if (proformaData.finalDiagnosis) setValue('provisional_diagnosis', proformaData.finalDiagnosis);
                            setValue('clinical_proforma', proformaData);
                          }}
                        />
                      </div>
                    )}
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
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5 text-[rgb(var(--clr-primary))]" />
                          <span>Investigations</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">Click options below to quickly add/remove</span>
                      </div>

                      {/* Quick Selectable Investigation Options */}
                      <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-slate-50/80 rounded-md border border-slate-200">
                        {dynamicInvestigations.map((opt) => {
                          const currentVal = watch('investigations_to_be_advised') || '';
                          const isSelected = currentVal.toLowerCase().includes(opt.toLowerCase());
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                const lines = currentVal.split('\n').map((l: string) => l.trim()).filter(Boolean);
                                const matchIdx = lines.findIndex((l: string) => l.toLowerCase() === opt.toLowerCase() || l.toLowerCase().includes(opt.toLowerCase()));
                                if (matchIdx >= 0) {
                                  lines.splice(matchIdx, 1);
                                  setValue('investigations_to_be_advised', lines.join('\n'));
                                } else {
                                  lines.push(opt);
                                  setValue('investigations_to_be_advised', lines.join('\n'));
                                }
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[rgb(var(--clr-primary))]/10 border-[rgb(var(--clr-primary))] text-[rgb(var(--clr-primary))] font-bold shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                            >
                              {isSelected ? `✓ ${opt}` : `+ ${opt}`}
                            </button>
                          );
                        })}
                      </div>

                      <textarea
                        {...register('investigations_to_be_advised')}
                        rows={3}
                        placeholder="Selected investigations will appear here, or type additional investigations..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))] font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-[rgb(var(--clr-primary))]" />
                          <span>Treatment (Medications)</span>
                        </label>
                        {/* Rx Template Selector */}
                        <div className="flex items-center gap-1.5">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleApplyRxTemplate(e.target.value);
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                            className="h-7 px-2 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-md hover:bg-primary/15 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer shadow-2xs max-w-[220px] truncate"
                          >
                            <option value="" disabled>⚡ Apply Rx Template...</option>
                            {allRxTemplates.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.isCustom ? `★ ${t.category}: ${t.name}` : `${t.category}: ${t.name}`}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTemplateDialogTab('rx');
                              setTemplateDialogOpen(true);
                            }}
                            className="h-7 px-2 text-[11px] font-bold text-slate-700 border-slate-300 hover:bg-slate-100 gap-1 shadow-2xs"
                            title="Manage & Edit Prescription Templates"
                          >
                            <SlidersHorizontal className="w-3 h-3 text-primary" />
                            <span>Manage</span>
                          </Button>
                        </div>
                      </div>
                      
                      {/* Structured Medication Array */}
                      <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                        {medFields.map((field, index) => (
                          <div key={field.id} className="flex gap-2 items-start relative flex-wrap sm:flex-nowrap">
                            <div className="flex-1 min-w-[130px]">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Drug Name (Searchable)</label>
                              <Input
                                {...register(`medications.${index}.drug_name`)}
                                list="drugList"
                                placeholder="e.g. Tab Paracetamol"
                                className="h-8 text-xs mt-1 bg-white"
                              />
                            </div>
                            <div className="w-20">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Dose</label>
                              <Input
                                {...register(`medications.${index}.dose`)}
                                placeholder="500mg"
                                className="h-8 text-xs mt-1 bg-white"
                              />
                            </div>
                            <div className="w-28">
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
                            <div className="w-24">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                              <Input
                                {...register(`medications.${index}.duration`)}
                                placeholder="e.g. 5 days"
                                className="h-8 text-xs mt-1 bg-white"
                              />
                            </div>
                            <div className="flex-1 min-w-[130px]">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Instructions</label>
                              <Input
                                {...register(`medications.${index}.instructions`)}
                                placeholder="After food"
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
                          onClick={() => appendMed({ drug_name: '', dose: '', frequency: '', duration: '', instructions: '' })}
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

                      {/* Notes for Future Consultation Reference (Requirement 5) */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-amber-700" />
                            <span>Notes for Future Consultation Reference</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-medium">Internal clinical reference for upcoming visits</span>
                        </div>
                        <textarea
                          {...register('future_consultation_notes')}
                          rows={3}
                          placeholder="e.g. Next visit: Assess Day 10 endometrial pattern and consider adding vaginal sildenafil if < 7mm. Check partner seminal culture..."
                          className="w-full bg-amber-50/40 border border-amber-200 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="w-48">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Follow-Up Schedule</label>
                      <input
                        list="followup-options"
                        {...register('follow_up')}
                        placeholder="Select or type custom (e.g. 10 days)"
                        className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white"
                      />
                      <datalist id="followup-options">
                        <option value="SOS (As Needed)" />
                        <option value="2 days" />
                        <option value="3 days" />
                        <option value="5 days" />
                        <option value="1 week" />
                        <option value="10 days" />
                        <option value="2 weeks" />
                        <option value="1 month" />
                        <option value="PCOS Metabolic Review (3 mo)" />
                        <option value="No Follow-up required" />
                      </datalist>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Bottom Form Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-3">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rail-bg/50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-lg">Consultation Record</h3>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-primary/10 text-primary border-primary/20"
                  >
                    {viewingRecord.record_type || 'OPD Consultation'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {formatDateTime(viewingRecord.created_at || viewingRecord.updated_at || viewingRecord.data?.created_at)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setViewingRecord(null)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5 divide-y divide-slate-100">
              {/* Section 1: Subjective & History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Subjective &amp; History</span>
                </h4>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/70 space-y-3">
                  <div>
                    <span className="font-semibold text-slate-700 text-xs">Chief Complaints:</span>
                    <p className="text-xs font-medium text-slate-900 mt-1 whitespace-pre-line">
                      {viewingRecord.data?.chief_complaints || 'None recorded'}
                    </p>
                  </div>
                  {(viewingRecord.data?.history_of_illness || viewingRecord.data?.present_history || viewingRecord.data?.previous_history || viewingRecord.data?.past_medical_history) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200/60">
                      {(viewingRecord.data?.history_of_illness || viewingRecord.data?.present_history) && (
                        <div>
                          <span className="font-semibold text-slate-600 text-xs">History of Present Illness (HPI):</span>
                          <p className="text-xs text-slate-800 mt-0.5 whitespace-pre-line">
                            {viewingRecord.data?.history_of_illness || viewingRecord.data?.present_history}
                          </p>
                        </div>
                      )}
                      {(viewingRecord.data?.previous_history || viewingRecord.data?.past_medical_history) && (
                        <div>
                          <span className="font-semibold text-slate-600 text-xs">Past Medical / Surgical Hx:</span>
                          <p className="text-xs text-slate-800 mt-0.5 whitespace-pre-line">
                            {viewingRecord.data?.previous_history || viewingRecord.data?.past_medical_history}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Vitals & Physical Examination */}
              {(viewingRecord.data?.vitals || viewingRecord.data?.examination || viewingRecord.data?.cvs_findings || viewingRecord.data?.rs_findings || viewingRecord.data?.cns_findings) && (
                <div className="pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                    <span>Objective &amp; Examination</span>
                  </h4>
                  
                  {/* Vitals Grid */}
                  {viewingRecord.data?.vitals && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-rose-50/30 p-3 rounded-lg border border-rose-100">
                      <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">BP</span>
                        <span className="text-xs font-bold text-slate-800">{viewingRecord.data.vitals.bp || '—'}</span>
                      </div>
                      <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Heart Rate</span>
                        <span className="text-xs font-bold text-slate-800">{viewingRecord.data.vitals.hr ? `${viewingRecord.data.vitals.hr} bpm` : '—'}</span>
                      </div>
                      <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Resp Rate</span>
                        <span className="text-xs font-bold text-slate-800">{viewingRecord.data.vitals.rr ? `${viewingRecord.data.vitals.rr} /m` : '—'}</span>
                      </div>
                      <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Temp</span>
                        <span className="text-xs font-bold text-slate-800">{viewingRecord.data.vitals.temp ? `${viewingRecord.data.vitals.temp} °F` : '—'}</span>
                      </div>
                      <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">SpO2</span>
                        <span className="text-xs font-bold text-slate-800">{viewingRecord.data.vitals.spo2 ? `${viewingRecord.data.vitals.spo2}%` : '—'}</span>
                      </div>
                      <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Weight</span>
                        <span className="text-xs font-bold text-slate-800">{viewingRecord.data.vitals.weight ? `${viewingRecord.data.vitals.weight} kg` : '—'}</span>
                      </div>
                      <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Height</span>
                        <span className="text-xs font-bold text-slate-800">{viewingRecord.data.vitals.height ? `${viewingRecord.data.vitals.height} cm` : '—'}</span>
                      </div>
                      <div className="text-center p-1.5 bg-white rounded border border-rose-100/80">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">BMI</span>
                        <span className="text-xs font-bold text-slate-800">{viewingRecord.data.vitals.bmi || '—'}</span>
                      </div>
                    </div>
                  )}

                  {/* Physical Examination */}
                  {viewingRecord.data?.examination && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                      <span className="font-semibold text-slate-700 text-xs">Physical Examination:</span>
                      <p className="text-xs text-slate-800 mt-1 whitespace-pre-line">{viewingRecord.data.examination}</p>
                    </div>
                  )}

                  {/* Systemic Examination findings */}
                  {(viewingRecord.data?.cvs_findings || viewingRecord.data?.rs_findings || viewingRecord.data?.cns_findings) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                      {viewingRecord.data?.cvs_findings && (
                        <div>
                          <span className="font-bold text-slate-500 text-[10px] uppercase">CVS</span>
                          <p className="text-slate-800 mt-0.5">{viewingRecord.data.cvs_findings}</p>
                        </div>
                      )}
                      {viewingRecord.data?.rs_findings && (
                        <div>
                          <span className="font-bold text-slate-500 text-[10px] uppercase">RS</span>
                          <p className="text-slate-800 mt-0.5">{viewingRecord.data.rs_findings}</p>
                        </div>
                      )}
                      {viewingRecord.data?.cns_findings && (
                        <div>
                          <span className="font-bold text-slate-500 text-[10px] uppercase">CNS</span>
                          <p className="text-slate-800 mt-0.5">{viewingRecord.data.cns_findings}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Section 3: Assessment & Diagnostics */}
              <div className="pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-primary" />
                  <span>Assessment &amp; Diagnosis</span>
                </h4>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/70 space-y-3">
                  <div>
                    <span className="font-semibold text-slate-700 text-xs">Provisional / Final Diagnosis:</span>
                    <p className="text-sm font-bold text-text-main mt-0.5">
                      {viewingRecord.data?.provisional_diagnosis || viewingRecord.data?.diagnosis || 'Clinical Review'}
                    </p>
                  </div>
                  {(viewingRecord.data?.investigations_to_be_advised || viewingRecord.data?.investigations_ordered || viewingRecord.data?.previous_investigations) && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                        <FlaskConical className="w-3.5 h-3.5 text-primary" />
                        <span>Investigations:</span>
                      </span>
                      <p className="text-xs text-slate-800 mt-1 whitespace-pre-line">
                        {viewingRecord.data?.investigations_to_be_advised || viewingRecord.data?.investigations_ordered || viewingRecord.data?.previous_investigations}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Treatment & Medications */}
              <div className="pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Treatment Plan &amp; Regimen</span>
                </h4>

                {/* Structured Medications Table */}
                {Array.isArray(viewingRecord.data?.medications) && viewingRecord.data.medications.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">Drug / Medicine Name</th>
                          <th className="p-2.5">Dose</th>
                          <th className="p-2.5">Frequency</th>
                          <th className="p-2.5">Duration</th>
                          <th className="p-2.5">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {viewingRecord.data.medications.map((m: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="p-2.5 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-900">{m.drug_name || m.drug || '—'}</td>
                            <td className="p-2.5 font-semibold text-slate-700">{m.dose || '—'}</td>
                            <td className="p-2.5">
                              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 text-[11px] font-bold">
                                {m.frequency || m.freq || 'OD'}
                              </span>
                            </td>
                            <td className="p-2.5 font-medium text-slate-700">{m.duration || '—'}</td>
                            <td className="p-2.5 text-slate-600">{m.instructions || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {/* Treatment Notes / Plan */}
                {(viewingRecord.data?.treatment_notes || viewingRecord.data?.plan) && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                    <span className="font-semibold text-slate-700 text-xs">Treatment &amp; Dietary Advice:</span>
                    <p className="text-xs text-slate-800 mt-1 whitespace-pre-line">
                      {viewingRecord.data?.treatment_notes || viewingRecord.data?.plan}
                    </p>
                  </div>
                )}

                {/* Notes for Future Consultation Reference */}
                {viewingRecord.data?.future_consultation_notes && (
                  <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-700" />
                      <span>Notes for Future Consultation Reference</span>
                    </h4>
                    <p className="text-xs text-amber-950 whitespace-pre-line font-medium">
                      {viewingRecord.data.future_consultation_notes}
                    </p>
                  </div>
                )}

                {/* Follow-up */}
                {viewingRecord.data?.follow_up && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                    <span className="font-bold text-slate-500">Next Follow-Up:</span>
                    <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                      {viewingRecord.data.follow_up.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleLoadConsultationForEdit(viewingRecord);
                    setViewingRecord(null);
                  }}
                  className="text-amber-800 border-amber-300 hover:bg-amber-50 rounded-md font-bold px-4 flex items-center gap-1.5"
                >
                  <span>Load into Workbench (Edit)</span>
                </Button>
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
              </div>
              <Button onClick={() => setViewingRecord(null)} className="bg-primary hover:bg-primary-mid text-white rounded-md font-bold px-6">
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

      {/* Edit Clinical Alerts Modal */}
      <EditAlertsModal
        open={showEditAlertsModal}
        onClose={() => setShowEditAlertsModal(false)}
        patientId={selectedPatientId}
        patientName={patient?.name || 'Patient'}
        initialAlerts={activeAlerts}
        onSuccess={(updatedAlerts: string[]) => {
          setLocalAlerts(updatedAlerts);
          queryClient.setQueryData(['patient', selectedPatientId], (old: any) =>
            old ? { ...old, alert_notes: updatedAlerts } : old
          );
          queryClient.invalidateQueries({ queryKey: ['patient', selectedPatientId] });
        }}
      />

      {/* Template Management Dialog (Clinical & Rx) */}
      <TemplateManagementDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        defaultTab={templateDialogTab}
        initialClinicalTemplates={CLINICAL_TEMPLATES}
        initialRxTemplates={RX_TEMPLATES}
        onApplyClinicalTemplate={(tmpl) => handleApplyTemplate(tmpl.id)}
        onApplyRxTemplate={(tmpl) => handleApplyRxTemplate(tmpl.id)}
        onTemplatesUpdated={() => {
          refetchClinicalTemplates();
          refetchRxTemplates();
        }}
      />

      {/* 8-Point Counselor Notes Case Sheet Modal */}
      {/* 8-Point Counselor Notes Case Sheet Modal */}
      {viewingCounselingNote && (
        <div className="fixed inset-0 bg-rail-bg/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs print:p-0 print:static print:bg-white print:overflow-visible">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 print:border-none print:shadow-none print:max-w-none print:w-full print:p-0 print:m-0 print:max-h-none print:overflow-visible">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 bg-violet-50/80 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-violet-600 text-white flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">Pre-ART Clinical Counseling Case Sheet</h3>
                    <Badge className="bg-violet-600 text-white text-[10px] px-1.5 py-0">
                      {viewingCounselingNote.procedure || 'Procedure Note'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Patient: <strong className="text-slate-800">{patient?.name || viewingCounselingNote.patient_name || 'Patient'}</strong> ({patient?.vid || viewingCounselingNote.patient_vid || '—'}) · Session: {formatDateTime(viewingCounselingNote.created_at)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingCounselingNote(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: The 8 Clinical Columns */}
            <div className="printable-document p-4 sm:p-6 overflow-y-auto space-y-4 text-xs print:overflow-visible print:p-0">
              <PrintableReportHeader
                title="PRE-ART CLINICAL COUNSELING RECORD"
                subtitle="VaidyaMD Reproductive Medicine • Patient Counseling & Informed Dialogue"
                patient={{
                  name: patient?.name || viewingCounselingNote.patient_name,
                  vid: patient?.vid || viewingCounselingNote.patient_vid,
                  age: patient?.age,
                  gender: patient?.gender || 'Female',
                  partner_name: patient?.partner_name,
                }}
                metaFields={[
                  { label: 'Procedure', value: viewingCounselingNote.procedure || '—' },
                  { label: 'Date', value: formatDateTime(viewingCounselingNote.created_at) },
                  { label: 'Source', value: viewingCounselingNote.source || 'OPD' },
                  { label: 'Counselor', value: viewingCounselingNote.counselor_name || 'Counselor Specialist' },
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">1. Source</span>
                  <p className="font-bold text-slate-800 text-sm">{viewingCounselingNote.source || '—'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">2. Procedure</span>
                  <p className="font-bold text-violet-800 text-sm">{viewingCounselingNote.procedure || '—'}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">3. Egg Pick Up</span>
                <p className="text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                  {viewingCounselingNote.egg_pick_up || '—'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">4. Discussion</span>
                <p className="text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                  {viewingCounselingNote.discussion || '—'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">5. Laparoscopy / Hysteroscopy / Etc</span>
                <p className="text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                  {viewingCounselingNote.laparoscopy_hysteroscopy || '—'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">6. Egg Transfer</span>
                <p className="text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                  {viewingCounselingNote.egg_transfer || '—'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">7. Remarks</span>
                <p className="text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                  {viewingCounselingNote.remarks || '—'}
                </p>
              </div>

              {/* Signature & Counselor Sign-off Card */}
              <div className="p-3 bg-violet-50/70 border border-violet-200 rounded-lg flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-violet-700 block">8. Counselor Signature &amp; Attestation</span>
                  <p className="text-sm font-bold font-serif italic text-slate-900 mt-0.5">
                    {viewingCounselingNote.signature || 'Digital Sign-off'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">{viewingCounselingNote.counselor_name || 'Counselor Specialist'}</p>
                  <p className="text-[10px] text-slate-500">Reproductive Counselor · VaidyaMD</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex justify-between items-center print:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs font-bold bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Case Sheet</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setViewingCounselingNote(null)}
                className="bg-primary hover:bg-primary-mid text-white text-xs font-bold px-5"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
