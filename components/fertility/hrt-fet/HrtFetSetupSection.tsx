'use client';

import React from 'react';
import { Sliders, RotateCcw, ChevronUp, ChevronDown, Info, CalendarDays, Clock, Heart, ShieldAlert } from 'lucide-react';
import { CalculatedDates } from './types';

interface HrtFetSetupSectionProps {
  showSetupDrawer: boolean;
  setShowSetupDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  showNotesDrawer: boolean;
  setShowNotesDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  embryoStage: 'Day 3' | 'Day 5';
  setEmbryoStage: React.Dispatch<React.SetStateAction<'Day 3' | 'Day 5'>>;
  bleedDate: string;
  setBleedDate: (val: string) => void;
  plannedEstrogenDays: number;
  setPlannedEstrogenDays: (val: number) => void;
  p0Time: string;
  setP0Time: (val: string) => void;
  calculatedDates: CalculatedDates | null;
  e2Dose: string;
  setE2Dose: (val: string) => void;
  e2Route: string;
  setE2Route: (val: string) => void;
  e2Freq: string;
  setE2Freq: (val: string) => void;
  p4Dose: string;
  setP4Dose: (val: string) => void;
  p4Route: string;
  setP4Route: (val: string) => void;
  p4Freq: string;
  setP4Freq: (val: string) => void;
  liningThickness: string;
  setLiningThickness: (val: string) => void;
  liningPattern: string;
  setLiningPattern: (val: string) => void;
  readonly?: boolean;
  handleApplySetup: () => void;
}

export default function HrtFetSetupSection({
  showSetupDrawer,
  setShowSetupDrawer,
  showNotesDrawer,
  setShowNotesDrawer,
  embryoStage,
  setEmbryoStage,
  bleedDate,
  setBleedDate,
  plannedEstrogenDays,
  setPlannedEstrogenDays,
  p0Time,
  setP0Time,
  calculatedDates,
  e2Dose,
  setE2Dose,
  e2Route,
  setE2Route,
  e2Freq,
  setE2Freq,
  p4Dose,
  setP4Dose,
  p4Route,
  setP4Route,
  p4Freq,
  setP4Freq,
  liningThickness,
  setLiningThickness,
  liningPattern,
  setLiningPattern,
  readonly = false,
  handleApplySetup,
}: HrtFetSetupSectionProps) {
  return (
    <>
      {/* SETUP CARD (Reflecting Sheet 2: Setup from Excel) */}
      {showSetupDrawer && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs print:hidden">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#2F6F8F]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Cycle Setup Parameters &amp; Scheduling Anchors
              </h3>
            </div>

            {/* Embryo Stage Selector (Pills) */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 px-2">Embryo Stage:</span>
              <button
                type="button"
                onClick={() => setEmbryoStage('Day 3')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  embryoStage === 'Day 3'
                    ? 'bg-[#2F6F8F] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Day 3 (Cleavage)
              </button>
              <button
                type="button"
                onClick={() => setEmbryoStage('Day 5')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  embryoStage === 'Day 5'
                    ? 'bg-[#2F6F8F] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Day 5 (Blastocyst)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Bleed Date / LMP */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Cycle Day 1 / Bleed Date
              </label>
              <input
                type="date"
                value={bleedDate}
                onChange={(e) => setBleedDate(e.target.value)}
                className="vmd-input text-xs w-full font-semibold text-slate-800"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Baseline TVS ± E2/P4 anchor</span>
            </div>

            {/* Planned Estrogen Exposure */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Planned Estrogen Exposure
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={10}
                  max={24}
                  value={plannedEstrogenDays}
                  onChange={(e) => setPlannedEstrogenDays(Number(e.target.value) || 13)}
                  className="vmd-input text-xs w-20 font-semibold text-slate-800"
                />
                <span className="text-xs text-slate-500 font-medium">Days (P0 on Day {plannedEstrogenDays + 1})</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Template default: 12-14 days</span>
            </div>

            {/* Progesterone Start (P0) Date & Exact Time */}
            <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
              <label className="flex items-center justify-between text-[11px] font-bold text-amber-900 mb-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  Progesterone Start (P0) Time
                </span>
                <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-extrabold uppercase">
                  Anchor
                </span>
              </label>
              <input
                type="text"
                value={p0Time}
                onChange={(e) => setP0Time(e.target.value)}
                placeholder="e.g. 08:00 AM"
                className="vmd-input text-xs w-full font-bold text-amber-950 bg-white"
              />
              <span className="text-[10px] text-amber-800/80 mt-1 block">
                Scheduled on: <strong>{calculatedDates?.p0Date || 'Day 14'}</strong>
              </span>
            </div>

            {/* Transfer Date (Auto-calculated) */}
            <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-200">
              <label className="flex items-center gap-1 text-[11px] font-bold text-rose-900 mb-1">
                <Heart className="w-3.5 h-3.5 text-rose-600" />
                Transfer Date ({embryoStage})
              </label>
              <div className="text-sm font-extrabold text-rose-950 bg-white px-2.5 py-1.5 rounded-md border border-rose-200">
                {calculatedDates?.transferDate || 'Calculating...'}
              </div>
              <span className="text-[10px] text-rose-800/80 mt-1 block">
                {embryoStage === 'Day 3' ? 'P+3 (~72h exposure)' : 'P+5 (~120h exposure)'}
              </span>
            </div>
          </div>

          {/* Secondary Parameters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                  Estradiol Formulation &amp; Regimen
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={e2Dose}
                    onChange={(e) => setE2Dose(e.target.value)}
                    placeholder="Dose (e.g. 2 mg)"
                    className="vmd-input text-xs flex-1"
                  />
                  <input
                    type="text"
                    value={e2Freq}
                    onChange={(e) => setE2Freq(e.target.value)}
                    placeholder="Freq (e.g. TDS)"
                    className="vmd-input text-xs w-20"
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Progynova / Estrogen Valerate (Oral)</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                  Progesterone Regimen (P0 onwards)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={p4Dose}
                    onChange={(e) => setP4Dose(e.target.value)}
                    placeholder="e.g. 400 mg PV BD + 100 mg IM"
                    className="vmd-input text-xs flex-1"
                  />
                  <input
                    type="text"
                    value={p4Freq}
                    onChange={(e) => setP4Freq(e.target.value)}
                    placeholder="Freq"
                    className="vmd-input text-xs w-24"
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Micronized Progesterone (Susten/Gestone)</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-slate-600 block">Serum β-hCG Test Date</span>
                <strong className="text-xs text-text-main block">
                  {calculatedDates?.betaHcgDate || 'Day 23'}
                </strong>
                <span className="text-[10px] text-slate-400">Day 23 / 10-14 days post-ET</span>
              </div>
              <button
                type="button"
                onClick={handleApplySetup}
                className="px-3 py-2 bg-[#2F6F8F] hover:bg-[#255670] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Apply Setup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIMING NOTES (Reflecting Sheet 3: Timing Notes from Excel) */}
      {showNotesDrawer && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-3 print:hidden">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
            <h4 className="font-bold flex items-center gap-2 text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Timing Notes &amp; Clinical Guidance (from Excel Template)</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowNotesDrawer(false)}
              className="text-amber-700 hover:text-amber-900"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/80 p-3 rounded-lg border border-amber-200">
              <strong className="text-amber-900 block mb-1">1. Estrogen Duration:</strong>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                12 days is a common programmed-HRT template, but it is not a mandatory universal minimum. Start progesterone when endometrial readiness and clinic criteria are met.
              </p>
            </div>
            <div className="bg-white/80 p-3 rounded-lg border border-amber-200">
              <strong className="text-amber-900 block mb-1">2. P0 Timing Anchor:</strong>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Record the exact progesterone start date and time; this is the principal scheduling anchor for opening the implantation window.
              </p>
            </div>
            <div className="bg-white/80 p-3 rounded-lg border border-amber-200">
              <strong className="text-amber-900 block mb-1">3. Day-3 vs Day-5 Embryo:</strong>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Planning row is <strong>P+3</strong> (~72h) for Day-3 cleavage embryos, and <strong>P+5</strong> (~120h) for Day-5 blastocysts. Use your clinic's validated progesterone-exposure schedule.
              </p>
            </div>
            <div className="bg-white/80 p-3 rounded-lg border border-amber-200">
              <strong className="text-amber-900 block mb-1">4. Clinical Safety:</strong>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                This is a documentation/planning template. Clinician should set and verify medication doses, endometrial criteria, progesterone regimen and transfer timing.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
