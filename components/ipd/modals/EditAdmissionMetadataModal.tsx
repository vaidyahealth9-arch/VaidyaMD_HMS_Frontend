'use client';

import React, { useState, useEffect } from 'react';
import { Stethoscope, FileText, IndianRupee, Loader2 } from 'lucide-react';
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
import { ipdApi } from '@/features/ipd/api';
import { toast } from '@/contexts/ToastContext';

interface EditAdmissionMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  admissionId: string;
  currentDoctorId?: string;
  currentDiagnosis?: string;
  currentCreditLimit?: number;
  doctors: Array<{
    id: string;
    name: string;
    specialization?: string;
    qualification?: string;
  }>;
  onSuccess: () => void;
}

// Clean helper to strip redundant 'Dr.' or ensure correct prefix
export const formatDoctorName = (rawName?: string): string => {
  if (!rawName || rawName === 'Attending Physician' || rawName === 'Not Assigned') {
    return rawName || 'Attending Physician';
  }
  const clean = rawName.replace(/^(dr\.?|dr\b)\s+/i, '').trim();
  return `Dr. ${clean}`;
};

export default function EditAdmissionMetadataModal({
  isOpen,
  onClose,
  admissionId,
  currentDoctorId = '',
  currentDiagnosis = '',
  currentCreditLimit = 20000,
  doctors = [],
  onSuccess,
}: EditAdmissionMetadataModalProps) {
  const [doctorId, setDoctorId] = useState(currentDoctorId);
  const [diagnosis, setDiagnosis] = useState(currentDiagnosis);
  const [creditLimit, setCreditLimit] = useState(currentCreditLimit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDoctorId(currentDoctorId || '');
      setDiagnosis(currentDiagnosis || '');
      setCreditLimit(currentCreditLimit || 20000);
    }
  }, [isOpen, currentDoctorId, currentDiagnosis, currentCreditLimit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionId) return;

    try {
      setIsSubmitting(true);
      await ipdApi.updateAdmission(admissionId, {
        admitting_doctor_id: doctorId || undefined,
        diagnosis: diagnosis.trim() || undefined,
        credit_limit: Number(creditLimit) || undefined,
      });

      toast.success('Clinical Details Updated', 'Attending physician and clinical diagnosis updated successfully.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Update Failed', err?.message || 'Could not update admission details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-white">
        <DialogHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2 text-indigo-700">
            <Stethoscope className="w-5 h-5 text-indigo-600" />
            <DialogTitle className="text-base font-bold text-slate-900">
              Update Attending Care & Diagnosis
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Reassign the primary treating consultant or revise the admission diagnosis & credit limit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 1. Attending Doctor Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
              Attending Consultant Physician
            </label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">— Select Attending Physician —</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {formatDoctorName(doc.name)} {doc.specialization ? `· ${doc.specialization}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Primary Clinical Diagnosis */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Primary Clinical Diagnosis / Admission Reason
            </label>
            <Input
              type="text"
              placeholder="e.g. Post-OPU Ovarian Hyperstimulation (OHSS) Grade 2"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* 3. Financial Credit Limit */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-slate-500" />
              Inpatient Credit Limit (₹)
            </label>
            <Input
              type="number"
              min={0}
              step={1000}
              placeholder="20000"
              value={creditLimit}
              onChange={(e) => setCreditLimit(Number(e.target.value))}
              className="h-9 text-xs"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Triggers credit threshold alert if accrued unbilled charges exceed this limit.
            </span>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
