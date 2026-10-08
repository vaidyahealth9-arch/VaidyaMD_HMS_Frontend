'use client';

import React from 'react';
import { X } from 'lucide-react';

interface BedModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBed: any;
  wards: any[];
  bedFormWardId: string;
  setBedFormWardId: (v: string) => void;
  bedFormNumber: string;
  setBedFormNumber: (v: string) => void;
  bedFormType: string;
  setBedFormType: (v: string) => void;
  bedFormRate: number;
  setBedFormRate: (v: number) => void;
  bedFormStatus: string;
  setBedFormStatus: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function BedModal({
  isOpen,
  onClose,
  editingBed,
  wards,
  bedFormWardId,
  setBedFormWardId,
  bedFormNumber,
  setBedFormNumber,
  bedFormType,
  setBedFormType,
  bedFormRate,
  setBedFormRate,
  bedFormStatus,
  setBedFormStatus,
  onSubmit,
}: BedModalProps) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingBed ? 'Edit Bed Details' : 'Add New Hospital Bed'}
              </h3>
              <button onClick={() => onClose()} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Ward *</label>
                <select
                  required
                  disabled={Boolean(editingBed)}
                  value={bedFormWardId}
                  onChange={(e) => {
                    setBedFormWardId(e.target.value);
                    const selectedW = wards.find((w) => w.id === e.target.value);
                    if (selectedW && !editingBed) {
                      setBedFormRate(selectedW.base_charge_per_day || 2500);
                    }
                  }}
                  className="vmd-input text-xs w-full bg-white"
                >
                  <option value="">Select Ward...</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code}) — ₹{w.base_charge_per_day}/day
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bed Number / Identifier *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DC-05 or DLX-103"
                    value={bedFormNumber}
                    onChange={(e) => setBedFormNumber(e.target.value)}
                    className="vmd-input text-xs w-full font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bed Type</label>
                  <select
                    value={bedFormType}
                    onChange={(e) => setBedFormType(e.target.value)}
                    className="vmd-input text-xs w-full bg-white"
                  >
                    <option value="standard_manual">Standard Manual</option>
                    <option value="electric_fowler">Electric Fowler</option>
                    <option value="icu_monitor_bed">ICU Monitor Bed</option>
                    <option value="deluxe_suite">Deluxe Suite Bed</option>
                    <option value="daycare_recliner">Daycare Recliner</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Daily Tariff (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={bedFormRate}
                    onChange={(e) => setBedFormRate(Number(e.target.value))}
                    className="vmd-input text-xs w-full font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Status</label>
                  <select
                    value={bedFormStatus}
                    onChange={(e) => setBedFormStatus(e.target.value)}
                    className="vmd-input text-xs w-full bg-white font-semibold"
                  >
                    <option value="Vacant">Vacant (Available)</option>
                    <option value="Cleaning">Cleaning / Sanitization</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Occupied">Occupied</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
                  {editingBed ? 'Update Bed' : 'Create Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
