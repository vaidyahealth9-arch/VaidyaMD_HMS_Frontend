'use client';

import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';

interface ParsedLeadRow {
  rowIndex: number;
  name: string;
  phone: string;
  city?: string;
  source?: string;
  campaign?: string;
  email?: string;
  isValid: boolean;
  validationIssue?: string;
}

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<{ imported: number; skipped: number; errors?: string[] }>;
  onSuccess?: () => void;
}

export const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedLeadRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'invalid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<{ imported: number; skipped: number; errors?: string[] } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const headers = ['name', 'phone', 'city', 'source', 'campaign', 'email'];
    const sampleRows = [
      ['Priya Sharma', '+91 9876543210', 'Hyderabad', 'Meta Ads', 'Fertility Camp Oct 2026', 'priya.s@example.com'],
      ['Anil Varma', '+91 9812345678', 'Secunderabad', 'Google Ads', 'IVF Consultation Search', 'anil.v@example.com'],
      ['Sunita Rao', '+91 9988776655', 'Vijayawada', 'Walk-in', 'OPD Inquiry', 'sunita.rao@example.com'],
      ['Kavitha Reddy', '+91 9765432109', 'Warangal', 'Doctor Referral', 'Dr. Ramesh Hospital', 'kavitha.r@example.com'],
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

  const parseCsvText = (text: string): ParsedLeadRow[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    // Parse header
    const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());

    const getColIndex = (aliases: string[]) => {
      for (let i = 0; i < rawHeaders.length; i++) {
        if (aliases.includes(rawHeaders[i])) return i;
      }
      return -1;
    };

    const nameIdx = getColIndex(['name', 'patient name', 'lead name', 'full name', 'patient']);
    const phoneIdx = getColIndex(['phone', 'mobile', 'contact', 'phone number', 'mobile number', 'contact number']);
    const cityIdx = getColIndex(['city', 'location', 'place', 'town', 'district']);
    const sourceIdx = getColIndex(['source', 'channel', 'acquisition source', 'lead source']);
    const campaignIdx = getColIndex(['campaign', 'source campaign', 'campaign name']);
    const emailIdx = getColIndex(['email', 'e-mail', 'email address']);

    const rows: ParsedLeadRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Split with quotes handling
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

      const name = nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx] : (cols[0] || '');
      const phone = phoneIdx !== -1 && cols[phoneIdx] ? cols[phoneIdx] : (cols[1] || '');
      const city = cityIdx !== -1 && cols[cityIdx] ? cols[cityIdx] : undefined;
      const source = sourceIdx !== -1 && cols[sourceIdx] ? cols[sourceIdx] : undefined;
      const campaign = campaignIdx !== -1 && cols[campaignIdx] ? cols[campaignIdx] : undefined;
      const email = emailIdx !== -1 && cols[emailIdx] ? cols[emailIdx] : undefined;

      const hasName = Boolean(name && name.trim());
      const hasPhone = Boolean(phone && phone.replace(/\D/g, '').length >= 6);

      let validationIssue: string | undefined;
      if (!hasName && !hasPhone) {
        validationIssue = 'Missing Name & Phone';
      } else if (!hasName) {
        validationIssue = 'Missing Name';
      } else if (!hasPhone) {
        validationIssue = 'Invalid / Missing Phone';
      }

      rows.push({
        rowIndex: i,
        name: name.trim(),
        phone: phone.trim(),
        city: city?.trim() || undefined,
        source: source?.trim() || undefined,
        campaign: campaign?.trim() || undefined,
        email: email?.trim() || undefined,
        isValid: hasName && hasPhone,
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

  const handleUploadSubmit = async () => {
    if (!selectedFile && parsedRows.length === 0) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      // Re-construct CSV from currently valid rows if edited or filtered
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

      const res = await onUpload(fileToUpload);
      setResult(res);
      onSuccess?.();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to import leads. Please verify CSV formatting.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setResult(null);
    setUploadError(null);
    setSearchQuery('');
    onClose();
  };

  // Filtered rows for display
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
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <span>Import Leads from CSV / Excel</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Bulk ingest patient prospect lists into your CRM queue with automated verification.
            </p>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
          {/* Top Action Bar: Template Download */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-primary" />
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Standard Leads Template</span>
                <span className="text-[10px] text-slate-500">
                  Headers: <code>name</code>, <code>phone</code>, <code>city</code>, <code>source</code>, <code>campaign</code>
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
            <div className="p-6 bg-emerald-50/80 rounded-xl border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-emerald-900 text-base">Import Completed Successfully!</h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                <strong>{result.imported}</strong> leads have been successfully verified and added to your active dialing queue.
                {result.skipped > 0 && ` (${result.skipped} rows were skipped due to incomplete contact details).`}
              </p>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-3 p-3 bg-white/80 rounded-lg text-left text-[11px] text-amber-800 border border-amber-200">
                  <span className="font-semibold block mb-1">Import Warnings:</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
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
                      <div className="text-[9px] uppercase font-bold text-emerald-600">Valid Leads</div>
                      <div className="text-base font-bold text-emerald-700">{validCount}</div>
                    </div>
                    <div className={`p-2.5 rounded-lg border ${invalidCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className={`text-[9px] uppercase font-bold ${invalidCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        Incomplete / Missing
                      </div>
                      <div className={`text-base font-bold ${invalidCount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                        {invalidCount}
                      </div>
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
                        Valid Only ({validCount})
                      </button>
                      {invalidCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setFilterMode('invalid')}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                            filterMode === 'invalid' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-600 hover:text-rose-800'
                          }`}
                        >
                          Issues ({invalidCount})
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

                  {/* Interactive Preview Table */}
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
                          <th className="py-2 px-3 text-right w-16">Action</th>
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
                          filteredRows.map((row, idx) => (
                            <tr
                              key={row.rowIndex}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                !row.isValid ? 'bg-rose-50/30' : ''
                              }`}
                            >
                              <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">
                                #{row.rowIndex}
                              </td>
                              <td className="py-2 px-3">
                                {row.isValid ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold px-2 py-0.5">
                                    ✓ Valid
                                  </Badge>
                                ) : (
                                  <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-semibold px-2 py-0.5">
                                    ⚠ {row.validationIssue || 'Invalid'}
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                {row.name || <span className="text-slate-400 italic">Empty</span>}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-700">
                                {row.phone || <span className="text-rose-500 italic">Missing</span>}
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                {row.city || '—'}
                              </td>
                              <td className="py-2 px-3 text-slate-600 capitalize">
                                {row.source ? row.source.replace('_', ' ') : 'Excel Import'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                                  title="Remove row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t border-slate-100 pt-3 shrink-0">
          <Button variant="outline" size="sm" onClick={handleClose} className="text-xs">
            {result ? 'Close' : 'Cancel'}
          </Button>

          {!result && (
            <Button
              size="sm"
              onClick={handleUploadSubmit}
              disabled={parsedRows.length === 0 || validCount === 0 || isUploading}
              className="text-xs bg-primary hover:bg-primary/90 text-white font-semibold"
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
