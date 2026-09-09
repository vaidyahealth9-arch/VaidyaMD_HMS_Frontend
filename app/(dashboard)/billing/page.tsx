'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { billingApi, patientsApi, walletApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/contexts/ToastContext';
import { Printer, X, Building2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pending: 'bg-rose-100 text-rose-800 border-rose-200',
  partially_paid: 'bg-blue-100 text-blue-800 border-blue-200',
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  cancelled: 'bg-slate-100 text-slate-400 border-slate-200',
};

const appointmentSources = [
  'Andrology/Embryology', 'Counselling', 'GYN-Theatre', 'IUI',
  'IVF-Theatre', 'Lab', 'Nurse', 'OP', 'Package', 'Scan', 'Yoga'
];

export const TARIFF_CATALOG = [
  // Consultations & OPD
  { category: 'Consultation', code: 'OPD-001', description: 'Senior Infertility Specialist Consultation', price: 1500 },
  { category: 'Consultation', code: 'OPD-002', description: 'Routine Gynec Consultation / Follow-up', price: 800 },
  { category: 'Consultation', code: 'OPD-003', description: 'Andrology / Male Fertility Consultation', price: 1200 },
  { category: 'Consultation', code: 'OPD-004', description: 'Clinical Diet & Nutrition Counseling', price: 600 },
  // Diagnostics & Scans
  { category: 'Scans', code: 'USG-001', description: 'Pelvic Ultrasound TVS (Baseline)', price: 1500 },
  { category: 'Scans', code: 'USG-002', description: 'Follicular Monitoring Scan (Single Sitting)', price: 800 },
  { category: 'Scans', code: 'USG-003', description: 'Complete Follicular Tracking Package (6 Scans)', price: 4000 },
  { category: 'Scans', code: 'USG-004', description: 'Early Pregnancy Viability / Dating Scan', price: 1800 },
  { category: 'Scans', code: 'USG-005', description: 'Color Doppler Pelvis / Uterine Artery', price: 2500 },
  // Laboratory & Andrology
  { category: 'Lab', code: 'AND-001', description: 'CASA Semen Analysis (WHO 6th Edition)', price: 1200 },
  { category: 'Lab', code: 'AND-002', description: 'Sperm DNA Fragmentation Index (DFI)', price: 3500 },
  { category: 'Lab', code: 'AND-003', description: 'Semen Freezing & Vitrification (1 Year)', price: 8000 },
  { category: 'Lab', code: 'LAB-001', description: 'Serum AMH (Anti-Mullerian Hormone)', price: 2200 },
  { category: 'Lab', code: 'LAB-002', description: 'Day 2 Ovarian Reserve Profile (FSH, LH, E2, TSH, PRL)', price: 3500 },
  { category: 'Lab', code: 'LAB-003', description: 'Couple Viral Markers (HIV, HBsAg, HCV, VDRL)', price: 2800 },
  { category: 'Lab', code: 'LAB-004', description: 'Complete Blood Count (CBC) with ESR', price: 450 },
  // Daycare & Procedures
  { category: 'Procedure', code: 'PRC-001', description: 'Intrauterine Insemination (IUI) Procedure & Prep', price: 8500 },
  { category: 'Procedure', code: 'PRC-002', description: 'Diagnostic Hysteroscopy (Daycare)', price: 18000 },
  { category: 'Procedure', code: 'PRC-003', description: 'Operative Laparoscopy / Ovarian Drilling', price: 45000 },
  { category: 'Procedure', code: 'PRC-004', description: 'Cervical Pap Smear & Liquid Based Cytology', price: 1200 },
  // Pharmacy & Administration
  { category: 'Pharmacy', code: 'PHR-001', description: 'Injection Administration & Nursing Charge', price: 200 },
  { category: 'Daycare', code: 'DAY-001', description: 'Daycare Recovery Bed Charge (Up to 4 Hours)', price: 1500 },
];

export default function BillingPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const statusParam = searchParams.get('status');

  const [invoices, setInvoices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'packages' | 'wallet'>(
    tabParam && ['invoices', 'packages', 'wallet'].includes(tabParam)
      ? (tabParam as any)
      : 'invoices'
  );

  // Filters
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(statusParam || '');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['invoices', 'packages', 'wallet'].includes(tab)) {
      setActiveTab(tab as any);
    }
    const status = searchParams.get('status');
    setStatusFilter(status || '');
  }, [searchParams]);

  // New invoice form state
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedSource, setSelectedSource] = useState('OP');
  const [reasonForAttendance, setReasonForAttendance] = useState('');
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiPayMode, setUpiPayMode] = useState('GPay');
  const [immediatePaid, setImmediatePaid] = useState(0);
  const [walletDeduction, setWalletDeduction] = useState(0);
  const [selectedPatientWallet, setSelectedPatientWallet] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Quick Payment Modal
  const [paymentModalInv, setPaymentModalInv] = useState<any>(null);
  const [receiptModalInv, setReceiptModalInv] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('upi');

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      billingApi.listInvoices({
        appointment_source: sourceFilter || undefined,
        status: statusFilter || undefined,
      }),
      billingApi.listPackages(),
      patientsApi.list({ per_page: 500 }),
    ]).then(([invData, pkgData, patData]: any) => {
      setInvoices(invData || []);
      setPackages(pkgData || []);
      setPatients(patData.patients || patData.items || []);
    }).catch(() => {}).finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [sourceFilter, statusFilter]);

  // When selected patient changes in new invoice modal, fetch wallet balance
  useEffect(() => {
    if (selectedPatient) {
      walletApi.getWallet(selectedPatient)
        .then((w: any) => setSelectedPatientWallet(w))
        .catch(() => setSelectedPatientWallet(null));
    }
  }, [selectedPatient]);

  const updateItem = (idx: number, field: string, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      (updated[idx] as any)[field] = value;
      if (field === 'unit_price' || field === 'quantity') {
        updated[idx].total = (updated[idx].unit_price || 0) * (updated[idx].quantity || 1);
      }
      return updated;
    });
  };

  const handleSelectTariff = (idx: number, tariffCode: string) => {
    const tariff = TARIFF_CATALOG.find((t) => t.code === tariffCode);
    if (!tariff) return;
    setItems((prev) => {
      const updated = [...prev];
      const qty = updated[idx]?.quantity || 1;
      updated[idx] = {
        ...updated[idx],
        description: tariff.description,
        unit_price: tariff.price,
        total: tariff.price * qty,
      };
      return updated;
    });
  };

  const addItemRow = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const handleSelectPackage = (pkg: any) => {
    setItems(pkg.items.map((i: any) => ({
      description: i.name || i.description,
      quantity: 1,
      unit_price: i.cost || (pkg.base_price / pkg.items.length),
      total: i.cost || (pkg.base_price / pkg.items.length),
    })));
    setSelectedSource('Package');
  };

  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const calculatedDiscount = discountType === 'percentage'
    ? Math.round((subtotal * (discountValue || 0)) / 100)
    : (discountValue || 0);
  const totalAmount = Math.max(0, subtotal - calculatedDiscount);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !user) return;
    setIsSaving(true);
    try {
      const inv: any = await billingApi.createInvoice({
        patient_id: selectedPatient,
        appointment_source: selectedSource,
        reason_for_attendance: reasonForAttendance,
        items: items.map((i) => ({ ...i, total: i.unit_price * i.quantity })),
        discount: calculatedDiscount,
        tax: 0,
        paid_amount: immediatePaid,
        wallet_amount_used: walletDeduction,
        payment_method: paymentMethod,
        upi_pay_mode: upiPayMode,
        created_by: user.id,
      });
      setInvoices((prev) => [inv, ...prev]);
      setShowNewInvoice(false);
      toast.success('Invoice Created Successfully', `Invoice ${inv.invoice_number} has been generated.`);
      loadData();
    } catch (err: any) {
      toast.error('Invoice Creation Failed', err.message || 'Failed to create invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInv) return;
    try {
      await billingApi.recordPayment(paymentModalInv.id, {
        amount: parseFloat(payAmount) || 0,
        payment_method: payMode,
      });
      setPaymentModalInv(null);
      loadData();
      toast.success('Payment Recorded', 'Payment has been successfully applied to invoice.');
    } catch (err: any) {
      toast.error('Payment Failed', err.message || 'Failed to record payment');
    }
  };


  const totalBilled = invoices.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
  const totalCollected = invoices.reduce((s, i) => s + parseFloat(i.paid_amount || 0), 0);
  const totalPending = invoices.reduce((s, i) => s + parseFloat(i.pending_due || 0), 0);

  return (
    <div className="w-full px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Fertility Billing & Financial Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Multi-source invoicing, advance wallets & treatment packages</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewInvoice(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-indigo-500/30"
          >
            📄 Generate Invoice
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Billed</p>
          <p className="text-2xl font-black text-slate-900 mt-1">₹{totalBilled.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-1">{invoices.length} invoices generated</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Collected</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">₹{totalCollected.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600/80 mt-1">Bank, UPI & Advance Wallet deductions</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Outstanding Balance</p>
          <p className="text-2xl font-black text-rose-700 mt-1">₹{totalPending.toLocaleString()}</p>
          <p className="text-[11px] text-rose-600/80 mt-1">Pending collections across departments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'invoices', label: '📑 Invoices & Receipts' },
          { id: 'packages', label: '📦 Treatment Packages' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter by Department / Source</label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold"
              >
                <option value="">All Appointment Sources</option>
                {appointmentSources.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold"
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No invoices found matching criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Invoice #</th>
                      <th className="p-3.5">Patient Details</th>
                      <th className="p-3.5">Dept / Source</th>
                      <th className="p-3.5">Total Amount</th>
                      <th className="p-3.5">Paid Amount</th>
                      <th className="p-3.5">Pending Due</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-mono font-bold text-indigo-700">{inv.invoice_number}</td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{inv.patient_name || 'Patient'}</p>
                          <p className="font-mono text-[10px] text-slate-400">{inv.patient_vid || '—'}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">
                            {inv.appointment_source}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">₹{parseFloat(inv.total_amount).toLocaleString()}</td>
                        <td className="p-3.5 font-bold text-emerald-700">₹{parseFloat(inv.paid_amount).toLocaleString()}</td>
                        <td className="p-3.5 font-bold text-rose-700">
                          {parseFloat(inv.pending_due) > 0 ? `₹${parseFloat(inv.pending_due).toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColors[inv.status] || 'bg-slate-100 text-slate-600'}`}>
                            {inv.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 whitespace-nowrap">{formatDate(inv.created_at)}</td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {parseFloat(inv.pending_due) > 0 && (
                              <button
                                onClick={() => {
                                  setPaymentModalInv(inv);
                                  setPayAmount(inv.pending_due);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] transition-colors"
                              >
                                Record Pay
                              </button>
                            )}
                            <button
                              onClick={() => setReceiptModalInv(inv)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-bold text-[10px] transition-colors"
                              title="View & Print Invoice Receipt"
                            >
                              📄 Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {pkg.plugin_id} Package
                </span>
                <h3 className="text-base font-black text-slate-900">{pkg.name}</h3>
                <p className="text-xs text-slate-500">{pkg.description}</p>
                <div className="pt-2 border-t space-y-1">
                  {pkg.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs text-slate-700">
                      <span>• {item.name || item.description}</span>
                      <span className="font-bold">₹{item.cost?.toLocaleString() || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Package Price</span>
                  <span className="text-xl font-black text-slate-900">₹{parseFloat(pkg.base_price).toLocaleString()}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedSource('Package');
                    setReasonForAttendance(`${pkg.name} Purchase`);
                    setItems(pkg.items?.map((it: any) => ({
                      description: it.name || it.description,
                      quantity: 1,
                      unit_price: it.cost || 0,
                      total: it.cost || 0,
                    })) || [{ description: pkg.name, quantity: 1, unit_price: parseFloat(pkg.base_price), total: parseFloat(pkg.base_price) }]);
                    setShowNewInvoice(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                >
                  Bill Package
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Printable Receipt Modal */}
      {receiptModalInv && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:static print:bg-transparent print:z-auto">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-6 print:max-w-none print:w-full print:rounded-none">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm print:border print:border-slate-800">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">VaidyaMD Advanced Hospital & Fertility Centre</h2>
                  <p className="text-xs text-slate-500 font-medium">Road No. 36, Jubilee Hills, Hyderabad · Phone: +91 40 2345 6789</p>
                  <p className="text-[11px] text-slate-400 font-mono">GSTIN: 36AAAAA0000A1Z5 · Reg No: TS/MED/2024/9876</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase ${
                  parseFloat(receiptModalInv.pending_due) <= 0
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : parseFloat(receiptModalInv.paid_amount) > 0
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {parseFloat(receiptModalInv.pending_due) <= 0 ? 'PAID IN FULL' : parseFloat(receiptModalInv.paid_amount) > 0 ? 'PARTIAL PAYMENT' : 'UNPAID'}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Hospital Tax Invoice</p>
                <button onClick={() => setReceiptModalInv(null)} className="no-print ml-2 text-slate-400 hover:text-slate-700 font-bold">✕</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 print:bg-white print:border-slate-300">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Patient Information</p>
                <p className="text-slate-900 font-black text-sm">{receiptModalInv.patient_name || 'Patient'}</p>
                <p className="font-mono text-slate-600 font-medium">VID / MRN: {receiptModalInv.patient_vid || '—'}</p>
                {receiptModalInv.reason_for_attendance && (
                  <p className="text-slate-500 mt-0.5"><span className="font-semibold">Reason:</span> {receiptModalInv.reason_for_attendance}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Invoice Summary</p>
                <p className="font-mono font-bold text-indigo-700 text-sm">{receiptModalInv.invoice_number}</p>
                <p className="text-slate-600 font-medium">Date: {formatDate(receiptModalInv.created_at)}</p>
                <p className="text-slate-500">Dept / Source: <span className="font-bold text-slate-700">{receiptModalInv.appointment_source || 'OPD'}</span></p>
              </div>
            </div>

            {/* Line Items */}
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider print:bg-slate-200">
                <tr>
                  <th className="p-2.5 border-b border-slate-200">Item / Procedure Description</th>
                  <th className="p-2.5 text-center border-b border-slate-200">Qty</th>
                  <th className="p-2.5 text-right border-b border-slate-200">Unit Rate (₹)</th>
                  <th className="p-2.5 text-right border-b border-slate-200">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {receiptModalInv.items?.map((it: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-800 font-semibold">{it.description}</td>
                    <td className="p-2.5 text-center text-slate-600">{it.quantity}</td>
                    <td className="p-2.5 text-right font-mono text-slate-600">₹{parseFloat(it.unit_price).toLocaleString()}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">₹{parseFloat(it.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary Totals */}
            <div className="border-t pt-4 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal / Gross Amount:</span>
                <span className="font-mono font-semibold">₹{parseFloat(receiptModalInv.subtotal || receiptModalInv.total_amount).toLocaleString()}</span>
              </div>
              {parseFloat(receiptModalInv.discount) > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Concession / Discount:</span>
                  <span className="font-mono">- ₹{parseFloat(receiptModalInv.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>GST (Healthcare Services - Exempted):</span>
                <span className="font-mono">₹0.00 (0%)</span>
              </div>
              {parseFloat(receiptModalInv.wallet_amount_used) > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Deducted from Advance Wallet:</span>
                  <span className="font-mono">- ₹{parseFloat(receiptModalInv.wallet_amount_used).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 border-t pt-2">
                <span>Net Total Billable:</span>
                <span className="font-mono text-indigo-900">₹{parseFloat(receiptModalInv.total_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Total Amount Paid:</span>
                <span className="font-mono">₹{parseFloat(receiptModalInv.paid_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-black text-sm">
                <span>Balance Due:</span>
                <span className="font-mono">₹{parseFloat(receiptModalInv.pending_due).toLocaleString()}</span>
              </div>
            </div>

            {/* Signature & Terms */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-4 items-end text-[11px] text-slate-400">
              <div>
                <p className="font-semibold text-slate-600">Terms & Conditions:</p>
                <p>1. Payments received are non-refundable.</p>
                <p>2. Healthcare services are exempted from GST under Notification No. 12/2017-CT(R).</p>
                <p className="mt-2 text-[10px]">This is a computer-generated invoice and requires no physical stamp.</p>
              </div>
              <div className="text-right space-y-1">
                <div className="border-b border-slate-300 w-40 ml-auto h-10"></div>
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Authorized Signatory</p>
                <p className="text-[10px] text-slate-500">VaidyaMD Accounts Billing Desk</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                🖨️ Print Tax Invoice (A4)
              </button>
              <button
                onClick={() => setReceiptModalInv(null)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {showNewInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">Generate Multi-Department Invoice</h3>
                <p className="text-xs text-slate-500">Add billable services, procedures, or select standard tariffs</p>
              </div>
              <button onClick={() => setShowNewInvoice(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Select Patient <span className="text-red-500">*</span></label>
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    required
                    className="vmd-input text-xs"
                  >
                    <option value="">— Select Patient —</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.vid})</option>
                    ))}
                  </select>
                  {selectedPatientWallet && (
                    <p className="text-[11px] text-emerald-700 font-bold mt-1">
                      Advance Wallet Balance: ₹{selectedPatientWallet.balance.toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Department / Source</label>
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="vmd-input text-xs"
                  >
                    {appointmentSources.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Reason for Attendance / Clinical Indication</label>
                <input
                  type="text"
                  value={reasonForAttendance}
                  onChange={(e) => setReasonForAttendance(e.target.value)}
                  placeholder="e.g. OPU Retrieval, Semen Analysis, Follicular Scan, OPD Consultation"
                  className="vmd-input text-xs"
                />
              </div>

              {/* Line Items */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Billable Services & Procedures</label>
                  <span className="text-[11px] text-slate-400">Select standard tariff or enter custom service</span>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-12 sm:col-span-4">
                        <select
                          onChange={(e) => {
                            if (e.target.value) handleSelectTariff(idx, e.target.value);
                          }}
                          defaultValue=""
                          className="vmd-input text-xs bg-white text-slate-600 font-medium"
                        >
                          <option value="">⚡ Select Tariff Master...</option>
                          {TARIFF_CATALOG.map((t) => (
                            <option key={t.code} value={t.code}>
                              [{t.category}] {t.description} (₹{t.price})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-12 sm:col-span-4">
                        <input
                          type="text"
                          placeholder="Service Description (Select from Tariff)"
                          value={item.description}
                          readOnly
                          className="vmd-input text-xs bg-slate-100 text-slate-600 cursor-not-allowed border-slate-300"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-1">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                          min={1}
                          className="vmd-input text-xs bg-white text-center"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <input
                          type="number"
                          placeholder="Rate ₹"
                          value={item.unit_price}
                          readOnly
                          className="vmd-input text-xs bg-slate-100 text-slate-600 font-mono cursor-not-allowed border-slate-300"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-rose-500 font-bold hover:text-rose-700 text-sm px-2 py-1 rounded hover:bg-rose-50"
                          title="Remove Item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItemRow}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  + Add Another Service
                </button>
              </div>

              {/* Totals & Payments */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 pt-3">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-bold font-mono">₹{subtotal.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 items-end">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-500">Concession / Discount</label>
                      <div className="flex rounded-lg overflow-hidden border border-slate-300 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setDiscountType('amount')}
                          className={`px-2 py-0.5 ${discountType === 'amount' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}
                        >
                          ₹ Flat
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('percentage')}
                          className={`px-2 py-0.5 ${discountType === 'percentage' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}
                        >
                          % Pct
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={discountValue || ''}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                        placeholder={discountType === 'percentage' ? 'e.g. 10%' : 'e.g. 500'}
                        className="vmd-input text-xs pr-16 font-medium"
                      />
                      <span className="absolute right-3 top-2 text-[11px] font-bold text-slate-400 pointer-events-none">
                        {discountType === 'percentage' ? `${calculatedDiscount ? `(-₹${calculatedDiscount})` : '%'}` : '₹'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[10px] font-bold uppercase text-slate-400">Total Billable Amount</label>
                    <p className="text-xl font-black text-slate-900 font-mono">₹{totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Advance Wallet Deduction */}
                {selectedPatientWallet && selectedPatientWallet.balance > 0 && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <label className="block text-[11px] font-bold text-emerald-800">
                      Deduct from Advance Wallet (Available: ₹{selectedPatientWallet.balance.toLocaleString()})
                    </label>
                    <input
                      type="number"
                      max={Math.min(totalAmount, selectedPatientWallet.balance)}
                      value={walletDeduction}
                      onChange={(e) => setWalletDeduction(Math.min(totalAmount, parseFloat(e.target.value) || 0))}
                      className="vmd-input text-xs font-bold text-emerald-900"
                      placeholder="Amount to deduct..."
                    />
                  </div>
                )}

                {/* Immediate Payment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Immediate Cash/UPI Payment</label>
                    <input
                      type="number"
                      value={immediatePaid}
                      onChange={(e) => setImmediatePaid(parseFloat(e.target.value) || 0)}
                      className="vmd-input text-xs"
                      placeholder="Paid now..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="upi">UPI (GPay / PhonePe)</option>
                      <option value="cash">Cash</option>
                      <option value="card">Credit / Debit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
                >
                  {isSaving ? 'Generating...' : '✅ Generate Invoice'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewInvoice(false)}
                  className="px-5 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalInv && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">Record Payment for {paymentModalInv.invoice_number}</h3>
            <p className="text-xs text-slate-500">Patient: {paymentModalInv.patient_name} · Total Due: ₹{paymentModalInv.pending_due}</p>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="vmd-input font-bold text-emerald-800 text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Payment Mode</label>
                <select value={payMode} onChange={(e) => setPayMode(e.target.value)} className="vmd-input">
                  <option value="upi">UPI (GPay / PhonePe)</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700">
                  Confirm Payment
                </button>
                <button type="button" onClick={() => setPaymentModalInv(null)} className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
