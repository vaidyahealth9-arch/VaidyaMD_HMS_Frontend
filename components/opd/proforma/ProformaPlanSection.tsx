'use client';

import React from 'react';
import { defaultWifeTests, defaultHusbandTests, defaultPendingHusband, defaultPendingWife, defaultFoods } from './proformaNarrative';
import { toggleArrayItem } from './types';
import { FlaskConical } from 'lucide-react';

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
  
  inline = false,
}: ProformaPlanSectionProps) {
  return (
    <>
      {/* Section 7 & 8: Investigations & Plan - Consolidated into Section 2 when inline */}
            {inline ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-[#2878a8] shrink-0" />
                  <span>
                    <strong>Investigations, Prescriptions &amp; Review Plan:</strong> Managed centrally in <strong>Section 2 (Assessment, Orders &amp; Management Plan)</strong> below to eliminate duplicate inputs.
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* Section 7: Recommended Basic Investigations Checklists */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                    7. Recommended Basic Investigations Checklist
                  </h3>

                  {/* Wife & Husband Checklists */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                      <span className="text-[11px] font-bold text-slate-800 block">
                        Wife - Recommended Tests
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
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                              recommendedWifeTests.includes(test)
                                ? 'bg-[#2878a8] text-white border-[#2878a8]'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {recommendedWifeTests.includes(test) ? '✓ ' : '+ '}
                            {test}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                      <span className="text-[11px] font-bold text-slate-800 block">
                        Husband - Recommended Tests
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
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                              recommendedHusbandTests.includes(test)
                                ? 'bg-[#2878a8] text-white border-[#2878a8]'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {recommendedHusbandTests.includes(test) ? '✓ ' : '+ '}
                            {test}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Semen & DFI Timings instructions */}
                  <div className="space-y-2 p-3 bg-amber-50/60 border border-amber-200/80 rounded-md">
                    <label className="flex items-start gap-2 text-xs font-semibold text-amber-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recSemenAnalysis}
                        onChange={(e) => setRecSemenAnalysis(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 border-amber-300 mt-0.5"
                      />
                      <span>
                        Semen analysis (Attend with 3 to 7 days abstinence, BY APPOINTMENT ONLY) Between
                        9 AM TO 11 AM
                      </span>
                    </label>
                    <label className="flex items-start gap-2 text-xs font-semibold text-amber-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recDfi}
                        onChange={(e) => setRecDfi(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 border-amber-300 mt-0.5"
                      />
                      <span>
                        Sperm DNA Fragmentation DFI (Attend with 2 days abstinence, BY APPOINTMENT ONLY)
                        Between 9 AM TO 11 AM
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
                        className="vmd-input text-xs"
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
                        placeholder="See with reports for and 3D scan + Smear/Speculum"
                        className="vmd-input text-xs"
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
                        className="vmd-input text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Gynaecology Specific Form Card */}
    </>
  );
}
