'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Stethoscope, ArrowRightLeft, Receipt, LogOut } from 'lucide-react';

interface AdmissionsTabProps {
  admissions: any[];
  onOpenChart: (admissionId: string) => void;
  onTransfer: (admission: any) => void;
  onDischarge: (admissionId: string) => void;
  onInterimBill?: (admissionId: string) => void;
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export default function AdmissionsTab({
  admissions,
  onOpenChart,
  onTransfer,
  onDischarge,
  onInterimBill,
}: AdmissionsTabProps) {
  return (
    <div className="space-y-4 pt-2">
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm">Active Inpatient Admissions (Current Census)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Admission #</th>
                <th className="p-3.5">Patient Details</th>
                <th className="p-3.5">Bed / Ward</th>
                <th className="p-3.5">Admitted On</th>
                <th className="p-3.5">Attending Doctor</th>
                <th className="p-3.5">Accrued Tariff</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {admissions.map((adm: any) => (
                <tr key={adm.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-[rgb(var(--clr-primary))]">
                    {adm.admission_number}
                  </td>
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900 text-sm">{adm.patient_name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{adm.patient_mrn}</p>
                  </td>
                  <td className="p-3.5">
                    <Badge variant="secondary" className="font-bold">
                      {adm.bed_number}
                    </Badge>
                    <span className="text-[11px] text-slate-500 block">{adm.ward_name}</span>
                  </td>
                  <td className="p-3.5 text-slate-600">{formatDateTime(adm.admission_date)}</td>
                  <td className="p-3.5 text-slate-800 font-semibold">{adm.admitting_doctor}</td>
                  <td className="p-3.5 font-bold text-slate-900">{formatCurrency(adm.total_accrued_amount)}</td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => onOpenChart(adm.id)}
                        className="h-7 text-xs font-bold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                        title="Open Inpatient Bedside Chart"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Chart</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onTransfer({
                            admission_id: adm.id,
                            patient_name: adm.patient_name,
                            bed_number: adm.bed_number,
                            ward_name: adm.ward_name,
                          })
                        }
                        className="h-7 text-xs font-semibold rounded-md border-slate-300 text-slate-700 hover:bg-slate-50 gap-1"
                        title="Shift to another vacant bed"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Shift</span>
                      </Button>

                      {onInterimBill && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onInterimBill(adm.id)}
                          className="h-7 text-xs font-semibold rounded-md border-slate-300 text-slate-700 hover:bg-slate-50 gap-1"
                          title="Interim bill for accrued charges"
                        >
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          <span>Bill</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDischarge(adm.id)}
                        className="h-7 text-xs font-bold rounded-md gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Discharge</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
