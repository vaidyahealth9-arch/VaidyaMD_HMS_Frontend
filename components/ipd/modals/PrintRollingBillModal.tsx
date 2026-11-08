'use client';

import React from 'react';
import PrintableModal from '@/components/common/PrintableModal';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import PrintableReportFooter from '@/components/common/PrintableReportFooter';
import A4Sheet from '@/components/common/A4Sheet';
import { formatCurrency } from '@/lib/utils';
import type { RollingBillSummary } from '@/features/ipd/types';

interface PrintRollingBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: RollingBillSummary;
}

export default function PrintRollingBillModal({
  isOpen,
  onClose,
  summary,
}: PrintRollingBillModalProps) {
  if (!isOpen) return null;

  return (
    <PrintableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Inpatient Running Statement Preview"
      subtitle={`Itemized running charges & advance ledger for ${summary.patient_name}`}
      maxWidth="max-w-4xl"
    >
      {({ hideHeader }: { hideHeader: boolean }) => (
        <A4Sheet
          header={
            <PrintableReportHeader
              title="Inpatient Running Bill Statement"
              badge="IPD RUNNING LEDGER"
              hideHospitalHeader={hideHeader}
              department="Inpatient Department (IPD)"
              patient={{
                name: summary.patient_name,
                vid: summary.patient_mrn,
                mrn: summary.patient_mrn,
              }}
              doctor={{
                name: summary.admitting_doctor,
              }}
              metaFields={[
                { label: 'Admission #', value: summary.admission_number },
                { label: 'Ward & Bed', value: `${summary.ward_name} · Bed ${summary.bed_number}` },
                {
                  label: 'Admission Date',
                  value: summary.admission_date
                    ? new Date(summary.admission_date).toLocaleDateString('en-IN')
                    : '—',
                },
                { label: 'Statement Date', value: new Date().toLocaleDateString('en-IN') },
              ]}
            />
          }
          footer={
            <PrintableReportFooter
              signatoryTitle="Hospital Billing Officer"
              signatorySubtitle="Authorized Cashier / Inpatient Accounts"
              witnessTitle="Patient / Attendant"
              showWitness={true}
              showSignatory={true}
              showComputerGeneratedNotice={true}
              hideHospitalFooter={hideHeader}
            />
          }
        >
          {/* Printable Statement Body */}
          <div className="px-6 sm:px-8 print:px-[12mm] py-3 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Category Breakdown Chips */}
              {summary.category_breakdown && Object.keys(summary.category_breakdown).length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Departmental Tariff Accrual Summary
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(summary.category_breakdown).map(([cat, amount]) => (
                      <div key={cat} className="p-2 border border-slate-200 rounded-md bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 block truncate">{cat}</span>
                        <span className="font-mono font-bold text-slate-900 text-xs">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Itemized Charges Table */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Itemized Accrued Services & Consumables
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Description</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Unit Rate</th>
                        <th className="p-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {summary.items && summary.items.length > 0 ? (
                        summary.items.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="p-2 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                              {item.billing_date ? new Date(item.billing_date).toLocaleDateString('en-IN') : '—'}
                            </td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700">
                                {item.category}
                              </span>
                            </td>
                            <td className="p-2 text-slate-900">
                              <span className="font-semibold">{item.item_name}</span>
                              {item.notes && <span className="block text-[10px] text-slate-400">{item.notes}</span>}
                            </td>
                            <td className="p-2 text-right font-mono text-slate-700">{item.quantity}</td>
                            <td className="p-2 text-right font-mono text-slate-700">{formatCurrency(item.unit_price)}</td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(item.total_price)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400">
                            No charges accrued yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Advance Deposits Ledger */}
              {summary.payments && summary.payments.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Advance Deposits & Interim Credits
                  </h4>
                  <div className="border border-emerald-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-emerald-50 text-emerald-900 font-bold uppercase text-[10px] border-b border-emerald-200">
                        <tr>
                          <th className="p-2">Receipt Voucher #</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Payment Mode</th>
                          <th className="p-2">Txn Reference</th>
                          <th className="p-2 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100 bg-white font-medium">
                        {summary.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="p-2 font-mono font-bold text-emerald-900">{p.receipt_number}</td>
                            <td className="p-2 text-slate-600">
                              {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : '—'}
                            </td>
                            <td className="p-2 uppercase text-slate-700">{p.payment_method}</td>
                            <td className="p-2 font-mono text-slate-500">{p.transaction_reference || '—'}</td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-700">
                              {formatCurrency(p.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Summary Box */}
            <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50 max-w-xs ml-auto space-y-1.5 text-xs">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">Total Accrued Gross:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(summary.total_gross)}</span>
              </div>
              <div className="flex justify-between py-0.5 text-emerald-700 border-b border-slate-200 pb-1">
                <span>Total Advance Credited:</span>
                <span className="font-mono font-bold">- {formatCurrency(summary.total_advance)}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold">
                <span className="text-slate-900">Current Outstanding Due:</span>
                <span className="font-mono text-indigo-700">{formatCurrency(summary.net_due)}</span>
              </div>
            </div>
          </div>
        </A4Sheet>
      )}
    </PrintableModal>
  );
}
