'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Plus,
  RefreshCw,
  Printer,
  Calendar,
  CheckCircle2,
  FileText,
  AlertCircle,
  Eye,
  Trash2,
  Sparkles,
} from 'lucide-react';
import DynamicForm from '@/components/dynamic-form/DynamicForm';
import { fertilityApi, andrologyApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import {
  FEMALE_SCAN_OPTIONS,
  MALE_SCAN_OPTIONS,
  ALL_SCAN_OPTIONS,
  normalizeScanType,
  isMaleScanType,
  getScanSchemaInfo,
} from './scanSchemas';
import ScanHistorySidebar from './ScanHistorySidebar';
import ScanReportModal from './ScanReportModal';

export interface UnifiedScanWorkbenchProps {
  patient: any;
  partner?: any;
  user?: any;
  initialSchemaType?: string;
  onRecordSaved?: () => void;
  compact?: boolean;
}

export default function UnifiedScanWorkbench({
  patient,
  partner,
  user,
  initialSchemaType = 'follicular_scan',
  onRecordSaved,
  compact = false,
}: UnifiedScanWorkbenchProps) {
  const patientId = patient?.id;
  const initialIsMale = isMaleScanType(initialSchemaType);

  const [activeCategory, setActiveCategory] = useState<'female' | 'male'>(
    initialIsMale ? 'male' : 'female'
  );
  const [activeSchemaType, setActiveSchemaType] = useState<string>(
    normalizeScanType(initialSchemaType) || (initialIsMale ? 'casa_semen_analysis' : 'follicular_scan')
  );
  const [activeSchema, setActiveSchema] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [recordsList, setRecordsList] = useState<any[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // Selected historical record ID for in-place editing (null = recording a brand new session)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Viewing record for popup report modal
  const [viewingRecord, setViewingRecord] = useState<any | null>(null);

  // Printing record for printable modal
  const [printingRecord, setPrintingRecord] = useState<any | null>(null);

  // Target patient IDs (accounting for couple relationship)
  const femaleTargetId = patient?.gender === 'male' ? (partner?.id || patientId) : patientId;
  const maleTargetId = patient?.gender === 'male' ? patient.id : (partner?.id || patientId);
  const currentTargetId = activeCategory === 'male' ? maleTargetId : femaleTargetId;

  // Refresh all records for this couple/patient
  const fetchAllRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const idsToFetch = Array.from(new Set([patientId, partner?.id].filter(Boolean)));
      const fetchPromises = idsToFetch.map((id) =>
        fertilityApi.getRecords(id).catch(() => [])
      );
      const results = await Promise.all(fetchPromises);
      const combined: any[] = results.flat();

      // Fallback for andrology CASA records if male records not present
      if (maleTargetId && combined.filter((r) => isMaleScanType(r.record_type || r.schema_type)).length === 0) {
        try {
          const andRes = await andrologyApi.list({ patient_id: maleTargetId });
          if (Array.isArray(andRes)) {
            andRes.forEach((r) => {
              combined.push({
                ...r,
                schema_type: 'casa_semen_analysis',
                record_type: 'casa_semen_analysis',
              });
            });
          }
        } catch {
          // ignore fallback error
        }
      }

      // De-duplicate by record id
      const seen = new Set();
      const uniqueList: any[] = [];
      for (const r of combined) {
        const idKey = r.id || JSON.stringify(r);
        if (!seen.has(idKey)) {
          seen.add(idKey);
          uniqueList.push({
            ...r,
            schema_type: normalizeScanType(r.record_type || r.schema_type),
          });
        }
      }

      setRecordsList(uniqueList);
    } catch (err: any) {
      console.error('Failed to load scan records', err);
      setRecordsList([]);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // Sync schema definition when activeSchemaType changes
  useEffect(() => {
    if (!activeSchemaType) return;
    fertilityApi.getSchema(activeSchemaType)
      .then((s: any) => setActiveSchema(s))
      .catch((err) => console.error('Failed to load schema', err));
  }, [activeSchemaType]);

  // Load records on mount or patient/partner change
  useEffect(() => {
    fetchAllRecords();
  }, [patientId, partner?.id]);

  // Active record currently loaded for in-place edit
  const activeRecord = useMemo(() => {
    if (!selectedRecordId) return null;
    return recordsList.find((r) => r.id === selectedRecordId) || null;
  }, [selectedRecordId, recordsList]);

  // Initial data computation
  const computedInitialData = useMemo(() => {
    if (activeRecord) {
      return activeRecord.data || {};
    }
    const today = new Date().toISOString().split('T')[0];
    return {
      scan_date: today,
      date_of_scan: today,
      collection_date: today,
      analysis_date: today,
    };
  }, [activeRecord]);

  // Save Scan Form (In-Place Update vs New Append-Only Session)
  const handleSaveInvestigation = async (formData: Record<string, unknown>) => {
    if (!currentTargetId || !activeSchemaType) return;
    setIsSaving(true);
    try {
      if (selectedRecordId) {
        // In-place update of historical session
        await fertilityApi.updateRecord(selectedRecordId, {
          data: formData,
        });
        toast.success(
          'Record Updated',
          activeCategory === 'male'
            ? 'Historical andrology session updated successfully!'
            : 'Historical scan session updated successfully!'
        );
      } else {
        // Create brand-new append-only record
        await fertilityApi.saveRecord({
          patient_id: currentTargetId,
          schema_type: activeSchemaType,
          record_type: activeSchemaType,
          plugin_id: 'fertility',
          data: formData,
        });
        toast.success(
          'Saved Successfully',
          activeCategory === 'male'
            ? 'New andrology report recorded and added to history!'
            : 'New scan session recorded and added to history!'
        );
      }

      // Reset to new session mode and reload list
      setSelectedRecordId(null);
      await fetchAllRecords();
      onRecordSaved?.();
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'An error occurred while saving record');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete historical session
  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this historical record?')) return;
    try {
      await fertilityApi.deleteRecord(recordId);
      toast.success('Deleted', 'Historical record removed.');
      if (selectedRecordId === recordId) {
        setSelectedRecordId(null);
      }
      fetchAllRecords();
      onRecordSaved?.();
    } catch (err: any) {
      toast.error('Delete Failed', err.message || 'Failed to delete record');
    }
  };

  // Start new clean scan session
  const handleStartNewScan = () => {
    setSelectedRecordId(null);
    toast.info(
      activeCategory === 'male' ? 'New Andrology Session' : 'New Scan Session',
      'Form reset for new observation entry.'
    );
  };

  // Select scan for in-place edit
  const handleSelectForEdit = (record: any) => {
    setSelectedRecordId(record.id);
    const recType = normalizeScanType(record.schema_type);
    const isMale = isMaleScanType(recType);
    if (isMale && activeCategory !== 'male') {
      setActiveCategory('male');
    } else if (!isMale && activeCategory !== 'female') {
      setActiveCategory('female');
    }
    if (recType && recType !== activeSchemaType) {
      setActiveSchemaType(recType);
    }
  };

  // View scan in popup modal
  const handleViewRecord = (record: any) => {
    setViewingRecord(record);
  };

  // Print scan report
  const handlePrintRecord = (record: any) => {
    setPrintingRecord(record);
  };

  // Follicular scans list for multi-visit progression summary
  const follicularScans = useMemo(() => {
    return recordsList
      .filter((r) => normalizeScanType(r.schema_type) === 'follicular_scan')
      .sort((a, b) => {
        const dA = a.data?.scan_date || a.data?.date_of_scan || a.created_at || '';
        const dB = b.data?.scan_date || b.data?.date_of_scan || b.created_at || '';
        return dA.localeCompare(dB);
      });
  }, [recordsList]);

  return (
    <div className="space-y-6 w-full">
      {/* Top Protocol Bar: Category Selector & Scan/Protocol Dropdown & New Session Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setActiveCategory('female');
                setActiveSchemaType('follicular_scan');
                setSelectedRecordId(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'female'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>♀ Female Scans &amp; Diagnostics</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('male');
                setActiveSchemaType('casa_semen_analysis');
                setSelectedRecordId(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'male'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>♂ Male Diagnostics &amp; Andrology</span>
            </button>
          </div>
        </div>

        {/* Scan/Protocol Dropdown & New Session Button (Appearing for BOTH Male & Female) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">
              {activeCategory === 'male' ? 'Andrology Protocol:' : 'Scan / Protocol:'}
            </span>
            <select
              value={activeSchemaType}
              onChange={(e) => {
                setActiveSchemaType(e.target.value);
                setSelectedRecordId(null);
              }}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer shadow-2xs"
            >
              {(activeCategory === 'male' ? MALE_SCAN_OPTIONS : FEMALE_SCAN_OPTIONS).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clean New Scan Session Button */}
          <button
            type="button"
            onClick={handleStartNewScan}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
            title="Reset form to enter a brand-new session reading"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {activeCategory === 'male' ? 'New Andrology Session' : 'New Scan Session'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Category-Filtered History Sidebar + Right Progression & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Category-Filtered History Sidebar (4 Columns) */}
        <div className="lg:col-span-4 w-full">
          <ScanHistorySidebar
            records={recordsList}
            category={activeCategory}
            selectedRecordId={selectedRecordId}
            onSelectForEdit={handleSelectForEdit}
            onViewRecord={handleViewRecord}
            onPrintRecord={handlePrintRecord}
            onDeleteRecord={handleDeleteRecord}
            onStartNewScan={handleStartNewScan}
            isLoading={isLoadingRecords}
          />
        </div>

        {/* Right Column: Follicular Progression Table & Form (8 Columns) */}
        <div className="lg:col-span-8 space-y-6 w-full">
          {/* Multi-Visit Serial Follicular Monitoring Progression Summary Table */}
          {follicularScans.length > 0 &&
            activeSchemaType === 'follicular_scan' &&
            activeCategory === 'female' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                      Multi-Visit Follicular Progression Matrix
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {follicularScans.length} Visits Logged
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b">
                      <tr>
                        <th className="py-2 px-3">Session Date</th>
                        <th className="py-2 px-3">Cycle Day</th>
                        <th className="py-2 px-3">Endometrium</th>
                        <th className="py-2 px-3">Right Ovary</th>
                        <th className="py-2 px-3">Left Ovary</th>
                        <th className="py-2 px-3">AFC</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {follicularScans.map((rec, i) => {
                        const d = rec.data || {};
                        const isEditing = selectedRecordId === rec.id;
                        return (
                          <tr
                            key={rec.id || i}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isEditing ? 'bg-primary/5 font-bold' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                              {d.scan_date || d.date_of_scan || rec.created_at?.split('T')[0] || '—'}
                            </td>
                            <td className="py-2.5 px-3">
                              {d.cycle_day ? (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-bold text-slate-800">
                                  Day {d.cycle_day}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {d.endometrial_thickness || d.endometrium_thickness_mm ? (
                                <span className="font-bold text-slate-900">
                                  {d.endometrial_thickness || d.endometrium_thickness_mm} mm
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {d.right_ovary_lead_follicle_mm ? (
                                <span className="text-emerald-700 font-bold">
                                  Lead: {d.right_ovary_lead_follicle_mm} mm
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {d.left_ovary_lead_follicle_mm ? (
                                <span className="text-indigo-700 font-bold">
                                  Lead: {d.left_ovary_lead_follicle_mm} mm
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">
                              {d.antral_follicle_count_afc || d.afc || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleViewRecord(rec)}
                                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                  title="View in popup report modal"
                                >
                                  <Eye className="w-2.5 h-2.5 text-slate-600" />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSelectForEdit(rec)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                    isEditing
                                      ? 'bg-primary text-white shadow-xs'
                                      : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20'
                                  }`}
                                  title="Edit in form below"
                                >
                                  {isEditing ? 'Editing' : 'Edit'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* Mode Indicator Banner: In-Place Update vs New Session */}
          <div className="rounded-xl border p-4 shadow-2xs transition-all">
            {selectedRecordId ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/70 border border-amber-300 rounded-lg p-3 text-amber-950">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0 animate-ping" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-amber-900">
                      {activeCategory === 'male'
                        ? 'Viewing Historical Andrology Session · In-Place Update Mode'
                        : 'Viewing Historical Scan Session · In-Place Update Mode'}
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      You are reviewing a previously recorded session. Saving here will update this historical session.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStartNewScan}
                  className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700" />
                  <span>
                    {activeCategory === 'male'
                      ? 'Switch to New Andrology Entry'
                      : 'Switch to New Scan Entry'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-800">
                    {activeCategory === 'male'
                      ? 'Recording New Andrology Entry'
                      : 'Recording New Ultrasound Scan Session'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    · Submitting will append a new historical record to the patient timeline
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Form for the selected protocol */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            {activeSchema ? (
              <DynamicForm
                key={selectedRecordId || `new_entry_${activeSchemaType}`}
                schema={activeSchema}
                initialData={computedInitialData}
                onSave={handleSaveInvestigation}
                userRole={user?.role || 'doctor'}
                submitButtonLabel={
                  isSaving
                    ? 'Saving...'
                    : selectedRecordId
                    ? activeCategory === 'male'
                      ? 'Update Historical Andrology Record'
                      : 'Update Historical Scan Session'
                    : activeCategory === 'male'
                    ? 'Save New Andrology Record'
                    : 'Save New Scan Record'
                }
                isSaving={isSaving}
              />
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                Loading clinical schema fields...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popup Report Viewer Modal (Pops the complete formatted scan report) */}
      {viewingRecord && (
        <ScanReportModal
          isOpen={Boolean(viewingRecord)}
          onClose={() => setViewingRecord(null)}
          record={viewingRecord}
          patient={patient}
          partner={partner}
          onEdit={(rec) => {
            handleSelectForEdit(rec);
            setViewingRecord(null);
          }}
        />
      )}

      {/* Printable Report Modal */}
      {printingRecord && (
        <ScanReportModal
          isOpen={Boolean(printingRecord)}
          onClose={() => setPrintingRecord(null)}
          record={printingRecord}
          patient={patient}
          partner={partner}
        />
      )}
    </div>
  );
}
