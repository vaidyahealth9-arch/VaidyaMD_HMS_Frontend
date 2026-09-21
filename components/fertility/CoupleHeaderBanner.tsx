'use client';

import React, { useState } from 'react';
import {
  Heart,
  User,
  Calendar,
  Activity,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  FileText,
  AlertTriangle,
  Clock,
  Dna,
  ShieldCheck,
  Syringe,
} from 'lucide-react';
import Link from 'next/link';
import { patientsApi } from '@/lib/api';
import StatutoryConsentModal from '@/components/fertility/StatutoryConsentModal';

export interface CoupleHeaderBannerProps {
  femalePatient: any;
  malePatient?: any;
  treatmentCycle?: any;
  onNotesUpdated?: () => void;
  compact?: boolean;
  onUnlinkPartner?: () => void;
}

const FEMALE_PRESET_TAGS = [
  'PCOS (Rotterdam)',
  'Low AMH (<1.1 ng/mL)',
  'Diminished Ovarian Reserve',
  'Bilateral Tubal Block',
  'Severe Endometriosis (Stage IV)',
  'Adenomyosis',
  'Recurrent Implantation Failure',
  'Thin Endometrium (<7mm)',
  'Poor Responder Protocol',
];

const MALE_PRESET_TAGS = [
  'Severe Oligoasthenozoospermia',
  'Teratozoospermia (<2% Kruger)',
  'Obstructive Azoospermia (PESA/TESA)',
  'Non-Obstructive Azoospermia (Micro-TESE)',
  'Elevated DFI (>30% Halo)',
  'Necrozoospermia',
  'Varicocele Grade 2/3',
  'Karyotype / Y-Microdeletion Noted',
  'Non-Smoker / Antioxidant Rx',
];

export default function CoupleHeaderBanner({
  femalePatient,
  malePatient,
  treatmentCycle,
  onNotesUpdated,
  compact = false,
}: CoupleHeaderBannerProps) {
  const [showNotesDrawer, setShowNotesDrawer] = useState(!compact);
  const [femaleNotes, setFemaleNotes] = useState<string[]>(
    Array.isArray(femalePatient?.clinical_notes) ? femalePatient.clinical_notes : []
  );
  const [maleNotes, setMaleNotes] = useState<string[]>(
    Array.isArray(malePatient?.clinical_notes) ? malePatient.clinical_notes : []
  );
  const [newFemaleNote, setNewFemaleNote] = useState('');
  const [newMaleNote, setNewMaleNote] = useState('');
  const [isSavingFemale, setIsSavingFemale] = useState(false);
  const [isSavingMale, setIsSavingMale] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Sync state if props change
  React.useEffect(() => {
    if (femalePatient?.clinical_notes) {
      setFemaleNotes(Array.isArray(femalePatient.clinical_notes) ? femalePatient.clinical_notes : []);
    }
  }, [femalePatient]);

  React.useEffect(() => {
    if (malePatient?.clinical_notes) {
      setMaleNotes(Array.isArray(malePatient.clinical_notes) ? malePatient.clinical_notes : []);
    }
  }, [malePatient]);

  // Compute Cycle Day & Stimulation Day
  const sentinelDates = treatmentCycle?.sentinel_dates || {};
  const lmpDate = sentinelDates.lmp_day1 || treatmentCycle?.start_date;
  const stimDate = sentinelDates.stim_start;

  const cycleDay = lmpDate
    ? Math.max(1, Math.floor((Date.now() - new Date(lmpDate).getTime()) / 86400000) + 1)
    : null;

  const stimDay = stimDate
    ? Math.max(1, Math.floor((Date.now() - new Date(stimDate).getTime()) / 86400000) + 1)
    : null;

  const handleAddFemaleNote = async (noteText: string) => {
    const trimmed = noteText.trim();
    if (!trimmed || femaleNotes.includes(trimmed)) return;
    const updated = [...femaleNotes, trimmed];
    setFemaleNotes(updated);
    setNewFemaleNote('');
    if (femalePatient?.id) {
      setIsSavingFemale(true);
      try {
        await patientsApi.updateClinicalNotes(femalePatient.id, updated);
        triggerSuccess('Female clinical notes saved');
        onNotesUpdated?.();
      } catch (err) {
        console.error('Failed to update female notes', err);
      } finally {
        setIsSavingFemale(false);
      }
    }
  };

  const handleRemoveFemaleNote = async (idx: number) => {
    const updated = femaleNotes.filter((_, i) => i !== idx);
    setFemaleNotes(updated);
    if (femalePatient?.id) {
      setIsSavingFemale(true);
      try {
        await patientsApi.updateClinicalNotes(femalePatient.id, updated);
        triggerSuccess('Note removed');
        onNotesUpdated?.();
      } catch (err) {
        console.error('Failed to remove female note', err);
      } finally {
        setIsSavingFemale(false);
      }
    }
  };

  const handleAddMaleNote = async (noteText: string) => {
    const trimmed = noteText.trim();
    if (!trimmed || maleNotes.includes(trimmed)) return;
    const updated = [...maleNotes, trimmed];
    setMaleNotes(updated);
    setNewMaleNote('');
    if (malePatient?.id) {
      setIsSavingMale(true);
      try {
        await patientsApi.updateClinicalNotes(malePatient.id, updated);
        triggerSuccess('Male clinical notes saved');
        onNotesUpdated?.();
      } catch (err) {
        console.error('Failed to update male notes', err);
      } finally {
        setIsSavingMale(false);
      }
    }
  };

  const handleRemoveMaleNote = async (idx: number) => {
    const updated = maleNotes.filter((_, i) => i !== idx);
    setMaleNotes(updated);
    if (malePatient?.id) {
      setIsSavingMale(true);
      try {
        await patientsApi.updateClinicalNotes(malePatient.id, updated);
        triggerSuccess('Note removed');
        onNotesUpdated?.();
      } catch (err) {
        console.error('Failed to remove male note', err);
      } finally {
        setIsSavingMale(false);
      }
    }
  };

  const triggerSuccess = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  if (!femalePatient && !treatmentCycle) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden transition-all duration-200">
      {/* Top Banner Ribbon */}
      <div className="bg-slate-900 border-b border-slate-800 px-5 py-3 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              Fertility Couple EMR &amp; Lab Tracking
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">
                {femalePatient?.name || 'Female Patient'}
              </span>
              {malePatient && (
                <>
                  <span className="text-slate-500 text-xs font-semibold">&amp;</span>
                  <span className="font-bold text-sm text-slate-200">
                    {malePatient.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Pill & Milestone Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {treatmentCycle && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-slate-800 border border-slate-700 text-slate-200">
              <Activity className="w-3.5 h-3.5 text-[rgb(var(--clr-accent))]" />
              {treatmentCycle.cycle_id}
            </span>
          )}

          {cycleDay && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/60 border border-emerald-700/50 text-emerald-300">
              <Clock className="w-3 h-3" />
              Cycle Day {cycleDay}
            </span>
          )}

          {stimDay && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-950/60 border border-amber-700/50 text-amber-300">
              <Syringe className="w-3 h-3" />
              Stim Day {stimDay}
            </span>
          )}

          {malePatient?.id && (
            <Link
              href={`/patients/${malePatient.id}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 border border-sky-500/30 transition-colors"
              title={`Jump to ${malePatient.name}'s individual EMR profile`}
            >
              <User className="w-3.5 h-3.5 text-sky-300" />
              <span>View {malePatient.name} →</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setShowConsentModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/30 transition-colors"
            title="Digital Statutory Consents (ART Act 2021 Forms 8, 11, 13, 15)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>ART Consents</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Clinical Sticky Notes</span>
            {showNotesDrawer ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Couple Profile Tri-Grid */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch bg-slate-50/50">
        {/* 1. Female Patient Card (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center text-xs font-bold">
                  ♀
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">
                    {femalePatient?.name || 'Female Patient'}
                  </h4>
                  <p className="font-mono text-[11px] text-slate-500">
                    VID: {femalePatient?.vid || 'Pending'}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                Wife / Primary
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="bg-slate-50 border border-slate-200/60 rounded-md p-2">
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">Age</span>
                <span className="text-xs font-bold text-slate-800">
                  {femalePatient?.age ? `${femalePatient.age} yrs` : '—'}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200/60 rounded-md p-2">
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">Blood</span>
                <span className="text-xs font-bold text-rose-700">
                  {femalePatient?.blood_group || '—'}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200/60 rounded-md p-2">
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">Phone</span>
                <span className="text-xs font-semibold text-slate-700 truncate block">
                  {femalePatient?.phone || '—'}
                </span>
              </div>
            </div>

            {/* Infertility Factors */}
            {treatmentCycle?.female_factors?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {treatmentCycle.female_factors.map((f: string, i: number) => (
                  <span
                    key={i}
                    className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. ART Cycle & Sentinel Milestones (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[rgb(var(--clr-primary))]" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Active Treatment Cycle
                </span>
              </div>
              {treatmentCycle && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    treatmentCycle.status === 'running'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : treatmentCycle.status === 'completed'
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {treatmentCycle.status}
                </span>
              )}
            </div>

            {treatmentCycle ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Protocol:</span>
                  <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {treatmentCycle.treatment_type} (Attempt #{treatmentCycle.attempt_number || 1})
                  </span>
                </div>

                {/* Sentinel Date Milestones Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[10px]">
                  <div className="bg-slate-50 p-1.5 rounded-md border border-slate-200/60">
                    <span className="text-slate-500 block font-semibold">LMP Day 1</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {sentinelDates.lmp_day1 || 'Not set'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-md border border-slate-200/60">
                    <span className="text-slate-500 block font-semibold">Stim Start</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {sentinelDates.stim_start || 'Not set'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-md border border-slate-200/60">
                    <span className="text-slate-500 block font-semibold">OPU Retrieval</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {sentinelDates.opu || 'Planned'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-md border border-slate-200/60">
                    <span className="text-slate-500 block font-semibold">Embryo Transfer</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {sentinelDates.et || 'Planned'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400 italic">
                No active ART cycle linked to this patient.
              </div>
            )}
          </div>
        </div>

        {/* 3. Male Partner Card (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          {malePatient ? (
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center text-xs font-bold">
                    ♂
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">
                      {malePatient.name}
                    </h4>
                    <p className="font-mono text-[11px] text-slate-500">
                      VID: {malePatient.vid || 'Pending'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-sky-50 text-sky-700 border border-sky-200">
                  Husband / Partner
                </span>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="bg-slate-50 border border-slate-200/60 rounded-md p-2">
                  <span className="block text-[10px] font-semibold text-slate-500 uppercase">Age</span>
                  <span className="text-xs font-bold text-slate-800">
                    {malePatient.age ? `${malePatient.age} yrs` : '—'}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200/60 rounded-md p-2">
                  <span className="block text-[10px] font-semibold text-slate-500 uppercase">Blood</span>
                  <span className="text-xs font-bold text-rose-700">
                    {malePatient.blood_group || '—'}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200/60 rounded-md p-2">
                  <span className="block text-[10px] font-semibold text-slate-500 uppercase">Phone</span>
                  <span className="text-xs font-semibold text-slate-700 truncate block">
                    {malePatient.phone || '—'}
                  </span>
                </div>
              </div>

              {/* Male Infertility Factors */}
              {treatmentCycle?.male_factors?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {treatmentCycle.male_factors.map((f: string, i: number) => (
                    <span
                      key={i}
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-4 text-center">
              <User className="w-8 h-8 text-slate-300 mb-1" />
              <p className="text-xs font-semibold text-slate-600">No Husband / Partner Linked</p>
              <p className="text-[11px] text-slate-400">
                Link a partner in Patient 360 to activate Couple EMR.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Clinical Sticky Notes Section */}
      {showNotesDrawer && (
        <div className="border-t border-slate-200 bg-amber-50/20 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Clinical Sticky Notes — Couple Issues &amp; Alerts
              </h4>
            </div>
            {saveSuccessMsg && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                <Check className="w-3 h-3" />
                {saveSuccessMsg}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FEMALE ISSUES NOTE CARD */}
            <div className="bg-white border border-rose-200 rounded-lg p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-rose-100 pb-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-rose-900 tracking-wide uppercase">
                      Female Issues &amp; Diagnostic Alerts
                    </span>
                  </div>
                  {isSavingFemale && (
                    <span className="text-[10px] text-slate-400">Saving...</span>
                  )}
                </div>

                {/* Bullets List */}
                <div className="space-y-1.5 min-h-[50px] max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {femaleNotes.length > 0 ? (
                    femaleNotes.map((note, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 p-1.5 rounded-md bg-rose-50/50 border border-rose-100 text-xs text-rose-950 group"
                      >
                        <span className="font-medium leading-relaxed">• {note}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFemaleNote(idx)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5"
                          title="Remove issue"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-2">
                      No female issues recorded. Click a tag below or type a custom note.
                    </p>
                  )}
                </div>

                {/* Preset Fast Tags */}
                <div className="mt-2.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Quick Clinical Tags:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {FEMALE_PRESET_TAGS.map((tag, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddFemaleNote(tag)}
                        disabled={femaleNotes.includes(tag)}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded transition-all ${
                          femaleNotes.includes(tag)
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        }`}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Input */}
              <div className="flex gap-2 mt-3 pt-2.5 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Add female diagnostic note..."
                  value={newFemaleNote}
                  onChange={(e) => setNewFemaleNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFemaleNote(newFemaleNote);
                    }
                  }}
                  className="vmd-input text-xs flex-1 py-1"
                />
                <button
                  type="button"
                  onClick={() => handleAddFemaleNote(newFemaleNote)}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* MALE ISSUES NOTE CARD */}
            <div className="bg-white border border-sky-200 rounded-lg p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-sky-100 pb-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span className="text-xs font-bold text-sky-900 tracking-wide uppercase">
                      Male Issues &amp; CASA Alerts
                    </span>
                  </div>
                  {isSavingMale && (
                    <span className="text-[10px] text-slate-400">Saving...</span>
                  )}
                </div>

                {/* Bullets List */}
                <div className="space-y-1.5 min-h-[50px] max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {maleNotes.length > 0 ? (
                    maleNotes.map((note, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 p-1.5 rounded-md bg-sky-50/50 border border-sky-100 text-xs text-sky-950 group"
                      >
                        <span className="font-medium leading-relaxed">• {note}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaleNote(idx)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5"
                          title="Remove issue"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-2">
                      No male issues recorded. Click a tag below or type a custom note.
                    </p>
                  )}
                </div>

                {/* Preset Fast Tags */}
                <div className="mt-2.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Quick Clinical Tags:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {MALE_PRESET_TAGS.map((tag, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddMaleNote(tag)}
                        disabled={maleNotes.includes(tag)}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded transition-all ${
                          maleNotes.includes(tag)
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                        }`}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Input */}
              <div className="flex gap-2 mt-3 pt-2.5 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Add male diagnostic note..."
                  value={newMaleNote}
                  onChange={(e) => setNewMaleNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMaleNote(newMaleNote);
                    }
                  }}
                  className="vmd-input text-xs flex-1 py-1"
                  disabled={!malePatient}
                />
                <button
                  type="button"
                  onClick={() => handleAddMaleNote(newMaleNote)}
                  disabled={!malePatient}
                  className="px-3 py-1 bg-sky-700 hover:bg-sky-800 disabled:bg-slate-300 text-white rounded-md text-xs font-semibold transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Statutory Consent Modal (ART Act 2021) */}
      {showConsentModal && (
        <StatutoryConsentModal
          patient={femalePatient}
          partner={malePatient}
          cycle={treatmentCycle}
          onClose={() => setShowConsentModal(false)}
          onConsentSaved={() => {
            triggerSuccess('Statutory consent saved to legal register');
            onNotesUpdated?.();
          }}
        />
      )}
    </div>
  );
}
