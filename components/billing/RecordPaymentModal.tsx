'use client';

import { useState } from 'react';
import { billingApi } from '@/lib/api';

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
import type { Invoice, PaymentMode } from '@/features/billing/types';

type BillingContext = 'billing' | 'patient-profile' | 'cosgyn' | 'ipd';

interface RecordPaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedInvoice: Invoice) => void;
  /** Where this modal is triggered from — may adjust copy/UX slightly */
  context?: BillingContext;
}

const UPI_MODES = ['GPay', 'PhonePe', 'Paytm', 'BHIM', 'NEFT', 'Other'];

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'upi',          label: 'UPI / QR Code' },
  { value: 'cash',         label: 'Cash' },
  { value: 'card',         label: 'Card (Debit/Credit)' },
  { value: 'bank_transfer', label: 'Bank Transfer / NEFT' },
  { value: 'cheque',       label: 'Cheque' },
  { value: 'wallet',       label: 'Advance Wallet Deduction' },
];

/**
 * Record Payment Modal — single source of truth for collecting payment
 * on a pending/partially-paid invoice.
 *
 * Previously duplicated inline in:
 *  - billing/page.tsx   (~80 lines)
 *  - cosgyn/page.tsx    (~90 lines)
 *  - patients/[id]/page.tsx  (~70 lines)
 *
 * Usage:
 *   <RecordPaymentModal
 *     invoice={selectedInvoice}
 *     isOpen={!!selectedInvoice}
 *     onClose={() => setSelectedInvoice(null)}
 *     onSuccess={(updated) => refreshInvoices()}
 *     context="billing"
 *   />
 */
export default function RecordPaymentModal({
  invoice,
  isOpen,
  onClose,
  onSuccess,
  context = 'billing',
}: RecordPaymentModalProps) {
  const [payAmount, setPayAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [payMode, setPayMode] = useState<PaymentMode>('upi');
  const [upiPayMode, setUpiPayMode] = useState('GPay');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill amount when invoice changes
  const pendingDue = invoice ? Number(invoice.pending_due) : 0;
  const numDiscount = parseFloat(discountAmount) || 0;
  const netPayable = Math.max(0, pendingDue - numDiscount);

  const handleOpen = (open: boolean) => {
    if (open && invoice) {
      setPayAmount(String(pendingDue));
      setDiscountAmount('');
      setPayMode('upi');
      setUpiPayMode('GPay');
      setReference('');
      setNotes('');
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

  const handleSubmit = async () => {
    if (!invoice) return;
    const amount = parseFloat(payAmount) || 0;
    const discount = parseFloat(discountAmount) || 0;

    if (amount <= 0 && discount <= 0) {
      toast.error('Invalid Amount', 'Enter a payment or discount amount.');
      return;
    }
    if (amount + discount > pendingDue + 0.01) {
      toast.error('Exceeds Due', `Payment + discount (₹${(amount + discount).toLocaleString()}) exceeds pending due of ₹${pendingDue.toLocaleString()}.`);
      return;
    }

    setIsSaving(true);
    try {
      const discountNote = discount > 0 ? `Settlement discount/concession: ₹${discount.toLocaleString()}` : '';
      const combinedNotes = [notes, discountNote].filter(Boolean).join(' | ');

      const updated = await billingApi.recordPayment(invoice.id, {
        amount,
        discount: discount > 0 ? discount : undefined,
        payment_method: payMode === 'upi' ? (upiPayMode || 'UPI') : payMode,
        upi_pay_mode: payMode === 'upi' ? upiPayMode : undefined,
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
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="vmd-input text-sm font-bold w-full"
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

          {/* Payment Mode */}
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
            disabled={isSaving || (parseFloat(payAmount || '0') <= 0 && parseFloat(discountAmount || '0') <= 0)}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-60"
          >
            {isSaving && <Spinner size="xs" variant="white" />}
            {isSaving
              ? 'Recording…'
              : `Confirm ₹${parseFloat(payAmount || '0').toLocaleString()} Payment${numDiscount > 0 ? ` (+ ₹${numDiscount.toLocaleString()} Concession)` : ''}`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
