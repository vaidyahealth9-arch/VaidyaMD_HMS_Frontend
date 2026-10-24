'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ipdApi, billingApi, walletApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  X,
  BedDouble,
  Calendar,
  Clock,
  IndianRupee,
  Wallet,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import PrintableInvoice from '@/components/common/PrintableInvoice';

interface IPDDischargeBillingModalProps {
  admissionId: string | null;
  onClose: () => void;
  onDischargeSuccess?: () => void;
}

interface BillItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function IPDDischargeBillingModal({
  admissionId,
  onClose,
  onDischargeSuccess,
}: IPDDischargeBillingModalProps) {
  const queryClient = useQueryClient();

  const [items, setItems] = useState<BillItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [walletDeduct, setWalletDeduct] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [newItemDesc, setNewItemDesc] = useState<string>('');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemPrice, setNewItemPrice] = useState<number>(0);

  // Receipt preview after settlement
  const [settledInvoice, setSettledInvoice] = useState<any | null>(null);

  // Fetch discharge tariff summary
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['ipd-discharge-summary', admissionId],
    queryFn: () => ipdApi.getDischargeSummary(admissionId!),
    enabled: !!admissionId,
  });

  // Fetch patient wallet balance
  const { data: walletData } = useQuery({
    queryKey: ['patient-wallet', summary?.patient_id],
    queryFn: () => walletApi.get(summary.patient_id),
    enabled: !!summary?.patient_id,
  });
  const walletBalance = Number(walletData?.balance || 0);

  // Initialize line items once summary loads
  useEffect(() => {
    if (summary?.items && Array.isArray(summary.items)) {
      setItems(
        summary.items.map((it: any) => ({
          description: it.description || 'Bed Charges',
          quantity: it.quantity || 1,
          unit_price: it.unit_price || 0,
          total_price: (it.quantity || 1) * (it.unit_price || 0),
        }))
      );
    }
  }, [summary]);

  if (!admissionId) return null;

  const subtotal = items.reduce((sum, it) => sum + it.total_price, 0);
  const rawNet = Math.max(0, subtotal - (Number(discount) || 0));
  const netPayable = Math.round(rawNet);
  const roundOff = Number((netPayable - rawNet).toFixed(2));
  const remainingDue = Math.max(0, netPayable - (Number(walletDeduct) || 0));

  const handleAddItem = () => {
    if (!newItemDesc.trim() || newItemPrice <= 0) {
      toast.error('Invalid Item', 'Enter valid item description and price');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        description: newItemDesc.trim(),
        quantity: newItemQty,
        unit_price: newItemPrice,
        total_price: newItemQty * newItemPrice,
      },
    ]);
    setNewItemDesc('');
    setNewItemQty(1);
    setNewItemPrice(0);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const dischargeAndSettleMutation = useMutation({
    mutationFn: async () => {
      if (!summary) throw new Error('Discharge summary not available');

      const effectivePaid = Math.round(paidAmount === '' ? remainingDue : Number(paidAmount));
      const splitPayments = [];

      if (walletDeduct > 0) {
        splitPayments.push({
          payment_method: 'wallet',
          amount: Math.round(walletDeduct),
          reference: 'IPD Discharge Wallet Advance Settlement',
        });
      }
      if (effectivePaid > 0) {
        splitPayments.push({
          payment_method: paymentMode.toLowerCase(),
          amount: effectivePaid,
          reference: paymentRef ? paymentRef.trim() : undefined,
        });
      }

      // 1. Create IPD final invoice via centralized BillingService
      const invoiceData = await billingApi.createInvoice({
        patient_id: summary.patient_id,
        source_module: 'ipd',
        source_reference_id: admissionId,
        appointment_source: 'IPD',
        items: items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
          total: it.total_price,
          service_code: 'IPD-ROOM',
          category: 'IPD',
        })),
        subtotal,
        discount,
        discount_reason: discountReason || undefined,
        tax: 0,
        round_off: roundOff,
        paid_amount: effectivePaid,
        payment_method: splitPayments.length > 0 ? 'split' : paymentMode.toLowerCase(),
        payment_status: remainingDue - effectivePaid <= 0 ? 'paid' : effectivePaid > 0 ? 'partially_paid' : 'pending',
        notes: `IPD Discharge Settlement for Admission #${summary.admission_id} (Bed ${summary.bed_number}, ${summary.stay_days} days)`,
        split_payments: splitPayments.length > 0 ? splitPayments : undefined,
      });

      // 2. Discharge inpatient with invoice_id linkage
      await ipdApi.dischargePatient(admissionId, {
        invoice_id: invoiceData.id,
        notes: `Discharged with Final Invoice #${invoiceData.invoice_number}`,
      });

      return invoiceData;
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['ipd-beds'] });
      queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
      queryClient.invalidateQueries({ queryKey: ['ipd-nursing-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      if (summary?.patient_id) {
        queryClient.invalidateQueries({ queryKey: ['patient-wallet', summary.patient_id] });
      }
      toast.success(
        'Discharged Successfully',
        `Patient ${summary?.patient_name} discharged. Final invoice #${invoice.invoice_number} generated.`
      );
      setSettledInvoice(invoice);
      if (onDischargeSuccess) onDischargeSuccess();
    },
    onError: (err: any) => {
      toast.error('Discharge Failed', err.message || 'Could not complete discharge settlement');
    },
  });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 my-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                <BedDouble className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Inpatient Discharge & Final Billing</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Review stay tariff, deduct advance wallet, and settle final account
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoadingSummary ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <div className="animate-spin w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full mx-auto mb-3" />
              Calculating bed occupancy tariff & stay summary...
            </div>
          ) : !summary ? (
            <div className="p-8 text-center text-red-500 text-sm">
              Failed to load discharge summary. Please close and try again.
            </div>
          ) : (
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Patient & Stay Overview Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Patient</p>
                  <p className="font-bold text-slate-900 text-sm">{summary.patient_name}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Bed Number</p>
                  <p className="font-bold text-purple-700 text-sm">{summary.bed_number || 'General'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Admission Period</p>
                  <p className="font-semibold text-slate-800">
                    {formatDate(summary.admission_date)} – Today
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Total Stay</p>
                  <Badge variant="purple" className="text-xs font-bold mt-0.5">
                    {summary.stay_days} {summary.stay_days === 1 ? 'Day' : 'Days'}
                  </Badge>
                </div>
              </div>

              {/* Itemized Charges Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Itemized Discharge Charges
                  </h4>
                  <span className="text-[11px] text-slate-500">{items.length} Line items</span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                  <div className="bg-slate-50 font-bold text-slate-700 px-3 py-2 flex items-center justify-between">
                    <span className="flex-1">Description</span>
                    <span className="w-16 text-center">Qty / Days</span>
                    <span className="w-24 text-right">Unit Rate</span>
                    <span className="w-24 text-right">Amount</span>
                    <span className="w-8"></span>
                  </div>

                  {items.map((it, idx) => (
                    <div key={idx} className="px-3 py-2 flex items-center justify-between hover:bg-slate-50/50">
                      <span className="flex-1 font-semibold text-slate-800 truncate pr-2">{it.description}</span>
                      <span className="w-16 text-center text-slate-600">{it.quantity}</span>
                      <span className="w-24 text-right text-slate-600">{formatCurrency(it.unit_price)}</span>
                      <span className="w-24 text-right font-bold text-slate-900">{formatCurrency(it.total_price)}</span>
                      <span className="w-8 text-right">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-400 hover:text-red-600 p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    </div>
                  ))}

                  {/* Add Extra Care / Procedure Item Row */}
                  <div className="p-2.5 bg-slate-50/70 flex items-center gap-2">
                    <Input
                      placeholder="Add procedure, nursing, or test charge..."
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                      className="h-7 text-xs flex-1 bg-white"
                    />
                    <Input
                      type="number"
                      min="1"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(Math.max(1, Number(e.target.value)))}
                      className="h-7 text-xs w-16 text-center bg-white"
                      title="Quantity"
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder="Price"
                      value={newItemPrice || ''}
                      onChange={(e) => setNewItemPrice(Math.max(0, Number(e.target.value)))}
                      className="h-7 text-xs w-24 text-right bg-white"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddItem}
                      className="h-7 px-2 text-xs font-semibold text-purple-700 border-purple-200 hover:bg-purple-50"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Patient Wallet Advance Deduction */}
              {walletBalance > 0 && (
                <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-900 font-bold">
                      <Wallet className="w-4 h-4 text-blue-600" />
                      <span>Patient Advance Wallet Available:</span>
                    </div>
                    <span className="font-extrabold text-blue-900 text-sm">{formatCurrency(walletBalance)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-blue-200/60">
                    <span className="text-[11px] text-blue-700 font-medium">
                      Apply from advance ledger toward discharge:
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max={Math.min(walletBalance, netPayable)}
                        value={walletDeduct || ''}
                        onChange={(e) =>
                          setWalletDeduct(Math.min(walletBalance, Math.max(0, Number(e.target.value))))
                        }
                        placeholder="0"
                        className="h-7 w-24 text-xs text-right bg-white border-blue-300 font-bold"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setWalletDeduct(walletDeduct > 0 ? 0 : Math.min(walletBalance, netPayable))
                        }
                        className="h-7 px-2.5 text-xs font-bold border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        {walletDeduct > 0 ? 'Clear' : 'Use Full Advance'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Totals & Settlement Calculation */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Gross Hospital Charges:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Discharge Concession / Discount (₹):</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Concession reason"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      className="h-7 text-xs w-36 bg-white"
                    />
                    <Input
                      type="number"
                      min="0"
                      max={subtotal}
                      value={discount || ''}
                      onChange={(e) => setDiscount(Math.min(subtotal, Math.max(0, Number(e.target.value))))}
                      placeholder="0"
                      className="h-7 text-xs w-24 text-right bg-white font-bold"
                    />
                  </div>
                </div>

                {roundOff !== 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Round Off:</span>
                    <span className="font-mono font-medium">
                      {roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm font-bold border-t border-slate-200 pt-2 text-slate-900">
                  <span>Net Billed Amount:</span>
                  <span className="text-purple-700">{formatCurrency(netPayable)}</span>
                </div>

                {walletDeduct > 0 && (
                  <div className="flex justify-between items-center text-blue-700 font-medium">
                    <span>Wallet Advance Deduction:</span>
                    <span>- {formatCurrency(walletDeduct)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Balance Counter Payable:</span>
                  <span className="text-emerald-700 font-extrabold">{formatCurrency(remainingDue)}</span>
                </div>

                {/* Counter Tender Collection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Settlement Tender Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full h-8 px-2.5 rounded border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="Net Banking">Net Banking / NEFT</option>
                      <option value="Insurance">Insurance / TPA</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Counter Amount Received (₹)</label>
                    <Input
                      type="number"
                      min="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={remainingDue.toString()}
                      className="h-8 text-xs font-bold text-emerald-800 bg-emerald-50/50 border-emerald-300 text-right"
                    />
                  </div>
                </div>

                {paymentMode !== 'Cash' && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-500 flex-shrink-0">Payment Ref / Txn ID:</span>
                    <Input
                      type="text"
                      placeholder="e.g. UTR / Approval No"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="h-7 text-xs bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="h-9 px-4 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => dischargeAndSettleMutation.mutate()}
                  disabled={dischargeAndSettleMutation.isPending}
                  className="h-9 px-6 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white gap-2 shadow-sm"
                >
                  {dischargeAndSettleMutation.isPending ? (
                    'Processing Discharge & Settlement...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Discharge & Settle Account</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post-Discharge Invoice Receipt Modal */}
      {settledInvoice && (
        <PrintableInvoice
          invoice={{
            ...settledInvoice,
            patient_name: summary?.patient_name,
          }}
          defaultLayout="a4"
          onClose={() => {
            setSettledInvoice(null);
            onClose();
          }}
        />
      )}
    </>
  );
}
