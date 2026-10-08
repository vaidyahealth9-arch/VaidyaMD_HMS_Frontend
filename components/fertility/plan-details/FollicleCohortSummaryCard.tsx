'use client';

import React from 'react';
import { Flame, Zap, Activity } from 'lucide-react';
import { FollicleCohortStats } from './types';

interface FollicleCohortSummaryCardProps {
  stats: FollicleCohortStats;
  estimatedTriggerDate?: string;
}

export default function FollicleCohortSummaryCard({
  stats,
  estimatedTriggerDate,
}: FollicleCohortSummaryCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 1. Follicular Cohort */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Follicle Cohort (Latest Scan)
          </span>
          {stats.hasData && stats.dayNumber && (
            <span className="text-[10px] text-slate-400">Day {stats.dayNumber}</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            &ge;18mm: <strong>{stats.matureCount}</strong>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            14–17mm: <strong>{stats.intermediateCount}</strong>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            &lt;14mm: <strong>{stats.smallCount}</strong>
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          Lead Follicle:{' '}
          <strong
            className={
              stats.leadFollicle >= 18
                ? 'text-emerald-700 font-bold'
                : 'text-slate-700'
            }
          >
            {stats.leadFollicle ? `${stats.leadFollicle} mm` : 'No scans recorded yet'}
          </strong>
        </div>
      </div>

      {/* 2. Trigger Readiness */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            Trigger Readiness
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              stats.triggerReady
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {stats.triggerReady ? 'Trigger Ready ⚡' : 'Stimulation Ongoing'}
          </span>
        </div>
        <p className="text-xs text-slate-700 mt-1">
          {stats.triggerReady ? (
            <span className="text-emerald-800 font-semibold">
              ✓ Cohort criteria met (&ge;3 follicles &ge;17–18mm). Administer hCG or Dual Trigger (35–36h prior to OPU).
            </span>
          ) : (
            <span className="text-slate-500">
              Continue stimulation. Target &ge;3 lead follicles reaching &ge;17–18mm before administering trigger.
            </span>
          )}
        </p>
        <div className="mt-2 text-[11px] text-slate-500">
          Estimated Trigger Date: <strong>{estimatedTriggerDate || 'Pending Scan Review'}</strong>
        </div>
      </div>

      {/* 3. OHSS Safety & Peak Hormones */}
      <div
        className={`border rounded-xl p-3.5 shadow-2xs flex flex-col justify-between ${
          stats.isHighOhssRisk
            ? 'bg-rose-50/70 border-rose-300 text-rose-950'
            : stats.isModerateOhssRisk
            ? 'bg-amber-50/70 border-amber-300 text-amber-950'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Activity
              className={`w-3.5 h-3.5 ${
                stats.isHighOhssRisk ? 'text-rose-600' : 'text-slate-500'
              }`}
            />
            OHSS Risk &amp; Hormones
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              stats.isHighOhssRisk
                ? 'bg-rose-200 text-rose-900 border border-rose-300'
                : stats.isModerateOhssRisk
                ? 'bg-amber-200 text-amber-900 border border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}
          >
            {stats.isHighOhssRisk
              ? 'High Risk'
              : stats.isModerateOhssRisk
              ? 'Moderate Risk'
              : 'Low / Safe'}
          </span>
        </div>
        <p className="text-xs mt-1">
          {stats.isHighOhssRisk ? (
            <span className="text-rose-900 font-medium">
              ⚠️ GnRH agonist trigger (Decapeptyl 0.2mg) recommended. Freeze-all protocol to prevent OHSS.
            </span>
          ) : stats.isModerateOhssRisk ? (
            <span className="text-amber-900 font-medium">
              Close monitoring of fluid intake, $E_2$ trajectory, and consider reduced hCG trigger dose.
            </span>
          ) : (
            <span className="text-slate-600">
              Hormone levels and cohort within safe stimulation threshold.
            </span>
          )}
        </p>
        <div className="mt-2 text-[11px] text-slate-500 flex justify-between items-center">
          <span>
            Peak $E_2$: <strong>{stats.peakE2 ? `${stats.peakE2} pg/mL` : '—'}</strong>
          </span>
          <span>
            Total Follicles: <strong>{stats.totalCount}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
