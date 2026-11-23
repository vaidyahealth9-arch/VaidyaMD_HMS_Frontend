'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit3, Clock, Calendar } from 'lucide-react';
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

interface EditBedsideOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: IPDOrder | null;
  admissionId: string;
  onSuccess?: () => void;
}

export default function EditBedsideOrderModal({
  isOpen,
  onClose,
  order,
  admissionId,
  onSuccess,
}: EditBedsideOrderModalProps) {
  const queryClient = useQueryClient();

  const [itemName, setItemName] = useState('');
  const [dosage, setDosage] = useState('');
  const [route, setRoute] = useState('Oral');
  const [frequency, setFrequency] = useState('BD');
  const [duration, setDuration] = useState('3 days');
  const [startDate, setStartDate] = useState('');
  const [timingSlotsText, setTimingSlotsText] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (order) {
      setItemName(order.item_name || '');
      setDosage(order.dosage || '');
      setRoute(order.route || 'Oral');
      setFrequency(order.frequency || 'BD');
      setDuration(order.duration || '3 days');
      setInstructions(order.instructions || '');

      if (order.start_date) {
        const d = new Date(order.start_date);
        setStartDate(d.toISOString().slice(0, 10));
      } else {
        setStartDate(new Date().toISOString().slice(0, 10));
      }

      if (order.timing_slots && order.timing_slots.length > 0) {
        setTimingSlotsText(order.timing_slots.join(', '));
      } else {
        setTimingSlotsText('08:00, 20:00');
      }
    }
  }, [order]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => ipdApi.updateOrder(order!.id, data),
    onSuccess: () => {
      toast.success('Order Modified', 'Bedside order and schedule updated.');
      queryClient.invalidateQueries({ queryKey: ['ipd-admission-details', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['ipd-orders', admissionId] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => toast.error('Update Failed', err?.message || 'Could not modify order'),
  });

  if (!order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      toast.error('Validation Error', 'Medicine/Item name is required');
      return;
    }

    const slots = timingSlotsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateMutation.mutate({
      item_name: itemName.trim(),
      dosage: dosage.trim() || undefined,
      route: route.trim() || undefined,
      frequency: frequency.trim() || undefined,
      duration: duration.trim() || undefined,
      instructions: instructions.trim() || undefined,
      start_date: startDate ? new Date(startDate).toISOString() : undefined,
      timing_slots: slots.length > 0 ? slots : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-3 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <span className="p-1 rounded bg-emerald-50 text-emerald-700">
              <Edit3 className="w-4 h-4" />
            </span>
            <span>Modify Bedside Order / Prescription</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Adjust dosage, regimen timing slots, or administration route
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
              Medicine / Item Description <span className="text-rose-500">*</span>
            </label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Tab. Augmentin, Inj. Paracetamol"
              className="h-8 text-xs font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">Dosage</label>
              <Input
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 625mg, 1g, 5ml"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">Route</label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-md bg-white font-medium"
              >
                <option value="Oral">Oral (PO)</option>
                <option value="IV">Intravenous (IV)</option>
                <option value="IM">Intramuscular (IM)</option>
                <option value="SC">Subcutaneous (SC)</option>
                <option value="Inhalation">Inhalation / Nebulizer</option>
                <option value="Sublingual">Sublingual</option>
                <option value="Topical">Topical</option>
                <option value="PR">Rectal (PR)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => {
                  const val = e.target.value;
                  setFrequency(val);
                  if (val === 'OD') setTimingSlotsText('09:00');
                  else if (val === 'BD') setTimingSlotsText('08:00, 20:00');
                  else if (val === 'TID') setTimingSlotsText('08:00, 14:00, 20:00');
                  else if (val === 'QID') setTimingSlotsText('06:00, 12:00, 18:00, 22:00');
                  else if (val === 'HS') setTimingSlotsText('21:00');
                  else if (val === 'STAT') setTimingSlotsText('Immediate');
                  else if (val === 'SOS') setTimingSlotsText('PRN');
                }}
                className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-md bg-white font-medium"
              >
                <option value="OD">OD — Once daily</option>
                <option value="BD">BD — Twice daily (1-0-1)</option>
                <option value="TID">TID — Thrice daily (1-1-1)</option>
                <option value="QID">QID — 4 times daily</option>
                <option value="HS">HS — At bedtime</option>
                <option value="STAT">STAT — Immediately</option>
                <option value="SOS">SOS / PRN — As needed</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">Duration</label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 3 days, 5 days, Ongoing"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 uppercase text-[10px] flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>Start Date</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 uppercase text-[10px] flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Administration Times</span>
              </label>
              <Input
                value={timingSlotsText}
                onChange={(e) => setTimingSlotsText(e.target.value)}
                placeholder="e.g. 08:00, 14:00, 20:00"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
              Instructions / Special Remarks
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Give after food, monitor blood sugar before dose, slow IV infusion..."
              className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {updateMutation.isPending ? 'Updating...' : 'Save Order Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
