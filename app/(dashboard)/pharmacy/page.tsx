'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { pharmacyApi, patientsApi, billingApi, adminApi } from '@/lib/api';
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
  Download,
  RefreshCw,
  Edit2,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import PrintableInvoice from '@/components/common/PrintableInvoice';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { Skeleton } from '@/shared/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import PageLayout from '@/components/common/PageLayout';

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

  // CSV Stock Batch Import State (Advanced Preview & Overrides - matches Master Settings)
  const [showStockCsvModal, setShowStockCsvModal] = useState(false);
  const [stockCsvFile, setStockCsvFile] = useState<File | null>(null);
  const [stockConflictMode, setStockConflictMode] = useState<'overwrite' | 'skip'>('overwrite');
  const [isStockImporting, setIsStockImporting] = useState(false);
  const [stockImportResult, setStockImportResult] = useState<any | null>(null);
  const [stockImportError, setStockImportError] = useState<string | null>(null);
  const [stockCsvPreviewRows, setStockCsvPreviewRows] = useState<any[]>([]);
  const [stockCsvPreviewData, setStockCsvPreviewData] = useState<any>(null);
  const [isStockPreviewing, setIsStockPreviewing] = useState<boolean>(false);
  const [stockPreviewFilter, setStockPreviewFilter] = useState<'all' | 'overrides' | 'new'>('all');
  const [stockPreviewSearch, setStockPreviewSearch] = useState<string>('');
  const [editingStockRowIndex, setEditingStockRowIndex] = useState<number | null>(null);
  const stockFileInputRef = useRef<HTMLInputElement>(null);

  // Quick Indent & PO Creation Modals
  const [showNewIndentModal, setShowNewIndentModal] = useState(false);
  const [newIndentDept, setNewIndentDept] = useState('IVF OT');
  const [newIndentUrgency, setNewIndentUrgency] = useState('Routine');
  const [newIndentItems, setNewIndentItems] = useState<Array<{ item_name: string; quantity: number; notes: string }>>([
    { item_name: '', quantity: 1, notes: '' },
  ]);
  const [isSubmittingIndent, setIsSubmittingIndent] = useState(false);

  const [showNewPoModal, setShowNewPoModal] = useState(false);
  const [newPoVendor, setNewPoVendor] = useState('');
  const [newPoDeliveryDate, setNewPoDeliveryDate] = useState('');
  const [newPoItems, setNewPoItems] = useState<Array<{ item_name: string; quantity: number; unit_price: number }>>([
    { item_name: '', quantity: 1, unit_price: 0 },
  ]);
  const [isSubmittingPo, setIsSubmittingPo] = useState(false);

  // POS State
  const [posPatientId, setPosPatientId] = useState<string>('');
  const [posPatientSearch, setPosPatientSearch] = useState<string>('');
  const [isPosPatientDropdownOpen, setIsPosPatientDropdownOpen] = useState<boolean>(false);
  const posPatientDropdownRef = useRef<HTMLDivElement>(null);
  const [posCart, setPosCart] = useState<Array<{ item_code: string; item_name: string; quantity: number; unit_price: number; batch_number: string }>>([]);
  const [dispensedInvoice, setDispensedInvoice] = useState<any | null>(null);
  
  const [posDiscount, setPosDiscount] = useState<number>(0);
  const [posAmountPaid, setPosAmountPaid] = useState<number | ''>('');
  const [posPaymentMode, setPosPaymentMode] = useState<string>('Cash');
  const [posPaymentRef, setPosPaymentRef] = useState<string>('');

  // Handle CSV Stock Template Download
  const handleDownloadStockTemplate = async (mode: 'blank' | 'export' = 'blank') => {
    try {
      await adminApi.downloadCsv('pharmacy_stock', mode, `pharmacy_stock_${mode}.csv`);
    } catch {
      // Client-side fallback template download
      const headers = [
        'item_code', 'item_name', 'generic_name', 'category', 'batch_number', 'manufacturer',
        'expiry_date', 'purchase_rate', 'mrp', 'selling_price', 'quantity_received', 'quantity_available',
        'rack_location', 'hsn_code', 'vendor_name'
      ];
      const sampleRow = [
        'DRUG-001', 'Gonal-F 450IU Pen', 'Follitropin Alfa', 'Injections', 'BCH2026-A', 'Merck Serono',
        '2027-12-31', '4500', '5800', '5600', '50', '50',
        'Fridge-1', '3004', 'Apex Pharma'
      ];
      const csvText = [headers.join(','), sampleRow.join(',')].join('\n');
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pharmacy_stock_${mode}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Handle CSV Stock File Selection and Pre-Save Conflict Analysis
  const handleStockFileSelect = async (file: File, mode: 'overwrite' | 'skip' = stockConflictMode) => {
    setStockCsvFile(file);
    setIsStockPreviewing(true);
    setStockImportResult(null);
    setStockImportError(null);
    setStockCsvPreviewData(null);
    setStockCsvPreviewRows([]);
    setEditingStockRowIndex(null);

    try {
      const res = await adminApi.previewCsv('pharmacy_stock', file, mode);
      setStockCsvPreviewData(res);
      setStockCsvPreviewRows(res.stats?.preview_rows || []);
    } catch (err: any) {
      try {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          const fallbackRows = lines.slice(1).map((line, idx) => {
            const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            const rowObj: any = {};
            headers.forEach((h, i) => {
              rowObj[h] = vals[i] || '';
            });
            const bNum = rowObj.batch_number || vals[4] || `BATCH-${idx + 1}`;
            const iName = rowObj.item_name || rowObj.item_code || vals[1] || vals[0] || 'Medication';
            return {
              row_index: idx + 1,
              identifier: `Batch ${bNum}`,
              name: `${iName} (Qty: ${rowObj.quantity_available || rowObj.quantity || 0})`,
              action: 'create',
              is_override: false,
              details: 'Ready to insert into FEFO inventory.',
              raw: rowObj,
            };
          });
          setStockCsvPreviewRows(fallbackRows);
          setStockCsvPreviewData({
            stats: {
              total_rows: fallbackRows.length,
              to_create: fallbackRows.length,
              inserted: fallbackRows.length,
              to_update: 0,
              updated: 0,
              to_skip: 0,
              skipped: 0,
              preview_rows: fallbackRows,
            },
          });
        }
      } catch (clientErr) {
        setStockImportError(err.message || 'Failed to preview CSV stock batches');
      }
    } finally {
      setIsStockPreviewing(false);
    }
  };

  const handleStockConflictModeChange = async (newMode: 'overwrite' | 'skip') => {
    setStockConflictMode(newMode);
    if (stockCsvFile) {
      handleStockFileSelect(stockCsvFile, newMode);
    }
  };

  // Handle CSV Stock Batch Execution with modified row support
  const handleExecuteStockImport = async () => {
    if (!stockCsvFile && stockCsvPreviewRows.length === 0) return;
    setIsStockImporting(true);
    setStockImportResult(null);
    setStockImportError(null);
    try {
      let fileToUpload: File | Blob = stockCsvFile!;
      if (stockCsvPreviewRows.length > 0) {
        const headers = [
          'item_code', 'item_name', 'generic_name', 'category', 'batch_number', 'manufacturer',
          'expiry_date', 'purchase_rate', 'mrp', 'selling_price', 'quantity_received', 'quantity_available',
          'rack_location', 'hsn_code', 'vendor_name', 'branch_code'
        ];
        const csvLines = [headers.join(',')];
        for (const row of stockCsvPreviewRows) {
          const rowVals = headers.map((h) => {
            const val = String(row.raw?.[h] ?? '');
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          });
          csvLines.push(rowVals.join(','));
        }
        fileToUpload = new Blob([csvLines.join('\n')], { type: 'text/csv' });
      }

      const res = await adminApi.importCsv('pharmacy_stock', fileToUpload, stockConflictMode);
      setStockImportResult(res);
      queryClient.invalidateQueries({ queryKey: ['pharmacy-batches'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-grns'] });
      const insertedCount = res.stats?.inserted ?? res.stats?.created ?? 0;
      const updatedCount = res.stats?.updated ?? 0;
      const skippedCount = res.stats?.skipped ?? 0;
      setActionSuccess(`CSV Stock Import completed: ${insertedCount} batches added, ${updatedCount} updated, ${skippedCount} skipped.`);
      setTimeout(() => setActionSuccess(null), 6000);
    } catch (err: any) {
      setStockImportError(err.message || 'Failed to import CSV stock batches');
    } finally {
      setIsStockImporting(false);
    }
  };

  // Handle Indent Creation
  const handleCreateIndent = async () => {
    const validItems = newIndentItems.filter((i) => i.item_name.trim());
    if (validItems.length === 0) {
      alert('Please specify at least one medication item for the indent.');
      return;
    }
    setIsSubmittingIndent(true);
    try {
      await pharmacyApi.createIndent({
        requesting_department: newIndentDept,
        urgency: newIndentUrgency,
        items: validItems,
      });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-indents'] });
      setShowNewIndentModal(false);
      setNewIndentItems([{ item_name: '', quantity: 1, notes: '' }]);
      setActionSuccess(`Indent created successfully for ${newIndentDept}`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to create indent');
    } finally {
      setIsSubmittingIndent(false);
    }
  };

  // Handle Indent Fulfillment
  const handleFulfillIndent = async (id: string) => {
    try {
      await pharmacyApi.updateIndentStatus(id, 'Fulfilled');
      queryClient.invalidateQueries({ queryKey: ['pharmacy-indents'] });
      setActionSuccess('Department indent marked as Fulfilled');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to update indent status');
    }
  };

  // Handle PO Creation
  const handleCreatePO = async () => {
    const validItems = newPoItems.filter((i) => i.item_name.trim());
    if (!newPoVendor.trim()) {
      alert('Please enter vendor / distributor name.');
      return;
    }
    if (validItems.length === 0) {
      alert('Please specify at least one medication item.');
      return;
    }
    setIsSubmittingPo(true);
    try {
      const totalAmount = validItems.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0);
      await pharmacyApi.createPurchaseOrder({
        vendor_name: newPoVendor.trim(),
        expected_delivery_date: newPoDeliveryDate || undefined,
        items: validItems,
        total_amount: totalAmount,
      });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-pos'] });
      setShowNewPoModal(false);
      setNewPoVendor('');
      setNewPoItems([{ item_name: '', quantity: 1, unit_price: 0 }]);
      setActionSuccess('Purchase order created successfully');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to create purchase order');
    } finally {
      setIsSubmittingPo(false);
    }
  };

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
    const payMode = (inv.payment_method || '').toLowerCase();
    return num.includes(q) || patName.includes(q) || patVid.includes(q) || payMode.includes(q);
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
      paid_amount: invData.paid_amount || invData.total_amount || 0,
      payment_method: invData.payment_method || posPaymentMode || 'Cash',
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
      payment_method: inv.payment_method || 'Cash',
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
        payment_method: posPaymentMode,
        payment_ref: posPaymentRef ? posPaymentRef.trim() : undefined,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-batches'] });
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-invoices'] });
      setPosCart([]);
      setPosDiscount(0);
      setPosAmountPaid('');
      setPosPaymentMode('Cash');
      setPosPaymentRef('');
      setDispensedInvoice(data);
      setActionSuccess(`Prescription successfully dispensed! Invoice #${data.invoice_number} created (Mode: ${data.payment_method || posPaymentMode}).`);
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
    <PageLayout className="space-y-6">
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

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowStockCsvModal(true)}
            variant="outline"
            className="gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold h-9 rounded-md shadow-xs text-xs"
          >
            <UploadCloud className="w-4 h-4 text-emerald-600" />
            <span>CSV Batch Stock Import</span>
          </Button>

          <Button
            onClick={() => setActiveTab('ocr_grn')}
            className="gap-2 bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold h-9 rounded-md shadow-sm text-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Smart OCR Invoice (WIP)</span>
          </Button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-md h-11 flex-wrap">
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
            <span>AI OCR Invoice (WIP)</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-200 text-amber-900 ml-1">WIP</span>
          </TabsTrigger>
          <TabsTrigger value="indents" className="rounded-lg text-xs font-bold gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Department Indents ({indents.length})</span>
          </TabsTrigger>
          <TabsTrigger value="pos_orders" className="rounded-lg text-xs font-bold gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            <span>Purchase Orders ({purchaseOrders.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: INVENTORY BATCHES & FEFO */}
        <TabsContent value="inventory" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drug, generic, batch, code..."
                className="pl-9 h-9 text-xs rounded-md"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setShowStockCsvModal(true)}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 rounded-md shadow-xs"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>CSV Batch Stock Import</span>
              </Button>
              <Badge variant="purple" className="text-xs font-bold py-1.5 px-3">
                FEFO Sorting Active (Nearest Expiry First)
              </Badge>
            </div>
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
                {batchesLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        <span>Loading pharmacy stock batches...</span>
                      </div>
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-700 text-sm">No Stock Batches Found</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                        {searchQuery
                          ? `No batches matching "${searchQuery}". Try another keyword or clear search.`
                          : 'Import inventory batches in bulk via CSV or ingest vendor invoices to stock medicines.'}
                      </p>
                      <div className="flex justify-center gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => setShowStockCsvModal(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-md gap-1.5 shadow-sm"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Batch Import CSV</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveTab('ocr_grn')}
                          className="text-xs font-bold h-8 px-3"
                        >
                          <span>Vendor Invoice (OCR WIP / Manual)</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  batches.map((b: any) => {
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
                  })
                )}
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

                    {/* Payment Mode Selector for Records */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-bold">Mode of Payment:</span>
                        <select
                          value={posPaymentMode}
                          onChange={(e) => setPosPaymentMode(e.target.value)}
                          className="h-7 text-xs font-semibold bg-white border border-slate-300 rounded px-2 text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI / QR Code</option>
                          <option value="Card">Credit / Debit Card</option>
                          <option value="Net Banking">Net Banking</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Insurance">Insurance / TPA</option>
                          <option value="Wallet">Advance Wallet</option>
                        </select>
                      </div>

                      {posPaymentMode !== 'Cash' && (
                        <div className="flex items-center justify-between text-xs gap-2 pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500 text-[11px] flex-shrink-0">Txn / Ref No:</span>
                          <Input
                            type="text"
                            value={posPaymentRef}
                            onChange={(e) => setPosPaymentRef(e.target.value)}
                            placeholder={posPaymentMode === 'UPI' ? 'UPI Ref / UTR' : posPaymentMode === 'Card' ? 'Card Last 4 digits' : 'Reference / Cheque No'}
                            className="h-6 text-xs bg-white text-slate-800"
                          />
                        </div>
                      )}
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
                  <th className="p-3.5 text-center">Payment Mode</th>
                  <th className="p-3.5 text-center">Payment Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {invoicesLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        <span>Loading pharmacy invoices...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPharmacyInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
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
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-sky-50 text-sky-800 border border-sky-200">
                            {inv.payment_method || 'Cash'}
                          </span>
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
          {/* WIP Banner & Guidance */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-amber-900">AI OCR Invoice Ingestion — Work In Progress (WIP)</span>
                  <Badge variant="outline" className="text-[10px] bg-amber-200/80 text-amber-900 border-amber-400 font-extrabold uppercase">
                    WIP Beta
                  </Badge>
                </div>
                <p className="text-[11px] text-amber-800/90 mt-1 leading-relaxed">
                  Automated OCR scanning for vendor tax invoices is under active development. You can test the beta OCR parser below, use <strong>Manual Invoice Entry</strong>, or use our <strong>CSV Batch Stock Import</strong> to stock medications immediately into FEFO inventory.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                type="button"
                size="sm"
                onClick={() => setShowStockCsvModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-md gap-1.5 shadow-sm"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>CSV Stock Import</span>
              </Button>
            </div>
          </div>

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
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Goods Received Notes (GRN History)</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Formulary stocking receipts committed into hospital inventory</p>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {grns.length} GRNs Recorded
              </Badge>
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
                  {grns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700 text-xs">No Goods Received Notes (GRN) Yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                          Verified vendor invoices and bulk CSV stock entries committed into inventory will be logged here.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    grns.map((g: any) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: INDENTS */}
        <TabsContent value="indents" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Department Pharmacy Indents</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Medicine transfer requests raised by IVF OT, Daycare, and Inpatient Wards</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowNewIndentModal(true)}
                className="bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold text-xs h-8 px-3 rounded-md shadow-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Raise Department Indent</span>
              </Button>
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
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {indents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700 text-xs">No Department Indents Requested</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                          Wards and procedure rooms can submit clinical medication indents for stock dispatch.
                        </p>
                        <div className="mt-3">
                          <Button
                            size="sm"
                            onClick={() => setShowNewIndentModal(true)}
                            className="bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-bold text-xs h-8 px-3 rounded-md gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Raise First Indent</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    indents.map((ind: any) => {
                      const isPending = (ind.status || '').toLowerCase() === 'pending';
                      return (
                        <tr key={ind.id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-mono font-bold text-[rgb(var(--clr-primary))]">{ind.indent_number}</td>
                          <td className="p-3.5 font-bold text-slate-900">{ind.requesting_department}</td>
                          <td className="p-3.5">
                            <Badge
                              variant={ind.urgency === 'Emergency' ? 'destructive' : ind.urgency === 'Urgent' ? 'outline' : 'secondary'}
                              className={`text-[10px] font-bold ${ind.urgency === 'Urgent' ? 'border-amber-400 bg-amber-50 text-amber-800' : ''}`}
                            >
                              {ind.urgency}
                            </Badge>
                          </td>
                          <td className="p-3.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                ind.status === 'Fulfilled' || ind.status === 'Approved'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                  : 'border-amber-300 bg-amber-50 text-amber-800'
                              }`}
                            >
                              {ind.status}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-slate-500">{formatDate(ind.created_at)}</td>
                          <td className="p-3.5 text-right">
                            {isPending ? (
                              <Button
                                size="sm"
                                onClick={() => handleFulfillIndent(ind.id)}
                                className="h-7 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded px-2.5"
                              >
                                Fulfill Indent
                              </Button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: PURCHASE ORDERS */}
        <TabsContent value="pos_orders" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Vendor Purchase Orders</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Procurement orders dispatched to approved pharmaceutical distributors</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowNewPoModal(true)}
                className="bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold text-xs h-8 px-3 rounded-md shadow-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create Purchase Order</span>
              </Button>
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
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700 text-xs">No Vendor Purchase Orders</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                          Create formal purchase orders to send to pharmaceutical distributors for supply replenishment.
                        </p>
                        <div className="mt-3">
                          <Button
                            size="sm"
                            onClick={() => setShowNewPoModal(true)}
                            className="bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-bold text-xs h-8 px-3 rounded-md gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create First Purchase Order</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po: any) => (
                      <tr key={po.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-mono font-bold text-[rgb(var(--clr-primary))]">{po.po_number}</td>
                        <td className="p-3.5 font-bold text-slate-900">{po.vendor_name}</td>
                        <td className="p-3.5 font-bold text-slate-900">{formatCurrency(po.total_amount)}</td>
                        <td className="p-3.5">
                          <Badge variant="purple" className="text-[10px] uppercase font-bold">{po.status}</Badge>
                        </td>
                        <td className="p-3.5 text-slate-500">{formatDate(po.created_at)}</td>
                      </tr>
                    ))
                  )}
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

      {/* MODAL 1: CSV BATCH STOCK IMPORT (MATCHING MASTER SETTINGS ADVANCED PREVIEW) */}
      {showStockCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>CSV Batch Stock Import</span>
                    <span className="text-[10px] font-normal px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono">11b_pharmacy_stock.csv</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Formulary Medicines, FEFO Batches, Expiry Dates &amp; Unit Pricing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowStockCsvModal(false);
                  setStockCsvFile(null);
                  setStockCsvPreviewRows([]);
                  setStockCsvPreviewData(null);
                  setStockImportResult(null);
                  setStockImportError(null);
                  setEditingStockRowIndex(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              {/* Step 1: Download Templates Strip */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>1. Standard Pharmacy RFC-4180 CSV Template</span>
                  </p>
                  <p className="text-[11px] text-slate-500">Headers: item_code, item_name, batch_number, expiry_date, mrp, purchase_rate, quantity_available...</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadStockTemplate('blank')}
                    className="text-xs font-semibold h-8 gap-1.5 border-slate-300"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Blank Template</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadStockTemplate('export')}
                    className="text-xs font-semibold h-8 gap-1.5 border-slate-300"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Live Stock</span>
                  </Button>
                </div>
              </div>

              {/* Step 2: Conflict Policy Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">2. Existing Batch Conflict Resolution Policy:</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-colors ${
                      stockConflictMode === 'overwrite'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="stock_conflict"
                      checked={stockConflictMode === 'overwrite'}
                      onChange={() => handleStockConflictModeChange('overwrite')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold block text-xs">⚡ Overwrite (Upsert)</span>
                      <span className="text-[10px] text-slate-500 font-normal">Updates existing batches with CSV quantity, MRP &amp; expiry</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-colors ${
                      stockConflictMode === 'skip'
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="stock_conflict"
                      checked={stockConflictMode === 'skip'}
                      onChange={() => handleStockConflictModeChange('skip')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold block text-xs">○ Skip Existing</span>
                      <span className="text-[10px] text-slate-500 font-normal">Only inserts newly discovered batches; preserves live inventory</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 3: File Selector / Dropzone */}
              {!stockCsvFile ? (
                <div
                  onClick={() => stockFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-7 text-center cursor-pointer bg-slate-50/50 transition-colors"
                >
                  <UploadCloud className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <span className="font-bold text-slate-800 block text-sm">3. Click to select Pharmacy CSV File</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Select a CSV batch file matching the 16 canonical formulary headers
                  </span>
                  <input
                    ref={stockFileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleStockFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-xs border border-slate-200">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">{stockCsvFile.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(stockCsvFile.size / 1024).toFixed(1)} KB · {stockCsvPreviewRows.length} batch rows detected
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStockCsvFile(null);
                      setStockCsvPreviewRows([]);
                      setStockCsvPreviewData(null);
                      setStockImportResult(null);
                      setStockImportError(null);
                      setEditingStockRowIndex(null);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1 rounded-md hover:bg-rose-50"
                  >
                    Change File
                  </button>
                </div>
              )}

              {/* Ingestion Conflict Analysis Progress */}
              {isStockPreviewing && (
                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <RefreshCw className="w-6 h-6 text-emerald-600 mx-auto animate-spin" />
                  <p className="font-semibold text-xs text-slate-800">Analyzing CSV rows &amp; cross-referencing pharmacy inventory...</p>
                  <p className="text-[10px] text-slate-400">Verifying batch numbers, expiry dates, and duplicate stock entries</p>
                </div>
              )}

              {/* Interactive Ingestion Table & Conflict Metrics */}
              {!isStockPreviewing && stockCsvPreviewRows.length > 0 && !stockImportResult && (
                <div className="space-y-3">
                  {/* Summary Badges Bar */}
                  <div className="grid grid-cols-4 gap-2 text-center font-mono">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Total Rows</div>
                      <div className="text-base font-bold text-slate-800">{stockCsvPreviewRows.length}</div>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <div className="text-[9px] uppercase font-bold text-emerald-600">New Batches (Insert)</div>
                      <div className="text-base font-bold text-emerald-700">
                        {stockCsvPreviewRows.filter((r) => !r.is_override).length}
                      </div>
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <div className="text-[9px] uppercase font-bold text-amber-700 flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Overrides (Update)</span>
                      </div>
                      <div className="text-base font-bold text-amber-800">
                        {stockCsvPreviewRows.filter((r) => r.is_override && stockConflictMode === 'overwrite').length}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Skipped</div>
                      <div className="text-base font-bold text-slate-500">
                        {stockCsvPreviewRows.filter((r) => r.is_override && stockConflictMode === 'skip').length}
                      </div>
                    </div>
                  </div>

                  {/* Filter tabs and search */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setStockPreviewFilter('all')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          stockPreviewFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All ({stockCsvPreviewRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStockPreviewFilter('overrides')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          stockPreviewFilter === 'overrides' ? 'bg-amber-500 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Overrides ({stockCsvPreviewRows.filter((r) => r.is_override).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStockPreviewFilter('new')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          stockPreviewFilter === 'new' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        New ({stockCsvPreviewRows.filter((r) => !r.is_override).length})
                      </button>
                    </div>

                    <div className="relative w-56">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search batch or medicine..."
                        value={stockPreviewSearch}
                        onChange={(e) => setStockPreviewSearch(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Rows Inspection Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="py-2 px-3 w-12 text-center">#</th>
                          <th className="py-2 px-3 w-28">Action</th>
                          <th className="py-2 px-3">Batch Identifier</th>
                          <th className="py-2 px-3">Medication &amp; Quantity</th>
                          <th className="py-2 px-3">Status / Ingestion Details</th>
                          <th className="py-2 px-3 text-right w-20">Edit/Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stockCsvPreviewRows
                          .filter((r) => {
                            if (stockPreviewFilter === 'overrides' && !r.is_override) return false;
                            if (stockPreviewFilter === 'new' && r.is_override) return false;
                            if (stockPreviewSearch) {
                              const q = stockPreviewSearch.toLowerCase();
                              return (
                                r.identifier?.toLowerCase().includes(q) ||
                                r.name?.toLowerCase().includes(q) ||
                                r.details?.toLowerCase().includes(q)
                              );
                            }
                            return true;
                          })
                          .map((row) => (
                            <tr key={row.row_index} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{row.row_index}</td>
                              <td className="py-2 px-3">
                                {row.is_override ? (
                                  stockConflictMode === 'overwrite' ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                      <span>Override</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 w-fit block">
                                      Skip
                                    </span>
                                  )
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>New Batch</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-800 text-[11px]">{row.identifier}</td>
                              <td className="py-2 px-3 text-slate-700 font-medium">{row.name}</td>
                              <td className="py-2 px-3 text-slate-500 text-[11px]">{row.details}</td>
                              <td className="py-2 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingStockRowIndex(row.row_index)}
                                    title="Edit Row"
                                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStockCsvPreviewRows(stockCsvPreviewRows.filter((r) => r.row_index !== row.row_index));
                                    }}
                                    title="Exclude Row"
                                    className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {stockImportError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{stockImportError}</span>
                </div>
              )}

              {/* Success Result */}
              {stockImportResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>CSV Stock Ingestion Successful!</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                    <div className="bg-white p-2 rounded-lg border border-emerald-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Rows</p>
                      <p className="text-sm font-bold text-slate-800">{stockImportResult.stats?.total_rows || 0}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-200">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">Inserted</p>
                      <p className="text-sm font-bold text-emerald-700">{stockImportResult.stats?.inserted ?? stockImportResult.stats?.created ?? 0}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-200">
                      <p className="text-[10px] text-primary font-bold uppercase">Updated</p>
                      <p className="text-sm font-bold text-primary">{stockImportResult.stats?.updated || 0}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Skipped</p>
                      <p className="text-sm font-bold text-slate-500">{stockImportResult.stats?.skipped || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowStockCsvModal(false);
                  setStockCsvFile(null);
                  setStockCsvPreviewRows([]);
                  setStockCsvPreviewData(null);
                  setStockImportResult(null);
                  setStockImportError(null);
                  setEditingStockRowIndex(null);
                }}
                className="text-xs font-semibold h-9"
              >
                Close
              </Button>

              <Button
                type="button"
                disabled={(!stockCsvFile && stockCsvPreviewRows.length === 0) || isStockImporting || isStockPreviewing}
                onClick={handleExecuteStockImport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-6 gap-2 shadow-sm"
              >
                {isStockImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Ingesting Stock Batches...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Execute Stock Ingestion ({stockCsvPreviewRows.length} Rows)</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* INLINE ROW EDITOR MODAL FOR STOCK CSV PREVIEW */}
      {editingStockRowIndex !== null && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h4 className="font-bold text-slate-900 text-sm">Modify CSV Row #{editingStockRowIndex} Before Ingesting</h4>
              <button
                type="button"
                onClick={() => setEditingStockRowIndex(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {(() => {
              const targetRow = stockCsvPreviewRows.find((r) => r.row_index === editingStockRowIndex);
              if (!targetRow) return null;
              const raw = targetRow.raw || {};
              return (
                <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Batch Number</label>
                      <input
                        type="text"
                        value={raw.batch_number || ''}
                        onChange={(e) => {
                          const updated = { ...raw, batch_number: e.target.value };
                          setStockCsvPreviewRows(
                            stockCsvPreviewRows.map((r) =>
                              r.row_index === editingStockRowIndex
                                ? { ...r, identifier: `Batch ${e.target.value}`, raw: updated }
                                : r
                            )
                          );
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Item Code</label>
                      <input
                        type="text"
                        value={raw.item_code || ''}
                        onChange={(e) => {
                          const updated = { ...raw, item_code: e.target.value };
                          setStockCsvPreviewRows(
                            stockCsvPreviewRows.map((r) =>
                              r.row_index === editingStockRowIndex ? { ...r, raw: updated } : r
                            )
                          );
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Medication Name</label>
                    <input
                      type="text"
                      value={raw.item_name || ''}
                      onChange={(e) => {
                        const updated = { ...raw, item_name: e.target.value };
                        setStockCsvPreviewRows(
                          stockCsvPreviewRows.map((r) =>
                            r.row_index === editingStockRowIndex
                              ? { ...r, name: `${e.target.value} (Qty: ${raw.quantity_available || 0})`, raw: updated }
                              : r
                          )
                        );
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={raw.expiry_date ? raw.expiry_date.slice(0, 10) : ''}
                        onChange={(e) => {
                          const updated = { ...raw, expiry_date: e.target.value };
                          setStockCsvPreviewRows(
                            stockCsvPreviewRows.map((r) =>
                              r.row_index === editingStockRowIndex ? { ...r, raw: updated } : r
                            )
                          );
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={raw.quantity_available || raw.quantity || ''}
                        onChange={(e) => {
                          const updated = { ...raw, quantity_available: e.target.value, quantity_received: e.target.value };
                          setStockCsvPreviewRows(
                            stockCsvPreviewRows.map((r) =>
                              r.row_index === editingStockRowIndex
                                ? { ...r, name: `${raw.item_name || 'Med'} (Qty: ${e.target.value})`, raw: updated }
                                : r
                            )
                          );
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">MRP (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={raw.mrp || ''}
                        onChange={(e) => {
                          const updated = { ...raw, mrp: e.target.value, selling_price: e.target.value };
                          setStockCsvPreviewRows(
                            stockCsvPreviewRows.map((r) =>
                              r.row_index === editingStockRowIndex ? { ...r, raw: updated } : r
                            )
                          );
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rack Location</label>
                      <input
                        type="text"
                        value={raw.rack_location || ''}
                        onChange={(e) => {
                          const updated = { ...raw, rack_location: e.target.value };
                          setStockCsvPreviewRows(
                            stockCsvPreviewRows.map((r) =>
                              r.row_index === editingStockRowIndex ? { ...r, raw: updated } : r
                            )
                          );
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Branch Code</label>
                      <input
                        type="text"
                        value={raw.branch_code || ''}
                        onChange={(e) => {
                          const updated = { ...raw, branch_code: e.target.value };
                          setStockCsvPreviewRows(
                            stockCsvPreviewRows.map((r) =>
                              r.row_index === editingStockRowIndex ? { ...r, raw: updated } : r
                            )
                          );
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                onClick={() => setEditingStockRowIndex(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Save Row Modifications
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RAISE DEPARTMENT PHARMACY INDENT */}
      {showNewIndentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[rgb(var(--clr-primary)/0.1)] text-[rgb(var(--clr-primary))] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Raise Department Pharmacy Indent</h3>
                  <p className="text-[11px] text-slate-500">Request medications and consumables from hospital pharmacy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewIndentModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Requesting Department *
                  </label>
                  <select
                    value={newIndentDept}
                    onChange={(e) => setNewIndentDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="IVF OT">IVF OT</option>
                    <option value="Inpatient Ward (IPD)">Inpatient Ward (IPD)</option>
                    <option value="Daycare Procedure Room">Daycare Procedure Room</option>
                    <option value="OPD Consultation Suite">OPD Consultation Suite</option>
                    <option value="Cosmetic Gynecology">Cosmetic Gynecology</option>
                    <option value="Andrology Laboratory">Andrology Laboratory</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Urgency Priority *
                  </label>
                  <select
                    value={newIndentUrgency}
                    onChange={(e) => setNewIndentUrgency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="Routine">Routine (Within shift)</option>
                    <option value="Urgent">Urgent (Within 1 hour)</option>
                    <option value="Emergency">Emergency (Immediate)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Requested Medications / Items *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewIndentItems([...newIndentItems, { item_name: '', quantity: 1, notes: '' }])}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newIndentItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        placeholder="Drug / Consumable Name (e.g. Inj Progesterone 100mg)"
                        value={item.item_name}
                        onChange={(e) => {
                          const updated = [...newIndentItems];
                          updated[idx].item_name = e.target.value;
                          setNewIndentItems(updated);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...newIndentItems];
                          updated[idx].quantity = parseInt(e.target.value) || 1;
                          setNewIndentItems(updated);
                        }}
                        className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 text-center"
                      />
                      {newIndentItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewIndentItems(newIndentItems.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewIndentModal(false)}
                className="text-xs font-semibold h-9"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSubmittingIndent}
                onClick={handleCreateIndent}
                className="bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-bold text-xs h-9 px-5 gap-1.5"
              >
                {isSubmittingIndent ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Indent...</span>
                  </>
                ) : (
                  <span>Submit Indent</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE VENDOR PURCHASE ORDER */}
      {showNewPoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[rgb(var(--clr-primary)/0.1)] text-[rgb(var(--clr-primary))] flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Create Vendor Purchase Order</h3>
                  <p className="text-[11px] text-slate-500">Official order for pharmaceutical distributor replenishment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPoModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Vendor / Distributor Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Pharma Distributors"
                    value={newPoVendor}
                    onChange={(e) => setNewPoVendor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={newPoDeliveryDate}
                    onChange={(e) => setNewPoDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Order Line Items *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPoItems([...newPoItems, { item_name: '', quantity: 1, unit_price: 0 }])}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Line Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newPoItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        placeholder="Item / Drug Name"
                        value={item.item_name}
                        onChange={(e) => {
                          const updated = [...newPoItems];
                          updated[idx].item_name = e.target.value;
                          setNewPoItems(updated);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...newPoItems];
                          updated[idx].quantity = parseInt(e.target.value) || 1;
                          setNewPoItems(updated);
                        }}
                        className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 text-center"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Rate ₹"
                        value={item.unit_price || ''}
                        onChange={(e) => {
                          const updated = [...newPoItems];
                          updated[idx].unit_price = parseFloat(e.target.value) || 0;
                          setNewPoItems(updated);
                        }}
                        className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 text-right"
                      />
                      {newPoItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewPoItems(newPoItems.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-right text-xs font-bold text-slate-700">
                  Total Order Value: {formatCurrency(newPoItems.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewPoModal(false)}
                className="text-xs font-semibold h-9"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSubmittingPo}
                onClick={handleCreatePO}
                className="bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-bold text-xs h-9 px-5 gap-1.5"
              >
                {isSubmittingPo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating PO...</span>
                  </>
                ) : (
                  <span>Create Purchase Order</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
