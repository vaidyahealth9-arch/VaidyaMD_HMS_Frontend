'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ipdApi } from '@/features/ipd/api';
import { toast } from '@/contexts/ToastContext';
import { formatCurrency } from '@/lib/utils';
import type { OTRecord } from './types';

interface OTPostBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: OTRecord | null;
  admissionId: string;
  onSuccess?: () => void;
}

export default function OTPostBillingModal({
  isOpen,
  onClose,
  record,
  admissionId,
  onSuccess,
}: OTPostBillingModalProps) {
  const queryClient = useQueryClient();

  const [roomCharge, setRoomCharge] = useState('0');
  const [procedureFee, setProcedureFee] = useState('0');
  const [surgeonFee, setSurgeonFee] = useState('0');
  const [anesthesiaFee, setAnesthesiaFee] = useState('0');
  const [guestSurgeonsFee, setGuestSurgeonsFee] = useState('0');
  const [billingNotes, setBillingNotes] = useState('');

  useEffect(() => {
    if (record) {
      setRoomCharge(String(record.ot_room_charge || 0));
      setProcedureFee(String(record.procedure_fee || 0));
      setSurgeonFee(String(record.surgeon_fee || 0));
      setAnesthesiaFee(String(record.anesthesia_fee || 0));
      const gList = (record as any).guest_surgeons || [];
      const gSum = (record as any).guest_surgeons_fee || gList.reduce((acc: number, g: any) => acc + (parseFloat(g.fee) || 0), 0);
      setGuestSurgeonsFee(String(gSum || 0));
      setBillingNotes(`OT Charges for ${record.procedure_name} (${record.total_ot_hours || 0} hrs)`);
    }
  }, [record]);

  const postBillingMutation = useMutation({
    mutationFn: (data: any) => ipdApi.postOTBilling(record!.id, data),
    onSuccess: (res: any) => {
      toast.success('OT Charges Posted', res?.message || 'Surgery line items added to rolling ledger.');
      queryClient.invalidateQueries({ queryKey: ['ipd-admission-details', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['ipd-ot-records', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['ipd-rolling-bill', admissionId] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => toast.error('Billing Error', err?.message || 'Could not post OT charges'),
  });

  if (!record) return null;

  const rCharge = parseFloat(roomCharge) || 0;
  const pFee = parseFloat(procedureFee) || 0;
  const sFee = parseFloat(surgeonFee) || 0;
  const aFee = parseFloat(anesthesiaFee) || 0;
  const gFee = parseFloat(guestSurgeonsFee) || 0;
  const grandTotal = rCharge + pFee + sFee + aFee + gFee;

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    postBillingMutation.mutate({
      ot_room_charge: rCharge,
      procedure_fee: pFee,
      surgeon_fee: sFee,
      anesthesia_fee: aFee,
      guest_surgeons_fee: gFee,
      guest_surgeons: (record as any).guest_surgeons,
      notes: billingNotes.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg flex flex-col p-0">
        <DialogHeader className="p-4 pb-3 border-b border-emerald-100 bg-emerald-50/50">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-emerald-950">
            <span className="p-1 rounded bg-emerald-100 text-emerald-700">
              <Receipt className="w-4 h-4" />
            </span>
            <span>Review &amp; Post OT Surgery Charges</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-emerald-700/80">
            Verify calculated tariffs before posting itemized charges to patient&apos;s Rolling Bill
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePost} className="p-4 space-y-3.5 text-xs">
          {/* Procedure Snapshot */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block">{record.procedure_name}</span>
              <span className="text-[11px] text-slate-500">
                {record.surgery_category} · Duration: {record.total_ot_hours || 0} Hours
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Hourly Rate</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(record.ot_hourly_rate || 1500)}/hr
              </span>
            </div>
          </div>

          {/* Itemized Fee Breakdown Inputs */}
          <div className="space-y-2.5">
            <div>
              <label className="font-bold text-slate-700 uppercase text-[10px] flex items-center justify-between mb-1">
                <span>OT Table / Room Charge (₹)</span>
                <span className="text-slate-400 font-normal">
                  {record.total_ot_hours || 0} hrs @ ₹{record.ot_hourly_rate || 1500}/hr
                </span>
              </label>
              <Input
                type="number"
                min="0"
                step="50"
                value={roomCharge}
                onChange={(e) => setRoomCharge(e.target.value)}
                className="h-8 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
                Procedure / Surgery Base Tariff (₹)
              </label>
              <Input
                type="number"
                min="0"
                step="100"
                value={procedureFee}
                onChange={(e) => setProcedureFee(e.target.value)}
                className="h-8 text-xs font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
                  Surgeon Fee (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={surgeonFee}
                  onChange={(e) => setSurgeonFee(e.target.value)}
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
                  Anesthesia Fee (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={anesthesiaFee}
                  onChange={(e) => setAnesthesiaFee(e.target.value)}
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>
            </div>

            {gFee > 0 && (
              <div>
                <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
                  Visiting / Guest Surgeon(s) Fee (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={guestSurgeonsFee}
                  onChange={(e) => setGuestSurgeonsFee(e.target.value)}
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>
            )}
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
              Billing Ledger Remarks
            </label>
            <Input
              value={billingNotes}
              onChange={(e) => setBillingNotes(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Grand Total Bar */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
            <span className="font-bold text-emerald-950 uppercase text-[10px]">Total To Post to Rolling Bill</span>
            <span className="font-mono font-black text-sm text-emerald-900">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={postBillingMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {postBillingMutation.isPending ? 'Posting...' : 'Post to Ledger'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
