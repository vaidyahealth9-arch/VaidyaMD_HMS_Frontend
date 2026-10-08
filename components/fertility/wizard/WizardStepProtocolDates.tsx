import React from 'react';
import { CalendarIcon, Lightbulb, Droplet, Search, Syringe, Clock, Zap, FlaskConical, Heart, Activity } from 'lucide-react';
import { CycleFormState, CycleMeta } from './types';

interface WizardStepProtocolDatesProps {
  form: CycleFormState;
  setForm: React.Dispatch<React.SetStateAction<CycleFormState>>;
  cycleMeta: CycleMeta;
  protocols: any[];
  updateSentinel: (field: string, value: any) => void;
  handleLmpChange: (lmpVal: string) => void;
}

export default function WizardStepProtocolDates({
  form,
  setForm,
  cycleMeta,
  protocols,
  updateSentinel,
  handleLmpChange,
}: WizardStepProtocolDatesProps) {
  return (
          <div className="space-y-4">
            <div className="border-b pb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {cycleMeta.isFet
                    ? 'HRT FET Protocol & Timing Anchors'
                    : cycleMeta.isIui
                    ? 'IUI / OI Protocol & Timing Anchors'
                    : cycleMeta.isEggFreezing
                    ? 'Oocyte Cryopreservation Protocol & Timing Anchors'
                    : 'Stimulation Protocol & Sentinel Dates'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {cycleMeta.isFet
                    ? 'Day 1 Bleed Date, Day 12 Endometrial Scan, and P0 Progesterone Start timing anchor (aligned with Excel template)'
                    : cycleMeta.isIui
                    ? 'Day 1 (LMP), Folliculometry Scans, Trigger Injection, and Insemination Timing'
                    : cycleMeta.isEggFreezing
                    ? 'Day 1 (LMP), Stimulation Start, Follicle Monitoring, Trigger, and Oocyte Pick-Up (No Transfer)'
                    : 'Set Day 1 (LMP) to auto-calculate milestones, or customize dates individually.'}
                </p>
              </div>

              {cycleMeta.hasEt && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 px-1">Stage:</span>
                  <button
                    type="button"
                    onClick={() => {
                      updateSentinel('embryo_stage', 'Day 3');
                      handleLmpChange(form.sentinel_dates.lmp_day1 || new Date().toISOString().split('T')[0]);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      form.sentinel_dates?.embryo_stage === 'Day 3' ? 'bg-[#2F6F8F] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Day 3
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateSentinel('embryo_stage', 'Day 5');
                      handleLmpChange(form.sentinel_dates.lmp_day1 || new Date().toISOString().split('T')[0]);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      form.sentinel_dates?.embryo_stage !== 'Day 3' ? 'bg-[#2F6F8F] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Day 5
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {cycleMeta.isFet ? 'Select FET Protocol Template' : cycleMeta.isIui ? 'Select IUI / OI Protocol' : 'Select Stimulation Protocol'}
              </label>
              <select
                value={form.protocol_template_id}
                onChange={(e) => setForm({ ...form, protocol_template_id: e.target.value })}
                className="vmd-input font-bold text-text-main bg-surface-muted"
              >
                <option value="">Select Protocol Template...</option>
                {(() => {
                  const filtered = protocols.filter((p) => {
                    const cat = (p.category || '').toLowerCase();
                    if (cycleMeta.isFet) return cat.includes('fet') || cat.includes('transfer');
                    if (cycleMeta.isIui) return cat.includes('iui') || cat.includes('induction');
                    return !cat.includes('fet');
                  });
                  const list = filtered.length > 0 ? filtered : protocols;
                  return list.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                  ));
                })()}
              </select>
            </div>

            {cycleMeta.isFet ? (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-md text-xs text-teal-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-teal-700 inline shrink-0" />
                <span>
                  <strong>HRT-FET Auto-Calculation:</strong> Cycle Day 1 sets Baseline Scan (D2), D12 Endometrial Assessment, Day 14 P0 Progesterone Start, Embryo Transfer on <strong>{form.sentinel_dates?.embryo_stage === 'Day 3' ? 'P+3' : 'P+5'}</strong>, and Serum β-hCG on Day 23.
                </span>
              </div>
            ) : cycleMeta.isIui ? (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md text-xs text-indigo-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-700 inline shrink-0" />
                <span>
                  <strong>IUI Auto-Calculation:</strong> Cycle Day 1 sets Baseline Scan (D2), Day 3 Induction Start, Day 12 Trigger, Day 14 Insemination, and Serum β-hCG on Day 28.
                </span>
              </div>
            ) : cycleMeta.isEggFreezing ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-700 inline shrink-0" />
                <span>
                  <strong>Oocyte Cryopreservation:</strong> Entering Day 1 (LMP) auto-populates Day 2 Baseline Scan, Day 3 Stim Start, Day 12 Trigger, and Day 14 OPU Retrieval. (No embryo transfer step).
                </span>
              </div>
            ) : (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-md text-xs text-primary flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 inline mr-1" />
                <span>
                  <strong>Auto-Calculation:</strong> Entering Day 1 (LMP) auto-populates Day 2 Baseline Scan, Day 3 Stim Start, Day 12 Trigger, Day 14 OPU, Day 19 ET, and Day 29 Serum β-hCG. You can adjust any date manually.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              {[
                { key: 'lmp_day1', label: cycleMeta.isFet ? 'Cycle Day 1 (Bleed Date)' : 'Day 1 (LMP / Bleed Date)', icon: Droplet, show: true },
                { key: 'baseline_scan', label: 'Baseline Scan Date (D2)', icon: Search, show: true },
                { key: 'stim_start', label: cycleMeta.isIui ? 'Induction Start Date (D3)' : 'Stimulation Start Date (D3)', icon: Syringe, show: !cycleMeta.isFet },
                { key: 'd12_scan', label: 'Endometrial Assessment (D12)', icon: Search, show: cycleMeta.isFet },
                { key: 'p0_date', label: 'Progesterone Start (P0)', icon: Clock, show: cycleMeta.isFet },
                { key: 'trigger', label: 'Estimated Trigger Date (D12)', icon: Zap, show: !cycleMeta.isFet },
                { key: 'opu', label: 'Planned OPU Retrieval (D14)', icon: FlaskConical, show: cycleMeta.hasOpu },
                { key: 'insemination', label: 'Planned Insemination (D14)', icon: Heart, show: cycleMeta.isIui },
                { key: 'et', label: `Planned Transfer (${form.sentinel_dates?.embryo_stage || 'Day 5'})`, icon: Heart, show: cycleMeta.hasEt },
                { key: 'beta_hcg_date', label: `Serum β-hCG Test Date (${cycleMeta.isFet ? 'D23' : cycleMeta.isIui ? 'D28' : 'D29'})`, icon: Activity, show: cycleMeta.hasEt || cycleMeta.isIui },
              ].filter(s => s.show).map((s) => (
                <div key={s.key} className="bg-slate-50 border border-slate-200 rounded-md p-3">
                  <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 mb-1">
                    <s.icon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{s.label}</span>
                  </label>
                  <input
                    type="date"
                    value={(form.sentinel_dates as any)[s.key] || ''}
                    onChange={(e) => {
                      if (s.key === 'lmp_day1') {
                        handleLmpChange(e.target.value);
                      } else {
                        updateSentinel(s.key, e.target.value);
                      }
                    }}
                    className="vmd-input text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
  );
}
