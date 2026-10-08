'use client';

import React from 'react';
import { X } from 'lucide-react';

interface CycleTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCycleType: any;
  cycleTypeForm: any;
  setCycleTypeForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CycleTypeModal({
  isOpen,
  onClose,
  editingCycleType,
  cycleTypeForm,
  setCycleTypeForm,
  onSubmit,
}: CycleTypeModalProps) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingCycleType ? 'Edit Treatment Modality' : 'Add New ART Modality'}
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Modality Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ICSI + PGT-A or Oocyte Vitrification"
                  value={cycleTypeForm.name}
                  onChange={(e) => setCycleTypeForm({ ...cycleTypeForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Clinical Category</label>
                  <select
                    value={cycleTypeForm.category}
                    onChange={(e) => setCycleTypeForm({ ...cycleTypeForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                  >
                    <option value="Stimulation">Stimulation</option>
                    <option value="FET">Frozen Embryo Transfer (FET)</option>
                    <option value="IUI">Intrauterine Insemination (IUI)</option>
                    <option value="Preservation">Cryopreservation</option>
                    <option value="Third-Party">Third-Party Reproduction</option>
                    <option value="Diagnostics">Diagnostics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Display Order</label>
                  <input
                    type="number"
                    value={cycleTypeForm.display_order}
                    onChange={(e) => setCycleTypeForm({ ...cycleTypeForm, display_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={cycleTypeForm.is_active}
                  onChange={(e) => setCycleTypeForm({ ...cycleTypeForm, is_active: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="font-semibold text-slate-700">Active Modality (Selectable in Cycle Wizard)</span>
              </label>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm"
                >
                  {editingCycleType ? 'Update Modality' : 'Save Modality'}
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
