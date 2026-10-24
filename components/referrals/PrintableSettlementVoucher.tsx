'use client';

import React, { useState } from 'react';
import PrintableModal from '@/components/common/PrintableModal';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import PrintableReportFooter from '@/components/common/PrintableReportFooter';
import A4Sheet from '@/components/common/A4Sheet';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, Receipt, ListFilter } from 'lucide-react';
import type { ReferralSettlement, DoctorHierarchyDetailResponse } from '@/features/referrals/types';

interface PrintableSettlementVoucherProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: ReferralSettlement;
  doctorDetail?: DoctorHierarchyDetailResponse | null;
}

export default function PrintableSettlementVoucher({
  isOpen,
  onClose,
  settlement,
  doctorDetail,
}: PrintableSettlementVoucherProps) {
  const { currentBranch, user } = useAuth() || {};
  const [showItemizedBills, setShowItemizedBills] = useState<boolean>(true);

  if (!isOpen || !settlement) return null;

  const prof = doctorDetail?.doctor_profile;

  // Find the matching invoices settled by this voucher
  const settledInvoices = doctorDetail
    ? doctorDetail.patients.flatMap((pat) =>
        pat.invoices
          .filter((inv) => (settlement.invoice_ids || []).includes(inv.invoice_id))
          .map((inv) => ({
            ...inv,
            conversion_badge: pat.conversion_badge,
          }))
      )
    : [];

  return (
    <PrintableModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Settlement Voucher — ${settlement.settlement_number}`}
      subtitle={`Commission disbursement voucher for Dr. ${settlement.doctor_name}`}
      printLabel="Print Voucher"
      maxWidth="max-w-4xl"
    >
      {({ hideHeader }) => (
        <A4Sheet
          header={
            <PrintableReportHeader
              title="Official Doctor Settlement Voucher"
              subtitle="Hospital Referral Accounts & Commission Disbursement Desk"
              badge="Disbursement Voucher"
              hideHospitalHeader={hideHeader}
              date={formatDate(settlement.settlement_date)}
              department="Finance & Accounts"
              metaFields={[
                {
                  label: 'Voucher Number',
                  value: <span className="font-mono font-bold text-slate-900">{settlement.settlement_number}</span>,
                },
                {
                  label: 'Beneficiary Doctor',
                  value: <span className="font-extrabold text-slate-900">{settlement.doctor_name}</span>,
                },
                {
                  label: 'Disbursement Mode',
                  value: (
                    <span className="font-mono text-xs uppercase font-bold text-teal-800">
                      {settlement.payment_method}
                      {settlement.reference_number ? ` (Ref: ${settlement.reference_number})` : ''}
                    </span>
                  ),
                },
                {
                  label: 'Reconciliation Officer',
                  value: user?.name || 'Accounts Desk',
                },
              ]}
            />
          }
          footer={
            <PrintableReportFooter
              signatoryTitle="Hospital Accounts Officer"
              signatorySubtitle="Authorized Financial Signatory"
              showSignatory={true}
              witnessTitle={`Dr. ${settlement.doctor_name}`}
              showWitness={true}
              showComputerGeneratedNotice={true}
              hideHospitalFooter={hideHeader}
            />
          }
        >
          <div className="py-2.5 px-6 sm:px-8 print:px-[10mm] space-y-4 text-slate-800">
            {/* Beneficiary Doctor Info Strip */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Beneficiary Information</p>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">{settlement.doctor_name}</p>
                {prof?.clinic_name && <p className="text-slate-600 font-medium">{prof.clinic_name}</p>}
                {prof?.phone && <p className="text-slate-500 font-mono text-[11px]">Phone: {prof.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Bank Account on File</p>
                {prof?.bank_name ? (
                  <p className="font-mono text-xs text-slate-800 mt-0.5">
                    {prof.bank_name} · A/C: {prof.account_number}
                    <br />
                    IFSC: {prof.ifsc_code}
                    {prof.upi_id ? ` · UPI: ${prof.upi_id}` : ''}
                  </p>
                ) : (
                  <p className="text-slate-400 italic text-[11px] mt-0.5">Direct Payout / Disbursed</p>
                )}
              </div>
            </div>

            {/* Total Paid Hero Banner */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Total Commission Disbursed
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Reconciled across {settlement.invoice_ids?.length || 0} referral patient bills
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black font-mono text-emerald-900">
                  ₹{Math.round(settlement.amount_paid).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {settlement.notes && (
              <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded border border-slate-200">
                Remarks: {settlement.notes}
              </p>
            )}

            {/* Toggle Itemized Bills in Voucher (Hidden in Print) */}
            {settledInvoices.length > 0 && (
              <div className="flex items-center justify-between pt-1 print:hidden text-xs">
                <span className="font-semibold text-slate-700">Settled Invoices Breakdown</span>
                <button
                  type="button"
                  onClick={() => setShowItemizedBills(!showItemizedBills)}
                  className="text-xs font-bold text-teal-800 hover:text-teal-900 underline cursor-pointer"
                >
                  {showItemizedBills ? 'Hide Individual Bills' : 'Show Individual Bills'}
                </button>
              </div>
            )}

            {/* Itemized Bills Table */}
            {showItemizedBills && settledInvoices.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <h4 className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wide">
                  Itemized Bills Covered by this Voucher
                </h4>
                <div className="overflow-x-auto rounded border border-slate-300">
                  <table className="w-full text-left text-[10.5px] border-collapse">
                    <thead className="bg-slate-100 text-[9.5px] font-bold text-slate-700 uppercase border-b border-slate-300">
                      <tr>
                        <th className="py-2 px-2.5">Patient Details</th>
                        <th className="py-2 px-2.5">Invoice # &amp; Date</th>
                        <th className="py-2 px-2.5 text-right">Net Bill</th>
                        <th className="py-2 px-2.5 text-right">Commission Settled</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {settledInvoices.map((inv) => (
                        <tr key={inv.invoice_id} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5">
                            <p className="font-bold text-slate-900">{inv.patient_name}</p>
                            <p className="text-[9px] text-slate-500 font-mono">{inv.patient_vid || ''}</p>
                          </td>
                          <td className="py-2 px-2.5">
                            <p className="font-mono font-bold text-slate-900">{inv.invoice_number}</p>
                            <p className="text-[9px] text-slate-500">{formatDate(inv.invoice_date)}</p>
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono text-slate-800">
                            ₹{Math.round(inv.net_total).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono font-extrabold text-emerald-800">
                            ₹{Math.round(inv.commission_amount).toLocaleString('en-IN')}
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
