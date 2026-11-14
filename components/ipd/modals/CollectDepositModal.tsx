'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  IndianRupee,
  CheckCircle2,
  Receipt,
  Smartphone,
  Banknote,
  Building,
} from 'lucide-react';
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
import type { IPDPayment } from '@/features/ipd/types';
import PrintablePaymentVoucherModal from '@/components/common/PrintablePaymentVoucherModal';
import DepositSuccessView from './DepositSuccessView';

interface CollectDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  admissionId: string;
  patientName: string;
  bedNumber: string;
  currentAdvance: number;
  netDue: number;
  onSuccess?: () => void;
  patientMrn?: string;
  admissionNumber?: string;
  wardName?: string;
  admittingDoctor?: string;
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'upi', label: 'UPI / QR', icon: Smartphone },
  { id: 'card', label: 'Card (POS)', icon: CreditCard },
  { id: 'bank_transfer', label: 'Bank / NEFT', icon: Building },
  { id: 'cheque', label: 'Cheque', icon: Receipt },
];

export default function CollectDepositModal({
  isOpen,
  onClose,
  admissionId,
  patientName,
  bedNumber,
  currentAdvance,
  netDue,
  onSuccess,
  patientMrn,
  admissionNumber,
  wardName,
  admittingDoctor,
}: CollectDepositModalProps) {
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentType] = useState<string>('advance');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [completedPayment, setCompletedPayment] = useState<IPDPayment | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const depositMutation = useMutation({
    mutationFn: (payload: any) => ipdApi.postPayment(admissionId, payload),
    onSuccess: (data: IPDPayment) => {
      toast.success('Deposit Collected', `Received ${formatCurrency(data.amount)} under receipt #${data.receipt_number}`);
      setCompletedPayment(data);
      queryClient.invalidateQueries({ queryKey: ['ipd-rolling-bill', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['ipd-admission-details', admissionId] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      toast.error('Failed to collect deposit', err?.message || 'Transaction could not be recorded');
    },
  });

  const handleClose = () => {
    setAmount('');
    setTransactionRef('');
    setNotes('');
    setCompletedPayment(null);
    setIsPrintModalOpen(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast.error('Validation Error', 'Please enter a valid deposit amount');
      return;
    }

    depositMutation.mutate({
      amount: val,
      payment_method: paymentMethod,
      transaction_reference: transactionRef.trim() || undefined,
      payment_type: paymentType,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-5 pb-3 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <span className="p-1 rounded bg-emerald-50 text-emerald-700">
                <CreditCard className="w-4 h-4" />
              </span>
              <span>{completedPayment ? 'Advance Payment Voucher' : 'Collect Inpatient Deposit'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Patient: <span className="font-semibold text-slate-800">{patientName}</span> ({bedNumber})
            </DialogDescription>
          </DialogHeader>

          {completedPayment ? (
            <DepositSuccessView
              payment={completedPayment}
              onOpenPrint={() => setIsPrintModalOpen(true)}
              onClose={handleClose}
            />
          ) : (
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Account Status Chips */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Advance on Record</span>
                  <p className="font-mono font-bold text-emerald-700 text-sm mt-0.5">{formatCurrency(currentAdvance)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Live Balance Due</span>
                  <p className="font-mono font-bold text-rose-700 text-sm mt-0.5">{formatCurrency(netDue)}</p>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Deposit Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="e.g. 10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="pl-9 h-10 text-sm font-bold font-mono"
                    autoFocus
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {PAYMENT_METHODS.map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reference Number */}
              {paymentMethod !== 'cash' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Transaction / UTR / Reference Number
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. UPI Ref / Card Txn ID"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Remarks / Payment Note
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Advance collected at admission counter"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={depositMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{depositMutation.isPending ? 'Processing...' : 'Collect Deposit & Issue Voucher'}</span>
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Unified Printable Voucher Modal */}
      {completedPayment && isPrintModalOpen && (
        <PrintablePaymentVoucherModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          voucher={completedPayment}
          patient={{
            name: patientName,
            vid: patientMrn,
            mrn: patientMrn,
          }}
          admission={{
            admission_number: admissionNumber,
            ward_name: wardName,
            bed_number: bedNumber,
            admitting_doctor: admittingDoctor,
          }}
          financialContext={{
            current_advance: currentAdvance + (completedPayment.amount || 0),
            net_due: Math.max(0, netDue - (completedPayment.amount || 0)),
          }}
        />
      )}
    </>
  );
}
