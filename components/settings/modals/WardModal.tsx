'use client';

import React from 'react';
import { X } from 'lucide-react';

interface WardModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingWard: any;
  wardFormName: string;
  setWardFormName: (v: string) => void;
  wardFormCode: string;
  setWardFormCode: (v: string) => void;
  wardFormDept: string;
  setWardFormDept: (v: string) => void;
  wardFormRate: number;
  setWardFormRate: (v: number) => void;
  wardFormBeds: number;
  setWardFormBeds: (v: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function WardModal({
  isOpen,
  onClose,
  editingWard,
  wardFormName,
  setWardFormName,
  wardFormCode,
  setWardFormCode,
  wardFormDept,
  setWardFormDept,
  wardFormRate,
  setWardFormRate,
  wardFormBeds,
  setWardFormBeds,
  onSubmit,
}: WardModalProps) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingWard ? 'Edit Ward Details' : 'Create New Inpatient Ward'}
              </h3>
              <button onClick={() => onClose()} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ward Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Day Care Post-OP Recovery"
                  value={wardFormName}
                  onChange={(e) => setWardFormName(e.target.value)}
                  className="vmd-input text-xs w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ward Code *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingWard)}
                    placeholder="e.g. DAYCARE"
                    value={wardFormCode}
                    onChange={(e) => setWardFormCode(e.target.value.toUpperCase())}
                    className="vmd-input text-xs w-full font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Inpatient Care"
                    value={wardFormDept}
                    onChange={(e) => setWardFormDept(e.target.value)}
                    className="vmd-input text-xs w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Base Tariff / Day (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={wardFormRate}
                    onChange={(e) => setWardFormRate(Number(e.target.value))}
                    className="vmd-input text-xs w-full font-mono font-bold"
                  />
                </div>
                {!editingWard && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Auto-Provision Beds</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={wardFormBeds}
                      onChange={(e) => setWardFormBeds(Number(e.target.value))}
                      className="vmd-input text-xs w-full font-mono"
                    />
                  </div>
                )}
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
                  {editingWard ? 'Update Ward' : 'Create Ward'}
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
