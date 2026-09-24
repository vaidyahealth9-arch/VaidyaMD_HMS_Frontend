'use client';

import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import FertilityWalletCard from '@/components/fertility/FertilityWalletCard';

interface OverviewTabProps {
  patientId: string;
  patient: any;
  cycles: any[];
  invoices: any[];
  onAddNewCycle: () => void;
  onSelectCycle: (cycle: any) => void;
  onOpenBillingTab: () => void;
  onWalletUpdated: () => void;
}

export default function OverviewTab({
  patientId,
  patient,
  cycles,
  invoices,
  onAddNewCycle,
  onSelectCycle,
  onOpenBillingTab,
  onWalletUpdated,
}: OverviewTabProps) {
  const [isCyclesCardExpanded, setIsCyclesCardExpanded] = useState<boolean>(true);

  return (
    <div className="space-y-6 w-full">
      {/* Active Treatment Cycles Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setIsCyclesCardExpanded(!isCyclesCardExpanded)}
          >
            <h3 className="font-bold text-sm text-slate-900">Treatment Cycles Overview</h3>
            <button
              type="button"
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
              aria-label={isCyclesCardExpanded ? 'Collapse cycles' : 'Expand cycles'}
            >
              {isCyclesCardExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={onAddNewCycle}
            className="px-3 py-1.5 bg-primary hover:bg-primary-mid text-white rounded-md font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Cycle</span>
          </button>
        </div>

        {isCyclesCardExpanded && (
          cycles.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No active or completed cycles on file.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {cycles.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{c.cycle_id}</span>
                      <strong className="text-slate-900">{c.treatment_type} (Attempt #{c.attempt_number})</strong>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1">
                      Stimulation Start: {c.sentinel_dates?.stim_start || '—'} · OPU: {c.sentinel_dates?.opu || '—'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectCycle(c)}
                    className="font-bold text-primary hover:underline cursor-pointer"
                  >
                    View Calendar →
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Advance Wallet Card */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Fertility Wallet / Financial Statement
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Live Ledger
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenBillingTab}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open Full Billing Tab</span>
            <span>→</span>
          </button>
        </div>

        <FertilityWalletCard
          patientId={patientId}
          patientName={patient?.name}
          patientVid={patient?.vid}
          invoices={invoices}
          onWalletUpdated={onWalletUpdated}
          compact={true}
        />
      </div>
    </div>
  );
}
