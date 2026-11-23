'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ipdApi } from '@/features/ipd/api';
import { authApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import type { OTRecord } from './types';
import type { GuestSurgeonItem } from './OTGuestSurgeonsSection';

interface UseOTRecordFormProps {
  admissionId: string;
  initialRecord?: OTRecord | null;
  onSuccess?: () => void;
}

export function useOTRecordForm({ admissionId, initialRecord, onSuccess }: UseOTRecordFormProps) {
  const queryClient = useQueryClient();

  const { data: doctors = [] } = useQuery({
    queryKey: ['staff-doctors'],
    queryFn: () => authApi.getDoctors(),
  });

  const { data: staffUsers = [] } = useQuery({
    queryKey: ['staff-users'],
    queryFn: () => authApi.listUsers({ per_page: 100 }),
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
      setWheelInTime('');
      setWheelOutTime('');
      setTotalHours('0');
      setAssistantSurgeonName('');
      setAnesthetistName('');
      setGuestSurgeons([]);
      setOperativeNotes('');
      setPostOpOrders('');
      setPreOpDiagnosis('');
      setPostOpDiagnosis('');
    }
  }, [initialRecord]);

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
    },
    onError: (err: any) => toast.error('Error', err?.message || 'Failed to save OT record'),
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  return {
    doctors,
    nurses,
    procedureName,
    setProcedureName,
    surgeryCategory,
    setSurgeryCategory,
    otStatus,
    setOtStatus,
    wheelInTime,
    wheelOutTime,
    totalHours,
    setTotalHours,
    handleWheelTimeChange,
    primarySurgeonId,
    setPrimarySurgeonId,
    assistantSurgeonId,
    setAssistantSurgeonId,
    assistantSurgeonName,
    setAssistantSurgeonName,
    anesthetistId,
    setAnesthetistId,
    anesthetistName,
    setAnesthetistName,
    scrubNurseId,
    setScrubNurseId,
    circulatingNurseId,
    setCirculatingNurseId,
    guestSurgeons,
    setGuestSurgeons,
    guestSurgeonsFee,
    anesthesiaType,
    setAnesthesiaType,
    preOpDiagnosis,
    setPreOpDiagnosis,
    postOpDiagnosis,
    setPostOpDiagnosis,
    operativeNotes,
    setOperativeNotes,
    postOpOrders,
    setPostOpOrders,
    hourlyRate,
    setHourlyRate,
    procedureFee,
    setProcedureFee,
    surgeonFee,
    setSurgeonFee,
    anesthesiaFee,
    setAnesthesiaFee,
    saveMutation,
    handleSubmit,
  };
}
