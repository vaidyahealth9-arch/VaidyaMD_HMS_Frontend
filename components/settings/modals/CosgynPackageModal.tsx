'use client';

import React from 'react';
import { X, Sparkles, Activity } from 'lucide-react';

interface CosgynPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCosgynTreatment: any;
  cosgynForm: any;
  setCosgynForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CosgynPackageModal({
  isOpen,
  onClose,
  editingCosgynTreatment,
  cosgynForm,
  setCosgynForm,
  onSubmit,
}: CosgynPackageModalProps) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingCosgynTreatment ? 'Edit CosGyn Specialty Package' : 'Create CosGyn Specialty Package'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure regenerative aesthetic gynecology protocol, modalities & tariff</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onClose()}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Package Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Postpartum Pelvic Rejuvenation - Gold"
                  value={cosgynForm.name}
                  onChange={(e) => setCosgynForm({ ...cosgynForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Protocol / Combo Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jet Plasma + Tesla Chair HIFEM"
                    value={cosgynForm.package_combo}
                    onChange={(e) => setCosgynForm({ ...cosgynForm, package_combo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Optional descriptive sub-label</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Package Tariff (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-semibold">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={cosgynForm.price}
                      onChange={(e) => setCosgynForm({ ...cosgynForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Inclusive price billed on prescription</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    Clinical Modality Sessions
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Session quotas for patient passbook</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="text-xs font-semibold text-sky-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      Jet Plasma
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Sessions</label>
                      <input
                        type="number"
                        min="0"
                        value={cosgynForm.jet_plasma_sessions}
                        onChange={(e) => setCosgynForm({ ...cosgynForm, jet_plasma_sessions: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Duration (mins)</label>
                      <input
                        type="number"
                        min="0"
                        value={cosgynForm.jet_plasma_duration_mins}
                        onChange={(e) => setCosgynForm({ ...cosgynForm, jet_plasma_duration_mins: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="text-xs font-semibold text-purple-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Tesla Chair HIFEM
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Sessions</label>
                      <input
                        type="number"
                        min="0"
                        value={cosgynForm.tesla_chair_sessions}
                        onChange={(e) => setCosgynForm({ ...cosgynForm, tesla_chair_sessions: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Duration (mins)</label>
                      <input
                        type="number"
                        min="0"
                        value={cosgynForm.tesla_chair_duration_mins}
                        onChange={(e) => setCosgynForm({ ...cosgynForm, tesla_chair_duration_mins: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="text-xs font-semibold text-rose-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      PRP Revitalization
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Sessions</label>
                      <input
                        type="number"
                        min="0"
                        value={cosgynForm.prp_sessions}
                        onChange={(e) => setCosgynForm({ ...cosgynForm, prp_sessions: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 pt-2">
                      Autologous concentrate therapy
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs text-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {editingCosgynTreatment ? 'Update CosGyn Package' : 'Save CosGyn Package'}
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
