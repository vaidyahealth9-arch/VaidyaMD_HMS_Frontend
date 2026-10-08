'use client';

import React from 'react';

interface ProformaExamSectionProps {
  fertilityCounselingDone: boolean;
  setFertilityCounselingDone: (v: boolean) => void;
  factorsInFavour: string;
  setFactorsInFavour: (v: string) => void;
  factorsNotInFavour: string;
  setFactorsNotInFavour: (v: string) => void;
  paFindings: string;
  setPaFindings: (v: string) => void;
  paScars: string;
  setPaScars: (v: string) => void;
  psVulvaVagina: string;
  setPsVulvaVagina: (v: string) => void;
  psCervixHealthy: boolean | null;
  setPsCervixHealthy: (v: boolean | null) => void;
  psCervixEctropion: boolean;
  setPsCervixEctropion: (v: boolean) => void;
  psCervicalSmearDone: boolean;
  setPsCervicalSmearDone: (v: boolean) => void;
  psBleedingOnTouch: boolean;
  setPsBleedingOnTouch: (v: boolean) => void;
  pvUterusPosition: string;
  setPvUterusPosition: (v: string) => void;
  pvUterusSize: string;
  setPvUterusSize: (v: string) => void;
  pvUterusMobility: string;
  setPvUterusMobility: (v: string) => void;
  pvFornicesTenderness: string;
  setPvFornicesTenderness: (v: string) => void;
  threeDScan: string;
  setThreeDScan: (v: string) => void;
}

export default function ProformaExamSection({
  paFindings,
  setPaFindings,
  paScars,
  setPaScars,
  psVulvaVagina,
  setPsVulvaVagina,
  psCervixHealthy,
  setPsCervixHealthy,
  psCervixEctropion,
  setPsCervixEctropion,
  psCervicalSmearDone,
  setPsCervicalSmearDone,
  psBleedingOnTouch,
  setPsBleedingOnTouch,
  pvUterusPosition,
  setPvUterusPosition,
  pvUterusSize,
  setPvUterusSize,
  pvUterusMobility,
  setPvUterusMobility,
  pvFornicesTenderness,
  setPvFornicesTenderness,
  threeDScan,
  setThreeDScan,
  fertilityCounselingDone,
  setFertilityCounselingDone,
  factorsInFavour,
  setFactorsInFavour,
  factorsNotInFavour,
  setFactorsNotInFavour,
}: ProformaExamSectionProps) {
  return (
    <>
      {/* Section 6: Consultation Notes & Physical Examination (P/A, P/S, P/V, 3D Scan) */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8]">
                6. Consultation Notes &amp; Clinical Pelvic Examination
              </h3>

              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-800">
                  <input
                    type="checkbox"
                    checked={fertilityCounselingDone}
                    onChange={(e) => setFertilityCounselingDone(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2878a8] border-slate-300 focus:ring-[#2878a8]"
                  />
                  <span>
                    Fertility explained including hormones, ovulation, tubal patency and semen
                  </span>
                </label>
              </div>

              {/* P/A, P/S, P/V */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* P/A */}
                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    P/A (PER ABDOMEN)
                  </span>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Soft / Findings</label>
                    <input
                      type="text"
                      value={paFindings}
                      onChange={(e) => setPaFindings(e.target.value)}
                      placeholder="Soft, non-tender"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Scars</label>
                    <input
                      type="text"
                      value={paScars}
                      onChange={(e) => setPaScars(e.target.value)}
                      placeholder="None / LSCS scar"
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>

                {/* P/S */}
                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    P/S (PER SPECULUM)
                  </span>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      Vulva / Vagina
                    </label>
                    <input
                      type="text"
                      value={psVulvaVagina}
                      onChange={(e) => setPsVulvaVagina(e.target.value)}
                      placeholder="Healthy"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(psCervixHealthy)}
                        onChange={(e) => setPsCervixHealthy(e.target.checked)}
                        className="rounded text-[#2878a8]"
                      />
                      <span>Cervix appears healthy</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={psCervixEctropion}
                        onChange={(e) => setPsCervixEctropion(e.target.checked)}
                        className="rounded text-[#2878a8]"
                      />
                      <span>Cervix ectropion noted</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={psCervicalSmearDone}
                        onChange={(e) => setPsCervicalSmearDone(e.target.checked)}
                        className="rounded text-[#2878a8]"
                      />
                      <span>Cervical smear done (LBC)</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={psBleedingOnTouch}
                        onChange={(e) => setPsBleedingOnTouch(e.target.checked)}
                        className="rounded text-[#2878a8]"
                      />
                      <span>
                        {psBleedingOnTouch ? 'Bleeding on touch noted' : 'No bleeding noted on touch'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* P/V */}
                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    P/V (PER VAGINUM)
                  </span>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Uterus Position</label>
                    <select
                      value={pvUterusPosition}
                      onChange={(e) => setPvUterusPosition(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="">Select Position...</option>
                      <option value="Anteverted">Anteverted</option>
                      <option value="Retroverted">Retroverted</option>
                      <option value="Midposition">Midposition</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Size</label>
                      <input
                        type="text"
                        value={pvUterusSize}
                        onChange={(e) => setPvUterusSize(e.target.value)}
                        placeholder="Normal / Bulky"
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Mobility</label>
                      <select
                        value={pvUterusMobility}
                        onChange={(e) => setPvUterusMobility(e.target.value)}
                        className="vmd-input text-xs"
                      >
                        <option value="">Select Mobility...</option>
                        <option value="Mobile">Mobile</option>
                        <option value="Fixed">Fixed</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      Fornices: Tenderness
                    </label>
                    <input
                      type="text"
                      value={pvFornicesTenderness}
                      onChange={(e) => setPvFornicesTenderness(e.target.value)}
                      placeholder="Absent / Tenderness noted"
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3D Scan & Factors */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    3-D Scan Findings
                  </label>
                  <textarea
                    rows={2}
                    value={threeDScan}
                    onChange={(e) => setThreeDScan(e.target.value)}
                    placeholder="Uterus architecture, cavity, endometrial thickness, antral follicle count..."
                    className="vmd-input text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                      Factors in favour
                    </label>
                    <textarea
                      rows={2}
                      value={factorsInFavour}
                      onChange={(e) => setFactorsInFavour(e.target.value)}
                      placeholder="e.g. Good ovarian reserve, patent tubes, age..."
                      className="vmd-input text-xs border-emerald-200 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-rose-800 mb-1">
                      Factors not in favour
                    </label>
                    <textarea
                      rows={2}
                      value={factorsNotInFavour}
                      onChange={(e) => setFactorsNotInFavour(e.target.value)}
                      placeholder="e.g. Duration of infertility, elevated DFI, elevated BMI..."
                      className="vmd-input text-xs border-rose-200 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
            </div>
    </>
  );
}
