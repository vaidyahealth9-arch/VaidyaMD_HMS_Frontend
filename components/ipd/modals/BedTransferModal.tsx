'use client';

import React, { useState, useMemo } from 'react';
import { ArrowRight, BedDouble, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { ipdApi } from '@/features/ipd/api';
import { toast } from '@/contexts/ToastContext';
import { formatCurrency } from '@/lib/utils';
import type { Ward, Bed } from '@/features/ipd/types';

interface BedTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  admissionId?: string;
  patientName?: string;
  currentBedNumber?: string;
  currentWardName?: string;
  wards: Ward[];
  beds: Bed[];
  onSuccess: () => void;
}

export default function BedTransferModal({
  isOpen,
  onClose,
  admissionId,
  patientName,
  currentBedNumber,
  currentWardName,
  wards,
  beds,
  onSuccess,
}: BedTransferModalProps) {
  const [selectedWardId, setSelectedWardId] = useState<string>('all');
  const [targetBedId, setTargetBedId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter vacant beds
  const vacantBeds = useMemo(() => {
    return beds.filter((b) => {
      const isVacant = b.status === 'Vacant' || b.status?.toLowerCase() === 'available';
      if (!isVacant) return false;
      if (selectedWardId !== 'all' && b.ward_id !== selectedWardId) return false;
      return true;
    });
  }, [beds, selectedWardId]);

  const selectedBedObj = useMemo(() => {
    return beds.find((b) => b.id === targetBedId);
  }, [beds, targetBedId]);

  const handleTransfer = async () => {
    if (!admissionId || !targetBedId) {
      toast.error('Selection Missing', 'Please select a destination bed.');
      return;
    }

    setIsSubmitting(true);
    try {
      await ipdApi.transferBed(admissionId, targetBedId, notes);
      toast.success(
        'Bed Transferred',
        `Transferred ${patientName || 'Patient'} to Bed ${selectedBedObj?.bed_number || 'new bed'}. Previous bed marked for cleaning.`
      );
      onSuccess();
      onClose();
      setTargetBedId('');
      setNotes('');
    } catch (err: any) {
      toast.error('Transfer Failed', err?.message || 'Could not complete bed transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <BedDouble className="w-5 h-5 text-indigo-600" />
            <span>Transfer Inpatient Bed</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Relocate patient to a different ward or room category. The current bed will automatically transition to Cleaning status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Current Location Badge */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Bed</span>
              <p className="font-bold text-slate-900 text-sm">{currentBedNumber || '—'}</p>
              <p className="text-[11px] text-slate-500">{currentWardName || 'Ward'}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Target Bed</span>
              <p className="font-bold text-indigo-700 text-sm">{selectedBedObj ? selectedBedObj.bed_number : 'Select...'}</p>
              <p className="text-[11px] text-slate-500">
                {selectedBedObj ? formatCurrency(selectedBedObj.daily_rate || 2000) + '/day' : 'Vacant Beds Only'}
              </p>
            </div>
          </div>

          {/* Ward Filter */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Filter Destination Ward</label>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedWardId('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  selectedWardId === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Wards
              </button>
              {wards.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWardId(w.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    selectedWardId === w.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {w.name}
                </button>
              ))}
            </div>
          </div>

          {/* Target Bed Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Select Vacant Bed <span className="text-red-500">*</span>
            </label>
            {vacantBeds.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1 border border-slate-200 rounded-lg">
                {vacantBeds.map((bed) => {
                  const isSelected = bed.id === targetBedId;
                  return (
                    <button
                      key={bed.id}
                      type="button"
                      onClick={() => setTargetBedId(bed.id)}
                      className={`p-2 rounded-md border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{bed.bed_number}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate">{bed.bed_type || 'Standard'}</span>
                      <span className="text-[10px] font-medium text-emerald-600 block">
                        ₹{bed.daily_rate || 2000}/d
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-center text-xs">
                No vacant beds available in the selected ward.
              </div>
            )}
          </div>

          {/* Transfer Reason / Clinical Note */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Clinical / Administrative Transfer Reason</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Upgraded to ICU for respiratory monitoring, or patient requested deluxe suite..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleTransfer}
            disabled={!targetBedId || isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5"
          >
            {isSubmitting ? 'Transferring...' : 'Confirm Bed Transfer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
