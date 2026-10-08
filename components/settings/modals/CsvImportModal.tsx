'use client';

import React, { useState, useRef } from 'react';
import { adminApi } from '@/lib/api';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  Check,
  RefreshCw,
} from 'lucide-react';

interface CsvImportModalProps {
  domain: any | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CsvImportModal({
  domain: importDomainModal,
  onClose,
  onSuccess,
}: CsvImportModalProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [conflictMode, setConflictMode] = useState<'overwrite' | 'skip'>('overwrite');
  const [isImporting, setIsImporting] = useState(false);
  const [isPreviewingCsv, setIsPreviewingCsv] = useState(false);
  const [csvPreviewData, setCsvPreviewData] = useState<any | null>(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState<any[]>([]);
  const [csvPreviewFilter, setCsvPreviewFilter] = useState<'all' | 'overrides' | 'new'>('all');
  const [editingCsvRowIndex, setEditingCsvRowIndex] = useState<number | null>(null);
  const [editingCsvRowForm, setEditingCsvRowForm] = useState<any>({});
  const [importResult, setImportResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelectForImport = async (file: File, mode: 'overwrite' | 'skip' = conflictMode) => {
    setImportFile(file);
    setIsPreviewingCsv(true);
    setImportResult(null);
    setCsvPreviewData(null);
    setCsvPreviewRows([]);
    setEditingCsvRowIndex(null);

    try {
      const res = await adminApi.previewCsv(importDomainModal.key, file, mode);
      setCsvPreviewData(res);
      setCsvPreviewRows(res.stats?.preview_rows || []);
    } catch (err: any) {
      // Fallback client-side parsing if backend preview gives an error
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
            return {
              row_index: idx + 1,
              identifier: vals[0] || `Row ${idx + 1}`,
              name: vals[1] || vals[0] || `Item ${idx + 1}`,
              action: 'create',
              is_override: false,
              details: 'Ready to insert.',
              raw: rowObj,
            };
          });
          setCsvPreviewRows(fallbackRows);
          setCsvPreviewData({
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
        alert(err.message || 'Failed to preview CSV file');
      }
    } finally {
      setIsPreviewingCsv(false);
    }
  };

  const handleConflictModeChange = async (newMode: 'overwrite' | 'skip') => {
    setConflictMode(newMode);
    if (importFile && importDomainModal) {
      handleFileSelectForImport(importFile, newMode);
    }
  };

  const handleExecuteCsvImport = async () => {
    if (!importDomainModal || (!importFile && csvPreviewRows.length === 0)) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      let fileToUpload: File | Blob = importFile!;
      // If rows were edited or modified, reconstruct CSV Blob
      if (csvPreviewRows.length > 0 && importDomainModal.headers) {
        const headers: string[] = importDomainModal.headers;
        const csvLines = [headers.join(',')];
        for (const row of csvPreviewRows) {
          const rowVals = headers.map((h) => {
            const val = String(row.raw?.[h] ?? '');
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          });
          csvLines.push(rowVals.join(','));
        }
        fileToUpload = new Blob([csvLines.join('\r\n')], { type: 'text/csv' });
      }

      const res = await adminApi.importCsv(importDomainModal.key, fileToUpload, conflictMode, false);
      const inserted = res.stats?.inserted ?? res.stats?.created ?? 0;
      const updated = res.stats?.updated ?? 0;
      const skipped = res.stats?.skipped ?? 0;
      const normalizedResult = {
        ...res,
        stats: {
          ...res.stats,
          inserted,
          updated,
          skipped,
          total_rows: res.stats?.total_rows ?? csvPreviewRows.length,
        },
      };
      setImportResult(normalizedResult);
      alert(`Import completed successfully: ${inserted} inserted, ${updated} updated, ${skipped} skipped.`);
      onSuccess?.();
    } catch (e: any) {
      alert(e.message || 'CSV Ingestion failed');
    } finally {
      setIsImporting(false);
    }
  };

  if (!importDomainModal) return null;

  return (
        <div className="fixed inset-0 bg-rail-bg/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  <span>Import CSV: {importDomainModal.title}</span>
                </h3>
                <p className="text-[11px] text-slate-500">Domain: {importDomainModal.key} ({importDomainModal.filename})</p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  setImportFile(null);
                  setCsvPreviewRows([]);
                  setCsvPreviewData(null);
                  setImportResult(null);
                  setEditingCsvRowIndex(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              {/* Conflict Policy Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Conflict Resolution Policy:</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer transition-colors ${
                      conflictMode === 'overwrite' ? 'bg-amber-500/10 border-amber-500/40 text-amber-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="conflict"
                      checked={conflictMode === 'overwrite'}
                      onChange={() => handleConflictModeChange('overwrite')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold block text-xs flex items-center gap-1">
                        <span>⚡ Overwrite (Upsert)</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Existing records in database will be updated with uploaded CSV values</span>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer transition-colors ${
                      conflictMode === 'skip' ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="conflict"
                      checked={conflictMode === 'skip'}
                      onChange={() => handleConflictModeChange('skip')}
                      className="text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-bold block text-xs">○ Skip Existing</span>
                      <span className="text-[10px] text-slate-500">Only inserts new rows; preserves existing database records untouched</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Drag and drop file picker */}
              {!importFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-primary rounded-xl p-8 text-center cursor-pointer bg-slate-50/50 transition-colors"
                >
                  <UploadCloud className="w-10 h-10 text-primary mx-auto mb-2" />
                  <span className="font-bold text-slate-700 block text-sm">Click to select CSV file</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Standard RFC 4180 CSV formatted file matching canonical headers
                  </span>
                  <div className="mt-2 text-[10px] text-slate-400 font-mono">
                    Expected headers: {importDomainModal.headers?.join(', ')}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelectForImport(e.target.files[0]);
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
                      <span className="font-bold text-slate-900 block text-xs">{importFile.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(importFile.size / 1024).toFixed(1)} KB · {csvPreviewRows.length} total rows detected
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImportFile(null);
                      setCsvPreviewRows([]);
                      setCsvPreviewData(null);
                      setImportResult(null);
                      setEditingCsvRowIndex(null);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded hover:bg-rose-50"
                  >
                    Change File
                  </button>
                </div>
              )}

              {/* Ingestion Conflict Analysis & Preview */}
              {isPreviewingCsv && (
                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <RefreshCw className="w-6 h-6 text-primary mx-auto animate-spin" />
                  <p className="font-semibold text-xs text-slate-800">Analyzing CSV rows & cross-referencing live database...</p>
                  <p className="text-[10px] text-slate-400">Checking for duplicate keys and existing entities</p>
                </div>
              )}

              {!isPreviewingCsv && csvPreviewRows.length > 0 && !importResult && (
                <div className="space-y-3">
                  {/* Summary Badges Bar */}
                  <div className="grid grid-cols-4 gap-2 text-center font-mono">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Total Rows</div>
                      <div className="text-base font-bold text-slate-800">{csvPreviewRows.length}</div>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <div className="text-[9px] uppercase font-bold text-emerald-600">New (Insert)</div>
                      <div className="text-base font-bold text-emerald-700">
                        {csvPreviewRows.filter((r) => !r.is_override).length}
                      </div>
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <div className="text-[9px] uppercase font-bold text-amber-700 flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Overrides (Update)</span>
                      </div>
                      <div className="text-base font-bold text-amber-800">
                        {csvPreviewRows.filter((r) => r.is_override && conflictMode === 'overwrite').length}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Skipped</div>
                      <div className="text-base font-bold text-slate-500">
                        {csvPreviewRows.filter((r) => r.is_override && conflictMode === 'skip').length}
                      </div>
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setCsvPreviewFilter('all')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          csvPreviewFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All Rows ({csvPreviewRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCsvPreviewFilter('overrides')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          csvPreviewFilter === 'overrides' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ⚡ Overrides ({csvPreviewRows.filter((r) => r.is_override).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCsvPreviewFilter('new')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          csvPreviewFilter === 'new' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        + New ({csvPreviewRows.filter((r) => !r.is_override).length})
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400 italic">
                      Review changes below before saving
                    </span>
                  </div>

                  {/* Interactive Rows Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-200 z-10">
                        <tr>
                          <th className="py-2 px-3 w-12 text-center">Row</th>
                          <th className="py-2 px-3 w-28">Action</th>
                          <th className="py-2 px-3">Unique Key / Identifier</th>
                          <th className="py-2 px-3">Entity Name / Details</th>
                          <th className="py-2 px-3 text-right w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvPreviewRows
                          .filter((r) => {
                            if (csvPreviewFilter === 'overrides') return r.is_override;
                            if (csvPreviewFilter === 'new') return !r.is_override;
                            return true;
                          })
                          .map((row) => (
                            <tr
                              key={row.row_index}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                row.is_override
                                  ? conflictMode === 'overwrite'
                                    ? 'bg-amber-50/40'
                                    : 'bg-slate-50/40 opacity-70'
                                  : ''
                              }`}
                            >
                              <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">
                                #{row.row_index}
                              </td>
                              <td className="py-2 px-3">
                                {row.is_override ? (
                                  conflictMode === 'overwrite' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                      <span>⚡ Overwrite</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                      <span>○ Skip</span>
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <span>+ New</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-800">
                                {row.identifier || '—'}
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-semibold text-slate-800 block truncate max-w-md">
                                  {row.name || '—'}
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate max-w-md">
                                  {row.details}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right space-x-1 whitespace-nowrap">
                                <button
                                  type="button"
                                  title="Edit row data before importing"
                                  onClick={() => {
                                    setEditingCsvRowIndex(row.row_index);
                                    setEditingCsvRowForm({ ...row.raw });
                                  }}
                                  className="p-1 text-slate-500 hover:text-primary rounded hover:bg-slate-100"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title="Remove this row from import"
                                  onClick={() => {
                                    setCsvPreviewRows((prev) => prev.filter((r) => r.row_index !== row.row_index));
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Inline Row Editor Dialog */}
                  {editingCsvRowIndex !== null && (
                    <div className="p-4 bg-slate-50 border border-primary/30 rounded-xl space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5 text-primary" />
                          <span>Modify Row #{editingCsvRowIndex} Before Saving</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingCsvRowIndex(null)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                        {Object.keys(editingCsvRowForm).map((colKey) => (
                          <div key={colKey}>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate mb-0.5">
                              {colKey}
                            </label>
                            <input
                              type="text"
                              value={editingCsvRowForm[colKey] || ''}
                              onChange={(e) =>
                                setEditingCsvRowForm({
                                  ...editingCsvRowForm,
                                  [colKey]: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded font-mono bg-white"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setEditingCsvRowIndex(null)}
                          className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCsvPreviewRows((prev) =>
                              prev.map((r) => {
                                if (r.row_index === editingCsvRowIndex) {
                                  const firstVal = Object.values(editingCsvRowForm)[0] || r.identifier;
                                  const secondVal = Object.values(editingCsvRowForm)[1] || r.name;
                                  return {
                                    ...r,
                                    identifier: String(firstVal),
                                    name: String(secondVal),
                                    raw: { ...editingCsvRowForm },
                                  };
                                }
                                return r;
                              })
                            );
                            setEditingCsvRowIndex(null);
                          }}
                          className="px-3 py-1.5 bg-primary hover:bg-primary-mid text-white rounded text-xs font-semibold shadow-xs"
                        >
                          Apply Row Edits
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Statistics Results display after execution */}
              {importResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>CSV Ingestion Completed Successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Database synchronization complete for domain <strong>{importDomainModal.title}</strong>.
                  </p>
                  <div className="text-xs grid grid-cols-4 gap-2 text-center mt-2 font-mono">
                    <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-xs">
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Total Rows</div>
                      <div className="font-bold text-sm text-slate-800">{importResult.stats?.total_rows || 0}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-xs">
                      <div className="text-[9px] text-emerald-600 font-bold uppercase">Inserted (New)</div>
                      <div className="font-bold text-sm text-emerald-700">{importResult.stats?.inserted ?? importResult.stats?.created ?? 0}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-xs">
                      <div className="text-[9px] text-amber-600 font-bold uppercase">Updated (Upsert)</div>
                      <div className="font-bold text-sm text-amber-700">{importResult.stats?.updated || 0}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-xs">
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Skipped</div>
                      <div className="font-bold text-sm text-slate-600">{importResult.stats?.skipped || 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 shrink-0">
              <span className="text-[11px] text-slate-400">
                {importFile ? `${csvPreviewRows.length} rows queued` : 'Select a file to begin'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setImportFile(null);
                    setCsvPreviewRows([]);
                    setCsvPreviewData(null);
                    setImportResult(null);
                    setEditingCsvRowIndex(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg text-xs"
                >
                  {importResult ? 'Done' : 'Cancel'}
                </button>

                {!importResult && (
                  <button
                    type="button"
                    disabled={!importFile || isImporting || isPreviewingCsv || csvPreviewRows.length === 0}
                    onClick={handleExecuteCsvImport}
                    className="px-5 py-2 bg-primary hover:bg-primary-mid disabled:opacity-50 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center gap-1.5"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving & Ingesting Data...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save & Ingest ({csvPreviewRows.length} Rows)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

  );
}
