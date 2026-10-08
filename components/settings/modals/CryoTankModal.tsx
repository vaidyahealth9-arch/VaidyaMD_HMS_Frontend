'use client';

import React from 'react';
import { X } from 'lucide-react';

interface CryoTankModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCryoTank: any;
  cryoTankForm: any;
  setCryoTankForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CryoTankModal({
  isOpen,
  onClose,
  editingCryoTank,
  cryoTankForm,
  setCryoTankForm,
  onSubmit,
}: CryoTankModalProps) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingCryoTank ? 'Edit Cryo Tank Storage' : 'Add Cryo Storage Tank'}
              </h3>
              <button onClick={() => onClose()} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tank Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tank 1 — Main Autologous Embryo Bank"
                  value={cryoTankForm.tank_name}
                  onChange={(e) => setCryoTankForm({ ...cryoTankForm, tank_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tank Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TANK-01"
                    value={cryoTankForm.tank_code}
                    onChange={(e) => setCryoTankForm({ ...cryoTankForm, tank_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tank Specimen Type</label>
                  <select
                    value={cryoTankForm.tank_type}
                    onChange={(e) => setCryoTankForm({ ...cryoTankForm, tank_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                  >
                    <option value="Autologous Embryos">Autologous Embryos</option>
                    <option value="Autologous Gametes">Autologous Gametes (Sperm/Oocytes)</option>
                    <option value="Donor Gametes">Donor Gametes (Certified Bank)</option>
                    <option value="Quarantine / Infectious">Quarantine / Reactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Canister Count</label>
                  <input
                    type="number"
                    min="1"
                    value={cryoTankForm.canister_count}
                    onChange={(e) => setCryoTankForm({ ...cryoTankForm, canister_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Capacity (Litres)</label>
                  <input
                    type="number"
                    min="1"
                    value={cryoTankForm.capacity_litres}
                    onChange={(e) => setCryoTankForm({ ...cryoTankForm, capacity_litres: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Physical Location / Room</label>
                <input
                  type="text"
                  placeholder="e.g. IVF Cleanroom Cryo Suite A"
                  value={cryoTankForm.location}
                  onChange={(e) => setCryoTankForm({ ...cryoTankForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm"
                >
                  {editingCryoTank ? 'Update Tank' : 'Save Tank'}
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
