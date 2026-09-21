'use client';

import React from 'react';
import PrintableModal from './PrintableModal';
import PrintableReportHeader from './PrintableReportHeader';
import PrintableReportFooter from './PrintableReportFooter';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface WalletTransaction {
  id: string;
  created_at: string;
  type: 'deposit' | 'deduction' | 'refund' | 'adjustment' | string;
  amount: number | string;
  balance_after?: number | string;
  description?: string;
  reference?: string;
}

export interface PrintableWalletStatementModalProps {
  patient: {
    name: string;
    vid?: string;
    mrn?: string;
    phone?: string;
    blood_group?: string;
  };
  partner?: {
    name?: string;
    vid?: string;
  };
  walletBalance: number;
  totalDeposited?: number;
  totalUtilized?: number;
  transactions: WalletTransaction[];
  onClose: () => void;
}

export default function PrintableWalletStatementModal({
  patient,
  partner,
  walletBalance,
  totalDeposited = 0,
  totalUtilized = 0,
  transactions = [],
  onClose,
}: PrintableWalletStatementModalProps) {
  return (
    <PrintableModal
      isOpen={true}
      onClose={onClose}
      title="Wallet Financial Statement Preview"
      subtitle="Official statement of patient advance deposits & treatment deductions"
      maxWidth="max-w-4xl"
    >
      {({ hideHeader }: { hideHeader: boolean }) => (
        <div className="space-y-6">
          <PrintableReportHeader
            title="Patient Treatment Account & Wallet Statement"
            badge="FINANCIAL RECORD"
            hideHospitalHeader={hideHeader}
            department="Accounts & Patient Billing Department"
            patient={patient}
            partner={partner}
          />

          {/* Wallet Balance Summary Card */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50 print:bg-slate-50">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Advanced / Deposited</span>
              <p className="text-base font-bold text-emerald-700 font-mono">{formatCurrency(totalDeposited)}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Utilized for Care</span>
              <p className="text-base font-bold text-slate-700 font-mono">{formatCurrency(totalUtilized)}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Available Advance Balance</span>
              <p
                className={`text-lg font-bold font-mono ${
                  walletBalance > 0 ? 'text-emerald-800' : walletBalance < 0 ? 'text-rose-700' : 'text-slate-800'
                }`}
              >
                {formatCurrency(walletBalance)}
              </p>
            </div>
          </div>

          {/* Ledger Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Transaction Activity Ledger ({transactions.length} entries)
            </h4>
            <table className="w-full text-xs text-left border-collapse border border-slate-200 print-table">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2 px-2.5">Date & Time</th>
                  <th className="py-2 px-2.5">Type</th>
                  <th className="py-2 px-2.5">Reference / Notes</th>
                  <th className="py-2 px-2.5 text-right">Debit / Credit (₹)</th>
                  <th className="py-2 px-2.5 text-right">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                      No financial transactions recorded for this patient yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, idx) => {
                    const isCredit = tx.type === 'deposit' || tx.type === 'adjustment';
                    return (
                      <tr key={tx.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-2.5 font-mono text-slate-600">{tx.created_at ? formatDate(tx.created_at) : '—'}</td>
                        <td className="py-2 px-2.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCredit
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-700 max-w-xs truncate">
                          {tx.description || tx.reference || 'Wallet transaction'}
                        </td>
                        <td
                          className={`py-2 px-2.5 text-right font-mono font-bold ${
                            isCredit ? 'text-emerald-700' : 'text-slate-800'
                          }`}
                        >
                          {isCredit ? `+${formatCurrency(Number(tx.amount) || 0)}` : `-${formatCurrency(Number(tx.amount) || 0)}`}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono text-slate-600">
                          {tx.balance_after !== undefined ? formatCurrency(Number(tx.balance_after)) : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Dynamic Branch Attestation & Signatures */}
          <PrintableReportFooter
            signatoryTitle="Hospital Billing Officer"
            signatorySubtitle="Authorized Accounts Signatory"
            witnessTitle="Patient / Depositor"
            showWitness={true}
            showSignatory={true}
            showComputerGeneratedNotice={true}
          />
        </div>
      )}
    </PrintableModal>
  );
}
