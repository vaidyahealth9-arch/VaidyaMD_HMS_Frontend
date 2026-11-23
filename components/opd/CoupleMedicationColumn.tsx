'use client';

import React from 'react';
import { Plus, Trash2, Heart, User } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { STANDARD_FREQUENCIES, FOOD_TIMING_PRESETS } from './prescriptionUtils';
import MedicineAutocompleteInput from './MedicineAutocompleteInput';
import type { CoupleMedRow } from './CouplePrescriptionManager';

interface CoupleMedicationColumnProps {
  partner: 'female' | 'male';
  partnerName: string;
  meds: CoupleMedRow[];
  onAddMed: (partner: 'female' | 'male') => void;
  onRemoveMed: (partner: 'female' | 'male', index: number) => void;
  onMedChange: (partner: 'female' | 'male', index: number, field: keyof CoupleMedRow, value: string) => void;
}

export default function CoupleMedicationColumn({
  partner,
  partnerName,
  meds,
  onAddMed,
  onRemoveMed,
  onMedChange,
}: CoupleMedicationColumnProps) {
  const isFemale = partner === 'female';
  const theme = isFemale
    ? {
        bg: 'bg-rose-50/40',
        border: 'border-rose-200/80',
        borderInner: 'border-rose-200',
        headerText: 'text-rose-800',
        icon: <Heart className="w-3.5 h-3.5 text-rose-500" />,
        badgeBg: 'bg-rose-100 text-rose-700',
        addText: 'text-rose-700 hover:text-rose-900',
        emptyText: 'text-rose-700',
        emptyBorder: 'border-rose-200',
        focusRing: 'focus:ring-rose-400',
        foodBadgeBg: 'bg-rose-100/70 hover:bg-rose-200 text-rose-800',
      }
    : {
        bg: 'bg-blue-50/40',
        border: 'border-blue-200/80',
        borderInner: 'border-blue-200',
        headerText: 'text-blue-800',
        icon: <User className="w-3.5 h-3.5 text-blue-500" />,
        badgeBg: 'bg-blue-100 text-blue-700',
        addText: 'text-blue-700 hover:text-blue-900',
        emptyText: 'text-blue-700',
        emptyBorder: 'border-blue-200',
        focusRing: 'focus:ring-blue-400',
        foodBadgeBg: 'bg-blue-100/70 hover:bg-blue-200 text-blue-800',
      };

  return (
    <div className={`${theme.bg} p-3.5 rounded-lg border ${theme.border} space-y-3 shadow-2xs`}>
      <div className={`flex items-center justify-between border-b ${theme.borderInner}/60 pb-2`}>
        <span className={`text-xs font-bold ${theme.headerText} flex items-center gap-1.5`}>
          {theme.icon}
          <span>{isFemale ? 'Female Prescription' : 'Male Prescription'} — {partnerName}</span>
          <span className={`text-[10px] ${theme.badgeBg} px-1.5 py-0.2 rounded-full font-semibold`}>
            {meds.length}
          </span>
        </span>
        <button
          type="button"
          onClick={() => onAddMed(partner)}
          className={`text-xs font-bold ${theme.addText} flex items-center gap-1 hover:underline cursor-pointer`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Drug</span>
        </button>
      </div>

      <div className="space-y-2.5">
        {meds.length === 0 ? (
          <div className={`text-center py-6 border border-dashed ${theme.emptyBorder} rounded-lg bg-white/70`}>
            <p className={`text-xs ${theme.emptyText} font-medium`}>
              No medications prescribed for {isFemale ? 'female patient' : 'male partner'} yet.
            </p>
            <button
              type="button"
              onClick={() => onAddMed(partner)}
              className={`mt-2 text-xs font-bold ${theme.addText} hover:underline inline-flex items-center gap-1 cursor-pointer`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Medication</span>
            </button>
          </div>
        ) : (
          meds.map((med, idx) => (
            <div key={idx} className={`bg-white p-2.5 rounded-md border ${theme.borderInner} space-y-2`}>
              <div className="flex items-end justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                    Medicine Name (Formulary Search + Custom Text)
                  </label>
                  <MedicineAutocompleteInput
                    value={med.drug_name}
                    onChange={(val) => onMedChange(partner, idx, 'drug_name', val)}
                    onSelect={(selected) => onMedChange(partner, idx, 'drug_name', selected.drug)}
                    placeholder="Search pharmacy inventory or enter custom medicine..."
                    className="h-8 text-xs font-semibold text-slate-800 bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveMed(partner, idx)}
                  className="p-2 mb-0.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                  title="Remove drug"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Dose</label>
                  <Input
                    value={med.dose}
                    onChange={(e) => onMedChange(partner, idx, 'dose', e.target.value)}
                    placeholder="1 tab"
                    className="h-7 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Frequency</label>
                  <input
                    list={`${partner}-freq-${idx}`}
                    value={med.frequency}
                    onChange={(e) => onMedChange(partner, idx, 'frequency', e.target.value)}
                    placeholder="1-0-1"
                    className={`w-full h-7 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 ${theme.focusRing}`}
                  />
                  <datalist id={`${partner}-freq-${idx}`}>
                    {STANDARD_FREQUENCIES.map((f) => (
                      <option key={f} value={f} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Duration</label>
                  <Input
                    value={med.duration}
                    onChange={(e) => onMedChange(partner, idx, 'duration', e.target.value)}
                    placeholder={isFemale ? '5 days' : '30 days'}
                    className="h-7 text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Instructions</label>
                  <div className="flex items-center gap-1">
                    {FOOD_TIMING_PRESETS.slice(0, 3).map((f) => (
                      <button
                        key={f.code}
                        type="button"
                        onClick={() => onMedChange(partner, idx, 'instructions', f.label)}
                        className={`text-[8px] px-1 py-0.2 rounded ${theme.foodBadgeBg} font-semibold cursor-pointer`}
                        title={f.label}
                      >
                        {f.code}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  value={med.instructions}
                  onChange={(e) => onMedChange(partner, idx, 'instructions', e.target.value)}
                  placeholder="e.g. After food"
                  className="h-7 text-xs bg-white"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
