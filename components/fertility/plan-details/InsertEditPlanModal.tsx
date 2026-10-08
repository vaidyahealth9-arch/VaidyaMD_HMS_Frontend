'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Pill,
  Activity,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { PlanTimelineItem } from './types';
import { protocolsApi } from '@/lib/api';

interface InsertEditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate?: string;
  defaultProtocolName?: string;
  defaultProtocolId?: string;
  onApplyPlan: (
    generatedItems: PlanTimelineItem[],
    mode: 'overwrite' | 'merge',
    protocolInfo?: { protocolId: string; protocolName: string }
  ) => void;
}

interface ProtocolTemplateItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  timeline_events?: any[];
  rules?: {
    id?: string;
    drug_name: string;
    dose: string;
    route?: string;
    frequency?: string;
    sentinel_anchor?: string;
    day_start_offset: number;
    day_end_offset: number;
    instructions?: string;
    sort_order?: number;
  }[];
}

export default function InsertEditPlanModal({
  isOpen,
  onClose,
  startDate,
  defaultProtocolName,
  defaultProtocolId,
  onApplyPlan,
}: InsertEditPlanModalProps) {
  const [dbProtocols, setDbProtocols] = useState<ProtocolTemplateItem[]>([]);
  const [loadingProtocols, setLoadingProtocols] = useState(false);
  const [selectedProtoId, setSelectedProtoId] = useState<string>('');
  const [initialProtoId, setInitialProtoId] = useState<string>('');
  const [showConfirmSwitch, setShowConfirmSwitch] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(
    startDate || new Date().toISOString().split('T')[0]
  );
  const [stimDuration, setStimDuration] = useState(14);
  const [primaryDose, setPrimaryDose] = useState('175 IU');
  const [antagonistStartDay, setAntagonistStartDay] = useState(6);
  const [antagonistDose, setAntagonistDose] = useState('0.25 mg');

  // Checkpoint options
  const [includeBaselineScan, setIncludeBaselineScan] = useState(true);
  const [includeSerialHormones, setIncludeSerialHormones] = useState(true);
  const [includeTrackingScans, setIncludeTrackingScans] = useState(true);
  const [includePreOpuWorkup, setIncludePreOpuWorkup] = useState(true);

  const [applyMode, setApplyMode] = useState<'overwrite' | 'merge'>('overwrite');

  // Fetch protocols dynamically from DB
  useEffect(() => {
    if (!isOpen) return;
    setLoadingProtocols(true);
    protocolsApi
      .list({ include_inactive: false })
      .then((res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          setDbProtocols(res);
          const matched =
            (defaultProtocolId && res.find((p: any) => p.id === defaultProtocolId)) ||
            (defaultProtocolName &&
              res.find((p: any) => p.name?.trim().toLowerCase() === defaultProtocolName.trim().toLowerCase())) ||
            res[0];

          if (matched) {
            setSelectedProtoId(matched.id);
            setInitialProtoId(matched.id);
            syncProtocolDefaults(matched);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load clinical protocols from DB:', err);
      })
      .finally(() => {
        setLoadingProtocols(false);
      });
  }, [isOpen]);

  const syncProtocolDefaults = (proto: ProtocolTemplateItem) => {
    if (!proto || !proto.rules) return;
    // Find primary stimulation rule
    const primaryRule = proto.rules.find((r) =>
      r.day_start_offset <= 3 && !r.drug_name.toLowerCase().includes('cetrot') && !r.drug_name.toLowerCase().includes('trigger')
    ) || proto.rules[0];
    if (primaryRule) {
      setPrimaryDose(primaryRule.dose || '175 IU');
    }

    // Find antagonist / downregulation rule
    const antagRule = proto.rules.find((r) =>
      r.drug_name.toLowerCase().includes('cetrot') ||
      r.drug_name.toLowerCase().includes('ganirel') ||
      r.drug_name.toLowerCase().includes('antagonist') ||
      r.day_start_offset >= 5
    );
    if (antagRule) {
      setAntagonistStartDay(antagRule.day_start_offset || 6);
      setAntagonistDose(antagRule.dose || '0.25 mg');
    }
  };

  const handleProtocolChange = (protoId: string) => {
    setSelectedProtoId(protoId);
    const found = dbProtocols.find((p) => p.id === protoId);
    if (found) {
      syncProtocolDefaults(found);
    }
  };

  if (!isOpen) return null;

  const initialProto = dbProtocols.find((p) => p.id === initialProtoId);
  const currentProto = dbProtocols.find((p) => p.id === selectedProtoId) || dbProtocols[0];
  const isDifferentProtocol = Boolean(initialProtoId && selectedProtoId && initialProtoId !== selectedProtoId);

  const handleGenerate = (skipConfirm = false) => {
    if (isDifferentProtocol && !skipConfirm) {
      setShowConfirmSwitch(true);
      return;
    }

    const baseDate = new Date(customStartDate);
    const generated: PlanTimelineItem[] = [];

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // 1. Generate rules from database protocol definition
    if (currentProto && currentProto.rules && currentProto.rules.length > 0) {
      for (let dayNum = 1; dayNum <= stimDuration; dayNum++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + (dayNum - 1));

        const dayOfWeek = weekdays[d.getDay()];
        const displayDate = `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
        const isoDate = d.toISOString().split('T')[0];
        const stimDayNumber = dayNum;

        currentProto.rules.forEach((rule, rIdx) => {
          const start = rule.day_start_offset || 1;
          const end = rule.day_end_offset || stimDuration;

          if (dayNum >= start && dayNum <= end) {
            let activeDose = rule.dose;
            // Allow override for primary drug
            const isPrimary = (rule.day_start_offset <= 3 && !rule.drug_name.toLowerCase().includes('cetrot'));
            if (isPrimary && primaryDose) activeDose = primaryDose;
            // Allow override for antagonist
            const isAntag = (rule.drug_name.toLowerCase().includes('cetrot') || rule.drug_name.toLowerCase().includes('ganirel'));
            if (isAntag) {
              if (dayNum < antagonistStartDay) return; // respect user start day
              if (antagonistDose) activeDose = antagonistDose;
            }

            generated.push({
              id: `gen-rule-${rIdx}-${dayNum}`,
              day_number: dayNum,
              date: isoDate,
              display_date: displayDate,
              day_of_week: dayOfWeek,
              stim_day_number: stimDayNumber,
              category: 'medication',
              name: rule.drug_name,
              dosage: activeDose,
              quantity: 1,
              dose_display: `(1 X ${activeDose})`,
              frequency: rule.frequency || 'OD',
              status: 'planned',
            });
          }
        });
      }
    } else {
      // Graceful fallback if no rules configured in template
      for (let dayNum = 1; dayNum <= stimDuration; dayNum++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + (dayNum - 1));
        const dayOfWeek = weekdays[d.getDay()];
        const displayDate = `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
        const isoDate = d.toISOString().split('T')[0];

        if (dayNum >= 2 && dayNum <= 11) {
          generated.push({
            id: `gen-med1-${dayNum}`,
            day_number: dayNum,
            date: isoDate,
            display_date: displayDate,
            day_of_week: dayOfWeek,
            stim_day_number: dayNum,
            category: 'medication',
            name: 'Recombinant FSH',
            dosage: primaryDose,
            quantity: 1,
            dose_display: `(1 X ${primaryDose})`,
            frequency: 'OD',
            status: 'planned',
          });
        }
        if (dayNum >= antagonistStartDay && dayNum <= 11) {
          generated.push({
            id: `gen-antag-${dayNum}`,
            day_number: dayNum,
            date: isoDate,
            display_date: displayDate,
            day_of_week: dayOfWeek,
            stim_day_number: dayNum,
            category: 'medication',
            name: 'GnRH Antagonist',
            dosage: antagonistDose,
            quantity: 1,
            dose_display: `(1 X ${antagonistDose})`,
            frequency: 'OD Morning',
            status: 'planned',
          });
        }
      }
    }

    // 2. Add Clinical Monitoring Checkpoints & Master Protocol Timeline Events
    if (currentProto && currentProto.timeline_events && currentProto.timeline_events.length > 0) {
      // Auto-populate scheduled events configured in Master Settings
      currentProto.timeline_events.forEach((ev: any, evIdx: number) => {
        const dayOffset = parseInt(ev.day_offset) || 1;
        if (dayOffset <= stimDuration) {
          const d = new Date(baseDate);
          d.setDate(d.getDate() + (dayOffset - 1));
          const dayOfWeek = weekdays[d.getDay()];
          const displayDate = `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
          const isoDate = d.toISOString().split('T')[0];
          const cat = ev.type === 'procedure' ? 'procedure' : (ev.type === 'investigation' || ev.type === 'lab') ? 'lab' : 'scan';

          generated.push({
            id: `gen-proto-ev-${evIdx}-${dayOffset}`,
            day_number: dayOffset,
            date: isoDate,
            display_date: displayDate,
            day_of_week: dayOfWeek,
            stim_day_number: dayOffset,
            category: cat,
            name: ev.title,
            scan_details: cat === 'scan' ? ev.instructions : undefined,
            notes: ev.instructions || '',
            status: 'planned',
          });
        }
      });
    } else {
      // Default clinical checkpoints if no timeline events defined in template
      for (let dayNum = 1; dayNum <= stimDuration; dayNum++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + (dayNum - 1));
        const dayOfWeek = weekdays[d.getDay()];
        const displayDate = `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
        const isoDate = d.toISOString().split('T')[0];

        // Baseline Scan on Day 2
        if (includeBaselineScan && dayNum === 2) {
          generated.push({
            id: `gen-scan-baseline`,
            day_number: dayNum,
            date: isoDate,
            display_date: displayDate,
            day_of_week: dayOfWeek,
            stim_day_number: dayNum,
            category: 'scan',
            name: 'Baseline Scan',
            scan_details: 'ET - 2; R-AFC: 10; L-AFC: 8;',
            status: 'planned',
          });
        }

        // Hormones (E2 and LH) on Day 5 and Day 7
        if (includeSerialHormones && (dayNum === 5 || dayNum === 7)) {
          generated.push({
            id: `gen-lab-lh-${dayNum}`,
            day_number: dayNum,
            date: isoDate,
            display_date: displayDate,
            day_of_week: dayOfWeek,
            stim_day_number: dayNum,
            category: 'lab',
            name: 'Luteinising Hormone (LH)',
            status: 'planned',
          });
          generated.push({
            id: `gen-lab-e2-${dayNum}`,
            day_number: dayNum,
            date: isoDate,
            display_date: displayDate,
            day_of_week: dayOfWeek,
            stim_day_number: dayNum,
            category: 'lab',
            name: 'Estradiol (E2)',
            status: 'planned',
          });
        }

        // Tracking Scan on Day 8
        if (includeTrackingScans && dayNum === 8) {
          generated.push({
            id: `gen-scan-track-${dayNum}`,
            day_number: dayNum,
            date: isoDate,
            display_date: displayDate,
            day_of_week: dayOfWeek,
            stim_day_number: dayNum,
            category: 'scan',
            name: 'Follicular Tracking Scan',
            scan_details: 'ET-6.5 mm; R-18,16,14; L -17,15,12;',
            status: 'planned',
          });
        }

        // Trigger Day & Pre-OPU Safety Labs (Day 12)
        if (dayNum === 12) {
          generated.push({
            id: `gen-scan-trigger`,
            day_number: dayNum,
            date: isoDate,
            display_date: displayDate,
            day_of_week: dayOfWeek,
            stim_day_number: dayNum,
            category: 'scan',
            name: 'Trigger Assessment Scan',
            scan_details: 'ET-8.2 mm; R-22,20,18,18; L-19,18,17;',
            status: 'planned',
          });

          if (includePreOpuWorkup) {
            generated.push({
              id: `gen-lab-cbp`,
              day_number: dayNum,
              date: isoDate,
              display_date: displayDate,
              day_of_week: dayOfWeek,
              stim_day_number: dayNum,
              category: 'lab',
              name: 'Complete Blood Picture (CBP)',
              status: 'planned',
            });
            generated.push({
              id: `gen-lab-e2-peak`,
              day_number: dayNum,
              date: isoDate,
              display_date: displayDate,
              day_of_week: dayOfWeek,
              stim_day_number: dayNum,
              category: 'lab',
              name: 'Estradiol (E2) Peak',
              status: 'planned',
            });
          }
        }

        // OPU Retrieval on Day 14 (Clinical Procedure)
        if (dayNum === 14) {
          generated.push({
            id: `gen-proc-opu`,
            day_number: dayNum,
            date: isoDate,
            display_date: displayDate,
            day_of_week: dayOfWeek,
            stim_day_number: dayNum,
            category: 'procedure',
            name: 'Egg Collection (OPU)',
            notes: 'Aspiration Scheduled (35-36h post-trigger)',
            status: 'planned',
          });
        }
      }
    }

    onApplyPlan(generated, applyMode, {
      protocolId: selectedProtoId,
      protocolName: currentProto?.name || '',
    });
    setShowConfirmSwitch(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Insert / Edit Treatment Plan
              </h3>
              <p className="text-xs text-slate-500">
                Configure stimulation protocol, daily gonadotropins, antagonist suppression &amp; scans
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Protocol Selection (DB Driven) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">
                Select Treatment Protocol (Master Library)
              </label>
              {loadingProtocols && (
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" /> Loading protocols...
                </span>
              )}
            </div>
            <select
              value={selectedProtoId}
              onChange={(e) => handleProtocolChange(e.target.value)}
              className="vmd-input text-xs w-full py-2 font-semibold"
              disabled={loadingProtocols || dbProtocols.length === 0}
            >
              {dbProtocols.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.category || 'Stimulation'}]
                </option>
              ))}
              {dbProtocols.length === 0 && !loadingProtocols && (
                <option value="">No protocols loaded</option>
              )}
            </select>
            {currentProto?.description && (
              <p className="text-[11px] text-slate-500 mt-1 italic">
                {currentProto.description}
              </p>
            )}

            {/* Protocol Change Warning Alert */}
            {isDifferentProtocol && (
              <div className="mt-2.5 p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-amber-950">
                    Protocol Change Warning
                  </span>
                  <p className="text-amber-800 leading-relaxed">
                    You are changing the cycle protocol from{' '}
                    <strong>{initialProto?.name || defaultProtocolName || 'Current Protocol'}</strong> to{' '}
                    <strong>{currentProto?.name}</strong>. Applying this will update the protocol assignment for this cycle and recalculate stimulation medication rules and milestones.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Dates & Duration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Stimulation Start Date (Day 1)
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="vmd-input text-xs w-full py-2 font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                Total Protocol Duration (Days)
              </label>
              <input
                type="number"
                min={10}
                max={28}
                value={stimDuration}
                onChange={(e) => setStimDuration(Number(e.target.value))}
                className="vmd-input text-xs w-full py-2 font-bold"
              />
            </div>
          </div>

          {/* Dosages Grid */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-amber-500" />
              Medication &amp; Suppression Dosing
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Primary Drug Dose
                </label>
                <input
                  type="text"
                  value={primaryDose}
                  onChange={(e) => setPrimaryDose(e.target.value)}
                  className="vmd-input text-xs w-full py-1.5 font-bold text-primary"
                  placeholder="e.g. 175 IU"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Antagonist Start Day
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={antagonistStartDay}
                  onChange={(e) => setAntagonistStartDay(Number(e.target.value))}
                  className="vmd-input text-xs w-full py-1.5 font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Antagonist Dose
                </label>
                <input
                  type="text"
                  value={antagonistDose}
                  onChange={(e) => setAntagonistDose(e.target.value)}
                  className="vmd-input text-xs w-full py-1.5 font-bold"
                  placeholder="e.g. 0.25 mg"
                />
              </div>
            </div>
          </div>

          {/* Ultrasound & Lab Checkpoint Checkboxes */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              Scheduled Monitoring Checkpoints
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBaselineScan}
                  onChange={(e) => setIncludeBaselineScan(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span>Include Baseline Scan (Day 2)</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSerialHormones}
                  onChange={(e) => setIncludeSerialHormones(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span>Include Serial E2 &amp; LH Draws (Days 5, 7)</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTrackingScans}
                  onChange={(e) => setIncludeTrackingScans(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span>Include Mid-Cycle Tracking Scan (Day 8)</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePreOpuWorkup}
                  onChange={(e) => setIncludePreOpuWorkup(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span>Include Pre-OPU Safety Labs on Trigger Day</span>
              </label>
            </div>
          </div>

          {/* Overwrite vs Merge Mode */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 pt-1">
            <span className="text-slate-500 font-bold">Apply Mode:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="applyMode"
                value="overwrite"
                checked={applyMode === 'overwrite'}
                onChange={() => setApplyMode('overwrite')}
                className="text-primary focus:ring-primary"
              />
              <span>Replace &amp; Overwrite</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="applyMode"
                value="merge"
                checked={applyMode === 'merge'}
                onChange={() => setApplyMode('merge')}
                className="text-primary focus:ring-primary"
              />
              <span>Merge with Existing</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleGenerate(false)}
            className="px-5 py-2 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate &amp; Apply Schedule</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Protocol Change */}
      {showConfirmSwitch && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Confirm Protocol Change</h4>
                <p className="text-xs text-slate-500">Modify cycle stimulation strategy</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Are you sure you want to change the protocol from{' '}
              <span className="font-bold text-slate-900">{initialProto?.name || defaultProtocolName || 'Previous Protocol'}</span> to{' '}
              <span className="font-bold text-primary">{currentProto?.name}</span>?
              This will update the cycle&apos;s assigned protocol and recalculate the daily medication timetable schedule.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmSwitch(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel / Keep Previous
              </button>
              <button
                type="button"
                onClick={() => handleGenerate(true)}
                className="px-4 py-2 text-xs font-bold bg-primary hover:bg-primary-mid text-white rounded-lg transition-all shadow-xs cursor-pointer active:scale-98"
              >
                Confirm &amp; Apply Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
