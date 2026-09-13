'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fertilityApi,
  patientsApi,
  andrologyApi,
  embryologyApi,
  cryoApi,
  treatmentCyclesApi,
  authApi,
  qcApi,
} from '@/lib/api';

import { formatDate } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import OocyteGridTable from '@/components/fertility/OocyteGridTable';
import CoupleHeaderBanner from '@/components/fertility/CoupleHeaderBanner';
import SpermWashComparisonTable from '@/components/fertility/SpermWashComparisonTable';
import DFIHaloChart from '@/components/fertility/DFIHaloChart';
import SurgicalSpermRetrievalModal from '@/components/fertility/SurgicalSpermRetrievalModal';
import EmbryoTransferDischargeModal from '@/components/fertility/EmbryoTransferDischargeModal';
import SpermPreparationModal from '@/components/fertility/SpermPreparationModal';
import SpermFreezingModal from '@/components/fertility/SpermFreezingModal';
import OPUAspirationReportModal from '@/components/fertility/OPUAspirationReportModal';
import MasterEmbryologyRecordModal from '@/components/fertility/MasterEmbryologyRecordModal';
import DonorEmbryoTransferModal from '@/components/fertility/DonorEmbryoTransferModal';
import AndrologyDataEntry from '@/components/fertility/AndrologyDataEntry';
import CryoVitrifyModal from '@/components/ivf/CryoVitrifyModal';
import CryoThawModal from '@/components/ivf/CryoThawModal';
import { Scissors, Baby, Microscope, FlaskConical, Dna, Snowflake, ShieldCheck, Printer, Save, Flame, X, AlertTriangle, Sparkles, HeartHandshake, AlertCircle } from 'lucide-react';

export default function IvfLabPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'andrology' | 'embryology' | 'cryopreservation' | 'qc'>('embryology');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['andrology', 'embryology', 'cryopreservation', 'qc'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  const [patients, setPatients] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // === ANDROLOGY STATE ===
  const [selectedMalePatient, setSelectedMalePatient] = useState<any>(null);
  const [andrologyRecords, setAndrologyRecords] = useState<any[]>([]);
  const [activeAndrologyRecord, setActiveAndrologyRecord] = useState<any>(null);
  const [showSurgicalModal, setShowSurgicalModal] = useState(false);
  const [showEtDischargeModal, setShowEtDischargeModal] = useState(false);
  const [showSpermPrepModal, setShowSpermPrepModal] = useState(false);
  const [showSpermFreezingModal, setShowSpermFreezingModal] = useState(false);
  const [showOpuModal, setShowOpuModal] = useState(false);
  const [showMasterEmbryologyModal, setShowMasterEmbryologyModal] = useState(false);
  const [showDonorEtModal, setShowDonorEtModal] = useState(false);
  const [andrologyQueueFilter, setAndrologyQueueFilter] = useState<'active_cycles' | 'all'>('active_cycles');

  // === EMBRYOLOGY STATE ===
  const [selectedCyclePatient, setSelectedCyclePatient] = useState<any>(null);
  const [cycles, setCycles] = useState<any[]>([]);
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [oocytes, setOocytes] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [witnessLogs, setWitnessLogs] = useState<any[]>([]);
  const [showWitnessModal, setShowWitnessModal] = useState(false);
  const [witnessDay, setWitnessDay] = useState(0);
  const [checkedById, setCheckedById] = useState('');
  const [witnessedById, setWitnessedById] = useState('');
  const [witnessNotes, setWitnessNotes] = useState('');
  const [witnessError, setWitnessError] = useState('');

  // === CRYOBANK STATE ===
  type CryoExpiryBucket = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'DUE_30' | 'DUE_60' | 'THAWED_DISCARDED';
  const [cryoSamples, setCryoSamples] = useState<any[]>([]);
  const [cryoFilterBucket, setCryoFilterBucket] = useState<CryoExpiryBucket>('ALL');
  const [expiringSamples, setExpiringSamples] = useState<any[]>([]);
  const [showVitrifyModal, setShowVitrifyModal] = useState(false);
  const [showThawModal, setShowThawModal] = useState(false);
  const [selectedThawSample, setSelectedThawSample] = useState<any>(null);

  // === QC STATE ===
  const [qcLogs, setQcLogs] = useState<any[]>([]);
  const [newQc, setNewQc] = useState({
    co2: 5.5, o2: 5.0, ph: 7.34, temp: 37.0, autodialer_test: 'Pass'
  });

  const loadInitialData = (silent = false) => {
    if (!silent) setIsLoading(true);
    Promise.all([
      patientsApi.list({ per_page: 100 }),
      treatmentCyclesApi.list(),
      cryoApi.listSamples(),
      cryoApi.getExpiringSoon(30),
      authApi.listUsers(),
      qcApi.listLogs().catch(() => []),
    ])
      .then(([patRes, cycRes, cryoRes, expRes, userRes, qcRes]: any) => {
        const pts = patRes.patients || [];
        setPatients(pts);

        const cycs = cycRes || [];
        setCycles(cycs);

        setCryoSamples(Array.isArray(cryoRes) ? cryoRes : []);
        setExpiringSamples(Array.isArray(expRes) ? expRes : []);

        const uList = Array.isArray(userRes) ? userRes : [];
        setStaffUsers(uList);
        if (uList.length >= 2) {
          setCheckedById(uList[0].id);
          setWitnessedById(uList[1].id);
        }

        if (Array.isArray(qcRes) && qcRes.length > 0) {
          setQcLogs(qcRes);
        }

        // Set default male patient
        const males = pts.filter((p: any) => p.gender === 'male');
        if (males.length > 0) {
          setSelectedMalePatient(males[0]);
        }

        // Set default cycle
        if (cycs.length > 0) {
          setActiveCycle(cycs[0]);
          loadCycleEmbryology(cycs[0].id);
        }
      })
      .catch((err) => {
        if (!silent) {
          console.error(err);
          import('@/contexts/ToastContext').then(({ toast }) => {
            toast.error('Failed to load lab data', err.message || 'Check your connection');
          });
        }
      })
      .finally(() => {
        if (!silent) setIsLoading(false);
      });
  };

  useEffect(() => {
    loadInitialData();
    const poll = setInterval(() => loadInitialData(true), 30000);
    return () => clearInterval(poll);
  }, []);

  // Load patient-specific Andrology records when selected male patient changes
  useEffect(() => {
    if (selectedMalePatient) {
      andrologyApi.list({ patient_id: selectedMalePatient.id })
        .then((res: any) => {
          setAndrologyRecords(res || []);
          if (res && res.length > 0) {
            setActiveAndrologyRecord(res[0]);
          } else {
            setActiveAndrologyRecord(null);
          }
        })
        .catch(() => {});
    }
  }, [selectedMalePatient]);

  const loadCycleEmbryology = (cycleId: string) => {
    embryologyApi.getOocytes(cycleId)
      .then((oocs: any) => setOocytes(oocs || []))
      .catch(() => {});

    embryologyApi.getKPIs(cycleId)
      .then((kRes: any) => setKpis(kRes?.kpis || null))
      .catch(() => {});

    embryologyApi.getWitnesses(cycleId)
      .then((wList: any) => setWitnessLogs(wList || []))
      .catch(() => {});
  };

  const handleSelectCycle = (cyc: any) => {
    setActiveCycle(cyc);
    loadCycleEmbryology(cyc.id);
  };

  const handleUpdateOocyteDay = async (oocyteId: string, dayNum: number, field: string, value: any) => {
    try {
      const ooc = oocytes.find(o => o.id === oocyteId);
      const currentDayData = (ooc && (ooc as any)[`day${dayNum}_data`]) || {};
      const updatedDayData = { ...currentDayData, [field]: value };

      await embryologyApi.updateOocyteDay({
        oocyte_id: oocyteId,
        day_number: dayNum,
        day_data: updatedDayData,
        fert_check: dayNum === 1 && field === 'fert_check' ? value : undefined,
        disposition: dayNum === 5 && field === 'disposition' ? value : undefined,
      });

      if (activeCycle) {
        loadCycleEmbryology(activeCycle.id);
      }
    } catch (err: any) {
      alert(err.message || `MANDATORY DUAL-WITNESSING GATE: Day ${dayNum - 1} must be verified before editing Day ${dayNum}.`);
    }
  };

  const handleSignOffWitness = async (e: React.FormEvent) => {
    e.preventDefault();
    setWitnessError('');
    if (!activeCycle) return;

    if (checkedById === witnessedById) {
      setWitnessError('Dual-witnessing requires TWO distinct users. The primary embryologist and secondary witness cannot be the same user.');
      return;
    }

    try {
      await embryologyApi.signoffWitness({
        treatment_cycle_id: activeCycle.id,
        day_number: witnessDay,
        checked_by_id: checkedById,
        witnessed_by_id: witnessedById,
        notes: witnessNotes || `Day ${witnessDay} dual witness signoff complete.`,
      });
      setShowWitnessModal(false);
      setWitnessNotes('');
      alert(`Day ${witnessDay} dual-witness signoff recorded successfully! Next day culture unlocked.`);
      loadCycleEmbryology(activeCycle.id);
    } catch (err: any) {
      setWitnessError(err.message || 'Witness signoff failed');
    }
  };

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

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[rgb(var(--clr-primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const malePatients = patients.filter(p => p.gender === 'male');

  return (
    <div className="w-full px-3 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[rgb(var(--clr-primary)/0.08)] border border-[rgb(var(--clr-primary)/0.2)] flex items-center justify-center text-[rgb(var(--clr-primary))]">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">IVF Lab</h1>
              <p className="text-xs text-slate-500">Embryology suite, CASA semen analysis, cryobank coordinates &amp; QC monitors</p>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-1">CASA diagnostics, Day 0–7 embryology matrix with dual-witnessing gates & cryobank coordinates</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto shadow-inner">
          {[
            { id: 'embryology', label: 'Embryology Suite', icon: FlaskConical },
            { id: 'andrology', label: 'Andrology & CASA', icon: Microscope },
            { id: 'cryopreservation', label: 'Cryobank LN2 Storage', icon: Snowflake },
            { id: 'qc', label: 'Lab QC & Calibration', icon: AlertCircle },
          ].map(t => {
            const TabIcon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                  activeTab === t.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* === TAB 1: ANDROLOGY === */}
      {activeTab === 'andrology' && (
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
                      ? 'bg-white text-[rgb(var(--clr-primary))] shadow-2xs font-bold'
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
                      ? 'bg-white text-[rgb(var(--clr-primary))] shadow-2xs font-bold'
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
              {malePatients
                .filter((p) => {
                  if (andrologyQueueFilter === 'active_cycles') {
                    return cycles.some((c: any) => c.partner_id === p.id || c.patient_id === p.id);
                  }
                  return true;
                })
                .filter((p) => !patientSearchQuery || p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) || p.vid.toLowerCase().includes(patientSearchQuery.toLowerCase()))
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedMalePatient(p)}
                    className={`w-full flex flex-col gap-1 p-3.5 rounded-lg border text-left transition-all ${
                      selectedMalePatient?.id === p.id
                        ? 'border-[rgb(var(--clr-primary))] bg-[rgb(var(--clr-primary)/0.05)] text-slate-900 shadow-sm'
                        : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-sm leading-tight">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{p.vid}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{p.age} yrs</span>
                    </div>
                  </button>
                ))}
              {malePatients.filter((p) => {
                if (andrologyQueueFilter === 'active_cycles') {
                  return cycles.some((c: any) => c.partner_id === p.id || c.patient_id === p.id);
                }
                return true;
              }).length === 0 && (
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
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      CASA Semen Analysis (WHO 6th Ed)
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">Diagnostic Report: {selectedMalePatient.name}</h2>
                    <p className="text-xs text-slate-500">VID: {selectedMalePatient.vid} · Phone: {selectedMalePatient.phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1 inline" /> Print Report
                  </button>
                </div>

                <AndrologyDataEntry patientId={selectedMalePatient.id} patientName={selectedMalePatient.name} />

                <div className="flex items-center gap-2.5 flex-wrap pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSpermPrepModal(true)}
                    className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-md transition-colors border border-emerald-200 shadow-2xs flex items-center gap-1.5"
                  >
                    <FlaskConical className="w-4 h-4 text-emerald-600" />
                    <span>Semen Wash &amp; IUI Prep</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSpermFreezingModal(true)}
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs rounded-md transition-colors border border-blue-200 shadow-2xs flex items-center gap-1.5"
                  >
                    <Snowflake className="w-4 h-4 text-blue-600" />
                    <span>Semen Freezing Record</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSurgicalModal(true)}
                    className="px-4 py-2.5 bg-[rgb(var(--clr-primary)/0.08)] hover:bg-[rgb(var(--clr-primary)/0.12)] text-[rgb(var(--clr-primary))] font-semibold text-xs rounded-md transition-colors border border-[rgb(var(--clr-primary)/0.2)] shadow-2xs flex items-center gap-1.5"
                  >
                    <Scissors className="w-4 h-4 text-[rgb(var(--clr-primary))]" />
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
      )}

      {/* === TAB 2: EMBRYOLOGY === */}
      {activeTab === 'embryology' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Active Cycle Selector */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active ART Cycles</h3>
            <div className="space-y-2">
              {cycles.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCycle(c)}
                  className={`w-full flex flex-col gap-1 p-3.5 rounded-lg border text-left transition-all ${
                    activeCycle?.id === c.id
                      ? 'border-[rgb(var(--clr-primary))] bg-[rgb(var(--clr-primary)/0.05)] text-slate-900 shadow-sm'
                      : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-[rgb(var(--clr-primary))]">{c.cycle_id}</span>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{c.status}</span>
                  </div>
                  <p className="font-bold text-sm leading-tight text-slate-900">{c.patient_name || 'Patient'}</p>
                  <p className="text-[11px] text-slate-400">{c.treatment_type} (Attempt #{c.attempt_number})</p>
                </button>
              ))}
            </div>
          </div>

          {/* Day 0-7 Matrix & Dual-Witness Gate */}
          <div className="lg:col-span-3 space-y-6">
            {activeCycle ? (
              <>
                <CoupleHeaderBanner
                  femalePatient={
                    patients.find((p) => p.id === activeCycle?.patient_id) || {
                      id: activeCycle.patient_id,
                      name: activeCycle.patient_name || 'Female Patient',
                      vid: activeCycle.patient_vid,
                      age: activeCycle.patient_age,
                      phone: activeCycle.patient_phone,
                      blood_group: activeCycle.patient_blood_group,
                      clinical_notes: activeCycle.patient_clinical_notes,
                    }
                  }
                  malePatient={
                    patients.find((p) => p.id === activeCycle?.partner_id) ||
                    (activeCycle?.partner_name
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
                  }
                  treatmentCycle={activeCycle}
                  onNotesUpdated={() => loadInitialData(true)}
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
                      onClick={() => setShowOpuModal(true)}
                      className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs rounded-md transition-colors border border-pink-200 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                      <span>OPU Aspiration Report</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowMasterEmbryologyModal(true)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-md transition-colors border border-indigo-200 flex items-center gap-1.5"
                    >
                      <Dna className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Master Embryology Form</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowEtDischargeModal(true)}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-md transition-colors border border-purple-200 flex items-center gap-1.5"
                    >
                      <Baby className="w-4 h-4 text-purple-600" />
                      <span>ET Discharge Protocol</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDonorEtModal(true)}
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
      )}

      {/* === TAB 3: CRYOBANK === */}
      {activeTab === 'cryopreservation' && (
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
                { id: 'DUE_60', label: 'Due in 60 Days', count: cryoCounts.due60, color: 'text-[rgb(var(--clr-primary))]' },
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
              onClick={() => setShowVitrifyModal(true)}
              className="px-4 py-2 bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white rounded-md text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
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
                    <td className="p-3.5 font-mono font-bold text-[rgb(var(--clr-primary))]">{sample.straw_number}</td>
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        sample.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {sample.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {sample.status === 'Available' && (
                        <button
                          onClick={() => {
                            setSelectedThawSample(sample);
                            setShowThawModal(true);
                          }}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[10px] uppercase transition-colors"
                        >
                          <Flame className="w-3.5 h-3.5 mr-1 inline text-amber-600" /> Warm/Thaw
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === TAB 4: QC === */}
      {activeTab === 'qc' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b pb-3">Daily Gas & Temperature QC</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">CO₂ Level (%)</label>
                <input type="number" step="0.1" value={newQc.co2} onChange={(e) => setNewQc({ ...newQc, co2: parseFloat(e.target.value) || 0 })} className="vmd-input text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">O₂ Level (%)</label>
                <input type="number" step="0.1" value={newQc.o2} onChange={(e) => setNewQc({ ...newQc, o2: parseFloat(e.target.value) || 0 })} className="vmd-input text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Incubator Temp (°C)</label>
                <input type="number" step="0.1" value={newQc.temp} onChange={(e) => setNewQc({ ...newQc, temp: parseFloat(e.target.value) || 0 })} className="vmd-input text-xs" />
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await qcApi.createLog({
                      co2: newQc.co2,
                      o2: newQc.o2,
                      ph: newQc.ph,
                      temp: newQc.temp,
                      autodialer_test: newQc.autodialer_test,
                      checked_by: user?.name || 'Dr. Rahul Nair',
                      date: new Date().toISOString().split('T')[0],
                    });
                    if (res?.entry) {
                      setQcLogs((prev) => [res.entry, ...prev]);
                    }
                    alert('Daily Gas & Environmental QC reading logged to audit trail & persisted to database!');
                  } catch (err: any) {
                    alert(err.message || 'Failed to persist QC metric');
                  }
                }}
                className="w-full py-2.5 bg-[rgb(var(--clr-primary))] text-white font-bold text-xs rounded-md hover:bg-[rgb(var(--clr-primary)/0.9)] transition-colors shadow-sm"
              >
                Log Daily QC Metric
              </button>

            </div>
          </div>

          <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Recent Gas & Sensor Logs</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">CO₂ %</th>
                  <th className="p-3">O₂ %</th>
                  <th className="p-3">Temp °C</th>
                  <th className="p-3">Alarm Test</th>
                  <th className="p-3">Checked By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {qcLogs.map((q) => (
                  <tr key={q.id}>
                    <td className="p-3 font-bold">{q.date}</td>
                    <td className="p-3 text-[rgb(var(--clr-primary))] font-bold">{q.co2}%</td>
                    <td className="p-3 text-emerald-700 font-bold">{q.o2}%</td>
                    <td className="p-3">{q.temp}°C</td>
                    <td className="p-3"><span className="text-emerald-700 font-bold">Pass</span></td>
                    <td className="p-3">{q.checked_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dual-Witnessing Signoff Modal */}
      {showWitnessModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Mandatory Dual-Witnessing Signoff</h3>
              <button onClick={() => setShowWitnessModal(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"><X className="w-4 h-4" /></button>
            </div>

            {witnessError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs font-bold text-rose-800">
                {witnessError}
              </div>
            )}

            <form onSubmit={handleSignOffWitness} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Culture Day to Sign Off</label>
                <select
                  value={witnessDay}
                  onChange={(e) => setWitnessDay(parseInt(e.target.value) || 0)}
                  className="vmd-input text-xs"
                >
                  <option value={0}>Day 0 — OPU & Insemination Check</option>
                  <option value={1}>Day 1 — 2PN Fertilization Check</option>
                  <option value={2}>Day 2 — Early Cleavage Check</option>
                  <option value={3}>Day 3 — Cleavage Assessment</option>
                  <option value={5}>Day 5 — Blastocyst Gardner Grading</option>
                  <option value={6}>Day 6 — Extended Culture</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Primary Embryologist (Checked By)</label>
                <select
                  value={checkedById}
                  onChange={(e) => setCheckedById(e.target.value)}
                  className="vmd-input text-xs"
                >
                  {staffUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Secondary Witness (Witnessed By)</label>
                <select
                  value={witnessedById}
                  onChange={(e) => setWitnessedById(e.target.value)}
                  className="vmd-input text-xs font-bold text-slate-900"
                >
                  {staffUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Audit Notes</label>
                <input
                  type="text"
                  value={witnessNotes}
                  onChange={(e) => setWitnessNotes(e.target.value)}
                  placeholder="e.g. Identity and embryo dishes double checked."
                  className="vmd-input text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 bg-[rgb(var(--clr-primary))] text-white font-bold text-xs rounded-md hover:bg-[rgb(var(--clr-primary)/0.9)] shadow-md">
                  Sign Off Dual-Witnessing
                </button>
                <button type="button" onClick={() => setShowWitnessModal(false)} className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-md">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vitrify Straw Modal */}
      {showVitrifyModal && (
        <CryoVitrifyModal
          patients={patients}
          activeCycle={activeCycle}
          onClose={() => setShowVitrifyModal(false)}
          onSaved={() => cryoApi.listSamples().then((res: any) => setCryoSamples(Array.isArray(res) ? res : []))}
        />
      )}

      {/* Thaw Modal */}
      {showThawModal && selectedThawSample && (
        <CryoThawModal
          selectedThawSample={selectedThawSample}
          staffUsers={staffUsers}
          onClose={() => setShowThawModal(false)}
          onSaved={() => cryoApi.listSamples().then((res: any) => setCryoSamples(Array.isArray(res) ? res : []))}
        />
      )}

      {/* Modal: Surgical Sperm Retrieval (TESA/PESA) */}
      {showSurgicalModal && (
        <SurgicalSpermRetrievalModal
          patient={selectedMalePatient || patients.find((p) => p.gender === 'male') || { id: user?.id, name: 'Male Partner' }}
          activeCycle={activeCycle}
          onClose={() => setShowSurgicalModal(false)}
          onSaved={() => {
            loadInitialData(true);
          }}
        />
      )}

      {/* Modal: Embryo Transfer Discharge Protocol */}
      {showEtDischargeModal && activeCycle && (
        <EmbryoTransferDischargeModal
          cycle={activeCycle}
          patient={
            patients.find((p) => p.id === activeCycle.patient_id) || {
              id: activeCycle.patient_id,
              name: activeCycle.patient_name || 'Female Patient',
              vid: activeCycle.patient_vid,
              age: activeCycle.patient_age,
            }
          }
          partner={
            patients.find((p) => p.id === activeCycle.partner_id) || {
              id: activeCycle.partner_id,
              name: activeCycle.partner_name,
            }
          }
          onClose={() => setShowEtDischargeModal(false)}
          onSaved={() => {
            loadInitialData(true);
          }}
        />
      )}

      {/* Modal: Sperm Preparation & Semen Wash */}
      {showSpermPrepModal && (
        <SpermPreparationModal
          patient={selectedMalePatient || patients.find((p) => p.gender === 'male') || { id: user?.id, name: 'Male Partner' }}
          activeCycle={activeCycle}
          onClose={() => setShowSpermPrepModal(false)}
          onSaved={() => {
            loadInitialData(true);
          }}
        />
      )}

      {/* Modal: Semen Freezing & Cryo Storage Record */}
      {showSpermFreezingModal && (
        <SpermFreezingModal
          patient={selectedMalePatient || patients.find((p) => p.gender === 'male') || { id: user?.id, name: 'Male Partner' }}
          activeCycle={activeCycle}
          onClose={() => setShowSpermFreezingModal(false)}
          onSaved={() => {
            loadInitialData(true);
          }}
        />
      )}

      {/* Modal: OPU Aspiration Report */}
      {showOpuModal && activeCycle && (
        <OPUAspirationReportModal
          patient={
            patients.find((p) => p.id === activeCycle.patient_id) || {
              id: activeCycle.patient_id,
              name: activeCycle.patient_name || 'Female Patient',
              vid: activeCycle.patient_vid,
            }
          }
          activeCycle={activeCycle}
          onClose={() => setShowOpuModal(false)}
          onSaved={() => {
            loadInitialData(true);
          }}
        />
      )}

      {/* Modal: Master Embryology Record */}
      {showMasterEmbryologyModal && activeCycle && (
        <MasterEmbryologyRecordModal
          cycle={activeCycle}
          patient={
            patients.find((p) => p.id === activeCycle.patient_id) || {
              id: activeCycle.patient_id,
              name: activeCycle.patient_name || 'Female Patient',
              vid: activeCycle.patient_vid,
            }
          }
          partner={
            patients.find((p) => p.id === activeCycle.partner_id) || {
              id: activeCycle.partner_id,
              name: activeCycle.partner_name,
            }
          }
          onClose={() => setShowMasterEmbryologyModal(false)}
          onSaved={() => {
            loadInitialData(true);
          }}
        />
      )}

      {/* Modal: Donor Embryo Transfer */}
      {showDonorEtModal && activeCycle && (
        <DonorEmbryoTransferModal
          patient={
            patients.find((p) => p.id === activeCycle.patient_id) || {
              id: activeCycle.patient_id,
              name: activeCycle.patient_name || 'Female Patient',
              vid: activeCycle.patient_vid,
            }
          }
          activeCycle={activeCycle}
          onClose={() => setShowDonorEtModal(false)}
          onSaved={() => {
            loadInitialData(true);
          }}
        />
      )}
    </div>
  );
}
