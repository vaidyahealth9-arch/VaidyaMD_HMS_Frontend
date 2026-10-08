'use client';

import React from 'react';
import { Sparkles, Dna, Baby, HeartHandshake } from 'lucide-react';
import CoupleHeaderBanner from '@/components/fertility/CoupleHeaderBanner';
import OocyteGridTable from '@/components/fertility/OocyteGridTable';

interface EmbryologyTabProps {
  cycles: any[];
  activeCycle: any;
  patients: any[];
  onSelectCycle: (cycle: any) => void;
  onNotesUpdated: () => void;
  onOpenOpu: () => void;
  onOpenMasterEmbryology: () => void;
  onOpenEtDischarge: () => void;
  onOpenDonorEt: () => void;
}

export default function EmbryologyTab({
  cycles,
  activeCycle,
  patients,
  onSelectCycle,
  onNotesUpdated,
  onOpenOpu,
  onOpenMasterEmbryology,
  onOpenEtDischarge,
  onOpenDonorEt,
}: EmbryologyTabProps) {
  const femalePatient = activeCycle
    ? patients.find((p) => p.id === activeCycle.patient_id) || {
        id: activeCycle.patient_id,
        name: activeCycle.patient_name || 'Female Patient',
        vid: activeCycle.patient_vid,
        age: activeCycle.patient_age,
        phone: activeCycle.patient_phone,
        blood_group: activeCycle.patient_blood_group,
        clinical_notes: activeCycle.patient_clinical_notes,
      }
    : null;

  const malePartner = activeCycle
    ? patients.find((p) => p.id === activeCycle.partner_id) ||
      (activeCycle.partner_name
        ? {
            id: activeCycle.partner_id,
            name: activeCycle.partner_name,
            vid: activeCycle.partner_vid,
            age: activeCycle.partner_age,
            phone: activeCycle.partner_phone,
            blood_group: activeCycle.partner_blood_group,
            clinical_notes: activeCycle.partner_clinical_notes,
          }
        : null)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Active Cycle Selector */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active ART Cycles</h3>
        <div className="space-y-2">
          {cycles.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCycle(c)}
              className={`w-full flex flex-col gap-1 p-3.5 rounded-lg border text-left transition-all ${
                activeCycle?.id === c.id
                  ? 'border-primary bg-primary/5 text-slate-900 shadow-sm'
                  : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-primary">{c.cycle_id}</span>
                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {c.status}
                </span>
              </div>
              <p className="font-bold text-sm leading-tight text-slate-900">{c.patient_name || 'Patient'}</p>
              <p className="text-[11px] text-slate-400">
                {c.treatment_type} (Attempt #{c.attempt_number})
              </p>
            </button>
          ))}
          {cycles.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">No active cycles found.</div>
          )}
        </div>
      </div>

      {/* Day 0-7 Matrix & Dual-Witness Gate */}
      <div className="lg:col-span-3 space-y-6">
        {activeCycle && femalePatient ? (
          <>
            <CoupleHeaderBanner
              femalePatient={femalePatient}
              malePatient={malePartner}
              treatmentCycle={activeCycle}
              onNotesUpdated={onNotesUpdated}
            />

            <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-lg px-5 py-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700">
                  Embryology Culture &amp; Development Matrix ({activeCycle.cycle_id})
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={onOpenOpu}
                  className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs rounded-md transition-colors border border-pink-200 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                  <span>OPU Aspiration Report</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenMasterEmbryology}
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary font-bold text-xs rounded-md transition-colors border border-primary/20 flex items-center gap-1.5"
                >
                  <Dna className="w-3.5 h-3.5 text-primary" />
                  <span>Master Embryology Form</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenEtDischarge}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-md transition-colors border border-purple-200 flex items-center gap-1.5"
                >
                  <Baby className="w-4 h-4 text-purple-600" />
                  <span>ET Discharge Protocol</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenDonorEt}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-md transition-colors border border-teal-200 flex items-center gap-1.5"
                >
                  <HeartHandshake className="w-3.5 h-3.5 text-teal-600" />
                  <span>Donor Embryo Transfer</span>
                </button>
              </div>
            </div>

            <OocyteGridTable cycleId={activeCycle.id} />
          </>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400 text-xs">
            Select an active ART cycle to open embryology matrix.
          </div>
        )}
      </div>
    </div>
  );
}
