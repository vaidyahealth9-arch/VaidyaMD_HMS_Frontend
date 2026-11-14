'use client';

import React from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { IPDPayment } from '@/features/ipd/types';

interface DepositSuccessViewProps {
  payment: IPDPayment;
  onOpenPrint: () => void;
  onClose: () => void;
}

export default function DepositSuccessView({
  payment,
  onOpenPrint,
  onClose,
}: DepositSuccessViewProps) {
  return (
    <div className="p-5 space-y-4">
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-1">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
        <h3 className="text-sm font-bold text-emerald-950">Deposit Received Successfully</h3>
        <p className="text-xs text-emerald-700 font-mono">Receipt Voucher #{payment.receipt_number}</p>
      </div>

      <div className="border border-slate-200 rounded-lg p-4 space-y-2.5 text-xs bg-slate-50/50">
        <div className="flex justify-between py-1 border-b border-slate-200">
          <span className="text-slate-500">Receipt Number</span>
          <span className="font-mono font-bold text-slate-900">{payment.receipt_number}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-200">
          <span className="text-slate-500">Amount Received</span>
          <span className="font-mono font-bold text-emerald-700 text-sm">
            {formatCurrency(payment.amount)}
          </span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-200">
          <span className="text-slate-500">Payment Mode</span>
          <span className="font-bold uppercase text-slate-800">{payment.payment_method}</span>
        </div>
        {payment.transaction_reference && (
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Txn / Ref No.</span>
            <span className="font-mono text-slate-700">{payment.transaction_reference}</span>
          </div>
        )}
        <div className="flex justify-between py-1 border-b border-slate-200">
          <span className="text-slate-500">Received By</span>
          <span className="font-medium text-slate-800">{payment.collected_by_name || 'Cashier'}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-slate-500">Date & Time</span>
          <span className="font-medium text-slate-700">
            {payment.payment_date ? formatDateTime(payment.payment_date) : '—'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenPrint}
          className="gap-1.5 font-bold border-slate-300 hover:bg-slate-100 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-emerald-600" />
          <span>Print Receipt</span>
        </Button>
        <Button
          size="sm"
          onClick={onClose}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
