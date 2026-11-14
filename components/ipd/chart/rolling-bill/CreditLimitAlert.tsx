'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { formatCurrency } from '@/lib/utils';

interface CreditLimitAlertProps {
  netDue: number;
  creditLimit: number;
  onCollectDeposit: () => void;
}

export default function CreditLimitAlert({
  netDue,
  creditLimit,
  onCollectDeposit,
}: CreditLimitAlertProps) {
  return (
    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 shadow-2xs animate-in fade-in duration-200">
      <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-rose-950 text-sm">Credit Limit Exceeded Alert</span>
          <Badge variant="destructive" className="text-[10px] uppercase font-bold">
            Action Required
          </Badge>
        </div>
        <p className="text-xs text-rose-800 mt-0.5">
          Current unsettled balance of <strong className="font-bold">{formatCurrency(netDue)}</strong> has
          exceeded the allocated credit threshold of <strong className="font-bold">{formatCurrency(creditLimit)}</strong>.
          Please collect an interim advance deposit from the patient attendant.
        </p>
      </div>
      <Button
        size="sm"
        onClick={onCollectDeposit}
        className="h-8 px-3 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shrink-0 shadow-xs cursor-pointer"
      >
        Collect Top-Up
      </Button>
    </div>
  );
}
