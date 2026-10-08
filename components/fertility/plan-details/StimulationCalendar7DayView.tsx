'use client';

import React from 'react';
import {
  CalendarDays,
  Sparkles,
  Activity,
  Copy,
  Pill,
  Droplet,
  Syringe,
  Plus,
} from 'lucide-react';
import { parseFollicleTokens, isProcedureName } from './utils';
import { DayEventCategory } from './QuickScanEditModal';

interface StimulationCalendar7DayViewProps {
  days: any[];
  readonly?: boolean;
  onUpdateMedDose?: (dayNum: number, medIdx: number, newDose: string) => void;
  onRemoveMed: (dayNum: number, medIdx: number) => void;
  onAddMed?: (dayNum: number, drugName: string, dose?: string) => void;
  onCopyForward: (dayNum: number, daysToForward?: number) => void;
  onOpenScanEdit: (day: any, initialCategory?: DayEventCategory) => void;
}

export default function StimulationCalendar7DayView({
  days,
  readonly = false,
  onRemoveMed,
  onCopyForward,
  onOpenScanEdit,
}: StimulationCalendar7DayViewProps) {
  // Group days into 7-day weeks
  const weeks: any[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="space-y-4">
      {weeks.map((week, weekIdx) => (
        <div
          key={weekIdx}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
        >
          {/* Week Header */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span>Week {weekIdx + 1}</span>
              <span className="text-slate-500 font-normal">
                (Days {week[0]?.day_number} – {week[week.length - 1]?.day_number})
              </span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {week[0]?.display_date} to {week[week.length - 1]?.display_date}
            </span>
          </div>

          {/* 7-Day Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            {week.map((day: any) => {
              const rFollicles = parseFollicleTokens(day.right_follicles);
              const lFollicles = parseFollicleTokens(day.left_follicles);
              const hasScan = Boolean(
                day.right_follicles ||
                day.left_follicles ||
                day.endometrium_mm ||
                (Array.isArray(day.scans) && day.scans.length > 0)
              );

              const hasLabs = Boolean(
                day.e2_pgml ||
                day.lh_miu ||
                day.p4_ngml ||
                (Array.isArray(day.investigations) && day.investigations.length > 0)
              );

              const hasProcedures = Boolean(
                Array.isArray(day.procedures) && day.procedures.length > 0
              );

              const isTrigger = day.milestone?.toLowerCase().includes('trigger');
              const isOpu =
                day.milestone?.toLowerCase().includes('opu') ||
                day.milestone?.toLowerCase().includes('collection') ||
                (hasProcedures &&
                  day.procedures.some(
                    (p: string) =>
                      p.toLowerCase().includes('opu') ||
                      p.toLowerCase().includes('collection') ||
                      p.toLowerCase().includes('retrieval')
                  ));

              return (
                <div
                  key={day.day_number}
                  className={`p-2.5 flex flex-col justify-between min-h-[280px] transition-colors relative group ${isTrigger
                      ? 'bg-amber-50/40'
                      : isOpu
                        ? 'bg-rose-50/40'
                        : hasScan
                          ? 'bg-slate-50/60'
                          : 'bg-white hover:bg-slate-50/50'
                    }`}
                >
                  {/* Top: Day # & Date Header */}
                  <div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${isTrigger
                              ? 'bg-amber-600 text-white'
                              : isOpu
                                ? 'bg-rose-600 text-white'
                                : 'bg-primary text-white'
                            }`}
                        >
                          D{day.day_number}
                        </span>
                        <span className="text-[11px] font-bold text-slate-800">
                          {day.display_date}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {day.day_of_week?.slice(0, 3)}
                        </span>
                        {!readonly && (
                          <button
                            type="button"
                            onClick={() => onOpenScanEdit(day, 'medication')}
                            className="text-slate-400 hover:text-primary p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Add event to this day"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Milestone Banner (Checkpoint only, not duplicated procedure) */}
                    {day.milestone && !isProcedureName(day.milestone) && (
                      <div
                        className={`mt-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded border truncate flex items-center gap-1 ${isTrigger
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : isOpu
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}
                      >
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span className="truncate">{day.milestone}</span>
                      </div>
                    )}

                    {/* Procedure Badges */}
                    {hasProcedures &&
                      day.procedures.map((proc: string, pIdx: number) => (
                        <div
                          key={`proc-${pIdx}`}
                          onClick={() => !readonly && onOpenScanEdit(day, 'procedure')}
                          className={`mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded border truncate flex items-center gap-1 bg-purple-100 text-purple-900 border-purple-300 ${!readonly ? 'cursor-pointer hover:bg-purple-200' : ''
                            }`}
                          title={proc}
                        >
                          <Syringe className="w-3 h-3 shrink-0 text-purple-700" />
                          <span className="truncate">{proc}</span>
                        </div>
                      ))}

                    {/* Active Medications List in Day Box */}
                    <div className="mt-2 space-y-1">
                      {Array.isArray(day.medications) &&
                        day.medications.map((m: any, mIdx: number) => (
                          <div
                            key={mIdx}
                            className="bg-primary/5 text-primary border border-primary/20 rounded-md p-1 px-1.5 flex items-center justify-between text-[11px]"
                          >
                            <span
                              className="font-bold truncate max-w-[85px]"
                              title={m.drug_name || m.name}
                            >
                              {(m.drug_name || m.name || '').split('(')[0].trim()}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-extrabold text-primary">
                                {m.dose || m.dosage}
                              </span>
                              {!readonly && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveMed(day.day_number, mIdx)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                                  title="Remove medication"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Diagnostic Lab Investigations */}
                    {hasLabs && (
                      <div
                        onClick={() => !readonly && onOpenScanEdit(day, 'lab')}
                        className={`mt-1.5 bg-rose-50/70 border border-rose-200 rounded-md p-1 text-[9.5px] text-rose-900 space-y-0.5 ${!readonly ? 'cursor-pointer hover:border-rose-400' : ''
                          }`}
                        title="Click to view/edit diagnostic labs"
                      >
                        <div className="flex items-center gap-1 font-bold text-rose-950">
                          <Droplet className="w-2.5 h-2.5 text-rose-600" />
                          <span>Labs:</span>
                        </div>
                        {day.e2_pgml && <div>E2: {day.e2_pgml}</div>}
                        {day.lh_miu && <div>LH: {day.lh_miu}</div>}
                        {day.p4_ngml && <div>P4: {day.p4_ngml}</div>}
                        {Array.isArray(day.investigations) &&
                          day.investigations
                            .filter(
                              (i: string) =>
                                !i.toLowerCase().includes('estradiol') &&
                                !i.toLowerCase().includes('luteinising') &&
                                !i.toLowerCase().includes('progesterone')
                            )
                            .map((inv: string, idx: number) => (
                              <div key={`inv-${idx}`} className="truncate">
                                {inv}
                              </div>
                            ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom: Folliculometry & Scans Summary / Add Button */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                    {hasScan ? (
                      <div
                        onClick={() => !readonly && onOpenScanEdit(day, 'scan')}
                        className={`bg-white/90 border border-slate-200 rounded-md p-1.5 text-[10px] ${!readonly ? 'cursor-pointer hover:border-primary' : ''
                          }`}
                        title="Click to view/edit folliculometry scan"
                      >
                        {day.endometrium_mm && (
                          <div className="font-bold text-emerald-800 flex justify-between">
                            <span>Endo: {day.endometrium_mm} mm</span>
                            {day.endometrial_pattern && (
                              <span className="text-[9px] text-slate-400">
                                {day.endometrial_pattern}
                              </span>
                            )}
                          </div>
                        )}
                        {(rFollicles.tokens.length > 0 || lFollicles.tokens.length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rFollicles.tokens.map((t, idx) => (
                              <span
                                key={`r-${idx}`}
                                className={`text-[8.5px] font-bold px-1 py-0.2 rounded ${t.category === 'mature'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : t.category === 'intermediate'
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                              >
                                R{t.mm}
                              </span>
                            ))}
                            {lFollicles.tokens.map((t, idx) => (
                              <span
                                key={`l-${idx}`}
                                className={`text-[8.5px] font-bold px-1 py-0.2 rounded ${t.category === 'mature'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : t.category === 'intermediate'
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                              >
                                L{t.mm}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Unified Category Add Button */}
                    {!readonly && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenScanEdit(
                            day,
                            hasScan ? 'medication' : 'scan'
                          )
                        }
                        className="w-full text-center text-[10px] font-semibold py-1 border border-dashed border-slate-300 text-slate-600 hover:text-primary hover:border-primary hover:bg-slate-50 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Add scan, medication, lab, or procedure to this day"
                      >
                        <Plus className="w-3 h-3 text-primary" />
                        <span>Add Event</span>
                      </button>
                    )}

                    {/* Copy Forward Button */}
                    {!readonly && day.medications && day.medications.length > 0 && (
                      <div className="flex items-center justify-between text-[9px] pt-1 text-slate-400">
                        <button
                          type="button"
                          onClick={() => onCopyForward(day.day_number, 3)}
                          className="hover:text-primary flex items-center gap-0.5 cursor-pointer"
                          title="Copy medications to next 3 days"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy 3D</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
