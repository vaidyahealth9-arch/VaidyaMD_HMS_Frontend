'use client';

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Check, X, Pill } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export interface BatchModifyMedPayload {
  dose: string;
  route?: string;
  frequency?: string;
  instructions?: string;
}

interface BatchModifyMedModalProps {
  isOpen: boolean;
  onClose: () => void;
  medName: string;
  selectedDays: number[];
  initialDose?: string;
  initialRoute?: string;
  initialFrequency?: string;
  initialInstructions?: string;
  onApplyModify: (payload: BatchModifyMedPayload) => void;
}

export default function BatchModifyMedModal({
  isOpen,
  onClose,
  medName,
  selectedDays,
  initialDose = '',
  initialRoute = 'SC',
  initialFrequency = 'OD',
  initialInstructions = '',
  onApplyModify,
}: BatchModifyMedModalProps) {
  const [dose, setDose] = useState(initialDose);
  const [route, setRoute] = useState(initialRoute);
  const [frequency, setFrequency] = useState(initialFrequency);
  const [instructions, setInstructions] = useState(initialInstructions);

  // Sync state whenever modal opens or defaults update
  useEffect(() => {
    if (isOpen) {
      setDose(initialDose);
      setRoute(initialRoute || 'SC');
      setFrequency(initialFrequency || 'OD');
      setInstructions(initialInstructions || '');
    }
  }, [isOpen, initialDose, initialRoute, initialFrequency, initialInstructions]);

  if (!isOpen || !medName || selectedDays.length === 0) return null;

  const sortedDays = [...selectedDays].sort((a, b) => a - b);
  const displayDaysText =
    sortedDays.length <= 4
      ? sortedDays.map((d) => `Day ${d}`).join(', ')
      : `Day ${sortedDays[0]} to Day ${sortedDays[sortedDays.length - 1]} (${sortedDays.length} days)`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dose.trim()) return;

    onApplyModify({
      dose: dose.trim(),
      route,
      frequency,
      instructions: instructions.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">Advance Medication Modify</h3>
              <p className="text-[11px] text-amber-700 font-medium">{displayDaysText}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Active Medication Banner (Locked) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5">
            <Pill className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                Selected Medication
              </span>
              <span className="text-xs font-bold text-slate-900">{medName}</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Dosage / Strength *</label>
            <input
              type="text"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="e.g. 225 IU, 200mg, 10mg"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white text-slate-900 font-bold"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Route</label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white text-slate-800"
              >
                <option value="SC">SC (Subcutaneous)</option>
                <option value="IM">IM (Intramuscular)</option>
                <option value="Oral">Oral</option>
                <option value="Vaginal">Vaginal</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white text-slate-800"
              >
                <option value="OD">OD (Once daily)</option>
                <option value="BD">BD (Twice daily)</option>
                <option value="TDS">TDS (Thrice daily)</option>
                <option value="HS">HS (At bedtime)</option>
                <option value="PRN">PRN (As needed)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Instructions / Notes</label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Take after meals; store in fridge (2-8°C)"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs font-semibold h-8 px-3 rounded-lg cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-8 px-4 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Apply to {selectedDays.length} {selectedDays.length === 1 ? 'Day' : 'Days'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
