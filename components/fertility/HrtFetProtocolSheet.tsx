'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Save,
  Printer,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Pill,
  Sparkles,
  Clock,
  Heart,
  ChevronDown,
  ChevronUp,
  Info,
  RotateCcw,
  Sliders,
  CheckCircle2,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react';
import { treatmentCyclesApi } from '@/lib/api';

export interface HrtFetRowData {
  cycle_day: number;
  day_number?: number;
  date: string;
  display_date: string;
  day_of_week: string;
  estrogen_day: number | null;
  phase: string;
  medication: string;
  dose: string;
  unit: string;
  route: string;
  frequency: string;
  timing: string;
  monitoring_criteria: string;
  result_value: string;
  embryo_stage: string;
  notes: string;
}

export interface HrtFetProtocolSheetProps {
  cycleId?: string;
  startDate?: string;
  initialDays?: any[];
  sentinelDates?: Record<string, any>;
  readonly?: boolean;
  onCalendarSaved?: (days: any[]) => void;
}

export default function HrtFetProtocolSheet({
  cycleId,
  startDate,
  initialDays,
  sentinelDates,
  readonly = false,
  onCalendarSaved,
}: HrtFetProtocolSheetProps) {
  // Setup Parameters (Sheet 2: Setup)
  const [bleedDate, setBleedDate] = useState<string>(
    sentinelDates?.lmp_day1 || startDate || new Date().toISOString().split('T')[0]
  );
  const [plannedEstrogenDays, setPlannedEstrogenDays] = useState<number>(
    sentinelDates?.planned_estrogen_days ? Number(sentinelDates.planned_estrogen_days) : 13
  );
  const [embryoStage, setEmbryoStage] = useState<'Day 3' | 'Day 5'>(
    sentinelDates?.embryo_stage === 'Day 3' ? 'Day 3' : 'Day 5'
  );
  const [p0Time, setP0Time] = useState<string>(
    sentinelDates?.p0_time || '08:00 AM'
  );
  const [e2Dose, setE2Dose] = useState<string>(
    sentinelDates?.e2_dose || '2 mg'
  );
  const [e2Route, setE2Route] = useState<string>(
    sentinelDates?.e2_route || 'Oral'
  );
  const [e2Freq, setE2Freq] = useState<string>(
    sentinelDates?.e2_freq || 'TDS'
  );
  const [p4Dose, setP4Dose] = useState<string>(
    sentinelDates?.p4_dose || '400 mg PV BD + 100 mg IM OD'
  );
  const [p4Route, setP4Route] = useState<string>(
    sentinelDates?.p4_route || 'Vaginal / IM'
  );
  const [p4Freq, setP4Freq] = useState<string>(
    sentinelDates?.p4_freq || 'BD / OD'
  );

  // Endometrial Assessment Setup
  const [liningThickness, setLiningThickness] = useState<string>(
    sentinelDates?.lining_thickness || '8.5 mm'
  );
  const [liningPattern, setLiningPattern] = useState<string>(
    sentinelDates?.lining_pattern || 'Trilaminar'
  );

  // UI States
  const [showSetupDrawer, setShowSetupDrawer] = useState(true);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Main Protocol Table Rows (Sheet 1: HRT FET Protocol)
  const [rows, setRows] = useState<HrtFetRowData[]>([]);

  // Calculate Key Dates
  const calculatedDates = useMemo(() => {
    const base = new Date(bleedDate);
    if (isNaN(base.getTime())) return null;

    const addDays = (d: Date, days: number) => {
      const res = new Date(d);
      res.setDate(res.getDate() + days);
      return res;
    };

    const d12Assessment = addDays(base, 11); // Day 12
    const p0Date = addDays(base, plannedEstrogenDays); // Day 14 (if 13 days prep)
    const transferDate = addDays(p0Date, embryoStage === 'Day 3' ? 3 : 5);
    const betaHcgDate = addDays(base, 22); // Day 23

    return {
      bleedDate: base.toISOString().split('T')[0],
      d12Assessment: d12Assessment.toISOString().split('T')[0],
      p0Date: p0Date.toISOString().split('T')[0],
      transferDate: transferDate.toISOString().split('T')[0],
      betaHcgDate: betaHcgDate.toISOString().split('T')[0],
    };
  }, [bleedDate, plannedEstrogenDays, embryoStage]);

  // Generate Default 23-Day Schedule from Template
  const buildScheduleFromTemplate = (
    baseDateStr: string,
    estrogenDays: number,
    stage: 'Day 3' | 'Day 5',
    p0TimeString: string,
    existingRows?: any[]
  ): HrtFetRowData[] => {
    const base = new Date(baseDateStr);
    const totalDays = 23;
    const generated: HrtFetRowData[] = [];
    const isDay3 = stage === 'Day 3';

    for (let cycleDay = 1; cycleDay <= totalDays; cycleDay++) {
      const cur = new Date(base);
      cur.setDate(cur.getDate() + (cycleDay - 1));
      const isoDate = cur.toISOString().split('T')[0];
      const displayDate = cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const dayOfWeek = cur.toLocaleDateString('en-US', { weekday: 'short' });

      const pOffset = cycleDay - (estrogenDays + 1);
      const isP0OrAfter = pOffset >= 0;
      const estrogenDayVal = !isP0OrAfter || pOffset === 0 ? cycleDay : null;

      // Existing row match
      const existing = existingRows?.find(
        (x) => x.cycle_day === cycleDay || x.day_number === cycleDay
      );

      let phase = 'Endometrial preparation';
      let medName = 'Estradiol';
      let medDose = e2Dose;
      let medUnit = 'mg';
      let medRoute = e2Route;
      let medFreq = e2Freq;
      let timing = 'As prescribed';
      let monitoring = '';
      let resultVal = '';
      let embryoTag = '';
      let notes = '';

      if (cycleDay === 1) {
        phase = 'HRT start';
        medName = 'Estradiol';
        timing = '08:00 / 14:00 / 20:00';
        monitoring = 'Baseline TVS ± E2/P4';
        notes = 'Baseline TVS: lining < 4mm, ovaries quiescent';
      } else if (!isP0OrAfter) {
        if (cycleDay === 12) {
          phase = 'Endometrial assessment';
          monitoring = 'TVS ± E2/P4; assess lining';
          notes = '12 days shown as a common template, not a universal requirement.';
          resultVal = `${liningThickness} (${liningPattern})`;
        } else if (cycleDay === 13) {
          phase = 'Assessment / optimization';
          monitoring = 'Repeat TVS/labs if required';
          notes = 'Confirm triple-line pattern ≥ 7-8mm and serum P4 < 1.0 ng/mL';
        }
      } else {
        medName = 'Estradiol + Progesterone';
        medDose = `${e2Dose} + ${p4Dose}`;
        medRoute = `${e2Route} + ${p4Route}`;
        medFreq = `${e2Freq} / ${p4Freq}`;

        if (pOffset === 0) {
          phase = 'P0 — Progesterone start';
          timing = `P0 Start strictly at ${p0TimeString}`;
          monitoring = 'Endometrium acceptable / clinic criteria met';
          notes = `P0 exact date/time (${p0TimeString}) is the key timing anchor for programmed HRT-FET.`;
        } else if (pOffset === 1) {
          phase = 'P+1';
        } else if (pOffset === 2) {
          phase = 'P+2';
        } else if (pOffset === 3) {
          phase = 'P+3';
          if (isDay3) {
            timing = 'Transfer procedure';
            monitoring = 'Embryo Transfer procedure';
            embryoTag = 'Day-3';
            notes = 'Transfer scheduled at ~72 hours of validated progesterone exposure.';
          } else {
            embryoTag = 'Day-3';
            notes = "Use your clinic's validated progesterone-exposure schedule.";
          }
        } else if (pOffset === 4) {
          phase = 'P+4';
        } else if (pOffset === 5) {
          phase = 'P+5';
          if (!isDay3) {
            timing = 'Transfer procedure';
            monitoring = 'Embryo Transfer procedure';
            embryoTag = 'Day-5 blastocyst';
            notes = 'Transfer scheduled at ~120 hours of validated progesterone exposure.';
          } else {
            embryoTag = 'Day-5 blastocyst';
            notes = "Use your clinic's validated progesterone-exposure schedule.";
          }
        } else if (cycleDay === totalDays) {
          phase = 'Pregnancy testing';
          timing = 'Morning fasting serum sample';
          monitoring = 'Serum β-hCG on clinic-defined date';
          notes = 'Check serum β-hCG to confirm gestational viability; maintain luteal support';
        } else {
          phase = 'Post-transfer';
          notes = 'Continue prescribed Estradiol and Progesterone luteal support';
        }
      }

      generated.push({
        cycle_day: cycleDay,
        day_number: cycleDay,
        date: existing?.date || isoDate,
        display_date: existing?.display_date || displayDate,
        day_of_week: existing?.day_of_week || dayOfWeek,
        estrogen_day: existing?.estrogen_day !== undefined ? existing.estrogen_day : estrogenDayVal,
        phase: existing?.phase || phase,
        medication: existing?.medication || medName,
        dose: existing?.dose || medDose,
        unit: existing?.unit || medUnit,
        route: existing?.route || medRoute,
        frequency: existing?.frequency || medFreq,
        timing: existing?.timing || timing,
        monitoring_criteria: existing?.monitoring_criteria || monitoring,
        result_value: existing?.result_value || resultVal,
        embryo_stage: existing?.embryo_stage !== undefined ? existing.embryo_stage : embryoTag,
        notes: existing?.notes || notes,
      });
    }

    return generated;
  };

  // Initial Load
  useEffect(() => {
    if (initialDays && Array.isArray(initialDays) && initialDays.length > 0 && initialDays[0]?.phase) {
      setRows(initialDays);
    } else {
      const generated = buildScheduleFromTemplate(bleedDate, plannedEstrogenDays, embryoStage, p0Time);
      setRows(generated);
    }
  }, [startDate]);

  // Handle cell edit
  const handleCellChange = (cycleDay: number, field: keyof HrtFetRowData, value: any) => {
    if (readonly) return;
    setRows((prev) =>
      prev.map((row) => {
        if (row.cycle_day === cycleDay) {
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  // Re-apply Template with updated setup parameters
  const handleApplySetup = () => {
    const updated = buildScheduleFromTemplate(bleedDate, plannedEstrogenDays, embryoStage, p0Time);
    setRows(updated);
    setSaveMessage('Protocol recalculated from Setup parameters!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Propagate / Fill Forward
  const handlePropagateDose = (fromDay: number, count: number = 5) => {
    if (readonly) return;
    const source = rows.find((r) => r.cycle_day === fromDay);
    if (!source) return;

    setRows((prev) =>
      prev.map((r) => {
        if (r.cycle_day > fromDay && r.cycle_day <= fromDay + count) {
          return {
            ...r,
            dose: source.dose,
            route: source.route,
            frequency: source.frequency,
            timing: source.timing,
          };
        }
        return r;
      })
    );
  };

  // Add Day / Extend
  const handleAddDay = () => {
    if (readonly) return;
    const lastDay = rows[rows.length - 1];
    const nextCycleDay = (lastDay?.cycle_day || 0) + 1;
    const base = new Date(lastDay?.date || bleedDate);
    base.setDate(base.getDate() + 1);

    const newRow: HrtFetRowData = {
      cycle_day: nextCycleDay,
      day_number: nextCycleDay,
      date: base.toISOString().split('T')[0],
      display_date: base.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      day_of_week: base.toLocaleDateString('en-US', { weekday: 'short' }),
      estrogen_day: null,
      phase: 'Post-transfer support',
      medication: 'Estradiol + Progesterone',
      dose: `${e2Dose} + ${p4Dose}`,
      unit: 'mg',
      route: `${e2Route} + ${p4Route}`,
      frequency: `${e2Freq} / ${p4Freq}`,
      timing: 'As prescribed',
      monitoring_criteria: '',
      result_value: '',
      embryo_stage: '',
      notes: 'Continued luteal phase support',
    };

    setRows([...rows, newRow]);
  };

  // Save Protocol to Backend
  const handleSaveProtocol = async () => {
    setIsSaving(true);
    try {
      if (cycleId) {
        // Save rows into medication_calendar and sentinel_dates
        await treatmentCyclesApi.updateMedicationCalendar(cycleId, rows);
        await treatmentCyclesApi.updateSentinelDates(cycleId, {
          sentinel_dates: {
            ...(sentinelDates || {}),
            lmp_day1: bleedDate,
            planned_estrogen_days: plannedEstrogenDays,
            embryo_stage: embryoStage,
            p0_date: calculatedDates?.p0Date,
            p0_time: p0Time,
            et: calculatedDates?.transferDate,
            beta_hcg_date: calculatedDates?.betaHcgDate,
            lining_thickness: liningThickness,
            lining_pattern: liningPattern,
            e2_dose: e2Dose,
            p4_dose: p4Dose,
            protocol_category: 'fet',
            is_hrt_fet: true,
          },
        });
      }
      onCalendarSaved?.(rows);
      setSaveMessage('HRT FET Protocol saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save HRT FET protocol');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for phase pill badge styling
  const getPhaseBadge = (phase: string, embryoStageTag?: string) => {
    if (phase.includes('HRT start')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (phase.includes('Endometrial assessment')) {
      return 'bg-cyan-100 text-cyan-800 border-cyan-300 font-bold';
    }
    if (phase.includes('P0 — Progesterone start')) {
      return 'bg-amber-100 text-amber-900 border-amber-400 font-bold ring-1 ring-amber-300';
    }
    if (phase.includes('P+3') || phase.includes('P+5')) {
      const isTargetTransfer =
        (phase.includes('P+3') && embryoStage === 'Day 3') ||
        (phase.includes('P+5') && embryoStage === 'Day 5');
      return isTargetTransfer
        ? 'bg-rose-100 text-rose-900 border-rose-400 font-bold ring-2 ring-rose-400'
        : 'bg-purple-100 text-purple-800 border-purple-300';
    }
    if (phase.includes('Pregnancy testing')) {
      return 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 font-bold';
    }
    if (phase.includes('Post-transfer')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#2F6F8F] text-white rounded-xl p-4 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">
                HRT FET Protocol — Day 3 / Day 5 Blastocyst
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                Excel Clinical Standard
              </span>
            </div>
            <p className="text-xs text-teal-100">
              Programmed artificial endometrial priming with Estradiol &amp; strict P0 Progesterone timing anchor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSetupDrawer(!showSetupDrawer)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showSetupDrawer
                ? 'bg-white text-[#2F6F8F] shadow-xs'
                : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Cycle Setup ({embryoStage})</span>
            {showSetupDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showNotesDrawer
                ? 'bg-amber-400 text-slate-900 shadow-xs'
                : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Timing Notes</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Print Clinical Protocol"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {!readonly && (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveProtocol}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Protocol'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Save Toast */}
      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* SETUP CARD (Reflecting Sheet 2: Setup from Excel) */}
      {showSetupDrawer && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs print:hidden">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#2F6F8F]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Cycle Setup Parameters &amp; Scheduling Anchors
              </h3>
            </div>

            {/* Embryo Stage Selector (Pills) */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 px-2">Embryo Stage:</span>
              <button
                type="button"
                onClick={() => setEmbryoStage('Day 3')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  embryoStage === 'Day 3'
                    ? 'bg-[#2F6F8F] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Day 3 (Cleavage)
              </button>
              <button
                type="button"
                onClick={() => setEmbryoStage('Day 5')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  embryoStage === 'Day 5'
                    ? 'bg-[#2F6F8F] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Day 5 (Blastocyst)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Bleed Date / LMP */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Cycle Day 1 / Bleed Date
              </label>
              <input
                type="date"
                value={bleedDate}
                onChange={(e) => setBleedDate(e.target.value)}
                className="vmd-input text-xs w-full font-semibold text-slate-800"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Baseline TVS ± E2/P4 anchor</span>
            </div>

            {/* Planned Estrogen Exposure */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Planned Estrogen Exposure
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={10}
                  max={24}
                  value={plannedEstrogenDays}
                  onChange={(e) => setPlannedEstrogenDays(Number(e.target.value) || 13)}
                  className="vmd-input text-xs w-20 font-semibold text-slate-800"
                />
                <span className="text-xs text-slate-500 font-medium">Days (P0 on Day {plannedEstrogenDays + 1})</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Template default: 12-14 days</span>
            </div>

            {/* Progesterone Start (P0) Date & Exact Time */}
            <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
              <label className="flex items-center justify-between text-[11px] font-bold text-amber-900 mb-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  Progesterone Start (P0) Time
                </span>
                <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-extrabold uppercase">
                  Anchor
                </span>
              </label>
              <input
                type="text"
                value={p0Time}
                onChange={(e) => setP0Time(e.target.value)}
                placeholder="e.g. 08:00 AM"
                className="vmd-input text-xs w-full font-bold text-amber-950 bg-white"
              />
              <span className="text-[10px] text-amber-800/80 mt-1 block">
                Scheduled on: <strong>{calculatedDates?.p0Date || 'Day 14'}</strong>
              </span>
            </div>

            {/* Transfer Date (Auto-calculated) */}
            <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-200">
              <label className="flex items-center gap-1 text-[11px] font-bold text-rose-900 mb-1">
                <Heart className="w-3.5 h-3.5 text-rose-600" />
                Transfer Date ({embryoStage})
              </label>
              <div className="text-sm font-extrabold text-rose-950 bg-white px-2.5 py-1.5 rounded-md border border-rose-200">
                {calculatedDates?.transferDate || 'Calculating...'}
              </div>
              <span className="text-[10px] text-rose-800/80 mt-1 block">
                {embryoStage === 'Day 3' ? 'P+3 (~72h exposure)' : 'P+5 (~120h exposure)'}
              </span>
            </div>
          </div>

          {/* Secondary Parameters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                  Estradiol Formulation &amp; Regimen
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={e2Dose}
                    onChange={(e) => setE2Dose(e.target.value)}
                    placeholder="Dose (e.g. 2 mg)"
                    className="vmd-input text-xs flex-1"
                  />
                  <input
                    type="text"
                    value={e2Freq}
                    onChange={(e) => setE2Freq(e.target.value)}
                    placeholder="Freq (e.g. TDS)"
                    className="vmd-input text-xs w-20"
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Progynova / Estrogen Valerate (Oral)</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                  Progesterone Regimen (P0 onwards)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={p4Dose}
                    onChange={(e) => setP4Dose(e.target.value)}
                    placeholder="e.g. 400 mg PV BD + 100 mg IM"
                    className="vmd-input text-xs flex-1"
                  />
                  <input
                    type="text"
                    value={p4Freq}
                    onChange={(e) => setP4Freq(e.target.value)}
                    placeholder="Freq"
                    className="vmd-input text-xs w-24"
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Micronized Progesterone (Susten/Gestone)</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-slate-600 block">Serum β-hCG Test Date</span>
                <strong className="text-xs text-indigo-900 block">
                  {calculatedDates?.betaHcgDate || 'Day 23'}
                </strong>
                <span className="text-[10px] text-slate-400">Day 23 / 10-14 days post-ET</span>
              </div>
              <button
                type="button"
                onClick={handleApplySetup}
                className="px-3 py-2 bg-[#2F6F8F] hover:bg-[#255670] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Apply Setup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIMING NOTES (Reflecting Sheet 3: Timing Notes from Excel) */}
      {showNotesDrawer && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-3 print:hidden">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
            <h4 className="font-bold flex items-center gap-2 text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Timing Notes &amp; Clinical Guidance (from Excel Template)</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowNotesDrawer(false)}
              className="text-amber-700 hover:text-amber-900"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/80 p-3 rounded-lg border border-amber-200">
              <strong className="text-amber-900 block mb-1">1. Estrogen Duration:</strong>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                12 days is a common programmed-HRT template, but it is not a mandatory universal minimum. Start progesterone when endometrial readiness and clinic criteria are met.
              </p>
            </div>
            <div className="bg-white/80 p-3 rounded-lg border border-amber-200">
              <strong className="text-amber-900 block mb-1">2. P0 Timing Anchor:</strong>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Record the exact progesterone start date and time; this is the principal scheduling anchor for opening the implantation window.
              </p>
            </div>
            <div className="bg-white/80 p-3 rounded-lg border border-amber-200">
              <strong className="text-amber-900 block mb-1">3. Day-3 vs Day-5 Embryo:</strong>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Planning row is <strong>P+3</strong> (~72h) for Day-3 cleavage embryos, and <strong>P+5</strong> (~120h) for Day-5 blastocysts. Use your clinic's validated progesterone-exposure schedule.
              </p>
            </div>
            <div className="bg-white/80 p-3 rounded-lg border border-amber-200">
              <strong className="text-amber-900 block mb-1">4. Clinical Safety:</strong>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                This is a documentation/planning template. Clinician should set and verify medication doses, endometrial criteria, progesterone regimen and transfer timing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Printable Sheet Header (Prints Only) */}
      <div className="hidden print:block mb-4 text-center border-b pb-2">
        <h1 className="text-xl font-bold text-slate-900">VaidyaMD Fertility — HRT FET Protocol Timetable</h1>
        <p className="text-xs text-slate-600">
          Programmed Hormone Replacement Frozen Embryo Transfer ({embryoStage}) • Bleed Date: {bleedDate} • P0: {calculatedDates?.p0Date} @ {p0Time}
        </p>
      </div>

      {/* MAIN PROTOCOL TABLE (Sheet 1: HRT FET Protocol) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[72vh] custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header Styled with #2F6F8F from Excel */}
            <thead className="sticky top-0 bg-[#2F6F8F] text-white z-20 shadow-xs select-none">
              <tr>
                <th className="py-2.5 px-3 font-bold text-center border-r border-teal-600/50 w-12 sticky left-0 bg-[#2F6F8F] z-30">
                  Day
                </th>
                <th className="py-2.5 px-3 font-bold border-r border-teal-600/50 min-w-[125px]">
                  Date
                </th>
                <th className="py-2.5 px-2.5 font-bold text-center border-r border-teal-600/50 w-16">
                  E-Day
                </th>
                <th className="py-2.5 px-3 font-bold border-r border-teal-600/50 min-w-[170px]">
                  Clinical Phase
                </th>
                <th className="py-2.5 px-3 font-bold border-r border-teal-600/50 min-w-[190px]">
                  Medication / Intervention
                </th>
                <th className="py-2.5 px-2.5 font-bold border-r border-teal-600/50 min-w-[120px]">
                  Dose
                </th>
                <th className="py-2.5 px-2 font-bold border-r border-teal-600/50 w-14 text-center">
                  Unit
                </th>
                <th className="py-2.5 px-2.5 font-bold border-r border-teal-600/50 min-w-[90px]">
                  Route
                </th>
                <th className="py-2.5 px-2.5 font-bold border-r border-teal-600/50 min-w-[90px]">
                  Frequency
                </th>
                <th className="py-2.5 px-3 font-bold border-r border-teal-600/50 min-w-[140px]">
                  Timing
                </th>
                <th className="py-2.5 px-3 font-bold border-r border-teal-600/50 min-w-[180px]">
                  Monitoring / Criteria
                </th>
                <th className="py-2.5 px-3 font-bold border-r border-teal-600/50 min-w-[140px]">
                  Result / Value
                </th>
                <th className="py-2.5 px-3 font-bold border-r border-teal-600/50 min-w-[130px] text-center">
                  Embryo Stage
                </th>
                <th className="py-2.5 px-3 font-bold min-w-[200px]">
                  Notes
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {rows.map((row) => {
                const isTargetTransferDay =
                  (row.phase.includes('P+3') && embryoStage === 'Day 3') ||
                  (row.phase.includes('P+5') && embryoStage === 'Day 5');
                const isP0Row = row.phase.includes('P0 — Progesterone start');
                const isD12Scan = row.cycle_day === 12;

                return (
                  <tr
                    key={row.cycle_day}
                    className={`transition-colors ${
                      isTargetTransferDay
                        ? 'bg-rose-50/70 hover:bg-rose-100/60 font-medium'
                        : isP0Row
                        ? 'bg-amber-50/60 hover:bg-amber-100/50'
                        : isD12Scan
                        ? 'bg-cyan-50/50 hover:bg-cyan-100/40'
                        : row.cycle_day % 2 === 0
                        ? 'bg-slate-50/40 hover:bg-slate-100/60'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Cycle Day */}
                    <td className="py-2 px-2.5 text-center font-extrabold text-slate-800 border-r border-slate-200 sticky left-0 bg-inherit z-10">
                      {row.cycle_day}
                    </td>

                    {/* Date */}
                    <td className="py-2 px-3 border-r border-slate-200">
                      <div className="font-semibold text-slate-800 text-[11px] whitespace-nowrap">
                        {row.display_date}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-tight">
                        {row.day_of_week}
                      </div>
                    </td>

                    {/* Estrogen Day */}
                    <td className="py-2 px-2 text-center border-r border-slate-200 font-bold">
                      {row.estrogen_day ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-teal-100 text-teal-800">
                          E{row.estrogen_day}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Phase Badge */}
                    <td className="py-2 px-3 border-r border-slate-200">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] border tracking-tight ${getPhaseBadge(
                          row.phase,
                          row.embryo_stage
                        )}`}
                      >
                        {isTargetTransferDay && <Heart className="w-3 h-3 text-rose-600 fill-rose-600" />}
                        {isP0Row && <Clock className="w-3 h-3 text-amber-700" />}
                        <span>{row.phase}</span>
                      </span>
                    </td>

                    {/* Medication / Intervention */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      {readonly ? (
                        <span className="font-semibold text-slate-800">{row.medication}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.medication}
                          onChange={(e) => handleCellChange(row.cycle_day, 'medication', e.target.value)}
                          className="w-full text-xs font-semibold text-slate-800 bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-1.5 py-1 hover:bg-white"
                        />
                      )}
                    </td>

                    {/* Dose */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      {readonly ? (
                        <span className="text-slate-700">{row.dose}</span>
                      ) : (
                        <div className="flex items-center gap-1 group">
                          <input
                            type="text"
                            value={row.dose}
                            onChange={(e) => handleCellChange(row.cycle_day, 'dose', e.target.value)}
                            className="w-full text-xs text-slate-700 bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-1.5 py-1 hover:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handlePropagateDose(row.cycle_day, 4)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-teal-700 p-0.5"
                            title="Fill next 4 days"
                          >
                            ↓
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Unit */}
                    <td className="py-1.5 px-1 border-r border-slate-200 text-center">
                      {readonly ? (
                        <span className="text-slate-500 text-[11px]">{row.unit}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.unit}
                          onChange={(e) => handleCellChange(row.cycle_day, 'unit', e.target.value)}
                          className="w-12 text-center text-xs text-slate-500 bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-0.5 py-1 hover:bg-white"
                        />
                      )}
                    </td>

                    {/* Route */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      {readonly ? (
                        <span className="text-slate-600 text-[11px]">{row.route}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.route}
                          onChange={(e) => handleCellChange(row.cycle_day, 'route', e.target.value)}
                          className="w-full text-xs text-slate-600 bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-1.5 py-1 hover:bg-white"
                        />
                      )}
                    </td>

                    {/* Frequency */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      {readonly ? (
                        <span className="text-slate-600 text-[11px]">{row.frequency}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.frequency}
                          onChange={(e) => handleCellChange(row.cycle_day, 'frequency', e.target.value)}
                          className="w-full text-xs text-slate-600 bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-1.5 py-1 hover:bg-white"
                        />
                      )}
                    </td>

                    {/* Timing */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      {readonly ? (
                        <span className="text-slate-600 text-[11px]">{row.timing}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.timing}
                          onChange={(e) => handleCellChange(row.cycle_day, 'timing', e.target.value)}
                          className="w-full text-xs text-slate-600 bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-1.5 py-1 hover:bg-white"
                        />
                      )}
                    </td>

                    {/* Monitoring / Criteria */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      {readonly ? (
                        <span className="text-slate-800 text-[11px] font-medium">{row.monitoring_criteria}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.monitoring_criteria}
                          placeholder="e.g. TVS / P4 check"
                          onChange={(e) => handleCellChange(row.cycle_day, 'monitoring_criteria', e.target.value)}
                          className="w-full text-xs text-slate-800 font-medium bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-1.5 py-1 hover:bg-white"
                        />
                      )}
                    </td>

                    {/* Result / Value */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      {readonly ? (
                        <span className="text-slate-700 text-[11px] font-semibold">{row.result_value}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.result_value}
                          placeholder="e.g. 8.5mm Trilaminar"
                          onChange={(e) => handleCellChange(row.cycle_day, 'result_value', e.target.value)}
                          className="w-full text-xs text-slate-700 font-semibold bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-1.5 py-1 hover:bg-white"
                        />
                      )}
                    </td>

                    {/* Embryo Stage */}
                    <td className="py-2 px-2 text-center border-r border-slate-200">
                      {row.embryo_stage ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-tight ${
                            isTargetTransferDay
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-purple-100 text-purple-900 border border-purple-300'
                          }`}
                        >
                          {row.embryo_stage}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-1.5 px-2">
                      {readonly ? (
                        <span className="text-slate-500 text-[11px] line-clamp-2">{row.notes}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.notes}
                          placeholder="Clinical observation notes"
                          onChange={(e) => handleCellChange(row.cycle_day, 'notes', e.target.value)}
                          className="w-full text-xs text-slate-500 bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-1.5 py-1 hover:bg-white"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        {!readonly && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 print:hidden">
            <button
              type="button"
              onClick={handleAddDay}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Extend / Add Day {rows.length + 1}</span>
            </button>

            <div className="text-[11px] text-slate-500">
              Total Days: <strong>{rows.length}</strong> • Active Stage: <strong>{embryoStage}</strong> • P0 Anchor:{' '}
              <strong>{calculatedDates?.p0Date || 'Day 14'} @ {p0Time}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
