'use client';

import React, { useState } from 'react';
import { FlaskConical, HeartHandshake, Snowflake, Scissors } from 'lucide-react';
import AndrologyDataEntry from '@/components/fertility/AndrologyDataEntry';
import SpermWashComparisonTable from '@/components/fertility/SpermWashComparisonTable';
import DFIHaloChart from '@/components/fertility/DFIHaloChart';

interface AndrologyTabProps {
  malePatients: any[];
  cycles: any[];
  selectedMalePatient: any;
  onSelectMalePatient: (patient: any) => void;
  onOpenSpermPrep: () => void;
  onOpenIuiDonor: () => void;
  onOpenSpermFreezing: () => void;
  onOpenSurgical: () => void;
}

export default function AndrologyTab({
  malePatients,
  cycles,
  selectedMalePatient,
  onSelectMalePatient,
  onOpenSpermPrep,
  onOpenIuiDonor,
  onOpenSpermFreezing,
  onOpenSurgical,
}: AndrologyTabProps) {
  const [andrologyQueueFilter, setAndrologyQueueFilter] = useState<'active_cycles' | 'all'>('active_cycles');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');

  const filteredPatients = malePatients
    .filter((p) => {
      if (andrologyQueueFilter === 'active_cycles') {
        return cycles.some((c: any) => c.partner_id === p.id || c.patient_id === p.id);
      }
      return true;
    })
    .filter(
      (p) =>
        !patientSearchQuery ||
        p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        p.vid?.toLowerCase().includes(patientSearchQuery.toLowerCase())
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Patient Selector */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm flex flex-col h-[calc(100vh-12rem)]">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Male Patients</h3>
          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setAndrologyQueueFilter('active_cycles')}
              className={`px-2 py-0.5 rounded transition-all ${
                andrologyQueueFilter === 'active_cycles'
                  ? 'bg-white text-primary shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Active Cycles
            </button>
            <button
              type="button"
              onClick={() => setAndrologyQueueFilter('all')}
              className={`px-2 py-0.5 rounded transition-all ${
                andrologyQueueFilter === 'all'
                  ? 'bg-white text-primary shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Males
            </button>
          </div>
        </div>
        <input
          type="text"
          placeholder="Search by name or VID..."
          value={patientSearchQuery}
          onChange={(e) => setPatientSearchQuery(e.target.value)}
          className="vmd-input text-xs w-full mb-2"
        />
        <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {filteredPatients.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectMalePatient(p)}
              className={`w-full flex flex-col gap-1 p-3.5 rounded-lg border text-left transition-all ${
                selectedMalePatient?.id === p.id
                  ? 'border-primary bg-primary/5 text-slate-900 shadow-sm'
                  : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <p className="font-bold text-sm leading-tight">{p.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                  {p.vid}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">{p.age} yrs</span>
              </div>
            </button>
          ))}
          {filteredPatients.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No male patients found for this filter.
            </div>
          )}
        </div>
      </div>

      {/* CASA Semen Report Form */}
      <div className="lg:col-span-3 space-y-6">
        {selectedMalePatient ? (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
            <AndrologyDataEntry
              patientId={selectedMalePatient.id}
              patientName={selectedMalePatient.name}
              patientVid={selectedMalePatient.vid}
            />

            <div className="flex items-center gap-2.5 flex-wrap pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onOpenSpermPrep}
                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-md transition-colors border border-emerald-200 shadow-2xs flex items-center gap-1.5"
              >
                <FlaskConical className="w-4 h-4 text-emerald-600" />
                <span>Semen Wash &amp; IUI Prep</span>
              </button>

              <button
                type="button"
                onClick={onOpenIuiDonor}
                className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs rounded-md transition-colors border border-teal-200 shadow-2xs flex items-center gap-1.5"
              >
                <HeartHandshake className="w-4 h-4 text-teal-600" />
                <span>IUI Donor (IUI-D)</span>
              </button>

              <button
                type="button"
                onClick={onOpenSpermFreezing}
                className="px-4 py-2.5 bg-primary/10 hover:bg-primary/15 text-primary font-semibold text-xs rounded-md transition-colors border border-primary/20 shadow-2xs flex items-center gap-1.5"
              >
                <Snowflake className="w-4 h-4 text-primary" />
                <span>Semen Freezing Record</span>
              </button>

              <button
                type="button"
                onClick={onOpenSurgical}
                className="px-4 py-2.5 bg-primary/10 hover:bg-primary/15 text-primary font-semibold text-xs rounded-md transition-colors border border-primary/20 shadow-2xs flex items-center gap-1.5"
              >
                <Scissors className="w-4 h-4 text-primary" />
                <span>Surgical Retrieval (TESA/PESA)</span>
              </button>
            </div>

            <div className="mt-8">
              {/* Pre-Wash vs Post-Wash Semen Preparation & TMSI Calculator */}
              <SpermWashComparisonTable />

              {/* Sperm DFI Halo Chromatin Dispersion Test */}
              <DFIHaloChart onChange={() => {}} />
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400 text-xs">
            Select a male patient from the queue to view CASA analysis.
          </div>
        )}
      </div>
    </div>
  );
}
