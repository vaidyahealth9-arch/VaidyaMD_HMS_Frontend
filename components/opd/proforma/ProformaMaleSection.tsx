'use client';

import React from 'react';

interface ProformaMaleSectionProps {
  inline?: boolean;
  activeTab: 'fertility' | 'gynaecology' | 'obstetric';
  maleName: string;
  setMaleName: (v: string) => void;
  maleProfession: string;
  setMaleProfession: (v: string) => void;
  maleWeight: string;
  setMaleWeight: (v: string) => void;
  maleBmi: string;
  setMaleBmi: (v: string) => void;
  malePallor: string;
  setMalePallor: (v: string) => void;
  malePedalEdema: string;
  setMalePedalEdema: (v: string) => void;
  maleBp: string;
  setMaleBp: (v: string) => void;
  frequencyIntercourse: string;
  setFrequencyIntercourse: (v: string) => void;
  maleLastSi: string;
  setMaleLastSi: (v: string) => void;
  maleErectileIssues: string;
  setMaleErectileIssues: (v: string) => void;
  maleDyspareunia: string;
  setMaleDyspareunia: (v: string) => void;
  maleScrotalInjury: string;
  setMaleScrotalInjury: (v: string) => void;
  maleMumps: string;
  setMaleMumps: (v: string) => void;
  maleSmoking: string;
  setMaleSmoking: (v: string) => void;
  maleGutka: string;
  setMaleGutka: (v: string) => void;
  maleAlcohol: string;
  setMaleAlcohol: (v: string) => void;
  maleToddy: string;
  setMaleToddy: (v: string) => void;
  maleCoffee: string;
  setMaleCoffee: (v: string) => void;
  maleAdmissions: string;
  setMaleAdmissions: (v: string) => void;
  maleRegularMed: string;
  setMaleRegularMed: (v: string) => void;
  maleTb: string;
  setMaleTb: (v: string) => void;
  maleAllergies: string;
  setMaleAllergies: (v: string) => void;
  malePastSurgical: string;
  setMalePastSurgical: (v: string) => void;
  maleFamilyHistory: string[];
  setMaleFamilyHistory: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function ProformaMaleSection({
  activeTab,
  maleName,
  setMaleName,
  maleProfession,
  setMaleProfession,
  maleWeight,
  setMaleWeight,
  maleBmi,
  setMaleBmi,
  malePallor,
  setMalePallor,
  malePedalEdema,
  setMalePedalEdema,
  maleBp,
  setMaleBp,
  frequencyIntercourse,
  setFrequencyIntercourse,
  maleLastSi,
  setMaleLastSi,
  maleErectileIssues,
  setMaleErectileIssues,
  maleDyspareunia,
  setMaleDyspareunia,
  maleScrotalInjury,
  setMaleScrotalInjury,
  maleMumps,
  setMaleMumps,
  maleSmoking,
  setMaleSmoking,
  maleGutka,
  setMaleGutka,
  maleAlcohol,
  setMaleAlcohol,
  maleToddy,
  setMaleToddy,
  maleCoffee,
  setMaleCoffee,
  maleAdmissions,
  setMaleAdmissions,
  maleRegularMed,
  setMaleRegularMed,
  maleTb,
  setMaleTb,
  maleAllergies,
  setMaleAllergies,
  malePastSurgical,
  setMalePastSurgical,
  maleFamilyHistory,
  setMaleFamilyHistory,
  inline = false,
}: ProformaMaleSectionProps) {
  return (
    <>
      {/* Section 4: Male Partner Assessment (Fertility Tab) */}
            {activeTab === 'fertility' && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                  {inline ? 'Male Clinical Assessment' : '4. Male Partner Assessment'}
                </h3>
                {!inline && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Male Name
                      </label>
                      <input
                        type="text"
                        value={maleName}
                        onChange={(e) => setMaleName(e.target.value)}
                        className="vmd-input text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Profession
                      </label>
                      <input
                        type="text"
                        value={maleProfession}
                        onChange={(e) => setMaleProfession(e.target.value)}
                        placeholder="Profession"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={maleWeight}
                        onChange={(e) => setMaleWeight(e.target.value)}
                        placeholder="kg"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">BMI</label>
                      <input
                        type="text"
                        value={maleBmi}
                        onChange={(e) => setMaleBmi(e.target.value)}
                        placeholder="BMI"
                        className="vmd-input text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Male Sexual History */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    REPRODUCTIVE &amp; SEXUAL HISTORY
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Problems with erection / ejaculation?
                      </label>
                      <select
                        value={maleErectileIssues}
                        onChange={(e) => setMaleErectileIssues(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="">Select...</option>
                        <option value="No">No</option>
                        <option value="Erection Issues">Erection Issues</option>
                        <option value="Premature Ejaculation">Premature Ejaculation</option>
                        <option value="Delayed Ejaculation">Delayed Ejaculation</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Frequency of intercourse / week
                      </label>
                      <input
                        type="text"
                        value={frequencyIntercourse}
                        onChange={(e) => setFrequencyIntercourse(e.target.value)}
                        placeholder="2-3 times"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Pain during sexual intercourse?
                      </label>
                      <select
                        value={maleDyspareunia}
                        onChange={(e) => setMaleDyspareunia(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="">Select...</option>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Last SI</label>
                      <input
                        type="text"
                        value={maleLastSi}
                        onChange={(e) => setMaleLastSi(e.target.value)}
                        placeholder="e.g. 2 days ago"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Injuries in groin / scrotum
                      </label>
                      <select
                        value={maleScrotalInjury}
                        onChange={(e) => setMaleScrotalInjury(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="">Select...</option>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Mumps in past / child
                      </label>
                      <select
                        value={maleMumps}
                        onChange={(e) => setMaleMumps(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="">Select...</option>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Male Habits */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    MALE HABITS / LIFESTYLE
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Smoking</label>
                      <select
                        value={maleSmoking}
                        onChange={(e) => setMaleSmoking(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="">Select...</option>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Gutka</label>
                      <select
                        value={maleGutka}
                        onChange={(e) => setMaleGutka(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="">Select...</option>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Alcohol</label>
                      <select
                        value={maleAlcohol}
                        onChange={(e) => setMaleAlcohol(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="">Select...</option>
                        <option value="No">No</option>
                        <option value="Social">Social</option>
                        <option value="Regular">Regular</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Toddy</label>
                      <select
                        value={maleToddy}
                        onChange={(e) => setMaleToddy(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="">Select...</option>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Coffee</label>
                      <select
                        value={maleCoffee}
                        onChange={(e) => setMaleCoffee(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="">Select...</option>
                        <option value="None">None</option>
                        <option value="1 cup/day">1 cup/day</option>
                        <option value="2 cups/day">2 cups/day</option>
                        <option value=">2 cups/day">&gt; 2 cups/day</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Male Medical & Examination */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    PAST MEDICAL, SURGICAL &amp; EXAMINATION (MALE)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Hospital admissions
                      </label>
                      <input
                        type="text"
                        value={maleAdmissions}
                        onChange={(e) => setMaleAdmissions(e.target.value)}
                        placeholder="Nil"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Regular medication
                      </label>
                      <input
                        type="text"
                        value={maleRegularMed}
                        onChange={(e) => setMaleRegularMed(e.target.value)}
                        placeholder="None"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        History of TB
                      </label>
                      <select
                        value={maleTb}
                        onChange={(e) => setMaleTb(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="">Select...</option>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Allergies</label>
                      <input
                        type="text"
                        value={maleAllergies}
                        onChange={(e) => setMaleAllergies(e.target.value)}
                        placeholder="NKDA"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Past Surgical History
                      </label>
                      <input
                        type="text"
                        value={malePastSurgical}
                        onChange={(e) => setMalePastSurgical(e.target.value)}
                        placeholder="Nil"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">O/E Pallor</label>
                      <select
                        value={malePallor}
                        onChange={(e) => setMalePallor(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="">Select...</option>
                        <option value="No">No pallor</option>
                        <option value="Present">Pallor present</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">
                        Pedal edema
                      </label>
                      <select
                        value={malePedalEdema}
                        onChange={(e) => setMalePedalEdema(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="">Select...</option>
                        <option value="No">No pedal edema</option>
                        <option value="Present">Pedal edema</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">BP (mm Hg)</label>
                      <input
                        type="text"
                        value={maleBp}
                        onChange={(e) => setMaleBp(e.target.value)}
                        placeholder="120/80"
                        className="vmd-input text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
    </>
  );
}
