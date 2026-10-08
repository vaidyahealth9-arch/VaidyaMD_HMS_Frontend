'use client';

import React, { useState, useEffect } from 'react';
import { appointmentsApi } from '@/lib/api';
import { RefreshCw, X, Calendar, Clock, User, AlertTriangle } from 'lucide-react';
import { toast } from '@/contexts/ToastContext';

const getNowDateTimeLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: any | null;
  doctors: any[];
}

export default function RescheduleAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  appointment: rescheduleApt,
  doctors,
}: RescheduleAppointmentModalProps) {
  const [rescheduleForm, setRescheduleForm] = useState({
    scheduled_at: '',
    doctor_id: '',
  });

  useEffect(() => {
    if (rescheduleApt) {
      setRescheduleForm({
        scheduled_at: rescheduleApt.scheduled_at ? rescheduleApt.scheduled_at.substring(0, 16) : '',
        doctor_id: rescheduleApt.doctor_id || '',
      });
    }
  }, [rescheduleApt]);

  if (!isOpen || !rescheduleApt) return null;

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleApt) return;

    const schedMs = new Date(rescheduleForm.scheduled_at).getTime();
    if (schedMs < Date.now() - 60000) {
      toast.error('Invalid Date/Time', 'Rescheduled appointment cannot be set to a past date or time.');
      return;
    }

    try {
      await appointmentsApi.update(rescheduleApt.id, {
        scheduled_at: new Date(rescheduleForm.scheduled_at).toISOString(),
        doctor_id: rescheduleForm.doctor_id,
      });
      toast.success('Rescheduled', 'Appointment time updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Failed to reschedule', err.message);
    }
  };

  return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-base text-slate-900">Reschedule Appointment</h3>
              </div>
              <button 
                onClick={() => onClose()} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleReschedule} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-sm font-bold text-slate-800">{rescheduleApt.patient_name}</p>
                <p className="text-xs text-slate-500 font-mono">{rescheduleApt.patient_vid}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Current Time: {new Date(rescheduleApt.scheduled_at).toLocaleString('en-IN')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  min={getNowDateTimeLocal()}
                  value={rescheduleForm.scheduled_at}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, scheduled_at: e.target.value })}
                  required
                  className="vmd-input text-xs font-semibold"
                />
                <p className="text-[10px] text-slate-400 mt-1">Only current and future slots can be selected.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Treating Consultant</label>
                <select
                  value={rescheduleForm.doctor_id}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, doctor_id: e.target.value })}
                  required
                  className="vmd-input text-xs"
                >
                  {doctors.map((d) => {
                    const docName = d.name?.trim() || '';
                    const formattedName = /^dr\.?\s+/i.test(docName) ? docName : `Dr. ${docName}`;
                    return (
                      <option key={d.id} value={d.id}>
                        {formattedName} {d.role === 'admin' && d.is_doctor ? '(Admin + Doctor)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary hover:bg-primary-mid text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Confirm Reschedule
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
