'use client';

import React from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { FlaskConical, Heart, User } from 'lucide-react';

interface CoupleInvestigationsBlockProps {
  femaleInv: string;
  maleInv: string;
  setValue: UseFormSetValue<any>;
  femaleName?: string;
  maleName?: string;
}

const FEMALE_INVESTIGATION_PRESETS = [
  'Serum AMH',
  'Serum TSH & Prolactin',
  'Baseline Pelvic USG / AFC',
  'Follicular Monitoring (TVS)',
  'Tubal Patency Test (SSG / HSG)',
  'Complete Blood Picture (CBP)',
  'Serum Estradiol (E2) & Progesterone',
  'Rubella IgG & Viral Markers',
];

const MALE_INVESTIGATION_PRESETS = [
  'Semen Analysis (CASA Standard)',
  'DNA Fragmentation Index (DFI)',
  'Semen Culture & Sensitivity',
  'Scrotal Doppler Ultrasound',
  'Serum Testosterone & FSH',
  'Karyotyping / Genetic Screen',
  'Post-ejaculatory Urine Analysis',
  'Viral Markers (HIV, HBsAg, HCV)',
];

export default function CoupleInvestigationsBlock({
  femaleInv,
  maleInv,
  setValue,
  femaleName = 'Female (Wife)',
  maleName = 'Male (Partner)',
}: CoupleInvestigationsBlockProps) {
  const handleToggleInv = (partner: 'female' | 'male', testName: string) => {
    const current = partner === 'female' ? femaleInv : maleInv;
    const lines = current.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const idx = lines.findIndex((l: string) => l.toLowerCase() === testName.toLowerCase());
    if (idx >= 0) {
      lines.splice(idx, 1);
    } else {
      lines.push(testName);
    }
    const newVal = lines.join('\n');
    if (partner === 'female') {
      setValue('female_investigations', newVal);
      setValue('investigations_to_be_advised', newVal);
    } else {
      setValue('male_investigations', newVal);
    }
  };

  return (
    <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200 space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-primary" />
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Fertility Couple Investigations (Separate Advised Orders)
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Female Investigations */}
        <div className="bg-white p-3 rounded-lg border border-rose-200/80 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Female Investigations — {femaleName}</span>
            </span>
            <span className="text-[10px] text-rose-600 font-medium">Click to select</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {FEMALE_INVESTIGATION_PRESETS.map((t) => {
              const isSel = femaleInv.toLowerCase().includes(t.toLowerCase());
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleToggleInv('female', t)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                    isSel
                      ? 'bg-rose-500 text-white border-rose-600 font-bold shadow-2xs'
                      : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {isSel ? `✓ ${t}` : `+ ${t}`}
                </button>
              );
            })}
          </div>
          <textarea
            value={femaleInv}
            onChange={(e) => {
              setValue('female_investigations', e.target.value);
              setValue('investigations_to_be_advised', e.target.value);
            }}
            rows={3}
            placeholder="Selected female tests appear here or enter custom..."
            className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-400"
          />
        </div>

        {/* Male Investigations */}
        <div className="bg-white p-3 rounded-lg border border-blue-200/80 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span>Male Investigations — {maleName}</span>
            </span>
            <span className="text-[10px] text-blue-600 font-medium">Click to select</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {MALE_INVESTIGATION_PRESETS.map((t) => {
              const isSel = maleInv.toLowerCase().includes(t.toLowerCase());
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleToggleInv('male', t)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                    isSel
                      ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-2xs'
                      : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  {isSel ? `✓ ${t}` : `+ ${t}`}
                </button>
              );
            })}
          </div>
          <textarea
            value={maleInv}
            onChange={(e) => setValue('male_investigations', e.target.value)}
            rows={3}
            placeholder="Selected male tests appear here or enter custom..."
            className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>
    </div>
  );
}
