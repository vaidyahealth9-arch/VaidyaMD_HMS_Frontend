import React from 'react';
import { CycleFormState, CycleMeta } from './types';

interface WizardStepGeneticScreeningProps {
  form: CycleFormState;
  setForm: React.Dispatch<React.SetStateAction<CycleFormState>>;
  cycleMeta: CycleMeta;
}

export default function WizardStepGeneticScreening({
  form,
  setForm,
  cycleMeta,
}: WizardStepGeneticScreeningProps) {
  return (
          <div className="space-y-4">
            <div className="border-b pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Preimplantation Genetic Testing (PGT)</h3>
                <p className="text-[11px] text-slate-500">Trophectoderm biopsy tracking for aneuploidy screening, single-gene disorders, or structural rearrangements</p>
              </div>
              {cycleMeta.isPgt && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Indicated by Treatment Modality
                </span>
              )}
            </div>
            
            {cycleMeta.isIui ? (
              <div className="bg-amber-50/60 border border-dashed border-amber-200 rounded-lg p-6 text-center text-amber-900 text-xs space-y-1">
                <p className="font-bold">PGT is not applicable for IUI / Ovulation Induction cycles</p>
                <p className="text-[11px] text-amber-700">Insemination occurs in vivo with no laboratory embryo culture or trophectoderm biopsy stage.</p>
              </div>
            ) : cycleMeta.isEggFreezing ? (
              <div className="bg-blue-50/60 border border-dashed border-blue-200 rounded-lg p-6 text-center text-blue-900 text-xs space-y-1">
                <p className="font-bold">PGT is not applicable for Oocyte Cryopreservation cycles</p>
                <p className="text-[11px] text-blue-700">Gametes are vitrified unfertilized. Embryo genetic screening occurs later if and when thawed oocytes are fertilized into blastocysts.</p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.pgs_pgd_data.indicated}
                    onChange={(e) => setForm({ ...form, pgs_pgd_data: { ...form.pgs_pgd_data, indicated: e.target.checked } })}
                    className="w-5 h-5 text-primary rounded"
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-900">Preimplantation Genetic Testing Indicated</p>
                    <p className="text-[11px] text-slate-500">Enable trophectoderm biopsy tracking for aneuploidy / single-gene defect screening</p>
                  </div>
                </label>

                {form.pgs_pgd_data.indicated && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">PGT Assay Type</label>
                      <select
                        value={form.pgs_pgd_data.type}
                        onChange={(e) => setForm({ ...form, pgs_pgd_data: { ...form.pgs_pgd_data, type: e.target.value } })}
                        className="vmd-input text-xs"
                      >
                        <option value="PGT-A">PGT-A (Aneuploidy Screening - NGS)</option>
                        <option value="PGT-M">PGT-M (Monogenic / Single Gene)</option>
                        <option value="PGT-SR">PGT-SR (Structural Rearrangements)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Genetics Reference Lab</label>
                      <input
                        type="text"
                        placeholder="e.g. Igenomix, MedGenome, CooperSurgical..."
                        value={form.pgs_pgd_data.lab_name}
                        onChange={(e) => setForm({ ...form, pgs_pgd_data: { ...form.pgs_pgd_data, lab_name: e.target.value } })}
                        className="vmd-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Target Biopsy Stage</label>
                      <select
                        value={form.pgs_pgd_data.biopsy_day}
                        onChange={(e) => setForm({ ...form, pgs_pgd_data: { ...form.pgs_pgd_data, biopsy_day: e.target.value } })}
                        className="vmd-input text-xs"
                      >
                        <option value="D5">Day 5 (Expanded Trophectoderm)</option>
                        <option value="D6">Day 6 Blastocyst</option>
                        <option value="D3">Day 3 (Cleavage Blastomere)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
  );
}
