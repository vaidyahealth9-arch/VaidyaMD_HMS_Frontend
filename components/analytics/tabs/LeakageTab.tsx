'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, ReceiptText } from 'lucide-react';

interface LeakageTabProps {
  leakageSummary: {
    total_leakage_detected: number;
    unbilled_orders_count: number;
  };
  leakageItems: any[];
  onResolve: (item: any) => void;
  isResolving: boolean;
}

export default function LeakageTab({
  leakageSummary,
  leakageItems,
  onResolve,
  isResolving,
}: LeakageTabProps) {
  return (
    <div className="space-y-4 pt-3">
      <Card className="border-red-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 bg-red-50/30 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <CardTitle className="text-sm font-bold text-red-900">
                Revenue Leakage Action Center
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-600 mt-0.5">
              Identifies clinical investigations, prescriptions, and completed procedures lacking an invoice at the cashier.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold bg-white border-red-200 text-red-700">
              Est. Unbilled Value: {formatCurrency(leakageSummary.total_leakage_detected)}
            </Badge>
            <Badge variant="destructive" className="text-xs font-bold">
              {leakageItems.length} Discrepancies
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {leakageItems.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">Zero Revenue Leakage Detected</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All ordered diagnostic investigations, prescriptions, and completed procedures currently have matching billed invoices.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Leakage Ref</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Care Stream</th>
                  <th className="p-3.5">Unbilled Service / Drug Order</th>
                  <th className="p-3.5">Est. Lost Value</th>
                  <th className="p-3.5">Detected Date</th>
                  <th className="p-3.5 text-right">1-Click Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {leakageItems.map((item: any) => (
                  <tr key={item.leakage_id} className="hover:bg-red-50/20 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-red-700">{item.leakage_id}</td>
                    <td className="p-3.5">
                      <Link
                        href={`/patients/${item.patient_id}`}
                        className="font-bold text-slate-900 hover:text-primary transition-colors"
                      >
                        {item.patient_name}
                      </Link>
                      <p className="text-[11px] text-slate-500 font-mono">{item.patient_mrn}</p>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="text-[10px]">
                        {item.department}
                      </Badge>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <p className="font-bold text-slate-800 line-clamp-1">{item.leakage_type}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{item.service_description}</p>
                    </td>
                    <td className="p-3.5 font-bold text-red-700">{formatCurrency(item.estimated_amount)}</td>
                    <td className="p-3.5 text-slate-500 font-medium">{formatDateTime(item.detected_at)}</td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        onClick={() => onResolve(item)}
                        disabled={isResolving}
                        className="h-8 px-3 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1.5"
                      >
                        <ReceiptText className="w-3.5 h-3.5" />
                        <span>Generate Invoice</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
