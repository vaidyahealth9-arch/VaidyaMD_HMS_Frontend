'use client';

import React from 'react';
import { Pill, Plus, Trash2, CalendarDays, Heart, Clock } from 'lucide-react';
import { HrtFetRowData, CalculatedDates } from './types';

interface HrtFetProtocolTableProps {
  rows: HrtFetRowData[];
  readonly?: boolean;
  embryoStage: 'Day 3' | 'Day 5';
  bleedDate: string;
  calculatedDates: CalculatedDates | null;
  p0Time: string;
  handleCellChange: (cycleDay: number, field: keyof HrtFetRowData, value: any) => void;
  openMedModal: (row: HrtFetRowData) => void;
  handleAddDay: () => void;
  handleDeleteDay: (cycleDay: number) => void;
  handlePropagateDose: (fromDay: number, count?: number) => void;
}

export default function HrtFetProtocolTable({
  rows,
  readonly = false,
  embryoStage,
  bleedDate,
  calculatedDates,
  p0Time,
  handleCellChange,
  openMedModal,
  handleAddDay,
  handleDeleteDay,
  handlePropagateDose,
}: HrtFetProtocolTableProps) {
  const getPhaseBadge = (phase: string, embryoStageTag?: string) => {
    if (phase.includes('HRT start')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (phase.includes('Endometrial assessment')) {
      return 'bg-cyan-100 text-cyan-800 border-cyan-300 font-bold';
    }
    if (phase.includes('P0 — Progesterone start')) {
      return 'bg-amber-100 text-amber-900 border-amber-400 font-bold ring-1 ring-amber-300';
    }
    if (phase.includes('P+3') || phase.includes('P+5')) {
      const isTargetTransfer =
        (phase.includes('P+3') && embryoStage === 'Day 3') ||
        (phase.includes('P+5') && embryoStage === 'Day 5');
      return isTargetTransfer
        ? 'bg-rose-100 text-rose-900 border-rose-400 font-bold ring-2 ring-rose-400'
        : 'bg-purple-100 text-purple-800 border-purple-300';
    }
    if (phase.includes('Pregnancy testing')) {
      return 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 font-bold';
    }
    if (phase.includes('Post-transfer')) {
      return 'bg-primary/10 text-primary border-primary/20';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <>
      {/* Printable Sheet Header (Prints Only) */}
      <div className="hidden print:block mb-4 border-b pb-3">
        <h2 className="text-xl font-bold text-slate-800">HRT FET Treatment Protocol</h2>
        <p className="text-xs text-slate-500 mt-1">
          Programmed Hormone Replacement Frozen Embryo Transfer ({embryoStage}) • Bleed Date: {bleedDate} • P0: {calculatedDates?.p0Date} @ {p0Time}
        </p>
      </div>

      {/* MAIN PROTOCOL TABLE (Sheet 1: HRT FET Protocol) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[72vh] custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header Styled with #2F6F8F from Excel */}
            <thead className="sticky top-0 bg-[#2F6F8F] text-white z-20 shadow-xs select-none">
              <tr>
                <th className="py-2.5 px-3 font-bold text-center border-r border-teal-600/50 w-12 sticky left-0 bg-[#2F6F8F] z-30">
                  Day
                </th>
                <th className="py-2.5 px-3 font-bold border-r border-teal-600/50 min-w-[125px]">
                  Date
                </th>
                <th className="py-2.5 px-2.5 font-bold text-center border-r border-teal-600/50 w-16">
                  E-Day
                </th>
                <th className="py-2.5 px-3 font-bold border-r border-teal-600/50 min-w-[170px]">
                  Clinical Phase
                </th>
                <th className="py-2.5 px-3 font-bold border-r border-teal-600/50 min-w-[190px]">
                  Medication / Intervention
                </th>
                <th className="py-2.5 px-2.5 font-bold border-r border-teal-600/50 min-w-[120px]">
                  Dose
                </th>
                <th className="py-2.5 px-2 font-bold border-r border-teal-600/50 w-14 text-center">
                  Unit
                </th>
                <th className="py-2.5 px-2.5 font-bold border-r border-teal-600/50 min-w-[90px]">
                  Route
                </th>
                <th className="py-2.5 px-2.5 font-bold border-r border-teal-600/50 min-w-[90px]">
                  Frequency
                </th>
                <th className="py-2.5 px-3 font-bold border-r border-teal-600/50 min-w-[140px]">
                  Timing
                </th>
                <th className="py-2.5 px-3 font-bold border-r border-teal-600/50 min-w-[180px]">
                  Monitoring / Criteria
                </th>
                <th className="py-2.5 px-3 font-bold border-r border-teal-600/50 min-w-[140px]">
                  Result / Value
                </th>
                <th className="py-2.5 px-3 font-bold border-r border-teal-600/50 min-w-[130px] text-center">
                  Embryo Stage
                </th>
                <th className="py-2.5 px-3 font-bold min-w-[200px]">
                  Notes
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {rows.map((row) => {
                const isTargetTransferDay =
                  (row.phase.includes('P+3') && embryoStage === 'Day 3') ||
                  (row.phase.includes('P+5') && embryoStage === 'Day 5');
                const isP0Row = row.phase.includes('P0 — Progesterone start');
                const isD12Scan = row.cycle_day === 12;

                return (
                  <tr
                    key={row.cycle_day}
                    className={`transition-colors ${
                      isTargetTransferDay
                        ? 'bg-rose-50/70 hover:bg-rose-100/60 font-medium'
                        : isP0Row
                        ? 'bg-amber-50/60 hover:bg-amber-100/50'
                        : isD12Scan
                        ? 'bg-cyan-50/50 hover:bg-cyan-100/40'
                        : row.cycle_day % 2 === 0
                        ? 'bg-slate-50/40 hover:bg-slate-100/60'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Cycle Day */}
                    <td className="py-2 px-2.5 text-center font-extrabold text-slate-800 border-r border-slate-200 sticky left-0 bg-inherit z-10">
                      {row.cycle_day}
                    </td>

                    {/* Date */}
                    <td className="py-2 px-3 border-r border-slate-200">
                      <div className="font-semibold text-slate-800 text-[11px] whitespace-nowrap">
                        {row.display_date}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-tight">
                        {row.day_of_week}
                      </div>
                    </td>

                    {/* Estrogen Day */}
                    <td className="py-2 px-2 text-center border-r border-slate-200 font-bold">
                      {row.estrogen_day ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-teal-100 text-teal-800">
                          E{row.estrogen_day}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Phase Badge */}
                    <td className="py-2 px-3 border-r border-slate-200">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] border tracking-tight ${getPhaseBadge(
                          row.phase,
                          row.embryo_stage
                        )}`}
                      >
                        {isTargetTransferDay && <Heart className="w-3 h-3 text-rose-600 fill-rose-600" />}
                        {isP0Row && <Clock className="w-3 h-3 text-amber-700" />}
                        <span>{row.phase}</span>
                      </span>
                    </td>

                    {/* Medication / Intervention — Click to open popup */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      {readonly ? (
                        <span className="font-semibold text-slate-800">{row.medication}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openMedModal(row)}
                          className="w-full text-left text-xs font-semibold text-slate-800 bg-transparent hover:bg-[#2F6F8F]/5 border border-transparent hover:border-[#2F6F8F]/20 rounded px-1.5 py-1 transition-all group"
                          title="Click to set medication details"
                        >
                          <span className="truncate block">{row.medication || <span className="text-slate-300 italic font-normal">Click to set...</span>}</span>
                          {(row.dose || row.route) && (
                            <span className="text-[9px] text-slate-400 font-normal mt-0.5 block group-hover:text-[#2F6F8F]">
                              {[row.dose, row.route, row.frequency].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </button>
                      )}
                    </td>

                    {/* Dose */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      {readonly ? (
                        <span className="text-slate-700">{row.dose}</span>
                      ) : (
                        <div className="flex items-center gap-1 group">
                          <input
                            type="text"
                            value={row.dose}
                            onChange={(e) => handleCellChange(row.cycle_day, 'dose', e.target.value)}
                            className="w-full text-xs text-slate-700 bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-1.5 py-1 hover:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handlePropagateDose(row.cycle_day, 4)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-teal-700 p-0.5"
                            title="Fill next 4 days"
                          >
                            ↓
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Unit */}
                    <td className="py-1.5 px-1 border-r border-slate-200 text-center">
                      {readonly ? (
                        <span className="text-slate-500 text-[11px]">{row.unit}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.unit}
                          onChange={(e) => handleCellChange(row.cycle_day, 'unit', e.target.value)}
                          className="w-12 text-center text-xs text-slate-500 bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-0.5 py-1 hover:bg-white"
                        />
                      )}
                    </td>

                    {/* Route */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      {readonly ? (
                        <span className="text-slate-600 text-[11px]">{row.route}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.route}
                          onChange={(e) => handleCellChange(row.cycle_day, 'route', e.target.value)}
                          className="w-full text-xs text-slate-600 bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-1.5 py-1 hover:bg-white"
                        />
                      )}
                    </td>

                    {/* Frequency */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      {readonly ? (
                        <span className="text-slate-600 text-[11px]">{row.frequency}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.frequency}
                          onChange={(e) => handleCellChange(row.cycle_day, 'frequency', e.target.value)}
                          className="w-full text-xs text-slate-600 bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-1.5 py-1 hover:bg-white"
                        />
                      )}
                    </td>

                    {/* Timing */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      {readonly ? (
                        <span className="text-slate-600 text-[11px]">{row.timing}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.timing}
                          onChange={(e) => handleCellChange(row.cycle_day, 'timing', e.target.value)}
                          className="w-full text-xs text-slate-600 bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-1.5 py-1 hover:bg-white"
                        />
                      )}
                    </td>

                    {/* Monitoring / Criteria */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      {readonly ? (
                        <span className="text-slate-800 text-[11px] font-medium">{row.monitoring_criteria}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.monitoring_criteria}
                          placeholder="e.g. TVS / P4 check"
                          onChange={(e) => handleCellChange(row.cycle_day, 'monitoring_criteria', e.target.value)}
                          className="w-full text-xs text-slate-800 font-medium bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-1.5 py-1 hover:bg-white"
                        />
                      )}
                    </td>

                    {/* Result / Value */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      {readonly ? (
                        <span className="text-slate-700 text-[11px] font-semibold">{row.result_value}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.result_value}
                          placeholder="e.g. 8.5mm Trilaminar"
                          onChange={(e) => handleCellChange(row.cycle_day, 'result_value', e.target.value)}
                          className="w-full text-xs text-slate-700 font-semibold bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-1.5 py-1 hover:bg-white"
                        />
                      )}
                    </td>

                    {/* Embryo Stage */}
                    <td className="py-2 px-2 text-center border-r border-slate-200">
                      {row.embryo_stage ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-tight ${
                            isTargetTransferDay
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-purple-100 text-purple-900 border border-purple-300'
                          }`}
                        >
                          {row.embryo_stage}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-1.5 px-2">
                      {readonly ? (
                        <span className="text-slate-500 text-[11px] line-clamp-2">{row.notes}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.notes}
                          placeholder="Clinical observation notes"
                          onChange={(e) => handleCellChange(row.cycle_day, 'notes', e.target.value)}
                          className="w-full text-xs text-slate-500 bg-transparent border-0 focus:ring-1 focus:ring-[#2F6F8F] rounded px-1.5 py-1 hover:bg-white"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        {!readonly && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 print:hidden">
            <button
              type="button"
              onClick={handleAddDay}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Extend / Add Day {rows.length + 1}</span>
            </button>

            <div className="text-[11px] text-slate-500">
              Total Days: <strong>{rows.length}</strong> • Active Stage: <strong>{embryoStage}</strong> • P0 Anchor:{' '}
              <strong>{calculatedDates?.p0Date || 'Day 14'} @ {p0Time}</strong>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
