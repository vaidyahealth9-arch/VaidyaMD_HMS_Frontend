'use client';

import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, CreditCard, AlertTriangle, ShieldAlert } from 'lucide-react';
import { PatientWalletCard } from '@/components/billing';

interface OverviewTabProps {
  patientId: string;
  patient: any;
  cycles: any[];
  invoices: any[];
  onAddNewCycle: () => void;
  onSelectCycle: (cycle: any) => void;
  onOpenBillingTab: () => void;
  onWalletUpdated: () => void;
  onEditAlerts?: () => void;
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
  onEditAlerts,
}: OverviewTabProps) {
  const [isCyclesCardExpanded, setIsCyclesCardExpanded] = useState<boolean>(true);
  const alerts = Array.isArray(patient?.alert_notes) ? patient.alert_notes : [];

  return (
    <div className="space-y-6 w-full">
      {/* Clinical Alerts & Drug Allergies Card */}
      <div
        className={`border rounded-lg p-4 shadow-xs transition-all ${
          alerts.length > 0
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {alerts.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Clinical Alerts &amp; Critical Allergies
            </h3>
            {alerts.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                {alerts.length} Active
              </span>
            )}
          </div>

          {onEditAlerts && (
            <button
              type="button"
              onClick={onEditAlerts}
              className="text-xs font-bold text-primary hover:text-primary-mid hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{alerts.length > 0 ? 'Edit Alerts' : 'Add Alert'}</span>
            </button>
          )}
        </div>

        <div className="mt-2.5">
          {alerts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {alerts.map((alert: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-white text-amber-900 border border-amber-300 shadow-2xs"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  {alert}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              No active clinical alerts or critical allergies recorded for this patient.
            </p>
          )}
        </div>
      </div>

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

        <PatientWalletCard
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
