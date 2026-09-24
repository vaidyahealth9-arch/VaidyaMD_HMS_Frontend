'use client';

import React from 'react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  SlidersHorizontal,
  X,
  Zap,
  Loader2,
} from 'lucide-react';

interface EditPlanScheduleModalProps {
  isOpen: boolean;
  editingPlan: any | null;
  onClose: () => void;
  planEditSessions: {
    id: string;
    session_number: number;
    equipment: string;
    date: string;
    time: string;
    duration_mins: number;
    status: string;
  }[];
  onSave: (e: React.FormEvent) => void;
  isSaving: boolean;
  shiftAllDates: (days: number) => void;
  bulkSetDuration: (duration: number) => void;
  updatePlanEditSessionField: (index: number, field: string, val: any) => void;
}

export default function EditPlanScheduleModal({
  isOpen,
  editingPlan,
  onClose,
  planEditSessions,
  onSave,
  isSaving,
  shiftAllDates,
  bulkSetDuration,
  updatePlanEditSessionField,
}: EditPlanScheduleModalProps) {
  if (!isOpen || !editingPlan) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Edit Package Schedule
                <Badge variant="purple" className="text-[10px] font-mono">
                  {editingPlan.treatment_name}
                </Badge>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Patient: <strong className="text-slate-800">{editingPlan.patient_name}</strong>{' '}
                {editingPlan.patient_mrn ? `(${editingPlan.patient_mrn})` : ''} • {planEditSessions.length} total sessions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Bulk Shift Controls */}
        <div className="px-5 py-3 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-indigo-900">Shift All Dates:</span>
            <button
              type="button"
              onClick={() => shiftAllDates(-7)}
              className="px-2 py-1 rounded bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold cursor-pointer"
            >
              -7 Days
            </button>
            <button
              type="button"
              onClick={() => shiftAllDates(-1)}
              className="px-2 py-1 rounded bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold cursor-pointer"
            >
              -1 Day
            </button>
            <button
              type="button"
              onClick={() => shiftAllDates(1)}
              className="px-2 py-1 rounded bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold cursor-pointer"
            >
              +1 Day
            </button>
            <button
              type="button"
              onClick={() => shiftAllDates(3)}
              className="px-2 py-1 rounded bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold cursor-pointer"
            >
              +3 Days
            </button>
            <button
              type="button"
              onClick={() => shiftAllDates(7)}
              className="px-2 py-1 rounded bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold cursor-pointer"
            >
              +7 Days
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-900">Duration:</span>
            <button
              type="button"
              onClick={() => bulkSetDuration(20)}
              className="px-2 py-1 rounded bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold cursor-pointer"
            >
              20m
            </button>
            <button
              type="button"
              onClick={() => bulkSetDuration(30)}
              className="px-2 py-1 rounded bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold cursor-pointer"
            >
              30m
            </button>
            <button
              type="button"
              onClick={() => bulkSetDuration(45)}
              className="px-2 py-1 rounded bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold cursor-pointer"
            >
              45m
            </button>
          </div>
        </div>

        {/* Sessions Form Table */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3.5">#</th>
                  <th className="py-3 px-3.5">Equipment / Modality</th>
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Time Allotted</th>
                  <th className="py-3 px-3.5">Duration</th>
                  <th className="py-3 px-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {planEditSessions.map((s, idx) => {
                  const isJet = s.equipment?.toLowerCase().includes('jet');

                  return (
                    <tr key={s.id || idx} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3.5 font-bold text-slate-800">
                        #{s.session_number}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold gap-1.5 ${
                            isJet
                              ? 'bg-primary/10 border-primary/20 text-primary'
                              : 'bg-purple-50 border-purple-200 text-purple-700'
                          }`}
                        >
                          <Zap className="w-3 h-3" />
                          {s.equipment}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <Input
                          type="date"
                          value={s.date}
                          onChange={(e) => updatePlanEditSessionField(idx, 'date', e.target.value)}
                          className="h-8 text-xs font-semibold w-38 bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-3.5">
                        <Input
                          type="time"
                          value={s.time}
                          onChange={(e) => updatePlanEditSessionField(idx, 'time', e.target.value)}
                          className="h-8 text-xs font-semibold w-28 bg-white font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={10}
                            max={180}
                            step={5}
                            value={s.duration_mins}
                            onChange={(e) => updatePlanEditSessionField(idx, 'duration_mins', Number(e.target.value))}
                            className="h-8 text-xs font-semibold w-20 text-center bg-white"
                          />
                          <span className="text-[11px] text-slate-400 font-semibold">min</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <select
                          value={s.status}
                          onChange={(e) => updatePlanEditSessionField(idx, 'status', e.target.value)}
                          className="h-8 text-xs rounded-md border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 text-xs"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-bold h-9 text-xs px-5 shadow-sm cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Updating Schedule &amp; Calendar...
                </>
              ) : (
                'Save Schedule & Sync Calendar'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
