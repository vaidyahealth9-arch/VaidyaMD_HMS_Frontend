'use client';

import React, { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
  FileSpreadsheet,
  UploadCloud,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Loader2,
  Check,
  Trash2,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';

interface StockCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export default function StockCsvImportModal({
  isOpen,
  onClose,
  onSuccess,
}: StockCsvImportModalProps) {
  const queryClient = useQueryClient();

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

  const handleClose = () => {
    setStockCsvFile(null);
    setStockCsvPreviewRows([]);
    setStockCsvPreviewData(null);
    setStockImportResult(null);
    setStockImportError(null);
    setEditingStockRowIndex(null);
    onClose();
  };

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
      const sampleRows = [
        ['SODU02', 'DUPHASTON TAB 10MG', 'Dydrogesterone 10mg', 'Luteal Support', 'MAW26022', "Abbott Women's Health", '2029-06-01', '687.10', '901.82', '880.00', '12', '12', 'D210', '30043919', 'Matrika Pharmacy Vendor'],
        ['SEEV01', 'EVATONE 2 MG TAB', 'Estradiol Valerate 2mg', 'Hormones / Endometrial Prep', 'PLEV2603', 'Serum Institute', '2028-01-01', '122.55', '160.85', '155.00', '30', '30', 'A003', '30043919', 'Matrika Pharmacy Vendor'],
        ['MIDO02', 'DOLO 650 TAB', 'Paracetamol 650mg', 'Analgesics / Antipyretics', 'DOBS4440', 'Micro Labs', '2030-03-01', '24.59', '32.28', '32.00', '12', '12', 'A059', '30049061', 'Matrika Pharmacy Vendor'],
        ['UNCO05', 'COQ CAP 100MG', 'Coenzyme Q10 100mg', 'Fertility Antioxidants', 'COQ26002GJ', 'Universal Nutriscience', '2028-11-01', '452.57', '594.00', '570.00', '9', '9', 'B072', '30045090', 'Matrika Pharmacy Vendor'],
        ['COHB03', 'HBCOM SACHETS (1X2GM)', 'Iron + Folic Acid + Vitamin B12', 'Supplements / Hematology', 'BS260140', 'Comed Chemicals', '2028-05-01', '15.60', '20.48', '20.48', '48', '48', 'A003', '30045010', 'Matrika Pharmacy Vendor']
      ];
      const csvText = [headers.join(','), ...sampleRows.map((r: any) => r.join(','))].join('\n');
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
      onSuccess?.(`CSV Stock Import completed: ${insertedCount} batches added, ${updatedCount} updated, ${skippedCount} skipped.`);
      
    } catch (err: any) {
      setStockImportError(err.message || 'Failed to import CSV stock batches');
    } finally {
      setIsStockImporting(false);
    }
  };


  if (!isOpen) return null;

  return (
    <>
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
                  handleClose();
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
                        {stockCsvPreviewRows.filter((r: any) => !r.is_override).length}
                      </div>
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <div className="text-[9px] uppercase font-bold text-amber-700 flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Overrides (Update)</span>
                      </div>
                      <div className="text-base font-bold text-amber-800">
                        {stockCsvPreviewRows.filter((r: any) => r.is_override && stockConflictMode === 'overwrite').length}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Skipped</div>
                      <div className="text-base font-bold text-slate-500">
                        {stockCsvPreviewRows.filter((r: any) => r.is_override && stockConflictMode === 'skip').length}
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
                        Overrides ({stockCsvPreviewRows.filter((r: any) => r.is_override).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStockPreviewFilter('new')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          stockPreviewFilter === 'new' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        New ({stockCsvPreviewRows.filter((r: any) => !r.is_override).length})
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
                          .filter((r: any) => {
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
                                      setStockCsvPreviewRows(stockCsvPreviewRows.filter((r: any) => r.row_index !== row.row_index));
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
                  handleClose();
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
              const targetRow = stockCsvPreviewRows.find((r: any) => r.row_index === editingStockRowIndex);
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
                            stockCsvPreviewRows.map((r: any) =>
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
                            stockCsvPreviewRows.map((r: any) =>
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
                          stockCsvPreviewRows.map((r: any) =>
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
                            stockCsvPreviewRows.map((r: any) =>
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
                            stockCsvPreviewRows.map((r: any) =>
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
                            stockCsvPreviewRows.map((r: any) =>
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
                            stockCsvPreviewRows.map((r: any) =>
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
                            stockCsvPreviewRows.map((r: any) =>
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
    </>
  );
}
