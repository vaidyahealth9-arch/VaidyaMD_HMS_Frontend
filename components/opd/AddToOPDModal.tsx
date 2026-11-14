'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentsApi, authApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import { X, Stethoscope, Clock, IndianRupee, Users, User } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface AddToOPDModalProps {
  open: boolean;
  onClose: () => void;
  patient: {
    id: string;
    name: string;
    vid?: string;
    mrn?: string;
    gender?: string;
    age?: number | string;
    treating_doctor_id?: string;
    partner_id?: string;
    partner_name?: string;
    partner?: any;
  } | null;
  partner?: any;
  onSuccess?: () => void;
}

export default function AddToOPDModal({ open, onClose, patient, partner, onSuccess }: AddToOPDModalProps) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [consultationFee, setConsultationFee] = useState(0);
  const [visitType, setVisitType] = useState('consultation');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitMode, setVisitMode] = useState<'couple' | 'solo'>('couple');

  const effectivePartner = partner || patient?.partner;
  const hasPartner = Boolean(effectivePartner?.name || patient?.partner_name);
  const partnerName = effectivePartner?.name || patient?.partner_name || 'Partner';

  useEffect(() => {
    if (open) {
      authApi.getDoctors().then((docList) => {
        if (Array.isArray(docList) && docList.length > 0) {
          setDoctors(docList);
          if (patient?.treating_doctor_id && docList.some((d) => d.id === patient.treating_doctor_id)) {
            setSelectedDoctorId(patient.treating_doctor_id);
          } else if (user?.is_doctor || user?.role === 'doctor') {
            setSelectedDoctorId(user.id);
          } else {
            setSelectedDoctorId('');
          }
        }
      }).catch(() => {});
      setConsultationFee(0);
      setVisitType('consultation');
      setNotes('');
      setVisitMode('couple');
    }
  }, [open, patient, user]);

  if (!open || !patient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      toast.error('Doctor Required', 'Please select a treating consultant.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedDoc = doctors.find((d) => d.id === selectedDoctorId);
      const fee = Number(consultationFee) || 0;
      const isCouple = hasPartner && visitMode === 'couple';

      const metadata: Record<string, any> = {};
      if (isCouple) {
        metadata.is_couple_visit = true;
        metadata.partner_id = effectivePartner?.id || patient.partner_id;
        metadata.partner_name = partnerName;
        metadata.partner_vid = effectivePartner?.vid;
      }

      await appointmentsApi.create({
        patient_id: patient.id,
        doctor_id: selectedDoctorId,
        department: 'OPD',
        scheduled_at: new Date().toISOString(),
        visit_type: visitType,
        status: 'waiting',
        consultation_fee: fee,
        notes: notes.trim() || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });

      toast.success(
        isCouple ? 'Couple Queued for OPD' : 'Added to OPD Queue',
        isCouple
          ? `${patient.name} & ${partnerName} queued for ${selectedDoc?.name || 'Doctor'} (Couple Fee: ₹${fee})`
          : `${patient.name} queued for ${selectedDoc?.name || 'Doctor'} (Fee: ₹${fee})`
      );
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error('Failed to Add to Queue', err.message || 'Could not queue patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[rgb(var(--clr-primary)/0.1)] text-[rgb(var(--clr-primary))] flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Add to OPD Queue</h3>
              <p className="text-[11px] text-slate-500 font-medium">Select consultant and visit mode</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                {patient.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-800">{patient.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">{patient.vid || patient.mrn || 'No ID'}</p>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <span>{patient.gender ? `${patient.gender} · ` : ''}</span>
              <span>{patient.age ? `${patient.age} yrs` : ''}</span>
            </div>
          </div>

          {hasPartner && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Visit Mode
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[170px]">
                  Partner: <strong>{partnerName}</strong>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisitMode('couple')}
                  className={`py-1.5 px-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    visitMode === 'couple' ? 'bg-primary text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-3 h-3" /> Joint Couple
                </button>
                <button
                  type="button"
                  onClick={() => setVisitMode('solo')}
                  className={`py-1.5 px-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    visitMode === 'solo' ? 'bg-primary text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-3 h-3" /> Solo Visit
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                {visitMode === 'couple'
                  ? 'Both partners queued under 1 token. Single consultation fee is charged.'
                  : `Only ${patient.name} is queued for this specific visit.`}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-[rgb(var(--clr-primary))]" /> Select Treating Consultant *
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-slate-300 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
              required
            >
              <option value="">Select Consultant...</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.name} {doc.specialization ? `(${doc.specialization})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              {hasPartner && visitMode === 'couple' ? 'Couple Consultation Fee (₹)' : 'Consultation Fee (₹)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min="0"
                step="50"
                value={consultationFee}
                onChange={(e) => setConsultationFee(Number(e.target.value))}
                placeholder="500"
                className="w-full h-9 pl-7 pr-3 rounded-md border border-slate-300 bg-white text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
              />
            </div>
            <p className="text-[10px] text-slate-400">Set to 0 if complimentary review or follow-up.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> Visit Type
            </label>
            <select
              value={visitType}
              onChange={(e) => setVisitType(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-slate-300 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
            >
              <option value="consultation">First / Routine Consultation</option>
              <option value="follow_up">Follow-up / Review</option>
              <option value="tvs_scan">Follicular / TVS Ultrasound Scan</option>
              <option value="emergency">Emergency / Priority</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Chief Complaint / Initial Note</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Day 2 baseline review, report review, couple fertility..."
              className="w-full h-9 px-3 rounded-md border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 px-4 text-xs font-semibold">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedDoctorId}
              className="h-9 px-5 text-xs font-bold bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white gap-1.5 shadow-sm"
            >
              {isSubmitting ? 'Adding to Queue...' : hasPartner && visitMode === 'couple' ? 'Check In Couple' : 'Confirm & Check In'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
