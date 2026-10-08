'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { treatmentCyclesApi, protocolsApi, authApi } from '@/lib/api';
import { formatDate, isUserDoctor } from '@/lib/utils';
import { toast } from '@/contexts/ToastContext';
import { PlanDetailsSubTabContent } from '@/components/fertility/plan-details';
import {
  Target,
  Dna,
  Microscope,
  Calendar,
  BarChart2,
  Pill,
  CheckCircle2,
  Droplet,
  Search,
  Syringe,
  Zap,
  FlaskConical,
  Heart,
  Lightbulb,
  X,
  Play,
  Clock,
  Activity,
  ChevronDown,
  Check,
} from 'lucide-react';

import {
  TreatmentTypeItem,
  DEFAULT_TREATMENT_TYPES,
  TreatmentCycleWizardProps,
  EndometrialMonitoringRow,
  CycleFormState,
  WizardStepIntendedTreatment,
  WizardStepGameteSource,
  WizardStepGeneticScreening,
  WizardStepProtocolDates,
  WizardStepEndometrialMonitoring,
  WizardStepSummarySubmit,
} from './wizard';

const steps = [
  { id: 1, label: 'Intended Treatment', icon: Target },
  { id: 2, label: 'Gamete Source', icon: Dna },
  { id: 3, label: 'PGS / PGD', icon: Microscope },
  { id: 4, label: 'Protocol & Sentinel Dates', icon: Calendar },
  { id: 5, label: 'Endometrial Monitoring', icon: BarChart2 },
  { id: 6, label: 'Medication Calendar', icon: Pill },
  { id: 7, label: 'Summary & Submit', icon: CheckCircle2 },
];

export default function TreatmentCycleWizard({
  patientId,
  partnerId,
  patient,
  partner,
  onSuccess,
  onCancel,
  userId,
}: TreatmentCycleWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarPreview, setCalendarPreview] = useState<any>(null);
  const [cycleTypes, setCycleTypes] = useState<{id: string; name: string}[]>([]);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [typeSearchQuery, setTypeSearchQuery] = useState('');
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CycleFormState>({
    treatment_type: '', // Starts blank so clinician can choose without forced ICSI
    attempt_number: 1,
    treating_doctor_id: '',
    female_factors: [],
    male_factors: [],
    treatment_at_other_centre: false,
    previous_centre_name: '',
    protocol_template_id: '',
    sentinel_dates: {
      lmp_day1: '',
      baseline_scan: '',
      stim_start: '',
      trigger: '',
      opu: '',
      et: '',
    },
    gametes_source: {
      oocyte: 'self',
      donor_oocyte_id: '',
      sperm: 'partner',
      donor_sperm_id: '',
    },
    pgs_pgd_data: {
      indicated: false,
      type: 'PGT-A',
      lab_name: '',
      biopsy_day: 'D5',
    },
    endometrial_monitoring: [],
    remarks: '',
  });

  // Load Treating Consultants, Protocols, and ART Cycle Types on mount
  useEffect(() => {
    // 1. Fetch Doctors / Consultants
    setLoadingDoctors(true);
    authApi
      .getDoctors()
      .then((docs) => {
        if (Array.isArray(docs) && docs.length > 0) {
          const validDocs = docs.filter((d: any) => isUserDoctor(d));
          const list = validDocs.length > 0 ? validDocs : docs;
          setDoctors(list);
          if (userId) {
            const matched = list.find((d: any) => d.id === userId);
            if (matched) {
              setForm((prev) => (prev.treating_doctor_id ? prev : { ...prev, treating_doctor_id: matched.id }));
            }
          }
        } else {
          return authApi.listUsers({ include_inactive: false }).then((users) => {
            if (Array.isArray(users)) {
              const docList = users.filter((u: any) => isUserDoctor(u));
              setDoctors(docList);
              if (userId) {
                const matched = docList.find((d: any) => d.id === userId);
                if (matched) {
                  setForm((prev) => (prev.treating_doctor_id ? prev : { ...prev, treating_doctor_id: matched.id }));
                }
              }
            }
          });
        }
      })
      .catch(() => {
        authApi
          .listUsers({ include_inactive: false })
          .then((users) => {
            if (Array.isArray(users)) {
              const docList = users.filter((u: any) => isUserDoctor(u));
              setDoctors(docList);
              if (userId) {
                const matched = docList.find((d: any) => d.id === userId);
                if (matched) {
                  setForm((prev) => (prev.treating_doctor_id ? prev : { ...prev, treating_doctor_id: matched.id }));
                }
              }
            }
          })
          .catch(() => {});
      })
      .finally(() => {
        setLoadingDoctors(false);
      });

    // 2. Fetch Active Protocol Templates
    protocolsApi
      .list({ include_inactive: false })
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setProtocols(res);
        }
      })
      .catch(() => {});

    // 3. Fetch Treatment Cycle Types Catalog
    treatmentCyclesApi
      .listTypes({ include_inactive: false })
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setCycleTypes(res);
        }
      })
      .catch(() => {});
  }, [userId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allAvailableTypes: TreatmentTypeItem[] = useMemo(() => {
    const list: TreatmentTypeItem[] = [...DEFAULT_TREATMENT_TYPES];
    if (Array.isArray(cycleTypes) && cycleTypes.length > 0) {
      cycleTypes.forEach((ct) => {
        const exists = list.some(
          (x) => x.id.toLowerCase() === ct.id?.toLowerCase() || x.name.toLowerCase() === ct.name?.toLowerCase()
        );
        if (!exists) {
          list.push({
            id: ct.id || ct.name,
            name: ct.name,
            code: ct.id,
            category: (ct as any).category || 'Custom',
            description: (ct as any).description,
          });
        }
      });
    }
    return list;
  }, [cycleTypes]);

  const filteredTreatmentTypes = useMemo(() => {
    const q = typeSearchQuery.trim().toLowerCase();
    if (!q) return allAvailableTypes;
    return allAvailableTypes.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.code && t.code.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
    );
  }, [allAvailableTypes, typeSearchQuery]);

  const currentSelectedType = useMemo(() => {
    if (!form.treatment_type) return null;
    return (
      allAvailableTypes.find(
        (t) => t.id === form.treatment_type || t.name === form.treatment_type || t.code === form.treatment_type
      ) || { id: form.treatment_type, name: form.treatment_type, description: 'Custom Treatment Type' }
    );
  }, [allAvailableTypes, form.treatment_type]);

  // Robust clinical classification based on selected treatment type
  const cycleMeta = useMemo(() => {
    const raw = (form.treatment_type || '').toUpperCase();
    const cat = (currentSelectedType?.category || '').toUpperCase();

    const isFet =
      raw.includes('FET') ||
      raw.includes('FROZEN EMBRYO') ||
      raw.includes('HRT') ||
      raw.includes('THAW') ||
      cat.includes('FET') ||
      Boolean(form.sentinel_dates?.is_hrt_fet);

    const isIui =
      raw.includes('IUI') ||
      raw.includes('INSEMINATION') ||
      raw.includes('OVULATION INDUCTION') ||
      raw.includes('OI') ||
      cat.includes('IUI');

    const isEggFreezing =
      raw.includes('EGG FREEZE') ||
      raw.includes('OOCYTE FREEZING') ||
      raw.includes('PRESERVATION') ||
      cat.includes('PRESERVATION');

    const isPgt =
      raw.includes('PGT') ||
      raw.includes('PGS') ||
      raw.includes('PGD') ||
      cat.includes('DIAGNOSTICS');

    const isSurrogacy =
      raw.includes('SURROGATE') ||
      raw.includes('SURROGACY') ||
      cat.includes('THIRD-PARTY');

    const isDonorEgg =
      raw.includes('DONOR EGG') ||
      raw.includes('DONOR OOCYTE') ||
      raw.includes('EGG DONATION') ||
      raw.includes('* EGG') ||
      raw.includes('EGG SHARING');

    const isDonorSperm =
      raw.includes('IUI - D') ||
      raw.includes('IUI_D') ||
      raw.includes('DONOR SPERM') ||
      raw.includes('* SPERM');

    const isSurgicalSperm =
      raw.includes('TESA') ||
      raw.includes('PESA') ||
      raw.includes('TESE') ||
      cat.includes('SURGICAL');

    const hasOpu = !isFet && !isIui; // Only stimulation / ICSI / IVF / Egg freezing has OPU
    const hasEt = !isEggFreezing && !isIui; // Egg freeze and IUI don't have embryo transfer

    let defaultProtocolCategory = 'stimulation';
    if (isFet) defaultProtocolCategory = 'fet';
    else if (isIui) defaultProtocolCategory = 'iui';

    return {
      isFet,
      isIui,
      isEggFreezing,
      isPgt,
      isSurrogacy,
      isDonorEgg,
      isDonorSperm,
      isSurgicalSperm,
      hasOpu,
      hasEt,
      defaultProtocolCategory,
    };
  }, [form.treatment_type, currentSelectedType, form.sentinel_dates?.is_hrt_fet]);

  const generateFallbackCalendar = () => {
    const baseDateStr = form.sentinel_dates.stim_start || form.sentinel_dates.lmp_day1 || new Date().toISOString().split('T')[0];
    const baseDate = new Date(baseDateStr);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const { isFet, isIui, hasOpu, hasEt } = cycleMeta;
    const totalDays = isFet ? 24 : 21;
    const days: any[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayNum = i + 1;
      let milestone = '';
      if (iso === form.sentinel_dates.lmp_day1) milestone = isFet ? 'Day 1 (HRT Prep Start)' : 'Day 1 (LMP)';
      else if (iso === form.sentinel_dates.baseline_scan) milestone = 'Baseline Scan';
      else if (iso === form.sentinel_dates.stim_start) milestone = isFet ? 'HRT Estrogen Start' : isIui ? 'Induction Start' : 'Stimulation Start';
      else if (iso === form.sentinel_dates.d12_scan) milestone = 'D12 Endometrial Scan';
      else if (iso === form.sentinel_dates.p0_date) milestone = 'P0 (Progesterone Start)';
      else if (iso === form.sentinel_dates.trigger) milestone = 'Trigger Injection ⚡';
      else if (isIui && (iso === form.sentinel_dates.insemination || iso === form.sentinel_dates.opu)) milestone = 'IUI Insemination 💉';
      else if (isFet && (iso === form.sentinel_dates.et || iso === form.sentinel_dates.transfer_date)) milestone = 'Frozen Embryo Transfer 👶';
      else if (hasOpu && iso === form.sentinel_dates.opu) milestone = 'OPU (Egg Retrieval) 🧫';
      else if (hasEt && iso === form.sentinel_dates.et) milestone = 'Embryo Transfer 👶';
      else if (iso === form.sentinel_dates.beta_hcg_date) milestone = 'Beta-hCG Pregnancy Test 🩸';

      let stimDayLabel: string | null = null;
      if (isIui) {
        stimDayLabel = `Cycle Day ${dayNum}`;
      } else if (isFet) {
        stimDayLabel = dayNum <= 13 ? `HRT Day ${dayNum}` : (dayNum === 14 ? 'P0' : `P+${dayNum - 14}`);
      } else {
        stimDayLabel = dayNum >= 2 && dayNum <= 12 ? `Stim Day ${dayNum - 1}` : null;
      }

      days.push({
        date: iso,
        day_number: dayNum,
        display_date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        day_of_week: dayNames[d.getDay()],
        stim_day_label: stimDayLabel,
        milestone: milestone || null,
        medications: [],
      });
    }
    return {
      start_date: baseDateStr,
      days,
    };
  };

  // Recalculate preview calendar whenever protocol or sentinel dates change
  useEffect(() => {
    if (form.protocol_template_id) {
      protocolsApi.previewCalendar({
        protocol_template_id: form.protocol_template_id,
        sentinel_dates: form.sentinel_dates,
      }).then((cal: any) => {
        if (cal && cal.days && cal.days.length > 0) {
          setCalendarPreview(cal);
        } else {
          setCalendarPreview(generateFallbackCalendar());
        }
      }).catch(() => {
        setCalendarPreview(generateFallbackCalendar());
      });
    } else {
      setCalendarPreview(generateFallbackCalendar());
    }
  }, [form.protocol_template_id, form.sentinel_dates]);

  const updateSentinel = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      sentinel_dates: { ...prev.sentinel_dates, [field]: value },
    }));
  };

  const handleLmpChange = (lmpDate: string) => {
    if (!lmpDate) {
      updateSentinel('lmp_day1', '');
      return;
    }
    const lmp = new Date(lmpDate);
    const addDays = (d: Date, days: number) => {
      const res = new Date(d);
      res.setDate(res.getDate() + days);
      return res.toISOString().split('T')[0];
    };

    const isDay3 = form.sentinel_dates?.embryo_stage === 'Day 3';
    const estrogenDays = Number(form.sentinel_dates?.planned_estrogen_days || 13);
    const p0Date = addDays(lmp, estrogenDays);

    if (cycleMeta.isFet) {
      setForm((prev) => ({
        ...prev,
        sentinel_dates: {
          ...prev.sentinel_dates,
          lmp_day1: lmpDate,
          baseline_scan: addDays(lmp, 1),
          d12_scan: addDays(lmp, 11),
          p0_date: p0Date,
          p0_time: prev.sentinel_dates?.p0_time || '08:00 AM',
          embryo_stage: prev.sentinel_dates?.embryo_stage || 'Day 5',
          et: addDays(new Date(p0Date), isDay3 ? 3 : 5),
          beta_hcg_date: addDays(lmp, 22),
          is_hrt_fet: true,
        },
      }));
    } else if (cycleMeta.isIui) {
      setForm((prev) => ({
        ...prev,
        sentinel_dates: {
          ...prev.sentinel_dates,
          lmp_day1: lmpDate,
          baseline_scan: addDays(lmp, 1), // Day 2
          stim_start: addDays(lmp, 2),    // Day 3
          trigger: addDays(lmp, 11),      // Day 12
          insemination: addDays(lmp, 13), // Day 14
          beta_hcg_date: addDays(lmp, 27),// Day 28
          is_hrt_fet: false,
        },
      }));
    } else if (cycleMeta.isEggFreezing) {
      setForm((prev) => ({
        ...prev,
        sentinel_dates: {
          ...prev.sentinel_dates,
          lmp_day1: lmpDate,
          baseline_scan: addDays(lmp, 1), // Day 2
          stim_start: addDays(lmp, 2),    // Day 3
          trigger: addDays(lmp, 11),      // Day 12
          opu: addDays(lmp, 13),          // Day 14
          et: '',                         // No transfer in egg freezing
          beta_hcg_date: '',
          is_hrt_fet: false,
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        sentinel_dates: {
          ...prev.sentinel_dates,
          lmp_day1: lmpDate,
          baseline_scan: addDays(lmp, 1), // Day 2
          stim_start: addDays(lmp, 2),    // Day 3
          trigger: addDays(lmp, 11),      // Day 12
          opu: addDays(lmp, 13),          // Day 14
          et: addDays(lmp, 18),           // Day 19
          beta_hcg_date: addDays(lmp, 28),// Day 29
          is_hrt_fet: false,
        },
      }));
    }
  };

  const handleAddEndometrialRow = () => {
    const nextDay = (form.endometrial_monitoring.length + 1) * 2 + 5;
    setForm((prev) => ({
      ...prev,
      endometrial_monitoring: [
        ...prev.endometrial_monitoring,
        {
          date: new Date().toISOString().split('T')[0],
          day_of_cycle: nextDay,
          thickness_mm: 0,
          pattern: '',
          vascularity: '',
        },
      ],
    }));
  };

  const handleUpdateEndometrialRow = (idx: number, field: keyof EndometrialMonitoringRow, value: any) => {
    setForm((prev) => {
      const updated = [...prev.endometrial_monitoring];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, endometrial_monitoring: updated };
    });
  };

  const handleRemoveEndometrialRow = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      endometrial_monitoring: prev.endometrial_monitoring.filter((_, i) => i !== idx),
    }));
  };

  const handleAddDayMedication = (dayNumber: number) => {
    if (!calendarPreview || !calendarPreview.days) return;
    const updatedDays = calendarPreview.days.map((d: any) => {
      if (d.day_number === dayNumber) {
        const meds = d.medications ? [...d.medications] : [];
        meds.push({
          drug_name: '',
          dose: '',
          frequency: 'OD',
        });
        return { ...d, medications: meds };
      }
      return d;
    });
    setCalendarPreview({ ...calendarPreview, days: updatedDays });
  };

  const handleUpdateDayMedication = (dayNumber: number, medIdx: number, field: string, value: string) => {
    if (!calendarPreview || !calendarPreview.days) return;
    const updatedDays = calendarPreview.days.map((d: any) => {
      if (d.day_number === dayNumber && d.medications) {
        const meds = [...d.medications];
        meds[medIdx] = { ...meds[medIdx], [field]: value };
        return { ...d, medications: meds };
      }
      return d;
    });
    setCalendarPreview({ ...calendarPreview, days: updatedDays });
  };

  const handleRemoveDayMedication = (dayNumber: number, medIdx: number) => {
    if (!calendarPreview || !calendarPreview.days) return;
    const updatedDays = calendarPreview.days.map((d: any) => {
      if (d.day_number === dayNumber && d.medications) {
        return { ...d, medications: d.medications.filter((_: any, i: number) => i !== medIdx) };
      }
      return d;
    });
    setCalendarPreview({ ...calendarPreview, days: updatedDays });
  };

  const syntheticCycle = useMemo(() => {
    const defaultStart = cycleMeta.isFet
      ? (form.sentinel_dates.lmp_day1 || form.sentinel_dates.baseline_scan || new Date().toISOString().split('T')[0])
      : (form.sentinel_dates.stim_start || form.sentinel_dates.lmp_day1 || form.sentinel_dates.baseline_scan || new Date().toISOString().split('T')[0]);

    return {
      id: '',
      cycle_id: 'NEW-CYCLE-DRAFT',
      patient_id: patientId,
      partner_id: partnerId,
      treatment_type: form.treatment_type || 'ICSI',
      attempt_number: form.attempt_number || 1,
      status: 'planned' as const,
      start_date: defaultStart,
      sentinel_dates: form.sentinel_dates,
      medication_calendar: calendarPreview?.days || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }, [patientId, partnerId, form.treatment_type, form.attempt_number, form.sentinel_dates, calendarPreview?.days, cycleMeta.isFet]);

  const handleNextStep = () => {
    if (currentStep === 1 && !form.treatment_type?.trim()) {
      toast.warning('Treatment Type Required', 'Please select an Intended Treatment Type before proceeding to Step 2.');
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const cycleRemarks = form.previous_centre_name
        ? `${form.remarks} [Initiated at previous centre: ${form.previous_centre_name}]`
        : form.remarks;

      const finalSentinelDates = {
        ...form.sentinel_dates,
        custom_calendar: calendarPreview?.days || [],
      };

      const cycle = await treatmentCyclesApi.create({
        patient_id: patientId,
        partner_id: partnerId || undefined,
        treating_doctor_id: form.treating_doctor_id || userId,
        treatment_type: form.treatment_type,
        attempt_number: form.attempt_number,
        female_factors: form.female_factors,
        male_factors: form.male_factors,
        treatment_at_other_centre: form.treatment_at_other_centre,
        protocol_template_id: form.protocol_template_id || undefined,
        sentinel_dates: finalSentinelDates,
        gametes_source: form.gametes_source,
        pgs_pgd_data: form.pgs_pgd_data,
        endometrial_monitoring: form.endometrial_monitoring,
        medication_calendar: calendarPreview?.days || [],
        remarks: cycleRemarks,
        created_by: userId,
      });
      onSuccess(cycle);
    } catch (err: any) {
      alert(err.message || 'Failed to start treatment cycle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm w-full flex flex-col min-h-[580px]">
      {/* Header & Steps Bar */}
      <div className="bg-primary text-white p-6 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Add New Treatment Cycle</h2>
            <p className="text-xs text-slate-400">Step {currentStep} of {steps.length}: {steps[currentStep - 1].label}</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Step Progress Pills */}
        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
          {steps.map((s) => {
            const StepIcon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => {
                  if (s.id > 1 && !form.treatment_type?.trim()) {
                    toast.warning('Treatment Type Required', 'Please select an Intended Treatment Type in Step 1 first.');
                    return;
                  }
                  setCurrentStep(s.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                  currentStep === s.id
                    ? 'bg-[rgb(var(--clr-primary))] text-white shadow-sm'
                    : currentStep > s.id
                    ? 'bg-slate-800 text-emerald-400'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <StepIcon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6 overflow-y-auto flex-1 space-y-6 min-h-[480px]">
        {/* Step 1: Intended Treatment */}
        {currentStep === 1 && (
          <WizardStepIntendedTreatment
            form={form}
            setForm={setForm}
            doctors={doctors}
            loadingDoctors={loadingDoctors}
            typeDropdownOpen={typeDropdownOpen}
            setTypeDropdownOpen={setTypeDropdownOpen}
            typeSearchQuery={typeSearchQuery}
            setTypeSearchQuery={setTypeSearchQuery}
            typeDropdownRef={typeDropdownRef}
            searchInputRef={searchInputRef}
            filteredTreatmentTypes={filteredTreatmentTypes}
            currentSelectedType={currentSelectedType}
          />
        )}

        {currentStep === 2 && (
          <WizardStepGameteSource
            form={form}
            setForm={setForm}
            cycleMeta={cycleMeta}
          />
        )}

        {currentStep === 3 && (
          <WizardStepGeneticScreening
            form={form}
            setForm={setForm}
            cycleMeta={cycleMeta}
          />
        )}

        {currentStep === 4 && (
          <WizardStepProtocolDates
            form={form}
            setForm={setForm}
            cycleMeta={cycleMeta}
            protocols={protocols}
            updateSentinel={updateSentinel}
            handleLmpChange={handleLmpChange}
          />
        )}

        {currentStep === 5 && (
          <WizardStepEndometrialMonitoring
            form={form}
            setForm={setForm}
            cycleMeta={cycleMeta}
            handleAddEndometrialRow={handleAddEndometrialRow}
            handleUpdateEndometrialRow={handleUpdateEndometrialRow}
            handleRemoveEndometrialRow={handleRemoveEndometrialRow}
          />
        )}

        {/* Step 6: Medication Calendar */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <PlanDetailsSubTabContent
              activeCycle={syntheticCycle}
              cycleCalendar={calendarPreview}
              initialDays={calendarPreview?.days}
              onDaysChange={(savedDays) => {
                setCalendarPreview((prev: any) => ({ ...(prev || {}), days: savedDays }));
              }}
              patient={patient}
              partner={partner}
              isWizardStep={true}
            />
          </div>
        )}

        {/* Step 7: Summary */}
        {currentStep === 7 && (
          <WizardStepSummarySubmit
            form={form}
            setForm={setForm}
            cycleMeta={cycleMeta}
            currentSelectedType={currentSelectedType}
            doctors={doctors}
            protocols={protocols}
          />
        )}
      </div>

      {/* Footer Navigation */}
      <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between flex-shrink-0">
        <button
          type="button"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep(currentStep - 1)}
          className="px-5 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-md hover:bg-slate-100 disabled:opacity-40 text-xs transition-colors"
        >
          ← Previous
        </button>

        <div className="flex gap-3">
          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2 bg-primary text-white font-bold rounded-md hover:bg-primary-mid text-xs transition-colors shadow-md shadow-primary/20"
            >
              Next Step →
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-md hover:bg-emerald-700 text-xs transition-colors shadow-lg shadow-emerald-500/25 flex items-center gap-2"
            >
              {isSubmitting ? 'Starting Cycle...' : <><Play className="w-3.5 h-3.5 inline mr-1" /> Start Treatment Cycle</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
