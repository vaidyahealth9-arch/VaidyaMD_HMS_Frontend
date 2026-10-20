'use client';

import React, { useState, useEffect } from 'react';
import { billingApi, patientsApi, patientPackagesApi, walletApi, pharmacyApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/shared/ui/sheet';
import Spinner from '@/components/common/Spinner';
import SectionLabel from '@/components/common/SectionLabel';
import PatientSearchDropdown from './PatientSearchDropdown';
import InvoiceLineItemsEditor from './InvoiceLineItemsEditor';
import ReceiptModal from './ReceiptModal';
import {
  Receipt,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Printer,
  CreditCard,
  Building2,
  FlaskConical,
  Pill,
  BedDouble,
  Stethoscope,
} from 'lucide-react';
import type {
  Invoice,
  LineItem,
  BillingPatient,
  ServiceCatalogItem,
  PatientPackage,
  DiscountType,
  PaymentMode,
  SplitPaymentTender,
} from '@/features/billing/types';

const SOURCE_OPTIONS = [
  { id: 'opd', label: 'OPD / Consultation', icon: Stethoscope },
  { id: 'ipd', label: 'IPD / Inpatient', icon: BedDouble },
  { id: 'pharmacy', label: 'Pharmacy / POS', icon: Pill },
  { id: 'lims', label: 'LIMS / Laboratory', icon: FlaskConical },
  { id: 'fertility', label: 'IVF / Fertility Lab', icon: Building2 },
  { id: 'cosgyn', label: 'CosGyn / Aesthetics', icon: SparklesIcon },
  { id: 'package', label: 'Package Enrollment', icon: CreditCard },
  { id: 'general', label: 'Central Cashier', icon: Receipt },
];

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

const UPI_MODES = ['GPay', 'PhonePe', 'Paytm', 'BHIM', 'NEFT', 'Other'];

export interface UniversalBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (invoice: Invoice) => void;
  patientId?: string;
  lockedPatient?: boolean;
  sourceModule?: string;
  sourceReferenceId?: string;
  defaultReason?: string;
  defaultItems?: LineItem[];
  defaultDiscount?: number;
  defaultDiscountType?: DiscountType;
  defaultPaymentStatus?: 'paid' | 'pending';
  packageId?: string;
}

export default function UniversalBillingModal({
  isOpen,
  onClose,
  onSuccess,
  patientId = '',
  lockedPatient = false,
  sourceModule = 'opd',
  sourceReferenceId,
  defaultReason = '',
  defaultItems,
  defaultDiscount = 0,
  defaultDiscountType = 'amount',
  defaultPaymentStatus = 'paid',
  packageId,
}: UniversalBillingModalProps) {
  // Patient state
  const [patients, setPatients] = useState<BillingPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(patientId);
  const [walletBalance, setWalletBalance] = useState(0);
  const [activePackages, setActivePackages] = useState<PatientPackage[]>([]);

  // Invoice fields
  const [source, setSource] = useState(sourceModule.toLowerCase());
  const [reasonForAttendance, setReasonForAttendance] = useState(defaultReason);
  const [items, setItems] = useState<LineItem[]>(
    defaultItems && defaultItems.length > 0
      ? defaultItems
      : [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
  );
  const [itemSearches, setItemSearches] = useState<string[]>(
    defaultItems ? defaultItems.map((i) => i.description) : [''],
  );
  const [itemDropdowns, setItemDropdowns] = useState<boolean[]>(
    defaultItems ? defaultItems.map(() => false) : [false],
  );
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>([]);

  // Discount & Payment
  const [discountType, setDiscountType] = useState<DiscountType>(defaultDiscountType);
  const [discountValue, setDiscountValue] = useState(defaultDiscount);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>(defaultPaymentStatus);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [upiPayMode, setUpiPayMode] = useState('GPay');
  const [paymentRef, setPaymentRef] = useState('');
  const [immediatePaid, setImmediatePaid] = useState(0);
  const [walletDeduction, setWalletDeduction] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Split payments state
  const [useSplitPayment, setUseSplitPayment] = useState(false);
  const [splitTenders, setSplitTenders] = useState<SplitPaymentTender[]>([
    { payment_method: 'cash', amount: 0 },
    { payment_method: 'upi', upi_pay_mode: 'GPay', amount: 0 },
  ]);

  // Generated receipt preview
  const [createdInvoiceForReceipt, setCreatedInvoiceForReceipt] = useState<Invoice | null>(null);

  // Sync inputs on open or prop changes
  useEffect(() => {
    if (!isOpen) return;
    patientsApi.list({ per_page: 500 }).then((d: any) => setPatients(d?.patients || d?.items || []));
    billingApi.getServiceCatalog().catch(() => []).then((d: any) => setServiceCatalog(d || []));

    setSelectedPatientId(patientId);
    setSource(sourceModule.toLowerCase());
    setReasonForAttendance(defaultReason);
    if (defaultItems && defaultItems.length > 0) {
      setItems(defaultItems);
      setItemSearches(defaultItems.map((i) => i.description));
      setItemDropdowns(defaultItems.map(() => false));
    } else {
      setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
      setItemSearches(['']);
      setItemDropdowns([false]);
    }
    setDiscountValue(defaultDiscount);
    setDiscountType(defaultDiscountType);
    setPaymentStatus(defaultPaymentStatus);
    setWalletDeduction(0);
    setUseSplitPayment(false);
    setPaymentRef('');
  }, [isOpen, patientId, sourceModule, defaultReason, defaultItems, defaultDiscount, defaultDiscountType, defaultPaymentStatus]);

  // Fetch patient wallet & packages when patient changes
  useEffect(() => {
    if (!selectedPatientId) {
      setWalletBalance(0);
      setActivePackages([]);
      return;
    }
    walletApi
      .get(selectedPatientId)
      .then((w: any) => setWalletBalance(Number(w?.balance || 0)))
      .catch(() => setWalletBalance(0));

    patientPackagesApi
      .listByPatient(selectedPatientId)
      .then((pkgs: any[]) => setActivePackages(pkgs?.filter((p: any) => p.status === 'active') || []))
      .catch(() => setActivePackages([]));
  }, [selectedPatientId]);

  // Calculations
  const subtotal = items.reduce((s, it) => s + (it.total || 0), 0);
  const discountAmt =
    discountType === 'percentage' ? Math.round((subtotal * discountValue) / 100) : discountValue;
  const grandTotal = Math.max(0, subtotal - discountAmt);
  const netDueAfterWallet = Math.max(0, grandTotal - walletDeduction);

  const handleApplyFullWallet = () => {
    if (walletDeduction > 0) {
      setWalletDeduction(0);
    } else {
      setWalletDeduction(Math.min(walletBalance, grandTotal));
    }
  };

  const handleAddSplitTender = () => {
    setSplitTenders([
      ...splitTenders,
      { payment_method: 'cash', amount: 0 },
    ]);
  };

  const handleRemoveSplitTender = (idx: number) => {
    setSplitTenders(splitTenders.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!selectedPatientId) {
      toast.error('Patient Required', 'Please select a registered patient before generating an invoice.');
      return;
    }
    const validItems = items.filter((it) => it.description?.trim());
    if (validItems.length === 0) {
      toast.error('No Billable Items', 'Please add at least one billable service or item.');
      return;
    }

    setIsSaving(true);
    try {
      const normalizedItems = validItems.map((it) => ({
        description: it.description.trim(),
        quantity: it.quantity || 1,
        unit_price: it.unit_price || 0,
        total: it.total || (it.quantity || 1) * (it.unit_price || 0),
        service_code: it.service_code || undefined,
        patient_package_id: it.patient_package_id || undefined,
        package_item_id: it.package_item_id || undefined,
      }));

      let splitPayload: any[] | undefined = undefined;
      if (useSplitPayment) {
        splitPayload = [];
        if (walletDeduction > 0) {
          splitPayload.push({
            payment_method: 'wallet',
            amount: walletDeduction,
            notes: 'Advance wallet deduction',
          });
        }
        for (const st of splitTenders) {
          if (st.amount > 0) {
            splitPayload.push({
              payment_method: st.payment_method,
              upi_pay_mode: st.upi_pay_mode || undefined,
              amount: st.amount,
              reference: st.reference || undefined,
              notes: st.notes || undefined,
            });
          }
        }
      }

      const effectivePaid =
        paymentStatus === 'paid'
          ? grandTotal
          : immediatePaid > 0
          ? immediatePaid + walletDeduction
          : walletDeduction;

      let combinedNotes = reasonForAttendance ? `Attendance: ${reasonForAttendance}` : '';
      if (paymentRef.trim()) {
        combinedNotes = combinedNotes ? `${combinedNotes} | Ref: ${paymentRef.trim()}` : `Ref: ${paymentRef.trim()}`;
      }

      let invoice: any;
      if (source === 'pharmacy' && normalizedItems.some((it) => it.service_code)) {
        const dispenseRes = await pharmacyApi.dispenseFEFO({
          patient_id: selectedPatientId,
          items: normalizedItems.map((it) => ({
            item_code: it.service_code || it.description,
            quantity: it.quantity,
          })),
          discount: discountAmt,
          wallet_amount_used: walletDeduction,
          amount_paid: effectivePaid,
          payment_method: useSplitPayment ? 'split' : paymentMode,
          payment_ref: paymentRef.trim() || undefined,
          upi_pay_mode: paymentMode === 'upi' ? upiPayMode : undefined,
          split_payments: splitPayload,
          notes: combinedNotes || undefined,
        });

        invoice = {
          id: dispenseRes.invoice_id,
          invoice_number: dispenseRes.invoice_number,
          patient_id: selectedPatientId,
          patient_name: dispenseRes.patient_name,
          patient_mrn: dispenseRes.patient_mrn || dispenseRes.patient_vid,
          patient_vid: dispenseRes.patient_vid || dispenseRes.patient_mrn,
          patient_age: dispenseRes.patient_age,
          patient_gender: dispenseRes.patient_gender,
          patient_address: dispenseRes.patient_address,
          patient_phone: dispenseRes.patient_phone,
          appointment_source: 'Pharmacy',
          source_module: 'pharmacy',
          reason_for_attendance: reasonForAttendance || 'Point of Sale Pharmacy Dispense',
          items: (dispenseRes.dispensed_batches || []).map((b: any) => ({
            description: `${b.item_name} (Batch: ${b.batch_number})`,
            quantity: b.quantity_dispensed,
            unit_price: b.unit_price,
            total: b.total_price,
            service_code: b.item_code,
          })),
          subtotal: dispenseRes.subtotal,
          discount: dispenseRes.discount,
          total_amount: dispenseRes.total_amount,
          paid_amount: dispenseRes.paid_amount,
          payment_method: dispenseRes.payment_method,
          status: dispenseRes.invoice_status || 'paid',
          created_at: dispenseRes.created_at,
        };
      } else {
        invoice = await billingApi.createInvoice({
          patient_id: selectedPatientId,
          source_module: source,
          source_reference_id: sourceReferenceId || undefined,
          package_id: packageId || undefined,
          appointment_source: source.toUpperCase(),
          reason_for_attendance: reasonForAttendance || undefined,
          items: normalizedItems,
          discount: discountAmt,
          discount_type: discountType,
          discount_value: discountValue,
          payment_status: paymentStatus,
          payment_method: useSplitPayment ? 'split' : paymentMode,
          upi_pay_mode: paymentMode === 'upi' ? upiPayMode : undefined,
          paid_amount: effectivePaid,
          wallet_amount_used: walletDeduction || undefined,
          wallet_deduction: walletDeduction || undefined,
          split_payments: splitPayload,
          notes: combinedNotes || undefined,
        });
      }

      const matchedPat = patients.find((p) => p.id === selectedPatientId);
      const enrichedInvoice: Invoice = {
        ...(invoice as Invoice),
        patient_name: invoice.patient_name || matchedPat?.name,
        patient_vid: invoice.patient_vid || matchedPat?.vid,
        patient_mrn: invoice.patient_mrn || matchedPat?.mrn || matchedPat?.vid,
        patient_age: invoice.patient_age ?? matchedPat?.age,
        patient_gender: invoice.patient_gender || matchedPat?.gender,
        patient_address: invoice.patient_address || matchedPat?.address,
        patient_phone: invoice.patient_phone || matchedPat?.phone,
      };

      toast.success(
        'Invoice Created',
        `Invoice #${invoice.invoice_number} generated successfully for ₹${grandTotal.toLocaleString()}.`
      );

      if (onSuccess) {
        onSuccess(enrichedInvoice);
      }
      setCreatedInvoiceForReceipt(enrichedInvoice);
    } catch (err: any) {
      toast.error('Invoice Creation Failed', err.message || 'Could not create invoice');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto flex flex-col gap-0 p-0 bg-white">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="text-slate-900 font-bold text-base">Universal Hospital Billing</SheetTitle>
                <p className="text-xs text-slate-500 font-medium">
                  Unified checkout for OPD, IPD, Pharmacy, LIMS & Procedure Packages
                </p>
              </div>
            </div>
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Patient Selector */}
            <div>
              <SectionLabel>Patient</SectionLabel>
              <PatientSearchDropdown
                patients={patients}
                value={selectedPatientId}
                onChange={(id) => setSelectedPatientId(id)}
                disabled={lockedPatient}
              />
              {walletBalance > 0 && (
                <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-700" />
                    <div>
                      <span className="font-bold text-emerald-950">Advance Balance: </span>
                      <span className="font-mono font-bold text-emerald-700">₹{walletBalance.toLocaleString()}</span>
                      {walletDeduction > 0 && (
                        <span className="ml-2 text-emerald-800 font-semibold">(Applying ₹{walletDeduction.toLocaleString()})</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyFullWallet}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-xs transition-colors"
                  >
                    {walletDeduction > 0 ? 'Clear Wallet' : `Use Advance (₹${Math.min(walletBalance, grandTotal).toLocaleString()})`}
                  </button>
                </div>
              )}
            </div>

            {/* Department Source & Reason */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <SectionLabel htmlFor="billing-source">Department / Source</SectionLabel>
                <select
                  id="billing-source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="vmd-input text-xs w-full"
                >
                  {SOURCE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <SectionLabel htmlFor="billing-reason">Reason / Clinical Context</SectionLabel>
                <input
                  id="billing-reason"
                  type="text"
                  value={reasonForAttendance}
                  onChange={(e) => setReasonForAttendance(e.target.value)}
                  placeholder="e.g. Inpatient Stay, OPU Retrieval, Lab Panel…"
                  className="vmd-input text-xs w-full"
                />
              </div>
            </div>

            {/* Line Items Editor */}
            <div className="pt-2 border-t border-slate-100">
              <InvoiceLineItemsEditor
                items={items}
                itemSearches={itemSearches}
                itemDropdowns={itemDropdowns}
                serviceCatalog={serviceCatalog}
                activePackages={activePackages}
                onChange={(i, s, d) => {
                  setItems(i);
                  setItemSearches(s);
                  setItemDropdowns(d);
                }}
              />
            </div>

            {/* Discount Section */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Subtotal</span>
                <span className="font-mono font-bold text-slate-800">₹{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-medium flex-1">Apply Discount:</span>
                <div className="flex rounded-lg overflow-hidden border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setDiscountType('amount')}
                    className={cn(
                      'px-2.5 py-1 font-bold transition-colors',
                      discountType === 'amount' ? 'bg-primary text-white' : 'bg-white text-slate-600'
                    )}
                  >
                    ₹ Flat
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={cn(
                      'px-2.5 py-1 font-bold transition-colors',
                      discountType === 'percentage' ? 'bg-primary text-white' : 'bg-white text-slate-600'
                    )}
                  >
                    % Percent
                  </button>
                </div>
                <input
                  type="number"
                  min={0}
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  placeholder="0"
                  className="vmd-input text-xs w-24 text-right"
                />
              </div>

              {discountAmt > 0 && (
                <div className="flex items-center justify-between text-xs text-amber-700">
                  <span>Discount Applied:</span>
                  <span className="font-mono font-bold">-₹{discountAmt.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-sm">
                <span className="text-slate-900">Total Net Amount</span>
                <span className="text-primary font-mono text-base">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment & Settlement Panel */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <SectionLabel>Payment Settlement</SectionLabel>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('paid')}
                    className={cn(
                      'py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2',
                      paymentStatus === 'paid'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Immediate Settlement (Full)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('pending')}
                    className={cn(
                      'py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2',
                      paymentStatus === 'pending'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Bill / Deferred (Pending/Partial)
                  </button>
                </div>
              </div>

              {/* Multi-tender / Split option */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <span className="font-bold text-slate-800">Split Payment / Multiple Modes</span>
                  <p className="text-[11px] text-slate-500">Settle using multiple tenders (e.g. part Cash + part UPI)</p>
                </div>
                <input
                  type="checkbox"
                  checked={useSplitPayment}
                  onChange={(e) => setUseSplitPayment(e.target.checked)}
                  className="w-4 h-4 text-primary rounded"
                />
              </div>

              {!useSplitPayment ? (
                <>
                  {paymentStatus === 'paid' && (
                    <div className="space-y-3">
                      <div>
                        <SectionLabel htmlFor="universal-pay-mode">Payment Method</SectionLabel>
                        <select
                          id="universal-pay-mode"
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                          className="vmd-input text-xs w-full"
                        >
                          <option value="upi">UPI / QR Code</option>
                          <option value="cash">Cash</option>
                          <option value="card">Card (Debit / Credit)</option>
                          <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                          <option value="cheque">Cheque</option>
                          <option value="wallet">Patient Advance Wallet</option>
                        </select>
                      </div>

                      {paymentMode === 'upi' && (
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
                                  : 'bg-white text-slate-600 border-slate-200'
                              )}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      )}

                      <div>
                        <SectionLabel htmlFor="universal-pay-ref">Transaction / Reference ID (Optional)</SectionLabel>
                        <input
                          id="universal-pay-ref"
                          type="text"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          placeholder="e.g. UPI Ref # or Card Slip #"
                          className="vmd-input text-xs w-full"
                        />
                      </div>
                    </div>
                  )}

                  {paymentStatus === 'pending' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <SectionLabel htmlFor="immediate-paid-input">Initial Tender Collected (₹)</SectionLabel>
                        <input
                          id="immediate-paid-input"
                          type="number"
                          min={0}
                          value={immediatePaid || ''}
                          onChange={(e) => setImmediatePaid(Number(e.target.value))}
                          placeholder="0"
                          className="vmd-input text-xs w-full"
                        />
                      </div>
                      <div>
                        <SectionLabel>Balance Remaining</SectionLabel>
                        <div className="vmd-input text-xs w-full bg-slate-50 flex items-center font-mono font-bold text-amber-700">
                          ₹{Math.max(0, grandTotal - immediatePaid - walletDeduction).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Split Tender Breakdown</span>
                    <button
                      type="button"
                      onClick={handleAddSplitTender}
                      className="text-primary hover:text-primary/80 flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Mode
                    </button>
                  </div>

                  {splitTenders.map((tender, idx) => (
                    <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <select
                          value={tender.payment_method}
                          onChange={(e) => {
                            const updated = [...splitTenders];
                            updated[idx].payment_method = e.target.value as PaymentMode;
                            setSplitTenders(updated);
                          }}
                          className="vmd-input text-xs flex-1"
                        >
                          <option value="cash">Cash</option>
                          <option value="upi">UPI / QR Code</option>
                          <option value="card">Card (POS)</option>
                          <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                          <option value="cheque">Cheque</option>
                        </select>
                        {tender.payment_method === 'upi' && (
                          <select
                            value={tender.upi_pay_mode || 'GPay'}
                            onChange={(e) => {
                              const updated = [...splitTenders];
                              updated[idx].upi_pay_mode = e.target.value;
                              setSplitTenders(updated);
                            }}
                            className="vmd-input text-xs w-28"
                          >
                            <option value="GPay">GPay</option>
                            <option value="PhonePe">PhonePe</option>
                            <option value="Paytm">Paytm</option>
                            <option value="BHIM">BHIM</option>
                            <option value="QR">Bank QR</option>
                          </select>
                        )}
                        <input
                          type="number"
                          min={0}
                          value={tender.amount || ''}
                          onChange={(e) => {
                            const updated = [...splitTenders];
                            updated[idx].amount = Number(e.target.value);
                            setSplitTenders(updated);
                          }}
                          placeholder="Amount ₹"
                          className="vmd-input text-xs w-28 text-right font-bold text-slate-900"
                        />
                        {splitTenders.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSplitTender(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Remove Tender"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {/* Transaction / Reference ID input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tender.reference || ''}
                          onChange={(e) => {
                            const updated = [...splitTenders];
                            updated[idx].reference = e.target.value;
                            setSplitTenders(updated);
                          }}
                          placeholder={
                            tender.payment_method === 'upi'
                              ? 'UPI Ref / UTR / Txn ID (e.g. 429182910281)'
                              : tender.payment_method === 'card'
                              ? 'Card Approval / Auth Code / Last 4 digits'
                              : tender.payment_method === 'cheque'
                              ? 'Cheque No. & Bank Name'
                              : tender.payment_method === 'bank_transfer'
                              ? 'NEFT / RTGS Transfer Reference'
                              : 'Tender Note / Reference ID (Optional)'
                          }
                          className="vmd-input text-xs flex-1 bg-slate-50 text-slate-700 py-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <SheetFooter className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1 py-2.5 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm transition-colors"
            >
              {isSaving && <Spinner size="xs" variant="white" />}
              {isSaving ? 'Processing Invoice…' : `Create Invoice — ₹${grandTotal.toLocaleString()}`}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Instant Print / View Receipt Modal */}
      {createdInvoiceForReceipt && (
        <ReceiptModal
          isOpen={!!createdInvoiceForReceipt}
          invoice={createdInvoiceForReceipt}
          onClose={() => {
            setCreatedInvoiceForReceipt(null);
            onClose();
          }}
        />
      )}
    </>
  );
}
