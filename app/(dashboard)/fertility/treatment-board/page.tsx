'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  Heart,
  FileText,
  Microscope,
  CheckCircle2,
  AlertCircle,
  Pill,
  X,
  ExternalLink,
  ShieldCheck,
  Download,
  Baby,
  Syringe,
  FlaskConical,
  Stethoscope,
} from 'lucide-react';
import { treatmentCyclesApi, patientsApi, getApiBase } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import TreatmentCycleWizard from '@/components/fertility/TreatmentCycleWizard';
import StimulationCalendarGrid from '@/components/fertility/StimulationCalendarGrid';
import StatutoryConsentModal from '@/components/fertility/StatutoryConsentModal';
import EmbryoTransferDischargeModal from '@/components/fertility/EmbryoTransferDischargeModal';
import OPUAspirationReportModal from '@/components/fertility/OPUAspirationReportModal';
import MasterEmbryologyRecordModal from '@/components/fertility/MasterEmbryologyRecordModal';

export default function TreatmentBoardPage() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');

  // Modals state
  const [showWizard, setShowWizard] = useState(false);
  const [activeCalendarCycle, setActiveCalendarCycle] = useState<any | null>(null);
  const [activeConsentCycle, setActiveConsentCycle] = useState<any | null>(null);
  const [activeEtDischargeCycle, setActiveEtDischargeCycle] = useState<any | null>(null);
  const [activeOpuCycle, setActiveOpuCycle] = useState<any | null>(null);
  const [activeEmbryologyCycle, setActiveEmbryologyCycle] = useState<any | null>(null);
  const [isExportingRegistry, setIsExportingRegistry] = useState(false);

  const loadCycles = async () => {
    setIsLoading(true);
    try {
      const res = await treatmentCyclesApi.list();
      setCycles(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load treatment cycles', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCycles();
  }, []);

  const handleExportNationalArtRegistry = async (format: 'csv' | 'json' = 'csv') => {
    setIsExportingRegistry(true);
    try {
      if (format === 'csv') {
        const apiBase = getApiBase();
        window.open(`${apiBase}/plugins/fertility/treatment-cycles/art-registry-export?format=csv`, '_blank');
      } else {
        const data = await treatmentCyclesApi.getArtRegistryExport({ format: 'json' });
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `national_art_registry_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error('Export error', err);
      alert('Failed to export National ART Registry: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExportingRegistry(false);
    }
  };

  // Compute stats
  const totalActive = cycles.filter((c) => c.status === 'running').length;

  const inStimulation = cycles.filter((c) => {
    if (c.status !== 'running') return false;
    const stim = c.sentinel_dates?.stim_start;
    const trig = c.sentinel_dates?.trigger;
    return stim && (!trig || new Date(trig) > new Date());
  }).length;

  const triggerDue = cycles.filter((c) => {
    if (c.status !== 'running') return false;
    const trig = c.sentinel_dates?.trigger;
    const opu = c.sentinel_dates?.opu;
    if (!trig) return false;
    const trigDate = new Date(trig);
    const now = new Date();
    const diffHours = (trigDate.getTime() - now.getTime()) / 3600000;
    return diffHours >= -24 && diffHours <= 48 && (!opu || new Date(opu) >= now);
  }).length;

  const opuEtScheduled = cycles.filter((c) => {
    if (c.status !== 'running') return false;
    const opu = c.sentinel_dates?.opu;
    const et = c.sentinel_dates?.et;
    return opu || et;
  }).length;

  // Filter cycles
  const filteredCycles = cycles.filter((c) => {
    // Type filter
    if (typeFilter !== 'ALL' && c.treatment_type !== typeFilter) return false;

    // Stage filter
    if (stageFilter === 'RUNNING' && c.status !== 'running') return false;
    if (stageFilter === 'COMPLETED' && c.status !== 'completed') return false;
    if (stageFilter === 'PLANNED' && c.status !== 'planned') return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (c.patient_name || '').toLowerCase().includes(q);
      const matchPartner = (c.partner_name || '').toLowerCase().includes(q);
      const matchVid = (c.patient_vid || '').toLowerCase().includes(q);
      const matchCycle = (c.cycle_id || '').toLowerCase().includes(q);
      return matchName || matchPartner || matchVid || matchCycle;
    }

    return true;
  });

  return (
    <div className="w-full px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                ART Treatment Board
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm">
                Active cycle cohort, stimulation day tracking, dual-partner EMR & clinical workflow
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleExportNationalArtRegistry('csv')}
            disabled={isExportingRegistry}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-bold rounded-md transition-all shadow-2xs"
            title="Export official statutory register under ART Regulation Act 2021"
          >
            <Download className="w-4 h-4 text-[rgb(var(--clr-primary))]" />
            <span>National ART Register (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white text-xs font-bold rounded-md transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Treatment Cycle</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Cycles
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-1">{totalActive}</p>
          <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">
            Cohort currently undergoing treatment
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              In Stimulation
            </span>
            <Pill className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-1">{inStimulation}</p>
          <span className="text-[11px] font-semibold text-[rgb(var(--clr-primary))] mt-1 block">
            Active daily gonadotropin injections
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Trigger Imminent
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-1">{triggerDue}</p>
          <span className="text-[11px] font-semibold text-amber-600 mt-1 block">
            Follicles &gt;= 18mm / 36h OPU window
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              OPU / ET Scheduled
            </span>
            <Microscope className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-1">{opuEtScheduled}</p>
          <span className="text-[11px] font-semibold text-rose-600 mt-1 block">
            Theatre & Embryology bookings
          </span>
        </div>
      </div>

      {/* Clinical Forms Quick Access */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/fertility/treatment-board/mock-et"
          className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-lg p-4 shadow-xs hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition">
            <FlaskConical className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">Mock ET Record</p>
            <p className="text-xs text-slate-500">Trial uterine cavity assessment · catheter selection · findings</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition" />
        </Link>
        <Link
          href="/fertility/treatment-board/pregnancy-outcome"
          className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-lg p-4 shadow-xs hover:shadow-md hover:border-pink-200 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0 group-hover:bg-pink-100 transition">
            <Baby className="w-5 h-5 text-pink-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">Cycle / Pregnancy Outcome</p>
            <p className="text-xs text-slate-500">Delivery record · baby details · complications · birthday reminder</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-pink-500 transition" />
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-lg p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, VID, partner, cycle ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="vmd-input pl-9 text-xs w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Treatment Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="vmd-input text-xs py-2 px-3 font-semibold text-slate-700 bg-slate-50"
          >
            <option value="ALL">All Protocols &amp; Types</option>
            <option value="ICSI">ICSI (Intracytoplasmic)</option>
            <option value="IVF">Standard IVF</option>
            <option value="FET">Frozen Embryo Transfer (FET)</option>
            <option value="ICSI_FET">ICSI + Freeze-All</option>
            <option value="IUI_H">IUI — Husband</option>
            <option value="IUI_D">IUI — Donor</option>
            <option value="EGG_FREEZING">Social Egg Freezing</option>
            <option value="SURROGACY">Surrogacy</option>
          </select>

          {/* Stage Status Pills */}
          <div className="flex p-1 bg-slate-100 rounded-md">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'RUNNING', label: 'Active' },
              { id: 'PLANNED', label: 'Planned' },
              { id: 'COMPLETED', label: 'Completed' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStageFilter(st.id)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  stageFilter === st.id
                    ? 'bg-white text-slate-800 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Treatment Board Table */}
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
                    <div className="w-8 h-8 border-2 border-[rgb(var(--clr-primary))] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
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
                              className="font-bold text-slate-900 hover:text-[rgb(var(--clr-primary))] transition-colors flex items-center gap-1 group"
                            >
                              <span>{cycle.patient_name || 'Female Patient'}</span>
                              <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-[rgb(var(--clr-primary))]" />
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
                          <span className="text-slate-400 text-[11px] italic">Not linked</span>
                        )}
                      </td>

                      {/* Treatment Type */}
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200/80">
                          {cycle.treatment_type}
                        </span>
                      </td>

                      {/* Cycle Day */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {cycleDayNum ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Day {cycleDayNum}
                            </span>
                            {stimDayNum && (
                              <div className="text-[10px] font-semibold text-amber-700 flex items-center gap-1">
                                <Syringe className="w-3 h-3" />
                                <span>Stim Day {stimDayNum}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Sentinel Milestones */}
                      <td className="py-4 px-4">
                        <div className="grid grid-cols-2 gap-1 text-[10px] min-w-[200px]">
                          <div>
                            <span className="text-slate-400 block font-medium">LMP:</span>
                            <span className="font-mono text-slate-700">{sDates.lmp_day1 || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Stim Start:</span>
                            <span className="font-mono text-slate-700">{sDates.stim_start || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Trigger:</span>
                            <span className="font-mono text-amber-700 font-bold">{sDates.trigger || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">OPU / ET:</span>
                            <span className="font-mono text-slate-800 font-bold">
                              {sDates.opu || sDates.et || '—'}
                            </span>
                          </div>
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
                            onClick={() => setActiveConsentCycle(cycle)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md font-bold text-[11px] transition-colors border border-amber-200 flex items-center gap-1"
                            title="Statutory Consents (ART Act 2021 Forms 8, 11, 13, 15)"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            <span>Consent</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveOpuCycle(cycle)}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-md font-bold text-[11px] transition-colors border border-purple-200 flex items-center gap-1"
                            title="OPU Aspiration & Egg Retrieval Report"
                          >
                            <Syringe className="w-3.5 h-3.5 text-purple-600" />
                            <span>OPU</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveEmbryologyCycle(cycle)}
                            className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary rounded-md font-bold text-[11px] transition-colors border border-primary/20 flex items-center gap-1"
                            title="Master Embryology & Insemination Form"
                          >
                            <Microscope className="w-3.5 h-3.5 text-primary" />
                            <span>Embryo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveEtDischargeCycle(cycle)}
                            className="px-2.5 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-md font-bold text-[11px] transition-colors border border-pink-200 flex items-center gap-1"
                            title="Embryo Transfer Discharge Protocol & Luteal Support Schedule"
                          >
                            <Baby className="w-3.5 h-3.5 text-pink-600" />
                            <span>ET Protocol</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveCalendarCycle(cycle)}
                            className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/15 text-slate-800 rounded-md font-bold text-[11px] transition-colors border border-primary/20 flex items-center gap-1"
                            title="Open Day-by-Day Medication Calendar Grid"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Stim Grid</span>
                          </button>

                          <Link
                            href={`/ivf-lab?cycleId=${cycle.id}&tab=embryology`}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold text-[11px] transition-colors flex items-center gap-1"
                            title="Open in IVF Lab Embryology Matrix"
                          >
                            <Microscope className="w-3.5 h-3.5" />
                            <span>Lab</span>
                          </Link>
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

      {/* Modal 1: Treatment Cycle Wizard */}
      {showWizard && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Initiate New ART Treatment Cycle
              </h2>
              <button
                type="button"
                onClick={() => setShowWizard(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <TreatmentCycleWizard
              patientId=""
              userId={user?.id || ''}
              onSuccess={() => {
                setShowWizard(false);
                loadCycles();
              }}
              onCancel={() => setShowWizard(false)}
            />
          </div>
        </div>
      )}

      {/* Modal 2: Stimulation Calendar Grid Modal */}
      {activeCalendarCycle && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[94vh] overflow-y-auto p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>Stimulation Matrix Grid</span>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-primary/10 text-slate-800 border border-primary/20">
                    {activeCalendarCycle.cycle_id}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: <strong>{activeCalendarCycle.patient_name || 'Patient'}</strong>{' '}
                  {activeCalendarCycle.partner_name && (
                    <>
                      • Partner: <strong>{activeCalendarCycle.partner_name}</strong>
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCalendarCycle(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <StimulationCalendarGrid
              cycleId={activeCalendarCycle.id}
              startDate={activeCalendarCycle.sentinel_dates?.stim_start || activeCalendarCycle.sentinel_dates?.lmp_day1 || activeCalendarCycle.start_date}
              initialDays={activeCalendarCycle.medication_calendar}
              treatmentType={activeCalendarCycle.treatment_type}
              sentinelDates={activeCalendarCycle.sentinel_dates}
              onCalendarSaved={() => {
                loadCycles();
              }}
            />
          </div>
        </div>
      )}

      {/* Modal 3: Statutory Consent Modal (ART Act 2021) */}
      {activeConsentCycle && (
        <StatutoryConsentModal
          patient={{
            id: activeConsentCycle.patient_id,
            name: activeConsentCycle.patient_name || 'Female Patient',
            vid: activeConsentCycle.patient_vid,
            age: activeConsentCycle.patient_age,
            blood_group: activeConsentCycle.patient_blood_group,
            phone: activeConsentCycle.patient_phone,
          }}
          partner={
            activeConsentCycle.partner_id || activeConsentCycle.partner_name
              ? {
                  id: activeConsentCycle.partner_id,
                  name: activeConsentCycle.partner_name,
                  vid: activeConsentCycle.partner_vid,
                  age: activeConsentCycle.partner_age,
                  blood_group: activeConsentCycle.partner_blood_group,
                  phone: activeConsentCycle.partner_phone,
                }
              : undefined
          }
          cycle={activeConsentCycle}
          onClose={() => setActiveConsentCycle(null)}
          onConsentSaved={() => {
            loadCycles();
          }}
        />
      )}

      {/* Modal 4: Embryo Transfer Discharge Protocol */}
      {activeEtDischargeCycle && (
        <EmbryoTransferDischargeModal
          cycle={activeEtDischargeCycle}
          patient={{
            id: activeEtDischargeCycle.patient_id,
            name: activeEtDischargeCycle.patient_name || 'Female Patient',
            vid: activeEtDischargeCycle.patient_vid,
            age: activeEtDischargeCycle.patient_age,
            blood_group: activeEtDischargeCycle.patient_blood_group,
          }}
          partner={
            activeEtDischargeCycle.partner_id || activeEtDischargeCycle.partner_name
              ? {
                  id: activeEtDischargeCycle.partner_id,
                  name: activeEtDischargeCycle.partner_name,
                  vid: activeEtDischargeCycle.partner_vid,
                  age: activeEtDischargeCycle.partner_age,
                }
              : undefined
          }
          onClose={() => setActiveEtDischargeCycle(null)}
          onSaved={() => {
            loadCycles();
          }}
        />
      )}

      {/* Modal 5: OPU Aspiration Report (Egg Retrieval) */}
      {activeOpuCycle && (
        <OPUAspirationReportModal
          cycle={activeOpuCycle}
          patient={{
            id: activeOpuCycle.patient_id,
            name: activeOpuCycle.patient_name || 'Female Patient',
            vid: activeOpuCycle.patient_vid,
            age: activeOpuCycle.patient_age,
            blood_group: activeOpuCycle.patient_blood_group,
          }}
          partner={
            activeOpuCycle.partner_id || activeOpuCycle.partner_name
              ? {
                  id: activeOpuCycle.partner_id,
                  name: activeOpuCycle.partner_name,
                  vid: activeOpuCycle.partner_vid,
                  age: activeOpuCycle.partner_age,
                }
              : undefined
          }
          onClose={() => setActiveOpuCycle(null)}
          onSaved={() => {
            loadCycles();
          }}
        />
      )}

      {/* Modal 6: Master Embryology & Insemination Record */}
      {activeEmbryologyCycle && (
        <MasterEmbryologyRecordModal
          cycle={activeEmbryologyCycle}
          patient={{
            id: activeEmbryologyCycle.patient_id,
            name: activeEmbryologyCycle.patient_name || 'Female Patient',
            vid: activeEmbryologyCycle.patient_vid,
            age: activeEmbryologyCycle.patient_age,
            blood_group: activeEmbryologyCycle.patient_blood_group,
          }}
          partner={
            activeEmbryologyCycle.partner_id || activeEmbryologyCycle.partner_name
              ? {
                  id: activeEmbryologyCycle.partner_id,
                  name: activeEmbryologyCycle.partner_name,
                  vid: activeEmbryologyCycle.partner_vid,
                  age: activeEmbryologyCycle.partner_age,
                }
              : undefined
          }
          onClose={() => setActiveEmbryologyCycle(null)}
          onSaved={() => {
            loadCycles();
          }}
        />
      )}
    </div>
  );
}
