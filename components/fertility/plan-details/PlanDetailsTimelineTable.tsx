'use client';

import React, { useState } from 'react';
import {
  Pill,
  Activity,
  Droplet,
  Syringe,
  Trash2,
  Check,
  Plus,
  Save,
  Loader2,
  X,
} from 'lucide-react';
import { PlanTimelineItem, PlanItemCategory } from './types';
import { formatDoseDisplay } from './utils';

interface PlanDetailsTimelineTableProps {
  items: PlanTimelineItem[];
  readonly?: boolean;
  onUpdateItemDose: (itemId: string, newDose: string) => void;
  onUpdateItemScan: (itemId: string, newScanDetails: string) => void;
  onUpdateItemRemarks?: (itemId: string, newRemarks: string) => void;
  onToggleStatus: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: (newItem: Partial<PlanTimelineItem>) => void;
  onOpenScanEdit?: (dayNumber: number) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export default function PlanDetailsTimelineTable({
  items,
  readonly = false,
  onUpdateItemDose,
  onUpdateItemScan,
  onUpdateItemRemarks,
  onToggleStatus,
  onDeleteItem,
  onAddItem,
  onOpenScanEdit,
  onSave,
  isSaving = false,
}: PlanDetailsTimelineTableProps) {
  const [editingDoseId, setEditingDoseId] = useState<string | null>(null);
  const [editDoseVal, setEditDoseVal] = useState<string>('');

  const [editingScanId, setEditingScanId] = useState<string | null>(null);
  const [editScanVal, setEditScanVal] = useState<string>('');

  const [editingRemarksId, setEditingRemarksId] = useState<string | null>(null);
  const [editRemarksVal, setEditRemarksVal] = useState<string>('');

  // Quick add dialog
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newCategory, setNewCategory] = useState<PlanItemCategory>('medication');
  const [newDayNum, setNewDayNum] = useState<number>(items[0]?.day_number || 1);
  const [newName, setNewName] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newScanDetails, setNewScanDetails] = useState('');

  const handleStartEditDose = (item: PlanTimelineItem) => {
    if (readonly || item.category !== 'medication') return;
    setEditingDoseId(item.id);
    setEditDoseVal(item.dosage || item.dose_display || '');
  };

  const handleCommitEditDose = (itemId: string) => {
    onUpdateItemDose(itemId, editDoseVal);
    setEditingDoseId(null);
  };

  const handleStartEditRemarks = (item: PlanTimelineItem) => {
    if (readonly) return;
    setEditingRemarksId(item.id);
    if (item.category === 'scan') {
      const parts = [item.scan_details, item.notes].filter(Boolean);
      setEditRemarksVal(parts.join('; '));
    } else {
      setEditRemarksVal(item.notes || '');
    }
  };

  const handleCommitEditRemarks = (item: PlanTimelineItem) => {
    if (item.category === 'scan') {
      onUpdateItemScan(item.id, editRemarksVal);
    }
    if (onUpdateItemRemarks) {
      onUpdateItemRemarks(item.id, editRemarksVal);
    }
    setEditingRemarksId(null);
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const matchingDay = items.find((x) => x.day_number === newDayNum);
    const refDay = items[0];
    let targetDate = matchingDay?.date || '';
    let targetDisplayDate = matchingDay?.display_date || '';
    let targetDayOfWeek = matchingDay?.day_of_week || '';

    if (!matchingDay && refDay && refDay.date) {
      try {
        const d = new Date(refDay.date);
        d.setDate(d.getDate() + (newDayNum - refDay.day_number));
        targetDate = d.toISOString().split('T')[0];
        targetDisplayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        targetDayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
      } catch {
        const d = new Date();
        targetDate = d.toISOString().split('T')[0];
        targetDisplayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        targetDayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
      }
    } else if (!targetDate) {
      const d = new Date();
      targetDate = d.toISOString().split('T')[0];
      targetDisplayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      targetDayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
    }

    onAddItem({
      day_number: newDayNum,
      stim_day_number: matchingDay?.stim_day_number || newDayNum,
      date: targetDate,
      display_date: targetDisplayDate,
      day_of_week: targetDayOfWeek,
      category: newCategory,
      name: newName.trim(),
      dosage: newDose.trim(),
      dose_display: newCategory === 'medication' ? formatDoseDisplay(newDose.trim(), 1) : '',
      scan_details: newCategory === 'scan' ? newScanDetails.trim() : undefined,
      notes: newCategory === 'procedure' ? newScanDetails.trim() : undefined,
      status: 'planned',
    });

    setNewName('');
    setNewDose('');
    setNewScanDetails('');
    setShowQuickAdd(false);
  };

  if (!items || items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
        <Activity className="w-8 h-8 text-primary mx-auto mb-2 opacity-50" />
        <h4 className="text-sm font-bold text-slate-800">No Stimulation Items Recorded</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Click <strong>&quot;Insert / Edit Treatment Plan&quot;</strong> above to auto-populate the day-by-day protocol schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 select-none">
              <th className="py-2.5 px-3 w-16 text-center" title="Clinical Phase: Amber = Stimulation, Emerald = Luteal">Phase</th>
              <th className="py-2.5 px-3 w-16">Dow</th>
              <th className="py-2.5 px-3 w-28">Date</th>
              <th className="py-2.5 px-3 w-14 text-center">Day</th>
              <th className="py-2.5 px-3 w-12 text-center">Type</th>
              <th className="py-2.5 px-4 min-w-[200px]">Event</th>
              <th className="py-2.5 px-4 min-w-[140px]">Result / Dose</th>
              <th className="py-2.5 px-4 min-w-[280px]">Remarks</th>
              {!readonly && <th className="py-2.5 px-3 w-12 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const isFirstOfDay = idx === 0 || items[idx - 1].day_number !== item.day_number;
              const isEvenDay = item.day_number % 2 === 0;
              const isLuteal = item.phase === 'luteal';

              return (
                <tr
                  key={item.id || idx}
                  className={`transition-colors group hover:bg-slate-50/70 ${
                    isEvenDay ? 'bg-slate-50/30' : 'bg-white'
                  }`}
                >
                  {/* Phase Indicator Block (Amber for Stimulation, Emerald for Luteal) */}
                  <td className="py-2 px-3 text-center align-middle">
                    <button
                      type="button"
                      disabled={readonly}
                      onClick={() => onToggleStatus(item.id)}
                      title={`${isLuteal ? 'Luteal Phase' : 'Stimulation Phase'} · Click to toggle status: ${
                        item.status === 'administered' ? 'Administered' : 'Scheduled'
                      }`}
                      className={`w-4 h-6 rounded-xs transition-all inline-flex items-center justify-center cursor-pointer ${
                        isLuteal
                          ? 'bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 text-white'
                          : 'bg-amber-400 hover:bg-amber-500 border border-amber-500 text-amber-950'
                      }`}
                    >
                      {item.status === 'administered' && (
                        <Check className="w-3 h-3 stroke-[3] text-white" />
                      )}
                    </button>
                  </td>

                  {/* Day of Week */}
                  <td className={`py-2 px-3 font-semibold text-slate-800 ${isFirstOfDay ? 'font-bold' : 'text-slate-500'}`}>
                    {item.day_of_week}
                  </td>

                  {/* Date */}
                  <td className={`py-2 px-3 whitespace-nowrap ${isFirstOfDay ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                    {item.display_date || item.date}
                  </td>

                  {/* Stim Day Number */}
                  <td className="py-2 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {item.stim_day_number}
                    </span>
                  </td>

                  {/* Category Icon */}
                  <td className="py-2 px-3 text-center align-middle">
                    {item.category === 'medication' && (
                      <span title="Medication">
                        <Pill className="w-4 h-4 text-amber-500 mx-auto fill-amber-100" />
                      </span>
                    )}
                    {item.category === 'scan' && (
                      <span title="Ultrasound Scan">
                        <Activity className="w-4 h-4 text-primary mx-auto fill-slate-100" />
                      </span>
                    )}
                    {item.category === 'lab' && (
                      <span title="Blood / Hormone Investigation">
                        <Droplet className="w-4 h-4 text-rose-500 mx-auto fill-rose-100" />
                      </span>
                    )}
                    {item.category === 'procedure' && (
                      <span title="Clinical Procedure">
                        <Syringe className="w-4 h-4 text-purple-600 mx-auto fill-purple-100" />
                      </span>
                    )}
                  </td>

                  {/* Event / Item Name */}
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-semibold ${
                          item.category === 'medication'
                            ? 'text-slate-900 font-bold'
                            : item.category === 'scan'
                            ? 'text-primary font-bold'
                            : item.category === 'procedure'
                            ? 'text-purple-900 font-bold'
                            : 'text-rose-900 font-bold'
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.notes && (
                        <span className="text-[10px] text-slate-400 italic">
                          ({item.notes})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Dosage Column */}
                  <td className="py-2 px-4 whitespace-nowrap">
                    {item.category === 'medication' ? (
                      editingDoseId === item.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editDoseVal}
                            onChange={(e) => setEditDoseVal(e.target.value)}
                            onBlur={() => handleCommitEditDose(item.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCommitEditDose(item.id)}
                            autoFocus
                            className="w-28 text-xs px-2 py-0.5 bg-white border border-primary rounded font-bold text-primary focus:outline-none ring-1 ring-primary"
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartEditDose(item)}
                          className={`inline-block font-mono text-xs font-semibold text-slate-800 ${
                            !readonly ? 'cursor-pointer hover:text-primary hover:underline' : ''
                          }`}
                          title={!readonly ? 'Click to edit dosage' : undefined}
                        >
                          {item.dose_display || formatDoseDisplay(item.dosage || '', item.quantity || 1) || '—'}
                        </div>
                      )
                    ) : item.category === 'lab' && item.lab_result ? (
                      <span className="font-mono text-xs font-bold text-rose-700">
                        {item.lab_result}
                      </span>
                    ) : item.category === 'procedure' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                        Procedure
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Clinical Remarks / Intake Notes / Folliculometry Column */}
                  <td className="py-2 px-4">
                    {editingRemarksId === item.id ? (
                      <div className="flex items-center gap-1.5 w-full animate-in fade-in">
                        <input
                          type="text"
                          value={editRemarksVal}
                          onChange={(e) => setEditRemarksVal(e.target.value)}
                          placeholder={
                            item.category === 'medication'
                              ? "e.g. Taken with milk; mild fever; nausea"
                              : item.category === 'scan'
                              ? "e.g. ET - 8.2; R-18,16; L -17,15; Trilaminar"
                              : item.category === 'procedure'
                              ? "e.g. General anesthesia; 36h post-trigger"
                              : "e.g. Fasting sample drawn; urgent"
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitEditRemarks(item);
                            if (e.key === 'Escape') setEditingRemarksId(null);
                          }}
                          autoFocus
                          className="flex-1 text-xs px-2.5 py-1 bg-white border border-primary rounded font-normal text-slate-900 focus:outline-none ring-1 ring-primary shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleCommitEditRemarks(item)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all"
                          title="Save remark"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRemarksId(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div
                          onClick={() => handleStartEditRemarks(item)}
                          className={`text-xs px-2 py-1 rounded transition-colors flex-1 ${
                            !readonly ? 'cursor-pointer hover:bg-slate-100 hover:text-primary group/rem' : ''
                          }`}
                          title={!readonly ? 'Click to add/edit clinical remarks or intake notes' : undefined}
                        >
                          {item.category === 'scan' ? (
                            <div>
                              {item.scan_details && (
                                <span className="font-mono font-semibold text-slate-800 mr-1.5">
                                  {item.scan_details}
                                </span>
                              )}
                              {item.notes && (
                                <span className="text-slate-600 italic">
                                  {item.scan_details ? `• ${item.notes}` : item.notes}
                                </span>
                              )}
                              {!item.scan_details && !item.notes && (
                                <span className="text-slate-400 italic text-[11px] group-hover/rem:text-primary">
                                  + Add folliculometry &amp; scan remarks
                                </span>
                              )}
                            </div>
                          ) : item.category === 'medication' ? (
                            item.notes ? (
                              <span className="text-slate-700 font-medium">
                                {item.notes}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic text-[11px] group-hover/rem:text-slate-500">
                                + Add remark (tablet taken, fever, etc.)
                              </span>
                            )
                          ) : item.category === 'procedure' ? (
                            item.notes ? (
                              <span className="text-purple-900 font-semibold">{item.notes}</span>
                            ) : (
                              <span className="text-purple-400 italic text-[11px] group-hover/rem:text-purple-700">+ Add procedure instructions</span>
                            )
                          ) : (
                            item.notes ? (
                              <span className="text-slate-700 font-medium">{item.notes}</span>
                            ) : (
                              <span className="text-slate-300 italic text-[11px] group-hover/rem:text-slate-500">+ Add remarks</span>
                            )
                          )}
                        </div>

                        {/* Quick Structured Scan Edit Button (Uniform with Calendar View) */}
                        {item.category === 'scan' && onOpenScanEdit && !readonly && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenScanEdit(item.day_number);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-dark bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded px-2 py-1 transition-all cursor-pointer whitespace-nowrap shadow-2xs shrink-0"
                            title="Open full Folliculometry & Ultrasound structured dialog (Day-by-Day)"
                          >
                            <Activity className="w-3 h-3 text-primary" />
                            <span>Edit Follicles</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Action Column */}
                  {!readonly && (
                    <td className="py-2 px-3 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded cursor-pointer"
                        title="Delete item from plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer Toolbar */}
      {!readonly && (
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-mid transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Day Item (Medication, Scan, or Lab)</span>
            </button>
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary-mid text-white px-3.5 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Total Items: <strong className="text-slate-800">{items.length}</strong>
          </span>
        </div>
      )}

      {/* Quick Add Form Drawer */}
      {showQuickAdd && (
        <form
          onSubmit={handleQuickAddSubmit}
          className="bg-slate-50/80 border-t border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end animate-in fade-in duration-150"
        >
          <div>
            <label className="text-[10px] font-bold text-slate-700 block mb-1">Target Day</label>
            <select
              value={newDayNum}
              onChange={(e) => setNewDayNum(Number(e.target.value))}
              className="w-full text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Array.from({ length: 50 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Day {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-700 block mb-1">Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as PlanItemCategory)}
              className="w-full text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="medication">💊 Medication</option>
              <option value="scan">🩺 Ultrasound Scan</option>
              <option value="lab">🩸 Diagnostic Lab</option>
              <option value="procedure">🧫 Clinical Procedure</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-slate-700 block mb-1">Item Name</label>
            <input
              type="text"
              placeholder={
                newCategory === 'medication'
                  ? 'e.g. Follisurge IU, Cetrotix mg'
                  : newCategory === 'scan'
                  ? 'e.g. Tracking Scan, Baseline'
                  : newCategory === 'procedure'
                  ? 'e.g. Egg Collection (OPU), Embryo Transfer (ET), Cyst Aspiration'
                  : 'e.g. Estradiol (E2), LH'
              }
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          {newCategory === 'medication' && (
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1">Dose</label>
              <input
                type="text"
                placeholder="e.g. 175 IU or 0.25 mg"
                value={newDose}
                onChange={(e) => setNewDose(e.target.value)}
                className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-primary font-bold focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {newCategory === 'scan' && (
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1">Scan Finding</label>
              <input
                type="text"
                placeholder="ET - 2; R-10; L -4;"
                value={newScanDetails}
                onChange={(e) => setNewScanDetails(e.target.value)}
                className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {newCategory === 'procedure' && (
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1">Procedure Notes</label>
              <input
                type="text"
                placeholder="e.g. General anesthesia, 36h post-trigger"
                value={newScanDetails}
                onChange={(e) => setNewScanDetails(e.target.value)}
                className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-purple-900 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-1.5 px-3 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer active:scale-98"
            >
              Add Item
            </button>
            <button
              type="button"
              onClick={() => setShowQuickAdd(false)}
              className="py-1.5 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
