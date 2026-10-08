'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import {
  Activity,
  Search,
  Plus,
  Clock,
  ChevronRight,
  Microscope,
  Pill,
  Download,
  Baby,
  FlaskConical,
  X,
} from 'lucide-react';
import { treatmentCyclesApi, getApiBase } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import StartCyclePatientModal from '@/components/fertility/StartCyclePatientModal';
import { PlanDetailsSubTabContent } from '@/components/fertility/plan-details';
import StatutoryConsentModal from '@/components/fertility/StatutoryConsentModal';
import EmbryoTransferDischargeModal from '@/components/fertility/EmbryoTransferDischargeModal';
import OPUAspirationReportModal from '@/components/fertility/OPUAspirationReportModal';
import MasterEmbryologyRecordModal from '@/components/fertility/MasterEmbryologyRecordModal';
import TreatmentBoardTable from '@/components/fertility/TreatmentBoardTable';

export default function TreatmentBoardPage() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');

  // Modals state
  const [showSelectPatientModal, setShowSelectPatientModal] = useState(false);
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
      console.error('Failed to load cycles', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCycles();
  }, []);

  const handleExportNationalArtRegistry = async (format: 'csv' | 'json' = 'csv') => {
    try {
      setIsExportingRegistry(true);
      const url = `${getApiBase()}/fertility/cycles/export-national-registry?format=${format}`;
      const token = localStorage.getItem('access_token');
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!res.ok) throw new Error('Registry export failed');

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `National_ART_Registry_Export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(`Export Error: ${err.message}`);
    } finally {
      setIsExportingRegistry(false);
    }
  };

  // KPI Calculations
  const totalActive = cycles.filter((c) => c.status === 'running').length;
  const inStimulation = cycles.filter(
    (c) => c.status === 'running' && c.sentinel_dates?.stim_start && !c.sentinel_dates?.opu_date
  ).length;
  const triggerDue = cycles.filter((c) => {
    if (c.status !== 'running') return false;
    const stim = c.sentinel_dates?.stim_start;
    if (!stim) return false;
    const stimDay = Math.floor((Date.now() - new Date(stim).getTime()) / 86400000) + 1;
    return stimDay >= 10 && !c.sentinel_dates?.opu_date;
  }).length;
  const opuEtScheduled = cycles.filter(
    (c) => c.status === 'running' && (c.sentinel_dates?.opu_date || c.sentinel_dates?.transfer_date)
  ).length;

  // Filter Pipeline
  const filteredCycles = cycles.filter((c) => {
    if (typeFilter !== 'ALL' && c.treatment_type !== typeFilter) return false;

    if (stageFilter === 'STIMULATION') {
      if (!c.sentinel_dates?.stim_start || c.sentinel_dates?.opu_date) return false;
    } else if (stageFilter === 'OPU_DUE') {
      if (!c.sentinel_dates?.opu_date) return false;
    } else if (stageFilter === 'TRANSFER_DUE') {
      if (!c.sentinel_dates?.transfer_date) return false;
    } else if (stageFilter === 'COMPLETED') {
      if (c.status !== 'completed') return false;
    }

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
    <PageLayout className="space-y-6">
      {/* Header */}
      <PageHeader
        title="ART Treatment Board"
        subtitle="Active cycle cohort, stimulation day tracking, dual-partner EMR & clinical workflow"
        icon={Activity}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleExportNationalArtRegistry('csv')}
              disabled={isExportingRegistry}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-bold rounded-md transition-all shadow-2xs"
              title="Export official statutory register under ART Regulation Act 2021"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>National ART Register (CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSelectPatientModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-white text-xs font-bold rounded-md transition-all shadow-md shadow-primary/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Treatment Cycle</span>
            </button>
          </div>
        }
      />

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
          <span className="text-[11px] font-semibold text-primary mt-1 block">
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
            Theatre &amp; Embryology bookings
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
            <option value="IUI">Intrauterine Insemination (IUI)</option>
            <option value="IUI_D">IUI with Donor Semen (IUI-D)</option>
            <option value="DONOR_OOCYTE">Donor Oocyte ICSI</option>
            <option value="SURGICAL_SPERM">TESA / PESA ICSI</option>
            <option value="PGT_A">PGT-A Screening Cycle</option>
          </select>

          {/* Clinical Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="vmd-input text-xs py-2 px-3 font-semibold text-slate-700 bg-slate-50"
          >
            <option value="ALL">All Clinical Stages</option>
            <option value="STIMULATION">In Stimulation (Days 2-12)</option>
            <option value="OPU_DUE">OPU Scheduled / Triggered</option>
            <option value="TRANSFER_DUE">Embryo Transfer Scheduled</option>
            <option value="COMPLETED">Completed Cycles</option>
          </select>
        </div>
      </div>

      {/* Main Treatment Board Table */}
      <TreatmentBoardTable
        cycles={filteredCycles}
        isLoading={isLoading}
        onConsent={(cycle) => setActiveConsentCycle(cycle)}
        onOpu={(cycle) => setActiveOpuCycle(cycle)}
        onEmbryology={(cycle) => setActiveEmbryologyCycle(cycle)}
        onEtDischarge={(cycle) => setActiveEtDischargeCycle(cycle)}
        onStimGrid={(cycle) => setActiveCalendarCycle(cycle)}
      />

      {/* MODALS */}
      {showSelectPatientModal && (
        <StartCyclePatientModal
          open={showSelectPatientModal}
          onClose={() => setShowSelectPatientModal(false)}
        />
      )}

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

            <PlanDetailsSubTabContent
              activeCycle={activeCalendarCycle}
              cycleCalendar={{ days: activeCalendarCycle.medication_calendar || [] }}
              initialDays={activeCalendarCycle.medication_calendar}
              patient={activeCalendarCycle.patient}
              partner={activeCalendarCycle.partner}
              onRefreshData={() => {
                loadCycles();
              }}
            />
          </div>
        </div>
      )}

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
    </PageLayout>
  );
}
