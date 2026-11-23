'use client';

import React, { useState, useMemo } from 'react';
import { X, Sliders, Pill, Check, Calendar, Trash2, Sparkles } from 'lucide-react';
import { DayData } from './StimulationCalendarGrid';

export interface BatchEditResult {
  targetDays: number[];
  actionType: 'set_medication' | 'remove_medication' | 'set_milestone';
  medication?: { drug_name: string; dose: string; route?: string; frequency?: string; time?: string; };
  milestone?: string;
  clearExistingMedsOnDays?: boolean;
}

interface BatchRangeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDays: number;
  days: DayData[];
  drugList: string[];
  onApplyBatch: (result: BatchEditResult) => void;
}

export default function BatchRangeEditModal({
  isOpen, onClose, totalDays, drugList, onApplyBatch,
}: BatchRangeEditModalProps) {
  const [startDay, setStartDay] = useState<number>(2);
  const [stopDay, setStopDay] = useState<number>(Math.min(totalDays, 10));
  const [step, setStep] = useState<number>(1);
  const [syntaxInput, setSyntaxInput] = useState<string>('2:10:1');
  const [actionType, setActionType] = useState<'set_medication' | 'remove_medication' | 'set_milestone'>('set_medication');
  const [selectedDrug, setSelectedDrug] = useState<string>(drugList[0] || 'rFSH (Gonal-F / Rekovelle)');
  const [customDrugName, setCustomDrugName] = useState<string>('');
  const [dose, setDose] = useState<string>('150 IU');
  const [route, setRoute] = useState<string>('SC');
  const [frequency, setFrequency] = useState<string>('OD');
  const [time, setTime] = useState<string>('09:00 AM');
  const [milestone, setMilestone] = useState<string>('Follicular TVS Scan 🔍');
  const [clearExistingMeds, setClearExistingMeds] = useState<boolean>(false);

  const handleSyntaxChange = (val: string) => {
    setSyntaxInput(val);
    const parts = val.split(':').map((p) => parseInt(p.trim(), 10));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      setStartDay(parts[0]);
      setStopDay(parts[1]);
      setStep(parts.length >= 3 && !isNaN(parts[2]) && parts[2] > 0 ? parts[2] : 1);
    }
  };

  const updateNumericParams = (newStart: number, newStop: number, newStep: number) => {
    setStartDay(newStart);
    setStopDay(newStop);
    setStep(newStep);
    setSyntaxInput(`${newStart}:${newStop}:${newStep}`);
  };

  const targetDays = useMemo(() => {
    const res: number[] = [];
    const validStart = Math.max(1, startDay);
    const validStop = Math.min(totalDays, Math.max(validStart, stopDay));
    const validStep = Math.max(1, step);
    for (let d = validStart; d <= validStop; d += validStep) res.push(d);
    return res;
  }, [startDay, stopDay, step, totalDays]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetDays.length === 0) return alert('Please select a valid day range.');
    const effectiveDrug = selectedDrug === '__custom__' ? customDrugName.trim() : selectedDrug;
    if (actionType === 'set_medication' && !effectiveDrug) return alert('Please specify a valid medication name.');

    onApplyBatch({
      targetDays,
      actionType,
      medication: { drug_name: effectiveDrug, dose, route, frequency, time },
      milestone: actionType === 'set_milestone' ? milestone : undefined,
      clearExistingMedsOnDays: clearExistingMeds,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Stim Calendar — Group Dosage & Range Editor</h3>
              <p className="text-[11px] text-slate-500">Apply dosages, protocols, or milestones using Start:Stop:Step syntax</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Day Range & Step Configuration */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Day Range & Step Configuration
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <span>Syntax:</span>
                <input
                  type="text"
                  placeholder="2:10:1"
                  value={syntaxInput}
                  onChange={(e) => handleSyntaxChange(e.target.value)}
                  className="w-16 px-1.5 py-0.5 border border-slate-300 rounded font-mono font-bold text-primary text-center text-xs bg-white"
                  title="Format: Start:Stop:Step"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Start Day</label>
                <input
                  type="number" min="1" max={totalDays} value={startDay}
                  onChange={(e) => updateNumericParams(parseInt(e.target.value) || 1, stopDay, step)}
                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-bold bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Stop Day</label>
                <input
                  type="number" min="1" max={totalDays} value={stopDay}
                  onChange={(e) => updateNumericParams(startDay, parseInt(e.target.value) || totalDays, step)}
                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-bold bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Step Interval</label>
                <input
                  type="number" min="1" max="14" value={step}
                  onChange={(e) => updateNumericParams(startDay, stopDay, parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-bold bg-white"
                  title="1 = Every day, 2 = Alternate days"
                />
              </div>
            </div>

            <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-1.5">
              <span className="text-[11px] text-slate-600">Matches <strong className="text-primary">{targetDays.length} days</strong>:</span>
              <div className="flex items-center gap-1 flex-wrap max-h-12 overflow-y-auto">
                {targetDays.map((d) => (
                  <span key={d} className="px-1 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold font-mono">
                    D{d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button" onClick={() => setActionType('set_medication')}
              className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 border ${
                actionType === 'set_medication' ? 'bg-primary text-white border-primary shadow-xs' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <Pill className="w-3.5 h-3.5" /> Set Med
            </button>
            <button
              type="button" onClick={() => setActionType('remove_medication')}
              className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 border ${
                actionType === 'remove_medication' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Med
            </button>
            <button
              type="button" onClick={() => setActionType('set_milestone')}
              className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 border ${
                actionType === 'set_milestone' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Set Milestone
            </button>
          </div>

          {/* Action Details */}
          {actionType === 'set_medication' && (
            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Select Drug *</label>
                <select
                  value={selectedDrug} onChange={(e) => setSelectedDrug(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
                >
                  {drugList.map((d) => <option key={d} value={d}>{d}</option>)}
                  <option value="__custom__">+ Enter Custom Drug Name...</option>
                </select>
              </div>

              {selectedDrug === '__custom__' && (
                <input
                  type="text" required placeholder="e.g. Fostimon, Menopur" value={customDrugName}
                  onChange={(e) => setCustomDrugName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Dosage *</label>
                  <input type="text" required placeholder="150 IU" value={dose} onChange={(e) => setDose(e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-semibold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Route</label>
                  <select value={route} onChange={(e) => setRoute(e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-white">
                    <option value="SC">SC</option><option value="IM">IM</option><option value="Oral">Oral</option><option value="Vaginal">Vaginal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Frequency</label>
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-white">
                    <option value="OD">OD</option><option value="BD">BD</option><option value="TID">TID</option><option value="Stat">Stat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Time</label>
                  <input type="text" placeholder="09:00 AM" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs" />
                </div>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 pt-1">
                <input type="checkbox" checked={clearExistingMeds} onChange={(e) => setClearExistingMeds(e.target.checked)} className="rounded text-rose-600 w-3.5 h-3.5" />
                <span>Clear existing medications on these days before applying</span>
              </label>
            </div>
          )}

          {actionType === 'remove_medication' && (
            <div className="border border-rose-200 bg-rose-50/40 rounded-xl p-3 space-y-2">
              <label className="block text-xs font-semibold text-rose-900">Select Drug to Remove from Target Days</label>
              <select value={selectedDrug} onChange={(e) => setSelectedDrug(e.target.value)} className="w-full px-2.5 py-1.5 border border-rose-200 rounded-lg text-xs bg-white">
                {drugList.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <p className="text-[11px] text-rose-700">Deletes this drug from Days {targetDays.join(', ')} while preserving others.</p>
            </div>
          )}

          {actionType === 'set_milestone' && (
            <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-3 space-y-2">
              <label className="block text-xs font-semibold text-amber-900">Milestone Label</label>
              <input type="text" required placeholder="e.g. Follicular TVS Scan 🔍" value={milestone} onChange={(e) => setMilestone(e.target.value)} className="w-full px-2.5 py-1.5 border border-amber-200 rounded-lg text-xs bg-white" />
              <div className="flex gap-1 flex-wrap pt-0.5">
                {['Follicular TVS Scan 🔍', 'Serum E2 + P4 🧪', 'Antagonist Start', 'Dual Trigger 💉', 'OPU 🏥', 'ET 🌟'].map((sug) => (
                  <button key={sug} type="button" onClick={() => setMilestone(sug)} className="px-1.5 py-0.5 bg-white border border-amber-300 rounded text-[10px] font-bold text-amber-800">
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 font-bold text-white bg-primary hover:bg-primary-mid rounded-lg shadow-sm flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Apply to {targetDays.length} Days
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
