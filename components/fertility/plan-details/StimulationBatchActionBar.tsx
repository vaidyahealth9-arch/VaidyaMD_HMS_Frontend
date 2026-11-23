'use client';

import React, { useState } from 'react';
import {
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
  Sparkles,
  Check,
  Settings2,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';

export type BatchOperationMode = 'add' | 'modify' | 'delete';

interface StimulationBatchActionBarProps {
  batchMode: BatchOperationMode;
  onSetBatchMode: (mode: BatchOperationMode) => void;
  selectedDays?: number[];
  selectedItemIds?: string[];
  activeMedName?: string | null;
  initialDose?: string;
  onQuickPresetDays?: (preset: 'all' | 'stim' | 'next5' | 'clear') => void;
  onOpenAddModal?: () => void;
  onQuickApplyDose?: (newDose: string) => void;
  onOpenAdvanceModal?: () => void;
  onOpenDeleteModal: () => void;
  onClearSelection: () => void;
  onCloseBatchMode?: () => void;
}

export default function StimulationBatchActionBar({
  batchMode,
  onSetBatchMode,
  selectedDays = [],
  selectedItemIds = [],
  activeMedName = null,
  initialDose = '',
  onQuickPresetDays,
  onOpenAddModal,
  onQuickApplyDose,
  onOpenAdvanceModal,
  onOpenDeleteModal,
  onClearSelection,
  onCloseBatchMode,
}: StimulationBatchActionBarProps) {
  const [quickDose, setQuickDose] = useState(initialDose);

  React.useEffect(() => {
    if (activeMedName && initialDose) {
      setQuickDose(initialDose);
    } else if (!activeMedName) {
      setQuickDose('');
    }
  }, [activeMedName, initialDose]);

  const numDays = selectedDays.length;
  const numItems = selectedItemIds.length;
  const hasSelection = batchMode === 'add' ? numDays > 0 : numItems > 0;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200 w-[94vw] max-w-6xl">
      {/* 3-Mode Switcher Tabs */}
      <div className="flex items-center bg-slate-800/90 rounded-xl p-0.5 border border-slate-700 shrink-0">
        <button
          type="button"
          onClick={() => {
            onSetBatchMode('modify');
            onClearSelection();
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            batchMode === 'modify'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
          title="Auto-select identical medications and adjust dosage across days"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Modify Meds</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSetBatchMode('add');
            onClearSelection();
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            batchMode === 'add'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
          title="Select days and insert medication, scan, or procedure across all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add to Days</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSetBatchMode('delete');
            onClearSelection();
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            batchMode === 'delete'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
          title="Freely select any rows and bulk delete with single warning"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete / Clean</span>
        </button>
      </div>

      {/* Mode-Specific Actions Strip (Expansive & Generous) */}
      <div className="flex items-center gap-2.5 flex-wrap flex-1 justify-center md:justify-start px-2">
        {/* MODE: ADD TO DAYS */}
        {batchMode === 'add' && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Quick Presets */}
            {onQuickPresetDays && (
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => onQuickPresetDays('all')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer border border-slate-700"
                >
                  All Days
                </button>
                <button
                  type="button"
                  onClick={() => onQuickPresetDays('stim')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer border border-slate-700"
                >
                  Stim Days
                </button>
                <button
                  type="button"
                  onClick={() => onQuickPresetDays('next5')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer border border-slate-700"
                >
                  Next 5D
                </button>
              </div>
            )}

            {numDays > 0 ? (
              <Button
                type="button"
                onClick={onOpenAddModal}
                className="bg-primary hover:bg-primary-mid text-white text-xs font-bold h-8.5 px-4 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Event to {numDays} {numDays === 1 ? 'Day' : 'Days'}</span>
              </Button>
            ) : (
              <span className="text-xs text-slate-400 italic pl-1">
                Select days on the table or choose a preset chip
              </span>
            )}
          </div>
        )}

        {/* MODE: MODIFY MEDS */}
        {batchMode === 'modify' && (
          <div className="flex items-center gap-3 flex-wrap">
            {numItems > 0 && activeMedName ? (
              <>
                <div className="text-left pr-3 border-r border-slate-700">
                  <span className="text-xs font-bold text-amber-300 block max-w-xs md:max-w-md truncate" title={activeMedName}>
                    {activeMedName}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {numItems} {numItems === 1 ? 'day' : 'days'} selected
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={quickDose}
                    onChange={(e) => setQuickDose(e.target.value)}
                    placeholder="New Dose (e.g. 225 IU)"
                    className="w-40 text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && quickDose.trim() && onQuickApplyDose) {
                        onQuickApplyDose(quickDose.trim());
                        setQuickDose('');
                      }
                    }}
                  />
                  {onQuickApplyDose && (
                    <Button
                      type="button"
                      disabled={!quickDose.trim()}
                      onClick={() => {
                        onQuickApplyDose(quickDose.trim());
                        setQuickDose('');
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-8.5 px-4 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Apply to {numItems} {numItems === 1 ? 'Day' : 'Days'}</span>
                    </Button>
                  )}
                  {onOpenAdvanceModal && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onOpenAdvanceModal}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-semibold h-8.5 px-3 rounded-lg cursor-pointer flex items-center gap-1.5"
                      title="Edit Route, Frequency, Instructions, or Clear other meds"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Advance</span>
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <span className="text-xs text-slate-400 italic pl-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Click any medication row to auto-select and update dosage</span>
              </span>
            )}
          </div>
        )}

        {/* MODE: DELETE / CLEAN */}
        {batchMode === 'delete' && (
          <div className="flex items-center gap-2">
            {numItems > 0 ? (
              <Button
                type="button"
                onClick={onOpenDeleteModal}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-8.5 px-4 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({numItems})</span>
              </Button>
            ) : (
              <span className="text-xs text-slate-400 italic pl-1">
                Check any row(s) below to remove from schedule
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Clear & Done */}
      <div className="flex items-center gap-1.5 shrink-0">
        {hasSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Clear active selection"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {onCloseBatchMode && (
          <button
            type="button"
            onClick={onCloseBatchMode}
            className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer border border-slate-700"
            title="Exit Batch Mode"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}
