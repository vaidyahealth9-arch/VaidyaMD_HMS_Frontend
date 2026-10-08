'use client';

import React from 'react';
import { Plus, Lock } from 'lucide-react';
import { CycleSubTab } from './types';
import { toast } from '@/contexts/ToastContext';

interface TreatmentCycleSubTabsProps {
  activeTab: CycleSubTab;
  onSelectTab: (tab: CycleSubTab) => void;
  onAddNewCycle: () => void;
  isDraftMode?: boolean;
  isModalitySelected?: boolean;
}

const TABS: { id: CycleSubTab; label: string }[] = [
  { id: 'intended', label: 'Intended Treatment' },
  { id: 'gametes', label: 'Gametes' },
  { id: 'pgs_pgd', label: 'PGS / PGD' },
  { id: 'treatment_plan', label: 'Treatment Plan' },
  { id: 'endometrial', label: 'Endometrial Monitoring' },
  { id: 'plan_details', label: 'Plan Details' },
  { id: 'summary', label: 'Summary' },
];

export default function TreatmentCycleSubTabs({
  activeTab,
  onSelectTab,
  onAddNewCycle,
  isDraftMode = false,
  isModalitySelected = true,
}: TreatmentCycleSubTabsProps) {
  const handleTabClick = (tabId: CycleSubTab) => {
    if (isDraftMode && !isModalitySelected && tabId !== 'intended') {
      toast.warning('Step 1 Required', 'Please select Treatment Modality in Step 1 to unlock subsequent cycle steps.');
      return;
    }
    onSelectTab(tabId);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
      {/* Sub Tabs Pill Bar */}
      <div className="flex items-center overflow-x-auto custom-scrollbar bg-slate-100/90 p-1 rounded-xl text-xs font-semibold gap-1 border border-slate-200/80 shadow-2xs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isLocked = isDraftMode && !isModalitySelected && tab.id !== 'intended';

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              disabled={isLocked}
              title={isLocked ? 'Select Treatment Modality in Step 1 first' : undefined}
              className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap text-xs flex items-center gap-1.5 ${
                isLocked
                  ? 'opacity-40 cursor-not-allowed text-slate-400 select-none'
                  : isActive
                  ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200/50 cursor-pointer'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 cursor-pointer'
              }`}
            >
              {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Add New Cycle Button */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onAddNewCycle}
          className="px-3.5 py-1.5 bg-primary hover:bg-primary-mid text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add New Cycle</span>
        </button>
      </div>
    </div>
  );
}
