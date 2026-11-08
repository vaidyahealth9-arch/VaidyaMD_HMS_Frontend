'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import EmptyState from '@/components/common/EmptyState';
import { formatCurrency } from '@/lib/utils';
import type { IPDPayment } from '@/features/ipd/types';

interface RollingBillDepositsTableProps {
  payments: IPDPayment[];
  totalAdvance: number;
}

export default function RollingBillDepositsTable({
  payments,
  totalAdvance,
}: RollingBillDepositsTableProps) {
  if (payments.length === 0) {
    return null;
  }

  return (
    <Card className="border-slate-200 shadow-2xs bg-white">
      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Advance Deposits & Payment Receipts</span>
          </CardTitle>
          <p className="text-xs text-slate-500">All advance vouchers credited against inpatient stay</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Credited</span>
          <span className="font-mono font-bold text-emerald-700 text-sm">
            {formatCurrency(totalAdvance)}
          </span>
        </div>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-emerald-50/50 border-b border-emerald-100 text-emerald-900 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3">Receipt Voucher #</th>
              <th className="p-3">Payment Date</th>
              <th className="p-3">Payment Mode</th>
              <th className="p-3">Txn Reference</th>
              <th className="p-3 text-right">Amount (₹)</th>
              <th className="p-3">Collected By</th>
              <th className="p-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-emerald-900">{p.receipt_number}</td>
                <td className="p-3 font-mono text-[11px] text-slate-600">
                  {p.payment_date ? new Date(p.payment_date).toLocaleString('en-IN') : '—'}
                </td>
                <td className="p-3">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-slate-200">
                    {p.payment_method}
                  </Badge>
                </td>
                <td className="p-3 font-mono text-slate-600">{p.transaction_reference || '—'}</td>
                <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                  {formatCurrency(p.amount)}
                </td>
                <td className="p-3 text-slate-600">{p.collected_by_name || 'Cashier'}</td>
                <td className="p-3 text-slate-500 text-[11px]">{p.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
