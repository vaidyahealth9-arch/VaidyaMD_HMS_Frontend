'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { pharmacyApi, patientsApi } from '@/lib/api';
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
  DollarSign,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PharmacyPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'inventory' | 'ocr_grn' | 'pos' | 'indents' | 'pos_orders'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // POS State
  const [posPatientId, setPosPatientId] = useState<string>('');
  const [posCart, setPosCart] = useState<Array<{ item_code: string; item_name: string; quantity: number; unit_price: number; batch_number: string }>>([]);

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
  const patients = patientsData?.items || [];

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
    mutationFn: () =>
      pharmacyApi.dispenseFEFO({
        patient_id: posPatientId,
        items: posCart.map((i) => ({ item_code: i.item_code, quantity: i.quantity })),
        doctor_id: user?.id,
        notes: 'Dispensed via Point of Sale counter',
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-batches'] });
      setPosCart([]);
      setActionSuccess(`Prescription successfully dispensed! Invoice #${data.invoice_number} created.`);
      setTimeout(() => setActionSuccess(null), 5000);
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
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight">Pharmacy & Supply Chain</h1>
            <p className="text-xs text-slate-500 font-medium">Smart AI OCR invoice ingestion, FEFO inventory, and point-of-sale dispensing</p>
          </div>
        </div>

        <Button
          onClick={() => setActiveTab('ocr_grn')}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 rounded-xl shadow-md text-xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>Smart OCR Invoice Ingestion</span>
        </Button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-11">
          <TabsTrigger value="inventory" className="rounded-lg text-xs font-bold gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Stock Inventory & FEFO ({batches.length})</span>
          </TabsTrigger>
          <TabsTrigger value="pos" className="rounded-lg text-xs font-bold gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Dispensing POS</span>
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
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
            <Badge variant="purple" className="text-xs font-bold">
              FEFO Sorting Active (Nearest Expiry First)
            </Badge>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                      <td className="p-3.5 font-mono font-bold text-indigo-700">{b.batch_number}</td>
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
                        <span className={`font-black ${isLowStock ? 'text-amber-600' : 'text-slate-800'}`}>
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
                          className="h-7 text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
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
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Patient Search</label>
                    <input
                      type="text"
                      list="posPatientsList"
                      placeholder="Type name or ID to search..."
                      value={
                        patients.find((p: any) => p.id === posPatientId)
                          ? `${patients.find((p: any) => p.id === posPatientId)?.name} (${patients.find((p: any) => p.id === posPatientId)?.mrn || patients.find((p: any) => p.id === posPatientId)?.vid})`
                          : posPatientId
                      }
                      onChange={(e) => {
                        const match = patients.find((p: any) => `${p.name} (${p.mrn || p.vid})` === e.target.value);
                        setPosPatientId(match ? match.id : e.target.value);
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <datalist id="posPatientsList">
                      {patients.map((p: any) => (
                        <option key={p.id} value={`${p.name} (${p.mrn || p.vid})`} />
                      ))}
                    </datalist>
                  </div>
                </CardContent>
              </Card>

              {/* Fast Stock Selector Grid */}
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm">Available Medications (1-Click Add)</CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {batches.slice(0, 8).map((b: any) => (
                    <div
                      key={b.id}
                      onClick={() => handleAddToCart(b)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/40 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-xs text-slate-900 truncate">{b.item_name}</p>
                        <p className="text-[10px] text-slate-500">
                          Batch: {b.batch_number} · Exp: {formatDate(b.expiry_date)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-indigo-700">{formatCurrency(b.selling_price || b.mrp)}</p>
                        <span className="text-[10px] font-semibold text-emerald-600">{b.quantity_available} in stock</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right: Cart & Dispensing Summary */}
            <div className="space-y-4">
              <Card className="border-indigo-200">
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

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Subtotal:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black">
                      <span className="text-indigo-900">Total Billed:</span>
                      <span className="text-indigo-700">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => dispenseMutation.mutate()}
                    disabled={dispenseMutation.isPending || !posPatientId || posCart.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl shadow-md text-xs mt-2"
                  >
                    {dispenseMutation.isPending ? 'Dispensing & Deducting Stock...' : '1-Click Dispense & Bill'}
                  </Button>
                </CardContent>
              </Card>
            </div>
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
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all bg-white cursor-pointer ${
              isDragging ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]' : 'border-slate-300 hover:border-indigo-400'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
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
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
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
                  className="text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl"
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
            <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-sm animate-pulse">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI Optical Character Recognition (OCR) Parsing Invoice Line Items...</span>
              </div>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-28 w-full" />
            </div>
          )}

          {/* Interactive OCR Pre-Commit Verification Grid */}
          {ocrResult && (
            <Card className="border-indigo-300 shadow-md">
              <CardHeader className="pb-3 border-b border-slate-100 bg-indigo-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
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
                      className="font-bold text-sm text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-500"
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
                  <span className="text-xl font-black text-indigo-700">{formatCurrency(ocrResult.total_amount)}</span>
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
                              className="w-full font-semibold text-slate-900 bg-transparent border-b border-transparent focus:border-indigo-400 focus:bg-white px-1.5 py-1 rounded text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.batch_number}
                              onChange={(e) => handleOcrItemChange(idx, 'batch_number', e.target.value)}
                              className="w-full font-mono font-bold text-indigo-700 bg-transparent border-b border-transparent focus:border-indigo-400 focus:bg-white px-1.5 py-1 rounded text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={item.expiry_date}
                              onChange={(e) => handleOcrItemChange(idx, 'expiry_date', e.target.value)}
                              className="text-xs text-slate-700 bg-transparent border-b border-transparent focus:border-indigo-400 focus:bg-white px-1.5 py-1 rounded"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleOcrItemChange(idx, 'quantity', e.target.value)}
                              className="w-20 font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-indigo-400 focus:bg-white px-1.5 py-1 rounded text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.1"
                              value={item.purchase_rate}
                              onChange={(e) => handleOcrItemChange(idx, 'purchase_rate', e.target.value)}
                              className="w-24 text-slate-700 bg-transparent border-b border-transparent focus:border-indigo-400 focus:bg-white px-1.5 py-1 rounded text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.1"
                              value={item.mrp}
                              onChange={(e) => handleOcrItemChange(idx, 'mrp', e.target.value)}
                              className="w-24 text-slate-700 bg-transparent border-b border-transparent focus:border-indigo-400 focus:bg-white px-1.5 py-1 rounded text-xs"
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
                    className="text-xs font-bold gap-1 rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Line Item
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOcrResult(null)}
                      className="text-xs rounded-xl"
                    >
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => commitGRNMutation.mutate(ocrResult)}
                      disabled={commitGRNMutation.isPending || ocrResult.extracted_items.length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
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
                      <td className="p-3.5 font-mono font-bold text-indigo-700">{g.grn_number}</td>
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
                      <td className="p-3.5 font-mono font-bold text-indigo-700">{ind.indent_number}</td>
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
                      <td className="p-3.5 font-mono font-bold text-indigo-700">{po.po_number}</td>
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
    </div>
  );
}
