'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { pharmacyApi, patientsApi, billingApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Pill,
  FileText,
  Truck,
  PackageCheck,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  ShoppingCart,
  Layers,
  Calendar,
  Loader2,
  Trash2,
  User,
  X,
  Printer,
  Receipt,
} from 'lucide-react';
import PrintableInvoice from '@/components/common/PrintableInvoice';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { Skeleton } from '@/shared/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PharmacyPage() {
  const { user, can } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'inventory' | 'ocr_grn' | 'pos' | 'indents' | 'pos_orders' | 'bills'>(
    tabParam && ['inventory', 'ocr_grn', 'pos', 'indents', 'pos_orders', 'bills'].includes(tabParam)
      ? (tabParam as any)
      : 'inventory'
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['inventory', 'ocr_grn', 'pos', 'indents', 'pos_orders', 'bills'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [receiptModalInv, setReceiptModalInv] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // POS State
  const [posPatientId, setPosPatientId] = useState<string>('');
  const [posPatientSearch, setPosPatientSearch] = useState<string>('');
  const [isPosPatientDropdownOpen, setIsPosPatientDropdownOpen] = useState<boolean>(false);
  const posPatientDropdownRef = useRef<HTMLDivElement>(null);
  const [posCart, setPosCart] = useState<Array<{ item_code: string; item_name: string; quantity: number; unit_price: number; batch_number: string }>>([]);
  const [dispensedInvoice, setDispensedInvoice] = useState<any | null>(null);
  
  const [posDiscount, setPosDiscount] = useState<number>(0);
  const [posAmountPaid, setPosAmountPaid] = useState<number | ''>('');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (posPatientDropdownRef.current && !posPatientDropdownRef.current.contains(event.target as Node)) {
        setIsPosPatientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Inventory Batches
  const { data: batches = [], isLoading: batchesLoading } = useQuery({
    queryKey: ['pharmacy-batches', searchQuery],
    queryFn: () => pharmacyApi.listBatches({ search: searchQuery || undefined }),
    refetchInterval: 30000,
  });

  // Fetch Indents
  const { data: indents = [] } = useQuery({
    queryKey: ['pharmacy-indents'],
    queryFn: () => pharmacyApi.listIndents(),
    refetchInterval: 30000,
  });

  // Fetch Purchase Orders
  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['pharmacy-pos'],
    queryFn: () => pharmacyApi.listPurchaseOrders(),
    refetchInterval: 30000,
  });

  // Fetch GRNs
  const { data: grns = [] } = useQuery({
    queryKey: ['pharmacy-grns'],
    queryFn: () => pharmacyApi.listGRNs(),
    refetchInterval: 30000,
  });

  // Fetch Patients for POS
  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsApi.list({ per_page: 500 }),
  });
  const patients = patientsData?.patients || patientsData?.items || [];

  // Fetch Pharmacy Invoices for Bills & Receipts Tab
  const { data: allInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['pharmacy-invoices'],
    queryFn: () => billingApi.listInvoices(),
    refetchInterval: 15000,
  });

  const pharmacyInvoices = (allInvoices as any[]).filter((inv: any) => {
    const isPharmaSource = (inv.appointment_source || '').toLowerCase() === 'pharmacy';
    const isPharmaInvNum = (inv.invoice_number || '').toUpperCase().startsWith('INV-PHARMA');
    const hasPharmaReason = (inv.reason_for_attendance || '').toLowerCase().includes('pharmacy');
    return isPharmaSource || isPharmaInvNum || hasPharmaReason;
  });

  const filteredPharmacyInvoices = pharmacyInvoices.filter((inv: any) => {
    if (!billSearchQuery.trim()) return true;
    const q = billSearchQuery.toLowerCase().trim();
    const num = (inv.invoice_number || '').toLowerCase();
    const patName = (inv.patient_name || '').toLowerCase();
    const patVid = (inv.patient_vid || inv.patient_mrn || '').toLowerCase();
    return num.includes(q) || patName.includes(q) || patVid.includes(q);
  });

  const openPrintFromPOS = (invData: any) => {
    setReceiptModalInv({
      invoice_number: invData.invoice_number,
      patient_name: invData.patient_name || 'Walk-in / Counter Patient',
      patient_vid: invData.patient_mrn || invData.patient_vid || '—',
      created_at: invData.created_at || new Date().toISOString(),
      appointment_source: 'Pharmacy',
      reason_for_attendance: 'Point of Sale Pharmacy Dispense',
      items: (invData.dispensed_batches || []).map((b: any) => ({
        description: `${b.item_name} (Batch: ${b.batch_number || 'N/A'}${b.expiry_date ? `, Exp: ${formatDate(b.expiry_date)}` : ''})`,
        quantity: b.quantity_dispensed || b.quantity || 1,
        unit_price: b.unit_price || 0,
        total: b.total_price || (b.quantity_dispensed || b.quantity || 1) * (b.unit_price || 0),
      })),
      subtotal: invData.total_amount || 0,
      total_amount: invData.total_amount || 0,
      paid_amount: invData.total_amount || 0,
      pending_due: 0,
    });
  };

  const openPrintFromInvoice = (inv: any) => {
    setReceiptModalInv({
      invoice_number: inv.invoice_number,
      patient_name: inv.patient_name || 'Patient',
      patient_vid: inv.patient_vid || inv.patient_mrn || '—',
      created_at: inv.created_at || new Date().toISOString(),
      appointment_source: inv.appointment_source || 'Pharmacy',
      reason_for_attendance: inv.reason_for_attendance || 'Point of Sale Pharmacy Dispense',
      items: (Array.isArray(inv.items) ? inv.items : []).map((it: any) => ({
        description: it.item_name
          ? `${it.item_name}${it.batch_number ? ` (Batch: ${it.batch_number})` : ''}`
          : (it.description || 'Medication Dispensed'),
        quantity: it.quantity_dispensed || it.quantity || 1,
        unit_price: it.unit_price || 0,
        total: it.total_price || it.total || ((it.quantity_dispensed || it.quantity || 1) * (it.unit_price || 0)),
      })),
      subtotal: inv.subtotal || inv.total_amount,
      total_amount: inv.total_amount,
      paid_amount: inv.paid_amount || inv.total_amount,
      pending_due: inv.pending_due || 0,
      discount: inv.discount || 0,
      wallet_amount_used: inv.wallet_amount_used || 0,
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload & OCR Ingestion
  const handleProcessFile = async (file: File) => {
    setOcrLoading(true);
    try {
      const res = await pharmacyApi.parseOcrInvoice({
        file_name: file.name,
        invoice_hint: file.name,
      });
      setOcrResult(res);
    } catch (err: any) {
      console.error('OCR error:', err);
      import('@/contexts/ToastContext').then(({ toast }) => toast.error('OCR Failed', err.message || 'Failed to parse invoice'));
    } finally {
      setOcrLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  // Editable fields in ocrResult
  const handleOcrItemChange = (index: number, field: string, value: any) => {
    if (!ocrResult) return;
    const updated = [...ocrResult.extracted_items];
    const numVal = parseFloat(value) || 0;
    updated[index] = {
      ...updated[index],
      [field]: field === 'quantity' || field === 'purchase_rate' || field === 'mrp' ? numVal : value,
    };
    if (field === 'quantity' || field === 'purchase_rate') {
      const qty = field === 'quantity' ? numVal : (updated[index].quantity || 0);
      const rate = field === 'purchase_rate' ? numVal : (updated[index].purchase_rate || 0);
      updated[index].amount = qty * rate;
    }
    const newTotal = updated.reduce((acc: number, it: any) => acc + (it.amount || 0), 0);
    setOcrResult({
      ...ocrResult,
      extracted_items: updated,
      total_amount: newTotal,
    });
  };

  const handleAddOcrItem = () => {
    if (!ocrResult) return;
    const newItem = {
      item_code: `DRUG-${Date.now().toString().slice(-4)}`,
      item_name: '',
      generic_name: '',
      batch_number: '',
      expiry_date: '',
      quantity: 0,
      pack_size: '',
      purchase_rate: 0,
      mrp: 0,
      amount: 0,
    };
    const updated = [...ocrResult.extracted_items, newItem];
    const newTotal = updated.reduce((acc: number, it: any) => acc + (it.amount || 0), 0);
    setOcrResult({
      ...ocrResult,
      extracted_items: updated,
      total_amount: newTotal,
    });
  };

  const handleDeleteOcrItem = (index: number) => {
    if (!ocrResult) return;
    const updated = ocrResult.extracted_items.filter((_: any, i: number) => i !== index);
    const newTotal = updated.reduce((acc: number, it: any) => acc + (it.amount || 0), 0);
    setOcrResult({
      ...ocrResult,
      extracted_items: updated,
      total_amount: newTotal,
    });
  };

  const handleManualInvoiceCreate = () => {
    setOcrResult({
      status: 'manual_entry',
      vendor_name: '',
      vendor_gst: '',
      invoice_number: `MAN-INV-${Date.now().toString().slice(-5)}`,
      invoice_date: new Date().toISOString().split('T')[0],
      total_amount: 0,
      extracted_items: [],
    });
  };


  // Commit OCR GRN to Inventory
  const commitGRNMutation = useMutation({
    mutationFn: (grnData: any) =>
      pharmacyApi.createGRN({
        invoice_number: grnData.invoice_number,
        vendor_name: grnData.vendor_name,
        total_amount: grnData.total_amount,
        items: grnData.extracted_items,
        ocr_raw_data: grnData,
        verified_by_id: user?.id,
      }),
    onSuccess: async (createdGRN: any) => {
      // Auto stock
      await pharmacyApi.stockGRN(createdGRN.id);
      queryClient.invalidateQueries({ queryKey: ['pharmacy-batches'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-grns'] });
      setOcrResult(null);
      setActionSuccess('Vendor invoice processed & stock committed to FEFO inventory!');
      setTimeout(() => setActionSuccess(null), 5000);
    },
    onError: (err: any) => {
      import('@/contexts/ToastContext').then(({ toast }) => toast.error('GRN Commit Failed', err.message || 'Failed to save inventory'));
    },
  });

  // Dispense POS FEFO Mutation
  const dispenseMutation = useMutation({
    mutationFn: () => {
      const match = patients.find((p: any) => p.id === posPatientId || `${p.name} (${p.mrn || p.vid})` === posPatientId);
      const effectivePatientId = match ? match.id : posPatientId;
      if (!effectivePatientId) {
        throw new Error('Please select a registered patient before dispensing.');
      }
      return pharmacyApi.dispenseFEFO({
        patient_id: effectivePatientId,
        items: posCart.map((i) => ({ item_code: i.item_code, quantity: i.quantity })),
        doctor_id: user?.id,
        notes: 'Dispensed via Point of Sale counter',
        discount: posDiscount,
        amount_paid: posAmountPaid === '' ? Math.max(0, cartTotal - posDiscount) : Number(posAmountPaid),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-batches'] });
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-invoices'] });
      setPosCart([]);
      setPosDiscount(0);
      setPosAmountPaid('');
      setDispensedInvoice(data);
      setActionSuccess(`Prescription successfully dispensed! Invoice #${data.invoice_number} created.`);
      setTimeout(() => setActionSuccess(null), 8000);
    },
    onError: (err: any) => {
      import('@/contexts/ToastContext').then(({ toast }) => toast.error('Dispensing failed', err.message));
    },
  });

  // Add Item to POS Cart
  const handleAddToCart = (batch: any) => {
    if (batch.quantity_available <= 0) return;
    setPosCart((prev) => {
      const existing = prev.find((i) => i.item_code === batch.item_code);
      if (existing) {
        return prev.map((i) =>
          i.item_code === batch.item_code ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          item_code: batch.item_code,
          item_name: batch.item_name,
          quantity: 1,
          unit_price: batch.selling_price || batch.mrp,
          batch_number: batch.batch_number,
        },
      ];
    });
  };

  const cartTotal = posCart.reduce((acc, curr) => acc + curr.quantity * curr.unit_price, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgb(var(--clr-primary)/0.08)] border border-[rgb(var(--clr-primary)/0.2)] flex items-center justify-center text-[rgb(var(--clr-primary))]">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Pharmacy & Supply Chain</h1>
            <p className="text-xs text-slate-500 font-medium">Smart AI OCR invoice ingestion, FEFO inventory, and point-of-sale dispensing</p>
          </div>
        </div>

        <Button
          onClick={() => setActiveTab('ocr_grn')}
          className="gap-2 bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold h-9 rounded-md shadow-sm text-xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>Smart OCR Invoice Ingestion</span>
        </Button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-md h-11">
          <TabsTrigger value="inventory" className="rounded-lg text-xs font-bold gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Stock Inventory & FEFO ({batches.length})</span>
          </TabsTrigger>
          <TabsTrigger value="pos" className="rounded-lg text-xs font-bold gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Dispensing POS</span>
          </TabsTrigger>
          <TabsTrigger value="bills" className="rounded-lg text-xs font-bold gap-1.5">
            <Receipt className="w-3.5 h-3.5" />
            <span>Bills & Receipts ({pharmacyInvoices.length})</span>
          </TabsTrigger>
          <TabsTrigger value="ocr_grn" className="rounded-lg text-xs font-bold gap-1.5">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>AI OCR Ingestion & GRNs</span>
          </TabsTrigger>
          <TabsTrigger value="indents" className="rounded-lg text-xs font-bold gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Department Indents</span>
          </TabsTrigger>
          <TabsTrigger value="pos_orders" className="rounded-lg text-xs font-bold gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            <span>Purchase Orders</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: INVENTORY BATCHES & FEFO */}
        <TabsContent value="inventory" className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drug, generic, batch..."
                className="pl-9 h-9 text-xs rounded-md"
              />
            </div>
            <Badge variant="purple" className="text-xs font-bold">
              FEFO Sorting Active (Nearest Expiry First)
            </Badge>
          </div>

          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Item / Drug Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Batch #</th>
                  <th className="p-3.5">Expiry Date (FEFO)</th>
                  <th className="p-3.5">Available Stock</th>
                  <th className="p-3.5">Unit MRP / Price</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5 text-right">Quick POS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {batches.map((b: any) => {
                  const isLowStock = b.quantity_available < 15;
                  const isExpiringSoon = new Date(b.expiry_date).getTime() - new Date().getTime() < 1000 * 60 * 60 * 24 * 90;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{b.item_name}</p>
                        <p className="text-[11px] text-slate-500">{b.generic_name || b.item_code}</p>
                      </td>
                      <td className="p-3.5">
                        <Badge variant="outline" className="text-[10px]">{b.category}</Badge>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[rgb(var(--clr-primary))]">{b.batch_number}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${isExpiringSoon ? 'text-red-600' : 'text-slate-700'}`}>
                            {formatDate(b.expiry_date)}
                          </span>
                          {isExpiringSoon && (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0 font-bold uppercase">
                              Near Expiry
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`font-bold ${isLowStock ? 'text-amber-600' : 'text-slate-800'}`}>
                          {b.quantity_available} units
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{formatCurrency(b.selling_price || b.mrp)}</td>
                      <td className="p-3.5 text-slate-500 font-medium">{b.rack_location || 'Main Store'}</td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleAddToCart(b);
                            setActiveTab('pos');
                          }}
                          className="h-7 text-xs font-bold border-[rgb(var(--clr-primary)/0.2)] text-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.08)]"
                        >
                          + Dispense
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* TAB 2: DISPENSING POINT OF SALE (POS) */}
        <TabsContent value="pos" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Patient Select & Quick Add Drug */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm">Select Patient for Pharmacy Dispensing</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {(() => {
                    const selectedPat = patients.find((p: any) => p.id === posPatientId);

                    if (selectedPat) {
                      return (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs shadow-sm">
                              {selectedPat.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-emerald-950">{selectedPat.name}</p>
                                <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-800 bg-white font-bold">
                                  Ready for Dispensing
                                </Badge>
                              </div>
                              <p className="text-[11px] text-emerald-700 font-mono">
                                MRN: {selectedPat.mrn || selectedPat.vid || 'N/A'} · {selectedPat.gender || 'F'} · {selectedPat.age ? `${selectedPat.age}y` : ''} · {selectedPat.phone ? `Ph: ${selectedPat.phone}` : ''}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPosPatientId('');
                              setPosPatientSearch('');
                              setIsPosPatientDropdownOpen(true);
                            }}
                            className="h-8 text-xs font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-100/50"
                          >
                            Change Patient
                          </Button>
                        </div>
                      );
                    }

                    // No patient selected yet: render searchable combobox
                    const query = posPatientSearch.toLowerCase().trim();
                    const filtered = patients.filter((p: any) => {
                      if (!query) return true;
                      return (
                        p.name?.toLowerCase().includes(query) ||
                        p.mrn?.toLowerCase().includes(query) ||
                        p.vid?.toLowerCase().includes(query) ||
                        p.phone?.toLowerCase().includes(query)
                      );
                    }).slice(0, 15);

                    return (
                      <div className="relative" ref={posPatientDropdownRef}>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Search Patient (Type Name, MRN, VID, or Phone) *
                        </label>
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            type="text"
                            placeholder="Type to search patient (e.g. Priya, PAT-001, 98765...)"
                            value={posPatientSearch}
                            onChange={(e) => {
                              setPosPatientSearch(e.target.value);
                              setIsPosPatientDropdownOpen(true);
                            }}
                            onFocus={() => setIsPosPatientDropdownOpen(true)}
                            className="pl-9 pr-9 h-10 text-xs bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                          />
                          {posPatientSearch && (
                            <button
                              type="button"
                              onClick={() => {
                                setPosPatientSearch('');
                                setIsPosPatientDropdownOpen(true);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Combobox dropdown */}
                        {isPosPatientDropdownOpen && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-500 font-medium">
                                No registered patients found matching "{posPatientSearch}"
                              </div>
                            ) : (
                              filtered.map((p: any) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setPosPatientId(p.id);
                                    setPosPatientSearch('');
                                    setIsPosPatientDropdownOpen(false);
                                  }}
                                  className="w-full text-left p-3 hover:bg-emerald-50/60 transition-colors flex items-center justify-between group"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-100 group-hover:text-emerald-800">
                                      {p.name?.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                                        {p.name}
                                      </p>
                                      <p className="text-[11px] text-slate-500 font-mono">
                                        MRN: {p.mrn || p.vid || 'N/A'} · {p.gender || 'F'} · {p.age ? `${p.age}y` : ''} · {p.phone || 'No phone'}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 uppercase tracking-wider">
                                    Select Patient →
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        )}

                        <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1.5 mt-2">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          Please search and select a patient to proceed with medication dispensing.
                        </p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Fast Stock Selector Grid with Inline Search */}
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm">Available Medications (1-Click Add)</CardTitle>
                    <p className="text-[11px] text-slate-500">Search inventory by drug name, generic or batch number</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search medications..."
                      value={posSearch}
                      onChange={(e) => setPosSearch(e.target.value)}
                      className="pl-8 h-8 text-xs bg-slate-50"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto">
                  {batches
                    .filter((b: any) =>
                      !posSearch ||
                      b.item_name?.toLowerCase().includes(posSearch.toLowerCase()) ||
                      b.batch_number?.toLowerCase().includes(posSearch.toLowerCase()) ||
                      b.item_code?.toLowerCase().includes(posSearch.toLowerCase())
                    )
                    .slice(0, 20)
                    .map((b: any) => (
                      <div
                        key={b.id}
                        onClick={() => handleAddToCart(b)}
                        className="p-3 rounded-md border border-slate-200 hover:border-[rgb(var(--clr-primary)/0.4)] bg-white hover:bg-[rgb(var(--clr-primary)/0.04)] cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-xs text-slate-900 truncate">{b.item_name}</p>
                          <p className="text-[10px] text-slate-500">
                            Batch: {b.batch_number} · Exp: {formatDate(b.expiry_date)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-[rgb(var(--clr-primary))]">{formatCurrency(b.selling_price || b.mrp)}</p>
                          <span className="text-[10px] font-semibold text-emerald-600">{b.quantity_available} in stock</span>
                        </div>
                      </div>
                    ))}
                  {batches.filter((b: any) =>
                    !posSearch ||
                    b.item_name?.toLowerCase().includes(posSearch.toLowerCase()) ||
                    b.batch_number?.toLowerCase().includes(posSearch.toLowerCase()) ||
                    b.item_code?.toLowerCase().includes(posSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="col-span-2 text-center py-6 text-slate-400 text-xs">
                      No matching medications found in inventory.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Cart & Dispensing Summary */}
            <div className="space-y-4">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">Dispensing Cart</CardTitle>
                    <Badge variant="purple" className="text-xs font-bold">{posCart.length} Items</Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {posCart.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      Cart is empty. Select items to dispense.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                      {posCart.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-900 truncate">{item.item_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">FEFO Batch: {item.batch_number}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">x{item.quantity}</span>
                            <span className="font-bold text-slate-900">{formatCurrency(item.quantity * item.unit_price)}</span>
                            <button
                              onClick={() => setPosCart(posCart.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Subtotal:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Discount (₹):</span>
                      <Input
                        type="number"
                        min="0"
                        value={posDiscount || ''}
                        onChange={(e) => setPosDiscount(Number(e.target.value))}
                        className="h-7 text-xs w-24 text-right"
                      />
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t border-slate-100 pt-2">
                      <span className="text-slate-900">Total Billed:</span>
                      <span className="text-[rgb(var(--clr-primary))]">{formatCurrency(Math.max(0, cartTotal - posDiscount))}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs bg-emerald-50 p-2 rounded-md border border-emerald-100">
                      <span className="text-emerald-800 font-bold">Amount Paid (₹):</span>
                      <Input
                        type="number"
                        min="0"
                        value={posAmountPaid}
                        onChange={(e) => setPosAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder={(Math.max(0, cartTotal - posDiscount)).toString()}
                        className="h-7 text-xs w-24 text-right bg-white border-emerald-200"
                      />
                    </div>
                  </div>
                  {can('action:dispense_pharmacy') ? (
                    <Button
                      onClick={() => dispenseMutation.mutate()}
                      disabled={dispenseMutation.isPending || !posPatientId || posCart.length === 0}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-md shadow-md text-xs mt-2"
                    >
                      {dispenseMutation.isPending ? 'Dispensing & Deducting Stock...' : '1-Click Dispense & Bill'}
                    </Button>
                  ) : (
                    <div className="w-full p-2.5 mt-2 bg-slate-100 border border-slate-200 rounded-md text-slate-500 text-xs font-bold text-center">
                      Not Authorized to Dispense Medication
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB: PHARMACY BILLS & RECEIPTS */}
        <TabsContent value="bills" className="space-y-4 pt-2">
          {/* Top stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pharmacy Revenue</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(pharmacyInvoices.reduce((sum: number, inv: any) => sum + (parseFloat(inv.paid_amount || inv.total_amount) || 0), 0))}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{pharmacyInvoices.length} total dispensed bills</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Paid / Settled Invoices</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {pharmacyInvoices.filter((i: any) => (i.status || '').toLowerCase() === 'paid').length}
              </p>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">Fully collected at pharmacy counter</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <p className="text-[11px] font-bold text-primary uppercase tracking-wider">Today's Dispenses</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  return pharmacyInvoices.filter((i: any) => (i.created_at || '').startsWith(todayStr)).length;
                })()}
              </p>
              <p className="text-[11px] text-primary/80 mt-0.5">Dispensed today via FEFO</p>
            </div>
          </div>

          {/* Search bar & quick action */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={billSearchQuery}
                onChange={(e) => setBillSearchQuery(e.target.value)}
                placeholder="Search by invoice #, patient name, VID..."
                className="pl-9 h-9 text-xs rounded-md"
              />
            </div>
            <Button
              size="sm"
              onClick={() => setActiveTab('pos')}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-md shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              + New POS Dispense
            </Button>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Dispensed Medication(s)</th>
                  <th className="p-3.5 text-center">Date &amp; Time</th>
                  <th className="p-3.5 text-right">Billed Amount</th>
                  <th className="p-3.5 text-center">Payment Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {invoicesLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        <span>Loading pharmacy invoices...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPharmacyInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-slate-600">No Pharmacy Bills Found</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                        Dispense medications via the Dispensing POS tab to automatically generate hospital tax invoices and printable patient receipts.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPharmacyInvoices.map((inv: any) => {
                    const itemsCount = Array.isArray(inv.items) ? inv.items.length : 0;
                    const firstItem = Array.isArray(inv.items) && inv.items[0]
                      ? (inv.items[0].item_name || inv.items[0].description)
                      : null;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          {inv.invoice_number}
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{inv.patient_name || 'Walk-in Patient'}</p>
                          <p className="text-[11px] text-slate-500 font-mono">VID: {inv.patient_vid || inv.patient_mrn || '—'}</p>
                        </td>
                        <td className="p-3.5">
                          {firstItem ? (
                            <div>
                              <p className="text-slate-800 font-medium">{firstItem}</p>
                              {itemsCount > 1 && (
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                  +{itemsCount - 1} more medication{itemsCount > 2 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">FEFO Dispense</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center text-slate-600">
                          {formatDate(inv.created_at)}
                        </td>
                        <td className="p-3.5 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(inv.total_amount)}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {inv.status || 'PAID'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPrintFromInvoice(inv)}
                            className="gap-1.5 text-xs font-bold h-8 border-slate-300 hover:border-[rgb(var(--clr-primary))] hover:text-[rgb(var(--clr-primary))]"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print Bill / Receipt
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* TAB 3: SMART AI OCR INVOICE INGESTION */}
        <TabsContent value="ocr_grn" className="space-y-4 pt-2">
          {/* Hidden Real File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* Drag & Drop OCR Upload Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleProcessFile(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all bg-white cursor-pointer ${
              isDragging ? 'border-[rgb(var(--clr-primary))] bg-[rgb(var(--clr-primary)/0.05)] scale-[0.99]' : 'border-slate-300 hover:border-[rgb(var(--clr-primary)/0.4)]'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-md bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))] flex items-center justify-center shadow-inner">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Drop Vendor Tax Invoice PDF or Scan Here</h3>
                <p className="text-xs text-slate-500 mt-0.5">Supports Cipla, Sun Pharma, Bharat Serums & wholesale distributor bills (PDF, PNG, JPG)</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  type="button"
                  size="sm"
                  className="text-xs font-bold bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white rounded-md shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                  Select Invoice File
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 rounded-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManualInvoiceCreate();
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Manual Invoice Entry
                </Button>
              </div>
            </div>
          </div>

          {/* Skeleton Loader during OCR parsing */}
          {ocrLoading && (
            <div className="p-6 bg-white border border-slate-200 rounded-lg space-y-4 shadow-sm animate-pulse">
              <div className="flex items-center gap-2 text-xs font-bold text-[rgb(var(--clr-primary))]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI Optical Character Recognition (OCR) Parsing Invoice Line Items...</span>
              </div>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-28 w-full" />
            </div>
          )}

          {/* Interactive OCR Pre-Commit Verification Grid */}
          {ocrResult && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="purple" className="text-[10px]">
                      {ocrResult.status === 'manual_entry' ? 'Manual Invoice Entry' : 'OCR Extraction Verified'}
                    </Badge>
                    <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Editable Pre-Commit Mode
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <input
                      type="text"
                      value={ocrResult.vendor_name}
                      onChange={(e) => setOcrResult({ ...ocrResult, vendor_name: e.target.value })}
                      placeholder="Vendor Name"
                      className="font-bold text-sm text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-[rgb(var(--clr-primary))]"
                    />
                    <input
                      type="text"
                      value={ocrResult.invoice_number}
                      onChange={(e) => setOcrResult({ ...ocrResult, invoice_number: e.target.value })}
                      placeholder="Invoice Number"
                      className="text-xs font-mono text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1"
                    />
                    <input
                      type="text"
                      value={ocrResult.vendor_gst}
                      onChange={(e) => setOcrResult({ ...ocrResult, vendor_gst: e.target.value })}
                      placeholder="Vendor GSTIN"
                      className="text-xs font-mono text-slate-500 bg-white border border-slate-200 rounded-lg px-2 py-1"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-bold">TOTAL INVOICE AMOUNT</span>
                  <span className="text-xl font-bold text-[rgb(var(--clr-primary))]">{formatCurrency(ocrResult.total_amount)}</span>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-2.5">Item / Drug Name</th>
                        <th className="p-2.5">Batch #</th>
                        <th className="p-2.5">Expiry Date</th>
                        <th className="p-2.5 w-20">Qty</th>
                        <th className="p-2.5 w-24">Purchase Rate</th>
                        <th className="p-2.5 w-24">MRP</th>
                        <th className="p-2.5 text-right w-24">Amount</th>
                        <th className="p-2.5 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ocrResult.extracted_items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.item_name}
                              onChange={(e) => handleOcrItemChange(idx, 'item_name', e.target.value)}
                              className="w-full font-semibold text-slate-900 bg-transparent border-b border-transparent focus:border-[rgb(var(--clr-primary))] focus:bg-white px-1.5 py-1 rounded text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.batch_number}
                              onChange={(e) => handleOcrItemChange(idx, 'batch_number', e.target.value)}
                              className="w-full font-mono font-bold text-[rgb(var(--clr-primary))] bg-transparent border-b border-transparent focus:border-[rgb(var(--clr-primary))] focus:bg-white px-1.5 py-1 rounded text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={item.expiry_date}
                              onChange={(e) => handleOcrItemChange(idx, 'expiry_date', e.target.value)}
                              className="text-xs text-slate-700 bg-transparent border-b border-transparent focus:border-[rgb(var(--clr-primary))] focus:bg-white px-1.5 py-1 rounded"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleOcrItemChange(idx, 'quantity', e.target.value)}
                              className="w-20 font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-[rgb(var(--clr-primary))] focus:bg-white px-1.5 py-1 rounded text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.1"
                              value={item.purchase_rate}
                              onChange={(e) => handleOcrItemChange(idx, 'purchase_rate', e.target.value)}
                              className="w-24 text-slate-700 bg-transparent border-b border-transparent focus:border-[rgb(var(--clr-primary))] focus:bg-white px-1.5 py-1 rounded text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.1"
                              value={item.mrp}
                              onChange={(e) => handleOcrItemChange(idx, 'mrp', e.target.value)}
                              className="w-24 text-slate-700 bg-transparent border-b border-transparent focus:border-[rgb(var(--clr-primary))] focus:bg-white px-1.5 py-1 rounded text-xs"
                            />
                          </td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteOcrItem(idx)}
                              title="Delete Item"
                              className="text-slate-400 hover:text-red-600 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOcrItem}
                    className="text-xs font-bold gap-1 rounded-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Line Item
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOcrResult(null)}
                      className="text-xs rounded-md"
                    >
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => commitGRNMutation.mutate(ocrResult)}
                      disabled={commitGRNMutation.isPending || ocrResult.extracted_items.length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs shadow-md"
                    >
                      {commitGRNMutation.isPending ? 'Committing to Inventory...' : 'Approve & Stock to Inventory (GRN)'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Past GRNs Table */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm">Goods Received Notes (GRN History)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">GRN #</th>
                    <th className="p-3.5">Vendor Name</th>
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">Total Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {grns.map((g: any) => (
                    <tr key={g.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-[rgb(var(--clr-primary))]">{g.grn_number}</td>
                      <td className="p-3.5 font-bold text-slate-900">{g.vendor_name}</td>
                      <td className="p-3.5 text-slate-600">{g.invoice_number}</td>
                      <td className="p-3.5 font-bold text-slate-900">{formatCurrency(g.total_amount)}</td>
                      <td className="p-3.5">
                        <Badge variant="success" className="text-[10px] uppercase font-bold">{g.status}</Badge>
                      </td>
                      <td className="p-3.5 text-slate-500">{formatDate(g.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: INDENTS */}
        <TabsContent value="indents" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm">Department Pharmacy Indents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Indent #</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Urgency</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {indents.map((ind: any) => (
                    <tr key={ind.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-[rgb(var(--clr-primary))]">{ind.indent_number}</td>
                      <td className="p-3.5 font-bold text-slate-900">{ind.requesting_department}</td>
                      <td className="p-3.5">
                        <Badge variant={ind.urgency === 'Emergency' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {ind.urgency}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        <Badge variant="outline" className="text-[10px] font-bold">{ind.status}</Badge>
                      </td>
                      <td className="p-3.5 text-slate-500">{formatDate(ind.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: PURCHASE ORDERS */}
        <TabsContent value="pos_orders" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm">Vendor Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">PO Number</th>
                    <th className="p-3.5">Vendor Name</th>
                    <th className="p-3.5">Total Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {purchaseOrders.map((po: any) => (
                    <tr key={po.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-[rgb(var(--clr-primary))]">{po.po_number}</td>
                      <td className="p-3.5 font-bold text-slate-900">{po.vendor_name}</td>
                      <td className="p-3.5 font-bold text-slate-900">{formatCurrency(po.total_amount)}</td>
                      <td className="p-3.5">
                        <Badge variant="purple" className="text-[10px] uppercase font-bold">{po.status}</Badge>
                      </td>
                      <td className="p-3.5 text-slate-500">{formatDate(po.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DISPENSE CONFIRMATION & INVOICE RECEIPT MODAL */}
      {dispensedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Dispensing &amp; Invoice Complete!</h3>
                  <p className="text-xs text-emerald-100 font-medium">Inventory stocks deducted via FEFO &amp; invoice recorded in billing</p>
                </div>
              </div>
              <button
                onClick={() => setDispensedInvoice(null)}
                className="text-white/70 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto" id="pharmacy-receipt-area">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900 tracking-tight">VaidyaMD Pharmacy</span>
                    <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-700 bg-emerald-50 font-bold">
                      TAX INVOICE / CASH MEMO
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Dispensed at Counter POS</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900 font-mono">#{dispensedInvoice.invoice_number}</p>
                  <p className="text-[11px] text-slate-500">{new Date(dispensedInvoice.created_at || Date.now()).toLocaleString('en-IN')}</p>
                  <Badge variant="purple" className="text-[9px] uppercase font-bold mt-1">Status: PAID</Badge>
                </div>
              </div>

              {/* Patient Info */}
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Patient Name</span>
                  <span className="font-bold text-slate-900 text-sm">{dispensedInvoice.patient_name || 'Patient'}</span>
                </div>
                {dispensedInvoice.patient_mrn && (
                  <div className="text-right">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Patient ID / MRN</span>
                    <span className="font-mono font-bold text-slate-800">{dispensedInvoice.patient_mrn}</span>
                  </div>
                )}
              </div>

              {/* Dispensed Items Table */}
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2.5">Medication</th>
                      <th className="p-2.5">Batch #</th>
                      <th className="p-2.5 text-center">Expiry</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(dispensedInvoice.dispensed_batches || []).map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800">{item.item_name}</td>
                        <td className="p-2.5 font-mono text-[11px] text-[rgb(var(--clr-primary))]">{item.batch_number}</td>
                        <td className="p-2.5 text-center text-slate-600 text-[11px]">{formatDate(item.expiry_date)}</td>
                        <td className="p-2.5 text-center font-bold text-slate-900">{item.quantity_dispensed}</td>
                        <td className="p-2.5 text-right text-slate-700">{formatCurrency(item.unit_price)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan={5} className="p-2.5 text-right font-bold text-slate-700">Total Billed &amp; Received:</td>
                      <td className="p-2.5 text-right font-black text-sm text-emerald-700">{formatCurrency(dispensedInvoice.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="text-[11px] text-slate-500 bg-emerald-50/70 p-3 rounded-md border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Inventory stock automatically updated. Batches were selected following strict First-Expiry-First-Out (FEFO) medical protocols.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  openPrintFromPOS(dispensedInvoice);
                }}
                className="gap-1.5 text-xs font-bold border-slate-300 hover:border-[rgb(var(--clr-primary))] hover:text-[rgb(var(--clr-primary))]"
              >
                <Printer className="w-4 h-4" />
                Print Pharmacy Receipt / Bill
              </Button>
              <Button
                onClick={() => setDispensedInvoice(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6"
              >
                Done / Next Patient
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Printable A4 Tax Invoice / Pharmacy Receipt */}
      {receiptModalInv && (
        <PrintableInvoice
          invoice={receiptModalInv}
          onClose={() => setReceiptModalInv(null)}
        />
      )}
    </div>
  );
}
