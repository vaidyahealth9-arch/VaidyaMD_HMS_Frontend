'use client';

import React from 'react';
import { Receipt, CreditCard, IndianRupee, Clock, CheckCircle2 } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import { formatCurrency } from '@/lib/utils';
import type { RollingBillSummary } from '@/features/ipd/types';

interface RollingBillKPIsProps {
  summary: RollingBillSummary;
}

export default function RollingBillKPIs({ summary }: RollingBillKPIsProps) {
  const creditLimit = summary.credit_limit || 20000;
  const unbilledTotal = summary.unbilled_total ?? summary.net_due;
  const billedTotal = summary.billed_total ?? Math.max(0, summary.total_gross - unbilledTotal);
  const unbilledCount = (summary.items || []).filter((i) => !i.is_billed).length;
  const billedCount = (summary.items || []).filter((i) => i.is_billed).length;

  const creditUsedPct =
    creditLimit > 0
      ? Math.min(100, Math.round((summary.net_due / creditLimit) * 100))
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Unbilled Charges (Awaiting Invoice Generation) */}
      <StatCard
        label="Unbilled Charges (Pending)"
        value={formatCurrency(unbilledTotal)}
        subtext={`${unbilledCount} items awaiting bill generation`}
        color={unbilledTotal > 0 ? 'warning' : 'default'}
        icon={Clock}
      />

      {/* 2. Billed & Settled Charges */}
      <StatCard
        label="Billed & Settled Invoices"
        value={formatCurrency(billedTotal)}
        subtext={`${billedCount} items generated into bills`}
        color="info"
        icon={CheckCircle2}
      />

      {/* 3. Advance & Interim Payments Received */}
      <StatCard
        label="Total Payments & Deposits"
        value={formatCurrency(summary.total_advance)}
        subtext={`${summary.payments?.length || 0} payment vouchers recorded`}
        color="success"
        icon={CreditCard}
      />

      {/* 4. Live Net Payable Due */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Net Unbilled Due
          </span>
          <span
            className={`text-xs font-mono font-bold ${
              creditUsedPct >= 100 ? 'text-rose-600' : 'text-slate-700'
            }`}
          >
            Credit: {creditUsedPct}%
          </span>
        </div>
        <div className="text-xl font-bold font-mono text-slate-900 mt-1">
          {formatCurrency(summary.net_due)}
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              creditUsedPct >= 100
                ? 'bg-rose-500'
                : creditUsedPct >= 75
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${creditUsedPct}%` }}
          />
        </div>
        <span className="text-[10px] text-slate-400 mt-1 truncate">
          Credit Cap: {formatCurrency(creditLimit)}
        </span>
      </div>
    </div>
  );
}
