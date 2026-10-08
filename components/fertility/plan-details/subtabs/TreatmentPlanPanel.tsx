'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Save, Check, Clock, Stethoscope, AlertCircle, Loader2 } from 'lucide-react';
import { TreatmentCycleRecord } from '../types';
import { treatmentCyclesApi, protocolsApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import { generateDaysFromProtocol } from '../utils';

interface TreatmentPlanPanelProps {
  cycle: TreatmentCycleRecord;
  onUpdateCycle?: (updated: TreatmentCycleRecord) => void;
  onNavigateNext?: () => void;
}

export default function TreatmentPlanPanel({ cycle, onUpdateCycle, onNavigateNext }: TreatmentPlanPanelProps) {
  const currentDates = cycle.sentinel_dates || {};

  const [dbProtocols, setDbProtocols] = useState<any[]>([]);
  const [loadingProtocols, setLoadingProtocols] = useState(false);

  const [protocolName, setProtocolName] = useState<string>(
    currentDates.protocol_name || ''
  );
  const [protocolNotes, setProtocolNotes] = useState<string>(
    currentDates.protocol_notes || ''
  );

  // Fetch protocols dynamically from DB master library
  useEffect(() => {
    setLoadingProtocols(true);
    protocolsApi
      .list({ include_inactive: false })
      .then((res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          setDbProtocols(res);
          if (!protocolName) {
            const typeUpper = (cycle?.treatment_type || '').toUpperCase();
            const matched =
              res.find((p: any) => {
                if (typeUpper.includes('FET')) return p.name.toUpperCase().includes('FET') || p.category?.toUpperCase().includes('FET');
                if (typeUpper.includes('ANTAGONIST')) return p.name.toUpperCase().includes('ANTAGONIST');
                if (typeUpper.includes('CONVENTIONAL') || typeUpper.includes('IVF')) {
                  return p.name.toUpperCase().includes('IVF') || p.name.toUpperCase().includes('ANTAGONIST');
                }
                return false;
              }) || res[0];
            if (matched) {
              setProtocolName(matched.name);
            }
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load clinical protocols:', err);
      })
      .finally(() => {
        setLoadingProtocols(false);
      });
  }, []);

  // Sentinel Dates & Times
  const [lmpDate, setLmpDate] = useState<string>(
    currentDates.lmp_date || currentDates.lmp_day1 || ''
  );
  const [baselineScanDate, setBaselineScanDate] = useState<string>(
    currentDates.baseline_scan_date || currentDates.baseline_scan || ''
  );
  const [stimStartDate, setStimStartDate] = useState<string>(
    currentDates.stim_start_date || currentDates.stim_start || ''
  );
  const [triggerDatetime, setTriggerDatetime] = useState<string>(
    currentDates.trigger_datetime || currentDates.trigger || ''
  );
  const [opuDatetime, setOpuDatetime] = useState<string>(
    currentDates.opu_datetime || currentDates.opu || ''
  );
  const [lpsStartDate, setLpsStartDate] = useState<string>(
    currentDates.lps_start_date || currentDates.lps_start || ''
  );
  const [etDatetime, setEtDatetime] = useState<string>(
    currentDates.et_datetime || currentDates.et || ''
  );
  const [betaHcgDate, setBetaHcgDate] = useState<string>(
    currentDates.beta_hcg_date || ''
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Auto-calculate sentinel dates when LMP Day 1 changes
  const handleLmpChange = (val: string) => {
    setLmpDate(val);
    if (!val) return;
    const lmp = new Date(val);
    if (isNaN(lmp.getTime())) return;

    const addDays = (d: Date, days: number) => {
      const res = new Date(d);
      res.setDate(res.getDate() + days);
      return res.toISOString().split('T')[0];
    };

    const typeUpper = (cycle?.treatment_type || '').toUpperCase();
    const isFet = typeUpper.includes('FET') || Boolean(currentDates.is_hrt_fet);
    const isIui = typeUpper.includes('IUI');
    const isEggFreezing = typeUpper.includes('EGG') || typeUpper.includes('OOCYTE');

    if (isFet) {
      setBaselineScanDate(addDays(lmp, 1));
      const p0 = addDays(lmp, 13);
      setLpsStartDate(p0);
      setEtDatetime(`${addDays(new Date(p0), 5)}T11:00`);
      setBetaHcgDate(addDays(lmp, 28));
    } else if (isIui) {
      setBaselineScanDate(addDays(lmp, 1));
      setStimStartDate(addDays(lmp, 2));
      setTriggerDatetime(`${addDays(lmp, 11)}T21:30`);
      setOpuDatetime(`${addDays(lmp, 13)}T10:00`);
      setBetaHcgDate(addDays(lmp, 27));
    } else if (isEggFreezing) {
      setBaselineScanDate(addDays(lmp, 1));
      setStimStartDate(addDays(lmp, 2));
      setTriggerDatetime(`${addDays(lmp, 11)}T21:30`);
      setOpuDatetime(`${addDays(lmp, 13)}T08:30`);
    } else {
      // Standard IVF / ICSI
      setBaselineScanDate(addDays(lmp, 1));
      setStimStartDate(addDays(lmp, 2));
      setTriggerDatetime(`${addDays(lmp, 11)}T21:30`);
      setOpuDatetime(`${addDays(lmp, 13)}T08:30`);
      setLpsStartDate(addDays(lmp, 13));
      setEtDatetime(`${addDays(lmp, 18)}T11:00`);
      setBetaHcgDate(addDays(lmp, 28));
    }
    toast.info('Dates Calculated', 'Milestone dates projected from LMP Day 1. You may adjust dates individually.');
  };

  const handleSave = async (andNext = false) => {
    const selectedProto = dbProtocols.find((p) => p.name === protocolName);
    const protocolTemplateId = selectedProto?.id || (cycle as any).protocol_template_id;

    // Auto-generate medication calendar if empty or if protocol changed
    let medCalendar = cycle.medication_calendar;
    if (selectedProto && (!medCalendar || medCalendar.length === 0 || protocolName !== currentDates.protocol_name)) {
      const startRef = stimStartDate || baselineScanDate || lmpDate || cycle.start_date || new Date().toISOString().split('T')[0];
      medCalendar = generateDaysFromProtocol(selectedProto, startRef, 14);
    }

    const payload: any = {
      protocol_template_id: protocolTemplateId || undefined,
      sentinel_dates: {
        protocol_name: protocolName,
        protocol_notes: protocolNotes,
        lmp_date: lmpDate,
        baseline_scan_date: baselineScanDate,
        stim_start_date: stimStartDate,
        trigger_datetime: triggerDatetime,
        opu_datetime: opuDatetime,
        lps_start_date: lpsStartDate,
        et_datetime: etDatetime,
        beta_hcg_date: betaHcgDate,
        // backwards compatibility aliases
        lmp_day1: lmpDate,
        baseline_scan: baselineScanDate,
        stim_start: stimStartDate,
        trigger: triggerDatetime,
        opu: opuDatetime,
        et: etDatetime,
      },
      medication_calendar: medCalendar || [],
    };

    if (!cycle?.id) {
      if (onUpdateCycle) {
        onUpdateCycle({ ...cycle, ...payload });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        toast.success('Draft Updated', 'Protocol & day-by-day medication schedule populated.');
      }
      if (andNext && onNavigateNext) {
        onNavigateNext();
      }
      return;
    }

    setIsSaving(true);
    try {
      const res = await treatmentCyclesApi.update(cycle.id, payload);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      toast.success('Milestones Saved', 'Protocol and medication schedule updated successfully.');
      if (onUpdateCycle && res) {
        onUpdateCycle(res);
      }
      if (andNext && onNavigateNext) {
        onNavigateNext();
      }
    } catch (err: any) {
      toast.error('Failed to save', err.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const currentDesc = dbProtocols.find((p) => p.name === protocolName)?.description;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" />
            <span>Treatment Protocol &amp; Sentinel Milestones</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Assigned clinical stimulation protocol engine, critical milestone dates, and precision timing checkpoints
          </p>
        </div>
        <div className="flex items-center gap-2">
          {protocolName && (
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20">
              {protocolName}
            </span>
          )}
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save Details'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 active:scale-98"
          >
            <span>Save &amp; Next →</span>
          </button>
        </div>
      </div>

      {/* Protocol Selection Card */}
      <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600 block">
                Clinical Protocol Selection
              </label>
              {loadingProtocols && (
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" /> Loading...
                </span>
              )}
            </div>
            <select
              value={protocolName}
              onChange={(e) => setProtocolName(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">— Select Clinical Protocol —</option>
              {dbProtocols.map((p) => (
                <option key={p.id || p.name} value={p.name}>
                  {p.name} [{p.category || 'Stimulation'}]
                </option>
              ))}
              {protocolName && !dbProtocols.some((p) => p.name === protocolName) && (
                <option value={protocolName}>{protocolName}</option>
              )}
            </select>
            {currentDesc && (
              <p className="text-[10px] text-slate-500 mt-1 italic">
                {currentDesc}
              </p>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Protocol Customizations &amp; Special Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Dual trigger (Decapeptyl 0.2mg + Ovidrel 250mcg) if > 15 follicles; cabergoline 0.5mg OD"
              value={protocolNotes}
              onChange={(e) => setProtocolNotes(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Sentinel Milestones Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Sentinel Milestone Timing Checkpoints</span>
          </h4>
          <span className="text-[11px] text-slate-500 font-medium">
            Critical timestamps for OPU 35-36h window &amp; ET scheduling
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* LMP */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Start Follicular Phase (LMP Day 1)
            </label>
            <input
              type="date"
              value={lmpDate}
              onChange={(e) => handleLmpChange(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Baseline Scan */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Baseline Ultrasound Scan (Day 2/3)
            </label>
            <input
              type="date"
              value={baselineScanDate}
              onChange={(e) => setBaselineScanDate(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Stim Start */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Stimulation Start Date (Stim Day 1)
            </label>
            <input
              type="date"
              value={stimStartDate}
              onChange={(e) => setStimStartDate(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Trigger Date & Time */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
            <label className="text-[10px] font-bold text-amber-900 block mb-1 flex items-center justify-between">
              <span>Trigger Date &amp; Time ⚡</span>
              <Clock className="w-3 h-3 text-amber-700" />
            </label>
            <input
              type="datetime-local"
              value={triggerDatetime}
              onChange={(e) => {
                setTriggerDatetime(e.target.value);
                // Auto calculate OPU datetime: exactly 35.5 hours later
                if (e.target.value && !opuDatetime) {
                  const trig = new Date(e.target.value);
                  if (!isNaN(trig.getTime())) {
                    const opu = new Date(trig.getTime() + 35.5 * 60 * 60 * 1000);
                    // format to datetime-local
                    const yr = opu.getFullYear();
                    const mo = String(opu.getMonth() + 1).padStart(2, '0');
                    const da = String(opu.getDate()).padStart(2, '0');
                    const hr = String(opu.getHours()).padStart(2, '0');
                    const mi = String(opu.getMinutes()).padStart(2, '0');
                    setOpuDatetime(`${yr}-${mo}-${da}T${hr}:${mi}`);
                  }
                }
              }}
              className="w-full text-xs font-bold bg-white border border-amber-300 rounded px-2 py-1 text-amber-950 focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* OPU Date & Time */}
          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg">
            <label className="text-[10px] font-bold text-rose-900 block mb-1 flex items-center justify-between">
              <span>Egg Retrieval (OPU) 🥚</span>
              <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-1 rounded">35h Window</span>
            </label>
            <input
              type="datetime-local"
              value={opuDatetime}
              onChange={(e) => setOpuDatetime(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-rose-300 rounded px-2 py-1 text-rose-950 focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* LPS Start Date */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
            <label className="text-[10px] font-bold text-emerald-900 block mb-1 flex items-center justify-between">
              <span>Luteal Support Start (P0) 💊</span>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1 rounded">Progesterone</span>
            </label>
            <input
              type="date"
              value={lpsStartDate}
              onChange={(e) => setLpsStartDate(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-emerald-300 rounded px-2 py-1 text-emerald-950 focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Embryo Transfer Date & Time */}
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg">
            <label className="text-[10px] font-bold text-purple-900 block mb-1 flex items-center justify-between">
              <span>Embryo Transfer (ET) ✨</span>
              <span className="text-[9px] font-bold text-purple-600 bg-purple-100 px-1 rounded">Day 3 / Day 5</span>
            </label>
            <input
              type="datetime-local"
              value={etDatetime}
              onChange={(e) => setEtDatetime(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-purple-300 rounded px-2 py-1 text-purple-950 focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Beta hCG Pregnancy Test Due Date */}
          <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg">
            <label className="text-[10px] font-bold text-sky-900 block mb-1 flex items-center justify-between">
              <span>Serum Beta hCG Due Date 🩸</span>
              <span className="text-[9px] font-bold text-sky-600 bg-sky-100 px-1 rounded">D14 Post-ET</span>
            </label>
            <input
              type="date"
              value={betaHcgDate}
              onChange={(e) => setBetaHcgDate(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-sky-300 rounded px-2 py-1 text-sky-950 focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Clinical Guidance Notice */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-700">
        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-primary">OPU Timing Window Rule:</span> In ART cycles, Egg Retrieval (OPU) must occur precisely 35 hours to 36 hours after hCG or Dual trigger administration. Ensure patient receives both verbal and written timetable.
        </div>
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-[11px] text-slate-500 font-medium">
          Step 4 of 7 · Treatment Protocol &amp; Milestones
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            {isSaved ? 'Saved' : 'Save Milestones'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-5 py-2 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <span>Save &amp; Next: Endometrial Monitoring →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
