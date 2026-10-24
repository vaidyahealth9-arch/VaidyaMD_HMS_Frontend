'use client';

import React, { useState } from 'react';
import PrintableModal from '@/components/common/PrintableModal';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import PrintableReportFooter from '@/components/common/PrintableReportFooter';
import A4Sheet from '@/components/common/A4Sheet';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Phone, CreditCard, Sparkles, Activity, FileSpreadsheet, ListFilter } from 'lucide-react';
import type { DoctorHierarchyDetailResponse } from '@/features/referrals/types';

interface PrintableDoctorStatementProps {
  isOpen: boolean;
  onClose: () => void;
  doctorDetail: DoctorHierarchyDetailResponse;
}

export default function PrintableDoctorStatement({
  isOpen,
  onClose,
  doctorDetail,
}: PrintableDoctorStatementProps) {
  const { currentBranch, user } = useAuth() || {};
  const [statementMode, setStatementMode] = useState<'summary' | 'detailed'>('summary');

  if (!isOpen || !doctorDetail) return null;

  const prof = doctorDetail.doctor_profile;

  // Flatten all invoices for detailed mode
  const allInvoices = doctorDetail.patients.flatMap((pat) =>
    pat.invoices.map((inv) => ({
      ...inv,
      conversion_badge: pat.conversion_badge,
    }))
  );

  return (
    <PrintableModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Doctor Statement — ${doctorDetail.doctor_name}`}
      subtitle={`Referral and Commission Audit (${statementMode === 'summary' ? 'Patient Summary' : 'Detailed Itemized Bills'})`}
      printLabel="Print Statement"
      maxWidth="max-w-5xl"
    >
      {({ hideHeader }) => (
        <A4Sheet
          header={
            <PrintableReportHeader
              title="Doctor Referral & Cycle Conversion Statement"
              subtitle="Center of Excellence in Reproductive Medicine & Advanced Healthcare"
              badge="Referral Audit"
              hideHospitalHeader={hideHeader}
              date={formatDate(new Date())}
              department="Referrals & Clinical Governance"
              metaFields={[
                {
                  label: 'Referring Partner',
                  value: (
                    <span className="font-extrabold text-slate-900">
                      {doctorDetail.doctor_name}
                      {prof?.specialty ? ` (${prof.specialty})` : ''}
                    </span>
                  ),
                },
                {
                  label: 'Clinic / Affiliation',
                  value: prof?.clinic_name || 'Independent Practitioner',
                },
                {
                  label: 'Settlement Account',
                  value: prof?.bank_name ? (
                    <span className="font-mono text-[10px]">
                      {prof.bank_name} · A/C: ····{prof.account_number?.slice(-4) || ''}
                      {prof.upi_id ? ` · UPI: ${prof.upi_id}` : ''}
                    </span>
                  ) : (
                    'Not Specified'
                  ),
                },
                {
                  label: 'Authorized Officer',
                  value: user?.name || 'Hospital Accounts Desk',
                },
              ]}
            />
          }
          footer={
            <PrintableReportFooter
              signatoryTitle="Hospital Referral Desk"
              signatorySubtitle="Authorized Signatory & Reconciler"
              showSignatory={true}
              witnessTitle={`Dr. ${doctorDetail.doctor_name}`}
              showWitness={true}
              showComputerGeneratedNotice={true}
              hideHospitalFooter={hideHeader}
            />
          }
        >
          <div className="py-2 px-6 sm:px-8 print:px-[10mm] space-y-3.5 text-slate-800">
            {/* View Mode Switcher (Hidden in Print) */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 border border-slate-200 print:hidden text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ListFilter className="w-3.5 h-3.5 text-teal-700" />
                Statement Layout Mode:
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-slate-300">
                <button
                  type="button"
                  onClick={() => setStatementMode('summary')}
                  className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                    statementMode === 'summary'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Overview by Patient ({doctorDetail.patients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatementMode('detailed')}
                  className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                    statementMode === 'detailed'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Detailed Itemized Bills ({allInvoices.length})
                </button>
              </div>
            </div>

            {/* Financial KPI Summary Cards */}
            <div className="grid grid-cols-4 gap-2.5 text-center">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Referred Patients</p>
                <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                  {doctorDetail.total_patients_count}
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Billed Revenue</p>
                <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                  ₹{Math.round(doctorDetail.total_revenue).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">Settled to Date</p>
                <p className="text-base font-extrabold text-emerald-900 font-mono mt-0.5">
                  ₹{Math.round(doctorDetail.settled_commission).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">Outstanding Due</p>
                <p className="text-base font-extrabold text-amber-900 font-mono mt-0.5">
                  ₹{Math.round(doctorDetail.pending_commission).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Department Breakdown Mini-Bar */}
            <div className="p-2 rounded bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 text-[10px]">
              <span className="font-bold text-slate-500 uppercase">Departmental Share:</span>
              {doctorDetail.departmental_totals.embryology > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200 font-mono font-medium">
                  IVF: ₹{Math.round(doctorDetail.departmental_totals.embryology).toLocaleString('en-IN')}
                </span>
              )}
              {doctorDetail.departmental_totals.pharmacy > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-medium">
                  Rx: ₹{Math.round(doctorDetail.departmental_totals.pharmacy).toLocaleString('en-IN')}
                </span>
              )}
              {doctorDetail.departmental_totals.iui > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono font-medium">
                  IUI: ₹{Math.round(doctorDetail.departmental_totals.iui).toLocaleString('en-IN')}
                </span>
              )}
              {doctorDetail.departmental_totals.lims > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono font-medium">
                  Lab: ₹{Math.round(doctorDetail.departmental_totals.lims).toLocaleString('en-IN')}
                </span>
              )}
              {doctorDetail.departmental_totals.ipd > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-mono font-medium">
                  IPD: ₹{Math.round(doctorDetail.departmental_totals.ipd).toLocaleString('en-IN')}
                </span>
              )}
              {doctorDetail.departmental_totals.opd > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono font-medium">
                  OPD: ₹{Math.round(doctorDetail.departmental_totals.opd).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* MODE A: PATIENT SUMMARY TABLE */}
            {statementMode === 'summary' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wide">
                  <span>Referred Patient Cycle Summary</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {doctorDetail.patients.length} patients
                  </span>
                </div>
                <div className="overflow-x-auto rounded border border-slate-300">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-300">
                      <tr>
                        <th className="py-2 px-2.5">Patient Details</th>
                        <th className="py-2 px-2.5">Treatment Protocol</th>
                        <th className="py-2 px-2.5 text-center">Conversion</th>
                        <th className="py-2 px-2.5 text-right">Total Billed</th>
                        <th className="py-2 px-2.5 text-right">Commission</th>
                        <th className="py-2 px-2.5 text-center">Settlement Status (Settled &amp; Due)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {doctorDetail.patients.map((pat) => (
                        <tr key={pat.patient_id} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5">
                            <p className="font-bold text-slate-900">{pat.patient_name}</p>
                            <p className="text-[9.5px] text-slate-500 font-mono">{pat.patient_vid || '—'}</p>
                          </td>
                          <td className="py-2 px-2.5 font-medium text-slate-700">
                            {pat.treatment_protocol}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                              {pat.conversion_badge}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                            ₹{Math.round(pat.total_billed).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-extrabold text-teal-900">
                            ₹{Math.round(pat.total_commission).toLocaleString('en-IN')}
                          </td>
                          {/* SHOWING BOTH SETTLED AND DUE AS REQUESTED */}
                          <td className="py-2 px-2.5 text-center">
                            <div className="inline-flex flex-col items-center gap-0.5">
                              {pat.total_commission === 0 ? (
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  Non-Commissionable
                                </span>
                              ) : (
                                <>
                                  {pat.settled_commission > 0 && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono">
                                      Settled: ₹{Math.round(pat.settled_commission).toLocaleString('en-IN')}
                                    </span>
                                  )}
                                  {pat.pending_commission > 0 && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-mono">
                                      Due: ₹{Math.round(pat.pending_commission).toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MODE B: DETAILED ITEMIZED BILLS BREAKDOWN */}
            {statementMode === 'detailed' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wide">
                  <span>Itemized Referral Bills &amp; Department Subsections</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {allInvoices.length} invoices across {doctorDetail.patients.length} patients
                  </span>
                </div>
                <div className="overflow-x-auto rounded border border-slate-300">
                  <table className="w-full text-left text-[10.5px] border-collapse">
                    <thead className="bg-slate-100 text-[9.5px] font-bold text-slate-700 uppercase border-b border-slate-300">
                      <tr>
                        <th className="py-2 px-2">Patient</th>
                        <th className="py-2 px-2">Invoice # &amp; Date</th>
                        <th className="py-2 px-2">Department Breakdown</th>
                        <th className="py-2 px-2 text-right">Net Bill</th>
                        <th className="py-2 px-2 text-right">Commission</th>
                        <th className="py-2 px-2 text-center">Settlement Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {allInvoices.map((inv) => (
                        <tr key={inv.invoice_id} className="hover:bg-slate-50">
                          <td className="py-2 px-2">
                            <p className="font-bold text-slate-900">{inv.patient_name}</p>
                            <p className="text-[9px] text-slate-500 font-mono">{inv.patient_vid || ''}</p>
                          </td>
                          <td className="py-2 px-2">
                            <p className="font-mono font-bold text-slate-900">{inv.invoice_number}</p>
                            <p className="text-[9px] text-slate-500">{formatDate(inv.invoice_date)}</p>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                              {inv.subsections.opd > 0 && (
                                <span className="text-[8.5px] px-1 py-0.2 rounded font-mono bg-blue-50 text-blue-800 border border-blue-200">
                                  OPD: ₹{Math.round(inv.subsections.opd)}
                                </span>
                              )}
                              {inv.subsections.pharmacy > 0 && (
                                <span className="text-[8.5px] px-1 py-0.2 rounded font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  Rx: ₹{Math.round(inv.subsections.pharmacy)}
                                </span>
                              )}
                              {inv.subsections.iui > 0 && (
                                <span className="text-[8.5px] px-1 py-0.2 rounded font-mono bg-indigo-50 text-indigo-800 border border-indigo-200">
                                  IUI: ₹{Math.round(inv.subsections.iui)}
                                </span>
                              )}
                              {inv.subsections.embryology > 0 && (
                                <span className="text-[8.5px] px-1 py-0.2 rounded font-mono bg-purple-50 text-purple-800 border border-purple-200">
                                  IVF: ₹{Math.round(inv.subsections.embryology)}
                                </span>
                              )}
                              {inv.subsections.lims > 0 && (
                                <span className="text-[8.5px] px-1 py-0.2 rounded font-mono bg-amber-50 text-amber-800 border border-amber-200">
                                  Lab: ₹{Math.round(inv.subsections.lims)}
                                </span>
                              )}
                              {inv.subsections.ipd > 0 && (
                                <span className="text-[8.5px] px-1 py-0.2 rounded font-mono bg-rose-50 text-rose-800 border border-rose-200">
                                  IPD: ₹{Math.round(inv.subsections.ipd)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                            ₹{Math.round(inv.net_total).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-extrabold text-teal-900">
                            ₹{Math.round(inv.commission_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {inv.commission_amount === 0 ? (
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                Non-Commissionable
                              </span>
                            ) : inv.is_settled ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  SETTLED
                                </span>
                                {inv.settlement_number && (
                                  <span className="text-[8px] font-mono text-slate-400 mt-0.5">
                                    {inv.settlement_number}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">
                                Due: ₹{Math.round(inv.commission_amount).toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </A4Sheet>
      )}
    </PrintableModal>
  );
}
