'use client';

import React, { useState } from 'react';
import { AlertTriangle, Flame } from 'lucide-react';

export type CryoExpiryBucket = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'DUE_30' | 'DUE_60' | 'THAWED_DISCARDED';

interface CryopreservationTabProps {
  cryoSamples: any[];
  expiringSamples: any[];
  onOpenVitrify: () => void;
  onSelectThawSample: (sample: any) => void;
}

export default function CryopreservationTab({
  cryoSamples,
  expiringSamples,
  onOpenVitrify,
  onSelectThawSample,
}: CryopreservationTabProps) {
  const [cryoFilterBucket, setCryoFilterBucket] = useState<CryoExpiryBucket>('ALL');

  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const in60Days = new Date();
  in60Days.setDate(in60Days.getDate() + 60);

  const cryoCounts = {
    all: cryoSamples.length,
    active: cryoSamples.filter((s) => s.status === 'Available' || s.status === 'STORED').length,
    expired: cryoSamples.filter(
      (s) => s.expiry_date && new Date(s.expiry_date) < now && s.status !== 'Warmed' && s.status !== 'Discarded'
    ).length,
    due30: cryoSamples.filter((s) => {
      if (!s.expiry_date || s.status === 'Warmed' || s.status === 'Discarded') return false;
      const exp = new Date(s.expiry_date);
      return exp >= now && exp <= in30Days;
    }).length,
    due60: cryoSamples.filter((s) => {
      if (!s.expiry_date || s.status === 'Warmed' || s.status === 'Discarded') return false;
      const exp = new Date(s.expiry_date);
      return exp >= now && exp <= in60Days;
    }).length,
    thawedDiscarded: cryoSamples.filter(
      (s) => s.status === 'Warmed' || s.status === 'Discarded' || s.status === 'THAWED' || s.status === 'DISCARDED'
    ).length,
  };

  const filteredCryo = cryoSamples.filter((s) => {
    const isWarmedOrDiscarded =
      s.status === 'Warmed' || s.status === 'Discarded' || s.status === 'THAWED' || s.status === 'DISCARDED';
    const exp = s.expiry_date ? new Date(s.expiry_date) : null;

    if (cryoFilterBucket === 'ALL') return true;
    if (cryoFilterBucket === 'ACTIVE') return !isWarmedOrDiscarded;
    if (cryoFilterBucket === 'EXPIRED') return exp !== null && exp < now && !isWarmedOrDiscarded;
    if (cryoFilterBucket === 'DUE_30') return exp !== null && exp >= now && exp <= in30Days && !isWarmedOrDiscarded;
    if (cryoFilterBucket === 'DUE_60') return exp !== null && exp >= now && exp <= in60Days && !isWarmedOrDiscarded;
    if (cryoFilterBucket === 'THAWED_DISCARDED') return isWarmedOrDiscarded;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Statutory Expiry Alert Feed */}
      {expiringSamples.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between text-amber-900 text-xs shadow-sm">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <strong>Statutory Cryo Renewal Alert:</strong> {expiringSamples.length} cryo samples nearing 30-day consent limit under ART Act 2021 Form 15.
          </span>
          <button onClick={() => setCryoFilterBucket('DUE_30')} className="font-bold underline text-amber-950">
            View Samples →
          </button>
        </div>
      )}

      {/* 6-Bucket Statutory Expiry Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-200/60 rounded-lg shadow-inner">
          {[
            { id: 'ALL', label: 'All Straws', count: cryoCounts.all, color: 'text-slate-700' },
            { id: 'ACTIVE', label: 'Active / Stored', count: cryoCounts.active, color: 'text-emerald-700' },
            { id: 'EXPIRED', label: 'Expired', count: cryoCounts.expired, color: 'text-rose-700 font-bold' },
            { id: 'DUE_30', label: 'Due in 30 Days', count: cryoCounts.due30, color: 'text-amber-700 font-bold' },
            { id: 'DUE_60', label: 'Due in 60 Days', count: cryoCounts.due60, color: 'text-primary' },
            { id: 'THAWED_DISCARDED', label: 'Thawed / Discarded', count: cryoCounts.thawedDiscarded, color: 'text-slate-500' },
          ].map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setCryoFilterBucket(b.id as CryoExpiryBucket)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                cryoFilterBucket === b.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>{b.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  cryoFilterBucket === b.id
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                {b.count}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onOpenVitrify}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>+ Vitrify Straw into Coordinates</span>
        </button>
      </div>

      {/* Cryobank Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Straw #</th>
              <th className="p-3.5">Patient Details</th>
              <th className="p-3.5">Physical Coordinates (Tank-Can-Goblet)</th>
              <th className="p-3.5">Color Coordinates</th>
              <th className="p-3.5">Count & Grade</th>
              <th className="p-3.5">Consent Expiry</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredCryo.map((sample) => (
              <tr key={sample.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-mono font-bold text-primary">{sample.straw_number}</td>
                <td className="p-3.5">
                  <p className="font-bold text-slate-900">{sample.patient_name || 'Patient'}</p>
                  <p className="font-mono text-[10px] text-slate-400">{sample.patient_vid || '—'}</p>
                </td>
                <td className="p-3.5 font-mono text-slate-600">
                  {sample.tank_number} · {sample.canister_number} · Goblet {sample.goblet_colour}
                </td>
                <td className="p-3.5">
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {sample.canister_colour}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {sample.goblet_colour}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {sample.cryo_device_colour}
                    </span>
                  </div>
                </td>
                <td className="p-3.5 font-bold">
                  {sample.no_of_embryos} embryos (4AA)
                </td>
                <td className="p-3.5 text-slate-500 whitespace-nowrap">
                  {sample.expiry_date || '—'}
                </td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      sample.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {sample.status}
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  {sample.status === 'Available' && (
                    <button
                      onClick={() => onSelectThawSample(sample)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[10px] uppercase transition-colors"
                    >
                      <Flame className="w-3.5 h-3.5 mr-1 inline text-amber-600" /> Warm/Thaw
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredCryo.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  No cryo straws found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
