'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Save,
  Printer,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  Sparkles,
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  Pill,
  Microscope,
  Activity,
  X,
  Layers,
  Table as TableIcon,
  Flame,
  Zap,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Sliders,
  CheckCircle2,
  Heart,
  Droplet,
  Search,
  CalendarDays,
  Edit2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { treatmentCyclesApi, protocolsApi, patientsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import HrtFetProtocolSheet from '@/components/fertility/HrtFetProtocolSheet';
import PrintableModal from '@/components/common/PrintableModal';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import PrintableReportFooter from '@/components/common/PrintableReportFooter';
import A4Sheet from '@/components/common/A4Sheet';

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export interface DayData {
  day_number: number;
  cycle_day_offset?: number;
  date: string;
  display_date: string;
  day_of_week: string;
  milestone?: string;
  stim_day_label?: string;
  scans?: string[];
  investigations?: string[];
  procedures?: string[];
  medications: {
    drug_name: string;
    dose: string;
    route?: string;
    frequency?: string;
    time?: string;
  }[];
  right_follicles?: string;
  left_follicles?: string;
  endometrium_mm?: string;
  endometrial_pattern?: string;
  e2_pgml?: string;
  p4_ngml?: string;
  lh_miu?: string;
  notes?: string;
}

export interface StimulationCalendarGridProps {
  cycleId?: string;
  patientId?: string;
  startDate?: string;
  initialDays?: any[];
  readonly?: boolean;
  onCalendarSaved?: (days: any[]) => void;
  treatmentType?: string;
  protocolCategory?: string;
  sentinelDates?: Record<string, any>;
  patient?: any;
  doctor?: any;
  cycleNumber?: string | number;
}

const IVF_ICSI_DRUGS = [
  { name: 'Rec-FSH (Gonal-F / Puregon)', defaultDose: '225 IU', route: 'SC', frequency: 'OD Evening' },
  { name: 'HMG (Menopur)', defaultDose: '75 IU', route: 'IM', frequency: 'OD Morning' },
  { name: 'GnRH Antagonist (Cetrotide 0.25mg)', defaultDose: '0.25 mg', route: 'SC', frequency: 'OD Morning' },
  { name: 'Ovulation Trigger (Ovitrelle 250mcg)', defaultDose: '250 mcg', route: 'SC', frequency: 'Stat Night' },
  { name: 'Micronized Progesterone (Susten 400mg)', defaultDose: '400 mg', route: 'PV', frequency: 'BD' },
  { name: 'Oral Estradiol Valerate (Progynova 2mg)', defaultDose: '2 mg', route: 'PO', frequency: 'TDS' },
];

const FET_DRUGS = [
  { name: 'Oral Estradiol Valerate (Progynova 2mg)', defaultDose: '2 mg', route: 'PO', frequency: 'TDS' },
  { name: 'Micronized Progesterone (Susten 400mg)', defaultDose: '400 mg', route: 'PV', frequency: 'BD' },
  { name: 'Dydrogesterone (Duphaston 10mg)', defaultDose: '10 mg', route: 'PO', frequency: 'BD' },
  { name: 'Aspirin / Ecosprin 75mg', defaultDose: '75 mg', route: 'PO', frequency: 'OD' },
  { name: 'Methylfolate / Folvite 5mg', defaultDose: '5 mg', route: 'PO', frequency: 'OD' },
  { name: 'Inj Progesterone (Proluton 100mg)', defaultDose: '100 mg', route: 'IM', frequency: 'OD' },
];

const IUI_DRUGS = [
  { name: 'Tab Letrozole (Femara 2.5mg)', defaultDose: '2.5 mg', route: 'PO', frequency: 'OD' },
  { name: 'Tab Clomiphene Citrate 50mg', defaultDose: '50 mg', route: 'PO', frequency: 'OD' },
  { name: 'Inj HMG (Menopur 75 IU)', defaultDose: '75 IU', route: 'IM', frequency: 'Alt Days' },
  { name: 'Inj hCG / Ovitrelle 250mcg (Trigger)', defaultDose: '250 mcg', route: 'SC', frequency: 'Stat' },
  { name: 'Micronized Progesterone (Susten 200mg)', defaultDose: '200 mg', route: 'PV', frequency: 'BD' },
  { name: 'Tab Folvite (Folic Acid 5mg)', defaultDose: '5 mg', route: 'PO', frequency: 'OD' },
];

const getTailoredDefaultDrugs = (treatmentType?: string, protocolCategory?: string) => {
  const upper = (treatmentType || '').toUpperCase();
  if (upper.includes('FET') || protocolCategory === 'fet') return FET_DRUGS;
  if (upper.includes('IUI') || upper.includes('OI')) return IUI_DRUGS;
  return IVF_ICSI_DRUGS;
};

// Helper: parse follicle sizes into colored badges
export function parseFollicleTokens(follicleStr?: string): {
  tokens: { mm: number; category: 'mature' | 'intermediate' | 'small' }[];
  matureCount: number;
  intermediateCount: number;
  smallCount: number;
} {
  if (!follicleStr) {
    return { tokens: [], matureCount: 0, intermediateCount: 0, smallCount: 0 };
  }
  const matches = follicleStr.match(/\d+(\.\d+)?/g);
  if (!matches) {
    return { tokens: [], matureCount: 0, intermediateCount: 0, smallCount: 0 };
  }
  const tokens = matches.map((m) => {
    const val = parseFloat(m);
    let category: 'mature' | 'intermediate' | 'small' = 'small';
    if (val >= 18) category = 'mature';
    else if (val >= 14) category = 'intermediate';
    return { mm: val, category };
  });

  return {
    tokens,
    matureCount: tokens.filter((t) => t.category === 'mature').length,
    intermediateCount: tokens.filter((t) => t.category === 'intermediate').length,
    smallCount: tokens.filter((t) => t.category === 'small').length,
  };
}

const STANDARD_PRESETS = [
  {
    id: 'antagonist_standard',
    name: 'Flexible GnRH Antagonist (Rec-FSH 225 IU + Cetrotide)',
    rules: [
      { drug_name: 'Rec-FSH (Gonal-F / Puregon)', dose: '225 IU', start: 2, end: 11 },
      { drug_name: 'GnRH Antagonist (Cetrotide 0.25mg)', dose: '0.25 mg', start: 6, end: 11 },
      { drug_name: 'Ovulation Trigger (Ovitrelle 250mcg)', dose: '250 mcg', start: 12, end: 12 },
    ],
  },
  {
    id: 'antagonist_stepdown',
    name: 'Antagonist Step-Down (Rec-FSH 300 IU → 225 IU + Cetrotide)',
    rules: [
      { drug_name: 'Rec-FSH (Gonal-F / Puregon)', dose: '300 IU', start: 2, end: 5 },
      { drug_name: 'Rec-FSH (Gonal-F / Puregon)', dose: '225 IU', start: 6, end: 11 },
      { drug_name: 'GnRH Antagonist (Cetrotide 0.25mg)', dose: '0.25 mg', start: 6, end: 11 },
      { drug_name: 'Ovulation Trigger (Ovitrelle 250mcg)', dose: '250 mcg', start: 12, end: 12 },
    ],
  },
  {
    id: 'mixed_hmg_fsh',
    name: 'Mixed Protocol: Rec-FSH 150 IU + Menopur 75 IU + Cetrotide',
    rules: [
      { drug_name: 'Rec-FSH (Gonal-F / Puregon)', dose: '150 IU', start: 2, end: 11 },
      { drug_name: 'HMG (Menopur)', dose: '75 IU', start: 2, end: 11 },
      { drug_name: 'GnRH Antagonist (Cetrotide 0.25mg)', dose: '0.25 mg', start: 6, end: 11 },
      { drug_name: 'Ovulation Trigger (Ovitrelle 250mcg)', dose: '250 mcg', start: 12, end: 12 },
    ],
  },
  {
    id: 'mild_letrozole_hmg',
    name: 'Mild Stimulation / DuoStim (Letrozole 5mg + Menopur 75 IU)',
    rules: [
      { drug_name: 'Tab Letrozole (Femara 2.5mg)', dose: '5 mg', start: 2, end: 6 },
      { drug_name: 'HMG (Menopur)', dose: '75 IU', start: 4, end: 11 },
      { drug_name: 'GnRH Antagonist (Cetrotide 0.25mg)', dose: '0.25 mg', start: 7, end: 11 },
      { drug_name: 'Ovulation Trigger (Ovitrelle 250mcg)', dose: '250 mcg', start: 12, end: 12 },
    ],
  },
];

export default function StimulationCalendarGrid({
  cycleId,
  patientId,
  startDate,
  initialDays,
  readonly = false,
  onCalendarSaved,
  treatmentType,
  protocolCategory,
  sentinelDates,
  patient,
  doctor,
  cycleNumber,
}: StimulationCalendarGridProps) {
  const { currentBranch, user } = useAuth();
  const hospitalName = user?.hospital_name || currentBranch?.receipt_header?.hospital_name || 'VaidyaMD Advanced Hospital';
  const branchSubtitle = [
    currentBranch?.name,
    currentBranch?.address,
    currentBranch?.phone ? `Tel: ${currentBranch.phone}` : '',
    currentBranch?.gstin ? `GSTIN: ${currentBranch.gstin}` : '',
  ].filter(Boolean).join(' · ') || 'Centre for Reproductive Medicine & Advanced IVF';

  // Printing State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printLayoutMode, setPrintLayoutMode] = useState<'calendar' | 'matrix'>('calendar');
  const [fetchedCycle, setFetchedCycle] = useState<any>(null);
  const [fetchedPatient, setFetchedPatient] = useState<any>(null);

  useEffect(() => {
    if (cycleId && !patient) {
      treatmentCyclesApi
        .get(cycleId)
        .then((c: any) => {
          setFetchedCycle(c);
          if (c?.patient) setFetchedPatient(c.patient);
        })
        .catch(() => {});
    }
  }, [cycleId, patient]);

  useEffect(() => {
    if (patientId && !patient && !fetchedPatient) {
      patientsApi.get(patientId).then(setFetchedPatient).catch(() => {});
    }
  }, [patientId, patient, fetchedPatient]);

  const effectivePatient = patient || fetchedPatient || fetchedCycle?.patient;
  const effectiveDoctor = doctor || fetchedCycle?.doctor || fetchedCycle?.treating_consultant;
  const effectiveCycleCode = fetchedCycle?.code || cycleId || (cycleNumber ? `Cycle #${cycleNumber}` : 'Stimulation Cycle');
  const effectiveModality = treatmentType || fetchedCycle?.treatment_type || 'Controlled Ovarian Stimulation (COH)';

  const isFetDefault = Boolean(
    treatmentType?.toUpperCase().includes('FET') ||
    protocolCategory === 'fet' ||
    sentinelDates?.is_hrt_fet ||
    (initialDays && initialDays.length > 0 && initialDays[0]?.phase)
  );
  const [protocolMode, setProtocolMode] = useState<'stimulation' | 'hrt_fet'>(
    isFetDefault ? 'hrt_fet' : 'stimulation'
  );

  // Synchronize protocolMode whenever treatmentType, protocolCategory, or sentinelDates change
  useEffect(() => {
    const isFet = Boolean(
      treatmentType?.toUpperCase().includes('FET') ||
      protocolCategory === 'fet' ||
      sentinelDates?.is_hrt_fet ||
      (initialDays && initialDays.length > 0 && initialDays[0]?.phase)
    );
    setProtocolMode(isFet ? 'hrt_fet' : 'stimulation');
  }, [treatmentType, protocolCategory, sentinelDates, initialDays]);

  // Primary View Mode: 'calendar' (7 days per row) vs 'matrix' (Spreadsheet table)
  const [viewMode, setViewMode] = useState<'calendar' | 'matrix'>('calendar');

  const [totalDays, setTotalDays] = useState(14);
  const [drugList, setDrugList] = useState<string[]>(
    getTailoredDefaultDrugs(treatmentType, protocolCategory).map((d) => d.name)
  );

  useEffect(() => {
    const tailored = getTailoredDefaultDrugs(treatmentType, protocolCategory);
    setDrugList((prevList) => {
      const combined = new Set([...tailored.map((d) => d.name), ...prevList]);
      return Array.from(combined);
    });
  }, [treatmentType, protocolCategory]);

  const [newDrugName, setNewDrugName] = useState('');
  const [showAddDrug, setShowAddDrug] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('');
  const [dbProtocols, setDbProtocols] = useState<any[]>([]);

  // Protocol Overwrite Confirmation Modal State
  const [overrideModal, setOverrideModal] = useState<{
    protocolId: string;
    protocolName: string;
  } | null>(null);

  // Quick Day Scan Editor Modal State
  const [editingScanDay, setEditingScanDay] = useState<DayData | null>(null);

  // Popover state to add medication to a specific day in Calendar View
  const [activeAddMedDay, setActiveAddMedDay] = useState<number | null>(null);

  useEffect(() => {
    protocolsApi
      .list()
      .then((res: any) => {
        if (Array.isArray(res)) setDbProtocols(res);
      })
      .catch(() => {});
  }, []);

  // Days state
  const [days, setDays] = useState<DayData[]>([]);

  useEffect(() => {
    const baseDate = startDate ? new Date(startDate) : new Date();
    const count = Math.max(14, initialDays?.length || 14);
    setTotalDays(count);

    const isFet = Boolean(
      treatmentType?.toUpperCase().includes('FET') ||
      protocolCategory === 'fet' ||
      sentinelDates?.is_hrt_fet
    );
    const isIui = Boolean(
      treatmentType?.toUpperCase().includes('IUI') ||
      treatmentType?.toUpperCase().includes('OI')
    );

    // Build Sentinel Milestone Map
    const sentinelMilestoneMap = new Map<string, string>();
    if (sentinelDates) {
      if (sentinelDates.lmp_day1) sentinelMilestoneMap.set(sentinelDates.lmp_day1, 'Day 1 (LMP)');
      if (sentinelDates.baseline_scan) sentinelMilestoneMap.set(sentinelDates.baseline_scan, 'Baseline Scan 🔍');
      if (sentinelDates.stim_start) sentinelMilestoneMap.set(sentinelDates.stim_start, isFet ? 'HRT Prep Start' : 'Stimulation Start');
      if (sentinelDates.d12_scan) sentinelMilestoneMap.set(sentinelDates.d12_scan, 'D12 Endometrial Scan 🔍');
      if (sentinelDates.p0_date) sentinelMilestoneMap.set(sentinelDates.p0_date, 'P0 (Progesterone Start)');
      if (sentinelDates.trigger) sentinelMilestoneMap.set(sentinelDates.trigger, 'Trigger Injection ⚡');

      if (isIui) {
        if (sentinelDates.insemination) sentinelMilestoneMap.set(sentinelDates.insemination, 'IUI Insemination 💉');
        else if (sentinelDates.opu) sentinelMilestoneMap.set(sentinelDates.opu, 'IUI Insemination 💉');
      } else if (isFet) {
        if (sentinelDates.et || sentinelDates.transfer_date) sentinelMilestoneMap.set(sentinelDates.et || sentinelDates.transfer_date, 'Frozen Embryo Transfer 👶');
      } else {
        if (sentinelDates.opu) sentinelMilestoneMap.set(sentinelDates.opu, 'OPU (Egg Retrieval) 🧫');
        if (sentinelDates.et) sentinelMilestoneMap.set(sentinelDates.et, 'Embryo Transfer 👶');
      }

      if (sentinelDates.beta_hcg_date) sentinelMilestoneMap.set(sentinelDates.beta_hcg_date, 'Beta-hCG Pregnancy Test 🩸');
    }

    const generated: DayData[] = [];
    for (let i = 1; i <= count; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + (i - 1));

      const existing = initialDays?.find((x: any) => x.day_number === i || x.cycle_day === i);

      const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isoDate = existing?.date || d.toISOString().split('T')[0];

      let milestone: string | undefined = existing?.milestone || existing?.phase || sentinelMilestoneMap.get(isoDate);

      if (!milestone) {
        if (isFet) {
          if (i === 1) milestone = 'HRT Start (E2 Priming)';
          else if (i === 10) milestone = 'Endometrial TVS Check 🔍';
          else if (i === 13) milestone = 'P0 (Progesterone Window)';
          else if (i === 18) milestone = 'Embryo Transfer 👶';
          else if (i === count) milestone = 'Beta-hCG Pregnancy Test 🩸';
        } else if (isIui) {
          if (i === 1) milestone = 'Cycle Day 1 (LMP)';
          else if (i === 2) milestone = 'Ovulation Induction Start';
          else if (i === 8) milestone = 'Follicular Tracking Scan 🔍';
          else if (i === 11) milestone = 'Trigger Evaluation';
          else if (i === 12) milestone = 'hCG Trigger ⚡';
          else if (i === 14) milestone = 'IUI Insemination 💉';
          else if (i === count) milestone = 'Beta-hCG Pregnancy Test 🩸';
        } else {
          // IVF / ICSI
          if (i === 1) milestone = 'Stim Day 1';
          else if (i === 6) milestone = 'Antagonist Start';
          else if (i === 10) milestone = 'Trigger Imminent';
          else if (i === 12) milestone = 'hCG Trigger ⚡';
          else if (i === 14) milestone = 'OPU Retrieval 🧫';
        }
      }

      generated.push({
        day_number: i,
        date: isoDate,
        display_date: existing?.display_date || displayDate,
        day_of_week: existing?.day_of_week || dayOfWeek,
        milestone: milestone,
        medications: existing?.medications || [],
        right_follicles: existing?.right_follicles || '',
        left_follicles: existing?.left_follicles || '',
        endometrium_mm: existing?.endometrium_mm || '',
        endometrial_pattern: existing?.endometrial_pattern || '',
        e2_pgml: existing?.e2_pgml || '',
        p4_ngml: existing?.p4_ngml || '',
        lh_miu: existing?.lh_miu || '',
        notes: existing?.notes || '',
      });
    }

    if (initialDays && Array.isArray(initialDays)) {
      const uniqueNames = new Set(drugList);
      initialDays.forEach((d: any) => {
        d.medications?.forEach((m: any) => {
          if (m.drug_name) uniqueNames.add(m.drug_name);
        });
      });
      setDrugList(Array.from(uniqueNames));
    }

    setDays(generated);
  }, [startDate, initialDays, treatmentType, protocolCategory, sentinelDates, cycleId]);

  // Handle Protocol Application with Confirmation Check
  const handleInitiateProtocolApply = (protoId: string) => {
    if (!protoId) return;
    const hasExistingMeds = days.some((d) => d.medications && d.medications.length > 0);
    const standard = STANDARD_PRESETS.find((p) => p.id === protoId);
    const dbProto = dbProtocols.find((p) => p.id === protoId);
    const protoName = standard?.name || dbProto?.name || 'Selected Protocol';

    if (hasExistingMeds) {
      // Show warning confirmation popup before overriding
      setOverrideModal({ protocolId: protoId, protocolName: protoName });
    } else {
      // First application, overwrite directly
      executeApplyProtocol(protoId, 'overwrite');
    }
  };

  const executeApplyProtocol = (protoId: string, mode: 'overwrite' | 'merge') => {
    const standard = STANDARD_PRESETS.find((p) => p.id === protoId);
    if (standard) {
      const protoDrugs = Array.from(new Set(standard.rules.map((r) => r.drug_name)));
      setDrugList(Array.from(new Set([...drugList, ...protoDrugs])));

      setDays((prev) =>
        prev.map((day) => {
          // If overwrite mode, clear previous medications for this day first
          const baseMeds = mode === 'overwrite' ? [] : [...(day.medications || [])];

          for (const rule of standard.rules) {
            if (day.day_number >= rule.start && day.day_number <= rule.end) {
              const idx = baseMeds.findIndex((m) => m.drug_name === rule.drug_name);
              if (idx >= 0) {
                baseMeds[idx] = { ...baseMeds[idx], dose: rule.dose };
              } else {
                baseMeds.push({ drug_name: rule.drug_name, dose: rule.dose });
              }
            }
          }
          return { ...day, medications: baseMeds };
        })
      );

      setSaveMessage(`Applied: ${standard.name} (${mode === 'overwrite' ? 'Replaced schedule' : 'Merged'})`);
      setTimeout(() => setSaveMessage(null), 3500);
      return;
    }

    // Database Protocol
    const proto = dbProtocols.find((p) => p.id === protoId);
    if (!proto) return;

    const rules = proto.rules || [];
    const timelineEvents = proto.timeline_events || [];
    const protoDrugs = Array.from(new Set(rules.map((r: any) => r.drug_name).filter(Boolean))) as string[];

    setDrugList(Array.from(new Set([...drugList, ...protoDrugs])));

    const maxDayNeeded = Math.max(
      totalDays,
      ...rules.map((r: any) => Number(r.day_end_offset || 0)),
      ...timelineEvents.map((e: any) => Number(e.day_offset || 0))
    );
    if (maxDayNeeded > totalDays) {
      setTotalDays(maxDayNeeded);
    }

    setDays((prev) => {
      let currentDays = [...prev];
      if (maxDayNeeded > currentDays.length) {
        const baseDate = startDate ? new Date(startDate) : new Date();
        const existingCount = currentDays.length;
        for (let i = existingCount; i < maxDayNeeded; i++) {
          const d = new Date(baseDate);
          d.setDate(d.getDate() + i);
          currentDays.push({
            day_number: i + 1,
            date: d.toISOString().split('T')[0],
            display_date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            day_of_week: d.toLocaleDateString('en-IN', { weekday: 'short' }),
            medications: [],
          });
        }
      }

      return currentDays.map((day) => {
        const baseMeds = mode === 'overwrite' ? [] : [...(day.medications || [])];
        for (const rule of rules) {
          const start = Number(rule.day_start_offset);
          const end = Number(rule.day_end_offset);
          if (day.day_number >= start && day.day_number <= end) {
            const idx = baseMeds.findIndex((m) => m.drug_name === rule.drug_name);
            if (idx >= 0) {
              baseMeds[idx] = { ...baseMeds[idx], dose: rule.dose };
            } else {
              baseMeds.push({ drug_name: rule.drug_name, dose: rule.dose });
            }
          }
        }

        const dayEvents = timelineEvents.filter((e: any) => Number(e.day_offset) === day.day_number);
        const dayScans = dayEvents.filter((e: any) => e.type === 'scan').map((e: any) => e.title);
        const dayInvs = dayEvents.filter((e: any) => e.type === 'investigation').map((e: any) => e.title);
        const dayProcs = dayEvents.filter((e: any) => e.type === 'procedure').map((e: any) => e.title);

        let milestone = day.milestone;
        if (!milestone) {
          if (dayProcs.length > 0) milestone = `${dayProcs[0]} 🧫`;
          else if (dayScans.length > 0) milestone = `${dayScans[0]} 🔍`;
          else if (dayInvs.some((x: string) => x.toLowerCase().includes('beta'))) milestone = 'Beta-hCG 🩸';
        }

        return {
          ...day,
          medications: baseMeds,
          scans: dayScans.length > 0 ? dayScans : day.scans,
          investigations: dayInvs.length > 0 ? dayInvs : day.investigations,
          procedures: dayProcs.length > 0 ? dayProcs : day.procedures,
          milestone,
        };
      });
    });

    setSaveMessage(`Applied: ${proto.name} (${mode === 'overwrite' ? 'Replaced schedule' : 'Merged'})`);
    setTimeout(() => setSaveMessage(null), 3500);
  };

  // Medication handlers
  const handleUpdateMedDose = (dayNum: number, medIdx: number, newDose: string) => {
    if (readonly) return;
    setDays((prev) =>
      prev.map((day) => {
        if (day.day_number !== dayNum) return day;
        const meds = [...day.medications];
        if (!newDose.trim()) {
          meds.splice(medIdx, 1);
        } else {
          meds[medIdx] = { ...meds[medIdx], dose: newDose };
        }
        return { ...day, medications: meds };
      })
    );
  };

  const handleRemoveMedFromDay = (dayNum: number, medIdx: number) => {
    if (readonly) return;
    setDays((prev) =>
      prev.map((day) => {
        if (day.day_number !== dayNum) return day;
        return {
          ...day,
          medications: day.medications.filter((_, idx) => idx !== medIdx),
        };
      })
    );
  };

  const handleAddMedToDay = (dayNum: number, drugName: string, defaultDose?: string) => {
    if (readonly) return;
    const defaultD = defaultDose || '225 IU';
    setDays((prev) =>
      prev.map((day) => {
        if (day.day_number !== dayNum) return day;
        const existingIdx = day.medications.findIndex((m) => m.drug_name === drugName);
        if (existingIdx >= 0) return day; // Already added
        return {
          ...day,
          medications: [...day.medications, { drug_name: drugName, dose: defaultD }],
        };
      })
    );
    setActiveAddMedDay(null);
  };

  const handleCopyDayToNextDays = (sourceDayNum: number, daysToForward: number = 3) => {
    if (readonly) return;
    const sourceDay = days.find((d) => d.day_number === sourceDayNum);
    if (!sourceDay || sourceDay.medications.length === 0) return;

    setDays((prev) =>
      prev.map((day) => {
        if (day.day_number > sourceDayNum && day.day_number <= sourceDayNum + daysToForward) {
          return {
            ...day,
            medications: [...sourceDay.medications.map((m) => ({ ...m }))],
          };
        }
        return day;
      })
    );
    setSaveMessage(`Copied medications from Day ${sourceDayNum} to next ${daysToForward} days`);
    setTimeout(() => setSaveMessage(null), 2500);
  };

  const handleClearDayMeds = (dayNum: number) => {
    if (readonly) return;
    setDays((prev) =>
      prev.map((day) => (day.day_number === dayNum ? { ...day, medications: [] } : day))
    );
  };

  const handleAddCustomDrug = () => {
    const trimmed = newDrugName.trim();
    if (!trimmed || drugList.includes(trimmed)) return;
    setDrugList([...drugList, trimmed]);
    setNewDrugName('');
    setShowAddDrug(false);
  };

  const handleSaveCalendar = async () => {
    if (!cycleId) {
      onCalendarSaved?.(days);
      setSaveMessage('Stimulation grid updated locally');
      setTimeout(() => setSaveMessage(null), 2500);
      return;
    }

    setIsSaving(true);
    try {
      await treatmentCyclesApi.updateMedicationCalendar(cycleId, days);
      setSaveMessage('Stimulation schedule saved successfully!');
      onCalendarSaved?.(days);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to save calendar', err);
      alert(err.message || 'Failed to save stimulation calendar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveScanModal = (updatedDay: DayData) => {
    setDays((prev) =>
      prev.map((d) => (d.day_number === updatedDay.day_number ? updatedDay : d))
    );
    setEditingScanDay(null);
  };

  // Group days into 7-day calendar weeks
  const calendarWeeks = useMemo(() => {
    const weeks: DayData[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [days]);

  // Pages for 7-Day Calendar Grid Print (2 weeks per A4 sheet)
  const weekPages = useMemo(() => {
    return chunkArray(calendarWeeks, 2);
  }, [calendarWeeks]);

  // Pages for Spreadsheet Matrix Print (15 days per A4 sheet)
  const dayPages = useMemo(() => {
    return chunkArray(days, 15);
  }, [days]);

  // Drugs to display in Matrix Print Table (only prescribed drugs or top 3)
  const printDrugColumns = useMemo(() => {
    const prescribed = drugList.filter((drug) =>
      days.some((d) => d.medications?.some((m) => m.drug_name === drug && m.dose?.trim()))
    );
    return prescribed.length > 0 ? prescribed : drugList.slice(0, 3);
  }, [drugList, days]);

  // Follicular cohort analysis
  const follicleSummary = useMemo(() => {
    const recordedDays = [...days].filter((d) => d.right_follicles || d.left_follicles);
    const latestDay = recordedDays[recordedDays.length - 1];

    if (!latestDay) {
      return {
        hasData: false,
        totalCount: 0,
        matureCount: 0,
        intermediateCount: 0,
        smallCount: 0,
        leadFollicle: 0,
        triggerReady: false,
      };
    }

    const rParsed = parseFollicleTokens(latestDay.right_follicles);
    const lParsed = parseFollicleTokens(latestDay.left_follicles);

    const allTokens = [...rParsed.tokens, ...lParsed.tokens];
    const totalCount = allTokens.length;
    const matureCount = rParsed.matureCount + lParsed.matureCount;
    const intermediateCount = rParsed.intermediateCount + lParsed.intermediateCount;
    const smallCount = rParsed.smallCount + lParsed.smallCount;
    const leadFollicle = allTokens.length > 0 ? Math.max(...allTokens.map((t) => t.mm)) : 0;
    const triggerReady = matureCount >= 3 || (matureCount >= 1 && intermediateCount >= 2 && leadFollicle >= 18);

    return {
      hasData: true,
      dayNumber: latestDay.day_number,
      totalCount,
      matureCount,
      intermediateCount,
      smallCount,
      leadFollicle,
      triggerReady,
    };
  }, [days]);

  const maxE2 = Math.max(
    0,
    ...days.map((d) => parseFloat(d.e2_pgml || '0')).filter((v) => !isNaN(v))
  );

  const isHighOhssRisk = maxE2 >= 3500 || follicleSummary.totalCount >= 18;
  const isModerateOhssRisk = !isHighOhssRisk && (maxE2 >= 2500 || follicleSummary.totalCount >= 14);

  return (
    <div className="space-y-4">
      {/* Top Protocol Mode Switcher (Stimulation vs HRT FET) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs print:hidden">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setProtocolMode('stimulation')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              protocolMode === 'stimulation'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ovarian Stimulation Sheet
          </button>
          <button
            type="button"
            onClick={() => setProtocolMode('hrt_fet')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              protocolMode === 'hrt_fet'
                ? 'bg-[#2F6F8F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>HRT FET Protocol (Day 3 / Day 5)</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-teal-400/30 text-teal-100 font-extrabold">Excel</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Active Protocol Mode: <strong className="text-slate-800">{protocolMode === 'hrt_fet' ? 'HRT Frozen Embryo Transfer' : 'Gonadotropin Stimulation'}</strong>
        </div>
      </div>

      {protocolMode === 'hrt_fet' ? (
        <HrtFetProtocolSheet
          cycleId={cycleId}
          startDate={startDate}
          initialDays={initialDays}
          sentinelDates={sentinelDates}
          readonly={readonly}
          onCalendarSaved={onCalendarSaved}
        />
      ) : (
        <>
          {/* Top Controls & View Mode Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-2xs print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Ovarian Stimulation Calendar
                </h3>
                <p className="text-[11px] text-slate-500">
                  7-Day weekly calendar view with daily gonadotropins, antagonist suppression, trigger, and folliculometry
                </p>
              </div>
            </div>

            {/* View Mode Toggle: 7-Day Calendar (Default) vs Matrix Table */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>7-Day Calendar View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'matrix'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Spreadsheet Table</span>
              </button>
            </div>

            {/* Protocol Auto-Fill with Confirmation Warning */}
            <div className="flex items-center gap-2 flex-wrap">
              {!readonly && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">Auto-Fill:</span>
                  <select
                    value={selectedProtocolId}
                    onChange={(e) => {
                      setSelectedProtocolId(e.target.value);
                      if (e.target.value) handleInitiateProtocolApply(e.target.value);
                    }}
                    className="text-[11px] text-slate-800 bg-transparent border-0 font-medium focus:ring-0 pr-1 cursor-pointer max-w-[200px] truncate"
                  >
                    <option value="">— Select Protocol to Apply —</option>
                    <optgroup label="Standard Protocols">
                      {STANDARD_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </optgroup>
                    {dbProtocols.length > 0 && (
                      <optgroup label="Database Protocols">
                        {dbProtocols.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}

              {saveMessage && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 animate-fadeIn">
                  <Check className="w-3.5 h-3.5" />
                  {saveMessage}
                </span>
              )}

              {!readonly && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowAddDrug(!showAddDrug)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary" />
                    <span>Add Drug</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCalendar}
                    disabled={isSaving}
                    className="px-3.5 py-1.5 bg-primary hover:bg-primary-mid disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Matrix'}</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setPrintLayoutMode(viewMode);
                  setShowPrintModal(true);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Print Ovarian Stimulation Sheet (A4)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Trigger Readiness & Clinical CDSS Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:hidden">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Follicle Cohort (Latest Scan)
                </span>
                {follicleSummary.hasData && (
                  <span className="text-[10px] text-slate-400">Day {follicleSummary.dayNumber}</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  ≥18mm: <strong>{follicleSummary.matureCount}</strong>
                </div>
                <div className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  14–17mm: <strong>{follicleSummary.intermediateCount}</strong>
                </div>
                <div className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                  &lt;14mm: <strong>{follicleSummary.smallCount}</strong>
                </div>
              </div>
              <div className="mt-1.5 text-[11px] text-slate-500">
                Lead Follicle:{' '}
                <strong className={follicleSummary.leadFollicle >= 18 ? 'text-emerald-700 font-bold' : 'text-slate-700'}>
                  {follicleSummary.leadFollicle ? `${follicleSummary.leadFollicle} mm` : 'No scans recorded yet'}
                </strong>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  Trigger Readiness
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  follicleSummary.triggerReady
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {follicleSummary.triggerReady ? 'Trigger Ready ⚡' : 'Stimulation Ongoing'}
                </span>
              </div>
              <p className="text-xs text-slate-700">
                {follicleSummary.triggerReady ? (
                  <span className="text-emerald-800 font-semibold">
                    ✓ Cohort criteria met (≥3 follicles ≥17–18mm). Administer hCG or Dual Trigger (35–36h prior to OPU).
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Continue stimulation. Target ≥3 lead follicles reaching ≥17–18mm before administering trigger.
                  </span>
                )}
              </p>
              <div className="mt-1.5 text-[11px] text-slate-500">
                Estimated Trigger Date: <strong>{sentinelDates?.trigger || 'Pending Scan Review'}</strong>
              </div>
            </div>

            <div className={`border rounded-xl p-3.5 shadow-2xs flex flex-col justify-between ${
              isHighOhssRisk
                ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                : isModerateOhssRisk
                ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Activity className={`w-3.5 h-3.5 ${isHighOhssRisk ? 'text-rose-600' : 'text-slate-500'}`} />
                  OHSS Risk &amp; Hormones
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isHighOhssRisk
                    ? 'bg-rose-200 text-rose-900 border border-rose-300'
                    : isModerateOhssRisk
                    ? 'bg-amber-200 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {isHighOhssRisk ? 'High Risk' : isModerateOhssRisk ? 'Moderate Risk' : 'Low / Safe'}
                </span>
              </div>
              <p className="text-xs">
                {isHighOhssRisk ? (
                  <span className="text-rose-900 font-medium">
                    ⚠️ GnRH agonist trigger (Decapeptyl 0.2mg) recommended. Freeze-all protocol to prevent OHSS.
                  </span>
                ) : isModerateOhssRisk ? (
                  <span className="text-amber-900 font-medium">
                    Close monitoring of fluid intake, E2 trajectory, and consider reduced hCG trigger dose.
                  </span>
                ) : (
                  <span className="text-slate-600">
                    Hormone levels and cohort within safe stimulation threshold.
                  </span>
                )}
              </p>
              <div className="mt-1.5 text-[11px] text-slate-500 flex justify-between items-center">
                <span>Peak E2: <strong>{maxE2 ? `${maxE2} pg/mL` : '—'}</strong></span>
                <span>Total Follicles: <strong>{follicleSummary.totalCount}</strong></span>
              </div>
            </div>
          </div>

          {/* Add Custom Drug Dialog Popover */}
          {showAddDrug && (
            <div className="p-3 bg-white border border-primary/30 rounded-xl flex items-center gap-2 max-w-lg shadow-sm print:hidden animate-fadeIn">
              <input
                type="text"
                placeholder="e.g. Rekovelle 12 mcg, Decapeptyl 0.1mg, Lupride 0.5mg..."
                value={newDrugName}
                onChange={(e) => setNewDrugName(e.target.value)}
                className="vmd-input text-xs flex-1"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddCustomDrug}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Add Drug
              </button>
              <button
                type="button"
                onClick={() => setShowAddDrug(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CONFIRMATION POPUP MODAL BEFORE OVERRIDING PROTOCOL                       */}
          {/* ========================================================================= */}
          {overrideModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-fadeIn">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200 space-y-4 animate-scaleIn">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Override Existing Medication Schedule?</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Active medications are already scheduled in this cycle. Applying <strong>{overrideModal.protocolName}</strong> will replace the existing medications with the new protocol's standard dosage schedule.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                  Choose whether you want to completely <strong>replace</strong> the medication schedule or <strong>merge</strong> with the currently prescribed medications.
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      executeApplyProtocol(overrideModal.protocolId, 'overwrite');
                      setOverrideModal(null);
                    }}
                    className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                  >
                    Replace &amp; Overwrite
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      executeApplyProtocol(overrideModal.protocolId, 'merge');
                      setOverrideModal(null);
                    }}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
                  >
                    Merge
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideModal(null)}
                    className="py-2 px-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* QUICK DAY SCAN / FOLLICULOMETRY MODAL                                     */}
          {/* ========================================================================= */}
          {editingScanDay && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-fadeIn">
              <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl border border-slate-200 space-y-4 animate-scaleIn">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Search className="w-4 h-4 text-primary" />
                      Day {editingScanDay.day_number} — Ultrasound &amp; Lab Monitoring
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {editingScanDay.display_date} ({editingScanDay.day_of_week})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingScanDay(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-rose-900 block mb-1">Right Ovary Follicles (mm)</label>
                      <input
                        type="text"
                        placeholder="e.g. 18, 16, 14, 11"
                        value={editingScanDay.right_follicles || ''}
                        onChange={(e) => setEditingScanDay({ ...editingScanDay, right_follicles: e.target.value })}
                        className="vmd-input text-xs w-full font-semibold"
                      />
                      {/* Live Chips */}
                      {editingScanDay.right_follicles && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {parseFollicleTokens(editingScanDay.right_follicles).tokens.map((t, idx) => (
                            <span
                              key={idx}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                t.category === 'mature'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : t.category === 'intermediate'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {t.mm}mm
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-rose-900 block mb-1">Left Ovary Follicles (mm)</label>
                      <input
                        type="text"
                        placeholder="e.g. 17, 15, 12, 10"
                        value={editingScanDay.left_follicles || ''}
                        onChange={(e) => setEditingScanDay({ ...editingScanDay, left_follicles: e.target.value })}
                        className="vmd-input text-xs w-full font-semibold"
                      />
                      {/* Live Chips */}
                      {editingScanDay.left_follicles && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {parseFollicleTokens(editingScanDay.left_follicles).tokens.map((t, idx) => (
                            <span
                              key={idx}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                t.category === 'mature'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : t.category === 'intermediate'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {t.mm}mm
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Endometrial Thickness (mm)</label>
                      <input
                        type="text"
                        placeholder="e.g. 8.5"
                        value={editingScanDay.endometrium_mm || ''}
                        onChange={(e) => setEditingScanDay({ ...editingScanDay, endometrium_mm: e.target.value })}
                        className="vmd-input text-xs w-full font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Endometrial Pattern</label>
                      <select
                        value={editingScanDay.endometrial_pattern || 'Trilaminar'}
                        onChange={(e) => setEditingScanDay({ ...editingScanDay, endometrial_pattern: e.target.value })}
                        className="vmd-input text-xs w-full"
                      >
                        <option value="Trilaminar">Trilaminar (Triple-line)</option>
                        <option value="Homogeneous">Homogeneous</option>
                        <option value="Hyperechoic">Hyperechoic</option>
                        <option value="Secretory">Secretory / Luteal</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Serum E2 (pg/mL)</label>
                      <input
                        type="text"
                        placeholder="pg/mL"
                        value={editingScanDay.e2_pgml || ''}
                        onChange={(e) => setEditingScanDay({ ...editingScanDay, e2_pgml: e.target.value })}
                        className="vmd-input text-xs w-full text-center font-bold text-amber-900"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Serum P4 (ng/mL)</label>
                      <input
                        type="text"
                        placeholder="ng/mL"
                        value={editingScanDay.p4_ngml || ''}
                        onChange={(e) => setEditingScanDay({ ...editingScanDay, p4_ngml: e.target.value })}
                        className="vmd-input text-xs w-full text-center font-bold text-amber-900"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Serum LH (mIU/mL)</label>
                      <input
                        type="text"
                        placeholder="mIU/mL"
                        value={editingScanDay.lh_miu || ''}
                        onChange={(e) => setEditingScanDay({ ...editingScanDay, lh_miu: e.target.value })}
                        className="vmd-input text-xs w-full text-center font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Milestone / Sentinel Event</label>
                    <input
                      type="text"
                      placeholder="e.g. Baseline Scan 🔍, Follicular Tracking Scan, Trigger ⚡"
                      value={editingScanDay.milestone || ''}
                      onChange={(e) => setEditingScanDay({ ...editingScanDay, milestone: e.target.value })}
                      className="vmd-input text-xs w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Clinical Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Clinical observations, dosage titration rationale..."
                      value={editingScanDay.notes || ''}
                      onChange={(e) => setEditingScanDay({ ...editingScanDay, notes: e.target.value })}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingScanDay(null)}
                    className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveScanModal(editingScanDay)}
                    className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-mid shadow-xs"
                  >
                    Save Scan Record
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PRIMARY VIEW: 7-DAY CALENDAR GRID (7 Days in One Row)                     */}
          {/* ========================================================================= */}
          {viewMode === 'calendar' && (
            <div className="space-y-4">
              {calendarWeeks.map((week, weekIdx) => (
                <div key={weekIdx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  {/* Week Header Bar */}
                  <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-primary" />
                      Week {weekIdx + 1} (Days {week[0].day_number} – {week[week.length - 1].day_number})
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      {week[0].display_date} to {week[week.length - 1].display_date}
                    </span>
                  </div>

                  {/* 7-Columns Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                    {week.map((day) => {
                      const rFollicles = parseFollicleTokens(day.right_follicles);
                      const lFollicles = parseFollicleTokens(day.left_follicles);
                      const hasScan = Boolean(
                        day.right_follicles || day.left_follicles || day.endometrium_mm || day.e2_pgml
                      );

                      const isMilestone = Boolean(day.milestone);
                      const isTrigger = day.milestone?.toLowerCase().includes('trigger');
                      const isOpu = day.milestone?.toLowerCase().includes('opu');

                      return (
                        <div
                          key={day.day_number}
                          className={`p-2.5 flex flex-col justify-between min-h-[260px] transition-colors relative group/box ${
                            isTrigger
                              ? 'bg-amber-50/40'
                              : isOpu
                              ? 'bg-blue-50/40'
                              : hasScan
                              ? 'bg-emerald-50/20'
                              : 'bg-white hover:bg-slate-50/60'
                          }`}
                        >
                          {/* Top: Day # & Date Header */}
                          <div>
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                                  isTrigger
                                    ? 'bg-amber-600 text-white'
                                    : isOpu
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-900 text-white'
                                }`}>
                                  D{day.day_number}
                                </span>
                                <span className="text-[11px] font-bold text-slate-800">{day.display_date}</span>
                              </div>
                              <span className="text-[10px] uppercase font-bold text-slate-400">{day.day_of_week}</span>
                            </div>

                            {/* Milestone Banner */}
                            {day.milestone && (
                              <div className={`mt-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded border truncate flex items-center gap-1 ${
                                isTrigger
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : isOpu
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-primary/10 text-primary border-primary/20'
                              }`}>
                                <Sparkles className="w-3 h-3 shrink-0" />
                                <span className="truncate">{day.milestone}</span>
                              </div>
                            )}

                            {/* Active Medications List in Day Box */}
                            <div className="mt-2 space-y-1">
                              {day.medications.map((m, mIdx) => (
                                <div
                                  key={mIdx}
                                  className="bg-primary/10 text-primary border border-primary/25 rounded-md p-1 px-1.5 flex items-center justify-between text-[11px] group/med"
                                >
                                  <span className="font-bold truncate max-w-[80px]" title={m.drug_name}>
                                    {m.drug_name.split('(')[0].trim()}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={m.dose}
                                      disabled={readonly}
                                      onChange={(e) => handleUpdateMedDose(day.day_number, mIdx, e.target.value)}
                                      className="w-14 text-center bg-white border border-primary/30 rounded text-[10px] py-0.5 font-extrabold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    {!readonly && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveMedFromDay(day.day_number, mIdx)}
                                        className="text-slate-400 hover:text-rose-600 opacity-0 group-hover/med:opacity-100 transition-opacity p-0.5"
                                        title="Remove medication"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {/* Quick Add Med Button / Popover */}
                              {!readonly && (
                                <div className="relative pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setActiveAddMedDay(activeAddMedDay === day.day_number ? null : day.day_number)}
                                    className="w-full text-center text-[10px] py-1 border border-dashed border-slate-300 hover:border-primary text-slate-500 hover:text-primary rounded-md transition-colors flex items-center justify-center gap-1 bg-white/70"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add Med</span>
                                  </button>

                                  {/* Drug Picker Dropdown */}
                                  {activeAddMedDay === day.day_number && (
                                    <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-300 rounded-lg shadow-xl p-1.5 space-y-1 mt-1 max-h-48 overflow-y-auto">
                                      <div className="text-[9px] font-bold text-slate-400 uppercase px-1">Select Drug:</div>
                                      {drugList.map((d) => (
                                        <button
                                          key={d}
                                          type="button"
                                          onClick={() => handleAddMedToDay(day.day_number, d)}
                                          className="w-full text-left text-[10px] p-1 rounded hover:bg-primary/10 hover:text-primary truncate block font-medium"
                                        >
                                          {d}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Bottom: Folliculometry & Scans Summary */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                            {hasScan ? (
                              <div
                                onClick={() => !readonly && setEditingScanDay(day)}
                                className="bg-white/90 border border-slate-200 rounded-md p-1.5 text-[10px] cursor-pointer hover:border-primary transition-colors"
                              >
                                {day.endometrium_mm && (
                                  <div className="font-bold text-emerald-800 flex justify-between">
                                    <span>Endo: {day.endometrium_mm} mm</span>
                                    {day.endometrial_pattern && <span className="text-[9px] text-slate-400">{day.endometrial_pattern}</span>}
                                  </div>
                                )}
                                {(rFollicles.tokens.length > 0 || lFollicles.tokens.length > 0) && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {rFollicles.tokens.map((t, idx) => (
                                      <span
                                        key={`r-${idx}`}
                                        className={`text-[8.5px] font-bold px-1 py-0.2 rounded ${
                                          t.category === 'mature'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : t.category === 'intermediate'
                                            ? 'bg-amber-100 text-amber-900'
                                            : 'bg-slate-200 text-slate-700'
                                        }`}
                                      >
                                        R{t.mm}
                                      </span>
                                    ))}
                                    {lFollicles.tokens.map((t, idx) => (
                                      <span
                                        key={`l-${idx}`}
                                        className={`text-[8.5px] font-bold px-1 py-0.2 rounded ${
                                          t.category === 'mature'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : t.category === 'intermediate'
                                            ? 'bg-amber-100 text-amber-900'
                                            : 'bg-slate-200 text-slate-700'
                                        }`}
                                      >
                                        L{t.mm}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {day.e2_pgml && (
                                  <div className="text-[9px] text-amber-800 font-bold mt-0.5">
                                    E2: {day.e2_pgml} pg/mL
                                  </div>
                                )}
                              </div>
                            ) : (
                              !readonly && (
                                <button
                                  type="button"
                                  onClick={() => setEditingScanDay(day)}
                                  className="w-full text-center text-[10px] py-1 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors flex items-center justify-center gap-1"
                                >
                                  <Search className="w-3 h-3 text-slate-400" />
                                  <span>+ Scan / Labs</span>
                                </button>
                              )
                            )}

                            {/* Copy Forward / Clear Row */}
                            {!readonly && day.medications.length > 0 && (
                              <div className="flex items-center justify-between text-[9px] pt-1 text-slate-400">
                                <button
                                  type="button"
                                  onClick={() => handleCopyDayToNextDays(day.day_number, 3)}
                                  className="hover:text-primary flex items-center gap-0.5"
                                  title="Copy medications to next 3 days"
                                >
                                  <Copy className="w-2.5 h-2.5" /> Copy 3D
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleClearDayMeds(day.day_number)}
                                  className="hover:text-rose-600"
                                  title="Clear day medications"
                                >
                                  Clear
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECONDARY VIEW: SPREADSHEET MATRIX VIEW (Table Format)                    */}
          {/* ========================================================================= */}
          {viewMode === 'matrix' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-[70vh] custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                  <thead className="sticky top-0 bg-slate-100 z-20 shadow-2xs">
                    <tr className="border-b border-slate-200 bg-slate-200/70 text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                      <th colSpan={2} className="p-2 border-r border-slate-300">
                        Timeline &amp; Milestones
                      </th>
                      <th colSpan={drugList.length} className="p-2 border-r border-slate-300 bg-primary/10 text-primary">
                        Daily Gonadotropins &amp; Medications
                      </th>
                      <th colSpan={3} className="p-2 border-r border-slate-300 bg-rose-50 text-rose-900">
                        Folliculometry &amp; Ultrasound
                      </th>
                      <th colSpan={2} className="p-2 bg-amber-50 text-amber-900">
                        Serum Hormones
                      </th>
                    </tr>

                    <tr className="border-b border-slate-200 bg-slate-100 text-slate-800">
                      <th className="p-2.5 bg-slate-100 font-bold text-xs sticky left-0 z-30 shadow-r min-w-[110px]">
                        Day / Date
                      </th>
                      <th className="p-2.5 bg-slate-100 font-bold text-xs min-w-[130px] border-r border-slate-200">
                        Milestone
                      </th>
                      {drugList.map((drugName) => (
                        <th key={drugName} className="p-2 min-w-[130px] border-r border-slate-200 group">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[11px] font-bold text-slate-900 truncate flex items-center gap-1" title={drugName}>
                              <Pill className="w-3 h-3 text-primary shrink-0" />
                              <span className="truncate">{drugName}</span>
                            </span>
                            {!readonly && (
                              <button
                                type="button"
                                onClick={() => setDrugList(drugList.filter((d) => d !== drugName))}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5"
                                title="Remove drug column"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="p-2 min-w-[110px] bg-rose-50/50 text-rose-950 font-bold text-xs border-r border-slate-200">
                        R. Ovary (mm)
                      </th>
                      <th className="p-2 min-w-[110px] bg-rose-50/50 text-rose-950 font-bold text-xs border-r border-slate-200">
                        L. Ovary (mm)
                      </th>
                      <th className="p-2 min-w-[100px] bg-emerald-50 text-emerald-950 font-bold text-xs border-r border-slate-300">
                        Endo (mm)
                      </th>
                      <th className="p-2 min-w-[90px] bg-amber-50 text-amber-950 font-bold text-xs border-r border-slate-200">
                        E2 (pg/mL)
                      </th>
                      <th className="p-2 min-w-[90px] bg-amber-50 text-amber-950 font-bold text-xs">
                        P4 (ng/mL)
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {days.map((day) => (
                      <tr key={day.day_number} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-2 bg-white sticky left-0 z-10 shadow-r border-b border-slate-100">
                          <div className="font-bold text-slate-900 text-xs">{day.stim_day_label || `Day ${day.day_number}`}</div>
                          <div className="text-[10px] text-slate-500">{day.display_date} ({day.day_of_week})</div>
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          {day.milestone ? (
                            <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary truncate max-w-[120px]">
                              {day.milestone}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        {drugList.map((drugName) => {
                          const med = day.medications.find((m) => m.drug_name === drugName);
                          const doseVal = med?.dose || '';

                          return (
                            <td key={drugName} className="p-1 border-r border-slate-200 relative">
                              <input
                                type="text"
                                value={doseVal}
                                disabled={readonly}
                                placeholder="—"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDays((prev) =>
                                    prev.map((d) => {
                                      if (d.day_number !== day.day_number) return d;
                                      const meds = [...d.medications];
                                      const idx = meds.findIndex((m) => m.drug_name === drugName);
                                      if (idx >= 0) {
                                        if (!val.trim()) meds.splice(idx, 1);
                                        else meds[idx] = { ...meds[idx], dose: val };
                                      } else if (val.trim()) {
                                        meds.push({ drug_name: drugName, dose: val });
                                      }
                                      return { ...d, medications: meds };
                                    })
                                  );
                                }}
                                className={`w-full text-center text-xs py-1 px-1.5 rounded transition-all ${
                                  doseVal
                                    ? 'font-bold bg-primary/10 text-primary border border-primary/20'
                                    : 'text-slate-400 bg-transparent hover:bg-slate-100 border border-transparent'
                                }`}
                              />
                            </td>
                          );
                        })}
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            placeholder="—"
                            value={day.right_follicles || ''}
                            disabled={readonly}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDays((prev) => prev.map((d) => (d.day_number === day.day_number ? { ...d, right_follicles: val } : d)));
                            }}
                            className="w-full text-center text-xs py-1 px-1 rounded bg-transparent hover:bg-slate-100 font-semibold"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            placeholder="—"
                            value={day.left_follicles || ''}
                            disabled={readonly}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDays((prev) => prev.map((d) => (d.day_number === day.day_number ? { ...d, left_follicles: val } : d)));
                            }}
                            className="w-full text-center text-xs py-1 px-1 rounded bg-transparent hover:bg-slate-100 font-semibold"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-300">
                          <input
                            type="text"
                            placeholder="—"
                            value={day.endometrium_mm || ''}
                            disabled={readonly}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDays((prev) => prev.map((d) => (d.day_number === day.day_number ? { ...d, endometrium_mm: val } : d)));
                            }}
                            className="w-full text-center text-xs py-1 px-1 rounded bg-transparent hover:bg-slate-100 font-bold text-emerald-800"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            placeholder="—"
                            value={day.e2_pgml || ''}
                            disabled={readonly}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDays((prev) => prev.map((d) => (d.day_number === day.day_number ? { ...d, e2_pgml: val } : d)));
                            }}
                            className="w-full text-center text-xs py-1 px-1 rounded bg-transparent hover:bg-slate-100 font-bold text-amber-800"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            placeholder="—"
                            value={day.p4_ngml || ''}
                            disabled={readonly}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDays((prev) => prev.map((d) => (d.day_number === day.day_number ? { ...d, p4_ngml: val } : d)));
                            }}
                            className="w-full text-center text-xs py-1 px-1 rounded bg-transparent hover:bg-slate-100 font-bold text-amber-800"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PRINTABLE MODAL FOR A4 SHEET EXPORT (BOTH CALENDAR & MATRIX VIEWS)        */}
          {/* ========================================================================= */}
          <PrintableModal
            isOpen={showPrintModal}
            onClose={() => setShowPrintModal(false)}
            title="Ovarian Stimulation Protocol Sheet"
            subtitle="Official Controlled Ovarian Stimulation & Folliculometry Clinical Record"
            maxWidth="max-w-5xl"
          >
            {({ hideHeader }: { hideHeader: boolean }) => (
              <div className="w-full flex flex-col items-center">
                {/* Print View Mode Switcher Toolbar (Screen only) */}
                <div className="flex flex-wrap items-center justify-between w-full max-w-[210mm] mx-auto mb-4 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 print:hidden">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-300">Select Print Layout:</span>
                    <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setPrintLayoutMode('calendar')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          printLayoutMode === 'calendar'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>7-Day Calendar Grid</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintLayoutMode('matrix')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          printLayoutMode === 'matrix'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <TableIcon className="w-3.5 h-3.5" />
                        <span>Spreadsheet Matrix Table</span>
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 hidden sm:block">
                    {printLayoutMode === 'calendar'
                      ? 'Weekly 7-day grid view with medication boxes & scan tags'
                      : 'High-density multi-parameter tabular matrix'}
                  </div>
                </div>

                {/* VIEW 1: 7-DAY CALENDAR GRID PRINT PAGES */}
                {printLayoutMode === 'calendar' ? (
                  weekPages.map((weeksForPage, pageIdx) => (
                    <A4Sheet
                      key={`cal-page-${pageIdx}`}
                      className="mb-8 print:mb-0"
                      header={
                        <PrintableReportHeader
                          title="CONTROLLED OVARIAN STIMULATION PROTOCOL"
                          subtitle={`${effectiveModality} · Weekly Medication & Scan Calendar`}
                          badge="OVARIAN STIMULATION SHEET"
                          department="Reproductive Medicine & Infertility"
                          hideHospitalHeader={hideHeader}
                          patient={{
                            name: effectivePatient?.name || effectivePatient?.full_name || 'Patient Record',
                            vid: effectivePatient?.vid || effectivePatient?.mrn || 'N/A',
                            age: effectivePatient?.age ? Number(effectivePatient?.age) : undefined,
                            gender: effectivePatient?.gender || 'Female',
                            phone: effectivePatient?.phone || effectivePatient?.mobile,
                            partner_name: effectivePatient?.partner_name,
                            partner_age: effectivePatient?.partner_age,
                          }}
                          doctor={{
                            name: effectiveDoctor?.name || 'Dr. Reproductive Medicine Specialist',
                            qualification: effectiveDoctor?.qualification || 'MBBS, MS (OBG), Fellowship in Reproductive Medicine',
                            reg_number: effectiveDoctor?.reg_number || effectiveDoctor?.registration_number,
                            department: 'Reproductive Medicine & Infertility',
                          }}
                          metaFields={[
                            { label: 'Cycle ID', value: effectiveCycleCode },
                            { label: 'Treatment Modality', value: effectiveModality },
                            { label: 'Stim Start Date', value: startDate || sentinelDates?.stim_start || 'Day 1' },
                            { label: 'Est. Trigger Date', value: sentinelDates?.trigger || 'Pending Evaluation' },
                            { label: 'Est. OPU Retrieval', value: sentinelDates?.opu || sentinelDates?.insemination || 'Pending Trigger' },
                          ]}
                        />
                      }
                      footer={
                        <PrintableReportFooter
                          signatoryName={effectiveDoctor?.name || 'Dr. Reproductive Medicine Specialist'}
                          signatoryQualification={effectiveDoctor?.qualification || 'MBBS, MS (OBG), Fellowship in Reproductive Medicine'}
                          signatoryTitle="Consultant Gynecologist & ART Specialist"
                          showSignatory={true}
                          pageNumber={pageIdx + 1}
                          totalPages={weekPages.length}
                          hideHospitalFooter={hideHeader}
                        />
                      }
                    >
                      {/* Clinical Summary Bar on Page 1 */}
                      {pageIdx === 0 && (
                        <div className="mb-3 p-2 bg-slate-50 border border-slate-300 rounded-lg grid grid-cols-3 gap-2 text-[9px]">
                          <div className="border-r border-slate-200 pr-2">
                            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                              Follicular Cohort (Latest)
                            </div>
                            <div className="font-bold text-slate-900 mt-0.5">
                              Total: {follicleSummary.totalCount} | Mature (≥18mm):{' '}
                              <span className="text-emerald-700">{follicleSummary.matureCount}</span>
                            </div>
                            <div className="text-slate-600 text-[8px]">
                              14–17mm: {follicleSummary.intermediateCount} · &lt;14mm: {follicleSummary.smallCount}
                            </div>
                          </div>
                          <div className="border-r border-slate-200 pr-2">
                            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                              Trigger Readiness
                            </div>
                            <div className="font-bold mt-0.5">
                              <span
                                className={
                                  follicleSummary.triggerReady
                                    ? 'text-emerald-700 font-extrabold'
                                    : 'text-amber-700'
                                }
                              >
                                {follicleSummary.triggerReady ? '✓ Trigger Criteria Met' : 'Stimulation Ongoing'}
                              </span>
                            </div>
                            <div className="text-slate-600 text-[8px]">
                              Est. Trigger: {sentinelDates?.trigger || 'Pending Evaluation'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                              OHSS Safety Assessment
                            </div>
                            <div className="font-bold mt-0.5">
                              Peak E2: {maxE2 ? `${maxE2} pg/mL` : '—'} ·{' '}
                              <span
                                className={
                                  isHighOhssRisk
                                    ? 'text-rose-700'
                                    : isModerateOhssRisk
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                                }
                              >
                                {isHighOhssRisk ? 'High Risk' : isModerateOhssRisk ? 'Moderate Risk' : 'Low Risk'}
                              </span>
                            </div>
                            <div className="text-slate-600 text-[8px]">
                              {isHighOhssRisk
                                ? 'Decapeptyl Trigger / Freeze-all recommended'
                                : 'Standard gonadotropin stimulation protocol'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 7-Day Weeks */}
                      <div className="space-y-3">
                        {weeksForPage.map((week, wIdx) => {
                          const weekNumber = pageIdx * 2 + wIdx + 1;
                          return (
                            <div key={wIdx} className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                              {/* Week Header */}
                              <div className="bg-slate-100 border-b border-slate-300 px-3 py-1 flex items-center justify-between text-[10px] font-bold text-slate-800">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                                  <span>Week {weekNumber}</span>
                                  <span className="text-slate-500 font-normal">
                                    (Days {week[0]?.day_number} – {week[week.length - 1]?.day_number})
                                  </span>
                                </span>
                                <span className="text-[8.5px] text-slate-500 font-medium">
                                  {week[0]?.display_date} to {week[week.length - 1]?.display_date}
                                </span>
                              </div>

                              {/* 7 Columns */}
                              <div className="grid grid-cols-7 divide-x divide-slate-300">
                                {week.map((day) => {
                                  const rFollicles = parseFollicleTokens(day.right_follicles);
                                  const lFollicles = parseFollicleTokens(day.left_follicles);
                                  const hasScan = Boolean(
                                    day.right_follicles || day.left_follicles || day.endometrium_mm || day.e2_pgml
                                  );
                                  const isMilestone = Boolean(day.milestone);
                                  const isTrigger = day.milestone?.toLowerCase().includes('trigger');
                                  const isOpu = day.milestone?.toLowerCase().includes('opu');

                                  return (
                                    <div
                                      key={day.day_number}
                                      className={`p-1.5 flex flex-col justify-between min-h-[140px] text-[8.5px] ${
                                        isTrigger
                                          ? 'bg-amber-50/60'
                                          : isOpu
                                          ? 'bg-rose-50/60'
                                          : isMilestone
                                          ? 'bg-primary/5'
                                          : 'bg-white'
                                      }`}
                                    >
                                      <div>
                                        <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                                          <span className="font-extrabold text-slate-900 text-[9px]">
                                            Day {day.day_number}
                                          </span>
                                          <span className="text-[7.5px] font-semibold text-slate-500 uppercase">
                                            {day.day_of_week?.slice(0, 3)}
                                          </span>
                                        </div>
                                        <div className="text-[7.5px] text-slate-400 mb-1">
                                          {day.display_date?.split(' ').slice(0, 2).join(' ')}
                                        </div>

                                        {day.milestone && (
                                          <div className="mb-1">
                                            <span className="inline-block text-[7px] font-bold px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 leading-tight w-full truncate text-center">
                                              {day.milestone}
                                            </span>
                                          </div>
                                        )}

                                        <div className="space-y-0.5">
                                          {day.medications && day.medications.length > 0 ? (
                                            day.medications.map((m, mIdx) => (
                                              <div
                                                key={mIdx}
                                                className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[7.5px] leading-tight"
                                              >
                                                <div className="font-bold text-slate-900 truncate" title={m.drug_name}>
                                                  {m.drug_name.split('(')[0].trim()}
                                                </div>
                                                <div className="text-primary font-extrabold text-[7.5px]">
                                                  {m.dose}
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="text-slate-300 italic text-[7.5px] py-1 text-center">
                                              —
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="mt-1 pt-1 border-t border-slate-200 text-[7px] space-y-0.5">
                                        {hasScan ? (
                                          <>
                                            {day.endometrium_mm && (
                                              <div className="font-bold text-emerald-800 flex justify-between">
                                                <span>Endo:</span>
                                                <span>{day.endometrium_mm}mm</span>
                                              </div>
                                            )}
                                            {(rFollicles.tokens.length > 0 || lFollicles.tokens.length > 0) && (
                                              <div className="leading-tight text-slate-700">
                                                {rFollicles.tokens.length > 0 && (
                                                  <div className="truncate">
                                                    <span className="font-bold text-rose-700">R:</span>{' '}
                                                    {rFollicles.tokens.map((t) => `${t.mm}`).join(', ')}
                                                  </div>
                                                )}
                                                {lFollicles.tokens.length > 0 && (
                                                  <div className="truncate">
                                                    <span className="font-bold text-rose-700">L:</span>{' '}
                                                    {lFollicles.tokens.map((t) => `${t.mm}`).join(', ')}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            {day.e2_pgml && (
                                              <div className="text-amber-800 font-bold truncate">
                                                E2: {day.e2_pgml} pg
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <div className="text-slate-300 text-[7px] text-center">—</div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </A4Sheet>
                  ))
                ) : (
                  /* VIEW 2: SPREADSHEET MATRIX TABLE PRINT PAGES */
                  dayPages.map((daysForPage, pageIdx) => (
                    <A4Sheet
                      key={`matrix-page-${pageIdx}`}
                      className="mb-8 print:mb-0"
                      header={
                        <PrintableReportHeader
                          title="CONTROLLED OVARIAN STIMULATION PROTOCOL"
                          subtitle={`${effectiveModality} · Clinical Medication & Folliculometry Matrix`}
                          badge="OVARIAN STIMULATION SHEET"
                          department="Reproductive Medicine & Infertility"
                          hideHospitalHeader={hideHeader}
                          patient={{
                            name: effectivePatient?.name || effectivePatient?.full_name || 'Patient Record',
                            vid: effectivePatient?.vid || effectivePatient?.mrn || 'N/A',
                            age: effectivePatient?.age ? Number(effectivePatient?.age) : undefined,
                            gender: effectivePatient?.gender || 'Female',
                            phone: effectivePatient?.phone || effectivePatient?.mobile,
                            partner_name: effectivePatient?.partner_name,
                            partner_age: effectivePatient?.partner_age,
                          }}
                          doctor={{
                            name: effectiveDoctor?.name || 'Dr. Reproductive Medicine Specialist',
                            qualification: effectiveDoctor?.qualification || 'MBBS, MS (OBG), Fellowship in Reproductive Medicine',
                            reg_number: effectiveDoctor?.reg_number || effectiveDoctor?.registration_number,
                            department: 'Reproductive Medicine & Infertility',
                          }}
                          metaFields={[
                            { label: 'Cycle ID', value: effectiveCycleCode },
                            { label: 'Treatment Modality', value: effectiveModality },
                            { label: 'Stim Start Date', value: startDate || sentinelDates?.stim_start || 'Day 1' },
                            { label: 'Est. Trigger Date', value: sentinelDates?.trigger || 'Pending Evaluation' },
                            { label: 'Est. OPU Retrieval', value: sentinelDates?.opu || sentinelDates?.insemination || 'Pending Trigger' },
                          ]}
                        />
                      }
                      footer={
                        <PrintableReportFooter
                          signatoryName={effectiveDoctor?.name || 'Dr. Reproductive Medicine Specialist'}
                          signatoryQualification={effectiveDoctor?.qualification || 'MBBS, MS (OBG), Fellowship in Reproductive Medicine'}
                          signatoryTitle="Consultant Gynecologist & ART Specialist"
                          showSignatory={true}
                          pageNumber={pageIdx + 1}
                          totalPages={dayPages.length}
                          hideHospitalFooter={hideHeader}
                        />
                      }
                    >
                      {/* Clinical Summary Bar on Page 1 */}
                      {pageIdx === 0 && (
                        <div className="mb-3 p-2 bg-slate-50 border border-slate-300 rounded-lg grid grid-cols-3 gap-2 text-[9px]">
                          <div className="border-r border-slate-200 pr-2">
                            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                              Follicular Cohort (Latest)
                            </div>
                            <div className="font-bold text-slate-900 mt-0.5">
                              Total: {follicleSummary.totalCount} | Mature (≥18mm):{' '}
                              <span className="text-emerald-700">{follicleSummary.matureCount}</span>
                            </div>
                            <div className="text-slate-600 text-[8px]">
                              14–17mm: {follicleSummary.intermediateCount} · &lt;14mm: {follicleSummary.smallCount}
                            </div>
                          </div>
                          <div className="border-r border-slate-200 pr-2">
                            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                              Trigger Readiness
                            </div>
                            <div className="font-bold mt-0.5">
                              <span
                                className={
                                  follicleSummary.triggerReady
                                    ? 'text-emerald-700 font-extrabold'
                                    : 'text-amber-700'
                                }
                              >
                                {follicleSummary.triggerReady ? '✓ Trigger Criteria Met' : 'Stimulation Ongoing'}
                              </span>
                            </div>
                            <div className="text-slate-600 text-[8px]">
                              Est. Trigger: {sentinelDates?.trigger || 'Pending Evaluation'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                              OHSS Safety Assessment
                            </div>
                            <div className="font-bold mt-0.5">
                              Peak E2: {maxE2 ? `${maxE2} pg/mL` : '—'} ·{' '}
                              <span
                                className={
                                  isHighOhssRisk
                                    ? 'text-rose-700'
                                    : isModerateOhssRisk
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                                }
                              >
                                {isHighOhssRisk ? 'High Risk' : isModerateOhssRisk ? 'Moderate Risk' : 'Low Risk'}
                              </span>
                            </div>
                            <div className="text-slate-600 text-[8px]">
                              {isHighOhssRisk
                                ? 'Decapeptyl Trigger / Freeze-all recommended'
                                : 'Standard gonadotropin stimulation protocol'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Matrix Table */}
                      <div className="my-1 border border-slate-300 rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-left border-collapse text-[8px]">
                          <thead>
                            <tr className="bg-slate-200/90 text-slate-800 font-extrabold uppercase text-[7.5px] border-b border-slate-300">
                              <th colSpan={2} className="p-1.5 border-r border-slate-300">
                                Timeline &amp; Milestones
                              </th>
                              <th
                                colSpan={printDrugColumns.length}
                                className="p-1.5 border-r border-slate-300 bg-primary/10 text-primary text-center"
                              >
                                Prescribed Medications &amp; Dosages
                              </th>
                              <th
                                colSpan={3}
                                className="p-1.5 border-r border-slate-300 bg-rose-50 text-rose-900 text-center"
                              >
                                Folliculometry &amp; Endometrium
                              </th>
                              <th colSpan={2} className="p-1.5 bg-amber-50 text-amber-900 text-center">
                                Serum Hormones
                              </th>
                            </tr>
                            <tr className="bg-slate-100 text-slate-800 font-bold text-[7.5px] border-b border-slate-300">
                              <th className="p-1 border-r border-slate-300 min-w-[65px]">Day / Date</th>
                              <th className="p-1 border-r border-slate-300 min-w-[85px]">Milestone</th>
                              {printDrugColumns.map((drug) => (
                                <th
                                  key={drug}
                                  className="p-1 border-r border-slate-300 text-center min-w-[65px] truncate max-w-[95px]"
                                  title={drug}
                                >
                                  {drug.split('(')[0].trim()}
                                </th>
                              ))}
                              <th className="p-1 border-r border-slate-300 text-center min-w-[60px]">R. Ovary (mm)</th>
                              <th className="p-1 border-r border-slate-300 text-center min-w-[60px]">L. Ovary (mm)</th>
                              <th className="p-1 border-r border-slate-300 text-center min-w-[50px]">Endo (mm)</th>
                              <th className="p-1 border-r border-slate-300 text-center min-w-[50px]">E2 (pg/mL)</th>
                              <th className="p-1 text-center min-w-[50px]">P4 (ng/mL)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {daysForPage.map((day, rowIdx) => {
                              const isTrigger = day.milestone?.toLowerCase().includes('trigger');
                              const isOpu = day.milestone?.toLowerCase().includes('opu');

                              return (
                                <tr
                                  key={day.day_number}
                                  className={`${
                                    isTrigger
                                      ? 'bg-amber-50/70 font-bold'
                                      : isOpu
                                      ? 'bg-rose-50/70 font-bold'
                                      : rowIdx % 2 === 0
                                      ? 'bg-white'
                                      : 'bg-slate-50/80'
                                  }`}
                                >
                                  <td className="p-1 border-r border-slate-300 font-bold text-slate-900 whitespace-nowrap">
                                    Day {day.day_number}{' '}
                                    <span className="text-[7px] font-normal text-slate-500">
                                      ({day.display_date?.split(' ').slice(0, 2).join(' ')}, {day.day_of_week?.slice(0, 3)})
                                    </span>
                                  </td>
                                  <td className="p-1 border-r border-slate-300">
                                    {day.milestone ? (
                                      <span className="inline-block text-[7px] font-bold px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 truncate max-w-[95px]">
                                        {day.milestone}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  {printDrugColumns.map((drug) => {
                                    const med = day.medications?.find((m) => m.drug_name === drug);
                                    const dose = med?.dose;
                                    return (
                                      <td
                                        key={drug}
                                        className="p-1 border-r border-slate-300 text-center font-bold text-slate-900"
                                      >
                                        {dose ? (
                                          <span className="text-primary font-extrabold">{dose}</span>
                                        ) : (
                                          <span className="text-slate-300 font-normal">—</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="p-1 border-r border-slate-300 text-center font-medium">
                                    {day.right_follicles || <span className="text-slate-300">—</span>}
                                  </td>
                                  <td className="p-1 border-r border-slate-300 text-center font-medium">
                                    {day.left_follicles || <span className="text-slate-300">—</span>}
                                  </td>
                                  <td className="p-1 border-r border-slate-300 text-center font-bold text-emerald-800">
                                    {day.endometrium_mm ? (
                                      `${day.endometrium_mm} mm`
                                    ) : (
                                      <span className="text-slate-300 font-normal">—</span>
                                    )}
                                  </td>
                                  <td className="p-1 border-r border-slate-300 text-center font-bold text-amber-800">
                                    {day.e2_pgml || <span className="text-slate-300 font-normal">—</span>}
                                  </td>
                                  <td className="p-1 text-center font-bold text-amber-800">
                                    {day.p4_ngml || <span className="text-slate-300 font-normal">—</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </A4Sheet>
                  ))
                )}
              </div>
            )}
          </PrintableModal>
        </>
      )}
    </div>
  );
}
