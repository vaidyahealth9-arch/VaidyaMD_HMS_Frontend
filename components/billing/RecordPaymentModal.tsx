'use client';

import { useState, useEffect } from 'react';
import { billingApi, walletApi } from '@/lib/api';
import { Wallet, Plus, Trash2, Split } from 'lucide-react';

import { toast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import Spinner from '@/components/common/Spinner';
import SectionLabel from '@/components/common/SectionLabel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog';
import type { Invoice, PaymentMode, SplitPaymentTender } from '@/features/billing/types';

type BillingContext = 'billing' | 'patient-profile' | 'cosgyn' | 'ipd' | 'pharmacy' | 'opd';

interface RecordPaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedInvoice: Invoice) => void;
  /** Where this modal is triggered from — may adjust copy/UX slightly */
  context?: BillingContext;
  allowSplitPayment?: boolean;
}

const UPI_MODES = ['GPay', 'PhonePe', 'Paytm', 'BHIM', 'NEFT', 'Other'];

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'upi',           label: 'UPI / QR Code' },
  { value: 'cash',          label: 'Cash' },
  { value: 'card',          label: 'Card (Debit/Credit)' },
  { value: 'bank_transfer', label: 'Bank Transfer / NEFT' },
  { value: 'cheque',        label: 'Cheque' },
  { value: 'wallet',        label: 'Advance Wallet Deduction' },
];

/**
 * Record Payment & Settlement Modal — unified source of truth for collecting payment
 * on pending or partially-paid invoices across all hospital modules.
 */
export default function RecordPaymentModal({
  invoice,
  isOpen,
  onClose,
  onSuccess,
  context = 'billing',
  allowSplitPayment = true,
}: RecordPaymentModalProps) {
  const [payAmount, setPayAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [payMode, setPayMode] = useState<PaymentMode>('upi');
  const [upiPayMode, setUpiPayMode] = useState('GPay');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Wallet and Split payment state
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitTenders, setSplitTenders] = useState<SplitPaymentTender[]>([
    { payment_method: 'wallet', amount: 0 },
    { payment_method: 'upi', upi_pay_mode: 'GPay', amount: 0 },
  ]);

  // Pre-fill amount when invoice changes
  const pendingDue = invoice ? Number(invoice.pending_due) : 0;
  const numDiscount = parseFloat(discountAmount) || 0;
  const netPayable = Math.max(0, pendingDue - numDiscount);

  // Load patient wallet balance whenever modal opens
  useEffect(() => {
    if (isOpen && invoice?.patient_id) {
      walletApi.get(invoice.patient_id)
        .then((w: any) => setWalletBalance(Number(w?.balance || 0)))
        .catch(() => setWalletBalance(0));
    }
  }, [isOpen, invoice?.patient_id]);

  const handleOpen = (open: boolean) => {
    if (open && invoice) {
      setPayAmount(String(pendingDue));
      setDiscountAmount('');
      setPayMode('upi');
      setUpiPayMode('GPay');
      setReference('');
      setNotes('');
      setIsSplitMode(false);
      setSplitTenders([
        { payment_method: 'wallet', amount: 0 },
        { payment_method: 'upi', upi_pay_mode: 'GPay', amount: 0 },
      ]);
    }
    if (!open) onClose();
  };

  const handleDiscountChange = (val: string) => {
    setDiscountAmount(val);
    const d = parseFloat(val) || 0;
    const clampedDiscount = Math.min(d, pendingDue);
    const remaining = Math.max(0, pendingDue - clampedDiscount);
    setPayAmount(String(remaining));
  };

  const handleApplyWallet = () => {
    const deduct = Math.min(walletBalance, netPayable);
    if (deduct <= 0) return;
    if (isSplitMode) {
      setSplitTenders((prev) => {
        const remaining = Math.max(0, netPayable - deduct);
        return [
          { payment_method: 'wallet', amount: deduct },
          { payment_method: 'upi', upi_pay_mode: 'GPay', amount: remaining },
        ];
      });
      toast.success('Wallet Applied', `Allocated ₹${deduct.toLocaleString()} from advance wallet.`);
    } else {
      setPayMode('wallet');
      setPayAmount(String(deduct));
      toast.success('Wallet Selected', `Set payment to ₹${deduct.toLocaleString()} from advance wallet.`);
    }
  };

  const handleAddSplitTender = () => {
    setSplitTenders((prev) => [...prev, { payment_method: 'cash', amount: 0 }]);
  };

  const handleRemoveSplitTender = (idx: number) => {
    setSplitTenders((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateSplitTender = (idx: number, patch: Partial<SplitPaymentTender>) => {
    setSplitTenders((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const totalSplitAmount = splitTenders.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const handleSubmit = async () => {
    if (!invoice) return;
    const discount = parseFloat(discountAmount) || 0;

    let amount = parseFloat(payAmount) || 0;
    let splitPayload: any[] | undefined = undefined;

    if (isSplitMode) {
      amount = totalSplitAmount;
      if (amount <= 0 && discount <= 0) {
        toast.error('Invalid Amount', 'Enter at least one payment tender amount.');
        return;
      }
      splitPayload = splitTenders.filter((t) => Number(t.amount) > 0);
    } else {
      if (amount <= 0 && discount <= 0) {
        toast.error('Invalid Amount', 'Enter a payment or discount amount.');
        return;
      }
    }

    if (amount + discount > pendingDue + 0.01) {
      toast.error('Exceeds Due', `Payment + discount (₹${(amount + discount).toLocaleString()}) exceeds pending due of ₹${pendingDue.toLocaleString()}.`);
      return;
    }

    setIsSaving(true);
    try {
      const discountNote = discount > 0 ? `Settlement concession: ₹${discount.toLocaleString()}` : '';
      const combinedNotes = [notes, discountNote].filter(Boolean).join(' | ');

      const updated = await billingApi.recordPayment(invoice.id, {
        amount,
        discount: discount > 0 ? discount : undefined,
        payment_method: isSplitMode ? 'split' : (payMode === 'upi' ? (upiPayMode || 'UPI') : payMode),
        upi_pay_mode: !isSplitMode && payMode === 'upi' ? upiPayMode : undefined,
        split_payments: splitPayload,
        notes: combinedNotes || undefined,
      });
      toast.success(
        'Payment Recorded',
        `₹${amount.toLocaleString()} payment recorded${discount > 0 ? ` with ₹${discount.toLocaleString()} concession` : ''}.`,
      );
      onSuccess(updated as Invoice);
      onClose();
    } catch (err: any) {
      toast.error('Payment Failed', err.message || 'Failed to record payment.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment &amp; Settlement</DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Invoice <span className="font-mono font-bold text-primary">{invoice.invoice_number}</span>
            {invoice.patient_name ? ` · ${invoice.patient_name}` : ''}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Due summary */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div>
              <SectionLabel as="p">Total</SectionLabel>
              <p className="font-bold font-mono text-slate-900 text-sm">
                ₹{Number(invoice.total_amount).toLocaleString()}
              </p>
            </div>
            <div>
              <SectionLabel as="p">Paid</SectionLabel>
              <p className="font-bold font-mono text-emerald-700 text-sm">
                ₹{Number(invoice.paid_amount).toLocaleString()}
              </p>
            </div>
            <div>
              <SectionLabel as="p">Pending Due</SectionLabel>
              <p className="font-bold font-mono text-rose-700 text-sm">
                ₹{pendingDue.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Advance Wallet Suggestion Banner */}
          {walletBalance > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-950">Patient Advance Wallet: </span>
                  <span className="font-mono font-bold text-emerald-700">₹{walletBalance.toLocaleString()}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleApplyWallet}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-xs transition-colors"
              >
                Use ₹{Math.min(walletBalance, netPayable).toLocaleString()}
              </button>
            </div>
          )}

          {/* Settlement Discount & Net Payable Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <SectionLabel htmlFor="pay-discount">
                Discount / Concession (₹)
              </SectionLabel>
              <input
                id="pay-discount"
                type="number"
                min={0}
                max={pendingDue}
                step={1}
                value={discountAmount}
                onChange={(e) => handleDiscountChange(e.target.value)}
                className="vmd-input text-sm font-semibold w-full text-rose-600 focus:border-rose-400"
                placeholder="Optional discount"
              />
            </div>
            <div>
              <SectionLabel htmlFor="pay-amount">
                Amount to Collect (₹)
              </SectionLabel>
              <input
                id="pay-amount"
                type="number"
                min={0}
                step={0.01}
                max={netPayable}
                disabled={isSplitMode}
                value={isSplitMode ? String(totalSplitAmount) : payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className={cn("vmd-input text-sm font-bold w-full", isSplitMode && "bg-slate-50 text-slate-500")}
                placeholder={`Max ₹${netPayable.toLocaleString()}`}
              />
            </div>
          </div>

          {numDiscount > 0 && (
            <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg text-xs flex justify-between items-center text-rose-900">
              <span>Pending ₹{pendingDue.toLocaleString()} − Concession ₹{numDiscount.toLocaleString()}</span>
              <span className="font-bold font-mono">Net Due: ₹{netPayable.toLocaleString()}</span>
            </div>
          )}

          {/* Split Mode Toggle */}
          {allowSplitPayment && (
            <div className="flex items-center justify-between pt-1">
              <SectionLabel as="p">Payment Mode Selection</SectionLabel>
              <button
                type="button"
                onClick={() => setIsSplitMode(!isSplitMode)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-colors",
                  isSplitMode ? "bg-primary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                <Split className="w-3.5 h-3.5" />
                {isSplitMode ? "Split Payment Enabled" : "+ Split Multiple Modes"}
              </button>
            </div>
          )}

          {isSplitMode ? (
            /* Multi-tender split payment rows */
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              {splitTenders.map((t, idx) => (
                <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2 shadow-2xs">
                  <div className="flex gap-2 items-center">
                    <select
                      value={t.payment_method}
                      onChange={(e) => handleUpdateSplitTender(idx, { payment_method: e.target.value as PaymentMode })}
                      className="vmd-input text-xs w-36"
                    >
                      {PAYMENT_MODES.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    {t.payment_method === 'upi' && (
                      <select
                        value={t.upi_pay_mode || 'GPay'}
                        onChange={(e) => handleUpdateSplitTender(idx, { upi_pay_mode: e.target.value })}
                        className="vmd-input text-xs w-24"
                      >
                        {UPI_MODES.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    )}
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={t.amount || ''}
                      onChange={(e) => handleUpdateSplitTender(idx, { amount: parseFloat(e.target.value) || 0 })}
                      placeholder="Amount ₹"
                      className="vmd-input text-xs font-mono font-bold flex-1"
                    />
                    {splitTenders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSplitTender(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                        title="Remove Tender"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {/* Reference / Transaction ID per split tender */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={t.reference || ''}
                      onChange={(e) => handleUpdateSplitTender(idx, { reference: e.target.value })}
                      placeholder={
                        t.payment_method === 'upi'
                          ? 'UPI Ref / UTR / Txn ID (e.g. 429182910281)'
                          : t.payment_method === 'card'
                          ? 'Card Approval / Auth Code / Last 4 digits'
                          : t.payment_method === 'cheque'
                          ? 'Cheque No. & Bank Name'
                          : t.payment_method === 'bank_transfer'
                          ? 'NEFT / RTGS Transfer Reference'
                          : 'Tender Note / Reference ID (Optional)'
                      }
                      className="vmd-input text-xs flex-1 bg-slate-50 text-slate-700 py-1"
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={handleAddSplitTender}
                  className="text-primary hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Tender
                </button>
                <div className="text-right">
                  <span className="text-slate-500 mr-2">Allocated:</span>
                  <span className={cn("font-mono font-bold", totalSplitAmount === netPayable ? "text-emerald-700" : "text-amber-700")}>
                    ₹{totalSplitAmount.toLocaleString()} / ₹{netPayable.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Single Payment Mode */
            <>
              <div>
                <SectionLabel htmlFor="pay-mode">Payment Method</SectionLabel>
                <select
                  id="pay-mode"
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as PaymentMode)}
                  className="vmd-input text-xs w-full"
                >
                  {PAYMENT_MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* UPI sub-mode */}
              {payMode === 'upi' && (
                <div>
                  <SectionLabel htmlFor="upi-mode">UPI App / Platform</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {UPI_MODES.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setUpiPayMode(m)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                          upiPayMode === m
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40',
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Reference */}
          <div>
            <SectionLabel htmlFor="pay-ref">Reference / Transaction ID <span className="font-normal normal-case">(optional)</span></SectionLabel>
            <input
              id="pay-ref"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UTR number, cheque number…"
              className="vmd-input text-xs w-full"
            />
          </div>

          {/* Notes */}
          <div>
            <SectionLabel htmlFor="pay-notes">Notes <span className="font-normal normal-case">(optional)</span></SectionLabel>
            <input
              id="pay-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes…"
              className="vmd-input text-xs w-full"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || (isSplitMode ? totalSplitAmount <= 0 : parseFloat(payAmount || '0') <= 0 && parseFloat(discountAmount || '0') <= 0)}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-60"
          >
            {isSaving && <Spinner size="xs" variant="white" />}
            {isSaving
              ? 'Recording…'
              : `Confirm ₹${(isSplitMode ? totalSplitAmount : parseFloat(payAmount || '0')).toLocaleString()} Payment${numDiscount > 0 ? ` (+ ₹${numDiscount.toLocaleString()} Concession)` : ''}`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { RecordPaymentModal as UnifiedPaymentModal };
