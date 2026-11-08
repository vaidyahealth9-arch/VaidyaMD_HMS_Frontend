'use client';

import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ipdApi } from '@/features/ipd/api';
import { toast } from '@/contexts/ToastContext';

interface VitalsEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  admissionId?: string;
  bedId?: string;
  patientName?: string;
  bedNumber?: string;
  taskId?: string; // If completing an existing task
  onSuccess: () => void;
}

export default function VitalsEntryModal({
  isOpen,
  onClose,
  admissionId,
  bedId,
  patientName,
  bedNumber,
  taskId,
  onSuccess,
}: VitalsEntryModalProps) {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [temperature, setTemperature] = useState('');
  const [spo2, setSpo2] = useState('');
  const [respRate, setRespRate] = useState('');
  const [grbs, setGrbs] = useState('');
  const [painScore, setPainScore] = useState('0');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mean Arterial Pressure calculation
  const sbp = Number(systolic);
  const dbp = Number(diastolic);
  const map = sbp && dbp ? Math.round((2 * dbp + sbp) / 3) : null;

  // Alerts
  const alerts: string[] = [];
  if (spo2 && Number(spo2) < 92) alerts.push(`Critical SpO2: ${spo2}% (Hypoxia alert)`);
  if (sbp && (sbp > 160 || sbp < 90)) alerts.push(`Abnormal Systolic BP: ${sbp} mmHg`);
  if (temperature && Number(temperature) > 100.4) alerts.push(`Fever Alert: ${temperature} °F`);
  if (pulse && (Number(pulse) > 110 || Number(pulse) < 55)) alerts.push(`Abnormal Heart Rate: ${pulse} bpm`);

  const handleSubmit = async () => {
    if (!systolic && !pulse && !temperature && !spo2) {
      toast.error('Incomplete Vitals', 'Please record at least one core vital sign.');
      return;
    }

    setIsSubmitting(true);
    try {
      const vitalsPayload = {
        bp_systolic: systolic ? Number(systolic) : undefined,
        bp_diastolic: diastolic ? Number(diastolic) : undefined,
        bp: systolic && diastolic ? `${systolic}/${diastolic} mmHg` : undefined,
        map,
        pulse: pulse ? Number(pulse) : undefined,
        temperature: temperature ? Number(temperature) : undefined,
        spo2: spo2 ? Number(spo2) : undefined,
        respiratory_rate: respRate ? Number(respRate) : undefined,
        grbs: grbs ? Number(grbs) : undefined,
        pain_score: Number(painScore),
        recorded_at: new Date().toISOString(),
      };

      if (taskId) {
        // Complete specific nursing task
        await ipdApi.completeNursingTask(taskId, {
          vitals_payload: vitalsPayload,
          notes: notes || 'Vitals recorded bedside',
        });
      } else if (admissionId && bedId) {
        // Create new nursing task and mark it complete immediately
        const task = await ipdApi.createNursingTask({
          admission_id: admissionId,
          bed_id: bedId,
          task_type: 'Vitals',
          description: `Bedside Vitals: BP ${systolic}/${diastolic || '—'}, Pulse ${pulse || '—'}, SpO2 ${spo2 || '—'}%`,
          frequency: 'Stat',
        });
        await ipdApi.completeNursingTask(task.id, {
          vitals_payload: vitalsPayload,
          notes: notes || 'Bedside check',
        });
      }

      toast.success('Vitals Documented', `Recorded vitals for Bed ${bedNumber || 'patient'}.`);
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      toast.error('Recording Failed', err?.message || 'Could not save vitals reading.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setTemperature('');
    setSpo2('');
    setRespRate('');
    setGrbs('');
    setPainScore('0');
    setNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Activity className="w-5 h-5 text-rose-600" />
            <span>Record Inpatient Vital Signs</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Log bedside telemetry & physiological vitals for {patientName || 'Inpatient'} (Bed {bedNumber || '—'}).
          </DialogDescription>
        </DialogHeader>

        {alerts.length > 0 && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Clinical Attention Warning</span>
            </div>
            {alerts.map((al, idx) => (
              <p key={idx} className="text-[11px] text-rose-700 font-medium pl-5">
                • {al}
              </p>
            ))}
          </div>
        )}

        <div className="space-y-3 py-1 text-xs">
          {/* Blood Pressure */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase">
              Blood Pressure (mmHg) {map && <span className="text-indigo-600 font-normal">· MAP: {map} mmHg</span>}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Systolic (e.g. 120)"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                className="h-8 text-xs font-mono"
              />
              <Input
                type="number"
                placeholder="Diastolic (e.g. 80)"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* Pulse & SpO2 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">Heart Rate / Pulse (bpm)</label>
              <Input
                type="number"
                placeholder="72"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">SpO2 Oxygen (%)</label>
              <Input
                type="number"
                placeholder="98"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* Temperature & Respiratory Rate */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">Body Temp (°F)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="98.6"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">Resp. Rate (/min)</label>
              <Input
                type="number"
                placeholder="16"
                value={respRate}
                onChange={(e) => setRespRate(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* GRBS & Pain Score */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">GRBS / Sugar (mg/dL)</label>
              <Input
                type="number"
                placeholder="110"
                value={grbs}
                onChange={(e) => setGrbs(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                Pain Score (0 - 10): <span className="text-slate-900 font-bold">{painScore}</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={painScore}
                onChange={(e) => setPainScore(e.target.value)}
                className="w-full accent-rose-600 mt-1 cursor-pointer"
              />
            </div>
          </div>

          {/* Clinical Observation Note */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase">Bedside Nursing Observation</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Patient resting comfortably, regular rhythm, no respiratory distress..."
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save & Sign Vitals'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
