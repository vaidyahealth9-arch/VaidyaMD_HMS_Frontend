'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Receipt, CreditCard, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { formatDate } from '@/lib/utils';
import type {
  DoctorHierarchyDetailResponse,
  ReferralSettlementCreate,
  ReferralInvoiceReportItem,
} from '@/features/referrals/types';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorDetail: DoctorHierarchyDetailResponse | null;
  preselectedInvoiceId?: string | null;
  onSettle: (payload: ReferralSettlementCreate) => void;
  isPending: boolean;
}

export default function SettlementModal({
  isOpen,
  onClose,
  doctorDetail,
  preselectedInvoiceId,
  onSettle,
  isPending,
}: SettlementModalProps) {
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [settlementNotes, setSettlementNotes] = useState<string>('');
  const [settlementDate, setSettlementDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Extract all unsettled invoices for this doctor
  const unsettledInvoices = useMemo(() => {
    if (!doctorDetail) return [];
    const list: Array<{
      patient_id: string;
      patient_name: string;
      patient_vid?: string;
      treatment_protocol: string;
      invoice: ReferralInvoiceReportItem;
    }> = [];

    doctorDetail.patients.forEach((pat) => {
      pat.invoices.forEach((inv) => {
        if (!inv.is_settled && inv.commission_amount > 0) {
          list.push({
            patient_id: pat.patient_id,
            patient_name: pat.patient_name,
            patient_vid: pat.patient_vid,
            treatment_protocol: pat.treatment_protocol,
            invoice: inv,
          });
        }
      });
    });
    return list;
  }, [doctorDetail]);

  // Initialize selected invoice IDs when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (preselectedInvoiceId) {
      setSelectedInvoiceIds([preselectedInvoiceId]);
    } else {
      // Overall settle button tapped: select all by default
      setSelectedInvoiceIds(unsettledInvoices.map((u) => u.invoice.invoice_id));
    }
    setReferenceNumber('');
    setSettlementNotes('');
    setPaymentMethod('bank_transfer');
    setSettlementDate(new Date().toISOString().split('T')[0]);
  }, [isOpen, preselectedInvoiceId, unsettledInvoices]);

  // Calculate total amount from selected invoices
  const totalAmount = useMemo(() => {
    let sum = 0;
    unsettledInvoices.forEach((item) => {
      if (selectedInvoiceIds.includes(item.invoice.invoice_id)) {
        sum += item.invoice.commission_amount;
      }
    });
    return Math.round(sum);
  }, [unsettledInvoices, selectedInvoiceIds]);

  if (!isOpen || !doctorDetail) return null;

  const prof = doctorDetail.doctor_profile;
  const isOverallSettle = !preselectedInvoiceId;

  const toggleInvoice = (id: string) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoiceIds.length === unsettledInvoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(unsettledInvoices.map((u) => u.invoice.invoice_id));
    }
  };

  const handleSubmit = () => {
    if (selectedInvoiceIds.length === 0 || totalAmount <= 0) return;
    onSettle({
      doctor_name: doctorDetail.doctor_name,
      amount_paid: totalAmount,
      payment_method: paymentMethod,
      reference_number: referenceNumber.trim() || undefined,
      settlement_date: settlementDate,
      notes: settlementNotes.trim() || undefined,
      invoice_ids: selectedInvoiceIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-teal-900/10 to-teal-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-teal-700" />
              Settle Doctor Commission Payout
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Recording payout for <span className="font-bold text-slate-900">{doctorDetail.doctor_name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Doctor Bank Summary */}
          {prof?.bank_name && (
            <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200 text-teal-900 text-[11px] space-y-0.5">
              <p className="font-bold flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-teal-700" />
                Doctor Bank Account on File:
              </p>
              <p className="font-mono">
                {prof.bank_name} · A/C: {prof.account_number} · IFSC: {prof.ifsc_code}
              </p>
              {prof.upi_id && <p className="font-mono">UPI ID: {prof.upi_id}</p>}
            </div>
          )}

          {/* CHECKBOX INVOICE SELECTION TABLE (WHEN OVERALL SETTLE TAPPED) */}
          {isOverallSettle && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Select Unsettled Invoices ({selectedInvoiceIds.length} of {unsettledInvoices.length} selected)
                </span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-teal-800 hover:text-teal-900 underline cursor-pointer"
                >
                  {selectedInvoiceIds.length === unsettledInvoices.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {unsettledInvoices.length === 0 ? (
                <div className="p-4 text-center text-slate-400 border border-slate-200 rounded-lg">
                  No unsettled invoices found for this doctor.
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                  {unsettledInvoices.map((item) => {
                    const isChecked = selectedInvoiceIds.includes(item.invoice.invoice_id);
                    const inv = item.invoice;

                    return (
                      <div
                        key={inv.invoice_id}
                        onClick={() => toggleInvoice(inv.invoice_id)}
                        className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isChecked ? 'bg-teal-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Handled by parent div
                            className="w-4 h-4 rounded text-teal-700 border-slate-300 focus:ring-teal-700 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">
                              {item.patient_name} <span className="font-mono text-[10px] text-slate-400 font-normal">({item.patient_vid || '—'})</span>
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                              <span>{inv.invoice_number}</span>
                              <span>· {formatDate(inv.invoice_date)}</span>
                              <span>· Net: ₹{Math.round(inv.net_total).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="font-mono font-extrabold text-teal-900 text-xs">
                            ₹{Math.round(inv.commission_amount).toLocaleString('en-IN')}
                          </p>
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                            Unsettled
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Single Invoice Note if opened from specific invoice */}
          {!isOverallSettle && (
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Settling 1 Selected Invoice</span>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Invoice ID: {preselectedInvoiceId}
              </p>
            </div>
          )}

          {/* Settlement Total Highlight Banner */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50 border border-teal-200">
            <div>
              <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                Total Settlement Amount
              </p>
              <p className="text-[11px] text-teal-700">
                {selectedInvoiceIds.length} bill(s) marked for payout
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black font-mono text-teal-950">
                ₹{totalAmount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase">Payment Mode</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-8 text-xs bg-white border border-slate-300 rounded-md px-2 focus:ring-1 focus:ring-teal-700"
              >
                <option value="bank_transfer">Bank Transfer (NEFT / RTGS)</option>
                <option value="upi">UPI / GPay</option>
                <option value="cheque">Bank Cheque</option>
                <option value="cash">Cash Voucher</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase">Settlement Date</label>
              <Input
                type="date"
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="h-8 text-xs border-slate-300"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase">
              Transaction Reference / UTR / Cheque #
            </label>
            <Input
              type="text"
              placeholder="e.g. UTR19827364521 or CHQ-009182"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="h-8 text-xs border-slate-300 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase">Notes / Remarks</label>
            <Input
              type="text"
              placeholder="e.g. Settled for referred cycle treatments"
              value={settlementNotes}
              onChange={(e) => setSettlementNotes(e.target.value)}
              className="h-8 text-xs border-slate-300"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending || selectedInvoiceIds.length === 0 || totalAmount <= 0}
            onClick={handleSubmit}
            className="h-8 text-xs bg-teal-700 hover:bg-teal-800 text-white font-bold cursor-pointer"
          >
            {isPending ? 'Processing...' : `Confirm & Disburse ₹${totalAmount.toLocaleString('en-IN')}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
