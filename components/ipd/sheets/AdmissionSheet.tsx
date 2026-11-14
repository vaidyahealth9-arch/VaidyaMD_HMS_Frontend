'use client';

import React, { useMemo } from 'react';
import { CheckCircle2, Stethoscope, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/shared/ui/sheet';
import { formatCurrency } from '@/lib/utils';
import AdmissionPatientPicker from './AdmissionPatientPicker';

interface AdmissionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBed: any;
  patients: any[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  doctors?: any[];
  selectedDoctorId?: string;
  setSelectedDoctorId?: (id: string) => void;
  diagnosis: string;
  setDiagnosis: (d: string) => void;
  packageName: string;
  setPackageName: (p: string) => void;
  notes: string;
  setNotes: (n: string) => void;
  vitalsFrequency?: string;
  setVitalsFrequency?: (freq: string) => void;
  isAdmitting?: boolean;
  onConfirmAdmit: () => void;
}

const VITALS_FREQ_OPTIONS = [
  { value: 'Q1H', label: 'Q1H — Every 1 Hour (ICU / Critical)' },
  { value: 'Q2H', label: 'Q2H — Every 2 Hours (Post-Op / Step-Down)' },
  { value: 'Q4H', label: 'Q4H — Every 4 Hours (Standard Inpatient)' },
  { value: 'Q6H', label: 'Q6H — Every 6 Hours' },
  { value: 'Q8H', label: 'Q8H — Every 8 Hours (TID)' },
  { value: 'Q12H', label: 'Q12H — Twice Daily (BD)' },
  { value: 'OD', label: 'OD — Once Daily' },
  { value: 'PRN', label: 'PRN — As Needed' },
];

export default function AdmissionSheet({
  isOpen,
  onClose,
  selectedBed: selectedBedForAdmission,
  patients = [],
  selectedPatientId,
  setSelectedPatientId,
  doctors = [],
  selectedDoctorId = '',
  setSelectedDoctorId,
  diagnosis,
  setDiagnosis,
  packageName,
  setPackageName,
  notes,
  setNotes,
  vitalsFrequency = 'Q4H',
  setVitalsFrequency,
  isAdmitting = false,
  onConfirmAdmit,
}: AdmissionSheetProps) {
  const selectedPatient = useMemo(
    () => patients.find((p: any) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="sm:max-w-lg flex flex-col h-full overflow-hidden p-0">
        <SheetHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <SheetTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Inpatient Bed Admission</span>
            {selectedBedForAdmission && (
              <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-md border border-blue-200">
                Bed {selectedBedForAdmission.bed_number}
              </span>
            )}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            Admit patient to vacant bed ({selectedBedForAdmission?.bed_type || 'Standard'}, Ward Base Rate:{' '}
            {formatCurrency(selectedBedForAdmission?.daily_rate || 2000)}/day).
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* 1. Patient Picker */}
          <AdmissionPatientPicker
            patients={patients}
            selectedPatient={selectedPatient}
            onSelectPatient={(p) => setSelectedPatientId(p.id)}
            onClearPatient={() => setSelectedPatientId('')}
          />

          {/* 2. Attending Doctor Selection */}
          {setSelectedDoctorId && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Attending / Admitting Doctor
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">— Select Attending Doctor (Optional) —</option>
                {doctors.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name?.startsWith('Dr.') ? d.name : `Dr. ${d.name}`}{' '}
                    {d.specialization ? `(${d.specialization})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Admission Diagnosis */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Admission Diagnosis <span className="text-red-500">*</span>
            </label>
            <Input
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Post OPU Ovarian Hyperstimulation (OHSS) Monitoring"
              className="h-9 text-xs"
            />
          </div>

          {/* 4. Treatment / Care Package */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Treatment / Care Package
            </label>
            <Input
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g. Laparoscopy Post-OP Care Package"
              className="h-9 text-xs"
            />
          </div>

          {/* 5. Vitals Monitoring Schedule */}
          {setVitalsFrequency && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>Initial Vitals Monitoring Frequency</span>
              </label>
              <select
                value={vitalsFrequency}
                onChange={(e) => setVitalsFrequency(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
              >
                {VITALS_FREQ_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Generates recurring nursing station tasks based on this frequency upon admission.
              </p>
            </div>
          )}

          {/* 6. Bed Tariff Summary */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Selected Bed:</span>
              <span className="font-bold text-slate-900">
                {selectedBedForAdmission?.bed_number} ({selectedBedForAdmission?.bed_type || 'Standard'})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Daily Bed Rate:</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(selectedBedForAdmission?.daily_rate || 2000)} / day
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="font-semibold text-slate-700">Initial Accrued Charge:</span>
              <span className="font-bold text-emerald-700">
                {formatCurrency(selectedBedForAdmission?.daily_rate || 2000)}
              </span>
            </div>
          </div>

          {/* 7. Special Nursing Instructions */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Special Nursing Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Strict fluid balance chart, bed rest for 24h, notify if BP < 100/60."
              className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-400"
            />
          </div>
        </div>

        <SheetFooter className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between sm:justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isAdmitting} className="text-xs">
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={onConfirmAdmit}
            disabled={!selectedPatientId || !diagnosis.trim() || isAdmitting}
            className="text-xs font-bold gap-1.5 bg-[#2878a8] hover:bg-[#20638c] text-white shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAdmitting ? 'Admitting...' : 'Confirm Bed Admission'}</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
