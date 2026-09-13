'use client';

import React, { useState } from 'react';
import { cryoApi } from '@/lib/api';

interface CryoThawModalProps {
  selectedThawSample: any;
  staffUsers: any[];
  onClose: () => void;
  onSaved: () => void;
}

export default function CryoThawModal({ selectedThawSample, staffUsers, onClose, onSaved }: CryoThawModalProps) {
  const [thawForm, setThawForm] = useState({
    embryos_warmed: 2,
    embryos_survived: 2,
    survival_rate_pct: 100,
    disposition: 'Transferred',
    witness_id: staffUsers.length > 1 ? staffUsers[1].id : '',
    notes: 'Thawed for FET cycle.',
  });

  const handleConfirmThaw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThawSample) return;
    try {
      await cryoApi.thawSample(selectedThawSample.id, {
        embryos_warmed: thawForm.embryos_warmed,
        embryos_survived: thawForm.embryos_survived,
        survival_rate_pct: parseFloat(String(thawForm.survival_rate_pct)) || 100,
        disposition: thawForm.disposition,
        witness_id: thawForm.witness_id,
        notes: thawForm.notes,
      });
      alert('Thaw survival event logged to audit chain of custody!');
      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to record thaw event');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 shadow-2xl">
        <h3 className="font-bold text-base text-slate-900">Record Thaw / Warming Event</h3>
        <p className="text-xs text-slate-500">Straw: {selectedThawSample.straw_number} · Total: {selectedThawSample.no_of_embryos} embryos</p>
        <form onSubmit={handleConfirmThaw} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Embryos Warmed</label>
              <input
                type="number"
                value={thawForm.embryos_warmed}
                onChange={(e) => setThawForm({ ...thawForm, embryos_warmed: parseInt(e.target.value) || 0 })}
                className="vmd-input text-xs w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Embryos Survived</label>
              <input
                type="number"
                value={thawForm.embryos_survived}
                onChange={(e) => {
                  const surv = parseInt(e.target.value) || 0;
                  const pct = thawForm.embryos_warmed > 0 ? (surv / thawForm.embryos_warmed) * 100 : 100;
                  setThawForm({ ...thawForm, embryos_survived: surv, survival_rate_pct: pct });
                }}
                className="vmd-input text-xs font-bold text-emerald-800 w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Post-Thaw Survival Rate %</label>
            <input
              type="number"
              value={thawForm.survival_rate_pct}
              readOnly
              className="vmd-input text-xs font-bold text-emerald-700 bg-slate-50 w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Dual-Witness Verification By</label>
            <select
              value={thawForm.witness_id}
              onChange={(e) => setThawForm({ ...thawForm, witness_id: e.target.value })}
              className="vmd-input text-xs w-full"
              required
            >
              <option value="" disabled>Select witness...</option>
              {staffUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Notes</label>
            <input
              type="text"
              value={thawForm.notes}
              onChange={(e) => setThawForm({ ...thawForm, notes: e.target.value })}
              className="vmd-input text-xs w-full"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-3 bg-amber-600 text-white font-bold text-xs rounded-md hover:bg-amber-700">
              Confirm Thaw Event
            </button>
            <button type="button" onClick={onClose} className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-md">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
