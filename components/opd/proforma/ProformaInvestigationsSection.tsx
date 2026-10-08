'use client';

import React from 'react';

interface ProformaInvestigationsSectionProps {
  invAmh: string;
  setInvAmh: (v: string) => void;
  invFsh: string;
  setInvFsh: (v: string) => void;
  invLh: string;
  setInvLh: (v: string) => void;
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
  fertilityCounselingDone: string;
  setFertilityCounselingDone: (v: string) => void;
}

export default function ProformaInvestigationsSection({
  invAmh,
  setInvAmh,
  invFsh,
  setInvFsh,
  invLh,
  setInvLh,
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
}: ProformaInvestigationsSectionProps) {
  return (
    <>
      {/* Section 5: Fertility Investigations & Past Treatments */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                5. Fertility Investigations &amp; Treatments
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Serum AMH (ng/mL)
                  </label>
                  <input
                    type="text"
                    value={invAmh}
                    onChange={(e) => setInvAmh(e.target.value)}
                    placeholder="e.g. 2.8 ng/mL"
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">FSH</label>
                  <input
                    type="text"
                    value={invFsh}
                    onChange={(e) => setInvFsh(e.target.value)}
                    placeholder="e.g. 6.4 mIU/mL"
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">LH</label>
                  <input
                    type="text"
                    value={invLh}
                    onChange={(e) => setInvLh(e.target.value)}
                    placeholder="e.g. 5.1 mIU/mL"
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">TSH</label>
                  <input
                    type="text"
                    value={invTsh}
                    onChange={(e) => setInvTsh(e.target.value)}
                    placeholder="e.g. 1.8 mIU/L"
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Tubal patency (HSG/HyCoSy)
                  </label>
                  <input
                    type="text"
                    value={invTubalPatency}
                    onChange={(e) => setInvTubalPatency(e.target.value)}
                    placeholder="Bilateral tubes patent"
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Hysteroscopy / Laparoscopy
                  </label>
                  <input
                    type="text"
                    value={invHysteroLap}
                    onChange={(e) => setInvHysteroLap(e.target.value)}
                    placeholder="Not done / Normal cavity"
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Semen analysis
                  </label>
                  <input
                    type="text"
                    value={invSemenAnalysis}
                    onChange={(e) => setInvSemenAnalysis(e.target.value)}
                    placeholder="Normozoospermia"
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Sperm DFI (%)
                  </label>
                  <input
                    type="text"
                    value={invDfi}
                    onChange={(e) => setInvDfi(e.target.value)}
                    placeholder="e.g. 14%"
                    className="vmd-input text-xs"
                  />
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    FERTILITY TREATMENTS (PAST)
                  </label>
                  <textarea
                    rows={2}
                    value={fertilityTreatments}
                    onChange={(e) => setFertilityTreatments(e.target.value)}
                    placeholder="e.g. Ovulation Induction 3 cycles elsewhere, no IUI/IVF yet..."
                    className="vmd-input text-xs"
                  />
                </div>
              </div>
            </div>
    </>
  );
}
