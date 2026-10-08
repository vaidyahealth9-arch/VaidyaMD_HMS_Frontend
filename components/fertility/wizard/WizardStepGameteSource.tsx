import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { CycleFormState, CycleMeta } from './types';

interface WizardStepGameteSourceProps {
  form: CycleFormState;
  setForm: React.Dispatch<React.SetStateAction<CycleFormState>>;
  cycleMeta: CycleMeta;
}

export default function WizardStepGameteSource({
  form,
  setForm,
  cycleMeta,
}: WizardStepGameteSourceProps) {
  return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Gametes Source (ART Act 2021 Alignment)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-pink-50/50 border border-pink-200 rounded-lg p-4 space-y-3">
                <h4 className="font-bold text-xs text-pink-800">Oocyte Source</h4>
                <div className="flex gap-4 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="oocyte_source"
                      value="self"
                      checked={form.gametes_source.oocyte === 'self'}
                      onChange={() => setForm({ ...form, gametes_source: { ...form.gametes_source, oocyte: 'self' } })}
                    />
                    <span>Self (Autologous)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="oocyte_source"
                      value="donor"
                      checked={form.gametes_source.oocyte === 'donor'}
                      onChange={() => setForm({ ...form, gametes_source: { ...form.gametes_source, oocyte: 'donor' } })}
                    />
                    <span>Donor Oocyte</span>
                  </label>
                </div>
                {form.gametes_source.oocyte === 'donor' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Donor ID (ART Bank Form 23)</label>
                    <input
                      type="text"
                      placeholder="e.g. DONOR-OOCYTE-8812"
                      value={form.gametes_source.donor_oocyte_id}
                      onChange={(e) => setForm({ ...form, gametes_source: { ...form.gametes_source, donor_oocyte_id: e.target.value } })}
                      className="vmd-input text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                <h4 className="font-bold text-xs text-primary font-bold">Sperm Source</h4>
                <div className="flex flex-wrap gap-4 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sperm_source"
                      value="partner"
                      checked={form.gametes_source.sperm === 'partner'}
                      onChange={() => setForm({ ...form, gametes_source: { ...form.gametes_source, sperm: 'partner' } })}
                    />
                    <span>Partner (Ejaculate)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sperm_source"
                      value="surgical"
                      checked={form.gametes_source.sperm === 'surgical'}
                      onChange={() => setForm({ ...form, gametes_source: { ...form.gametes_source, sperm: 'surgical' } })}
                    />
                    <span>Surgical (TESA/PESA)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sperm_source"
                      value="donor"
                      checked={form.gametes_source.sperm === 'donor'}
                      onChange={() => setForm({ ...form, gametes_source: { ...form.gametes_source, sperm: 'donor' } })}
                    />
                    <span>Donor Sperm</span>
                  </label>
                </div>
                {form.gametes_source.sperm === 'donor' && (
                  <div className="mt-3">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Donor ID (ART Bank Form 23)</label>
                    <input
                      type="text"
                      placeholder="e.g. DONOR-SPERM-1024"
                      value={form.gametes_source.donor_sperm_id}
                      onChange={(e) => setForm({ ...form, gametes_source: { ...form.gametes_source, donor_sperm_id: e.target.value } })}
                      className="vmd-input text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
  );
}
