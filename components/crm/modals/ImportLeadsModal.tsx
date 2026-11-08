'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Search,
  X,
  Loader2,
  FileCheck,
  History,
  Clock,
  Edit2,
  Check,
  RefreshCw,
  AlertCircle,
  FileDown
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { crmApi } from '@/features/crm/api';
import { LeadImportResult, LeadImportBatch } from '@/components/crm/types';

interface ParsedLeadRow {
  rowIndex: number;
  name: string;
  phone: string;
  city?: string;
  source?: string;
  campaign?: string;
  email?: string;
  isValid: boolean;
  isPartial?: boolean;
  validationIssue?: string;
}

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, duplicateStrategy: 'update' | 'skip') => Promise<LeadImportResult>;
  onSuccess?: () => void;
}

export const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  onSuccess,
}) => {
  const [activeView, setActiveView] = useState<'import' | 'history'>('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedLeadRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'invalid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [duplicateStrategy, setDuplicateStrategy] = useState<'update' | 'skip'>('update');
  const [result, setResult] = useState<LeadImportResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; phone: string; city: string }>({
    name: '',
    phone: '',
    city: '',
  });

  // History state
  const [historyBatches, setHistoryBatches] = useState<LeadImportBatch[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const data = await crmApi.getImportHistory();
      setHistoryBatches(data || []);
    } catch (err: any) {
      setHistoryError(err.message || 'Failed to load import history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeView === 'history') {
      void loadHistory();
    }
  }, [isOpen, activeView]);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const headers = ['name', 'phone', 'city', 'source', 'campaign', 'email'];
    const sampleRows = [
      ['Priya Sharma', '+91 9876543210', 'Hyderabad', 'Meta Ads', 'Fertility Camp Oct 2026', 'priya.s@example.com'],
      ['Anil Varma', '+91 9812345678', 'Secunderabad', 'Google Ads', 'IVF Consultation Search', 'anil.v@example.com'],
      ['', '9988776655', 'Vijayawada', 'Walk-in', 'OPD Inquiry', ''],
      ['Kavitha Reddy', '9765432109 / 9876543210', 'Warangal', 'Doctor Referral', 'Dr. Ramesh Hospital', 'kavitha.r@example.com'],
    ];
    const csvContent = [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vaidyamd_leads_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sanitizePhone = (raw: string) => {
    const primary = raw.split(/[\/,;]/)[0] || '';
    let digits = primary.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    return digits;
  };

  const parseCsvText = (text: string): ParsedLeadRow[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());

    const getColIndex = (aliases: string[]) => {
      for (let i = 0; i < rawHeaders.length; i++) {
        if (aliases.includes(rawHeaders[i])) return i;
      }
      return -1;
    };

    const nameIdx = getColIndex(['name', 'patient name', 'lead name', 'full name', 'patient', 'prospect name']);
    const phoneIdx = getColIndex(['phone', 'mobile', 'contact', 'phone number', 'mobile number', 'contact number']);
    const cityIdx = getColIndex(['city', 'location', 'place', 'town', 'district']);
    const sourceIdx = getColIndex(['source', 'channel', 'acquisition source', 'lead source']);
    const campaignIdx = getColIndex(['campaign', 'source campaign', 'campaign name']);
    const emailIdx = getColIndex(['email', 'e-mail', 'email address']);

    const rows: ParsedLeadRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols: string[] = [];
      let inQuotes = false;
      let currentVal = '';

      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const char = line[charIdx];
        if (char === '"' && (charIdx === 0 || line[charIdx - 1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cols.push(currentVal.trim().replace(/^"|"$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      cols.push(currentVal.trim().replace(/^"|"$/g, ''));

      let name = nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx] : (cols[0] || '');
      const rawPhone = phoneIdx !== -1 && cols[phoneIdx] ? cols[phoneIdx] : (cols[1] || '');
      const city = cityIdx !== -1 && cols[cityIdx] ? cols[cityIdx] : undefined;
      const source = sourceIdx !== -1 && cols[sourceIdx] ? cols[sourceIdx] : undefined;
      const campaign = campaignIdx !== -1 && cols[campaignIdx] ? cols[campaignIdx] : undefined;
      const email = emailIdx !== -1 && cols[emailIdx] ? cols[emailIdx] : undefined;

      const cleanPhone = sanitizePhone(rawPhone);
      const hasPhone = Boolean(cleanPhone && cleanPhone.length >= 6);
      const hasName = Boolean(name && name.trim());

      let isValid = false;
      let isPartial = false;
      let validationIssue: string | undefined;

      if (hasPhone) {
        isValid = true;
        if (!hasName) {
          name = `Lead ${cleanPhone.slice(-4)}`;
          isPartial = true;
          validationIssue = 'Partial (Name auto-generated)';
        }
      } else {
        isValid = false;
        validationIssue = 'Invalid / Missing Phone';
      }

      rows.push({
        rowIndex: i,
        name: name.trim(),
        phone: rawPhone.trim(),
        city: city?.trim() || undefined,
        source: source?.trim() || undefined,
        campaign: campaign?.trim() || undefined,
        email: email?.trim() || undefined,
        isValid,
        isPartial,
        validationIssue,
      });
    }

    return rows;
  };

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setUploadError(null);
    setIsParsing(true);

    try {
      const text = await file.text();
      const rows = parseCsvText(text);
      setParsedRows(rows);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to read CSV file');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDeleteRow = (index: number) => {
    setParsedRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleStartEditRow = (idx: number, row: ParsedLeadRow) => {
    setEditingRowIdx(idx);
    setEditValues({
      name: row.name,
      phone: row.phone,
      city: row.city || '',
    });
  };

  const handleSaveEditRow = (idx: number) => {
    setParsedRows((prev) => {
      const updated = [...prev];
      const target = updated[idx];
      const cleanPhone = sanitizePhone(editValues.phone);
      const hasPhone = cleanPhone.length >= 6;
      let finalName = editValues.name.trim();

      let isPartial = false;
      let isValid = false;
      let validationIssue: string | undefined;

      if (hasPhone) {
        isValid = true;
        if (!finalName) {
          finalName = `Lead ${cleanPhone.slice(-4)}`;
          isPartial = true;
          validationIssue = 'Partial (Name auto-generated)';
        }
      } else {
        isValid = false;
        validationIssue = 'Invalid / Missing Phone';
      }

      updated[idx] = {
        ...target,
        name: finalName,
        phone: editValues.phone.trim(),
        city: editValues.city.trim() || undefined,
        isValid,
        isPartial,
        validationIssue,
      };
      return updated;
    });
    setEditingRowIdx(null);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile && parsedRows.length === 0) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      let fileToUpload: File;
      if (parsedRows.length > 0) {
        const headers = ['name', 'phone', 'city', 'source', 'campaign', 'email'];
        const csvLines = [headers.join(',')];
        const validRows = parsedRows.filter((r) => r.isValid);
        for (const row of validRows) {
          const vals = [
            `"${row.name.replace(/"/g, '""')}"`,
            `"${row.phone.replace(/"/g, '""')}"`,
            `"${(row.city || '').replace(/"/g, '""')}"`,
            `"${(row.source || '').replace(/"/g, '""')}"`,
            `"${(row.campaign || '').replace(/"/g, '""')}"`,
            `"${(row.email || '').replace(/"/g, '""')}"`,
          ];
          csvLines.push(vals.join(','));
        }
        const blob = new Blob([csvLines.join('\r\n')], { type: 'text/csv' });
        fileToUpload = new File([blob], selectedFile ? selectedFile.name : 'leads_import.csv', { type: 'text/csv' });
      } else {
        fileToUpload = selectedFile!;
      }

      const res = await onUpload(fileToUpload, duplicateStrategy);
      setResult(res);
      onSuccess?.();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to import leads. Please verify CSV formatting.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadFailedCsv = async (batchId?: string) => {
    if (batchId) {
      window.open(crmApi.getFailedRowsDownloadUrl(batchId), '_blank');
      return;
    }

    if (result?.error_details && result.error_details.length > 0) {
      const headers = ['Row #', 'Patient / Prospect Name', 'Phone Number', 'Failure Reason'];
      const rows = result.error_details.map((e) => [
        `"${e.row}"`,
        `"${(e.name || '').replace(/"/g, '""')}"`,
        `"${(e.phone || '').replace(/"/g, '""')}"`,
        `"${(e.reason || '').replace(/"/g, '""')}"`,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'skipped_import_rows.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setResult(null);
    setUploadError(null);
    setSearchQuery('');
    setEditingRowIdx(null);
    onClose();
  };

  const filteredRows = parsedRows.filter((row) => {
    if (filterMode === 'valid' && !row.isValid) return false;
    if (filterMode === 'invalid' && row.isValid) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = row.name.toLowerCase().includes(q);
      const matchPhone = row.phone.toLowerCase().includes(q);
      const matchCity = (row.city || '').toLowerCase().includes(q);
      const matchSource = (row.source || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchCity || matchSource;
    }
    return true;
  });

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const partialCount = parsedRows.filter((r) => r.isValid && r.isPartial).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[92vh] flex flex-col">
        {/* Header with Navigation Tabs */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span>Import Leads from CSV / Excel</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Bulk ingest prospect lists into CRM with tolerant verification & history audit.
              </p>
            </div>
            {/* View Switcher Pill */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveView('import')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeView === 'import' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setActiveView('history')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeView === 'history' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5 text-primary" />
                Import History & Logs
              </button>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
          {activeView === 'history' ? (
            /* ========================================================= */
            /* VIEW: IMPORT HISTORY & AUDIT LOGS                         */
            /* ========================================================= */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Past Import Batches & Audit Logs</h4>
                  <p className="text-[11px] text-slate-500">Track all CSV imports, who uploaded them, and download failed rows for correction.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadHistory}
                  disabled={isLoadingHistory}
                  className="text-xs h-7 text-slate-600"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {isLoadingHistory ? (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  <p className="text-xs">Loading import history...</p>
                </div>
              ) : historyError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{historyError}</span>
                </div>
              ) : historyBatches.length === 0 ? (
                <div className="p-12 text-center text-slate-400 border border-dashed rounded-xl space-y-2">
                  <History className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-medium text-xs text-slate-600">No import history found</p>
                  <p className="text-[11px]">When you upload and confirm CSV batches, their full audit logs will appear here.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date / Time</th>
                        <th className="py-2.5 px-3">File Name</th>
                        <th className="py-2.5 px-3">Uploaded By</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Total</th>
                        <th className="py-2.5 px-3 text-center">Added</th>
                        <th className="py-2.5 px-3 text-center">Updated</th>
                        <th className="py-2.5 px-3 text-center">Skipped</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyBatches.map((batch) => (
                        <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {new Date(batch.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900 max-w-[150px] truncate" title={batch.file_name}>
                            {batch.file_name}
                            <span className="block text-[9px] font-mono text-slate-400">
                              {(batch.file_size / 1024).toFixed(1)} KB · {batch.duplicate_strategy === 'update' ? 'Auto-Update' : 'Skip Mode'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">
                            {batch.imported_by_name || 'Staff Member'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {batch.status === 'completed' ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px]">Completed</Badge>
                            ) : batch.status === 'partial' ? (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px]">Partial</Badge>
                            ) : (
                              <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[9px]">Failed</Badge>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-slate-800">{batch.total_rows}</td>
                          <td className="py-2 px-3 text-center font-bold text-emerald-600">{batch.imported_count}</td>
                          <td className="py-2 px-3 text-center font-bold text-blue-600">{batch.updated_count}</td>
                          <td className="py-2 px-3 text-center font-bold text-rose-600">{batch.skipped_count}</td>
                          <td className="py-2 px-3 text-right">
                            {batch.skipped_count > 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadFailedCsv(batch.id)}
                                className="text-[10px] h-6 px-2 text-rose-600 border-rose-200 hover:bg-rose-50 font-medium"
                                title="Download skipped rows CSV"
                              >
                                <FileDown className="w-3 h-3 mr-1" />
                                Failed ({batch.skipped_count})
                              </Button>
                            ) : (
                              <span className="text-emerald-600 text-[10px] font-medium">100% Verified</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================= */
            /* VIEW: UPLOAD & IMPORT SCREEN                              */
            /* ========================================================= */
            <>
              {/* Top Action Bar: Template Download */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-primary" />
                  <div>
                    <span className="font-semibold text-slate-800 block text-xs">Standard Leads Template</span>
                    <span className="text-[10px] text-slate-500">
                      Headers: <code>name</code>, <code>phone</code>, <code>city</code>, <code>source</code>, <code>campaign</code>. Partial leads with missing names are accepted!
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="text-xs text-primary border-primary/30 hover:bg-primary/10 font-semibold"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download Template
                </Button>
              </div>

              {/* Upload Status / Success Screen */}
              {result ? (
                <div className="p-6 bg-emerald-50/80 rounded-xl border border-emerald-200 text-center space-y-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <div>
                    <h4 className="font-bold text-emerald-900 text-base">Import Completed Successfully!</h4>
                    <p className="text-xs text-emerald-800 max-w-lg mx-auto mt-1">
                      Batch ingested into dialing queue with multi-strategy duplicate matching.
                    </p>
                  </div>

                  {/* Metric Summary Cards */}
                  <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto text-center font-mono">
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                      <div className="text-[9px] uppercase font-bold text-emerald-600">New Added</div>
                      <div className="text-lg font-bold text-emerald-700">{result.imported}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-blue-200">
                      <div className="text-[9px] uppercase font-bold text-blue-600">Updated</div>
                      <div className="text-lg font-bold text-blue-700">{result.updated || 0}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                      <div className="text-[9px] uppercase font-bold text-amber-600">Duplicates</div>
                      <div className="text-lg font-bold text-amber-700">{result.duplicates || 0}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-rose-200">
                      <div className="text-[9px] uppercase font-bold text-rose-600">Skipped</div>
                      <div className="text-lg font-bold text-rose-700">{result.skipped || 0}</div>
                    </div>
                  </div>

                  {/* Warnings & Failed Rows Download */}
                  {result.skipped > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg text-left text-[11px] text-slate-700 border border-amber-200 space-y-2 max-w-lg mx-auto">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Skipped Rows ({result.skipped}):</span>
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadFailedCsv(result.batch_id)}
                          className="h-6 text-[10px] text-primary border-primary/30 hover:bg-primary/5"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download Skipped CSV
                        </Button>
                      </div>
                      {result.errors && result.errors.length > 0 && (
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[10px]">
                          {result.errors.slice(0, 5).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                          {result.errors.length > 5 && (
                            <li className="text-slate-400 italic">...and {result.errors.length - 5} more</li>
                          )}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      size="sm"
                      onClick={() => setActiveView('history')}
                      className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-medium"
                    >
                      <History className="w-3.5 h-3.5 mr-1.5" />
                      View in Import History
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* File Dropzone */}
                  {!selectedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-primary rounded-xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <UploadCloud className="w-10 h-10 text-primary mx-auto mb-2" />
                      <span className="font-bold text-slate-800 block text-sm">Click to select CSV file</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Drag and drop or browse from your computer (UTF-8 encoded .csv)
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            void handleFileChange(e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-primary shadow-xs border border-slate-200">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{selectedFile.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {(selectedFile.size / 1024).toFixed(1)} KB · {parsedRows.length} rows parsed
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setParsedRows([]);
                          setResult(null);
                          setUploadError(null);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded hover:bg-rose-50"
                      >
                        Change File
                      </button>
                    </div>
                  )}

                  {/* Parsing State */}
                  {isParsing && (
                    <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <Loader2 className="w-6 h-6 text-primary mx-auto animate-spin" />
                      <p className="font-semibold text-xs text-slate-800">Reading and validating CSV rows...</p>
                    </div>
                  )}

                  {/* Upload Error Banner */}
                  {uploadError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="text-xs">{uploadError}</span>
                    </div>
                  )}

                  {/* Parsed Rows Preview Section */}
                  {!isParsing && parsedRows.length > 0 && (
                    <div className="space-y-3">
                      {/* Summary Metric Badges */}
                      <div className="grid grid-cols-3 gap-3 text-center font-mono">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <div className="text-[9px] uppercase font-bold text-slate-400">Total Rows</div>
                          <div className="text-base font-bold text-slate-800">{parsedRows.length}</div>
                        </div>
                        <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                          <div className="text-[9px] uppercase font-bold text-emerald-600">Importable Leads</div>
                          <div className="text-base font-bold text-emerald-700">
                            {validCount}
                            {partialCount > 0 && (
                              <span className="text-[10px] text-amber-700 ml-1 font-sans font-medium">
                                ({partialCount} partial auto-named)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`p-2.5 rounded-lg border ${invalidCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[9px] uppercase font-bold ${invalidCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            Invalid Phone (Will Skip)
                          </div>
                          <div className={`text-base font-bold ${invalidCount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                            {invalidCount}
                          </div>
                        </div>
                      </div>

                      {/* Duplicate Strategy Option */}
                      <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">Duplicate Handling Strategy</span>
                          <span className="text-[11px] text-slate-600">
                            What to do if a phone number already exists in your CRM:
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDuplicateStrategy('update')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              duplicateStrategy === 'update'
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Update Existing (Recommended)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDuplicateStrategy('skip')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              duplicateStrategy === 'skip'
                                ? 'bg-slate-800 text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Skip Duplicates
                          </button>
                        </div>
                      </div>

                      {/* Filter and Search Bar */}
                      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between pt-1">
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setFilterMode('all')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                              filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            All ({parsedRows.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilterMode('valid')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                              filterMode === 'valid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Importable ({validCount})
                          </button>
                          {invalidCount > 0 && (
                            <button
                              type="button"
                              onClick={() => setFilterMode('invalid')}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                                filterMode === 'invalid' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-600 hover:text-rose-800'
                              }`}
                            >
                              Invalid Phone ({invalidCount})
                            </button>
                          )}
                        </div>

                        <div className="relative w-full sm:w-64">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter preview rows..."
                            className="pl-8 text-xs h-8"
                          />
                        </div>
                      </div>

                      {/* Interactive Preview Table with Inline Editing */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-200 z-10">
                            <tr>
                              <th className="py-2 px-3 w-12 text-center">#</th>
                              <th className="py-2 px-3 w-28">Status</th>
                              <th className="py-2 px-3">Patient Name</th>
                              <th className="py-2 px-3">Phone Number</th>
                              <th className="py-2 px-3">City / Location</th>
                              <th className="py-2 px-3">Source</th>
                              <th className="py-2 px-3 text-right w-20">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {filteredRows.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                                  No rows matching the current filter.
                                </td>
                              </tr>
                            ) : (
                              filteredRows.map((row) => {
                                const originalIdx = parsedRows.findIndex((r) => r.rowIndex === row.rowIndex);
                                const isEditing = editingRowIdx === originalIdx;

                                return (
                                  <tr
                                    key={row.rowIndex}
                                    className={`hover:bg-slate-50/80 transition-colors ${
                                      !row.isValid ? 'bg-rose-50/30' : row.isPartial ? 'bg-amber-50/20' : ''
                                    }`}
                                  >
                                    <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">
                                      #{row.rowIndex}
                                    </td>
                                    <td className="py-2 px-3">
                                      {row.isValid ? (
                                        row.isPartial ? (
                                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold px-2 py-0.5" title="Missing name was auto-generated">
                                            ✓ Partial Lead
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold px-2 py-0.5">
                                            ✓ Valid
                                          </Badge>
                                        )
                                      ) : (
                                        <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-semibold px-2 py-0.5">
                                          ⚠ {row.validationIssue || 'Invalid'}
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 font-semibold text-slate-900">
                                      {isEditing ? (
                                        <Input
                                          value={editValues.name}
                                          onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                                          placeholder="Lead name"
                                          className="h-7 text-xs"
                                        />
                                      ) : (
                                        row.name
                                      )}
                                    </td>
                                    <td className="py-2 px-3 font-mono text-slate-700">
                                      {isEditing ? (
                                        <Input
                                          value={editValues.phone}
                                          onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                                          placeholder="10-digit mobile"
                                          className="h-7 text-xs font-mono"
                                        />
                                      ) : (
                                        row.phone || <span className="text-rose-500 italic">Missing</span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-slate-600">
                                      {isEditing ? (
                                        <Input
                                          value={editValues.city}
                                          onChange={(e) => setEditValues({ ...editValues, city: e.target.value })}
                                          placeholder="City"
                                          className="h-7 text-xs"
                                        />
                                      ) : (
                                        row.city || '—'
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-slate-600 capitalize">
                                      {row.source ? row.source.replace('_', ' ') : 'Excel Import'}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        {isEditing ? (
                                          <button
                                            type="button"
                                            onClick={() => handleSaveEditRow(originalIdx)}
                                            className="text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 transition-colors"
                                            title="Save changes"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleStartEditRow(originalIdx, row)}
                                            className="text-slate-400 hover:text-primary p-1 rounded hover:bg-primary/5 transition-colors"
                                            title="Edit row"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteRow(originalIdx)}
                                          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                                          title="Remove row"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t border-slate-100 pt-3 shrink-0">
          <Button variant="outline" size="sm" onClick={handleClose} className="text-xs">
            {result ? 'Close' : 'Cancel'}
          </Button>

          {activeView === 'import' && !result && (
            <Button
              size="sm"
              onClick={handleUploadSubmit}
              disabled={parsedRows.length === 0 || validCount === 0 || isUploading}
              className="text-xs bg-primary hover:bg-primary/90 text-white font-semibold shadow-xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Importing Leads...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                  Confirm & Import ({validCount} Leads)
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
