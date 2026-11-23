'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban, AlertTriangle } from 'lucide-react';
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
import type { IPDOrder } from '@/features/ipd/types';

interface StopBedsideOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: IPDOrder | null;
  admissionId: string;
  onSuccess?: () => void;
}

export default function StopBedsideOrderModal({
  isOpen,
  onClose,
  order,
  admissionId,
  onSuccess,
}: StopBedsideOrderModalProps) {
  const queryClient = useQueryClient();

  const [reasonCategory, setReasonCategory] = useState('Prescription changed / Completed');
  const [customReason, setCustomReason] = useState('');

  const stopMutation = useMutation({
    mutationFn: (data: any) => ipdApi.stopOrder(order!.id, data),
    onSuccess: () => {
      toast.success('Medication Stopped', `Order for "${order?.item_name}" has been discontinued.`);
      queryClient.invalidateQueries({ queryKey: ['ipd-admission-details', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['ipd-orders', admissionId] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => toast.error('Error', err?.message || 'Could not stop order'),
  });

  if (!order) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customReason.trim()
      ? `${reasonCategory}: ${customReason.trim()}`
      : reasonCategory;

    stopMutation.mutate({
      stop_reason: finalReason,
      stopped_at: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md flex flex-col p-0">
        <DialogHeader className="p-4 pb-3 border-b border-rose-100 bg-rose-50/50">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-rose-900">
            <span className="p-1 rounded bg-rose-100 text-rose-700">
              <Ban className="w-4 h-4" />
            </span>
            <span>Stop / Discontinue Medication</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-rose-700/80">
            Discontinue active regimen from the nurse&apos;s administration chart
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="p-4 space-y-3.5 text-xs">
          {/* Order Snapshot Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Medication Details</span>
            <div className="font-bold text-slate-900 text-sm">
              {order.item_name} {order.dosage || ''}
            </div>
            <div className="text-slate-600">
              Route: <span className="font-semibold text-slate-800">{order.route || 'Oral'}</span> · Regimen:{' '}
              <span className="font-semibold text-slate-800">{order.frequency || 'OD'}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase text-[10px] block">
              Discontinuation Reason <span className="text-rose-500">*</span>
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-md bg-white font-medium"
            >
              <option value="Course Completed">Course completed as scheduled</option>
              <option value="Doctor Altered Regimen">Attending doctor altered regimen / dose</option>
              <option value="Adverse Reaction / Allergy">Adverse drug reaction or allergy observed</option>
              <option value="Patient Intolerant / Refused">Patient intolerant / refused dose</option>
              <option value="Stepped Down to Oral">Stepped down from IV to oral therapy</option>
              <option value="Patient Discharged">Patient scheduled for discharge</option>
              <option value="Other Clinical Reason">Other clinical reason</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase text-[10px] block">
              Additional Notes (Optional)
            </label>
            <Input
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Switched to Tab. Cefixime 200mg BD..."
              className="h-8 text-xs"
            />
          </div>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2 text-amber-900 text-[11px]">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              This will immediately mark the medication as <strong>Discontinued</strong> in the bedside eMAR and stop scheduled nursing reminders.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={stopMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {stopMutation.isPending ? 'Stopping...' : 'Confirm Discontinue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
