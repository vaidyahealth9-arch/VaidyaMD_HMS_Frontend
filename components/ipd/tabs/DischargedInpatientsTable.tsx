'use client';

import React from 'react';
import { History, FileText, Receipt } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import EmptyState from '@/components/common/EmptyState';
import { formatCurrency, formatDate as formatDateOnly } from '@/lib/utils';

export interface DischargedInpatientsTableProps {
  admissions: any[];
  isLoading: boolean;
  searchQuery: string;
  isLoadingInvoice: boolean;
  onOpenSummary: (adm: any) => void;
  onOpenInvoice: (adm: any) => void;
}

export default function DischargedInpatientsTable({
  admissions,
  isLoading,
  searchQuery,
  isLoadingInvoice,
  onOpenSummary,
  onOpenInvoice,
}: DischargedInpatientsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <span>Discharged Inpatients Register</span>
          </CardTitle>
          <p className="text-xs text-slate-500">
            Complete historical log of discharged admissions, length of stay, discharge summaries, and final invoices
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-semibold">
          {admissions.length} Record{admissions.length === 1 ? '' : 's'}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading discharge history records...</div>
        ) : admissions.length === 0 ? (
          <EmptyState
            icon={History}
            title={searchQuery ? 'No Matching Discharge Records' : 'No Discharged Inpatients Yet'}
            subtitle={
              searchQuery
                ? 'Try adjusting your search query or ward filter.'
                : 'Patients discharged from IPD beds will appear here with clinical summaries and settlement invoices.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">Admission #</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Stay Period & Duration</th>
                  <th className="p-3.5">Ward / Bed</th>
                  <th className="p-3.5">Attending Doctor</th>
                  <th className="p-3.5">Discharge Diagnosis</th>
                  <th className="p-3.5">Settlement & Invoice</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {admissions.map((adm: any) => {
                  const stayDays = adm.stay_days || 1;
                  const hasInvoice = Boolean(adm.invoice_id);

                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Admission # */}
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-[rgb(var(--clr-primary))]">
                          {adm.admission_number}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {adm.package_name || 'Standard IPD'}
                        </span>
                      </td>

                      {/* Patient Details */}
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900 text-sm">{adm.patient_name}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                          <span>MRN: {adm.patient_mrn}</span>
                          {adm.patient_gender && (
                            <span>
                              · {adm.patient_gender}
                              {adm.patient_age ? `, ${adm.patient_age}y` : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stay Period & Duration */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <p className="text-slate-700 text-xs">
                            <span className="text-slate-400">Adm:</span> {formatDateOnly(adm.admission_date)}
                          </p>
                          <p className="text-slate-700 text-xs">
                            <span className="text-slate-400">Dis:</span> {formatDateOnly(adm.discharge_date)}
                          </p>
                          <Badge variant="purple" className="text-[10px] px-1.5 py-0 mt-0.5 font-bold">
                            {stayDays} Day{stayDays > 1 ? 's' : ''} Stay
                          </Badge>
                        </div>
                      </td>

                      {/* Ward / Bed */}
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800">{adm.ward_name}</span>
                        <span className="text-[11px] text-slate-500 block">Bed {adm.bed_number}</span>
                      </td>

                      {/* Doctor */}
                      <td className="p-3.5 text-slate-800 font-semibold">{adm.admitting_doctor}</td>

                      {/* Diagnosis */}
                      <td className="p-3.5 max-w-[200px]">
                        <p className="text-slate-800 text-xs truncate" title={adm.diagnosis}>
                          {adm.diagnosis || '—'}
                        </p>
                        {adm.discharge_summary?.condition_at_discharge && (
                          <span className="inline-block text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1">
                            {adm.discharge_summary.condition_at_discharge}
                          </span>
                        )}
                      </td>

                      {/* Settlement / Invoice */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">
                            {formatCurrency(adm.invoice_total || adm.total_accrued_amount || 0)}
                          </p>
                          {hasInvoice ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-mono text-slate-500">
                                #{adm.invoice_number || 'INV'}
                              </span>
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No invoice linked</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Clinical Summary View/Print Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenSummary(adm)}
                            className="h-7 text-xs font-semibold rounded-md border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1"
                            title="View & Print Clinical Discharge Summary"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Summary</span>
                          </Button>

                          {/* Invoice View/Print Button */}
                          {hasInvoice ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onOpenInvoice(adm)}
                              disabled={isLoadingInvoice}
                              className="h-7 text-xs font-semibold rounded-md border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1"
                              title="View & Print Discharge Invoice"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Invoice</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled
                              className="h-7 text-xs text-slate-300 gap-1 cursor-not-allowed"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Invoice</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
