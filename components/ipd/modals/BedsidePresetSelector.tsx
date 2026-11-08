'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PRESET_ITEMS, type PresetItem } from './bedsidePresets';

interface BedsidePresetSelectorProps {
  onSelectPreset: (preset: PresetItem) => void;
}

export default function BedsidePresetSelector({ onSelectPreset }: BedsidePresetSelectorProps) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Quick Presets (Bedside &amp; Consumables)</span>
      </label>
      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
        {PRESET_ITEMS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPreset(preset)}
            className="text-left p-2 rounded-md border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/50 transition text-xs font-medium text-slate-800 flex flex-col gap-0.5 shadow-2xs cursor-pointer"
          >
            <span className="font-semibold text-slate-900 truncate">{preset.name}</span>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1 rounded">{preset.category}</span>
              <span className="font-bold text-slate-700">{formatCurrency(preset.unit_price)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
