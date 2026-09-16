'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { treatmentCyclesApi } from '@/lib/api';

export interface DayData {
  day_number: number;
  date: string;
  display_date: string;
  day_of_week: string;
  milestone?: string;
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

import HrtFetProtocolSheet from '@/components/fertility/HrtFetProtocolSheet';

export interface StimulationCalendarGridProps {
  cycleId?: string;
  startDate?: string;
  initialDays?: any[];
  readonly?: boolean;
  onCalendarSaved?: (days: any[]) => void;
  treatmentType?: string;
  protocolCategory?: string;
  sentinelDates?: Record<string, any>;
}

const DEFAULT_DRUGS = [
  { name: 'Rec-FSH (Gonal-F / Puregon)', defaultDose: '225 IU', route: 'SC', frequency: 'OD Evening' },
  { name: 'HMG (Menopur)', defaultDose: '75 IU', route: 'IM', frequency: 'OD Morning' },
  { name: 'GnRH Antagonist (Cetrotide 0.25mg)', defaultDose: '0.25 mg', route: 'SC', frequency: 'OD Morning' },
  { name: 'Ovulation Trigger (Ovitrelle 250mcg)', defaultDose: '250 mcg', route: 'SC', frequency: 'Stat Night' },
  { name: 'Micronized Progesterone (Susten 400mg)', defaultDose: '400 mg', route: 'PV', frequency: 'BD' },
  { name: 'Oral Estradiol Valerate (Progynova 2mg)', defaultDose: '2 mg', route: 'PO', frequency: 'TDS' },
];

export default function StimulationCalendarGrid({
  cycleId,
  startDate,
  initialDays,
  readonly = false,
  onCalendarSaved,
  treatmentType,
  protocolCategory,
  sentinelDates,
}: StimulationCalendarGridProps) {
  const isFetDefault = Boolean(
    treatmentType?.includes('FET') ||
    protocolCategory === 'fet' ||
    sentinelDates?.is_hrt_fet ||
    (initialDays && initialDays.length > 0 && initialDays[0]?.phase)
  );
  const [protocolMode, setProtocolMode] = useState<'stimulation' | 'hrt_fet'>(
    isFetDefault ? 'hrt_fet' : 'stimulation'
  );

  const [totalDays, setTotalDays] = useState(14);
  const [drugList, setDrugList] = useState<string[]>(DEFAULT_DRUGS.map((d) => d.name));
  const [newDrugName, setNewDrugName] = useState('');
  const [showAddDrug, setShowAddDrug] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Initialize or transform days data
  const [days, setDays] = useState<DayData[]>([]);

  useEffect(() => {
    const baseDate = startDate ? new Date(startDate) : new Date();
    const count = Math.max(14, initialDays?.length || 14);
    setTotalDays(count);

    const generated: DayData[] = [];
    for (let i = 1; i <= count; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + (i - 1));

      const existing = initialDays?.find((x: any) => x.day_number === i);

      const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isoDate = d.toISOString().split('T')[0];

      // Auto-assign milestones
      let milestone: string | undefined = undefined;
      if (i === 1) milestone = 'Stim Day 1';
      else if (i === 6) milestone = 'Antagonist Start';
      else if (i === 11) milestone = 'Trigger Imminent';
      else if (i === 12) milestone = 'hCG Trigger';
      else if (i === 14) milestone = 'OPU Retrieval';

      generated.push({
        day_number: i,
        date: existing?.date || isoDate,
        display_date: existing?.display_date || displayDate,
        day_of_week: existing?.day_of_week || dayOfWeek,
        milestone: existing?.milestone || milestone,
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

    // Extract any unique drug names from initialDays
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
  }, [startDate, initialDays]);

  const handleCellChange = (dayNum: number, drugName: string, value: string) => {
    if (readonly) return;
    setDays((prev) =>
      prev.map((day) => {
        if (day.day_number !== dayNum) return day;

        const meds = [...(day.medications || [])];
        const existingIdx = meds.findIndex((m) => m.drug_name === drugName);

        if (existingIdx >= 0) {
          if (!value.trim()) {
            meds.splice(existingIdx, 1);
          } else {
            meds[existingIdx] = { ...meds[existingIdx], dose: value };
          }
        } else if (value.trim()) {
          meds.push({ drug_name: drugName, dose: value });
        }

        return { ...day, medications: meds };
      })
    );
  };

  const handleParamChange = (dayNum: number, field: keyof DayData, value: string) => {
    if (readonly) return;
    setDays((prev) =>
      prev.map((day) => {
        if (day.day_number !== dayNum) return day;
        return { ...day, [field]: value };
      })
    );
  };

  const handleFillForward = (drugName: string, fromDay: number, count: number = 4) => {
    if (readonly) return;
    const sourceDay = days.find((d) => d.day_number === fromDay);
    const sourceMed = sourceDay?.medications.find((m) => m.drug_name === drugName);
    const doseToFill = sourceMed?.dose || '';

    if (!doseToFill) return;

    setDays((prev) =>
      prev.map((day) => {
        if (day.day_number > fromDay && day.day_number <= fromDay + count) {
          const meds = [...day.medications];
          const idx = meds.findIndex((m) => m.drug_name === drugName);
          if (idx >= 0) {
            meds[idx] = { ...meds[idx], dose: doseToFill };
          } else {
            meds.push({ drug_name: drugName, dose: doseToFill });
          }
          return { ...day, medications: meds };
        }
        return day;
      })
    );
  };

  const handleAddCustomDrug = () => {
    const trimmed = newDrugName.trim();
    if (!trimmed || drugList.includes(trimmed)) return;
    setDrugList([...drugList, trimmed]);
    setNewDrugName('');
    setShowAddDrug(false);
  };

  const handleRemoveDrug = (drugName: string) => {
    if (readonly) return;
    setDrugList(drugList.filter((d) => d !== drugName));
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

  const handlePrint = () => {
    window.print();
  };

  // CDSS: Early Warning OHSS Risk Calculator
  const maxE2 = Math.max(
    0,
    ...days.map((d) => parseFloat(d.e2_pgml || '0')).filter((v) => !isNaN(v))
  );

  const totalFolliclesLatest = (() => {
    const daysWithFollicles = [...days].reverse().find((d) => d.right_follicles || d.left_follicles);
    if (!daysWithFollicles) return 0;
    const rCount = (daysWithFollicles.right_follicles?.match(/\d+(\.\d+)?/g) || []).length;
    const lCount = (daysWithFollicles.left_follicles?.match(/\d+(\.\d+)?/g) || []).length;
    return rCount + lCount;
  })();

  const isHighOhssRisk = maxE2 >= 3500 || totalFolliclesLatest >= 18;
  const isModerateOhssRisk = !isHighOhssRisk && (maxE2 >= 2500 || totalFolliclesLatest >= 14);

  return (
    <div className="space-y-4">
      {/* Top Protocol Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs print:hidden">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setProtocolMode('stimulation')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              protocolMode === 'stimulation'
                ? 'bg-indigo-600 text-white shadow-xs'
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
          {/* Top Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-lg p-3 print:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Stimulation Protocol &amp; Follicular Matrix Grid
                </h3>
                <p className="text-[11px] text-slate-500">
                  Day 1–{totalDays} gonadotropins, antagonist, trigger, and serial folliculometry
                </p>
              </div>
            </div>

        <div className="flex items-center gap-2">
          {saveMessage && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {saveMessage}
            </span>
          )}

          {!readonly && (
            <>
              <button
                type="button"
                onClick={() => setShowAddDrug(!showAddDrug)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Add Drug Row</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCalendar}
                disabled={isSaving}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Matrix'}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* CDSS Alert Banner */}
      {(isHighOhssRisk || isModerateOhssRisk) && (
        <div
          className={`p-3.5 rounded-lg border flex items-start justify-between gap-3 animate-fadeIn print:hidden ${
            isHighOhssRisk
              ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-xs'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                isHighOhssRisk ? 'text-rose-600' : 'text-amber-600'
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wide">
                  {isHighOhssRisk
                    ? 'High OHSS Risk Detected (CDSS Early Warning)'
                    : 'Moderate OHSS Risk Vigilance'}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/90 border font-bold">
                  Peak E2: {maxE2 ? `${maxE2} pg/mL` : '—'} · Lead Follicles: {totalFolliclesLatest}
                </span>
              </div>
              <p className="text-[11px] mt-1 text-slate-700">
                {isHighOhssRisk ? (
                  <>
                    <strong>Clinical Action Recommended:</strong> Strongly recommend{' '}
                    <span className="text-rose-700 font-bold">GnRH agonist trigger (Decapeptyl 0.2mg / Lupride)</span>{' '}
                    instead of hCG, initiate <strong>Cabergoline 0.5mg OD</strong> prophylaxis for 8 days post-OPU, and adopt an{' '}
                    <strong>Elective Freeze-All (Cancel Fresh ET)</strong> protocol.
                  </>
                ) : (
                  <>
                    <strong>Clinical Guidance:</strong> Close monitoring of fluid intake, hematocrit, and daily weight recommended. Consider reduced hCG trigger dose (5,000 IU or 125mcg) and cabergoline prophylaxis.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Drug Dialog Popover */}
      {showAddDrug && (
        <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-md flex items-center gap-2 max-w-md print:hidden">
          <input
            type="text"
            placeholder="e.g. Rekovelle 12 mcg, Decapeptyl 0.1mg..."
            value={newDrugName}
            onChange={(e) => setNewDrugName(e.target.value)}
            className="vmd-input text-xs flex-1"
          />
          <button
            type="button"
            onClick={handleAddCustomDrug}
            className="px-3 py-1.5 bg-[rgb(var(--clr-primary))] hover:opacity-90 text-white rounded-md text-xs font-semibold"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowAddDrug(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Printable Sheet Header (Only appears when printing) */}
      <div className="hidden print:block mb-4 text-center border-b pb-2">
        <h1 className="text-xl font-bold text-slate-900">VaidyaMD Fertility — Patient Stimulation Sheet</h1>
        <p className="text-xs text-slate-600">Daily Medication Timetable &amp; Serial Follicular Tracking Chart</p>
      </div>

      {/* Main Grid Table (Transposed: Days as Rows, Parameters as Columns) */}
      <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[70vh] custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            {/* Header: Columns (Date, Milestone, Drugs, Params) */}
            <thead className="sticky top-0 bg-slate-100 z-20 shadow-2xs">
              <tr className="border-b border-slate-200">
                <th className="p-3 bg-slate-100 text-slate-800 font-bold text-xs sticky left-0 z-30 shadow-r min-w-[120px]">
                  Day / Date
                </th>
                <th className="p-3 bg-slate-100 text-slate-800 font-bold text-xs min-w-[120px]">
                  Milestone
                </th>
                {/* Dynamic Drug Columns */}
                {drugList.map((drugName) => (
                  <th key={drugName} className="p-2.5 min-w-[140px] border-l border-slate-200 group">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-indigo-900 truncate" title={drugName}>
                        <Pill className="w-3 h-3 inline mr-1 text-indigo-500" />
                        {drugName}
                      </span>
                      {!readonly && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDrug(drugName)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5"
                          title="Remove drug column"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                
                {/* Fixed Parameter Columns */}
                <th className="p-2.5 min-w-[120px] border-l border-slate-300 bg-rose-50/50 text-rose-900">
                  <div className="text-[11px] font-bold">R. Ovary (mm)</div>
                </th>
                <th className="p-2.5 min-w-[120px] border-l border-slate-200 bg-rose-50/50 text-rose-900">
                  <div className="text-[11px] font-bold">L. Ovary (mm)</div>
                </th>
                <th className="p-2.5 min-w-[120px] border-l border-slate-300 bg-emerald-50 text-emerald-900">
                  <div className="text-[11px] font-bold">Endometrium</div>
                </th>
                <th className="p-2.5 min-w-[100px] border-l border-slate-300 bg-amber-50 text-amber-900">
                  <div className="text-[11px] font-bold">E2 (pg/mL)</div>
                </th>
                <th className="p-2.5 min-w-[100px] border-l border-slate-200 bg-amber-50 text-amber-900">
                  <div className="text-[11px] font-bold">P4 (ng/mL)</div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {days.map((day) => (
                <tr key={day.day_number} className="hover:bg-slate-50/60 transition-colors group/row">
                  {/* Day/Date (Sticky Left) */}
                  <td className="p-2 bg-white sticky left-0 z-10 shadow-r border-b border-slate-100">
                    <div className="font-bold text-slate-800 text-xs">Day {day.day_number}</div>
                    <div className="text-[10px] text-slate-500">{day.display_date}</div>
                    <div className="text-[9px] uppercase text-slate-400">{day.day_of_week}</div>
                  </td>
                  
                  {/* Milestone */}
                  <td className="p-2 border-b border-slate-100">
                    {day.milestone && (
                      <span className="inline-block text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        {day.milestone}
                      </span>
                    )}
                  </td>

                  {/* Drug Dose Cells */}
                  {drugList.map((drugName) => {
                    const med = day.medications.find((m) => m.drug_name === drugName);
                    const doseVal = med?.dose || '';

                    return (
                      <td key={drugName} className="p-1.5 border-l border-b border-slate-100 relative group/cell">
                        <input
                          type="text"
                          value={doseVal}
                          disabled={readonly}
                          placeholder="—"
                          onChange={(e) => handleCellChange(day.day_number, drugName, e.target.value)}
                          className={`w-full text-center text-xs py-1.5 px-2 rounded-md transition-all ${
                            doseVal
                              ? 'font-bold bg-indigo-50/80 text-indigo-900 border border-indigo-200'
                              : 'text-slate-400 bg-transparent hover:bg-slate-100 border border-transparent focus:border-indigo-300 focus:bg-white'
                          }`}
                        />
                        {/* 1-Click Fill Forward Arrow */}
                        {!readonly && doseVal && day.day_number < totalDays && (
                          <button
                            type="button"
                            onClick={() => handleFillForward(drugName, day.day_number, 3)}
                            className="hidden group-hover/cell:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-600 text-white z-20 shadow-xs hover:scale-110 transition-transform translate-x-1/2"
                            title="Fill next 3 days"
                          >
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </td>
                    );
                  })}

                  {/* Right Ovary */}
                  <td className="p-1.5 border-l border-b border-slate-300">
                    <input
                      type="text"
                      placeholder="—"
                      value={day.right_follicles || ''}
                      disabled={readonly}
                      onChange={(e) => handleParamChange(day.day_number, 'right_follicles', e.target.value)}
                      className={`w-full text-center text-xs py-1.5 px-2 rounded-md ${
                        day.right_follicles
                          ? 'font-bold bg-rose-50/60 text-rose-950 border border-rose-200'
                          : 'text-slate-400 bg-transparent hover:bg-slate-100 border border-transparent'
                      }`}
                    />
                  </td>

                  {/* Left Ovary */}
                  <td className="p-1.5 border-l border-b border-slate-100">
                    <input
                      type="text"
                      placeholder="—"
                      value={day.left_follicles || ''}
                      disabled={readonly}
                      onChange={(e) => handleParamChange(day.day_number, 'left_follicles', e.target.value)}
                      className={`w-full text-center text-xs py-1.5 px-2 rounded-md ${
                        day.left_follicles
                          ? 'font-bold bg-rose-50/60 text-rose-950 border border-rose-200'
                          : 'text-slate-400 bg-transparent hover:bg-slate-100 border border-transparent'
                      }`}
                    />
                  </td>

                  {/* Endometrium */}
                  <td className="p-1.5 border-l border-b border-slate-300">
                    <input
                      type="text"
                      placeholder="—"
                      value={day.endometrium_mm || ''}
                      disabled={readonly}
                      onChange={(e) => handleParamChange(day.day_number, 'endometrium_mm', e.target.value)}
                      className={`w-full text-center text-xs py-1.5 px-2 rounded-md ${
                        day.endometrium_mm
                          ? 'font-bold bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'text-slate-400 bg-transparent hover:bg-slate-100 border border-transparent'
                      }`}
                    />
                  </td>

                  {/* E2 */}
                  <td className="p-1.5 border-l border-b border-slate-300">
                    <input
                      type="text"
                      placeholder="—"
                      value={day.e2_pgml || ''}
                      disabled={readonly}
                      onChange={(e) => handleParamChange(day.day_number, 'e2_pgml', e.target.value)}
                      className={`w-full text-center text-xs py-1.5 px-2 rounded-md ${
                        day.e2_pgml
                          ? 'font-bold bg-amber-50 text-amber-900 border border-amber-200'
                          : 'text-slate-400 bg-transparent hover:bg-slate-100 border border-transparent'
                      }`}
                    />
                  </td>

                  {/* P4 */}
                  <td className="p-1.5 border-l border-b border-slate-100">
                    <input
                      type="text"
                      placeholder="—"
                      value={day.p4_ngml || ''}
                      disabled={readonly}
                      onChange={(e) => handleParamChange(day.day_number, 'p4_ngml', e.target.value)}
                      className={`w-full text-center text-xs py-1.5 px-2 rounded-md ${
                        day.p4_ngml
                          ? 'font-bold bg-amber-50 text-amber-900 border border-amber-200'
                          : 'text-slate-400 bg-transparent hover:bg-slate-100 border border-transparent'
                      }`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
