'use client';

import React from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  ShieldCheck,
  Syringe,
  Microscope,
  Baby,
  Calendar,
} from 'lucide-react';

interface TreatmentBoardTableProps {
  cycles: any[];
  isLoading: boolean;
  onConsent: (cycle: any) => void;
  onOpu: (cycle: any) => void;
  onEmbryology: (cycle: any) => void;
  onEtDischarge: (cycle: any) => void;
  onStimGrid: (cycle: any) => void;
}

export default function TreatmentBoardTable({
  cycles: filteredCycles,
  isLoading,
  onConsent,
  onOpu,
  onEmbryology,
  onEtDischarge,
  onStimGrid,
}: TreatmentBoardTableProps) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Cycle ID</th>
              <th className="py-3.5 px-4">Female Patient (Wife)</th>
              <th className="py-3.5 px-4">Male Partner (Husband)</th>
              <th className="py-3.5 px-4">Treatment Type</th>
              <th className="py-3.5 px-4">Cycle Day</th>
              <th className="py-3.5 px-4">Milestones (LMP / Stim / OPU / ET)</th>
              <th className="py-3.5 px-4">Status &amp; Issues</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading active treatment cycles...
                </td>
              </tr>
            ) : filteredCycles.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                  No treatment cycles match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredCycles.map((cycle) => {
                const sDates = cycle.sentinel_dates || {};
                const lmp = sDates.lmp_day1 || cycle.start_date;
                const stim = sDates.stim_start;

                const cycleDayNum = lmp
                  ? Math.max(1, Math.floor((Date.now() - new Date(lmp).getTime()) / 86400000) + 1)
                  : null;

                const stimDayNum = stim
                  ? Math.max(1, Math.floor((Date.now() - new Date(stim).getTime()) / 86400000) + 1)
                  : null;

                const fNotes = cycle.patient_clinical_notes || [];
                const mNotes = cycle.partner_clinical_notes || [];

                return (
                  <tr key={cycle.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Cycle ID */}
                    <td className="py-4 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      <span className="bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
                        {cycle.cycle_id}
                      </span>
                      <div className="text-[10px] text-slate-400 font-normal mt-1">
                        Attempt #{cycle.attempt_number || 1}
                      </div>
                    </td>

                    {/* Female Patient */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-pink-50 border border-pink-200 text-pink-700 flex items-center justify-center text-[10px] font-bold">
                          ♀
                        </span>
                        <div>
                          <Link
                            href={`/patients/${cycle.patient_id}`}
                            className="font-bold text-slate-900 hover:text-primary transition-colors flex items-center gap-1 group"
                          >
                            <span>{cycle.patient_name || 'Female Patient'}</span>
                            <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-primary" />
                          </Link>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span>VID: {cycle.patient_vid || 'Pending'}</span>
                            {cycle.patient_age && <span>• {cycle.patient_age} yrs</span>}
                            {cycle.patient_blood_group && (
                              <span className="font-bold text-rose-700 bg-rose-50 px-1 rounded">
                                {cycle.patient_blood_group}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Male Partner */}
                    <td className="py-4 px-4">
                      {cycle.partner_name ? (
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-primary/10 border border-primary/20 text-slate-800 flex items-center justify-center text-[10px] font-bold">
                            ♂
                          </span>
                          <div>
                            <p className="font-bold text-slate-800">{cycle.partner_name}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span>VID: {cycle.partner_vid || 'Pending'}</span>
                              {cycle.partner_age && <span>• {cycle.partner_age} yrs</span>}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No partner linked</span>
                      )}
                    </td>

                    {/* Treatment Type */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {cycle.treatment_type || 'Standard IVF'}
                        </span>
                        {cycle.protocol_type && (
                          <div className="text-[10px] text-slate-500 font-medium">
                            {cycle.protocol_type}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Cycle & Stim Day */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {cycleDayNum ? (
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-800">Day {cycleDayNum}</span>
                            <span className="text-[10px] text-slate-400">(LMP)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">LMP unset</span>
                        )}
                        {stimDayNum ? (
                          <div className="text-[11px] font-bold text-emerald-600">
                            Stim Day {stimDayNum}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Milestones */}
                    <td className="py-4 px-4">
                      <div className="space-y-1 text-[11px] font-mono">
                        {sDates.opu_date && (
                          <div className="text-purple-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span>OPU: {sDates.opu_date}</span>
                          </div>
                        )}
                        {sDates.transfer_date && (
                          <div className="text-pink-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                            <span>ET: {sDates.transfer_date}</span>
                          </div>
                        )}
                        {!sDates.opu_date && !sDates.transfer_date && (
                          <span className="text-slate-400 font-sans italic">In Ovarian Stimulation</span>
                        )}
                      </div>
                    </td>

                    {/* Status & Issues */}
                    <td className="py-4 px-4">
                      <div className="space-y-1.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            cycle.status === 'running'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : cycle.status === 'completed'
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {cycle.status}
                        </span>

                        {/* Issues preview tag */}
                        {(fNotes.length > 0 || mNotes.length > 0) && (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {fNotes.slice(0, 1).map((n: string, i: number) => (
                              <span
                                key={i}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200 truncate max-w-[130px]"
                                title={n}
                              >
                                ♀ {n}
                              </span>
                            ))}
                            {mNotes.slice(0, 1).map((n: string, i: number) => (
                              <span
                                key={i}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-slate-800 border border-primary/20 truncate max-w-[130px]"
                                title={n}
                              >
                                ♂ {n}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onConsent(cycle)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md font-bold text-[11px] transition-colors border border-amber-200 flex items-center gap-1"
                          title="Statutory Consents (ART Act 2021 Forms 8, 11, 13, 15)"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>Consent</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpu(cycle)}
                          className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-md font-bold text-[11px] transition-colors border border-purple-200 flex items-center gap-1"
                          title="OPU Aspiration &amp; Egg Retrieval Report"
                        >
                          <Syringe className="w-3.5 h-3.5 text-purple-600" />
                          <span>OPU</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onEmbryology(cycle)}
                          className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary rounded-md font-bold text-[11px] transition-colors border border-primary/20 flex items-center gap-1"
                          title="Master Embryology &amp; Insemination Form"
                        >
                          <Microscope className="w-3.5 h-3.5 text-primary" />
                          <span>Embryo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onEtDischarge(cycle)}
                          className="px-2.5 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-md font-bold text-[11px] transition-colors border border-pink-200 flex items-center gap-1"
                          title="Embryo Transfer Discharge Protocol &amp; Luteal Support Schedule"
                        >
                          <Baby className="w-3.5 h-3.5 text-pink-600" />
                          <span>ET Protocol</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onStimGrid(cycle)}
                          className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/15 text-slate-800 rounded-md font-bold text-[11px] transition-colors border border-primary/20 flex items-center gap-1"
                          title="Open Day-by-Day Medication Calendar Grid"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Stim Grid</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
