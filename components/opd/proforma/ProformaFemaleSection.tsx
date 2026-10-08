'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ObstetricRow, toggleArrayItem } from './types';

interface ProformaFemaleSectionProps {
  inline?: boolean;
  contraceptionHistory: string;
  setContraceptionHistory: (v: string) => void;
  femaleName: string;
  setFemaleName: (v: string) => void;
  femaleProfession: string;
  setFemaleProfession: (v: string) => void;
  femaleWeight: string;
  setFemaleWeight: (v: string) => void;
  femaleBmi: string;
  setFemaleBmi: (v: string) => void;
  femalePallor: string;
  setFemalePallor: (v: string) => void;
  femalePedalEdema: string;
  setFemalePedalEdema: (v: string) => void;
  femaleGoitre: string;
  setFemaleGoitre: (v: string) => void;
  femaleBp: string;
  setFemaleBp: (v: string) => void;
  periodsEvery: string;
  setPeriodsEvery: (v: string) => void;
  durationBleeding: string;
  setDurationBleeding: (v: string) => void;
  lmp: string;
  setLmp: (v: string) => void;
  periodsPainful: string;
  setPeriodsPainful: (v: string) => void;
  periodsHeavy: string;
  setPeriodsHeavy: (v: string) => void;
  ageAtMenarche: string;
  setAgeAtMenarche: (v: string) => void;
  menstrualAdditional: string;
  setMenstrualAdditional: (v: string) => void;
  gpal: string;
  setGpal: (v: string) => void;
  obRows: ObstetricRow[];
  setObRows: React.Dispatch<React.SetStateAction<ObstetricRow[]>>;
  addObRow: () => void;
  removeObRow: (idx: number) => void;
  femaleSmoking: string;
  setFemaleSmoking: (v: string) => void;
  femaleGutka: string;
  setFemaleGutka: (v: string) => void;
  femaleAlcohol: string;
  setFemaleAlcohol: (v: string) => void;
  femaleToddy: string;
  setFemaleToddy: (v: string) => void;
  femaleCoffee: string;
  setFemaleCoffee: (v: string) => void;
  femaleAdmissions: string;
  setFemaleAdmissions: (v: string) => void;
  femaleRegularMed: string;
  setFemaleRegularMed: (v: string) => void;
  femaleTb: string;
  setFemaleTb: (v: string) => void;
  femaleBleedingDisorders: string;
  setFemaleBleedingDisorders: (v: string) => void;
  femaleGalactorrhoea: string;
  setFemaleGalactorrhoea: (v: string) => void;
  femaleAllergies: string;
  setFemaleAllergies: (v: string) => void;
  femaleCervicalSmear: string;
  setFemaleCervicalSmear: (v: string) => void;
  femalePastSurgical: string;
  setFemalePastSurgical: (v: string) => void;
  femaleFamilyHistory: string[];
  setFemaleFamilyHistory: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function ProformaFemaleSection({
  femaleName,
  setFemaleName,
  femaleProfession,
  setFemaleProfession,
  femaleWeight,
  setFemaleWeight,
  femaleBmi,
  setFemaleBmi,
  femalePallor,
  setFemalePallor,
  femalePedalEdema,
  setFemalePedalEdema,
  femaleGoitre,
  setFemaleGoitre,
  femaleBp,
  setFemaleBp,
  periodsEvery,
  setPeriodsEvery,
  durationBleeding,
  setDurationBleeding,
  lmp,
  setLmp,
  periodsPainful,
  setPeriodsPainful,
  periodsHeavy,
  setPeriodsHeavy,
  ageAtMenarche,
  setAgeAtMenarche,
  menstrualAdditional,
  setMenstrualAdditional,
  gpal,
  setGpal,
  obRows,
  setObRows,
  addObRow,
  removeObRow,
  femaleSmoking,
  setFemaleSmoking,
  femaleGutka,
  setFemaleGutka,
  femaleAlcohol,
  setFemaleAlcohol,
  femaleToddy,
  setFemaleToddy,
  femaleCoffee,
  setFemaleCoffee,
  femaleAdmissions,
  setFemaleAdmissions,
  femaleRegularMed,
  setFemaleRegularMed,
  femaleTb,
  setFemaleTb,
  femaleBleedingDisorders,
  setFemaleBleedingDisorders,
  femaleGalactorrhoea,
  setFemaleGalactorrhoea,
  femaleAllergies,
  setFemaleAllergies,
  femaleCervicalSmear,
  setFemaleCervicalSmear,
  femalePastSurgical,
  setFemalePastSurgical,
  femaleFamilyHistory,
  setFemaleFamilyHistory,
  inline = false,
  contraceptionHistory,
  setContraceptionHistory,
}: ProformaFemaleSectionProps) {
  return (
    <>
      {/* Section 3: Female Partner Assessment */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                {inline ? 'Female Clinical Assessment' : '3. Female Partner Assessment'}
              </h3>
              {!inline && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Female Name
                    </label>
                    <input
                      type="text"
                      value={femaleName}
                      onChange={(e) => setFemaleName(e.target.value)}
                      className="vmd-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Profession
                    </label>
                    <input
                      type="text"
                      value={femaleProfession}
                      onChange={(e) => setFemaleProfession(e.target.value)}
                      placeholder="e.g. Teacher, Engineer"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={femaleWeight}
                      onChange={(e) => setFemaleWeight(e.target.value)}
                      placeholder="kg"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">BMI</label>
                    <input
                      type="text"
                      value={femaleBmi}
                      onChange={(e) => setFemaleBmi(e.target.value)}
                      placeholder="e.g. 23.4"
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Menstrual History */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  MENSTRUAL HISTORY
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Periods every (days)
                    </label>
                    <input
                      type="text"
                      value={periodsEvery}
                      onChange={(e) => setPeriodsEvery(e.target.value)}
                      placeholder="28-30"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Duration bleeding (days)
                    </label>
                    <input
                      type="text"
                      value={durationBleeding}
                      onChange={(e) => setDurationBleeding(e.target.value)}
                      placeholder="4-5"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Periods painful?
                    </label>
                    <select
                      value={periodsPainful}
                      onChange={(e) => setPeriodsPainful(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="">Select...</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes (Dysmenorrhea)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Periods heavy?
                    </label>
                    <select
                      value={periodsHeavy}
                      onChange={(e) => setPeriodsHeavy(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="">Select...</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes (Menorrhagia)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Age at menarche
                    </label>
                    <input
                      type="text"
                      value={ageAtMenarche}
                      onChange={(e) => setAgeAtMenarche(e.target.value)}
                      placeholder="13"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">LMP</label>
                    <input
                      type="date"
                      value={lmp}
                      onChange={(e) => setLmp(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Obstetric & Contraception */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      OBSTETRIC HISTORY
                    </span>
                    <input
                      type="text"
                      value={gpal}
                      onChange={(e) => setGpal(e.target.value)}
                      placeholder="G0 P0 L0 A0"
                      className="vmd-input text-xs w-36 h-7"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-500 text-[10px] border-b border-slate-200">
                          <th className="p-1 text-left">Year</th>
                          <th className="p-1 text-left">Place</th>
                          <th className="p-1 text-left">Outcome</th>
                          <th className="p-1 w-6"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {obRows.map((r, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="p-1">
                              <input
                                type="text"
                                placeholder="Year"
                                value={r.year}
                                onChange={(e) => {
                                  const c = [...obRows];
                                  c[i].year = e.target.value;
                                  setObRows(c);
                                }}
                                className="vmd-input text-xs h-7"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                placeholder="Place"
                                value={r.place}
                                onChange={(e) => {
                                  const c = [...obRows];
                                  c[i].place = e.target.value;
                                  setObRows(c);
                                }}
                                className="vmd-input text-xs h-7"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                placeholder="Full Term / Miscarriage"
                                value={r.outcome}
                                onChange={(e) => {
                                  const c = [...obRows];
                                  c[i].outcome = e.target.value;
                                  setObRows(c);
                                }}
                                className="vmd-input text-xs h-7"
                              />
                            </td>
                            <td className="p-1 text-center">
                              <button
                                type="button"
                                onClick={() => removeObRow(i)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={addObRow}
                    className="text-[10px] text-[#2878a8] font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add Pregnancy Row
                  </button>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    CONTRACEPTION HISTORY
                  </span>
                  <input
                    type="text"
                    value={contraceptionHistory}
                    onChange={(e) => setContraceptionHistory(e.target.value)}
                    placeholder="e.g. None / Barrier method / OCPs used 1 yr ago"
                    className="vmd-input text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['None', 'Barrier / Condom', 'Oral Contraceptives', 'IUD / Cu-T', 'Natural'].map(
                      (opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setContraceptionHistory(opt)}
                          className="px-2 py-0.5 rounded bg-slate-100 text-[10px] hover:bg-slate-200 text-slate-700"
                        >
                          {opt}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Female Habits: Smoking, Gutka, Alcohol, Toddy, Coffee */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  FEMALE HABITS / LIFESTYLE
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Smoking</label>
                    <select
                      value={femaleSmoking}
                      onChange={(e) => setFemaleSmoking(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="">Select...</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                      <option value="Ex-smoker">Ex-smoker</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Gutka</label>
                    <select
                      value={femaleGutka}
                      onChange={(e) => setFemaleGutka(e.target.value)}
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
                      value={femaleAlcohol}
                      onChange={(e) => setFemaleAlcohol(e.target.value)}
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
                      value={femaleToddy}
                      onChange={(e) => setFemaleToddy(e.target.value)}
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
                      value={femaleCoffee}
                      onChange={(e) => setFemaleCoffee(e.target.value)}
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

              {/* Female Past Medical History */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  PAST MEDICAL HISTORY (FEMALE)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Hospital admissions (Non-surgical)
                    </label>
                    <input
                      type="text"
                      value={femaleAdmissions}
                      onChange={(e) => setFemaleAdmissions(e.target.value)}
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
                      value={femaleRegularMed}
                      onChange={(e) => setFemaleRegularMed(e.target.value)}
                      placeholder="None / Thyroxine 25mcg"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">History of TB</label>
                    <select
                      value={femaleTb}
                      onChange={(e) => setFemaleTb(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="">Select...</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      H/O bleeding or clotting disorders
                    </label>
                    <select
                      value={femaleBleedingDisorders}
                      onChange={(e) => setFemaleBleedingDisorders(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="">Select...</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      H/O Galactorrhoea
                    </label>
                    <select
                      value={femaleGalactorrhoea}
                      onChange={(e) => setFemaleGalactorrhoea(e.target.value)}
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
                      value={femaleAllergies}
                      onChange={(e) => setFemaleAllergies(e.target.value)}
                      placeholder="No known drug allergies (NKDA)"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      Cervical smears
                    </label>
                    <input
                      type="text"
                      value={femaleCervicalSmear}
                      onChange={(e) => setFemaleCervicalSmear(e.target.value)}
                      placeholder="Not done / Normal Pap smear 1 year ago"
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      PAST SURGICAL HISTORY
                    </label>
                    <input
                      type="text"
                      value={femalePastSurgical}
                      onChange={(e) => setFemalePastSurgical(e.target.value)}
                      placeholder="Nil / Laparoscopy / Appendectomy"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      FAMILY HISTORY OF DM, HTN, CANCERS
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['DM', 'HTN', 'Cancers', 'Thyroid', 'None'].map((cond) => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() =>
                            toggleArrayItem(
                              femaleFamilyHistory,
                              setFemaleFamilyHistory,
                              cond
                            )
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            femaleFamilyHistory.includes(cond)
                              ? 'bg-[#2878a8] text-white border-[#2878a8]'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {cond}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Female Physical Examination: Pallor, Pedal edema, Goitre, BP */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  EXAMINATION (FEMALE)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">O/E Pallor</label>
                    <select
                      value={femalePallor}
                      onChange={(e) => setFemalePallor(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="">Select...</option>
                      <option value="No">No pallor</option>
                      <option value="Present">Pallor present</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Pedal Edema</label>
                    <select
                      value={femalePedalEdema}
                      onChange={(e) => setFemalePedalEdema(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="">Select...</option>
                      <option value="No">No pedal edema</option>
                      <option value="Present">Pedal edema present</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Goitre</label>
                    <select
                      value={femaleGoitre}
                      onChange={(e) => setFemaleGoitre(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="">Select...</option>
                      <option value="No">No goitre</option>
                      <option value="Present">Goitre present</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">BP (mm Hg)</label>
                    <input
                      type="text"
                      value={femaleBp}
                      onChange={(e) => setFemaleBp(e.target.value)}
                      placeholder="120/80"
                      className="vmd-input text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
    </>
  );
}
