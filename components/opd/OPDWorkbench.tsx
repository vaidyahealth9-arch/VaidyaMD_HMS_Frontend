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
import PrintableCounselingSheetModal from '@/components/common/PrintableCounselingSheetModal';
import ClinicalHistoryProformaModal from './ClinicalHistoryProformaModal';
import EditAlertsModal from '@/components/patients/EditAlertsModal';
import OPDSidebar from './OPDSidebar';
import OPDVitalsSection from './OPDVitalsSection';
import OPDPrescriptionSection from './OPDPrescriptionSection';
import ConsultationRecordModal from './ConsultationRecordModal';
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
  const { register, handleSubmit, setValue, getValues, watch, reset, control } = useForm({
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

  const { fields: medFields, append: appendMed, remove: removeMed, replace: replaceMeds } = useFieldArray({
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

  // Helper to extract structured prescription medications
  const resolvePrescriptionMeds = (rawMeds: any[], fallbackPlan?: string) => {
    if (Array.isArray(rawMeds) && rawMeds.length > 0) {
      const valid = rawMeds
        .filter((m: any) => (m?.drug_name || m?.drug) && (m?.drug_name || m?.drug).toString().trim())
        .map((m: any) => ({
          drug: (m.drug_name || m.drug).toString().trim(),
          dose: m.dose ? m.dose.toString().trim() : '1 tab',
          freq: m.frequency || m.freq || 'OD',
          duration: m.duration ? m.duration.toString().trim() : '—',
          instructions: m.instructions ? m.instructions.toString().trim() : 'After food',
        }));
      if (valid.length > 0) return valid;
    }

    if (fallbackPlan && typeof fallbackPlan === 'string' && fallbackPlan.trim()) {
      const lines = fallbackPlan
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);
      
      // Only treat fallback lines as meds if they look like medications (e.g. Tab/Inj/Cap/Syp/numbered lines)
      const likelyMeds = lines.filter(l => /^(tab|inj|cap|syp|tablet|injection|capsule|\d+[\.\)])\s+/i.test(l));
      if (likelyMeds.length > 0) {
        return likelyMeds.map((line: string) => ({
          drug: line.replace(/^\d+[\.\)]\s*/, '').trim(),
          dose: 'As advised',
          freq: 'OD',
          duration: '—',
          instructions: 'As directed by physician',
        }));
      }
    }
    return [];
  };

  // Open Prescription Print Preview directly from current form state
  const handleOpenPrintPreview = (customMeds?: any[]) => {
    const rawMeds = customMeds || getValues('medications') || [];
    const meds = resolvePrescriptionMeds(rawMeds);
    const formVals = getValues();
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
      chiefComplaint: formVals.chief_complaints,
      hopi: formVals.present_history || formVals.history_of_illness,
      pastHistory: formVals.previous_history,
      examination: formVals.examination,
      vitals: {
        bp:
          formVals.blood_pressure_systolic && formVals.blood_pressure_diastolic
            ? `${formVals.blood_pressure_systolic}/${formVals.blood_pressure_diastolic}`
            : undefined,
        pulse: formVals.heart_rate ? `${formVals.heart_rate} bpm` : undefined,
        temp: formVals.temperature ? `${formVals.temperature} °F` : undefined,
        weight: formVals.weight ? `${formVals.weight} kg` : undefined,
        height: formVals.height ? `${formVals.height} cm` : undefined,
        bmi: formVals.bmi ? `${formVals.bmi}` : undefined,
        spo2: formVals.spo2 ? `${formVals.spo2}%` : undefined,
        rr: formVals.respiratory_rate ? `${formVals.respiratory_rate} /min` : undefined,
      },
      diagnosis: formVals.provisional_diagnosis || (formVals.examination ? undefined : 'Fertility Review'),
      differentialDiagnosis: formVals.differential_diagnosis,
      investigations: formVals.investigations_to_be_advised || formVals.investigations_ordered || formVals.previous_investigations,
      medications: meds,
      advice: formVals.treatment_notes || formVals.plan,
      nextFollowUp:
        formVals.follow_up === '1_week'
          ? 'Review in 1 week'
          : formVals.follow_up === '2_weeks'
          ? 'Review in 2 weeks'
          : formVals.follow_up === '1_month'
          ? 'Review in 1 month'
          : 'As advised',
    });
  };

  // Apply Rx Template to structured medications array
  const handleApplyRxTemplate = (templateId: string) => {
    const tmpl = allRxTemplates.find((t) => t.id === templateId);
    if (!tmpl) return;

    // Filter out completely blank rows
    const currentMeds = getValues('medications') || watch('medications') || [];
    const existing = currentMeds.filter((f: any) => (f.drug_name || f.drug) && (f.drug_name || f.drug).trim());
    
    // Set medications with template rows using replaceMeds so useFieldArray updates immediately
    const updatedMeds = [
      ...existing,
      ...tmpl.medications.map((m) => ({
        drug_name: m.drug_name,
        dose: m.dose,
        frequency: m.frequency,
        duration: m.duration || '',
        instructions: m.instructions,
      })),
    ];
    replaceMeds(updatedMeds);

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
      replaceMeds(d.medications);
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

    // Accurately capture medications from form or values
    const rawMeds = (data.medications && data.medications.length > 0) ? data.medications : (getValues('medications') || []);
    const validMeds = Array.isArray(rawMeds)
      ? rawMeds
          .filter((m: any) => (m?.drug_name || m?.drug) && (m?.drug_name || m?.drug).toString().trim())
          .map((m: any) => ({
            drug_name: (m.drug_name || m.drug).toString().trim(),
            dose: (m.dose || '').toString().trim(),
            frequency: (m.frequency || m.freq || 'OD').toString().trim(),
            duration: (m.duration || '').toString().trim(),
            instructions: (m.instructions || '').toString().trim(),
          }))
      : [];

    const consultationData = {
      ...data,
      medications: validMeds,
    };

    saveMutation.mutate(consultationData, {
      onSuccess: () => {
        if (andPrint) {
          handleOpenPrintPreview(validMeds);
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
      examination: rec.data?.examination,
      vitals: {
        bp:
          rec.data?.blood_pressure_systolic && rec.data?.blood_pressure_diastolic
            ? `${rec.data.blood_pressure_systolic}/${rec.data.blood_pressure_diastolic}`
            : undefined,
        pulse: rec.data?.heart_rate ? `${rec.data.heart_rate} bpm` : undefined,
        temp: rec.data?.temperature ? `${rec.data.temperature} °F` : undefined,
        weight: rec.data?.weight ? `${rec.data.weight} kg` : undefined,
        height: rec.data?.height ? `${rec.data.height} cm` : undefined,
        bmi: rec.data?.bmi ? `${rec.data.bmi}` : undefined,
        spo2: rec.data?.spo2 ? `${rec.data.spo2}%` : undefined,
        rr: rec.data?.respiratory_rate ? `${rec.data.respiratory_rate} /min` : undefined,
      },
      diagnosis: rec.data?.provisional_diagnosis || (rec.data?.examination ? undefined : 'Fertility Review'),
      differentialDiagnosis: rec.data?.differential_diagnosis,
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
        {/* LEFT PANE: Collapsible Consultation History Sidebar */}
        <OPDSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          sidebarTab={sidebarTab}
          setSidebarTab={setSidebarTab}
          consultationHistory={consultationHistory || []}
          counselingNotes={counselingNotes || []}
          activeAlerts={activeAlerts || []}
          onEditAlerts={() => setShowEditAlertsModal(true)}
          activeConsultationRecordId={activeConsultationRecordId}
          onSelectRecord={(rec) => setViewingRecord(rec)}
          onLoadConsultationForEdit={(rec) => handleLoadConsultationForEdit(rec)}
          onPrintPrevious={(rec) => handlePrintPrevious(rec)}
          onSelectCounselingNote={(note) => setViewingCounselingNote(note)}
        />

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
              <OPDVitalsSection
                workbenchMode="nurse"
                register={register}
                watch={watch}
                setValue={setValue}
                effectiveTriage={effectiveTriage}
                isDoctorVitalsExpanded={isDoctorVitalsExpanded}
                setIsDoctorVitalsExpanded={setIsDoctorVitalsExpanded}
                isPending={saveNurseTriageMutation.isPending}
              />

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
              <OPDVitalsSection
                workbenchMode="doctor"
                register={register}
                watch={watch}
                setValue={setValue}
                effectiveTriage={effectiveTriage}
                isDoctorVitalsExpanded={isDoctorVitalsExpanded}
                setIsDoctorVitalsExpanded={setIsDoctorVitalsExpanded}
              />

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

              {/* SECTION 2: Assessment, Orders & Management Plan */}
              <OPDPrescriptionSection
                register={register}
                watch={watch}
                setValue={setValue}
                medFields={medFields}
                appendMed={appendMed}
                removeMed={removeMed}
                dynamicInvestigations={dynamicInvestigations}
                allRxTemplates={allRxTemplates}
                onApplyRxTemplate={handleApplyRxTemplate}
                onManageTemplates={() => {
                  setTemplateDialogTab('rx');
                  setTemplateDialogOpen(true);
                }}
                onPreviewRx={() => handleOpenPrintPreview()}
                isPlanSectionExpanded={isPlanSectionExpanded}
                setIsPlanSectionExpanded={setIsPlanSectionExpanded}
                onOpenSmartOrder={() => setSmartOrderOpen(true)}
              />

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
      <ConsultationRecordModal
        record={viewingRecord}
        onClose={() => setViewingRecord(null)}
        onLoadForEdit={(rec) => handleLoadConsultationForEdit(rec)}
        onPrintRx={(rec) => handlePrintPrevious(rec)}
      />

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

      {/* Pre-ART Clinical Counseling Sheet Modal */}
      <PrintableCounselingSheetModal
        isOpen={!!viewingCounselingNote}
        onClose={() => setViewingCounselingNote(null)}
        note={viewingCounselingNote}
        patient={patient}
      />

    </div>
  );
}
