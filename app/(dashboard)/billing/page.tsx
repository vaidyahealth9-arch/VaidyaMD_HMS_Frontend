'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { billingApi, patientsApi, walletApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/contexts/ToastContext';
import { Printer, X, Building2, FileText, Package, Receipt, Zap } from 'lucide-react';
import PrintableInvoice from '@/components/common/PrintableInvoice';

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
  const [genderFilter, setGenderFilter] = useState('');

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

  // Service catalog autocomplete
  const [serviceCatalog, setServiceCatalog] = useState<any[]>([]);
  const [itemSearches, setItemSearches] = useState<string[]>(['']);
  const [itemDropdowns, setItemDropdowns] = useState<boolean[]>([false]);

  // Quick Payment Modal
  const [paymentModalInv, setPaymentModalInv] = useState<any>(null);
  const [receiptModalInv, setReceiptModalInv] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('upi');

  const loadData = () => {
    setIsLoading(true);
    Promise.allSettled([
      billingApi.listInvoices({
        appointment_source: sourceFilter || undefined,
        status: statusFilter || undefined,
      }),
      billingApi.listPackages(),
      patientsApi.list({ per_page: 500 }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/core'}/billing/service-catalog`, {
        headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}` },
      }).then((r) => r.json()),
    ]).then(([invResult, pkgResult, patResult, catalogResult]) => {
      if (invResult.status === 'fulfilled') setInvoices((invResult.value as any) || []);
      if (pkgResult.status === 'fulfilled') setPackages((pkgResult.value as any) || []);
      if (patResult.status === 'fulfilled') {
        const v = patResult.value as any;
        setPatients(v.patients || v.items || []);
      }
      if (catalogResult.status === 'fulfilled') setServiceCatalog((catalogResult.value as any) || []);
    }).catch(() => {}).finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [sourceFilter, statusFilter]);

  const filteredInvoices = invoices.filter((inv: any) => {
    if (!genderFilter) return true;
    const p = patients.find((pat: any) => pat.id === inv.patient_id);
    const pGender = (p?.gender || '').toLowerCase();
    return pGender === genderFilter.toLowerCase();
  });

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

  const handleSelectService = (idx: number, svc: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const qty = updated[idx]?.quantity || 1;
      updated[idx] = { ...updated[idx], description: svc.name, unit_price: svc.cost, total: svc.cost * qty };
      return updated;
    });
    setItemSearches((prev) => { const s = [...prev]; s[idx] = svc.name; return s; });
    setItemDropdowns((prev) => { const d = [...prev]; d[idx] = false; return d; });
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
    setItemSearches((prev) => [...prev, '']);
    setItemDropdowns((prev) => [...prev, false]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
      setItemSearches((prev) => prev.filter((_, i) => i !== idx));
      setItemDropdowns((prev) => prev.filter((_, i) => i !== idx));
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
          <h1 className="text-2xl font-bold text-slate-900">Fertility Billing & Financial Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Multi-source invoicing, advance wallets & treatment packages</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewInvoice(true)}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-md transition-opacity hover:opacity-90 shadow-sm"
            style={{ background: 'rgb(var(--clr-primary))' }}
          >
            + Generate Invoice
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Billed</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">₹{totalBilled.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-1">{invoices.length} invoices generated</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Collected</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">₹{totalCollected.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600/80 mt-1">Bank, UPI & Advance Wallet deductions</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Outstanding Balance</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">₹{totalPending.toLocaleString()}</p>
          <p className="text-[11px] text-rose-600/80 mt-1">Pending collections across departments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'invoices', label: 'Invoices & Receipts' },
          { id: 'packages', label: 'Treatment Packages' },
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
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter by Gender</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold"
              >
                <option value="">All Genders</option>
                <option value="female">Female ♀</option>
                <option value="male">Male ♂</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredInvoices.length === 0 ? (
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
                    {filteredInvoices.map((inv) => (
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
                              Receipt
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
            <div key={pkg.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {pkg.plugin_id} Package
                </span>
                <h3 className="text-base font-bold text-slate-900">{pkg.name}</h3>
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
                  <span className="text-xl font-bold text-slate-900">₹{parseFloat(pkg.base_price).toLocaleString()}</span>
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

      {/* Invoice Print Modal — using extracted PrintableInvoice component */}
      {receiptModalInv && (
        <PrintableInvoice invoice={receiptModalInv} onClose={() => setReceiptModalInv(null)} />
      )}

      {/* New Invoice Modal */}
      {showNewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-xl" style={{ border: '1px solid rgb(var(--clr-border))' }}>
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgb(var(--clr-border))' }}>
              <div>
                <h3 className="font-semibold text-base" style={{ color: 'rgb(var(--clr-text))' }}>Generate Multi-Department Invoice</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--clr-text-muted))' }}>Add billable services, procedures, or select standard tariffs</p>
              </div>
              <button onClick={() => setShowNewInvoice(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"><X className="w-4 h-4" /></button>
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
                  <label className="block text-xs font-bold text-slate-700">Billable Services &amp; Procedures</label>
                  <span className="text-[11px] text-slate-400">Type to search real clinic catalog · price auto-fills</span>
                </div>
                {items.map((item, idx) => {
                  const search = itemSearches[idx] || '';
                  const filtered = search.length >= 1
                    ? serviceCatalog.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())).slice(0, 10)
                    : [];
                  const isOpen = itemDropdowns[idx] && filtered.length > 0;

                  return (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="grid grid-cols-12 gap-2 items-start">
                        {/* Service search autocomplete */}
                        <div className="col-span-12 sm:col-span-5 relative">
                          <input
                            type="text"
                            placeholder="Search service… (e.g. ICSI, OPU, Scan)"
                            value={search}
                            onChange={(e) => {
                              const v = e.target.value;
                              setItemSearches((prev) => { const s = [...prev]; s[idx] = v; return s; });
                              setItemDropdowns((prev) => { const d = [...prev]; d[idx] = true; return d; });
                              if (!v) updateItem(idx, 'description', '');
                            }}
                            onFocus={() => setItemDropdowns((prev) => { const d = [...prev]; d[idx] = true; return d; })}
                            onBlur={() => setTimeout(() => setItemDropdowns((prev) => { const d = [...prev]; d[idx] = false; return d; }), 150)}
                            className="vmd-input text-xs w-full"
                          />
                          {isOpen && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                              {filtered.map((svc: any, si: number) => (
                                <button
                                  key={si}
                                  type="button"
                                  onMouseDown={() => handleSelectService(idx, svc)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                                >
                                  <div>
                                    <span className="text-xs font-semibold text-slate-800">{svc.name}</span>
                                    <span className="text-[10px] text-slate-400 ml-2 uppercase">{svc.type}</span>
                                  </div>
                                  <span className="text-xs font-bold text-emerald-700 ml-2 flex-shrink-0">₹{(svc.cost || 0).toLocaleString()}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Description (editable after selection) */}
                        <div className="col-span-12 sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Description / Notes"
                            value={item.description}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                            className="vmd-input text-xs bg-white"
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
                            onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="vmd-input text-xs bg-white font-mono"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors mt-0.5"
                            title="Remove Item"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {item.description && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pl-1">
                          <span>{item.description}</span>
                          <span className="font-bold text-slate-700">Total: ₹{(item.total || 0).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addItemRow}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  + Add Another Service
                </button>
              </div>

              {/* Totals & Payments */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 pt-3">
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
                    <p className="text-xl font-bold text-slate-900 font-mono">₹{totalAmount.toLocaleString()}</p>
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
                  className="flex-1 py-3 font-semibold text-xs rounded-md text-white transition-opacity hover:opacity-90"
                  style={{ background: 'rgb(var(--clr-primary))' }}
                >
                  {isSaving ? 'Generating...' : 'Generate Invoice'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 shadow-xl" style={{ border: '1px solid rgb(var(--clr-border))' }}>
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
                <button type="submit" className="flex-1 py-3 font-semibold text-xs rounded-md text-white transition-opacity hover:opacity-90" style={{ background: 'rgb(var(--clr-success))' }}>
                  Confirm Payment
                </button>
                <button type="button" onClick={() => setPaymentModalInv(null)} className="px-4 py-3 text-xs rounded-md font-medium" style={{ background: 'rgb(var(--clr-surface-muted))', color: 'rgb(var(--clr-text-muted))' }}>
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
