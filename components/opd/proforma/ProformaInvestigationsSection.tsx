'use client';

import React from 'react';
import { Plus, Trash2, Heart, User } from 'lucide-react';
import { CustomInvestigationRow } from './types';

interface ProformaInvestigationsSectionProps {
  invAmh: string;
  setInvAmh: (v: string) => void;
  invFsh?: string;
  setInvFsh?: (v: string) => void;
  invLh?: string;
  setInvLh?: (v: string) => void;
  invTsh: string;
  setInvTsh: (v: string) => void;
  invTubalPatency: string;
  setInvTubalPatency: (v: string) => void;
  invHysteroLap: string;
  setInvHysteroLap: (v: string) => void;
  invSemenAnalysis: string;
  setInvSemenAnalysis: (v: string) => void;
  invDfi: string;
  setInvDfi: (v: string) => void;
  fertilityTreatments: string;
  setFertilityTreatments: (v: string) => void;
  fertilityCounselingDone: string | boolean;
  setFertilityCounselingDone: (v: any) => void;
  femaleCustomInvestigations?: CustomInvestigationRow[];
  setFemaleCustomInvestigations?: (rows: CustomInvestigationRow[]) => void;
  maleCustomInvestigations?: CustomInvestigationRow[];
  setMaleCustomInvestigations?: (rows: CustomInvestigationRow[]) => void;
}

export default function ProformaInvestigationsSection({
  invAmh,
  setInvAmh,
  invTsh,
  setInvTsh,
  invTubalPatency,
  setInvTubalPatency,
  invHysteroLap,
  setInvHysteroLap,
  invSemenAnalysis,
  setInvSemenAnalysis,
  invDfi,
  setInvDfi,
  fertilityTreatments,
  setFertilityTreatments,
  fertilityCounselingDone,
  setFertilityCounselingDone,
  femaleCustomInvestigations = [],
  setFemaleCustomInvestigations,
  maleCustomInvestigations = [],
  setMaleCustomInvestigations,
}: ProformaInvestigationsSectionProps) {
  // Handlers for female custom manual investigation lines
  const handleAddFemaleTest = () => {
    if (setFemaleCustomInvestigations) {
      setFemaleCustomInvestigations([...femaleCustomInvestigations, { testName: '', result: '' }]);
    }
  };

  const handleUpdateFemaleTest = (index: number, field: keyof CustomInvestigationRow, value: string) => {
    if (setFemaleCustomInvestigations) {
      const updated = [...femaleCustomInvestigations];
      updated[index] = { ...updated[index], [field]: value };
      setFemaleCustomInvestigations(updated);
    }
  };

  const handleRemoveFemaleTest = (index: number) => {
    if (setFemaleCustomInvestigations) {
      setFemaleCustomInvestigations(femaleCustomInvestigations.filter((_, i) => i !== index));
    }
  };

  // Handlers for male custom manual investigation lines
  const handleAddMaleTest = () => {
    if (setMaleCustomInvestigations) {
      setMaleCustomInvestigations([...maleCustomInvestigations, { testName: '', result: '' }]);
    }
  };

  const handleUpdateMaleTest = (index: number, field: keyof CustomInvestigationRow, value: string) => {
    if (setMaleCustomInvestigations) {
      const updated = [...maleCustomInvestigations];
      updated[index] = { ...updated[index], [field]: value };
      setMaleCustomInvestigations(updated);
    }
  };

  const handleRemoveMaleTest = (index: number) => {
    if (setMaleCustomInvestigations) {
      setMaleCustomInvestigations(maleCustomInvestigations.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-4">
      {/* Section 5 Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
          5. Fertility Investigations &amp; Baseline Diagnostics (Separated by Partner)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PANEL 5A: FEMALE INVESTIGATIONS */}
        <div className="bg-rose-50/40 border border-rose-200/70 rounded-lg p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
            <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5 uppercase tracking-wide">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Female Investigations
            </span>
            <span className="text-[10px] text-rose-600 font-medium">Hormones &amp; Pelvic Patency</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                Serum AMH (ng/mL)
              </label>
              <input
                type="text"
                value={invAmh}
                onChange={(e) => setInvAmh(e.target.value)}
                placeholder="e.g. 2.8 ng/mL"
                className="vmd-input text-xs bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                TSH (mIU/L)
              </label>
              <input
                type="text"
                value={invTsh}
                onChange={(e) => setInvTsh(e.target.value)}
                placeholder="e.g. 1.8 mIU/L"
                className="vmd-input text-xs bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                Tubal Patency (HSG / HyCoSy)
              </label>
              <input
                type="text"
                value={invTubalPatency}
                onChange={(e) => setInvTubalPatency(e.target.value)}
                placeholder="e.g. Bilateral tubes patent"
                className="vmd-input text-xs bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                Hysteroscopy / Laparoscopy
              </label>
              <input
                type="text"
                value={invHysteroLap}
                onChange={(e) => setInvHysteroLap(e.target.value)}
                placeholder="e.g. Normal cavity / Not done"
                className="vmd-input text-xs bg-white"
              />
            </div>
          </div>

          {/* Blank / Manual Custom Female Tests (Replacing fixed FSH/LH) */}
          <div className="pt-2 border-t border-rose-200/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                Additional Female Tests (Manual Fill)
              </label>
              <button
                type="button"
                onClick={handleAddFemaleTest}
                className="text-[10px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Test
              </button>
            </div>

            {femaleCustomInvestigations.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">No additional female tests specified.</p>
            ) : (
              <div className="space-y-1.5">
                {femaleCustomInvestigations.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={row.testName}
                      onChange={(e) => handleUpdateFemaleTest(idx, 'testName', e.target.value)}
                      placeholder="Test name (e.g. PRL, E2, FSH, LH)..."
                      className="flex-1 vmd-input text-xs bg-white"
                    />
                    <input
                      type="text"
                      value={row.result}
                      onChange={(e) => handleUpdateFemaleTest(idx, 'result', e.target.value)}
                      placeholder="Value / Result..."
                      className="w-32 sm:w-36 vmd-input text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFemaleTest(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove test"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PANEL 5B: MALE INVESTIGATIONS */}
        <div className="bg-sky-50/40 border border-sky-200/70 rounded-lg p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-sky-200/60 pb-2">
            <span className="font-bold text-xs text-sky-900 flex items-center gap-1.5 uppercase tracking-wide">
              <User className="w-3.5 h-3.5 text-sky-600" />
              Male Investigations
            </span>
            <span className="text-[10px] text-sky-600 font-medium">Andrology &amp; Semen Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                Semen Analysis
              </label>
              <input
                type="text"
                value={invSemenAnalysis}
                onChange={(e) => setInvSemenAnalysis(e.target.value)}
                placeholder="e.g. Normozoospermia / Oligo..."
                className="vmd-input text-xs bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                Sperm DFI (%)
              </label>
              <input
                type="text"
                value={invDfi}
                onChange={(e) => setInvDfi(e.target.value)}
                placeholder="e.g. 14%"
                className="vmd-input text-xs bg-white"
              />
            </div>
          </div>

          {/* Blank / Manual Custom Male Tests */}
          <div className="pt-2 border-t border-sky-200/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                Additional Male Tests (Manual Fill)
              </label>
              <button
                type="button"
                onClick={handleAddMaleTest}
                className="text-[10px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Test
              </button>
            </div>

            {maleCustomInvestigations.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">No additional male tests specified.</p>
            ) : (
              <div className="space-y-1.5">
                {maleCustomInvestigations.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={row.testName}
                      onChange={(e) => handleUpdateMaleTest(idx, 'testName', e.target.value)}
                      placeholder="Test name (e.g. Testosterone, Karyotype)..."
                      className="flex-1 vmd-input text-xs bg-white"
                    />
                    <input
                      type="text"
                      value={row.result}
                      onChange={(e) => handleUpdateMaleTest(idx, 'result', e.target.value)}
                      placeholder="Value / Result..."
                      className="w-32 sm:w-36 vmd-input text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMaleTest(idx)}
                      className="p-1 text-slate-400 hover:text-sky-600 transition-colors"
                      title="Remove test"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PANEL 5C: PAST TREATMENTS & COUNSELING */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3.5 space-y-3">
        <label className="text-[10px] font-bold text-slate-700 block uppercase tracking-wide">
          Fertility Treatments (Past) &amp; Prior Cycles
        </label>
        <textarea
          rows={2}
          value={fertilityTreatments}
          onChange={(e) => setFertilityTreatments(e.target.value)}
          placeholder="e.g. Ovulation Induction 3 cycles elsewhere, no IUI/IVF yet..."
          className="vmd-input text-xs w-full bg-white"
        />
      </div>
    </div>
  );
}
