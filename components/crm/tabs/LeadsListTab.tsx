'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Phone, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  Filter, 
  CheckCircle2, 
  MessageSquare,
  ArrowDownAZ,
  ArrowUpZA,
  X,
  Check,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Lead, LeadStatus, LeadSource } from '../types';

interface LeadsListTabProps {
  leads: Lead[];
  total: number;
  isLoading: boolean;
  onCallLead: (lead: Lead) => void;
  onFilterChange: (filters: { status?: LeadStatus; source?: LeadSource; city?: string; search?: string }) => void;
}

type SortDirection = 'asc' | 'desc' | null;

interface ColumnFilterState {
  [columnKey: string]: {
    selectedValues: Set<string>;
    sortDirection: SortDirection;
  };
}

export const LeadsListTab: React.FC<LeadsListTabProps> = ({
  leads,
  total,
  isLoading,
  onCallLead,
  onFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Excel-style column filters state
  const [activePopoverColumn, setActivePopoverColumn] = useState<string | null>(null);
  const [popoverSearchText, setPopoverSearchText] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFilterState>({});
  
  // Temp selection for the currently open popover
  const [tempSelectedValues, setTempSelectedValues] = useState<Set<string>>(new Set());

  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActivePopoverColumn(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute distinct unique values and counts for a given column from all leads
  const getUniqueValuesForColumn = (columnKey: keyof Lead): { value: string; label: string; count: number }[] => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      let val = l[columnKey];
      if (val === null || val === undefined || val === '') {
        val = '(Blank)';
      }
      const strVal = String(val);
      counts[strVal] = (counts[strVal] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([val, count]) => ({
        value: val,
        label: val.replace(/_/g, ' '),
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  const handleOpenPopover = (columnKey: string) => {
    if (activePopoverColumn === columnKey) {
      setActivePopoverColumn(null);
      return;
    }
    setActivePopoverColumn(columnKey);
    setPopoverSearchText('');

    // Pre-populate temp selected values from existing column filter state
    const existing = columnFilters[columnKey]?.selectedValues;
    if (existing && existing.size > 0) {
      setTempSelectedValues(new Set(existing));
    } else {
      // By default all unique values are selected
      const allVals = getUniqueValuesForColumn(columnKey as keyof Lead).map((v) => v.value);
      setTempSelectedValues(new Set(allVals));
    }
  };

  const handleToggleValue = (val: string) => {
    const next = new Set(tempSelectedValues);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    setTempSelectedValues(next);
  };

  const handleSelectAll = (allVals: string[]) => {
    setTempSelectedValues(new Set(allVals));
  };

  const handleClearAll = () => {
    setTempSelectedValues(new Set());
  };

  const handleApplyFilter = (columnKey: string) => {
    const allVals = getUniqueValuesForColumn(columnKey as keyof Lead).map((v) => v.value);
    
    setColumnFilters((prev) => {
      const next = { ...prev };
      // If all values are selected, we treat it as no filter on this column
      if (tempSelectedValues.size === allVals.length) {
        if (next[columnKey]) {
          next[columnKey] = {
            ...next[columnKey],
            selectedValues: new Set(),
          };
        }
      } else {
        next[columnKey] = {
          selectedValues: new Set(tempSelectedValues),
          sortDirection: next[columnKey]?.sortDirection || null,
        };
      }
      return next;
    });
    setActivePopoverColumn(null);
  };

  const handleSortColumn = (columnKey: string, direction: SortDirection) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnKey]: {
        selectedValues: prev[columnKey]?.selectedValues || new Set(),
        sortDirection: direction,
      },
    }));
    setActivePopoverColumn(null);
  };

  const handleClearColumnFilter = (columnKey: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[columnKey];
      return next;
    });
    setActivePopoverColumn(null);
  };

  const handleClearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm('');
    onFilterChange({});
  };

  // Filter & Sort leads in real-time
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Global Search text filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(term) ||
          l.phone.toLowerCase().includes(term) ||
          (l.city && l.city.toLowerCase().includes(term)) ||
          (l.source_campaign && l.source_campaign.toLowerCase().includes(term))
      );
    }

    // Column Filters
    Object.entries(columnFilters).forEach(([colKey, filter]) => {
      if (filter.selectedValues && filter.selectedValues.size > 0) {
        result = result.filter((lead) => {
          let val = lead[colKey as keyof Lead];
          if (val === null || val === undefined || val === '') {
            val = '(Blank)';
          }
          return filter.selectedValues.has(String(val));
        });
      }
    });

    // Column Sorts (applied on the last sorted column with active direction)
    const sortedCol = Object.entries(columnFilters).find(([_, f]) => f.sortDirection !== null);
    if (sortedCol) {
      const [colKey, f] = sortedCol;
      const dir = f.sortDirection === 'asc' ? 1 : -1;
      result.sort((a, b) => {
        const valA = String(a[colKey as keyof Lead] || '');
        const valB = String(b[colKey as keyof Lead] || '');
        return valA.localeCompare(valB) * dir;
      });
    }

    return result;
  }, [leads, searchTerm, columnFilters]);

  // Check if any column filter is active
  const hasActiveFilters = 
    searchTerm.trim().length > 0 ||
    Object.values(columnFilters).some(
      (f) => (f.selectedValues && f.selectedValues.size > 0) || f.sortDirection !== null
    );

  const getStatusBadgeClass = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'contacted':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'interested':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'follow_up':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'converted':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'lost':
      case 'do_not_call':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Helper to render an Excel-Style Column Header with Funnel
  const renderColumnHeader = (title: string, columnKey: keyof Lead, className = '') => {
    const isPopoverOpen = activePopoverColumn === columnKey;
    const filterState = columnFilters[columnKey];
    const isFiltered = Boolean(filterState?.selectedValues && filterState.selectedValues.size > 0);
    const isSorted = Boolean(filterState?.sortDirection);

    const uniqueOptions = getUniqueValuesForColumn(columnKey);
    const visibleOptions = uniqueOptions.filter((opt) =>
      opt.label.toLowerCase().includes(popoverSearchText.toLowerCase())
    );

    return (
      <th className={`py-3 px-4 relative select-none ${className}`}>
        <div className="flex items-center justify-between gap-1 group">
          <span className="truncate">{title}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPopover(columnKey);
            }}
            className={`p-1 rounded-md transition-all cursor-pointer ${
              isFiltered || isSorted
                ? 'bg-primary text-white shadow-2xs'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70'
            }`}
            title={`Excel Filter: ${title}`}
          >
            <Filter className={`w-3.5 h-3.5 ${isFiltered ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Excel-Style Popover Menu */}
        {isPopoverOpen && (
          <div
            ref={popoverRef}
            className="absolute left-0 top-full mt-1.5 w-68 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-3 text-xs normal-case font-normal animate-in fade-in-50 zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-primary" /> Filter: {title}
              </span>
              <button
                onClick={() => setActivePopoverColumn(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sort Options */}
            <div className="py-2 border-b border-slate-100 space-y-1">
              <button
                type="button"
                onClick={() => handleSortColumn(columnKey, 'asc')}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer ${
                  filterState?.sortDirection === 'asc' ? 'bg-primary/10 text-primary font-bold' : ''
                }`}
              >
                <ArrowDownAZ className="w-3.5 h-3.5 text-primary" />
                Sort A to Z (Ascending)
              </button>
              <button
                type="button"
                onClick={() => handleSortColumn(columnKey, 'desc')}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer ${
                  filterState?.sortDirection === 'desc' ? 'bg-primary/10 text-primary font-bold' : ''
                }`}
              >
                <ArrowUpZA className="w-3.5 h-3.5 text-primary" />
                Sort Z to A (Descending)
              </button>
            </div>

            {/* Search Input for values */}
            <div className="pt-2 pb-1.5">
              <Input
                placeholder="Search values..."
                value={popoverSearchText}
                onChange={(e) => setPopoverSearchText(e.target.value)}
                className="h-7 text-xs bg-slate-50"
              />
            </div>

            {/* Select All / Clear shortcuts */}
            <div className="flex items-center justify-between px-1 py-1 text-[11px] text-slate-500 font-semibold">
              <button
                type="button"
                onClick={() => handleSelectAll(uniqueOptions.map((o) => o.value))}
                className="hover:text-primary cursor-pointer"
              >
                Select All ({uniqueOptions.length})
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="hover:text-rose-600 cursor-pointer"
              >
                Clear Selection
              </button>
            </div>

            {/* Checkbox List */}
            <div className="max-h-40 overflow-y-auto space-y-1 py-1 border-t border-b border-slate-100">
              {visibleOptions.length === 0 ? (
                <div className="text-center py-3 text-slate-400 text-[11px]">No matching values</div>
              ) : (
                visibleOptions.map((opt) => {
                  const isChecked = tempSelectedValues.has(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center justify-between px-1.5 py-1 rounded hover:bg-slate-50 cursor-pointer text-slate-700"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleValue(opt.value)}
                          className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5"
                        />
                        <span className="truncate capitalize">{opt.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">({opt.count})</span>
                    </label>
                  );
                })
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClearColumnFilter(columnKey)}
                className="text-[11px] h-7 px-2 text-slate-500 hover:text-rose-600"
              >
                Reset
              </Button>
              <Button
                size="sm"
                onClick={() => handleApplyFilter(columnKey)}
                className="text-[11px] h-7 px-3 bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                Apply Filter
              </Button>
            </div>
          </div>
        )}
      </th>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Info Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patient name, phone, city, or campaign..."
              className="pl-9 text-xs h-9 bg-slate-50/70"
            />
          </div>
        </div>

        {/* Filter State Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllFilters}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 h-8 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Clear All Filters
            </Button>
          )}

          <div className="text-xs text-slate-500 font-medium shrink-0">
            Showing <strong>{filteredLeads.length}</strong> of <strong>{total}</strong> leads
          </div>
        </div>
      </div>

      {/* Leads Table with Excel Column Headers */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {renderColumnHeader('Lead Name & Campaign', 'name')}
                {renderColumnHeader('Phone Number', 'phone')}
                {renderColumnHeader('Location (City)', 'city')}
                {renderColumnHeader('Lead Source', 'source')}
                {renderColumnHeader('Pipeline Status', 'status')}
                {renderColumnHeader('Follow-Up Schedule', 'next_follow_up_date')}
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="inline-block animate-spin mr-2">⏳</div>
                    Loading patient leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-slate-400">
                    No patient leads found matching the filter criteria.
                    {hasActiveFilters && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearAllFilters}
                          className="text-xs font-semibold"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isOverdue =
                    Boolean(lead.next_follow_up_date) &&
                    new Date(lead.next_follow_up_date!) < new Date() &&
                    ['follow_up', 'interested', 'new'].includes(lead.status);

                  return (
                    <tr
                      key={lead.id}
                      className={`transition-colors ${
                        isOverdue
                          ? 'bg-rose-50/40 hover:bg-rose-50/70 border-l-2 border-l-rose-500'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{lead.name}</span>
                          {lead.priority === 3 ? (
                            <span className="w-2 h-2 rounded-full bg-rose-500" title="Urgent Priority" />
                          ) : lead.priority === 2 ? (
                            <span className="w-2 h-2 rounded-full bg-amber-500" title="High Priority" />
                          ) : null}
                          {lead.is_converted && (
                            <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 border-teal-200">
                              Converted
                            </Badge>
                          )}
                        </div>
                        {lead.source_campaign && (
                          <div className="text-[11px] font-normal text-slate-400 mt-0.5">{lead.source_campaign}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-slate-800">{lead.phone}</td>

                      <td className="py-3 px-4 text-slate-600">
                        {lead.city ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {lead.city}{lead.state ? `, ${lead.state}` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 capitalize">
                        {lead.source.replace('_', ' ')}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(
                            lead.status
                          )}`}
                        >
                          {lead.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {lead.next_follow_up_date ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                              {new Date(lead.next_follow_up_date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isOverdue && (
                              <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => onCallLead(lead)}
                          className="h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-white font-semibold shadow-2xs"
                        >
                          <Phone className="w-3.5 h-3.5 mr-1.5" />
                          Dial Now
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
