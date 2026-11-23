'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Stethoscope, ArrowRightLeft, Receipt, LogOut, RefreshCw } from 'lucide-react';

interface AdmissionsTabProps {
  admissions: any[];
  onOpenChart: (admissionId: string) => void;
  onTransfer: (admission: any) => void;
  onDischarge: (admissionId: string) => void;
  onInterimBill?: (admissionId: string) => void;
  onAccrueCharges?: () => void;
  isAccruing?: boolean;
}

export default function AdmissionsTab({
  admissions,
  onOpenChart,
  onTransfer,
  onDischarge,
  onInterimBill,
  onAccrueCharges,
  isAccruing = false,
}: AdmissionsTabProps) {
  return (
    <div className="space-y-4 pt-2">
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">Active Inpatient Admissions (Current Census)</CardTitle>
            <p className="text-xs text-slate-500">Live roster of all currently admitted inpatient accounts</p>
          </div>
          {onAccrueCharges && (
            <Button
              size="sm"
              variant="outline"
              disabled={isAccruing}
              onClick={onAccrueCharges}
              className="h-8 text-xs font-semibold gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 cursor-pointer shadow-2xs"
              title="Manually calculate and accrue today's room and clinical charges for active census"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isAccruing ? 'animate-spin' : ''}`} />
              <span>{isAccruing ? 'Accruing...' : 'Accrue Tariff'}</span>
            </Button>
          )}
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
                    <div className="font-bold text-slate-900">{adm.patient_name || 'Patient'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {adm.patient_mrn || '—'}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <Badge variant="purple">
                      {adm.ward_name || 'Ward'} · Bed {adm.bed_number || '—'}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-slate-500 font-mono">
                    {formatDateTime(adm.admission_date)}
                  </td>
                  <td className="p-3.5 text-slate-700">
                    {adm.admitting_doctor || 'Attending Physician'}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{formatCurrency(adm.total_accrued_amount)}</td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => onOpenChart(adm.id)}
                        className="h-8 text-xs font-semibold gap-1 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Open Chart</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onTransfer(adm)}
                        className="h-8 text-xs font-semibold gap-1 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="Transfer bed"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Transfer</span>
                      </Button>

                      {onInterimBill && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onInterimBill(adm.id)}
                          className="h-8 text-xs font-semibold gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                          title="Interim bill for accrued charges"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">Interim Bill</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDischarge(adm.id)}
                        className="h-8 text-xs font-semibold gap-1 border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
                        title="Discharge patient"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span className="hidden sm:inline">Discharge</span>
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
