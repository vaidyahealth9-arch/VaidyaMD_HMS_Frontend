'use client';

import React from 'react';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import {
  CreditCard,
  Users,
  Phone,
  AlertTriangle,
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { AdmissionDetails } from '@/features/ipd/types';

interface InpatientFinancialSummaryProps {
  admission: AdmissionDetails;
}

export default function InpatientFinancialSummary({ admission }: InpatientFinancialSummaryProps) {
  const advance = admission.advance_amount || 0;
  const accrued = admission.total_accrued_amount || 0;
  const netDue = Math.max(0, accrued - advance);
  const creditLimit = admission.credit_limit || 20000;
  const creditPercent = Math.min(100, Math.round((accrued / (creditLimit || 1)) * 100));

  const isOverLimit = accrued > creditLimit;
  const isNearLimit = !isOverLimit && creditPercent >= 80;

  const partner = admission.patient?.partner;
  const alternatePhone = admission.patient?.alternate_phone;

  return (
    <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-in slide-in-from-top-1 duration-150">
      {/* Col 1: Financial & Ledger Meter */}
      <Card className="p-3 bg-white border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
            <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
            Inpatient Rolling Financial Meter
          </span>
          <Badge
            variant={isOverLimit ? 'destructive' : isNearLimit ? 'warning' : 'success'}
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            {isOverLimit ? 'Credit Exceeded' : isNearLimit ? 'Near Limit (80%+)' : 'Safe Credit'}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100">
          <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
            <span className="text-[10px] text-emerald-800 font-medium block">Advance Paid</span>
            <span className="text-xs font-bold text-emerald-700">{formatCurrency(advance)}</span>
          </div>

          <div className="bg-indigo-50/60 p-2 rounded-lg border border-indigo-100">
            <span className="text-[10px] text-indigo-800 font-medium block">Total Accrued</span>
            <span className="text-xs font-bold text-indigo-700">{formatCurrency(accrued)}</span>
          </div>

          <div className={`p-2 rounded-lg border ${netDue > 0 ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <span className="text-[10px] font-medium block">Net Unbilled Due</span>
            <span className="text-xs font-bold">{formatCurrency(netDue)}</span>
          </div>
        </div>

        {/* Credit Limit Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
            <span>Credit Utilization ({creditPercent}%)</span>
            <span>Limit: {formatCurrency(creditLimit)}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isOverLimit ? 'bg-rose-600' : isNearLimit ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${creditPercent}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Col 2: Couple / Partner & Emergency Contact */}
      <Card className="p-3 bg-white border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
            <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
            Spouse & Emergency Contacts
          </span>
          <span className="text-[10px] font-medium text-slate-400">Clinical Attendant</span>
        </div>

        <div className="space-y-2 pt-1 border-t border-slate-100">
          {partner ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px]">
                  {partner.name?.[0]?.toUpperCase() || 'P'}
                </div>
                <div>
                  <span className="font-bold text-slate-800 text-xs block">{partner.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Linked Partner · {partner.vid}</span>
                </div>
              </div>

              {partner.phone ? (
                <a
                  href={`tel:${partner.phone}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded border border-indigo-100"
                >
                  <Phone className="w-3 h-3" />
                  <span>{partner.phone}</span>
                </a>
              ) : (
                <span className="text-[10px] text-slate-400">No Phone</span>
              )}
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-500 text-[11px] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>No linked partner record in Patient 360 profile.</span>
            </div>
          )}

          {/* Alternate / Emergency Phone */}
          {alternatePhone && (
            <div className="flex items-center justify-between text-xs px-1 text-slate-600">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                Emergency Alternate Contact:
              </span>
              <a
                href={`tel:${alternatePhone}`}
                className="font-bold text-slate-800 hover:text-indigo-600 font-mono"
              >
                {alternatePhone}
              </a>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
