'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Activity, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { ipdApi } from '@/features/ipd/api';
import { toast } from '@/contexts/ToastContext';

interface RescheduleVitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string;
  admissionId?: string;
  patientName?: string;
  bedNumber?: string;
  currentFrequency?: string;
  currentScheduledTime?: string;
  onSuccess: () => void;
}

const FREQUENCY_OPTIONS = [
  { value: 'Q1H', label: 'Q1H — Every 1 Hour (ICU / Critical)', hours: 1 },
  { value: 'Q2H', label: 'Q2H — Every 2 Hours (Post-Op / Step-Down)', hours: 2 },
  { value: 'Q4H', label: 'Q4H — Every 4 Hours (Standard Inpatient)', hours: 4 },
  { value: 'Q6H', label: 'Q6H — Every 6 Hours', hours: 6 },
  { value: 'Q8H', label: 'Q8H — Every 8 Hours (TID)', hours: 8 },
  { value: 'Q12H', label: 'Q12H — Twice Daily (BD)', hours: 12 },
  { value: 'OD', label: 'OD — Once Daily', hours: 24 },
  { value: 'PRN', label: 'PRN — As Needed (No recurring queue)', hours: 0 },
];

function getIsoDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function RescheduleVitalModal({
  isOpen,
  onClose,
  taskId,
  admissionId,
  patientName,
  bedNumber,
  currentFrequency = 'Q4H',
  currentScheduledTime,
  onSuccess,
}: RescheduleVitalModalProps) {
  const [selectedFreq, setSelectedFreq] = useState(currentFrequency);
  const [customHours, setCustomHours] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedFreq(currentFrequency || 'Q4H');
    setNotes('');

    if (currentScheduledTime) {
      try {
        const parsed = new Date(currentScheduledTime);
        if (!isNaN(parsed.getTime())) {
          setScheduledTime(getIsoDateTimeLocal(parsed));
          return;
        }
      } catch {
        // Fallback
      }
    }

    // Default to next interval from now
    const matched = FREQUENCY_OPTIONS.find((f) => f.value === (currentFrequency || 'Q4H'));
    const hours = matched ? matched.hours : 4;
    const nextDate = new Date();
    if (hours > 0) nextDate.setHours(nextDate.getHours() + hours);
    setScheduledTime(getIsoDateTimeLocal(nextDate));
  }, [isOpen, currentFrequency, currentScheduledTime]);

  const handleFrequencySelect = (val: string) => {
    setSelectedFreq(val);
    const matched = FREQUENCY_OPTIONS.find((f) => f.value === val);
    if (matched && matched.hours > 0) {
      const nextDate = new Date();
      nextDate.setHours(nextDate.getHours() + matched.hours);
      setScheduledTime(getIsoDateTimeLocal(nextDate));
    }
  };

  const effectiveFrequency = selectedFreq === 'CUSTOM' ? `Q${customHours || '4'}H` : selectedFreq;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formattedDate = scheduledTime ? new Date(scheduledTime).toISOString() : undefined;

      if (taskId) {
        await ipdApi.rescheduleNursingTask(taskId, {
          frequency: effectiveFrequency,
          scheduled_time: formattedDate,
          notes: notes.trim() || undefined,
        });
      } else if (admissionId) {
        await ipdApi.updateAdmissionVitalsFrequency(admissionId, {
          frequency: effectiveFrequency,
          scheduled_time: formattedDate,
          notes: notes.trim() || undefined,
        });
      }

      toast.success(
        'Vitals Schedule Updated',
        `Adjusted monitoring to ${effectiveFrequency} for ${patientName || 'patient'}.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Schedule Update Failed', err?.message || 'Could not update vitals schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Badge variant="purple" className="text-xs font-bold">
              Bed: {bedNumber || '—'}
            </Badge>
            <span className="text-xs text-slate-500 font-medium">·</span>
            <span className="text-xs font-bold text-slate-800">{patientName || 'Inpatient'}</span>
          </div>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2 mt-1">
            <Clock className="w-4 h-4 text-rose-600" />
            <span>Reschedule Vital Checks & Frequency</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Modify vital signs monitoring frequency and adjust upcoming scheduled check time.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs">
          {/* Frequency Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">
              Monitoring Frequency / Interval
            </label>
            <select
              value={selectedFreq}
              onChange={(e) => handleFrequencySelect(e.target.value)}
              className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              <option value="CUSTOM">Custom Interval (Hours)...</option>
            </select>
          </div>

          {selectedFreq === 'CUSTOM' && (
            <div className="space-y-1.5 p-3 rounded-md bg-slate-50 border border-slate-200">
              <label className="font-bold text-slate-700 block">Repeat Every (Hours):</label>
              <Input
                type="number"
                min="1"
                max="72"
                placeholder="e.g., 3 for Q3H"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                className="h-8 text-xs bg-white"
              />
            </div>
          )}

          {/* Next Scheduled Check Time */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Next Upcoming Check Date & Time</span>
              <span className="text-[10px] text-slate-400 font-normal">Auto-set or override</span>
            </label>
            <div className="relative">
              <Input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Clinical Reason / Note */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">
              Clinical Reason / Order Note <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <Input
              type="text"
              placeholder="e.g., Post-op vital monitoring, Fever spike Q2H observation"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting} className="h-8 text-xs font-semibold">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-8 text-xs font-bold gap-1.5 bg-[#2878a8] hover:bg-[#20638c] text-white shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Updating...' : 'Save Vital Schedule'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
