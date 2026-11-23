'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Scissors } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ipdApi } from '@/features/ipd/api';
import { authApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import OTTimelineSection from './OTTimelineSection';
import OTStaffFormSection from './OTStaffFormSection';
import OTGuestSurgeonsSection, { type GuestSurgeonItem } from './OTGuestSurgeonsSection';
import OTClinicalNotesSection from './OTClinicalNotesSection';
import OTPricingSection from './OTPricingSection';
import type { OTRecord } from './types';

interface NewOTRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  admissionId: string;
  initialRecord?: OTRecord | null;
  onSuccess?: () => void;
}

export default function NewOTRecordModal({
  isOpen,
  onClose,
  admissionId,
  initialRecord,
  onSuccess,
}: NewOTRecordModalProps) {
  const queryClient = useQueryClient();

  const { data: doctors = [] } = useQuery({
    queryKey: ['staff-doctors'],
    queryFn: () => authApi.getDoctors(),
    enabled: isOpen,
  });

  const { data: staffUsers = [] } = useQuery({
    queryKey: ['staff-users'],
    queryFn: () => authApi.listUsers({ per_page: 100 }),
    enabled: isOpen,
  });

  const nurses = staffUsers.filter(
    (u: any) => (u.role || '').toLowerCase().includes('nurse') || (u.designation || '').toLowerCase().includes('nurse')
  );

  const [procedureName, setProcedureName] = useState('');
  const [surgeryCategory, setSurgeryCategory] = useState('Major');
  const [otStatus, setOtStatus] = useState('Scheduled');
  const [wheelInTime, setWheelInTime] = useState('');
  const [wheelOutTime, setWheelOutTime] = useState('');
  const [totalHours, setTotalHours] = useState('0');

  const [primarySurgeonId, setPrimarySurgeonId] = useState('');
  const [assistantSurgeonId, setAssistantSurgeonId] = useState('');
  const [assistantSurgeonName, setAssistantSurgeonName] = useState('');
  const [anesthetistId, setAnesthetistId] = useState('');
  const [anesthetistName, setAnesthetistName] = useState('');
  const [scrubNurseId, setScrubNurseId] = useState('');
  const [circulatingNurseId, setCirculatingNurseId] = useState('');
  const [guestSurgeons, setGuestSurgeons] = useState<GuestSurgeonItem[]>([]);

  const [anesthesiaType, setAnesthesiaType] = useState('General Anesthesia (GA)');
  const [preOpDiagnosis, setPreOpDiagnosis] = useState('');
  const [postOpDiagnosis, setPostOpDiagnosis] = useState('');
  const [operativeNotes, setOperativeNotes] = useState('');
  const [postOpOrders, setPostOpOrders] = useState('');

  const [hourlyRate, setHourlyRate] = useState('1500');
  const [procedureFee, setProcedureFee] = useState('0');
  const [surgeonFee, setSurgeonFee] = useState('0');
  const [anesthesiaFee, setAnesthesiaFee] = useState('0');

  useEffect(() => {
    if (initialRecord) {
      const rec = initialRecord as any;
      setProcedureName(rec.procedure_name || '');
      setSurgeryCategory(rec.surgery_category || 'Major');
      setOtStatus(rec.status || 'Scheduled');
      setWheelInTime(rec.wheel_in_time ? rec.wheel_in_time.slice(0, 16) : '');
      setWheelOutTime(rec.wheel_out_time ? rec.wheel_out_time.slice(0, 16) : '');
      setTotalHours(String(rec.total_ot_hours || 0));
      setPrimarySurgeonId(rec.primary_surgeon?.id || '');
      setAssistantSurgeonId(rec.assistant_surgeon?.id || '');
      setAssistantSurgeonName(rec.assistant_surgeon_name || '');
      setAnesthetistId(rec.anesthetist?.id || '');
      setAnesthetistName(rec.anesthetist_name || '');
      setScrubNurseId(rec.scrub_nurse?.id || '');
      setCirculatingNurseId(rec.circulating_nurse?.id || '');
      setGuestSurgeons(rec.guest_surgeons || []);
      setAnesthesiaType(rec.anesthesia_type || 'General Anesthesia (GA)');
      setPreOpDiagnosis(rec.pre_op_diagnosis || '');
      setPostOpDiagnosis(rec.post_op_diagnosis || '');
      setOperativeNotes(rec.operative_notes || '');
      setPostOpOrders(rec.post_op_orders || '');
      setHourlyRate(String(rec.ot_hourly_rate || 1500));
      setProcedureFee(String(rec.procedure_fee || 0));
      setSurgeonFee(String(rec.surgeon_fee || 0));
      setAnesthesiaFee(String(rec.anesthesia_fee || 0));
    } else {
      setProcedureName('');
      setSurgeryCategory('Major');
      setOtStatus('Scheduled');
      setWheelInTime(''); setWheelOutTime(''); setTotalHours('0');
      setAssistantSurgeonName(''); setAnesthetistName(''); setGuestSurgeons([]);
      setOperativeNotes(''); setPostOpOrders(''); setPreOpDiagnosis(''); setPostOpDiagnosis('');
    }
  }, [initialRecord, isOpen]);

  const handleWheelTimeChange = (inTime: string, outTime: string) => {
    setWheelInTime(inTime);
    setWheelOutTime(outTime);
    if (inTime && outTime) {
      const dIn = new Date(inTime).getTime();
      const dOut = new Date(outTime).getTime();
      if (dOut > dIn) setTotalHours(((dOut - dIn) / (1000 * 60 * 60)).toFixed(2));
    }
  };

  const guestSurgeonsFee = guestSurgeons.reduce((acc, g) => acc + (parseFloat(String(g.fee)) || 0), 0);

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      initialRecord ? ipdApi.updateOTRecord(initialRecord.id, data) : ipdApi.createOTRecord(admissionId, data),
    onSuccess: (res: any) => {
      toast.success(initialRecord ? 'OT Record Saved' : 'OT Surgery Scheduled', res?.message || 'Record saved.');
      queryClient.invalidateQueries({ queryKey: ['ipd-admission-details', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['ipd-ot-records', admissionId] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => toast.error('Error', err?.message || 'Failed to save OT record'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procedureName.trim()) {
      toast.error('Validation Error', 'Procedure / Surgery name is required');
      return;
    }

    saveMutation.mutate({
      procedure_name: procedureName.trim(),
      surgery_category: surgeryCategory,
      status: otStatus,
      wheel_in_time: wheelInTime ? new Date(wheelInTime).toISOString() : undefined,
      wheel_out_time: wheelOutTime ? new Date(wheelOutTime).toISOString() : undefined,
      total_ot_hours: parseFloat(totalHours) || 0,
      primary_surgeon_id: primarySurgeonId || undefined,
      assistant_surgeon_id: assistantSurgeonId || undefined,
      assistant_surgeon_name: assistantSurgeonName.trim() || undefined,
      anesthetist_id: anesthetistId || undefined,
      anesthetist_name: anesthetistName.trim() || undefined,
      scrub_nurse_id: scrubNurseId || undefined,
      circulating_nurse_id: circulatingNurseId || undefined,
      guest_surgeons: guestSurgeons,
      guest_surgeons_fee: guestSurgeonsFee,
      anesthesia_type: anesthesiaType,
      pre_op_diagnosis: preOpDiagnosis.trim() || undefined,
      post_op_diagnosis: postOpDiagnosis.trim() || undefined,
      operative_notes: operativeNotes.trim() || undefined,
      post_op_orders: postOpOrders.trim() || undefined,
      ot_hourly_rate: parseFloat(hourlyRate) || 1500,
      procedure_fee: parseFloat(procedureFee) || 0,
      surgeon_fee: parseFloat(surgeonFee) || 0,
      anesthesia_fee: parseFloat(anesthesiaFee) || 0,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-3 border-b border-indigo-100 bg-indigo-50/40">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <span className="p-1 rounded bg-indigo-100 text-indigo-700">
              <Scissors className="w-4 h-4" />
            </span>
            <span>{initialRecord ? 'Edit Operation Theatre Record' : 'Schedule / Document OT Surgery'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Track surgical team, guest doctors, wheel in/out hours, operative notes, and fee tariffs
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Surgery Name & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
                Procedure / Surgery Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
                placeholder="e.g. Laparoscopic Ovarian Cystectomy..."
                className="h-8 text-xs font-semibold"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">Surgery Grade</label>
              <select
                value={surgeryCategory}
                onChange={(e) => setSurgeryCategory(e.target.value)}
                className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-md bg-white font-medium"
              >
                <option value="Major">Major Surgery</option>
                <option value="Minor">Minor Surgery</option>
                <option value="Intermediate">Intermediate Procedure</option>
                <option value="Daycare">Daycare / Ambulatory</option>
              </select>
            </div>
          </div>

          <OTTimelineSection
            otStatus={otStatus}
            setOtStatus={setOtStatus}
            wheelInTime={wheelInTime}
            wheelOutTime={wheelOutTime}
            totalHours={totalHours}
            setTotalHours={setTotalHours}
            onWheelTimeChange={handleWheelTimeChange}
          />

          <OTStaffFormSection
            doctors={doctors}
            nurses={nurses}
            primarySurgeonId={primarySurgeonId}
            setPrimarySurgeonId={setPrimarySurgeonId}
            assistantSurgeonId={assistantSurgeonId}
            setAssistantSurgeonId={setAssistantSurgeonId}
            assistantSurgeonName={assistantSurgeonName}
            setAssistantSurgeonName={setAssistantSurgeonName}
            anesthetistId={anesthetistId}
            setAnesthetistId={setAnesthetistId}
            anesthetistName={anesthetistName}
            setAnesthetistName={setAnesthetistName}
            scrubNurseId={scrubNurseId}
            setScrubNurseId={setScrubNurseId}
            circulatingNurseId={circulatingNurseId}
            setCirculatingNurseId={setCirculatingNurseId}
            anesthesiaType={anesthesiaType}
            setAnesthesiaType={setAnesthesiaType}
          />

          <OTGuestSurgeonsSection
            guestSurgeons={guestSurgeons}
            setGuestSurgeons={setGuestSurgeons}
          />

          <OTClinicalNotesSection
            preOpDiagnosis={preOpDiagnosis}
            setPreOpDiagnosis={setPreOpDiagnosis}
            postOpDiagnosis={postOpDiagnosis}
            setPostOpDiagnosis={setPostOpDiagnosis}
            operativeNotes={operativeNotes}
            setOperativeNotes={setOperativeNotes}
            postOpOrders={postOpOrders}
            setPostOpOrders={setPostOpOrders}
          />

          <OTPricingSection
            hourlyRate={hourlyRate}
            setHourlyRate={setHourlyRate}
            procedureFee={procedureFee}
            setProcedureFee={setProcedureFee}
            surgeonFee={surgeonFee}
            setSurgeonFee={setSurgeonFee}
            anesthesiaFee={anesthesiaFee}
            setAnesthesiaFee={setAnesthesiaFee}
            guestSurgeonsFee={guestSurgeonsFee}
            totalHours={totalHours}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saveMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {saveMutation.isPending ? 'Saving...' : initialRecord ? 'Save Changes' : 'Schedule OT Record'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
