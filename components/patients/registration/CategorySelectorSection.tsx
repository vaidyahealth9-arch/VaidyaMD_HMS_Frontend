import React from 'react';
import { RegistrationMode } from './types';

interface CategorySelectorSectionProps {
  registrationType: string;
  registrationMode: RegistrationMode;
  onSelectCategory: (category: string) => void;
  onSelectMode: (mode: RegistrationMode) => void;
}

export default function CategorySelectorSection({
  registrationType,
  registrationMode,
  onSelectCategory,
  onSelectMode,
}: CategorySelectorSectionProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        1. Registration Category
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { value: 'patient', label: 'Clinical Patient / Couple', desc: 'Standard fertility treatments' },
          { value: 'donor_bank', label: 'ART Bank Donor', desc: 'Commercial/Bank gamete donor' },
          { value: 'donor_hospital', label: 'Hospital Donor', desc: 'Altruistic hospital donor' },
        ].map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => {
              onSelectCategory(cat.value);
              if (cat.value !== 'patient') {
                onSelectMode('individual');
              }
            }}
            className={`p-3.5 rounded-md text-left border transition-all ${
              registrationType === cat.value
                ? 'border-[rgb(var(--clr-primary))] bg-[rgb(var(--clr-primary)/0.05)] ring-2 ring-[rgb(var(--clr-primary)/0.2)] shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <p className="font-bold text-xs text-slate-900">{cat.label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{cat.desc}</p>
          </button>
        ))}
      </div>

      {/* Couple vs Individual Toggle (Visible only for patients) */}
      {registrationType === 'patient' && (
        <div className="pt-3 border-t flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600">Patient Type:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSelectMode('couple')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                registrationMode === 'couple'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Couple (Wife & Husband)
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('individual')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                registrationMode === 'individual'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Individual Patient
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
