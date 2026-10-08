'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  Printer,
  CalendarDays,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { treatmentCyclesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  HrtFetRowData,
  HrtFetProtocolSheetProps,
  MedModalState,
  HrtFetMedicationModal,
  HrtFetCalendarView,
  HrtFetSetupSection,
  HrtFetProtocolTable,
  handlePrintTable,
  handlePrintCalendar,
} from './hrt-fet';

export type { HrtFetRowData, HrtFetProtocolSheetProps };

export default function HrtFetProtocolSheet({
  cycleId,
  startDate,
  initialDays,
  sentinelDates,
  readonly = false,
  onCalendarSaved,
}: HrtFetProtocolSheetProps) {
  const { currentBranch, user } = useAuth();
  const hospitalName = user?.hospital_name || currentBranch?.receipt_header?.hospital_name || 'VaidyaMD Advanced Hospital';
  const branchSubtitle = [
    currentBranch?.name,
    currentBranch?.address,
    currentBranch?.phone ? `Tel: ${currentBranch.phone}` : '',
    currentBranch?.gstin ? `GSTIN: ${currentBranch.gstin}` : '',
  ].filter(Boolean).join(' • ') || 'Centre for Reproductive Medicine & Advanced IVF';

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
    sentinelDates?.p4_dose || ''
  );
  const [p4Route, setP4Route] = useState<string>(
    sentinelDates?.p4_route || ''
  );
  const [p4Freq, setP4Freq] = useState<string>(
    sentinelDates?.p4_freq || ''
  );

  // Endometrial Assessment Setup
  const [liningThickness, setLiningThickness] = useState<string>(
    sentinelDates?.lining_thickness || ''
  );
  const [liningPattern, setLiningPattern] = useState<string>(
    sentinelDates?.lining_pattern || ''
  );

  // UI States
  const [showSetupDrawer, setShowSetupDrawer] = useState(true);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [showCalendarPrint, setShowCalendarPrint] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Medication Modal State
  const [medModal, setMedModal] = useState<MedModalState | null>(null);

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
        monitoring = 'Baseline TVS • E2/P4';
        notes = 'Baseline TVS: lining < 4mm, ovaries quiescent';
      } else if (!isP0OrAfter) {
        if (cycleDay === 12) {
          phase = 'Endometrial assessment';
          monitoring = 'TVS • E2/P4; assess lining';
          notes = '12 days shown as a common template, not a universal requirement.';
          resultVal = `${liningThickness} (${liningPattern})`;
        } else if (cycleDay === 13) {
          phase = 'Assessment / optimization';
          monitoring = 'Repeat TVS/labs if required';
          notes = 'Lining ≥ 7-8mm trilaminar? Add extra E2 days if needed.';
        }
      } else if (pOffset === 0) {
        phase = 'P0 — Progesterone start';
        medName = 'Estradiol + Progesterone';
        medDose = `${e2Dose} + ${p4Dose}`;
        medRoute = `${e2Route} + ${p4Route}`;
        medFreq = `${e2Freq} / ${p4Freq}`;
        timing = `P0 FIRST DOSE EXACT: ${p0TimeString}`;
        monitoring = 'Serum P4 baseline / documentation';
        notes = 'Critical timing milestone. P0 start date determines transfer date.';
      } else if (pOffset === 1) {
        phase = 'P+1';
        medName = 'Estradiol + Progesterone';
        medDose = `${e2Dose} + ${p4Dose}`;
        medRoute = `${e2Route} + ${p4Route}`;
        medFreq = `${e2Freq} / ${p4Freq}`;
      } else if (pOffset === 2) {
        phase = 'P+2';
        medName = 'Estradiol + Progesterone';
        medDose = `${e2Dose} + ${p4Dose}`;
        medRoute = `${e2Route} + ${p4Route}`;
        medFreq = `${e2Freq} / ${p4Freq}`;
      } else if (pOffset === 3) {
        phase = isDay3 ? 'P+3 — Day 3 ET Day' : 'P+3';
        medName = 'Estradiol + Progesterone';
        medDose = `${e2Dose} + ${p4Dose}`;
        medRoute = `${e2Route} + ${p4Route}`;
        medFreq = `${e2Freq} / ${p4Freq}`;
        if (isDay3) {
          embryoTag = 'Day 3';
          monitoring = 'Embryo Transfer';
          notes = 'Confirm embryo survival, grade, catheter placement';
        }
      } else if (pOffset === 4) {
        phase = 'P+4';
        medName = 'Estradiol + Progesterone';
        medDose = `${e2Dose} + ${p4Dose}`;
        medRoute = `${e2Route} + ${p4Route}`;
        medFreq = `${e2Freq} / ${p4Freq}`;
      } else if (pOffset === 5) {
        phase = !isDay3 ? 'P+5 — Day 5 Blastocyst ET' : 'P+5';
        medName = 'Estradiol + Progesterone';
        medDose = `${e2Dose} + ${p4Dose}`;
        medRoute = `${e2Route} + ${p4Route}`;
        medFreq = `${e2Freq} / ${p4Freq}`;
        if (!isDay3) {
          embryoTag = 'Day 5';
          monitoring = 'Blastocyst Transfer';
          notes = 'Confirm blastocyst expansion, ICM/TE grading, catheter load';
        }
      } else {
        phase = 'Post-transfer luteal support';
        medName = 'Estradiol + Progesterone';
        medDose = `${e2Dose} + ${p4Dose}`;
        medRoute = `${e2Route} + ${p4Route}`;
        medFreq = `${e2Freq} / ${p4Freq}`;
        if (cycleDay === totalDays) {
          phase = 'Pregnancy testing';
          monitoring = 'Serum β-hCG';
          notes = 'Beta-hCG qualitative & quantitative test';
        }
      }

      generated.push({
        cycle_day: cycleDay,
        day_number: cycleDay,
        date: isoDate,
        display_date: displayDate,
        day_of_week: dayOfWeek,
        estrogen_day: estrogenDayVal,
        phase: existing?.phase || phase,
        medication: existing?.medication || medName,
        dose: existing?.dose || medDose,
        unit: existing?.unit || medUnit,
        route: existing?.route || medRoute,
        frequency: existing?.frequency || medFreq,
        timing: existing?.timing || timing,
        monitoring_criteria: existing?.monitoring_criteria || monitoring,
        result_value: existing?.result_value || resultVal,
        embryo_stage: existing?.embryo_stage || embryoTag,
        notes: existing?.notes || notes,
      });
    }

    return generated;
  };

  // Load sentinel dates if provided
  useEffect(() => {
    if (sentinelDates?.lmp_day1) setBleedDate(sentinelDates.lmp_day1);
    else if (startDate) setBleedDate(startDate);

    if (sentinelDates?.planned_estrogen_days) {
      setPlannedEstrogenDays(Number(sentinelDates.planned_estrogen_days));
    }
    if (sentinelDates?.embryo_stage) {
      setEmbryoStage(sentinelDates.embryo_stage === 'Day 3' ? 'Day 3' : 'Day 5');
    }
    if (sentinelDates?.p0_time) setP0Time(sentinelDates.p0_time);
    if (sentinelDates?.e2_dose) setE2Dose(sentinelDates.e2_dose);
    if (sentinelDates?.p4_dose) setP4Dose(sentinelDates.p4_dose);
    if (sentinelDates?.lining_thickness) setLiningThickness(sentinelDates.lining_thickness);
    if (sentinelDates?.lining_pattern) setLiningPattern(sentinelDates.lining_pattern);
  }, [sentinelDates, startDate, cycleId]);

  // Initial Load & Schedule Generation
  useEffect(() => {
    if (initialDays && Array.isArray(initialDays) && initialDays.length > 0 && (initialDays[0]?.phase || initialDays[0]?.estrogen_day !== undefined)) {
      setRows(initialDays);
    } else {
      const targetBleed = sentinelDates?.lmp_day1 || startDate || bleedDate;
      const targetEstrogen = sentinelDates?.planned_estrogen_days ? Number(sentinelDates.planned_estrogen_days) : plannedEstrogenDays;
      const targetStage = sentinelDates?.embryo_stage === 'Day 3' ? 'Day 3' : embryoStage;
      const targetP0 = sentinelDates?.p0_time || p0Time;
      const generated = buildScheduleFromTemplate(targetBleed, targetEstrogen, targetStage, targetP0);
      setRows(generated);
    }
  }, [startDate, initialDays, sentinelDates, cycleId]);

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

  // Open medication modal for a row
  const openMedModal = (row: HrtFetRowData) => {
    if (readonly) return;
    setMedModal({
      open: true,
      cycleDay: row.cycle_day,
      medication: row.medication,
      dose: row.dose,
      unit: row.unit,
      route: row.route,
      frequency: row.frequency,
      timing: row.timing,
      applyFromDay: row.cycle_day,
      applyToDay: row.cycle_day,
    });
  };

  // Apply medication modal changes to selected day range
  const applyMedModal = () => {
    if (!medModal) return;
    const { medication, dose, unit, route, frequency, timing, applyFromDay, applyToDay } = medModal;
    setRows((prev) =>
      prev.map((r) => {
        if (r.cycle_day >= applyFromDay && r.cycle_day <= applyToDay) {
          return { ...r, medication, dose, unit, route, frequency, timing };
        }
        return r;
      })
    );
    setMedModal(null);
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

  // Delete Day
  const handleDeleteDay = (cycleDay: number) => {
    if (readonly) return;
    setRows((prev) => prev.filter((r) => r.cycle_day !== cycleDay));
  };

  // Save Protocol to Backend
  const handleSaveProtocol = async () => {
    setIsSaving(true);
    try {
      if (cycleId) {
        const rowsWithMilestones = rows.map((r) => {
          let m = r.phase;
          if (r.embryo_stage && r.embryo_stage !== '') m = `${r.embryo_stage} Transfer 🌸`;
          else if (r.phase?.includes('P0')) m = 'P0 (Progesterone Start)';
          else if (r.cycle_day === 1) m = 'Day 1 (HRT Start)';
          else if (r.cycle_day === 12) m = 'D12 Endometrial Scan';
          else if (r.cycle_day === 13) m = 'Triple-Line Optimization Scan';
          else if (r.cycle_day === rows.length) m = 'Beta-hCG Pregnancy Test 🎯';
          return {
            ...r,
            milestone: m,
            medications: [
              {
                drug_name: r.medication,
                dose: r.dose,
                route: r.route,
                frequency: r.frequency,
                instructions: r.timing,
              },
            ],
          };
        });
        await treatmentCyclesApi.updateMedicationCalendar(cycleId, rowsWithMilestones);
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

  return (
    <div className="space-y-4">
      {/* ── Medication Popup Modal ─────────────────────────── */}
      {medModal && (
        <HrtFetMedicationModal
          medModal={medModal}
          setMedModal={setMedModal}
          rows={rows}
          plannedEstrogenDays={plannedEstrogenDays}
          onApply={applyMedModal}
        />
      )}

      {/* ── Weekly Calendar Print View ──────────────────────── */}
      {showCalendarPrint && (
        <HrtFetCalendarView
          rows={rows}
          hospitalName={hospitalName}
          branchSubtitle={branchSubtitle}
          onClose={() => setShowCalendarPrint(false)}
          onPrint={() => window.print()}
        />
      )}

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
            onClick={() => handlePrintTable(rows, hospitalName, branchSubtitle)}
            className="px-3 py-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Print Clinical Protocol Table in a clean print window"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Table</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrintCalendar(rows, hospitalName, branchSubtitle)}
            className="px-3 py-1.5 rounded-lg bg-amber-400/80 text-slate-900 hover:bg-amber-400 border border-amber-300/40 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Open Weekly Calendar in a clean print window"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Calendar Print</span>
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

      <HrtFetSetupSection
        showSetupDrawer={showSetupDrawer}
        setShowSetupDrawer={setShowSetupDrawer}
        showNotesDrawer={showNotesDrawer}
        setShowNotesDrawer={setShowNotesDrawer}
        embryoStage={embryoStage}
        setEmbryoStage={setEmbryoStage}
        bleedDate={bleedDate}
        setBleedDate={setBleedDate}
        plannedEstrogenDays={plannedEstrogenDays}
        setPlannedEstrogenDays={setPlannedEstrogenDays}
        p0Time={p0Time}
        setP0Time={setP0Time}
        calculatedDates={calculatedDates}
        e2Dose={e2Dose}
        setE2Dose={setE2Dose}
        e2Route={e2Route}
        setE2Route={setE2Route}
        e2Freq={e2Freq}
        setE2Freq={setE2Freq}
        p4Dose={p4Dose}
        setP4Dose={setP4Dose}
        p4Route={p4Route}
        setP4Route={setP4Route}
        p4Freq={p4Freq}
        setP4Freq={setP4Freq}
        liningThickness={liningThickness}
        setLiningThickness={setLiningThickness}
        liningPattern={liningPattern}
        setLiningPattern={setLiningPattern}
        readonly={readonly}
        handleApplySetup={handleApplySetup}
      />

      <HrtFetProtocolTable
        rows={rows}
        readonly={readonly}
        embryoStage={embryoStage}
        bleedDate={bleedDate}
        calculatedDates={calculatedDates}
        p0Time={p0Time}
        handleCellChange={handleCellChange}
        openMedModal={openMedModal}
        handleAddDay={handleAddDay}
        handleDeleteDay={handleDeleteDay}
        handlePropagateDose={handlePropagateDose}
      />
    </div>
  );
}
