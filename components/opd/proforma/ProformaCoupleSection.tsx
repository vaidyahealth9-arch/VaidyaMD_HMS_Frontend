'use client';

import React from 'react';

interface ProformaCoupleSectionProps {
  activeTab: 'fertility' | 'gynaecology' | 'obstetric';
  fertilityType: string;
  setFertilityType: (v: string) => void;
  fertilityFactor: string;
  setFertilityFactor: (v: string) => void;
  marriedInYear: string;
  setMarriedInYear: (v: string) => void;
  tryingForPregnancy: string;
  setTryingForPregnancy: (v: string) => void;
  consanguinity: string;
  setConsanguinity: (v: string) => void;
}

export default function ProformaCoupleSection({
  activeTab,
  fertilityType,
  setFertilityType,
  fertilityFactor,
  setFertilityFactor,
  marriedInYear,
  setMarriedInYear,
  tryingForPregnancy,
  setTryingForPregnancy,
  consanguinity,
  setConsanguinity,
}: ProformaCoupleSectionProps) {
  return (
    <>
      {/* Section 2: Couple Fertility Infertility Status */}
            {activeTab === 'fertility' && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                  2. Couple Infertility Profile
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Primary / Secondary
                    </label>
                    <select
                      value={fertilityType}
                      onChange={(e) => setFertilityType(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="">Select Infertility Type...</option>
                      <option value="Primary">Primary Infertility</option>
                      <option value="Secondary">Secondary Infertility</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Male / Female / Couple
                    </label>
                    <select
                      value={fertilityFactor}
                      onChange={(e) => setFertilityFactor(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="">Select Infertility Factor...</option>
                      <option value="Couple">Couple Factor</option>
                      <option value="Female">Female Factor</option>
                      <option value="Male">Male Factor</option>
                      <option value="Unexplained">Unexplained</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Married in year
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2021"
                      value={marriedInYear}
                      onChange={(e) => setMarriedInYear(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Trying for pregnancy (yrs)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3 years"
                      value={tryingForPregnancy}
                      onChange={(e) => setTryingForPregnancy(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Consanguinity
                    </label>
                    <select
                      value={consanguinity}
                      onChange={(e) => setConsanguinity(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="">Select Consanguinity...</option>
                      <option value="Non-Consanguineous">Non-Consanguineous</option>
                      <option value="Consanguineous (1st Degree)">Consanguineous (1st Degree)</option>
                      <option value="Consanguineous (2nd Degree)">Consanguineous (2nd Degree)</option>
                      <option value="Consanguineous">Consanguineous</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
    </>
  );
}
