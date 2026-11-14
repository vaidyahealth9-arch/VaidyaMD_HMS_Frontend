'use client';

import React from 'react';
import type { InsuranceBillItem } from './types';
import { formatCurrency } from '@/lib/utils';
import { Check, X, ShieldAlert } from 'lucide-react';

interface InsuranceBillTableProps {
  items: InsuranceBillItem[];
  onToggleExclude?: (id: string) => void;
  onToggleCashService?: (id: string) => void;
  advanceAmount?: number;
}

export default function InsuranceBillTable({
  items,
  onToggleExclude,
  onToggleCashService,
  advanceAmount = 0,
}: InsuranceBillTableProps) {
  // Only printable (non-excluded) items will be rendered
  const printableItems = items.filter((it) => !it.is_excluded);
  const excludedCount = items.filter((it) => it.is_excluded).length;

  const totalGross = printableItems.reduce((sum, it) => sum + (it.total_price || 0), 0);
  const totalGst = printableItems.reduce((sum, it) => sum + (it.gst_amount || 0), 0);
  const netPayable = Math.max(0, totalGross + totalGst - advanceAmount);

  return (
    <div className="w-full space-y-2 font-sans">
      {/* Exclusion Banner on Screen (Hidden during print) */}
      {excludedCount > 0 && (
        <div className="flex items-center justify-between p-2 px-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs no-print">
          <div className="flex items-center gap-1.5 font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {excludedCount} non-applicable service{excludedCount > 1 ? 's' : ''} removed from insurance claim
            </span>
          </div>
          <span className="text-[11px] text-amber-700">
            {printableItems.length} applicable item{printableItems.length !== 1 ? 's' : ''} on bill
          </span>
        </div>
      )}

      {/* Primary Table matching Screenshot 1 */}
      <table className="w-full text-left text-[10.5px] border-collapse">
        <thead>
          <tr className="border-y border-slate-900 text-slate-900 font-bold uppercase text-[9.5px]">
            <th className="py-1 px-1.5 whitespace-nowrap w-20">Bill Date</th>
            <th className="py-1 px-1.5 w-24">Service Cd</th>
            <th className="py-1 px-2">Services / Investigation</th>
            <th className="py-1 px-1.5 text-center w-12">Qty.</th>
            <th className="py-1 px-1.5 text-right w-20">Rate</th>
            <th className="py-1 px-2 text-right w-24">Amount</th>
            <th className="py-1 px-1.5 text-right w-16">GST</th>
            {onToggleExclude && <th className="py-1 px-1.5 text-center w-14 no-print">Applicable</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-normal text-slate-800">
          {items.map((it, idx) => {
            const isCash = it.is_cash_service;
            const isExcluded = it.is_excluded;

            return (
              <tr
                key={it.id || idx}
                className={`${isExcluded ? 'opacity-40 bg-slate-100/60 no-print line-through' : 'hover:bg-slate-50'}`}
              >
                <td className="py-1 px-1.5 font-mono text-[10px] text-slate-600 whitespace-nowrap">
                  {isCash && <span className="font-bold text-slate-900">*</span>}
                  {it.bill_date || '—'}
                </td>
                <td className="py-1 px-1.5 font-mono text-[10px] text-slate-700 font-semibold">
                  {it.service_code || `SRV${String(idx + 1).padStart(3, '0')}`}
                </td>
                <td className="py-1 px-2 font-medium text-slate-900">
                  <span>{it.description}</span>
                  {isCash && (
                    <span className="text-[9px] text-amber-700 font-mono ml-1 no-print">
                      (Cash)
                    </span>
                  )}
                </td>
                <td className="py-1 px-1.5 text-center font-mono">{it.quantity}</td>
                <td className="py-1 px-1.5 text-right font-mono">
                  {it.unit_price.toFixed(2)}
                </td>
                <td className="py-1 px-2 text-right font-mono font-semibold text-slate-950">
                  {it.total_price.toFixed(2)}
                </td>
                <td className="py-1 px-1.5 text-right font-mono text-slate-600">
                  {(it.gst_amount || 0).toFixed(2)}
                </td>

                {/* On-screen Item Exclusion Toggles */}
                {onToggleExclude && (
                  <td className="py-1 px-1.5 text-center no-print">
                    <button
                      type="button"
                      onClick={() => onToggleExclude(it.id)}
                      className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                        isExcluded
                          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                      title={isExcluded ? 'Click to re-include in insurance bill' : 'Click to remove non-applicable item'}
                    >
                      {isExcluded ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Bill Footer & Totals */}
      <div className="pt-2 border-t border-slate-900 space-y-1.5">
        <div className="flex justify-between items-start text-[10px]">
          <div className="space-y-0.5 text-slate-600">
            <p className="font-semibold text-slate-800">
              Note: <span className="font-bold text-slate-950">*</span> - Indicates Cash Service (Non-insurance)
            </p>
            <p>Healthcare services are exempted from GST under Notification No. 12/2017-CT(R).</p>
          </div>

          <div className="w-64 space-y-1 text-xs">
            <div className="flex justify-between py-0.5 border-b border-slate-200">
              <span className="text-slate-600">Total Bill Amount:</span>
              <span className="font-mono font-bold text-slate-950">₹{totalGross.toFixed(2)}</span>
            </div>
            {advanceAmount > 0 && (
              <div className="flex justify-between py-0.5 border-b border-slate-200 text-emerald-800">
                <span>Less: Advance Deposited:</span>
                <span className="font-mono font-bold">− ₹{advanceAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-t-2 border-slate-900 font-bold text-slate-950 text-sm">
              <span>Net Claimable Due:</span>
              <span className="font-mono">₹{netPayable.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
