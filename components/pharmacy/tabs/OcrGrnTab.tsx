'use client';

import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { pharmacyApi } from '@/lib/api';
import {
  UploadCloud,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Truck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';

interface OcrGrnTabProps {
  grns: any[];
  onOpenCsvModal: () => void;
  onSuccess?: (message: string) => void;
}

export default function OcrGrnTab({
  grns,
  onOpenCsvModal,
  onSuccess,
}: OcrGrnTabProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isDragging, setIsDragging] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);

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
      onSuccess?.('Vendor invoice processed & stock committed to FEFO inventory!');
      
    },
    onError: (err: any) => {
      import('@/contexts/ToastContext').then(({ toast }) => toast.error('GRN Commit Failed', err.message || 'Failed to save inventory'));
    },
  });


  return (
    <div className="space-y-4 pt-2">
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
                onClick={() => onOpenCsvModal()}
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

    </div>
  );
}
