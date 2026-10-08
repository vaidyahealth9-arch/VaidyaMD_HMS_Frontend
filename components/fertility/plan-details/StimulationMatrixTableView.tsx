'use client';

import React from 'react';
import { Pill, Trash2 } from 'lucide-react';

interface StimulationMatrixTableViewProps {
  days: any[];
  drugList: string[];
  readonly?: boolean;
  onUpdateMedDose: (dayNum: number, drugName: string, dose: string) => void;
  onUpdateScanVal: (dayNum: number, field: string, val: string) => void;
  onRemoveDrugColumn?: (drugName: string) => void;
}

export default function StimulationMatrixTableView({
  days,
  drugList,
  readonly = false,
  onUpdateMedDose,
  onUpdateScanVal,
  onRemoveDrugColumn,
}: StimulationMatrixTableViewProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto max-h-[70vh] custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
          <thead className="sticky top-0 bg-slate-100 z-20 shadow-2xs">
            {/* Top Grouped Headers */}
            <tr className="border-b border-slate-200 bg-slate-200/70 text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
              <th colSpan={2} className="p-2 border-r border-slate-300">
                Timeline &amp; Milestones
              </th>
              <th
                colSpan={drugList.length}
                className="p-2 border-r border-slate-300 bg-primary/10 text-primary"
              >
                Daily Gonadotropins &amp; Medications
              </th>
              <th colSpan={3} className="p-2 border-r border-slate-300 bg-rose-50 text-rose-900">
                Folliculometry &amp; Ultrasound
              </th>
              <th colSpan={2} className="p-2 bg-amber-50 text-amber-900">
                Serum Hormones
              </th>
            </tr>

            {/* Sub Columns */}
            <tr className="border-b border-slate-200 bg-slate-100 text-slate-800">
              <th className="p-2.5 bg-slate-100 font-bold text-xs sticky left-0 z-30 shadow-r min-w-[110px]">
                Day / Date
              </th>
              <th className="p-2.5 bg-slate-100 font-bold text-xs min-w-[130px] border-r border-slate-200">
                Milestone
              </th>
              {drugList.map((drugName) => (
                <th
                  key={drugName}
                  className="p-2 min-w-[130px] border-r border-slate-200 group"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className="text-[11px] font-bold text-slate-900 truncate flex items-center gap-1"
                      title={drugName}
                    >
                      <Pill className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">{drugName}</span>
                    </span>
                    {!readonly && onRemoveDrugColumn && (
                      <button
                        type="button"
                        onClick={() => onRemoveDrugColumn(drugName)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5"
                        title="Remove drug column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="p-2 min-w-[110px] bg-rose-50/50 text-rose-950 font-bold text-xs border-r border-slate-200">
                R. Ovary (mm)
              </th>
              <th className="p-2 min-w-[110px] bg-rose-50/50 text-rose-950 font-bold text-xs border-r border-slate-200">
                L. Ovary (mm)
              </th>
              <th className="p-2 min-w-[100px] bg-emerald-50 text-emerald-950 font-bold text-xs border-r border-slate-300">
                Endo (mm)
              </th>
              <th className="p-2 min-w-[90px] bg-amber-50 text-amber-950 font-bold text-xs border-r border-slate-200">
                $E_2$ (pg/mL)
              </th>
              <th className="p-2 min-w-[90px] bg-amber-50 text-amber-950 font-bold text-xs">
                $P_4$ (ng/mL)
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {days.map((day) => (
              <tr
                key={day.day_number}
                className="hover:bg-slate-50/70 transition-colors"
              >
                {/* Fixed Sticky Date Column */}
                <td className="p-2 bg-white sticky left-0 z-10 shadow-r border-b border-slate-100">
                  <div className="font-bold text-slate-900 text-xs">
                    {day.stim_day_label || `Day ${day.day_number}`}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {day.display_date} ({day.day_of_week?.slice(0, 3)})
                  </div>
                </td>

                {/* Milestone */}
                <td className="p-2 border-r border-slate-200">
                  {day.milestone ? (
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary truncate max-w-[120px]">
                      {day.milestone}
                    </span>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>

                {/* Drug Columns */}
                {drugList.map((drugName) => {
                  const med = day.medications?.find(
                    (m: any) =>
                      m.drug_name === drugName ||
                      (m.name && m.name === drugName)
                  );
                  const doseVal = med?.dose || med?.dosage || '';

                  return (
                    <td
                      key={drugName}
                      className="p-1 border-r border-slate-200 relative"
                    >
                      <input
                        type="text"
                        value={doseVal}
                        disabled={readonly}
                        placeholder="—"
                        onChange={(e) =>
                          onUpdateMedDose(day.day_number, drugName, e.target.value)
                        }
                        className={`w-full text-center text-xs py-1 px-1.5 rounded transition-all ${
                          doseVal
                            ? 'font-bold bg-primary/10 text-primary border border-primary/20'
                            : 'text-slate-400 bg-transparent hover:bg-slate-100 border border-transparent'
                        }`}
                      />
                    </td>
                  );
                })}

                {/* R Ovary */}
                <td className="p-1 border-r border-slate-200">
                  <input
                    type="text"
                    placeholder="—"
                    value={day.right_follicles || ''}
                    disabled={readonly}
                    onChange={(e) =>
                      onUpdateScanVal(day.day_number, 'right_follicles', e.target.value)
                    }
                    className="w-full text-center text-xs py-1 px-1 rounded bg-transparent hover:bg-slate-100 font-semibold"
                  />
                </td>

                {/* L Ovary */}
                <td className="p-1 border-r border-slate-200">
                  <input
                    type="text"
                    placeholder="—"
                    value={day.left_follicles || ''}
                    disabled={readonly}
                    onChange={(e) =>
                      onUpdateScanVal(day.day_number, 'left_follicles', e.target.value)
                    }
                    className="w-full text-center text-xs py-1 px-1 rounded bg-transparent hover:bg-slate-100 font-semibold"
                  />
                </td>

                {/* Endo mm */}
                <td className="p-1 border-r border-slate-300">
                  <input
                    type="text"
                    placeholder="—"
                    value={day.endometrium_mm || ''}
                    disabled={readonly}
                    onChange={(e) =>
                      onUpdateScanVal(day.day_number, 'endometrium_mm', e.target.value)
                    }
                    className="w-full text-center text-xs py-1 px-1 rounded bg-transparent hover:bg-slate-100 font-bold text-emerald-800"
                  />
                </td>

                {/* E2 */}
                <td className="p-1 border-r border-slate-200">
                  <input
                    type="text"
                    placeholder="—"
                    value={day.e2_pgml || ''}
                    disabled={readonly}
                    onChange={(e) =>
                      onUpdateScanVal(day.day_number, 'e2_pgml', e.target.value)
                    }
                    className="w-full text-center text-xs py-1 px-1 rounded bg-transparent hover:bg-slate-100 font-bold text-amber-800"
                  />
                </td>

                {/* P4 */}
                <td className="p-1">
                  <input
                    type="text"
                    placeholder="—"
                    value={day.p4_ngml || ''}
                    disabled={readonly}
                    onChange={(e) =>
                      onUpdateScanVal(day.day_number, 'p4_ngml', e.target.value)
                    }
                    className="w-full text-center text-xs py-1 px-1 rounded bg-transparent hover:bg-slate-100 font-bold text-amber-800"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
