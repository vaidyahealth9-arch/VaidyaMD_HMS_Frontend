'use client';

import React from 'react';

interface ProformaSpecialtySectionsProps {
  activeTab: 'fertility' | 'gynaecology' | 'obstetric';
  contraceptionHistory: string;
  setContraceptionHistory: (v: string) => void;
  gynaeSmearResult: string;
  setGynaeSmearResult: (v: string) => void;
  gynaeHpv: string;
  setGynaeHpv: (v: string) => void;
  edd: string;
  setEdd: (v: string) => void;
  gestationalAge: string;
  setGestationalAge: (v: string) => void;
  conceptionMode: string;
  setConceptionMode: (v: string) => void;
  currentPregnancyNotes: string;
  setCurrentPregnancyNotes: (v: string) => void;
}

export default function ProformaSpecialtySections({
  activeTab,
  contraceptionHistory,
  setContraceptionHistory,
  gynaeSmearResult,
  setGynaeSmearResult,
  gynaeHpv,
  setGynaeHpv,
  edd,
  setEdd,
  gestationalAge,
  setGestationalAge,
  conceptionMode,
  setConceptionMode,
  currentPregnancyNotes,
  setCurrentPregnancyNotes,
}: ProformaSpecialtySectionsProps) {
  return (
    <>
      {activeTab === 'gynaecology' && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                  9. Gynaecology Screening &amp; Findings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Cervical Smear Result
                    </label>
                    <input
                      type="text"
                      value={gynaeSmearResult}
                      onChange={(e) => setGynaeSmearResult(e.target.value)}
                      placeholder="e.g. NILM (Negative for intraepithelial lesion or malignancy)"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      HPV Screening Status
                    </label>
                    <input
                      type="text"
                      value={gynaeHpv}
                      onChange={(e) => setGynaeHpv(e.target.value)}
                      placeholder="e.g. High Risk HPV Negative"
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Obstetric Specific Form Card */}
            {activeTab === 'obstetric' && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                  9. Obstetric &amp; Antenatal Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Expected Date of Delivery (EDD)
                    </label>
                    <input
                      type="date"
                      value={edd}
                      onChange={(e) => setEdd(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Gestational Age
                    </label>
                    <input
                      type="text"
                      value={gestationalAge}
                      onChange={(e) => setGestationalAge(e.target.value)}
                      placeholder="e.g. 12 weeks 3 days"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Mode of Conception
                    </label>
                    <select
                      value={conceptionMode}
                      onChange={(e) => setConceptionMode(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="">Select Mode...</option>
                      <option value="Spontaneous">Spontaneous</option>
                      <option value="IVF-ET">IVF-ET (In Vitro Fertilization)</option>
                      <option value="IUI">IUI (Intrauterine Insemination)</option>
                      <option value="Ovulation Induction">Ovulation Induction</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Current Pregnancy Notes
                    </label>
                    <textarea
                      rows={2}
                      value={currentPregnancyNotes}
                      onChange={(e) => setCurrentPregnancyNotes(e.target.value)}
                      placeholder="e.g. Single intrauterine viable gestation, dating scan concordant, mild morning nausea..."
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
    </>
  );
}
