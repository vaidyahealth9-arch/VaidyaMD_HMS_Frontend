'use client';

import React from 'react';
import { Pill, Check, Sparkles } from 'lucide-react';
import { MedModalState } from './types';

import { HrtFetRowData } from './types';

interface HrtFetMedicationModalProps {
  rows: HrtFetRowData[];
  plannedEstrogenDays: number;
  medModal: MedModalState;
  setMedModal: React.Dispatch<React.SetStateAction<MedModalState | null>>;
  onApply: () => void;
}

export default function HrtFetMedicationModal({
  medModal,
  setMedModal,
  rows,
  plannedEstrogenDays,
  onApply,
}: HrtFetMedicationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden" onClick={() => setMedModal(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Pill className="w-4 h-4 text-[#2F6F8F]" />
                Medication Entry — Day {medModal.cycleDay}
              </h3>
              <button type="button" onClick={() => setMedModal(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Medication / Drug Name</label>
                <input
                  type="text"
                  value={medModal.medication}
                  onChange={(e) => setMedModal({ ...medModal, medication: e.target.value })}
                  className="vmd-input text-xs w-full"
                  placeholder="e.g. Estradiol Valerate (Progynova)"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Dose</label>
                  <input
                    type="text"
                    value={medModal.dose}
                    onChange={(e) => setMedModal({ ...medModal, dose: e.target.value })}
                    className="vmd-input text-xs w-full"
                    placeholder="e.g. 2 mg"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Unit</label>
                  <select
                    value={medModal.unit}
                    onChange={(e) => setMedModal({ ...medModal, unit: e.target.value })}
                    className="vmd-input text-xs w-full"
                  >
                    {['mg', 'IU', 'mcg', 'tab', 'cap', 'ml', 'ampoule'].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Route</label>
                  <select
                    value={medModal.route}
                    onChange={(e) => setMedModal({ ...medModal, route: e.target.value })}
                    className="vmd-input text-xs w-full"
                  >
                    {['Oral', 'Vaginal (PV)', 'IM', 'SC', 'Topical', 'Sublingual'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Frequency</label>
                  <select
                    value={medModal.frequency}
                    onChange={(e) => setMedModal({ ...medModal, frequency: e.target.value })}
                    className="vmd-input text-xs w-full"
                  >
                    {['OD', 'BD', 'TDS', 'QID', 'SOS', 'Stat', 'On alternate days'].map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Timing</label>
                <input
                  type="text"
                  value={medModal.timing}
                  onChange={(e) => setMedModal({ ...medModal, timing: e.target.value })}
                  className="vmd-input text-xs w-full"
                  placeholder="e.g. Morning & Afternoon & Night"
                />
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                <label className="text-[11px] font-bold text-[#2F6F8F] block">Apply to day range (batch fill):</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Day</span>
                  <input
                    type="number"
                    min={1}
                    max={rows.length}
                    value={medModal.applyFromDay}
                    onChange={(e) => setMedModal({ ...medModal, applyFromDay: Number(e.target.value) })}
                    className="vmd-input text-xs w-16"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="number"
                    min={1}
                    max={rows.length}
                    value={medModal.applyToDay}
                    onChange={(e) => setMedModal({ ...medModal, applyToDay: Number(e.target.value) })}
                    className="vmd-input text-xs w-16"
                  />
                  <div className="flex gap-1 ml-auto">
                    {[
                      { label: 'E1-E6', from: 1, to: 7 },
                      { label: 'E7-P0', from: 7, to: Math.min(rows.length, plannedEstrogenDays + 1) },
                      { label: 'All', from: 1, to: rows.length },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setMedModal({ ...medModal, applyFromDay: preset.from, applyToDay: preset.to })}
                        className="text-[10px] px-1.5 py-0.5 bg-[#2F6F8F]/10 text-[#2F6F8F] font-bold rounded hover:bg-[#2F6F8F]/20"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMedModal(null)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onApply}
                className="flex-1 py-2 rounded-lg bg-[#2F6F8F] text-white text-xs font-bold hover:bg-[#245a75] shadow-xs"
              >
                Apply to Days {medModal.applyFromDay}–{medModal.applyToDay}
              </button>
            </div>
          </div>
        </div>
  );
}
