'use client';

import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { PlanTimelineItem } from './types';
import { safeString } from '@/lib/utils';

interface BatchDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: PlanTimelineItem[];
  onConfirmDelete: () => void;
}

export default function BatchDeleteConfirmModal({
  isOpen,
  onClose,
  selectedItems,
  onConfirmDelete,
}: BatchDeleteConfirmModalProps) {
  if (!isOpen || selectedItems.length === 0) return null;

  // Compute breakdown of items to delete
  const medCount = selectedItems.filter((i) => i.category === 'medication').length;
  const scanCount = selectedItems.filter((i) => i.category === 'scan').length;
  const labCount = selectedItems.filter((i) => i.category === 'lab').length;
  const procCount = selectedItems.filter((i) => i.category === 'procedure').length;

  const dayNumbers = Array.from(new Set(selectedItems.map((i) => i.day_number))).sort((a, b) => a - b);
  const dayRangeText =
    dayNumbers.length <= 4
      ? dayNumbers.map((d) => `Day ${d}`).join(', ')
      : `Day ${dayNumbers[0]} to Day ${dayNumbers[dayNumbers.length - 1]} (${dayNumbers.length} days)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-rose-50 border-b border-rose-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950">Confirm Deletion</h3>
              <p className="text-[11px] text-rose-700 font-medium">
                {selectedItems.length} {selectedItems.length === 1 ? 'event' : 'events'} selected across {dayRangeText}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to permanently remove these selected events from the stimulation schedule?
          </p>

          {/* Breakdown summary chips */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
              Items to be removed:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {medCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {medCount} {medCount === 1 ? 'Medication' : 'Medications'}
                </span>
              )}
              {scanCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-200">
                  {scanCount} {scanCount === 1 ? 'Scan' : 'Scans'}
                </span>
              )}
              {labCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-200">
                  {labCount} {labCount === 1 ? 'Lab Test' : 'Lab Tests'}
                </span>
              )}
              {procCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                  {procCount} {procCount === 1 ? 'Procedure' : 'Procedures'}
                </span>
              )}
            </div>
          </div>

          {/* Preview list (first 5 items) */}
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-[11px]">
            {selectedItems.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-1 px-2 rounded bg-slate-50 text-slate-700 border border-slate-100"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-extrabold text-slate-500 text-[10px]">D{item.day_number}</span>
                  <span className="font-semibold truncate">{safeString(item.name)}</span>
                </div>
                <span className="text-[10px] text-slate-400 capitalize">{item.category}</span>
              </div>
            ))}
            {selectedItems.length > 6 && (
              <div className="text-center text-[10px] text-slate-400 italic pt-1">
                + {selectedItems.length - 6} more items
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs font-semibold h-8 px-3 rounded-lg cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirmDelete();
              onClose();
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-8 px-4 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Now ({selectedItems.length})</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
