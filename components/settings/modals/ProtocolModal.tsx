'use client';

import React from 'react';
import { X, Plus, Trash2, Dna, Activity, Calendar, Pill, Check } from 'lucide-react';

interface ProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProtocol: any;
  protocolForm: any;
  setProtocolForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ProtocolModal({
  isOpen,
  onClose,
  editingProtocol,
  protocolForm,
  setProtocolForm,
  onSubmit,
}: ProtocolModalProps) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingProtocol ? `Edit Protocol: ${editingProtocol.name}` : 'Add New Clinical Protocol Template'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure protocol metadata, prescription dosing rules, and scheduled clinical scans, labs, and procedures.
                </p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* SECTION 1: PROTOCOL IDENTITY */}
              <div className="bg-slate-50/50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Dna className="w-4 h-4 text-primary" /> Protocol Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">Protocol Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Antagonist (Flexible) Protocol"
                      value={protocolForm.name}
                      onChange={(e) => setProtocolForm({ ...protocolForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Category *</label>
                    <select
                      value={protocolForm.category}
                      onChange={(e) => setProtocolForm({ ...protocolForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white capitalize"
                    >
                      <option value="stimulation">Stimulation</option>
                      <option value="fet">FET Endometrial Prep</option>
                      <option value="luteal">Luteal Phase Support</option>
                      <option value="iui">IUI Mild Stimulation</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-slate-700 font-semibold mb-1">Clinical Description / Indication</label>
                    <input
                      type="text"
                      placeholder="e.g. Standard GnRH antagonist protocol for normal-to-high responders"
                      value={protocolForm.description}
                      onChange={(e) => setProtocolForm({ ...protocolForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: MEDICATION RULES */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-primary" /> Configured Prescriptions & Drug Rules ({protocolForm.rules.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Define medications, cycle day offsets, and dosing schedules.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProtocolForm({
                        ...protocolForm,
                        rules: [
                          ...protocolForm.rules,
                          {
                            drug_name: '',
                            dose: '',
                            route: 'SC',
                            frequency: 'OD',
                            day_start_offset: 1,
                            day_end_offset: 10,
                            instructions: '',
                          },
                        ],
                      })
                    }
                    className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs rounded-lg flex items-center gap-1 border border-primary/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medication
                  </button>
                </div>

                {protocolForm.rules.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Medication *</th>
                          <th className="py-2.5 px-2 w-24">Dose *</th>
                          <th className="py-2.5 px-2 w-24">Route</th>
                          <th className="py-2.5 px-2 w-20">Freq</th>
                          <th className="py-2.5 px-2 w-16 text-center">Start Day</th>
                          <th className="py-2.5 px-2 w-16 text-center">End Day</th>
                          <th className="py-2.5 px-3">Instructions</th>
                          <th className="py-2.5 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {protocolForm.rules.map((rule: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                required
                                placeholder="e.g. Inj Gonal-F"
                                value={rule.drug_name}
                                onChange={(e) => {
                                  const updated = [...protocolForm.rules];
                                  updated[idx].drug_name = e.target.value;
                                  setProtocolForm({ ...protocolForm, rules: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white font-medium"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                required
                                placeholder="225 IU"
                                value={rule.dose}
                                onChange={(e) => {
                                  const updated = [...protocolForm.rules];
                                  updated[idx].dose = e.target.value;
                                  setProtocolForm({ ...protocolForm, rules: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white font-mono font-bold text-primary"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <select
                                value={rule.route || 'SC'}
                                onChange={(e) => {
                                  const updated = [...protocolForm.rules];
                                  updated[idx].route = e.target.value;
                                  setProtocolForm({ ...protocolForm, rules: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-[11px]"
                              >
                                <option value="SC">SC</option>
                                <option value="Oral">Oral</option>
                                <option value="IM">IM</option>
                                <option value="Vaginal">Vaginal</option>
                                <option value="Sublingual">Sublingual</option>
                              </select>
                            </td>
                            <td className="py-1.5 px-2">
                              <select
                                value={rule.frequency || 'OD'}
                                onChange={(e) => {
                                  const updated = [...protocolForm.rules];
                                  updated[idx].frequency = e.target.value;
                                  setProtocolForm({ ...protocolForm, rules: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-[11px]"
                              >
                                <option value="OD">OD</option>
                                <option value="BD">BD</option>
                                <option value="TDS">TDS</option>
                                <option value="QID">QID</option>
                                <option value="STAT">STAT</option>
                              </select>
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <input
                                type="number"
                                required
                                value={rule.day_start_offset}
                                onChange={(e) => {
                                  const updated = [...protocolForm.rules];
                                  updated[idx].day_start_offset = parseInt(e.target.value) || 0;
                                  setProtocolForm({ ...protocolForm, rules: updated });
                                }}
                                className="w-14 px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-center"
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <input
                                type="number"
                                required
                                value={rule.day_end_offset}
                                onChange={(e) => {
                                  const updated = [...protocolForm.rules];
                                  updated[idx].day_end_offset = parseInt(e.target.value) || 0;
                                  setProtocolForm({ ...protocolForm, rules: updated });
                                }}
                                className="w-14 px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-center"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                placeholder="e.g. Evening at 9 PM"
                                value={rule.instructions || ''}
                                onChange={(e) => {
                                  const updated = [...protocolForm.rules];
                                  updated[idx].instructions = e.target.value;
                                  setProtocolForm({ ...protocolForm, rules: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-[11px]"
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setProtocolForm({
                                    ...protocolForm,
                                    rules: protocolForm.rules.filter((_: any, i: number) => i !== idx),
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Remove rule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center text-slate-400">
                    No medication rules added yet. Click &quot;+ Add Medication&quot; to configure dosing.
                  </div>
                )}
              </div>

              {/* SECTION 3: TIMELINE EVENTS */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-blue-600" /> Scheduled Scans, Labs & Procedures ({protocolForm.timeline_events?.length || 0})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Schedule follicular ultrasound scans (🔍), diagnostic blood tests (🧪), and procedures (🧫).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProtocolForm({
                        ...protocolForm,
                        timeline_events: [
                          ...(protocolForm.timeline_events || []),
                          {
                            type: 'scan',
                            day_offset: 2,
                            title: '',
                            instructions: '',
                          },
                        ],
                      })
                    }
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg flex items-center gap-1 border border-blue-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Clinical Event
                  </button>
                </div>

                {protocolForm.timeline_events && protocolForm.timeline_events.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 w-36">Event Track *</th>
                          <th className="py-2.5 px-2 w-20 text-center">Day Offset *</th>
                          <th className="py-2.5 px-3">Event Title *</th>
                          <th className="py-2.5 px-3">Clinical Instructions / Criteria</th>
                          <th className="py-2.5 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {protocolForm.timeline_events.map((ev: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-1.5 px-3">
                              <select
                                value={ev.type || 'scan'}
                                onChange={(e) => {
                                  const updated = [...(protocolForm.timeline_events || [])];
                                  updated[idx].type = e.target.value;
                                  setProtocolForm({ ...protocolForm, timeline_events: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white font-semibold text-[11px]"
                              >
                                <option value="scan">🔍 Ultrasound Scan</option>
                                <option value="investigation">🧪 Diagnostic Lab</option>
                                <option value="procedure">🧫 Clinical Procedure</option>
                              </select>
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <input
                                type="number"
                                required
                                value={ev.day_offset}
                                onChange={(e) => {
                                  const updated = [...(protocolForm.timeline_events || [])];
                                  updated[idx].day_offset = parseInt(e.target.value) || 0;
                                  setProtocolForm({ ...protocolForm, timeline_events: updated });
                                }}
                                className="w-16 px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-center font-bold"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                required
                                placeholder="e.g. Follicular Monitoring Scan or Serum E2"
                                value={ev.title}
                                onChange={(e) => {
                                  const updated = [...(protocolForm.timeline_events || [])];
                                  updated[idx].title = e.target.value;
                                  setProtocolForm({ ...protocolForm, timeline_events: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white font-medium"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                placeholder="e.g. Baseline AFC scan or Trigger criteria"
                                value={ev.instructions || ''}
                                onChange={(e) => {
                                  const updated = [...(protocolForm.timeline_events || [])];
                                  updated[idx].instructions = e.target.value;
                                  setProtocolForm({ ...protocolForm, timeline_events: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-[11px]"
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setProtocolForm({
                                    ...protocolForm,
                                    timeline_events: protocolForm.timeline_events.filter((_: any, i: number) => i !== idx),
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Remove event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center text-slate-400">
                    No scheduled clinical events added yet. Click &quot;+ Add Clinical Event&quot; to schedule milestone scans, labs, or OPU/ET.
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> {editingProtocol ? 'Update Protocol & Rules' : 'Save Protocol & Rules'}
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
