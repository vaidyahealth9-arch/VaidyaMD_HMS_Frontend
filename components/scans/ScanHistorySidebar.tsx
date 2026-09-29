'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit3,
  Printer,
  Trash2,
  User,
  Filter,
  Activity,
  Check,
} from 'lucide-react';
import {
  FEMALE_SCAN_OPTIONS,
  MALE_SCAN_OPTIONS,
  normalizeScanType,
  isMaleScanType,
  getScanSchemaInfo,
  getScanKeyHighlights,
} from './scanSchemas';

export interface ScanHistorySidebarProps {
  records: any[];
  category?: 'female' | 'male';
  selectedRecordId: string | null;
  onSelectForEdit: (record: any) => void;
  onViewRecord: (record: any) => void;
  onPrintRecord: (record: any) => void;
  onDeleteRecord: (recordId: string) => void;
  onStartNewScan: () => void;
  isLoading?: boolean;
}

export default function ScanHistorySidebar({
  records,
  category = 'female',
  selectedRecordId,
  onSelectForEdit,
  onViewRecord,
  onPrintRecord,
  onDeleteRecord,
  onStartNewScan,
  isLoading = false,
}: ScanHistorySidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchemaFilters, setSelectedSchemaFilters] = useState<string[]>([]);

  // Reset filters when category changes
  useEffect(() => {
    setSelectedSchemaFilters([]);
    setSearchTerm('');
  }, [category]);

  // Schema options applicable to the active category
  const schemaOptions = category === 'male' ? MALE_SCAN_OPTIONS : FEMALE_SCAN_OPTIONS;

  // Filter records strictly by active category (Male vs Female)
  const categoryRecords = useMemo(() => {
    return records.filter((r) => {
      const isMale = isMaleScanType(r.schema_type);
      return category === 'male' ? isMale : !isMale;
    });
  }, [records, category]);

  // Toggle schema filter pill (multi-select)
  const handleToggleFilter = (schemaValue: string) => {
    setSelectedSchemaFilters((prev) => {
      if (prev.includes(schemaValue)) {
        return prev.filter((v) => v !== schemaValue);
      } else {
        return [...prev, schemaValue];
      }
    });
  };

  const handleClearFilters = () => {
    setSelectedSchemaFilters([]);
    setSearchTerm('');
  };

  // Filter records chronologically & by search/filter pills
  const filteredRecords = useMemo(() => {
    return [...categoryRecords]
      .filter((rec) => {
        // Multi-select schema filter
        if (selectedSchemaFilters.length > 0) {
          const recNorm = normalizeScanType(rec.schema_type);
          const matches = selectedSchemaFilters.some(
            (filterVal) => normalizeScanType(filterVal) === recNorm
          );
          if (!matches) return false;
        }

        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const d = rec.data || {};
          const schemaInfo = getScanSchemaInfo(rec.schema_type);
          const dateStr = d.scan_date || d.date_of_scan || rec.created_at || '';
          const docStr = rec.doctor_name || rec.created_by_name || '';
          const match =
            schemaInfo.label.toLowerCase().includes(q) ||
            schemaInfo.shortLabel.toLowerCase().includes(q) ||
            dateStr.toLowerCase().includes(q) ||
            docStr.toLowerCase().includes(q) ||
            JSON.stringify(d).toLowerCase().includes(q);
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = a.data?.scan_date || a.data?.date_of_scan || a.created_at || '';
        const dateB = b.data?.scan_date || b.data?.date_of_scan || b.created_at || '';
        return dateB.localeCompare(dateA);
      });
  }, [categoryRecords, selectedSchemaFilters, searchTerm]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
      {/* Header & Record Count */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold border ${
              category === 'male'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 tracking-wide uppercase">
              {category === 'male' ? 'Male Diagnostics & CASA' : 'Female Ultrasound Scans'}
            </h3>
            <p className="text-[10px] text-slate-400">
              {category === 'male'
                ? 'Chronological andrology & semen records'
                : 'Chronological ultrasound scan visits'}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
          {categoryRecords.length} Total
        </span>
      </div>

      {/* Action Button: Start New Scan (Cleanly labeled with NO repeating +) */}
      <button
        type="button"
        onClick={onStartNewScan}
        className={`w-full py-2 px-3 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-98 ${
          category === 'male'
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-primary hover:bg-primary-mid'
        }`}
      >
        <Plus className="w-3.5 h-3.5" />
        <span>
          {category === 'male' ? 'Record New Andrology Session' : 'Record New Scan Session'}
        </span>
      </button>

      {/* Multi-Select Filter Pills at Top */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter by Scan Type
          </span>
          {selectedSchemaFilters.length > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-[10px] text-primary hover:underline font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedSchemaFilters([])}
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all border ${
              selectedSchemaFilters.length === 0
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All ({categoryRecords.length})
          </button>
          {schemaOptions.map((opt) => {
            const count = categoryRecords.filter(
              (r) => normalizeScanType(r.schema_type) === normalizeScanType(opt.value)
            ).length;
            const isSelected = selectedSchemaFilters.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleToggleFilter(opt.value)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all border flex items-center gap-1 ${
                  isSelected
                    ? `${opt.badgeBg} ${opt.badgeColor} ${opt.badgeBorder} ring-1 ring-current shadow-xs`
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isSelected && <Check className="w-2.5 h-2.5" />}
                <span>{opt.shortLabel}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search scans by date, doctor, findings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {/* Scrollable Records List */}
      <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
            Loading patient scans...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-1">
            <p className="font-bold text-xs text-slate-600">No matching scans found</p>
            <p className="text-[11px] text-slate-400">
              {selectedSchemaFilters.length > 0 || searchTerm
                ? 'Try adjusting your filters or search terms.'
                : 'Click "Record New Scan Session" above to enter readings.'}
            </p>
          </div>
        ) : (
          filteredRecords.map((rec, index) => {
            const isEditing = selectedRecordId === rec.id;
            const schemaInfo = getScanSchemaInfo(rec.schema_type);
            const d = rec.data || {};
            const dateStr =
              d.scan_date || d.date_of_scan || (rec.created_at ? rec.created_at.split('T')[0] : '---');
            const timeStr = rec.created_at
              ? new Date(rec.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';
            const highlights = getScanKeyHighlights(rec);

            return (
              <div
                key={rec.id || index}
                className={`p-3 rounded-xl border transition-all text-left group relative ${
                  isEditing
                    ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Header Row: Session & Badge */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${schemaInfo.badgeBg} ${schemaInfo.badgeColor} ${schemaInfo.badgeBorder}`}
                  >
                    {schemaInfo.shortLabel}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 font-semibold">
                    {dateStr}
                  </span>
                </div>

                {/* Session Title & Time */}
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
                    Session #{categoryRecords.length - index}
                  </h4>
                  {timeStr && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {timeStr}
                    </span>
                  )}
                </div>

                {/* Key Clinical Metric Chips */}
                {highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {highlights.map((h, i) => (
                      <span
                        key={i}
                        className="bg-slate-50 border border-slate-200/70 text-[10px] px-1.5 py-0.5 rounded font-medium text-slate-700"
                      >
                        <span className="text-slate-400 font-semibold">{h.label}:</span>{' '}
                        <strong>{h.value}</strong>
                      </span>
                    ))}
                  </div>
                )}

                {/* Doctor info if present */}
                {(rec.doctor_name || rec.created_by_name) && (
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-2.5">
                    <User className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{rec.doctor_name || rec.created_by_name}</span>
                  </p>
                )}

                {/* Bottom Action Toolbar: View (Pops modal), Edit (In-place right side), Print, Delete */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
                  <div className="flex items-center gap-1.5">
                    {/* View Button: Pops modal dialog with all details */}
                    <button
                      type="button"
                      onClick={() => onViewRecord(rec)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-md transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="View complete scan report details in popup"
                    >
                      <Eye className="w-3 h-3 text-slate-600" />
                      <span>View</span>
                    </button>

                    {/* Edit Button: Loads scan into right form for in-place edit */}
                    <button
                      type="button"
                      onClick={() => onSelectForEdit(rec)}
                      className={`px-2 py-1 font-bold text-[10px] rounded-md transition-colors flex items-center gap-1 shadow-2xs cursor-pointer ${
                        isEditing
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20'
                      }`}
                      title="Edit this scan record in right form"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditing ? 'Editing' : 'Edit'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Print Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrintRecord(rec);
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Print scan report with letterhead and doctor signature"
                    >
                      <Printer className="w-3 h-3" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRecord(rec.id);
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete this scan record"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
