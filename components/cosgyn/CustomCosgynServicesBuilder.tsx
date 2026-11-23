'use client';

import React from 'react';
import { Plus, Sparkles, SlidersHorizontal, IndianRupee } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import type { CustomCosgynServiceItem } from './types';
import CustomServiceRow from './CustomServiceRow';

export const MODALITY_PRESETS = [
  { name: 'Jet Plasma Rejuvenation', defaultDuration: 30, defaultPrice: 10000, defaultFreq: 'weekly' },
  { name: 'Tesla Chair HIFEM Pelvic Floor', defaultDuration: 30, defaultPrice: 8000, defaultFreq: 'twice_weekly' },
  { name: 'PRP Therapy (O-Shot / Revitalization)', defaultDuration: 45, defaultPrice: 12000, defaultFreq: 'monthly' },
  { name: 'Fractional CO2 Laser / MonaLisa', defaultDuration: 40, defaultPrice: 15000, defaultFreq: 'monthly' },
  { name: 'Radiofrequency (RF) Tightening', defaultDuration: 30, defaultPrice: 9000, defaultFreq: 'weekly' },
  { name: 'Exosomes / Bio-Stimulation Therapy', defaultDuration: 45, defaultPrice: 18000, defaultFreq: 'monthly' },
];

interface CustomCosgynServicesBuilderProps {
  customServices: CustomCosgynServiceItem[];
  setCustomServices: React.Dispatch<React.SetStateAction<CustomCosgynServiceItem[]>>;
  customPackageName: string;
  setCustomPackageName: (name: string) => void;
  todayStr: string;
}

export default function CustomCosgynServicesBuilder({
  customServices,
  setCustomServices,
  customPackageName,
  setCustomPackageName,
  todayStr,
}: CustomCosgynServicesBuilderProps) {
  const handleAddService = (presetName?: string) => {
    const preset = MODALITY_PRESETS.find((p) => p.name === presetName);
    const newService: CustomCosgynServiceItem = {
      id: `custom-srv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: preset ? preset.name : 'Custom Modality / Procedure',
      sessions: 3,
      unitPrice: preset ? preset.defaultPrice : 8000,
      duration_mins: preset ? preset.defaultDuration : 30,
      startDate: todayStr,
      time: '10:00',
      frequency: preset ? preset.defaultFreq : 'weekly',
    };
    setCustomServices((prev) => [...prev, newService]);
  };

  const handleRemoveService = (id: string) => {
    setCustomServices((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateService = (id: string, field: keyof CustomCosgynServiceItem, value: any) => {
    setCustomServices((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, [field]: value };
        if (field === 'name') {
          const match = MODALITY_PRESETS.find((p) => p.name === value);
          if (match) {
            updated.unitPrice = match.defaultPrice;
            updated.duration_mins = match.defaultDuration;
            updated.frequency = match.defaultFreq;
          }
        }
        return updated;
      })
    );
  };

  const totalCalculatedTariff = customServices.reduce(
    (acc, curr) => acc + (Number(curr.sessions) || 0) * (Number(curr.unitPrice) || 0),
    0
  );

  const totalSessionsCount = customServices.reduce(
    (acc, curr) => acc + (Number(curr.sessions) || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Package Header Customizer */}
      <div className="bg-pink-50/70 border border-pink-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-pink-900 block mb-1">
            Custom Care Plan Title
          </label>
          <Input
            value={customPackageName}
            onChange={(e) => setCustomPackageName(e.target.value)}
            placeholder="e.g. Personalized Pelvic & Mucosal Care Plan"
            className="h-8 text-xs font-bold text-pink-950 bg-white"
          />
        </div>
        <div className="flex items-center gap-4 self-end sm:self-center">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Modalities</span>
            <span className="text-xs font-black text-slate-800">{customServices.length} Items ({totalSessionsCount} s)</span>
          </div>
          <div className="text-right pl-3 border-l border-pink-200">
            <span className="text-[10px] font-bold uppercase text-pink-800 block">Calculated Tariff</span>
            <span className="text-base font-black text-pink-700 font-mono flex items-center gap-0.5 justify-end">
              <IndianRupee className="w-3.5 h-3.5" />
              {formatCurrency(totalCalculatedTariff).replace('₹', '')}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Add Modality Chips */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-600" />
            <span>Select Modalities &amp; Quantities to Bundle:</span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddService()}
            className="h-7 text-xs font-bold text-pink-700 border-pink-300 hover:bg-pink-50 gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Modality</span>
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {MODALITY_PRESETS.map((preset) => {
            const isAdded = customServices.some((s) => s.name === preset.name);
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleAddService(preset.name)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                  isAdded
                    ? 'bg-pink-100 text-pink-900 border-pink-300 shadow-2xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-pink-300 hover:bg-pink-50/50'
                }`}
              >
                <span>{preset.name.includes('Tesla') ? '🪑' : preset.name.includes('Jet') ? '⚡' : '💉'}</span>
                <span>{preset.name}</span>
                <span className="text-[10px] text-pink-700 font-mono">({formatCurrency(preset.defaultPrice)})</span>
                <Plus className="w-3 h-3 text-pink-600 ml-0.5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {customServices.map((srv, idx) => (
          <CustomServiceRow
            key={srv.id}
            service={srv}
            index={idx}
            totalServices={customServices.length}
            presets={MODALITY_PRESETS}
            onUpdateService={handleUpdateService}
            onRemoveService={handleRemoveService}
          />
        ))}
      </div>
    </div>
  );
}
