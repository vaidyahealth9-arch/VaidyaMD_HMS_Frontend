'use client';

import React from 'react';
import { defaultWifeTests, defaultHusbandTests, defaultPendingHusband, defaultPendingWife, defaultFoods } from './proformaNarrative';
import { toggleArrayItem, MedicationRow } from './types';
import { Plus, Trash2, Heart, User, Pill } from 'lucide-react';
import MedicineAutocompleteInput from '../MedicineAutocompleteInput';

interface ProformaPlanSectionProps {
  inline?: boolean;
  factorsInFavour: string;
  setFactorsInFavour: (v: string) => void;
  factorsNotInFavour: string;
  setFactorsNotInFavour: (v: string) => void;
  recommendedWifeTests: string[];
  setRecommendedWifeTests: React.Dispatch<React.SetStateAction<string[]>>;
  recommendedHusbandTests: string[];
  setRecommendedHusbandTests: React.Dispatch<React.SetStateAction<string[]>>;
  recSemenAnalysis: boolean;
  setRecSemenAnalysis: (v: boolean) => void;
  recDfi: boolean;
  setRecDfi: (v: boolean) => void;
  pendingHusbandTests: string[];
  setPendingHusbandTests: React.Dispatch<React.SetStateAction<string[]>>;
  pendingWifeTests: string[];
  setPendingWifeTests: React.Dispatch<React.SetStateAction<string[]>>;
  fertilityFoods: string[];
  setFertilityFoods: React.Dispatch<React.SetStateAction<string[]>>;
  fertilitySupplements: string;
  setFertilitySupplements: (v: string) => void;
  followUpPlan: string;
  setFollowUpPlan: (v: string) => void;
  finalDiagnosis: string;
  setFinalDiagnosis: (v: string) => void;
  femaleMedications?: MedicationRow[];
  setFemaleMedications?: React.Dispatch<React.SetStateAction<MedicationRow[]>>;
  maleMedications?: MedicationRow[];
  setMaleMedications?: React.Dispatch<React.SetStateAction<MedicationRow[]>>;
}

export default function ProformaPlanSection({
  factorsInFavour,
  setFactorsInFavour,
  factorsNotInFavour,
  setFactorsNotInFavour,
  recommendedWifeTests,
  setRecommendedWifeTests,
  recommendedHusbandTests,
  setRecommendedHusbandTests,
  recSemenAnalysis,
  setRecSemenAnalysis,
  recDfi,
  setRecDfi,
  pendingHusbandTests,
  setPendingHusbandTests,
  pendingWifeTests,
  setPendingWifeTests,
  fertilityFoods,
  setFertilityFoods,
  fertilitySupplements,
  setFertilitySupplements,
  followUpPlan,
  setFollowUpPlan,
  finalDiagnosis,
  setFinalDiagnosis,
  femaleMedications = [],
  setFemaleMedications,
  maleMedications = [],
  setMaleMedications,
  inline = false,
}: ProformaPlanSectionProps) {
  // Female Medication table handlers
  const handleAddFemaleMed = () => {
    if (setFemaleMedications) {
      setFemaleMedications([
        ...femaleMedications,
        { drug: '', dose: '', route: 'Oral', frequency: 'OD', duration: '', instructions: '' },
      ]);
    }
  };

  const handleUpdateFemaleMed = (index: number, field: keyof MedicationRow, value: string) => {
    if (setFemaleMedications) {
      const updated = [...femaleMedications];
      updated[index] = { ...updated[index], [field]: value };
      setFemaleMedications(updated);
    }
  };

  const handleRemoveFemaleMed = (index: number) => {
    if (setFemaleMedications) {
      setFemaleMedications(femaleMedications.filter((_, i) => i !== index));
    }
  };

  // Male Medication table handlers
  const handleAddMaleMed = () => {
    if (setMaleMedications) {
      setMaleMedications([
        ...maleMedications,
        { drug: '', dose: '', route: 'Oral', frequency: 'OD', duration: '', instructions: '' },
      ]);
    }
  };

  const handleUpdateMaleMed = (index: number, field: keyof MedicationRow, value: string) => {
    if (setMaleMedications) {
      const updated = [...maleMedications];
      updated[index] = { ...updated[index], [field]: value };
      setMaleMedications(updated);
    }
  };

  const handleRemoveMaleMed = (index: number) => {
    if (setMaleMedications) {
      setMaleMedications(maleMedications.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-4">
      {/* Section 7: Recommended Basic Investigations Checklist */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
          7. Recommended Basic Investigations Checklist
        </h3>

        {/* Wife & Husband Checklists */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-500" /> Wife - Recommended Tests
            </span>
            <div className="flex flex-wrap gap-1.5">
              {defaultWifeTests.map((test) => (
                <button
                  key={test}
                  type="button"
                  onClick={() =>
                    toggleArrayItem(
                      recommendedWifeTests,
                      setRecommendedWifeTests,
                      test
                    )
                  }
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    recommendedWifeTests.includes(test)
                      ? 'bg-[#2878a8] text-white border-[#2878a8]'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {recommendedWifeTests.includes(test) ? '✓ ' : '+ '}
                  {test}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
              <User className="w-3 h-3 text-sky-600" /> Husband - Recommended Tests
            </span>
            <div className="flex flex-wrap gap-1.5">
              {defaultHusbandTests.map((test) => (
                <button
                  key={test}
                  type="button"
                  onClick={() =>
                    toggleArrayItem(
                      recommendedHusbandTests,
                      setRecommendedHusbandTests,
                      test
                    )
                  }
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    recommendedHusbandTests.includes(test)
                      ? 'bg-[#2878a8] text-white border-[#2878a8]'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {recommendedHusbandTests.includes(test) ? '✓ ' : '+ '}
                  {test}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Andrology instructions */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md space-y-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={recSemenAnalysis}
              onChange={(e) => setRecSemenAnalysis(e.target.checked)}
              className="rounded text-[#2878a8]"
            />
            <span className="font-semibold text-slate-800">
              Semen analysis (Attend with 3 to 7 days abstinence, BY APPOINTMENT ONLY) Between 9 AM TO 11 AM
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={recDfi}
              onChange={(e) => setRecDfi(e.target.checked)}
              className="rounded text-[#2878a8]"
            />
            <span className="font-semibold text-slate-800">
              Sperm DNA Fragmentation DFI (Attend with 2 days abstinence, BY APPOINTMENT ONLY) Between 9 AM TO 11 AM
            </span>
          </label>
        </div>

        {/* Pending Pre-op / Serology Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
            <span className="text-[11px] font-bold text-slate-800 block">
              Pending - Husband Panel
            </span>
            <div className="flex flex-wrap gap-1">
              {defaultPendingHusband.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    toggleArrayItem(
                      pendingHusbandTests,
                      setPendingHusbandTests,
                      p
                    )
                  }
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                    pendingHusbandTests.includes(p)
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
            <span className="text-[11px] font-bold text-slate-800 block">
              Pending - Wife Panel
            </span>
            <div className="flex flex-wrap gap-1">
              {defaultPendingWife.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    toggleArrayItem(pendingWifeTests, setPendingWifeTests, p)
                  }
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                    pendingWifeTests.includes(p)
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 8: Advised Fertility Foods, Supplements & Follow-up */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
          8. Advised Regimen, Foods &amp; Review Plan
        </h3>

        <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
          <span className="text-[11px] font-bold text-slate-700 block">
            Fertility Foods
          </span>
          <div className="flex flex-wrap gap-1.5">
            {defaultFoods.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleArrayItem(fertilityFoods, setFertilityFoods, f)}
                className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                  fertilityFoods.includes(f)
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {fertilityFoods.includes(f) ? '✓ ' : '+ '}
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
              Fertility Supplements
            </label>
            <input
              type="text"
              value={fertilitySupplements}
              onChange={(e) => setFertilitySupplements(e.target.value)}
              placeholder="Antioxidants, CoQ10, Folic Acid, Vitamin D3"
              className="vmd-input text-xs bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
              Review Plan
            </label>
            <input
              type="text"
              value={followUpPlan}
              onChange={(e) => setFollowUpPlan(e.target.value)}
              placeholder="See with reports for 3D scan + Smear/Speculum"
              className="vmd-input text-xs bg-white"
            />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
              Provisional Diagnosis <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={finalDiagnosis}
              onChange={(e) => setFinalDiagnosis(e.target.value)}
              placeholder="Provisional Diagnosis"
              className="vmd-input text-xs font-bold text-slate-900 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Section 9: Couple Prescribed Medications (Separated for Female and Male) */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8] flex items-center gap-1.5">
            <Pill className="w-4 h-4 text-[#2878a8]" />
            9. Prescribed Medications (Male &amp; Female Separated Columns)
          </h3>
          <span className="text-[10px] text-slate-500 font-medium">Type few letters to search pharmacy medicines</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Female Medications Column */}
          <div className="bg-rose-50/30 border border-rose-200 rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between border-b border-rose-200 pb-2">
              <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5 uppercase">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Female Medications
              </span>
              <button
                type="button"
                onClick={handleAddFemaleMed}
                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Female Med
              </button>
            </div>

            {femaleMedications.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-2 text-center">
                No female medications added yet. Click &quot;Add Female Med&quot; to prescribe.
              </p>
            ) : (
              <div className="space-y-2">
                {femaleMedications.map((med, idx) => (
                  <div key={idx} className="p-2.5 bg-white border border-rose-100 rounded-md shadow-2xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                          Drug / Medicine Name
                        </label>
                        <MedicineAutocompleteInput
                          id={`female-med-${idx}`}
                          value={med.drug}
                          onChange={(val) => handleUpdateFemaleMed(idx, 'drug', val)}
                          placeholder="Type 2+ letters (e.g. Tab Susten, Letroz)..."
                          className="w-full bg-slate-50/50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFemaleMed(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors mt-4"
                        title="Delete medication"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block">Dose</label>
                        <input
                          type="text"
                          value={med.dose}
                          onChange={(e) => handleUpdateFemaleMed(idx, 'dose', e.target.value)}
                          placeholder="e.g. 2.5mg"
                          className="w-full bg-slate-50/50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block">Route</label>
                        <select
                          value={med.route || 'Oral'}
                          onChange={(e) => handleUpdateFemaleMed(idx, 'route', e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                        >
                          <option value="Oral">Oral</option>
                          <option value="Vaginal">Vaginal</option>
                          <option value="SC">Subcutaneous</option>
                          <option value="IM">Intramuscular</option>
                          <option value="Topical">Topical</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block">Frequency</label>
                        <select
                          value={med.frequency || 'OD'}
                          onChange={(e) => handleUpdateFemaleMed(idx, 'frequency', e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                        >
                          <option value="OD">OD (Once daily)</option>
                          <option value="BD">BD (Twice daily)</option>
                          <option value="TDS">TDS (Thrice daily)</option>
                          <option value="QID">QID (4 times daily)</option>
                          <option value="SOS">SOS (As needed)</option>
                          <option value="Stat">Stat (Immediately)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block">Duration</label>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => handleUpdateFemaleMed(idx, 'duration', e.target.value)}
                          placeholder="e.g. 5 days"
                          className="w-full bg-slate-50/50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block">Instructions</label>
                      <input
                        type="text"
                        value={med.instructions || ''}
                        onChange={(e) => handleUpdateFemaleMed(idx, 'instructions', e.target.value)}
                        placeholder="e.g. Day 2 to Day 6 of menses, after food"
                        className="w-full bg-slate-50/50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Male Medications Column */}
          <div className="bg-sky-50/30 border border-sky-200 rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between border-b border-sky-200 pb-2">
              <span className="font-bold text-xs text-sky-900 flex items-center gap-1.5 uppercase">
                <User className="w-3.5 h-3.5 text-sky-600" />
                Male Medications
              </span>
              <button
                type="button"
                onClick={handleAddMaleMed}
                className="px-2 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Male Med
              </button>
            </div>

            {maleMedications.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-2 text-center">
                No male medications added yet. Click &quot;Add Male Med&quot; to prescribe.
              </p>
            ) : (
              <div className="space-y-2">
                {maleMedications.map((med, idx) => (
                  <div key={idx} className="p-2.5 bg-white border border-sky-100 rounded-md shadow-2xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                          Drug / Medicine Name
                        </label>
                        <MedicineAutocompleteInput
                          id={`male-med-${idx}`}
                          value={med.drug}
                          onChange={(val) => handleUpdateMaleMed(idx, 'drug', val)}
                          placeholder="Type 2+ letters (e.g. CoQ10, Tab Doxy)..."
                          className="w-full bg-slate-50/50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaleMed(idx)}
                        className="p-1 text-slate-400 hover:text-sky-700 transition-colors mt-4"
                        title="Delete medication"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block">Dose</label>
                        <input
                          type="text"
                          value={med.dose}
                          onChange={(e) => handleUpdateMaleMed(idx, 'dose', e.target.value)}
                          placeholder="e.g. 100mg"
                          className="w-full bg-slate-50/50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block">Route</label>
                        <select
                          value={med.route || 'Oral'}
                          onChange={(e) => handleUpdateMaleMed(idx, 'route', e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                        >
                          <option value="Oral">Oral</option>
                          <option value="IM">Intramuscular</option>
                          <option value="SC">Subcutaneous</option>
                          <option value="Topical">Topical</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block">Frequency</label>
                        <select
                          value={med.frequency || 'OD'}
                          onChange={(e) => handleUpdateMaleMed(idx, 'frequency', e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                        >
                          <option value="OD">OD (Once daily)</option>
                          <option value="BD">BD (Twice daily)</option>
                          <option value="TDS">TDS (Thrice daily)</option>
                          <option value="SOS">SOS (As needed)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block">Duration</label>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => handleUpdateMaleMed(idx, 'duration', e.target.value)}
                          placeholder="e.g. 3 months"
                          className="w-full bg-slate-50/50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block">Instructions</label>
                      <input
                        type="text"
                        value={med.instructions || ''}
                        onChange={(e) => handleUpdateMaleMed(idx, 'instructions', e.target.value)}
                        placeholder="e.g. After breakfast daily"
                        className="w-full bg-slate-50/50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
