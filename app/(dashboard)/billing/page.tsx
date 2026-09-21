'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { billingApi, patientsApi, walletApi, patientPackagesApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/contexts/ToastContext';
import { Printer, X, Building2, FileText, Package, Receipt, Zap, Search, Plus, PackageCheck, Sparkles } from 'lucide-react';
import PrintableInvoice from '@/components/common/PrintableInvoice';

const statusColors: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pending: 'bg-rose-100 text-rose-800 border-rose-200',
  partially_paid: 'bg-accent-light text-accent border-accent/30',
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  cancelled: 'bg-slate-100 text-slate-400 border-slate-200',
};

const appointmentSources = [
  'Andrology/Embryology', 'Counselling', 'GYN-Theatre', 'IUI',
  'IVF-Theatre', 'Lab', 'Nurse', 'OP', 'Package', 'Scan', 'Yoga'
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
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
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
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [patientActivePackages, setPatientActivePackages] = useState<any[]>([]);
  const [invoicePatientSearch, setInvoicePatientSearch] = useState('');
  const [isInvoicePatientDropdownOpen, setIsInvoicePatientDropdownOpen] = useState(false);
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

  // Service catalog autocomplete (driven purely from database)
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
      billingApi.getServiceCatalog().catch(() => []),
    ]).then(([invResult, pkgResult, patResult, catalogResult]) => {
      if (invResult.status === 'fulfilled') setInvoices((invResult.value as any) || []);
      if (pkgResult.status === 'fulfilled') setPackages((pkgResult.value as any) || []);
      if (patResult.status === 'fulfilled') {
        const v = patResult.value as any;
        setPatients(v.patients || v.items || []);
      }
      if (catalogResult.status === 'fulfilled' && Array.isArray(catalogResult.value) && catalogResult.value.length > 0) {
        setServiceCatalog(catalogResult.value);
      }
    }).catch(() => {}).finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [sourceFilter, statusFilter]);

  const filteredInvoices = invoices.filter((inv: any) => {
    if (genderFilter) {
      const p = patients.find((pat: any) => pat.id === inv.patient_id);
      const pGender = (p?.gender || '').toLowerCase();
      if (pGender !== genderFilter.toLowerCase()) return false;
    }
    if (patientSearchQuery.trim()) {
      const q = patientSearchQuery.toLowerCase().trim();
      const p = patients.find((pat: any) => pat.id === inv.patient_id);
      const patName = (p?.name || inv.patient_name || '').toLowerCase();
      const patVid = (p?.vid || p?.mrn || inv.patient_vid || '').toLowerCase();
      const patPhone = (p?.phone || '').toLowerCase();
      const invNum = (inv.invoice_number || '').toLowerCase();
      const matches = patName.includes(q) || patVid.includes(q) || patPhone.includes(q) || invNum.includes(q);
      if (!matches) return false;
    }
    return true;
  });

  // When selected patient changes in new invoice modal, fetch wallet balance and active package allocations
  useEffect(() => {
    if (selectedPatient) {
      walletApi.getWallet(selectedPatient)
        .then((w: any) => setSelectedPatientWallet(w))
        .catch(() => setSelectedPatientWallet(null));

      patientPackagesApi.listByPatient(selectedPatient)
        .then((pkgs: any) => {
          const active = (Array.isArray(pkgs) ? pkgs : []).filter((p: any) => p.status === 'active');
          setPatientActivePackages(active);
        })
        .catch(() => setPatientActivePackages([]));
    } else {
      setSelectedPatientWallet(null);
      setPatientActivePackages([]);
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
    const tariff: any = serviceCatalog.find((t: any) => (t.code || t.name) === tariffCode);
    if (!tariff) return;
    const desc = tariff.name || tariff.description;
    const price = Number(tariff.cost ?? tariff.price ?? tariff.base_price ?? 0);

    setItems((prev) => {
      const updated = [...prev];
      const qty = updated[idx]?.quantity || 1;
      updated[idx] = {
        ...updated[idx],
        description: desc,
        unit_price: price,
        total: price * qty,
      };
      return updated;
    });
    setItemSearches((prev) => {
      const s = [...prev];
      s[idx] = desc;
      return s;
    });
    setItemDropdowns((prev) => {
      const d = [...prev];
      d[idx] = false;
      return d;
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
    if (!selectedPatient) {
      toast.error('Patient Required', 'Please select a patient before generating an invoice.');
      return;
    }
    if (!user) {
      toast.error('Authentication Required', 'You must be logged in to create an invoice.');
      return;
    }
    const validItems = items.filter((i) => i.description && i.description.trim().length > 0);
    if (validItems.length === 0) {
      toast.error('Services Required', 'Please enter or select at least one billable service with a description.');
      return;
    }
    setIsSaving(true);
    try {
      const inv: any = await billingApi.createInvoice({
        patient_id: selectedPatient,
        package_id: selectedPackageId || undefined,
        appointment_source: selectedSource,
        reason_for_attendance: reasonForAttendance,
        items: validItems.map((i: any) => ({
          description: i.description,
          quantity: Number(i.quantity) || 1,
          unit_price: Number(i.unit_price) || 0,
          total: (Number(i.unit_price) || 0) * (Number(i.quantity) || 1),
          service_code: i.service_code || undefined,
          patient_package_id: i.patient_package_id || undefined,
          package_item_id: i.package_item_id || undefined,
        })),
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
      setSelectedPackageId(null);
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
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-end gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search Patient or Invoice #</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  placeholder="Search by Patient Name, VID, MRN, Phone, or Invoice #..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                />
                {patientSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPatientSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Clear Search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="w-full md:w-52">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department / Source</label>
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
            <div className="w-full md:w-36">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
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
            <div className="w-full md:w-32">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</label>
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
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
                        <td className="p-3.5 font-mono font-bold text-primary">{inv.invoice_number}</td>
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
                              className="px-2.5 py-1 bg-primary/10 hover:bg-primary/15 text-primary rounded font-bold text-[10px] transition-colors"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const pkgItems = Array.isArray(pkg.items) ? pkg.items : [];
            const standardTotal = pkgItems.reduce(
              (acc: number, it: any) => acc + (Number(it.price ?? it.cost ?? 0) * Number(it.quantity || 1)),
              0
            );
            const packagePrice = parseFloat(pkg.base_price ?? pkg.price ?? 0) || 0;
            const savings = Math.max(0, standardTotal - packagePrice);

            return (
              <div key={pkg.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                      {pkg.plugin_id || 'Clinical'} Package
                    </span>
                    {savings > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                        Save ₹{savings.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{pkg.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{pkg.description || 'Comprehensive clinical procedure bundle.'}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 pb-0.5 border-b border-slate-100">
                      <span>Included Components ({pkgItems.length})</span>
                      <span>Tariff Value</span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {pkgItems.map((item: any, idx: number) => {
                        const price = Number(item.price ?? item.cost ?? 0);
                        const qty = Number(item.quantity || 1);
                        return (
                          <div key={idx} className="flex justify-between text-xs text-slate-700 py-0.5 border-b border-slate-50 last:border-0">
                            <span className="truncate pr-2">• {item.name || item.description} <span className="text-slate-400 font-mono text-[10px]">({qty}x)</span></span>
                            <span className="font-bold font-mono text-slate-900 shrink-0">₹{(price * qty).toLocaleString('en-IN')}</span>
                          </div>
                        );
                      })}
                      {pkgItems.length === 0 && (
                        <p className="text-slate-400 text-xs italic">No individual components specified</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Package Net Price</span>
                    <span className="text-xl font-extrabold text-primary font-mono">₹{packagePrice.toLocaleString('en-IN')}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSource('Package');
                      setSelectedPackageId(pkg.id);
                      setReasonForAttendance(`${pkg.name} Package Purchase`);
                      const mappedItems = pkgItems.length > 0
                        ? pkgItems.map((it: any) => {
                            const uPrice = Number(it.price ?? it.cost ?? 0);
                            const uQty = Number(it.quantity || 1);
                            return {
                              description: it.name || it.description || 'Service',
                              quantity: uQty,
                              unit_price: uPrice,
                              total: uPrice * uQty,
                              service_code: it.code || it.service_code || '',
                            };
                          })
                        : [{ description: pkg.name, quantity: 1, unit_price: packagePrice, total: packagePrice }];

                      const sumTariff = mappedItems.reduce((acc: number, it: any) => acc + (it.total || 0), 0);
                      const bundleDiscount = Math.max(0, sumTariff - packagePrice);

                      setItems(mappedItems);
                      setItemSearches(mappedItems.map((it: any) => it.description));
                      setItemDropdowns(mappedItems.map(() => false));
                      setDiscountType('amount');
                      setDiscountValue(bundleDiscount);
                      setShowNewInvoice(true);
                    }}
                    className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                  >
                    Bill Package
                  </button>
                </div>
              </div>
            );
          })}
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
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Select Patient <span className="text-red-500">*</span></label>
                  {selectedPatient ? (
                    (() => {
                      const p = patients.find((pat: any) => pat.id === selectedPatient);
                      return (
                        <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 truncate">{p?.name || 'Selected Patient'}</span>
                              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                                {p?.vid || p?.mrn || 'VID'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {p?.phone || 'No phone'} · {p?.gender || ''} {p?.age ? `(${p.age}y)` : ''}
                            </div>
                            {selectedPatientWallet && (
                              <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                                Advance Wallet Balance: ₹{selectedPatientWallet.balance?.toLocaleString() ?? 0}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPatient('');
                              setInvoicePatientSearch('');
                              setIsInvoicePatientDropdownOpen(true);
                            }}
                            className="shrink-0 text-xs font-bold text-primary hover:text-primary-mid hover:underline px-2.5 py-1 bg-white border border-slate-200 rounded shadow-xs"
                          >
                            Change
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={invoicePatientSearch}
                          onChange={(e) => {
                            setInvoicePatientSearch(e.target.value);
                            setIsInvoicePatientDropdownOpen(true);
                          }}
                          onFocus={() => setIsInvoicePatientDropdownOpen(true)}
                          placeholder="Search patient by name, VID, phone..."
                          className="vmd-input text-xs pl-8 pr-4 w-full"
                          autoFocus
                          required={!selectedPatient}
                        />
                      </div>
                      {isInvoicePatientDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                          {(() => {
                            const filtered = patients.filter((p: any) => {
                              if (!invoicePatientSearch.trim()) return true;
                              const q = invoicePatientSearch.toLowerCase().trim();
                              return (
                                (p.name || '').toLowerCase().includes(q) ||
                                (p.vid || p.mrn || '').toLowerCase().includes(q) ||
                                (p.phone || '').toLowerCase().includes(q)
                              );
                            }).slice(0, 15);

                            if (filtered.length === 0) {
                              return (
                                <div className="p-3 text-xs text-slate-400 text-center">
                                  No matching patients found ({patients.length} loaded)
                                </div>
                              );
                            }

                            return filtered.map((p: any) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPatient(p.id);
                                  setInvoicePatientSearch('');
                                  setIsInvoicePatientDropdownOpen(false);
                                }}
                                className="w-full p-2.5 text-left hover:bg-blue-50/60 transition-colors flex items-center justify-between"
                              >
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{p.name}</p>
                                  <p className="text-[11px] text-slate-400">
                                    {p.phone || 'No phone'} · {p.gender || ''}
                                  </p>
                                </div>
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                  {p.vid || p.mrn || 'VID'}
                                </span>
                              </button>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
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

              {/* Active Package Quotas Banner */}
              {patientActivePackages.length > 0 && (
                <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-900">
                        Patient has Active Package Quotas ({patientActivePackages.length})
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      Click to apply at ₹0 (Covered)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {patientActivePackages.flatMap((pp: any) =>
                      (pp.items || [])
                        .filter((it: any) => it.remaining_qty > 0)
                        .map((it: any, itIdx: number) => (
                          <button
                            key={`${pp.id}-${itIdx}`}
                            type="button"
                            onClick={() => {
                              setItems((prev) => {
                                const filtered = prev.filter((x) => x.description?.trim());
                                return [
                                  ...filtered,
                                  {
                                    description: `${it.name} [Package: ${pp.package_name}]`,
                                    quantity: 1,
                                    unit_price: 0,
                                    total: 0,
                                    patient_package_id: pp.id,
                                    package_item_id: it.id,
                                    service_code: it.service_code,
                                    is_package_covered: true,
                                  },
                                ];
                              });
                              setItemSearches((prev) => [...prev, `${it.name} [Package: ${pp.package_name}]`]);
                              setItemDropdowns((prev) => [...prev, false]);
                              toast.success('Quota Applied', `Added ${it.name} covered under package (${it.remaining_qty} remaining).`);
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-emerald-100/60 border border-emerald-300 rounded-lg text-xs font-medium text-emerald-900 flex items-center gap-2 shadow-xs transition-colors"
                          >
                            <span className="font-semibold">{it.name}</span>
                            <span className="bg-emerald-600 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                              {it.remaining_qty} left
                            </span>
                          </button>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* Line Items */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">Billable Services &amp; Procedures</label>
                    <p className="text-[11px] text-slate-500">Pick from clinic tariff catalog or type custom service names</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Standard tariffs auto-fill rates</span>
                </div>

                {items.map((item, idx) => {
                  const search = itemSearches[idx] !== undefined ? itemSearches[idx] : item.description;
                  const filtered = search && search.length >= 1
                    ? serviceCatalog.filter((s) =>
                        s.name.toLowerCase().includes(search.toLowerCase()) ||
                        (s.code && s.code.toLowerCase().includes(search.toLowerCase())) ||
                        (s.type && s.type.toLowerCase().includes(search.toLowerCase()))
                      ).slice(0, 10)
                    : [];
                  const isOpen = itemDropdowns[idx] && filtered.length > 0;

                  return (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            Service Item #{idx + 1}
                          </span>
                          {Boolean((item as any).is_package_covered || (item as any).patient_package_id) && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Covered under Package
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleSelectTariff(idx, e.target.value);
                              }
                            }}
                            defaultValue=""
                            className="text-[11px] font-medium bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                          >
                            <option value="">⚡ Quick Pick from Standard Tariffs...</option>
                            {Array.from(new Set(serviceCatalog.map((s) => s.type || s.category || 'General'))).map((cat: string) => (
                              <optgroup key={cat} label={cat}>
                                {serviceCatalog
                                  .filter((s) => (s.type || s.category || 'General') === cat)
                                  .map((s) => {
                                    const codeVal = s.code || s.name;
                                    const label = s.name || s.description;
                                    const price = s.cost ?? s.price ?? s.base_price ?? 0;
                                    return (
                                      <option key={codeVal} value={codeVal}>
                                        {label} — ₹{price}
                                      </option>
                                    );
                                  })}
                              </optgroup>
                            ))}
                          </select>

                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors"
                              title="Remove Line Item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2.5 items-center">
                        {/* Service name input + Autocomplete */}
                        <div className="col-span-12 sm:col-span-6 relative">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Service Description / Name</label>
                          <input
                            type="text"
                            placeholder="Type service name or search tariff catalog..."
                            value={item.description}
                            onChange={(e) => {
                              const v = e.target.value;
                              updateItem(idx, 'description', v);
                              setItemSearches((prev) => { const s = [...prev]; s[idx] = v; return s; });
                              setItemDropdowns((prev) => { const d = [...prev]; d[idx] = true; return d; });
                            }}
                            onFocus={() => {
                              setItemSearches((prev) => { const s = [...prev]; s[idx] = item.description || ''; return s; });
                              setItemDropdowns((prev) => { const d = [...prev]; d[idx] = true; return d; });
                            }}
                            onBlur={() => setTimeout(() => setItemDropdowns((prev) => { const d = [...prev]; d[idx] = false; return d; }), 250)}
                            className="vmd-input text-xs w-full bg-white shadow-sm"
                          />
                          {isOpen && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                              {filtered.map((svc: any, si: number) => (
                                <button
                                  key={si}
                                  type="button"
                                  onMouseDown={() => handleSelectService(idx, svc)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-primary/10 border-b border-slate-100 last:border-0 transition-colors"
                                >
                                  <div>
                                    <span className="text-xs font-semibold text-slate-800">{svc.name}</span>
                                    {svc.code && <span className="text-[10px] text-primary font-mono ml-2">[{svc.code}]</span>}
                                    <span className="text-[10px] text-slate-400 ml-2 uppercase">({svc.type})</span>
                                  </div>
                                  <span className="text-xs font-bold text-emerald-700 ml-2 flex-shrink-0">₹{(svc.cost || 0).toLocaleString()}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Qty */}
                        <div className="col-span-3 sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            min={1}
                            className="vmd-input text-xs bg-white text-center font-bold shadow-sm"
                          />
                        </div>

                        {/* Rate */}
                        <div className="col-span-4 sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Rate (₹)</label>
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(idx, 'unit_price', Math.max(0, parseFloat(e.target.value) || 0))}
                            min={0}
                            className="vmd-input text-xs bg-white font-mono font-medium shadow-sm"
                          />
                        </div>

                        {/* Line Total */}
                        <div className="col-span-5 sm:col-span-2 text-right">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Line Total</label>
                          <div className="text-xs font-bold text-slate-900 font-mono py-1.5 px-2 bg-white rounded border border-slate-200 shadow-sm">
                            ₹{((item.quantity || 1) * (item.unit_price || 0)).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addItemRow}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-mid bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Service
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
                          className={`px-2 py-0.5 ${discountType === 'amount' ? 'bg-primary text-white' : 'bg-white text-slate-600'}`}
                        >
                          ₹ Flat
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('percentage')}
                          className={`px-2 py-0.5 ${discountType === 'percentage' ? 'bg-primary text-white' : 'bg-white text-slate-600'}`}
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
