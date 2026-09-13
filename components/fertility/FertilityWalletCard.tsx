'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  CreditCard,
  Receipt,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  ExternalLink,
  ChevronRight,
  X,
} from 'lucide-react';
import { walletApi, billingApi } from '@/lib/api';

export interface FertilityWalletCardProps {
  patientId: string;
  patientName?: string;
  patientVid?: string;
  invoices?: any[];
  onWalletUpdated?: () => void;
  compact?: boolean;
}

export default function FertilityWalletCard({
  patientId,
  patientName = 'Patient',
  patientVid,
  invoices = [],
  onWalletUpdated,
  compact = false,
}: FertilityWalletCardProps) {
  const [wallet, setWallet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showPayInvoiceModal, setShowPayInvoiceModal] = useState(false);

  // Top-Up Form State
  const [amount, setAmount] = useState('25000');
  const [paymentMode, setPaymentMode] = useState('upi');
  const [utrRef, setUtrRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmittingTopUp, setIsSubmittingTopUp] = useState(false);

  // Pay Invoice Form State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const PRESET_AMOUNTS = [10000, 25000, 50000, 100000, 250000];

  const fetchWallet = async () => {
    setIsLoading(true);
    try {
      const data = await walletApi.get(patientId);
      setWallet(data);
    } catch (err) {
      console.error('Failed to load wallet', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchWallet();
    }
  }, [patientId]);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid deposit amount');
      return;
    }

    setIsSubmittingTopUp(true);
    try {
      await walletApi.topUp(patientId, {
        amount: numAmount,
        payment_method: paymentMode,
        notes: utrRef ? `Ref: ${utrRef} | ${notes}` : notes,
      });

      setSuccessMsg(`Successfully deposited ₹${numAmount.toLocaleString('en-IN')} to advance wallet.`);
      setShowTopUpModal(false);
      setAmount('25000');
      setUtrRef('');
      setNotes('');
      await fetchWallet();
      onWalletUpdated?.();

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Deposit error:', err);
      alert(err.message || 'Failed to deposit advance funds');
    } finally {
      setIsSubmittingTopUp(false);
    }
  };

  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      alert('Please select an invoice to settle');
      return;
    }
    const numAmount = parseFloat(payAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (wallet && wallet.balance < numAmount) {
      alert(`Insufficient wallet balance (Available: ₹${wallet.balance.toLocaleString('en-IN')})`);
      return;
    }

    setIsSubmittingPay(true);
    try {
      await walletApi.payInvoice(patientId, {
        invoice_id: selectedInvoiceId,
        amount: numAmount,
      });

      setSuccessMsg(`Deducted ₹${numAmount.toLocaleString('en-IN')} from wallet for invoice payment.`);
      setShowPayInvoiceModal(false);
      setSelectedInvoiceId('');
      setPayAmount('');
      await fetchWallet();
      onWalletUpdated?.();

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Invoice payment error:', err);
      alert(err.message || 'Failed to pay invoice from wallet');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const pendingInvoices = invoices.filter(
    (inv) => inv.status !== 'paid' && parseFloat(inv.pending_due || '0') > 0
  );

  const transactions = wallet?.transactions || [];

  // Lifetime Stats
  const totalDeposits = transactions
    .filter((t: any) => t.type === 'deposit')
    .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

  const totalDebits = transactions
    .filter((t: any) => t.type === 'debit')
    .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

  const balance = wallet?.balance ?? 0;

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Clinical Wallet Strip */}
      <div className="bg-slate-900 text-white rounded-lg p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Balance & Info */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 bg-slate-800 rounded-md text-slate-300">
                <Wallet className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-semibold tracking-wider uppercase text-slate-400">
                Patient Advance Deposit Wallet
              </span>
              {patientVid && (
                <span className="font-mono text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                  {patientVid}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>

              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded border ${
                  balance > 50000
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                    : balance > 0
                    ? 'bg-sky-950/70 text-sky-300 border-sky-700/60'
                    : 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                }`}
              >
                {balance > 50000
                  ? 'Optimal ART Reserve'
                  : balance > 0
                  ? 'Active Balance'
                  : 'Zero Credit Reserve'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Hospital ledger for IVF packages, pharmacy FEFO indents, and lab procedure deposits.
            </p>

            {/* Lifetime Summary metrics */}
            <div className="flex items-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <ArrowDownLeft className="w-3 h-3" />
                </span>
                <span className="text-slate-400">Total Deposited:</span>
                <strong className="text-emerald-300 font-mono font-semibold">
                  ₹{totalDeposits.toLocaleString('en-IN')}
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded bg-rose-950 text-rose-400 border border-rose-800">
                  <ArrowUpRight className="w-3 h-3" />
                </span>
                <span className="text-slate-400">Total Utilized:</span>
                <strong className="text-rose-300 font-mono font-semibold">
                  ₹{totalDebits.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTopUpModal(true)}
              className="px-3.5 py-2 bg-[rgb(var(--clr-primary))] hover:opacity-90 text-white font-semibold text-xs rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Deposit Advance</span>
            </button>

            {pendingInvoices.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (balance <= 0) {
                    alert('Wallet balance is zero. Please deposit funds first.');
                    return;
                  }
                  const firstDue = pendingInvoices[0];
                  setSelectedInvoiceId(firstDue.id);
                  setPayAmount(
                    String(Math.min(balance, parseFloat(firstDue.pending_due || '0')))
                  );
                  setShowPayInvoiceModal(true);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4 text-[rgb(var(--clr-accent))]" />
                <span>Pay Invoices ({pendingInvoices.length} Due)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
              title="Print Statement"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Statement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      {!compact && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-sm text-slate-900">
                Advance Ledger &amp; Transaction History
              </h3>
              <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {transactions.length} entries
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Auto-reconciled with hospital banking desk
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No transactions recorded yet. Click <strong>Deposit Advance</strong> to credit the patient wallet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-2.5 px-3">Date &amp; Time</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Payment Mode / Ref</th>
                    <th className="py-2.5 px-3">Narration &amp; Notes</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {transactions.map((tx: any) => {
                    const isDeposit = tx.type === 'deposit';
                    const txDate = tx.created_at
                      ? new Date(tx.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—';

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {txDate}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              isDeposit
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isDeposit ? (
                              <>
                                <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                                Credit (Deposit)
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-3 h-3 text-rose-600" />
                                Debit (Invoice)
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`font-mono font-semibold text-xs ${
                              isDeposit ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isDeposit ? '+' : '-'}₹
                            {parseFloat(tx.amount || '0').toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 uppercase text-[11px]">
                            {tx.payment_mode || 'Cash'}
                          </span>
                          {tx.reference_invoice_id && (
                            <span className="block font-mono text-[10px] text-slate-500 truncate max-w-[140px]">
                              Inv: {tx.reference_invoice_id.slice(0, 8)}...
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-xs truncate">
                          {tx.notes || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            <CheckCircle2 className="w-3 h-3" />
                            Posted
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Top-Up Advance Deposit */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full space-y-4 shadow-lg animate-fadeIn relative border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Deposit Patient Advance Funds
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Crediting {patientName} ({patientVid || patientId.slice(0, 8)})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTopUp} className="space-y-4">
              {/* Preset Buttons */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase">
                  Quick Amount Presets
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {PRESET_AMOUNTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmount(String(p))}
                      className={`py-1.5 px-2 rounded-md text-xs font-mono font-semibold transition-all border ${
                        amount === String(p)
                          ? 'bg-[rgb(var(--clr-primary))] text-white border-[rgb(var(--clr-primary))]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      ₹{(p / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deposit Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="vmd-input pl-8 text-lg font-bold text-slate-900 font-mono w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="vmd-input text-xs w-full font-medium"
                  >
                    <option value="upi">UPI / QR Code</option>
                    <option value="card">Debit / Credit Card (POS)</option>
                    <option value="neft">NEFT / RTGS Bank Transfer</option>
                    <option value="cash">Cash Counter</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank UTR / Transaction Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI-2026-XXXX"
                    value={utrRef}
                    onChange={(e) => setUtrRef(e.target.value)}
                    className="vmd-input text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accounting Narration / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advance for IVF Cycle Day 1"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="vmd-input text-xs w-full"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTopUp}
                  className="flex-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isSubmittingTopUp ? (
                    'Processing Deposit...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm ₹{parseFloat(amount || '0').toLocaleString('en-IN')} Deposit</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Pay Invoice from Wallet */}
      {showPayInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full space-y-4 shadow-lg animate-fadeIn relative border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Settle Invoice from Advance Wallet
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Available Wallet Balance: <strong className="text-slate-900 font-mono">₹{balance.toLocaleString('en-IN')}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPayInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePayInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Unpaid Invoice *
                </label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    const invId = e.target.value;
                    setSelectedInvoiceId(invId);
                    const found = pendingInvoices.find((i) => i.id === invId);
                    if (found) {
                      setPayAmount(
                        String(Math.min(balance, parseFloat(found.pending_due || '0')))
                      );
                    }
                  }}
                  className="vmd-input text-xs w-full font-medium"
                  required
                >
                  <option value="">Select an invoice with pending due...</option>
                  {pendingInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} — Due: ₹{parseFloat(inv.pending_due || '0').toLocaleString('en-IN')} ({inv.appointment_source || 'OPD/IVF'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount to Deduct from Wallet (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    max={balance}
                    min="1"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="vmd-input pl-8 text-lg font-bold text-slate-900 font-mono w-full"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Deduction will automatically be applied against invoice balance.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayInvoiceModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="flex-2 py-2 bg-[rgb(var(--clr-primary))] hover:opacity-90 text-white font-semibold text-xs rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isSubmittingPay ? (
                    'Processing Payment...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Wallet Payment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
