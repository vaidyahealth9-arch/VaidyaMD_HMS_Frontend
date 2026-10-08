'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { embryologyApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';

interface DualWitnessModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCycle: any;
  staffUsers: any[];
  onSuccess: () => void;
}

export default function DualWitnessModal({
  isOpen,
  onClose,
  activeCycle,
  staffUsers,
  onSuccess,
}: DualWitnessModalProps) {
  const [witnessDay, setWitnessDay] = useState(0);
  const [checkedById, setCheckedById] = useState('');
  const [witnessedById, setWitnessedById] = useState('');
  const [witnessNotes, setWitnessNotes] = useState('');
  const [witnessError, setWitnessError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !activeCycle) return null;

  const handleSignOffWitness = async (e: React.FormEvent) => {
    e.preventDefault();
    setWitnessError('');

    if (!checkedById || !witnessedById) {
      setWitnessError('Dual-witnessing requires 2 distinct embryologist/witness signatures.');
      return;
    }

    if (checkedById === witnessedById) {
      setWitnessError('Checked By and Witnessed By cannot be the same user.');
      return;
    }

    setIsSubmitting(true);
    try {
      await embryologyApi.signoffWitness({
        treatment_cycle_id: activeCycle.id,
        day_number: witnessDay,
        checked_by_id: checkedById,
        witnessed_by_id: witnessedById,
        notes: witnessNotes || `Day ${witnessDay} dual witness signoff complete.`,
      });
      toast.success(
        'Dual Witnessing Verified',
        `Day ${witnessDay} dual-witness signoff recorded successfully! Next day culture unlocked.`
      );
      setWitnessNotes('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setWitnessError(err.message || 'Witness signoff failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-base text-slate-900">Mandatory Dual-Witnessing Signoff</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {witnessError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs font-bold text-rose-800">
            {witnessError}
          </div>
        )}

        <form onSubmit={handleSignOffWitness} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Culture Day to Sign Off</label>
            <select
              value={witnessDay}
              onChange={(e) => setWitnessDay(parseInt(e.target.value) || 0)}
              className="vmd-input text-xs"
            >
              <option value={0}>Day 0 — OPU &amp; Insemination Check</option>
              <option value={1}>Day 1 — 2PN Fertilization Check</option>
              <option value={2}>Day 2 — Early Cleavage Check</option>
              <option value={3}>Day 3 — Cleavage Assessment</option>
              <option value={5}>Day 5 — Blastocyst Gardner Grading</option>
              <option value={6}>Day 6 — Extended Culture</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Primary Embryologist (Checked By)
            </label>
            <select
              value={checkedById}
              onChange={(e) => setCheckedById(e.target.value)}
              className="vmd-input text-xs"
              required
            >
              <option value="">Select Primary Embryologist</option>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Secondary Witness (Witnessed By)
            </label>
            <select
              value={witnessedById}
              onChange={(e) => setWitnessedById(e.target.value)}
              className="vmd-input text-xs font-bold text-slate-900"
              required
            >
              <option value="">Select Secondary Witness</option>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Audit Notes</label>
            <input
              type="text"
              value={witnessNotes}
              onChange={(e) => setWitnessNotes(e.target.value)}
              placeholder="e.g. Identity and embryo dishes double checked."
              className="vmd-input text-xs"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-primary text-white font-bold text-xs rounded-md hover:bg-primary/90 shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Signing...' : 'Sign Off Dual-Witnessing'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-md"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
