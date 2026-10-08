'use client';

import React, { useState, useEffect } from 'react';
import { appointmentsApi } from '@/lib/api';
import { Activity, X, CheckCircle2, Stethoscope } from 'lucide-react';
import { toast } from '@/contexts/ToastContext';

interface NurseTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: any | null;
}

export default function NurseTriageModal({
  isOpen,
  onClose,
  onSuccess,
  appointment: triageApt,
}: NurseTriageModalProps) {
  const [triageForm, setTriageForm] = useState({
    bp: '',
    hr: '',
    temp: '',
    weight: '',
    spo2: '',
    chief_complaint: '',
  });
  const [isSavingTriage, setIsSavingTriage] = useState(false);

  useEffect(() => {
    if (triageApt) {
      setTriageForm({
        bp: triageApt.vitals?.bp || '',
        hr: triageApt.vitals?.hr || '',
        temp: triageApt.vitals?.temp || '',
        weight: triageApt.vitals?.weight || '',
        spo2: triageApt.vitals?.spo2 || '',
        chief_complaint: triageApt.chief_complaint || triageApt.reason || '',
      });
    }
  }, [triageApt]);

  if (!isOpen || !triageApt) return null;

  const handleSaveTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triageApt) return;
    try {
      setIsSavingTriage(true);
      await appointmentsApi.triage(triageApt.id, {
        vitals: {
          bp: triageForm.bp,
          hr: triageForm.hr,
          temp: triageForm.temp,
          weight: triageForm.weight,
          spo2: triageForm.spo2,
        },
        chief_complaint: triageForm.chief_complaint,
      });
      toast.success('Triage Saved', `Recorded clinical vitals for ${triageApt.patient_name}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Failed to save triage', err.message);
    } finally {
      setIsSavingTriage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[rgb(var(--clr-primary))]" />
                Nurse Clinical Triage — {triageApt.patient_name}
              </h3>
              <button
                onClick={() => onClose()}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTriage} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    placeholder="120/80"
                    value={triageForm.bp}
                    onChange={(e) => setTriageForm({ ...triageForm, bp: e.target.value })}
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Heart Rate (bpm)</label>
                  <input
                    type="text"
                    placeholder="75"
                    value={triageForm.hr}
                    onChange={(e) => setTriageForm({ ...triageForm, hr: e.target.value })}
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Temperature (°F)</label>
                  <input
                    type="text"
                    placeholder="98.6"
                    value={triageForm.temp}
                    onChange={(e) => setTriageForm({ ...triageForm, temp: e.target.value })}
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Weight (kg)</label>
                  <input
                    type="text"
                    placeholder="65"
                    value={triageForm.weight}
                    onChange={(e) => setTriageForm({ ...triageForm, weight: e.target.value })}
                    className="vmd-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Chief Complaint</label>
                <textarea
                  rows={3}
                  placeholder="Patient presents for..."
                  value={triageForm.chief_complaint}
                  onChange={(e) => setTriageForm({ ...triageForm, chief_complaint: e.target.value })}
                  className="vmd-input text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingTriage}
                  className="flex-1 py-3 bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
                >
                  {isSavingTriage ? 'Saving...' : 'Save Triage Vitals'}
                </button>
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
  );
}
