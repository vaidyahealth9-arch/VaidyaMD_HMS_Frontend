'use client';

import React, { useState } from 'react';
import { Activity, Plus, Save, Check, Trash2, HeartPulse, ShieldAlert } from 'lucide-react';
import { TreatmentCycleRecord } from '../types';
import { treatmentCyclesApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';

interface EndometrialLogItem {
  id: string;
  date: string;
  cycle_day: number;
  thickness_mm: string;
  pattern: string;
  doppler_zone: string;
  sonologist: string;
  remarks: string;
}

interface EndometrialMonitoringPanelProps {
  cycle: TreatmentCycleRecord;
  onUpdateCycle?: (updated: TreatmentCycleRecord) => void;
  onNavigateNext?: () => void;
}

export default function EndometrialMonitoringPanel({
  cycle,
  onUpdateCycle,
  onNavigateNext,
}: EndometrialMonitoringPanelProps) {
  const initialLogs: EndometrialLogItem[] =
    Array.isArray(cycle.endometrial_monitoring) && cycle.endometrial_monitoring.length > 0
      ? cycle.endometrial_monitoring.map((log: any, idx: number) => ({
          id: log.id || `endo-${idx}-${Date.now()}`,
          date: log.date || '',
          cycle_day: Number(log.cycle_day) || 2,
          thickness_mm: String(log.thickness_mm || ''),
          pattern: log.pattern || 'Trilaminar (Type A)',
          doppler_zone: log.doppler_zone || 'Zone 3 (Sub-endometrial halo)',
          sonologist: log.sonologist || cycle.doctor_name || cycle.treating_doctor_name || 'Treating Sonologist',
          remarks: log.remarks || '',
        }))
      : [];

  const [logs, setLogs] = useState<EndometrialLogItem[]>(initialLogs);

  // New TVS Assessment Form (Dedicated Top Card)
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDay, setNewDay] = useState<number>(10);
  const [newThickness, setNewThickness] = useState('');
  const [newPattern, setNewPattern] = useState('Trilaminar (Type A)');
  const [newDoppler, setNewDoppler] = useState('Zone 3 (Sub-endometrial halo)');
  const [newRemarks, setNewRemarks] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThickness.trim()) {
      toast.error('Thickness Required', 'Please enter endometrial thickness in mm.');
      return;
    }

    const newItem: EndometrialLogItem = {
      id: `endo-${Date.now()}`,
      date: newDate || new Date().toISOString().split('T')[0],
      cycle_day: Number(newDay) || 1,
      thickness_mm: newThickness.trim(),
      pattern: newPattern,
      doppler_zone: newDoppler,
      sonologist: cycle.doctor_name || cycle.treating_doctor_name || 'Treating Sonologist',
      remarks: newRemarks.trim() || 'Serial TVS assessment',
    };

    setLogs([...logs, newItem]);
    setNewThickness('');
    setNewRemarks('');
    toast.success('Assessment Added', `TVS Day ${newItem.cycle_day} (${newItem.thickness_mm} mm) added to list.`);
  };

  const handleRemoveLog = (id: string) => {
    setLogs(logs.filter((l) => l.id !== id));
  };

  const handleUpdateLog = (id: string, field: keyof EndometrialLogItem, value: any) => {
    setLogs(
      logs.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const handleSave = async (andNext = false) => {
    const payload = {
      endometrial_monitoring: logs,
    };

    if (!cycle?.id) {
      if (onUpdateCycle) {
        onUpdateCycle({ ...cycle, ...payload });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        toast.success('Draft Updated', 'Endometrial monitoring updated in draft.');
      }
      if (andNext && onNavigateNext) {
        onNavigateNext();
      }
      return;
    }

    setIsSaving(true);
    try {
      const res = await treatmentCyclesApi.update(cycle.id, payload);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      toast.success('Endometrial Logs Saved', 'Serial TVS monitoring evaluations updated.');
      if (onUpdateCycle && res) {
        onUpdateCycle(res);
      }
      if (andNext && onNavigateNext) {
        onNavigateNext();
      }
    } catch (err: any) {
      toast.error('Failed to save', err.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const latestLog = logs[logs.length - 1];
  const latestThickness = latestLog ? parseFloat(latestLog.thickness_mm) : 0;
  const isOptimal = latestThickness >= 7.5;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-primary" />
            <span>Endometrial Monitoring &amp; TVS Receptivity</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Serial ultrasound tracking of thickness, triple-line echogenicity, and sub-endometrial Doppler flow
          </p>
        </div>
        <div className="flex items-center gap-2">
          {latestLog && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1.5 ${
                isOptimal
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>
                Latest: {latestLog.thickness_mm} mm ({isOptimal ? 'Optimal Receptivity' : 'Sub-optimal < 7.5mm'})
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save Details'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 active:scale-98"
          >
            <span>Save &amp; Next →</span>
          </button>
        </div>
      </div>

      {/* Top Dedicated TVS Entry Form Card */}
      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>Record Ultrasound TVS Assessment</span>
          </h4>
          <span className="text-[11px] text-slate-500 font-medium">
            Enter serial baseline or tracking measurements
          </span>
        </div>

        <form onSubmit={handleAddLog} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">Scan Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">Cycle Day</label>
            <input
              type="number"
              min="1"
              max="60"
              value={newDay}
              onChange={(e) => setNewDay(Number(e.target.value))}
              className="w-full text-xs font-bold bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">Thickness</label>
            <div className="relative flex items-center">
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                placeholder="e.g. 8.5"
                value={newThickness}
                onChange={(e) => setNewThickness(e.target.value)}
                className="w-full text-xs font-bold bg-white border border-slate-300 rounded pl-2.5 pr-8 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
              />
              <span className="absolute right-2 text-xs font-bold text-slate-400 pointer-events-none">
                mm
              </span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">Echogenicity Pattern</label>
            <select
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              className="w-full text-xs font-medium bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
            >
              <option value="Trilaminar (Type A)">Trilaminar Triple-Line (Type A)</option>
              <option value="Intermediate (Type B)">Intermediate (Type B)</option>
              <option value="Homogenous (Type C)">Homogenous (Type C)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">Doppler Flow</label>
            <select
              value={newDoppler}
              onChange={(e) => setNewDoppler(e.target.value)}
              className="w-full text-xs font-medium bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
            >
              <option value="Zone 3 (Sub-endometrial halo)">Zone 3 (Sub-endometrial halo)</option>
              <option value="Zone 4 (Penetrating spiral arteries)">Zone 4 (Penetrating spiral)</option>
              <option value="Zone 2 (Outer myometrium)">Zone 2 (Outer myometrium)</option>
              <option value="Zone 1 (Vascularity absent)">Zone 1 (Absent flow)</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Remarks</label>
              <input
                type="text"
                placeholder="e.g. Trilaminar, clear halo"
                value={newRemarks}
                onChange={(e) => setNewRemarks(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-primary hover:bg-primary-mid text-white rounded text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98 whitespace-nowrap h-[32px]"
            >
              Add Record
            </button>
          </div>
        </form>
      </div>

      {/* Serial Tracking Table with Perfectly Aligned Headers & Rows */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-600 tracking-wider">
              <th className="py-2.5 px-3 w-32">Scan Date</th>
              <th className="py-2.5 px-3 w-24">Cycle Day</th>
              <th className="py-2.5 px-3 w-28">Thickness</th>
              <th className="py-2.5 px-3">Echogenicity Pattern</th>
              <th className="py-2.5 px-3">Doppler Flow</th>
              <th className="py-2.5 px-3">Clinical Remarks</th>
              <th className="py-2.5 px-3 text-right w-16">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  No ultrasound assessments recorded yet. Use the card above to add baseline or serial TVS scans.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const mmVal = parseFloat(log.thickness_mm);
                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <input
                        type="date"
                        value={log.date}
                        onChange={(e) => handleUpdateLog(log.id, 'date', e.target.value)}
                        className="text-xs bg-transparent border-b border-transparent focus:border-primary focus:bg-white text-slate-800 font-semibold"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-medium">Day</span>
                        <input
                          type="number"
                          value={log.cycle_day}
                          onChange={(e) => handleUpdateLog(log.id, 'cycle_day', Number(e.target.value))}
                          className="w-10 text-xs font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-primary focus:bg-white text-center"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="inline-flex items-center gap-0.5">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="30"
                          value={log.thickness_mm}
                          onChange={(e) => handleUpdateLog(log.id, 'thickness_mm', e.target.value)}
                          className={`w-12 text-xs font-extrabold text-right bg-transparent border-b border-transparent focus:border-primary focus:bg-white ${
                            mmVal >= 8 ? 'text-emerald-700' : mmVal >= 7 ? 'text-primary' : 'text-amber-700'
                          }`}
                        />
                        <span className="text-[11px] text-slate-500 font-bold ml-0.5">mm</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={log.pattern}
                        onChange={(e) => handleUpdateLog(log.id, 'pattern', e.target.value)}
                        className="text-xs bg-transparent border-b border-transparent focus:border-primary focus:bg-white text-slate-800 font-medium"
                      >
                        <option value="Trilaminar (Type A)">Trilaminar Triple-Line (Type A)</option>
                        <option value="Intermediate (Type B)">Intermediate (Type B)</option>
                        <option value="Homogenous / Secretory (Type C)">Homogenous / Hyperechoic (Type C)</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={log.doppler_zone}
                        onChange={(e) => handleUpdateLog(log.id, 'doppler_zone', e.target.value)}
                        className="text-xs bg-transparent border-b border-transparent focus:border-primary focus:bg-white text-slate-700"
                      >
                        <option value="Zone 1 (Vascularity absent)">Zone 1 (Vascularity absent)</option>
                        <option value="Zone 2 (Outer myometrium)">Zone 2 (Outer myometrium)</option>
                        <option value="Zone 3 (Sub-endometrial halo)">Zone 3 (Sub-endometrial halo)</option>
                        <option value="Zone 4 (Penetrating spiral arteries)">Zone 4 (Penetrating spiral arteries)</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={log.remarks}
                        onChange={(e) => handleUpdateLog(log.id, 'remarks', e.target.value)}
                        className="w-full text-xs bg-transparent border-b border-transparent focus:border-primary focus:bg-white text-slate-600 italic"
                        placeholder="e.g. Trilaminar pattern, quiet ovaries"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveLog(log.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Clinical Guidance Notice */}
      <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          Clinical Target: Endometrial thickness &ge; 7.5 &ndash; 8.0 mm with multilayered trilaminar pattern on day of trigger/progesterone start correlates with highest clinical pregnancy rates.
        </span>
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-[11px] text-slate-500 font-medium">
          Step 5 of 7 · Endometrial TVS Receptivity
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            {isSaved ? 'Saved' : 'Save Details'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-5 py-2 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <span>Save &amp; Next: Stimulation Schedule →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
