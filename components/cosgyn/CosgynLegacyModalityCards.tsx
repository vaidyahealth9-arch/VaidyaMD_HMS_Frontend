'use client';

import React from 'react';
import { SlidersHorizontal, Zap, Activity } from 'lucide-react';
import { Input } from '@/shared/ui/input';

interface CosgynLegacyModalityCardsProps {
  selectedTreatment: any;
  selectedTreatmentId: string;
  cosgynStartDate: string;
  setCosgynStartDate: (d: string) => void;
  cosgynTime: string;
  setCosgynTime: (t: string) => void;
  cosgynFrequency: string;
  setCosgynFrequency: (f: string) => void;
  cosgynDuration: number;
  setCosgynDuration: (d: number) => void;
  teslaStartDate: string;
  setTeslaStartDate: (d: string) => void;
  teslaTime: string;
  setTeslaTime: (t: string) => void;
  teslaFrequency: string;
  setTeslaFrequency: (f: string) => void;
  teslaDuration: number;
  setTeslaDuration: (d: number) => void;
}

export default function CosgynLegacyModalityCards({
  selectedTreatment,
  selectedTreatmentId,
  cosgynStartDate,
  setCosgynStartDate,
  cosgynTime,
  setCosgynTime,
  cosgynFrequency,
  setCosgynFrequency,
  cosgynDuration,
  setCosgynDuration,
  teslaStartDate,
  setTeslaStartDate,
  teslaTime,
  setTeslaTime,
  teslaFrequency,
  setTeslaFrequency,
  teslaDuration,
  setTeslaDuration,
}: CosgynLegacyModalityCardsProps) {
  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-pink-600" />
          <span>Independent Modality Scheduling &amp; Frequency</span>
        </h4>
        <span className="text-[10px] text-slate-400">Configure start dates &amp; frequencies</span>
      </div>

      {/* Modality 1: Jet Plasma */}
      {(selectedTreatment?.jet_plasma_sessions > 0 || selectedTreatmentId === 'custom_jet' || selectedTreatmentId === 'custom_combo') && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-primary flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Jet Plasma Suite ({selectedTreatment?.jet_plasma_sessions || 1} Sessions)</span>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Start Date</label>
              <Input type="date" value={cosgynStartDate} onChange={(e) => setCosgynStartDate(e.target.value)} className="h-8 text-xs bg-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Time Slot</label>
              <Input type="time" value={cosgynTime} onChange={(e) => setCosgynTime(e.target.value)} className="h-8 text-xs bg-white font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Frequency</label>
              <select value={cosgynFrequency} onChange={(e) => setCosgynFrequency(e.target.value)} className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md">
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="twice_weekly">Twice a Week</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Duration (Mins)</label>
              <Input type="number" value={cosgynDuration} onChange={(e) => setCosgynDuration(Number(e.target.value))} className="h-8 text-xs bg-white" min={15} max={120} />
            </div>
          </div>
        </div>
      )}

      {/* Modality 2: Tesla Chair */}
      {(selectedTreatment?.tesla_chair_sessions > 0 || selectedTreatmentId === 'custom_tesla' || selectedTreatmentId === 'custom_combo') && (
        <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-purple-900 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-700" />
              <span>Tesla Chair Pelvic Floor Suite ({selectedTreatment?.tesla_chair_sessions || 1} Sessions)</span>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-purple-700 uppercase block mb-1">Tesla Start Date</label>
              <Input type="date" value={teslaStartDate} onChange={(e) => setTeslaStartDate(e.target.value)} className="h-8 text-xs bg-white border-purple-200" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-purple-700 uppercase block mb-1">Tesla Time Slot</label>
              <Input type="time" value={teslaTime} onChange={(e) => setTeslaTime(e.target.value)} className="h-8 text-xs bg-white border-purple-200 font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-purple-700 uppercase block mb-1">Tesla Frequency</label>
              <select value={teslaFrequency} onChange={(e) => setTeslaFrequency(e.target.value)} className="w-full h-8 px-2 text-xs bg-white border border-purple-200 rounded-md">
                <option value="twice_weekly">Twice a Week</option>
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-purple-700 uppercase block mb-1">Duration (Mins)</label>
              <Input type="number" value={teslaDuration} onChange={(e) => setTeslaDuration(Number(e.target.value))} className="h-8 text-xs bg-white border-purple-200" min={15} max={90} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
