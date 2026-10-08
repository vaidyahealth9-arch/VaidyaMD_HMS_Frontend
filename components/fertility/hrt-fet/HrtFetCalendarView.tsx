'use client';

import React from 'react';
import { Printer } from 'lucide-react';
import { HrtFetRowData } from './types';

interface HrtFetCalendarViewProps {
  rows: HrtFetRowData[];
  hospitalName: string;
  branchSubtitle: string;
  onClose: () => void;
  onPrint: () => void;
}

export default function HrtFetCalendarView({
  rows,
  hospitalName,
  branchSubtitle,
  onClose,
  onPrint,
}: HrtFetCalendarViewProps) {
  return (
    <div className="fixed inset-0 z-40 bg-white overflow-y-auto print:static print:overflow-visible print:z-auto printable-document print-landscape">
          <div className="p-6 print:p-0 min-h-screen print:min-h-0">
            <div className="max-w-[277mm] mx-auto print:max-w-none">
              {/* Print Toolbar */}
              <div className="flex items-center justify-between mb-4 print:hidden">
                <h2 className="text-base font-bold text-slate-800">Weekly Treatment Calendar — Print Preview</h2>
                <div className="flex gap-2">
                  <button
                    onClick={onPrint}
                    className="px-4 py-2 bg-[#2F6F8F] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-[#245a75]"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Calendar
                  </button>
                  <button
                    onClick={() => onClose()}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Calendar Layout — by week (Mon-Sun) */}
              {(() => {
                const DAYS_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                const dayMap: Record<string, HrtFetRowData[]> = {};
                rows.forEach((r) => {
                  const key = r.day_of_week?.slice(0, 3);
                  if (!dayMap[key]) dayMap[key] = [];
                  dayMap[key].push(r);
                });

                // Group rows into weeks of 7 days each (Mon → Sun)
                const weeks: HrtFetRowData[][] = [];
                let currentWeek: HrtFetRowData[] = [];
                rows.forEach((r) => {
                  currentWeek.push(r);
                  if (currentWeek.length === 7 || r === rows[rows.length - 1]) {
                    weeks.push([...currentWeek]);
                    currentWeek = [];
                  }
                });

                // Group into actual Mon-Sun weeks starting from any day
                const groupedWeeks: (HrtFetRowData | null)[][] = [];
                let weekBuf: (HrtFetRowData | null)[] = [];
                let firstRow = true;
                rows.forEach((r) => {
                  const dow = r.day_of_week?.slice(0, 3) || 'Mon';
                  const dowIdx = DAYS_ORDER.indexOf(dow);
                  if (firstRow) {
                    // Pad start of first week
                    for (let i = 0; i < (dowIdx < 0 ? 0 : dowIdx); i++) weekBuf.push(null);
                    firstRow = false;
                  }
                  weekBuf.push(r);
                  if (weekBuf.length === 7) {
                    groupedWeeks.push([...weekBuf]);
                    weekBuf = [];
                  }
                });
                if (weekBuf.length > 0) {
                  while (weekBuf.length < 7) weekBuf.push(null);
                  groupedWeeks.push(weekBuf);
                }

                return (
                  <div className="space-y-4">
                    {groupedWeeks.map((week, wi) => (
                      <div key={wi} className="page-break-avoid">
                        {/* Week label */}
                        <div
                          className="text-[10px] font-bold text-white px-3 py-1.5 rounded-t-lg"
                          style={{ background: '#2F6F8F' }}
                        >
                          Week {wi + 1}
                        </div>
                        <div className="grid grid-cols-7 border border-t-0 border-slate-300 rounded-b-lg overflow-hidden">
                          {/* Header Row */}
                          {DAYS_ORDER.map((d) => (
                            <div
                              key={d}
                              className="text-center text-[10px] font-extrabold uppercase tracking-wider py-1.5 border-r last:border-r-0 border-slate-300"
                              style={{ background: '#2F6F8F', color: 'white' }}
                            >
                              {d}
                            </div>
                          ))}
                          {/* Day Cells */}
                          {week.map((row, di) => (
                            <div
                              key={di}
                              className="border-r last:border-r-0 border-t border-slate-200 p-1.5 min-h-[100px] text-[10px]"
                              style={{
                                background: row?.embryo_stage && row.embryo_stage.includes('ET')
                                  ? '#fff0f0'
                                  : row?.phase?.includes('P0')
                                  ? '#fffbeb'
                                  : row ? 'white' : '#f9fafb',
                              }}
                            >
                              {row ? (
                                <>
                                  {/* Date + Day badge */}
                                  <div className="font-extrabold text-slate-800 mb-1 leading-none">
                                    {row.display_date}
                                    {row.estrogen_day && (
                                      <span className="ml-1 text-[9px] bg-teal-100 text-teal-800 px-1 py-0.5 rounded font-bold">
                                        E{row.estrogen_day}
                                      </span>
                                    )}
                                  </div>
                                  {/* Phase */}
                                  {row.phase && (
                                    <div className="text-[9px] text-slate-500 italic mb-1 truncate">{row.phase}</div>
                                  )}
                                  {/* Scan / Monitoring */}
                                  {row.monitoring_criteria && (
                                    <div className="text-[9px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded px-1 py-0.5 mb-1">
                                      {row.monitoring_criteria}
                                    </div>
                                  )}
                                  {/* Result */}
                                  {row.result_value && (
                                    <div className="text-[9px] text-primary font-semibold mb-1">
                                      {row.result_value}
                                    </div>
                                  )}
                                  {/* Medication pill */}
                                  {row.medication && (
                                    <div
                                      className="text-[9px] font-semibold rounded px-1 py-0.5 mb-0.5 truncate"
                                      style={{ background: '#e0f2fe', color: '#0369a1', border: '0.5px solid #bae6fd' }}
                                    >
                                      {row.medication}{row.dose ? ` — ${row.dose}` : ''}{row.frequency ? ` ✕ ${row.frequency}` : ''}
                                    </div>
                                  )}
                                  {/* Embryo Stage */}
                                  {row.embryo_stage && (
                                    <div className="text-[9px] font-extrabold text-rose-700 mt-0.5">
                                      🌸 {row.embryo_stage}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-slate-200">—</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
  );
}
