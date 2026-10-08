import React from 'react';
import { Calendar, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { CycleFormState, CycleMeta, TreatmentTypeItem } from './types';

interface WizardStepSummarySubmitProps {
  form: CycleFormState;
  setForm: React.Dispatch<React.SetStateAction<CycleFormState>>;
  cycleMeta: CycleMeta;
  currentSelectedType?: TreatmentTypeItem | null;
  doctors: any[];
  protocols: any[];
}

export default function WizardStepSummarySubmit({
  form,
  setForm,
  cycleMeta,
  currentSelectedType,
  doctors,
  protocols,
}: WizardStepSummarySubmitProps) {
  return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Review & Launch Treatment Cycle</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
                <p>
                  <span className="text-slate-500 font-medium">Treatment Modality:</span>{' '}
                  <strong className="text-slate-900">{form.treatment_type || 'Unspecified'} (Attempt #{form.attempt_number})</strong>
                </p>
                <p>
                  <span className="text-slate-500 font-medium">Modality Category:</span>{' '}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                    {currentSelectedType?.category || (cycleMeta.isFet ? 'Embryo Transfer' : cycleMeta.isIui ? 'IUI' : 'ART')}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500 font-medium">Treating Consultant:</span>{' '}
                  <strong className="text-slate-800">
                    {(() => {
                      const doc = doctors.find((d) => d.id === form.treating_doctor_id);
                      if (!doc) return 'Not assigned';
                      return `${doc.name?.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`} (${doc.specialization || doc.role || 'Consultant'})`;
                    })()}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500 font-medium">Oocyte Source:</span>{' '}
                  <strong className="text-slate-800">
                    {form.gametes_source.oocyte === 'donor'
                      ? `Donor Oocyte (${form.gametes_source.donor_oocyte_id || 'ID Pending'})`
                      : 'Self (Autologous)'}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500 font-medium">Sperm Source:</span>{' '}
                  <strong className="text-slate-800">
                    {cycleMeta.isEggFreezing
                      ? 'N/A (Oocyte Freezing Only)'
                      : form.gametes_source.sperm === 'donor'
                      ? `Donor Sperm (${form.gametes_source.donor_sperm_id || 'ID Pending'})`
                      : form.gametes_source.sperm === 'surgical'
                      ? 'Surgical (TESA / PESA)'
                      : 'Partner (Ejaculate)'}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500 font-medium">Day 1 (LMP / Bleed Date):</span>{' '}
                  <strong className="text-slate-800">{form.sentinel_dates.lmp_day1 || 'Not set'}</strong>
                </p>
                <p>
                  <span className="text-slate-500 font-medium">Baseline Scan (D2):</span>{' '}
                  <strong className="text-slate-800">{form.sentinel_dates.baseline_scan || 'Not set'}</strong>
                </p>

                {/* Modality Specific Dates */}
                {cycleMeta.isFet && (
                  <>
                    <p>
                      <span className="text-slate-500 font-medium">D12 Endometrial Assessment:</span>{' '}
                      <strong className="text-slate-800">{form.sentinel_dates.d12_scan || 'Not set'}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Progesterone P0 Start:</span>{' '}
                      <strong className="text-slate-800">{form.sentinel_dates.p0_date || 'Not set'} ({form.sentinel_dates.p0_time || '08:00 AM'})</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Planned Embryo Transfer:</span>{' '}
                      <strong className="text-teal-700">{form.sentinel_dates.et || 'Not set'} ({form.sentinel_dates.embryo_stage || 'Day 5'})</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Serum β-hCG Test:</span>{' '}
                      <strong className="text-slate-800">{form.sentinel_dates.beta_hcg_date || 'Not set'} (D23)</strong>
                    </p>
                  </>
                )}

                {cycleMeta.isIui && (
                  <>
                    <p>
                      <span className="text-slate-500 font-medium">Induction Start (D3):</span>{' '}
                      <strong className="text-slate-800">{form.sentinel_dates.stim_start || 'Not set'}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Estimated Trigger:</span>{' '}
                      <strong className="text-slate-800">{form.sentinel_dates.trigger || 'Not set'}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Planned Insemination (D14):</span>{' '}
                      <strong className="text-indigo-700">{form.sentinel_dates.insemination || 'Not set'}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Serum β-hCG Test:</span>{' '}
                      <strong className="text-slate-800">{form.sentinel_dates.beta_hcg_date || 'Not set'} (D28)</strong>
                    </p>
                  </>
                )}

                {cycleMeta.isEggFreezing && (
                  <>
                    <p>
                      <span className="text-slate-500 font-medium">Stimulation Start (D3):</span>{' '}
                      <strong className="text-slate-800">{form.sentinel_dates.stim_start || 'Not set'}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Estimated Trigger:</span>{' '}
                      <strong className="text-slate-800">{form.sentinel_dates.trigger || 'Not set'}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Planned OPU Retrieval (D14):</span>{' '}
                      <strong className="text-blue-700">{form.sentinel_dates.opu || 'Not set'}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Embryo Transfer:</span>{' '}
                      <span className="text-slate-500 italic">None (Oocyte Vitrification Cycle)</span>
                    </p>
                  </>
                )}

                {!cycleMeta.isFet && !cycleMeta.isIui && !cycleMeta.isEggFreezing && (
                  <>
                    <p>
                      <span className="text-slate-500 font-medium">Stimulation Start (D3):</span>{' '}
                      <strong className="text-slate-800">{form.sentinel_dates.stim_start || 'Not set'}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Estimated Trigger:</span>{' '}
                      <strong className="text-slate-800">{form.sentinel_dates.trigger || 'Not set'}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">Planned OPU Retrieval (D14):</span>{' '}
                      <strong className="text-slate-800">{form.sentinel_dates.opu || 'Not set'}</strong>
                    </p>
                    {cycleMeta.hasEt && (
                      <p>
                        <span className="text-slate-500 font-medium">Planned Embryo Transfer:</span>{' '}
                        <strong className="text-teal-700">{form.sentinel_dates.et || 'Not set'} ({form.sentinel_dates.embryo_stage || 'Day 5'})</strong>
                      </p>
                    )}
                    <p>
                      <span className="text-slate-500 font-medium">Serum β-hCG Test:</span>{' '}
                      <strong className="text-slate-800">{form.sentinel_dates.beta_hcg_date || 'Not set'} (D29)</strong>
                    </p>
                  </>
                )}

                {/* PGT Summary */}
                {!cycleMeta.isIui && !cycleMeta.isEggFreezing && (
                  <p className="col-span-1 md:col-span-2 pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">PGT Status:</span>{' '}
                    <strong className={form.pgs_pgd_data.indicated ? 'text-purple-700' : 'text-slate-700'}>
                      {form.pgs_pgd_data.indicated
                        ? `${form.pgs_pgd_data.type} (${form.pgs_pgd_data.biopsy_day} Biopsy)${form.pgs_pgd_data.lab_name ? ` — Ref Lab: ${form.pgs_pgd_data.lab_name}` : ''}`
                        : 'Not Indicated'}
                    </strong>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Clinical Remarks & Instructions</label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                rows={3}
                placeholder="Enter any specific clinical instructions, protocol notes, or patient instructions..."
                className="vmd-input text-xs"
              />
            </div>
          </div>
  );
}
