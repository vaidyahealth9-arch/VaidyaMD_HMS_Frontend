'use client';

import React, { useState, useEffect } from 'react';
import { patientsApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import { X, AlertTriangle, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface EditAlertsModalProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  initialAlerts?: string[];
  onSuccess?: (updatedAlerts: string[]) => void;
}

const COMMON_PRESETS = [
  'Penicillin Allergy',
  'Sulfa Drugs Allergy',
  'Severe OHSS Risk',
  'Poor Ovarian Reserve',
  'PCOS (High Responder)',
  'Recurrent Implantation Failure',
  'Thrombophilia / DVT Risk',
  'Hypothyroidism',
  'Hypertension',
  'Gestational Diabetes',
  'Previous Ectopic Pregnancy',
  'Latex Allergy',
  'HBsAg Reactive',
];

export default function EditAlertsModal({
  open,
  onClose,
  patientId,
  patientName,
  initialAlerts = [],
  onSuccess,
}: EditAlertsModalProps) {
  const [alerts, setAlerts] = useState<string[]>([]);
  const [newAlertInput, setNewAlertInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAlerts(Array.isArray(initialAlerts) ? [...initialAlerts] : []);
      setNewAlertInput('');
    }
  }, [open, initialAlerts]);

  if (!open) return null;

  const handleAddAlert = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (alerts.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      toast.info('Already Added', `"${trimmed}" is already in clinical alerts.`);
      return;
    }
    setAlerts((prev) => [...prev, trimmed]);
    setNewAlertInput('');
  };

  const handleRemoveAlert = (indexToRemove: number) => {
    setAlerts((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await patientsApi.updateAlerts(patientId, alerts);
      toast.success('Clinical Alerts Updated', `Alerts saved for ${patientName}`);
      if (onSuccess) onSuccess(alerts);
      onClose();
    } catch (err: any) {
      toast.error('Failed to Save Alerts', err.message || 'Could not update clinical alerts');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Manage Clinical Alerts &amp; Allergies</h3>
              <p className="text-[11px] text-slate-500 font-medium">Patient: {patientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Active Alerts List */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Active Alerts ({alerts.length})</span>
              {alerts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAlerts([])}
                  className="text-[11px] text-rose-600 hover:underline font-semibold"
                >
                  Clear All
                </button>
              )}
            </label>

            {alerts.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                No active clinical alerts or allergies recorded for this patient.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                {alerts.map((alertText, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-950 border border-amber-300 rounded-md text-xs font-bold shadow-2xs"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                    <span>{alertText}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAlert(idx)}
                      className="w-4 h-4 rounded-full hover:bg-amber-200 text-amber-800 flex items-center justify-center transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Add Custom Alert Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Add New Alert / Allergy</label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddAlert(newAlertInput);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newAlertInput}
                onChange={(e) => setNewAlertInput(e.target.value)}
                placeholder="e.g. Aspirin Allergy, Factor V Leiden, Pre-eclampsia..."
                className="flex-1 h-9 px-3 rounded-md border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <Button
                type="submit"
                disabled={!newAlertInput.trim()}
                className="h-9 px-4 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </form>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Quick Suggestions
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {COMMON_PRESETS.map((preset) => {
                const isSelected = alerts.some((a) => a.toLowerCase() === preset.toLowerCase());
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={isSelected}
                    onClick={() => handleAddAlert(preset)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      isSelected
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-900'
                    }`}
                  >
                    + {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 px-5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-sm"
            >
              {isSaving ? 'Saving...' : 'Save Alerts'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
