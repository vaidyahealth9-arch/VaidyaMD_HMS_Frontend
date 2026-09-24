'use client';

import { useState, useEffect } from 'react';
import { billingApi, patientsApi, patientPackagesApi, walletApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/shared/ui/sheet';
import Spinner from '@/components/common/Spinner';
import SectionLabel from '@/components/common/SectionLabel';
import PatientSearchDropdown from './PatientSearchDropdown';
import InvoiceLineItemsEditor from './InvoiceLineItemsEditor';
import type {
  Invoice,
  LineItem,
  BillingPatient,
  ServiceCatalogItem,
  PatientPackage,
  DiscountType,
  PaymentMode,
} from '@/features/billing/types';

const APPOINTMENT_SOURCES = [
  'OP', 'Lab', 'Scan', 'IVF-Theatre', 'GYN-Theatre', 'IUI',
  'Nurse', 'Counselling', 'Andrology/Embryology', 'Package', 'Yoga', 'Cosgyn',
];

const UPI_MODES = ['GPay', 'PhonePe', 'Paytm', 'BHIM', 'NEFT', 'Other'];

interface NewInvoiceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (invoice: Invoice) => void;
  /** Pre-fill and lock patient (from patient profile context) */
  defaultPatientId?: string;
  lockedPatient?: boolean;
  /** Pre-fill department source */
  defaultSource?: string;
  /** Pre-fill line items (from package context) */
  defaultItems?: LineItem[];
  defaultDiscount?: number;
  defaultDiscountType?: DiscountType;
}

/**
 * New Invoice slide-in sheet — single source for invoice creation.
 * Previously duplicated between billing/page.tsx and cosgyn/page.tsx
 * (~300 lines each).
 *
 * Context-aware via props:
 *  - From billing page: no defaultPatient, full patient picker
 *  - From patient profile: lockedPatient=true, patient pre-filled
 *  - From cosgyn page: defaultSource='Cosgyn', items pre-filled
 *
 * Usage:
 *   <NewInvoiceSheet
 *     isOpen={showNewInvoice}
 *     onClose={() => setShowNewInvoice(false)}
 *     onSuccess={(inv) => { loadData(); }}
 *     defaultSource="Cosgyn"
 *     defaultPatientId={plan.patient_id}
 *     lockedPatient
 *   />
 */
export default function NewInvoiceSheet({
  isOpen,
  onClose,
  onSuccess,
  defaultPatientId = '',
  lockedPatient = false,
  defaultSource = 'OP',
  defaultItems,
  defaultDiscount = 0,
  defaultDiscountType = 'amount',
}: NewInvoiceSheetProps) {

  // Patient state
  const [patients, setPatients] = useState<BillingPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatientId);
  const [walletBalance, setWalletBalance] = useState(0);
  const [activePackages, setActivePackages] = useState<PatientPackage[]>([]);

  // Invoice fields
  const [source, setSource] = useState(defaultSource);
  const [reasonForAttendance, setReasonForAttendance] = useState('');
  const [items, setItems] = useState<LineItem[]>(
    defaultItems ?? [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
  );
  const [itemSearches, setItemSearches] = useState<string[]>(
    defaultItems ? defaultItems.map((i) => i.description) : [''],
  );
  const [itemDropdowns, setItemDropdowns] = useState<boolean[]>(
    defaultItems ? defaultItems.map(() => false) : [false],
  );
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>([]);

  // Billing
  const [discountType, setDiscountType] = useState<DiscountType>(defaultDiscountType);
  const [discountValue, setDiscountValue] = useState(defaultDiscount);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [upiPayMode, setUpiPayMode] = useState('GPay');
  const [immediatePaid, setImmediatePaid] = useState(0);
  const [walletDeduction, setWalletDeduction] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Load patients + catalog on mount
  useEffect(() => {
    if (!isOpen) return;
    patientsApi.list({ per_page: 500 }).then((d: any) => setPatients(d?.patients || d?.items || []));
    billingApi.getServiceCatalog().catch(() => []).then((d: any) => setServiceCatalog(d || []));
    // Reset form state
    setSelectedPatientId(defaultPatientId);
    setSource(defaultSource);
    setReasonForAttendance('');
    setItems(defaultItems ?? [{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
    setItemSearches(defaultItems ? defaultItems.map((i) => i.description) : ['']);
    setItemDropdowns(defaultItems ? defaultItems.map(() => false) : [false]);
    setDiscountType(defaultDiscountType);
    setDiscountValue(defaultDiscount);
    setPaymentStatus('paid');
    setPaymentMode('upi');
    setUpiPayMode('GPay');
    setImmediatePaid(0);
    setWalletDeduction(0);
  }, [isOpen]);

  // Load wallet + packages when patient changes
  useEffect(() => {
    if (!selectedPatientId) { setWalletBalance(0); setActivePackages([]); return; }
    walletApi.get(selectedPatientId).then((w: any) => setWalletBalance(Number(w?.balance ?? 0))).catch(() => {});
    patientPackagesApi.listByPatient(selectedPatientId)
      .then((pkgs: any[]) => setActivePackages(pkgs?.filter((p: any) => p.status === 'active') || []))
      .catch(() => {});
  }, [selectedPatientId]);

  // Calculations
  const subtotal = items.reduce((s, it) => s + (it.total || 0), 0);
  const discountAmt = discountType === 'percentage'
    ? Math.round((subtotal * discountValue) / 100)
    : discountValue;
  const grandTotal = Math.max(0, subtotal - discountAmt);
  const pendingDue = Math.max(0, grandTotal - immediatePaid - walletDeduction);

  const handleSubmit = async () => {
    if (!selectedPatientId) {
      toast.error('Patient Required', 'Please select a patient.');
      return;
    }
    const validItems = items.filter((it) => it.description?.trim());
    if (validItems.length === 0) {
      toast.error('No Items', 'Add at least one billable service.');
      return;
    }
    setIsSaving(true);
    try {
      const invoice = await billingApi.createInvoice({
        patient_id: selectedPatientId,
        appointment_source: source,
        reason_for_attendance: reasonForAttendance || undefined,
        items: validItems,
        discount: discountAmt,
        discount_type: discountType,
        discount_value: discountValue,
        payment_status: paymentStatus,
        payment_mode: paymentMode === 'upi' ? (upiPayMode || 'UPI') : paymentMode,
        upi_pay_mode: paymentMode === 'upi' ? upiPayMode : undefined,
        paid_amount: paymentStatus === 'paid' ? grandTotal : immediatePaid || undefined,
        wallet_amount_used: walletDeduction || undefined,
        wallet_deduction: walletDeduction || undefined,
      });
      toast.success('Invoice Created', `Invoice ${invoice.invoice_number} created.`);
      onSuccess(invoice as Invoice);
      onClose();
    } catch (err: any) {
      toast.error('Failed', err.message || 'Could not create invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <SheetTitle>Generate New Invoice</SheetTitle>
          <p className="text-xs text-slate-500">Create a new invoice for services rendered</p>
        </SheetHeader>

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
              <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
                💳 Wallet Balance: ₹{walletBalance.toLocaleString()}
              </p>
            )}
          </div>

          {/* Source + Reason */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <SectionLabel htmlFor="inv-source">Department / Source</SectionLabel>
              <select
                id="inv-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="vmd-input text-xs w-full"
              >
                {APPOINTMENT_SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <SectionLabel htmlFor="inv-reason">Reason for Attendance</SectionLabel>
              <input
                id="inv-reason"
                type="text"
                value={reasonForAttendance}
                onChange={(e) => setReasonForAttendance(e.target.value)}
                placeholder="e.g. OPU Retrieval, Follicular Scan…"
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
              onChange={(i, s, d) => { setItems(i); setItemSearches(s); setItemDropdowns(d); }}
            />
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <SectionLabel>Discount Type</SectionLabel>
              <div className="flex gap-2">
                {(['amount', 'percentage'] as DiscountType[]).map((dt) => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setDiscountType(dt)}
                    className={cn(
                      'flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all',
                      discountType === dt
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary/30',
                    )}
                  >
                    {dt === 'amount' ? '₹ Amount' : '% Percent'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <SectionLabel htmlFor="inv-disc">Discount Value</SectionLabel>
              <input
                id="inv-disc"
                type="number"
                min={0}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="vmd-input text-xs w-full"
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-bold font-mono">₹{subtotal.toLocaleString()}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount</span>
                <span className="font-bold font-mono">− ₹{discountAmt.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-1.5 border-t border-slate-200">
              <span className="font-bold text-slate-800">Grand Total</span>
              <span className="font-extrabold font-mono text-slate-900 text-sm">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <div>
              <SectionLabel>Payment Status</SectionLabel>
              <div className="flex gap-2">
                {[{ v: 'paid' as const, l: 'Paid in Full' }, { v: 'pending' as const, l: 'Bill Later (Pending)' }].map(({ v, l }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPaymentStatus(v)}
                    className={cn(
                      'flex-1 py-2 text-xs font-bold rounded-lg border transition-all',
                      paymentStatus === v
                        ? v === 'paid' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {paymentStatus === 'paid' && (
              <div>
                <SectionLabel htmlFor="pay-mode-inv">Payment Method</SectionLabel>
                <select
                  id="pay-mode-inv"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="vmd-input text-xs w-full"
                >
                  <option value="upi">UPI / QR Code</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
                {paymentMode === 'upi' && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {UPI_MODES.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setUpiPayMode(m)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                          upiPayMode === m
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-slate-600 border-slate-200',
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {paymentStatus === 'pending' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <SectionLabel htmlFor="immediate-paid">Immediate Payment (₹)</SectionLabel>
                  <input
                    id="immediate-paid"
                    type="number" min={0} value={immediatePaid}
                    onChange={(e) => setImmediatePaid(Number(e.target.value))}
                    className="vmd-input text-xs w-full"
                  />
                </div>
                {walletBalance > 0 && (
                  <div>
                    <SectionLabel htmlFor="wallet-deduct">Wallet Deduction (₹)</SectionLabel>
                    <input
                      id="wallet-deduct"
                      type="number" min={0} max={walletBalance}
                      value={walletDeduction}
                      onChange={(e) => setWalletDeduction(Number(e.target.value))}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        <SheetFooter className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 py-2.5 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSaving && <Spinner size="xs" variant="white" />}
            {isSaving ? 'Creating…' : `Create Invoice — ₹${grandTotal.toLocaleString()}`}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
