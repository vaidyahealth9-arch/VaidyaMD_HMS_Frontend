'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { formatCurrency } from '@/lib/utils';

interface AdmissionsTabProps {
  admissions: any[];
  onDischarge: (admissionId: string) => void;
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
  onDischarge,
}: AdmissionsTabProps) {
  return (
    <div className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm">Active Inpatient Admissions (Current Census)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Admission #</th>
                    <th className="p-3.5">Patient Details</th>
                    <th className="p-3.5">Bed / Ward</th>
                    <th className="p-3.5">Admitted On</th>
                    <th className="p-3.5">Attending Doctor</th>
                    <th className="p-3.5">Total Accrued</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {admissions.map((adm: any) => (
                    <tr key={adm.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-[rgb(var(--clr-primary))]">{adm.admission_number}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{adm.patient_name}</p>
                        <p className="text-[11px] text-slate-500">{adm.patient_mrn}</p>
                      </td>
                      <td className="p-3.5">
                        <Badge variant="secondary" className="font-bold">{adm.bed_number}</Badge>
                      </td>
                      <td className="p-3.5 text-slate-600">{formatDateTime(adm.admission_date)}</td>
                      <td className="p-3.5 text-slate-800 font-semibold">{adm.admitting_doctor}</td>
                      <td className="p-3.5 font-bold text-slate-900">{formatCurrency(adm.total_accrued_amount)}</td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDischarge(adm.id)}
                          className="h-7 text-xs font-bold rounded-lg"
                        >
                          Discharge
                        </Button>
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
