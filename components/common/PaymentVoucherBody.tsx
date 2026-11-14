'use client';

import React from 'react';
import { formatCurrency, amountInWords } from '@/lib/utils';
import type { PaymentVoucherData } from './PrintablePaymentVoucherModal';

interface PaymentVoucherBodyProps {
  voucher: PaymentVoucherData;
  layout: 'a4' | 'a5';
  currentAdvance: number;
  netDue?: number;
}

export default function PaymentVoucherBody({
  voucher,
  layout,
  currentAdvance,
  netDue,
}: PaymentVoucherBodyProps) {
  const isA5 = layout === 'a5';

  return (
    <div
      className={`flex-1 flex flex-col justify-between ${
        isA5
          ? 'py-2 px-5 print:px-[8mm] space-y-2.5 text-[10.5px]'
          : 'py-4 px-6 sm:px-8 print:px-[12mm] space-y-5'
      }`}
    >
      <div className={isA5 ? 'space-y-2.5' : 'space-y-4'}>
        {/* 1. Hero Amount Received Banner */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/90 border border-emerald-200">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Amount Received (Advance Deposit)
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-950">
              {formatCurrency(voucher.amount)}
            </p>
            <p className="text-xs font-semibold text-emerald-900 italic">
              {amountInWords(voucher.amount)}
            </p>
          </div>
          <div className="text-right space-y-1">
            <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-700 text-white shadow-2xs">
              Payment Confirmed
            </span>
            <p className="text-[11px] text-emerald-800 font-medium">
              Mode: <strong className="uppercase">{voucher.payment_method}</strong>
            </p>
          </div>
        </div>

        {/* 2. Structured Payment Breakdown Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[9.5px] font-bold tracking-wider">
              <tr>
                <th className="p-2.5">Receipt Voucher</th>
                <th className="p-2.5">Transaction Type</th>
                <th className="p-2.5">Payment Method</th>
                <th className="p-2.5">Reference / UTR</th>
                <th className="p-2.5 text-right">Credit Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              <tr>
                <td className="p-2.5 font-mono font-bold text-slate-900">
                  {voucher.receipt_number}
                </td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    {voucher.payment_type || 'Advance Deposit'}
                  </span>
                </td>
                <td className="p-2.5 uppercase font-semibold text-slate-700">
                  {voucher.payment_method}
                </td>
                <td className="p-2.5 font-mono text-slate-600">
                  {voucher.transaction_reference || '—'}
                </td>
                <td className="p-2.5 text-right font-mono font-bold text-emerald-700 text-sm">
                  {formatCurrency(voucher.amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. Inpatient Running Account Reconciliation Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/80 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Total Advance on Record
            </span>
            <p className="font-mono font-bold text-emerald-800 text-sm mt-0.5">
              {formatCurrency(currentAdvance)}
            </p>
          </div>
          {netDue !== undefined && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Live Balance Due
              </span>
              <p
                className={`font-mono font-bold text-sm mt-0.5 ${
                  netDue > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {formatCurrency(netDue)}
              </p>
            </div>
          )}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Received & Verified By
            </span>
            <p className="font-semibold text-slate-800 text-xs mt-0.5">
              {voucher.collected_by_name || 'Hospital Cashier'}
            </p>
          </div>
        </div>

        {/* Remarks if any */}
        {voucher.notes && (
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600">
            <strong className="text-slate-800 font-semibold">Remarks: </strong>
            <span>{voucher.notes}</span>
          </div>
        )}
      </div>

      {/* Legal Terms & Hospital Disclaimer */}
      <div className="border-t border-slate-200 pt-2.5 pb-1 text-[9.5px] text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">Important Notes:</p>
        <ol className="list-decimal pl-4 space-y-0.5 leading-relaxed">
          <li>
            Advance deposits are credited to the patient running ledger and will be adjusted against
            final hospital billing at discharge.
          </li>
          <li>
            Clinical and inpatient healthcare services are exempted from GST under Central Notification
            No. 12/2017-CT(R).
          </li>
          <li>
            Please retain this official voucher for final accounts settlement and discharge reconciliation.
          </li>
        </ol>
      </div>
    </div>
  );
}
