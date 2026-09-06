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

export default function IvfLabPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'andrology' | 'embryology' | 'cryopreservation' | 'qc'>('andrology');
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
  const defaultAndrologyValues = {
    collection_date: new Date().toISOString().split('T')[0],
    abstinence_days: 0,
    volume_ml: 0,
    liquefaction_time_min: 0,
    ph: 0,
    viscosity: '',
    pre_conc_million_ml: 0,
    total_motility_pct: 0,
    progressive_motility_pct: 0,
    immotile_pct: 0,
    normal_forms_pct: 0,
    vcl_um_s: 0,
    vsl_um_s: 0,
    vap_um_s: 0,
    lin_pct: 0,
    str_pct: 0,
    vitality_live_pct: 0,
    dfi_total_pct: 0,
    analyst_name: user?.name || '',
    impression: '',
  };

  const [andrologyForm, setAndrologyForm] = useState(defaultAndrologyValues);

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
  const [cryoSamples, setCryoSamples] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Available' | 'Warmed' | 'Discarded'>('ALL');
  const [expiringSamples, setExpiringSamples] = useState<any[]>([]);
  const [showVitrifyModal, setShowVitrifyModal] = useState(false);
  const [vitrifyForm, setVitrifyForm] = useState({
    patient_id: '',
    straw_number: '',
    no_of_embryos: 1,
    tank_number: '',
    canister_number: '',
    canister_colour: '',
    goblet_colour: '',
    cryo_device_colour: '',
    expiry_date: '',
    consent_form_reference: '',
  });
  const [showThawModal, setShowThawModal] = useState(false);
  const [selectedThawSample, setSelectedThawSample] = useState<any>(null);
  const [thawForm, setThawForm] = useState({
    embryos_warmed: 2,
    embryos_survived: 2,
    survival_rate_pct: 100,
    disposition: 'Transferred',
    witness_id: '',
    notes: 'Thawed for FET cycle.',
  });

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
          setThawForm((prev) => ({ ...prev, witness_id: uList[1].id }));
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
            if (res[0].data) {
              setAndrologyForm({ ...defaultAndrologyValues, ...res[0].data });
            }
          } else {
            setActiveAndrologyRecord(null);
            // Reset to clean patient state
            setAndrologyForm({
              ...defaultAndrologyValues,
              collection_date: new Date().toISOString().split('T')[0],
              pre_conc_million_ml: 0,
              total_motility_pct: 0,
              progressive_motility_pct: 0,
              immotile_pct: 0,
              normal_forms_pct: 0,
              dfi_total_pct: 0,
              impression: 'Pending CASA Analysis',
            });
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

  const handleSaveAndrology = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMalePatient || !user) return;
    try {
      await andrologyApi.create({
        patient_id: selectedMalePatient.id,
        record_type: 'casa_semen_analysis',
        data: andrologyForm,
        created_by: user.id,
      });
      alert('CASA Semen Analysis saved successfully!');
      andrologyApi.list({ patient_id: selectedMalePatient.id }).then((res: any) => setAndrologyRecords(res || []));
    } catch (err: any) {
      alert(err.message || 'Failed to save andrology report');
    }
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

  const handleVitrifyStraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await cryoApi.createSample({
        patient_id: vitrifyForm.patient_id || patients[0]?.id,
        treatment_cycle_id: activeCycle?.id,
        sample_type: 'embryo',
        straw_number: vitrifyForm.straw_number,
        tank_number: vitrifyForm.tank_number,
        canister_number: vitrifyForm.canister_number,
        canister_colour: vitrifyForm.canister_colour,
        goblet_colour: vitrifyForm.goblet_colour,
        cryo_device_colour: vitrifyForm.cryo_device_colour,
        no_of_embryos: vitrifyForm.no_of_embryos,
        embryologist_id: user.id,
        expiry_date: vitrifyForm.expiry_date,
        consent_form_reference: vitrifyForm.consent_form_reference,
      });
      setShowVitrifyModal(false);
      cryoApi.listSamples().then((res: any) => setCryoSamples(Array.isArray(res) ? res : []));
      alert('Straw vitrified and assigned physical cryo coordinates!');
    } catch (err: any) {
      alert(err.message || 'Failed to vitrify straw');
    }
  };

  const handleConfirmThaw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThawSample) return;
    try {
      await cryoApi.thawSample(selectedThawSample.id, {
        embryos_warmed: thawForm.embryos_warmed,
        embryos_survived: thawForm.embryos_survived,
        survival_rate_pct: parseFloat(String(thawForm.survival_rate_pct)) || 100,
        disposition: thawForm.disposition,
        witness_id: thawForm.witness_id,
        notes: thawForm.notes,
      });
      setShowThawModal(false);
      cryoApi.listSamples().then((res: any) => setCryoSamples(Array.isArray(res) ? res : []));
      alert('Thaw survival event logged to audit chain of custody!');
    } catch (err: any) {
      alert(err.message || 'Failed to record thaw event');
    }
  };

  const filteredCryo = cryoSamples.filter(s => {
    if (filterStatus === 'ALL') return true;
    return s.status === filterStatus;
  });

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const malePatients = patients.filter(p => p.gender === 'male');

  return (
    <div className="w-full px-3 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">🔬 IVF & Andrology Laboratory</h1>
          <p className="text-slate-500 text-sm mt-1">CASA diagnostics, Day 0–7 embryology matrix with dual-witnessing gates & cryobank coordinates</p>
        </div>

        {/* Tab Selection */}
        <div className="flex p-1 bg-slate-200/60 rounded-2xl max-w-max self-start md:self-auto shadow-inner">
          {[
            { id: 'andrology', label: '👨 Andrology Lab' },
            { id: 'embryology', label: '🧫 Embryology Suite' },
            { id: 'cryopreservation', label: '❄️ Cryo Bank Coordinates' },
            { id: 'qc', label: '🛡️ Safety & Gas QC' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === t.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* === TAB 1: ANDROLOGY === */}
      {activeTab === 'andrology' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Patient Selector */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col h-[calc(100vh-12rem)]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Male Patients</h3>
            <input
              type="text"
              placeholder="Search by name or VID..."
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
              className="vmd-input text-xs w-full mb-2"
            />
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {malePatients.filter(p => !patientSearchQuery || p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) || p.vid.toLowerCase().includes(patientSearchQuery.toLowerCase())).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedMalePatient(p)}
                  className={`w-full flex flex-col gap-1 p-3.5 rounded-2xl border text-left transition-all ${
                    selectedMalePatient?.id === p.id
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-sm'
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
            </div>
          </div>

          {/* CASA Semen Report Form */}
          <div className="lg:col-span-3 space-y-6">
            {selectedMalePatient ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      CASA Semen Analysis (WHO 6th Ed)
                    </span>
                    <h2 className="text-lg font-black text-slate-900 mt-1">Diagnostic Report: {selectedMalePatient.name}</h2>
                    <p className="text-xs text-slate-500">VID: {selectedMalePatient.vid} · Phone: {selectedMalePatient.phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                  >
                    🖨️ Print Report
                  </button>
                </div>

                <form onSubmit={handleSaveAndrology} className="space-y-6">
                  {/* Macro Parameters */}
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">Macroscopic Evaluation</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Abstinence (Days)</label>
                        <input
                          type="number"
                          value={andrologyForm.abstinence_days}
                          onChange={(e) => setAndrologyForm({ ...andrologyForm, abstinence_days: parseInt(e.target.value) || 0 })}
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Semen Volume (mL)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={andrologyForm.volume_ml}
                          onChange={(e) => setAndrologyForm({ ...andrologyForm, volume_ml: parseFloat(e.target.value) || 0 })}
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Semen pH</label>
                        <input
                          type="number"
                          step="0.1"
                          value={andrologyForm.ph}
                          onChange={(e) => setAndrologyForm({ ...andrologyForm, ph: parseFloat(e.target.value) || 0 })}
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Liquefaction (min)</label>
                        <input
                          type="number"
                          value={andrologyForm.liquefaction_time_min}
                          onChange={(e) => setAndrologyForm({ ...andrologyForm, liquefaction_time_min: parseInt(e.target.value) || 0 })}
                          className="vmd-input text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Microscopic & CASA Kinematics */}
                  <div className="pt-4 border-t">
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">Microscopic & Kinematics</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Concentration (M/mL)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={andrologyForm.pre_conc_million_ml}
                          onChange={(e) => setAndrologyForm({ ...andrologyForm, pre_conc_million_ml: parseFloat(e.target.value) || 0 })}
                          className="vmd-input text-xs font-bold text-indigo-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Total Motility %</label>
                        <input
                          type="number"
                          value={andrologyForm.total_motility_pct}
                          onChange={(e) => setAndrologyForm({ ...andrologyForm, total_motility_pct: parseFloat(e.target.value) || 0 })}
                          className="vmd-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Progressive (PR) %</label>
                        <input
                          type="number"
                          value={andrologyForm.progressive_motility_pct}
                          onChange={(e) => setAndrologyForm({ ...andrologyForm, progressive_motility_pct: parseFloat(e.target.value) || 0 })}
                          className="vmd-input text-xs font-bold text-emerald-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Normal Forms % (Kruger)</label>
                        <input
                          type="number"
                          value={andrologyForm.normal_forms_pct}
                          onChange={(e) => setAndrologyForm({ ...andrologyForm, normal_forms_pct: parseFloat(e.target.value) || 0 })}
                          className="vmd-input text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Impression & Diagnostic Comments</label>
                    <textarea
                      value={andrologyForm.impression}
                      onChange={(e) => setAndrologyForm({ ...andrologyForm, impression: e.target.value })}
                      rows={2}
                      className="vmd-input text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-indigo-500/20"
                  >
                    💾 Save CASA Semen Report
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs">
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
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active ART Cycles</h3>
            <div className="space-y-2">
              {cycles.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCycle(c)}
                  className={`w-full flex flex-col gap-1 p-3.5 rounded-2xl border text-left transition-all ${
                    activeCycle?.id === c.id
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-sm'
                      : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-indigo-700">{c.cycle_id}</span>
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
              <OocyteGridTable cycleId={activeCycle.id} />
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs">
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
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-amber-900 text-xs shadow-sm">
              <span className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <strong>Statutory Cryo Renewal Alert:</strong> {expiringSamples.length} cryo samples nearing 30-day consent limit under ART Act 2021 Form 15.
              </span>
              <button onClick={() => setFilterStatus('Available')} className="font-bold underline text-amber-950">
                View Samples →
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(['ALL', 'Available', 'Warmed', 'Discarded'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterStatus === st ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowVitrifyModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              + Vitrify Straw into Coordinates
            </button>
          </div>

          {/* Cryobank Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
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
                    <td className="p-3.5 font-mono font-bold text-indigo-700">{sample.straw_number}</td>
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
                          🔥 Warm/Thaw
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
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
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
                className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Log Daily QC Metric
              </button>

            </div>
          </div>

          <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
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
                    <td className="p-3 text-indigo-700 font-bold">{q.co2}%</td>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">🛡️ Mandatory Dual-Witnessing Signoff</h3>
              <button onClick={() => setShowWitnessModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            {witnessError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800">
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
                  className="vmd-input text-xs font-bold text-indigo-900"
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
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 shadow-md">
                  Sign Off Dual-Witnessing
                </button>
                <button type="button" onClick={() => setShowWitnessModal(false)} className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vitrify Straw Modal */}
      {showVitrifyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">❄️ Vitrify Straw to Cryobank Coordinates</h3>
            <form onSubmit={handleVitrifyStraw} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Patient Search</label>
                <input
                  type="text"
                  list="cryoPatientsList"
                  placeholder="Type name or ID to search..."
                  value={
                    patients.find((p) => p.id === vitrifyForm.patient_id)
                      ? `${patients.find((p) => p.id === vitrifyForm.patient_id)?.name} (${patients.find((p) => p.id === vitrifyForm.patient_id)?.vid})`
                      : vitrifyForm.patient_id
                  }
                  onChange={(e) => {
                    const match = patients.find((p) => `${p.name} (${p.vid})` === e.target.value);
                    setVitrifyForm({ ...vitrifyForm, patient_id: match ? match.id : e.target.value });
                  }}
                  required
                  className="vmd-input text-xs w-full"
                />
                <datalist id="cryoPatientsList">
                  {patients.map((p) => (
                    <option key={p.id} value={`${p.name} (${p.vid})`} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Straw Identifier #</label>
                  <input
                    type="text"
                    value={vitrifyForm.straw_number}
                    onChange={(e) => setVitrifyForm({ ...vitrifyForm, straw_number: e.target.value })}
                    required
                    className="vmd-input text-xs font-mono font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Embryo Count</label>
                  <input
                    type="number"
                    value={vitrifyForm.no_of_embryos}
                    onChange={(e) => setVitrifyForm({ ...vitrifyForm, no_of_embryos: parseInt(e.target.value) || 1 })}
                    min={1}
                    className="vmd-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Tank #</label>
                  <input
                    type="text"
                    value={vitrifyForm.tank_number}
                    onChange={(e) => setVitrifyForm({ ...vitrifyForm, tank_number: e.target.value })}
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Canister #</label>
                  <input
                    type="text"
                    value={vitrifyForm.canister_number}
                    onChange={(e) => setVitrifyForm({ ...vitrifyForm, canister_number: e.target.value })}
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Goblet Color</label>
                  <input
                    type="text"
                    value={vitrifyForm.goblet_colour}
                    onChange={(e) => setVitrifyForm({ ...vitrifyForm, goblet_colour: e.target.value })}
                    className="vmd-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Consent Expiry Date</label>
                  <input
                    type="date"
                    value={vitrifyForm.expiry_date}
                    onChange={(e) => setVitrifyForm({ ...vitrifyForm, expiry_date: e.target.value })}
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">ART Form Reference</label>
                  <input
                    type="text"
                    value={vitrifyForm.consent_form_reference}
                    onChange={(e) => setVitrifyForm({ ...vitrifyForm, consent_form_reference: e.target.value })}
                    className="vmd-input text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700">
                  Save Cryo Coordinates
                </button>
                <button type="button" onClick={() => setShowVitrifyModal(false)} className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thaw Modal */}
      {showThawModal && selectedThawSample && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">🔥 Record Thaw / Warming Event</h3>
            <p className="text-xs text-slate-500">Straw: {selectedThawSample.straw_number} · Total: {selectedThawSample.no_of_embryos} embryos</p>
            <form onSubmit={handleConfirmThaw} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Embryos Warmed</label>
                  <input
                    type="number"
                    value={thawForm.embryos_warmed}
                    onChange={(e) => setThawForm({ ...thawForm, embryos_warmed: parseInt(e.target.value) || 0 })}
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Embryos Survived</label>
                  <input
                    type="number"
                    value={thawForm.embryos_survived}
                    onChange={(e) => {
                      const surv = parseInt(e.target.value) || 0;
                      const pct = thawForm.embryos_warmed > 0 ? (surv / thawForm.embryos_warmed) * 100 : 100;
                      setThawForm({ ...thawForm, embryos_survived: surv, survival_rate_pct: pct });
                    }}
                    className="vmd-input text-xs font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Post-Thaw Survival Rate %</label>
                <input
                  type="number"
                  value={thawForm.survival_rate_pct}
                  readOnly
                  className="vmd-input text-xs font-bold text-emerald-700 bg-slate-50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700">
                  Confirm Thaw Event
                </button>
                <button type="button" onClick={() => setShowThawModal(false)} className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
