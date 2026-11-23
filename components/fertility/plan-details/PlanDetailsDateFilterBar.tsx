'use client';

import React from 'react';
import {
  Printer,
  Table as TableIcon,
  CalendarDays,
  ListOrdered,
  Plus,
  RotateCcw,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import { PlanViewMode } from './types';

interface PlanDetailsDateFilterBarProps {
  startDateFilter: string;
  endDateFilter: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onResetDates: () => void;
  viewMode: PlanViewMode;
  onViewModeChange: (mode: PlanViewMode) => void;
  onOpenInsertEditPlan: () => void;
  onPrintCalendar: () => void;
  onExportSchedule?: () => void;
  isBatchModeActive?: boolean;
  onToggleBatchMode?: () => void;
  readonly?: boolean;
}

export default function PlanDetailsDateFilterBar({
  startDateFilter,
  endDateFilter,
  onStartDateChange,
  onEndDateChange,
  onResetDates,
  viewMode,
  onViewModeChange,
  onOpenInsertEditPlan,
  onPrintCalendar,
  onExportSchedule,
  isBatchModeActive = false,
  onToggleBatchMode,
  readonly = false,
}: PlanDetailsDateFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
      {/* Left: Insert / Edit Plan Action */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {!readonly && (
          <>
            <button
              type="button"
              onClick={onOpenInsertEditPlan}
              className="px-3.5 py-1.5 bg-[#0B4F6C] hover:bg-[#1A6E8E] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Insert / Edit Treatment Plan</span>
            </button>
            {onToggleBatchMode && (
              <button
                type="button"
                onClick={onToggleBatchMode}
                className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                  isBatchModeActive
                    ? 'bg-purple-700 hover:bg-purple-800 text-white ring-2 ring-purple-300'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                }`}
                title="Toggle batch actions bar to add, modify, or delete across days"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isBatchModeActive ? '✓ Batch Actions Active' : 'Batch Actions'}</span>
              </button>
            )}
          </>
        )}

        {/* Date Range Picker UI Filter */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
          <div className="flex items-center gap-1 text-slate-600 font-bold">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span>Filter Schedule:</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium text-slate-500">From</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-primary cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium text-slate-500">To</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-primary cursor-pointer"
            />
          </div>

          {(startDateFilter || endDateFilter) && (
            <button
              type="button"
              onClick={onResetDates}
              className="text-slate-400 hover:text-slate-700 ml-1 p-0.5 cursor-pointer"
              title="Clear date filter"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Center/Right: Clean Toggle (Sparta Ledger vs 7-Day Calendar) */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            type="button"
            onClick={() => onViewModeChange('timeline_ledger')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'timeline_ledger'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/40'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Timeline Ledger</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('calendar_7day')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'calendar_7day'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/40'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>7-Day Calendar</span>
          </button>
        </div>

        {/* Print Takeaway Calendar */}
        <button
          type="button"
          onClick={onPrintCalendar}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 shadow-2xs"
          title="Print official takeaway patient protocol"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Print Calendar</span>
        </button>
      </div>
    </div>
  );
}
