import React from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { CycleFormState, CycleMeta, EndometrialMonitoringRow } from './types';

interface WizardStepEndometrialMonitoringProps {
  form: CycleFormState;
  setForm: React.Dispatch<React.SetStateAction<CycleFormState>>;
  cycleMeta: CycleMeta;
  handleAddEndometrialRow: () => void;
  handleUpdateEndometrialRow: (idx: number, field: keyof EndometrialMonitoringRow, val: any) => void;
  handleRemoveEndometrialRow: (idx: number) => void;
}

export default function WizardStepEndometrialMonitoring({
  form,
  setForm,
  cycleMeta,
  handleAddEndometrialRow,
  handleUpdateEndometrialRow,
  handleRemoveEndometrialRow,
}: WizardStepEndometrialMonitoringProps) {
  return (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {cycleMeta.isFet
                    ? 'Endometrial Preparation Monitoring (HRT-FET)'
                    : cycleMeta.isIui
                    ? 'Serial Folliculometry & Endometrial Monitoring (IUI)'
                    : 'Serial Endometrial & Follicular Monitoring'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {cycleMeta.isFet
                    ? 'Track serial endometrial thickness (target ≥8 mm), trilaminar pattern, and sub-endometrial vascularity before P0 start'
                    : cycleMeta.isIui
                    ? 'Track follicular maturation (leading follicle ≥18 mm), endometrial thickness, and vascularity before trigger'
                    : 'Track endometrial thickness, echo-pattern, follicular cohort progression, and vascularity zones'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddEndometrialRow}
                className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary font-bold text-xs rounded-md hover:bg-primary/15 transition-colors shadow-sm"
              >
                + Add Scan Date
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Scan Date</th>
                    <th className="p-3">Cycle Day</th>
                    <th className="p-3">Thickness (mm)</th>
                    <th className="p-3">Pattern</th>
                    <th className="p-3">Vascularity Zone</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {form.endometrial_monitoring.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5">
                        <input
                          type="date"
                          value={m.date}
                          onChange={(e) => handleUpdateEndometrialRow(idx, 'date', e.target.value)}
                          className="vmd-input text-xs py-1 px-2"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          value={m.day_of_cycle}
                          onChange={(e) => handleUpdateEndometrialRow(idx, 'day_of_cycle', parseInt(e.target.value) || 0)}
                          className="vmd-input text-xs py-1 px-2 w-20"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.1"
                          value={m.thickness_mm}
                          onChange={(e) => handleUpdateEndometrialRow(idx, 'thickness_mm', parseFloat(e.target.value) || 0)}
                          className="vmd-input text-xs py-1 px-2 w-24 font-bold"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          value={m.pattern}
                          onChange={(e) => handleUpdateEndometrialRow(idx, 'pattern', e.target.value)}
                          className="vmd-input text-xs py-1 px-2"
                        >
                          <option value="Trilaminar">Trilaminar (Triple-line)</option>
                          <option value="Homogeneous">Homogeneous</option>
                          <option value="Hyperechoic">Hyperechoic</option>
                          <option value="Secretory">Secretory / Luteal</option>
                        </select>
                      </td>
                      <td className="p-2.5">
                        <select
                          value={m.vascularity}
                          onChange={(e) => handleUpdateEndometrialRow(idx, 'vascularity', e.target.value)}
                          className="vmd-input text-xs py-1 px-2"
                        >
                          <option value="Zone 1">Zone 1 (Peri-endometrial)</option>
                          <option value="Zone 2">Zone 2 (Outer sub-endometrial)</option>
                          <option value="Zone 3">Zone 3 (Inner sub-endometrial)</option>
                          <option value="Zone 4">Zone 4 (Intra-endometrial)</option>
                        </select>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveEndometrialRow(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 text-xs"
                          title="Delete Scan Record"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {form.endometrial_monitoring.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                        No scan records added yet. Click "+ Add Scan Date" to record monitoring data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
  );
}
