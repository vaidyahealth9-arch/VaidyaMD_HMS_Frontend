'use client';

import React, { useState, useMemo } from 'react';
import { CheckCircle2, Search, UserCheck, X, Stethoscope, AlertCircle } from 'lucide-react';
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
  isAdmitting?: boolean;
  onConfirmAdmit: () => void;
}

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
  isAdmitting = false,
  onConfirmAdmit,
}: AdmissionSheetProps) {
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Selected patient object
  const selectedPatient = useMemo(
    () => patients.find((p: any) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  // Filtered patients for dropdown
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 10);
    const q = patientSearch.toLowerCase();
    return patients
      .filter(
        (p: any) =>
          p.name?.toLowerCase().includes(q) ||
          p.vid?.toLowerCase().includes(q) ||
          p.mrn?.toLowerCase().includes(q) ||
          p.phone?.includes(q)
      )
      .slice(0, 15);
  }, [patients, patientSearch]);

  const handleSelectPatient = (p: any) => {
    setSelectedPatientId(p.id);
    setShowPatientDropdown(false);
    setPatientSearch('');
  };

  const handleClearPatient = () => {
    setSelectedPatientId('');
    setPatientSearch('');
  };

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
            Admit patient to vacant bed ({selectedBedForAdmission?.bed_type || 'Standard'}, Ward Base Rate: {formatCurrency(selectedBedForAdmission?.daily_rate || 2000)}/day).
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* 1. Patient Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Patient Details <span className="text-red-500">*</span></span>
              {selectedPatient && (
                <button
                  type="button"
                  onClick={handleClearPatient}
                  className="text-[11px] text-blue-600 hover:underline font-semibold"
                >
                  Change Patient
                </button>
              )}
            </label>

            {selectedPatient ? (
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    {selectedPatient.name?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{selectedPatient.name}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      VID: {selectedPatient.vid || selectedPatient.mrn || '—'} · {selectedPatient.gender || ''} {selectedPatient.age ? `(${selectedPatient.age}y)` : ''}
                    </p>
                    {selectedPatient.phone && (
                      <p className="text-[10px] text-slate-400">Phone: {selectedPatient.phone}</p>
                    )}
                  </div>
                </div>
                <UserCheck className="w-5 h-5 text-blue-600 shrink-0 mr-1" />
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by Patient Name, VID, or Phone..."
                    value={patientSearch}
                    onFocus={() => setShowPatientDropdown(true)}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowPatientDropdown(true);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                {showPatientDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                    <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-500 flex justify-between items-center">
                      <span>Matching Patients ({filteredPatients.length})</span>
                      <button
                        type="button"
                        onClick={() => setShowPatientDropdown(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((p: any) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPatient(p)}
                          className="p-2.5 hover:bg-blue-50/60 cursor-pointer transition-colors"
                        >
                          <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                            <span>VID: {p.vid || p.mrn || '—'}</span>
                            {p.phone && <span>· {p.phone}</span>}
                            {p.gender && <span>· {p.gender}</span>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No patients found matching "{patientSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Admitting Doctor */}
          {doctors.length > 0 && setSelectedDoctorId && (
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
                    {d.name?.startsWith('Dr.') ? d.name : `Dr. ${d.name}`} {d.specialization ? `(${d.specialization})` : ''}
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

          {/* 5. Bed Tariff Summary */}
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

          {/* 6. Special Nursing Instructions */}
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

        <SheetFooter className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-lg h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirmAdmit}
            disabled={isAdmitting || !selectedPatientId}
            className="bg-primary hover:bg-primary-mid text-white font-semibold h-9 rounded-lg shadow-sm gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isAdmitting ? 'Admitting...' : 'Confirm Admission'}</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

